import { test } from 'node:test';
import assert from 'node:assert/strict';
import { confirmsComposition, enterActivates } from '../src/ime.ts';

const composing = { key: 'Enter', shiftKey: false, isComposing: true };

test('composition confirmation is detected by the standard and Safari signals', () => {
  assert.equal(confirmsComposition(composing), true);
  assert.equal(confirmsComposition({ keyCode: 229 }), true);
  assert.equal(confirmsComposition({ keyCode: 13 }), false);
});

test('all Enter handlers ignore composition confirmation', () => {
  // Assistant question, find criteria, dashboard Add field and report Ask AI.
  assert.equal(enterActivates(composing), false);
  assert.equal(enterActivates(composing), false);
  assert.equal(enterActivates(composing), false);
  assert.equal(enterActivates(composing, true), false);
  assert.equal(enterActivates({ key: 'Enter', shiftKey: false }), true);
  assert.equal(enterActivates({ key: 'Enter', shiftKey: true }), false);
  assert.equal(enterActivates({ key: 'Enter', shiftKey: true }, true), true);
});

test('#156 record editors guard every Enter activation against composition', async () => {
  const { readFileSync } = await import('node:fs');
  for (const path of ['../src/layout.ts', '../src/main.ts', '../next/main.ts', '../next/palette.ts']) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /(?:\be|\bk|\(e as KeyboardEvent\))\.key === 'Enter'/, path);
  }
});

test('#156 layout field does not blur on either IME Enter signal', async () => {
  const { readFileSync } = await import('node:fs');
  const { stripTypeScriptTypes } = await import('node:module');
  const { default: vm } = await import('node:vm');
  const source = readFileSync(new URL('../src/layout.ts', import.meta.url), 'utf8');
  const method = source.slice(source.indexOf('  private bindSave('), source.indexOf('  private renderContainer('));
  let blurs = 0;
  class Input extends EventTarget { value = ''; dataset = {}; blur() { blurs++; } }
  const C = vm.runInNewContext(stripTypeScriptTypes(`(class { ${method} })`), { HTMLInputElement: Input, enterActivates });
  const input = new Input();
  new C().bindSave(input, '', () => {});
  for (const properties of [{ key: 'Enter', isComposing: true }, { key: 'Enter', keyCode: 229 }, { key: 'Enter' }]) {
    input.dispatchEvent(Object.assign(new Event('keydown'), properties));
  }
  assert.equal(blurs, 1);
});
