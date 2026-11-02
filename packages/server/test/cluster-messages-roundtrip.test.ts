// The checks on the cluster pipe (cluster-messages.ts) copy only the fields they know. A field added to one of the shapes that
// workers pass on, and not to the check, would be dropped between workers without any error. These tests build every note from the
// code that really makes it, send it through JSON as the pipe does, and require it to come out whole on both ends.
//
// The `satisfies` clauses make the compiler ask for this test to be updated whenever one of these shapes gains a field.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { ClusterTls, Note } from '../src/cluster.ts';
import { frontMessage, workerMessage } from '../src/cluster-messages.ts';
import type { RemoteSession } from '../src/dataapi.ts';
import { Metrics } from '../src/metrics.ts';
import { Profiler } from '../src/profiler.ts';
import { RequestGate } from '../src/request-gate.ts';
import { ScriptQueue } from '../src/server-queue.ts';
import type { Change } from '../../store/src/index.ts';

/** What a Node IPC pipe does to a message. */
const wire = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
/** Waits for a condition, not for a time. */
async function until(done: () => boolean, what: string): Promise<void> {
  for (let i = 0; i < 400 && !done(); i++) await new Promise((ok) => setTimeout(ok, 5));
  assert.ok(done(), what);
}
const WORKERS = 4;
const SENDER = 2;

/** Every field set, so a new one cannot be forgotten here. */
const change = {
  kind: 'update', file: 'Sales', table: 'Orders', recordId: 5, modId: 3, account: 'ann', owner: 'session-key', fields: ['Total', 'Status'], ids: [1, 2],
  deletedVisibility: [{ account: 'ann', rule: 'Owner = Get ( AccountName )' }],
} satisfies Required<Omit<Change, 'remote'>>;
const identity = { issuer: 'https://idp.example.com/', sub: 'user-1', person: 'Ann Lee', groups: ['staff', 'sales'], mapping: 'default' } satisfies Required<NonNullable<RemoteSession['externalIdentity']>>;
const sessions = [
  { id: 'abc123', token: 'x'.repeat(64), db: 'Sales', account: 'ann', idleSeconds: 12, since: '2026-11-01T10:00:00.000Z', client: 'web', from: '10.0.0.5', device: `Mozilla/5.0 ${'x'.repeat(200)}`,
    via: 'oidc', externalIdentity: identity, streams: 2 },
  { id: 'def456', token: 'y'.repeat(64), db: 'Sales', account: '', idleSeconds: 0, since: '2026-11-01T10:05:00.000Z', client: 'rest', streams: 0 },
] satisfies RemoteSession[];
const tls = { cert: '-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----\n', key: 'not a real key', auto: { domains: ['a.example.com', 'b.example.com'], expires: 1_800_000_000_000, problem: 'renewal failed' } } satisfies Required<ClusterTls>;

/** A profile with a script, steps and a find, made the way the server makes it. */
function profile() {
  const p = new Profiler();
  p.step('Sales', 'Nightly', 1, 'Set Variable [ $x ; 1 ]', 3.5, 0);
  p.step('Sales', 'Nightly', 2, 'Go to Layout [ "Orders" ]', 1.25, 102);
  p.run('Sales', 'Nightly', 5, 102, 2);
  p.find('Sales', { table: 'Orders', layout: 'Order list', fields: ['Status', 'Customer::Name'], sort: ['Total'], leadingWildcard: true, ms: 4, found: 3, total: 10 });
  p.find('Sales', { table: 'Orders', layout: 'Order list', fields: ['Status', 'Customer::Name'], sort: ['Total'], leadingWildcard: false, ms: 2, total: 10 });
  return p.snapshot();
}

/** Request counts with a gate and totals, from real requests to a real server. */
async function requests() {
  const metrics = new Metrics();
  metrics.requestGate = new RequestGate();
  const server = createServer((req, res) => { metrics.track(req, res, req.url ?? '/'); res.end('ok'); });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  try {
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    for (const path of ['/fmi/data/vLatest/databases/Sales/layouts', '/tabularius/health', '/admin/x', '/nowhere']) await (await fetch(base + path)).text();
    await until(() => metrics.snapshot().requests.length >= 3, 'the requests were counted');
    return metrics.snapshot();
  } finally {
    server.closeAllConnections();
    await new Promise((ok) => server.close(ok));
    metrics.stop();
  }
}

/** A queue with one script running, one waiting and one finished with an error. */
async function queue() {
  const q = new ScriptQueue(1);
  await q.run(async () => ({ error: 7 }), { file: 'Sales', script: 'Done', account: 'ann', kind: 'hook' });
  let release!: () => void;
  const running = q.run(() => new Promise<void>((ok) => { release = ok; }), { file: 'Sales', script: 'Nightly', account: 'ann', kind: 'schedule' });
  const waiting = q.run(async () => undefined, { file: 'Sales', script: 'Later', kind: 'automation' });
  await until(() => q.queued === 1 && q.running === 1, 'one script is running and one waiting');
  const list = q.list();
  release();
  await Promise.all([running, waiting]);
  return { list };
}

