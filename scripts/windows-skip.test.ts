import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allTests, windowsSkips } from './test-plan.ts';

test('every test file skipped on Windows exists and says why', () => {
  const files = new Set(allTests());
  for (const [file, reason] of Object.entries(windowsSkips())) {
    assert.ok(files.has(file), `${file} is not a test file: take it off scripts/windows-skip.json`);
    assert.ok(reason.trim().length >= 20, `${file} needs a reason of a sentence`);
  }
});
