// Runs one read-only query for sql-recursive.ts in a process of its own, so the parent can stop it. Reads one JSON request on
// stdin (the file, the statement, its parameters, the result columns, the row limit, and the views the file's SQL sees),
// answers one JSON line on stdout: the rows, or the error (a code and a message). It opens the file read-only and knows no
// function but SQLite's own, the ones the store defines in place of or beside them (sql-shared-functions.ts, the same code
// the store runs) and the portable ones the request names (a module address and an export each, which the store that defined
// them gave): the parent sends here only a query that uses no other.
//
// The release program's launcher runs this file with require(), so it has no top-level await.

import { DatabaseSync, type SQLInputValue, type SQLOutputValue } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { boundedStatement, collectRows } from './sql-result.ts';
import { StoreError } from './errors.ts';
import { decodeValue, encodeValue } from './sql-recursive-codec.ts';
import { registerSharedSqlFunctions } from './sql-shared-functions.ts';

interface Request { path: string; text: string; params: unknown[]; names: string[]; limit: unknown; views: string[]; functions?: { name: string; module: string; export: string }[] }

async function run(request: Request): Promise<unknown> {
  const db = new DatabaseSync(request.path, { readOnly: true });
  registerSharedSqlFunctions(db);
  for (const f of request.functions ?? []) {
    const fn = ((await import(f.module)) as Record<string, unknown>)[f.export];
    if (typeof fn !== 'function') throw new StoreError(8310, `${f.name}() could not be loaded for a recursive query`);
    db.function(f.name, { varargs: true }, fn as (...a: SQLOutputValue[]) => SQLInputValue);
  }
  for (const view of request.views) db.exec(view);
  const statement = boundedStatement(db, request.text, request.names);
  statement.setReturnArrays(true);
  // The limit crossed as JSON: an unlimited one (Infinity) is written out and read back, not a null.
  const limit = Number(decodeValue(request.limit));
  const rows = collectRows(statement.iterate(...request.params.map(decodeValue) as never[]) as Iterable<unknown[]>, limit);
  return { rows: rows.map((r) => r.map(encodeValue)) };
}

run(JSON.parse(readFileSync(0, 'utf8')) as Request)
  .catch((e: unknown) => ({ error: { code: e instanceof StoreError ? e.code : 8310, message: e instanceof Error ? e.message : String(e) } }))
  .then((answer) => { process.stdout.write(JSON.stringify(answer) + '\n'); });
