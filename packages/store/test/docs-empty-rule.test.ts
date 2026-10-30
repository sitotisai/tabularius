// "Do not evaluate if all referenced fields are empty": the page says what a large sample file showed, and these checks
// keep the sentences true to the code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';

const root = join(import.meta.dirname, '..', '..', '..');
const page = readFileSync(join(root, 'docs', 'design-mode.md'), 'utf8');
const paragraph = page.split(/\n\s*\n/).find((p) => p.startsWith('**Do not evaluate if all referenced fields are empty.**')) ?? '';

function store(t: { after(fn: () => void): void }): Store {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-empty-rule-'));
  const path = join(dir, 'Rule.sqlite');
  createStore(path);
  const s = new Store(path, 'Rule');
  t.after(() => s.close());
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  s.applyDesign([
    { op: 'createTable', name: 'Art', fields: [{ name: 'Note' }, { name: 'Qty', type: 'number' }, { name: 'Image', type: 'container' }] },
    { op: 'createCustomFunction', name: 'Twice', parameters: ['x'], formula: 'x * 2' },
  ]);
  return s;
}

test('the page has a paragraph on the rule that names the container case, custom functions and run-time field choice', () => {
  assert.notEqual(paragraph, '', 'design-mode.md needs a paragraph that starts with the bold sentence "Do not evaluate if all referenced fields are empty."');
  for (const word of ['container', 'IsEmpty', 'custom function', 'unverified', 'GetField', 'Evaluate', 'Lookup']) {
    assert.ok(paragraph.includes(word), `the paragraph should mention ${word}`);
  }
  assert.match(paragraph, /<!-- known-difference: SQL and calculations ;;/, 'the paragraph carries a known-difference marker');
});

test('an empty container is a value, empty text and numbers are not (what the page says)', (t) => {
  const s = store(t);
  s.applyDesign([
    { op: 'createField', table: 'Art', name: 'NoImage', kind: 'calculation', type: 'number', calculation: 'IsEmpty ( Image )' },
    { op: 'createField', table: 'Art', name: 'NoNote', kind: 'calculation', type: 'number', calculation: 'IsEmpty ( Note )' },
    { op: 'createField', table: 'Art', name: 'NoQty', kind: 'calculation', type: 'number', calculation: 'IsEmpty ( Qty )' },
  ]);
  const id = s.create('Art', {}).recordId;
  const data = s.get('Art', id).fieldData;
  assert.equal(data.NoImage, 1);
  assert.equal(data.NoNote, '');
  assert.equal(data.NoQty, '');
});

test('a formula that calls a custom function follows the rule here, and one that chooses fields at run time is always evaluated', (t) => {
  const s = store(t);
  s.applyDesign([
    { op: 'createField', table: 'Art', name: 'Doubled', kind: 'calculation', type: 'number', calculation: 'Twice ( Qty ) + 1' },
    { op: 'createField', table: 'Art', name: 'Dynamic', kind: 'calculation', type: 'text', calculation: 'IsEmpty ( Note ) & GetField ( "Note" )' },
  ]);
  const empty = s.create('Art', {}).recordId;
  assert.equal(s.get('Art', empty).fieldData.Doubled, '');
  assert.equal(s.get('Art', empty).fieldData.Dynamic, '1');
  const filled = s.create('Art', { Qty: '2' }).recordId;
  assert.equal(s.get('Art', filled).fieldData.Doubled, 5);
});
