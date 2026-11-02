// Both ends of the private cluster pipe check message shapes and authority. The front keeps follower open failures for a restarted leader.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ClusterLink } from '../src/cluster.ts';
import { Refusals, frontMessage, isFileName, question, workerMessage, workerNote } from '../src/cluster-messages.ts';
import { serveCluster, setAdminPassword } from '../src/index.ts';
import { Profiler } from '../src/profiler.ts';
import { createStore } from '../../store/src/index.ts';
import { commandStubEnv } from '../../../scripts/test-command-stubs.ts';

const session = { id: 's1', token: 't1', db: 'Shop', account: 'ann', idleSeconds: 1, since: '2026-01-01T00:00:00.000Z', client: 'web', streams: 0 };
const ok = (v: unknown) => assert.ok(v && typeof v === 'object' && 'ok' in v, JSON.stringify(v));
const refused = (v: unknown, why?: RegExp) => { assert.ok(v && typeof v === 'object' && 'refused' in v, JSON.stringify(v)); if (why) assert.match((v as { refused: string }).refused, why); };

test('a worker can send only permitted kinds, carrying its own id', () => {
  ok(workerNote({ k: 'design', file: 'Shop' }, 1));
  ok(workerNote({ k: 'profile-reset' }, 2));
  ok(workerNote({ k: 'end', id: 's1' }, 1));
  ok(workerNote({ k: 'cancel-script', id: 'x', by: 'ann' }, 1));
  ok(workerNote({ k: 'message', text: 'hello', token: 't' }, 1));
  ok(workerNote({ k: 'change', change: { kind: 'update', file: 'Shop', table: 'Orders', recordId: 1 } }, 1));
  assert.deepEqual(workerNote({ k: 'sessions', from: 0, list: [session] }, 2), { ok: { k: 'sessions', from: 2, list: [session] } });
  const scripts = { limit: 1, running: [], queued: [], recent: [] };
  assert.deepEqual(workerNote({ k: 'scripts', from: 0, list: scripts }, 2), { ok: { k: 'scripts', from: 2, list: scripts } });
  assert.deepEqual(workerNote({ k: 'open-state', from: 0, file: 'Shop', error: 'busy' }, 3), { ok: { k: 'open-state', from: 3, file: 'Shop', error: 'busy' } });
  assert.deepEqual(workerNote({ k: 'log', from: 0, type: 'Error', source: 'x', message: 'm' }, 2), { ok: { k: 'log', from: 2, type: 'Error', source: 'x', message: 'm' } });
  for (const sender of [0, 1]) {
    refused(workerNote({ k: 'gone', from: 0 }, sender), /gone note from a worker that may not send one/);
    refused(workerNote({ k: 'tls', tls: { cert: 'a', key: 'b' } }, sender), /tls note/);
  }
  refused(workerNote({ k: 'approve', file: 'Shop', id: 'f1' }, 1), /approve note/);
  ok(workerNote({ k: 'approve', file: 'Shop', id: 'f1' }, 0));
  for (const k of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', '', 'Design']) refused(workerNote({ k, file: 'Shop' }, 1), /unknown kind/);
  for (const bad of [null, undefined, 5, 'design', [], { file: 'Shop' }, { k: 5 }]) refused(workerNote(bad, 1));
});

test('names are plain file names and the shapes receivers rely on are checked', () => {
  for (const good of ['Shop', 'My Shop', 'Sales 2026', 'a'.repeat(255), 'Über']) assert.equal(isFileName(good), true, good);
  for (const bad of ['', '.', '..', 'a/b', 'a\\b', '../x', 'a\0b', 'a\nb', 'a\x7fb', 'a'.repeat(256), 5, null, undefined, {}]) assert.equal(isFileName(bad), false, String(bad));
  for (const k of ['design', 'open-state', 'approve']) refused(workerNote({ k, file: '../Shop', id: 'x' }, 0), /wrong shape|not a file name/);
  refused(workerNote({ k: 'change', change: { kind: 'update', file: 'a/b', table: 'T' } }, 1));
  refused(workerNote({ k: 'sessions', list: [{}] }, 1), /sessions/);
  refused(workerNote({ k: 'sessions', list: 'x' }, 1));
  refused(workerNote({ k: 'sessions', list: new Array(20_001).fill(session) }, 1));
  refused(workerNote({ k: 'scripts', list: { limit: 1, running: [5], queued: [], recent: [] } }, 1));
  const passed = workerNote({ k: 'stats', from: 0, profile: { scripts: [], finds: [], extra: 1 }, requests: { requests: [], durations: [], refused: 5 } }, 1);
  assert.deepEqual(passed, { ok: { k: 'stats', from: 1, profile: { scripts: [], finds: [] }, requests: { requests: [], durations: [] } } });
  refused(workerNote({ k: 'stats', profile: { scripts: [], finds: [] }, requests: { requests: [], durations: [], gate: { active: 'many', queued: 0, shed: 0 } } }, 1), /totals/);
  refused(workerNote({ k: 'stats', profile: { scripts: [], finds: [] }, requests: { requests: [['x', 'y']], durations: [] } }, 1));
  ok(workerNote({ k: 'stats', profile: { scripts: [], finds: [] }, requests: { requests: [['GET /x', 3]], durations: [['GET /x', { buckets: [1, 2], sum: 1, count: 2 }]] } }, 1));
  refused(workerNote({ k: 'message', text: 5 }, 1));
  refused(workerNote({ k: 'log', type: 'Information', source: 's', message: 'm' }, 1));
  refused(workerNote({ k: 'open-state', file: 'Shop', error: { length: 1 } }, 1));
  const cut = workerNote({ k: 'open-state', file: 'Shop', error: 'e'.repeat(5000) }, 1);
  assert.equal('ok' in cut && cut.ok.k === 'open-state' && cut.ok.error?.length, 4096);
  const log = workerNote({ k: 'log', type: 'Warning', source: 's', message: 'm'.repeat(40_000) }, 1);
  assert.equal('ok' in log && log.ok.k === 'log' && log.ok.message.length, 32_768);
});

test('both sides check message types, question actions and safe request numbers', () => {
  ok(workerMessage({ t: 'ready' }, 1));
  ok(workerMessage({ t: 'log', text: 'hello' }, 1));
  ok(workerMessage({ t: 'ask', rid: 3, q: { k: 'file', name: 'Shop', action: 'close' } }, 1));
  ok(workerMessage({ t: 'cancel', rid: 3 }, 1));
  ok(workerMessage({ t: 'answer', rid: 3 }, 1));
  for (const bad of [{ t: 'banana' }, { t: 'ask', rid: 'x', q: { k: 'file', name: 'Shop', action: 'close' } }, { t: 'ask', rid: 1, q: { k: 'file', name: 'a/b', action: 'close' } }, { t: 'ask', rid: 1, q: { k: 'file', name: 'Shop', action: 'delete' } },
    { t: 'cancel', rid: -1 }, { t: 'cancel', rid: 1.5 }, { t: 'answer' }, { t: 'log', text: 5 }, 'ready', 5, null, [], { t: '__proto__' }]) refused(workerMessage(bad, 1));
  for (const rid of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, '1']) {
    refused(workerMessage({ t: 'answer', rid }, 1));
    refused(frontMessage({ t: 'answer', rid }, 2));
  }
  refused(question({ k: 'file', name: 'Shop', action: 'close', detail: 'd'.repeat(5000) }));
  assert.deepEqual(question({ k: 'file', name: 'Shop', action: 'offline', detail: 'damaged', extra: 1 }), { ok: { k: 'file', name: 'Shop', action: 'offline', detail: 'damaged' } });
  for (const action of ['close', 'pause', 'open', 'offline']) ok(frontMessage({ t: 'ask', rid: 1, q: { k: 'file', name: 'Shop', action } }, 2));
  ok(frontMessage({ t: 'tell', note: { k: 'gone', from: 1 } }, 2));
  refused(frontMessage({ t: 'tell', note: { k: 'gone', from: 7 } }, 2), /gone note for no worker/);
  ok(frontMessage({ t: 'tell', note: { k: 'tls', tls: { cert: 'a', key: '' } } }, 2));
  refused(frontMessage({ t: 'tell', note: { k: 'tls', tls: 5 } }, 2));
  ok(frontMessage({ t: 'tell', note: { k: 'sessions', from: 1, list: [session] } }, 2));
  refused(frontMessage({ t: 'tell', note: { k: 'sessions', from: 9, list: [session] } }, 2));
  refused(frontMessage({ t: 'tell', note: { k: 'design', file: '..' } }, 2));
  refused(frontMessage({ t: 'stop' }, 2));
});

