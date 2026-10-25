import { test, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer, request, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { serve } from '../src/index.ts';
import { DataApi } from '../src/dataapi.ts';
import { ODataEndpoint } from '../src/odata.ts';
import { BATCH_LIMIT } from '../src/odata-batch.ts';
import type { Host } from '../src/host.ts';
import type { Store } from '../../store/src/index.ts';

// The gate that keeps a $batch change set's uncommitted rows from being read or interleaved, and the bounds that
// keep a change set (which gives no other client a turn) from holding the server.
const fixture = join(import.meta.dirname, '..', '..', '..', 'fixtures', 'fmp12', 'Charts.fmp12');
const skip = existsSync(fixture) ? false : 'fixtures missing: run npm run fixtures';
let dir: string;
let hosted: Awaited<ReturnType<typeof serve>>;
let front: Server;
let root: string;
let host: Host;
let store: Store;
let odata: ODataEndpoint;
let received = 0;
const basic = (who: string) => ({ authorization: 'Basic ' + btoa(`${who}:pw`) });
const limits = { ...BATCH_LIMIT };

interface Inside {
  enter(store: Store): Promise<() => void>;
  hold(store: Store): Promise<() => void>;
}
const inside = () => odata as unknown as Inside;

before(async () => {
  if (skip) return;
  dir = mkdtempSync(join(tmpdir(), 'tabularius-odata-gate-'));
  copyFileSync(fixture, join(dir, 'Charts.fmp12'));
  hosted = await serve({ dir, port: 0, watch: false, log: () => {} });
  host = hosted.host;
  store = host.get('Charts')!;
  const full = store.privilegeSets().find((p) => p.id === 1)!;
  store.savePrivilegeSet({ ...full, extendedPrivileges: [...full.extendedPrivileges, 'fmodata'] });
  store.setPassword('Ann', 'pw', full.name);
  // The endpoint under test is this one, in front of the same files, so a test can take its gate directly.
  odata = new ODataEndpoint(host, new DataApi(host));
  front = createServer((req, res) => {
    received++;
    odata.handle(req, res, new URL(req.url ?? '/', 'http://localhost')).then((done) => { if (!done) res.writeHead(404).end(); }, () => res.destroy());
  });
  await new Promise<void>((r) => front.listen(0, '127.0.0.1', r));
  root = `http://127.0.0.1:${(front.address() as AddressInfo).port}/fmi/odata/v4/Charts`;
});
afterEach(() => { Object.assign(BATCH_LIMIT, limits); });
after(async () => {
  front?.closeAllConnections();
  await new Promise<void>((r) => (front ? front.close(() => r()) : r()));
  hosted?.server.closeAllConnections?.();
  await new Promise<void>((r) => (hosted ? hosted.server.close(() => r()) : r()));
  if (dir) rmSync(dir, { recursive: true, force: true });
});

const count = () => store.findIds('Congress').length;
const tick = () => new Promise<void>((r) => setImmediate(r));
const pending = async (p: Promise<unknown>) => {
  let settled = false;
  p.then(() => { settled = true; }, () => { settled = true; });
  for (let i = 0; i < 5; i++) await tick();
  return !settled;
};

function multipart(set: string[]): string {
  const part = (req: string, id: number) => `Content-Type: application/http\r\nContent-ID: ${id}\r\n\r\n${req}\r\n`;
  return `--b\r\nContent-Type: multipart/mixed; boundary=c\r\n\r\n${set.map((r, i) => `--c\r\n${part(r, i + 1)}`).join('')}--c--\r\n--b--\r\n`;
}
const post = (name: string) => `POST Congress HTTP/1.1\r\nContent-Type: application/json\r\n\r\n${JSON.stringify({ Name: name })}`;
const get = (path: string) => `GET ${path} HTTP/1.1\r\n`;

async function batch(set: string[], who: Record<string, string> = basic('Ann')) {
  const res = await fetch(`${root}/$batch`, { method: 'POST', headers: { ...who, 'content-type': 'multipart/mixed; boundary=b' }, body: multipart(set) });
  const text = await res.text();
  return { status: res.status, text, answers: [...text.matchAll(/HTTP\/1\.1 (\d+)[^\r\n]*\r\n[\s\S]*?\r\n\r\n([\s\S]*?)\r\n--/g)].map((m) => ({ status: Number(m[1]), message: /"message":"([^"]*)"/.exec(m[2])?.[1] })) };
}
async function jsonBatch(requests: Record<string, unknown>[]) {
  const res = await fetch(`${root}/$batch`, { method: 'POST', headers: { ...basic('Ann'), 'content-type': 'application/json' }, body: JSON.stringify({ requests }) });
  return (await res.json() as { responses: { id: string; status: number; body?: { error?: { message: string } } }[] }).responses;
}
const answer = async (r: Response) => ({ status: r.status, message: /"message":"([^"]*)"/.exec(await r.text())?.[1] });

test('a change set holds only changes: a read in it fails the set and nothing is kept', { skip }, async () => {
  const before = count();
  for (const read of [get('Congress?$top=1'), 'HEAD Congress(1) HTTP/1.1\r\n', get('Congress/$count'), get('$crossjoin(Congress,Congress)')]) {
    const r = await batch([post('Never Kept'), read]);
    assert.deepEqual(r.answers.map((a) => a.status), [400], read);
    // A HEAD answer has no body.
    if (!read.startsWith('HEAD')) assert.match(r.answers[0].message!, /only changes/);
    assert.equal(count(), before);
  }
  const responses = await jsonBatch([
    { id: 'a', method: 'POST', url: 'Congress', atomicityGroup: 'g', body: { Name: 'Never Kept' } },
    { id: 'b', method: 'GET', url: 'Congress?$top=1', atomicityGroup: 'g' },
  ]);
  assert.deepEqual(responses.map((x) => [x.id, x.status]), [['a', 424], ['b', 400]]);
  assert.match(responses[1].body!.error!.message, /only changes/);
  assert.equal(count(), before);
  // Reads stay fine outside a change set, in the same $batch.
  const mixed = await fetch(`${root}/$batch`, { method: 'POST', headers: { ...basic('Ann'), 'content-type': 'multipart/mixed; boundary=b' }, body: `--b\r\nContent-Type: application/http\r\n\r\n${get('Congress/$count')}\r\n--b--\r\n` });
  assert.match(await mixed.text(), /HTTP\/1\.1 200/);
});

test('a change set does not call a script (a script gives the event loop away as it runs): the set fails and nothing is kept', { skip }, async () => {
  const before = count();
  const r = await batch([post('Never Kept'), 'POST Script.Anything HTTP/1.1\r\nContent-Type: application/json\r\n\r\n{}']);
  assert.deepEqual(r.answers.map((a) => a.status), [400]);
  assert.match(r.answers[0].message!, /can't call a script/);
  assert.equal(count(), before);
});

test('a change set that is refused for what it holds never waits for running requests, and never makes anyone else wait', { skip }, async () => {
  BATCH_LIMIT.changeSetWaitMs = 1500;
  BATCH_LIMIT.changeSetRequests = 3;
  const before = count();
  const token = store.createApiToken('Ann', { readOnly: true });
  // A request that is still running (a script in a Pause, say): a change set that starts would wait for it.
  const running = await inside().enter(store);
  try {
    const refused: [string, Promise<{ answers: { status: number }[] }>][] = [
      ['a read', batch([post('Never'), get('Congress?$top=1')])],
      ['a head', batch([post('Never'), 'HEAD Congress(1) HTTP/1.1\r\n'])],
      ['a script call', batch([post('Never'), 'POST Script.Anything HTTP/1.1\r\nContent-Type: application/json\r\n\r\n{}'])],
      ['too many requests', batch([1, 2, 3, 4].map((i) => post(`Never ${i}`)))],
      ['a read-only token', batch([post('Never')], { authorization: `Bearer ${token}` })],
    ];
    const started = performance.now();
    // Another request on the file is served at once, not queued behind a change set that is only waiting for the running one.
    const other = fetch(`${root}/Congress/$count`, { headers: basic('Ann') });
    for (const [what, p] of refused) {
      const r = await p;
      assert.ok(r.answers.length === 1 && r.answers[0].status >= 400 && r.answers[0].status !== 503, `${what}: answered ${JSON.stringify(r.answers)}`);
    }
    assert.equal((await other).status, 200);
    assert.ok(performance.now() - started < 1000, 'none of them waited for the running request');
  } finally { running(); }
  assert.equal(count(), before);
});

test('a change set holds at most BATCH_LIMIT.changeSetRequests requests: a longer one is not run at all, and each request of a JSON group says so', { skip }, async () => {
  const before = count();
  BATCH_LIMIT.changeSetRequests = 3;
  const long = await batch([1, 2, 3, 4].map((i) => post(`Cap ${i}`)));
  assert.deepEqual(long.answers.map((a) => a.status), [400]);
  assert.match(long.answers[0].message!, /at most 3 requests/);
  const group = await jsonBatch([1, 2, 3, 4].map((i) => ({ id: `r${i}`, method: 'POST', url: 'Congress', atomicityGroup: 'g', body: { Name: `Cap ${i}` } })));
  assert.deepEqual(group.map((x) => x.status), [400, 400, 400, 400], 'not 424 "another request failed": none ran');
  assert.equal(count(), before);
  const ok = await batch([1, 2, 3].map((i) => post(`Cap ${i}`)));
  assert.deepEqual(ok.answers.map((a) => a.status), [201, 201, 201]);
  assert.equal(count(), before + 3);
});

test('a change set that has run for BATCH_LIMIT.changeSetMs fails whole', { skip }, async () => {
  const before = count();
  BATCH_LIMIT.changeSetMs = 0;
  const r = await batch([post('Slow 1'), post('Slow 2'), post('Slow 3')]);
  assert.deepEqual(r.answers.map((a) => a.status), [400]);
  assert.match(r.answers[0].message!, /without finishing, so none of it was kept/);
  assert.equal(count(), before);
});

test('the gate: a change set waits for the requests running and for another change set, and what comes after waits for it', { skip }, async () => {
  const reader = await inside().enter(store);
  const setA = inside().hold(store);
  assert.ok(await pending(setA), 'a change set waits for a running request');
  const late = inside().enter(store);
  assert.ok(await pending(late), 'a request arriving behind the waiting change set waits too');
  const setB = inside().hold(store);
  assert.ok(await pending(setB));
  reader();
  const releaseA = await setA;
  assert.ok(await pending(late) && await pending(setB), 'while change set A holds the file, neither a request nor change set B goes in');
  releaseA();
  // One of them takes the file, the other goes after it, whichever way round: never both at once.
  const first = await Promise.race([late.then((leave) => ({ leave, hold: false })), setB.then((release) => ({ leave: release, hold: true }))]);
  if (first.hold) assert.ok(await pending(late), 'a request waits for change set B');
  else assert.ok(await pending(setB), 'change set B waits for the request');
  first.leave();
  const second = await (first.hold ? late : setB);
  second();
  // The file is free again.
  (await inside().hold(store))();
  (await inside().enter(store))();
});

test('a change set that fails on the file while another is held, and one that starts while a request is in the middle of its work, each come out whole', { skip }, async () => {
  const before = count();
  // A request that has given the event loop a turn (as a $crossjoin or an $apply does) and is still using the file.
  const reader = await inside().enter(store);
  const failing = batch([post('Fails'), 'PATCH $1 HTTP/1.1\r\nContent-Type: application/json\r\n\r\n{"Nope":1}']);
  const whole = batch([post('Whole A'), post('Whole B')]);
  await tick();
  assert.equal(count(), before, 'neither change set has started while the request is running');
  reader();
  const [a, b] = await Promise.all([failing, whole]);
  assert.deepEqual(a.answers.map((x) => x.status), [400]);
  assert.deepEqual(b.answers.map((x) => x.status), [201, 201]);
  assert.equal(count(), before + 2);
});

test('a request waits at most BATCH_LIMIT.changeSetWaitMs for a change set, and says that one is open', { skip }, async () => {
  BATCH_LIMIT.changeSetWaitMs = 80;
  const release = await inside().hold(store);
  const read = await fetch(`${root}/Congress/$count`, { headers: basic('Ann') });
  assert.equal(read.status, 503);
  assert.equal(read.headers.get('retry-after'), '1');
  assert.match((await answer(read)).message!, /change set is open on this file/);
  const second = await batch([post('Waits')]);
  assert.deepEqual(second.answers.map((a) => a.status), [503]);
  assert.match(second.answers[0].message!, /change set is open on this file/);
  release();
  assert.equal((await fetch(`${root}/Congress/$count`, { headers: basic('Ann') })).status, 200);
});

test('a change set waits at most BATCH_LIMIT.changeSetWaitMs for running requests, says so, and gives the file back', { skip }, async () => {
  BATCH_LIMIT.changeSetWaitMs = 80;
  const before = count();
  const leave = await inside().enter(store);
  const r = await batch([post('Never Starts')]);
  assert.deepEqual(r.answers.map((a) => a.status), [503]);
  assert.match(r.answers[0].message!, /Requests on this file are still running/);
  assert.doesNotMatch(r.answers[0].message!, /change set is open/);
  const group = await jsonBatch([{ id: 'a', method: 'POST', url: 'Congress', atomicityGroup: 'g', body: { Name: 'Never Starts' } }, { id: 'b', method: 'POST', url: 'Congress', atomicityGroup: 'g', body: { Name: 'Never Starts' } }]);
  assert.deepEqual(group.map((x) => x.status), [503, 503], 'neither ran, so neither is "another request failed"');
  assert.match(group[1].body!.error!.message, /Requests on this file are still running/);
  leave();
  assert.equal(count(), before);
  const ok = await batch([post('Starts')]);
  assert.deepEqual(ok.answers.map((a) => a.status), [201]);
});

test('a slow request body does not count as a request using the file', { skip }, async () => {
  BATCH_LIMIT.changeSetWaitMs = 1500;
  const before = count();
  const seen = received;
  const u = new URL(`${root}/Congress`);
  const slow = request({ host: u.hostname, port: u.port, path: u.pathname, method: 'POST', headers: { ...basic('Ann'), 'content-type': 'application/json', 'content-length': '19' } });
  const finished = new Promise<number>((resolve, reject) => { slow.on('response', (res) => { res.resume(); resolve(res.statusCode ?? 0); }); slow.on('error', reject); });
  slow.write('{"Name":');
  // The upload has to be at the endpoint, past its sign-in, before the change set is sent (nothing else shows that it is).
  while (received === seen) await tick();
  await new Promise<void>((r) => setTimeout(r, 200));
  // The set, and a read behind it, are answered while the upload is still arriving.
  const set = await batch([post('During A'), post('During B')]);
  assert.deepEqual(set.answers.map((a) => a.status), [201, 201]);
  assert.equal((await fetch(`${root}/Congress/$count`, { headers: basic('Ann') })).status, 200);
  slow.end('"Slow One"}');
  assert.equal(await finished, 201);
  assert.equal(count(), before + 3);
});

test('a slow container upload, once the account may send it, does not count as a request using the file either', { skip }, async () => {
  BATCH_LIMIT.changeSetWaitMs = 1500;
  store.applyDesign([{ op: 'createTable', name: 'Docs', fields: [{ name: 'Title', type: 'text' }, { name: 'File', type: 'container' }] }] as never);
  const id = Number(store.create('Docs', { Title: 'one' }).recordId);
  const before = count();
  const seen = received;
  const u = new URL(`${root}/Docs(${id})/File`);
  const slow = request({ host: u.hostname, port: u.port, path: u.pathname, method: 'PATCH', headers: { ...basic('Ann'), 'content-type': 'image/png', 'content-length': '10' } });
  const finished = new Promise<number>((resolve, reject) => { slow.on('response', (res) => { res.resume(); resolve(res.statusCode ?? 0); }); slow.on('error', reject); });
  slow.write('12345');
  while (received === seen) await tick();
  await new Promise<void>((r) => setTimeout(r, 200));
  const set = await batch([post('During Upload')]);
  assert.deepEqual(set.answers.map((a) => a.status), [201]);
  assert.equal((await fetch(`${root}/Congress/$count`, { headers: basic('Ann') })).status, 200);
  slow.end('67890');
  assert.equal(await finished, 204);
  assert.equal(count(), before + 1);
  assert.ok(store.containerId('Docs', id, 'File') !== undefined);
});

test('a request that waited for a change set and whose client has gone is not run', { skip }, async () => {
  const before = count();
  const release = await inside().hold(store);
  let waiting = 0;
  const real = inside().enter.bind(odata);
  (odata as unknown as Inside).enter = (s) => { waiting++; return real(s); };
  try {
    const u = new URL(`${root}/Congress`);
    const body = JSON.stringify({ Name: 'Abandoned' });
    const abandoned = request({ host: u.hostname, port: u.port, path: u.pathname, method: 'POST', headers: { ...basic('Ann'), 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) } });
    abandoned.on('error', () => {});
    abandoned.end(body);
    while (!waiting) await tick();
    abandoned.destroy();
    // The server has noticed the socket closing once a later turn of its loop has run.
    for (let i = 0; i < 20; i++) await tick();
    await new Promise<void>((r) => setTimeout(r, 30));
  } finally {
    (odata as unknown as Inside).enter = real;
  }
  release();
  // A request after it is answered only once the abandoned one has had its turn.
  assert.equal((await fetch(`${root}/Congress/$count`, { headers: basic('Ann') })).status, 200);
  assert.equal(count(), before);
});
