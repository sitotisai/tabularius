import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyStarter, createStore, SHOWCASE_STARTERS, type Store } from '../../store/src/index.ts';
import { modernPage } from '../../web/src/page-source.ts';
import { SHOWCASE_PAGES } from '../../web/src/showcase-pages/index.ts';
import { serve } from '../src/index.ts';
import { applyStarterExtras, HOME_FOLDER } from '../src/showcase.ts';

const NAMES = SHOWCASE_PAGES.map((p) => p.name);

function built(store: Store): void {
  applyStarter(store, 'crm-showcase', { account: 'tabularius demo' });
  store.setPassword('tabularius demo', ['local', 'showcase', 'password'].join(' '), '[Full Access]');
  const result = applyStarterExtras(store, SHOWCASE_STARTERS['crm-showcase'].extras!, { account: 'tabularius demo' });
  assert.ok(!result.skipped.some((s) => s.piece === 'HTML pages'), JSON.stringify(result.skipped));
}

test('the showcase makes a modern layout for each HTML page, in the Home folder, once', async (t: TestContext) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-showcase-pages-'));
  createStore(join(dir, 'Showcase.openhbam.sqlite'));
  const running = await serve({ dir, port: 0, log: () => {}, progressive: { every: 1000 } });
  t.after(async () => { await new Promise<void>((resolve) => running.server.close(() => resolve())); rmSync(dir, { recursive: true }); });
  const store = running.host.get('Showcase')!;
  store.setAiPolicy(false);
  built(store);

  // Each page is a layout whose one web viewer shows exactly the page's HTML.
  for (const page of SHOWCASE_PAGES) {
    const layout = store.schema.layouts.find((l) => l.name === page.name);
    assert.ok(layout, `layout ${page.name}`);
    const found = modernPage(store.designs().layouts.find((l) => l.name === page.name)!.objects as never);
    assert.equal(found?.html, page.html(), `${page.name} shows its page`);
  }
  // They are the first entries of the Layouts list, in a Home folder, in the order the pages are listed.
  const order = store.schema.layoutOrder;
  assert.equal(order[0].kind, 'folder');
  assert.equal(order[0].name, HOME_FOLDER);
  assert.deepEqual(order.slice(1, 1 + NAMES.length).map((o) => [o.name, o.depth]), NAMES.map((n) => [n, 1]));
  assert.ok(order.some((o) => o.name === 'Modernized interfaces' && o.kind === 'folder'), 'the folders already there stay');
  assert.deepEqual(order.slice(-3).map((o) => [o.name, o.depth]), [['Modernized interfaces', 0], ['Deals - Modern board', 1], ['Activities - Modern calendar', 1]]);

  // The Account 360 form's Activity tab (and no other) also holds the timeline page, below the portal, in a web viewer.
  const form = store.designs().layouts.find((l) => l.name === 'Account 360')!;
  const tabs = (form.objects.find((o) => o.kind === 'tab-control')!.children ?? []);
  const viewers = (panel: (typeof tabs)[number]) => (panel.children ?? []).filter((o) => o.kind === 'web-viewer');
  assert.deepEqual(tabs.map((p) => [p.text, viewers(p).length]), tabs.map((p) => [p.text, p.text === 'Activity' ? 1 : 0]));
  const activity = tabs.find((p) => p.text === 'Activity')!;
  const viewer = activity.children!.find((o) => o.kind === 'web-viewer')!;
  const portal = activity.children!.find((o) => o.kind === 'portal')!;
  assert.equal(modernPage([viewer] as never)?.html, SHOWCASE_PAGES.find((p) => p.name === 'Account timeline')!.html());
  assert.ok(viewer.bounds.top > portal.bounds.bottom, 'below the portal');
  assert.ok(viewer.bounds.bottom <= activity.bounds.bottom && viewer.bounds.right <= activity.bounds.right, 'inside the tab');

  // A second run leaves it as it is.
  const before = JSON.stringify([store.schema.layouts.map((l) => l.name), order, store.designs().layouts.map((l) => l.objects)]);
  applyStarterExtras(store, SHOWCASE_STARTERS['crm-showcase'].extras!, { account: 'tabularius demo' });
  assert.equal(JSON.stringify([store.schema.layouts.map((l) => l.name), store.schema.layoutOrder, store.designs().layouts.map((l) => l.objects)]), before);

  // A Manager-like account (all records, no design) is served the layouts through the Data API.
  store.savePrivilegeSet({ name: 'Manager', records: { view: true, edit: true, create: true, delete: false }, layouts: 'viewOnly', valueLists: 'viewOnly', scripts: 'viewOnly', extendedPrivileges: ['fmrest', 'fmapp'] });
  store.setPassword('manager', 'pw', 'Manager');
  const basic = 'Basic ' + btoa('manager:pw');
  const login = await fetch(`${running.url}/fmi/data/vLatest/databases/Showcase/sessions`, { method: 'POST', headers: { authorization: basic, 'content-type': 'application/json' }, body: '{}' });
  assert.equal(login.status, 200);
  const token = (await login.json()).response.token as string;
  const listed = await fetch(`${running.url}/fmi/data/vLatest/databases/Showcase/layouts`, { headers: { authorization: `Bearer ${token}` } });
  assert.equal(listed.status, 200);
  const text = JSON.stringify(await listed.json());
  for (const name of NAMES) assert.ok(text.includes(JSON.stringify(name).slice(1, -1)), `${name} is listed`);
});
