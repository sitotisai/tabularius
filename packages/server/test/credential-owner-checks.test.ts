// Synthetic credentials only: unsafe regular files must never become sign-in authority.
import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, chownSync, linkSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { serve, setAdminPassword } from '../src/index.ts';
import { adminPasskeys, registerAdminPasskey, removeAdminPasskey, verifyAdminPasskeyAssertion } from '../src/admin-passkey.ts';
import { McpTokens, MCP_TOKENS_FILE } from '../src/mcp-tokens.ts';
import { Connections } from '../src/connections.ts';
import { forgeAssertion, forgeRegistration, makeAuthenticator } from '../../store/test/forge-webauthn.ts';
import { commandStubEnv } from '../../../scripts/test-command-stubs.ts';

const skip = process.platform === 'win32' && 'POSIX ownership and mode bits are not enforced on Windows';
const env = { rpId: 'localhost', origin: 'http://localhost', challenge: 'test-challenge' };
const attacks = ['owner', 'simulated owner', 'hard link', 'group writable', 'world writable', '0666'] as const;
type Attack = typeof attacks[number];

function folder(t: TestContext): string {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-credential-owner-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function plant(t: TestContext, file: string, attack: Attack): boolean {
  if (attack === 'simulated owner') {
    const uid = statSync(file).uid;
    t.mock.method(process as NodeJS.Process & { getuid(): number }, 'getuid', () => uid + 1);
  } else if (attack === 'owner') {
    const st = statSync(file);
    try { chownSync(file, st.uid === 0 ? 1 : 0, st.gid); }
    catch (error) {
      if (!['EPERM', 'EACCES'].includes((error as NodeJS.ErrnoException).code ?? '')) throw error;
      t.skip('changing file ownership requires privileges unavailable to this test user');
      return false;
    }
  } else if (attack === 'hard link') linkSync(file, file + '-alias');
  else chmodSync(file, attack === 'group writable' ? 0o620 : attack === 'world writable' ? 0o602 : 0o666);
  return true;
}

for (const attack of attacks) {
  test(`admin password refuses ${attack}, reports unusable, and repairs atomically`, { skip }, async (t) => {
    let server: Awaited<ReturnType<typeof serve>> | undefined;
    t.after(async () => { if (server) await new Promise<void>((done) => server!.server.close(() => done())); });
    const dir = folder(t), file = join(dir, '.openhbam-admin');
    const stub = commandStubEnv(t), previousPath = process.env.PATH;
    process.env.PATH = stub.PATH;
    t.after(() => { if (previousPath === undefined) delete process.env.PATH; else process.env.PATH = previousPath; });
    setAdminPassword(dir, 'original administrator password');
    const original = readFileSync(file, 'utf8');
    if (attack === 'simulated owner') server = await serve({ dir, port: 0, log: () => {} });
    if (!plant(t, file, attack)) return;
    server ??= await serve({ dir, port: 0, log: () => {} });
    const request = (password?: string) => fetch(server!.url + '/tabularius/admin/v1/logs', {
      headers: { 'x-tabularius-admin': '1', ...(password ? { authorization: 'Basic ' + Buffer.from('admin:' + password).toString('base64') } : {}) },
    });
    assert.equal((await request('original administrator password')).status, 401);
    const signIn = await fetch(server.url + '/tabularius/admin/v1/sign-in', {
      method: 'POST', headers: { 'x-tabularius-admin': '1', 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'original administrator password' }),
    });
    assert.equal(signIn.status, 401, 'the console sign-in rejects the planted password');
    assert.equal((await request()).status, 401, 'refusal never opens local passwordless access');
    const info = await (await fetch(server.url + '/tabularius/admin/v1/sign-in-info')).json();
    assert.equal(info.passwordSet, false);
    const warnings = () => server!.host.logs!.read('Event', { type: 'Warning', q: '.openhbam-admin' });
    assert.equal((await warnings()).entries.length, 1);
    t.mock.restoreAll();
    setAdminPassword(dir, 'repaired administrator password');
    assert.equal((await request('repaired administrator password')).status, 200);
    assert.equal((await (await fetch(server.url + '/tabularius/admin/v1/sign-in-info')).json()).passwordSet, true);
    assert.equal(statSync(file).nlink, 1);
    assert.equal(statSync(file).mode & 0o077, 0);
    if (attack === 'hard link') assert.equal(readFileSync(file + '-alias', 'utf8'), original, 'repair does not modify the other link');
    chmodSync(file, 0o666);
    assert.equal((await request('repaired administrator password')).status, 401);
    assert.equal((await warnings()).entries.length, 2, 'a second planting warns again after a valid read');
  });

  test(`admin passkeys refuse ${attack} on reads and locked updates`, { skip }, (t) => {
    const dir = folder(t), file = join(dir, '.openhbam-admin-passkeys');
    const auth = makeAuthenticator(env.rpId, env.origin);
    const { id } = registerAdminPasskey(dir, forgeRegistration(auth, env.challenge), env);
    assert.equal(adminPasskeys(dir).length, 1);
    verifyAdminPasskeyAssertion(dir, forgeAssertion(auth, env.challenge), env);
    if (!plant(t, file, attack)) return;
    const before = readFileSync(file, 'utf8');
    assert.deepEqual(adminPasskeys(dir), []);
    assert.throws(() => verifyAdminPasskeyAssertion(dir, forgeAssertion(auth, env.challenge), env));
    assert.throws(() => registerAdminPasskey(dir, forgeRegistration(auth, env.challenge), env));
    assert.throws(() => removeAdminPasskey(dir, id));
    assert.equal(readFileSync(file, 'utf8'), before, 'an update cannot launder planted credentials into a private file');
  });

  test(`MCP tokens refuse ${attack} even with a warm cache`, { skip }, (t) => {
    const dir = folder(t), file = join(dir, MCP_TOKENS_FILE);
    const tokens = new McpTokens(dir);
    const made = tokens.create({ database: 'Synthetic', account: 'Admin' });
    assert.deepEqual(tokens.check(made.token), { database: 'Synthetic', account: 'Admin' });
    assert.equal(tokens.list().length, 1);
    if (!plant(t, file, attack)) return;
    const before = readFileSync(file, 'utf8');
    assert.equal(tokens.check(made.token), undefined);
    assert.deepEqual(tokens.list(), []);
    assert.throws(() => tokens.create({ database: 'Synthetic', account: 'Admin' }));
    assert.throws(() => tokens.revoke(made.id));
    assert.equal(readFileSync(file, 'utf8'), before);
  });

  test(`connection key refuses ${attack} on fresh and cached readers`, { skip }, (t) => {
    for (const key of ['TABULARIUS_SECRETS_KEY', 'TABULARIUS_ENCRYPTION_KEY']) {
      const old = process.env[key]; delete process.env[key];
      t.after(() => { if (old === undefined) delete process.env[key]; else process.env[key] = old; });
    }
    const dir = folder(t), file = join(dir, '.openhbam-connections.key');
    const connections = new Connections(dir);
    connections.create({ name: 'synthetic', type: 's3', config: { bucket: 'synthetic' } });
    connections.setSecret('synthetic', 'accessKey', 'generated-access');
    connections.setSecret('synthetic', 'secretKey', 'generated-secret');
    connections.approve('synthetic');
    assert.equal(connections.use('synthetic').secrets.accessKey, 'generated-access');
    assert.equal(new Connections(dir).use('synthetic').secrets.secretKey, 'generated-secret');
    if (!plant(t, file, attack)) return;
    assert.throws(() => connections.use('synthetic'), /key|plain file/);
    assert.throws(() => new Connections(dir).use('synthetic'), /key|plain file/);
  });
}
