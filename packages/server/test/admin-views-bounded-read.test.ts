// Admin views must read the end of files that scripts sending mail or failed sign-ins can fill to tens of megabytes.
// Synthetic data only; byte counts make the regression independent of machine speed.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs, { appendFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Outbox } from '../src/outbox.ts';
import { ServerLogs, logTime } from '../src/server-logs.ts';
import { CHUNK_BYTES, linesNewestFirst, linesOldestFirst } from '../src/tail-lines.ts';
import { withFilesystemHook } from '../../store/src/fs-boundary.ts';
import { commandStubEnv } from '../../../scripts/test-command-stubs.ts';

/** Counts bytes through readSync and whole-file reads while action runs. */
async function reads<T>(action: () => T | Promise<T>): Promise<{ result: T; bytes: number; whole: number }> {
  let bytes = 0;
  let whole = 0;
  const readSync = fs.readSync;
  const readFileSync = fs.readFileSync;
  mock.method(fs, 'readSync', (...args: Parameters<typeof fs.readSync>) => { const n = (readSync as (...a: unknown[]) => number)(...args); bytes += n; return n; });
  mock.method(fs, 'readFileSync', (...args: Parameters<typeof fs.readFileSync>) => { whole++; return (readFileSync as (...a: unknown[]) => unknown)(...args); });
  syncBuiltinESMExports();
  try { return { result: await action(), bytes, whole }; } finally { mock.restoreAll(); syncBuiltinESMExports(); }
}

const entry = (i: number) => JSON.stringify({
  id: i.toString(16).padStart(16, '0'), kind: 'http', at: '2026-01-01T00:00:00.000Z', script: 'S', via: 'Insert from URL',
  method: 'GET', url: `https://x.example/${i}`, host: 'x.example', allowed: false, error: 'b'.repeat(900),
}) + '\n';

