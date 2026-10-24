// A client that does not read its answers must not make the server queue them: queries pipelined behind an unread result
// wait, and what is queued for one stays small, until the client reads again.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Socket } from 'node:net';
import { Host } from '../src/host.ts';
import { PgServer } from '../src/pgwire.ts';
import { createStore, type Store } from '../../store/src/index.ts';
import { monotonicClock } from '../../store/src/monotonic.ts';
import { PgClient } from './pg-client.ts';

const turn = () => new Promise<void>((resolve) => setImmediate(resolve));

test('pipelined queries wait while the client is not reading, and all are answered once it reads', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-pg-pressure-'));
  createStore(join(dir, 'Synthetic.openhbam.sqlite'));
  const host = new Host(dir), pg = new PgServer(host, { port: 0 });
  const store = host.get('Synthetic')!;
  const full = store.privilegeSets().find((p) => p.name === '[Full Access]')!;
  store.savePrivilegeSet({ ...full, extendedPrivileges: [...new Set([...full.extendedPrivileges, 'fmxdbc'])] });
  store.setPassword('Alice', 'correct', '[Full Access]');
  const port = await pg.listen();
  const c = await PgClient.open({ port, user: 'Alice', password: 'correct', database: 'Synthetic' });
  t.after(async () => { c.close(); pg.close(); await host.close(); rmSync(dir, { recursive: true, force: true }); });

  // The server's side of this connection: note the most it ever has queued for the client.
  const [server] = [...(pg as unknown as { sockets: Set<Socket> }).sockets];
  let queued = 0;
  const write = server.write.bind(server) as (...args: unknown[]) => boolean;
  (server as unknown as { write: unknown }).write = (...args: unknown[]) => {
    const ok = write(...args);
    queued = Math.max(queued, server.writableLength);
    return ok;
  };

  const ROWS = 30_000, QUERIES = 5;
  const sql = `WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c WHERE x < ${ROWS}) SELECT x, hex(randomblob(100)) FROM c`;
  c.socket.pause();
  for (let i = 0; i < QUERIES; i++) c.send('Q', Buffer.from(sql + '\0'));
  // Wait until the server has queued something and then stopped changing it: it is waiting for the client.
  for (let i = 0; i < 100_000 && !server.writableLength; i++) await turn();
  for (let still = 0, last = -1; still < 200;) {
    await turn();
    still = server.writableLength === last ? still + 1 : 0;
    last = server.writableLength;
  }
  // Unread results are not all in the server's memory: a few hundred KB, not the five results of about 7 MB each.
  assert.ok(queued < 3 * 1024 * 1024, `${(queued / 1024 / 1024).toFixed(1)} MB were queued for a client that was not reading`);

  c.socket.resume();
  for (let i = 0; i < QUERIES; i++) {
    const r = await c.untilReady();
    assert.equal(r.error, undefined);
    assert.equal(r.rows.length, ROWS, `result ${i + 1}`);
  }
});

/** A server with SQL writes on, a table Items (Name, Count) and one account that may write. */
async function serveWriter(t: { after: (fn: () => Promise<void>) => void }) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-pg-pressure-'));
  createStore(join(dir, 'Synthetic.openhbam.sqlite'), { mode: 'native' });
  const host = new Host(dir), pg = new PgServer(host, { port: 0, writes: true });
  const store = host.get('Synthetic')!;
  store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name' }, { name: 'Count', type: 'integer' }] }]);
  const full = store.privilegeSets().find((p) => p.id === 1)!;
  store.savePrivilegeSet({ ...full, extendedPrivileges: [...new Set([...full.extendedPrivileges, 'fmxdbc'])] });
  store.setPassword('Ann', 'pw', full.name);
  const port = await pg.listen();
  const c = await PgClient.open({ port, user: 'Ann', password: 'pw', database: 'Synthetic' });
  t.after(async () => { c.close(); pg.close(); await host.close(); rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); });
  const [server] = [...(pg as unknown as { sockets: Set<Socket> }).sockets];
  return { store, c, server };
}

/** Waits until the server has queued something for the client and then stopped changing it: it is waiting for the client to read. */
async function untilStalled(server: Socket): Promise<void> {
  for (let i = 0; i < 100_000 && !server.writableLength; i++) await turn();
  for (let still = 0, last = -1; still < 200;) {
    await turn();
    still = server.writableLength === last ? still + 1 : 0;
    last = server.writableLength;
  }
}

