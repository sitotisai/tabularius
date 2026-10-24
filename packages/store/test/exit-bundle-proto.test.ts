// A table (or an imported file's table) may be named __proto__. Its globals and serials are written under that name in the
// bundle, and must not land on Object.prototype of the process that writes it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, exitBundle, Store } from '../src/index.ts';

test('exit bundle: globals and serials of a table named __proto__ do not reach Object.prototype', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-exit-proto-'));
  const password = ['correct', 'horse', 'battery', 'staple'].join(' ');
  const path = join(dir, 'Shop.openhbam.sqlite');
  createStore(path);
  const store = new Store(path, 'Shop');
  try {
    store.applyDesign([{
      op: 'createTable', name: '__proto__', fields: [
        { name: 'protoMotto', type: 'text', options: { global: true } },
        { name: 'protoNumber', type: 'number', options: { autoEnter: { serial: { next: '500', increment: 5 } } } },
      ],
    }] as never);
    store.setPassword('Admin', password);
    const target = join(dir, 'bundle');
    await exitBundle(store, target, { account: 'Admin', password });
    const seen = ['protoMotto', 'protoNumber'].filter((k) => (({}) as Record<string, unknown>)[k] !== undefined);
    for (const k of seen) delete (Object.prototype as Record<string, unknown>)[k];
    assert.deepEqual(seen, []);
    assert.ok(Object.hasOwn(JSON.parse(readFileSync(join(target, 'serials.json'), 'utf8')), '__proto__'));
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  }
});
