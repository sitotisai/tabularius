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

// Token-heavy on purpose: the planner reads each token several times over, so this is what costs seconds (padding with
// spaces would pass quickly even without the check).
const heavy = `SELECT Name FROM Items WHERE Name IN (${"'a',".repeat(MAX_SQL_TEXT / 4)}'a')`;

test('a long sql_query is refused for its size, quickly, on a file with the AI policy on', async (t) => {
  const call = await fixture(t);
  assert.equal((await call('sql_query', { sql: 'SELECT Name FROM Items' })).isError, undefined, 'short SQL is not affected');
  assert.ok(heavy.length > MAX_SQL_TEXT);
  const began = Date.now();
  const result = await call('sql_query', { sql: heavy });
  assert.equal(result.isError, true);
  assert.match(JSON.stringify(result), /larger than 1 MB/);
  assert.ok(Date.now() - began < 5000, 'refused at once, not after the planner has read it');
});

// The check on an ExecuteSQL literal in a formula (ai-policy.ts, next to sqlFieldRefs) cannot be reached from an MCP
// formula today: a formula over the analysis limit is refused before its literals are read, and a literal over 1 MB
// makes the formula that long. This pins what a caller sees, and that it is quick.
test('a formula holding a 1 MB ExecuteSQL literal is refused quickly by the formula analysis limit', async (t) => {
  const call = await fixture(t);
  const began = Date.now();
  const result = await call('evaluate_calculation', { layout: 'Items', recordId: 1, formula: `ExecuteSQL ( "${heavy}" ; "" ; "" )` });
  assert.equal(result.isError, true);
  assert.match(JSON.stringify(result), /analysis limit/);
  assert.ok(Date.now() - began < 5000, 'refused at once');
});
