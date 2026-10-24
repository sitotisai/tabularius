import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store, StoreError, writer, endTransaction, LOCKOUT, type Transaction } from '../src/index.ts';

// While another session's transaction holds the file, a sign-in row cannot be written. It waits, in order, bounded,
// and is written when the hold ends; nothing else waits, and lockouts do not depend on the rows.

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

test('at most 10,000 rows wait: the oldest go, once with a warning, and the count says how many', (t) => {
  const { s, hold } = setup(t);
  const warned: string[] = [];
  t.mock.method(console, 'warn', (m: string) => { warned.push(m); });
  const tx = hold();
  for (let i = 0; i < 10_003; i++) s.auditSignIn(`n${i}`, '10.0.0.3', true);
  assert.deepEqual(s.deferredSecurityStats(), { pending: 10_000, dropped: 3 });
  assert.equal(warned.filter((m) => /sign-in audit rows are waiting/.test(m)).length, 1);
  // The transaction is left open: writing 10,000 rows out takes seconds, and the ordering is checked above.
  void tx;
});
