import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { test } from 'node:test';
import { commandStubEnv } from '../../../scripts/test-command-stubs.ts';
import { runCli } from './cli-run.ts';
import { fences, root, shellCommands } from './docs-examples.ts';

const entry = join(import.meta.dirname, '..', 'src', 'main.ts');
const password = ['runbook', 'test', 'pass'].join('-');
const NOT_RUN: Record<string, string> = {
  'tabularius standby <folder> --primary URL --token <token> --overwrite': 'starts a server that connects out',
  'tabularius serve <folder> --port 8081': 'does not return',
  'tabularius doctor <folder> --url https://<name>': 'makes a network request',
  'tabularius service install <new-folder>': 'changes the machine',
  'tabularius service uninstall': 'changes the machine',
  'tabularius serve <folder>': 'does not return',
};

function args(line: string): string[] {
  const out: string[] = [];
  let word = '';
  let quote = '';
  let escaped = false;
  for (const char of line) {
    if (escaped) { word += char; escaped = false; }
    else if (char === '\\' && quote !== "'") escaped = true;
    else if (quote) { if (char === quote) quote = ''; else word += char; }
    else if (char === '"' || char === "'") quote = char;
    else if (/\s/.test(char)) { if (word) { out.push(word); word = ''; } }
    else word += char;
  }
  if (word) out.push(word);
  return out;
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') return reject(new Error('no free port'));
      server.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

test('run the recoverable runbook commands against a generated hosted file', { timeout: 600_000 }, async (t) => {
  const env = commandStubEnv(t);
  const temp = mkdtempSync(join(tmpdir(), 'tabularius-runbook-'));
  t.after(() => rmSync(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }));
  const home = join(temp, 'home');
  const folder = join(temp, 'Invoices');
  const scratch = join(temp, 'scratch');
  const otherDisk = join(temp, 'other-disk');
  const backups = otherDisk;
  const newFolder = join(temp, 'new-folder');
  for (const dir of [home, otherDisk, newFolder]) mkdirSync(dir, { recursive: true });
  const runEnv = { ...env, HOME: home, USERPROFILE: home, TABULARIUS_PASSWORD: password };
  let backupSet = '';
  let activeBackupSet = '';
  const execute = async (line: string, expected: number, includes: string[] = []): Promise<string> => {
    const port = await freePort();
    let command = line.replaceAll('<folder>', folder).replaceAll('<scratch-folder>', scratch)
      .replaceAll('<other-disk-folder>', otherDisk).replaceAll('<backups-folder>', backups)
      .replaceAll('<new-folder>', newFolder).replaceAll('<backup-set>', (activeBackupSet || backupSet).replaceAll(' ', '\\ '))
      .replaceAll('<database>', 'Invoices').replaceAll('<table>', 'Customers')
      .replaceAll('<account>', 'Admin');
    if (command.startsWith('mkdir ')) { mkdirSync(args(command)[1], { recursive: true }); return ''; }
    if (/^tabularius doctor\b/.test(command)) {
      command = command.replace(/--port\s+\S+/, `--port ${port}`);
      if (!command.includes('--port')) command += ` --port ${port}`;
    }
    if (command.startsWith('tabularius service print ')) command += ' --platform linux';
    const result = await runCli(entry, args(command).slice(1), { env: runEnv, timeout: 120_000 });
    const output = result.stdout + result.stderr;
    assert.equal(result.status, expected, `${command} exited ${result.status}\n${output}`);
    for (const text of includes) assert.ok(output.includes(text), `${command} missing ${JSON.stringify(text)}\n${output}`);
    return output;
  };
  const ranCommands = new Set<string>();
  const run = async (line: string, expected = 0, includes: string[] = []) => { ranCommands.add(line); return execute(line, expected, includes); };
  assert.equal((await runCli(entry, ['new', folder, 'Invoices', '--starter', 'invoicing'], { env: runEnv })).status, 0);
  assert.equal((await runCli(entry, ['passwd', folder, 'Invoices', 'Admin'], { env: runEnv })).status, 0);

  const blocks = fences('docs/runbook.md').filter((f) => f.lang === 'sh').map((f) => ({ f, commands: shellCommands(f.body) }));
  const block = (first: string, subsequent: string[] = []) => {
    const found = blocks.filter(({ commands }) => commands[0] === first && commands.length === subsequent.length + 1 && subsequent.every((s, index) => commands[index + 1] === s));
    assert.equal(found.length, 1, 'the runbook changed: update this table');
    return found[0].commands;
  };
  const doBlock = async (first: string, following: string[], expectations: Map<string, string[]> = new Map()) => {
    for (const line of block(first, following)) await run(line, 0, expectations.get(line) ?? []);
  };
  const backupLines = block('tabularius backup <folder>', ['tabularius doctor <folder>']);
  for (const line of backupLines) {
    const out = await run(line, 0, line.startsWith('tabularius backup') ? ['backed up 1 files'] : ['All good']);
    const match = /Backups\/([^\s]+)/.exec(out);
    if (match) backupSet = match[1];
  }
  assert.ok(backupSet, 'the runbook changed: update this table');
  const verifyThenDoctor = block('tabularius doctor <folder>', ['tabularius verify-backup <folder>']);
  for (const line of verifyThenDoctor) await run(line, 0, line.includes('verify-backup') ? ['checked: 1 file ok'] : []);
  const scratchBlock = block('mkdir <scratch-folder>', ['tabularius restore <scratch-folder> <folder>/Backups/<backup-set> <database>', 'tabularius records <scratch-folder> <database> <table>']);
  for (const line of scratchBlock) await run(line, 0, line.includes('records') ? ['Alder & Finch Architects'] : []);
  await doBlock('tabularius restore <folder> <backup-set> <database>', ['tabularius doctor <folder>'], new Map([['tabularius restore <folder> <backup-set> <database>', ['restored Invoices.openhbam.sqlite']]]));
  await doBlock('tabularius verify-backup <folder> <backup-set> --sign', ['tabularius restore <folder> <backup-set>']);
  const external = block('tabularius backup <folder> --to <other-disk-folder>', ['tabularius verify-backup <folder> --from <other-disk-folder>']);
  for (const line of external) {
    const out = await run(line, 0, line.includes('verify-backup') ? ['checked: 1 file ok'] : []);
    const match = /backed up \d+ files to ([^\r\n]+)/.exec(out);
    if (match) activeBackupSet = basename(match[1].trim());
  }
  for (const first of ['tabularius verify-backup <folder> --from <backups-folder>', 'tabularius restore <folder> <backup-set> --from <backups-folder>']) await doBlock(first, []);
  activeBackupSet = '';
  await doBlock('tabularius privileges <folder> <database>', ['tabularius passwd <folder> <database> <account>']);
  await doBlock('tabularius admin-password <folder>', []);
  await doBlock('tabularius passwd <folder> <database> <account>', []);
  await doBlock('tabularius privileges <folder> <database>', ['tabularius admin-password <folder>', 'tabularius passwd <folder> <database> <account>']);
  await doBlock('tabularius records <folder> <database> <table>', []);
  const busyPortBlock = block('tabularius doctor <folder> --port 8080', ['tabularius serve <folder> --port 8081']);
  await run(busyPortBlock[0]);
  const movedFolderBlock = block('tabularius service uninstall', ['tabularius service install <new-folder>', 'tabularius doctor <new-folder>']);
  await run(movedFolderBlock[2]);
  await doBlock('tabularius service print <new-folder>', [], new Map([['tabularius service print <new-folder>', ['[Install]']]]));

  assert.equal((await runCli(entry, ['passwd', folder, 'Invoices', 'Clerk', '--privilege-set', 'Staff'], { env: runEnv })).status, 0);
  const restore = block('tabularius restore <folder> <backup-set> <database>', ['tabularius doctor <folder>'])[0];
  await run(restore, 1, ['Clerk has been added since the backup', 'Nothing was restored']);
  const privileges = await run('tabularius privileges <folder> <database>');
  assert.ok(privileges.includes('Clerk'), 'Clerk must remain after a refused restore');
  await doBlock('tabularius restore <folder> <backup-set> <database> --accept-account-changes', [], new Map([['tabularius restore <folder> <backup-set> <database> --accept-account-changes', ['Accounts that are not as they were before this restore']]]));

  const runbookCommands = blocks.flatMap(({ commands }) => commands).filter((line) => line.startsWith('tabularius '));
  const remaining = runbookCommands.filter((line) => !ranCommands.has(line) && !Object.hasOwn(NOT_RUN, line));
  assert.deepEqual(remaining, [], `a runbook command no test runs and no reason is given for: ${remaining.join(', ')}`);
  for (const command of Object.keys(NOT_RUN)) assert.ok(runbookCommands.includes(command), `NOT_RUN command missing from runbook: ${command}`);
});
