// Where externally stored container files may be read from. The base
// directories come from the .fmp12, so one that climbs out with ".." must not
// widen the roots to another hosted file's storage or a sibling folder.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { externalRoots } from '../src/store.ts';

const folder = resolve('/srv/hosted');
const own = [resolve(folder, 'RC_Data_FMS', 'Mine'), resolve(folder, 'Files', 'Mine')];

test('fmp12-94: a base directory with ".." adds no root', () => {
  for (const base of ['../Other', 'a/../../sub', '../', '..', '..\\Other', 'Files/../../Other/', 'x/..', 'C:/Other', 'C:\\Other']) {
    assert.deepEqual(externalRoots(folder, 'Mine', [base]), own, JSON.stringify(base));
  }
});

test('fmp12-94: ordinary base directories still give their roots, and a bad one beside them is skipped', () => {
  const roots = externalRoots(folder, 'Mine', ['../Other', 'Files/Mine/', '/Docs\\Scans']);
  assert.ok(roots.includes(resolve(folder, 'Files', 'Mine')));
  assert.ok(roots.includes(resolve(folder, 'RC_Data_FMS', 'Docs', 'Scans')));
  assert.ok(roots.includes(resolve(folder, 'Docs', 'Scans')));
  assert.ok(roots.every((r) => !r.includes('Other')), roots.join('\n'));
});
