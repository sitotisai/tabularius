// While another session's transaction holds the file and has changed what a sign-in decides from (a script's Open Transaction
// with Reset Account Password, say), a request that carries an API token is answered "busy" (503, try again), never with a
// failure that has no body, and the session a token already has is kept: nothing a busy answer says ends it.
import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DataApi } from '../src/index.ts';
import { serve } from '../src/index.ts';
import { endTransaction, writer, type Store, type Transaction } from '../../store/src/index.ts';
import { signInForm } from './oauth-form.ts';

const REDIRECT = 'https://claude.ai/api/mcp/auth_callback';

async function start(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-signin-hold-requests-'));
  const running = await serve({ dir, port: 0, watch: false, log: () => {}, mcpToken: 'separate-admin-secret' } as never);
  t.after(async () => {
    await new Promise<void>((resolve) => running.server.close(() => resolve()));
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });
  const store = running.host.create('A');
  store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Title' }] }]);
  store.create('Items', { Title: 'row' });
  const full = store.privilegeSets().find((p) => p.id === 1)!;
  store.savePrivilegeSet({ ...full, extendedPrivileges: [...new Set([...full.extendedPrivileges, 'fmrest', 'fmmcp', 'fmxdbc', 'fmodata'])] });
  store.setPassword('ann', 'ann-password', full.name);
  for (const account of ['ann']) store.accountIdentityId(account);
  return { running, store, full, url: running.url };
}

/** A transaction of another session that holds the file; `state` also has it change sign-in state (a password set in it). */
function holdFile(store: Store, state: boolean, setPassword: (account: string) => void): Transaction {
  const tx: Transaction = { files: new Map() };
  writer.run({ transaction: { open: tx } }, () => store.create('Items', { Title: 'held' }));
  if (state) writer.run({ transaction: { open: tx } }, () => setPassword('zed'));
  return tx;
}

const mcpCall = (url: string, token: string) => fetch(`${url}/mcp`, {
  method: 'POST',
  headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-06-18' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
});

test('an MCP request with an API token is answered busy while a transaction has changed sign-in state, and works again after it', async (t) => {
  const { store, full, url } = await start(t);
  const token = store.createApiToken('ann', { label: 'app', surfaces: ['fmmcp'] });
  assert.equal((await mcpCall(url, token)).status, 200);

  const records = holdFile(store, false, () => {});
  assert.equal((await mcpCall(url, token)).status, 200, 'a transaction that only changes records does not stop it');
  endTransaction(records, false);

  const tx = holdFile(store, true, (account) => store.setPassword(account, 'zed-password', full.name));
  const busy = await mcpCall(url, token);
  const body = await busy.text();
  assert.equal(busy.status, 503, body);
  assert.equal(busy.headers.get('retry-after'), '1');
  assert.match(JSON.parse(body).error.message, /busy|in use|try again/i);
  endTransaction(tx, false);
  assert.equal((await mcpCall(url, token)).status, 200, 'after the rollback the same token is honoured');
});

test('a calendar feed opened with a token is answered busy, not failed, while a transaction has changed sign-in state', async (t) => {
  const { store, full, url } = await start(t);
  const feed = store.createApiToken('ann', { label: 'feed', readOnly: true, layouts: ['Items'], surfaces: ['fmrest'] });
  const open = () => fetch(`${url}/tabularius/calendar/v1/databases/A/layouts/Items/calendar.ics?token=${feed}`);
  const tx = holdFile(store, true, (account) => store.setPassword(account, 'zed-password', full.name));
  const busy = await open();
  const text = await busy.text();
  assert.equal(busy.status, 503, text);
  assert.equal(JSON.parse(text).messages[0].code, '301');
  assert.equal(busy.headers.get('retry-after'), '1');
  endTransaction(tx, false);
  assert.notEqual((await open()).status, 503);
});

