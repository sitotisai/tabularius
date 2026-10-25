import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { connect } from 'node:net';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { setTimeout as sleep } from 'node:timers/promises';
import { createEdgeServer } from '../src/edge-limits.ts';
import { RequestGate, requestClass } from '../src/request-gate.ts';
import { listen, RawClient, request, stubCommands } from './edge-test-helpers.ts';

// A gate of 8 slots lets 4 ordinary requests wait on a small body in all and 2 from one address; sign-in and the like have 1 place, taken from a pool of their own.
const EACH = 2, TOTAL = 4;
const SIGN_IN = '/tabularius/admin/v1/sign-in', ORDINARY = '/something';

async function start(t: TestContext, limit = 8) {
  stubCommands(t);
  const gate = new RequestGate(limit, 16, 100);
  const port = await listen(t, createEdgeServer(async (req, res) => {
    const release = await gate.enter(req, res, requestClass(req.method, (req.url ?? '').split('?')[0]));
    if (!release) { res.writeHead(503).end(); return; }
    req.on('data', () => {}); // reading is what answers an Expect: 100-continue
    req.on('end', () => { res.end('ok'); release(); });
    res.once('close', release);
  }, { smallBodyMs: 60_000, bodyMs: 60_000 }));
  const held: RawClient[] = [];
  t.after(() => { for (const c of held) c.socket.destroy(); });
  // Loopback answers to every 127.x address, so each one stands for a different client.
  const from = async (address: string) => { const c = await new RawClient(port, connect({ port, host: '127.0.0.1', localAddress: address })).ready(); held.push(c); return c; };
  const hold = async (address: string, path = ORDINARY, headers = 'Content-Length: 200\r\n') =>
    (await from(address)).send(request(path, headers, 'POST') + (/chunked/i.test(headers) ? '1\r\nx\r\n' : '{'));
  const whole = async (address: string, path = ORDINARY) => (await from(address)).send(request(path, 'Content-Length: 2\r\nConnection: close\r\n', 'POST') + '{}').end();
  return { gate, from, hold, whole };
}
const until = async (check: () => boolean, what: string) => {
  for (let i = 0; i < 300; i++) { if (check()) return; await sleep(10); }
  assert.fail(what);
};

test('one address may keep only a few bodies waiting; its others are refused as busy, and a complete request is not counted', async t => {
  const { gate, hold, whole } = await start(t);
  for (let i = 0; i < EACH; i++) await hold('127.0.0.2');
  await until(() => gate.unfinishedBodies === EACH, 'the first bodies take a place');
  const refused = await hold('127.0.0.2');
  await refused.until(text => /^HTTP\/1\.1 503 /.test(text));
  assert.match(await whole('127.0.0.2'), /^HTTP\/1\.1 200 /);
  assert.equal(gate.unfinishedBodies, EACH);
});

test('a request from another address is served although one address is dripping, also when its body follows the headers', async t => {
  const { gate, from, hold } = await start(t);
  await hold('127.0.0.2'); await hold('127.0.0.2');
  await until(() => gate.unfinishedBodies === EACH, 'the dripping bodies take their places');
  const split = await from('127.0.0.3');
  split.send(request(ORDINARY, 'Content-Length: 2\r\nConnection: close\r\n', 'POST'));
  await sleep(30);
  assert.match(await split.send('{}').end(), /^HTTP\/1\.1 200 /);
});

test('a request that asks for 100-continue counts while it waits for its body, like any other', async t => {
  const { gate, hold, whole } = await start(t);
  for (let i = 0; i < EACH; i++) await hold('127.0.0.2', ORDINARY, 'Content-Length: 200\r\nExpect: 100-continue\r\n');
  await until(() => gate.unfinishedBodies === EACH, 'the waiting requests take their places');
  const refused = await hold('127.0.0.2', ORDINARY, 'Content-Length: 200\r\nExpect: 100-continue\r\n');
  await refused.until(text => /^HTTP\/1\.1 503 /.test(text));
  assert.match(await whole('127.0.0.3'), /^HTTP\/1\.1 200 /, 'another address is not affected');
});

