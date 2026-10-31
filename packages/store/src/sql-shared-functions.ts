// The functions the store defines in place of, or beside, SQLite's own (ROUND, LOWER, UPPER, the date and text functions of
// sql-dates.ts), as the child process of a recursive query (sql-recursive.ts) registers them. They are the very
// implementations the store registers, imported from one module, so a recursive query answers as any other query does.

import type { DatabaseSync, SQLInputValue, SQLOutputValue } from 'node:sqlite';
import { SQL_DATE_FUNCTIONS } from './sql-dates.ts';

type SqlFunction = (...args: SQLOutputValue[]) => SQLInputValue;

/** The shared functions by lower-case name. */
export const SHARED_SQL_FUNCTIONS: ReadonlyMap<string, SqlFunction> = new Map(
  Object.entries(SQL_DATE_FUNCTIONS).map(([name, fn]) => [name.toLowerCase(), fn as SqlFunction]));

/** Registers them on `db` the way the store registers its query functions on its read-only connection. */
export function registerSharedSqlFunctions(db: DatabaseSync): void {
  for (const [name, fn] of Object.entries(SQL_DATE_FUNCTIONS)) db.function(name, { varargs: true, useBigIntArguments: true }, fn as SqlFunction);
}
