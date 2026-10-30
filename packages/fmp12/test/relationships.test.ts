import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readRelationships } from '../src/schema.ts';
import { Node } from '../src/tree.ts';

const def = (left: number, right: number, options = 0) =>
  Uint8Array.from([4, 1, left, 4, 1, right, ...new Array(15).fill(0), options]);
const predicate = (operator: number, left: number, right: number) =>
  Uint8Array.from([operator, 2, 1, left, 2, 1, right]);

function relationships(...entries: { id: number; def: Uint8Array; predicates: Uint8Array[] }[]): Node {
  const root = new Node();
  for (const entry of entries) {
    const node = new Node();
    node.kv.set(2, entry.def);
    const preds = new Node();
    entry.predicates.forEach((p, i) => preds.kv.set(i + 1, p));
    node.children.set(3, preds);
    root.children.set(entry.id, node);
  }
  return root;
}

const occurrences = [
  { id: 1, name: 'A', baseTableId: 129 },
  { id: 2, name: 'B', baseTableId: 130 },
];
const tables = [
  { id: 129, name: 'A', fields: [{ id: 5, name: 'Key' }] },
  { id: 130, name: 'B', fields: [{ id: 6, name: 'Fk' }] },
];

test('relationship predicates and options decode', () => {
  const root = relationships(
    { id: 10, def: def(1, 2, 0x31), predicates: [predicate(0, 5, 6), predicate(6, 5, 6)] },
    { id: 11, def: def(1, 2), predicates: Array.from({ length: 7 }, (_, i) => predicate(i, 5, 6)) },
  );
  const [first, allOperators] = readRelationships(root, occurrences as never, tables as never);
  assert.deepEqual(first.predicates.map((p) => [p.leftFieldId, p.operator, p.rightFieldId, p.leftField, p.rightField]), [
    [5, '=', 6, 'Key', 'Fk'],
    [5, '×', 6, 'Key', 'Fk'],
  ]);
  assert.deepEqual([first.leftCreate, first.rightCreate, first.leftDelete, first.rightDelete],
    [true, true, undefined, true]);
  assert.deepEqual(allOperators.predicates.map((p) => p.operator), ['=', '≠', '<', '≤', '>', '≥', '×']);
});

test('unreadable predicate leaves the whole relationship out', () => {
  const root = relationships(
    { id: 10, def: def(1, 2), predicates: [predicate(0, 5, 6), predicate(9, 5, 6)] },
    { id: 11, def: def(1, 2), predicates: [predicate(0, 5, 6), Uint8Array.from([0, 2, 1, 5])] },
    { id: 12, def: def(1, 2), predicates: [predicate(0, 5, 6)] },
  );
  const unread: { id: number; reason: string }[] = [];
  const result = readRelationships(root, occurrences as never, tables as never, unread);
  assert.deepEqual(result.map((r) => r.id), [12]);
  assert.deepEqual(unread, [
    { id: 10, reason: 'predicate 2 has operator byte 0x09' },
    { id: 11, reason: 'predicate 2 names a field in a form no sample shows' },
  ]);
});
