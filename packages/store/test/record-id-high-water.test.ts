import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createStore, reconvert, STORE_FORMAT, Store, StoreError } from '../src/index.ts';

function withTable(run: (path: string, store: Store) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-record-id-'));
  const path = join(dir, 'Records.sqlite');
  createStore(path);
  const store = new Store(path);
  try {
    store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'A' }, { name: 'B' }] }]);
    run(path, store);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

test('deleted record ids are not reused by create or duplicate, including after reopen', () => {
  withTable((path, store) => {
    const first = store.create('Items', { A: 'first' }).recordId;
    store.delete('Items', first);
    const second = store.create('Items', { A: 'second' }).recordId;
    assert.ok(second > first);
    assert.throws(() => store.update('Items', first, { A: 'stale' }, 0), (e: StoreError) => e.code === 101);
    store.delete('Items', second);
    const duplicateSource = store.create('Items', { A: 'source' }).recordId;
    const duplicate = store.duplicate('Items', duplicateSource).recordId;
    assert.ok(duplicate > duplicateSource);
    store.delete('Items', duplicate);
    const reopened = new Store(path);
    try { assert.ok(reopened.create('Items', { A: 'after reopen' }).recordId > duplicate); }
    finally { reopened.close(); }
  });
});

test('opening an old store seeds the mark from records and audit; explicit replayed inserts advance it', () => {
  withTable((path, store) => {
    store.create('Items', { A: 'one' });
    // This is the old schema, assembled here from a new synthetic store.
    store.sql.exec('DROP TABLE IF EXISTS _fm_record_id_high_water');
    store.sql.prepare("UPDATE _fm_meta SET json = '1' WHERE key = 'storeFormat'").run();
    store.sql.prepare("INSERT INTO _fm_audit (at, kind, tbl, record_id) VALUES (?, 'delete', 'Items', 40)").run(new Date().toISOString());
    const reopened = new Store(path);
    try {
      assert.equal(reopened.sql.prepare("SELECT json FROM _fm_meta WHERE key = 'storeFormat'").get()!.json, String(STORE_FORMAT));
      assert.equal(reopened.create('Items', { A: 'after migration' }).recordId, 41);
      // Standby changesets and restores can insert an explicit id through SQL.
      reopened.sql.prepare("INSERT INTO Items (_fm_record_id, A) VALUES (70, 'replayed')").run();
      reopened.sql.prepare('DELETE FROM Items WHERE _fm_record_id = 70').run();
      assert.equal(reopened.create('Items', { A: 'after replay' }).recordId, 71);
    } finally { reopened.close(); }
  });
});

test('renaming a table keeps its mark and a rolled back insert does not spend an id', () => {
  withTable((_path, store) => {
    const first = store.create('Items', { A: 'before rename' }).recordId;
    store.delete('Items', first);
    store.applyDesign([{ op: 'renameTable', table: 'Items', name: 'Renamed' }]);
    const next = store.create('Items', { A: 'after rename' }).recordId;
    assert.ok(next > first);
    store.sql.exec('BEGIN');
    store.sql.prepare("INSERT INTO Renamed (_fm_record_id, A) VALUES (90, 'rolled back')").run();
    store.sql.exec('ROLLBACK');
    assert.equal(store.create('Items', { A: 'committed' }).recordId, next + 1);
  });
});

function reconvertStore(run: (store: Store, baseline: string) => void | Promise<void>): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-record-reconvert-'));
  const baseline = join(dir, 'baseline.sqlite');
  const path = join(dir, 'hosted.sqlite');
  createStore(baseline);
  const setup = new Store(baseline);
  setup.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'A' }, { name: 'B' }] }]);
  setup.close();
  const sql = new DatabaseSync(baseline);
  sql.exec("INSERT INTO Items (_fm_record_id, A, B) VALUES (1, 'original A', 'original B'), (2, 'original A', 'original B'), (3, 'original A', 'original B')");
  sql.exec('DELETE FROM _fm_design_log');
  sql.close();
  copyFileSync(baseline, path);
  const source = join(dir, 'source.fmp12');
  writeFileSync(source, 'synthetic source marker');
  const store = new Store(path);
  return Promise.resolve(run(store, baseline)).finally(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
}

test('reconvert keeps a replacement record and a deletion after audit retention', async () => {
  await reconvertStore(async (store, baseline) => {
    store.delete('Items', 3);
    const made = store.create('Items', { A: 'person made this' });
    store.pruneAudit(1, Date.now() + 3 * 86_400_000);
    const source = join(dirname(baseline), 'source.fmp12');
    const result = await reconvert(store.path, source, { convert: async (_src, dest) => {
      copyFileSync(baseline, dest);
      return { tables: 1, records: 3 };
    } });
    assert.deepEqual([result.created, result.deleted], [1, 1]);
    assert.ok(made.recordId > 3);
    const after = new DatabaseSync(store.path);
    try {
      assert.equal(after.prepare('SELECT 1 FROM Items WHERE _fm_record_id = 3').get(), undefined);
      assert.equal(after.prepare('SELECT A FROM Items WHERE _fm_record_id = ?').get(made.recordId)!.A, 'person made this');
    } finally { after.close(); }
  });
});

test('reconvert carries an older edit when its audit entry was pruned', async () => {
  await reconvertStore(async (store, baseline) => {
    store.update('Items', 1, { A: 'older edit' });
    store.pruneAudit(1, Date.now() + 3 * 86_400_000);
    store.update('Items', 1, { B: 'newer edit' });
    const source = join(dirname(baseline), 'source.fmp12');
    const result = await reconvert(store.path, source, { convert: async (_src, dest) => {
      copyFileSync(baseline, dest);
      return { tables: 1, records: 3 };
    } });
    assert.equal(result.edited, 1);
    const after = new DatabaseSync(store.path);
    try { assert.deepEqual({ ...after.prepare('SELECT A, B FROM Items WHERE _fm_record_id = 1').get() }, { A: 'older edit', B: 'newer edit' }); }
    finally { after.close(); }
  });
});
