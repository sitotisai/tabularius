import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { createStore, Store } from '../../store/src/index.ts';
import { withFilesystemHook } from '../../store/src/fs-boundary.ts';
import { checkPlan, dryRunPlan } from '../src/agent.ts';

function setup(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-agent-cleanup-test-'));
  createStore(join(dir, 'Shop.openhbam.sqlite'));
  const store = new Store(join(dir, 'Shop.openhbam.sqlite'), 'Shop');
  t.after(() => { store.close(); rmSync(dir, { recursive: true, force: true }); });
  store.applyDesign([{ op: 'createTable', name: 'Orders', fields: [{ name: 'Customer', type: 'text' }] }]);
  const plan = checkPlan(store, { summary: 's', layout: 'Orders', steps: [{ kind: 'find', layout: 'Orders' }] }, undefined);
  return { store, plan };
}

test('an agent dry run removes its temporary folder', async (t) => {
  const { store, plan } = setup(t);
  const before = new Set(readdirSync(tmpdir()));
  const result = await dryRunPlan(store, plan, { account: 'Admin' });
  assert.deepEqual(result.results.map((step) => step.outcome), ['ok']);
  const left = readdirSync(tmpdir()).filter((name) => name.startsWith('tabularius-agent-dry-') && !before.has(name));
  assert.deepEqual(left, []);
});

test('an agent dry-run folder swapped before cleanup is left alone', { skip: process.platform === 'win32' }, async (t) => {
  const { store, plan } = setup(t);
  let swapped: string | undefined;
  t.after(() => {
    if (swapped) {
      rmSync(swapped, { recursive: true, force: true });
      rmSync(swapped + '-aside', { recursive: true, force: true });
    }
  });
  const result = await withFilesystemHook((e) => {
    if (e.operation === 'remove' && e.phase === 'checked' && basename(e.path).startsWith('tabularius-agent-dry-') && !swapped) {
      swapped = e.path;
      renameSync(swapped, swapped + '-aside');
      mkdirSync(swapped);
      writeFileSync(join(swapped, 'sentinel'), 'safe');
    }
  }, () => dryRunPlan(store, plan, { account: 'Admin' }));
  assert.deepEqual(result.results.map((step) => step.outcome), ['ok']);
  assert.ok(swapped);
  assert.ok(existsSync(join(swapped, 'sentinel')));
});

test('an agent script folder swapped before cleanup is left alone', { skip: process.platform === 'win32' }, async (t) => {
  const { store } = setup(t);
  store.applyDesign([{ op: 'createScript', name: 'Finish', text: 'Exit Script [ Text Result: "done" ]' }]);
  const plan = checkPlan(store, { summary: 's', layout: 'Orders', steps: [{ kind: 'script', script: 'Finish' }] }, undefined);
  let swapped: string | undefined;
  t.after(() => {
    if (swapped) {
      rmSync(swapped, { recursive: true, force: true });
      rmSync(swapped + '-aside', { recursive: true, force: true });
    }
  });
  const result = await withFilesystemHook((e) => {
    const name = basename(e.path);
    if (e.operation === 'remove' && e.phase === 'checked' && name.startsWith('tabularius-agent-') && !name.startsWith('tabularius-agent-dry-') && !swapped) {
      swapped = e.path;
      renameSync(swapped, swapped + '-aside');
      mkdirSync(swapped);
      writeFileSync(join(swapped, 'sentinel'), 'safe');
    }
  }, () => dryRunPlan(store, plan, { account: 'Admin' }));
  assert.deepEqual(result.results.map((step) => step.outcome), ['ok']);
  assert.ok(swapped);
  assert.ok(existsSync(join(swapped, 'sentinel')));
});
