import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runCli } from './cli-run.ts';
import { fences, root, shellCommands } from './docs-examples.ts';
import { commandStubEnv } from '../../../scripts/test-command-stubs.ts';

const main = join(root, 'packages', 'cli', 'src', 'main.ts');
const NOT_RUN: Record<string, string> = {
  ' serve ': 'never returns',
  'totp ~/FileMakerFiles Contacts confirm Admin 123456': 'needs a live six-digit code',
  'restore ~/Databases --at': 'needs progressive logs from a running server',
  'backup-s3': 'network',
  '--from s3://': 'network',
  'docker compose exec': 'Docker',
  ' standby ': 'never returns',
  ' encrypt ': 'needs a passphrase variable and rewrites the folder',
};

function block(file: string, first: string) {
  const found = fences(file).filter((f) => shellCommands(f.body)[0]?.startsWith(first));
  assert.equal(found.length, 1, 'the page changed: update this table');
  return found[0];
}

function argsOf(command: string): string[] {
  command = command.replace(/^echo\s+(['"][^'"]*['"])\s*\|\s*/, '');
  const pipe = command.indexOf('|'); if (pipe >= 0) command = command.slice(pipe + 1).trim();
  command = command.replace(/^npm run tabularius -- /, '');
  command = command.replace(/^tabularius /, '');
  const out = [...command.matchAll(/"([^"]*)"|'([^']*)'|([^\s]+)/g)].map((m) => m[1] ?? m[2] ?? m[3]);
  return out;
}

