import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store, StoreError } from '../src/index.ts';

test('#16 deleted-record revert checks field writes and conceals unrelated audit sequences', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-revert-fields-'));
  const path = join(dir, 'Local.sqlite');
  createStore(path);
  const store = new Store(path);
  try {
    store.applyDesign([
      { op: 'createTable', name: 'Docs', fields: [{ name: 'Title' }, { name: 'Protected' }] },
      { op: 'createTable', name: 'Other', fields: [{ name: 'Title' }] },
    ]);
    const id = store.create('Docs', { Title: 'visible', Protected: 'read only' }).recordId;
    store.delete('Docs', id);
    const gone = store.auditLog({ table: 'Docs', recordId: id, kind: 'delete' })[0];
    const open = { view: true, edit: true, create: true, delete: true };
    for (const level of ['viewOnly', 'none'] as const) {
      store.savePrivilegeSet({ name: level, records: open, tables: { Docs: { ...open, fields: { Protected: level } } },
        layouts: 'modifiable', scripts: 'none', valueLists: 'none', extendedPrivileges: [] });
      store.setPassword(level, 'pw', level);
      assert.throws(() => store.revertAuditEntry('Docs', id, gone.seq, { account: level, privileges: store.privileges(level) }), StoreError);
      assert.equal(store.findIds('Docs').length, 0);
      assert.equal(store.auditLog({ table: 'Docs', kind: 'create' }).length, 1);
    }
    const other = store.create('Other', { Title: 'elsewhere' }).recordId;
    const foreign = store.auditLog({ table: 'Other', recordId: other })[0].seq;
    for (const seq of [foreign, gone.seq + 1000]) {
      assert.throws(() => store.revertAuditEntry('Docs', id, seq), (e: Error) =>
        e instanceof StoreError && e.message === `Audit entry ${seq} is not a change to this record`);
    }
    assert.equal(store.revertAuditEntry('Docs', id, gone.seq).action, 'created');
    assert.equal(store.get('Docs', id, 'iso').fieldData.Protected, 'read only');
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
});
