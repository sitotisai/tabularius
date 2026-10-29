import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runCli } from './cli-run.ts';

for (const source of ['flag', 'file', 'env', 'env-file']) test(`serve refuses a short MCP administrator token from ${source}`, async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-token-strength-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const bin = join(dir, 'bin'); mkdirSync(bin);
  const marker = join(dir, 'unexpected-command');
  for (const name of ['launchctl', 'systemctl', 'sc', 'git', 'npm', 'curl', 'sudo']) writeFileSync(join(bin, name), '#!/bin/sh\n: > "$A07_MARKER"\nexit 99\n', { mode: 0o755 });
  const file = join(dir, 'credential'); writeFileSync(file, 'a', { mode: 0o600 });
  const env: NodeJS.ProcessEnv = { PATH: bin, HOME: dir, A07_MARKER: marker };
  const flags = source === 'flag' ? ['--mcp-token', 'a'] : source === 'file' ? ['--mcp-token-file', file] : [];
  if (source === 'env') env.TABULARIUS_MCP_TOKEN = 'a';
  if (source === 'env-file') env.TABULARIUS_MCP_TOKEN_FILE = file;
  // An incomplete TLS configuration prevents an unfixed CLI from ever starting a server.
  const r = await runCli(join(import.meta.dirname, '../src/main.ts'), ['serve', dir, ...flags, '--port', '0', '--tls-cert', 'unused'], { env, timeout: 10_000 });
  assert.equal(existsSync(marker), false, 'no operational command ran');
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, /MCP.*at least 16 characters/i);
  const accepted = 'a'.repeat(16);
  writeFileSync(file, accepted);
  if (source === 'env') env.TABULARIUS_MCP_TOKEN = accepted;
  const validFlags = source === 'flag' ? ['--mcp-token', accepted] : flags;
  const valid = await runCli(join(import.meta.dirname, '../src/main.ts'), ['serve', dir, ...validFlags, '--port', '0', '--tls-cert', 'unused'], { env, timeout: 10_000 });
  assert.match(valid.stderr, /give both --tls-cert and --tls-key/, 'a token at the boundary passes token validation');
  assert.equal(existsSync(marker), false, 'no operational command ran');
});
