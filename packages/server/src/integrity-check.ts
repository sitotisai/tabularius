// SQLite page checks on a database file. A leaf module on purpose: the worker threads that run these start by loading
// it, and loading the whole server for each check made a backup of a few files take seconds.

import { DatabaseSync } from 'node:sqlite';
import { existsSync, rmSync } from 'node:fs';
import { isDamageError } from '../../store/src/damage.ts';

/** Runs SQLite's full integrity check on a database file; "ok" or the first problems found. */
export function integrity(path: string, quick = false): string {
  const leftovers = ['-wal', '-shm'].filter((ext) => !existsSync(path + ext));
  const db = new DatabaseSync(path, { readOnly: true });
  try {
    const rows = db.prepare(quick ? 'PRAGMA quick_check' : 'PRAGMA integrity_check(5)').all() as Record<string, string>[];
    const problems = rows.map((r) => Object.values(r)[0]);
    if (problems.length === 1 && problems[0] === 'ok') {
      // A database Tabularius made, not just any SQLite file.
      const tables = db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type = 'table'").get() as { n: number };
      return tables.n ? 'ok' : 'holds no tables';
    }
    return problems.join('; ');
  } catch (e) {
    return (e as Error).message;
  } finally {
    db.close();
    // Opening it may leave empty log files; the copy is complete without them.
    for (const ext of leftovers) removeLeftover(path + ext);
  }
}

/** On Windows a file just closed can stay busy for a moment (the system's own scan of it): delete it again for a few seconds rather than leave a log file in a backup set. */
function removeLeftover(file: string): void {
  for (let attempt = 0; ; attempt++) {
    try { rmSync(file, { force: true }); return; }
    catch (e) {
      const busy = process.platform === 'win32' && ['EPERM', 'EBUSY', 'EACCES'].includes((e as NodeJS.ErrnoException).code ?? '');
      if (!busy || attempt >= 60) throw e;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
  }
}

export type PageCheck = { state: 'ok' } | { state: 'damaged' | 'unreadable'; detail: string };

/**
 * Reads every page of a file that may be in use: `damaged` is SQLite (or the check) saying its pages are bad; `unreadable`
 * is the file not being checkable right now (locked, no permission, out of descriptors), which says nothing about it.
 * Unlike `integrity` it removes nothing: a server may have opened the file since the check began.
 */
export function pageCheck(path: string, quick = true): PageCheck {
  const clean = (e: unknown) => ((e as Error).message || 'unknown error').replace(/[\r\n]+/g, ' ').slice(0, 120);
  let db: DatabaseSync | undefined;
  try {
    db = new DatabaseSync(path, { readOnly: true });
    db.exec('PRAGMA busy_timeout = 2000');
    const rows = db.prepare(quick ? 'PRAGMA quick_check' : 'PRAGMA integrity_check(5)').all() as Record<string, string>[];
    const problems = rows.map((r) => Object.values(r)[0]);
    if (problems.length !== 1 || problems[0] !== 'ok') return { state: 'damaged', detail: problems.join('; ').slice(0, 120) };
    const tables = db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type = 'table'").get() as { n: number };
    return tables.n ? { state: 'ok' } : { state: 'damaged', detail: 'holds no tables' };
  } catch (e) {
    return { state: isDamageError(e) ? 'damaged' : 'unreadable', detail: clean(e) };
  } finally {
    try { db?.close(); } catch { /* nothing more to do */ }
  }
}
