import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import path from 'node:path';
import { withinPath } from '../../store/src/portable-path.ts';

export class BackupFolderError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** The path with symlinks followed as far as it exists (a folder not made yet is judged by the nearest one that is). */
function realish(file: string, paths = path, canonical: (file: string) => string = realpathSync): string {
  const rest: string[] = [];
  let at = paths.resolve(file);
  for (;;) {
    try {
      return paths.join(canonical(at), ...rest.reverse());
    } catch {
      const up = paths.dirname(at);
      if (up === at) return paths.resolve(file);
      rest.push(paths.basename(at));
      at = up;
    }
  }
}

/** The destination rules alone, answered without touching the disk beyond looking: is it a full path, and not the hosted files themselves. */
export function checkBackupRules(folder: string, hosted: string, paths = path, canonical: (file: string) => string = realpathSync): string {
  if (!paths.isAbsolute(folder)) throw new BackupFolderError('the backup folder is a full path, like /Volumes/Backup/tabularius');
  const at = paths.resolve(folder);
  const real = realish(at, paths, canonical);
  const home = realish(hosted, paths, canonical);
  if (paths.relative(home, real) === '') throw new BackupFolderError("the backup folder can't be the hosted folder itself: pick another, or one inside it");
  for (const inner of ['Files', 'RC_Data_FMS']) {
    const guarded = paths.join(home, inner);
    // Missing components have no canonical spelling yet; use the platform's case and separator rules.
    if (withinPath(guarded, real, paths)) throw new BackupFolderError(`the backup folder can't be inside ${paths.join(hosted, inner)}: its files are backed up`);
  }
  return at;
}

/** Whether a configured destination still looks usable, for listings: the rules, and that the folder is there. Never creates or writes anything. */
export function backupFolderProblem(folder: string, hosted: string): string | undefined {
  try {
    const at = checkBackupRules(folder, hosted);
    if (!existsSync(at)) return `${folder} isn't there: is the drive connected?`;
    if (!statSync(at).isDirectory()) return `${folder} is a file, not a folder`;
    return undefined;
  } catch (e) {
    return e instanceof BackupFolderError ? e.message : `can't reach ${folder}: ${(e as NodeJS.ErrnoException).code ?? (e as Error).message}`;
  }
}

/** Apply the same destination rules wherever a backup destination is configured, and make sure it can be written to. */
export function checkBackupFolder(folder: string, hosted: string): string {
  const at = checkBackupRules(folder, hosted);
  try {
    if (existsSync(at) && !statSync(at).isDirectory()) throw new BackupFolderError(`${folder} is a file, not a folder`);
    if (!existsSync(at)) {
      if (!existsSync(dirname(at))) throw new BackupFolderError(`${dirname(at)} isn't there: is the drive connected? Make the folder above it first`);
      mkdirSync(at);
    }
    const probe = join(at, `.openhbam-write-test-${randomBytes(6).toString('hex')}`);
    writeFileSync(probe, '', { flag: 'wx' });
    rmSync(probe, { force: true });
  } catch (e) {
    if (e instanceof BackupFolderError) throw e;
    throw new BackupFolderError(`can't write to ${folder}: ${(e as NodeJS.ErrnoException).code ?? (e as Error).message}`);
  }
  return at;
}
