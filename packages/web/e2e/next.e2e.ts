// The alternative client (/next/) in a real browser, on a small database built here: sign in, the table as a
// collection, a search with a field filter, editing a value in the record panel (saved to the file), stepping
// to the next record, the command bar, and a new record; value lists as pickers and related rows that open.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Browser, Page } from 'playwright-core';
import type { LayoutObject } from '../../fmp12/src/index.ts';
import type { DesignOp } from '../../store/src/index.ts';
import { pageSource } from '../src/page-source.ts';
import { host, launch, skipUnless, until, window, type Hosted } from './harness.ts';

const skip = skipUnless();
let hosted: Hosted;
let browser: Browser;
const PASSWORD = 'ann-secret-1';

before(async () => {
  if (skip) return;
  hosted = await host({ stores: ['Town', 'Shop', 'Gallery', 'Dated'] });
  const store = hosted.store('Town');
  store.applyDesign([
    { op: 'createTable', name: 'People', fields: [{ name: 'id', type: 'number' }, { name: 'Name' }, { name: 'City' }, { name: 'Age', type: 'number' }] },
    { op: 'createTable', name: 'Places', fields: [{ name: 'Title' }] },
  ] as DesignOp[]);
  for (const [id, Name, City, Age] of [[1, 'Ada', 'Leeds', 36], [2, 'Alan', 'York', 41], [3, 'Grace', 'Leeds', 85], [4, 'Edsger', 'Paris', 72]] as const) {
    store.create('People', { id, Name, City, Age });
  }
  store.setPassword('Ann', PASSWORD, '[Full Access]');
  shop();
  dated();
  const gallery = hosted.store('Gallery');
  gallery.applyDesign([{ op: 'createTable', name: 'Parks', fields: [{ name: 'Name' }, { name: 'Photo', type: 'container' }, { name: 'Leaflet', type: 'container' }] }] as DesignOp[]);
  gallery.create('Parks', { Name: 'Roundhay' });
  // A modern layout: one web viewer showing a page that lists parks and adds one through window.tabularius.
  const html = '<h1>Parks</h1><ul id=list></ul><button id=add>Add Kew</button><button id=lay>Layouts</button><button id=go>Go to Parks</button><pre id=out></pre><script>' +
    "async function show() { const f = await tabularius.records('Parks', { limit: 10 }); document.getElementById('list').replaceChildren(...f.data.map((r) => Object.assign(document.createElement('li'), { textContent: r.fieldData.Name }))); }" +
    "show(); tabularius.on('refresh', show); document.getElementById('add').onclick = async () => { await tabularius.create('Parks', { Name: 'Kew' }); show(); };" +
    "document.getElementById('lay').onclick = async () => { document.getElementById('out').textContent = (await tabularius.layouts()).join(); };" +
    "document.getElementById('go').onclick = async () => { await tabularius.goToLayout('Parks'); };</script>";
  const parks = gallery.schema.tableOccurrences.find((t) => t.name === 'Parks')!.id;
  gallery.applyDesign([{ op: 'createLayout', name: 'Welcome', occurrence: parks, design: {
    width: 800, parts: [{ kind: 'body', kindId: 2, top: 0, height: 600, style: {} }],
    objects: [{ id: 1, kind: 'web-viewer', type: 13, external: 'WEBV', name: 'page', style: {}, bounds: { top: 0, left: 0, bottom: 600, right: 800 },
      anchors: { left: true, top: true, right: true, bottom: true }, webUrl: `"data:text/html;base64," & Base64EncodeRFC ( 4648 ; "${html}" )`,
      webOptions: { interaction: true, findMode: false, progressBar: false, statusMessages: false, encodeUrl: false, jsBridge: true } }],
  } }] as DesignOp[]);
  gallery.setPassword('Ann', PASSWORD, '[Full Access]');
  browser = await launch();
});
after(async () => {
  await browser?.close();
  await hosted?.close();
});

/** Customers with a City pop-up menu and a Tags checkbox set, and an Orders portal. */
function shop(): void {
  const store = hosted.store('Shop');
  store.applyDesign([
    { op: 'createTable', name: 'Customers', fields: [{ name: 'Id', type: 'number' }, { name: 'Name' }, { name: 'City' }, { name: 'Tags' }, { name: 'Favourite' }] },
    { op: 'createTable', name: 'Orders', fields: [{ name: 'CustomerId', type: 'number' }, { name: 'Item' }, { name: 'Qty', type: 'number' }] },
    { op: 'createRelationship', left: 'Customers', right: 'Orders', predicates: [{ left: 'Id', right: 'CustomerId' }], rightCreate: true },
    { op: 'createValueList', name: 'Cities', values: ['Leeds', 'York', 'Paris'] },
    { op: 'createValueList', name: 'Tags', values: ['VIP', '-', 'Wholesale'] },
    { op: 'createValueList', name: 'Their items', field: { occurrence: 'Orders', field: 'Item', related: 'Customers' } },
  ] as DesignOp[]);
  const design = store.design('Customers')!;
  const list = (name: string) => store.schema.valueLists.find((v) => v.name === name)!.id;
  const objects = design.objects.map((o) => o.field?.field === 'City' ? { ...o, field: { ...o.field, display: 'popup', valueListId: list('Cities') } }
    : o.field?.field === 'Tags' ? { ...o, field: { ...o.field, display: 'checkbox', valueListId: list('Tags') } }
    : o.field?.field === 'Favourite' ? { ...o, field: { ...o.field, display: 'popup', valueListId: list('Their items') } } : o);
  const orders = store.schema.tableOccurrences.find((t) => t.name === 'Orders')!;
  const fieldId = (name: string) => store.schema.tables.find((t) => t.name === 'Orders')!.fields.find((f) => f.name === name)!.id;
  const anchors = { left: true, top: true, right: false, bottom: false };
  const cell = (id: number, name: string, left: number, right: number): LayoutObject => ({
    id, kind: 'field', type: 1, anchors, style: {}, bounds: { top: 222, left, bottom: 244, right },
    field: { tableOccurrenceId: orders.id, fieldId: fieldId(name), tableOccurrence: 'Orders', field: name, display: 'edit', repetitions: 1 },
  } as LayoutObject);
  const portal = {
    id: 900, kind: 'portal', type: 9, anchors, style: {}, bounds: { top: 220, left: 160, bottom: 324, right: 520 },
    portal: { tableOccurrenceId: orders.id, tableOccurrence: 'Orders', rows: 4, initialRow: 1 },
    children: [cell(901, 'Item', 162, 400), cell(902, 'Qty', 404, 516)],
  } as LayoutObject;
  const parts = design.parts.map((p) => p.kind === 'body' ? { ...p, height: 280 } : p.kind === 'footer' ? { ...p, top: 340 } : p);
  store.applyDesign([{ op: 'updateLayout', layout: 'Customers', design: { parts, objects: [...objects, portal] } }] as DesignOp[]);
  store.create('Customers', { Id: 1, Name: 'Ada', City: 'Leeds' });
  store.create('Orders', { CustomerId: 1, Item: 'Tea', Qty: 2 });
  store.create('Orders', { CustomerId: 1, Item: 'Cake', Qty: 1 });
  store.setPassword('Ann', PASSWORD, '[Full Access]');
}

/** Customers with an Orders portal whose columns are text, a value the file works out, a date and a time. */
function dated(): void {
  const store = hosted.store('Dated');
  store.applyDesign([
    { op: 'createTable', name: 'Customers', fields: [{ name: 'Id', type: 'number' }, { name: 'Name' }] },
    { op: 'createTable', name: 'Orders', fields: [
      { name: 'CustomerId', type: 'number' }, { name: 'Item' }, { name: 'Code', calculation: 'Upper ( Item )', options: { autoEnter: { calculation: true, replaceExisting: true } } },
      { name: 'Due', type: 'date' }, { name: 'At', type: 'time' }] },
    { op: 'createRelationship', left: 'Customers', right: 'Orders', predicates: [{ left: 'Id', right: 'CustomerId' }], rightCreate: true },
  ] as DesignOp[]);
  const design = store.design('Customers')!;
  const orders = store.schema.tableOccurrences.find((t) => t.name === 'Orders')!;
  const fieldId = (name: string) => store.schema.tables.find((t) => t.name === 'Orders')!.fields.find((f) => f.name === name)!.id;
  const anchors = { left: true, top: true, right: false, bottom: false };
  const cell = (id: number, name: string, left: number, right: number): LayoutObject => ({
    id, kind: 'field', type: 1, anchors, style: {}, bounds: { top: 222, left, bottom: 244, right },
    field: { tableOccurrenceId: orders.id, fieldId: fieldId(name), tableOccurrence: 'Orders', field: name, display: 'edit', repetitions: 1 },
  } as LayoutObject);
  const portal = {
    id: 900, kind: 'portal', type: 9, anchors, style: {}, bounds: { top: 220, left: 160, bottom: 324, right: 620 },
    portal: { tableOccurrenceId: orders.id, tableOccurrence: 'Orders', rows: 4, initialRow: 1 },
    children: [cell(901, 'Item', 162, 260), cell(902, 'Code', 264, 340), cell(903, 'Due', 344, 450), cell(904, 'At', 454, 616)],
  } as LayoutObject;
  const parts = design.parts.map((p) => p.kind === 'body' ? { ...p, height: 280 } : p.kind === 'footer' ? { ...p, top: 340 } : p);
  store.applyDesign([{ op: 'updateLayout', layout: 'Customers', design: { parts, objects: [...design.objects, portal] } }] as DesignOp[]);
  store.create('Customers', { Id: 1, Name: 'Eve' });
  store.setPassword('Ann', PASSWORD, '[Full Access]');
}

