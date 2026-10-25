import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store, StoreError, writer, endTransaction, type DesignOp, type Transaction } from '../src/index.ts';

// What a transaction that holds the file may do to everyone else's requests: ordinary requests (a session's mark, a token's use)
// go on unless the transaction has changed what they decide from; nothing a request does is written into the holder's
// transaction; the sign-in rows that wait are never lost to a savepoint that is rolled back, and a design change is not refused
// for them.

function setup(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-signin-requests-'));
  createStore(join(dir, 'Owner.sqlite'), { mode: 'native' });
  const s = new Store(join(dir, 'Owner.sqlite'), 'Owner');
  t.after(() => { s.close(); rmSync(dir, { recursive: true }); });
  s.applyDesign([
    { op: 'createTable', name: 'T', fields: [{ name: 'A' }] },
    { op: 'createTable', name: 'Customers', fields: [{ name: 'ID' }] },
    { op: 'createTable', name: 'Invoices', fields: [{ name: 'CustomerID' }] },
  ]);
  s.setPassword('Ann', 'pw', '[Full Access]');
  s.setPassword('Bob', 'pw', '[Full Access]');
  const open = (): Transaction => ({ files: new Map() });
  const hold = (): Transaction => {
    const tx = open();
    writer.run({ transaction: { open: tx } }, () => s.create('T', { A: 'held' }));
    return tx;
  };
  return { s, open, hold };
}

const busy = (e: unknown) => e instanceof StoreError && e.code === 301;

test('a session whose mark is unchanged keeps working while a transaction has changed security state', (t) => {
  const { s, open } = setup(t);
  const mark = s.signInMark('Ann');
  const tx = open();
  writer.run({ transaction: { open: tx } }, () => s.setPassword('Cy', 'pw', '[Full Access]'));
  assert.equal(s.signInMark('Ann'), mark, 'a matching mark is returned, not refused');
  endTransaction(tx, false);
});

test('using an API token writes nothing into a transaction that holds the file, and does not stop sign-ins', (t) => {
  const { s, hold } = setup(t);
  const token = s.createApiToken('Bob', { label: 'bob' });
  const tx = hold();
  assert.equal(s.apiToken(token)?.account, 'Bob');
  assert.equal(s.verify('Ann', 'pw', '10.1.0.1'), true, 'the token check did not make the held transaction look as if it changed sign-in state');
  endTransaction(tx, true);
  assert.equal(s.apiToken(token)?.account, 'Bob');
});

test('a token made in a transaction that is not committed is not honoured by anyone else, nor after the rollback', (t) => {
  const { s, open } = setup(t);
  const tx = open();
  const token = writer.run({ transaction: { open: tx } }, () => s.createApiToken('Bob', { label: 'temp' }));
  assert.throws(() => s.apiToken(token), busy);
  endTransaction(tx, false);
  assert.equal(s.apiToken(token), undefined);
});

test('waiting sign-in rows are not lost when a savepoint of the holder is rolled back', (t) => {
  const { s, open } = setup(t);
  s.create('Invoices', { CustomerID: 'nobody' });
  const tx = open();
  writer.run({ transaction: { open: tx } }, () => s.create('T', { A: 'held' }));
  s.auditSignIn('Ann', '10.9.9.9', false);
  assert.equal(s.deferredSecurityStats().pending, 1);
  // The design change breaks a foreign key the records already there break: refused, and undone with its savepoint.
  assert.throws(() => writer.run({ transaction: { open: tx } }, () => s.applyDesign([
    { op: 'createRelationship', left: 'Invoices', right: 'Customers', predicates: [{ left: 'CustomerID', right: 'ID' }],
      foreignKey: { name: 'invoice_customer', child: { table: 'Invoices', field: 'CustomerID' }, parent: { table: 'Customers', field: 'ID' }, onDelete: 'restrict' } },
  ] as DesignOp[])), (e: unknown) => e instanceof StoreError && e.code === 505);
  endTransaction(tx, true);
  const rows = s.auditLog({ kind: 'sign-in-failed', security: true, limit: 100 }).filter((e) => JSON.stringify(e).includes('10.9.9.9'));
  assert.equal(rows.length, 1, 'the row was written once');
  assert.deepEqual(s.deferredSecurityStats(), { pending: 0, dropped: 0 });
});

test('a design change is not refused while sign-in rows from a hold are still being written out', async (t) => {
  const { s, hold } = setup(t);
  const tx = hold();
  for (let i = 0; i < 450; i++) s.auditLockoutCleared(`n${i}`, 'account', '10.1.0.2');
  endTransaction(tx, true);
  assert.ok(s.deferredSecurityStats().pending > 0, 'rows are still waiting after the first chunk');
  s.applyDesign([{ op: 'createTable', name: 'U', fields: [{ name: 'A' }] }]);
  assert.equal(s.deferredSecurityStats().pending, 0);
  assert.equal(s.auditLog({ kind: 'lockout-cleared', security: true, limit: 1000 }).length, 450);
  assert.equal(s.verifySecurityAudit().ok, true);
});

test('an identity made for an external account is not written into another session\'s transaction', (t) => {
  const { s, hold } = setup(t);
  s.sql.prepare("UPDATE _fm_accounts SET source = 'external', identity_id = NULL WHERE name = 'Ann'").run();
  const tx = hold();
  assert.throws(() => s.externalIdentityId('Ann'), busy);
  endTransaction(tx, false);
  assert.ok(s.externalIdentityId('Ann'));
});

