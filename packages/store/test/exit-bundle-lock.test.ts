// The cross-process lock of the portable copy under contention and aliasing, and a scan of every column of every
// internal table for credential material. A small file is used so these run in a second or two.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createStore, exitBundle, Store, totpCode } from '../src/index.ts';

const PASSWORD = ['correct', 'horse', 'battery', 'staple'].join(' ');
let dir: string;
let store: Store;
const sqlOf = (s: Store) => (s as unknown as { sql: DatabaseSync }).sql;
const asAdmin = (extra: Partial<Parameters<typeof exitBundle>[2]> = {}) => ({ account: 'Admin', password: PASSWORD, ...extra });
const walk = (root: string, rel = ''): string[] => readdirSync(join(root, rel), { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(root, rel ? `${rel}/${e.name}` : e.name) : [rel ? `${rel}/${e.name}` : e.name]));

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-exit-lock-'));
  const path = join(dir, 'Small.openhbam.sqlite');
  createStore(path);
  store = new Store(path, 'Small');
  store.applyDesign([{ op: 'createTable', name: 'T', fields: [{ name: 'A', type: 'text' }] }]);
  store.setPassword('Admin', PASSWORD);
  const sql = sqlOf(store);
  sql.exec('BEGIN');
  const add = sql.prepare('INSERT INTO T (A) VALUES (?)');
  for (let i = 0; i < 4000; i++) add.run(`row ${i}`);
  sql.exec('COMMIT');
});

after(() => {
  store.close();
  rmSync(dir, { recursive: true, force: true });
});

test('a contender inside the takeover gate cannot turn a published copy into a failure or leave the lock behind', async () => {
  const target = join(dir, 'gate-held');
  const gate = `${target}.lock.takeover`;
  let planted = false;
  const report = await exitBundle(store, target, asAdmin({ afterBatch: () => {
    if (!planted) { planted = true; writeFileSync(gate, 'another process', { mode: 0o600 }); }
  } }));
  assert.equal(report.rows, 4000);
  assert.equal(existsSync(join(target, 'manifest.json')), true);
  assert.equal(existsSync(`${target}.lock`), false, 'the lock must not be left for others to wait out');
  rmSync(gate, { force: true });
});

test('a failed release never replaces the original error', async () => {
  const target = join(dir, 'gate-held-error');
  const gate = `${target}.lock.takeover`;
  await assert.rejects(exitBundle(store, target, asAdmin({ afterBatch: () => {
    writeFileSync(gate, 'another process', { mode: 0o600 });
    throw new Error('the crash that matters');
  } })), /the crash that matters/);
  assert.equal(existsSync(`${target}.lock`), false);
  rmSync(gate, { force: true });
});

test('another process polling the gate does not abort a running copy', async () => {
  const target = join(dir, 'polled');
  const poller = spawn(process.execPath, ['-e', `
    const fs = require('fs');
    const gate = process.argv[1] + '.lock.takeover';
    const end = Date.now() + 30000;
    while (Date.now() < end) {
      try { const fd = fs.openSync(gate, 'wx', 0o600); fs.writeSync(fd, 'c'); fs.closeSync(fd); fs.rmSync(gate); } catch {}
    }`, target], { stdio: 'ignore' });
  try {
    const report = await exitBundle(store, target, asAdmin());
    assert.equal(report.rows, 4000);
  } finally {
    poller.kill();
    await new Promise((r) => poller.once('close', r));
  }
  rmSync(`${target}.lock.takeover`, { force: true });
  assert.equal(existsSync(`${target}.lock`), false);
});

