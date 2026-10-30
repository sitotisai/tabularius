// A held file (one that arrived in the hosted folder, or a different file under an approved name) stays hosted and
// readable, but nothing of its own runs until an administrator approves it: scripts, schedules, automations, digests,
// inbound hooks and connections. Backups and change webhooks go on. The admin API's approve route lets them run.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import { runScript, ScriptError } from '../../scripts/src/index.ts';
import { serve, type Host } from '../src/index.ts';
import { automationRuns, saveAutomation } from '../src/automations.ts';
import { Connections, scriptConnections } from '../src/connections.ts';
import { DigestError, DigestRunner } from '../src/digests.ts';
import { hookSignature } from '../src/inbound-hooks.ts';
import type { Store } from '../../store/src/index.ts';

let dir: string;
let server: Server;
let base: string;
let host: Host;

const SCRIPT = [
  'Go to Layout [ "Orders" ]',
  'New Record/Request',
  'Set Field [ Orders::Ref ; Get ( ScriptParameter ) ]',
  'Commit Records/Requests [ With dialog: Off ]',
  'Exit Script [ Text Result: "saved" ]',
].join('\n');

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-held-gates-'));
  const s = await serve({ dir, port: 0, log: () => {}, inboundHooks: true });
  server = s.server;
  base = s.url;
  host = s.host;
});
after(async () => {
  await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()));
  if (dir) rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
});

/** A file made here is approved; the test marks it held the way a file found in the folder would be. */
function heldFile(name: string): Store {
  const store = host.create(name);
  store.applyDesign([
    { op: 'createTable', name: 'Orders', fields: [{ name: 'Ref' }] },
    { op: 'createScript', name: 'Take order', text: SCRIPT },
  ]);
  store.setPassword('Admin', 'pw', '[Full Access]');
  store.held = { reason: 'not seen before', since: new Date().toISOString() };
  return store;
}
const refs = (s: Store) => (s.query('SELECT Ref FROM Orders ORDER BY _fm_record_id') as { Ref: string }[]).map((r) => r.Ref);
const admin = (path: string, method = 'GET', body?: object) => fetch(`${base}/tabularius/admin/v1${path}`, {
  method, headers: { 'x-tabularius-admin': '1', 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}),
}).then(async (r) => ({ status: r.status, body: await r.json() as Record<string, any> }));

test('a held file runs no script, in any way it is reached, until it is approved', async () => {
  const store = heldFile('ScriptsHeld');
  await assert.rejects(runScript(store, 'Take order', { parameter: 'a' }), (e) => e instanceof ScriptError && e.code === 802 && /is held/.test(e.message));
  assert.deepEqual(refs(store), []);
  // The data is still readable; it is the file's own code that waits.
  assert.equal(host.get('ScriptsHeld'), store);

  assert.equal((await admin('/files/ScriptsHeld/approve', 'POST')).status, 200);
  assert.equal(store.held, undefined);
  assert.equal((await runScript(store, 'Take order', { parameter: 'b' })).result, 'saved');
  assert.deepEqual(refs(store), ['b']);
});

test('approving a file that is not held changes nothing; an unknown file is 404', async () => {
  const store = host.create('NotHeld');
  const again = await admin('/files/NotHeld/approve', 'POST');
  assert.equal(again.status, 200);
  assert.deepEqual(again.body, { name: 'NotHeld', held: false, approved: false });
  assert.equal(store.held, undefined);
  assert.equal((await admin('/files/Nothing/approve', 'POST')).status, 404);
});

test('the approve route reports the held file in the status and clears it', async () => {
  const store = heldFile('StatusHeld');
  const listed = (await admin('/status')).body.databases.find((d: { name: string }) => d.name === 'StatusHeld');
  assert.equal(listed.held.reason, 'not seen before');
  assert.equal((await admin('/files/StatusHeld/approve', 'POST')).body.approved, true);
  assert.equal((await admin('/status')).body.databases.find((d: { name: string }) => d.name === 'StatusHeld').held, undefined);
  assert.equal(store.held, undefined);
});

test('a script schedule on a held file fails with the reason and runs once the file is approved', async () => {
  const store = heldFile('ScheduleHeld');
  const made = await admin('/schedules', 'POST', { name: 'Take', database: 'ScheduleHeld', script: 'Take order', account: 'Admin', parameter: 's', everyMinutes: 60 });
  assert.equal(made.status, 201, JSON.stringify(made.body));
  const refused = await admin(`/schedules/${made.body.id}/run`, 'POST');
  assert.match(JSON.stringify(refused.body), /is held/);
  assert.deepEqual(refs(store), []);
  await admin('/files/ScheduleHeld/approve', 'POST');
  await admin(`/schedules/${made.body.id}/run`, 'POST');
  assert.deepEqual(refs(store), ['s']);
});

test('an inbound hook on a held file answers 403 and runs nothing; after approval it runs', async () => {
  const store = heldFile('HookHeld');
  const made = await admin('/inbound-hooks', 'POST', { name: 'Pay', database: 'HookHeld', script: 'Take order', account: 'Admin', layout: 'Orders' });
  assert.equal(made.status, 201, JSON.stringify(made.body));
  const { secret, path } = made.body as { secret: string; path: string };
  const call = (text: string) => {
    const at = String(Math.floor(Date.now() / 1000));
    return fetch(`${base}${path}`, {
      method: 'POST', body: JSON.stringify(text),
      headers: { 'content-type': 'application/json', 'x-tabularius-timestamp': at, 'x-tabularius-signature': hookSignature(secret, at, JSON.stringify(text)) },
    }).then(async (r) => ({ status: r.status, body: await r.json() as Record<string, unknown> }));
  };
  assert.equal((await call('h1')).status, 403);
  assert.deepEqual(refs(store), []);
  await admin('/files/HookHeld/approve', 'POST');
  assert.equal((await call('h2')).status, 200);
});

test('automations on a held file set nothing off; after approval the next change does', async () => {
  const store = heldFile('AutoHeld');
  store.applyDesign([
    { op: 'createTable', name: 'T', fields: [{ name: 'Value', type: 'text' }] },
    { op: 'createScript', name: 'Read value', text: 'Set Variable [ $seen ; Value: T::Value ]' },
  ]);
  const made = saveAutomation(store, { name: 'Watch', layout: 'T', on: 'update', fields: ['Value'], script: 'Read value', account: 'Admin' }, 'Admin', []).automation;
  const id = store.create('T', { Value: 'one' }).recordId;
  store.update('T', id, { Value: 'two' });
  await host.automations!.idle(store);
  assert.equal(automationRuns(store, made.id).length, 0);
  host.approve('AutoHeld', 'test');
  store.update('T', id, { Value: 'three' });
  await host.automations!.idle(store);
  assert.equal(automationRuns(store, made.id).length, 1);
});

test('a digest on a held file does not run', async () => {
  const store = heldFile('DigestHeld');
  const runner = new DigestRunner(host);
  const digest = { id: 'abc123abc123', name: 'D', dashboard: 'x', days: [1], at: '08:00', prompt: 'p', enabled: true, account: 'Admin' };
  await assert.rejects(runner.run(store, digest as never), (e) => e instanceof DigestError && /is held/.test(e.message));
});

test('a connection is not handed to a script that involves a held file', async () => {
  const connections = new Connections(dir, () => {});
  const sent = scriptConnections(connections, { held: (f) => f === 'ConnHeld' });
  await assert.rejects(sent.request('any', { method: 'GET', path: '/' } as never, ['ConnHeld']), /is held/);
});
