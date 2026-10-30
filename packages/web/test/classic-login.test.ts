import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Api, ApiError, listDatabases } from '../src/api.ts';

test('#153 non-JSON gateway failures are actionable API errors', async (t) => {
  for (const status of [502, 503]) {
    t.mock.method(globalThis, 'fetch', async () => new Response('Unavailable', { status }));
    for (const call of [listDatabases, () => Api.login('Synthetic', 'Account', '')]) {
      await assert.rejects(call, (e: unknown) => e instanceof ApiError && e.status === status && !e.message.includes('Unexpected'));
    }
  }
});

test('#154 the classic boot path only discards a saved session on HTTP 401', async () => {
  const { readFileSync } = await import('node:fs');
  for (const path of ['../src/main.ts']) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.match(source, /catch \(e\) \{\s*if \(e instanceof ApiError && e.status === 401\)/);
  }
});

test('#154 classic: transient boot errors retain the token and offline key; HTTP 401 removes them', async () => {
  const { readFileSync } = await import('node:fs');
  const { stripTypeScriptTypes } = await import('node:module');
  const { default: vm } = await import('node:vm');
  // The next client classifies a failed boot with sessionFailure (next/signin.ts), which has its own tests.
  for (const client of ['src']) {
    const source = readFileSync(new URL(`../${client}/main.ts`, import.meta.url), 'utf8');
    const start = source.indexOf(client === 'src' ? "  const saved = sessionStorageGet('tabularius.session');" : '  const saved = stored(SESSION);');
    const end = source.indexOf(client === 'src' ? '  await showLogin();' : '\n  signIn();', start);
    for (const failure of [new TypeError('offline'), new ApiError(-1, 'restart', undefined, 503), new ApiError(401, 'no matching records', undefined, 500), new ApiError(952, 'expired', undefined, 401)]) {
      let saved: string | undefined = JSON.stringify({ db: 'Synthetic', token: 'session', offline: { key: 'synthetic' } });
      const original = saved;
      const code = stripTypeScriptTypes(`(async () => { ${source.slice(start, end)} })()`);
      await vm.runInNewContext(code, {
        ApiError, Api: class { async menu() { throw failure; } }, Session: class { async open() { throw failure; } },
        SESSION: 'tabularius.session', from: undefined, restoreOffline: async () => {}, showBrowserFeatureNotice() {}, toast() {}, signIn() {},
        sessionStorageGet: () => saved, stored: () => saved,
        sessionStorageSet: (_k: string, v?: string) => { saved = v; }, store: (_k: string, v?: string) => { saved = v; },
      });
      assert.equal(saved, failure instanceof ApiError && failure.status === 401 ? undefined : original);
    }
  }
});
