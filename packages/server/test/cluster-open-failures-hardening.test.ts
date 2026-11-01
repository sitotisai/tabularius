// Hardening of cluster workers' open-failure reports, including startup through the real front process and workers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { ClusterLink, openStateNote } from '../src/cluster.ts';
import { serveCluster, setAdminPassword } from '../src/index.ts';
import { createStore } from '../../store/src/index.ts';
import { OPEN_FAILURE_ENTRIES_MAX, OpenFailures, plainOpenError } from '../src/open-failures.ts';
import { commandStubEnv } from '../../../scripts/test-command-stubs.ts';

const folder = '/srv/hosted data';

test('the error text keeps no path with spaces or colons in it, quoted or not, and no relative path', () => {
  const shown = (text: string, dir = folder) => plainOpenError(text, dir);
  // Inside the hosted folder, whose own name has a space: relative to it.
  assert.equal(shown(`EPERM: operation not permitted, open '${folder}/sub dir/Sales.openhbam.sqlite'`), `EPERM: operation not permitted, open 'sub dir/Sales.openhbam.sqlite'`);
  // Outside it, quoted the way Node quotes the path of a failed call: spaces do not end the path.
  assert.equal(shown(`EACCES: permission denied, open '/home/bob smith/My Files/Sales Q1.openhbam.sqlite'`), `EACCES: permission denied, open '…/Sales Q1.openhbam.sqlite'`);
  assert.equal(shown(`open 'C:\\Users\\bob smith\\data\\Sales.sqlite'`), `open '…/Sales.sqlite'`);
  assert.equal(shown(`open "/srv/other place/x y/z.db" and \`/a b/c d/e.db\``), `open "…/z.db" and \`…/e.db\``);
  // A colon inside a name is part of the path.
  assert.equal(shown('EBUSY: open /var/lib/a:b/c:d/Sales.sqlite: busy'), 'EBUSY: open …/Sales.sqlite: busy');
  // Relative paths: from the working folder, the home folder, or above.
  assert.equal(shown(`ENOENT: no such file or directory, open '../secret dir/other/Sales.sqlite'`), `ENOENT: no such file or directory, open '…/Sales.sqlite'`);
  assert.equal(shown('ENOENT: open ./data/private/Sales.sqlite failed'), 'ENOENT: open …/Sales.sqlite failed');
  assert.equal(shown('EPERM at ~/Documents/x/Sales.sqlite now'), 'EPERM at …/Sales.sqlite now');
  assert.equal(shown('open \\\\server\\share\\dir\\Sales.sqlite'), 'open …/Sales.sqlite');
  // A hosted folder given as a relative path is stripped as Node prints it, and only as a whole folder name.
  assert.equal(shown(`EPERM open 'data/Sales.sqlite' and 'metadata/Other.sqlite'`, './data'), `EPERM open 'Sales.sqlite' and 'metadata/Other.sqlite'`);
  assert.equal(shown(`open '${resolve('data')}/Sales.sqlite'`, './data'), "open 'Sales.sqlite'");
  // Text that is not a path stays as it is.
  for (const plain of ['EPERM: read/write not allowed', 'unable to open database file: file is not a database', 'ratio 3/4 at 12:34:56 http://host/x/y', "open 'Sales.sqlite'"]) {
    assert.equal(shown(plain), plain);
  }
});

test('one worker cannot push out the others: it keeps its own newest entries, and the total is bounded', () => {
  const list = new OpenFailures();
  list.set('Kept', 2, 'busy', folder);
  list.set('Also', 3, 'busy', folder);
  for (let i = 0; i < 100; i++) list.set(`F${i}`, 1, 'busy', folder);
  const entries = list.list(() => true);
  const mine = entries.filter((e) => e.worker === 1);
  assert.equal(mine.length, 16);
  assert.equal(mine[0].file, 'F84');
  assert.equal(mine.at(-1)!.file, 'F99');
  assert.deepEqual(entries.filter((e) => e.worker !== 1).map((e) => e.file), ['Kept', 'Also']);
  // Past the total, evict the oldest entry of the worker holding the most, even if another reported first.
  const many = new OpenFailures();
  many.set('Oldest', 0, 'busy', folder);
  for (let w = 1; w <= 5; w++) for (let i = 0; i < 16; i++) many.set(`W${w}F${i}`, w, 'busy', folder);
  const all = many.list(() => true);
  assert.equal(all.length, OPEN_FAILURE_ENTRIES_MAX);
  assert.equal(all[0].file, 'Oldest', 'a worker with one entry keeps it when the total overflows');
  assert.ok([1, 2, 3, 4, 5].every((w) => all.some((e) => e.worker === w)), 'every worker still has entries');
  assert.ok([1, 2, 3, 4, 5].every((w) => all.filter((e) => e.worker === w).length <= 16));
  // Setting the same file again moves it to the end without growing the worker's share.
  const refreshed = all.find((e) => e.worker === 5)!;
  many.set(refreshed.file.toLowerCase(), 5, 'again', folder);
  const after = many.list(() => true);
  assert.equal(after.length, all.length);
  assert.equal(after.filter((e) => e.worker === 5).length, all.filter((e) => e.worker === 5).length);
  assert.equal(after.at(-1)!.file, refreshed.file.toLowerCase());
  assert.equal(after.at(-1)!.error, 'again');
});

