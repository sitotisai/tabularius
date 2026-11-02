import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, planImportTables, MAX_IMPORT_COLUMNS, MAX_IMPORT_ROWS, Store } from '../../store/src/index.ts';
import { MAX_ZIP_PAGES, MAX_ZIP_SHEETS, MAX_ZIP_UNPACKED_BYTES } from '../../server/src/import-sheets.ts';
import { testCommandPath } from '../../../scripts/test-command-path.ts';
import { runCli } from './cli-run.ts';
import { root, shellCommands, shellFences } from './docs-examples.ts';

const page = 'docs/moving-in-from-other-tools.md';
const readPage = (): string => readFileSync(join(root, page), 'utf8').replace(/\s+/g, ' ');
const source = (file: string, pattern: RegExp): number => {
  const m = pattern.exec(readFileSync(join(root, file), 'utf8'));
  assert.ok(m, `${file} no longer matches ${pattern}`);
  return Number(m[1].replace(/,/g, ''));
};
const main = join(root, 'packages/cli/src/main.ts');

test('the two commands the page shows run on files made here', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'moving-in-docs-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'Projects.openhbam.sqlite');
  createStore(path);
  writeFileSync(join(dir, 'Projects-Grid view.csv'), 'Name,Tasks\r\nAlpha,One\r\nBeta,Two\r\n');
  writeFileSync(join(dir, 'Tasks-Grid view.csv'), 'Name,Done\r\nOne,yes\r\nTwo,no\r\n');
  const fence = shellFences(page).find((f) => f.body.includes('import-tables'));
  assert.ok(fence, 'the page has no import-tables command fence');
  const commands = shellCommands(fence.body);
  assert.equal(commands.length, 2);
  assert.match(commands[0], /--preview$/);
  const env = testCommandPath(t);
  const run = async (command: string) => {
    const args = [...command.matchAll(/"([^"]*)"|(\S+)/g)].map((m) => m[1] ?? m[2]).slice(1)
      .map((arg) => arg === '<folder>' ? dir : arg.endsWith('.csv') ? join(dir, arg) : arg);
    return runCli(main, args, { env });
  };
  const tableNames = () => {
    const opened = new Store(path, 'Projects');
    try { return opened.schema.tables.map((table) => table.name); } finally { opened.close(); }
  };
  const preview = await run(commands[0]);
  assert.equal(preview.status, 0, preview.stderr);
  assert.deepEqual(tableNames(), []);
  const imported = await run(commands[1]);
  assert.equal(imported.status, 0, imported.stderr);
  assert.deepEqual(tableNames(), ['Projects', 'Tasks', 'Projects Tasks']);
  assert.match(imported.stdout, /Formulas are not translated/);
});

test('a column is a select or a multi only where the page\'s three conditions hold', () => {
  const kindOf = (values: string[]) => planImportTables([{ name: 'S', rows: [['C'], ...values.map((v) => [v])] }]).sheets[0].columns[0].kind;
  const spread = (rows: number, distinct: number) => Array.from({ length: rows }, (_, i) => `v${i % distinct}`);
  for (const [rows, distinct] of [[8, 4], [10, 5], [24, 12]]) assert.equal(kindOf(spread(rows, distinct)), 'select');
  for (const [rows, distinct] of [[7, 3], [10, 6], [26, 13]]) assert.equal(kindOf(spread(rows, distinct)), 'text');
  const multi = (rows: number, n: number, suffix = '') => Array.from({ length: rows }, (_, i) => `a${i % n}${suffix}, b${i % n}${suffix}`);
  assert.equal(kindOf(multi(40, 10)), 'multi');
  assert.equal(kindOf(multi(40, 11)), 'text');
  assert.equal(kindOf(multi(8, 2)), 'multi');
  assert.equal(kindOf(multi(10, 3)), 'text');
  assert.equal(kindOf(multi(8, 2, 'x'.repeat(40))), 'text');
});

test('the page says these conditions and the figures of the code', () => {
  const text = readPage();
  assert.match(text, /\*\*select\*\*: text with few different values: at least eight rows, at most 12 different values, and no more than half as many different values as rows \(ten rows need five or fewer\)\. A text field and a value list of the choices\./);
  assert.match(text, /\*\*multi\*\*: comma-separated choices from a small set: at least eight rows, at most 20 different choices of 40 characters or fewer, and no more than half as many different choices as rows\. The choices go on separate lines in one text field, with a value list\./);
  const sizes = /Size limits: at most (\d[\d,]*) rows and (\d[\d,]*) columns per sheet\. On the command line each file may be up to (\d+) MB\. In the web client one import may carry at most (\d+) files and about (\d+) MB in all, and a folder of Notion pages at most (\d+) pages\./.exec(text);
  assert.ok(sizes, 'size limits sentence is missing or has changed');
  assert.deepEqual(sizes.slice(1).map((n) => Number(n.replace(/,/g, ''))), [
    MAX_IMPORT_ROWS, MAX_IMPORT_COLUMNS,
    source('packages/cli/src/main.ts', /info\.size > (\d+) \* 1024 \* 1024\) throw new Error\(`import-tables:/),
    source('packages/server/src/import-tables-route.ts', /const MAX_FILES = (\d+);/),
    source('packages/server/src/import-tables-route.ts', /const MAX_BODY = (\d+) \* 1024 \* 1024/),
    source('packages/server/src/import-tables-route.ts', /const MAX_PAGES = (\d+);/),
  ]);
  assert.match(text, /at most 100 CSV files and 5000 pages together/);
  assert.match(text, /unpack to at most 50 MB/);
  const csvAndPages = /at most (\d+) CSV files and (\d+) pages together/.exec(text);
  const unpacked = /unpack to at most (\d+) MB/.exec(text);
  assert.ok(csvAndPages && unpacked);
  assert.deepEqual([Number(csvAndPages[1]), Number(csvAndPages[2]), Number(unpacked[1])], [MAX_ZIP_SHEETS, MAX_ZIP_PAGES, MAX_ZIP_UNPACKED_BYTES / (1024 * 1024)]);
});
