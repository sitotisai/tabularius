import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeObjectRecord } from '../src/refresh.ts';
import type { DataRecord } from '../src/types.ts';

// A targeted refresh of an object in a portal whose name is also a name every object has (toString, constructor) or is
// __proto__, when the record the client holds has no rows under that name: the refresh finds nothing to merge, and does not throw.

const record = (portalData: Record<string, { recordId: string; modId: string }[]>): DataRecord => ({ recordId: '1', modId: '1', fieldData: {}, portalData } as unknown as DataRecord);

for (const name of ['toString', 'constructor', '__proto__', 'hasOwnProperty']) {
  test(`a refresh in a portal called ${name} that the record does not hold merges nothing and does not throw`, () => {
    const old = record({});
    const fresh = record({});
    assert.doesNotThrow(() => mergeObjectRecord(old, fresh, 'Orders::Item', undefined, name));
    assert.deepEqual(Object.keys(old.portalData), []);
  });

  test(`a refresh in a portal called ${name} that the record holds merges its rows`, () => {
    const rows = JSON.parse(`{"${name}":[{"recordId":"5","modId":"1","Orders::Item":"Tea"}]}`);
    const fresh = JSON.parse(`{"${name}":[{"recordId":"5","modId":"1","Orders::Item":"Jam"}]}`);
    const old = record(rows);
    mergeObjectRecord(old, record(fresh), 'Orders::Item', undefined, name);
    assert.equal((Object.getOwnPropertyDescriptor(old.portalData, name)?.value as Record<string, string>[])[0]['Orders::Item'], 'Jam');
  });
}
