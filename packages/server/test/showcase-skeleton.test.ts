import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store, STARTER_NAMES, SHOWCASE_STARTERS, applyStarter, createStore, isShowcase, type Starter } from '../../store/src/index.ts';
import { Dashboards } from '../src/dashboards.ts';
import { listAutomations } from '../src/automations.ts';
import { applyShowcaseExtras, applyStarterExtras } from '../src/showcase.ts';
import { runScript } from '../../scripts/src/index.ts';

async function withStore(run: (store: Store) => Promise<void> | void): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-showcase-'));
  const file = join(dir, 'Showcase.openhbam.sqlite');
  createStore(file);
  const store = new Store(file, 'Showcase');
  try { await run(store); }
  finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
}

test('CRM showcase skeleton builds its native and server-owned pieces', () => withStore(async (store) => {
  assert.equal(isShowcase('crm-showcase'), true);
  assert.equal(isShowcase('crm'), false);
  assert.deepEqual(STARTER_NAMES, ['crm', 'inventory', 'invoicing', 'tasks', 'booking']);
  assert.equal(SHOWCASE_STARTERS['crm-showcase'].sample.length, 0);
  const built = applyStarter(store, 'crm-showcase', { account: 'tabularius demo' });
  assert.equal(built.tables, 8);
  assert.deepEqual(store.schema.tables.map((t) => t.name), ['Reps', 'Accounts', 'Contacts', 'Deals', 'Activities', 'Email Log', 'Products', 'Deal Lines']);
  store.setPassword('tabularius demo', ['local', 'showcase', 'password'].join(' '), '[Full Access]');
  const result = applyStarterExtras(store, SHOWCASE_STARTERS['crm-showcase'].extras!, { account: 'tabularius demo', now: new Date('2026-11-01T12:00:00Z') });
  assert.deepEqual(result.skipped, []);
  assert.ok(store.schema.layouts.some((l) => l.name === 'Deals - Modern board'));
  assert.ok(store.schema.layouts.some((l) => l.name === 'Activities - Modern calendar'));
  const stage = store.schema.tables.find((t) => t.name === 'Deals')!.fields.find((f) => f.name === 'Stage')!;
  assert.equal(stage.options?.validation?.valueList, store.schema.valueLists.find((v) => v.name === 'Stage')!.id);
  const dashboard = new Dashboards(store).find('Pipeline overview');
  assert.deepEqual(dashboard?.widgets.map((w) => [w.kind, w.chart, w.measure?.field, w.groupBy]), [
    ['number', undefined, 'Weighted Amount', undefined],
    ['chart', 'column', 'Amount', ['Stage']],
    ['chart', 'pie', 'Amount', ['Source']],
  ]);
  const automation = listAutomations(store).find((a) => a.name === 'When a deal is won, add an onboarding task');
  assert.deepEqual([automation?.account, automation?.layout, automation?.fields, automation?.condition],
    ['tabularius demo', 'Deals', ['Stage'], 'Stage = "Won"']);
  const made = store.create('Deals', { Title: 'Synthetic deal', Amount: 100 });
  const fields = store.get('Deals', made.recordId).fieldData;
  assert.deepEqual([fields.Stage, fields['Weighted Amount']], ['Lead', 10]);
  const run = await runScript(store, 'Add onboarding task', { layout: 'Deals', foundSet: [made.recordId], recordId: made.recordId });
  assert.equal(run.error, 0);
  assert.deepEqual(store.find('Activities list', {}).records.map((record) => [record.fieldData['Deal ID'], record.fieldData.Subject, record.fieldData.Type]),
    [[made.recordId, 'Onboard new customer', 'Task']]);
}));

test('showcase extras report a missing execution account', () => withStore((store) => {
  applyStarter(store, 'crm-showcase');
  const result = applyShowcaseExtras(store, { account: 'tabularius demo' });
  assert.deepEqual(result.skipped, [{ piece: 'When a deal is won, add an onboarding task', reason: 'The execution account tabularius demo is missing or inactive' }]);
  assert.equal(listAutomations(store).length, 0);
}));

test('showcase extras name missing tables and fields', () => withStore((store) => {
  const result = applyShowcaseExtras(store, { account: 'tabularius demo' });
  assert.deepEqual(result.skipped.map((item) => item.piece), [
    'Deals modern-board', 'Activities modern-calendar', 'Pipeline overview', 'HTML pages', 'When a deal is won, add an onboarding task',
  ]);
  assert.ok(result.skipped.every((item) => item.reason.includes('missing')));
}));

test('showcase extras skip fields that later showcase items have not added', () => withStore((store) => {
  store.applyDesign([{ op: 'createTable', name: 'Deals', fields: [{ name: 'Title', type: 'text' }] }] as never);
  const result = applyShowcaseExtras(store, { account: 'tabularius demo' });
  assert.ok(result.skipped.some((item) => item.piece === 'Deals modern-board' && item.reason.includes('Stage')));
  assert.ok(result.skipped.some((item) => item.piece === 'Pipeline overview' && item.reason.includes('Stage')));
  assert.ok(result.skipped.some((item) => item.piece === 'When a deal is won, add an onboarding task' && item.reason.includes('Stage')));
}));

test('a starter list chart maps field names to the draft chart', () => withStore((store) => {
  const chartStarter: Starter = {
    name: 'chart-check', title: 'Chart check', summary: 'Synthetic chart',
    tables: [{ name: 'Items', fields: [
      { name: 'Category', type: 'text' }, { name: 'Amount', type: 'number' },
      { name: 'Total Amount', summary: { type: 'total', field: 'Amount' } },
    ] }], relationships: [], valueLists: [], popups: {}, scripts: [],
    layouts: [{ table: 'Items', list: { fields: ['Category', 'Amount'], chart: { type: 'column', category: 'Category', value: 'Total Amount' } } }],
    reports: [], privilegeSets: [], sample: [],
  };
  SHOWCASE_STARTERS[chartStarter.name] = chartStarter;
  try {
    applyStarter(store, chartStarter.name);
    assert.equal(store.designs().layouts.find((layout) => layout.name === 'Items list')!.objects.filter((object) => object.kind === 'chart').length, 1);
  } finally { delete SHOWCASE_STARTERS[chartStarter.name]; }
}));

for (const name of STARTER_NAMES) test(`${name} still builds`, () => withStore((store) => {
  const built = applyStarter(store, name);
  assert.ok(built.tables > 0);
  assert.ok(store.schema.layouts.length >= built.tables * 2);
}));
