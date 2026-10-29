import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { DatabaseSync } from 'node:sqlite';
import { createStore } from '../../store/src/index.ts';
import { readBackupInfo } from '../src/backup-info.ts';
import { backupFolder, restoreBackup } from '../src/backup.ts';
import { verifySet } from '../src/backup-verify.ts';

const name = 'A.openhbam.sqlite';

for (const [label, addition, key] of [
  ['top-level', '"extra":1,"extra":2', 'extra'],
  ['nested', '"extra":{"a":1,"a":2}', 'a'],
  ['escape-spelled', '"extra":{"a":1,"\\u0061":2}', 'a'],
  ['prototype', '"extra":{"__proto__":1}', '__proto__'],
] as const) {
  test(`${label} manifest key is refused by verify, full restore and named restore`, async (t) => {
    const root = mkdtempSync(join(tmpdir(), 'backup-manifest-keys-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const live = join(root, 'live');
    const destination = join(root, 'backups');
    mkdirSync(live);
    createStore(join(live, name));
    const set = (await backupFolder(live, destination, 0, '')).dir;
    const path = join(set, 'backup.json');
    const original = readFileSync(path, 'utf8');
    writeFileSync(path, original.replace(/}\s*$/, `,${addition}}`));

    const db = new DatabaseSync(join(live, name));
    try { db.exec('CREATE TABLE changed_after_backup (value TEXT)'); } finally { db.close(); }
    const before = readFileSync(join(live, name));
    const problem = new RegExp(`backup\\.json.*${key}`);

    const check = await verifySet(set, '');
    assert.equal(check.ok, false);
    assert.match(check.files['backup.json'], problem);
    assert.ok(check.files['backup.json'].includes(path));
    await assert.rejects(restoreBackup(live, set, undefined, ''), (e: Error) => problem.test(e.message) && e.message.includes(path));
    assert.deepEqual(readFileSync(join(live, name)), before);
    await assert.rejects(restoreBackup(live, set, 'A', ''), (e: Error) => problem.test(e.message) && e.message.includes(path));
    assert.deepEqual(readFileSync(join(live, name)), before);
    assert.equal(readFileSync(path, 'utf8'), original.replace(/}\s*$/, `,${addition}}`));
  });
}

test('the same key in separate manifest objects is allowed', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'backup-manifest-keys-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, 'backup.json'), '{"first":{"same":1},"second":{"same":2}}');
  assert.deepEqual(readBackupInfo(dir), { first: { same: 1 }, second: { same: 2 } });
});

test('a repeated key deep inside arrays is still named', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'backup-manifest-keys-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, 'backup.json'), '['.repeat(5_000) + '{"deep":1,"deep":2}' + ']'.repeat(5_000));
  assert.throws(() => readBackupInfo(dir), /backup\.json.*duplicate manifest key "deep"/);
});

test('a large valid manifest is scanned promptly', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'backup-manifest-keys-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const entries = Object.fromEntries(Array.from({ length: 20_000 }, (_, i) => [`file-${i}`, { size: i, sha256: String(i) }]));
  writeFileSync(join(dir, 'backup.json'), JSON.stringify({ external: entries }));
  const started = performance.now();
  const info = readBackupInfo<{ external: Record<string, { size: number }> }>(dir);
  const elapsed = performance.now() - started;
  assert.equal(Object.keys(info.external).length, 20_000);
  assert.ok(elapsed < 3_000, `manifest scan took ${elapsed.toFixed(0)} ms; limit is 3000 ms`);
});
