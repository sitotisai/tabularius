// docs/fmcsadmin-parity.md says, command by command, what an fmcsadmin user gets here. Every command it lists must be one
// this file maps to the Admin API routes the command needs, and each of those routes must be in the REST reference (which
// is generated from the code); a command marked "No" must not be mapped to any. Adding a row, or dropping a route, fails here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..', '..');
const page = readFileSync(join(root, 'docs', 'fmcsadmin-parity.md'), 'utf8');
const reference = readFileSync(join(root, 'docs', 'reference', 'rest.md'), 'utf8');
const V2 = '/fmi/admin/api/v2';

/** The routes each command needs: the tool reads or changes these (an empty list is a command the page says is not done). */
const ROUTES: Record<string, string[]> = {
  'list files': ['GET /databases'],
  'list clients': ['GET /clients'],
  'list schedules': ['GET /schedules'],
  'list plugins': ['GET /plugins'],
  'open, close': ['PATCH /databases/{id}'],
  'pause, resume': ['PATCH /databases/{id}'],
  'disconnect': ['DELETE /clients/{id}'],
  'send': ['POST /clients/{id}/message'],
  'status': ['GET /server/status', 'GET /databases', 'GET /clients'],
  'run schedule': ['PATCH /schedules/{id}'],
  'enable schedule, disable schedule': ['PATCH /schedules/{id}'],
  'delete schedule': ['DELETE /schedules/{id}'],
  'get serverconfig, get serverprefs, get cwpconfig': ['GET /server/config/{setting}', 'GET /php/config'],
  'set serverprefs BlockNewUsersEnabled=…': ['PATCH /server/config/blocknewusers'],
  'set of any other setting': [],
  'certificate import, delete': ['PATCH /server/certificate/import', 'DELETE /server/certificate/delete'],
  'certificate create': ['PATCH /server/certificate/csr'],
  'stop, start': ['PATCH /server/status'],
  'restart': [],
  'remove': [],
  'cancel (a running backup)': [],
  'help': [],
  '--fqdn, -i (remote server, PKI identity file)': ['POST /user/auth'],
};

const rows = [...page.matchAll(/^\| (`[^|]+?) \| ([^|]+?) \|/gm)].map((m) => ({ command: m[1].replaceAll('`', ''), here: m[2].trim() }));
const headings = new Set([...reference.matchAll(/^### `((?:GET|POST|PATCH|PUT|DELETE) \/fmi\/admin\/api\/v2[^`]*)`/gm)].map((m) => m[1].replace(V2, '')));

test('every command the page lists is mapped here, and every mapping is a command on the page', () => {
  assert.ok(rows.length >= 20, `found ${rows.length} rows`);
  assert.deepEqual(rows.map((r) => r.command).sort(), Object.keys(ROUTES).sort());
});

test('a command the page says works (Checked, By the route, Partly) has every route it needs in the REST reference', () => {
  for (const { command, here } of rows) {
    if (!/^(Checked|By the route|Partly)$/.test(here)) continue;
    assert.ok(ROUTES[command].length > 0, `${command} is marked "${here}" but is mapped to no route`);
    for (const route of ROUTES[command]) assert.ok(headings.has(route), `${command} ("${here}") needs ${route}, which the REST reference does not list`);
  }
});

test('a command the page says is not done is mapped to no route', () => {
  for (const { command, here } of rows) {
    if (/^(Checked|By the route|Partly)$/.test(here)) continue;
    assert.deepEqual(ROUTES[command], [], `${command} is marked "${here}" but is mapped to routes`);
  }
});
