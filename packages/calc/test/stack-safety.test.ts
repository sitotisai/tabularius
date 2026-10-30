// The evaluator keeps its own stack, so a formula's nesting never runs JavaScript's out: a custom function that
// waits for its own result recurses as far as FileMaker allows (10,000 calls), and anything deeper ends in
// FileMaker's error, never a RangeError that would fail a whole read or write in the store.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CalcError, ERR, evaluate, evaluateText, explainEvaluation, compile, type CalcContext, type CustomFunctionDef, type Value } from '../src/index.ts';

const defs = new Map<string, CustomFunctionDef>([
  // Each waits for the call below it: the classic shapes a FileMaker developer writes.
  ['sum1', { parameters: ['n'], formula: 'If ( n <= 0 ; 0 ; n + Sum1 ( n - 1 ) )' }],
  ['sumlet', { parameters: ['n', 'acc'], formula: 'Let ( [ nn = n - 1 ; a = acc + n ] ; If ( n = 0 ; acc ; SumLet ( nn ; a ) ) )' }],
  ['sumand', { parameters: ['n', 'acc'], formula: 'If ( n = 0 ; acc ; Let ( [ nn = n - 1 ; a = acc + n ] ; SumAnd ( nn ; a ) ) )' }],
  ['sumcase', { parameters: ['n'], formula: 'Case ( n <= 0 ; 0 ; n + SumCase ( n - 1 ) )' }],
  ['items', { parameters: ['n'], formula: 'If ( n = 0 ; "" ; List ( n ; Items ( n - 1 ) ) )' }],
  ['joined', { parameters: ['n'], formula: 'If ( n = 0 ; "" ; n & "," & Joined ( n - 1 ) )' }],
  ['biggest', { parameters: ['n'], formula: 'If ( n <= 0 ; 0 ; Max ( n ; Biggest ( n - 1 ) ) )' }],
  ['total', { parameters: ['n'], formula: 'If ( n <= 0 ; 0 ; Sum ( n ; Total ( n - 1 ) ) )' }],
  ['rounded', { parameters: ['n'], formula: 'If ( n <= 0 ; 0 ; Round ( n / 4 + Rounded ( n - 1 ) ; 2 ) )' }],
  ['asnumber', { parameters: ['n'], formula: 'If ( n <= 0 ; 0 ; GetAsNumber ( n + AsNumber ( n - 1 ) ) )' }],
  ['chosen', { parameters: ['n'], formula: 'Choose ( n > 0 ; 0 ; n + Chosen ( n - 1 ) )' }],
  ['negated', { parameters: ['n'], formula: 'If ( n <= 0 ; 0 ; - ( - n - Negated ( n - 1 ) ) )' }],
  ['iseven', { parameters: ['n'], formula: 'If ( n = 0 ; 1 ; IsOdd ( n - 1 ) )' }],
  ['isodd', { parameters: ['n'], formula: 'If ( n = 0 ; 0 ; IsEven ( n - 1 ) )' }],
  ['both', { parameters: ['n'], formula: 'If ( n = 0 ; 0 ; Both ( n - 1 ) + Both ( n - 1 ) )' }],
  // Through a built-in that reads its arguments itself: the engine's stack is used once per level.
  ['replaced', { parameters: ['n'], formula: 'If ( n = 0 ; "" ; Substitute ( Replaced ( n - 1 ) & "x" ; "x" ; "y" ) )' }],
  ['forever', { parameters: ['n'], formula: 'n + Forever ( n + 1 )' }],
]);
const ctx: CalcContext = { customFunction: (name) => defs.get(name.toLowerCase()) };
const sumTo = (n: number) => String((n * (n + 1)) / 2);

test('a custom function that waits for its own call recurses as deep as FileMaker allows', () => {
  assert.equal(evaluateText('Sum1 ( 9990 )', ctx), sumTo(9990));
  assert.equal(evaluateText('SumCase ( 9990 )', ctx), sumTo(9990));
  assert.equal(evaluateText('Negated ( 9990 )', ctx), sumTo(9990));
  assert.equal(evaluateText('Chosen ( 9990 )', ctx), sumTo(9990));
  assert.equal(evaluateText('IsEven ( 9990 )', ctx), '1');
  assert.equal(evaluateText('IsEven ( 9989 )', ctx), '0');
});

