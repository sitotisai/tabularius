import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateText } from '../src/index.ts';
import { decimalSum } from '../src/values.ts';

// Regression tests for the calc number findings #114 (Mod and Div of decimals), #121 (Sum and Average of long whole
// numbers), #113 (SerialIncrement of long serials) and #128 (NumToJText of huge or non-finite arguments).
// What the product these functions are compatible with returns for a few of these inputs is UNVERIFIED offline; each
// such case says so. The tests pin our own, documented choice.
const e = (f: string) => evaluateText(f);
const threw = (f: string) => { try { e(f); return false; } catch { return true; } };

// --- #114 -------------------------------------------------------------------------------------------------------

test('#114: Div and Mod of decimals that are exact multiples give the decimal result', () => {
  assert.equal(e('Mod ( 19.99 ; 0.01 )'), '0');
  assert.equal(e('Mod ( 1.15 ; 0.05 )'), '0');
  assert.equal(e('Mod ( 8.2 ; 0.2 )'), '0');
  assert.equal(e('Mod ( 0.7 ; 0.1 )'), '0');
  assert.equal(e('Mod ( 4.3 ; 0.1 )'), '0');
  assert.equal(e('Mod ( -0.7 ; 0.1 )'), '0');
  assert.equal(e('Mod ( 0.7 ; -0.1 )'), '0');
  assert.equal(e('Div ( 0.7 ; 0.1 )'), '7');
  assert.equal(e('Div ( 1.15 ; 0.05 )'), '23');
  assert.equal(e('Div ( 0.3 ; 0.1 )'), '3');
  assert.equal(e('Int ( 1.15 / 0.05 )'), e('Div ( 1.15 ; 0.05 )'));
});

test('#114: Div and Mod of two-decimal amounts equal the exact integer answer over a grid', () => {
  // Amounts are whole hundredths, so the exact answer is integer maths on the hundredths.
  const floorDiv = (x: number, y: number) => Math.floor(x / y);
  const cents = (n: number) => (n === 0 ? '0' : String(n / 100));
  const as = [-1999, -1150, -820, -700, -75, -1, 0, 1, 5, 7, 99, 115, 430, 820, 1150, 1999, 4350, 12345, 100000];
  const bs = [-50, -10, -5, -1, 1, 2, 5, 10, 20, 25, 50, 100, 250];
  for (const a of as) {
    for (const b of bs) {
      const q = floorDiv(a, b), r = a - b * q;
      const x = `${a / 100}`, y = `${b / 100}`;
      assert.equal(e(`Div ( ${x} ; ${y} )`), String(q), `Div ( ${x} ; ${y} )`);
      assert.equal(e(`Mod ( ${x} ; ${y} )`), cents(r), `Mod ( ${x} ; ${y} )`);
    }
  }
});

test('#114: ordinary Mod and Div results are unchanged', () => {
  assert.equal(e('Mod ( 7.5 ; 2 )'), '1.5');
  assert.equal(e('Mod ( -7.5 ; 2 )'), '0.5');
  assert.equal(e('Mod ( 7.5 ; -2 )'), '-0.5');
  assert.equal(e('Div ( -7.5 ; 2 )'), '-4');
  assert.equal(e('Mod ( 10 ; 3 )'), '1');
  assert.equal(e('Mod ( -10 ; 3 )'), '2');
  assert.equal(e('Div ( 10 ; 3 )'), '3');
  assert.equal(e('Mod ( 1 ; 3 )'), '1');
  assert.equal(e('Mod ( 0.5 ; 0.3 )'), '0.2');
  assert.equal(e('Div ( 0.5 ; 0.3 )'), '1');
  assert.equal(e('Mod ( 5 ; 0 )'), '?');
  assert.equal(e('Div ( 5 ; 0 )'), '?');
  assert.equal(e('Mod ( 0.5 ; 0 )'), '?');
  assert.equal(e('Mod ( 0 ; 0.5 )'), '0');
});

test('#114: a quotient that is only just below a whole number because of the digits given is not rounded up', () => {
  // 2.9999999999999996 is below 3 as written, so Div keeps 2 and the residue stays inside [0, divisor).
  // Unverified: what the product returns for a literal with this many digits.
  assert.equal(e('Div ( 2.9999999999999996 ; 1 )'), '2');
  assert.equal(Number(e('Mod ( 2.9999999999999996 ; 1 )')) >= 0, true);
});

// --- #121 -------------------------------------------------------------------------------------------------------

test('#121: Sum and Average keep every digit of whole numbers up to 2^53', () => {
  assert.equal(e('Sum ( 5468879803762229 ; 661 )'), '5468879803762890');
  assert.equal(e('Sum ( 9007199254740991 )'), '9007199254740991');
  assert.equal(e('Sum ( 4000000000000001 )'), '4000000000000001');
  assert.equal(e('Sum ( 1000000000000001 ; 1 )'), '1000000000000002');
  assert.equal(e('Sum ( -4000000000000001 ; 1 )'), '-4000000000000000');
  assert.equal(e('Average ( 1234567890123457 ; 1234567890123457 ; 1234567890123457 )'), '1234567890123457');
  assert.equal(decimalSum([5468879803762229, 661]), 5468879803762890);
  assert.equal(decimalSum([9007199254740991]), 9007199254740991);
  assert.equal(decimalSum([4000000000000001]), 4000000000000001);
});

