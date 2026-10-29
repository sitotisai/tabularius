import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { webcrypto } from 'node:crypto';
import ts from 'typescript';
import { relayedFrom, relayedChange } from '../src/change-relay.ts';

const source = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
const parsed = ts.createSourceFile('main.ts', source, ts.ScriptTarget.Latest, true);
function compiled(name: string) {
  const node = parsed.statements.find((s) => (ts.isFunctionDeclaration(s) || ts.isClassDeclaration(s)) && s.name?.text === name)!;
  return ts.transpileModule(node.getText(parsed), { compilerOptions: { target: ts.ScriptTarget.ES2023 } }).outputText + `\n${name}`;
}
const token = ['synthetic', 'session', 'credential'].join('-');
const nonce = 'a'.repeat(48);
async function start(hash: string, pending?: string) {
  const saved = new Map<string, string>([['tabularius.session', JSON.stringify({ db: 'Own', token: 'own-session' })]]);
  if (pending) saved.set('tabularius.oidcState', pending);
  const opened: unknown[] = [], errors: unknown[] = [], replaced: string[] = [];
  const run = runInNewContext(compiled('start'), {
    URLSearchParams, location: { hash, pathname: '/app/', search: '' },
    history: { replaceState: (_: unknown, __: unknown, url: string) => replaced.push(url) },
    purgeExpiredKept() {}, browserFeatures: () => [], showBrowserFeatureNotice() {},
    sessionStorageGet: (key: string) => saved.get(key), sessionStorageSet: (key: string, value?: string) => value === undefined ? saved.delete(key) : saved.set(key, value),
    RETURN_KEY: 'return', restoreOffline: async () => {},
    Api: class { db: string; token: string; constructor(db: string, token: string) { this.db = db; this.token = token; } },
    Session: class { constructor(api: unknown) { opened.push(api); } async open() {} },
    showLogin: (message?: string) => errors.push(message),
  });
  await run();
  return { saved, opened, errors, replaced };
}

test('an unsolicited token or error fragment cannot replace this tab session or display attacker text', async () => {
  for (const fragment of [`#db=Other&token=${token}`, '#error=attacker-message', `#db=Other&token=${token}&state=wrong`]) {
    const r = await start(fragment, nonce);
    assert.equal(JSON.parse(r.saved.get('tabularius.session')!).db, 'Own');
    assert.equal(r.errors.length, 0);
    assert.deepEqual(r.replaced, ['/app/']);
  }
});

test('the tab accepts and consumes only its own OIDC state once', async () => {
  const r = await start(`#db=Other&token=${token}&state=${nonce}`, nonce);
  assert.equal(JSON.parse(r.saved.get('tabularius.session')!).token, token);
  assert.equal(r.saved.has('tabularius.oidcState'), false);
  const replay = await start(`#db=Other&token=${token}&state=${nonce}`);
  assert.equal(JSON.parse(replay.saved.get('tabularius.session')!).db, 'Own');
});

test('change broadcasts use a session digest and never reveal the bearer token', async () => {
  const channels: { name: string; messages: unknown[]; onmessage?: (e: unknown) => void }[] = [];
  class Channel {
    messages: unknown[] = [];
    name: string; constructor(name: string) { this.name = name; channels.push(this); }
    postMessage(m: unknown) { this.messages.push(m); }
  }
  const Session = runInNewContext(compiled('Session'), { BroadcastChannel: Channel, crypto: webcrypto, TextEncoder, relayedFrom, relayedChange });
  const make = (credential: string) => Object.assign(Object.create(Session.prototype), {
    api: { db: 'Test', token: credential }, sessionLifetime: new AbortController(), home: () => ({ file: 'Test', table: 'Items' }), changed() {},
  });
  const a = make(token), b = make(token), other = make('different-session');
  for (const s of [a, b, other]) await s.relayChanges();
  a.api.wrote({ kind: 'update', recordId: '1' });
  assert.equal(channels[0].name, channels[1].name);
  assert.notEqual(channels[0].name, channels[2].name);
  assert.ok(!JSON.stringify(channels).includes(token));
  assert.notEqual(channels[0].name, 'tabularius.changes.Test');
});

test('the provider button generates and stores a fresh tab nonce before redirecting', () => {
  let handler: ts.Node | undefined;
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && node.expression.getText(parsed).endsWith('.addEventListener') && node.arguments[1]?.getText(parsed).includes('p.start')) handler = node.arguments[1];
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  assert.ok(handler);
  const code = ts.transpileModule(`(${handler.getText(parsed)})`, { compilerOptions: { target: ts.ScriptTarget.ES2023 } }).outputText;
  const saved = new Map<string, string>();
  const location = { href: '' };
  const click = runInNewContext(code, { crypto: webcrypto, location, p: { start: '/tabularius/auth/v1/oidc/start/test' }, fileName: () => 'Test', localStorageSet() {}, sessionStorageSet: (key: string, value: string) => saved.set(key, value) });
  click();
  const first = saved.get('tabularius.oidcState');
  assert.match(first!, /^[a-f0-9]{48}$/);
  assert.equal(new URL(location.href, 'https://example.invalid').searchParams.get('client_state'), first);
  click();
  assert.notEqual(saved.get('tabularius.oidcState'), first);
});

test('only a matching tab state can display a provider error', async () => {
  const r = await start(`#error=provider-refused&state=${nonce}`, nonce);
  assert.deepEqual(r.errors, ['provider-refused']);
  assert.equal(r.saved.has('tabularius.oidcState'), false);
  assert.deepEqual(r.replaced, ['/app/']);
});
