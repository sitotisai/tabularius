import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createStore, Store, writer, endTransaction, type Transaction } from '../src/index.ts';

// A script transaction holds the file; another window of the same script commits a write of its own in the middle. The
// holder's changes are taken out, the other window's write is committed, and the holder's changes are put back. Security
// rows the holder wrote (an account added, a password changed) must come back with the same chain the file has now: the
// security audit must verify, every row the holder wrote must be in it once, and the chain head must name a row that exists.

function setup(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-window-audit-'));
  const path = join(dir, 'Owner.sqlite');
  createStore(path, { mode: 'native' });
  const s = new Store(path, 'Owner');
  t.after(() => { s.close(); rmSync(dir, { recursive: true }); });
  s.applyDesign([{ op: 'createTable', name: 'T', fields: [{ name: 'A' }] }]);
  s.setPassword('Ann', 'pw', '[Full Access]');
  const inTx = <R>(tx: Transaction, run: () => R): R => writer.run({ transaction: { open: tx } }, run);
  const other = (tx: Transaction, value: string) => s.independentWindowWrite(tx, () => writer.run({}, () => s.create('T', { A: value })));
  const securityKinds = () => s.auditLog({ security: true, limit: 50_000 }).map((e) => e.kind);
  const head = () => {
    const sql = new DatabaseSync(path, { readOnly: true });
    try { return sql.prepare('SELECT head_seq, head_audit_seq FROM _fm_security_chain_state').get() as { head_seq: number; head_audit_seq: number }; } finally { sql.close(); }
  };
  return { s, inTx, other, securityKinds, head };
}

test('an independent write in the middle of a transaction keeps the security rows the transaction wrote, and the chain verifies', (t) => {
  const { s, inTx, other, securityKinds } = setup(t);
  const before = securityKinds();
  const tx: Transaction = { files: new Map() };
  inTx(tx, () => s.create('T', { A: 'held' }));
  inTx(tx, () => s.setPassword('Cy', 'pw', '[Full Access]'));
  other(tx, 'other window');
  endTransaction(tx, true);
  const added = securityKinds().slice(before.length);
  assert.ok(added.length > 0, 'the holder\'s security change is in the audit');
  assert.equal(new Set(s.auditLog({ security: true, limit: 50_000 }).map((e) => e.seq)).size, securityKinds().length);
  const verified = s.verifySecurityAudit();
  assert.equal(verified.ok, true, verified.reason ?? '');
  assert.equal(s.verify('Cy', 'pw'), true, 'the account the transaction added is there');
});

test('security rows written before and after an independent write are all kept, in order, on one chain', (t) => {
  const { s, inTx, other, securityKinds, head } = setup(t);
  const before = securityKinds().length;
  const tx: Transaction = { files: new Map() };
  inTx(tx, () => s.setPassword('Cy', 'pw', '[Full Access]'));
  other(tx, 'first');
  inTx(tx, () => s.setPassword('Di', 'pw', '[Full Access]'));
  other(tx, 'second');
  endTransaction(tx, true);
  const log = s.auditLog({ security: true, limit: 50_000 });
  const targets = log.slice(before).map((e) => JSON.stringify(e));
  assert.equal(targets.filter((c) => c.includes('Cy')).length > 0, true);
  assert.equal(targets.filter((c) => c.includes('Di')).length > 0, true);
  assert.ok(targets.findIndex((c) => c.includes('Cy')) < targets.findIndex((c) => c.includes('Di')), 'in the order they were made');
  const verified = s.verifySecurityAudit();
  assert.equal(verified.ok, true, verified.reason ?? '');
  assert.equal(head().head_seq, log.length, 'the head counts every row of the chain');
});

test('an independent write by another window, then a rollback of the transaction: its security rows are gone, the other window stands, the chain verifies', (t) => {
  const { s, inTx, other, securityKinds } = setup(t);
  const before = securityKinds();
  const tx: Transaction = { files: new Map() };
  inTx(tx, () => s.setPassword('Cy', 'pw', '[Full Access]'));
  other(tx, 'other window stands');
  endTransaction(tx, false);
  assert.deepEqual(securityKinds(), before);
  assert.equal(s.verify('Cy', 'pw'), false);
  assert.equal(s.find('T', { query: [{ A: '==other window stands' }] }).foundCount, 1);
  const verified = s.verifySecurityAudit();
  assert.equal(verified.ok, true, verified.reason ?? '');
});

test('sign-in rows that waited and security rows of the transaction both survive an independent write', (t) => {
  const { s, inTx, other, securityKinds } = setup(t);
  const before = securityKinds().length;
  const tx: Transaction = { files: new Map() };
  inTx(tx, () => s.create('T', { A: 'held' }));
  s.auditSignIn('Ann', '10.81.0.1', false);
  inTx(tx, () => s.setPassword('Cy', 'pw', '[Full Access]'));
  other(tx, 'other window');
  s.auditSignIn('Ann', '10.81.0.2', false);
  endTransaction(tx, true);
  const log = JSON.stringify(s.auditLog({ security: true, limit: 50_000 }).slice(before));
  assert.ok(log.includes('10.81.0.1') && log.includes('10.81.0.2') && log.includes('Cy'));
  const verified = s.verifySecurityAudit();
  assert.equal(verified.ok, true, verified.reason ?? '');
});

test('the other window adds rows to the chain itself while the transaction is out: its rows and the transaction\'s are on the chain once each', (t) => {
  const { s, inTx, securityKinds } = setup(t);
  const before = securityKinds().length;
  const tx: Transaction = { files: new Map() };
  inTx(tx, () => s.setPassword('Cy', 'pw', '[Full Access]'));
  // A sign-in on another window of the file is written at once while the transaction is out of the file.
  s.independentWindowWrite(tx, () => { writer.run({}, () => s.auditSignIn('Ann', '10.81.0.3', false)); });
  endTransaction(tx, true);
  const added = JSON.stringify(s.auditLog({ security: true, limit: 50_000 }).slice(before));
  assert.equal(added.split('10.81.0.3').length - 1, 1, 'the other window\'s row, once');
  assert.equal(added.split('"Cy"').length - 1, 2, 'account-added and privilege-set-assigned for the transaction\'s account, once each');
  const verified = s.verifySecurityAudit();
  assert.equal(verified.ok, true, verified.reason ?? '');
  assert.equal(s.verify('Cy', 'pw'), true);
});
