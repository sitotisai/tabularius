import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';

test('an account\'s credential stamp moves with its password and status, not with other security changes', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-credential-stamp-'));
  const path = join(dir, 'Synthetic.openhbam.sqlite');
  createStore(path);
  const store = new Store(path);
  t.after(() => { store.close(); rmSync(dir, { recursive: true, force: true }); });
  store.setPassword('Alice', 'first-password', '[Full Access]');
  store.setPassword('Bob', 'bob-password', '[Full Access]');
  const alice = store.credentialStamp('alice');
  assert.ok(alice, 'the name is matched without regard to case');
  assert.equal(store.credentialStamp('nobody'), undefined);
  const token = store.securityToken();
  // Enough wrong passwords for Bob from one place lock that place out, which is a security change of the file.
  for (let i = 0; i < 20 && store.securityToken() === token; i++) assert.equal(store.verify('Bob', 'guess', '203.0.113.7'), false);
  assert.notEqual(store.securityToken(), token, 'a lockout moves the security token');
  assert.equal(store.credentialStamp('alice'), alice, 'but not alice\'s stamp');
  store.setPassword('Bob', 'another-password', '[Full Access]');
  assert.equal(store.credentialStamp('alice'), alice, 'nor does a change to bob');
  store.setPassword('Alice', 'second-password', '[Full Access]');
  const changed = store.credentialStamp('alice');
  assert.notEqual(changed, alice, 'a new password does');
  store.setAccountActive('Alice', false);
  assert.notEqual(store.credentialStamp('alice'), changed, 'switching her off does');
  store.setAccountActive('Alice', true);
  // What else decides whether Alice may sign in, and as what, moves it too.
  const stamps = [store.credentialStamp('alice')];
  const next = (change: () => void, what: string) => {
    change();
    const now = store.credentialStamp('alice');
    assert.ok(!stamps.includes(now), `${what} must move the stamp`);
    stamps.push(now);
  };
  next(() => store.setAccountLocalOnly('Alice', true), 'local-only');
  next(() => store.setAccountRequire2fa('Alice', true), 'a second-factor requirement');
  next(() => store.setMustChangePassword('Alice', true), 'a forced password change');
  store.savePrivilegeSet({ name: 'Reader', records: { view: true, edit: false, create: false, delete: false }, layouts: 'viewOnly', valueLists: 'none', scripts: 'none', extendedPrivileges: ['fmrest'] });
  next(() => store.setAccountPrivilegeSet('Alice', 'Reader'), 'a different privilege set');
  assert.ok(stamps.every((stamp) => stamp && !stamp.includes('password')), 'a stamp is a hash, not a copy of the stored password hash');
  assert.equal(store.credentialStamp('alice')?.length, 64);
});
