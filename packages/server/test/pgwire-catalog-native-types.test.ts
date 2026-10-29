// Synthetic native store only. psql's \d asks format_type for each column's type; a json or uuid column printed ???.
// Also the catalog queries psql 17 and 18 send for \dx, \dconfig and \df+, copied from a psql 18.6 started with -E.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { connect, type Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../../store/src/index.ts';
import { Host } from '../src/host.ts';
import { PgServer } from '../src/pgwire.ts';

const cstr = (s: string) => Buffer.from(s + '\0');
const i32 = (n: number) => { const b = Buffer.alloc(4); b.writeInt32BE(n); return b; };
type Message = { type: string; body: Buffer };
let dir: string;
let port: number;
const sockets = new Set<Socket>();

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-pg-native-types-'));
  const path = join(dir, 'Native.openhbam.sqlite');
  createStore(path, { mode: 'native' });
  const native = new Store(path, 'Native');
  try {
    native.applyDesign([{ op: 'createTable', name: 'Values', fields: [{ name: 'Payload', type: 'json' }, { name: 'Key', type: 'uuid' }, { name: 'Note', type: 'text' }] }]);
    const full = native.privilegeSets().find((p) => p.id === 1)!;
    native.savePrivilegeSet({ ...full, extendedPrivileges: [...full.extendedPrivileges, 'fmxdbc'] });
    native.setPassword('Reader', 'pw', full.name);
  } finally { native.close(); }
});
after(async () => {
  for (const s of sockets) s.destroy();
  for (const { pg, host } of servers) { pg.close(); await host.close(); }
  if (dir) rmSync(dir, { recursive: true, force: true });
});

// A server of its own for each test: the catalog's functions are defined on a file the first time a query needs them.
const servers: { pg: PgServer; host: Host }[] = [];
async function freshServer() {
  const host = new Host(dir);
  const pg = new PgServer(host, { port: 0 });
  servers.push({ pg, host });
  port = await pg.listen();
}

class Client {
  private buf = Buffer.alloc(0);
  private wake?: () => void;
  readonly socket = connect(port, '127.0.0.1');
  constructor() {
    sockets.add(this.socket);
    this.socket.on('data', (b: Buffer) => { this.buf = Buffer.concat([this.buf, b]); this.wake?.(); });
    this.socket.on('error', () => this.wake?.());
    this.socket.on('close', () => this.wake?.());
  }
  async read(): Promise<Message> {
    for (;;) {
      if (this.buf.length >= 5 && this.buf.length >= this.buf.readInt32BE(1) + 1) {
        const end = this.buf.readInt32BE(1) + 1;
        const msg = { type: this.buf.toString('ascii', 0, 1), body: this.buf.subarray(5, end) };
        this.buf = this.buf.subarray(end);
        return msg;
      }
      if (this.socket.destroyed || this.socket.readableEnded) throw new Error('connection closed');
      await new Promise<void>((resolve) => { this.wake = resolve; });
    }
  }
  async until() {
    const msgs: Message[] = [];
    do { msgs.push(await this.read()); } while (msgs.at(-1)!.type !== 'Z');
    return msgs;
  }
  async open() {
    const params = Buffer.from('user\0Reader\0database\0Native\0\0');
    this.socket.write(Buffer.concat([i32(params.length + 8), i32(196608), params]));
    assert.equal((await this.read()).type, 'R');
    this.send('p', cstr('pw'));
    assert.equal((await this.until()).some((m) => m.type === 'E'), false);
    return this;
  }
  send(type: string, ...parts: Buffer[]) {
    const body = Buffer.concat(parts);
    this.socket.write(Buffer.concat([Buffer.from(type), i32(body.length + 4), body]));
  }
  async rows(sql: string) {
    this.send('Q', cstr(sql));
    const msgs = await this.until();
    assert.equal(msgs.some((m) => m.type === 'E'), false, msgs.find((m) => m.type === 'E')?.body.toString());
    return msgs.filter((m) => m.type === 'D').map(({ body }) => {
      let pos = 2;
      return Array.from({ length: body.readInt16BE(0) }, () => {
        const len = body.readInt32BE(pos);
        pos += 4;
        if (len < 0) return null;
        pos += len;
        return body.toString('utf8', pos - len, pos);
      });
    });
  }
}

