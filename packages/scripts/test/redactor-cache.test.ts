import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, emptySchema, Store, StoreError, writer } from '@tabularius/store';
import type { Schema, Script } from '@tabularius/fmp12';
import { CredentialRedactor, CredentialRedactorCache, REDACTED } from '../src/redaction.ts';
import { redactorCacheStats, runScript, ScriptSession } from '../src/engine.ts';
import { removeAtExit } from '../../../scripts/test-remove-at-exit.ts';

test('a redactor builds its name table once for distinct formulas and a fork reuses it', () => {
  let constructions = 0;
  const names = {
    fields: ['Password'],
    get occurrences(): [string, string[]][] {
      constructions++;
      return [['T', ['Password']]];
    },
  };
  const redactor = new CredentialRedactor(names);
  assert.equal(constructions, 1);
  const steps = Array.from({ length: 12 }, (_, i) => ({
    stepId: 141, name: 'Set Variable', enabled: true,
    params: { variable: `$value${i}`, value: `T::Password & "${i}"` },
  }));
  redactor.inspect([{ id: 1, name: 'Root', steps }]);
  assert.equal(constructions, 1, 'parsing each formula reuses the name table');
  redactor.fork().inspect([{ id: 2, name: 'More', steps: [{
    stepId: 141, name: 'Set Variable', enabled: true,
    params: { variable: '$another', value: 'T::Password & "more"' },
  }] }]);
  assert.equal(constructions, 1, 'forks reuse the same name table');
});

test('script diagnostics cache schema names, formula parses and the whole-list inspection across runs', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-redactor-cache-'));
  createStore(join(dir, 'Data.sqlite'));
  const store = new Store(join(dir, 'Data.sqlite'), 'Data');
  t.after(() => { store.close(); rmSync(dir, { recursive: true }); });
  const schema: Schema = emptySchema();
  schema.tables.push({ id: 1, name: 'T', fields: Array.from({ length: 3000 }, (_, i) => ({
    id: i + 1, name: `Field${i}`, kind: 'normal', type: 'text', hasCalculation: false,
  })) });
  schema.tableOccurrences.push(...Array.from({ length: 800 }, (_, i) => ({ id: i + 1, name: `Occurrence${i}`, baseTableId: 1 })));
  const step = (formula: string) => ({ stepId: 141, name: 'Set Variable', enabled: true, params: { variable: '$value', value: formula } });
  const root: Script = { id: 1, name: 'Root', steps: [step('"ready"')] };
  schema.scripts.push(root, ...Array.from({ length: 499 }, (_, i) => ({ id: i + 2, name: `Unused${i}`, steps: [step(`"unused-${i}"`)] })));
  Object.defineProperty(store, 'schema', { configurable: true, get: () => schema });
  await runScript(store, root);
  const first = redactorCacheStats(store);
  assert.equal(first?.nameTableBuilds, 1);
  assert.equal(first?.inspections, 1);
  assert.equal(first?.fieldSets, 1, 'all occurrences share one field-name set');
  assert.ok(first && first.formulaParses >= 500, 'every script of the file is analysed once, as at a run start');
  await runScript(store, root);
  assert.deepEqual(redactorCacheStats(store), first, 'the second run builds no name sets or formula parses');

  // A new schema object represents a design edit, including a script-only edit.
  const edited = { ...schema, scripts: [...schema.scripts] };
  Object.defineProperty(store, 'schema', { configurable: true, get: () => edited });
  await runScript(store, root);
  const rebuilt = redactorCacheStats(store);
  assert.equal(rebuilt?.nameTableBuilds, 2);
  assert.equal(rebuilt?.inspections, 1);
  assert.equal(rebuilt?.fieldSets, 1);
  assert.equal(rebuilt?.formulaParses, first!.formulaParses);
  await runScript(store, root);
  assert.deepEqual(redactorCacheStats(store), rebuilt, 'the edited schema rebuilds only once');
});

