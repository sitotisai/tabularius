import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { relative, resolve, join } from 'node:path';
import ts from 'typescript';

// node:test runs `after` hooks in the order they were added (first in, first out), not last in, first out. A test that
// removes its folder in a hook added before the hook that closes the server removes the folder from under the running
// server. Entries may be removed, never added: register the close first, or remove the folder in the same hook, after it.
const removers = new Set(['rmSync', 'rm', 'rmdirSync', 'rmdir', 'unlinkSync', 'unlink']);
const closers = new Set(['close', 'stop', 'closeAll', 'shutdown', 'terminate', 'destroy', 'kill']);
const testRoots = ['packages', 'scripts'];

export interface TeardownFinding { file: string; test: string; line: number; why: string }

const testFiles = (root: string): string[] => {
  const walk = (path: string): string[] => readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) return [];
    const file = join(path, entry.name);
    if (entry.isDirectory()) return walk(file);
    return entry.isFile() && /\.test\.[cm]?ts$/.test(entry.name) ? [file] : [];
  });
  return testRoots.flatMap((dir) => {
    const path = join(root, dir);
    return existsSync(path) && statSync(path).isDirectory() ? walk(path) : [];
  }).sort();
};

const isFunction = (n: ts.Node): n is ts.ArrowFunction | ts.FunctionExpression | ts.FunctionDeclaration => ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isFunctionDeclaration(n);

/** The name of the test (or suite) a hook is registered in: the first string argument of the nearest enclosing test(), it() or describe(). */
function testName(node: ts.Node, sf: ts.SourceFile): string {
  for (let p = node.parent; p; p = p.parent) {
    if (!ts.isCallExpression(p)) continue;
    const callee = p.expression;
    const name = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) ? callee.expression.text : '';
    if (!['test', 'it', 'describe', 'suite'].includes(name)) continue;
    const title = p.arguments.find(ts.isStringLiteralLike) ?? p.arguments.find(ts.isTemplateExpression);
    return title ? title.getText(sf).slice(1, -1) : '<untitled>';
  }
  return '<module>';
}

/** Each removal and each close in a hook's code, in source order. */
function actions(hook: ts.Node): { kind: 'remove' | 'close'; pos: number }[] {
  const out: { kind: 'remove' | 'close'; pos: number }[] = [];
  const visit = (n: ts.Node) => {
    if (ts.isCallExpression(n)) {
      const callee = n.expression;
      const name = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) ? callee.name.text : '';
      if (removers.has(name)) out.push({ kind: 'remove', pos: n.getStart() });
      else if (closers.has(name) && ts.isPropertyAccessExpression(callee)) out.push({ kind: 'close', pos: n.getStart() });
    }
    ts.forEachChild(n, visit);
  };
  visit(hook);
  return out.sort((a, b) => a.pos - b.pos);
}