test('every kind of note comes through both checks whole, built from what really makes it', async () => {
  const { list } = await queue();
  assert.equal(list.running.length, 1, 'the queue has a script running');
  assert.equal(list.queued.length, 1, 'and one waiting');
  assert.equal(list.recent.length, 1, 'and one finished');
  const stats = { profile: profile(), requests: await requests() };
  assert.ok(stats.requests.gate && stats.requests.totals && stats.requests.durations.length, 'the request counts carry a gate, totals and durations');
  assert.ok(stats.profile.scripts[0].stepStats.length === 2 && stats.profile.finds.length === 1, 'the profile carries steps and a find');

  // One entry for each kind: a new kind of note makes this fail to compile until it is added.
  const notes = {
    change: { k: 'change', change },
    design: { k: 'design', file: 'Sales' },
    approve: { k: 'approve', file: 'Sales', id: 'approval-1' },
    sessions: { k: 'sessions', from: SENDER, list: sessions },
    message: { k: 'message', text: 'The server restarts in five minutes.', token: 'x'.repeat(64) },
    end: { k: 'end', id: 'abc123' },
    scripts: { k: 'scripts', from: SENDER, list },
    'cancel-script': { k: 'cancel-script', id: 'job-1', by: 'ann' },
    stats: { k: 'stats', from: SENDER, ...stats },
    'profile-reset': { k: 'profile-reset' },
    gone: { k: 'gone', from: SENDER },
    tls: { k: 'tls', tls },
    log: { k: 'log', from: SENDER, type: 'Warning', source: 'Sales', message: 'GET /x took 4 s' },
    'open-state': { k: 'open-state', from: SENDER, file: 'Sales', error: 'EPERM: operation not permitted' },
  } satisfies { [K in Note['k']]: Extract<Note, { k: K }> };

  for (const note of Object.values(notes) as Note[]) {
    const sent = wire(note);
    // From a worker (only the leader approves; the front alone sends gone and tls), then on from the front to every worker.
    const fromFront = note.k === 'gone' || note.k === 'tls';
    if (fromFront) {
      assert.ok('refused' in workerMessage({ t: 'tell', note: sent }, SENDER), `${note.k}: a worker may not send it`);
    } else {
      const heard = workerMessage({ t: 'tell', note: sent }, note.k === 'approve' ? 0 : SENDER);
      assert.ok('ok' in heard, `${note.k}: the front refused it: ${JSON.stringify(heard)}`);
      assert.deepEqual(heard.ok, { t: 'tell', note: sent }, `${note.k}: the front changed it`);
    }
    const relayed = frontMessage({ t: 'tell', note: sent }, WORKERS);
    assert.ok('ok' in relayed, `${note.k}: a worker refused it: ${JSON.stringify(relayed)}`);
    assert.deepEqual(relayed.ok, { t: 'tell', note: sent }, `${note.k}: the worker changed it`);
  }
});

test('the same notes with only their required fields come through whole too', async () => {
  const { list } = await queue();
  const bare: Note[] = [
    { k: 'change', change: { kind: 'truncate', file: 'Sales', table: 'Orders' } },
    { k: 'message', text: 'hello' },
    { k: 'sessions', from: SENDER, list: [{ id: 'a', token: 't', db: 'Sales', account: 'ann', idleSeconds: 0, since: '2026-11-01T10:00:00.000Z', client: 'rest', streams: 0 }] },
    { k: 'scripts', from: SENDER, list: { ...list, recent: [] } },
    { k: 'stats', from: SENDER, profile: { scripts: [], finds: [] }, requests: { requests: [], durations: [] } },
    { k: 'tls', tls: { cert: 'c', key: 'k' } },
    { k: 'open-state', from: SENDER, file: 'Sales' },
  ];
  for (const note of bare) {
    const sent = wire(note);
    const front = note.k === 'tls' ? undefined : workerMessage({ t: 'tell', note: sent }, SENDER);
    if (front) { assert.ok('ok' in front, `${note.k}: ${JSON.stringify(front)}`); assert.deepEqual(front.ok, { t: 'tell', note: sent }, note.k); }
    const worker = frontMessage({ t: 'tell', note: sent }, WORKERS);
    assert.ok('ok' in worker, `${note.k}: ${JSON.stringify(worker)}`);
    assert.deepEqual(worker.ok, { t: 'tell', note: sent }, note.k);
  }
});

test('every question a worker can ask comes through both checks whole', () => {
  for (const q of [
    { k: 'file', name: 'Sales', action: 'close' }, { k: 'file', name: 'Sales', action: 'pause' }, { k: 'file', name: 'Sales', action: 'open' },
    { k: 'file', name: 'Sales', action: 'offline', detail: 'database disk image is malformed' },
  ] as const) {
    const sent = wire({ t: 'ask' as const, rid: 7, q });
    const front = workerMessage(sent, SENDER);
    assert.ok('ok' in front, JSON.stringify(front));
    assert.deepEqual(front.ok, sent);
    const worker = frontMessage(sent, WORKERS);
    assert.ok('ok' in worker, JSON.stringify(worker));
    assert.deepEqual(worker.ok, sent);
  }
});
