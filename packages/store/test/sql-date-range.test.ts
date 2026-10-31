import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';

let dir: string;
let store: Store;

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-sql-date-range-'));
  const path = join(dir, 't.sqlite');
  createStore(path);
  store = new Store(path, 'T');
  store.applyDesign([{ op: 'createTable', name: 'E', fields: [{ name: 'Name', type: 'text' }, { name: 'Hired', type: 'date' }] }] as never);
  store.create('E', { Name: 'edge', Hired: '12/31/9999' });
});

after(() => {
  store?.close();
  if (dir) rmSync(dir, { recursive: true, force: true });
});

const rows = (query: string) => {
  const { sql, target } = store.calc.translateSQL(query);
  return target.select(sql, [], 100).rows;
};

test('date arithmetic past year 9999 or before year 1 is an error, never malformed date text', () => {
  for (const query of [
    "SELECT DATE '9999-12-31' + 1",
    "SELECT DATE '9999-12-31' + INTERVAL 1 DAY",
    "SELECT DATE '9999-12-31' + INTERVAL 1 MONTH",
    "SELECT DATE '9999-12-31' + INTERVAL 1 YEAR",
    "SELECT DATE '0001-01-01' - 1",
    "SELECT DATE '0001-01-01' - INTERVAL 1 DAY",
    "SELECT DATE '2024-02-03' - INTERVAL 2024 YEAR",
    "SELECT DATE '2024-02-03' + INTERVAL 7976 YEAR",
    "SELECT DATE '2024-02-03' + 3000000",
    "SELECT DATE '2024-02-03' - 800000",
    "SELECT DATE '2024-02-03' + 1e300",
    "SELECT DATE '2024-02-03' - 1e300",
    "SELECT DATE '2024-02-03' + INTERVAL 1000000 YEAR",
    "SELECT TIMESTAMP '9999-12-31 23:59:59' + INTERVAL 1 SECOND",
    "SELECT TIMESTAMP '0001-01-01 00:00:00' - INTERVAL 1 SECOND",
    "SELECT TIMESTAMP '2024-02-03 10:00:00' + INTERVAL 99999999999 DAY",
    'SELECT Hired + 1 FROM E',
  ]) assert.throws(() => rows(query), /out of range/, query);
});

test('ExecuteSQL reports an out-of-range date result as an error, as it does for a bad date constant', () => {
  const evaluate = (query: string, fn = 'ExecuteSQL') => store.evaluate('E', `${fn} ( "${query}" ; "" ; "" )`).value;
  assert.throws(() => evaluate("SELECT DATE '2020-13-45'"), { code: 1200 });
  for (const query of ["SELECT DATE '9999-12-31' + 1", "SELECT DATE '2024-02-03' + 1e300"])
    assert.throws(() => evaluate(query), { code: 1200, message: /out of range/ });
  assert.match(String(evaluate("SELECT DATE '9999-12-31' + 1", 'ExecuteSQLe')), /^\? ERROR: /);
  assert.equal(evaluate("SELECT DATE '9999-12-30' + 1"), '9999-12-31');
});

test('date arithmetic edges and time wrapping stay unchanged', () => {
  for (const [query, expected] of [
    ["SELECT DATE '9999-12-31' + 0", '9999-12-31'],
    ["SELECT DATE '9999-12-31' - 1", '9999-12-30'],
    ["SELECT DATE '0001-01-01' + 1", '0001-01-02'],
    ["SELECT DATE '2024-02-03' + INTERVAL 7975 YEAR", '9999-02-03'],
    ["SELECT DATE '2024-02-03' - INTERVAL 2023 YEAR", '0001-02-03'],
    ["SELECT DATE '2024-01-31' + INTERVAL 1 MONTH", '2024-02-29'],
    ["SELECT DATE '2024-02-03' + 1", '2024-02-04'],
    ["SELECT TIMESTAMP '9999-12-31 23:59:58' + INTERVAL 1 SECOND", '9999-12-31T23:59:59'],
    ["SELECT TIME '23:59:59' + INTERVAL 1 SECOND", '00:00:00'],
    ['SELECT Hired - 1 FROM E', '9999-12-30'],
    ["SELECT DATE '2024-02-03' - DATE '2024-01-01'", 33],
  ] as const) assert.deepEqual(rows(query), [[expected]], query);
});
