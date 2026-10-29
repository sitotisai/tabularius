// A wrong password for a file that is not hosted counts toward a lockout as it does for a hosted file, on every HTTP surface that
// takes a password, so a guessed file name is not told apart by the answer that comes after five failures.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../../store/src/index.ts';
import { serve } from '../src/index.ts';
import { SignInFailures } from '../../store/src/sign-in-failures.ts';

let dir: string;
let served: Awaited<ReturnType<typeof serve>>;
const basic = (user: string, password: string) => 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64');

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'tabularius-unhosted-lockout-'));
  const path = join(dir, 'Real.openhbam.sqlite');
  createStore(path, { mode: 'native' });
  const store = new Store(path, 'Real');
  try {
    store.applyDesign([{ op: 'createTable', name: 'T', fields: [{ name: 'A', type: 'text' }] }]);
    const full = store.privilegeSets().find((p) => p.id === 1)!;
    store.savePrivilegeSet({ ...full, extendedPrivileges: [...full.extendedPrivileges, 'fmxdbc', 'fmodata', 'fmxml'] });
    store.setPassword('Ann', 'pw', full.name);
  } finally { store.close(); }
  served = await serve({ dir, port: 0, hostname: '127.0.0.1', watch: false, log: () => {} });
});
after(async () => {
  await new Promise<void>((resolve) => served.server.close(() => resolve()));
  if (dir) rmSync(dir, { recursive: true, force: true });
});

const surfaces: [string, (db: string, user: string) => Promise<Response>][] = [
  ['Data API sign-in', (db, user) => fetch(`${served.url}/fmi/data/vLatest/databases/${db}/sessions`, { method: 'POST', headers: { authorization: basic(user, 'wrong'), 'content-type': 'application/json' }, body: '{}' })],
  ['Data API passkey second factor', (db, user) => fetch(`${served.url}/fmi/data/vLatest/databases/${db}/sessions/passkey-2fa`, { method: 'POST', headers: { authorization: basic(user, 'wrong'), 'content-type': 'application/json' }, body: '{}' })],
  ['OData', (db, user) => fetch(`${served.url}/fmi/odata/v4/${db}/T`, { headers: { authorization: basic(user, 'wrong') } })],
  ['XML', (db, user) => fetch(`${served.url}/fmi/xml/fmresultset.xml?-db=${db}&-lay=T&-findall`, { headers: { authorization: basic(user, 'wrong') } })],
  ['SQL over HTTP', (db, user) => fetch(`${served.url}/tabularius/sql/v1/databases/${db}/tables`, { headers: { authorization: basic(user, 'wrong') } })],
];

/** What a caller sees from eight wrong passwords in a row: the status, whether it is told to wait, and the words, with the file name taken out. */
async function eight(call: (db: string, user: string) => Promise<Response>, db: string, user: string) {
  const seen: string[] = [];
  for (let i = 0; i < 8; i++) {
    const res = await call(db, user);
    const text = (await res.text()).replaceAll(db, '<file>').replace(/\d{4}-\d\d-\d\dT[\d:.]+Z/, '<time>');
    seen.push(`${res.status} wait=${res.headers.has('retry-after')} ${text}`);
  }
  return seen;
}

for (const [name, call] of surfaces) {
  test(`${name}: eight wrong passwords end the same for a hosted file and one that is not hosted`, { timeout: 60_000 }, async () => {
    const hosted = await eight(call, 'Real', 'Ann' + name.replace(/\W/g, ''));
    const missing = await eight(call, 'Missing' + name.replace(/\W/g, ''), 'Ann' + name.replace(/\W/g, ''));
    assert.equal(hosted.filter((s) => s.includes('wait=true')).length, 4, 'the fifth wrong password locks a hosted file');
    assert.deepEqual(missing, hosted);
  });
}

test('a wrong password for a file that is not hosted is not counted against a hosted file of the same account name', { timeout: 30_000 }, async () => {
  const [, call] = surfaces[0];
  await eight(call, 'Missing', 'Shared');
  const res = await call('Real', 'Shared');
  assert.equal(res.headers.has('retry-after'), false);
});

