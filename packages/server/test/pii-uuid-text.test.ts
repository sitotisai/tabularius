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
    assert.equal(m.masker.patterns('81f4b889-5074-4983-8241-8ee2b8908744'), '81f4b889-5074-4983-8241-8ee2b8908744');
    // Phone numbers stay masked however they are written, including next to a hyphen.
    for (const phone of ['call 555-123-4567 today', 'call +1 555 123 4567 today', '1-800-555-1234', '1-555-123-4567', '0049-30-1234-5678', 'Phone-555-123-4567', 'tel-555-123-4567', '555-123-4567-']) {
      const out = m.masker.patterns(phone);
      assert.notEqual(out, phone, `${phone} was left as it is`);
      assert.match(out, /<PHONE_\d+>/, phone);
    }
  } finally { m.close(); }
});