test('#121: decimalSum does not round a long whole number plus decimals to a wrong value', () => {
  // 4000000000000001 + 0.5 is exactly representable; scaling the sum by 10 to round it would not be.
  assert.equal(decimalSum([4000000000000001, 0.5]), 4000000000000001.5);
  assert.equal(decimalSum([4000000000000001, 4000000000000001, 0.25]), 8000000000000002);
  assert.equal(decimalSum([1e15, 0.5]), 1000000000000000.5);
});

test('#121: Sum and Average retain decimal digits beyond the fifteenth significant digit', () => {
  assert.equal(e('Sum ( 0.1234567890123456 )'), '0.1234567890123456');
  assert.equal(e('Sum ( 1234.5678901234567 )'), '1234.5678901234567');
  assert.equal(e('Average ( 0.1234567890123456 ; 0.1234567890123456 )'), '0.1234567890123456');
});

test('#121: decimalSum agrees with a BigInt scaled-decimal reference over seeded inputs', () => {
  let state = 0x5eed1234;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
  const asScaled = (n: number, places: number): bigint => {
    const scaled = Math.round(n * 10 ** places);
    return BigInt(scaled);
  };
  const fromScaled = (scaled: bigint, places: number): number => {
    const negative = scaled < 0n;
    const digits = (negative ? -scaled : scaled).toString().padStart(places + 1, '0');
    return Number(`${negative ? '-' : ''}${digits.slice(0, -places)}.${digits.slice(-places)}`);
  };
  for (let i = 0; i < 2000; i++) {
    const places = 1 + random() % 12;
    const values = Array.from({ length: 1 + random() % 6 }, () => {
      const magnitude = random() % 100000000;
      const sign = random() & 1 ? 1 : -1;
      return sign * magnitude / 10 ** places;
    });
    const expectedScaled = values.reduce((sum, n) => sum + asScaled(n, places), 0n);
    const expected = fromScaled(expectedScaled, places);
    assert.equal(decimalSum(values), expected, `seeded case ${i}`);
  }
});

test('#121: decimalSum takes a sum over more values than a call can pass as arguments, and keeps big whole numbers exact', () => {
  assert.equal(decimalSum(Array.from({ length: 300000 }, () => 0.5)), 150000);
  assert.equal(decimalSum(Array.from({ length: 300000 }, (_, i) => i)), 44999850000);
  // Whole numbers above 2^40 and runs of small ones past 2^52 move to exact integers before they could lose a digit.
  assert.equal(decimalSum([9007199254740991, 1, 0.5, -0.25]), 9007199254740992.25);
  assert.equal(decimalSum(Array.from({ length: 5000 }, () => 2 ** 40 - 1)), 5000 * (2 ** 40 - 1));
});

test('#114: Variance and StDev use decimal-clean aggregate arithmetic', () => {
  assert.equal(e('Variance ( 0.1 ; 0.2 ; 0.3 )'), '0.01');
  assert.equal(e('VarianceP ( 0.1 ; 0.2 ; 0.3 )'), '0.006666666666666667');
  assert.equal(e('StDev ( 0.1 ; 0.2 ; 0.3 )'), '0.1');
  assert.equal(e('StDevP ( 0.1 ; 0.2 ; 0.3 )'), '0.08164965809277261');
});

test('#121: sums of ordinary values are unchanged', () => {
  assert.equal(decimalSum([0.1, 0.2, 0.3]), 0.6);
  assert.equal(decimalSum(Array.from({ length: 1000 }, () => 0.1)), 100);
  assert.equal(decimalSum([13.950000000000001, 2]), 15.95);
  assert.equal(decimalSum([123456789, 0.125]), 123456789.125);
  assert.equal(e('Sum ( 1 ; 2 ; 3 )'), '6');
  assert.equal(e('Average ( 1 ; 2 )'), '1.5');
  assert.equal(e('Sum ( 19.99 ; 0.01 ; -20 )'), '0');
  assert.equal(e('Count ( 1 ; "" ; 3 )'), '2');
});

// --- #113 -------------------------------------------------------------------------------------------------------

test('#113: SerialIncrement of a long digit run is exact and never goes backwards', () => {
  assert.equal(e('SerialIncrement ( "ID-9007199254740993" ; 1 )'), 'ID-9007199254740994');
  assert.equal(e('SerialIncrement ( "ID-1234567890123456789" ; 1 )'), 'ID-1234567890123456790');
  assert.equal(e('SerialIncrement ( "ID-9007199254740992" ; 1 )'), 'ID-9007199254740993');
  assert.equal(e('SerialIncrement ( "99999999999999999999" ; 1 )'), '100000000000000000000');
  assert.equal(e('SerialIncrement ( "A0009007199254740993B" ; 7 )'), 'A0009007199254741000B');
});

