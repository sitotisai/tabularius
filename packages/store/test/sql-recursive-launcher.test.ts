// The child process of a recursive query is started the way the release program can run it, and its ending is told apart:
// the deadline, the memory cap, a kill by the system, a process that does not answer.
//
// The release program (scripts/release/launcher.cjs) is not built here. This test runs the child through a stand-in that
// takes the launcher's rules for a helper process (see `launcher` below, checked against the launcher's own text), so a
// command line the real launcher would read as a command is caught; whether the packed program unpacks and runs it is not.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store, StoreError } from '../src/index.ts';
import { childCommand, RECURSIVE_SQL } from '../src/sql-recursive.ts';

const posix = process.platform !== 'win32';
const REC = 'with recursive c(x) as (select 1 union all select x + 1 from c where x < 5) select x from c';

function fixture(t: { after: (fn: () => void) => void }) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-sql-launcher-'));
  const path = join(dir, 'L.sqlite');
  createStore(path);
  const store = new Store(path);
  const was = { ...RECURSIVE_SQL };
  t.after(() => { Object.assign(RECURSIVE_SQL, was); store.close(); rmSync(dir, { recursive: true, force: true }); });
  return { store, dir };
}

/** A program that stands in for the release executable: what scripts/release/launcher.cjs does with its arguments. */
function launcher(dir: string, report: string): string {
  const js = join(dir, 'launcher.cjs');
  writeFileSync(js, `
'use strict';
const { existsSync, writeFileSync } = require('node:fs');
const { createRequire } = require('node:module');
writeFileSync(${JSON.stringify(report)}, JSON.stringify({ env: Object.keys(process.env), heapMb: require('node:v8').getHeapStatistics().heap_size_limit / 1048576 }));
const args = process.argv.slice(2);
if (args[0] === '--no-warnings') args.shift();
if (args[0] === '--eval') args.splice(0, 2);
const entry = args.length && /\\.(ts|js|mjs|cjs)$/.test(args[0]) && existsSync(args[0]) ? args.shift() : null;
if (!entry) { console.error('unknown command ' + args[0]); process.exit(1); }
process.argv = [process.execPath, entry, ...args];
createRequire(entry)(entry);
`);
  const sh = join(dir, 'tabularius-stand-in');
  writeFileSync(sh, `#!/bin/sh\nexec ${JSON.stringify(process.execPath)} ${JSON.stringify(js)} "$@"\n`);
  chmodSync(sh, 0o755);
  return sh;
}

test('the stand-in follows the launcher it stands for', () => {
  const text = readFileSync(new URL('../../../scripts/release/launcher.cjs', import.meta.url), 'utf8');
  for (const rule of [
    "if (args[0] === '--no-warnings') args.shift();",
    "if (args[0] === '--eval') args.splice(0, 2);",
    'args.length && /\\.(ts|js|mjs|cjs)$/.test(args[0]) && existsSync(args[0])',
    'createRequire(entry)(entry);',
  ]) assert.ok(text.includes(rule), `scripts/release/launcher.cjs no longer has: ${rule}; update the stand-in in this test to match`);
});

test('the child command line is one the launcher runs as a helper, with the memory cap in the environment', () => {
  const c = childCommand();
  assert.equal(c.args[0], '--no-warnings');
  assert.ok(c.args.length === 2 && /sql-child\.ts$/.test(c.args[1]), 'the script comes right after --no-warnings, nothing else is a flag');
  assert.ok(!c.args.some((a) => a.startsWith('--max-old-space-size')), 'the launcher does not read Node flags from its command line');
  assert.equal(c.env.NODE_OPTIONS, `--max-old-space-size=${RECURSIVE_SQL.heapMb}`);
});

