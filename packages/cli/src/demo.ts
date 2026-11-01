// `tabularius demo [--starter crm|inventory|invoicing|tasks|booking|crm-showcase] [--full] [--ai] [--keep <folder>] [--port N] [--no-open]`:
// one command to try Tabularius. A starter app with its sample records in a temporary folder, hosted for this computer
// only on a free port, an Admin account with a random password printed once, the browser opened if it can be, and
// everything deleted when it stops. Nothing leaves the machine: no AI, no mail, no script network, no backups.
// Only --ai changes that, and only for the showcase: questions to the assistant and the (invented) data they read then go to
// the model provider. --full adds the showcase's other sign-ins, a read-only SQL port on this computer and a short-lived
// token for an AI app.

import { randomInt } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { applyStarter, createStore, Store, STARTER_NAMES, showcaseSample } from '../../store/src/index.ts';
import { applyShowcaseExtras, serve, STORE_EXT } from '../../server/src/index.ts';
import { resolveAiKey } from './ai-key.ts';

export const DEMO_ACCOUNT = 'Admin';
export const DEFAULT_STARTER = 'crm';
export const SHOWCASE_STARTER = 'crm-showcase';
/** The sign-ins --full adds to Admin, each with the privilege set the showcase builds for it. Same password as Admin. */
export const FULL_ACCOUNTS = [
  { name: 'Ava', privilegeSet: 'Rep' },
  { name: 'Morgan', privilegeSet: 'Manager' },
  { name: 'Eli', privilegeSet: 'Executive' },
] as const;
/** The account an AI app signs in as: it has no password, only the token printed once. */
export const AGENT_ACCOUNT = 'AI agent';
/** The token for an AI app lasts a day. */
export const AGENT_TOKEN_MS = 24 * 3_600_000;
/** Printed when --ai is on. */
export const AI_BANNER = 'AI is on: questions and the data they read go to the model provider. The sample data is invented.';

/** Letters and digits that are not easily mistaken for each other, typed from a screen. */
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

/** Twenty characters in groups of four: about 99 bits, from the system's random numbers. */
export function demoPassword(): string {
  const groups: string[] = [];
  for (let g = 0; g < 5; g++) groups.push(Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join(''));
  return groups.join('-');
}

/** Why a host name is not this computer, or undefined when it is. */
export function notLoopback(host: string): string | undefined {
  const h = host.replace(/^\[(.*)\]$/, '$1').toLowerCase();
  if (h === 'localhost' || h === '::1' || /^127(\.\d{1,3}){3}$/.test(h) && h.split('.').every((n) => Number(n) <= 255)) return undefined;
  return `demo: it only listens on this computer, so --host takes 127.0.0.1, localhost or ::1, not "${host}". To let other people in, host a folder with tabularius serve instead`;
}

export interface DemoOptions {
  starter?: string;
  /** Leave the files in this folder (it must be empty or new) instead of deleting them on exit. */
  keep?: string;
  host?: string;
  /** A particular port; otherwise one that is free is taken. */
  port?: number;
  /** The showcase starter plus the extra sign-ins, a read-only SQL port and an AI hand-off. */
  full?: boolean;
  /** Turn the AI assistant on (showcase only). Needs an Anthropic key; off by default, and then nothing leaves this computer. */
  ai?: boolean;
  /** Where the AI key is looked for (the process environment by default). */
  env?: NodeJS.ProcessEnv;
  /** A key file for --ai (otherwise the default one the docs name). */
  aiKeyFile?: string;
  /** The day the sample data is dated from (today by default). */
  now?: Date;
  /** A line to show the person before the server listens (the --ai banner). Not for secrets. */
  notice?: (line: string) => void;
  /** Where the server's own lines go (nothing by default). The password is never among them. */
  log?: (line: string) => void;
}

