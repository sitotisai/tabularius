// Throwaway probe: run the test files named in probe-files.txt on Windows and print the failures in full (not for merge).
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
if (process.platform !== 'win32') { console.log('not windows: skipped'); process.exit(0); }
const run = (cmd: string, args: string[], extra = {}) => spawnSync(cmd, args, { encoding: 'utf8', shell: true, maxBuffer: 1 << 30, ...extra });
console.log('npm ci', run('npm', ['ci', '--no-audit', '--no-fund']).status);
console.log('fixtures', run('npm', ['run', 'fixtures']).status);
const lines0 = readFileSync('probe-files.txt', 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const files = lines0.filter((l) => !l.startsWith('raw:'));
const raw = lines0.filter((l) => l.startsWith('raw:')).map((l) => l.slice(4));
const rawLines = Number(process.env.PROBE_RAW ?? 90);
for (const file of raw) {
  const one = spawnSync(process.execPath, ['--import', pathToFileURL(resolve('scripts/test-windows-cleanup.ts')).href, '--test', '--test-timeout=480000', '--test-reporter=spec', file], { encoding: 'utf8', maxBuffer: 1 << 30, timeout: 9 * 60_000, env: { ...process.env, NODE_OPTIONS: `--import=${pathToFileURL(resolve('scripts/test-windows-paths.ts')).href}` } });
  console.log(`===== RAW ${file} (status ${one.status})`);
  console.log(((one.stdout ?? '') + (one.stderr ?? '')).replace(/\r/g, '').split('\n').filter((l) => l.trim() && !/node:internal|node:async_hooks|runInAsyncScope/.test(l)).slice(-rawLines).map((l) => l.slice(0, 300)).join('\n'));
}
if (!files.length) process.exit(0);
const preload = (process.env.PROBE_NO_PRELOAD ? [] : ['--import', pathToFileURL(resolve('scripts/test-windows-cleanup.ts')).href]);
const r = spawnSync(process.execPath, [...preload, '--test', '--test-concurrency=2', '--test-timeout=240000', '--test-reporter=spec', ...files], { encoding: 'utf8', maxBuffer: 1 << 30, timeout: 14 * 60_000, env: { ...process.env, NODE_OPTIONS: `--import=${pathToFileURL(resolve('scripts/test-windows-paths.ts')).href}` } });
const text = (r.stdout ?? '') + (r.stderr ?? '');
writeFileSync('probe.out', text);
const at = text.indexOf('failing tests:');
const lines = text.split(/\r?\n/);
console.log(lines.filter((l) => /^ℹ (tests|pass|fail|cancelled|skipped)/.test(l)).join(' | '));
if (at < 0) console.log(text.replace(/\r/g, '').slice(-15000));
else {
  const body = text.slice(at).replace(/\r/g, '').split(/\n(?=test at )/).slice(1);
  const keep = Number(process.env.PROBE_LINES ?? 12);
  for (const block of body) {
    const rows = block.split('\n').filter((l) => l.trim() && !/node:internal|node:async_hooks|runInAsyncScope|generatedMessage|operator:|diff:/.test(l));
    console.log(rows.slice(0, keep).map((l) => l.slice(0, 260)).join('\n'));
  }
}
