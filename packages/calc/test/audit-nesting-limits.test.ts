// Nesting that a person can store in a field must end in the error value, never in a JavaScript exception: the
// store rethrows anything that is not a calculation error, so a raw RangeError fails the whole read or write.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CalcError, evaluate, evaluateText, text, type CalcContext } from '../src/index.ts';

const nested = (levels: number) => '['.repeat(levels) + ']'.repeat(levels);
const withField = (value: string): CalcContext => ({ field: (ref) => (ref.field === 'F' ? text(value) : undefined) });

const JSON_FORMULAS = [
  'JSONGetElement ( F ; "[0]" )',
  'JSONGetElement ( F ; "[0][0]" )',
  'JSONFormatElements ( F )',
  'JSONSetElement ( F ; "[1]" ; 1 ; 2 )',
  'JSONDeleteElement ( F ; "[1]" )',
  'JSONDeleteElement ( F ; "[0]" )',
  'JSONListValues ( F ; "" )',
  'JSONListKeys ( F ; "" )',
  'JSONGetElementType ( F ; "[0]" )',
];

for (const levels of [3000, 9000, 200_000]) {
  test(`a JSON text nested ${levels} levels gives an error value from every JSON function`, () => {
    const ctx = withField(nested(levels));
    for (const formula of JSON_FORMULAS) {
      const result = evaluateText(formula, ctx);
      assert.match(result, /^\?/, `${formula} gave ${result.slice(0, 40)}`);
    }
    // JSONParse and the others agree on what is valid.
    assert.match(evaluateText('JSONParse ( F )', ctx), /^\? .*nested/);
  });
}

