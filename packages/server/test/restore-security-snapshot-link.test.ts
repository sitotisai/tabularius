// Putting a file back in place first copies its live security database to a side file in the hosted folder; a symbolic link planted at
// that side file's name must not receive the copy.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, lstatSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { createStore } from '../../store/src/index.ts';
import { serve } from '../src/index.ts';

test('a replace restore does not copy the security database through a link planted at its side file', { timeout: 60_000, skip: process.platform === 'win32' && 'links need privileges on Windows' }, async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-restore-snapshot-'));
  const file = join(dir, 'Notes.openhbam.sqlite');
  createStore(file, { mode: 'native' });
  const s = await serve({ dir, port: 0, hostname: '127.0.0.1', watch: false, log: () => {}, progressive: { every: 3_600_000 } });
  t.after(async () => { await new Promise<void>((r) => s.server.close(() => r())); rmSync(dir, { recursive: true, force: true }); });
  const admin = (method: string, body?: object) => fetch(`${s.url}/tabularius/admin/v1/restore`, {
    method, headers: { 'x-tabularius-admin': '1', 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}),
  }).then(async (r) => ({ status: r.status, body: await r.json() as Record<string, unknown> }));
  // Point-in-time backups start with a full backup.
  for (let i = 0; i < 200; i++) {
    const points = (await admin('GET')).body as { progressive?: boolean; databases?: { from?: unknown }[] };
    if (points.progressive && points.databases?.[0]?.from) break;
    await sleep(50);
  }
  s.progressive!.run();
  await sleep(30);
  const at = Date.now();

  // The side file is the live file's name plus ".security-snapshot". A link to an existing file and a dangling one are both refused.
  const side = file + '.security-snapshot';
  const victim = join(dir, 'victim');
  writeFileSync(victim, 'keep');
  symlinkSync(victim, side);
  const refused = await admin('POST', { database: 'Notes', at, mode: 'replace' });
  assert.ok(refused.status >= 400, JSON.stringify(refused.body));
  assert.equal(readFileSync(victim, 'utf8'), 'keep', 'the security database was not copied over the link target');
  assert.ok(lstatSync(side).isSymbolicLink(), 'the planted link is still there');
  rmSync(side);
  symlinkSync(join(dir, 'nowhere'), side);
  assert.ok((await admin('POST', { database: 'Notes', at, mode: 'replace' })).status >= 400);
  assert.equal(existsSync(join(dir, 'nowhere')), false, 'nothing was created at the link target');
  rmSync(side);
  assert.ok(s.host.get('Notes'), 'the file is still hosted after a refused restore');

  // A leftover regular side file from an earlier crash is replaced, the restore completes, and no side file remains.
  writeFileSync(side, 'stale');
  const done = await admin('POST', { database: 'Notes', at, mode: 'replace' });
  assert.equal(done.status, 200, JSON.stringify(done.body));
  assert.equal(existsSync(side), false, 'the side file is removed afterwards');
  assert.ok(s.host.get('Notes'));
});
