// Files a cluster worker could not open, for the admin console and the Admin API (see cluster.ts). Only the leader,
// which serves them, keeps this list.

/** The longest error text kept for one entry. */
export const OPEN_FAILURE_TEXT_MAX = 300;
/** The most entries kept at once; the oldest is dropped for a new one. */
export const OPEN_FAILURE_ENTRIES_MAX = 64;

export interface OpenFailure { file: string; worker: number; error: string; at: string }

/**
 * An error's text as an administrator may see it: paths inside the hosted folder are relative to it, any other
 * absolute path is cut to its last segment, control characters become spaces, and the text is capped.
 */
export function plainOpenError(text: string, dir: string): string {
  let out = text;
  for (const base of new Set([dir, dir.replace(/\\/g, '/')])) {
    if (base) out = out.split(base.replace(/[\\/]+$/, '') + (base.includes('\\') ? '\\' : '/')).join('');
  }
  out = out.replace(/(?:[A-Za-z]:)?[\\/](?:[^\s'"`:;,<>|\\/]+[\\/])+([^\s'"`:;,<>|\\/]*)/g, '…/$1');
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
    while (this.entries.size > OPEN_FAILURE_ENTRIES_MAX) this.entries.delete(this.entries.keys().next().value!);
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
