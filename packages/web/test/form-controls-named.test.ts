import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '../src');
const files = (dir: string): string[] => readdirSync(dir).flatMap((n) => statSync(join(dir, n)).isDirectory() ? files(join(dir, n)) : n.endsWith('.ts') ? [join(dir, n)] : []);
const NAMED_ELSEWHERE: Record<string, string> = {
  'assistant.ts:box': 'off-screen copy textarea is aria-hidden',
  'showcase-pages/shared.ts:ta': 'off-screen copy textarea is aria-hidden',
  'layout.ts:picker': 'date picker is aria-hidden; visible field is named',
  'layout.ts:sel': 'layout builder assigns its spoken name after construction',
  'design/dom.ts:s': 'select helper receives caller attributes',
};

function scan(src: string, file: string) {
  const vars = new Map<string, { line: number; attrs: string; kind: string }>();
  const pattern = /(?:const|let|var)\s+(\w+)\s*=\s*(h\('(input|textarea|select)'\s*,|select\s*\()/g;
  for (const m of src.matchAll(pattern)) {
    const name = m[1];
    let i = m.index! + m[0].length, depth = 1, quote = '', attrs = '';
    while (i < src.length && depth) {
      const c = src[i++];
      if (quote) { if (c === '\\') i++; else if (c === quote) quote = ''; continue; }
      if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
      if (c === '(' || c === '{' || c === '[') depth++;
      if (c === ')' || c === '}' || c === ']') depth--;
    }
    attrs = src.slice(m.index! + m[0].length, i);
    const kind = m[2].startsWith('h(') ? m[3] : 'select';
    vars.set(name, { line: src.slice(0, m.index).split('\n').length, attrs, kind });
  }
  const bad: string[] = [], seen: string[] = [];
  for (const [name, control] of vars) {
    const key = `${file}:${name}`;
    seen.push(key);
    if (/hidden:\s*''|type:\s*'hidden'|type:\s*'file'/.test(control.attrs)) continue;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const later = src.slice(src.indexOf('\n', src.indexOf(name)) + 1);
    const id = /\bid:\s*['"]([^'"]+)/.exec(control.attrs)?.[1];
    const named = /['"]aria-label(?:ledby)?['"]\s*:/.test(control.attrs)
      || new RegExp(`(?:field|check|row)\\([^\\n]*\\b${escaped}\\b|h\\('label'[^\\n]*\\b${escaped}\\b|${escaped}\\.setAttribute\\(['"]aria-label['"]|${escaped}\\.(?:id|ariaLabel)\\s*=`).test(later)
      || (later.includes(`return ${name};`) && later.includes('field('))
      || (id !== undefined && src.includes(`'for': '${id}'`));
    if (!named && !NAMED_ELSEWHERE[key]) bad.push(`${file}:${control.line} ${name} (${control.kind})`);
  }
  return { bad, seen };
}

test('web client form controls are named', () => {
  const sample = `const named = h('input', { 'aria-label': 'A' });\nconst unnamed = h('input', { placeholder: 'only' });\nconst wrapped = select('x', {}, { 'aria-label': 'C' });\nconst templated = h('select', { title: \`${'${a > b ? \'x\' : \'y\'}'}\` });`;
  assert.deepEqual(scan(sample, 'sample.ts').bad, ['sample.ts:2 unnamed (input)', 'sample.ts:4 templated (select)']);
  const bad: string[] = [], seen: string[] = [];
  for (const file of files(root)) {
    const result = scan(readFileSync(file, 'utf8'), relative(root, file));
    bad.push(...result.bad); seen.push(...result.seen);
  }
  assert.ok(seen.length > 200, `expected >200 controls, saw ${seen.length}`);
  for (const key of Object.keys(NAMED_ELSEWHERE)) assert.ok(seen.includes(key), `stale exception: ${key}`);
  assert.deepEqual(bad, []);
});
