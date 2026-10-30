// What the server queues for a client that is not reading stays small however the answer is made up: several writes in one
// query, many statements it answers itself, and rows of any size; a client that reads slowly but steadily is not cut off; and a
// client that cannot take the FATAL of an idle-transaction limit does not keep its connection.
import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { connect, createServer, type Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Host } from '../src/host.ts';
import { PgServer } from '../src/pgwire.ts';
import { createStore } from '../../store/src/index.ts';
import { monotonicClock } from '../../store/src/monotonic.ts';
import { PgClient } from './pg-client.ts';
import { removeAtExit } from '../../../scripts/test-remove-at-exit.ts';

const turn = () => new Promise<void>((resolve) => setImmediate(resolve));

async function serveWriter(t: TestContext, port0 = 0) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-pg-batches-'));
  createStore(join(dir, 'Synthetic.openhbam.sqlite'), { mode: 'native' });
  const host = new Host(dir), pg = new PgServer(host, { port: port0, writes: true });
  const store = host.get('Synthetic')!;
  store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name' }, { name: 'Count', type: 'integer' }] }]);
  const full = store.privilegeSets().find((p) => p.id === 1)!;
  store.savePrivilegeSet({ ...full, extendedPrivileges: [...new Set([...full.extendedPrivileges, 'fmxdbc'])] });
  store.setPassword('Ann', 'pw', full.name);
  const port = await pg.listen();
  const clients: PgClient[] = [];
  const open = async (at = port) => { const c = await PgClient.open({ port: at, user: 'Ann', password: 'pw', database: 'Synthetic' }); clients.push(c); return c; };
  t.after(async () => { for (const c of clients) c.close(); pg.close(); await host.close(); });
  removeAtExit(dir, { maxRetries: 5, retryDelay: 50 });
  return { store, open, port, serverSockets: () => [...(pg as unknown as { sockets: Set<Socket> }).sockets] };
}

/** The most the server ever has queued for this socket. */
function watchQueued(server: Socket): () => number {
  let queued = 0;
  const write = server.write.bind(server) as (...args: unknown[]) => boolean;
  (server as unknown as { write: unknown }).write = (...args: unknown[]) => {
    const ok = write(...args);
    queued = Math.max(queued, server.writableLength);
    return ok;
  };
  return () => queued;
}

async function untilStalled(server: Socket): Promise<void> {
  for (let i = 0; i < 100_000 && !server.writableLength; i++) await turn();
  for (let still = 0, last = -1; still < 200;) {
    await turn();
    still = server.writableLength === last ? still + 1 : 0;
    last = server.writableLength;
  }
}

function withEnv(values: Record<string, string>, t: TestContext): void {
  const saved = Object.fromEntries(Object.keys(values).map((k) => [k, process.env[k]]));
  Object.assign(process.env, values);
  t.after(() => { for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } });
}

const MB = 1024 * 1024;

test('several writes with RETURNING in one query queue one batch at a time, not all their rows', async (t) => {
  const { store, open, serverSockets } = await serveWriter(t);
  const c = await open();
  const [server] = serverSockets();
  const queued = watchQueued(server);
  const text = 'x'.repeat(50_000);
  for (let i = 0; i < 200; i++) store.create('Items', { Name: text, Count: 0 });
  c.socket.pause();
  c.send('Q', Buffer.from(Array.from({ length: 10 }, () => 'UPDATE Items SET Count = Count + 1 RETURNING Name').join(';') + '\0'));
  await untilStalled(server);
  assert.ok(queued() < 3 * MB, `${(queued() / MB).toFixed(1)} MB were queued for a client that was not reading`);
  c.socket.resume();
  const r = await c.untilReady();
  assert.equal(r.error, undefined);
  // The ten statements were one unit and were all kept.
  assert.equal(Number((store.sql.prepare('SELECT min(Count) AS n FROM Items').get() as { n: number }).n), 10);
});

test('a long run of statements the server answers itself queues a bounded amount', async (t) => {
  const { open, serverSockets } = await serveWriter(t);
  const c = await open();
  const [server] = serverSockets();
  const queued = watchQueued(server);
  c.socket.pause();
  c.send('Q', Buffer.from('COMMIT;'.repeat(140_000) + '\0'));
  await untilStalled(server);
  assert.ok(queued() < 1 * MB, `${(queued() / MB).toFixed(1)} MB were queued for a client that was not reading`);
  c.socket.resume();
  const r = await c.untilReady();
  assert.equal(r.error, undefined);
});

/** A TCP proxy that hands the client at most `bytes` every `ms` of what the server sends. */
async function throttledProxy(t: TestContext, target: number, bytes: number, ms: number): Promise<number> {
  const proxy = createServer((client) => {
    const up = connect(target, '127.0.0.1');
    const queue: Buffer[] = [];
    let queuedBytes = 0;
    client.on('error', () => up.destroy());
    up.on('error', () => client.destroy());
    client.pipe(up);
    up.on('data', (d: Buffer) => { queue.push(d); queuedBytes += d.length; if (queuedBytes > 512 * 1024) up.pause(); });
    const timer = setInterval(() => {
      let room = bytes;
      while (room > 0 && queue.length) {
        const head = queue[0];
        const part = head.subarray(0, room);
        client.write(part);
        room -= part.length; queuedBytes -= part.length;
        if (part.length === head.length) queue.shift(); else queue[0] = head.subarray(part.length);
      }
      if (queuedBytes < 256 * 1024) up.resume();
    }, ms);
    const end = () => { clearInterval(timer); client.destroy(); up.destroy(); };
    client.on('close', end);
    up.on('close', () => { if (!queue.length) end(); });
  });
  await new Promise<void>((resolve) => proxy.listen(0, '127.0.0.1', resolve));
  t.after(() => { proxy.close(); });
  return (proxy.address() as { port: number }).port;
}

