import { withFilesystemHook } from '../../store/src/fs-boundary.ts';
// Installing a plug-in package: trust follows validation and staging, the swap leaves no
// staging folder behind, the plug-in API range is checked, and a torn config file is named and does not hide the list.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, cpSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stopJavaScript } from '../../store/src/javascript.ts';
import { apiSatisfied, parseManifest, HOST_API } from '../src/manifest.ts';
import { generateKey, installPackage, packPlugin, pluginStatus, trustedPublishers, uninstallPlugin } from '../src/index.ts';

const dir = mkdtempSync(join(tmpdir(), 'tabularius-install-robust-'));
after(async () => {
  await stopJavaScript();
  rmSync(dir, { recursive: true });
});

let n = 0;
function source(version = '1.0.0', api = '^1.0'): string {
  const d = join(dir, `src${n++}`);
  mkdirSync(d);
  writeFileSync(join(d, 'plugin.json'), JSON.stringify({ id: 'org.example.shout', name: 'Shout', version, api, publisher: 'Example Co', main: 'main.js', functions: [{ name: 'Pk_Shout', min: 1, max: 1 }] }));
  writeFileSync(join(d, 'main.js'), 'const functions = { Pk_Shout: (s) => s.toUpperCase() };');
  return d;
}
const fresh = () => mkdtempSync(join(dir, 'data-'));

test('an install that stops for another reason does not trust the publisher', () => {
  const key = generateKey();
  const { bytes } = packPlugin(source(), key.privatePem);
  const data = fresh();
  // A folder put there by hand: installing over it needs --replace.
  mkdirSync(join(data, 'plugins', 'org.example.shout'), { recursive: true });
  writeFileSync(join(data, 'plugins', 'org.example.shout', 'plugin.json'), '{}');
  assert.throws(() => installPackage(data, bytes, { trust: key.fingerprint }), /--replace/);
  assert.deepEqual(trustedPublishers(data), {}, 'nobody was trusted');
  const done = installPackage(data, bytes, { trust: key.fingerprint, replace: true });
  assert.equal(done.replaced, 'unpackaged');
  assert.deepEqual(trustedPublishers(data), { [key.fingerprint]: 'Example Co' });
});

test('a replaced plug-in leaves no staging or aside folder', () => {
  const key = generateKey();
  const data = fresh();
  installPackage(data, packPlugin(source('1.0.0'), key.privatePem).bytes, { trust: key.fingerprint });
  installPackage(data, packPlugin(source('1.1.0'), key.privatePem).bytes);
  assert.deepEqual(readdirSync(join(data, 'plugins')).filter((f) => f.startsWith('.')), []);
  assert.equal(pluginStatus(data).installed[0].version, '1.1.0');
});

test('a plug-in written for an API this Tabularius does not offer is refused', () => {
  assert.equal(HOST_API, '1.0');
  for (const [range, ok] of [['^1.0', true], ['^1.1', false], ['^9.0', false], ['~1.0', true], ['~1.1', false], ['>=1.0', true], ['>=2.0', false], ['1.x', true], ['1.0', true], ['1.0.0', true], ['2.x', false], ['*', true], ['latest', false], ['', false]] as const) {
    assert.equal(apiSatisfied(range), ok, range);
  }
  const key = generateKey();
  assert.throws(() => packPlugin(source('1.0.0', '^9.0'), key.privatePem), /needs plug-in API \^9\.0, and this Tabularius offers 1\.0/);
  const parsed = parseManifest({ id: 'org.example.x', name: 'X', version: '1.0.0', api: '^9.0', publisher: 'p', main: 'main.js', functions: [{ name: 'X_A', min: 0 }] });
  assert.equal(parsed.ok, false);
  assert.match(parsed.ok ? '' : parsed.errors.join('; '), /api: needs plug-in API/);
});

test('a torn config file is named, and the plug-in list still shows', () => {
  const key = generateKey();
  const data = fresh();
  installPackage(data, packPlugin(source(), key.privatePem).bytes, { trust: key.fingerprint });
  for (const file of ['enabled.json', 'builtin-off.json']) writeFileSync(join(data, 'plugins', file), '{ "Invoices": [');
  const st = pluginStatus(data);
  assert.deepEqual(st.installed.map((m) => m.id), ['org.example.shout']);
  assert.ok(st.problems.some((p) => p.includes(join(data, 'plugins', 'enabled.json')) && /not valid JSON/.test(p)), st.problems.join('\n'));
  assert.ok(st.problems.some((p) => p.includes('builtin-off.json')), st.problems.join('\n'));
  // The trusted-publishers file blocks an install and says which file it is.
  writeFileSync(join(data, 'plugins', 'trusted-publishers.json'), 'nope');
  const other = generateKey();
  assert.throws(() => installPackage(data, packPlugin(source('2.0.0'), other.privatePem).bytes, { trust: other.fingerprint }), (e: Error) => e.message.includes('trusted-publishers.json') && /not valid JSON/.test(e.message));
  // A torn install record is a problem, not a crash.
  writeFileSync(join(data, 'plugins', 'org.example.shout', 'install.json'), '{');
  assert.ok(pluginStatus(data).problems.some((p) => p.includes('install.json')));
  assert.ok(existsSync(join(data, 'plugins', 'org.example.shout', 'plugin.json')));
});

