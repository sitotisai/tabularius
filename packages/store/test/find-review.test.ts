import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store, StoreError, type FindRequest } from '../src/index.ts';
import { removeAtExit } from '../../../scripts/test-remove-at-exit.ts';

function fixture(t: { after: (fn: () => void) => void }) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-find-review-'));
  const path = join(dir, 'Find.sqlite');
  createStore(path);
  const store = new Store(path);
  t.after(() => { store.close(); });
  removeAtExit(dir);
  store.applyDesign([
    { op: 'createTable', name: 'Items', fields: [
      { name: 'Text', options: { indexLanguage: 'Japanese' } }, { name: 'Number', type: 'number' },
      { name: 'Visible', type: 'number' }, { name: 'Tags', options: { repetitions: 3 } },
    ] },
    { op: 'createField', table: 'Items', name: 'Calc', type: 'text', kind: 'calculation', calculation: 'Lower ( Text )', options: { unstored: true } },
    { op: 'createTable', name: 'Links', fields: [{ name: 'Item' }] },
    { op: 'createRelationship', left: 'Links', right: 'Items', predicates: [{ left: 'Item', right: 'Text' }] },
  ]);
  return { store, path };
}

for (const field of ['Text', 'Tags', 'Calc']) for (const related of [false, true]) {
  test(`duplicates exclude hidden records: ${related ? 'related ' : ''}${field}`, (t) => {
    const { store } = fixture(t);
    const visible = store.create('Items', { Text: 'secret-code', 'Tags(2)': 'secret-code', Visible: 1 }).recordId;
    const hidden = store.create('Items', { Text: 'secret-code', 'Tags(2)': 'secret-code', Visible: 0 }).recordId;
    const link = store.create('Links', { Item: 'secret-code' }).recordId;
    store.savePrivilegeSet({ name: 'Reader', records: { view: true, edit: false, create: false, delete: false },
      tables: { Items: { view: 'Visible = 1', edit: false, create: false, delete: false } },
      layouts: 'viewOnly', valueLists: 'viewOnly', scripts: 'viewOnly', extendedPrivileges: ['fmapp'] });
    store.setPassword('Reader', 'pw', 'Reader');
    const privileges = store.privileges('Reader');
    const layout = related ? 'Links' : 'Items';
    const query = [{ [related ? `Items::${field}` : field]: '!' }];
    assert.equal(store.find(layout, { query, privileges }).foundCount, 0);
    assert.deepEqual(store.findIds(layout, { query, privileges }), []);
    assert.equal(store.find(layout, { query }).foundCount, related ? 1 : 2);
    store.update('Items', hidden, { Visible: 1 });
    assert.deepEqual(store.findIds(layout, { query, privileges }), related ? [link] : [visible, hidden]);
  });
}