test('one folder reached through a symlinked parent is refused while a copy to it runs', async () => {
  mkdirSync(join(dir, 'real', 'Exports'), { recursive: true });
  symlinkSync(join(dir, 'real'), join(dir, 'alias'));
  const outcomes = await Promise.all([
    exitBundle(store, join(dir, 'real', 'Exports', 'copy'), asAdmin()).then(() => 'ok', (e: Error) => e.message),
    exitBundle(store, join(dir, 'alias', 'Exports', 'copy'), asAdmin()).then(() => 'ok', (e: Error) => e.message),
  ]);
  assert.equal(outcomes.filter((o) => o === 'ok').length, 1, JSON.stringify(outcomes));
  assert.ok(outcomes.some((o) => /already running/.test(o)), JSON.stringify(outcomes));
  assert.equal(existsSync(join(dir, 'real', 'Exports', 'copy', 'manifest.json')), true);
  assert.equal(existsSync(join(dir, 'real', 'Exports', 'copy.lock')), false);
});

test('no credential material from any column of any internal table reaches the bundle', async () => {
  const sql = sqlOf(store);
  const markers: string[] = [];
  store.setPassword('Other', PASSWORD, '[Full Access]');
  const enrolled = store.enrollTotp('Other');
  store.confirmTotp('Other', totpCode(enrolled.secret));
  markers.push(enrolled.secret, store.createApiToken('Admin', { label: 'scan' }), ...store.generateRecoveryCodes('Other'));
  markers.push((sql.prepare("SELECT password_hash FROM _fm_accounts WHERE name = 'Admin'").get() as { password_hash: string }).password_hash);
  // Every column of every table the user did not design gets a marker of its own.
  const user = new Set(store.schema.tables.map((t) => t.name));
  // The sign-in ledger's key must be a JSON list of names or the store's own audit write fails, so it is left out.
  const internal = (sql.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[])
    .map((r) => r.name).filter((n) => !user.has(n) && n !== '_fm_privileges' && n !== '_fm_sign_in_ledger');
  const planted: string[] = [];
  const skipped: string[] = [];
  for (const [i, table] of internal.entries()) {
    const columns = sql.prepare(`PRAGMA table_info("${table}")`).all() as { name: string; type: string }[];
    const mark = `SECRETMARK${String(i).padStart(3, '0')}${table.replace(/\W/g, '')}`;
    const values = columns.map((c, n) => /INT/i.test(c.type) ? 900_000 + i * 10 + n : /REAL|FLOA|DOUB/i.test(c.type) ? 1.5
      : /BLOB/i.test(c.type) ? Buffer.from(`${mark}_${c.name}`) : JSON.stringify({ secret: `${mark}_${c.name}` }));
    try {
      sql.prepare(`INSERT INTO "${table}" (${columns.map((c) => `"${c.name}"`).join(',')}) VALUES (${columns.map(() => '?').join(',')})`).run(...values);
      planted.push(table);
      // An account's name and privilege set are listed in design/accounts.txt on purpose; every other column is not.
      markers.push(...columns.filter((c) => table !== '_fm_accounts' || !['name', 'privilege_set'].includes(c.name)).map((c) => `${mark}_${c.name}`));
    } catch { skipped.push(table); }
  }
  assert.ok(planted.length >= 10, `only planted in ${planted.join(', ')}; skipped ${skipped.join(', ')}`);
  // A value that lives only in a free page of the source.
  sql.exec('CREATE TABLE _scan_free (x TEXT)');
  sql.prepare('INSERT INTO _scan_free VALUES (?)').run('FREEPAGESECRET'.repeat(5000));
  sql.exec('DROP TABLE _scan_free');
  markers.push('FREEPAGESECRET');
  const target = join(dir, 'secret-scan');
  {
    await exitBundle(store, target, asAdmin());
    const found: string[] = [];
    for (const rel of walk(target)) {
      assert.ok(!/-(wal|shm|journal)$|\.pending$|openhbam\.sqlite/.test(rel), `a transient file was left: ${rel}`);
      const bytes = readFileSync(join(target, rel));
      for (const m of markers) {
        if (m.length < 8) continue;
        const needles = [Buffer.from(m), Buffer.from(m, 'utf16le'), Buffer.from(Buffer.from(m).toString('hex')), Buffer.from(Buffer.from(m).toString('base64').slice(0, 16))];
        if (needles.some((n) => bytes.includes(n))) found.push(`${rel}: ${m}`);
      }
    }
    assert.deepEqual(found, []);
  }
});
