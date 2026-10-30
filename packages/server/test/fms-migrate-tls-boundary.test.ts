import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { localCertificate } from '../src/local-tls.ts';
import { migrateFms } from '../src/fms-migrate.ts';

// A generated certificate and key laid out as the FileMaker Server folder keeps them (CStore/serverCustom.pem and serverKey.pem).
function source(root: string) {
  const made = localCertificate(join(root, 'maker'), ['localhost']);
  const fms = join(root, 'fms');
  mkdirSync(join(fms, 'CStore'), { recursive: true });
  writeFileSync(join(fms, 'CStore', 'serverCustom.pem'), made.cert);
  writeFileSync(join(fms, 'CStore', 'serverKey.pem'), made.key);
  return fms;
}

test('the migrated certificate and key are written as whole files and never through a planted link', { skip: process.platform === 'win32' && 'links need privileges on Windows' }, () => {
  const root = mkdtempSync(join(tmpdir(), 'tabularius-migrate-tls-'));
  try {
    const fms = source(root);
    const dest = join(root, 'dest');
    // 1. A normal run: both files exist, the key is private, no temporary file is left.
    const report = migrateFms({}, dest, { fmsDir: fms });
    assert.equal(report.certificate?.done, true);
    const tls = join(dest, 'tls');
    assert.match(readFileSync(join(tls, 'cert.pem'), 'utf8'), /^-----BEGIN CERTIFICATE-----/);
    assert.match(readFileSync(join(tls, 'key.pem'), 'utf8'), /^-----BEGIN PRIVATE KEY-----/);
    assert.equal(statSync(join(tls, 'key.pem')).mode & 0o777, 0o600);
    assert.deepEqual(readdirSync(tls).sort(), ['cert.pem', 'key.pem']);
    // 2. A second run over the same destination replaces both as whole files.
    assert.equal(migrateFms({}, dest, { fmsDir: fms }).certificate?.done, true);
    assert.deepEqual(readdirSync(tls).sort(), ['cert.pem', 'key.pem']);
    // 3. A link planted at either name is refused, and what it points to is left alone.
    for (const name of ['key.pem', 'cert.pem']) {
      const victim = join(root, `victim-${name}`);
      writeFileSync(victim, 'keep');
      rmSync(join(tls, name));
      symlinkSync(victim, join(tls, name));
      assert.throws(() => migrateFms({}, dest, { fmsDir: fms }), (e: NodeJS.ErrnoException) => e.code === 'ESTALE', name);
      assert.equal(readFileSync(victim, 'utf8'), 'keep', name);
      assert.ok(lstatSync(join(tls, name)).isSymbolicLink(), `${name} is still the planted link`);
      rmSync(join(tls, name));
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});