test('a cached redactor still hides credential values and field names in an error', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-redactor-error-'));
  createStore(join(dir, 'Data.sqlite'));
  const store = new Store(join(dir, 'Data.sqlite'), 'Data');
  t.after(() => { store.close(); rmSync(dir, { recursive: true }); });
  store.applyDesign([
    { op: 'createTable', name: 'T', fields: [{ name: 'Password' }] },
    { op: 'createScript', name: 'Edit', text: 'Set Error Capture [ On ]\nSet Field [ T::Password ; Get ( ScriptParameter ) ]' },
  ]);
  const { recordId } = store.create('T', { Password: '' });
  store.locks.acquire('T', recordId, 'other', 'Other');
  const credential = ['secret', 'Q7v9z2Lm'].join('-');
  for (let i = 0; i < 2; i++) {
    const lock = t.mock.method(store.locks, 'acquire', () => { throw new StoreError(301, `Password=${credential}; fields: Password`); });
    try {
      const result = await writer.run({ owner: 'editor' }, () => runScript(store, 'Edit', { layout: 'T', foundSet: [recordId], parameter: credential, trace: true }));
      assert.equal(result.error, 301);
      assert.ok(!JSON.stringify(result.trace).includes(credential));
      assert.ok(!JSON.stringify(result.trace).includes('fields: Password'));
      assert.match(JSON.stringify(result.trace), new RegExp(REDACTED));
    } finally { lock.mock.restore(); }
    assert.equal(redactorCacheStats(store)?.nameTableBuilds, i + 1);
    if (i === 0) {
      store.applyDesign([{ op: 'createScript', name: 'Later', text: 'Exit Script [ Result: 1 ]' }]);
      assert.equal(redactorCacheStats(store), undefined, 'a committed design edit invalidates the cache');
    }
  }
});

test('cached analysis does not retain a value learned during a previous run', () => {
  const script: Script = { id: 1, name: 'Quiet', steps: [] };
  const cache = new CredentialRedactorCache({ fields: [] });
  const first = cache.forRun(script, () => [script]);
  const credential = ['private', 'Q7v9z2Lm'].join('-');
  first.remember(credential);
  assert.equal(first.value(credential), REDACTED);
  const second = cache.forRun(script, () => { throw new Error('analysis should be cached'); });
  assert.equal(second.value(credential), credential);
  assert.equal(cache.inspections, 1);
});

test('a literal by-name subscript protects caller diagnostics before the call', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-redactor-by-name-'));
  createStore(join(dir, 'Data.sqlite'));
  const store = new Store(join(dir, 'Data.sqlite'), 'Data');
  t.after(() => { store.close(); rmSync(dir, { recursive: true }); });
  store.applyDesign([
    { op: 'createScript', name: 'Sub', text: 'Set Variable [ $url ; Value: "https://user:" & Get ( ScriptParameter ) & "@example.test/" ]' },
    { op: 'createScript', name: 'Main', text: 'Set Variable [ $alias ; Value: Get ( ScriptParameter ) ]\nPerform Script [ Specified: By name ; "Sub" ; Parameter: $alias ]' },
  ]);
  const credential = ['private', 'R4v6B9z2'].join('-');
  const snapshots: unknown[] = [];
  await runScript(store, 'Main', { parameter: credential,
    debug: async (point) => { if (point.script === 'Main') snapshots.push(point.variables()); },
  });
  assert.ok(snapshots.length > 0);
  assert.ok(!JSON.stringify(snapshots).includes(credential));
});

// A credential used anywhere in a file must hide every input before the first trace, snapshot or error,
// however the script that uses it is reached: the whole script list is inspected, not the listed calls.
function open(t: { after: (fn: () => void) => void }, name = 'Data'): Store {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-redactor-reach-'));
  createStore(join(dir, `${name}.sqlite`));
  const store = new Store(join(dir, `${name}.sqlite`), name);
  t.after(() => { store.close(); });
  removeAtExit(dir);
  return store;
}
const reachCredential = ['private', 'R4v6B9z2'].join('-');
const URL_FROM_PARAMETER = 'Set Variable [ $url ; Value: "https://user:" & Get ( ScriptParameter ) & "@example.test/" ]';

test('a computed by-name call still hides the caller parameter alias before the call', async (t) => {
  const store = open(t);
  store.applyDesign([
    { op: 'createScript', name: 'Sub', text: URL_FROM_PARAMETER },
    { op: 'createScript', name: 'Main', text: 'Set Variable [ $alias ; Value: Get ( ScriptParameter ) ]\nSet Variable [ $n ; Value: "Su" & "b" ]\nPerform Script [ Specified: By name ; $n ; Parameter: $alias ]' },
  ]);
  const snapshots: unknown[] = [];
  await runScript(store, 'Main', { parameter: reachCredential, debug: async (p) => { if (p.script === 'Main') snapshots.push(p.variables()); } });
  assert.ok(snapshots.length > 0);
  assert.ok(!JSON.stringify(snapshots).includes(reachCredential), JSON.stringify(snapshots));
});