async function open(file = 'Town'): Promise<Page & { errors: string[] }> {
  const page = await window(await browser.newContext());
  await page.goto(hosted.url + '/next/');
  await page.locator('select[name="db"]').selectOption(file);
  await page.locator('input[name="account"]').fill('Ann');
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await page.locator('.rail-item').first().waitFor();
  if (file === 'Town') await page.locator('.rail-item', { hasText: 'People' }).click();
  await page.locator('.row:not(.head)').first().waitFor();
  return page;
}

const names = (page: Page) => page.locator('.row:not(.head) .lead-text').allTextContents();

/** Use the command key the client advertises for this browser platform. */
async function openPalette(page: Page): Promise<void> {
  const modifier = await page.evaluate(() => /Mac|iPhone|iPad/.test(navigator.platform) ? 'Meta' : 'Control');
  await page.keyboard.press(`${modifier}+k`);
  await page.locator('.palette').waitFor({ state: 'visible' });
}

test('the alternative client signs in on a server that keeps its list of files off, by typing the name (or ?db=)', { skip }, async () => {
  const quiet = await host({ stores: ['Town'], listFilesOff: true });
  try {
    quiet.store('Town').applyDesign([{ op: 'createTable', name: 'People', fields: [{ name: 'Name' }] }] as DesignOp[]);
    quiet.store('Town').setPassword('Ann', PASSWORD, '[Full Access]');
    for (const typedByHand of [true, false]) {
      const page = await window(await browser.newContext());
      await page.goto(`${quiet.url}/next/${typedByHand ? '' : '?db=Town'}`);
      assert.equal(await page.locator('select[name="db"]').count(), 0, 'no file list to pick from');
      const file = page.locator('input[name="db"]');
      if (typedByHand) await file.fill('Town'); else assert.equal(await file.inputValue(), 'Town');
      await page.locator('input[name="account"]').fill('Ann');
      await page.locator('input[name="password"]').fill('wrong-password');
      await page.getByRole('button', { name: 'Open', exact: true }).click();
      await until(() => page.locator('.signin-error').textContent(), (text) => !!text);
      assert.equal(await file.inputValue(), 'Town');
      assert.equal(await page.locator('input[name="account"]').inputValue(), 'Ann');
      assert.equal(await page.locator('input[name="password"]').inputValue(), 'wrong-password');
      await page.locator('input[name="password"]').fill(PASSWORD);
      await page.getByRole('button', { name: 'Open', exact: true }).click();
      await page.locator('.rail-item').first().waitFor();
    }
  } finally {
    await quiet.close();
  }
});

test('the alternative client lists, searches, edits and adds records', { skip }, async () => {
  const page = await open();
  assert.deepEqual((await names(page)).sort(), ['Ada', 'Alan', 'Edsger', 'Grace']);
  assert.deepEqual(await page.locator('.rail-item').allTextContents(), ['People', 'Places']);
  // The table's key stays out of the list.
  assert.deepEqual(await page.locator('.row.head .cell').allTextContents(), ['Name', 'City', 'Age']);
  // The list is one stop for Tab: the row the keyboard is on, which Enter opens.
  assert.equal(await page.locator('.row:not(.head)[tabindex="0"]').count(), 1);
  await page.locator('.row:not(.head)').first().focus();
  assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('row')), true);

  // A filter typed as "field: value" becomes a chip; plain words search the text fields.
  await page.locator('input.search').fill('city: Leeds');
  await until(() => page.locator('.chip').allTextContents(), (c) => c.length === 1);
  await until(() => names(page), (n) => n.sort().join() === 'Ada,Grace');
  await page.locator('input.search').fill('gra');
  await until(() => names(page), (n) => n.join() === 'Grace');
  await page.locator('.chip-x').click();
  await until(() => names(page), (n) => n.join() === 'Grace');
  await page.locator('input.search').fill('');
  await until(() => names(page), (n) => n.length === 4);

  // Enter straight after typing finishes the search instead of opening a row from the list before it; the next
  // Enter opens the first row of the narrowed list.
  await page.locator('input.search').fill('city: Paris');
  await page.locator('input.search').press('Enter');
  await until(() => names(page), (n) => n.join() === 'Edsger');
  assert.equal(await page.locator('.sheet .record-title').count(), 0);
  await page.locator('input.search').press('Enter');
  await until(() => page.locator('.sheet .record-title').textContent(), (t) => t === 'Edsger');
  await page.keyboard.press('Escape');
  await page.locator('.chip-x').click();
  await until(() => names(page), (n) => n.length === 4);

  // Sorting by a column header.
  await page.locator('.row.head .cell', { hasText: 'Age' }).click();
  await until(() => names(page), (n) => n.join() === 'Ada,Alan,Edsger,Grace');

  // A record opens beside the list; a click on a value edits it, Enter saves it to the file.
  await page.locator('.row:not(.head)', { hasText: 'Alan' }).click();
  await page.locator('.sheet .record-title', { hasText: 'Alan' }).waitFor();
  assert.equal(await page.locator('.stepper-at').textContent(), '2 of 4');
  await page.locator('.sheet dd .value', { hasText: 'York' }).click();
  await page.locator('.sheet input.editor').fill('Manchester');
  await page.keyboard.press('Enter');
  await page.locator('.saved.ok').waitFor();
  const alan = hosted.store('Town').find('People', { limit: 10 }).records.find((r) => r.fieldData['Name'] === 'Alan');
  assert.equal(alan?.fieldData['City'], 'Manchester');
  await until(() => page.locator('.row:not(.head)', { hasText: 'Alan' }).textContent(), (t) => !!t?.includes('Manchester'));

  // J steps to the next record; Escape closes it.
  await page.locator('body').click({ position: { x: 600, y: 600 } });
  await page.keyboard.press('j');
  await page.locator('.sheet .record-title', { hasText: 'Edsger' }).waitFor();
  await page.keyboard.press('Escape');
  await until(() => page.locator('.sheet').isHidden(), (h) => h);

  // The command bar goes to another collection.
  await openPalette(page);
  await page.locator('.palette-input').fill('plac');
  await page.keyboard.press('Enter');
  await page.locator('.stage-title h1', { hasText: 'Places' }).waitFor();

  // A new record opens with its title ready to type.
  await page.locator('button.new').click();
  await page.locator('.sheet input.editor').waitFor();
  await page.keyboard.type('Leeds Library');
  await page.keyboard.press('Enter');
  await page.locator('.saved.ok').waitFor();
  assert.deepEqual(hosted.store('Town').find('Places', { limit: 10 }).records.map((r) => r.fieldData['Title']), ['Leeds Library']);

  assert.deepEqual(page.errors, []);
});

