// A schedule, an inbound hook or a webhook is a standing way for a script to run as an account, or for a file's changes to leave
// the server. Adding, changing or removing one is kept in the security log of the file it belongs to, with who it runs as and
// where it sends to, and never with a secret or a full address. A failure to write the entry is said in the server's log; it
// never undoes the change.

import type { Host } from './host.ts';

export interface AutomationDetail {
  what: 'schedule' | 'inbound hook' | 'webhook';
  id: string;
  name?: string;
  script?: string;
  account?: string;
  network?: boolean;
  sendsTo?: string;
  fields?: string[];
}

/** The keys of `after` whose value differs from `before`, for the entry's list of what changed. */
export function changedFields<T extends object>(before: T, after: T, keys: readonly (keyof T & string)[]): string[] {
  return keys.filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
}

export function auditAutomation(host: Host, log: (m: string) => void, database: string | undefined, change: 'added' | 'changed' | 'removed', detail: AutomationDetail): void {
  if (!database) return;
  // A save that changed nothing is not a change.
  if (change === 'changed' && detail.fields && !detail.fields.length) return;
  try {
    host.get(database)?.recordAutomationChange(change, detail);
  } catch (e) {
    log(`security log: could not record that ${detail.what} ${detail.id} was ${change} in ${database}: ${(e as Error).message}`);
  }
}
