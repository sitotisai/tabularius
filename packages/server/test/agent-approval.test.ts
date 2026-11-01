// Approval-gated agents over the wire: an MCP client's write comes back as a
// pending proposal (not an error), the security API lists it and a full-access
// human approves or rejects it; approval applies it tagged as the agent.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import { serve, type Host } from '../src/index.ts';
import { createStore, Store } from '../../store/src/index.ts';
import { McpTokens } from '../src/mcp-tokens.ts';

let dir: string;
let server: Server;
let host: Host;
let base: string;

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-agent-approval-srv-'));
  const path = join(dir, 'Charts.openhbam.sqlite');
  createStore(path);
  const initial = new Store(path, 'Charts');
  initial.setAiPolicy(false);
  initial.applyDesign([{ op: 'createTable', name: 'Congress', fields: [{ name: 'Name' }] }]);
  initial.create('Congress', { Name: 'original' });
  initial.close();
  const s = await serve({ dir, port: 0, log: () => {} });
  server = s.server;
  host = s.host;
  base = s.url;
  const store = host.get('Charts')!;
  store.setPassword('Admin', 'pw', store.privilegeSets().find((p) => p.id === 1)!.name);
  store.savePrivilegeSet({
    name: 'Bot', records: { view: true, edit: true, create: true, delete: true },
    layouts: 'viewOnly', valueLists: 'viewOnly', scripts: 'none', extendedPrivileges: ['fmmcp'],
  });
});
after(async () => {
  // Closed (background warming stopped, files closed) before the folder is removed.
  await new Promise<void>((r) => (server ? server.close(() => r()) : r()));
  if (dir) rmSync(dir, { recursive: true });
});

async function adminToken(): Promise<string> {
  const r = await fetch(`${base}/fmi/data/vLatest/databases/Charts/sessions`, {
    method: 'POST', headers: { authorization: 'Basic ' + btoa('Admin:pw') }, body: '{}',
  });
  return (await r.json()).response.token;
}
const sec = (tok: string, path = '', init: RequestInit = {}) =>
  fetch(`${base}/tabularius/security/v1/databases/Charts${path}`, {
    ...init, headers: { authorization: `Bearer ${tok}`, ...(init.body ? { 'content-type': 'application/json' } : {}), ...init.headers },
  });

async function mcpTool(name: string, args: unknown, bearer: string, endpoint = base): Promise<{ isError: boolean; text: string }> {
  const res = await fetch(`${endpoint}/mcp`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-06-18',
      authorization: `Bearer ${bearer}`,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }),
  });
  const body = await res.json();
  const result = body.result ?? { isError: true, content: [{ text: JSON.stringify(body.error ?? body) }] };
  return { isError: !!result.isError, text: result.content?.[0]?.text ?? '' };
}

test('a gated agent MCP write is queued, listed, and approved over the API', async () => {
  const tok = await adminToken();
  // Create the agent, set to need approval, through Manage Security.
  const made = await sec(tok, '', { method: 'POST', body: JSON.stringify({ changes: [{ op: 'setAgentAccount', name: 'q-bot', privilegeSet: 'Bot', needsApproval: true }] }) });
  assert.equal(made.status, 200);
  assert.equal((await made.json()).accounts.find((a: { name: string }) => a.name === 'q-bot').needsApproval, true);

  const minted = new McpTokens(dir, undefined, (database, account) => { const s = host.get(database); return s?.identityAllowed(account) ? s.credentialIdentity(account) : undefined; }).create({ database: 'Charts', account: 'q-bot', label: 'test' });
  const store = host.get('Charts')!;
  const createsBefore = store.auditLog({ agent: true, limit: 1000 }).filter((e) => e.kind === 'create').length;

  // The MCP write is accepted-but-pending, not an error.
  const res = await mcpTool('create_record', { database: 'Charts', layout: 'Congress', fieldData: { Name: 'queued' } }, minted.token);
  assert.equal(res.isError, false, res.text);
  const payload = JSON.parse(res.text);
  assert.equal(payload.status, 'pending_approval');
  assert.ok(payload.pendingId);
  assert.equal(store.auditLog({ agent: true, limit: 1000 }).filter((e) => e.kind === 'create').length, createsBefore, 'nothing created yet');

  // The security view lists the proposal.
  const listed = await (await sec(tok)).json();
  const mine = listed.pendingChanges.find((c: { id: number }) => c.id === payload.pendingId);
  assert.ok(mine, 'proposal listed');
  assert.equal(mine.agent, 'q-bot');

  // Approve it; it applies, tagged as the agent, and leaves the queue.
  const approved = await sec(tok, `/pending/${payload.pendingId}/approve`, { method: 'POST' });
  assert.equal(approved.status, 200);
  const after = await approved.json();
  assert.ok(after.recordId, 'a record id came back');
  assert.equal(after.security.pendingChanges.length, 0);
  assert.ok(store.auditLog({ agent: true, limit: 1000 }).some((e) => e.kind === 'create' && e.account === 'q-bot' && e.recordId === after.recordId));
  host.get('Charts')!.deleteAccount('q-bot');
});

test('a gated agent MCP write can be rejected over the API', async () => {
  const tok = await adminToken();
  await sec(tok, '', { method: 'POST', body: JSON.stringify({ changes: [{ op: 'setAgentAccount', name: 'r-bot', privilegeSet: 'Bot', needsApproval: true }] }) });
  const minted = new McpTokens(dir, undefined, (database, account) => { const s = host.get(database); return s?.identityAllowed(account) ? s.credentialIdentity(account) : undefined; }).create({ database: 'Charts', account: 'r-bot', label: 'test' });

  const res = await mcpTool('delete_record', { database: 'Charts', layout: 'Congress', recordId: 1 }, minted.token);
  assert.equal(res.isError, false, res.text);
  const { pendingId } = JSON.parse(res.text);
  assert.ok(pendingId);

  const rejected = await sec(tok, `/pending/${pendingId}/reject`, { method: 'POST' });
  assert.equal(rejected.status, 200);
  const body = await rejected.json();
  assert.equal(body.rejected, true);
  assert.equal(body.security.pendingChanges.some((c: { id: number }) => c.id === pendingId), false);
  host.get('Charts')!.deleteAccount('r-bot');
});

