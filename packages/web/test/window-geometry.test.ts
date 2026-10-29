import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampWindow, changeWindow, keyWindow } from '../src/window-geometry.ts';

const area = { width: 800, height: 600 };
const rect = { left: 60, top: 40, width: 300, height: 200 };
test('movement stays inside the stage, below the menu, with a gutter', () => {
  assert.deepEqual(changeWindow(rect, 'move', -900, 900, area), { ...rect, left: 16, top: 384 });
});
test('oversized cards and very small viewports never overflow or get negative sizes', () => {
  assert.deepEqual(clampWindow({ left: -1, top: -1, width: 900, height: 900 }, area), { left: 16, top: 16, width: 768, height: 568 });
  const tiny = clampWindow(rect, { width: 20, height: 10 });
  assert.deepEqual(tiny, { left: 0, top: 0, width: 20, height: 10 });
});
test('each edge and corner resizes while keeping the opposite edge fixed', () => {
  for (const edge of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const) {
    const next = changeWindow(rect, edge, 10, 10, area);
    assert.equal(next.left, edge.includes('w') ? 70 : 60);
    assert.equal(next.top, edge.includes('n') ? 50 : 40);
    assert.equal(next.width, edge.includes('w') ? 290 : edge.includes('e') ? 310 : 300);
    assert.equal(next.height, edge.includes('n') ? 190 : edge.includes('s') ? 210 : 200);
  }
  assert.deepEqual(changeWindow(rect, 'nw', 900, 900, area), { left: 310, top: 190, width: 50, height: 50 });
  assert.deepEqual(changeWindow(rect, 'nw', -900, -900, area), { left: 16, top: 16, width: 344, height: 224 });
});
test('arrows move by ten pixels; shift arrows resize; other keys do nothing', () => {
  assert.deepEqual(keyWindow(rect, 'ArrowRight', false, area), { ...rect, left: 70 });
  assert.deepEqual(keyWindow(rect, 'ArrowUp', false, area), { ...rect, top: 30 });
  assert.deepEqual(keyWindow(rect, 'ArrowLeft', true, area), { ...rect, width: 290 });
  assert.deepEqual(keyWindow(rect, 'ArrowDown', true, area), { ...rect, height: 210 });
  assert.equal(keyWindow(rect, 'Escape', false, area), undefined);
});
