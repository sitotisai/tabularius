// A recursive query runs apart from the server (sql-recursive.ts), and must give what the same expression gives in the
// server: every function the store defines in place of SQLite's own (ROUND, LOWER, UPPER, DEGREES ...) is the same
// implementation in both, or the query is refused. A new override that the child does not share fails here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createStore, Store, StoreError } from '../src/index.ts';

function fixture(t: { after: (fn: () => void) => void }) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-sql-parity-'));
  const path = join(dir, 'P.sqlite');
  createStore(path);
  const store = new Store(path);
  t.after(() => { store.close(); rmSync(dir, { recursive: true, force: true }); });
  return store;
}

/** An expression's answer: its value, or the error it gives. */
function answer(run: () => unknown): string {
  try { return JSON.stringify(run(), (_k, v) => (typeof v === 'bigint' ? `${v}n` : typeof v === 'number' && !Number.isFinite(v) ? String(v) : v)); }
  catch (e) { return `error ${e instanceof StoreError ? e.code : ''}`; }
}

const fixed = [
  ["lower('ÄÖÜ É')", 'äöü é'],
  ["upper('straße é')", 'STRASSE É'],
  ['round(1.005, 2)', 1.01],
  ['round(123.456, -1)', 120],
  ['degrees(3.141592653589793)', 180],
] as const;

test('a recursive query gives the values the server gives for the functions it replaces', (t) => {
  const store = fixture(t);
  for (const [expression, expected] of fixed) {
    const plain = store.select(`select ${expression}`).rows[0][0];
    const viaChild = store.select(`with recursive c(x) as (select 1 union all select x + 1 from c where x < 2) select ${expression} from c where x = 1`).rows[0][0];
    assert.equal(plain, expected, `${expression} in the server`);
    assert.deepEqual(viaChild, plain, `${expression} in a recursive query`);
  }
});

test('every function the store defines in place of a SQLite built-in answers alike in a recursive query, or the query is refused', (t) => {
  const store = fixture(t);
  const probe = new DatabaseSync(':memory:');
  const builtin = new Set((probe.prepare('PRAGMA function_list').all() as { name: string }[]).map((f) => f.name.toLowerCase()));
  probe.close();
  const defined = (store as unknown as { queryFunctions: Map<string, unknown> }).queryFunctions;
  const overrides = [...defined.keys()].filter((n) => builtin.has(n.toLowerCase()));
  assert.ok(overrides.length >= 4, `found ${overrides.join(', ')}`);
  const pool = ["'ÄÖÜ É'", "'straße é'", "'İi ǅ'", '1.005', '2', '123.456', '-1', '2.5', '0', 'null', "'2024-02-03'", "'abc'"];
  for (const name of overrides) {
    const calls: string[] = [];
    for (const a of pool) calls.push(`${name}(${a})`);
    for (const a of pool) for (const b of pool) calls.push(`${name}(${a}, ${b})`);
    // The calls that work in the server, all in one recursive query (a child process starts per query).
    const plain = new Map<string, string>();
    for (const call of calls) {
      const got = answer(() => store.select(`select ${call}`).rows[0][0]);
      if (!got.startsWith('error')) plain.set(call, got);
    }
    const compared = plain.size;
    const list = [...plain.keys()];
    const viaChild = store.select(`with recursive c(x) as (select 1 union all select x + 1 from c where x < 2) select ${list.join(', ')} from c where x = 1`).rows[0];
    list.forEach((call, i) => assert.equal(answer(() => viaChild[i]), plain.get(call), `${call} in a recursive query`));
    assert.ok(compared > 0, `${name} was called with no argument list that works, so nothing was compared`);
  }
});

test('a function the store defines in place of a SQLite built-in, without being shared, makes a recursive query refused, not different', (t) => {
  const store = fixture(t);
  store.defineQueryFunction('abs', () => 42);
  assert.equal(store.select('select abs(-1)').rows[0][0], 42);
  assert.throws(() => store.select('with recursive c(x) as (select 1 union all select x + 1 from c where x < 2) select abs(-1) from c'),
    (e: unknown) => e instanceof StoreError && e.code === 8310 && /abs\(\)/.test(e.message));
});
