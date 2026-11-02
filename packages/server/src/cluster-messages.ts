// What the front process accepts from a worker, and what a worker accepts from the front process (see cluster.ts).
// These processes run the same code under the same user over a private pipe. This is defence in depth against a bug or an
// already compromised worker, not network authentication or a new trust boundary. The sender is whoever the pipe says it is.
import type { FromFront, Note, ToFront } from './cluster.ts';

/** The longest name of a hosted file a message may carry. */
export const FILE_NAME_MAX = 255;
/** The longest error text the front process passes on in an open-state note. */
export const OPEN_STATE_TEXT_MAX = 4096;
/** The most sessions or scripts one worker may report at a time. */
export const LIST_MAX = 20_000;
const SHORT = 1024;
const LONG = 1_000_000;

export type Verdict<T> = { ok: T } | { refused: string };
const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const short = (x: unknown, max = SHORT): x is string => typeof x === 'string' && x.length <= max;
const list = (x: unknown, max = LIST_MAX): x is unknown[] => Array.isArray(x) && x.length <= max;
const id = (x: unknown): x is number => Number.isSafeInteger(x) && (x as number) >= 0;

/** A plain, non-empty hosted file name, with no folder part or control character. */
export function isFileName(x: unknown): x is string {
  return typeof x === 'string' && x.length > 0 && x.length <= FILE_NAME_MAX && x !== '.' && x !== '..'
    // eslint-disable-next-line no-control-regex
    && !/[\\/\u0000-\u001f\u007f]/.test(x);
}

// Copy only fields whose shapes have been checked; optional fields stay absent.
const pick = (x: Record<string, unknown>, keys: string[]): Record<string, unknown> => Object.fromEntries(keys.filter((k) => x[k] !== undefined).map((k) => [k, x[k]]));
const finite = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const numbers = (x: Record<string, unknown>, keys: string[]): boolean => keys.every((k) => finite(x[k]));
const texts = (x: Record<string, unknown>, keys: string[]): boolean => keys.every((k) => short(x[k]));
const optionalTexts = (x: Record<string, unknown>, keys: string[]): boolean => keys.every((k) => x[k] === undefined || short(x[k]));
const strings = (x: unknown): x is string[] => list(x) && x.every((s) => short(s));
const date = (x: unknown): boolean => finite(x) && Math.abs(x) <= 8.64e15;
const CHANGE_KINDS = new Set(['create', 'update', 'delete', 'truncate', 'lock', 'unlock', 'view', 'leave', 'design', 'designer']);
const SCRIPT_KINDS = new Set(['server', 'schedule', 'automation', 'hook']);
const OUTCOMES = new Set(['ok', 'error', 'failed', 'canceled']);
const WITH_FROM = new Set(['sessions', 'scripts', 'stats', 'log', 'open-state']);

function session(x: unknown): Record<string, unknown> | undefined {
  if (!isObject(x) || !texts(x, ['id', 'token', 'db', 'account', 'since']) || !numbers(x, ['idleSeconds', 'streams'])
    || (x.client !== 'web' && x.client !== 'rest') || !optionalTexts(x, ['from', 'device', 'via'])) return;
  const e = x.externalIdentity;
  if (e !== undefined && (!isObject(e) || !short(e.mapping) || !optionalTexts(e, ['issuer', 'sub', 'person']) || (e.groups !== undefined && !strings(e.groups)))) return;
  return { ...pick(x, ['id', 'token', 'db', 'account', 'idleSeconds', 'since', 'client', 'from', 'device', 'via', 'streams']),
    ...(isObject(e) ? { externalIdentity: pick(e, ['mapping', 'issuer', 'sub', 'person', 'groups']) } : {}) };
}

function script(x: unknown, state: 'running' | 'queued' | 'recent'): Record<string, unknown> | undefined {
  if (!isObject(x) || !isFileName(x.file) || !texts(x, ['id', 'script', 'kind', 'queuedAt']) || !SCRIPT_KINDS.has(x.kind as string)
    || !optionalTexts(x, ['account', 'startedAt'])) return;
  const common = pick(x, ['id', 'file', 'script', 'account', 'kind', 'queuedAt', 'startedAt']);
  if (state !== 'recent') return x.state === state ? { ...common, state } : undefined;
  if (!numbers(x, ['waitMs', 'ms']) || !short(x.outcome) || !OUTCOMES.has(x.outcome)
    || (x.error !== undefined && !finite(x.error)) || !optionalTexts(x, ['canceledBy'])) return;
  return { ...common, ...pick(x, ['waitMs', 'ms', 'outcome', 'error', 'canceledBy']) };
}

