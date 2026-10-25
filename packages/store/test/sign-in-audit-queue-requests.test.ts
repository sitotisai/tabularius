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
