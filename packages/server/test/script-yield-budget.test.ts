import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createStore, Store, writer } from '@tabularius/store';
import { runScript } from '@tabularius/scripts';
import { serve } from '../src/index.ts';

const ROWS = 60_000;
const replace = 'Replace Field Contents [ With dialog: Off ; Items::Value ; Items::Value + 1 ]';
function seed(dir: string, rows = ROWS) {
  const path = join(dir, 'Synthetic.openhbam.sqlite');
  createStore(path);
  const store = new Store(path, 'Synthetic');
  store.applyDesign([
    { op: 'createTable', name: 'Items', fields: [{ name: 'Value', type: 'number' }] },
    { op: 'createScript', name: 'Bulk', text: `Open Transaction\n${[replace, replace, replace].join('\n')}\nCommit Transaction` },
  ]);
  store.sql.exec('BEGIN');
  const insert = store.sql.prepare('INSERT INTO Items (Value) VALUES (0)');
  for (let i = 0; i < rows; i++) insert.run();
  store.sql.exec('COMMIT');
  return store;
}
function fixture(t: import('node:test').TestContext, rows = ROWS) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-yield-'));
  const store = seed(dir, rows);
  t.after(() => { store.close(); rmSync(dir, { recursive: true, force: true }); });
  return store;
}
function setting(t: import('node:test').TestContext, value: string) {
  const old = process.env.TABULARIUS_SCRIPT_MAX_RECORD_OPS;
  process.env.TABULARIUS_SCRIPT_MAX_RECORD_OPS = value;
  t.after(() => {
    if (old === undefined) delete process.env.TABULARIUS_SCRIPT_MAX_RECORD_OPS;
    else process.env.TABULARIUS_SCRIPT_MAX_RECORD_OPS = old;
  });
}
function unchanged(store: Store) {
  assert.equal((store.sql.prepare('SELECT count(*) AS n FROM Items WHERE Value <> 0').get() as { n: number }).n, 0);
  writer.run({ owner: 'another-session' }, () => store.update('Items', 1, { Value: 0 }));
}

test('a bulk step lets the event loop turn at least every 256 records, in every pass', async (t) => {
  const rows = 2_000;
  const store = fixture(t, rows);
  // Counted, not timed: the rule is a yield every 256 checkpoints, whatever the speed of the host. A loop turn is one
  // pass of the event loop, which is when a request, a health probe or another session's work can be served.
  let turns = 0, running = true;
  const tick = () => { turns++; if (running) setImmediate(tick); };
  setImmediate(tick);
  const seen: { operation: string; completed: number; turns: number }[] = [];
  try {
    const result = await runScript(store, 'Bulk', { layout: 'Items', timeoutMs: 60_000,
      onProgress: (p) => { seen.push({ operation: p.operation, completed: p.completed, turns }); } });
    assert.equal(result.halted, false);
    assert.equal(result.error, 0);
    assert.equal(result.recordOps, rows * 3);
  } finally { running = false; }
  let windows = 0;
  for (let i = 1; i < seen.length; i++) {
    // Progress is reported every 256 records, so two reports 256 records apart bound one window of work.
    if (seen[i].completed - seen[i - 1].completed !== 256) continue;
    windows++;
    assert.ok(seen[i].turns > seen[i - 1].turns, `no event-loop turn while ${seen[i].operation} went from ${seen[i - 1].completed} to ${seen[i].completed} records`);
  }
  assert.equal(windows, 7 * 3, 'every 256-record window of every pass was checked');
  assert.ok(turns >= (rows * 3) / 256, `event-loop turns: ${turns}`);
});

