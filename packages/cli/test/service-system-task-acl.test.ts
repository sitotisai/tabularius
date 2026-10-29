// `service install --system` on Windows registers a boot task that runs as the system account. Everything that task starts
// (Node, the program folder, the folder the program folder is in, and the folders above them) must be writable only by
// administrators and the system, or any account on the machine could edit the code and have it run with more privilege than
// the account has; and the task file itself must not be somewhere an ordinary account can swap it.
// These tests inject the platform and the ACL probe; nothing here reads a real Windows ACL, and none of this has run on Windows.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { installService, program, serviceFile, type ServiceOptions } from '../src/service.ts';
import {
  parseProbeOutput, parseSddl, refuseWritableSystemTaskCode, trustedEnv, windowsAclProbe, windowsHost, writableBy,
  type AclDepth, type AclProbe, type SystemHost,
} from '../src/windows-acl.ts';
import { stageSystemTaskXml, taskDifferences } from '../src/windows-task.ts';

const TI = 'S-1-5-80-956008885-3418522649-1831038044-1853292631-2271478464';
const USER_SID = 'S-1-5-21-1111111111-2222222222-3333333333-1001';

// Access lists as `Get-Acl <path> | % Sddl` prints them (owner and access list; the Windows 10 and 11 defaults). They are
// written out here in that format, not captured by this change from a machine. Each is the shape a real install meets, so a
// reader that only knows hand-written entries fails on them.
/** C:\ : Authenticated Users may create folders here (LC) and, inherited, write what they create; Users read and execute. */
const STOCK_ROOT = `O:${TI}D:PAI(A;OICIIO;SDGXGWGR;;;AU)(A;;LC;;;AU)(A;OICIIO;GA;;;SY)(A;;FA;;;SY)(A;OICI;0x1200a9;;;BU)(A;OICIIO;GA;;;BA)(A;;FA;;;BA)`;
const STOCK_PROGRAM_FILES = `O:${TI}D:PAI(A;;FA;;;${TI})(A;CIIO;GA;;;${TI})(A;;0x1301bf;;;SY)(A;OICIIO;GA;;;SY)(A;;0x1301bf;;;BA)(A;OICIIO;GA;;;BA)(A;;0x1200a9;;;BU)(A;OICIIO;GXGR;;;BU)(A;OICIIO;GA;;;CO)(A;;0x1200a9;;;AC)(A;OICIIO;GXGR;;;AC)(A;;0x1200a9;;;S-1-15-2-2)(A;OICIIO;GXGR;;;S-1-15-2-2)`;
/** A folder an elevated administrator made under Program Files: everything inherited (ID), owned by Administrators. */
const UNDER_PROGRAM_FILES = `O:BAD:PAI(A;OICIID;FA;;;${TI})(A;OICIID;0x1301bf;;;SY)(A;CIIOID;GA;;;SY)(A;OICIID;0x1301bf;;;BA)(A;CIIOID;GA;;;BA)(A;OICIID;0x1200a9;;;BU)(A;CIIOID;GXGR;;;BU)(A;CIIOID;GA;;;CO)(A;OICIID;0x1200a9;;;AC)(A;OICIID;0x1200a9;;;S-1-15-2-2)`;
const STOCK_PROGRAM_DATA = 'O:SYD:PAI(A;OICI;FA;;;BA)(A;OICI;FA;;;SY)(A;OICIIO;FA;;;CO)(A;OICI;0x1200a9;;;BU)(A;CI;LC;;;BU)(A;CI;DC;;;BU)';
const STOCK_USERS = 'O:SYD:PAI(A;;0x1200a9;;;BU)(A;OICIIO;GXGR;;;BU)(A;OICIIO;GA;;;SY)(A;;0x1301bf;;;SY)(A;OICIIO;GA;;;BA)(A;;0x1301bf;;;BA)(A;;0x1200a9;;;WD)(A;OICIIO;GXGR;;;WD)';
const USER_PROFILE = `O:${USER_SID}D:PAI(A;OICI;FA;;;${USER_SID})(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)`;
const USER_OWNED = USER_PROFILE;
/** A folder Users can only read and run from. */
const ADMIN_ONLY = 'O:BAD:PAI(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)(A;OICI;0x1200a9;;;BU)';

const APP = 'C:\\Program Files\\Tabularius\\app';
const NODE = 'C:\\Program Files\\Tabularius\\node\\node.exe';
const options = (over: Partial<ServiceOptions> = {}): ServiceOptions => ({
  platform: 'win32', folder: 'D:\\Data', port: 8080, host: '127.0.0.1', system: true, extra: [],
  node: NODE, main: `${APP}\\packages\\cli\\src\\main.ts`, user: 'HOST\\admin', home: 'C:\\Users\\admin\\.openhbam', ...over,
});

const key = (p: string) => p.replace(/\\+$/, '').toLowerCase();
/** A probe over a made-up disk: lower-case path (no trailing backslash) to SDDL. `children` and `tree` list what is under a path. */
function probeOf(disk: Record<string, string>, asked: string[] = []): AclProbe {
  const entries = Object.entries(disk);
  return (path: string, depth: AclDepth) => {
    asked.push(`${path} [${depth}]`);
    const self = disk[key(path)];
    if (self === undefined) throw new Error(`no such path ${path}`);
    const under = depth === 'self' ? [] : entries.filter(([p]) => {
      const rest = p.startsWith(`${key(path)}\\`) ? p.slice(key(path).length + 1) : undefined;
      return rest !== undefined && (depth === 'tree' || !rest.includes('\\'));
    });
    return [{ path, sddl: self }, ...under.map(([p, sddl]) => ({ path: p, sddl }))];
  };
}
const stockDisk = (over: Record<string, string> = {}): Record<string, string> => ({
  'c:': STOCK_ROOT,
  'c:\\program files': STOCK_PROGRAM_FILES,
  'c:\\program files\\tabularius': UNDER_PROGRAM_FILES,
  'c:\\program files\\tabularius\\app': UNDER_PROGRAM_FILES,
  'c:\\program files\\tabularius\\app\\packages\\cli\\src\\main.ts': UNDER_PROGRAM_FILES,
  'c:\\program files\\tabularius\\node': UNDER_PROGRAM_FILES,
  'c:\\program files\\tabularius\\node\\node.exe': UNDER_PROGRAM_FILES,
  ...over,
});