test('pathological wildcards finish within a second without blocking the test runner', (t) => {
  const { store, path } = fixture(t);
  store.create('Items', { Text: 'a'.repeat(60) });
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import { Store } from ${JSON.stringify(join(import.meta.dirname, '../src/index.ts'))};
    const store = new Store(${JSON.stringify(path)});
    const start = performance.now();
    assert.equal(store.find('Items', { query: [{ Text: 'a*'.repeat(20) + 'b#' }] }).foundCount, 0);
    assert.ok(performance.now() - start < 1000, 'matching must finish within one second');
    store.close();
  `], { encoding: 'utf8', timeout: 20_000 }); // the child times the matching itself; this only catches a hang, however slowly a busy runner starts a process
  assert.equal(result.error, undefined, String(result.error));
  assert.equal(result.status, 0, result.stderr);
});

test('oversized criteria and matching work return FileMaker error 400', (t) => {
  const { store } = fixture(t);
  store.create('Items', { Text: 'a'.repeat(100000) });
  for (const Text of ['#'.repeat(100000), 'a*'.repeat(2000) + 'b#']) {
    for (const find of [() => store.find('Items', { query: [{ Text }] }), () => store.findIds('Items', { query: [{ Text }] })]) {
      assert.throws(find, (e: unknown) => e instanceof StoreError && e.code === 400);
    }
  }
});

test('calculated duplicates materialize once and use an indexed record lookup', (t) => {
  const { store } = fixture(t);
  store.sql.exec(`WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n WHERE x<10000)
    INSERT INTO Items (_fm_record_id, Text) SELECT x, 'duplicate' FROM n`);
  const calc = t.mock.method(store.calc, 'unstoredValue');
  assert.equal(store.find('Items', { query: [{ Calc: '!' }], limit: 0 }).foundCount, 10000);
  assert.equal(calc.mock.callCount(), 10000, 'one calculation per source record');
  const plan = store.sql.prepare('EXPLAIN QUERY PLAN SELECT * FROM temp._fm_find WHERE _fm_record_id = ?').all(1);
  assert.match(JSON.stringify(plan), /SEARCH .* USING .*(INDEX|PRIMARY KEY)/);
  calc.mock.resetCalls();
  assert.equal(store.findIds('Items', { query: [{ Calc: '!' }] }).length, 10000);
  assert.equal(calc.mock.callCount(), 10000);
});

test('numeric wildcards match complete values, never decimal or signed fragments', (t) => {
  const { store } = fixture(t);
  const values = [3, 30, 30.3, -3, 3.3, 300];
  const ids = values.map((Number) => store.create('Items', { Number }).recordId);
  for (const [Number, expected] of [['#', [ids[0]]], ['##.#', [ids[2]]], ['-#', [ids[3]]], ['#.#', [ids[4]]]] as const) {
    assert.deepEqual(store.findIds('Items', { query: [{ Number }] }), expected);
  }
});

test('invalid numeric data means nonempty values containing no digits', (t) => {
  const { store } = fixture(t);
  const bad = store.create('Items', { Number: 'twelve' }).recordId;
  for (const Number of ['twelve30', 12, 0, '', '-3.5']) store.create('Items', { Number });
  store.create('Items', {});
  assert.deepEqual(store.findIds('Items', { query: [{ Number: '?' }] }), [bad]);
});

test('relaxed Japanese finds voiced kana inside words with and without word indexing', (t) => {
  const { store } = fixture(t);
  const ids = ['は', 'ハナ', 'おばさん'].map((Text) => store.create('Items', { Text }).recordId);
  for (const enabled of [true, false]) {
    store.words.enabled = enabled;
    assert.deepEqual(store.findIds('Items', { query: [{ Text: '~は' }] }), ids);
    assert.deepEqual(store.findIds('Items', { query: [{ Text: '~==は' }] }), [ids[0]]);
    assert.deepEqual(store.findIds('Items', { query: [{ Text: '~=は*' }] }), ids.slice(0, 2));
  }
});

test('find requests apply includes and omits in order, starting from all for an initial omit', (t) => {
  const { store } = fixture(t);
  const ids = ['dup', 'dup', 'solo'].map((Text) => store.create('Items', { Text }).recordId);
  for (const [query, expected] of [
    [[{ Text: '!', omit: 'true' }], [ids[2]]],
    [[{ Text: '!', omit: 'true' }, { Text: '*' }], ids],
    [[{ Text: '*' }, { Text: '!', omit: 'true' }], [ids[2]]],
    [[{ Text: '*' }, { Text: '!', omit: 'true' }, { Text: '!' }, { Text: 'solo', omit: 'true' }], ids.slice(0, 2)],
  ] as [FindRequest[], number[]][]) {
    assert.deepEqual(store.findIds('Items', { query }), expected);
    assert.deepEqual(store.find('Items', { query }).records.map((r) => r.recordId), expected);
  }
});

// Keep the slow baseline in a child: a matcher regression must not hang the suite.
test('matching work is shared across the whole find and finishes within eight seconds', (t) => {
  const { store, path } = fixture(t);
  store.create('Items', { Text: 'あ'.repeat(39000) });
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import { Store, StoreError } from ${JSON.stringify(join(import.meta.dirname, '../src/index.ts'))};
    const store = new Store(${JSON.stringify(path)});
    const query = Array.from({ length: 100 }, (_, i) => ({ Text: '~' + 'あ'.repeat(98) + 'い' + i }));
    const start = performance.now();
    for (const find of [() => store.find('Items', { query }), () => store.findIds('Items', { query })]) {
      assert.throws(find, (e) => e instanceof StoreError && e.code === 400);
      // Exhaustion must not leak into the next find or a cached pattern.
      assert.equal(store.find('Items', { query: [{ Text: '~あ' }] }).foundCount, 1);
    }
    // The work limit is enforced by FileMaker error 400 above. This wall-time
    // ceiling catches a matcher regression while allowing loaded CI runners
    // time to schedule the child process.
    assert.ok(performance.now() - start < 8000, 'find work must finish within eight seconds');
    store.close();
  `], { encoding: 'utf8', timeout: 12000 });
  assert.equal(result.error, undefined, String(result.error));
  assert.equal(result.status, 0, result.stderr);
});

