// A file put in a container field runs the modification auto-enters like any other write, unless the script skipped
// auto-enter: Open Transaction [ Skip auto-enter options ], or Import Records with Perform auto-enter options off.
import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type Script } from '@tabularius/fmp12';
import { createStore, parseScriptText, Store } from '@tabularius/store';
import { runScript } from '../src/index.ts';

function setup(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-container-auto-enter-'));
  createStore(join(dir, 'T.sqlite'));
  const store = new Store(join(dir, 'T.sqlite'), 'T');
  t.after(() => { store.close(); rmSync(dir, { recursive: true, force: true }); });
  store.applyDesign([{ op: 'createTable', name: 'Docs', fields: [
    { name: 'Name', type: 'text' },
    { name: 'File', type: 'container' },
    { name: 'ModifiedBy', type: 'text', options: { autoEnter: { value: 'modificationAccountName' } } },
  ] }] as never);
  const run = async (text: string, account: string, foundSet?: number[]) => {
    const steps = parseScriptText(text, store.schema).map((s) => ({ stepId: s.stepId!, name: s.name!, enabled: true, params: s.params }));
    return runScript(store, { id: 1, name: 'S', steps } as Script, { layout: 'Docs', account, documents: dir, ...(foundSet ? { foundSet } : {}) });
  };
  return { dir, store, run };
}

const SET = 'Set Field [ Docs::File ; Base64Decode ( "aGVsbG8=" ; "h.txt" ) ]';

test('Set Field on a container inside Open Transaction [ Skip auto-enter options ] leaves the modification account alone', async (t) => {
  const s = setup(t);
  const id = s.store.create('Docs', { Name: 'a' }, { account: 'alice' }).recordId;
  assert.equal(s.store.get('Docs', id).fieldData.ModifiedBy, 'alice');
  const skipped = await s.run(['Open Transaction [ Skip auto-enter options ]', SET, 'Commit Transaction'].join('\n'), 'Bob', [id]);
  assert.equal(skipped.error, 0);
  assert.ok(s.store.containerId('Docs', id, 'File', 1), 'the file went in');
  assert.equal(s.store.get('Docs', id).fieldData.ModifiedBy, 'alice');

  const plain = await s.run(['Open Transaction', SET, 'Commit Transaction'].join('\n'), 'Bob', [id]);
  assert.equal(plain.error, 0);
  assert.equal(s.store.get('Docs', id).fieldData.ModifiedBy, 'Bob', 'without the option the account is stamped');
});

test('Import Records from a folder with Perform auto-enter options off does not stamp the records it adds a file to', async (t) => {
  const s = setup(t);
  mkdirSync(join(s.dir, 'pics'));
  writeFileSync(join(s.dir, 'pics/one.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const step = (on: boolean) => `Import Records [ With dialog: Off ; Table: Docs ; Folder: “pics” ; File type: Picture and movie files ; Include enclosed folders: Off ; Add ; Fields: Docs::File, Docs::Name ; Perform auto-enter options: ${on ? 'On' : 'Off'} ]`;
  const off = await s.run(step(false), 'Importer');
  assert.equal(off.error, 0);
  const [first] = off.foundSet!;
  assert.ok(s.store.containerId('Docs', first, 'File', 1), 'the file went in');
  assert.equal(s.store.get('Docs', first).fieldData.ModifiedBy, '', 'auto-enter options were off for the whole import');

  const on = await s.run(step(true), 'Importer');
  assert.equal(on.error, 0);
  assert.equal(s.store.get('Docs', on.foundSet![0]).fieldData.ModifiedBy, 'Importer');
});
