// Edge cases of the inbound-hook call log (inbound-hook-calls.jsonl in the hosted folder): a directory, a named pipe or a dangling
// link at its path, and rotation of a log that has grown past its size limit, including when a link stands in its place. In every
// case a call is still answered, the refusal is logged, the hooks list stays available, and nothing outside the log is written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, linkSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hookSignature } from '../src/inbound-hooks.ts';
import { serve } from '../src/index.ts';

const posix = { skip: process.platform === 'win32' && 'links, named pipes and modes differ on Windows' };

interface Rig {
  dir: string;
  file: string;
  id: string;
  lines: string[];
  bad: () => Promise<number>;
  listed: () => Promise<{ status: number; calls: unknown[]; id: string }>;
}

// A server with one inbound hook; `bad()` makes a call with a wrong signature, which is refused (401) and logged to the call log.
async function withRig(body: (rig: Rig) => Promise<void>): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-hook-edges-'));
  const lines: string[] = [];
  const s = await serve({ dir, port: 0, log: (m) => lines.push(m), inboundHooks: true });
  try {
    const store = s.host.create('Shop');
    store.applyDesign([
      { op: 'createTable', name: 'Orders', fields: [{ name: 'Ref' }] },
      { op: 'createScript', name: 'Take order', text: 'Exit Script [ Text Result: "ok" ]' },
    ]);
    store.setPassword('Admin', 'pw');
    const admin = (path: string, method = 'GET', payload?: object) => fetch(`${s.url}/tabularius/admin/v1/inbound-hooks${path}`, {
      method, headers: { 'x-tabularius-admin': '1', 'content-type': 'application/json' }, ...(payload ? { body: JSON.stringify(payload) } : {}),
    }).then(async (r) => ({ status: r.status, body: await r.json() as Record<string, any> }));
    const made = await admin('', 'POST', { name: 'Payments', database: 'Shop', script: 'Take order', account: 'Admin' });
    assert.equal(made.status, 201);
    const { path, id } = made.body as { path: string; id: string };
    await body({
      dir, id, lines, file: join(dir, 'inbound-hook-calls.jsonl'),
      bad: async () => {
        const at = String(Math.floor(Date.now() / 1000));
        return (await fetch(`${s.url}${path}`, { method: 'POST', body: '{}', headers: { 'content-type': 'application/json', 'x-tabularius-timestamp': at, 'x-tabularius-signature': hookSignature('wrong', at, '{}') } })).status;
      },
      listed: async () => {
        const r = await admin('');
        return { status: r.status, calls: r.body.hooks?.[0]?.calls, id: r.body.hooks?.[0]?.id };
      },
    });
  } finally {
    await new Promise<void>((resolve) => s.server.close(() => resolve()));
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  }
}

// One log line as the server writes it, padded so that a few thousand of them pass the size limit (1000 calls * 300 bytes).
const line = (id: string, n: number): string => JSON.stringify({ hook: id, at: `seeded-${n}`, status: 401, outcome: 'refused', pad: 'x'.repeat(280) }) + '\n';
const seed = (id: string, count: number): string => Array.from({ length: count }, (_, n) => line(id, n)).join('');

test('a directory at the call log path is refused: calls are still answered, the refusal is logged and the hooks list stays available', { ...posix, timeout: 30_000 }, async () => {
  await withRig(async ({ file, id, lines, bad, listed }) => {
    mkdirSync(file);
    assert.equal(await bad(), 401);
    assert.ok(lstatSync(file).isDirectory(), 'the directory is still there');
    assert.ok(lines.some((l) => l.includes("can't log a call")), 'the write refusal is logged');
    const r = await listed();
    assert.equal(r.status, 200, 'the hooks list remains available');
    assert.equal(r.id, id);
    assert.deepEqual(r.calls, []);
    assert.ok(lines.some((l) => l.includes("can't read the call log")), 'the read refusal is logged');
  });
});

