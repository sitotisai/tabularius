// `service install --system` on Windows registers a boot task that runs as the system account. Everything that task starts
// (Node, the program folder, and the folders above them) must be writable only by administrators and the system, or any
// account on the machine could edit the code and have it run with more privilege than the account has.
// These tests inject the platform and the ACL probe; nothing here reads a real Windows ACL.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { installService, type ServiceOptions } from '../src/service.ts';
import { refuseWritableSystemTaskCode, writableBy, type AclProbe } from '../src/windows-acl.ts';

// Owner and groups: Administrators (BA) and the system (SY); read and execute for Users (BU).
const ADMIN_ONLY = 'O:BAD:PAI(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)(A;OICI;0x1200a9;;;BU)';
// A per-user folder: the user (a made-up SID) has full control and owns it.
const USER_SID = 'S-1-5-21-1111111111-2222222222-3333333333-1001';
const USER_OWNED = `O:${USER_SID}D:PAI(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)(A;OICI;FA;;;${USER_SID})`;

const APP = 'C:\\Program Files\\Tabularius\\app';
const NODE = 'C:\\Program Files\\Tabularius\\node\\node.exe';
const options = (over: Partial<ServiceOptions> = {}): ServiceOptions => ({
  platform: 'win32', folder: 'D:\\Data', port: 8080, host: '127.0.0.1', system: true, extra: [],
  node: NODE, main: `${APP}\\packages\\cli\\src\\main.ts`, user: 'HOST\\admin', home: 'C:\\Users\\admin\\.openhbam', ...over,
});

/** A probe over a made-up disk: a map from a lower-case path to its SDDL, and the paths asked about. */
function probeOf(disk: Record<string, string>, asked: string[] = []): AclProbe {
  return (path, recursive) => {
    asked.push(`${path}${recursive ? ' (and everything in it)' : ''}`);
    const sddl = disk[path.toLowerCase()];
    if (sddl === undefined) throw new Error(`no such path ${path}`);
    return [{ path, sddl }];
  };
}
const protectedDisk = (over: Record<string, string> = {}): Record<string, string> => ({
  'c:\\': 'O:BAD:PAI(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)(A;OICI;0x1200a9;;;BU)(A;CI;0x4;;;AU)',
  'c:\\program files': ADMIN_ONLY,
  'c:\\program files\\tabularius': ADMIN_ONLY,
  'c:\\program files\\tabularius\\app': ADMIN_ONLY,
  'c:\\program files\\tabularius\\node': ADMIN_ONLY,
  'c:\\program files\\tabularius\\node\\node.exe': ADMIN_ONLY,
  ...over,
});

