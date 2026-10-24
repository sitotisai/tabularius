// Minting recovery codes or starting a passkey registration is a credential change that outlives the session or API
// token making it, so it asks for the account's password (and its one-time code when it has one) as changing the
// password does. A bearer token alone is not enough. Runs on a created file, no fixtures.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, totpCode } from '../../store/src/index.ts';
import { serve } from '../src/index.ts';

let dir = '', base = '', token = '', apiToken = '';
let s: Awaited<ReturnType<typeof serve>>;
const password = ['correct', 'horse', 'battery'].join('-');
const url = (path: string) => `${base}/fmi/data/vLatest/databases/Shop/${path}`;

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-credential-reauth-'));
  createStore(join(dir, 'Shop.openhbam.sqlite'), { mode: 'native' });
  s = await serve({ dir, port: 0, watch: false, log: () => {} });
  base = s.url.replace(/\/$/, '');
  const store = s.host.get('Shop')!;
  const full = store.privilegeSets().find((p) => p.id === 1)!;
  store.savePrivilegeSet({ ...full, extendedPrivileges: [...new Set([...full.extendedPrivileges, 'fmrest'])] });
  store.setPassword('Chief', password, full.name);
  const r = await fetch(url('sessions'), { method: 'POST', headers: { authorization: 'Basic ' + btoa(`Chief:${password}`), 'content-type': 'application/json' }, body: '{}' });
  token = ((await r.json()) as { response: { token: string } }).response.token;
  apiToken = store.createApiToken('Chief');
});
after(async () => {
  await new Promise<void>((r) => (s ? s.server.close(() => r()) : r()));
  if (dir) rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
});

const post = async (bearer: string, path: string, body: unknown) => {
  const r = await fetch(url(path), { method: 'POST', headers: { authorization: `Bearer ${bearer}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const j = (await r.json()) as { response: Record<string, unknown>; messages: { code: string }[] };
  return { status: r.status, code: j.messages[0].code, response: j.response };
};

for (const [name, path] of [['recovery codes', 'recovery-codes'], ['a passkey registration challenge', 'passkey/register/options']] as const) {
  test(`${name} need the password, whatever the session or API token`, async () => {
    const store = s.host.get('Shop')!;
    const minted = store.recoveryCodesRemaining('Chief');
    for (const bearer of [token, apiToken]) {
      assert.deepEqual(await post(bearer, path, {}).then(({ status, code }) => ({ status, code })), { status: 400, code: '960' }, 'no password');
      assert.deepEqual(await post(bearer, path, { password: 'wrong' }).then(({ status, code }) => ({ status, code })), { status: 401, code: '212' }, 'wrong password');
    }
    assert.equal(store.recoveryCodesRemaining('Chief'), minted, 'nothing was minted');
    for (const bearer of [token, apiToken]) {
      const ok = await post(bearer, path, { password });
      assert.equal(ok.status, 200, 'the right password is accepted');
      assert.ok(path === 'recovery-codes' ? Array.isArray(ok.response.codes) : typeof ok.response.challenge === 'string');
    }
  });
}

test('an account with a one-time code also needs it for those changes', async () => {
  const store = s.host.get('Shop')!;
  const { secret } = store.enrollTotp('Chief');
  assert.equal(store.confirmTotp('Chief', totpCode(secret)), true);
  try {
    for (const path of ['recovery-codes', 'passkey/register/options']) {
      assert.deepEqual(await post(token, path, { password }).then(({ status, code }) => ({ status, code })), { status: 401, code: '1211' }, `${path} without a code`);
      assert.deepEqual(await post(token, path, { password, code: '000000' }).then(({ status, code }) => ({ status, code })), { status: 401, code: '1211' }, `${path} with a wrong code`);
    }
    // The right password and a current code are accepted.
    const ok = await post(token, 'recovery-codes', { password, code: totpCode(secret) });
    assert.equal(ok.status, 200);
    assert.ok(Array.isArray(ok.response.codes));
  } finally { store.disableTotp('Chief'); }
});
