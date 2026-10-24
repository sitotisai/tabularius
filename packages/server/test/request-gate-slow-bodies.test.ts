import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { connect } from 'node:net';
import { setTimeout as sleep } from 'node:timers/promises';
import { createEdgeServer } from '../src/edge-limits.ts';
import { RequestGate, SLOW_BODIES_PER_ADDRESS } from '../src/request-gate.ts';
import { listen, RawClient, request, stubCommands } from './edge-test-helpers.ts';

// A gate of 8 slots lets 4 requests wait on a small body in all, and SLOW_BODIES_PER_ADDRESS from one address.
async function start(t: TestContext) {
  stubCommands(t);
  const gate = new RequestGate(8, 16, 100);
  const port = await listen(t, createEdgeServer(async (req, res) => {
    const release = await gate.enter(req, res, 'priority');
    if (!release) { res.writeHead(503).end(); return; }
    req.on('data', () => {}); // reading is what answers an Expect: 100-continue
    req.on('end', () => { res.end('ok'); release(); });
    res.once('close', release);
  }, { smallBodyMs: 60_000, bodyMs: 60_000 }));
  const held: RawClient[] = [];
  t.after(() => { for (const c of held) c.socket.destroy(); });
  // Loopback answers to every 127.x address, so each one stands for a different client.
  const from = async (address: string) => { const c = await new RawClient(port, connect({ port, host: '127.0.0.1', localAddress: address })).ready(); held.push(c); return c; };
  const hold = async (address: string, headers = 'Content-Length: 200\r\n') => (await from(address)).send(request('/tabularius/admin/v1/sign-in', headers, 'POST') + '{');
  return { gate, from, hold };
}
const until = async (check: () => boolean, what: string) => {
  for (let i = 0; i < 300; i++) { if (check()) return; await sleep(10); }
  assert.fail(what);
};

test('one address may keep only a few sign-in bodies waiting; its others are refused as busy, and a complete sign-in is not counted', async t => {
  const { gate, from, hold } = await start(t);
  const held = [];
  for (let i = 0; i < SLOW_BODIES_PER_ADDRESS; i++) held.push(await hold('127.0.0.2'));
  await until(() => gate.unfinishedBodies === SLOW_BODIES_PER_ADDRESS, 'the first bodies take a place');
  const refused = await hold('127.0.0.2');
  await refused.until(text => /^HTTP\/1\.1 503 /.test(text));
  const whole = await from('127.0.0.2');
  assert.match(await whole.send(request('/tabularius/admin/v1/sign-in', 'Content-Length: 2\r\nConnection: close\r\n', 'POST') + '{}').end(), /^HTTP\/1\.1 200 /);
  assert.equal(gate.unfinishedBodies, SLOW_BODIES_PER_ADDRESS);
});

test('a sign-in from another address is served although one address is dripping, also when its body follows the headers or it asks for 100-continue', async t => {
  const { gate, from, hold } = await start(t);
  await hold('127.0.0.2'); await hold('127.0.0.2');
  await until(() => gate.unfinishedBodies === SLOW_BODIES_PER_ADDRESS, 'the dripping bodies take their places');
  const split = await from('127.0.0.3');
  split.send(request('/tabularius/admin/v1/sign-in', 'Content-Length: 2\r\nConnection: close\r\n', 'POST'));
  await sleep(30);
  assert.match(await split.send('{}').end(), /^HTTP\/1\.1 200 /);
  // Even from the dripping address itself: its body cannot arrive before the handler reads, so it is not counted.
  const expecting = await from('127.0.0.2');
  expecting.send(request('/tabularius/admin/v1/sign-in', 'Content-Length: 2\r\nExpect: 100-continue\r\nConnection: close\r\n', 'POST'));
  await expecting.until(text => text.includes('100 Continue'));
  assert.match(await expecting.send('{}').end(), /HTTP\/1\.1 200 /);
});

test('all addresses together may keep only half the slots waiting on a body', async t => {
  const { gate, hold } = await start(t);
  for (const address of ['127.0.0.2', '127.0.0.3']) { await hold(address); await hold(address); }
  await until(() => gate.unfinishedBodies === gate.slowBodyLimit, 'half the slots are waiting');
  const refused = await hold('127.0.0.4');
  await refused.until(text => /^HTTP\/1\.1 503 /.test(text));
});

test('an aborted or finished request gives its place back', async t => {
  const { gate, hold, from } = await start(t);
  const dripping = [await hold('127.0.0.5'), await hold('127.0.0.5')];
  await until(() => gate.unfinishedBodies === 2, 'both bodies take a place');
  for (const c of dripping) c.socket.destroy();
  await until(() => gate.unfinishedBodies === 0, 'an abort frees the place');
  assert.equal(gate.running, 0);
  // The body that completes is released too.
  const late = await hold('127.0.0.5', 'Content-Length: 4\r\n');
  await until(() => gate.unfinishedBodies === 1, 'the body is awaited');
  late.send('xxx');
  await late.until(text => /^HTTP\/1\.1 200 /.test(text));
  await until(() => gate.unfinishedBodies === 0, 'a finished body frees the place');
  await from('127.0.0.5');
});
