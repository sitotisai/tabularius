import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateText } from '../src/index.ts';

// These pin Tabularius results; the compatible product's results are unverified offline.
test('Ceiling and Floor retain exact digits for large decimal and whole inputs', () => {
  const cases = [
    ['Ceiling ( 100000000000000000001.5 )', '100000000000000000002'],
    ['Ceiling ( -100000000000000000001.5 )', '-100000000000000000001'],
    ['Floor ( 100000000000000000001.5 )', '100000000000000000001'],
    ['Floor ( -100000000000000000001.5 )', '-100000000000000000002'],
    ['Ceiling ( 12345678901234567.5 )', '12345678901234568'],
    ['Floor ( -12345678901234567.5 )', '-12345678901234568'],
    ['Ceiling ( 9007199254740993.5 )', '9007199254740994'],
    ['Floor ( 9007199254740993.5 )', '9007199254740993'],
    ['Ceiling ( 100000000000000000001 )', '100000000000000000001'],
    ['Floor ( -100000000000000000001 )', '-100000000000000000001'],
  ];
  for (const [formula, expected] of cases) assert.equal(evaluateText(formula), expected, formula);
});

test('Ceiling and Floor retain small-value and empty-input behavior', () => {
  const cases = [
    ['Ceiling ( 1.2 )', '2'],
    ['Ceiling ( -1.2 )', '-1'],
    ['Floor ( 1.8 )', '1'],
    ['Floor ( -1.2 )', '-2'],
    ['Ceiling ( 0.1 + 0.2 )', '1'],
    ['Floor ( 0.1 + 0.2 )', '0'],
    ['Ceiling ( 3 )', '3'],
    ['Floor ( "" )', ''],
  ];
  for (const [formula, expected] of cases) assert.equal(evaluateText(formula), expected, formula);
});
