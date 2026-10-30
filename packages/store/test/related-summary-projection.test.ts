import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, relatedRows, Store } from '../src/index.ts';
import { firstRelatedEach } from '../src/related.ts';

function setup(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-related-summary-'));
  const path = join(dir, 'Scratch.openhbam.sqlite');
  createStore(path);
  const store = new Store(path, 'Scratch');
  t.after(() => { store.close(); rmSync(dir, { recursive: true }); });
  store.applyDesign([
    { op: 'createTable', name: 'Parents', fields: [{ name: 'Key', type: 'number' }] },
    { op: 'createTable', name: 'Kids', fields: [{ name: 'ParentKey', type: 'number' }, { name: 'ItemKey', type: 'number' }, { name: 'amount.value', type: 'number' }] },
    { op: 'createTable', name: 'Items', fields: [{ name: 'Key', type: 'number' }, { name: 'label.text' }] },
    { op: 'createField', table: 'Kids', name: 'Total', kind: 'summary', summary: { type: 'total', field: 'amount.value' } },
    { op: 'createField', table: 'Kids', name: 'sum.Total', kind: 'summary', summary: { type: 'total', field: 'amount.value' } },
    { op: 'createField', table: 'Kids', name: 'Double', type: 'number', kind: 'calculation', calculation: 'ParentKey * 2', options: { unstored: true } },
    { op: 'createField', table: 'Items', name: 'sum.Total', kind: 'summary', summary: { type: 'count', field: 'Key' } },
    { op: 'createRelationship', left: 'Parents', right: 'Kids', predicates: [{ left: 'Key', right: 'ParentKey' }] },
    { op: 'createRelationship', left: 'Kids', right: 'Items', predicates: [{ left: 'ItemKey', right: 'Key' }] },
  ] as never);
  const parentIds = [1, 2].map((key) => Number(store.create('Parents', { Key: String(key) }).recordId));
  store.create('Kids', { ParentKey: '1', ItemKey: '10', 'amount.value': '7' });
  store.create('Kids', { ParentKey: '2', ItemKey: '20', 'amount.value': '9' });
  store.create('Items', { Key: '10', 'label.text': 'first' });
  store.create('Items', { Key: '20', 'label.text': 'second' });
  const occ = (name: string) => store.schema.tableOccurrences.find((o) => o.name === name)!.id;
  const field = (id: number, name: string, occurrence: string) => ({
    id, kind: 'field', type: 5, anchors: { left: true, top: true, right: false, bottom: false },
    bounds: { top: 210, left: 20, bottom: 230, right: 200 }, style: {},
    field: { field: name, fieldId: 0, tableOccurrence: occurrence, tableOccurrenceId: occ(occurrence) },
  });
  const layout = store.design('Parents')!;
  const portal = {
    id: 900, kind: 'portal', type: 9, anchors: { left: true, top: true, right: false, bottom: false },
    bounds: { top: 200, left: 20, bottom: 300, right: 300 }, style: {},
    portal: { tableOccurrenceId: occ('Kids'), tableOccurrence: 'Kids', rows: 4, initialRow: 1 },
    children: [field(901, 'amount.value', 'Kids'), field(902, 'Total', 'Kids'), field(903, 'sum.Total', 'Kids'), field(906, 'Double', 'Kids')],
  };
  const distantPortal = {
    id: 910, kind: 'portal', type: 9, anchors: { left: true, top: true, right: false, bottom: false },
    bounds: { top: 320, left: 20, bottom: 420, right: 300 }, style: {},
    portal: { tableOccurrenceId: occ('Items'), tableOccurrence: 'Items', rows: 4, initialRow: 1 },
    children: [field(911, 'label.text', 'Items'), field(912, 'sum.Total', 'Items')],
  };
  store.applyDesign([{ op: 'updateLayout', layout: 'Parents', design: {
    objects: [...layout.objects, portal, distantPortal, field(904, 'Total', 'Kids'), field(905, 'sum.Total', 'Kids')],
  } as never }]);
  return { store, parentIds, occ };
}

test('a portal and related fields with ordinary and dotted summaries read records', (t) => {
  const { store, parentIds } = setup(t);
  const check = (record: ReturnType<Store['get']>) => {
    assert.equal(record.fieldData['Kids::Total'], '');
    assert.equal(record.fieldData['Kids::sum.Total'], '');
    const row = record.portalData!.Kids[0];
    assert.equal(row['Kids::amount.value'], 7);
    assert.equal(row['Kids::Total'], '');
    assert.equal(row['Kids::sum.Total'], '');
    assert.equal(row['Kids::Double'], 2);
    assert.equal(record.portalData!.Items[0]['Items::label.text'], 'first');
    assert.equal(record.portalData!.Items[0]['Items::sum.Total'], '');
  };
  check(store.get('Parents', parentIds[0]));
  check(store.getMany('Parents', [parentIds[0]], parentIds, { layoutOnly: true })[0]);
  const found = store.find('Parents', { query: [{ Key: '==1' }], layoutOnly: true });
  assert.equal(found.foundCount, 1);
  check(found.records[0]);
});

test('a two-hop requested projection skips a dotted summary and quotes dotted stored fields', (t) => {
  const { store, parentIds, occ } = setup(t);
  const parent = store.row(store.layout('Parents'), parentIds[0]);
  const result = relatedRows(store, occ('Parents'), parent, occ('Items'), { cols: ['label.text', 'sum.Total'] });
  assert.equal(result?.count, 1);
  assert.equal(result?.rows[0]['label.text'], 'first');
  assert.equal(result?.rows[0]['sum.Total'], undefined);
  const viewed = relatedRows(store, occ('Parents'), parent, occ('Items'), {
    cols: ['label.text', 'sum.Total'], privileges: store.privileges('Admin'),
  });
  assert.equal(viewed?.rows[0]['label.text'], 'first');
  assert.equal(viewed?.rows[0]['sum.Total'], undefined);
});

test('batched related-field projections skip summary columns', (t) => {
  const { store, parentIds, occ } = setup(t);
  const layout = store.layout('Parents');
  const parents = parentIds.map((id) => store.row(layout, id));
  const result = firstRelatedEach(store, occ('Parents'), parents, occ('Kids'), ['amount.value', 'Total', 'sum.Total']);
  assert.deepEqual(result?.firsts.map((row) => row?.['amount.value']), [7, 9]);
  assert.deepEqual(result?.firsts.map((row) => row?.Total), [undefined, undefined]);
  assert.deepEqual(result?.firsts.map((row) => row?.['sum.Total']), [undefined, undefined]);
});
