import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluateText } from '../src/index.ts';
import { FUNCTIONS, mbsFunctionNames } from '../src/functions.ts';

type Entry = { name: string; signature: string; summary: string; status: string; examples: { formula: string; result: string }[] };
const entries = JSON.parse(await readFile(new URL('../../../docs/functions-data/mbs-text-rest.json', import.meta.url), 'utf8')) as Entry[];

test('MBS Text and Math function reference entries match the registry and checked formulas', () => {
  const names = new Set(mbsFunctionNames());
  const mbs = FUNCTIONS.get('mbs');
  assert.ok(mbs, 'MBS dispatcher is registered');
  for (const entry of entries) {
    const key = entry.name.toLowerCase();
    assert.ok(names.has(key), `${entry.name} is present in the MBS registry`);
    const args = entry.signature.slice(entry.signature.indexOf('(') + 1, entry.signature.lastIndexOf(')'))
      .split(';').map((part) => part.trim()).filter(Boolean).length;
    // MBS's table dispatches variable argument lists through MBS(name; ...); its dispatcher accepts one required name
    // and has no maximum. Check the documented argument count against that registry contract.
    assert.ok(args + 1 >= mbs.min && (mbs.max === undefined || args + 1 <= mbs.max), `${entry.name} signature arity`);
    assert.ok(['works', 'works-differently', 'partly', 'not-yet'].includes(entry.status), `${entry.name} status`);
    for (const example of entry.examples) assert.equal(evaluateText(example.formula), example.result, `${entry.name}: ${example.formula}`);
  }
});
