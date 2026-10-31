import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';

let dir: string;
let store: Store;

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-sql-fetch-'));
  const path = join(dir, 't.sqlite');
  createStore(path);
  store = new Store(path, 'T');
  store.applyDesign([{ op: 'createTable', name: 'W', fields: [{ name: 'Name', type: 'text' }, { name: 'N', type: 'number' }] }] as never);
  for (const [Name, N] of [['a', 1], ['b', 2], ['c', 3], ['d', 4], ['e', 5]] as const) {
    store.create('W', { Name, N: String(N) });
  }
});

after(() => {
  store?.close();
  if (dir) rmSync(dir, { recursive: true, force: true });
});

const run = (query: string, params: (string | number)[] = []) => {
  const { sql, target } = store.calc.translateSQL(query);
  return target.select(sql, params, 100).rows.map((row) => row[0]);
};

test('OFFSET and FETCH counts come from parameters', () => {
  const prefix = 'SELECT Name FROM W ORDER BY Name';
  assert.deepEqual(run(`${prefix} OFFSET ? ROWS FETCH FIRST ? ROWS ONLY`, [1, 2]), ['b', 'c']);
  assert.deepEqual(run(`${prefix} OFFSET ? ROW FETCH NEXT ? ROW ONLY`, [0, 3]), ['a', 'b', 'c']);
  assert.deepEqual(run(`${prefix} FETCH FIRST ? ROWS ONLY`, [2]), ['a', 'b']);
  assert.deepEqual(run(`${prefix} OFFSET ? ROWS`, [3]), ['d', 'e']);
  assert.deepEqual(run(`${prefix} OFFSET ? ROWS FETCH FIRST ? ROWS ONLY`, [9, 2]), []);
  assert.deepEqual(run(`${prefix} OFFSET 1 ROWS FETCH FIRST ? ROWS ONLY`, [2]), ['b', 'c']);
  assert.deepEqual(run(`${prefix} OFFSET ? ROWS FETCH FIRST 2 ROWS ONLY`, [3]), ['d', 'e']);
});

test('parameter places survive moving counts to the end of the query', () => {
  assert.deepEqual(run('SELECT Name FROM W WHERE N > ? ORDER BY Name OFFSET ? ROWS FETCH FIRST ? ROWS ONLY', [1, 1, 2]), ['c', 'd']);
  assert.deepEqual(run('SELECT Name FROM W ORDER BY Name OFFSET ?2 ROWS FETCH FIRST ?1 ROWS ONLY', [10, 3]), ['d', 'e']);
  assert.deepEqual(run("SELECT '? OFFSET ? ROWS' FROM W FETCH FIRST ? ROWS ONLY", [1]), ['? OFFSET ? ROWS']);
  assert.deepEqual(run('SELECT Name FROM W ORDER BY Name FETCH FIRST ? ROWS ONLY -- OFFSET ? ROWS', [1]), ['a']);
});

test('parameter counts are checked when the query runs', () => {
  const prefix = 'SELECT Name FROM W ORDER BY Name';
  assert.throws(() => run(`${prefix} OFFSET ? ROWS`, [-1]), /OFFSET needs a count of at least 0/);
  assert.throws(() => run(`${prefix} FETCH FIRST ? ROWS ONLY`, [0]), /at least 1/);
  assert.throws(() => run(`${prefix} FETCH FIRST ? ROWS ONLY`, [1.5]), /whole number/);
  assert.throws(() => run(`${prefix} FETCH FIRST ? ROWS ONLY`, ['x']), /whole number/);
  assert.throws(() => run(`${prefix} FETCH FIRST ? ROWS ONLY`, ['0x2']), /whole number/);
  assert.deepEqual(run(`${prefix} FETCH FIRST ? ROWS ONLY`, ['2']), ['a', 'b']);
});

test('WITH TIES and PERCENT refuse parameter counts and keep constant counts', () => {
  assert.throws(() => run('SELECT Name FROM W ORDER BY N FETCH FIRST ? ROWS WITH TIES', [1]), /not supported/);
  assert.throws(() => run('SELECT Name FROM W ORDER BY N FETCH FIRST ? PERCENT ROWS ONLY', [50]), /not supported/);
  assert.throws(() => run('SELECT Name FROM W ORDER BY N OFFSET ? ROWS FETCH FIRST 2 ROWS WITH TIES', [1]), /not supported/);
  assert.throws(() => run('SELECT Name FROM W ORDER BY N OFFSET ? ROWS FETCH FIRST 50 PERCENT ROWS ONLY', [1]), /not supported/);
  assert.deepEqual(run('SELECT Name FROM W ORDER BY N FETCH FIRST 2 ROWS WITH TIES'), ['a', 'b']);
  assert.deepEqual(run('SELECT Name FROM W ORDER BY Name OFFSET 1 ROW FETCH NEXT 1 ROW ONLY'), ['b']);
});
