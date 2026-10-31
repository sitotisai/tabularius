// On Windows a name or path the system refuses (too long) is script error 850 for a file step. For the plug-in file
// functions it is a file that is not there, never an error that aborts the calculation or the script.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Script } from '@tabularius/fmp12';
import { createStore, parseScriptText, Store } from '@tabularius/store';
import { runScript } from '../src/index.ts';

let dir: string;
let docs: string;
let store: Store;
const realPlatform = Object.getOwnPropertyDescriptor(process, 'platform')!;

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-long-name-'));
  docs = join(dir, 'Documents');
  mkdirSync(docs);
  createStore(join(dir, 'P.sqlite'));
  store = new Store(join(dir, 'P.sqlite'), 'P');
  store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name', type: 'text' }] }]);
  store.create('Items', { Name: 'one' });
});
after(() => {
  Object.defineProperty(process, 'platform', realPlatform);
  store?.close();
  rmSync(dir, { recursive: true });
});

const run = async (formula: string): Promise<string> => {
  const steps = parseScriptText(`Exit Script [ Text Result: ${formula} ]`, store.schema)
    .map((s) => ({ stepId: s.stepId!, name: s.name!, enabled: s.enabled !== false, params: s.params }));
  return (await runScript(store, { id: 9999, name: 'test', steps } as Script, { layout: 'Items', documents: docs })).result;
};

test('a name Windows refuses is a missing file to the plug-in file functions, not an error', async () => {
  const long = 'a'.repeat(300) + '.txt';
  Object.defineProperty(process, 'platform', { ...realPlatform, value: 'win32' });
  try {
    assert.equal(await run(`BE_FileExists ( "${long}" ) & "/" & BE_FileSize ( "${long}" )`), '0/');
    assert.equal(await run(`BE_FileReadText ( "${long}" ) & "/" & BE_GetLastError`), '/2');
    assert.equal(await run(`BE_FileWriteText ( "${long}" ; "x" )`) !== '0', true, 'the write fails with an error code');
  } finally {
    Object.defineProperty(process, 'platform', realPlatform);
  }
});
