// Failed sign-ins for file names that are not hosted, counted as a hosted file counts them. A hosted file keeps its own table, so
// an address locked out at one file is not locked at another; a name that is not hosted gets a table of its own too, or one
// address that spends its budget on an invented name would show every other invented name as locked and every hosted file as not.
import { boundedName, LOCKOUT, SignInFailures } from '../../store/src/sign-in-failures.ts';

/** How many invented names are remembered. Past it the one asked for longest ago is dropped, with its counters. */
const MAX_NAMES = 2048;

export class UnhostedSignIns {
  private readonly tables = new Map<string, SignInFailures>();

  /** The counters for one file name that is not hosted (the name's case does not matter, as a hosted file's does not). */
  table(db: string): SignInFailures {
    const key = boundedName(db.toLowerCase());
    let table = this.tables.get(key);
    if (table) this.tables.delete(key);
    else table = new SignInFailures();
    this.tables.set(key, table);
    if (this.tables.size > MAX_NAMES) {
      // A name with nothing counted goes first; otherwise the one asked for longest ago.
      const empty = [...this.tables].find(([k, t]) => k !== key && t.size === 0)?.[0];
      this.tables.delete(empty ?? this.tables.keys().next().value!);
    }
    // All the names together hold no more than one table may, so many invented names cannot hold more memory than one.
    let total = 0;
    for (const t of this.tables.values()) total += t.size;
    for (const [k, t] of this.tables) {
      if (total <= LOCKOUT.maxFailures || k === key) break;
      total -= t.size;
      this.tables.delete(k);
    }
    return table;
  }
}
