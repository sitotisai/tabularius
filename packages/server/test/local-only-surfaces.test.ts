// An account set to "sign in only from the server itself" is refused with a correct password on every
// password surface, not only the Data API: OData, SQL over HTTP and XML publishing (HTTP Basic), /mcp
// (Basic and the admin console's ohm_ tokens) and the PostgreSQL port. Each refuses with the text a wrong
// password gets, so a caller holding the password cannot tell a local-only account from a wrong one.
// The MCP and SQL password caches are also keyed by the address, so a password checked from this computer
// does not stand in for the checks a remote address gets.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { connect, type Socket } from 'node:net';
import { serve } from '../src/index.ts';
import { Host } from '../src/host.ts';
import { PgServer } from '../src/pgwire.ts';
import { McpTokens } from '../src/mcp-tokens.ts';
import { LOCKOUT } from '../../store/src/index.ts';

const REMOTE = '203.0.113.9';
const password = ['local', 'only', 'pw'].join('-');
const basic = (account: string, pw = password) => 'Basic ' + Buffer.from(`${account}:${pw}`).toString('base64');

function populate(store: ReturnType<Host['create']>) {
  store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Title' }] }]);
  store.create('Items', { Title: 'row' });
  store.savePrivilegeSet({ name: 'Reader', records: { view: true, edit: false, create: false, delete: false }, layouts: 'viewOnly', valueLists: 'none', scripts: 'none', extendedPrivileges: ['fmrest', 'fmapp', 'fmmcp', 'fmodata', 'fmxdbc', 'fmxml'] });
  store.setPassword('Local', password, 'Reader');
  store.setAccountLocalOnly('Local', true);
  store.setPassword('Open', password, 'Reader');
}

async function app(t: import('node:test').TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-local-only-'));
  const s = await serve({ dir, port: 0, watch: false, log: () => {}, trustedProxies: ['127.0.0.1'], proxyHeader: 'x-forwarded-for' });
  t.after(async () => {
    s.server.closeAllConnections();
    await new Promise<void>((r) => s.server.close(() => r()));
    rmSync(dir, { recursive: true, force: true });
  });
  const store = s.host.create('Shop');
  populate(store);
  const get = (path: string, headers: Record<string, string>, from?: string) =>
    fetch(s.url + path, { headers: { ...headers, ...(from ? { 'x-forwarded-for': from } : {}) } });
  return { s, dir, store, get };
}

test('HTTP Basic on OData, SQL and XML refuses a local-only account away from the server, as a wrong password', async (t) => {
  const { get } = await app(t);
  const surfaces = ['/fmi/odata/v4/Shop', '/tabularius/sql/v1/databases/Shop/tables', '/fmi/xml/fmresultset.xml?-db=Shop&-lay=Items&-findall'];
  for (const path of surfaces) {
    const wrong = await get(path, { authorization: basic('Local', 'wrong') }, REMOTE);
    const remote = await get(path, { authorization: basic('Local') }, REMOTE);
    assert.equal(remote.status, 401, path);
    assert.equal(await remote.text(), await wrong.text(), path);
    // An account without the restriction is let in from the same address.
    assert.equal((await get(path, { authorization: basic('Open') }, REMOTE)).status, 200, path);
  }
});

test('/mcp refuses a local-only account on Basic and on an ohm_ token away from the server', async (t) => {
  const { s, dir, store } = await app(t);
  const call = (headers: Record<string, string>, from?: string) => fetch(s.url + '/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-06-18', ...headers, ...(from ? { 'x-forwarded-for': from } : {}) },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'get_record', arguments: { database: 'Shop', layout: 'Items', recordId: 1 } } }),
  });
  const seesRow = async (r: Response) => r.status === 200 && (await r.text()).includes('"Title"');
  assert.equal(await seesRow(await call({ authorization: basic('Local') }, REMOTE)), false);
  assert.equal(await seesRow(await call({ authorization: basic('Open') }, REMOTE)), true);

  const tokens = new McpTokens(dir, undefined, (database, account) => s.host.get(database)?.credentialIdentity(account));
  const local = tokens.create({ database: 'Shop', account: 'Local' }).token;
  const open = tokens.create({ database: 'Shop', account: 'Open' }).token;
  const refused = await call({ authorization: `Bearer ${local}` }, REMOTE);
  assert.equal(refused.status, 401);
  assert.equal(await seesRow(await call({ authorization: `Bearer ${open}` }, REMOTE)), true);
  // The refusals are in the file's sign-in log, away from the caller.
  assert.ok(store.securityEvents({ account: 'Local', kind: 'sign-in-failed' }).length >= 2);
});

