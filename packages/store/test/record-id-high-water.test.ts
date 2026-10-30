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

/** Makes the store look as a format-1 one did: no mark table, no mark triggers, format 1. */
function asFormat1(store: Store): void {
  for (const t of store.sql.prepare("SELECT name FROM sqlite_master WHERE type = 'trigger' AND name GLOB '_fm_rid_*'").all() as { name: string }[]) {
    store.sql.exec(`DROP TRIGGER "${t.name.replace(/"/g, '""')}"`);
  }
  store.sql.exec('DROP TABLE _fm_record_id_high_water');
  store.sql.prepare("UPDATE _fm_meta SET json = '1' WHERE key = 'storeFormat'").run();
}

test('upgrading a format-1 store whose table was renamed: the ids logged under the old name are not given again', () => {
  withTable((path, store) => {
    const ids = [1, 2, 3].map((n) => store.create('Items', { A: String(n) }).recordId);
    store.delete('Items', ids[2]!);
    store.applyDesign([{ op: 'renameTable', table: 'Items', name: 'Things' }]);
    asFormat1(store);
    // The log holds the deleted id under the name the table had then.
    assert.deepEqual(store.sql.prepare('SELECT DISTINCT tbl FROM _fm_audit WHERE security = 0 AND record_id = ?').all(ids[2]!).map((r) => r.tbl), ['Items']);
    const reopened = new Store(path);
    try {
      // The layout keeps its name; its table is now Things.
      assert.ok(reopened.create('Items', { A: 'after upgrade' }).recordId > ids[2]!);
    } finally { reopened.close(); }
  });
});

test('a later table under a renamed table\'s old name starts above the ids it had', () => {
  withTable((_path, store) => {
    const ids = [1, 2].map((n) => store.create('Items', { A: String(n) }).recordId);
    store.applyDesign([{ op: 'renameTable', table: 'Items', name: 'Things' }]);
    store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'A' }] }]);
    // "Items" is the renamed table's layout; the new table's is "Items 2".
    assert.ok(store.create('Items 2', { A: 'new table' }).recordId > ids[1]!, 'the audit log holds the earlier ids under this name');
  });
});

test('an explicit id beyond what a JavaScript number holds exactly: the store opens, and a new record is refused by name', () => {
  withTable((path, store) => {
    store.create('Items', { A: 'one' });
    store.sql.prepare('INSERT INTO Items (_fm_record_id, A) VALUES (?, ?)').run(2n ** 60n, 'huge');
    store.sql.prepare('DELETE FROM Items WHERE _fm_record_id = ?').run(2n ** 60n);
    const reopened = new Store(path);
    try {
      assert.throws(() => reopened.create('Items', { A: 'after' }), (e: StoreError) => e.code === 812 && /table "Items"/.test(e.message));
      assert.throws(() => reopened.duplicate('Items', 1), (e: StoreError) => e.code === 812 && /table "Items"/.test(e.message));
      // Only that table: others go on.
      reopened.applyDesign([{ op: 'createTable', name: 'Other', fields: [{ name: 'A' }] }]);
      assert.equal(reopened.create('Other', { A: 'fine' }).recordId, 1);
    } finally { reopened.close(); }
    // Up to the last exact one is still given.
    const edge = new Store(path);
    try {
      edge.sql.prepare("UPDATE _fm_record_id_high_water SET id = ? WHERE tbl = 'Items'").run(Number.MAX_SAFE_INTEGER - 1);
      assert.equal(edge.create('Items', { A: 'last' }).recordId, Number.MAX_SAFE_INTEGER);
      assert.throws(() => edge.create('Items', { A: 'past' }), (e: StoreError) => e.code === 812);
    } finally { edge.close(); }
  });
});

test('a missing mark row: new ids continue after the highest record, and the next insert writes the row again', () => {
  withTable((_path, store) => {
    store.create('Items', { A: 'one' });
    store.create('Items', { A: 'two' });
    store.sql.prepare("DELETE FROM _fm_record_id_high_water WHERE tbl = 'Items'").run();
    assert.equal(store.create('Items', { A: 'three' }).recordId, 3);
    assert.equal(store.duplicate('Items', 1).recordId, 4);
    assert.equal((store.sql.prepare("SELECT id FROM _fm_record_id_high_water WHERE tbl = 'Items'").get() as { id: number }).id, 4);
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
    if (store.sql.isOpen) store.close();
    rmSync(dir, { recursive: true, force: true });
  });
}

test('reconvert keeps a replacement record and a deletion after audit retention', async () => {
  await reconvertStore(async (store, baseline) => {
    store.delete('Items', 3);
    const made = store.create('Items', { A: 'person made this' });
    store.pruneAudit(1, Date.now() + 3 * 86_400_000);
    const source = join(dirname(baseline), 'source.fmp12');
    store.close(); // a hosted file is closed before it is reconverted, and Windows would not let the swap replace the write-ahead log of an open one
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
    store.close(); // a hosted file is closed before it is reconverted, and Windows would not let the swap replace the write-ahead log of an open one
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
