import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FUNCTIONS } from '../src/functions.ts';
import { evaluateText } from '../src/index.ts';

type Entry = { name: string; signature: string; status: string; examples: { formula: string; result: string }[] };
const entries = JSON.parse(readFileSync(new URL('../../../docs/functions-data/json-lists.json', import.meta.url), 'utf8')) as Entry[];

test('JSON and value-list function reference examples match the calculation engine', () => {
  assert.equal(entries.length, 28);
  for (const entry of entries) {
    const registry = FUNCTIONS.get(entry.name.toLowerCase());
    assert.ok(registry, `${entry.name} is in the function registry`);
    const args = entry.signature.includes('(') ? (entry.signature.match(/;/g)?.length ?? 0) + 1 : 0;
    assert.ok(args >= registry.min && (registry.max === undefined || args <= registry.max), `${entry.name} signature arity ${args} is within registry bounds ${registry.min}..${registry.max ?? '∞'}`);
    assert.ok(['works', 'works-differently', 'partly', 'not-yet'].includes(entry.status), `${entry.name} has a known status`);
    for (const example of entry.examples) assert.equal(evaluateText(example.formula), example.result, `${entry.name}: ${example.formula}`);
  }
});
