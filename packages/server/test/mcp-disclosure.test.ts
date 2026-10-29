import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Host } from '../src/host.ts';
import { createMcpServer } from '../src/mcp.ts';
import { applyImport } from '../src/import-mapping.ts';
import { Dashboards, DashboardApi } from '../src/dashboards.ts';
import type { DataApi } from '../src/dataapi.ts';
import type { IncomingMessage, ServerResponse } from 'node:http';

async function setup(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-disclosure-'));
  const host = new Host(dir, () => {}, { background: false });
  const store = host.create('Local');
  store.setAiPolicy(false);
  store.applyDesign([
    { op: 'createTable', name: 'Public', fields: [{ name: 'Note' }, { name: 'Password' }] },
    { op: 'createTable', name: 'Private', fields: [{ name: 'Amount' }] },
  ]);
  const open = { view: true, edit: true, create: true, delete: true };
  store.savePrivilegeSet({ name: 'Limited', records: open,
    tables: { Private: { ...open, view: false } },
    layouts: 'modifiable', layoutAccess: { Private: { layout: 'none', records: 'none' } },
    scripts: 'modifiable', valueLists: 'viewOnly', extendedPrivileges: ['fmmcp', 'fmrest'] });
  store.setPassword('Clerk', 'pw', 'Limited');
  store.setPassword('Admin', 'pw', '[Full Access]');
  t.after(async () => { await host.close(); rmSync(dir, { recursive: true, force: true }); });
  const connect = async (account = 'Admin', scope?: { layouts: string[] }) => {
    const server = createMcpServer(host, { account, database: 'Local', ...(scope ? { scope } : {}) });
    const client = new Client({ name: 'disclosure-test', version: '1' });
    const [a, b] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(a), client.connect(b)]);
    t.after(async () => { await client.close(); await server.close(); });
    return async (name: string, args: Record<string, unknown> = {}) => client.callTool({ name, arguments: { database: 'Local', ...args } });
  };
  return { host, store, connect };
}
const body = (r: any) => JSON.parse(r.content[0].text);

test('#79 copied secrets stay hidden in samples, explanations and history', async (t) => {
  const { store, connect } = await setup(t);
  const secret = ['private', 'copied', 'value'].join('-');
  const id = store.create('Public', { Password: secret, Note: `hello ${secret}` }).recordId;
  store.update('Public', id, { Note: `changed ${secret}` });
  store.applyDesign([{ op: 'createField', table: 'Public', name: 'Echo', kind: 'calculation', calculation: 'Note', type: 'text' }]);
  const call = await connect();
  for (const [name, args] of [
    ['describe_layout', { layout: 'Public' }],
    ['explain_value', { layout: 'Public', recordId: id, field: 'Note' }],
    ['explain_value', { layout: 'Public', recordId: id, field: 'Echo' }],
    ['explain_record_history', { layout: 'Public', recordId: id }],
  ] as const) await t.test(`${name} ${'field' in args ? args.field : ''}`, async () => {
    const r = await call(name, args);
    assert.ok(!r.isError, JSON.stringify(r));
    assert.ok(!JSON.stringify(r).includes(secret), name);
  });
});

test('#78 design text hides protected literals on every reported surface', async (t) => {
  const { store, connect } = await setup(t);
  const bearer = ['abcdef', 'ghijklmnop', '1234567'].join('');
  const cf = ['function', 'private', 'value'].join('-');
  const script = ['script', 'private', 'value'].join('-');
  const urlPassword = ['url', 'private', 'value'].join('-');
  const queryKey = ['query', 'private', 'value'].join('-');
  store.applyDesign([
    { op: 'createField', table: 'Public', name: 'Config', kind: 'calculation', type: 'text', calculation: `"Bearer ${bearer}"` },
    { op: 'createField', table: 'Public', name: 'Endpoint', type: 'text', calculation: `"https://svc:${urlPassword}@example.test/x?api_key=${queryKey}"` },
    { op: 'createCustomFunction', name: 'DbPassword', parameters: [], formula: `"${cf}"` },
    { op: 'createScript', name: 'Configure', text: `Set Variable [ $password ; Value: "${script}" ]` },
  ]);
  const call = await connect();
  for (const [name, args] of [
    ['describe_database', { detail: ['Public', 'DbPassword'] }],
    ['get_design', { sections: ['tables', 'customFunctions', 'scripts'] }],
    ['document_solution', {}], ['design_history', {}],
    ['explain_solution', { item: 'Public' }], ['explain_solution', { item: 'DbPassword' }],
    ['search_solution', { text: 'private' }],
  ] as const) await t.test(`${name} ${'item' in args ? args.item : ''}`, async () => {
    const r = await call(name, args);
    assert.ok(!r.isError, JSON.stringify(r));
    for (const secret of [bearer, cf, script, urlPassword, queryKey]) assert.ok(!JSON.stringify(r).includes(secret), name);
  });
});

