import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateText } from '../src/index.ts';
import { FUNCTIONS } from '../src/functions.ts';

type Entry = {
  name: string;
  signature: string;
  summary: string;
  details?: string;
  examples: { formula: string; result: string }[];
  status: 'works' | 'works-differently' | 'partly' | 'not-yet';
  differences?: string;
};
const entries = JSON.parse(readFileSync(new URL('../../../docs/functions-data/numbers.json', import.meta.url), 'utf8')) as Entry[];

test('number, financial and aggregate function reference examples match the calculation engine', () => {
  const statuses = new Set(['works', 'works-differently', 'partly', 'not-yet']);
  for (const entry of entries) {
    const registry = FUNCTIONS.get(entry.name.toLowerCase());
    assert.ok(registry, `${entry.name} is missing from the function registry`);
    const signatureArgs = entry.signature.slice(entry.signature.indexOf('(') + 1, entry.signature.lastIndexOf(')')).trim();
    const variable = signatureArgs.includes('…');
    const requiredArgs = signatureArgs.replace(/\{[^}]*\}/g, '').trim();
    const minimum = requiredArgs ? requiredArgs.split(';').filter((part) => part.trim() !== '…').length : 0;
    const maximum = variable ? Infinity : signatureArgs ? signatureArgs.split(';').filter((part) => part.trim() !== '…').length : 0;
    assert.ok(registry.min >= minimum && registry.min <= maximum, `${entry.name} signature does not include registry minimum ${registry.min}`);
    assert.ok(registry.max === undefined ? variable : registry.max >= minimum && registry.max <= maximum, `${entry.name} signature does not include registry maximum ${registry.max}`);
    assert.ok(statuses.has(entry.status), `${entry.name} has invalid status`);
    assert.ok(Array.isArray(entry.examples), `${entry.name} examples must be an array`);
    for (const example of entry.examples) {
      assert.equal(evaluateText(example.formula), example.result, `${entry.name}: ${example.formula}`);
    }
  }
  assert.equal(entries.length, 42);
});
