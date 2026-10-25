// A recursive query over the SQL port gives all its rows when the row cap is off (TABULARIUS_PGWIRE_MAX_ROWS=0), as it does
// under a cap: the unlimited row count must reach the process that runs the query.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Host } from '../src/host.ts';
import { PgServer } from '../src/pgwire.ts';
import { createStore } from '../../store/src/index.ts';
import { PgClient } from './pg-client.ts';

const REC10 = 'with recursive c(x) as (select 1 union all select x+1 from c where x<10) select x from c';

test('a recursive query returns every row with the cap off and with a cap above it', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-pg-recursive-'));
  createStore(join(dir, 'Synthetic.openhbam.sqlite'));
  const host = new Host(dir), pg = new PgServer(host, { port: 0 });
  const store = host.get('Synthetic')!;
  const full = store.privilegeSets().find((p) => p.name === '[Full Access]')!;
  store.savePrivilegeSet({ ...full, extendedPrivileges: [...new Set([...full.extendedPrivileges, 'fmxdbc'])] });
  store.setPassword('Alice', 'correct', '[Full Access]');
  const port = await pg.listen();
  const was = process.env.TABULARIUS_PGWIRE_MAX_ROWS;
  t.after(async () => {
    if (was === undefined) delete process.env.TABULARIUS_PGWIRE_MAX_ROWS; else process.env.TABULARIUS_PGWIRE_MAX_ROWS = was;
    pg.close(); await host.close(); rmSync(dir, { recursive: true, force: true });
  });
  const c = await PgClient.open({ port, user: 'Alice', password: 'correct', database: 'Synthetic' });
  try {
    for (const cap of ['0', '100']) {
      process.env.TABULARIUS_PGWIRE_MAX_ROWS = cap;
      const r = await c.simple(REC10);
      assert.equal(r.error, undefined, `cap ${cap}`);
      assert.equal(r.rows.length, 10, `cap ${cap}`);
    }
  } finally { c.close(); }
});

test('a recursive query runs in a BEGIN that has not written, and is refused on a file the transaction has written to', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-pg-recursive-tx-'));
  createStore(join(dir, 'Synthetic.openhbam.sqlite'));
  const host = new Host(dir), pg = new PgServer(host, { port: 0, writes: true });
  const store = host.get('Synthetic')!;
  store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name' }] }]);
  const full = store.privilegeSets().find((p) => p.name === '[Full Access]')!;
  store.savePrivilegeSet({ ...full, extendedPrivileges: [...new Set([...full.extendedPrivileges, 'fmxdbc'])] });
  store.setPassword('Alice', 'correct', '[Full Access]');
  const port = await pg.listen();
  t.after(async () => { pg.close(); await host.close(); rmSync(dir, { recursive: true, force: true }); });
  const c = await PgClient.open({ port, user: 'Alice', password: 'correct', database: 'Synthetic' });
  try {
    assert.equal((await c.simple('BEGIN')).error, undefined);
    const before = await c.simple(REC10);
    assert.equal(before.error, undefined, 'no write yet');
    assert.equal(before.rows.length, 10);
    assert.equal((await c.simple("INSERT INTO Items (Name) VALUES ('x')")).error, undefined);
    const after = await c.simple(REC10);
    assert.match(JSON.stringify(after.error), /recursive query can't run on a file this transaction has written to/);
    assert.equal((await c.simple('ROLLBACK')).error, undefined);
    assert.equal((await c.simple(REC10)).rows.length, 10);
  } finally { c.close(); }
});
