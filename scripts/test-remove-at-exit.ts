import { rmSync, type RmOptions } from 'node:fs';

// node:test runs a test's `after` hooks in the order they were added, so a folder removed in a hook that a setup helper
// added first goes before the server the test closes in a later hook. A test file is one process: remove its folders
// when the process ends, after every hook has run.
const folders = new Map<string, RmOptions>();

export function removeAtExit(path: string, options: RmOptions = {}): void {
  if (!folders.size) process.once('exit', () => {
    for (const [folder, rm] of folders) {
      try { rmSync(folder, { recursive: true, force: true, maxRetries: 5, retryDelay: 50, ...rm }); } catch { /* best effort: a temporary folder left behind is not a test failure */ }
    }
  });
  folders.set(path, options);
}
