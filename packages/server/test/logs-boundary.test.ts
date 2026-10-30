import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, linkSync, lstatSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyLog, decodeRecords, logReader, logRecords, startLog, writeLog } from '../src/logs.ts';

const refused = (e: NodeJS.ErrnoException) => e.code === 'ESTALE';
const skip = process.platform === 'win32' && 'links and modes differ on Windows';

// The change logs of a point-in-time backup hold whole database pages. A synthetic page stands in for them here.
const page = () => Buffer.from('synthetic change record');

for (const sealed of [false, true]) {
  test(`a ${sealed ? 'sealed' : 'plain'} change log is private, and is never started or appended to through a planted link`, { skip }, async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tabularius-logs-boundary-'));
    try {
      const key = sealed ? ['pass', 'for', 'the', 'test'].join('-') : undefined;
      const victim = join(dir, 'victim.txt');
      writeFileSync(victim, 'keep');
      // A new log is private, as is a file left readable by others when a log starts over it or appends to it.
      const fresh = join(dir, 'fresh.log');
      startLog(fresh, key, 'Tasks');
      assert.equal(statSync(fresh).mode & 0o777, 0o600);
      const path = join(dir, '2026-10-30_010203Z.log');
      writeFileSync(path, 'left over');
      chmodSync(path, 0o644);
      const writer = startLog(path, key, 'Tasks');
      assert.equal(statSync(path).mode & 0o777, 0o600);
      chmodSync(path, 0o644);
      writeLog(writer, { at: 1_000, seq: 1, data: page() });
      assert.equal(statSync(path).mode & 0o777, 0o600);
      const records = logRecords(path);
      assert.equal(records.length, 1);
      const read = await logReader(path, key, 'Tasks');
      assert.deepEqual(read(records[0]), page());
      if (!sealed) assert.deepEqual(decodeRecords(readFileSync(path).subarray(15)).map((r) => r.data.toString()), ['synthetic change record']);
      // A link planted at the name of the next log is refused, and what it points to is left alone.
      const next = join(dir, '2026-10-30_010208Z.log');
      symlinkSync(victim, next);
      assert.throws(() => startLog(next, key, 'Tasks'), refused);
      assert.equal(readFileSync(victim, 'utf8'), 'keep');
      assert.ok(lstatSync(next).isSymbolicLink());
      // A dangling link is refused too, even though an existence check would miss it.
      const missing = join(dir, 'missing.txt');
      rmSync(next);
      symlinkSync(missing, next);
      assert.throws(() => startLog(next, key, 'Tasks'), refused);
      assert.throws(() => lstatSync(missing), { code: 'ENOENT' });
      assert.ok(lstatSync(next).isSymbolicLink());
      // A log swapped for a link after it was started is not appended to.
      rmSync(path);
      symlinkSync(victim, path);
      assert.throws(() => writeLog(writer, { at: 2_000, seq: 2, data: page() }), refused);
      assert.equal(writer.n, 1);
      assert.equal(readFileSync(victim, 'utf8'), 'keep');
      // A second name for another file (a hard link) is refused for both writes too.
      rmSync(path);
      linkSync(victim, path);
      assert.throws(() => startLog(path, key, 'Tasks'), refused);
      assert.equal(readFileSync(victim, 'utf8'), 'keep');
      assert.throws(() => writeLog(writer, { at: 2_000, seq: 2, data: page() }), refused);
      assert.equal(writer.n, 1);
      assert.equal(readFileSync(victim, 'utf8'), 'keep');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}

test('applying a log does not write its changes through a link planted at the database\'s -wal name', { skip }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-logs-boundary-'));
  try {
    const victim = join(dir, 'victim.txt');
    writeFileSync(victim, 'keep');
    const db = join(dir, 'Tasks.openhbam.sqlite');
    for (const link of [symlinkSync, linkSync]) {
      link(victim, `${db}-wal`);
      assert.throws(() => applyLog(db, page()), refused);
      assert.equal(readFileSync(victim, 'utf8'), 'keep');
      rmSync(`${db}-wal`);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
