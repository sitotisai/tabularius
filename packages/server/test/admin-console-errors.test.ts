import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../../store/src/index.ts';
import { serve, Host, Schedules } from '../src/index.ts';
import { AdminApi } from '../src/adminapi.ts';
import { Admin } from '../src/admin.ts';
import { DataApi } from '../src/dataapi.ts';
import { backupFolder, defaultBackupDir, scheduleProgressive } from '../src/backup.ts';
import { ServerConfig } from '../src/server-config.ts';
import { removeAtExit } from '../../../scripts/test-remove-at-exit.ts';

async function setup(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-console-errors-'));
  for (const name of ['Test', 'Second']) {
    const path = join(dir, name + '.openhbam.sqlite');
    createStore(path);
    const store = new Store(path, name);
    store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Title' }] }]);
    store.savePrivilegeSet({ name: 'Reader', records: { view: true, edit: false, create: false, delete: false }, layouts: 'viewOnly', valueLists: 'viewOnly', scripts: 'none', extendedPrivileges: ['fmrest'] });
    store.create('Items', { Title: 'generated' });
    store.close();
  }
  const hosted = await serve({ dir, port: 0, log: () => {} });
  t.after(() => new Promise<void>((resolve) => hosted.server.close(() => resolve())));
  removeAtExit(dir);
  const call = async (path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST') => {
    const r = await fetch(hosted.url + '/tabularius/admin/v1' + path, {
      method, headers: { 'x-tabularius-admin': '1', 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: r.status, body: await r.json() as Record<string, any> };
  };
  return { ...hosted, dir, call };
}

test('#33 missing reconvert source is actionable on both routes', async (t) => {
  const { call } = await setup(t);
  for (const route of ['reconvert-preview', 'reconvert']) {
    const r = await call('/files/Test/' + route, {});
    assert.equal(r.status, 404, JSON.stringify(r));
    assert.match(r.body.error, /Test\.fmp12/);
    assert.match(r.body.error, /restore|read|source/i);
  }
});

test('#40 unknown layout and table parameters are actionable client errors', async (t) => {
  const { call } = await setup(t);
  for (const path of ['/pii/Test?layout=nope', '/who-can?database=Test&table=nope', '/who-can?database=Test']) {
    const r = await call(path);
    assert.equal(r.status, 400, path + JSON.stringify(r));
    assert.match(r.body.error, /layout|table/i);
    assert.doesNotMatch(r.body.error, /Unknown error|Internal server error/);
  }
});

test('#38 an SSO mapping named test can be removed and preview still works', async (t) => {
  const { call } = await setup(t);
  assert.equal((await call('/sso-mapping', { database: 'Test', name: 'test', privilegeSet: 'Reader' })).status, 200);
  const removed = await call('/sso-mapping/test?database=Test', undefined, 'DELETE');
  assert.equal(removed.status, 200);
  assert.equal(removed.body.removed, true);
  assert.equal((await call('/sso-mapping/test?database=Test')).status, 200);
});

test('#34 wrong body types on connections, records and restore return 400', async (t) => {
  const { call, host } = await setup(t);
  assert.equal((await call('/backup', {})).status, 200);
  const cases: [string, unknown][] = [
    ['/connections', []], ['/connections', null],
    ['/connections', { name: ['bad'], type: 's3', config: { bucket: 'generated' } }],
    ['/connections', { name: { toString: 'bad' }, type: 's3', config: { bucket: 'generated' } }],
    ['/records/restore', { database: 42, table: 'Items', recordId: 1, seq: 1 }],
    ['/records/restore', { database: 'Test', table: {}, recordId: 1, seq: 1 }],
    ['/restore', { database: 'Test', at: Date.now(), name: {} }],
    ['/restore', { database: 'Test', at: Date.now(), name: ['Copy'] }],
  ];
  for (const [path, body] of cases) {
    const r = await call(path, body);
    assert.equal(r.status, 400, path + JSON.stringify(r));
    assert.doesNotMatch(r.body.error, /Unknown error|Internal server error/);
  }
  assert.equal(host.names().length, 2, 'no restored copy was created');
  assert.equal((await call('/connections')).body.connections.length, 0);
});

test('#32 settings type errors fail at startup with the key and type', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-config-errors-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, '.openhbam-settings.json'), JSON.stringify({ sessionIdleMinutes: 'bad' }));
  assert.throws(() => new ServerConfig(dir), /sessionIdleMinutes must be a number/);
});