test('three replace passes keep health, admin and another session answering (loose wall-clock bound)', async (t) => {
  // Timing is only a sanity bound here, for a loaded host; the counted test above is the check of the yield rule. The
  // transaction ends in one SQLite COMMIT of every changed row, which cannot be split, so the longest stall grows with
  // the rows changed (about 0.3 s for 60,000 row updates on a slow, loaded host): this test changes few.
  const rows = 3_000;
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-yield-http-'));
  seed(dir, rows).close();
  const { server, host, url } = await serve({ dir, port: 0, hostname: '127.0.0.1', watch: false, log: () => {} });
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(dir, { recursive: true, force: true });
  });
  const store = host.get('Synthetic')!;
  store.setPassword('Admin', 'pw', '[Full Access]');
  const full = store.privilegeSets().find((p) => p.id === 1)!;
  store.savePrivilegeSet({ ...full, extendedPrivileges: [...new Set([...full.extendedPrivileges, 'fmrest'])] });
  const login = await fetch(`${url}/fmi/data/vLatest/databases/Synthetic/sessions`, {
    method: 'POST', headers: { authorization: 'Basic ' + btoa('Admin:pw'), 'content-type': 'application/json' }, body: '{}',
  });
  assert.equal(login.status, 200);
  const { response: { token } } = await login.json() as { response: { token: string } };
  const paths = ['/tabularius/health', '/tabularius/admin/v1/metrics', '/fmi/data/vLatest/databases/Synthetic/layouts'];
  let phase = 'start', slowest = '';
  let done = false, probes = 0, maxProbe = 0, maxGap = 0, last = performance.now();
  const timer = setInterval(() => { const now = performance.now(); if (now - last > maxGap) { maxGap = now - last; slowest = phase; } last = now; }, 10);
  const began = performance.now();
  const running = runScript(store, 'Bulk', { layout: 'Items', timeoutMs: 60_000, onProgress: (p) => { phase = `${p.operation}: ${p.completed}`; } }).finally(() => { done = true; });
  try {
    while (!done) {
      const start = performance.now();
      const responses = await Promise.all(paths.map(async (path) => {
        const r = await fetch(url + path, { headers: { authorization: `Bearer ${token}` } });
        await r.arrayBuffer();
        return r.status;
      }));
      assert.deepEqual(responses, [200, 200, 200]);
      maxProbe = Math.max(maxProbe, performance.now() - start);
      probes++;
    }
  } finally { await running; clearInterval(timer); }
  const result = await running;
  assert.equal(result.halted, false);
  assert.equal(result.error, 0);
  assert.equal(result.recordOps, rows * 3);
  assert.equal((store.sql.prepare('SELECT count(*) AS n FROM Items WHERE Value = 3').get() as { n: number }).n, rows);
  t.diagnostic(JSON.stringify({ records: rows, probes, maxProbe, maxGap, slowest, durationMs: performance.now() - began }));
  assert.ok(probes > 2, `probes: ${probes}`);
  assert.ok(maxProbe < 3000, `longest HTTP probe: ${maxProbe.toFixed(1)} ms`);
  assert.ok(maxGap < 3000, `longest event-loop gap: ${maxGap.toFixed(1)} ms`);
});

test('commit notifications are delivered in order and all at once, as on main, with no loop turn in between', async (t) => {
  const records = 400;
  const run = async (probe: boolean) => {
    const dir = mkdtempSync(join(tmpdir(), 'tabularius-yield-notify-'));
    const store = seed(dir, 1);
    store.applyDesign([{ op: 'createScript', name: 'Create', text:
      `Open Transaction\nSet Variable [ $i ; 0 ]\nLoop\nNew Record/Request\nSet Field [ Items::Value ; $i ]\nSet Variable [ $i ; $i + 1 ]\nExit Loop If [ $i >= ${records} ]\nEnd Loop\nCommit Transaction` }]);
    const seen: string[] = [];
    // A listener that takes about a millisecond, so that a drain of hundreds of notifications outlasts one time slice.
    store.listeners.add((c) => { seen.push(`${c.kind}:${c.recordId}`); for (const end = performance.now() + 1; performance.now() < end;); });
    const during: number[] = [];
    let running = true;
    // One probe per loop turn: delivery that yields in the middle is seen as a partial count.
    const tick = () => { if (probe) during.push(seen.length); if (running) setImmediate(tick); };
    setImmediate(tick);
    const result = await runScript(store, 'Create', { layout: 'Items', timeoutMs: 60_000 });
    running = false;
    assert.equal(result.error, 0);
    store.close();
    rmSync(dir, { recursive: true, force: true });
    return { seen, during };
  };
  const { seen: expected } = await run(false);
  assert.ok(expected.length >= records);
  const { seen, during } = await run(true);
  assert.deepEqual(seen, expected, 'the same notifications in the same order');
  const partial = during.filter((n) => n > 0 && n < expected.length);
  // Records are created inside the open transaction; its notifications come out as one synchronous drain after the commit.
  assert.equal(partial.length, 0, `loop turns saw ${partial.length} partial deliveries`);
});

