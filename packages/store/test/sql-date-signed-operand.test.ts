import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';

let dir: string;
let store: Store;

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-sql-signed-date-'));
  const path = join(dir, 't.sqlite');
  createStore(path);
  store = new Store(path, 'T');
  store.applyDesign([{ op: 'createTable', name: 'E', fields: [{ name: 'Name', type: 'text' }, { name: 'Hired', type: 'date' }] }] as never);
  store.create('E', { Name: 'Ann', Hired: '1/1/2024' });
});

after(() => {
  store?.close();
  if (dir) rmSync(dir, { recursive: true, force: true });
});

const rows = (query: string) => {
  const { sql, target } = store.calc.translateSQL(query);
  return target.select(sql, [], 100).rows;
};

test('a number with a sign is days in date arithmetic, as it is in brackets', () => {
  for (const [query, expected] of [
    ['SELECT Hired + (-3) FROM E', '2023-12-29'],
    ['SELECT Hired + -3 FROM E', '2023-12-29'],
    ['SELECT Hired + - 3 FROM E', '2023-12-29'],
    ['SELECT Hired - -3 FROM E', '2024-01-04'],
    ['SELECT Hired + +3 FROM E', '2024-01-04'],
    ['SELECT Hired - -3 - 1 FROM E', '2024-01-03'],
    ['SELECT Hired + -1 + -1 FROM E', '2023-12-30'],
    ['SELECT Hired + -ABS(2) FROM E', '2023-12-30'],
    ['SELECT -3 + Hired FROM E', '2023-12-29'],
    ['SELECT - 3 + Hired FROM E', '2023-12-29'],
    ["SELECT DATE '2024-02-03' + -3", '2024-01-31'],
    ["SELECT DATE '2024-02-03' - -3", '2024-02-06'],
    ["SELECT -3 + DATE '2024-02-03'", '2024-01-31'],
    ['SELECT CURRENT_DATE + -0 = CURRENT_DATE', 1],
    ["SELECT 'x' + -3", 'x-3'],
  ] as const) {
    assert.deepEqual(rows(query), [[expected]], query);
  }
});

test('forms that were already right, and signs on things that are not days, are unchanged', () => {
  for (const [query, expected] of [
    ['SELECT Hired + 5 FROM E', '2024-01-06'],
    ['SELECT Hired - 3 + 1 FROM E', '2023-12-30'],
    ['SELECT Hired + 2 * 3 - 1 FROM E', '2024-01-06'],
    ["SELECT DATE '2024-02-03' - DATE '2024-01-01'", 33],
    ['SELECT Hired - Hired FROM E', 0],
    ['SELECT Hired - -Hired FROM E', 4048],
    ['SELECT 1 + -3', -2],
    ['SELECT 4 - -3 - 2', 5],
    ['SELECT -3 + 5', 2],
    ["SELECT 'ab' - 'c'", 'abc'],
    ["SELECT 'x' + 3", 'x3'],
  ] as const) {
    assert.deepEqual(rows(query), [[expected]], query);
  }
});
