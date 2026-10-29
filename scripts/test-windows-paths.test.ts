import { test } from 'node:test';
import assert from 'node:assert/strict';
import { asSpecifier, driveLetterPath } from './test-windows-paths.ts';

test('a path that starts with a drive letter is told apart from a URL, a package and a relative path', () => {
  for (const path of ['D:\\a\\tabularius\\src\\index.ts', 'c:/work/src/index.ts']) assert.equal(driveLetterPath(path), true, path);
  for (const other of ['file:///D:/a/index.ts', 'node:fs', 'node:sqlite', './index.ts', '../src/index.ts', '/home/user/index.ts', 'zod', 'a:b', 'C:']) {
    assert.equal(driveLetterPath(other), false, other);
    assert.equal(asSpecifier(other), other);
  }
});

test('a drive-letter path becomes the file URL of that path', () => {
  assert.match(asSpecifier('C:/work/src/index.ts'), /^file:\/\/\/.*index\.ts$/);
});
