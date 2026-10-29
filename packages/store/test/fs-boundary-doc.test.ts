import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const root = join(import.meta.dirname, '../../..');
const sectionStart = '## Filesystem boundary';

export function listedModules(markdown: string): string[] {
  const start = markdown.indexOf(sectionStart);
  if (start < 0) return [];
  const end = markdown.indexOf('\n## ', start + sectionStart.length);
  const section = markdown.slice(start, end < 0 ? undefined : end);
  return [...section.matchAll(/`(packages\/[a-z]+\/src\/[A-Za-z0-9_./-]+\.ts)`/g)]
    .map((match) => match[1])
    .filter((path) => path !== 'packages/store/src/fs-boundary.ts');
}

function modulesWithoutBoundaryImport(markdown: string, sourceRoot: string): string[] {
  return listedModules(markdown).filter((modulePath) => {
    const file = join(sourceRoot, modulePath);
    return !readFileSync(file, 'utf8').match(/from '[^']*\/fs-boundary\.ts'/);
  });
}

test('threat model lists modules that import the filesystem boundary', () => {
  const markdown = readFileSync(new URL('../../../docs/threat-model.md', import.meta.url), 'utf8');
  const modules = listedModules(markdown);
  assert.ok(modules.length >= 10, 'filesystem boundary section should list at least 10 modules');
  for (const modulePath of modules) {
    const file = join(root, modulePath);
    assert.ok(existsSync(file), `${modulePath}: the threat model lists a file that does not exist`);
    assert.match(readFileSync(file, 'utf8'), /from '[^']*\/fs-boundary\.ts'/,
      `${modulePath}: the threat model lists it but it does not import fs-boundary`);
  }
});

test('every source file that imports the filesystem boundary is in the threat model', () => {
  const listed = new Set(listedModules(readFileSync(new URL('../../../docs/threat-model.md', import.meta.url), 'utf8')));
  const importers: string[] = [];
  for (const pkg of readdirSync(join(root, 'packages'), { withFileTypes: true })) {
    if (!pkg.isDirectory()) continue;
    const visit = (directory: string): void => {
      if (!existsSync(directory)) return;
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) visit(path);
        else if (entry.isFile() && entry.name.endsWith('.ts') && /from '[^']*\/fs-boundary\.ts'/.test(readFileSync(path, 'utf8'))) {
          importers.push(path.slice(root.length + 1).replaceAll('\\', '/'));
        }
      }
    };
    visit(join(root, 'packages', pkg.name, 'src'));
  }
  const missing = importers.filter((file) => file !== 'packages/store/src/fs-boundary.ts' && !listed.has(file));
  assert.deepEqual(missing, [], 'add these files to the "Filesystem boundary" section of docs/threat-model.md');
});

test('filesystem-boundary documentation checker reports a listed module without an import', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fs-boundary-doc-'));
  try {
    const importing = 'packages/store/src/with-boundary.ts';
    const missing = 'packages/store/src/without-boundary.ts';
    for (const path of [importing, missing]) mkdirSync(dirname(join(tempRoot, path)), { recursive: true });
    writeFileSync(join(tempRoot, importing), "import { openSync } from './fs-boundary.ts';\n");
    writeFileSync(join(tempRoot, missing), 'export {};\n');
    const synthetic = `## Filesystem boundary\n\n\`${importing}\`\n\`${missing}\`\n\n## Next section\n`;
    assert.deepEqual(modulesWithoutBoundaryImport(synthetic, tempRoot), [missing]);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
