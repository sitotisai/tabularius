// Finds the shape behind the prototype-pollution findings: `(map[name] ??= {})[x] = v`, an entry made on first use in a plain
// object that is keyed by a name. When `name` is "__proto__" the entry is Object.prototype itself, so the write lands on every
// object in the process. Names of tables, fields, portals and layouts, and keys of query strings and JSON bodies, can be that.
//
// Safe ways: a map without a prototype (Object.create(null), or ownKeyed in packages/store/src/own-keys.ts), a Map, or
// ownEntry / setOwn when the plain shape has to stay. A site whose key is never a name (a number, a fixed word) is allowed with a
// reason in scripts/proto-keys-allowlist.json, as scripts/dangerous-apis-allowlist.json does for its scan.
//
//   node scripts/proto-keys.ts           check
//   node scripts/proto-keys.ts --write   add new findings to the allow-list with a blank reason, to be filled in

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { digest, functionName } from './dangerous-apis.ts';

export interface KeyedWriteFinding { file: string; line: number; fn: string; kind: string; hash: string }
export interface KeyedWriteAllowance { file: string; fn: string; kind: string; hash: string; reason: string }

const PACKAGES = ['server', 'store', 'calc', 'scripts', 'web'];
const KIND = 'keyed-object-entry';
const FIRST_USE_ASSIGNMENTS = new Set(['??=', '||=']);
const FIRST_USE_OPERATORS = new Set(['??', '||']);

const sourceFiles = (root: string): string[] => {
  const walk = (path: string): string[] => readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const file = join(path, entry.name);
    if (entry.isDirectory()) return walk(file);
    return entry.isFile() && /\.[cm]?tsx?$/.test(entry.name) && !/\.d\.[cm]?ts$/.test(entry.name) ? [file] : [];
  });
  return PACKAGES.flatMap((p) => existsSync(join(root, 'packages', p, 'src')) ? walk(join(root, 'packages', p, 'src')) : []).sort();
};

/** An index that is a fixed word or number, never a name read from somewhere. */
const fixedIndex = (e: ts.Expression): boolean => ts.isStringLiteralLike(e) || ts.isNumericLiteral(e);
const keyedAccess = (e: ts.Node): e is ts.ElementAccessExpression => ts.isElementAccessExpression(e) && !fixedIndex(e.argumentExpression);
const skipParens = (e: ts.Expression): ts.Expression => { while (ts.isParenthesizedExpression(e)) e = e.expression; return e; };
const objectLiteral = (e: ts.Expression): boolean => ts.isObjectLiteralExpression(skipParens(e));

const SAFE_INIT = /Object\.create\(null\)|\bownKeyed\b/;

/**
 * Whether the object being indexed is a map without a prototype: made with Object.create(null) or ownKeyed where it is
 * declared or assigned in the same file (found by name, which is coarse but errs toward asking for a reason).
 */
function withoutPrototype(target: ts.Expression, sf: ts.SourceFile): boolean {
  const e = skipParens(target);
  if (ts.isBinaryExpression(e) && [ts.SyntaxKind.EqualsToken, ts.SyntaxKind.QuestionQuestionEqualsToken, ts.SyntaxKind.BarBarEqualsToken].includes(e.operatorToken.kind)) return SAFE_INIT.test(e.right.getText(sf));
  const name = ts.isIdentifier(e) ? e.text : ts.isPropertyAccessExpression(e) ? e.name.text : undefined;
  if (!name) return false;
  let safe = false;
  const look = (n: ts.Node) => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === name && n.initializer && SAFE_INIT.test(n.initializer.getText(sf))) safe = true;
    if (ts.isBinaryExpression(n) && [ts.SyntaxKind.EqualsToken, ts.SyntaxKind.QuestionQuestionEqualsToken].includes(n.operatorToken.kind)) {
      const l = skipParens(n.left);
      if ((ts.isIdentifier(l) && l.text === name) || (ts.isPropertyAccessExpression(l) && l.name.text === name)) { if (SAFE_INIT.test(n.right.getText(sf))) safe = true; }
    }
    if (!safe) ts.forEachChild(n, look);
  };
  look(sf);
  return safe;
}

export function collectKeyedEntries(root = resolve(import.meta.dirname, '..'), overrides = new Map<string, string>()): KeyedWriteFinding[] {
  const findings: KeyedWriteFinding[] = [];
  for (const file of sourceFiles(root)) {
    const rel = relative(root, file);
    const sf = ts.createSourceFile(file, overrides.get(rel) ?? readFileSync(file, 'utf8'), ts.ScriptTarget.ESNext, true);
    const add = (node: ts.Node) => findings.push({ file: rel, line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, fn: functionName(node), kind: KIND, hash: digest(node.getText(sf)) });
    const visit = (node: ts.Node) => {
      if (ts.isBinaryExpression(node)) {
        // The operator as written, so the comparisons below are of plain text.
        const op = node.operatorToken.getText(sf);
        const target = skipParens(node.left);
        const sink = () => !withoutPrototype((target as ts.ElementAccessExpression).expression, sf);
        // map[name] ??= {}   map[name] ||= {}
        if (FIRST_USE_ASSIGNMENTS.has(op) && keyedAccess(target) && objectLiteral(node.right) && sink()) add(node);
        // map[name] = map[name] ?? {}   map[name] = map[name] || {}
        else if (op === '=' && keyedAccess(target) && ts.isBinaryExpression(skipParens(node.right))) {
          const r = skipParens(node.right) as ts.BinaryExpression;
          if (FIRST_USE_OPERATORS.has(r.operatorToken.getText(sf)) && objectLiteral(r.right) && r.left.getText(sf) === node.left.getText(sf) && sink()) add(node);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

const keyOf = (f: Pick<KeyedWriteFinding, 'file' | 'fn' | 'kind' | 'hash'>) => JSON.stringify([f.file, f.fn, f.kind, f.hash]);

export function keyedEntryErrors(found: KeyedWriteFinding[], allowed: KeyedWriteAllowance[]): string[] {
  const actual = new Set(found.map(keyOf));
  const expected = new Set(allowed.map(keyOf));
  return [
    ...found.filter((f) => !expected.has(keyOf(f))).map((f) => `${f.file}:${f.line}: an entry made on first use in a plain object keyed by a variable, in ${f.fn}; if the key can be a name from a request, a layout or a file, "__proto__" would write to Object.prototype: use Object.create(null), ownKeyed, a Map or ownEntry, or add a reasoned entry to scripts/proto-keys-allowlist.json`),
    ...allowed.filter((a) => !actual.has(keyOf(a))).map((a) => `stale allow-list entry: ${a.file} ${a.fn} ${a.kind} ${a.hash}`),
    ...allowed.filter((a) => !a.reason?.trim()).map((a) => `allow-list entry has no reason: ${a.file} ${a.fn} ${a.kind} ${a.hash}`),
  ];
}

function main() {
  const root = resolve(import.meta.dirname, '..');
  const path = join(root, 'scripts/proto-keys-allowlist.json');
  const found = collectKeyedEntries(root);
  const allowed = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) as KeyedWriteAllowance[] : [];
  if (process.argv.includes('--write')) {
    const have = new Set(allowed.map(keyOf));
    const additions = found.filter((f) => !have.has(keyOf(f))).map(({ file, fn, kind, hash }) => ({ file, fn, kind, hash, reason: '' }));
    writeFileSync(path, `${JSON.stringify([...allowed, ...additions], null, 2)}\n`);
    return;
  }
  const errors = keyedEntryErrors(found, allowed);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`${found.length} keyed-object entries; all allowed`);
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) main();
