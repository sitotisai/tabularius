// A restore keeps the record-id mark of the file it replaces, so an id the file gave after the backup was taken is not given again
// to another record (ADMIN.md, "Converting a file again").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store, createStore } from '../../store/src/index.ts';
import { backupFolder, restoreBackup } from '../src/backup.ts';

const FILE = 'Items.openhbam.sqlite';

function folderWith(t: { after(fn: () => void): void }) {
  const root = mkdtempSync(join(tmpdir(), 'tabularius-restore-mark-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const folder = join(root, 'live');
  const set = join(root, 'backups');
  mkdirSync(folder);
  mkdirSync(set);
  const file = join(folder, FILE);
  createStore(file);
  const use = <T>(fn: (store: Store) => T): T => {
    const store = new Store(file);
    try { return fn(store); } finally { store.close(); }
  };
  return { folder, set, file, use };
}

test('ids given after the backup are not given again once it is restored', async (t) => {
  const { folder, set, use } = folderWith(t);
  use((s) => {
    s.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name' }] }]);
    for (const n of ['a', 'b', 'c']) s.create('Items', { Name: n });
  });
  const backup = (await backupFolder(folder, set, 0)).dir;
  const later = use((s) => {
    const ids = ['d', 'e', 'f'].map((n) => s.create('Items', { Name: n }).recordId);
    for (const id of ids) s.delete('Items', id);
    return ids;
  });
  assert.deepEqual(later, [4, 5, 6]);
  await restoreBackup(folder, backup, undefined, '');
  const again = use((s) => ({ before: (s.sql.prepare('SELECT count(*) AS n FROM Items').get() as { n: number }).n, id: s.create('Items', { Name: 'g' }).recordId }));
  assert.equal(again.before, 3, 'the backup\'s three records are back');
  assert.equal(again.id, 7, 'ids 4 to 6 were given once and stay spent');
});

test('a table made after the backup leaves nothing in the restored file, and a restore into a folder with no file has no mark to carry', async (t) => {
  const { folder, set, use, file } = folderWith(t);
  use((s) => { s.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name' }] }]); s.create('Items', { Name: 'a' }); });
  const backup = (await backupFolder(folder, set, 0)).dir;
  use((s) => {
    s.applyDesign([{ op: 'createTable', name: 'Later', fields: [{ name: 'Name' }] }]);
    for (let i = 0; i < 5; i++) s.create('Later', { Name: String(i) });
  });
  await restoreBackup(folder, backup, undefined, '');
  use((s) => {
    assert.equal(s.schema.tables.some((x) => x.name === 'Later'), false);
    assert.equal((s.sql.prepare("SELECT count(*) AS n FROM _fm_record_id_high_water WHERE tbl = 'Later'").get() as { n: number }).n, 0);
  });
  for (const ext of ['', '-wal', '-shm']) rmSync(file + ext, { force: true });
  await restoreBackup(folder, backup, undefined, '');
  assert.equal(use((s) => s.create('Items', { Name: 'b' }).recordId), 2);
});
