// The rest of what a command writes into a folder the person names: the export-sql script itself (the whole file's data, also when it
// has no container files), the write-back kit's folder, the diagnostics bundle and the corpus-scan report. None of them may be sent
// elsewhere by a link planted beforehand in a folder others can write to, or written through a link or a second name for another file.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, linkSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../../store/src/index.ts';
import { corpusScan } from '../src/corpus-scan.ts';
import { writeBundle } from '../src/diagnostics.ts';
import { writeKitFiles } from '../src/output-files.ts';

const main = join(import.meta.dirname, '..', 'src', 'main.ts');
const skip = process.platform === 'win32' && 'links and modes differ on Windows';
const planted = /link in a folder others can write to/;

// A PATH that holds only stubs: a service, upgrade, install, git or network command would write the marker and exit 99.
const stubs = mkdtempSync(join(tmpdir(), 'tabularius-cli-scripts-stubs-'));
const marker = join(stubs, 'marker');
const originalPath = process.env.PATH;
before(() => {
  for (const name of ['launchctl', 'systemctl', 'sc', 'git', 'npm', 'curl', 'sudo']) {
    writeFileSync(join(stubs, name), `#!/bin/sh\n: > '${marker.replaceAll("'", "'\\''")}'\nexit 99\n`, { mode: 0o755 });
  }
  process.env.PATH = stubs;
});
after(() => {
  try { assert.equal(existsSync(marker), false, 'no service, install, git or network command was run'); }
  finally {
    if (originalPath === undefined) delete process.env.PATH; else process.env.PATH = originalPath;
    rmSync(stubs, { recursive: true, force: true });
  }
});
const cli = (...args: string[]) => spawnSync(process.execPath, ['--no-warnings', main, ...args], { encoding: 'utf8', env: { ...process.env, PATH: stubs } });

/** A folder anyone could write into, as a shared folder is; the umask would otherwise close it. */
function shared(dir: string): string {
  mkdirSync(dir, { recursive: true });
  chmodSync(dir, 0o777);
  return dir;
}

/** A shared folder holding `team`, a link someone else made to a folder of their choosing; returns both. */
function trap(dir: string): { team: string; elsewhere: string } {
  const elsewhere = join(dir, 'elsewhere');
  mkdirSync(elsewhere);
  const team = join(shared(join(dir, 'share')), 'team');
  symlinkSync(elsewhere, team);
  return { team, elsewhere };
}

