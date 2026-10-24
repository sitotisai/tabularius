// Bounds the size of the result of SQL a person or an AI wrote. node:sqlite turns every column into a JavaScript string
// or Uint8Array with no cap: one value past V8's string limit (about 512M characters) aborts the whole process with no
// error to catch, and rows that are wide but few enough for the row limit can fill the heap. SQLite's own length limit
// cannot be set from node:sqlite, so the query is wrapped to add up the bytes of each row's text and blob values, to
// hand back NULLs for a row over the cap, and the rows collected here stop at a total size.

import type { DatabaseSync, StatementSync } from 'node:sqlite';
import { StoreError } from './errors.ts';

/** The most bytes of text and blob values one row of a query's result may hold. */
export const SQL_ROW_LIMIT = 64 * 2 ** 20;
/** The most bytes all the rows of one result may add up to. */
export const SQL_RESULT_LIMIT = 256 * 2 ** 20;

const megabytes = (n: number) => `${Math.round(n / 2 ** 20)} MB`;
/** The wrapper's names start with the prefix internal tables use, so no table of the file can be called one of them. */
const BYTES = '_fm_row_bytes';
const quoted = (name: string) => `"${name.replace(/"/g, '""')}"`;

/**
 * `text` (one SELECT, no comments) prepared as
 *   WITH _fm_w(c0, ...) AS (SELECT * FROM (text) LIMIT -1 OFFSET 0),
 *        _fm_s(c0, ..., t) AS (SELECT c0, ..., <bytes of the text and blob values> FROM _fm_w LIMIT -1 OFFSET 0)
 *   SELECT CASE WHEN t > cap THEN NULL ELSE c0 END AS "name", ..., t FROM _fm_s
 * so a row over the cap comes back as NULLs and its byte count (a value is never turned into a JavaScript string when
 * the row is too big). The OFFSET keeps SQLite from merging a layer into the next one, which would run a column's
 * expression again for each place it is used: each expression runs once per row, as it does without the wrapper, and
 * rows still stream, so a query that stops at the row limit does not have to finish. Columns keep their names and order.
 */
export function boundedStatement(db: DatabaseSync, text: string, names: string[]): StatementSync {
  if (!names.length) return db.prepare(text);
  const body = text.replace(/[\s;]+$/, '');
  const slots = names.map((_, i) => `c${i}`);
  const bytes = slots.map((c) => `CASE WHEN typeof(${c}) IN ('text', 'blob') THEN octet_length(${c}) ELSE 0 END`).join(' + ');
  const out = slots.map((c, i) => `CASE WHEN t > ${SQL_ROW_LIMIT} THEN NULL ELSE ${c} END AS ${quoted(names[i])}`);
  return db.prepare(`WITH _fm_w(${slots.join(', ')}) AS (SELECT * FROM (${body}\n) LIMIT -1 OFFSET 0), `
    + `_fm_s(${slots.join(', ')}, t) AS (SELECT ${slots.join(', ')}, ${bytes} FROM _fm_w LIMIT -1 OFFSET 0) `
    + `SELECT ${out.join(', ')}, t AS ${BYTES} FROM _fm_s`);
}

/**
 * The first `limit` rows of a statement made by `boundedStatement`, as arrays, refusing (error 812) a row or a total
 * over the caps. Sizes are the UTF-8 bytes SQLite reports, counted before a row is turned into JavaScript values.
 */
export function collectRows(rows: Iterable<unknown[]>, limit: number): unknown[][] {
  const out: unknown[][] = [];
  let total = 0;
  for (const r of rows) {
    const size = Number(r.pop());
    if (size > SQL_ROW_LIMIT) throw new StoreError(812, `Exceeded host's capacity: a row of the query holds more than ${megabytes(SQL_ROW_LIMIT)} of text or blob values; select less of it (substr(), length()) or leave it out`);
    total += size;
    if (total > SQL_RESULT_LIMIT) throw new StoreError(812, `Exceeded host's capacity: the query's result is larger than ${megabytes(SQL_RESULT_LIMIT)}; select fewer columns or rows (LIMIT) or smaller values`);
    out.push(r);
    if (out.length >= limit) break;
  }
  return out;
}
