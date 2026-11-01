// The showcase CRM's pipeline board: deals as cards in a column for each stage, with the money worked out per column,
// a filter by rep, a stale-deal highlight, drag to move (or the menu on each card), and a reason asked for when a deal is
// lost. Plain HTML, CSS and JavaScript for a modern layout (see ../page-source.ts); it reads and writes through
// window.tabularius as the signed-in account, so a rep sees and moves only their own deals and the server says no to the rest.
//
// It reads the layout "Deals list" (the fields below must be on it: the showcase's page data contract) and writes the
// stage, its time stamp, the closing day and the lost reason, then adds a note to the deal's activity. No network, no
// libraries, nothing loaded: it also opens in a web viewer that has none.

/** The layout the board reads, the Activities layout it writes notes to, and the value lists it offers. */
export const BOARD_LAYOUT = 'Deals list';
export const BOARD_ACTIVITY_LAYOUT = 'Activities list';
export const BOARD_FIELDS = ['ID', 'Title', 'Account Name', 'Account ID', 'Owner Name', 'Stage', 'Amount', 'Weighted Amount', 'Probability', 'Expected Close', 'Closed', 'Stale', 'Days In Stage', 'Lost Reason', 'Stage Changed'] as const;

const CSS = String.raw`
  :root { color-scheme: light dark; --bg: #f4f6fa; --panel: #fff; --sunken: #e9edf4; --text: #17202e; --muted: #5d6b82; --line: #d5dce8; --a: #2563eb; --a-soft: #dbe7ff; --warn: #b45309; --warn-soft: #fef3c7; --good: #047857; --bad: #b91c1c; --shadow: 0 1px 2px rgba(15,23,42,.12); }
  @media (prefers-color-scheme: dark) { :root { --bg: #0f172a; --panel: #1e293b; --sunken: #172033; --text: #e2e8f0; --muted: #94a3b8; --line: #334155; --a: #60a5fa; --a-soft: #1e3a6b; --warn: #fbbf24; --warn-soft: #3b2f0a; --good: #34d399; --bad: #f87171; --shadow: none; } }
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px/1.45 system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
  header { padding: 20px 24px 8px; display: grid; gap: 12px; }
  h1 { margin: 0; font-size: 22px; }
  .tiles { display: flex; flex-wrap: wrap; gap: 12px; }
  .tile { background: var(--panel); border-radius: 12px; padding: 10px 16px; box-shadow: var(--shadow); min-width: 150px; }
  .tile span { display: block; color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .05em; }
  .tile b { font-size: 22px; }
  .bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
  .bar label { display: flex; gap: 6px; align-items: center; color: var(--muted); }
  select, input[type=search], button { font: inherit; color: var(--text); background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 6px 10px; min-height: 34px; }
  button { cursor: pointer; } button:focus-visible, select:focus-visible, input:focus-visible, .card:focus-visible { outline: 2px solid var(--a); outline-offset: 2px; }
  #msg { min-height: 20px; color: var(--muted); } #msg.err { color: var(--bad); }
  .board { display: flex; gap: 12px; padding: 8px 24px 28px; overflow-x: auto; align-items: flex-start; }
  .col { flex: 0 0 272px; background: var(--sunken); border-radius: 14px; padding: 12px; display: grid; gap: 10px; }
  .col h2 { margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); display: flex; justify-content: space-between; }
  .sum { font-size: 12px; color: var(--muted); display: flex; justify-content: space-between; gap: 8px; }
  .cards { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; min-height: 48px; align-content: start; }
  .cards.over { outline: 2px dashed var(--a); outline-offset: 3px; border-radius: 10px; }
  .card { background: var(--panel); border-radius: 10px; padding: 10px 12px; box-shadow: var(--shadow); display: grid; gap: 6px; cursor: grab; border-left: 4px solid transparent; animation: rise .25s ease both; }
  .card.stale { border-left-color: var(--warn); }
  .card .t { font-weight: 600; } .card .a { color: var(--muted); font-size: 12px; }
  .row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  .amt { font-weight: 700; }
  .who { width: 24px; height: 24px; border-radius: 50%; background: var(--a-soft); color: var(--a); font-size: 11px; font-weight: 700; display: grid; place-items: center; flex: none; }
  .badge { font-size: 11px; padding: 1px 8px; border-radius: 999px; background: var(--warn-soft); color: var(--warn); }
  .prob { height: 4px; border-radius: 2px; background: var(--sunken); overflow: hidden; } .prob i { display: block; height: 100%; background: var(--a); }
  .mv { min-height: 28px; font-size: 12px; padding: 2px 6px; color: var(--muted); }
  .col.won .sum b { color: var(--good); } .col.lost .sum b { color: var(--bad); }
  dialog { border: 1px solid var(--line); border-radius: 14px; background: var(--panel); color: var(--text); padding: 20px; max-width: 360px; }
  dialog::backdrop { background: rgba(0,0,0,.45); }
  dialog .ask { display: grid; gap: 12px; } dialog menu { display: flex; gap: 8px; justify-content: flex-end; margin: 0; padding: 0; }
  .primary { background: var(--a); color: #fff; border-color: var(--a); }
  .empty { color: var(--muted); padding: 24px; }
  @keyframes rise { from { opacity: 0; transform: translateY(6px); } }
  @media (prefers-reduced-motion: reduce) { .card { animation: none; } }
`;