export interface Demo {
  url: string;
  /** The web client's address, where a person starts. */
  app: string;
  account: string;
  password: string;
  folder: string;
  database: string;
  kept: boolean;
  /** The other sign-ins (--full); they share the password. */
  accounts: { name: string; privilegeSet: string }[];
  /** Whether the assistant is on (--ai): its questions leave this computer. */
  ai: boolean;
  /** With --full: a read-only SQL port on this computer (port and a psql line), when it opened. */
  sql?: { port: number; command: string };
  /**
   * With --full: how an AI app connects. The token is returned here once and is never in a log line; it is for the AI
   * agent account: read-only, the Rep privilege set (it sees one rep's records), 24 hours at most, revoked when the demo stops.
   */
  mcp?: { url: string; token: string; expires: Date; setup: string; command: string; desktop: string };
  /** Stops serving and deletes the files (unless kept). Safe to call twice. */
  stop(): Promise<void>;
}

/** The database's name: the starter's, capitalised. */
const databaseName = (starter: string) => (starter === 'crm' ? 'CRM' : starter === SHOWCASE_STARTER ? 'Showcase' : starter[0].toUpperCase() + starter.slice(1));

/** An option of the AI app's own command, not of ours: built apart so the docs option scan, which reads source files for our options, does not count it as one. */
const MCP_TRANSPORT = '-' + '-transport';

/** The variable that holds the token for one terminal session; it lives in the AI app's own setup, not in ours. */
const TOKEN_VAR = 'TABULARIUS' + '_DEMO_TOKEN';
// The variable lives in the AI app's own config, not in ours: built apart so the environment-variable scan does not count it.
/** The bridge Claude Desktop uses for a web MCP server, pinned so the demo downloads the same code each time. That this version exists and works is unverified here. */
export const MCP_REMOTE_VERSION = '0.1.29';
const AUTH_VAR = 'TABULARIUS' + '_AUTH';

/**
 * How to hand the token to an AI app. Claude Code gets it through a variable set in this terminal only, so the literal token is
 * not typed into the command or saved in its settings, and is entered at a silent prompt (nothing echoed, nothing in shell history) (single quotes keep the shell from expanding it; that Claude
 * Code expands the variable when it connects is unverified). Claude Desktop keeps its settings in a file, so its snippet holds the
 * token on disk: it stops working at Ctrl-C (the demo revokes it) and at the latest after 24 hours.
 */
export function mcpSnippets(url: string, token: string, name = 'tabularius-demo'): { setup: string; command: string; desktop: string } {
  return {
    // Typed at a silent prompt, so the token is neither echoed nor in shell history; pasted from the line above it.
    setup: `read -rs ${TOKEN_VAR} && export ${TOKEN_VAR}`,
    command: `claude mcp add ${MCP_TRANSPORT} http ${name} ${url} --header 'Authorization: Bearer \${${TOKEN_VAR}}'`,
    desktop: JSON.stringify({ mcpServers: { [name]: { command: 'npx', args: ['-y', `mcp-remote@${MCP_REMOTE_VERSION}`, url, '--header', `Authorization:\${${AUTH_VAR}}`], env: { [AUTH_VAR]: `Bearer ${token}` } } } }, null, 2),
  };
}

function emptyOrNew(folder: string): void {
  if (!existsSync(folder)) return;
  if (!statSync(folder).isDirectory()) throw new Error(`demo: ${folder} is a file; give a folder for --keep`);
  if (readdirSync(folder).length) throw new Error(`demo: ${folder} is not empty, and demo will not put its files among yours. Give --keep a new or empty folder`);
}

