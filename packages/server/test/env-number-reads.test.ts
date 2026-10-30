import { test } from 'node:test';
import assert from 'node:assert/strict';
import { uploadIdleMs, requestQueueLimit, containerLinkTtlMs, maxUpload, pgwireMaxParamBytes } from '../src/setting-values.ts';
import { MAX_UPLOAD } from '../src/uploads.ts';
import { PgServer } from '../src/pgwire.ts';
import type { Host } from '../src/host.ts';
import { RecordLocks, maxSessionLocks, MAX_SESSION_LOCKS } from '../../store/src/activity.ts';
import { minMs } from '../../store/src/trace.ts';

test('server number readers use defaults and reject ambiguous or out-of-range values', () => {
  const readers: [string, (env: NodeJS.ProcessEnv) => number, number, string, number, string][] = [
    ['TABULARIUS_UPLOAD_IDLE_HOURS', uploadIdleMs, 24 * 3_600_000, '0', 0, '87601'],
    ['TABULARIUS_REQUEST_QUEUE', requestQueueLimit, 64, '0', 0, '100001'],
    ['TABULARIUS_CONTAINER_TTL', containerLinkTtlMs, 3_600_000, '1', 1000, '3601'],
    ['TABULARIUS_MAX_UPLOAD', maxUpload, MAX_UPLOAD, '1024', 1024, '99999999999999999999'],
    ['TABULARIUS_PGWIRE_MAX_PARAM_BYTES', pgwireMaxParamBytes, 64 * 1024 * 1024, '1024', 1024, '99999999999999999999'],
    ['TABULARIUS_MAX_SESSION_LOCKS', maxSessionLocks, MAX_SESSION_LOCKS, '1024', 1024, '99999999999999999999'],
    ['TABULARIUS_TRACE_SQL_MIN_MS', minMs, 0, '1024', 1024, '86400001'],
  ];
  for (const [name, read, fallback, valid, expected, tooLarge] of readers) {
    assert.equal(read({}), fallback, `${name} default`);
    assert.equal(read({ [name]: valid }), expected, `${name} valid`);
    for (const value of ['1e3', '', '1.5', '-1', 'abc', tooLarge]) {
      assert.throws(() => read({ [name]: value }), new RegExp(`${name}.*whole number`), `${name}=${value}`);
    }
  }
  assert.throws(() => uploadIdleMs({ TABULARIUS_UPLOAD_IDLE_HOURS: '0.5' }), /TABULARIUS_UPLOAD_IDLE_HOURS.*whole number/);
  assert.throws(() => containerLinkTtlMs({ TABULARIUS_CONTAINER_TTL: '0' }), /TABULARIUS_CONTAINER_TTL.*whole number/);
});

test('SQL server validates the bound-parameter limit when constructed', (t) => {
  const name = 'TABULARIUS_PGWIRE_MAX_PARAM_BYTES';
  const saved = process.env[name];
  t.after(() => { if (saved === undefined) delete process.env[name]; else process.env[name] = saved; });
  process.env[name] = '1e3';
  assert.throws(() => new PgServer({} as Host, { port: 0 }), /TABULARIUS_PGWIRE_MAX_PARAM_BYTES.*whole number/);
  process.env[name] = '1000';
  const server = new PgServer({} as Host, { port: 0 });
  assert.equal(server.maxParamBytes, 1000);
  server.close();
});

test('record locks validate the environment default', (t) => {
  const name = 'TABULARIUS_MAX_SESSION_LOCKS';
  const saved = process.env[name];
  t.after(() => { if (saved === undefined) delete process.env[name]; else process.env[name] = saved; });
  process.env[name] = '1e3';
  assert.throws(() => new RecordLocks(), /TABULARIUS_MAX_SESSION_LOCKS.*whole number/);
  process.env[name] = '1000';
  assert.doesNotThrow(() => new RecordLocks());
});
