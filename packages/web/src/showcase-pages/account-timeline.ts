import { js } from '../page-templates.ts';
import { pageShell, withNames, type ShowcaseNames } from './shared.ts';

/** Account timeline: one account's activities and emails merged by time, grouped by day, each item expandable. */
export function accountTimelinePage(names?: Partial<ShowcaseNames>): string {
  const N = withNames(names);
  const body = `
<header><h1 id="title">Account timeline</h1><span class="muted" id="where"></span></header>
<section style="padding:16px 28px 28px" id="line"><p class="muted">Loading…</p></section>
<style>
  .day { margin: 18px 0 6px; font-weight: 600; color: var(--muted); }
  details.item { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 8px 12px; margin-bottom: 8px; }
  details.item summary { display: flex; gap: 10px; align-items: center; cursor: pointer; }
  details.item summary:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  details.item .more { margin: 8px 0 4px 34px; white-space: pre-wrap; }
  .ico { color: var(--accent); flex: none; }
</style>`;
  const script = `
  const N = ${js(N)};
  // Icons are drawn here, one path set per kind, in the current text colour.
  const ICONS = {
    Call: 'M6 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z',
    Meeting: 'M4 6h16v13H4zM4 10h16M8 3v4M16 3v4',
    Email: 'M3 6h18v12H3zM3 7l9 7 9-7',
    Note: 'M5 3h10l4 4v14H5zM8 12h8M8 16h8',
    Task: 'M4 12l5 5L20 6',
  };
  const icon = (kind) => sv('svg', { class: 'ico', viewBox: '0 0 24 24', width: '22', height: '22', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' }, sv('path', { d: ICONS[kind] || ICONS.Note }));
  const dayLabel = (d) => d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  function item(it) {
    const time = it.at ? it.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    return h('details', { class: 'item' }, h('summary', {}, icon(it.kind), h('span', {}, it.title), h('span', { class: 'pill' }, it.tag), h('span', { class: 'muted', style: 'margin-left:auto' }, time)),
      h('div', { class: 'more' }, it.body || 'Nothing more was recorded.'));
  }
  function draw(items) {
    if (!items.length) { $('line').replaceChildren(h('p', { class: 'muted' }, 'No activities or emails for this account yet.')); return; }
    items.sort((a, b) => (b.at ? b.at.getTime() : 0) - (a.at ? a.at.getTime() : 0));
    const out = []; let last = '';
    for (const it of items) {
      const key = it.at ? iso(it.at) : 'undated';
      if (key !== last) { last = key; out.push(h('div', { class: 'day' }, it.at ? dayLabel(it.at) : 'No date')); }
      out.push(item(it));
    }
    $('line').replaceChildren(...out);
  }
  async function show() {
    const c = await tabularius.context();
    const f = c.fieldData || {};
    // On the Account 360 layout the current record is the account; on any other layout the record's own Account ID and Account Name say which account it is about.
    const onAccount = c.layout === N.accounts || c.layout === N.account360;
    const id = onAccount ? f.ID : f['Account ID'], name = onAccount ? f.Name : f['Account Name'];
    // The id is exact; the name is all the page data contract guarantees on every list, so two accounts of one name (duplicates) share a timeline then.
    const q = id ? [{ 'Account ID': '==' + id }] : name ? [{ 'Account Name': '==' + name }] : null;
    if (!q) { $('line').replaceChildren(h('p', { class: 'muted' }, 'Open an account to see its timeline.')); $('title').textContent = 'Account timeline'; return; }
    $('title').textContent = (name || 'Account') + ' timeline';
    $('where').textContent = 'Live as ' + (c.account || 'the signed-in account');
    const [acts, mails] = await Promise.all([
      tabularius.find(N.activities, q, { limit: 500, sort: [{ fieldName: 'When', sortOrder: 'descend' }] }).then((r) => r.data, () => null),
      tabularius.find(N.emailLog, q, { limit: 500, sort: [{ fieldName: 'Sent', sortOrder: 'descend' }] }).then((r) => r.data, () => null),
    ]);
    if (acts === null && mails === null) { $('line').replaceChildren(h('span', { class: 'err' }, 'This account may not read activities or emails.')); return; }
    draw([
      ...(acts || []).map((r) => ({ kind: field(r, 'Type'), tag: field(r, 'Type') || 'Activity', title: field(r, 'Subject') || '(no subject)', at: parseWhen(field(r, 'When')) || parseWhen(field(r, 'Due')), body: [field(r, 'Outcome'), field(r, 'Notes')].filter(Boolean).join('\\n\\n') })),
      ...(mails || []).map((r) => ({ kind: 'Email', tag: field(r, 'Direction') || 'Email', title: field(r, 'Subject') || '(no subject)', at: parseWhen(field(r, 'Sent')), body: field(r, 'Body') })),
    ]);
  }
  if (!needsTabularius('The account timeline shows an account\\'s activities and emails by day.')) {
    show().catch((e) => fail($('line'), e));
    tabularius.on('refresh', () => show().catch((e) => fail($('line'), e)));
  }`;
  return pageShell('Account timeline', body, script);
}