test('listing the newest outbox entries reads the end of a 40 MB outbox, and finding one by id reads it a chunk at a time', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-outbox-tail-'));
  try {
    const box = new Outbox(dir);
    const file = join(dir, 'Outbox', 'outbox.jsonl');
    const chunk = Array.from({ length: 4000 }, (_, i) => entry(i)).join('');
    for (let i = 0; i < 10; i++) appendFileSync(file, chunk);
    assert.ok(fs.statSync(file).size > 36 * 1024 * 1024);
    const listed = await reads(() => box.list(3));
    assert.deepEqual(listed.result.map((e) => e.id), [3999, 3998, 3997].map((i) => i.toString(16).padStart(16, '0')));
    assert.equal(listed.whole, 0, 'no whole-file read');
    assert.ok(listed.bytes <= 2 * 1024 * 1024, `${listed.bytes} bytes read for 3 entries`);
    const found = await reads(() => box.get((5).toString(16).padStart(16, '0')));
    assert.equal(found.result?.id, (5).toString(16).padStart(16, '0'));
    assert.equal(found.whole, 0);
    assert.ok(found.bytes <= 2 * 1024 * 1024, `${found.bytes} bytes read to find an entry near the start`);
    const missing = await reads(() => box.get('ffffffffffffffff'));
    assert.equal(missing.result, undefined);
    assert.equal(missing.whole, 0);
    assert.equal(missing.bytes, fs.statSync(file).size, 'an absent id scans all chunks');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a log view of the latest entries reads the end of a 40 MB log, and a search still looks through both halves', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-log-tail-'));
  try {
    mkdirSync(join(dir, 'Logs'));
    const at = logTime(new Date('2026-01-01T00:00:00.000Z'));
    const line = (i: number) => `${at}\tWarning\tAccess\tfailed sign-in ${i} ${'x'.repeat(200)}\n`;
    const file = join(dir, 'Logs', 'Access.log');
    for (let i = 0; i < 10; i++) appendFileSync(file, Array.from({ length: 16000 }, (_, k) => line(i * 16000 + k)).join(''));
    appendFileSync(file, `${at}\tError\tAccess\tneedle\n`);
    assert.ok(fs.statSync(file).size > 36 * 1024 * 1024);
    const logs = new ServerLogs(dir);
    const latest = await reads(() => logs.read('Access', { limit: 5 }));
    assert.equal(latest.result.entries.length, 5);
    assert.equal(latest.result.entries[0].message, 'needle');
    assert.equal(latest.result.more, true);
    assert.equal(latest.whole, 0, 'no whole-file read');
    assert.ok(latest.bytes <= 2 * 1024 * 1024, `${latest.bytes} bytes read for 5 entries`);
    const older = join(dir, 'Logs', 'Access-old.log');
    writeFileSync(older, `${at}\tInformation\tAccess\told marker\n`);
    const old = await reads(() => logs.read('Access', { q: 'OLD marker', limit: 1 }));
    assert.deepEqual(old.result.entries.map((e) => e.message), ['old marker']);
    assert.equal(old.result.more, false, 'exactly the limit is not more');
    assert.equal(old.whole, 0);
    assert.equal(old.bytes, fs.statSync(file).size + fs.statSync(older).size);
    const missing = await reads(() => logs.read('Access', { q: 'absent marker' }));
    assert.deepEqual(missing.result, { entries: [], more: false });
    assert.equal(missing.whole, 0);
    assert.equal(missing.bytes, old.bytes, 'a search with no match scans both halves');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('line readers agree with a whole-file split across UTF-8, long lines, empty lines and missing final newlines', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-tail-lines-'));
  try {
    const file = join(dir, 'f.txt');
    const text = ['alpha', 'béta ✓', '', 'γάμμα'.repeat(30), 'δ', '\u{1F600} end'].join('\n');
    for (const content of [text, `${text}\n`, '', '\n\n', 'only']) {
      writeFileSync(file, content);
      const want = content.split('\n').filter(Boolean);
      for (const chunk of [1, 2, 3, 5, 7, 16, 64, 1024]) {
        assert.deepEqual([...linesOldestFirst(file, chunk)], want, `oldest first, chunk ${chunk}`);
        assert.deepEqual([...linesNewestFirst(file, chunk)], [...want].reverse(), `newest first, chunk ${chunk}`);
      }
    }
    const long = '界'.repeat(CHUNK_BYTES);
    writeFileSync(file, `first\n${long}\nlast`);
    assert.deepEqual([...linesOldestFirst(file)], ['first', long, 'last']);
    assert.deepEqual([...linesNewestFirst(file)], ['last', long, 'first']);
    for (const reader of [linesNewestFirst, linesOldestFirst]) {
      assert.deepEqual([...reader(join(dir, 'missing'))], [], 'a missing file has no lines');
      for (const chunk of [0, -1, 0.5, NaN, Infinity]) assert.throws(() => [...reader(file, chunk)], RangeError);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('outbox reads preserve order across halves, ignore broken lines and keep attachment contents only for get', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-outbox-order-'));
  try {
    const box = new Outbox(dir);
    const first = box.record({
      kind: 'mail', at: '2026-01-01T00:00:00.000Z', script: 'S', via: 'Send Mail',
      from: '', to: ['a@b.example'], cc: [], bcc: [], subject: 'first', body: 'body',
      attachments: [{ name: 'f.txt', size: 1, data: 'eA==' }],
    });
    const file = join(dir, 'Outbox', 'outbox.jsonl');
    fs.renameSync(file, join(dir, 'Outbox', 'outbox-older.jsonl'));
    const second = { ...first, id: 'other', subject: first.id };
    // A substring match in another field must not count as an id match; the first duplicate id still wins.
    writeFileSync(file, `\n{broken\n${JSON.stringify(second)}\n${JSON.stringify({ ...first, subject: 'duplicate' })}`);
    assert.deepEqual(box.list(3).map((e) => e.id), [first.id, second.id, first.id]);
    assert.deepEqual(box.get(first.id), first);
    assert.deepEqual(box.get(second.id), second);
    const listed = box.list(1)[0];
    assert.ok(listed.kind === 'mail');
    assert.deepEqual(listed.attachments, [{ name: 'f.txt', size: 1 }]);
    assert.deepEqual(box.list(0), []);
    box.clear();
    writeFileSync(file, `${JSON.stringify(second)}\n{broken ${first.id}\n`);
    assert.equal(box.get(first.id), undefined, 'a substring alone is not an entry with that id');
    const parsed = mock.method(JSON, 'parse');
    try {
      assert.equal(box.get('absent'), undefined);
      assert.equal(parsed.mock.callCount(), 0, 'lines without the id are not parsed');
    } finally { parsed.mock.restore(); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('line readers handle short reads and concurrent truncation without adding unread bytes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-tail-short-'));
  const nativeRead = fs.readSync;
  try {
    const file = join(dir, 'f.txt');
    const text = 'first\nbéta ✓\nlast';
    mock.method(fs, 'readSync', (fd: number, buffer: Buffer, offset: number, length: number, position: number) => nativeRead(fd, buffer, offset, Math.min(2, length), position));
    syncBuiltinESMExports();
    writeFileSync(file, text);
    assert.deepEqual([...linesOldestFirst(file, 7)], text.split('\n'));
    assert.deepEqual([...linesNewestFirst(file, 7)], text.split('\n').reverse());
    mock.restoreAll();
    for (const reader of [linesNewestFirst, linesOldestFirst]) {
      writeFileSync(file, text);
      let truncated = false;
      mock.method(fs, 'readSync', (fd: number, buffer: Buffer, offset: number, length: number, position: number) => {
        if (!truncated) { truncated = true; fs.truncateSync(file, 3); }
        return nativeRead(fd, buffer, offset, length, position);
      });
      syncBuiltinESMExports();
      assert.deepEqual([...reader(file)], ['fir']);
      mock.restoreAll();
    }
  } finally { mock.restoreAll(); syncBuiltinESMExports(); rmSync(dir, { recursive: true, force: true }); }
});

test('line readers close descriptors on completion, early return, consumer errors and read errors', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-tail-close-'));
  try {
    const file = join(dir, 'f.txt');
    writeFileSync(file, 'first\nsecond\nthird\n');
    for (const reader of [linesNewestFirst, linesOldestFirst]) {
      for (const stop of ['complete', 'return', 'consumer error', 'read error']) {
        let fd: number | undefined;
        const failure = new Error('synthetic read failure');
        try {
          if (stop === 'read error') { mock.method(fs, 'readSync', () => { throw failure; }); syncBuiltinESMExports(); }
          const run = () => withFilesystemHook((e) => { if (e.phase === 'opened') fd = e.fd; }, () => {
            for (const line of reader(file, 5)) {
              assert.ok(line);
              if (stop === 'return') break;
              if (stop === 'consumer error') throw failure;
            }
          });
          if (stop.endsWith('error')) assert.throws(run, (e) => e === failure);
          else run();
          assert.notEqual(fd, undefined);
          assert.throws(() => fs.fstatSync(fd!), { code: 'EBADF' });
        } finally { mock.restoreAll(); syncBuiltinESMExports(); }
      }
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('admin readers refuse links, directories and pipes without blocking', {
  skip: process.platform === 'win32' && 'symlinks and POSIX named pipes differ on Windows', timeout: 30_000,
}, (t) => {
  const env = commandStubEnv(t);
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-tail-boundary-'));
  try {
    new Outbox(dir);
    mkdirSync(join(dir, 'Logs'));
    const victim = join(dir, 'victim.txt');
    writeFileSync(victim, 'keep');
    // The timeout runs outside the reader: an accidental blocking FIFO open must not hang the test runner.
    const code = `
      import assert from 'node:assert/strict';
      import { Outbox } from ${JSON.stringify(new URL('../src/outbox.ts', import.meta.url).href)};
      import { ServerLogs } from ${JSON.stringify(new URL('../src/server-logs.ts', import.meta.url).href)};
      import { linesNewestFirst, linesOldestFirst } from ${JSON.stringify(new URL('../src/tail-lines.ts', import.meta.url).href)};
      const [dir, path, kind] = process.argv.slice(1);
      const refused = { code: 'ESTALE' };
      for (const reader of [linesNewestFirst, linesOldestFirst]) assert.throws(() => [...reader(path)], refused);
      if (kind === 'outbox') {
        const box = new Outbox(dir);
        assert.throws(() => box.list(), refused);
        assert.throws(() => box.get('missing'), refused);
      } else await assert.rejects(new ServerLogs(dir).read('Access'), refused);
    `;
    const child = (path: string, kind: string) => {
      const result = spawnSync(process.execPath, ['--no-warnings', '--input-type=module', '-e', code, dir, path, kind], { env, encoding: 'utf8', timeout: 8_000 });
      assert.equal(result.error, undefined);
      assert.equal(result.status, 0, result.stdout + result.stderr);
    };
    for (const [kind, names] of [
      ['outbox', ['Outbox/outbox.jsonl', 'Outbox/outbox-older.jsonl']],
      ['log', ['Logs/Access.log', 'Logs/Access-old.log']],
    ] as const) {
      for (const name of names) {
        const path = join(dir, name);
        for (const target of [victim, join(dir, 'missing')]) {
          fs.symlinkSync(target, path);
          child(path, kind);
          rmSync(path);
        }
        mkdirSync(path);
        child(path, kind);
        rmSync(path, { recursive: true });
        const fifo = spawnSync('/usr/bin/mkfifo', [path], { env, encoding: 'utf8', timeout: 8_000 });
        assert.equal(fifo.error, undefined);
        assert.equal(fifo.status, 0, fifo.stderr);
        child(path, kind);
        assert.ok(fs.lstatSync(path).isFIFO());
        rmSync(path);
      }
    }
    assert.equal(fs.readFileSync(victim, 'utf8'), 'keep');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
