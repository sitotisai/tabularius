// A session's reach into another hosted file follows the account's *name* only. A person with [Full Access] in one hosted file
// can add an account there that carries the name of an account in a second file, sign in with the password they chose, and
// then read and change the second file's records with that account's privilege set there, although they never proved that
// file's password. FileMaker opens an external file with the same name AND password, and asks for credentials otherwise.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import { serve } from '../src/index.ts';
import { createStore, type Store } from '../../store/src/index.ts';

let dir: string;
let server: Server;
let base: string;
let ui: Store;
let data: Store;
let peopleId = 0;

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-xfile-identity-'));
  for (const name of ['UI', 'Data']) createStore(join(dir, `${name}.openhbam.sqlite`));
  const served = await serve({ dir, port: 0, hostname: '127.0.0.1', watch: false, log: () => {} });
  server = served.server;
  base = served.url;
  [ui, data] = ['UI', 'Data'].map((n) => served.host.get(n)!);
  for (const store of [ui, data]) store.savePrivilegeSet({ ...store.privilegeSet('[Full Access]')!, extendedPrivileges: ['fmrest', 'fmapp'] });
  data.applyDesign([{ op: 'createTable', name: 'People', fields: [{ name: 'Name' }, { name: 'Salary', type: 'number' }] }]);
  peopleId = data.schema.tables.find((t) => t.name === 'People')!.id;
  data.create('People', { Name: 'Ann', Salary: 123456 });
  // Data's owner: the only account that may read Data.
  data.setPassword('Owner', 'owner-secret-pw', '[Full Access]');
  // UI's owner, who has no account in Data.
  ui.setPassword('Designer', 'designer-pw', '[Full Access]');
});
after(async () => {
  await new Promise<void>((r) => (server ? server.close(() => r()) : r()));
  if (dir) rmSync(dir, { recursive: true, force: true });
});

const json = { 'content-type': 'application/json' };
async function signIn(db: string, account: string, password: string): Promise<string> {
  const r = await fetch(`${base}/fmi/data/vLatest/databases/${db}/sessions`, { method: 'POST', headers: { ...json, authorization: 'Basic ' + btoa(`${account}:${password}`) }, body: '{}' });
  const body = await r.json() as { response: { token?: string } };
  assert.equal(r.status, 200, JSON.stringify(body));
  return body.response.token!;
}

test('an account made in one file does not get the privileges of the same-named account in another file it never signed in to', async () => {
  // The designer of UI, with no account in Data, makes a UI account named like Data's owner, with a password of their own.
  const designer = await signIn('UI', 'Designer', 'designer-pw');
  let r = await fetch(`${base}/tabularius/security/v1/databases/UI`, { method: 'POST', headers: { ...json, authorization: `Bearer ${designer}` },
    body: JSON.stringify({ changes: [{ op: 'createAccount', name: 'Owner', kind: 'password', password: 'not-the-owners-pw', privilegeSet: '[Full Access]' }] }) });
  assert.equal(r.status, 200, await r.text());
  // Data refuses that password: the UI "Owner" is not Data's owner.
  r = await fetch(`${base}/fmi/data/vLatest/databases/Data/sessions`, { method: 'POST', headers: { ...json, authorization: 'Basic ' + btoa('Owner:not-the-owners-pw') }, body: '{}' });
  assert.equal(r.status, 401);
  // Signed in to UI as that account, they point UI at Data's People table.
  const impostor = await signIn('UI', 'Owner', 'not-the-owners-pw');
  r = await fetch(`${base}/tabularius/design/v1/databases/UI`, { method: 'POST', headers: { ...json, authorization: `Bearer ${impostor}` },
    body: JSON.stringify({ changes: [
      { op: 'createDataSource', name: 'Data', paths: ['file:Data'] },
      { op: 'createOccurrence', name: 'People', file: 'Data', externalTable: peopleId },
      { op: 'createLayout', name: 'People', occurrence: 'People' },
    ] }) });
  // Whether the design change is refused or the records are, Data's rows must not be readable or writable this way.
  const read = await fetch(`${base}/fmi/data/vLatest/databases/UI/layouts/People/records`, { headers: { authorization: `Bearer ${impostor}` } });
  const text = await read.text();
  assert.doesNotMatch(text, /123456/, `Data's salary was read through UI without Data's password: ${text}`);
  const write = await fetch(`${base}/fmi/data/vLatest/databases/UI/layouts/People/records/1`, { method: 'PATCH', headers: { ...json, authorization: `Bearer ${impostor}` }, body: JSON.stringify({ fieldData: { Salary: 1 } }) });
  assert.notEqual(write.status, 200, 'a record of Data was changed through UI without Data\'s password');
  assert.equal((data.sql.prepare('SELECT Salary FROM People').get() as { Salary: number }).Salary, 123456, 'Data keeps its value');
});
