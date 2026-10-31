import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';

let dir: string;
let store: Store;

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-extract-second-'));
  const path = join(dir, 't.sqlite');
  createStore(path);
  store = new Store(path, 'T');
  store.applyDesign([{ op: 'createTable', name: 'W', fields: [{ name: 'Name', type: 'text' }] }] as never);
  store.create('W', { Name: 'a' });
});

after(() => {
  store?.close();
  if (dir) rmSync(dir, { recursive: true, force: true });
});

const one = (query: string) => {
  const { sql, target } = store.calc.translateSQL(query);
  return target.select(sql, [], 100).rows[0][0];
};

test('EXTRACT SECOND retains the fraction while SECOND remains whole', () => {
  assert.equal(one("SELECT EXTRACT(SECOND FROM TIME '13:45:10.5')"), 10.5);
  assert.equal(one("SELECT EXTRACT(second FROM TIMESTAMP '2020-01-01 13:45:10.25')"), 10.25);
  assert.equal(one("SELECT EXTRACT ( SECOND FROM TIME '00:00:59.999')"), 59.999);
  assert.equal(one("SELECT SECOND(TIME '13:45:10.5')"), 10);
  assert.equal(one("SELECT SECOND(TIMESTAMP '2020-01-01 13:45:10.25')"), 10);
});

test('EXTRACT SECOND handles whole seconds, absent seconds and string literals', () => {
  assert.equal(one("SELECT EXTRACT(SECOND FROM TIME '13:45:10')"), 10);
  assert.equal(one("SELECT EXTRACT(SECOND FROM TIME '13:45:00')"), 0);
  assert.equal(one("SELECT EXTRACT(SECOND FROM DATE '2020-01-01')"), null);
  assert.equal(one('SELECT EXTRACT(SECOND FROM NULL)'), null);
  assert.equal(one("SELECT 'EXTRACT(SECOND FROM x)'"), 'EXTRACT(SECOND FROM x)');
});

test('other EXTRACT fields are unchanged', () => {
  assert.equal(one("SELECT EXTRACT(YEAR FROM DATE '2020-02-03')"), 2020);
  assert.equal(one("SELECT EXTRACT(MONTH FROM DATE '2020-02-03')"), 2);
  assert.equal(one("SELECT EXTRACT(DAY FROM DATE '2020-02-03')"), 3);
  assert.equal(one("SELECT EXTRACT(HOUR FROM TIME '13:45:10.5')"), 13);
  assert.equal(one("SELECT EXTRACT(MINUTE FROM TIME '13:45:10.5')"), 45);
});