test('#32 invalid edits keep the last valid settings on sign-in hot paths', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-config-edits-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const warnings = t.mock.method(process, 'emitWarning', () => {});
  const config = new ServerConfig(dir);
  config.setBlockNewUsers(true);
  assert.equal(config.blockNewUsers(), true);
  writeFileSync(join(dir, '.openhbam-settings.json'), JSON.stringify({ sessionIdleMinutes: 'bad' }));
  assert.equal(config.blockNewUsers(), true);
  assert.equal(config.sessionIdleMinutes(), 15);
  assert.equal(warnings.mock.callCount(), 1, 'one warning per changed invalid file');
  assert.match(String(warnings.mock.calls[0].arguments[0]), /sessionIdleMinutes must be a number/);
  writeFileSync(join(dir, '.openhbam-settings.json'), JSON.stringify({ sessionIdleMinutes: 30 }));
  assert.equal(config.sessionIdleMinutes(), 30);
  assert.equal(config.blockNewUsers(), false);
});

test('#32 a settings write refuses while another key on disk is invalid, names the key, and leaves disk and memory alone', async (t) => {
  const { call, dir, host } = await setup(t);
  const file = join(dir, '.openhbam-settings.json');
  writeFileSync(file, '{"keep":"abc"}');
  for (const [path, body] of [['/block-new-users', { on: true }], ['/session-timeout', { minutes: 30 }], ['/session-timeout', { minutes: 30, webMinutes: 45 }]] as const) {
    const r = await call(path, body);
    assert.equal(r.status, 409, path + JSON.stringify(r));
    assert.match(r.body.error, /keep must be a number/);
    assert.match(r.body.error, /fix or remove/i);
    assert.ok(!r.body.error.includes(dir), 'the folder path is not in the message');
    assert.equal(readFileSync(file, 'utf8'), '{"keep":"abc"}', path + ' left the file as it was');
  }
  assert.equal(host.config.blockNewUsers(), false);
  assert.equal(host.config.sessionIdleMinutes(), 15);
});

test('#32 the Admin API refuses block-new-users with a client error while the settings file is invalid', async (t) => {
  const { dir, host } = await setup(t);
  t.mock.method(process, 'emitWarning', () => {});
  const control = new AdminApi(new Admin(host, new DataApi(host)), host, new DataApi(host));
  writeFileSync(join(dir, '.openhbam-settings.json'), '{"keep":"abc"}');
  await assert.rejects(async () => control['blockNewUsers']({ blockNewUsers: true }), (e: Error & { status?: number }) => e.status === 409 && /keep must be a number/.test(e.message) && !e.message.includes(dir));
  assert.equal(readFileSync(join(dir, '.openhbam-settings.json'), 'utf8'), '{"keep":"abc"}');
});

test('#32 a session timeout that is partly invalid changes nothing', async (t) => {
  const { call, host } = await setup(t);
  assert.equal((await call('/session-timeout', { minutes: 20 })).status, 200);
  const r = await call('/session-timeout', { minutes: 30, webMinutes: 99999 });
  assert.equal(r.status, 400, JSON.stringify(r));
  assert.equal(host.config.sessionIdleMinutes(), 20);
  assert.equal(host.config.webSessionIdleIsOwn(), false);
});

