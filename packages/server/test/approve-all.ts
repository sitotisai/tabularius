import type { Host } from '../src/host.ts';

/** A .fmp12 copied into a test folder is converted and held, as a file that arrived there; tests that run its scripts approve it. */
export function approveAll(host: Host): void {
  for (const f of host.heldFiles()) host.approve(f.name, 'test');
}
