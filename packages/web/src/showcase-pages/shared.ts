import { js } from '../page-templates.ts';

// Showcase CRM pages: modern layouts (one web viewer, its page in the address formula; see ../page-source.ts).
// Every page is built from the style block and the helper script below, copied into it (a page makes no network
// request, so nothing can be shared by address). The helpers build elements with textContent and setAttribute only,
// never HTML strings, so a record's value can hold < and quotes and stays text.

/** The names of the showcase layouts the pages read from or go to (the page data contract: only fields on these layouts are visible to a page); a page takes overrides, so a renamed layout is one edit. */
export interface ShowcaseNames {
  accounts: string; deals: string; activities: string; emailLog: string; reps: string; contacts: string;
  /** The layouts a click on an account or deal goes to. */
  account360: string; deal: string;
  /** The script that marks one task done (given the task's serial ID field) and the one that finds a record by its serial ID on the current layout after goToLayout. */
  markDone: string; goToRecord: string;
}

export const DEFAULT_NAMES: ShowcaseNames = {
  accounts: 'Accounts list', deals: 'Deals list', activities: 'Activities list', emailLog: 'Email Log list', reps: 'Reps list', contacts: 'Contacts list',
  account360: 'Account 360', deal: 'Deal', markDone: 'Mark task done', goToRecord: 'Go to record',
};

export const SHARED_STYLE = `
  :root { color-scheme: light dark; --bg: #f4f5f7; --card: #ffffff; --text: #1b1f27; --muted: #5d6675; --line: #dde1e8; --accent: #2563eb; --good: #15803d; --warn: #b45309; --bad: #b91c1c; --track: #e5e8ee; }
  @media (prefers-color-scheme: dark) { :root { --bg: #11151c; --card: #1a202b; --text: #e6e9ef; --muted: #98a2b3; --line: #2a3242; --accent: #6ea8fe; --good: #4ade80; --warn: #fbbf24; --bad: #f87171; --track: #2a3242; } }
  * { box-sizing: border-box; }
  body { margin: 0; font: 15px/1.5 system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); }
  header { padding: 28px 28px 4px; display: flex; flex-wrap: wrap; gap: 12px; align-items: baseline; justify-content: space-between; }
  h1 { margin: 0; font-size: 26px; } h2 { margin: 0 0 12px; font-size: 16px; }
  .muted { color: var(--muted); } .err { color: var(--bad); }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; padding: 20px 28px 28px; }
  .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; padding: 16px 28px 0; }
  .card, .tile { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 16px; min-width: 0; animation: rise .4s ease both; }
  .tile b { display: block; font-size: 26px; margin-top: 4px; }
  ul.rows { list-style: none; margin: 0; padding: 0; }
  ul.rows li { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-top: 1px solid var(--line); }
  ul.rows li:first-child { border-top: 0; }
  button, select { font: inherit; color: var(--text); background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 4px 10px; cursor: pointer; }
  button:hover, .link:hover { border-color: var(--accent); }
  button:focus-visible, select:focus-visible, .link:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .link { cursor: pointer; text-align: left; background: none; border: 1px solid transparent; padding: 0; }
  .bar { fill: var(--accent); } .track { fill: var(--track); } .axis { fill: var(--muted); font-size: 11px; }
  .pill { font-size: 12px; padding: 1px 8px; border-radius: 999px; border: 1px solid var(--line); color: var(--muted); }
  @keyframes rise { from { opacity: 0; transform: translateY(8px); } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
`;