test('#32 a Host opened without serving on a bad settings file warns once with the file and key and uses defaults', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-lenient-host-'));
  const path = join(dir, 'Test.openhbam.sqlite');
  createStore(path);
  writeFileSync(join(dir, '.openhbam-settings.json'), '{"keep":"abc","blockNewUsers":true}');
  const warnings = t.mock.method(process, 'emitWarning', () => {});
  const host = new Host(dir);
  t.after(() => host.close());
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  assert.deepEqual(host.names(), ['Test']);
  assert.equal(host.config.blockNewUsers(), false, 'defaults, not a half-read file');
  assert.equal(host.config.sessionIdleMinutes(), 15);
  assert.equal(warnings.mock.callCount(), 1, 'one warning, however often the settings are read');
  const text = String(warnings.mock.calls[0].arguments[0]);
  assert.match(text, /\.openhbam-settings\.json/);
  assert.match(text, /keep must be a number/);
  assert.match(text, /fix or remove/i);
});

test('#32 serving on a bad settings file fails at once and says to fix or remove it', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-strict-serve-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  createStore(join(dir, 'Test.openhbam.sqlite'));
  writeFileSync(join(dir, '.openhbam-settings.json'), '{"keep":"abc"}');
  await assert.rejects(serve({ dir, port: 0, log: () => {} }), (e: Error) => /keep must be a number/.test(e.message) && /fix or remove/i.test(e.message));
});

test('#30 replace restore refuses closed and paused files before disrupting them', async (t) => {
  const { call, host } = await setup(t);
  assert.equal((await call('/backup', {})).status, 200);
  for (const state of ['paused', 'closed']) {
    if (state === 'paused') await host.pauseFileEverywhere('Test');
    else await host.closeFileEverywhere('Test');
    const r = await call('/restore', { database: 'Test', at: Date.now(), mode: 'replace' });
    assert.equal(r.status, 409, JSON.stringify(r));
    assert.match(r.body.error, state === 'paused' ? /resume.*file/i : /open.*file/i);
    assert.equal(host.files().find((f) => f.name === 'Test')!.status, state);
  }
});

test('#35 a backup set with no backup.json still restores, as an unsigned set does without a backup key', async (t) => {
  const { call, dir, host } = await setup(t);
  assert.equal((await call('/backup', {})).status, 200);
  const dest = defaultBackupDir(dir);
  const set = readdirSync(dest).find((n) => /^\d/.test(n))!;
  rmSync(join(dest, set, 'backup.json'));
  const copy = await call('/restore', { database: 'Test', at: Date.now(), name: 'Copy' });
  assert.equal(copy.status, 200, JSON.stringify(copy));
  assert.ok(host.get('Copy'));
  const replace = await call('/restore', { database: 'Test', at: Date.now(), mode: 'replace' });
  assert.equal(replace.status, 200, JSON.stringify(replace));
  assert.ok(host.get('Test'));
});

test('#35 external container copy restore is refused without disrupting the live file', async (t) => {
  const { call, dir, host } = await setup(t);
  mkdirSync(join(dir, 'Files', 'Test'), { recursive: true });
  writeFileSync(join(dir, 'Files', 'Test', 'generated.txt'), 'generated container');
  assert.equal((await call('/backup', {})).status, 200);
  const before = host.get('Test');
  const r = await call('/restore', { database: 'Test', at: Date.now(), name: 'Copy' });
  assert.equal(r.status, 409, JSON.stringify(r));
  assert.match(r.body.error, /external container.*replace/i);
  assert.equal(host.get('Test'), before);
  assert.equal(existsSync(join(dir, 'Copy.openhbam.sqlite')), false);
});

test('#31 backup schedules follow the configured folder and later edits', async (t) => {
  const { host, dir } = await setup(t);
  const schedules = new Schedules(host);
  t.after(() => schedules.stop());
  const s = schedules.create({ kind: 'backup', name: 'Generated', everyMinutes: 60, enabled: false });
  for (const folder of ['first', 'edited']) {
    const dest = join(dir, folder);
    mkdirSync(dest);
    host.config.setBackupDir(dest);
    const r = await schedules.run(s.id);
    assert.equal(r.error, 0, r.message);
    assert.equal(existsSync(join(dest, r.result)), true, 'backup uses current configured folder');
  }
});

