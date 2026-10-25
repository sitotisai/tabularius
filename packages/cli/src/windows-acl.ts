// Is everything the Windows boot task starts safe from other accounts? `service install --system` registers a task that runs
// as the system account (S-1-5-18). If an ordinary account can edit Node, the program folder or a folder above them, it can
// plant code that the task then runs with more privilege than that account has. This file reads the access lists as SDDL
// text (it names accounts by SID, so it reads the same in every language of Windows) and says who besides administrators
// and the system may change what the task runs.
//
// The pure part (`parseSddl`, `writableBy`, `unsafeAmong`, `refuseWritableSystemTaskCode`) is tested with injected access
// lists. `windowsAclProbe`, the part that asks a real Windows machine through PowerShell, has not been run on Windows.
import { spawnSync } from 'node:child_process';
import { win32 } from 'node:path';

/** One file or folder, as its security descriptor in SDDL form (owner and DACL), and where it links to when it is a link. */
export interface AclEntry { path: string; sddl: string; link?: string }
/**
 * How much a probe reads: `self` the path alone, `children` the path and what is directly in it, `tree` everything inside it
 * (links inside are reported with where they lead, not followed).
 */
export type AclDepth = 'self' | 'children' | 'tree';
/** Reads a path's access list, and with `depth` more of what is inside it. Throws when it cannot. */
export type AclProbe = (path: string, depth: AclDepth) => AclEntry[];

/** Administrators, the system, and the Windows installer's own account (it owns Program Files). */
const TRUSTED = new Set(['BA', 'SY', 'S-1-5-32-544', 'S-1-5-18', 'S-1-5-80-956008885-3418522649-1831038044-1853292631-2271478464']);

const FILE_WRITE_DATA = 0x2, FILE_APPEND_DATA = 0x4, FILE_DELETE_CHILD = 0x40, DELETE = 0x10000, WRITE_DAC = 0x40000, WRITE_OWNER = 0x80000;
const GENERIC_ALL = 0x10000000, GENERIC_WRITE = 0x40000000;
/** What changes a file or folder that the task runs from, or what is in it (a new file or folder in it counts). */
const CHANGES_CODE = FILE_WRITE_DATA | FILE_APPEND_DATA | FILE_DELETE_CHILD | DELETE | WRITE_DAC | WRITE_OWNER | GENERIC_ALL | GENERIC_WRITE;
/** What replaces a folder far above the code (renaming it away, or taking it over); adding a new child there is harmless. */
const REPLACES_FOLDER = FILE_DELETE_CHILD | DELETE | WRITE_DAC | WRITE_OWNER | GENERIC_ALL | GENERIC_WRITE;
/** Bits no ordinary access list carries (ACCESS_SYSTEM_SECURITY, MAXIMUM_ALLOWED, reserved): not understood, so not trusted. */
const ODD_BITS = 0x0f000000;

/**
 * The rights letters of SDDL. The letters CC to CR are the directory-service names that Windows also prints for the low bits
 * of a file or folder mask when they do not make up one of the standard sets; what they mean on a file or folder is noted.
 * A stock C:\ prints Authenticated Users' "create folders" as LC, and read and execute without the synchronize bit as
 * CCSWWPLORC. Letters not listed here (registry keys, mandatory labels) are not understood and count as full control.
 */
const RIGHT_LETTERS: Record<string, number> = {
  GA: GENERIC_ALL, GR: 0x80000000, GW: GENERIC_WRITE, GX: 0x20000000,
  FA: 0x1f01ff, FR: 0x120089, FW: 0x120116, FX: 0x1200a0,
  RC: 0x20000, SD: DELETE, WD: WRITE_DAC, WO: WRITE_OWNER,
  CC: 0x1, //   list folder / read data
  DC: 0x2, //   create files / write data (changes code)
  LC: 0x4, //   create folders / append data (changes code in the folder itself)
  SW: 0x8, //   read extended attributes
  RP: 0x10, //  write extended attributes
  WP: 0x20, //  traverse / execute
  DT: 0x40, //  delete child (changes code)
  LO: 0x80, //  read attributes
  CR: 0x100, // write attributes
};

/** The access mask an SDDL rights field stands for. A right this reader does not know counts as full control. */
function rightsMask(rights: string): number {
  let mask: number;
  if (/^0x[0-9a-f]{1,8}$/i.test(rights)) mask = Number(rights) >>> 0;
  else if (/^[1-9]\d{0,9}$/.test(rights) && Number(rights) <= 0xffffffff) mask = Number(rights) >>> 0;
  else if (!rights || rights.length % 2 || !/^[A-Z]+$/.test(rights)) return GENERIC_ALL;
  else {
    mask = 0;
    for (let i = 0; i < rights.length; i += 2) mask |= RIGHT_LETTERS[rights.slice(i, i + 2)] ?? GENERIC_ALL;
  }
  mask >>>= 0;
  return mask & ODD_BITS ? (mask | GENERIC_ALL) >>> 0 : mask;
}

