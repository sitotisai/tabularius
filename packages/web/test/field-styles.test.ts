import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fieldStyles } from '../src/field-styles.ts';
import type { DataRecord } from '../src/types.ts';

const bold = [{ start: 0, end: 3, style: 256 }];
const italic = [{ start: 0, end: 4, style: 512 }];
const record: DataRecord = {
  recordId: '1', modId: '1', fieldData: {}, portalData: {},
  styles: { Tags: bold, 'Tags(2)': italic, 'Related::Tags': bold, 'Related::Tags(2)': italic, Stored: bold, 'Stored(2)': italic },
  portalStyles: { Rows: { '2': { 'Related::Tags': italic, 'Related::Tags(2)': bold }, '3': { 'Related::Tags(2)': italic } } },
};

test('local, related and stored calculation repetitions select their exact style key', () => {
  for (const base of ['Tags', 'Related::Tags', 'Stored']) {
    assert.deepEqual(fieldStyles(record, base, 'browse'), bold);
    assert.deepEqual(fieldStyles(record, `${base}(2)`, 'browse'), italic);
    assert.equal(fieldStyles(record, `${base}(3)`, 'browse'), undefined);
  }
});

test('portal styles stay within the selected portal, row and repetition', () => {
  assert.deepEqual(fieldStyles(record, 'Related::Tags', 'browse', { portal: 'Rows', recordId: '2' }), italic);
  assert.deepEqual(fieldStyles(record, 'Related::Tags(2)', 'browse', { portal: 'Rows', recordId: '2' }), bold);
  assert.deepEqual(fieldStyles(record, 'Related::Tags(2)', 'browse', { portal: 'Rows', recordId: '3' }), italic);
  for (const row of [{ portal: 'Rows' }, { portal: 'Rows', recordId: '4' }, { portal: 'Other', recordId: '2' }]) {
    assert.equal(fieldStyles(record, 'Related::Tags(2)', 'browse', row), undefined);
  }
});

test('find mode, missing records and inherited keys supply no formatting', () => {
  assert.equal(fieldStyles(record, 'Tags', 'find'), undefined);
  assert.equal(fieldStyles(undefined, 'Tags', 'browse'), undefined);
  assert.equal(fieldStyles(record, 'toString', 'browse'), undefined);
  assert.equal(fieldStyles(record, 'Related::Tags', 'browse', { portal: 'toString', recordId: '2' }), undefined);
});
