import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { relative, resolve, join } from 'node:path';
import ts from 'typescript';

// Entries may be removed, never added; a new writer imports the boundary.
const writers = new Set(['writeFileSync', 'renameSync', 'openSync', 'appendFileSync', 'copyFileSync', 'linkSync', 'createWriteStream']);
const modules = new Set(['fs', 'node:fs']);
const sourceFiles = (root: string) => ['packages/cli/src', 'packages/server/src', 'packages/store/src'].flatMap((dir) => {
  const walk = (path: string): string[] => readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const file = join(path, entry.name);
    if (entry.isDirectory()) return walk(file);
    return entry.isFile() && !['fs-boundary.ts', 'file-ops.ts'].includes(entry.name) && /\.[cm]?tsx?$/.test(entry.name) && !/\.d\.[cm]?ts$/.test(entry.name) ? [file] : [];
  });
  const path = join(root, dir);
  return existsSync(path) && statSync(path).isDirectory() ? walk(path) : [];
}).sort();

export function collectUnguardedWriters(root = resolve(import.meta.dirname, '..')): string[] {
  const findings: string[] = [];
  for (const path of sourceFiles(root)) {
    const text = readFileSync(path, 'utf8');
    const sf = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
    const localWriters = new Set<string>();
    const fsObjects = new Set<string>();
    let guarded = false;
    for (const statement of sf.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
      const mod = statement.moduleSpecifier.text;
      if (mod.endsWith('/fs-boundary.ts') || mod.endsWith('/file-ops.ts')) guarded = true;
      if (!modules.has(mod)) continue;
      const clause = statement.importClause;
      if (!clause) continue;
      if (clause.name) fsObjects.add(clause.name.text);
      if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) fsObjects.add(clause.namedBindings.name.text);
      if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) for (const el of clause.namedBindings.elements) {
        if (writers.has(el.propertyName?.text ?? el.name.text)) localWriters.add(el.name.text);
      }
    }
    let writes = false;
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node)) {
        if (ts.isIdentifier(node.expression) && localWriters.has(node.expression.text)) writes = true;
        if (ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.expression) && fsObjects.has(node.expression.expression.text) && writers.has(node.expression.name.text)) writes = true;
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
    if (writes && !guarded) findings.push(relative(root, path));
  }
  return findings.sort();
}

export function allowlistErrors(found: string[], allowed: { file: string; reason: string }[]): string[] {
  const present = new Set(found);
  const listed = new Set<string>();
  const errors: string[] = [];
  for (const file of found) if (!allowed.some((entry) => entry.file === file)) errors.push(`${file}: writes files without importing fs-boundary; import it from packages/store/src/fs-boundary.ts, or (only with a reason) add it to scripts/fs-boundary-allowlist.json`);
  for (const entry of allowed) {
    if (!present.has(entry.file)) errors.push(`stale allow-list entry: ${entry.file} (it now imports fs-boundary or no longer writes; delete the entry)`);
    if (!entry.reason?.trim()) errors.push(`allow-list entry has no reason: ${entry.file}`);
    if (listed.has(entry.file)) errors.push(`allow-list entry listed twice: ${entry.file}`);
    listed.add(entry.file);
  }
  return errors;
}

function main() {
  const root = resolve(import.meta.dirname, '..');
  const path = join(root, 'scripts/fs-boundary-allowlist.json');
  const found = collectUnguardedWriters(root);
  const allowed = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) as { file: string; reason: string }[] : [];
  const errors = allowlistErrors(found, allowed);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`${found.length} unguarded writers; all allowed`);
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) main();
