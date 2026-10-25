import path from 'node:path';
import { accessSync, statSync, constants } from 'node:fs';

/**
 * Native tools only: batch files would require a shell, which thumbnail inputs never enter. The answer is always a full path
 * taken from the PATH list: a program is never found in the current folder (Windows looks there first for a bare name, and
 * the folder a service runs in can be one that other accounts write to), and a PATH entry that is not a full path is skipped.
 */
export function findExecutable(cmd: string, platform: NodeJS.Platform = process.platform, env: NodeJS.ProcessEnv = process.env, usable: (file: string) => boolean = (file) => {
  try { accessSync(file, constants.X_OK); return statSync(file).isFile(); } catch { return false; }
}): string | undefined {
  const paths = platform === 'win32' ? path.win32 : path.posix;
  const names = platform === 'win32' ? [`${cmd}.exe`, `${cmd}.com`] : [cmd];
  for (const entry of (env.PATH ?? env.Path ?? '').split(paths.delimiter)) {
    const dir = entry.replace(/^"|"$/g, '');
    if (!dir || !paths.isAbsolute(dir)) continue;
    for (const name of names) {
      const file = paths.join(dir, name);
      if (usable(file)) return file;
    }
  }
  return undefined;
}
