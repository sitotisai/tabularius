// Opening a store lifts its record-id marks. Another connection committing in the middle of that must not fail the open
// with "database is locked": a write that starts from an older read snapshot is refused at once, whatever busy wait is set.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createStore, Store } from '../src/index.ts';

test('another connection committing while the record-id marks are lifted does not fail the open', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-rid-race-'));
  const path = join(dir, 'Race.sqlite');
  createStore(path);
  const store = new Store(path);
  const other = new DatabaseSync(path);
  other.exec('PRAGMA busy_timeout = 0');
  t.after(() => { other.close(); store.close(); rmSync(dir, { recursive: true, force: true }); });
  store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name' }] }]);
  store.create('Items', { Name: 'one' });

  // The moment after the marks are read, as a second server process opening the same file would be writing.
  const sql = store.sql;
  const prepare = sql.prepare.bind(sql);
  let intruded = 0;
  sql.prepare = ((text: string) => {
    const statement = prepare(text);
    if (!/SELECT tbl FROM _fm_record_id_high_water/.test(text)) return statement;
    return new Proxy(statement, { get(target, key) {
      const value = Reflect.get(target, key) as unknown;
      if (key !== 'all' || typeof value !== 'function') return typeof value === 'function' ? value.bind(target) : value;
      return (...args: unknown[]) => {
        const rows = (value as (...a: unknown[]) => unknown).apply(target, args);
        try { other.exec("INSERT OR REPLACE INTO _fm_meta (key, json) VALUES ('raceProbe', '1')"); intruded++; } catch { /* the lock is held: it waits its turn */ }
        return rows;
      };
    } });
  }) as typeof sql.prepare;

  assert.doesNotThrow(() => (store as unknown as { ensureRecordIdHighWater(): void }).ensureRecordIdHighWater());
  sql.prepare = prepare;
  assert.ok(intruded === 0 || intruded === 1);
});
