import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store, STORE_FORMAT } from '../../store/src/index.ts';
import { backupFolder, restoreAt, restoreBackup, restorePoint } from '../src/backup.ts';
import { checksum, verifySet } from '../src/backup-verify.ts';

const FILE = 'Proof.openhbam.sqlite';
const REL = 'Files/Proof/document.bin';
const KEY = 'offline proof passphrase';

async function fixture(t: { after(fn: () => void): void }, key = '') {
  const root = mkdtempSync(join(tmpdir(), 'tabularius-proof-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const live = join(root, 'live');
  mkdirSync(live);
  const path = join(live, FILE);
  createStore(path);
  const store = new Store(path, 'Proof');
  store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Title', type: 'text' }, { name: 'Amount', type: 'number' }] }]);
  store.create('Items', { Title: 'before', Amount: 42 });
  store.create('Items', { Title: 'second', Amount: 7 });
  store.sql.prepare("INSERT INTO _fm_accounts (name, password_hash, source) VALUES (?, ?, 'local')").run('proof-user', 'synthetic-hash');
  store.sql.prepare("INSERT INTO _fm_containers (id, filename, mime, kind, data, external) VALUES (1, 'inside.bin', 'application/octet-stream', 'file', ?, NULL)").run(Buffer.from([0, 1, 127, 255]));
  store.checkpoint();
  store.close();
  mkdirSync(join(live, 'Files', 'Proof'), { recursive: true });
  writeFileSync(join(live, REL), Buffer.from([0, 3, 254, 255]));
  const dest = join(root, 'sets');
  const set = (await backupFolder(live, dest, 0, key)).dir;
  return { root, live, path, dest, set, key };
}

function rows(path: string, sql: string): unknown[] {
  const db = new DatabaseSync(path, { readOnly: true });
  try { return db.prepare(sql).all(); } finally { db.close(); }
}

async function refused(f: Awaited<ReturnType<typeof fixture>>, pattern: RegExp): Promise<void> {
  const before = readFileSync(f.path);
  const container = readFileSync(join(f.live, REL));
  await assert.rejects(restoreBackup(f.live, f.set, undefined, f.key), pattern);
  assert.deepEqual(readFileSync(f.path), before, 'the live database is unchanged');
  assert.deepEqual(readFileSync(join(f.live, REL)), container, 'the live container is unchanged');
  assert.equal(existsSync(f.path + '.restoring'), false, 'no staged database remains');
}

test('an extra root file refuses whole and named restores of an encrypted set', async (t) => {
  const f = await fixture(t, KEY);
  for (const name of ['unexpected.bin', '__proto__']) {
    writeFileSync(join(f.set, name), 'unexpected');
    await refused(f, /unexpected|unlisted|not listed|__proto__/i);
    const before = readFileSync(f.path);
    await assert.rejects(restoreBackup(f.live, f.set, 'Proof', KEY), /unexpected|unlisted|not listed|__proto__/i);
    assert.deepEqual(readFileSync(f.path), before);
    assert.equal((await verifySet(f.set, KEY)).ok, false, 'verification also finds the extra file');
    rmSync(join(f.set, name));
  }
});

for (const key of ['', KEY]) test(`${key ? 'encrypted' : 'plain'} backup: every copied part rejects a changed byte`, async (t) => {
  const f = await fixture(t, key);
  const manifest = join(f.set, 'backup.json');
  const parts = [join(f.set, FILE + (key ? '.enc' : '')), join(f.set, REL + (key ? '.enc' : ''))];
  for (const part of parts) {
    const original = readFileSync(part);
    const edited = Buffer.from(original);
    edited[edited.length - 1] ^= 1;
    writeFileSync(part, edited);
    await refused(f, /checksum|changed on disk|decrypt|damaged/i);
    writeFileSync(part, original);
  }
  const original = readFileSync(manifest);
  const info = JSON.parse(original.toString()) as { sha256: Record<string, string> };
  info.sha256[FILE] = '0'.repeat(64);
  writeFileSync(manifest, JSON.stringify(info));
  await refused(f, /signature|checksum|changed on disk/i);
  writeFileSync(manifest, original);
  if (!key) {
    const db = new DatabaseSync(join(f.set, FILE));
    try { db.prepare("UPDATE _fm_audit SET rhash = ? WHERE rhash IS NOT NULL").run('0'.repeat(64)); } finally { db.close(); }
    await refused(f, /checksum|changed on disk/i);
  }
});

for (const key of ['', KEY]) test(`a good ${key ? 'encrypted' : 'plain'} backup restores record fields, account rows, and both container byte streams`, async (t) => {
  const f = await fixture(t, key);
  const expected = {
    records: rows(f.path, 'SELECT * FROM Items ORDER BY rowid'),
    accounts: rows(f.path, 'SELECT * FROM _fm_accounts ORDER BY name'),
    embedded: rows(f.path, 'SELECT id, filename, mime, kind, data, external FROM _fm_containers ORDER BY id'),
    external: readFileSync(join(f.live, REL)),
  };
  const db = new DatabaseSync(f.path);
  try {
    db.exec("UPDATE Items SET Title = 'after', Amount = 99");
    db.prepare("INSERT INTO _fm_accounts (name, password_hash, source) VALUES (?, ?, 'local')").run('later-user', 'later-hash');
    db.exec("UPDATE _fm_containers SET data = x'0102' WHERE id = 1");
  } finally { db.close(); }
  writeFileSync(join(f.live, REL), Buffer.from('later'));
  assert.deepEqual(await restoreBackup(f.live, f.set, undefined, key), [FILE]);
  assert.deepEqual(rows(f.path, 'SELECT * FROM Items ORDER BY rowid'), expected.records);
  assert.deepEqual(rows(f.path, 'SELECT * FROM _fm_accounts ORDER BY name'), expected.accounts);
  assert.deepEqual(rows(f.path, 'SELECT id, filename, mime, kind, data, external FROM _fm_containers ORDER BY id'), expected.embedded);
  assert.deepEqual(readFileSync(join(f.live, REL)), expected.external);
});

test('a stray file, duplicate inventory name, path escape, and newer store each refuse before publication', async (t) => {
  const f = await fixture(t);
  const infoPath = join(f.set, 'backup.json');
  const original = readFileSync(infoPath);
  const stray = join(f.set, 'unexpected.bin');
  writeFileSync(stray, 'unexpected');
  await refused(f, /unexpected|unlisted|not listed/i);
  rmSync(stray);
  const info = JSON.parse(original.toString()) as { finished: Record<string, string>; sha256: Record<string, string>; external: Record<string, unknown> };
  info.finished['proof.openhbam.sqlite'] = info.finished[FILE];
  info.sha256['proof.openhbam.sqlite'] = info.sha256[FILE];
  writeFileSync(infoPath, JSON.stringify(info));
  await refused(f, /duplicate|ambiguous/i);
  for (const escape of ['../outside', '/outside', 'Files/Proof/../outside']) {
    const bad = JSON.parse(original.toString()) as typeof info;
    bad.external[escape] = bad.external[REL];
    writeFileSync(infoPath, JSON.stringify(bad));
    await refused(f, /unsafe|invalid/i);
  }
  writeFileSync(infoPath, original);
  const outside = join(f.root, 'outside');
  writeFileSync(outside, 'outside');
  const copy = join(f.set, REL);
  rmSync(copy);
  symlinkSync(outside, copy);
  await refused(f, /symlink|unsafe|ordinary file/i);
  rmSync(copy);
  writeFileSync(copy, readFileSync(join(f.live, REL)));
  const backupDb = new DatabaseSync(join(f.set, FILE));
  try { backupDb.prepare("UPDATE _fm_meta SET json = ? WHERE key = 'storeFormat'").run(JSON.stringify(STORE_FORMAT + 1)); } finally { backupDb.close(); }
  const newer = JSON.parse(original.toString()) as typeof info;
  newer.sha256[FILE] = await checksum(join(f.set, FILE));
  writeFileSync(infoPath, JSON.stringify(newer));
  await refused(f, /newer Tabularius|file format/i);
});

test('point-in-time selection uses the later set when two copies have the same finished time', async (t) => {
  const f = await fixture(t);
  const first = f.set;
  const db = new DatabaseSync(f.path);
  try { db.exec("UPDATE Items SET Title = 'second backup'"); } finally { db.close(); }
  const second = (await backupFolder(f.live, f.dest, 0, '')).dir;
  const at = new Date(Date.now() - 60_000).toISOString();
  for (const set of [first, second]) {
    const path = join(set, 'backup.json');
    const info = JSON.parse(readFileSync(path, 'utf8')) as { finished: Record<string, string> };
    info.finished[FILE] = at;
    writeFileSync(path, JSON.stringify(info));
  }
  assert.equal(restorePoint(f.dest, FILE, Date.now())?.set, second);
  const changed = new DatabaseSync(f.path);
  try { changed.exec("UPDATE Items SET Title = 'live change'"); } finally { changed.close(); }
  await restoreAt(f.live, f.dest, Date.now(), 'Proof', '');
  assert.equal((rows(f.path, 'SELECT Title FROM Items ORDER BY rowid')[0] as { Title: string }).Title, 'second backup');
});
