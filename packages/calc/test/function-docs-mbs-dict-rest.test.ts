import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateText } from '../src/index.ts';
import { FUNCTIONS } from '../src/functions.ts';
import { MBS_DICT } from '../src/mbs-dict.ts';
import { MBS_REGEX } from '../src/mbs-regex.ts';
import { MBS_XML } from '../src/mbs-xml.ts';

type Entry = { name: string; signature: string; summary: string; status: string; examples: { formula: string; result: string }[] };
const entries = JSON.parse(readFileSync(new URL('../../../docs/functions-data/mbs-dict-rest.json', import.meta.url), 'utf8')) as Entry[];

test('MBS Dictionary, Regex and XML reference examples match the calculation engine', () => {
  const mbs = new Set([...Object.keys(MBS_DICT), ...Object.keys(MBS_REGEX), ...Object.keys(MBS_XML)]);
  assert.equal(entries.length, 60);
  assert.equal(new Set(entries.map(({ name }) => name.toLowerCase())).size, entries.length);
  for (const entry of entries) {
    const key = entry.name.toLowerCase();
    assert.ok(mbs.has(key), `${entry.name} is absent from the MBS registry`);
    assert.ok(FUNCTIONS.has('mbs'), 'MBS dispatcher is registered');
    const args = entry.signature.slice(entry.signature.indexOf('(') + 1, entry.signature.lastIndexOf(')')).trim();
    const count = args ? args.split(';').length : 0;
    assert.ok(count >= 0 && count <= 6, `${entry.name} signature argument count is out of range`);
    assert.ok(['works', 'works-differently', 'partly', 'not-yet'].includes(entry.status), `${entry.name} has invalid status`);
    assert.ok(entry.summary.length > 0);
    for (const example of entry.examples ?? []) assert.equal(evaluateText(example.formula), example.result, example.formula);
  }
});
