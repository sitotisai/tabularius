// Runs one read-only query for sql-recursive.ts in a process of its own, so the parent can stop it. Reads one JSON request on
// stdin (the file, the statement, its parameters, the result columns, the row limit, and the views the file's SQL sees),
// answers one JSON line on stdout: the rows, or the error (a code and a message). It opens the file read-only and knows no
// function but SQLite's own: the parent sends here only a query that uses no other.

import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { boundedStatement, collectRows } from './sql-result.ts';
import { StoreError } from './errors.ts';
import { decodeValue, encodeValue } from './sql-recursive-codec.ts';

const request = JSON.parse(readFileSync(0, 'utf8')) as { path: string; text: string; params: unknown[]; names: string[]; limit: number; views: string[] };
let answer: unknown;
try {
  const db = new DatabaseSync(request.path, { readOnly: true });
  for (const view of request.views) db.exec(view);
  const statement = boundedStatement(db, request.text, request.names);
  statement.setReturnArrays(true);
  const rows = collectRows(statement.iterate(...request.params.map(decodeValue) as never[]) as Iterable<unknown[]>, request.limit);
  answer = { rows: rows.map((r) => r.map(encodeValue)) };
} catch (e) {
  answer = { error: { code: e instanceof StoreError ? e.code : 8310, message: e instanceof Error ? e.message : String(e) } };
}
process.stdout.write(JSON.stringify(answer) + '\n');
