import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, explainField, Store } from '../src/index.ts';

test('explaining a calculation field reports the named recursion error', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-explain-recursion-'));
  const path = join(dir, 'Synthetic.sqlite');
  createStore(path);
  const store = new Store(path, 'Synthetic');
  try {
    store.applyDesign([
      { op: 'createTable', name: 'Items', fields: [{ name: 'N', type: 'number' }] },
      { op: 'createField', table: 'Items', name: 'Deep', kind: 'calculation', type: 'number', calculation: 'Sum1 ( N )', options: { unstored: true } },
    ]);
    store.schema.customFunctions.push({ id: 1, name: 'Sum1', parameters: ['n'], formula: 'If ( n <= 0 ; 0 ; n + Sum1 ( n - 1 ) )' });
    const id = store.create('Items', { N: '10100' }).recordId;
    const table = store.schema.tables.find((t) => t.name === 'Items')!;
    const field = table.fields.find((f) => f.name === 'Deep')!;
    const rec = { store, table, row: store.row(store.layout('Items'), id) };
    const explanation = explainField(store, table, field, rec);
    assert.equal(explanation.error?.code, 1200);
    assert.equal(explanation.error?.message, "Sum1 recursed too deeply: it passed Tabularius's limit of 10,000 nested calls. Rewrite Sum1 as a loop with While.");
  } finally {
    store.close();
    rmSync(dir, { recursive: true });
  }
});
