import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from '../../store/src/index.ts';
import { STORE_EXT } from '../../server/src/index.ts';
import { runCli } from './cli-run.ts';
import { testCommandPath } from '../../../scripts/test-command-path.ts';

const main = join(import.meta.dirname, '../src/main.ts');

test('whole-number command options refuse shorthand, blanks, fractions, signs and words', async (t) => {
  const env = testCommandPath(t);
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-whole-options-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  createStore(join(dir, 'Test' + STORE_EXT));
  const backup = join(dir, 'backups');
  const cases = [
    { command: ['fidelity', dir, 'Test'], option: '--n', valid: '5', output: /Test: \d+ stored calculations/ },
    { command: ['stale-calcs', dir, 'Test'], option: '--n', valid: '5', output: /Test: \d+ out-of-date stored values/ },
    { command: ['backup', dir, '--to', backup], option: '--keep', valid: '0', output: /backed up \d+ files to / },
    { command: ['sync-log', dir, 'Test'], option: '--limit', valid: '5', output: /nothing has been sent/ },
    { command: ['test-scripts', dir, 'Test'], option: '--timeout', valid: '5', output: /script|Test/i },
  ];
  for (const { command, option, valid, output } of cases) {
    for (const value of ['1e3', '', '1.5', '-1', 'abc']) {
      const r = await runCli(main, [...command, option, value], { env });
      assert.equal(r.status, 1, `${command[0]} ${option} ${JSON.stringify(value)}: ${r.stderr}`);
      assert.match(r.stderr, new RegExp(`^error: .*${option}\\b.*whole number`));
      assert.equal(r.stdout, '');
    }
    const r = await runCli(main, [...command, option, valid], { env });
    assert.equal(r.status, 0, `${command[0]}: ${r.stderr}`);
    assert.match(r.stdout, output);
  }
  assert.ok(readdirSync(backup).length > 0, 'backup writes a backup set');
  const first = readdirSync(backup)[0]!;
  assert.ok(existsSync(join(backup, first, 'Test' + STORE_EXT)));

  const precedence = await runCli(main, ['fidelity', dir, 'NoSuchDatabase', '--n', '1e3'], { env });
  assert.equal(precedence.status, 1);
  assert.match(precedence.stderr, /^error: .*--n\b.*whole number/);
  assert.doesNotMatch(precedence.stderr, /doesn't exist/);
  assert.equal(precedence.stdout, '');

  for (const { command, option } of [
    { command: ['test-scripts', dir, 'Test'], option: '--loop-limit' },
    { command: ['test-scripts', dir, 'Test'], option: '--loop-records' },
    { command: ['test-scripts', dir, 'Test', '--test-outbound'], option: '--mail-copies' },
    { command: ['records', dir, 'Test', 'MissingTable'], option: '--limit' },
    { command: ['corpus-scan', dir], option: '--jobs' },
    { command: ['upgrade', '--no-backup'], option: '--wait' },
  ]) {
    const r = await runCli(main, [...command, option, '1e3'], { env });
    assert.equal(r.status, 1, `${command[0]} ${option}: ${r.stderr}`);
    assert.match(r.stderr, new RegExp(`^error: .*${option}\\b.*whole number`));
    assert.equal(r.stdout, '');
  }
  for (const option of ['--loop-limit', '--loop-records']) {
    const r = await runCli(main, ['test-scripts', dir, 'Test', option, '0'], { env });
    assert.equal(r.status, 0, r.stderr);
  }
});
