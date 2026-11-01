// Server-owned pieces of the CRM showcase. The store starter remains plain design data.
import type { Store } from '../../store/src/index.ts';
import { modernizeChange } from './modernize.ts';
import { cleanWidget, Dashboards } from './dashboards.ts';
import { listAutomations, saveAutomation } from './automations.ts';

export interface ShowcaseExtrasResult { skipped: { piece: string; reason: string }[] }

/** The starter's extras key is resolved here, outside the store package. */
export function applyStarterExtras(store: Store, extras: string, opts: { account: string; now?: Date }): ShowcaseExtrasResult {
  if (extras === 'crm-showcase') return applyShowcaseExtras(store, opts);
  throw new Error(`No showcase extras called "${extras}"`);
}

export function applyShowcaseExtras(store: Store, opts: { account: string; now?: Date }): ShowcaseExtrasResult {
  const skipped: ShowcaseExtrasResult['skipped'] = [];
  const table = (name: string, fields: string[]) => {
    const found = store.schema.tables.find((t) => t.name === name);
    if (!found) return `The ${name} table is missing`;
    const missing = fields.filter((name) => !found.fields.some((f) => f.name === name));
    return missing.length ? `${name} is missing ${missing.join(', ')}` : undefined;
  };
  const modern = (name: string, style: 'modern-board' | 'modern-calendar', fields: string[]) => {
    const reason = table(name, fields);
    if (reason) { skipped.push({ piece: `${name} ${style}`, reason }); return; }
    const result = modernizeChange(store, { tables: [name], styles: [style] });
    if (result.changes.length) store.applyDesign(result.changes, { account: opts.account });
    for (const item of result.skipped) skipped.push({ piece: `${name} ${style}`, reason: item.why });
  };
  // The modern board reads field validation, while the native form reads its popup.
  if (!table('Deals', ['Stage']) && store.schema.valueLists.some((v) => v.name === 'Stage')) {
    const stage = store.schema.tables.find((t) => t.name === 'Deals')!.fields.find((f) => f.name === 'Stage')!;
    const stageListId = store.schema.valueLists.find((v) => v.name === 'Stage')!.id;
    if (stage.options?.validation?.valueList !== stageListId) {
      store.applyDesign([{ op: 'updateField', table: 'Deals', field: 'Stage', options: { validation: { valueList: stageListId } } }], { account: opts.account });
    }
  }
  modern('Deals', 'modern-board', ['Stage']);
  modern('Activities', 'modern-calendar', ['When']);

  const dashboardReason = table('Deals', ['Stage', 'Source', 'Amount', 'Weighted Amount']);
  if (dashboardReason) skipped.push({ piece: 'Pipeline overview', reason: dashboardReason });
  else if (!store.schema.layouts.some((l) => l.name === 'Deals list')) skipped.push({ piece: 'Pipeline overview', reason: 'Deals list layout is missing' });
  else {
    const dashboards = new Dashboards(store);
    if (!dashboards.find('Pipeline overview')) dashboards.create({
      name: 'Pipeline overview', widgets: [
        cleanWidget({ title: 'Open weighted amount', kind: 'number', layout: 'Deals list', measure: { field: 'Weighted Amount', fn: 'sum' } }),
        cleanWidget({ title: 'Amount by Stage', kind: 'chart', chart: 'column', layout: 'Deals list', groupBy: ['Stage'], measure: { field: 'Amount', fn: 'sum' } }),
        cleanWidget({ title: 'Amount by Source', kind: 'chart', chart: 'pie', layout: 'Deals list', groupBy: ['Source'], measure: { field: 'Amount', fn: 'sum' } }),
      ],
    }, opts.account);
  }

  const automationReason = table('Deals', ['Stage', 'ID']) ?? table('Activities', ['Deal ID', 'Subject', 'Type', 'Due']);
  if (automationReason) skipped.push({ piece: 'When a deal is won, add an onboarding task', reason: automationReason });
  else if (!store.schema.scripts.some((s) => s.name === 'Add onboarding task')) skipped.push({ piece: 'When a deal is won, add an onboarding task', reason: 'Add onboarding task script is missing' });
  else if (!store.schema.layouts.some((l) => l.name === 'Deals')) skipped.push({ piece: 'When a deal is won, add an onboarding task', reason: 'Deals layout is missing' });
  else {
    try { store.requireActiveAccount(opts.account); }
    catch { skipped.push({ piece: 'When a deal is won, add an onboarding task', reason: `The execution account ${opts.account} is missing or inactive` }); return { skipped }; }
    if (!listAutomations(store).some((a) => a.name === 'When a deal is won, add an onboarding task')) {
      saveAutomation(store, {
        name: 'When a deal is won, add an onboarding task', layout: 'Deals', on: 'update', fields: ['Stage'],
        condition: 'Stage = "Won"', script: 'Add onboarding task', account: opts.account,
      }, opts.account, []);
    }
  }
  return { skipped };
}