/** Whether the file takes a write from outside any session: false while a transaction holds it. */
function takesWrites(store: Store): boolean {
  try { store.create('Items', { Name: 'probe' }); return true; } catch { return false; }
}

function withEnv(values: Record<string, string>, t: { after: (fn: () => void) => void }): void {
  const saved = Object.fromEntries(Object.keys(values).map((k) => [k, process.env[k]]));
  Object.assign(process.env, values);
  t.after(() => { for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } });
}

const BIG_SELECT = (rows: number) => `WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c WHERE x < ${rows}) SELECT x, hex(randomblob(500)) FROM c`;

test('a write is kept, and the file freed, before the server waits for the client to read its RETURNING rows', async (t) => {
  const { store, c, server } = await serveWriter(t);
  const ROWS = 1000;
  const text = 'x'.repeat(30_000);
  for (let i = 0; i < ROWS; i++) store.create('Items', { Name: text, Count: 1 });
  c.socket.pause();
  c.send('Q', Buffer.from('UPDATE Items SET Count = 7 RETURNING Name\0'));
  await untilStalled(server);
  // The client has read none of it. The write is done, so it must not still hold the file for everyone else.
  assert.equal(takesWrites(store), true, 'the file is still held while the client is not reading');
  assert.equal(Number((store.sql.prepare('SELECT count(*) AS n FROM Items WHERE Count = 7').get() as { n: number }).n), ROWS);
  c.socket.resume();
  const r = await c.untilReady();
  assert.equal(r.error, undefined);
  assert.equal(r.rows.length, ROWS);
});

test('a transaction that is not read from is still rolled back at the maximum age', async (t) => {
  const realNow = monotonicClock.now;
  let offset = 0;
  monotonicClock.now = () => realNow() + offset;
  t.after(() => { monotonicClock.now = realNow; });
  // A limit far above the time the test takes, so only the clock offset below reaches it.
  withEnv({ TABULARIUS_PGWIRE_TX_IDLE_MS: '0', TABULARIUS_PGWIRE_TX_MAX_MS: '60000' }, t);
  const { store, c, server } = await serveWriter(t);
  assert.equal((await c.simple('BEGIN')).error, undefined);
  assert.equal((await c.simple("INSERT INTO Items (Name) VALUES ('held')")).error, undefined);
  c.socket.pause();
  c.send('Q', Buffer.from(BIG_SELECT(30_000) + '\0'));
  await untilStalled(server);
  assert.equal(takesWrites(store), false, 'the transaction holds the file while it is young');
  offset += 100_000;
  // The server is waiting for the client, not working: the age limit applies, well before the stall limit of a minute.
  const deadline = Date.now() + 15_000;
  while (!takesWrites(store) && Date.now() < deadline) await new Promise((r) => setTimeout(r, 20));
  assert.equal(takesWrites(store), true, 'a transaction that is old and unread was not rolled back');
  assert.deepEqual((store.sql.prepare('SELECT Name FROM Items').all() as { Name: string }[]).map((x) => x.Name), ['probe', 'probe']);
});

test('after a client is cut off for not reading, the rest of its result is not encoded', async (t) => {
  withEnv({ TABULARIUS_PGWIRE_OUTPUT_STALL_MS: '300' }, t);
  const { c, server } = await serveWriter(t);
  c.socket.pause();
  const closed = new Promise<void>((resolve) => server.once('close', resolve));
  let atClose = -1;
  server.once('close', () => { atClose = concats; });
  let concats = 0;
  const concat = Buffer.concat;
  Buffer.concat = ((...args: Parameters<typeof Buffer.concat>) => { concats++; return concat(...args); }) as typeof Buffer.concat;
  t.after(() => { Buffer.concat = concat; });
  c.send('Q', Buffer.from(BIG_SELECT(30_000) + '\0'));
  await closed;
  // Let whatever the server was still doing for this connection finish.
  for (let i = 0; i < 20; i++) await turn();
  // Each row of a batch is one call (a batch is 1,000 rows); a few calls of something else are not a batch.
  assert.ok(concats - atClose < 100, `${concats - atClose} Buffer.concat calls after the connection was gone`);
});
