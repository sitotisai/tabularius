// A held file runs none of its own scripts, but an approved file's script may still read its data and layouts.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, parseScriptText, Store } from '../../store/src/index.ts';
import type { Script } from '../../fmp12/src/index.ts';
import { runScript, ScriptError } from '../src/index.ts';

let dir: string;
let ui: Store;
let data: Store;

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-held-reads-'));
  const open = (name: string) => {
    const path = join(dir, `${name}.sqlite`);
    createStore(path);
    return new Store(path, name);
  };
  ui = open('UI');
  data = open('Data');
  data.applyDesign([
    { op: 'createTable', name: 'Items', fields: [{ name: 'Name' }] },
    { op: 'createScript', name: 'Own', text: 'Exit Script [ Text Result: "ran" ]' },
  ]);
  data.create('Items', { Name: 'first' });
  ui.applyDesign([{ op: 'createDataSource', name: 'Data', paths: ['file:Data'] }]);
  ui.resolveFile = (name) => name === 'Data' ? data : undefined;
  ui.applyDesign([
    { op: 'createOccurrence', name: 'DataItems', file: 'Data', externalTable: data.schema.tables[0].id },
    { op: 'createLayout', name: 'ExternalItems', occurrence: 'DataItems' },
  ]);
  data.held = { reason: 'not seen before', since: new Date().toISOString() };
});
after(() => {
  ui?.close();
  data?.close();
  if (dir) rmSync(dir, { recursive: true, force: true });
});

const script = (text: string): Script => ({
  id: 9999, name: 'test',
  steps: parseScriptText(text, ui.schema).map((s) => ({ stepId: s.stepId!, name: s.name!, enabled: s.enabled !== false, params: s.params })),
} as Script);

test('a script of an approved file reads the held file\'s records through an external layout', async () => {
  const r = await runScript(ui, script('Go to Layout [ "ExternalItems" ]\nGo to Record/Request/Page [ First ]\nExit Script [ Text Result: DataItems::Name ]'), { layout: 'ExternalItems' });
  assert.equal(r.error, 0);
  assert.equal(r.result, 'first');
});

test('a script that lives in the held file does not run, whoever calls it', async () => {
  await assert.rejects(runScript(data, 'Own'), (e) => e instanceof ScriptError && e.code === 802 && /is held/.test(e.message));
  const caller: Script = { id: 9998, name: 'Caller', steps: [
    { stepId: 85, name: 'Set Error Capture', enabled: true, params: { on: true } },
    { stepId: 1, name: 'Perform Script', enabled: true, params: { scriptCalculation: '"Data::Own"' } },
    { stepId: 103, name: 'Exit Script', enabled: true, params: { calculation: 'Get ( LastError )' } },
  ] } as Script;
  const r = await runScript(ui, caller, { layout: 'ExternalItems' });
  assert.equal(r.result, '802');
  data.held = undefined;
  assert.equal((await runScript(data, 'Own')).result, 'ran');
  data.held = { reason: 'not seen before', since: new Date().toISOString() };
});

test('a held file\'s custom functions and triggers do not run when a script of an approved file has its window current', async () => {
  data.applyDesign([
    { op: 'createCustomFunction', name: 'Mine', parameters: [], formula: '"held code"' },
    { op: 'createScript', name: 'Startup', text: 'Set Variable [ $$opened ; Value: "yes" ]' },
    { op: 'setFileOptions', onFirstWindowOpen: 'Startup' },
  ]);
  const text = 'Open File [ “Data” ]\nSelect Window [ Name: "Data" ]\nSet Variable [ $x ; Value: Mine ]\nExit Script [ Text Result: $x & "|" & $$opened ]';
  const heldRun = await runScript(ui, script(text), { layout: 'ExternalItems' });
  assert.equal(heldRun.result, '?|', 'neither the function nor the file\'s OnFirstWindowOpen script ran');
  data.held = undefined;
  try {
    assert.equal((await runScript(ui, script(text), { layout: 'ExternalItems' })).result, 'held code|yes');
  } finally {
    data.held = { reason: 'not seen before', since: new Date().toISOString() };
  }
});
