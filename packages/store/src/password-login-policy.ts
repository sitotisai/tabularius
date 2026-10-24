import type { Store } from './store.ts';

export interface PasswordLoginPolicyError {
  code: number;
  message: string;
}

/**
 * The "sign in only from the server itself" rule, for a password that has already been verified: true when the account is
 * local-only and `from` is not this computer. Every password surface asks this one question and then refuses with the
 * text a wrong password gets, so a caller holding the password cannot tell a local-only account from a wrong one; the
 * real reason is in the file's sign-in log. `audit` is false for a check that only decides what to show.
 */
export function localOnlyRefused(store: Store, account: string, from: string, audit = true): boolean {
  if (store.signInLocationAllowed(account, from)) return false;
  if (audit) store.auditSignIn(account, from, false);
  return true;
}

/** The second-factor checks shared by password-based sign-in surfaces. */
export function passwordLoginSecondFactor(store: Store, account: string, otp: string | undefined, from: string): PasswordLoginPolicyError | undefined {
  const secondFactorRequired = (store.requireTotpForFullAccess() && store.privileges(account).full) || store.accountRequires2fa(account);
  if (store.hasTotp(account)) {
    if (!otp) return { code: 1211, message: 'A one-time code from your authenticator app is required' };
    if (!store.verifyTotp(account, otp, from)) {
      store.auditSignIn(account, from, false, 'two-factor');
      return { code: 1211, message: 'That one-time code is not valid; check your authenticator app' };
    }
  } else if (secondFactorRequired && store.hasPasskey(account)) {
    return { code: 1212, message: 'This account signs in with a passkey as its second factor' };
  }

  if (store.requireTotpForFullAccess() && !store.hasSecondFactor(account) && store.privileges(account).full) {
    store.auditSignIn(account, from, false, 'two-factor');
    return { code: 9, message: 'This file requires two-factor authentication for full-access accounts; ask an administrator to set up a second factor for this account' };
  }
  if (store.accountRequires2fa(account) && !store.hasSecondFactor(account)) {
    store.auditSignIn(account, from, false, 'two-factor');
    return { code: 9, message: 'This account requires two-factor authentication; ask an administrator to set up a second factor for it' };
  }
  return undefined;
}

/**
 * Whether a verified name and password alone may sign in from `from`, for a step that has nobody to ask for a one-time code
 * (a script's Re-Login): true when it must be refused. That is a local-only account away from this computer, an account that is
 * switched off or owes a password change, and any account that needs or has a second factor, since a password cannot answer one.
 */
export function passwordAloneRefused(store: Store, account: string, from: string): boolean {
  try { store.requireActiveAccount(account); } catch { return true; }
  return localOnlyRefused(store, account, from)
    || store.mustChangePassword(account)
    || passwordLoginSecondFactor(store, account, undefined, from) !== undefined;
}