test('the SDDL reader names who besides administrators and the system may write', () => {
  const NOTE = 'an account or group of this computer or its domain';
  assert.deepEqual(writableBy(ADMIN_ONLY, 'object'), []);
  assert.deepEqual(writableBy(USER_OWNED, 'object'), [`owner ${USER_SID} (${NOTE})`, `${USER_SID} (${NOTE}) (full control)`]);
  assert.deepEqual(writableBy('O:BAD:PAI(A;OICI;FA;;;BA)(A;OICI;0x1301bf;;;BU)', 'object'), ['Users (BU) (write)']);
  assert.deepEqual(writableBy('O:BAD:(A;;FA;;;BA)(A;;FW;;;WD)', 'object'), ['Everyone (WD) (write)']);
  assert.equal(writableBy('O:BAD:(A;;GA;;;AU)', 'object').length, 1, 'generic all');
  // Read, and read and execute, are fine for anyone.
  assert.deepEqual(writableBy('O:BAD:(A;;FA;;;BA)(A;;FR;;;WD)(A;;FX;;;AU)(A;;GR;;;BU)', 'object'), []);
  // An entry that only passes to children, or only denies, gives this folder nobody new.
  assert.deepEqual(writableBy('O:BAD:(A;OICIIO;FA;;;BU)(D;;FA;;;BU)(A;;FA;;;BA)', 'object'), []);
  assert.deepEqual(writableBy(`O:${TI}D:(A;;FA;;;${TI})`, 'object'), []);
  assert.equal(writableBy('O:BAD:(A;;FA;;;CO)', 'object').length, 1, 'creator owner without inherit-only is the owner, who is not an administrator here');
  assert.equal(writableBy('not an sddl', 'object').length, 1);
  assert.deepEqual(writableBy('O:BAD:(A;;FA;;;BA)(A;;FR;;;OW)', 'object'), [], 'owner rights under a trusted owner');
});

test('the SDDL reader reads what Windows prints for the stock folders', () => {
  assert.deepEqual(writableBy(STOCK_ROOT, 'above'), [], 'C:\\ : Authenticated Users may add a folder (LC), which does not replace one');
  assert.deepEqual(writableBy(STOCK_PROGRAM_FILES, 'above'), []);
  assert.deepEqual(writableBy(STOCK_PROGRAM_FILES, 'object'), [], 'nothing writable by Users under Program Files itself');
  assert.deepEqual(writableBy(UNDER_PROGRAM_FILES, 'object'), []);
  assert.deepEqual(writableBy(STOCK_PROGRAM_DATA, 'above'), []);
  assert.deepEqual(writableBy(STOCK_USERS, 'above'), []);
  // The same C:\ as code: Authenticated Users can create folders there (LC is append data / add subfolder).
  assert.deepEqual(writableBy(STOCK_ROOT, 'object'), ['Authenticated Users (AU) (write)']);
  // The user profile is the user's (owner and an allow entry).
  assert.equal(writableBy(USER_PROFILE, 'above').length, 2);
});

test('directory-service rights letters mean their bits on a file or folder', () => {
  // Read and execute without the synchronize bit prints as letters; it must not be taken for full control.
  assert.deepEqual(writableBy('O:BAD:(A;;FA;;;BA)(A;;CCSWWPLORC;;;BU)', 'object'), []);
  assert.deepEqual(writableBy('O:BAD:(A;;FA;;;BA)(A;;CCSWWPLORC;;;BU)', 'above'), []);
  // CC list, SW read EA, RP write EA, WP traverse, LO read attributes, CR write attributes: none of them changes code.
  for (const letters of ['CC', 'SW', 'RP', 'WP', 'LO', 'CR', 'CCSWRPWPLOCR', 'RC']) assert.deepEqual(writableBy(`O:BAD:(A;;${letters};;;BU)`, 'object'), [], letters);
  // DC is write data (create a file), LC is append data (create a folder), DT is delete child.
  for (const letters of ['DC', 'LC', 'DT', 'CCDC', 'CCLCRC']) assert.equal(writableBy(`O:BAD:(A;;${letters};;;BU)`, 'object').length, 1, letters);
  // Far above the code only replacing the folder matters: adding to it (DC, LC) is fine, deleting a child (DT) is not.
  assert.deepEqual(writableBy('O:BAD:(A;;DC;;;BU)(A;;LC;;;AU)', 'above'), []);
  assert.equal(writableBy('O:BAD:(A;;DT;;;BU)', 'above').length, 1);
  // A letter this reader does not know stays fail-closed, and so do bits no access list should carry.
  for (const rights of ['QQ', 'KA', 'NW', 'FAQ', '', '0x2000000', '0x1000000', '0x200', '0x8000', '0xfe00', '0x200000', '0xe00000', '0x1ffffffffff', '0777']) assert.equal(writableBy(`O:BAD:(A;;${rights};;;BU)`, 'object').length, 1, `[${rights}]`);
  assert.equal(writableBy('O:BAD:(A;;0x40000000;;;BU)', 'object').length, 1, 'generic write');
  assert.equal(writableBy('O:BAD:AI(A;OICIID;0x1301bf;;;AU)', 'object').length, 1, 'modify');
  assert.deepEqual(writableBy('O:BAD:(A;;1179817;;;BU)', 'object'), [], 'decimal 0x1200a9');
});

