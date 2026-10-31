// Script network access is on for a file with no saved setting, and off only for a file converted from a .fmp12 and for the demo.
// Several pages still said it was off for every file until turned on. These checks keep the pages true to the store's default.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Host } from '../src/index.ts';
import { createStore } from '../../store/src/index.ts';

const root = join(import.meta.dirname, '..', '..', '..');
const read = (file: string): string => readFileSync(join(root, file), 'utf8').replace(/\s+/g, ' ');

test('a new store has script network on, and the security-defaults page says so', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-net-docs-'));
  createStore(join(dir, 'Net.openhbam.sqlite'));
  const host = new Host(dir, () => {});
  t.after(() => host.close());
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  assert.equal(host.get('Net')!.scriptNetwork, true);
  assert.equal(host.scriptNetworkOn('Net'), true);
  assert.match(read('docs/security-defaults.md'), /Network access for scripts[^|]*\| On per file, unless an administrator turns a file's switch off/);
});

test('no page still says script network is off for every file until turned on', () => {
  const stale: [string, RegExp][] = [
    ['docs/features.md', /Insert from URL \(off until the file's script network switch is on\)/],
    ['docs/privacy.md', /Script network\*\* switch in the admin console \(off until turned on\)/],
    ['docs/outbound-requests.md', /A converted file, a new file and the `tabularius demo` app all start with it off/],
    ['docs/outbound-requests.md', /it is off by default, and never on for scripts an AI app runs/],
    ['SECURITY.md', /off by default for every new or converted file/],
    ['docs/remote-connector-exposure.md', /leave each file's Script network switch off/],
  ];
  const found = stale.filter(([file, re]) => re.test(read(file))).map(([file, re]) => `${file}: ${re.source}`);
  assert.deepEqual(found, []);
});

test('the pages that give the default say a converted file and the demo start off', () => {
  for (const file of ['docs/features.md', 'docs/outbound-requests.md', 'docs/privacy.md', 'SECURITY.md']) {
    const text = read(file);
    const at = text.search(/Script network/);
    assert.ok(at >= 0, `${file} names the Script network switch`);
    assert.match(text, /converted/, `${file} says a converted file starts off`);
  }
});
