import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '@tabularius/store';
import { conversionGuide, guideText } from '../src/conversion-guide.ts';
import { conversionReport } from '../src/conversion.ts';

function withStore(check: (store: Store) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-recursive-report-'));
  const path = join(dir, 'Converted.sqlite');
  createStore(path);
  const store = new Store(path, 'Converted');
  try { check(store); } finally { store.close(); rmSync(dir, { recursive: true }); }
}

test('a store without custom functions has no recursion finding', () => {
  withStore((store) => assert.deepEqual(conversionReport(store).functions.recursive, []));
});

test('the shortest cycle wins when a function has more than one route back to itself', () => {
  withStore((store) => {
    store.schema.customFunctions.push(
      { id: 1, name: 'Start', parameters: ['n'], formula: 'Long ( n ) + Short ( n )' },
      { id: 2, name: 'Long', parameters: ['n'], formula: 'Middle ( n )' },
      { id: 3, name: 'Middle', parameters: ['n'], formula: 'Start ( n )' },
      { id: 4, name: 'Short', parameters: ['n'], formula: 'Start ( n )' },
    );
    const item = conversionReport(store).functions.recursive.find((f) => f.name === 'Start');
    assert.deepEqual(item, { name: 'Start', count: 1, where: ['Start → Short → Start'] });
  });
});

test('report and guide list direct and mutual cycles, but not callers, strings, comments or JavaScript', () => {
  withStore((store) => {
    const functions = [
      ['Sum1', 'If ( n <= 0 ; 0 ; n + Sum1 ( n - 1 ) )'],
      ['Even', 'If ( n = 0 ; 1 ; Odd ( n - 1 ) )'],
      ['Odd', 'If ( n = 0 ; 0 ; Even ( n - 1 ) )'],
      ['A', 'B ( n )'], ['B', 'C ( n )'], ['C', 'A ( n )'],
      ['Double', 'n * 2'], ['Twice', 'Double ( Double ( n ) )'],
      ['CallsSum', 'Sum1 ( n )'],
      ['Quoted', 'If ( n = 0 ; "Quoted ( n )" ; n ) /* Quoted ( n ) */'],
    ] as const;
    store.schema.customFunctions.push(...functions.map(([name, formula], id) => ({ id: id + 1, name, parameters: ['n'], formula })));
    store.schema.customFunctions.push({ id: 11, name: 'Js', parameters: ['n'], formula: 'Js(n)', language: 'javascript' });
    const report = conversionReport(store);
    assert.deepEqual(report.functions.recursive, [
      { name: 'A', count: 1, where: ['A → B → C → A'] },
      { name: 'B', count: 1, where: ['B → C → A → B'] },
      { name: 'C', count: 1, where: ['C → A → B → C'] },
      { name: 'Even', count: 1, where: ['Even → Odd → Even'] },
      { name: 'Odd', count: 1, where: ['Odd → Even → Odd'] },
      { name: 'Sum1', count: 1, where: ['calls itself'] },
    ]);
    const problems = report.summary.split('## Good to know')[0];
    assert.match(report.summary, /## Good to know[\s\S]*Custom functions that call themselves/);
    assert.doesNotMatch(problems, /Custom functions that call themselves/);
    assert.match(report.summary, /Nothing found that won't work\./);
    const guide = conversionGuide(store);
    const item = guide.differs.find((i) => i.title === 'Custom functions that call themselves');
    assert.ok(item);
    assert.equal(item.severity, 'low');
    assert.equal(item.count, report.functions.recursive.length);
    assert.equal(item.where[0], 'Custom function A');
    assert.match(guideText(guide), /Custom functions that call themselves/);
    assert.deepEqual(conversionReport(store, [], (w) => w.startsWith('Custom function Sum1 (')).functions.recursive,
      [{ name: 'Sum1', count: 1, where: ['calls itself'] }]);
  });
});
