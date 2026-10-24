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
import { createStore } from '../../store/src/index.ts';
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
