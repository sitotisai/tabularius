// Loaded with `node --import` by `npm run test:ci` on Windows only.
//
// Windows refuses to delete a file that a process still holds open, and most tests remove their
// temporary folder while the store they opened in it is still open (Linux and macOS allow it). Rather
// than touch a thousand tests, this keeps a list of the SQLite files opened in the process and, when a
// delete fails because the file is in use, closes the ones under that path and tries once more.
// It changes nothing about what a test asserts, and does nothing when the delete works.
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';

type Database = { close(): void; isOpen?: boolean };
type DatabaseClass = new (location: string, ...rest: unknown[]) => Database;
type FsLike = Record<string, any> & { promises?: Record<string, any> };

const IN_USE = new Set(['EBUSY', 'EPERM', 'ENOTEMPTY']);
const SYNC_DELETES = ['rmSync', 'unlinkSync', 'rmdirSync'];
const ASYNC_DELETES = ['rm', 'unlink', 'rmdir'];

const normal = (path: string, caseBlind: boolean): string => {
  const full = resolve(path);
  return caseBlind ? full.toLowerCase() : full;
};

/** Wraps the SQLite class so that every file it opens is remembered, and returns what closes them. */
export function trackDatabases(sqlite: { DatabaseSync: DatabaseClass }, caseBlind = process.platform === 'win32') {
  const opened: { location: string; ref: WeakRef<Database> }[] = [];
  const Original = sqlite.DatabaseSync;
  sqlite.DatabaseSync = class extends Original {
    constructor(location: string, ...rest: unknown[]) {
      super(location, ...rest);
      if (typeof location === 'string' && location !== '' && location !== ':memory:') {
        opened.push({ location: normal(location, caseBlind), ref: new WeakRef(this) });
      }
    }
  };
  /** Closes every open database at `path`, beside it (its -wal and -journal files) or below it. Returns how many it closed. */
  return function closeUnder(path: unknown): number {
    if (typeof path !== 'string' && !(path instanceof URL) && !Buffer.isBuffer(path)) return 0;
    const target = normal(path instanceof URL ? path.pathname : path.toString(), caseBlind);
    let closed = 0;
    for (let i = opened.length - 1; i >= 0; i--) {
      const db = opened[i].ref.deref();
      if (!db) { opened.splice(i, 1); continue; }
      const { location } = opened[i];
      if (location !== target && !location.startsWith(target + sep) && !target.startsWith(location + '-')) continue;
      opened.splice(i, 1);
      try { if (db.isOpen !== false) { db.close(); closed++; } } catch { /* already closed, or busy with a statement: the retry reports it */ }
    }
    return closed;
  };
}

/** Makes a delete that fails because a file is in use close the databases under it and retry once. */
export function retryDeletes(fs: FsLike, closeUnder: (path: unknown) => number): void {
  for (const name of SYNC_DELETES) {
    const original = fs[name];
    if (typeof original !== 'function') continue;
    fs[name] = function (this: unknown, path: unknown, ...rest: unknown[]) {
      try {
        return original.call(this, path, ...rest);
      } catch (error) {
        if (!IN_USE.has((error as NodeJS.ErrnoException)?.code ?? '') || closeUnder(path) === 0) throw error;
        return original.call(this, path, ...rest);
      }
    };
  }
  for (const name of ASYNC_DELETES) {
    const original = fs.promises?.[name];
    if (typeof original !== 'function') continue;
    fs.promises![name] = async function (this: unknown, path: unknown, ...rest: unknown[]) {
      try {
        return await original.call(this, path, ...rest);
      } catch (error) {
        if (!IN_USE.has((error as NodeJS.ErrnoException)?.code ?? '') || closeUnder(path) === 0) throw error;
        return original.call(this, path, ...rest);
      }
    };
  }
}

export function install(): void {
  const require = createRequire(import.meta.url);
  const fs = require('node:fs') as FsLike;
  const closeUnder = trackDatabases(require('node:sqlite'));
  retryDeletes(fs, closeUnder);
  // Named imports of node:fs in the test files see the wrapped functions only after this.
  require('node:module').syncBuiltinESMExports();
}

if (process.platform === 'win32' || process.env.TABULARIUS_TEST_CLEANUP === '1') install();
