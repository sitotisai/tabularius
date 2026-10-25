// Char, Code, HexEncode and the other encoders refuse a result past the text limit before building it, and
// SortValues and UniqueValues charge their work before sorting: each ends in the error value, never in a raw
// exception, an out-of-memory abort or a stall of the event loop.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CalcError, evaluate, evaluateText, text, type CalcContext } from '../src/index.ts';
import { ComplexityError } from '../src/complexity-error.ts';

const withField = (value: string): CalcContext => ({ field: (ref) => (ref.field === 'F' ? text(value) : undefined) });
// A refusal before the sort takes milliseconds and the old stall seconds to tens of seconds; the limit allows for a busy host.
const LIMIT_MS = 5000;
/** The refusal every too-large result gives (as Substitute does): an error the host unwinds the write for, not a value. */
const refused = (formula: string, ctx: CalcContext = {}) =>
  assert.throws(() => evaluateText(formula, ctx), (e) => e instanceof ComplexityError, formula);
function quick<T>(f: () => T): T {
  const started = performance.now();
  try {
    return f();
  } finally {
    const took = performance.now() - started;
    assert.ok(took < LIMIT_MS, `took ${Math.round(took)} ms`);
  }
}

test('Char gives ? for a number whose digits do not fit, not a raw RangeError', () => {
  for (const formula of ['Char ( 1e21 )', 'Char ( 1e30 )', 'Char ( -1e300 )', 'Char ( F )']) {
    const ctx = { ...withField(''), field: () => ({ type: 'number', value: 1e25 }) } as CalcContext;
    assert.equal(evaluateText(formula, ctx), '?', formula);
    assert.throws(() => evaluate(formula, ctx), (e) => e instanceof CalcError, formula);
  }
});

test('Char keeps its answers for the numbers it could always read', () => {
  assert.equal(evaluateText('Char ( 65 )'), 'A');
  assert.equal(evaluateText('Char ( 9700065 )'), 'Aa');
  assert.equal(evaluateText('Char ( 0 )'), '');
  assert.equal(evaluateText('Char ( -66 )'), 'B');
  assert.equal(evaluateText('Code ( Char ( 1e20 ) )'), '1');
});

// 8^7 = 2,097,152 characters, built inside the formula the way a hostile calculation would.
/** `fn ( fn ( ... ( inner ) ... ) )`, `levels` deep. */
const nest = (fn: string, levels: number, inner: string) => `${`${fn} ( `.repeat(levels)}${inner}${' )'.repeat(levels)}`;
const BIG = `${'Substitute ( '.repeat(7)}"abcdefgh"${' ; "a" ; "aaaaaaaa" )'.repeat(7)}`;

test('Code refuses a result past the text limit before building it', () => {
  assert.equal(evaluateText(`Length ( ${BIG} )`), String(2_097_152 + 7));
  refused(`Length ( Code ( ${BIG} ) )`);
  assert.equal(evaluateText(`Length ( Code ( Left ( ${BIG} ; 1000000 ) ) )`), '4999997');
});

test('HexEncode refuses a result past the text limit, however deeply it is nested', () => {
  assert.equal(evaluateText(`Length ( HexEncode ( ${BIG} ) )`), String(2 * (2_097_152 + 7)));
  refused(`Length ( HexEncode ( HexEncode ( HexEncode ( ${BIG} ) ) ) )`);
  assert.equal(evaluateText('HexEncode ( "abc" )'), '616263');
});

test('Base64Encode and GetAsURLEncoded refuse a result past the text limit', () => {
  const big = `Substitute ( ${BIG} ; "a" ; "é" )`;
  refused(`Length ( GetAsURLEncoded ( ${big} ) )`);
  refused(`Length ( ${nest('Base64Encode', 6, BIG)} )`);
  assert.notEqual(evaluateText(`Length ( ${nest('Base64Encode', 2, BIG)} )`), '?');
  assert.equal(evaluateText('Base64Encode ( "abc" )'), 'YWJj');
  assert.equal(evaluateText('GetAsURLEncoded ( "a b&é" )'), 'a%20b%26%C3%A9');
});

const values = (n: number) => Array.from({ length: n }, (_, i) => `v${(i * 7919) % n}`).join('\r');

test('SortValues is refused for a list too long to sort within the work budget', () => {
  const ctx = withField(values(400_000));
  for (const formula of ['SortValues ( F ; 1 ; "German" )', 'SortValues ( F )', 'SortValues ( F ; -2 )']) {
    quick(() => refused(formula, ctx));
  }
});

test('UniqueValues still answers a long list', () => {
  const ctx = withField(values(100_000));
  const result = evaluateText('UniqueValues ( F ; 1 ; "German" )', ctx);
  assert.equal(result.split('\r').length, 100_000 + 1);
});

test('SortValues with a locale sorts a long list from keys built once', () => {
  const ctx = withField(values(60_000));
  const sorted = quick(() => evaluateText('SortValues ( F ; 1 ; "German" )', ctx)).split('\r');
  // The list ends with a return, as every value list does.
  assert.equal(sorted.pop(), '');
  assert.deepEqual(sorted, values(60_000).split('\r').sort());
});

test('SortValues orders text by locale as it did', () => {
  const ev = (f: string) => evaluateText(f).replace(/\r/g, '|');
  assert.equal(ev('SortValues ( "Zebra¶apple¶Äpfel¶Apfel¶zoo¶Zoo" ; 1 ; "German" )'), 'Äpfel|Apfel|apple|Zebra|zoo|Zoo|');
  assert.equal(ev('SortValues ( "b¶a¶B" ; -1 ; "Swedish" )'), 'b|B|a|');
  assert.equal(ev('SortValues ( "x¶3/4/2024¶1/2/2020" ; 3 ; "French" )'), '1/2/2020|3/4/2024|x|');
});