test('rejecting an unknown pending id is a 404', async () => {
  const tok = await adminToken();
  const r = await sec(tok, '/pending/999999/reject', { method: 'POST' });
  assert.equal(r.status, 404);
  assert.equal((await r.json()).rejected, false);
});

async function syntheticServer(t: import('node:test').TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-approval-wire-'));
  const path = join(dir, 'Approval.openhbam.sqlite');
  createStore(path);
  const initial = new Store(path, 'Approval');
  try {
    initial.setAiPolicy(false);
    initial.applyDesign([
      { op: 'createTable', name: 'Parents', fields: [{ name: 'Id', type: 'number' }, { name: 'Name' }] },
      { op: 'createTable', name: 'Children', fields: [{ name: 'ParentId', type: 'number' }, { name: 'Name' }] },
      { op: 'createRelationship', left: 'Parents', right: 'Children', predicates: [{ left: 'Id', right: 'ParentId' }] },
    ]);
    initial.create('Parents', { Id: 1, Name: 'original' });
    initial.create('Children', { ParentId: 1, Name: 'child' });
    initial.savePrivilegeSet({ name: 'Bot', records: { view: true, edit: true, create: true, delete: true }, layouts: 'viewOnly', scripts: 'none', valueLists: 'viewOnly', extendedPrivileges: ['fmmcp'] });
    initial.setAgentAccount('bot', 'Bot', { needsApproval: true });
  } finally { initial.close(); }
  const running = await serve({ dir, port: 0, log: () => {} });
  t.after(async () => {
    await new Promise<void>((resolve) => running.server.close(() => resolve()));
    rmSync(dir, { recursive: true, force: true });
  });
  return { store: running.host.get('Approval')!, url: running.url };
}

for (const name of ['create_record', 'update_record', 'delete_record', 'revert_change']) test(`read-only fmmcp token refuses gated ${name} without a proposal`, async (t) => {
  const { store, url } = await syntheticServer(t);
  const token = store.createApiToken('bot', { readOnly: true, surfaces: ['fmmcp'] });
  const seq = store.auditLog({ limit: 100 }).find((e) => e.kind === 'create' && e.table === 'Parents')!.seq;
  const res = await mcpTool(name, { database: 'Approval', layout: 'Parents', recordId: 1, fieldData: { Name: 'changed' }, seq }, token, url);
  assert.equal(res.isError, true, res.text);
  assert.match(res.text, /token is read-only/i);
  assert.equal(store.pendingChanges().length, 0);
  assert.equal(store.auditLog({ kind: 'agent-change-proposed', security: true }).length, 0);
  assert.equal(store.find('Parents').foundCount, 1);
  assert.equal(store.get('Parents', 1).fieldData.Name, 'original');
});

test('layout-scoped fmmcp token cannot propose on another layout', async (t) => {
  const { store, url } = await syntheticServer(t);
  const token = store.createApiToken('bot', { layouts: ['Children'], surfaces: ['fmmcp'] });
  for (const name of ['create_record', 'update_record', 'delete_record']) {
    const res = await mcpTool(name, { database: 'Approval', layout: 'Parents', recordId: 1, fieldData: { Name: 'changed' } }, token, url);
    assert.equal(res.isError, true, res.text);
  }
  assert.equal(store.pendingChanges().length, 0);
  assert.equal(store.auditLog({ kind: 'agent-change-proposed', security: true }).length, 0);
  assert.equal(store.get('Parents', 1).fieldData.Name, 'original');
});

test('layout-scoped fmmcp token cannot propose a related-table update outside its ceiling', async (t) => {
  const { store, url } = await syntheticServer(t);
  const token = store.createApiToken('bot', { layouts: ['Parents'], surfaces: ['fmmcp'] });
  const res = await mcpTool('update_record', { database: 'Approval', layout: 'Parents', recordId: 1, fieldData: { 'Children::Name': 'changed' } }, token, url);
  assert.equal(res.isError, true, res.text);
  assert.equal(store.pendingChanges().length, 0);
  assert.equal(store.auditLog({ kind: 'agent-change-proposed', security: true }).length, 0);
  assert.equal(store.get('Children', 1).fieldData.Name, 'child');
});

test('a permitted scoped fmmcp proposal keeps its ceiling and an admin can approve it', async (t) => {
  const { store, url } = await syntheticServer(t);
  const token = store.createApiToken('bot', { layouts: ['Parents'], surfaces: ['fmmcp'] });
  const res = await mcpTool('create_record', { database: 'Approval', layout: 'Parents', fieldData: { Name: 'queued' } }, token, url);
  assert.equal(res.isError, false, res.text);
  const payload = JSON.parse(res.text);
  assert.equal(payload.status, 'pending_approval');
  const row = store.sql.prepare('SELECT ceiling FROM _fm_pending WHERE id = ?').get(payload.pendingId) as { ceiling: string };
  assert.deepEqual(JSON.parse(row.ceiling), { fileId: store.fileId, layouts: ['Parents'] });
  const result = store.approvePending(payload.pendingId, 'Admin');
  assert.equal(store.get('Parents', result.recordId!).fieldData.Name, 'queued');
  assert.equal(store.pendingChanges().length, 0);
});
