// What the alternative client's sign-in decides, apart from the page it draws (so it can be tested without a browser):
// how the file is named, which file the address or this browser's memory picks, and what a refusal asks for next.
// The classic client (/app/) does the same in showLogin; a second factor by passkey and a password that must change
// are not done here (the sign-in says to use /app/ for those).

import { ApiError } from '../src/api.ts';
import { signInError212 } from '../src/sign-in-error.ts';

/** The server's "sign in with your passkey" answer (store/src/error-codes.ts: PASSKEY_SECOND_FACTOR_REQUIRED). */
const PASSKEY_SECOND_FACTOR_REQUIRED = 9000;

export type FileField =
  /** The server listed files: pick one (a list of one is shown as its name). */
  | { kind: 'choose'; files: string[] }
  /** The server does not list its files to a caller who has not signed in (the default), or cannot be reached: type the name. */
  | { kind: 'typed' }
  /** The server lists its files publicly and has none. */
  | { kind: 'none' };

/** How the file is named at sign-in, from what listing the files returned (the files, or the error that came instead). */
export function fileField(files: string[], listError: unknown): FileField {
  if (files.length) return { kind: 'choose', files };
  return listError === undefined ? { kind: 'none' } : { kind: 'typed' };
}

/**
 * The file to start on: the one the address names (?db=Name, as the admin console links to a file it has just hosted),
 * else the one this browser used last, if it can be picked (listed) or typed (nothing listed).
 */
export function wantedFile(search: string, files: string[], last: string | null | undefined): string | undefined {
  const named = new URLSearchParams(search).get('db')?.trim();
  if (named) return named;
  if (last && (!files.length || files.includes(last))) return last;
  return undefined;
}

/** What to show after a refused sign-in, and whether the form should now ask for the authenticator code. */
export function signInProblem(err: unknown, code: string): { ask?: 'code'; text: string } {
  if (err instanceof ApiError && err.code === 1211) {
    return { ask: 'code', text: code.trim() ? 'That code is not valid; check your authenticator app.' : 'Enter the code from your authenticator app.' };
  }
  if (err instanceof ApiError && err.code === PASSKEY_SECOND_FACTOR_REQUIRED) {
    return { text: 'This account signs in with a passkey as its second factor, which this client cannot do yet: sign in with the classic client at /app/.' };
  }
  if (err instanceof ApiError && err.code === 212) return { text: signInError212(err.message) };
  return { text: err instanceof Error ? err.message : String(err) };
}

/** An account that owes a password change cannot be let in here: the classic client has the screen for it. */
export function mustChangeText(): string {
  return 'This account must change its password before it can sign in. Change it in the classic client at /app/, then come back here.';
}
