// SQL text is tokenized several times over, synchronously, with an object per token: a megabyte of it holds the one
// thread for many seconds and a few megabytes abort the process. Text over a limit is refused before any of that work,
// on the PostgreSQL port and over HTTP, and the connection stays usable.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { connect, type Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import { createStore, MAX_SQL_TEXT } from '../../store/src/index.ts';
import { serve, type Host } from '../src/index.ts';
import { PgServer } from '../src/pgwire.ts';

const cstr = (s: string) => Buffer.from(s + '\0');
const i16 = (n: number) => { const b = Buffer.alloc(2); b.writeInt16BE(n); return b; };
const i32 = (n: number) => { const b = Buffer.alloc(4); b.writeInt32BE(n); return b; };

let dir: string;
let server: Server;
let host: Host;
let base: string;
let pg: PgServer;
let port: number;
const sockets = new Set<Socket>();

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-sql-text-'));
  createStore(join(dir, 'Shop.openhbam.sqlite'));
  const s = await serve({ dir, port: 0, watch: false, log: () => {} });
  server = s.server;
  host = s.host;
  base = s.url;
  const store = host.get('Shop')!;
  const full = store.privilegeSets().find((p) => p.id === 1)!;
  store.savePrivilegeSet({ ...full, extendedPrivileges: [...full.extendedPrivileges, 'fmxdbc'] });
  store.setPassword('Ann', 'pw', full.name);
  pg = new PgServer(host, { port: 0 });
  port = await pg.listen();
});
after(async () => {
  for (const s of sockets) s.destroy();
  pg?.close();
  await new Promise<void>((r) => (server ? server.close(() => r()) : r()));
  if (dir) rmSync(dir, { recursive: true, force: true });
});

class Client {
  private buf = Buffer.alloc(0);
  private wake?: () => void;
  readonly socket: Socket = connect(port, '127.0.0.1');
  constructor() {
    sockets.add(this.socket);
    this.socket.on('data', (b: Buffer) => { this.buf = Buffer.concat([this.buf, b]); this.wake?.(); });
    this.socket.on('error', () => this.wake?.());
    this.socket.on('close', () => this.wake?.());
  }
  async open() {
    const params = Buffer.from('user\0Ann\0database\0Shop\0\0');
    this.socket.write(Buffer.concat([i32(params.length + 8), i32(196608), params]));
    assert.equal((await this.read()).type, 'R');
    this.send('p', cstr('pw'));
    assert.equal((await this.until()).error, undefined);
    return this;
  }
  send(type: string, ...body: Buffer[]) {
    const b = Buffer.concat(body);
    this.socket.write(Buffer.concat([Buffer.from(type), i32(b.length + 4), b]));
  }
  async read(): Promise<{ type: string; body: Buffer }> {
    for (;;) {
      if (this.buf.length >= 5 && this.buf.length >= this.buf.readInt32BE(1) + 1) {
        const end = this.buf.readInt32BE(1) + 1;
        const m = { type: this.buf.toString('ascii', 0, 1), body: this.buf.subarray(5, end) };
        this.buf = this.buf.subarray(end);
        return m;
      }
      if (this.socket.destroyed || this.socket.readableEnded) throw new Error('connection closed');
      await new Promise<void>((resolve) => { this.wake = resolve; });
    }
  }
  async until() {
    const out = { rows: [] as string[], error: undefined as string | undefined, code: undefined as string | undefined };
    for (;;) {
      const { type, body } = await this.read();
      if (type === 'D') out.rows.push(body.toString('utf8', 6, body.length));
      if (type === 'E') {
        const fields = body.toString().split('\0');
        out.error = fields.find((f) => f.startsWith('M'))?.slice(1);
        out.code = fields.find((f) => f.startsWith('C'))?.slice(1);
      }
      if (type === 'Z') return out;
    }
  }
  async query(sql: string) {
    this.send('Q', cstr(sql));
    return this.until();
  }
}

const tooLong = (text: string | undefined) => assert.match(text ?? '', /SQL text is larger than 1 MB/);
const padded = (n: number) => `SELECT 1${' '.repeat(n)}`;

test('the PostgreSQL port refuses SQL text over the limit and stays usable', async () => {
  const c = await new Client().open();
  try {
    const simple = await c.query(padded(MAX_SQL_TEXT));
    assert.equal(simple.code, '53000');
    tooLong(simple.error);
    c.send('P', cstr(''), cstr(padded(MAX_SQL_TEXT)), i16(0));
    c.send('S');
    const parsed = await c.until();
    assert.equal(parsed.code, '53000');
    tooLong(parsed.error);
    assert.deepEqual((await c.query('SELECT 1')).rows, ['1']);
    assert.equal((await c.query(padded(1000))).error, undefined, 'text under the limit still runs');
  } finally { c.socket.destroy(); }
});

test('HTTP SQL refuses SQL text over the limit', async () => {
  const headers = { authorization: 'Basic ' + btoa('Ann:pw'), 'content-type': 'application/json' };
  const url = `${base}/tabularius/sql/v1/databases/Shop`;
  const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ sql: padded(MAX_SQL_TEXT) }) });
  assert.equal(r.status, 400);
  tooLong(((await r.json()) as { error: { code: number; message: string } }).error.message);
  const ok = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ sql: padded(1000) }) });
  assert.equal(ok.status, 200);
});