test('aggregate query complexity rejects 1000 short requests with FileMaker error 400', (t) => {
  const { store } = fixture(t);
  const id = store.create('Items', { Text: 'x' }).recordId;
  const query = Array.from({ length: 1000 }, () => ({ Text: '==x' }));
  for (const find of [() => store.find('Items', { query }), () => store.findIds('Items', { query })]) {
    assert.throws(find, (e: unknown) => e instanceof StoreError && e.code === 400);
  }
  assert.deepEqual(store.findIds('Items', { query: query.slice(0, 100) }), [id]);
});

test('malformed numeric range endpoints return FileMaker find validation error 508', (t) => {
  const { store } = fixture(t);
  const id = store.create('Items', { Number: 30.3 }).recordId;
  for (const Number of ['1...2...3', '1…2…3', '1...bad', 'bad...40', '...2...3', '1...Infinity', '1... NaN ']) {
    const query = [{ Number }];
    for (const find of [() => store.find('Items', { query }), () => store.findIds('Items', { query })]) {
      assert.throws(find, (e: unknown) => e instanceof StoreError && e.code === 508, Number);
    }
  }
  for (const Number of ['1...40', '...40', '1...', '1…40', '1...1,000']) {
    assert.deepEqual(store.findIds('Items', { query: [{ Number }] }), [id], Number);
  }
});

for (const scope of ['records', 'criteria', 'repetitions', 'related fields', 'count and page'] as const) {
  test(`matching work is shared across ${scope}`, (t) => {
    const { store } = fixture(t);
    const Text = 'あ'.repeat(38000) + 'い';
    const pattern = '~*' + 'あ'.repeat(98) + 'い';
    const id = store.create('Items', { Text, 'Tags(1)': Text, 'Tags(2)': Text }).recordId;
    store.create('Links', { Item: Text });
    if (scope === 'records') store.create('Items', { Text });
    // A successful near-end match spends just under one budget by itself.
    const query: FindRequest[] = scope === 'criteria' ? [{ Text: pattern, Calc: pattern }]
      : scope === 'repetitions' ? [{ Tags: pattern + 'x' }]
      : scope === 'related fields' ? [{ 'Items::Text': pattern }, { 'Items::Calc': pattern }]
      : [{ Text: pattern }];
    const layout = scope === 'related fields' ? 'Links' : 'Items';
    if (scope !== 'count and page') {
      assert.throws(() => store.findIds(layout, { query }), (e: unknown) => e instanceof StoreError && e.code === 400);
    } else assert.deepEqual(store.findIds(layout, { query }), [id]);
    assert.throws(() => store.find(layout, { query }), (e: unknown) => e instanceof StoreError && e.code === 400);
  });
}

// The work limit is for a find that does more work than its records warrant, not for a find on a big table.
test('a wildcard find on a table of many short values is not refused as too complex', (t) => {
  const { store } = fixture(t);
  const rows = 40000;
  // 40,000 rows of about 45 characters, made in one statement: `*abc*` costs about 270 steps a row, 10 million in all.
  (store as unknown as { sql: { exec(sql: string): void } }).sql.exec(
    `INSERT INTO Items (_fm_record_id, Text) WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < ${rows})
     SELECT i, 'plain text of a normal length for a name ' || i || CASE WHEN i % 1000 = 0 THEN ' abc' ELSE '' END FROM n`);
  const hits = rows / 1000;
  for (const query of [[{ Text: '*abc*' }], [{ Text: '==*abc' }], [{ Text: '~*abc*' }]]) {
    assert.equal(store.find('Items', { query, limit: 1 }).foundCount, hits, JSON.stringify(query));
    assert.equal(store.findIds('Items', { query }).length, hits, JSON.stringify(query));
  }
});

