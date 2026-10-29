// Disposable budget workloads; --quick uses tiny generated stores for smoke tests.
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStore, parseDelimited, Store } from '../packages/store/src/index.ts';
import { applyImport, planImport, type Cell } from '../packages/server/src/import-mapping.ts';
import { backupFolder, restoreBackup } from '../packages/server/src/backup.ts';
import type { PerformanceMeasure } from './bench-check-lib.ts';

if (process.argv.slice(2).some((arg) => arg !== '--quick')) throw new Error('usage: bench-budgets.ts [--quick]');
const quick = process.argv.includes('--quick');
const records = quick ? 100 : 200_000;
const importRows = quick ? 10 : 100_000;
const coldRows = quick ? 64 : 131_072;
const payloadBytes = quick ? 1024 : 8192; // 1 GiB of generated payload in full mode.
const dir = mkdtempSync(join(tmpdir(), 'tabularius-budgets-'));
const measures: PerformanceMeasure[] = [];
const timed = async (id: PerformanceMeasure['id'], fn: () => void | Promise<void>) => {
  const start = performance.now();
  await fn();
  measures.push({ id, ms: performance.now() - start });
};

try {
  const path = join(dir, 'Budget.openhbam.sqlite');
  createStore(path);
  const store = new Store(path, 'Budget');
  store.applyDesign([
    { op: 'createTable', name: 'Entries', fields: [{ name: 'Id', type: 'number' }, { name: 'Notes' }] },
    { op: 'createTable', name: 'Imported', fields: [{ name: 'Id', type: 'number' }, { name: 'Name' }] },
  ]);
  store.close();
  const sql = new DatabaseSync(path);
  try {
    sql.exec('BEGIN');
    const insert = sql.prepare('INSERT INTO Entries (Id, Notes) VALUES (?, ?)');
    for (let i = 1; i <= records; i++) insert.run(i, i % 10 === 0 ? `warranty order ${i}` : `ordinary order ${i}`);
    sql.exec('COMMIT');
  } finally { sql.close(); }

  const opened = new Store(path, 'Budget');
  try {
    await timed('find', () => {
      const result = opened.find('Entries', { query: [{ Notes: 'warranty' }], limit: 50, layoutOnly: true });
      if (result.foundCount !== records / 10) throw new Error('text find returned unexpected count');
    });
    const lines = ['Id,Name'];
    for (let i = 1; i <= importRows; i++) lines.push(`${i},Generated ${i}`);
    const csv = lines.join('\r\n');
    await timed('import', async () => {
      const cells: Cell[][] = parseDelimited(csv, ',');
      const plan = await planImport(opened, 'Imported', cells);
      const result = applyImport(opened, 'Imported', cells, { headerRow: plan.headerRow, columns: plan.columns, keys: [] }, { account: 'Admin' });
      if (result.imported !== importRows) throw new Error('CSV import returned unexpected count');
    });
  } finally { opened.close(); }

  const restored = join(dir, 'restored');
  mkdirSync(restored);
  await timed('backupRestore', async () => {
    const set = (await backupFolder(dir, join(dir, 'backups'), 7, undefined)).dir;
    const files = await restoreBackup(restored, set, undefined, undefined);
    if (files.length !== 1) throw new Error('backup restore returned unexpected files');
    const copy = new Store(join(restored, 'Budget.openhbam.sqlite'), 'Budget');
    try {
      if (copy.find('Entries', { limit: 1 }).foundCount !== records || copy.find('Imported', { limit: 1 }).foundCount !== importRows) throw new Error('restored counts differ');
    } finally { copy.close(); }
  });

  const coldPath = join(dir, 'Cold.openhbam.sqlite');
  createStore(coldPath);
  const cold = new Store(coldPath, 'Cold');
  cold.applyDesign([{ op: 'createTable', name: 'Payloads', fields: [{ name: 'Id', type: 'number' }, { name: 'Payload' }] }]);
  cold.close();
  const db = new DatabaseSync(coldPath);
  try {
    db.exec('BEGIN');
    const insert = db.prepare('INSERT INTO Payloads (Id, Payload) VALUES (?, ?)');
    const payload = 'x'.repeat(payloadBytes);
    for (let i = 1; i <= coldRows; i++) insert.run(i, payload);
    db.exec('COMMIT');
  } finally { db.close(); }
  const coldBytes = statSync(coldPath).size;
  if (coldBytes < coldRows * payloadBytes) throw new Error('cold store is smaller than the generated payload');
  const coldStart = performance.now();
  const worker = spawnSync(process.execPath, ['--no-warnings', fileURLToPath(new URL('./bench-budget-worker.ts', import.meta.url)), coldPath, String(coldRows)],
    { encoding: 'utf8', maxBuffer: 1024 * 1024, timeout: 120_000 });
  if (worker.error) throw worker.error;
  if (worker.status !== 0) throw new Error(`cold start failed (${worker.status}): ${worker.stderr}`);
  const coldMs = performance.now() - coldStart;
  const workerMs = (JSON.parse(worker.stdout) as { ms: number }).ms;
  if (!Number.isFinite(workerMs) || workerMs <= 0 || workerMs > coldMs) throw new Error('cold worker returned invalid timing');
  measures.push({ id: 'coldStart', ms: coldMs });
  console.log(JSON.stringify({ config: { records, importRows, coldRows, payloadBytes }, coldBytes, measures }));
} finally { rmSync(dir, { recursive: true, force: true }); }
