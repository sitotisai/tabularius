import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../../store/src/index.ts';
import { serve } from '../src/index.ts';

test('OData arithmetic, typed filters and writes honor visible values and entry rules', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-odata-semantics-'));
  const path = join(dir, 'Synthetic.openhbam.sqlite');
  createStore(path);
  const setup = new Store(path, 'Synthetic');
  try {
    setup.applyDesign([{ op: 'createTable', name: 'Items', fields: [
      { name: 'Amount', type: 'number' }, { name: 'Day', type: 'date' },
      { name: 'Status' }, { name: 'Protected', options: { autoEnter: { prohibitModification: true } } },
    ] }]);
    setup.create('Items', { Amount: '5.5', Day: '2024-01-01', Status: 'ok' });
    setup.create('Items', { Amount: 'abc', Day: '0000-00-00z', Status: 'no' });
    const full = setup.privilegeSets().find((p) => p.id === 1)!;
    setup.savePrivilegeSet({ ...full, extendedPrivileges: [...full.extendedPrivileges, 'fmodata'] });
    setup.setPassword('Admin', 'pw', full.name);
    setup.savePrivilegeSet({ name: 'Limited', extendedPrivileges: ['fmodata'], layouts: 'modifiable', scripts: 'none', valueLists: 'viewOnly',
      records: { view: true, edit: true, create: true, delete: true },
      tables: { Items: { view: 'Status = "ok"', edit: true, create: true, delete: true } } });
    setup.setPassword('Limited', 'pw', 'Limited');
  } finally { setup.close(); }
  const hosted = await serve({ dir, port: 0, watch: false, log: () => {} });
  t.after(async () => {
    await new Promise<void>((resolve) => hosted.server.close(() => resolve()));
    rmSync(dir, { recursive: true, force: true });
  });
  const store = hosted.host.get('Synthetic')!;
  const root = `${hosted.url}/fmi/odata/v4/Synthetic/Items`;
  const auth = (name: string) => ({ authorization: `Basic ${btoa(`${name}:pw`)}` });
  const get = async (query: string) => {
    const res = await fetch(`${root}?$filter=${encodeURIComponent(query)}`, { headers: auth('Admin') });
    return { status: res.status, body: await res.json() as any };
  };
  const write = (name: string, method: string, url: string, data: object, extra: Record<string, string> = {}) =>
    fetch(url, { method, headers: { ...auth(name), 'content-type': 'application/json', ...extra }, body: JSON.stringify(data) });

  await t.test('mod keeps fractional remainders and rejects zero', async () => {
    assert.deepEqual((await get('Amount mod 2 eq 1.5')).body.value.map((r: any) => r.ROWID), [1]);
    assert.equal((await get('Amount mod 2 eq 1')).body.value.length, 0);
    assert.equal((await get('Amount mod 0 eq 0')).status, 400);
  });
  await t.test('number and date filters exclude text rendered as null', async () => {
    assert.deepEqual((await get('Amount eq 0')).body.value, []);
    assert.deepEqual((await get('Amount ne 5.5')).body.value, []);
    assert.deepEqual((await get('Day lt 2025-01-01')).body.value.map((r: any) => r.ROWID), [1]);
    const applied = await fetch(`${root}?$apply=${encodeURIComponent('aggregate(Amount with average as Mean)')}&$filter=${encodeURIComponent('Mean gt 5')}`, { headers: auth('Admin') });
    assert.equal(applied.status, 200);
    assert.equal(((await applied.json()) as any).value[0].Mean, 5.5);
  });
  await t.test('OData create and update enforce prohibit modification', async () => {
    const before = store.findIds('Items').length;
    assert.equal((await write('Admin', 'POST', root, { Protected: 'changed' })).status, 403);
    assert.equal(store.findIds('Items').length, before);
    assert.equal((await write('Admin', 'PATCH', `${root}(1)`, { Protected: 'changed' })).status, 403);
    assert.equal(store.get('Items', 1).fieldData.Protected, '');
  });
  await t.test('committed create and update succeed when result is hidden', async () => {
    const before = store.findIds('Items').length;
    const made = await write('Limited', 'POST', root, { Status: 'no' });
    assert.equal(made.status, 201);
    assert.equal(store.findIds('Items').length, before + 1);
    const minimal = await write('Limited', 'POST', root, { Status: 'no' }, { prefer: 'return=minimal' });
    assert.equal(minimal.status, 204);
    const changed = await write('Limited', 'PATCH', `${root}(1)`, { Status: 'no' }, { prefer: 'return=representation' });
    assert.equal(changed.status, 204);
    assert.equal(store.get('Items', 1).fieldData.Status, 'no');
  });
  await t.test('hidden and missing records give the same conditional write response', async () => {
    const variants: Record<string, string>[] = [{ 'if-match': 'W/"999"' }, { 'if-match': 'W/"0"' }, {}];
    for (const headers of variants) {
      const hidden = await write('Limited', 'PATCH', `${root}(2)`, { Status: 'ok' }, headers);
      const missing = await write('Limited', 'PATCH', `${root}(999)`, { Status: 'ok' }, headers);
      assert.equal(hidden.status, missing.status);
      assert.equal(await hidden.text(), await missing.text());
    }
  });
});
