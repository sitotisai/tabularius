// docs/hosting-for-a-team.md says what the inbound-hook call log promises on Windows and what its lock does. These checks keep that
// sentence present and true to inbound-hooks.ts (file name, 0600 mode, the 50 ms lock wait).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..', '..');
const flat = (text: string): string => text.replace(/\s+/g, ' ');

test('the team hosting page states the call log mode on Windows and the lock behaviour', () => {
  const page = flat(readFileSync(join(root, 'docs/hosting-for-a-team.md'), 'utf8'));
  const phrases = [
    '`inbound-hook-calls.jsonl`',
    '(mode 0600) on macOS and Linux',
    'Windows has no mode bits',
    'the folder\'s access list',
    '`inbound-hook-calls.jsonl.lock.db`',
    'which SQLite opens itself and the file-safety checks do not guard',
    'a call is left out of the log, with a line in the server log, if that lock is held for more than 50 ms',
  ];
  assert.deepEqual(phrases.filter((x) => !page.includes(x)), []);
});

test('the file name, mode and lock wait the page states are the ones the code uses', () => {
  const src = flat(readFileSync(join(root, 'packages/server/src/inbound-hooks.ts'), 'utf8'));
  assert.ok(src.includes("const CALLS_FILE = 'inbound-hook-calls.jsonl';"), 'the log file name');
  assert.ok(src.includes('{ mode: 0o600 }'), 'the log is created with mode 0600');
  assert.ok(src.includes('withStateLock(f, () => {'), 'the log is written under the state lock');
  assert.ok(src.includes('}, 50);'), 'the lock wait is 50 ms');
});
