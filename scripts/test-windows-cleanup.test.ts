import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { calledFromTest, retryDeletes, tearsDownFolder, trackDatabases } from './test-windows-cleanup.ts';

class FakeDatabase {
  isOpen = true;
  location: string;
  constructor(location: string) { this.location = location; }
  close() { this.isOpen = false; }
}

const RECURSIVE = { recursive: true };

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
    rmSync(path: string, _options?: unknown) {
      if (opened.some((db) => db.isOpen && (db.location === path || db.location.startsWith(path + '/')))) throw inUse();
      removed.push(path);
    },
    promises: {
      async rm(path: string, options?: unknown) { return fs.rmSync(path, options); },
    },
  };
  retryDeletes(fs, closeUnder);
  return { fs, open, removed };
}

test('a delete that fails because a database is open closes it and succeeds', () => {
  const { fs, open, removed } = setup();
  const db = open('/tmp/a/x.sqlite');
  fs.rmSync('/tmp/a', RECURSIVE);
  assert.equal(db.isOpen, false);
  assert.deepEqual(removed, ['/tmp/a']);
});

test('only the databases under the deleted path are closed', () => {
  const { fs, open, removed } = setup();
  const inside = open('/tmp/a/x.sqlite');
  const beside = open('/tmp/b/y.sqlite');
  fs.rmSync('/tmp/a', RECURSIVE);
  assert.equal(inside.isOpen, false);
  assert.equal(beside.isOpen, true);
  assert.deepEqual(removed, ['/tmp/a']);
});

test('the async delete retries the same way', async () => {
  const { fs, open, removed } = setup();
  const db = open('/tmp/c/z.sqlite');
  await fs.promises.rm('/tmp/c', RECURSIVE);
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
  const server = { rmSync() { throw inUse(); } };
  let closed = 0;
  retryDeletes(server, () => ++closed, () => false);
  assert.throws(() => server.rmSync(), { code: 'EBUSY' });
  assert.equal(closed, 0, 'nothing is closed for a delete the server made');
});

test('only a recursive delete is a teardown: a file deleted on purpose is left to fail', () => {
  assert.equal(tearsDownFolder({ recursive: true, force: true }), true);
  for (const options of [undefined, {}, { force: true }, { recursive: false }, 'recursive']) assert.equal(tearsDownFolder(options), false);
  const { fs, open, removed } = setup();
  const db = open('/tmp/f/x.sqlite');
  assert.throws(() => fs.rmSync('/tmp/f/x.sqlite'), { code: 'EBUSY' });
  assert.equal(db.isOpen, true);
  assert.deepEqual(removed, []);
});

test('only a delete made by test code is retried, not one made by the server', () => {
  const test = '    at TestContext.<anonymous> (file:///D:/a/tabularius/tabularius/packages/store/test/passkeys.test.ts:35:28)';
  const server = '    at Host.sweep (file:///D:/a/tabularius/tabularius/packages/server/src/host.ts:90:7)';
  assert.equal(calledFromTest(['Error', '    at wrapper (file:///D:/a/tabularius/tabularius/scripts/test-windows-cleanup.ts:60:9)', test].join('\n')), true);
  assert.equal(calledFromTest(['Error', '    at wrapper (file:///D:/a/tabularius/tabularius/scripts/test-windows-cleanup.ts:60:9)', server, test].join('\n')), false);
  assert.equal(calledFromTest(['Error', '    at helper (C:\\work\\packages\\store\\test\\forge.ts:3:1)'].join('\n')), true);
  assert.equal(calledFromTest(''), false);
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
