// A base table named like one of the store's own tables must not reach the
// store: the converter drops and recreates a table by its name, and a design
// refresh writes the file's schema over the store's, so a crafted file could
// otherwise replace the accounts or privileges the store reads.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { FmpDatabase } from '../../fmp12/src/index.ts';
import { Store, importFmp12, importDesigns, upgradeDesigns } from '../src/index.ts';
import { syntheticFmp12 } from './synthetic-fmp12.ts';

const ACCOUNT_FIELDS = ['name', 'password_hash', 'source'];

function withDir(fn: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-reserved-'));
  try {
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('fmp12-93: a file with a table named like a store table is not converted, and leaves no store behind', () => {
  withDir((dir) => {
    for (const name of ['_fm_accounts', '_FM_Meta', '_fm_privileges', 'sqlite_master', 'SQLite_x']) {
      const src = join(dir, 'evil.fmp12');
      const out = join(dir, `${name}.sqlite`);
      writeFileSync(src, syntheticFmp12(name, ACCOUNT_FIELDS));
      assert.throws(() => importFmp12(src, out), (e: Error) => e.message.includes(`"${name}"`) && /rename/i.test(e.message), name);
      assert.equal(existsSync(out), false, `${name}: no store file is left behind`);
    }
  });
});

test('fmp12-93: an ordinary file made the same way is converted (the builder is sound)', () => {
  withDir((dir) => {
    const src = join(dir, 'fine.fmp12');
    writeFileSync(src, syntheticFmp12('Contacts', ACCOUNT_FIELDS));
    assert.deepEqual(importFmp12(src, join(dir, 'fine.sqlite')).map((s) => s.table), ['Contacts']);
  });
});

test('fmp12-93: a design refresh from such a file is refused and the store keeps its tables', () => {
  withDir((dir) => {
    const good = join(dir, 'good.fmp12');
    const evil = join(dir, 'evil.fmp12');
    const store = join(dir, 'Mine.sqlite');
    writeFileSync(good, syntheticFmp12('Contacts', ACCOUNT_FIELDS));
    writeFileSync(evil, syntheticFmp12('_fm_accounts', ACCOUNT_FIELDS));
    importFmp12(good, store);
    const tables = () => {
      const s = new Store(store, 'Mine');
      try { return s.schema.tables.map((t) => t.name); } finally { s.close(); }
    };
    assert.deepEqual(tables(), ['Contacts']);

    // The host startup path (upgradeDesigns) and the function under it.
    assert.throws(() => upgradeDesigns(store, evil), /"_fm_accounts"/);
    const sql = new DatabaseSync(store);
    const db = FmpDatabase.open(evil);
    try {
      assert.throws(() => importDesigns(sql, db), /"_fm_accounts"/);
    } finally {
      db.close();
      sql.close();
    }
    assert.deepEqual(tables(), ['Contacts'], 'the schema still lists only the real table');
  });
});
