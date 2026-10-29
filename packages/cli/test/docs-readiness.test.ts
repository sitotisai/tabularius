import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSite } from '../../../scripts/docs-site-lib.ts';
import type { SearchIndex } from '../../../scripts/docs-site-lib.ts';
import { sinceVersion } from '../../../scripts/docs-since.ts';
import { stepPages, pageText, indexText } from '../../../scripts/script-step-pages.ts';
import '../../../scripts/docs-site-assets/search.js';

const root = join(import.meta.dirname, '../../..');
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
let dir: string;
let index: SearchIndex;
before(() => {
  dir = mkdtempSync(join(tmpdir(), 'docs-readiness-'));
  const out = join(dir, 'site');
  const built = buildSite({ root, out, version, commit: 'offline' });
  assert.deepEqual(built.problems, []);
  index = JSON.parse(readFileSync(join(out, 'assets/search-index.js'), 'utf8').replace(/^window.TabulariusDocsIndex = /, '').replace(/;\n$/, ''));
});
after(() => rmSync(dir, { recursive: true, force: true }));

// Reader tasks and their destinations, rather than terms harvested from the index.
const queries = [
  ['sign in', 'docs/tutorials/data-api-client.html'],
  ['restore a backup', 'docs/tutorials/backup-and-restore.html'],
  ['SerialIncrement', 'docs/numbers-and-precision.html'],
  ['error 802', 'docs/error-codes.html'],
  ['import a CSV', 'docs/reference/rest.html'],
  ['https', 'docs/guides/running/hosting-and-https.html'],
  ['API token', 'docs/troubleshooting.html'],
  ['privilege set', 'docs/guides/running/accounts-and-privilege-sets.html'],
  ['run a script on a schedule', 'ADMIN.html'],
  ['container storage', 'docs/guides/building/containers.html'],
  ['plug-in', 'docs/plugin-compatibility.html'],
  ['port already in use', 'docs/troubleshooting.html'],
  ['upgrade', 'docs/reference/cli/upgrade.html'],
  ['backup keep', 'docs/reference/settings/environment/tabularius_backup_keep.html'],
  ['reset account password', 'docs/reference/script-steps/136-reset-account-password.html'],
  ['two factor authentication', 'SECURITY.html'],
  ['audit log', 'SECURITY.html'],
  ['encryption at rest', 'SECURITY.html'],
  ['webhooks', 'docs/reference/rest.html'],
  ['OData', 'docs/reference/rest.html'],
  ['ExecuteSQL', 'docs/solution-patterns.html'],
  ['relationship graph', 'docs/design-mode.html'],
  ['design mode', 'docs/design-mode.html'],
  ['value lists', 'docs/guides/building/value-lists.html'],
  ['transaction', 'docs/reference/script-steps/205-open-transaction.html'],
  ['SMTP', 'docs/reference/settings/environment/tabularius_smtp.html'],
  ['forgot admin console password', 'docs/runbook.html'],
  ['session timeout', 'docs/reference/rest.html'],
  ['install', 'ADMIN.html'],
  ['health check', 'docs/monitoring.html'],
];
for (const [query, expected] of queries) test(`search top five: ${query}`, () => {
  const engine = (globalThis as unknown as { TabulariusDocsSearch: { search(index: SearchIndex, query: string, limit: number): { page: { u: string } }[] } }).TabulariusDocsSearch;
  const urls = engine.search(index, query, 5).map((hit) => hit.page.u);
  assert.ok(urls.includes(expected), `${query}: expected ${expected}; got ${urls.join(', ')}`);
});

function checkSince(text: string): void {
  assert.match(text, new RegExp(`^---\\n(?:[\\s\\S]*?\\n)?since: ${version.replaceAll('.', '\\.')}\\n`));
  assert.ok(text.includes(`\n# `));
  assert.match(text, new RegExp(`# [^\\n]+\\n\\nSince ${version.replaceAll('.', '\\.')}\\n`));
}
test('script-step and settings pages carry the release field and a badge below the title', () => {
  for (const page of stepPages()) checkSince(pageText(page));
  checkSince(indexText());
  const manifest = JSON.parse(readFileSync(join(root, 'scripts/reference/settings-cli-metadata.json'), 'utf8'));
  const paths = ['docs/environment-variables.md', 'docs/reference/settings/serve-flags.md',
    ...Object.keys(manifest.environment).map((name) => `docs/reference/settings/environment/${name.toLowerCase()}.md`),
    ...Object.keys(manifest.serveFlags).map((name) => `docs/reference/settings/serve/${name.slice(2)}.md`)];
  for (const path of paths) checkSince(readFileSync(join(root, path), 'utf8'));
  const html = readFileSync(join(dir, 'site/docs/reference/settings/serve/port.html'), 'utf8');
  assert.match(html, /<\/h1>\n<p>Since 0\.1\.0<\/p>/);
});

test('since defaults to the package version and allows item-specific later releases', () => {
  assert.equal(sinceVersion('docs/reference/settings/serve/port.md'), version);
  const overrides = { 'later.md': '0.2.0' };
  assert.equal(sinceVersion('later.md', '0.1.0', overrides), '0.2.0');
  assert.equal(sinceVersion('other.md', '0.1.0', overrides), '0.1.0');
  assert.throws(() => sinceVersion('bad.md', 'unknown', {}), /Invalid since version/);
});

test('both generators pass their read-only drift checks twice', () => {
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  const marker = join(dir, 'unexpected-command');
  for (const name of ['launchctl', 'systemctl', 'sc', 'git', 'npm', 'curl', 'sudo']) {
    writeFileSync(join(bin, name), '#!/bin/sh\n: > "$COMMAND_MARKER"\nexit 99\n', { mode: 0o755 });
  }
  const build = spawnSync(process.execPath, ['--no-warnings', join(root, 'scripts/docs-site.ts'), '--out', join(dir, 'cli-site'), '--version', version, '--commit', 'offline'], {
    cwd: root, encoding: 'utf8', env: { ...process.env, PATH: bin, COMMAND_MARKER: marker }, timeout: 30_000,
  });
  assert.equal(build.status, 0, build.stderr);
  assert.ok(!existsSync(marker), 'an explicitly stamped build must not call git');
  for (let repeat = 0; repeat < 2; repeat++) for (const script of ['script-step-pages.ts', 'docs-settings-cli.ts']) {
    const result = spawnSync(process.execPath, ['--no-warnings', join(root, 'scripts', script), '--check'], {
      cwd: root, encoding: 'utf8', env: { ...process.env, PATH: bin, COMMAND_MARKER: marker }, timeout: 30_000,
    });
    assert.ok(!existsSync(marker), 'a generator attempted an external command');
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  }
});
