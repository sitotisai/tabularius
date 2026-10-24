import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Schema } from '../../fmp12/src/index.ts';
import { createStore, customAccess, Store } from '../src/index.ts';

// Names from a file or a design (a table, field or portal called __proto__, constructor or toString are legal ones) are keys of
// the maps the store builds. Each must come out as an entry, not vanish into the prototype or be taken for one already there.

const tmp = (): { dir: string; path: string } => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-proto-names-'));
  return { dir, path: join(dir, 'Shop.openhbam.sqlite') };
};

test('a field named __proto__ is in the record\'s fieldData', () => {
  const { dir, path } = tmp();
  createStore(path);
  const s = new Store(path, 'Shop');
  try {
    s.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: '__proto__' }, { name: 'Name' }] }] as never);
    const id = s.create('Items', { ['__proto__']: 'secret', Name: 'a' }).recordId;
    const data = s.get('Items', id).fieldData;
    assert.equal(Object.hasOwn(data, '__proto__'), true);
    assert.equal(Object.getOwnPropertyDescriptor(data, '__proto__')?.value, 'secret');
    assert.equal(data.Name, 'a');
  } finally {
    s.close();
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  }
});

test('a portal named __proto__ has its count, on a fresh read and when a read\'s counts are reused', () => {
  const { dir, path } = tmp();
  createStore(path);
  const s = new Store(path, 'Shop');
  try {
    s.applyDesign([
      { op: 'createTable', name: 'Customers', fields: [{ name: 'Id', type: 'number' }, { name: 'Name' }] },
      { op: 'createTable', name: 'Orders', fields: [{ name: 'CustomerId', type: 'number' }, { name: 'Item' }] },
      { op: 'createRelationship', left: 'Customers', right: 'Orders', predicates: [{ left: 'Id', right: 'CustomerId' }] },
    ] as never);
    const design = s.design('Customers')!;
    const to = s.schema.tableOccurrences.find((t) => t.name === 'Orders')!;
    const item = s.schema.tables.find((x) => x.name === 'Orders')!.fields.find((f) => f.name === 'Item')!;
    const anchors = { left: true, top: true, right: false, bottom: false };
    const cell = { id: 901, kind: 'field', type: 1, anchors, style: {}, bounds: { top: 182, left: 22, bottom: 204, right: 122 },
      field: { tableOccurrenceId: to.id, fieldId: item.id, tableOccurrence: 'Orders', field: 'Item', display: 'edit', repetitions: 1 } };
    const portal = { id: 900, kind: 'portal', type: 9, name: '__proto__', anchors, style: {}, bounds: { top: 180, left: 20, bottom: 284, right: 400 },
      portal: { tableOccurrenceId: to.id, tableOccurrence: 'Orders', rows: 4, initialRow: 1 }, children: [cell] };
    s.applyDesign([{ op: 'updateLayout', layout: 'Customers', design: { objects: [...design.objects, portal] } }] as never);
    const ada = s.create('Customers', { Id: 1, Name: 'Ada' }).recordId;
    s.create('Orders', { CustomerId: 1, Item: 'Tea' });
    s.create('Orders', { CustomerId: 1, Item: 'Jam' });
    const counted = (counts: Record<string, number>) => Object.entries(counts);
    assert.deepEqual(counted(s.portalCounts('Customers', ada)), [['__proto__', 2]]);
    const read = s.get('Customers', ada);
    assert.deepEqual(counted(s.portalCounts('Customers', ada, undefined, read)), [['__proto__', 2]], 'the counts of the read, reused');
  } finally {
    s.close();
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  }
});

// A custom-record-access set from a file lists tables by id; tables called constructor, toString or __proto__ get what the file gave.
const grant = { view: true, edit: true, create: true, delete: true };
const fileSet = (ids: number[]) => ({
  id: 4, name: 'Staff', customRecordAccess: true, records: { view: false, edit: false, create: false, delete: false }, layouts: 'none', valueLists: 'none', scripts: 'none', extendedPrivileges: [],
  tableRecords: ids.map((tableId) => ({ tableId, records: grant, fields: [{ fieldId: 1, access: 0x03 }] })),
});
const schema = { tables: ['constructor', 'toString', '__proto__', 'Plain'].map((name, i) => ({ id: i + 1, name, fields: [{ id: 1, name: 'F' }, { id: 2, name: '__proto__' }] })) } as unknown as Schema;

test('tables called constructor, toString and __proto__ keep the access the file lists for them', () => {
  const m = customAccess(fileSet([1, 2, 3, 4]) as never, schema);
  for (const name of ['constructor', 'toString', '__proto__', 'Plain']) {
    assert.equal(Object.hasOwn(m.tables, name), true, `${name} has an entry`);
    assert.equal(m.tables[name].view, true, `${name} is viewable`);
    assert.equal(m.tables[name].fields?.F, 'modifiable', `${name}::F`);
    assert.equal(Object.hasOwn(m.hiddenFields, name), true, `${name} lists its hidden field`);
    assert.deepEqual(m.hiddenFields[name], ['__proto__']);
  }
  assert.equal(Object.getOwnPropertyDescriptor(m.tables.Plain.fields!, '__proto__')?.value, 'none', 'a field called __proto__ is hidden, by name');
});

test('a table listed twice still gets no access, even when it is called __proto__', () => {
  const m = customAccess(fileSet([3, 3]) as never, schema);
  assert.equal(Object.getOwnPropertyDescriptor(m.tables, '__proto__')?.value.view, false);
});
