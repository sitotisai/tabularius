import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import { evaluateText } from '../../calc/src/index.ts';
import { dataHtml } from '../src/layout.ts';
import { FORMULA_LIMIT, pageFormula, pageSource } from '../src/page-source.ts';
import { BOARD_ACTIVITY_LAYOUT, BOARD_FIELDS, BOARD_LAYOUT, pipelineBoardPage } from '../src/showcase-pages/pipeline-board.ts';

const page = pipelineBoardPage();
const scriptOf = (html: string) => /<script>([\s\S]*)<\/script>/.exec(html)![1];

test('the pipeline board is one document whose script parses and loads nothing from outside', () => {
  assert.doesNotThrow(() => new Script(scriptOf(page)));
  assert.doesNotMatch(page, /https?:\/\//);
  assert.doesNotMatch(page, /<(link|img|iframe)\b|@import|url\(/i);
  assert.doesNotMatch(page, /__[A-Z]+__/, 'every placeholder is filled in');
});

test('the pipeline board puts record data on the page only as text, never as markup', () => {
  const script = scriptOf(page);
  assert.doesNotMatch(script, /innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(/);
});

test('the pipeline board reads and writes the layouts and fields of the showcase\'s page data contract', () => {
  assert.equal(BOARD_LAYOUT, 'Deals list');
  assert.equal(BOARD_ACTIVITY_LAYOUT, 'Activities list');
  for (const f of ['ID', 'Account ID', 'Title', 'Account Name', 'Owner Name', 'Stage', 'Amount', 'Weighted Amount', 'Probability', 'Closed', 'Stale', 'Days In Stage', 'Lost Reason', 'Stage Changed']) assert.ok(BOARD_FIELDS.includes(f as never), f);
  for (const f of BOARD_FIELDS) assert.ok(page.includes(`'${f}'`), `the page uses ${f}`);
});

test('the pipeline board goes into a layout\'s address formula and comes back exactly, and fits FileMaker Pro\'s limit', () => {
  const formula = pageFormula(page);
  assert.equal(pageSource(formula), page);
  assert.match(evaluateText(formula), /^data:text\/html;base64,/);
  assert.equal(dataHtml(evaluateText(formula))!.replace(/\r/g, '\n'), page);
  assert.ok(formula.length <= FORMULA_LIMIT, `${formula.length} characters is over ${FORMULA_LIMIT}`);
});

test('the pipeline board asks for no form, so it works in a sandbox that allows none', () => {
  assert.doesNotMatch(page, /<form\b/);
  assert.match(page, /prefers-reduced-motion/);
});
