import { ApiError } from '../src/api.ts';

/** A successful write must never be retried merely because its follow-up read failed. */
export async function saveAndRefresh(write: () => Promise<void>, read: () => Promise<void>): Promise<{ saved: boolean; error?: unknown }> {
  try { await write(); } catch (error) { return { saved: false, error }; }
  try { await read(); } catch (error) { return { saved: true, error }; }
  return { saved: true };
}

/** Object identity also distinguishes reopening the same record and switching tables. */
export function sameSheet(collection: unknown, record: unknown, currentCollection: unknown, currentRecord: unknown): boolean {
  return collection === currentCollection && record === currentRecord;
}

/** An invalid shared link opens the default collection instead of throwing during startup. */
export function decodeRoute(hash: string): string[] {
  try { return hash.split('/').map((s) => decodeURIComponent(s)); } catch { return []; }
}

/**
 * Whether a failed write may still have reached the server: no answer came (a network drop, a timeout) or a
 * gateway or the server itself failed. A refusal (4xx) says the file was not changed.
 */
export function outcomeUnknown(error: unknown): boolean {
  return !(error instanceof ApiError) || error.status === undefined || error.status >= 500;
}

/** One date or time word in a form that does not depend on padding, 12 or 24 hours, or ISO against US. Fractions of a second are kept. */
function word(t: string): string {
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{1,4})$/.exec(t);
  if (us) return `${us[3].padStart(4, '0')}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`;
  const time = /^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(AM|PM)?$/i.exec(t);
  if (time) {
    let hour = Number(time[1]);
    if (time[5]) hour = (hour % 12) + (time[5].toUpperCase() === 'PM' ? 12 : 0);
    const fraction = (time[4] ?? '').replace(/0+$/, '');
    return `${String(hour).padStart(2, '0')}:${time[2]}:${time[3] ?? '00'}${fraction ? `.${fraction}` : ''}`;
  }
  return t;
}
const normalised = (v: string, type: string | undefined) => type === 'date' || type === 'time' || type === 'timestamp'
  ? v.trim().replace(/(\d)\s+(AM|PM)\b/gi, '$1$2').split(/[\sT]+/).filter(Boolean).map(word).join(' ')
  : v;

