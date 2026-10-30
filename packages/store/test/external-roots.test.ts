// Where externally stored container files may be read from. The base
// directories come from the .fmp12, so one that climbs out with ".." or names
// another hosted file's storage must not widen the roots.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createStore, Store } from '../src/index.ts';
import { externalRoots, SERVER_FOLDERS } from '../src/store.ts';

const folder = resolve('/srv/hosted');
const at = (...parts: string[]) => resolve(folder, ...parts);
const own = [at('RC_Data_FMS', 'Mine'), at('Files', 'Mine')];

test('fmp12-94: a base directory that leaves the file\'s own storage adds no root', () => {
  const bad = [
    // climbing out
    '../Other', 'a/../../sub', '../', '..', '..\\Other', 'Files/../../Other/', 'x/..',
    // Windows drops a trailing dot or space, so these act as ".."
    '.. ', '.. /Other', '...', 'x/. ./y', 'a/ /b',
    // plain names: another hosted file's storage, a sibling folder, or the folders that hold every file's storage
    'Other', 'Other/', 'Files/Other/', 'RC_Data_FMS/Other/', 'Files', 'RC_Data_FMS', '.', './', '/',
    // a drive
    'C:/Other', 'C:\\Other',
  ];
  for (const base of bad) {
    const roots = externalRoots(folder, 'Mine', [base]);
    for (const r of roots) assert.ok(own.some((o) => r === o || r.startsWith(o + '/') || r.startsWith(o + '\\')), `${JSON.stringify(base)} gave ${r}`);
  }
  for (const base of ['../Other', '..', 'Other', '.', 'Files', 'RC_Data_FMS', 'C:/Other']) {
    assert.ok(!externalRoots(folder, 'Mine', [base]).some((r) => r === at(base) || r === at('RC_Data_FMS') || r === at('Files') || r === folder), JSON.stringify(base));
  }
  assert.deepEqual(externalRoots(folder, 'Mine', ['../Other']), own);
  assert.deepEqual(externalRoots(folder, 'Mine', ['Other']), [at('RC_Data_FMS', 'Mine', 'Other'), at('Files', 'Mine', 'Other'), ...own]);
});

test('fmp12-94: a file\'s own storage, with or without a base directory, is still read', () => {
  assert.deepEqual(externalRoots(folder, 'Mine', []), own);
  const roots = externalRoots(folder, 'Mine', ['../Other', 'Files/Mine/', '/Docs\\Scans', 'Mine/']);
  for (const want of [at('Files', 'Mine'), at('RC_Data_FMS', 'Mine'), at('RC_Data_FMS', 'Mine', 'Docs', 'Scans'), at('Files', 'Mine', 'Docs', 'Scans'), at('RC_Data_FMS', 'Mine', 'Files', 'Mine')]) {
    assert.ok(roots.includes(want), want);
  }
  assert.ok(roots.every((r) => !r.includes('Other')), roots.join('\n'));
});

test('fmp12-94: a file named like the storage folders cannot read other files\' storage', () => {
  // Another hosted file's storage sits in <folder>/Files/Other and <folder>/RC_Data_FMS/Other. A file called Files or
  // RC_Data_FMS must not make those its own, in any spelling (a case-insensitive disk treats them as one folder).
  for (const name of ['Files', 'files', 'FILES', 'RC_Data_FMS', 'rc_data_fms', 'Rc_Data_Fms']) {
    const mine = [at('RC_Data_FMS', name), at('Files', name)];
    for (const base of ['Other', 'Other/', 'Files/Other', 'files/Other', 'RC_Data_FMS/Other', 'rc_data_fms/Other', 'Files', 'RC_Data_FMS', '.', '']) {
      for (const r of externalRoots(folder, name, [base])) {
        assert.ok(mine.some((o) => r === o || r.startsWith(o + '/') || r.startsWith(o + '\\')), `${name} with ${JSON.stringify(base)} gave ${r}`);
        for (const other of ['Other']) {
          for (const top of ['Files', 'RC_Data_FMS']) assert.notEqual(r.toLowerCase(), at(top, other).toLowerCase(), `${name} with ${JSON.stringify(base)} gave ${r}`);
        }
      }
    }
    // its own storage still works, with and without a base directory
    assert.deepEqual(externalRoots(folder, name, []), mine);
    assert.ok(externalRoots(folder, name, ['Docs']).includes(at('Files', name, 'Docs')), name);
  }
});

