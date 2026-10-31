import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, linkSync, lstatSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hookSignature } from '../src/inbound-hooks.ts';
import { serve } from '../src/index.ts';

const links = { skip: process.platform === 'win32' && 'links and modes differ on Windows' };

test('the inbound-hook call log is private, appended whole, and never written or read through a planted link', links, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-hook-calls-'));
  const lines: string[] = [];
  const s = await serve({ dir, port: 0, log: (m) => lines.push(m), inboundHooks: true });
  try {
    const store = s.host.create('Shop');
    store.applyDesign([
      { op: 'createTable', name: 'Orders', fields: [{ name: 'Ref' }] },
      { op: 'createScript', name: 'Take order', text: 'Exit Script [ Text Result: "ok" ]' },
    ]);
    store.setPassword('Admin', 'pw');
    const admin = (path: string, method = 'GET', body?: object) => fetch(`${s.url}/tabularius/admin/v1/inbound-hooks${path}`, {
      method, headers: { 'x-tabularius-admin': '1', 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}),
    }).then(async (r) => ({ status: r.status, body: await r.json() as Record<string, any> }));
    const made = await admin('', 'POST', { name: 'Payments', database: 'Shop', script: 'Take order', account: 'Admin' });
    assert.equal(made.status, 201);
    const { path, id } = made.body as { path: string; id: string };
    // A call with a wrong signature is refused and logged.
    const bad = async () => {
      const at = String(Math.floor(Date.now() / 1000));
      return (await fetch(`${s.url}${path}`, { method: 'POST', body: '{}', headers: { 'content-type': 'application/json', 'x-tabularius-timestamp': at, 'x-tabularius-signature': hookSignature('wrong', at, '{}') } })).status;
    };
    const file = join(dir, 'inbound-hook-calls.jsonl');
    // A normal call: the log is the owner's alone and the call is listed.
    assert.equal(await bad(), 401);
    assert.equal(statSync(file).mode & 0o777, 0o600);
    assert.equal((await admin('')).body.hooks[0].calls.length, 1);
    const first = readFileSync(file, 'utf8');
    // A log left readable by others becomes private on the next call and keeps its earlier line.
    chmodSync(file, 0o644);
    assert.equal(await bad(), 401);
    assert.equal(statSync(file).mode & 0o777, 0o600);
    const appended = readFileSync(file, 'utf8');
    assert.ok(appended.startsWith(first), 'the earlier line is preserved');
    assert.equal(appended.split('\n').filter(Boolean).length, 2);
    // A planted symlink is neither appended through nor read as the call log.
    const victim = join(dir, 'victim.txt');
    const planted = JSON.stringify({ hook: id, at: 'planted', status: 999, outcome: 'ok' }) + '\n';
    writeFileSync(victim, planted);
    rmSync(file);
    symlinkSync(victim, file);
    assert.equal(await bad(), 401);
    assert.equal(readFileSync(victim, 'utf8'), planted);
    assert.ok(lstatSync(file).isSymbolicLink(), 'the planted link is still there');
    assert.ok(lines.some((l) => l.includes("can't log a call")), 'the refusal is logged');
    const listed = await admin('');
    assert.equal(listed.status, 200, 'the hooks list remains available');
    assert.equal(listed.body.hooks[0].id, id);
    assert.deepEqual(listed.body.hooks[0].calls, [], 'the link target is not listed as calls');
    assert.ok(lines.some((l) => l.includes("can't read the call log")), 'the read refusal is logged');
    // A hard link is refused for writing, but remains readable as before.
    rmSync(file);
    linkSync(victim, file);
    const beforeHardLink = lines.length;
    assert.equal(await bad(), 401);
    assert.equal(readFileSync(victim, 'utf8'), planted);
    assert.ok(lines.slice(beforeHardLink).some((l) => l.includes("can't log a call")), 'the hard-link refusal is logged');
    assert.deepEqual((await admin('')).body.hooks[0].calls, [{ at: 'planted', status: 999, outcome: 'ok' }]);
  } finally {
    await new Promise<void>((resolve) => s.server.close(() => resolve()));
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  }
});
