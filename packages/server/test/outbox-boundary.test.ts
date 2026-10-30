import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, linkSync, lstatSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Outbox, type StoredEntry } from '../src/outbox.ts';

const mail = (subject: string) => ({
  kind: 'mail' as const, at: '2026-01-01T00:00:00.000Z', script: 'Notify', via: 'Send Mail',
  from: '', to: ['a@b.example'], cc: [], bcc: [], subject, body: 'synthetic body',
  attachments: [{ name: 'f.txt', size: 1, data: 'eA==' }],
});

const subject = (e: StoredEntry) => (e.kind === 'mail' ? e.subject : '');

test('the outbox file is private, appended whole, and never written through a planted link', { skip: process.platform === 'win32' && 'links and modes differ on Windows' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-outbox-'));
  try {
    const outbox = new Outbox(dir);
    const folder = join(dir, 'Outbox');
    const file = join(folder, 'outbox.jsonl');
    // A normal record is private and reads back with its body and attachment contents.
    const first = outbox.record(mail('first'));
    assert.equal(statSync(folder).mode & 0o777, 0o700);
    assert.equal(statSync(file).mode & 0o777, 0o600);
    assert.deepEqual(outbox.get(first.id), first);
    assert.deepEqual(outbox.list().map(subject), ['first']);
    // A readable file from an earlier version becomes private without losing its lines.
    chmodSync(file, 0o644);
    const second = outbox.record(mail('second'));
    assert.equal(statSync(file).mode & 0o777, 0o600);
    assert.deepEqual(outbox.list().map(subject), ['second', 'first']);
    assert.deepEqual(readFileSync(file, 'utf8').trimEnd().split('\n').map((line) => JSON.parse(line)), [first, second]);
    // A planted symlink is refused for both writes and reads, leaving its target alone.
    const victim = join(dir, 'victim.txt');
    writeFileSync(victim, 'keep');
    rmSync(file);
    symlinkSync(victim, file);
    assert.throws(() => outbox.record(mail('through the link')), (e: NodeJS.ErrnoException) => e.code === 'ESTALE');
    assert.throws(() => outbox.list(), (e: NodeJS.ErrnoException) => e.code === 'ESTALE');
    assert.throws(() => outbox.get(first.id), (e: NodeJS.ErrnoException) => e.code === 'ESTALE');
    assert.equal(readFileSync(victim, 'utf8'), 'keep');
    assert.ok(lstatSync(file).isSymbolicLink(), 'the planted link is still there');
    // A second name for another file is refused too.
    rmSync(file);
    linkSync(victim, file);
    assert.throws(() => outbox.record(mail('through the hard link')), (e: NodeJS.ErrnoException) => e.code === 'ESTALE');
    assert.equal(readFileSync(victim, 'utf8'), 'keep');
    // Creating another Outbox leaves an existing folder's permissions alone.
    chmodSync(folder, 0o755);
    new Outbox(dir);
    assert.equal(statSync(folder).mode & 0o777, 0o755);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