test('export-sql protects the script even without container fields, while accepting private folder aliases', { skip }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-export-script-'));
  try {
    const path = join(dir, 'Plain.openhbam.sqlite');
    createStore(path);
    const s = new Store(path, 'Plain');
    try {
      s.applyDesign([{ op: 'createTable', name: 'Notes', fields: [{ name: 'Body', type: 'text' }] }] as never);
      s.create('Notes', { Body: 'synthetic note' });
    } finally { s.close(); }
    const { team, elsewhere } = trap(dir);

    const refused = cli('export-sql', dir, 'Plain', '--out', join(team, 'P.sql'), '--dialect', 'sqlite');
    assert.equal(refused.status, 1, refused.stderr);
    assert.match(refused.stderr, planted);
    assert.deepEqual(readdirSync(elsewhere), [], 'the script did not go where the link points');

    // A folder that does not exist yet below the link is refused as well, and nothing is made.
    const below = cli('export-sql', dir, 'Plain', '--out', join(team, 'new', 'Q.sql'), '--dialect', 'sqlite');
    assert.equal(below.status, 1, below.stderr);
    assert.match(below.stderr, planted);
    assert.deepEqual(readdirSync(elsewhere), []);

    // A plain run still works: the script is private to this user and is never overwritten.
    const out = join(dir, 'R.sql');
    const ok = cli('export-sql', dir, 'Plain', '--out', out, '--dialect', 'sqlite');
    assert.equal(ok.status, 0, ok.stderr);
    const sql = readFileSync(out, 'utf8');
    assert.match(sql, /synthetic note/);
    assert.equal(statSync(out).mode & 0o777, 0o600);
    assert.equal(cli('export-sql', dir, 'Plain', '--out', out, '--dialect', 'sqlite').status, 1);
    assert.equal(readFileSync(out, 'utf8'), sql);

    symlinkSync(elsewhere, join(dir, 'alias'));
    assert.equal(cli('export-sql', dir, 'Plain', '--out', join(dir, 'alias', 'S.sql'), '--dialect', 'sqlite').status, 0);
    assert.match(readFileSync(join(elsewhere, 'S.sql'), 'utf8'), /synthetic note/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('the write-back kit makes no folder below a planted link before refusing it', { skip }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-kit-order-'));
  try {
    const { team, elsewhere } = trap(dir);
    const kit = { paste: [{ where: 'File > Manage > Database', names: ['Notes'], xml: '<fmxmlsnippet/>', notes: [] }], byHand: [] };
    assert.throws(() => writeKitFiles(join(team, 'kit', 'deeper'), 'Charts', 'Charts.fmp12', kit), planted);
    assert.deepEqual(readdirSync(elsewhere), [], 'no folder was made where the link points');

    symlinkSync(elsewhere, join(dir, 'alias'));
    writeKitFiles(join(dir, 'alias', 'kit', 'deeper'), 'Charts', 'Charts.fmp12', kit);
    assert.deepEqual(readdirSync(join(elsewhere, 'kit', 'deeper')).sort(), ['01.xml', 'README.md']);
    assert.equal(statSync(join(elsewhere, 'kit')).mode & 0o777, 0o700);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a diagnostics bundle is not written below a planted link, and is private where it is written', { skip }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-bundle-links-'));
  try {
    const { team, elsewhere } = trap(dir);
    const bundle = new Map([['README.txt', 'synthetic readme'], ['doctor.txt', 'synthetic doctor']]);
    assert.throws(() => writeBundle(bundle, join(team, 'bundle')), planted);
    assert.throws(() => writeBundle(bundle, join(team, 'new', 'bundle.zip')), planted);
    assert.throws(() => writeBundle(bundle, join(team, 'bundle.zip')), planted);
    assert.deepEqual(readdirSync(elsewhere), [], 'nothing went where the link points');

    symlinkSync(elsewhere, join(dir, 'alias'));
    const folder = writeBundle(bundle, join(dir, 'alias', 'out', 'bundle'));
    assert.deepEqual(readdirSync(folder).sort(), ['README.txt', 'doctor.txt']);
    assert.equal(statSync(folder).mode & 0o077, 0, 'the bundle folder is closed to other users');
    assert.equal(statSync(join(folder, 'doctor.txt')).mode & 0o777, 0o600);
    const zip = writeBundle(bundle, join(dir, 'alias', 'out', 'bundle.zip'));
    assert.equal(statSync(zip).mode & 0o777, 0o600);
    assert.throws(() => writeBundle(bundle, zip), /already there/);
    assert.throws(() => writeBundle(bundle, folder), /already there/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('the corpus-scan report is not written below a planted link or through links at either file name', { skip, timeout: 120_000 }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-corpus-links-'));
  try {
    const corpus = join(dir, 'corpus');
    mkdirSync(corpus);
    writeFileSync(join(corpus, 'one.fmp12'), Buffer.alloc(100)); // synthetic: not a real file, the scan reports an error class
    const { team, elsewhere } = trap(dir);
    const progress: string[] = [];
    await assert.rejects(corpusScan(corpus, { out: join(team, 'report'), entry: main, log: (line) => progress.push(line) }), planted);
    assert.deepEqual(progress, [], 'the path is refused before scanning starts');
    assert.deepEqual(readdirSync(elsewhere), [], 'nothing went where the link points');

    const victim = join(dir, 'victim.txt');
    writeFileSync(victim, 'keep');
    for (const name of ['corpus-report.json', 'corpus-report.md']) {
      for (const hard of [false, true]) {
        const out = join(dir, `${name}-${hard}`);
        mkdirSync(out);
        const link = join(out, name);
        if (hard) linkSync(victim, link); else symlinkSync(victim, link);
        await assert.rejects(corpusScan(corpus, { out, entry: main, jobs: 1 }), { code: 'ESTALE' });
        assert.equal(readFileSync(victim, 'utf8'), 'keep');
        if (hard) assert.equal(statSync(link).nlink, 2); else assert.ok(lstatSync(link).isSymbolicLink());
        rmSync(link);
      }
    }

    // Ordinary aliases still work; both reports are readable by others (counts only), and may be replaced whole.
    symlinkSync(elsewhere, join(dir, 'alias'));
    const fine = join(dir, 'alias', 'fine');
    await corpusScan(corpus, { out: fine, entry: main, jobs: 1 });
    assert.deepEqual(readdirSync(fine).sort(), ['corpus-report.json', 'corpus-report.md']);
    for (const name of readdirSync(fine)) {
      assert.equal(statSync(join(fine, name)).mode & 0o777, 0o644);
      writeFileSync(join(fine, name), 'left over'.repeat(1000));
    }
    await corpusScan(corpus, { out: fine, entry: main, jobs: 1 });
    for (const name of readdirSync(fine)) assert.ok(!readFileSync(join(fine, name), 'utf8').includes('left over'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
