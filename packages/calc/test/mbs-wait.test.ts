import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateText } from '../src/index.ts';
import { mbsFunctionNames } from '../src/functions.ts';
import { MBS_MATH } from '../src/mbs-math.ts';
import { text } from '../src/values.ts';

for (const name of ['Time.Sleep', 'Time.Wait']) {
  const call = (args: string[], wait = (_ms: number) => {}) => MBS_MATH[name.toLowerCase()]({
    values: args.map(text), texts: args, now: () => new Date(0), wait,
  });
  test(name + ': normal seconds yield through the host', () => {
    assert.ok(mbsFunctionNames().includes(name.toLowerCase()));
    const seen: number[] = [];
    assert.deepEqual(call(['0.25'], ms => { seen.push(ms); }), { type: 'number', value: 0 });
    assert.deepEqual(seen, [250]);
  });
  test(name + ': empty and ambiguous forms remain unavailable', () => {
    for (const args of [[], [''], ['1', '2']]) assert.throws(() => call(args), /not available/);
  });
  test(name + ': huge input hits the bounded input budget', () => {
    assert.throws(() => call(['9'.repeat(1025)]), /too large/);
    assert.throws(() => call(['10.001']), /10 seconds/);
  });
  test(name + ': bad arguments never wait', () => {
    for (const value of ['no', '-1', 'Infinity', '1e999']) assert.throws(() => call([value]));
  });
  test(name + ': unicode numbers are not silently coerced', () => {
    assert.throws(() => call(['１２']), /not a number/);
    assert.deepEqual(call(['\u20031\u2003']), { type: 'number', value: 0 });
  });
  test(name + ': agrees with numeric sibling parsing', () => {
    assert.equal(call(['1e-3']).value, 0);
    assert.equal(evaluateText('MBS ( "Math.NumberToText" ; "1e-3" )'), '0.001');
  });
  test(name + ': plain calculations remain unavailable', () => {
    assert.match(evaluateText('MBS ( "' + name + '" ; 0 )'), /not available/);
  });
}
