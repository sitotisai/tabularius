import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluate, evaluateText, fromStored, toStored, type Value } from '../src/index.ts';
import { formatDate, formatTime, formatTimestamp } from '../src/values.ts';

type Case = { expression: string; expected: string; page: string };
const cases = JSON.parse(readFileSync(new URL('./data/date-time-functions.json', import.meta.url), 'utf8')) as Case[];

test('documented date and time expressions match the cited Claris examples and rules', () => {
  const ctx = { now: () => new Date(2026, 9, 17, 12, 0, 0) };
  for (const row of cases) assert.equal(evaluateText(row.expression, ctx), row.expected, `${row.expression} (${row.page})`);
});

test('conversion functions retain mixed date, time and timestamp types', () => {
  const date = evaluate('GetAsDate ( "2/29/2024" )');
  const time = evaluate('GetAsTime ( "25:01:01" )');
  const timestamp = evaluate('GetAsTimestamp ( "2/29/2024 25:01:01" )');
  assert.equal(date.type, 'date');
  assert.equal(time.type, 'time');
  assert.equal(timestamp.type, 'timestamp');
  assert.equal(formatDate(date.value), '2/29/2024');
  assert.equal(formatTime(time.value), '25:01:01');
  assert.equal(formatTimestamp(timestamp.value), '3/1/2024 1:01:01');
});

test('date and timestamp arithmetic uses day units and seconds within a day', () => {
  assert.equal(evaluateText('Date ( 3 ; 1 ; 2024 ) - Date ( 2 ; 28 ; 2024 )'), '2');
  assert.equal(evaluateText('Timestamp ( Date ( 2 ; 29 ; 2024 ) ; Time ( 25 ; 0 ; 0 ) ) - Timestamp ( Date ( 2 ; 29 ; 2024 ) ; Time ( 1 ; 0 ; 0 ) )'), '86400');
});

test('date values outside years 0001 to 4000 stay invalid through text, names and arithmetic', () => {
  assert.equal(evaluateText('Date ( 1 ; 1 ; 5000 )'), '?');
  assert.equal(evaluateText('Upper ( MonthName ( Date ( 1 ; 1 ; 300000 ) ) )'), '');
  assert.equal(evaluateText('Date ( 1 ; 1 ; 2020 ) + 2000000'), '?');
  assert.equal(evaluateText('GetAsDate ( 3000000 )'), '?');
});

test('negative time parts use a consistent sign and magnitude', () => {
  assert.equal(evaluateText('Hour ( Time ( 0 ; 0 ; -1 ) )'), '0');
  assert.equal(evaluateText('Minute ( -3599 )'), '-59');
  assert.equal(evaluateText('Seconds ( -3599 )'), '-59');
});

test('timestamps that round through midnight advance the date', () => {
  assert.equal(evaluateText('Timestamp ( Date ( 1 ; 1 ; 2020 ) ; Time ( 23 ; 59 ; 59.9996 ) )'), '1/2/2020 0:00:00');
});

test('JSONSetElement writes date values and date keys in the file date order', () => {
  const ctx = { dateOrder: 'DMY' as const };
  assert.equal(evaluateText('JSONSetElement ( "{}" ; "d" ; Date ( 2 ; 1 ; 2020 ) ; JSONString )', ctx), '{"d":"1/2/2020"}');
  assert.equal(evaluateText('JSONSetElement ( "{}" ; Date ( 2 ; 1 ; 2020 ) ; 1 ; JSONNumber )', ctx), '{"1/2/2020":1}');
});

test('UTC microsecond clock calls are distinct and use exact integer values', () => {
  const ctx = { now: () => new Date('2026-01-01T00:00:00.000Z') };
  const first = evaluate('Get ( CurrentTimeUTCMicroseconds )', ctx);
  const second = evaluate('Get ( CurrentTimeUTCMicroseconds )', ctx);
  assert.equal(first.type, 'number');
  assert.equal(second.type, 'number');
  assert.ok(second.exact! > first.exact!);
});

