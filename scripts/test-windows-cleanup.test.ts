import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { retryDeletes, trackDatabases } from './test-windows-cleanup.ts';

class FakeDatabase {
  isOpen = true;
  location: string;
  constructor(location: string) { this.location = location; }
  close() { this.isOpen = false; }
}

function inUse(): NodeJS.ErrnoException {
  return Object.assign(new Error('EBUSY: resource busy or locked, unlink'), { code: 'EBUSY' });
}

// A folder that cannot be removed while any database in it is open, as on Windows.
function setup() {
  const sqlite = { DatabaseSync: FakeDatabase as unknown as new (location: string) => FakeDatabase };
  const closeUnder = trackDatabases(sqlite, false);
  const removed: string[] = [];
  const opened: FakeDatabase[] = [];
  const open = (path: string) => { const db = new sqlite.DatabaseSync(path); opened.push(db); return db; };
  const fs = {
    rmSync(path: string) {
      if (opened.some((db) => db.isOpen && (db.location === path || db.location.startsWith(path + '/')))) throw inUse();
      removed.push(path);
    },
    promises: {
      async rm(path: string) { return fs.rmSync(path); },
    },
  };
  retryDeletes(fs, closeUnder);
  return { fs, open, removed };
}

test('a delete that fails because a database is open closes it and succeeds', () => {
  const { fs, open, removed } = setup();
  const db = open('/tmp/a/x.sqlite');
  fs.rmSync('/tmp/a');
  assert.equal(db.isOpen, false);
  assert.deepEqual(removed, ['/tmp/a']);
});

test('only the databases under the deleted path are closed', () => {
  const { fs, open, removed } = setup();
  const inside = open('/tmp/a/x.sqlite');
  const beside = open('/tmp/b/y.sqlite');
  fs.rmSync('/tmp/a');
  assert.equal(inside.isOpen, false);
  assert.equal(beside.isOpen, true);
  assert.deepEqual(removed, ['/tmp/a']);
});

test('the async delete retries the same way', async () => {
  const { fs, open, removed } = setup();
  const db = open('/tmp/c/z.sqlite');
  await fs.promises.rm('/tmp/c');
  assert.equal(db.isOpen, false);
  assert.deepEqual(removed, ['/tmp/c']);
});

test('a delete that fails with nothing open there, or for another reason, still fails', () => {
  const busy = { rmSync() { throw inUse(); } };
  retryDeletes(busy, () => 0);
  assert.throws(() => busy.rmSync(), { code: 'EBUSY' });
  const denied = { rmSync() { throw Object.assign(new Error('EACCES'), { code: 'EACCES' }); } };
  retryDeletes(denied, () => 1);
  assert.throws(() => denied.rmSync(), { code: 'EACCES' });
});

test('the database -wal file and the folder it is in are both covered, and :memory: is ignored', () => {
  const sqlite = { DatabaseSync: FakeDatabase as unknown as new (location: string) => FakeDatabase };
  const closeUnder = trackDatabases(sqlite, false);
  const file = new sqlite.DatabaseSync(join('/tmp', 'e', 'f.sqlite'));
  const memory = new sqlite.DatabaseSync(':memory:');
  assert.equal(closeUnder(join('/tmp', 'e', 'f.sqlite-wal')), 1);
  assert.equal(file.isOpen, false);
  assert.equal(closeUnder('/tmp/e'), 0);
  assert.equal(memory.isOpen, true);
});
