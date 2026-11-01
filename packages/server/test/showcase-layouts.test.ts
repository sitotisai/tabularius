import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { Server } from 'node:http';
import { serve } from '../src/index.ts';
import { STORE_EXT } from '../src/host.ts';
import { applyStarter, createStore, type Store } from '../../store/src/index.ts';

let dir: string;
let server: Server;
let base: string;
let store: Store;
let auth: string;

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-showcase-api-'));
  createStore(join(dir, `Showcase${STORE_EXT}`));
  const running = await serve({ dir, port: 0, watch: false, log: () => {} });
  server = running.server;
  base = running.url;
  store = running.host.get('Showcase')!;
  applyStarter(store, 'crm-showcase', { sample: false });
  store.setPassword('Manager', 'showcase-test', 'Manager');
  store.create('Reps', { Name: 'Casey Rowan', Region: 'West', 'Quarterly Quota': 100000, Login: 'casey' });
  store.create('Accounts', { Name: 'Northwind Sample', Industry: 'Technology', Region: 'West', 'Owner ID': 1 });
  store.create('Contacts', { 'Account ID': 1, Name: 'Morgan Vale', Role: 'Buyer', Email: 'morgan@northwind.example', Phone: '555-0101' });
  store.create('Deals', { 'Account ID': 1, 'Owner ID': 1, Title: 'Pilot', Stage: 'Proposal', Amount: 2500 });
  store.create('Activities', { 'Account ID': 1, 'Contact ID': 1, 'Deal ID': 1, 'Rep ID': 1, Type: 'Call', Subject: 'Intro call' });
  store.create('Email Log', { 'Account ID': 1, 'Contact ID': 1, Direction: 'Outbound', Subject: 'Welcome', Body: 'Hello', Sent: '2026-01-01 10:00:00' });
  const login = await fetch(`${base}/fmi/data/vLatest/databases/Showcase/sessions`, {
    method: 'POST', headers: { authorization: `Basic ${btoa('Manager:showcase-test')}`, 'content-type': 'application/json' }, body: '{}',
  });
  assert.equal(login.status, 200);
  auth = `Bearer ${(await login.json() as { response: { token: string } }).response.token}`;
});

after(async () => {
  await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()));
  rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
});

test('Manager can read every showcase layout through the Data API and Account 360 includes portal rows', async () => {
  for (const layout of store.schema.layouts) {
    const response = await fetch(`${base}/fmi/data/vLatest/databases/Showcase/layouts/${encodeURIComponent(layout.name)}/records?_limit=1`, { headers: { authorization: auth } });
    assert.equal(response.status, 200, `${layout.name}: ${await response.text()}`);
  }
  const response = await fetch(`${base}/fmi/data/vLatest/databases/Showcase/layouts/Account%20360/records?_limit=1`, { headers: { authorization: auth } });
  const body = await response.json() as { response: { data: { fieldData: Record<string, unknown>; portalData: Record<string, Record<string, unknown>[]> }[] } };
  assert.equal(response.status, 200);
  const record = body.response.data[0];
  assert.equal(record.fieldData.Name, 'Northwind Sample');
  assert.equal(record.portalData.Contacts[0]['Contacts::Name'], 'Morgan Vale');
  assert.equal(record.portalData.Deals[0]['Deals::Title'], 'Pilot');
  assert.equal(record.portalData.Activities[0]['Activities::Subject'], 'Intro call');
  assert.equal(record.portalData['Email Log'][0]['Email Log::Subject'], 'Welcome');
});
