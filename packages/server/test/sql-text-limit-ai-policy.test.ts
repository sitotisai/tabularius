// With the AI policy on, the MCP wrapper plans the read set of a tool's SQL (and of an ExecuteSQL literal in a formula)
// before the tool runs, and that planning tokenizes the text several times over: it is held to the same size limit,
// refused for its size at once rather than after seconds of analysis.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { MAX_SQL_TEXT } from '../../store/src/index.ts';
import { Host } from '../src/host.ts';
import { createMcpServer } from '../src/mcp.ts';

async function fixture(t: import('node:test').TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'ai-policy-size-'));
  const host = new Host(dir, () => {}, { background: false });
  const store = host.create('Shop');
  store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name' }] }]);
  store.create('Items', { Name: 'visible' });
  const server = createMcpServer(host, { admin: true });
  const client = new Client({ name: 'policy-size-test', version: '1' });
  t.after(async () => { await client.close(); await server.close(); await host.close(); rmSync(dir, { recursive: true, force: true }); });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a); await client.connect(b);
  return (name: string, args: Record<string, unknown>) => client.callTool({ name, arguments: { database: 'Shop', ...args } });
}

const big = ` ${' '.repeat(MAX_SQL_TEXT)}`;

test('a long sql_query is refused for its size, quickly, on a file with the AI policy on', async (t) => {
  const call = await fixture(t);
  assert.equal((await call('sql_query', { sql: 'SELECT Name FROM Items' })).isError, undefined, 'short SQL is not affected');
  const began = Date.now();
  const result = await call('sql_query', { sql: `SELECT Name FROM Items${big}` });
  assert.equal(result.isError, true);
  assert.match(JSON.stringify(result), /larger than 1 MB/);
  assert.ok(Date.now() - began < 5000, 'refused at once');
});

test('an ExecuteSQL literal that long in a formula is refused quickly (the formula analysis limit speaks first)', async (t) => {
  const call = await fixture(t);
  const began = Date.now();
  const result = await call('evaluate_calculation', { layout: 'Items', recordId: 1, formula: `ExecuteSQL ( "SELECT Name FROM Items${big}" ; "" ; "" )` });
  assert.equal(result.isError, true);
  assert.match(JSON.stringify(result), /larger than 1 MB|analysis limit/);
  assert.ok(Date.now() - began < 5000, 'refused at once');
});
