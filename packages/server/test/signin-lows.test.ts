import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { serve, PgServer } from '../src/index.ts';
import { PgClient } from './pg-client.ts';
import { StreamSlots } from '../src/stream-slots.ts';
import { IdentityInFlight } from '../src/in-flight.ts';

const password = ['test', 'password'].join('-');
const adminToken = ['administrator', 'test', 'credential'].join('-');
const basic = (pw = password) => `Basic ${Buffer.from(`User:${pw}`).toString('base64')}`;
async function setup(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-signin-lows-'));
  const s = await serve({ dir, port: 0, watch: false, log: () => {}, mcpToken: adminToken });
  t.after(async () => { await new Promise<void>((resolve) => s.server.close(() => resolve())); rmSync(dir, { recursive: true, force: true }); });
  const store = s.host.create('Test');
  store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name' }] }]);
  store.create('Items', { Name: 'Synthetic' });
  const full = store.privilegeSets().find((p) => p.name === '[Full Access]')!;
  store.savePrivilegeSet({ ...full, extendedPrivileges: [...full.extendedPrivileges, 'fmxdbc', 'fmodata', 'fmxml'] });
  store.setPassword('User', password, '[Full Access]');
  return { ...s, store };
}
const rpc = (url: string, authorization: string) => fetch(`${url}/mcp`, {
  method: 'POST', headers: { authorization, accept: 'application/json, text/event-stream', 'content-type': 'application/json' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
});

for (const path of ['/tabularius/sql/v1/databases/Test/tables', '/fmi/odata/v4/Test/$metadata', '/fmi/xml/fmresultset.xml?-db=Test&-lay=Items&-findall', '/mcp']) {
  test(`blockNewUsers refuses Basic at ${path}, including cached passwords`, async (t) => {
    const s = await setup(t);
    const call = () => path === '/mcp' ? rpc(s.url, basic()) : fetch(s.url + path, { headers: { authorization: basic() } });
    const before = await call(); const beforeBody = await before.text();
    if (path.startsWith('/fmi/xml')) assert.match(beforeBody, /<error code="0"/);
    assert.equal(before.status, 200, 'the synthetic account can use the surface');
    s.host.config.setBlockNewUsers(true);
    const blocked = await call(); const body = await blocked.text();
    if (path.startsWith('/fmi/xml')) assert.match(body, /<error code="812"/);
    else assert.equal(blocked.status, 503);
    s.host.config.setBlockNewUsers(false);
    const after = await call(); await after.arrayBuffer();
    assert.equal(after.status, 200);
  });
}

test('pgwire already refuses new users while existing sessions continue', async (t) => {
  const s = await setup(t);
  const pg = new PgServer(s.host, { port: 0 });
  const port = await pg.listen();
  const opts = { port, user: 'User', password, database: 'Test' };
  try {
    const client = await PgClient.open(opts);
    try {
      s.host.config.setBlockNewUsers(true);
      await assert.rejects(PgClient.open(opts), /57P03/);
      assert.equal((await client.simple('SELECT 1')).error, undefined);
    } finally { client.close(); }
  } finally { pg.close(); }
});

test('wrong MCP bearer guesses are throttled locally without throttling a valid administrator', async (t) => {
  const s = await setup(t);
  const now = performance.now();
  t.mock.method(performance, 'now', () => now);
  const statuses = new Set<number>();
  for (let i = 0; i < 70; i++) {
    const r = await rpc(s.url, `Bearer ${['wrong', String(i)].join('-')}`);
    statuses.add(r.status); await r.arrayBuffer();
  }
  assert.ok(statuses.has(429), 'wrong bearer guesses spend a bounded address budget');
  const valid = await rpc(s.url, `Bearer ${adminToken}`); await valid.arrayBuffer();
  assert.equal(valid.status, 200);
});

for (const method of ['GET', 'POST']) test(`unverified MCP Basic ${method} quotas do not charge the claimed account`, async (t) => {
  const s = await setup(t);
  const identities: string[] = [];
  const slots = method === 'GET' ? StreamSlots.prototype : IdentityInFlight.prototype;
  // Capture the identity passed to the real quota boundary without holding network connections open.
  t.mock.method(slots, 'enter', (identity: string) => { identities.push(identity); return undefined; });
  for (const auth of [basic('wrong'), basic()]) {
    const r = method === 'GET' ? await fetch(s.url + '/mcp', { headers: { authorization: auth, accept: 'text/event-stream' } }) : await rpc(s.url, auth);
    await r.arrayBuffer();
  }
  assert.equal(identities.length, 2);
  assert.notEqual(identities[0], identities[1], 'a guessed name cannot reserve the real credential quota, even at the same address');
  assert.ok(identities.every((key) => !key.includes(password)), 'quota keys do not contain passwords');
});
