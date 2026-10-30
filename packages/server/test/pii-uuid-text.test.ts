import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../../store/src/index.ts';
import { PiiMasker } from '../src/pii.ts';

function masker() {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-pii-uuid-'));
  const path = join(dir, 'Items.openhbam.sqlite');
  createStore(path);
  const store = new Store(path, 'Items');
  return { masker: new PiiMasker(store, 'clerk'), close: () => { store.close(); rmSync(dir, { recursive: true, force: true }); } };
}

test('a UUID whose middle groups are all digits is not taken for a phone number', () => {
  const m = masker();
  try {
    // Groups 2 to 4 read as 4-4-4 digits, the shape of a phone number, but they sit inside one hyphenated token.
    for (const uuid of ['81F4B889-5074-4983-8241-8EE2B8908744', '12345678-1234-5678-9012-123456789012']) {
      assert.equal(m.masker.patterns(uuid), uuid);
      assert.equal(m.masker.patterns(`key ${uuid} end`), `key ${uuid} end`);
    }
    // A phone number written on its own is still masked.
    assert.notEqual(m.masker.patterns('call 555-123-4567 today'), 'call 555-123-4567 today');
    assert.notEqual(m.masker.patterns('call +1 555 123 4567 today'), 'call +1 555 123 4567 today');
  } finally { m.close(); }
});
