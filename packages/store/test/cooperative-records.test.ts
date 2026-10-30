import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store, writer, type Transaction, type FindRequest } from '../src/index.ts';
import { endTransaction } from '../src/activity.ts';
import { sortProgress } from '../src/cooperative.ts';

function fixture(t: import('node:test').TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-cooperative-'));
  const path = join(dir, 'Generated.sqlite');
  createStore(path);
  const store = new Store(path);
  t.after(() => { store.close(); rmSync(dir, { recursive: true, force: true }); });
  store.applyDesign([
    { op: 'createTable', name: 'Items', fields: [{ name: 'Value', type: 'number' }, { name: 'Label' }] },
    { op: 'createField', table: 'Items', name: 'Computed', type: 'number', kind: 'calculation', calculation: '-Value', options: { unstored: true } },
  ]);
  store.sql.exec("WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n WHERE x < 600) INSERT INTO Items (Value, Label) SELECT x % 13, 'generated' FROM n");
  return store;
}
function drain<T>(work: Generator<number | void, T>): { result: T; batches: number; records: number } {
  let batches = 0, records = 0;
  for (;;) {
    const next = work.next();
    if (next.done) return { result: next.value, batches, records };
    batches++;
    records += next.value ?? 0;
  }
}

test('find scans yield even with no matches and preserve ordered omit, duplicate and computed criteria', (t) => {
  const store = fixture(t);
  const queries: (FindRequest[] | undefined)[] = [undefined, [{ Value: '999' }], [{ Value: '>=5' }, { Value: '7', omit: 'true' }], [{ Label: '!' }], [{ Computed: '<-8' }]];
  for (const query of queries) {
    const expected = store.findIds('Items', { query });
    const { result, batches, records } = drain(store.findIdsProgress('Items', { query }));
    assert.deepEqual(result, expected);
    // A find on an unstored calculation or a duplicate search runs whole; the others yield for every batch of record ids, even with no matches.
    if (JSON.stringify(query ?? []).includes('Computed') || JSON.stringify(query ?? []).includes('"!"')) continue;
    assert.ok(batches >= 1);
    assert.ok(records >= 600);
  }
});

test('stored and computed sorts agree with SQL order; a computed one yields through the merge phase', (t) => {
  const store = fixture(t);
  const ids = store.findIds('Items');
  for (const fieldName of ['Value', 'Computed', 'Label']) for (const sortOrder of ['ascend', 'descend']) {
    const sort = [{ fieldName, sortOrder }];
    const expected = store.findIds('Items', { sort });
    const work = store.sortIdsProgress('Items', ids, sort);
    let mergeBatches = 0;
    for (;;) {
      const next = work.next();
      if (next.done) { assert.deepEqual(next.value, expected); break; }
      if (next.value === ids.length) mergeBatches++;
    }
    // A sort on an unstored calculation merges in batches; a stored one is the SQL order, in pages.
    if (fieldName === 'Computed') assert.ok(mergeBatches > 2);
  }
});

test('merge sort is stable, covers incomplete batches, and does not mutate input', () => {
  const items = Array.from({ length: 5_000 }, (_, id) => ({ id, rank: (id * 17) % 11 }));
  const expected = items.slice().sort((a, b) => a.rank - b.rank);
  const { result, batches } = drain(sortProgress(items, (a, b) => a.rank - b.rank));
  assert.deepEqual(result, expected);
  assert.equal(items[0].id, 0);
  assert.ok(batches > 10);
});

test('a find retains its pattern-work budget across batches', (t) => {
  const store = fixture(t);
  store.sql.prepare('UPDATE Items SET Label = ?').run('a'.repeat(4000));
  const query = [{ Label: '*z' }];
  assert.throws(() => store.findIds('Items', { query }), /complexity limit/);
  assert.throws(() => drain(store.findIdsProgress('Items', { query })), /complexity limit/);
});

test('a progressive find still reports one complete timing observation', (t) => {
  const store = fixture(t);
  const counts: number[] = [];
  store.findListener = (event) => { counts.push(event.found ?? -1); };
  const result = drain(store.findIdsProgress('Items', { query: [{ Value: '5' }] })).result;
  assert.deepEqual(counts, [result.length]);
});

