import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pageCall, type PageHost } from '../next/page-calls.ts';
import type { MenuItem } from '../src/types.ts';

function setup() {
  const calls: unknown[] = [];
  const item = (name: string, extra: Partial<MenuItem> = {}): MenuItem => ({ id: 1, name, kind: 'item', depth: 0, open: true, ...extra });
  const menu = { database: 'Synthetic', layouts: [
    item('Page'), item('People'), item('Denied', { open: false }), item('Hidden', { hidden: true }),
    item('Folder', { kind: 'folder', hidden: true }), item('Inside', { depth: 1 }),
    item('End', { kind: 'folder-end' }), item('Other'),
  ], printing: undefined as false | undefined };
  const host: PageHost = {
    api: {
      db: 'Synthetic', menu: async () => menu,
      valueList: async (layout, name) => { calls.push([layout, name]); return { values: ['a'], labels: ['Alpha'] }; },
      records: async () => { throw new Error('unexpected'); }, record: async () => { throw new Error('unexpected'); },
      create: async () => { throw new Error('unexpected'); }, update: async () => { throw new Error('unexpected'); },
      remove: async () => { throw new Error('unexpected'); }, summarize: async () => { throw new Error('unexpected'); },
    }, layout: 'Page', runScript: async () => {},
    goToLayout: async (name) => { calls.push(name); }, print: async () => { calls.push('printed'); },
  };
  return { host, menu, calls };
}

test('layouts exposes only open, listed items, excluding hidden folders and their children', async () => {
  const { host } = setup();
  assert.deepEqual(await pageCall(host, 'layouts', []), ['Page', 'People', 'Other']);
  host.layout = 'Hidden';
  assert.deepEqual(await pageCall(host, 'layouts', []), ['Page', 'People', 'Hidden', 'Other']);
});

test('goToLayout checks the same menu before navigating and returns null', async () => {
  const { host, calls } = setup();
  assert.equal(await pageCall(host, 'goToLayout', ['People']), null);
  for (const name of ['Denied', 'Hidden', 'Inside', 'Missing']) {
    await assert.rejects(pageCall(host, 'goToLayout', [name]), /There is no layout/);
  }
  await assert.rejects(pageCall(host, 'goToLayout', ['']), /The layout is missing/);
  assert.deepEqual(calls, ['People']);
});

test('valueList uses the current page layout and preserves labels and API denials', async () => {
  const { host, calls } = setup();
  assert.deepEqual(await pageCall(host, 'valueList', ['Choices']), { values: ['a'], labels: ['Alpha'] });
  assert.deepEqual(calls, [['Page', 'Choices']]);
  await assert.rejects(pageCall(host, 'valueList', ['']), /The value list is missing/);
  host.api.valueList = async () => { throw new Error('Access denied'); };
  await assert.rejects(pageCall(host, 'valueList', ['Choices']), /Access denied/);
});

test('print checks the account permission before invoking the browser callback', async () => {
  const { host, menu, calls } = setup();
  assert.equal(await pageCall(host, 'print', []), null);
  menu.printing = false;
  await assert.rejects(pageCall(host, 'print', []), /isn't allowed to print/);
  host.api.menu = async () => { throw new Error('Session ended'); };
  await assert.rejects(pageCall(host, 'print', []), /Session ended/);
  assert.deepEqual(calls, ['printed']);
});

test('navigation rechecks the menu and propagates failures without falling back to another layout', async () => {
  const { host, menu, calls } = setup();
  await pageCall(host, 'goToLayout', ['People']);
  menu.layouts.find((m) => m.name === 'People')!.open = false;
  await assert.rejects(pageCall(host, 'goToLayout', ['People']), /There is no layout/);
  host.goToLayout = async () => { throw new Error('Opening this layout is not supported in /next/; use /app/.'); };
  await assert.rejects(pageCall(host, 'goToLayout', ['Other']), /not supported in \/next\//);
  host.api.menu = async () => { throw new Error('Session ended'); };
  await assert.rejects(pageCall(host, 'layouts', []), /Session ended/);
  await assert.rejects(pageCall(host, 'goToLayout', ['Page']), /Session ended/);
  assert.deepEqual(calls, ['People']);
});

test('other unsupported methods keep the explicit next-client limitation', async () => {
  const { host } = setup();
  await assert.rejects(pageCall(host, 'unknown', []), /unknown is not supported in \/next\/; use \/app\//);
});