const JS = String.raw`
(function () {
  var LAYOUT = __LAYOUT__, ACT = __ACT__, FIELDS = __FIELDS__;
  var STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'], REASONS = ['Price', 'Timing', 'Competitor', 'No decision', 'Fit'];
  var S = { rows: [], rep: '', q: '', stale: false, busy: false };
  var $ = function (s) { return document.querySelector(s); };
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.append(c); });
    return n;
  }
  var num = function (v) { var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; };
  var money = function (n) { return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }); };
  var p2 = function (n) { return ('0' + n).slice(-2); };
  function stamp(d) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + 'T' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()); }
  var day = function (d) { return stamp(d).slice(0, 10); };
  var val = function (r, f) { var v = r.fieldData && r.fieldData[f]; return v == null ? '' : String(v); };
  var initials = function (s) { return s.split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join('') || '–'; };
  function say(text, bad) { var m = $('#msg'); m.textContent = text || ''; m.className = bad ? 'err' : ''; }

  function visible(r) {
    if (S.rep && val(r, 'Owner Name') !== S.rep) return false;
    if (S.stale && val(r, 'Stale') !== '1' && val(r, 'Stale').toLowerCase() !== 'yes') return false;
    var q = S.q.toLowerCase();
    return !q || (val(r, 'Title') + ' ' + val(r, 'Account Name')).toLowerCase().indexOf(q) >= 0;
  }
  var isStale = function (r) { var v = val(r, 'Stale').toLowerCase(); return v === '1' || v === 'yes' || v === 'true'; };
  // Closed deals show only for the last 90 days, so the Won and Lost columns stay about what just happened.
  function recent(r) { var c = val(r, 'Closed'); if (!c) return true; var m = /(\d{4})-(\d\d)-(\d\d)|(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(c); if (!m) return true; var d = m[1] ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(+m[6], +m[4] - 1, +m[5]); return Date.now() - d.getTime() < 90 * 864e5; }

  function render() {
    var rows = S.rows.filter(visible), open = rows.filter(function (r) { var s = val(r, 'Stage'); return s !== 'Won' && s !== 'Lost'; });
    $('#t-open').textContent = money(open.reduce(function (a, r) { return a + num(val(r, 'Amount')); }, 0));
    $('#t-weighted').textContent = money(open.reduce(function (a, r) { return a + num(val(r, 'Weighted Amount')); }, 0));
    $('#t-stale').textContent = String(open.filter(isStale).length);
    var board = $('#board'); board.replaceChildren();
    if (!S.rows.length) { board.append(el('p', { class: 'empty', text: 'No deals to show. If you expected some, this account may not be allowed to see any.' })); return; }
    STAGES.forEach(function (stage) {
      var mine = rows.filter(function (r) { return val(r, 'Stage') === stage && (stage !== 'Won' && stage !== 'Lost' || recent(r)); });
      var total = mine.reduce(function (a, r) { return a + num(val(r, 'Amount')); }, 0), weighted = mine.reduce(function (a, r) { return a + num(val(r, 'Weighted Amount')); }, 0);
      var list = el('ul', { class: 'cards', 'data-stage': stage, 'aria-label': stage + ' deals' });
      list.addEventListener('dragover', function (e) { e.preventDefault(); list.classList.add('over'); });
      list.addEventListener('dragleave', function () { list.classList.remove('over'); });
      list.addEventListener('drop', function (e) { e.preventDefault(); list.classList.remove('over'); var rec = byId(e.dataTransfer.getData('text/plain')); if (rec) move(rec, stage); });
      mine.forEach(function (r) { list.append(card(r, stage)); });
      var sum = stage === 'Won' || stage === 'Lost' ? [el('b', { text: money(total) }), el('span', { text: mine.length + ' in 90 days' })] : [el('span', { text: money(total) }), el('b', { text: money(weighted) + ' weighted' })];
      board.append(el('section', { class: 'col ' + stage.toLowerCase(), 'aria-label': stage }, [el('h2', {}, [el('span', { text: stage }), el('span', { text: String(mine.length) })]), el('div', { class: 'sum' }, sum), list]));
    });
  }
  var byId = function (id) { return S.rows.filter(function (r) { return String(r.recordId) === id; })[0]; };
  function card(r, stage) {
    var pick = el('select', { class: 'mv', 'aria-label': 'Move ' + val(r, 'Title') + ' to', onchange: function (e) { move(r, e.target.value); } }, STAGES.map(function (s) { return el('option', { value: s, text: s }); }));
    pick.value = stage;
    var days = num(val(r, 'Days In Stage')), p = Math.max(0, Math.min(100, num(val(r, 'Probability'))));
    var li = el('li', { class: 'card' + (isStale(r) ? ' stale' : ''), draggable: 'true', tabindex: '0', 'data-id': String(r.recordId) }, [
      el('div', { class: 't', text: val(r, 'Title') || '(untitled)' }),
      el('div', { class: 'a', text: val(r, 'Account Name') }),
      el('div', { class: 'row' }, [el('span', { class: 'amt', text: money(num(val(r, 'Amount'))) }), el('span', { class: 'who', title: val(r, 'Owner Name'), text: initials(val(r, 'Owner Name')) })]),
      stage === 'Won' || stage === 'Lost' ? null : el('div', { class: 'prob', title: p + '% likely' }, [el('i', { style: 'width:' + p + '%' })]),
      el('div', { class: 'row' }, [el('span', { class: 'a', text: stage === 'Won' || stage === 'Lost' ? (val(r, 'Closed') ? 'Closed ' + val(r, 'Closed') : '') : val(r, 'Expected Close') ? 'Close ' + val(r, 'Expected Close') : days ? days + ' days here' : '' }), isStale(r) ? el('span', { class: 'badge', text: 'Stale ' + days + ' days' }) : null]),
      pick
    ]);
    li.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', String(r.recordId)); e.dataTransfer.effectAllowed = 'move'; });
    return li;
  }

  function askReason() {
    return new Promise(function (done) {
      var dlg = $('#reason'), sel = $('#reason-pick');
      sel.replaceChildren.apply(sel, REASONS.map(function (x) { return el('option', { value: x, text: x }); }));
      dlg.addEventListener('close', function once() { dlg.removeEventListener('close', once); done(dlg.returnValue === 'ok' ? sel.value : null); });
      dlg.returnValue = ''; dlg.showModal();
    });
  }
  async function move(rec, stage) {
    var from = val(rec, 'Stage');
    if (from === stage || S.busy) { render(); return; }
    S.busy = true;
    try {
      var data = { Stage: stage, 'Stage Changed': stamp(new Date()) };
      if (stage === 'Lost') { var why = await askReason(); if (!why) { render(); return; } data['Lost Reason'] = why; }
      if (stage === 'Won' || stage === 'Lost') data.Closed = day(new Date()); else if (from === 'Won' || from === 'Lost') { data.Closed = ''; data['Lost Reason'] = ''; }
      say('Moving ' + val(rec, 'Title') + ' to ' + stage + '…');
      await tabularius.update(LAYOUT, rec.recordId, data);
      var note = { 'Deal ID': val(rec, 'ID') || '', Type: 'Note', Subject: 'Stage changed from ' + from + ' to ' + stage, When: stamp(new Date()), Done: 'Yes' };
      if (val(rec, 'Account ID')) note['Account ID'] = val(rec, 'Account ID');
      // The note is a courtesy: a rep who may not add activities still moves the deal.
      try { await tabularius.create(ACT, note); } catch (e) { /* the move is what matters */ }
      say('Moved ' + val(rec, 'Title') + ' to ' + stage + '.');
    } catch (e) { say(e && e.message || 'The move was refused.', true); }
    finally { S.busy = false; load(); }
  }

  function load() {
    return tabularius.records(LAYOUT, { limit: 1000 }).then(function (r) {
      S.rows = r.data || [];
      var reps = {}; S.rows.forEach(function (x) { var o = val(x, 'Owner Name'); if (o) reps[o] = 1; });
      var sel = $('#rep'), keep = S.rep; sel.replaceChildren(el('option', { value: '', text: 'Everyone' }));
      Object.keys(reps).sort().forEach(function (n) { sel.append(el('option', { value: n, text: n })); });
      sel.value = keep; if (sel.value !== keep) S.rep = '';
      render();
    }, function (e) { say(e && e.message || 'The deals could not be read.', true); });
  }
  function start() {
    $('#rep').addEventListener('change', function (e) { S.rep = e.target.value; render(); });
    $('#q').addEventListener('input', function (e) { S.q = e.target.value; render(); });
    $('#stale').addEventListener('change', function (e) { S.stale = e.target.checked; render(); });
    $('#reason-cancel').addEventListener('click', function () { $('#reason').close('cancel'); });
    $('#reason-ok').addEventListener('click', function () { $('#reason').close('ok'); });
    tabularius.valueList('Stage').then(function (L) { if (L && L.values && L.values.length >= 2) STAGES = L.values.slice(); }, function () {}).then(function () {
      return tabularius.valueList('Lost reason').then(function (L) { if (L && L.values && L.values.length) REASONS = L.values.slice(); }, function () {});
    }).then(load);
    tabularius.on('refresh', function () { if (!S.busy) load(); });
  }
  if (!window.tabularius) $('#board').append(el('p', { class: 'empty', text: 'This board shows the deals of the Showcase file when it is opened in Tabularius.' })); else start();
})();
`;

