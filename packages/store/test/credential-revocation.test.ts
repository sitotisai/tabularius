// Recovery codes and passkeys are ways in that do not depend on the password, so an administrator who resets a
// password (because it may be compromised) must not leave them behind. A person changing their own password also
// ends their recovery codes, but keeps the passkeys they registered themselves. Deactivating and reactivating an
// account (a leave of absence, or a CSV sync toggling it) deliberately keeps both.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';
import { makeAuthenticator, forgeRegistration } from './forge-webauthn.ts';

const RP = 'host.example', ORIGIN = 'https://host.example';
const pw = (name: string) => `${name.toLowerCase()}-password-1`;

function withStore(run: (store: Store) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-credential-revocation-'));
  createStore(join(dir, 'New.sqlite'));
  const store = new Store(join(dir, 'New.sqlite'));
  try {
    for (const name of ['Admin', 'Victim', 'Bystander']) store.setPassword(name, pw(name), '[Full Access]');
    run(store);
  } finally { store.close(); rmSync(dir, { recursive: true }); }
}

function enrol(store: Store, account: string): string[] {
  const challenge = store.issueWebauthnChallenge('register', account);
  store.registerPasskey(account, forgeRegistration(makeAuthenticator(RP, ORIGIN), challenge), { rpId: RP, origin: ORIGIN, challenge });
  return store.generateRecoveryCodes(account, 2);
}

test('an administrator password reset removes recovery codes and passkeys, and only for that account', () => {
  withStore((store) => {
    const [code] = enrol(store, 'Victim');
    enrol(store, 'Bystander');
    store.setPassword('Victim', 'a-new-password-2', undefined, { mustChange: true });
    assert.equal(store.hasPasskey('Victim'), false);
    assert.equal(store.recoveryCodesRemaining('Victim'), 0);
    assert.equal(store.useRecoveryCode('Victim', code), false);
    assert.equal(store.hasPasskey('Bystander'), true);
    assert.equal(store.recoveryCodesRemaining('Bystander'), 2);
  });
});

test('deactivating and reactivating an account keeps its passkeys and recovery codes, as a leave of absence should', () => {
  withStore((store) => {
    const [code] = enrol(store, 'Victim');
    store.setAccountActive('Victim', false);
    assert.equal(store.useRecoveryCode('Victim', code), false, 'refused while inactive');
    store.setAccountActive('Victim', true);
    assert.equal(store.hasPasskey('Victim'), true);
    assert.equal(store.recoveryCodesRemaining('Victim'), 2);
  });
});

test('changing your own password ends recovery codes but keeps the passkeys you registered', () => {
  withStore((store) => {
    const [code] = enrol(store, 'Victim');
    store.changePassword('Victim', pw('Victim'), 'a-new-password-2');
    assert.equal(store.recoveryCodesRemaining('Victim'), 0);
    assert.equal(store.useRecoveryCode('Victim', code), false);
    assert.equal(store.hasPasskey('Victim'), true);
  });
});
