// A base table named like one of the store's own tables must not reach the
// store: the converter drops and recreates a table by its name, so a crafted
// file could otherwise replace the accounts or privileges the store reads.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FmpDatabase } from '../../fmp12/src/index.ts';
import { importFmp12 } from '../src/index.ts';

const fileWithTable = (name: string): FmpDatabase =>
  Object.assign(Object.create(FmpDatabase.prototype), {
    schemaCache: { tables: [{ id: 129, name, fields: [{ id: 1, name: 'name', type: 'text' }] }] },
  }) as FmpDatabase;

test('fmp12-93: a base table named like a store table is refused before anything is written', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-reserved-'));
  try {
    for (const name of ['_fm_accounts', '_FM_Meta', '_fm_privileges', 'sqlite_master', 'SQLite_x']) {
      const out = join(dir, `${name}.sqlite`);
      assert.throws(() => importFmp12(fileWithTable(name), out), (e: Error) => e.message.includes(`"${name}"`) && /rename/i.test(e.message), name);
      assert.equal(existsSync(out), false, `${name}: no store file is left behind`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