// From a real address (a trusted proxy names it) a source also has a budget of its own, spent by failures for any name.
test('an address that spends its budget on invented accounts is refused the same way at a hosted file and one that is not hosted', { timeout: 120_000 }, async () => {
  const proxied = await serve({ dir, port: 0, hostname: '127.0.0.1', watch: false, log: () => {}, proxyHeader: 'x-forwarded-for', trustedProxies: ['127.0.0.1'] });
  try {
    const attempt = async (db: string, address: string, i: number) => {
      const res = await fetch(`${proxied.url}/fmi/odata/v4/${db}/T`, { headers: { authorization: basic(`Invented${i}`, 'wrong'), 'x-forwarded-for': address } });
      return `${res.status} wait=${res.headers.has('retry-after')} ${(await res.text()).replaceAll(db, '<file>').replace(/\d{4}-\d\d-\d\dT[\d:.]+Z/, '<time>')}`;
    };
    const run = async (db: string, address: string) => {
      const seen: string[] = [];
      for (let i = 0; i < 36; i++) seen.push(await attempt(db, address, i));
      return seen;
    };
    const hosted = await run('Real', '198.51.100.7');
    const missing = await run('MissingFile', '198.51.100.8');
    assert.ok(hosted.some((s) => s.includes('wait=true')), 'thirty failures from one address lock it at a hosted file');
    assert.deepEqual(missing, hosted);
    const passkey = async (db: string, address: string) => {
      const seen: string[] = [];
      for (let i = 0; i < 36; i++) {
        const res = await fetch(`${proxied.url}/fmi/data/vLatest/databases/${db}/sessions/passkey`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': address },
          body: JSON.stringify({ response: { credentialId: 'a', challenge: 'b', clientDataJSON: 'c', authenticatorData: 'd', signature: 'e' } }) });
        seen.push(`${res.status} wait=${res.headers.has('retry-after')} ${(await res.text()).replaceAll(db, '<file>').replace(/\d{4}-\d\d-\d\dT[\d:.]+Z/, '<time>')}`);
      }
      return seen;
    };
    const realPasskey = await passkey('Real', '198.51.100.9');
    const missingPasskey = await passkey('MissingFile', '198.51.100.10');
    assert.ok(realPasskey.some((s) => s.includes('wait=true')), 'thirty bad assertions from one address lock it at a hosted file');
    assert.deepEqual(missingPasskey, realPasskey);
  } finally { await new Promise<void>((resolve) => proxied.server.close(() => resolve())); }
});

test('an address locked out at one invented name is not locked at another name or a hosted file, and recovery codes share the address budget of passwords', { timeout: 180_000 }, async () => {
  const proxied = await serve({ dir, port: 0, hostname: '127.0.0.1', watch: false, log: () => {}, proxyHeader: 'x-forwarded-for', trustedProxies: ['127.0.0.1'] });
  try {
    const odata = (db: string, address: string, i: number) => fetch(`${proxied.url}/fmi/odata/v4/${db}/T`, { headers: { authorization: basic(`Spend${i}`, 'wrong'), 'x-forwarded-for': address } });
    const recovery = (db: string, address: string) => fetch(`${proxied.url}/fmi/data/vLatest/databases/${db}/sessions/recovery`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': address }, body: JSON.stringify({ account: 'Ann', code: 'wrong' }) });
    const shape = async (res: Response) => `${res.status} wait=${res.headers.has('retry-after')}`;
    // One address spends its whole budget at the name Burn.
    for (let i = 0; i < 31; i++) await odata('Burn', '203.0.113.1', i);
    assert.equal(await shape(await odata('Burn', '203.0.113.1', 99)), '401 wait=true');
    // It is not locked at a second invented name, as it is not locked at a second hosted file.
    assert.equal(await shape(await odata('OtherName', '203.0.113.1', 0)), '401 wait=false');
    assert.equal(await shape(await odata('Real', '203.0.113.1', 0)), '401 wait=false');
    // At one name, passwords and recovery codes spend one address budget, hosted or not.
    for (const db of ['Real', 'Gone']) {
      for (let i = 0; i < 31; i++) await odata(db, '203.0.113.2', i);
      const res = await recovery(db, '203.0.113.2');
      assert.equal(await shape(res), '401 wait=true', db);
      assert.match((await res.text()).replaceAll(db, '<file>'), /Too many failed sign-ins/);
    }
  } finally { await new Promise<void>((resolve) => proxied.server.close(() => resolve())); }
});

test('a file name as long as a request line allows keeps the key short', () => {
  const failures = new SignInFailures();
  const key = failures.accountKey('Ann', '198.51.100.1', 'x'.repeat(60_000));
  assert.ok(key.length < 400, `${key.length} characters`);
  assert.notEqual(key, failures.accountKey('Ann', '198.51.100.1', 'x'.repeat(59_999)));
  assert.equal(failures.accountKey('Ann', '198.51.100.1', 'Name'), failures.accountKey('Ann', '198.51.100.1', 'NAME'));
});
