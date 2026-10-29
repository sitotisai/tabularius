import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPerformance } from './bench-check-lib.ts';

test('quick generated workload completes all four operations without external commands', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-budget-test-'));
  try {
    const bin = join(dir, 'bin'), temp = join(dir, 'temp'), marker = join(dir, 'forbidden-command');
    mkdirSync(bin); mkdirSync(temp);
    for (const command of ['launchctl', 'systemctl', 'sc', 'git', 'npm', 'curl', 'sudo']) {
      const path = join(bin, command);
      writeFileSync(path, '#!/bin/sh\nprintf forbidden > "$BENCH_BUDGET_TEST_MARKER"\nexit 99\n');
      chmodSync(path, 0o755);
    }
    const run = spawnSync(process.execPath, ['--no-warnings', fileURLToPath(new URL('./bench-budgets.ts', import.meta.url)), '--quick'], {
      encoding: 'utf8', timeout: 30_000, env: { PATH: bin, TMPDIR: temp, TMP: temp, TEMP: temp, BENCH_BUDGET_TEST_MARKER: marker },
    });
    assert.equal(existsSync(marker), false, 'forbidden subprocess attempted');
    assert.ifError(run.error);
    assert.equal(run.status, 0, run.stderr);
    const output = JSON.parse(run.stdout);
    assert.deepEqual(output.config, { records: 100, importRows: 10, coldRows: 64, payloadBytes: 1024 });
    assert.ok(output.coldBytes >= 64 * 1024);
    assert.equal(checkPerformance(output.measures, output.measures.map(({ id }: { id: string }) => ({ id, maxMs: 1e9 }))).length, 4);
    assert.deepEqual(readdirSync(temp), []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
