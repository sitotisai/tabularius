// Throwaway probe: run one shard of the test suite on Windows and print what fails as it goes (not for merge).
import { spawn, spawnSync } from 'node:child_process';
import { createWriteStream, readFileSync } from 'node:fs';
const shard = process.env.GITHUB_REF_NAME?.match(/win-probe-(\d+)/)?.[1] ?? '1';
const COUNT = 12;
if (process.platform !== 'win32') { console.log('not windows: skipped'); process.exit(0); }
const run = (cmd: string, args: string[]) => spawnSync(cmd, args, { encoding: 'utf8', shell: true, maxBuffer: 1 << 30 });
console.log('npm ci', run('npm', ['ci', '--no-audit', '--no-fund']).status);
console.log('fixtures', run('npm', ['run', 'fixtures']).status);
const out = createWriteStream('probe.out');
const child = spawn(process.execPath, ['scripts/test-ci.ts', `--shard=${shard}/${COUNT}`], { stdio: ['ignore', 'pipe', 'pipe'] });
child.stdout.pipe(out, { end: false });
child.stderr.pipe(out, { end: false });
const seen = new Set<string>();
let passed = 0;
function report() {
  const lines = readFileSync('probe.out', 'utf8').split(/\r?\n/);
  passed = lines.filter((l) => /^\s*✔/.test(l)).length;
  lines.forEach((l, i) => {
    if (/^\s*✖/.test(l)) seen.add(`${i}`);
  });
}
const timer = setInterval(report, 60_000);
const kill = setTimeout(() => {
  console.log('STOPPED AT THE TIME LIMIT');
  const ps = spawnSync('powershell', ['-NoProfile', '-Command', "Get-CimInstance Win32_Process -Filter \"name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: 'utf8' });
  console.log('RUNNING:\n' + (ps.stdout ?? '').split(/\r?\n/).filter((l) => /test\.ts/.test(l)).map((l) => l.replace(/^.*?(packages[\\/]\S+test\.ts|scripts[\\/]\S+test\.ts).*$/, '  $1')).join('\n'));
  const t = readFileSync('probe.out', 'utf8').split(/\r?\n/);
  console.log('LAST LINES:\n' + t.slice(-12).join('\n'));
  child.kill();
}, 20 * 60_000);
await new Promise((r) => child.on('close', r));
clearInterval(timer); clearTimeout(kill);
report();
console.log(`shard ${shard}/${COUNT}: ${passed} passed, ${seen.size} failure lines`);
const text = readFileSync('probe.out', 'utf8');
const tail = text.slice(Math.max(0, text.indexOf('failing tests:')));
const rows: string[] = [];
const lines = tail.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  const at = /^test at (.+?):\d+:\d+/.exec(lines[i]);
  if (!at) continue;
  const name = (lines[i + 1] ?? '').replace(/^\s*✖\s*/, '').replace(/\s*\(\d+(\.\d+)?ms\)\s*$/, '').slice(0, 90);
  const err = (lines[i + 2] ?? '').trim().replace(/'[^']*[\\/][^']*'/g, '<path>').slice(0, 220);
  rows.push(`FAIL ${at[1].replace(/\\/g, '/')} :: ${name} :: ${err}`);
  if (!/# /.test(name) && !/ # /.test(lines[i + 1] ?? '')) {
    const more: string[] = [];
    for (let j = i + 3; j < Math.min(lines.length, i + 40) && !/^test at /.test(lines[j]); j++) {
      const l = lines[j].trim();
      if (l && !/node:internal|node:async_hooks|runInAsyncScope|generatedMessage|operator:|diff:|code:/.test(l)) more.push('    ' + l.slice(0, 240));
      if (more.length >= 14) break;
    }
    rows.push(more.join('\n'));
  }
}
console.log(rows.join('\n'));
console.log(text.split(/\r?\n/).filter((l) => /^ℹ (tests|pass|fail|cancelled|duration_ms)/.test(l)).join(' | '));
