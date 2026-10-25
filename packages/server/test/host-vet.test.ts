import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from '../../store/src/index.ts';
import { Admin } from '../src/admin.ts';
import type { DataApi } from '../src/dataapi.ts';
import { Host, STORE_EXT } from '../src/host.ts';
import { approveInRecord, HOSTED_RECORD_FILE, loadHostedRecord, markerProbes, recordWriteHook } from '../src/hosted-record.ts';

function folder(t: { after(fn: () => void): void }): string {
  const dir = mkdtempSync(join(tmpdir(), 'host-vet-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('first start approves existing files, later discoveries and renamed copies are held', async (t) => {
  const dir = folder(t);
  createStore(join(dir, 'A' + STORE_EXT));
  let host = new Host(dir);
  assert.equal(host.isHeld('A'), false);
  assert.equal(loadHostedRecord(dir)?.files.a.how, 'first-start');
  const id = host.get('A')!.fileId;
  await host.close();
  createStore(join(dir, 'B' + STORE_EXT));
  copyFileSync(join(dir, 'A' + STORE_EXT), join(dir, 'Copy' + STORE_EXT));
  host = new Host(dir);
  assert.equal(host.isHeld('A'), false);
  assert.equal(host.get('A')!.fileId, id);
  assert.equal(host.get('Copy')!.fileId, id);
  assert.equal(host.isHeld('B'), true);
  assert.equal(host.isHeld('Copy'), true);
  assert.equal(host.heldFiles().length, 2);
  assert.equal(host.files().find((f) => f.name === 'B')?.held?.reason, 'not seen before');
  const status = new Admin(host, { list: () => [] } as unknown as DataApi).status();
  assert.equal(status.databases.find((f) => f.name === 'B')?.held?.reason, 'not seen before');
  await host.close();
});

test('a follower with stores and no record does not grant first-start approval', async (t) => {
  const dir = folder(t);
  createStore(join(dir, 'A' + STORE_EXT));
  const follower = new Host(dir, () => {}, { follower: true });
  assert.equal(follower.isHeld('A'), true);
  assert.equal(loadHostedRecord(dir), undefined);
  const store = follower.get('A')!;
  approveInRecord(dir, 'A', store.fileId, 'operator', 'admin');
  follower.vetFile(store, 'found');
  assert.equal(follower.isHeld('A'), false);
  await follower.close();
});

test('swapped identity is held; reopen and approval use the saved record', async (t) => {
  const dir = folder(t);
  createStore(join(dir, 'A' + STORE_EXT));
  let host = new Host(dir);
  const old = host.get('A')!.fileId;
  await host.close();
  rmSync(join(dir, 'A' + STORE_EXT));
  createStore(join(dir, 'A' + STORE_EXT));
  host = new Host(dir);
  assert.notEqual(host.get('A')!.fileId, old);
  assert.equal(host.get('A')!.held?.reason, 'a different file than the one approved');
  let calls = 0;
  host.onApprove.add(() => { calls++; });
  host.approve('A', 'operator');
  assert.equal(host.isHeld('A'), false);
  assert.equal(calls, 1);
  assert.equal(loadHostedRecord(dir)?.files.a.how, 'admin');
  assert.equal(host.closeFile('A'), true);
  assert.equal(host.openFile('A'), true);
  assert.equal(host.isHeld('A'), false);
  await host.close();
});

test('damaged record stays untouched, including after a trusted create', async (t) => {
  const dir = folder(t);
  createStore(join(dir, 'A' + STORE_EXT));
  const path = join(dir, HOSTED_RECORD_FILE);
  writeFileSync(path, '{');
  const log: string[] = [];
  const host = new Host(dir, (line) => log.push(line));
  assert.equal(host.get('A')!.held?.reason, 'the approval record is damaged or missing');
  const made = host.create('B');
  assert.equal(made.held?.reason, 'the approval record is damaged or missing');
  assert.throws(() => host.approve('A', 'operator'), /damaged/);
  assert.equal(readFileSync(path, 'utf8'), '{');
  assert.ok(log.some((line) => line.includes('approval record is missing')));
  await host.close();
});

test('a failed approval write leaves trusted files held; a follower never writes', async (t) => {
  const dir = folder(t);
  let host = new Host(dir);
  await host.close();
  host = new Host(dir);
  // A write that fails after its temp file is written (a full disk): the record is left as it was.
  recordWriteHook.run = () => { throw new Error('no space left on device'); };
  t.after(() => { recordWriteHook.run = undefined; });
  const made = host.create('Created');
  assert.equal(made.held?.reason, 'not seen before');
  assert.throws(() => host.approve('Created', 'operator'), /no space left/);
  assert.equal(host.isHeld('Created'), true);
  assert.deepEqual(readdirSync(dir).filter((n) => n.startsWith(HOSTED_RECORD_FILE) && n !== HOSTED_RECORD_FILE), [], 'the failed write left no temp file');
  recordWriteHook.run = undefined;
  await host.close();
  const before = readFileSync(join(dir, HOSTED_RECORD_FILE));
  const follower = new Host(dir, () => {}, { follower: true });
  assert.equal(follower.isHeld('Created'), true);
  assert.equal(readFileSync(join(dir, HOSTED_RECORD_FILE)).equals(before), true);
  await follower.close();
});

test('trusted upload and restore-copy origins are saved with their source', async (t) => {
  const dir = folder(t);
  const host = new Host(dir);
  for (const [name, how] of [['Upload', 'upload'], ['Restored', 'restore']] as const) {
    const path = join(dir, name + STORE_EXT);
    createStore(path);
    const store = host.add(path, 'trusted', how, 'admin console');
    assert.equal(store.held, undefined);
    assert.equal(loadHostedRecord(dir)?.files[name.toLowerCase()].how, how);
    assert.equal(loadHostedRecord(dir)?.files[name.toLowerCase()].by, 'admin console');
  }
  host.create('MadeByServer');
  assert.equal(loadHostedRecord(dir)?.files.madebyserver.by, 'server');
  await host.close();
});

test('a lost approval record holds old and newly dropped stores without recreating it', async (t) => {
  const dir = folder(t);
  createStore(join(dir, 'A' + STORE_EXT));
  let host = new Host(dir);
  host.approve('A', 'operator');
  await host.close();
  rmSync(join(dir, HOSTED_RECORD_FILE));
  createStore(join(dir, 'Evil' + STORE_EXT));
  const lines: string[] = [];
  host = new Host(dir, (line) => lines.push(line));
  assert.equal(host.isHeld('A'), true);
  assert.equal(host.isHeld('Evil'), true);
  assert.equal(existsSync(join(dir, HOSTED_RECORD_FILE)), false);
  assert.equal(lines.filter((line) => line.includes('approval record is missing')).length, 1);
  host.approve('A', 'operator');
  assert.equal(host.isHeld('A'), false);
  assert.equal(host.isHeld('Evil'), true);
  assert.ok(loadHostedRecord(dir)?.instance);
  await host.close();
});

test('a valid shaped record with an unrelated instance holds all stores', async (t) => {
  const dir = folder(t);
  createStore(join(dir, 'A' + STORE_EXT));
  let host = new Host(dir);
  await host.close();
  const path = join(dir, HOSTED_RECORD_FILE);
  const record = JSON.parse(readFileSync(path, 'utf8'));
  record.instance = '00000000-0000-4000-8000-000000000000';
  writeFileSync(path, JSON.stringify(record));
  host = new Host(dir);
  assert.equal(host.isHeld('A'), true);
  assert.equal(host.get('A')?.held?.reason, 'the approval record is damaged or missing');
  await host.close();
});

test('invalid stored fileId is replaced before approval and remains approved after restart', async (t) => {
  const dir = folder(t);
  createStore(join(dir, 'A' + STORE_EXT));
  for (const invalid of ['0', '""', '{}', '"ABCDEF00-0000-4000-8000-000000000000"', '{']) {
    const sql = new DatabaseSync(join(dir, 'A' + STORE_EXT));
    sql.prepare("INSERT OR REPLACE INTO _fm_meta (key, json) VALUES ('fileId', ?)").run(invalid);
    sql.close();
    let host = new Host(dir);
    const id = host.get('A')!.fileId;
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    host.approve('A', 'operator');
    await host.close();
    host = new Host(dir);
    assert.equal(host.get('A')!.fileId, id);
    assert.equal(host.isHeld('A'), false);
    await host.close();
  }
});

test('runtime conversion stays held, while upload and uploaded unlock are approved', async (t) => {
  const dir = folder(t);
  const host = new Host(dir);
  (host as unknown as { convert: (src: string, dest: string) => Promise<{ tables: number; records: number }> }).convert = async (_src, dest) => {
    createStore(dest);
    return { tables: 0, records: 0 };
  };
  writeFileSync(join(dir, 'Dropped.fmp12'), 'synthetic source');
  assert.equal(await host.scan(), undefined);
  assert.equal(await host.scan(), 'Dropped');
  assert.equal(host.isHeld('Dropped'), true);
  const upload = join(dir, 'incoming.part');
  writeFileSync(upload, 'synthetic source');
  await host.hostUpload(upload, 'Uploaded', undefined, undefined, 'operator');
  assert.equal(host.isHeld('Uploaded'), false);
  assert.equal(loadHostedRecord(dir)?.files.uploaded.how, 'upload');
  writeFileSync(join(dir, 'Locked.fmp12'), 'synthetic source');
  host.locked.set('Locked.fmp12', { size: 16, uploaded: true, by: 'operator' });
  await host.unlock('Locked.fmp12', 'synthetic', () => {}, { checked: true });
  assert.equal(host.isHeld('Locked'), false);
  assert.equal(loadHostedRecord(dir)?.files.locked.how, 'upload');
  await host.close();
});

test('a startup conversion on first start is held while an existing store is approved', async (t) => {
  const dir = folder(t);
  createStore(join(dir, 'Existing' + STORE_EXT));
  writeFileSync(join(dir, 'Converted.fmp12'), 'synthetic source');
  const host = new Host(dir, () => {}, { startupImport: (_src, dest) => { createStore(dest); return []; } });
  assert.equal(host.isHeld('Existing'), false);
  assert.equal(host.isHeld('Converted'), true);
  assert.equal(loadHostedRecord(dir)?.files.converted, undefined);
  await host.close();
});

test('a follower trusted add leaves the approval record and store marker untouched', async (t) => {
  const dir = folder(t);
  let host = new Host(dir);
  await host.close();
  createStore(join(dir, 'Added' + STORE_EXT));
  const before = readFileSync(join(dir, HOSTED_RECORD_FILE));
  const follower = new Host(dir, () => {}, { follower: true });
  const store = follower.get('Added')!;
  follower.vetFile(store, 'trusted', 'upload', 'operator');
  assert.equal(follower.isHeld('Added'), true);
  assert.equal(readFileSync(join(dir, HOSTED_RECORD_FILE)).equals(before), true);
  const sql = new DatabaseSync(store.path, { readOnly: true });
  assert.equal(sql.prepare("SELECT json FROM _fm_meta WHERE key = 'hostedInstance'").get(), undefined);
  sql.close();
  await follower.close();
});

// Counts how many store files the approval check opens, not how long it takes: each check of a record opened every store in the
// folder, once per store, so a restart of N stores opened about N squared files.
test('a restart reads the stores\' markers a bounded number of times, however many stores there are', async (t) => {
  const dir = folder(t);
  const N = 30;
  for (let i = 0; i < N; i++) createStore(join(dir, `S${i}` + STORE_EXT));
  await new Host(dir).close();
  for (const follower of [false, true]) {
    const before = markerProbes.count;
    const host = new Host(dir, () => {}, { follower });
    const opened = markerProbes.count - before;
    assert.equal(host.heldFiles().length, 0, 'every file was approved on the first start');
    assert.ok(opened <= 4, `${follower ? 'a follower' : 'the leader'} opened ${opened} stores to check ${N}`);
    await host.close();
  }
});

test('files dropped in beside many approved ones are checked once per start, not once per file', async (t) => {
  const dir = folder(t);
  const N = 12;
  for (let i = 0; i < N; i++) createStore(join(dir, `S${i}` + STORE_EXT));
  await new Host(dir).close();
  // Unmarked stores never carry the record's instance, so a check that has to look at all of them is the slowest case.
  for (let i = 0; i < N; i++) createStore(join(dir, `New${i}` + STORE_EXT));
  const before = markerProbes.count;
  const host = new Host(dir);
  const opened = markerProbes.count - before;
  assert.equal(host.heldFiles().length, N);
  assert.ok(opened <= 4 * N, `${opened} stores opened to check ${2 * N}`);
  await host.close();
});
