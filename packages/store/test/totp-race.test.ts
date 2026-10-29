import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store, totpCode } from '../src/index.ts';

test('TOTP consumes a step atomically when another connection wins after the read', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-totp-race-'));
  const path = join(dir, 'test.sqlite');
  createStore(path);
  const first = new Store(path, 'Test');
  first.setPassword('User', ['test', 'password'].join('-'), '[Full Access]');
  const { secret } = first.enrollTotp('User');
  const now = Date.now();
  t.mock.method(Date, 'now', () => now);
  assert.equal(first.confirmTotp('User', totpCode(secret)), true);
  const second = new Store(path, 'Test');
  t.after(() => { first.close(); second.close(); rmSync(dir, { recursive: true, force: true }); });
  const code = totpCode(secret);
  // Deterministically interleave two real database connections after the first read, before its UPDATE.
  const internals = first as unknown as { requireFreeOfOthers(): void };
  const original = internals.requireFreeOfOthers.bind(first);
  let interleaved = false;
  t.mock.method(internals, 'requireFreeOfOthers', () => {
    original();
    if (!interleaved) { interleaved = true; assert.equal(second.verifyTotp('User', code), true); }
  });
  assert.equal(first.verifyTotp('User', code), false, 'only the winning connection accepts the code');
  assert.equal(first.verifyTotp('User', totpCode(secret, Math.floor(now / 30_000) + 1)), true, 'the next step remains usable');
});
