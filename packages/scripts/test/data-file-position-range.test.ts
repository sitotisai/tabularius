import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, parseScriptText, Store } from '@tabularius/store';
import { runScript } from '../src/index.ts';

test('Set Data File Position rejects unsafe and overflowing offsets without changing the file', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-position-'));
  createStore(join(dir, 'Data.sqlite'));
  const store = new Store(join(dir, 'Data.sqlite'), 'Data');
  try {
    store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name' }] }]);
    writeFileSync(join(dir, 'data.bin'), 'original');
    for (const position of ['9007199254740992', '1e300']) {
      const steps = parseScriptText(`Set Error Capture [ On ]\nOpen Data File [ "data.bin" ; Target: $id ]\nSet Data File Position [ File ID: $id ; New position: ${position} ]\nSet Variable [ $error ; Value: Get ( LastError ) ]\nExit Script [ Text Result: $error ]`, store.schema).map((s) => ({ stepId: s.stepId!, name: s.name!, enabled: s.enabled !== false, params: s.params }));
      const result = await runScript(store, { id: 9999, name: 'Position', steps }, { layout: 'Items', documents: dir });
      assert.equal(result.result, '800');
      assert.equal(readFileSync(join(dir, 'data.bin'), 'utf8'), 'original');
    }
    const crossing = parseScriptText('Set Error Capture [ On ]\nOpen Data File [ "data.bin" ; Target: $id ]\nSet Data File Position [ File ID: $id ; New position: 1073741824 ]\nSet Variable [ $data ; Value: "X" ]\nWrite to Data File [ File ID: $id ; Data source: $data ; Write as: UTF-8 ]\nExit Script [ Text Result: Get ( LastError ) ]', store.schema)
      .map((s) => ({ stepId: s.stepId!, name: s.name!, enabled: s.enabled !== false, params: s.params }));
    assert.equal((await runScript(store, { id: 9998, name: 'Crossing', steps: crossing }, { layout: 'Items', documents: dir })).result, '800');
    assert.equal(readFileSync(join(dir, 'data.bin'), 'utf8'), 'original');
  } finally { store.close(); rmSync(dir, { recursive: true }); }
});
