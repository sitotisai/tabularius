// plugins keygen writes the publisher's private signing key; a planted symbolic link at the file name must not send it elsewhere.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runCli } from './cli-run.ts';

const main = join(import.meta.dirname, '..', 'src', 'main.ts');

test('plugins keygen refuses a planted link, even a dangling one, and writes a private regular file otherwise', { skip: process.platform === 'win32' && 'links need privileges on Windows' }, async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-keygen-link-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  // A stub PATH: any service, upgrade, network or git tool would write a marker and fail the test.
  const stubs = join(dir, 'stubs');
  const marker = join(dir, 'stub-ran');
  mkdirSync(stubs);
  for (const tool of ['launchctl', 'systemctl', 'sc', 'git', 'npm', 'curl', 'sudo']) {
    writeFileSync(join(stubs, tool), `#!/bin/sh\necho ${tool} >> '${marker}'\nexit 99\n`);
    chmodSync(join(stubs, tool), 0o755);
  }
  const env = { ...process.env, PATH: stubs };
  const keygen = (file: string) => runCli(main, ['plugins', dir, 'keygen', file], { env });

  // A link to a file that is not there yet: nothing may be created at its target.
  const nowhere = join(dir, 'nowhere');
  const dangling = join(dir, 'dangling.pem');
  symlinkSync(nowhere, dangling);
  const one = await keygen(dangling);
  assert.notEqual(one.status, 0);
  assert.equal(existsSync(nowhere), false, 'the key was not written through the link');
  assert.ok(lstatSync(dangling).isSymbolicLink());
  assert.doesNotMatch(one.stdout, /Private key written/);

  // A link to an existing file is refused as before, and the file is untouched.
  const victim = join(dir, 'victim');
  writeFileSync(victim, 'keep');
  const linked = join(dir, 'linked.pem');
  symlinkSync(victim, linked);
  assert.notEqual((await keygen(linked)).status, 0);
  assert.equal(readFileSync(victim, 'utf8'), 'keep');

  // A plain new name: a regular file, mode 0600, holding a private key; the output never shows it.
  const ok = join(dir, 'publisher.pem');
  const made = await keygen(ok);
  assert.equal(made.status, 0, made.stderr);
  assert.doesNotMatch(made.stdout, /PRIVATE KEY/);
  assert.ok(lstatSync(ok).isFile());
  assert.equal(statSync(ok).mode & 0o777, 0o600);
  assert.match(readFileSync(ok, 'utf8'), /^-----BEGIN PRIVATE KEY-----/);
  // Asking again for the same name still refuses and keeps the key.
  const before = readFileSync(ok, 'utf8');
  assert.notEqual((await keygen(ok)).status, 0);
  assert.equal(readFileSync(ok, 'utf8'), before);
  assert.equal(existsSync(marker), false, 'no stubbed tool was run');
});
