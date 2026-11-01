// What a command writes into a folder the person names must not be sent elsewhere by something planted in that folder beforehand:
// export-sql's `<name>.files` folder and the links above it, `plugins pack -o`, and the paste files write-back makes. The
// boundary's refusal does not name a path (servers show it to clients); the command line adds the path for the person at the terminal.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, linkSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspect } from 'node:util';
import { createStore, Store } from '../../store/src/index.ts';
import { writeFileSync as writeChecked } from '../../store/src/fs-boundary.ts';
import { plainFolders, writeKitFiles } from '../src/output-files.ts';

const main = join(import.meta.dirname, '..', 'src', 'main.ts');
// The command line runs with a PATH that holds only stubs: a service, upgrade, install, git or network command would write the marker and exit 99.
const stubs = mkdtempSync(join(tmpdir(), 'tabularius-cli-stubs-'));
const marker = join(stubs, 'marker');
for (const name of ['launchctl', 'systemctl', 'sc', 'git', 'npm', 'curl', 'sudo']) {
  writeFileSync(join(stubs, name), `#!/bin/sh\n: > '${marker}'\nexit 99\n`, { mode: 0o755 });
}
after(() => rmSync(stubs, { recursive: true, force: true }));
const cli = (...args: string[]) => spawnSync(process.execPath, ['--no-warnings', main, ...args], { encoding: 'utf8', env: { ...process.env, PATH: stubs } });
const skip = process.platform === 'win32' && 'links and modes differ on Windows';

/** A folder anyone could write into, as a shared folder is; the umask would otherwise close it. */
function shared(dir: string): string {
  mkdirSync(dir, { recursive: true });
  chmodSync(dir, 0o777);
  return dir;
}

function shop(dir: string): number {
  const path = join(dir, 'Shop.openhbam.sqlite');
  createStore(path);
  const s = new Store(path, 'Shop');
  try {
    s.applyDesign([{ op: 'createTable', name: 'Orders', fields: [{ name: 'Customer', type: 'text' }, { name: 'Photo', type: 'container' }] }] as never);
    const id = Number(s.create('Orders', { Customer: 'Synthetic customer' }).recordId);
    s.setContainer('Orders', id, 'Photo', 1, { filename: 'p.png', mime: 'image/png', data: new Uint8Array([9, 8, 7]) });
    return id;
  } finally { s.close(); }
}

