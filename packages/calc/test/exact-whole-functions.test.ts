import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateText, NameTable, type CalcContext } from '../src/index.ts';

const ctx = {
  names: new NameTable({ fields: [], occurrences: [] }),
  occurrence: 'T',
  field: () => { throw new Error('no fields'); },
  related: () => [],
} as unknown as CalcContext;
const f = (formula: string) => evaluateText(formula, ctx);
const factorial = (n: number): bigint => {
  let result = 1n;
  for (let i = 2; i <= n; i++) result *= BigInt(i);
  return result;
};
const combination = (n: number, k: number): bigint => factorial(n) / (factorial(k) * factorial(n - k));

test('Factorial keeps every digit past 2^53', () => {
  for (const n of [19, 100, 170, 171]) assert.equal(f(`Factorial ( ${n} )`), factorial(n).toString());
  assert.equal(f('Factorial ( 25 )'), '15511210043330985984000000');
  assert.equal(f('Factorial ( 25 ; 3 )'), '13800');
  assert.equal(f('Factorial ( 9007199254740991 ; 2 )'), (9007199254740991n * 9007199254740990n).toString());
  assert.equal(f('Factorial ( 25 ) - 25*24*23*22*21*20*19*18*17*16*15*14*13*12*11*10*9*8*7*6*5*4*3*2'), '0');
  assert.throws(() => f('Factorial ( 2^70 ; 2 )'), /work budget/);
});

test('Factorial of small and unusual arguments is unchanged', () => {
  for (const [formula, expected] of [
    ['Factorial ( 0 )', '1'], ['Factorial ( 5 )', '120'], ['Factorial ( 18 )', '6402373705728000'],
    ['Factorial ( 5 ; 3 )', '60'], ['Factorial ( 5 ; 6 )', '120'],
    ['Factorial ( 5.5 )', '120'], ['Factorial ( "" )', ''],
    ['Combination ( 5.5 ; 2.5 )', '10'], ['Combination ( 10 ; -1 )', '1'],
  ]) assert.equal(f(formula), expected);
});

test('a Factorial past 400 digits is ?', () => {
  assert.ok(factorial(300).toString().length > 400);
  assert.equal(f('Factorial ( 300 )'), '?');
  assert.equal(f('Factorial ( 1000 )'), '?');
});

test('Combination keeps every digit past 2^53', () => {
  for (const [n, k, expected] of [
    [60, 30, '118264581564861424'],
    [100, 50, '100891344545564193334812497256'],
    [70, 35, '112186277816662845432'],
    [200, 100, '90548514656103281165404177077484163874504589675413336841320'],
    [20, 10, '184756'], [10, 0, '1'],
  ] as const) {
    assert.equal(combination(n, k).toString(), expected);
    assert.equal(f(`Combination ( ${n} ; ${k} )`), expected);
  }
  assert.equal(f('Combination ( 5 ; 6 )'), '0');
});

test('Sqrt of a whole perfect square past 2^53 is exact; any other root is the double', () => {
  for (const [formula, expected] of [
    ['Sqrt ( 2^140 )', '1180591620717411303424'],
    ['Sqrt ( 123456789012345678901^2 )', '123456789012345678901'],
    ['Sqrt ( 10^40 )', '100000000000000000000'], ['Sqrt ( 16 )', '4'],
    ['Sqrt ( 2 )', '1.414213562373095'],
    ['Sqrt ( 2^140 + 1 )', '1180591620717411000000'],
    ['Sqrt ( -1 )', '?'], ['Sqrt ( 0 )', '0'],
  ]) assert.equal(f(formula), expected);
});

test('the variance functions of whole numbers past 2^53 use exact sums', () => {
  for (const [formula, expected] of [
    ['Variance ( 2^70 ; 2^70 + 2 )', '2'], ['VarianceP ( 2^70 ; 2^70 + 2 )', '1'],
    ['StDevP ( 2^70 ; 2^70 + 4 )', '2'], ['StDev ( 2^70 ; 2^70 + 2 )', '1.414213562373095'],
    ['Variance ( 2^70 ; 2^70 + 1 )', '0.5'],
    ['Variance ( 2^70 ; 2^70 + 1 ; 2^70 + 3 )', '2.333333333333333'],
    ['StDev ( 2^70 )', '?'], ['Variance ( 2^70 )', '?'],
  ]) assert.equal(f(formula), expected);
});

test('the variance functions of ordinary numbers are unchanged', () => {
  for (const [formula, expected] of [
    ['Variance ( 1 ; 2 ; 3 )', '1'], ['VarianceP ( 1 ; 2 ; 3 )', '0.6666666666666666'],
    ['StDevP ( 1 ; 2 ; 3 )', '0.816496580927726'],
    ['Variance ( 0.1 ; 0.2 ; 0.3 )', '0.01'], ['StDev ( 5 )', '?'],
  ]) assert.equal(f(formula), expected);
});