test('all addresses together may keep only a share of the slots waiting on a body', async t => {
  const { gate, hold } = await start(t);
  for (const address of ['127.0.0.2', '127.0.0.3']) { await hold(address); await hold(address); }
  await until(() => gate.unfinishedBodies === TOTAL, 'the share is taken');
  const refused = await hold('127.0.0.4');
  await refused.until(text => /^HTTP\/1\.1 503 /.test(text));
});

test('sign-in has places of its own: ordinary requests cannot take them, and it cannot take theirs', async t => {
  const { gate, hold, whole } = await start(t);
  for (const address of ['127.0.0.2', '127.0.0.3']) { await hold(address); await hold(address); }
  await until(() => gate.unfinishedBodies === TOTAL, 'the ordinary places are all taken');
  // A sign-in whose body follows its headers is still served.
  const split = await hold('127.0.0.4', SIGN_IN, 'Content-Length: 2\r\nConnection: close\r\n');
  await sleep(30);
  assert.match(await split.send('}').end(), /^HTTP\/1\.1 200 /);
  // Its own pool is small, and an address has only one of its places.
  await hold('127.0.0.5', SIGN_IN);
  await until(() => gate.unfinishedBodies === TOTAL + 1, 'the sign-in takes its place');
  const refused = await hold('127.0.0.5', SIGN_IN);
  await refused.until(text => /^HTTP\/1\.1 503 /.test(text));
  // Dripping sign-ins leave an address its ordinary places.
  assert.match(await whole('127.0.0.5'), /^HTTP\/1\.1 200 /);
});

test('a body that was only a little behind its headers is admitted when it arrives, although every place is taken', async t => {
  const { gate, hold, from } = await start(t);
  for (const address of ['127.0.0.2', '127.0.0.3']) { await hold(address); await hold(address); }
  await until(() => gate.unfinishedBodies === TOTAL, 'the places are all taken');
  const late = await from('127.0.0.4');
  late.send(request(ORDINARY, 'Content-Length: 2\r\nConnection: close\r\n', 'POST'));
  await sleep(30);
  assert.match(await late.send('{}').end(), /^HTTP\/1\.1 200 /, 'it waited in the queue and was let in once its body was complete');
});

test('with the fewest slots, bodies that are waited for never leave ordinary requests without one', async t => {
  const { gate, hold, whole } = await start(t, 4);
  await hold('127.0.0.2');
  await until(() => gate.unfinishedBodies === 1, 'the first body takes a place');
  for (const [address, path] of [['127.0.0.2', ORDINARY], ['127.0.0.3', ORDINARY], ['127.0.0.4', SIGN_IN]] as const) {
    const refused = await hold(address, path);
    await refused.until(text => /^HTTP\/1\.1 503 /.test(text));
  }
  assert.match(await whole('127.0.0.5'), /^HTTP\/1\.1 200 /);
  assert.match(await whole('127.0.0.6'), /^HTTP\/1\.1 200 /);
});

test('a body declared between 64 and 256 KiB counts too, since an inbound hook reads that much before it knows the caller', async t => {
  const { gate, hold } = await start(t);
  for (let i = 0; i < EACH; i++) await hold('127.0.0.2', ORDINARY, 'Content-Length: 100000\r\n');
  await until(() => gate.unfinishedBodies === EACH, 'the bodies take a place');
  const refused = await hold('127.0.0.2', ORDINARY, 'Content-Length: 100000\r\n');
  await refused.until(text => /^HTTP\/1\.1 503 /.test(text));
  // A body no route reads before authentication is not waited on in this way.
  await hold('127.0.0.3', ORDINARY, 'Content-Length: 1000000\r\n');
  await sleep(50);
  assert.equal(gate.unfinishedBodies, EACH);
});

