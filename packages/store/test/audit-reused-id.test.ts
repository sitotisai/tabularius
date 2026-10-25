// A record id is given again after the last record is deleted. The audit log is keyed by (table, record id), so an
// entry from the record that had the id before must not be reverted onto the one that has it now.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, inLife, Store, StoreError } from '../src/index.ts';

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

test('a record put back by the cleanup undo keeps its own earlier edits revertable', () => {
  withStore((store) => {
    const id = store.create('Docs', { Title: 'a' }, { account: 'Ann' }).recordId;
    store.update('Docs', id, { Title: 'b' }, undefined, { account: 'Ann' });
    const edit = store.auditLog({ table: 'Docs', recordId: id, kind: 'update' })[0];
    const before = store.sql.prepare('SELECT * FROM Docs WHERE _fm_record_id = ?').get(id) as Record<string, never>;
    store.delete('Docs', id, { account: 'Ann' });
    store.restoreDeletedRow('Docs', before, { account: 'Ann' });
    // The same record came back, not a new one: its life did not start again.
    assert.ok(inLife(store.recordLife('Docs', id), edit.seq));
    assert.equal(store.revertAuditEntry('Docs', id, edit.seq, { account: 'Ann' }).action, 'updated');
    assert.equal(store.get('Docs', id, 'iso').fieldData.Title, 'a');
  });
});

test('an original put back by the admin console restore keeps its earlier history (a record that came with the file)', () => {
  withStore((store) => {
    const id = store.create('Docs', { Title: 'a' }, { account: 'Ann' }).recordId;
    // As a record from the file: nothing in the log says it was made here.
    store.sql.prepare("DELETE FROM _fm_audit WHERE kind = 'create'").run();
    store.update('Docs', id, { Title: 'b' }, undefined, { account: 'Ann' });
    const edit = store.auditLog({ table: 'Docs', recordId: id, kind: 'update' })[0];
    store.delete('Docs', id, { account: 'Ann' });
    assert.equal(store.restoreRecord('Docs', id, edit.seq, { account: 'admin console' }).action, 'created');
    assert.ok(inLife(store.recordLife('Docs', id), edit.seq), 'the restore is not a new record');
    assert.equal(store.revertAuditEntry('Docs', id, edit.seq, { account: 'Ann' }).action, 'updated');
  });
});

test('an account that cannot see a record learns nothing about it being made again from what revert answers', () => {
  withStore((store) => {
    const first = store.create('Docs', { Title: 'secret-A' }, { account: 'Admin' }).recordId;
    store.delete('Docs', first, { account: 'Admin' });
    const old = store.auditLog({ table: 'Docs', recordId: first, kind: 'create' })[0];
    const second = store.create('Docs', { Title: 'secret-B' }, { account: 'Admin' }).recordId;
    assert.equal(second, first);
    const mine = store.auditLog({ table: 'Docs', recordId: second, kind: 'create' }).at(-1)!;
    assert.ok(mine.seq > old.seq);

    const open = { view: true, edit: true, create: true, delete: true };
    const as = (name: string, tables: object) => {
      store.savePrivilegeSet({ name, records: { ...open }, layouts: 'modifiable', valueLists: 'none', scripts: 'none', extendedPrivileges: [], tables } as never);
      store.setPassword(name, 'pw', name);
      return store.privileges(name);
    };
    const hidden = { 'no view': as('NoView', { Docs: { ...open, view: false } }), 'view rule that hides it': as('Rule', { Docs: { ...open, view: 'Title = "nothing"' } }) };
    for (const [why, privileges] of Object.entries(hidden)) {
      const says = (seq: number) => {
        try {
          store.revertAuditEntry('Docs', second, seq, { account: 'x', privileges });
          return 'reverted';
        } catch (e) {
          return `${(e as StoreError).code}: ${(e as Error).message}`;
        }
      };
      // An entry of the earlier record, one of the present record, and one that is nobody's: the same answer.
      const answers = new Set([says(old.seq), says(mine.seq), says(mine.seq + 1000)].map((a) => a.replace(/\d+(?= is not)/, 'N')));
      assert.equal(answers.size, 1, `${why}: ${[...answers].join(' | ')}`);
    }
    assert.equal(store.get('Docs', second, 'iso').fieldData.Title, 'secret-B', 'and nothing was changed');
  });
});

test('an original put back after another record had and gave up its id: the other record\'s entries are not its own', () => {
  withStore((store) => {
    const a = store.create('Docs', { Title: 'A' }, { account: 'Ann' }).recordId;
    store.update('Docs', a, { Title: 'A, edited' }, undefined, { account: 'Ann' });
    const aEdit = store.auditLog({ table: 'Docs', recordId: a, kind: 'update' })[0];
    const rowA = store.sql.prepare('SELECT * FROM Docs WHERE _fm_record_id = ?').get(a) as Record<string, never>;
    store.delete('Docs', a, { account: 'Ann' }); // a merge of duplicates
    const deleteA = store.auditLog({ table: 'Docs', recordId: a, kind: 'delete' }).at(-1)!;
    const b = store.create('Docs', { Title: 'secret-B' }, { account: 'Bo' }).recordId;
    assert.equal(b, a);
    store.update('Docs', b, { Title: 'secret-B2' }, undefined, { account: 'Bo' });
    const bEdit = store.auditLog({ table: 'Docs', recordId: b, kind: 'update' }).at(-1)!;
    store.delete('Docs', b, { account: 'Bo' });
    store.restoreDeletedRow('Docs', rowA, { account: 'Ann', undoesDelete: deleteA.seq }); // the undo of the merge

    // Its own history before the delete is still its own; what happened in between is not.
    assert.throws(() => store.revertAuditEntry('Docs', a, bEdit.seq, { account: 'Ann' }), /not a change to this record/);
    assert.equal(store.get('Docs', a, 'iso').fieldData.Title, 'A, edited');
    assert.equal(store.revertAuditEntry('Docs', a, aEdit.seq, { account: 'Ann' }).action, 'updated');
    assert.equal(store.get('Docs', a, 'iso').fieldData.Title, 'A');
  });
});

test('an account whose view rule may show a record gets one answer for a deleted record, whatever the entry', () => {
  withStore((store) => {
    const id = store.create('Docs', { Title: 'secret' }, { account: 'Admin' }).recordId;
    const made = store.auditLog({ table: 'Docs', recordId: id, kind: 'create' })[0];
    store.delete('Docs', id, { account: 'Admin' });
    const gone = store.auditLog({ table: 'Docs', recordId: id, kind: 'delete' })[0];
    const open = { view: true, edit: true, create: true, delete: true };
    store.savePrivilegeSet({ name: 'Rule', records: { ...open }, layouts: 'modifiable', valueLists: 'none', scripts: 'none', extendedPrivileges: [], tables: { Docs: { ...open, view: 'Title = "nothing"' } } } as never);
    store.setPassword('Rule', 'pw', 'Rule');
    const privileges = store.privileges('Rule');
    const says = (seq: number) => {
      try {
        store.revertAuditEntry('Docs', id, seq, { account: 'Rule', privileges });
        return 'reverted';
      } catch (e) {
        return `${(e as StoreError).code}: ${(e as Error).message}`.replace(/\d+(?= is not)/, 'N');
      }
    };
    const answers = new Set([says(made.seq), says(gone.seq), says(gone.seq + 1000)]);
    assert.equal(answers.size, 1, [...answers].join(' | '));
    assert.equal(store.sql.prepare('SELECT 1 FROM Docs WHERE _fm_record_id = ?').get(id), undefined, 'the record was not put back');
  });
});
