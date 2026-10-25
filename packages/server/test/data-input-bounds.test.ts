import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../../store/src/index.ts';
import { serve } from '../src/index.ts';

test('native OData input bounds', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-input-bounds-'));
  const path = join(dir, 'Native.openhbam.sqlite');
  createStore(path, { mode: 'native' });
  const setup = new Store(path, 'Native');
  try {
    setup.applyDesign([{ op: 'createTable', name: 'Items', fields: [
      { name: 'Name' }, { name: 'Qty', type: 'number' }, { name: 'Stamp', type: 'timestamp' },
    ] }]);
    setup.create('Items', { Name: 'seed' });
    setup.applyDesign([{ op: 'createTable', name: 'Others', fields: [{ name: 'Name' }] }]);
    setup.create('Others', { Name: 'other' });
    const full = setup.privilegeSets().find((p) => p.id === 1)!;
    setup.savePrivilegeSet({ ...full, extendedPrivileges: [...full.extendedPrivileges, 'fmodata'] });
    setup.setPassword('Ann', 'pw', full.name);
  } finally { setup.close(); }
  const hosted = await serve({ dir, port: 0, watch: false, log: () => {} });
  try {
    const root = `${hosted.url}/fmi/odata/v4/Native/Items`;
    const headers = { authorization: `Basic ${btoa('Ann:pw')}`, 'content-type': 'application/json' };
    const post = async (body: string) => fetch(root, { method: 'POST', headers, body });
    await t.test('native request numbers must be finite in OData and Data API', async () => {
      const odata = await post('{"Name":"inf","Qty":1e999}');
      assert.equal(odata.status, 400);
      assert.match((await odata.json() as { error: { message: string } }).error.message, /finite/);
      const login = await fetch(`${hosted.url}/fmi/data/vLatest/databases/Native/sessions`, {
        method: 'POST', headers: { authorization: `Basic ${btoa('Ann:pw')}` },
      });
      const token = (await login.json() as { response: { token: string } }).response.token;
      const data = await fetch(`${hosted.url}/fmi/data/vLatest/databases/Native/layouts/Items/records`, {
        method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: '{"fieldData":{"Qty":1e999}}',
      });
      assert.equal(data.status, 400);
    });
    await t.test('OData text values reject NUL', async () => {
      const nul = await post(JSON.stringify({ Name: 'a\0b' }));
      assert.equal(nul.status, 400);
      assert.match((await nul.json() as { error: { message: string } }).error.message, /NUL/);
    });
    await t.test('invalid zoned timestamps are 400 in writes and filters', async () => {
      for (const stamp of ['2024-13-01T10:00:00+02:00', '2024-02-30T10:00:00Z']) {
        assert.equal((await post(JSON.stringify({ Stamp: stamp }))).status, 400, stamp);
      }
      const badFilter = await fetch(`${root}?$filter=${encodeURIComponent('Stamp gt 2024-13-01T10:00:00Z')}`, { headers });
      assert.equal(badFilter.status, 400);
    });
    await t.test('oversized OData sort and compute are 400', async () => {
      const tooMany = await fetch(`${root}?$orderby=${Array.from({ length: 2100 }, () => 'Name').join(',')}`, { headers });
      assert.equal(tooMany.status, 400);
      const compute = Array.from({ length: 1500 }, () => '1').join(' add ') + ' as X';
      const deep = await fetch(`${root}?$select=X&$compute=${encodeURIComponent(compute)}`, { headers });
      assert.equal(deep.status, 400);
      assert.match((await deep.json() as { error: { message: string } }).error.message, /too complex|Expression tree is too large/i);
    });
    await t.test('crossjoin own-set SQL depth is a client error', async () => {
      const filter = Array.from({ length: 1100 }, (_, n) => `Items/Qty eq ${n}`).join(' and ');
      const response = await fetch(`${hosted.url}/fmi/odata/v4/Native/$batch`, {
        method: 'POST', headers, body: JSON.stringify({ requests: [{ id: '1', method: 'GET', url: `$crossjoin(Items,Others)?$filter=${encodeURIComponent(filter)}` }] }),
      });
      assert.equal(response.status, 200);
      const body = await response.json() as { responses: { status: number; body: { error: { message: string } } }[] };
      assert.equal(body.responses[0].status, 400);
      assert.match(body.responses[0].body.error.message, /too complex|Expression tree is too large/i);
    });
  } finally {
    await new Promise<void>((resolve) => hosted.server.close(() => resolve()));
    rmSync(dir, { recursive: true, force: true });
  }
});

