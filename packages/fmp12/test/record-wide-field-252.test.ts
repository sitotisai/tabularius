import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Chunk } from '../src/chunks.ts';
import { encodePathInt, type FmpFile } from '../src/file.ts';
import { readRecords } from '../src/records.ts';

// Key 252 stored as one byte is record bookkeeping. The same number stored as a two-byte (wide) key is a field id, and a
// table that has had 252 fields created has a field with that id: its short values must not vanish with the bookkeeping.

const TABLE = 129;
// Stored text is XOR-masked with 0x5a.
const bytes = (text: string) => new TextEncoder().encode(text).map((b) => b ^ 0x5a);

function reader(chunks: Chunk[]): FmpFile {
  const path = [encodePathInt(TABLE), encodePathInt(5), encodePathInt(1)];
  return { chunks: function* () { for (const chunk of chunks) yield { path, chunk }; } } as unknown as FmpFile;
}

test('a wide key 252 is the value of field 252, the one-byte key 252 is still bookkeeping', () => {
  const [record] = [...readRecords(reader([
    { type: 'kv', key: 1, wide: false, data: bytes('first') },
    { type: 'kv', key: 252, wide: false, data: bytes('counter') },
    { type: 'kv', key: 252, wide: true, data: bytes('wide field') },
  ]), TABLE, new Set([1, 252]))];
  assert.deepEqual([...record.values], [[1, ['first']], [252, ['wide field']]]);
});

test('a one-byte key 252 is bookkeeping even when 252 is a field id', () => {
  const [record] = [...readRecords(reader([
    { type: 'kv', key: 252, wide: false, data: bytes('counter') },
    { type: 'kv', key: 1, wide: false, data: bytes('kept') },
  ]), TABLE, new Set([1, 252]))];
  assert.deepEqual([...record.values], [[1, ['kept']]]);
});

test('a wide key 252 in a table without a field 252 adds nothing', () => {
  const [record] = [...readRecords(reader([
    { type: 'kv', key: 252, wide: true, data: bytes('no such field') },
    { type: 'kv', key: 1, wide: false, data: bytes('kept') },
  ]), TABLE, new Set([1]))];
  assert.deepEqual([...record.values], [[1, ['kept']]]);
});
