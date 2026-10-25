import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import fs, { mkdtempSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { CONVERTER_VERSION, createStore, reconvertCheck } from '../src/index.ts';
import { fileSha256 } from '../src/import.ts';

// The admin console asks every hosted file whether it needs converting again every few seconds. Answering must not
// read the whole source file each time: a check for status works from what it already knows about the file, and
// hashes it again only when the file has changed.

const MB = 1 << 20;

function setup(t: TestContext, converterVersion: number | undefined) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-status-hash-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const store = join(dir, 'Big.sqlite');
  const source = join(dir, 'Big.fmp12');
  writeFileSync(source, Buffer.alloc(2 * MB, 7));
  createStore(store);
  const sql = new DatabaseSync(store);
  const record = { importedAt: new Date().toISOString(), size: statSync(source).size, sha256: fileSha256(source) };
  sql.prepare("UPDATE _fm_meta SET json = ? WHERE key = 'source'").run(JSON.stringify(record));
  if (converterVersion !== undefined) sql.prepare("INSERT OR REPLACE INTO _fm_meta (key, json) VALUES ('converterVersion', ?)").run(String(converterVersion));
  sql.close();
  return { store, source };
}

/** Bytes read from files by readSync (what hashing a file does) while `run` goes. */
function bytesRead<T>(t: TestContext, run: () => T): { out: T; bytes: number } {
  const real = fs.readSync;
  let bytes = 0;
  const spy = t.mock.method(fs, 'readSync', (...args: unknown[]) => {
    const n = (real as (...a: unknown[]) => number)(...args);
    bytes += n;
    return n;
  });
  syncBuiltinESMExports();
  try {
    return { out: run(), bytes };
  } finally {
    spy.mock.restore();
    syncBuiltinESMExports();
  }
}

test('a status check of an outdated file reads the source once, and not again while the file is unchanged', (t) => {
  const { store, source } = setup(t, 1);
  const first = bytesRead(t, () => reconvertCheck(store, source, { status: true }));
  assert.equal(first.out.outdated, true);
  assert.equal(first.out.unsafe, undefined, 'the file is as it was converted');
  assert.ok(first.bytes >= 2 * MB, 'the first answer looked at the file');
  const second = bytesRead(t, () => reconvertCheck(store, source, { status: true }));
  assert.deepEqual(second.out, first.out);
  assert.equal(second.bytes, 0, 'the second answer did not read the file');
});

test('a changed source is noticed by a status check: new size, or new bytes with the old size and modification time', (t) => {
  const { store, source } = setup(t, 1);
  assert.equal(reconvertCheck(store, source, { status: true }).unsafe, undefined);
  const before = statSync(source);
  // Same size, other bytes, modification time put back: only the change time tells.
  writeFileSync(source, Buffer.alloc(2 * MB, 8));
  utimesSync(source, before.atime, before.mtime);
  assert.match(reconvertCheck(store, source, { status: true }).unsafe ?? '', /changed since it was converted/);
  writeFileSync(source, Buffer.alloc(2 * MB + 1, 7));
  assert.match(reconvertCheck(store, source, { status: true }).unsafe ?? '', /changed since it was converted/);
});

test('the check that decides a conversion still reads the whole file every time', (t) => {
  const { store, source } = setup(t, 1);
  reconvertCheck(store, source, { status: true });
  const again = bytesRead(t, () => reconvertCheck(store, source));
  assert.ok(again.bytes >= 2 * MB, 'no remembered answer stands in for the real check');
  assert.equal(again.out.unsafe, undefined);
});

test('a status check of a file that is not outdated does not read the source at all', (t) => {
  const { store, source } = setup(t, CONVERTER_VERSION);
  const read = bytesRead(t, () => reconvertCheck(store, source, { status: true }));
  assert.equal(read.out.outdated, false);
  assert.equal(read.bytes, 0);
});
