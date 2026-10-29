import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { openIsolation, rest, type Isolation } from './cross-file-matrix.ts';
import { serverCommit } from '../src/version.ts';

let m: Isolation;
let fieldList: number;
let externalList: number;
let button: number;

before(async () => {
  // The layout menu asks for an optional build commit. Prime its cache without an executable on PATH;
  // the request itself then runs under openIsolation's marker-writing stub PATH.
  const path = process.env.PATH;
  try { process.env.PATH = ''; serverCommit(); } finally { if (path === undefined) delete process.env.PATH; else process.env.PATH = path; }
  m = await openIsolation();
  const [ui, data] = m.stores;
  const value = data.schema.tables[0].fields.find((f) => f.name === 'Value')!;
  data.applyDesign([{ op: 'createValueList', name: 'DataChoices', values: ['data choice'] }]);
  ui.applyDesign([
    { op: 'createValueList', name: 'FromDataField', field: { occurrence: 'ExternalItems', field: value.id } },
    { op: 'createValueList', name: 'FromDataList', external: { file: 'Destination', valueList: data.schema.valueLists[0].id } },
  ], { readOtherFile: () => true });
  fieldList = ui.schema.valueLists.find((v) => v.name === 'FromDataField')!.id;
  externalList = ui.schema.valueLists.find((v) => v.name === 'FromDataList')!.id;
  const source = ui.schema.dataSources.find((d) => d.name === 'Destination')!;
  const read = data.schema.scripts.find((s) => s.name === 'Read')!;
  ui.applyDesign([{ op: 'createScript', name: 'ViaData', steps: [{ stepId: 1, name: 'Perform Script', enabled: true,
    params: { script: { id: read.id, name: read.name, file: { id: source.id, name: source.name } } } }] }] as never);
  const design = ui.design('External')!;
  const object = design.objects.find((o) => o.field?.field === 'Value')!;
  button = 901;
  ui.applyDesign([{ op: 'updateLayout', layout: 'External', design: { objects: [
    ...design.objects.map((o) => o.id === object.id ? { ...o, field: { ...o.field!, valueListId: fieldList } } : o),
    { id: button, kind: 'button', style: {}, bounds: { top: 0, left: 0, width: 100, height: 20 }, text: 'Read data',
      action: { text: 'Perform Script [ From file: "Destination" ; "Read" ]' } } as never,
  ] } }]);
});
after(async () => { await m?.close(); });

test('both kinds of cross-file value list follow the data file account and its current privileges', () => {
  const [ui, data] = m.stores;
  const shared = ui.privileges('Shared');
  const onlyUi = ui.privileges('Only0');
  assert.deepEqual(ui.valueListItems(fieldList, undefined, shared).map((x) => x.value), ['SENTINEL_1']);
  assert.deepEqual(ui.valueListItems(externalList, undefined, shared).map((x) => x.value), ['data choice']);
  assert.deepEqual(ui.valueListItems(fieldList, undefined, onlyUi), []);
  assert.deepEqual(ui.valueListItems(externalList, undefined, onlyUi), []);
  const original = data.privilegeSet('Reader')!;
  try {
    data.savePrivilegeSet({ ...original, valueLists: 'none', records: { view: false, edit: false, create: false, delete: false } });
    assert.deepEqual(ui.valueListItems(fieldList, undefined, shared), []);
    assert.deepEqual(ui.valueListItems(externalList, undefined, shared), []);
  } finally { data.savePrivilegeSet(original); }
});

test('web layout and Data API expose the interface layout with data-file values to the shared account', async () => {
  const db = encodeURIComponent(m.stores[0].name);
  const web = await m.request(`/tabularius/app/v1/databases/${db}/layouts/External`, m.sessions[0]);
  assert.equal(web.status, 200, web.text);
  assert.equal(web.data.layout.file, m.stores[1].name);
  assert.ok(web.data.fields.ExternalItems.some((f: { name: string }) => f.name === 'Value'));
  assert.deepEqual(web.data.valueLists[fieldList], ['SENTINEL_1']);
  const webRecords = await m.request(`/tabularius/app/v1/databases/${db}/layouts/External/records`, m.sessions[0], 'POST', { ids: [1] });
  assert.equal(webRecords.status, 200, webRecords.text);
  assert.match(webRecords.text, /SENTINEL_1/);
  const api = await m.request(rest(db) + '/layouts/External/records', m.sessions[0]);
  assert.equal(api.status, 200, api.text);
  assert.deepEqual(api.data.response.data.map((r: { fieldData: { Value: string } }) => r.fieldData.Value), ['SENTINEL_1']);
});

test('the interface button runs the data-file script under that file account', async () => {
  const db = encodeURIComponent(m.stores[0].name);
  const path = `/tabularius/app/v1/databases/${db}/layouts/External/button`;
  const allowed = await m.request(path, m.sessions[0], 'POST', { objectId: button, mode: 'browse', recordId: 1 });
  assert.equal(allowed.status, 200, allowed.text);
  assert.equal(allowed.data.result, 'SENTINEL_1');
  const onlyUi = await m.login(0, 'Only0', 'only-0');
  const refused = await m.request(path, onlyUi, 'POST', { objectId: button, mode: 'browse', recordId: 1 });
  assert.doesNotMatch(refused.text, /SENTINEL_1/);
  assert.notEqual(refused.data.result, 'SENTINEL_1');
});

test('an interface-only account learns no data or schema from web and Data API layout reads', async () => {
  const db = encodeURIComponent(m.stores[0].name);
  const auth = await m.login(0, 'Only0', 'only-0');
  for (const suffix of ['/records', '/records/1', '']) {
    const prefix = suffix ? rest(db) : `/tabularius/app/v1/databases/${db}`;
    const denied = await m.request(`${prefix}/layouts/External${suffix}`, auth);
    const missing = await m.request(`${prefix}/layouts/Absent${suffix}`, auth);
    const sameShape = (body: unknown) => JSON.stringify(body).replaceAll('External', 'TARGET').replaceAll('Absent', 'TARGET');
    assert.deepEqual([denied.status, sameShape(denied.data)], [missing.status, sameShape(missing.data)], suffix || 'web layout');
    assert.doesNotMatch(denied.text, /SENTINEL_1|ExternalItems|DataChoices/);
  }
  const webRecords = `/tabularius/app/v1/databases/${db}/layouts/`;
  const deniedRecords = await m.request(webRecords + 'External/records', auth, 'POST', { ids: [1] });
  const missingRecords = await m.request(webRecords + 'Absent/records', auth, 'POST', { ids: [1] });
  assert.deepEqual([deniedRecords.status, deniedRecords.text.replace('External', 'TARGET')],
    [missingRecords.status, missingRecords.text.replace('Absent', 'TARGET')]);
  const layouts = await m.request(rest(db) + '/layouts', auth);
  assert.doesNotMatch(layouts.text, /External|ExternalItems/);
  const menu = await m.request(`/tabularius/app/v1/databases/${db}/layouts`, auth);
  assert.equal(menu.status, 200, menu.text);
  assert.doesNotMatch(menu.text, /External|ExternalItems/);
});
