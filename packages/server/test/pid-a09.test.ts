import './backup-review-guard.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { claimFolder, runningServer } from '../src/backup.ts';
import { stopOwnServer } from '../../cli/src/service.ts';

test('#174 a reused PID neither blocks a claim nor signals an unrelated process', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-pid-identity-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, '.openhbam.pid'), String(process.ppid));
  assert.equal(runningServer(dir), undefined);
  const signals: unknown[] = [];
  assert.equal(stopOwnServer(dir, 'linux', { kill: (...args) => { signals.push(args); return true; }, exited: () => true, request: () => assert.fail('unexpected stop') }), false);
  assert.deepEqual(signals, []);
  const release = claimFolder(dir);
  try { assert.equal(runningServer(dir), process.pid); } finally { release(); }
  assert.equal(runningServer(dir), undefined);
});

import { readFileSync } from 'node:fs';
import { writePidOwner } from './pid-fixture.ts';
test('#174 a mismatched birth identity is stale even while the PID is alive', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-pid-birth-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writePidOwner(dir, process.ppid);
  assert.equal(runningServer(dir), process.ppid);
  const file = join(dir, '.openhbam-pid-owner.json');
  const owner = JSON.parse(readFileSync(file, 'utf8'));
  writeFileSync(file, JSON.stringify({ ...owner, started: 'a different process start' }));
  assert.equal(runningServer(dir), undefined);
  const release = claimFolder(dir);
  try { assert.equal(runningServer(dir), process.pid); } finally { release(); }
});
