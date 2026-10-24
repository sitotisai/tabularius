// A query can build a value of any size (hex(zeroblob(n)), printf('%.*c', n, 'x')). node:sqlite turns every column into
// a JavaScript string with no cap, and a value past V8's string limit (about 512M characters) aborts the whole process,
// so a result's size is bounded here: per value, and for all rows together, with an error a person can act on.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store, StoreError } from '../src/index.ts';

function withStore(run: (store: Store) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-sql-size-'));
  createStore(join(dir, 'Shop.sqlite'));
  const store = new Store(join(dir, 'Shop.sqlite'), 'Shop');
  try { run(store); } finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
}

const tooBig = (e: unknown): boolean => e instanceof StoreError && e.code === 812 && /larger than/.test(e.message);

test('a single value larger than the cap is refused with error 812, not returned', () => {
  withStore((store) => {
    assert.throws(() => store.select('SELECT hex(zeroblob(40000000))'), tooBig);
    assert.throws(() => store.select("SELECT printf('%.*c', 70000000, 'x')"), tooBig);
    assert.throws(() => store.select('SELECT zeroblob(70000000)'), tooBig);
    assert.throws(() => store.queryWithOrigins('SELECT hex(zeroblob(40000000)) AS v'), tooBig);
  });
});

test('rows that are each small but add up past the budget are refused with error 812', () => {
  withStore((store) => {
    assert.throws(() => store.select('WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c WHERE x < 40) SELECT x, hex(zeroblob(5000000)) FROM c', [], 100_000), tooBig);
  });
});

test('ordinary results are unchanged: values, types, names, order and parameters', () => {
  withStore((store) => {
    store.applyDesign([{ op: 'createTable', name: 'T', fields: [{ name: 'n', type: 'number' }, { name: 'Name' }] }]);
    store.create('T', { n: '2', Name: 'b' });
    store.create('T', { n: '1', Name: 'a' });
    const r = store.select("SELECT Name, n, n AS n, NULL AS z, 1.5 AS f, x'0102' AS b FROM T WHERE n > ? ORDER BY n DESC;", [0]);
    assert.deepEqual(r.names, ['Name', 'n', 'n', 'z', 'f', 'b']);
    assert.equal(r.types[1], 'REAL');
    assert.deepEqual(r.rows.map((x) => x.slice(0, 5)), [['b', 2, 2, null, 1.5], ['a', 1, 1, null, 1.5]]);
    assert.deepEqual([...(r.rows[0][5] as unknown as Uint8Array)], [1, 2]);
    assert.deepEqual(store.select('VALUES (1), (2), (3)', [], 2).rows, [[1], [2]]);
    assert.deepEqual(store.select('WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c) SELECT x FROM c', [], 3).rows, [[1], [2], [3]]);
    assert.deepEqual(store.queryWithOrigins('SELECT Name AS who FROM T ORDER BY Name -- done\n').rows.map((x) => ({ ...x })), [{ who: 'a' }, { who: 'b' }]);
    const big = store.select('SELECT hex(zeroblob(20000000)) AS h').rows[0][0] as string;
    assert.equal(big.length, 40_000_000);
  });
});
