// A tiny .fmp12 writer for tests that need a file with a chosen design: one
// base table with text fields. Built in the test, never read from disk.
import { BLOCK_SIZE, encodePathInt } from '../../fmp12/src/file.ts';

const xor = (s: string): Uint8Array => Uint8Array.from(Buffer.from(s, 'latin1'), (b) => b ^ 0x5a);
const seg = (n: number): Uint8Array => encodePathInt(n);
const kv = (key: number, data: Uint8Array): Uint8Array => Uint8Array.of(0x06, key, data.length, ...data);
const pushOp = (k: Uint8Array): number[] => k.length === 1 ? [0x20, k[0]] : k.length === 2 ? [0x28, ...k] : [0x30, ...k];

interface Entry { path: Uint8Array[]; bytes: Uint8Array }

/** Entries in stored (path) order become leaf blocks after the header and index blocks. */
function build(entries: Entry[]): Buffer {
  const blocks: number[][] = [];
  let cur: number[] = [];
  let stack: Uint8Array[] = [];
  const same = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((x, i) => x === b[i]);
  for (const e of entries) {
    let common = 0;
    while (common < stack.length && common < e.path.length && same(stack[common], e.path[common])) common++;
    let ops: number[] = [];
    for (let i = stack.length; i > common; i--) ops.push(0x3d);
    for (let i = common; i < e.path.length; i++) ops.push(...pushOp(e.path[i]));
    ops.push(...e.bytes);
    if (cur.length + ops.length > BLOCK_SIZE - 22 && cur.length) {
      blocks.push(cur);
      cur = [];
      ops = [...e.path.flatMap(pushOp), ...e.bytes];
    }
    cur.push(...ops);
    stack = e.path.slice();
  }
  if (cur.length) blocks.push(cur);
  const n = 1 + blocks.length;
  const bytes = Buffer.alloc((n + 1) * BLOCK_SIZE);
  bytes.set([0, 1, 0, 0, 0, 2, 0, 1, 0, 5, 0, 2, 0, 2, 0xc0]);
  bytes.write('HBAM7', 15, 'ascii');
  bytes[521] = 0x1e;
  bytes.writeUInt32BE(n, BLOCK_SIZE + 8);
  bytes.writeUInt16BE(1, BLOCK_SIZE + 12);
  blocks.forEach((b, i) => {
    const id = 2 + i;
    const off = id * BLOCK_SIZE;
    bytes.writeUInt32BE(i === 0 ? 0 : id - 1, off + 4);
    bytes.writeUInt32BE(i === blocks.length - 1 ? 0 : id + 1, off + 8);
    bytes.set(b, off + 20);
  });
  return bytes;
}

/** A file with one base table (id 129) of text fields (ids 1, 2, ...). */
export function syntheticFmp12(table: string, fields: string[]): Buffer {
  const T = seg(129);
  const entries: Entry[] = [{ path: [Uint8Array.of(3), Uint8Array.of(16), Uint8Array.of(5), T], bytes: kv(16, xor(table)) }];
  fields.forEach((name, i) => {
    const def = new Uint8Array(26);
    def[0] = 1;
    def[1] = 1; // text
    entries.push({ path: [T, Uint8Array.of(3), Uint8Array.of(5), seg(i + 1)], bytes: Uint8Array.from([...kv(16, xor(name)), ...kv(2, def)]) });
  });
  return build(entries);
}