export interface Ace { type: string; flags: string; rights: string; sid: string }
export interface ParsedSddl {
  owner: string;
  /** `null` is a descriptor with no access list at all (everyone may do everything): `D:NO_ACCESS_CONTROL`, or no D: part. */
  aces: Ace[] | null;
}

/** Text from the `(` at `start` to its matching `)`: parentheses nest in conditional entries, and quoted text may hold any. */
function parenthesised(s: string, start: number): { body: string; end: number } | undefined {
  let depth = 0;
  let quoted = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (c === '"') quoted = !quoted;
    else if (quoted) continue;
    else if (c === '(') depth++;
    else if (c === ')' && --depth === 0) return { body: s.slice(start + 1, i), end: i + 1 };
  }
  return undefined;
}

/**
 * Reads the SDDL text of an owner and access list (`O:...D:...`, as Get-Acl prints it). It must understand every character:
 * anything left over, an unbalanced parenthesis or an entry of fewer than six fields gives undefined, which is refused.
 */
export function parseSddl(text: string): ParsedSddl | undefined {
  const s = text.trim();
  let i = 0;
  const take = (re: RegExp): RegExpExecArray | null => { re.lastIndex = i; const m = re.exec(s); if (m) i += m[0].length; return m; };
  const SID = /S-1-\d+(?:-\d+)*|[A-Z]{2}/y;
  if (!take(/O:/y)) return undefined;
  const owner = take(SID);
  if (!owner) return undefined;
  if (take(/G:/y) && !take(SID)) return undefined;
  if (i === s.length) return { owner: owner[0], aces: null };
  if (!take(/D:/y)) return undefined;
  const flags = take(/(?:P|AR|AI|NO_ACCESS_CONTROL)*/y)![0];
  if (flags.includes('NO_ACCESS_CONTROL')) return i === s.length && flags === 'NO_ACCESS_CONTROL' ? { owner: owner[0], aces: null } : undefined;
  const aces: Ace[] = [];
  while (s[i] === '(') {
    const group = parenthesised(s, i);
    if (!group) return undefined;
    i = group.end;
    // type;flags;rights;object;inherited object;account, and for a conditional entry one more field, which may hold ";" itself.
    const body = group.body;
    const cuts: number[] = [];
    for (let at = body.indexOf(';'); at >= 0 && cuts.length < 6; at = body.indexOf(';', at + 1)) cuts.push(at);
    if (cuts.length < 5) return undefined;
    const field = (n: number) => body.slice(n === 0 ? 0 : cuts[n - 1] + 1, cuts[n] ?? body.length);
    aces.push({ type: field(0), flags: field(1), rights: field(2), sid: field(5).trim().toUpperCase() });
  }
  return i === s.length ? { owner: owner[0], aces } : undefined;
}

/** The accounts a person may meet in an access list, by the short names Windows prints, in words. */
const ACCOUNT_NAMES: Record<string, string> = {
  WD: 'Everyone', 'S-1-1-0': 'Everyone',
  AU: 'Authenticated Users', 'S-1-5-11': 'Authenticated Users',
  BU: 'Users', 'S-1-5-32-545': 'Users',
  BG: 'Guests', 'S-1-5-32-546': 'Guests',
  PU: 'Power Users', 'S-1-5-32-547': 'Power Users',
  IU: 'Interactive', 'S-1-5-4': 'Interactive',
  NU: 'Network', 'S-1-5-2': 'Network',
  AN: 'Anonymous Logon', 'S-1-5-7': 'Anonymous Logon',
  CO: 'Creator Owner', CG: 'Creator Group', OW: 'Owner Rights',
  LA: 'the local Administrator account', LG: 'the local Guest account',
  DU: 'Domain Users', DA: 'Domain Admins', DG: 'Domain Guests', DC: 'Domain Computers',
  AC: 'All Application Packages', 'S-1-15-2-1': 'All Application Packages', 'S-1-15-2-2': 'All Restricted Application Packages',
  RC: 'Restricted Code', LS: 'Local Service', NS: 'Network Service', SU: 'Service logon group',
  RD: 'Remote Desktop Users', AO: 'Account Operators', SO: 'Server Operators', PO: 'Print Operators', BO: 'Backup Operators',
  BA: 'Administrators', SY: 'the system account', 'S-1-5-32-544': 'Administrators', 'S-1-5-18': 'the system account',
};

