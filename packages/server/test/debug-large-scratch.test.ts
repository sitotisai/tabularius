import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createStore, Store } from '../../store/src/index.ts';
import { ScriptSession } from '../../scripts/src/index.ts';
import { DebugApi, SCRATCH_MAX_BYTES, debugScratchMaxBytes } from '../src/debug.ts';
import type { Host } from '../src/host.ts';
import type { DataApi, Session } from '../src/dataapi.ts';

test('a larger configured scratch limit allows an isolated write, while an over-limit copy is refused', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-debug-large-'));
  const path = join(dir, 'Local.sqlite');
  createStore(path);
  const store = new Store(path);
  store.applyDesign([
    { op: 'createTable', name: 'Items', fields: [{ name: 'Name', type: 'text' }] },
    { op: 'createScript', name: 'Write', text: 'New Record/Request\nSet Field [ Items::Name ; "scratch" ]\nCommit Records/Requests [ With dialog: Off ]' },
    { op: 'createScript', name: 'Mail', text: 'Send Mail [ To: "nobody@example.invalid" ; Subject: "test" ]' },
  ]);
  store.setPassword('Admin', 'local-password', '[Full Access]');
  const session: Session = { token: 'local-session', db: 'Local', account: 'Admin', client: 'rest', started: Date.now(), lastUsed: performance.now(), scripts: new ScriptSession() };
  const host = { get: (name: string) => name === 'Local' ? store : undefined, scriptOptions: () => ({}) } as unknown as Host;
  const api = { authorize: () => session, alive: () => true, endListeners: new Set() } as unknown as DataApi;
  const prior = process.env.TABULARIUS_DEBUG_SCRATCH_MAX_BYTES;
  process.env.TABULARIUS_DEBUG_SCRATCH_MAX_BYTES = String(SCRATCH_MAX_BYTES + 1);
  let debug: DebugApi | undefined;
  try {
    debug = new DebugApi(host, api);
    assert.equal(debug.scratchMaxBytes, SCRATCH_MAX_BYTES + 1);
    const call = async (script: string) => {
      const url = '/tabularius/debug/v1/databases/Local/runs';
      const req = Object.assign(Readable.from([Buffer.from(JSON.stringify({ script, layout: 'Items', pauseAtStart: false }))]), { method: 'POST', headers: {} }) as IncomingMessage;
      let status = 0, body = '';
      const res = { writeHead: (code: number) => { status = code; }, end: (text: string) => { body = text; } } as unknown as ServerResponse;
      await debug!.handle(req, res, new URL(`http://local${url}`));
      return { status, body: JSON.parse(body) as Record<string, any> };
    };
    debug.scratchMaxBytes = statSync(path).size - 1;
    const refused = await call('Write');
    assert.equal(refused.status, 400);
    assert.equal(refused.body.error.code, 960);
    assert.equal(store.recordCount('Items'), 0);
    debug.scratchMaxBytes = SCRATCH_MAX_BYTES + 1;
    const written = await call('Write');
    assert.equal(written.status, 201, JSON.stringify(written.body));
    assert.equal(written.body.scratch, true);
    assert.equal(written.body.done.error, 0);
    assert.equal(store.recordCount('Items'), 0);
    const mail = await call('Mail');
    assert.equal(mail.status, 201);
    assert.equal(mail.body.done.error, 3, 'mail stays offline on the copy');
  } finally {
    if (debug) await debug.stop();
    if (prior === undefined) delete process.env.TABULARIUS_DEBUG_SCRATCH_MAX_BYTES;
    else process.env.TABULARIUS_DEBUG_SCRATCH_MAX_BYTES = prior;
    session.scripts.close();
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('scratch size setting accepts only positive decimal bytes', () => {
  const prior = process.env.TABULARIUS_DEBUG_SCRATCH_MAX_BYTES;
  try {
    for (const value of ['0', '-1', '1e9', '1.5', '', '9007199254740992']) {
      process.env.TABULARIUS_DEBUG_SCRATCH_MAX_BYTES = value;
      assert.throws(() => debugScratchMaxBytes(), /TABULARIUS_DEBUG_SCRATCH_MAX_BYTES/);
    }
    process.env.TABULARIUS_DEBUG_SCRATCH_MAX_BYTES = '2147483648';
    assert.equal(debugScratchMaxBytes(), 2147483648);
    delete process.env.TABULARIUS_DEBUG_SCRATCH_MAX_BYTES;
    assert.equal(debugScratchMaxBytes(), SCRATCH_MAX_BYTES);
  } finally {
    if (prior === undefined) delete process.env.TABULARIUS_DEBUG_SCRATCH_MAX_BYTES;
    else process.env.TABULARIUS_DEBUG_SCRATCH_MAX_BYTES = prior;
  }
});
