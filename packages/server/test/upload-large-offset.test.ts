// A piece of an upload says where it starts (?offset=N). The route once refused any offset above 1,000,000,000, so a file
// larger than about a gigabyte could be started and filled to that point but never finished, although the server takes
// up to 10 GB (TABULARIUS_MAX_UPLOAD). What stops a wrong offset is Uploads.write (it must be what has arrived so far),
// and what stops a file that is too large is its declared size, checked against that limit when the upload starts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ftruncateSync, mkdtempSync, openSync, closeSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { IncomingMessage } from 'node:http';
import { Readable } from 'node:stream';
import { Host } from '../src/host.ts';
import { serve } from '../src/index.ts';
import { Uploads } from '../src/uploads.ts';

test('a piece that starts beyond what has arrived is told where to send from, wherever the offset is (not "offset is 0 to 1000000000")', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-upload-offset-'));
  const { server, url } = await serve({ dir, port: 0, log: () => {} });
  t.after(async () => { await new Promise<void>((r) => server.close(() => r())); rmSync(dir, { recursive: true, force: true }); });
  const admin = async (path: string, method = 'GET', body?: string | Uint8Array<ArrayBuffer>) => {
    const response = await fetch(`${url}/tabularius/admin/v1/uploads${path}`, { method, headers: { 'x-tabularius-admin': '1', 'content-type': 'application/json' }, body });
    return { status: response.status, body: await response.json() as { id?: string; error?: string; messages?: { message?: string }[] } };
  };
  const started = await admin('', 'POST', JSON.stringify({ name: 'Large.fmp12', size: 1_100_000_000 }));
  assert.equal(started.status, 201);
  const id = started.body.id!;
  const piece = new Uint8Array([0]);
  for (const offset of [1_000_000_001, 5_000_000_000, 10 * 1024 ** 3]) {
    const r = await admin(`/${id}?offset=${offset}`, 'PUT', piece);
    assert.equal(r.status, 409, `offset ${offset}`);
    assert.match(JSON.stringify(r.body), /Send from byte 0/);
  }
  // Not a number, negative, or beyond what a JavaScript integer holds exactly: still a malformed request.
  for (const offset of ['abc', '-1', '1.5', '9007199254740993']) assert.equal((await admin(`/${id}?offset=${offset}`, 'PUT', piece)).status, 400, offset);
  // The first piece still goes in.
  assert.equal((await admin(`/${id}?offset=0`, 'PUT', piece)).status, 200);
});

test('Uploads takes a piece that starts past 1,000,000,000 bytes once that much has arrived (a sparse file stands in for it)', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-upload-sparse-'));
  const host = new Host(dir, () => {});
  t.after(async () => { await host.close(); });
  const uploads = new Uploads(host, () => {});
  t.after(() => uploads.stop());
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const size = 1_000_000_200;
  const u = uploads.start({ name: 'Large.fmp12', size });
  // Pretend 1,000,000,100 bytes have arrived: a sparse file of that length takes no disk, and the upload remembers it.
  const part = join(dir, '.openhbam-uploads', `${u.id}.part`);
  const fd = openSync(part, 'r+');
  try { ftruncateSync(fd, 1_000_000_100); } finally { closeSync(fd); }
  u.received = 1_000_000_100;
  const piece = (n: number) => Object.assign(Readable.from([Buffer.alloc(n, 1)]), { headers: { 'content-length': String(n) } }) as unknown as IncomingMessage;
  await uploads.write(u.id, 1_000_000_100, piece(50));
  assert.equal(u.received, 1_000_000_150);
  // A retry of the last piece is fine; a gap is not; and the declared size is still the limit.
  await uploads.write(u.id, 1_000_000_100, piece(50));
  await assert.rejects(uploads.write(u.id, 1_000_000_200, piece(1)), /Send from byte 1000000150/);
  await assert.rejects(uploads.write(u.id, 1_000_000_150, piece(size - 1_000_000_150 + 1)), /More bytes than the file's size/);
});
