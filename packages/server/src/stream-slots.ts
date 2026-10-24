import type { ServerResponse } from 'node:http';
import { addressBucket } from '../../store/src/client-ip.ts';

export const MAX_MCP_STREAMS = 256;
export const MAX_MCP_STREAMS_PER_IDENTITY = 10;
/** Basic credentials are not verified before a stream opens and the account name is the caller's to choose, so those streams are also bounded per
 * address (an IPv6 /64 counts as one, as at the edge) and as a group, which leaves the rest of MAX_MCP_STREAMS to callers with a token.
 * Behind a proxy that is not told to pass the client's address, everyone shares one address and so these allowances. */
export const MAX_MCP_UNVERIFIED_STREAMS_PER_ADDRESS = 20;
export const MAX_MCP_UNVERIFIED_STREAMS = 64;

/** A subscriber has no operation lifetime separate from its response. Entries disappear on every end path. */
export class StreamSlots {
  private total = 0;
  private unverified = 0;
  private readonly identities = new Map<string, number>();
  private readonly addresses = new Map<string, number>();
  private readonly open = new Set<ServerResponse>();
  constructor(max = MAX_MCP_STREAMS, perIdentity = MAX_MCP_STREAMS_PER_IDENTITY, perAddress = MAX_MCP_UNVERIFIED_STREAMS_PER_ADDRESS, maxUnverified = MAX_MCP_UNVERIFIED_STREAMS) {
    this.max = max;
    this.maxUnverified = maxUnverified;
    this.perIdentity = perIdentity;
    this.perAddress = perAddress;
  }
  private readonly max: number;
  private readonly perIdentity: number;
  private readonly perAddress: number;
  private readonly maxUnverified: number;
  /** Ends every stream held (the server is stopping): a client reconnects when it is back. */
  closeAll(): void {
    for (const res of this.open) res.end();
  }

  /** `caller` (its client address) is given for a caller whose credentials have not been checked. */
  enter(identity: string, res: ServerResponse, caller?: string): (() => void) | undefined {
    if (res.destroyed || res.writableEnded || res.socket?.destroyed) return;
    const held = this.identities.get(identity) ?? 0;
    const unverifiedAddress = caller === undefined ? undefined : addressBucket(caller);
    const fromAddress = unverifiedAddress === undefined ? 0 : this.addresses.get(unverifiedAddress) ?? 0;
    if (this.total >= this.max || held >= this.perIdentity) return;
    if (unverifiedAddress !== undefined && (fromAddress >= this.perAddress || this.unverified >= this.maxUnverified)) return;
    this.total++;
    if (unverifiedAddress !== undefined) {
      this.unverified++;
      this.addresses.set(unverifiedAddress, fromAddress + 1);
    }
    this.open.add(res);
    this.identities.set(identity, held + 1);
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      this.open.delete(res);
      this.total--;
      const n = this.identities.get(identity)! - 1;
      if (n) this.identities.set(identity, n); else this.identities.delete(identity);
      if (unverifiedAddress !== undefined) {
        this.unverified--;
        const left = this.addresses.get(unverifiedAddress)! - 1;
        if (left) this.addresses.set(unverifiedAddress, left); else this.addresses.delete(unverifiedAddress);
      }
      res.off('finish', release);
      res.off('close', release);
    };
    res.once('finish', release);
    res.once('close', release);
    return release;
  }
}