test('value lists become pickers, and related rows open their record', { skip }, async () => {
  const page = await open('Shop');
  const customer = () => hosted.store('Shop').find('Customers', { limit: 1 }).records[0].fieldData;
  await page.locator('.row:not(.head)', { hasText: 'Ada' }).click();
  await page.locator('.sheet .record-title', { hasText: 'Ada' }).waitFor();

  // A pop-up menu: picking a city saves it.
  await page.locator('.sheet dd .value', { hasText: 'Leeds' }).click();
  assert.deepEqual(await page.locator('.sheet select.editor option').allTextContents(), ['—', 'Leeds', 'York', 'Paris']);
  await page.locator('.sheet select.editor').selectOption('York');
  await until(async () => customer()['City'], (v) => v === 'York');
  await page.locator('.sheet dd .value', { hasText: 'York' }).waitFor();

  // A checkbox set: toggles, saved together when done; the "-" divider isn't a choice.
  await page.locator('.sheet dt', { hasText: 'Tags' }).locator('xpath=following-sibling::dd[1]').locator('.value').click();
  assert.deepEqual(await page.locator('.sheet .choice').allTextContents(), ['VIP', 'Wholesale']);
  await page.locator('.sheet .choice', { hasText: 'VIP' }).click();
  await page.locator('.sheet .choice', { hasText: 'Wholesale' }).click();
  await page.locator('.sheet .choices-done').click();
  await until(async () => String(customer()['Tags']).split(/\r\n?|\n/).join(','), (v) => v === 'VIP,Wholesale');
  await page.locator('.sheet dd .value', { hasText: 'VIP, Wholesale' }).waitFor();

  // The Orders portal lists the related records; a row opens its order.
  assert.deepEqual((await page.locator('.sheet .related .mini-row .cell:first-child').allTextContents()).sort(), ['Cake', 'Tea']);

  // A value list of this customer's own order items: the menu offers only theirs.
  await page.locator('.sheet dt', { hasText: 'Favourite' }).locator('xpath=following-sibling::dd[1]').locator('.value').click();
  await page.locator('.sheet select.editor').waitFor();
  assert.deepEqual((await page.locator('.sheet select.editor option').allTextContents()).sort(), ['Cake', 'Tea', '—']);
  await page.locator('.sheet select.editor').selectOption('Tea');
  await until(async () => customer()['Favourite'], (v) => v === 'Tea');

  // Add makes a new order for this customer, typed in place; Escape drops an unsaved one.
  await page.getByRole('button', { name: 'Add to orders' }).click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.sheet .mini-new').count(), 0);
  await page.getByRole('button', { name: 'Add to orders' }).click();
  await page.keyboard.type('Jam');
  await page.keyboard.press('Tab');
  await page.keyboard.type('3');
  await page.keyboard.press('Enter');
  await until(() => page.locator('.sheet .related .mini-row .cell:first-child').allTextContents(), (n) => n.sort().join() === 'Cake,Jam,Tea');
  const jam = hosted.store('Shop').find('Orders', { limit: 10 }).records.map((x) => x.fieldData).find((f) => f['Item'] === 'Jam');
  assert.equal(Number(jam?.['CustomerId']), 1);
  assert.equal(Number(jam?.['Qty']), 3);

  await page.locator('.sheet .related .mini-row', { hasText: 'Tea' }).click();
  await page.locator('.stage-title h1', { hasText: 'Orders' }).waitFor();
  await page.locator('.sheet .record-title', { hasText: 'Tea' }).waitFor();

  assert.deepEqual(page.errors, []);
});

test('the command bar asks the assistant, and the records an answer found show in the list', { skip }, async () => {
  const context = await browser.newContext();
  // A stand-in assistant: no model is called, nothing leaves the machine.
  const asked: unknown[] = [];
  await context.route('**/tabularius/assistant/v1/databases/**', async (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { available: true, model: 'test', canDesign: false } });
    asked.push(route.request().postDataJSON());
    return route.fulfill({ json: {
      reply: 'Two people live in **Leeds**: Ada and Grace.',
      foundSets: [{ layout: 'People', query: [{ City: '==Leeds' }], foundCount: 2, summary: 'People in Leeds' }],
      proposals: [], drafts: [], charts: [], dashboards: [], cleanups: [], automations: [], tools: [],
    } });
  });
  const page = await window(context);
  await page.goto(hosted.url + '/next/');
  await page.locator('select[name="db"]').selectOption('Town');
  await page.locator('input[name="account"]').fill('Ann');
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await page.locator('.rail-item', { hasText: 'People' }).click();
  await page.locator('.row:not(.head)').first().waitFor();

  await openPalette(page);
  await page.locator('.palette-input').fill('who lives in leeds?');
  // A question puts asking first, so Enter asks.
  assert.equal(await page.locator('.palette-item').first().textContent(), 'Ask: who lives in leeds?⇥');
  await page.keyboard.press('Enter');
  await page.locator('.sheet .ask-a strong', { hasText: 'Leeds' }).waitFor();
  assert.equal((asked[0] as { messages: { content: string }[] }).messages[0].content, 'who lives in leeds?');
  assert.equal((asked[0] as { context: { layout: string } }).context.layout, 'People');

  await page.locator('.ask-found').click();
  await until(() => names(page), (n) => n.sort().join() === 'Ada,Grace');
  assert.equal(await page.locator('.chip-ai .chip-value').textContent(), 'People in Leeds');
  await page.locator('.chip-ai .chip-x').click();
  await until(() => names(page), (n) => n.length === 4);

  // A follow-up goes with the conversation so far.
  await page.locator('.ask-input').fill('and in York?');
  await page.keyboard.press('Enter');
  await until(async () => asked.length, (n) => n === 2);
  assert.equal((asked[1] as { messages: unknown[] }).messages.length, 3);
  await page.keyboard.press('Escape');
  await until(() => page.locator('.sheet').isHidden(), (h) => h);
  assert.deepEqual(page.errors, []);
});

test('pictures and files go into container fields by picking or dropping them', { skip }, async () => {
  const page = await open('Gallery');
  await page.locator('.row:not(.head)').first().click();
  await page.locator('.sheet .record-title').waitFor();
  const stored = (field: string) => String(hosted.store('Gallery').find('Parks', { limit: 1 }).records[0].fieldData[field] ?? '');

  // The first container is the record's picture: an empty square that picks one.
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  await page.getByRole('button', { name: 'Add photo' }).waitFor();
  await page.locator('.pic-slot input[type=file]').setInputFiles({ name: 'roundhay.png', mimeType: 'image/png', buffer: png });
  await page.locator('.sheet img.record-pic').waitFor();
  await page.locator('.saved.ok').waitFor();
  assert.ok(stored('Photo'), 'the picture is in the file');
  assert.ok(await page.getByRole('button', { name: 'Change photo' }).isVisible());

  // Another container shows as a file: dropped on the field, then opened by name, then removed.
  const leaflet = page.locator('.file-value').first();
  assert.equal(await leaflet.locator('.file-add').textContent(), 'Add a file');
  await leaflet.evaluate((el) => {
    const data = new DataTransfer();
    data.items.add(new File(['Open 7am to dusk'], 'leaflet.txt', { type: 'text/plain' }));
    el.dispatchEvent(new DragEvent('dragover', { dataTransfer: data, bubbles: true, cancelable: true }));
    el.dispatchEvent(new DragEvent('drop', { dataTransfer: data, bubbles: true, cancelable: true }));
  });
  await until(() => page.locator('.file-value .file-name').allTextContents(), (n) => n.join() === 'leaflet.txt');
  assert.ok(stored('Leaflet'), 'the dropped file is in the file');
  const href = await page.locator('.file-value .file-link').getAttribute('href');
  assert.equal(await page.evaluate(async (u) => (await fetch(u!)).text(), href), 'Open 7am to dusk');
  await page.locator('.file-value').first().hover();
  await page.locator('.file-value').getByRole('button', { name: 'Remove' }).click();
  await page.locator('.file-value .file-add').waitFor();
  assert.equal(stored('Leaflet'), '');

  assert.deepEqual(page.errors, []);
});

test('a narrowed list is kept by name under its collection, and opens again as it was', { skip }, async () => {
  const page = await open();
  assert.equal(await page.locator('.save-view').count(), 0);
  await page.locator('input.search').fill('city: Leeds');
  await until(() => names(page), (n) => n.sort().join() === 'Ada,Grace');

  // Save view names it in place, in the sidebar under People.
  await page.locator('.save-view').click();
  await page.locator('.rail-name').fill('Leeds folk');
  await page.keyboard.press('Enter');
  await until(() => page.locator('.rail-view').allTextContents(), (n) => n.join() === 'Leeds folk');
  assert.equal(await page.locator('.rail-view').getAttribute('aria-current'), 'page');
  assert.equal(await page.locator('.save-view').count(), 0);
  // Esc after naming it still reaches the list (the sidebar is not left open as a drawer).
  assert.equal(await page.locator('.shell.rail-open, .rail-open').count(), 0);

  // The collection shows everything again; the view brings the chip back.
  await page.locator('.rail-item:not(.rail-view)', { hasText: 'People' }).click();
  await until(() => names(page), (n) => n.length === 4);
  await page.locator('.rail-view', { hasText: 'Leeds folk' }).click();
  await until(() => names(page), (n) => n.sort().join() === 'Ada,Grace');
  assert.deepEqual(await page.locator('.chip .chip-value').allTextContents(), ['Leeds']);

  // A change to it can be kept, and the view stays after a reload.
  await page.locator('.row.head .cell', { hasText: 'Age' }).click();
  await page.locator('.save-view', { hasText: 'Update “Leeds folk”' }).click();
  await until(() => page.locator('.save-view').count(), (n) => n === 0);
  await page.reload();
  await page.locator('.rail-view', { hasText: 'Leeds folk' }).click();
  await until(() => names(page), (n) => n.join() === 'Ada,Grace');

  // Deleted from the command bar.
  await openPalette(page);
  await page.locator('.palette-input').fill('delete view');
  await page.keyboard.press('Enter');
  await until(() => page.locator('.rail-view').count(), (n) => n === 0);

  assert.deepEqual(page.errors, []);
});

