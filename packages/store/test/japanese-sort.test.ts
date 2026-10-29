import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';

test('a field indexed in Japanese sorts in Japanese order, others in English order', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-ja-'));
  try {
    const path = join(dir, 'Ja.sqlite');
    createStore(path);
    const store = new Store(path, 'Ja');
    store.applyDesign([
      { op: 'createTable', name: 'Items', fields: [{ name: 'Name', type: 'text', options: { indexLanguage: 'Japanese' } }, { name: 'Plain', type: 'text' }] },
    ]);
    for (const n of ['処方', 'カキ', '自費', 'あいう']) store.create('Items', { Name: n, Plain: n });
    const sorted = (fieldName: string) => store.find('Items', { sort: [{ fieldName }], limit: 10 }).records.map((r) => String(r.fieldData[fieldName]));
    assert.deepEqual(sorted('Name'), ['あいう', 'カキ', '自費', '処方']);
    assert.deepEqual(sorted('Plain'), ['あいう', 'カキ', '処方', '自費']);
    store.close();
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test('Japanese text finds match mixed width and voiced half-width kana across find operators', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-ja-width-'));
  try {
    const path = join(dir, 'Width.sqlite');
    createStore(path);
    const store = new Store(path, 'Width');
    try {
      store.applyDesign([{ op: 'createTable', name: 'Items', fields: [
        { name: 'Japanese', type: 'text', options: { indexLanguage: 'Japanese' } },
        { name: 'English', type: 'text' },
      ] }]);
      const mixed = store.create('Items', { Japanese: 'Ａ１ﾊﾟ', English: 'Ａ１ﾊﾟ' }).recordId;
      const full = store.create('Items', { Japanese: 'A1パ', English: 'A1パ' }).recordId;
      const ids = (field: string, value: string) => store.find('Items', { query: [{ [field]: value }] }).records.map((r) => r.recordId);
      for (const criterion of ['A1パ', '=A1パ', '==A1パ', 'A#パ', 'A1パ...A1パ']) {
        assert.deepEqual(ids('Japanese', criterion), [mixed, full], criterion);
      }
      assert.deepEqual(ids('Japanese', 'Ａ１ﾊﾟ...Ａ１ﾊﾟ'), [mixed, full]);
      assert.deepEqual(ids('English', 'A1パ...A1パ'), [full], 'other languages retain their range comparison');
      const digits = store.create('Items', { Japanese: '１２３', English: '１２３' }).recordId;
      const voiced = store.create('Items', { Japanese: 'ｶﾞ', English: 'ｶﾞ' }).recordId;
      assert.deepEqual(ids('Japanese', '123...123'), [digits]);
      assert.deepEqual(ids('Japanese', 'ガ...ガ'), [voiced]);
      assert.deepEqual(ids('Japanese', '==ガ'), [voiced]);
      assert.deepEqual(ids('English', 'ガ...ガ'), []);
      store.words.enabled = false;
      assert.deepEqual(ids('Japanese', 'A1パ'), [mixed, full], 'plain finds also work without the word index');
    } finally {
      store.close();
    }
  } finally {
    rmSync(dir, { recursive: true });
  }
});
