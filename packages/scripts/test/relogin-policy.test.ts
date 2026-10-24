// Re-Login signs a run in as another account with a password alone, so it must not be a way around what a normal
// sign-in asks beyond the password: a second factor (which a step cannot answer), the local-only rule, an
// account switched off, or a password that is owed a change.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { totpCode } from '@tabularius/store';
import { stepHarness } from './step-behaviour-helpers.ts';

const h = stepHarness('relogin-policy');
after(h.close);
const password = ['re', 'login', 'pw'].join('-');
h.store.savePrivilegeSet({ name: 'Readers', records: { view: true, edit: false, create: false, delete: false }, layouts: 'viewOnly', valueLists: 'viewOnly', scripts: 'viewOnly', extendedPrivileges: [] });
h.store.setPassword('Admin', password, '[Full Access]');
for (const name of ['Plain', 'Needs2fa', 'Has2fa', 'Local', 'Off', 'Owes']) h.store.setPassword(name, password, 'Readers');
h.store.setAccountRequire2fa('Needs2fa', true);
h.store.setAccountRequire2fa('Has2fa', true);
const { secret } = h.store.enrollTotp('Has2fa');
h.store.confirmTotp('Has2fa', totpCode(secret));
h.store.setAccountLocalOnly('Local', true);
h.store.setAccountActive('Off', false);
h.store.setPassword('Owes', password, undefined, { mustChange: true });

const as = async (name: string, extra: { clientAddress?: string } = {}) => (await h.run(`Set Error Capture [ On ]
Re-Login [ Account Name: "${name}" ; Password: "${password}" ; With dialog: Off ]
Exit Script [ Text Result: Get ( LastError ) & " " & Get ( AccountName ) ]`, { account: 'Admin', privileges: h.store.privileges('Admin'), ...extra })).result;

test('Re-Login signs in as an account with nothing asked beyond the password', async () => {
  assert.equal(await as('Plain'), '0 Plain');
});

test('Re-Login refuses an account that needs a second factor, whether or not it has one', async () => {
  assert.equal(await as('Needs2fa'), '212 Admin');
  assert.equal(await as('Has2fa'), '212 Admin');
});

test('Re-Login refuses a local-only account unless the run came from the server itself', async () => {
  assert.equal(await as('Local'), '212 Admin');
  assert.equal(await as('Local', { clientAddress: '203.0.113.9' }), '212 Admin');
  assert.equal(await as('Local', { clientAddress: '127.0.0.1' }), '0 Local');
});

test('Re-Login refuses an account that is switched off or owes a password change', async () => {
  assert.equal(await as('Off'), '212 Admin');
  assert.equal(await as('Owes'), '212 Admin');
});
