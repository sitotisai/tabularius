// A named pipe (FIFO) planted at the name of a change log, or at the -wal name of a database a log is applied to, is refused by the
// filesystem boundary at once: opening a pipe for writing would otherwise wait for a reader that never comes. Nothing is written
// to the pipe, and what is around it is left alone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { lstatSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyLog, startLog, writeLog } from '../src/logs.ts';

const refused = (e: NodeJS.ErrnoException) => e.code === 'ESTALE';
const skip = process.platform === 'win32' && 'named pipes (mkfifo) do not exist on Windows';

// The change logs of a point-in-time backup hold whole database pages. A synthetic page stands in for them here.
const page = () => Buffer.from('synthetic change record');

for (const sealed of [false, true]) {
  test(`a named pipe at the name of a ${sealed ? 'sealed' : 'plain'} change log is refused when the log starts and when a record is appended`, { skip, timeout: 30_000 }, () => {
    const dir = mkdtempSync(join(tmpdir(), 'tabularius-logs-fifo-'));
    try {
      const key = sealed ? ['pass', 'for', 'the', 'test'].join('-') : undefined;
      // A pipe is already at the name when the log starts.
      const next = join(dir, '2026-10-30_010208Z.log');
      execFileSync('mkfifo', [next]);
      assert.throws(() => startLog(next, key, 'Tasks'), refused);
      assert.ok(lstatSync(next).isFIFO(), 'the pipe is still there');
      // A log swapped for a pipe after it was started is not appended to.
      const path = join(dir, '2026-10-30_010203Z.log');
      const writer = startLog(path, key, 'Tasks');
      writeLog(writer, { at: 1_000, seq: 1, data: page() });
      assert.equal(writer.n, 1);
      rmSync(path);
      execFileSync('mkfifo', [path]);
      assert.throws(() => writeLog(writer, { at: 2_000, seq: 2, data: page() }), refused);
      assert.equal(writer.n, 1);
      assert.ok(lstatSync(path).isFIFO(), 'the pipe is still there');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}

test('applying a log does not write its changes into a named pipe at the database\'s -wal name', { skip, timeout: 30_000 }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-logs-fifo-'));
  try {
    const db = join(dir, 'Tasks.openhbam.sqlite');
    writeFileSync(db, 'not a database; applyLog does not open it');
    execFileSync('mkfifo', [`${db}-wal`]);
    assert.throws(() => applyLog(db, page()), refused);
    assert.ok(lstatSync(`${db}-wal`).isFIFO(), 'the pipe is still there');
    assert.equal(readFileSync(db, 'utf8'), 'not a database; applyLog does not open it');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
