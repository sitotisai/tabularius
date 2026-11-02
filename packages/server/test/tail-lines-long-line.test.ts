// A line that spans many chunks must cost time in proportion to its length. Joining the unfinished line afresh for every chunk
// copies it once per chunk: 64 MiB of one line took 3.5 s, and 256 MiB a minute, on the thread that serves requests.
// The test counts the bytes joined instead of timing them, so it does not depend on how fast the machine is.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { linesNewestFirst, linesOldestFirst } from '../src/tail-lines.ts';

// 4 MiB in 1 KiB chunks is 4,096 chunks of one line: 8 GiB joined if each chunk copied the line so far, and about 4 MiB if not.
const LONG = 4 * 1024 * 1024;
const CHUNK = 1024;

test('a line of many chunks is joined once, in both directions, with its neighbours intact', { timeout: 30_000 }, (t) => {
  let joined = 0;
  const concat = Buffer.concat;
  t.mock.method(Buffer, 'concat', (list: readonly Uint8Array[], total?: number) => { joined += list.reduce((n, b) => n + b.length, 0); return concat.call(Buffer, list, total); });
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-tail-long-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const long = 'é€x'.repeat(Math.floor(LONG / 6)); // multi-byte text, so a chunk boundary falls inside characters
  const file = join(dir, 'log');
  writeFileSync(file, `first\n${long}\nlast`);
  assert.deepEqual([...linesOldestFirst(file, CHUNK)].map((l) => (l === long ? 'LONG' : l)), ['first', 'LONG', 'last']);
  assert.deepEqual([...linesNewestFirst(file, CHUNK)].map((l) => (l === long ? 'LONG' : l)), ['last', 'LONG', 'first']);
  // Each direction joins the long line once; allow a few times the file for the other lines and the pieces' own copies.
  assert.ok(joined <= 6 * Buffer.byteLength(long), `${joined} bytes were joined to read a file of ${Buffer.byteLength(long)}`);
  // No newline at all, and a newline only at the very end or the very start.
  for (const text of [long, `${long}\n`, `\n${long}`]) {
    writeFileSync(file, text);
    assert.deepEqual([...linesOldestFirst(file, CHUNK)], [long]);
    assert.deepEqual([...linesNewestFirst(file, CHUNK)], [long]);
  }
});
