import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from '../../store/src/index.ts';
import { STORE_EXT } from '../src/host.ts';
import { backupFolder, backupSets } from '../src/index.ts';

// A backup of no database files is not a backup: it is refused, and never counts toward `keep`, so it cannot prune
// the real sets (a data folder that is empty, not mounted, or holds only encrypted-at-rest stores).

test('a folder with no database files is refused and prunes nothing', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.now() });
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-backup-empty-'));
  const dest = join(dir, 'Backups');
  const data = join(dir, 'data');
  try {
    createStore(join(dir, 'Notes' + STORE_EXT));
    await backupFolder(dir, dest, 1, '');
    const real = backupSets(dest);
    assert.equal(real.length, 1);

    // The files go away (an unmounted volume): the next scheduled backup has nothing to copy.
    t.mock.timers.tick(1100);
    renameSync(join(dir, 'Notes' + STORE_EXT), join(dir, 'moved'));
    await assert.rejects(backupFolder(dir, dest, 1, ''), /no database files/);
    assert.deepEqual(backupSets(dest), real);
    assert.deepEqual(readdirSync(dest).filter((n) => n.endsWith('.partial')), []);

    // A folder that does not exist yet makes nothing either.
    await assert.rejects(backupFolder(data, join(dir, 'Elsewhere'), 7, ''));
    assert.equal(existsSync(join(dir, 'Elsewhere')), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a folder whose stores are encrypted at rest says so instead of backing up nothing', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-backup-encrypted-'));
  try {
    writeFileSync(join(dir, 'Notes' + STORE_EXT + '.enc'), 'not a real store');
    await assert.rejects(backupFolder(dir, join(dir, 'Backups'), 1, ''), /encrypted at rest.*server/s);
    assert.deepEqual(backupSets(join(dir, 'Backups')), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
