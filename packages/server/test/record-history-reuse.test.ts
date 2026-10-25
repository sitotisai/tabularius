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
