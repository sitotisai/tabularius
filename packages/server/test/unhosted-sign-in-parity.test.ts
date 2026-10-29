// A wrong password for a missing file name must lock, answer, and cost exactly as for a hosted file on routes where file lists are off.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { syncBuiltinESMExports } from 'node:module';
import { setup, basic } from './lockout-matrix-helpers.ts';
import { LOCKOUT } from '../../store/src/index.ts';

test('missing file sign-in failures match hosted file lockout, answers, and hashing', async (t) => {
  const s = await setup(t);
  const jobs = t.mock.method(crypto, 'scrypt', ((_p: unknown, _s: unknown, length: number, ...args: unknown[]) => {
    const callback = args.find((arg) => typeof arg === 'function') as (error: Error | null, key: Buffer) => void;
    queueMicrotask(() => callback(null, Buffer.alloc(length)));
  }) as typeof crypto.scrypt);
  syncBuiltinESMExports();
  t.after(() => { jobs.mock.restore(); syncBuiltinESMExports(); });

  const routes: [string, (db: string, name: string, from: string) => Promise<Response>][] = [
    ['Data API', (db, name, from) => s.json(`/fmi/data/vLatest/databases/${db}/sessions`, {}, { authorization: basic(name) }, from)],
    ['OData', (db, name, from) => s.call(`/fmi/odata/v4/${db}`, { headers: { authorization: basic(name) } }, from)],
    ['XML', (db, name, from) => s.call(`/fmi/xml/fmresultset.xml?-db=${db}&-lay=Items&-findall`, { headers: { authorization: basic(name) } }, from)],
    ['SQL', (db, name, from) => s.call(`/tabularius/sql/v1/databases/${db}/tables`, { headers: { authorization: basic(name) } }, from)],
  ];
  let address = 0;
  const run = async (route: (db: string, name: string, from: string) => Promise<Response>, db: string, names: string[]) => {
    const from = `198.51.100.${++address}`;
    const answers = [];
    for (const name of names) {
      const before = jobs.mock.callCount();
      const response = await route(db, name, from);
      const body = (await response.text()).replace(/\d{4}-\d\d-\d\dT[\d:.]+Z/g, '<time>');
      answers.push({ status: response.status, retry: response.headers.has('retry-after'), hashes: jobs.mock.callCount() - before, body });
    }
    return answers;
  };

  const mismatches: string[] = [];
  for (const [label, route] of routes) {
    for (const [which, names] of [
      ['account', Array.from({ length: LOCKOUT.attempts + 2 }, () => 'Alice')],
      ['address', Array.from({ length: LOCKOUT.addressAttempts + 2 }, (_, i) => `who${i}`)],
    ] as const) {
      const hosted = await run(route, 'Synthetic', names);
      const missing = await run(route, 'Nope', names);
      try {
        assert.deepEqual(missing, hosted, `${label}: ${which} comparison`);
      } catch {
        const index = missing.findIndex((answer, i) => JSON.stringify(answer) !== JSON.stringify(hosted[i]));
        mismatches.push(`${label}: ${which}, request ${index + 1}: hosted=${JSON.stringify(hosted[index])}; missing=${JSON.stringify(missing[index])}`);
      }
    }
  }
  assert.deepEqual(mismatches, [], 'lockout parity differences:\n' + mismatches.join('\n'));
});
