// A backup destination can be a shared or remote folder, so what is in it is not all ours. A link, a named pipe or a file that merely
// has a set's name, a pipe where a set's manifest or a log belongs: none of it may stop the server (a read of a pipe waits for ever and
// blocks the whole process) or end the list of sets, and nothing is read through a link.
import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from '../../store/src/index.ts';
import { backupFolder, backupSets } from '../src/backup.ts';
import { readBackupInfo } from '../src/backup-info.ts';
import { scanLogs } from '../src/backup-log-chain.ts';

const skip = process.platform === 'win32' && 'links and named pipes differ on Windows';

/** A stub PATH: any service, upgrade, network or git tool would write a marker and fail the test. */
function sandbox(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-planted-names-'));
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
  const pipe = (path: string): void => {
    const made = spawnSync('mkfifo', [path], { env, timeout: 8_000 });
    assert.equal(made.status, 0, 'mkfifo made the pipe');
    assert.ok(lstatSync(path).isFIFO());
  };
  /**
   * Runs `code` in a process of its own: a read of a pipe blocks the whole process, so a test that did it here could never time out.
   * The code prints one line; the process has 10 seconds.
   */
  const child = (code: string) => spawnSync(process.execPath, ['--no-warnings', '--input-type=module', '-e', code], { env, timeout: 10_000, encoding: 'utf8', cwd: join(import.meta.dirname, '..', '..', '..') });
  return { dir, pipe, child };
}

test('names that only look like sets are not sets, and cannot make the list fail', { skip, timeout: 60_000 }, async (t) => {
  const { dir, pipe } = sandbox(t);
  const live = join(dir, 'live');
  const dest = join(dir, 'backups');
  mkdirSync(live);
  createStore(join(live, 'A.openhbam.sqlite'));
  const real = await backupFolder(live, dest, 0, '');
  const name = (p: string) => p.split(/[\\/]/).pop()!;

  // A link whose target is gone (the whole list used to fail with ENOENT), a link to a real folder elsewhere, a pipe and a plain file.
  symlinkSync(join(dir, 'not-there'), join(dest, '2020-01-01_000000'));
  mkdirSync(join(dir, 'elsewhere'));
  symlinkSync(join(dir, 'elsewhere'), join(dest, '2020-01-02_000000'));
  pipe(join(dest, '2020-01-03_000000'));
  writeFileSync(join(dest, '2020-01-04_000000'), 'not a folder');

  assert.deepEqual(backupSets(dest), [name(real.dir)], 'only the real set is listed');
  // A later backup still works, and the planted names are left exactly as they were.
  const next = await backupFolder(live, dest, 0, '');
  assert.deepEqual(backupSets(dest), [name(real.dir), name(next.dir)].sort());
  const retained = await backupFolder(live, dest, 1, '');
  assert.deepEqual(retained.removed, [name(real.dir), name(next.dir)].sort(), 'retention only prunes real sets');
  assert.deepEqual(backupSets(dest), [name(retained.dir)]);
  assert.ok(lstatSync(join(dest, '2020-01-01_000000')).isSymbolicLink());
  assert.ok(lstatSync(join(dest, '2020-01-02_000000')).isSymbolicLink());
  assert.ok(lstatSync(join(dest, '2020-01-03_000000')).isFIFO());
  assert.ok(lstatSync(join(dest, '2020-01-04_000000')).isFile());
  assert.ok(lstatSync(join(dir, 'elsewhere')).isDirectory());
});

test('a named pipe where a set\'s manifest or a log belongs is refused, not waited on', { skip, timeout: 60_000 }, async (t) => {
  const { dir, pipe, child } = sandbox(t);
  const live = join(dir, 'live');
  const dest = join(dir, 'backups');
  mkdirSync(live);
  createStore(join(live, 'A.openhbam.sqlite'));
  const set = (await backupFolder(live, dest, 0, '')).dir;

  const manifest = join(set, 'backup.json');
  renameSync(manifest, `${manifest}.real`);
  pipe(manifest);
  const info = child(`import { readBackupInfo } from './packages/server/src/backup-info.ts';
    try { readBackupInfo(${JSON.stringify(set)}); console.log('read'); } catch (e) { console.log('refused: ' + e.message); }`);
  assert.equal(info.status, 0, `the manifest read ended (signal ${info.signal}, ${info.stderr})`);
  assert.match(info.stdout, /^refused: unreadable manifest .*not a plain file/);

  const logs = join(dir, 'logs');
  mkdirSync(logs);
  pipe(join(logs, '2026-01-01_000000.000Z.log'));
  const scan = child(`import { scanLogs } from './packages/server/src/backup-log-chain.ts';
    try { scanLogs(${JSON.stringify(logs)}); console.log('read'); } catch (e) { console.log('refused: ' + e.code); }`);
  assert.equal(scan.status, 0, `the log scan ended (signal ${scan.signal}, ${scan.stderr})`);
  assert.equal(scan.stdout.trim(), 'refused: ESTALE');
});

test('a link or folder at a set\'s manifest or at a log is refused and never read through', { skip, timeout: 60_000 }, async (t) => {
  const { dir } = sandbox(t);
  const live = join(dir, 'live');
  const dest = join(dir, 'backups');
  mkdirSync(live);
  createStore(join(live, 'A.openhbam.sqlite'));
  const set = (await backupFolder(live, dest, 0, '')).dir;
  const refused = (e: Error) => /unreadable manifest .*not a plain file/.test(e.message);

  // The manifest as a link to a file that holds a well-formed manifest of its own.
  const elsewhere = join(dir, 'other-manifest.json');
  writeFileSync(elsewhere, '{"sha256":{}}');
  const manifest = join(set, 'backup.json');
  renameSync(manifest, `${manifest}.real`);
  symlinkSync(elsewhere, manifest);
  assert.throws(() => readBackupInfo(set), refused);
  rmSync(manifest);
  mkdirSync(manifest);
  assert.throws(() => readBackupInfo(set), (e: Error) => /unreadable manifest/.test(e.message));
  rmSync(manifest, { recursive: true });
  renameSync(`${manifest}.real`, manifest);
  assert.doesNotThrow(() => readBackupInfo(set), 'the real manifest reads again');

  const logs = join(dir, 'logs');
  mkdirSync(logs);
  const victim = join(dir, 'log-elsewhere.log');
  writeFileSync(victim, 'not a log');
  symlinkSync(victim, join(logs, '2026-01-01_000000.000Z.log'));
  assert.throws(() => scanLogs(logs), (e: NodeJS.ErrnoException) => e.code === 'ESTALE');
  rmSync(join(logs, '2026-01-01_000000.000Z.log'));
  mkdirSync(join(logs, '2026-01-01_000000.000Z.log'));
  assert.throws(() => scanLogs(logs));
});