test('export-sql refuses a link or a file standing where its container folders go, and says which', { skip }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-export-folders-'));
  try {
    const id = shop(dir);
    const elsewhere = join(dir, 'elsewhere');
    mkdirSync(elsewhere);
    const run = (name: string) => cli('export-sql', dir, 'Shop', '--out', join(dir, `${name}.sql`), '--dialect', 'sqlite');

    // The sidecar folder itself is a link to a folder elsewhere.
    symlinkSync(elsewhere, join(dir, 'A.files'));
    const linked = run('A');
    assert.equal(linked.status, 1, linked.stderr);
    assert.match(linked.stderr, /A\.files is not a plain folder/);
    assert.deepEqual(readdirSync(elsewhere), [], 'nothing was written into the folder the link points to');
    assert.equal(existsSync(join(dir, 'A.sql')), false, 'no half-finished script is left');

    // ... a file stands there ...
    writeFileSync(join(dir, 'B.files'), 'in the way');
    const file = run('B');
    assert.equal(file.status, 1, file.stderr);
    assert.match(file.stderr, /B\.files is not a plain folder/);
    assert.equal(readFileSync(join(dir, 'B.files'), 'utf8'), 'in the way');

    // ... or the table folder below it is a link.
    mkdirSync(join(dir, 'C.files'));
    symlinkSync(elsewhere, join(dir, 'C.files', 'Orders'));
    const below = run('C');
    assert.equal(below.status, 1, below.stderr);
    assert.match(below.stderr, /Orders is not a plain folder/);
    assert.deepEqual(readdirSync(elsewhere), []);

    // A plain run still works; the folders are closed to other users and the files private.
    const ok = run('D');
    assert.equal(ok.status, 0, ok.stderr);
    assert.deepEqual([...readFileSync(join(dir, 'D.files', 'Orders', `${id}-2-p.png`))], [9, 8, 7]);
    assert.equal(statSync(join(dir, 'D.files')).mode & 0o077, 0);
    assert.equal(statSync(join(dir, 'D.files', 'Orders')).mode & 0o077, 0);

    // A refusal by the boundary (a link at the container file) names the path on the terminal.
    mkdirSync(join(dir, 'E.files', 'Orders'), { recursive: true });
    const victim = join(dir, 'victim.txt');
    writeFileSync(victim, 'keep');
    const planted = join(dir, 'E.files', 'Orders', `${id}-2-p.png`);
    symlinkSync(victim, planted);
    const refused = run('E');
    assert.equal(refused.status, 1, refused.stderr);
    assert.match(refused.stderr, /Filesystem path changed or is not a safe regular file/);
    assert.ok(refused.stderr.includes(planted), refused.stderr);
    assert.equal(readFileSync(victim, 'utf8'), 'keep');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a link planted in a shared folder above the export is refused; ordinary aliases in private folders are not', { skip }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-export-above-'));
  try {
    shop(dir);
    const elsewhere = join(dir, 'elsewhere');
    mkdirSync(elsewhere);
    // Someone who can write to the shared folder made `team`, which points to a folder they chose.
    const open = shared(join(dir, 'share'));
    symlinkSync(elsewhere, join(open, 'team'));
    const planted = cli('export-sql', dir, 'Shop', '--out', join(open, 'team', 'P.sql'), '--dialect', 'sqlite');
    assert.equal(planted.status, 1, planted.stderr);
    assert.match(planted.stderr, /link in a folder others can write to/);
    assert.deepEqual(readdirSync(elsewhere), [], 'nothing was written where the link points');
    // The same link made in a folder only this user can write is the person's own alias.
    const own = join(dir, 'own');
    mkdirSync(own, { mode: 0o700 });
    chmodSync(own, 0o700);
    symlinkSync(elsewhere, join(own, 'alias'));
    const alias = cli('export-sql', dir, 'Shop', '--out', join(own, 'alias', 'Q.sql'), '--dialect', 'sqlite');
    assert.equal(alias.status, 0, alias.stderr);
    assert.ok(existsSync(join(elsewhere, 'Q.sql')));
    assert.ok(existsSync(join(elsewhere, 'Q.files', 'Orders')));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('plugins pack -o does not write through a planted link or a second name, and makes a readable package', { skip }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-pack-boundary-'));
  try {
    const src = join(dir, 'src-pack');
    mkdirSync(src);
    writeFileSync(join(src, 'plugin.json'), JSON.stringify({ id: 'org.example.packed', name: 'Packed', version: '1.0.0', api: '^1.0', publisher: 'Example', main: 'main.js', functions: [{ name: 'Ex_Pack', min: 1, max: 1 }] }));
    writeFileSync(join(src, 'main.js'), 'const functions = { Ex_Pack: (s) => s };');
    const victim = join(dir, 'victim.txt');
    writeFileSync(victim, 'keep');
    const pack = (out: string) => cli('plugins', dir, 'pack', src, '-o', out);

    const link = join(dir, 'linked.ohplugin');
    symlinkSync(victim, link);
    const linked = pack(link);
    assert.equal(linked.status, 1, linked.stderr);
    assert.match(linked.stderr, /Filesystem path changed or is not a safe regular file/);
    assert.ok(linked.stderr.includes(link), linked.stderr);
    assert.equal(readFileSync(victim, 'utf8'), 'keep');
    assert.ok(lstatSync(link).isSymbolicLink());

    const second = join(dir, 'second.ohplugin');
    linkSync(victim, second);
    assert.equal(pack(second).status, 1);
    assert.equal(readFileSync(victim, 'utf8'), 'keep');

    // A package that is already there, writable by others, is replaced whole; a new one is readable but not writable by others.
    const old = join(dir, 'old.ohplugin');
    writeFileSync(old, 'left over'.repeat(100));
    chmodSync(old, 0o666);
    const made = pack(old);
    assert.equal(made.status, 0, made.stderr);
    assert.equal(statSync(old).mode & 0o777, 0o644);
    assert.ok(readFileSync(old).length > 0 && !readFileSync(old).includes('left over'));
    const fresh = join(dir, 'fresh.ohplugin');
    assert.equal(pack(fresh).status, 0);
    assert.equal(statSync(fresh).mode & 0o777, 0o644);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('the write-back paste files and README are private, replaced whole and never written through a planted link', { skip }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-kit-boundary-'));
  try {
    const kit = { paste: [{ where: 'File > Manage > Database', names: ['Notes'], xml: '<fmxmlsnippet/>', notes: ['a note'] }], byHand: ['Add table occurrence "Notes"'] };
    const victim = join(dir, 'victim.txt');
    writeFileSync(victim, 'keep');

    // A link planted at a file name in the folder.
    const a = join(dir, 'a');
    mkdirSync(a);
    symlinkSync(victim, join(a, '01.xml'));
    assert.throws(() => writeKitFiles(a, 'Charts', 'Charts.fmp12', kit), { code: 'ESTALE' });
    assert.equal(readFileSync(victim, 'utf8'), 'keep');
    const b = join(dir, 'b');
    mkdirSync(b);
    symlinkSync(victim, join(b, 'README.md'));
    assert.throws(() => writeKitFiles(b, 'Charts', 'Charts.fmp12', kit), { code: 'ESTALE' });
    assert.equal(readFileSync(victim, 'utf8'), 'keep');

    // The folder is a link planted in a shared folder.
    const elsewhere = join(dir, 'elsewhere');
    mkdirSync(elsewhere);
    symlinkSync(elsewhere, join(shared(join(dir, 'share')), 'kit'));
    assert.throws(() => writeKitFiles(join(dir, 'share', 'kit'), 'Charts', 'Charts.fmp12', kit), /link in a folder others can write to/);
    assert.deepEqual(readdirSync(elsewhere), []);

    // A plain folder: private files and folder, and a README that lists the paste file.
    const c = join(dir, 'c', 'deeper');
    const readme = writeKitFiles(c, 'Charts', 'Charts.fmp12', kit);
    assert.equal(readme, join(c, 'README.md'));
    assert.deepEqual(readdirSync(c).sort(), ['01.xml', 'README.md']);
    assert.equal(statSync(join(c, '01.xml')).mode & 0o777, 0o600);
    assert.equal(statSync(readme).mode & 0o777, 0o600);
    assert.equal(statSync(c).mode & 0o077, 0);
    const originalReadme = readFileSync(readme, 'utf8');
    assert.match(originalReadme, /1\. `01\.xml` \(Notes\): File > Manage > Database\n {3}- a note/);
    assert.match(originalReadme, /## Then do these by hand\n\n- Add table occurrence "Notes"/);
    // Existing readable files are replaced whole and made private as well.
    for (const file of [join(c, '01.xml'), readme]) {
      writeFileSync(file, 'left over'.repeat(1000));
      chmodSync(file, 0o644);
    }
    writeKitFiles(c, 'Charts', 'Charts.fmp12', kit);
    assert.equal(readFileSync(join(c, '01.xml'), 'utf8'), kit.paste[0].xml);
    assert.equal(readFileSync(readme, 'utf8'), originalReadme);
    for (const file of [join(c, '01.xml'), readme]) assert.equal(statSync(file).mode & 0o777, 0o600);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('plainFolders leaves a link above a private folder alone and refuses one in the way', { skip }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-plain-folders-'));
  try {
    mkdirSync(join(dir, 'real'));
    symlinkSync(join(dir, 'real'), join(dir, 'alias'));
    plainFolders(join(dir, 'alias'), 'X.files/Orders/1-1-a.png');
    assert.ok(lstatSync(join(dir, 'real', 'X.files', 'Orders')).isDirectory());
    symlinkSync(join(dir, 'real'), join(dir, 'real', 'X.files', 'Orders', 'bad'));
    assert.throws(() => plainFolders(join(dir, 'alias'), 'X.files/Orders/bad/1-1-a.png'), /is not a plain folder/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('the boundary refusal names no path in its message, string, JSON or inspected form; the path is there for the terminal', { skip }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-refusal-message-'));
  try {
    const victim = join(dir, 'victim.txt');
    writeFileSync(victim, 'keep');
    const link = join(dir, 'link.txt');
    symlinkSync(victim, link);
    let caught: (Error & { code?: string; refusedPath?: string }) | undefined;
    try { writeChecked(link, 'x'); } catch (e) { caught = e as typeof caught; }
    assert.equal(caught?.code, 'ESTALE');
    assert.equal(caught?.message, 'Filesystem path changed or is not a safe regular file');
    assert.equal(caught?.refusedPath, link);
    assert.deepEqual(Object.keys(caught!), ['code']);
    for (const form of [String(caught), JSON.stringify(caught), inspect(caught, { showHidden: false })]) assert.ok(!form.includes(link) && !form.includes(dir), form.slice(0, 200));
    assert.equal(readFileSync(victim, 'utf8'), 'keep');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('the command line ran no service, install, git or network command', () => {
  assert.equal(existsSync(marker), false);
});