test('fmp12-94: a folder name ending in a dot or a space is kept when it cannot act as a parent folder', () => {
  const roots = externalRoots(folder, 'Mine', ['Acme Inc./Scans', 'Archive /2024']);
  for (const want of [at('RC_Data_FMS', 'Mine', 'Acme Inc.', 'Scans'), at('Files', 'Mine', 'Acme Inc.', 'Scans'), at('RC_Data_FMS', 'Mine', 'Archive ', '2024')]) {
    assert.ok(roots.includes(want), want);
  }
  // only a part made of dots and spaces can become "." or ".." once Windows strips it
  for (const base of ['.. ', 'a/.. /b', '. . /x', ' /x', '.../x']) {
    assert.deepEqual(externalRoots(folder, 'Mine', [base]), own, JSON.stringify(base));
  }
});

test('fmp12-94: a name that a disk may fold or shorten into the storage folders gets no folder of its own beside the file', () => {
  const holders = [at('Files'), at('RC_Data_FMS')];
  // U+017F (long s) folds to "s" on case-insensitive volumes. (RC_DAT~1, a Windows short name, has no roots: see below.)
  for (const name of ['Fileſ', 'Files.', 'Files ', 'RC_Data_FMS.', 'Fıles']) {
    const beside = at(name);
    for (const base of [`${name}/Other`, 'Other', `${name}`, `Files/${name}/Other`, '']) {
      for (const r of externalRoots(folder, name, [base])) {
        assert.ok(r !== beside && !r.startsWith(beside + '/'), `${JSON.stringify(name)} with ${JSON.stringify(base)} gave ${r}`);
        assert.ok(holders.every((h) => r !== h), r);
      }
    }
    // its own storage inside the two folders is still read
    assert.ok(externalRoots(folder, name, []).includes(at('RC_Data_FMS', name)), name);
    assert.ok(externalRoots(folder, name, [`${name}/Docs`]).every((r) => !r.startsWith(at('Other'))), name);
  }
});

test('fmp12-94: a name that is not one folder name has no roots', () => {
  // Drop-in files ".openhbam.sqlite", "..openhbam.sqlite" and "...openhbam.sqlite" are named "", "." and "..".
  for (const name of ['', '.', '..', 'a/b', '../x']) {
    for (const bases of [[], ['Other'], ['..'], ['.'], ['Files/Other'], ['x/y']]) {
      assert.deepEqual(externalRoots(folder, name, bases), [], `${JSON.stringify(name)} with ${JSON.stringify(bases)}`);
    }
  }
});

test('fmp12-94: no root is ever a folder of its own beside the hosted file, whatever the file is called', () => {
  // The server keeps its own data in folders beside the hosted files (backups, logs, exports, secrets...), and a disk can
  // read a name as another folder, so a root is only ever below RC_Data_FMS/<file> or Files/<file>.
  const names = ['Backups', 'backups', 'Logs', 'Documents', 'Exports', 'Outbox', '.openhbam-secrets', '.hidden', 'Files', 'Fileſ', 'Mine', 'Filesystem', 'Acme Inc-2_a.b', 'Café'];
  for (const name of names) {
    const inside = [at('RC_Data_FMS', name), at('Files', name)];
    for (const base of ['', name, `${name}/Docs`, 'Docs', `../${name}`, `/${name}`, `Files/${name}`, `RC_Data_FMS/${name}/x`]) {
      for (const r of externalRoots(folder, name, [base])) {
        assert.ok(inside.some((o) => r === o || r.startsWith(o + '/') || r.startsWith(o + '\\')), `${JSON.stringify(name)} with ${JSON.stringify(base)} gave ${r}`);
      }
    }
    for (const o of inside) assert.ok(externalRoots(folder, name, [name]).includes(o), `${name} keeps ${o}`);
  }
});

