// A schedule, an inbound hook or a webhook is a standing way for a script to run as an account, or for a file's changes to leave the
// server. Whoever holds the admin token can add one, and until now nothing in the file's security log said so: an administrator reading
// the log to see who gave what access found no trace of a hook that lets another service run a script as Full Access. Each addition,
// change and removal is a security event of the file it belongs to, naming what runs and as whom, and never a secret or a full address.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import { serve, type Host } from '../src/index.ts';
import { auditAutomation } from '../src/automation-audit.ts';
import { InboundHooks } from '../src/inbound-hooks.ts';
import { Schedules } from '../src/schedules.ts';

let dir: string;
let server: Server;
let base: string;
let host: Host;
const originalPath = process.env.PATH;
const originalMarker = process.env.TABULARIUS_TEST_CHILD_MARKER;

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-automation-audit-'));
  // serve checks this process's identity with an absolute system utility on macOS. Any other child gets only command stubs.
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  process.env.PATH = bin;
  process.env.TABULARIUS_TEST_CHILD_MARKER = join(dir, 'called');
  for (const name of ['launchctl', 'systemctl', 'sc', 'git', 'npm', 'curl', 'sudo']) {
    writeFileSync(join(bin, name), '#!/bin/sh\nprintf forbidden >> "$TABULARIUS_TEST_CHILD_MARKER"\nexit 99\n', { mode: 0o700 });
  }
  const s = await serve({ dir, port: 0, log: () => {}, inboundHooks: true, webhooks: true });
  server = s.server;
  base = s.url;
  host = s.host;
  for (const name of ['Shop', 'Other']) {
    const store = host.create(name);
    store.applyDesign([
      { op: 'createTable', name: 'Orders', fields: [{ name: 'Ref' }] },
      { op: 'createScript', name: 'Nightly', text: 'Exit Script [ Text Result: "ok" ]' },
    ]);
    store.setPassword('Admin', 'pw');
  }
});
after(async () => {
  await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()));
  const called = dir && existsSync(join(dir, 'called'));
  if (originalPath === undefined) delete process.env.PATH;
  else process.env.PATH = originalPath;
  if (originalMarker === undefined) delete process.env.TABULARIUS_TEST_CHILD_MARKER;
  else process.env.TABULARIUS_TEST_CHILD_MARKER = originalMarker;
  if (dir) rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  assert.equal(Boolean(called), false, 'a forbidden child command ran');
});

const admin = (path: string, method = 'GET', body?: object) => fetch(`${base}/tabularius/admin/v1/${path}`, {
  method, headers: { 'x-tabularius-admin': '1', 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}),
}).then(async (r) => ({ status: r.status, body: await r.json() as Record<string, any> }));

const events = (file: string) => host.get(file)!.securityEvents({ category: 'Automations', limit: 100 });

test('an inbound hook added, changed, given a new secret and removed is in the security log of its file, without its secret', async () => {
  const made = await admin('inbound-hooks', 'POST', { name: 'Orders in', database: 'Shop', script: 'Nightly', account: 'Admin', perMinute: 5 });
  assert.equal(made.status, 201);
  const id = made.body.id as string;
  assert.equal((await admin(`inbound-hooks/${id}`, 'PATCH', { enabled: false, perMinute: 9 })).status, 200);
  const rotated = await admin(`inbound-hooks/${id}/secret`, 'POST');
  assert.equal(rotated.status, 200);
  assert.equal((await admin(`inbound-hooks/${id}`, 'DELETE')).status, 200);
  const log = events('Shop');
  assert.deepEqual(log.map((e) => e.kind), ['automation-added', 'automation-changed', 'automation-changed', 'automation-removed']);
  assert.match(log[0].description, /inbound hook Orders in was added, running Nightly as Admin/);
  assert.match(log[1].description, /\(enabled, perMinute\)/);
  assert.match(log[2].description, /\(secret\)/);
  const everything = JSON.stringify(host.get('Shop')!.securityEvents({ limit: 100 }));
  assert.ok(!everything.includes(made.body.secret as string) && !everything.includes(rotated.body.secret as string), 'no secret in the log');
  assert.equal(events('Other').length, 0, 'only the file the hook belongs to');
});

test('a hook that changes nothing, or is refused, writes no entry', async () => {
  const before = events('Shop').length;
  const same = await admin('inbound-hooks', 'POST', { name: 'Same', database: 'Shop', script: 'Nightly', account: 'Admin', perMinute: 5 });
  assert.equal(same.status, 201);
  assert.equal(events('Shop').length, before + 1);
  assert.equal((await admin(`inbound-hooks/${same.body.id}`, 'PATCH', { name: 'Same', perMinute: 5 })).status, 200);
  assert.equal(events('Shop').length, before + 1, 'saving the same values is not a change');
  assert.equal((await admin(`inbound-hooks/${same.body.id}`, 'DELETE')).status, 200);
  assert.equal((await admin('inbound-hooks', 'POST', { name: 'x', database: 'Shop', script: 'No such script', account: 'Admin' })).status >= 400, true);
  assert.equal((await admin('inbound-hooks/ffffffffffffffffff', 'DELETE')).status, 404);
  assert.equal(events('Shop').length, before + 2, 'the refused ones added nothing');
});

