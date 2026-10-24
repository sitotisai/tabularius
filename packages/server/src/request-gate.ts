// Admission for short HTTP requests. Long-lived live-update streams use their
// own per-session bound and never occupy a short-request slot.
import { positiveWholeNumber } from './setting-values.ts';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { clientAddress } from './client-address.ts';
import { addressBucket } from '../../store/src/client-ip.ts';
import { AUTH_BODY_LIMIT } from './request-body.ts';

export type RequestClass = 'priority' | 'normal' | 'heavy';

/** A live-update stream outlives any short request: it has its own per-session bound and takes no slot. */
export const isEventStream = (method: string | undefined, path: string): boolean => method === 'GET' && /^\/tabularius\/live\/v1\/databases\/[^/]+\/events$/.test(path);

/** GET /mcp may hold an event stream open, so like the live-update stream it has its own bound (StreamSlots) and takes no slot. */
export const isMcpStream = (method: string | undefined, path: string): boolean => method === 'GET' && path === '/mcp';

/** Data API calls answer a refusal in the Data API's own envelope. */
export const isDataApiPath = (path: string): boolean => path.startsWith('/fmi/data/');

export function requestClass(method: string | undefined, path: string): RequestClass {
  if (path.startsWith('/tabularius/auth/') || path === '/oauth/authorize' || path === '/oauth/token') return 'priority';
  if (method === 'GET' && (path === '/tabularius/admin/v1/metrics' || path === '/tabularius/admin/v1/sign-in-info' || path === '/tabularius/auth/v1/providers' || path === '/fmi/data/vLatest/databases')) return 'priority';
  if ((method === 'GET' || method === 'HEAD') && (path.startsWith('/app/') || path.startsWith('/admin/') || path.startsWith('/tabularius/images/') || path.startsWith('/tabularius/tls'))) return 'priority';
  if (method === 'POST' && (/^\/fmi\/data\/[^/]+\/databases\/[^/]+\/sessions$/.test(path) || /\/(?:sign-in|passkey-sign-in|signin|login|callback)$/.test(path))) return 'priority';
  if (path.includes('/_find') || /\/exports?(?:\/|$)|\/export(?:\/|$)/.test(path)) return 'heavy';
  return 'normal';
}

/** The most any route reads before it knows who is calling (inbound hooks check a signature over a body of up to this size). */
export const PRE_AUTH_BODY_LIMIT = 256 * 1024;

/** A Data API call that carries a token: the token is checked before any body is read (an unknown one is refused with no read), so a slow body is an
 * authenticated client's and may take as long as its progress allows. Sign-in (`.../sessions`) takes Basic credentials or a body and reads first. */
export function tokenCheckedFirst(req: IncomingMessage): boolean {
  const path = (req.url ?? '').split('?')[0];
  return /^Bearer\s/i.test(req.headers.authorization ?? '') && isDataApiPath(path) && !/\/sessions(?:\/|$)/.test(path);
}

/** Emitted on a request when its whole body has arrived, or a chunked one has sent more than any route reads before it knows the caller. */
export const BODY_SETTLED = 'tabularius:body-settled';
const watched = new WeakMap<IncomingMessage, { decoded: number }>();

/** Count the body the parser hands over, decoded (chunk framing and padding are not body), and say when it has settled. Wrapping `push` observes
 * the wire without attaching a reader, which would consume the body before authentication. Safe to call twice. */
export function watchBody(req: IncomingMessage): void {
  if (watched.has(req) || typeof req.push !== 'function') return;
  const state = { decoded: 0 };
  watched.set(req, state);
  const push = req.push;
  req.push = function (this: IncomingMessage, chunk: unknown, encoding?: BufferEncoding) {
    const before = state.decoded;
    if (chunk && typeof (chunk as Buffer).length === 'number') state.decoded += (chunk as Buffer).length;
    const result = push.call(this, chunk as Buffer, encoding);
    if (chunk === null || (before <= PRE_AUTH_BODY_LIMIT && state.decoded > PRE_AUTH_BODY_LIMIT)) this.emit(BODY_SETTLED);
    return result;
  } as IncomingMessage['push'];
}

/** Body bytes the parser has handed over so far (0 until `watchBody`). */
export const decodedBodyBytes = (req: IncomingMessage): number => watched.get(req)?.decoded ?? 0;

/** A body that has not fully arrived and that some route may read before the caller is known: one declared at most PRE_AUTH_BODY_LIMIT, or a
 * chunked one, which declares nothing, until it has sent that much body. Routes are not told apart, because the ones that read first (sign-in,
 * MCP with Basic credentials, the XML gateway, OAuth registration, inbound hooks) are not a list that stays true. */
