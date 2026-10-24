// A store error while a sign-in is being checked (here forced: a sign-in that needs a write of second-factor state is
// refused with 301 while another session's transaction holds the file) is answered with an ErrorResponse, SQLSTATE 55P03,
// not by closing the connection in silence.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Host } from '../src/host.ts';
import { PgServer } from '../src/pgwire.ts';
import { createStore, StoreError } from '../../store/src/index.ts';
import { PgClient } from './pg-client.ts';

test('a sign-in refused with a store error answers 55P03', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-pg-signin-busy-'));
  createStore(join(dir, 'Shop.openhbam.sqlite'), { mode: 'native' });
  const host = new Host(dir), pg = new PgServer(host, { port: 0 });
  const store = host.get('Shop')!;
  const full = store.privilegeSets().find((p) => p.id === 1)!;
  store.savePrivilegeSet({ ...full, extendedPrivileges: [...full.extendedPrivileges, 'fmxdbc'] });
  store.setPassword('Boss', 'pw', full.name);
  const port = await pg.listen();
  const clients: PgClient[] = [];
  t.after(async () => { for (const c of clients) c.close(); pg.close(); await host.close(); rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); });
  const refuse = t.mock.method(store, 'auditSignIn', () => { throw new StoreError(301, 'Record is in use by another user (a transaction is open)'); });
  await assert.rejects(() => PgClient.open({ port, user: 'Boss', password: 'pw', database: 'Shop' }), /^Error: 55P03 /);
  refuse.mock.restore();
  clients.push(await PgClient.open({ port, user: 'Boss', password: 'pw', database: 'Shop' }));
});
