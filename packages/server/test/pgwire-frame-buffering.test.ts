// A large message arrives in many pieces. The server must keep the pieces apart until the message is complete: copying
// everything received so far for every piece costs time that grows with the square of the message, on the one event loop.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Host } from '../src/host.ts';
import { PgServer } from '../src/pgwire.ts';
import { connect, type Socket } from 'node:net';
import { createStore } from '../../store/src/index.ts';
import { PgClient } from './pg-client.ts';

const turn = () => new Promise<void>((resolve) => setImmediate(resolve));
const frame = (type: string, text: string | Buffer): Buffer => {
  const body = Buffer.from(text), head = Buffer.alloc(5);
  head.write(type);
  head.writeInt32BE(body.length + 4, 1);
  return Buffer.concat([head, body]);
};

async function serve(t: import('node:test').TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-pg-frame-'));
  createStore(join(dir, 'Synthetic.openhbam.sqlite'));
  const host = new Host(dir), pg = new PgServer(host, { port: 0 });
  const store = host.get('Synthetic')!;
  const full = store.privilegeSets().find((p) => p.name === '[Full Access]')!;
  store.savePrivilegeSet({ ...full, extendedPrivileges: [...new Set([...full.extendedPrivileges, 'fmxdbc'])] });
  store.setPassword('Alice', 'correct', '[Full Access]');
  const port = await pg.listen();
  const sockets: Socket[] = [];
  t.after(async () => { for (const s of sockets) s.destroy(); pg.close(); await host.close(); rmSync(dir, { recursive: true, force: true }); });
  return { pg, port, track: (s: Socket) => { sockets.push(s); return s; } };
}

test('a message sent in many pieces is joined once, not once per piece', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-pg-frame-'));
  createStore(join(dir, 'Synthetic.openhbam.sqlite'));
  const host = new Host(dir), pg = new PgServer(host, { port: 0 });
  const store = host.get('Synthetic')!;
  const full = store.privilegeSets().find((p) => p.name === '[Full Access]')!;
  store.savePrivilegeSet({ ...full, extendedPrivileges: [...new Set([...full.extendedPrivileges, 'fmxdbc'])] });
  store.setPassword('Alice', 'correct', '[Full Access]');
  const port = await pg.listen();
  const c = await PgClient.open({ port, user: 'Alice', password: 'correct', database: 'Synthetic' });
  t.after(async () => { c.close(); pg.close(); await host.close(); rmSync(dir, { recursive: true, force: true }); });

  // A query of 6 MB (mostly spaces), sent as 96 pieces of 64 KB.
  const text = Buffer.concat([Buffer.from('SELECT 1'), Buffer.alloc(6 * 1024 * 1024, ' '), Buffer.from('\0')]);
  const head = Buffer.alloc(5);
  head.write('Q');
  head.writeInt32BE(text.length + 4, 1);
  const message = Buffer.concat([head, text]);

  let copied = 0;
  const concat = Buffer.concat;
  t.mock.method(Buffer, 'concat', (list: readonly Uint8Array[], length?: number) => {
    const joined = concat(list, length);
    copied += joined.length;
    return joined;
  });
  const piece = 64 * 1024;
  for (let at = 0; at < message.length; at += piece) {
    c.socket.write(message.subarray(at, at + piece));
    await new Promise((resolve) => setImmediate(resolve));
  }
  // The server takes the whole message in, then refuses SQL text over its limit (1 MB): the answer is not what is measured.
  const result = await c.untilReady();
  assert.match(result.error?.message ?? '', /larger than 1 MB/);
  // Joined once is about one message; once per piece would be about 48 times that.
  assert.ok(copied < 4 * message.length, `${(copied / message.length).toFixed(1)} times the message was copied`);
});

test('the pieces of a large message are joined once even when a complete message is waiting ahead of it', async (t) => {
  const { port, track } = await serve(t);
  const c = await PgClient.open({ port, user: 'Alice', password: 'correct', database: 'Synthetic' });
  track(c.socket);
  // The first query is many statements, each of which gives the event loop a turn, so a Sync stays queued, complete and
  // unhandled, while the pieces of the large query behind it arrive.
  const slow = frame('Q', 'SELECT 1;'.repeat(300) + '\0');
  const big = frame('Q', Buffer.concat([Buffer.from('SELECT 1'), Buffer.alloc(6 * 1024 * 1024, ' '), Buffer.from('\0')]));
  let copied = 0;
  const concat = Buffer.concat;
  t.mock.method(Buffer, 'concat', (list: readonly Uint8Array[], length?: number) => {
    const joined = concat(list, length);
    copied += joined.length;
    return joined;
  });
  const piece = 64 * 1024;
  c.socket.write(Buffer.concat([slow, frame('S', ''), big.subarray(0, piece)]));
  for (let at = piece; at < big.length; at += piece) {
    c.socket.write(big.subarray(at, at + piece));
    await turn();
  }
  for (let i = 0; i < 2; i++) assert.equal((await c.untilReady()).error, undefined);
  // The large query is refused for its size (SQL text is limited to 1 MB) once it has been taken in whole.
  assert.match((await c.untilReady()).error?.message ?? '', /larger than 1 MB/);
  assert.ok(copied < 4 * big.length, `${(copied / big.length).toFixed(1)} times the large message was copied`);
});

test('before sign-in nothing past a password message is buffered, even while the password is being checked', async (t) => {
  const { pg, port, track } = await serve(t);
  const socket = track(connect(port, '127.0.0.1'));
  socket.on('error', () => {});
  const closed = new Promise<void>((resolve) => socket.once('close', () => resolve()));
  const asked = new Promise<void>((resolve) => socket.once('data', () => resolve()));
  const params = Buffer.from('user\0Alice\0database\0Synthetic\0\0'), head = Buffer.alloc(8);
  head.writeInt32BE(8 + params.length); head.writeInt32BE(196608, 4);
  socket.write(Buffer.concat([head, params]));
  await asked;
  const [server] = [...(pg as unknown as { sockets: Set<Socket> }).sockets];
  // A wrong password, then a header that announces 200 MB and as much of it as the server will take.
  const header = Buffer.alloc(5);
  header.write('Q');
  header.writeInt32BE(200_000_000, 1);
  socket.write(Buffer.concat([frame('p', 'wrong\0'), header]));
  for (let i = 0; i < 40 && !socket.destroyed; i++) {
    socket.write(Buffer.alloc(64 * 1024, 32));
    await turn();
  }
  await closed;
  assert.ok(server.bytesRead < 256 * 1024, `${server.bytesRead} bytes were read from a connection that had not signed in`);
});
