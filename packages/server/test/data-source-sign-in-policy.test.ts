// fmDataSource logs in to a second file with that file's own account. That sign-in has to meet the same rules a
// direct sign-in to the file does: a local-only account is refused away from the server, and an account that owes a
// password change is refused (the session of the first file cannot be used to change the second file's password).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { serve } from '../src/index.ts';
import { STORE_EXT } from '../src/host.ts';
import { createStore, Store } from '../../store/src/index.ts';

const password = ['data', 'source', 'pw'].join('-');
const REMOTE = '203.0.113.9';

async function app(t: import('node:test').TestContext, proxied: boolean) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-ds-policy-'));
  for (const name of ['A', 'B']) createStore(join(dir, name + STORE_EXT));
  const b = new Store(join(dir, 'B' + STORE_EXT), 'B');
  for (const name of ['Clerk', 'Local']) b.setPassword(name, password, '[Full Access]');
  b.setAccountLocalOnly('Local', true);
  b.setPassword('Owes', password, '[Full Access]', { mustChange: true });
  b.close();
  const a = new Store(join(dir, 'A' + STORE_EXT), 'A');
  a.setPassword('Ann', password, '[Full Access]');
  a.close();
  const s = await serve({ dir, port: 0, watch: false, log: () => {}, ...(proxied ? { trustedProxies: ['127.0.0.1'], proxyHeader: 'x-forwarded-for' } : {}) });
  t.after(async () => {
    s.server.closeAllConnections();
    await new Promise<void>((r) => s.server.close(() => r()));
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });
  const login = async (username?: string, from?: string) => {
    const r = await fetch(`${s.url}/fmi/data/vLatest/databases/A/sessions`, {
      method: 'POST',
      headers: { authorization: 'Basic ' + btoa(`Ann:${password}`), 'content-type': 'application/json', ...(from ? { 'x-forwarded-for': from } : {}) },
      body: JSON.stringify(username ? { fmDataSource: [{ database: 'B', username, password }] } : {}),
    });
    return { status: r.status, body: await r.json() as { messages: { code: string; message: string }[] } };
  };
  return { login };
}

test('a data-source login refuses a local-only account away from the server, as a wrong password', async (t) => {
  const { login } = await app(t, true);
  const wrong = await login('Nobody', REMOTE);
  assert.equal(wrong.status, 401);
  const local = await login('Local', REMOTE);
  assert.deepEqual(local, wrong);
  assert.equal((await login('Clerk', REMOTE)).status, 200);
});

test('a data-source login refuses an account that owes a password change', async (t) => {
  const { login } = await app(t, false);
  const owes = await login('Owes');
  assert.equal(owes.status, 403);
  assert.match(owes.body.messages[0].message, /must change its password/);
  assert.equal((await login('Clerk')).status, 200);
});

test('a data-source login still lets a local-only account in from the server itself', async (t) => {
  const { login } = await app(t, false);
  assert.equal((await login('Local')).status, 200);
});
