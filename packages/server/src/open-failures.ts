// Files a cluster worker could not open, for the admin console and the Admin API (see cluster.ts). Only the leader,
// which serves them, keeps this list.

import { normalize, resolve } from 'node:path';

/** The longest error text kept for one entry. */
export const OPEN_FAILURE_TEXT_MAX = 300;
/** The most entries kept at once; when it is passed, the worker holding the most loses its oldest. */
export const OPEN_FAILURE_ENTRIES_MAX = 64;
/** The most entries one worker may keep: its own oldest goes for a new one, and no other worker's entry is touched. */
export const OPEN_FAILURE_PER_WORKER_MAX = 16;

export interface OpenFailure { file: string; worker: number; error: string; at: string }

/** What follows the last path separator: a file name, which an administrator may see. */
const lastSegment = (path: string): string => path.split(/[\\/]/).pop() ?? '';

/** Quoted text is taken for a path when it starts like one or holds two separators (a name with one slash is only a name). */
function looksLikePath(text: string): boolean {
  return /^(?:[A-Za-z]:)?[\\/]|^(?:\.{1,2}|~)[\\/]/.test(text) || (text.match(/[\\/]/g)?.length ?? 0) >= 2;
}

// A name inside a path: anything but whitespace, quotes and the separators; a colon belongs to it when a non-space follows.
const NAME = String.raw`(?:[^\s'"` + '`' + String.raw`;,<>|\\/:]|:(?=[^\s]))`;
// A drive, two separators (a network share) or one separator that does not follow a word, a dot, a home mark or another separator
// (so a URL's slashes and "./x" are not taken), then at least one folder, then the last name.
const ABSOLUTE = new RegExp(String.raw`(?:(?<!\w)[A-Za-z]:[\\/]|(?<![:\w])[\\/]{2}|(?<![\w.~…:/\\])[\\/])(?:${NAME}+[\\/])+(${NAME}*)`, 'g');
// Relative to the folder the process runs in, or to a home folder.
const RELATIVE = new RegExp(String.raw`(?<![\w.…~/\\])(?:\.{1,2}|~)[\\/](?:${NAME}+[\\/])*(${NAME}*)`, 'g');

/**
 * An error's text as an administrator may see it: paths inside the hosted folder are relative to it, any other path (absolute or
 * relative, with spaces or colons in its names, quoted the way Node quotes it or not) is cut to its last segment, control
 * characters become spaces, and the text is capped. A path with a space that is not quoted cannot be told from the words
 * after it: it is cut at the first space, and the rest stays.
 */
export function plainOpenError(text: string, dir: string): string {
  let out = text;
  // The hosted folder, as given, normalized and resolved, with either separator, longest first.
  const bases = new Set<string>();
  for (const d of dir ? [dir, normalize(dir), resolve(dir)] : []) { bases.add(d); bases.add(d.replace(/\\/g, '/')); }
  for (const base of [...bases].sort((a, b) => b.length - a.length)) {
    const bare = base.replace(/[\\/]+$/, '');
    // Not inside a longer name or path ("metadata/" is not "data/").
    if (bare) out = out.replace(new RegExp(String.raw`(?<![\w.~…/\\-])${bare.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\/]`, 'g'), '');
  }
  // A quoted path (Node quotes the path of a failed call): all of it between the quotes goes but its last segment.
  out = out.replace(/(['"`])([^'"`\n]*[\\/][^'"`\n]*)\1/g, (all, quote: string, inside: string) => (looksLikePath(inside) ? `${quote}…/${lastSegment(inside)}${quote}` : all));
  out = out.replace(RELATIVE, '…/$1').replace(ABSOLUTE, '…/$1');
  // eslint-disable-next-line no-control-regex
  out = out.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();
  return out.length > OPEN_FAILURE_TEXT_MAX ? out.slice(0, OPEN_FAILURE_TEXT_MAX - 1) + '…' : out;
}

export class OpenFailures {
  private readonly entries = new Map<string, OpenFailure>();

  private key(file: string, worker: number): string { return `${worker}:${file.toLowerCase()}`; }

  set(file: string, worker: number, text: string, dir: string, now: () => number = Date.now): void {
    const key = this.key(file, worker);
    this.entries.delete(key);
    this.entries.set(key, { file, worker, error: plainOpenError(text, dir), at: new Date(now()).toISOString() });
    // One worker cannot push out the others': past its own cap it loses its own oldest entry ...
    const mine = [...this.entries].filter(([, e]) => e.worker === worker);
    for (const [k] of mine.slice(0, Math.max(0, mine.length - OPEN_FAILURE_PER_WORKER_MAX))) this.entries.delete(k);
    // ... and past the total, the worker holding the most does.
    while (this.entries.size > OPEN_FAILURE_ENTRIES_MAX) {
      const counts = new Map<number, number>();
      for (const e of this.entries.values()) counts.set(e.worker, (counts.get(e.worker) ?? 0) + 1);
      const biggest = [...counts].reduce((a, b) => (b[1] > a[1] ? b : a))[0];
      this.entries.delete([...this.entries].find(([, e]) => e.worker === biggest)![0]);
    }
  }

  /** The file opened in this worker. */
  clear(file: string, worker: number): void { this.entries.delete(this.key(file, worker)); }

  /** The worker stopped: what it reported is no longer true. */
  clearWorker(worker: number): void {
    for (const [key, e] of this.entries) if (e.worker === worker) this.entries.delete(key);
  }

  /** Entries for files still in the folder (a removed file's entry goes), oldest first. */
  list(stillThere: (file: string) => boolean): OpenFailure[] {
    for (const [key, e] of this.entries) if (!stillThere(e.file)) this.entries.delete(key);
    return [...this.entries.values()].map((e) => ({ ...e }));
  }
}
