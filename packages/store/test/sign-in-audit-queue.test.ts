import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store, StoreError, writer, endTransaction, LOCKOUT, totpCode, type Transaction } from '../src/index.ts';

// While a transaction holds the file, a sign-in row cannot be written. It waits, in order, bounded, and is written when
// the hold ends; nothing else waits, a sign-in that needs a write of second-factor state is still refused, and lockouts do
// not depend on the rows.

function setup(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-signin-queue-'));
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
  const rows = (account: string) => s.auditLog({ account, kinds: ['sign-in', 'sign-in-failed', 'locked-out'], security: true, limit: 50_000 });
  return { s, hold, rows };
}

test('a sign-in row waits for the hold, keeps its time and order, and a lockout counts at once', async (t) => {
  const { s, hold, rows } = setup(t);
  const tx = hold();
  const first = new Date().toISOString();
  s.auditSignIn('Ann', '10.0.0.1', false);
  await new Promise((resolve) => setTimeout(resolve, 5));
  s.auditSignIn('Ann', '10.0.0.1', true);
  assert.equal(rows('Ann').length, 0);
  assert.deepEqual(s.deferredSecurityStats(), { pending: 2, dropped: 0 });
  // Failures count against the account whether or not their rows could be written.
  for (let i = 0; i < LOCKOUT.attempts; i++) s.verify('Ann', 'wrong', '10.0.0.2');
  assert.ok(s.lockedOut('Ann', '10.0.0.2'));
  // A change that is not a sign-in is still refused while the file is held (it does not wait).
  assert.throws(() => s.setPassword('Bob', 'pw', '[Full Access]'), (e: unknown) => e instanceof StoreError && e.code === 301);
  endTransaction(tx, false);
  const list = rows('Ann');
  assert.deepEqual(list.map((e) => e.kind).slice(0, 2), ['sign-in-failed', 'sign-in']);
  assert.ok(list.some((e) => e.kind === 'locked-out'));
  assert.ok(list[0].at >= first && list[0].at < list[1].at, 'the times are those of the events');
  assert.deepEqual(s.deferredSecurityStats(), { pending: 0, dropped: 0 });
  assert.equal(s.verifySecurityAudit().ok, true);
});

test("the holder's own sign-in rows wait too, so reverting its transaction cannot hide them", (t) => {
  const { s, rows } = setup(t);
  const tx: Transaction = { files: new Map() };
  writer.run({ transaction: { open: tx } }, () => {
    s.create('T', { A: 'held' });
    s.auditSignIn('Ann', '10.0.0.5', false);
  });
  assert.deepEqual(s.deferredSecurityStats(), { pending: 1, dropped: 0 });
  endTransaction(tx, false);
  assert.deepEqual(rows('Ann').map((e) => e.kind), ['sign-in-failed'], 'written after the revert, which did not take it with it');
});

test('a sign-in that needs second-factor state written is refused while another session holds the file, and the code is not spent', (t) => {
  const { s, hold } = setup(t);
  const { secret } = s.enrollTotp('Ann');
  assert.equal(s.confirmTotp('Ann', totpCode(secret)), true);
  const tx = hold();
  assert.throws(() => s.verifyTotp('Ann', totpCode(secret), '10.0.0.6'), (e: unknown) => e instanceof StoreError && e.code === 301);
  assert.throws(() => s.issueWebauthnChallenge('auth'), (e: unknown) => e instanceof StoreError && e.code === 301);
  endTransaction(tx, false);
  assert.equal(s.verifyTotp('Ann', totpCode(secret), '10.0.0.6'), true, 'not used up by the refused attempt');
  assert.equal(s.verifyTotp('Ann', totpCode(secret), '10.0.0.6'), false, 'and used up by the accepted one');
});

test('a long queue is written out in chunks that let the event loop run, in order, with the chain intact', async (t) => {
  const { s, hold } = setup(t);
  const tx = hold();
  for (let i = 0; i < 450; i++) s.auditLockoutCleared(`n${String(i).padStart(4, '0')}`, 'account', '10.0.0.7');
  assert.equal(s.deferredSecurityStats().pending, 450);
  endTransaction(tx, true);
  // The first chunk is written at once, the rest on later turns of the event loop.
  const afterFirst = s.deferredSecurityStats().pending;
  assert.ok(afterFirst > 0 && afterFirst < 450, `${afterFirst} rows still waiting after the first chunk`);
  for (let i = 0; i < 1000 && s.deferredSecurityStats().pending; i++) await new Promise((resolve) => setImmediate(resolve));
  assert.equal(s.deferredSecurityStats().pending, 0);
  const targets = s.auditLog({ kind: 'lockout-cleared', security: true, limit: 1000 }).sort((a, b) => a.seq - b.seq).map((e) => e.target);
  assert.deepEqual(targets, Array.from({ length: 450 }, (_, i) => `n${String(i).padStart(4, '0')}`), 'in the order they happened');
  assert.equal(s.verifySecurityAudit().ok, true);
});

test('at most 10,000 rows wait: the oldest go, once with a warning, and the count says how many', (t) => {
  const { s, hold } = setup(t);
  const warned: string[] = [];
  t.mock.method(console, 'warn', (m: string) => { warned.push(m); });
  hold();
  for (let i = 0; i < 10_003; i++) s.auditLockoutCleared(`n${i}`, 'account', '10.0.0.3');
  assert.deepEqual(s.deferredSecurityStats(), { pending: 10_000, dropped: 3 });
  assert.equal(warned.filter((m) => /sign-in audit rows are waiting/.test(m)).length, 1);
});

test('successful sign-ins are limited to 1,000 waiting, and over the bound they go before failures and lockouts', (t) => {
  const { s, hold } = setup(t);
  t.mock.method(console, 'warn', () => {});
  hold();
  for (let i = 0; i < 1100; i++) s.auditSignIn(`ok${i}`, '10.0.0.9', true);
  assert.deepEqual(s.deferredSecurityStats(), { pending: 1000, dropped: 100 });
  for (let i = 0; i < 9000; i++) s.auditLockoutCleared(`n${i}`, 'account', '10.0.0.9');
  assert.deepEqual(s.deferredSecurityStats(), { pending: 10_000, dropped: 100 });
  for (let i = 0; i < 5; i++) s.auditLockoutCleared(`m${i}`, 'account', '10.0.0.9');
  // Each of the five pushed out a successful sign-in, not a lockout row.
  assert.deepEqual(s.deferredSecurityStats(), { pending: 10_000, dropped: 105 });
});

test('names in a waiting row are cut to 4,096 characters', (t) => {
  const { s, hold } = setup(t);
  const tx = hold();
  s.auditSignIn('A'.repeat(100_000), 'B'.repeat(100_000), false);
  endTransaction(tx, false);
  const [row] = s.auditLog({ kind: 'sign-in-failed', security: true, limit: 10 });
  assert.equal(row.account?.length, 4096);
});