function profileScript(x: unknown): Record<string, unknown> | undefined {
  if (!isObject(x) || !isFileName(x.file) || !short(x.script) || !numbers(x, ['runs', 'ms', 'maxMs', 'errors', 'steps']) || !date(x.last) || !list(x.stepStats)) return;
  if (!x.stepStats.every((st) => isObject(st) && short(st.line, LONG) && numbers(st, ['index', 'count', 'ms', 'maxMs', 'errors']))) return;
  return { ...pick(x, ['file', 'script', 'runs', 'ms', 'maxMs', 'errors', 'steps', 'last']),
    stepStats: x.stepStats.map((st) => pick(st as Record<string, unknown>, ['index', 'line', 'count', 'ms', 'maxMs', 'errors'])) };
}

function profileFind(x: unknown): Record<string, unknown> | undefined {
  if (!isObject(x) || !isFileName(x.file) || !texts(x, ['table', 'layout']) || !strings(x.fields) || !strings(x.sort)
    || !numbers(x, ['count', 'ms', 'maxMs', 'leadingWildcard', 'total']) || !date(x.last) || (x.lastFound !== undefined && !finite(x.lastFound))) return;
  return pick(x, ['file', 'table', 'layout', 'fields', 'sort', 'count', 'ms', 'maxMs', 'leadingWildcard', 'lastFound', 'total', 'last']);
}

const FROM_ANY = new Set(['change', 'design', 'sessions', 'scripts', 'stats', 'profile-reset', 'message', 'end', 'cancel-script', 'log', 'open-state']);
const FROM_LEADER = new Set(['approve']);

/** Check a worker's authority and fields, and replace any claimed sender with its pipe's id. */
export function workerNote(note: unknown, sender: number): Verdict<Note> {
  if (!isObject(note) || typeof note.k !== 'string') return { refused: 'a note without a kind' };
  if (!FROM_ANY.has(note.k) && !(sender === 0 && FROM_LEADER.has(note.k))) {
    return { refused: FROM_LEADER.has(note.k) || note.k === 'gone' || note.k === 'tls' ? `a ${note.k} note from a worker that may not send one` : 'a note of an unknown kind' };
  }
  return shaped(note, sender);
}

/** The front may send gone and tls; a relayed sender must be an id in this cluster. */
export function frontNote(note: unknown, workers: number): Verdict<Note> {
  if (!isObject(note) || typeof note.k !== 'string') return { refused: 'a note without a kind' };
  const from = (x: unknown): x is number => id(x) && x < workers;
  if (note.k === 'gone') return from(note.from) ? { ok: { k: 'gone', from: note.from } } : { refused: 'a gone note for no worker' };
  if (note.k === 'tls') {
    const t = note.tls;
    if (!isObject(t) || !short(t.cert, LONG) || !short(t.key, LONG)) return { refused: 'a certificate of the wrong shape' };
    const a = t.auto;
    if (a !== undefined && (!isObject(a) || !strings(a.domains) || !date(a.expires) || (a.problem !== undefined && !short(a.problem, LONG)))) return { refused: 'a certificate of the wrong shape' };
    return { ok: { k: 'tls', tls: { cert: t.cert, key: t.key, ...(isObject(a) ? { auto: pick(a, ['domains', 'expires', 'problem']) } : {}) } as Extract<Note, { k: 'tls' }>['tls'] } };
  }
  if (WITH_FROM.has(note.k) && !from(note.from)) return { refused: 'a note from no worker' };
  if (!('from' in note) || from(note.from)) return shaped(note, from(note.from) ? note.from : 0);
  return { refused: 'a note from no worker' };
}

