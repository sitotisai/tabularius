// A standby sends its token and copies every hosted file over the chosen connection. Plain HTTP exposes both to an
// on-path reader; redirects could send the standby to a server nobody chose, even when cross-origin credentials are stripped.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Standby, checkPrimaryAddress } from '../src/index.ts';
import { notOnWindows } from '../../store/test/windows.ts';

const main = join(import.meta.dirname, '..', '..', 'cli', 'src', 'main.ts');
const TOKEN = ['a', 'replication', 'token', 'for', 'tests'].join('-');

/** Any service, upgrade, network or git tool would write a marker and fail the test. */
function stubs(dir: string): { env: NodeJS.ProcessEnv; marker: string } {
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  const marker = join(bin, 'called');
  for (const tool of ['launchctl', 'systemctl', 'sc', 'git', 'npm', 'curl', 'sudo']) {
    writeFileSync(join(bin, tool), '#!/bin/sh\nprintf called > "${0%/*}/called"\nexit 99\n');
    chmodSync(join(bin, tool), 0o755);
    writeFileSync(join(bin, `${tool}.cmd`), '@echo off\r\necho called > "%~dp0called"\r\nexit /b 99\r\n');
  }
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('TABULARIUS_')));
  return { env: { ...env, PATH: bin }, marker };
}

function run(env: NodeJS.ProcessEnv, args: string[], stopWhen?: RegExp): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--no-warnings', main, ...args], { env, stdio: ['ignore', 'pipe', 'pipe'], timeout: 30_000 });
    let stdout = '';
    let stderr = '';
    let stopped = false;
    child.stdout.setEncoding('utf8').on('data', (c: string) => {
      stdout += c;
      if (stopWhen?.test(stdout) && !stopped) { stopped = true; child.kill('SIGINT'); }
    });
    child.stderr.setEncoding('utf8').on('data', (c: string) => { stderr += c; });
    child.once('error', reject);
    child.once('close', (status) => resolve({ status, stdout, stderr }));
  });
}

const listen = (server: Server): Promise<number> => new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => resolve((server.address() as { port: number }).port));
});
const close = (server: Server): Promise<void> => new Promise((resolve) => { server.closeAllConnections(); server.close(() => resolve()); });

test('checkPrimaryAddress accepts https, and http only for this computer', () => {
  for (const ok of ['https://main.example.com', 'https://main.example.com:8080/', 'https://10.0.0.5:8443', 'http://localhost:8080', 'http://127.0.0.1:8080', 'http://127.1.2.3', 'http://[::1]:8080', 'HTTP://LOCALHOST:1', ' http://127.0.0.1:1 ']) {
    assert.doesNotThrow(() => checkPrimaryAddress(ok), ok);
  }
  for (const plain of ['http://main.example.com', 'http://main.example.com:8080', 'http://10.0.0.5:8080', 'http://192.168.1.2', 'http://localhost.example.com', 'http://127.0.0.1.example.com', 'http://[::ffff:127.0.0.1]:8080', 'http://[fe80::1]']) {
    assert.throws(() => checkPrimaryAddress(plain), /plain http to another computer.*--allow-plain-http/, plain);
    assert.doesNotThrow(() => checkPrimaryAddress(plain, true), `${plain} with the flag`);
  }
});

