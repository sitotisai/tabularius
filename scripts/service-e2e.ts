// Throwaway probe: are NTFS file ids exact in fs.Stats.ino (Number)? (not for merge)
import { mkdtempSync, writeFileSync, lstatSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
if (process.platform !== 'win32') { console.log('not windows: skipped'); process.exit(0); }
const dir = mkdtempSync(join(tmpdir(), 'ino-probe-'));
const rows: { n: number; b: bigint }[] = [];
let collisions = 0, maxBits = 0;
const seen = new Map<number, bigint>();
for (let i = 0; i < 3000; i++) {
  const f = join(dir, `f${i}`);
  writeFileSync(f, 'x');
  const n = lstatSync(f).ino, b = lstatSync(f, { bigint: true }).ino;
  rows.push({ n, b });
  maxBits = Math.max(maxBits, b.toString(2).length);
  const prev = seen.get(n);
  if (prev !== undefined && prev !== b) collisions++;
  seen.set(n, b);
}
const inexact = rows.filter((r) => BigInt(r.n) !== r.b).length;
console.log(`PROBE ino: files ${rows.length}, number differs from exact for ${inexact}, number collisions between different files ${collisions}, max bits ${maxBits}, sample exact ${rows[0].b} ${rows[1].b} ${rows[2999].b}`);
// the test's sequence: rename the original away, write a replacement, compare
let same = 0;
for (let i = 0; i < 500; i++) {
  const d = join(dir, `d${i}`), h = join(dir, `h${i}`);
  writeFileSync(d, 'a');
  const a = lstatSync(d).ino, ab = lstatSync(d, { bigint: true }).ino;
  renameSync(d, h);
  writeFileSync(d, 'replacement');
  const c = lstatSync(d).ino, cb = lstatSync(d, { bigint: true }).ino;
  if (a === c) { same++; console.log(`PROBE same Number ino for different files: ${ab} vs ${cb}`); }
}
console.log(`PROBE rename+replace: ${same} of 500 compared equal`);
rmSync(dir, { recursive: true, force: true });
