// A worker that cannot open a file after its retries tells the leader, which shows it in the admin status; the entry
// goes when the file opens, when the worker stops, or when the file leaves the folder.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ClusterLink, openStateNote } from '../src/cluster.ts';
import { serve } from '../src/index.ts';
import { createStore } from '../../store/src/index.ts';
import { OpenFailures, plainOpenError, OPEN_FAILURE_PER_WORKER_MAX, OPEN_FAILURE_TEXT_MAX } from '../src/open-failures.ts';

const folder = join(tmpdir(), 'hosted');

test('the error text keeps no absolute path, no control characters and a bounded length', () => {
  assert.equal(plainOpenError(`EPERM: operation not permitted, open '${folder}/Sales.openhbam.sqlite'`, folder), `EPERM: operation not permitted, open 'Sales.openhbam.sqlite'`);
  assert.equal(plainOpenError('EACCES: open /var/lib/other/secret/Sales.sqlite\nnext', folder), 'EACCES: open …/Sales.sqlite next');
  assert.equal(plainOpenError('EBUSY C:\\Users\\bob\\data\\Sales.sqlite', 'C:\\hosted'), 'EBUSY …/Sales.sqlite');
  assert.equal(plainOpenError('open C:\\hosted\\Sales.sqlite', 'C:\\hosted'), 'open Sales.sqlite');
  assert.equal(plainOpenError('open C:/hosted/Sales.sqlite', 'C:\\hosted'), 'open Sales.sqlite');
  assert.equal(plainOpenError('\u0000busy\t\u001b\u007fnow\r\n', folder), 'busy now');
  assert.equal(plainOpenError('x'.repeat(5000), folder), 'x'.repeat(OPEN_FAILURE_TEXT_MAX - 1) + '…');
});

test('the list is bounded, per file and worker, and cleared by an open, a stopped worker or a removed file', () => {
  const list = new OpenFailures();
  list.set('Sales', 1, 'busy', folder, () => 0);
  list.set('SALES', 1, 'still busy', folder, () => 1000);
  list.set('Sales', 2, 'busy', folder);
  const entries = list.list(() => true);
  assert.deepEqual(entries.map((e) => [e.file, e.worker, e.error]), [['SALES', 1, 'still busy'], ['Sales', 2, 'busy']]);
  assert.equal(entries[0].at, '1970-01-01T00:00:01.000Z');
  entries[0].error = 'changed outside the list';
  assert.equal(list.list(() => true)[0].error, 'still busy');
  list.clear('sales', 1);
  assert.deepEqual(list.list(() => true).map((e) => e.worker), [2]);
  list.clearWorker(2);
  assert.deepEqual(list.list(() => true), []);
  list.set('Gone', 1, 'busy', folder);
  assert.deepEqual(list.list((f) => f !== 'Gone'), []);
  // One worker keeps its newest entries (the total bound and the other workers are in cluster-open-failures-hardening.test.ts).
  for (let i = 0; i < OPEN_FAILURE_PER_WORKER_MAX + 10; i++) list.set(`F${i}`, 1, 'busy', folder);
  const kept = list.list(() => true);
  assert.equal(kept.length, OPEN_FAILURE_PER_WORKER_MAX);
  assert.equal(kept[0].file, 'F10');
});

test('the front process takes an open-state note of the right shape and puts the sender in it', () => {
  assert.deepEqual(openStateNote({ k: 'open-state', from: 0, file: 'Sales', error: 'busy' }, 2), { k: 'open-state', from: 2, file: 'Sales', error: 'busy' });
  assert.deepEqual(openStateNote({ k: 'open-state', file: 'Sales' }, 1), { k: 'open-state', from: 1, file: 'Sales' });
  for (const bad of [null, 'x', { k: 'open-state' }, { k: 'open-state', file: '' }, { k: 'open-state', file: 7 }, { k: 'open-state', file: 'a'.repeat(256) }, { k: 'open-state', file: 'a', error: 3 }]) {
    assert.equal(openStateNote(bad, 1), undefined);
  }
  // A text over the longest is cut, not refused (see cluster-open-failures-hardening.test.ts).
  assert.equal(openStateNote({ k: 'open-state', file: 'a', error: 'e'.repeat(4097) }, 1)?.error, 'e'.repeat(4096));
});