test('OData and Data API input checks in native and classic files', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-input-bounds2-'));
  for (const [name, mode] of [['Native', 'native'], ['Classic', undefined]] as const) {
    const path = join(dir, `${name}.openhbam.sqlite`);
    createStore(path, mode ? { mode } : undefined);
    const setup = new Store(path, name);
    try {
      setup.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name' }, { name: 'Qty', type: 'number' }, { name: 'Stamp', type: 'timestamp' }] }]);
      setup.create('Items', { Name: 'seed' });
      const full = setup.privilegeSets().find((p) => p.id === 1)!;
      setup.savePrivilegeSet({ ...full, extendedPrivileges: [...full.extendedPrivileges, 'fmodata'] });
      setup.setPassword('Ann', 'pw', full.name);
    } finally { setup.close(); }
  }
  const hosted = await serve({ dir, port: 0, watch: false, log: () => {} });
  try {
    const headers = { authorization: `Basic ${btoa('Ann:pw')}`, 'content-type': 'application/json' };
    for (const db of ['Native', 'Classic']) {
      const root = `${hosted.url}/fmi/odata/v4/${db}/Items`;
      await t.test(`${db}: lowercase t and z in an OData timestamp are accepted on create and edit`, async () => {
        for (const stamp of ['2024-06-01t10:00:00Z', '2024-06-01T10:00:00z', '2024-06-01t11:00:00+02:00']) {
          const created = await fetch(root, { method: 'POST', headers, body: JSON.stringify({ Stamp: stamp }) });
          assert.equal(created.status, 201, `${db} POST ${stamp}`);
          const edited = await fetch(`${root}(1)`, { method: 'PATCH', headers, body: JSON.stringify({ Stamp: stamp }) });
          assert.equal(edited.status, 204, `${db} PATCH ${stamp}`);
        }
      });
      await t.test(`${db}: a $orderby with 32 terms and an empty last term names the empty term`, async () => {
        const terms = Array.from({ length: 32 }, () => 'Name').join(',');
        assert.equal((await fetch(`${root}?$orderby=${terms}`, { headers })).status, 200);
        const trailing = await fetch(`${root}?$orderby=${terms},`, { headers });
        assert.equal(trailing.status, 400);
        assert.match((await trailing.json() as { error: { message: string } }).error.message, /is not a property/);
        const over = await fetch(`${root}?$orderby=${terms},Name`, { headers });
        assert.match((await over.json() as { error: { message: string } }).error.message, /at most 32/);
      });
    }
    await t.test('portalData refuses NUL and non-finite numbers with error 960', async () => {
      const login = await fetch(`${hosted.url}/fmi/data/vLatest/databases/Native/sessions`, { method: 'POST', headers: { authorization: `Basic ${btoa('Ann:pw')}` } });
      const token = (await login.json() as { response: { token: string } }).response.token;
      for (const body of ['{"portalData":{"Links":[{"recordId":"1","Links::Qty":1e999}]}}', '{"portalData":{"Links":[{"recordId":"1","Links::Note":"a\\u0000b"}]}}']) {
        const response = await fetch(`${hosted.url}/fmi/data/vLatest/databases/Native/layouts/Items/records/1`, {
          method: 'PATCH', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body,
        });
        const json = await response.json() as { messages: { code: string }[] };
        assert.equal(response.status, 400, body);
        assert.equal(json.messages[0].code, '960', body);
      }
    });
  } finally {
    await new Promise<void>((resolve) => hosted.server.close(() => resolve()));
    rmSync(dir, { recursive: true, force: true });
  }
});