test('the SDDL reader names who besides administrators and the system may write', () => {
  assert.deepEqual(writableBy(ADMIN_ONLY, 'object'), []);
  assert.deepEqual(writableBy(USER_OWNED, 'object'), [`owner ${USER_SID}`, `${USER_SID} (full control)`]);
  // Users with modify, the common "everyone may write here" grant.
  assert.deepEqual(writableBy('O:BAD:PAI(A;OICI;FA;;;BA)(A;OICI;0x1301bf;;;BU)', 'object').length, 1);
  assert.deepEqual(writableBy('O:BAD:(A;;FA;;;BA)(A;;FW;;;WD)', 'object').length, 1, 'Everyone with write');
  assert.deepEqual(writableBy('O:BAD:(A;;GA;;;AU)', 'object').length, 1, 'generic all');
  // Read, and read and execute, are fine for anyone.
  assert.deepEqual(writableBy('O:BAD:(A;;FA;;;BA)(A;;FR;;;WD)(A;;FX;;;AU)(A;;GR;;;BU)', 'object'), []);
  // An entry that only passes to children, or only denies, gives this folder nobody new.
  assert.deepEqual(writableBy('O:BAD:(A;OICIIO;FA;;;BU)(D;;FA;;;BU)(A;;FA;;;BA)', 'object'), []);
  // The Windows installer's own owner and the template owner.
  assert.deepEqual(writableBy('O:S-1-5-80-956008885-3418522649-1831038044-1853292631-2271478464D:(A;;FA;;;S-1-5-80-956008885-3418522649-1831038044-1853292631-2271478464)', 'object'), []);
  assert.equal(writableBy('O:BAD:(A;;FA;;;CO)', 'object').length, 1, 'creator owner without inherit-only is the owner, who is not an administrator here');
  // No DACL at all means everyone has full control; an unreadable string is refused rather than trusted.
  assert.equal(writableBy('O:BAG:BA', 'object').length, 1);
  assert.equal(writableBy('not an sddl', 'object').length, 1);
  assert.equal(writableBy('O:BAD:(A;;QQ;;;BU)', 'object').length, 1, 'a right the reader does not know counts as write');
  // Above the code, adding a new child (the default for Users on C:\) is harmless; removing or replacing the folder is not.
  assert.deepEqual(writableBy('O:BAD:(A;;FA;;;BA)(A;CI;0x4;;;AU)(A;;0x2;;;BU)', 'above'), []);
  assert.equal(writableBy('O:BAD:(A;;FA;;;BA)(A;;0x40;;;BU)', 'above').length, 1, 'delete child');
  assert.equal(writableBy('O:BAD:(A;;FA;;;BA)(A;;WD;;;BU)', 'above').length, 1, 'change permissions');
});

test('--system on Windows is allowed when Node, the program and everything above them are administrator-only', () => {
  const asked: string[] = [];
  refuseWritableSystemTaskCode(options(), probeOf(protectedDisk(), asked));
  assert.ok(asked.includes(`${APP} (and everything in it)`), asked.join('\n'));
  assert.ok(asked.includes('C:\\Program Files\\Tabularius\\node'), 'the folder Node loads its libraries from');
  assert.ok(asked.includes('C:\\Program Files\\Tabularius'), 'the folder above the program: it can be renamed away and replaced');
  assert.ok(asked.includes('C:\\'));
});

test('--system on Windows is refused for the default per-user layout, and says what to do', () => {
  const home = 'C:\\Users\\jo\\.openhbam';
  const disk = {
    ...protectedDisk(),
    'c:\\users': ADMIN_ONLY,
    'c:\\users\\jo': USER_OWNED,
    [`${home}`.toLowerCase()]: USER_OWNED,
    [`${home}\\app`.toLowerCase()]: USER_OWNED,
    [`${home}\\node`.toLowerCase()]: USER_OWNED,
    [`${home}\\node\\node.exe`.toLowerCase()]: USER_OWNED,
  };
  const o = options({ node: `${home}\\node\\node.exe`, main: `${home}\\app\\packages\\cli\\src\\main.ts` });
  assert.throws(() => refuseWritableSystemTaskCode(o, probeOf(disk)), (e: Error) => {
    assert.match(e.message, /--system/);
    assert.match(e.message, /system account/);
    assert.ok(e.message.includes(`${home}\\app`), e.message);
    assert.ok(e.message.includes(USER_SID), 'names who can write');
    assert.match(e.message, /without --system|Program Files/);
    return true;
  });
});

test('--system is refused when only the folder above the program, or a file inside it, can be changed by others', () => {
  const aboveOnly = protectedDisk({ 'c:\\program files\\tabularius': 'O:BAD:PAI(A;OICI;FA;;;BA)(A;;0x40;;;BU)' });
  assert.throws(() => refuseWritableSystemTaskCode(options(), probeOf(aboveOnly)), /C:\\Program Files\\Tabularius\b/);
  // A file deep inside the program folder with its own, wider ACL.
  const probe: AclProbe = (path, recursive) => path === APP && recursive
    ? [{ path: APP, sddl: ADMIN_ONLY }, { path: `${APP}\\packages\\cli\\src\\main.ts`, sddl: USER_OWNED }]
    : probeOf(protectedDisk())(path, recursive);
  assert.throws(() => refuseWritableSystemTaskCode(options(), probe), /main\.ts/);
});

