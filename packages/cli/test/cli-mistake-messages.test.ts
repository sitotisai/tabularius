import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runCli } from './cli-run.ts';
import { testCommandPath } from '../../../scripts/test-command-path.ts';

const main = join(import.meta.dirname, '..', 'src', 'main.ts');

describe('CLI mistake messages', { concurrency: 1 }, () => {
  const folder = mkdtempSync(join(tmpdir(), 'tabularius-mistakes-'));
  let env: NodeJS.ProcessEnv;
  const cli = (args: string[], extra: NodeJS.ProcessEnv = {}) => runCli(main, args, { env: { ...env, ...extra }, timeout: 60_000 });
  const check = async (args: string[], status: number, stdout: string, stderr: string, extra?: NodeJS.ProcessEnv) => {
    const r = await cli(args, extra);
    assert.equal(r.status, status, r.stdout + r.stderr);
    assert.equal(r.stdout.trim(), stdout);
    assert.equal(r.stderr.trim().replaceAll(folder, '<folder>').replaceAll('\\', '/'), stderr.replaceAll(folder, '<folder>').replaceAll('\\', '/'));
  };
  before(async () => {
    env = { ...process.env };
    const r = await cli(['new', folder, 'Invoices', '--starter', 'invoicing']);
    assert.equal(r.status, 0, r.stderr);
  });
  after(() => rmSync(folder, { recursive: true, force: true }));

  test('privilege set names and account assignment', async (context) => {
    env = testCommandPath(context);
    const sets = '[Full Access], Staff, Read only';
    for (const action of ['grant', 'revoke', 'show']) {
      await check(['privileges', folder, 'Invoices', action], 1, '', `error: privileges ${action}: give a privilege set (${sets})`);
    }
    await check(['privileges', folder, 'Invoices', 'grant', 'Nope', 'fmrest'], 1, '', `error: no privilege set "Nope"; sets: ${sets}`);
    await check(['privileges', folder, 'Invoices', 'account', 'Admin', 'Nope'], 1, '', `error: no privilege set "Nope"; sets: ${sets}`);
    const listing = await cli(['privileges', folder, 'Invoices']);
    assert.equal(listing.status, 0, listing.stderr);
    assert.match(listing.stdout, /Admin\s+\[Full Access\]/);
    const passwd = await cli(['passwd', folder, 'Invoices', 'Clerk', '--privilege-set', 'Read only'], { TABULARIUS_PASSWORD: ['test', 'password', 'generated', 'in', 'test'].join('-') });
    assert.equal(passwd.status, 0, passwd.stderr);
    await check(['privileges', folder, 'Invoices', 'account', 'Clerk', 'Staff'], 0, 'Clerk now uses Staff', '');
  });

  test('verify-backup distinguishes missing and existing sets', async (context) => {
    env = testCommandPath(context);
    const dest = join(folder, 'Backups');
    await check(['verify-backup', folder, 'nosuchset'], 1, '', `error: verify-backup: no backup set "nosuchset" in ${dest}; sets there: none`);
    const backup = await cli(['backup', folder]);
    assert.equal(backup.status, 0, backup.stderr);
    const set = (await import('node:fs')).readdirSync(dest).find((name) => name !== 'latest');
    assert.ok(set);
    await check(['verify-backup', folder, 'nosuchset'], 1, '', `error: verify-backup: no backup set "nosuchset" in ${dest}; sets there: ${set}`);
    const verified = await cli(['verify-backup', folder, set]);
    assert.equal(verified.status, 0, verified.stderr);
    assert.equal(verified.stderr, '');
    assert.match(verified.stdout, /checked: 1 file ok/);
  });

  test('ai-policy names the missing or invalid action', async (context) => {
    env = testCommandPath(context);
    await check(['ai-policy', folder, 'Invoices', 'maybe'], 1, '', 'error: ai-policy: say on or off after the database name, not "maybe"');
    await check(['ai-policy', folder, 'Invoices'], 1, '', 'error: ai-policy: say on or off after the database name');
    await check(['ai-policy', folder, 'Invoices', 'on'], 0, 'AI policy on for Invoices', '');
    await check(['ai-policy', folder], 1, '', 'error: ai-policy: give a database and on|off');
  });
});
