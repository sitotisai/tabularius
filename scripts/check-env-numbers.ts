/**
 * Build-failing guard against raw Number(process.env.NAME) reads outside the settings helpers.
 * The reviewed allow-list records today's reads and may only shrink; entries cannot be added.
 * Never reads fixtures or user data. `npm run check:env-numbers`; test: packages/server/test/env-number-guard.test.ts.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

export interface Finding { file: string; line: number; name: string }
export interface Allowance { file: string; name: string; reason: string }
const listPath = (root: string) => join(root, 'scripts/check-env-numbers-allowlist.json');
function unwrap(n: ts.Expression): ts.Expression {
  while (ts.isParenthesizedExpression(n) || ts.isAsExpression(n) || ts.isTypeAssertionExpression(n) || ts.isNonNullExpression(n)) n = n.expression;
  return n;
}
function isCoalesce(n: ts.BinaryExpression): boolean {
  switch (n.operatorToken.kind) {
    case ts.SyntaxKind.QuestionQuestionToken: return true;
    default: return false;
  }
}
function readName(n: ts.Expression): string | undefined {
  n = unwrap(n);
  if (ts.isBinaryExpression(n) && isCoalesce(n)) n = unwrap(n.left);
  if (ts.isPropertyAccessExpression(n) && ts.isPropertyAccessExpression(n.expression) && ts.isIdentifier(n.expression.expression) && n.expression.expression.text === 'process' && n.expression.name.text === 'env') return n.name.text;
  if (ts.isElementAccessExpression(n) && n.argumentExpression && ts.isStringLiteral(n.argumentExpression) && ts.isPropertyAccessExpression(n.expression) && ts.isIdentifier(n.expression.expression) && n.expression.expression.text === 'process' && n.expression.name.text === 'env') return n.argumentExpression.text;
  return undefined;
}

export function scanSource(file: string, source: string): Finding[] {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const findings: Finding[] = [];
  function walk(n: ts.Node): void {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'Number' && n.arguments.length) {
      const name = readName(n.arguments[0]);
      if (name) findings.push({ file, line: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1, name });
    }
    ts.forEachChild(n, walk);
  }
  walk(sf);
  return findings;
}

export function checkRepository(root = resolve(import.meta.dirname, '..'), allowances = JSON.parse(readFileSync(listPath(root), 'utf8')) as Allowance[]): { files: number; findings: Finding[]; allowed: number; stale: Allowance[] } {
  const all: Finding[] = [];
  let files = 0;
  function walk(dir: string): void {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (/^(?:fixtures|corpus|node_modules|\.git|\.github)$/i.test(e.name)) continue;
      const path = join(dir, e.name);
      if (e.isDirectory()) walk(path);
      else if (e.isFile() && /\.(?:ts|mts|cts|js|mjs|cjs)$/.test(e.name)) {
        const file = relative(root, path).replaceAll('\\', '/');
        files++;
        if (file !== 'packages/store/src/settings.ts') all.push(...scanSource(file, readFileSync(path, 'utf8')));
      }
    }
  }
  for (const p of readdirSync(join(root, 'packages'), { withFileTypes: true })) if (p.isDirectory()) walk(join(root, 'packages', p.name, 'src'));
  walk(join(root, 'scripts'));
  const key = (x: Pick<Finding, 'file' | 'name'>) => JSON.stringify([x.file, x.name]);
  const counts = new Map<string, number>();
  for (const f of all) counts.set(key(f), (counts.get(key(f)) ?? 0) + 1);
  const allowCounts = new Map<string, number>();
  for (const a of allowances) allowCounts.set(key(a), (allowCounts.get(key(a)) ?? 0) + 1);
  const findings = all.filter((f) => !allowCounts.has(key(f)) || !allowances.find((a) => key(a) === key(f))?.reason?.trim());
  const stale = allowances.filter((a) => !counts.has(key(a)) || (allowCounts.get(key(a)) ?? 0) > 1 || !a.reason?.trim());
  return { files, findings, allowed: all.length - findings.length, stale };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const r = checkRepository();
  for (const f of r.findings) console.error(`${f.file}:${f.line}: raw Number(process.env.${f.name}); use the settings helpers`);
  for (const a of r.stale) console.error(`${a.file}: stale allow-list entry: ${a.name} (the read is gone; delete the entry)`);
  console.log(`${r.files} files; ${r.findings.length} findings; ${r.allowed} allowed reads; ${r.stale.length} stale entries`);
  process.exitCode = r.findings.length || r.stale.length ? 1 : 0;
}