test('rows picked together are changed or deleted at once', { skip }, async () => {
  const page = await open();
  const people = () => hosted.store('Town').find('People', { limit: 50 }).records.map((r) => r.fieldData);
  await page.locator('.row.head .cell', { hasText: 'Name' }).click();
  await until(() => names(page), (n) => n.join() === 'Ada,Alan,Edsger,Grace');

  // A click on a row's box picks it; Shift picks every row up to it.
  const box = (name: string) => page.locator('.row:not(.head)', { hasText: name }).locator('.pick');
  await page.locator('.row:not(.head)', { hasText: 'Ada' }).hover();
  await box('Ada').click();
  await box('Edsger').click({ modifiers: ['Shift'] });
  assert.equal(await page.locator('.tray .tray-count').textContent(), '3 selected');
  assert.equal(await page.locator('.sheet').isHidden(), true, 'picking does not open the record');

  // Set a field puts one value in every picked record.
  await page.locator('.tray').getByRole('button', { name: 'Set a field…' }).click();
  await page.locator('.tray-field').selectOption('City');
  await page.locator('.tray-value .editor').fill('Bath');
  await page.locator('.tray').getByRole('button', { name: 'Set', exact: true }).click();
  await until(async () => people().filter((p) => p['City'] === 'Bath').map((p) => p['Name']).sort().join(), (n) => n === 'Ada,Alan,Edsger');
  await until(() => page.locator('.tray').count(), (n) => n === 0);

  // X picks the row the keyboard is on (J and K move it); Delete asks first.
  for (let i = 0; i < 4; i++) await page.keyboard.press('j');
  await page.keyboard.press('x');
  assert.equal(await page.locator('.tray .tray-count').textContent(), '1 selected');
  await page.locator('.tray').getByRole('button', { name: 'Delete…' }).click();
  await page.locator('.tray').getByRole('button', { name: 'Keep them' }).click();
  assert.equal(people().length, 4);
  await page.keyboard.press('Escape');
  await until(() => page.locator('.tray').count(), (n) => n === 0);
  await page.keyboard.press('x');
  await page.locator('.tray').getByRole('button', { name: 'Delete…' }).click();
  await page.locator('.tray').getByRole('button', { name: 'Delete', exact: true }).click();
  await until(() => names(page), (n) => n.join() === 'Ada,Alan,Edsger');
  assert.deepEqual(people().map((p) => p['Name']).sort(), ['Ada', 'Alan', 'Edsger']);

  assert.deepEqual(page.errors, []);
});

test('a board groups records by a value-list field, and a card dragged to another column takes its value', { skip }, async () => {
  const page = await open('Shop');
  await page.locator('.shape-item', { hasText: 'Board' }).click();
  await page.locator('.board').waitFor();
  assert.deepEqual(await page.locator('.lane-head > span:first-child').allTextContents(), ['Leeds', 'York', 'Paris']);
  const lane = (name: string) => page.locator('.lane', { has: page.locator('.lane-head', { hasText: name }) });
  const city = () => String(hosted.store('Shop').find('Customers', { limit: 1 }).records[0].fieldData['City']);
  const from = await lane(city()).locator('.card').count();
  assert.equal(from, 1);
  await lane(city()).locator('.card').dragTo(lane('Paris'));
  await until(async () => city(), (v) => v === 'Paris');
  assert.equal(await lane('Paris').locator('.card').count(), 1);
  // From the keyboard, Shift and an arrow move it a column over.
  await lane('Paris').locator('.card').focus();
  await page.keyboard.press('Shift+ArrowLeft');
  await until(async () => city(), (v) => v === 'York');
  await until(() => page.evaluate(() => document.activeElement?.closest('.lane')?.querySelector('.lane-head span')?.textContent), (t) => t === 'York');
  await page.keyboard.press('Shift+ArrowRight');
  await until(async () => city(), (v) => v === 'Paris');

  // A card opens its record; List goes back.
  await lane('Paris').locator('.card').click();
  await page.locator('.sheet .record-title', { hasText: 'Ada' }).waitFor();
  await page.keyboard.press('Escape');
  await page.locator('.shape-item', { hasText: 'List' }).click();
  await page.locator('.row:not(.head)').first().waitFor();

  assert.deepEqual(page.errors, []);
});

test('a modern layout shows as a page, its data calls answered as the signed-in account', { skip }, async () => {
  const page = await open('Gallery');
  // Pages are listed apart from the collections; the page's own layout isn't a collection.
  await page.locator('.rail-pages .rail-item', { hasText: 'Welcome' }).click();
  await until(() => page.evaluate(() => location.hash), (h) => h === '#/~/Welcome');
  await until(() => page.locator('.stage-title h1').textContent(), (t) => t === 'Welcome');
  const frame = page.frameLocator('.page-frame iframe');
  await until(() => frame.locator('li').allTextContents(), (l) => l.join() === 'Roundhay');
  await frame.locator('#add').click();
  await until(() => frame.locator('li').allTextContents(), (l) => l.join() === 'Roundhay,Kew');
  assert.deepEqual(hosted.store('Gallery').find('Parks', {}).records.map((r) => r.fieldData['Name']), ['Roundhay', 'Kew']);
  // The page can list the layouts this account opens and go to one (#159).
  await frame.locator('#lay').click();
  await until(() => frame.locator('#out').textContent(), (t) => (t ?? '').split(',').includes('Welcome') && (t ?? '').split(',').includes('Parks'));
  await frame.locator('#go').click();
  await until(() => page.evaluate(() => location.hash), (h) => h === '#/Parks');
  // The collection lists the park the page added.
  await until(() => page.locator('.row:not(.head)').count(), (n) => n === 2);
  // And to the page again from the command bar.
  await openPalette(page);
  await page.keyboard.type('Welcome');
  await page.keyboard.press('Enter');
  await frame.locator('li').first().waitFor();
  if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT });
  assert.deepEqual(page.errors, []);
});

test('a page is edited beside a preview and saved to the layout; a new page starts from a starter', { skip }, async () => {
  const page = await open('Gallery');
  await page.locator('.rail-pages .rail-item', { hasText: 'Welcome' }).click();
  await page.frameLocator('.page-frame iframe').locator('#add').waitFor();
  await page.getByRole('button', { name: 'Edit page' }).click();
  const code = page.getByRole('textbox', { name: 'Page HTML, CSS and JavaScript' });
  await until(() => code.inputValue(), (v) => v.includes('<h1>Parks</h1>'));
  await code.fill('<h1 id=t>Hello #1</h1>');
  await until(() => page.frameLocator('.page-preview iframe').locator('#t').textContent(), (t) => t === 'Hello #1');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.locator('.page-editor').waitFor({ state: 'detached' });
  await until(async () => pageSource(hosted.store('Gallery').design('Welcome')!.objects[0].webUrl), (h) => h === '<h1 id=t>Hello #1</h1>');
  await until(() => page.frameLocator('.page-frame iframe').locator('#t').textContent(), (t) => t === 'Hello #1');

  // New page, from the command bar.
  await openPalette(page);
  await page.keyboard.type('New page');
  await page.keyboard.press('Enter');
  await page.locator('.rail-pages .rail-item', { hasText: 'Parks page' }).waitFor();
  await until(() => page.evaluate(() => location.hash), (h) => h === '#/~/Parks%20page');
  await until(() => page.frameLocator('.page-frame iframe').locator('li').first().textContent(), (t) => !!t);
  // The preview has no data calls, so the first page (which calls tabularius without checking) says so there, and only there.
  assert.deepEqual([...new Set(page.errors)], ['tabularius is not defined']);
});

/** Lets the request through to the server, then drops the answer, as a network drop or a proxy timeout does. */
async function loseResponses(page: Page, counted: { patches: number }, times = 1): Promise<void> {
  let left = times;
  await page.route(/\/records\/\d+$/, async (route) => {
    if (route.request().method() !== 'PATCH') return route.continue();
    counted.patches++;
    if (left-- > 0) { await route.fetch(); return route.abort('failed'); }
    return route.continue();
  });
}
/**
 * Lets whatever a click or key started in the page run its course: two frames, then one round trip to the server, so
 * a request the page was going to send is already on its way (and counted) when this returns.
 */
