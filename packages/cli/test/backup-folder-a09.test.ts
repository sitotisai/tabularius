import '../../server/test/backup-review-guard.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from '../../store/src/import.ts';
import { runCli } from './cli-run.ts';

const main = join(import.meta.dirname, '../src/main.ts');
test('#165 CLI backup, verify-backup and restore use the console backup folder', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-cli-backups-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  createStore(join(dir, 'Notes.openhbam.sqlite'));
  writeFileSync(join(dir, '.openhbam-settings.json'), JSON.stringify({ backupDir: 'configured' }));
  const env = { ...process.env };
  delete env.TABULARIUS_BACKUP_KEY;
  delete env.TABULARIUS_ENCRYPTION_KEY;
  delete env.TABULARIUS_BACKUP_DIR;
  const run = (args: string[]) => runCli(main, args, { env, timeout: 30000 });
  const backup = await run(['backup', dir]);
  assert.equal(backup.status, 0, backup.stderr);
  assert.equal(existsSync(join(dir, 'Backups')), false);
  const set = readdirSync(join(dir, 'configured')).find((n) => /^\d{4}-/.test(n))!;
  const verify = await run(['verify-backup', dir]);
  assert.equal(verify.status, 0, verify.stderr);
  assert.match(verify.stdout, /ok/);
  const restore = await run(['restore', dir, set]);
  assert.equal(restore.status, 0, restore.stderr);
  assert.match(restore.stdout, /restored/);
});

import { configuredBackupDir } from '../../server/src/backup.ts';
import { storageChecks } from '../src/doctor.ts';
test('#165 destination precedence shared by offline commands and pre-upgrade backups', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-backup-precedence-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const env = { ...process.env };
  t.after(() => { process.env = env; });
  delete process.env.TABULARIUS_BACKUP_DIR;
  assert.equal(configuredBackupDir(dir), join(dir, 'Backups'));
  writeFileSync(join(dir, '.openhbam-settings.json'), JSON.stringify({ backupDir: 'configured' }));
  assert.equal(configuredBackupDir(dir), join(dir, 'configured'));
  process.env.TABULARIUS_BACKUP_DIR = join(dir, 'environment');
  assert.equal(configuredBackupDir(dir), join(dir, 'environment'));
  assert.equal(configuredBackupDir(dir, join(dir, 'explicit')), join(dir, 'explicit'));
});

test('#172 doctor warns about plaintext outside encrypted stores', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-encryption-warning-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const env = { ...process.env };
  t.after(() => { process.env = env; });
  process.env.TABULARIUS_ENCRYPTION_KEY = 'synthetic passphrase';
  const warning = storageChecks(dir).find((c) => c.name === 'Encryption coverage');
  assert.equal(warning?.level, 'warn');
  assert.match(warning!.message, /existing backups, external containers, source files, exports and logs.*plaintext/);
});
