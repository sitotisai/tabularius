import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { serve } from '../src/index.ts';
import { createStore } from '../../store/src/index.ts';
import { MAX_LIVE_STREAMS, MAX_STREAMS_PER_SESSION, MAX_STREAM_BUFFER, putStream } from '../src/live.ts';
import { MAX_MCP_STREAMS_PER_IDENTITY, MAX_MCP_UNVERIFIED_STREAMS_PER_ADDRESS } from '../src/stream-slots.ts';
import { RawClient, request, responseBody, normal, stubCommands } from './edge-test-helpers.ts';
import type { ServerResponse } from 'node:http';
import { removeAtExit } from '../../../scripts/test-remove-at-exit.ts';

async function start(t: TestContext, bodyMs?: number, limits: Record<string, number> = {}) {
  stubCommands(t);
  const dir = mkdtempSync(join(tmpdir(), 'edge-app-'));
  createStore(join(dir, 'Edge.openhbam.sqlite'));
  const app = await serve({ dir, port: 0, hostname: '127.0.0.1', watch: false, checkFiles: false, statsInterval: 0, log: () => {}, mcpToken: 'edge-admin', edgeLimits: { connectionsPerAddress: 400, ...(bodyMs ? { bodyMs, checkMs: 10 } : {}), ...limits } });
  t.after(async () => {
    app.server.closeAllConnections();
    await new Promise<void>(resolve => app.server.close(() => resolve()));
  });
  removeAtExit(dir);
  const port = Number(new URL(app.url).port);
  const store = app.host.get('Edge')!;
  store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name' }, { name: 'File', type: 'container' }] }]);
  store.setPassword('Admin', 'pw', '[Full Access]');
  const call = async (path: string, headers = '', method = 'GET', body = '') => {
    const c = await new RawClient(port).ready();
    return c.send(request(path, `Connection: close\r\n${body ? `Content-Length: ${Buffer.byteLength(body)}\r\n` : ''}${headers}`, method) + body).end();
  };
  const login = async () => {
    const text = await call('/fmi/data/vLatest/databases/Edge/sessions', 'Authorization: Basic ' + Buffer.from('Admin:pw').toString('base64') + '\r\n', 'POST');
    assert.match(text, /^HTTP\/1\.1 200 /);
    return JSON.parse(responseBody(text)).response.token as string;
  };
  return { ...app, store, port, call, login };
}

// /mcp answers no one without a credential: the server under test is given this administrator token.
const MCP_AUTH = 'Authorization: Bearer edge-admin\r\n';

