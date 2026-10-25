// Formula reading, Trim and the path helpers cost time linear in the text. Each case uses a text long enough that a
// quadratic scan would take seconds to minutes, and a generous limit that a linear one meets by a wide margin.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateText, parse } from '../src/index.ts';

const LIMIT_MS = 1500;
function quick<T>(f: () => T): T {
  const started = performance.now();
  try {
    return f();
  } finally {
    const took = performance.now() - started;
    assert.ok(took < LIMIT_MS, `took ${Math.round(took)} ms: the scan is not linear`);
  }
}
const attempt = (f: () => unknown) => { try { f(); } catch { /* the formula may be refused; only the time matters */ } };

test('the tokenizer reads many space-separated words in linear time', () => {
  quick(() => attempt(() => parse('a '.repeat(30_000))));
  quick(() => attempt(() => parse('not '.repeat(30_000))));
  // A run of words ending in "and (" is not a function name, and every word before it must not rescan the run.
  quick(() => attempt(() => parse(`${'a '.repeat(30_000)}and (1)`)));
});

test('words run together before "(" still make one function name', () => {
  const tree = parse('Get Original Window Name ( 1 )', { fields: [], occurrences: [] } as never);
  assert.equal(tree.k, 'call');
  if (tree.k === 'call') assert.equal(tree.name, 'Get Original Window Name');
  // "and", "or", "xor" and "not" stay operators, wherever they sit in the run.
  assert.equal(evaluateText('1 and (1)'), '1');
  assert.equal(evaluateText('0 or (1)'), '1');
  assert.equal(evaluateText('not (0)'), '1');
  assert.equal(evaluateText('1 xor (0)'), '1');
  // A keyword after a full-width space inside the first word is a keyword too.
  assert.throws(() => parse('\u3000AND b ( 1 )'), /Operator expected/);
});

test('Trim is linear on a long run of spaces inside the text', () => {
  const k = 60_000;
  assert.equal(quick(() => evaluateText(`Length ( Trim ( "a${' '.repeat(k)}b" ) )`)), String(k + 2));
});

test('Trim removes spaces at both ends only', () => {
  assert.equal(evaluateText('"[" & Trim ( "   a  b   " ) & "]"'), '[a  b]');
  assert.equal(evaluateText('"[" & Trim ( "     " ) & "]"'), '[]');
  assert.equal(evaluateText('"[" & Trim ( "" ) & "]"'), '[]');
  assert.equal(evaluateText('"[" & Trim ( "a" ) & "]"'), '[a]');
  // Only the space character is trimmed; a tab is not.
  assert.equal(evaluateText('Length ( Trim ( " \t " ) )'), '1');
});

test('Path.LastPathComponent is linear on a long run of separators', () => {
  const k = 60_000;
  const formula = (s: string) => `MBS ( "Path.LastPathComponent" ; "${s}" )`;
  assert.equal(quick(() => evaluateText(formula(`a${'/'.repeat(k)}b`))), 'b');
  assert.equal(quick(() => evaluateText(formula(`x/a${'/'.repeat(k)}`))), 'a');
  assert.equal(evaluateText(formula('/one/two//')), 'two');
  assert.equal(evaluateText(formula('C:\\\\dir\\\\file.txt')), 'file.txt');
});
