// `tabularius demo`: a starter app for this computer only, an Admin account with a random password shown once, and nothing
// left behind when it stops. Run in-process (startDemo) and as the real command.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AI_BANNER, MCP_REMOTE_VERSION, demoPassword, notLoopback, startDemo, type Demo } from '../src/demo.ts';
import { runCli } from './cli-run.ts';
import { notOnWindows } from '../../store/test/windows.ts';

const main = join(import.meta.dirname, '..', 'src', 'main.ts');

// The tests below count the demo folders in the temporary directory, so they get one of their own: other test files run
// the demo at the same time, and their folders would show up as leftovers. Child processes started here inherit it.
const sandbox = mkdtempSync(join(tmpdir(), 'tabularius-demo-sandbox-'));
process.env.TMPDIR = sandbox;
const stubPath = join(sandbox, 'bin');
const commandMarker = join(sandbox, 'unexpected-command');
mkdirSync(stubPath);
for (const name of ['launchctl', 'systemctl', 'sc', 'git', 'npm', 'curl', 'sudo']) {
  writeFileSync(join(stubPath, name), '#!/bin/sh\nprintf x >> "$TABULARIUS_TEST_COMMAND_MARKER"\nexit 99\n', { mode: 0o755 });
}
process.env.PATH = stubPath;
process.env.TABULARIUS_TEST_COMMAND_MARKER = commandMarker;
after(() => {
  try {
    assert.equal(existsSync(commandMarker), false, 'a service, upgrade, install or network command was run');
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

async function signIn(demo: Demo, password: string): Promise<number> {
  const r = await fetch(`${demo.url}/fmi/data/vLatest/databases/${demo.database}/sessions`, {
    method: 'POST', headers: { authorization: 'Basic ' + btoa(`${demo.account}:${password}`), 'content-type': 'application/json' }, body: '{}',
  });
  return r.status;
}

test('it serves the starter on this computer, and only the printed password signs in', async () => {
  const lines: string[] = [];
  const demo = await startDemo({ starter: 'tasks', log: (l) => lines.push(l) });
  try {
    assert.match(demo.url, /^http:\/\/127\.0\.0\.1:\d+$/);
    assert.equal(demo.database, 'Tasks');
    assert.equal(demo.account, 'Admin');
    assert.equal((await fetch(demo.app)).status, 200);
    assert.equal(await signIn(demo, demo.password), 200);
    assert.notEqual(await signIn(demo, demo.password + 'x'), 200);
    assert.notEqual(await signIn(demo, ''), 200, 'a blank password does not sign in');
    // The sample records are there for the first screen.
    const token = ((await (await fetch(`${demo.url}/fmi/data/vLatest/databases/Tasks/sessions`, { method: 'POST', headers: { authorization: 'Basic ' + btoa(`Admin:${demo.password}`), 'content-type': 'application/json' }, body: '{}' })).json()) as { response: { token: string } }).response.token;
    const layouts = (await (await fetch(`${demo.url}/fmi/data/vLatest/databases/Tasks/layouts`, { headers: { authorization: `Bearer ${token}` } })).json()) as { response: { layouts: { name: string }[] } };
    const first = layouts.response.layouts.find((l) => !('folderLayoutNames' in l))!;
    const records = (await (await fetch(`${demo.url}/fmi/data/vLatest/databases/Tasks/layouts/${encodeURIComponent(first.name)}/records?_limit=5`, { headers: { authorization: `Bearer ${token}` } })).json()) as { response: { data: unknown[] } };
    assert.ok(records.response.data.length > 0, 'sample records');
    assert.ok(lines.every((l) => !l.includes(demo.password)), 'the password is not in what the server says');
    // Script network access starts off in the demo, so a copy you are only trying cannot call outside services.
    const network = await fetch(`${demo.url}/tabularius/admin/v1/script-network/Tasks`, { headers: { 'x-tabularius-admin': '1' } });
    assert.deepEqual(await network.json(), { on: false, serverWide: false });
  } finally {
    await demo.stop();
  }
});

test('the password is twenty characters of letters and digits, different every time, and not made of anything guessable', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 2000; i++) {
    const p = demoPassword();
    assert.match(p, /^([a-hjkmnp-z2-9]{4}-){4}[a-hjkmnp-z2-9]{4}$/);
    seen.add(p);
  }
  assert.equal(seen.size, 2000);
  // Every character of the alphabet turns up, in every position: nothing is fixed or favoured.
  const counts = new Map<string, number>();
  for (let i = 0; i < 20000; i++) for (const c of demoPassword().replace(/-/g, '')) counts.set(c, (counts.get(c) ?? 0) + 1);
  assert.equal(counts.size, 31);
  const mean = (20000 * 20) / 31;
  for (const n of counts.values()) assert.ok(n > mean * 0.9 && n < mean * 1.1, `a character appears ${n} times, expected about ${Math.round(mean)}`);
});

test('stopping deletes the files; --keep leaves them, and will not use a folder that has anything in it', async () => {
  const gone = await startDemo({});
  const folder = gone.folder;
  assert.ok(existsSync(join(folder, 'CRM.openhbam.sqlite')));
  await gone.stop();
  await gone.stop();
  assert.equal(existsSync(folder), false, 'the temporary folder is deleted');

  const base = mkdtempSync(join(tmpdir(), 'tabularius-demo-test-'));
  try {
    const keep = join(base, 'kept');
    const kept = await startDemo({ keep, starter: 'booking' });
    assert.equal(kept.kept, true);
    await kept.stop();
    assert.ok(existsSync(join(keep, 'Booking.openhbam.sqlite')), 'the files stay');

    // Not empty: refused, and not one file of it touched.
    writeFileSync(join(keep, 'mine.txt'), 'mine');
    await assert.rejects(startDemo({ keep }), /is not empty, and demo will not put its files among yours/);
    assert.equal(readFileSync(join(keep, 'mine.txt'), 'utf8'), 'mine');

    const empty = join(base, 'empty');
    mkdirSync(empty);
    const again = await startDemo({ keep: empty });
    await again.stop();
    assert.ok(readdirSync(empty).includes('CRM.openhbam.sqlite'));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('a start that fails leaves nothing behind', async () => {
  const taken = createServer();
  await new Promise<void>((done) => taken.listen(0, '127.0.0.1', done));
  const port = (taken.address() as { port: number }).port;
  const before = readdirSync(tmpdir()).filter((f) => f.startsWith('tabularius-demo-'));
  try {
    await assert.rejects(startDemo({ port }), /EADDRINUSE|in use|already/i);
    assert.deepEqual(readdirSync(tmpdir()).filter((f) => f.startsWith('tabularius-demo-')), before, 'the temporary folder is gone');

    const base = mkdtempSync(join(tmpdir(), 'tabularius-demo-test-'));
    try {
      const keep = join(base, 'kept');
      await assert.rejects(startDemo({ port, keep }));
      assert.equal(existsSync(keep), false, 'a --keep folder this run made is removed again');
      mkdirSync(keep);
      await assert.rejects(startDemo({ port, keep }));
      assert.deepEqual(readdirSync(keep), [], 'a --keep folder that was there is left empty');
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  } finally {
    taken.close();
  }
});

test('it will not listen anywhere but this computer', async () => {
  for (const host of ['0.0.0.0', '::', '192.168.1.20', '10.0.0.5', 'example.com', '127.0.0.1.evil.example', '0', '', '[::1', '::1]']) {
    assert.match(notLoopback(host) ?? '', /only listens on this computer/, `"${host}"`);
  }
  for (const host of ['127.0.0.1', 'localhost', 'LOCALHOST', '::1', '[::1]', '127.1.2.3']) assert.equal(notLoopback(host), undefined, host);
  const before = readdirSync(tmpdir()).filter((f) => f.startsWith('tabularius-demo-'));
  await assert.rejects(startDemo({ host: '0.0.0.0' }), /only listens on this computer/);
  assert.deepEqual(readdirSync(tmpdir()).filter((f) => f.startsWith('tabularius-demo-')), before, 'refused before anything was made');
});

test('a bracketed IPv6 loopback host serves a usable bracketed URL', async (t) => {
  const probe = createServer();
  try {
    await new Promise<void>((resolve, reject) => {
      probe.once('error', reject);
      probe.listen(0, '::1', resolve);
    });
  } catch (error) {
    t.skip(`IPv6 loopback is unavailable: ${(error as Error).message}`);
    return;
  } finally {
    if (probe.listening) await new Promise<void>((resolve) => probe.close(() => resolve()));
  }

  const demo = await startDemo({ host: '[::1]', port: 0 });
  try {
    assert.match(demo.url, /^http:\/\/\[::1\]:\d+$/);
    assert.equal(demo.app, `${demo.url}/app/`);
    assert.equal((await fetch(demo.app)).status, 200);
  } finally {
    await demo.stop();
  }
});

test('the command refuses a public host, an unknown starter and stray arguments, with a sentence and no leftover', async () => {
  const before = readdirSync(tmpdir()).filter((f) => f.startsWith('tabularius-demo-'));
  const run = (...args: string[]) => runCli(main, ['demo', '--no-open', ...args], { timeout: 30_000 });
  const pub = await run('--host', '0.0.0.0');
  assert.equal(pub.status, 1);
  assert.match(pub.stderr, /demo: it only listens on this computer, so --host takes 127\.0\.0\.1, localhost or ::1, not "0\.0\.0\.0"/);
  const bad = await run('--starter', 'shop');
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /demo: --starter takes one of crm, inventory, invoicing, tasks, booking, crm-showcase \(not "shop"\)/);
  const port = await run('--port', 'abc');
  assert.match(port.stderr, /demo: --port takes a port number, not "abc"/);
  const folder = await run('somewhere');
  assert.match(folder.stderr, /demo: takes no folder or file \(found somewhere\); it makes its own/);
  assert.deepEqual(readdirSync(tmpdir()).filter((f) => f.startsWith('tabularius-demo-')), before);
  for (const r of [pub, bad, port, folder]) assert.doesNotMatch(r.stderr, / at .*\.ts:\d+/, 'no stack trace');
});

test('the real command prints the address and the password once, answers, and deletes the files on Ctrl-C and on SIGTERM', { skip: notOnWindows('a stop signal ends a Windows process at once, without its clean exit') }, async () => {
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    const child = spawn(process.execPath, ['--no-warnings', main, 'demo', '--no-open', '--starter', 'inventory'], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    child.stdout.setEncoding('utf8').on('data', (c: string) => { out += c; });
    child.stderr.setEncoding('utf8').on('data', (c: string) => { err += c; });
    const exited = new Promise<number | null>((done) => child.on('close', done));
    const started = Date.now();
    while (!/Password\s+\S+/.test(out) && Date.now() - started < 30_000) await new Promise((r) => setTimeout(r, 100));
    try {
      const password = /Password\s+(\S+)/.exec(out)?.[1];
      const url = /Open\s+(http:\/\/127\.0\.0\.1:\d+)\/app\//.exec(out)?.[1];
      assert.ok(password && url, `output was:\n${out}\n${err}`);
      assert.equal(out.split(password).length - 1, 1, 'the password appears once');
      assert.equal(err.includes(password), false);
      assert.match(out, /Sign in\s+Admin/);
      assert.match(out, /File\s+Inventory\b/, 'the sign-in page asks for the file name, so the demo says it');
      const ok = await fetch(`${url}/fmi/data/vLatest/databases/Inventory/sessions`, { method: 'POST', headers: { authorization: 'Basic ' + btoa(`Admin:${password}`), 'content-type': 'application/json' }, body: '{}' });
      assert.equal(ok.status, 200);
      const folder = readdirSync(tmpdir()).filter((f) => f.startsWith('tabularius-demo-')).find((f) => existsSync(join(tmpdir(), f, 'Inventory.openhbam.sqlite')));
      assert.ok(folder, 'the demo folder exists while it runs');
      child.kill(signal);
      assert.equal(await exited, 0, `exit after ${signal}`);
      assert.equal(existsSync(join(tmpdir(), folder!)), false, `the folder is gone after ${signal}`);
      assert.equal(out.split(password).length - 1, 1, 'still once, after stopping');
    } finally {
      child.kill('SIGKILL');
    }
  }
});

// --- The showcase: --starter crm-showcase, --full and --ai ---

async function sessionFor(demo: Demo, account: string, password: string) {
  const r = await fetch(`${demo.url}/fmi/data/vLatest/databases/${demo.database}/sessions`, {
    method: 'POST', headers: { authorization: 'Basic ' + btoa(`${account}:${password}`), 'content-type': 'application/json' }, body: '{}',
  });
  return { status: r.status, token: r.status === 200 ? ((await r.json()) as { response: { token: string } }).response.token : '' };
}

async function recordsFor(demo: Demo, token: string, layout: string, limit = 500) {
  const r = await fetch(`${demo.url}/fmi/data/vLatest/databases/${demo.database}/layouts/${encodeURIComponent(layout)}/records?_limit=${limit}`, { headers: { authorization: `Bearer ${token}` } });
  const body = (await r.json()) as { messages: { code: string }[]; response: { data?: { fieldData: Record<string, unknown> }[]; dataInfo?: { foundCount: number } } };
  return { code: body.messages[0].code, data: body.response.data ?? [], found: body.response.dataInfo?.foundCount ?? 0 };
}

test('--starter crm-showcase builds the showcase with sample data, and its folder is deleted on stop', async () => {
  const lines: string[] = [];
  const demo = await startDemo({ starter: 'crm-showcase', log: (l) => lines.push(l) });
  const folder = demo.folder;
  try {
    assert.equal(demo.database, 'Showcase');
    assert.equal(demo.ai, false);
    assert.equal(demo.mcp, undefined, 'only --full hands out an AI token');
    assert.equal(demo.sql, undefined, 'only --full opens SQL');
    assert.deepEqual(demo.accounts, []);
    assert.ok(existsSync(join(folder, 'Showcase.openhbam.sqlite')));
    const { status, token } = await sessionFor(demo, 'Admin', demo.password);
    assert.equal(status, 200);
    const deals = await recordsFor(demo, token, 'Deals', 5);
    assert.ok(deals.found >= 50, `sample deals: ${deals.found}`);
    assert.ok(lines.every((l) => !l.includes(demo.password)));
    // The deal-won automation runs as Admin, which exists, so it was not skipped.
    const automations = await (await fetch(`${demo.url}/tabularius/admin/v1/automations/Showcase`, { headers: { 'x-tabularius-admin': '1' } })).text();
    assert.doesNotMatch(automations, /missing or inactive/);
    const network = await fetch(`${demo.url}/tabularius/admin/v1/script-network/Showcase`, { headers: { 'x-tabularius-admin': '1' } });
    assert.deepEqual(await network.json(), { on: false, serverWide: false });
  } finally {
    await demo.stop();
  }
  assert.equal(existsSync(folder), false, 'the folder is deleted');
});

test('--full: Admin, Ava, Morgan and Eli sign in with the one printed password and see what their privilege sets allow', async () => {
  const lines: string[] = [];
  const demo = await startDemo({ full: true, log: (l) => lines.push(l) });
  try {
    assert.equal(demo.database, 'Showcase');
    assert.deepEqual(demo.accounts, [{ name: 'Ava', privilegeSet: 'Rep' }, { name: 'Morgan', privilegeSet: 'Manager' }, { name: 'Eli', privilegeSet: 'Executive' }]);
    for (const name of ['Admin', 'Ava', 'Morgan', 'Eli']) {
      assert.equal((await sessionFor(demo, name, demo.password)).status, 200, name);
      assert.notEqual((await sessionFor(demo, name, demo.password + 'x')).status, 200, `${name} with a wrong password`);
    }
    const admin = await sessionFor(demo, 'Admin', demo.password);
    const all = await recordsFor(demo, admin.token, 'Deals list');
    const manager = await recordsFor(demo, (await sessionFor(demo, 'Morgan', demo.password)).token, 'Deals list');
    const exec = await recordsFor(demo, (await sessionFor(demo, 'Eli', demo.password)).token, 'Deals list');
    const ava = await recordsFor(demo, (await sessionFor(demo, 'Ava', demo.password)).token, 'Deals list');
    assert.equal(manager.found, all.found, 'a manager sees every deal');
    assert.equal(exec.found, all.found, 'an executive sees every deal');
    assert.ok(ava.found > 0 && ava.found < all.found, `Ava sees only her deals: ${ava.found} of ${all.found}`);
    // Ava's deals all belong to the rep whose login is Ava.
    const reps = await recordsFor(demo, admin.token, 'Reps');
    const mine = reps.data.find((r) => r.fieldData.Login === 'Ava');
    assert.ok(mine, 'one sample rep signs in as Ava');
    const others = ava.data.filter((d) => String(d.fieldData['Owner Name']) !== String(mine!.fieldData.Name));
    assert.deepEqual(others.map((d) => d.fieldData['Owner Name']), [], `every deal Ava sees is hers (her rep is ${mine!.fieldData.Name}, she sees ${ava.data.length})`);
    // The viewer cannot change anything; the manager can, but not delete.
    const eli = (await sessionFor(demo, 'Eli', demo.password)).token;
    const edit = await fetch(`${demo.url}/fmi/data/vLatest/databases/Showcase/layouts/Deals/records/1`, { method: 'PATCH', headers: { authorization: `Bearer ${eli}`, 'content-type': 'application/json' }, body: JSON.stringify({ fieldData: { Title: 'changed' } }) });
    assert.notEqual(((await edit.json()) as { messages: { code: string }[] }).messages[0].code, '0');
    assert.ok(lines.every((l) => !l.includes(demo.password)), 'the password is not in what the server says');
  } finally {
    await demo.stop();
  }
});

test('--full hands over a SQL port on this computer and an AI token that is required, expires within a day and never reaches a log line', async () => {
  const lines: string[] = [];
  const before = Date.now();
  const demo = await startDemo({ full: true, log: (l) => lines.push(l) });
  try {
    assert.ok(demo.sql && demo.sql.port > 0, 'SQL port');
    assert.match(demo.sql!.command, /^psql "host=127\.0\.0\.1 port=\d+ dbname=Showcase user=Morgan"$/);
    const mcp = demo.mcp!;
    assert.ok(mcp, 'an AI app connection');
    assert.equal(mcp.url, `${demo.url}/mcp`);
    // The command names a variable, not the token: nothing literal to land in shell history or Claude Code's settings.
    assert.match(mcp.command, /^claude mcp add -{2}transport http tabularius-demo http:\/\/127\.0\.0\.1:\d+\/mcp --header 'Authorization: Bearer \$\{[A-Z_]+\}'$/);
    assert.equal(mcp.command.includes(mcp.token), false);
    assert.equal(mcp.setup.includes(mcp.token), false, 'the token is entered at a silent prompt, not typed in a command');
    assert.match(mcp.setup, /^read -rs \w+ && export \w+$/);
    assert.ok(mcp.desktop.includes(mcp.token) && mcp.desktop.includes(`mcp-remote@${MCP_REMOTE_VERSION}`), 'the Desktop snippet pins the bridge');
    assert.ok(mcp.expires.getTime() > before && mcp.expires.getTime() <= Date.now() + 24 * 3_600_000, 'it expires within 24 hours');
    // Required: nothing gets in without it, and a wrong one is refused.
    assert.equal((await fetch(`${demo.url}/mcp`)).status, 401);
    assert.equal((await fetch(`${demo.url}/mcp`, { headers: { authorization: `Bearer ${mcp.token}x` } })).status, 401);
    const init = await fetch(`${demo.url}/mcp`, {
      method: 'POST', headers: { authorization: `Bearer ${mcp.token}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'demo-test', version: '1' } } }),
    });
    assert.equal(init.status, 200, 'the printed token connects');
    for (const secret of [mcp.token, demo.password]) assert.ok(lines.every((l) => !l.includes(secret)), 'no secret in a log line');
  } finally {
    await demo.stop();
  }
});

test('--ai refuses before anything is made without a key, and only with the showcase', async () => {
  const before = readdirSync(tmpdir()).filter((f) => f.startsWith('tabularius-demo-'));
  const none = join(sandbox, 'no-such-key');
  await assert.rejects(startDemo({ full: true, ai: true, env: {}, aiKeyFile: none }), /demo: .*does not exist.*Without --ai the demo needs no key/);
  const home = mkdtempSync(join(sandbox, 'home-'));
  const old = process.env.TABULARIUS_HOME;
  process.env.TABULARIUS_HOME = home;
  try {
    await assert.rejects(startDemo({ starter: 'crm-showcase', ai: true, env: {} }), /demo: --ai needs an Anthropic API key.*ANTHROPIC_API_KEY.*Without --ai the demo needs no key/);
  } finally {
    if (old === undefined) delete process.env.TABULARIUS_HOME; else process.env.TABULARIUS_HOME = old;
  }
  await assert.rejects(startDemo({ ai: true, env: { ANTHROPIC_API_KEY: ['test', 'key'].join('-') } }), /demo: --ai goes with --full or --starter crm-showcase/);
  await assert.rejects(startDemo({ full: true, starter: 'tasks' }), /demo: --full is the crm-showcase starter with more/);
  assert.deepEqual(readdirSync(tmpdir()).filter((f) => f.startsWith('tabularius-demo-')), before, 'nothing was made');
});

test('the real command: --full prints the sign-ins, the SQL line and the AI hand-off once; the --ai refusal and banner say what leaves', async () => {
  const run = (...args: string[]) => runCli(main, ['demo', '--no-open', ...args], { timeout: 30_000, env: { ...process.env, ANTHROPIC_API_KEY: '', TABULARIUS_HOME: join(sandbox, 'empty-home') } });
  const refused = await run('--full', '--ai');
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /demo: --ai needs an Anthropic API key/);
  assert.doesNotMatch(refused.stderr, / at .*\.ts:\d+/);
  assert.match(AI_BANNER, /^AI is on: questions and the data they read go to the model provider\. The sample data is invented\.$/);

  const child = spawn(process.execPath, ['--no-warnings', main, 'demo', '--no-open', '--full'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  child.stdout.setEncoding('utf8').on('data', (c: string) => { out += c; });
  const exited = new Promise<number | null>((done) => child.on('close', done));
  const started = Date.now();
  while (!/Claude Desktop/.test(out) && Date.now() - started < 30_000) await new Promise((r) => setTimeout(r, 100));
  try {
    assert.match(out, /Also\s+Ava \(Rep\), Morgan \(Manager\), Eli \(Executive\)/);
    assert.match(out, /SQL\s+read-only/);
    assert.match(out, /Connect an AI app/);
    assert.match(out, /claude mcp add -{2}transport http tabularius-demo /);
    assert.doesNotMatch(out, /AI is on:/, 'without --ai the assistant stays off');
    assert.match(out, /read -rs \w+ && export/);
    assert.match(out, /unverified/);
    assert.match(out, /stopped uncleanly.*valid until the expiry/);
    assert.match(out, /chmod 600/);
    assert.match(out, /only then run  unset/);
    assert.match(out, /expired or was revoked, or the demo is stopped/);
    assert.match(out, /POSIX/);
    assert.match(out, /journal and index tables/);
    assert.match(out, /read-only, the Rep privilege set/);
    assert.match(out, /separate program: what it reads may go to its own provider/);
    const token = /Token \(shown only here[^\n]*\n\s+(\S+)/.exec(out)?.[1];
    assert.ok(token, 'a token is printed');
    assert.equal(out.split(token!).length - 1, 2, 'the token is printed twice, on its own line and in the Desktop snippet, and nowhere else');
  } finally {
    child.kill('SIGTERM');
    await exited;
    child.kill('SIGKILL');
  }
});

async function mcpTool(demo: Demo, token: string, name: string, args: Record<string, unknown>) {
  const post = (id: number, method: string, params: unknown, session?: string) => fetch(`${demo.url}/mcp`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-06-18', ...(session ? { 'mcp-session-id': session } : {}) },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  });
  const init = await post(1, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'demo-test', version: '1' } });
  const session = init.headers.get('mcp-session-id') ?? undefined;
  await init.text();
  await fetch(`${demo.url}/mcp`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...(session ? { 'mcp-session-id': session } : {}) }, body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) });
  const reply = await post(2, 'tools/call', { name, arguments: args }, session);
  const text = await reply.text();
  const data = /^data: (.*)$/m.exec(text)?.[1] ?? text;
  return JSON.parse(data) as { result?: { isError?: boolean; content: { text: string }[] }; error?: unknown };
}

test('the AI app token is read-only and sees one rep: another rep\'s deals are not returned, a write is refused', async () => {
  const demo = await startDemo({ full: true });
  try {
    const token = demo.mcp!.token;
    const admin = (await sessionFor(demo, 'Admin', demo.password)).token;
    const all = await recordsFor(demo, admin, 'Deals');
    const found = await mcpTool(demo, token, 'find_records', { database: 'Showcase', layout: 'Deals' });
    assert.notEqual(found.result?.isError, true, JSON.stringify(found));
    const seen = (JSON.parse(found.result!.content[0].text) as { records: { fieldData: Record<string, unknown> }[] }).records;
    assert.ok(seen.length > 0 && seen.length < all.found, `the agent sees ${seen.length} of ${all.found} deals`);
    const reps = await recordsFor(demo, admin, 'Reps');
    const agentRep = reps.data.find((r) => r.fieldData.Login === 'AI agent')!;
    assert.ok(seen.every((d) => String(d.fieldData['Owner ID']) === String(agentRep.fieldData.ID)), 'only the agent rep\'s deals');
    // Writes and scripts are refused for a read-only token.
    const before = await recordsFor(demo, admin, 'Deals');
    const write = await mcpTool(demo, token, 'create_record', { database: 'Showcase', layout: 'Deals', fieldData: { Title: 'agent wrote this' } });
    assert.ok(write.error || write.result?.isError, `a write was accepted: ${JSON.stringify(write)}`);
    const script = await mcpTool(demo, token, 'run_script', { database: 'Showcase', layout: 'Deals', script: 'Advance stage' });
    assert.ok(script.error || script.result?.isError, `a script was accepted: ${JSON.stringify(script)}`);
    assert.equal((await recordsFor(demo, admin, 'Deals')).found, before.found, 'nothing was created');
  } finally {
    await demo.stop();
  }
});

test('stopping revokes the AI app token, also in a kept folder that is hosted again', async () => {
  const base = mkdtempSync(join(tmpdir(), 'tabularius-demo-test-'));
  try {
    const keep = join(base, 'kept');
    const first = await startDemo({ full: true, keep });
    const token = first.mcp!.token;
    assert.equal((await fetch(`${first.url}/mcp`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } }) })).status, 200);
    await first.stop();
    // Hosted again from the kept files, well before the 24 hours are up: the copied token is dead.
    const { serve } = await import('../../server/src/index.ts');
    const again = await serve({ dir: keep, port: 0, hostname: '127.0.0.1', log: () => {}, checkFiles: false });
    try {
      assert.equal((await fetch(`${again.url}/mcp`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: '{}' })).status, 401);
    } finally {
      await new Promise<void>((done) => { again.server.close(() => done()); again.server.closeAllConnections?.(); });
      await again.host.close();
    }
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('--ai says so before the server listens or the assistant exists', async () => {
  const order: string[] = [];
  const key = ['test', 'not', 'a', 'key'].join('-');
  const demo = await startDemo({
    full: true, ai: true, env: { ANTHROPIC_API_KEY: key },
    notice: (line) => order.push(`notice: ${line}`),
    log: (line) => order.push(`log: ${line}`),
  });
  try {
    assert.equal(demo.ai, true);
    assert.equal(order[0], `notice: ${AI_BANNER}`, `the banner comes first: ${order.join(' | ')}`);
    assert.ok(order.every((l) => !l.includes(key)), 'the key is not in anything printed');
  } finally {
    await demo.stop();
  }
});

test('the AI app token is refused data-cleanup writes, even ones that match no record, and leaves no cleanup history', async () => {
  const demo = await startDemo({ full: true });
  try {
    const token = demo.mcp!.token;
    const fix = await mcpTool(demo, token, 'fix_data_problems', { database: 'Showcase', layout: 'Deals', fixes: [{ field: 'Title', from: 'no such demo title', to: 'replacement' }] });
    assert.ok(fix.result?.isError || fix.error, JSON.stringify(fix));
    assert.match(JSON.stringify(fix), /read-only/);
    const undo = await mcpTool(demo, token, 'undo_data_fix', { database: 'Showcase', id: '1' });
    assert.match(JSON.stringify(undo), /read-only/);
    const importUndo = await mcpTool(demo, token, 'undo_import', { database: 'Showcase', id: '1' });
    assert.match(JSON.stringify(importUndo), /read-only/);
    // The history is empty: the payload is parsed, so an error response cannot pass.
    const history = await mcpTool(demo, token, 'undo_data_fix', { database: 'Showcase' });
    assert.notEqual(history.result?.isError, true, JSON.stringify(history));
    assert.deepEqual((JSON.parse(history.result!.content[0].text) as { history: unknown[] }).history, []);
    // A dry run changes nothing and stays allowed.
    const dry = await mcpTool(demo, token, 'fix_data_problems', { database: 'Showcase', layout: 'Deals', dryRun: true, fixes: [{ field: 'Title', from: 'no such demo title', to: 'replacement' }] });
    assert.notEqual(dry.result?.isError, true, JSON.stringify(dry));
    assert.equal((JSON.parse(dry.result!.content[0].text) as { dryRun?: boolean }).dryRun, true);
  } finally {
    await demo.stop();
  }
});

test('after an unclean stop the kept token still works until its expiry, and not after it', async (t) => {
  const base = mkdtempSync(join(tmpdir(), 'tabularius-demo-test-'));
  const keep = join(base, 'kept');
  const child = spawn(process.execPath, ['--no-warnings', main, 'demo', '--no-open', '--full', '--keep', keep], { stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  child.stdout.setEncoding('utf8').on('data', (c: string) => { out += c; });
  const exited = new Promise<void>((done) => child.on('close', () => done()));
  try {
    const started = Date.now();
    while (!/stopped uncleanly/.test(out) && Date.now() - started < 30_000) await new Promise((r) => setTimeout(r, 100));
    const token = /Token \(shown only here[^\n]*\n\s+(\S+)/.exec(out)?.[1];
    assert.ok(token, out);
    child.kill('SIGKILL');
    await exited;
    const { serve } = await import('../../server/src/index.ts');
    const { expiryClock } = await import('../../store/src/clock.ts');
    let now = Date.now();
    t.mock.method(expiryClock, 'now', () => now);
    const status = async () => {
      const again = await serve({ dir: keep, port: 0, hostname: '127.0.0.1', log: () => {}, checkFiles: false });
      try {
        return (await fetch(`${again.url}/mcp`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } }) })).status;
      } finally {
        await new Promise<void>((done) => { again.server.close(() => done()); again.server.closeAllConnections?.(); });
        await again.host.close();
      }
    };
    assert.equal(await status(), 200, 'valid before the expiry, as the output says');
    now += 24 * 3_600_000 + 60_000;
    assert.equal(await status(), 401, 'refused after the 24 hours');
  } finally {
    child.kill('SIGKILL');
    rmSync(base, { recursive: true, force: true });
  }
});

test('the docs say --ai covers the in-app assistant only, and what a connected AI app does', () => {
  const root = join(import.meta.dirname, '..', '..', '..');
  const read = (f: string) => readFileSync(join(root, f), 'utf8').replace(/\s+/g, ' ');
  assert.match(read('README.md'), /turns on the demo's own assistant only; an AI app you connect is a separate program whose provider receives whatever it reads/);
  assert.match(read('docs/privacy.md'), /`--ai` does not cover an AI app you connect yourself.*its own provider/);
  assert.match(read('docs/privacy.md'), /--starter crm-showcase --ai/);
  assert.match(read('docs/starter-solutions.md'), /controls the demo's own assistant only.*separate program.*its own provider/);
  assert.match(read('docs/starter-solutions.md'), /chmod 600.*POSIX-only.*uncleanly.*stays valid until its 24-hour expiry/);
  assert.match(read('docs/starter-solutions.md'), /not zero writes/);
});
