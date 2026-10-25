// A recursive query that never ends. node:sqlite runs a statement in one synchronous call, with no progress handler or
// interrupt to stop it by (and a worker thread cannot be stopped inside one: docs/pgwire-statement-deadline.md), so one
// `WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c) SELECT count(*) FROM c` held the whole server for ever.
// A query whose compiled program loops over a recursive queue is therefore run in a child process that is killed at a
// deadline. Everything else runs in this process, as before. This does not bound any other kind of query: a join of
// large tables, say, is as long as it was.

import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { StoreError } from './errors.ts';
import { decodeValue, encodeValue, type SqlValue } from './sql-recursive-codec.ts';
import { SQL_RESULT_LIMIT } from './sql-result.ts';

/** How long a recursive query may run before it is stopped (a property so a test can shorten it). */
export const RECURSIVE_SQL = { ms: 5000 };

/** One instruction of a compiled query, as EXPLAIN lists it. */
export interface Op { addr: number; opcode: string; p1: number; p2: number; p3: number; p4: string | null }

/**
 * Whether the program loops over a recursive queue: SQLite compiles a recursive CTE (with or without the RECURSIVE
 * keyword, which it does not need) to a loop that takes the first row of a queue (Rewind), removes it (Delete) and goes back
 * to the Rewind with what the step queued. A window function also deletes rows, but ends its loop with Next, not a jump back
 * to the Rewind.
 */
export function usesRecursion(ops: Op[]): boolean {
  return ops.some((d) => d.opcode === 'Delete'
    && ops.some((r) => r.opcode === 'Rewind' && r.p1 === d.p1 && r.addr < d.addr
      && ops.some((g) => g.opcode === 'Goto' && g.p2 === r.addr && g.addr > d.addr)));
}

let builtins: Set<string> | undefined;
/** The functions SQLite has built in (a fresh connection has no others). */
function builtinFunctions(): Set<string> {
  if (!builtins) {
    const db = new DatabaseSync(':memory:');
    try { builtins = new Set((db.prepare('PRAGMA function_list').all() as { name: string }[]).map((f) => f.name.toLowerCase())); }
    finally { db.close(); }
  }
  return builtins;
}

/** A function the program calls that SQLite does not have built in (one the store defined), if any: the child does not have it. */
export function customFunction(ops: Op[]): string | undefined {
  for (const op of ops) {
    if (!['Function', 'PureFunc', 'AggStep', 'AggStep0', 'AggFinal', 'AggValue', 'AggInverse'].includes(op.opcode)) continue;
    const name = (op.p4 ?? '').replace(/\(-?\d+\)$/, '').toLowerCase();
    if (name && !builtinFunctions().has(name)) return name;
  }
  return undefined;
}

const MAX_OUTPUT = 300 * 2 ** 20;

/** The rows of `text` (a checked, read-only query), read by a child process of this file that is killed after RECURSIVE_SQL.ms. */
export function recursiveRows(file: string, text: string, params: SqlValue[], names: string[], limit: number, views: string[]): SqlValue[][] {
  const seconds = RECURSIVE_SQL.ms / 1000;
  const stopped = () => new StoreError(812, `Exceeded host's capacity: a recursive query ran longer than ${seconds} seconds and was stopped; make it end sooner (a condition in the recursive part, or a smaller range)`);
  const child = spawnSync(process.execPath, ['--max-old-space-size=1024', fileURLToPath(new URL('./sql-child.ts', import.meta.url))], {
    input: JSON.stringify({ path: file, text, params: params.map(encodeValue), names, limit, views }),
    encoding: 'utf8', timeout: RECURSIVE_SQL.ms, killSignal: 'SIGKILL', maxBuffer: MAX_OUTPUT, cwd: tmpdir(), windowsHide: true,
  });
  if (child.error) {
    const code = (child.error as NodeJS.ErrnoException).code;
    if (code === 'ETIMEDOUT') throw stopped();
    if (code === 'ENOBUFS') throw new StoreError(812, `Exceeded host's capacity: the query's result is larger than ${Math.round(SQL_RESULT_LIMIT / 2 ** 20)} MB; select fewer columns or rows (LIMIT) or smaller values`);
    throw new StoreError(8310, 'A recursive query could not be run: the process for it did not start');
  }
  if (child.signal) throw stopped();
  let answer: { rows?: unknown[][]; error?: { code: number; message: string } };
  try { answer = JSON.parse(child.stdout); }
  catch { throw new StoreError(8310, 'A recursive query could not be run: the process for it did not answer'); }
  if (answer.error) throw new StoreError(answer.error.code, answer.error.message);
  return (answer.rows ?? []).map((r) => r.map(decodeValue));
}
