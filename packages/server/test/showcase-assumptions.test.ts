// SC-00: synthetic stores and loopback requests only; no fixtures or command-line launches.
// Compatibility with the corresponding FileMaker behaviour is unverified offline.
import { after, before, test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createStore, type Store } from '../../store/src/index.ts';
import { expiryClock } from '../../store/src/clock.ts';
import { runScript } from '../../scripts/src/index.ts';
import { startDemo } from '../../cli/src/demo.ts';
import { serve, PgServer, readLocalMcpToken } from '../src/index.ts';
import { PgClient } from './pg-client.ts';

const password = ['synthetic', 'showcase', 'password'].join('-');
const none = { view: false, edit: false, create: false, delete: false };

// serve's folder ownership check can invoke the OS process-identity utility.
// Any accidental service/install/network command must hit a stub and fail this file.
let stubPath: string;
const oldPath = process.env.PATH;
const oldMarker = process.env.TABULARIUS_TEST_COMMAND_MARKER;
before(() => {
  stubPath = mkdtempSync(join(tmpdir(), 'tabularius-showcase-commands-'));
  process.env.TABULARIUS_TEST_COMMAND_MARKER = join(stubPath, 'unexpected-command');
  for (const command of ['launchctl', 'systemctl', 'sc', 'git', 'npm', 'curl', 'sudo']) {
    writeFileSync(join(stubPath, command), '#!/bin/sh\nprintf blocked >> "$TABULARIUS_TEST_COMMAND_MARKER"\nexit 99\n', { mode: 0o755 });
    writeFileSync(join(stubPath, command + '.cmd'), '@echo off\r\necho blocked >> "%TABULARIUS_TEST_COMMAND_MARKER%"\r\nexit /b 99\r\n');
  }
  process.env.PATH = stubPath;
});
after(() => {
  try { assert.equal(existsSync(join(stubPath, 'unexpected-command')), false, 'a forbidden command ran'); }
  finally {
    if (oldPath === undefined) delete process.env.PATH; else process.env.PATH = oldPath;
    if (oldMarker === undefined) delete process.env.TABULARIUS_TEST_COMMAND_MARKER; else process.env.TABULARIUS_TEST_COMMAND_MARKER = oldMarker;
    rmSync(stubPath, { recursive: true, force: true });
  }
});

async function hosted(t: TestContext, extra: Partial<Parameters<typeof serve>[0]> = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-showcase-'));
  let running: Awaited<ReturnType<typeof serve>> | undefined;
  t.after(async () => {
    try {
      if (running) {
        await new Promise<void>((resolve) => {
          running!.server.close(() => resolve());
          running!.server.closeAllConnections();
        });
        await running.host.close();
      }
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  createStore(join(dir, 'Showcase.openhbam.sqlite'));
  running = await serve({ dir, port: 0, hostname: '127.0.0.1', watch: false, checkFiles: false, log: () => {}, ...extra });
  return { ...running, dir, store: running.host.get('Showcase')! };
}

function deals(store: Store) {
  store.applyDesign([
    { op: 'createTable', name: 'Reps', fields: [{ name: 'Id' }, { name: 'Login' }] },
    { op: 'createTable', name: 'Deals', fields: [{ name: 'OwnerId' }, { name: 'Title' }] },
    { op: 'createRelationship', left: 'Deals', right: 'Reps', predicates: [{ left: 'OwnerId', right: 'Id' }] },
  ]);
  store.create('Reps', { Id: '1', Login: 'RepOne' });
  store.create('Reps', { Id: '2', Login: 'RepTwo' });
  const own = store.create('Deals', { OwnerId: '1', Title: 'Own deal' }).recordId;
  const other = store.create('Deals', { OwnerId: '2', Title: 'Other deal' }).recordId;
  const orphan = store.create('Deals', { OwnerId: 'missing', Title: 'Unassigned deal' }).recordId;
  const rule = 'Reps::Login = Get ( AccountName )';
  store.savePrivilegeSet({
    name: 'Sales reps', records: none,
    tables: { Reps: { ...none, view: true }, Deals: { ...none, view: rule, edit: rule } },
    layouts: 'viewOnly', valueLists: 'viewOnly', scripts: 'viewOnly',
    extendedPrivileges: ['fmrest', 'fmapp', 'fmmcp'],
  });
  store.setPassword('RepOne', password, 'Sales reps');
  store.setPassword('RepTwo', password, 'Sales reps');
  // Personal-data isolation is a separate gate from the privilege calculation under test.
  store.setAiPolicy(false);
  return { own, other, orphan };
}

async function mcp<T>(url: string, token: string, use: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ name: 'showcase-assumptions', version: '1.0.0' });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(`${url}/mcp`), {
      requestInit: { headers: { authorization: `Bearer ${token}` } },
    }));
    return await use(client);
  } finally { await client.close(); }
}