test('connecting, team hosting and native compatibility commands run against a generated hosted file', async (t) => {
  const home = mkdtempSync(join(tmpdir(), 'tabularius-connecting-'));
  t.after(() => rmSync(home, { recursive: true, force: true }));
  const env = { ...commandStubEnv(t), HOME: home, USERPROFILE: home, TABULARIUS_PASSWORD: 'test-password-1234' };
  const folder = join(home, 'Databases');
  const call = async (line: string) => {
    const argv = argsOf(line).map((arg) => {
      if (['~/FileMakerFiles', '~/Databases', 'hosted'].includes(arg)) return folder;
      if (['Contacts', 'MyDatabase'].includes(arg)) return 'Invoices';
      if (['[Data Entry Only]', 'Data Entry Only', 'Data Entry'].includes(arg)) return 'Staff';
      return arg;
    });
    return runCli(main, argv, { env });
  };
  for (const argv of [['new', folder, 'Invoices', '--starter', 'invoicing'], ['passwd', folder, 'Invoices', 'Admin'], ['passwd', folder, 'Invoices', 'Clerk', '--privilege-set', 'Read only']]) {
    const result = await runCli(main, argv, { env });
    assert.equal(result.status, 0, `${argv.join(' ')}\n${result.stdout}${result.stderr}`);
  }
  const results: string[] = [];
  const run = async (line: string, status: number, contains?: string, sourceLine = line) => {
    const r = await call(line);
    assert.equal(r.status, status, `${line}\n${r.stdout}${r.stderr}`);
    if (contains) assert.ok((r.stdout + r.stderr).includes(contains), `${line} missing ${contains}\n${r.stdout}${r.stderr}`);
    results.push(sourceLine);
    return r;
  };
  const connecting = 'docs/hosting-and-connecting.md';
  const setup = block(connecting, 'npm run tabularius -- serve ~/FileMakerFiles --port 8080');
  await run(shellCommands(setup.body).find((c) => c.includes('passwd'))!, 0, 'password set for Admin');
  const security = block(connecting, 'npm run tabularius -- privileges ~/FileMakerFiles Contacts');
  await run(shellCommands(security.body)[0], 0, 'Privilege sets');
  await run(shellCommands(security.body)[1], 0, 'granted fmrest');
  const shownLine = shellCommands(security.body)[2];
  const shown = await run(shownLine.split('>')[0].trim(), 0, undefined, shownLine);
  assert.equal(JSON.parse(shown.stdout).name, 'Staff');
  const setFile = join(home, 'set.json'); writeFileSync(setFile, shown.stdout);
  await run(`npm run tabularius -- privileges ~/FileMakerFiles Contacts save ${setFile}`, 0, 'saved Staff', shellCommands(security.body)[3]);
  await run(shellCommands(security.body)[4], 0, 'Clerk now uses Staff');
  await run(shellCommands(security.body)[5], 0, 'minimum length 12, maximum age 90 days');
  await run(shellCommands(security.body)[6], 0, 'must change its password');
  for (const fence of [block(connecting, 'TABULARIUS_OIDC_CLIENT_SECRET=...'), block(connecting, 'TABULARIUS_LDAP_SEARCH_PASSWORD=...')]) {
    for (const line of shellCommands(fence.body).filter((c) => c.includes(' external '))) await run(line, 0, line.includes('"Sales"') ? 'now use Staff' : undefined);
  }
  const token = block(connecting, 'npm run tabularius -- token ~/FileMakerFiles Contacts create');
  const tokenLines = shellCommands(token.body);
  const created = await run(tokenLines[0], 0, 'Created an API token for Admin (read-only)');
  assert.match(created.stdout, /^ohbt_/m);
  const listed = await run(tokenLines.find((l) => l.endsWith(' list'))!, 0);
  const data = JSON.parse(listed.stdout.split('\n').find((l) => l.startsWith('{'))!);
  assert.equal(data.label, 'Reporting'); assert.equal(data.readOnly, true);
  const revokeDoc = tokenLines.find((l) => l.includes(' revoke '))!;
  const revoke = revokeDoc.replace('<id>', data.id);
  await run(revoke, 0, undefined, revokeDoc); await run(revoke, 1, 'no token');
  const totp = block(connecting, 'npm run tabularius -- totp ~/FileMakerFiles Contacts enroll');
  await run(shellCommands(totp.body)[0], 0, 'otpauth://totp/');
  await run(shellCommands(totp.body)[2], 0);
  await run(shellCommands(totp.body)[3], 0, 'two-factor sign-in is off for Admin');
  const backup = block('docs/hosting-for-a-team.md', 'tabularius backup ~/Databases');
  const backed = await run(shellCommands(backup.body)[0], 0, 'backed up 1 files');
  const setName = /Backups[\\/]([^\s]+)/.exec(backed.stdout)?.[1] ?? '2026-10-11_020000';
  await run(shellCommands(backup.body)[1], 0, 'free pages');
  for (const name of ['.openhbam.pid', '.openhbam-pid-owner.json']) { try { unlinkSync(join(folder, name)); } catch {} }
  await run(shellCommands(backup.body)[2].replace('2026-10-11_020000', setName), 0, 'restored Invoices.openhbam.sqlite', shellCommands(backup.body)[2]);
  await run(shellCommands(backup.body)[3].replace('2026-10-11_020000', setName), 0, undefined, shellCommands(backup.body)[3]);
  const compat = block('docs/native-compat.md', 'tabularius compat-check hosted');
  await run(shellCommands(compat.body)[0], 0, 'no native-only features found');
  const upgrade = block('docs/native-compat.md', 'tabularius upgrade-file hosted');
  await run(shellCommands(upgrade.body)[0], 0, 'nothing changed');
  await run(shellCommands(upgrade.body)[1], 0, 'upgraded to native');

  const relevant = [setup, security, block(connecting, 'TABULARIUS_OIDC_CLIENT_SECRET=...'), block(connecting, 'TABULARIUS_LDAP_SEARCH_PASSWORD=...'), token, totp, backup,
    block('docs/hosting-for-a-team.md', 'tabularius restore ~/Databases --at'), block('docs/hosting-for-a-team.md', 'tabularius encrypt ~/FileMakerFiles'),
    block('docs/hosting-for-a-team.md', 'tabularius serve ~/Databases --backup-s3'), block('docs/hosting-for-a-team.md', 'tabularius standby ~/Standby'), compat, upgrade];
  const all = relevant.flatMap((f) => shellCommands(f.body).filter((c) => /\b(?:npm run tabularius|tabularius)\b/.test(c)));
  for (const key of Object.keys(NOT_RUN)) assert.ok(all.some((line) => line.includes(key)), `NOT_RUN command disappeared: ${key}`);
  assert.deepEqual(all.filter((line) => !results.includes(line) && !Object.keys(NOT_RUN).some((key) => line.includes(key))), [], 'unaccounted Tabularius commands');
});
