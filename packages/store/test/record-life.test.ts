import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, lifeRanges, Store } from '../src/index.ts';

// The audit log is keyed by table and record id, and an id is given again after the last record is deleted, so one id
// can name several records over time. A create with revert_of puts a deleted record back: it carries on the life that
// the delete entry it names ended, and what was logged between that delete and the put-back is another record's.

test('lifeRanges: a record made here starts at its create; a revert does not start a life', () => {
  assert.deepEqual(lifeRanges([{ seq: 5, revert_of: null }]), [{ from: 5, to: Infinity }]);
  assert.deepEqual(lifeRanges([]), [{ from: 0, to: Infinity }]);
  // made at 5, deleted at 8, put back at 9 (naming the delete): one life but for the gap, which is nobody's
  assert.deepEqual(lifeRanges([{ seq: 9, revert_of: 8 }, { seq: 5, revert_of: null }]), [{ from: 9, to: Infinity }, { from: 5, to: 8 }]);
  // an original (no create logged), deleted at 3, another record under its id made at 4 and deleted at 6, original put back at 7
  assert.deepEqual(lifeRanges([{ seq: 7, revert_of: 3 }, { seq: 4, revert_of: null }]), [{ from: 7, to: Infinity }, { from: 0, to: 3 }]);
  // a put-back that names nothing (its delete is no longer in the log) carries on from the create before it
  assert.deepEqual(lifeRanges([{ seq: 9, revert_of: 0 }, { seq: 5, revert_of: null }]), [{ from: 5, to: Infinity }]);
  // put back twice
  assert.deepEqual(lifeRanges([{ seq: 12, revert_of: 11 }, { seq: 9, revert_of: 8 }, { seq: 5, revert_of: null }]),
    [{ from: 12, to: Infinity }, { from: 9, to: 11 }, { from: 5, to: 8 }]);
});

function withStore(fn: (store: Store) => void) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-record-life-'));
  createStore(join(dir, 'Notes.sqlite'));
  const store = new Store(join(dir, 'Notes.sqlite'));
  try {
    store.applyDesign([{ op: 'createTable', name: 'Docs', fields: [{ name: 'Title', type: 'text' }] }] as never);
    fn(store);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

test('a put-back names the delete it undoes, not a later delete of another record with the id', () => {
  withStore((store) => {
    const setUp = () => {
      const a = store.create('Docs', { Title: 'A' }, { account: 'Ann' }).recordId;
      const rowA = store.sql.prepare('SELECT * FROM Docs WHERE _fm_record_id = ?').get(a) as Record<string, never>;
      store.delete('Docs', a, { account: 'Ann' });
      const deleteA = store.auditLog({ table: 'Docs', recordId: a, kind: 'delete' }).at(-1)!;
      // The next record is given the id, and is deleted too: the latest delete of the id is B's.
      assert.equal(store.create('Docs', { Title: 'B' }, { account: 'Bo' }).recordId, a);
      store.delete('Docs', a, { account: 'Bo' });
      return { a, rowA, deleteA };
    };
    const lastCreate = (id: number) => store.auditLog({ table: 'Docs', recordId: id, kind: 'create' }).at(-1)!;

    // Named by whoever made the delete (the cleanup journal does)...
    const one = setUp();
    store.restoreDeletedRow('Docs', one.rowA, { account: 'Ann', undoesDelete: one.deleteA.seq });
    assert.equal(lastCreate(one.a).revertOf, one.deleteA.seq);
    store.delete('Docs', one.a, { account: 'Ann' });

    // ...or found by the values it logged when it was not named (a journal kept before the seq was recorded).
    const two = setUp();
    store.restoreDeletedRow('Docs', two.rowA, { account: 'Ann' });
    assert.equal(lastCreate(two.a).revertOf, two.deleteA.seq);
  });
});

test('the admin restore of a deleted record names the first delete after the entry it restores to', () => {
  withStore((store) => {
    const a = store.create('Docs', { Title: 'A' }, { account: 'Ann' }).recordId;
    const madeA = store.auditLog({ table: 'Docs', recordId: a, kind: 'create' })[0];
    store.delete('Docs', a, { account: 'Ann' });
    const deleteA = store.auditLog({ table: 'Docs', recordId: a, kind: 'delete' }).at(-1)!;
    store.create('Docs', { Title: 'B' }, { account: 'Bo' });
    store.delete('Docs', a, { account: 'Bo' });
    assert.equal(store.restoreRecord('Docs', a, madeA.seq, { account: 'admin console' }).action, 'created');
    assert.equal(store.auditLog({ table: 'Docs', recordId: a, kind: 'create' }).at(-1)!.revertOf, deleteA.seq);
  });
});