test('production JSON, upload, import and MCP readers enforce declared family caps without receiving a body', async t => {
  const s = await start(t);
  const token = await s.login();
  const auth = `Authorization: Bearer ${token}\r\n`;
  const api = '/fmi/data/vLatest/databases/Edge/layouts/Items';
  for (const [path, bytes, headers] of [
    [`${api}/records`, 10 * 1024 * 1024 + 1, auth + 'Content-Type: application/json\r\n'],
    [`${api}/records/1/containers/File`, 1024 * 1024 * 1024 + 1, auth + 'Content-Type: multipart/form-data; boundary=abc\r\n'],
    ['/tabularius/design/v1/databases/Edge/import-tables', 50 * 1024 * 1024 + 256 * 1024 + 1, auth + 'Content-Type: multipart/form-data; boundary=abc\r\n'],
    ['/mcp', 4 * 1024 * 1024 + 1, MCP_AUTH + 'Content-Type: application/json\r\nAccept: application/json, text/event-stream\r\n'],
  ] as const) {
    const c = await new RawClient(s.port).ready();
    c.send(request(path, `${headers}Content-Length: ${bytes}\r\nExpect: 100-continue\r\n`, 'POST'));
    await normal(s.port);
    assert.match(await c.end(), /^HTTP\/1\.1 413 /);
    assert.doesNotMatch(c.text, /100 Continue/);
  }
  // A verified session accepts an ordinary JSON envelope larger than the pre-authentication 64 KiB cap.
  const body = JSON.stringify({ fieldData: { Name: 'x'.repeat(70 * 1024) } });
  const accepted = await s.call(`${api}/records`, auth + 'Content-Type: application/json\r\n', 'POST', body);
  assert.match(accepted, /^HTTP\/1\.1 200 /);
  const started = await s.call(`${api}/records/1/container-uploads/File`, auth + 'Content-Type: application/json\r\n', 'POST', JSON.stringify({ filename: 'generated.bin', size: 70 * 1024 * 1024 }));
  assert.match(started, /^HTTP\/1\.1 200 /);
  const id = JSON.parse(responseBody(started)).response.uploadId;
  const piece = await new RawClient(s.port).ready();
  piece.send(request(`${api}/container-uploads/${id}?offset=0`, `${auth}Content-Length: ${64 * 1024 * 1024 + 1}\r\nExpect: 100-continue\r\n`, 'PUT'));
  await normal(s.port);
  assert.match(await piece.end(), /^HTTP\/1\.1 413 /);
  const progress = JSON.parse(responseBody(await s.call(`${api}/container-uploads/${id}`, auth)));
  assert.equal(progress.response.received, 0);
  const tables = s.store.schema.tables.map(table => table.name);
  const part = '--abc\r\nContent-Disposition: form-data; name="file"; filename="New.csv"\r\n\r\nName\r\nAlice\r\n';
  const form = part + '--abc\r\nContent-Disposition: form-data; name="padding"\r\n\r\nx\r\n'.repeat(100) + '--abc--\r\n';
  assert.match(await s.call('/tabularius/design/v1/databases/Edge/import-tables?stage=import', auth + 'Content-Type: multipart/form-data; boundary=abc\r\n', 'POST', form), /^HTTP\/1\.1 413 /);
  assert.deepEqual(s.store.schema.tables.map(table => table.name), tables, 'the part cap cannot partially import tables');
  const mcpBody = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping', params: { _meta: { padding: 'x'.repeat(70 * 1024) } } });
  assert.match(await s.call('/mcp', MCP_AUTH + 'Content-Type: application/json\r\nAccept: application/json, text/event-stream\r\n', 'POST', mcpBody), /^HTTP\/1\.1 200 /);
  assert.equal(s.store.findIds('Items').length, 1);
});

test('live streams evict at ten per session, cap total subscribers, release listeners and keep ordinary requests responsive', async t => {
  const s = await start(t);
  const clients: RawClient[] = [];
  t.after(() => { for (const c of clients) c.socket.destroy(); });
  const baseline = s.store.listeners.size;
  const open = async (token: string) => {
    const c = await new RawClient(s.port).ready();
    clients.push(c);
    c.send(request('/tabularius/live/v1/databases/Edge/events', `Authorization: Bearer ${token}\r\n`));
    await c.until(text => text.includes('\r\n\r\n'));
    return c;
  };
  let token = await s.login();
  for (let i = 0; i < MAX_STREAMS_PER_SESSION; i++) assert.match((await open(token)).text, /^HTTP\/1\.1 200 /);
  assert.match((await open(token)).text, /^HTTP\/1\.1 200 /);
  await clients[0].end();
  await normal(s.port);
  assert.equal(s.store.listeners.size, baseline + MAX_STREAMS_PER_SESSION);
  for (let i = MAX_STREAMS_PER_SESSION; i < MAX_LIVE_STREAMS; i++) {
    if (i % MAX_STREAMS_PER_SESSION === 0) token = await s.login();
    assert.match((await open(token)).text, /^HTTP\/1\.1 200 /);
  }
  assert.equal(s.store.listeners.size, baseline + MAX_LIVE_STREAMS);
  const refused = await open(await s.login());
  assert.match(refused.text, /^HTTP\/1\.1 503 /);
  await normal(s.port);
  assert.equal(s.store.listeners.size, baseline + MAX_LIVE_STREAMS);
  clients[1].socket.destroy();
  await clients[1].closed;
  await normal(s.port);
  assert.match((await open(token)).text, /^HTTP\/1\.1 200 /);
  for (const c of clients) c.socket.destroy();
  await Promise.all(clients.map(c => c.closed));
  await normal(s.port);
  assert.equal(s.store.listeners.size, baseline);
  // The installed stateless MCP transport does serve standalone GET subscriptions.
  const mcp = async () => {
    const c = await new RawClient(s.port).ready();
    clients.push(c);
    c.send(request('/mcp', MCP_AUTH + 'Accept: text/event-stream\r\n'));
    await c.until(text => text.includes('\r\n\r\n'));
    return c;
  };
  const opened: RawClient[] = [];
  for (let i = 0; i < MAX_MCP_STREAMS_PER_IDENTITY; i++) {
    const c = await mcp(); opened.push(c);
    assert.match(c.text, /^HTTP\/1\.1 200 /);
  }
  assert.match((await mcp()).text, /^HTTP\/1\.1 503 /);
  await normal(s.port);
  for (const c of opened) c.socket.destroy();
  await Promise.all(opened.map(c => c.closed));
  await normal(s.port);
  assert.match((await mcp()).text, /^HTTP\/1\.1 200 /);
  await normal(s.port);
});

