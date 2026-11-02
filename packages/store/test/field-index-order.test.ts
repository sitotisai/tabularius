import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, type TestContext } from 'node:test';
import { createStore, Store } from '../src/index.ts';

function setup(t: TestContext): Store {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-field-index-order-'));
  const path = join(dir, 'Generated.openhbam.sqlite');
  createStore(path);
  const store = new Store(path, 'T');
  t.after(() => { store.close(); rmSync(dir, { recursive: true, force: true }); });
  store.applyDesign(['W', 'W2'].map((name) => ({
    op: 'createTable' as const, name, fields: [
      { name: 'En', type: 'text' as const },
      { name: 'Sv', type: 'text' as const, options: { indexLanguage: 'Swedish' } },
      { name: 'D', type: 'date' as const },
      { name: 'N', type: 'number' as const },
    ],
  })));
  return store;
}

test('a text index lists accent variants in code point order, whatever order the records came in', (t) => {
  const store = setup(t);
  const values = ['z', 'ä', 'a', 'é', 'B', 'e', 'café', 'cafe'];
  for (const En of values) store.create('W', { En });
  for (const En of [...values].reverse()) store.create('W2', { En });
  const expected = ['a', 'ä', 'B', 'cafe', 'café', 'e', 'é', 'z'];
  assert.deepEqual(store.fieldIndex('W', 'En'), expected);
  assert.deepEqual(store.fieldIndex('W2', 'En'), expected);
});

test('a Swedish field lists å, ä and ö after z', (t) => {
  const store = setup(t);
  for (const Sv of ['z', 'ä', 'a', 'ö', 'å']) store.create('W', { Sv });
  assert.deepEqual(store.fieldIndex('W', 'Sv'), ['a', 'z', 'å', 'ä', 'ö']);
  for (const En of ['z', 'ä', 'a', 'ö', 'å']) store.create('W', { En });
  assert.deepEqual(store.fieldIndex('W', 'En').filter((v) => ['a', 'ä', 'å', 'ö', 'z'].includes(v)),
    ['a', 'ä', 'å', 'ö', 'z']);
});

test('case-only variants are one entry, prefix and limit apply to the sorted list', (t) => {
  const store = setup(t);
  for (const Sv of ['Apple', 'apple', 'pear', 'fig', 'date', 'cherry']) store.create('W2', { Sv });
  assert.deepEqual(store.fieldIndex('W2', 'Sv'), ['Apple', 'cherry', 'date', 'fig', 'pear']);
  assert.deepEqual(store.fieldIndex('W2', 'Sv', { prefix: 'ap' }), ['Apple']);
  assert.deepEqual(store.fieldIndex('W2', 'Sv', { limit: 2 }), ['Apple', 'cherry']);
});

test('date and number indexes are unchanged', (t) => {
  const store = setup(t);
  for (const D of ['3/1/2024', '12/31/2023', '1/5/2024']) store.create('W', { D }, { dateOrder: 'MDY' });
  for (const N of ['10', '9', '2.5']) store.create('W', { N });
  assert.deepEqual(store.fieldIndex('W', 'D'), ['12/31/2023', '01/05/2024', '03/01/2024']);
  assert.deepEqual(store.fieldIndex('W', 'N'), ['2.5', '9', '10']);
});
