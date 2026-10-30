import { notOnWindows } from './windows.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createStore, Store, StoreError } from '../src/index.ts';

test('created stores have stable identities; an older store gains one on opening', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'file-id-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'A.openhbam.sqlite');
  createStore(path);
  const first = new Store(path);
  const id = first.fileId;
  assert.match(id, /^[0-9a-f-]{36}$/);
  first.close();
  const copy = join(dir, 'B.openhbam.sqlite');
  copyFileSync(path, copy);
  const copied = new Store(copy);
  assert.equal(copied.fileId, id);
  copied.close();
  const db = new DatabaseSync(path);
  db.prepare("DELETE FROM _fm_meta WHERE key = 'fileId'").run();
  db.close();
  const older = new Store(path);
  assert.notEqual(older.fileId, id);
  const next = older.fileId;
  older.close();
  const reopened = new Store(path);
  assert.equal(reopened.fileId, next);
  reopened.close();
});

test('read-only SQL refuses a file that replaced the opened one at its path', { skip: notOnWindows('a file cannot be renamed over one that is open, so nothing can replace it') }, (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'file-id-swap-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'A.openhbam.sqlite');
  const other = join(dir, 'other.openhbam.sqlite');
  createStore(path);
  createStore(other);
  const store = new Store(path);
  t.after(() => store.close());
  // The first query opens its connection by path, after the identity was read and vetted.
  store.checkpoint();
  renameSync(other, path);
  // Code 100 (file is missing: the file that was opened is not there), not 8310, which is the SQL request error.
  assert.throws(() => [...store.iterateCommitted('SELECT 1 AS one')], (e: unknown) => e instanceof StoreError && e.code === 100 && /not the file that was opened/.test(e.message));
  // A file that is still the opened one keeps working.
  const kept = join(dir, 'B.openhbam.sqlite');
  createStore(kept);
  const same = new Store(kept);
  t.after(() => same.close());
  assert.deepEqual([...same.iterateCommitted('SELECT 1 AS one')].map((r) => ({ ...r })), [{ one: 1 }]);
});
