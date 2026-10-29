import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { checkBackupRules } from '../src/backup-folder.ts';

// Simulate an existing hosted root with container folders not yet created.
// Missing components retain the spelling supplied by the operator.
const canonical = (file: string) => {
  if (file.toLowerCase() === 'c:\\data') return 'C:\\Data';
  throw Object.assign(new Error('not created'), { code: 'ENOENT' });
};

for (const folder of ['c:\\data\\files\\backup', 'C:/Data/rc_data_fms/backup']) {
  test(`Windows refuses a backup under an uncreated container folder: ${folder}`, () => {
    assert.throws(() => checkBackupRules(folder, 'C:\\Data', path.win32, canonical), /can't be inside/);
  });
}

test('Windows accepts sibling prefixes, other drives and a normal backup subfolder', () => {
  for (const folder of ['C:\\Data\\Files-old', 'D:\\Data\\Files', 'C:\\Data\\backups']) {
    assert.equal(checkBackupRules(folder, 'C:\\Data', path.win32, canonical), folder);
  }
});

test('Windows refuses the hosted folder itself and drive-relative destinations', () => {
  assert.throws(() => checkBackupRules('c:\\data', 'C:\\Data', path.win32, canonical), /hosted folder itself/);
  assert.throws(() => checkBackupRules('C:backups', 'C:\\Data', path.win32, canonical), /full path/);
});

test('POSIX keeps case-sensitive containment and rejects exact container descendants', () => {
  const canonical = (file: string) => file;
  assert.equal(checkBackupRules('/data/files/backups', '/data', path.posix, canonical), '/data/files/backups');
  assert.throws(() => checkBackupRules('/data/Files/backups', '/data', path.posix, canonical), /can't be inside/);
});
