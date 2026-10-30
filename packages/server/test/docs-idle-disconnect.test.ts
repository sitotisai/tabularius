// "Disconnect user from FileMaker Server when idle" comes across from a .fmp12 file. The pages say what it does here; these
// checks keep that true to the code, with a store made inside the test (no sample file).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DataApi, Host } from '../src/index.ts';
import { createStore } from '../../store/src/index.ts';

const root = join(import.meta.dirname, '..', '..', '..');
const page = readFileSync(join(root, 'docs', 'moving-a-solution.md'), 'utf8');
const paragraph = (page.split(/\n\s*\n/).find((p) => p.startsWith('**Idle disconnect.**')) ?? '').replace(/\s+/g, ' ');

test('moving-a-solution.md says what the idle-disconnect option does', () => {
  assert.notEqual(paragraph, '', 'moving-a-solution.md needs a paragraph that starts with the bold sentence "Idle disconnect."');
  for (const word of ['web client', 'Data API', 'Full Access', '15 minutes', 'one day', 'at once']) {
    assert.ok(paragraph.includes(word), `the paragraph should mention ${word}`);
  }
});

test('a set with idle-disconnect off keeps a web-client session, and nothing else, past the idle limit', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-idle-docs-'));
  createStore(join(dir, 'Idle.openhbam.sqlite'));
  const host = new Host(dir, () => {});
  t.after(() => host.close());
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  let now = performance.now();
  t.mock.method(performance, 'now', () => now);
  const api = new DataApi(host);
  const store = host.get('Idle')!;
  const set = { records: { view: true, edit: true, create: true, delete: true }, layouts: 'modifiable' as const, valueLists: 'none' as const, scripts: 'none' as const };
  store.savePrivilegeSet({ name: 'Stay', ...set, extendedPrivileges: ['fmapp', 'fmrest'], idleDisconnect: false });
  const password = ['stay', 'pw', '1234'].join('-');
  store.setPassword('stay1', password, 'Stay');
  store.setPassword('stay2', password, 'Stay');
  const web = api.open(store, 'stay1', 'web');
  const rest = api.open(store, 'stay2', 'rest');
  const admin = api.open(store, 'Admin', 'web');
  now += 30 * 60_000;
  assert.ok(api.alive(web), 'the web-client session stays');
  assert.ok(!api.alive(rest), 'a Data API session times out whatever the set says');
  assert.ok(!api.alive(admin), 'Full Access always times out');
  store.savePrivilegeSet({ name: 'Stay', ...set, extendedPrivileges: ['fmapp', 'fmrest'], idleDisconnect: true });
  assert.ok(!api.alive(web), 'turning the option on ends the session at once');
  store.savePrivilegeSet({ name: 'Stay', ...set, extendedPrivileges: ['fmapp', 'fmrest'], idleDisconnect: false });
  const again = api.open(store, 'stay1', 'web');
  now += 30 * 60_000;
  assert.ok(api.alive(again));
  now += 24 * 60 * 60_000;
  assert.ok(!api.alive(again), 'a kept session still ends after a day idle');
});
