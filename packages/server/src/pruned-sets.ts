import { join } from 'node:path';
import { readJsonStateSync, updateJsonStateSync } from '../../store/src/durable.ts';

// Which backup sets retention removed from a backup folder, so the off-site mirror removes only those from the bucket.
// A folder that is empty, not mounted, moved or reconfigured has not pruned anything: its off-site sets stay.

const FILE = '.pruned-sets.json';
/** Kept this long, so an off-site copy that could not be removed at once is tried again. */
const KEEP_MS = 30 * 86_400_000;
const KEEP_MAX = 200;

interface Pruned { sets: Record<string, string> }

const shaped = (value: unknown): Pruned => {
  const sets = value && typeof value === 'object' ? (value as Pruned).sets : undefined;
  return { sets: sets && typeof sets === 'object' && !Array.isArray(sets) ? { ...sets } : {} };
};

/** Records sets that retention just removed from `dest`. */
export function recordPrunedSets(dest: string, names: string[], now = Date.now()): void {
  if (!names.length) return;
  updateJsonStateSync<Pruned>(join(dest, FILE), { sets: {} }, (current) => {
    const sets = shaped(current).sets;
    for (const name of names) sets[name] = new Date(now).toISOString();
    const fresh = Object.entries(sets).filter(([, at]) => now - Date.parse(at) < KEEP_MS).sort(([a], [b]) => (a < b ? -1 : 1));
    return { sets: Object.fromEntries(fresh.slice(-KEEP_MAX)) };
  });
}

/** The sets retention removed from `dest` (empty when nothing was recorded, or the record cannot be read). */
export function prunedSets(dest: string): Set<string> {
  try {
    return new Set(Object.keys(shaped(readJsonStateSync<unknown>(join(dest, FILE))).sets));
  } catch {
    return new Set(); // no record, or a damaged one: nothing is removed off-site on its word
  }
}
