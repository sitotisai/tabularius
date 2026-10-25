// A record id is given again after the last record is deleted. The audit log is keyed by (table, record id), so an
// entry from the record that had the id before must not be reverted onto the one that has it now.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';

function withStore(fn: (store: Store) => void) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-reused-id-'));
  createStore(join(dir, 'Notes.sqlite'));
  const store = new Store(join(dir, 'Notes.sqlite'));
  try {
    store.applyDesign([{ op: 'createTable', name: 'Docs', fields: [{ name: 'Title', type: 'text' }, { name: 'Pin', type: 'text' }] }] as never);
    fn(store);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

test('entries of an earlier record that had the same id are not reverted onto the current one', () => {
  withStore((store) => {
    const first = store.create('Docs', { Title: 'secret-A', Pin: '1111' }, { account: 'Admin' }).recordId;
    store.update('Docs', first, { Title: 'secret-A edited' }, undefined, { account: 'Admin' });
    store.delete('Docs', first, { account: 'Admin' });
    const old = store.auditLog({ table: 'Docs', recordId: first });
    assert.deepEqual(old.map((e) => e.kind), ['create', 'update', 'delete']);

    // The highest id was deleted, so the next record is given it again.
    const second = store.create('Docs', { Title: 'mine', Pin: '2222' }, { account: 'Bea' }).recordId;
    assert.equal(second, first);
    for (const entry of old) {
      assert.throws(() => store.revertAuditEntry('Docs', second, entry.seq, { account: 'Bea' }), /not a change to this record/, entry.kind);
    }
    const row = store.get('Docs', second, 'iso').fieldData;
    assert.deepEqual([row.Title, row.Pin], ['mine', '2222']);

    // Its own entries still revert: an edit, then its creation.
    store.update('Docs', second, { Title: 'mine, edited' }, undefined, { account: 'Bea' });
    const edit = store.auditLog({ table: 'Docs', recordId: second, kind: 'update' }).at(-1)!;
    assert.equal(store.revertAuditEntry('Docs', second, edit.seq, { account: 'Bea' }).action, 'updated');
    assert.equal(store.get('Docs', second, 'iso').fieldData.Title, 'mine');
    const created = store.auditLog({ table: 'Docs', recordId: second, kind: 'create' }).at(-1)!;
    assert.equal(store.revertAuditEntry('Docs', second, created.seq, { account: 'Bea' }).action, 'deleted');
  });
});

test('a deleted record that was put back by a revert keeps its whole history revertable', () => {
  withStore((store) => {
    const id = store.create('Docs', { Title: 'a' }, { account: 'Ann' }).recordId;
    store.update('Docs', id, { Title: 'b' }, undefined, { account: 'Ann' });
    const edit = store.auditLog({ table: 'Docs', recordId: id, kind: 'update' })[0];
    store.delete('Docs', id, { account: 'Ann' });
    const deleted = store.auditLog({ table: 'Docs', recordId: id, kind: 'delete' })[0];
    store.revertAuditEntry('Docs', id, deleted.seq, { account: 'Cy' });
    // The same record came back, so what was logged before still belongs to it.
    assert.equal(store.revertAuditEntry('Docs', id, edit.seq, { account: 'Cy' }).action, 'updated');
    assert.equal(store.get('Docs', id, 'iso').fieldData.Title, 'a');
  });
});
