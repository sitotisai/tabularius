// A file put in or taken out of a container field is a change to the record made by the account that did it, so the
// modification account name auto-enter shows that account: for the single upload, the resumable upload the web client
// uses, and the Data API's container delete.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { containerFixture, type ContainerFixture } from './container-fixture.ts';
import type { DesignOp } from '../../store/src/index.ts';

let f: ContainerFixture;
let bob: string;
before(async () => {
  f = await containerFixture();
  f.store.applyDesign([{ op: 'createField', table: 'Contacts', name: 'ModifiedBy', options: { autoEnter: { value: 'modificationAccountName' } } }] as DesignOp[]);
  f.store.setPassword('Bob', 'pw', '[Full Access]');
  bob = await f.login('Bob');
});
after(async () => { await f?.close(); });

const modifiedBy = (contact: number) => f.store.get('Contacts', Number(f.contact(contact))).fieldData.ModifiedBy;
const reset = (contact: number) => f.store.update('Contacts', Number(f.contact(contact)), { ModifiedBy: 'alice' }, undefined, { performAutoEnter: false });

test('a Data API upload by Bob makes Bob the account that modified the record', async () => {
  reset(1);
  assert.equal(modifiedBy(1), 'alice');
  const form = new FormData();
  form.append('upload', new Blob([new TextEncoder().encode('hello')], { type: 'text/plain' }), 'note.txt');
  const r = await fetch(`${f.api}/layouts/Contacts/records/${f.contact(1)}/containers/Photo`, { method: 'POST', headers: { authorization: bob }, body: form });
  assert.equal((await r.json()).messages[0].code, '0');
  assert.equal(modifiedBy(1), 'Bob');
});

test('a resumable upload finished by Bob makes Bob the account that modified the record', async () => {
  reset(2);
  const data = Buffer.from('resumable bytes');
  const call = async (method: string, path: string, body?: unknown) => {
    const raw = body instanceof Uint8Array;
    const r = await fetch(`${f.api}${path}`, { method, headers: { authorization: bob, ...(body === undefined || raw ? {} : { 'content-type': 'application/json' }) }, body: body === undefined ? undefined : raw ? data : JSON.stringify(body) });
    return (await r.json()) as { messages: { code: string }[]; response: Record<string, any> };
  };
  const s = await call('POST', `/layouts/Contacts/records/${f.contact(2)}/container-uploads/Photo/1`, { filename: 'r.txt', mime: 'text/plain', size: data.length });
  assert.equal(s.messages[0].code, '0');
  const id = s.response.uploadId;
  await call('PUT', `/layouts/Contacts/container-uploads/${id}?offset=0`, data);
  assert.equal(modifiedBy(2), 'alice', 'nothing changes until the upload is finished');
  assert.equal((await call('POST', `/layouts/Contacts/container-uploads/${id}/finish`, {})).messages[0].code, '0');
  assert.equal(modifiedBy(2), 'Bob');
});

test('emptying a container through the Data API by Bob makes Bob the account that modified the record', async () => {
  f.store.setContainer('Contacts', Number(f.contact(3)), 'Photo', 1, { filename: 'x.txt', mime: 'text/plain', data: Buffer.from('x') }, { account: 'alice' });
  reset(3);
  const r = await fetch(`${f.api}/layouts/Contacts/records/${f.contact(3)}/containers/Photo`, { method: 'DELETE', headers: { authorization: bob } });
  assert.equal((await r.json()).messages[0].code, '0');
  assert.equal(modifiedBy(3), 'Bob');
});
