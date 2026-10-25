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
