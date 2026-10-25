// Find errors say which fields (and empty variables) were involved, never the criteria themselves,
// so a test-scripts report on a client's file shows why a find failed without showing its data.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Script } from '@tabularius/fmp12';
import { createStore, parseScriptText, Store } from '@tabularius/store';
import { runScript } from '../src/index.ts';

let dir: string;
let store: Store;

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-find-errors-'));
  createStore(join(dir, 'F.sqlite'));
  store = new Store(join(dir, 'F.sqlite'), 'F');
  store.applyDesign([{ op: 'createTable', name: 'Clients', fields: [{ name: 'Name', type: 'text' }, { name: 'Status', type: 'text' }] }]);
  store.create('Clients', { Name: 'Acme', Status: 'Active' });
});
after(() => {
  store?.close();
  rmSync(dir, { recursive: true });
});

const run = (text: string, parameter?: string) => runScript(store, {
  id: 9999, name: 'test',
  steps: parseScriptText(text.trim().split('\n').map((l) => l.trim()).join('\n'), store.schema).map((s) => ({ stepId: s.stepId!, name: s.name!, enabled: s.enabled !== false, params: s.params })),
} as Script, { layout: 'Clients', trace: true, parameter });
const message = (r: Awaited<ReturnType<typeof run>>) => [...(r.trace ?? [])].reverse().find((t) => t.error)?.message ?? '';

test('no criteria: names the fields set to nothing', async () => {
  const r = await run(`
    Enter Find Mode [ Pause: Off ]
    Set Field [ Clients::Name ; $search ]
    Perform Find []`);
  assert.equal(r.error, 400);
  assert.equal(message(r), 'No find criteria (Name set to nothing)');
  const none = await run('Enter Find Mode [ Pause: Off ]\nPerform Find []');
  assert.equal(message(none), 'No find criteria (no field was set in find mode)');
});

test('no records: names the fields searched, not what was searched for', async () => {
  const r = await run(`
    Enter Find Mode [ Pause: Off ]
    Set Field [ Clients::Name ; "Secret Client Ltd" ]
    Set Field [ Clients::Status ; "Active" ]
    Perform Find []`);
  assert.equal(r.error, 401);
  assert.equal(message(r), 'No records match the request (by Name, Status)');
  assert.doesNotMatch(JSON.stringify(r.trace), /Secret Client/);
});

test('find and quick find reject NUL criteria with a script find error', async () => {
  const find = await run('Enter Find Mode [ Pause: Off ]\nSet Field [ Clients::Name ; Get ( ScriptParameter ) ]\nPerform Find []', 'a\0b');
  assert.equal(find.error, 400);
  assert.match(message(find), /NUL/);
  const quick = await run('Perform Quick Find [ Get ( ScriptParameter ) ]', 'a\0b');
  assert.equal(quick.error, 400);
  assert.match(message(quick), /NUL/);
});

test('quick find treats an unmatched quote as text or reports no matching records', async () => {
  const result = await run('Perform Quick Find [ Get ( ScriptParameter ) ]', 'no"match');
  assert.equal(result.error, 401);
  store.create('Clients', { Name: 'a"b' });
  const matching = await run('Perform Quick Find [ Get ( ScriptParameter ) ]', 'a"b');
  assert.equal(matching.error, 0);
});

test('quick find keeps quoted phrases and only treats an unbalanced quote as text', async () => {
  store.create('Clients', { Name: 'edited' });
  store.create('Clients', { Name: 'Smith "Bob" Jones' });
  const all = store.findIds('Clients', {}).length;
  const found = async (phrase: string) => {
    const r = await run('Perform Quick Find [ Get ( ScriptParameter ) ]', phrase);
    return { error: r.error, count: r.foundSet?.length };
  };
  assert.deepEqual(await found('"edited"'), { error: 0, count: 1 });
  assert.deepEqual(await found('""'), { error: 0, count: all });
  assert.deepEqual(await found('"Bob"'), { error: 0, count: 1 });
  assert.equal((await found('no"match')).error, 401);
  assert.equal((await found('a"b')).error, 0);
});