function toolJson(reply: Awaited<ReturnType<Client['callTool']>>) {
  assert.notEqual(reply.isError, true, 'MCP tool succeeded');
  const content = reply.content as { type: string; text?: string }[];
  assert.equal(content[0]?.type, 'text');
  return JSON.parse(content[0].text!);
}

test('SC-00 record limits: related owner calculation applies to Data API, Page API transport and MCP', async (t) => {
  const { url, store } = await hosted(t);
  const { own, other, orphan } = deals(store);
  const base = `${url}/fmi/data/vLatest/databases/Showcase`;
  for (const web of [false, true]) {
    // Page API records/find/update delegate to Api's Data API calls, with the web session header.
    // This tests that transport and session; it does not claim a browser/iframe rendering test.
    const surface: Record<string, string> = web ? { 'x-tabularius-client': 'web' } : {};
    const login = await fetch(`${base}/sessions`, {
      method: 'POST', headers: { ...surface, authorization: `Basic ${Buffer.from(`RepOne:${password}`).toString('base64')}`, 'content-type': 'application/json' }, body: '{}',
    });
    assert.equal(login.status, 200);
    const auth = { ...surface, authorization: `Bearer ${(await login.json()).response.token}`, 'content-type': 'application/json' };
    for (const find of [false, true]) {
      const response = await fetch(`${base}/layouts/Deals/${find ? '_find' : 'records'}`, {
        headers: auth, ...(find ? { method: 'POST', body: JSON.stringify({ query: [{ Title: '*' }] }) } : {}),
      });
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.deepEqual(body.response.data.map((r: { recordId: string }) => Number(r.recordId)), [own]);
      assert.equal(body.response.dataInfo.foundCount, 1);
    }
    for (const id of [own, other, orphan]) {
      const response = await fetch(`${base}/layouts/Deals/records/${id}`, {
        method: 'PATCH', headers: auth, body: JSON.stringify({ fieldData: { Title: web ? 'Page edit' : 'API edit' } }),
      });
      const body = await response.json();
      assert.equal(body.messages[0].code, id === own ? '0' : '200');
    }
  }
  for (const [account, visible] of [['RepOne', own], ['RepTwo', other]] as const) {
    const token = store.createApiToken(account, { surfaces: ['fmmcp'] });
    await mcp(url, token, async (client) => {
      const found = toolJson(await client.callTool({ name: 'find_records', arguments: { database: 'Showcase', layout: 'Deals', query: [{ Title: '*' }] } }));
      assert.deepEqual(found.records.map((r: { recordId: string }) => Number(r.recordId)), [visible]);
    });
  }
  assert.equal(store.get('Deals', other).fieldData.Title, 'Other deal');
  assert.equal(store.get('Deals', orphan).fieldData.Title, 'Unassigned deal');
});

// showcase assumption, currently false: demo starts a PostgreSQL listener and supplies an expiring MCP credential.
test('SC-00 demo defaults: no SQL listener; MCP requires its generated administrator credential', async (t) => {
  const listen = t.mock.method(PgServer.prototype, 'listen');
  const lines: string[] = [];
  // startDemo generates its starter data here; no pre-existing database or .fmp12 is opened.
  const demo = await startDemo({ log: (line) => lines.push(line) });
  try {
    assert.equal(new URL(demo.url).hostname, '127.0.0.1');
    assert.equal(listen.mock.callCount(), 0);
    assert.ok(!lines.some((line) => line.includes('PostgreSQL clients: port')));
    assert.equal((await fetch(`${demo.url}/mcp`)).status, 401);
    const token = readLocalMcpToken(demo.folder);
    assert.ok(token, 'serve creates the administrator credential in the temporary hosted folder');
    assert.ok(!lines.some((line) => line.includes(token)), 'the startup log does not disclose the token');
    t.mock.method(expiryClock, 'now', () => Date.now() + 100 * 365 * 86400_000);
    await mcp(demo.url, token, async (client) => {
      assert.ok((await client.listTools()).tools.some((tool) => tool.name === 'find_records'), 'the administrator token has no expiry gate');
    });
  } finally { await demo.stop(); }
});