test('--system is refused when a link inside the program points to a folder others can write', () => {
  const outside = 'C:\\Users\\jo\\scratch';
  const probe: AclProbe = (path, recursive) => {
    if (path === APP) return [{ path: APP, sddl: ADMIN_ONLY }, { path: `${APP}\\node_modules\\dep`, sddl: ADMIN_ONLY, link: outside }];
    if (path === outside) return [{ path: outside, sddl: USER_OWNED }];
    return probeOf(protectedDisk({ 'c:\\users': ADMIN_ONLY, 'c:\\users\\jo': ADMIN_ONLY }))(path, recursive);
  };
  assert.throws(() => refuseWritableSystemTaskCode(options(), probe), /C:\\Users\\jo\\scratch/);
  // A link that stays inside the program folder is covered by the walk of that folder.
  const inside: AclProbe = (path, recursive) => path === APP
    ? [{ path: APP, sddl: ADMIN_ONLY }, { path: `${APP}\\node_modules\\@x\\y`, sddl: ADMIN_ONLY, link: `${APP}\\packages\\y` }]
    : probeOf(protectedDisk())(path, recursive);
  refuseWritableSystemTaskCode(options(), inside);
});

test('--system is refused when the ACLs cannot be read (it fails closed)', () => {
  assert.throws(() => refuseWritableSystemTaskCode(options(), () => { throw new Error('powershell is not available'); }), /could not check[^]*powershell is not available/);
  assert.throws(() => refuseWritableSystemTaskCode(options(), probeOf({})), /could not check/);
});

test('the single-file program has no app folder to check, and a task for the logged-in user checks nothing', () => {
  const asked: string[] = [];
  refuseWritableSystemTaskCode(options({ singleFile: true, node: NODE, main: 'ignored' }), probeOf(protectedDisk(), asked));
  assert.ok(!asked.some((a) => a.includes('and everything')), 'no recursive walk of an app folder');
  const never: AclProbe = () => { throw new Error('should not be asked'); };
  refuseWritableSystemTaskCode(options({ system: false }), never);
  refuseWritableSystemTaskCode(options({ platform: 'linux', main: '/x/y/z/main.ts', node: '/usr/bin/node', folder: '/d' }), never);
});

test('installService writes and registers nothing when the system task would run writable code', { skip: process.platform === 'win32' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-system-acl-'));
  const bin = join(dir, 'bin');
  const home = join(dir, 'home');
  mkdirSync(bin);
  mkdirSync(home);
  const calls = join(dir, 'calls');
  writeFileSync(join(bin, 'schtasks'), `#!/bin/sh\necho "$@" >> ${calls}\nexit 0\n`);
  chmodSync(join(bin, 'schtasks'), 0o755);
  const previousPath = process.env.PATH;
  try {
    process.env.PATH = bin;
    const o = options({ folder: join(dir, 'data'), home });
    assert.throws(() => installService(o, probeOf({ ...protectedDisk(), 'c:\\program files\\tabularius\\app': USER_OWNED })), /system account/);
    assert.equal(existsSync(join(home, 'service.json')), false);
    assert.equal(existsSync(join(home, 'openhbam-task.xml')), false);
    assert.equal(existsSync(calls), false, 'no task was created or started');
    assert.equal(existsSync(join(dir, 'data')), false);
    installService(o, probeOf(protectedDisk()));
    assert.equal(existsSync(join(home, 'service.json')), true);
    assert.equal(existsSync(calls), true, 'the second install registered the task');
  } finally {
    if (previousPath === undefined) delete process.env.PATH;
    else process.env.PATH = previousPath;
    rmSync(dir, { recursive: true, force: true });
  }
});