const settle = (page: Page) => page.evaluate(async () => {
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  await fetch('/next/', { method: 'HEAD' });
});
const rowsOf = (store: string, table: string, field: string, value: string) => hosted.store(store).find(table, { limit: 100 }).records.filter((x) => String(x.fieldData[field]).toUpperCase() === value.toUpperCase()).length;

test('a related row with a date, a time and a worked-out column is not added twice after a lost answer', { skip }, async () => {
  const page = await open('Dated');
  await page.locator('.row:not(.head)', { hasText: 'Eve' }).click();
  await page.locator('.sheet .record-title', { hasText: 'Eve' }).waitFor();
  const counted = { patches: 0 };
  await loseResponses(page, counted);
  await page.getByRole('button', { name: 'Add to orders' }).click();
  await page.keyboard.type('Jam');
  await page.locator('.sheet .mini-new input[type="date"]').fill('2026-03-05');
  await page.locator('.sheet .mini-new input[aria-label$="At"]').fill('10:00');
  await page.keyboard.press('Enter');
  await until(() => page.locator('.sheet .saved').first().textContent(), (t) => !!t && t !== 'Saving…');
  assert.equal(rowsOf('Dated', 'Orders', 'Item', 'Jam'), 1, 'the first try reached the server');
  const made = hosted.store('Dated').find('Orders', { limit: 10 }).records[0].fieldData;
  assert.equal(made['Due'], '03/05/2026', 'the file presents the date padded, the draft is not');
  assert.equal(made['Code'], 'JAM', 'the file worked a column out of what was typed');
  // Leaving the row sends nothing; Check again looks at the list and, finding a row it did not have, still sends nothing.
  await page.locator('.sheet .sheet-crumb').click();
  await settle(page);
  assert.equal(counted.patches, 1);
  await page.getByRole('button', { name: 'Check again' }).click();
  await page.locator('.sheet .mini-note', { hasText: /probably added|may be the one/ }).waitFor();
  assert.equal(counted.patches, 1, 'Check again did not send it again');
  assert.equal(rowsOf('Dated', 'Orders', 'Item', 'Jam'), 1);
  assert.match(await page.locator('.sheet .mini-note').textContent() ?? '', /probably added|may be the one/);
  // Enter does not add it either, and says so; only Add anyway does.
  await page.locator('.sheet .mini-new input').first().focus();
  await page.keyboard.press('Enter');
  await settle(page);
  assert.equal(counted.patches, 1);
  assert.match(await page.locator('.toast').textContent() ?? '', /Add anyway/);
  await page.getByRole('button', { name: 'Add anyway' }).click();
  await until(async () => rowsOf('Dated', 'Orders', 'Item', 'Jam'), (n) => n === 2);
  assert.equal(counted.patches, 2);
  await until(async () => page.locator('.sheet .mini-new').count(), (n) => n === 0);
});

test('a related row that the list shows after a lost answer can be discarded', { skip }, async () => {
  hosted.store('Dated').create('Customers', { Id: 2, Name: 'Fay' });
  const page = await open('Dated');
  await page.locator('.row:not(.head)', { hasText: 'Fay' }).click();
  await page.locator('.sheet .record-title', { hasText: 'Fay' }).waitFor();
  const counted = { patches: 0 };
  await loseResponses(page, counted);
  await page.getByRole('button', { name: 'Add to orders' }).click();
  await page.keyboard.type('Tea');
  await page.keyboard.press('Enter');
  await until(() => page.locator('.sheet .saved').first().textContent(), (t) => !!t && t !== 'Saving…');
  await page.getByRole('button', { name: 'Check again' }).click();
  await page.getByRole('button', { name: 'Discard' }).click();
  await until(async () => page.locator('.sheet .mini-new').count(), (n) => n === 0);
  assert.equal(rowsOf('Dated', 'Orders', 'Item', 'Tea'), 1);
  assert.equal(counted.patches, 1);
});

test('a related row whose answer was lost is not sent again by leaving it; Check again looks first, so nothing is added twice', { skip }, async () => {
  hosted.store('Shop').create('Customers', { Id: 2, Name: 'Bob' });
  const page = await open('Shop');
  await page.locator('.row:not(.head)', { hasText: 'Bob' }).click();
  await page.locator('.sheet .record-title', { hasText: 'Bob' }).waitFor();
  const counted = { patches: 0 };
  await loseResponses(page, counted);
  await page.getByRole('button', { name: 'Add to orders' }).click();
  await page.keyboard.type('Marmalade');
  await page.keyboard.press('Enter');
  await until(() => page.locator('.sheet .saved').first().textContent(), (t) => !!t && t !== 'Saving…');
  assert.equal(rowsOf('Shop', 'Orders', 'Item', 'Marmalade'), 1, 'the first try reached the server');
  assert.equal(await page.locator('.sheet .mini-new').count(), 1, 'the typed row is kept');
  await page.locator('.sheet .sheet-crumb').click();
  await settle(page);
  assert.equal(counted.patches, 1, 'no automatic resend');
  await page.getByRole('button', { name: 'Check again' }).click();
  await page.getByRole('button', { name: 'Add anyway' }).waitFor();
  assert.equal(counted.patches, 1, 'Check again did not send it again');
  assert.equal(rowsOf('Shop', 'Orders', 'Item', 'Marmalade'), 1);
  // The list now shows the row the first try made.
  await until(() => page.locator('.sheet .related .mini-row .cell:first-child').allTextContents(), (n) => n.filter((x) => x === 'Marmalade').length === 1);
  assert.deepEqual(page.errors.filter((e) => !/Failed to load resource/.test(e)), []);
});

test('a related row the server refused is kept, not sent on leaving it, and Retry sends it once', { skip }, async () => {
  hosted.store('Shop').create('Customers', { Id: 3, Name: 'Cleo' });
  const page = await open('Shop');
  await page.locator('.row:not(.head)', { hasText: 'Cleo' }).click();
  await page.locator('.sheet .record-title', { hasText: 'Cleo' }).waitFor();
  let refuse = true;
  let patches = 0;
  await page.route(/\/records\/\d+$/, (route) => {
    if (route.request().method() !== 'PATCH') return route.continue();
    patches++;
    if (refuse) return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ messages: [{ code: '500', message: 'Refused' }], response: {} }) });
    return route.continue();
  });
  await page.getByRole('button', { name: 'Add to orders' }).click();
  await page.keyboard.type('Pickle');
  await page.keyboard.press('Enter');
  await until(() => page.locator('.sheet .saved').first().textContent(), (t) => !!t && t !== 'Saving…');
  await page.locator('.sheet .sheet-crumb').click();
  await settle(page);
  assert.equal(patches, 1);
  assert.equal(rowsOf('Shop', 'Orders', 'Item', 'Pickle'), 0);
  refuse = false;
  await page.getByRole('button', { name: 'Retry' }).click();
  await until(async () => rowsOf('Shop', 'Orders', 'Item', 'Pickle'), (n) => n === 1);
  await until(async () => page.locator('.sheet .mini-new').count(), (n) => n === 0);
  await settle(page);
  assert.equal(rowsOf('Shop', 'Orders', 'Item', 'Pickle'), 1);
});

test('after a gateway error a related row may still be committed late: nothing is sent again until Add anyway', { skip }, async () => {
  hosted.store('Shop').create('Customers', { Id: 12, Name: 'Lou' });
  const page = await open('Shop');
  await page.locator('.row:not(.head)', { hasText: 'Lou' }).click();
  await page.locator('.sheet .record-title', { hasText: 'Lou' }).waitFor();
  let patches = 0;
  let gateway = true;
  await page.route(/\/records\/\d+$/, (route) => {
    if (route.request().method() !== 'PATCH') return route.continue();
    patches++;
    // The proxy answers 502 and the server finishes the request after the client has looked at the list.
    if (gateway) return route.fulfill({ status: 502, contentType: 'text/plain', body: 'Bad gateway' });
    return route.continue();
  });
  await page.getByRole('button', { name: 'Add to orders' }).click();
  await page.keyboard.type('Chutney');
  await page.keyboard.press('Enter');
  await until(() => page.locator('.sheet .saved').first().textContent(), (t) => !!t && t !== 'Saving…');
  await page.locator('.sheet .sheet-crumb').click();
  await settle(page);
  assert.equal(patches, 1, 'leaving the row sends nothing');
  assert.equal(await page.getByRole('button', { name: 'Retry' }).count(), 0, 'it is not offered as a plain Retry');
  // The list shows nothing yet; looking again still sends nothing.
  await page.getByRole('button', { name: 'Check again' }).click();
  await page.locator('.sheet .mini-note', { hasText: /late|still/ }).waitFor();
  await settle(page);
  assert.equal(patches, 1);
  assert.equal(rowsOf('Shop', 'Orders', 'Item', 'Chutney'), 0);
  gateway = false;
  await page.getByRole('button', { name: 'Add anyway' }).click();
  await until(async () => rowsOf('Shop', 'Orders', 'Item', 'Chutney'), (n) => n === 1);
  assert.equal(patches, 2);
});

