// docs/check-solution.md lists what `tabularius check-solution` and the check_solution tool find, one row for each kind of finding
// with its severity. These checks fail when the page and the code stop agreeing: a kind of finding with no row, a row for a kind
// that does not exist, or a severity the code gives that the row does not say.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..', '..');
const source = readFileSync(join(root, 'packages', 'server', 'src', 'check-solution.ts'), 'utf8');
const page = readFileSync(join(root, 'docs', 'check-solution.md'), 'utf8');

/** The kinds in `export type FindingKind = ...;`. */
const unionStart = source.indexOf('export type FindingKind =');
const KINDS = [...new Set([...source.slice(unionStart, source.indexOf(';', unionStart)).matchAll(/'([a-z][a-z-]*)'/g)].map((m) => m[1]))];

/** For each kind, the severities written as plain words next to it in `add({ kind: '...', severity: '...' ...`. */
const inCode = new Map<string, Set<string>>();
for (const m of source.matchAll(/kind: '([a-z][a-z-]*)', severity: '(error|warning|info)'/g)) {
  if (!inCode.has(m[1])) inCode.set(m[1], new Set());
  inCode.get(m[1])!.add(m[2]);
}

/** The rows of the findings tables: the kinds in the first cell and the severities in the second ("error / warning"). */
const rows: { kinds: string[]; severities: string[] }[] = [];
for (const line of page.split('\n')) {
  if (!line.startsWith('|')) continue;
  const cells = line.replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim());
  if (cells.length < 3 || !/^(error|warning|info)( \/ (error|warning|info))*$/.test(cells[1])) continue;
  rows.push({ kinds: [...cells[0].matchAll(/`([a-z][a-z-]*)`/g)].map((m) => m[1]), severities: cells[1].split(' / ') });
}

test('every kind of finding has a row in docs/check-solution.md', () => {
  assert.ok(KINDS.length >= 25, `found ${KINDS.length} kinds in check-solution.ts`);
  const documented = new Set(rows.flatMap((r) => r.kinds));
  const missing = KINDS.filter((k) => !documented.has(k));
  assert.deepEqual(missing, [], `kinds of finding no row names: add a row for each to the "What it looks for" table: ${missing.join(', ')}`);
});

test('every kind a row of docs/check-solution.md names exists', () => {
  assert.ok(rows.length >= 15, `found ${rows.length} rows`);
  const unknown = rows.flatMap((r) => r.kinds).filter((k) => !KINDS.includes(k));
  assert.deepEqual(unknown, [], `rows name kinds the code does not have: ${unknown.join(', ')}`);
});

test('the severities a row gives are the ones the code gives that kind', () => {
  // script-lint takes its severity from each linter finding, not from a word in check-solution.ts, so it has none to compare.
  const compared = KINDS.filter((k) => inCode.has(k));
  assert.ok(compared.length >= KINDS.length - 1, `compared ${compared.length} of ${KINDS.length} kinds`);
  const wrong: string[] = [];
  for (const kind of compared) {
    const row = rows.find((r) => r.kinds.includes(kind));
    if (!row) continue; // the first test reports it
    const code = [...inCode.get(kind)!].sort().join(' / ');
    const doc = [...row.severities].sort().join(' / ');
    if (code !== doc) wrong.push(`${kind}: code gives ${code}, page says ${doc}`);
  }
  assert.deepEqual(wrong, [], `severity differs between code and page:\n${wrong.join('\n')}`);
});
