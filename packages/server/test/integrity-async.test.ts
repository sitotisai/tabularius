import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, truncateSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from '../../store/src/index.ts';
import { integrity, integrityAsync } from '../src/backup-verify.ts';

test('a backup check in a worker gives the answer the check gives in place, and several of them stay quick', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-integrity-async-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const files = ['A', 'B', 'C'].map((n) => join(dir, n + '.openhbam.sqlite'));
  for (const file of files) createStore(file);
  const started = Date.now();
  for (const file of files) { assert.equal(await integrityAsync(file), 'ok'); assert.equal(await integrityAsync(file, true), 'ok'); }
  // Each check starts a thread, which loads the check module and not the server: six of them took ten seconds when it loaded the server.
  assert.ok(Date.now() - started < 5000, `six worker checks took ${Date.now() - started} ms`);
  truncateSync(files[0], 4096);
  assert.notEqual(await integrityAsync(files[0]), 'ok');
  assert.equal(await integrityAsync(files[0]), integrity(files[0]));
});