test('a refused save keeps its draft, and neither another field saving nor clicking away sends it again or loses it', { skip }, async () => {
  hosted.store('Shop').create('Customers', { Id: 6, Name: 'Gus', City: 'Leeds' });
  const page = await open('Shop');
  await page.locator('.row:not(.head)', { hasText: 'Gus' }).click();
  await page.locator('.sheet .record-title', { hasText: 'Gus' }).waitFor();
  let refuse = true;
  const sent: string[] = [];
  await page.route(/\/records\/\d+$/, (route) => {
    if (route.request().method() !== 'PATCH') return route.continue();
    const fields = Object.keys(JSON.parse(route.request().postData() ?? '{}').fieldData ?? {});
    sent.push(fields.join());
    if (refuse && fields.includes('Name')) return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ messages: [{ code: '500', message: 'Refused' }], response: {} }) });
    return route.continue();
  });
  await page.locator('.sheet .record-title').click();
  await page.locator('.sheet input.editor').fill('Gustav');
  await page.keyboard.press('Enter');
  await until(() => page.locator('.sheet .saved').first().textContent(), (t) => !!t && t !== 'Saving…');
  // Clicking another field blurs the failed one: nothing is retried.
  await page.locator('.sheet dd .value', { hasText: 'Leeds' }).click();
  await settle(page);
  assert.deepEqual(sent, ['Name'], 'no retry on blur');
  // The other field saves; the panel is drawn again but the draft stays.
  await page.locator('.sheet select.editor').selectOption('Paris');
  await until(async () => sent.length, (n) => n === 2);
  await page.locator('.sheet dd .value', { hasText: 'Paris' }).waitFor();
  assert.equal(await page.locator('.sheet input.editor.record-title').inputValue(), 'Gustav', 'the draft survived the other save');
  refuse = false;
  await page.locator('.sheet input.editor.record-title').press('Enter');
  await page.locator('.sheet .record-title', { hasText: 'Gustav' }).waitFor();
  assert.deepEqual(sent, ['Name', 'City', 'Name']);
  assert.equal(hosted.store('Shop').find('Customers', { limit: 50 }).records.find((x) => x.fieldData['Name'] === 'Gustav')?.fieldData['City'], 'Paris');
});

test('a failed related row survives another field saving, and an editor opened meanwhile is not torn down', { skip }, async () => {
  hosted.store('Shop').create('Customers', { Id: 7, Name: 'Hal', City: 'Leeds' });
  const page = await open('Shop');
  await page.locator('.row:not(.head)', { hasText: 'Hal' }).click();
  await page.locator('.sheet .record-title', { hasText: 'Hal' }).waitFor();
  let refuse = true;
  const sent: string[] = [];
  await page.route(/\/records\/\d+$/, (route) => {
    if (route.request().method() !== 'PATCH') return route.continue();
    const body = JSON.parse(route.request().postData() ?? '{}');
    sent.push(body.portalData ? 'portal' : Object.keys(body.fieldData ?? {}).join());
    if (refuse && body.portalData) return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ messages: [{ code: '500', message: 'Refused' }], response: {} }) });
    return route.continue();
  });
  await page.getByRole('button', { name: 'Add to orders' }).click();
  await page.keyboard.type('Relish');
  await page.keyboard.press('Enter');
  await page.locator('.sheet .mini-note').waitFor();
  await page.locator('.sheet dd .value', { hasText: 'Leeds' }).click();
  await page.locator('.sheet select.editor').selectOption('York');
  await page.locator('.sheet dd .value', { hasText: 'York' }).waitFor();
  assert.equal(await page.locator('.sheet .mini-new input').first().inputValue(), 'Relish', 'the row stayed with what was typed');
  assert.equal(await page.locator('.sheet .mini-note').count(), 1);
  assert.deepEqual(sent, ['portal', 'City']);
  refuse = false;
  await page.getByRole('button', { name: 'Retry' }).click();
  await until(async () => rowsOf('Shop', 'Orders', 'Item', 'Relish'), (n) => n === 1);
  await until(async () => page.locator('.sheet .mini-new').count(), (n) => n === 0);
});

test('a field edit whose answer was lost is found saved from the record, with no false conflict', { skip }, async () => {
  hosted.store('Shop').create('Customers', { Id: 4, Name: 'Cy' });
  const page = await open('Shop');
  await page.locator('.row:not(.head)', { hasText: 'Cy' }).click();
  await page.locator('.sheet .record-title', { hasText: 'Cy' }).waitFor();
  const counted = { patches: 0 };
  await loseResponses(page, counted);
  await page.locator('.sheet .record-title').click();
  await page.locator('.sheet input.editor').fill('Cyrus');
  await page.keyboard.press('Enter');
  await page.locator('.sheet .record-title', { hasText: 'Cyrus' }).waitFor();
  assert.equal(await page.locator('.sheet input.editor').count(), 0, 'the edit counts as saved');
  assert.equal(counted.patches, 1);
  await page.locator('.sheet .record-title').click();
  await page.locator('.sheet input.editor').fill('Cyrus II');
  await page.keyboard.press('Enter');
  await page.locator('.sheet .record-title', { hasText: 'Cyrus II' }).waitFor();
  assert.equal(await page.locator('.toast.error').count(), 0);
});

test('a field edit whose answer was lost does not overwrite what someone else wrote meanwhile', { skip }, async () => {
  hosted.store('Shop').create('Customers', { Id: 8, Name: 'Orig' });
  const page = await open('Shop');
  await page.locator('.row:not(.head)', { hasText: 'Orig' }).click();
  await page.locator('.sheet .record-title', { hasText: 'Orig' }).waitFor();
  const id = hosted.store('Shop').find('Customers', { limit: 50 }).records.find((x) => x.fieldData['Name'] === 'Orig')!.recordId;
  const name = () => hosted.store('Shop').find('Customers', { limit: 50 }).records.find((x) => x.recordId === id)!.fieldData['Name'];
  let renamed = false;
  await page.route(/\/records\/\d+$/, async (route) => {
    if (route.request().method() === 'PATCH' && !renamed) {
      renamed = true;
      hosted.store('Shop').update('Customers', id, { Name: 'Theirs' });
      return route.abort('failed');
    }
    return route.continue();
  });
  await page.locator('.sheet .record-title').click();
  await page.locator('.sheet input.editor').fill('Mine');
  await page.keyboard.press('Enter');
  await page.locator('.sheet .toast, .toast.error').first().waitFor();
  assert.match(await page.locator('.toast').textContent() ?? '', /Theirs/, 'their value is shown');
  assert.equal(await page.locator('.sheet input.editor').inputValue(), 'Mine', 'the draft is kept');
  await page.keyboard.press('Enter');
  await until(() => page.locator('.sheet .saved').first().textContent(), (t) => !!t && t !== 'Saving…');
  assert.equal(name(), 'Theirs', 'their change was not overwritten');
  assert.match(await page.locator('.toast').textContent() ?? '', /Someone else/);
});