test('the SDDL reader fails closed on forms it cannot read in full', () => {
  // A conditional entry holds parentheses; the entry after it must still be read (it used to be skipped).
  assert.deepEqual(writableBy('O:BAD:(A;;FA;;;BA)(XA;;FR;;;WD;(Member_of {SID(BA)}))(A;;FA;;;BU)', 'object'), ['Users (BU) (full control)']);
  assert.deepEqual(writableBy('O:BAD:(XA;;FA;;;BU;(@User.x == 1))', 'object'), ['Users (BU) (full control)'], 'a conditional allow counts as met');
  assert.deepEqual(writableBy('O:BAD:(XA;;FA;;;BA;(@User.x == ")(" && Member_of {SID(BU)}))(A;;FA;;;BU)', 'object'), ['Users (BU) (full control)'], 'quoted parentheses');
  // A null access list means everyone has full control.
  assert.deepEqual(writableBy('O:BAD:NO_ACCESS_CONTROL', 'object'), ['everyone (there is no access list, which lets anyone do anything)']);
  assert.equal(writableBy('O:BA', 'object').length, 1, 'no D: part at all');
  assert.equal(writableBy('O:BAD:NO_ACCESS_CONTROL(A;;FA;;;BA)', 'object').length, 1);
  assert.deepEqual(writableBy('O:BAD:', 'object'), [], 'an empty access list lets nobody in');
  assert.deepEqual(writableBy('O:BAD:PAI', 'object'), [], 'an empty protected access list lets nobody in');
  // An entry type this reader does not know is refused, not skipped; so is anything it cannot read to the end.
  assert.equal(writableBy('O:BAD:(ZA;;FA;;;BU;;;)', 'object').length, 1);
  assert.match(writableBy('O:BAD:(ZZ;;FR;;;BU)', 'object')[0], /type "ZZ"/);
  assert.equal(writableBy('O:BAD:(A;;FA;;;BA)(A;;FA;;;BU', 'object').length, 1, 'unbalanced');
  assert.equal(writableBy('O:BAD:(A;;FA;;;BA)junk', 'object').length, 1, 'trailing text');
  assert.equal(writableBy('O:BAD:(A;;FA)', 'object').length, 1, 'too few fields');
  assert.equal(writableBy('O:BAD:(A;;FA;;;BA;extra)', 'object').length, 1, 'a seventh field on a plain entry');
  assert.equal(writableBy('O:BAD:(A;;FA;;;BA;;;)', 'object').length, 1, 'more than six fields');
  assert.equal(writableBy('O:BAD:(XA;;FA;;;BA;(@User.x == 1);more)', 'object').length, 1, 'more than seven on a conditional entry');
  assert.equal(parseSddl('O:BAD:(XA;;FA;;;BA;(Member_of {SID(BU)}))')?.aces?.length, 1, 'a conditional entry has seven');
  assert.equal(writableBy('O:BAD:(A;;FA;;;BA)S:(AU;SA;FA;;;WD)', 'object').length, 1, 'an audit list is not asked for, so it is not read');
  assert.equal(writableBy('', 'object').length, 1);
  // A deny never hides an allow.
  assert.deepEqual(writableBy('O:BAD:(D;;FA;;;BU)(A;;FA;;;BU)', 'object'), ['Users (BU) (full control)']);
  assert.equal(parseSddl('O:BAG:SYD:PAI(A;;FA;;;BA)')?.aces?.length, 1, 'a group part is read');
});

test('an account is named by its name and short form, or for an unknown one by its SID', () => {
  assert.deepEqual(writableBy('O:BAD:(A;;FA;;;S-1-5-32-545)(A;;FA;;;S-1-1-0)(A;;FA;;;S-1-9-9-9)', 'object'), ['Users (S-1-5-32-545) (full control)', 'Everyone (S-1-1-0) (full control)', 'S-1-9-9-9 (full control)']);
});

test('--system on Windows is allowed for a stock Program Files layout', () => {
  const asked: string[] = [];
  refuseWritableSystemTaskCode(options(), probeOf(stockDisk(), asked));
  assert.ok(asked.includes(`${APP} [tree]`), asked.join('\n'));
  assert.ok(asked.includes('C:\\Program Files\\Tabularius\\node [children]'), 'the folder Node loads its libraries from, with what is in it');
  assert.ok(asked.includes('C:\\Program Files\\Tabularius [self]'), 'the folder above the program');
  assert.ok(asked.includes('C:\\ [self]'));
  // The program directly under Program Files works too.
  refuseWritableSystemTaskCode(options({ main: 'C:\\Program Files\\app\\packages\\cli\\src\\main.ts', node: 'C:\\Program Files\\node.exe' }), probeOf(stockDisk({
    'c:\\program files\\app': UNDER_PROGRAM_FILES, 'c:\\program files\\node.exe': UNDER_PROGRAM_FILES,
  })));
});

test('--system is refused for a program directly under C:\\ (anyone can make app.previous or win app.incoming there)', () => {
  const disk = stockDisk({ 'c:\\app': UNDER_PROGRAM_FILES, 'c:\\tabularius': UNDER_PROGRAM_FILES, 'c:\\tabularius\\node': UNDER_PROGRAM_FILES, 'c:\\tabularius\\node\\node.exe': UNDER_PROGRAM_FILES });
  const o = options({ node: 'C:\\tabularius\\node\\node.exe', main: 'C:\\app\\packages\\cli\\src\\main.ts' });
  assert.throws(() => refuseWritableSystemTaskCode(o, probeOf(disk)), /C:\\: Authenticated Users \(AU\) \(write\)/);
  // The reviewer's variant: the root only gives Authenticated Users the right to add a subfolder (0x4).
  const bare = { ...disk, 'c:': 'O:SYD:PAI(A;;FA;;;SY)(A;;FA;;;BA)(A;;0x4;;;AU)' };
  assert.throws(() => refuseWritableSystemTaskCode(o, probeOf(bare)), /Authenticated Users/);
  // The same grant on a folder far above the program is harmless.
  refuseWritableSystemTaskCode(options(), probeOf(stockDisk({ 'c:': 'O:SYD:PAI(A;;FA;;;SY)(A;;FA;;;BA)(A;;0x4;;;AU)' })));
});

