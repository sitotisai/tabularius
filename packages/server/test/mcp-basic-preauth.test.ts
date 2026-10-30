import { test, type TestContext } from 'node:test';
import { request } from 'node:http';
import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { serve } from '../src/index.ts';
import { AddressBudget, BUDGET_BURST, CheckGate } from '../src/address-budget.ts';
import { basicCredentialsRemembered, proveBasicCredentials } from '../src/mcp.ts';
import { Store } from '../../store/src/store.ts';

async function start(t: TestContext, options: { proxy?: boolean } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-mcp-basic-'));
  const s = await serve({ dir, port: 0, watch: false, log: () => {}, mcpToken: 'separate-admin-secret', ...(options.proxy ? { proxyHeader: 'x-forwarded-for' as never, trustedProxies: ['127.0.0.1', '::1'] } : {}) });
  t.after(async () => {
    await new Promise<void>((resolve) => s.server.close(() => resolve()));
    rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
  });
  const a = s.host.create('A');
  a.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Title' }] }]);
  a.create('Items', { Title: 'row' });
  a.savePrivilegeSet({ name: 'Reader', records: { view: true, edit: false, create: false, delete: false }, layouts: 'viewOnly', valueLists: 'none', scripts: 'none', extendedPrivileges: ['fmrest', 'fmapp', 'fmmcp'] });
  a.setPassword('alice', 'alice-password', 'Reader');
  a.setPassword('bob', 'bob-password', 'Reader');
  // No AI access at all, and a second factor that is required but not set up.
  a.savePrivilegeSet({ name: 'Nothing', records: { view: false, edit: false, create: false, delete: false }, layouts: 'none', valueLists: 'none', scripts: 'none', extendedPrivileges: [] } as never);
  a.setPassword('mallory', 'mallory-password', 'Nothing');
  a.setPassword('carol', 'carol-password', 'Reader');
  a.setAccountRequire2fa('carol', true);
  return s;
}