// Exercise the state transitions directly: no HTTP authentication is changed by this fix.
test('#37 RUNNING reopens the remaining stopped files after an individual open', async (t) => {
  const { host } = await setup(t);
  const api = new DataApi(host);
  const admin = new Admin(host, api);
  const control = new AdminApi(admin, host, api);
  // Private methods are the same transitions used by the authenticated routes.
  const status = (body: Record<string, unknown>) => control['serverStatus'](body);
  await status({ status: 'STOPPED' });
  await control['setStatus']('Test', 'OPENED', {});
  await status({ status: 'RUNNING' });
  assert.ok(host.get('Test'));
  assert.ok(host.get('Second'));
});

test('#37 a partially failed stop retains files for a later RUNNING', async (t) => {
  const { host } = await setup(t);
  const api = new DataApi(host);
  const control = new AdminApi(new Admin(host, api), host, api);
  const close = host.closeFileEverywhere.bind(host);
  let calls = 0;
  const mocked = t.mock.method(host, 'closeFileEverywhere', async (name: string) => {
    if (++calls === 2) throw new Error('synthetic close failure');
    await close(name);
  });
  await assert.rejects(control['serverStatus']({ status: 'STOPPED' }), /synthetic close failure/);
  mocked.mock.restore();
  await control['serverStatus']({ status: 'RUNNING' });
  assert.ok(host.get('Test'));
  assert.ok(host.get('Second'));
});

test('#37 STOPPED closes every open file again after files were opened on their own', async (t) => {
  const { host } = await setup(t);
  const api = new DataApi(host);
  const control = new AdminApi(new Admin(host, api), host, api);
  await control['serverStatus']({ status: 'STOPPED' });
  await control['setStatus']('Test', 'OPENED', {});
  await control['setStatus']('Second', 'OPENED', {});
  await control['serverStatus']({ status: 'STOPPED' });
  assert.equal(host.get('Test'), undefined, 'Test closed by the second STOPPED');
  assert.equal(host.get('Second'), undefined, 'Second closed by the second STOPPED');
  // One file opened on its own: the next STOPPED closes it, and RUNNING reopens everything the stops closed.
  await control['setStatus']('Test', 'OPENED', {});
  await control['serverStatus']({ status: 'STOPPED' });
  assert.equal(host.get('Test'), undefined);
  await control['serverStatus']({ status: 'RUNNING' });
  assert.ok(host.get('Test'));
  assert.ok(host.get('Second'));
});

test('#37 STOPPED retried after a partly failed stop closes the rest', async (t) => {
  const { host } = await setup(t);
  const api = new DataApi(host);
  const control = new AdminApi(new Admin(host, api), host, api);
  const close = host.closeFileEverywhere.bind(host);
  let calls = 0;
  const mocked = t.mock.method(host, 'closeFileEverywhere', async (name: string) => {
    if (++calls === 2) throw new Error('synthetic close failure');
    await close(name);
  });
  await assert.rejects(control['serverStatus']({ status: 'STOPPED' }), /synthetic close failure/);
  mocked.mock.restore();
  assert.deepEqual(await control['serverStatus']({ status: 'STOPPED' }), { status: 'STOPPED' });
  assert.equal(host.get('Test'), undefined);
  assert.equal(host.get('Second'), undefined);
  await control['serverStatus']({ status: 'RUNNING' });
  assert.ok(host.get('Test'));
  assert.ok(host.get('Second'));
});

