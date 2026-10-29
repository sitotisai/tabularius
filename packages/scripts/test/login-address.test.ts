import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LOCKOUT } from '@tabularius/store';
import { stepHarness } from './step-behaviour-helpers.ts';

for (const step of ['Re-Login', 'Change Password']) test(`${step} attributes lockout to the run client address`, async (t) => {
  const h = stepHarness('login-address');
  t.after(h.close);
  const password = ['correct', 'password'].join('-');
  h.store.setPassword('User', password, '[Full Access]');
  const run = (value: string, clientAddress: string) => h.run(`Set Error Capture [ On ]
${step === 'Re-Login' ? `Re-Login [ Account Name: "User" ; Password: "${value}" ; With dialog: Off ]` : `Change Password [ Old Password: "${value}" ; New Password: "${password}-changed" ; With dialog: Off ]`}
Exit Script [ Text Result: Get ( LastError ) ]`, { account: 'User', privileges: h.store.privileges('User'), clientAddress });
  for (let i = 0; i < LOCKOUT.attempts; i++) await run('wrong', '203.0.113.1');
  assert.ok(h.store.lockedOut('User', '203.0.113.1'), 'the originating address owns the failures');
  assert.equal((await run(password, '203.0.113.2')).result, '0', 'another address can sign in');
  assert.notEqual((await run(password, '203.0.113.1')).result, '0', 'the failed address stays locked');
});