test('a sort over stored fields equals the SQL order of main, for native integers, text in number fields and value lists', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-cooperative-sort-'));
  const path = join(dir, 'Native.sqlite');
  createStore(path, { mode: 'native' });
  const store = new Store(path);
  t.after(() => { store.close(); });
  store.applyDesign([
    { op: 'createTable', name: 'T', fields: [{ name: 'Int', type: 'integer' }, { name: 'Dec', type: 'decimal' }, { name: 'Bool', type: 'boolean' }, { name: 'Txt' }] },
    { op: 'createValueList', name: 'VL', values: ['b', 'a', '10', 'Zed'] },
  ]);
  for (const [i, d, b, x] of [[9, '1.5', 1, 'b'], [10, '10', 0, 'a'], [100, '-2', 1, ''], [-5, '0.33', 0, 'Z'], [2, '2', 1, 'é'], [33, '100.0', 0, 'e']] as [number, string, number, string][]) {
    store.create('T', { Int: String(i), Dec: d, Bool: String(b), Txt: x });
  }
  store.create('T', { Txt: 'x' });
  const ids = store.findIds('T');
  for (const fieldName of ['Int', 'Dec', 'Bool', 'Txt']) for (const sortOrder of ['ascend', 'descend', 'VL']) {
    const sort = [{ fieldName, sortOrder }];
    const expected = store.findIds('T', { sort });
    assert.deepEqual(store.sortIds('T', ids, sort), expected, `${fieldName} ${sortOrder}`);
    assert.deepEqual(drain(store.sortIdsProgress('T', ids, sort)).result, expected, `${fieldName} ${sortOrder} (progress)`);
  }
  // A number field that holds text sorts by CAST(x AS REAL), as the SQL order does.
  const classic = join(dir, 'Classic.sqlite');
  createStore(classic);
  const other = new Store(classic);
  t.after(() => other.close());
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  other.applyDesign([{ op: 'createTable', name: 'N', fields: [{ name: 'Num', type: 'number' }] }]);
  const insert = other.sql.prepare('INSERT INTO N (Num) VALUES (?)');
  for (const v of [3, 10, 2.5, -1, null, '', 'abc', '12abc', '0x10', ' 7 ', 1e3, '1,5', 0, 'Infinity']) insert.run(v);
  const all = other.findIds('N');
  for (const sortOrder of ['ascend', 'descend']) {
    const sort = [{ fieldName: 'Num', sortOrder }];
    assert.deepEqual(drain(other.sortIdsProgress('N', all, sort)).result, other.findIds('N', { sort }), `number ${sortOrder}`);
  }
});

test('a computed find stays whole when another session reverts a transaction while it yields', (t) => {
  const store = fixture(t);
  const query = [{ Computed: '<0' }];
  const expected = store.findIds('Items', { query }).length;
  for (const early of [false, true]) {
    const tx: Transaction = { files: new Map() };
    const work = store.findIdsProgress('Items', { query });
    const other = () => writer.run({ owner: 'B', transaction: { open: tx } }, () => store.update('Items', 600, { Value: 600 }));
    if (early) other();
    let step = work.next();
    if (!early) other();
    for (let i = 0; i < 200 && !step.done; i++) step = work.next();
    endTransaction(tx, false);
    while (!step.done) step = work.next();
    assert.equal(step.value.length, expected, early ? 'revert before the first batch' : 'revert after the first batch');
  }
});

test('a progressive find names the same work-budget scope as findIds in every statement it runs', (t) => {
  const store = fixture(t);
  store.applyDesign([
    { op: 'createOccurrence', name: 'Alias', table: 'Items' },
    { op: 'createRelationship', left: 'Items', right: 'Alias', predicates: [{ left: 'Value', right: 'Value' }] },
  ]);
  const query = [{ Label: '*z', 'Alias::Label': '*z' }];
  const scopes = (find: () => unknown): string[] => {
    const seen = new Set<string>();
    const db = store.sql as unknown as { prepare: (text: string) => unknown };
    const prepare = db.prepare.bind(db);
    db.prepare = (text: string) => {
      for (const m of text.matchAll(/fm_find_text\([^)]*_fm_record_id, (\d+)\)/g)) seen.add(m[1]);
      return prepare(text);
    };
    try { find(); } finally { delete (db as { prepare?: unknown }).prepare; }
    return [...seen].sort();
  };
  const expected = scopes(() => store.findIds('Items', { query }));
  assert.ok(expected.length > 0 && !expected.includes('0'), `scopes named by findIds: ${expected.join(',')}`);
  // A record earns its share of the budget once per scope: a scope that differs from the related lookup's earns it twice.
  assert.deepEqual(scopes(() => drain(store.findIdsProgress('Items', { query }))), expected);
});

test('a find on an unstored calculation runs whole and is charged afterwards: no temporary table outlives a yield', (t) => {
  const store = fixture(t);
  // One yield only, after the whole find, charging the table's records; nothing is left open while it waits.
  const { result, batches, records } = drain(store.findIdsProgress('Items', { query: [{ Computed: '<-8' }] }));
  assert.deepEqual(result, store.findIds('Items', { query: [{ Computed: '<-8' }] }));
  assert.equal(batches, 1);
  assert.equal(records, 600);
});

