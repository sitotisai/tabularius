import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, renameSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import type { IncomingMessage } from 'node:http';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { ContainerUploads, requestUploadSpool, sweepOrphanUploadFolders, MAX_CONTAINER_FILE, MAX_REQUEST_SPOOLS_PER_ACCOUNT } from '../src/container-uploads.ts';
import { withFilesystemHook } from '../../store/src/fs-boundary.ts';
import { ApiError, multipartUploadStream } from '../src/dataapi.ts';
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
  t.after(async () => { await host.close(); });
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
  t.after(() => rmSync(dir, { recursive: true, force: true }));
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

test('#25 a part whose owner is confirmed dead is removed at once; same-PID and live-PID parts keep the grace', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-part-dead-test-'));
  const host = new Host(dir, () => {});
  t.after(async () => { await host.close(); });
  const folder = join(dir, '.openhbam-uploads');
  mkdirSync(folder);
  const exited = spawnSync(process.execPath, ['-e', '0']);
  assert.equal(exited.status, 0);
  const part = (pid: number, c: string) => join(folder, `${pid}-${c.repeat(18)}-${'x'.repeat(12)}.part`);
  const dead = part(exited.pid!, 'a');
  const same = part(process.pid, 'b');
  const live = part(process.ppid, 'c');
  for (const path of [dead, same, live]) writeFileSync(path, 'synthetic');
  const uploads = new Uploads(host, () => {});
  t.after(() => uploads.stop());
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  assert.equal(existsSync(dead), false, 'a crash-looping server must not pile up the parts of owners that are gone');
  assert.equal(existsSync(same), true);
  assert.equal(existsSync(live), true);
});

test('a crash leftover swapped after it was judged is not removed', { skip: process.platform === 'win32' }, (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-part-swap-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const folder = join(dir, '.openhbam-uploads');
  mkdirSync(folder);
  const file = join(folder, `99999999-${'a'.repeat(18)}-${'b'.repeat(12)}.part`);
  writeFileSync(file, 'old');
  let n = 0;
  const up = withFilesystemHook((e) => {
    if (e.operation === 'remove' && e.phase === 'checked' && e.path === file && n++ === 0) {
      writeFileSync(file + '.new', 'new');
      renameSync(file + '.new', file);
    }
  }, () => new Uploads({ dir } as never));
  up.stop();
  assert.ok(n > 0);
  assert.ok(existsSync(file));
  assert.equal(readFileSync(file, 'utf8'), 'new');
  const again = new Uploads({ dir } as never);
  again.stop();
  assert.equal(existsSync(file), false);
});

test('a request spool folder swapped before release keeps the swapped folder', { skip: process.platform === 'win32' }, (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'tabularius-request-spool-swap-test-'));
  const spool = requestUploadSpool(10, { db: 'Db', account: 'A' }, tmp);
  t.after(() => { spool.release(); rmSync(tmp, { recursive: true, force: true }); });
  const dir = dirname(spool.path);
  let n = 0;
  withFilesystemHook((e) => {
    if (e.operation === 'remove' && e.phase === 'checked' && e.path === dir && n++ === 0) {
      renameSync(dir, dir + '-aside');
      mkdirSync(dir);
      writeFileSync(join(dir, 'sentinel'), 'safe');
    }
  }, () => spool.release());
  assert.ok(n > 0);
  assert.ok(existsSync(join(dir, 'sentinel')));
});

test('an unswapped request spool folder is removed on release', (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'tabularius-request-spool-release-test-'));
  const spool = requestUploadSpool(10, { db: 'Db', account: 'A' }, tmp);
  t.after(() => { spool.release(); rmSync(tmp, { recursive: true, force: true }); });
  const dir = dirname(spool.path);
  assert.ok(existsSync(dir));
  spool.release();
  assert.equal(existsSync(dir), false);
});

