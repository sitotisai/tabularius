import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { evaluateText } from '../src/index.ts';
import { FUNCTIONS } from '../src/functions.ts';

type Entry = {
  name: string;
  signature: string;
  summary: string;
  details?: string;
  examples: { formula: string; result: string }[];
  status: string;
  differences?: string;
};

const entries = JSON.parse(readFileSync(new URL('../../../docs/functions-data/styling.json', import.meta.url), 'utf8')) as Entry[];
const REQUIRED = 'allstyles bold daynamej doubleunderline fieldstyle highlightyellow hiragana italic kanahankaku kanazenkaku katakana monthnamej numtojtext plain rgb romanhankaku romanzenkaku smallcaps strikethrough subscript superscript textcolor textcolorremove textfont textfontremove textformatremove textsize textsizeremove textstyleadd textstyleremove underline wordunderline'.split(' ');

test('styling and Japanese function reference data names registered functions with valid arity and checked examples', () => {
  assert.deepEqual(entries.map(({ name }) => name.toLowerCase()).sort(), [...REQUIRED].sort(), 'reference must cover the whole family exactly once');
  assert.equal(new Set(entries.map(({ name }) => name.toLowerCase())).size, entries.length, 'function names must be unique');
  for (const entry of entries) {
    const key = entry.name.toLowerCase();
    const fn = FUNCTIONS.get(key);
    assert.ok(fn, `${entry.name} is not in the function registry`);
    const args = entry.signature.slice(entry.signature.indexOf('(') + 1, entry.signature.lastIndexOf(')')).trim();
    const count = args ? args.split(';').length : 0;
    assert.ok(count >= fn.min && count <= (fn.max ?? Infinity), `${entry.name} signature has ${count} arguments; registry accepts ${fn.min}..${fn.max ?? 'unbounded'}`);
    assert.ok(['works', 'works-differently', 'partly', 'not-yet'].includes(entry.status), `${entry.name} has invalid status`);
    assert.ok(entry.summary.endsWith('.'), `${entry.name} summary must be one sentence`);
    assert.ok(entry.examples.length <= 3, `${entry.name} has too many examples`);
    for (const example of entry.examples) assert.equal(evaluateText(example.formula), example.result, `${entry.name}: ${example.formula}`);
  }
});
