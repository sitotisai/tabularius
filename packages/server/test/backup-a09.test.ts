import './a09-command-guard.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createStore } from '../../store/src/import.ts';
import { backupFolder, backupKey } from '../src/backup.ts';
import { verifySet } from '../src/backup-verify.ts';
import { Host } from '../src/host.ts';
import { Admin } from '../src/admin.ts';
import { DataApi } from '../src/dataapi.ts';

function setup(t: { after(fn: () => void): void }): string {
  const dir = fs.mkdtempSync(join(tmpdir(), 'tabularius-a09-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('#164 new stores and WAL sidecars are private under a permissive umask', (t) => {
  const dir = setup(t);
  const path = join(dir, 'Notes.openhbam.sqlite');
  const mask = process.umask(0o022);
  try {
    createStore(path);
    const db = new DatabaseSync(path);
    try {
      db.exec('CREATE TABLE privacy (n INTEGER); INSERT INTO privacy VALUES (1)');
      for (const suffix of ['', '-wal', '-shm']) assert.equal(fs.statSync(path + suffix).mode & 0o777, 0o600, suffix || 'store');
    } finally { db.close(); }
  } finally { process.umask(mask); }
});

test('#172 encryption at rest also encrypts new backups by default', async (t) => {
  const dir = setup(t);
  createStore(join(dir, 'Notes.openhbam.sqlite'));
  const before = { ...process.env };
  t.after(() => { process.env = before; });
  delete process.env.TABULARIUS_BACKUP_KEY;
  process.env.TABULARIUS_ENCRYPTION_KEY = 'synthetic backup passphrase';
  assert.equal(backupKey(), process.env.TABULARIUS_ENCRYPTION_KEY);
  const set = await backupFolder(dir);
  assert.equal(fs.existsSync(join(set.dir, 'Notes.openhbam.sqlite')), false);
  assert.equal((await verifySet(set.dir)).ok, true);
  process.env.TABULARIUS_BACKUP_KEY = 'separate backup passphrase';
  assert.equal(backupKey(), 'separate backup passphrase');
  process.env.TABULARIUS_BACKUP_KEY = '';
  assert.throws(() => backupKey(), /empty/);
});

test('#39 backup and verification never run SQLite checks on the main thread', async (t) => {
  const dir = setup(t);
  createStore(join(dir, 'Notes.openhbam.sqlite'));
  const prepare = DatabaseSync.prototype.prepare;
  t.mock.method(DatabaseSync.prototype, 'prepare', function (this: DatabaseSync, sql: string) {
    assert.doesNotMatch(sql, /PRAGMA\s+(quick_check|integrity_check)/i);
    return prepare.call(this, sql);
  });
  const set = await backupFolder(dir, join(dir, 'Backups'), 0, '');
  assert.equal((await verifySet(set.dir, '')).ok, true);
});

test('#36 status caches backup manifests and counts shared inodes once', (t) => {
  const dir = setup(t);
  const host = new Host(dir);
  t.after(() => host.close());
  const admin = new Admin(host, new DataApi(host));
  const dest = join(dir, 'Backups');
  for (const name of ['2026-10-01_000000', '2026-10-02_000000']) {
    fs.mkdirSync(join(dest, name), { recursive: true });
    fs.writeFileSync(join(dest, name, 'backup.json'), '{}');
  }
  const a = join(dest, '2026-10-01_000000');
  const b = join(dest, '2026-10-02_000000');
  fs.writeFileSync(join(a, 'container'), Buffer.alloc(8192));
  fs.linkSync(join(a, 'container'), join(b, 'container'));
  const sets = admin.status().backups.sets;
  assert.equal(sets.reduce((n, s) => n + s.bytes, 0), 8196);
  const read = fs.readFileSync;
  let manifests = 0;
  t.mock.method(fs, 'readFileSync', (...args: Parameters<typeof read>) => {
    if (String(args[0]).endsWith('backup.json')) manifests++;
    return (read as Function)(...args);
  });
  syncBuiltinESMExports();
  t.after(() => { t.mock.restoreAll(); syncBuiltinESMExports(); });
  assert.deepEqual(admin.status().backups.sets, sets);
  assert.equal(manifests, 0);
  fs.writeFileSync(join(b, 'backup.json'), JSON.stringify({ verified: { ok: true, at: 'changed', files: {} } }));
  assert.equal(admin.status().backups.sets[0].check?.at, 'changed');
  fs.rmSync(b, { recursive: true });
  assert.equal(admin.status().backups.sets.length, 1);
});
