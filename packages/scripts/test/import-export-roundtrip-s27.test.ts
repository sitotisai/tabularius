import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Script, ScriptStep, StepParams } from '@tabularius/fmp12';
import { createStore, Store, type FieldData } from '@tabularius/store';
import { importFileRows, runScript } from '../src/index.ts';

const stubDir = mkdtempSync(join(tmpdir(), 'tabularius-roundtrip-path-'));
const marker = join(stubDir, 'called');
const priorPath = process.env.PATH;
for (const command of ['launchctl', 'systemctl', 'sc', 'git', 'npm', 'curl', 'sudo']) {
  const path = join(stubDir, command);
  writeFileSync(path, `#!/bin/sh\nprintf '%s\\n' '${command}' >> '${marker}'\nexit 99\n`);
  chmodSync(path, 0o755);
}
process.env.PATH = stubDir;
after(() => {
  process.env.PATH = priorPath;
  assert.equal(existsSync(marker), false, 'a forbidden child process was launched');
  rmSync(stubDir, { recursive: true, force: true });
});

const FIELDS = [
  { name: 'Text', type: 'text' }, { name: 'Formula', type: 'text' },
  { name: 'Decimal', type: 'number' }, { name: 'Large', type: 'number' },
  { name: 'Day', type: 'date' }, { name: 'Clock', type: 'time' },
  { name: 'Stamp', type: 'timestamp' }, { name: 'Empty', type: 'text' },
] as const;
const ref = (name: string) => ({ tableOccurrence: { id: 0, name: 'Rows' }, field: { id: 0, name } });
const formats = [
  { format: 'COMS', file: 'rows.csv' }, { format: 'TABS', file: 'rows.tab' },
  { format: 'XLXE', file: 'rows.xlsx' }, { format: 'XML', file: 'rows.xml' },
] as const;

// Explicit, format-specific differences from the stored values. External-product compatibility is unverified.
const DIFFERENCES = {
  COMS: {
    Text: 'Delimited export writes tabs as visible \\u0009 and normalizes line breaks on import to LF.',
    Formula: 'Delimited export guards spreadsheet formula prefixes with an apostrophe; text import retains it.',
  },
  TABS: {
    Text: 'Delimited export writes tabs as visible \\u0009 and normalizes line breaks on import to LF.',
    Formula: 'Delimited export guards spreadsheet formula prefixes with an apostrophe; text import retains it.',
  },
  XLXE: {
    Text: 'Excel stores line breaks as CR when this writer serializes text.',
  },
  XML: {
    Text: 'FMPXMLRESULT import normalizes a line break in text to CR.',
  },
} as const;

function expected(format: keyof typeof DIFFERENCES, field: string, value: unknown): unknown {
  if (typeof value !== 'string') return value;
  if ((format === 'COMS' || format === 'TABS') && field === 'Text')
    return value.replace(/\t/g, '\\u0009').replace(/\r\n|[\r\n]/g, '\n');
  if ((format === 'COMS' || format === 'TABS') && field === 'Formula') return `'${value}`;
  if ((format === 'XLXE' || format === 'XML') && field === 'Text') return value.replace(/\r\n|[\r\n]/g, '\r');
  return value;
}

test('2,000 seeded rows round-trip through CSV, tab text, Excel and FMPXMLRESULT', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-roundtrip-'));
  const database = join(dir, 'Synthetic.sqlite');
  createStore(database);
  const store = new Store(database, 'Synthetic');
  try {
    store.applyDesign([{ op: 'createTable', name: 'Rows', fields: FIELDS.map(({ name, type }) => ({ name, type })) }]);
    let seed = 27;
    const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed >>> 0; };
    const texts = ['comma, quote "here"', 'line one\nline two', 'tab\there', 'café 🎉 日本語', ''];
    const prefixes = ['=', '+', '-', '@'];
    const ids: number[] = [];
    for (let i = 0; i < 2_000; i++) {
      const pick = random();
      ids.push(store.create('Rows', {
        Text: texts[pick % texts.length], Formula: `${prefixes[(pick >>> 3) % prefixes.length]}${i + 1}`,
        Decimal: String(((pick % 200_001) - 100_000) / 100), Large: String(1_000_000_000_000 + i),
        Day: `2026-10-${String(1 + (pick % 28)).padStart(2, '0')}`,
        Clock: `13:${String(pick % 60).padStart(2, '0')}:30`,
        Stamp: `2026-10-${String(1 + (pick % 28)).padStart(2, '0')} 13:45:30`, Empty: '',
      }, { performAutoEnter: false }).recordId);
    }
    const original = ids.map((id) => store.get('Rows', id).fieldData);
    for (const { format, file } of formats) {
      const exported = await runScript(store, { id: 2701, name: 'Round-trip export', steps: [{
        stepId: format === 'XLXE' ? 143 : 36, name: format === 'XLXE' ? 'Save Records as Excel' : 'Export Records', enabled: true,
        params: { filePaths: [file], exportFormat: format, exportFields: FIELDS.map(({ name }) => ref(name)) } as StepParams,
      }] as ScriptStep[] } as Script, { layout: 'Rows', foundSet: ids, documents: dir });
      assert.equal(exported.error, 0, `${format} export: ${exported.trace?.map((entry) => entry.message).join()}`);
      const bytes = readFileSync(join(dir, file));
      const parsed = importFileRows(file, bytes, format);
      assert.equal(parsed.length, ids.length, `${format} parsed row count`);
      if (format === 'XML') assert.match(bytes.toString('utf8'), /<FMPXMLRESULT\b/);
      if (format === 'COMS' || format === 'TABS') {
        assert.match(bytes.toString('utf8'), /'=\d/);
        assert.match(bytes.toString('utf8'), /'\+\d/);
        assert.match(bytes.toString('utf8'), /'-\d/);
        assert.match(bytes.toString('utf8'), /'@\d/);
      }
      const imported = await runScript(store, { id: 2702, name: 'Round-trip import', steps: [{
        stepId: 35, name: 'Import Records', enabled: true,
        params: { filePaths: [file], importFormat: format, importAction: 'add',
          fieldMapping: FIELDS.map(({ name }) => ({ field: ref(name), import: true })) } as StepParams,
      }] as ScriptStep[] } as Script, { layout: 'Rows', documents: dir });
      assert.equal(imported.error, 0, `${format} import: ${imported.trace?.map((entry) => entry.message).join()}`);
      assert.equal(imported.foundSet?.length, ids.length, `${format} imported row count`);
      for (let i = 0; i < ids.length; i++) {
        const actual: FieldData = store.get('Rows', imported.foundSet![i]).fieldData;
        for (const { name } of FIELDS) assert.equal(actual[name], expected(format, name, original[i][name]),
          `${format}, seed 27, row ${i}, field ${name}; allowance: ${DIFFERENCES[format][name as keyof typeof DIFFERENCES[typeof format]] ?? 'none'}`);
      }
    }
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
});
