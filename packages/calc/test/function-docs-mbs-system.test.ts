import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluateText } from '../src/index.ts';
import { FUNCTIONS, mbsFunctionNames } from '../src/functions.ts';

type Entry = { name: string; signature: string; summary: string; details?: string; examples: { formula: string; result: string }[]; status: string };
const entries = JSON.parse(await readFile(new URL('../../../docs/functions-data/mbs-system.json', import.meta.url), 'utf8')) as Entry[];

test('MBS system function reference entries are registered and examples evaluate exactly', () => {
  const registryNames = new Set(mbsFunctionNames().map((name) => name.toLowerCase()));
  for (const entry of entries) {
    const key = entry.name.toLowerCase();
    assert.ok(registryNames.has(key), `${entry.name} is absent from the MBS registry`);
    // MBS is the calculation-language dispatch point: its one required argument is the function name,
    // followed by the documented arguments; its registry intentionally has no maximum.
    const dispatch = FUNCTIONS.get('mbs')!;
    const count = (entry.signature.match(/;/g) ?? []).length + 1;
    assert.ok(count + 1 >= dispatch.min, `${entry.name} is below the MBS dispatcher minimum`);
    assert.ok(dispatch.max === undefined || count + 1 <= dispatch.max, `${entry.name} exceeds the MBS dispatcher maximum`);
    assert.ok(['works', 'works-differently', 'partly', 'not-yet'].includes(entry.status), `${entry.name} has an invalid status`);
    assert.ok(entry.examples.length <= 3, `${entry.name} has too many examples`);
    for (const example of entry.examples) {
      assert.equal(evaluateText(example.formula, { platform: 'linux' }), example.result, `${entry.name}: ${example.formula}`);
    }
  }
});
