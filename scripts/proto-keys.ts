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
const ABSENT_TESTS = new Set(['===', '==']);
const ASSIGNS = new Set(['=']);

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
/** What a first use puts in: an object literal, or `new Object()`. */
const emptyObject = (e: ts.Expression): boolean => {
  const x = skipParens(e);
  return ts.isObjectLiteralExpression(x) || (ts.isNewExpression(x) && ts.isIdentifier(x.expression) && x.expression.text === 'Object');
};

const SAFE_INIT = /Object\.create\(null\)|\bownKeyed\b/;
const functionLike = (n: ts.Node): boolean => ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n) || ts.isMethodDeclaration(n) || ts.isGetAccessorDeclaration(n) || ts.isSetAccessorDeclaration(n);

/**
 * Whether the object being indexed is a map without a prototype: made with Object.create(null) or ownKeyed where it is
 * declared or assigned. Only the function the write is in and the scopes around it are read, and a property only of the class
 * the write is in, by name: coarse, but another function's or class's map of the same name does not make this one safe.
 */
function withoutPrototype(target: ts.Expression, at: ts.Node, sf: ts.SourceFile): boolean {
  const e = skipParens(target);
  if (ts.isBinaryExpression(e) && ['=', '??=', '||='].includes(e.operatorToken.getText(sf))) return SAFE_INIT.test(e.right.getText(sf));
  const name = ts.isIdentifier(e) ? e.text : ts.isPropertyAccessExpression(e) ? e.name.text : undefined;
  if (!name) return false;
  const chain = new Set<ts.Node>();
  for (let n: ts.Node | undefined = at; n; n = n.parent) chain.add(n);
  const names = (n: ts.Expression): boolean => { const x = skipParens(n); return (ts.isIdentifier(x) && x.text === name) || (ts.isPropertyAccessExpression(x) && x.name.text === name); };
  let safe = false;
  const look = (n: ts.Node) => {
    if (functionLike(n) && !chain.has(n)) return;
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === name && n.initializer && SAFE_INIT.test(n.initializer.getText(sf))) safe = true;
    if (ts.isPropertyDeclaration(n) && chain.has(n.parent) && ts.isIdentifier(n.name) && n.name.text === name && n.initializer && SAFE_INIT.test(n.initializer.getText(sf))) safe = true;
    if (ts.isBinaryExpression(n) && ['=', '??='].includes(n.operatorToken.getText(sf)) && names(n.left) && SAFE_INIT.test(n.right.getText(sf))) safe = true;
    if (!safe) ts.forEachChild(n, look);
  };
  look(sf);
  return safe;
}

/** The expression a branch runs, when it is just one: `{ x = 1; }` and `x = 1;` both. */
function soleExpression(s: ts.Statement): ts.Expression | undefined {
  const only = ts.isBlock(s) ? (s.statements.length === 1 ? s.statements[0] : undefined) : s;
  return only && ts.isExpressionStatement(only) ? only.expression : undefined;
}

