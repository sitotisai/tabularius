// An UPDATE reads the matching records, works out the new values and then writes them, with a turn of the event loop
// in between. Another connection that writes in that gap must be refused, not have its change overwritten.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Host } from '../src/host.ts';
import { PgServer } from '../src/pgwire.ts';
import { createStore } from '../../store/src/index.ts';
import { PgClient } from './pg-client.ts';

test('concurrent UPDATE statements never lose an increment', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-pg-hold-'));
  createStore(join(dir, 'Shop.openhbam.sqlite'), { mode: 'native' });
  const host = new Host(dir), pg = new PgServer(host, { port: 0, writes: true });
  const store = host.get('Shop')!;
  store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name' }, { name: 'Count', type: 'integer' }] }]);
  const full = store.privilegeSets().find((p) => p.id === 1)!;
  store.savePrivilegeSet({ ...full, extendedPrivileges: [...full.extendedPrivileges, 'fmxdbc'] });
  store.setPassword('Ann', 'pw', full.name);
  const port = await pg.listen();
  const clients: PgClient[] = [];
  t.after(async () => {
    for (const c of clients) c.close();
    pg.close();
    await host.close();
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });
  const open = async () => { const c = await PgClient.open({ port, user: 'Ann', password: 'pw', database: 'Shop' }); clients.push(c); return c; };
  const [a, b] = [await open(), await open()];
  assert.equal((await a.simple("INSERT INTO Items (Name, Count) VALUES ('x', 0)")).error, undefined);

  let kept = 0;
  const refused = new Set<string>();
  const bump = async (c: PgClient) => {
    for (let i = 0; i < 25; i++) {
      const r = await c.simple("UPDATE Items SET Count = Count + 1 WHERE Name = 'x'");
      if (r.error) refused.add(r.error.code); else kept++;
    }
  };
  await Promise.all([bump(a), bump(b)]);
  const now = Number((store.sql.prepare("SELECT Count FROM Items WHERE Name = 'x'").get() as { Count: number | string }).Count);
  assert.equal(now, kept, `${kept} statements were answered as done, the record shows ${now}`);
  assert.ok(kept > 0);
  // A write that meets another's hold is told so (55P03), not silently overwritten.
  for (const code of refused) assert.equal(code, '55P03');
});