export function preAuthBodyPending(req: IncomingMessage): boolean {
  if (req.complete || tokenCheckedFirst(req)) return false;
  if (req.headers['transfer-encoding']) return decodedBodyBytes(req) <= PRE_AUTH_BODY_LIMIT;
  const length = Number(req.headers['content-length']);
  return length > 0 && length <= PRE_AUTH_BODY_LIMIT;
}

/** A body of sign-in size (or chunked) that is still on its way, so the request that holds a slot for it is waiting on the caller, not working.
 * Declared sizes between 64 KiB and 256 KiB are timed by the edge but not counted here: only an inbound hook reads that much before auth. */
export function slowBodyPending(req: IncomingMessage): boolean {
  if (!preAuthBodyPending(req)) return false;
  return !!req.headers['transfer-encoding'] || Number(req.headers['content-length']) <= AUTH_BODY_LIMIT;
}

/** Requests waiting on a small body take a place from one pool, not slots at large: sign-in and the like (priority) from a small one, so a flood of
 * ordinary requests cannot take their places, everything else from a bigger one. One address, an IPv6 /64 counting as one, may hold only a share. */
interface SlowPool { held: number; readonly limit: number; readonly each: number; readonly byAddress: Map<string, number> }
const slowPool = (limit: number, each: number): SlowPool => ({ held: 0, limit, each, byAddress: new Map() });

interface Waiter {
  address: string;
  kind: RequestClass;
  req: IncomingMessage;
  res: ServerResponse;
  resolve: (release?: () => void) => void;
  timer: ReturnType<typeof setTimeout>;
  close: () => void;
  settled: () => void;
}

export class RequestGate {
  readonly limit: number;
  readonly queueLimit: number;
  readonly waitMs: number;
  private active = 0;
  private readonly byAddress = new Map<string, number>();
  private readonly waiting: Waiter[] = [];
  private shedCount = 0;
  // Requests still waiting for a small body (a sign-in is read before the caller is known), so a few idle senders cannot take every slot.
  private readonly slow: { priority: SlowPool; normal: SlowPool };
  /** Most that both pools together may hold: always leaves a slot of ordinary capacity for a request that is not waiting on anyone. */
  readonly slowBodyLimit: number;
  /** Per pool, and for one address in it: sign-in and the like, then everything else. */
  readonly slowBodyLimits: { priority: { total: number; perAddress: number }; normal: { total: number; perAddress: number } };

  constructor(limit = positiveWholeNumber('TABULARIUS_REQUEST_LIMIT', process.env.TABULARIUS_REQUEST_LIMIT, 32, { min: 4 }), queueLimit = 64, waitMs = 750) {
    if (!Number.isInteger(limit) || limit < 4 || !Number.isInteger(queueLimit) || queueLimit < 0 || !Number.isInteger(waitMs) || waitMs < 1) throw new Error('Invalid request gate settings');
    this.limit = limit;
    this.queueLimit = queueLimit;
    this.waitMs = waitMs;
    this.slowBodyLimit = Math.max(1, limit - 3);
    const normal = Math.max(1, Math.min(Math.floor(limit / 2), limit - 3));
    const priority = Math.max(1, Math.floor(limit / 8));
    this.slowBodyLimits = {
      normal: { total: normal, perAddress: Math.max(1, Math.min(Math.floor(limit / 4), normal)) },
      priority: { total: priority, perAddress: Math.max(1, Math.min(Math.floor(limit / 16), priority)) },
    };
    this.slow = {
      normal: slowPool(this.slowBodyLimits.normal.total, this.slowBodyLimits.normal.perAddress),
      priority: slowPool(this.slowBodyLimits.priority.total, this.slowBodyLimits.priority.perAddress),
    };
  }

  get running(): number { return this.active; }
  get queued(): number { return this.waiting.length; }
  get shed(): number { return this.shedCount; }
  /** Requests holding a slot that are still waiting for a small body. */
  get unfinishedBodies(): number { return this.slow.normal.held + this.slow.priority.held; }

  private capacity(kind: RequestClass): number {
    // Two slots are always available to sign-in and static requests.
    return kind === 'priority' ? this.limit : this.limit - 2;
  }

  private poolFor(kind: RequestClass): SlowPool { return kind === 'priority' ? this.slow.priority : this.slow.normal; }

  private canRun(kind: RequestClass, address: string, req: IncomingMessage): boolean {
    if (this.active >= this.capacity(kind)) return false;
    if (slowBodyPending(req)) {
      const pool = this.poolFor(kind);
      if (pool.held >= pool.limit || (pool.byAddress.get(address) ?? 0) >= pool.each || this.unfinishedBodies >= this.slowBodyLimit) return false;
    }
    // A single address can hold at most three quarters of ordinary capacity. Priority
    // calls can use the reserved slots even when that address is at its cap.
    return (this.byAddress.get(address) ?? 0) < Math.max(1, Math.floor((this.limit - 2) * 0.75)) + (kind === 'priority' ? 2 : 0);
  }

