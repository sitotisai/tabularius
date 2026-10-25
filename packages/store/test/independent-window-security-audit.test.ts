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

// Waiting sign-in rows that the holder's own security change put into its transaction are taken out with it. They wait
// again for the other window's turn (so that a sign-in row is never lost and the chain order agrees with the event order)
// and are written back in front of the holder's own rows when it rejoins, if the other window did not already write them.

function positions(s: Store, needles: string[]): number[] {
  const rows = s.auditLog({ security: true, limit: 50_000 }).map((e) => JSON.stringify(e));
  return needles.map((n) => rows.findIndex((r) => r.includes(n)));
}
function times(s: Store, needle: string): number {
  return s.auditLog({ security: true, limit: 50_000 }).filter((e) => JSON.stringify(e).includes(needle)).length;
}

test('waiting sign-in rows keep their order when the other window writes security rows of its own during the suspension', (t) => {
  const { s, inTx } = setup(t);
  const tx: Transaction = { files: new Map() };
  inTx(tx, () => s.create('T', { A: 'held' }));
  s.auditSignIn('Ann', '10.81.1.1', false); // A waits
  inTx(tx, () => s.setPassword('Cy', 'pw', '[Full Access]')); // A goes into the hold, then the holder's row
  s.auditSignIn('Ann', '10.81.1.2', false); // B waits behind
  s.independentWindowWrite(tx, () => { writer.run({}, () => s.auditSignIn('Ann', '10.81.1.3', false)); }); // X, written at once
  endTransaction(tx, true);
  const [a, cy, b, x] = positions(s, ['10.81.1.1', '"Cy"', '10.81.1.2', '10.81.1.3']);
  assert.ok(a >= 0 && cy >= 0 && b >= 0 && x >= 0, 'every row is in the audit');
  assert.ok(a < b && b < x, `sign-in rows A, B, X are on the chain in the order they happened (${[a, b, x]})`);
  assert.ok(a < cy, 'the waiting row that was ahead of the holder\'s change stays ahead of it');
  for (const n of ['10.81.1.1', '10.81.1.2', '10.81.1.3']) assert.equal(times(s, n), 1, n);
  assert.equal(s.deferredSecurityStats().pending, 0);
  assert.equal(s.verifySecurityAudit().ok, true);
});

test('without a security row from the other window, a waiting row stays ahead of the holder\'s change and the later one behind it', (t) => {
  const { s, inTx, other } = setup(t);
  const tx: Transaction = { files: new Map() };
  inTx(tx, () => s.create('T', { A: 'held' }));
  s.auditSignIn('Ann', '10.81.2.1', false); // A
  inTx(tx, () => s.setPassword('Cy', 'pw', '[Full Access]'));
  s.auditSignIn('Ann', '10.81.2.2', false); // B, after the holder's change
  other(tx, 'o');
  endTransaction(tx, true);
  const [a, cy, b] = positions(s, ['10.81.2.1', '"Cy"', '10.81.2.2']);
  assert.ok(a >= 0 && cy >= 0 && b >= 0, 'every row is in the audit');
  assert.ok(a < cy && cy < b, `event order A, Cy, B (${[a, cy, b]})`);
  assert.equal(s.deferredSecurityStats().pending, 0);
  assert.equal(s.verifySecurityAudit().ok, true);
});

test('the transaction cannot rejoin the file (another process holds the write lock): the waiting row it had taken is not lost', (t) => {
  const { s, inTx } = setup(t);
  const path = (s as unknown as { path: string }).path;
  const tx: Transaction = { files: new Map() };
  inTx(tx, () => s.create('T', { A: 'held' }));
  s.auditSignIn('Ann', '10.81.3.1', false);
  inTx(tx, () => s.setPassword('Cy', 'pw', '[Full Access]'));
  const peer = new DatabaseSync(path);
  let error: unknown;
  try {
    s.independentWindowWrite(tx, () => { writer.run({}, () => s.create('T', { A: 'other' })); peer.exec('BEGIN IMMEDIATE'); });
  } catch (e) { error = e; } finally { peer.exec('ROLLBACK'); peer.close(); }
  assert.ok(error, 'the rejoin failed');
  endTransaction(tx, false);
  const later: Transaction = { files: new Map() };
  inTx(later, () => s.create('T', { A: 'x' }));
  endTransaction(later, true);
  s.auditSignIn('Ann', '10.81.3.9', false);
  assert.equal(times(s, '10.81.3.1'), 1, 'the waiting sign-in row is in the audit once');
  assert.equal(times(s, '10.81.3.9'), 1);
  assert.equal(s.deferredSecurityStats().pending, 0);
  assert.equal(s.verifySecurityAudit().ok, true);
});

test('the other window\'s write throws: the rows the transaction had taken are still written once, in order', (t) => {
  const { s, inTx } = setup(t);
  const tx: Transaction = { files: new Map() };
  inTx(tx, () => s.create('T', { A: 'held' }));
  s.auditSignIn('Ann', '10.81.4.1', false);
  inTx(tx, () => s.setPassword('Cy', 'pw', '[Full Access]'));
  assert.throws(() => s.independentWindowWrite(tx, () => { throw new Error('the other window failed'); }), /the other window failed/);
  endTransaction(tx, true);
  const [a, cy] = positions(s, ['10.81.4.1', '"Cy"']);
  assert.ok(a >= 0 && cy >= 0 && a < cy);
  assert.equal(times(s, '10.81.4.1'), 1);
  assert.equal(s.verifySecurityAudit().ok, true);
});

test('two independent writes in a row, then a rollback: a waiting row taken by the transaction is written once', (t) => {
  const { s, inTx, other } = setup(t);
  const tx: Transaction = { files: new Map() };
  inTx(tx, () => s.create('T', { A: 'held' }));
  s.auditSignIn('Ann', '10.81.5.1', false);
  inTx(tx, () => s.setPassword('Cy', 'pw', '[Full Access]'));
  other(tx, 'one');
  inTx(tx, () => s.setPassword('Di', 'pw', '[Full Access]'));
  s.independentWindowWrite(tx, () => { writer.run({}, () => s.auditSignIn('Ann', '10.81.5.2', false)); });
  endTransaction(tx, false);
  assert.equal(times(s, '10.81.5.1'), 1);
  assert.equal(times(s, '10.81.5.2'), 1);
  assert.equal(times(s, '"Cy"') + times(s, '"Di"'), 0);
  assert.equal(s.deferredSecurityStats().pending, 0);
  assert.equal(s.verifySecurityAudit().ok, true);
});
