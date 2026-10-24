import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keepPortalFormatting, portalRevert, replacePortal } from '../src/refresh.ts';
import type { DataRecord } from '../src/types.ts';

// The client's own edits of a record, for a portal called __proto__ (a layout, an imported one too, may name one): the entry
// stays under that name, and no object in the page gains a key.

const polluted = (...keys: string[]): string[] => {
  const found = keys.filter((k) => (({}) as Record<string, unknown>)[k] !== undefined);
  for (const k of found) delete (Object.prototype as Record<string, unknown>)[k];
  return found;
};

test('formatting text in a row of a portal called __proto__ stays on the record and off Object.prototype', () => {
  const rec = { portalStyles: undefined } as Pick<DataRecord, 'portalStyles'>;
  keepPortalFormatting(rec, '__proto__', '7', 'Orders::Item', [{ start: 0, end: 3, style: 1 }]);
  assert.deepEqual(polluted('7'), []);
  assert.equal(JSON.stringify(rec.portalStyles), '{"__proto__":{"7":{"Orders::Item":[{"start":0,"end":3,"style":1}]}}}');
  keepPortalFormatting(rec, '__proto__', '7', 'Orders::Item', []);
  assert.deepEqual(Object.keys(rec.portalStyles!['__proto__']['7']), [], 'no runs, no formatting');
  keepPortalFormatting(rec, 'Orders', '8', 'Orders::Item', [{ start: 0, end: 1, style: 2 }]);
  assert.deepEqual(Object.keys(rec.portalStyles!).sort(), ['Orders', '__proto__']);
});

test('Revert Record puts back the rows of a portal called __proto__, in an update that names that portal', () => {
  const rows = [{ portal: '__proto__', recordId: '5', key: 'Orders::Item', value: 'Tea' }, { portal: '__proto__', recordId: '5', key: 'Orders::Qty', value: 2 },
    { portal: 'Lines', recordId: '9', key: 'Lines::Item', value: 'x' }, { portal: '__proto__', recordId: '6', key: 'Orders::Item', value: 'made here' }];
  const portalData = portalRevert(rows, [{ portal: '__proto__', recordId: '6' }]);
  assert.equal(JSON.stringify(portalData), '{"__proto__":[{"recordId":"5","Orders::Item":"Tea","Orders::Qty":2}],"Lines":[{"recordId":"9","Lines::Item":"x"}]}');
});

test('Refresh Portal replaces the rows and formatting of a portal called __proto__', () => {
  const old = { portalData: JSON.parse('{"__proto__":[{"recordId":"1","modId":"1"}],"Lines":[]}'), portalStyles: JSON.parse('{"__proto__":{"1":{"a":[]}}}') } as Pick<DataRecord, 'portalData' | 'portalStyles'>;
  const fresh = { portalData: JSON.parse('{"__proto__":[{"recordId":"2","modId":"1"}]}'), portalStyles: undefined } as Pick<DataRecord, 'portalData' | 'portalStyles'>;
  replacePortal(old, fresh, '__proto__');
  assert.deepEqual(Object.getOwnPropertyDescriptor(old.portalData, '__proto__')?.value, [{ recordId: '2', modId: '1' }]);
  assert.equal(Object.hasOwn(old.portalStyles!, '__proto__'), false, 'a portal with no formatting left has none');
  assert.deepEqual(old.portalData.Lines, []);
});
