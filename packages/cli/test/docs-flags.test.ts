// Every `--option` the hand-written pages show in code (inline code or a fenced block) is one the program, its scripts or its
// documented tools know. A page naming an option that nothing reads sends a reader to an error. The options of other
// programs a page runs (npm, git, tsc, Tailscale, the AI app's own command) are listed in OTHER_PROGRAMS, with the page that shows them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fences, handWrittenDocs, inlineCode, root } from './docs-examples.ts';

const OTHER_PROGRAMS = new Set<string>([
  // CSS custom properties named in docs/design-guide.md
  '--accent-hover', '--accent-soft', '--accent-text', '--faint',
  // tsc, as docs/audit-mutation.md ran it
  '--allowImportingTsExtensions', '--erasableSyntaxOnly', '--module', '--moduleResolution', '--noEmit', '--skipLibCheck', '--types', '--verbatimModuleSyntax',
  // npm and git (docs/versioning.md, CONTRIBUTING.md, docs/contributing.md)
  '--include-workspace-root', '--no-git-tag-version', '--no-verify', '--workspaces',
  // sha256sum (QUICKSTART.md, docs/release-builds.md), docker (docs/upgrading.md), claude mcp add (the connect-an-AI pages),
  // Tailscale Funnel (docs/remote-connector-exposure.md), fmcsadmin (docs/fmcsadmin-parity.md)
  '--ignore-missing', '--stop-timeout', '--transport', '--set-path', '--fqdn',
]);

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(join(root, dir), { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.') || e.name === 'test' || e.name === 'e2e') continue;
    const path = `${dir}/${e.name}`;
    if (e.isDirectory()) sourceFiles(path, out);
    else if (/\.(ts|cjs|mjs|js|sh|ps1)$/.test(e.name)) out.push(path);
  }
  return out;
}

const known = new Set<string>();
for (const dir of ['packages', 'scripts', 'packaging']) {
  for (const f of sourceFiles(dir)) for (const m of readFileSync(join(root, f), 'utf8').matchAll(/(?<![\w-])--[a-z][A-Za-z0-9-]*/g)) known.add(m[0]);
}

const flagsOf = (text: string): string[] => [...text.matchAll(/(?<![\w-])(--[a-z][A-Za-z0-9-]*)/g)].map((m) => m[1]);

test('every --option the pages show in code is one the program knows or a listed option of another program', () => {
  assert.ok(known.size > 300, `found ${known.size} options in the code; the scan stopped finding them`);
  const wrong: string[] = [];
  for (const file of handWrittenDocs()) {
    if (/^docs\/(audits|research)\//.test(file)) continue;
    const spots = [...inlineCode(file).map((c) => ({ line: c.line, text: c.text })), ...fences(file).flatMap((f) => f.body.split('\n').map((text, i) => ({ line: f.line + 1 + i, text })))];
    for (const { line, text } of spots) for (const flag of flagsOf(text)) if (!known.has(flag) && !OTHER_PROGRAMS.has(flag)) wrong.push(`${file}:${line} ${flag}`);
  }
  assert.deepEqual(wrong, [], 'options no code reads: fix the page, or list an option of another program in OTHER_PROGRAMS');
});

test('an option listed for another program is still shown on a page, and is not an option of ours', () => {
  const shown = new Set<string>();
  for (const file of handWrittenDocs()) {
    if (/^docs\/(audits|research)\//.test(file)) continue;
    for (const c of inlineCode(file)) for (const f of flagsOf(c.text)) shown.add(f);
    for (const fe of fences(file)) for (const f of flagsOf(fe.body)) shown.add(f);
  }
  assert.deepEqual([...OTHER_PROGRAMS].filter((f) => !shown.has(f)), [], 'listed but no page shows it: remove it from OTHER_PROGRAMS');
  assert.deepEqual([...OTHER_PROGRAMS].filter((f) => known.has(f)), [], 'the code reads it: remove it from OTHER_PROGRAMS');
});