/** A plain decimal ("007", "+1.50", "-0") by its digits alone, or undefined for anything else (exponents, hex, words). */
function canonicalDecimal(t: string): string | undefined {
  const m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(t.trim());
  if (!m || (!m[2] && !m[3])) return undefined;
  const whole = m[2].replace(/^0+/, '') || '0';
  const fraction = (m[3] ?? '').replace(/0+$/, '');
  return `${m[1] === '-' && (whole !== '0' || fraction) ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}
const PLAIN_NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;
const significant = (t: string) => t.replace(/e.*$/i, '').replace(/[^\d]/g, '').replace(/^0+/, '').length;

/**
 * Whether the file holds this text for the field. Only a number field compares as numbers (by value when both fit a
 * double exactly, else by their digits); text that looks like a number ("1234" and "01234") is different text. A date
 * or time is compared as the moment it names, a fraction of a second included.
 */
export function sameStored(held: unknown, draft: string, type?: string): boolean {
  if (held === null || held === undefined) return draft === '';
  const text = String(held);
  if (text === draft) return true;
  if (type === 'number') {
    const exact = (v: string) => PLAIN_NUMBER.test(v.trim()) && significant(v.trim()) <= 15;
    // A double that overflowed or underflowed (1e400, 1e-400) is not the number written: those go by digits.
    const value = (v: string) => { const n = Number(v); return Number.isFinite(n) && (n !== 0 || significant(v.trim()) === 0) ? n : undefined; };
    if (exact(text) && exact(draft)) {
      const a = value(text), b = value(draft);
      if (a !== undefined && b !== undefined) return a === b;
    }
    const a = canonicalDecimal(text), b = canonicalDecimal(draft);
    return a !== undefined && a === b;
  }
  return normalised(text, type) === normalised(draft, type);
}

/** Whether the record now holds a value that is neither what the field held when its editor opened nor the draft: someone else wrote it. */
export function changedUnderDraft(current: unknown, opened: unknown, draft: string, type?: string): boolean {
  return !sameStored(current, String(opened ?? ''), type) && !sameStored(current, draft, type);
}

/**
 * After a field write failed: when the answer may have been lost (or the record changed, 306), the record is read
 * again. If it already holds the draft, the write counts as saved. If the field is still what it was before the
 * edit, the write did not land: the draft is kept against the file's own modId (`adopt`), so the next try is not a
 * false conflict. Any other value was written by someone else: that is a conflict (`conflict`), and the draft stays
 * against the old modId so that pressing Enter again reports the clash instead of overwriting their change.
 */
export async function settleWrite<R extends { modId: string; fieldData: Record<string, unknown> }>(
  error: unknown, field: string, draft: string, was: unknown, type: string | undefined, reread: () => Promise<R>,
): Promise<{ saved: boolean; fresh?: R; adopt: boolean; conflict: boolean }> {
  const stale = error instanceof ApiError && error.code === 306;
  const lost = outcomeUnknown(error);
  if (!lost && !stale) return { saved: false, adopt: false, conflict: false };
  let fresh: R;
  try { fresh = await reread(); } catch { return { saved: false, adopt: false, conflict: false }; }
  if (sameStored(fresh.fieldData[field], draft, type)) return { saved: true, fresh, adopt: true, conflict: false };
  if (stale) return { saved: false, fresh, adopt: false, conflict: true };
  const untouched = sameStored(fresh.fieldData[field], String(was ?? ''), type);
  return { saved: false, fresh, adopt: untouched, conflict: !untouched };
}

/** What a related row's tries know: one may have reached the server (`maybeAdded`). */
export interface AddState { maybeAdded: boolean }
/** The portal as it was when the row was started: the ids of its rows, and how many related records it had. */
export interface PortalSnapshot { ids: Set<string>; count?: number; /** Set once a check has found a row the first try may have made: later checks say so again. */ seen?: { matched: boolean } }
export type AddOutcome<R> =
  | { result: 'added' }
  | { result: 'failed'; error: Error }
  /** A try may already have added it: nothing is sent until the person chooses to add it anyway. `matched`: a new row reads like the typed one. */
  | { result: 'maybe'; error: Error; fresh?: R; matched: boolean };

/**
 * One try at adding a related row, made only when the person asks. Adding sends no modId and is not idempotent, so
 * after a try whose answer may have been lost nothing is sent again by itself: the record is read, and what it shows
 * (a row that was not there before, one more related record, or nothing yet) is told to the person; only `anyway` (the
 * explicit "Add anyway") sends it again. That the new row reads like the typed one is only
 * told in the message; a file may change what was typed (auto-enter, calculations, date and time forms), so it is
 * not the gate. If the record cannot be read, nothing is sent either. A portal longer than the rows the server
 * returns is only seen through its count of related records.
 */
export async function attemptAdd<R extends { portalData?: Record<string, readonly Record<string, unknown>[]>; portalDataInfo?: readonly { portalObjectName: string; foundCount: number }[] }>(
  state: AddState,
  io: { send: () => Promise<void>; reread: () => Promise<R> },
  snapshot: PortalSnapshot,
  portal: string,
  data: Record<string, string>,
  types: Record<string, string | undefined>,
  anyway: boolean,
): Promise<AddOutcome<R>> {
  if (state.maybeAdded && !anyway) {
    let fresh: R;
    try { fresh = await io.reread(); } catch (e) {
      return { result: 'maybe', matched: false, error: new Error(`Could not check whether the first try already added it (${(e as Error).message}). It may already be there: look at the list, then press Add anyway to add it again.`) };
    }
    const rows = fresh.portalData?.[portal] ?? [];
    const fresher = rows.filter((row) => !snapshot.ids.has(String(row['recordId'])));
    const found = fresh.portalDataInfo?.find((x) => x.portalObjectName === portal)?.foundCount;
    const more = found !== undefined && snapshot.count !== undefined && found > snapshot.count;
    if (fresher.length || more) {
      const matched = fresher.some((row) => Object.entries(data).every(([k, v]) => sameStored(row[k], v, types[k])));
      for (const row of fresher) snapshot.ids.add(String(row['recordId']));
      if (found !== undefined) snapshot.count = found;
      snapshot.seen = { matched: matched || !!snapshot.seen?.matched };
    }
    if (snapshot.seen) {
      return {
        result: 'maybe', matched: snapshot.seen.matched, fresh,
        error: new Error(snapshot.seen.matched
          ? 'The list now shows this row, so the first try probably added it. Discard your draft, or press Add anyway to add it again.'
          : 'The list has a related record it did not have before; it may be the one you added. Look at it, then discard your draft or press Add anyway to add it again.'),
      };
    }
    // Nothing yet is not nothing for good: a gateway that gave up, or a dropped connection, leaves a server that may
    // finish the request late. So it is not sent again on this evidence.
    return { result: 'maybe', matched: false, fresh, error: new Error('The list does not show it yet, but the server may still finish the first try. Check again in a moment, or press Add anyway to add it again.') };
  }
  const stillMaybe = state.maybeAdded;
  try {
    await io.send();
    state.maybeAdded = false;
    return { result: 'added' };
  } catch (e) {
    state.maybeAdded = stillMaybe || outcomeUnknown(e);
    return { result: 'failed', error: e instanceof Error ? e : new Error(String(e)) };
  }
}
