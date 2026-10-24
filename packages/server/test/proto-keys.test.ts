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

test('finds the other ways to write the same first use', () => {
  const root = fixture(`
export function viaOr(m: Record<string, { n?: number }>, k: string) { const e = m[k] ?? (m[k] = {}); e.n = 1; }
export function viaOrOr(m: Record<string, { n?: number }>, k: string) { const e = m[k] || (m[k] = {}); e.n = 1; }
export function viaNot(m: Record<string, { n?: number }>, k: string) { if (!m[k]) m[k] = {}; m[k].n = 1; }
export function viaNotBlock(m: Record<string, { n?: number }>, k: string) { if (!m[k]) { m[k] = {}; } m[k].n = 1; }
export function viaUndefined(m: Record<string, { n?: number }>, k: string) { if (m[k] === undefined) m[k] = {}; m[k].n = 1; }
export function viaNew(m: Record<string, { n?: number }>, k: string) { (m[k] ??= new Object()); m[k].n = 1; }
export function viaNewOr(m: Record<string, { n?: number }>, k: string) { m[k] = m[k] ?? new Object(); }
`);
  try {
    assert.deepEqual(collectKeyedEntries(root).map((f) => f.fn), ['viaOr', 'viaOrOr', 'viaNot', 'viaNotBlock', 'viaUndefined', 'viaNew', 'viaNewOr']);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('the same forms are left alone on a map without a prototype or at a fixed key', () => {
  const root = fixture(`
export function safe(k: string) {
  const m: Record<string, { n?: number }> = Object.create(null);
  const e = m[k] ?? (m[k] = {});
  if (!m[k]) m[k] = {};
  if (m[k] === undefined) m[k] = {};
  (m[k] ??= new Object());
  const fixed: Record<string, { n?: number }> = {};
  if (!fixed['totals']) fixed['totals'] = {};
  const other: Record<string, number> = {};
  if (!other[k]) other[k] = 0;
  return e;
}
`);
  try { assert.deepEqual(collectKeyedEntries(root).map((f) => f.fn), []); }
  finally { rmSync(root, { recursive: true, force: true }); }
});

test('a map without a prototype in one function does not make a plain map of the same name safe in another', () => {
  const root = fixture(`
export function safe(keys: string[]) {
  const out: Record<string, { n?: number }> = Object.create(null);
  for (const k of keys) (out[k] ??= {}).n = 1;
  return out;
}
export function unsafe(keys: string[]) {
  const out: Record<string, { n?: number }> = {};
  for (const k of keys) (out[k] ??= {}).n = 1;
  return out;
}
export class Holder {
  private readonly seen: Record<string, { n?: number }> = Object.create(null);
  note(k: string) { (this.seen[k] ??= {}).n = 1; }
}
export function reassigned(keys: string[], seen: Record<string, { n?: number }>) {
  const wrapper = () => { for (const k of keys) (seen[k] ??= {}).n = 1; };
  wrapper();
}
`);
  try { assert.deepEqual(collectKeyedEntries(root).map((f) => f.fn), ['unsafe', 'reassigned/wrapper']); }
  finally { rmSync(root, { recursive: true, force: true }); }
});

test('an entry allows one occurrence: a second copy of an allowed line in a function is a new finding', () => {
  const root = fixture(`
export function twice(m: Record<string, object>, k: string) {
  (m[k] ??= {});
  (m[k] ??= {});
  return m;
}
`);
  try {
    const found = collectKeyedEntries(root);
    assert.equal(found.length, 2);
    assert.equal(found[0].hash, found[1].hash, 'the two lines are the same text');
    const one: KeyedWriteAllowance = { file: found[0].file, fn: found[0].fn, kind: found[0].kind, hash: found[0].hash, reason: 'The key is a number' };
    assert.equal(keyedEntryErrors(found, [one]).length, 1, 'one entry covers one of the two');
    assert.deepEqual(keyedEntryErrors(found, [one, { ...one }]), []);
    assert.equal(keyedEntryErrors(found, [one, { ...one }, { ...one }]).length, 1, 'a third entry matches nothing and is stale');
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