test('nested reports cannot throw in receivers or carry unknown fields, and relayed ids are required', () => {
  const report = (profile: unknown, requests: unknown = { requests: [], durations: [] }) => ({ k: 'stats', profile, requests });
  for (const profile of [{ scripts: [null], finds: [] }, { scripts: [{}], finds: [] }, { scripts: [], finds: [{}] }]) refused(workerNote(report(profile), 1));
  const profiler = new Profiler();
  profiler.step('Shop', 'Ship', 1, 'Set Field', 10, 0);
  profiler.run('Shop', 'Ship', 12, 0, 1);
  profiler.find('Shop', { table: 'Orders', layout: 'Orders', fields: ['Total'], sort: [], ms: 4, found: 1, total: 10, leadingWildcard: false } as never);
  const profile = profiler.snapshot();
  const checked = workerNote(report(profile), 1);
  ok(checked);
  if ('ok' in checked && checked.ok.k === 'stats') {
    const receiver = new Profiler();
    const snapshot = checked.ok.profile;
    receiver.elsewhere = () => [snapshot];
    assert.equal(receiver.report().scripts[0].runs, 1);
    assert.equal(receiver.findReport()[0].count, 1);
  }
  for (const broken of [
    { ...profile, scripts: [{ ...profile.scripts[0], stepStats: [{}] }] },
    { ...profile, scripts: [{ ...profile.scripts[0], last: 1e100 }] },
    { ...profile, finds: [{ ...profile.finds[0], fields: {} }] },
  ]) refused(workerNote(report(broken), 1));
  refused(workerNote(report({ scripts: [], finds: [] }, { requests: [], durations: [['x', { buckets: ['bad'], sum: 1, count: 1 }]] }), 1));
  refused(workerNote({ k: 'scripts', list: { limit: 1, running: [{}], queued: [], recent: [] } }, 1));
  refused(workerNote({ k: 'change', change: { kind: 'update', file: 'Shop', table: 'T', fields: {} } }, 1));
  for (const note of [
    { k: 'sessions', list: [session] }, { k: 'scripts', list: { limit: 1, running: [], queued: [], recent: [] } },
    report({ scripts: [], finds: [] }), { k: 'log', type: 'Error', source: 'x', message: 'm' }, { k: 'open-state', file: 'Shop' },
  ]) refused(frontMessage({ t: 'tell', note }, 2), /no worker/);
  assert.deepEqual(workerNote({ k: 'sessions', list: [{ ...session, extra: 'discard' }], extra: 1 }, 1), { ok: { k: 'sessions', from: 1, list: [session] } });
  assert.deepEqual(workerNote({ k: 'change', change: { kind: 'update', file: 'Shop', table: 'T', extra: 1 } }, 1), { ok: { k: 'change', change: { kind: 'update', file: 'Shop', table: 'T' } } });
  refused(frontMessage({ t: 'tell', note: { k: 'tls', tls: { cert: 'a', key: '', auto: { domains: {}, expires: 1 } } } }, 2));
});