test('existing live backpressure refuses a stalled subscriber without writing more bytes', () => {
  let written = 0, destroyed = false;
  const res = { writableEnded: false, destroyed: false, writableLength: MAX_STREAM_BUFFER + 1,
    write() { written++; }, destroy() { destroyed = true; } } as unknown as ServerResponse;
  assert.equal(putStream(res, 'event'), false);
  assert.equal(destroyed, true);
  assert.equal(written, 0);
});


test('the full decoded JSON query budget fits even with worst-case percent encoding', async t => {
  const s = await start(t);
  const auth = `Authorization: Bearer ${await s.login()}\r\n`;
  const base = JSON.stringify([{ fieldName: 'Name', sortOrder: 'ascend', extra: '' }]);
  for (const bytes of [8141, 8192]) {
    const query = base.replace('"extra":""', '"extra":"' + ' '.repeat(bytes - Buffer.byteLength(base)) + '"');
    assert.equal(Buffer.byteLength(query), bytes);
    const path = '/fmi/data/vLatest/databases/Edge/layouts/Items/records?_sort=' + encodeURIComponent(query);
    assert.ok(path.length > 12 * 1024);
    const response = await s.call(path, auth);
    assert.match(response, /^HTTP\/1.1 200 /);
  }
});


test('authenticated uploads above the sign-in cap can progress longer than the idle budget', async t => {
  const s = await start(t, 300);
  const token = await s.login();
  const body = JSON.stringify({ fieldData: { Name: 'x'.repeat(80 * 1024) } });
  const c = await new RawClient(s.port).ready();
  c.send(request('/fmi/data/vLatest/databases/Edge/layouts/Items/records',
    `Authorization: Bearer ${token}\r\nContent-Type: application/json\r\nContent-Length: ${body.length}\r\nConnection: close\r\n`, 'POST'));
  for (let at = 0; at < body.length; at += 8192) { c.send(body.slice(at, at + 8192)); await sleep(60); }
  assert.match(await c.end(), /^HTTP\/1.1 200 /);
  assert.equal(s.store.findIds('Items').length, 1);
});

test('sign-in bodies that never arrive cannot take every request slot', async t => {
  const s = await start(t);
  const held: RawClient[] = [];
  t.after(() => { for (const c of held) c.socket.destroy(); });
  // One address may hold 24 slots here, so only a cap on unfinished small bodies leaves room for other requests.
  for (let i = 0; i < 30; i++) {
    const c = await new RawClient(s.port).ready(); held.push(c);
    c.send(request('/fmi/data/vLatest/databases/Edge/sessions', 'Content-Type: application/json\r\nContent-Length: 200\r\n', 'POST') + '{');
  }
  // The surplus is refused as busy once its short wait is over, so every connection has been looked at.
  await Promise.all(held.slice(-6).map(c => c.until(text => /^HTTP\/1\.1 503 /.test(text))));
  assert.match(await s.call('/docs/'), /^HTTP\/1\.1 200 /);
  assert.doesNotMatch(await s.call('/fmi/data/vLatest/databases'), /^HTTP\/1\.1 503 /);
});