/** An account as a person can read it: its name with the short form Windows stores, and for an unknown one a pointer. */
export function accountName(sid: string): string {
  const name = ACCOUNT_NAMES[sid];
  if (name) return `${name} (${sid})`;
  if (/^S-1-5-21-/.test(sid)) return `${sid} (an account or group of this computer or its domain)`;
  if (/^S-1-5-80-/.test(sid)) return `${sid} (a Windows service account)`;
  return sid || 'an unknown account';
}

/**
 * Who, besides administrators and the system, can change what is at this security descriptor: its owner (who can rewrite the
 * access list) and every account that an "allow" entry gives a writing right. `object` is the code itself; `above` is a
 * folder far above it, where only removing, replacing or re-securing the folder matters. Entries that only pass down to
 * children and entries that deny are ignored (an allow that a deny cancels is still named, which errs toward refusing); a
 * conditional entry counts as if its condition were met. A security descriptor with no access list (everyone may do
 * everything), one with an entry type this reader does not know, or one that cannot be read in full is named as writable.
 */
export function writableBy(sddl: string, scope: 'object' | 'above'): string[] {
  const mask = scope === 'object' ? CHANGES_CODE : REPLACES_FOLDER;
  const parsed = parseSddl(sddl);
  if (!parsed) return ['an unreadable security descriptor'];
  const who: string[] = [];
  const owner = parsed.owner.toUpperCase();
  if (!TRUSTED.has(owner)) who.push(`owner ${accountName(owner)}`);
  if (!parsed.aces) return [...who, 'everyone (there is no access list, which lets anyone do anything)'];
  for (const ace of parsed.aces) {
    if (TRUSTED.has(ace.sid)) continue;
    if ((ace.flags.match(/../g) ?? ([] as string[])).includes('IO')) continue;
    if (['D', 'OD', 'XD'].includes(ace.type)) continue;
    if (!['A', 'OA', 'XA', 'ZA'].includes(ace.type)) { who.push(`${accountName(ace.sid)} (an access entry of type "${ace.type}", which this check does not understand)`); continue; }
    // "Owner Rights" gives the owner's rights; an owner that is not trusted is named above, and a trusted one is fine.
    if (ace.sid === 'OW' || ace.sid === 'S-1-3-4') continue;
    const bits = rightsMask(ace.rights);
    if (bits & mask) who.push(`${accountName(ace.sid)} (${(bits & 0x1f01ff) === 0x1f01ff || bits & GENERIC_ALL ? 'full control' : 'write'})`);
  }
  return who;
}

const lower = (p: string) => win32.normalize(p).replace(/[\\/]+$/, '').toLowerCase();
const within = (p: string, root: string) => lower(p) === lower(root) || lower(p).startsWith(`${lower(root)}\\`);

/** The folders above a path, nearest first, up to and including the drive root. */
export function above(path: string): string[] {
  const out: string[] = [];
  for (let p = win32.dirname(path); ; p = win32.dirname(p)) {
    out.push(p);
    if (win32.dirname(p) === p) return out;
  }
}

/** A path to check, how much of what is in it, and which rights make it unsafe. */
export interface AccessItem {
  path: string;
  depth: AclDepth;
  scope: 'object' | 'above';
  /** With `children`: an entry of this lower-case name (node.exe.local) is checked in full too. */
  localName?: string;
}

/** The probe failed or gave an answer that cannot be trusted. */
export class CouldNotCheck extends Error {}

/**
 * Reads each item (and the links found inside, and where they lead) through `probe` and returns what others can change, as
 * lines naming the path and the accounts. Throws CouldNotCheck when the probe fails or leaves out the path it was asked
 * about: no answer is not an answer of "safe".
 */