test('#28 a folder with this PID but another run is foreign: a live PID keeps it, only this run is reclaimed after the day', (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'tabularius-run-test-'));
  const uploads = new ContainerUploads({ tmp });
  t.after(() => uploads.stop());
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  uploads.start({ db: 'D', account: 'A' }, { layout: 'L', recordId: 1, field: 'F', repetition: 1 }, { size: 1 });
  const [tracked] = readdirSync(tmp);
  const run = JSON.parse(readFileSync(join(tmp, tracked, 'owner.json'), 'utf8')).run as string;
  assert.match(run, /^[a-f0-9]{36}$/);
  const now = Date.now();
  const made = (suffix: string, marker: Record<string, unknown>) => {
    const dir = join(tmp, 'tabularius-container-uploads-' + suffix);
    mkdirSync(dir);
    writeFileSync(join(dir, 'owner.json'), JSON.stringify({ pid: process.pid, ...marker }));
    age(join(dir, 'owner.json'), now - 2 * day);
    age(dir, now - 2 * day);
    return 'tabularius-container-uploads-' + suffix;
  };
  const ours = made('ours01', { run });
  const other = made('other1', { run: 'another-container-run' });
  const unmarked = made('norun1', {});
  const result = sweepOrphanUploadFolders({ tmp, now });
  assert.deepEqual(result.removed, [ours]);
  assert.equal(existsSync(join(tmp, other)), true, 'another container sharing the PID and the folder is not ours to remove');
  assert.equal(existsSync(join(tmp, unmarked)), true);
  assert.equal(existsSync(join(tmp, tracked)), true);
  // A live PID cannot hold a folder for ever.
  const later = sweepOrphanUploadFolders({ tmp, now: now + 7 * day });
  assert.deepEqual(later.removed.sort(), [other, unmarked].sort());
  assert.equal(existsSync(join(tmp, tracked)), true);
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

const body = Buffer.from('--test\r\nContent-Disposition: form-data; name="upload"; filename="generated.txt"\r\n\r\nx\r\n--test--\r\n');
/** A request as the parser hands it over: Content-Length when the body has one, no header at all for a chunked body. */
const request = (opts: { destroyed?: boolean; length?: number | null; chunked?: boolean; data?: Buffer } = {}) => {
  const data = opts.data ?? body;
  const headers: Record<string, string> = {};
  if (opts.length !== null) headers['content-length'] = String(opts.length ?? data.length);
  if (opts.chunked) headers['transfer-encoding'] = 'chunked';
  return Object.assign(Readable.from([data]), { headers, socket: { destroyed: opts.destroyed ?? false } }) as unknown as IncomingMessage;
};
const type = 'multipart/form-data; boundary=test';
type Held = Awaited<ReturnType<typeof multipartUploadStream>>;
const who = (account: string, db = 'Db') => ({ db, account });

/** Runs a test with the request spools in a folder of its own, and every spool released at the end. */
function spools(t: { after(fn: () => void): void }) {
  const tmp = mkdtempSync(join(tmpdir(), 'tabularius-request-spool-test-'));
  const before = process.env.TABULARIUS_UPLOAD_TMP;
  process.env.TABULARIUS_UPLOAD_TMP = tmp;
  const held: Held[] = [];
  t.after(() => {
    for (const file of held) file.release();
    if (before === undefined) delete process.env.TABULARIUS_UPLOAD_TMP; else process.env.TABULARIUS_UPLOAD_TMP = before;
    rmSync(tmp, { recursive: true, force: true });
  });
  const take = async (req: IncomingMessage, account: string, db?: string) => { const file = await multipartUploadStream(req, type, MAX_CONTAINER_FILE, undefined, who(account, db)); held.push(file); return file; };
  const drop = (file: Held) => { file.release(); held.splice(held.indexOf(file), 1); };
  return { tmp, held, take, drop };
}
const busy = (error: unknown) => error instanceof ApiError && error.status === 503 && error.code === 301 && (error.retryAfter ?? 0) > 0 && /try again/.test(error.message);

test('#24 a body with a Content-Length reserves that length, so small uploads do not use up the 8 GiB budget', async (t) => {
  const { take } = spools(t);
  // Twenty accounts, each with a small file: far more than eight, because each reserves only its own bytes.
  for (let i = 0; i < 20; i++) await take(request(), 'account' + i);
  // A body of unknown length reserves the whole 1 GiB each: seven fit beside the small ones, the eighth waits.
  for (let i = 0; i < 7; i++) await take(request({ length: null, chunked: true }), 'chunked' + i);
  await assert.rejects(take(request({ length: null, chunked: true }), 'chunked7'), busy);
  // A Content-Length beside Transfer-Encoding is not trusted either.
  await assert.rejects(take(request({ chunked: true }), 'both'), busy);
  // A small one still fits.
  await take(request(), 'late');
});