test('a client that reads slowly but steadily is not cut off by the stall limit', async (t) => {
  withEnv({ TABULARIUS_PGWIRE_OUTPUT_STALL_MS: '300' }, t);
  const { open, port } = await serveWriter(t);
  // 30 MB, far more than the sockets can hold, handed to the client at about 20 MB a second: what is left to send after the
  // sockets are full takes longer than the limit, but the client takes something from the queue all along.
  const proxyPort = await throttledProxy(t, port, 200 * 1024, 10);
  const c = await open(proxyPort);
  const ROWS = 1500;
  const r = await c.simple(`WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c WHERE x < ${ROWS}) SELECT x, hex(randomblob(10000)) FROM c`);
  assert.equal(r.error, undefined);
  assert.equal(r.rows.length, ROWS);
});

test('a client that cannot take the FATAL of the transaction limit does not keep its connection, with no stall limit', async (t) => {
  const realNow = monotonicClock.now;
  let offset = 0;
  monotonicClock.now = () => realNow() + offset;
  t.after(() => { monotonicClock.now = realNow; });
  withEnv({ TABULARIUS_PGWIRE_OUTPUT_STALL_MS: '0', TABULARIUS_PGWIRE_TX_IDLE_MS: '0', TABULARIUS_PGWIRE_TX_MAX_MS: '60000' }, t);
  const { open, serverSockets } = await serveWriter(t);
  const c = await open();
  const [server] = serverSockets();
  assert.equal((await c.simple('BEGIN')).error, undefined);
  assert.equal((await c.simple("INSERT INTO Items (Name) VALUES ('held')")).error, undefined);
  c.socket.pause();
  c.send('Q', Buffer.from(`WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c WHERE x < 30000) SELECT x, hex(randomblob(500)) FROM c\0`));
  await untilStalled(server);
  offset += 100_000;
  const deadline = Date.now() + 20_000;
  while (!server.destroyed && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
  assert.equal(server.destroyed, true, 'the connection was kept for a client that cannot read');
});

/** A table with many long-named columns: what a statement that returns no rows still answers (its column list) is large. */
function wideTable(store: { applyDesign(ops: unknown[]): unknown }): void {
  const wide = Array.from({ length: 200 }, (_, i) => ({ name: `Column${String(i).padStart(3, '0')}_${'n'.repeat(150)}` }));
  store.applyDesign([{ op: 'createTable', name: 'Wide', fields: [{ name: 'Name' }, ...wide] }]);
}

test('statements that return no rows still wait for a client that is not reading', async (t) => {
  const { store, open, serverSockets } = await serveWriter(t);
  wideTable(store);
  const c = await open();
  const [server] = serverSockets();
  const queued = watchQueued(server);
  c.socket.pause();
  // Each answers about 35 KB of column descriptions and no rows: 4,000 of them are 140 MB if nothing waits.
  c.send('Q', Buffer.from(Array.from({ length: 4000 }, () => "SELECT * FROM Wide WHERE Name = 'none'").join(';') + '\0'));
  await untilStalled(server);
  assert.ok(queued() < 3 * MB, `${(queued() / MB).toFixed(1)} MB were queued for a client that was not reading`);
});

test('writes in one query that return no rows still wait for a client that is not reading', async (t) => {
  const { store, open, serverSockets } = await serveWriter(t);
  wideTable(store);
  const c = await open();
  const [server] = serverSockets();
  const queued = watchQueued(server);
  c.socket.pause();
  c.send('Q', Buffer.from(Array.from({ length: 3000 }, () => "DELETE FROM Wide WHERE Name = 'none' RETURNING *").join(';') + '\0'));
  await untilStalled(server);
  assert.ok(queued() < 3 * MB, `${(queued() / MB).toFixed(1)} MB were queued for a client that was not reading`);
});

test('the rows a query of writes keeps count with the rows the connection already holds in portals', async (t) => {
  withEnv({ TABULARIUS_PGWIRE_MAX_ROWS: '100', TABULARIUS_PGWIRE_MAX_BUFFERED_ROWS: '100' }, t);
  const { store, open } = await serveWriter(t);
  for (let i = 0; i < 80; i++) store.create('Items', { Name: `n${i}`, Count: i });
  const c = await open();
  const z = (s: string) => Buffer.concat([Buffer.from(s), Buffer.alloc(1)]);
  const i16 = (n: number) => { const b = Buffer.alloc(2); b.writeInt16BE(n); return b; };
  const i32 = (n: number) => { const b = Buffer.alloc(4); b.writeInt32BE(n); return b; };
  // A portal that stops after 10 of its 80 rows keeps them all (no Sync yet: the connection is outside a transaction).
  c.send('P', Buffer.concat([z(''), z('SELECT Name FROM Items'), i16(0)]));
  c.send('B', Buffer.concat([z(''), z(''), i16(0), i16(0), i16(0)]));
  c.send('E', Buffer.concat([z(''), i32(10)]));
  // Two writes of 30 rows each fit alone (60 of 100) but not beside the 80 held.
  const r = await c.simple('UPDATE Items SET Count = Count WHERE Count < 30 RETURNING Name; UPDATE Items SET Count = Count WHERE Count < 30 RETURNING Name');
  assert.equal(r.error?.code, '54000');
  assert.match(r.error?.message ?? '', /buffered SQL results on this connection are limited to 100 rows/);
});