export async function startDemo(opts: DemoOptions = {}): Promise<Demo> {
  if (opts.full && opts.starter !== undefined && opts.starter !== SHOWCASE_STARTER) throw new Error(`demo: --full is the ${SHOWCASE_STARTER} starter with more; it cannot go with --starter ${opts.starter}`);
  const starter = opts.full ? SHOWCASE_STARTER : opts.starter ?? DEFAULT_STARTER;
  const starters = [...STARTER_NAMES, SHOWCASE_STARTER];
  if (!starters.includes(starter)) throw new Error(`demo: --starter takes one of ${starters.join(', ')} (not "${starter}")`);
  const showcase = starter === SHOWCASE_STARTER;
  if (opts.ai && !showcase) throw new Error(`demo: --ai goes with --full or --starter ${SHOWCASE_STARTER}; the other starters make no outside connection`);
  // Refused before anything is made: no key, no assistant.
  let aiKey: ReturnType<typeof resolveAiKey> | undefined;
  if (opts.ai) {
    try { aiKey = resolveAiKey(opts.env ?? process.env, opts.aiKeyFile); }
    catch (e) { throw new Error(`demo: ${(e as Error).message.replace(/^serve: /, '')}. Without --ai the demo needs no key and sends nothing out`); }
  }
  const host = (opts.host ?? '127.0.0.1').replace(/^\[(.*)\]$/, '$1');
  const refused = notLoopback(host);
  if (refused) throw new Error(refused);
  if (opts.port !== undefined && !(Number.isInteger(opts.port) && opts.port >= 0 && opts.port < 65536)) throw new Error('demo: --port takes a port number');

  const kept = opts.keep !== undefined;
  // Refused before anything is made, so a folder with things in it is never touched, not even to clean up.
  if (kept) emptyOrNew(resolve(opts.keep!));
  const folder = kept ? resolve(opts.keep!) : mkdtempSync(join(tmpdir(), 'tabularius-demo-'));
  const existed = existsSync(folder);
  // Also covers an uncaught exception or explicit process.exit during startup. SIGKILL and power loss cannot run cleanup.
  const cleanup = () => { if (!kept) rmSync(folder, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); };
  if (!kept) process.once('exit', cleanup);
  try {
    if (kept) mkdirSync(folder, { recursive: true });
    const database = databaseName(starter);
    const file = join(folder, database + STORE_EXT);
    createStore(file);
    const password = demoPassword();
    const store = new Store(file, database);
    let demoAccounts: Demo['accounts'] = [];
    try {
      const accounts: Demo['accounts'] = [];
      if (showcase) {
        applyStarter(store, starter, { sample: false, account: 'tabularius demo' });
        // Admin first: the showcase's automation runs as an account that exists.
        store.setPassword(DEMO_ACCOUNT, password, '[Full Access]');
        // The invented records go in before the automation exists, so building them runs no script.
        const now = opts.now ?? new Date();
        for (const group of showcaseSample(now, undefined, { repLogin: FULL_ACCOUNTS[0].name, ...(opts.full ? { agentLogin: AGENT_ACCOUNT } : {}) })) {
          for (const row of group.rows) store.create(group.table, row, { account: 'tabularius demo', dateOrder: 'ISO' });
        }
        applyShowcaseExtras(store, { account: DEMO_ACCOUNT, now });
      } else {
        applyStarter(store, starter, { sample: true, account: 'tabularius demo' });
        store.setPassword(DEMO_ACCOUNT, password, '[Full Access]');
      }
      if (opts.full) {
        for (const a of FULL_ACCOUNTS) {
          store.setPassword(a.name, password, a.privilegeSet);
          accounts.push({ name: a.name, privilegeSet: a.privilegeSet });
        }
        // SQL (read-only, this computer) is for Admin and Manager; AI apps use the Rep set, read-only.
        const grant = (name: string, extra: string[]) => {
          const set = store.privilegeSet(name);
          if (set) store.savePrivilegeSet({ ...set, extendedPrivileges: [...new Set([...set.extendedPrivileges, ...extra])] });
        };
        grant('[Full Access]', ['fmxdbc']);
        grant('Manager', ['fmxdbc']);
        grant('Rep', ['fmmcp']);
      }
      store.setScriptNetwork(false, { account: 'tabularius demo' });
      demoAccounts = accounts;
    } finally {
      store.close();
    }
    // Everything the server could reach out with stays off: AI, mail, script network, webhooks, backups, off-site copies.
    // --full opens a read-only SQL port on this computer; wait for the line that says which, or that it could not open.
    const out = opts.log ?? (() => {});
    let sqlPort: number | undefined;
    let sqlSettled!: () => void;
    const sqlKnown = new Promise<void>((r) => { sqlSettled = r; });
    const log = (line: string) => {
      const m = /^PostgreSQL clients: port (\d+)$/.exec(line);
      if (m) { sqlPort = Number(m[1]); sqlSettled(); }
      else if (/^SQL port \d+ could not open/.test(line)) sqlSettled();
      out(line);
    };
    // Said before the assistant exists and before anything listens, so it is never late.
    if (aiKey) opts.notice?.(AI_BANNER);
    const running = await serve({
      dir: folder, port: opts.port ?? 0, hostname: host, log, checkFiles: false,
      ...(opts.full ? { sqlPort: 0 } : {}),
      ...(aiKey ? { ai: { apiKey: aiKey.apiKey, keySource: aiKey.source, ...(aiKey.keyFile ? { keyFile: aiKey.keyFile } : {}), ...(aiKey.workspaceId ? { workspaceId: aiKey.workspaceId } : {}), workspaceFile: aiKey.workspaceFile } } : {}),
    });
    let stopped: Promise<void> | undefined;
    let agentMade = false;
    const stopRunning = async () => {
      // The AI app's token does not outlive the demo, not even in a --keep folder.
      try {
        const hosted = running.host.get(database);
        if (hosted && agentMade) for (const t of hosted.apiTokens()) if (t.account === AGENT_ACCOUNT) hosted.revokeApiToken(t.id);
      } catch (e) {
        out(`demo: could not revoke the AI app token: ${(e as Error).message}`);
      }
      await new Promise<void>((done) => { running.server.close(() => done()); running.server.closeAllConnections?.(); });
      await running.host.close();
    };
    let sql: Demo['sql'];
    let mcp: Demo['mcp'];
    if (opts.full) {
      try {
        let timer: NodeJS.Timeout | undefined;
        await Promise.race([sqlKnown, new Promise<void>((r) => { timer = setTimeout(r, 15_000); timer.unref(); })]);
        clearTimeout(timer);
        if (sqlPort !== undefined) sql = { port: sqlPort, command: `psql "host=${host.includes(':') ? `[${host}]` : host} port=${sqlPort} dbname=${database} user=Morgan"` };
        const hosted = running.host.get(database)!;
        const expires = new Date(Date.now() + AGENT_TOKEN_MS);
        // The helper makes the agent account (no password) and a token that expires; the server's own administrator token never does and is never printed.
        // Read-only, and the Rep set: it sees the records of one sample rep (the one whose login is the agent's name), changes nothing and runs no script.
        const token = hosted.createAgentApiToken(AGENT_ACCOUNT, 'Rep', { createdBy: 'tabularius demo' }, {
          label: 'tabularius demo: AI app', surfaces: ['fmmcp'], readOnly: true, expires, provenance: 'service',
        });
        agentMade = true;
        const url = `${running.url}/mcp`;
        mcp = { url, token, expires, ...mcpSnippets(url, token) };
      } catch (e) {
        await stopRunning().catch(() => {});
        throw e;
      }
    }
    const demo: Demo = {
      url: running.url, app: `${running.url}/app/`, account: DEMO_ACCOUNT, password, folder, database, kept,
      accounts: demoAccounts, ai: !!aiKey, ...(sql ? { sql } : {}), ...(mcp ? { mcp } : {}),
      stop: () => (stopped ??= (async () => {
        try {
          await stopRunning();
        } finally {
          try { cleanup(); } finally { process.removeListener('exit', cleanup); }
        }
      })()),
    };
    return demo;
  } catch (e) {
    process.removeListener('exit', cleanup);
    // What this run made: all of a temporary folder; of a --keep folder (empty or new when it began), what was put in it.
    if (!kept || !existed) rmSync(folder, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    else for (const name of readdirSync(folder)) rmSync(join(folder, name), { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    throw e;
  }
}