test('refusals are counted and logged at most once a minute per reason', () => {
  let at = 1_000;
  const said: string[] = [];
  const r = new Refusals((t) => said.push(t), () => at);
  for (let i = 0; i < 50; i++) r.refuse('front', 'worker 1', 'a note of an unknown kind');
  r.refuse('front', 'worker 1', 'a cancel without a number');
  assert.equal(r.total(), 51);
  assert.equal(said.length, 2);
  at += 59_999;
  r.refuse('front', 'worker 2', 'a note of an unknown kind');
  assert.equal(said.length, 2);
  at += 1;
  r.refuse('front', 'worker 1', 'a note of an unknown kind');
  assert.equal(said.length, 3);
  assert.match(said[0], /dropped a note of an unknown kind \(front, worker 1\)/);
});

test('a worker drops malformed front messages without acknowledging refused questions', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-link-messages-'));
  const sent: unknown[] = [];
  const link = new ClusterLink({ id: 1, leader: false, workers: 2, socket: join(dir, 'w1.sock'), urlKey: '00'.repeat(32), locks: join(dir, 'l.sqlite') }, (m) => sent.push(m));
  try {
    for (const bad of [{ t: 'ask', rid: 1, q: { k: 'file', name: '../Shop', action: 'close' } }, { t: 'tell', note: { k: 'design', file: 'a/b' } }, { t: 'tell', note: { k: 'gone', from: 5 } }, { t: 'banana' }, null, 7]) link.receive(bad as never);
    assert.equal(link.refusals.total(), 6);
    assert.deepEqual(sent.filter((m) => (m as { t: string }).t === 'answer'), []);
    link.receive({ t: 'answer', rid: 99 });
    assert.equal(link.refusals.total(), 6);
  } finally { link.close(); rmSync(dir, { recursive: true, force: true }); }
});

