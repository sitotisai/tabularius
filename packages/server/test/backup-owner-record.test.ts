// The pid-owner record names the server hosting a folder. On Windows an earlier build wrote the start time in another
// format (WMI's date text with the command line); a server started by it must still be found.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ownerMatches } from '../src/backup.ts';

const now = { started: '1761900000000', command: '' };

test('a record in the current form matches the running process, and only it', () => {
  const owner = { pid: 7, started: '1761900000000', command: '', ino: 5 };
  assert.equal(ownerMatches(owner, 7, 5, now, 'win32'), true);
  assert.equal(ownerMatches({ ...owner, started: '1761900000001' }, 7, 5, now, 'win32'), false);
  assert.equal(ownerMatches(owner, 8, 5, now, 'win32'), false);
  assert.equal(ownerMatches(owner, 7, 6, now, 'win32'), false);
});

test('on Windows a record in the earlier form is compared in that form', () => {
  const owner = { pid: 7, started: '/Date(1761900000000)/', command: 'tabularius serve C:\\data', ino: 5 };
  const asked: number[] = [];
  const legacy = (pid: number) => { asked.push(pid); return { started: '/Date(1761900000000)/', command: 'tabularius serve C:\\data' }; };
  assert.equal(ownerMatches(owner, 7, 5, now, 'win32', legacy), true);
  assert.deepEqual(asked, [7]);
  // Another process that was given the same number has another start time.
  assert.equal(ownerMatches(owner, 7, 5, now, 'win32', () => ({ started: '/Date(1761900009999)/', command: owner.command })), false);
  // Gone since: not running.
  assert.equal(ownerMatches(owner, 7, 5, now, 'win32', () => undefined), false);
});

test('off Windows a record is never compared in the earlier form', () => {
  const owner = { pid: 7, started: '123 456', command: 'node serve', ino: 5 };
  const legacy = () => { throw new Error('must not be asked'); };
  assert.equal(ownerMatches(owner, 7, 5, { started: '123 456', command: 'node serve' }, 'linux', legacy), true);
});
