// The showcase CRM's invented sample data: deterministic, the shape the design asks for, only invented contact
// details, consistent keys, deliberate mess for Clean Up Data, and quick to load. Built on a throwaway store.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store, applyStarter, createStore } from '../src/index.ts';
import type { FieldSpec } from '../src/design.ts';
import { SHOWCASE_LISTS, showcaseSample } from '../src/showcase-data.ts';

const NOW = new Date('2026-11-01T15:30:00Z');
const sample = showcaseSample(NOW);
const rows = (table: string) => sample.find((g) => g.table === table)!.rows;

test('the same seed and the same day give identical output; another seed differs', () => {
  assert.equal(JSON.stringify(showcaseSample(NOW)), JSON.stringify(showcaseSample(NOW)));
  assert.notEqual(JSON.stringify(showcaseSample(NOW, 7)), JSON.stringify(sample));
});

test('the counts match the shared design', () => {
  const counts = Object.fromEntries(sample.map((g) => [g.table, g.rows.length]));
  assert.deepEqual(counts, { Reps: 6, Accounts: 40, Contacts: 120, Products: 12, Deals: 70, 'Deal Lines': 150, Activities: 350, 'Email Log': 60 });
  assert.equal(new Set(rows('Reps').map((r) => r.Region)).size, 4);
  const deals = rows('Deals');
  const open = deals.filter((d) => ['Lead', 'Qualified', 'Qualifed', 'Qualified ', 'Proposal', 'Negotiation'].includes(String(d.Stage)));
  assert.equal(open.length, 28);
  assert.equal(deals.filter((d) => d.Stage === 'Won').length, 25);
  const lost = deals.filter((d) => d.Stage === 'Lost');
  assert.equal(lost.length, 17);
  assert.ok(lost.every((d) => d['Lost Reason']));
  for (const d of deals) { assert.ok(Number(d.Amount) >= 1200 && Number(d.Amount) <= 90000); }
});

