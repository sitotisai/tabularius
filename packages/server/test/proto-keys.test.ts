import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { collectKeyedEntries, keyedEntryErrors, type KeyedWriteAllowance } from '../../../scripts/proto-keys.ts';

// The scan behind the prototype-pollution fixes (scripts/proto-keys.ts): `(map[name] ??= {})[x] = v` on a plain object.

function fixture(source: string) {
  const root = mkdtempSync(join(tmpdir(), 'proto-keys-'));
  mkdirSync(join(root, 'packages/store/src'), { recursive: true });
  writeFileSync(join(root, 'packages/store/src/probe.ts'), source);
  return root;
}

test('finds an entry made on first use in a plain object keyed by a variable', () => {
  const root = fixture(`
export function paging(keys: string[]) {
  const out: Record<string, { limit?: number }> = {};
  for (const k of keys) (out[k] ??= {}).limit = 1;
  return out;
}
export function either(keys: string[]) {
  const out: Record<string, Record<string, number>> = {};
  for (const k of keys) { out[k] = out[k] || {}; out[k].n = 1; }
  const more: Record<string, Record<string, number>> = {};
  for (const k of keys) (more[k] ||= {}).n = 1;
  return [out, more];
}
`);
  try {
    const found = collectKeyedEntries(root);
    assert.deepEqual(found.map((f) => [f.fn, f.kind]), [['paging', 'keyed-object-entry'], ['either', 'keyed-object-entry'], ['either', 'keyed-object-entry']]);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('leaves maps without a prototype, fixed keys, arrays and Maps alone', () => {
  const root = fixture(`
import { ownKeyed } from './own-keys.ts';
export function safe(keys: string[], rec: { styles?: Record<string, Record<string, number>> }) {
  const a: Record<string, Record<string, number>> = Object.create(null);
  const b = ownKeyed<Record<string, number>>({});
  const c: Record<string, number[]> = {};
  const d = new Map<string, Record<string, number>>();
  const fixed: Record<string, Record<string, number>> = {};
  for (const k of keys) {
    (a[k] ??= {}).n = 1;
    (b[k] ??= {}).n = 1;
    (c[k] ??= []).push(1);
    if (!d.has(k)) d.set(k, {});
    (fixed['totals'] ??= {})[k] = 1;
    ((rec.styles ??= Object.create(null))[k] ??= {}).n = 1;
  }
}
`);
  try { assert.deepEqual(collectKeyedEntries(root), []); }
  finally { rmSync(root, { recursive: true, force: true }); }
});

test('an allow-list entry needs a reason, and one that no longer matches is stale', () => {
  const root = fixture('export function f(k: string) { const m: Record<string, object> = {}; (m[k] ??= {}); return m; }\n');
  try {
    const found = collectKeyedEntries(root);
    assert.equal(found.length, 1);
    assert.equal(keyedEntryErrors(found, []).length, 1);
    const allowed: KeyedWriteAllowance[] = [{ file: found[0].file, fn: found[0].fn, kind: found[0].kind, hash: found[0].hash, reason: 'The key is a number' }];
    assert.deepEqual(keyedEntryErrors(found, allowed), []);
    assert.equal(keyedEntryErrors(found, [{ ...allowed[0], reason: ' ' }]).length, 1);
    assert.equal(keyedEntryErrors([], allowed).length, 1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('every keyed-object entry in packages/*/src is made safe or allowed with a reason', () => {
  const root = resolve(import.meta.dirname, '../../..');
  const path = join(root, 'scripts/proto-keys-allowlist.json');
  const allowed = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) as KeyedWriteAllowance[] : [];
  assert.deepEqual(keyedEntryErrors(collectKeyedEntries(root), allowed), []);
});