test('an external stop during the first pass rolls back the transaction and releases the file lock', async (t) => {
  const store = fixture(t);
  const stop = new AbortController();
  let lockChecked = false;
  // The stop comes from the progress report of the 256th record, so it needs no clock: the transaction is certainly open.
  const result = await runScript(store, 'Bulk', { layout: 'Items', stop: stop.signal, onProgress: (p) => {
    if (lockChecked || p.completed < 256) return;
    assert.throws(() => writer.run({ owner: 'another-session', transaction: {} }, () => store.update('Items', 1, { Value: 9 })), /transaction is open/);
    lockChecked = true;
    stop.abort();
  } });
  assert.equal(result.halted, true);
  assert.equal(result.error, 1);
  assert.ok(lockChecked);
  // It stops at the next checkpoint, a record or so later, not at the end of the first pass.
  assert.ok((result.recordOps ?? 0) < 512, `record operations after the stop: ${result.recordOps}`);
  unchanged(store);
});

test('200 ms time limit halts the run and rolls back, naming where it was', async (t) => {
  const store = fixture(t);
  const result = await runScript(store, 'Bulk', { layout: 'Items', timeoutMs: 200 });
  assert.equal(result.halted, true);
  // On a slow host the 200 ms can pass before the first record (the window's found set is read first), and the limit is
  // then reported between steps; the record-budget tests below check the name of the heavy step without a clock.
  assert.match(JSON.stringify(result.actions), /time limit reached( in Replace Field Contents after \d+ records| \(on record 1 of )/);
  unchanged(store);
});

test('a time limit reached between steps ends like one reached inside a record loop: capacity error, edits discarded', async (t) => {
  const store = fixture(t, 4);
  store.applyDesign([{ op: 'createScript', name: 'Spin', text: 'Set Field [ Items::Value ; 7 ]\nSet Variable [ $i ; 0 ]\nLoop\nSet Variable [ $i ; $i + 1 ]\nEnd Loop' }]);
  const between = await runScript(store, 'Spin', { layout: 'Items', timeoutMs: 100 });
  assert.equal(between.halted, true);
  assert.match(JSON.stringify(between.actions), /time limit reached/);
  const inside = await runScript(store, 'Bulk', { layout: 'Items', timeoutMs: 1 });
  assert.equal(inside.halted, true);
  assert.equal(between.error, inside.error);
  assert.notEqual(between.error, 0);
  unchanged(store);
});

test('record budget spans passes and stops before the next record, with rollback and an error', async (t) => {
  const store = fixture(t, 600);
  setting(t, '700');
  const result = await runScript(store, 'Bulk', { layout: 'Items' });
  assert.equal(result.halted, true);
  assert.notEqual(result.error, 0);
  assert.match(JSON.stringify(result.actions), /record operation limit reached in Replace Field Contents after \d+ records.*700/);
  assert.equal(result.recordOps, 700);
  unchanged(store);
});

test('zero disables the record budget; malformed settings are rejected', async (t) => {
  const store = fixture(t, 8);
  setting(t, '0');
  assert.equal((await runScript(store, 'Bulk', { layout: 'Items' })).halted, false);
  for (const invalid of ['', '-1', '1e3', '0x10', '1.5']) {
    process.env.TABULARIUS_SCRIPT_MAX_RECORD_OPS = invalid;
    await assert.rejects(async () => runScript(store, 'Bulk', { layout: 'Items' }), /TABULARIUS_SCRIPT_MAX_RECORD_OPS/);
  }
});

test('a record cap cannot commit part of a bulk step outside an explicit transaction', async (t) => {
  const store = fixture(t, 600);
  store.applyDesign([{ op: 'createScript', name: 'One pass', text: replace }]);
  setting(t, '300');
  const result = await runScript(store, 'One pass', { layout: 'Items' });
  assert.equal(result.halted, true);
  assert.notEqual(result.error, 0);
  unchanged(store);
});

for (const [name, text] of [
  ['find with no matches', 'Enter Find Mode\nSet Field [ Items::Value ; "999" ]\nPerform Find'],
  ['show all', 'Show All Records'],
  ['sort', 'Sort Records [ Restore ; Items::Value ; ascending ; With dialog: Off ]'],
  ['delete all', 'Delete All Records [ With dialog: Off ]'],
  ['relookup', 'Relookup Field Contents [ With dialog: Off ; Items::Value ]'],
]) test(`the record budget covers ${name}`, async (t) => {
  const store = fixture(t, 600);
  store.applyDesign([{ op: 'createScript', name: 'Operation', text }]);
  setting(t, '300');
  const result = await runScript(store, 'Operation', { layout: 'Items' });
  assert.equal(result.halted, true);
  assert.match(JSON.stringify(result.actions), /record operation limit reached/);
  assert.equal(store.findIds('Items').length, 600);
  unchanged(store);
});

function restricted(store: Store) {
  store.savePrivilegeSet({ name: 'R', records: { view: true, edit: true, create: true, delete: true }, tables: { Items: { view: 'Value < 500', edit: true, create: true, delete: true } },
    layouts: 'viewOnly', valueLists: 'viewOnly', scripts: 'viewOnly', extendedPrivileges: [] } as never);
  store.setPassword('r', ['a', 'b'].join('-'), 'R');
  return { account: 'r', privileges: store.privileges('r') };
}

test('a find that runs whole is charged to the record budget like a batched one, for a record-rule account too', async (t) => {
  const store = fixture(t, 600);
  const who = restricted(store);
  store.applyDesign([
    { op: 'createScript', name: 'All', text: 'Show All Records' },
    { op: 'createScript', name: 'Dup', text: 'Enter Find Mode [ Pause: Off ]\nSet Field [ Items::Value ; "!" ]\nPerform Find []' },
  ]);
  const full = await runScript(store, 'All', { layout: 'Items' });
  assert.equal(full.recordOps, 600);
  for (const name of ['All', 'Dup']) {
    const result = await runScript(store, name, { layout: 'Items', ...who });
    assert.equal(result.recordOps, 600, `${name}: the whole table was scanned`);
  }
  setting(t, '100');
  for (const name of ['All', 'Dup']) {
    const result = await runScript(store, name, { layout: 'Items', ...who });
    assert.equal(result.halted, true, name);
    assert.match(JSON.stringify(result.actions), /record operation limit reached/, name);
  }
});

test('a record budget halt discards pending Set Field edits like external cancellation', async (t) => {
  const store = fixture(t, 4);
  setting(t, '1');
  store.applyDesign([{ op: 'createScript', name: 'Pending', text: 'Set Field [ Items::Value ; 1 ]\nSet Field [ Items::Value ; 2 ]' }]);
  const result = await runScript(store, 'Pending', { layout: 'Items' });
  assert.equal(result.halted, true);
  assert.equal(result.recordOps, 1);
  unchanged(store);
});

for (const transaction of [false, true]) test(`an import cap leaves no partial import (transaction=${transaction})`, async (t) => {
  const store = fixture(t, 4);
  const documents = dirname(store.path);
  writeFileSync(join(documents, 'generated.csv'), Array.from({ length: 600 }, () => '1').join('\n'));
  const source = 'Import Records [ With dialog: Off ; "generated.csv" ; Add ]';
  store.applyDesign([{ op: 'createScript', name: 'Import', text: transaction ? `Open Transaction\n${source}\nCommit Transaction` : source }]);
  setting(t, '300');
  const result = await runScript(store, 'Import', { layout: 'Items', documents });
  assert.equal(result.halted, true);
  assert.match(JSON.stringify(result.actions), /record operation limit reached/);
  assert.equal(store.findIds('Items').length, 4);
  unchanged(store);
});

test('a synchronous subscript shares its caller record budget', async (t) => {
  const store = fixture(t, 600);
  store.applyDesign([
    { op: 'createScript', name: 'Child', text: replace },
    { op: 'createScript', name: 'Parent', text: `Open Transaction\n${replace}\nPerform Script [ "Child" ]\nCommit Transaction` },
  ]);
  setting(t, '700');
  const result = await runScript(store, 'Parent', { layout: 'Items' });
  assert.equal(result.halted, true);
  assert.equal(result.recordOps, 700);
  unchanged(store);
});

test('restoring a sort after Find commits pending edits before reading sort keys', async (t) => {
  const store = fixture(t, 4);
  store.applyDesign([{ op: 'createScript', name: 'Sorted find', text:
    'Sort Records [ Restore ; Items::Value ; ascending ; With dialog: Off ]\nSet Field [ Items::Value ; 99 ]\nPerform Find []' }]);
  const script = structuredClone(store.schema.scripts.find((s) => s.name === 'Sorted find')!);
  script.steps[2].params = { restore: true, requests: [{ omit: false, criteria: [{ field: script.steps[1].params!.field!, criteria: '>=0' }] }] };
  const result = await runScript(store, script, { layout: 'Items' });
  assert.equal(result.error, 0);
  assert.deepEqual(result.foundSet, [2, 3, 4, 1]);
});
