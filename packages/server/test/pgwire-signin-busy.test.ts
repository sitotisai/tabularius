// While another account's transaction holds the file (--sql-writes: BEGIN and a write), a sign-in that needs the file
// is refused with an error the client can read (55P03), not by closing the connection in silence.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Host } from '../src/host.ts';
import { PgServer } from '../src/pgwire.ts';
import { createStore } from '../../store/src/index.ts';
import { PgClient } from './pg-client.ts';

test('a sign-in refused because another session holds the file answers 55P03', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-pg-signin-busy-'));
  createStore(join(dir, 'Shop.openhbam.sqlite'), { mode: 'native' });
  const host = new Host(dir), pg = new PgServer(host, { port: 0, writes: true });
  const store = host.get('Shop')!;
  store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name' }] }]);
  const full = store.privilegeSets().find((p) => p.id === 1)!;
  store.savePrivilegeSet({ ...full, extendedPrivileges: [...full.extendedPrivileges, 'fmxdbc'] });
  store.savePrivilegeSet({ name: 'CreateOnly', records: { view: true, edit: false, create: true, delete: false }, layouts: 'viewOnly', valueLists: 'viewOnly', scripts: 'none', extendedPrivileges: ['fmxdbc'] });
  store.setPassword('Boss', 'pw', full.name);
  store.setPassword('Writer', 'pw', 'CreateOnly');
  const port = await pg.listen();
  const clients: PgClient[] = [];
  t.after(async () => { for (const c of clients) c.close(); pg.close(); await host.close(); rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); });
  const w = await PgClient.open({ port, user: 'Writer', password: 'pw', database: 'Shop' });
  clients.push(w);
  assert.equal((await w.simple('BEGIN')).error, undefined);
  assert.equal((await w.simple("INSERT INTO Items (Name) VALUES ('x')")).error, undefined);
  await assert.rejects(() => PgClient.open({ port, user: 'Boss', password: 'pw', database: 'Shop' }), /^Error: 55P03 /);
  // Once the transaction ends, the same sign-in works.
  assert.equal((await w.simple('ROLLBACK')).error, undefined);
  clients.push(await PgClient.open({ port, user: 'Boss', password: 'pw', database: 'Shop' }));
});
