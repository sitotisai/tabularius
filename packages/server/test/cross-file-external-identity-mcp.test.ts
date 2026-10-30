// An MCP session that signed in through an identity provider reaches another hosted file as the person the provider vouched
// for, mapped by that file's own external accounts, exactly as the web client's session does.

import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer, type McpIdentity } from '../src/mcp.ts';
import { openIsolation, type Isolation } from './cross-file-matrix.ts';

let m: Isolation;
before(async () => {
  m = await openIsolation();
  const [a, b] = m.stores;
  // A lets the Staff group in with Full Access; B gives the same group its Reader set.
  a.setExternalAccount('Staff', '[Full Access]');
  b.setExternalAccount('Staff', 'Reader');
  a.applyDesign([{ op: 'createScript', name: 'ExternalSQL', text: 'Exit Script [ Text Result: ExecuteSQL ( "SELECT Value FROM ExternalItems" ; "" ; "" ) ]' }]);
});
after(async () => { await m?.close(); });

async function externalRows(who: McpIdentity): Promise<string> {
  const server = createMcpServer(m.host, who);
  const client = new Client({ name: 'cross-file-identity', version: '1' });
  const [x, y] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(x), client.connect(y)]);
  try {
    const result = await client.callTool({ name: 'run_script', arguments: { database: m.stores[0].name, script: 'ExternalSQL', layout: 'Items' } });
    assert.ok(!result.isError, JSON.stringify(result));
    return JSON.parse((result.content as { text: string }[])[0].text).result;
  } finally { await client.close(); await server.close(); }
}

test('an MCP session through a group mapping reaches the other file by the same group', async () => {
  const database = m.stores[0].name;
  const person = 'kim@example.test';
  assert.equal(await externalRows({ account: person, database, via: 'Staff', person, groups: ['Staff'] }), 'SENTINEL_1');
  // The same session without the group claim, or with a group B does not map, is nobody in B.
  assert.equal(await externalRows({ account: person, database, via: 'Staff', person }), '');
  assert.equal(await externalRows({ account: person, database, via: 'Staff', person, groups: ['Visitors'] }), '');
  // A mapping named like B's but reached by a person B deactivated stays out.
  m.stores[1].setPassword(person, 'kim-password-in-b', 'Reader');
  m.stores[1].setAccountActive(person, false);
  assert.equal(await externalRows({ account: person, database, via: 'Staff', person, groups: ['Staff'] }), '');
});
