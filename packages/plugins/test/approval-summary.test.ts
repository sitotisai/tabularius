import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseManifest, permissionSummary } from '../src/manifest.ts';

test('approval summaries include requested timeout and memory budgets', () => {
  const parsed = parseManifest({ id: 'org.example.summary', name: 'Summary', version: '1.0.0', api: '^1.0', publisher: 'Example', main: 'main.js', functions: [{ name: 'Summary', min: 0 }], permissions: { timeoutMs: 5000, memoryMb: 128 } });
  assert.ok(parsed.ok);
  assert.match(permissionSummary(parsed.manifest.permissions), /timeout: 5000 ms/);
  assert.match(permissionSummary(parsed.manifest.permissions), /memory: 128 MB requested/);
  assert.match(permissionSummary(parsed.manifest.permissions), /64 MB effective/);
});