test('format_type, pg_type and information_schema name a json and a uuid column', { timeout: 10_000 }, async () => {
  await freshServer();
  const c = await new Client().open();
  try {
    assert.deepEqual(await c.rows(
      `SELECT a.attname, pg_catalog.format_type(a.atttypid, a.atttypmod) FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON c.oid = a.attrelid WHERE c.relname = 'Values' AND a.attnum > 0 ORDER BY a.attnum`),
    [['Payload', 'jsonb'], ['Key', 'uuid'], ['Note', 'text']]);
    assert.deepEqual(await c.rows(`SELECT oid, typname FROM pg_catalog.pg_type WHERE typname IN ('jsonb', 'uuid') ORDER BY oid`), [['2950', 'uuid'], ['3802', 'jsonb']]);
    assert.deepEqual(await c.rows(`SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'Values' ORDER BY ordinal_position`),
      [['Payload', 'jsonb', 'jsonb'], ['Key', 'uuid', 'uuid'], ['Note', 'text', 'text']]);
  } finally { c.socket.destroy(); }
});

test('the queries of psql 18 for \\dx, \\dconfig and \\df+ answer with no rows', { timeout: 10_000 }, async () => {
  await freshServer();
  const c = await new Client().open();
  try {
    assert.deepEqual(await c.rows(`SELECT e.extname AS "Name", e.extversion AS "Version", ae.default_version AS "Default version",n.nspname AS "Schema", d.description AS "Description"
FROM pg_catalog.pg_extension e LEFT JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace LEFT JOIN pg_catalog.pg_description d ON d.objoid = e.oid AND d.classoid = 'pg_catalog.pg_extension'::pg_catalog.regclass LEFT JOIN pg_catalog.pg_available_extensions() ae(name, default_version, comment) ON ae.name = e.extname
ORDER BY 1;`), []);
    assert.deepEqual(await c.rows(`SELECT name FROM pg_catalog.pg_available_extensions`), []);
    assert.deepEqual(await c.rows(`SELECT s.name AS "Parameter", pg_catalog.current_setting(s.name) AS "Value"
FROM pg_catalog.pg_settings s
WHERE s.source <> 'default' AND
      s.setting IS DISTINCT FROM s.boot_val
ORDER BY 1;`), []);
    assert.deepEqual(await c.rows(`SELECT n.nspname as "Schema", p.proname as "Name",
 CASE WHEN p.provolatile = 'i' THEN 'immutable' WHEN p.provolatile = 's' THEN 'stable' WHEN p.provolatile = 'v' THEN 'volatile' END as "Volatility",
 CASE WHEN p.proparallel = 'r' THEN 'restricted' WHEN p.proparallel = 's' THEN 'safe' WHEN p.proparallel = 'u' THEN 'unsafe' END as "Parallel",
 CASE WHEN prosecdef THEN 'definer' ELSE 'invoker' END AS "Security",
 CASE WHEN p.proleakproof THEN 'yes' ELSE 'no' END as "Leakproof?",
 CASE WHEN pg_catalog.array_length(p.proacl, 1) = 0 THEN '(none)' ELSE pg_catalog.array_to_string(p.proacl, E'\\n') END AS "Access privileges",
 l.lanname as "Language"
FROM pg_catalog.pg_proc p
     LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
     LEFT JOIN pg_catalog.pg_language l ON l.oid = p.prolang
WHERE pg_catalog.pg_function_is_visible(p.oid)
      AND n.nspname <> 'pg_catalog'
      AND n.nspname <> 'information_schema'
ORDER BY 1, 2, 4;`), []);
  } finally { c.socket.destroy(); }
});

test('\\gdesc: the VALUES list of psql 18 with a column list after its alias answers each column name and type', { timeout: 10_000 }, async () => {
  await freshServer();
  const c = await new Client().open();
  try {
    assert.deepEqual(await c.rows(`SELECT name AS "Column", pg_catalog.format_type(tp, tpm) AS "Type"
FROM (VALUES ('Name', '25'::pg_catalog.oid, -1),('Age', '20'::pg_catalog.oid, -1),('Payload', '3802'::pg_catalog.oid, -1),('x (y)', '16'::pg_catalog.oid, -1)) s(name, tp, tpm)`),
    [['Name', 'text'], ['Age', 'bigint'], ['Payload', 'jsonb'], ['x (y)', 'boolean']]);
  } finally { c.socket.destroy(); }
});
