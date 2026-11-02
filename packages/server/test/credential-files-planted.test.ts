// Someone with create-only access to a hosted folder can plant a credential name before the server makes it.
// Sign-in files must not follow those links, and no credential read may wait on a named pipe on the request thread.
import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { serve } from '../src/index.ts';
import { AiCredentials } from '../src/ai-credentials.ts';
import { isLocalAdmin, localAccess, openLocalAccess, LOCAL_FILE } from '../src/local-admin.ts';
import { hashPassword } from '../../store/src/store.ts';

const skip = process.platform === 'win32' && 'links and named pipes differ on Windows';
const ROOT = join(import.meta.dirname, '..', '..', '..');
const TOKEN = 'ab'.repeat(32);

/** A stub PATH: any service, upgrade, network or git tool would write a marker and fail the test. */
function sandbox(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-credential-files-'));
  const bin = join(dir, 'bin');
  const marker = join(bin, 'called');
  mkdirSync(bin);
  for (const tool of ['launchctl', 'systemctl', 'sc', 'git', 'npm', 'curl', 'sudo']) {
    writeFileSync(join(bin, tool), '#!/bin/sh\nprintf called > "${0%/*}/called"\nexit 99\n', { mode: 0o700 });
  }
  const env = { PATH: `${bin}:/usr/bin:/bin` };
  const previousPath = process.env.PATH;
  process.env.PATH = env.PATH;
  t.after(() => {
    try { assert.equal(existsSync(marker), false, 'no service, install or network command was called'); }
    finally {
      if (previousPath === undefined) delete process.env.PATH;
      else process.env.PATH = previousPath;
      rmSync(dir, { recursive: true, force: true });
    }
  });
  const folder = join(dir, 'hosted');
  mkdirSync(folder);
  const pipe = (path: string): void => {
    const made = spawnSync('mkfifo', ['-m', '600', path], { env, timeout: 8_000 });
    assert.equal(made.status, 0, 'mkfifo made the pipe');
    assert.ok(lstatSync(path).isFIFO());
  };
  // A read of a pipe blocks its whole process, so isolate it where the parent can enforce a timeout.
  const child = (code: string) => spawnSync(process.execPath, ['--no-warnings', '--input-type=module', '-e', code], { env, timeout: 15_000, encoding: 'utf8', cwd: ROOT });
  return { dir, folder, pipe, child };
}

const basic = (password: string) => 'Basic ' + Buffer.from(`admin:${password}`).toString('base64');

test('planted links and directories at the admin password file keep the console closed', { skip, timeout: 60_000 }, async (t) => {
  let s: Awaited<ReturnType<typeof serve>> | undefined;
  // Register server teardown before the sandbox removes its folder (after hooks run in registration order).
  t.after(async () => { if (s) await new Promise<void>((done) => s!.server.close(() => done())); });
  const { dir, folder } = sandbox(t);
  const file = join(folder, '.openhbam-admin');
  const theirs = join(dir, 'theirs');
  writeFileSync(theirs, hashPassword('attacker-chosen') + '\n');
  symlinkSync(theirs, file);
  s = await serve({ dir: folder, port: 0, log: () => {} });
  const status = (auth?: string, endpoint = 'status') => fetch(`${s!.url}/tabularius/admin/v1/${endpoint}`, { headers: { 'x-tabularius-admin': '1', ...(auth ? { authorization: auth } : {}) } }).then((r) => r.status);
  assert.equal(await status(basic('attacker-chosen')), 401, 'the attacker\'s password opens nothing');
  assert.equal(await status(), 401, 'the entry is not "no password"');
  assert.ok(lstatSync(file).isSymbolicLink(), 'the planted name is left as it was');

  rmSync(theirs);
  assert.equal(await status(), 401, 'a dangling link is not an absent password file');
  rmSync(file);
  mkdirSync(file);
  assert.equal(await status(), 401, 'a directory is an unusable password file');
  const warnings = await s.host.logs!.read('Event', { type: 'Warning', q: '.openhbam-admin' });
  assert.equal(warnings.entries.length, 1, 'repeated refusals log one warning');
  assert.match(warnings.entries[0].message, /remove it and set the password again/);
  rmSync(file, { recursive: true });
  writeFileSync(file, hashPassword('administrator-chosen') + '\n');
  // A successful status response looks up the checkout's git commit; use logs for this control to keep git uncalled.
  assert.equal(await status(basic('administrator-chosen'), 'logs'), 200, 'a regular password file works after repair');
});

test('a named pipe at the admin password file does not stop the server', { skip, timeout: 60_000 }, (t) => {
  const { folder, pipe, child } = sandbox(t);
  pipe(join(folder, '.openhbam-admin'));
  const ran = child(`import { serve } from './packages/server/src/index.ts';
    const s = await serve({ dir: ${JSON.stringify(folder)}, port: 0, log: () => {} });
    const r = await fetch(s.url + '/tabularius/admin/v1/status', { headers: { 'x-tabularius-admin': '1' } });
    console.log('status ' + r.status);
    await new Promise((done) => s.server.close(done));`);
  assert.equal(ran.status, 0, `the server answered (signal ${ran.signal}, ${ran.stderr})`);
  assert.equal(ran.stdout.trim(), 'status 401');
});