test('the child gets a reduced environment, not the server\'s', (t) => {
  const name = ['TABULARIUS', 'ENCRYPTION', 'KEY'].join('_');
  const was = process.env[name];
  process.env[name] = 'not-a-real-value';
  t.after(() => { if (was === undefined) delete process.env[name]; else process.env[name] = was; });
  const env = childCommand().env;
  assert.equal(env[name], undefined);
  assert.ok(Object.keys(env).every((k) => ['NODE_OPTIONS', 'PATH', 'HOME', 'USERPROFILE', 'TMPDIR', 'TEMP', 'TMP', 'SystemRoot', 'TABULARIUS_HOME', 'OPENHBAM_HOME', 'TZ'].includes(k)), Object.keys(env).join(', '));
});

test('a recursive query runs through a launcher that reads its command line as the release program does', { skip: !posix }, (t) => {
  const { store, dir } = fixture(t);
  const report = join(dir, 'report.json');
  RECURSIVE_SQL.execPath = launcher(dir, report);
  RECURSIVE_SQL.heapMb = 200;
  RECURSIVE_SQL.ms = 30_000;
  assert.deepEqual(store.select(REC).rows, [[1], [2], [3], [4], [5]]);
  const seen = JSON.parse(readFileSync(report, 'utf8')) as { env: string[]; heapMb: number };
  assert.ok(seen.heapMb < 400, `the memory cap reached the process: ${seen.heapMb} MB`);
  assert.ok(!seen.env.includes('TABULARIUS_ENCRYPTION_KEY') && !seen.env.some((k) => /SECRET|PASSWORD|TOKEN/.test(k)), seen.env.join(', '));
});

test('a launcher that would read the old command line as a command fails the query with a clear refusal', { skip: !posix }, (t) => {
  const { store, dir } = fixture(t);
  // What the release program did with `--max-old-space-size=1024 sql-child.ts` first: it ran the command line instead.
  const sh = join(dir, 'old-style');
  writeFileSync(sh, '#!/bin/sh\necho "unknown command $1" >&2\nexit 1\n');
  chmodSync(sh, 0o755);
  RECURSIVE_SQL.execPath = sh;
  const was = console.error;
  const logged: string[] = [];
  console.error = (...a: unknown[]) => { logged.push(a.join(' ')); };
  t.after(() => { console.error = was; });
  assert.throws(() => store.select(REC), (e: unknown) => e instanceof StoreError && e.code === 8310 && /did not answer/.test(e.message));
  assert.ok(logged.some((l) => /unknown command/.test(l)), 'the server log says why');
});

test('a child that runs out of memory, or is killed by the system, is not reported as the deadline', { skip: !posix }, (t) => {
  const { store, dir } = fixture(t);
  const script = (name: string, body: string) => {
    const sh = join(dir, name);
    writeFileSync(sh, `#!/bin/sh\n${body}\n`);
    chmodSync(sh, 0o755);
    return sh;
  };
  const was = console.error;
  console.error = () => {};
  t.after(() => { console.error = was; });
  RECURSIVE_SQL.ms = 30_000;
  const memory = (e: unknown) => e instanceof StoreError && e.code === 812 && /used more than \d+ MB of memory/.test(e.message) && !/longer than/.test(e.message);
  RECURSIVE_SQL.execPath = script('v8-oom', 'echo "FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory" >&2\nkill -ABRT $$');
  assert.throws(() => store.select(REC), memory);
  RECURSIVE_SQL.execPath = script('oom-killed', 'kill -KILL $$');
  assert.throws(() => store.select(REC), memory);
  RECURSIVE_SQL.execPath = script('other-signal', 'kill -TERM $$');
  assert.throws(() => store.select(REC), (e: unknown) => e instanceof StoreError && e.code === 8310 && /stopped unexpectedly/.test(e.message));
  // The deadline is still the deadline.
  RECURSIVE_SQL.ms = 400;
  RECURSIVE_SQL.execPath = script('slow', 'sleep 5');
  assert.throws(() => store.select(REC), (e: unknown) => e instanceof StoreError && e.code === 812 && /longer than 0\.4 seconds/.test(e.message));
});
