// On Windows a program started by a bare name ("git", "tasklist.exe") is looked for in the current folder first. The boot task of
// `service install --system` runs as the system account with the hosted folder as its current folder, and an ordinary account
// can write to that folder, so a planted git.exe would run as the system account. Code that the running server reaches must
// start programs by a full path (findExecutable gives one from PATH and never from the current folder).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const packages = join(import.meta.dirname, '..', '..');
const SERVER_SIDE = ['server', 'calc', 'store', 'scripts', 'plugins', 'fmp12'];

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'node_modules' ? [] : sources(path);
    return /\.(ts|cjs|mjs|js)$/.test(name) ? [path] : [];
  });
}

test('the server and its libraries start no program by a bare name', () => {
  const files = [...SERVER_SIDE.flatMap((p) => sources(join(packages, p, 'src'))), join(packages, 'cli', 'src', 'diagnostics.ts')];
  const call = /(?<![.\w])(?:execFileSync|execFile|spawnSync|spawn|execSync|exec)\(\s*(['"`])([^'"`\n]+)\1/g;
  const bare: string[] = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(call)) {
      if (/^(\/|[A-Za-z]:[\\/])/.test(m[2])) continue;
      bare.push(`${relative(packages, file)}: ${m[0]}`);
    }
  }
  assert.deepEqual(bare, [], 'give the program as a full path (findExecutable, or the system folder), not a bare name');
});

test('the tasklist path in the sandbox worker is the fixed system folder, not read from the environment', () => {
  const text = readFileSync(join(packages, 'calc', 'src', 'javascript.ts'), 'utf8');
  assert.doesNotMatch(text, /process\.env\.(SystemRoot|windir)/);
  assert.match(text, /C:\\\\Windows\\\\System32\\\\tasklist\.exe/);
});
