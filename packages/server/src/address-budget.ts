import { addressBucket } from '../../store/src/client-ip.ts';

export const BUDGET_BURST = 64;
export const BUDGET_PER_SECOND = 5;
const MAX_ADDRESSES = 10_000;
/** What an address that is new while the table is full may spend at first: someone cycling through addresses never gets a full burst each. */
const FULL_TABLE_BURST = 8;

/** Work any caller may ask for without having proved who it is: a burst, then a steady rate, per client address (an IPv6 /64 counts as one). */
export class AddressBudget {
  private readonly left = new Map<string, { tokens: number; at: number }>();
  private readonly burst: number;
  private readonly perSecond: number;
  private readonly now: () => number;
  private readonly maxAddresses: number;
  private readonly fullTableBurst: number;
  constructor(burst = BUDGET_BURST, perSecond = BUDGET_PER_SECOND, now: () => number = () => performance.now(), maxAddresses = MAX_ADDRESSES, fullTableBurst = FULL_TABLE_BURST) {
    this.burst = burst;
    this.perSecond = perSecond;
    this.now = now;
    this.maxAddresses = maxAddresses;
    this.fullTableBurst = fullTableBurst;
  }

  /** Spends one unit; false when this address has used its share for now. */
  take(address: string): boolean {
    const key = addressBucket(address);
    const now = this.now();
    const entry = this.left.get(key);
    const tokens = Math.min(this.burst, (entry?.tokens ?? (this.left.size >= this.maxAddresses ? this.fullTableBurst : this.burst)) + (entry ? Math.max(0, now - entry.at) / 1000 * this.perSecond : 0));
    // Re-insert so the map stays in order of last use; a full table drops its longest-idle address.
    this.left.delete(key);
    if (this.left.size >= this.maxAddresses) this.left.delete(this.left.keys().next().value!);
    if (tokens < 1) {
      this.left.set(key, { tokens, at: now });
      return false;
    }
    this.left.set(key, { tokens: tokens - 1, at: now });
    return true;
  }
}

/** Milliseconds from a clock that only goes forward and that nothing else adjusts (not wall time, which can be stepped). */
const monotonicMs = (): number => Number(process.hrtime.bigint() / 1000n) / 1000;

export interface CheckGateOptions {
  /** Checks running at once, overall: each is a password hash per hosted file on the thread pool the file system also uses. */
  global?: number;
  /** Checks running at once for one address (an IPv6 /64 counts as one). */
  perAddress?: number;
  /** Checks that may wait, for one address and overall. A later arrival over either is refused; nobody is pushed out. */
  waitingPerAddress?: number;
  waitingTotal?: number;
  /** How long a check may wait for its turn before it gives up. */
  waitMs?: number;
  /** Checks that may start each second, overall, after a first few. */
  perSecond?: number;
  burst?: number;
  now?: () => number;
}

interface Waiter {
  key: string;
  address: string;
  resolve: (release: (() => void) | undefined) => void;
  timer: NodeJS.Timeout;
  stop: () => void;
}

/**
 * Turns for checking a Basic password for an address whose budget is used up. What it bounds is the server's work: at
 * most a few checks at once (each a password hash per hosted file) and a bounded number started a second, however many
 * addresses ask. A check runs only for its own (address, account name), so made-up names never take a real account's
 * place, and at most a few run at once per address. One that cannot start at once waits for its turn, up to a few
 * seconds, in a line of its own address (16 places): a later arrival over that is refused at once and nobody already
 * waiting is pushed out. Turns go round the addresses that have someone waiting, so an address with many waiting does not
 * make another wait for them.
 *
 * What it does not do: a real account in an address group (an IPv6 /64, a NAT, the shared `unknown` address) whose line a
 * flooder keeps full is refused until the flood stops; it can try again or come from another address. Other address
 * groups are not affected.
 */
