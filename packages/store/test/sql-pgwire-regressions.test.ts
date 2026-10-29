import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store, StoreError } from '../src/index.ts';
import { endTransaction, writer, type Transaction } from '../src/activity.ts';

function setup(t: TestContext): Store {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-sql-regression-'));
  const path = join(dir, 'Generated.openhbam.sqlite');
  createStore(path);
  const store = new Store(path);
  t.after(() => { store.close(); rmSync(dir, { recursive: true, force: true }); });
  store.applyDesign([{ op: 'createTable', name: 'People', fields: [{ name: 'Name' }] }]);
  store.create('People', { Name: 'Ada' });
  return store;
}

test('SQL reads large integers in both ordinary and held query paths', (t) => {
  const store = setup(t);
  assert.deepEqual(store.select('SELECT 1 << 62').rows, [[4611686018427387904n]]);
  const tx: Transaction = { files: new Map() };
  writer.run({ transaction: { open: tx } }, () => store.holdForTransaction());
  try { assert.deepEqual(store.selectIn(tx, 'SELECT 1 << 62').rows, [[4611686018427387904n]]); }
  finally { endTransaction(tx, false); }
});

test('SQL read gate refuses sqlite_sequence and sqlite_stat tables', (t) => {
  const store = setup(t);
  store.sql.exec('ANALYZE');
  for (const name of ['sqlite_sequence', 'sqlite_stat1']) {
    assert.throws(() => store.select(`SELECT * FROM ${name}`), (error: unknown) => error instanceof StoreError && error.code === 8310 && error.message.includes(name));
  }
});

test('SQL read audit finds a table between quoted aliases with apostrophes', (t) => {
  const store = setup(t);
  store.setAuditSettings({ logReads: true });
  const reads = () => store.sql.prepare("SELECT tbl FROM _fm_audit WHERE kind = 'read' AND tbl = 'People'").all() as { tbl: string }[];
  const before = reads().length;
  store.logQuery('SELECT 1 AS "a\'" FROM (SELECT * FROM People) AS "b\'"', 1);
  assert.equal(reads().length, before + 1);
});
