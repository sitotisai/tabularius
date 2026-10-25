import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateText } from '../src/index.ts';
import { FUNCTIONS, mbsFunctionNames } from '../src/functions.ts';

type Entry = { name: string; signature: string; summary: string; details?: string; examples: { formula: string; result: string }[]; status: string; differences?: string };
const entries = JSON.parse(readFileSync(new URL('../../../docs/functions-data/logic-schema.json', import.meta.url), 'utf8')) as Entry[];

test('logic function reference data matches the registry and checked examples', () => {
  assert.equal(entries.length, 78);
  const seen = new Set<string>();
  for (const entry of entries) {
    const key = entry.name.toLowerCase();
    assert.ok(!seen.has(key), `duplicate ${entry.name}`);
    seen.add(key);
    const isMbs = key === 'mbs';
    assert.ok(isMbs ? mbsFunctionNames().length > 0 : FUNCTIONS.has(key), `unknown function ${entry.name}`);
    const fn = FUNCTIONS.get(key);
    const signatureName = entry.signature.slice(0, entry.signature.indexOf(' (')).toLowerCase();
    assert.equal(signatureName, key, `${entry.name} signature name`);
    const body = entry.signature.slice(entry.signature.indexOf('(') + 1, entry.signature.lastIndexOf(')')).trim();
    const count = body ? body.split(';').length : 0;
    if (fn) {
      assert.ok(count >= fn.min, `${entry.name} has too few signature arguments`);
      assert.ok(fn.max === undefined || count <= fn.max, `${entry.name} has too many signature arguments`);
    }
    assert.ok(['works', 'works-differently', 'partly', 'not-yet'].includes(entry.status), `${entry.name} status`);
    assert.ok(entry.examples.length <= 3, `${entry.name} has more than three examples`);
    for (const example of entry.examples) assert.equal(evaluateText(example.formula), example.result, `${entry.name}: ${example.formula}`);
  }
});
