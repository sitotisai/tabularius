// Execute FileMaker Data API: a read's "limit.{portal}" and "offset.{portal}" are keys of a request the script built, so a
// portal named __proto__ must not set limit or offset on every object in the process.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '@tabularius/store';
import { executeDataApi } from '../src/data-api-step.ts';

test('Execute FileMaker Data API: portal paging for __proto__ leaves Object.prototype alone', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-dapi-proto-'));
  try {
    createStore(join(dir, 'D.sqlite'));
    const store = new Store(join(dir, 'D.sqlite'), 'D');
    store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name' }] }] as never);
    store.create('Items', { Name: 'a' });
    const request = '{"action":"read","layouts":"Items","limit.__proto__":0,"offset.__proto__":5}';
    const outcome = JSON.parse(executeDataApi(store, request, {}).json);
    assert.equal(outcome.messages[0].code, '0');
    const seen = ['limit', 'offset'].filter((k) => (({}) as Record<string, unknown>)[k] !== undefined);
    for (const k of seen) delete (Object.prototype as Record<string, unknown>)[k];
    assert.deepEqual(seen, []);
    store.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