test('a $$global tainted by an earlier run of the session stays hidden in a later run', async (t) => {
  const store = open(t);
  store.applyDesign([
    { op: 'createScript', name: 'Login', text: `Set Variable [ $$p ; Value: Get ( ScriptParameter ) ]\n${URL_FROM_PARAMETER.replace('Get ( ScriptParameter )', () => '$$p')}` },
    { op: 'createScript', name: 'Report', text: 'Set Variable [ $copy ; Value: $$p ]\nSet Error Capture [ On ]\nShow Custom Dialog [ "Hi" ; $copy ]' },
  ]);
  const session = new ScriptSession();
  await runScript(store, 'Login', { session, parameter: reachCredential });
  const snapshots: unknown[] = [];
  const result = await runScript(store, 'Report', { session, trace: true, debug: async (p) => { snapshots.push(p.variables()); } });
  assert.ok(snapshots.length > 0);
  assert.ok(!JSON.stringify(snapshots).includes(reachCredential), JSON.stringify(snapshots));
  assert.ok(!JSON.stringify(result.trace ?? []).includes(reachCredential));
});

test('a listed callee of a script reached by a computed name still hides its caller values', async (t) => {
  const store = open(t);
  store.applyDesign([
    { op: 'createScript', name: 'Sink', text: URL_FROM_PARAMETER },
    { op: 'createScript', name: 'Mid', text: 'Set Variable [ $mid ; Value: Get ( ScriptParameter ) ]\nPerform Script [ Specified: From list ; "Sink" ; Parameter: $mid ]' },
    { op: 'createScript', name: 'Main', text: 'Perform Script [ Specified: By name ; Lower ( "MID" ) ; Parameter: Get ( ScriptParameter ) ]' },
  ]);
  const snapshots: unknown[] = [];
  await runScript(store, 'Main', { parameter: reachCredential, debug: async (p) => { if (p.script === 'Mid') snapshots.push(p.variables()); } });
  assert.ok(snapshots.length > 0);
  assert.ok(!JSON.stringify(snapshots).includes(reachCredential), JSON.stringify(snapshots));
});

test('a call into another file hides the values its scripts pass along, before they run', async (t) => {
  const a = open(t, 'A');
  const b = open(t, 'B');
  b.applyDesign([
    { op: 'createScript', name: 'Deep', text: URL_FROM_PARAMETER },
    { op: 'createScript', name: 'Entry', text: 'Set Variable [ $mid ; Value: Get ( ScriptParameter ) ]\nPerform Script [ Specified: From list ; "Deep" ; Parameter: $mid ]' },
  ]);
  a.applyDesign([{ op: 'createDataSource', name: 'B', paths: ['file:B'] }]);
  a.resolveFile = (name) => name === 'B' ? b : undefined;
  a.applyDesign([{ op: 'createScript', name: 'Main', text: 'Perform Script [ Specified: By name ; "B::Entry" ; Parameter: Get ( ScriptParameter ) ]' }]);
  const snapshots: unknown[] = [];
  await runScript(a, 'Main', { parameter: reachCredential, debug: async (p) => { if (p.script === 'Entry') snapshots.push(p.variables()); } });
  assert.ok(snapshots.length > 0);
  assert.ok(!JSON.stringify(snapshots).includes(reachCredential), JSON.stringify(snapshots));
});

test('the shared formula cache is bounded by the characters it holds, not only by entries', () => {
  const cache = new CredentialRedactorCache({ fields: [] }, [], { expressions: 5000, characters: 20_000 });
  const step = (i: number, size: number) => ({
    stepId: 141, name: 'Set Variable', enabled: true, params: { variable: `$v${i}`, value: `"${String(i).padEnd(size, 'x')}"` },
  });
  const many: Script = { id: 1, name: 'Many', steps: Array.from({ length: 40 }, (_, i) => step(i, 1000)) };
  const huge: Script = { id: 2, name: 'Huge', steps: [step(1000, 6000)] };
  new CredentialRedactor(cache.names, cache).inspect([many, huge]);
  const held = [...cache.expressions.keys()];
  assert.ok(cache.expressionCharacters <= 20_000, `${cache.expressionCharacters} characters held`);
  assert.ok(held.length > 0 && held.length < 40, 'old entries are dropped to stay in budget');
  assert.ok(!held.some((formula) => formula.length > 5000), 'a formula over a quarter of the budget is never kept');
  assert.equal(cache.expressionCharacters, held.reduce((n, formula) => n + formula.length, 0));
});
