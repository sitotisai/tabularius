// A statement the SQL port refuses must not change the store's own connection on the way: SQLite applies a flag PRAGMA
// when the statement is prepared, so the syntax check may not prepare one on the connection that writes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Host } from '../src/host.ts';
import { PgServer } from '../src/pgwire.ts';
import { createStore } from '../../store/src/index.ts';
import { PgClient } from './pg-client.ts';

const FLAGS = ['foreign_keys', 'ignore_check_constraints', 'writable_schema', 'recursive_triggers'];

for (const writes of [false, true]) {
  test(`PRAGMA sent over the SQL port leaves the store's flags alone (writes ${writes})`, async (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'tabularius-pg-pragma-'));
    createStore(join(dir, 'Synthetic.openhbam.sqlite'));
    const host = new Host(dir), pg = new PgServer(host, { port: 0, writes });
    const store = host.get('Synthetic')!;
    const full = store.privilegeSets().find((p) => p.name === '[Full Access]')!;
    store.savePrivilegeSet({ ...full, extendedPrivileges: [...new Set([...full.extendedPrivileges, 'fmxdbc'])] });
    store.setPassword('Alice', 'correct', '[Full Access]');
    const port = await pg.listen();
    t.after(async () => { pg.close(); await host.close(); rmSync(dir, { recursive: true, force: true }); });
    const flags = () => Object.fromEntries(FLAGS.map((f) => [f, Object.values(store.sql.prepare(`PRAGMA ${f}`).get() as Record<string, number>)[0]]));
    const before = flags();
    const c = await PgClient.open({ port, user: 'Alice', password: 'correct', database: 'Synthetic' });
    try {
      for (const sql of [
        'PRAGMA foreign_keys=OFF', 'PRAGMA ignore_check_constraints=ON', 'PRAGMA writable_schema=ON', 'PRAGMA recursive_triggers=ON',
        '/* c */ PRAGMA foreign_keys=OFF', '-- c\nPRAGMA ignore_check_constraints=ON', 'pragma writable_schema = on', 'EXPLAIN PRAGMA foreign_keys=OFF', 'explain query plan pragma writable_schema=ON',
      ]) {
        const r = await c.simple(sql);
        assert.ok(r.error, `${sql} is refused`);
        assert.deepEqual(flags(), before, `${sql} changed the store's connection`);
      }
    } finally { c.close(); }
  });
}