test('a find too heavy for its records is still refused, and says it is the records it is too heavy for', (t) => {
  const { store } = fixture(t);
  store.create('Items', { Text: 'あ'.repeat(39000) });
  store.create('Items', { Text: 'あ'.repeat(39000) });
  const query: FindRequest[] = [{ Text: '~' + 'あ'.repeat(98) + 'い' }];
  assert.throws(() => store.findIds('Items', { query }), (e: unknown) => e instanceof StoreError && e.code === 400 && /complexity limit/.test(e.message) && /records/.test(e.message));
});

// The allowance is earned as values are read and one value has a ceiling of its own: one value an attacker wrote cannot
// spend what a table of other records earned.
type SqlHandle = { sql: { exec(sql: string): void } };
const insertRows = (store: Store, first: number, count: number, value: string) =>
  (store as unknown as SqlHandle).sql.exec(
    `INSERT INTO Items (_fm_record_id, Text) WITH RECURSIVE n(i) AS (SELECT ${first} UNION ALL SELECT i + 1 FROM n WHERE i < ${first + count - 1}) SELECT i, '${value}' FROM n`);

test('one long value cannot spend the allowance that a table of empty values earned', (t) => {
  const { store } = fixture(t);
  insertRows(store, 1, 100000, '');
  // 202 tokens against 30,000 characters is about 6 million steps: over what one value may spend, under what 100,000 records earn.
  store.create('Items', { Text: 'a'.repeat(30000) });
  const query: FindRequest[] = [{ Text: '*' + 'a'.repeat(200) + 'b*' }];
  assert.throws(() => store.findIds('Items', { query }), (e: unknown) => e instanceof StoreError && e.code === 400 && /complexity limit/.test(e.message));
  assert.throws(() => store.find('Items', { query, limit: 1 }), (e: unknown) => e instanceof StoreError && e.code === 400);
});

test('the allowance is earned by the records read before a value, not paid up front', (t) => {
  // Two values of about 3 million steps each: each is under the per-value ceiling, the pair is over the starting amount.
  const heavy = 'a'.repeat(14500), query: FindRequest[] = [{ Text: '*' + 'a'.repeat(200) + 'b*' }];
  const early = fixture(t).store;
  early.create('Items', { Text: heavy });
  early.create('Items', { Text: heavy });
  insertRows(early, 10, 10000, '');
  assert.throws(() => early.findIds('Items', { query }), (e: unknown) => e instanceof StoreError && e.code === 400);
  // The same two values after 10,000 records that earned 10 million steps are within the allowance.
  const late = fixture(t).store;
  insertRows(late, 1, 10000, '');
  late.create('Items', { Text: heavy });
  late.create('Items', { Text: heavy });
  assert.equal(late.findIds('Items', { query }).length, 0);
});

// A record earns its allowance once, however many criteria read it: padding a query with cheap criteria that never match
// must not fund a heavy one. Counted in steps, not time, so it does not depend on the machine.
test('a query padded with cheap criteria earns no more per record than one criterion does', (t) => {
  const { store } = fixture(t);
  store.applyDesign([{ op: 'createTable', name: 'Pad', fields: [{ name: 'Empty' }, { name: 'Notes' }] }]);
  const sql = (store as unknown as SqlHandle).sql;
  sql.exec(`INSERT INTO Pad (_fm_record_id, Empty, Notes) WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 500) SELECT i, '', '' FROM n`);
  // 8 records of about 3.9 million steps each against the heavy criterion: 31 million in all, far above what 500 records earn.
  sql.exec(`INSERT INTO Pad (_fm_record_id, Empty, Notes) WITH RECURSIVE n(i) AS (SELECT 501 UNION ALL SELECT i + 1 FROM n WHERE i < 508) SELECT i, '', '${'c'.repeat(950)}' FROM n`);
  const heavy: FindRequest = { Notes: '*' + 'c'.repeat(4094) + '*' };
  assert.throws(() => store.findIds('Pad', { query: [heavy] }), (e: unknown) => e instanceof StoreError && e.code === 400, 'the heavy criterion alone is refused');
  for (const padding of [1, 10, 127]) {
    const query: FindRequest[] = [...Array.from({ length: padding }, () => ({ Empty: '*z*' })), heavy];
    assert.throws(() => store.findIds('Pad', { query }), (e: unknown) => e instanceof StoreError && e.code === 400, `${padding} padding requests`);
    assert.throws(() => store.find('Pad', { query, limit: 1 }), (e: unknown) => e instanceof StoreError && e.code === 400, `${padding} padding requests, paged`);
  }
  // The same padding as one request's fields, and as the same criterion repeated.
  const fields: FindRequest = { Notes: heavy.Notes };
  assert.throws(() => store.findIds('Pad', { query: [{ ...fields, Empty: '*z*' } as FindRequest, heavy] }), (e: unknown) => e instanceof StoreError && e.code === 400);
});

