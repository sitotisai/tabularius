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
    '.. ', '.. /Other', '...', 'x/. ./y', 'a/ /b',
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

test('fmp12-94: a file named like the storage folders cannot read other files\' storage', () => {
  // Another hosted file's storage sits in <folder>/Files/Other and <folder>/RC_Data_FMS/Other. A file called Files or
  // RC_Data_FMS must not make those its own, in any spelling (a case-insensitive disk treats them as one folder).
  for (const name of ['Files', 'files', 'FILES', 'RC_Data_FMS', 'rc_data_fms', 'Rc_Data_Fms']) {
    const mine = [at('RC_Data_FMS', name), at('Files', name)];
    for (const base of ['Other', 'Other/', 'Files/Other', 'files/Other', 'RC_Data_FMS/Other', 'rc_data_fms/Other', 'Files', 'RC_Data_FMS', '.', '']) {
      for (const r of externalRoots(folder, name, [base])) {
        assert.ok(mine.some((o) => r === o || r.startsWith(o + '/') || r.startsWith(o + '\\')), `${name} with ${JSON.stringify(base)} gave ${r}`);
        for (const other of ['Other']) {
          for (const top of ['Files', 'RC_Data_FMS']) assert.notEqual(r.toLowerCase(), at(top, other).toLowerCase(), `${name} with ${JSON.stringify(base)} gave ${r}`);
        }
      }
    }
    // its own storage still works, with and without a base directory
    assert.deepEqual(externalRoots(folder, name, []), mine);
    assert.ok(externalRoots(folder, name, ['Docs']).includes(at('Files', name, 'Docs')), name);
  }
  // an ordinary name keeps the folder named after it, which a base directory starting with that name leads into
  assert.ok(externalRoots(folder, 'Filesystem', ['Filesystem/Docs']).includes(at('Filesystem', 'Docs')));
});

test('fmp12-94: a folder name ending in a dot or a space is kept when it cannot act as a parent folder', () => {
  const roots = externalRoots(folder, 'Mine', ['Acme Inc./Scans', 'Archive /2024']);
  for (const want of [at('RC_Data_FMS', 'Mine', 'Acme Inc.', 'Scans'), at('Files', 'Mine', 'Acme Inc.', 'Scans'), at('RC_Data_FMS', 'Mine', 'Archive ', '2024')]) {
    assert.ok(roots.includes(want), want);
  }
  assert.ok(externalRoots(folder, 'Mine', ['Mine/Acme Inc./Scans']).includes(at('Mine', 'Acme Inc.', 'Scans')));
  // only a part made of dots and spaces can become "." or ".." once Windows strips it
  for (const base of ['.. ', 'a/.. /b', '. . /x', ' /x', '.../x']) {
    assert.deepEqual(externalRoots(folder, 'Mine', [base]), own, JSON.stringify(base));
  }
});
