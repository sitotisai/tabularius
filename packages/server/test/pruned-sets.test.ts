import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prunedSets, recordPrunedSets } from '../src/pruned-sets.ts';

// The record of sets that retention removed, which the off-site mirror reads: only what is in it is removed off-site.

test('recorded sets are read back, an empty list records nothing, and an unreadable record names no set', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-pruned-'));
  try {
    assert.deepEqual([...prunedSets(dir)], []);
    recordPrunedSets(dir, []);
    assert.deepEqual([...prunedSets(dir)], []);
    recordPrunedSets(dir, ['2026-10-19_120000']);
    recordPrunedSets(dir, ['2026-10-20_120000']);
    assert.deepEqual([...prunedSets(dir)].sort(), ['2026-10-19_120000', '2026-10-20_120000']);
    // A damaged record never makes the mirror remove anything.
    writeFileSync(join(dir, '.pruned-sets.json'), '{ not json');
    assert.deepEqual([...prunedSets(dir)], []);
    writeFileSync(join(dir, '.pruned-sets.json'), JSON.stringify({ sets: ['2026-10-19_120000'] }));
    assert.deepEqual([...prunedSets(dir)], []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('records older than a month go, and the record is capped', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-pruned-'));
  try {
    const now = Date.parse('2026-10-24T12:00:00Z');
    recordPrunedSets(dir, ['2026-08-01_120000'], now - 40 * 86_400_000);
    recordPrunedSets(dir, ['2026-10-20_120000'], now);
    assert.deepEqual([...prunedSets(dir)], ['2026-10-20_120000']);
    const many = Array.from({ length: 250 }, (_, i) => `2026-10-${String(1 + (i % 28)).padStart(2, '0')}_${String(i).padStart(6, '0')}`);
    recordPrunedSets(dir, many, now);
    assert.equal(prunedSets(dir).size, 200);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
