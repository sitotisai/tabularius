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
