// + and - of short decimals give the decimal result, as FileMaker's decimal arithmetic does, also when the operands
// nearly cancel and the double's error is many units in the last place of the small result (123.45 - 123).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateText } from '../src/index.ts';

const e = (f: string) => evaluateText(f);

test('a difference of nearly equal short decimals has no binary noise', () => {
  assert.equal(e('123.45 - 123'), '0.45');
  assert.equal(e('19.99 - 20'), '-0.01');
  assert.equal(e('1.1 - 1'), '0.1');
  assert.equal(e('100.10 - 99.99'), '0.11');
  assert.equal(e('1234.56 + 0.01 - 1234.56'), '0.01');
  assert.equal(e('73799.54 - 46742.73'), '27056.81');
  assert.equal(e('81449.10 - 86202.22'), '-4753.12');
});

test('comparisons and rounding of those differences follow', () => {
  assert.equal(e('(123.45 - 123) = 0.45'), '1');
  assert.equal(e('Int ( ( 100.10 - 99.99 ) * 100 )'), '11');
  assert.equal(e('Case ( 12.10 - 12 = 0.10 ; "equal" ; "not equal" )'), 'equal');
});

test('sums and differences that need more digits keep them', () => {
  assert.equal(e('1 / 3 + 0.1'), '0.4333333333333333');
  assert.equal(e('Sqrt ( 2 ) - 1'), '0.4142135623730951');
  assert.equal(e('0.1234567890123456 + 1'), '1.123456789012346');
  assert.equal(e('1e20 + 0.5'), '100000000000000000000');
  assert.equal(e('3 - 1'), '2');
  assert.equal(e('0.5 - 0.5'), '0');
  assert.equal(e('-0.5 + 0.5'), '0');
});

// A seeded generator: the same two-decimal amounts every run.
function* amounts(count: number): Generator<[bigint, bigint, string, string]> {
  let seed = 12345;
  const next = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0);
  const text = (cents: bigint) => `${cents < 0n ? '-' : ''}${(cents < 0n ? -cents : cents) / 100n}.${String((cents < 0n ? -cents : cents) % 100n).padStart(2, '0')}`;
  for (let i = 0; i < count; i++) {
    const a = BigInt(next() % 20_000_000) - 5_000_000n;
    // Often close to the first, so the operands nearly cancel.
    const b = i % 2 ? a + BigInt(next() % 2001) - 1000n : BigInt(next() % 20_000_000) - 5_000_000n;
    yield [a, b, text(a), text(b)];
  }
}
/** Cents as the text FileMaker shows: no trailing zeros. */
const shown = (cents: bigint) => {
  const s = `${cents < 0n ? '-' : ''}${(cents < 0n ? -cents : cents) / 100n}.${String((cents < 0n ? -cents : cents) % 100n).padStart(2, '0')}`;
  return s.replace(/0+$/, '').replace(/\.$/, '');
};

test('20,000 random amounts to the cent add and subtract exactly', () => {
  const wrong: string[] = [];
  for (const [a, b, ta, tb] of amounts(20_000)) {
    // Parenthesised, so a negative amount is a number and not a sign on the whole.
    const sum = e(`( ${ta} ) + ( ${tb} )`);
    const diff = e(`( ${ta} ) - ( ${tb} )`);
    const expectSum = a + b === 0n ? '0' : shown(a + b);
    const expectDiff = a - b === 0n ? '0' : shown(a - b);
    if (sum !== expectSum) wrong.push(`${ta} + ${tb} = ${sum}, not ${expectSum}`);
    if (diff !== expectDiff) wrong.push(`${ta} - ${tb} = ${diff}, not ${expectDiff}`);
  }
  assert.deepEqual(wrong.slice(0, 5), []);
  assert.equal(wrong.length, 0);
});