test('dates the store holds past year 4000 keep their text and their value', () => {
  for (const iso of ['9999-12-31', '4001-01-01']) {
    const v = fromStored(iso, 'date');
    assert.equal(v.type, 'date', iso);
    assert.ok(Number.isFinite(v.value), iso);
    assert.equal(toStored(v, 'date'), iso, `${iso} round-trips`);
  }
  for (const iso of ['9999-12-31T23:59:59', '4001-01-01T08:00:00']) {
    const v = fromStored(iso, 'timestamp');
    assert.equal(v.type, 'timestamp', iso);
    assert.equal(toStored(v, 'timestamp'), iso, `${iso} round-trips`);
  }
  // A date or timestamp the store cannot hold is stored as nothing, not as "?".
  assert.equal(toStored({ type: 'timestamp', value: -5 }, 'timestamp'), null);
  assert.equal(toStored({ type: 'date', value: 4e6 }, 'date'), null);
  // Text the store holds that is no date at all stays text, never a date with no value.
  assert.deepEqual(fromStored('99999-12-31', 'date'), { type: 'text', value: '99999-12-31' });
  assert.equal(evaluateText('Year ( GetAsDate ( "12/31/9999" ) )'), '9999');
  assert.equal(evaluateText('Year ( GetAsDate ( "1/1/4001" ) )'), '4001');
  assert.equal(evaluateText('GetAsText ( GetAsDate ( "12/31/9999" ) )'), '12/31/9999');
});

test('dates built or computed past year 4000 are invalid whatever is done with them next', () => {
  for (const e of [
    'Date ( 12 ; 31 ; 4000 ) + 1',
    'Date ( 12 ; 31 ; 4000 ) + 1 - 1',
    'GetAsDate ( 1460971 ) - 1',
    'Date ( 1 ; 1 ; 5000 ) + 1',
    'Timestamp ( Date ( 12 ; 31 ; 4000 ) ; 0 ) + 86400',
  ]) assert.equal(evaluateText(e), '?', e);
  assert.equal(evaluateText('Year ( Date ( 1 ; 1 ; 5000 ) )'), '');
  assert.equal(evaluateText('GetAsText ( Date ( 12 ; 31 ; 4000 ) )'), '12/31/4000');
  // Arithmetic that starts from a date the store already holds past 4000 keeps working as before.
  assert.equal(evaluateText('GetAsDate ( "12/31/9999" ) - 1'), '12/30/9999');
});

test('a timestamp built from an out-of-range date is invalid, never NaN text', () => {
  for (const order of ['MDY', 'DMY', 'YMD', 'ISO'] as const) {
    for (const e of ['GetAsTimestamp ( Date ( 1 ; 1 ; 5000 ) )', 'Timestamp ( Date ( 1 ; 1 ; 5000 ) ; 0 )', 'Timestamp ( Date ( 12 ; 31 ; 4000 ) ; 86400 )', 'GetAsTimestamp ( 1e12 )']) {
      const t = evaluateText(e, { dateOrder: order });
      assert.ok(!/NaN/.test(t), `${e} in ${order}: ${t}`);
      assert.ok(t === '?' || t === '', `${e} in ${order}: ${t}`);
    }
  }
  assert.equal(formatTimestamp(NaN), '?');
  assert.equal(formatTimestamp(1e12), '?');
  assert.equal(formatTimestamp(-5), '?');
});

test('WeekOfYearFiscal at the end of year 4000 matches the week the calendar gives', () => {
  assert.equal(evaluateText('WeekOfYearFiscal ( Date ( 12 ; 31 ; 4000 ) ; 1 )'), '1');
  assert.equal(evaluateText('WeekOfYearFiscal ( Date ( 1 ; 1 ; 1 ) ; 1 )'), '1');
  assert.equal(evaluateText('WeekOfYearFiscal ( GetAsDate ( "12/31/9999" ) ; 1 )'), '52', 'a date the store holds keeps the week it had');
  assert.equal(evaluateText('WeekOfYearFiscal ( Date ( 1 ; 1 ; 5000 ) ; 1 )'), '');
});

