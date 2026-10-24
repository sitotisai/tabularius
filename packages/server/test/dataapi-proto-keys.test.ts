import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import { serve } from '../src/index.ts';
import { STORE_EXT } from '../src/host.ts';
import { createStore, type DesignOp } from '../../store/src/index.ts';

// Names in a request (a portal in `_limit.{portal}`, a portal in portalData and portalStyles) are plain object keys on the
// server. `__proto__` among them must not reach Object.prototype, which every later request in the process would see.

let dir: string;
let server: Server;
let base: string;
let bearer: string;

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-proto-keys-'));
  createStore(join(dir, 'L' + STORE_EXT));
  const s = await serve({ dir, port: 0, watch: false, log: () => {} });
  server = s.server;
  base = s.url;
  const store = s.host.get('L')!;
  store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name' }] }] as DesignOp[]);
  for (const n of ['a', 'b', 'c']) store.create('Items', { Name: n });
  store.setPassword('Admin', 'pw', '[Full Access]');
  bearer = 'Bearer ' + (await call('/databases/L/sessions', 'Basic ' + btoa('Admin:pw'), 'POST', {})).body.response.token;
});

after(async () => {
  for (const k of ['limit', 'offset', '1']) delete (Object.prototype as Record<string, unknown>)[k];
  await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()));
  rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
});

async function call(path: string, auth: string, method = 'GET', body?: string | unknown): Promise<{ status: number; body: any }> {
  const r = await fetch(`${base}/fmi/data/vLatest${path}`, {
    method, headers: { authorization: auth, 'content-type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  return { status: r.status, body: await r.json() };
}

const L = '/databases/L/layouts/Items';
// The keys a request could have set on Object.prototype; found ones are removed so one failure does not spill into the next test.
const polluted = () => {
  const found = ['limit', 'offset', '1'].filter((k) => (({}) as Record<string, unknown>)[k] !== undefined);
  for (const k of found) delete (Object.prototype as Record<string, unknown>)[k];
  return found;
};

test('a portal paging key naming __proto__ does not set limit or offset on every object', async () => {
  const range = await call(`${L}/records?_limit.__proto__=0&_offset.__proto__=5`, bearer);
  assert.equal(range.status, 200);
  assert.deepEqual(polluted(), []);
  const find = await call(`${L}/_find`, bearer, 'POST', '{"query":[{"Name":"*"}],"limit.__proto__":0,"offset.__proto__":5}');
  assert.equal(find.status, 200);
  assert.deepEqual(polluted(), []);
  // Later requests are unaffected.
  assert.equal((await call(`${L}/_find`, bearer, 'POST', { query: [{ Name: '*' }] })).body.response.data.length, 3);
});

test('portalStyles for a portal named __proto__ does not add row ids to every object', async () => {
  const id = (await call(`${L}/records`, bearer, 'POST', { fieldData: { Name: 'd' } })).body.response.recordId;
  const body = '{"fieldData":{},"portalData":{"__proto__":[{"recordId":"1","Items::Name":"x"}]},"portalStyles":{"__proto__":{"1":{"Items::Name":[{"start":0,"end":1,"style":1}]}}}}';
  const r = await call(`${L}/records/${id}`, bearer, 'PATCH', body);
  assert.equal(r.body.messages[0].code, '102'); // there is no such portal, which is answered after the styles are read
  assert.deepEqual(polluted(), []);
});

test('styles for a field named __proto__ are refused, not attached to the result', async () => {
  const id = (await call(`${L}/records`, bearer, 'POST', { fieldData: { Name: 'e' } })).body.response.recordId;
  const r = await call(`${L}/records/${id}`, bearer, 'PATCH', '{"fieldData":{"Name":"e"},"styles":{"__proto__":[{"start":0,"end":1,"style":1}]}}');
  assert.equal(r.status, 400);
  assert.equal(r.body.messages[0].code, '960');
});
