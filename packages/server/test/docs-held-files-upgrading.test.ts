// docs/upgrading.md is where an administrator reads what a held file means for an upgrade. These checks keep its
// held-files paragraph true to the approval record (hosted-record.ts, host.ts) and the admin route table (admin.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..', '..');
const flat = (text: string): string => text.replace(/\s+/g, ' ');
const paragraph = (): string => {
  const p = readFileSync(join(root, 'docs/upgrading.md'), 'utf8').split(/\n\s*\n/).find((x) => x.startsWith('Held files and upgrades:'));
  assert.ok(p, 'docs/upgrading.md has a paragraph that starts with "Held files and upgrades:"');
  return flat(p);
};

test('the upgrading page states each held-file fact an upgrade depends on', () => {
  const p = paragraph();
  const phrases = [
    'POST /tabularius/admin/v1/files/{name}/approve',
    'stays hosted and readable',
    'runs nothing of its own',
    'a different file under an approved name',
    'excluded from backups',
    'a missing or damaged record holds every file',
    'A restore with a healthy record approves the restored file',
    'with no record yet every store is approved',
    'cannot be rebuilt',
    'The identity is a label',
    'edits inside an approved file are not caught',
    '(security-defaults.md)',
  ];
  assert.deepEqual(phrases.filter((x) => !p.includes(x)), []);
});

test('the route named in the upgrading page is in the admin route table and approves a held file', () => {
  const route = 'POST /tabularius/admin/v1/files/{name}/approve';
  assert.ok(paragraph().includes(route));
  const admin = flat(readFileSync(join(root, 'packages/server/src/admin.ts'), 'utf8'));
  assert.ok(admin.includes(route), 'admin.ts lists the route');
  assert.ok(admin.includes("files\\/[^/]+\\/approve$/.test(path) && req.method === 'POST'"), 'admin.ts serves it as POST');
});
