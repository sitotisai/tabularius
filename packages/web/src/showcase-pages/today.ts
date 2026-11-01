import { js } from '../page-templates.ts';
import { pageShell, withNames, type ShowcaseNames } from './shared.ts';

/** The eight prompts the "Try asking Claude" card lists, as plain text. */
export const TRY_PROMPTS = [
  'Which open deals have had no activity for two weeks, and who owns them?',
  'Summarize everything we know about <an account>',
  'Draft a follow-up email for the Negotiation deals closing this month',
  'Which accounts are marked At risk, and what happened in the last month?',
  'What is my forecast for this quarter, and which deals could slip?',
  'List the tasks I have overdue, oldest first',
  'Which lead sources win the most deals, by count and by amount?',
  'Find accounts that look like duplicates and say how you would merge them',
];

/** Today: a greeting, my tasks and deals, the quota ring, the last activities and prompts to try. */
export function todayPage(names?: Partial<ShowcaseNames>): string {
  const N = withNames(names);
  const body = `
<header><h1 id="hi">Today</h1><span class="muted" id="where"></span></header>
<section class="grid">
  <div class="card"><h2>My open tasks, next 7 days</h2><div id="tasks" class="muted">Loading…</div></div>
  <div class="card"><h2>My deals closing within 30 days</h2><div id="deals" class="muted">Loading…</div></div>
  <div class="card"><h2>Quota this quarter</h2><div id="quota" class="muted">Loading…</div></div>
  <div class="card"><h2>Last 10 activities</h2><div id="recent" class="muted">Loading…</div></div>
  <div class="card"><h2>Try asking Claude</h2><p class="muted">Connect an AI app (see Connect), then paste one of these.</p><ul class="rows" id="prompts"></ul></div>
</section>`;
  const script = `
  const N = ${js(N)};
  const PROMPTS = ${js(TRY_PROMPTS)};
  let me = null, account = '';
  // A rep's own records are picked by name (the page data contract has Rep Name and Owner Name, not the ids); with no rep record (a manager) every record the account may see shows.
  const mineAct = () => (me ? { 'Rep Name': '==' + field(me, 'Name') } : {});
  const mineDeal = () => (me ? { 'Owner Name': '==' + field(me, 'Name') } : {});
  // goToLayout takes the window to the layout; the record itself is selected by the file's own script (unverified: a file without it stays on the layout).
  async function open(layout, id) {
    await tabularius.goToLayout(layout);
    try { await tabularius.performScript(N.goToRecord, String(id)); } catch (e) { /* the layout is open; the script is optional */ }
  }
  function list(el, rows, empty) {
    if (!rows.length) { el.replaceChildren(h('span', { class: 'muted' }, empty)); return; }
    el.replaceChildren(h('ul', { class: 'rows' }, rows));
  }
  async function tasks() {
    const t = new Date(), r = await tabularius.find(N.activities, [Object.assign({ Type: '==Task', Due: iso(t) + '...' + iso(addDays(t, 7)) }, mineAct())], { limit: 100, sort: [{ fieldName: 'Due', sortOrder: 'ascend' }] });
    const open_ = r.data.filter((x) => field(x, 'Done') !== 'Yes');
    list($('tasks'), open_.slice(0, 10).map((x) => {
      const done = h('button', { type: 'button' }, 'Mark done');
      done.addEventListener('click', async () => {
        done.disabled = true;
        try { await tabularius.performScript(N.markDone, String(x.recordId)); await tasks(); } catch (e) { done.disabled = false; done.textContent = msg(e); }
      });
      const go = h('button', { type: 'button', class: 'link' }, field(x, 'Subject') || 'Task', ' ', h('span', { class: 'muted' }, 'due ' + field(x, 'Due')));
      go.addEventListener('click', () => open(N.activities, x.recordId).catch((e) => fail($('tasks'), e)));
      return h('li', {}, go, done);
    }), 'No open tasks due in the next 7 days.');
  }
  async function deals() {
    const t = new Date(), range = iso(t) + '...' + iso(addDays(t, 30));
    const open_ = ['Lead', 'Qualified', 'Proposal', 'Negotiation'];
    const r = await tabularius.find(N.deals, open_.map((s) => Object.assign({ Stage: '==' + s, 'Expected Close': range }, mineDeal())), { limit: 10, sort: [{ fieldName: 'Expected Close', sortOrder: 'ascend' }] });
    list($('deals'), r.data.map((x) => {
      const go = h('button', { type: 'button', class: 'link' }, field(x, 'Title'), ' ', h('span', { class: 'muted' }, field(x, 'Account Name')));
      go.addEventListener('click', () => open(N.deal, x.recordId).catch((e) => fail($('deals'), e)));
      return h('li', {}, go, h('span', {}, money(field(x, 'Amount')), ' ', h('span', { class: 'pill' }, field(x, 'Stage')), ' ', h('span', { class: 'muted' }, field(x, 'Expected Close'))));
    }), 'No open deals expected to close in the next 30 days.');
  }
  async function quota() {
    const won = await tabularius.summarize({ title: 'Won this quarter', kind: 'number', layout: N.deals, query: [Object.assign({ Stage: '==Won', Closed: 'this quarter' }, mineDeal())], measure: { field: 'Amount', fn: 'sum' } });
    const amount = Number(won.value) || 0, target = me ? Number(field(me, 'Quarterly Quota')) || 0 : 0;
    if (!target) { $('quota').replaceChildren(h('b', {}, money(amount)), h('div', { class: 'muted' }, 'won this quarter; no quarterly quota is set for this account')); return; }
    const share = Math.min(amount / target, 1), R = 46, C = 2 * Math.PI * R;
    $('quota').replaceChildren(h('div', { style: 'display:flex;gap:16px;align-items:center' },
      sv('svg', { viewBox: '0 0 120 120', width: '120', height: '120', role: 'img', 'aria-label': pct(amount / target) + ' of quota' },
        sv('circle', { cx: '60', cy: '60', r: String(R), fill: 'none', 'stroke-width': '12', style: 'stroke:var(--track)' }),
        sv('circle', { cx: '60', cy: '60', r: String(R), fill: 'none', 'stroke-width': '12', 'stroke-linecap': 'round', transform: 'rotate(-90 60 60)', 'stroke-dasharray': String(C), 'stroke-dashoffset': String(C * (1 - share)), style: 'stroke:var(--accent)' }),
        sv('text', { x: '60', y: '66', 'text-anchor': 'middle', style: 'fill:var(--text);font-size:20px;font-weight:600' }, pct(amount / target))),
      h('div', {}, h('b', {}, money(amount)), h('div', { class: 'muted' }, 'of ' + money(target) + ' quarterly quota'))));
  }
  async function recent() {
    const r = await tabularius.find(N.activities, [mineAct()], { limit: 10, sort: [{ fieldName: 'When', sortOrder: 'descend' }] });
    list($('recent'), r.data.map((x) => h('li', {}, h('span', {}, h('span', { class: 'pill' }, field(x, 'Type')), ' ', field(x, 'Subject')), h('span', { class: 'muted' }, field(x, 'When')))), 'No activities yet.');
  }
  function prompts() {
    $('prompts').replaceChildren(...PROMPTS.map((p) => h('li', {}, h('span', {}, p), copyButton(p))));
  }
  async function show() {
    const c = await tabularius.context();
    account = c.account || '';
    $('hi').textContent = account ? 'Hello, ' + account : 'Today';
    $('where').textContent = 'Live as ' + (account || 'the signed-in account');
    me = await myRep(N.reps, account);
    for (const [id, fn] of [['tasks', tasks], ['deals', deals], ['quota', quota], ['recent', recent]]) fn().catch((e) => fail($(id), e));
  }
  prompts();
  if (!needsTabularius('Today shows your tasks, deals, quota and latest activities.')) {
    show().catch((e) => ($('where').textContent = msg(e)));
    tabularius.on('refresh', () => show().catch(() => {}));
  }`;
  return pageShell('Today', body, script);
}