/** The board as a whole HTML document. */
export function pipelineBoardPage(): string {
  const js = JS.replace('__LAYOUT__', JSON.stringify(BOARD_LAYOUT)).replace('__ACT__', JSON.stringify(BOARD_ACTIVITY_LAYOUT)).replace('__FIELDS__', JSON.stringify(BOARD_FIELDS));
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pipeline board</title>
<style>${CSS}</style>
</head>
<body>
<header>
  <h1>Pipeline</h1>
  <div class="tiles">
    <div class="tile"><span>Open pipeline</span><b id="t-open">–</b></div>
    <div class="tile"><span>Weighted forecast</span><b id="t-weighted">–</b></div>
    <div class="tile"><span>Stale deals</span><b id="t-stale">–</b></div>
  </div>
  <div class="bar">
    <label>Rep <select id="rep"><option value="">Everyone</option></select></label>
    <input id="q" type="search" placeholder="Search deals or accounts" aria-label="Search deals or accounts">
    <label><input id="stale" type="checkbox"> Stale only</label>
    <span id="msg" role="status" aria-live="polite"></span>
  </div>
</header>
<main id="board" class="board"></main>
<dialog id="reason" aria-labelledby="reason-h">
  <div class="ask">
    <strong id="reason-h">Why was it lost?</strong>
    <select id="reason-pick" aria-label="Lost reason"></select>
    <menu><button type="button" id="reason-cancel">Cancel</button><button type="button" id="reason-ok" class="primary">Mark lost</button></menu>
  </div>
</dialog>
<script>${js}</script>
</body>
</html>
`;
}
