// A connection refused for the per-address unsigned limit is forgotten when its socket closes, so a client that
// reconnects in a loop cannot grow the server's memory.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { connect, type Socket } from 'node:net';
import { Host } from '../src/host.ts';
import { PgServer } from '../src/pgwire.ts';

const open = (port: number): Promise<Socket> => new Promise((resolve, reject) => {
  const socket = connect(port, '127.0.0.1');
  socket.once('error', reject);
  socket.once('connect', () => resolve(socket));
});

const closed = (socket: Socket): Promise<void> => new Promise((resolve) => {
  if (socket.destroyed) resolve(); else socket.once('close', () => resolve());
});

test('refused unsigned connections are not retained by the server', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-pg-unsigned-'));
  const host = new Host(dir), pg = new PgServer(host, { port: 0 });
  // Treat the loopback test client as a remote address, so the per-address limit applies.
  t.mock.method(pg, 'isLocal', () => false);
  const port = await pg.listen();
  const held: Socket[] = [];
  t.after(async () => {
    for (const s of held) s.destroy();
    pg.close();
    await host.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const conns = () => (pg as unknown as { conns: Set<unknown> }).conns.size;
  for (let i = 0; i < 50; i++) held.push(await open(port));
  for (let i = 0; i < 20; i++) {
    const refused = await open(port);
    refused.on('data', () => {});
    await closed(refused);
  }
  // The client sees the close before the server's own handlers have all run; give them turns of the event loop.
  for (let i = 0; i < 1000 && conns() > 50; i++) await new Promise((resolve) => setImmediate(resolve));
  assert.equal(conns(), 50, 'only the connections still open are kept');
});