test('dates are relative to now and sit in the right windows', () => {
  const day = (s: unknown) => Math.round((Date.parse(`${NOW.toISOString().slice(0, 10)}T00:00:00Z`) - Date.parse(`${String(s).slice(0, 10)}T00:00:00Z`)) / 86_400_000);
  for (const d of rows('Deals')) {
    assert.match(String(d.Opened), /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(day(d.Opened) >= 0 && day(d.Opened) <= 365);
    assert.match(String(d['Stage Changed']), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    assert.ok(String(d['Stage Changed']) <= NOW.toISOString().slice(0, 19));
    if (d.Closed) assert.ok(day(d.Closed) >= 1 && day(d.Closed) < day(d.Opened));
    else { assert.ok(day(d['Expected Close']) <= -3 && day(d['Expected Close']) >= -90); }
  }
  const stale = rows('Deals').filter((d) => !d.Closed && day(d['Stage Changed']) > 14);
  assert.equal(stale.length, 5);
  for (const a of rows('Activities')) { assert.ok(day(a.When) >= 0 && day(a.When) <= 180); }
  const tasks = rows('Activities').filter((a) => a.Type === 'Task');
  assert.ok(tasks.filter((a) => a.Done === 'No' && day(a.Due) <= 0 && day(a.Due) >= -7).length >= 5, 'tasks due in the next 7 days');
  assert.ok(tasks.filter((a) => a.Done === 'No' && day(a.Due) > 0).length >= 5, 'overdue tasks');
  // A different "today" moves the dates and nothing else about the shape.
  const later = showcaseSample(new Date('2027-03-15T08:00:00Z'));
  assert.notEqual(JSON.stringify(later), JSON.stringify(sample));
  assert.ok(later.find((g) => g.table === 'Deals')!.rows.every((d) => String(d.Opened) > '2026-03-14'));
});

test('contact details are invented: .example emails, 555-01xx phones, no @ elsewhere', () => {
  for (const g of sample) for (const r of g.rows) for (const [k, v] of Object.entries(r)) {
    if (/email/i.test(k) && k !== 'Email Log') { assert.match(String(v), /^[^@\s]+@[^@\s]+\.example$/, `${g.table}.${k}`); continue; }
    if (k === 'Phone') assert.match(String(v), /^555-01\d\d$/);
    if (k === 'Website') assert.match(String(v), /^[a-z0-9-]+\.example$/);
    assert.ok(!String(v).includes('@'), `${g.table}.${k} holds an @`);
  }
});

test('every key points at a parent that exists', () => {
  const n = (t: string) => rows(t).length;
  const check = (table: string, field: string, parent: string) => {
    for (const r of rows(table)) {
      if (r[field] === undefined) continue;
      const id = Number(r[field]);
      assert.ok(Number.isInteger(id) && id >= 1 && id <= n(parent), `${table}.${field}=${r[field]}`);
    }
  };
  check('Accounts', 'Owner ID', 'Reps'); check('Contacts', 'Account ID', 'Accounts');
  check('Deals', 'Account ID', 'Accounts'); check('Deals', 'Owner ID', 'Reps');
  check('Activities', 'Account ID', 'Accounts'); check('Activities', 'Contact ID', 'Contacts'); check('Activities', 'Deal ID', 'Deals'); check('Activities', 'Rep ID', 'Reps');
  check('Email Log', 'Account ID', 'Accounts'); check('Email Log', 'Contact ID', 'Contacts');
  check('Deal Lines', 'Deal ID', 'Deals'); check('Deal Lines', 'Product ID', 'Products');
  // A contact belongs to the account its activities and emails name.
  for (const a of rows('Activities')) assert.equal(rows('Contacts')[Number(a['Contact ID']) - 1]['Account ID'], a['Account ID']);
  for (const e of rows('Email Log')) assert.equal(rows('Contacts')[Number(e['Contact ID']) - 1]['Account ID'], e['Account ID']);
  // Every account has a contact.
  assert.equal(new Set(rows('Contacts').map((c) => c['Account ID'])).size, 40);
});

test('deal lines roughly add up to the deal amount', () => {
  const totals = new Map<number, number>();
  for (const l of rows('Deal Lines')) totals.set(Number(l['Deal ID']), (totals.get(Number(l['Deal ID'])) ?? 0) + Number(l.Quantity) * Number(l['Unit Price']) * (1 - Number(l['Discount Percent']) / 100));
  assert.equal(totals.size, 70);
  let near = 0;
  rows('Deals').forEach((d, i) => { const r = (totals.get(i + 1) ?? 0) / Number(d.Amount); if (r > 0.7 && r < 1.3) near++; });
  assert.ok(near >= 56, `${near} of 70 deals within 30% of their lines`);
});

test('there is deliberate mess: near-duplicate accounts and off-list values', () => {
  const norm = (s: string) => s.toLowerCase().replace(/company/g, 'co').replace(/[^a-z0-9]/g, '');
  const groups = new Map<string, number>();
  for (const a of rows('Accounts')) groups.set(norm(String(a.Name)), (groups.get(norm(String(a.Name))) ?? 0) + 1);
  assert.ok([...groups.values()].filter((c) => c > 1).length >= 3, 'near-duplicate pairs');
  assert.equal(new Set(rows('Accounts').map((a) => a.Name)).size, 40, 'exact names stay distinct');
  const L = SHOWCASE_LISTS;
  const off = (table: string, field: string, list: readonly string[]) => rows(table).filter((r) => r[field] !== undefined && !list.includes(String(r[field]))).length;
  const total = off('Deals', 'Stage', L.stage) + off('Deals', 'Source', L.source) + off('Deals', 'Lost Reason', L.lostReason) + off('Accounts', 'Industry', L.industry)
    + off('Accounts', 'Region', L.region) + off('Activities', 'Type', L.activityType);
  assert.ok(total >= 6, `${total} off-list values`);
  assert.ok(sample.every((g) => g.rows.every((r) => Object.values(r).every((v) => !/delete me|typo|duplicate/i.test(String(v))))), 'no row labels its own mess');
});

test('no word list carries a banned name', async () => {
  const { readFileSync } = await import('node:fs');
  const { bannedLines } = await import('../../../scripts/banned-names.ts');
  assert.deepEqual(bannedLines(readFileSync(join(import.meta.dirname, '..', 'src', 'showcase-data.ts'), 'utf8')), []);
});

test('the sample loads into a throwaway store in under 5 seconds', () => {
  const serial: FieldSpec = { name: 'ID', type: 'number', options: { autoEnter: { serial: { next: '1', increment: 1 } }, validation: { notEmpty: true, unique: true } } };
  const t = (name: string): FieldSpec => ({ name, type: 'text' });
  const n = (name: string): FieldSpec => ({ name, type: 'number' });
  const d = (name: string): FieldSpec => ({ name, type: 'date' });
  const ts = (name: string): FieldSpec => ({ name, type: 'timestamp' });
  const tables: Record<string, FieldSpec[]> = {
    Reps: [t('Name'), t('Email'), t('Region'), n('Quarterly Quota'), t('Login')],
    Accounts: [t('Name'), t('Industry'), t('Region'), n('Employees'), t('Website'), n('Owner ID'), t('Notes')],
    Contacts: [n('Account ID'), t('Name'), t('Role'), t('Email'), t('Phone')],
    Products: [t('SKU'), t('Name'), n('Unit Price'), t('Active')],
    Deals: [n('Account ID'), n('Owner ID'), t('Title'), t('Stage'), n('Amount'), t('Source'), { name: 'Opened', type: 'date', options: { autoEnter: { value: 'creationDate' } } }, d('Expected Close'), d('Closed'), t('Lost Reason'), ts('Stage Changed')],
    'Deal Lines': [n('Deal ID'), n('Product ID'), n('Quantity'), n('Unit Price'), n('Discount Percent')],
    Activities: [n('Account ID'), n('Contact ID'), n('Deal ID'), n('Rep ID'), t('Type'), t('Subject'), ts('When'), d('Due'), t('Done'), t('Outcome')],
    'Email Log': [n('Account ID'), n('Contact ID'), t('Direction'), t('Subject'), t('Body'), ts('Sent')],
  };
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-showcase-data-'));
  const file = join(dir, 'Showcase.openhbam.sqlite');
  createStore(file);
  const s = new Store(file, 'Showcase');
  try {
    s.applyDesign(Object.entries(tables).map(([name, fields]) => ({ op: 'createTable', name, fields: [serial, ...fields] })) as never, { account: 'test' });
    const started = Date.now();
    for (const g of sample) for (const r of g.rows) s.create(g.table, r, { account: 'test', dateOrder: 'ISO' });
    assert.ok(Date.now() - started < 5000, `took ${Date.now() - started} ms`);
    assert.equal(s.countIds('Deals'), 70);
    assert.equal(s.countIds('Activities'), 350);
    // The supplied Opened wins over the auto-entered creation date (read back in the Data API's MM/DD/YYYY form).
    const [mm, dd, yyyy] = String(s.get('Deals', 1).fieldData.Opened).split('/');
    assert.equal(`${yyyy}-${mm}-${dd}`, rows('Deals')[0].Opened);
  } finally {
    s.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the crm-showcase starter loads the sample and keeps every row', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-showcase-wired-'));
  const file = join(dir, 'Showcase.openhbam.sqlite');
  createStore(file);
  const s = new Store(file, 'Showcase');
  try {
    const started = Date.now();
    const result = applyStarter(s, 'crm-showcase');
    assert.ok(Date.now() - started < 5000);
    assert.equal(result.sampleRecords, sample.reduce((n, g) => n + g.rows.length, 0));
    assert.equal(s.countIds('Accounts'), 40);
    assert.equal(s.countIds('Deals'), 70);
    assert.equal(s.countIds('Deal Lines'), 150);
  } finally {
    s.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
