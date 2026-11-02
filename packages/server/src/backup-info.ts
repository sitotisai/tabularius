import { join } from 'node:path';
import { atomicWrite, withStateLock } from '../../store/src/durable.ts';
import { readFileSync } from '../../store/src/fs-boundary.ts';
import { checkManifestKeys, ManifestKeyError } from './backup-json-keys.ts';

/** Missing is allowed only when building a new manifest or reading legacy metadata. */
export function readBackupInfo<T extends object = Record<string, unknown>>(setDir: string, allowMissing = false): T {
  const path = join(setDir, 'backup.json');
  try {
    const raw = readFileSync(path, 'utf8');
    checkManifestKeys(raw);
    const info: unknown = JSON.parse(raw);
    if (!info || typeof info !== 'object' || Array.isArray(info)) throw new Error('expected an object');
    return info as T;
  } catch (e) {
    if (allowMissing && (e as NodeJS.ErrnoException).code === 'ENOENT') return {} as T;
    // The cause's own text can hold file contents; say only which kind of problem it was.
    // A link, a pipe or a folder at the manifest's name is refused by the filesystem boundary before anything is read.
    const why = e instanceof ManifestKeyError ? e.message : e instanceof SyntaxError ? 'invalid JSON'
      : (e as NodeJS.ErrnoException).code === 'ESTALE' ? 'not a plain file (a link, a pipe or a folder stands where the manifest should be)' : 'manifest could not be read';
    throw new Error(`unreadable manifest ${path}: ${why}`);
  }
}

export function writeBackupInfo(setDir: string, info: object): void {
  atomicWrite(join(setDir, 'backup.json'), JSON.stringify(info, null, 2));
}

/** All manifest editors share one lock, including checks run by a CLI beside the server. */
export function updateBackupInfo<T extends object = Record<string, unknown>>(setDir: string, change: (info: T) => void): void {
  withStateLock(join(setDir, 'backup.json'), () => {
    const info = readBackupInfo<T>(setDir, true);
    change(info);
    writeBackupInfo(setDir, info);
  });
}