test('GET /mcp streams with made-up Basic accounts take no request slot and are bounded per address', async t => {
  const s = await start(t);
  const held: RawClient[] = [];
  t.after(() => { for (const c of held) c.socket.destroy(); });
  const statuses: string[] = [];
  for (let i = 0; i < 40; i++) {
    const c = await new RawClient(s.port).ready(); held.push(c);
    // A new account name every connection, so the per-account limit never applies.
    c.send(request('/mcp', `Accept: text/event-stream\r\nAuthorization: Basic ${Buffer.from(`nobody${i}:x`).toString('base64')}\r\n`));
    await c.until(text => text.includes('\r\n\r\n'));
    statuses.push(c.text.slice(9, 12));
  }
  assert.equal(statuses.filter(code => code === '200').length, MAX_MCP_UNVERIFIED_STREAMS_PER_ADDRESS);
  assert.match(await s.call('/docs/'), /^HTTP\/1\.1 200 /);
  assert.doesNotMatch(await s.call('/fmi/data/vLatest/databases'), /^HTTP\/1\.1 503 /);
});

test('chunked bodies that trickle to the routes that read before sign-in are ended, so they cannot hold every slot', async t => {
  const s = await start(t, undefined, { smallBodyMs: 400, checkMs: 10 });
  const held: RawClient[] = [];
  const drip = setInterval(() => { for (const c of held) if (!c.socket.destroyed) c.socket.write('1\r\nx\r\n'); }, 100);
  t.after(() => { clearInterval(drip); for (const c of held) c.socket.destroy(); });
  // The XML gateway and OAuth registration read up to 64 KiB with no sign-in at all; none of these is a sign-in route.
  for (const path of ['/fmi/xml/fmresultset.xml', '/oauth/register', '/oauth/revoke']) {
    const group: RawClient[] = [];
    for (let i = 0; i < 25; i++) {
      const c = await new RawClient(s.port).ready(); held.push(c); group.push(c);
      c.send(request(path, 'Transfer-Encoding: chunked\r\nContent-Type: application/x-www-form-urlencoded\r\n', 'POST') + '1\r\nx\r\n');
    }
    // Each is answered (refused as busy, or ended at the deadline) and closed well before the 300 s idle budget.
    await Promise.all(group.map(c => c.until(text => /^HTTP\/1\.1 (408|503) /.test(text))));
    assert.ok(group.some(c => /^HTTP\/1\.1 408 /.test(c.text)), `${path}: a body that was let in ends at the total deadline`);
    // An answered body's connection is cut within the two-second drain window; only then is its slot free again.
    let docs = '';
    for (let i = 0; i < 100 && !/^HTTP\/1\.1 200 /.test(docs); i++) { docs = await s.call('/docs/'); if (!/^HTTP\/1\.1 200 /.test(docs)) await sleep(50); }
    assert.match(docs, /^HTTP\/1\.1 200 /);
  }
});

test('a Data API call with a made-up token is refused before its body is read, so a trickled body holds nothing', async t => {
  const s = await start(t, undefined, { smallBodyMs: 400, checkMs: 10 });
  const held: RawClient[] = [];
  const drip = setInterval(() => { for (const c of held) if (!c.socket.destroyed) c.socket.write('1\r\nx\r\n'); }, 100);
  t.after(() => { clearInterval(drip); for (const c of held) c.socket.destroy(); });
  for (let i = 0; i < 25; i++) {
    const c = await new RawClient(s.port).ready(); held.push(c);
    c.send(request('/fmi/data/vLatest/databases/Edge/layouts/Items/records', 'Transfer-Encoding: chunked\r\nContent-Type: application/json\r\nAuthorization: Bearer made-up\r\n', 'POST') + '1\r\nx\r\n');
  }
  await Promise.all(held.map(c => c.until(text => /^HTTP\/1\.1 401 /.test(text))));
});

