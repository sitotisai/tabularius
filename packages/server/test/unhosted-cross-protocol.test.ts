import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import crypto from 'node:crypto';
import { syncBuiltinESMExports } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { connect, type Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from '../../store/src/index.ts';
import { serve } from '../src/index.ts';
import { PgServer } from '../src/pgwire.ts';

function refusedPg(port: number, database: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = connect(port, '127.0.0.1');
    let data = Buffer.alloc(0);
    let sent = false;
    socket.on('error', reject);
    socket.setTimeout(10_000, () => socket.destroy(new Error('PostgreSQL sign-in timed out')));
    socket.on('connect', () => {
      const params = Buffer.from(`user\0Ann\0database\0${database}\0\0`);
      const head = Buffer.alloc(8);
      head.writeInt32BE(8 + params.length);
      head.writeInt32BE(196608, 4);
      socket.write(Buffer.concat([head, params]));
    });
    socket.on('data', (chunk) => {
      data = Buffer.concat([data, chunk]);
      while (data.length >= 5 && data.length >= data.readInt32BE(1) + 1) {
        const type = String.fromCharCode(data[0]);
        const length = data.readInt32BE(1);
        const body = data.subarray(5, length + 1);
        data = data.subarray(length + 1);
        if (type === 'R' && !sent) {
          sent = true;
          const password = Buffer.from('wrong\0');
          const head = Buffer.alloc(5);
          head.write('p');
          head.writeInt32BE(password.length + 4, 1);
          socket.write(Buffer.concat([head, password]));
        } else if (type === 'E') {
          socket.destroy();
          resolve(body.toString());
          return;
        }
      }
    });
    socket.on('close', () => resolve('closed'));
  });
}

test('five PostgreSQL failures lock the same account for Data API sign-in at hosted and invented names', { timeout: 30_000 }, async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-cross-protocol-'));
  createStore(join(dir, 'Hosted.openhbam.sqlite'), { mode: 'native' });
  const running = await serve({ dir, port: 0, hostname: '127.0.0.1', watch: false, log: () => {}, proxyHeader: 'x-forwarded-for', trustedProxies: ['127.0.0.1'] });
  const store = running.host.get('Hosted')!;
  store.setPassword('Ann', 'right', '[Full Access]');
  const pg = new PgServer(running.host, { port: 0 });
  const address = '198.51.100.41';
  t.mock.method(pg, 'isLocal', (socket: Socket) => {
    Object.defineProperty(socket, 'remoteAddress', { value: address, configurable: true });
    return true;
  });
  const port = await pg.listen();
  try {
    for (const database of ['Hosted', 'Invented']) {
      for (let i = 0; i < 5; i++) assert.match(await refusedPg(port, database), /password authentication failed/);
    }
    const result = async (database: string) => {
      const response = await fetch(`${running.url}/fmi/data/vLatest/databases/${database}/sessions`, {
        method: 'POST', headers: { authorization: 'Basic ' + Buffer.from('Ann:wrong').toString('base64'), 'content-type': 'application/json', 'x-forwarded-for': address }, body: '{}',
      });
      return { status: response.status, wait: response.headers.get('retry-after'), body: (await response.text()).replaceAll(database, '<file>').replace(/\d{4}-\d\d-\d\dT[\d:.]+Z/, '<time>') };
    };
    const hosted = await result('Hosted');
    const invented = await result('Invented');
    assert.ok(hosted.wait, 'the hosted account is locked after PostgreSQL failures');
    assert.deepEqual(invented, hosted);
  } finally {
    pg.close();
    await new Promise<void>((resolve) => running.server.close(() => resolve()));
    rmSync(dir, { recursive: true, force: true });
  }
});

test('AI-app sign-in checks and counts a wrong password at an invented name', { timeout: 30_000 }, async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-oauth-unhosted-'));
  createStore(join(dir, 'Hosted.openhbam.sqlite'), { mode: 'native' });
  const running = await serve({ dir, port: 0, hostname: '127.0.0.1', watch: false, log: () => {} });
  const hashes = t.mock.method(crypto, 'scrypt');
  syncBuiltinESMExports();
  try {
    const redirect = 'https://client.example/callback';
    const registration = await fetch(`${running.url}/oauth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ client_name: 'Synthetic client', redirect_uris: [redirect] }) });
    assert.equal(registration.status, 201);
    const { client_id } = await registration.json() as { client_id: string };
    const verifier = randomBytes(32).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    const params = { client_id, redirect_uri: redirect, response_type: 'code', code_challenge: challenge, code_challenge_method: 'S256' };
    const page = await fetch(`${running.url}/oauth/authorize?${new URLSearchParams(params)}`);
    const html = await page.text();
    const cookie = page.headers.get('set-cookie')?.split(';')[0] ?? '';
    const fields = Object.fromEntries([...html.matchAll(/<input type="hidden" name="([^"]+)" value="([^"]*)">/g)].map((match) => [match[1], match[2].replace(/&amp;/g, '&')]));
    const attempt = async (database = 'Invented') => {
      const response = await fetch(`${running.url}/oauth/authorize`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', cookie }, body: new URLSearchParams({ ...fields, database, account: 'Ann', password: 'wrong' }) });
      assert.equal(response.status, 401);
      const text = await response.text();
      assert.match(text, /Wrong account or password/);
      assert.doesNotMatch(text, /Too many failed sign-ins/);
    };
    const before = hashes.mock.callCount();
    await attempt();
    assert.equal(hashes.mock.callCount() - before, 1, 'an invented name spends one scrypt check');
    const failures = running.host.unhostedSignIns.table('Invented');
    assert.equal(failures.get(failures.accountKey('Ann', '127.0.0.1', 'Invented'))?.count, 1);
    for (let i = 1; i < 5; i++) await attempt();
    assert.ok(failures.lockedOut(failures.accountKey('Ann', '127.0.0.1', 'Invented'), '127.0.0.1'));
    assert.equal(hashes.mock.callCount() - before, 5);
    await attempt();
    assert.equal(hashes.mock.callCount() - before, 5, 'a locked AI-app sign-in skips the password check');
    running.host.config.setBlockNewUsers(true);
    const blockedBefore = hashes.mock.callCount();
    await attempt('Hosted');
    await attempt('AnotherInvented');
    assert.equal(hashes.mock.callCount(), blockedBefore, 'the server-wide sign-in block skips both password checks');
    assert.equal(running.host.unhostedSignIns.table('AnotherInvented').size, 0, 'the server-wide block records no password failure');
  } finally {
    hashes.mock.restore();
    syncBuiltinESMExports();
    await new Promise<void>((resolve) => running.server.close(() => resolve()));
    rmSync(dir, { recursive: true, force: true });
  }
});
