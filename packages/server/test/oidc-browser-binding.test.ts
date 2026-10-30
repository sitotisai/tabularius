import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Host } from '../src/host.ts';
import { DataApi } from '../src/dataapi.ts';
import { Oidc } from '../src/oidc.ts';
import { expiryClock } from '../../store/src/clock.ts';
import { removeAtExit } from '../../../scripts/test-remove-at-exit.ts';

async function setup(t: TestContext, formPost = false, secure = true) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-oidc-binding-'));
  const host = new Host(dir, () => {}, { background: false }); host.create('Test');
  const oidc = new Oidc(host, new DataApi(host), { name: 'Test', issuer: 'https://idp.invalid', clientId: 'test', formPost }, secure ? 'https://server.invalid' : 'http://server.invalid');
  t.after(async () => { oidc.close(); await host.close(); });
  removeAtExit(dir);
  const internals = oidc as unknown as { config(): Promise<unknown>; finish(p: unknown): Promise<void> };
  t.mock.method(internals, 'config', async () => ({ issuer: 'https://idp.invalid', authorization_endpoint: 'https://idp.invalid/authorize' }));
  const finish = t.mock.method(internals, 'finish', async () => {});
  const response = () => {
    const headers: Record<string, string> = {};
    let setCookies: string[] = [];
    const res = { setHeader(k: string, v: string | string[]) { if (k === 'set-cookie') setCookies = Array.isArray(v) ? v : [v]; headers[k.toLowerCase()] = Array.isArray(v) ? v.at(-1)! : v; }, writeHead(_status: number, values: Record<string, string>) { Object.assign(headers, values); return res; }, end() {} };
    return { res: res as unknown as ServerResponse, headers, cookies: () => setCookies };
  };
  const req = (path: string, cookie?: string) => ({ method: 'GET', url: path, socket: { remoteAddress: '127.0.0.1', encrypted: secure }, headers: { host: 'server.invalid', ...(cookie ? { cookie } : {}) } } as unknown as IncomingMessage);
  const call = async (path: string, cookie?: string) => { const r = response(); await oidc.handle(req(path, cookie), r.res, new URL(path, 'https://server.invalid')); return r.headers; };
  const start = async (ai = false, cookieHeader?: string) => {
    let setCookies: string[] = [];
    let headers: Record<string, string>;
    if (ai) {
      const r = response(); await oidc.begin('test', 'Test', req('/'), r.res, { done() {}, fail() {} }); headers = r.headers; setCookies = r.cookies();
    } else {
      const path = '/tabularius/auth/v1/oidc/start/test?db=Test&client_state=' + 'a'.repeat(48);
      const r = response(); await oidc.handle(req(path, cookieHeader), r.res, new URL(path, 'https://server.invalid'));
      headers = r.headers; setCookies = r.cookies();
    }
    const state = new URL(headers.location, 'https://server.invalid').searchParams.get('state')!;
    const cookie = headers['set-cookie']?.split(';')[0];
    return { headers, state, cookie, setCookies, callback: '/tabularius/auth/v1/oidc/callback?code=test&state=' + state };
  };
  return { start, call, finish };
}

for (const ai of [false, true]) test(`OIDC ${ai ? 'AI' : 'web'} callbacks require the initiating browser cookie before consuming state`, async (t) => {
  const s = await setup(t);
  const a = await s.start(ai), b = await s.start(ai);
  await s.call(a.callback);
  assert.equal(s.finish.mock.callCount(), 0, 'a callback link alone cannot complete sign-in');
  await s.call(a.callback, b.cookie);
  assert.equal(s.finish.mock.callCount(), 0, 'another browser flow cannot complete it');
  assert.match(a.headers['set-cookie'], /HttpOnly/);
  assert.match(a.headers['set-cookie'], /SameSite=Lax/);
  assert.match(a.headers['set-cookie'], /Secure/);
  assert.match(a.headers['set-cookie'], /Max-Age=600/);
  const accepted = await s.call(a.callback, a.cookie);
  assert.equal(s.finish.mock.callCount(), 1, 'a refused callback did not consume the legitimate browser state');
  assert.match(accepted['set-cookie'], /Max-Age=0/);
  await s.call(a.callback, a.cookie);
  assert.equal(s.finish.mock.callCount(), 1, 'state is single use');
  await s.call(b.callback, b.cookie);
  assert.equal(s.finish.mock.callCount(), 2, 'parallel browser flows keep their own cookies');
});

test('form-post OIDC uses a Secure cross-site cookie and refuses HTTP', async (t) => {
  const secure = await setup(t, true);
  const a = await secure.start();
  assert.match(a.headers['set-cookie'], /SameSite=None/);
  assert.match(a.headers['set-cookie'], /Secure/);
  const insecure = await setup(t, true, false);
  const b = await insecure.start();
  assert.equal(b.state, null);
  assert.match(decodeURIComponent(b.headers.location), /HTTPS/);
});

test('an OIDC cookie does not revive expired state after clock edits', async (t) => {
  const s = await setup(t);
  let now = expiryClock.now();
  t.mock.method(expiryClock, 'now', () => now);
  const a = await s.start();
  now += 600_001;
  await s.call(a.callback, a.cookie);
  now -= 600_001;
  await s.call(a.callback, a.cookie);
  assert.equal(s.finish.mock.callCount(), 0);
});


test('abandoned OIDC starts keep the browser cookie list bounded', async (t) => {
  const s = await setup(t);
  const jar = new Map<string, string>();
  for (let i = 0; i < 25; i++) {
    const flow = await s.start(false, [...jar.values()].join('; '));
    for (const cookie of flow.setCookies) {
      const pair = cookie.split(';')[0], name = pair.split('=')[0];
      if (/Max-Age=0(?:;|$)/.test(cookie)) jar.delete(name); else jar.set(name, pair);
    }
    assert.ok(jar.size <= 20, 'abandoned flows cannot grow the browser Cookie header without bound');
  }
});