test('a script schedule added, changed and removed is in the security log of its file; a backup schedule belongs to no file', async () => {
  const made = await admin('schedules', 'POST', { name: 'Nightly run', database: 'Other', script: 'Nightly', account: 'Admin', everyMinutes: 1440, enabled: false });
  assert.equal(made.status, 201, JSON.stringify(made.body));
  const id = made.body.id as string;
  assert.equal((await admin(`schedules/${id}`, 'PATCH', { account: 'Admin', network: true, enabled: false })).status, 200);
  assert.equal((await admin(`schedules/${id}`, 'DELETE')).status, 200);
  const log = events('Other');
  assert.deepEqual(log.map((e) => e.kind), ['automation-added', 'automation-changed', 'automation-removed']);
  assert.match(log[0].description, /schedule Nightly run was added, running Nightly as Admin/);
  assert.match(log[1].description, /network/);
  assert.match(log[1].description, /allowed to reach the network/);
  const backup = await admin('schedules', 'POST', { kind: 'backup', name: 'Backups', everyMinutes: 1440, enabled: false });
  assert.equal(backup.status, 201, JSON.stringify(backup.body));
  assert.equal(events('Other').length, 3);
  assert.equal(events('Shop').filter((e) => /schedule/.test(e.description)).length, 0);
});

test('a webhook added, switched off and removed is in the log with the host it sends to and nothing more of the address', async () => {
  const made = await admin('webhooks', 'POST', { url: 'https://collector.example.test/in/sekret-path-part?key=hidden', database: 'Shop' });
  assert.equal(made.status, 201, JSON.stringify(made.body));
  const id = made.body.id as string;
  assert.equal((await admin(`webhooks/${id}`, 'PATCH', { enabled: false })).status, 200);
  assert.equal((await admin(`webhooks/${id}`, 'DELETE')).status, 200);
  const log = events('Shop').filter((e) => /webhook/.test(e.description));
  assert.deepEqual(log.map((e) => e.kind), ['automation-added', 'automation-changed', 'automation-removed']);
  assert.match(log[0].description, /sending changes to collector\.example\.test/);
  const everything = JSON.stringify(host.get('Shop')!.securityEvents({ limit: 100 }));
  assert.ok(!/sekret-path-part|hidden/.test(everything), 'the path and query of the address are not kept');
  assert.ok(!everything.includes(made.body.secret as string), 'nor the secret');
});

test('schedule time edits name the changed settings without their values; unchanged and refused saves add nothing', async () => {
  const before = events('Shop').length;
  const made = await admin('schedules', 'POST', { name: 'Time edits', database: 'Shop', script: 'Nightly', account: 'Admin', everyMinutes: 1440, at: '01:00', enabled: false });
  assert.equal(made.status, 201);
  const path = `schedules/${made.body.id}`;
  assert.equal((await admin(path, 'PATCH', { everyMinutes: 1440, at: '01:00', enabled: false })).status, 200);
  assert.equal((await admin(path, 'PATCH', { everyMinutes: 0 })).status, 400);
  assert.equal(events('Shop').length, before + 1);
  const parameter = ['private', 'parameter', 'value'].join('-');
  assert.equal((await admin(path, 'PATCH', { everyMinutes: 720, at: '02:00', parameter })).status, 200);
  const changed = events('Shop').at(-1)!;
  assert.deepEqual(changed.changes?.fields, ['parameter', 'everyMinutes', 'at']);
  assert.ok(!JSON.stringify(changed).includes(parameter));
  assert.equal((await admin(path, 'DELETE')).status, 200);

  const hook = await admin('webhooks', 'POST', { database: 'Shop', url: 'https://collector.example.test:8443/private', enabled: false });
  assert.equal(hook.status, 201);
  const count = events('Shop').length;
  assert.equal((await admin(`webhooks/${hook.body.id}`, 'PATCH', { enabled: false })).status, 200);
  assert.equal((await admin('webhooks', 'POST', { database: 'Shop', url: 'invalid' })).status, 400);
  assert.equal(events('Shop').length, count);
  assert.equal(events('Shop').at(-1)!.changes?.sendsTo, 'collector.example.test:8443');
  assert.equal((await admin(`webhooks/${hook.body.id}`, 'DELETE')).status, 200);
  assert.equal((await admin(`webhooks/${hook.body.id}`, 'DELETE')).status, 404);
  assert.equal(events('Shop').length, count + 1);
});