test('#19 describe_database requires full design access for formulas and functions', async (t) => {
  const { store, connect } = await setup(t);
  store.applyDesign([
    { op: 'createField', table: 'Public', name: 'Total', type: 'number', kind: 'calculation', calculation: 'Sum ( Private::Amount )' },
    { op: 'createCustomFunction', name: 'InternalCalc', parameters: [], formula: '42' },
  ]);
  for (const [account, scope] of [['Clerk', undefined], ['Admin', { layouts: ['Public'] }]] as const) {
    const call = await connect(account, scope ? { layouts: [...scope.layouts] } : undefined);
    const r = await call('describe_database', { detail: ['Public', 'InternalCalc'] });
    assert.ok(!r.isError);
    assert.ok(!JSON.stringify(r).includes('Private::Amount'));
    assert.equal(body(r).customFunctions, undefined);
  }
  const full = await connect();
  assert.ok(JSON.stringify(await full('describe_database', { detail: ['Public'] })).includes('Private::Amount'));
});

test('#80/#18 undo_import lists only own imports on visible layouts and tables', async (t) => {
  const { store, connect } = await setup(t);
  const add = (layout: string, account: string) => applyImport(store, layout, [['Note'], ['row']],
    { headerRow: true, columns: [{ column: 0, field: layout === 'Public' ? 'Note' : 'Amount' }], keys: [] }, { account }).id;
  add('Private', 'Admin');
  add('Public', 'Admin');
  add('Private', 'Clerk');
  store.applyDesign([{ op: 'createLayout', name: 'VisibleAlias', occurrence: 'Private' }]);
  add('VisibleAlias', 'Clerk');
  const own = add('Public', 'Clerk');
  const call = await connect('Clerk');
  const r = await call('undo_import');
  assert.ok(!r.isError);
  assert.deepEqual(body(r).map((x: any) => x.id), [own]);
  const full = await connect();
  assert.equal(body(await full('undo_import')).length, 5);
});

test('#20 dashboards do not disclose other accounts definitions over MCP or HTTP', async (t) => {
  const { store, host, connect } = await setup(t);
  const boards = new Dashboards(store);
  const hidden = boards.create({ name: 'Private dashboard', widgets: [{ title: 'Restricted', kind: 'number', layout: 'Private', query: [{ Amount: '>99' }] }] }, 'Admin');
  const own = boards.create({ name: 'Own dashboard', widgets: [{ title: 'Visible', kind: 'number', layout: 'Public' }] }, 'Clerk');
  const call = await connect('Clerk');
  await t.test('MCP list and get', async () => {
    assert.deepEqual(body(await call('list_dashboards')).dashboards.map((d: any) => d.id), [own.id]);
    for (const dashboard of [hidden.id, hidden.name, 'missing']) {
      const r = await call('get_dashboard', { dashboard });
      assert.ok(r.isError);
      if (dashboard !== hidden.name) assert.ok(!JSON.stringify(r).includes(hidden.name));
      assert.ok(!JSON.stringify(r).includes('>99'));
    }
    assert.ok(!(await call('get_dashboard', { dashboard: own.id })).isError);
  });
  const full = await connect();
  assert.equal(body(await full('list_dashboards')).dashboards.length, 2);
  assert.ok(!(await full('get_dashboard', { dashboard: hidden.id })).isError);
  await t.test('HTTP list and get', async () => {
    const api = new DashboardApi(host, { authorize: () => ({ account: 'Clerk', database: 'Local', client: 'rest' }) } as unknown as DataApi);
    const request = async (suffix = '') => {
      let status = 0, result: any;
      await api.handle({ method: 'GET' } as IncomingMessage, {
        writeHead: (n: number) => { status = n; }, end: (s: string) => { result = JSON.parse(s); },
      } as unknown as ServerResponse, new URL(`http://localhost/tabularius/dashboards/v1/databases/Local${suffix}`));
      return { status, result };
    };
    const list = await request();
    assert.equal(list.status, 200);
    assert.deepEqual(list.result.dashboards.map((d: any) => d.id), [own.id]);
    assert.equal((await request(`/${hidden.id}`)).status, 404);
    assert.equal((await request(`/${own.id}`)).status, 200);
  });
});
