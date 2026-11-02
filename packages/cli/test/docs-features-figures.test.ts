import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JS_MEMORY_MB, JS_RESULT_LIMIT, JS_TIME_LIMIT_MS } from '../../calc/src/javascript.ts';
import { MAX_UPDATE_MANY } from '../../server/src/cleanup.ts';
import { DRY_RUN_MAX_BYTES } from '../../server/src/dry-run.ts';
import { STARTER_SOLUTIONS } from '../../store/src/starter-solutions.ts';
import { root } from './docs-examples.ts';

const read = (file: string): string => readFileSync(join(root, file), 'utf8').replace(/\s+/g, ' ');
const number = (text: string): number => Number(text.replace(/[,_]/g, ''));
const sourceNumber = (file: string, pattern: RegExp): number => {
  const match = pattern.exec(readFileSync(join(root, file), 'utf8'));
  assert.ok(match, `${file} no longer matches ${pattern}`);
  return number(match[1]);
};
const words: Record<string, number> = { 'a million': 1_000_000 };
const figureNumber = (text: string): number => words[text] ?? number(text);

const FIGURES: [RegExp, () => number][] = [
  [/for up to (\d+) second and \d+ MB, returning at most a million characters/, () => JS_TIME_LIMIT_MS / 1000],
  [/for up to \d+ second and (\d+) MB, returning at most a million characters/, () => JS_MEMORY_MB],
  [/returning at most (a million) characters/, () => JS_RESULT_LIMIT],
  [/calling it in the last (\d+) days/, () => sourceNumber('packages/server/src/change-impact.ts', /const days = opts\.days \?\? (\d+);/)],
  [/update_records sets the same fields on up to ([\d,]+) records a find gives/, () => MAX_UPDATE_MANY],
  [/a loop that adds ([\d,]+) records stops by default/, () => sourceNumber('packages/scripts/src/engine.ts', /const LOOP_RECORD_LIMIT = ([\d_]+);/)],
  [/Files over (\d+) MB skip the test run/, () => DRY_RUN_MAX_BYTES / (1024 * 1024)],
];

function wrongFigures(text: string): string[] {
  const wrong: string[] = [];
  for (const [pattern, actual] of FIGURES) {
    const match = pattern.exec(text);
    if (!match) { wrong.push(`docs/features.md: no sentence matches ${pattern}; the page changed, update this table`); continue; }
    if (figureNumber(match[1]) !== actual()) wrong.push(`docs/features.md: says ${match[1]} where the code has ${actual()} (${pattern})`);
  }
  return wrong;
}

test('the figures in the features page match the code', () => {
  assert.deepEqual(wrongFigures(read('docs/features.md')), []);
});

test('the figures guard catches changed values and wording', () => {
  const page = read('docs/features.md');
  const cases = [
    ['up to 1 second and 64 MB', 'up to 2 second and 64 MB'],
    ['on up to 1,000 records', 'on up to 500 records'],
    ['Files over 200 MB skip', 'Large files skip'],
  ] as const;
  for (const [before, after] of cases) {
    assert.ok(page.includes(before), `page no longer contains ${before}`);
    const changed = page.replace(before, after);
    const wrong = wrongFigures(changed);
    assert.equal(wrong.length, 1, `${before} should produce exactly one finding`);
  }
});

test('the starter table matches the starter definitions', () => {
  const table = readFileSync(join(root, 'docs/starter-solutions.md'), 'utf8');
  const rows = [...table.matchAll(/^\| `(\w+)` \|.*$/gm)];
  const names = rows.map((row) => row[1]);
  assert.deepEqual(names, Object.keys(STARTER_SOLUTIONS));
  for (const row of rows) {
    const cells = row[0].split(/(?<!\\)\|/).slice(1, -1).map((cell) => cell.trim());
    const starter = STARTER_SOLUTIONS[row[1]];
    assert.ok(starter, `unknown starter ${row[1]}`);
    assert.deepEqual(cells[1].split(',').map((name) => name.trim()), starter.tables.map((entry) => entry.name), `${row[1]} tables`);
    const scripts = cells[2].replace(/\([^)]*\)/g, '').replace(/`/g, '').split(',').map((name) => name.trim());
    assert.deepEqual(scripts, starter.scripts.map((entry) => entry.name), `${row[1]} scripts`);
    assert.deepEqual(cells[3].replace(/`/g, '').split(',').map((name) => name.trim()), starter.reports.map((entry) => entry.name), `${row[1]} reports`);
  }
});
