// `migrate-fms --save` and the container files of `export-sql` are private files that are replaced whole and never written through a link.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../../store/src/index.ts';

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
const REFUSAL = /Filesystem path changed or is not a safe regular file/;

test('migrate-fms --save creates a private file during a dry run without changing the destination', { skip }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-save-new-boundary-'));
  try {
    const exported = join(dir, 'export.json');
    writeFileSync(exported, JSON.stringify({ general: { name: 'Synthetic server' } }));
    const dest = join(dir, 'dest');
    mkdirSync(dest);
    const saved = join(dir, 'saved.json');
    const result = cli('migrate-fms', dest, '--from', exported, '--save', saved, '--dry-run');
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Dry run: nothing changed/);
    assert.deepEqual(readdirSync(dest), []);
    assert.equal(statSync(saved).mode & 0o777, 0o600);
    assert.deepEqual(JSON.parse(readFileSync(saved, 'utf8')), { general: { name: 'Synthetic server' } });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('migrate-fms --save makes its file private and does not write through a planted link', { skip }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-save-boundary-'));
  try {
    const exported = join(dir, 'export.json');
    writeFileSync(exported, JSON.stringify({ general: { name: 'Synthetic server' } }));
    const dest = join(dir, 'dest');
    mkdirSync(dest);
    // A file that is already there, readable by others, is replaced whole and made private.
    const saved = join(dir, 'saved.json');
    writeFileSync(saved, 'left over'.repeat(100));
    chmodSync(saved, 0o644);
    const first = cli('migrate-fms', dest, '--from', exported, '--save', saved, '--dry-run');
    assert.equal(first.status, 0, first.stderr);
    assert.equal(statSync(saved).mode & 0o777, 0o600);
    assert.deepEqual(JSON.parse(readFileSync(saved, 'utf8')), { general: { name: 'Synthetic server' } });
    // A link planted at the name is refused, and what it points to is left alone.
    const victim = join(dir, 'victim.txt');
    writeFileSync(victim, 'keep');
    const link = join(dir, 'link.json');
    symlinkSync(victim, link);
    const second = cli('migrate-fms', dest, '--from', exported, '--save', link, '--dry-run');
    assert.equal(second.status, 1, second.stderr);
    assert.match(second.stderr, REFUSAL);
    assert.equal(readFileSync(victim, 'utf8'), 'keep');
    assert.ok(lstatSync(link).isSymbolicLink());
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('export-sql container files are private, replaced whole, and never written through a planted link', { skip }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-export-boundary-'));
  try {
    const path = join(dir, 'Shop.openhbam.sqlite');
    createStore(path);
    const s = new Store(path, 'Shop');
    let id: number;
    try {
      s.applyDesign([{ op: 'createTable', name: 'Orders', fields: [{ name: 'Customer', type: 'text' }, { name: 'Photo', type: 'container' }] }] as never);
      id = Number(s.create('Orders', { Customer: 'Synthetic customer' }).recordId);
      s.setContainer('Orders', id, 'Photo', 1, { filename: 'p.png', mime: 'image/png', data: new Uint8Array([9, 8, 7]) });
    } finally { s.close(); }
    // A first export; then a longer, readable container file is replaced whole and private.
    const first = cli('export-sql', dir, 'Shop', '--out', join(dir, 'one.sql'), '--dialect', 'sqlite');
    assert.equal(first.status, 0, first.stderr);
    const file = join(dir, 'one.files', 'Orders', `${id}-2-p.png`);
    assert.equal(statSync(file).mode & 0o777, 0o600);
    assert.deepEqual([...readFileSync(file)], [9, 8, 7]);
    writeFileSync(file, 'left over');
    chmodSync(file, 0o644);
    rmSync(join(dir, 'one.sql'));
    const second = cli('export-sql', dir, 'Shop', '--out', join(dir, 'one.sql'), '--dialect', 'sqlite');
    assert.equal(second.status, 0, second.stderr);
    assert.equal(statSync(file).mode & 0o777, 0o600);
    assert.deepEqual([...readFileSync(file)], [9, 8, 7]);
    // A planted link is refused, the half-made script is removed, and the target is left alone.
    const third = join(dir, 'three.files', 'Orders');
    mkdirSync(third, { recursive: true });
    const victim = join(dir, 'victim.txt');
    writeFileSync(victim, 'keep');
    const link = join(third, `${id}-2-p.png`);
    symlinkSync(victim, link);
    const refused = cli('export-sql', dir, 'Shop', '--out', join(dir, 'three.sql'), '--dialect', 'sqlite');
    assert.equal(refused.status, 1, refused.stderr);
    assert.match(refused.stderr, REFUSAL);
    assert.equal(readFileSync(victim, 'utf8'), 'keep');
    assert.ok(lstatSync(link).isSymbolicLink());
    assert.throws(() => lstatSync(join(dir, 'three.sql')), { code: 'ENOENT' });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('the command line ran no service, install, git or network command', () => {
  assert.equal(existsSync(marker), false);
});