test('--system is refused when the program\'s folder passes a writing right down to the folders made in it (app.incoming)', () => {
  // The reviewer's shape: the parent itself is administrator-only, the program folder is protected, but a new sibling inherits Users-modify.
  const PARENT = (entry: string) => `O:BAD:PAI(A;;FA;;;SY)(A;;FA;;;BA)${entry}`;
  const PROTECTED_APP = 'O:BAD:PAI(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)(A;OICI;0x1200a9;;;BU)';
  const disk = (parent: string) => stockDisk({ 'c:\\program files\\tabularius': parent, 'c:\\program files\\tabularius\\app': PROTECTED_APP });
  for (const entry of [
    '(A;OICIIO;0x1301bf;;;BU)', '(A;CIIO;0x1301bf;;;BU)', '(A;OIIO;0x1301bf;;;BU)', '(A;OICI;0x1301bf;;;BU)', '(A;CI;0x1301bf;;;BU)',
    '(A;OICINPIO;0x1301bf;;;BU)', '(A;OICIIO;GA;;;AU)', '(A;OICIIO;GW;;;WD)', '(A;OICIIO;FA;;;S-1-5-21-1-2-3-1001)', '(A;OICIIO;DC;;;BU)', '(A;OICIIO;LC;;;BU)',
  ]) {
    assert.throws(() => refuseWritableSystemTaskCode(options(), probeOf(disk(PARENT(entry)))), /Tabularius: /, entry);
  }
  // What a new folder may inherit without being writable by others: read and execute, entries for the trusted accounts, Creator Owner
  // (which becomes whoever makes the folder), an inherit-only entry that passes to nothing, and deny entries.
  for (const entry of ['(A;OICIIO;0x1200a9;;;BU)', '(A;OICIIO;GXGR;;;BU)', '(A;OICIIO;GA;;;BA)', '(A;OICIIO;GA;;;CO)', '(A;IO;FA;;;BU)', '(D;OICIIO;FA;;;BU)', '(A;OICIIO;CCSWWPLORC;;;AU)']) {
    refuseWritableSystemTaskCode(options(), probeOf(disk(PARENT(entry))));
  }
  // The same inherit-only entry far above the program is not the program's concern.
  refuseWritableSystemTaskCode(options(), probeOf(stockDisk({ 'c:\\program files': PARENT('(A;OICIIO;0x1301bf;;;BU)') })));
  assert.deepEqual(writableBy(PARENT('(A;OICIIO;0x1301bf;;;BU)'), 'parent'), ['Users (BU) (write)']);
  assert.deepEqual(writableBy(PARENT('(A;OICIIO;0x1301bf;;;BU)'), 'object'), [], 'on the folder itself an inherit-only entry gives nothing');
});

test('--system is refused for a program or Node on a network share', () => {
  const never: AclProbe = () => { throw new Error('should not be asked'); };
  for (const bad of [{ node: '//server/share/node.exe' }, { main: '//server/share/app/packages/cli/src/main.ts' }, { node: '\\/server\\share\\node.exe' }, { node: '\\\\server\\share\\node.exe' }, { main: '\\\\server\\share\\app\\packages\\cli\\src\\main.ts' }, { node: '\\\\?\\UNC\\server\\share\\node.exe' }]) {
    assert.throws(() => refuseWritableSystemTaskCode(options(bad), never), /network share/);
  }
  // A local path in the extended form is not taken for a share (the probe is then asked about it).
  assert.throws(() => refuseWritableSystemTaskCode(options({ node: '\\\\?\\C:\\Program Files\\Tabularius\\node\\node.exe' }), never), /should not be asked|could not check/);
});

test('on Windows the tools an administrator command starts are full paths', () => {
  assert.equal(program('schtasks', 'win32'), 'C:\\Windows\\System32\\schtasks.exe');
  assert.equal(program('tar', 'win32'), 'C:\\Windows\\System32\\tar.exe');
  assert.match(program('git', 'win32'), /^C:\\Windows\\System32\\git\.exe$|^[A-Za-z]:[\\/]/);
  for (const platform of ['linux', 'darwin'] as const) for (const name of ['schtasks', 'tar', 'git'] as const) assert.equal(program(name, platform), name);
});

test('--system is refused for the default per-user layout, and says what to do', () => {
  const home = 'C:\\Users\\jo\\.openhbam';
  const disk = stockDisk({
    'c:\\users': STOCK_USERS, 'c:\\users\\jo': USER_OWNED,
    [`${home}`.toLowerCase()]: USER_OWNED,
    [`${home}\\app`.toLowerCase()]: USER_OWNED,
    [`${home}\\app\\packages\\cli\\src\\main.ts`.toLowerCase()]: USER_OWNED,
    [`${home}\\node`.toLowerCase()]: USER_OWNED,
    [`${home}\\node\\node.exe`.toLowerCase()]: USER_OWNED,
  });
  const o = options({ node: `${home}\\node\\node.exe`, main: `${home}\\app\\packages\\cli\\src\\main.ts` });
  assert.throws(() => refuseWritableSystemTaskCode(o, probeOf(disk)), (e: Error) => {
    assert.match(e.message, /--system/);
    assert.match(e.message, /system account/);
    assert.ok(e.message.includes(`${home}\\app`), e.message);
    assert.ok(e.message.includes(USER_SID), 'names who can write');
    assert.match(e.message, /an account or group of this computer or its domain/);
    assert.match(e.message, /icacls/);
    assert.match(e.message, /without --system|Program Files/);
    return true;
  });
});

test('--system is refused when only a folder above, a file inside the program, or a file next to Node can be changed by others', () => {
  const aboveOnly = stockDisk({ 'c:\\program files\\tabularius': 'O:BAD:PAI(A;OICI;FA;;;BA)(A;;0x4;;;BU)' });
  assert.throws(() => refuseWritableSystemTaskCode(options(), probeOf(aboveOnly)), /C:\\Program Files\\Tabularius\b/, 'the program folder\'s folder may not be added to');
  const deleteChild = stockDisk({ 'c:\\program files': 'O:BAD:PAI(A;OICI;FA;;;BA)(A;;0x40;;;BU)' });
  assert.throws(() => refuseWritableSystemTaskCode(options(), probeOf(deleteChild)), /C:\\Program Files\b/);
  assert.throws(() => refuseWritableSystemTaskCode(options(), probeOf(stockDisk({ 'c:\\program files\\tabularius\\app\\packages\\cli\\src\\main.ts': USER_OWNED }))), /main\.ts/);
  // Node's own folder: a library beside node.exe is loaded by it.
  assert.throws(() => refuseWritableSystemTaskCode(options(), probeOf(stockDisk({ 'c:\\program files\\tabularius\\node\\libfoo.dll': USER_OWNED }))), /libfoo\.dll/);
  // node.exe.local redirects the libraries Node loads; what is in it is checked too.
  const local = stockDisk({ 'c:\\program files\\tabularius\\node\\node.exe.local': UNDER_PROGRAM_FILES, 'c:\\program files\\tabularius\\node\\node.exe.local\\x.dll': USER_OWNED });
  assert.throws(() => refuseWritableSystemTaskCode(options(), probeOf(local)), /x\.dll/);
});

