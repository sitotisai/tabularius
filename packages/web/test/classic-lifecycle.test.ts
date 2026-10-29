import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
const source = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');

test('#155 lock refusal without a change does not poison the next edit', async () => {
  const method = source.slice(source.indexOf('  private editStart('), source.indexOf('  private viewersAsked'));
  const context = { LockedError: class extends Error {}, document: { activeElement: { blur() {} } }, toast() {} };
  const C = vm.runInNewContext(stripTypeScriptTypes(`(class { ${method} })`), context);
  const s = new C();
  const refused = new Set();
  Object.assign(s, { mode: 'browse', meta: { layout: { name: 'Test' } }, recordAt: () => ({ recordId: '1' }), refused,
    locks: { holds: () => false, acquire: () => Promise.reject(new context.LockedError()) }, render() {} });
  s.editStart({});
  await Promise.resolve();
  assert.equal(refused.size, 0);
});

test('#150 pagehide and beforeunload flush the focused field', () => {
  for (const event of ['pagehide', 'beforeunload']) {
    assert.match(source, new RegExp(`addEventListener\\('${event}',[^]*?pageHandlers\\?\\.flush\\(`));
  }
});

test('#150 unload dispatches change while the focused record is available and resets its mode', () => {
  const method = source.slice(source.indexOf('  private flushLeaving('), source.indexOf('\n  save(key:'));
  class Input extends EventTarget { value = 'typed'; dataset = { shown: 'old' }; }
  const active = new Input();
  const C = vm.runInNewContext(stripTypeScriptTypes(`(class { ${method} })`), { document: { activeElement: active }, Event, HTMLInputElement: Input, HTMLTextAreaElement: Input });
  const s = new C();
  Object.assign(s, { content: { contains: () => true }, unsaved: new Map(), leavingWrites: 0, pendingSaves: 0, leavingFailed: new Set() });
  active.addEventListener('change', () => { assert.equal(s.leaving, true); s.leavingWrites++; });
  assert.equal(s.flushLeaving(), true);
  assert.equal(s.leaving, false);
  active.dataset.shown = active.value;
  s.leavingWrites = 0;
  assert.equal(s.flushLeaving(), false, 'unchanged fields do not dispatch change');
  s.pendingSaves = 1;
  assert.equal(s.flushLeaving(), true, 'queued portal and offline saves still warn');
});

test('#150 focused field uses an immediate conditional keepalive write', async (t) => {
  const { Api } = await import('../src/api.ts');
  let request: RequestInit | undefined;
  t.mock.method(globalThis, 'fetch', async (_url: string | URL | Request, options?: RequestInit) => {
    request = options;
    return Response.json({ messages: [{ code: '0' }], response: { modId: '2' } });
  });
  const api = new Api('Synthetic', 'session');
  const pending = api.flushUpdate('Layout', '1', { Text: 'typed' }, '1');
  assert.equal(request?.keepalive, true, 'fetch starts before returning to the lifecycle event');
  assert.deepEqual(JSON.parse(String(request?.body)), { fieldData: { Text: 'typed' }, modId: '1' });
  assert.equal(await pending, '2');
});

test('#150 small writes already started use keepalive; large ordinary edits retain normal fetch', async (t) => {
  const { Api } = await import('../src/api.ts');
  const requests: RequestInit[] = [];
  t.mock.method(globalThis, 'fetch', async (_url: string | URL | Request, options?: RequestInit) => {
    requests.push(options!);
    return Response.json({ messages: [{ code: '0' }], response: { modId: '2' } });
  });
  const api = new Api('Synthetic', 'session');
  await api.update('Layout', '1', { Text: 'small' });
  await api.update('Layout', '1', { Text: 'large'.repeat(14_000) });
  assert.deepEqual(requests.map((r) => r.keepalive), [true, false]);
});
