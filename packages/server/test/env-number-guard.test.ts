import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { checkRepository, scanSource, type Allowance } from '../../../scripts/check-env-numbers.ts';

function fixture(run: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), 'env-number-guard-'));
  try { mkdirSync(join(root, 'scripts'), { recursive: true }); run(root); } finally { rmSync(root, { recursive: true, force: true }); }
}
function source(root: string, file: string, text: string): void {
  const path = join(root, file);
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, text);
}
const entry = (file: string, name: string, reason = 'Reviewed synthetic test allowance'): Allowance => ({ file, name, reason });
const probe = 'packages/x/src/a.ts';

test('finds supported environment expressions and ignores comments, strings, and settings helper file', () => {
  assert.deepEqual(scanSource(probe, "Number(process.env.SOME_VAR ?? 5);\nNumber(process.env['OTHER']);\nNumber((process.env.THIRD)!);"), [
    { file: probe, line: 1, name: 'SOME_VAR' }, { file: probe, line: 2, name: 'OTHER' }, { file: probe, line: 3, name: 'THIRD' },
  ]);
  assert.deepEqual(scanSource(probe, "// Number(process.env.COMMENT)\nconst s = 'Number(process.env.STRING)';"), []);
  fixture((root) => {
    source(root, 'packages/x/src/a.ts', 'Number(process.env.X);');
    source(root, 'packages/store/src/settings.ts', 'Number(process.env.X);');
    const r = checkRepository(root, []);
    assert.deepEqual(r.findings, [{ file: probe, line: 1, name: 'X' }]);
  });
});

test('enforces a shrinking, unique allow-list with non-empty reasons', () => {
  fixture((root) => {
    source(root, probe, 'Number(process.env.X);');
    const missing = checkRepository(root, [entry(probe, 'GONE')]);
    assert.equal(missing.stale.length, 1);
    assert.equal(missing.findings.length, 1);
    const allowed = checkRepository(root, [entry(probe, 'X')]);
    assert.equal(allowed.allowed, 1);
    assert.deepEqual(allowed.findings, []);
    const duplicate = checkRepository(root, [entry(probe, 'X'), entry(probe, 'X')]);
    assert.equal(duplicate.stale.length, 2);
    assert.equal(duplicate.findings.length, 0);
    const emptyReason = checkRepository(root, [entry(probe, 'X', '  ')]);
    assert.equal(emptyReason.findings.length, 1);
    assert.equal(emptyReason.stale.length, 1);
  });
});

test('the repository allow-list has no findings or stale entries and can only shrink from eleven', () => {
  const r = checkRepository();
  assert.deepEqual(r.findings, []);
  assert.deepEqual(r.stale, []);
  const list = JSON.parse(readFileSync(resolve(import.meta.dirname, '../../../scripts/check-env-numbers-allowlist.json'), 'utf8')) as Allowance[];
  assert.ok(list.length <= 11);
  assert.ok(list.every((a) => a.reason.trim().length > 0));
});
