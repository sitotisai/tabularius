import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FUNCTIONS } from '../src/functions.ts';
import { evaluateText } from '../src/index.ts';

type Example = { formula: string; result: string };
type Entry = { name: string; signature: string; summary: string; details?: string; examples: Example[]; status: string; differences?: string };
const rows = JSON.parse(readFileSync(new URL('../../../docs/functions-data/text.json', import.meta.url), 'utf8')) as Entry[];

test('text function reference examples and registry signatures are valid', () => {
  assert.equal(rows.length, 44);
  assert.equal(new Set(rows.map((row) => row.name.toLowerCase())).size, rows.length);
  const required = `base64decode base64encode base64encoderfc char code condense convertfromfilemakerpath converttofilemakerpath exact getascss getassvg getastext getasurlencoded gettokencount hexdecode hexencode left leftwords length lower lowercase middle middlewords patterncount position posixpath proper quote replace right rightwords self substitute textdecode textencode titlecase trim trimall trtext_getline upper uppercase urlpath winpath wordcount`.split(' ');
  assert.deepEqual(rows.map((row) => row.name.toLowerCase()).sort(), required.sort(), 'the reference covers the requested text functions');
  for (const row of rows) {
    const key = row.name.toLowerCase();
    const fn = FUNCTIONS.get(key);
    assert.ok(fn, `${row.name} exists in the registry`);
    const match = row.signature.match(/\((.*)\)/);
    assert.ok(match, `${row.name} has a parenthesized signature`);
    assert.equal(row.signature.slice(0, row.signature.indexOf('(')).trim().toLowerCase(), key, `${row.name} signature names the function`);
    const body = match[1].trim();
    const count = body ? body.split(';').length : 0;
    assert.ok(count >= fn.min && (fn.max === undefined || count <= fn.max), `${row.name} signature has ${count} arguments; expected ${fn.min}..${fn.max ?? 'unbounded'}`);
    assert.ok(['works', 'works-differently', 'partly', 'not-yet'].includes(row.status), `${row.name} has a valid status`);
    assert.ok(row.summary.trim().endsWith('.'), `${row.name} has a one-sentence summary`);
    assert.ok(row.examples.length <= 3, `${row.name} has at most three examples`);
    for (const example of row.examples) assert.equal(evaluateText(example.formula), example.result, example.formula);
  }
});
