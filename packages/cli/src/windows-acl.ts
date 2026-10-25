// Is everything the Windows boot task starts safe from other accounts? `service install --system` registers a task that runs
// as the system account (S-1-5-18). If an ordinary account can edit Node, the program folder or a folder above them, it can
// plant code that the task then runs with more privilege than that account has. This file reads the access lists as SDDL
// text (it names accounts by SID, so it reads the same in every language of Windows) and says who besides administrators
// and the system may change what the task runs.
//
// The pure part (`writableBy`, `refuseWritableSystemTaskCode`) is tested with injected access lists. `windowsAclProbe`, the
// part that asks a real Windows machine through PowerShell, has not been run on Windows.
import { spawnSync } from 'node:child_process';
import { win32 } from 'node:path';

/** One file or folder, as its security descriptor in SDDL form (owner and DACL), and where it links to when it is a link. */
export interface AclEntry { path: string; sddl: string; link?: string }
/** Reads a path's access list, and with `recursive` everything inside it. Throws when it cannot. */
export type AclProbe = (path: string, recursive: boolean) => AclEntry[];

/** Administrators, the system, and the Windows installer's own account (it owns Program Files). */
const TRUSTED = new Set(['BA', 'SY', 'S-1-5-32-544', 'S-1-5-18', 'S-1-5-80-956008885-3418522649-1831038044-1853292631-2271478464']);

const FILE_WRITE_DATA = 0x2, FILE_APPEND_DATA = 0x4, FILE_DELETE_CHILD = 0x40, DELETE = 0x10000, WRITE_DAC = 0x40000, WRITE_OWNER = 0x80000;
const GENERIC_ALL = 0x10000000, GENERIC_WRITE = 0x40000000;
/** What changes a file or folder that the task runs from, or what is in it. */
const CHANGES_CODE = FILE_WRITE_DATA | FILE_APPEND_DATA | FILE_DELETE_CHILD | DELETE | WRITE_DAC | WRITE_OWNER | GENERIC_ALL | GENERIC_WRITE;
/** What replaces a folder above the code (renaming it away, or taking it over); adding a new child there is harmless. */
const REPLACES_FOLDER = FILE_DELETE_CHILD | DELETE | WRITE_DAC | WRITE_OWNER | GENERIC_ALL | GENERIC_WRITE;

const RIGHT_LETTERS: Record<string, number> = {
  GA: GENERIC_ALL, GR: 0x80000000, GW: GENERIC_WRITE, GX: 0x20000000,
  FA: 0x1f01ff, FR: 0x120089, FW: 0x120116, FX: 0x1200a0,
  RC: 0x20000, SD: DELETE, WD: WRITE_DAC, WO: WRITE_OWNER,
};

/** The access mask an SDDL rights field stands for. A right this reader does not know counts as full control. */
function rightsMask(rights: string): number {
  if (/^0x[0-9a-f]+$/i.test(rights)) return Number(rights) >>> 0;
  if (!rights || rights.length % 2 || !/^[A-Z]+$/.test(rights)) return GENERIC_ALL;
  let mask = 0;
  for (let i = 0; i < rights.length; i += 2) mask |= RIGHT_LETTERS[rights.slice(i, i + 2)] ?? GENERIC_ALL;
  return mask >>> 0;
}

/**
 * Who, besides administrators and the system, can change what is at this security descriptor: its owner (who can rewrite the
 * access list) and every account that an "allow" entry gives a writing right. `object` is the code itself; `above` is a
 * folder above it, where only removing, replacing or re-securing the folder matters. Entries that only pass down to children
 * and entries that deny are ignored (an allow that a deny cancels is still named, which errs toward refusing). A security
 * descriptor with no access list (everyone may do everything) or one that cannot be read is named as writable.
 */
export function writableBy(sddl: string, scope: 'object' | 'above'): string[] {
  const mask = scope === 'object' ? CHANGES_CODE : REPLACES_FOLDER;
  const who: string[] = [];
  const owner = /^O:(S-1-\d+(?:-\d+)+|[A-Z]{2})/.exec(sddl);
  if (!owner) return ['an unreadable security descriptor'];
  if (!TRUSTED.has(owner[1])) who.push(`owner ${owner[1]}`);
  const dacl = /D:([A-Z]*)((?:\([^)]*\))*)/.exec(sddl);
  if (!dacl) return [...who, 'everyone (no access list)'];
  for (const m of dacl[2].matchAll(/\(([^)]*)\)/g)) {
    const [type, flags = '', rights = '', , , sid = ''] = m[1].split(';');
    if (!['A', 'XA', 'OA'].includes(type)) continue;
    if ((flags.match(/../g) ?? ([] as string[])).includes('IO')) continue;
    if (TRUSTED.has(sid)) continue;
    const bits = rightsMask(rights);
    if (bits & mask) who.push(`${sid || 'unknown account'} (${(bits & 0x1f01ff) === 0x1f01ff || bits & GENERIC_ALL ? 'full control' : 'write'})`);
  }
  return who;
}

const lower = (p: string) => win32.normalize(p).replace(/[\\/]+$/, '').toLowerCase();
const within = (p: string, root: string) => lower(p) === lower(root) || lower(p).startsWith(`${lower(root)}\\`);

