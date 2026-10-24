import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import { serve } from '../src/index.ts';
import { STORE_EXT } from '../src/host.ts';
import { createStore, type DesignOp, type Store } from '../../store/src/index.ts';

// The admin console's field access edit, for a table or field a file may call __proto__: the edit is kept and enforced, not
// dropped (which would leave the set's wider default access in force).

let dir: string;
let server: Server;
let base: string;
let store: Store;

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-field-proto-'));
  createStore(join(dir, 'L' + STORE_EXT));
  const s = await serve({ dir, port: 0, watch: false, log: () => {} }); // loopback: console calls are open
  server = s.server;
  base = s.url;
  store = s.host.get('L')!;
  store.applyDesign([
    { op: 'createTable', name: '__proto__', fields: [{ name: 'Secret' }, { name: 'Name' }] },
    { op: 'createTable', name: 'Items', fields: [{ name: '__proto__' }, { name: 'Name' }] },
  ] as DesignOp[]);
  store.savePrivilegeSet({ name: 'Clerks', records: { view: true, edit: true, create: false, delete: false }, layouts: 'none', valueLists: 'none', scripts: 'none', extendedPrivileges: ['fmrest'] });
});
after(async () => {
  await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()));
  rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
});

const post = (body: unknown) => fetch(`${base}/tabularius/admin/v1/field-access`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-tabularius-admin': '1' }, body: JSON.stringify(body) }).then((r) => r.json());

test('hiding a field of a table called __proto__ is kept and enforced', async () => {
  const r = await post({ database: 'L', privilegeSet: 'Clerks', table: '__proto__', field: 'Secret', access: 'none' });
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(r.access, 'none');
  const pv = store.privilegesForSet('Clerks');
  assert.equal(pv.fieldAccess('__proto__', 'Secret'), 'none');
  assert.equal(pv.fieldAccess('__proto__', 'Name'), 'modifiable');
  // The set keeps it when read back, and other tables are untouched.
  assert.equal(store.privilegesForSet('Clerks').fieldAccess('Items', 'Name'), 'modifiable');
  assert.equal(Object.getOwnPropertyDescriptor(store.privilegeSet('Clerks')!.tables, '__proto__')?.value.fields.Secret, 'none');
});

test('hiding a field called __proto__ is kept and enforced', async () => {
  const r = await post({ database: 'L', privilegeSet: 'Clerks', table: 'Items', field: '__proto__', access: 'viewOnly' });
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(r.access, 'viewOnly');
  assert.equal(store.privilegesForSet('Clerks').fieldAccess('Items', '__proto__'), 'viewOnly');
  assert.equal(store.privilegesForSet('Clerks').fieldAccess('Items', 'Name'), 'modifiable');
  assert.equal((({}) as Record<string, unknown>).fields, undefined);
});
