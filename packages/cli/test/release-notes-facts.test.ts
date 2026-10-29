// Offline checks for the reviewed release draft; no history, services or source data are opened.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { buildNotes } from '../../../scripts/release-notes-lib.ts';

const root = join(import.meta.dirname, '../../..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const notes = read('notes/release-notes/v0.1.0.md');

test('release draft distinguishes encrypted source support from secure external containers', () => {
  assert.match(notes, /Encryption at Rest.*passphrase/);
  assert.doesNotMatch(notes, /Encrypted files and secure|\(unencrypted ones\)/);
  assert.match(notes, /Secure external-storage containers are not supported/);
});

test('release draft qualifies imported privileges, interactive steps and outbound behavior', () => {
  assert.doesNotMatch(notes, /security detail is flattened|Steps that need a screen are skipped|Scripts run on the server, offline/);
  assert.match(notes, /unrecognized.*no access/);
  assert.match(notes, /Show Custom Dialog.*web client/);
  assert.match(notes, /Script network/);
  assert.match(notes, /unverified/);
});

test('install commands and artifact qualifications match the checked-in sources', () => {
  const install = notes.split('## Install\n')[1].split('## What it does')[0];
  for (const command of ['curl -fsSL https://github.com/sitotisai/tabularius/releases/latest/download/get.sh | sh', 'tabularius demo', 'sha256sum -c SHA256SUMS --ignore-missing', 'shasum -a 256 -c', 'xattr -d com.apple.quarantine <file>']) {
    assert.ok(install.includes(command), command);
    assert.ok(read('QUICKSTART.md').includes(command), command);
  }
  assert.match(install, /~\/\.local\/bin/);
  assert.match(read('scripts/get.sh'), /BIN_DIR="\$\{TABULARIUS_BIN:-\$HOME\/\.local\/bin\}"/);
  assert.match(install, /THIRD-PARTY-NOTICES-<system>\.md/);
  assert.match(install, /Windows.*unverified/);
});

test('changelog counts conversion work as the generator does and preserves the draft total', () => {
  const changelog = read('CHANGELOG.md');
  const generated = buildNotes([
    { number: 2, title: 'Reader change', files: ['packages/fmp12/src/schema.ts'] },
    { number: 1, title: 'Reader change', files: ['packages/fmp12/src/blocks.ts'] },
  ], { version: '0.1.0' });
  const conversion = generated.split('### Conversion\n\n')[1].split('\n\n')[0];
  assert.ok(changelog.includes(`### Conversion\n\n${conversion}`));
  assert.doesNotMatch(changelog, /\(#(?:9|14)\)/);
  const listed = [...changelog.matchAll(/^- .*\(#\d+\)$/gm)].length;
  const omitted = [...changelog.matchAll(/^- …and (\d+) more$/gm)].reduce((n, m) => n + Number(m[1]), 0);
  assert.equal(listed + omitted + 2, 185);
  assert.match(changelog, /historical draft/);
});

test('release draft references existing repository documents', () => {
  for (const [, path] of notes.matchAll(/`((?:docs\/)[^`]+\.md|QUICKSTART\.md|SECURITY\.md)`/g)) {
    assert.ok(existsSync(join(root, path)), path);
  }
});

test('demo notes describe a reusable password, optional browser launch and free port', () => {
  assert.doesNotMatch(notes, /one-time password|opens it in your browser/);
  assert.match(notes, /random password.*printed once/);
  assert.match(notes, /opens.*browser if it can/);
  assert.match(notes, /free port/);
  const demo = read('packages/cli/src/demo.ts');
  assert.match(demo, /store\.setPassword\(DEMO_ACCOUNT, password/);
  assert.match(demo, /port: opts.port \?\? 0/);
  assert.match(demo, /if \(!kept\) rmSync/);
});

test('release notes state password, MCP authentication and account token defaults', () => {
  assert.match(notes, /12 characters/);
  assert.match(notes, /TABULARIUS_MIN_PASSWORD_LENGTH/);
  assert.match(read('packages/store/src/store.ts'), /DEFAULT_MIN_PASSWORD_LENGTH = 12/);
  assert.match(notes, /\/mcp.*requires authentication even on localhost/);
  assert.match(notes, /HTTP Basic/);
  assert.match(read('packages/server/src/index.ts'), /if \(!who\) \{[\s\S]*?401/);
  assert.match(notes, /90 days.*3650 days/);
  assert.match(notes, /TABULARIUS_TOKEN_DEFAULT_DAYS/);
  assert.match(read('packages/store/src/store.ts'), /API_TOKEN_DEFAULT_DAYS = 90/);
  assert.match(read('packages/store/src/store.ts'), /API_TOKEN_MAX_DAYS = 3650/);
  assert.match(read('packages/server/src/token-expiry.ts'), /process.env.TABULARIUS_TOKEN_DEFAULT_DAYS/);
  assert.match(notes, /administrator.*token.*does not have this expiry/);
});

test('hosting notes distinguish service defaults and public HTTPS', () => {
  assert.match(notes, /service install.*127\.0\.0\.1:8080/);
  assert.match(notes, /--https <domain>.*0\.0\.0\.0/);
  assert.match(read('packages/cli/src/service.ts'), /https && https !== 'local' && https !== 'lan' \? '0.0.0.0' : '127.0.0.1'/);
  assert.match(read('packages/cli/src/main.ts'), /port: Number\(flag\(args, '--port'\) \?\? 8080\)/);
  assert.match(notes, /<name>\.openhbam\.sqlite/);
  assert.match(read('packages/server/src/host.ts'), /STORE_EXT = '.openhbam.sqlite'/);
});

test('release notes separate known limits and unverified release availability', () => {
  assert.match(notes, /^# Tabularius 0\.1\.0/m);
  assert.match(notes, /## Known limits/);
  assert.match(notes, /Published asset availability.*unverified/);
  assert.doesNotMatch(notes, /It works end to end for data|shows what in your file won't work yet/);
  assert.match(notes, /report.*cannot prove compatibility/);
});

test('password migration advice preserves inactive and guest account restrictions', () => {
  assert.match(notes, /enabled imported local account with an empty password/);
  assert.match(notes, /Inactive accounts stay disabled.*Guest.*disabled/);
  assert.match(notes, /tabularius passwd <folder> <database> <account>/);
  assert.match(notes, /External accounts need their identity provider configured/);
  const source = read('packages/store/src/import.ts');
  assert.match(source, /if \(\(a.inactive \|\| guest\)/);
  assert.match(source, /a.external \? 'external' : 'fmp12'/);
});
