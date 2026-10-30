import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdtempSync, readdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { createRequire, syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { claimFolder } from '../../server/src/backup.ts';
import { createStore, designText, exitBundle, Store, writeDesignText } from '../src/index.ts';
import { atomicWrite, sweepStateTempsSync } from '../src/durable.ts';
import { removeAtExit } from '../../../scripts/test-remove-at-exit.ts';

function fresh(t: { after(fn: () => void): void }): { store: Store; path: string; dir: string } {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-s05-'));
  const path = join(dir, 'test.openhbam.sqlite');
  createStore(path);
  const store = new Store(path);
  t.after(() => { store.close(); });
  removeAtExit(dir);
  return { store, path, dir };
}

test('design text writes distinct names longer than 300 UTF-8 bytes', (t) => {
  const { store, dir } = fresh(t);
  const schema = structuredClone(store.schema);
  const shared = '界'.repeat(100);
  schema.scripts = [
    { id: 1001, name: shared + '甲', steps: [] },
    { id: 1002, name: shared + '乙', steps: [] },
  ];
  const files = designText({ schema, layouts: [], accounts: [], privilegeSets: [] });
  const names = [...files.keys()].filter((p) => p.startsWith('scripts/'));
  assert.equal(names.length, 2);
  assert.notEqual(names[0], names[1]);
  for (const name of names) assert.ok(Buffer.byteLength(name.split('/').at(-1)!) <= 255);
  writeDesignText(join(dir, 'design'), files);
  assert.equal(readdirSync(join(dir, 'design', 'scripts')).length, 2);
});

test('exit bundle copies a 300-byte non-ASCII table name', async (t) => {
  const { store, dir } = fresh(t);
  store.applyDesign([{ op: 'createTable', name: '界'.repeat(100), fields: [{ name: 'Value' }] }]);
  const password = ['safe', 'copy', 'password', '12345'].join('-');
  store.setPassword('Admin', password);
  const target = join(dir, 'copy');
  await exitBundle(store, target, { account: 'Admin', password });
  assert.ok(existsSync(target));
});

test('startup sweep removes orphan atomicWrite temps and keeps a live owner', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-s05-temp-'));
  const fs = createRequire(import.meta.url)('node:fs') as typeof import('node:fs');
  const original = fs.writeFileSync;
  let observed = false;
  try {
    const old = new Date(Date.now() - 2 * 3600000);
    const orphan = join(dir, `.journal.${process.pid}.${randomUUID()}.tmp`);
    const live = join(dir, `.journal.${process.ppid}.${randomUUID()}.tmp`);
    for (const path of [orphan, live]) { writeFileSync(path, 'staging'); utimesSync(path, old, old); }
    const release = claimFolder(dir); release();
    assert.equal(existsSync(orphan), false);
    assert.ok(existsSync(live));
    fs.writeFileSync = ((file: Parameters<typeof fs.writeFileSync>[0], data: Parameters<typeof fs.writeFileSync>[1]) => {
      if (typeof file === 'number') {
        const staged = readdirSync(dir).find((name) => name.endsWith('.tmp') && name !== live.split('/').at(-1));
        assert.ok(staged?.startsWith(`.journal.${process.pid}.`), staged);
        utimesSync(join(dir, staged!), old, old);
        assert.deepEqual(sweepStateTempsSync(dir), []);
        observed = true;
      }
      return original(file, data);
    }) as typeof fs.writeFileSync;
    syncBuiltinESMExports();
    atomicWrite(join(dir, 'journal'), 'done');
    assert.ok(observed);
  } finally { fs.writeFileSync = original; syncBuiltinESMExports(); rmSync(dir, { recursive: true, force: true }); }
});

test('applyDesign preserves a peer design committed during preparation', (t) => {
  const { store, path } = fresh(t);
  const peer = new Store(path);
  t.after(() => peer.close());
  const peerSql = (peer as unknown as { sql: DatabaseSync }).sql;
  peerSql.exec('PRAGMA busy_timeout = 0');
  const original = store.designs.bind(store);
  let attempted = false;
  let committed = false;
  store.designs = (() => {
    if (!attempted) {
      attempted = true;
      try { peer.applyDesign([{ op: 'createScript', name: 'Peer', steps: [] }]); committed = true; }
      catch (error) { if (!/locked/.test((error as Error).message)) throw error; }
    }
    return original();
  }) as typeof store.designs;
  store.applyDesign([{ op: 'createScript', name: 'Local', steps: [] }]);
  assert.ok(attempted);
  if (!committed) peer.applyDesign([{ op: 'createScript', name: 'Peer', steps: [] }]);
  assert.deepEqual(store.schema.scripts.map((s) => s.name).sort(), ['Local', 'Peer']);
});

test('failed read audit link rolls back its row and leaves the chain valid', (t) => {
  const { store } = fresh(t);
  store.applyDesign([{ op: 'createTable', name: 'Records', fields: [{ name: 'Value' }] }]);
  store.setAuditSettings({ logReads: true });
  const sql = (store as unknown as { sql: DatabaseSync }).sql;
  const before = Number((sql.prepare('SELECT count(*) AS n FROM _fm_audit').get() as { n: number }).n);
  sql.exec("CREATE TEMP TRIGGER fail_record_link BEFORE UPDATE ON _fm_record_chain_state BEGIN SELECT RAISE(ABORT, 'link failed'); END");
  assert.throws(() => store.logRead('Records', [1]), /link failed/);
  sql.exec('DROP TRIGGER fail_record_link');
  assert.equal((sql.prepare('SELECT count(*) AS n FROM _fm_audit').get() as { n: number }).n, before);
  assert.equal(store.verifyRecordAudit().status, 'consistent');
});