function shaped(note: Record<string, unknown>, sender: number): Verdict<Note> {
  switch (note.k) {
    case 'change': {
      const c = note.change;
      if (!isObject(c) || !isFileName(c.file) || typeof c.kind !== 'string' || !CHANGE_KINDS.has(c.kind) || !short(c.table)
        || !optionalTexts(c, ['account', 'owner']) || ['recordId', 'modId'].some((k) => c[k] !== undefined && !finite(c[k]))
        || (c.fields !== undefined && !strings(c.fields)) || (c.ids !== undefined && (!list(c.ids) || !c.ids.every(finite)))
        || (c.deletedVisibility !== undefined && (!list(c.deletedVisibility) || !c.deletedVisibility.every((v) => isObject(v) && short(v.account) && short(v.rule, LONG))))) return { refused: 'a change of the wrong shape' };
      return { ok: { k: 'change', change: { ...pick(c, ['kind', 'file', 'table', 'recordId', 'modId', 'account', 'owner', 'fields', 'ids']), ...(Array.isArray(c.deletedVisibility) ? { deletedVisibility: c.deletedVisibility.map((v) => pick(v as Record<string, unknown>, ['account', 'rule'])) } : {}) } as unknown as Extract<Note, { k: 'change' }>['change'] } };
    }
    case 'design': return isFileName(note.file) ? { ok: { k: 'design', file: note.file } } : { refused: 'a design note for a name that is not a file name' };
    case 'approve': return isFileName(note.file) && short(note.id, 128) ? { ok: { k: 'approve', file: note.file, id: note.id } } : { refused: 'an approval of the wrong shape' };
    case 'sessions': {
      if (!list(note.list)) return { refused: 'a list of sessions of the wrong shape' };
      const sessions = note.list.map(session);
      if (sessions.some((s) => !s)) return { refused: 'a list of sessions of the wrong shape' };
      return { ok: { k: 'sessions', from: sender, list: sessions as unknown as Extract<Note, { k: 'sessions' }>['list'] } };
    }
    case 'scripts': {
      const l = note.list;
      if (!isObject(l) || !finite(l.limit) || !list(l.running) || !list(l.queued) || !list(l.recent)) return { refused: 'a list of scripts of the wrong shape' };
      const running = l.running.map((x) => script(x, 'running')), queued = l.queued.map((x) => script(x, 'queued')), recent = l.recent.map((x) => script(x, 'recent'));
      if ([...running, ...queued, ...recent].some((s) => !s)) return { refused: 'a list of scripts of the wrong shape' };
      return { ok: { k: 'scripts', from: sender, list: { limit: l.limit, running, queued, recent } as unknown as Extract<Note, { k: 'scripts' }>['list'] } };
    }
    case 'stats': {
      const p = note.profile, r = note.requests;
      if (!isObject(p) || !list(p.scripts) || !list(p.finds) || !isObject(r) || !list(r.requests) || !list(r.durations)) return { refused: 'statistics of the wrong shape' };
      const scripts = p.scripts.map(profileScript), finds = p.finds.map(profileFind);
      if ([...scripts, ...finds].some((x) => !x)) return { refused: 'statistics of the wrong shape' };
      if (!r.requests.every((x) => Array.isArray(x) && x.length === 2 && short(x[0]) && finite(x[1]))
        || !r.durations.every((x) => Array.isArray(x) && x.length === 2 && short(x[0]) && isObject(x[1]) && list(x[1].buckets, 64) && x[1].buckets.every(finite) && numbers(x[1], ['sum', 'count']))) return { refused: 'request counts of the wrong shape' };
      const totals = ['calls', 'seconds', 'bytesIn', 'bytesOut', 'inProgress'], gate = ['active', 'queued', 'shed'];
      if ((r.totals !== undefined && (!isObject(r.totals) || !numbers(r.totals, totals))) || (r.gate !== undefined && (!isObject(r.gate) || !numbers(r.gate, gate)))) return { refused: 'request totals of the wrong shape' };
      const requests = { requests: r.requests, durations: r.durations.map((x) => { const [name, counts] = x as [string, Record<string, unknown>]; return [name, pick(counts, ['buckets', 'sum', 'count'])]; }),
        ...(isObject(r.totals) ? { totals: pick(r.totals, totals) } : {}), ...(isObject(r.gate) ? { gate: pick(r.gate, gate) } : {}) };
      return { ok: { k: 'stats', from: sender, profile: { scripts, finds } as unknown as Extract<Note, { k: 'stats' }>['profile'], requests: requests as unknown as Extract<Note, { k: 'stats' }>['requests'] } };
    }
    case 'profile-reset': return { ok: { k: 'profile-reset' } };
    case 'message': return short(note.text, LONG) && (note.token === undefined || short(note.token)) ? { ok: { k: 'message', text: note.text, ...(note.token !== undefined ? { token: note.token as string } : {}) } } : { refused: 'a message of the wrong shape' };
    case 'end': return short(note.id) ? { ok: { k: 'end', id: note.id } } : { refused: 'an end of the wrong shape' };
    case 'cancel-script': return short(note.id) && short(note.by) ? { ok: { k: 'cancel-script', id: note.id, by: note.by } } : { refused: 'a script cancel of the wrong shape' };
    case 'log': {
      if ((note.type !== 'Warning' && note.type !== 'Error') || !short(note.source, 256) || typeof note.message !== 'string') return { refused: 'a log line of the wrong shape' };
      // Preserve a real warning even when its request line is long, as the digest does.
      return { ok: { k: 'log', from: sender, type: note.type, source: note.source, message: note.message.slice(0, 32_768) } };
    }
    case 'open-state': {
      if (!isFileName(note.file) || (note.error !== undefined && typeof note.error !== 'string')) return { refused: 'an open-state note of the wrong shape' };
      // Keep the report even when the reason is long.
      return { ok: { k: 'open-state', from: sender, file: note.file, ...(note.error !== undefined ? { error: note.error.slice(0, OPEN_STATE_TEXT_MAX) } : {}) } };
    }
    default: return { refused: 'a note of an unknown kind' };
  }
}

