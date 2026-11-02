// A hosted folder can be a shared or synchronised one, so someone who may only create entries in it can plant a name before the
// server has made it. The approval record, the key that seals the connections' secrets and the TLS pair are read while the server
// starts and serves: a link must not stand for them (a key the stranger chose would seal every secret), and a named pipe must not
// stop the server (a read of a pipe waits for ever, on the one thread that answers every request).
import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Connections } from '../src/connections.ts';

const skip = process.platform === 'win32' && 'links and named pipes differ on Windows';
const ROOT = join(import.meta.dirname, '..', '..', '..');

/** A stub PATH: any service, upgrade, network or git tool would write a marker and fail the test. */
function sandbox(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-state-files-'));
  const bin = join(dir, 'bin');
  const marker = join(bin, 'called');
  mkdirSync(bin);
  for (const tool of ['launchctl', 'systemctl', 'sc', 'git', 'npm', 'curl', 'sudo']) {
    writeFileSync(join(bin, tool), '#!/bin/sh\nprintf called > "$(dirname "$0")/called"\nexit 99\n', { mode: 0o700 });
  }
  const env = { PATH: `${bin}:/usr/bin:/bin` };
  t.after(() => {
    try { assert.equal(existsSync(marker), false, 'no service, install or network command was called'); }
    finally { rmSync(dir, { recursive: true, force: true }); }
  });
  const folder = join(dir, 'hosted');
  mkdirSync(folder);
  const pipe = (path: string): void => {
    const made = spawnSync('mkfifo', [path], { env, timeout: 8_000 });
    assert.equal(made.status, 0, 'mkfifo made the pipe');
    assert.ok(lstatSync(path).isFIFO());
  };
  /** Runs `code` in a process of its own: a read of a pipe blocks the whole process, so a test that did it here could never time out. */
  const child = (code: string) => spawnSync(process.execPath, ['--no-warnings', '--input-type=module', '-e', code], { env, timeout: 15_000, encoding: 'utf8', cwd: ROOT });
  return { dir, folder, pipe, child };
}

test('a named pipe at the approval record is a damaged record, not a wait', { skip, timeout: 60_000 }, (t) => {
  const { folder, pipe, child } = sandbox(t);
  pipe(join(folder, '.openhbam-hosted.json'));
  const ran = child(`import { loadHostedRecord } from './packages/server/src/hosted-record.ts';
    console.log(String(loadHostedRecord(${JSON.stringify(folder)})));`);
  assert.equal(ran.status, 0, `the record was looked at (signal ${ran.signal}, ${ran.stderr})`);
  assert.equal(ran.stdout.trim(), 'null', 'null means damaged: every file is held, as for any record that cannot be trusted');
});

test('the connections key is never a link, and a pipe at its name is refused, not waited on', { skip, timeout: 60_000 }, (t) => {
  const { dir, folder, pipe, child } = sandbox(t);
  const keys = ['TABULARIUS_SECRETS_KEY', 'TABULARIUS_ENCRYPTION_KEY'];
  const saved = keys.map((key) => process.env[key]);
  for (const key of keys) delete process.env[key];
  t.after(() => {
    for (const [i, key] of keys.entries()) {
      if (saved[i] === undefined) delete process.env[key];
      else process.env[key] = saved[i];
    }
  });
  // A link to a file the stranger wrote, holding a well-formed key of their choosing.
  writeFileSync(join(dir, 'theirs'), 'ab'.repeat(32) + '\n', { mode: 0o600 });
  symlinkSync(join(dir, 'theirs'), join(folder, '.openhbam-connections.key'));
  assert.match(new Connections(folder).problem ?? '', /not a plain file/, 'the key is not read through a link');
  assert.ok(lstatSync(join(folder, '.openhbam-connections.key')).isSymbolicLink(), 'the planted name is left as it was');

  const other = join(dir, 'hosted2');
  mkdirSync(other);
  pipe(join(other, '.openhbam-connections.key'));
  const ran = child(`import { Connections } from './packages/server/src/connections.ts';
    console.log(new Connections(${JSON.stringify(other)}).problem);`);
  assert.equal(ran.status, 0, `the key was looked at (signal ${ran.signal}, ${ran.stderr})`);
  assert.match(ran.stdout, /not a plain file/);
});

test('a named pipe where the TLS pair\'s pointer belongs gives no pair, not a wait', { skip, timeout: 60_000 }, (t) => {
  const { folder, pipe, child } = sandbox(t);
  const base = join(folder, 'pair');
  pipe(`${base}.current`);
  const ran = child(`import { readTlsPair } from './packages/server/src/tls-pair.ts';
    console.log(String(readTlsPair(${JSON.stringify(base)})));`);
  assert.equal(ran.status, 0, `the pair was looked for (signal ${ran.signal}, ${ran.stderr})`);
  assert.equal(ran.stdout.trim(), 'undefined');
});