test('fmp12-94: a name with a ~digit (a Windows short name, ACMEIN~1) has no roots at all', () => {
  // ACMEIN~1 can be the short name of another file's RC_Data_FMS or Files folder, so even those two are not its own.
  for (const name of ['ACMEIN~1', 'RC_DAT~1', 'FILES~1', 'a~9b', 'Acme~12']) {
    for (const bases of [[], ['Other'], [name], ['Files/Other']]) {
      assert.deepEqual(externalRoots(folder, name, bases), [], `${name} with ${JSON.stringify(bases)}`);
    }
  }
  assert.ok(externalRoots(folder, 'Acme~Inc', []).length === 2, 'a tilde that is not followed by a digit is an ordinary character');
});

test('fmp12-94: what is refused is reported, so an operator can see why a container goes missing', (t) => {
  const refused: string[] = [];
  externalRoots(folder, 'Mine', ['Docs', '../Other', 'C:/Elsewhere', '.. /x', 'Acme Inc./Scans'], refused);
  assert.deepEqual(refused, ['../Other', 'C:/Elsewhere', '.. /x']);
  const named: string[] = [];
  assert.deepEqual(externalRoots(folder, '..', ['Docs'], named), []);
  assert.equal(named.length, 1);
  assert.match(named[0], /file name/);

  // The old setup: a base directory that is a folder beside the hosted file, which is no longer searched. Said with
  // both paths when the folder is there, and not for a base nobody has stored anything under.
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-external-roots-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const beside of ['Acme', 'Docs', 'mine/Docs', 'Backups']) mkdirSync(join(dir, beside), { recursive: true });
  const found: string[] = [];
  externalRoots(dir, 'Acme', ['Acme/', 'Docs/', 'Elsewhere/', 'Files/Acme/Inside', ''], found);
  const text = found.join('\n');
  assert.equal(found.length, 2, text);
  assert.ok(found[0].includes(join(dir, 'Acme')) && found[0].includes(join(dir, 'RC_Data_FMS', 'Acme', 'Acme')), found[0]);
  assert.ok(found[1].includes(join(dir, 'Docs')) && found[1].includes(join(dir, 'RC_Data_FMS', 'Acme', 'Docs')), found[1]);
  // A base whose letter case differs from the file's name leads to a folder beside the file too.
  const cased: string[] = [];
  assert.ok(!externalRoots(dir, 'Mine', ['mine/Docs'], cased).includes(join(dir, 'mine', 'Docs')));
  assert.equal(cased.length, 1, cased.join('\n'));
  assert.ok(cased[0].includes(join(dir, 'mine', 'Docs')), cased[0]);
  // Nothing there, nothing to report.
  assert.deepEqual((() => { const none: string[] = []; externalRoots(dir, 'Mine', ['mine/Nothing'], none); return none; })(), []);
  // A base that is not there is reported once, not once for the folder and once for being skipped.
  const once: string[] = [];
  externalRoots(dir, 'Mine', ['../Backups'], once);
  assert.equal(once.length, 1, once.join('\n'));
});

test('fmp12-94: opening a file with a refused name warns once, naming the file', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-external-roots-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'Odd.openhbam.sqlite');
  createStore(path);
  const warnings: string[] = [];
  t.mock.method(console, 'warn', (message: string) => { warnings.push(String(message)); });
  for (let i = 0; i < 3; i++) new Store(path, 'ACMEIN~1').close();
  const mine = warnings.filter((w) => w.includes('ACMEIN~1'));
  assert.equal(mine.length, 1, warnings.join('\n'));
  assert.match(mine[0], /container/);
});

