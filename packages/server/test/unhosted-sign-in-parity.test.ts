// A wrong password for a file name that is not hosted must lock, answer and cost exactly as one for a hosted file does, on the
// Data API, OData, XML and SQL-over-HTTP routes, so nobody guessing names can tell a hosted file from a missing one by the
// answers, by whether a lock appears, or by how long a request takes (one count of password-hash jobs per request stands for the
// time). The missing name is checked on the routes where the file lists are off, which is the default.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { syncBuiltinESMExports } from 'node:module';
import { LOCKOUT } from '../../store/src/index.ts';
import { basic, setup } from './lockout-matrix-helpers.ts';

test('wrong passwords for a missing file lock, answer and hash exactly as for a hosted file', { timeout: 300_000 }, async (t) => {
  const s = await setup(t);
  const jobs = t.mock.method(crypto, 'scrypt', ((...args: unknown[]) => {
    const length = args[2] as number;
    const callback = (typeof args[3] === 'function' ? args[3] : args[4]) as (error: Error | null, key: Buffer) => void;
    queueMicrotask(() => callback(null, Buffer.alloc(length)));
  }) as typeof crypto.scrypt);
  syncBuiltinESMExports();
  t.after(() => { jobs.mock.restore(); syncBuiltinESMExports(); });

  type Route = (db: string, name: string, from: string) => Promise<Response>;
  const routes: Record<string, Route> = {
    'Data API': (db, name, from) => s.json(`/fmi/data/vLatest/databases/${db}/sessions`, {}, { authorization: basic(name) }, from),
    'OData': (db, name, from) => s.call(`/fmi/odata/v4/${db}`, { headers: { authorization: basic(name) } }, from),
    'XML': (db, name, from) => s.call(`/fmi/xml/fmresultset.xml?-db=${db}&-lay=Items&-findall`, { headers: { authorization: basic(name) } }, from),
    'SQL over HTTP': (db, name, from) => s.call(`/tabularius/sql/v1/databases/${db}/tables`, { headers: { authorization: basic(name) } }, from),
  };
  let octet = 0;
  const fresh = () => `198.51.100.${++octet}`;
  const run = async (route: Route, db: string, from: string, names: string[]) => {
    const seen = [];
    for (const name of names) {
      const before = jobs.mock.callCount();
      const res = await route(db, name, from);
      const body = (await res.text()).replaceAll(db, '<file>').replace(/\d{4}-\d\d-\d\dT[\d:.]+Z/g, '<time>');
      seen.push({ status: res.status, retryAfter: res.headers.has('retry-after'), hashJobs: jobs.mock.callCount() - before, body });
    }
    return seen;
  };
  const sameAccount = Array.from({ length: LOCKOUT.attempts + 2 }, () => 'Alice');
  const manyNames = Array.from({ length: LOCKOUT.addressAttempts + 2 }, (_, i) => `who${i}`);
  for (const [label, route] of Object.entries(routes)) {
    for (const [which, names] of [['one account, repeated', sameAccount], ['a different name each time', manyNames]] as const) {
      const hosted = await run(route, 'Synthetic', fresh(), [...names]);
      const missing = await run(route, 'Nope', fresh(), [...names]);
      assert.ok(hosted.some((a) => a.retryAfter), `${label}: ${which}: the hosted file locks`);
      assert.deepEqual(missing, hosted, `${label}: ${which}`);
    }
  }
});
