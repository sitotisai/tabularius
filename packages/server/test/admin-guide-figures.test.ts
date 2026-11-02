import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ACCOUNT_IMPORT_MAX_BYTES } from '../../store/src/account-provisioning.ts';
import { LOCK_TTL_MS } from '../../store/src/activity.ts';
import { validAccountImportName } from '../../store/src/security-names.ts';
import { EDGE_LIMITS } from '../src/edge-limits.ts';
import { CONTAINER_PULL_MAX_BYTES } from '../src/fms-sync.ts';
import { AUTH_BODY_LIMIT } from '../src/request-body.ts';
import { PRE_AUTH_BODY_LIMIT } from '../src/request-gate.ts';

const root = new URL('../../../', import.meta.url);
const read = (file: string): string => readFileSync(new URL(file, root), 'utf8');
const admin = read('ADMIN.md').replace(/\s+/g, ' ');
const sentence = (pattern: RegExp): RegExpMatchArray => {
  const match = admin.match(pattern);
  assert.ok(match, `ADMIN.md no longer matches ${pattern}; update this test with the page`);
  return match;
};
const source = (file: string, pattern: RegExp): number[] => {
  const match = read(file).match(pattern);
  assert.ok(match, `${file} no longer matches ${pattern}`);
  return match.slice(1).map((value) => Number(value.replace(/[_ ,]/g, '')));
};
const number = (value: string): number => Number(value.replace(/,/g, ''));
const cliMain = read('packages/cli/src/main.ts');
const activity = read('packages/store/src/activity.ts');

test('ADMIN.md: the connection limits and the slowest upload the server accepts', () => {
const connections = sentence(/\*\*(\d+) simultaneous connections per client address\*\* and ([\d,]+) connections in total/);
  assert.deepEqual([number(connections[1]), number(connections[2])], [EDGE_LIMITS.connectionsPerAddress, EDGE_LIMITS.connections]);

  const deadline = sentence(/within (\d+) seconds in total once the server has let the request in, \d+ seconds per (\d+) KiB declared/);
  assert.deepEqual([number(deadline[1]), number(deadline[2])], [EDGE_LIMITS.smallBodyMs / 1000, AUTH_BODY_LIMIT / 1024]);

  const slowSender = sentence(/a sender slower than about (\d+) KB\/s is cut off with `408`/);
  const slowest = Math.floor(AUTH_BODY_LIMIT / (EDGE_LIMITS.smallBodyMs / 1000) / 1000);
  assert.equal(number(slowSender[1]), slowest);
  const slowChunked = sentence(/a chunked upload that streams slower than about (\d+) KB\/s gets `408`/);
  assert.equal(number(slowChunked[1]), Math.floor(PRE_AUTH_BODY_LIMIT / (EDGE_LIMITS.smallBodyMs / 1000) / 1000));
});

test('ADMIN.md: the account import limits', () => {
  const limits = sentence(/limited to (\d+) MiB, with ([\d,]+) rows and (\d+) characters per account\/privilege-set name/);
  assert.equal(number(limits[1]) * 2 ** 20, ACCOUNT_IMPORT_MAX_BYTES);
  const [rowLimit] = source('packages/store/src/account-provisioning.ts', /records\.length > ([\d_]+)\) throw new AccountImportError\('too-many-rows'/);
  assert.equal(number(limits[2]), rowLimit);
  const nameLimit = number(limits[3]);
  assert.equal(validAccountImportName('a'.repeat(nameLimit)), true);
  assert.equal(validAccountImportName('a'.repeat(nameLimit + 1)), false);

  const rates = sentence(/allow (\d+) previews and (\d+) applies per minute per actor\/file, plus ([\d,]+) requests per minute per IP\/file/);
  assert.deepEqual([number(rates[1]), number(rates[2]), number(rates[3])], source('packages/store/src/store.ts', /count >= \(kind === 'preview' \? (\d+) : kind === 'apply' \? (\d+) : (\d+)\)\) throw new AccountImportError\('import-rate-limit', 429\)/));

  assert.match(admin, /Four import requests may run concurrently per serving process/);
  assert.equal(source('packages/server/src/account-provisioning.ts', /this\.active >= (\d+)\) throw new AccountImportError\('import-busy', 429\)/)[0], 4);
  const retry = sentence(/Throttling returns `429` with `Retry-After: (\d+)`/);
  assert.equal(number(retry[1]), source('packages/server/src/account-provisioning.ts', /status === 429 \? \{ 'retry-after': '(\d+)' \}/)[0]);
});

test('ADMIN.md: the upgrade wait, the record-lease times and the size of a container the sync carries', () => {
  const waits = sentence(/waits up to (\d+) seconds \(`--wait`\) for its health check.*?no server process for (\d+) seconds/);
  const [waitMs] = source('packages/cli/src/service.ts', /ms = ([\d_]+), watch\?: \{ folder: string; deadMs\?: number \}/);
  const [deadMs] = source('packages/cli/src/service.ts', /watch\?\.deadMs \?\? ([\d_]+);/);
  assert.deepEqual([number(waits[1]) * 1000, number(waits[2]) * 1000], [waitMs, deadMs]);
  assert.ok(cliMain.includes(`tabularius upgrade [--no-backup] [--wait ${number(waits[1])}]`));

  const leases = sentence(/Record leases expire after (\d+) seconds without renewal\. An open script transaction renews every lock it uses every (\d+) seconds/);
  assert.deepEqual([number(leases[1]) * 1000, number(leases[2]) * 1000], [LOCK_TTL_MS, LOCK_TTL_MS / 2]);
  assert.match(activity, /nextRenewal = now \+ LOCK_TTL_MS \/ 2/);

  const container = sentence(/Either way a file is up to (\d+) MB/);
  assert.equal(number(container[1]) * 2 ** 20, CONTAINER_PULL_MAX_BYTES);
});
