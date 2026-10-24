// A refused sign-in on the PostgreSQL port ends the session: nothing sent after the refusal runs as that account.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { connect } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from '../../store/src/index.ts';
import { Host } from '../src/host.ts';
import { PgServer } from '../src/pgwire.ts';

const i32 = (n: number) => { const b = Buffer.alloc(4); b.writeInt32BE(n); return b; };
const cstr = (s: string) => Buffer.from(s + '\0');
const message = (type: string, body: Buffer) => Buffer.concat([Buffer.from(type), i32(body.length + 4), body]);

test('queries sent after a refused password do not run', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'pg-refused-'));
  createStore(join(dir, 'Shop.openhbam.sqlite'), { mode: 'native' });
  const host = new Host(dir);
  const store = host.get('Shop')!;
  store.setAiPolicy(false);
  store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name' }] }]);
  const full = store.privilegeSets().find((p) => p.id === 1)!;
  store.savePrivilegeSet({ ...full, extendedPrivileges: [...full.extendedPrivileges, 'fmxdbc'] });
  store.setPassword('Ann', 'right-password', full.name);
  const pg = new PgServer(host, { port: 0, writes: true });
  const port = await pg.listen();
  try {
    const insert = (name: string) => message('Q', cstr(`INSERT INTO Items (Name) VALUES ('${name}')`));
    const params = Buffer.from('user\0Ann\0database\0Shop\0\0');
    const startup = Buffer.concat([i32(params.length + 8), i32(196608), params]);
    // The query arrives in the same packet as the wrong password, and again after the refusal has been answered.
    const socket = connect(port, '127.0.0.1', { allowHalfOpen: true } as never);
    socket.on('error', () => {});
    let answer = Buffer.alloc(0);
    socket.on('data', (d) => { answer = Buffer.concat([answer, d]); });
    await new Promise((r) => socket.once('connect', r));
    socket.write(Buffer.concat([startup, message('p', cstr('wrong-password')), insert('pipelined')]));
    for (let i = 0; i < 100 && !answer.includes('28P01'); i++) await new Promise((r) => setTimeout(r, 20));
    assert.ok(answer.includes('28P01'), 'the wrong password is refused');
    if (!socket.destroyed) socket.write(insert('after-refusal'));
    await new Promise((r) => setTimeout(r, 300));
    socket.destroy();
    assert.deepEqual(store.sql.prepare('SELECT Name FROM Items').all(), []);
  } finally {
    pg.close();
    await host.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
