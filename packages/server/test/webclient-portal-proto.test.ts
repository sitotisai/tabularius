import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import { serve } from '../src/index.ts';
import { createStore, Store } from '../../store/src/index.ts';

// The web client's per-row layout state (hide conditions of objects in a portal) is keyed by portal name, and a layout, an
// imported file's too, may name a portal __proto__: that must stay a key of the answer, not reach Object.prototype.

let dir = '';
let server: Server | undefined;
let base = '';
let orderId = 0;

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-web-proto-'));
  const path = join(dir, 'Shop.openhbam.sqlite');
  createStore(path);
  const s = new Store(path, 'Shop');
  s.applyDesign([
    { op: 'createTable', name: 'Customers', fields: [{ name: 'Id', type: 'number' }, { name: 'Name' }] },
    { op: 'createTable', name: 'Orders', fields: [{ name: 'CustomerId', type: 'number' }, { name: 'Item' }] },
    { op: 'createRelationship', left: 'Customers', right: 'Orders', predicates: [{ left: 'Id', right: 'CustomerId' }] },
  ] as never);
  const design = s.design('Customers')!;
  const to = s.schema.tableOccurrences.find((t) => t.name === 'Orders')!;
  const item = s.schema.tables.find((x) => x.name === 'Orders')!.fields.find((f) => f.name === 'Item')!;
  const anchors = { left: true, top: true, right: false, bottom: false };
  const cell = { id: 901, kind: 'field', type: 1, anchors, style: {}, bounds: { top: 182, left: 22, bottom: 204, right: 122 }, hide: { formula: '1' },
    field: { tableOccurrenceId: to.id, fieldId: item.id, tableOccurrence: 'Orders', field: 'Item', display: 'edit', repetitions: 1 } };
  const portal = { id: 900, kind: 'portal', type: 9, name: '__proto__', anchors, style: {}, bounds: { top: 180, left: 20, bottom: 284, right: 400 },
    portal: { tableOccurrenceId: to.id, tableOccurrence: 'Orders', rows: 4, initialRow: 1 }, children: [cell] };
  s.applyDesign([{ op: 'updateLayout', layout: 'Customers', design: { objects: [...design.objects, portal] } }] as never);
  s.create('Customers', { Id: 1, Name: 'Ada' });
  orderId = s.create('Orders', { CustomerId: 1, Item: 'Tea' }).recordId;
  s.setPassword('Admin', 'pw', '[Full Access]');
  const full = s.privilegeSets().find((p) => p.id === 1)!;
  s.savePrivilegeSet({ ...full, extendedPrivileges: [...full.extendedPrivileges, 'fmrest'] });
  s.close();
  const started = await serve({ dir, port: 0, log: () => {} });
  server = started.server;
  base = started.url;
});
after(async () => {
  delete (Object.prototype as Record<string, unknown>)[String(orderId)];
  await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()));
  if (dir) rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
});

test('a portal named __proto__ has its row state in the answer, not on Object.prototype', async () => {
  const r = await fetch(`${base}/fmi/data/vLatest/databases/Shop/sessions`, { method: 'POST', headers: { authorization: 'Basic ' + btoa('Admin:pw') } });
  const token = (await r.json()).response.token;
  const res = await fetch(`${base}/tabularius/app/v1/databases/Shop/layouts/Customers/view`, {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ records: [{ id: 1, number: 1 }] }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal((({}) as Record<string, unknown>)[String(orderId)], undefined);
  assert.deepEqual(body.records['1'].rows && Object.keys(body.records['1'].rows), ['__proto__']);
});
