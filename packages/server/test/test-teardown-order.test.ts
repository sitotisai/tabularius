import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { allowlistErrors, collectTeardownOrder } from '../../../scripts/check-test-teardown-order.ts';

const found = (source: string) => collectTeardownOrder(join(import.meta.dirname, '../../..'), new Map([['packages/server/test/probe.test.ts', source]]))
  .filter((f) => f.file === 'packages/server/test/probe.test.ts');

test('a hook that removes files before the hook that closes the server is reported; closing first is not', () => {
  const cases = [
    [`test('a', (t) => { t.after(() => rmSync(dir)); t.after(() => server.close()); });`, true],
    [`test('a', (t) => { t.after(() => server.close()); t.after(() => rmSync(dir)); });`, false],
    [`test('a', (t) => { t.after(async () => { await host.close(); rmSync(dir); }); });`, false],
    [`test('a', (t) => { t.after(async () => { rmSync(dir); await host.close(); }); });`, true],
    [`test('a', (t) => { t.after(() => { host.close(); rmSync(dir); }); t.after(() => client.close()); });`, true],
    [`test('a', (t) => { t.after(() => rmSync(dir)); t.after(() => { restore(); }); });`, false],
    [`after(() => rmSync(dir)); after(() => server.close());`, true],
    [`test('a', (t) => { t.after(() => rmSync(one)); }); test('b', (t) => { t.after(() => server.close()); });`, false],
  ] as const;
  for (const [source, expected] of cases) assert.equal(found(source).length > 0, expected, source);
});

test('a helper that adds the removal counts where the test calls it', () => {
  const helper = `function tmp(t) { const dir = make(); t.after(() => rmSync(dir)); return dir; }`;
  assert.equal(found(`${helper} test('a', (t) => { const dir = tmp(t); t.after(() => server.close()); });`).length, 1);
  assert.equal(found(`${helper} test('a', (t) => { t.after(() => server.close()); const dir = tmp(t); });`).length, 0);
  assert.equal(found(`${helper} test('a', (t) => { const dir = tmp(t); });`).length, 0);
});

test('reports missing, stale, blank and duplicate allow-list entries', () => {
  const f = { file: 'packages/server/test/probe.test.ts', test: 'a', line: 1, why: 'a hook that removes files is added before a hook that closes something, so the files go first' };
  const entry = { file: f.file, test: f.test, reason: 'reviewed' };
  assert.match(allowlistErrors([f], [])[0], /register the close hook first/);
  assert.match(allowlistErrors([], [entry])[0], /stale allow-list entry/);
  assert.match(allowlistErrors([f], [{ ...entry, reason: ' ' }])[0], /no reason/);
  assert.match(allowlistErrors([f], [entry, entry])[0], /listed twice/);
});

test('real test files remove their folders after they close what uses them, apart from a shrinking allow-list of at most 127 entries', () => {
  const root = join(import.meta.dirname, '../../..');
  const list = JSON.parse(readFileSync(join(root, 'scripts/test-teardown-allowlist.json'), 'utf8')) as { file: string; test: string; reason: string }[];
  assert.ok(list.length <= 127);
  assert.ok(list.every((entry) => entry.reason.length > 20));
  assert.deepEqual(allowlistErrors(collectTeardownOrder(root), list), []);
});
