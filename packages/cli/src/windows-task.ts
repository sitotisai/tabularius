// The Windows system task is registered from an XML file by `schtasks /Create /XML`, run from an administrator prompt. If that
// file sat where an ordinary account can replace it (the default is under the user's own folder), the account could swap it
// for its own after the checks in windows-acl.ts passed, and have a task of its own registered as the system account. So,
// for --system:
//   1. the file is written in a new folder that only administrators and the system can use (`stageSystemTaskXml`): made with
//      an unguessable name, its access list set and then read back and checked, found empty, and only then is the file put in.
//      The folder is made first and secured a moment later (Node cannot make a folder with an access list already set), so for
//      that moment it has what C:\ProgramData passes down; anything created in it then makes it non-empty and it is refused;
//   2. what Windows registered is read back with `schtasks /Query /XML` and compared with what was meant (`taskDifferences`:
//      who it runs as, when it starts, and what it runs) before the task is started; a difference deletes the task.
// Step 1 is what stops a swap (a swapped file could register a task that starts at once, before any read-back); step 2 is a
// second line that also catches Task Scheduler not registering what the file said. Neither has run on a real Windows machine.
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { cleanupPath, writeFileSync } from '../../store/src/fs-boundary.ts';
import { above, refuseUnchecked, unsafeAmong, unsafeMessage, type AccessItem, type SystemHost } from './windows-acl.ts';

export interface Staged { path: string; remove: () => void }

/** Who may use the private folder: the system and administrators, nobody else, and nothing passed down from above. */
const ICACLS_ARGS = ['/inheritance:r', '/grant:r', '*S-1-5-18:(OI)(CI)F', '*S-1-5-32-544:(OI)(CI)F'];

function refuseIfUnsafe(items: AccessItem[], host: SystemHost, what: string): void {
  let found: string[];
  try { found = unsafeAmong(items, host.probe); }
  catch (e) { refuseUnchecked(e); }
  if (found.length) throw new Error(unsafeMessage(found, what));
}

/**
 * Writes `bytes` to a file in a new folder that only administrators and the system can use, and returns its path and a way to
 * remove it. Nothing but the file is ever in the folder. Throws (and removes the folder) when the folder's access list could not
 * be set, read, or is not administrator-only, when something is already in it, or when the folders above it can be replaced.
 */
export function stageSystemTaskXml(bytes: Uint8Array, host: SystemHost): Staged {
  const dir = join(host.baseDir, `tabularius-task-${randomBytes(12).toString('hex')}`);
  mkdirSync(dir);
  const cleanup = cleanupPath(dir, { recursive: true, force: true });
  try {
    const r = spawnSync(host.tool('icacls'), [dir, ...ICACLS_ARGS], { encoding: 'utf8', timeout: 30_000, windowsHide: true, cwd: host.cwd, env: host.env });
    if (r.error || r.status !== 0) throw new Error(`service: --system could not make a folder only administrators can use for the task file (icacls: ${r.error?.message ?? (r.stderr || r.stdout || `exit ${r.status}`).trim().split(/\r?\n/)[0]})`);
    refuseIfUnsafe([{ path: dir, depth: 'tree', scope: 'object' }, ...above(dir).map((path): AccessItem => ({ path, depth: 'self', scope: 'above' }))], host, 'the folder the task file is written in or the folders above it');
    if (readdirSync(dir).length) throw new Error('service: --system found something in the new folder for the task file, so it will not use it');
    const file = join(dir, 'task.xml');
    writeFileSync(file, bytes, { flag: 'wx', mode: 0o600 });
    refuseIfUnsafe([{ path: file, depth: 'self', scope: 'object' }], host, 'the task file');
    return { path: file, remove: () => cleanup({ throwOnError: false }) };
  } catch (e) {
    cleanup({ throwOnError: false });
    throw e;
  }
}

