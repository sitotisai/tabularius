// The outbox of outbound test mode (scripts/src/outbound.ts): every message
// and web request scripts made, kept in <folder>/Outbox/outbox.jsonl so the
// admin console can show them. Nothing here sends anything. The outbox keeps the
// newest messages in two files (outbox.jsonl and outbox-older.jsonl), each up to
// about OUTBOX_MAX_BYTES, so it cannot grow without end.

import { closeSync, mkdirSync, statSync } from 'node:fs';
import { appendFileSync, cleanupPath, openSync, readFileSync, renameSync } from '../../store/src/fs-boundary.ts';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import type { OutboxEntry } from '../../scripts/src/index.ts';

export type StoredEntry = OutboxEntry & { id: string };

/** How big the live outbox file may get before it becomes the older half: at most about twice this stays on disk. */
export const OUTBOX_MAX_BYTES = 64 * 1024 * 1024;
/** The most one stored entry may take (its JSON, before the newline), whatever the script put in it. */
export const OUTBOX_ENTRY_MAX_BYTES = 1024 * 1024;
/** What an entry keeps of a text, a list and an address when it is cut down to fit. */
const KEEP_TEXT = 64 * 1024;
const KEEP_LIST = 50;
const KEEP_SHORT = 2048;

export class Outbox {
  private readonly file: string;
  private readonly older: string;
  private readonly maxBytes: number;

  constructor(dir: string, opts: { maxBytes?: number } = {}) {
    const folder = join(dir, 'Outbox');
    mkdirSync(folder, { recursive: true, mode: 0o700 });
    this.file = join(folder, 'outbox.jsonl');
    this.older = join(folder, 'outbox-older.jsonl');
    this.maxBytes = opts.maxBytes ?? OUTBOX_MAX_BYTES;
  }

  record(entry: OutboxEntry): StoredEntry {
    const stored = fit({ id: randomBytes(8).toString('hex'), ...entry });
    this.turnOver();
    appendFileSync(this.file, JSON.stringify(stored) + '\n', { mode: 0o600 });
    return stored;
  }

  /** The full file becomes the older half, replacing the one before it. An append can cross the limit by one entry. */
  private turnOver(): void {
    for (let attempt = 0; ; attempt++) {
      try {
        if (statSync(this.file).size < this.maxBytes) return;
        // Apply the append boundary's private mode and hard-link refusal before
        // retaining this file. r+ cannot create a file another worker just moved.
        closeSync(openSync(this.file, 'r+', 0o600));
        renameSync(this.file, this.older);
        return;
      } catch (e) {
        const code = (e as NodeJS.ErrnoException).code;
        if (code === 'ENOENT') return;
        // Another worker may have rotated and recreated the live file during the
        // boundary checks. Recheck its size and both paths; persistent refusals still fail.
        if (code !== 'ESTALE' || attempt === 2) throw e;
      }
    }
  }

  /** Newest first, without attachment contents. */
  list(limit = 200): StoredEntry[] {
    return this.all().reverse().slice(0, limit).map((e) => (e.kind === 'mail'
      ? { ...e, attachments: e.attachments.map(({ name, size }) => ({ name, size })) }
      : e));
  }

  get(id: string): StoredEntry | undefined {
    return this.all().find((e) => e.id === id);
  }

  /** Removes the outbox file itself (never what a link at its name points to); a failure to remove it is thrown. */
  clear(): void {
    cleanupPath(this.file, { force: true })({ throwOnError: true });
    cleanupPath(this.older, { force: true })({ throwOnError: true });
  }

  /** Oldest first: the older half, then the live file. */
  private all(): StoredEntry[] {
    return [this.older, this.file].flatMap((file) => {
      let text: string;
      try { text = readFileSync(file, 'utf8'); }
      catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return []; throw e; }
      return text.split('\n').filter(Boolean).flatMap((line) => {
        try {
          return [JSON.parse(line) as StoredEntry];
        } catch {
          return [];
        }
      });
    });
  }
}

/** An oversized entry loses attachment contents and keeps the start of its texts and lists. */
function fit(entry: StoredEntry): StoredEntry {
  if (Buffer.byteLength(JSON.stringify(entry)) <= OUTBOX_ENTRY_MAX_BYTES) return entry;
  const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n) + ` [cut: ${s.length} characters]` : s);
  // UTF-8 and JSON escaping can make these prefixes exceed the byte cap together.
  // Shorten the small fields further if necessary, always retaining the body's first 64K characters.
  for (let short = KEEP_SHORT; ; short = Math.floor(short / 2)) {
    const texts = Object.fromEntries(Object.entries(entry).filter(([key, value]) => key !== 'id' && key !== 'kind' && typeof value === 'string')
      .map(([key, value]) => [key, cut(value as string, key === 'body' ? KEEP_TEXT : short)]));
    const stored = { ...entry, ...texts };
    if (stored.kind === 'mail') {
      stored.attachments = stored.attachments.slice(0, KEEP_LIST).map(({ name, size }) => ({ name: cut(name, short), size }));
      stored.to = stored.to.slice(0, KEEP_LIST).map((a) => cut(a, short));
      stored.cc = stored.cc.slice(0, KEEP_LIST).map((a) => cut(a, short));
      stored.bcc = stored.bcc.slice(0, KEEP_LIST).map((a) => cut(a, short));
    }
    if (Buffer.byteLength(JSON.stringify(stored)) <= OUTBOX_ENTRY_MAX_BYTES) return stored;
  }
}