test('a JSON text nested within the limit still works', () => {
  const ctx = withField(nested(400));
  assert.equal(evaluateText('JSONParse ( F )', ctx), nested(400));
  assert.equal(evaluateText('JSONGetElement ( F ; "[0]" )', ctx), nested(399));
  assert.match(evaluateText('JSONFormatElements ( F )', ctx), /^\[\r\t/);
  assert.equal(evaluateText('JSONSetElement ( "[]" ; "[0]" ; 1 ; 2 )', {}), '[1]');
  assert.equal(evaluateText('JSONGetElement ( "{\\"a\\":{\\"b\\":[1,2]}}" ; "a.b[1]" )', {}), '2');
});

test('JSONSetElement refuses a path that would make the document too deep', () => {
  assert.match(evaluateText(`JSONSetElement ( "{}" ; "${'[0]'.repeat(5000)}" ; 1 ; 2 )`, {}), /^\?/);
  assert.match(evaluateText(`JSONDeleteElement ( "{}" ; "${'a.'.repeat(5000)}" )`, {}), /^\?|^\{\}$/);
});

test('JSON values nested in a typed argument are checked too', () => {
  const deep = nested(5000);
  assert.match(evaluateText(`JSONSetElement ( "{}" ; "a" ; "${deep}" ; 4 )`, {}), /^\?/);
  assert.match(evaluateText(`JSONSetElement ( "{}" ; "a" ; "${deep}" ; 0 )`, {}), /^\?/);
});

test('JSONSetElement and JSONDeleteElement refuse a result nested past the limit, even from two documents within it', () => {
  const d = nested(512);
  // The document and the path are each within the limit; together they make 1023 levels.
  const result = evaluateText(`JSONSetElement ( D ; "${'[0]'.repeat(511)}" ; D ; 4 )`, { field: (ref) => (ref.field === 'D' ? text(d) : undefined) });
  assert.match(result, /^\? .*nested more than 512/);
  // Nothing deeper than the limit is kept to be read back by the next function.
  const ctx = { field: (ref: { field: string }) => (ref.field === 'D' ? text(d) : undefined) } as CalcContext;
  assert.match(evaluateText(`Let ( r = JSONSetElement ( D ; "${'[0]'.repeat(511)}" ; D ; 4 ) ; JSONParse ( r ) )`, ctx), /^\?/);
  // The same inside the limit works and reads back.
  const ok = evaluateText(`JSONSetElement ( "[[]]" ; "[0][0]" ; Left ( D ; 510 ) & Right ( D ; 510 ) ; 4 )`, ctx);
  assert.equal(ok, `[[${nested(510)}]]`);
  assert.match(evaluateText(`JSONSetElement ( "[[]]" ; "[0][0]" ; D ; 4 )`, ctx), /^\?/);
});

test('JSONMakeArray refuses a list of documents that makes the array too deep', () => {
  const ctx = { field: (ref: { field: string }) => (ref.field === 'D' ? text(nested(512)) : undefined) } as CalcContext;
  assert.match(evaluateText('JSONMakeArray ( D ; "|" ; 0 )', ctx), /^\? .*nested more than 512/);
  assert.match(evaluateText('JSONParse ( JSONMakeArray ( D ; "|" ; 0 ) )', ctx), /^\?/);
  assert.equal(evaluateText('JSONMakeArray ( "[1]|[2]" ; "|" ; 4 )', {}), '[[1],[2]]');
});

test('reading with a long path keeps the answer it had; only changing a document is limited to 512 parts', () => {
  assert.equal(evaluateText(`JSONGetElement ( "[1]" ; "${'[0]'.repeat(600)}" )`, {}), '');
  assert.equal(evaluateText(`JSONGetElementType ( "[1]" ; "${'[0]'.repeat(600)}" )`, {}), '');
  assert.match(evaluateText(`JSONSetElement ( "[]" ; "${'[0]'.repeat(600)}" ; 1 ; 2 )`, {}), /^\? .*512 parts/);
  assert.match(evaluateText(`JSONDeleteElement ( "[]" ; "${'[0]'.repeat(600)}" )`, {}), /^\? .*512 parts/);
});

test('Evaluate nested through itself ends in the error value', () => {
  // A field holding text that evaluates itself, as a self-referencing calculation field does.
  const ctx = withField('Evaluate ( F )');
  assert.equal(evaluateText('Evaluate ( F )', ctx), '?');
  assert.throws(() => evaluate('Evaluate ( F )', ctx), (e) => e instanceof CalcError && /Evaluate.*(nested|deep)/i.test(e.message));
  assert.equal(evaluateText('EvaluationError ( Evaluate ( F ) )', ctx), '1200');
  // Text that evaluates the field twice per level is refused as well, not run to the end of its work budget.
  assert.equal(evaluateText('Evaluate ( G )', { field: (ref) => (ref.field === 'G' ? text('Evaluate ( G ) & Evaluate ( G )') : undefined) }), '?');
});

test('Evaluate still nests a reasonable number of levels, and the count comes back down', () => {
  // Twenty levels of Evaluate, each holding the next as text.
  const levels = (n: number): string => (n === 0 ? '1 + 1' : `Evaluate ( "${levels(n - 1).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}" )`);
  assert.equal(evaluateText(levels(20)), '2');
  // Several in a row at one level do not add up.
  assert.equal(evaluateText(Array.from({ length: 300 }, () => 'Evaluate ( "1" )').join(' & ')), '1'.repeat(300));
  // An error inside one Evaluate does not leave the count raised for the next.
  const ctx = withField('Evaluate ( F )');
  assert.equal(evaluateText('Let ( e = EvaluationError ( Evaluate ( F ) ) ; Evaluate ( "1 + 1" ) )', ctx), '2');
});

test('a text that evaluates itself twice per level, with EvaluationError catching each, takes linear work', () => {
  const g = 'EvaluationError ( Evaluate ( G ) ) + EvaluationError ( Evaluate ( G ) )';
  const ctx = { field: (ref: { field: string }) => (ref.field === 'G' ? text(g) : undefined) } as CalcContext;
  const started = performance.now();
  // The caught refusals add up to a number; what matters is that it is an answer, soon, not the work-budget error.
  assert.match(evaluateText('Evaluate ( G )', ctx), /^\d+$/);
  assert.ok(performance.now() - started < 3000, `took ${Math.round(performance.now() - started)} ms`);
  // The refusal ends with the outermost Evaluate: the next one at the top level runs again.
  assert.equal(evaluateText('Let ( e = Evaluate ( G ) ; Evaluate ( "1 + 1" ) )', ctx), '2');
});

const STACK_MESSAGE = "? The document or formula is nested too deeply for this server's stack";
const overflow = () => new RangeError('Maximum call stack size exceeded');
/** A formula text holding `inner` as a text constant, with its quotation marks and backslashes escaped. */
const quoted = (inner: string) => `"${inner.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

test('a stack that runs out inside a JSON function gives the error text without claiming the document is deep', () => {
  // JSON.stringify runs inside JSONFormatElements; make it run out of stack for one marker text, as a real overflow would.
  const marker = 'stack-marker';
  const real = JSON.stringify;
  JSON.stringify = ((value: unknown, ...rest: unknown[]) => {
    if (value === marker) throw overflow();
    return (real as (...a: unknown[]) => string)(value, ...rest);
  }) as typeof JSON.stringify;
  try {
    const overflowing = `JSONFormatElements ( ${quoted(`["${marker}"]`)} )`;
    // The call that overflows gives the text and the evaluation goes on: the next call works.
    assert.equal(evaluateText(`${overflowing} & "|" & JSONFormatElements ( "[1]" )`, {}), `${STACK_MESSAGE}|[\r\t1\r]`);
    // Inside Evaluate as well: the Evaluate that holds the call returns the text, and a later Evaluate runs.
    assert.equal(evaluateText(`Evaluate ( ${quoted(overflowing)} ) & "|" & Evaluate ( "1 + 1" )`, {}), `${STACK_MESSAGE}|2`);
  } finally {
    JSON.stringify = real;
  }
});

test('a stack overflow inside Evaluate is a calculation error and leaves no state behind', () => {
  // A field callback that runs out of stack, as a deep recursion would.
  const ctx = { field: (ref: { field: string }) => { if (ref.field === 'S') throw overflow(); return undefined; } } as CalcContext;
  assert.throws(() => evaluate('Evaluate ( "S" )', ctx), (e) => e instanceof CalcError && /Evaluate is nested too deeply.*stack/.test(e.message));
  // Caught at the top level: the next Evaluate at the top level runs.
  assert.equal(evaluateText('EvaluationError ( Evaluate ( "S" ) ) & "|" & Evaluate ( "1 + 1" )', ctx), '1200|2');
  // Caught inside an outer Evaluate: while that one runs, Evaluate calls inside it are refused; once it has ended, they are not.
  const outer = 'EvaluationError ( Evaluate ( "S" ) ) & "|" & EvaluationError ( Evaluate ( "1 + 1" ) )';
  assert.equal(evaluateText(`Evaluate ( ${quoted(outer)} ) & "|" & Evaluate ( ${quoted('Evaluate ( "1 + 1" )')} )`, ctx), '1200|1200|2');
  // And a later evaluation after all that is clean: two levels of Evaluate still work.
  assert.equal(evaluateText(`Evaluate ( ${quoted('Evaluate ( "2 + 2" )')} )`, ctx), '4');
});