test('a Let around the recursive call, on either side of the If, recurses as deep as FileMaker allows', () => {
  assert.equal(evaluateText('SumLet ( 9990 ; 0 )', ctx), sumTo(9990));
  assert.equal(evaluateText('SumAnd ( 9990 ; 0 )', ctx), sumTo(9990));
});

test('recursion through aggregates, text joins and number functions goes as deep', () => {
  assert.equal(evaluateText('ValueCount ( Items ( 9990 ) )', ctx), '9990');
  assert.equal(evaluateText('Left ( Items ( 9990 ) ; 9 )', ctx), '9990\r9989');
  assert.equal(evaluateText('PatternCount ( Joined ( 9990 ) ; "," )', ctx), '9990');
  assert.equal(evaluateText('Biggest ( 9990 )', ctx), '9990');
  assert.equal(evaluateText('Total ( 9990 )', ctx), sumTo(9990));
  assert.equal(evaluateText('Rounded ( 9990 )', ctx), String(Math.round((9990 * 9991) / 8 * 100) / 100));
  assert.equal(evaluateText('AsNumber ( 9990 )', ctx), sumTo(9990));
});

test("FileMaker's limit of 10,000 calls ends a function that waits for its own call, with the same error as a tail call", () => {
  const limitOf = (name: string) => (e: unknown) => e instanceof CalcError && e.code === ERR.recursion && e.message === `${name} recursed too deeply`;
  assert.throws(() => evaluate('Sum1 ( 10100 )', ctx), limitOf('Sum1'));
  assert.throws(() => evaluate('SumLet ( 10100 ; 0 )', ctx), limitOf('SumLet'));
  assert.throws(() => evaluate('Forever ( 1 )', ctx), limitOf('Forever'));
  assert.throws(() => evaluate('SetRecursion ( Sum1 ( 50 ) ; 20 )', ctx), limitOf('Sum1'));
  assert.equal(evaluateText('SetRecursion ( Sum1 ( 50 ) ; 100 )', ctx), '1275');
});

test('a caught runaway leaves nothing behind: Let names, the call depth and later calls are clean', () => {
  const ctx2: CalcContext = { ...ctx, setVariable: () => {}, variable: () => undefined };
  assert.equal(evaluateText('Let ( [ x = 1 ; e = EvaluationError ( Sum1 ( 10100 ) ) ] ; x & "|" & e & "|" & Sum1 ( 10 ) & "|" & x )', ctx2), '1|1200|55|1');
  // Names bound inside the failed recursion are not visible afterwards.
  assert.equal(evaluateText('Let ( e = EvaluationError ( SumLet ( 10100 ; 0 ) ) ; IsValid ( nn ) )', { ...ctx2, field: () => undefined }), '0');
  // And the runaway can run again, to the same answer.
  assert.equal(evaluateText('EvaluationError ( Forever ( 1 ) ) & EvaluationError ( Forever ( 1 ) )', ctx), '12001200');
});