/** The failed sign-in rows for one address, oldest first. */
const rowsFor = (s: Store, address: string) =>
  s.auditLog({ kind: 'sign-in-failed', security: true, limit: 50_000 }).filter((e) => JSON.stringify(e).includes(address));

test('waiting rows written into a write savepoint of the holder that is rolled back wait again and are written once', (t) => {
  const { s, hold } = setup(t);
  const tx = hold();
  s.auditSignIn('Ann', '10.66.2.1', false);
  assert.throws(() => writer.run({ transaction: { open: tx } }, () => s.writeAtomically(() => {
    s.setPassword('Cy', 'pw', '[Full Access]');
    throw new Error('boom');
  })), /boom/);
  assert.equal(s.deferredSecurityStats().pending, 1, 'the row was put back to wait with the savepoint');
  endTransaction(tx, true);
  assert.equal(rowsFor(s, '10.66.2.1').length, 1);
  assert.deepEqual(s.deferredSecurityStats(), { pending: 0, dropped: 0 });
  assert.equal(s.verifySecurityAudit().ok, true);
});

test('waiting rows already written into the holder survive another window of the same script writing independently', (t) => {
  const { s, open } = setup(t);
  const tx = open();
  writer.run({ transaction: { open: tx } }, () => s.create('T', { A: 'held' }));
  s.auditSignIn('Ann', '10.66.0.1', false);
  writer.run({ transaction: { open: tx } }, () => s.setPassword('Cy', 'pw', '[Full Access]'));
  assert.equal(s.deferredSecurityStats().pending, 0, 'the row went into the holder ahead of its change');
  s.independentWindowWrite(tx, () => writer.run({}, () => s.create('T', { A: 'other window' })));
  endTransaction(tx, true);
  assert.equal(rowsFor(s, '10.66.0.1').length, 1, 'the sign-in row is in the audit after the commit');
  assert.equal(s.verifySecurityAudit().ok, true, 'the holder\'s own security row and the waiting row are on one valid chain');
});

test('a trial that is undone takes back waiting rows written into the file inside it, and they wait again', (t) => {
  const { s, open } = setup(t);
  const tx = open();
  writer.run({ transaction: { open: tx } }, () => s.create('T', { A: 'held' }));
  s.auditSignIn('Ann', '10.66.0.8', false);
  const trial = s.trial();
  writer.run({ transaction: { open: tx } }, () => s.setPassword('Cy', 'pw', '[Full Access]'));
  trial.undo();
  assert.equal(s.deferredSecurityStats().pending, 1);
  endTransaction(tx, true);
  assert.equal(rowsFor(s, '10.66.0.8').length, 1);
  assert.equal(s.verifySecurityAudit().ok, true);
});

test('closing the file while a transaction holds it says how many sign-in rows are lost, those written into it included', (t) => {
  const { s, open } = setup(t);
  const tx = open();
  writer.run({ transaction: { open: tx } }, () => s.create('T', { A: 'held' }));
  s.auditSignIn('Ann', '10.66.0.9', false);
  s.auditSignIn('Ann', '10.66.0.9', false);
  writer.run({ transaction: { open: tx } }, () => s.setPassword('Cy', 'pw', '[Full Access]'));
  s.auditSignIn('Ann', '10.66.0.9', false);
  assert.deepEqual(s.deferredSecurityStats(), { pending: 1, dropped: 0 });
  const warn = t.mock.method(console, 'warn', () => {});
  s.close();
  assert.equal(warn.mock.callCount(), 1);
  assert.match(String(warn.mock.calls[0].arguments[0]), /^3 sign-in audit rows were still waiting/);
  // The test's cleanup closes the file again.
  s.close = () => {};
});

test('rows put back after a rollback over the bound are dropped with the one warning, as new ones are', (t) => {
  const { s, open } = setup(t);
  const warn = t.mock.method(console, 'warn', () => {});
  const tx = open();
  writer.run({ transaction: { open: tx } }, () => s.create('T', { A: 'held' }));
  for (let i = 0; i < 300; i++) s.auditLockoutCleared(`a${i}`, 'account', '10.1.0.1');
  writer.run({ transaction: { open: tx } }, () => s.setPassword('Cy', 'pw', '[Full Access]'));
  assert.equal(s.deferredSecurityStats().pending, 0, 'all 300 went into the holder');
  for (let i = 0; i < 10_000; i++) s.auditLockoutCleared(`b${i}`, 'account', '10.1.0.2');
  assert.deepEqual(s.deferredSecurityStats(), { pending: 10_000, dropped: 0 });
  endTransaction(tx, false);
  assert.equal(s.deferredSecurityStats().dropped, 300, 'the oldest 300 of 10,300 went');
  assert.equal(warn.mock.callCount(), 1, 'one warning for the run of drops');
});

test('a waiting row keeps few enough characters of every name that the queue stays small', (t) => {
  const { s, hold } = setup(t);
  const tx = hold();
  s.auditSignIn('A'.repeat(100_000), 'B'.repeat(100_000), false);
  s.auditLockoutCleared('C'.repeat(100_000), 'account', 'D'.repeat(100_000));
  endTransaction(tx, false);
  const rows = s.auditLog({ security: true, limit: 10 }).filter((e) => e.kind === 'sign-in-failed' || e.kind === 'lockout-cleared');
  assert.equal(rows.length, 2);
  // Each row is its account or target, an address and a little detail: about 600 characters at most, not 24,000.
  for (const row of rows) assert.ok(JSON.stringify(row).length < 1500, `${JSON.stringify(row).length} characters in a row`);
});
