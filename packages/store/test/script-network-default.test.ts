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

test('turning it on in a file with no saved setting saves the choice', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'script-network-saved-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'Plain.openhbam.sqlite');
  createStore(path);
  const store = new Store(path, 'Plain');
  store.setScriptNetwork(true, { account: 'test' });
  assert.equal(store.sql.prepare("SELECT json FROM _fm_meta WHERE key = 'scriptNetwork'").get()?.json, 'true');
  assert.equal(store.securityEvents({ kind: 'script-network-on' }).length, 1);
  store.close();
});

// A file converted before the converter saved the setting has a source record from a conversion and no saved switch.
// Opening it must not leave its scripts on the network: it is treated like a first open of a converted file.
function legacyConverted(path: string): void {
  createStore(path);
  const raw = new Store(path, 'Legacy');
  raw.sql.prepare("UPDATE _fm_meta SET json = ? WHERE key = 'source'")
    .run(JSON.stringify({ file: 'Legacy.fmp12', importedAt: '2026-10-01T00:00:00.000Z', header: {} }));
  raw.sql.prepare("DELETE FROM _fm_meta WHERE key = 'scriptNetwork'").run();
  raw.close();
}

test('a converted file with no saved setting is switched off when opened, and the change is logged', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'script-network-legacy-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'Legacy.openhbam.sqlite');
  legacyConverted(path);
  const store = new Store(path, 'Legacy');
  assert.equal(store.scriptNetwork, false);
  assert.equal(store.securityEvents({ kind: 'script-network-off' }).length, 1);
  store.close();
  const again = new Store(path, 'Legacy');
  assert.equal(again.scriptNetwork, false);
  assert.equal(again.securityEvents({ kind: 'script-network-off' }).length, 1, 'the migration runs once');
  again.setScriptNetwork(true, { account: 'test' });
  again.close();
  const kept = new Store(path, 'Legacy');
  assert.equal(kept.scriptNetwork, true, 'an administrator turning it on is kept across opens');
  kept.close();
});

test('a converted file whose administrator saved a setting keeps it', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'script-network-legacy-kept-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'Legacy.openhbam.sqlite');
  legacyConverted(path);
  const raw = new Store(path, 'Legacy');
  raw.sql.prepare("INSERT OR REPLACE INTO _fm_meta VALUES ('scriptNetwork', 'true')").run();
  raw.close();
  const store = new Store(path, 'Legacy');
  assert.equal(store.scriptNetwork, true);
  store.close();
});