test('several plain criteria, include and omit, on a table of many short values are not refused', (t) => {
  const { store } = fixture(t);
  const rows = 40000;
  (store as unknown as SqlHandle).sql.exec(
    `INSERT INTO Items (_fm_record_id, Text) WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < ${rows})
     SELECT i, 'plain text of a normal length for a name ' || i || CASE WHEN i % 1000 = 0 THEN ' abc' ELSE '' END FROM n`);
  const hits = rows / 1000;
  const queries: FindRequest[][] = [[{ Text: '*abc*' }, { Text: '*zzz*', omit: 'true' }], [{ Text: 'plain*normal*abc' }], [{ Text: '*a*b*c*d*e*' }, { Text: '*abc*' }]];
  for (const query of queries) {
    assert.equal(store.findIds('Items', { query }).length, hits, JSON.stringify(query));
    assert.equal(store.find('Items', { query, limit: 1 }).foundCount, hits, JSON.stringify(query));
  }
});

// A record earns once per scan however the SQL evaluates it: not once per criterion in the query text. SQLite skips the
// second term of an AND (and of an omit) on records the first one did not match, and calls the matcher once per
// repetition of a repeating field.
test('include plus omit and several fields at once on many rows of about 105 characters are not refused', (t) => {
  const { store } = fixture(t);
  store.applyDesign([{ op: 'createTable', name: 'Wide', fields: [{ name: 'Text' }, { name: 'B' }] }]);
  const rows = 40000;
  (store as unknown as SqlHandle).sql.exec(
    `INSERT INTO Wide (_fm_record_id, Text, B) WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < ${rows})
     SELECT i, 'plain text of a normal length for a name ' || i || ' and then some more words to make the value about a hundred characters' || CASE WHEN i % 1000 = 0 THEN ' abc' ELSE '' END, 'other value ' || i FROM n`);
  const hits = rows / 1000;
  const queries: FindRequest[][] = [
    [{ Text: '*abc*' }, { Text: '*zzz*', omit: 'true' }],
    [{ Text: '*abc*' }, { Text: '*9*', omit: 'true' }],
    [{ Text: '*abc*', B: '*value*' }],
  ];
  for (const query of queries) {
    const ids = store.findIds('Wide', { query });
    assert.ok(ids.length > 0 && ids.length <= hits, JSON.stringify(query));
  }
  assert.equal(store.findIds('Wide', { query: queries[0] }).length, hits);
  assert.equal(store.findIds('Wide', { query: queries[2] }).length, hits);
});

test('a repeating field in a padding criterion earns no more per record than any other', (t) => {
  const { store } = fixture(t);
  const reps = 1000;
  store.applyDesign([{ op: 'createTable', name: 'Rep', fields: [{ name: 'Reps', options: { repetitions: reps } }, { name: 'Notes' }] }]);
  const sql = (store as unknown as SqlHandle).sql;
  const array = JSON.stringify(Array.from({ length: reps }, () => 'x'));
  sql.exec(`INSERT INTO Rep (_fm_record_id, Reps, Notes) WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 500) SELECT i, '${array}', '' FROM n`);
  sql.exec(`INSERT INTO Rep (_fm_record_id, Reps, Notes) WITH RECURSIVE n(i) AS (SELECT 501 UNION ALL SELECT i + 1 FROM n WHERE i < 508) SELECT i, '${array}', '${'c'.repeat(950)}' FROM n`);
  const heavy: FindRequest = { Notes: '*' + 'c'.repeat(4094) + '*' };
  assert.throws(() => store.findIds('Rep', { query: [heavy] }), (e: unknown) => e instanceof StoreError && e.code === 400, 'the heavy criterion alone is refused');
  const query: FindRequest[] = [{ Reps: '*z*' }, heavy];
  assert.throws(() => store.findIds('Rep', { query }), (e: unknown) => e instanceof StoreError && e.code === 400, 'padded with a repeating field');
  assert.throws(() => store.find('Rep', { query, limit: 1 }), (e: unknown) => e instanceof StoreError && e.code === 400, 'padded with a repeating field, paged');
});

