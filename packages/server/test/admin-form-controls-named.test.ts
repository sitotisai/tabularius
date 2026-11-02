import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const scan = (html: string, file: string) => {
  const safe = html.replace(/\$\{[^}]*\}/g, 'INTERPOLATION');
  const tags = [...safe.matchAll(/<(input|select|textarea)\b[^>]*>/gi)];
  const labels = [...safe.matchAll(/<label\b([^>]*)>/gi)].map((m) => ({
    attrs: m[1], start: m.index!, end: safe.indexOf('</label>', m.index! + m[0].length),
  }));
  const bad: string[] = [];
  for (const m of tags) {
    const tag = m[0];
    if (/\btype\s*=\s*["']?(?:hidden|submit|button)\b/i.test(tag)) continue;
    const id = /\bid\s*=\s*["']([^"']+)/i.exec(tag)?.[1];
    const named = /\baria-label(?:ledby)?\s*=/i.test(tag)
      || (id !== undefined && labels.some((l) => new RegExp(`\\bfor\\s*=\\s*["']${id.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}["']`, 'i').test(l.attrs)))
      || labels.some((l) => l.start < m.index! && l.end > m.index!);
    if (!named) bad.push(`${file}:${safe.slice(0, m.index).split('\n').length} ${m[0]}`);
  }
  return { bad, count: tags.length };
};

test('admin form controls are named', () => {
  const sample = `<label for="a">A</label><input id="a"><input placeholder="only"><label><select></select></label><select data-x="${'${a > b ? \'x\' : \'y\'}'}"></select>`;
  assert.deepEqual(scan(sample, 'sample').bad, ['sample:1 <input placeholder="only">', 'sample:1 <select data-x="INTERPOLATION">']);
  const file = join(import.meta.dirname, '../admin/index.html');
  const result = scan(readFileSync(file, 'utf8'), file);
  assert.ok(result.count > 100, `expected >100 controls, saw ${result.count}`);
  assert.deepEqual(result.bad, []);
});