test('timestamp text keeps its rounding to the displayed places; only a carry into midnight moves the date', () => {
  const at = (secs: string, order: 'MDY' | 'ISO' = 'MDY') => evaluateText(`GetAsText ( Timestamp ( Date ( 1 ; 1 ; 2020 ) ; ${secs} ) )`, { dateOrder: order });
  assert.equal(at('0.9995'), '1/1/2020 0:00:00.999');
  assert.equal(at('43200.0004'), '1/1/2020 12:00:00');
  assert.equal(at('86399.9994'), '1/1/2020 23:59:59.999');
  assert.equal(at('86399.9996'), '1/2/2020 0:00:00');
  assert.equal(at('-0.0004'), '1/1/2020 0:00:00');
  assert.equal(at('86399.9999996', 'ISO'), '2020-01-02T00:00:00');
  assert.match(at('86399.9994', 'ISO'), /^2020-01-01T23:59:59\.9993/);
  assert.match(at('0.9995', 'ISO'), /^2020-01-01T00:00:00\.9994/);
});

test('JSON element functions read, type, list and delete date keys in the file date order', () => {
  const keys = { DMY: '1/2/2020', YMD: '2020/02/01', ISO: '2020-02-01' } as const;
  for (const order of ['DMY', 'YMD', 'ISO'] as const) {
    const ctx = { dateOrder: order };
    const doc = 'JSONSetElement ( "{}" ; Date ( 2 ; 1 ; 2020 ) ; 1 ; JSONNumber )';
    const key = 'Date ( 2 ; 1 ; 2020 )';
    assert.equal(evaluateText(doc, ctx), `{"${keys[order]}":1}`, order);
    assert.equal(evaluateText(`JSONGetElement ( ${doc} ; ${key} )`, ctx), '1', `get ${order}`);
    assert.equal(evaluateText(`JSONGetElementType ( ${doc} ; ${key} )`, ctx), '2', `type ${order}`);
    assert.equal(evaluateText(`JSONDeleteElement ( ${doc} ; ${key} )`, ctx), '{}', `delete ${order}`);
    const nested = `JSONSetElement ( "{}" ; Date ( 2 ; 1 ; 2020 ) & ".x" ; 5 ; JSONNumber )`;
    assert.equal(evaluateText(`JSONListKeys ( ${nested} ; ${key} )`, ctx), 'x', `list keys ${order}`);
    assert.equal(evaluateText(`JSONListValues ( ${nested} ; ${key} )`, ctx), '5', `list values ${order}`);
  }
});

test('the UTC microsecond clock follows the clock it is given', () => {
  const read = (iso: string, name = 'CurrentTimeUTCMicroseconds', ctx: object = { now: () => new Date(iso) }) => evaluate(`Get ( ${name} )`, ctx) as Extract<Value, { type: 'number' }>;
  const later = read('2030-01-01T00:00:00.123Z');
  const earlier = read('2020-01-01T00:00:00.456Z');
  const expected = (iso: string) => BigInt(Date.parse(iso)) * 1000n + 62_135_596_800_000_000n;
  assert.equal(later.exact, expected('2030-01-01T00:00:00.123Z'));
  assert.equal(earlier.exact, expected('2020-01-01T00:00:00.456Z'), 'an earlier clock is not pushed past a later one read before');
  // The microseconds and the milliseconds name the same instant.
  for (const iso of ['2020-01-01T00:00:00.456Z', '2026-10-17T12:00:00.001Z']) {
    const micros = read(iso).exact!;
    const millis = BigInt(read(iso, 'CurrentTimeUTCMilliseconds').value);
    assert.equal(micros / 1000n, millis, iso);
  }
  // Calls in one context stay distinct and increasing, within the millisecond the clock gave.
  const ctx = { now: () => new Date('2026-01-01T00:00:00.000Z') };
  const a = read('', 'CurrentTimeUTCMicroseconds', ctx).exact!;
  const b = read('', 'CurrentTimeUTCMicroseconds', ctx).exact!;
  const c = read('', 'CurrentTimeUTCMicroseconds', ctx).exact!;
  assert.ok(b > a && c > b);
  assert.equal(c / 1000n, a / 1000n);
});

