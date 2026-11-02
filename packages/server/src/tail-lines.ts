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

/** Non-empty lines, last first. The descriptor closes even when the caller stops early. */
export function* linesNewestFirst(path: string, chunk = CHUNK_BYTES): Generator<string> {
  const opened = openOrNothing(path, chunk);
  if (!opened) return;
  const { fd, size } = opened;
  try {
    let pos = size;
    let carry: Buffer = Buffer.alloc(0);
    while (pos > 0) {
      const n = Math.min(chunk, pos);
      pos -= n;
      const piece = readChunk(fd, pos, n);
      const data = carry.length ? Buffer.concat([piece, carry]) : piece;
      let end = data.length;
      let nl = end > 0 ? data.lastIndexOf(10, end - 1) : -1;
      while (nl >= 0) {
        if (end - nl - 1 > 0) yield data.toString('utf8', nl + 1, end);
        end = nl;
        nl = end > 0 ? data.lastIndexOf(10, end - 1) : -1;
      }
      carry = Buffer.from(data.subarray(0, end));
    }
    if (carry.length) yield carry.toString('utf8');
  } finally { closeSync(fd); }
}

/** Non-empty lines, oldest first. Only bytes present when the file opened are considered. */
export function* linesOldestFirst(path: string, chunk = CHUNK_BYTES): Generator<string> {
  const opened = openOrNothing(path, chunk);
  if (!opened) return;
  const { fd, size } = opened;
  try {
    let pos = 0;
    let carry: Buffer = Buffer.alloc(0);
    while (pos < size) {
      const piece = readChunk(fd, pos, Math.min(chunk, size - pos));
      if (!piece.length) break;
      pos += piece.length;
      const data = carry.length ? Buffer.concat([carry, piece]) : piece;
      let start = 0;
      for (let nl = data.indexOf(10, start); nl >= 0; nl = data.indexOf(10, start)) {
        if (nl > start) yield data.toString('utf8', start, nl);
        start = nl + 1;
      }
      carry = Buffer.from(data.subarray(start));
    }
    if (carry.length) yield carry.toString('utf8');
  } finally { closeSync(fd); }
}