test('a worker that fails to open a file reports it, and the leader lists it until the file opens', { timeout: 10_000 }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-open-failed-'));
  const make = (id: number) => {
    type Message = Parameters<ConstructorParameters<typeof ClusterLink>[1]>[0];
    const sent: Message[] = [];
    const replies = new Map<number, () => void>();
    const link = new ClusterLink({ id, leader: id === 0, workers: 2, socket: join(dir, `w${id}.sock`), urlKey: '00'.repeat(32), locks: join(dir, `l${id}.sqlite`) }, (m) => {
      sent.push(m);
      if (m.t === 'answer') { replies.get(m.rid)?.(); replies.delete(m.rid); }
    });
    const ask = (rid: number) => new Promise<void>((done) => {
      replies.set(rid, done);
      link.receive({ t: 'ask', rid, q: { k: 'file', name: 'Sales', action: 'open' } });
    });
    const lastState = () => sent.filter((m) => m.t === 'tell').map((m) => m.note).filter((n) => n.k === 'open-state').at(-1)!;
    return { link, sent, ask, lastState };
  };
  const leader = make(0);
  const follower = make(1);
  const write = process.stderr.write;
  try {
    process.stderr.write = (() => true) as never;
    const open = () => {
      let opens = 0;
      return {
        dir,
        openFailures: new OpenFailures(),
        openStores: () => [], onAdd: [], onApprove: new Set(), serverScripts: { version: 0, list: () => [] }, logs: undefined,
        get: () => (opens > 1 ? {} : undefined),
        openFile: () => { opens++; if (opens === 1) throw new Error(`EPERM: operation not permitted, open '${dir}/Sales.openhbam.sqlite'`); return true; },
        files: () => [{ name: 'Sales' }],
        peers: undefined,
      };
    };
    const hostOf = { leader: open(), follower: open() };
    const api = { own: () => [], others: () => [] };
    follower.link.attach(hostOf.follower as never, api as never, {} as never);
    leader.link.attach(hostOf.leader as never, api as never, {} as never);
    await follower.ask(1);
    const note = follower.lastState();
    assert.deepEqual(note, { k: 'open-state', from: 1, file: 'Sales', error: `EPERM: operation not permitted, open '${dir}/Sales.openhbam.sqlite'` });
    leader.link.receive({ t: 'tell', note });
    assert.deepEqual(hostOf.leader.openFailures.list(() => true).map((e) => [e.file, e.worker, e.error]), [['Sales', 1, `EPERM: operation not permitted, open 'Sales.openhbam.sqlite'`]]);
    follower.link.receive({ t: 'tell', note });
    assert.deepEqual(hostOf.follower.openFailures.list(() => true), [], 'only the leader keeps the list');
    // The file opens on the next ask: the follower says so, and the entry goes.
    await follower.ask(2);
    const cleared = follower.lastState();
    assert.deepEqual(cleared, { k: 'open-state', from: 1, file: 'Sales' });
    leader.link.receive({ t: 'tell', note: cleared });
    assert.deepEqual(hostOf.leader.openFailures.list(() => true), []);
    // Already-open files also clear stale reports without another open attempt.
    leader.link.receive({ t: 'tell', note });
    follower.sent.length = 0;
    await follower.ask(3);
    assert.deepEqual(follower.lastState(), cleared);
    leader.link.receive({ t: 'tell', note: follower.lastState() });
    assert.deepEqual(hostOf.leader.openFailures.list(() => true), []);
    leader.link.receive({ t: 'tell', note });
    leader.link.receive({ t: 'tell', note: { k: 'gone', from: 1 } });
    assert.deepEqual(hostOf.leader.openFailures.list(() => true), []);
    // The leader records and clears its own failures without a relay.
    await leader.ask(4);
    assert.deepEqual(hostOf.leader.openFailures.list(() => true).map((e) => [e.file, e.worker]), [['Sales', 0]]);
    await leader.ask(5);
    assert.deepEqual(hostOf.leader.openFailures.list(() => true), []);
  } finally {
    process.stderr.write = write;
    leader.link.close();
    follower.link.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the admin status lists a failed open without an absolute path, and drops it when the file is gone', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-open-status-'));
  createStore(join(dir, 'Shop.openhbam.sqlite'));
  const { server, host, url } = await serve({ dir, port: 0, log: () => {} });
  try {
    const status = () => fetch(`${url}/tabularius/admin/v1/status`).then((r) => r.json());
    assert.deepEqual((await status()).openFailed, []);
    host.openFailures.set('Shop', 1, `EPERM: operation not permitted, open '${dir}/Shop.openhbam.sqlite'`, dir);
    host.openFailures.set('Gone', 2, 'EBUSY', dir);
    const seen = (await status()).openFailed;
    assert.deepEqual(seen.map((e: { file: string; worker: number; error: string }) => [e.file, e.worker, e.error]), [['Shop', 1, `EPERM: operation not permitted, open 'Shop.openhbam.sqlite'`]]);
    assert.equal(new Date(seen[0].at).toISOString(), seen[0].at);
    assert.ok(!JSON.stringify(seen).includes(dir));
    host.openFailures.clear('shop', 1);
    assert.deepEqual((await status()).openFailed, []);
  } finally {
    await new Promise<void>((done) => server.close(() => done()));
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  }
});