test('the local channel and its cleanup trust only a plain file', { skip, timeout: 60_000 }, (t) => {
  const { dir, folder, pipe, child } = sandbox(t);
  const access = JSON.stringify({ pid: 1, url: 'http://127.0.0.1:1', token: TOKEN });
  const file = join(folder, LOCAL_FILE);
  writeFileSync(file, access, { mode: 0o600 });
  assert.equal(isLocalAdmin(folder, TOKEN), true);
  assert.equal(localAccess(folder)?.token, TOKEN);
  rmSync(file);

  writeFileSync(join(dir, 'theirs'), access, { mode: 0o600 });
  symlinkSync(join(dir, 'theirs'), file);
  assert.equal(isLocalAdmin(folder, TOKEN), false, 'a link is not followed with a warm cache');
  assert.equal(localAccess(folder), undefined);
  rmSync(file);
  mkdirSync(file);
  assert.equal(isLocalAdmin(folder, TOKEN), false);
  assert.equal(localAccess(folder), undefined);
  rmSync(file, { recursive: true });

  pipe(file);
  const ran = child(`import { isLocalAdmin, localAccess } from './packages/server/src/local-admin.ts';
    console.log(isLocalAdmin(${JSON.stringify(folder)}, ${JSON.stringify(TOKEN)}) + ' ' + localAccess(${JSON.stringify(folder)}));`);
  assert.equal(ran.status, 0, `the check ended (signal ${ran.signal}, ${ran.stderr})`);
  assert.equal(ran.stdout.trim(), 'false undefined');
  rmSync(file);

  const stop = openLocalAccess(folder, 'http://127.0.0.1:1');
  writeFileSync(join(dir, 'ours'), JSON.stringify(localAccess(folder)), { mode: 0o600 });
  rmSync(file);
  symlinkSync(join(dir, 'ours'), file);
  stop();
  assert.ok(lstatSync(file).isSymbolicLink(), 'cleanup does not follow and remove a replacement link');
  rmSync(file);
  const cleanup = child(`import { execFileSync } from 'node:child_process';
    import { rmSync, lstatSync } from 'node:fs';
    import { openLocalAccess } from './packages/server/src/local-admin.ts';
    const stop = openLocalAccess(${JSON.stringify(folder)}, 'http://127.0.0.1:1');
    rmSync(${JSON.stringify(file)});
    execFileSync('mkfifo', ['-m', '600', ${JSON.stringify(file)}]);
    stop();
    console.log(lstatSync(${JSON.stringify(file)}).isFIFO());`);
  assert.equal(cleanup.status, 0, `cleanup ended (signal ${cleanup.signal}, ${cleanup.stderr})`);
  assert.equal(cleanup.stdout.trim(), 'true');
});

test('AI files refuse pipes and directories while operator links to regular files still work', { skip, timeout: 60_000 }, (t) => {
  const { dir, pipe, child } = sandbox(t);
  const key = join(dir, 'key');
  const workspace = join(dir, 'workspace');
  pipe(workspace);
  const workspaceRead = child(`import { AiCredentials } from './packages/server/src/ai-credentials.ts';
    const c = new AiCredentials({ workspaceFile: ${JSON.stringify(workspace)} });
    console.log(c.workspaceId + ' | ' + c.problem);`);
  assert.equal(workspaceRead.status, 0, `workspace read ended (signal ${workspaceRead.signal}, ${workspaceRead.stderr})`);
  assert.match(workspaceRead.stdout, /^undefined \| The workspace file was not used: .*not a plain file/);

  // Independently reach the key reload, with private permissions so the mode check cannot mask the pipe read.
  const keyRead = child(`import { execFileSync } from 'node:child_process';
    import { AiCredentials } from './packages/server/src/ai-credentials.ts';
    let now = 0;
    const c = new AiCredentials({ apiKey: 'from-options', keyFile: ${JSON.stringify(key)}, now: () => now });
    execFileSync('mkfifo', ['-m', '600', ${JSON.stringify(key)}]);
    now += 5_000;
    console.log(c.apiKey + ' | ' + c.problem);`);
  assert.equal(keyRead.status, 0, `key read ended (signal ${keyRead.signal}, ${keyRead.stderr})`);
  assert.match(keyRead.stdout, /^from-options \| The key file was not used: .*not a plain file/);

  rmSync(key);
  rmSync(workspace);
  const linked = join(dir, 'linked-key');
  let now = 0;
  const c = new AiCredentials({ apiKey: 'from-options', keyFile: linked, workspaceFile: workspace, now: () => now });
  const keyText = ['placeholder', 'key', 'text'].join('-');
  const workspaceText = ['wrkspc', 'example'].join('_');
  writeFileSync(key, `${keyText}\n`, { mode: 0o600 });
  chmodSync(key, 0o600);
  writeFileSync(join(dir, 'real-workspace'), workspaceText);
  symlinkSync(key, linked);
  symlinkSync(join(dir, 'real-workspace'), workspace);
  now += 5_000;
  assert.equal(c.apiKey, keyText);
  assert.equal(c.workspaceId, workspaceText);
  assert.equal(c.problem, undefined);

  rmSync(key);
  mkdirSync(key, { mode: 0o700 });
  now += 5_000;
  assert.equal(c.apiKey, keyText, 'a refused directory keeps the last good key');
  assert.match(c.problem!, /not a plain file/);
  const badWorkspace = new AiCredentials({ workspaceFile: key, workspaceId: workspaceText });
  assert.equal(badWorkspace.workspaceId, workspaceText);
  assert.match(badWorkspace.problem!, /not a plain file/);
});
