import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FUNCTIONS } from '../src/functions.ts';
import { evaluateText } from '../src/index.ts';

type Example = { formula: string; result: string };
type Entry = {
  name: string;
  signature: string;
  summary: string;
  details?: string;
  examples: Example[];
  status: 'works' | 'works-differently' | 'partly' | 'not-yet';
  differences?: string;
};

const entries = JSON.parse(readFileSync(new URL('../../../docs/functions-data/dates.json', import.meta.url), 'utf8')) as Entry[];

test('date and time function reference entries match the registry and calculation engine', () => {
  for (const entry of entries) {
    const fn = FUNCTIONS.get(entry.name.toLowerCase());
    assert.ok(fn, `${entry.name} exists in the function registry`);
    const args = entry.signature.match(/\((.*)\)/)?.[1]?.split(';').map((part) => part.trim()).filter(Boolean) ?? [];
    assert.ok(args.length >= fn.min, `${entry.name} signature has at least ${fn.min} arguments`);
    assert.ok(fn.max === undefined || args.length <= fn.max, `${entry.name} signature has at most ${fn.max} arguments`);
    assert.ok(['works', 'works-differently', 'partly', 'not-yet'].includes(entry.status), `${entry.name} has a supported status`);
    for (const example of entry.examples) {
      assert.equal(evaluateText(example.formula), example.result, `${entry.name}: ${example.formula}`);
    }
  }
});
