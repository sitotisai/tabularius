import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../../store/src/index.ts';
import { applyImport, undoImport } from '../src/import-mapping.ts';

test('undo import leaves a later record after the imported highest id was deleted', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-import-id-'));
  const path = join(dir, 'Records.sqlite');
  createStore(path);
  const store = new Store(path);
  try {
    store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name' }] }]);
    const imported = applyImport(store, 'Items', [['Imported']], {
      headerRow: false, columns: [{ column: 0, field: 'Name' }],
    }, {});
    const first = imported.foundSet[0];
    store.delete('Items', first);
    const later = store.create('Items', { Name: 'Later person' }).recordId;
    const undone = undoImport(store, imported.id, {});
    assert.equal(undone.deleted, 0);
    assert.ok(later > first);
    assert.equal(store.get('Items', later).fieldData.Name, 'Later person');
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
