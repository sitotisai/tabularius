import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, linkSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Outbox, type StoredEntry } from '../src/outbox.ts';
import { withFilesystemHook } from '../../store/src/fs-boundary.ts';

const mail = (subject: string, body = 'synthetic body', attachments: { name: string; size: number; data?: string }[] = []) => ({
  kind: 'mail' as const, at: '2026-01-01T00:00:00.000Z', script: 'Spam', via: 'Send Mail',
  from: '', to: ['a@b.example'], cc: [], bcc: [], subject, body, attachments,
});
const subject = (e: StoredEntry) => (e.kind === 'mail' ? e.subject : '');
const disk = (folder: string) => readdirSync(folder).reduce((n, f) => n + statSync(join(folder, f)).size, 0);

test('a script that sends mail in a loop cannot grow the outbox without end', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-outbox-growth-'));
  try {
    const cap = 1024 * 1024;
    const outbox = new Outbox(dir, { maxBytes: cap });
    const body = 'x'.repeat(100 * 1024);
    // One thousand 100 KB messages (about 100 MB offered) into an outbox that keeps about 1 MB in each half.
    for (let i = 0; i < 1000; i++) outbox.record(mail(`m${i}`, body));
    const folder = join(dir, 'Outbox');
    assert.ok(disk(folder) <= 2 * cap + 200 * 1024, `the folder holds ${disk(folder)} bytes`);
    // The newest are all there, newest first, and an older half is still read.
    const listed = outbox.list(1000).map(subject);
    assert.equal(listed[0], 'm999');
    assert.ok(listed.length >= 10 && listed.length < 1000, `${listed.length} entries kept`);
    assert.deepEqual(listed, Array.from({ length: listed.length }, (_, i) => `m${999 - i}`));
    // One from the older half is found by its id; the oldest of all are gone; clearing empties both halves.
    const oldest = outbox.list(1000).at(-1)!;
    assert.equal(outbox.get(oldest.id)?.id, oldest.id);
    outbox.clear();
    assert.equal(disk(folder), 0);
    assert.deepEqual(outbox.list(), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('one huge message is cut down to a size the outbox keeps, with its attachment contents dropped', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-outbox-entry-'));
  try {
    const outbox = new Outbox(dir);
    const big = outbox.record(mail('big', 'y'.repeat(20 * 1024 * 1024), [{ name: 'a.bin', size: 10 * 1024 * 1024, data: 'z'.repeat(13 * 1024 * 1024) }]));
    assert.ok(JSON.stringify(big).length <= 1024 * 1024, 'the stored entry is at most 1 MiB');
    assert.ok(statSync(join(dir, 'Outbox', 'outbox.jsonl')).size <= 1024 * 1024 + 1, 'and so is its line in the file');
    const read = outbox.get(big.id)!;
    assert.equal(read.kind === 'mail' && read.attachments[0].size, 10 * 1024 * 1024);
    assert.equal(read.kind === 'mail' && read.attachments[0].data, undefined);
    assert.equal(read.kind === 'mail' && read.body.startsWith('yyyy'), true);
    // A message of ordinary size is stored whole, attachment contents included.
    const small = outbox.record(mail('small', 'hi', [{ name: 'f.txt', size: 1, data: 'eA==' }]));
    assert.deepEqual(outbox.get(small.id), small);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the entry cap counts UTF-8 bytes and bounds escaped text, lists and metadata too', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-outbox-bytes-'));
  try {
    const outbox = new Outbox(dir);
    const unicode = outbox.record(mail('unicode', '界'.repeat(400 * 1024)));
    assert.ok(Buffer.byteLength(JSON.stringify(unicode)) <= 1024 * 1024, 'UTF-8 bytes fit');
    const text = '\u0000'.repeat(3000);
    const recipients = Array.from({ length: 60 }, (_, i) => `${i}${text}`);
    const crowded = outbox.record({
      ...mail(text, '\u0000'.repeat(100 * 1024), recipients.map((name) => ({ name, size: 123, data: 'eA==' }))),
      from: text, to: recipients, cc: recipients, bcc: recipients,
      script: text, via: text, deliveredTo: text, error: text, notCopied: text,
    });
    assert.ok(Buffer.byteLength(JSON.stringify(crowded)) <= 1024 * 1024, 'escaped fields together fit');
    assert.equal(crowded.kind, 'mail');
    if (crowded.kind !== 'mail') return;
    for (const list of [crowded.to, crowded.cc, crowded.bcc, crowded.attachments]) assert.equal(list.length, 50);
    assert.ok(crowded.to[0].startsWith('0'));
    assert.ok(crowded.to[49].startsWith('49'));
    assert.equal(crowded.attachments[0].size, 123);
    assert.equal(crowded.attachments[0].data, undefined);
    assert.match(crowded.body, /\[cut: 102400 characters\]$/);
    const metadata = outbox.record({ ...mail('metadata'), script: 's'.repeat(2 * 1024 * 1024) });
    assert.ok(Buffer.byteLength(JSON.stringify(metadata)) <= 1024 * 1024, 'script names fit');
    for (const stored of [unicode, crowded, metadata]) assert.deepEqual(outbox.get(stored.id), stored);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('oversized web entries keep bounded URL, host and error text and preserve request details', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-outbox-http-'));
  try {
    const outbox = new Outbox(dir);
    const text = 'x'.repeat(2 * 1024 * 1024);
    const request = {
      kind: 'http' as const, at: '2026-01-01T00:00:00.000Z', script: 'Request', via: 'Insert from URL',
      method: 'POST', url: `https://request.example/${text}`, host: text, error: text,
      allowed: false, requestBytes: 123,
    };
    const stored = outbox.record(request);
    assert.ok(Buffer.byteLength(JSON.stringify(stored)) <= 1024 * 1024);
    assert.equal(stored.kind, 'http');
    if (stored.kind !== 'http') return;
    assert.equal(stored.method, 'POST');
    assert.equal(stored.allowed, false);
    assert.equal(stored.requestBytes, 123);
    assert.ok(stored.url.startsWith('https://request.example/'));
    for (const text of [stored.url, stored.host, stored.error!]) assert.match(text, /\[cut: \d+ characters\]$/);
    assert.deepEqual(outbox.get(stored.id), stored);
    assert.deepEqual(outbox.list(), [stored]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('two outboxes turning over together preserve the older half and the new live file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-outbox-turnover-'));
  try {
    const first = new Outbox(dir, { maxBytes: 1024 });
    const second = new Outbox(dir, { maxBytes: 1024 });
    const full = first.record(mail('full', 'x'.repeat(1024)));
    let other: StoredEntry | undefined;
    // Deterministically interleave another worker after the rename's path checks.
    let interleaved = false;
    const newest = withFilesystemHook((event) => {
      if (event.operation !== 'rename' || interleaved) return;
      interleaved = true;
      other = second.record(mail('other worker'));
    }, () => first.record(mail('newest')));
    assert.ok(interleaved);
    assert.deepEqual(first.list().map(subject), ['newest', 'other worker', 'full']);
    for (const stored of [full, other!, newest]) assert.deepEqual(second.get(stored.id), stored);
    if (process.platform !== 'win32') {
      assert.equal(statSync(join(dir, 'Outbox', 'outbox.jsonl')).mode & 0o777, 0o600);
      assert.equal(statSync(join(dir, 'Outbox', 'outbox-older.jsonl')).mode & 0o777, 0o600);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('turnover still refuses a hard-linked live file at the cap', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-outbox-link-'));
  try {
    const outbox = new Outbox(dir, { maxBytes: 1 });
    const stored = outbox.record(mail('linked'));
    linkSync(join(dir, 'Outbox', 'outbox.jsonl'), join(dir, 'other-name'));
    assert.throws(() => outbox.record(mail('refused')), (e: NodeJS.ErrnoException) => e.code === 'ESTALE');
    assert.deepEqual(outbox.get(stored.id), stored);
    assert.deepEqual(readdirSync(join(dir, 'Outbox')), ['outbox.jsonl']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('turnover makes an older readable live file private before retaining it', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-outbox-mode-'));
  try {
    const outbox = new Outbox(dir, { maxBytes: 1 });
    const first = outbox.record(mail('older'));
    chmodSync(join(dir, 'Outbox', 'outbox.jsonl'), 0o644);
    const second = outbox.record(mail('live'));
    assert.deepEqual(outbox.list().map(subject), ['live', 'older']);
    assert.deepEqual(outbox.get(first.id), first);
    assert.deepEqual(outbox.get(second.id), second);
    if (process.platform !== 'win32') {
      assert.equal(statSync(join(dir, 'Outbox', 'outbox-older.jsonl')).mode & 0o777, 0o600);
      assert.equal(statSync(join(dir, 'Outbox', 'outbox.jsonl')).mode & 0o777, 0o600);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
