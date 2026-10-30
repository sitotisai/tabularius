import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import * as service from '../src/service.ts';
import { runExposure } from '../src/exposure.ts';
import { commandStubEnv } from '../../../scripts/test-command-stubs.ts';
import type { TestContext } from 'node:test';
import { notOnWindows } from '../../store/test/windows.ts';

// A unit file for another system names that system's paths, so these tests give it paths of that form instead of this computer's.
const linux = () => ({ ...service.defaults('linux'), node: '/usr/bin/node', main: '/srv/tabularius/main.ts' });

function folder(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-a04-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
const main = resolve(import.meta.dirname, '../src/main.ts');
function cli(t: TestContext, args: string[], env = {}, setup = '') {
  const code = `${setup}\nprocess.argv = [process.execPath, ${JSON.stringify(main)}, ...${JSON.stringify(args)}]; await import(${JSON.stringify(new URL('../src/main.ts', import.meta.url).href)});`;
  return spawnSync(process.execPath, ['--no-warnings', '--experimental-test-module-mocks', '--input-type=module', '-e', code], { env: { ...commandStubEnv(t), ...env }, encoding: 'utf8', timeout: 15_000 });
}
const serverUrl = new URL('../../server/src/index.ts', import.meta.url).href;
const mockServe = `import { mock } from 'node:test'; const server = await import(${JSON.stringify(serverUrl)}); mock.module(${JSON.stringify(serverUrl)}, { namedExports: { ...server, serve: async (o) => { console.log(JSON.stringify(o)); throw new Error('TEST STOP'); } } });`;

test('#173 serve refuses unknown and equals options before starting', (t) => {
  const dir = folder(t);
  for (const option of ['--ai-exlude', '--ai-exclude=Payroll', '--capture-only=Staging']) {
    const r = cli(t, ['serve', dir, option], {}, mockServe);
    assert.match(r.stderr, new RegExp(option.split('=')[0]));
    assert.doesNotMatch(r.stderr, /TEST STOP/);
  }
});
test('#173 service generation refuses unknown serve options', () => {
  assert.throws(() => service.serviceFile({ ...linux(), folder: '/tmp/data', port: 8080, host: '127.0.0.1', system: false, extra: ['--ai-exlude', 'Payroll'] }), /--ai-exlude/);
});
test('#177 service generation refuses host and port after separator', () => {
  for (const extra of [['--host', '0.0.0.0'], ['--port', '9000'], ['--port=9000']]) {
    assert.throws(() => service.serviceFile({ ...linux(), folder: '/tmp/data', port: 8080, host: '127.0.0.1', system: false, extra }), /--host|--port/);
  }
});
test('#167 service generation resolves path options against caller directory', () => {
  for (const option of ['--tls-cert', '--tls-key', '--backup-dir', '--ai-key-file', '--oidc-config']) {
    const file = service.serviceFile({ ...linux(), folder: '/tmp/data', port: 8080, host: '127.0.0.1', system: false, extra: [option, 'relative-file'] });
    // A unit file escapes a backslash, so the path of a Windows computer is found with each one doubled.
    assert.ok(file.text.includes(resolve('relative-file')) || file.text.includes(resolve('relative-file').replaceAll('\\', '\\\\')), option);
  }
});
test('#176 folder TLS settings drive health, exposure, refusal and summary', async (t) => {
  const dir = folder(t);
  writeFileSync(join(dir, '.openhbam-settings.json'), JSON.stringify({ tlsCert: 'cert.pem', tlsKey: 'key.pem' }));
  const s = { folder: dir, port: 443, host: '0.0.0.0', extra: [], platform: 'linux' as const, system: false };
  assert.equal(service.healthUrl(s), 'https://127.0.0.1:443/tabularius/health');
  assert.equal(service.servicePlainRefusal(s), undefined);
  assert.match(service.serviceSummary(s, [])[0], /https:/);
  const urls: string[] = [];
  await runExposure({ service: s, probes: { ask: async (url) => { urls.push(url); return undefined; }, addresses: () => [], open: async () => false, sslAnswer: async () => undefined } });
  assert.equal(urls[0], new URL(service.healthUrl(s)).href);
});
test('#169 service messages use the real unit and system scope', () => {
  const source = readFileSync(new URL('../src/service.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /journalctl[^'\n]*Tabularius/);
  const doctor = readFileSync(new URL('../src/doctor.ts', import.meta.url), 'utf8');
  assert.match(doctor, /svc.system \? 'sudo systemctl' : 'systemctl --user'/);
  assert.match(doctor, /start openhbam.service/);
});
test('#170 Windows dependency command passes npm-cli.js as a Node argument', () => {
  // Native Windows execution is unverified; only argument construction is tested here.
  const build = (service as unknown as { dependencyCommand: (platform: string, node: string) => string[] }).dependencyCommand;
  const node = 'C:\\Program Files\\nodejs\\node.exe';
  assert.deepEqual(build('win32', node), [node, 'C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js', 'ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund']);
});
test('#179 MCP metadata describes generated credentials, including loopback', () => {
  const metadata = JSON.parse(readFileSync(new URL('../../../scripts/reference/settings-cli-metadata.json', import.meta.url), 'utf8'));
  for (const entry of [metadata.environment.TABULARIUS_MCP_TOKEN, metadata.environment.TABULARIUS_MCP_TOKEN_FILE, metadata.serveFlags['--mcp-token'], metadata.serveFlags['--mcp-token-file']]) assert.match(entry.default, /administrator token.*\.openhbam-mcp-token/);
});
test('#168 SMTP files honor TABULARIUS_HOME and enforce owner permissions', { skip: notOnWindows('a Windows file has no group or world read bit to refuse') }, (t) => {
  const dir = folder(t);
  for (const [name, args] of [['smtp', ['--send-mail', '--mail-from', 'test@example.invalid']], ['test-smtp', ['--test-outbound', '--mail-redirect', 'test@example.invalid']]] as const) {
    const file = join(dir, name);
    writeFileSync(file, 'smtps://test:password@example.invalid:465', { mode: 0o600 });
    const env = { TABULARIUS_HOME: dir, TABULARIUS_SMTP: '', TABULARIUS_TEST_SMTP: '', TABULARIUS_SMTP_FILE: file, TABULARIUS_TEST_SMTP_FILE: file };
    chmodSync(file, 0o644);
    const refused = cli(t, ['serve', dir, ...args], env, mockServe);
    assert.match(refused.stderr, /chmod 600/);
    chmodSync(file, 0o600);
    const homeEnv = { ...env, TABULARIUS_SMTP_FILE: undefined, TABULARIUS_TEST_SMTP_FILE: undefined };
    const accepted = cli(t, ['serve', dir, ...args], homeEnv, mockServe);
    assert.match(accepted.stdout, /smtps:/);
  }
});
test('#178 demo handles signals during startup and after readiness', (t) => {
  const demoUrl = new URL('../src/demo.ts', import.meta.url).href;
  for (const signal of ['SIGHUP', 'SIGINT', 'SIGTERM']) for (const duringStartup of [true, false]) {
    const setup = `import { mock } from 'node:test'; mock.module(${JSON.stringify(demoUrl)}, { namedExports: { startDemo: async () => { ${duringStartup ? `process.emit(${JSON.stringify(signal)});` : `setImmediate(() => process.emit(${JSON.stringify(signal)}));`} return { stop: async () => console.log('CLEANED') }; } } });`;
    const r = cli(t, ['demo', '--no-open'], {}, setup);
    assert.match(r.stdout, /CLEANED/, r.stderr);
  }
});

test('#167 service startup failure is reported without a hosting claim', async () => {
  const o = { ...service.defaults('linux'), folder: '/tmp/data', port: 8080, host: '127.0.0.1', system: false, extra: [] };
  let checked = false;
  await assert.rejects(service.verifyServiceStarted(o, async (url, since, ms) => {
    checked = true;
    assert.equal(url, service.healthUrl(o));
    assert.equal(since, 123);
    assert.equal(ms, 20_000);
    return false;
  }, 123), /registered, but it did not answer/);
  assert.equal(checked, true);
});
test('CLI backup uses folder settings and explicit destination wins', (t) => {
  const dir = folder(t);
  writeFileSync(join(dir, '.openhbam-settings.json'), JSON.stringify({ backupDir: 'saved-backups' }));
  const setup = `import { mock } from 'node:test'; const server = await import(${JSON.stringify(serverUrl)}); mock.module(${JSON.stringify(serverUrl)}, { namedExports: { ...server, backupFolder: async (_folder, dest) => { console.log('DEST=' + dest); return { files: [], dir: dest, removed: [] }; } } });`;
  const r = cli(t, ['backup', dir], { TABULARIUS_BACKUP_DIR: undefined }, setup);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes('DEST=' + join(dir, 'saved-backups')));
  const explicit = cli(t, ['backup', dir, '--to', join(dir, 'explicit')], { TABULARIUS_BACKUP_DIR: join(dir, 'environment') }, setup);
  assert.ok(explicit.stdout.includes('DEST=' + join(dir, 'explicit')));
});
test('serve option registry covers help, preserves repeated origins and forwarded restrictions', () => {
  const metadata = JSON.parse(readFileSync(new URL('../../../scripts/reference/settings-cli-metadata.json', import.meta.url), 'utf8'));
  for (const flag of Object.keys(metadata.serveFlags)) {
    // A recognized value option can reject only a missing value, never its name.
    try { service.validateServeOptions([flag]); }
    catch (error) { assert.match((error as Error).message, /needs (a non-empty value|a value|an address)/); }
  }
  service.validateServeOptions(['--mcp-origin', 'https://one.example', '--mcp-origin', 'https://two.example']);
  const text = service.serviceFile({ ...linux(), folder: '/tmp/data', port: 8080, host: '127.0.0.1', system: false, extra: ['--capture-only', 'Staging', '--ai-exclude', 'Payroll', '--allow-plain-http'] }).text;
  assert.match(text, /"--capture-only" "Staging" "--ai-exclude" "Payroll" "--allow-plain-http"/);
});
test('#178 demo removes its temporary folder on process exit', (t) => {
  const code = `
    import { mock } from 'node:test';
    import { existsSync } from 'node:fs';
    const server = await import(${JSON.stringify(serverUrl)});
    mock.module(${JSON.stringify(serverUrl)}, { namedExports: { ...server, serve: async () => ({ url: 'http://127.0.0.1:1', host: { close: async () => {} }, server: { close: (done) => done() } }) } });
    const { startDemo } = await import(${JSON.stringify(new URL('../src/demo.ts', import.meta.url).href)});
    const demo = await startDemo();
    process.emit('exit', 1);
    const removed = !existsSync(demo.folder);
    await demo.stop();
    if (!removed) throw new Error('temporary folder survived process exit');
  `;
  const r = spawnSync(process.execPath, ['--no-warnings', '--experimental-test-module-mocks', '--input-type=module', '-e', code], { env: commandStubEnv(t), encoding: 'utf8', timeout: 15_000 });
  assert.equal(r.status, 0, r.stderr);
});

test('#173 rejected equals options name the option without revealing the value', (t) => {
  const secret = ['private', 'credential', 'value'].join('-');
  const r = cli(t, ['serve', folder(t), '--mcp-token=' + secret], {}, mockServe);
  assert.match(r.stderr, /--mcp-token/);
  assert.ok(!r.stderr.includes(secret));
  assert.doesNotMatch(r.stderr, /TEST STOP/);
});
