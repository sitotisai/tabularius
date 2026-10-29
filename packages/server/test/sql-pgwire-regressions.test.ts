import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { connect, Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, type Store } from '../../store/src/index.ts';
import { Host } from '../src/host.ts';
import { PgServer, pgwireIdleMs } from '../src/pgwire.ts';
import { SqlEndpoint } from '../src/sql.ts';

const cstr = (s: string) => Buffer.from(s + '\0');
const i16 = (n: number) => { const b = Buffer.alloc(2); b.writeInt16BE(n); return b; };
const i32 = (n: number) => { const b = Buffer.alloc(4); b.writeInt32BE(n); return b; };

async function setup(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-pg-regression-'));
  const path = join(dir, 'Generated.openhbam.sqlite');
  createStore(path);
  const host = new Host(dir);
  const store = host.get('Generated')!;
  store.applyDesign([{ op: 'createTable', name: 'People', fields: [{ name: 'Name' }] },
    { op: 'createTable', name: 'a"b', fields: [{ name: 'Value' }] },
    { op: 'createTable', name: 'a\\b', fields: [{ name: 'Value' }] }]);
  store.create('People', { Name: 'Ada' });
  const full = store.privilegeSets().find((p) => p.id === 1)!;
  store.savePrivilegeSet({ ...full, extendedPrivileges: [...full.extendedPrivileges, 'fmxdbc'] });
  store.setPassword('Reader', 'pw', full.name);
  const pg = new PgServer(host, { port: 0 });
  const port = await pg.listen();
  const sockets: Socket[] = [];
  t.after(async () => {
    for (const socket of sockets) socket.destroy();
    pg.close();
    await host.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const open = () => {
    const socket = connect(port, '127.0.0.1');
    sockets.push(socket);
    return socket;
  };
  return { store, host, pg, open };
}

class Client {
  private buffer = Buffer.alloc(0);
  private wake?: () => void;
  readonly socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
    socket.on('data', (chunk: Buffer) => { this.buffer = Buffer.concat([this.buffer, chunk]); this.wake?.(); });
    socket.on('close', () => this.wake?.());
  }
  async read(): Promise<{ type: string; body: Buffer }> {
    for (;;) {
      if (this.buffer.length >= 5 && this.buffer.length >= this.buffer.readInt32BE(1) + 1) {
        const end = this.buffer.readInt32BE(1) + 1;
        const result = { type: this.buffer.toString('ascii', 0, 1), body: this.buffer.subarray(5, end) };
        this.buffer = this.buffer.subarray(end);
        return result;
      }
      if (this.socket.destroyed) throw new Error('socket closed');
      await new Promise<void>((resolve) => { this.wake = resolve; });
    }
  }
  send(type: string, ...parts: Buffer[]) {
    const body = Buffer.concat(parts);
    this.socket.write(Buffer.concat([Buffer.from(type), i32(body.length + 4), body]));
  }
  async signedIn() {
    const params = Buffer.from('user\0Reader\0database\0Generated\0\0');
    this.socket.write(Buffer.concat([i32(params.length + 8), i32(196608), params]));
    assert.equal((await this.read()).type, 'R');
    this.send('p', cstr('pw'));
    await this.untilReady();
    return this;
  }
  async untilReady() {
    const rows: (string | null)[][] = [];
    let error: string | undefined;
    let oid: number | undefined;
    for (;;) {
      const { type, body } = await this.read();
      if (type === 'T') oid = body.readInt32BE(2 + body.indexOf(0, 2) + 1 + 6);
      if (type === 'D') {
        const values: (string | null)[] = [];
        let pos = 2;
        for (let i = 0; i < body.readInt16BE(0); i++) {
          const size = body.readInt32BE(pos); pos += 4;
          values.push(size < 0 ? null : body.toString('utf8', pos, pos + size));
          if (size >= 0) pos += size;
        }
        rows.push(values);
      }
      if (type === 'E') error = body.toString();
      if (type === 'Z') return { rows, error, oid };
    }
  }
  query(sql: string) { this.send('Q', cstr(sql)); return this.untilReady(); }
}

test('simple query keeps text in a mixed expression column', async (t) => {
  const { open } = await setup(t);
  const client = await new Client(open()).signedIn();
  const result = await client.query("SELECT v FROM (SELECT 1 AS v UNION ALL SELECT 'hello' UNION ALL SELECT 'world')");
  assert.equal(result.error, undefined);
  assert.deepEqual(result.rows, [['1'], ['hello'], ['world']]);
});

test('catalog word in a value does not suppress SQL read auditing', async (t) => {
  const { store, open } = await setup(t);
  store.setAuditSettings({ logReads: true });
  const client = await new Client(open()).signedIn();
  const result = await client.query("SELECT Name FROM People WHERE Name <> 'pg_tables'");
  assert.equal(result.error, undefined);
  const reads = store.sql.prepare("SELECT tbl FROM _fm_audit WHERE kind = 'read' AND tbl = 'People'").all();
  assert.equal(reads.length, 1);
});

test('Parse accepts unused trailing parameter types and Bind values', async (t) => {
  const { open } = await setup(t);
  const client = await new Client(open()).signedIn();
  client.send('P', cstr(''), cstr('SELECT $1'), i16(2), i32(23), i32(23));
  client.send('B', cstr(''), cstr(''), i16(0), i16(2), i32(1), Buffer.from('7'), i32(1), Buffer.from('8'), i16(0));
  client.send('E', cstr(''), i32(0));
  client.send('S');
  const result = await client.untilReady();
  assert.equal(result.error, undefined);
  assert.deepEqual(result.rows, [['7']]);
});

test('table listing handles quote and backslash in table names', async (t) => {
  const { host, store } = await setup(t);
  const endpoint = new SqlEndpoint(host, {} as never);
  const tables = (endpoint as unknown as { tables(store: Store, p: ReturnType<Store['privileges']>): { name: string; columns: { name: string }[] }[] }).tables(store, store.privileges('Reader'));
  for (const name of ['a"b', 'a\\b']) assert.deepEqual(tables.find((table) => table.name === name)?.columns.map((column) => column.name), ['Value']);
});

test('remote unsigned sockets have a separate budget and cannot crowd out local sign-in', async (t) => {
  const { pg, open } = await setup(t);
  for (let i = 0; i < 256; i++) assert.equal(pg.holdUnsigned(`remote-${Math.floor(i / 50)}`), true);
  assert.equal(pg.holdUnsigned('remote-extra'), false);
  const client = await new Client(open()).signedIn();
  assert.equal((await client.query('SELECT 1')).error, undefined);
  for (let i = 0; i < 256; i++) pg.releaseUnsigned(`remote-${Math.floor(i / 50)}`);
});

test('signed-in idle timeout closes an inactive socket', async (t) => {
  const keepalive: { enabled: boolean; delay: number }[] = [];
  const originalKeepAlive = Socket.prototype.setKeepAlive;
  t.mock.method(Socket.prototype, 'setKeepAlive', function (this: Socket, enabled?: boolean, delay?: number) {
    keepalive.push({ enabled: enabled ?? false, delay: delay ?? 0 });
    return originalKeepAlive.call(this, enabled, delay);
  });
  const prior = process.env.TABULARIUS_PGWIRE_IDLE_MS;
  process.env.TABULARIUS_PGWIRE_IDLE_MS = '30';
  t.after(() => { if (prior === undefined) delete process.env.TABULARIUS_PGWIRE_IDLE_MS; else process.env.TABULARIUS_PGWIRE_IDLE_MS = prior; });
  assert.equal(pgwireIdleMs(), 30);
  const { open } = await setup(t);
  const client = await new Client(open()).signedIn();
  assert.ok(keepalive.some((call) => call.enabled && call.delay === 30_000));
  await Promise.race([
    new Promise<void>((resolve) => client.socket.once('close', () => resolve())),
    new Promise<never>((_, reject) => { const timer = setTimeout(() => reject(new Error('signed-in connection stayed idle')), 1000); timer.unref(); }),
  ]);
  assert.equal(client.socket.destroyed, true);
});
