// With --sql-writes one account's BEGIN plus a write holds the file. Another account must still be able to sign in, its
// lockouts must still count, and the audit rows for those sign-ins are written when the hold ends, in the order the
// events happened, with the times they happened at, and the security chain still verifies.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Host } from '../src/host.ts';
import { PgServer } from '../src/pgwire.ts';
import { createStore, LOCKOUT } from '../../store/src/index.ts';
import { PgClient } from './pg-client.ts';

const SIGN_IN_KINDS = ['sign-in', 'sign-in-failed', 'locked-out'];

for (const end of ['ROLLBACK', 'COMMIT']) {
  test(`sign-ins during another account's transaction are audited after ${end}`, async (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'tabularius-pg-signin-hold-'));
    createStore(join(dir, 'Shop.openhbam.sqlite'), { mode: 'native' });
    const host = new Host(dir), pg = new PgServer(host, { port: 0, writes: true });
    const store = host.get('Shop')!;
    store.applyDesign([{ op: 'createTable', name: 'Items', fields: [{ name: 'Name' }] }]);
    const full = store.privilegeSets().find((p) => p.id === 1)!;
    store.savePrivilegeSet({ ...full, extendedPrivileges: [...full.extendedPrivileges, 'fmxdbc'] });
    store.savePrivilegeSet({ name: 'CreateOnly', records: { view: true, edit: false, create: true, delete: false }, layouts: 'viewOnly', valueLists: 'viewOnly', scripts: 'none', extendedPrivileges: ['fmxdbc'] });
    store.setPassword('Boss', 'pw', full.name);
    store.setPassword('Locky', 'pw', full.name);
    store.setPassword('Writer', 'pw', 'CreateOnly');
    store.setPassword('Fresh', 'pw', full.name);
    // Accounts that have signed in before have an identity id; Fresh has not, and making one is a write.
    for (const account of ['Boss', 'Locky', 'Writer']) store.accountIdentityId(account);
    const port = await pg.listen();
    const clients: PgClient[] = [];
    t.after(async () => { for (const c of clients) c.close(); pg.close(); await host.close(); rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); });
    const open = async (user: string, password = 'pw') => { const c = await PgClient.open({ port, user, password, database: 'Shop' }); clients.push(c); return c; };
    const events = (account: string) => store.auditLog({ account, kinds: SIGN_IN_KINDS, security: true, limit: 1000 }).map((e) => ({ seq: e.seq, at: e.at, kind: e.kind }));

    const w = await open('Writer');
    assert.equal((await w.simple('BEGIN')).error, undefined);
    assert.equal((await w.simple("INSERT INTO Items (Name) VALUES ('x')")).error, undefined);
    const started = Date.now();

    // An account's first sign-in makes its identity id, which is a write: refused while the file is held, and said so.
    await assert.rejects(() => open('Fresh'), /^Error: 55P03 /);
    // A wrong password and then the right one, while the file is held.
    await assert.rejects(() => open('Boss', 'wrong'), /28P01/);
    const boss = await open('Boss');
    assert.equal((await boss.simple('SELECT 1')).error, undefined);
    // Wrong passwords until the account is locked: the lock counts at once, whether or not its row is written yet.
    for (let i = 0; i < LOCKOUT.attempts; i++) await assert.rejects(() => open('Locky', 'wrong'), /28P01/);
    await assert.rejects(() => open('Locky'), /28P01/, 'a locked account stays locked while its rows wait');
    assert.deepEqual(events('Boss'), [], 'nothing of the waiting events is in the file yet');

    assert.equal((await w.simple(end)).error, undefined);
    assert.equal(Number((store.sql.prepare('SELECT count(*) AS n FROM Items').get() as { n: number }).n), end === 'COMMIT' ? 1 : 0);

    const boss1 = events('Boss');
    assert.deepEqual(boss1.map((e) => e.kind), ['sign-in-failed', 'sign-in']);
    const locky = events('Locky');
    assert.equal(locky.filter((e) => e.kind === 'sign-in-failed').length >= 1, true);
    assert.equal(locky.some((e) => e.kind === 'locked-out'), true, 'the lockout is audited');
    // Appended in the order they happened, with the times they happened at (not the time of the append).
    for (const list of [boss1, locky]) {
      assert.deepEqual(list.map((e) => e.seq), [...list.map((e) => e.seq)].sort((a, b) => a - b));
      assert.deepEqual(list.map((e) => e.at), [...list.map((e) => e.at)].sort());
    }
    assert.ok(Date.parse(boss1[0].at) >= started - 1000 && Date.parse(boss1[0].at) <= Date.parse(boss1[1].at));
    const chain = store.verifySecurityAudit();
    assert.equal(chain.ok, true, JSON.stringify(chain));
  });
}