export function collectKeyedEntries(root = resolve(import.meta.dirname, '..'), overrides = new Map<string, string>()): KeyedWriteFinding[] {
  const findings: KeyedWriteFinding[] = [];
  for (const file of sourceFiles(root)) {
    const rel = relative(root, file).replaceAll('\\', '/');
    const sf = ts.createSourceFile(file, overrides.get(rel) ?? readFileSync(file, 'utf8'), ts.ScriptTarget.ESNext, true);
    const add = (node: ts.Node) => findings.push({ file: rel, line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, fn: functionName(node), kind: KIND, hash: digest(node.getText(sf)) });
    const same = (a: ts.Node, b: ts.Node) => a.getText(sf) === b.getText(sf);
    // Reports `node` when `target` is a map indexed by a variable and not a map without a prototype.
    const report = (node: ts.Node, target: ts.Expression) => {
      const t = skipParens(target);
      if (keyedAccess(t) && !withoutPrototype(t.expression, node, sf)) add(node);
    };
    const visit = (node: ts.Node) => {
      if (ts.isBinaryExpression(node)) {
        // The operator as written, so the comparisons below are of plain text.
        const op = node.operatorToken.getText(sf);
        const right = skipParens(node.right);
        // map[name] ??= {}   map[name] ||= {}
        if (FIRST_USE_ASSIGNMENTS.has(op) && emptyObject(right)) report(node, node.left);
        // map[name] = map[name] ?? {}   map[name] = map[name] || {}
        else if (op === '=' && ts.isBinaryExpression(right) && FIRST_USE_OPERATORS.has(right.operatorToken.getText(sf)) && emptyObject(right.right) && same(right.left, node.left)) report(node, node.left);
        // map[name] ?? (map[name] = {})   map[name] || (map[name] = {})
        else if (FIRST_USE_OPERATORS.has(op) && ts.isBinaryExpression(right) && ASSIGNS.has(right.operatorToken.getText(sf)) && emptyObject(right.right) && same(right.left, node.left)) report(node, node.left);
      }
      // if (!map[name]) map[name] = {};   if (map[name] === undefined) map[name] = {};
      if (ts.isIfStatement(node) && !node.elseStatement) {
        const test = skipParens(node.expression);
        let tested: ts.Expression | undefined;
        if (ts.isPrefixUnaryExpression(test) && test.getText(sf).startsWith('!')) tested = test.operand;
        else if (ts.isBinaryExpression(test) && ABSENT_TESTS.has(test.operatorToken.getText(sf)) && ['undefined', 'null'].includes(test.right.getText(sf))) tested = test.left;
        const then = soleExpression(node.thenStatement);
        const made = then && skipParens(then);
        if (tested && made && ts.isBinaryExpression(made) && ASSIGNS.has(made.operatorToken.getText(sf)) && emptyObject(made.right) && same(skipParens(tested), made.left)) report(node, made.left);
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

type Identity = Pick<KeyedWriteFinding, 'file' | 'fn' | 'kind' | 'hash'>;
const identity = (f: Identity) => JSON.stringify([f.file, f.fn, f.kind, f.hash]);
const tally = (list: Identity[]): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const f of list) counts.set(identity(f), (counts.get(identity(f)) ?? 0) + 1);
  return counts;
};
/** The members of `list` beyond the number `allowance` has of each identity: the second copy of a line is a different member. */
const beyond = <T extends Identity>(list: T[], allowance: Map<string, number>): T[] => {
  const seen = new Map<string, number>();
  return list.filter((f) => {
    const n = (seen.get(identity(f)) ?? 0) + 1;
    seen.set(identity(f), n);
    return n > (allowance.get(identity(f)) ?? 0);
  });
};

/**
 * An entry allows one occurrence: the same line twice in a function needs two entries, so a copy of an allowed line
 * does not pass because the first one did.
 */
export function keyedEntryErrors(found: KeyedWriteFinding[], allowed: KeyedWriteAllowance[]): string[] {
  return [
    ...beyond(found, tally(allowed)).map((f) => `${f.file}:${f.line}: an entry made on first use in a plain object keyed by a variable, in ${f.fn}; if the key can be a name from a request, a layout or a file, "__proto__" would write to Object.prototype: use Object.create(null), ownKeyed, a Map or ownEntry, or add a reasoned entry to scripts/proto-keys-allowlist.json (one entry for each occurrence)`),
    ...beyond(allowed, tally(found)).map((a) => `stale allow-list entry: ${a.file} ${a.fn} ${a.kind} ${a.hash}`),
    ...allowed.filter((a) => !a.reason?.trim()).map((a) => `allow-list entry has no reason: ${a.file} ${a.fn} ${a.kind} ${a.hash}`),
  ];
}

function main() {
  const root = resolve(import.meta.dirname, '..');
  const path = join(root, 'scripts/proto-keys-allowlist.json');
  const found = collectKeyedEntries(root);
  const allowed = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) as KeyedWriteAllowance[] : [];
  if (process.argv.includes('--write')) {
    const additions = beyond(found, tally(allowed)).map(({ file, fn, kind, hash }) => ({ file, fn, kind, hash, reason: '' }));
    writeFileSync(path, `${JSON.stringify([...allowed, ...additions], null, 2)}\n`);
    return;
  }
  const errors = keyedEntryErrors(found, allowed);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`${found.length} keyed-object entries; all allowed`);
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) main();
