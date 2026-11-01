// Approval-gated AI agents: when an agent is set to need approval, its record
// create/update/delete are recorded as proposals (PendingApprovalError, nothing
// changes) for a human to approve — which replays them as the agent, with the
// agent's own privileges — or reject. Portal and container writes are refused
// outright while gated.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { atomicWrites, createStore, Store, PendingApprovalError } from '../src/index.ts';

import { narrowPrivileges } from '../src/token-scope.ts';

function agentSet(store: Store): string {
  store.savePrivilegeSet({
    name: 'Bot',
    records: { view: true, edit: true, create: true, delete: true },
    layouts: 'viewOnly', valueLists: 'viewOnly', scripts: 'viewOnly', extendedPrivileges: ['fmmcp', 'fmrest'],
  });
  return 'Bot';
}

function fresh(): { store: Store; dir: string } {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-agent-approval-'));
  const path = join(dir, 'Charts.sqlite');
  createStore(path);
  const store = new Store(path);
  store.applyDesign([{ op: 'createTable', name: 'Congress', fields: [{ name: 'Name' }] }]);
  return { store, dir };
}

const agentCreates = (store: Store) => store.auditLog({ agent: true, limit: 1000 }).filter((e) => e.kind === 'create').length;

test('a gated agent create is held as a proposal, then approved and applied as the agent', () => {
  const { store, dir } = fresh();
  try {
    store.setAgentAccount('bot', agentSet(store), { needsApproval: true });
    const p = store.privileges('bot');
    const before = agentCreates(store);

    assert.throws(() => store.create('Congress', { Name: 'by the bot' }, { privileges: p, account: 'bot' }),
      (e) => e instanceof PendingApprovalError && e.code === 952);
    assert.equal(agentCreates(store), before, 'nothing was created yet');

    const pending = store.pendingChanges();
    assert.equal(pending.length, 1);
    assert.equal(pending[0].agent, 'bot');
    assert.equal(pending[0].kind, 'create');
    assert.equal(pending[0].table, 'Congress');
    assert.deepEqual(pending[0].data, { Name: 'by the bot' });
    assert.ok(store.auditLog({ kind: 'agent-change-proposed', security: true }).some((e) => e.target === 'Congress'));

    const { recordId } = store.approvePending(pending[0].id, 'Admin');
    assert.ok(recordId, 'a record was created on approval');
    assert.equal(store.get('Congress', recordId!, 'iso', undefined, p).fieldData.Name, 'by the bot');
    // The applied change is tagged to the agent, and the approval is logged against the approver.
    assert.ok(store.auditLog({ agent: true }).some((e) => e.kind === 'create' && e.account === 'bot' && e.recordId === recordId));
    assert.ok(store.auditLog({ kind: 'agent-change-approved', security: true }).some((e) => e.account === 'Admin' && e.target === 'bot'));
    assert.equal(store.pendingChanges().length, 0, 'the proposal is cleared');
  } finally {
    store.close();
    rmSync(dir, { recursive: true });
  }
});

test('a gated agent update and delete are held and can be rejected', () => {
  const { store, dir } = fresh();
  try {
    store.setAgentAccount('bot', agentSet(store), { needsApproval: true });
    const p = store.privileges('bot');
    // A record to act on, made directly by a person.
    const { recordId } = store.create('Congress', { Name: 'original' }, { account: 'Admin' });

    assert.throws(() => store.update('Congress', recordId, { Name: 'changed' }, undefined, { privileges: p, account: 'bot' }), PendingApprovalError);
    assert.throws(() => store.delete('Congress', recordId, { privileges: p, account: 'bot' }), PendingApprovalError);
    assert.equal(store.get('Congress', recordId, 'iso', undefined, p).fieldData.Name, 'original', 'the record is unchanged');

    const pending = store.pendingChanges();
    assert.equal(pending.length, 2);
    assert.deepEqual(pending.map((x) => x.kind).sort(), ['delete', 'update']);

    // Reject them both; nothing is applied and the queue empties.
    for (const x of pending) assert.equal(store.rejectPending(x.id, 'Admin'), true);
    assert.equal(store.rejectPending(999, 'Admin'), false, 'an unknown id rejects nothing');
    assert.equal(store.pendingChanges().length, 0);
    assert.equal(store.get('Congress', recordId, 'iso', undefined, p).fieldData.Name, 'original');
    assert.ok(store.auditLog({ kind: 'agent-change-rejected', security: true }).length >= 2);
  } finally {
    store.close();
    rmSync(dir, { recursive: true });
  }
});