test('a kept conflict draft is not sent after another save moved the record on', { skip }, async () => {
  hosted.store('Shop').create('Customers', { Id: 50, Name: 'Rex' });
  const page = await open('Shop');
  await page.locator('.row:not(.head)', { hasText: 'Rex' }).click();
  await page.locator('.sheet .record-title', { hasText: 'Rex' }).waitFor();
  const id = hosted.store('Shop').find('Customers', { limit: 80 }).records.find((x) => x.fieldData['Name'] === 'Rex')!.recordId;
  const name = () => hosted.store('Shop').find('Customers', { limit: 80 }).records.find((x) => x.recordId === id)!.fieldData['Name'];
  let renamed = false;
  const sent: string[] = [];
  await page.route(/\/records\/\d+$/, async (route) => {
    if (route.request().method() === 'PATCH') {
      const body = JSON.parse(route.request().postData() ?? '{}');
      sent.push(body.portalData ? 'portal' : Object.keys(body.fieldData ?? {}).join());
      if (!renamed && !body.portalData) {
        renamed = true;
        hosted.store('Shop').update('Customers', id, { Name: 'Theirs' });
        return route.abort('failed');
      }
    }
    return route.continue();
  });
  await page.locator('.sheet .record-title').click();
  await page.locator('.sheet input.editor').fill('Mine');
  await page.keyboard.press('Enter');
  await until(async () => page.locator('.toast').textContent(), (t) => /Theirs/.test(t ?? ''));
  // Another save on the same record refreshes it, and with it the modId.
  await page.getByRole('button', { name: 'Add to orders' }).click();
  await page.keyboard.type('Jam');
  await page.keyboard.press('Enter');
  await until(() => page.locator('.sheet .related .mini-row .cell:first-child').allTextContents(), (n) => n.includes('Jam'));
  assert.equal(await page.locator('.sheet input.editor.record-title').inputValue(), 'Mine', 'the draft is kept');
  await page.locator('.sheet input.editor.record-title').press('Enter');
  await settle(page);
  assert.equal(name(), 'Theirs', 'their change was not overwritten');
  assert.deepEqual(sent, ['Name', 'portal'], 'the draft was not sent again');
  assert.match(await page.locator('.toast').textContent() ?? '', /Someone else/);
});

test('a draft is not sent over someone else\'s value when the read after a related add failed', { skip }, async () => {
  hosted.store('Shop').create('Customers', { Id: 52, Name: 'Rox' });
  const page = await open('Shop');
  await page.locator('.row:not(.head)', { hasText: 'Rox' }).click();
  await page.locator('.sheet .record-title', { hasText: 'Rox' }).waitFor();
  const id = hosted.store('Shop').find('Customers', { limit: 80 }).records.find((x) => x.fieldData['Name'] === 'Rox')!.recordId;
  const name = () => hosted.store('Shop').find('Customers', { limit: 80 }).records.find((x) => x.recordId === id)!.fieldData['Name'];
  let refuse = true, failGet = false;
  const sent: string[] = [];
  await page.route(/\/records\/\d+$/, async (route) => {
    const method = route.request().method();
    if (method === 'GET' && failGet) { failGet = false; return route.abort('failed'); }
    if (method === 'PATCH') {
      const body = JSON.parse(route.request().postData() ?? '{}');
      sent.push(body.portalData ? 'portal' : 'Name');
      if (body.portalData) { const answer = await route.fetch(); failGet = true; return route.fulfill({ response: answer }); }
      if (refuse) { refuse = false; return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ messages: [{ code: '500', message: 'Refused' }], response: {} }) }); }
    }
    return route.continue();
  });
  await page.locator('.sheet .record-title').click();
  await page.locator('.sheet input.editor').fill('Mine');
  await page.keyboard.press('Enter');
  await until(() => page.locator('.sheet .saved').first().textContent(), (t) => !!t && t !== 'Saving…');
  hosted.store('Shop').update('Customers', id, { Name: 'Theirs' });
  await page.getByRole('button', { name: 'Add to orders' }).click();
  await page.keyboard.type('Jam');
  await page.keyboard.press('Enter');
  await until(async () => sent.includes('portal'), (v) => v);
  await settle(page);
  await page.locator('.sheet input.editor.record-title').press('Enter');
  await settle(page);
  assert.equal(name(), 'Theirs', 'their change was not overwritten');
  assert.equal(await page.locator('.sheet input.editor.record-title').inputValue(), 'Mine', 'the draft is kept');
});

test('text that only looks like a number is not taken for what was saved after a lost answer', { skip }, async () => {
  hosted.store('Shop').create('Customers', { Id: 51, Name: '1234' });
  const page = await open('Shop');
  await page.locator('.row:not(.head)', { hasText: '1234' }).click();
  await page.locator('.sheet .record-title', { hasText: '1234' }).waitFor();
  let dropped = false;
  await page.route(/\/records\/\d+$/, async (route) => {
    if (route.request().method() === 'PATCH' && !dropped) { dropped = true; return route.abort('failed'); }
    return route.continue();
  });
  await page.locator('.sheet .record-title').click();
  await page.locator('.sheet input.editor').fill('01234');
  await page.keyboard.press('Enter');
  await until(() => page.locator('.sheet .saved').first().textContent(), (t) => !!t && t !== 'Saving…');
  assert.equal(await page.locator('.sheet input.editor').count(), 1, 'nothing was saved, so the draft stays');
  assert.notEqual(await page.locator('.sheet .saved').first().textContent(), 'Saved');
  assert.equal(hosted.store('Shop').find('Customers', { limit: 80 }).records.find((x) => String(x.fieldData['Id']) === '51')!.fieldData['Name'], '1234');
});

test('a date edit whose answer was lost is found saved though the file pads the date', { skip }, async () => {
  hosted.store('Dated').create('Orders', { CustomerId: 99, Item: 'Seed', Due: '01/02/2026' });
  const page = await open('Dated');
  await page.locator('.rail-item', { hasText: 'Orders' }).click();
  await page.locator('.row:not(.head)', { hasText: 'Seed' }).click();
  await page.locator('.sheet .record-title', { hasText: 'Seed' }).waitFor();
  const counted = { patches: 0 };
  await loseResponses(page, counted);
  await page.locator('.sheet dt', { hasText: 'Due' }).locator('xpath=following-sibling::dd[1]').locator('.value').click();
  await page.locator('.sheet input.editor').fill('2026-04-07');
  await page.keyboard.press('Enter');
  await until(async () => hosted.store('Dated').find('Orders', { limit: 10 }).records.find((x) => x.fieldData['Item'] === 'Seed')?.fieldData['Due'], (v) => v === '04/07/2026');
  await until(async () => page.locator('.sheet input.editor').count(), (n) => n === 0);
  await settle(page);
  assert.equal(counted.patches, 1);
  assert.equal(await page.locator('.toast.error').count(), 0, 'saved, not "could not confirm"');
});

test('a field edit that did not reach the server keeps its draft, and Enter saves it', { skip }, async () => {
  hosted.store('Shop').create('Customers', { Id: 5, Name: 'Dot' });
  const page = await open('Shop');
  await page.locator('.row:not(.head)', { hasText: 'Dot' }).click();
  await page.locator('.sheet .record-title', { hasText: 'Dot' }).waitFor();
  let drop = true;
  let patches = 0;
  await page.route(/\/records\/\d+$/, (route) => {
    if (route.request().method() !== 'PATCH') return route.continue();
    patches++;
    return drop ? route.abort('failed') : route.continue();
  });
  await page.locator('.sheet .record-title').click();
  await page.locator('.sheet input.editor').fill('Dorothy');
  await page.keyboard.press('Enter');
  await until(() => page.locator('.sheet .saved').first().textContent(), (t) => !!t && t !== 'Saving…');
  assert.equal(await page.locator('.sheet input.editor').inputValue(), 'Dorothy', 'the draft is kept');
  drop = false;
  await page.keyboard.press('Enter');
  await page.locator('.sheet .record-title', { hasText: 'Dorothy' }).waitFor();
  assert.equal(patches, 2);
});

test('an in-flight save does not redraw the panel while another record is opening', { skip }, async () => {
  hosted.store('Shop').create('Customers', { Id: 10, Name: 'Jo' });
  hosted.store('Shop').create('Customers', { Id: 11, Name: 'Kim' });
  const page = await open('Shop');
  await page.locator('.row:not(.head)', { hasText: 'Jo' }).click();
  await page.locator('.sheet .record-title', { hasText: 'Jo' }).waitFor();
  const kimId = hosted.store('Shop').find('Customers', { limit: 50 }).records.find((x) => x.fieldData['Name'] === 'Kim')!.recordId;
  let freePatch!: () => void, freeKim!: () => void;
  const patchHeld = new Promise<void>((resolve) => { freePatch = resolve; });
  const kimHeld = new Promise<void>((resolve) => { freeKim = resolve; });
  let patched = false;
  await page.route(/\/records\/\d+$/, async (route) => {
    const request = route.request();
    if (request.method() === 'PATCH') { await patchHeld; const answer = await route.fetch(); patched = true; return route.fulfill({ response: answer }); }
    if (request.method() === 'GET' && request.url().endsWith(`/records/${kimId}`)) { await kimHeld; }
    return route.continue();
  });
  await page.locator('.sheet .record-title').click();
  await page.locator('.sheet input.editor').fill('Joanna');
  await page.keyboard.press('Enter');
  await page.locator('.row:not(.head)', { hasText: 'Kim' }).click();
  freePatch();
  await until(async () => patched, (v) => v);
  await settle(page);
  // Jo's save is done, but the panel was not drawn again for Jo: Kim is the record being opened.
  assert.equal(await page.locator('.sheet .saved.ok').count(), 0);
  freeKim();
  await page.locator('.sheet .record-title', { hasText: 'Kim' }).waitFor();
});

