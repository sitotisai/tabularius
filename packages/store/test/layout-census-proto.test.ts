import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { addCensus, createStore, layoutCensus, Store, type DesignOp } from '../src/index.ts';
import type { LayoutObject } from '../../fmp12/src/index.ts';

// A design may carry an object or a part whose kind is any text (the design is checked for a string, not for a known kind), so
// the census, which counts by kind, must keep "__proto__" as a kind and not count on Object.prototype.

const polluted = () => {
  const found = ['count', 'issues'].filter((k) => (({}) as Record<string, unknown>)[k] !== undefined);
  for (const k of found) delete (Object.prototype as Record<string, unknown>)[k];
  return found;
};

test('layout census: an object kind and a part kind of __proto__ are counted as kinds, in a census and in a total', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-census-proto-'));
  try {
    createStore(join(dir, 'f.sqlite'));
    const store = new Store(join(dir, 'f.sqlite'), 'Shop');
    try {
      store.applyDesign([{ op: 'createTable', name: 'Clients', fields: [{ name: 'Name' }] }] as DesignOp[], { account: 'Admin' });
      const d = store.design('Clients')!;
      const object = { id: 900, kind: '__proto__', type: 99, anchors: { left: true, top: true, right: false, bottom: false }, style: {}, bounds: { top: 200, left: 10, bottom: 220, right: 200 } } as unknown as LayoutObject;
      const parts = [...d.parts, { ...d.parts[0], kind: '__proto__' }] as typeof d.parts;
      store.applyDesign([{ op: 'updateLayout', layout: d.id, design: { objects: [...d.objects, object], parts } }] as DesignOp[], { account: 'Admin' });
      const c = layoutCensus(store);
      assert.deepEqual(polluted(), [], 'the census did not count on Object.prototype');
      assert.equal(Object.getOwnPropertyDescriptor(c.objects, '__proto__')?.value.count, 1);
      assert.equal(Object.getOwnPropertyDescriptor(c.parts, '__proto__')?.value.count, 1);
      const total = addCensus(addCensus({ layouts: 0, objects: {}, parts: {}, formulas: {}, unknownFunctions: {}, layoutIssues: {}, printing: {}, slow: { layouts: 0, objects: {}, worst: 0 } }, c), c);
      assert.deepEqual(polluted(), [], 'the total did not either');
      assert.equal(Object.getOwnPropertyDescriptor(total.objects, '__proto__')?.value.count, 2);
      assert.equal(Object.getOwnPropertyDescriptor(total.parts, '__proto__')?.value.count, 2);
    } finally {
      store.close();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  }
});
