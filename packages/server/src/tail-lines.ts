// Read text a chunk at a time through the filesystem boundary. Latest-entry views can stop near the end;
// searches need not keep the whole file in memory. Missing files have no lines; unsafe paths still fail.

import { closeSync, readSync } from 'node:fs';
import { openSync } from '../../store/src/fs-boundary.ts';

/** How much is read at a time. A longer line is still returned whole. */
export const CHUNK_BYTES = 1024 * 1024;

function openOrNothing(path: string, chunk: number): { fd: number; size: number } | undefined {
  if (!Number.isSafeInteger(chunk) || chunk <= 0) throw new RangeError('chunk size must be a positive safe integer');
  let size = 0;
  try {
    const fd = openSync(path, 'r', undefined, (opened) => {
      // The boundary permits read-only directory descriptors for other callers; line readers need a regular file.
      if (!opened.isFile()) throw Object.assign(new Error('Filesystem path changed or is not a safe regular file'), { code: 'ESTALE' });
      size = opened.size;
    });
    return { fd, size };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw e;
  }
}

/** A read may be short, including EOF if another process cleared the file after it was opened. */
function readChunk(fd: number, pos: number, length: number): Buffer {
  const piece = Buffer.alloc(length);
  let used = 0;
  while (used < length) {
    const n = readSync(fd, piece, used, length - used, pos + used);
    if (!n) break;
    used += n;
  }
  return piece.subarray(0, used);
}

/**
 * Non-empty lines, last first. The descriptor closes even when the caller stops early. An unfinished line is kept as a list of
 * pieces and joined once, so a line that spans many chunks costs time in proportion to its length, not its length times its chunks.
 */
export function* linesNewestFirst(path: string, chunk = CHUNK_BYTES): Generator<string> {
  const opened = openOrNothing(path, chunk);
  if (!opened) return;
  const { fd, size } = opened;
  try {
    let pos = size;
    // The bytes after the last piece read, up to the next newline, latest piece first (so the line is the reverse of this list).
    let tail: Buffer[] = [];
    const joined = (head: Buffer): Buffer => Buffer.concat([head, ...tail.slice().reverse()]);
    while (pos > 0) {
      const n = Math.min(chunk, pos);
      pos -= n;
      const piece = readChunk(fd, pos, n);
      let end = piece.length;
      let nl = end > 0 ? piece.lastIndexOf(10, end - 1) : -1;
      if (nl < 0) {
        // Still inside one line: no newline in this piece.
        if (piece.length) tail.push(piece);
        continue;
      }
      // The line that ends in the later pieces starts after this piece's last newline.
      const first = joined(piece.subarray(nl + 1));
      tail = [];
      if (first.length) yield first.toString('utf8');
      end = nl;
      nl = end > 0 ? piece.lastIndexOf(10, end - 1) : -1;
      while (nl >= 0) {
        if (end - nl - 1 > 0) yield piece.toString('utf8', nl + 1, end);
        end = nl;
        nl = end > 0 ? piece.lastIndexOf(10, end - 1) : -1;
      }
      // What comes before this piece's first newline is the end of a line that began in an earlier piece.
      if (end > 0) tail.push(piece.subarray(0, end));
    }
    if (tail.length) yield Buffer.concat(tail.slice().reverse()).toString('utf8');
  } finally { closeSync(fd); }
}

/** Non-empty lines, oldest first. Only bytes present when the file opened are considered. An unfinished line is joined once (see above). */
export function* linesOldestFirst(path: string, chunk = CHUNK_BYTES): Generator<string> {
  const opened = openOrNothing(path, chunk);
  if (!opened) return;
  const { fd, size } = opened;
  try {
    let pos = 0;
    // The start of the line that has not ended yet, in file order.
    let pending: Buffer[] = [];
    while (pos < size) {
      const piece = readChunk(fd, pos, Math.min(chunk, size - pos));
      if (!piece.length) break;
      pos += piece.length;
      let start = 0;
      for (let nl = piece.indexOf(10, start); nl >= 0; nl = piece.indexOf(10, start)) {
        const line = pending.length ? Buffer.concat([...pending, piece.subarray(start, nl)]) : piece.subarray(start, nl);
        pending = [];
        if (line.length) yield line.toString('utf8');
        start = nl + 1;
      }
      if (start < piece.length) pending.push(piece.subarray(start));
    }
    if (pending.length) yield Buffer.concat(pending).toString('utf8');
  } finally { closeSync(fd); }
}
