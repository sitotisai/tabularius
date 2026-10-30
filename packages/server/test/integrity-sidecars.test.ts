import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { integrity } from '../src/integrity-check.ts';
import { integrityAsync } from '../src/backup-verify.ts';

test('checking a database copy in a backup set leaves no log files beside it', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-integrity-'));
  try {
    const path = join(dir, 'Copy.openhbam.sqlite');
    const db = new DatabaseSync(path);
    db.exec('PRAGMA journal_mode = WAL; CREATE TABLE t (n INTEGER); INSERT INTO t VALUES (1)');
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    db.close();
    assert.equal(integrity(path, true), 'ok');
    assert.deepEqual(readdirSync(dir), ['Copy.openhbam.sqlite']);
    assert.equal(await integrityAsync(path, true), 'ok');
    assert.deepEqual(readdirSync(dir), ['Copy.openhbam.sqlite']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