test('direct sync schedule changes are audited, while backup, verify and message schedules are not', () => {
  const schedules = new Schedules(host);
  schedules.stop();
  schedules.syncJobs = { check: () => {}, run: async () => { throw new Error('must not run'); } };
  const before = events('Shop').length;
  const sync = schedules.create({ database: 'Shop', sync: {}, enabled: false });
  schedules.update(sync.id, { sync: { pull: true } });
  schedules.remove(sync.id);
  const log = events('Shop').slice(before);
  assert.deepEqual(log.map((e) => e.kind), ['automation-added', 'automation-changed', 'automation-removed']);
  assert.match(log[0].description, /running sync/);
  assert.deepEqual(log[1].changes?.fields, ['sync']);
  for (const kind of ['backup', 'verify', 'message'] as const) {
    const s = schedules.create({ kind, name: kind, message: 'Maintenance', enabled: false });
    schedules.update(s.id, { name: `${kind} renamed` });
    schedules.remove(s.id);
  }
  assert.equal(events('Shop').length, before + 3);
});

test('a failed security-log write is reported without undoing a saved hook; empty and unhosted files are ignored', (t) => {
  const logs: string[] = [];
  const hooks = new InboundHooks(host, true, (m) => logs.push(m));
  const store = host.get('Shop')!;
  const before = events('Shop').length;
  t.mock.method(store, 'recordAutomationChange', () => { throw new Error('audit unavailable'); });
  const hook = hooks.create({ name: 'Saved despite audit failure', database: 'Shop', script: 'Nightly', account: 'Admin' });
  assert.ok(new InboundHooks(host, true).list().some((h) => h.id === hook.id), 'addition was persisted');
  hooks.update(hook.id, { enabled: false });
  assert.equal(new InboundHooks(host, true).list().find((h) => h.id === hook.id)!.enabled, false, 'edit was persisted');
  const rotated = hooks.newSecret(hook.id);
  assert.equal(hooks.remove(hook.id), true);
  assert.ok(!new InboundHooks(host, true).list().some((h) => h.id === hook.id), 'removal was persisted');
  assert.equal(logs.length, 4);
  assert.ok(logs.every((m) => m.includes('security log: could not record') && m.includes('audit unavailable')));
  assert.ok(!logs.join('\n').includes(hook.secret) && !logs.join('\n').includes(rotated.secret));
  assert.equal(events('Shop').length, before);
  for (const database of ['', undefined, 'Not hosted']) {
    auditAutomation(host, (m) => logs.push(m), database, 'added', { what: 'schedule', id: 'missing' });
  }
  assert.equal(logs.length, 4, 'no file means there is nowhere to record an event');
});

test('the store bounds detail and drops unrelated properties, and every automation event is a notice with no actor', () => {
  const store = host.create('Bounds');
  const long = 'x'.repeat(250);
  const detail = { what: 'schedule' as const, id: long, name: long, script: long, account: long, sendsTo: long, network: true,
    fields: Array.from({ length: 25 }, () => 'f'.repeat(50)), secret: ['not', 'logged'].join('-'), url: 'https://collector.example.test/private' };
  store.recordAutomationChange('changed', detail);
  const event = events('Bounds')[0];
  assert.deepEqual(event.changes, { what: 'schedule', id: long.slice(0, 200), name: long.slice(0, 200), script: long.slice(0, 200),
    account: long.slice(0, 200), sendsTo: long.slice(0, 200), network: true, fields: Array.from({ length: 20 }, () => 'f'.repeat(40)) });
  for (const file of ['Shop', 'Other', 'Bounds']) {
    for (const e of events(file)) {
      assert.equal(e.category, 'Automations');
      assert.equal(e.severity, 'notice');
      assert.equal(e.account, null, 'the run-as account is detail, not the administrator who made the change');
    }
  }
});

test('the existing security-events API and CSV include the automation category and descriptions', async () => {
  const path = 'security-events?database=Shop&category=Automations';
  const json = await admin(path);
  assert.equal(json.status, 200);
  assert.ok(json.body.categories.includes('Automations'));
  assert.deepEqual(json.body.events, events('Shop'));
  const csv = await fetch(`${base}/tabularius/admin/v1/${path}&format=csv`, { headers: { 'x-tabularius-admin': '1' } });
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get('content-type')!, /text\/csv/);
  const text = await csv.text();
  for (const kind of ['automation-added', 'automation-changed', 'automation-removed']) assert.ok(text.includes(kind));
  assert.match(text, /running Nightly as Admin/);
  assert.ok(!/sekret-path-part|hidden/.test(text));
});
