// An external sign-in reaches another hosted file as the person the provider vouched for, mapped there by that file's own
// external accounts: the name of the mapping it used in the first file decides nothing in the second.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';

function pair(t: { after: (fn: () => void) => void }): { a: Store; b: Store } {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-cross-file-identity-'));
  const open = (name: string) => { const path = join(dir, name + '.sqlite'); createStore(path); return new Store(path, name); };
  const a = open('A');
  const b = open('B');
  a.siblings = () => [b];
  b.siblings = () => [a];
  a.resolveFile = (name) => (name === 'B' ? b : undefined);
  b.applyDesign([{ op: 'createTable', name: 'Pay', fields: [{ name: 'Salary' }] }] as never);
  b.create('Pay', { Salary: '123456' });
  t.after(() => { a.close(); b.close(); rmSync(dir, { recursive: true, force: true }); });
  return { a, b };
}

/** A set that sees every record and changes none; returns its name. */
function readOnly(s: Store): string {
  s.applySecurity([{ op: 'createPrivilegeSet', set: { name: 'Viewers', records: { view: true, edit: false, create: false, delete: false }, layouts: 'viewOnly', valueLists: 'viewOnly', scripts: 'viewOnly', extendedPrivileges: [] } }] as never);
  return 'Viewers';
}

test('a mapping named like another file\'s mapping does not reach that file', (t) => {
  const { a, b } = pair(t);
  // B's owner lets the Admins group in. A's owner (Full Access in A) can name a mapping in A anything, including "Admins".
  b.setExternalAccount('Admins', '[Full Access]');
  a.setExternalAccount('Admins', '[Full Access]');
  // Someone the provider vouches for as pat@elsewhere.test with no groups signed in to A through that mapping.
  const p = a.privileges('pat@elsewhere.test', 'Admins', 'pat@elsewhere.test', []);
  assert.equal(p.full, true);
  assert.equal(p.in(b).full, false);
  assert.equal(p.in(b).field('Pay', 'Salary'), 'none');
});

test('the other file maps the person from the same claims: email, domain or group', (t) => {
  const { a, b } = pair(t);
  a.setExternalAccount('Staff', '[Full Access]');
  // Mapped by group in B, when the provider said the person is in it.
  b.setExternalAccount('Staff', '[Full Access]');
  assert.equal(a.privileges('kim@example.test', 'Staff', 'kim@example.test', ['Staff']).in(b).full, true);
  // The same session without the group claim is nobody in B.
  assert.equal(a.privileges('kim@example.test', 'Staff', 'kim@example.test', []).in(b).field('Pay', 'Salary'), 'none');
  // Mapped by domain in B (which comes before a group, as at a sign-in there): B's own set for the domain, not A's Full Access.
  const ro = readOnly(b);
  b.setExternalAccount('@example.test', ro);
  const byDomain = a.privileges('kim@example.test', 'Staff', 'kim@example.test', ['Staff']).in(b);
  assert.equal(byDomain.full, false);
  assert.equal(byDomain.name, ro);
  // A person B deactivated by name stays out, whatever the domain or group would give.
  b.setPassword('kim@example.test', 'kim-b-password', ro);
  b.setAccountActive('kim@example.test', false);
  assert.equal(a.privileges('kim@example.test', 'Staff', 'kim@example.test', ['Staff']).in(b).field('Pay', 'Salary'), 'none');
});

test('a directory sign-in without an email reaches no other file', (t) => {
  const { a, b } = pair(t);
  a.setExternalAccount('Team', '[Full Access]');
  b.setExternalAccount('Team', '[Full Access]');
  // The session is "worker" through Team; no person email and no groups carried: nothing to map in B.
  assert.equal(a.privileges('worker', 'Team').in(b).full, false);
  assert.equal(a.privileges('worker', 'Team', undefined, ['Team']).in(b).full, true);
});

test('a password set in one file is not a guess at the other file\'s lockout', (t) => {
  const { a, b } = pair(t);
  b.setPassword('Owner', 'owner-secret-in-b', '[Full Access]');
  // Each set in A is checked against B's password (so a matching one proves the account) but counts nowhere.
  for (let i = 0; i < 25; i++) a.setPassword('Owner', `guess-number-${i}`, '[Full Access]');
  assert.equal(b.lockedOut('Owner', ''), undefined);
  assert.equal(b.verify('Owner', 'owner-secret-in-b', ''), true);
  assert.equal(a.privileges('Owner').in(b).full, false);
  // A sign-in to A with the password B has is what proves it.
  a.setPassword('Owner', 'owner-secret-in-b', '[Full Access]');
  assert.equal(a.privileges('Owner').in(b).full, true);
});
