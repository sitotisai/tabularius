// SQL values on the line between the store and sql-child.ts: JSON, with the values it has no form for (a blob, a number that is
// not finite, a bigint) written as a one-key object.

/** What a query can return: node:sqlite gives a blob as a Uint8Array. */
export type SqlValue = string | number | bigint | null | Uint8Array;

export type WireValue = string | number | null | { $blob: string } | { $number: 'Infinity' | '-Infinity' | 'NaN' } | { $bigint: string };

export function encodeValue(v: unknown): WireValue {
  if (v instanceof Uint8Array) return { $blob: Buffer.from(v).toString('base64') };
  if (typeof v === 'bigint') return { $bigint: String(v) };
  if (typeof v === 'number' && !Number.isFinite(v)) return { $number: Number.isNaN(v) ? 'NaN' : v > 0 ? 'Infinity' : '-Infinity' };
  return v as WireValue;
}

export function decodeValue(v: unknown): SqlValue {
  if (v !== null && typeof v === 'object') {
    const o = v as Record<string, string>;
    if (typeof o.$blob === 'string') return new Uint8Array(Buffer.from(o.$blob, 'base64'));
    if (typeof o.$bigint === 'string') return BigInt(o.$bigint);
    if (typeof o.$number === 'string') return Number(o.$number);
  }
  return v as SqlValue;
}
