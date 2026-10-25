import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store, StoreError, writer, endTransaction, type Transaction } from '../src/index.ts';

// While a transaction holds the file, sign-ins go on unless that transaction has changed what a sign-in decides from (a password,
// a passkey, a code, a token, an authority, the ledger): then they are refused as busy, as every sign-in was. Rows that wait
// keep their order, also against the holder's own security rows. Reading an identity does not write.

function setup(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-signin-state-'));
  createStore(join(dir, 'Owner.sqlite'));
  const s = new Store(join(dir, 'Owner.sqlite'), 'Owner');
  t.after(() => { s.close(); rmSync(dir, { recursive: true }); });
  s.applyDesign([{ op: 'createTable', name: 'T', fields: [{ name: 'A' }] }]);
  s.setPassword('Ann', 'pw', '[Full Access]');
  const hold = (): Transaction => {
    const tx: Transaction = { files: new Map() };
    writer.run({ transaction: { open: tx } }, () => s.create('T', { A: 'held' }));
    return tx;
  };
  return { s, hold };
}

const busy = (e: unknown) => e instanceof StoreError && e.code === 301;

test('a password another session has set and not committed cannot sign anyone in, and is not honoured after the rollback', async (t) => {
  const { s } = setup(t);
  const tx: Transaction = { files: new Map() };
  writer.run({ transaction: { open: tx } }, () => s.setPassword('Ann', 'temp', '[Full Access]'));
  // From outside the transaction, the shared connection sees the new password: it must not be taken.
  await assert.rejects(() => s.verifyAsync('Ann', 'temp', '10.0.0.20'), busy);
  assert.throws(() => s.verify('Ann', 'temp', '10.0.0.20'), busy);
  assert.throws(() => s.verify('Ann', 'pw', '10.0.0.20'), busy, 'no sign-in is decided from state that may be undone');
  assert.throws(() => s.signInMark('Ann'), busy);
  assert.throws(() => s.auditSignIn('Ann', '10.0.0.20', true), busy);
  endTransaction(tx, false);
  assert.equal(s.verify('Ann', 'temp', '10.0.0.20'), false, 'the rolled back password is not one');
  assert.equal(s.verify('Ann', 'pw', '10.0.0.20'), true);
});

test('a transaction that changed nothing a sign-in reads does not stop sign-ins', (t) => {
  const { s, hold } = setup(t);
  const tx = hold();
  assert.equal(s.verify('Ann', 'pw', '10.0.0.21'), true);
  endTransaction(tx, true);
});

test('a sign-in mark that needs a ledger row written is refused while another session holds the file, and writes none into it', (t) => {
  const { s, hold } = setup(t);
  const ledger = () => (s.sql.prepare("SELECT count(*) AS n FROM sqlite_master WHERE name = '_fm_sign_in_ledger'").get() as { n: number }).n
    ? Number((s.sql.prepare('SELECT count(*) AS n FROM _fm_sign_in_ledger').get() as { n: number }).n) : 0;
  const before = ledger();
  const tx = hold();
  assert.throws(() => s.signInMark('Ann', 'pgwire'), busy);
  assert.equal(ledger(), before);
  endTransaction(tx, false);
  assert.match(s.signInMark('Ann', 'pgwire'), /^\d+:/);
});

test('a security row the holder writes goes after the rows that were waiting, and they wait again if it is undone', (t) => {
  const { s, hold } = setup(t);
  const all = () => s.auditLog({ security: true, limit: 50_000 }).sort((a, b) => a.seq - b.seq);
  const tx = hold();
  s.auditSignIn('Ann', '10.0.0.22', false);
  assert.equal(s.deferredSecurityStats().pending, 1);
  writer.run({ transaction: { open: tx } }, () => s.setPassword('Bob', 'pw', '[Full Access]'));
  // The waiting row went into the holder's transaction ahead of the change: it is no longer waiting, and it comes first.
  assert.equal(s.deferredSecurityStats().pending, 0);
  endTransaction(tx, true);
  const kept = all();
  const failed = kept.findIndex((e) => e.kind === 'sign-in-failed');
  assert.ok(failed >= 0, 'the sign-in row was written');
  assert.ok(kept.slice(failed + 1).some((e) => e.target === 'Bob' || e.account === 'Bob'), 'the sign-in row precedes the change');
  assert.equal(s.verifySecurityAudit().ok, true);

  // Undone: the change's row goes with it, and the waiting row is written once, afterwards.
  const second: Transaction = { files: new Map() };
  writer.run({ transaction: { open: second } }, () => s.create('T', { A: 'held' }));
  s.auditSignIn('Ann', '10.0.0.23', false);
  writer.run({ transaction: { open: second } }, () => s.setPassword('Cy', 'pw', '[Full Access]'));
  endTransaction(second, false);
  assert.deepEqual(s.deferredSecurityStats(), { pending: 0, dropped: 0 });
  const later = all().filter((e) => e.kind === 'sign-in-failed' && JSON.stringify(e).includes('10.0.0.23'));
  assert.equal(later.length, 1);
  assert.ok(!all().some((e) => e.target === 'Cy' || e.account === 'Cy'), 'the undone change left no row');
  assert.equal(s.verifySecurityAudit().ok, true);
});

test('reading an account that has no identity yet does not write, so it does not fail while another session holds the file', (t) => {
  const { s, hold } = setup(t);
  s.sql.prepare("UPDATE _fm_accounts SET identity_id = NULL WHERE name = 'Ann'").run();
  const tx = hold();
  assert.equal(s.accountIdentityIdIfSet('Ann'), undefined);
  assert.throws(() => s.accountIdentityId('Ann'), busy, 'the writing form is still refused');
  endTransaction(tx, false);
  assert.ok(s.accountIdentityId('Ann'));
  assert.equal(s.accountIdentityIdIfSet('Ann'), s.accountIdentityId('Ann'));
});
