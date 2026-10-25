// The store accepts dates to year 9999 (file reader, CSV import, pgwire, OData). Calculations over them must read, store and sort
// them as they always did; only dates a calculation builds are held to FileMaker's 1/1/0001 to 12/31/4000.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';

test('unstored and stored calculations and sorts keep dates past year 4000', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-late-dates-'));
  const path = join(dir, 'Late.openhbam.sqlite');
  createStore(path);
  const store = new Store(path, 'Late');
  try {
    store.applyDesign([
      { op: 'createTable', name: 'T', fields: [{ name: 'Day', type: 'date' }, { name: 'Note' }, { name: 'When', type: 'timestamp' }] },
      { op: 'createField', table: 'T', name: 'YearOf', type: 'number', kind: 'calculation', calculation: 'Year ( Day )', options: { unstored: true } },
      { op: 'createField', table: 'T', name: 'Same', type: 'date', kind: 'calculation', calculation: 'Day', options: { unstored: true } },
      { op: 'createField', table: 'T', name: 'Copy', type: 'date', kind: 'calculation', calculation: 'Day & Left ( Note ; 0 )' },
      { op: 'createField', table: 'T', name: 'CopyTs', type: 'timestamp', kind: 'calculation', calculation: 'When & Left ( Note ; 0 )' },
      { op: 'createField', table: 'T', name: 'Before', type: 'date', kind: 'calculation', calculation: 'Day - 1 + Length ( Note ) * 0' },
    ] as never);
    const days = ['2020-01-01', '9999-12-31', '4001-01-01', '4000-12-31', '1999-06-30'];
    store.sql.exec(`INSERT INTO T (_fm_record_id, _fm_mod_id, Day, "When") VALUES ${days.map((d, i) => `(${i + 1}, 0, '${d}', '${d}T08:00:00')`).join(',')}`);
    for (let i = 1; i <= days.length; i++) store.update('T', i, { Note: 'x' });
    const row = (i: number) => store.get('T', i, 'iso').fieldData;
    for (const [i, iso] of [[2, '9999-12-31'], [3, '4001-01-01'], [4, '4000-12-31'], [1, '2020-01-01']] as const) {
      const r = row(i);
      assert.equal(r.Day, iso);
      assert.equal(r.YearOf, Number(iso.slice(0, 4)), `Year ( Day ) of ${iso}`);
      assert.equal(r.Same, iso, `unstored Day of ${iso}`);
      assert.equal(r.Copy, iso, `stored date calculation of ${iso}`);
      assert.equal(r.CopyTs, `${iso}T08:00:00`, `stored timestamp calculation of ${iso}`);
    }
    // Arithmetic on a date the store already holds past 4000 gives what it gave before.
    assert.equal(row(2).Before, '9999-12-30');
    assert.equal(row(3).Before, '4000-12-31');
    const ids = store.findIds('T');
    const order = [5, 1, 4, 3, 2];
    assert.deepEqual(store.sortIds('T', ids, [{ fieldName: 'Day', sortOrder: 'ascend' }]), order);
    assert.deepEqual(store.sortIds('T', ids, [{ fieldName: 'Same', sortOrder: 'ascend' }]), order);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an invalid number result is stored as nothing in a date or timestamp field; a text "?" result is stored as it was', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-invalid-dates-'));
  const path = join(dir, 'Invalid.openhbam.sqlite');
  createStore(path);
  const store = new Store(path, 'Invalid');
  // [name, field type, calculation, stored]: an invalid number (an out-of-range date) is nothing; text stays text, as FileMaker keeps it.
  const fields: [string, string, string, string | null][] = [
    ['DText', 'date', 'Date ( 1 ; 1 ; 5000 ) & Left ( Note ; 0 )', '?'],
    ['DPlus', 'date', 'Date ( 1 ; 1 ; 5000 ) + Length ( Note ) * 0', null],
    ['DNumber', 'date', '3000000 + Length ( Note ) * 0', null],
    ['DLate', 'date', 'Day + 1 + Length ( Note ) * 0', null],
    ['TsDate', 'timestamp', 'Timestamp ( Date ( 1 ; 1 ; 5000 ) ; Length ( Note ) )', null],
    ['TsText', 'timestamp', 'Timestamp ( Date ( 1 ; 1 ; 5000 ) ; 0 ) & Left ( Note ; 0 )', '?'],
    ['TmDate', 'time', 'GetAsTime ( Date ( 1 ; 1 ; 5000 ) ) & Left ( Note ; 0 )', null],
    ['TextOf', 'text', 'Date ( 1 ; 1 ; 5000 ) & Left ( Note ; 0 )', '?'],
    ['NumberOf', 'number', 'Date ( 1 ; 1 ; 5000 ) + Length ( Note ) * 0', null],
  ];
  try {
    store.applyDesign([
      { op: 'createTable', name: 'T', fields: [{ name: 'Day', type: 'date' }, { name: 'Note' }] },
      ...fields.map(([name, type, calculation]) => ({ op: 'createField', table: 'T', name, type, kind: 'calculation', calculation })),
    ] as never);
    const id = store.create('T', { Day: '9999-12-31', Note: 'x' }).recordId;
    const raw = store.sql.prepare(`SELECT ${fields.map(([n]) => `"${n}"`).join(',')} FROM T WHERE _fm_record_id = ?`).get(id) as Record<string, unknown>;
    for (const [name, type, , stored] of fields) assert.equal(raw[name], stored, `${name} in a ${type} field`);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a time with no date is an error ("?") that a date, time or timestamp field keeps, and it is not empty', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-error-text-'));
  const path = join(dir, 'Error.openhbam.sqlite');
  createStore(path);
  const store = new Store(path, 'Error');
  try {
    store.applyDesign([
      { op: 'createTable', name: 'T', fields: [{ name: 'D', type: 'date' }, { name: 'Tm', type: 'time' }, { name: 'Note' }] },
      { op: 'createField', table: 'T', name: 'Ts', type: 'timestamp', kind: 'calculation', calculation: 'Timestamp ( D ; Tm )' },
      { op: 'createField', table: 'T', name: 'AsDate', type: 'date', kind: 'calculation', calculation: 'Note' },
      { op: 'createField', table: 'T', name: 'AsTime', type: 'time', kind: 'calculation', calculation: 'Note' },
      { op: 'createField', table: 'T', name: 'TsEmpty', type: 'number', kind: 'calculation', calculation: 'IsEmpty ( Ts )', options: { unstored: true } },
      { op: 'createField', table: 'T', name: 'AsDateEmpty', type: 'number', kind: 'calculation', calculation: 'IsEmpty ( AsDate )', options: { unstored: true } },
      { op: 'createField', table: 'T', name: 'Seen', type: 'text', kind: 'calculation', calculation: 'GetAsText ( Ts ) & "/" & GetAsText ( AsDate ) & "/" & GetAsText ( AsTime )', options: { unstored: true } },
    ] as never);
    const id = store.create('T', { Tm: '08:30:00', Note: '?' }).recordId;
    const raw = store.sql.prepare('SELECT Ts, AsDate, AsTime FROM T WHERE _fm_record_id = ?').get(id) as Record<string, unknown>;
    assert.deepEqual({ ...raw }, { Ts: '?', AsDate: '?', AsTime: '?' });
    const r = store.get('T', id, 'iso').fieldData;
    assert.equal(r.TsEmpty, 0);
    assert.equal(r.AsDateEmpty, 0);
    assert.equal(r.Seen, '?/?/?');
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
