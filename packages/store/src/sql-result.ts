// Bounds the size of a query's result. node:sqlite turns every column into a JavaScript string or Uint8Array with no
// cap: one value past V8's string limit (about 512M characters) aborts the whole process with no error to catch, and
// rows that are wide but few enough for the row limit can fill the heap. SQLite's own length limit cannot be set from
// node:sqlite, so the query is wrapped to cut each text and blob column one past the cap, and the rows collected here
// stop at a total size.

import type { DatabaseSync, StatementSync } from 'node:sqlite';
import { StoreError } from './errors.ts';

/** The longest text or blob value (characters, bytes) a query may return. */
export const SQL_VALUE_LIMIT = 64 * 2 ** 20;
/** The most characters and bytes all the values of one result may add up to. */
export const SQL_RESULT_LIMIT = 256 * 2 ** 20;

const megabytes = (n: number) => `${Math.round(n / 2 ** 20)} MB`;

/**
 * `text` (one SELECT, no comments) prepared so that no text or blob value comes back longer than SQL_VALUE_LIMIT + 1:
 * `WITH r(c0, c1, ...) AS (text) SELECT CASE ... END AS "name", ... FROM r`. Columns keep their names and order, and
 * numbers keep their type. SQLite does not repeat a column's expression, so a function such as random() still runs once.
 */
export function boundedStatement(db: DatabaseSync, text: string, names: string[]): StatementSync {
  if (!names.length) return db.prepare(text);
  const body = text.replace(/[\s;]+$/, '');
  const slots = names.map((_, i) => `c${i}`);
  const select = slots.map((c, i) => `CASE WHEN typeof(${c}) IN ('text', 'blob') THEN substr(${c}, 1, ${SQL_VALUE_LIMIT + 1}) ELSE ${c} END AS "${names[i].replace(/"/g, '""')}"`);
  return db.prepare(`WITH r(${slots.join(', ')}) AS (${body}\n) SELECT ${select.join(', ')} FROM r`);
}

/** The first `limit` rows, refusing (error 812) a value or a total past the caps. Rows are arrays or objects. */
export function collectRows<T extends object>(rows: Iterable<T>, limit: number): T[] {
  const out: T[] = [];
  let total = 0;
  for (const r of rows) {
    for (const v of Array.isArray(r) ? r : Object.values(r)) {
      const size = typeof v === 'string' ? v.length : v instanceof Uint8Array ? v.byteLength : 0;
      if (size > SQL_VALUE_LIMIT) throw new StoreError(812, `Exceeded host's capacity: the query returns a value larger than ${megabytes(SQL_VALUE_LIMIT)}; select less of it (substr(), length()) or leave it out`);
      total += size;
    }
    if (total > SQL_RESULT_LIMIT) throw new StoreError(812, `Exceeded host's capacity: the query's result is larger than ${megabytes(SQL_RESULT_LIMIT)}; select fewer columns or rows (LIMIT) or smaller values`);
    out.push(r);
    if (out.length >= limit) break;
  }
  return out;
}
