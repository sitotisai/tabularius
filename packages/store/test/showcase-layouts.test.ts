import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { applyStarter, createStore, Store, lintLayout } from '../src/index.ts';
import { checkStoreFormula } from '../src/check.ts';
import { checkSolution } from '../../server/src/check-solution.ts';

const contracts: Record<string, string[]> = {
  'Deals list': ['ID', 'Account ID', 'Title', 'Account Name', 'Owner Name', 'Stage', 'Amount', 'Weighted Amount', 'Probability', 'Source', 'Opened', 'Expected Close', 'Closed', 'Lost Reason', 'Days In Stage', 'Stale', 'Stage Changed'],
  'Accounts list': ['ID', 'Name', 'Industry', 'Region', 'Owner Name', 'Health', 'Open Pipeline', 'Won Total', 'Last Touch', 'Days Quiet', 'Contacts Count'],
  'Activities list': ['ID', 'Type', 'Subject', 'When', 'Due', 'Done', 'Outcome', 'Account Name', 'Contact Name', 'Deal Title', 'Rep Name', 'Account ID', 'Deal ID'],
  'Contacts list': ['ID', 'Name', 'Role', 'Email', 'Phone', 'Account Name'],
  'Email Log list': ['Direction', 'Subject', 'Body', 'Sent', 'Account Name', 'Contact Name', 'Account ID'],
  'Reps list': ['Name', 'Region', 'Quarterly Quota', 'Login'],
};

function showcase(fn: (store: Store) => void) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-showcase-layouts-'));
  createStore(join(dir, 'Showcase.openhbam.sqlite'));
  const store = new Store(join(dir, 'Showcase.openhbam.sqlite'), 'Showcase');
  try { applyStarter(store, 'crm-showcase', { sample: false }); fn(store); }
  finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
}

test('showcase layout contracts and every layout reference resolve', () => showcase((store) => {
  const schema = store.schema;
  const layouts = store.designs().layouts;
  for (const [name, fields] of Object.entries(contracts)) {
    const layout = layouts.find((l) => l.name === name);
    assert.ok(layout, `missing layout ${name}`);
    const present = new Set(layout.objects.flatMap((o) => [o.field?.field, ...(o.children ?? []).map((c) => c.field?.field)].filter((x): x is string => !!x)));
    for (const field of fields) assert.ok(present.has(field), `${name} is missing ${field}`);
  }
  for (const layout of layouts) {
    const visit = (objects: typeof layout.objects) => {
      for (const o of objects) {
        if (o.kind === 'field') {
          const to = schema.tableOccurrences.find((t) => t.id === o.field?.tableOccurrenceId);
          assert.ok(to, `${layout.name}: missing occurrence for ${o.field?.field}`);
          assert.ok(schema.tables.find((t) => t.id === to!.baseTableId)?.fields.some((f) => f.id === o.field?.fieldId), `${layout.name}: missing field ${o.field?.field}`);
        }
        if (o.kind === 'portal') assert.ok(schema.tableOccurrences.some((t) => t.id === o.portal?.tableOccurrenceId), `${layout.name}: missing portal occurrence ${o.name}`);
        if (o.kind === 'button') assert.ok(schema.scripts.some((s) => s.id === o.action?.scriptId && s.name === o.action?.script), `${layout.name}: missing script for ${o.text}`);
        for (const condition of o.conditions ?? []) {
          const checked = checkStoreFormula(store, condition.formula, { occurrence: layout.tableOccurrenceId });
          assert.ok(checked.ok, `${layout.name}: bad condition ${condition.formula}: ${checked.ok ? '' : checked.message}`);
        }
        if (o.children) visit(o.children);
      }
    };
    visit(layout.objects);
  }
  const account360 = layouts.find((l) => l.name === 'Account 360')!;
  assert.ok(account360.objects.some((o) => o.kind === 'tab-control' && o.children?.filter((p) => p.kind === 'tab-panel').map((p) => p.text).join('|') === 'Overview|People|Deals|Activity|Emails'));
  const health = account360.objects.find((o) => o.kind === 'field' && o.field?.field === 'Health')!;
  assert.deepEqual(health.conditions?.map((c) => c.formula), ['Health = "At risk"', 'Health = "Watch"', 'Health = "Healthy"']);
  const lostReason = layouts.find((l) => l.name === 'Deals')!.objects.find((o) => o.kind === 'field' && o.field?.field === 'Lost Reason')!;
  assert.equal(lostReason.hide?.formula, 'Stage ≠ "Lost"');
  const accountTabs = account360.objects.find((o) => o.kind === 'tab-control')!.children!;
  const activityPanel = accountTabs.find((p) => p.text === 'Activity')!;
  assert.deepEqual(activityPanel.children?.find((o) => o.kind === 'portal')?.portal?.sort?.map((s) => [s.field.field, s.descending]), [['When', true]]);
  const dealLayout = layouts.find((l) => l.name === 'Deals')!;
  const linePortal = dealLayout.objects.find((o) => o.kind === 'portal' && o.name === 'Deal Lines')!;
  const quoteTotal = dealLayout.objects.find((o) => o.kind === 'field' && o.field?.field === 'Quote Total')!;
  assert.ok(quoteTotal.bounds.top > linePortal.bounds.bottom, 'Quote Total follows the Deal Lines portal');
  const problems = checkSolution(store).findings.filter((f) => f.severity === 'error');
  assert.deepEqual(problems, []);
  const lint = layouts.flatMap((layout) => lintLayout(layout, schema));
  assert.equal(lint.filter((x) => x.severity === 'error' || x.severity === 'warning').length, 0, lint.filter((x) => x.severity === 'error' || x.severity === 'warning').map((x) => x.message).join('\n'));
}));
