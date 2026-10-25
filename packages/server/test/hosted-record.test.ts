import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createStore } from '../../store/src/index.ts';
import { backupFolder, restoreAt, restoreBackup } from '../src/backup.ts';
import { Host } from '../src/host.ts';
import { approveInRecord, approveRestoredFiles, firstStartRecord, HOSTED_RECORD_FILE, loadHostedRecord, verifiedHostedRecord, vet } from '../src/hosted-record.ts';

function folder(t: { after(fn: () => void): void }): string {
  const dir = mkdtempSync(join(tmpdir(), 'hosted-record-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('record is strict, atomic, and a damaged copy cannot be overwritten', (t) => {
  const dir = folder(t);
  assert.equal(loadHostedRecord(dir), undefined);
  firstStartRecord(dir, [{ name: 'A', id: '00000000-0000-4000-8000-000000000001' }]);
  if (process.platform !== 'win32') assert.equal(statSync(join(dir, HOSTED_RECORD_FILE)).mode & 0o777, 0o600);
  assert.equal(vet(loadHostedRecord(dir), 'a', '00000000-0000-4000-8000-000000000001'), 'approved');
  assert.equal(vet(loadHostedRecord(dir), 'A', '00000000-0000-4000-8000-000000000002'), 'held');
  assert.equal(existsSync(join(dir, HOSTED_RECORD_FILE + '.tmp')), false);
  approveInRecord(dir, 'B', '00000000-0000-4000-8000-000000000002', 'admin', 'admin');
  assert.equal(vet(loadHostedRecord(dir), 'B', '00000000-0000-4000-8000-000000000002'), 'approved');
  approveInRecord(dir, '__proto__', '00000000-0000-4000-8000-000000000003', 'admin', 'admin');
  assert.equal(vet(loadHostedRecord(dir), '__proto__', '00000000-0000-4000-8000-000000000003'), 'approved');
  assert.equal(vet(loadHostedRecord(dir), 'constructor', '00000000-0000-4000-8000-000000000003'), 'held');
  const path = join(dir, HOSTED_RECORD_FILE);
  writeFileSync(path, '{');
  assert.equal(loadHostedRecord(dir), null);
  assert.equal(vet(loadHostedRecord(dir), 'A', '00000000-0000-4000-8000-000000000001'), 'unknown-record');
  assert.throws(() => approveInRecord(dir, 'C', '00000000-0000-4000-8000-000000000003', 'admin', 'admin'), /damaged/);
  assert.equal(readFileSync(path, 'utf8'), '{');
  const valid = { version: 1, instance: '00000000-0000-4000-8000-000000000001', files: { a: { id: '00000000-0000-4000-8000-000000000002', approvedAt: new Date().toISOString(), by: 'operator', how: 'admin' } } };
  for (const wrong of [{ version: 2, files: {} }, { version: 1, files: { a: { id: 7 } } }, { version: 1, files: {}, extra: true }, { ...valid, instance: 'wrong' }, { ...valid, files: { a: { ...valid.files.a, id: '0' } } }]) {
    writeFileSync(path, JSON.stringify(wrong));
    assert.equal(loadHostedRecord(dir), null);
  }
});

test('an abandoned record temp does not block an approval', (t) => {
  const dir = folder(t);
  const temp = join(dir, HOSTED_RECORD_FILE + '.tmp');
  writeFileSync(temp, 'interrupted write');
  approveInRecord(dir, 'A', '00000000-0000-4000-8000-000000000001', 'operator', 'admin');
  assert.equal(loadHostedRecord(dir)?.files.a.by, 'operator');
  assert.equal(vet(loadHostedRecord(dir), 'A', '00000000-0000-4000-8000-000000000001'), 'approved');
  assert.equal(existsSync(temp), false);
});

test('probing an existing store marker creates no SQLite sidecars', async (t) => {
  const dir = folder(t);
  createStore(join(dir, 'A.openhbam.sqlite'));
  const host = new Host(dir);
  await host.close();
  const before = readdirSync(dir).sort();
  assert.ok(verifiedHostedRecord(dir));
  assert.deepEqual(readdirSync(dir).sort(), before);
});

test('a marker still in the write-ahead log is evidence of a lost record', (t) => {
  const dir = folder(t);
  const path = join(dir, 'A.openhbam.sqlite');
  createStore(path);
  const sql = new DatabaseSync(path);
  sql.exec('PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0');
  sql.prepare("INSERT OR REPLACE INTO _fm_meta (key, json) VALUES ('hostedInstance', ?)").run(JSON.stringify('00000000-0000-4000-8000-000000000001'));
  assert.equal(verifiedHostedRecord(dir), null);
  sql.close();
});

test('restore approvals merge and backups omit the local record', async (t) => {
  const root = folder(t);
  const live = join(root, 'live'); const dest = join(root, 'backups');
  mkdirSync(live); mkdirSync(dest);
  createStore(join(live, 'A.openhbam.sqlite'));
  approveInRecord(live, 'Old', '00000000-0000-4000-8000-000000000004', 'admin', 'admin');
  const backup = await backupFolder(live, dest, 0, '');
  assert.equal(readdirSync(backup.dir).includes(HOSTED_RECORD_FILE), false);
  createStore(join(live, 'B.openhbam.sqlite'));
  await restoreBackup(live, backup.dir, 'A', '');
  const record = loadHostedRecord(live);
  assert.equal(record?.files.old.id, '00000000-0000-4000-8000-000000000004');
  assert.equal(record?.files.a.how, 'restore');
  assert.equal(record?.files.b, undefined);
  assert.equal(readdirSync(live).some((name) => name === HOSTED_RECORD_FILE + '.tmp'), false);
  approveRestoredFiles(live, ['B']);
  assert.equal(loadHostedRecord(live)?.files.b.how, 'restore');
  approveInRecord(live, 'A', '00000000-0000-4000-8000-000000000005', 'admin', 'admin');
  await restoreAt(live, dest, Date.now() + 1000, 'A', '');
  assert.equal(loadHostedRecord(live)?.files.a.how, 'restore');
});

test('a damaged record does not turn a committed restore into an error', async (t) => {
  const root = folder(t);
  const live = join(root, 'live'); const dest = join(root, 'backups');
  mkdirSync(live); mkdirSync(dest);
  createStore(join(live, 'A.openhbam.sqlite'));
  const backup = await backupFolder(live, dest, 0, '');
  rmSync(join(live, 'A.openhbam.sqlite'));
  writeFileSync(join(live, HOSTED_RECORD_FILE), '{');
  const lines: string[] = [];
  assert.deepEqual(await restoreBackup(live, backup.dir, 'A', '', { log: (line) => lines.push(line) }), ['A.openhbam.sqlite']);
  assert.equal(existsSync(join(live, 'A.openhbam.sqlite')), true);
  assert.equal(readFileSync(join(live, HOSTED_RECORD_FILE), 'utf8'), '{');
  assert.equal(vet(loadHostedRecord(live), 'A', 'anything'), 'unknown-record');
  assert.ok(lines.some((line) => /damaged.*held/i.test(line)));
  const host = new Host(live);
  assert.equal(host.isHeld('A'), true);
  await host.close();
  rmSync(join(live, 'A.openhbam.sqlite'));
  lines.length = 0;
  assert.equal((await restoreAt(live, dest, Date.now() + 1000, 'A', '', { log: (line) => lines.push(line) })).length, 1);
  assert.equal(readFileSync(join(live, HOSTED_RECORD_FILE), 'utf8'), '{');
  assert.ok(lines.some((line) => /damaged.*held/i.test(line)));
  const afterPointRestore = new Host(live);
  assert.equal(afterPointRestore.isHeld('A'), true);
  await afterPointRestore.close();
});

test('restore into an empty folder creates approval for the restored store', async (t) => {
  const root = folder(t);
  const source = join(root, 'source'); const live = join(root, 'live'); const dest = join(root, 'backups');
  mkdirSync(source); mkdirSync(live); mkdirSync(dest);
  createStore(join(source, 'A.openhbam.sqlite'));
  const sourceHost = new Host(source);
  await sourceHost.close();
  const backup = await backupFolder(source, dest, 0, '');
  await restoreBackup(live, backup.dir, 'A', '');
  const host = new Host(live);
  assert.equal(host.isHeld('A'), false);
  assert.equal(loadHostedRecord(live)?.files.a.how, 'restore');
  await host.close();
});

test('partial restore before first start approves stores already in the folder', async (t) => {
  const root = folder(t);
  const source = join(root, 'source'); const live = join(root, 'live'); const dest = join(root, 'backups');
  mkdirSync(source); mkdirSync(live); mkdirSync(dest);
  createStore(join(source, 'Restored.openhbam.sqlite'));
  createStore(join(live, 'Existing.openhbam.sqlite'));
  const backup = await backupFolder(source, dest, 0, '');
  await restoreBackup(live, backup.dir, 'Restored', '');
  const host = new Host(live);
  assert.equal(host.isHeld('Existing'), false);
  assert.equal(host.isHeld('Restored'), false);
  assert.equal(loadHostedRecord(live)?.files.existing.how, 'first-start');
  await host.close();
});

test('restore with missing approval record and prior marker leaves committed file held', async (t) => {
  const root = folder(t);
  const live = join(root, 'live'); const dest = join(root, 'backups');
  mkdirSync(live); mkdirSync(dest);
  createStore(join(live, 'A.openhbam.sqlite'));
  let host = new Host(live);
  await host.close();
  const backup = await backupFolder(live, dest, 0, '');
  rmSync(join(live, HOSTED_RECORD_FILE));
  const lines: string[] = [];
  await restoreBackup(live, backup.dir, 'A', '', { log: (line) => lines.push(line) });
  assert.equal(loadHostedRecord(live), undefined);
  assert.ok(lines.some((line) => line.includes('restored files are held')));
  host = new Host(live);
  assert.equal(host.isHeld('A'), true);
  await host.close();
});

test('an approval marks only the store that carries the approved identity', (t) => {
  const dir = folder(t);
  const path = join(dir, 'A.openhbam.sqlite');
  createStore(path);
  const marker = (): string | undefined => {
    const db = new DatabaseSync(path, { readOnly: true });
    try { return (db.prepare("SELECT json FROM _fm_meta WHERE key = 'hostedInstance'").get() as { json: string } | undefined)?.json; }
    finally { db.close(); }
  };
  // The approval is for another identity: the file now at the path was swapped in after it was opened.
  const logged: string[] = [];
  approveInRecord(dir, 'A', '00000000-0000-4000-8000-0000000000aa', 'operator', 'admin', (line) => logged.push(line));
  assert.equal(marker(), undefined);
  assert.match(logged.join('\n'), /not the file that was approved/);
  const db = new DatabaseSync(path, { readOnly: true });
  const own = JSON.parse((db.prepare("SELECT json FROM _fm_meta WHERE key = 'fileId'").get() as { json: string }).json) as string;
  db.close();
  approveInRecord(dir, 'A', own, 'operator', 'admin');
  assert.equal(marker(), JSON.stringify(loadHostedRecord(dir)?.instance));
});

// Two processes writing the record at once (a leader and a restore, say) each need a temp file of their own: with one shared
// name a rename could publish the other's half-written file, and a reader saw the record damaged.
test('two processes writing the record at once never leave it unreadable for a reader', async (t) => {
  const dir = folder(t);
  firstStartRecord(dir, [{ name: 'A', id: '00000000-0000-4000-8000-000000000001' }]);
  const module = pathToFileURL(join(import.meta.dirname, '..', 'src', 'hosted-record.ts')).href;
  const script = `const { approveInRecord } = await import(${JSON.stringify(module)});
    for (let i = 0; i < 150; i++) approveInRecord(${JSON.stringify(dir)}, 'W' + process.argv[1] + '-' + (i % 5), '00000000-0000-4000-8000-0000000000' + String(10 + (i % 5)), 'writer', 'admin', () => {});`;
  let problems = '';
  const writers = ['1', '2'].map((n) => new Promise<number | null>((ok) => {
    const child = spawn(process.execPath, ['--no-warnings', '--input-type=module', '-e', script, n], { stdio: ['ignore', 'ignore', 'pipe'] });
    child.stderr.setEncoding('utf8').on('data', (d: string) => { problems += d; });
    child.once('exit', ok);
    t.after(() => child.kill());
  }));
  let reads = 0, damaged = 0, running = true;
  void Promise.all(writers).then(() => { running = false; });
  while (running) {
    reads++;
    if (loadHostedRecord(dir) === null) damaged++;
    await new Promise((r) => setImmediate(r));
  }
  assert.deepEqual(await Promise.all(writers), [0, 0], `both writers finished: ${problems}`);
  assert.ok(reads > 0);
  assert.equal(damaged, 0, `the record was unreadable in ${damaged} of ${reads} reads`);
  assert.equal(readdirSync(dir).filter((n) => n.startsWith(HOSTED_RECORD_FILE) && n !== HOSTED_RECORD_FILE).length, 0, 'no temp file is left');
});
