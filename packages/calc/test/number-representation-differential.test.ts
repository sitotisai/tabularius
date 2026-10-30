import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateText } from '../src/index.ts';

const evaluate = (formula: string) => evaluateText(formula);

// Inputs are represented as integer millionths, so the oracle never passes
// through a JavaScript number. The PRNG and corpus are fixed for reproducibility.
const SCALE = 1_000_000n;
const formatAt = (scaled: bigint, scale: bigint): string => {
  const negative = scaled < 0n;
  const magnitude = negative ? -scaled : scaled;
  const whole = magnitude / scale;
  const places = scale.toString().length - 1;
  const fraction = (magnitude % scale).toString().padStart(places, '0').replace(/0+$/, '');
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
};
const format = (scaled: bigint) => formatAt(scaled, SCALE);
const longDecimal = (value: bigint) => {
  const digits = (value < 0n ? -value : value).toString().replace(/0+$/, '').length;
  return value % SCALE !== 0n && digits > 15;
};
const largeWhole = (value: bigint) => value % SCALE === 0n && (value < 0n ? -value : value) / SCALE > BigInt(Number.MAX_SAFE_INTEGER);
const mixedWithLargeWhole = (a: bigint, b: bigint) => (a % SCALE !== 0n && largeWhole(b)) || (b % SCALE !== 0n && largeWhole(a));
const floorDiv = (a: bigint, b: bigint): bigint => {
  const q = a / b;
  const r = a % b;
  return r !== 0n && ((r < 0n) !== (b < 0n)) ? q - 1n : q;
};
const random = (seed: number) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed;
};
const generated = (next: () => number, decimal: boolean): bigint => {
  // Decimal cases use six fractional places and stay within 40 significant
  // digits total; whole-number cases can use all 40 digits before the point.
  const digits = decimal ? 7 + next() % 34 : 1 + next() % 40;
  const wholeDigits = decimal ? digits - 6 : digits;
  let whole = String(1 + next() % 9);
  while (whole.length < wholeDigits) whole += String(next() % 10);
  const fraction = decimal ? 1 + next() % 999_999 : 0;
  const value = BigInt(whole) * SCALE + BigInt(fraction);
  return next() % 2 ? -value : value;
};

test('number operators and functions agree with a seeded scaled-integer oracle', () => {
  const next = random(0x4c3331);
  const disagreements = new Map<string, string[]>();
  const check = (operation: string, formula: string, expected: string, index: number) => {
    const actual = evaluate(formula);
    if (actual !== expected) {
      const examples = disagreements.get(operation) ?? [];
      if (examples.length < 3) examples.push(`#${index}: ${formula} => ${actual}; expected ${expected}`);
      disagreements.set(operation, examples);
    }
  };

  for (let i = 0; i < 2_000; i++) {
    const a = generated(next, i % 4 === 1 || i % 4 === 3);
    const b = generated(next, i % 4 === 2 || i % 4 === 3) || SCALE;
    const x = format(a), y = format(b);
    const sum = a + b;
    const difference = a - b;
    if (!longDecimal(a) && !longDecimal(b) && !mixedWithLargeWhole(a, b)) {
      check('+', `${x} + ${y}`, format(sum), i);
      check('-', `${x} - ${y}`, format(difference), i);
      check('*', `${x} * ${y}`, formatAt(a * b, SCALE * SCALE), i);
      check('^', `${x} ^ 2`, formatAt(a * a, SCALE * SCALE), i);
    }
    check('unary-', `- ( ${x} )`, format(-a), i);
    check('=', `${x} = ${y}`, a === b ? '1' : '0', i);
    check('≠', `${x} ≠ ${y}`, a !== b ? '1' : '0', i);
    check('<', `${x} < ${y}`, a < b ? '1' : '0', i);
    check('>', `${x} > ${y}`, a > b ? '1' : '0', i);
    check('≤', `${x} ≤ ${y}`, a <= b ? '1' : '0', i);
    check('≥', `${x} ≥ ${y}`, a >= b ? '1' : '0', i);

    // These formulas use six-place fixed-point operands; expected division
    // outputs are truncated at the calculator's six decimal input places.
    const quotient = a * SCALE / b;
    if (!longDecimal(a) && !longDecimal(b) && (a * SCALE) % b === 0n) check('/', `${x} / ${y}`, format(quotient), i);
    if (!longDecimal(a)) check('/ by 2', `${x} / 2`, formatAt(a * 5n, 10n * SCALE), i);
    const div = floorDiv(a, b);
    check('Div', `Div ( ${x} ; ${y} )`, String(div), i);
    check('Mod', `Mod ( ${x} ; ${y} )`, format(a - b * div), i);
    check('Abs', `Abs ( ${x} )`, format(a < 0n ? -a : a), i);
    check('Int', `Int ( ${x} )`, String(a / SCALE), i);
    const magnitude = a < 0n ? -a : a;
    const rounded = (magnitude / (SCALE / 100n) + (magnitude % (SCALE / 100n) >= SCALE / 200n ? 1n : 0n))
      * (SCALE / 100n) * (a < 0n ? -1n : 1n);
    check('Round', `Round ( ${x} ; 2 )`, format(rounded), i);
    check('Truncate', `Truncate ( ${x} ; 2 )`, format(a / (SCALE / 100n) * (SCALE / 100n)), i);
    // The documented Sum/Average cutoff beyond 15 significant decimal digits
    // is retained; the exact integer and shorter-decimal cases use the oracle.
    if (!longDecimal(a) && !longDecimal(b)) {
      check('Sum', `Sum ( ${x} ; ${y} )`, format(sum), i);
      const wholeInputs = a % SCALE === 0n && b % SCALE === 0n;
      const legacyLargeWholeAverage = wholeInputs && (largeWhole(a) || largeWhole(b)) && (a + b) % (2n * SCALE) !== 0n;
      if (!legacyLargeWholeAverage) check('Average', `Average ( ${x} ; ${y} )`, formatAt((a + b) * 5n, 10n * SCALE), i);
    }
    check('Max', `Max ( ${x} ; ${y} )`, format(a > b ? a : b), i);
    check('Min', `Min ( ${x} ; ${y} )`, format(a < b ? a : b), i);
    check('GetAsNumber', `GetAsNumber ( "${x}" )`, x, i);
    check('number-to-text', `GetAsText ( ${x} )`, x, i);
    check('text-to-number', `GetAsNumber ( GetAsText ( ${x} ) )`, x, i);

    // SerialIncrement takes a digit run and an exact integer increment.
    const serial = (a < 0n ? -a : a) / SCALE;
    const increment = b / SCALE;
    check('SerialIncrement', `SerialIncrement ( "${serial}" ; ${increment} )`, String(serial + increment).padStart(serial.toString().length, '0'), i);
  }
  assert.equal(evaluate('Sum ( 0.1234567890123456 )'), '0.1234567890123456');
  assert.equal(evaluate('Average ( 100000000000000000007 ; 100000000000000000008 )'), '100000000000000000000');
  assert.deepEqual(Object.fromEntries(disagreements), {}, `differential disagreements: ${JSON.stringify(Object.fromEntries(disagreements))}`);
});

test('a decimal literal shows without trailing zeros, as a number does', () => {
  assert.equal(evaluate('1.50'), '1.5');
  assert.equal(evaluate('2.0'), '2');
  assert.equal(evaluate('.5'), '0.5');
  assert.equal(evaluate('1.20 & "x"'), '1.2x');
  assert.equal(evaluate('GetAsText ( 100.00 )'), '100');
  assert.equal(evaluate('Let ( x = 1.50 ; x )'), '1.5');
});