test('#113: SerialIncrement returns ? for an amount that is not finite or not exact', () => {
  assert.equal(e('SerialIncrement ( "A99" ; 1/0 )'), '?');
  assert.equal(e('SerialIncrement ( "A99" ; -1/0 )'), '?');
  // Unverified: what the product does with an increment of 1e30; we refuse rather than print exponent notation.
  assert.equal(e('SerialIncrement ( "A001" ; 1e30 )'), '?');
});

test('#113: SerialIncrement keeps a whole increment beyond 2^53 exact when it is written with all its digits', () => {
  assert.equal(e('SerialIncrement ( "A001" ; 1000000000000000000000000000000 )'), 'A1000000000000000000000000000001');
});

test('#113: SerialIncrement of a digit run past 400 digits returns ? at once', () => {
  // Unverified limit, the same 400 digit cap as whole-number results; a longer run would make BigInt maths slow.
  assert.equal(e(`SerialIncrement ( "A${'1'.repeat(401)}" ; 1 )`), '?');
  const long = '9'.repeat(400);
  assert.equal(e(`SerialIncrement ( "${long}" ; 1 )`), '1' + '0'.repeat(400));
});

test('#113: ordinary SerialIncrement results are unchanged', () => {
  assert.equal(e('SerialIncrement ( "A001" ; 1 )'), 'A002');
  assert.equal(e('SerialIncrement ( "A099" ; 1 )'), 'A100');
  assert.equal(e('SerialIncrement ( "ID-999" ; 1 )'), 'ID-1000');
  assert.equal(e('SerialIncrement ( "INV0009X" ; 2 )'), 'INV0011X');
  assert.equal(e('SerialIncrement ( "7" ; 10 )'), '17');
  assert.equal(e('SerialIncrement ( "A001" ; 2.7 )'), 'A003');
  assert.equal(e('SerialIncrement ( "A001" ; -5 )'), 'A0-4');
  assert.equal(e('SerialIncrement ( "A001" ; "" )'), 'A001');
  assert.equal(e('SerialIncrement ( "ABC" ; 1 )'), 'ABC');
  assert.equal(e('SerialIncrement ( "" ; 1 )'), '');
});

// --- #128 -------------------------------------------------------------------------------------------------------

test('#128: NumToJText of 21 or more digits with a unit separator returns ? and never prints undefined', () => {
  assert.equal(e('NumToJText ( 1e25 ; 2 ; 0 )'), '?');
  assert.equal(e('NumToJText ( 123456789012345678901234567890 ; 3 ; 0 )'), '?');
  assert.equal(e('NumToJText ( 1e20 ; 2 ; 0 )'), '?');
  assert.equal(e('NumToJText ( -1e25 ; 3 ; 1 )'), '?');
  // 20 digits is the largest the units 万 億 兆 京 can write.
  assert.equal(e('NumToJText ( 1e19 ; 2 ; 0 )'), '1000京');
  assert.equal(e('NumToJText ( 1e19 ; 3 ; 1 )'), '１,０００京');
  // Without a unit separator long numbers still print their digits.
  assert.equal(e('NumToJText ( 1e25 ; 1 ; 0 )'), '10,000,000,000,000,000,000,000,000');
  assert.equal(e('NumToJText ( 1e25 ; 0 ; 0 )'), '10000000000000000000000000');
});

test('#128: NumToJText of a non-finite argument returns ? and does not throw', () => {
  assert.equal(threw('NumToJText ( 5 ; 1 ; 1/0 )'), false);
  assert.equal(e('NumToJText ( 5 ; 1 ; 1/0 )'), '?');
  assert.equal(e('NumToJText ( 5 ; 1 ; -1/0 )'), '?');
  assert.equal(e('NumToJText ( 5 ; 1/0 ; 0 )'), '?');
  assert.equal(e('NumToJText ( 1/0 ; 1 ; 0 )'), '?');
});

test('#128: ordinary NumToJText results are unchanged', () => {
  assert.equal(e('NumToJText ( 12345678 ; 2 ; 0 )'), '1234万5678');
  assert.equal(e('NumToJText ( 12345678 ; 2 ; 2 )'), '一二三四万五六七八');
  assert.equal(e('NumToJText ( 1234567.5 ; 1 ; 0 )'), '1,234,567.5');
  assert.equal(e('NumToJText ( -1234 ; 0 ; 1 )'), '-１２３４');
  assert.equal(e('NumToJText ( 0 ; 2 ; 0 )'), '0');
  assert.equal(e('NumToJText ( 100000000 ; 2 ; 0 )'), '1億');
  assert.equal(e('NumToJText ( 5 ; 1 ; 9 )'), '五');
  assert.equal(e('NumToJText ( 5 ; 1 ; -3 )'), '5');
  assert.equal(e('NumToJText ( "" ; 1 ; 0 )'), '');
});
