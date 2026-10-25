import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, emptySchema, Store, StoreError, writer } from '@tabularius/store';
import type { Schema, Script } from '@tabularius/fmp12';
import { CredentialRedactor, CredentialRedactorCache, REDACTED } from '../src/redaction.ts';
import { redactorCacheStats, runScript } from '../src/engine.ts';

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

test('script diagnostics cache schema names and formula parses and inspect reached scripts only', async (t) => {
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
  assert.ok(first && first.formulaParses > 0 && first.formulaParses < 20, 'unreached scripts are not parsed');
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
  const first = cache.forRun(script, () => [script], true);
  const credential = ['private', 'Q7v9z2Lm'].join('-');
  first.remember(credential);
  assert.equal(first.value(credential), REDACTED);
  const second = cache.forRun(script, () => { throw new Error('analysis should be cached'); }, true);
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