test('--system is refused when a link inside the program points to a folder others can write', () => {
  const outside = 'C:\\Users\\jo\\scratch';
  const base = probeOf(stockDisk({ 'c:\\users': STOCK_USERS, 'c:\\users\\jo': STOCK_USERS, [outside.toLowerCase()]: USER_OWNED }));
  const probe: AclProbe = (path, depth) => path === APP
    ? [{ path: APP, sddl: UNDER_PROGRAM_FILES }, { path: `${APP}\\node_modules\\dep`, sddl: UNDER_PROGRAM_FILES, link: outside }]
    : base(path, depth);
  assert.throws(() => refuseWritableSystemTaskCode(options(), probe), /C:\\Users\\jo\\scratch/);
  // A link that stays inside the program folder is covered by the walk of that folder.
  const inside: AclProbe = (path, depth) => path === APP
    ? [{ path: APP, sddl: UNDER_PROGRAM_FILES }, { path: `${APP}\\node_modules\\@x\\y`, sddl: UNDER_PROGRAM_FILES, link: `${APP}\\packages\\y` }]
    : probeOf(stockDisk())(path, depth);
  refuseWritableSystemTaskCode(options(), inside);
});

test('--system is refused when the ACLs cannot be read, or the answer leaves out what was asked about (it fails closed)', () => {
  assert.throws(() => refuseWritableSystemTaskCode(options(), () => { throw new Error('powershell is not available'); }), /could not check[^]*powershell is not available/);
  assert.throws(() => refuseWritableSystemTaskCode(options(), probeOf({})), /could not check/);
  // An empty answer is not "nobody can write": the path itself has to be in it.
  assert.throws(() => refuseWritableSystemTaskCode(options(), () => []), /could not check[^]*left out/);
  const base = probeOf(stockDisk());
  assert.throws(() => refuseWritableSystemTaskCode(options(), (p, d) => (p === APP ? [] : base(p, d))), /left out C:\\Program Files\\Tabularius\\app itself/);
  assert.throws(() => refuseWritableSystemTaskCode(options(), (p, d) => (p === APP ? [{ path: 'C:\\somewhere\\else', sddl: ADMIN_ONLY }] : base(p, d))), /left out/);
});

test('the single-file program has no app folder to check, and a task for the logged-in user checks nothing', () => {
  const asked: string[] = [];
  refuseWritableSystemTaskCode(options({ singleFile: true, node: NODE, main: 'ignored' }), probeOf(stockDisk(), asked));
  assert.ok(!asked.some((a) => a.includes('[tree]')), 'no walk of an app folder');
  const never: AclProbe = () => { throw new Error('should not be asked'); };
  refuseWritableSystemTaskCode(options({ system: false }), never);
  refuseWritableSystemTaskCode(options({ platform: 'linux', main: '/x/y/z/main.ts', node: '/usr/bin/node', folder: '/d' }), never);
});

