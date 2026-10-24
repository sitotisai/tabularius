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
  // A layout whose portal is on its own table: it shows the found set, and Refresh Portal answers with the rows of it.
  s.applyDesign([{ op: 'createLayout', name: 'Self', occurrence: 'Customers' }] as never);
  const self = s.design('Self')!;
  const toCustomers = s.schema.tableOccurrences.find((t) => t.name === 'Customers')!;
  const name = s.schema.tables.find((x) => x.name === 'Customers')!.fields.find((f) => f.name === 'Name')!;
  const nameCell = { ...cell, id: 911, hide: undefined, field: { tableOccurrenceId: toCustomers.id, fieldId: name.id, tableOccurrence: 'Customers', field: 'Name', display: 'edit', repetitions: 1 } };
  const found = { ...portal, id: 910, portal: { tableOccurrenceId: toCustomers.id, tableOccurrence: 'Customers', rows: 4, initialRow: 1 }, children: [nameCell] };
  s.applyDesign([{ op: 'updateLayout', layout: 'Self', design: { objects: [...self.objects, found] } }] as never);
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

test('the Data API shows the portal named __proto__ in the layout metadata and its count in portalDataInfo', async () => {
  const r = await fetch(`${base}/fmi/data/vLatest/databases/Shop/sessions`, { method: 'POST', headers: { authorization: 'Basic ' + btoa('Admin:pw') } });
  const headers = { authorization: `Bearer ${(await r.json()).response.token}` };
  const meta = (await (await fetch(`${base}/fmi/data/vLatest/databases/Shop/layouts/Customers`, { headers })).json()).response;
  assert.deepEqual(Object.keys(meta.portalMetaData), ['__proto__']);
  const rec = (await (await fetch(`${base}/fmi/data/vLatest/databases/Shop/layouts/Customers/records/1`, { headers })).json()).response.data[0];
  assert.equal(rec.portalDataInfo[0].portalObjectName, '__proto__');
  assert.equal(rec.portalDataInfo[0].foundCount, 1);
  assert.equal(rec.portalData['__proto__'].length, 1);
});

test('Refresh Portal answers with the rows of a found-set portal named __proto__', async () => {
  const r = await fetch(`${base}/fmi/data/vLatest/databases/Shop/sessions`, { method: 'POST', headers: { authorization: 'Basic ' + btoa('Admin:pw') } });
  const token = (await r.json()).response.token;
  const res = await fetch(`${base}/tabularius/app/v1/databases/Shop/layouts/Self/refresh`, {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ step: 'Refresh Portal', objectId: 910, ids: [1], recordId: 1 }),
  });
  assert.equal(res.status, 200, await res.clone().text());
  const body = await res.json();
  assert.deepEqual(Object.keys(body.foundRows), ['__proto__']);
  assert.equal(body.foundRows['__proto__'].rows.length, 1);
});
