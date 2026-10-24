// Where externally stored container files may be read from. The base
// directories come from the .fmp12, so one that climbs out with ".." or names
// another hosted file's storage must not widen the roots.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { externalRoots } from '../src/store.ts';

const folder = resolve('/srv/hosted');
const at = (...parts: string[]) => resolve(folder, ...parts);
const own = [at('RC_Data_FMS', 'Mine'), at('Files', 'Mine')];

test('fmp12-94: a base directory that leaves the file\'s own storage adds no root', () => {
  const bad = [
    // climbing out
    '../Other', 'a/../../sub', '../', '..', '..\\Other', 'Files/../../Other/', 'x/..',
    // Windows drops a trailing dot or space, so these act as ".."
    '.. ', '.. /Other', '...', 'a../b', 'a /b',
    // plain names: another hosted file's storage, a sibling folder, or the folders that hold every file's storage
    'Other', 'Other/', 'Files/Other/', 'RC_Data_FMS/Other/', 'Files', 'RC_Data_FMS', '.', './', '/',
    // a drive
    'C:/Other', 'C:\\Other',
  ];
  for (const base of bad) {
    const roots = externalRoots(folder, 'Mine', [base]);
    for (const r of roots) assert.ok(own.some((o) => r === o || r.startsWith(o + '/') || r.startsWith(o + '\\')), `${JSON.stringify(base)} gave ${r}`);
  }
  for (const base of ['../Other', '..', 'Other', '.', 'Files', 'RC_Data_FMS', 'C:/Other']) {
    assert.ok(!externalRoots(folder, 'Mine', [base]).some((r) => r === at(base) || r === at('RC_Data_FMS') || r === at('Files') || r === folder), JSON.stringify(base));
  }
  assert.deepEqual(externalRoots(folder, 'Mine', ['../Other']), own);
  assert.deepEqual(externalRoots(folder, 'Mine', ['Other']), [at('RC_Data_FMS', 'Mine', 'Other'), at('Files', 'Mine', 'Other'), ...own]);
});

test('fmp12-94: a file\'s own storage, with or without a base directory, is still read', () => {
  assert.deepEqual(externalRoots(folder, 'Mine', []), own);
  const roots = externalRoots(folder, 'Mine', ['../Other', 'Files/Mine/', '/Docs\\Scans', 'Mine/']);
  for (const want of [at('Files', 'Mine'), at('RC_Data_FMS', 'Mine'), at('RC_Data_FMS', 'Mine', 'Docs', 'Scans'), at('Files', 'Mine', 'Docs', 'Scans'), at('RC_Data_FMS', 'Mine', 'Files', 'Mine')]) {
    assert.ok(roots.includes(want), want);
  }
  assert.ok(roots.every((r) => !r.includes('Other')), roots.join('\n'));
});
