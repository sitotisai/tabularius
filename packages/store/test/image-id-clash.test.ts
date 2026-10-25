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

// Whether an image was added in Tabularius is never decided by its filename: filenames are not unique, not even inside a
// file (Charts has one name at two ids), and an added image can bring any name with it (a design import, POST /images,
// MCP). Only its bytes say it is the file's own copy; any other image under an id the file uses is kept, at worst as a
// duplicate under a new id.
type Name = (fileName: string, otherName: string) => string | null;
const names: Record<string, Name> = {
  "the file's own filename for that id": (own) => own,
  "the filename of another image of the file": (_own, other) => other,
  'an empty filename': () => '',
  'no filename': () => null,
};

function clashingNamed(name: Name) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-image-name-'));
  const path = join(dir, 'Charts.sqlite');
  importFmp12(fixture, path);
  const sql = new DatabaseSync(path);
  const rows = sql.prepare('SELECT id, filename, data FROM _fm_images ORDER BY id').all() as { id: number; filename: string | null; data: Uint8Array }[];
  const top = rows[rows.length - 1];
  const other = rows.find((r) => r.filename && r.filename !== top.filename);
  assert.ok(top.filename && other?.filename, 'the sample names its images');
  const fileImage = new Uint8Array(top.data);
  sql.prepare('DELETE FROM _fm_images WHERE id = ?').run(top.id);
  sql.close();
  const store = new Store(path, 'Charts');
  const wanted = name(top.filename, other.filename);
  try {
    assert.equal(store.addImage(wanted ?? 'x.png', 'image/png', PNG), top.id, 'the added image takes the missing id');
  } finally {
    store.close();
  }
  if (wanted !== 'x.png') {
    const fix = new DatabaseSync(path);
    fix.prepare('UPDATE _fm_images SET filename = ? WHERE id = ?').run(wanted, top.id);
    fix.close();
  }
  return { dir, path, id: top.id, fileImage, count: rows.length };
}

function after(path: string) {
  const sql = new DatabaseSync(path, { readOnly: true });
  try {
    return (sql.prepare('SELECT id, data FROM _fm_images ORDER BY id').all() as { id: number; data: Uint8Array }[]).map((r) => ({ id: r.id, data: new Uint8Array(r.data) }));
  } finally {
    sql.close();
  }
}

for (const [label, name] of Object.entries(names)) for (const how of ['design refresh', 'reconvert']) {
  test(`a ${how} keeps an added image that has ${label}`, { skip }, async () => {
    const { dir, path, id, fileImage, count } = clashingNamed(name);
    try {
      if (how === 'reconvert') await reconvert(path, fixture, { sameFile: true });
      else {
        const sql = new DatabaseSync(path);
        sql.prepare("UPDATE _fm_meta SET json = ? WHERE key = 'designVersion'").run(JSON.stringify(DESIGN_VERSION - 1));
        sql.close();
        upgradeDesigns(path, fixture);
      }
      const images = after(path);
      assert.ok(images.some((i) => Buffer.from(i.data).equals(Buffer.from(PNG))), "the user's image was not overwritten or dropped");
      assert.deepEqual([...images.find((i) => i.id === id)!.data], [...fileImage], "the file's own image has its own id back");
      assert.equal(images.length, count + 1, 'the user\'s image is one more than the file\'s library');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}
