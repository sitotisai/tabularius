// Card windows in a real browser: a script opens one at the size New Window gives, and a button on the card runs
// Move/Resize Window, which sizes and places the card as WebDirect does. The database is built here with no .fmp12.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, existsSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import type { Browser, Page } from 'playwright-core';
import type { LayoutObject } from '../../fmp12/src/index.ts';
import type { DesignOp } from '../../store/src/index.ts';
import { field, host, launch, signIn, skipUnless, until, window, type Hosted } from './harness.ts';

const skip = skipUnless();
let hosted: Hosted;
let browser: Browser;
const PASSWORD = 'ann-secret-1';
const OPEN = 920;
const GROW = 921;
let NAME = 0;
let stubDir: string | undefined;
const originalPath = process.env.PATH;


before(async () => {
  if (skip) return;
  stubDir = mkdtempSync(join(tmpdir(), 'tabularius-window-stubs-'));
  for (const command of ['launchctl', 'systemctl', 'sc', 'git', 'npm', 'curl', 'sudo']) {
    writeFileSync(join(stubDir, command), '#!/bin/sh\nprintf blocked > "${0%/*}/marker"\nexit 99\n', { mode: 0o755 });
  }
  process.env.PATH = `${stubDir}:${originalPath ?? ''}`;
  hosted = await host({ stores: ['Cards'] });
  const store = hosted.store('Cards');
  store.applyDesign([
    { op: 'createTable', name: 'Items', fields: [{ name: 'Name' }] },
    { op: 'createScript', name: 'Open Card', text: 'New Window [ Style: Card ; "Card" ; 200 ; 300 ; 40 ; 60 ]' },
    { op: 'createScript', name: 'Geometry', text: 'Exit Script [ Text Result: Get ( WindowTop ) & "," & Get ( WindowLeft ) & "," & Get ( WindowWidth ) & "," & Get ( WindowHeight ) ]' },
    { op: 'createScript', name: 'Grow', text: 'Move/Resize Window [ Current Window ; Height: 260 ; Width: 420 ; Top: 30 ]' },
  ] as DesignOp[]);
  const design = store.design('Items')!;
  NAME = design.objects.find((o) => o.kind === 'field' && o.field?.field === 'Name')!.id;
  const scriptId = (name: string) => store.schema.scripts.find((s) => s.name === name)!.id;
  const button = (id: number, left: number, text: string, script: string): LayoutObject => ({
    id, kind: 'button', type: 0, text, anchors: { left: true, top: true, right: false, bottom: false }, style: {},
    bounds: { top: 100, left, bottom: 124, right: left + 90 }, action: { stepId: 1, step: 'Perform Script', scriptId: scriptId(script), script },
  } as LayoutObject);
  const parts = design.parts.map((p) => p.kind === 'body' ? { ...p, height: 140 } : p);
  store.applyDesign([{ op: 'updateLayout', layout: 'Items', design: { view: 'form', parts, objects: [...design.objects, button(OPEN, 20, 'Open', 'Open Card'), button(GROW, 120, 'Grow', 'Grow'), { ...button(922, 20, 'Geometry', 'Geometry'), bounds: { left: 20, top: 50, right: 110, bottom: 74 } }] } }] as DesignOp[]);
  store.create('Items', { Name: 'one' });
  store.setPassword('Ann', PASSWORD, '[Full Access]');
  browser = await launch();
});
after(async () => {
  await browser?.close();
  await hosted?.close();
  process.env.PATH = originalPath;
  if (stubDir) {
    const blocked = existsSync(join(stubDir, 'marker'));
    rmSync(stubDir, { recursive: true, force: true });
    assert.equal(blocked, false, 'no service, install or network command may run');
  }
});

/** The card's frame: its size and its place in the window, in CSS pixels. */
const frame = (page: Page) => page.locator('.window-frame.window-card').evaluate((el: HTMLElement) =>
  [el.style.height, el.style.width, el.style.top, el.style.left].join(' '));

test('Move/Resize Window sizes and places a card window', { skip }, async () => {
  const page = await window(await browser.newContext({ viewport: { width: 1200, height: 900 } }));
  try {
    await signIn(page, hosted.url, 'Cards', 'Ann', PASSWORD);
    await until(() => field(page, NAME).inputValue(), (v) => v === 'one');
    await page.locator(`.fm[data-id="${OPEN}"]`).click();
    await until(() => frame(page), (v) => v === '200px 300px 40px 60px');
    // The card's own Grow button: taller, wider and higher up, at the same left.
    await page.locator(`.window-frame.window-card .fm[data-id="${GROW}"]`).click();
    await until(() => frame(page), (v) => v === '260px 420px 30px 60px');
    assert.deepEqual(page.errors, []);
  } finally {
    await page.context().close();
  }
});


// Written for A33; intentionally not run in the offline implementation session.
test('card gestures, keyboard, focus and engine geometry agree', { skip }, async () => {
  const page = await window(await browser.newContext({ viewport: { width: 1200, height: 900 }, hasTouch: true, reducedMotion: 'reduce' }));
  try {
    await signIn(page, hosted.url, 'Cards', 'Ann', PASSWORD);
    await page.locator(`.fm[data-id="${OPEN}"]`).click();
    const card = page.locator('.window-frame.window-card');
    const title = card.getByRole('button', { name: 'Move or resize Card', exact: true });
    await title.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Escape');
    assert.equal(await card.count(), 1);
    await until(() => frame(page), (v) => v === '210px 300px 40px 70px');
    await page.keyboard.press('Tab');
    assert.equal(await card.getByRole('button', { name: 'Close Card', exact: true }).evaluate((el) => el === document.activeElement), true);
    const bar = (await title.boundingBox())!;
    await page.mouse.move(bar.x + 60, bar.y + 20);
    await page.mouse.down();
    await page.mouse.move(bar.x + 90, bar.y + 40);
    await page.mouse.up();
    await until(() => frame(page), (v) => v === '210px 300px 60px 100px');
    const grip = (await card.locator('.window-grip-se').boundingBox())!;
    await page.mouse.move(grip.x + 6, grip.y + 6);
    await page.mouse.down();
    await page.mouse.move(grip.x + 46, grip.y + 36);
    await page.mouse.up();
    await until(() => frame(page), (v) => v === '240px 340px 60px 100px');
    const response = page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('/button'));
    await card.locator('.fm[data-id="922"]').click();
    const payload = await (await response).json();
    assert.equal(payload.response?.result ?? payload.result, '60,100,340,240', 'Get functions see the gesture geometry');
    // Real touch input exercises the same pointer-capture path as a finger on a tablet.
    const touch = await page.context().newCDPSession(page);
    const touchBar = (await title.boundingBox())!;
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: touchBar.x + 60, y: touchBar.y + 20 }] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: touchBar.x + 80, y: touchBar.y + 40 }] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await until(() => frame(page), (v) => v === '240px 340px 80px 120px');
    await touch.detach();
    await page.setViewportSize({ width: 280, height: 400 });
    await until(() => card.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const stage = el.parentElement!.getBoundingClientRect();
      return r.left >= stage.left && r.top >= stage.top && r.right <= stage.right && r.bottom <= stage.bottom;
    }), (inside) => inside);
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.evaluate(readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8'));
    const violations = await page.evaluate(async () => (await (window as any).axe.run('.window-frame.window-card', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
    })).violations.map((v: any) => v.id));
    assert.deepEqual(violations, []);
    assert.deepEqual(page.errors, []);
  } finally {
    await page.context().close();
  }
});