test('checkPrimaryAddress refuses what is not the address of a server', () => {
  const secret = ['pass', 'word', 'value'].join('-');
  for (const [text, why] of [
    ['', /needs an address/], ['main.example.com:8080', /must start with https/], ['not an address', /needs an address/],
    ['ftp://main.example.com', /must start with https/], ['file:///etc/passwd', /must start with https/], ['javascript:alert(1)', /must start with https/],
    [`https://admin:${secret}@main.example.com`, /user name or password/], ['https://admin@main.example.com', /user name or password/],
    ['https://main.example.com/?token=x', /without a \? or # part/], ['https://main.example.com/#x', /without a \? or # part/],
    ['https://main.example.com/?', /without a \? or # part/], ['https://main.example.com/#', /without a \? or # part/],
  ] as const) {
    assert.throws(() => checkPrimaryAddress(text, true), why, text);
  }
  assert.throws(() => checkPrimaryAddress(`https://admin:${secret}@main.example.com`), (e: Error) => !e.message.includes(secret));
});

test('the standby command refuses unsafe addresses before it creates anything, and accepts explicit plain http', { timeout: 60_000, skip: notOnWindows('it stops the command with SIGINT and expects a clean exit; on Windows a signal ends the process at once') }, async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-standby-address-'));
  const { env, marker } = stubs(dir);
  const primary = createServer((_, res) => res.end('{"files":[]}'));
  t.after(async () => {
    await close(primary);
    const called = existsSync(marker);
    rmSync(dir, { recursive: true, force: true });
    assert.equal(called, false, 'no stubbed tool was run');
  });
  const port = await listen(primary);
  // A mapped loopback address exercises the opt-in without DNS or any connection outside this computer.
  const address = `http://[::ffff:127.0.0.1]:${port}`;
  const folder = join(dir, 'copy');
  mkdirSync(folder);
  const refused = await run(env, ['standby', folder, '--primary', address, '--token', TOKEN], /standby of /);
  assert.equal(refused.status, 1, refused.stderr);
  assert.match(refused.stderr, /plain http to another computer/);
  assert.ok(!refused.stderr.includes(TOKEN) && !refused.stdout.includes(TOKEN), 'the token is not repeated');
  assert.deepEqual(readdirSync(folder), [], 'no state file was made');

  const inAddress = ['in', 'address', 'value'].join('-');
  const withSecret = await run(env, ['standby', folder, '--primary', `https://admin:${inAddress}@127.0.0.1:${port}`, '--token', TOKEN], /standby of /);
  assert.equal(withSecret.status, 1, withSecret.stderr);
  assert.match(withSecret.stderr, /user name or password/);
  assert.ok(!withSecret.stderr.includes(inAddress) && !withSecret.stdout.includes(inAddress), 'a password in the address is not echoed');
  assert.deepEqual(readdirSync(folder), [], 'credentials are refused before any file is made');

  for (const extra of [{ args: ['--allow-plain-http'], env: {} }, { args: [], env: { TABULARIUS_ALLOW_PLAIN_HTTP: '1' } }]) {
    const started = await run({ ...env, ...extra.env }, ['standby', folder, '--primary', address, '--token', TOKEN, ...extra.args], /standby of /);
    assert.equal(started.status, 0, started.stderr);
    assert.match(started.stdout, /standby of /);
    assert.match(started.stdout, /stopped/);
    assert.ok(!started.stdout.includes(TOKEN) && !started.stderr.includes(TOKEN));
  }
});

test('a standby does not follow a redirect from the main server, and says why', { timeout: 30_000 }, async (t) => {
  const folder = mkdtempSync(join(tmpdir(), 'tabularius-standby-redirect-'));
  let elsewhereRequests = 0;
  let sameOriginRequests = 0;
  const elsewhere = createServer((_, res) => { elsewhereRequests++; res.end('{"files":[]}'); });
  let location = '';
  const primary = createServer((req, res) => {
    if (req.url === '/redirected') { sameOriginRequests++; res.end('{"files":[]}'); }
    else { res.writeHead(302, { location }); res.end(); }
  });
  let standby: Standby | undefined;
  t.after(async () => {
    await standby?.stop();
    await close(primary);
    await close(elsewhere);
    rmSync(folder, { recursive: true, force: true });
  });
  const elsewherePort = await listen(elsewhere);
  const port = await listen(primary);
  for (const target of [`http://127.0.0.1:${elsewherePort}/tabularius/replication/v1/files`, '/redirected']) {
    location = target;
    const lines: string[] = [];
    let reportRedirect!: () => void;
    const redirected = new Promise<void>((resolve) => { reportRedirect = resolve; });
    standby = new Standby({ folder, primary: `http://127.0.0.1:${port}`, token: TOKEN, log: (line) => {
      lines.push(line);
      if (/answered with a redirect/.test(line)) reportRedirect();
    } });
    standby.start();
    await redirected;
    assert.equal(elsewhereRequests, 0, 'the other server never receives a request or token');
    assert.equal(sameOriginRequests, 0, 'a redirect within the main server is not followed either');
    assert.ok(lines.some((line) => /final address.*never follows/.test(line)));
    assert.ok(lines.every((line) => !line.includes(TOKEN)));
    await standby.stop();
  }
});