/** The XML Task Scheduler holds for a task, as text. The tool may print UTF-16 (with or without a byte order mark) or the console's code page. */
export function queryRegisteredTask(name: string, host: SystemHost): string {
  const r = spawnSync(host.tool('schtasks'), ['/Query', '/TN', name, '/XML'], { timeout: 30_000, windowsHide: true, cwd: host.cwd, env: host.env, maxBuffer: 16 * 1024 * 1024 });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`schtasks /Query exited with ${r.status}${r.stderr?.length ? `: ${r.stderr.toString('utf8').trim().split(/\r?\n/)[0]}` : ''}`);
  const out = Buffer.from(r.stdout);
  if (out[0] === 0xff && out[1] === 0xfe) return out.subarray(2).toString('utf16le');
  if (out.length > 1 && out[1] === 0 && out[0] !== 0) return out.toString('utf16le');
  return out.toString('utf8').replace(/^﻿/, '');
}

interface XmlNode { name: string; text: string; children: XmlNode[]; attrs: Record<string, string> }

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const unescapeXml = (s: string) => s.replace(/&(?:#x([0-9a-f]+)|#(\d+)|(amp|lt|gt|quot|apos));/gi, (_, hex, dec, name) => hex ? String.fromCodePoint(parseInt(hex, 16)) : dec ? String.fromCodePoint(Number(dec)) : ENTITIES[name.toLowerCase()]);

/** A small reader for the XML of a task: elements and their text (attributes are not needed). Throws on anything malformed. */
function parseXml(text: string): XmlNode {
  const root: XmlNode = { name: '', text: '', children: [], attrs: {} };
  const stack = [root];
  const token = /<!--[^]*?-->|<\?[^]*?\?>|<!\[CDATA\[([^]*?)\]\]>|<\/([^\s>]+)\s*>|<([^\s/>!?]+)((?:\s+[^\s=/>]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)|(<)/g;
  for (const m of text.matchAll(token)) {
    const top = stack[stack.length - 1];
    if (m[7]) throw new Error('not well-formed XML');
    if (m[1] !== undefined) top.text += m[1];
    else if (m[6] !== undefined) top.text += unescapeXml(m[6]);
    else if (m[2] !== undefined) {
      if (stack.length < 2 || top.name !== m[2].replace(/^.*:/, '')) throw new Error('not well-formed XML');
      stack.pop();
    } else if (m[3] !== undefined) {
      const attrs: Record<string, string> = {};
      for (const a of (m[4] ?? '').matchAll(/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1].replace(/^.*:/, '')] = unescapeXml(a[2] ?? a[3]);
      const node: XmlNode = { name: m[3].replace(/^.*:/, ''), text: '', children: [], attrs };
      top.children.push(node);
      if (!m[5]) stack.push(node);
    }
  }
  if (stack.length !== 1 || root.children.length !== 1) throw new Error('not well-formed XML');
  return root.children[0];
}

const child = (n: XmlNode | undefined, name: string): XmlNode | undefined => n?.children.find((c) => c.name === name);
const kids = (n: XmlNode | undefined, name: string): XmlNode[] => n?.children.filter((c) => c.name === name) ?? [];
const text = (n: XmlNode | undefined): string | undefined => n && n.text.trim();

/**
 * What differs, for what matters to who a task runs as and what it runs: the account and run level, the kinds of trigger, and
 * the one command with its arguments and working folder (no other kind of action). `intended` is the XML this command wrote,
 * `registered` what Task Scheduler reports. Things Task Scheduler adds or normalises (dates, the task's own path, defaults)
 * are not compared. Lines are empty when they agree; a registered task that cannot be read counts as different.
 */
export function taskDifferences(intended: string, registered: string): string[] {
  let want: XmlNode, got: XmlNode;
  try { want = parseXml(intended); } catch (e) { return [`the XML this command wrote could not be read (${(e as Error).message})`]; }
  try { got = parseXml(registered); } catch (e) { return [`the registered task could not be read (${(e as Error).message})`]; }
  const diffs: string[] = [];
  if (got.name !== 'Task') diffs.push('what Task Scheduler returned is not a task');
  // Exactly one of each: a second Actions element or a task with none could hide a program behind the one that was compared.
  for (const name of ['Principals', 'Actions', 'Triggers']) if (kids(got, name).length !== 1) diffs.push(`it has ${kids(got, name).length} ${name} elements, not one`);
  // One principal only, and the actions run as it: a second principal, with Actions Context naming it, would run them as someone else.
  const principals = kids(child(got, 'Principals'), 'Principal');
  if (principals.length !== 1) diffs.push(`it has ${principals.length} principals, not one`);
  const context = child(got, 'Actions')?.attrs.Context;
  if (context !== undefined && context !== principals[0]?.attrs.id) diffs.push(`its actions run as principal "${context}", not the one it lists`);
  const user = (n: XmlNode) => text(child(child(child(n, 'Principals'), 'Principal'), 'UserId'))?.toUpperCase();
  const same = (a?: string, b?: string) => a !== undefined && a === b;
  const wantUser = user(want);
  const system = ['S-1-5-18', 'SYSTEM', 'NT AUTHORITY\\SYSTEM'];
  if (!(same(wantUser, user(got)) || (wantUser !== undefined && system.includes(wantUser) && system.includes(user(got) ?? '')))) diffs.push(`it runs as ${user(got) ?? 'nobody named'}, not ${wantUser}`);
  // A service account logs on as one; a task that asks for another way to log on is not the one that was meant.
  const logon = text(child(child(child(got, 'Principals'), 'Principal'), 'LogonType'));
  const wantLogon = text(child(child(child(want, 'Principals'), 'Principal'), 'LogonType'));
  if (logon !== undefined && logon !== wantLogon && logon !== 'ServiceAccount') diffs.push(`its logon type is ${logon}, not ${wantLogon ?? 'ServiceAccount'}`);
  const hidden = (n: XmlNode) => text(child(child(n, 'Settings'), 'Hidden')) ?? 'false';
  if (hidden(got) !== hidden(want)) diffs.push(`its Hidden setting is ${hidden(got)}, not ${hidden(want)}`);
  const level = (n: XmlNode) => text(child(child(child(n, 'Principals'), 'Principal'), 'RunLevel'));
  if (level(got) !== level(want)) diffs.push(`its run level is ${level(got) ?? 'not set'}, not ${level(want) ?? 'not set'}`);
  if (child(child(child(got, 'Principals'), 'Principal'), 'GroupId')) diffs.push('it names a group to run as');
  const kinds = (n: XmlNode) => (child(n, 'Triggers')?.children.map((c) => c.name) ?? []).sort().join(', ');
  if (kinds(got) !== kinds(want)) diffs.push(`it starts on ${kinds(got) || 'nothing'}, not ${kinds(want) || 'nothing'}`);
  const actions = (n: XmlNode) => child(n, 'Actions');
  const gotKinds = (actions(got)?.children.map((c) => c.name) ?? []).join(', ');
  if (gotKinds !== 'Exec') diffs.push(`its actions are ${gotKinds || 'none'}, not one program to run`);
  else {
    const g = child(actions(got), 'Exec'), w = child(actions(want), 'Exec');
    const sameText = (name: string, fold: boolean) => {
      const a = text(child(g, name)) ?? '', b = text(child(w, name)) ?? '';
      if (fold ? a.toLowerCase() !== b.toLowerCase() : a !== b) diffs.push(`its ${name} is ${JSON.stringify(a)}, not ${JSON.stringify(b)}`);
    };
    sameText('Command', true);
    sameText('Arguments', false);
    sameText('WorkingDirectory', true);
    const extra = (g?.children ?? []).map((c) => c.name).filter((n) => !['Command', 'Arguments', 'WorkingDirectory'].includes(n));
    if (extra.length) diffs.push(`its program entry also has ${extra.join(', ')}`);
    if (kids(actions(got), 'Exec').length !== 1) diffs.push('it has more than one program to run');
  }
  return diffs;
}
