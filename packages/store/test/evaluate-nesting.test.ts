// A text field that evaluates itself, read through an unstored calculation: the record must still read back, with the
// error value or the number its own EvaluationError calls make of it, however the text fans out (a save that left every later read failing was the fault).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';

function setup(t: { after: (f: () => void) => void }) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-evaluate-nesting-'));
  const path = join(dir, 'Scratch.sqlite');
  createStore(path);
  const store = new Store(path);
  t.after(() => { store.close(); rmSync(dir, { recursive: true }); });
  store.applyDesign([
    { op: 'createTable', name: 'T', fields: [{ name: 'G' }] },
    { op: 'createField', table: 'T', name: 'U', type: 'text', kind: 'calculation', calculation: 'Evaluate ( G )', options: { unstored: true } },
  ]);
  return store;
}

const FAN_OUT = 'EvaluationError ( Evaluate ( G ) ) + EvaluationError ( Evaluate ( G ) )';

// EvaluationError catches the refusal, so for FAN_OUT the calculation is a number (the sum of the caught codes), not "?".
for (const [name, text, expected] of [
  ['fan-out caught by EvaluationError', FAN_OUT, /^\d+$/],
  ['plain self-evaluation', 'Evaluate ( G )', /^\?$/],
  ['self-evaluation twice per level', 'Evaluate ( G ) & Evaluate ( G )', /^\?$/],
] as const) {
  test(`a record whose text evaluates itself reads back with the error value: ${name}`, (t) => {
    const store = setup(t);
    const id = Number(store.create('T', { G: '1' }).recordId);
    assert.equal(store.get('T', id).fieldData.U, '1');
    store.update('T', id, { G: text });
    const started = performance.now();
    for (let i = 0; i < 3; i++) assert.match(String(store.get('T', id).fieldData.U), expected);
    assert.ok(performance.now() - started < 5000, `three reads took ${Math.round(performance.now() - started)} ms`);
  });
}
