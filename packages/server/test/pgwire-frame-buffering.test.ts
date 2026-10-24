// A large message arrives in many pieces. The server must keep the pieces apart until the message is complete: copying
// everything received so far for every piece costs time that grows with the square of the message, on the one event loop.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Host } from '../src/host.ts';
import { PgServer } from '../src/pgwire.ts';
import { createStore } from '../../store/src/index.ts';
import { PgClient } from './pg-client.ts';

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
  const result = await c.untilReady();
  assert.equal(result.error, undefined);
  assert.deepEqual(result.rows, [['1']]);
  // Joined once is about one message; once per piece would be about 48 times that.
  assert.ok(copied < 4 * message.length, `${(copied / message.length).toFixed(1)} times the message was copied`);
});
