// Unusual-access findings over the audit log (Store.unusualAccess). Kept out of store.ts so that file stays under the release size limit.
import type { AccessAlert, AuditEntry, Store } from './store.ts';
import { describeSecurityEvent } from './security-events.ts';

/** Patterns in the sign-in and security log that deserve a person's attention, worst first. Read-only; recomputed each call. */
export function unusualAccess(store: Pick<Store, 'auditLog'>, opts: { windowHours?: number; failureThreshold?: number; dormantDays?: number; limit?: number } = {}): AccessAlert[] {
    const windowHours = Number.isFinite(opts.windowHours) && opts.windowHours! > 0 ? opts.windowHours! : 72;
    const failureThreshold = Number.isFinite(opts.failureThreshold) && opts.failureThreshold! > 0 ? Math.trunc(opts.failureThreshold!) : 5;
    const dormantDays = Number.isFinite(opts.dormantDays) && opts.dormantDays! > 0 ? Math.trunc(opts.dormantDays!) : 60;
    const limit = Number.isFinite(opts.limit) && opts.limit! > 0 ? Math.trunc(opts.limit!) : 100;
    const now = Date.now();
    const windowStart = new Date(now - windowHours * 3_600_000).toISOString();
    const recent = (iso: string) => iso >= windowStart;
    const place = (e: AuditEntry) => e.from ?? '';
    const alerts: AccessAlert[] = [];

    // The whole sign-in history (oldest first), for baselines and the window alike.
    const signIns = store.auditLog({ kinds: ['sign-in', 'sign-in-failed', 'locked-out'], security: true, limit: 50_000 });

    // failed-burst and lockout, per account, within the window.
    const failures = new Map<string, AuditEntry[]>();
    for (const e of signIns) {
      if (!recent(e.at)) continue;
      const who = e.account ?? '';
      if (e.kind === 'sign-in-failed') {
        (failures.get(who) ?? failures.set(who, []).get(who)!).push(e);
      } else if (e.kind === 'locked-out') {
        alerts.push({ kind: 'lockout', severity: 'alert', account: e.account, ...(e.from ? { from: e.from } : {}), at: e.at, description: `${e.account ?? 'An account'} was locked out after too many failed sign-ins${e.from ? ` from ${e.from}` : ''}`, seqs: [e.seq] });
      }
    }
    for (const [who, es] of failures) {
      if (es.length < failureThreshold) continue;
      const places = [...new Set(es.map(place).filter(Boolean))];
      const last = es[es.length - 1];
      alerts.push({
        kind: 'failed-burst', severity: 'alert', account: who || null, ...(places.length === 1 ? { from: places[0] } : {}),
        at: last.at, count: es.length,
        description: `${es.length} failed sign-ins for ${who || 'an unknown account'} in the last ${windowHours}h${places.length ? ` from ${places.join(', ')}` : ''}`,
        seqs: es.map((e) => e.seq),
      });
    }

    // Per-account successful-sign-in history: places ever used, and the previous time.
    const placesBefore = new Map<string, Set<string>>();
    const prevSuccessAt = new Map<string, string>();
    const windowSuccess = new Map<string, AuditEntry[]>();
    for (const e of signIns) {
      if (e.kind !== 'sign-in' || !e.account) continue;
      const who = e.account.toLowerCase();
      if (recent(e.at)) {
        (windowSuccess.get(who) ?? windowSuccess.set(who, []).get(who)!).push(e);
      } else {
        (placesBefore.get(who) ?? placesBefore.set(who, new Set()).get(who)!).add(place(e));
        prevSuccessAt.set(who, e.at); // last pre-window success (history is oldest-first)
      }
    }
    for (const [who, es] of windowSuccess) {
      const known = placesBefore.get(who);
      // new-place: a place never seen before, for an account that had used another.
      if (known && known.size) {
        const fresh = new Map<string, AuditEntry[]>();
        for (const e of es) { const p = place(e); if (!known.has(p)) (fresh.get(p) ?? fresh.set(p, []).get(p)!).push(e); }
        for (const [p, list] of fresh) {
          const last = list[list.length - 1];
          alerts.push({ kind: 'new-place', severity: 'notice', account: last.account, from: p || undefined, at: last.at, count: list.length, description: `${last.account} signed in from ${p || 'an unknown place'}, which it had not used before`, seqs: list.map((x) => x.seq) });
        }
      }
      // many-places: 3+ distinct places in the window.
      const distinct = [...new Set(es.map(place).filter(Boolean))];
      if (distinct.length >= 3) {
        const last = es[es.length - 1];
        alerts.push({ kind: 'many-places', severity: 'notice', account: last.account, at: last.at, count: distinct.length, description: `${last.account} signed in from ${distinct.length} different places in the last ${windowHours}h (${distinct.join(', ')})`, seqs: es.map((x) => x.seq) });
      }
      // dormant-return: first in-window success, preceded by a long gap (or no prior success).
      const first = es[0];
      const prev = prevSuccessAt.get(who);
      const gapDays = prev ? Math.floor((Date.parse(first.at) - Date.parse(prev)) / 86_400_000) : undefined;
      if (prev && gapDays !== undefined && gapDays >= dormantDays) {
        alerts.push({ kind: 'dormant-return', severity: 'notice', account: first.account, ...(first.from ? { from: first.from } : {}), at: first.at, count: gapDays, description: `${first.account} signed in after ${gapDays} days with no sign-in`, seqs: [first.seq] });
      }
    }

    // protection-removed: a weakening change within the window.
    for (const e of store.auditLog({ kinds: ['require-2fa-cleared', 'account-require-2fa-cleared', 'account-local-only-cleared', 'two-factor-disabled', 'passkey-removed'], security: true, since: windowStart, limit })) {
      alerts.push({ kind: 'protection-removed', severity: 'notice', account: e.account, ...(e.from ? { from: e.from } : {}), at: e.at, description: describeSecurityEvent(e) + (e.account ? ` (by ${e.account})` : ''), seqs: [e.seq] });
    }

    const rank = { alert: 0, notice: 1 };
    return alerts.sort((a, b) => rank[a.severity] - rank[b.severity] || b.at.localeCompare(a.at)).slice(0, limit);
}
