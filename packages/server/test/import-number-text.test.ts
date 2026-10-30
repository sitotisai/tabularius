import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convert } from '../src/import-mapping.ts';

test('number import reports non-decimal text and accepts decimal notation', () => {
  const field = { name: 'Qty', type: 'number' } as never;
  for (const text of ['0x10', '0b101', '0o17', '1_000']) {
    assert.deepEqual(convert(text, field, []), { value: text, issue: `"${text}" isn't a number` }, text);
  }
  for (const text of ['7', '1,234.5', '-0.5', '1e3', ' 7 ']) {
    assert.deepEqual(convert(text, field, []), { value: text }, text);
  }
});
