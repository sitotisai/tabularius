import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from '../../store/src/index.ts';
import { commandStubEnv } from '../../../scripts/test-command-stubs.ts';
const main = join(import.meta.dirname, '..', 'src', 'main.ts');

function folderWithBadSettings(t: import('node:test').TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-settings-cli-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  createStore(join(dir, 'Test.openhbam.sqlite'));
  writeFileSync(join(dir, '.openhbam-settings.json'), '{"keep":"abc"}');
  return dir;
}

test('offline repair commands warn about a bad settings file and still run', (t) => {
  const env = commandStubEnv(t);
  const dir = folderWithBadSettings(t);
  for (const command of ['compact', 'optimize', 'report']) {
    const r = spawnSync(process.execPath, [main, command, dir], { encoding: 'utf8', env });
    assert.equal(r.status, 0, `${command}: ${r.stderr}`);
    const warned = r.stderr.split('\n').filter((l) => /keep must be a number/.test(l));
    assert.equal(warned.length, 1, `${command} warns once: ${r.stderr}`);
    assert.match(r.stderr, /\.openhbam-settings\.json/);
    assert.match(r.stderr, /fix or remove/i);
  }
});

test('serve refuses a bad settings file before it starts', (t) => {
  const env = commandStubEnv(t);
  const dir = folderWithBadSettings(t);
  const r = spawnSync(process.execPath, [main, 'serve', dir, '--port', '0'], { encoding: 'utf8', env, timeout: 60_000 });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /keep must be a number/);
  assert.match(r.stderr, /fix or remove/i);
});