  private take(address: string, kind: RequestClass, req: IncomingMessage, res: ServerResponse): () => void {
    this.active++;
    // The edge ends a small body that has not arrived within its total deadline, which frees this count.
    if (slowBodyPending(req)) {
      const pool = this.poolFor(kind);
      pool.held++;
      pool.byAddress.set(address, (pool.byAddress.get(address) ?? 0) + 1);
      const arrived = () => {
        req.off('end', arrived);
        req.off(BODY_SETTLED, arrived);
        res.off('close', arrived);
        pool.held--;
        const left = pool.byAddress.get(address)! - 1;
        if (left) pool.byAddress.set(address, left); else pool.byAddress.delete(address);
        this.drain();
      };
      req.once('end', arrived);
      req.once(BODY_SETTLED, arrived);
      res.once('close', arrived);
    }
    this.byAddress.set(address, (this.byAddress.get(address) ?? 0) + 1);
    let released = false;
    let operationDone = false;
    let responseDone = res.destroyed || res.writableFinished;
    const release = () => {
      if (released || !operationDone || !responseDone) return;
      released = true;
      res.off('close', responseEnded);
      res.off('finish', responseEnded);
      this.active--;
      const remaining = this.byAddress.get(address)! - 1;
      if (remaining) this.byAddress.set(address, remaining);
      else this.byAddress.delete(address);
      this.drain();
    };
    const responseEnded = () => { responseDone = true; release(); };
    res.once('close', responseEnded);
    res.once('finish', responseEnded);
    return () => { operationDone = true; release(); };
  }

  private unwatch(waiter: Waiter): void {
    clearTimeout(waiter.timer);
    waiter.res.off('close', waiter.close);
    waiter.req.off(BODY_SETTLED, waiter.settled);
  }

  private drain(): void {
    for (;;) {
      const next = (['priority', 'normal', 'heavy'] as const).flatMap((kind) => this.waiting.filter((w) => w.kind === kind))
        .find((w) => this.canRun(w.kind, w.address, w.req));
      if (!next) return;
      const at = this.waiting.indexOf(next);
      this.waiting.splice(at, 1);
      this.unwatch(next);
      // A socket may have closed between selection and admission.
      if (next.res.destroyed || next.res.writableEnded || next.req.socket.destroyed) { next.resolve(undefined); continue; }
      next.resolve(this.take(next.address, next.kind, next.req, next.res));
    }
  }

  async enter(req: IncomingMessage, res: ServerResponse, kind: RequestClass): Promise<(() => void) | undefined> {
    // An IPv6 host chooses its own address within a /64, as the edge's connection limit assumes.
    const address = addressBucket(clientAddress(req));
    watchBody(req);
    // The request is dispatched while the parser is still working through the bytes that arrived with its headers. Let it finish, so
    // only a body that is really still on its way counts as unfinished.
    if (slowBodyPending(req)) await new Promise<void>((resolve) => setImmediate(resolve));
    if (res.destroyed || req.socket.destroyed) return undefined;
    // Serve eligible waiters first. A full queue from one capped address must
    // not prevent a different address from taking a still-free slot.
    this.drain();
    if (this.canRun(kind, address, req)) return this.take(address, kind, req, res);
    if (this.waiting.length >= this.queueLimit && kind === 'priority') {
      const displaced = this.waiting.findLast((w) => w.kind === 'heavy') ?? this.waiting.findLast((w) => w.kind === 'normal');
      if (displaced) {
        this.waiting.splice(this.waiting.indexOf(displaced), 1);
        this.unwatch(displaced);
        this.shedCount++;
        displaced.resolve(undefined);
      }
    }
    if (this.waiting.length >= this.queueLimit) { this.shedCount++; return undefined; }
    return new Promise<(() => void) | undefined>((resolve) => {
      const close = () => {
        const at = this.waiting.indexOf(waiter);
        if (at >= 0) this.waiting.splice(at, 1);
        this.unwatch(waiter);
        resolve(undefined);
        this.drain();
      };
      const timer = setTimeout(() => {
        close();
        this.shedCount++;
      }, this.waitMs);
      // A body that was only a little behind its headers (a slow link, TLS) completes while this waits: admit the request then, not at the deadline.
      const settled = () => this.drain();
      const waiter: Waiter = { address, kind, req, res, resolve, timer, close, settled };
      this.waiting.push(waiter);
      res.once('close', close);
      req.once(BODY_SETTLED, settled);
      this.drain();
    });
  }
}
