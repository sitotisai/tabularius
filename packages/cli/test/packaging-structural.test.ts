import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseYaml } from './yaml-subset.ts';

function mapping(value: unknown): Record<string, unknown> {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), 'expected a mapping');
  return value as Record<string, unknown>;
}

function nonempty(value: unknown): void {
  if (typeof value === 'string') assert.ok(value.trim(), 'empty scalar');
  else if (Array.isArray(value)) {
    assert.ok(value.length, 'empty list');
    value.forEach(nonempty);
  } else {
    const entries = Object.entries(mapping(value));
    assert.ok(entries.length, 'empty mapping');
    for (const [key, child] of entries) {
      assert.ok(key.trim(), 'empty key');
      nonempty(child);
    }
  }
}

test('packaging CLI writes complete, consistent and reproducible manifests from three release assets', () => {
  const root = mkdtempSync(join(tmpdir(), 'tabularius-manifests-'));
  try {
    const dist = join(root, 'dist');
    const out = join(root, 'generated');
    const stubs = join(root, 'stubs');
    const marker = join(root, 'unexpected-command');
    mkdirSync(dist);
    mkdirSync(stubs);
    for (const command of ['launchctl', 'systemctl', 'sc', 'git', 'npm', 'curl', 'sudo']) {
      writeFileSync(join(stubs, command), '#!/bin/sh\nprintf "%s\\n" blocked > "$TABULARIUS_TEST_COMMAND_MARKER"\nexit 99\n', { mode: 0o755 });
      writeFileSync(join(stubs, `${command}.cmd`), '@echo off\r\necho blocked > "%TABULARIUS_TEST_COMMAND_MARKER%"\r\nexit /b 99\r\n');
    }
    const version = '1.2.3';
    const repo = 'owner/tabularius';
    const base = `https://github.com/${repo}/releases/download/v${version}/`;
    const assets = ['macos-arm64', 'linux-x64', 'windows-x64.exe'].map((target, i) => {
      const name = `tabularius-${version}-${target}`;
      writeFileSync(join(dist, name), Buffer.from([i, 10, 255, 42]));
      return { name, url: base + name, hash: createHash('sha256').update(readFileSync(join(dist, name))).digest('hex') };
    });
    const run = () => {
      const result = spawnSync(process.execPath, [
        '--no-warnings', join(import.meta.dirname, '../../../scripts/packaging.ts'),
        '--version', version, '--repo', repo, '--dist', dist, '--out', out,
      ], {
        cwd: root, encoding: 'utf8', timeout: 10000,
        env: { ...process.env, PATH: stubs, TABULARIUS_TEST_COMMAND_MARKER: marker },
      });
      assert.equal(existsSync(marker), false, 'no external command may run');
      assert.ifError(result.error);
      assert.equal(result.status, 0, result.stderr);
    };
    run();
    const paths = [
      'homebrew/tabularius.rb', 'scoop/tabularius.json',
      'winget/tabularius.tabularius.installer.yaml', 'winget/tabularius.tabularius.locale.en-US.yaml',
      'winget/tabularius.tabularius.yaml',
    ];
    const snapshot = () => {
      const names = readdirSync(out, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile()).map((entry) => join(entry.parentPath, entry.name).slice(out.length + 1).replaceAll('\\', '/')).sort();
      assert.deepEqual(names, paths);
      return paths.map((path) => readFileSync(join(out, path)));
    };
    const first = snapshot();
    run();
    assert.deepEqual(snapshot(), first, 'second run must produce identical bytes');

    const rb = first[0].toString();
    assert.match(rb, /^class Tabularius < Formula$/m);
    for (const key of ['desc', 'homepage', 'version', 'license', 'url', 'sha256']) {
      const values = [...rb.matchAll(new RegExp(`^ +${key} "([^"\\n]*)"$`, 'gm'))];
      assert.ok(values.length, `missing ${key}`);
      for (const value of values) assert.ok(value[1].trim(), `empty ${key}`);
    }
    assert.match(rb, /^  version "1\.2\.3"$/m);
    assert.match(rb, /^  license "MIT"$/m);
    assert.match(rb, /^  homepage "https:\/\/github\.com\/owner\/tabularius"$/m);
    assert.match(rb, /bin\.install .* => "tabularius"/);
    assert.deepEqual([...rb.matchAll(/url "([^"]+)"\n\s+sha256 "([^"]+)"/g)].map((m) => [m[1], m[2]]), assets.slice(0, 2).map((a) => [a.url, a.hash]));
    assert.match(rb, /on_macos do\n    if Hardware::CPU.arm\?/);
    assert.match(rb, /on_linux do\n    if Hardware::CPU.intel\?/);
    assert.equal([...rb.matchAll(/if Hardware::CPU\./g)].length, 2, 'no unbuilt CPU branches');
    assert.doesNotMatch(rb, /macos-x64|linux-arm64|windows/);

    // This repository's small YAML reader checks block structure, duplicate keys and scalar syntax.
    // Package-manager schema acceptance and installation remain unverified by this offline test.
    const [installer, locale, manifest] = first.slice(2).map((bytes) => {
      const value = mapping(parseYaml(bytes.toString()));
      nonempty(value);
      assert.equal(value.PackageIdentifier, 'tabularius.tabularius');
      assert.equal(value.PackageVersion, version);
      assert.equal(value.ManifestVersion, '1.6.0');
      return value;
    });
    assert.equal(manifest.ManifestType, 'version');
    assert.equal(manifest.DefaultLocale, 'en-US');
    assert.equal(locale.ManifestType, 'defaultLocale');
    assert.equal(locale.PackageLocale, manifest.DefaultLocale);
    assert.equal(locale.Publisher, 'Tabularius contributors');
    assert.equal(locale.PackageName, 'Tabularius');
    assert.equal(locale.License, 'MIT');
    assert.equal(locale.PackageUrl, `https://github.com/${repo}`);
    assert.equal(typeof locale.ShortDescription, 'string');
    assert.equal(installer.ManifestType, 'installer');
    assert.equal(installer.InstallerType, 'portable');
    assert.deepEqual(installer.Commands, ['tabularius']);
    assert.deepEqual(installer.Installers, [{
      Architecture: 'x64', InstallerUrl: assets[2].url, InstallerSha256: assets[2].hash.toUpperCase(),
    }]);

    const scoop = JSON.parse(first[1].toString());
    nonempty(scoop);
    assert.equal(scoop.version, version);
    assert.equal(scoop.description, locale.ShortDescription);
    assert.equal(scoop.homepage, locale.PackageUrl);
    assert.equal(scoop.license, 'MIT');
    assert.equal(scoop.bin, 'tabularius.exe');
    assert.equal(scoop.checkver, 'github');
    assert.deepEqual(scoop.architecture, { '64bit': { url: `${assets[2].url}#/tabularius.exe`, hash: assets[2].hash } });
    assert.deepEqual(scoop.autoupdate, { architecture: { '64bit': {
      url: `https://github.com/${repo}/releases/download/v$version/tabularius-$version-windows-x64.exe#/tabularius.exe`,
    } } });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
