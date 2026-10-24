import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DESIGN_VERSION, importFmp12, reconvert, Store, upgradeDesigns } from '../src/index.ts';

// Images added in Tabularius are not in the .fmp12 and not in the design log: a design refresh and a reconvert keep them.

const fixture = join(import.meta.dirname, '..', '..', '..', 'fixtures', 'fmp12', 'Charts.fmp12');
const skip = existsSync(fixture) ? false : 'fixtures missing: run npm run fixtures';
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);

function withStore(fn: (path: string, id: number, library: number) => Promise<void> | void) {
  return async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tabularius-added-images-'));
    const path = join(dir, 'Charts.sqlite');
    try {
      importFmp12(fixture, path);
      const store = new Store(path, 'Charts');
      let id: number, library: number;
      try {
        library = store.images().length;
        id = store.addImage('mine.png', 'image/png', PNG);
      } finally {
        store.close();
      }
      await fn(path, id, library);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };
}

function check(path: string, id: number, library: number) {
  const store = new Store(path, 'Charts');
  try {
    assert.equal(store.images().length, library + 1);
    const image = store.image(id);
    assert.equal(image?.filename, 'mine.png');
    assert.deepEqual([...image!.data], [...PNG]);
  } finally {
    store.close();
  }
}

test('a design refresh from the .fmp12 keeps the images added in Tabularius', { skip }, withStore((path, id, library) => {
  const sql = new DatabaseSync(path);
  sql.prepare("UPDATE _fm_meta SET json = ? WHERE key = 'designVersion'").run(JSON.stringify(DESIGN_VERSION - 1));
  sql.close();
  upgradeDesigns(path, fixture);
  check(path, id, library);
  // And again: nothing doubles.
  upgradeDesigns(path, fixture);
  check(path, id, library);
}));

test('a reconvert keeps the images added in Tabularius', { skip }, withStore(async (path, id, library) => {
  await reconvert(path, fixture, { sameFile: true });
  check(path, id, library);
}));
