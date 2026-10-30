import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CalcError, ERR, evaluate, evaluateText, type CalcContext, type CustomFunctionDef } from '../src/index.ts';

const defs = new Map<string, CustomFunctionDef>([
  ['sum1', { parameters: ['n'], formula: 'If ( n <= 0 ; 0 ; n + Sum1 ( n - 1 ) )' }],
  ['iseven', { parameters: ['n'], formula: 'If ( n = 0 ; 1 ; IsOdd ( n - 1 ) )' }],
  ['isodd', { parameters: ['n'], formula: 'If ( n = 0 ; 0 ; IsEven ( n - 1 ) )' }],
  ['replaced', { parameters: ['n'], formula: 'If ( n = 0 ; "" ; Substitute ( Replaced ( n - 1 ) & "x" ; "x" ; "y" ) )' }],
]);
const ctx: CalcContext = { customFunction: (name) => defs.get(name.toLowerCase()) };
function fails(formula: string): CalcError {
  try { evaluate(formula, ctx); } catch (e) { assert.ok(e instanceof CalcError); return e; }
  throw new Error(`${formula} did not fail`);
}
const defaultMessage = "Sum1 recursed too deeply: it passed Tabularius's limit of 10,000 nested calls. Rewrite Sum1 as a loop with While.";

test('a custom function names the exceeded Tabularius limit and suggests While', () => {
  const error = fails('Sum1 ( 10100 )');
  assert.equal(error.code, ERR.recursion);
  assert.equal(error.message, defaultMessage);
});

test('SetRecursion names its lower limit and cannot raise the Tabularius ceiling', () => {
  const lower = fails('SetRecursion ( Sum1 ( 50 ) ; 20 )');
  assert.equal(lower.code, ERR.recursion);
  assert.equal(lower.message, 'Sum1 recursed too deeply: it passed 20 nested calls, the limit SetRecursion set. Raise the limit in SetRecursion (up to 10,000), or rewrite Sum1 as a loop with While.');
  assert.equal(fails('SetRecursion ( Sum1 ( 10100 ) ; 50000 )').message, defaultMessage);
});

test('mutual recursion names the function at the exceeded call', () => {
  const error = fails('IsEven ( 10100 )');
  assert.equal(error.code, ERR.recursion);
  const match = /^(IsEven|IsOdd) recursed too deeply: it passed Tabularius's limit of 10,000 nested calls\. Rewrite (IsEven|IsOdd) as a loop with While\.$/.exec(error.message);
  assert.ok(match, error.message);
  assert.equal(match[1], match[2]);
});

test('a server stack overflow through a built-in also gives actionable error 1200', () => {
  const error = fails('Replaced ( 20000 )');
  assert.equal(error.code, ERR.recursion);
  assert.ok(error.message === "Replaced recursed too deeply: it passed Tabularius's limit of 10,000 nested calls. Rewrite Replaced as a loop with While." ||
    /^Replaced recursed too deeply: this server's stack ran out at level \d+ \(Tabularius allows 10,000 nested calls\)\. Rewrite Replaced as a loop with While\.$/.test(error.message), error.message);
});

test('EvaluationError keeps recursion code 1200', () => {
  assert.equal(evaluateText('EvaluationError ( Sum1 ( 10100 ) )', ctx), '1200');
});

test('While can run 20,000 iterations to replace deeper recursion', () => {
  assert.equal(evaluateText('While ( [ i = 0 ; s = 0 ] ; i < 20000 ; [ i = i + 1 ; s = s + i ] ; s )'), '200010000');
});
