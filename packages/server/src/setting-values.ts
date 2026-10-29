import { secret, wholeNumber } from '../../store/src/settings.ts';

/** Idle lifetime shared by both upload paths; zero retains uploads. */
export function uploadIdleMs(env: NodeJS.ProcessEnv = process.env): number {
  return (wholeNumber('TABULARIUS_UPLOAD_IDLE_HOURS', { min: 0, max: 87600, env }) ?? 24) * 3_600_000;
}

export function requestQueueLimit(env: NodeJS.ProcessEnv = process.env): number {
  return wholeNumber('TABULARIUS_REQUEST_QUEUE', { min: 0, max: 100000, env }) ?? 64;
}

export function containerLinkTtlMs(env: NodeJS.ProcessEnv = process.env): number {
  return (wholeNumber('TABULARIUS_CONTAINER_TTL', { min: 1, max: 3600, env }) ?? 3600) * 1000;
}

export const DEFAULT_MAX_UPLOAD = 10 * 1024 * 1024 * 1024;

export function maxUpload(env: NodeJS.ProcessEnv = process.env): number {
  return wholeNumber('TABULARIUS_MAX_UPLOAD', { min: 0, env }) ?? DEFAULT_MAX_UPLOAD;
}

export const DEFAULT_PGWIRE_MAX_PARAM_BYTES = 64 * 1024 * 1024;

export function pgwireMaxParamBytes(env: NodeJS.ProcessEnv = process.env): number {
  return wholeNumber('TABULARIUS_PGWIRE_MAX_PARAM_BYTES', { min: 1, env }) ?? DEFAULT_PGWIRE_MAX_PARAM_BYTES;
}

/** Parse settings as decimal whole numbers; Number alone also accepts blanks, hex and exponents. */
export function positiveWholeNumber(name: string, value: string | undefined, fallback: number,
  { min = 1, max = Number.MAX_SAFE_INTEGER }: { min?: number; max?: number } = {},
): number {
  if (value === undefined) return fallback;
  const n = Number(value);
  if (!/^[0-9]+$/.test(value) || !Number.isSafeInteger(n) || n < min || n > max) {
    const form = min === 1 ? 'a positive whole number' : `a whole number of ${min} or more`;
    throw new Error(`${name} must be ${form} using decimal digits only (maximum ${max})`);
  }
  return n;
}

/** Unset means no encryption; a blank key must never silently disable it (the store's `secret` refuses it). Preserves passphrase bytes. */
export function encryptionKeyFromEnv(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return secret('TABULARIUS_ENCRYPTION_KEY', env);
}