test('a made-up token does not exempt a body from the deadline, however the sign-in address is spelled, while a real session on another route is left alone', async t => {
  const s = await start(t, undefined, { smallBodyMs: 400, checkMs: 10 });
  const held: RawClient[] = [];
  const drip = setInterval(() => { for (const c of held) if (!c.socket.destroyed) c.socket.write('1\r\nx\r\n'); }, 100);
  t.after(() => { clearInterval(drip); for (const c of held) c.socket.destroy(); });
  // The Data API decodes each path segment before it routes, so these are the sign-in route; it reads the body before it looks at the token.
  for (const path of ['/fmi/data/v1/databases/Edge/%73essions', '/fmi/data/v1/databases/Edge/session%73']) {
    const group: RawClient[] = [];
    for (let i = 0; i < 12; i++) {
      const c = await new RawClient(s.port).ready(); held.push(c); group.push(c);
      c.send(request(path, 'Transfer-Encoding: chunked\r\nContent-Type: application/json\r\nAuthorization: Bearer made-up\r\n', 'POST') + '1\r\nx\r\n');
    }
    await Promise.all(group.map(c => c.until(text => /^HTTP\/1\.1 (408|503) /.test(text))));
    assert.ok(group.some(c => /^HTTP\/1\.1 408 /.test(c.text)), `${path}: a body that was let in ends at the total deadline`);
    let docs = '';
    for (let i = 0; i < 100 && !/^HTTP\/1\.1 200 /.test(docs); i++) { docs = await s.call('/docs/'); if (!/^HTTP\/1\.1 200 /.test(docs)) await sleep(50); }
    assert.match(docs, /^HTTP\/1\.1 200 /);
  }
  // A session this server holds, on a route that is not sign-in: a chunked body may take longer than the deadline.
  const token = await s.login();
  const c = await new RawClient(s.port).ready();
  c.send(request('/fmi/data/vLatest/databases/Edge/layouts/Items/records', `Authorization: Bearer ${token}\r\nContent-Type: application/json\r\nTransfer-Encoding: chunked\r\nConnection: close\r\n`, 'POST'));
  const json = '{"fieldData":{"Name":"slow"}}';
  for (let at = 0; at < json.length; at += 3) { const piece = json.slice(at, at + 3); c.send(`${piece.length.toString(16)}\r\n${piece}\r\n`); await sleep(100); }
  assert.match(await c.send('0\r\n\r\n').end(), /^HTTP\/1\.1 200 /);
  assert.equal(s.store.findIds('Items').length, 1);
});

test('a real token does not exempt the sign-in routes, which read their body without looking at it, and a stranger can still sign in', async t => {
  const s = await start(t, undefined, { smallBodyMs: 400, checkMs: 10 });
  const token = await s.login();
  const held: RawClient[] = [];
  const drip = setInterval(() => { for (const c of held) if (!c.socket.destroyed) c.socket.write('1\r\n \r\n'); }, 100);
  t.after(() => { clearInterval(drip); for (const c of held) c.socket.destroy(); });
  const sessions = '/fmi/data/vLatest/databases/Edge/sessions';
  for (const [path, who] of [
    [sessions, `Authorization: Bearer ${token}\r\n`],
    [`${sessions}/passkey`, `Authorization: Bearer ${token}\r\n`],
    [`${sessions}/recovery`, `Authorization: Bearer ${token}\r\n`],
    [sessions, `X-FM-Data-Access-Token: ${token}\r\n`],
  ] as const) {
    const group: RawClient[] = [];
    for (let i = 0; i < 12; i++) {
      const c = await new RawClient(s.port).ready(); held.push(c); group.push(c);
      c.send(request(path, `Transfer-Encoding: chunked\r\nContent-Type: application/json\r\n${who}`, 'POST') + '1\r\n \r\n');
    }
    await Promise.all(group.map(c => c.until(text => /^HTTP\/1\.1 (408|503) /.test(text))));
    assert.ok(group.some(c => /^HTTP\/1\.1 408 /.test(c.text)), `${path}: a body that was let in ends at the total deadline`);
    let signedIn = '';
    for (let i = 0; i < 100 && !/^HTTP\/1\.1 200 /.test(signedIn); i++) { signedIn = await s.call(sessions, 'Authorization: Basic ' + Buffer.from('Admin:pw').toString('base64') + '\r\n', 'POST', '{}'); if (!/^HTTP\/1\.1 200 /.test(signedIn)) await sleep(50); }
    assert.match(signedIn, /^HTTP\/1\.1 200 /);
  }
});

test('asking whether a token is held does not record a use of it', async t => {
  const s = await start(t);
  const token = s.store.createApiToken('Admin');
  const id = /^ohbt_([0-9a-f]+)\./.exec(token)![1];
  const lastUsed = () => s.store.apiTokens().find(entry => entry.id === id)!.lastUsed;
  assert.ok(s.store.apiToken(token, false));
  assert.equal(lastUsed(), undefined, 'a look at the token leaves its last use alone');
  assert.ok(s.store.apiToken(token));
  assert.ok(lastUsed(), 'a use of it is recorded');
});
