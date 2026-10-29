// Synthetic ownership metadata for tests whose child or parent stands in for a server.
import { statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { processIdentity } from '../src/backup.ts';

export function writePidOwner(folder: string, pid: number): void {
  const file = join(folder, '.openhbam.pid');
  writeFileSync(file, String(pid));
  const identity = processIdentity(pid);
  if (!identity) throw new Error('test process is not running');
  writeFileSync(join(folder, '.openhbam-pid-owner.json'), JSON.stringify({ pid, started: identity.started, command: identity.command, ino: statSync(file).ino }));
}
