import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cloneKeyed, ownEntry, ownGet, ownSet } from '../src/own-keys.ts';
import type { PrivilegeSet, TablePrivileges } from '../src/security/client.ts';

// A portal (or a table, or a field) called __proto__ is a legal name. On a plain object it is the prototype: reading it gives
// Object.prototype, and writing through that reaches every object in the page.

const polluted = (...keys: string[]): string[] => {
  const found = keys.filter((k) => (({}) as Record<string, unknown>)[k] !== undefined);
  for (const k of found) delete (Object.prototype as Record<string, unknown>)[k];
  return found;
};

test('ownEntry makes the entry in the map, as the portal styles of a record are made on first use', () => {
  const record: { portalStyles?: Record<string, Record<string, Record<string, number[]>>> } = {};
  const rows = ownEntry<Record<string, Record<string, number[]>>>(record.portalStyles ??= {}, '__proto__', () => ({}));
  rows['7'] = { 'Orders::Item': [1] };
  assert.deepEqual(polluted('7'), []);
  assert.deepEqual(Object.keys(record.portalStyles), ['__proto__']);
  assert.equal(ownEntry(record.portalStyles, '__proto__', () => ({})), rows, 'the same entry the next time');
  assert.equal(ownGet(record.portalStyles, '__proto__')?.['7']['Orders::Item'][0], 1);
});

test('ownEntry for rows asked again later, as a portal\'s rows of an original record are gathered', () => {
  const portalData: Record<string, { recordId: string }[]> = {};
  const rows = ownEntry(portalData, '__proto__', () => []);
  rows.push({ recordId: '1' });
  assert.deepEqual(ownGet(portalData, '__proto__'), [{ recordId: '1' }]);
  assert.equal(ownGet(portalData, 'constructor'), undefined);
  assert.equal(ownGet({}, '__proto__'), undefined, 'Object.prototype is not an entry');
});

test('ownSet keeps an entry named __proto__, which a plain assignment turns into the prototype and loses', () => {
  const ids: Record<string, number[]> = {};
  ownSet(ids, '__proto__', [1, 2]);
  ownSet(ids, 'Orders', [3]);
  assert.deepEqual(Object.keys(ids), ['__proto__', 'Orders']);
  assert.deepEqual(JSON.parse(JSON.stringify(ids)).__proto__, [1, 2]);
  const lost: Record<string, number[]> = {};
  lost['__proto__'] = [1, 2];
  assert.deepEqual(Object.keys(lost), [], 'what ownSet avoids');
});

test('cloneKeyed copies without prototypes, so edits keyed by names keep a __proto__', () => {
  const set = cloneKeyed(JSON.parse('{"name":"Staff","records":{"view":true},"tables":{"__proto__":{"view":true,"fields":{"__proto__":"none"}}}}') as PrivilegeSet);
  assert.equal(Object.getPrototypeOf(set.tables), null);
  const table = Object.getOwnPropertyDescriptor(set.tables!, '__proto__')?.value as TablePrivileges;
  assert.equal(Object.getOwnPropertyDescriptor(table.fields!, '__proto__')?.value, 'none');
  (set.tables!['__proto__'] as TablePrivileges).fields!['__proto__'] = 'viewOnly';
  assert.equal(JSON.stringify(set), '{"name":"Staff","records":{"view":true},"tables":{"__proto__":{"view":true,"fields":{"__proto__":"viewOnly"}}}}');
});
