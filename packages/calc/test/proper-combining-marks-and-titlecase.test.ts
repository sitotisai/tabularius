import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateText, NameTable, type CalcContext } from '../src/index.ts';

const ctx = {
  names: new NameTable({ fields: [], occurrences: [] }),
  occurrence: 'T',
  field: () => { throw new Error('no fields'); },
  related: () => [],
  now: () => new Date(2026, 9, 15, 14, 30, 0),
} as unknown as CalcContext;
const f = (formula: string) => evaluateText(formula, ctx);
const lit = (s: string) => '"' + s + '"';

test('a combining mark inside a word does not start a new word', () => {
  assert.equal(f(`Proper ( ${lit('re\u0301sume\u0301 abc')} )`), 'Re\u0301sume\u0301 Abc');
  assert.equal(f(`Proper ( ${lit('i\u0307stanbul')} )`), 'I\u0307stanbul');
  assert.equal(f(`Proper ( ${lit('\u0130stanbul')} )`), 'I\u0307stanbul');
  assert.equal(f(`Proper ( ${lit('a\u200db')} )`), 'A\u200db');
});

test('Proper writes the titlecase letter, not the uppercase one', () => {
  assert.equal(f(`Proper ( ${lit('\u01c6ungla \u01c4UNGLA')} )`), '\u01c5ungla \u01c5ungla');
  assert.equal(f(`Proper ( ${lit('\u01c9 \u01cc \u01f3')} )`), '\u01c8 \u01cb \u01f2');
  assert.equal(f(`Proper ( ${lit('\u00dfa')} )`), 'Ssa');
  assert.equal(f(`Proper ( ${lit('\ufb01sh \ufb03x')} )`), 'Fish Ffix');
  assert.equal(f(`Proper ( ${lit('\u1f80 \u1fb3 \u1ff3')} )`), '\u1f88 \u1fbc \u1ffc');
});

test('Proper keeps its other rules', () => {
  assert.equal(f(`Proper ( ${lit("new york o'neil ab_cd 1st x2y")} )`), "New York O'neil Ab_Cd 1st X2y");
  assert.equal(f(`Proper ( ${lit('')} )`), '');
});