test('the PowerShell probe is started from fixed places with a fixed environment, and fails closed', () => {
  const host = windowsHost();
  assert.equal(host.tool('powershell'), 'C:\\Windows\\System32\\powershell.exe');
  assert.equal(host.cwd, 'C:\\Windows\\System32');
  const hostile: Record<string, string> = { ProgramData: 'C:\\Users\\jo\\pd', SystemRoot: 'C:\\Users\\jo\\fake', windir: 'C:\\Users\\jo\\fake', COR_ENABLE_PROFILING: '1', COR_PROFILER_PATH: 'C:\\Users\\jo\\p.dll', PSModulePath: 'C:\\Users\\jo\\modules' };
  const previous = Object.fromEntries(Object.keys(hostile).map((k) => [k, process.env[k]]));
  try {
    Object.assign(process.env, hostile);
    const env = windowsHost().env;
    assert.equal(env.SystemRoot, 'C:\\Windows');
    assert.equal(env.windir, 'C:\\Windows');
    assert.equal(env.COR_ENABLE_PROFILING, undefined);
    assert.equal(env.COR_PROFILER_PATH, undefined);
    assert.equal(env.PSModulePath, 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\Modules');
    assert.equal(env.PATH, 'C:\\Windows\\System32');
    process.env.ProgramData = 'C:\\Users\\jo\\pd';
    assert.equal(windowsHost().baseDir, 'C:\\ProgramData', 'not from the environment');
    assert.deepEqual(trustedEnv({ X: '1' }).X, '1');
    assert.equal(windowsHost().tool('icacls'), 'C:\\Windows\\System32\\icacls.exe', 'the user environment does not move it');
  } finally {
    for (const [k, v] of Object.entries(previous)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
  if (process.platform !== 'win32') assert.throws(() => windowsAclProbe('C:\\x', 'self'), 'no PowerShell here: an error, not an empty answer');
  const entry = { path: 'C:\\x', sddl: ADMIN_ONLY, link: null };
  const encode = (v: unknown) => Buffer.from(JSON.stringify(v), 'utf8').toString('base64');
  assert.deepEqual(parseProbeOutput(encode([entry])), [{ path: 'C:\\x', sddl: ADMIN_ONLY }]);
  assert.deepEqual(parseProbeOutput(`${encode([{ ...entry, link: 'D:\\t' }])}\r\n`), [{ path: 'C:\\x', sddl: ADMIN_ONLY, link: 'D:\\t' }]);
  assert.throws(() => parseProbeOutput(encode([])), /anything in it/);
  assert.throws(() => parseProbeOutput(''), /readable|anything/);
  assert.throws(() => parseProbeOutput('not base64 json!'), /readable/);
  assert.throws(() => parseProbeOutput(encode({ path: 'C:\\x' })), /anything in it/);
  assert.throws(() => parseProbeOutput(encode([{ path: 'C:\\x' }])), /without a path or an access list/);
  assert.throws(() => parseProbeOutput(encode([null])), /without a path or an access list/);
});

// ----- the task file ------------------------------------------------------------------------------------------------------

/** What Task Scheduler reports for the XML this command writes: its own additions (date, author, task path, logon type). */
const registeredFrom = (text: string): string => text
  .replace('<RegistrationInfo>', '<RegistrationInfo>\n    <Date>2026-10-25T08:00:00</Date>\n    <Author>HOST\\admin</Author>\n    <URI>\\openhbam</URI>')
  .replace('<RunLevel>HighestAvailable</RunLevel>', '<LogonType>ServiceAccount</LogonType>\n      <RunLevel>HighestAvailable</RunLevel>');
const systemXml = (over: Partial<ServiceOptions> = {}) => serviceFile(options(over)).text;

test('taskDifferences accepts what Task Scheduler reports for the task that was written', () => {
  const text = systemXml();
  assert.deepEqual(taskDifferences(text, text), []);
  assert.deepEqual(taskDifferences(text, registeredFrom(text)), []);
  assert.deepEqual(taskDifferences(text, registeredFrom(text).replace('S-1-5-18', 'SYSTEM')), [], 'the account by name');
  assert.deepEqual(taskDifferences(text, registeredFrom(text).replace(/<Command>([^<]*)<\/Command>/, (_, c: string) => `<Command>${c.toUpperCase()}</Command>`)), [], 'a path in another case is the same path');
  // Characters XML escapes are compared as what they stand for.
  const odd = systemXml({ folder: 'D:\\Data & <more>' });
  assert.deepEqual(taskDifferences(odd, registeredFrom(odd)), []);
});

test('taskDifferences names what changed in who it runs as, when it starts and what it runs', () => {
  const text = systemXml();
  const registered = registeredFrom(text);
  const swap = (from: string | RegExp, to: string) => registered.replace(from, to);
  const cases: Array<[string, string, RegExp]> = [
    ['another program', swap(/<Command>[^<]*<\/Command>/, '<Command>C:\\Users\\jo\\evil.exe</Command>'), /Command is "C:\\\\Users\\\\jo\\\\evil\.exe"/],
    ['other arguments', swap(/<Arguments>/, '<Arguments>--eval evil() '), /Arguments is/],
    ['another working folder', swap(/<WorkingDirectory>[^<]*<\/WorkingDirectory>/, '<WorkingDirectory>C:\\Users\\jo</WorkingDirectory>'), /WorkingDirectory is/],
    ['a second program', swap('</Exec>', '</Exec><Exec><Command>C:\\evil.exe</Command></Exec>'), /actions are Exec, Exec/],
    ['a COM handler instead', swap(/<Exec>[^]*<\/Exec>/, '<ComHandler><ClassId>{00000000-0000-0000-0000-000000000000}</ClassId></ComHandler>'), /actions are ComHandler/],
    ['a program and a COM handler', swap('</Exec>', '</Exec><ComHandler><ClassId>{0}</ClassId></ComHandler>'), /actions are Exec, ComHandler/],
    ['no action', swap(/<Actions[^]*<\/Actions>/, '<Actions Context="Author"></Actions>'), /actions are none/],
    ['a trigger that starts at once', swap('<Triggers>', '<Triggers><RegistrationTrigger><Enabled>true</Enabled></RegistrationTrigger>'), /starts on BootTrigger, RegistrationTrigger, TimeTrigger, not BootTrigger, TimeTrigger/],
    ['a time trigger instead', swap('<BootTrigger><Enabled>true</Enabled></BootTrigger>', '<TimeTrigger><StartBoundary>2026-01-01T00:00:00</StartBoundary></TimeTrigger>'), /starts on TimeTrigger, TimeTrigger, not BootTrigger, TimeTrigger/],
    ['another account', swap('S-1-5-18', 'S-1-5-21-1-2-3-1001'), /runs as S-1-5-21-1-2-3-1001, not S-1-5-18/],
    ['a lower run level', swap('HighestAvailable', 'LeastPrivilege'), /run level is LeastPrivilege/],
    ['a group to run as', swap('<UserId>S-1-5-18</UserId>', '<UserId>S-1-5-18</UserId><GroupId>S-1-5-32-545</GroupId>'), /names a group/],
    ['a second principal', swap('</Principals>', '<Principal id="Other"><UserId>S-1-5-21-1-2-3-1001</UserId><LogonType>InteractiveToken</LogonType></Principal></Principals>'), /2 principals, not one/],
    ['actions that run as another principal', swap('<Actions Context="Author">', '<Actions Context="Other">'), /run as principal "Other"/],
    ['a second Actions element', swap('</Task>', '<Actions Context="Author"><Exec><Command>C:\\evil.exe</Command></Exec></Actions></Task>'), /2 Actions elements/],
    ['a second Triggers element', swap('</Task>', '<Triggers><TimeTrigger/></Triggers></Task>'), /2 Triggers elements/],
    ['a second Principals element', swap('</Task>', '<Principals><Principal id="Author"><UserId>S-1-5-21-1-2-3-1001</UserId></Principal></Principals></Task>'), /2 Principals elements/],
    ['no Principals element', swap(/<Principals>[^]*<\/Principals>/, ''), /0 Principals elements/],
    ['another logon type', swap('<LogonType>ServiceAccount</LogonType>', '<LogonType>InteractiveToken</LogonType>'), /logon type is InteractiveToken/],
    ['a hidden task', swap('<Hidden>false</Hidden>', '<Hidden>true</Hidden>'), /Hidden setting is true/],
    ['an extra entry in the program', swap('</Exec>', '<Extra>x</Extra></Exec>'), /also has Extra/],
  ];
  for (const [name, xml, expected] of cases) {
    const differences = taskDifferences(text, xml);
    assert.ok(differences.some((d) => expected.test(d)), `${name}: ${JSON.stringify(differences)}`);
  }
  for (const bad of ['', 'not xml', '<Task><Actions></Task>', '<a/><b/>', registered.replace('</Task>', '')]) assert.ok(taskDifferences(text, bad).length, `[${bad.slice(0, 20)}]`);
  assert.ok(taskDifferences('<broken', registered)[0].includes('this command wrote'));
});

/** A host over a real folder for the private task-file folder, a made-up disk for access lists, and fake tools. */
function fakeHost(dir: string, over: { disk?: Record<string, string>; icacls?: string; query?: string; queryStatus?: number; deleteStatus?: number; asked?: string[] } = {}): SystemHost & { log: string } {
  const bin = join(dir, 'bin');
  mkdirSync(bin, { recursive: true });
  const log = join(dir, 'calls');
  const base = join(dir, 'ProgramData');
  mkdirSync(base, { recursive: true });
  writeFileSync(join(bin, 'icacls'), `#!/bin/sh\necho "icacls $@" >> ${log}\n${over.icacls ?? ''}\nexit 0\n`);
  writeFileSync(join(bin, 'schtasks'), [
    '#!/bin/sh',
    `echo "schtasks $@" >> ${log}`,
    // On /Create keep a copy of the file it was given, and where it was.
    `if [ "$1" = "/Create" ]; then cp "$5" ${join(dir, 'created.xml')}; echo "$5" > ${join(dir, 'created.path')}; fi`,
    `if [ "$1" = "/Query" ]; then ${over.query !== undefined ? `cat ${join(dir, 'query.xml')}; exit ${over.queryStatus ?? 0}` : 'exit 1'}; fi`,
    `if [ "$1" = "/Delete" ]; then exit ${over.deleteStatus ?? 0}; fi`,
    'exit 0', '',
  ].join('\n'));
  if (over.query !== undefined) writeFileSync(join(dir, 'query.xml'), over.query);
  for (const t of ['icacls', 'schtasks']) chmodSync(join(bin, t), 0o755);
  const disk = over.disk ?? {};
  const probe: AclProbe = (path, depth) => {
    over.asked?.push(`${path} [${depth}]`);
    // Whatever is under the folder for the task file (and the temp folders above it) is administrator-only; the rest comes from the disk.
    const sddl = disk[key(path)] ?? (path.startsWith(dir) || dir.startsWith(path) ? ADMIN_ONLY : undefined);
    if (sddl === undefined) throw new Error(`no such path ${path}`);
    return [{ path, sddl }];
  };
  return { probe, tool: (name) => join(bin, name), cwd: undefined, env: { ...process.env, PATH: '/usr/bin:/bin' }, baseDir: base, log };
}
const tmp = () => mkdtempSync(join(tmpdir(), 'tabularius-system-task-'));

test('the task file is written in a folder only administrators can use, after its access list is set and checked', { skip: process.platform === 'win32' }, () => {
  const dir = tmp();
  try {
    const asked: string[] = [];
    const host = fakeHost(dir, { asked });
    const staged = stageSystemTaskXml(Buffer.from('<Task/>'), host);
    const prefix = join(dir, 'ProgramData', 'tabularius-task-');
    assert.ok(staged.path.startsWith(prefix), staged.path);
    assert.match(staged.path.slice(prefix.length), /^[0-9a-f]{24}[\\/]task\.xml$/, 'a name nobody can guess');
    assert.equal(readFileSync(staged.path, 'utf8'), '<Task/>');
    const calls = readFileSync(host.log, 'utf8');
    assert.match(calls, /^icacls .*tabularius-task-[0-9a-f]{24} \/inheritance:r \/grant:r \*S-1-5-18:\(OI\)\(CI\)F \*S-1-5-32-544:\(OI\)\(CI\)F$/m, 'inheritance removed, only the system and administrators granted');
    const folder = staged.path.replace(/[\\/]task\.xml$/, '');
    assert.ok(asked.includes(`${folder} [tree]`), 'the folder\'s access list was read after icacls');
    assert.ok(asked.includes(`${staged.path} [self]`), 'and the file\'s');
    staged.remove();
    assert.equal(existsSync(folder), false, 'removed once registered');
    assert.deepEqual(readdirSync(join(dir, 'ProgramData')), []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('the task file is not written when its folder could not be made private', { skip: process.platform === 'win32' }, () => {
  const dir = tmp();
  try {
    const base = join(dir, 'ProgramData');
    const left = () => assert.deepEqual(readdirSync(base), [], 'the folder was removed and no file is left');
    // icacls fails.
    let host = fakeHost(dir, { icacls: 'echo "Access is denied." >&2; exit 5' });
    assert.throws(() => stageSystemTaskXml(Buffer.from('x'), host), /could not make a folder only administrators can use[^]*Access is denied/);
    left();
    // icacls is missing.
    host = fakeHost(dir);
    host.tool = () => join(dir, 'bin', 'nonexistent');
    assert.throws(() => stageSystemTaskXml(Buffer.from('x'), host), /could not make a folder/);
    left();
    // The access list read back is not administrator-only: Users can write (and the owner is not an administrator either).
    host = fakeHost(dir);
    const probe = host.probe;
    host.probe = (p, d) => (/tabularius-task-[0-9a-f]+$/.test(p) ? [{ path: p, sddl: `O:${USER_SID}D:PAI(A;OICI;FA;;;SY)(A;OICI;FA;;;BU)` }] : probe(p, d));
    assert.throws(() => stageSystemTaskXml(Buffer.from('x'), host), /the folder the task file is written in[^]*Users \(BU\)/);
    left();
    // Something is already in the folder when it is checked (it was put there before the access list was set).
    host = fakeHost(dir, { icacls: 'touch "$1/planted"' });
    assert.throws(() => stageSystemTaskXml(Buffer.from('x'), host), /found something in the new folder/);
    left();
    // The base folder can be replaced by Users, so the private folder could be swapped out from above.
    host = fakeHost(dir, { disk: { [key(base)]: 'O:BAD:(A;;FA;;;BA)(A;;0x40;;;BU)' } });
    assert.throws(() => stageSystemTaskXml(Buffer.from('x'), host), /folders above it[^]*Users \(BU\)/);
    left();
    // The ACLs cannot be read.
    host = fakeHost(dir);
    host.probe = () => { throw new Error('PowerShell exited with 1'); };
    assert.throws(() => stageSystemTaskXml(Buffer.from('x'), host), /could not check[^]*PowerShell exited with 1/);
    left();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ----- installService -----------------------------------------------------------------------------------------------------

test('installService registers the system task from the private folder, checks what was registered, and only then starts it', { skip: process.platform === 'win32' }, () => {
  const dir = tmp();
  try {
    const home = join(dir, 'home');
    mkdirSync(home);
    const o = options({ folder: join(dir, 'data'), home });
    const host = fakeHost(dir, { disk: stockDisk(), query: registeredFrom(serviceFile(o).text) });
    // An earlier file in the user's own folder (the old location) is not what is registered.
    writeFileSync(join(home, 'openhbam-task.xml'), 'user wrote this');
    installService(o, host);
    const calls = readFileSync(host.log, 'utf8').trim().split('\n');
    const at = (prefix: string) => calls.findIndex((c) => c.startsWith(prefix));
    assert.ok(at('schtasks /End') >= 0 && at('schtasks /End') < at('icacls'), calls.join('\n'));
    assert.ok(at('icacls') < at('schtasks /Create') && at('schtasks /Create') < at('schtasks /Query') && at('schtasks /Query') < at('schtasks /Run'), calls.join('\n'));
    const createdFrom = readFileSync(join(dir, 'created.path'), 'utf8').trim();
    assert.ok(createdFrom.startsWith(join(dir, 'ProgramData', 'tabularius-task-')), `registered from ${createdFrom}, not from the user's folder`);
    assert.equal(readFileSync(join(home, 'openhbam-task.xml'), 'utf8'), 'user wrote this', 'the user-writable copy is neither used nor changed');
    assert.equal(existsSync(createdFrom), false, 'the staged copy is gone');
    assert.equal(readFileSync(join(dir, 'created.xml')).subarray(0, 2).toString('hex'), 'fffe', 'UTF-16 with a byte order mark');
    assert.equal(existsSync(join(home, 'service.json')), true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('installService deletes the task and does not start it when what Windows registered differs, or cannot be read back', { skip: process.platform === 'win32' }, () => {
  for (const [name, query, status] of [
    ['a different program', registeredFrom(systemXml()).replace(/<Command>[^<]*<\/Command>/, '<Command>C:\\Users\\jo\\evil.exe</Command>'), 0],
    ['a trigger that starts at once', registeredFrom(systemXml()).replace('<Triggers>', '<Triggers><RegistrationTrigger/>'), 0],
    ['garbage', 'not xml', 0],
    ['a failed query', '', 1],
  ] as const) {
    const dir = tmp();
    try {
      const home = join(dir, 'home');
      mkdirSync(home);
      const o = options({ folder: join(dir, 'data'), home });
      const host = fakeHost(dir, { disk: stockDisk(), query, queryStatus: status });
      assert.throws(() => installService(o, host), /registered is not the one this command wrote[^]*deleted and not started/, name);
      const calls = readFileSync(host.log, 'utf8');
      assert.match(calls, /^schtasks \/Delete \/TN openhbam \/F$/m, name);
      assert.doesNotMatch(calls, /\/Run/, `${name}: not started`);
      assert.equal(existsSync(join(home, 'service.json')), false, `${name}: nothing recorded`);
      assert.deepEqual(readdirSync(join(dir, 'ProgramData')), [], `${name}: the staged folder is removed`);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
});

test('installService says plainly when the task that differs could not be deleted either', { skip: process.platform === 'win32' }, () => {
  const dir = tmp();
  try {
    const home = join(dir, 'home');
    mkdirSync(home);
    const o = options({ folder: join(dir, 'data'), home });
    const host = fakeHost(dir, { disk: stockDisk(), query: registeredFrom(systemXml()).replace(/<Command>[^<]*<\/Command>/, '<Command>C:\\evil.exe</Command>'), deleteStatus: 1 });
    assert.throws(() => installService(o, host), (e: Error) => {
      assert.match(e.message, /could not be deleted/);
      assert.match(e.message, /still registered/);
      assert.doesNotMatch(e.message, /was deleted and not started/);
      assert.match(e.message, /schtasks \/Delete \/TN openhbam \/F/);
      assert.match(e.message, /not started/);
      return true;
    });
    assert.doesNotMatch(readFileSync(host.log, 'utf8'), /\/Run/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('installService writes and registers nothing when the system task would run writable code', { skip: process.platform === 'win32' }, () => {
  const dir = tmp();
  try {
    const home = join(dir, 'home');
    mkdirSync(home);
    const o = options({ folder: join(dir, 'data'), home });
    const unsafe = fakeHost(dir, { disk: stockDisk({ 'c:\\program files\\tabularius\\app': USER_OWNED }) });
    assert.throws(() => installService(o, unsafe), /system account/);
    assert.equal(existsSync(join(home, 'service.json')), false);
    assert.equal(existsSync(join(home, 'openhbam-task.xml')), false);
    assert.equal(existsSync(unsafe.log), false, 'no task was created, started or even asked about');
    assert.deepEqual(readdirSync(join(dir, 'ProgramData')), [], 'no folder was made for the task file');
    assert.equal(existsSync(join(dir, 'data')), false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a task for the logged-in user keeps its file in the user\'s folder and checks nothing', { skip: process.platform === 'win32' }, () => {
  const dir = tmp();
  try {
    const home = join(dir, 'home');
    mkdirSync(home);
    const bin = join(dir, 'bin');
    mkdirSync(bin);
    writeFileSync(join(bin, 'schtasks'), '#!/bin/sh\nexit 0\n');
    chmodSync(join(bin, 'schtasks'), 0o755);
    const previousPath = process.env.PATH;
    try {
      process.env.PATH = bin;
      installService(options({ system: false, folder: join(dir, 'data'), home }), { probe: () => { throw new Error('should not be asked'); } });
    } finally {
      if (previousPath === undefined) delete process.env.PATH;
      else process.env.PATH = previousPath;
    }
    assert.equal(existsSync(join(home, 'openhbam-task.xml')), true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
