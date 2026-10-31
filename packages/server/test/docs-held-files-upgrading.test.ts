// A held file now runs nothing of its own, the admin console's Files page shows it with an Approve button, and
// POST /tabularius/admin/v1/files/{name}/approve approves it. docs/upgrading.md still described the first release of the
// approval record, where the mark was informational and nothing could approve a file. These checks keep that page true.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..', '..');
const read = (file: string): string => readFileSync(join(root, file), 'utf8').replace(/\s+/g, ' ');
const paragraph = (file: string, start: string): string => {
  const p = readFileSync(join(root, file), 'utf8').split(/\n\s*\n/).find((x) => x.startsWith(start));
  assert.ok(p, `${file} has a paragraph that starts with "${start}"`);
  return p.replace(/\s+/g, ' ');
};

test('the upgrading page no longer says a held file is only a label with no way to approve it', () => {
  const stale = [
    /the admin console pages do not show it/,
    /Held files are shown in the admin API status JSON only/,
    /no control to approve a held file/,
    /the held mark is informational/,
    /while execution gates are being added/,
  ];
  const text = read('docs/upgrading.md');
  assert.deepEqual(stale.filter((re) => re.test(text)).map((re) => re.source), []);
});

test('the upgrading page says where a held file is shown, how to approve it and what it cannot do', () => {
  const p = paragraph('docs/upgrading.md', 'On the first start with file approval memory');
  for (const word of ['Files page', 'Approve', '/tabularius/admin/v1/files/{name}/approve', 'runs nothing of its own', 'security-defaults.md']) {
    assert.ok(p.includes(word), `the paragraph should mention ${word}`);
  }
});

test('the security-defaults page and ADMIN.md agree that the approve route exists', () => {
  assert.ok(read('docs/security-defaults.md').includes('/tabularius/admin/v1/files/{name}/approve'));
  assert.ok(read('ADMIN.md').includes('POST /files/{name}/approve'));
});
