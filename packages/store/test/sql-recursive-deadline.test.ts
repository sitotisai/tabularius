// A recursive query that never ends is stopped, and one that does end gives what it would have given in this process.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store, StoreError } from '../src/index.ts';
import { RECURSIVE_SQL, usesRecursion, type Op } from '../src/sql-recursive.ts';

function fixture(t: { after: (fn: () => void) => void }, native = false) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-sql-recursive-'));
  const path = join(dir, 'R.sqlite');
  createStore(path);
  const store = new Store(path);
  t.after(() => { store.close(); rmSync(dir, { recursive: true, force: true }); });
  store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name' }, { name: 'Qty', type: 'number' }] }] as never);
  for (let i = 1; i <= 5; i++) store.create('Items', { Name: `item ${i}`, Qty: i });
  return store;
}

const ENDLESS = 'with recursive c(x) as (select 1 union all select x + 1 from c) select count(*) from c';

test('a recursive query that never ends is stopped at the deadline, and the store answers afterwards', (t) => {
  const store = fixture(t);
  const before = RECURSIVE_SQL.ms;
  RECURSIVE_SQL.ms = 700;
  t.after(() => { RECURSIVE_SQL.ms = before; });
  for (const run of [() => store.select(ENDLESS), () => store.queryWithOrigins(ENDLESS)]) {
    const started = performance.now();
    assert.throws(run, (e: unknown) => e instanceof StoreError && e.code === 812 && /recursive query ran longer than 0\.7 seconds/.test(e.message));
    assert.ok(performance.now() - started < 4000, 'it was stopped, not left to run');
  }
  // Without the RECURSIVE keyword, which SQLite does not need, and with UNION.
  assert.throws(() => store.select('with c(x) as (select 1 union select x + 1 from c) select max(x) from c'), (e: unknown) => e instanceof StoreError && e.code === 812);
  assert.equal(store.select('select count(*) from Items').rows[0][0], 5);
});

test('a recursive query that ends gives the rows it would give here, with their types', (t) => {
  const store = fixture(t);
  const sql = `with recursive c(x) as (select 1 union all select x + 1 from c where x < ?) select x, x * 1.5, 'é' || x, zeroblob(2), null, (select count(*) from Items), 1e999 from c`;
  const r = store.select(sql, [4]);
  assert.deepEqual(r.names.slice(0, 3), ['x', 'x * 1.5', "'é' || x"]);
  assert.equal(r.rows.length, 4);
  assert.deepEqual(r.rows[1].slice(0, 3), [2, 3, 'é2']);
  const blob: unknown = r.rows[0][3];
  assert.ok(blob instanceof Uint8Array && blob.length === 2);
  assert.equal(r.rows[0][4], null);
  assert.equal(r.rows[0][5], 5, 'it reads the file');
  assert.equal(r.rows[0][6], Infinity);
  // The same answer as the plain connection gives for the rows that do not depend on the child.
  assert.equal(store.select(sql.replace('x < ?', 'x < 4')).rows.length, 4);
  // The row limit and the size caps hold in the child.
  assert.equal(store.select('with recursive c(x) as (select 1 union all select x + 1 from c where x < 1000) select x from c', [], 10).rows.length, 10);
  assert.throws(() => store.select("with recursive c(x) as (select 1 union all select x + 1 from c where x < 3) select printf('%.*c', 100000000, 'a') from c"),
    (e: unknown) => e instanceof StoreError && e.code === 812);
});

test('a recursive query reads native decimal fields as REAL, as SQL does everywhere else', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-sql-recursive-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'N.sqlite');
  createStore(path, { mode: 'native' } as never);
  const store = new Store(path);
  t.after(() => store.close());
  store.applyDesign([{ op: 'createTable', name: 'Prices', fields: [{ name: 'Amount', type: 'decimal' }] }] as never);
  assert.equal(store.fileMode, 'native');
  store.create('Prices', { Amount: '10' });
  store.create('Prices', { Amount: '9' });
  const plain = store.select('select Amount from Prices where Amount > 9.5').rows;
  const viaChild = store.select('with recursive c(x) as (select 1 union all select x + 1 from c where x < 2) select Amount from Prices, c where x = 1 and Amount > 9.5').rows;
  assert.deepEqual(viaChild, plain);
});

test('what counts as a recursive query: the recursion, not a window function, a CTE or a plain loop', (t) => {
  const store = fixture(t);
  const ops = (sql: string) => (store as unknown as { sql: { prepare(s: string): { all(): unknown[] } } }).sql.prepare(`EXPLAIN ${sql}`).all() as Op[];
  assert.ok(usesRecursion(ops(ENDLESS)));
  assert.ok(usesRecursion(ops('with c(x) as (select 1 union select x + 1 from c where x < 5) select * from c')));
  for (const sql of [
    'select Qty, sum(Qty) over (order by Qty rows between 1 preceding and current row) from Items',
    'select Name, row_number() over (partition by Qty order by Name) from Items',
    'with c(x) as (select 1) select * from c',
    'select distinct Name from Items order by Name',
    'select Name from Items union select Name from Items except select Name from Items',
  ]) assert.ok(!usesRecursion(ops(sql)), sql);
});

test('queries that do not recurse run in this process, and a recursive one cannot call a function this store defines', (t) => {
  const store = fixture(t);
  assert.equal(store.select('select sum(Qty), max(Name), json_array(1) from Items').rows[0][0], 15);
  assert.equal(store.select('select Qty, sum(Qty) over (order by Qty) from Items').rows.length, 5);
  store.defineQueryFunction('pg_demo', () => 1);
  assert.equal(store.select('select pg_demo()').rows[0][0], 1);
  assert.throws(() => store.select('with recursive c(x) as (select 1 union all select x + 1 from c where x < 3) select pg_demo() from c'),
    (e: unknown) => e instanceof StoreError && e.code === 8310 && /pg_demo/.test(e.message));
});
