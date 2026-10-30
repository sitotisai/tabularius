// The Windows test preload that makes each `fetch` use its own connection (scripts/test-windows-fetch.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { closingConnections } from './test-windows-fetch.ts';

const withServer = async (run: (url: string, seen: { connection?: string; socket: unknown }[]) => Promise<void>) => {
  const seen: { connection?: string; socket: unknown }[] = [];
  const server = createServer((req, res) => {
    seen.push({ connection: req.headers.connection, socket: req.socket });
    res.end('ok');
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try { await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}/`, seen); }
  finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
};

test('each request asks for its connection to be closed and gets one of its own', async () => {
  await withServer(async (url, seen) => {
    const closing = closingConnections(fetch);
    assert.equal(await (await closing(url)).text(), 'ok');
    assert.equal(await (await closing(url, { method: 'POST', body: 'x', headers: { 'content-type': 'text/plain' } })).text(), 'ok');
    assert.equal(await (await closing(new Request(url, { headers: { 'x-a': '1' } }))).text(), 'ok');
    assert.deepEqual(seen.map((s) => s.connection), ['close', 'close', 'close']);
    assert.equal(new Set(seen.map((s) => s.socket)).size, 3, 'a new connection for every request');
  });
});

test('a request that names its own connection header keeps it', async () => {
  await withServer(async (url, seen) => {
    await (await closingConnections(fetch)(url, { headers: { connection: 'keep-alive' } })).text();
    assert.equal(seen[0].connection, 'keep-alive');
  });
});