async function withCluster(t: import('node:test').TestContext, workers: number, timing: Parameters<typeof serveCluster>[3], files: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-cluster-messages-'));
  const env = commandStubEnv(t);
  // Version stamps may ask for the short commit; all other child commands stay forbidden.
  writeFileSync(join(env.PATH!, 'git'), '#!/bin/sh\necho abc1234\n', { mode: 0o700 });
  const previous = { PATH: process.env.PATH, TABULARIUS_TEST_CHILD_MARKER: process.env.TABULARIUS_TEST_CHILD_MARKER };
  process.env.PATH = env.PATH;
  process.env.TABULARIUS_TEST_CHILD_MARKER = env.TABULARIUS_TEST_CHILD_MARKER;
  let cluster: Awaited<ReturnType<typeof serveCluster>> | undefined;
  const close = async () => {
    try { await cluster?.close(); } finally {
      for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
      rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    }
  };
  try {
    files(dir);
    const secret = ['pass', 'for', 'the', 'test'].join('-');
    setAdminPassword(dir, secret);
    const said: string[] = [];
    cluster = await serveCluster({ dir, port: 0, watch: false, log: (m) => said.push(m) }, workers, false, timing);
    const url = cluster.url;
    const headers = { authorization: 'Basic ' + btoa(`admin:${secret}`), 'x-tabularius-admin': '1' };
    const status = async (): Promise<{ file: string; worker: number; error: string }[] | undefined> => {
      const response = await fetch(`${url}/tabularius/admin/v1/status`, { headers, signal: AbortSignal.timeout(5000) }).catch(() => undefined);
      return response?.status === 200 ? (await response.json()).openFailed : undefined;
    };
    return { cluster, status, said, close };
  } catch (e) { await close(); throw e; }
}
const until = async (what: string, ok: () => boolean | Promise<boolean>, ms = 20_000) => {
  for (const end = Date.now() + ms; Date.now() < end; await sleep(50)) if (await ok()) return;
  assert.fail(`timed out waiting for ${what}`);
};
const broken = (dir: string) => {
  createStore(join(dir, 'Shop.openhbam.sqlite'));
  writeFileSync(join(dir, 'Broken.openhbam.sqlite'), 'this is not a database'.repeat(50));
};

test('the real front drops and counts a misbehaving worker, and assigns its own sender id', { timeout: 90_000 }, async (t) => {
  const { cluster, status, said, close } = await withCluster(t, 2, { entry: () => join(import.meta.dirname, 'misbehaving-worker.ts') }, broken);
  try {
    await until('the 13 refusals', () => Object.values(cluster.refused()).reduce((n, c) => n + c, 0) >= 13);
    assert.equal(Object.values(cluster.refused()).reduce((n, c) => n + c, 0), 13, JSON.stringify(cluster.refused()));
    assert.ok(said.some((l) => /dropped a note of an unknown kind/.test(l)), said.join(' | '));
    let seen: { file: string; worker: number; error: string }[] = [];
    await until('the status', async () => { seen = (await status()) ?? []; return seen.some((e) => e.error === 'a made-up reason'); });
    assert.deepEqual(seen.map((e) => [e.file, e.worker]).sort(), [['Broken', 1], ['Shop', 1]]);
    assert.equal(seen.find((e) => e.file === 'Shop')?.error, 'a made-up reason');
    assert.equal((await fetch(`${cluster.url}/tabularius/health`)).status, 200);
  } finally { await close(); }
});

test('a restarted leader hears follower failures again without restarting the follower', { timeout: 90_000 }, async (t) => {
  const { cluster, status, said, close } = await withCluster(t, 2, { firstMs: 100, maxMs: 300, stableMs: 600_000 }, broken);
  try {
    let seen: { file: string; worker: number; error: string }[] = [];
    await until('the follower report', async () => { seen = (await status()) ?? []; return seen.some((e) => e.worker === 1); });
    assert.deepEqual(seen.map((e) => [e.file, e.worker]), [['Broken', 1]], said.join(' | '));
    const leader = cluster.pids()[0]!;
    const follower = cluster.pids()[1]!;
    process.kill(leader, 'SIGKILL');
    await until('another leader', () => cluster.pids()[0] !== undefined && cluster.pids()[0] !== leader);
    await until('the new leader to answer', async () => (await status()) !== undefined);
    await until('the follower report again', async () => ((await status()) ?? []).some((e) => e.worker === 1));
    assert.equal(cluster.pids()[1], follower);
    const again = (await status())!;
    assert.deepEqual(again.map((e) => [e.file, e.worker]), [['Broken', 1]], 'once, not twice');
    assert.match(again[0].error, /Broken is damaged/);
    process.kill(follower, 'SIGKILL');
    await until('another follower', () => cluster.pids()[1] !== undefined && cluster.pids()[1] !== follower);
    await until('its report once more', async () => ((await status()) ?? []).some((e) => e.worker === 1));
    assert.equal(((await status()) ?? []).filter((e) => e.worker === 1).length, 1);
  } finally { await close(); }
});

