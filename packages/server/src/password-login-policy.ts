import { sharedSource } from '../../store/src/sign-in-failures.ts';
export { localOnlyRefused, passwordLoginSecondFactor, type PasswordLoginPolicyError } from '../../store/src/password-login-policy.ts';

/** Anonymous callers must not distinguish reserved account counters from a full invented-name pool.
 * Keep admission and internal logging intact; only suppress public lockout text and Retry-After.
 */
export function publicPasswordLockout(until: number | undefined, from: string): number | undefined {
  return sharedSource(from) ? undefined : until;
}