test('an address with a broken escape opens the default collection', { skip }, async () => {
  const page = await open('Town');
  await page.goto(hosted.url + '/next/#/%E0%A4%A/%');
  await page.reload();
  await page.locator('.rail-item').first().waitFor();
  await page.locator('.row:not(.head)').first().waitFor();
  assert.deepEqual(page.errors, []);
});

test('Escape in the page editor asks about a draft every time, and a closed editor leaves the page', { skip }, async () => {
  const page = await open('Gallery');
  await page.locator('.rail-pages .rail-item', { hasText: 'Welcome' }).click();
  await page.locator('.page-frame iframe').waitFor();
  let asked = 0;
  let accept = false;
  page.on('dialog', (d) => { asked++; void (accept ? d.accept() : d.dismiss()); });
  await page.getByRole('button', { name: 'Edit page' }).click();
  const code = page.getByRole('textbox', { name: 'Page HTML, CSS and JavaScript' });
  await until(() => code.inputValue(), (v) => v.includes('<h1'));
  await code.fill('<h1>A draft</h1>');
  // Escape in the code leaves the code (it never closes the editor, nor asks).
  await page.keyboard.press('Escape');
  assert.equal(asked, 0);
  assert.equal(await page.locator('dialog.page-editor[open]').count(), 1);
  await page.getByRole('button', { name: 'Cancel' }).focus();
  for (let i = 1; i <= 4; i++) {
    await page.keyboard.press('Escape');
    await until(async () => asked, (n) => n === i);
    assert.equal(await page.locator('dialog.page-editor[open]').count(), 1, `still open after Escape ${i}`);
  }
  accept = true;
  await page.keyboard.press('Escape');
  await page.locator('dialog.page-editor').waitFor({ state: 'detached' });
  assert.equal(asked, 5);
  // Nothing was changed: Escape closes it without asking, and it leaves the page.
  await page.getByRole('button', { name: 'Edit page' }).click();
  await page.locator('dialog.page-editor[open]').waitFor();
  await page.getByRole('button', { name: 'Cancel' }).focus();
  await page.keyboard.press('Escape');
  await page.locator('dialog.page-editor').waitFor({ state: 'detached' });
  assert.equal(asked, 5);
});

test('a saved session that cannot be read is dropped, and the sign-in does not call it an outage', { skip }, async () => {
  const page = await window(await browser.newContext());
  for (const bad of ['{bad', 'null', '{"db":"Town"}']) {
    await page.goto(hosted.url + '/next/');
    await page.evaluate((v) => sessionStorage.setItem('tabularius.session', v), bad);
    await page.reload();
    await page.locator('form.signin').waitFor();
    assert.equal(await page.evaluate(() => sessionStorage.getItem('tabularius.session')), null, bad);
    assert.doesNotMatch(await page.locator('.signin-error').textContent() ?? '', /reach the server|Expected property/, bad);
    await page.reload();
    await page.locator('form.signin').waitFor();
    assert.doesNotMatch(await page.locator('.signin-error').textContent() ?? '', /reach the server|Expected property/, bad);
  }
});

test('a saved session the server answers with an error says what happened, keeps the session, and has a Retry that works', { skip }, async () => {
  const page = await open('Town');
  const saved = await page.evaluate(() => sessionStorage.getItem('tabularius.session'));
  let status = 0;
  let code = -1;
  await page.route(/\/tabularius\/app\/v1\/databases\/[^/]+\/layouts$/, (route) => status
    ? route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ error: { code, message: `status ${status}` } }) })
    : route.continue());
  for (const [s, c, text] of [[503, -1, /Could not reach the server/], [429, -1, /Too many requests/], [404, 802, /could not be opened/], [400, -1, /status 400/]] as const) {
    status = s; code = c;
    await page.evaluate((v) => sessionStorage.setItem('tabularius.session', v!), saved);
    await page.reload();
    await page.locator('form.signin').waitFor();
    const message = await page.locator('.signin-error').textContent() ?? '';
    assert.match(message, text, String(s));
    if (s !== 503) assert.doesNotMatch(message, /reach the server/, String(s));
    assert.notEqual(await page.evaluate(() => sessionStorage.getItem('tabularius.session')), null, `${s} keeps the session`);
    assert.equal(await page.getByRole('button', { name: 'Retry' }).count(), 1, `${s} has a Retry`);
  }
  status = 0;
  await page.getByRole('button', { name: 'Retry' }).click();
  await page.locator('.rail-item').first().waitFor();
});

test('the sign-in Retry waits out a 429, is off while a try runs, and does not race the Open form', { skip }, async () => {
  const page = await open('Town');
  const saved = await page.evaluate(() => sessionStorage.getItem('tabularius.session'));
  let mode: 'wait' | 'busy' | 'hold' | 'pass' = 'wait';
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  await page.route(/\/tabularius\/app\/v1\/databases\/[^/]+\/layouts$/, async (route) => {
    if (mode === 'wait') return route.fulfill({ status: 429, headers: { 'retry-after': '3' }, contentType: 'application/json', body: JSON.stringify({ error: { code: -1, message: 'Slow down' } }) });
    if (mode === 'busy') return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: -1, message: 'Busy' } }) });
    if (mode === 'hold') { await held; return route.continue(); }
    return route.continue();
  });
  await page.evaluate((v) => sessionStorage.setItem('tabularius.session', v!), saved);
  await page.reload();
  await page.locator('form.signin').waitFor();
  const retry = page.getByRole('button', { name: 'Retry' });
  assert.match(await page.locator('.signin-error').textContent() ?? '', /3 seconds/);
  assert.equal(await retry.isDisabled(), true, 'Retry is off while the server asks to wait');
  await until(() => retry.isEnabled(), (on) => on);
  // A try that is running locks the Open form.
  mode = 'hold';
  await retry.click();
  assert.equal(await retry.isDisabled(), true, 'one try at a time');
  assert.equal(await page.getByRole('button', { name: 'Open', exact: true }).isDisabled(), true, 'Open waits for the Retry');
  release();
  await page.locator('.rail-item').first().waitFor();
  // And a sign-in that is running locks Retry.
  mode = 'busy';
  await page.evaluate((v) => sessionStorage.setItem('tabularius.session', v!), saved);
  await page.reload();
  await page.locator('form.signin').waitFor();
  let freeLogin!: () => void;
  const login = new Promise<void>((resolve) => { freeLogin = resolve; });
  await page.route(/\/sessions$/, async (route) => { if (route.request().method() === 'POST') await login; return route.continue(); });
  await page.locator('input[name="account"]').fill('Ann');
  await page.locator('input[name="password"]').fill(PASSWORD);
  if (await page.locator('select[name="db"]').count()) await page.locator('select[name="db"]').selectOption('Town');
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Retry' }).isDisabled(), true, 'Retry waits for the sign-in');
  mode = 'pass';
  freeLogin();
  await page.locator('.rail-item').first().waitFor();
});

test('text typed in the page editor while it saves is kept, not closed over', { skip }, async () => {
  const page = await open('Gallery');
  await page.locator('.rail-pages .rail-item', { hasText: 'Welcome' }).click();
  await page.locator('.page-frame iframe').waitFor();
  await page.getByRole('button', { name: 'Edit page' }).click();
  const code = page.getByRole('textbox', { name: 'Page HTML, CSS and JavaScript' });
  await until(() => code.inputValue(), (v) => v.includes('<h1'));
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  let saves = 0;
  await page.route(/\/tabularius\/design\/v1\/databases\/[^/]+$/, async (route) => {
    if (route.request().method() === 'POST') { saves++; await held; }
    return route.continue();
  });
  await code.fill('<h1 id=t>First</h1>');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await until(async () => saves, (n) => n === 1);
  await code.press('End');
  await page.keyboard.type('<!-- typed while saving -->');
  release();
  await until(() => page.locator('.page-error').textContent(), (t) => /typed while saving|unsaved/i.test(t ?? ''));
  assert.equal(await page.locator('dialog.page-editor[open]').count(), 1);
  assert.match(await code.inputValue(), /typed while saving/);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.locator('dialog.page-editor').waitFor({ state: 'detached' });
  await until(async () => pageSource(hosted.store('Gallery').design('Welcome')!.objects[0].webUrl), (h) => /typed while saving/.test(h ?? ''));
});
