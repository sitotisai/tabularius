import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from '../../store/src/index.ts';
import { STORE_EXT } from '../src/host.ts';
import { backupFolder, scheduleBackups } from '../src/index.ts';

// A new install hosts an empty folder until the first file is dropped on the page. The first scheduled backup of
// that folder is not a failure to report; one of a folder that had backups, and lost its files, still is.

/** Starts a schedule that is due now and resolves with its first log line. */
function firstLine(dir: string, dest?: string): Promise<{ line: string; schedule: ReturnType<typeof scheduleBackups> }> {
  return new Promise((resolve) => {
    // The schedule's own timer does not keep the process alive.
    const alive = setTimeout(() => {}, 30_000);
    const schedule = scheduleBackups(dir, { every: 50, dest, log: (line) => { clearTimeout(alive); resolve({ line, schedule }); } });
  });
}

test('the first backup of a folder that has never held a file is skipped quietly', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-backup-first-'));
  try {
    const { line, schedule } = await firstLine(dir);
    schedule.stop();
    assert.match(line, /^backup: nothing to back up yet/);
    assert.equal(schedule.last, undefined, 'the admin console should not show a failed backup');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a folder that lost its files after a backup still reports the failure', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-backup-lost-'));
  const dest = join(dir, 'Backups');
  try {
    createStore(join(dir, 'Notes' + STORE_EXT));
    await backupFolder(dir, dest, 7, '');
    renameSync(join(dir, 'Notes' + STORE_EXT), join(dir, 'moved'));
    const { line, schedule } = await firstLine(dir, dest);
    schedule.stop();
    assert.match(line, /^backup failed: .*no database files/);
    assert.equal(schedule.last?.ok, false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