test('an agent not set to need approval writes directly', () => {
  const { store, dir } = fresh();
  try {
    store.setAgentAccount('bot', agentSet(store)); // no needsApproval
    const p = store.privileges('bot');
    const { recordId } = store.create('Congress', { Name: 'direct' }, { privileges: p, account: 'bot' });
    assert.equal(store.get('Congress', recordId, 'iso', undefined, p).fieldData.Name, 'direct');
    assert.equal(store.pendingChanges().length, 0);
  } finally {
    store.close();
    rmSync(dir, { recursive: true });
  }
});

test('portal and container writes are refused for a gated agent, not silently queued', () => {
  const { store, dir } = fresh();
  try {
    store.setAgentAccount('bot', agentSet(store), { needsApproval: true });
    const p = store.privileges('bot');
    const { recordId } = store.create('Congress', { Name: 'x' }, { account: 'Admin' });
    assert.throws(() => store.updatePortals('Congress', recordId, { Something: [{ 'X::Y': '1' }] }, [], { privileges: p, account: 'bot' }),
      (e) => e instanceof PendingApprovalError === false && /approval/i.test((e as Error).message));
    assert.throws(() => store.setContainer('Congress', recordId, 'Name', 1, null, { privileges: p, account: 'bot' }),
      (e) => e instanceof PendingApprovalError === false && /approval/i.test((e as Error).message));
    assert.equal(store.pendingChanges().length, 0, 'nothing was queued');
  } finally {
    store.close();
    rmSync(dir, { recursive: true });
  }
});

test('an already-approved replay (approvedChange) is not re-gated', () => {
  const { store, dir } = fresh();
  try {
    store.setAgentAccount('bot', agentSet(store), { needsApproval: true });
    const p = store.privileges('bot');
    // The flag approvePending uses internally: a direct write carrying it must not re-queue.
    const { recordId } = store.create('Congress', { Name: 'approved path' }, { privileges: p, account: 'bot', approvedChange: true });
    assert.ok(recordId);
    assert.equal(store.pendingChanges().length, 0);
  } finally {
    store.close();
    rmSync(dir, { recursive: true });
  }
});

