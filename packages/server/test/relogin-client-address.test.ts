// A script's Re-Login to a local-only account depends on where the request that runs the script comes from: the Data API
// hands the script that request's address, not the address the session was first signed in from.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { serve } from '../src/index.ts';

const password = ['re', 'login', 'addr'].join('-');

async function app(t: import('node:test').TestContext, proxied: boolean) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-relogin-addr-'));
  const s = await serve({ dir, port: 0, watch: false, log: () => {}, ...(proxied ? { trustedProxies: ['127.0.0.1'], proxyHeader: 'x-forwarded-for' } : {}) });
  t.after(async () => {
    s.server.closeAllConnections();
    await new Promise<void>((r) => s.server.close(() => r()));
    rmSync(dir, { recursive: true, force: true });
  });
  const store = s.host.create('Shop');
  store.applyDesign([
    { op: 'createTable', name: 'Items', fields: [{ name: 'Title' }] },
    { op: 'createScript', name: 'Step up', text: `Re-Login [ Account Name: "Local" ; Password: "${password}" ; With dialog: Off ]\nExit Script [ Text Result: Get ( AccountName ) ]` },
  ]);
  const full = store.privilegeSets().find((p) => p.id === 1)!;
  store.savePrivilegeSet({ ...full, extendedPrivileges: [...full.extendedPrivileges, 'fmrest'] });
  store.setPassword('Open', password, full.name);
  store.setPassword('Local', password, full.name);
  store.setAccountLocalOnly('Local', true);
  const run = async (from?: string) => {
    const headers: Record<string, string> = { ...(from ? { 'x-forwarded-for': from } : {}) };
    const login = await fetch(`${s.url}/fmi/data/vLatest/databases/Shop/sessions`, { method: 'POST', headers: { ...headers, authorization: 'Basic ' + btoa(`Open:${password}`), 'content-type': 'application/json' }, body: '{}' });
    const token = (await login.json() as { response: { token: string } }).response.token;
    const layout = store.schema.layouts[0].name;
    const r = await fetch(`${s.url}/fmi/data/vLatest/databases/Shop/layouts/${encodeURIComponent(layout)}/script/${encodeURIComponent('Step up')}`, { headers: { ...headers, authorization: `Bearer ${token}` } });
    return (await r.json() as { response: { scriptResult?: string; scriptError?: string } }).response;
  };
  return { run };
}

test('a Data API script can Re-Login to a local-only account when the request is from the server itself', async (t) => {
  const { run } = await app(t, false);
  assert.deepEqual(await run(), { scriptResult: 'Local', scriptError: '0' });
});

test('a Data API script run from another address cannot', async (t) => {
  const { run } = await app(t, true);
  const r = await run('203.0.113.9');
  assert.equal(r.scriptError, '212');
});
