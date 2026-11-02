import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';

let dir: string;
let store: Store;

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-sql-sets-'));
  const path = join(dir, 't.sqlite');
  createStore(path);
  store = new Store(path, 'T');
  store.applyDesign([
    { op: 'createTable', name: 'E', fields: [{ name: 'Name', type: 'text' }, { name: 'Grp', type: 'text' }, { name: 'N', type: 'number' }] },
    { op: 'createTable', name: 'F', fields: [{ name: 'Name', type: 'text' }] },
  ] as never);
  for (const record of [{ Name: 'Ann', Grp: 'x', N: 3 }, { Name: 'bob', Grp: 'y', N: 5 }, { Name: 'cy', Grp: 'x', N: 5 }]) store.create('E', record);
  for (const Name of ['bob', 'cy', 'dee']) store.create('F', { Name });
});

after(() => {
  store?.close();
  if (dir) rmSync(dir, { recursive: true, force: true });
});

const rows = (query: string) => {
  const { sql, target } = store.calc.translateSQL(query);
  return target.select(sql, [], 100).rows;
};

const executeSql = (query: string) => store.evaluate('E', `ExecuteSQL ( "${query}" ; "" ; "" )`).value;

test('INTERSECT and EXCEPT follow a table name that has no alias', () => {
  const intersect = 'SELECT Name FROM E INTERSECT SELECT Name FROM F ORDER BY Name';
  assert.deepEqual(rows(intersect), [['bob'], ['cy']]);
  assert.deepEqual(rows('SELECT Name FROM E EXCEPT SELECT Name FROM F'), [['Ann']]);
  assert.deepEqual(rows('SELECT Name FROM F EXCEPT SELECT Name FROM E'), [['dee']]);
  assert.deepEqual(rows('SELECT Name FROM E WHERE N > 3 INTERSECT SELECT Name FROM F ORDER BY 1'), [['bob'], ['cy']]);
  assert.deepEqual(rows('SELECT Name FROM E WHERE Name IN (SELECT Name FROM E INTERSECT SELECT Name FROM F) ORDER BY Name'), [['bob'], ['cy']]);
  assert.deepEqual(rows('SELECT * FROM (SELECT Name FROM E EXCEPT SELECT Name FROM F) x'), [['Ann']]);
  assert.deepEqual(rows('SELECT Name FROM E a INTERSECT SELECT Name FROM F b INTERSECT SELECT Name FROM F c ORDER BY 1'), [['bob'], ['cy']]);
  assert.deepEqual(rows('SELECT Name FROM E UNION SELECT Name FROM F EXCEPT SELECT Name FROM E WHERE N = 3 ORDER BY 1'), [['bob'], ['cy'], ['dee']]);
  assert.equal(executeSql(intersect), 'bob\rcy');
});

test('a table name followed by WINDOW is not given an alias', () => {
  assert.deepEqual(rows('SELECT Name, ROW_NUMBER() OVER w FROM E WINDOW w AS (ORDER BY Name)'), [['Ann', 1], ['bob', 2], ['cy', 3]]);
});

test('string plus around a set operator still joins strings', () => {
  assert.deepEqual(rows("SELECT Name + '-' FROM E INTERSECT SELECT Name + '-' FROM F ORDER BY 1"), [['bob-'], ['cy-']]);
  assert.deepEqual(rows("SELECT Name + '-' FROM E EXCEPT SELECT 'cy-' FROM F ORDER BY 1"), [['Ann-'], ['bob-']]);
});

test('DISTINCT after UNION, INTERSECT or EXCEPT is the default and runs', () => {
  assert.deepEqual(rows('SELECT Grp FROM E UNION DISTINCT SELECT Grp FROM E ORDER BY 1'), [['x'], ['y']]);
  assert.deepEqual(rows('SELECT Grp FROM E EXCEPT DISTINCT SELECT Grp FROM E WHERE N = 3'), [['y']]);
  assert.deepEqual(rows('SELECT Name FROM E INTERSECT DISTINCT SELECT Name FROM F ORDER BY 1'), [['bob'], ['cy']]);
  assert.deepEqual(rows("SELECT 'UNION DISTINCT'"), [['UNION DISTINCT']]);
  assert.deepEqual(rows('SELECT Grp FROM E UNION SELECT DISTINCT Grp FROM E ORDER BY 1'), [['x'], ['y']]);
});

test('INTERSECT ALL and EXCEPT ALL are refused by name, UNION ALL still runs', () => {
  assert.throws(() => rows('SELECT Name FROM E INTERSECT ALL SELECT Name FROM F'), /INTERSECT ALL is not supported/);
  assert.throws(() => rows('SELECT Name FROM E EXCEPT ALL SELECT Name FROM F'), /EXCEPT ALL is not supported/);
  assert.throws(() => rows('SELECT Name FROM E except   all SELECT Name FROM F'), /EXCEPT ALL is not supported/);
  assert.equal(rows('SELECT Name FROM E UNION ALL SELECT Name FROM F').length, 6);
  assert.deepEqual(rows("SELECT 'INTERSECT ALL' /* EXCEPT ALL */"), [['INTERSECT ALL']]);
});
