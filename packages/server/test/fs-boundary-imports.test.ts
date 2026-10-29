import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { allowlistErrors, collectUnguardedWriters } from '../../../scripts/check-fs-boundary-imports.ts';

function fixture(source: string) {
  const root = mkdtempSync(join(tmpdir(), 'fs-boundary-imports-'));
  mkdirSync(join(root, 'packages/server/src'), { recursive: true });
  writeFileSync(join(root, 'packages/server/src/probe.ts'), source);
  return root;
}

test('detects named, aliased and namespace fs writers and accepts boundary imports', () => {
  const cases = [
    [`import { writeFileSync } from 'node:fs'; writeFileSync('x', 'x');`, true],
    [`import { writeFileSync } from 'node:fs'; import { writeFileSync as safeWrite } from '../../store/src/fs-boundary.ts'; writeFileSync('x', 'x');`, false],
    [`import { renameSync as move } from 'fs'; move('a', 'b');`, true],
    [`import * as fs from 'node:fs'; fs.renameSync('a', 'b');`, true],
    [`import { readFileSync } from 'node:fs'; readFileSync('x');`, false],
    [`// writeFileSync('x')\nconst text = "writeFileSync('x')";`, false],
    [`import { renameSync } from 'node:fs'; import { renameSync } from '../../store/src/file-ops.ts'; renameSync('a','b');`, false],
  ] as const;
  for (const [source, expected] of cases) {
    const root = fixture(source);
    try { assert.equal(collectUnguardedWriters(root).length > 0, expected, source); }
    finally { rmSync(root, { recursive: true, force: true }); }
  }
});

test('reports missing, stale, blank and duplicate allow-list entries', () => {
  const file = 'packages/server/src/probe.ts';
  assert.match(allowlistErrors([file], [])[0], /writes files without importing fs-boundary/);
  assert.match(allowlistErrors([], [{ file, reason: 'reviewed' }])[0], /stale allow-list entry/);
  assert.match(allowlistErrors([file], [{ file, reason: ' ' }])[0], /no reason/);
  assert.match(allowlistErrors([file], [{ file, reason: 'first' }, { file, reason: 'second' }])[0], /listed twice/);
});

test('real repository writers match the reasoned, shrinking allow-list of at most 32 entries', () => {
  const root = join(import.meta.dirname, '../../..');
  const list = JSON.parse(readFileSync(join(root, 'scripts/fs-boundary-allowlist.json'), 'utf8')) as { file: string; reason: string }[];
  assert.ok(list.length <= 32);
  assert.ok(list.every((entry) => entry.reason.length > 20));
  assert.deepEqual(allowlistErrors(collectUnguardedWriters(root), list), []);
});
