import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ComponentLibrary, LIBRARY_FILE } from '../src/component-library.ts';

test('a damaged library file is set aside once, however many requests read it', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-library-copies-'));
  const copies = () => readdirSync(dir).filter((f) => f.startsWith(`${LIBRARY_FILE}.damaged-`));
  try {
    writeFileSync(join(dir, LIBRARY_FILE), '{"not": "finished"');
    const lib = new ComponentLibrary(dir);
    // Every design-mode request that touches the library reads it: a hundred of them make one copy, not a hundred.
    for (let i = 0; i < 50; i++) {
      assert.deepEqual(lib.list(), []);
      assert.equal(lib.get('anything'), undefined);
    }
    assert.equal(copies().length, 1, 'one set-aside copy');
    // Another reader of the same folder (a second library object, as in another worker) does not make another either.
    const other = new ComponentLibrary(dir);
    for (let i = 0; i < 10; i++) other.list();
    assert.equal(copies().length, 1, 'the same damaged file is not kept twice');
    // The file damaged again in a new way is a new thing to keep.
    writeFileSync(join(dir, LIBRARY_FILE), '{"not": "finished either, and longer"');
    for (let i = 0; i < 10; i++) lib.list();
    assert.equal(copies().length, 2, 'different damage is a new thing to keep');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
