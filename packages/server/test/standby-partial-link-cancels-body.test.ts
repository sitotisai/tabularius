// When the boundary refuses the standby's partial file (a symbolic link stands at its name), the answer of the main server must be
// cancelled at once: no download is drained into nothing, the connection is released, nothing is written and the link target is untouched.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { STORE_EXT, Standby } from '../src/index.ts';

const TOKEN = ['a', 'replication', 'token', 'for', 'tests'].join('-');
const skip = process.platform === 'win32' && 'links differ on Windows';

function waitFor(done: () => boolean, what: string, ms: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (done()) { clearInterval(timer); resolve(); }
      else if (Date.now() - started > ms) { clearInterval(timer); reject(new Error(`timed out waiting for ${what}`)); }
    }, 20);
  });
}

test('a standby whose partial file is a symbolic link cancels the download body and writes nothing', { skip, timeout: 30_000 }, async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'tabularius-standby-cancel-'));
  let closeServer = async () => {};
  t.after(async () => { await closeServer(); rmSync(root, { recursive: true, force: true }); });
  const spare = join(root, 'spare');
  mkdirSync(spare);

  // A fake main server whose copy never ends by itself: it writes a chunk whenever the socket has room, so a body that nobody reads
  // stalls on back-pressure, and only a cancelled body ends (the socket closes before the response was finished).
  const chunk = Buffer.alloc(64 * 1024, 7);
  const first = { sent: 0, finished: false, closed: false };
  let copyRequests = 0;
  const server = createServer((req, res) => {
    const url = new URL(req.url!, 'http://localhost');
    if (url.pathname.endsWith('/files')) {
      res.end(JSON.stringify({ files: [{ name: 'Tasks', run: 'test-run', seq: 0 }] }));
    } else if (url.pathname.endsWith('/copy')) {
      const mine = ++copyRequests === 1 ? first : { sent: 0, finished: false, closed: false };
      res.writeHead(200, { 'x-tabularius-run': 'test-run', 'x-tabularius-seq': '0', 'x-tabularius-whole-after': '0' });
      res.on('finish', () => { mine.finished = true; });
      res.on('close', () => { mine.closed = true; });
      const pump = () => {
        while (!mine.closed && mine.sent < 512 * 1024 * 1024) {
          mine.sent += chunk.length;
          if (!res.write(chunk)) { res.once('drain', pump); return; }
        }
      };
      pump();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  closeServer = async () => { server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())); };
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  // A link planted at the partial name, pointing at a file that must keep its contents.
  const target = join(spare, `Tasks${STORE_EXT}`);
  const victim = join(root, 'victim.txt');
  writeFileSync(victim, 'keep');
  symlinkSync(victim, `${target}.standby-partial`);

  const lines: string[] = [];
  const standby = new Standby({ folder: spare, primary: `http://127.0.0.1:${address.port}`, token: TOKEN, log: (line) => lines.push(line) });
  standby.start();
  try {
    await waitFor(() => lines.some((l) => /following Tasks: .*Filesystem path changed or is not a safe regular file/.test(l)), 'the refusal line', 10_000);
    // The body was cancelled: the server sees the connection end before it finished, well before the standby's retry (a second later).
    await waitFor(() => first.closed, 'the first download to be closed by the standby', 900);
    assert.equal(first.finished, false, 'the response must not have been drained to its end');
    assert.ok(first.sent < 64 * 1024 * 1024, `only back-pressure worth of data was sent (${first.sent} bytes)`);
  } finally {
    await standby.stop();
  }
  assert.equal(readFileSync(victim, 'utf8'), 'keep', 'the file behind the planted link was not written');
  assert.throws(() => lstatSync(target), { code: 'ENOENT' }, 'nothing was published');
});
