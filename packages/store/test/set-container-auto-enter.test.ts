import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../src/index.ts';

// Putting a file in a container field is a change to the record like any other: the modification auto-enters (timestamp,
// account name) are refreshed and the stored calculations that read the container are worked out again, as for an update.

function setup(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-set-container-'));
  const path = join(dir, 'Files.sqlite');
  createStore(path, { mode: 'native' });
  const s = new Store(path, 'Files');
  t.after(() => { s.close(); rmSync(dir, { recursive: true, force: true }); });
  s.applyDesign([{ op: 'createTable', name: 'Docs', fields: [
    { name: 'Title' },
    { name: 'File', type: 'container' },
    { name: 'ModifiedAt', type: 'timestamp', options: { autoEnter: { value: 'modificationTimestamp' } } },
    { name: 'ModifiedBy', options: { autoEnter: { value: 'modificationAccountName' } } },
    { name: 'FileName', kind: 'calculation', calculation: 'GetAsText ( File )' },
    { name: 'FileSize', type: 'number', kind: 'calculation', calculation: 'GetContainerAttribute ( File ; "fileSize" )' },
  ] }] as never);
  return s;
}

const file = (name: string, text: string) => ({ filename: name, mime: 'text/plain', data: new TextEncoder().encode(text) });

test('a file put in a container refreshes the modification fields and the stored calculations over it', (t) => {
  const s = setup(t);
  const id = s.create('Docs', { Title: 'a' }, { account: 'alice' }).recordId;
  const read = () => s.get('Docs', id).fieldData;
  assert.equal(read().ModifiedBy, 'alice');
  const stamped = String(read().ModifiedAt);
  assert.ok(stamped);

  // The clock reads a later second than the one the record was made in.
  const later = new Date(Date.now() + 5000);
  t.mock.timers.enable({ apis: ['Date'], now: later });
  s.setContainer('Docs', id, 'File', 1, file('hello.txt', 'hello world'), { account: 'bob' });
  assert.equal(read().ModifiedBy, 'bob', 'modification account is the one who uploaded');
  assert.notEqual(String(read().ModifiedAt), stamped, 'modification timestamp moved');
  assert.equal(read().FileName, 'hello.txt', 'a stored calculation over the container is worked out');
  assert.equal(read().FileSize, 11);

  s.setContainer('Docs', id, 'File', 1, file('longer.txt', 'a longer text'), { account: 'cy' });
  assert.equal(read().FileName, 'longer.txt');
  assert.equal(read().FileSize, 13);
  assert.equal(read().ModifiedBy, 'cy');

  s.setContainer('Docs', id, 'File', 1, null, { account: 'bob' });
  assert.equal(read().FileName, '', 'emptying the container is a change too');
});

test('the audit row of a container upload lists the fields the auto-enters changed, and the record version moves once', (t) => {
  const s = setup(t);
  const id = s.create('Docs', { Title: 'a' }, { account: 'alice' }).recordId;
  const before = s.get('Docs', id).modId;
  const { modId } = s.setContainer('Docs', id, 'File', 1, file('x.txt', 'xyz'), { account: 'bob' });
  assert.equal(Number(modId), Number(before) + 1);
  assert.equal(Number(s.get('Docs', id).modId), Number(modId));
  const entry = s.auditLog({ table: 'Docs', recordId: id, limit: 1 })[0];
  assert.equal(entry.kind, 'update');
  const text = JSON.stringify(entry);
  assert.ok(text.includes('File') && text.includes('ModifiedBy') && text.includes('FileName'), text);
  assert.ok(!text.includes('xyz'), 'never the contents');
});

test('performAutoEnter: false keeps the modification fields and the stored values as they were, as an update does', (t) => {
  const s = setup(t);
  const id = s.create('Docs', { Title: 'a' }, { account: 'alice' }).recordId;
  const read = () => s.get('Docs', id).fieldData;
  const stamped = String(read().ModifiedAt);
  t.mock.timers.enable({ apis: ['Date'], now: new Date(Date.now() + 5000) });
  s.setContainer('Docs', id, 'File', 1, file('hello.txt', 'hello world'), { performAutoEnter: false, account: 'importer' });
  assert.equal(read().ModifiedBy, 'alice', 'the account that makes the change is not stamped');
  assert.equal(String(read().ModifiedAt), stamped, 'the timestamp does not move');
  assert.equal(read().FileName, 'hello.txt', 'a stored calculation is still worked out: only auto-enter is skipped');
});

