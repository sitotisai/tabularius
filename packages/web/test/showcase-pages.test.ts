import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pageFormula, pageSource, pageSizeNote, FORMULA_LIMIT } from '../src/page-source.ts';
import { SHARED_JS } from '../src/showcase-pages/shared.ts';
import { SHOWCASE_PAGES, DEFAULT_NAMES } from '../src/showcase-pages/index.ts';
import { CONNECT_SNIPPETS } from '../src/showcase-pages/connect.ts';

const pages = SHOWCASE_PAGES.map((p) => ({ name: p.name, html: p.html() }));

/** The page with its comments removed (a comment may name an address; the page may not load one). */
const withoutComments = (html: string) => html.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

test('showcase pages: four pages, named for their layouts', () => {
  assert.deepEqual(pages.map((p) => p.name), ['Today', 'Sales dashboard', 'Account timeline', 'Connect']);
});

for (const { name, html } of pages) {
  test(`showcase pages: ${name} loads nothing from the network and is small enough`, () => {
    const code = withoutComments(html);
    // Connect's snippets are text to copy, not addresses the page loads; the others hold no address at all. The svg namespace is a name, not an address.
    const urls = (code.match(/https?:\/\/[^\s"'<>)]*/g) ?? []).filter((u) => u !== 'http://www.w3.org/2000/svg');
    if (name === 'Connect') assert.ok(urls.every((u) => u.includes('\\u003cyour-server')), urls.join(' '));
    else assert.deepEqual(urls, []);
    assert.doesNotMatch(code, /<(script|link|img|iframe)\b[^>]*\b(src|href)=/i);
    assert.doesNotMatch(code, /@import|url\(|fetch\(|XMLHttpRequest|WebSocket|EventSource/);
    assert.ok(html.length < 60000, `${html.length} characters`);
    assert.match(html, /prefers-reduced-motion/);
    assert.match(html, /prefers-color-scheme: dark/);
    assert.match(html, /window\.tabularius/);
    assert.doesNotMatch(html, /filemaker|claris/i);
  });

  test(`showcase pages: ${name} writes record values as text, never as HTML`, () => {
    assert.doesNotMatch(withoutComments(html), /innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function/);
  });

  test(`showcase pages: ${name} survives the address formula and fits FileMaker Pro's limit`, () => {
    const formula = pageFormula(html);
    assert.equal(pageSource(formula), html);
    assert.ok(formula.length < FORMULA_LIMIT, `${name}: ${pageSizeNote(formula.length).text}`);
  });
}

// A minimal document: elements keep what the helper gives them, so a test can see whether a value became text or markup.
class El {
  children: (El | string)[] = []; attrs: Record<string, string> = {}; listeners: string[] = [];
  tag: string;
  constructor(tag: string) { this.tag = tag; }
  setAttribute(k: string, v: string) { this.attrs[k] = v; }
  addEventListener(k: string) { this.listeners.push(k); }
  append(...c: (El | string)[]) { this.children.push(...c); }
}
const build = new Function('document', 'window', 'Node', 'matchMedia', `${SHARED_JS}; return { h, sv, parseWhen, money, pct, iso, field, msg };`);
const doc = { createElement: (t: string) => new El(t), createElementNS: (_: string, t: string) => new El(t), getElementById: () => null, body: new El('body') };
const lib = build(doc, {}, El, () => ({ matches: false }));

test('showcase pages: the element builder keeps hostile record text as text', () => {
  const hostile = '<img src=x onerror="alert(1)"> & "quoted" \' </script>';
  const el = lib.h('li', { title: hostile, onclick: () => {} }, hostile, lib.h('b', {}, hostile));
  assert.equal(el.tag, 'li');
  assert.equal(el.attrs.title, hostile);
  assert.deepEqual(el.listeners, ['click']);
  assert.equal(el.children[0], hostile);
  assert.equal((el.children[1] as El).children[0], hostile);
  assert.equal(lib.field({ fieldData: { Name: hostile } }, 'Name'), hostile);
});

test('showcase pages: dates, money and shares read the way records give them', () => {
  assert.equal(lib.iso(lib.parseWhen('03/09/2026 02:30:00 PM')), '2026-03-09');
  assert.equal(lib.parseWhen('03/09/2026 02:30:00 PM').getHours(), 14);
  assert.equal(lib.parseWhen('2026-03-09T08:05:00').getMinutes(), 5);
  assert.equal(lib.parseWhen('not a date'), null);
  assert.equal(lib.parseWhen(undefined), null);
  assert.equal(lib.money(1234567.4), '$1,234,567');
  assert.equal(lib.money('x'), '$0');
  assert.equal(lib.pct(0.256), '26%');
  assert.equal(lib.pct(NaN), '–');
});

test('showcase pages: layout names can be overridden and reach the page', () => {
  const html = SHOWCASE_PAGES[0].html({ deals: 'Pipeline <1>' });
  assert.match(html, /"Pipeline \\u003c1>"/);
  assert.equal(DEFAULT_NAMES.deals, 'Deals list');
  assert.ok(!SHOWCASE_PAGES[0].html().includes('Pipeline'));
});

test('showcase pages: Today lists eight prompts and the Connect snippets hold only placeholders', () => {
  const prompts = /const PROMPTS = (\[.*\]);/.exec(pages[0].html);
  assert.equal(JSON.parse(prompts![1]).length, 8);
  for (const s of CONNECT_SNIPPETS) assert.match(s.text, /<your-server>/);
  assert.ok(CONNECT_SNIPPETS.some((s) => /<token>/.test(s.text)));
  assert.ok(CONNECT_SNIPPETS.some((s) => s.text.startsWith('claude mcp add')));
});

test('showcase pages: Today passes scripts the serial ID field, never the internal record id', () => {
  const code = withoutComments(pages[0].html);
  assert.doesNotMatch(code, /recordId/);
  assert.match(code, /performScript\(N\.markDone, id\)/);
  assert.match(code, /performScript\(N\.goToRecord, id\)/);
  assert.match(code, /field\(x, 'ID'\)/);
});