test('a gated agent write inside an atomic section still leaves its proposal and event behind', () => {
  const { store, dir } = fresh();
  try {
    store.setAgentAccount('bot', agentSet(store), { needsApproval: true });
    const p = store.privileges('bot');
    assert.throws(() => atomicWrites(() => store.create('Congress', { Name: 'by the bot' }, { privileges: p, account: 'bot' })),
      (e) => e instanceof PendingApprovalError);
    assert.equal(store.pendingChanges().length, 1, 'the proposal was not rolled back with the refused write');
    assert.ok(store.auditLog({ kind: 'agent-change-proposed', security: true }).some((e) => e.target === 'Congress'));
    assert.equal(agentCreates(store), 0, 'and nothing was created');
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

// Generated data only: these checks run without imported files.
function synthetic(t: import('node:test').TestContext): Store {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-approval-ceiling-'));
  const path = join(dir, 'Approval.openhbam.sqlite');
  createStore(path);
  const store = new Store(path, 'Approval');
  t.after(() => { store.close(); rmSync(dir, { recursive: true, force: true }); });
  store.applyDesign([
    { op: 'createTable', name: 'Parents', fields: [{ name: 'Id', type: 'number' }, { name: 'Name' }, { name: 'Global', options: { global: true } }] },
    { op: 'createTable', name: 'Children', fields: [{ name: 'ParentId', type: 'number' }, { name: 'Name' }] },
    { op: 'createRelationship', left: 'Parents', right: 'Children', predicates: [{ left: 'Id', right: 'ParentId' }] },
  ]);
  store.create('Parents', { Id: 1, Name: 'original' });
  store.create('Children', { ParentId: 1, Name: 'child' });
  store.setAgentAccount('bot', agentSet(store), { needsApproval: true });
  return store;
}

function unchanged(store: Store): void {
  assert.equal(store.pendingChanges().length, 0);
  assert.equal(store.auditLog({ kind: 'agent-change-proposed', security: true }).length, 0);
  assert.equal(store.find('Parents').foundCount, 1);
  assert.equal(store.get('Parents', 1).fieldData.Name, 'original');
  assert.equal(store.get('Children', 1).fieldData.Name, 'child');
  assert.notEqual(store.get('Parents', 1).fieldData.Global, 'new');
}

for (const kind of ['create', 'update', 'delete'] as const) {
  test(`gated ${kind} checks table permission before proposing`, (t) => {
    const store = synthetic(t);
    const set = store.privilegeSet('Bot')!;
    store.savePrivilegeSet({ ...set, records: { ...set.records, [kind === 'update' ? 'edit' : kind]: false } });
    const opts = { account: 'bot', privileges: store.privileges('bot') };
    assert.throws(() => kind === 'create' ? store.create('Parents', { Name: 'new' }, opts)
      : kind === 'update' ? store.update('Parents', 1, { Name: 'new' }, undefined, opts)
      : store.delete('Parents', 1, opts), (e: unknown) => !(e instanceof PendingApprovalError) && /access is denied/.test((e as Error).message));
    unchanged(store);
  });
  test(`gated ${kind} refuses a read-only credential inside the store`, (t) => {
    const store = synthetic(t);
    const privileges = narrowPrivileges(store, store.privileges('bot'), { readOnly: true });
    const opts = { account: 'bot', privileges };
    assert.throws(() => kind === 'create' ? store.create('Parents', { Name: 'new' }, opts)
      : kind === 'update' ? store.update('Parents', 1, { Global: 'new' }, undefined, opts)
      : store.delete('Parents', 1, opts), /token is read-only/i);
    unchanged(store);
  });
}

for (const kind of ['update', 'delete'] as const) test(`gated ${kind} checks the record rule before proposing`, (t) => {
  const store = synthetic(t);
  const set = store.privilegeSet('Bot')!;
  store.savePrivilegeSet({ ...set, records: { ...set.records, [kind === 'update' ? 'edit' : kind]: 'Id = 2' } });
  const opts = { account: 'bot', privileges: store.privileges('bot') };
  assert.throws(() => kind === 'update' ? store.update('Parents', 1, { Name: 'new' }, undefined, opts)
    : store.delete('Parents', 1, opts), (e: unknown) => !(e instanceof PendingApprovalError) && /access is denied/.test((e as Error).message));
  unchanged(store);
});

for (const field of ['Name', 'Children::Name']) test(`gated update checks field permission for ${field} before proposing`, (t) => {
  const store = synthetic(t);
  const set = store.privilegeSet('Bot')!;
  store.savePrivilegeSet({ ...set, tables: { [field.includes('::') ? 'Children' : 'Parents']: { ...set.records, fields: { Name: 'viewOnly' } } } });
  assert.throws(() => store.update('Parents', 1, { [field]: 'changed' }, undefined, { account: 'bot', privileges: store.privileges('bot') }), /cannot be modified/);
  unchanged(store);
});

test('permitted proposals persist the credential ceiling and still apply as the agent', (t) => {
  const store = synthetic(t);
  const scope = { layouts: ['Parents'] };
  const privileges = narrowPrivileges(store, store.privileges('bot'), scope);
  scope.layouts.push('Children'); // the credential ceiling is a snapshot
  assert.throws(() => atomicWrites(() => store.create('Parents', { Name: 'queued' }, { account: 'bot', privileges })), PendingApprovalError);
  const pending = store.pendingChanges()[0];
  const row = store.sql.prepare('SELECT ceiling FROM _fm_pending WHERE id = ?').get(pending.id) as { ceiling: string };
  assert.deepEqual(JSON.parse(row.ceiling), { fileId: store.fileId, layouts: ['Parents'] });
  const result = store.approvePending(pending.id, 'Admin');
  assert.equal(store.get('Parents', result.recordId!).fieldData.Name, 'queued');
  assert.equal(store.pendingChanges().length, 0);
  assert.ok(store.auditLog({ agent: true }).some((e) => e.kind === 'create' && e.account === 'bot' && e.recordId === result.recordId));
});

for (const ceiling of [{ readOnly: true }, { layouts: ['Children'] }]) test(`approval rechecks the stored ceiling ${JSON.stringify(ceiling)} and keeps a refused proposal`, (t) => {
  const store = synthetic(t);
  assert.throws(() => store.update('Parents', 1, { Name: 'queued' }, undefined, { account: 'bot', privileges: store.privileges('bot') }), PendingApprovalError);
  const id = store.pendingChanges()[0].id;
  store.sql.prepare('UPDATE _fm_pending SET ceiling = ? WHERE id = ?').run(JSON.stringify({ fileId: store.fileId, ...ceiling }), id);
  assert.throws(() => store.approvePending(id, 'Admin'), 'readOnly' in ceiling ? /token is read-only/i : /layout|privilege|missing/i);
  assert.equal(store.get('Parents', 1).fieldData.Name, 'original');
  assert.equal(store.pendingChanges()[0].id, id);
  assert.equal(store.auditLog({ kind: 'agent-change-approved', security: true }).length, 0);
});

test('migration preserves an old proposal without a credential ceiling', (t) => {
  const store = synthetic(t);
  assert.throws(() => store.create('Parents', { Name: 'legacy' }, { account: 'bot', privileges: store.privileges('bot') }), PendingApprovalError);
  const id = store.pendingChanges()[0].id;
  store.sql.exec('ALTER TABLE _fm_pending DROP COLUMN ceiling');
  const path = store.path;
  const reopened = new Store(path, 'Approval');
  try {
    const result = reopened.approvePending(id, 'Admin');
    assert.equal(reopened.get('Parents', result.recordId!).fieldData.Name, 'legacy');
    assert.equal(reopened.pendingChanges().length, 0);
  } finally { reopened.close(); }
});
