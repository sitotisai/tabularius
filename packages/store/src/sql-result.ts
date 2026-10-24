// Bounds the size of the result of SQL a person or an AI wrote. node:sqlite turns every column into a JavaScript string
// or Uint8Array with no cap: one value past V8's string limit (about 512M characters) aborts the whole process with no
// error to catch, and rows that are wide but few enough for the row limit can fill the heap. SQLite's own length limit
// cannot be set from node:sqlite, so the query is wrapped to stop a row whose text and blob values are too big before
// any of it becomes a JavaScript value, and the rows collected here stop at a total size.

import type { DatabaseSync, StatementSync } from 'node:sqlite';
import { StoreError } from './errors.ts';

/** The most bytes of text and blob values one row of a query's result may hold. */
export const SQL_ROW_LIMIT = 64 * 2 ** 20;
/** The most bytes all the rows of one result may add up to. */
export const SQL_RESULT_LIMIT = 256 * 2 ** 20;
/** What a value costs in the result beyond its text or bytes (a number or a NULL is not free: it is a slot in an array). */
export const SQL_VALUE_COST = 24;

const megabytes = (n: number) => `${Math.round(n / 2 ** 20)} MB`;
/** The wrapper's names start with the prefix internal tables use, so no table of the file can be called one of them. */
const GUARD = '_fm_row_guard';
/** Connections that have the guard function (it is defined once: a function cannot be replaced while a statement is running). */
const guarded = new WeakSet<DatabaseSync>();
const quoted = (name: string) => `"${name.replace(/"/g, '""')}"`;

/** `terms` added as a balanced tree: SQLite refuses an expression more than 1000 levels deep, and a long chain of + is that deep. */
function sum(terms: string[]): string {
  if (terms.length === 1) return terms[0];
  const middle = terms.length >> 1;
  return `(${sum(terms.slice(0, middle))} + ${sum(terms.slice(middle))})`;
}

/**
 * `text` (one SELECT, no comments) prepared as
 *   WITH _fm_w(c0, ...) AS (SELECT * FROM (text) LIMIT -1 OFFSET 0)
 *   SELECT CASE WHEN <bytes of the row's text and blob values> > cap THEN _fm_row_guard() ELSE c0 END AS "name", c1 AS "name", ... FROM _fm_w
 * where the guard function throws error 812 from inside the statement, before the row is handed to JavaScript: no value
 * of a row that is too big is ever turned into a string. The OFFSET keeps SQLite from merging the query into the
 * outer select, which would run a column's expression again for each place it is used: each expression runs once per
 * row, as it does without the wrapper, and rows still stream, so a query that stops at the row limit does not have to
 * finish. Columns keep their names, order and number (a query may have all 2000 SQLite allows).
 */
export function boundedStatement(db: DatabaseSync, text: string, names: string[]): StatementSync {
  if (!names.length) return db.prepare(text);
  if (!guarded.has(db)) {
    db.function(GUARD, () => {
      throw new StoreError(812, `Exceeded host's capacity: a row of the query holds more than ${megabytes(SQL_ROW_LIMIT)} of text or blob values; select less of it (substr(), length()) or leave it out`);
    });
    guarded.add(db);
  }
  const body = text.replace(/[\s;]+$/, '');
  const slots = names.map((_, i) => `c${i}`);
  const bytes = sum(slots.map((c) => `CASE WHEN typeof(${c}) IN ('text', 'blob') THEN octet_length(${c}) ELSE 0 END`));
  const out = slots.map((c, i) => `${i === 0 ? `CASE WHEN ${bytes} > ${SQL_ROW_LIMIT} THEN ${GUARD}() ELSE ${c} END` : c} AS ${quoted(names[i])}`);
  return db.prepare(`WITH _fm_w(${slots.join(', ')}) AS (SELECT * FROM (${body}\n) LIMIT -1 OFFSET 0) SELECT ${out.join(', ')} FROM _fm_w`);
}

/**
 * The first `limit` rows of a bounded statement, as arrays, refusing (error 812) a total over SQL_RESULT_LIMIT: the
 * length of each string (one or two bytes a character in memory) and blob, and SQL_VALUE_COST for every value.
 */
export function collectRows(rows: Iterable<unknown[]>, limit: number): unknown[][] {
  const out: unknown[][] = [];
  let total = 0;
  for (const r of rows) {
    total += r.length * SQL_VALUE_COST;
    for (const v of r) total += typeof v === 'string' ? v.length : v instanceof Uint8Array ? v.byteLength : 0;
    if (total > SQL_RESULT_LIMIT) throw new StoreError(812, `Exceeded host's capacity: the query's result is larger than ${megabytes(SQL_RESULT_LIMIT)}; select fewer columns or rows (LIMIT) or smaller values`);
    out.push(r);
    if (out.length >= limit) break;
  }
  return out;
}