/** The folders above a path, nearest first, up to and including the drive root. */
function above(path: string): string[] {
  const out: string[] = [];
  for (let p = win32.dirname(path); ; p = win32.dirname(p)) {
    out.push(p);
    if (win32.dirname(p) === p) return out;
  }
}

/**
 * Refuses `--system` on Windows unless nothing the boot task starts can be changed by another account: Node and the folder it
 * loads from, the whole program folder (every file in it, and every link in it to somewhere else), and each folder above
 * them. Anything it cannot check counts as unsafe. Not for the hosted data folder: it holds data, not code.
 */
export function refuseWritableSystemTaskCode(o: { platform: string; system: boolean; node: string; main: string; singleFile?: boolean }, probe: AclProbe = windowsAclProbe): void {
  if (o.platform !== 'win32' || !o.system) return;
  const app = o.singleFile ? undefined : win32.resolve(win32.dirname(o.main), '..', '..', '..');
  const queue: Array<{ path: string; recursive: boolean; scope: 'object' | 'above' }> = [
    { path: o.node, recursive: false, scope: 'object' },
    { path: win32.dirname(o.node), recursive: false, scope: 'object' },
  ];
  if (app) queue.push({ path: app, recursive: true, scope: 'object' });
  const roots = [...queue];
  for (const r of roots) for (const a of above(r.path)) queue.push({ path: a, recursive: false, scope: 'above' });
  const seen = new Set<string>();
  const found: string[] = [];
  const walkedRoots: string[] = [];
  while (queue.length) {
    const item = queue.shift()!;
    const key = `${lower(item.path)}|${item.recursive}|${item.scope}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (item.recursive) walkedRoots.push(item.path);
    let entries: AclEntry[];
    try { entries = probe(item.path, item.recursive); }
    catch (e) { throw new Error(`service: --system could not check who can change ${item.path} (${(e as Error).message}), so it will not run it as the system account. Install without --system, or run this on the Windows machine from an administrator prompt.`); }
    for (const entry of entries) {
      const who = writableBy(entry.sddl, item.scope);
      if (who.length) found.push(`${entry.path}: ${who.join(', ')}`);
      if (entry.link) {
        const target = win32.resolve(win32.dirname(entry.path), entry.link);
        if (!walkedRoots.some((r) => within(target, r))) {
          queue.push({ path: target, recursive: true, scope: 'object' });
          for (const a of above(target)) queue.push({ path: a, recursive: false, scope: 'above' });
        }
      }
    }
  }
  if (!found.length) return;
  const shown = found.slice(0, 5).join('; ') + (found.length > 5 ? `; and ${found.length - 5} more` : '');
  throw new Error(`service: --system runs the server at boot as the system account, so no other account may be able to change Node, the program folder or the folders above them, or it could run its own code as the system account. These can be changed by others: ${shown}. Put Node and Tabularius in a folder only administrators can write (for example under the Program Files folder; docs/service-files.md says how), or install without --system to run as yourself.`);
}

const PROBE_SCRIPT = `
$ErrorActionPreference = 'Stop'
$req = $env:ACL_PROBE_REQUEST | ConvertFrom-Json
$out = New-Object System.Collections.ArrayList
function Add-Entry($item) {
  $acl = Get-Acl -LiteralPath $item.FullName
  $link = $null
  if ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) { $link = $item.Target | Select-Object -First 1 }
  [void]$out.Add([pscustomobject]@{ path = $item.FullName; sddl = $acl.GetSecurityDescriptorSddlForm('Owner,Access'); link = $link })
}
$root = Get-Item -LiteralPath $req.path -Force
Add-Entry $root
if ($req.recursive -and $root.PSIsContainer) { Get-ChildItem -LiteralPath $req.path -Recurse -Force | ForEach-Object { Add-Entry $_ } }
ConvertTo-Json -InputObject @($out) -Compress -Depth 3
`;

/** Asks Windows (through PowerShell) for the access list of a path, and of everything in it with `recursive`. Not run on Windows by the tests. */
export function windowsAclProbe(path: string, recursive: boolean): AclEntry[] {
  const powershell = win32.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  const r = spawnSync(powershell, ['-NoProfile', '-NonInteractive', '-Command', PROBE_SCRIPT], {
    encoding: 'utf8', timeout: 300_000, maxBuffer: 256 * 1024 * 1024, windowsHide: true,
    env: { ...process.env, ACL_PROBE_REQUEST: JSON.stringify({ path, recursive }) },
  });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error((r.stderr || `PowerShell exited with ${r.status}`).trim().split(/\r?\n/)[0]);
  const parsed: unknown = JSON.parse(r.stdout);
  if (!Array.isArray(parsed)) throw new Error('PowerShell did not return a list');
  return parsed.map((e: { path?: unknown; sddl?: unknown; link?: unknown }) => {
    if (typeof e.path !== 'string' || typeof e.sddl !== 'string') throw new Error('PowerShell returned an entry without a path or an access list');
    return { path: e.path, sddl: e.sddl, ...(typeof e.link === 'string' && e.link ? { link: e.link } : {}) };
  });
}