test('fmp12-94: a folder beside the file that is no longer searched is named in one warning per file, however often it is opened', (t) => {
  const warnings: string[] = [];
  t.mock.method(console, 'warn', (message: string) => { warnings.push(String(message)); });
  const open = (where: string) => {
    const dir = mkdtempSync(join(tmpdir(), `tabularius-external-roots-${where}-`));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    const path = join(dir, 'Besides.openhbam.sqlite');
    createStore(path);
    const store = new Store(path, 'Besides');
    store.applyDesign([{ op: 'createContainerDirectory', path: 'Attachments' }]);
    store.close();
    mkdirSync(join(dir, 'Attachments'));
    new Store(path, 'Besides').close();
    return dir;
  };
  const dir = open('a');
  const mine = warnings.filter((w) => w.includes('Besides'));
  assert.equal(mine.length, 1, mine.join('\n'));
  assert.ok(mine[0].includes(join(dir, 'Attachments')) && mine[0].includes(join(dir, 'RC_Data_FMS', 'Besides', 'Attachments')), mine[0]);
  // A copy of the file at a new place (a dry run, a debug copy) does not warn again.
  open('b');
  assert.equal(warnings.filter((w) => w.includes('Besides')).length, 1, warnings.join('\n'));
});

test('fmp12-94: the warning gives move advice only where moving is safe', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-external-roots-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const bases = ['RC_Data_FMS/Payroll/', 'rc_data_fms/Payroll', 'Files/', 'Files/Other', 'RC_Data_FMS', 'Backups/', 'Logs', 'documents/', 'Exports', 'Outbox', '.openhbam-secrets', '.hidden/x', '.', './', 'Fine/Scans'];
  for (const base of bases) mkdirSync(join(dir, base), { recursive: true });
  for (const base of SERVER_FOLDERS) mkdirSync(join(dir, base), { recursive: true });
  for (const base of [...bases, ...SERVER_FOLDERS]) {
    const refused: string[] = [];
    externalRoots(dir, 'Acme', [base], refused);
    const said = refused.join('\n');
    const ordinary = base === 'Fine/Scans';
    if (ordinary) {
      assert.equal(refused.length, 1, said);
      assert.ok(said.includes(`move it to ${join(dir, 'RC_Data_FMS', 'Acme', 'Fine', 'Scans')}`), said);
    } else {
      // Named, with no place to move it to: nothing in it is this file's, and moving it would make it so.
      assert.ok(refused.length <= 1, said);
      assert.ok(!said.includes('move it to'), `${JSON.stringify(base)}: ${said}`);
      if (!['.', './'].includes(base) || refused.length) assert.ok(refused.length === 0 || said.includes('not used'), said);
    }
  }
  // The inputs that exist as folders beside the file are all named (the hosted folder itself included), none with advice.
  for (const base of ['RC_Data_FMS/Payroll/', 'Backups/', 'Logs', '.', './', 'RC_Data_FMS', 'Files/']) {
    const refused: string[] = [];
    externalRoots(dir, 'Acme', [base], refused);
    assert.equal(refused.length, 1, `${JSON.stringify(base)} is named once`);
    assert.match(refused[0], /not used/);
  }
});

test('fmp12-94: every folder server code joins onto the hosted folder is in SERVER_FOLDERS', () => {
  // Server code names its folders with a capitalized literal (join(folder, \'Backups\')): a new one must be listed so the
  // warning never advises moving container files into it.
  const src = join(import.meta.dirname, '..', '..', 'server', 'src');
  const known = new Set(SERVER_FOLDERS.map((f) => f.toLowerCase()));
  const found = new Map<string, string>();
  for (const file of readdirSync(src).filter((f) => f.endsWith('.ts'))) {
    const text = readFileSync(join(src, file), 'utf8');
    for (const match of text.matchAll(/join\((?:this\.)?(?:host\.)?(?:opts\.)?(?:folder|dir), '([A-Z][A-Za-z]+)'\)/g)) found.set(match[1], file);
  }
  assert.ok(found.size >= 4, `expected the known folders, found ${[...found.keys()].join(', ')}`);
  for (const [name, file] of found) assert.ok(known.has(name.toLowerCase()), `${file} makes a folder ${name} in the hosted folder: add it to SERVER_FOLDERS in store.ts`);
});
