// The admin console asks for the status of every hosted file every few seconds, which includes whether a file converted by an
// older version can be converted again. That answer must not read each source .fmp12 end to end every time.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs, { mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createStore } from '../../store/src/index.ts';
import { fileSha256 } from '../../store/src/import.ts';
import { serve } from '../src/index.ts';

const MB = 1 << 20;

test('polling the admin status does not read the source .fmp12 again while it is unchanged', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-status-poll-'));
  const source = join(dir, 'Big.fmp12');
  writeFileSync(source, Buffer.alloc(3 * MB, 7));
  const store = join(dir, 'Big.openhbam.sqlite');
  createStore(store);
  const sql = new DatabaseSync(store);
  // Converted by an older version (no converter version recorded), from this very file.
  sql.prepare("UPDATE _fm_meta SET json = ? WHERE key = 'source'").run(JSON.stringify({ importedAt: new Date().toISOString(), size: statSync(source).size, sha256: fileSha256(source) }));
  sql.close();

  const real = fs.readSync;
  let bytes = 0;
  const spy = t.mock.method(fs, 'readSync', (...args: unknown[]) => {
    const n = (real as (...a: unknown[]) => number)(...args);
    bytes += n;
    return n;
  });
  syncBuiltinESMExports();
  const s = await serve({ dir, port: 0, log: () => {} });
  t.after(() => { s.server.close(); spy.mock.restore(); syncBuiltinESMExports(); });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const status = async () => (await (await fetch(`${s.url}/tabularius/admin/v1/status`, { headers: { 'x-tabularius-admin': '1' } })).json()).databases[0];

  // Whatever the start-up and the first answer read, the next polls read nothing of the source.
  assert.deepEqual((await status()).reconvert?.unsafe, undefined);
  assert.ok((await status()).reconvert, 'the file is flagged as converted by an older version');
  bytes = 0;
  for (let i = 0; i < 5; i++) await status();
  assert.ok(bytes < MB, `five polls read ${bytes} bytes`);
});
