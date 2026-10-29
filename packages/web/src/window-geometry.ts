/** Browser card geometry in CSS pixels relative to the stage below the menu.
 * Interactive increments are a Tabularius choice; parity with desktop window gestures is unverified.
 */
export interface WindowRect { left: number; top: number; width: number; height: number }
export interface WindowArea { width: number; height: number }
export type WindowEdge = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
const limit = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));
function bounds(area: WindowArea) {
  const x = area.width >= 82 ? 16 : 0;
  const y = area.height >= 82 ? 16 : 0;
  return { x, y, right: Math.max(x, area.width - x), bottom: Math.max(y, area.height - y) };
}
export function clampWindow(rect: WindowRect, area: WindowArea): WindowRect {
  const b = bounds(area);
  const width = limit(rect.width, Math.min(50, b.right - b.x), b.right - b.x);
  const height = limit(rect.height, Math.min(50, b.bottom - b.y), b.bottom - b.y);
  return { left: limit(rect.left, b.x, b.right - width), top: limit(rect.top, b.y, b.bottom - height), width, height };
}
export function changeWindow(rect: WindowRect, edge: WindowEdge, dx: number, dy: number, area: WindowArea): WindowRect {
  const r = clampWindow(rect, area);
  if (edge === 'move') return clampWindow({ ...r, left: r.left + dx, top: r.top + dy }, area);
  const b = bounds(area);
  let right = r.left + r.width;
  let bottom = r.top + r.height;
  const minW = Math.min(50, r.width), minH = Math.min(50, r.height);
  if (edge.includes('w')) r.left = limit(r.left + dx, b.x, right - minW);
  if (edge.includes('n')) r.top = limit(r.top + dy, b.y, bottom - minH);
  if (edge.includes('e')) right = limit(right + dx, r.left + minW, b.right);
  if (edge.includes('s')) bottom = limit(bottom + dy, r.top + minH, b.bottom);
  return { ...r, width: right - r.left, height: bottom - r.top };
}
export function keyWindow(rect: WindowRect, key: string, shift: boolean, area: WindowArea): WindowRect | undefined {
  const delta: Record<string, [number, number]> = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] };
  const d = delta[key];
  return d ? changeWindow(rect, shift ? 'se' : 'move', ...d, area) : undefined;
}
