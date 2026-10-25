import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';

// Putting a deleted record back (a cleanup undo, the admin console's restore) is logged as a create, and says which
// delete it undoes (revertOf), as a revert does: readers that look for where a record's life began (reconvert, record
// history, revert) must not take it for the record being made.

function withStore(fn: (store: Store) => void) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-restore-marked-'));
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

test('restoreDeletedRow logs a create that names the delete it undoes', () => {
  withStore((store) => {
    const id = store.create('Docs', { Title: 'a' }, { account: 'Ann' }).recordId;
    const before = store.sql.prepare('SELECT * FROM Docs WHERE _fm_record_id = ?').get(id) as Record<string, never>;
    store.delete('Docs', id, { account: 'Ann' });
    const deleted = store.auditLog({ table: 'Docs', recordId: id, kind: 'delete' })[0];
    store.restoreDeletedRow('Docs', before, { account: 'Ann' });
    const creates = store.auditLog({ table: 'Docs', recordId: id, kind: 'create' });
    assert.equal(creates.length, 2);
    assert.equal(creates[0].revertOf, undefined, 'the creation itself is not marked');
    assert.equal(creates[1].revertOf, deleted.seq);
  });
});

test("the admin console's restore of a deleted record logs a create that names the delete", () => {
  withStore((store) => {
    const id = store.create('Docs', { Title: 'a' }, { account: 'Ann' }).recordId;
    const made = store.auditLog({ table: 'Docs', recordId: id, kind: 'create' })[0];
    store.delete('Docs', id, { account: 'Ann' });
    const deleted = store.auditLog({ table: 'Docs', recordId: id, kind: 'delete' })[0];
    assert.equal(store.restoreRecord('Docs', id, made.seq, { account: 'admin console' }).action, 'created');
    const creates = store.auditLog({ table: 'Docs', recordId: id, kind: 'create' });
    assert.equal(creates[1].revertOf, deleted.seq);
  });
});

test('a revert of a delete is still marked with the entry it reverts', () => {
  withStore((store) => {
    const id = store.create('Docs', { Title: 'a' }, { account: 'Ann' }).recordId;
    store.delete('Docs', id, { account: 'Ann' });
    const deleted = store.auditLog({ table: 'Docs', recordId: id, kind: 'delete' })[0];
    store.revertAuditEntry('Docs', id, deleted.seq, { account: 'Ann' });
    assert.equal(store.auditLog({ table: 'Docs', recordId: id, kind: 'create' })[1].revertOf, deleted.seq);
  });
});
