import { test } from 'node:test';
import assert from 'node:assert/strict';
import { windowControls } from '../src/window-controls.ts';

class Element {
  type = ''; className = ''; textContent = ''; title = '';
  attributes = new Map<string, string>();
  children: Element[] = [];
  listeners = new Map<string, ((e: any) => void)[]>();
  captures = new Set<number>();
  focused = false; removed = false;
  setAttribute(k: string, v: string) { this.attributes.set(k, v); }
  prepend(el: Element) { this.children.unshift(el); }
  append(el: Element) { this.children.push(el); }
  addEventListener(name: string, listener: (e: any) => void) { this.listeners.set(name, [...this.listeners.get(name) ?? [], listener]); }
  setPointerCapture(id: number) { this.captures.add(id); }
  hasPointerCapture(id: number) { return this.captures.has(id); }
  releasePointerCapture(id: number) { this.captures.delete(id); this.emit('lostpointercapture'); }
  focus() { this.focused = true; }
  remove() { this.removed = true; }
  emit(name: string, values = {}) {
    const e = { button: 0, pointerId: 1, clientX: 0, clientY: 0, prevented: false, stopped: false,
      preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; }, ...values };
    for (const fn of this.listeners.get(name) ?? []) fn(e);
    return e;
  }
}
test('mouse and touch gestures capture, clamp, cancel and clean up; keyboard has a named stop', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { createElement: () => new Element() } });
  try {
    for (const pointerType of ['mouse', 'touch']) {
      const frame = new Element();
      let rect = { left: 60, top: 40, width: 300, height: 200 };
      let enabled = true;
      const cleanup = windowControls(frame as unknown as HTMLElement, 'Card', () => rect,
        () => ({ width: 800, height: 600 }), (next) => { rect = next; }, () => enabled);
      const title = frame.children[0];
      assert.equal(title.type, 'button');
      assert.equal(title.attributes.get('aria-label'), 'Move or resize Card');
      assert.equal(frame.children.length, 9);
      assert.ok(frame.children.slice(1).every((el) => el.attributes.get('aria-hidden') === 'true'));
      title.emit('pointerdown', { pointerType });
      assert.equal(title.focused, true);
      title.emit('pointermove', { clientX: 30, clientY: 20 });
      assert.deepEqual(rect, { left: 90, top: 60, width: 300, height: 200 });
      const escape = title.emit('keydown', { key: 'Escape' });
      assert.equal(escape.stopped, true, 'Escape must not reach the card-close handler');
      assert.equal(title.captures.size, 0);
      title.emit('pointermove', { clientX: 500 });
      assert.equal(rect.left, 90);
      const corner = frame.children.find((el) => el.className.endsWith('-se'))!;
      corner.emit('pointerdown', { pointerType });
      corner.emit('pointermove', { clientX: 20, clientY: 30 });
      assert.equal(rect.width, 320);
      assert.equal(rect.height, 230);
      corner.emit('pointercancel');
      assert.equal(corner.captures.size, 0);
      const key = title.emit('keydown', { key: 'ArrowRight', shiftKey: true });
      assert.equal(key.prevented, true);
      assert.equal(rect.width, 330);
      enabled = false;
      title.emit('keydown', { key: 'ArrowRight' });
      title.emit('pointerdown', { pointerType });
      assert.equal(title.captures.size, 0);
      assert.equal(rect.left, 90);
      cleanup();
      assert.ok(frame.children.every((el) => el.removed));
    }
  } finally {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else Reflect.deleteProperty(globalThis, 'document');
  }
});