test('a password checked from one address does not stand in for the check another address gets', async (t) => {
  const { s, store, get } = await app(t);
  const other = '203.0.113.10';
  // The second address is locked out of the account by wrong guesses; the lockout is per address.
  for (let i = 0; i < LOCKOUT.attempts; i++) store.verify('Open', 'wrong', other);
  assert.ok(store.lockedOut('Open', other));
  assert.ok(!store.lockedOut('Open', REMOTE));
  // SQL over HTTP: verified from the first address, then the same credentials from the locked-out one.
  const sql = '/tabularius/sql/v1/databases/Shop/tables';
  assert.equal((await get(sql, { authorization: basic('Open') }, REMOTE)).status, 200);
  assert.equal((await get(sql, { authorization: basic('Open') }, other)).status, 401);
  // /mcp: the same.
  const call = (from: string) => fetch(s.url + '/mcp', {
    method: 'POST',
    headers: { authorization: basic('Open'), 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-06-18', 'x-forwarded-for': from },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'get_record', arguments: { database: 'Shop', layout: 'Items', recordId: 1 } } }),
  });
  const seesRow = async (r: Response) => r.status === 200 && (await r.text()).includes('"Title"');
  assert.equal(await seesRow(await call(REMOTE)), true);
  assert.equal(await seesRow(await call(other)), false);
});

test('a local-only account still signs in over HTTP Basic from the server itself', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-local-only-direct-'));
  const s = await serve({ dir, port: 0, watch: false, log: () => {} });
  t.after(async () => {
    s.server.closeAllConnections();
    await new Promise<void>((r) => s.server.close(() => r()));
    rmSync(dir, { recursive: true, force: true });
  });
  populate(s.host.create('Shop'));
  for (const path of ['/fmi/odata/v4/Shop', '/tabularius/sql/v1/databases/Shop/tables', '/fmi/xml/fmresultset.xml?-db=Shop&-lay=Items&-findall']) {
    assert.equal((await fetch(s.url + path, { headers: { authorization: basic('Local') } })).status, 200, path);
  }
});

function pgLogin(port: number, name: string, pw: string): Promise<{ code: string; message: string }> {
  return new Promise((resolve, reject) => {
    const socket = connect(port, '127.0.0.1');
    let buffer = Buffer.alloc(0), sent = false;
    socket.on('error', reject);
    socket.setTimeout(5000, () => socket.destroy(new Error('pgwire login timed out')));
    socket.on('connect', () => {
      const params = Buffer.from(`user\0${name}\0database\0Shop\0\0`), header = Buffer.alloc(8);
      header.writeInt32BE(8 + params.length); header.writeInt32BE(196608, 4);
      socket.write(Buffer.concat([header, params]));
    });
    socket.on('data', (data) => {
      buffer = Buffer.concat([buffer, data]);
      while (buffer.length >= 5 && buffer.length >= buffer.readInt32BE(1) + 1) {
        const type = String.fromCharCode(buffer[0]), length = buffer.readInt32BE(1), body = buffer.subarray(5, length + 1);
        buffer = buffer.subarray(length + 1);
        if (type === 'R' && body.readInt32BE(0) === 3 && !sent) {
          sent = true;
          const word = Buffer.from(pw + '\0'), header = Buffer.alloc(5);
          header.write('p'); header.writeInt32BE(4 + word.length, 1);
          socket.write(Buffer.concat([header, word]));
        } else if (type === 'E') {
          const fields = body.toString().split('\0');
          resolve({ code: fields.find((f) => f.startsWith('C'))!.slice(1), message: fields.find((f) => f.startsWith('M'))!.slice(1) });
          socket.destroy();
        } else if (type === 'Z') {
          resolve({ code: 'OK', message: '' });
          socket.destroy();
        }
      }
    });
    socket.on('close', () => reject(new Error('closed before an authentication result')));
  });
}

test('the PostgreSQL port refuses a local-only account away from the server, as a wrong password', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-local-only-pg-'));
  const host = new Host(dir);
  const pg = new PgServer(host, { port: 0 });
  populate(host.create('Shop'));
  const ctl = { from: '127.0.0.1' };
  t.mock.method(pg, 'isLocal', (socket: Socket) => {
    Object.defineProperty(socket, 'remoteAddress', { value: ctl.from, configurable: true });
    return true; // real loopback sockets; the address is injected after the TLS/local guard
  });
  const port = await pg.listen();
  t.after(async () => { pg.close(); await host.close(); rmSync(dir, { recursive: true, force: true }); });
  assert.equal((await pgLogin(port, 'Local', password)).code, 'OK');
  ctl.from = REMOTE;
  const wrong = await pgLogin(port, 'Local', 'wrong');
  const remote = await pgLogin(port, 'Local', password);
  assert.deepEqual(remote, wrong);
  assert.equal(remote.code, '28P01');
  assert.equal((await pgLogin(port, 'Open', password)).code, 'OK');
});