test('SC-00 SQL opt-in: serve announces the allocated port and serves read-only SQL on loopback', async (t) => {
  let announce!: (port: number) => void;
  const announced = new Promise<number>((resolve) => { announce = resolve; });
  const { store } = await hosted(t, { sqlPort: 0, log: (line) => {
    const match = /^PostgreSQL clients: port (\d+)$/.exec(line);
    if (match) announce(Number(match[1]));
  } });
  store.applyDesign([{ op: 'createTable', name: 'Deals', fields: [{ name: 'Title' }] }]);
  store.create('Deals', { Title: 'Synthetic' });
  store.setPassword('Admin', password, '[Full Access]');
  const full = store.privilegeSet('[Full Access]')!;
  assert.ok(!full.extendedPrivileges.includes('fmxdbc'), 'SQL access is not granted by default, even to Admin');
  store.savePrivilegeSet({ ...full, extendedPrivileges: [...full.extendedPrivileges, 'fmxdbc'] });
  // A bounded event wait, not a sleep or a probe of a fixed machine port.
  const port = await Promise.race([announced, new Promise<never>((_, reject) => {
    const timer = setTimeout(() => reject(new Error('SQL port was not announced')), 15_000);
    t.after(() => clearTimeout(timer));
    timer.unref();
  })]);
  assert.ok(port > 0 && port < 65536);
  const client = await PgClient.open({ port, user: 'Admin', password, database: 'Showcase' });
  try {
    assert.equal(client.socket.remoteAddress, '127.0.0.1');
    const read = await client.simple('SELECT COUNT(*) FROM Deals');
    assert.equal(read.error, undefined);
    assert.deepEqual(read.rows, [['1']]);
    const write = await client.simple("UPDATE Deals SET Title = 'Changed'");
    assert.ok(write.error, 'SQL writes require a separate opt-in');
    assert.equal(store.find('Deals').records[0].fieldData.Title, 'Synthetic');
  } finally { client.close(); }
});

// showcase assumption, currently false: AI-off script result text contains an actionable explanation.
test('SC-00 AI off: both steps return error 3 and an empty result, with actionable trace messages', async (t) => {
  const { store, host, url } = await hosted(t);
  store.applyDesign([
    { op: 'createTable', name: 'Deals', fields: [{ name: 'Title' }] },
    { op: 'createScript', name: 'AI off', text: [
      'Set Error Capture [ On ]',
      'Perform Find by Natural Language [ Account Name: "local" ; Model: "unused" ; Prompt: "Find all deals" ]',
      'Generate Response from Model [ Account Name: "local" ; Model: "unused" ; User Prompt: "Describe the deals" ; Response: $answer ]',
    ].join('\n') },
  ]);
  assert.equal(host.scriptOptions().ai, undefined);
  const result = await runScript(store, 'AI off', { ...host.scriptOptions(), layout: 'Deals', trace: true });
  assert.equal(result.error, 3);
  assert.equal(result.result, '');
  assert.deepEqual(result.trace!.filter((line) => line.error).map((line) => ({ error: line.error, message: line.message })),
    ['Perform Find by Natural Language', 'Generate Response from Model'].map((step) => ({
      error: 3, message: `${step} needs an AI model, and scripts here run offline (a server started with --ai runs it)`,
    })));
  store.setPassword('Admin', password, '[Full Access]');
  const token = store.createApiToken('Admin', { surfaces: ['fmrest'] });
  const response = await fetch(`${url}/fmi/data/vLatest/databases/Showcase/layouts/Deals/script/AI%20off`, {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.response.scriptError, '3');
  assert.equal(body.response.scriptResult, '');
});

test('SC-00 MCP onboarding: the existing agent helper works after startup and expiry ends access', async (t) => {
  const { url, store } = await hosted(t);
  const { own } = deals(store);
  let now = Date.now();
  t.mock.method(expiryClock, 'now', () => now);
  const expires = new Date(now + 3600_000);
  const token = store.createAgentApiToken('Showcase agent', 'Sales reps', { createdBy: 'showcase test', needsApproval: true }, {
    label: 'Showcase', surfaces: ['fmmcp'], readOnly: true, expires,
  });
  // Make the generated owner relationship match this separate agent identity.
  store.update('Reps', store.find('Reps').records[0].recordId, { Login: 'Showcase agent' });
  const account = store.accounts().find((entry) => entry.name === 'Showcase agent')!;
  assert.equal(account.agent, true);
  assert.equal(account.hasPassword, false);
  assert.equal(store.privileges(account.name).full, false);
  const made = store.apiTokens().find((entry) => entry.account === account.name)!;
  assert.equal(made.expires, expires.toISOString());
  assert.deepEqual(made.surfaces, ['fmmcp']);
  await mcp(url, token, async (client) => {
    const found = toolJson(await client.callTool({ name: 'find_records', arguments: { database: 'Showcase', layout: 'Deals' } }));
    assert.deepEqual(found.records.map((r: { recordId: string }) => Number(r.recordId)), [own]);
  });
  // The boundary is deterministic: no waiting for wall time and no altered persisted token row.
  now = expires.getTime();
  assert.equal((await fetch(`${url}/mcp`, { headers: { authorization: `Bearer ${token}` } })).status, 401);
  store.createApiToken(account.name, { label: 'Default lifetime', surfaces: ['fmmcp'] });
  const defaultToken = store.apiTokens().find((entry) => entry.label === 'Default lifetime')!;
  assert.equal(Date.parse(defaultToken.expires!) - now, 90 * 86400_000);
});
