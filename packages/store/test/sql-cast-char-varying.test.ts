import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';
import { castsToTypes } from '../src/sql-grammar.ts';

let dir: string;
let store: Store;

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-cast-varying-'));
  const path = join(dir, 't.sqlite');
  createStore(path);
  store = new Store(path, 'T');
  store.applyDesign([{ op: 'createTable', name: 'W', fields: [{ name: 'Name', type: 'text' }, { name: 'N', type: 'number' }] }]);
  store.create('W', { Name: 'abc', N: '10' });
});

after(() => {
  store?.close();
  if (dir) rmSync(dir, { recursive: true, force: true });
});

const rows = (query: string, params: (string | number)[] = []) => {
  const { sql, target } = store.calc.translateSQL(query);
  return target.select(sql, params, 100).rows;
};

test('two-word character CAST spellings share VARCHAR length and decimal behavior', () => {
  for (const type of ['CHAR VARYING', 'CHARACTER VARYING', 'character   varying', 'Char Varying']) {
    for (const [query, expected] of [
      [`SELECT CAST(Name AS ${type}(2)) FROM W`, [['ab']]],
      [`SELECT CAST('añb' AS ${type}(2))`, [['añ']]],
      [`SELECT CAST(N AS ${type}) FROM W`, [['10']]],
      [`SELECT CAST(N AS ${type}(1)) FROM W`, [['1']]],
      [`SELECT CAST(1e20 AS ${type}(30))`, [['100000000000000000000']]],
      [`SELECT CAST(NULL AS ${type}(3))`, [[null]]],
    ] as const) assert.deepEqual(rows(query), expected, `${type}: ${query}`);
  }
  assert.deepEqual(rows('SELECT CAST(? AS CHARACTER VARYING(3))', ['abcde']), [['abc']]);
});

test('two-word character rewrite preserves quoted text and other type names', () => {
  assert.equal(castsToTypes('SELECT CAST(N AS CHAR VARYING(3))'), castsToTypes('SELECT CAST(N AS VARCHAR(3))'));
  const quoted = "SELECT 'CAST(N AS CHAR VARYING(3))'";
  assert.equal(castsToTypes(quoted), quoted);
  const other = 'SELECT CAST(N AS DOUBLE PRECISION)';
  assert.equal(castsToTypes(other), other);
  const twoArguments = 'SELECT CAST(N AS CHAR VARYING(2, 1))';
  assert.equal(castsToTypes(twoArguments), twoArguments);
});