test('only a token the server holds leaves a Data API body uncounted, not the look of one', async t => {
  const { gate, hold } = await start(t);
  gate.holdsToken = req => req.headers.authorization === 'Bearer held';
  const chunked = (token: string) => `Transfer-Encoding: chunked\r\nAuthorization: Bearer ${token}\r\n`;
  const records = '/fmi/data/vLatest/databases/X/layouts/Items/records';
  await hold('127.0.0.2', records, chunked('held'));
  await hold('127.0.0.2', records, chunked('held'));
  await hold('127.0.0.2', records, chunked('held'));
  await sleep(100);
  assert.equal(gate.unfinishedBodies, 0, 'a held token is checked before the body is read');
  // The same shape with a made-up token, and the sign-in route spelled with an escape, are waiting on a stranger.
  await hold('127.0.0.3', records, chunked('made-up'));
  await hold('127.0.0.3', '/fmi/data/v1/databases/X/%73essions', chunked('made-up'));
  await until(() => gate.unfinishedBodies === 2, 'both take a place');
});

test('a held token does not make the sign-in routes calls that check it first: they read their body whatever it says', async t => {
  const { gate, hold } = await start(t);
  gate.holdsToken = () => true;
  const chunked = 'Transfer-Encoding: chunked\r\nAuthorization: Bearer held\r\n';
  const sessions = '/fmi/data/vLatest/databases/X/sessions';
  await hold('127.0.0.2', sessions, chunked);
  await hold('127.0.0.3', `${sessions}/passkey`, chunked);
  await hold('127.0.0.4', '/fmi/data/vLatest/databases/X/%73essions/recovery', chunked);
  await hold('127.0.0.5', `${sessions}/passkey`, 'Transfer-Encoding: chunked\r\nX-FM-Data-Access-Token: held\r\n');
  await until(() => gate.unfinishedBodies === 4, 'every one of them takes a place');
  // Any other route of the Data API, with the same token, is left alone.
  await hold('127.0.0.6', '/fmi/data/vLatest/databases/X/layouts/Items/records', chunked);
  await sleep(100);
  assert.equal(gate.unfinishedBodies, 4);
});

test('an IPv6 /64 is one address for the places a body may wait in', async t => {
  const gate = new RequestGate(8, 16, 50);
  const fake = (remoteAddress: string) => {
    const req = Object.assign(new EventEmitter(), { headers: { 'content-length': '200' }, url: ORDINARY, complete: false, socket: { remoteAddress, destroyed: false }, push: () => true });
    const res = Object.assign(new EventEmitter(), { destroyed: false, writableEnded: false, writableFinished: false });
    return { req: req as unknown as IncomingMessage, res: res as unknown as ServerResponse };
  };
  const enter = (address: string) => { const { req, res } = fake(address); return gate.enter(req, res, 'normal'); };
  const first = await enter('2001:db8:0:1::1');
  const second = await enter('2001:db8:0:1:ffff::2');
  assert.ok(first && second);
  assert.equal(await enter('2001:db8:0:1::3'), undefined, 'the same /64, however the host spells its address');
  assert.ok(await enter('2001:db8:0:2::1'), 'another /64 is another client');
});

test('an aborted or finished request gives its place back', async t => {
  const { gate, hold, from } = await start(t);
  const dripping = [await hold('127.0.0.5'), await hold('127.0.0.5')];
  await until(() => gate.unfinishedBodies === 2, 'both bodies take a place');
  for (const c of dripping) c.socket.destroy();
  await until(() => gate.unfinishedBodies === 0, 'an abort frees the place');
  assert.equal(gate.running, 0);
  // The body that completes is released too.
  const late = await hold('127.0.0.5', ORDINARY, 'Content-Length: 4\r\n');
  await until(() => gate.unfinishedBodies === 1, 'the body is awaited');
  late.send('xxx');
  await late.until(text => /^HTTP\/1\.1 200 /.test(text));
  await until(() => gate.unfinishedBodies === 0, 'a finished body frees the place');
  await from('127.0.0.5');
});
