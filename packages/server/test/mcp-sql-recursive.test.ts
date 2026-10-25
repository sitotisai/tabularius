// sql_query: a recursive query that never ends is stopped with an error the model can read, and the server goes on answering.
import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Host } from '../src/host.ts';
import { createMcpServer } from '../src/mcp.ts';
import { RECURSIVE_SQL } from '../../store/src/sql-recursive.ts';

async function fx(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'mcp-sql-recursive-'));
  const host = new Host(dir, () => {}, { background: false });
  const store = host.create('Shop');
  store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name' }] }]);
  for (const Name of ['a', 'b', 'c']) store.create('Items', { Name });
  const server = createMcpServer(host, { admin: true });
  const client = new Client({ name: 'p', version: '1' });
  t.after(async () => { await client.close(); await server.close(); await host.close(); rmSync(dir, { recursive: true, force: true }); });
  const [a, b] = InMemoryTransport.createLinkedPair(); await server.connect(a); await client.connect(b);
  return (sql: string) => client.callTool({ name: 'sql_query', arguments: { database: 'Shop', sql } });
}

test('sql_query stops an endless recursive query, and answers the next one', async (t) => {
  const query = await fx(t);
  const was = RECURSIVE_SQL.ms;
  RECURSIVE_SQL.ms = 700;
  t.after(() => { RECURSIVE_SQL.ms = was; });
  const stopped = await query('with recursive c(x) as (select 1 union all select x+1 from c) select count(*) from c');
  assert.equal(stopped.isError, true);
  assert.match(JSON.stringify(stopped), /recursive query ran longer than 0\.7 seconds/);
  // A query that ends is not held to the short deadline a busy machine could overrun just starting the child.
  RECURSIVE_SQL.ms = was;
  const fine = await query('with recursive c(x) as (select 1 union all select x+1 from c where x < 3) select count(*) as n from c, Items');
  assert.notEqual(fine.isError, true);
  assert.match(JSON.stringify(fine), /\b9\b/);
});
