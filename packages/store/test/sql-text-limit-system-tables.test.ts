// The FileMaker_Fields system table is a long JSON literal the server puts into the query text itself. The limit on SQL
// text is for what a caller sent, so a file with many fields still answers a short query about them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { asText } from '@tabularius/calc';
import { createStore, MAX_SQL_TEXT, Store, StoreError } from '../src/index.ts';

test('ExecuteSQL over a file whose system tables are far past the limit still runs, and text a caller sent past it does not', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-sql-system-'));
  createStore(join(dir, 'Big.sqlite'));
  const store = new Store(join(dir, 'Big.sqlite'), 'Big');
  try {
    const fieldNames = (t: number) => Array.from({ length: 150 }, (_, f) => ({ name: `Table${t}_a_rather_long_field_name_${f}_${'x'.repeat(40)}` }));
    store.applyDesign(Array.from({ length: 100 }, (_, t) => ({ op: 'createTable' as const, name: `Table${t}`, fields: fieldNames(t) })));
    assert.ok(store.calc.translateSQL('SELECT COUNT(*) FROM FileMaker_Fields').sql.length > 2 * MAX_SQL_TEXT, 'the server-built text is far past the limit');
    const count = store.calc.executeSQL('SELECT COUNT(*) FROM FileMaker_Fields', []);
    assert.equal(Number(asText(count[0][0])), 100 * 150);
    assert.throws(() => store.calc.executeSQL(`SELECT 1${' '.repeat(MAX_SQL_TEXT)}`, []), (e: unknown) => e instanceof StoreError && e.code === 812 && /larger than 1 MB/.test(e.message));
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('a caller that has already measured the text (the PostgreSQL port, which rewrites it first) can skip the check', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-sql-checked-'));
  createStore(join(dir, 'Big.sqlite'));
  const store = new Store(join(dir, 'Big.sqlite'), 'Big');
  try {
    const padded = `SELECT 1${' '.repeat(MAX_SQL_TEXT)}`;
    assert.throws(() => store.calc.translateSQL(padded), (e: unknown) => e instanceof StoreError && e.code === 812);
    assert.match(store.calc.translateSQL(padded, undefined, undefined, undefined, false, true).sql, /^SELECT 1/);
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
});
