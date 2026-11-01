// Server-owned pieces of the CRM showcase. The store starter remains plain design data.
import type { DesignOp, Store } from '../../store/src/index.ts';
import { modernizeChange, modernDesign, SHOWCASE_PAGES } from './modernize.ts';
import { cleanWidget, Dashboards } from './dashboards.ts';
import { listAutomations, saveAutomation } from './automations.ts';

/** The folder of the Layouts list that holds the showcase's HTML pages. */
export const HOME_FOLDER = 'Home';

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

  addShowcasePages(store, opts.account, skipped);

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

type Entry = { id: number; name: string; kind: 'item' | 'folder' | 'separator'; depth: number; hidden?: boolean };
type Spec = { item: number } | { folder: string; id: number; children: Spec[] } | { separator: true; id: number };

/** The Layouts list (a flat list with depths) as the tree setOrder takes, so a change to it can keep everything already there. */
function orderTree(entries: Entry[]): Spec[] {
  const root: Spec[] = [];
  const stack: Spec[][] = [root];
  for (const e of entries) {
    const into = stack[Math.min(e.depth, stack.length - 1)];
    stack.length = Math.min(e.depth, stack.length - 1) + 1;
    if (e.kind === 'folder') { const children: Spec[] = []; into.push({ folder: e.name, id: e.id, children }); stack.push(children); }
    else into.push(e.kind === 'separator' ? { separator: true, id: e.id } : { item: e.id });
  }
  return root;
}

/**
 * Makes a modern layout for each HTML page of the showcase (Today, Sales dashboard, Account timeline, Connect) and files
 * them in the Home folder, first in the Layouts list. The pages read the showcase's list layouts when they are opened,
 * so they are made whether or not those layouts exist yet; a page already there is left alone.
 */
function addShowcasePages(store: Store, account: string, skipped: ShowcaseExtrasResult['skipped']): void {
  const accounts = store.schema.tables.find((t) => t.name === 'Accounts');
  const occurrence = accounts && store.schema.tableOccurrences.find((o) => o.baseTableId === accounts.id);
  if (!occurrence) { skipped.push({ piece: 'HTML pages', reason: 'The Accounts table is missing' }); return; }
  const have = new Set(store.schema.layouts.map((l) => l.name.toLowerCase()));
  const made = SHOWCASE_PAGES.filter((page) => !have.has(page.name.toLowerCase()));
  if (made.length) {
    store.applyDesign(made.map((page) => ({ op: 'createLayout', name: page.name, occurrence: occurrence.id, design: modernDesign(page.name, page.name, page.html()) }) as DesignOp), { account });
  }
  const names = new Set(SHOWCASE_PAGES.map((p) => p.name));
  const pages = store.schema.layouts.filter((l) => names.has(l.name));
  const tree = orderTree(store.schema.layoutOrder as Entry[]).filter((e) => !('item' in e && pages.some((l) => l.id === e.item)));
  const home = tree.find((e): e is { folder: string; id: number; children: Spec[] } => 'folder' in e && e.folder === HOME_FOLDER);
  const placed: Spec[] = SHOWCASE_PAGES.flatMap((page) => { const l = pages.find((x) => x.name === page.name); return l ? [{ item: l.id }] : []; });
  const keep = (list: Spec[]): Spec[] => list.map((e) => ('folder' in e ? { ...e, children: keep(e.children) } : e));
  const rest = home ? tree.filter((e) => e !== home) : tree;
  const homeKept = home ? keep(home.children).filter((e) => !('item' in e && pages.some((l) => l.id === e.item))) : [];
  // A list with no stored order starts from every layout, in the order the file has them.
  const stored = store.schema.layoutOrder.length ? rest : store.schema.layouts.filter((l) => !names.has(l.name)).map((l) => ({ item: l.id }) as Spec);
  store.applyDesign([{ op: 'setOrder', list: 'layouts', order: [{ folder: HOME_FOLDER, ...(home ? { id: home.id } : {}), children: [...placed, ...homeKept] }, ...keep(stored)] } as DesignOp], { account });
}
