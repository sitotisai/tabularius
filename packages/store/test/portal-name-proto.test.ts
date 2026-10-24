import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';

// A portal's name comes from the layout (an imported file's too), and names the keys of portalData and portalStyles on a
// record. A portal named __proto__ must stay a key of that record, not reach Object.prototype for the whole process.

test('a portal named __proto__ shows its rows and formatting without touching Object.prototype', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-portal-proto-'));
  const path = join(dir, 'Shop.openhbam.sqlite');
  createStore(path);
  const s = new Store(path, 'Shop');
  let tea = 0;
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
    tea = s.create('Orders', { CustomerId: 1, Item: 'Tea' }).recordId;
    s.update('Orders', tea, { Item: 'Tea' }, undefined, { styles: { Item: [{ start: 0, end: 3, style: 1 }] } });
    const rec = s.get('Customers', ada);
    assert.equal((({}) as Record<string, unknown>)[String(tea)], undefined);
    assert.equal(Object.hasOwn(rec.portalData!, '__proto__'), true);
    assert.equal(rec.portalData!['__proto__'].length, 1);
    assert.deepEqual(rec.portalStyles && Object.keys(rec.portalStyles), ['__proto__']);
  } finally {
    delete (Object.prototype as Record<string, unknown>)[String(tea)];
    s.close();
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  }
});
