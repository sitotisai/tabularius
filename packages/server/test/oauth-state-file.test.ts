import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lstatSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OAuthServer, OAUTH_DB } from '../src/oauth.ts';

test('the OAuth database name is not followed when it is a link, and an older, wider file is made private', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-oauth-state-'));
  try {
    const file = join(dir, OAUTH_DB);
    if (process.platform !== 'win32') {
      const victim = join(dir, 'victim');
      writeFileSync(victim, 'keep', { mode: 0o644 });
      const mode = lstatSync(victim).mode;
      symlinkSync(victim, file);
      assert.throws(() => new OAuthServer({ dir } as never, dir), (e: NodeJS.ErrnoException) => e.code === 'ESTALE');
      assert.equal(readFileSync(victim, 'utf8'), 'keep');
      assert.equal(lstatSync(victim).mode, mode);
      assert.equal(lstatSync(file).isSymbolicLink(), true);
      rmSync(file);
    }
    writeFileSync(file, '', { mode: 0o644 });
    new OAuthServer({ dir } as never, dir).close();
    assert.equal(lstatSync(file).isFile(), true);
    if (process.platform !== 'win32') assert.equal(lstatSync(file).mode & 0o777, 0o600);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
