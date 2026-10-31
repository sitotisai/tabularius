// A FileMaker plug-in is native code and is never loaded, but a plug-in written for Tabularius (JavaScript or WebAssembly) runs
// in a sandbox once an administrator turns it on for a file (docs/plugin-compatibility.md, docs/writing-a-plugin.md). README.md and
// docs/features.md said "Plug-ins are never loaded" with no exception. These checks keep the two lists of what does not carry over true.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..', '..');
const flat = (file: string): string => readFileSync(join(root, file), 'utf8').replace(/\s+/g, ' ');
const bullet = (file: string): string => {
  const text = flat(file);
  const at = text.search(/- \*\*[^*]*[Pp]lug-ins? [^*]*\*/);
  assert.ok(at >= 0, `${file} has a plug-in bullet in its list of what does not carry over`);
  const next = text.indexOf(' - **', at + 4);
  return text.slice(at, next < 0 ? undefined : next);
};

for (const [file, link] of [['README.md', '(docs/writing-a-plugin.md)'], ['docs/features.md', '(writing-a-plugin.md)']] as const) {
  test(`${file} does not say all plug-ins are never loaded`, () => {
    assert.ok(!/\*\*Plug-ins are never loaded\.\*\*/.test(flat(file)), 'say that FileMaker plug-ins are never loaded, not every plug-in');
  });

  test(`${file} names the exception: a plug-in written for Tabularius runs in a sandbox`, () => {
    const b = bullet(file);
    for (const part of ['FileMaker plug-ins are never loaded', 'built-in code', 'error 3', 'Tabularius plug-in', 'sandbox', 'administrator', link]) {
      assert.ok(b.includes(part), `the bullet should mention ${part}: ${b}`);
    }
  });
}

test('the release notes do not say all plug-ins are never loaded', () => {
  const notes = flat('.github/release-notes/v0.1.0.md');
  assert.ok(!/\*\*Plug-ins are never loaded\.\*\*/.test(notes), 'say that FileMaker plug-ins are never loaded, not every plug-in');
  assert.ok(notes.includes('FileMaker plug-ins are never loaded') && notes.includes('Tabularius plug-in') && notes.includes('sandbox'));
});

test('the plug-in compatibility page and the writing page still make the same two statements', () => {
  assert.ok(flat('docs/plugin-compatibility.md').includes('A FileMaker plug-in is native code. Tabularius never loads one.'));
  assert.match(flat('docs/plugin-compatibility.md'), /A plug-in written for Tabularius \| Runs in a sandbox, switched on per file by an administrator/);
  assert.ok(flat('docs/writing-a-plugin.md').includes('runs inside the server\'s sandbox'));
});