const basic = (account: string, password: string) => `Basic ${Buffer.from(`${account}:${password}`).toString('base64')}`;
const rpc = (base: string, authorization: string, call: { method: string; params?: object } = { method: 'tools/list' }) => fetch(`${base}/mcp`, {
  method: 'POST',
  headers: { authorization, 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-06-18' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, ...call }),
});

test('an address has a burst and then a steady rate, and addresses do not share it', () => {
  let ms = 0;
  const budget = new AddressBudget(3, 2, () => ms);
  assert.deepEqual([1, 2, 3, 4].map(() => budget.take('203.0.113.1')), [true, true, true, false]);
  assert.equal(budget.take('203.0.113.2'), true, 'another address has its own');
  ms += 500;
  assert.equal(budget.take('203.0.113.1'), true, 'one unit comes back every half second');
  assert.equal(budget.take('203.0.113.1'), false);
  ms += 60_000;
  assert.deepEqual([1, 2, 3, 4].map(() => budget.take('203.0.113.1')), [true, true, true, false], 'idle time never banks more than the burst');
  assert.equal(budget.take('2001:db8:0:1::1'), true);
  assert.equal(budget.take('2001:db8:0:1::2') && budget.take('2001:db8:0:1::3') && budget.take('2001:db8:0:1::4'), false, 'an IPv6 /64 is one address');
});

test('/mcp refuses a flood of Basic credentials nobody has proven, while a proven account keeps working', async (t) => {
  const { url } = await start(t);
  // A tool call on the file proves the account, which the server then remembers for a few minutes.
  const proof = await rpc(url, basic('alice', 'alice-password'), { method: 'tools/call', params: { name: 'get_record', arguments: { database: 'A', layout: 'Items', recordId: 1 } } });
  assert.equal(proof.status, 200);
  // Time stands still, so the rate that refills the budget cannot depend on how fast this machine answers.
  const frozen = performance.now();
  t.mock.method(performance, 'now', () => frozen);
  const responses = [];
  for (let i = 0; i < BUDGET_BURST + 5; i++) {
    const response = await rpc(url, basic(`nobody${i}`, 'x'));
    await response.arrayBuffer();
    responses.push(response);
  }
  const statuses = responses.map((response) => response.status);
  const retryAfter = responses.find((response) => response.status === 429)?.headers.get('retry-after');
  assert.ok(statuses.filter((code) => code === 429).length >= 5, `expected refusals, got ${statuses.join(',')}`);
  assert.equal(retryAfter, '1');
  const again = await rpc(url, basic('alice', 'alice-password'));
  assert.equal(again.status, 200, 'a remembered account is not charged');
  assert.ok(((await again.json()) as { result: { tools: unknown[] } }).result.tools.length > 10);
});

// The address the server sees for this test's own requests.
const rpcFrom = (base: string, authorization: string, from: string, call: { method: string; params?: object } = { method: 'tools/list' }) => fetch(`${base}/mcp`, {
  method: 'POST',
  headers: { authorization, 'x-forwarded-for': from, 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-06-18' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, ...call }),
});
/** A request that reaches the server from another local address (127.0.0.2), so it counts as another address group. */
const rpcFromAnotherAddress = (base: string, authorization: string, call: { method: string; params?: object } = { method: 'tools/list' }) => new Promise<{ status: number }>((resolve, reject) => {
  const url = new URL(base);
  const req = request({ host: url.hostname, port: url.port, path: '/mcp', method: 'POST', localAddress: '127.0.0.2', headers: { authorization, 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-06-18' } }, (res) => {
    res.resume();
    res.on('end', () => resolve({ status: res.statusCode ?? 0 }));
  });
  req.on('error', reject);
  req.end(JSON.stringify({ jsonrpc: '2.0', id: 1, ...call }));
});
const clientFrom = (base: string) => new URL(base).hostname.replace(/^\[|\]$/g, '');
const proveAlice = (base: string) => rpc(base, basic('alice', 'alice-password'), { method: 'tools/call', params: { name: 'get_record', arguments: { database: 'A', layout: 'Items', recordId: 1 } } });
const flood = async (base: string, count: number, prefix = 'nobody') => {
  const codes: number[] = [];
  for (let i = 0; i < count; i++) {
    const response = await rpc(base, basic(`${prefix}${i}`, 'x'));
    await response.arrayBuffer();
    codes.push(response.status);
  }
  return codes;
};

test('a failed sign-in by someone else does not make a proven account unproven', async (t) => {
  const s = await start(t);
  assert.equal((await proveAlice(s.url)).status, 200);
  const file = s.host.get('A')!;
  assert.equal(basicCredentialsRemembered(s.host, { account: 'alice', password: 'alice-password', from: clientFrom(s.url) }), true);
  const before = file.securityToken();
  // Someone else's wrong passwords, enough to lock their address out, change the file's security state, which empties the shared password cache.
  for (let i = 0; i < 20 && file.securityToken() === before; i++) assert.equal(file.verify('bob', 'guess', '203.0.113.50'), false);
  assert.notEqual(file.securityToken(), before, 'the lockout must have moved the security token for this test to mean anything');
  assert.equal(basicCredentialsRemembered(s.host, { account: 'alice', password: 'alice-password', from: clientFrom(s.url) }), true);
  assert.equal(basicCredentialsRemembered(s.host, { account: 'alice', password: 'other-password', from: clientFrom(s.url) }), false);
  const frozen = performance.now();
  t.mock.method(performance, 'now', () => frozen);
  assert.ok((await flood(s.url, BUDGET_BURST + 5)).includes(429));
  assert.equal((await rpc(s.url, basic('alice', 'alice-password'))).status, 200, 'alice is still not charged');
});

test('a proof counts for the whole address group, as the budget does', async (t) => {
  const s = await start(t, { proxy: true });
  const call = { method: 'tools/call', params: { name: 'get_record', arguments: { database: 'A', layout: 'Items', recordId: 1 } } };
  const who = (from: string) => ({ account: 'alice', password: 'alice-password', from });
  await (await rpcFrom(s.url, basic('alice', 'alice-password'), '2001:db8:1:2::9', call)).arrayBuffer();
  // An IPv6 /64 is one address to the budget: the proof holds at every address of it, and not at another /64.
  for (const same of ['2001:db8:1:2::9', '2001:db8:1:2::a', '2001:db8:1:2:ffff::1']) assert.equal(basicCredentialsRemembered(s.host, who(same)), true, same);
  assert.equal(basicCredentialsRemembered(s.host, who('2001:db8:1:3::9')), false);
  assert.equal(basicCredentialsRemembered(s.host, who('203.0.113.4')), false);
});

test('a proven account stops being exempt when its password changes or it is disabled', async (t) => {
  const s = await start(t);
  assert.equal((await proveAlice(s.url)).status, 200);
  const file = s.host.get('A')!;
  file.setPassword('alice', 'a-new-password', 'Reader');
  assert.equal(basicCredentialsRemembered(s.host, { account: 'alice', password: 'alice-password', from: clientFrom(s.url) }), false, 'the old password is no longer proven');
  const bob = await rpc(s.url, basic('bob', 'bob-password'), { method: 'tools/call', params: { name: 'get_record', arguments: { database: 'A', layout: 'Items', recordId: 1 } } });
  assert.equal(bob.status, 200);
  assert.equal(basicCredentialsRemembered(s.host, { account: 'bob', password: 'bob-password', from: clientFrom(s.url) }), true);
  file.setAccountActive('bob', false);
  assert.equal(basicCredentialsRemembered(s.host, { account: 'bob', password: 'bob-password', from: clientFrom(s.url) }), false, 'a disabled account is no longer proven');
});

test('a flood of made-up names from one address does not shut out a real account behind it, and stays bounded', async (t) => {
  const s = await start(t);
  const frozen = performance.now();
  t.mock.method(performance, 'now', () => frozen);
  const codes = await flood(s.url, BUDGET_BURST + 20);
  assert.ok(codes.filter((code) => code === 429).length >= 20, 'the flood is refused once the address budget is used');
  // Bob has never signed in, so nothing remembers him; his password is still proven before he is refused.
  const bob = await rpc(s.url, basic('bob', 'bob-password'));
  assert.equal(bob.status, 200, 'a real account with the right password is served although the address budget is empty');
  assert.ok(((await bob.json()) as { result: { tools: unknown[] } }).result.tools.length > 10);
  // The same name with a wrong password, and more made-up names, are still refused the same way.
  for (const attempt of [basic('bob', 'wrong-password'), basic('nobody-else', 'x')]) {
    const refused = await rpc(s.url, attempt);
    await refused.arrayBuffer();
    assert.equal(refused.status, 429);
    assert.equal(refused.headers.get('retry-after'), '1');
  }
  // Having been proven, bob is served again without any check.
  assert.equal((await rpc(s.url, basic('bob', 'bob-password'))).status, 200);
});

test('a full address table gives a new address a reduced burst, not a fresh full one', () => {
  const budget = new AddressBudget(5, 1, () => 0, 2, 2);
  assert.equal(budget.take('203.0.113.1'), true);
  assert.equal(budget.take('203.0.113.2'), true);
  // The table holds two addresses, so a third (and every one an attacker cycles through) starts small.
  assert.deepEqual([1, 2, 3].map(() => budget.take('203.0.113.3')), [true, true, false]);
  assert.deepEqual([1, 2, 3].map(() => budget.take('203.0.113.4')), [true, true, false]);
  // An address that is already in the table keeps its own full burst.
  const known = new AddressBudget(5, 1, () => 0, 2, 2);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(() => known.take('203.0.113.1')), [true, true, true, true, true, false]);
});

const tick = () => new Promise((resolve) => setImmediate(resolve));
const settled = async (p: Promise<unknown>) => { let done = false; void p.then(() => { done = true; }); await tick(); await tick(); return done; };

test('checks are one per (address, name), a few per address and a few overall, and wait their turn', async () => {
  const gate = new CheckGate({ global: 3, perAddress: 2, perSecond: 1000, burst: 1000 });
  const bob = await gate.enter('203.0.113.1', 'bob');
  assert.ok(bob);
  // The same name at the same address waits for the first; a different name does not.
  const bobAgain = gate.enter('203.0.113.1', 'BOB');
  assert.equal(await settled(bobAgain), false);
  const other = await gate.enter('203.0.113.1', 'mallory');
  assert.ok(other);
  // The address has two running, so a third name waits too, while another address has room.
  const third = gate.enter('203.0.113.1', 'eve');
  assert.equal(await settled(third), false);
  const elsewhere = await gate.enter('203.0.113.2', 'bob');
  assert.ok(elsewhere);
  // Three are running now, which is the overall limit.
  const fourth = gate.enter('203.0.113.3', 'zed');
  assert.equal(await settled(fourth), false);
  bob();
  bob();
  const next = await bobAgain;
  assert.ok(next, 'the waiting check of the same name starts once the first is done, in its turn');
  other();
  elsewhere();
  next();
  assert.ok(await third, 'and so does a name that waited for a place at the address');
  assert.ok(await fourth, 'and one that waited for an overall place');
});

test('a later arrival never pushes a waiting check out: over the limit it is refused, and the line keeps its order', async () => {
  const gate = new CheckGate({ global: 1, perAddress: 1, waitingPerAddress: 2, waitingTotal: 3, waitMs: 5000, perSecond: 1000, burst: 1000 });
  const held = await gate.enter('203.0.113.1', 'held');
  assert.ok(held);
  const order: string[] = [];
  const run = (address: string, name: string) => gate.enter(address, name).then((release) => { order.push(`${name}:${release ? 'ran' : 'refused'}`); release?.(); return release; });
  const a = run('203.0.113.1', 'a');
  const b = run('203.0.113.1', 'b');
  // The address has two waiting, so the next is refused at once, whoever it is, and a and b keep their places.
  assert.equal(await run('203.0.113.1', 'bob'), undefined);
  // Another address has its own share, up to the overall limit.
  const c = run('198.51.100.1', 'c');
  assert.equal(await run('198.51.100.2', 'd'), undefined, 'the overall line is full');
  held();
  await Promise.all([a, b, c]);
  assert.deepEqual(order.filter((x) => x.endsWith('refused')), ['bob:refused', 'd:refused']);
  assert.deepEqual(order.filter((x) => x.endsWith('ran')).sort(), ['a:ran', 'b:ran', 'c:ran']);
});

test('places are given out in turns between addresses, so a address with many waiting does not make another wait for them', async () => {
  const gate = new CheckGate({ global: 1, perAddress: 1, waitingPerAddress: 16, waitMs: 5000, perSecond: 1000, burst: 1000 });
  const held = await gate.enter('203.0.113.1', 'held');
  assert.ok(held);
  const order: string[] = [];
  const run = (address: string, name: string) => gate.enter(address, name).then((release) => { order.push(name); release?.(); });
  const all = ['m1', 'm2', 'm3', 'm4'].map((name) => run('203.0.113.1', name));
  all.push(run('198.51.100.1', 'bob'));
  all.push(run('198.51.100.2', 'carol'));
  held();
  await Promise.all(all);
  // m1 first (it came first), then each other address once before the first address has its second.
  assert.deepEqual(order.slice(0, 3).sort(), ['bob', 'carol', 'm1']);
  assert.equal(order.length, 6);
});

test('a check that is waiting is withdrawn when its client goes away', async () => {
  const gate = new CheckGate({ global: 1, perAddress: 1, waitingPerAddress: 1, waitMs: 5000, perSecond: 1000, burst: 1000 });
  const held = await gate.enter('203.0.113.1', 'held');
  assert.ok(held);
  const hangsUp = new AbortController();
  const gone = gate.enter('203.0.113.1', 'gone', hangsUp.signal);
  assert.equal(await settled(gone), false);
  hangsUp.abort();
  // At once, not when the wait (5 s here) runs out.
  assert.equal(await Promise.race([gone, new Promise((resolve) => setTimeout(() => resolve('still waiting'), 500))]), undefined);
  // Its place in the line is free again, and it never runs once a turn comes.
  const next = gate.enter('203.0.113.1', 'next');
  assert.equal(await settled(next), false);
  held();
  assert.ok(await next);
  assert.equal(await gate.enter('203.0.113.1', 'late', AbortSignal.abort()), undefined, 'a client already gone is not queued');
});

test('no name goes ahead of the others, whatever it did before: a name proved once, or that came back, queues like any other', async () => {
  const gate = new CheckGate({ global: 1, perAddress: 1, waitMs: 5000, perSecond: 1000, burst: 1000 });
  (await gate.enter('203.0.113.1', 'bob'))!();
  const held = await gate.enter('203.0.113.1', 'held');
  const order: string[] = [];
  const run = (name: string) => gate.enter('203.0.113.1', name).then((release) => { order.push(name); release?.(); });
  // The same name spelled with another case, from the same address group, waits behind the names that came first.
  const all = [run('m1'), run('m2'), run('BOB'), run('m3')];
  held!();
  await Promise.all(all);
  assert.deepEqual(order, ['m1', 'm2', 'BOB', 'm3']);
});

test('a budget does not lose tokens when the clock steps back', () => {
  let ms = 1000;
  const budget = new AddressBudget(3, 2, () => ms);
  assert.equal(budget.take('203.0.113.1'), true);
  ms = 0;
  assert.deepEqual([1, 2].map(() => budget.take('203.0.113.1')), [true, true], 'the two left are still there');
  assert.equal(budget.take('203.0.113.1'), false);
});

test('a client that is gone is not checked and no failed attempt is counted for it', async (t) => {
  const s = await start(t);
  const from = '203.0.113.77';
  for (let i = 0; i < 30; i++) assert.equal(await proveBasicCredentials(s.host, { account: 'bob', password: 'wrong', from }, () => true), false);
  // Thirty wrong passwords would have locked this address out of the account; nothing was counted.
  assert.equal(await proveBasicCredentials(s.host, { account: 'bob', password: 'bob-password', from }), true);
});

test('checks start at a bounded rate overall', async () => {
  const gate = new CheckGate({ global: 10, perAddress: 10, perSecond: 20, burst: 2, waitMs: 2000 });
  const began = Date.now();
  const releases = await Promise.all(['a', 'b', 'c', 'd', 'e'].map((name, i) => gate.enter(`203.0.113.${i}`, name)));
  assert.ok(releases.every(Boolean));
  // Two at once, then one every 50 ms.
  assert.ok(Date.now() - began >= 100, `five checks took ${Date.now() - began} ms`);
  for (const release of releases) release!();
});

// The other group is another address of this computer (127.0.0.2) used as the source of a connection; macOS has only 127.0.0.1 on its loopback.
test('a flood that holds an address group\'s line full crowds out that group only, and the group recovers when it stops', { skip: process.platform === 'darwin' && 'macOS has only 127.0.0.1 on the loopback' }, async (t) => {
  const s = await start(t);
  const frozen = performance.now();
  t.mock.method(performance, 'now', () => frozen);
  // The flooded group is this computer's address, which the file's own sign-in lockout never counts, so only the line is
  // being tested; the other group is another address of this computer (127.0.0.2).
  const here = (account: string, password: string) => rpc(s.url, basic(account, password));
  const there = (account: string, password: string) => rpcFromAnotherAddress(s.url, basic(account, password));
  // Both groups have used their budgets, so a real account's password has to be checked in the line.
  for (let i = 0; i < BUDGET_BURST + 3; i++) {
    await (await here(`nobody${i}`, 'x')).arrayBuffer();
    await there(`nobody${i}`, 'x');
  }
  let running = true;
  let n = 0;
  // More connections than the line has places (16 waiting and 2 running), all sending names that do not exist.
  const flooders = Array.from({ length: 30 }, async () => {
    while (running) { try { await (await here(`made-up-${n++}`, 'x')).arrayBuffer(); } catch { /* the test is over */ } }
  });
  try {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // The flooded group's real account is turned away while its line is full: it may try again, or come from another address.
    const during: number[] = [];
    for (let i = 0; i < 4; i++) { const r = await here('bob', 'bob-password'); await r.arrayBuffer(); during.push(r.status); }
    assert.ok(during.includes(429), `the flooded group's line is full, got ${during.join(',')}`);
    // Another group is not affected: it is served, and quickly, although the flood goes on.
    const began = Date.now();
    const served = await there('bob', 'bob-password');
    assert.equal(served.status, 200, 'another address group is served during the flood');
    assert.ok(Date.now() - began < 4000, `it was served in ${Date.now() - began} ms`);
  } finally {
    running = false;
    await Promise.all(flooders);
  }
  // Once the flood stops the group is served again.
  let recovered = false;
  for (let i = 0; i < 8 && !recovered; i++) {
    const r = await here('bob', 'bob-password');
    await r.arrayBuffer();
    if (r.status === 200) recovered = true; else await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  assert.ok(recovered, 'the group recovers when the flood stops');
});

test('a remembered account costs no password hash while the shared cache is fresh, at every address of its /64', async (t) => {
  const s = await start(t, { proxy: true });
  const store = s.host.get('A')!;
  const call = { method: 'tools/call', params: { name: 'get_record', arguments: { database: 'A', layout: 'Items', recordId: 1 } } };
  const frozen = performance.now();
  t.mock.method(performance, 'now', () => frozen);
  assert.equal((await (async () => { const r = await rpcFrom(s.url, basic('bob', 'bob-password'), '2001:db8:1:2::1', call); await r.arrayBuffer(); return r; })()).status, 200);
  for (let i = 0; i < BUDGET_BURST + 5; i++) await (await rpcFrom(s.url, basic(`nobody${i}`, 'x'), `2001:db8:1:2::${(i + 2).toString(16)}`)).arrayBuffer();
  const verify = t.mock.method(Object.getPrototypeOf(store), 'verify');
  const codes: number[] = [];
  for (let i = 0; i < 40; i++) {
    const r = await rpcFrom(s.url, basic('bob', 'bob-password'), `2001:db8:1:2:${(i + 1).toString(16)}::77`, call);
    await r.arrayBuffer();
    codes.push(r.status);
  }
  assert.deepEqual([...new Set(codes)], [200], 'a remembered account is served at every address of its /64');
  assert.equal(verify.mock.callCount(), 0, `no synchronous password hash ran: ${verify.mock.callCount()}`);
});

test('an account is remembered only after the whole MCP admission: no fmmcp, or a second factor still missing, is not enough', async (t) => {
  const s = await start(t, { proxy: true });
  const call = { method: 'tools/call', params: { name: 'get_record', arguments: { database: 'A', layout: 'Items', recordId: 1 } } };
  const from = '2001:db8:1:2::1';
  const who = (account: string, password: string) => ({ account, password, from });
  // mallory has the right password in a file but her privilege set has no AI access at all.
  await (await rpcFrom(s.url, basic('mallory', 'mallory-password'), from, call)).arrayBuffer();
  await (await rpcFrom(s.url, basic('mallory', 'mallory-password'), from)).arrayBuffer();
  assert.equal(basicCredentialsRemembered(s.host, who('mallory', 'mallory-password')), false, 'no fmmcp');
  // carol has the right password but her account needs a second factor she has not set up.
  await (await rpcFrom(s.url, basic('carol', 'carol-password'), from, call)).arrayBuffer();
  await (await rpcFrom(s.url, basic('carol', 'carol-password'), from)).arrayBuffer();
  assert.equal(basicCredentialsRemembered(s.host, who('carol', 'carol-password')), false, 'second factor required and missing');
  // bob is admitted, and so is remembered.
  await (await rpcFrom(s.url, basic('bob', 'bob-password'), from, call)).arrayBuffer();
  assert.equal(basicCredentialsRemembered(s.host, who('bob', 'bob-password')), true);
  // And the same checks keep the password-only rescue in the line from remembering anyone.
  assert.equal(await proveBasicCredentials(s.host, who('mallory', 'mallory-password')), true);
  assert.equal(basicCredentialsRemembered(s.host, who('mallory', 'mallory-password')), false);
});

/** Counts the synchronous password checks, with a cheap stand-in so a test can make thousands of requests. */
function countVerify(t: TestContext) {
  const original = Store.prototype.verify;
  const counter = { n: 0 };
  Store.prototype.verify = function (this: Store, account: string, password: string) {
    counter.n++;
    return password === `${account.toLowerCase()}-password`;
  };
  t.after(() => { Store.prototype.verify = original; });
  return counter;
}
const getRecord = (database = 'A') => ({ method: 'tools/call', params: { name: 'get_record', arguments: { database, layout: 'Items', recordId: 1 } } });

test('a remembered account runs no password hash even after another account\'s lockout empties the shared cache', async (t) => {
  const s = await start(t, { proxy: true });
  const store = s.host.get('A')!;
  const frozen = performance.now();
  t.mock.method(performance, 'now', () => frozen);
  const group = (i: number, host = 3) => `2001:db8:${(i + 1).toString(16)}::${host}`;
  const N = 4;
  for (let i = 0; i < N; i++) assert.equal((await rpcFrom(s.url, basic('bob', 'bob-password'), group(i), getRecord())).status, 200);
  for (let i = 0; i < N; i++) for (let j = 0; j < BUDGET_BURST + 2; j++) await (await rpcFrom(s.url, basic(`n${j}`, 'x'), group(i, 2))).arrayBuffer();
  const verify = countVerify(t);
  const codes = new Set<number>();
  for (let round = 0; round < 2; round++) {
    // Any security change in the file (here another account's password) empties the cache of checked passwords.
    store.setPassword('alice', `alice-password-${round}`, 'Reader');
    const before = verify.n;
    for (let i = 0; i < N; i++) { const r = await rpcFrom(s.url, basic('bob', 'bob-password'), group(i), getRecord()); await r.arrayBuffer(); codes.add(r.status); }
    assert.equal(verify.n - before, 0, 'no synchronous password check for a remembered account');
  }
  assert.deepEqual([...codes], [200]);
});

test('a remembered account is not exempt after its privilege set loses AI access or the file turns AI off', async (t) => {
  const s = await start(t, { proxy: true });
  const store = s.host.get('A')!;
  const from = '2001:db8:1:2::1';
  const who = { account: 'bob', password: 'bob-password', from };
  await (await rpcFrom(s.url, basic('bob', 'bob-password'), from, getRecord())).arrayBuffer();
  assert.equal(basicCredentialsRemembered(s.host, who), true);
  store.setAiAllowed(false);
  assert.equal(basicCredentialsRemembered(s.host, who), false, 'AI turned off for the file');
  store.setAiAllowed(true);
  await (await rpcFrom(s.url, basic('bob', 'bob-password'), from, getRecord())).arrayBuffer();
  assert.equal(basicCredentialsRemembered(s.host, who), true);
  store.savePrivilegeSet({ name: 'Reader', records: { view: true, edit: false, create: false, delete: false }, layouts: 'viewOnly', valueLists: 'none', scripts: 'none', extendedPrivileges: ['fmrest', 'fmapp'] });
  assert.equal(basicCredentialsRemembered(s.host, who), false, 'fmmcp removed from the privilege set');
});

test('a remembered proof does not get a locked-out address past the lockout', async (t) => {
  const s = await start(t, { proxy: true });
  const store = s.host.get('A')!;
  const from = '2001:db8:1:2::1';
  const ok = await rpcFrom(s.url, basic('bob', 'bob-password'), from, getRecord());
  assert.equal(((await ok.json()) as { result: { isError?: boolean } }).result.isError ?? false, false);
  for (let i = 0; i < 10; i++) store.verify('bob', `wrong-${i}`, from);
  assert.ok(store.lockedOut('bob', from) || store.addressLockedOut(from), 'the address is locked out');
  const locked = await rpcFrom(s.url, basic('bob', 'bob-password'), from, getRecord());
  const body = (await locked.json()) as { result?: { isError?: boolean } };
  assert.equal(body.result?.isError, true, 'the right password is still refused while locked out');
});

test('a remembered proof does not extend the time a password goes unchecked', async (t) => {
  const s = await start(t, { proxy: true });
  const store = s.host.get('A')!;
  const from = '2001:db8:1:2::1';
  let now = performance.now();
  t.mock.method(performance, 'now', () => now);
  await (await rpcFrom(s.url, basic('bob', 'bob-password'), from, getRecord())).arrayBuffer();
  // A security change empties the shared cache, so the next requests rest on the remembered proof, minute after minute.
  const verify = countVerify(t);
  for (let minute = 1; minute <= 4; minute++) {
    store.setPassword('alice', `alice-password-${minute}`, 'Reader');
    now += 60_000;
    await (await rpcFrom(s.url, basic('bob', 'bob-password'), from, getRecord())).arrayBuffer();
  }
  assert.equal(verify.n, 0, 'remembered for four minutes without a hash');
  store.setPassword('alice', 'alice-password-5', 'Reader');
  now += 60_000 + 1;
  await (await rpcFrom(s.url, basic('bob', 'bob-password'), from, getRecord())).arrayBuffer();
  assert.ok(verify.n > 0, 'five minutes after the password was last hashed it is hashed again');
});

const charts = join(import.meta.dirname, '../../../fixtures/fmp12/Charts.fmp12');

test('a remembered proof ends at once when the LAN blank-password opt-in is switched off', { skip: existsSync(charts) ? false : 'fixtures missing: run npm run fixtures' }, async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-mcp-basic-blank-'));
  copyFileSync(charts, join(dir, 'Charts.fmp12'));
  const s = await serve({ dir, port: 0, watch: false, log: () => {}, mcpToken: 'separate-admin-secret', proxyHeader: 'x-forwarded-for' as never, trustedProxies: ['127.0.0.1', '::1'] });
  t.after(async () => {
    await new Promise<void>((resolve) => s.server.close(() => resolve()));
    rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
  });
  const store = s.host.get('Charts')!;
  const from = '192.168.1.50';
  const describe = async () => {
    const r = await rpcFrom(s.url, basic('Admin', ''), from, { method: 'tools/call', params: { name: 'describe_database', arguments: { database: 'Charts' } } });
    const body = await r.text();
    return r.status === 200 && !body.includes('"isError":true') && !body.includes('"error"');
  };
  // The file's own blank password is let in from this LAN only while the opt-in is on.
  assert.equal(await describe(), false, 'refused before the opt-in');
  store.setAllowBlankPasswordFromLan(true);
  assert.equal(await describe(), true, 'admitted with the opt-in');
  assert.equal(basicCredentialsRemembered(s.host, { account: 'Admin', password: '', from }), true);
  store.setAllowBlankPasswordFromLan(false);
  assert.equal(await describe(), false, 'refused at once when the opt-in is switched off');
  assert.equal(basicCredentialsRemembered(s.host, { account: 'Admin', password: '', from }), false);
  // Switching it on again needs nothing special: the next request is checked and admitted.
  store.setAllowBlankPasswordFromLan(true);
  assert.equal(await describe(), true, 'admitted again once it is back on');
});

/** An open event stream from another local address (127.0.0.2); resolves with its status once the headers arrive, and is closed by `end`. */
const holdStream = (base: string, authorization: string, localAddress: string) => new Promise<{ status: number; end: () => void }>((resolve, reject) => {
  const url = new URL(base);
  const req = request({ host: url.hostname, port: url.port, path: '/mcp', method: 'GET', localAddress, headers: { authorization, accept: 'text/event-stream', 'mcp-protocol-version': '2025-06-18' } }, (res) => {
    res.resume();
    resolve({ status: res.statusCode ?? 0, end: () => req.destroy() });
  });
  req.on('error', (e) => { if ((e as NodeJS.ErrnoException).code !== 'ECONNRESET') reject(e); });
  req.end();
});

test('streams opened with a made-up password for an account do not take that account\'s own streams or calls', async (t) => {
  const s = await start(t);
  assert.equal((await proveAlice(s.url)).status, 200);
  const open: { end: () => void }[] = [];
  t.after(() => { for (const stream of open) stream.end(); });
  // Someone at another address names alice with passwords that are not hers, more times than one account may hold streams.
  const statuses: number[] = [];
  for (let i = 0; i < 12; i++) {
    const stream = await holdStream(s.url, basic('alice', 'guess-same'), '127.0.0.2');
    open.push(stream);
    statuses.push(stream.status);
  }
  assert.ok(statuses.includes(200), `the attacker's streams were held: ${statuses.join(',')}`);
  assert.ok(statuses.includes(503), `and stopped at the cap for one identity: ${statuses.join(',')}`);
  // Alice, with her real password, is not turned away: not for a stream, and not for a call.
  const mine = await holdStream(s.url, basic('alice', 'alice-password'), '127.0.0.1');
  open.push(mine);
  assert.equal(mine.status, 200, 'alice\'s own stream opens while the made-up ones are held');
  assert.equal((await rpc(s.url, basic('alice', 'alice-password'))).status, 200, 'and so does her call');
});