test('a named pipe at the call log path is refused without waiting for a reader or writer', { ...posix, timeout: 30_000 }, async () => {
  await withRig(async ({ file, id, lines, bad, listed }) => {
    execFileSync('mkfifo', [file]);
    assert.equal(await bad(), 401);
    assert.ok(lstatSync(file).isFIFO(), 'the pipe is still there');
    assert.ok(lines.some((l) => l.includes("can't log a call")), 'the write refusal is logged');
    const r = await listed();
    assert.equal(r.status, 200, 'the hooks list remains available');
    assert.equal(r.id, id);
    assert.deepEqual(r.calls, []);
    assert.ok(lines.some((l) => l.includes("can't read the call log")), 'the read refusal is logged');
  });
});

test('a dangling symbolic link at the call log path is not followed: its target is never created', { ...posix, timeout: 30_000 }, async () => {
  await withRig(async ({ dir, file, id, lines, bad, listed }) => {
    const target = join(dir, 'not-there.txt');
    symlinkSync(target, file);
    assert.equal(await bad(), 401);
    assert.equal(existsSync(target), false, 'the call was not written through the link');
    assert.ok(lstatSync(file).isSymbolicLink(), 'the planted link is still there');
    assert.ok(lines.some((l) => l.includes("can't log a call")), 'the write refusal is logged');
    const r = await listed();
    assert.equal(r.status, 200, 'the hooks list remains available');
    assert.equal(r.id, id);
    assert.deepEqual(r.calls, []);
    assert.equal(existsSync(target), false);
  });
});

test('a log past its size limit is cut to its newest half, stays private and keeps the newest call', posix, async () => {
  await withRig(async ({ file, id, lines, bad, listed }) => {
    writeFileSync(file, seed(id, 1100), { mode: 0o644 });
    assert.ok(statSync(file).size > 300_000, 'the seeded log is past the limit');
    assert.equal(await bad(), 401);
    const kept = readFileSync(file, 'utf8').split('\n').filter(Boolean);
    assert.equal(kept.length, 500, 'cut to the newest 500 lines');
    assert.equal(JSON.parse(kept[0]!).at, 'seeded-601', 'the oldest lines went first');
    assert.equal(JSON.parse(kept[kept.length - 1]!).status, 401, 'the newest line is the call just made');
    assert.notEqual(JSON.parse(kept[kept.length - 1]!).at, 'seeded-1099');
    assert.equal(statSync(file).mode & 0o777, 0o600, 'the rewritten log is the owner\'s alone');
    assert.equal(lines.filter((l) => l.includes("can't log a call")).length, 0, lines.join(' | '));
    const r = await listed();
    assert.equal(r.status, 200);
    assert.equal(r.calls.length, 20);
  });
});

test('a symbolic link or a hard link at the path of a log past its size limit is neither appended to nor rotated', { ...posix, timeout: 30_000 }, async () => {
  await withRig(async ({ dir, file, id, lines, bad, listed }) => {
    const victim = join(dir, 'victim.jsonl');
    const planted = seed(id, 1100);
    writeFileSync(victim, planted);
    symlinkSync(victim, file);
    assert.equal(await bad(), 401);
    assert.equal(readFileSync(victim, 'utf8'), planted, 'the file behind the link was not appended to or cut');
    assert.ok(lstatSync(file).isSymbolicLink(), 'the planted link is still there');
    assert.ok(lines.some((l) => l.includes("can't log a call")), 'the symbolic-link refusal is logged');
    assert.deepEqual((await listed()).calls, [], 'the file behind the link is not listed as calls');

    rmSync(file);
    linkSync(victim, file);
    const before = lines.length;
    assert.equal(await bad(), 401);
    assert.equal(readFileSync(victim, 'utf8'), planted, 'the other name of a hard-linked file was not appended to or cut');
    assert.ok(lines.slice(before).some((l) => l.includes("can't log a call")), 'the hard-link refusal is logged');
    assert.equal((await listed()).status, 200, 'the hooks list remains available');
  });
});
