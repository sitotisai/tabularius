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

/** What this browser kept of a sign-in, if it is something that can be tried: the file and the session token. */
export function parseSession(saved: string): { db: string; token: string } | undefined {
  let value: unknown;
  try { value = JSON.parse(saved); } catch { return undefined; }
  if (typeof value !== 'object' || value === null) return undefined;
  const { db, token } = value as { db?: unknown; token?: unknown };
  return typeof db === 'string' && db && typeof token === 'string' && token ? { db, token } : undefined;
}

/**
 * What to say when opening the file with a saved session fails, and whether the session is over. Only an answer
 * that says the session ended clears it; everything else keeps it, says what happened (not always "could not
 * reach the server") and has a Retry.
 */
export function sessionFailure(error: unknown): { clear: boolean; retry: boolean; text: string; /** Seconds the server asked to wait before another try (at most a minute). */ wait?: number } {
  if (error instanceof ApiError && (error.code === 952 || error.code === 212 || error.status === 401)) {
    return { clear: true, retry: false, text: 'Your session ended. Sign in again to carry on.' };
  }
  const detail = error instanceof Error ? error.message : String(error);
  const say = (text: string) => ({ clear: false, retry: true, text });
  if (error instanceof ApiError && error.status !== undefined && error.status < 500) {
    if (error.status === 429) {
      const wait = error.retryAfter && Number.isFinite(error.retryAfter) && error.retryAfter > 0 ? Math.min(60, Math.ceil(error.retryAfter)) : undefined;
      return { ...say(`Too many requests. Wait ${wait ? `${wait} seconds` : 'a moment'}, then press Retry. ${detail}`), wait };
    }
    if (error.status === 404 || error.code === 802) return say(`That file could not be opened: ${detail}. It may have been closed or renamed. Press Retry, or sign in again to pick a file.`);
    if (error.status === 403) return say(`This account may not open the file: ${detail}. Sign in again with another account.`);
    return say(`The server did not accept the request: ${detail}. Press Retry, or sign in again.`);
  }
  if (error instanceof ApiError || isNetworkError(error)) return say(`Could not reach the server. Press Retry. ${detail}`);
  return say(`Something went wrong opening the file: ${detail}. Press Retry, or sign in again.`);
}

/** A request that never got an answer (a browser's fetch fails with a TypeError, a timeout or an abort with its own name). */
function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return /fetch|network|load failed|connection|timed? ?out/i.test(error.message);
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

/** A deliberately hidden file list is normal; an outage needs an explanation. */
export function listProblem(error: unknown): string {
  if (error === undefined || error instanceof ApiError && error.code === 3 && error.status === 404) return '';
  return `Could not list files. Check the file name and retry. ${error instanceof Error ? error.message : String(error)}`;
}