test('recursion through a built-in that reads its own arguments works far down, and past the stack gives the error, never a crash', () => {
  assert.equal(evaluateText('Length ( Replaced ( 400 ) )', ctx), '400');
  // How far this goes depends on the server's stack; what is fixed is that the answer is right or the error is FileMaker's.
  for (const n of [3000, 9990]) {
    let length: Value | undefined;
    try {
      length = evaluate(`Length ( Replaced ( ${n} ) )`, ctx);
    } catch (e) {
      assert.ok(e instanceof CalcError && /Replaced recursed too deeply \(this server's stack ran out at level \d+; FileMaker allows 10000\)/.test(e.message), `Replaced ( ${n} ) threw ${String(e)}`);
    }
    if (length) assert.equal(length.value, n);
  }
  assert.throws(() => evaluate('Replaced ( 20000 )', ctx), (e) => e instanceof CalcError && /Replaced recursed too deeply/.test(e.message));
});

test('a function called twice per level is stopped by the work budget, not the stack', () => {
  assert.equal(evaluateText('Both ( 10 )', ctx), '0');
  assert.throws(() => evaluate('Both ( 100 )', ctx), (e) => e instanceof CalcError && /work budget/.test(e.message));
});

test('a formula nested as deep as the parser allows evaluates', () => {
  assert.equal(evaluateText('('.repeat(999) + '1' + ')'.repeat(999)), '1');
  assert.equal(evaluateText('-'.repeat(998) + '1'), '1');
  assert.equal(evaluateText('Abs ( '.repeat(500) + '-1' + ' )'.repeat(500)), '1');
  assert.equal(evaluateText('Round ( '.repeat(500) + '1.5' + ' ; 0 )'.repeat(500)), '2');
  assert.equal(evaluateText('If ( 1 ; '.repeat(500) + '1' + ' ; 0 )'.repeat(500)), '1');
  assert.equal(evaluateText('Let ( x = 1 ; '.repeat(500) + 'x' + ' )'.repeat(500)), '1');
  assert.equal(evaluateText('Sum ( 1 ; '.repeat(500) + '1' + ' )'.repeat(500)), '501');
  assert.equal(evaluateText('Max ( 1 ; '.repeat(500) + '2' + ' )'.repeat(500)), '2');
  assert.equal(evaluateText('1 + '.repeat(999) + '1'), '1000');
  assert.equal(evaluateText('"a" & '.repeat(999) + '"a"').length, 1000);
  // Text read as a formula inside text read as a formula, as deep as Evaluate allows.
  const nested: CalcContext = { customFunction: (name) => (name.toLowerCase() === 'ev' ? { parameters: ['n'], formula: 'If ( n = 0 ; 1 ; Evaluate ( "Ev ( " & ( n - 1 ) & " )" ) + 1 )' } : undefined) };
  assert.equal(evaluateText('Ev ( 99 )', nested), '100');
  assert.equal(evaluateText('Ev ( 150 )', nested), '?');
});

test('a number function evaluates its argument once, so nested calls take linear work', () => {
  // Abs and Round have a decimal path; it used to read the argument, then read it again for the plain answer.
  const started = performance.now();
  assert.equal(evaluateText('Abs ( '.repeat(60) + '-2' + ' )'.repeat(60)), '2');
  assert.equal(evaluateText('Round ( '.repeat(60) + '2.25' + ' ; 1 )'.repeat(60)), '2.3');
  assert.equal(evaluateText('Int ( '.repeat(60) + '2.9' + ' )'.repeat(60)), '2');
  assert.ok(performance.now() - started < 1000, `took ${Math.round(performance.now() - started)} ms`);
  let reads = 0;
  assert.equal(evaluateText('Abs ( Round ( Truncate ( Max ( F ; 1 ) ; 2 ) ; 1 ) )', { field: (ref) => { if (ref.field !== 'F') return undefined; reads++; return { type: 'number', value: -3 }; } }), '1');
  assert.equal(reads, 1);
});

test('the step by step explanation of a deep recursion keeps the shape a shallow one has', () => {
  const shallow = explainEvaluation(compile('Sum1 ( 3 )'), ctx);
  assert.equal(shallow.value && 'value' in shallow.value ? String(shallow.value.value) : undefined, '6');
  assert.equal(shallow.step?.expr, 'Sum1 ( 3 )');
  assert.equal(shallow.step?.steps?.[0].expr, 'If ( n <= 0 ; 0 ; n + Sum1 ( n - 1 ) )');
  const deep = explainEvaluation(compile('Sum1 ( 2000 )'), ctx, { maxSteps: 50 });
  assert.equal(deep.value && 'value' in deep.value ? String(deep.value.value) : undefined, sumTo(2000));
  assert.equal(deep.step?.expr, 'Sum1 ( 2000 )');
  assert.equal(deep.truncated, true);
  let traced = 0;
  assert.equal(evaluateText('Sum1 ( 5000 )', { ...ctx, trace: () => { traced++; } }), sumTo(5000));
  assert.ok(traced > 5000 * 4, `${traced} steps traced`);
});