const QUESTIONS = new Set(['close', 'pause', 'open', 'offline']);

/** A question asking the other workers to close, pause, open or take offline a file. */
export function question(q: unknown): Verdict<{ k: 'file'; name: string; action: 'close' | 'pause' | 'open' | 'offline'; detail?: string }> {
  if (!isObject(q) || q.k !== 'file' || !isFileName(q.name) || typeof q.action !== 'string' || !QUESTIONS.has(q.action) || (q.detail !== undefined && !short(q.detail, 4096))) return { refused: 'a question of the wrong shape' };
  return { ok: { k: 'file', name: q.name, action: q.action as 'close', ...(q.detail !== undefined ? { detail: q.detail as string } : {}) } };
}

/** Counts refusals and logs at most once a minute for each reason, so junk cannot fill the log. */
export class Refusals {
  readonly counts = new Map<string, number>();
  private readonly said = new Map<string, number>();
  private readonly say: (text: string) => void;
  private readonly now: () => number;
  constructor(say: (text: string) => void, now: () => number = Date.now) { this.say = say; this.now = now; }

  refuse(side: string, who: string, reason: string): void {
    const key = `${side}: ${reason}`;
    this.counts.set(key, (this.counts.get(key) ?? 0) + 1);
    const last = this.said.get(key);
    if (last === undefined || this.now() - last >= 60_000) {
      this.said.set(key, this.now());
      this.say(`cluster: dropped ${reason} (${side}, ${who}); this is said once a minute for each reason`);
    }
  }

  total(): number { return [...this.counts.values()].reduce((n, c) => n + c, 0); }
}

/** Check a message from a worker and pass on only known fields. */
export function workerMessage(m: unknown, sender: number): Verdict<ToFront> {
  if (!isObject(m) || typeof m.t !== 'string') return { refused: 'a message without a type' };
  switch (m.t) {
    case 'ready': return { ok: { t: 'ready' } };
    case 'log': return typeof m.text === 'string' ? { ok: { t: 'log', text: m.text.slice(0, 32_768) } } : { refused: 'a log line without text' };
    case 'tell': { const n = workerNote(m.note, sender); return 'refused' in n ? n : { ok: { t: 'tell', note: n.ok } }; }
    case 'ask': { const q = question(m.q); return id(m.rid) && 'ok' in q ? { ok: { t: 'ask', rid: m.rid, q: q.ok } } : { refused: 'refused' in q ? q.refused : 'a question without a number' }; }
    case 'cancel': return id(m.rid) ? { ok: { t: 'cancel', rid: m.rid } } : { refused: 'a cancel without a number' };
    case 'answer': return id(m.rid) ? { ok: { t: 'answer', rid: m.rid } } : { refused: 'an answer without a number' };
    default: return { refused: 'a message of an unknown type' };
  }
}

/** Check a front message after the worker has handled start and stop. */
export function frontMessage(m: unknown, workers: number): Verdict<FromFront> {
  if (!isObject(m) || typeof m.t !== 'string') return { refused: 'a message without a type' };
  switch (m.t) {
    case 'answer': return id(m.rid) ? { ok: { t: 'answer', rid: m.rid } } : { refused: 'an answer without a number' };
    case 'ask': { const q = question(m.q); return id(m.rid) && 'ok' in q ? { ok: { t: 'ask', rid: m.rid, q: q.ok } } : { refused: 'refused' in q ? q.refused : 'a question without a number' }; }
    case 'tell': { const n = frontNote(m.note, workers); return 'refused' in n ? n : { ok: { t: 'tell', note: n.ok } }; }
    default: return { refused: 'a message of an unknown type' };
  }
}
