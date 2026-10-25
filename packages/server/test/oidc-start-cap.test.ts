// The sign-in start routes need no sign-in, and each one writes a row that waits ten minutes. One client must not be able to
// fill the table and so refuse everyone else's sign-in: each client address holds a few rows (its own oldest go first), starts
// are rate-limited per address, and when the table is full the address holding the most rows gives one up before a small
// address is refused.
import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Host } from '../src/host.ts';
import { DataApi } from '../src/dataapi.ts';
import { Oidc } from '../src/oidc.ts';
import { AddressBudget } from '../src/address-budget.ts';
import { setClientAddress } from '../src/client-address.ts';

interface Limits { maxPending?: number; perAddress?: number; starts?: AddressBudget }

async function setup(t: TestContext, limits: Limits = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-oidc-start-cap-'));
  const host = new Host(dir, () => {}, { background: false });
  host.create('Review');
  let issuer = '';
  const provider = createServer((_req, res) => res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ issuer, authorization_endpoint: `${issuer}/authorize` })));
  await new Promise<void>((resolve) => provider.listen(0, '127.0.0.1', resolve));
  issuer = `http://127.0.0.1:${(provider.address() as { port: number }).port}`;
  // Plenty of starts a second unless a test is about the rate: the cap on rows is what these tests look at.
  const oidc = new Oidc(host, new DataApi(host), { name: 'Review', issuer, clientId: 'synthetic' }, undefined, { starts: new AddressBudget(100_000, 100_000), ...limits });
  // A test says which client address a request comes from.
  const server = createServer((req, res) => {
    setClientAddress(req, String(req.headers['x-test-address'] ?? '127.0.0.1'));
    void oidc.handle(req, res, new URL(req.url!, 'http://localhost'));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const db = new DatabaseSync(join(dir, '.openhbam-oidc', 'pending.sqlite'));
  t.after(async () => {
    for (const s of [server, provider]) await new Promise<void>((resolve) => s.close(() => resolve()));
    oidc.close(); db.close(); await host.close(); rmSync(dir, { recursive: true, force: true });
  });
  /** Starts a sign-in from an address; the state it was given, or the message it was refused with. */
  const start = async (address: string): Promise<{ state: string } | { refused: string }> => {
    const r = await fetch(`${base}/tabularius/auth/v1/oidc/start?db=Review`, { redirect: 'manual', headers: { 'x-test-address': address } });
    await r.arrayBuffer();
    const location = decodeURIComponent(r.headers.get('location') ?? '');
    const state = /[?&]state=([^&]+)/.exec(location)?.[1];
    return state ? { state } : { refused: location };
  };
  const states = (address?: string) => (db.prepare(address ? 'SELECT state FROM pending WHERE address = ? ORDER BY created, rowid' : 'SELECT state FROM pending ORDER BY created, rowid').all(...(address ? [address] : [])) as { state: string }[]).map((r) => r.state);
  const callback = async (state: string, address: string): Promise<string> => {
    const r = await fetch(`${base}/tabularius/auth/v1/oidc/callback?state=${state}&code=x`, { redirect: 'manual', headers: { 'x-test-address': address } });
    await r.arrayBuffer();
    return decodeURIComponent(r.headers.get('location') ?? '');
  };
  return { start, states, db, base, callback, oidc };
}
const ok = (r: { state: string } | { refused: string }): string => { assert.ok('state' in r, `refused: ${'refused' in r ? r.refused : ''}`); return r.state; };

test('one client address holds a few pending sign-ins, and a flood from it only replaces its own oldest', async (t) => {
  const { start, states } = await setup(t, { perAddress: 4 });
  const mine: string[] = [];
  for (let i = 0; i < 12; i++) mine.push(ok(await start('203.0.113.7')));
  assert.deepEqual(states('203.0.113.7'), mine.slice(-4), 'the newest four stay');
  // Someone else still signs in, and the flood does not touch their row.
  const other = ok(await start('198.51.100.9'));
  for (let i = 0; i < 12; i++) ok(await start('203.0.113.7'));
  assert.deepEqual(states('198.51.100.9'), [other]);
});

test('an IPv6 /64 counts as one client address', async (t) => {
  const { start, states } = await setup(t, { perAddress: 3 });
  for (let i = 0; i < 8; i++) ok(await start(`2001:db8:1:2:${(i + 1).toString(16)}::1`));
  assert.equal(states().length, 3);
});

test('a full table gives a row from the address holding the most before a small address is refused', async (t) => {
  const { start, states } = await setup(t, { maxPending: 10, perAddress: 4 });
  const heavy = [ok(await start('203.0.113.1')), ok(await start('203.0.113.1')), ok(await start('203.0.113.1')), ok(await start('203.0.113.1'))];
  const next = [ok(await start('203.0.113.2')), ok(await start('203.0.113.2')), ok(await start('203.0.113.2')), ok(await start('203.0.113.2'))];
  const small = [ok(await start('203.0.113.3')), ok(await start('203.0.113.4'))];
  assert.equal(states().length, 10);
  const real = ok(await start('198.51.100.20'));
  assert.equal(states().length, 10, 'the table stays within its size');
  assert.ok(states().includes(real));
  assert.ok(!states().includes(heavy[0]), 'the oldest row of the address with the most rows went (the older of the two with four)');
  for (const kept of [...heavy.slice(1), ...next, ...small]) assert.ok(states().includes(kept), 'nothing else was evicted');
  // Again: the address that now holds the most is the one that gives up a row; the single-row addresses keep theirs.
  ok(await start('198.51.100.21'));
  for (const kept of small) assert.ok(states().includes(kept));
  assert.ok(states().includes(real));
});

test('a table full of single sign-ins from different addresses refuses a new one and evicts nobody', async (t) => {
  const { start, states } = await setup(t, { maxPending: 5, perAddress: 4 });
  const held = [];
  for (let i = 1; i <= 5; i++) held.push(ok(await start(`203.0.113.${i}`)));
  const refused = await start('198.51.100.30');
  assert.ok('refused' in refused);
  assert.match((refused as { refused: string }).refused, /Too many sign-ins/);
  assert.deepEqual(states(), held);
});

test('rows without a recorded address (from before this was kept) are never evicted to make room', async (t) => {
  const { start, states, db } = await setup(t, { maxPending: 6, perAddress: 4 });
  const insert = db.prepare("INSERT INTO pending (state,provider,database,verifier,nonce,redirect_uri,expires,flow) VALUES (?, 'review', 'Review', 'v', 'n', 'http://localhost/callback', ?, 'web')");
  for (let i = 0; i < 6; i++) insert.run(`old-${i}`, Date.now() + 60_000);
  const refused = await start('198.51.100.40');
  assert.ok('refused' in refused);
  assert.equal(states().length, 6);
});

test('starts are rate-limited per address, and another address is not affected', async (t) => {
  let now = 0;
  const { start } = await setup(t, { starts: new AddressBudget(3, 1, () => now) });
  for (let i = 0; i < 3; i++) ok(await start('203.0.113.50'));
  const limited = await start('203.0.113.50');
  assert.ok('refused' in limited);
  assert.match((limited as { refused: string }).refused, /Too many sign-in attempts from this address/);
  ok(await start('203.0.113.51'));
  now += 2000;
  ok(await start('203.0.113.50'));
});

const CANCELLED = /cancelled because too many sign-ins were started from this address at once; please start again in a moment/;

test('a row evicted for its own address cannot finish a sign-in, and the person is told why', async (t) => {
  const { start, callback } = await setup(t, { perAddress: 2 });
  const first = ok(await start('203.0.113.60'));
  ok(await start('203.0.113.60'));
  ok(await start('203.0.113.60'));
  const message = await callback(first, '203.0.113.60');
  assert.match(message, CANCELLED);
  assert.doesNotMatch(message, /took too long/);
  // The note is used up with the answer: a second try with the same state is the ordinary "already used".
  assert.match(await callback(first, '203.0.113.60'), /took too long or was already used/);
});

test('a row given up to a full table is explained the same way, and an unknown state keeps the ordinary text', async (t) => {
  const { start, callback } = await setup(t, { maxPending: 3, perAddress: 4 });
  const heavy = [ok(await start('203.0.113.1')), ok(await start('203.0.113.1'))];
  ok(await start('203.0.113.2'));
  ok(await start('198.51.100.20'));
  assert.match(await callback(heavy[0], '203.0.113.1'), CANCELLED);
  assert.match(await callback('never-started', '203.0.113.1'), /took too long or was already used/);
});

test('the note of evicted sign-ins stays bounded however many are evicted', async (t) => {
  const { start, oidc } = await setup(t, { maxPending: 5, perAddress: 1 });
  for (let i = 0; i < 40; i++) ok(await start('203.0.113.70'));
  const noted = (oidc as unknown as { evicted: Map<string, number> }).evicted;
  assert.ok(noted.size <= 5, `kept ${noted.size}`);
  assert.ok(noted.size >= 1);
});

test('a refused start answers a Data API app with 429 and Retry-After, not a 400', async (t) => {
  let now = 0;
  const { base } = await setup(t, { starts: new AddressBudget(1, 1, () => now) });
  const ask = () => fetch(`${base}/oauth/getoauthurl?trackingID=t&provider=Review`, { headers: { 'x-fms-return-url': `${base}/my-app/`, 'x-test-address': '203.0.113.80' } });
  const first = await ask();
  await first.arrayBuffer();
  assert.equal(first.status, 200);
  const limited = await ask();
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get('retry-after')) >= 1);
  assert.match(((await limited.json()) as { error: string }).error, /Too many sign-in attempts from this address/);
});
