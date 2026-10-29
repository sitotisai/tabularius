import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FUNCTIONS } from '../src/functions.ts';
import { MBS_CURL } from '../src/mbs-curl.ts';
import { evaluateText } from '../src/index.ts';

type Entry = {
  name: string;
  signature: string;
  summary: string;
  details?: string;
  examples: { formula: string; result: string }[];
  status: string;
  differences?: string;
};

const root = join(import.meta.dirname, '../../..');
const entries = JSON.parse(readFileSync(join(root, 'docs/functions-data/mbs-curl.json'), 'utf8')) as Entry[];

// These bounds follow the argument reads and guards in mbs-curl.ts. The generic
// MBS function registry itself accepts a variable argument list for plug-in calls.
const arity: Record<string, [number, number]> = {
  'curl.cleanup': [1, 1], 'curl.getdebugastext': [1, 1], 'curl.getdebugmessages': [1, 1],
  'curl.getheaderastext': [1, 3], 'curl.getresponsecode': [1, 1], 'curl.getresultastext': [1, 3],
  'curl.new': [0, 0], 'curl.perform': [1, 1], 'curl.release': [1, 1], 'curl.setdebugwithdata': [2, 2],
  'curl.setinputtext': [2, 3], 'curl.setoptioncustomrequest': [2, 3], 'curl.setoptionfollowlocation': [2, 2],
  'curl.setoptionhttpheader': [1, Infinity], 'curl.setoptionmaxredirs': [2, 2], 'curl.setoptionpassword': [2, 3],
  'curl.setoptionpostfields': [2, 3], 'curl.setoptionsslverifyhost': [2, 2], 'curl.setoptionsslverifypeer': [2, 2],
  'curl.setoptionsslversion': [2, 2], 'curl.setoptionupload': [2, 2], 'curl.setoptionurl': [2, 3],
  'curl.setoptionusername': [2, 3], 'curl.setoptionusessl': [2, 2], 'curl.setoptionverbose': [2, 2],
  'curl.setupaws': [8, 11], 'curl.setupdateprogressdialog': [2, 2],
};

const signatureArity = (signature: string) => {
  const args = signature.slice(signature.indexOf('(') + 1, signature.lastIndexOf(')')).trim();
  return args ? args.split(';').length : 0;
};

test('MBS CURL reference entries match the registered functions and supported arities', () => {
  assert.equal(entries.length, 27);
  assert.equal(new Set(entries.map(({ name }) => name.toLowerCase())).size, entries.length);
  const statuses = new Set(['works', 'works-differently', 'partly', 'not-yet']);
  for (const entry of entries) {
    const key = entry.name.toLowerCase();
    assert.ok(FUNCTIONS.has('mbs'), `${entry.name}: MBS dispatcher is registered`);
    assert.ok(Object.hasOwn(MBS_CURL, key) || key === 'curl.setupdateprogressdialog', `${entry.name}: function is registered`);
    assert.ok(statuses.has(entry.status), `${entry.name}: valid status`);
    const [min, max] = arity[key] ?? assert.fail(`${entry.name}: missing arity bounds`);
    const count = signatureArity(entry.signature);
    assert.ok(count >= min && count <= max, `${entry.name}: signature has ${count} arguments, expected ${min}..${max}`);
    assert.equal(entry.examples.length, 0, `${entry.name}: network functions have no offline examples`);
    for (const example of entry.examples)
      assert.equal(evaluateText(example.formula), example.result, `${entry.name}: ${example.formula}`);
  }
});