test('a plug-in id that is a state file of the plug-ins folder is refused, before anything is written', () => {
  for (const id of ['enabled.json', 'builtin-off.json', 'trusted-publishers.json', 'org.example.state.json', 'enabled.json.lock.db', 'trusted-publishers.json.lock.db', 'builtin-off.json.lock.db', 'json.example.plug']) {
    const parsed = parseManifest({ id, name: 'X', version: '1.0.0', api: '^1.0', publisher: 'Example Co', main: 'main.js', functions: [{ name: 'Pk_X', min: 0 }] });
    assert.ok(!parsed.ok && /"json" part/.test(parsed.errors.join()), id);
    const d = source();
    writeFileSync(join(d, 'plugin.json'), JSON.stringify({ id, name: 'X', version: '1.0.0', api: '^1.0', publisher: 'Example Co', main: 'main.js', functions: [{ name: 'Pk_X', min: 0 }] }));
    assert.throws(() => packPlugin(d, generateKey().privatePem), /"json" part/, id);
  }
  // The admin's own file stays a file when a plug-in is installed and enabled.
  const data = fresh();
  mkdirSync(join(data, 'plugins'), { recursive: true });
  writeFileSync(join(data, 'plugins', 'enabled.json'), '{}');
  const key = generateKey();
  installPackage(data, packPlugin(source(), key.privatePem).bytes, { trust: key.fingerprint });
  assert.equal(readdirSync(join(data, 'plugins')).includes('enabled.json'), true);
});

test('replacement requires admin consent for rollback, equal versions and wider permissions', () => {
  const key = generateKey();
  for (const [version, permissions] of [
    ['1.0.0', {}], ['2.0.0', {}], ['3.0.0', { network: ['example.com'] }],
    ['3.0.0', { mail: true }], ['3.0.0', { files: ['documents:write'] }],
    ['3.0.0', { secrets: ['PASSWORD'] }], ['3.0.0', { timeoutMs: 500 }], ['3.0.0', { memoryMb: 128 }],
  ] as const) {
    const data = fresh();
    installPackage(data, packPlugin(source('2.0.0'), key.privatePem).bytes, { trust: key.fingerprint });
    const folder = source(version);
    const path = join(folder, 'plugin.json');
    writeFileSync(path, JSON.stringify({ ...JSON.parse(readFileSync(path, 'utf8')), permissions }));
    const bytes = packPlugin(folder, key.privatePem).bytes;
    assert.throws(() => installPackage(data, bytes), /--replace/);
    assert.equal(pluginStatus(data).installed[0].version, '2.0.0');
    assert.equal(installPackage(data, bytes, { replace: true }).manifest.version, version);
  }
});

test('startup restores an interrupted replacement and removes completed staging', () => {
  const data = fresh();
  installPackage(data, packPlugin(source()).bytes, { allowUnsigned: true });
  const root = join(data, 'plugins');
  const dest = join(root, 'org.example.shout');
  const staging = join(root, '.installing-org.example.shout-Ab1234');
  cpSync(dest, staging, { recursive: true });
  renameSync(dest, staging + '.previous');
  assert.equal(pluginStatus(data).installed[0]?.version, '1.0.0');
  assert.ok(existsSync(dest));
  assert.equal(existsSync(staging), false);
  assert.equal(existsSync(staging + '.previous'), false);
});

test('duplicate ids are refused on load and uninstall', () => {
  const data = fresh();
  installPackage(data, packPlugin(source()).bytes, { allowUnsigned: true });
  cpSync(join(data, 'plugins', 'org.example.shout'), join(data, 'plugins', 'shout.bak'), { recursive: true });
  const status = pluginStatus(data);
  assert.equal(status.installed.length, 0);
  assert.match(status.problems.join('\n'), /duplicate.*org.example.shout/i);
  assert.throws(() => uninstallPlugin(data, 'org.example.shout', []), /Duplicate plug-in id/);
});

test('trust is persisted before the swap and failed aside cleanup does not fail the install', () => {
  const data = fresh();
  installPackage(data, packPlugin(source()).bytes, { allowUnsigned: true });
  const key = generateKey();
  const bytes = packPlugin(source('2.0.0'), key.privatePem).bytes;
  let blocked = false;
  withFilesystemHook((event) => {
    if (event.operation === 'rename' && (event.path.includes('.installing-') || event.path.endsWith('org.example.shout'))) assert.equal(trustedPublishers(data)[key.fingerprint], 'Example Co');
    if (event.operation === 'remove' && event.path.endsWith('.previous')) {
      blocked = true;
      throw Object.assign(new Error('synthetic cleanup failure'), { code: 'EACCES' });
    }
  }, () => assert.equal(installPackage(data, bytes, { replace: true, trust: key.fingerprint }).manifest.version, '2.0.0'));
  assert.ok(blocked);
  assert.equal(pluginStatus(data).installed[0].version, '2.0.0');
  assert.deepEqual(readdirSync(join(data, 'plugins')).filter((f) => f.startsWith('.installing-')), []);
});

test('recovery refuses ambiguous old copies instead of silently rolling back further', () => {
  const data = fresh();
  installPackage(data, packPlugin(source()).bytes, { allowUnsigned: true });
  const root = join(data, 'plugins'), dest = join(root, 'org.example.shout');
  const first = join(root, '.installing-org.example.shout-Ab1234.previous');
  const second = join(root, '.installing-org.example.shout-Cd5678.previous');
  cpSync(dest, first, { recursive: true });
  renameSync(dest, second);
  assert.throws(() => pluginStatus(data), /multiple interrupted installation backups/);
  assert.ok(existsSync(first) && existsSync(second));
  assert.equal(existsSync(dest), false);
});
