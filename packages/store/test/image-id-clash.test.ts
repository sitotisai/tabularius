import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DESIGN_VERSION, importFmp12, reconvert, Store, upgradeDesigns } from '../src/index.ts';

// An image added in Tabularius must never be overwritten or dropped by the file's own library, even in a store where
// it took an id the .fmp12 also uses (an older converter that had not read the file's highest image).

const fixture = join(import.meta.dirname, '..', '..', '..', 'fixtures', 'fmp12', 'Charts.fmp12');
const skip = existsSync(fixture) ? false : 'fixtures missing: run npm run fixtures';
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 9, 9, 9, 9]);

/** A store where the file's highest image id is missing and the user's image holds it, as a legacy store could. */
function clashing() {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-image-clash-'));
  const path = join(dir, 'Charts.sqlite');
  importFmp12(fixture, path);
  const sql = new DatabaseSync(path);
  const top = (sql.prepare('SELECT max(id) AS id FROM _fm_images').get() as { id: number }).id;
  const fileImage = sql.prepare('SELECT data FROM _fm_images WHERE id = ?').get(top) as { data: Uint8Array };
  sql.prepare('DELETE FROM _fm_images WHERE id = ?').run(top);
  sql.close();
  const store = new Store(path, 'Charts');
  try {
    assert.equal(store.addImage('mine.png', 'image/png', PNG), top, 'the added image takes the missing id');
  } finally {
    store.close();
  }
  return { dir, path, id: top, fileImage: new Uint8Array(fileImage.data) };
}

/** The id (any) holding the user's image, and the picture each id of the file now has. */
function look(path: string, top: number, fileImage: Uint8Array) {
  const store = new Store(path, 'Charts');
  try {
    const mine = store.images().filter((i) => i.filename === 'mine.png');
    assert.equal(mine.length, 1, 'the added image is kept once');
    assert.deepEqual([...store.image(mine[0].id)!.data], [...PNG]);
    assert.deepEqual([...store.image(top)!.data], [...fileImage], "the file's own image has its own id back");
    return mine[0].id;
  } finally {
    store.close();
  }
}

test('a design refresh moves an added image off an id the file uses, and layouts that use it follow', { skip }, () => {
  const { dir, path, id, fileImage } = clashing();
  try {
    const store = new Store(path, 'Charts');
    try {
      const occurrence = store.schema.tables[0].name;
      store.applyDesign([{ op: 'createLayout', name: 'Picture', occurrence, design: { objects: [{ id: 1, kind: 'graphic', type: 3, bounds: [0, 0, 50, 50], imageId: id }] } }] as never);
    } finally {
      store.close();
    }
    const sql = new DatabaseSync(path);
    sql.prepare("UPDATE _fm_meta SET json = ? WHERE key = 'designVersion'").run(JSON.stringify(DESIGN_VERSION - 1));
    sql.close();
    upgradeDesigns(path, fixture);
    const mine = look(path, id, fileImage);
    assert.notEqual(mine, id);
    const after = new Store(path, 'Charts');
    try {
      const layout = after.designs().layouts.find((l) => l.name === 'Picture');
      assert.equal(layout?.objects?.[0]?.imageId, mine, 'the layout still shows the added image');
    } finally {
      after.close();
    }
    upgradeDesigns(path, fixture); // and again: nothing moves or doubles
    assert.equal(look(path, id, fileImage), mine);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a reconvert keeps an added image that holds an id the file uses, under another id', { skip }, async () => {
  const { dir, path, id, fileImage } = clashing();
  try {
    await reconvert(path, fixture, { sameFile: true });
    assert.notEqual(look(path, id, fileImage), id);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a reconvert that discards design changes still keeps the added image (unused by any layout)', { skip }, async () => {
  const { dir, path, id, fileImage } = clashing();
  try {
    const store = new Store(path, 'Charts');
    try {
      store.applyDesign([{ op: 'createLayout', name: 'Picture', occurrence: store.schema.tables[0].name, design: { objects: [] } }] as never);
    } finally {
      store.close();
    }
    await reconvert(path, fixture, { force: true, sameFile: true });
    look(path, id, fileImage);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
