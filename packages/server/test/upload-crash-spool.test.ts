import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import type { IncomingMessage } from 'node:http';
import { sweepOrphanUploadFolders, MAX_CONTAINER_FILE } from '../src/container-uploads.ts';
import { multipartUploadStream } from '../src/dataapi.ts';
import { Host } from '../src/host.ts';
import { Uploads } from '../src/uploads.ts';

const day = 86400000;
const age = (path: string, now: number) => utimesSync(path, new Date(now), new Date(now));

test('#28 stale same-PID and reused-PID spools expire, recent files survive', (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'tabularius-crash-test-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  const now = Date.now();
  for (const [suffix, pid, days] of [['old001', process.pid, 9], ['reuse1', 23, 9], ['young1', process.pid, 0]] as const) {
    const dir = join(tmp, 'tabularius-container-uploads-' + suffix);
    mkdirSync(dir);
    writeFileSync(join(dir, 'owner.json'), JSON.stringify({ pid, run: 'previous-run' }));
    age(join(dir, 'owner.json'), now - days * day);
    age(dir, now - days * day);
  }
  assert.equal(sweepOrphanUploadFolders({ tmp, now, alive: () => true }).removed.length, 2);
  assert.deepEqual(readdirSync(tmp), ['tabularius-container-uploads-young1']);
});

test('#25 admin startup reclaims aged parts with reused PIDs but keeps recent and active owners', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-part-test-'));
  const host = new Host(dir, () => {});
  t.after(async () => { await host.close(); rmSync(dir, { recursive: true, force: true }); });
  const first = new Uploads(host, () => {});
  t.after(() => first.stop());
  const live = first.start({ name: 'Synthetic.fmp12', size: 1 });
  const folder = join(dir, '.openhbam-uploads');
  age(join(folder, live.id + '.part'), Date.now() - 9 * day);
  const old = join(folder, `${process.pid}-${'a'.repeat(18)}-${'b'.repeat(12)}.part`);
  const reused = join(folder, `${process.ppid}-${'c'.repeat(18)}-${'d'.repeat(12)}.part`);
  const young = join(folder, `${process.pid}-${'e'.repeat(18)}-${'f'.repeat(12)}.part`);
  for (const path of [old, reused, young]) writeFileSync(path, 'synthetic');
  for (const path of [old, reused]) age(path, Date.now() - 9 * day);
  const next = new Uploads(host, () => {});
  t.after(() => next.stop());
  assert.equal(existsSync(old), false);
  assert.equal(existsSync(reused), false);
  assert.equal(existsSync(young), true);
  assert.equal(existsSync(join(folder, live.id + '.part')), true);
  // A recent orphan is reclaimed on a later sweep, without another restart.
  age(young, Date.now() - 2 * day);
  next.sweep();
  assert.equal(existsSync(young), false);
  assert.equal(existsSync(join(folder, live.id + '.part')), true);
});

test('#24 legacy request spools are swept after the safe age only', (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'tabularius-spool-test-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  const old = join(tmp, 'tabularius-upload-' + 'a'.repeat(24));
  const young = join(tmp, 'tabularius-upload-' + 'b'.repeat(24));
  writeFileSync(old, 'synthetic'); writeFileSync(young, 'synthetic');
  age(old, Date.now() - 9 * day);
  sweepOrphanUploadFolders({ tmp });
  assert.equal(existsSync(old), false);
  assert.equal(existsSync(young), true);
});

const request = (destroyed = false) => Object.assign(Readable.from([Buffer.from('--test\r\nContent-Disposition: form-data; name="upload"; filename="generated.txt"\r\n\r\nx\r\n--test--\r\n')]), {
  headers: {}, socket: { destroyed },
}) as unknown as IncomingMessage;
const type = 'multipart/form-data; boundary=test';

test('#24 single-request spools reserve a bounded aggregate and release on success and failure', async () => {
  const held: Awaited<ReturnType<typeof multipartUploadStream>>[] = [];
  try {
    for (let i = 0; i < 8; i++) held.push(await multipartUploadStream(request(), type, MAX_CONTAINER_FILE));
    await assert.rejects(multipartUploadStream(request(), type, MAX_CONTAINER_FILE).then(file => { held.push(file); }), /Too many bytes/);
    assert.ok('path' in held[0]);
    assert.match(dirname(held[0].path), /tabularius-container-uploads-/);
    held.pop()!.release();
    const broken = request(true);
    await assert.rejects(multipartUploadStream(broken, type, MAX_CONTAINER_FILE), /closed/);
    const malformed = Object.assign(Readable.from([Buffer.from(`--test\r\nContent-Disposition: form-data; name="upload"; filename*=UTF-8''%zz\r\n\r\nx\r\n--test--\r\n`)]), { headers: {}, socket: { destroyed: false } }) as unknown as IncomingMessage;
    await assert.rejects(multipartUploadStream(malformed, type, MAX_CONTAINER_FILE));
    held.push(await multipartUploadStream(request(), type, MAX_CONTAINER_FILE));
  } finally { for (const file of held) { file.release(); file.release(); } }
  const again = await multipartUploadStream(request(), type, MAX_CONTAINER_FILE);
  assert.ok('path' in again);
  const path = again.path;
  again.release();
  assert.equal(existsSync(path), false);
});