// A record earns once per find per table, wherever the criteria come from: a related table's records earn once however
// many requests name it, and the SQL text of a find is the same every time it is built, so the sorted-page cache hits.
function relatedPadding(t: { after: (fn: () => void) => void }, calc = false) {
  const { store } = fixture(t);
  store.applyDesign([
    { op: 'createTable', name: 'Pad', fields: [{ name: 'Key' }, { name: 'Notes' }] },
    { op: 'createTable', name: 'Rel', fields: [{ name: 'K' }, { name: 'F' }] },
    { op: 'createRelationship', left: 'Pad', right: 'Rel', predicates: [{ left: 'Key', right: 'K' }] },
    ...(calc ? [{ op: 'createField', table: 'Rel', name: 'C', type: 'text', kind: 'calculation', calculation: 'F', options: { unstored: true } }] : []),
  ] as never);
  const sql = (store as unknown as SqlHandle).sql;
  sql.exec(`INSERT INTO Pad (_fm_record_id, Key, Notes) WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 8) SELECT i, 'k', '${'c'.repeat(950)}' FROM n`);
  sql.exec(`INSERT INTO Rel (_fm_record_id, K, F) WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 520) SELECT i, 'k', '' FROM n`);
  return store;
}

for (const calc of [false, true]) {
  test(`a query padded with criteria on ${calc ? 'an unstored calculation of ' : ''}a related table earns no more per related record than one criterion does`, (t) => {
    const store = relatedPadding(t, calc);
    const heavy: FindRequest = { Notes: '*' + 'c'.repeat(4094) + '*' };
    const field = calc ? 'Rel::C' : 'Rel::F';
    assert.throws(() => store.findIds('Pad', { query: [heavy] }), (e: unknown) => e instanceof StoreError && e.code === 400, 'the heavy criterion alone is refused');
    for (const padding of [1, 127]) {
      const query: FindRequest[] = [...Array.from({ length: padding }, () => ({ [field]: '*z*' })), heavy];
      assert.throws(() => store.findIds('Pad', { query }), (e: unknown) => e instanceof StoreError && e.code === 400, `${padding} related padding requests`);
    }
  });
}

test('a sorted found set with a wildcard criterion is sorted once across its pages', (t) => {
  const { store } = fixture(t);
  store.applyDesign([{ op: 'createTable', name: 'Sorted', fields: [{ name: 'T' }] }]);
  (store as unknown as SqlHandle).sql.exec(
    `INSERT INTO Sorted (_fm_record_id, T) WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 5000) SELECT i, 'name ' || (5000 - i) FROM n`);
  const sql = (store as unknown as { sql: { prepare(sql: string): unknown } }).sql;
  const prepare = sql.prepare.bind(sql) as (sql: string) => unknown;
  let sorts = 0;
  sql.prepare = (text: string) => { if (/SELECT _fm_record_id AS id FROM .* ORDER BY/.test(text)) sorts++; return prepare(text); };
  for (const T of ['name*', '*name*']) {
    sorts = 0;
    for (let page = 1; page <= 5; page++) {
      const found = store.find('Sorted', { query: [{ T }], sort: [{ fieldName: 'T', sortOrder: 'ascend' }], limit: 10, offset: page * 10 });
      assert.equal(found.foundCount, 5000);
      assert.equal(found.records.length, 10);
    }
    assert.equal(sorts, 1, `${T}: one sort for five pages`);
  }
});
