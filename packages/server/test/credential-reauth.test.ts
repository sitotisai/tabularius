// Minting recovery codes or starting a passkey registration is a credential change that outlives the session or API
// token making it, so it asks for the account's password (and its one-time code when it has one) as changing the
// password does. A bearer token alone is not enough. Runs on a created file, no fixtures.
import { test, before, after, mock } from 'node:test';
import crypto from 'node:crypto';
import { syncBuiltinESMExports } from 'node:module';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, hashPassword, totpCode } from '../../store/src/index.ts';
import { LOCKOUT } from '../../store/src/sign-in-failures.ts';
import { makeAuthenticator, forgeRegistration } from '../../store/test/forge-webauthn.ts';
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

const rejected = (r: { status: number; code: string }) => ({ status: r.status, code: r.code });

test('wrong passwords here count toward the sign-in lockout and are audited as failed sign-ins', async () => {
  const store = s.host.get('Shop')!;
  const full = store.privilegeSets().find((p) => p.id === 1)!;
  store.setPassword('Locky', password, full.name);
  const bearer = store.createApiToken('Locky');
  const failures = () => store.auditLog({ security: true, limit: 500 }).filter((e) => e.kind === 'sign-in-failed' && e.account === 'Locky').length;
  for (let i = 0; i < LOCKOUT.attempts; i++) assert.deepEqual(rejected(await post(bearer, 'recovery-codes', { password: `wrong-${i}` })), { status: 401, code: '212' });
  assert.equal(failures(), LOCKOUT.attempts, 'each wrong password is a failed sign-in in the security audit');
  // Locked out: even the right password is refused, and the answer says so and how long, as at sign-in.
  const locked = await fetch(url('recovery-codes'), { method: 'POST', headers: { authorization: `Bearer ${bearer}`, 'content-type': 'application/json' }, body: JSON.stringify({ password }) });
  const body = (await locked.json()) as { messages: { code: string; message: string }[] };
  assert.equal(locked.status, 401);
  assert.match(body.messages[0].message, /Too many failed sign-ins; try again after/);
  assert.ok(Number(locked.headers.get('retry-after')) > 0, 'with the seconds to wait');
  assert.equal(store.recoveryCodesRemaining('Locky'), 0);
});

test('a one-time code cannot be used twice here', async () => {
  const store = s.host.get('Shop')!;
  const full = store.privilegeSets().find((p) => p.id === 1)!;
  store.setPassword('Otto', password, full.name);
  const bearer = store.createApiToken('Otto');
  const { secret } = store.enrollTotp('Otto');
  assert.equal(store.confirmTotp('Otto', totpCode(secret)), true);
  const code = totpCode(secret, Math.floor(Date.now() / 1000 / 30) + 1);
  assert.equal((await post(bearer, 'recovery-codes', { password, code })).status, 200);
  assert.deepEqual(rejected(await post(bearer, 'recovery-codes', { password, code })), { status: 401, code: '1211' });
});

test('an account whose second factor is a passkey is not satisfied by a token and its password', async () => {
  const store = s.host.get('Shop')!;
  const full = store.privilegeSets().find((p) => p.id === 1)!;
  store.setPassword('Cara', password, full.name);
  const bearer = store.createApiToken('Cara');
  const challenge = store.issueWebauthnChallenge('register', 'Cara');
  const auth = makeAuthenticator(new URL(base).hostname, new URL(base).origin);
  store.registerPasskey('Cara', forgeRegistration(auth, challenge), { rpId: auth.rpId, origin: auth.origin, challenge });
  store.setAccountRequire2fa('Cara', true);
  // Signing in with the password alone is refused for the same reason.
  const signIn = await fetch(url('sessions'), { method: 'POST', headers: { authorization: 'Basic ' + btoa(`Cara:${password}`), 'content-type': 'application/json' }, body: '{}' });
  assert.equal(signIn.status, 401);
  for (const path of ['recovery-codes', 'passkey/register/options']) {
    const r = await post(bearer, path, { password });
    assert.equal(r.status, 403, path);
    assert.notEqual(r.code, '0');
  }
  assert.equal(store.recoveryCodesRemaining('Cara'), 0);
  assert.equal(store.passkeyIds('Cara').length, 1);
});

test('an account with no password here is told so, not that its password is wrong', async () => {
  const store = s.host.get('Shop')!;
  const full = store.privilegeSets().find((p) => p.id === 1)!;
  store.setPassword('Nopass', password, full.name);
  const bearer = store.createApiToken('Nopass');
  store.sql.prepare('UPDATE _fm_accounts SET password_hash = NULL, password_disabled = 1 WHERE name = ?').run('Nopass');
  for (const sent of [{ password }, { password: '' }]) {
    const r = await fetch(url('recovery-codes'), { method: 'POST', headers: { authorization: `Bearer ${bearer}`, 'content-type': 'application/json' }, body: JSON.stringify(sent) });
    const body = (await r.json()) as { messages: { message: string }[] };
    assert.equal(r.status, 403);
    assert.match(body.messages[0].message, /no password of its own in this file.*ask an administrator to set one/);
  }
  assert.equal(store.recoveryCodesRemaining('Nopass'), 0);
});

