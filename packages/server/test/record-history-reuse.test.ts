// A record's history when its id is a deleted record's: only what happened to this record, never the earlier one's
// values (the account asking may be allowed to see the new record but not the old one).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../../store/src/index.ts';
import { recordHistory } from '../src/record-history.ts';

test('the history of a record does not include the record that had its id before', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-history-reuse-'));
  createStore(join(dir, 'Notes.sqlite'));
  const store = new Store(join(dir, 'Notes.sqlite'));
  try {
    store.applyDesign([{ op: 'createTable', name: 'Docs', fields: [{ name: 'Title', type: 'text' }] }] as never);
    const first = store.create('Docs', { Title: 'secret-A' }, { account: 'Admin' }).recordId;
    store.update('Docs', first, { Title: 'secret-A edited' }, undefined, { account: 'Admin' });
    assert.equal(recordHistory(store, 'Docs', first).events.length, 2);
    store.delete('Docs', first, { account: 'Admin' });
    // Deleted: its own history stays.
    assert.equal(recordHistory(store, 'Docs', first).events.flatMap((e) => e.seqs).length, 3);

    const second = store.create('Docs', { Title: 'mine' }, { account: 'Bea' }).recordId;
    assert.equal(second, first);
    const history = recordHistory(store, 'Docs', second);
    assert.deepEqual(history.events.map((e) => [e.kind, e.account]), [['created', 'Bea']]);
    assert.ok(!JSON.stringify(history).includes('secret-A'));
    assert.equal(history.more, undefined);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a record put back by the cleanup undo keeps the history from before it was deleted', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-history-restore-'));
  createStore(join(dir, 'Notes.sqlite'));
  const store = new Store(join(dir, 'Notes.sqlite'));
  try {
    store.applyDesign([{ op: 'createTable', name: 'Docs', fields: [{ name: 'Title', type: 'text' }] }] as never);
    const id = store.create('Docs', { Title: 'a' }, { account: 'Ann' }).recordId;
    store.update('Docs', id, { Title: 'b' }, undefined, { account: 'Ann' });
    const before = store.sql.prepare('SELECT * FROM Docs WHERE _fm_record_id = ?').get(id) as Record<string, never>;
    store.delete('Docs', id, { account: 'Ann' });
    store.restoreDeletedRow('Docs', before, { account: 'Ann' });
    const events = recordHistory(store, 'Docs', id).events;
    // The create, the edit and the delete from before, and the put-back (an edit straight after a create folds into it).
    assert.equal(events.flatMap((e) => e.seqs).length, 4);
    assert.ok(events.some((e) => e.revertOf !== undefined), 'the put-back says it puts something back');
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the history of an original put back after another record had and gave up its id does not include that record', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-history-restore-b-'));
  createStore(join(dir, 'Notes.sqlite'));
  const store = new Store(join(dir, 'Notes.sqlite'));
  try {
    store.applyDesign([{ op: 'createTable', name: 'Docs', fields: [{ name: 'Title', type: 'text' }] }] as never);
    const a = store.create('Docs', { Title: 'A' }, { account: 'Ann' }).recordId;
    const rowA = store.sql.prepare('SELECT * FROM Docs WHERE _fm_record_id = ?').get(a) as Record<string, never>;
    store.delete('Docs', a, { account: 'Ann' });
    const deleteA = store.auditLog({ table: 'Docs', recordId: a, kind: 'delete' }).at(-1)!;
    assert.equal(store.create('Docs', { Title: 'secret-B' }, { account: 'Bo' }).recordId, a);
    store.update('Docs', a, { Title: 'secret-B2' }, undefined, { account: 'Bo' });
    store.delete('Docs', a, { account: 'Bo' });
    store.restoreDeletedRow('Docs', rowA, { account: 'Ann', undoesDelete: deleteA.seq });
    const history = recordHistory(store, 'Docs', a);
    assert.ok(!JSON.stringify(history).includes('secret-B'));
    assert.equal(history.events.flatMap((e) => e.seqs).length, 3, "A's create, its delete and the put-back");
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
