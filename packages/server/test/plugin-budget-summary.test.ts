import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Admin } from '../src/admin.ts';

test('console plug-in response exposes requested resource budgets and their summary', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-plugin-budgets-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const plugin = join(dir, 'plugins', 'summary');
  mkdirSync(plugin, { recursive: true });
  writeFileSync(join(plugin, 'plugin.json'), JSON.stringify({ id: 'org.example.summary', name: 'Summary', version: '1.0.0', api: '^1.0', publisher: 'Example', main: 'main.js', functions: [{ name: 'Summary', min: 0 }], permissions: { timeoutMs: 3000, memoryMb: 128 } }));
  writeFileSync(join(plugin, 'main.js'), 'const functions = { Summary: () => 1 };');
  // Exercise the page response with a synthetic host; no listener, file import or child process is needed.
  const page = (Admin.prototype as unknown as { plugins(this: unknown): { plugins: { permissions: { timeoutMs: number; memoryMb: number }; permissionSummary: string }[] } }).plugins;
  const result = page.call({ host: { dir, names: () => [] } }).plugins[0];
  assert.equal(result.permissions.timeoutMs, 3000);
  assert.equal(result.permissions.memoryMb, 128);
  assert.match(result.permissionSummary, /timeout: 3000 ms/);
  assert.match(result.permissionSummary, /memory: 128 MB requested \(64 MB effective\)/);
});
