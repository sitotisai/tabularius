import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';

let dir: string;
let store: Store;

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-sql-big-integers-'));
  const path = join(dir, 't.sqlite');
  createStore(path);
  store = new Store(path, 'T');
  store.applyDesign([{ op: 'createTable', name: 'E', fields: [{ name: 'Name', type: 'text' }] }] as never);
  store.create('E', { Name: 'one' });
});

after(() => {
  store?.close();
  if (dir) rmSync(dir, { recursive: true, force: true });
});

const rows = (query: string) => {
  const { sql, target } = store.calc.translateSQL(query);
  return target.select(sql, [], 100).rows;
};

const executeSQL = (query: string) => store.evaluate('E', `ExecuteSQL ( "${query}" ; "" ; "" )`).value;

test('functions given an integer past 2^53 answer instead of failing', () => {
  for (const [query, expected] of [
    ['SELECT STRVAL(9007199254740993)', '9007199254740993'],
    ['SELECT STRVAL(-9223372036854775807)', '-9223372036854775807'],
    ['SELECT CAST(9223372036854775807 AS VARCHAR)', '9223372036854775807'],
    ['SELECT CAST(9223372036854775807 AS CHAR(5))', '92233'],
    ['SELECT UPPER(9223372036854775807)', '9223372036854775807'],
    ['SELECT LEFT(9223372036854775807, 3)', '922'],
    ['SELECT RIGHT(9223372036854775807, 3)', '807'],
    ['SELECT SUBSTR(9007199254740993, 2, 4)', '0071'],
    ['SELECT CHAR_LENGTH(9223372036854775807)', 19],
    ['SELECT INT(9223372036854775807)', 9223372036854775807n],
    ['SELECT INT(-9007199254740993)', -9007199254740993n],
    ['SELECT ROUND(9223372036854775807)', 9223372036854775807n],
    ['SELECT ROUND(9223372036854775807, 0)', 9223372036854775807n],
  ] as const) assert.equal(rows(query)[0][0], expected, query);
});

test('ExecuteSQL prints an integer past 2^53 with every digit', () => {
  for (const [query, expected] of [
    ['SELECT 9007199254740993', '9007199254740993'],
    ['SELECT -9223372036854775807 - 1', '-9223372036854775808'],
    ['SELECT INT(9223372036854775807)', '9223372036854775807'],
    ['SELECT 9007199254740993, 2', '9007199254740993,2'],
    ['SELECT STRVAL(9007199254740993)', '9007199254740993'],
  ]) assert.equal(executeSQL(query), expected, query);
});

test('small SQL numbers and functions retain their answers', () => {
  assert.equal(executeSQL('SELECT 5, 5.5, 9007199254740991'), '5,5.5,9007199254740991');
  assert.deepEqual(rows('SELECT STRVAL(42), INT(7.9), ROUND(2.5), UPPER(12), CHAR_LENGTH(123)'), [['42', 7, 3, '12', 3]]);
  assert.deepEqual(rows('SELECT ROUND(12345, -2), ROUND(1.005, 2)'), [[12300, 1.01]]);
});
