import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateText } from '../src/index.ts';
import { dayNumber, formatDate, formatTimestamp, parseDateText, parseTimestampText, type DateStyle } from '../src/values.ts';

test('date and timestamp text keeps the year through every date style', () => {
  const styles: DateStyle[] = [
    'MDY', 'DMY', 'YMD', 'ISO',
    { order: 'MDY', padded: true },
    { order: 'DMY', padded: true },
    { order: 'YMD', padded: true },
  ];
  const years = [1, 9, 50, 99, 100, 999, 1000, 1999, 2026, 4000];
  const dates = [[1, 1], [3, 5], [12, 31]];

  for (const style of styles) {
    for (const year of years) {
      for (const [month, day] of dates) {
        const n = dayNumber(year, month, day);
        const dateText = formatDate(n, style);
        assert.equal(parseDateText(dateText, style, 2026), n, `${JSON.stringify(style)}, ${year}, ${dateText}`);

        const ts = (n - 1) * 86400 + 3723.5;
        const timestampText = formatTimestamp(ts, style);
        assert.equal(parseTimestampText(timestampText, style), ts,
          `${JSON.stringify(style)}, ${year}, ${timestampText}`);
      }
    }
  }
});

test('formulas write four-digit early years and read them back', () => {
  assert.equal(evaluateText('Date ( 1 ; 21 ; 1 )'), '1/21/0001');
  assert.equal(evaluateText('Date ( 3 ; 5 ; 99 ) & ""'), '3/5/0099');
  assert.equal(evaluateText('Date ( 12 ; 31 ; 999 ) & ""'), '12/31/0999');
  assert.equal(evaluateText('Timestamp ( Date ( 1 ; 1 ; 1 ) ; Time ( 1 ; 2 ; 3 ) )'), '1/1/0001 1:02:03');
  assert.equal(evaluateText('Year ( GetAsDate ( Date ( 1 ; 21 ; 1 ) & "" ) )'), '1');
  assert.equal(evaluateText('Date ( 3 ; 5 ; 2026 ) & ""'), '3/5/2026');
});