test('front replay is bounded, latest wins, success clears, and exiting followers leave no cached failures', { timeout: 60_000 }, async (t) => {
  let dirForWorker: string;
  const { cluster, said, close } = await withCluster(t, 2, {
    firstMs: 10, maxMs: 20,
    entry: () => join(dirForWorker, 'protocol-worker.ts'),
  }, (dir) => {
    dirForWorker = dir;
    writeFileSync(join(dir, 'protocol-worker.ts'), `
      process.on('disconnect', () => process.exit(0));
      process.on('message', (m) => {
        if (m.t === 'stop') return process.exit(0);
        if (m.t === 'start') {
          if (m.role.id === 1 && !m.role.restart) {
            for (let i = 0; i < 18; i++) process.send({ t: 'tell', note: { k: 'open-state', from: 0, file: 'File' + i, error: 'old' } });
            process.send({ t: 'tell', note: { k: 'open-state', from: 0, file: 'FILE2', error: 'new' } });
            process.send({ t: 'tell', note: { k: 'open-state', from: 0, file: 'file3' } });
            process.send({ t: 'tell', note: { k: 'open-state', from: 0, file: 'File4', error: '' } });
          }
          process.send({ t: 'ready' });
          if (m.role.id === 1) {
            process.send({ t: 'ready' });
            process.send({ t: 'log', text: 'follower-ready' });
          } else process.send({ t: 'ask', rid: 42, q: { k: 'file', name: 'Fence', action: 'pause' } });
        } else if (m.t === 'ask') process.send({ t: 'answer', rid: m.rid });
        else if (m.t === 'answer') process.send({ t: 'log', text: 'replay-done ' + process.pid });
        else if (m.t === 'tell' && m.note.k === 'open-state') process.send({ t: 'log', text: 'state ' + process.pid + ' ' + JSON.stringify(m.note) });
        else if (m.t === 'tell' && m.note.k === 'gone') process.send({ t: 'log', text: 'gone ' + m.note.from });
      });
    `);
  });
  try {
    await until('initial reports', () => said.includes('[1] follower-ready'));
    assert.equal(cluster.refused()['front: a second ready'], 1);
    const restart = async (id: number) => {
      const old = cluster.pids()[id]!;
      process.kill(old, 'SIGKILL');
      await until('replacement process', () => cluster.pids()[id] !== undefined && cluster.pids()[id] !== old);
    };
    // The answer to the leader's question follows the replay on its pipe, providing a fence without a fixed sleep.
    said.length = 0;
    await restart(0);
    await until('replay fence', () => said.includes('[0] replay-done ' + cluster.pids()[0]));
    const prefix = '[0] state ' + cluster.pids()[0] + ' ';
    const states = said.filter((line) => line.startsWith(prefix)).map((line) => JSON.parse(line.slice(prefix.length)));
    assert.deepEqual(states.map((s) => s.file), [...Array.from({ length: 13 }, (_, i) => `File${i + 5}`), 'FILE2', 'File4']);
    assert.ok(states.every((s) => s.from === 1));
    assert.equal(states.at(-2).error, 'new');
    assert.equal(states.at(-1).error, '');
    said.length = 0;
    await restart(1);
    await until('follower exit and replacement', () => said.includes('[0] gone 1') && said.includes('[1] follower-ready'));
    said.length = 0;
    await restart(0);
    await until('replay fence', () => said.includes('[0] replay-done ' + cluster.pids()[0]));
    // The leader has received the answer after any replay, so no old follower report may appear later.
    assert.equal(said.filter((line) => line.startsWith('[0] state ' + cluster.pids()[0] + ' ')).length, 0);
  } finally { await close(); }
});
