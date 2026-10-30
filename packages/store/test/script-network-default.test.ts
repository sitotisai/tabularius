// Script network access is on for a file with no saved setting, and starts off for a file converted from a .fmp12
// (the converter saves it off), until an administrator turns it on.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, importFmp12, Store } from '../src/index.ts';

const fixture = join(import.meta.dirname, '..', '..', '..', 'fixtures', 'fmp12', 'Charts.fmp12');
const skip = existsSync(fixture) ? false : 'fixtures missing: run npm run fixtures';

test('a file with no saved setting has script network access on, and the switch is kept', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'script-network-default-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'Plain.openhbam.sqlite');
  createStore(path);
  const store = new Store(path, 'Plain');
  assert.equal(store.scriptNetwork, true);
  store.setScriptNetwork(false, { account: 'test' });
  assert.equal(store.scriptNetwork, false);
  store.close();
  const reopened = new Store(path, 'Plain');
  assert.equal(reopened.scriptNetwork, false);
  reopened.setScriptNetwork(true, { account: 'test' });
  assert.equal(reopened.scriptNetwork, true);
  reopened.close();
});

test('a file converted from a .fmp12 starts with script network access off', { skip }, (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'script-network-converted-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'Charts.openhbam.sqlite');
  importFmp12(fixture, path);
  const store = new Store(path, 'Charts');
  assert.equal(store.scriptNetwork, false);
  store.close();
});
