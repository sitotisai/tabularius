import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateText, NameTable, type CalcContext } from '../src/index.ts';

const ctx = {
  names: new NameTable({ fields: [], occurrences: [] }),
  occurrence: 'T',
  field: () => { throw new Error('no fields'); },
  related: () => [],
  now: () => new Date(2026, 9, 15, 14, 30, 0),
} as CalcContext;
const f = (formula: string) => evaluateText(formula, ctx);

test('a whole number written with an exponent keeps every digit, as one written out does', () => {
  assert.equal(f('1e21 + 1'), '1' + '0'.repeat(20) + '1');
  assert.equal(f('123e20 + 1'), '123' + '0'.repeat(19) + '1');
  assert.equal(f('1.5e30 + 1'), '15' + '0'.repeat(28) + '1');
  assert.equal(f('1e30 - 1'), '9'.repeat(30));
  assert.equal(f('2e20 * 3'), '6' + '0'.repeat(20));
  assert.equal(f('1e308 * 10'), '1' + '0'.repeat(309));
  assert.equal(f('1e308 + 1e308'), '2' + '0'.repeat(308));
  assert.equal(f('-1e308 - 1e308'), '-2' + '0'.repeat(308));
  assert.equal(f('1e21 + 1 - 1e21'), '1');
  assert.equal(f('1e21 = 1000000000000000000000'), '1');
  assert.equal(f('1e21 + 1 > 1e21'), '1');
  assert.equal(f('1.8e308'), '18' + '0'.repeat(307));
  assert.equal(f('1e309 = 10^309'), '1');
});

test('numbers written with an exponent that are not whole numbers, or that are small, are unchanged', () => {
  assert.equal(f('1e-7 * 3'), '0.0000003');
  assert.equal(f('1.5e3'), '1500');
  assert.equal(f('1.25e1 + 1'), '13.5');
  assert.equal(f('2e15 + 1'), '2000000000000001');
  assert.equal(f('1e22'), '1' + '0'.repeat(22));
  assert.equal(f('1.5e-30 * 2'), '0.' + '0'.repeat(29) + '3');
  assert.equal(f('1e399'), '1' + '0'.repeat(399));
  assert.equal(f('1e399 * 10'), '?');
  assert.equal(f('1e400'), '?');
  assert.equal(f('1e200 * 1e200'), '?');
});

test('a number just under the largest double is written in digits, not as an infinity', () => {
  for (const formula of [
    '1.7976931348623157e308',
    'Abs ( 1.7976931348623157e308 )',
    'Max ( 1.7976931348623157e308 )',
    'Truncate ( 1.7976931348623157e308 ; 0 )',
    'GetAsText ( 1.7976931348623157e308 )',
  ]) {
    const result = f(formula);
    assert.ok(!result.includes('∞') && !result.includes('Infinity'), formula);
  }
  assert.equal(f('Round ( 1.797693134862316e308 ; 0 )'), '1797693134862316' + '0'.repeat(293));
  assert.ok(f('-1.7976931348623157e308').startsWith('-17976931348623'));
  assert.equal(f('Exp ( 710 )'), '?');
});