test('a long error text is cut to the longest the front process passes on, and the report is kept', () => {
  const long = 'EPERM '.repeat(2000);
  const note = openStateNote({ k: 'open-state', from: 0, file: 'Sales', error: long }, 3);
  assert.equal(note?.from, 3);
  assert.equal(note?.error, long.slice(0, 4096));
  assert.equal(note?.error?.length, 4096);
  assert.equal(openStateNote({ k: 'open-state', file: 'Sales', error: 'e'.repeat(4096) }, 1)?.error?.length, 4096);
  for (const bad of [{ k: 'open-state', file: 'a', error: 3 }, { k: 'open-state', file: 'a', error: { length: 1 } }, { k: 'open-state', file: 'a'.repeat(256) }]) assert.equal(openStateNote(bad, 1), undefined);
  const list = new OpenFailures();
  list.set('Sales', 3, note!.error!, folder);
  assert.ok(list.list(() => true)[0].error.length <= 300);
});

test('a follower tells the leader of a file it could not open at startup; the leader does not report its own', () => {
  type Message = Parameters<ConstructorParameters<typeof ClusterLink>[1]>[0];
  const sent: { id: number; m: Message }[] = [];
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-open-startup-'));
  try {
    const make = (id: number, leader: boolean) => new ClusterLink({ id, leader, workers: 2, socket: join(dir, `w${id}.sock`), urlKey: '00'.repeat(32), locks: join(dir, `l${id}.sqlite`) }, (m) => sent.push({ id, m }));
    const host = () => ({
      dir, openFailures: new OpenFailures(), openStores: () => [], onAdd: [], serverScripts: { version: 0, list: () => [] }, logs: undefined, peers: undefined,
      files: () => [{ name: 'Broken', status: 'closed', damaged: 'Broken is damaged (file is not a database)' }, { name: 'Shop', status: 'open' }, { name: 'Held', status: 'closed' }],
    });
    const api = { own: () => [], others: () => [] };
    const follower = make(1, false);
    const leader = make(0, true);
    try {
      follower.attach(host() as never, api as never, {} as never);
      leader.attach(host() as never, api as never, {} as never);
      const states = sent.filter(({ m }) => m.t === 'tell' && m.note.k === 'open-state');
      assert.deepEqual(states, [{ id: 1, m: { t: 'tell', note: { k: 'open-state', from: 1, file: 'Broken', error: 'Broken is damaged (file is not a database)' } } }]);
    } finally { follower.close(); leader.close(); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('through the real front process: a worker that cannot open a file at startup shows in the leader\'s admin status', { timeout: 60_000 }, async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-open-relay-'));
  const env = commandStubEnv(t);
  const previous = { PATH: process.env.PATH, TABULARIUS_TEST_CHILD_MARKER: process.env.TABULARIUS_TEST_CHILD_MARKER };
  process.env.PATH = env.PATH;
  process.env.TABULARIUS_TEST_CHILD_MARKER = env.TABULARIUS_TEST_CHILD_MARKER;
  const said: string[] = [];
  let cluster: Awaited<ReturnType<typeof serveCluster>> | undefined;
  try {
    createStore(join(dir, 'Shop.openhbam.sqlite'));
    writeFileSync(join(dir, 'Broken.openhbam.sqlite'), 'this is not a database'.repeat(50));
    const secret = ['pass', 'for', 'the', 'test'].join('-');
    setAdminPassword(dir, secret);
    cluster = await serveCluster({ dir, port: 0, watch: false, log: (m) => said.push(m) }, 2);
    assert.equal(cluster.pids().filter(Boolean).length, 2);
    const headers = { authorization: 'Basic ' + btoa(`admin:${secret}`), 'x-tabularius-admin': '1' };
    let seen: { file: string; worker: number; error: string }[] = [];
    // Poll the actual status with a deadline; no fixed sleep or assumption about IPC delivery timing.
    const deadline = Date.now() + 10_000;
    do {
      const response: Response = await fetch(`${cluster.url}/tabularius/admin/v1/status`, { headers, signal: AbortSignal.timeout(5000) });
      assert.equal(response.status, 200);
      seen = (await response.json()).openFailed;
    } while (!seen.some((e) => e.worker === 1) && Date.now() < deadline);
    assert.deepEqual(seen.map((e) => [e.file, e.worker]), [['Broken', 1]], said.join(' | '));
    assert.match(seen[0].error, /Broken is damaged/);
    assert.ok(!JSON.stringify(seen).includes(dir), 'no path of the hosted folder in the status');
  } finally {
    try { await cluster?.close(); }
    finally {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key]; else process.env[key] = value;
      }
      rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    }
  }
});
