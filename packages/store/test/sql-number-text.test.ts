import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';

let dir: string;
let store: Store;

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-sql-number-text-'));
  const path = join(dir, 't.sqlite');
  createStore(path);
  store = new Store(path, 'T');
  store.applyDesign([{ op: 'createTable', name: 'E', fields: [{ name: 'Name', type: 'text' }, { name: 'N', type: 'number' }] }]);
  store.create('E', { Name: 'tiny', N: 0.0000001 });
});

after(() => {
  store?.close();
  if (dir) rmSync(dir, { recursive: true, force: true });
});

const rows = (query: string) => {
  const { sql, target } = store.calc.translateSQL(query);
  return target.select(sql, [], 100).rows;
};

test('STRVAL and character CAST print a number as plain decimal digits, never with an exponent', () => {
  const cases = [
    ['SELECT STRVAL(1e21)', '1000000000000000000000'],
    ['SELECT STRVAL(-1e21)', '-1000000000000000000000'],
    ['SELECT STRVAL(2.5e-7)', '0.00000025'],
    ['SELECT STRVAL(-2.5e-7)', '-0.00000025'],
    ['SELECT STRVAL(1.2345678901234569e+23)', '123456789012345690000000'],
    ['SELECT STRVAL(0.0000001)', '0.0000001'],
    ['SELECT CAST(1e21 AS VARCHAR)', '1000000000000000000000'],
    ['SELECT CAST(2.5e-7 AS VARCHAR)', '0.00000025'],
    ['SELECT CAST(2.5e-7 AS CHAR(6))', '0.0000'],
    ['SELECT CAST(1e21 AS CHAR(5))', '10000'],
    ['SELECT CAST(1.5e-10 AS VARCHAR(30))', '0.00000000015'],
    ["SELECT STRVAL(N) FROM E WHERE Name = 'tiny'", '0.0000001'],
  ];
  for (const [query, expected] of cases) assert.deepEqual(rows(query), [[expected]], query);
  assert.match(String(rows('SELECT STRVAL(1e-300)')[0][0]), /^0\.0{300}\d+$/);
  assert.match(String(rows('SELECT STRVAL(1.5e300)')[0][0]), /^\d{301}$/);
});

test('a number cell and its STRVAL agree through ExecuteSQL', () => {
  for (const [query, expected] of [
    ['SELECT 2.5e-7, STRVAL(2.5e-7)', '0.00000025,0.00000025'],
    ['SELECT 1e21, STRVAL(1e21)', '1000000000000000000000,1000000000000000000000'],
  ]) {
    assert.equal(store.evaluate('E', `ExecuteSQL ( "${query}" ; "" ; "" )`).value, expected);
  }
});

test('ordinary numbers, text and null keep their existing STRVAL and CAST values', () => {
  assert.deepEqual(rows('SELECT STRVAL(1e20), STRVAL(0.000001), STRVAL(1.5), STRVAL(-0.0), STRVAL(0.1 + 0.2), STRVAL(42)'),
    [['100000000000000000000', '0.000001', '1.5', '0', '0.30000000000000004', '42']]);
  assert.deepEqual(rows("SELECT STRVAL('1e21'), STRVAL('x'), STRVAL(NULL), CAST(NULL AS VARCHAR(3)), CAST('abc' AS VARCHAR(2))"),
    [['1e21', 'x', null, null, 'ab']]);
});
