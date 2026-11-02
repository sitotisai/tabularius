import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';

const ascending = [-360000, -356400, -3600, 1, 32400, 36000, 356400, 360000];

function setup(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-time-order-'));
  const path = join(dir, 'Generated.openhbam.sqlite');
  createStore(path);
  const store = new Store(path, 'T');
  t.after(() => { store.close(); rmSync(dir, { recursive: true, force: true }); });
  store.applyDesign([
    { op: 'createTable', name: 'T', fields: [{ name: 'Tm', type: 'time' }] },
    { op: 'createField', table: 'T', name: 'UT', type: 'time', kind: 'calculation', calculation: 'Tm', options: { unstored: true } },
  ]);
  for (const Tm of ['100:00:00', '9:00:00', '-1:00:00', '99:00:00', '-100:00:00', '0:00:01', '10:00:00', '-99:00:00']) {
    store.create('T', { Tm });
  }
  const ids = store.findIds('T', {});
  const seconds = (id: number): number => {
    const value = String(store.get('T', id).fieldData.Tm);
    const match = /^(-?)(\d+):(\d{2}):(\d{2})$/.exec(value);
    assert.ok(match, `unexpected stored time: ${value}`);
    return (match[1] ? -1 : 1) * (Number(match[2]) * 3600 + Number(match[3]) * 60 + Number(match[4]));
  };
  return { store, ids, seconds };
}

test('Sort Records orders times by their length', (t) => {
  const { store, seconds } = setup(t);
  for (const [sortOrder, expected] of [['ascend', ascending], ['descend', [...ascending].reverse()]] as const) {
    assert.deepEqual(store.findIds('T', { sort: [{ fieldName: 'Tm', sortOrder }] }).map(seconds), expected);
  }
});

test('the sort of an unstored time calculation agrees', (t) => {
  const { store, ids, seconds } = setup(t);
  for (const [sortOrder, expected] of [['ascend', ascending], ['descend', [...ascending].reverse()]] as const) {
    assert.deepEqual(store.sortIds('T', ids, [{ fieldName: 'UT', sortOrder }]).map(seconds), expected);
  }
});

test('a find with <, >, <=, >= and a range on a time field compares the times', (t) => {
  const { store, seconds } = setup(t);
  const cases: [string, number[]][] = [
    ['>50:00:00', [356400, 360000]],
    ['>=99:00:00', [356400, 360000]],
    ['<5:00:00', [-360000, -356400, -3600, 1]],
    ['<-1:00:00', [-360000, -356400]],
    ['>-50:00:00', [-3600, 1, 32400, 36000, 356400, 360000]],
    ['>=10:00:00', [36000, 356400, 360000]],
    ['9:00:00...100:00:00', [32400, 36000, 356400, 360000]],
    ['-99:00:00...-1:00:00', [-356400, -3600]],
    ['100:00:00', [360000]],
  ];
  for (const [criterion, expected] of cases) {
    assert.deepEqual(store.findIds('T', { query: [{ Tm: criterion }] }).map(seconds).sort((a, b) => a - b), expected, criterion);
  }
});
