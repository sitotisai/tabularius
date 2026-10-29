// Cleanup labels in a record's history follow the journal's reader permissions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Privileges, Store, type PrivilegeDefinition } from '../../store/src/index.ts';
import { journalBatch, type UndoOp } from '../src/cleanup.ts';
import { recordHistory } from '../src/record-history.ts';

const limited: PrivilegeDefinition = {
  name: 'Limited', records: { view: true, edit: true, create: true, delete: true },
  layouts: 'modifiable', scripts: 'modifiable', valueLists: 'viewOnly', extendedPrivileges: [],
};

for (const scenario of [
  { name: 'without a reader keeps all cleanup labels', account: undefined, full: false, summary: 'Bea secret summary' },
  { name: 'a limited reader sees only their cleanup labels', account: 'Ann', full: false, summary: 'Ann fixed 1 record' },
  { name: 'a limited reader without batches sees no cleanup labels', account: 'Cy', full: false, summary: undefined },
  { name: 'a full reader sees all cleanup labels', account: 'Cy', full: true, summary: 'Bea secret summary' },
  { name: 'cleanup ownership matches without regard to case', account: 'ann', full: false, summary: 'Ann fixed 1 record' },
]) {
  test(`record history: ${scenario.name}`, () => {
    const dir = mkdtempSync(join(tmpdir(), 'tabularius-history-cleanup-who-'));
    createStore(join(dir, 'Notes.sqlite'));
    const store = new Store(join(dir, 'Notes.sqlite'));
    try {
      store.applyDesign([{ op: 'createTable', name: 'Docs', fields: [{ name: 'Title', type: 'text' }] }] as never);
      const id = store.create('Docs', { Title: 'a' }, { account: 'Ann' }).recordId;
      store.update('Docs', id, { Title: 'b' }, undefined, { account: 'Ann' });
      const undo: UndoOp[] = [{ op: 'set', occurrence: 'Docs', table: 'Docs', recordId: id, field: 'Title', before: 'a', after: 'b' }];
      journalBatch(store, { account: 'Ann', layout: 'Docs', summary: 'Ann fixed 1 record', undo });
      journalBatch(store, { account: 'Bea', layout: 'Docs', summary: 'Bea secret summary', undo });

      const who = scenario.account === undefined ? undefined : {
        account: scenario.account,
        privileges: scenario.full ? store.privileges('Admin') : new Privileges(scenario.account, limited, store, () => { throw new Error('no other file'); }),
      };
      const history = recordHistory(store, 'Docs', id, { who });
      assert.equal(history.events.length, 2);
      for (const event of history.events) {
        assert.equal(event.by, scenario.summary === undefined ? undefined : `data cleanup "${scenario.summary}"`);
      }
      if (who && !who.privileges.full) {
        assert.ok(!JSON.stringify(history).includes('Bea secret summary'));
        if (scenario.summary === undefined) assert.ok(!JSON.stringify(history).includes('Ann fixed 1 record'));
      }
    } finally {
      store.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
}