test('an empty password is not a proof, even when it is the stored one', async () => {
  const store = s.host.get('Shop')!;
  const full = store.privilegeSets().find((p) => p.id === 1)!;
  store.setPassword('Blanky', password, full.name);
  const bearer = store.createApiToken('Blanky');
  store.sql.prepare('UPDATE _fm_accounts SET password_hash = ? WHERE name = ?').run(hashPassword(''), 'Blanky');
  for (const path of ['recovery-codes', 'passkey/register/options']) {
    const r = await post(bearer, path, { password: '' });
    assert.deepEqual(rejected(r), { status: 403, code: '9' }, path);
  }
  assert.equal(store.recoveryCodesRemaining('Blanky'), 0);
});

test('the passkey-second-factor refusal says to ask an administrator', async () => {
  const bearer = s.host.get('Shop')!.createApiToken('Cara');
  const r = await fetch(url('recovery-codes'), { method: 'POST', headers: { authorization: `Bearer ${bearer}`, 'content-type': 'application/json' }, body: JSON.stringify({ password }) });
  const body = (await r.json()) as { messages: { message: string }[] };
  assert.match(body.messages[0].message, /passkey as its second factor.*ask an administrator/);
  assert.doesNotMatch(body.messages[0].message, /sign in with the passkey/, 'no dead-end advice: a passkey sign-in cannot confirm this either');
});

test('the passkey list says up front when this account cannot confirm a credential change', async () => {
  const list = async (bearer: string) => ((await (await fetch(url('passkey'), { headers: { authorization: `Bearer ${bearer}` } })).json()) as { response: { confirmBlocked?: string } }).response;
  const store = s.host.get('Shop')!;
  assert.equal((await list(token)).confirmBlocked, undefined);
  assert.match((await list(store.createApiToken('Cara'))).confirmBlocked ?? '', /passkey as its second factor/);
  assert.match((await list(store.createApiToken('Nopass'))).confirmBlocked ?? '', /ask an administrator to set one/);
  assert.match((await list(store.createApiToken('Blanky'))).confirmBlocked ?? '', /ask an administrator to set one/);
});

test('a wrong password here is a failed sign-in marked as a credential-change confirmation', async () => {
  const store = s.host.get('Shop')!;
  const full = store.privilegeSets().find((p) => p.id === 1)!;
  store.setPassword('Marked', password, full.name);
  assert.equal((await post(store.createApiToken('Marked'), 'recovery-codes', { password: 'wrong' })).status, 401);
  const failure = store.auditLog({ security: true, limit: 500 }).find((e) => e.kind === 'sign-in-failed' && e.account === 'Marked');
  assert.equal((failure?.changes as { reauth?: boolean } | undefined)?.reauth, true);
});

test('a locked-out person sees the real lockout even when the request comes from an address shared by many', async () => {
  const store = s.host.get('Shop')!;
  const full = store.privilegeSets().find((p) => p.id === 1)!;
  store.setPassword('Shared', password, full.name);
  const bearer = store.createApiToken('Shared');
  // A loopback request that carries forwarding headers nobody configured is "unknown", an address anyone may share.
  const ask = (sent: string) => fetch(url('recovery-codes'), { method: 'POST', headers: { authorization: `Bearer ${bearer}`, 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.9' }, body: JSON.stringify({ password: sent }) });
  for (let i = 0; i < LOCKOUT.attempts; i++) await ask(`wrong-${i}`);
  const locked = await ask(password);
  assert.equal(locked.status, 401);
  assert.match(((await locked.json()) as { messages: { message: string }[] }).messages[0].message, /Too many failed sign-ins; try again after/);
});

test('listing passkeys hashes no password for an account with an ordinary one (the empty-password check is remembered, and never on the main thread)', async () => {
  const sync = mock.method(crypto, 'scryptSync');
  const spun = mock.method(crypto, 'scrypt');
  syncBuiltinESMExports();
  try {
    const list = () => fetch(url('passkey'), { headers: { authorization: `Bearer ${token}` } }).then((r) => r.json());
    await list();
    assert.equal(sync.mock.callCount(), 0, 'the first listing hashes nothing on the main thread');
    await list();
    const before = spun.mock.callCount();
    for (let i = 0; i < 5; i++) await list();
    assert.equal(spun.mock.callCount(), before, 'later listings hash nothing at all');
    assert.equal(sync.mock.callCount(), 0);
  } finally { mock.restoreAll(); syncBuiltinESMExports(); }
});