test('an invalid date makes an empty time, not NaN text, and no time part of it', () => {
  for (const e of ['GetAsTime ( Date ( 1 ; 1 ; 5000 ) )', 'GetAsTime ( 1 / 0 )', 'Hour ( Date ( 1 ; 1 ; 5000 ) )', 'Minute ( Date ( 1 ; 1 ; 5000 ) )', 'Seconds ( Date ( 1 ; 1 ; 5000 ) )', 'GetAsTime ( Date ( 1 ; 1 ; 5000 ) ) + 1']) {
    const t = evaluateText(e);
    assert.ok(!/NaN/.test(t), `${e}: ${t}`);
  }
  for (const e of ['GetAsTime ( Date ( 1 ; 1 ; 5000 ) )', 'GetAsTime ( 1 / 0 )', 'Hour ( Date ( 1 ; 1 ; 5000 ) )', 'Minute ( Date ( 1 ; 1 ; 5000 ) )', 'Seconds ( Date ( 1 ; 1 ; 5000 ) )']) {
    assert.equal(evaluateText(e), '', e);
  }
  assert.equal(toStored(evaluate('GetAsTime ( Date ( 1 ; 1 ; 5000 ) )'), 'time'), null);
});

test('an out-of-range date or timestamp result is an invalid number that a date, time or timestamp field stores as nothing', () => {
  const invalid = [
    'Date ( 1 ; 1 ; 5000 )', 'Date ( 1 ; 1 ; 5000 ) + 0', 'GetAsDate ( 3000000 )',
    'Timestamp ( Date ( 1 ; 1 ; 5000 ) ; 1 )', 'GetAsTimestamp ( 1e12 )', 'GetAsTime ( Date ( 1 ; 1 ; 5000 ) )',
  ];
  for (const e of invalid) {
    for (const type of ['date', 'time', 'timestamp'] as const) assert.equal(toStored(evaluate(e), type), null, `${e} into a ${type} field`);
  }
  // A text field holds the text "?", and a number field the invalid number, as main does for 1 / 0.
  assert.equal(toStored(evaluate('Date ( 1 ; 1 ; 5000 )'), 'text'), '?');
  assert.equal(toStored(evaluate('1 / 0'), 'text'), '?');
  assert.ok(Number.isNaN(toStored(evaluate('Date ( 1 ; 1 ; 5000 ) + 1'), 'number')));
});

test('an invalid date compares and takes part in Max and Min as the invalid number 1 / 0 does', () => {
  // Known limit: comparisons and Max/Min treat an invalid number as main always has, for a date as for 1 / 0.
  for (const [a, b] of [
    ['Date ( 1 ; 1 ; 5000 ) > Date ( 1 ; 1 ; 2000 )', '( 1 / 0 ) > Date ( 1 ; 1 ; 2000 )'],
    ['Date ( 1 ; 1 ; 5000 ) = Date ( 1 ; 1 ; 5000 )', '( 1 / 0 ) = ( 1 / 0 )'],
    ['Max ( Date ( 1 ; 1 ; 5000 ) ; Date ( 1 ; 1 ; 2000 ) )', 'Max ( 1 / 0 ; Date ( 1 ; 1 ; 2000 ) )'],
    ['Min ( Date ( 1 ; 1 ; 5000 ) ; Date ( 1 ; 1 ; 2000 ) )', 'Min ( 1 / 0 ; Date ( 1 ; 1 ; 2000 ) )'],
  ]) assert.equal(evaluateText(a), evaluateText(b), a);
  assert.equal(evaluateText('Max ( Date ( 1 ; 1 ; 2001 ) ; Date ( 1 ; 1 ; 2000 ) )'), '1/1/2001');
  assert.equal(evaluateText('GetAsDate ( "12/31/9999" ) > Date ( 1 ; 1 ; 2000 )'), '1');
});
