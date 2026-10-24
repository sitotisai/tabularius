import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { TablePrivileges } from '../src/security/client.ts';

// The privilege set editor's per-field choices, for a field called __proto__: kept in the set, not dropped.

class ElementDouble {
  tagName: string;
  className = '';
  style: Record<string, string> = {};
  value = '';
  checked = false;
  children: (ElementDouble | string)[] = [];
  attrs = new Map<string, string>();
  listeners = new Map<string, ((event?: unknown) => unknown)[]>();
  constructor(tag: string) { this.tagName = tag.toUpperCase(); }
  setAttribute(name: string, value: string) { this.attrs.set(name, value); }
  append(...children: (ElementDouble | string)[]) { this.children.push(...children); }
  addEventListener(type: string, listener: (event?: unknown) => unknown) { this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]); }
  async fire(type: string) { await Promise.all((this.listeners.get(type) ?? []).map((listener) => listener())); }
  replaceChildren(...children: (ElementDouble | string)[]) { this.children = children; }
  get textContent(): string { return this.children.map((c) => typeof c === 'string' ? c : c.textContent).join(''); }
  querySelectorAll(selector: string): ElementDouble[] {
    const matches = (el: ElementDouble) => selector.startsWith('[aria-label="')
      ? el.attrs.get('aria-label') === selector.slice(13, -2)
      : selector.startsWith('.') ? el.className.split(/\s+/).includes(selector.slice(1))
      : el.tagName.toLowerCase() === selector.toLowerCase();
    return this.children.flatMap((child) => typeof child === 'string' ? [] : [...(matches(child) ? [child] : []), ...child.querySelectorAll(selector)]);
  }
  querySelector(selector: string): ElementDouble | null { return this.querySelectorAll(selector)[0] ?? null; }
}

test('choosing a level for a field called __proto__ keeps it in the set\'s table privileges', async () => {
  const prior = globalThis.document;
  const app = new ElementDouble('div');
  globalThis.document = { createElement: (tag: string) => new ElementDouble(tag), getElementById: () => app } as unknown as Document;
  const priorSessionStorage = globalThis.sessionStorage;
  globalThis.sessionStorage = { getItem: () => null } as unknown as Storage;
  try {
    const { tableEditor } = await import('../src/security/privilege-sets.ts');
    const table: TablePrivileges = { view: true, edit: true, create: false, delete: false };
    const editor = tableEditor(table, ['__proto__', 'Name'], { table: 'Items', sec: {} as never });
    const choose = async (field: string, level: string) => {
      const select = editor.querySelector(`[aria-label="Field ${field}"]`) as unknown as ElementDouble;
      select.value = level;
      await select.fire('change');
    };
    await choose('__proto__', 'none');
    await choose('Name', 'viewOnly');
    assert.deepEqual(Object.keys(table.fields!), ['__proto__', 'Name']);
    assert.equal(Object.getOwnPropertyDescriptor(table.fields!, '__proto__')?.value, 'none');
    await choose('__proto__', 'masked');
    assert.equal(Object.getOwnPropertyDescriptor(table.fields!, '__proto__')?.value, 'masked');
    assert.deepEqual(Object.keys(table.masks!), ['__proto__']);
    await choose('__proto__', 'modifiable');
    assert.deepEqual(Object.keys(table.fields!), ['Name']);
    assert.equal(table.masks, undefined);
  } finally { globalThis.document = prior; globalThis.sessionStorage = priorSessionStorage; }
});
