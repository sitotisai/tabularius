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
import { resolve } from 'node:path';
import { StoreError } from './errors.ts';
import { decodeValue, encodeValue, type SqlValue } from './sql-recursive-codec.ts';
import { SQL_RESULT_LIMIT } from './sql-result.ts';

/**
 * How long a recursive query may run before it is stopped, and the heap its process may use (properties so a test can change
 * them), and the program that runs the child: this process's own executable, which in the release is the single-file program.
 * The deadline is a constant of the server, not a setting.
 */
export const RECURSIVE_SQL = { ms: 5000, heapMb: 1024, execPath: process.execPath };

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

/** A function the store defined that the child process can import: the export `export` of the module at address `module`. */
export interface PortableFunction { module: string; export: string }

/** Whether SQLite has a function of this name built in (a fresh connection has no others). */
export function isBuiltinFunction(name: string): boolean {
  return builtinFunctions().has(name.toLowerCase());
}

/** The functions the program calls, lower case, each once. */
export function calledFunctions(ops: Op[]): string[] {
  const names = new Set<string>();
  for (const op of ops) {
    if (!['Function', 'PureFunc', 'AggStep', 'AggStep0', 'AggFinal', 'AggValue', 'AggInverse'].includes(op.opcode)) continue;
    const name = (op.p4 ?? '').replace(/\(-?\d+\)$/, '').toLowerCase();
    if (name) names.add(name);
  }
  return [...names];
}

const MAX_OUTPUT = 300 * 2 ** 20;

/** The program, arguments and environment that start the child, for a launcher that runs a helper script only as its first argument. */
export function childCommand(): { file: string; args: string[]; env: NodeJS.ProcessEnv } {
  // Started the way the server starts its other helper processes (odata.ts, cluster.ts): the single-file program's launcher
  // (scripts/release/launcher.cjs) skips `--no-warnings`, then runs the script that comes first as the helper; it does not read
  // Node's flags from its command line, so the heap cap goes in NODE_OPTIONS, which it reads. The child gets only the
  // environment it needs, not the server's secrets. TZ is among it: the time functions (CURTIME, NOW, SQLite's 'localtime') read the zone.
  const env: NodeJS.ProcessEnv = { NODE_OPTIONS: `--max-old-space-size=${RECURSIVE_SQL.heapMb}` };
  for (const k of ['PATH', 'HOME', 'USERPROFILE', 'TMPDIR', 'TEMP', 'TMP', 'SystemRoot', 'TABULARIUS_HOME', 'OPENHBAM_HOME', 'TZ']) {
    if (process.env[k] !== undefined) env[k] = process.env[k];
  }
  return { file: RECURSIVE_SQL.execPath, args: ['--no-warnings', fileURLToPath(new URL('./sql-child.ts', import.meta.url))], env };
}

const OUT_OF_MEMORY = /heap out of memory|allocation failed/i;

/** The rows of `text` (a checked, read-only query), read by a child process of this file that is killed after RECURSIVE_SQL.ms. */
export function recursiveRows(file: string, text: string, params: SqlValue[], names: string[], limit: number, views: string[], functions: (PortableFunction & { name: string })[] = []): SqlValue[][] {
  const seconds = RECURSIVE_SQL.ms / 1000;
  const stopped = () => new StoreError(812, `Exceeded host's capacity: a recursive query ran longer than ${seconds} seconds and was stopped; make it end sooner (a condition in the recursive part, or a smaller range)`);
  const memory = () => new StoreError(812, `Exceeded host's capacity: a recursive query used more than ${RECURSIVE_SQL.heapMb} MB of memory and was stopped; make it produce fewer or smaller rows`);
  const command = childCommand();
  // The limit and the values go as JSON, which has no form for Infinity (a request for every row), a blob or a bigint.
  const child = spawnSync(command.file, command.args, {
    // The child runs in the temp folder, so a path given relative to the server's folder is made absolute here.
    input: JSON.stringify({ path: resolve(file), text, params: params.map(encodeValue), names, limit: encodeValue(limit), views, functions }),
    encoding: 'utf8', timeout: RECURSIVE_SQL.ms, killSignal: 'SIGKILL', maxBuffer: MAX_OUTPUT, cwd: tmpdir(), windowsHide: true, env: command.env,
  });
  const stderr = (child.stderr ?? '').slice(-2000).trim();
  // EPIPE: the child ended before it read the request (it was killed, or could not start Node), which the signal or the
  // missing answer below tells.
  if (child.error && (child.error as NodeJS.ErrnoException).code !== 'EPIPE') {
    const code = (child.error as NodeJS.ErrnoException).code;
    if (code === 'ETIMEDOUT') throw stopped();
    if (code === 'ENOBUFS') throw new StoreError(812, `Exceeded host's capacity: the query's result is larger than ${Math.round(SQL_RESULT_LIMIT / 2 ** 20)} MB; select fewer columns or rows (LIMIT) or smaller values`);
    throw new StoreError(8310, 'A recursive query could not be run: the process for it did not start');
  }
  // Killed, but not by the deadline (that is the ETIMEDOUT above): out of memory, in V8 (it aborts, naming the heap) or for
  // the system (a kill with no word). Anything else is a fault, which the server's log gets and the client does not.
  if (child.signal) {
    if (OUT_OF_MEMORY.test(stderr) || child.signal === 'SIGKILL') throw memory();
    console.error(`A recursive query's process stopped (${child.signal})${stderr ? `: ${stderr.split('\n').slice(-3).join(' ')}` : ''}`);
    throw new StoreError(8310, 'A recursive query could not be run: the process for it stopped unexpectedly');
  }
  let answer: { rows?: unknown[][]; error?: { code: number; message: string } };
  try { answer = JSON.parse(child.stdout); }
  catch {
    if (OUT_OF_MEMORY.test(stderr)) throw memory();
    console.error(`A recursive query's process gave no answer (exit ${child.status})${stderr ? `: ${stderr.split('\n').slice(-3).join(' ')}` : ''}`);
    throw new StoreError(8310, 'A recursive query could not be run: the process for it did not answer');
  }
  if (answer.error) throw new StoreError(answer.error.code, answer.error.message);
  return (answer.rows ?? []).map((r) => r.map(decodeValue));
}
