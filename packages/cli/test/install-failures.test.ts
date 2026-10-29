import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { delimiter, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const script = readFileSync(new URL('../../../scripts/install.ps1', import.meta.url), 'utf8');
function messages(text: string): Map<string, string> {
  const body = /\$Messages = @{\r?\n([\s\S]*?)\r?\n}/.exec(text)?.[1];
  assert.ok(body, 'installer must have a message table');
  return new Map(body.split(/\r?\n/).map(line => {
    const match = /^  (\w+) = '((?:[^']|'')+)'$/.exec(line);
    assert.ok(match, `unparsed message: ${line}`);
    return [match[1], match[2].replaceAll("''", "'")];
  }));
}

test('message parser round trips literal quotes and parameterised messages', () => {
  const expected = new Map([['Download', "Can't download {0}; check {1}."], ['Path', 'Use {0} next.']]);
  const text = '$Messages = @{\n' + [...expected].map(([k, v]) => `  ${k} = '${v.replaceAll("'", "''")}'`).join('\n') + '\n}';
  assert.deepEqual(messages(text), expected);
});

test('every failure branch uses a defined actionable message, with no silent failure exit', () => {
  const table = messages(script);
  for (const key of ['Download', 'Write', 'Checksum', 'Archive', 'Blocked', 'Architecture', 'Replace', 'Recovery', 'Path', 'Policy', 'Dependencies', 'Service', 'Unexpected']) {
    assert.ok(table.has(key), key);
    assert.match(table.get(key)!, /; .+\.$/, `${key} needs a next step`);
  }
  const refs = [...script.matchAll(/(?:Die|\$script:Failure =) '([A-Za-z]+)'/g)].map(m => m[1]);
  for (const key of refs) assert.ok(table.has(key), key);
  assert.equal((script.match(/\bDie\s/g) ?? []).length, refs.length - (script.match(/\$script:Failure = '/g) ?? []).length);
  assert.doesNotMatch(script, /Write-Error|exit \$LASTEXITCODE|throw\s*$/m);
  assert.match(script, /trap \{[\s\S]*?\[Console\]::Error.WriteLine[\s\S]*?exit 1/);
});

test('downloaded Node must run --version before the old installation moves or is removed', () => {
  const probe = script.indexOf('if (-not (Test-Node $candidate))');
  const save = script.indexOf("Move-Item -LiteralPath (Join-Path $OhHome 'node') -Destination $previousNode");
  const remove = script.indexOf('Remove-Item -LiteralPath $previousNode');
  assert.ok(probe > script.indexOf('Expand-Archive') && probe < save && save < remove);
  assert.match(script, /& \$exe --version/);
  assert.match(script, /Get-NodeArchitecture \$env:PROCESSOR_ARCHITECTURE \$env:PROCESSOR_ARCHITEW6432/);
  assert.match(script, /\$env:PATH = "\$bin;\$env:PATH"/);
  assert.match(script, /Say \$Messages.Path/);
});

test('PowerShell pure decisions (visibly skipped when PowerShell is unavailable)', t => {
  const executable = (process.env.PATH ?? '').split(delimiter).flatMap(dir => ['pwsh', 'powershell.exe'].map(name => join(dir, name))).find(existsSync);
  if (!executable) { t.skip('PowerShell unavailable; native parsing and function execution remain unverified'); return; }
  const root = mkdtempSync(join(tmpdir(), 'tabularius-ps-decisions-'));
  try {
    const marker = join(root, 'forbidden');
    for (const name of ['launchctl', 'systemctl', 'sc', 'git', 'npm', 'curl', 'sudo']) {
      writeFileSync(join(root, name), '#!/bin/sh\nprintf forbidden > "$MARKER"\nexit 99\n', { mode: 0o755 });
      writeFileSync(join(root, `${name}.cmd`), '@echo forbidden > "%MARKER%"\r\n@exit /b 99\r\n');
    }
    const functions = script.split('# BEGIN offline decisions')[1]?.split('# END offline decisions')[0];
    assert.ok(functions);
    const harness = join(root, 'decisions.ps1');
    writeFileSync(join(root, 'installer.txt'), script);
    writeFileSync(harness, `$ErrorActionPreference = 'Stop'\n${functions}\n$tokens = $null; $errors = $null\n[System.Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'installer.txt'), [ref]$tokens, [ref]$errors) | Out-Null\nif ($errors.Count) { exit 9 }\nif ((Get-NodeArchitecture 'x86' 'AMD64') -ne 'x64') { exit 2 }\nif ((Get-NodeArchitecture 'AMD64' 'ARM64') -ne 'arm64') { exit 3 }\nif ($null -ne (Get-NodeArchitecture 'x86' '')) { exit 4 }\nif ((Get-NodeArchive '22.22.0' 'arm64') -ne 'node-v22.22.0-win-arm64.zip') { exit 5 }\nif (-not (Test-Checksum ('a' * 64) ('A' * 64))) { exit 6 }\nif (Test-Checksum '<missing>' ('a' * 64)) { exit 7 }\nif (Test-Checksum ('a' * 64) ('b' * 64)) { exit 8 }\n`);
    const result = spawnSync(executable, ['-NoProfile', '-NonInteractive', '-File', harness], { encoding: 'utf8', timeout: 15_000, env: { ...process.env, PATH: root, MARKER: marker } });
    assert.equal(existsSync(marker), false, 'forbidden command executed');
    assert.equal(result.status, 0, result.stderr || String(result.error));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('operations that can throw have phase-specific recovery messages', () => {
  const phase = (operation: string) => {
    const at = script.indexOf(operation);
    assert.ok(at >= 0, operation);
    return [...script.slice(0, at).matchAll(/\$script:Failure = '(\w+)'/g)].at(-1)?.[1];
  };
  for (const [operation, key] of [
    ['New-Item -ItemType Directory -Force -Path $OhHome', 'Write'],
    ['Invoke-WebRequest -UseBasicParsing', 'Download'],
    ['Get-FileHash -Algorithm SHA256', 'Checksum'],
    ['Expand-Archive -Path', 'Archive'],
    ["Move-Item -LiteralPath (Join-Path $OhHome 'node')", 'Replace'],
    ['& $Npm ci', 'Dependencies'],
    ['[IO.File]::WriteAllText', 'Write'],
    ["[Environment]::SetEnvironmentVariable('Path'", 'PathWrite'],
  ]) assert.equal(phase(operation), key, operation);
  assert.match(script, /if \(-not \$arch\) \{ Die 'Architecture' \}/);
  assert.match(script, /if \(-not \(Test-Node \$candidate\)\) \{ Die 'Blocked' \}/);
  assert.match(script, /catch \{\s+# Never remove[^\n]+\s+\$script:Failure = 'Recovery'/);
});

test('application version is checked before publishing command wrappers', () => {
  const probe = script.indexOf('& $Node --no-warnings $Cli --version');
  assert.ok(probe > script.indexOf('& $Npm ci') && probe < script.indexOf('[IO.File]::WriteAllText'));
  assert.match(script.slice(probe), /if \(\$LASTEXITCODE\) \{ Die 'AppLaunch' \}/);
});

test('replacement is staged on the destination volume so publication cannot become a partial cross-volume copy', () => {
  assert.match(script, /\$tmp = Join-Path \$OhHome \("tabularius-node-" \+ \[guid\]::NewGuid\(\)\)/);
});
