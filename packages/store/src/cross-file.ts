// The same account in another hosted file.
//
// A file reaches the tables of another hosted file (a user-interface file over a data file) as the account of the same name
// there. The name alone is not the person: whoever has Full Access in one file can make an account of any name. So the
// password must match in the other file too, as FileMaker requires when it opens an external file. The proof is made when a
// password is accepted in a file (a sign-in, or a password set in Manage Security) and kept in both files as fingerprints of
// the two hashes it was made for, never the hashes, so it lapses by itself when either password changes. A wrong password
// counts as a failed sign-in in the other file, so guessing one file's password through another is held to that file's lockout.

import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { sameSecret } from './same-secret.ts';

/** What the proofs need of a hosted file; Store provides it. */
export interface CrossFileHost {
  readonly name: string;
  readonly sql: DatabaseSync;
  readonly crossFile: CrossFileProofs;
  /** The hash a proof is made against: the account's local password here, as its own sign-in from `from` would check it; with `active` false, whether the account is switched off is left to other checks. */
  crossFileHash(account: string, from: string, active?: boolean): string | undefined;
  /** The other hosted files a password accepted here is tried in. */
  crossFileFiles(): CrossFileHost[];
  /** Whether a transaction holds the file, so nothing may be written to it now. */
  crossFileBusy(): boolean;
  /** When sign-ins to the account from `from` are blocked until, if they are. */
  lockedOut(account: string, from: string): number | undefined;
  /** Counts and logs a password that opened `through` but was wrong here. */
  crossFileRefused(account: string, from: string, through: string): void;
}

/** A SHA-256 of a password hash string: identifies which hash a proof was made for without keeping the hash. */
const fingerprint = (hash: string): string => createHash('sha256').update(hash).digest('hex');
const key = (account: string, file: string): string => `${account.toLowerCase()}\u0000${file.toLowerCase()}`;

interface Verdict { own: string; theirs: string; proven: boolean }
interface ToProve { other: CrossFileHost; own: string; theirs: string }

export const CROSS_FILE_TABLE = `CREATE TABLE IF NOT EXISTS _fm_cross_file (account TEXT NOT NULL COLLATE NOCASE, file TEXT NOT NULL COLLATE NOCASE,
      own TEXT NOT NULL, theirs TEXT NOT NULL, proven INTEGER NOT NULL, PRIMARY KEY (account, file))`;

/** One file's verdicts on which of its accounts are the same-named accounts of other files (the table _fm_cross_file, and its memory copy). */
export class CrossFileProofs {
  private readonly file: CrossFileHost;
  private readonly check: { sync: (password: string, hash: string) => boolean; async: (password: string, hash: string) => Promise<boolean> };
  private readonly verdicts = new Map<string, Verdict>();
  /** Verdicts not yet in the file, by key. */
  private readonly unsaved = new Map<string, { account: string; file: string }>();

  constructor(file: CrossFileHost, check: CrossFileProofs['check']) {
    this.file = file;
    this.check = check;
  }

  private read(account: string, other: string): Verdict | undefined {
    const k = key(account, other);
    let entry = this.verdicts.get(k);
    if (!entry) {
      const row = this.file.sql.prepare('SELECT own, theirs, proven FROM _fm_cross_file WHERE account = ? AND file = ?').get(account, other) as { own: string; theirs: string; proven: number } | undefined;
      if (!row) return undefined;
      entry = { own: row.own, theirs: row.theirs, proven: row.proven === 1 };
      this.verdicts.set(k, entry);
    }
    return entry;
  }

  /** Whether the account has proved, with its password, that it is the account of the same name in `other`: true only while both passwords are the ones the proof was made with. */
  proven(account: string, other: CrossFileHost): boolean {
    this.save();
    const entry = this.read(account, other.name);
    if (!entry?.proven) return false;
    const own = this.file.crossFileHash(account, '', false), theirs = other.crossFileHash(account, '', false);
    return own !== undefined && theirs !== undefined && sameSecret(entry.own, fingerprint(own)) && sameSecret(entry.theirs, fingerprint(theirs));
  }

  /** What is left to prove for an account that just gave this password: each other file with a local account of that name whose pair of hashes has no verdict yet. */
  private toProve(account: string, from: string): ToProve[] {
    const own = this.file.crossFileHash(account, from);
    if (own === undefined) return [];
    const out: ToProve[] = [];
    for (const other of this.file.crossFileFiles()) {
      if (other === this.file) continue;
      const theirs = other.crossFileHash(account, from);
      if (theirs === undefined) continue;
      const ownPrint = fingerprint(own), theirsPrint = fingerprint(theirs);
      const entry = this.read(account, other.name);
      if (entry && sameSecret(entry.own, ownPrint) && sameSecret(entry.theirs, theirsPrint)) continue;
      // A place the other file has locked out gets no verdict: it is tried again once the lock has run out.
      if (other.lockedOut(account, from) !== undefined) continue;
      out.push({ other, own: ownPrint, theirs: theirsPrint });
    }
    return out;
  }

  /** Keeps a verdict in both files: the same password in two files is one fact, whichever file learned it. A mismatch counts against the other file's lockout only for a sign-in (`signIn`): a password set in Manage Security guessed nothing. */
  private record(account: string, from: string, item: ToProve, proven: boolean, signIn: boolean): void {
    this.keep(account, item.other.name, { own: item.own, theirs: item.theirs, proven });
    item.other.crossFile.keep(account, this.file.name, { own: item.theirs, theirs: item.own, proven });
    if (!proven && signIn) item.other.crossFileRefused(account, from, this.file.name);
  }

  private keep(account: string, other: string, verdict: Verdict): void {
    const k = key(account, other);
    this.verdicts.set(k, verdict);
    this.unsaved.set(k, { account, file: other });
    this.save();
  }

  /** Writes the verdicts the file does not hold yet, for other processes and the next start: never while a transaction holds the file (a script's pending change, another session's hold), where the row would land in that transaction; the memory copy serves until then. */
  private save(): void {
    if (!this.unsaved.size || this.file.crossFileBusy()) return;
    for (const [k, { account, file }] of this.unsaved) {
      const entry = this.verdicts.get(k);
      if (!entry) { this.unsaved.delete(k); continue; }
      try {
        this.file.sql.prepare('INSERT INTO _fm_cross_file (account, file, own, theirs, proven) VALUES (?, ?, ?, ?, ?) ON CONFLICT(account, file) DO UPDATE SET own = excluded.own, theirs = excluded.theirs, proven = excluded.proven')
          .run(account, file, entry.own, entry.theirs, entry.proven ? 1 : 0);
        this.unsaved.delete(k);
      } catch { /* tried again at the next verdict or check */ }
    }
  }

  /** Tries a password this file accepted in the other hosted files; on the thread pool. `signIn` is false for a password set rather than given. */
  async prove(account: string, password: string, from: string, signIn = true): Promise<void> {
    for (const item of this.toProve(account, from)) {
      const theirs = item.other.crossFileHash(account, from);
      let proven = false;
      try { proven = theirs !== undefined && await this.check.async(password, theirs); } catch { proven = false; }
      this.record(account, from, item, proven, signIn);
    }
  }

  /** As prove, on this thread, for the sign-ins that are checked on it (one password check per other file that has the account, the first time this pair of passwords meets). */
  proveSync(account: string, password: string, from: string, signIn = true): void {
    for (const item of this.toProve(account, from)) {
      const theirs = item.other.crossFileHash(account, from);
      let proven = false;
      try { proven = theirs !== undefined && this.check.sync(password, theirs); } catch { proven = false; }
      this.record(account, from, item, proven, signIn);
    }
  }
}
