// The data cleanup's undo puts a merged-away record back under its id. That id may have been given to another record
// since (new ids continue after the highest one left); the put-back must name the delete it undoes, not that record's.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../../store/src/index.ts';
import { applyCleanup, journalDeletes, snapshotRows, undoCleanup } from '../src/cleanup.ts';

function withDocs(t: { after: (fn: () => void) => void }): Store {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-cleanup-life-'));
  const path = join(dir, 'Docs.sqlite');
  createStore(path, { mode: 'native' });
  const store = new Store(path, 'Docs');
  t.after(() => { store.close(); rmSync(dir, { recursive: true, force: true }); });
  store.applyDesign([{ op: 'createTable', name: 'Docs', fields: [{ name: 'Title' }] }]);
  return store;
}

test('a merge undone after another record had and gave up the id names the merge\'s own delete', (t) => {
  const store = withDocs(t);
  const keep = store.create('Docs', { Title: 'Keep' }, { account: 'Ann' }).recordId;
  const dup = store.create('Docs', { Title: 'Duplicate' }, { account: 'Ann' }).recordId;
  const batch = applyCleanup(store, { layout: 'Docs', merges: [{ keep, remove: [dup] }] }, { account: 'Ann' });
  assert.ok('id' in batch);
  const merged = store.auditLog({ table: 'Docs', recordId: dup, kind: 'delete' }).at(-1)!;
  // The highest id was deleted, so the next record is given it again, and then goes too.
  assert.equal(store.create('Docs', { Title: 'Duplicate' }, { account: 'Bo' }).recordId, dup);
  store.delete('Docs', dup, { account: 'Bo' });
  assert.deepEqual(undoCleanup(store, batch.id, { account: 'Ann' }), { undone: 1, skipped: [] });
  assert.equal(store.auditLog({ table: 'Docs', recordId: dup, kind: 'create' }).at(-1)!.revertOf, merged.seq);
});

test('records deleted outside a merge (journalDeletes) are put back naming their own delete too', (t) => {
  const store = withDocs(t);
  store.create('Docs', { Title: 'Keep' }, { account: 'Ann' });
  const doomed = store.create('Docs', { Title: 'Doomed' }, { account: 'Ann' }).recordId;
  const snap = snapshotRows(store, 'Docs', [doomed])!;
  store.delete('Docs', doomed, { account: 'Ann' });
  const deleted = store.auditLog({ table: 'Docs', recordId: doomed, kind: 'delete' }).at(-1)!;
  const batch = journalDeletes(store, snap, 'Ann', (n) => `${n} deleted`)!;
  assert.equal(store.create('Docs', { Title: 'Doomed' }, { account: 'Bo' }).recordId, doomed);
  store.delete('Docs', doomed, { account: 'Bo' });
  undoCleanup(store, batch.id, { account: 'Ann' });
  assert.equal(store.auditLog({ table: 'Docs', recordId: doomed, kind: 'create' }).at(-1)!.revertOf, deleted.seq);
});