/** Runs `find` and counts how many times any statement was executed (all, get, iterate or run) while it ran. */
function executions(store: Store, find: () => unknown): number {
  const db = store.sql as unknown as { prepare: (text: string) => Record<string, unknown> };
  const prepare = db.prepare.bind(db);
  let count = 0;
  db.prepare = (text: string) => {
    const statement = prepare(text);
    return new Proxy(statement, { get(target, key) {
      const value = target[key as string];
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) => { if (['all', 'get', 'iterate', 'run'].includes(String(key))) count++; return (value as (...a: unknown[]) => unknown).apply(target, args); };
    } });
  };
  try { find(); } finally { delete (db as { prepare?: unknown }).prepare; }
  return count;
}

function bigFixture(t: import('node:test').TestContext, rows = 5_000) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-cooperative-big-'));
  const path = join(dir, 'Big.sqlite');
  createStore(path);
  const store = new Store(path);
  t.after(() => { store.close(); rmSync(dir, { recursive: true, force: true }); });
  store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name' }, { name: 'Value', type: 'number' }] }]);
  store.sql.exec('BEGIN');
  const insert = store.sql.prepare('INSERT INTO Items (Name, Value) VALUES (?, ?)');
  for (let i = 0; i < rows; i++) insert.run(`n${i % (rows / 2)}`, i % 1000);
  store.sql.exec('COMMIT');
  return store;
}

test('a find on stored fields is read in batches of record ids, with no work that repeats per batch', (t) => {
  const store = bigFixture(t);
  const query = [{ Value: '>5' }];
  const expected = store.findIds('Items', { query });
  const { result, batches } = drain(store.findIdsProgress('Items', { query }));
  assert.deepEqual(result, expected);
  assert.ok(batches >= 4 && batches <= 8, `batches: ${batches}`);
  // Two statements prepared once and run once per batch, not statements re-run with a growing parameter.
  assert.ok(executions(store, () => drain(store.findIdsProgress('Items', { query }))) <= 2 * batches + 4);
});

test('a find whose criteria hold a subquery, or whose account has a record rule, runs whole, as findIds does', (t) => {
  const store = bigFixture(t);
  store.savePrivilegeSet({ name: 'R', records: { view: true, edit: true, create: true, delete: true }, tables: { Items: { view: 'Value < 500', edit: true, create: true, delete: true } },
    layouts: 'viewOnly', valueLists: 'viewOnly', scripts: 'viewOnly', extendedPrivileges: [] } as never);
  store.setPassword('r', ['a', 'b'].join('-'), 'R');
  const restricted = { privileges: store.privileges('r') };
  const cases: [string, { query?: FindRequest[]; privileges?: ReturnType<Store['privileges']> }][] = [
    ['duplicates', { query: [{ Name: '!' }] }], ['record rule', { ...restricted, query: [{ Value: '>5' }] }], ['record rule, no criteria', restricted]];
  for (const [name, opts] of cases) {
    const expected = store.findIds('Items', opts);
    assert.ok(expected.length > 0, name);
    const { result, batches, records } = drain(store.findIdsProgress('Items', opts));
    assert.deepEqual(result, expected, name);
    assert.equal(batches, 1, `${name} runs whole: one yield, after the find`);
    // An account with a record rule is charged for the records it got: the size of the table is not for it to learn.
    assert.equal(records, opts.privileges ? expected.length : 5_000, `${name} is charged for what it scanned`);
    // A duplicate search or an account's allowed ids is work for the whole find: a handful of statements, not one per batch.
    assert.ok(executions(store, () => drain(store.findIdsProgress('Items', opts))) <= 8, `${name}: statement executions`);
  }
});

test('a sort on an unstored calculation does not reopen the design for every record it reads', (t) => {
  const store = bigFixture(t, 3_000);
  store.applyDesign([{ op: 'createField', table: 'Items', name: 'Computed', type: 'number', kind: 'calculation', calculation: '-Value', options: { unstored: true } }]);
  const ids = store.findIds('Items');
  const sort = [{ fieldName: 'Computed', sortOrder: 'ascend' }];
  // Each entry into a design-read scope re-reads the design version from SQLite (the first schema access in it does).
  const scopes = (work: () => unknown): number => {
    const holder = store as unknown as { withDesignRead: (run: () => unknown) => unknown };
    const real = holder.withDesignRead.bind(store);
    let count = 0;
    holder.withDesignRead = (run) => { count++; return real(run); };
    try { work(); } finally { delete (holder as { withDesignRead?: unknown }).withDesignRead; }
    return count;
  };
  // Yields come every 256 records and every few thousand comparisons, never once per record or per few comparisons.
  const batched = scopes(() => drain(store.sortIdsProgress('Items', ids, sort)));
  assert.ok(batched <= ids.length / 32, `design-read scopes during a progressive sort of ${ids.length} records: ${batched}`);
  assert.equal(scopes(() => store.sortIds('Items', ids, sort)), 1, 'a whole sort is one scope');
  assert.deepEqual(drain(store.sortIdsProgress('Items', ids, sort)).result, store.sortIds('Items', ids, sort));
});
