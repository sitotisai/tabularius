import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';

test('number fields preserve non-decimal text and convert decimal notation', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-number-field-'));
  const path = join(dir, 'test.sqlite');
  createStore(path);
  const store = new Store(path, 'Test');
  try {
    store.applyDesign([{ op: 'createTable', name: 'T', fields: [{ name: 'Qty', type: 'number' }] }]);
    const stored = (text: string) => {
      const id = store.create('T', { Qty: text }).recordId;
      return store.query(`SELECT Qty AS v FROM T WHERE _fm_record_id = ${id}`)[0].v;
    };
    for (const text of ['0x10', '0X1F', '0b101', '0o17', '1_000', 'Infinity', '12abc']) {
      assert.equal(stored(text), text, text);
    }
    for (const [text, number] of [
      ['7', 7], [' 7 ', 7], ['+5', 5], ['-0.001', -0.001], ['.5', 0.5],
      ['1.', 1], ['1e3', 1000], ['1E-2', 0.01], ['1,234.5', 1234.5], ['1,5', 15],
    ] as const) {
      assert.equal(stored(text), number, text);
    }
    assert.equal(store.normalize('0x10', 'number'), '0x10');
    assert.equal(store.normalize('1,234', 'number'), 1234);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
