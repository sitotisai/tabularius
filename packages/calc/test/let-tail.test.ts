import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateText, NameTable, num, type CalcContext, type Value } from '../src/index.ts';

// Custom functions whose bodies are Let calculations must give the same results, and run the same side effects the
// same number of times, as they did before a Let body could carry a tail call.
const defs: Record<string, { parameters: string[]; formula: string }> = {
  BindRec: { parameters: ['n'], formula: 'Let ( [ r = If ( n = 0 ; 0 ; BindRec ( n - 1 ) ) ] ; r + 1 )' },
  Counter: { parameters: ['n'], formula: 'Let ( [ $c = $c + 1 ] ; n * 2 )' },
  CounterTail: { parameters: ['n'], formula: 'Let ( [ $c = $c + 1 ] ; If ( n = 0 ; $c ; CounterTail ( n - 1 ) ) )' },
  ChainA: { parameters: ['n'], formula: 'Let ( [ r = ChainB ( n ) ] ; r + 1 )' },
  ChainB: { parameters: ['n'], formula: 'Let ( [ r = ChainC ( n ) ] ; r + 1 )' },
  ChainC: { parameters: ['n'], formula: 'Let ( [ $$g = $$g + 1 ] ; n )' },
  SumLet: { parameters: ['n', 'acc'], formula: 'Let ( [ nn = n - 1 ; a = acc + n ] ; If ( n = 0 ; acc ; SumLet ( nn ; a ) ) )' },
  Ev: { parameters: ['n'], formula: 'Let ( [ m = n - 1 ] ; If ( n = 0 ; 1 ; Od ( m ) ) )' },
  Od: { parameters: ['n'], formula: 'Let ( [ m = n - 1 ] ; If ( n = 0 ; 0 ; Ev ( m ) ) )' },
  Forever: { parameters: ['n'], formula: 'Let ( [ m = n + 1 ] ; Forever ( m ) )' },
  Gfn: { parameters: ['p'], formula: 'Let ( [ q = p ] ; GetFieldName ( q ) )' },
  GfnTail: { parameters: ['p'], formula: 'Let ( [ p = 7 ] ; Gfn ( p ) )' },
  GfnField: { parameters: ['p'], formula: 'Let ( [ q = 1 ] ; Gfn ( p ) )' },
};
function run(formula: string): string {
  const vars = new Map<string, Value>();
  const c: CalcContext = {
    names: new NameTable({ fields: ['Fieldy'] }),
    occurrence: 'T',
    field: () => num(1),
    customFunction: (n) => defs[n],
    variable: (n) => vars.get(n),
    setVariable: (n, _r, v) => void vars.set(n, v),
  };
  return evaluateText(formula, c);
}

test('a Let body that ends in no custom-function call evaluates each binding once', () => {
  assert.equal(run('Let ( $c = 0 ; Counter ( 3 ) & "/" & $c )'), '6/1');
  assert.equal(run('Let ( $$g = 0 ; ChainA ( 1 ) & "/" & $$g )'), '3/1');
});

test('a tail call through a Let runs the bindings once per call', () => {
  assert.equal(run('Let ( $c = 0 ; CounterTail ( 3 ) & "/" & $c )'), '4/4');
});

test('a recursive call inside a Let binding stays linear', () => {
  assert.equal(run('BindRec ( 18 )'), '19');
  assert.equal(run('BindRec ( 200 )'), '201');
});

test('tail recursion through a Let goes deep, including between two functions', () => {
  assert.equal(run('SumLet ( 5000 ; 0 )'), '12502500');
  assert.equal(run('Ev ( 5000 )'), '1');
  assert.equal(run('Ev ( 5001 )'), '0');
});

test('endless tail recursion through a Let ends with the normal error', () => {
  assert.equal(run('Forever ( 0 )'), '?');
});

test('a Let variable that shadows a parameter does not pass on the parameter\'s field name', () => {
  assert.equal(run('Let ( p = Fieldy ; GfnTail ( p ) )'), '?');
  assert.equal(run('Let ( p = Fieldy ; GfnField ( p ) )'), 'T::Fieldy');
});
