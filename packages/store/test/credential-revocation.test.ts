// Recovery codes and passkeys are ways in that do not depend on the password, so an administrator who resets a
// password (because it may be compromised) must not leave them behind. A person changing their own password also
// ends their recovery codes, but keeps the passkeys they registered themselves. Deactivating and reactivating an
// account ends both too: it is how an administrator closes off an account that may be compromised, and switching it
// back on must not bring a credential back that the administrator believed was gone.
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

test('deactivating an account removes its recovery codes and passkeys, so reactivating it does not bring them back', () => {
  withStore((store) => {
    const [code] = enrol(store, 'Victim');
    enrol(store, 'Bystander');
    store.setAccountActive('Victim', false);
    assert.equal(store.hasPasskey('Victim'), false);
    assert.equal(store.recoveryCodesRemaining('Victim'), 0);
    store.setAccountActive('Victim', true);
    assert.equal(store.hasPasskey('Victim'), false);
    assert.equal(store.useRecoveryCode('Victim', code), false, 'the old code does not sign in after reactivation');
    assert.equal(store.hasPasskey('Bystander'), true, 'only that account');
    assert.equal(store.recoveryCodesRemaining('Bystander'), 2);
    // The person enrols again after signing back in.
    assert.equal(enrol(store, 'Victim').length, 2);
  });
});

test('a registration challenge issued before a deactivation cannot register a passkey after reactivation', () => {
  withStore((store) => {
    const challenge = store.issueWebauthnChallenge('register', 'Victim');
    store.setAccountActive('Victim', false);
    store.setAccountActive('Victim', true);
    assert.throws(() => store.registerPasskey('Victim', forgeRegistration(makeAuthenticator(RP, ORIGIN), challenge), { rpId: RP, origin: ORIGIN, challenge }), /expired/);
    assert.equal(store.hasPasskey('Victim'), false);
  });
});

test('deactivating an account that is already inactive still removes what it holds (deactivated before this was done)', () => {
  withStore((store) => {
    const [code] = enrol(store, 'Victim');
    // An account left inactive by a version that kept its credentials (switched off underneath the store, as that version did).
    (store as unknown as { sql: { prepare(q: string): { run(...a: string[]): unknown } } }).sql.prepare('UPDATE _fm_accounts SET inactive = 1 WHERE name = ?').run('Victim');
    assert.equal(store.accountInactive('Victim'), true);
    assert.equal(store.hasPasskey('Victim'), true);
    store.setAccountActive('Victim', false);
    assert.equal(store.hasPasskey('Victim'), false);
    assert.equal(store.recoveryCodesRemaining('Victim'), 0);
    assert.equal(store.useRecoveryCode('Victim', code), false);
  });
});

test('the disabled event says how many credentials deactivation removed', () => {
  withStore((store) => {
    enrol(store, 'Victim');
    store.setAccountActive('Victim', false);
    const event = store.auditLog({ security: true, limit: 200 }).find((e) => e.kind === 'account-disabled' && JSON.stringify(e).includes('Victim'));
    assert.deepEqual({ passkeys: (event?.changes as Record<string, unknown>)?.revokedPasskeys, codes: (event?.changes as Record<string, unknown>)?.revokedRecoveryCodes }, { passkeys: 1, codes: 2 });
    store.setAccountActive('Victim', true);
    enrol(store, 'Victim');
    store.setAccountActive('Victim', false);
    store.setAccountActive('Victim', true);
    assert.equal(store.hasPasskey('Victim'), false);
    enrol(store, 'Victim');
    store.setAccountActive('Victim', true);
    assert.equal(store.hasPasskey('Victim'), true, 'switching on an account that is already on is not a reset');
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

test('a registration challenge issued before a password change cannot register a passkey after it', () => {
  for (const change of [
    (store: Store) => store.setPassword('Victim', 'a-new-password-2'),
    (store: Store) => store.changePassword('Victim', pw('Victim'), 'a-new-password-2'),
  ]) {
    withStore((store) => {
      const challenge = store.issueWebauthnChallenge('register', 'Victim');
      change(store);
      assert.throws(() => store.registerPasskey('Victim', forgeRegistration(makeAuthenticator(RP, ORIGIN), challenge), { rpId: RP, origin: ORIGIN, challenge }), /expired/);
      assert.equal(store.hasPasskey('Victim'), false);
    });
  }
});

test('setting the same password again keeps the credentials; a different one revokes them', () => {
  withStore((store) => {
    const [code] = enrol(store, 'Victim');
    store.setPassword('Victim', pw('Victim'));
    assert.equal(store.hasPasskey('Victim'), true);
    assert.equal(store.recoveryCodesRemaining('Victim'), 2);
    assert.equal(store.verify('Victim', pw('Victim'), ''), true);
    store.setPassword('Victim', 'a-new-password-2');
    assert.equal(store.hasPasskey('Victim'), false);
    assert.equal(store.useRecoveryCode('Victim', code), false);
  });
});

test('the password-changed event says how many credentials the change removed', () => {
  withStore((store) => {
    enrol(store, 'Victim');
    store.setPassword('Victim', 'a-new-password-2');
    const event = store.auditLog({ security: true, limit: 200 }).find((e) => e.kind === 'password-changed' && JSON.stringify(e).includes('Victim'));
    assert.deepEqual({ passkeys: (event?.changes as Record<string, unknown>)?.revokedPasskeys, codes: (event?.changes as Record<string, unknown>)?.revokedRecoveryCodes }, { passkeys: 1, codes: 2 });
  });
});

test('an administrator setting their own password in Manage Security keeps their own passkeys, not anyone else\'s', () => {
  withStore((store) => {
    enrol(store, 'Admin');
    enrol(store, 'Victim');
    store.applySecurity([{ op: 'setAccount', name: 'Admin', password: 'a-new-password-2' }, { op: 'setAccount', name: 'Victim', password: 'a-new-password-3' }], 'Admin');
    assert.equal(store.hasPasskey('Admin'), true);
    assert.equal(store.recoveryCodesRemaining('Admin'), 0);
    assert.equal(store.hasPasskey('Victim'), false);
  });
});

test('the disabled event counts only the recovery codes that could still have been used', () => {
  withStore((store) => {
    const [code] = enrol(store, 'Victim');
    assert.equal(store.useRecoveryCode('Victim', code), true);
    store.setAccountActive('Victim', false);
    const event = store.auditLog({ security: true, limit: 200 }).find((e) => e.kind === 'account-disabled' && JSON.stringify(e).includes('Victim'));
    assert.equal((event?.changes as Record<string, unknown>)?.revokedRecoveryCodes, 1, 'one of the two was already spent');
    assert.equal(store.recoveryCodesRemaining('Victim'), 0);
  });
});
