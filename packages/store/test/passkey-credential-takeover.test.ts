// A credential id is chosen by whoever registers it, so registering one that another account already holds must
// refuse rather than move that passkey to the registering account.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';
import { makeAuthenticator, forgeRegistration, forgeAssertion } from './forge-webauthn.ts';

const RP = 'host.example', ORIGIN = 'https://host.example';

test('registering another account\'s credential id is refused and leaves that passkey alone', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-pk-takeover-'));
  createStore(join(dir, 'New.sqlite'));
  const store = new Store(join(dir, 'New.sqlite'));
  try {
    store.setPassword('Victim', 'victim-password-1', '[Full Access]');
    store.setPassword('Attacker', 'attacker-password-1', '[Full Access]');
    const victimKey = makeAuthenticator(RP, ORIGIN);
    const c1 = store.issueWebauthnChallenge('register', 'Victim');
    const { id } = store.registerPasskey('Victim', forgeRegistration(victimKey, c1), { rpId: RP, origin: ORIGIN, challenge: c1 });

    // The attacker's own authenticator, but the victim's credential id (read from the sign-in allow-list).
    const attackerKey = { ...makeAuthenticator(RP, ORIGIN), credId: victimKey.credId };
    const c2 = store.issueWebauthnChallenge('register', 'Attacker');
    assert.throws(() => store.registerPasskey('Attacker', forgeRegistration(attackerKey, c2), { rpId: RP, origin: ORIGIN, challenge: c2 }), /already registered/);

    assert.deepEqual(store.passkeyIds('Victim'), [id]);
    assert.deepEqual(store.passkeyIds('Attacker'), []);
    // The victim's own key still signs in as the victim; the attacker's key does not sign in at all.
    const c3 = store.issueWebauthnChallenge('auth');
    assert.equal(store.verifyPasskeyAssertion(forgeAssertion(victimKey, c3, 1), { rpId: RP, origin: ORIGIN, challenge: c3 }), 'Victim');
    const c4 = store.issueWebauthnChallenge('auth');
    assert.throws(() => store.verifyPasskeyAssertion(forgeAssertion(attackerKey, c4, 1), { rpId: RP, origin: ORIGIN, challenge: c4 }), /passkey was not accepted/);
  } finally { store.close(); rmSync(dir, { recursive: true }); }
});