export class CheckGate {
  private readonly running = new Set<string>();
  private readonly perAddressRunning = new Map<string, number>();
  private total = 0;
  /** Waiting checks by address, each in the order it came; the addresses are served in turns. */
  private readonly lines = new Map<string, Waiter[]>();
  private waitingCount = 0;
  private lastServed: string | undefined;
  private retry: NodeJS.Timeout | undefined;
  private readonly rate: AddressBudget;
  private readonly limits: Required<Omit<CheckGateOptions, 'perSecond' | 'burst' | 'now'>>;
  constructor(options: CheckGateOptions = {}) {
    this.limits = { global: 3, perAddress: 2, waitingPerAddress: 16, waitingTotal: 1024, waitMs: 5000, ...Object.fromEntries(Object.entries(options).filter(([k, v]) => v !== undefined && !['now', 'perSecond', 'burst'].includes(k))) } as typeof this.limits;
    this.rate = new AddressBudget(options.burst ?? 10, options.perSecond ?? 10, options.now ?? monotonicMs);
  }

  /**
   * Resolves with a function to call when the check is done, or undefined when the line had no room for it, the wait ran
   * out, or `signal` (the client went away) fired first.
   */
  enter(address: string, account: string, signal?: AbortSignal): Promise<(() => void) | undefined> {
    const bucket = addressBucket(address);
    const key = `${bucket}\0${account.toLowerCase().slice(0, 256)}`;
    if (signal?.aborted) return Promise.resolve(undefined);
    const line = this.lines.get(bucket) ?? [];
    if (line.length >= this.limits.waitingPerAddress || this.waitingCount >= this.limits.waitingTotal) return Promise.resolve(undefined);
    return new Promise((resolve) => {
      const waiter: Waiter = { key, address: bucket, resolve, stop: () => {}, timer: setTimeout(() => this.drop(waiter), this.limits.waitMs) };
      if (signal) {
        const onAbort = () => this.drop(waiter);
        signal.addEventListener('abort', onAbort, { once: true });
        waiter.stop = () => signal.removeEventListener('abort', onAbort);
      }
      line.push(waiter);
      this.lines.set(bucket, line);
      this.waitingCount++;
      this.pump();
    });
  }

  private remove(waiter: Waiter): boolean {
    const line = this.lines.get(waiter.address);
    const at = line?.indexOf(waiter) ?? -1;
    if (!line || at < 0) return false;
    line.splice(at, 1);
    if (!line.length) this.lines.delete(waiter.address);
    this.waitingCount--;
    clearTimeout(waiter.timer);
    waiter.stop();
    return true;
  }

  private drop(waiter: Waiter): void {
    if (this.remove(waiter)) waiter.resolve(undefined);
  }

  /** The next waiting check to start: the first startable one of the next address in turn. */
  private next(): Waiter | undefined {
    const addresses = [...this.lines.keys()];
    const from = this.lastServed === undefined ? 0 : (addresses.indexOf(this.lastServed) + 1) % Math.max(addresses.length, 1);
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[(from + i) % addresses.length];
      if ((this.perAddressRunning.get(address) ?? 0) >= this.limits.perAddress) continue;
      const waiter = this.lines.get(address)!.find((w) => !this.running.has(w.key));
      if (waiter) return waiter;
    }
    return undefined;
  }

  private pump(): void {
    while (this.total < this.limits.global) {
      const waiter = this.next();
      if (!waiter) return;
      if (!this.rate.take('checks')) {
        // Try again when a start is allowed again.
        this.retry ??= setTimeout(() => { this.retry = undefined; this.pump(); }, 50);
        return;
      }
      this.remove(waiter);
      this.lastServed = waiter.address;
      this.running.add(waiter.key);
      this.perAddressRunning.set(waiter.address, (this.perAddressRunning.get(waiter.address) ?? 0) + 1);
      this.total++;
      let done = false;
      waiter.resolve(() => {
        if (done) return;
        done = true;
        this.running.delete(waiter.key);
        const left = (this.perAddressRunning.get(waiter.address) ?? 1) - 1;
        if (left > 0) this.perAddressRunning.set(waiter.address, left); else this.perAddressRunning.delete(waiter.address);
        this.total--;
        this.pump();
      });
    }
  }
}
