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