test('the Data API session a token already has is not ended by a transaction that has changed sign-in state', async (t) => {
  const { running, store, full } = await start(t);
  const api = new DataApi(running.host);
  const token = store.createApiToken('ann', { label: 'x', surfaces: ['fmrest'] });
  const req = { headers: { authorization: `Bearer ${token}` }, socket: {}, url: '/fmi/data/vLatest/databases/A/layouts/Items/records' } as unknown as IncomingMessage;
  assert.equal(api.authorize(req, 'A').account, 'ann');
  assert.equal(api.alive(token), true);

  const tx = holdFile(store, true, (account) => store.setPassword(account, 'zed-password', full.name));
  assert.equal(api.accountDisabled(token), false, 'busy is not "turned off"');
  assert.equal(api.alive(token), true, 'the session, its globals and its locks are kept');
  assert.equal(api.sessionCount, 1);
  endTransaction(tx, false);
  assert.equal(api.accountDisabled(token), false);
  assert.equal(api.alive(token), true);

  // A token that really is revoked still ends its session.
  store.revokeApiToken(/^ohbt_([0-9a-f]+)\./.exec(token)![1]);
  assert.equal(api.accountDisabled(token), true);
  assert.equal(api.sessionCount, 0);
});

test('signing an OAuth app out while a transaction has changed sign-in state is answered busy and keeps the sign-in to end later', async (t) => {
  const { store, full, url } = await start(t);
  const form = (o: Record<string, string>) => new URLSearchParams(o).toString();
  const post = (path: string, body: string, type = 'application/x-www-form-urlencoded') => fetch(url + path, { method: 'POST', headers: { 'content-type': type }, body });
  const registered = await post('/oauth/register', JSON.stringify({ client_name: 'Claude', redirect_uris: [REDIRECT] }), 'application/json');
  assert.equal(registered.status, 201);
  const { client_id } = await registered.json() as { client_id: string };
  const verifier = randomBytes(32).toString('base64url');
  const signed = await signInForm(url, {
    client_id, redirect_uri: REDIRECT, response_type: 'code', code_challenge: createHash('sha256').update(verifier).digest('base64url'),
    code_challenge_method: 'S256', state: 'xyz', resource: `${url}/mcp`, database: 'A', account: 'ann', password: 'ann-password',
  });
  assert.equal(signed.status, 302, await signed.clone().text());
  const code = new URL(signed.headers.get('location')!).searchParams.get('code')!;
  const issued = await post('/oauth/token', form({ grant_type: 'authorization_code', code, code_verifier: verifier, client_id, redirect_uri: REDIRECT }));
  assert.equal(issued.status, 200);
  const pair = await issued.json() as { access_token: string; refresh_token: string };
  assert.equal((await mcpCall(url, pair.access_token)).status, 200);

  const tx = holdFile(store, true, (account) => store.setPassword(account, 'zed-password', full.name));
  for (const token of [pair.access_token, pair.refresh_token]) {
    const busy = await post('/oauth/revoke', form({ token, client_id }));
    assert.equal(busy.status, 503, await busy.text());
    assert.equal(busy.headers.get('retry-after'), '1');
  }
  endTransaction(tx, false);
  // Nothing was lost by the refusal: the app tries again and the sign-in ends.
  assert.equal((await mcpCall(url, pair.access_token)).status, 200);
  assert.equal((await post('/oauth/revoke', form({ token: pair.access_token, client_id }))).status, 200);
  assert.equal((await mcpCall(url, pair.access_token)).status, 401);
});

test('the other surfaces that take an API token answer busy, not an error, while a transaction has changed sign-in state', async (t) => {
  const { store, full, url } = await start(t);
  const token = store.createApiToken('ann', { label: 'app' });
  const get = (path: string) => fetch(`${url}${path}`, { headers: { authorization: `Bearer ${token}` } });
  const paths = ['/fmi/data/vLatest/databases/A/layouts/Items/records', '/fmi/odata/v4/A/Items', '/tabularius/sql/v1/databases/A/tables'];
  for (const path of paths) assert.equal((await get(path)).status, 200, path);
  const tx = holdFile(store, true, (account) => store.setPassword(account, 'zed-password', full.name));
  for (const path of paths) {
    const busy = await get(path);
    const body = await busy.text();
    assert.ok(busy.status === 503 || busy.status === 409, `${path} ${busy.status} ${body.slice(0, 100)}`);
  }
  endTransaction(tx, false);
  for (const path of paths) assert.equal((await get(path)).status, 200, path);
});