test('a key an auto-enter fills in on a container upload is checked like an update\'s: a child key with no parent refuses the upload', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-set-container-fk-'));
  const path = join(dir, 'Keys.sqlite');
  createStore(path, { mode: 'native' });
  const s = new Store(path, 'Keys');
  t.after(() => { s.close(); rmSync(dir, { recursive: true, force: true }); });
  // The key comes from an auto-enter over the container: the name of the file put in.
  s.applyDesign([
    { op: 'createTable', name: 'Owners', fields: [{ name: 'ID' }] },
    { op: 'createTable', name: 'Scans', fields: [
      { name: 'File', type: 'container' },
      { name: 'OwnerID', calculation: 'GetAsText ( File )', options: { autoEnter: { calculation: true, replaceExisting: true } } },
    ] },
    { op: 'createRelationship', left: 'Scans', right: 'Owners', predicates: [{ left: 'OwnerID', right: 'ID' }],
      foreignKey: { name: 'scan_owner', child: { table: 'Scans', field: 'OwnerID' }, parent: { table: 'Owners', field: 'ID' } } },
  ] as never);
  s.create('Owners', { ID: 'x.txt' });
  const id = s.create('Scans', {}).recordId;
  s.setContainer('Scans', id, 'File', 1, file('x.txt', 'a'));
  assert.equal(s.get('Scans', id).fieldData.OwnerID, 'x.txt', 'a key that has a parent is let through');
  assert.throws(() => s.setContainer('Scans', id, 'File', 1, file('nobody.txt', 'b')), (e: { code?: number }) => e.code === 505);
  assert.equal(s.get('Scans', id).fieldData.OwnerID, 'x.txt', 'the refused upload changed nothing');
});

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

test('a field that is itself a container (a thumbnail, a calculated file) keeps what it held when another container gets a file', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-set-container-thumb-'));
  const path = join(dir, 'Thumbs.sqlite');
  createStore(path);
  const s = new Store(path, 'Thumbs');
  t.after(() => { s.close(); rmSync(dir, { recursive: true, force: true }); });
  s.applyDesign([{ op: 'createTable', name: 'Docs', fields: [
    { name: 'File', type: 'container' },
    { name: 'Thumb', type: 'container', calculation: 'GetThumbnail ( File ; 10 ; 10 )', options: { autoEnter: { calculation: true, replaceExisting: true } } },
    { name: 'CalcC', type: 'container', kind: 'calculation', calculation: 'File' },
    { name: 'Name', kind: 'calculation', calculation: 'GetAsText ( File )' },
    { name: 'Tag', options: { autoEnter: { calculation: true, replaceExisting: true } }, calculation: 'GetAsText ( File ) & "!"' },
  ] }] as never);
  const id = s.create('Docs', {}).recordId;
  s.setContainer('Docs', id, 'Thumb', 1, { filename: 'old-thumb.png', mime: 'image/png', data: PNG });
  const raw = () => s.query('SELECT Thumb, CalcC FROM "Docs"', 5)[0];
  const thumb = raw().Thumb;
  const calcC = raw().CalcC;
  assert.ok(thumb);

  s.setContainer('Docs', id, 'File', 1, { filename: 'new.png', mime: 'image/png', data: PNG });
  assert.equal(raw().Thumb, thumb, 'the thumbnail is the one that was there');
  assert.equal(raw().CalcC, calcC, 'a calculated container is not turned into a file name');
  assert.ok(!String(s.get('Docs', id).fieldData.CalcC).includes('NaN') && !String(s.get('Docs', id).fieldData.Thumb).includes('NaN'));
  assert.match(String(s.get('Docs', id).fieldData.Thumb), /old-thumb\.png/);
  // Text results over the file still follow it.
  assert.equal(s.get('Docs', id).fieldData.Name, 'new.png');
  assert.equal(s.get('Docs', id).fieldData.Tag, 'new.png!');
});

test('a calculation over a file\'s contents is not copied into the audit row', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-set-container-audit-'));
  const path = join(dir, 'Audit.sqlite');
  createStore(path);
  const s = new Store(path, 'Audit');
  t.after(() => { s.close(); rmSync(dir, { recursive: true, force: true }); });
  s.applyDesign([{ op: 'createTable', name: 'Docs', fields: [
    { name: 'File', type: 'container' },
    { name: 'B64', kind: 'calculation', calculation: 'Base64Encode ( File )' },
    { name: 'FileName', kind: 'calculation', calculation: 'GetAsText ( File )' },
  ] }] as never);
  const id = s.create('Docs', {}).recordId;
  s.setContainer('Docs', id, 'File', 1, file('s.txt', 'SECRETSECRET'.repeat(100)));
  assert.ok(String(s.get('Docs', id).fieldData.B64).length > 1000, 'the calculation holds the contents');
  const entry = s.auditLog({ table: 'Docs', recordId: id, limit: 1 })[0];
  const text = JSON.stringify(entry);
  assert.ok(text.includes('B64'), 'the log says the calculation changed');
  assert.ok(!text.includes('SECRETSECRET') && !text.includes(Buffer.from('SECRETSECRET').toString('base64').slice(0, 12)), 'not what it holds');
  assert.match(text, /characters, sha256/);
  assert.ok(text.includes('FileName') && text.includes('s.txt'), 'a short result is logged as it is');
});

test('reverting a container upload puts back the fields that can be put back and skips the calculations', (t) => {
  const s = setup(t);
  const id = s.create('Docs', { Title: 'a' }, { account: 'alice' }).recordId;
  s.setContainer('Docs', id, 'File', 1, file('hello.txt', 'hello'), { account: 'bob' });
  const entry = s.auditLog({ table: 'Docs', recordId: id, limit: 1 })[0];
  const r = s.revertAuditEntry('Docs', id, entry.seq, { account: 'carol' });
  assert.equal(r.action, 'updated');
  assert.ok(r.skipped.some((x) => x.field === 'File'), 'the file is not kept in the log');
  assert.ok(r.skipped.some((x) => x.field === 'FileName'), 'a calculation is skipped, not refused');
  assert.ok(r.skipped.some((x) => x.field === 'FileSize'));
});