test('#37 RESUMED on a file that is closed does not drop it from what RUNNING reopens', async (t) => {
  const { host } = await setup(t);
  const api = new DataApi(host);
  const control = new AdminApi(new Admin(host, api), host, api);
  await control['serverStatus']({ status: 'STOPPED' });
  await control['setStatus']('Test', 'RESUMED', {});
  assert.equal(host.get('Test'), undefined, 'RESUMED does not open a file that is closed, not paused');
  await control['serverStatus']({ status: 'RUNNING' });
  assert.ok(host.get('Test'), 'RUNNING still reopens it');
  assert.ok(host.get('Second'));
});

test('#35 external containers with progressive logs are refused before closing', async (t) => {
  const { call, dir, host } = await setup(t);
  mkdirSync(join(dir, 'Files', 'Test'), { recursive: true });
  writeFileSync(join(dir, 'Files', 'Test', 'generated.txt'), 'generated container');
  const progressive = await scheduleProgressive(host, { every: 3_600_000 });
  t.after(() => progressive.stop());
  host.get('Test')!.update('Items', 1, { Title: 'edited' });
  progressive.run();
  const before = host.get('Test');
  const closed = t.mock.method(host, 'closeFileEverywhere');
  const r = await call('/restore', { database: 'Test', at: Date.now(), mode: 'replace' });
  assert.equal(r.status, 409, JSON.stringify(r));
  assert.match(r.body.error, /external container.*base snapshot/i);
  assert.equal(closed.mock.callCount(), 0);
  assert.equal(host.get('Test'), before);
});

test('#33 unexpected reconvert faults stay generic and log their cause; source access errors are actionable', async (t) => {
  const { call, host, dir } = await setup(t);
  const logs = t.mock.method(console, 'error', () => {});
  const preview = t.mock.method(host, 'previewReconvert', async () => { throw new Error('synthetic server fault'); });
  const fault = await call('/files/Test/reconvert-preview', {});
  assert.equal(fault.status, 500);
  assert.equal(fault.body.error, 'Internal server error');
  assert.match(logs.mock.calls.map((c) => String(c.arguments[0])).join('\n'), /synthetic server fault/);
  const logged = logs.mock.callCount();
  assert.ok(logged >= 1, 'the fault was logged');
  preview.mock.mockImplementation(async () => { throw Object.assign(new Error('synthetic access denial'), { code: 'EACCES', path: join(dir, 'Test.fmp12') }); });
  const denied = await call('/files/Test/reconvert-preview', {});
  assert.equal(denied.status, 409);
  assert.match(denied.body.error, /Allow the server to read.*Test.fmp12/);
  assert.equal(logs.mock.callCount(), logged, 'a user mistake is not a server fault');
});

test('#31 console schedules honor folder edits, explicit destinations and preserve unrelated sets', async (t) => {
  const { call, dir } = await setup(t);
  const first = join(dir, 'console-backups');
  const explicit = join(dir, 'explicit-backups');
  mkdirSync(first);
  mkdirSync(explicit);
  await backupFolder(dir, defaultBackupDir(dir), 0, undefined, { now: () => Date.now() - 86_400_000 });
  const before = readdirSync(defaultBackupDir(dir));
  assert.equal((await call('/backup-folder', { folder: first })).status, 200);
  const made = await call('/schedules', { kind: 'backup', name: 'Console generated', everyMinutes: 60, enabled: false, keep: 1 });
  assert.equal(made.status, 201, JSON.stringify(made));
  const id = made.body.id;
  const run = await call(`/schedules/${id}/run`, {});
  assert.equal(run.body.error, 0, JSON.stringify(run));
  assert.ok(existsSync(join(first, run.body.result)));
  assert.deepEqual(readdirSync(defaultBackupDir(dir)), before, 'retention does not prune the default folder');
  assert.equal((await call(`/schedules/${id}`, { dest: explicit }, 'PATCH')).status, 200);
  const overridden = await call(`/schedules/${id}/run`, {});
  assert.equal(overridden.body.error, 0, JSON.stringify(overridden));
  assert.ok(existsSync(join(explicit, overridden.body.result)));
});
