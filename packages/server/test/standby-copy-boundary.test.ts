import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { STORE_EXT, Standby } from '../src/index.ts';
import { createStore, Store } from '../../store/src/index.ts';

const TOKEN = ['a', 'replication', 'token', 'for', 'tests'].join('-');
const skip = process.platform === 'win32' && 'links and modes differ on Windows';

// A fake main server: one file, copied whole when asked, and no changes after it (the change requests are left waiting).
async function mainServer(copy: Buffer, close: (fn: () => Promise<void>) => void): Promise<string> {
  const server = createServer((req, res) => {
    const url = new URL(req.url!, 'http://localhost');
    if (url.pathname.endsWith('/files')) {
      res.end(JSON.stringify({ files: [{ name: 'Tasks', run: 'test-run', seq: 0 }] }));
    } else if (url.pathname.endsWith('/copy')) {
      res.writeHead(200, { 'x-tabularius-run': 'test-run', 'x-tabularius-seq': '0', 'x-tabularius-whole-after': '0' });
      res.end(copy);
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  close(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  return `http://127.0.0.1:${address.port}`;
}

function waitFor(lines: string[], pattern: RegExp): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (lines.some((line) => pattern.test(line))) { clearInterval(timer); resolve(); }
      else if (Date.now() - started > 10_000) { clearInterval(timer); reject(new Error(`no log line matching ${pattern}: ${lines.join(' | ')}`)); }
    }, 20);
  });
}

test('the whole-file copy a standby takes is private and is never written through a link planted at its partial name', { skip, timeout: 30_000 }, async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'tabularius-standby-boundary-'));
  const closers: (() => Promise<void>)[] = [];
  t.after(async () => {
    for (const close of closers) await close();
    rmSync(root, { recursive: true, force: true });
  });
  const spare = join(root, 'spare');
  mkdirSync(spare);
  const source = join(root, 'source.sqlite');
  createStore(source);
  const store = new Store(source, 'Tasks');
  try {
    store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name' }] }]);
    store.create('Items', { Name: 'synthetic' });
    store.sql.exec('PRAGMA wal_checkpoint(TRUNCATE)');
  } finally {
    store.close();
  }
  const copy = readFileSync(source);
  const primary = await mainServer(copy, (fn) => closers.push(fn));
  const target = join(spare, `Tasks${STORE_EXT}`);

  // A link planted at the partial name is refused; the file it points to keeps its contents.
  const victim = join(root, 'victim.txt');
  writeFileSync(victim, 'keep');
  symlinkSync(victim, `${target}.standby-partial`);
  const lines: string[] = [];
  const first = new Standby({ folder: spare, primary, token: TOKEN, log: (line) => lines.push(line) });
  first.start();
  try { await waitFor(lines, /following Tasks: .*Filesystem path changed or is not a safe regular file/); } finally { await first.stop(); }
  assert.ok(readFileSync(victim, 'utf8') === 'keep', 'the file behind the planted link was overwritten with the copy');
  assert.throws(() => lstatSync(target), { code: 'ENOENT' }, 'nothing was published');

  // With nothing in the way the copy is taken, is the owner's alone and leaves no partial file behind.
  rmSync(`${target}.standby-partial`, { force: true });
  const lines2: string[] = [];
  const second = new Standby({ folder: spare, primary, token: TOKEN, log: (line) => lines2.push(line) });
  second.start();
  try { await waitFor(lines2, /^copied Tasks$/); } finally { await second.stop(); }
  assert.equal(statSync(target).mode & 0o777, 0o600);
  assert.ok(readdirSync(spare).every((name) => !name.endsWith('.standby-partial')), readdirSync(spare).join(', '));
  assert.ok(readFileSync(victim, 'utf8') === 'keep', 'the file behind the planted link was overwritten with the copy');
});