/** Helpers the pages share: element builders, dates, money, a Copy button, an error line, and "is window.tabularius here". */
export const SHARED_JS = `
  const $ = (id) => document.getElementById(id);
  function make(ns, tag, props, kids) {
    const e = ns ? document.createElementNS(ns, tag) : document.createElement(tag);
    for (const k in props || {}) {
      if (k === 'class') e.setAttribute('class', props[k]);
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), props[k]);
      else e.setAttribute(k, props[k]);
    }
    for (const c of kids.flat(2)) if (c !== null && c !== undefined && c !== false) e.append(c);
    return e;
  }
  const h = (tag, props, ...kids) => make(null, tag, props, kids);
  const sv = (tag, props, ...kids) => make('http://www.w3.org/2000/svg', tag, props, kids);
  const calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
  // A date or timestamp as a record gives it: MM/DD/YYYY [HH:MM:SS [AM|PM]] or YYYY-MM-DD[THH:MM:SS]; null when it is neither.
  function parseWhen(v) {
    const s = String(v === undefined || v === null ? '' : v).trim();
    let m = /^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})(?:[ T](\\d{1,2}):(\\d{2})(?::(\\d{2}))?\\s*(AM|PM)?)?$/i.exec(s);
    if (m) {
      let hr = Number(m[4] || 0); const ap = (m[7] || '').toUpperCase();
      if (ap === 'PM' && hr < 12) hr += 12; if (ap === 'AM' && hr === 12) hr = 0;
      return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]), hr, Number(m[5] || 0), Number(m[6] || 0));
    }
    m = /^(\\d{4})-(\\d{2})-(\\d{2})(?:[T ](\\d{2}):(\\d{2})(?::(\\d{2}))?)?/.exec(s);
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0)) : null;
  }
  const money = (n) => (Number(n) < 0 ? '-' : '') + '$' + Math.round(Math.abs(Number(n) || 0)).toLocaleString();
  const pct = (n) => (isFinite(n) ? Math.round(n * 100) + '%' : '–');
  const field = (r, name) => (r && r.fieldData && r.fieldData[name] !== undefined && r.fieldData[name] !== null ? String(r.fieldData[name]) : '');
  const msg = (e) => String((e && e.message) || e || 'Something went wrong');
  function fail(el, e) { if (el) el.replaceChildren(h('span', { class: 'err' }, msg(e))); }
  // Writes to the clipboard where the sandbox allows it, else through a selected text area; says which happened on the button.
  async function copyText(text, button) {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
      const ta = h('textarea', { 'aria-hidden': 'true' }); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.append(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
      ta.remove();
    }
    const was = button.textContent; button.textContent = ok ? 'Copied' : 'Select and copy it by hand';
    setTimeout(() => (button.textContent = was), 1800);
  }
  const copyButton = (text) => { const b = h('button', { type: 'button' }, 'Copy'); b.addEventListener('click', () => copyText(text, b)); return b; };
  // Without window.tabularius (another program's web viewer, or a browser tab) the page says so instead of staying blank.
  function needsTabularius(what) {
    if (window.tabularius) return false;
    document.body.replaceChildren(h('main', { style: 'padding:32px;max-width:640px' }, h('h1', {}, ${js('This page needs Tabularius')}),
      h('p', { class: 'muted' }, what + ' It reads live records through window.tabularius, which only Tabularius provides, so it shows nothing in another web viewer or a plain browser tab.')));
    return true;
  }
  // The signed-in rep's record (found by Login = account name), or null when Reps cannot be read or has no such rep.
  async function myRep(reps, account) {
    try {
      const r = await tabularius.find(reps, [{ Login: '==' + account }], { limit: 1 });
      return r.data[0] || null;
    } catch (e) { return null; }
  }
  const sum = (c) => ((c && c.series && c.series[0] && c.series[0].values) || []).map((x) => Number(x) || 0);
`;

/** A whole page: the document around `body` (HTML written by the page, never record data), its own script and the shared style. */
export function pageShell(title: string, body: string, script: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title.replace(/[<>&"]/g, '')}</title>
<style>${SHARED_STYLE}</style>
</head>
<body>
${body}
<script>
${SHARED_JS}
${script}
</script>
</body>
</html>
`;
}

export const withNames = (names?: Partial<ShowcaseNames>): ShowcaseNames => ({ ...DEFAULT_NAMES, ...names });