export function unsafeAmong(items: AccessItem[], probe: AclProbe): string[] {
  const queue = [...items];
  const seen = new Set<string>();
  const found: string[] = [];
  const walkedRoots: string[] = [];
  while (queue.length) {
    const item = queue.shift()!;
    const key = `${lower(item.path)}|${item.depth}|${item.scope}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (item.depth === 'tree') walkedRoots.push(item.path);
    let entries: AclEntry[];
    try { entries = probe(item.path, item.depth); }
    catch (e) { throw new CouldNotCheck(`could not check who can change ${item.path} (${(e as Error).message})`); }
    // The path asked about must be in the answer itself: an empty or unrelated answer would otherwise pass as "nobody".
    if (!Array.isArray(entries) || !entries.some((e) => lower(e.path) === lower(item.path))) throw new CouldNotCheck(`could not check who can change ${item.path} (the answer left out ${item.path} itself)`);
    for (const entry of entries) {
      const who = writableBy(entry.sddl, item.scope);
      if (who.length) found.push(`${entry.path}: ${who.join(', ')}`);
      if (item.localName && lower(entry.path) === `${lower(win32.dirname(entry.path))}\\${item.localName}`) queue.push({ path: entry.path, depth: 'tree', scope: 'object' });
      if (entry.link) {
        const target = win32.resolve(win32.dirname(entry.path), entry.link);
        if (!walkedRoots.some((r) => within(target, r))) {
          queue.push({ path: target, depth: 'tree', scope: 'object' });
          for (const a of above(target)) queue.push({ path: a, depth: 'self', scope: 'above' });
        }
      }
    }
  }
  return found;
}

/** The refusal for what `unsafeAmong` found: the threat, what was found, and what to do. */
export function unsafeMessage(found: string[], what: string): string {
  const shown = found.slice(0, 5).join('; ') + (found.length > 5 ? `; and ${found.length - 5} more` : '');
  return `service: --system runs the server at boot as the system account, so no other account may be able to change ${what}, or it could run its own code as the system account. These can be changed by others: ${shown}. Accounts are shown by the short names Windows stores (icacls <path> shows them by name). Put Node and Tabularius in a folder only administrators can write (for example under the Program Files folder; docs/service-files.md says how), or install without --system to run as yourself.`;
}

/** Throws the refusal for a probe that could not check something. */
export function refuseUnchecked(e: unknown): never {
  if (!(e instanceof CouldNotCheck)) throw e;
  throw new Error(`service: --system ${e.message}, so it will not run it as the system account. Install without --system, or run this on the Windows machine from an administrator prompt.`);
}

/**
 * Refuses `--system` on Windows unless nothing the boot task starts can be changed by another account: Node and the folder it
 * loads from (every file directly in it, and node.exe.local if there is one), the whole program folder (every file in it, and
 * every link in it to somewhere else), the folder the program folder is in (nobody else may add to it: the boot entry renames
 * app.previous back into place, and an upgrade stages in app.incoming, beside the program folder), and each folder above them
 * all. Anything it cannot check counts as unsafe. Not for the hosted data folder: see docs/service-files.md.
 */
export function refuseWritableSystemTaskCode(o: { platform: string; system: boolean; node: string; main: string; singleFile?: boolean }, probe: AclProbe = windowsAclProbe): void {
  if (o.platform !== 'win32' || !o.system) return;
  const app = o.singleFile ? undefined : win32.resolve(win32.dirname(o.main), '..', '..', '..');
  const items: AccessItem[] = [
    { path: o.node, depth: 'self', scope: 'object' },
    { path: win32.dirname(o.node), depth: 'children', scope: 'object', localName: `${win32.basename(o.node).toLowerCase()}.local` },
  ];
  // The program's own folder is held to the same standard as the program: a sibling made there (app.previous, app.incoming) is run or used.
  if (app) items.push({ path: app, depth: 'tree', scope: 'object' }, { path: win32.dirname(app), depth: 'self', scope: 'object' });
  for (const r of [...items]) for (const a of above(r.path)) items.push({ path: a, depth: 'self', scope: 'above' });
  let found: string[];
  try { found = unsafeAmong(items, probe); }
  catch (e) { refuseUnchecked(e); }
  if (found.length) throw new Error(unsafeMessage(found, 'Node, the program folder, the folder it is in or the folders above them'));
}

/** Where Windows keeps its own programs. Fixed, not read from the environment: a same-user process can set SystemRoot for an administrator prompt. */
export const WINDOWS_DIR = 'C:\\Windows';
export const SYSTEM32 = `${WINDOWS_DIR}\\System32`;

/** The environment for a tool the check starts: only fixed values, so nothing the signed-in user set (a CLR profiler, a module path) reaches it. */
export function trustedEnv(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    SystemRoot: WINDOWS_DIR, windir: WINDOWS_DIR, SystemDrive: 'C:', ComSpec: `${SYSTEM32}\\cmd.exe`,
    PATH: SYSTEM32, TEMP: `${WINDOWS_DIR}\\Temp`, TMP: `${WINDOWS_DIR}\\Temp`,
    PSModulePath: `${SYSTEM32}\\WindowsPowerShell\\v1.0\\Modules`,
    ...extra,
  };
}

/** What the system-task steps need from Windows; tests give their own. */
export interface SystemHost {
  probe: AclProbe;
  /** The full path of a Windows tool by its name without .exe. */
  tool: (name: string) => string;
  /** The folder to start tools in: none that others write to. */
  cwd?: string;
  env: NodeJS.ProcessEnv;
  /** A folder to make a private folder in; its own access list is checked, so a wrong one is refused, not trusted. */
  baseDir: string;
}

export function windowsHost(): SystemHost {
  const host: SystemHost = { probe: (path, depth) => windowsAclProbe(path, depth, host), tool: (name) => `${SYSTEM32}\\${name}.exe`, cwd: SYSTEM32, env: trustedEnv(), baseDir: process.env.ProgramData ?? 'C:\\ProgramData' };
  return host;
}

const PROBE_SCRIPT = `
$ErrorActionPreference = 'Stop'
$req = $env:ACL_PROBE_REQUEST | ConvertFrom-Json
$out = New-Object System.Collections.ArrayList
function Add-Entry($item) {
  $acl = Get-Acl -LiteralPath $item.FullName
  $link = $null
  $reparse = [bool]($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint)
  if ($reparse) {
    $link = $item.Target | Select-Object -First 1
    if (-not $link) { throw ('cannot tell where ' + $item.FullName + ' leads') }
  }
  [void]$out.Add([pscustomobject]@{ path = $item.FullName; sddl = $acl.GetSecurityDescriptorSddlForm('Owner,Access'); link = $link })
  return $reparse
}
function Walk($dir) {
  foreach ($child in @(Get-ChildItem -LiteralPath $dir -Force)) {
    $reparse = Add-Entry $child
    if ($child.PSIsContainer -and -not $reparse -and $req.depth -eq 'tree') { Walk $child.FullName }
  }
}
$root = Get-Item -LiteralPath $req.path -Force
$rootLink = Add-Entry $root
if ($root.PSIsContainer -and -not $rootLink -and $req.depth -ne 'self') { Walk $req.path }
$json = ConvertTo-Json -InputObject @($out) -Compress -Depth 3
[Console]::Out.Write([Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($json)))
`;

const PROBE_TIMEOUT_MS: Record<AclDepth, number> = { self: 60_000, children: 60_000, tree: 300_000 };

/**
 * Asks Windows (through PowerShell) for the access list of a path, and of what is in it with `depth`. PowerShell is the one in
 * the fixed system folder, started with a fixed environment and no profile. The answer comes back as base64, so no console code
 * page or stray message can alter a path. Any failure, timeout or unreadable answer throws. Never run on Windows by the tests.
 */
export function windowsAclProbe(path: string, depth: AclDepth, host: Pick<SystemHost, 'cwd' | 'env'> = { cwd: SYSTEM32, env: trustedEnv() }): AclEntry[] {
  const powershell = `${SYSTEM32}\\WindowsPowerShell\\v1.0\\powershell.exe`;
  const encoded = Buffer.from(PROBE_SCRIPT, 'utf16le').toString('base64');
  const r = spawnSync(powershell, ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], {
    encoding: 'utf8', timeout: PROBE_TIMEOUT_MS[depth], maxBuffer: 256 * 1024 * 1024, windowsHide: true, cwd: host.cwd,
    env: { ...host.env, ACL_PROBE_REQUEST: JSON.stringify({ path, depth }) },
  });
  if (r.error) throw r.error;
  if (r.signal) throw new Error(`PowerShell was ended by ${r.signal}`);
  if (r.status !== 0) throw new Error((r.stderr || `PowerShell exited with ${r.status}`).trim().split(/\r?\n/)[0]);
  return parseProbeOutput(r.stdout);
}

/** The probe script's answer (base64 of a JSON list) as entries. Anything else, including an empty list, throws. */
export function parseProbeOutput(stdout: string): AclEntry[] {
  let parsed: unknown;
  try { parsed = JSON.parse(Buffer.from(stdout.trim(), 'base64').toString('utf8')); }
  catch { throw new Error('PowerShell did not return a readable answer'); }
  if (!Array.isArray(parsed) || !parsed.length) throw new Error('PowerShell did not return a list with anything in it');
  return parsed.map((e: { path?: unknown; sddl?: unknown; link?: unknown } | null) => {
    if (!e || typeof e.path !== 'string' || typeof e.sddl !== 'string') throw new Error('PowerShell returned an entry without a path or an access list');
    return { path: e.path, sddl: e.sddl, ...(typeof e.link === 'string' && e.link ? { link: e.link } : {}) };
  });
}
