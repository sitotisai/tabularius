import { changeWindow, keyWindow, type WindowArea, type WindowEdge, type WindowRect } from './window-geometry.ts';

/** Pointer capture handles both mouse and touch without listeners on the document. */
export function windowControls(frame: HTMLElement, name: string, read: () => WindowRect,
  area: () => WindowArea, write: (rect: WindowRect) => void, enabled: () => boolean): () => void {
  const title = document.createElement('button');
  title.type = 'button';
  title.className = 'window-title';
  title.textContent = name;
  title.setAttribute('aria-label', `Move or resize ${name}`);
  title.setAttribute('aria-description', 'Arrow keys move; Shift and arrow keys resize; Escape ends. Drag the title to move.');
  title.title = 'Arrow keys move; Shift + arrow keys resize; Escape ends';
  frame.prepend(title);
  const controls: HTMLElement[] = [title];
  let drag: { el: HTMLElement; id: number; x: number; y: number; rect: WindowRect; edge: WindowEdge } | undefined;
  const end = () => {
    const previous = drag;
    drag = undefined;
    if (previous?.el.hasPointerCapture(previous.id)) previous.el.releasePointerCapture(previous.id);
  };
  const bind = (el: HTMLElement, edge: WindowEdge) => {
    el.addEventListener('pointerdown', (e) => {
      if (!enabled() || e.button !== 0 || drag) return;
      e.preventDefault();
      title.focus();
      drag = { el, id: e.pointerId, x: e.clientX, y: e.clientY, rect: read(), edge };
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      if (!enabled()) { end(); return; }
      write(changeWindow(drag.rect, drag.edge, e.clientX - drag.x, e.clientY - drag.y, area()));
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(event, end);
  };
  bind(title, 'move');
  for (const edge of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const) {
    const grip = document.createElement('span');
    grip.className = `window-grip window-grip-${edge}`;
    grip.setAttribute('aria-hidden', 'true');
    frame.append(grip);
    controls.push(grip);
    bind(grip, edge);
  }
  title.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      end();
      return;
    }
    if (!enabled() || e.altKey || e.ctrlKey || e.metaKey) return;
    const next = keyWindow(read(), e.key, e.shiftKey, area());
    if (next) { e.preventDefault(); e.stopPropagation(); end(); write(next); }
  });
  title.addEventListener('blur', end);
  return () => { end(); controls.forEach((el) => el.remove()); };
}
