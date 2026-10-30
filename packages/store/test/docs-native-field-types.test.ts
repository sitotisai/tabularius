// docs/native-field-types.md lists the five field types only native files have and how each is stored. These checks fail when
// the page and the code stop agreeing on which types they are or on their stored column types.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, NATIVE_FIELD_TYPES, Store } from '../src/index.ts';
import { SQL_TYPES } from '../src/import.ts';

const root = join(import.meta.dirname, '..', '..', '..');
const page = readFileSync(join(root, 'docs', 'native-field-types.md'), 'utf8');
const section = page.slice(page.indexOf('## Field types'));
const rows = [...section.matchAll(/^\| (\w+) \| `(\w+)`, ([^|]*) \|/gm)].map((m) => ({ type: m[1], column: m[2] }));

test('the page has one table row for each native field type, in the order the code lists them', () => {
  assert.deepEqual(rows.map((r) => r.type), [...NATIVE_FIELD_TYPES]);
});

test('the stored column type each row names is the one the code creates', () => {
  assert.ok(rows.length >= 5);
  for (const { type, column } of rows) assert.equal(SQL_TYPES[type as keyof typeof SQL_TYPES], column, `${type} is stored as ${SQL_TYPES[type as keyof typeof SQL_TYPES]}, the page says ${column}`);
});

test('the sentence before the table counts the types correctly', () => {
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  assert.match(section, new RegExp(`These ${words[NATIVE_FIELD_TYPES.length]} types are available only in native files`));
});

test('the limits the page states are the ones the code enforces, one value inside and one outside each', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-native-docs-'));
  const path = join(dir, 'native.sqlite');
  createStore(path, { mode: 'native' });
  const store = new Store(path, 'native');
  t.after(() => store.close());
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Count', type: 'integer' }, { name: 'Price', type: 'decimal' }, { name: 'Payload', type: 'json' }] }]);
  const number = (re: RegExp): number => Number((re.exec(section)?.[1] ?? 'x').replaceAll(',', ''));
  const safe = number(/±([\d,]+)\)/);
  const [integerDigits, fractionDigits] = [number(/at most (\d+) integer digits/), number(/and (\d+) fractional digits/)];
  assert.equal(safe, Number.MAX_SAFE_INTEGER);
  assert.ok(integerDigits >= 1 && fractionDigits >= 1, 'the page states both decimal limits');
  const refused = (field: string, value: string): boolean => { try { store.create('Items', { [field]: value }); return false; } catch { return true; } };
  assert.equal(refused('Count', String(safe)), false);
  assert.equal(refused('Count', String(BigInt(safe) + 2n)), true);
  assert.equal(refused('Price', `${'9'.repeat(integerDigits)}.${'1'.repeat(fractionDigits)}`), false);
  assert.equal(refused('Price', `${'9'.repeat(integerDigits + 1)}`), true);
  assert.equal(refused('Price', `1.${'1'.repeat(fractionDigits + 1)}`), true);
  assert.match(section, /values over 1 MiB in UTF-8/);
  const pad = (bytes: number): string => JSON.stringify({ a: 'x'.repeat(bytes - 8) });
  assert.equal(Buffer.byteLength(pad(1024 * 1024)), 1024 * 1024);
  assert.equal(refused('Payload', pad(1024 * 1024)), false);
  assert.equal(refused('Payload', pad(1024 * 1024 + 1)), true);
});
