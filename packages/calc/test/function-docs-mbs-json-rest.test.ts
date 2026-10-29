import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluateText } from '../src/index.ts';
import { FUNCTIONS, mbsFunctionNames } from '../src/functions.ts';

type Entry = {
  name: string;
  signature: string;
  summary: string;
  details?: string;
  examples: { formula: string; result: string }[];
  status: 'works' | 'works-differently' | 'partly' | 'not-yet';
  differences?: string;
};

const entries = JSON.parse(await readFile(new URL('../../../docs/functions-data/mbs-json-rest.json', import.meta.url), 'utf8')) as Entry[];

test('MBS JSON function reference names, signatures and examples match the calculation engine', () => {
  const names = new Set(mbsFunctionNames());
  const wrapper = FUNCTIONS.get('mbs');
  assert.ok(wrapper);
  for (const entry of entries) {
    const name = entry.name.toLowerCase();
    assert.ok(names.has(name), `${entry.name} is registered`);
    assert.ok(['works', 'works-differently', 'partly', 'not-yet'].includes(entry.status), `${entry.name} status`);
    const args = entry.signature.slice(entry.signature.indexOf('(') + 1, entry.signature.lastIndexOf(')')).trim();
    const count = args ? args.split(';').length : 0;
    // MBS's calculation signature includes the function name as its first argument.
    const wrapperArity = count + 1;
    assert.ok(wrapperArity >= wrapper.min && (wrapper.max === undefined || wrapperArity <= wrapper.max), `${entry.name} signature arity`);
    assert.ok(entry.examples.length <= 3, `${entry.name} has at most three examples`);
    for (const example of entry.examples) {
      assert.equal(evaluateText(example.formula), example.result, `${entry.name}: ${example.formula}`);
    }
  }
});
