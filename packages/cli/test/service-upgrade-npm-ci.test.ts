// `tabularius upgrade` installs the new version's dependencies. `npm ci` deletes node_modules before it installs, so a
// failure part-way leaves no dependencies at all. The source is then put back, and so must the old version's
// dependencies be: otherwise the message says the old version is back while the server cannot start from it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { upgrade } from '../src/service.ts';

const skip = spawnSync('git', ['--version']).status === 0 ? false : 'needs git';

function repos() {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-upgrade-ci-'));
  const origin = join(dir, 'origin');
  const app = join(dir, 'app');
  const git = (cwd: string, ...args: string[]) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', '-c', 'init.defaultBranch=main', '-C', cwd, ...args], { stdio: 'pipe' }).toString().trim();
  mkdirSync(origin);
  git(origin, 'init', '-q');
  writeFileSync(join(origin, 'package.json'), JSON.stringify({ name: 'app', version: '1.0.0', private: true }));
  writeFileSync(join(origin, 'VERSION'), '1');
  git(origin, 'add', '.');
  git(origin, 'commit', '-qm', 'one');
  git(dir, 'clone', '-q', origin, app);
  const home = join(dir, 'home');
  mkdirSync(home);
  const release = (v: string) => { writeFileSync(join(origin, 'VERSION'), v); git(origin, 'commit', '-qam', v); };
  return { dir, app, home, release, head: () => git(app, 'rev-parse', 'HEAD') };
}

test('a failed npm ci for the new version is followed by a reinstall of the old version\'s dependencies', { skip }, async () => {
  const r = repos();
  try {
    const was = r.head();
    r.release('2');
    const seen: Array<{ app: string; head: string }> = [];
    const install = (app: string) => {
      seen.push({ app, head: r.head() });
      if (seen.length === 1) throw new Error('installing the dependencies failed (npm ci stopped with exit code 1); its output is above');
    };
    await assert.rejects(upgrade({ app: r.app, home: r.home, install }), /installing the dependencies failed.*, so \S+ was put back/s);
    assert.equal(r.head(), was, 'the old source is back');
    assert.equal(seen.length, 2, 'dependencies were installed again');
    assert.notEqual(seen[0].head, was, 'the first install ran on the new version');
    assert.deepEqual(seen[1], { app: r.app, head: was }, 'the second install ran on the old source, after it was put back');
  } finally { rmSync(r.dir, { recursive: true, force: true }); }
});

test('when the old dependencies cannot be reinstalled either, the message says so and what to run', { skip }, async () => {
  const r = repos();
  try {
    const was = r.head();
    r.release('2');
    let calls = 0;
    const install = () => { calls++; throw new Error(calls === 1 ? 'first: registry unreachable' : 'second: registry unreachable'); };
    let message = '';
    await assert.rejects(upgrade({ app: r.app, home: r.home, install }), (e: Error) => { message = e.message; return true; });
    assert.equal(calls, 2);
    assert.equal(r.head(), was);
    assert.match(message, /first: registry unreachable/);
    assert.match(message, /second: registry unreachable/);
    assert.match(message, /dependencies/);
    assert.ok(message.includes(`npm ci`), 'names the command that repairs it');
    assert.ok(message.includes(r.app), 'and the folder to run it in');
    assert.doesNotMatch(message, /so \S+ was put back\s*$/, 'it does not claim a clean rollback');
  } finally { rmSync(r.dir, { recursive: true, force: true }); }
});

test('an install that works leaves one install and no rollback', { skip }, async () => {
  const r = repos();
  try {
    r.release('2');
    let calls = 0;
    const was = r.head();
    await upgrade({ app: r.app, home: r.home, install: () => { calls++; } });
    assert.equal(calls, 1);
    assert.notEqual(r.head(), was);
  } finally { rmSync(r.dir, { recursive: true, force: true }); }
});

// `--from <tarball|folder>`: the old app directory is renamed aside and comes back whole, node_modules included. The
// use of --from is an install with no network, where a reinstall would delete the working dependencies and then fail.
function release(dir: string, name: string, version: string) {
  const folder = join(dir, name);
  mkdirSync(join(folder, 'packages', 'cli', 'src'), { recursive: true });
  writeFileSync(join(folder, 'packages', 'cli', 'src', 'main.ts'), '');
  writeFileSync(join(folder, 'package.json'), JSON.stringify({ name: 'synthetic-app', version, private: true, engines: { node: `>=${process.versions.node}` } }));
  return folder;
}

test('a failed npm ci on a --from upgrade leaves the old version\'s dependencies as they were', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-upgrade-from-'));
  try {
    const app = release(dir, 'app', '1.0.0');
    const source = release(dir, 'new', '2.0.0');
    const home = join(dir, 'home');
    mkdirSync(home);
    mkdirSync(join(app, 'node_modules'));
    writeFileSync(join(app, 'node_modules', 'marker'), 'old dependencies');
    const seen: string[] = [];
    // Like an offline `npm ci`: it empties node_modules of the directory it runs in, then fails.
    const install = (folder: string) => {
      seen.push(JSON.parse(readFileSync(join(folder, 'package.json'), 'utf8')).version);
      rmSync(join(folder, 'node_modules'), { recursive: true, force: true });
      throw new Error('installing the dependencies failed (npm ci stopped with exit code 1); its output is above');
    };
    await assert.rejects(upgrade({ app, home, from: source, install }), /installing the dependencies failed.*, so 1\.0\.0 was put back/s);
    assert.deepEqual(seen, ['2.0.0'], 'only the new version was installed; the old one\'s directory came back untouched');
    assert.equal(JSON.parse(readFileSync(join(app, 'package.json'), 'utf8')).version, '1.0.0');
    assert.equal(readFileSync(join(app, 'node_modules', 'marker'), 'utf8'), 'old dependencies', 'the working dependencies are still there');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a git upgrade whose reinstall never ran is repaired first by the next upgrade', { skip }, async () => {
  const r = repos();
  try {
    const was = r.head();
    r.release('2');
    // The first install fails, and the reinstall of the old version's dependencies fails too (offline): the marker stays.
    await assert.rejects(upgrade({ app: r.app, home: r.home, install: () => { throw new Error('registry unreachable'); } }), /reinstalling its dependencies failed too/);
    assert.ok(existsSync(`${r.app}.reinstall`), 'a marker says the dependencies of the old source are missing');
    // Back online: before it fetches anything, the next upgrade installs the dependencies the old source is missing.
    const installed: string[] = [];
    await upgrade({ app: r.app, home: r.home, install: () => { installed.push(r.head()); } });
    assert.equal(installed.length, 2, 'one install to repair, one for the new version');
    assert.equal(installed[0], was, 'the repair ran on the old source, before the new one was fetched');
    assert.notEqual(installed[1], was);
    assert.equal(existsSync(`${r.app}.reinstall`), false, 'and the marker is gone');
  } finally { rmSync(r.dir, { recursive: true, force: true }); }
});
