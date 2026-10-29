// Keep the package script list unique and documented in repository pages.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = join(import.meta.dirname, '../../..');

test('no npm script is listed twice in package.json', () => {
  const source = readFileSync(join(root, 'package.json'), 'utf8');
  const scriptsBlock = source.slice(source.indexOf('"scripts": {')).split('\n  }', 1)[0];
  const names = [...scriptsBlock.matchAll(/^ {4}"([^"]+)":/gm)].map((match) => match[1]);
  assert.ok(names.length > 40);
  const duplicates = [...new Set(names.filter((name, index) => names.indexOf(name) !== index))];
  assert.deepEqual(duplicates, [], 'scripts listed more than once: JSON.parse keeps only the last, so the first never runs');
});

test('every npm script is named in a page as `npm run <name>`', () => {
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { scripts: Record<string, string> };
  const pages: string[] = [];
  for (const name of ['AGENTS.md', 'README.md', 'ADMIN.md', 'CONTRIBUTING.md', 'QUICKSTART.md', 'SECURITY.md']) {
    pages.push(readFileSync(join(root, name), 'utf8'));
  }
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile() && entry.name.endsWith('.md')) pages.push(readFileSync(path, 'utf8'));
    }
  };
  visit(join(root, 'docs'));
  const pageText = pages.join('\n');
  const documented = new Set([...pageText.matchAll(/npm (?:run )?([a-z][\w:.-]*[\w])/g)].map((match) => match[1]));
  const missing = Object.keys(packageJson.scripts).filter((name) => !documented.has(name));
  assert.deepEqual(missing, [], 'scripts no page names: add a line for each to AGENTS.md');
});
