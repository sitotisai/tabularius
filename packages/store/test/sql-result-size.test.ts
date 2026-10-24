// A query can build a value of any size (hex(zeroblob(n)), printf('%.*c', n, 'x')). node:sqlite turns every column into
// a JavaScript string with no cap, and a value past V8's string limit (about 512M characters) aborts the whole process,
// so the size of a result is bounded here: per row (all its columns together) and for all rows together, counted in
// bytes, with an error a person can act on. The server's own reads of its own data are not held to it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, exportSql, Store, StoreError } from '../src/index.ts';

function withStore(run: (store: Store) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-sql-size-'));
  createStore(join(dir, 'Shop.sqlite'));
  const store = new Store(join(dir, 'Shop.sqlite'), 'Shop');
  try { run(store); } finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
}

const tooBig = (e: unknown): boolean => e instanceof StoreError && e.code === 812 && /larger than|more than/.test(e.message);

test('a value or a row larger than the cap is refused with error 812, not returned', () => {
  withStore((store) => {
    assert.throws(() => store.select('SELECT hex(zeroblob(40000000))'), tooBig);
    assert.throws(() => store.select("SELECT printf('%.*c', 70000000, 'x')"), tooBig);
    assert.throws(() => store.select('SELECT zeroblob(70000000)'), tooBig);
    assert.throws(() => store.queryWithOrigins('SELECT hex(zeroblob(40000000)) AS v'), tooBig);
  });
});

test('a wide row is refused as a whole, so no column of it becomes a JavaScript value', () => {
  withStore((store) => {
    const wide = (n: number, each: number) => `SELECT ${Array.from({ length: n }, (_, i) => `printf('%.*c', ${each}, 'x') AS c${i}`).join(', ')}`;
    assert.throws(() => store.select(wide(12, 6_000_000)), tooBig);
    assert.throws(() => store.select(wide(100, 1_000_000)), tooBig);
    assert.equal(store.select(wide(12, 5_000_000)).rows[0].length, 12);
  });
  // The row is judged inside SQLite, so a heap far smaller than the row is no problem.
  const child = spawnSync(process.execPath, ['--no-warnings', '--max-old-space-size=96', '--input-type=module', '-e', `
    import { mkdtempSync } from 'node:fs';
    import { tmpdir } from 'node:os';
    import { join } from 'node:path';
    import { createStore, Store } from ${JSON.stringify(join(import.meta.dirname, '../src/index.ts'))};
    const dir = mkdtempSync(join(tmpdir(), 'tabularius-sql-wide-'));
    createStore(join(dir, 'Shop.sqlite'));
    const store = new Store(join(dir, 'Shop.sqlite'), 'Shop');
    const columns = Array.from({ length: 100 }, (_, i) => "printf('%.*c', 3000000, 'x') AS c" + i).join(', ');
    try { store.select('SELECT ' + columns); console.log('returned'); } catch (e) { console.log(e.code); }
    store.close();
  `], { encoding: 'utf8', timeout: 60_000 });
  assert.equal(child.status, 0, child.stderr);
  assert.equal(child.stdout.trim(), '812');
});

test('rows that are each small but add up past the budget are refused with error 812', () => {
  withStore((store) => {
    assert.throws(() => store.select('WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c WHERE x < 40) SELECT x, hex(zeroblob(5000000)) FROM c', [], 100_000), tooBig);
  });
});

test('a row is judged in bytes, not characters', () => {
  withStore((store) => {
    // 40 million characters, 80 million bytes.
    assert.throws(() => store.select("SELECT replace(printf('%.*c', 40000000, 'e'), 'e', 'é')"), tooBig);
    assert.equal((store.select("SELECT replace(printf('%.*c', 3000000, 'e'), 'e', 'é')").rows[0][0] as string).length, 3_000_000);
  });
});

test('each expression runs once per row, as without the cap, and a cap cannot be dodged by a column that varies', () => {
  withStore((store) => {
    store.applyDesign([{ op: 'createTable', name: 'T', fields: [{ name: 'n', type: 'number' }] }]);
    for (let i = 1; i <= 6; i++) store.create('T', { n: String(i) });
    let calls = 0;
    store.defineQueryFunction('bump', () => { calls++; return 'x'; });
    for (const run of [(s: string) => store.select(s), (s: string) => store.queryWithOrigins(s)]) {
      calls = 0;
      run('SELECT bump() FROM T');
      assert.equal(calls, 6);
      calls = 0;
      run('SELECT bump() AS a, n FROM T WHERE bump() IS NOT NULL');
      assert.equal(calls, 12);
    }
    // A column that is huge on some rows and the number 1 on others: never an uncut huge value, and 1 stays a number.
    let refused = 0, numbers = 0;
    for (let i = 0; i < 25; i++) {
      try {
        const rows = store.select('SELECT CASE WHEN random() % 2 = 0 THEN hex(zeroblob(40000000)) ELSE 1 END AS v FROM T').rows;
        assert.ok(rows.every((r) => r[0] === 1), 'a returned value is the number 1');
        numbers++;
      } catch (e) {
        assert.ok(tooBig(e), String(e));
        refused++;
      }
    }
    assert.equal(refused + numbers, 25);
  });
});