test('#24 a Content-Length over the limit is refused with 413 before anything is reserved', async (t) => {
  const { take, held, tmp } = spools(t);
  await assert.rejects(take(request({ length: MAX_CONTAINER_FILE + 1 }), 'a'), (e: unknown) => e instanceof ApiError && e.status === 413);
  assert.equal(held.length, 0);
  assert.deepEqual(readdirSync(tmp), []);
  for (let i = 0; i < 8; i++) await take(request({ length: MAX_CONTAINER_FILE }), 'big' + i);
});

test('#24 a lying Content-Length cannot push more than it reserved to disk', async (t) => {
  const { take, held } = spools(t);
  await assert.rejects(take(request({ length: 10 }), 'liar'), (e: unknown) => e instanceof ApiError && e.status === 413);
  assert.equal(held.length, 0);
});

test('#24 releasing a spool frees its reservation exactly once, on success and on every failure', async (t) => {
  const { take, drop, held, tmp } = spools(t);
  const first: Held[] = [];
  for (let i = 0; i < 8; i++) first.push(await take(request({ length: null }), 'user' + i));
  await assert.rejects(take(request({ length: null }), 'user8'), busy);
  assert.ok('path' in first[0]);
  assert.match(dirname(first[0].path), /tabularius-container-uploads-/);
  assert.equal(dirname(dirname(first[0].path)), tmp, 'spools use the configured folder');
  drop(first[0]);
  first[0].release(); // a second release changes nothing
  await assert.rejects(take(request({ destroyed: true }), 'closed'), /closed/);
  const malformed = request({ data: Buffer.from(`--test\r\nContent-Disposition: form-data; name="upload"; filename*=UTF-8''%zz\r\n\r\nx\r\n--test--\r\n`) });
  await assert.rejects(take(malformed, 'malformed'));
  assert.equal(held.length, 7);
  const again = await take(request({ length: null }), 'again');
  assert.ok('path' in again);
  const path = again.path;
  drop(again);
  assert.equal(existsSync(path), false);
  await assert.rejects(take(request({ length: null }), 'user9').then(() => take(request({ length: null }), 'user10')), busy);
});

test('#24 one account may hold only a few single-request spools, whatever their size; others are unaffected', async (t) => {
  const { take, drop } = spools(t);
  assert.equal(MAX_REQUEST_SPOOLS_PER_ACCOUNT, 4);
  const mine: Held[] = [];
  for (let i = 0; i < MAX_REQUEST_SPOOLS_PER_ACCOUNT; i++) mine.push(await take(request(), 'Alice'));
  // The fifth is turned away for now, however small, and the name's case does not matter.
  await assert.rejects(take(request(), 'alice'), busy);
  // Another account, and the same account name in another file, are not held up by it.
  await take(request(), 'Bob');
  await take(request(), 'Alice', 'OtherDb');
  drop(mine[1]);
  mine.splice(1, 1);
  mine.push(await take(request(), 'ALICE'));
  await assert.rejects(take(request(), 'Alice'), busy);
});

test('#24 a refused spool leaves nothing behind and does not count against the account', async (t) => {
  const { take, drop, held, tmp } = spools(t);
  for (let i = 0; i < 8; i++) await take(request({ length: null }), 'user' + i);
  const before = readdirSync(tmp).length;
  // Refused for the budget more often than the account's own limit: none of those may have counted against it.
  for (let i = 0; i < 6; i++) await assert.rejects(take(request(), 'victim'), busy);
  assert.equal(readdirSync(tmp).length, before);
  drop(held[0]);
  for (let i = 0; i < MAX_REQUEST_SPOOLS_PER_ACCOUNT; i++) await take(request(), 'victim');
  assert.equal(held.length, 7 + MAX_REQUEST_SPOOLS_PER_ACCOUNT);
});
