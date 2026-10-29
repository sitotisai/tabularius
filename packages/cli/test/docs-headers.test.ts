// Custom request and response headers used by the code are named in the docs,
// and every documented custom header still has a use in the code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..', '..');

/** Every file under `dir` (relative to the repository), skipping dependencies and dot folders. */
function files(dir: string, keep: (path: string) => boolean, out: string[] = []): string[] {
  for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files(path, keep, out);
    else if (keep(path)) out.push(path);
  }
  return out;
}

const codeFiles = [
  ...files('packages', (p) => /[\\/]src[\\/].+\.(ts|js|mjs|cjs|html)$/.test(p)),
  ...files('scripts', (p) => /\.(ts|js|mjs|cjs)$/.test(p)),
];
const pageFiles = ['README.md', 'ADMIN.md', 'SECURITY.md', 'QUICKSTART.md', 'CONTRIBUTING.md', ...files('docs', (p) => p.endsWith('.md'))]
  .filter((p) => existsSync(join(root, p)));
const headerNames = (source: string): Set<string> => new Set([...source.matchAll(/(?<![\w/-])x-tabularius-[a-z0-9]+(?:-[a-z0-9]+)*/gi)].map((m) => m[0].toLowerCase()));
const codeHeaders = headerNames(codeFiles.map((p) => readFileSync(join(root, p), 'utf8')).join('\n'));
const pageHeaders = headerNames(pageFiles.map((p) => readFileSync(join(root, p), 'utf8')).join('\n'));
const locations = (names: Set<string>, paths: string[]) => [...names].sort().map((name) => {
  const found = paths.filter((p) => headerNames(readFileSync(join(root, p), 'utf8')).has(name));
  return `${name} (${found.join(', ')})`;
});

test('every custom header the code uses is named in a page', () => {
  assert.ok(codeHeaders.size >= 20);
  const missing = [...codeHeaders].filter((name) => !pageHeaders.has(name));
  assert.deepEqual(missing.map((name) => locations(new Set([name]), codeFiles)[0]), [], 'headers the code uses that no page names: describe each where the feature is documented');
});

test('every custom header named in a page is used by the code', () => {
  assert.ok(pageHeaders.size >= 15);
  const stale = [...pageHeaders].filter((name) => !codeHeaders.has(name));
  assert.deepEqual(stale.map((name) => locations(new Set([name]), pageFiles)[0]), [], 'headers pages name that the code does not use');
});
