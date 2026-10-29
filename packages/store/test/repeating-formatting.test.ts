import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';

const bold = [{ start: 0, end: 3, style: 256 }];
const italic = [{ start: 0, end: 4, style: 512 }];
function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-format-'));
  const path = join(dir, 'Test.sqlite');
  createStore(path);
  const store = new Store(path, 'Test');
  return { store, close: () => { store.close(); rmSync(dir, { recursive: true }); } };
}

test('related fields and portal rows return separate formatting for each repetition', () => {
  const { store: s, close } = setup();
  try {
    s.applyDesign([
      { op: 'createTable', name: 'Parents', fields: [{ name: 'Id', type: 'number' }] },
      { op: 'createTable', name: 'Children', fields: [{ name: 'ParentId', type: 'number' }, { name: 'Tags', options: { repetitions: 3 } }] },
      { op: 'createRelationship', left: 'Parents', right: 'Children', predicates: [{ left: 'Id', right: 'ParentId' }] },
    ]);
    const to = s.schema.tableOccurrences.find((t) => t.name === 'Children')!;
    const fid = s.schema.tables.find((t) => t.name === 'Children')!.fields.find((f) => f.name === 'Tags')!.id;
    const cell = { id: 901, kind: 'field', type: 1, anchors: { left: true, top: true, right: false, bottom: false }, style: {}, bounds: { top: 22, left: 22, bottom: 82, right: 200 },
      field: { tableOccurrenceId: to.id, fieldId: fid, tableOccurrence: 'Children', field: 'Tags', display: 'edit', repetitions: 3 } };
    const portal = { ...cell, id: 900, kind: 'portal', type: 9, field: undefined,
      portal: { tableOccurrenceId: to.id, tableOccurrence: 'Children', rows: 5, initialRow: 1, scrolling: true }, children: [{ ...cell, id: 902 }] };
    s.applyDesign([{ op: 'updateLayout', layout: 'Parents', design: { objects: [cell, portal] } }] as never);
    const parent = s.create('Parents', { Id: 1 }).recordId;
    const child = s.create('Children', { ParentId: 1, Tags: 'one', 'Tags(2)': 'four' }).recordId;
    s.update('Children', child, { Tags: 'one', 'Tags(2)': 'four' }, undefined, { styles: { Tags: bold, 'Tags(2)': italic } });
    const expected = { 'Children::Tags': bold, 'Children::Tags(2)': italic };
    assert.deepEqual(s.get('Parents', parent).styles, expected);
    assert.deepEqual(s.get('Parents', parent).portalStyles?.Children?.[child], expected);
    s.update('Parents', parent, { 'Children::Tags(2)': 'four' }, undefined, { styles: { 'Children::Tags(2)': bold } });
    assert.deepEqual(s.get('Parents', parent).styles?.['Children::Tags(2)'], bold);
    s.updatePortals('Parents', parent, { Children: [{ recordId: String(child), 'Children::Tags(2)': 'four' }] }, [], {}, { Children: { [child]: { 'Children::Tags(2)': italic } } });
    assert.deepEqual(s.get('Parents', parent).portalStyles?.Children?.[child], expected);
  } finally { close(); }
});

test('stored calculation repetitions keep their own runs on create, edit and design recomputation', () => {
  const { store: s, close } = setup();
  try {
    s.applyDesign([{ op: 'createTable', name: 'Notes', fields: [
      { name: 'Tags', options: { repetitions: 2 } }, { name: 'Flag', type: 'number' },
      { name: 'Styled', kind: 'calculation', calculation: 'If ( Extend ( Flag ) ; TextStyleAdd ( Tags ; 256 ) ; Tags )', options: { repetitions: 2 } },
    ] }]);
    const id = s.create('Notes', { Flag: 1, Tags: 'one', 'Tags(2)': 'four' }).recordId;
    assert.deepEqual(s.get('Notes', id).styles, { Styled: bold, 'Styled(2)': [{ ...bold[0], end: 4 }] });
    s.update('Notes', id, { Flag: 0 });
    assert.equal(s.get('Notes', id).styles, undefined, 'plain results clear runs even when text is unchanged');
    s.update('Notes', id, { Flag: 1, 'Tags(2)': 'hi' });
    assert.deepEqual(s.get('Notes', id).styles?.['Styled(2)'], [{ ...bold[0], end: 2 }]);
    s.applyDesign([{ op: 'updateField', table: 'Notes', field: 'Styled', calculation: 'TextStyleAdd ( Tags ; 512 )' }]);
    assert.deepEqual(s.get('Notes', id).styles, { Styled: [{ ...italic[0], end: 3 }], 'Styled(2)': [{ ...italic[0], end: 2 }] });
    s.applyDesign([{ op: 'updateField', table: 'Notes', field: 'Styled', calculation: 'Tags' }]);
    assert.equal(s.get('Notes', id).styles, undefined, 'plain recalculation clears all repetitions');
  } finally { close(); }
});