test('a table or a CTE named like the wrapper still reads', () => {
  withStore((store) => {
    store.applyDesign([{ op: 'createTable', name: 'r', fields: [{ name: 'n', type: 'number' }] }, { op: 'createTable', name: 'w', fields: [{ name: 'n', type: 'number' }] }]);
    store.create('r', { n: '7' });
    store.create('w', { n: '8' });
    for (const run of [(s: string) => store.select(s).rows, (s: string) => store.queryWithOrigins(s).rows.map((r) => Object.values(r))]) {
      assert.deepEqual(run('SELECT n FROM r'), [[7]]);
      assert.deepEqual(run('SELECT w.n FROM w, r WHERE w.n > r.n'), [[8]]);
      assert.deepEqual(run('WITH r AS (SELECT 5 AS x) SELECT x FROM r'), [[5]]);
      assert.deepEqual(run('WITH RECURSIVE r(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM r WHERE x < 3) SELECT x FROM r'), [[1], [2], [3]]);
      // The wrapper's own names are the internal prefix, which SQL may not name.
      assert.throws(() => run('WITH _fm_w AS (SELECT 6 AS x) SELECT x FROM _fm_w'), /internal table/);
      assert.deepEqual(run('WITH t AS (SELECT 2 AS t) SELECT t FROM t'), [[2]]);
    }
  });
});

test('the server\'s own reads of its own data are not held to the cap', () => {
  withStore((store) => {
    const rows = 'WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c WHERE x < 300) SELECT x, hex(zeroblob(500000)) FROM c';
    assert.throws(() => store.select(rows, [], 1000), tooBig);
    assert.equal(store.select(rows, [], 1000, true).rows.length, 300);
    assert.equal((store.select('SELECT hex(zeroblob(40000000))', [], 1, true).rows[0][0] as string).length, 80_000_000);
  });
});

test('ordinary results are unchanged: values, types, names, order and parameters', () => {
  withStore((store) => {
    store.applyDesign([{ op: 'createTable', name: 'T', fields: [{ name: 'n', type: 'number' }, { name: 'Name' }] }]);
    store.create('T', { n: '2', Name: 'b' });
    store.create('T', { n: '1', Name: 'a' });
    const r = store.select("SELECT Name, n, n AS n, NULL AS z, 1.5 AS f, x'0102' AS b, 'it''s' AS q FROM T WHERE n > ? ORDER BY n DESC;", [0]);
    assert.deepEqual(r.names, ['Name', 'n', 'n', 'z', 'f', 'b', 'q']);
    assert.equal(r.types[1], 'REAL');
    assert.deepEqual(r.rows.map((x) => [...x.slice(0, 5), x[6]]), [['b', 2, 2, null, 1.5, "it's"], ['a', 1, 1, null, 1.5, "it's"]]);
    assert.deepEqual([...(r.rows[0][5] as unknown as Uint8Array)], [1, 2]);
    assert.deepEqual(store.select('VALUES (1), (2), (3)', [], 2).rows, [[1], [2]]);
    assert.deepEqual(store.select('WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c) SELECT x FROM c', [], 3).rows, [[1], [2], [3]]);
    assert.deepEqual(store.select('SELECT n FROM T ORDER BY n DESC LIMIT 1').rows, [[2]]);
    assert.deepEqual(store.queryWithOrigins('SELECT Name AS who FROM T ORDER BY Name -- done\n').rows.map((x) => ({ ...x })), [{ who: 'a' }, { who: 'b' }]);
    const big = store.select('SELECT hex(zeroblob(20000000)) AS h').rows[0][0] as string;
    assert.equal(big.length, 40_000_000);
  });
});

test('exporting a file with a row larger than the cap still works', () => {
  withStore((store) => {
    store.applyDesign([{ op: 'createTable', name: 'Big', fields: [{ name: 'Body' }] }]);
    store.create('Big', { Body: 'y'.repeat(70 * 2 ** 20) });
    let bytes = 0;
    const report = exportSql(store, { write: (text) => { bytes += text.length; }, file: () => {} }, { dialect: 'sqlite' });
    assert.equal(report.rows, 1);
    assert.ok(bytes > 70 * 2 ** 20);
  });
});

test('queries keep the 2000 columns SQLite allows', () => {
  withStore((store) => {
    for (const n of [1, 997, 998, 999, 1000, 1001, 1999, 2000]) {
      const select = `SELECT ${Array.from({ length: n }, (_, i) => `${i} AS c${i}`).join(', ')}`;
      const r = store.select(select);
      assert.equal(r.names.length, n, `${n} columns`);
      assert.deepEqual(r.rows[0].slice(-1), [n - 1]);
      assert.equal(Object.keys(store.queryWithOrigins(select).rows[0]).length, n);
    }
    // And the guard still sees a big value in the last of many columns.
    const wide = `SELECT ${Array.from({ length: 1500 }, (_, i) => `${i} AS c${i}`).join(', ')}, hex(zeroblob(40000000)) AS big`;
    assert.throws(() => store.select(wide), tooBig);
  });
});

test('rows of numbers and NULLs count too: a result of many cells cannot fill the heap', () => {
  const child = spawnSync(process.execPath, ['--no-warnings', '--max-old-space-size=640', '--input-type=module', '-e', `
    import { mkdtempSync } from 'node:fs';
    import { tmpdir } from 'node:os';
    import { join } from 'node:path';
    import { createStore, Store } from ${JSON.stringify(join(import.meta.dirname, '../src/index.ts'))};
    const dir = mkdtempSync(join(tmpdir(), 'tabularius-sql-cells-'));
    createStore(join(dir, 'Shop.sqlite'));
    const store = new Store(join(dir, 'Shop.sqlite'), 'Shop');
    const columns = Array.from({ length: 900 }, (_, i) => 'x + 0.5 AS a' + i).join(', ');
    try { store.select('WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c WHERE x < 100000) SELECT ' + columns + ' FROM c', [], 100001); console.log('returned'); } catch (e) { console.log(e.code); }
    store.close();
  `], { encoding: 'utf8', timeout: 120_000 });
  assert.equal(child.status, 0, child.stderr.slice(-400));
  assert.equal(child.stdout.trim(), '812');
});
