// Outbox clearing and reads, change-log reads, and -shm removal use the filesystem boundary.
// Checked removal narrows parent-swap races; it is not descriptor-relative openat removal.
import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, linkSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { withFilesystemHook } from '../../store/src/fs-boundary.ts';
import { applyLog, logReader, logRecords, readPart, startLog, writeLog } from '../src/logs.ts';
import { Outbox } from '../src/outbox.ts';

const skip = process.platform === 'win32' && 'links, modes and named pipes differ on Windows';
const refused = (e: NodeJS.ErrnoException) => e.code === 'ESTALE';
const mail = (subject: string) => ({
  kind: 'mail' as const, at: '2026-01-01T00:00:00.000Z', script: 'Notify', via: 'Send Mail',
  from: '', to: ['a@b.example'], cc: [], bcc: [], subject, body: 'synthetic body', attachments: [],
});
const page = () => Buffer.from('synthetic change record');

/** Make the replacement first so it cannot reuse the original file's identity. */
function swapIn(path: string, text: string): void {
  writeFileSync(`${path}.swap`, text);
  renameSync(`${path}.swap`, path);
}

function workspace(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-leftovers-'));
  const victim = join(dir, 'victim.txt');
  writeFileSync(victim, 'keep');
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  const marker = join(bin, 'called');
  for (const command of ['launchctl', 'systemctl', 'sc', 'git', 'npm', 'curl', 'sudo']) {
    writeFileSync(join(bin, command), '#!/bin/sh\nprintf called > "$(dirname "$0")/called"\nexit 99\n', { mode: 0o700 });
  }
  const env = { PATH: `${bin}:/usr/bin:/bin` };
  t.after(() => {
    try { assert.equal(existsSync(marker), false, 'no service, install or network command was called'); }
    finally { rmSync(dir, { recursive: true, force: true }); }
  });
  function pipe(path: string): boolean {
    const result = spawnSync('mkfifo', [path], { env, timeout: 8_000 });
    assert.equal(existsSync(marker), false);
    if (result.error && (result.error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    assert.equal(result.status, 0, 'mkfifo succeeded');
    t.diagnostic('named-pipe case ran');
    return true;
  }
  return { dir, victim, env, pipe };
}

test('the outbox refuses a dangling link, a named pipe or a folder, and clears entries as themselves', { skip, timeout: 30_000 }, (t) => {
  const { dir, victim, pipe } = workspace(t);
  const outbox = new Outbox(dir);
  const file = join(dir, 'Outbox', 'outbox.jsonl');
  assert.deepEqual(outbox.list(), []);
  assert.equal(outbox.get('nothing'), undefined);
  outbox.clear();

  symlinkSync(join(dir, 'missing.txt'), file);
  assert.throws(() => outbox.list(), refused);
  assert.throws(() => outbox.get('x'), refused);
  assert.throws(() => outbox.record(mail('through a dangling link')), refused);
  assert.throws(() => lstatSync(join(dir, 'missing.txt')), { code: 'ENOENT' });
  outbox.clear();
  assert.throws(() => lstatSync(file), { code: 'ENOENT' });
  symlinkSync(victim, file);
  outbox.clear();
  assert.throws(() => lstatSync(file), { code: 'ENOENT' });
  assert.equal(readFileSync(victim, 'utf8'), 'keep');

  if (pipe(file)) {
    assert.throws(() => outbox.list(), refused);
    assert.throws(() => outbox.get('x'), refused);
    assert.throws(() => outbox.record(mail('into a pipe')), refused);
    outbox.clear();
    assert.throws(() => lstatSync(file), { code: 'ENOENT' });
  }

  mkdirSync(file);
  writeFileSync(join(file, 'inside.txt'), 'inside');
  assert.throws(() => outbox.list());
  assert.throws(() => outbox.get('x'));
  assert.throws(() => outbox.record(mail('into a folder')), refused);
  assert.throws(() => outbox.clear(), { code: 'ERR_FS_EISDIR' });
  assert.equal(readFileSync(join(file, 'inside.txt'), 'utf8'), 'inside');
});

test('clearing the outbox leaves a replaced file or parent folder alone', { skip, timeout: 30_000 }, (t) => {
  const { dir } = workspace(t);
  const outbox = new Outbox(dir);
  const file = join(dir, 'Outbox', 'outbox.jsonl');
  outbox.record(mail('first'));
  const seen: string[] = [];
  withFilesystemHook((event) => { if (event.operation === 'remove') seen.push(event.path); }, () => outbox.clear());
  assert.deepEqual(seen, [file]);
  assert.equal(existsSync(file), false);

  outbox.record(mail('second'));
  withFilesystemHook((event) => {
    if (event.operation === 'remove') swapIn(file, 'replacement file');
  }, () => outbox.clear());
  assert.equal(readFileSync(file, 'utf8'), 'replacement file');
  rmSync(file);

  outbox.record(mail('third'));
  const elsewhere = join(dir, 'elsewhere');
  mkdirSync(elsewhere);
  writeFileSync(join(elsewhere, 'outbox.jsonl'), 'not ours');
  withFilesystemHook((event) => {
    if (event.operation !== 'remove') return;
    renameSync(join(dir, 'Outbox'), join(dir, 'Outbox.moved'));
    symlinkSync(elsewhere, join(dir, 'Outbox'));
  }, () => outbox.clear());
  assert.equal(readFileSync(join(elsewhere, 'outbox.jsonl'), 'utf8'), 'not ours');
  assert.ok(existsSync(join(dir, 'Outbox.moved', 'outbox.jsonl')));
});

test('applying a log removes -shm as itself, leaves replacements alone, and refuses folders and unsafe -wal entries', { skip, timeout: 30_000 }, (t) => {
  const { dir, victim, pipe } = workspace(t);
  const db = join(dir, 'Tasks.openhbam.sqlite');
  symlinkSync(victim, `${db}-shm`);
  applyLog(db, page());
  assert.throws(() => lstatSync(`${db}-shm`), { code: 'ENOENT' });
  assert.equal(readFileSync(victim, 'utf8'), 'keep');
  rmSync(db, { force: true });

  writeFileSync(`${db}-shm`, 'stale index');
  const seen: string[] = [];
  withFilesystemHook((event) => { if (event.operation === 'remove') seen.push(event.path); }, () => applyLog(db, page()));
  assert.deepEqual(seen, [`${db}-shm`]);
  assert.throws(() => lstatSync(`${db}-shm`), { code: 'ENOENT' });
  rmSync(db, { force: true });
  writeFileSync(`${db}-shm`, 'stale index');
  withFilesystemHook((event) => {
    if (event.operation === 'remove') swapIn(`${db}-shm`, 'replacement file');
  }, () => applyLog(db, page()));
  assert.equal(readFileSync(`${db}-shm`, 'utf8'), 'replacement file');
  rmSync(`${db}-shm`);
  rmSync(db, { force: true });

  if (pipe(`${db}-shm`)) {
    applyLog(db, page());
    assert.throws(() => lstatSync(`${db}-shm`), { code: 'ENOENT' });
    rmSync(db, { force: true });
  }

  mkdirSync(`${db}-shm`);
  writeFileSync(join(`${db}-shm`, 'inside.txt'), 'inside');
  assert.throws(() => applyLog(db, page()), { code: 'ERR_FS_EISDIR' });
  assert.equal(existsSync(`${db}-wal`), false, 'no log was written');
  assert.equal(readFileSync(join(`${db}-shm`, 'inside.txt'), 'utf8'), 'inside');
  rmSync(`${db}-shm`, { recursive: true });

  mkdirSync(`${db}-wal`);
  writeFileSync(join(`${db}-wal`, 'inside.txt'), 'inside');
  assert.throws(() => applyLog(db, page()), refused);
  assert.equal(readFileSync(join(`${db}-wal`, 'inside.txt'), 'utf8'), 'inside');
  assert.equal(existsSync(db), false);
  rmSync(`${db}-wal`, { recursive: true });
  if (pipe(`${db}-wal`)) {
    assert.throws(() => applyLog(db, page()), refused);
    assert.ok(lstatSync(`${db}-wal`).isFIFO());
    assert.equal(existsSync(db), false);
  }
});

for (const sealed of [false, true]) {
  test(`a ${sealed ? 'sealed' : 'plain'} change log refuses a named pipe or folder at its name immediately`, { skip, timeout: 30_000 }, async (t) => {
    const { dir, env, pipe } = workspace(t);
    const key = sealed ? ['pass', 'for', 'the', 'test'].join('-') : undefined;
    const path = join(dir, '2026-10-30_010203Z.log');
    const writer = startLog(path, key, 'Tasks');
    writeLog(writer, { at: 1_000, seq: 1, data: page() });
    assert.equal(logRecords(path).length, 1);

    const folder = join(dir, 'folder.log');
    mkdirSync(folder);
    assert.throws(() => startLog(folder, key, 'Tasks'), refused);
    assert.throws(() => writeLog({ ...writer, path: folder }, { at: 2_000, seq: 2, data: page() }), refused);
    assert.throws(() => logRecords(folder));
    assert.throws(() => readPart(folder, 0, 4));
    await assert.rejects(logReader(folder, key, 'Tasks'));

    const fifo = join(dir, 'pipe.log');
    if (pipe(fifo)) {
      assert.throws(() => startLog(fifo, key, 'Tasks'), refused);
      assert.throws(() => writeLog({ ...writer, path: fifo }, { at: 2_000, seq: 2, data: page() }), refused);
      // A synchronous blocking open needs an external timeout: it stops Node's own timers too.
      const script = join(dir, 'read-pipe.mjs');
      const logs = new URL('../src/logs.ts', import.meta.url).href;
      writeFileSync(script, `import { logRecords, logReader, readPart } from ${JSON.stringify(logs)};\n`
        + 'const path = process.argv[2];\nconst codes = [];\n'
        + 'for (const run of [() => logRecords(path), () => readPart(path, 0, 4), () => logReader(path)]) {\n'
        + '  try { await run(); codes.push("none"); } catch (e) { codes.push(e.code ?? e.message); }\n}\n'
        + 'console.log(JSON.stringify(codes));\n');
      const child = spawnSync(process.execPath, ['--no-warnings', script, fifo], { encoding: 'utf8', timeout: 8_000, env });
      assert.equal(child.signal, null, 'reading a log did not wait on the named pipe');
      assert.equal(child.error, undefined);
      assert.equal(child.status, 0, child.stderr);
      assert.deepEqual(JSON.parse(child.stdout), ['ESTALE', 'ESTALE', 'ESTALE']);
    }
    assert.deepEqual(readdirSync(dir).filter((n) => n.endsWith('.log')).sort(), ['2026-10-30_010203Z.log', 'folder.log', ...(existsSync(fifo) ? ['pipe.log'] : [])]);
    const records = logRecords(path);
    assert.equal(records.length, 1);
    const read = await logReader(path, key, 'Tasks');
    assert.deepEqual(read(records[0]), page());
  });
}

test('change-log reads refuse symlinks and accept hard links used by backup deduplication', { skip, timeout: 30_000 }, async (t) => {
  const { dir } = workspace(t);
  const path = join(dir, 'real.log');
  const writer = startLog(path, undefined, 'Tasks');
  writeLog(writer, { at: 1_000, seq: 1, data: page() });
  const link = join(dir, 'link.log');
  symlinkSync(path, link);
  assert.throws(() => logRecords(link), refused);
  assert.throws(() => readPart(link, 0, 4), refused);
  await assert.rejects(logReader(link), refused);
  const dangling = join(dir, 'dangling.log');
  symlinkSync(join(dir, 'missing.log'), dangling);
  assert.throws(() => logRecords(dangling), refused);
  assert.throws(() => readPart(dangling, 0, 4), refused);
  const second = join(dir, 'second.log');
  linkSync(path, second);
  const records = logRecords(second);
  assert.equal(records.length, 1);
  assert.equal(readPart(second, 0, 4).length, 4);
  const read = await logReader(second);
  assert.deepEqual(read(records[0]), page());
});
