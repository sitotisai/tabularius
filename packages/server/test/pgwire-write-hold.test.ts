// An UPDATE reads the matching records, works out the new values and then writes them, with a turn of the event loop
// in between. Another connection that writes in that gap must be refused, not have its change overwritten.
import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Host } from '../src/host.ts';
import { PgServer } from '../src/pgwire.ts';
import { createStore, StoreError, type Store } from '../../store/src/index.ts';
import { PgClient } from './pg-client.ts';

const turn = () => new Promise<void>((resolve) => setImmediate(resolve));

/** A served file with an Items table and one account, closed with the test. */
async function serve(t: TestContext) {
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
  return { store, open };
}

/** Waits until a write to the file is no longer refused because something holds it. */
async function untilFree(store: Store): Promise<void> {
  for (let i = 0; i < 20_000; i++) {
    try { store.create('Items', { Name: 'free' }); return; } catch (e) {
      if (!(e instanceof StoreError && e.code === 301)) throw e;
      await turn();
    }
  }
  assert.fail('the file is still held');
}

test('concurrent UPDATE statements never lose an increment', async (t) => {
  const { store, open } = await serve(t);
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

test('the hold is released when a statement fails while its values are worked out', async (t) => {
  const { store, open } = await serve(t);
  const c = await open();
  assert.equal((await c.simple("INSERT INTO Items (Name, Count) VALUES ('x', 1)")).error, undefined);
  // A NULL is refused after the records are found and the file is held.
  const r = await c.simple("UPDATE Items SET Name = NULL WHERE Name = 'x'");
  assert.ok(r.error, 'the statement is refused');
  await untilFree(store);
  assert.deepEqual((store.sql.prepare('SELECT Name FROM Items WHERE Count = 1').all() as { Name: string }[]).map((r) => r.Name), ['x'], 'nothing was changed');
  // The same connection goes on working.
  assert.equal((await c.simple("UPDATE Items SET Count = 2 WHERE Name = 'x'")).error, undefined);
});

test('the hold is released, and the statement is all or nothing, when the client disconnects in the middle of it', async (t) => {
  const { store, open } = await serve(t);
  const c = await open();
  for (let i = 0; i < 600; i++) store.create('Items', { Name: `r${i}`, Count: 0 });
  c.send('Q', Buffer.from('UPDATE Items SET Count = Count + 1\0'));
  await turn();
  c.close();
  await untilFree(store);
  const counts = (store.sql.prepare("SELECT DISTINCT Count FROM Items WHERE Name LIKE 'r%'").all() as { Count: number }[]).map((r) => Number(r.Count));
  assert.equal(counts.length, 1, JSON.stringify(counts));
});
