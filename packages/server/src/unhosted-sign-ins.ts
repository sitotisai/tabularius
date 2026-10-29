// Failed sign-ins for file names that are not hosted, counted as a hosted file counts them. A hosted file keeps its own table, so
// an address locked out at one file is not locked at another; a name that is not hosted gets a table of its own too, or one
// address that spends its budget on an invented name would show every other invented name as locked and every hosted file as not.
import { boundedName, LOCKOUT, SignInFailures } from '../../store/src/sign-in-failures.ts';

/** How many invented names get a table of their own, and how many counters each keeps: together about half a million, whatever is asked. */
const MAX_NAMES = 2048;
const PER_NAME = 256;

export class UnhostedSignIns {
  private readonly tables = new Map<string, SignInFailures>();
  /** The counters of every name past the limits below. Its keys carry the file name (callers pass it to accountKey), so accounts stay apart; its address budget is shared. */
  private readonly overflow = new SignInFailures(undefined, undefined, LOCKOUT.maxFailures);

  /**
   * The counters for one file name that is not hosted (the name's case does not matter, as a hosted file's does not). A table
   * holding a live lock or an open budget is never dropped, as a hosted file's is not, so flooding names erases nothing: a
   * name that finds no room is counted in the shared table, which still locks its accounts.
   */
  table(db: string): SignInFailures {
    const key = boundedName(db.toLowerCase());
    const known = this.tables.get(key);
    if (known) {
      this.tables.delete(key);
      this.tables.set(key, known);
      return known;
    }
    if (this.tables.size >= MAX_NAMES) {
      // The one asked for longest ago with nothing counted goes; if none is idle there is no room.
      const idle = [...this.tables].find(([, t]) => t.idle())?.[0];
      if (idle === undefined) return this.overflow;
      this.tables.delete(idle);
    }
    const table = new SignInFailures(undefined, undefined, PER_NAME);
    this.tables.set(key, table);
    return table;
  }
}
