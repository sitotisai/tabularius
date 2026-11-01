import { js } from '../page-templates.ts';
import { pageShell, withNames, type ShowcaseNames } from './shared.ts';

/** Sales dashboard: tiles, revenue by month, a funnel, win rate by source and a leaderboard, all read as the signed-in account. */
export function salesDashboardPage(names?: Partial<ShowcaseNames>): string {
  const N = withNames(names);
  const body = `
<header><h1>Sales dashboard</h1>
  <label class="muted">Period <select id="period">
    <option value="this quarter">This quarter</option><option value="this month">This month</option><option value="last 30 days">Last 30 days</option>
    <option value="year to date">Year to date</option><option value="">All time</option></select></label></header>
<p class="muted" style="padding:0 28px;margin:4px 0 0" id="where">Won, win rate and the leaderboard follow the period; the pipeline tiles and the funnel show every open deal.</p>
<section class="tiles">
  <div class="tile"><span class="muted">Open pipeline</span><b id="t-pipe">–</b></div>
  <div class="tile"><span class="muted">Weighted forecast</span><b id="t-fore">–</b></div>
  <div class="tile"><span class="muted">Won</span><b id="t-won">–</b></div>
  <div class="tile"><span class="muted">Win rate</span><b id="t-rate">–</b></div>
  <div class="tile"><span class="muted">Average deal size</span><b id="t-avg">–</b></div>
</section>
<section class="grid">
  <div class="card"><h2>Revenue by month (Won, last 12 months)</h2><div id="months" class="muted">Loading…</div></div>
  <div class="card"><h2>Pipeline funnel</h2><div id="funnel" class="muted">Loading…</div></div>
  <div class="card"><h2>Win rate by source</h2><div id="sources" class="muted">Loading…</div></div>
  <div class="card"><h2>Rep leaderboard</h2><div id="reps" class="muted">Loading…</div></div>
</section>`;
  const script = `
  const N = ${js(N)};
  const OPEN = ['Lead', 'Qualified', 'Proposal', 'Negotiation'];
  const openQuery = () => OPEN.map((s) => ({ Stage: '==' + s }));
  const ask = (w) => tabularius.summarize(Object.assign({ title: 'figure', layout: N.deals }, w));
  const total = (q) => ask({ kind: 'number', query: q, measure: { field: 'Amount', fn: 'sum' } }).then((r) => Number(r.value) || 0);
  const count = (q) => ask({ kind: 'number', query: q }).then((r) => Number(r.value) || 0);
  const when = () => $('period').value;
  const closed = (extra) => [Object.assign({ Closed: when() || '*' }, extra)];
  function tile(id, p) { p.then((v) => ($(id).textContent = v), (e) => fail($(id), e)); }
  // Horizontal bars: one row per category, the bar as wide as its share of the largest value.
  function barsOf(el, cats, vals, label) {
    if (!cats.length) { el.replaceChildren(h('span', { class: 'muted' }, 'No records yet.')); return; }
    const W = 520, row = 26, top = Math.max(...vals, 1);
    el.replaceChildren(sv('svg', { viewBox: '0 0 ' + W + ' ' + cats.length * row, width: '100%', role: 'img', 'aria-label': label },
      cats.map((c, i) => sv('g', {},
        sv('text', { class: 'axis', x: '0', y: String(i * row + 16) }, String(c).slice(0, 18)),
        sv('rect', { class: 'bar', x: '130', y: String(i * row + 4), height: '16', rx: '3', width: String(Math.max(2, (vals[i] / top) * (W - 250))) }),
        sv('text', { class: 'axis', x: String(138 + Math.max(2, (vals[i] / top) * (W - 250))), y: String(i * row + 16) }, label.indexOf('rate') >= 0 ? pct(vals[i]) : money(vals[i]))))));
  }
  function columns(el, cats, vals) {
    if (!cats.length) { el.replaceChildren(h('span', { class: 'muted' }, 'No won deals in the last 12 months.')); return; }
    const W = 560, H = 200, bw = W / cats.length, top = Math.max(...vals, 1);
    el.replaceChildren(sv('svg', { viewBox: '0 0 ' + W + ' ' + (H + 20), width: '100%', role: 'img', 'aria-label': 'Won revenue by month' },
      cats.map((c, i) => { const bh = (vals[i] / top) * (H - 10); return sv('g', {},
        sv('rect', { class: 'bar', x: String(i * bw + bw * .15), y: String(H - bh), width: String(bw * .7), height: String(bh), rx: '3' }, sv('title', {}, c + ': ' + money(vals[i]))),
        sv('text', { class: 'axis', x: String(i * bw + bw / 2), y: String(H + 14), 'text-anchor': 'middle' }, String(c).slice(-5))); })));
  }
  async function tiles() {
    const open_ = openQuery();
    tile('t-pipe', total(open_).then(money));
    tile('t-fore', ask({ kind: 'number', query: open_, measure: { field: 'Weighted Amount', fn: 'sum' } }).then((r) => money(r.value)));
    const won = total(closed({ Stage: '==Won' })), n = count(closed({ Stage: '==Won' })), lost = count(closed({ Stage: '==Lost' }));
    tile('t-won', won.then(money));
    tile('t-rate', Promise.all([n, lost]).then(([w, l]) => pct(w / (w + l))));
    tile('t-avg', Promise.all([won, n]).then(([a, w]) => (w ? money(a / w) : '–')));
  }
  async function months() {
    const c = await ask({ kind: 'chart', chart: 'column', groupBy: ['Closed'], by: 'month', measure: { field: 'Amount', fn: 'sum' }, query: [{ Stage: '==Won', Closed: iso(addDays(new Date(), -365)) + '...' + iso(new Date()) }], limit: 13 });
    columns($('months'), c.categories || [], sum(c));
  }
  async function funnel() {
    const by = (fn) => ask({ kind: 'chart', chart: 'bar', groupBy: ['Stage'], measure: fn, query: openQuery(), limit: 8 });
    const [amt, cnt] = await Promise.all([by({ field: 'Amount', fn: 'sum' }), by({ field: 'Amount', fn: 'count' })]);
    const a = new Map((amt.categories || []).map((c, i) => [c, sum(amt)[i]])), k = new Map((cnt.categories || []).map((c, i) => [c, sum(cnt)[i]]));
    const stages = OPEN.filter((s) => a.has(s) || k.has(s));
    barsOf($('funnel'), stages.map((s) => s + ' (' + (k.get(s) || 0) + ')'), stages.map((s) => a.get(s) || 0), 'Open pipeline amount per stage');
  }
  async function sources() {
    const by = (stage) => ask({ kind: 'chart', chart: 'bar', groupBy: ['Source'], query: closed({ Stage: '==' + stage }), limit: 12 });
    const [w, l] = await Promise.all([by('Won'), by('Lost')]);
    const wv = new Map((w.categories || []).map((c, i) => [c, sum(w)[i]])), lv = new Map((l.categories || []).map((c, i) => [c, sum(l)[i]]));
    const keys = [...new Set([...wv.keys(), ...lv.keys()])].sort();
    barsOf($('sources'), keys, keys.map((s) => (wv.get(s) || 0) / ((wv.get(s) || 0) + (lv.get(s) || 0))), 'Win rate by source');
  }
  async function reps() {
    const c = await ask({ kind: 'chart', chart: 'bar', groupBy: ['Owner Name'], measure: { field: 'Amount', fn: 'sum' }, query: closed({ Stage: '==Won' }), top: { field: 'Owner Name', n: 10 }, limit: 10 });
    const vals = sum(c), order = vals.map((v, i) => i).sort((x, y) => vals[y] - vals[x]);
    barsOf($('reps'), order.map((i) => c.categories[i]), order.map((i) => vals[i]), 'Won amount per rep');
  }
  function show() {
    for (const [id, fn] of [['t-pipe', tiles], ['months', months], ['funnel', funnel], ['sources', sources], ['reps', reps]]) fn().catch((e) => fail($(id), e));
  }
  if (!needsTabularius('The sales dashboard shows pipeline, forecast and wins for the signed-in account.')) {
    $('period').addEventListener('change', show);
    show();
    tabularius.on('refresh', show);
  }`;
  return pageShell('Sales dashboard', body, script);
}