export function collectTeardownOrder(root = resolve(import.meta.dirname, '..'), overrides = new Map<string, string>()): TeardownFinding[] {
  const findings: TeardownFinding[] = [];
  const files = [...new Set([...testFiles(root), ...[...overrides.keys()].map((f) => join(root, f))])].sort();
  for (const path of files) {
    const rel = relative(root, path);
    const sf = ts.createSourceFile(path, overrides.get(rel) ?? readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
    // Hooks registered by the same function (a test body, or the module) run in the order they are listed here.
    type Registered = { hook: ts.Node; call: ts.CallExpression; pos: number };
    const scopes = new Map<ts.Node, Registered[]>();
    const enclosing = (n: ts.Node): ts.Node => {
      for (let p = n.parent; p; p = p.parent) if (isFunction(p)) return p;
      return sf;
    };
    const visit = (n: ts.Node) => {
      if (ts.isCallExpression(n)) {
        const callee = n.expression;
        const hooked = (ts.isIdentifier(callee) && callee.text === 'after') || (ts.isPropertyAccessExpression(callee) && callee.name.text === 'after');
        const hook = hooked ? n.arguments.find(isFunction) : undefined;
        if (hook) {
          const scope = enclosing(n);
          scopes.set(scope, [...(scopes.get(scope) ?? []), { hook, call: n, pos: n.getStart() }]);
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
    // A helper in this file that registers hooks (setup(t)) registers them where it is called.
    const helperNames = new Map<ts.Node, string>();
    sf.forEachChild(function find(n) {
      if (ts.isFunctionDeclaration(n) && n.name) helperNames.set(n, n.name.text);
      else if (ts.isVariableStatement(n)) for (const d of n.declarationList.declarations) if (ts.isIdentifier(d.name) && d.initializer && isFunction(d.initializer)) helperNames.set(d.initializer, d.name.text);
    });
    const helpers = new Map<string, Registered[]>();
    for (const [fn, name] of helperNames) if (scopes.has(fn)) helpers.set(name, scopes.get(fn)!);
    if (helpers.size) {
      const calls = (n: ts.Node) => {
        if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && helpers.has(n.expression.text)) {
          const scope = enclosing(n);
          if (!helperNames.has(scope) || helperNames.get(scope) !== n.expression.text) scopes.set(scope, [...(scopes.get(scope) ?? []), ...helpers.get(n.expression.text)!.map((h) => ({ ...h, call: n, pos: n.getStart() }))]);
        }
        ts.forEachChild(n, calls);
      };
      calls(sf);
    }
    for (const registered of scopes.values()) {
      const hooks = [...registered].sort((a, b) => a.pos - b.pos);
      const line = (n: ts.Node) => sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
      const report = (n: ts.Node, why: string) => findings.push({ file: rel, test: testName(n, sf), line: line(n), why });
      let removedAt: ts.CallExpression | undefined;
      for (const { hook, call } of hooks) {
        const acts = actions(hook);
        const firstRemove = acts.find((a) => a.kind === 'remove');
        const lastClose = [...acts].reverse().find((a) => a.kind === 'close');
        if (removedAt && lastClose) { report(removedAt, 'a hook that removes files is added before a hook that closes something, so the files go first'); break; }
        if (firstRemove && lastClose && firstRemove.pos < lastClose.pos) { report(call, 'a hook removes files before it closes something'); break; }
        if (firstRemove && !removedAt) removedAt = call;
      }
    }
  }
  return findings;
}

const key = (f: { file: string; test: string }) => `${f.file}\u0000${f.test}`;

export function allowlistErrors(found: TeardownFinding[], allowed: { file: string; test: string; reason: string }[]): string[] {
  const present = new Set(found.map(key));
  const listed = new Set<string>();
  const errors: string[] = [];
  for (const f of found) if (!allowed.some((e) => key(e) === key(f))) errors.push(`${f.file}:${f.line} "${f.test}": ${f.why}; register the close hook first (node:test runs hooks in the order they were added), or (only with a reason) add it to scripts/test-teardown-allowlist.json`);
  for (const e of allowed) {
    if (!present.has(key(e))) errors.push(`stale allow-list entry: ${e.file} "${e.test}" (it no longer removes before it closes; delete the entry)`);
    if (!e.reason?.trim()) errors.push(`allow-list entry has no reason: ${e.file} "${e.test}"`);
    if (listed.has(key(e))) errors.push(`allow-list entry listed twice: ${e.file} "${e.test}"`);
    listed.add(key(e));
  }
  return errors;
}

function main() {
  const root = resolve(import.meta.dirname, '..');
  const path = join(root, 'scripts/test-teardown-allowlist.json');
  const found = collectTeardownOrder(root);
  if (process.argv.includes('--list')) { for (const f of found) console.log(`${f.file}:${f.line} ${f.test}`); return; }
  const allowed = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) as { file: string; test: string; reason: string }[] : [];
  const errors = allowlistErrors(found, allowed);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`${found.length} tests remove files before they close; all allowed`);
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) main();
