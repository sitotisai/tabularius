// The alternative client's guesses and search parsing (packages/web/next), without a browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collections, humanize, isKey, layoutRoute, listColumns, pages, pickTitle, type Column } from '../next/model.ts';
import { parse, requests, unparse } from '../next/query.ts';
import { score } from '../next/palette.ts';
import { show, fromInputDate, toInputDate, initials } from '../next/values.ts';
import type { FieldMeta, LayoutMeta } from '../src/types.ts';

const col = (name: string, type = 'text'): Column => ({ name, label: humanize(name), type, key: isKey(name), calculated: false, readOnly: false });

test('field names read as words', () => {
  assert.equal(humanize('first_name'), 'First name');
  assert.equal(humanize('DateCreated'), 'Date created');
  assert.equal(humanize('INVOICE LINES'), 'Invoice lines');
  assert.equal(humanize('URL'), 'URL');
  assert.equal(humanize('Customers::Name'), 'Name');
  assert.equal(humanize('_kp_ID'), 'Kp ID');
});

test('keys are told apart from data', () => {
  for (const k of ['id', 'ID', '_kp_id', 'kf_customer', 'customer_id', 'id_foreign', 'uuid', 'PrimaryKey_pk', 'zzCreated']) assert.ok(isKey(k), k);
  for (const k of ['Name', 'Paid', 'Video', 'Identity', 'Kind', 'Description']) assert.ok(!isKey(k), k);
});

test('a record is named by its name or title field, else its first text field', () => {
  assert.equal(pickTitle([col('id'), col('City'), col('Name')]), 'Name');
  assert.equal(pickTitle([col('Amount', 'number'), col('Product Name')]), 'Product Name');
  assert.equal(pickTitle([col('id'), col('Notes')]), 'Notes');
  assert.equal(pickTitle([col('id'), col('Total', 'number')]), undefined);
});

function meta(name: string, table: string, fields: FieldMeta[], portals: LayoutMeta['portals'] = [], related: Record<string, FieldMeta[]> = {}): LayoutMeta {
  return { layout: { name, id: 1, occurrence: table, table }, fields: { [table]: fields, ...related }, portals } as unknown as LayoutMeta;
}
const f = (name: string, type = 'text', more: Partial<FieldMeta> = {}): FieldMeta => ({ name, type, calculated: false, summary: false, global: false, ...more });

test('each table becomes one collection, read through the layout that shows most of it', () => {
  const people = [f('id'), f('Name'), f('City'), f('Photo', 'container'), f('g_search', 'text', { global: true })];
  const out = collections([
    { meta: meta('People list', 'People', people), hidden: false, placed: ['Name'] },
    { meta: meta('People detail', 'People', people, [{ name: 'Orders', occurrenceId: 2, occurrence: 'People.Orders', fields: ['People.Orders::Total', 'People.Orders::id'] }], { 'People.Orders': [f('id'), f('Total', 'number')] }), hidden: false, placed: ['id', 'Name', 'City', 'Photo', 'g_search'] },
    { meta: meta('zz_Dev', 'Settings', [f('Theme')]), hidden: true },
  ]);
  assert.deepEqual(out.map((c) => [c.label, c.layout, c.quiet]), [['People', 'People detail', false], ['Settings', 'zz_Dev', true]]);
  const p = out[0];
  assert.deepEqual(p.columns.map((c) => c.name), ['id', 'Name', 'City', 'Photo'], 'globals are left out');
  assert.equal(p.title, 'Name');
  assert.equal(p.image, 'Photo');
  assert.deepEqual(p.related.map((r) => [r.label, r.columns.map((c) => c.name)]), [['Orders', ['People.Orders::Total']]]);
  assert.deepEqual(listColumns(p).map((c) => c.name), ['Name', 'City'], 'no keys or pictures as columns');
});

test('a search splits into words and field filters, and becomes find requests', () => {
  const cols = [col('Name'), col('City'), col('First Name'), col('Total', 'number')];
  assert.deepEqual(parse('ada city: Leeds', cols), { words: 'ada', filters: [{ field: 'City', label: 'City', value: 'Leeds' }] });
  assert.deepEqual(parse('first name: "Ada Mae"', cols).filters, [{ field: 'First Name', label: 'First name', value: 'Ada Mae' }]);
  assert.deepEqual(parse('total:>500', cols).filters, [{ field: 'Total', label: 'Total', value: '>500' }]);
  assert.deepEqual(parse('note: hi', cols), { words: 'note:hi', filters: [] }, 'an unknown field stays as words');
  const s = parse('ada total: >5', cols);
  assert.deepEqual(requests(s, [cols[0], cols[1]]), [{ Total: '>5', Name: 'ada' }, { Total: '>5', City: 'ada' }]);
  assert.deepEqual(requests(parse('city: York', cols), cols), [{ City: 'York' }]);
  assert.deepEqual(requests(parse('', cols), cols), []);
  assert.equal(unparse(parse('ada first name: "Ada Mae"', cols)), 'first name: "Ada Mae" ada');
});

test('the command bar ranks prefixes, then word starts, then scattered letters', () => {
  assert.ok(score('cust', 'Customers') > score('cust', 'New customer'));
  assert.ok(score('nc', 'New customer') > 0);
  assert.equal(score('xyz', 'Customers'), 0);
});

test('values read as words; dates go to and from the date picker', () => {
  assert.equal(show(''), '');
  assert.equal(show('hello', { type: 'text' }), 'hello');
  assert.equal(toInputDate('3/7/2026'), '2026-03-07');
  assert.equal(fromInputDate('2026-03-07'), '3/7/2026');
  assert.equal(initials('Ada Lovelace'), 'AL');
  assert.equal(initials('Grace'), 'GR');
});

test('a layout that is one web viewer is a page; one with fields or a portal beside it is not', () => {
  const viewer = (id: number, jsBridge = true) => ({ id, kind: 'web-viewer', webUrl: '"https://example.com"', webOptions: { jsBridge } });
  const withDesign = (name: string, objects: unknown[]) => ({ ...meta(name, 'Sales', [f('Total', 'number')]), design: { objects } }) as unknown as LayoutMeta;
  const out = pages([
    { meta: withDesign('Dashboard', [viewer(1), { id: 2, kind: 'text' }]), hidden: false },
    { meta: withDesign('Map', [viewer(1, false)]), hidden: false },
    { meta: withDesign('Form', [viewer(1), { id: 2, kind: 'field', field: { field: 'Total' } }]), hidden: false },
    { meta: withDesign('Two', [viewer(1), viewer(2)]), hidden: false },
    { meta: withDesign('Hidden', [viewer(1)]), hidden: true },
  ]);
  assert.deepEqual(out, [
    { layout: 'Dashboard', table: 'Sales', viewer: 1, bridge: true },
    { layout: 'Map', table: 'Sales', viewer: 1, bridge: false },
  ]);
});

// ---------------------------------------------------------------------------------------------- sign in

test('with the file list off, the sign-in names the file by typing it, as the classic client does', async () => {
  const { fileField } = await import('../next/signin.ts');
  const { ApiError } = await import('../src/api.ts');
  // The default server answers a caller who has not signed in with 404 and FileMaker error 3.
  const off = new ApiError(3, 'The list of files is turned off on this server: name the file in the address', undefined, 404);
  assert.deepEqual(fileField([], off), { kind: 'typed' });
  assert.deepEqual(fileField(['Town', 'Shop'], undefined), { kind: 'choose', files: ['Town', 'Shop'] });
  assert.deepEqual(fileField(['Town'], undefined), { kind: 'choose', files: ['Town'] });
  // A server that cannot be reached still lets the name be typed, and the sign-in then says why it failed.
  assert.deepEqual(fileField([], new TypeError('fetch failed')), { kind: 'typed' });
  // Only a server that lists its files publicly and has none is "no files hosted".
  assert.deepEqual(fileField([], undefined), { kind: 'none' });
});

test('?db= names the file to sign in to, and a name this browser remembers is used only when it can be picked', async () => {
  const { wantedFile } = await import('../next/signin.ts');
  assert.equal(wantedFile('?db=Town%20Hall', ['A'], 'A'), 'Town Hall', 'the address wins, listed or not (typed)');
  assert.equal(wantedFile('', ['A', 'B'], 'B'), 'B');
  assert.equal(wantedFile('', ['A', 'B'], 'Gone'), undefined, 'a remembered file that is no longer listed is not picked');
  assert.equal(wantedFile('', [], 'Town'), 'Town', 'with nothing listed the remembered name is offered in the typed field');
  assert.equal(wantedFile('?db=', ['A'], undefined), undefined);
});

test('the sign-in says what a refusal needs next: a code, or another client for what this one cannot do', async () => {
  const { signInProblem } = await import('../next/signin.ts');
  const { ApiError } = await import('../src/api.ts');
  assert.deepEqual(signInProblem(new ApiError(1211, 'A code is needed'), ''), { ask: 'code', text: 'Enter the code from your authenticator app.' });
  assert.deepEqual(signInProblem(new ApiError(1211, 'A code is needed'), '123456'), { ask: 'code', text: 'That code is not valid; check your authenticator app.' });
  assert.match(signInProblem(new ApiError(9000, 'passkey'), '').text, /passkey.*classic client/i);
  assert.match(signInProblem(new ApiError(212, 'no'), '').text, /account name or password is wrong/);
  assert.match(signInProblem(new ApiError(212, 'Too many failed sign-ins; try again after 2030-01-01T10:00:00Z'), '').text, /Too many tries/);
  assert.equal(signInProblem(new Error('Failed to fetch'), '').text, 'Failed to fetch');
  assert.equal(signInProblem(new ApiError(212, 'no'), '').ask, undefined);
});

test('an account that must change its password is sent to the classic client, not let into a half-open file', async () => {
  const { mustChangeText } = await import('../next/signin.ts');
  assert.match(mustChangeText(), /must change its password/);
  assert.match(mustChangeText(), /\/app\//);
});

// Wiring regressions for #158 and #159 are still checked against the source text: their behaviour needs a page with a web viewer, which the e2e file covers only for the bridge. #145 and #151 are behaviour tests in e2e/next.e2e.ts.
const mainSource = (await import('node:fs')).readFileSync(new URL('../next/main.ts', import.meta.url), 'utf8');

test('#160 short years and precise numeric strings keep their stored meaning', () => {
  const d = new Date(2000, 0, 1); d.setFullYear(50);
  assert.equal(show('01/01/0050', { type: 'date' }), d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }));
  assert.equal(show('12345678901234567', { type: 'number' }), '12345678901234567');
  assert.equal(show('0.12345678901234567', { type: 'number' }), '0.12345678901234567');
});
test('#158 pages carry allowed viewer hosts from their layout', () => {
  const m = meta('Map', 'Places', []);
  m.webViewerHosts = ['https://example.com'];
  m.design = { objects: [{ id: 1, kind: 'web-viewer' }] } as LayoutMeta['design'];
  assert.deepEqual((pages([{ meta: m, hidden: false }])[0] as unknown as { hosts: string[] }).hosts, m.webViewerHosts);
  assert.match(mainSource, /webViewer\(address, p.bridge, p.hosts\)/);
});
test('#159 unsupported bridge methods explain the client limitation', () => {
  assert.match(mainSource, /not supported in \/next\/; use \/app\//);
});
test('#159 the page bridge offers layouts, goToLayout, valueList and print', () => {
  for (const call of ['layouts', 'goToLayout', 'valueList', 'print']) assert.match(mainSource, new RegExp(`case '${call}':`));
  assert.match(mainSource, /layouts: metas\.filter\(\(m\) => !m\.hidden\)/);
  assert.match(mainSource, /printing: menu\.printing !== false/);
  assert.match(mainSource, /if \(!this\.model\.printing\) throw new Error\('This account isn\\'t allowed to print\.'\)/);
});
test('#159 a layout name leads to its page, or to the collection that shows its table', () => {
  const people = meta('People', 'People', [f('Name')]);
  const detail = meta('Person detail', 'People', [f('Name')]);
  const map = meta('Map', 'Places', []);
  map.design = { objects: [{ id: 1, kind: 'web-viewer' }] } as LayoutMeta['design'];
  const model = {
    collections: collections([{ meta: people, hidden: false }, { meta: detail, hidden: false }]),
    pages: pages([{ meta: map, hidden: false }]),
  };
  assert.equal(layoutRoute(model, 'Map'), '#/~/Map');
  assert.equal(layoutRoute(model, 'Person detail'), '#/People');
  assert.equal(layoutRoute(model, 'People'), '#/People');
  assert.equal(layoutRoute(model, 'Nowhere'), undefined);
  assert.equal(layoutRoute({ ...model, pages: [{ ...model.pages[0], layout: 'A b/c' }] }, 'A b/c'), '#/~/A%20b%2Fc');
});

test('route decoding tolerates malformed escapes and decodes valid names', async () => {
  const { decodeRoute } = await import('../next/edits.ts');
  for (const hash of ['#/%', '#/%E0%A4%A']) assert.deepEqual(decodeRoute(hash), []);
  assert.deepEqual(decodeRoute('#/Town%20Hall/1'), ['#', 'Town Hall', '1']);
});

test('an in-flight save cannot redraw another sheet or a reopened record', async () => {
  const { sameSheet, saveAndRefresh } = await import('../next/edits.ts');
  const collection = {}, a = { recordId: '1' }, b = { recordId: '2' };
  let current: object | undefined = a;
  let release!: () => void;
  const wait = new Promise<void>((resolve) => { release = resolve; });
  const saving = saveAndRefresh(() => wait, async () => {});
  current = b;
  release();
  await saving;
  assert.equal(sameSheet(collection, a, collection, current), false);
  assert.equal(sameSheet(collection, a, collection, { ...a }), false);
  assert.equal(sameSheet(collection, a, {}, a), false);
  assert.equal(sameSheet(collection, a, collection, undefined), false);
  assert.equal(sameSheet(collection, a, collection, a), true);
});

test('a failed write can retry its draft; a failed read is already saved', async () => {
  const { saveAndRefresh } = await import('../next/edits.ts');
  const draft = 'Long text that must survive validation';
  const failure = new Error('Rejected');
  let writes = 0, reads = 0;
  const write = async () => { if (++writes === 1) throw failure; assert.equal(draft, 'Long text that must survive validation'); };
  const read = async () => { reads++; throw failure; };
  assert.deepEqual(await saveAndRefresh(write, read), { saved: false, error: failure });
  assert.equal(reads, 0);
  assert.deepEqual(await saveAndRefresh(write, read), { saved: true, error: failure });
  assert.equal(writes, 2);
  assert.equal(reads, 1);
});

test('session and list errors distinguish expiry, hidden files, and outages', async () => {
  const { sessionFailure, listProblem } = await import('../next/signin.ts');
  const { ApiError } = await import('../src/api.ts');
  for (const e of [new TypeError('Failed to fetch'), new TypeError('NetworkError when attempting to fetch resource.'), new TypeError('Load failed'), new ApiError(-1, 'unavailable', undefined, 503), new ApiError(-1, 'bad gateway', undefined, 502)]) {
    assert.equal(sessionFailure(e).clear, false);
    assert.equal(sessionFailure(e).retry, true);
    assert.match(sessionFailure(e).text, /Could not reach the server/);
    assert.match(listProblem(e), /retry/);
  }
  // A bug in the page is not an outage.
  const bug = sessionFailure(new TypeError('x.map is not a function'));
  assert.doesNotMatch(bug.text, /reach the server/);
  assert.match(bug.text, /x\.map is not a function/);
  assert.equal(bug.retry, true);
  assert.equal(sessionFailure(new ApiError(952, 'expired')).clear, true);
  assert.equal(sessionFailure(new ApiError(952, 'expired')).retry, false);
  assert.equal(listProblem(new ApiError(3, 'hidden', undefined, 404)), '');
  assert.equal(listProblem(undefined), '');
});

test('#162 a refusal that is not an outage says what happened and offers a Retry, not "could not reach the server"', async () => {
  const { sessionFailure } = await import('../next/signin.ts');
  const { ApiError } = await import('../src/api.ts');
  const says = (e: unknown) => sessionFailure(e);
  const busy = says(new ApiError(-1, 'Slow down', undefined, 429));
  assert.match(busy.text, /Too many requests/);
  const told = new ApiError(-1, 'Slow down', undefined, 429);
  told.retryAfter = 7;
  assert.match(says(told).text, /7 seconds/);
  assert.equal(says(told).wait, 7);
  const absurd = new ApiError(-1, 'Slow down', undefined, 429);
  absurd.retryAfter = 1e308;
  assert.match(says(absurd).text, /60 seconds/);
  assert.doesNotMatch(says(absurd).text, /e\+/);
  assert.equal(says(absurd).wait, 60);
  assert.equal(says(new ApiError(-1, 'x', undefined, 503)).wait, undefined);
  assert.doesNotMatch(busy.text, /reach the server/);
  assert.equal(busy.retry, true);
  assert.equal(busy.clear, false);
  const gone = says(new ApiError(802, 'Unable to open file', undefined, 404));
  assert.match(gone.text, /could not be opened/);
  assert.match(gone.text, /Unable to open file/);
  assert.doesNotMatch(gone.text, /reach the server/);
  assert.equal(gone.retry, true);
  const bad = says(new ApiError(-1, 'Malformed request', undefined, 400));
  assert.doesNotMatch(bad.text, /reach the server/);
  assert.match(bad.text, /Malformed request/);
  assert.equal(bad.retry, true);
  for (const status of [401]) assert.equal(says(new ApiError(-1, 'no', undefined, status)).clear, true);
});

test('#162 a saved session that cannot be read is dropped; one that can is kept', async () => {
  const { parseSession } = await import('../next/signin.ts');
  assert.deepEqual(parseSession(JSON.stringify({ db: 'Shop', token: 't1' })), { db: 'Shop', token: 't1' });
  for (const bad of ['{bad', 'null', '"x"', '[]', '{}', JSON.stringify({ db: 'Shop' }), JSON.stringify({ db: 1, token: 't' }), JSON.stringify({ db: '', token: 't' }), JSON.stringify({ db: 'Shop', token: '' })]) {
    assert.equal(parseSession(bad), undefined, bad);
  }
});

test('#147 a write or an add that may have reached the server is told from one that did not', async () => {
  const { outcomeUnknown } = await import('../next/edits.ts');
  const { ApiError } = await import('../src/api.ts');
  for (const e of [new TypeError('Failed to fetch'), new Error('aborted'), new ApiError(-1, 'bad gateway', undefined, 502), new ApiError(-1, 'busy', undefined, 503), new ApiError(-1, 'no status')]) assert.equal(outcomeUnknown(e), true);
  for (const e of [new ApiError(500, 'Validation', undefined, 400), new ApiError(306, 'Modified', undefined, 409), new ApiError(401, 'No', undefined, 401), new ApiError(101, 'Missing', undefined, 404)]) assert.equal(outcomeUnknown(e), false);
});

test('#147 a related row that failed is not sent again when the list shows any new row, however the values read', async () => {
  const { attemptAdd } = await import('../next/edits.ts');
  const { ApiError } = await import('../src/api.ts');
  const types = { 'Orders::Item': 'text', 'Orders::Due': 'date', 'Orders::At': 'time', 'Orders::Qty': 'number' };
  const row = (recordId: string, fields: Record<string, string | number>) => ({ recordId, modId: '0', ...fields });
  const record = (rows: ReturnType<typeof row>[]) => ({ recordId: '9', modId: '5', fieldData: {}, portalData: { Orders: rows }, portalDataInfo: [{ portalObjectName: 'Orders', foundCount: rows.length }] });
  const start = () => ({ ids: new Set(['1', '2']), count: 2 });
  const base = () => [row('1', { 'Orders::Item': 'Tea' }), row('2', { 'Orders::Item': 'Cake' })];
  // Each case: what was typed, and what the file made of it (padded dates, times with seconds, a changed text, a number).
  const cases: [string, Record<string, string>, Record<string, string | number>, boolean][] = [
    ['a date the file pads', { 'Orders::Item': 'Jam', 'Orders::Due': '3/5/2026' }, { 'Orders::Item': 'Jam', 'Orders::Due': '03/05/2026' }, true],
    ['a time the file gives seconds', { 'Orders::Item': 'Jam', 'Orders::At': '10:00' }, { 'Orders::Item': 'Jam', 'Orders::At': '10:00:00' }, true],
    ['a text the file changes on the way in', { 'Orders::Item': 'jam' }, { 'Orders::Item': 'JAM' }, false],
    ['a number typed with a trailing zero', { 'Orders::Item': 'Jam', 'Orders::Qty': '3.0' }, { 'Orders::Item': 'Jam', 'Orders::Qty': 3 }, true],
  ];
  for (const [what, data, made, reads_alike] of cases) {
    const server = base();
    let sends = 0, reads = 0;
    const io = {
      send: async () => { sends++; server.push(row('11', made)); throw new TypeError('Failed to fetch'); },
      reread: async () => { reads++; return record(server); },
    };
    const state = { maybeAdded: false };
    const snapshot = start();
    assert.equal((await attemptAdd(state, io, snapshot, 'Orders', data, types, false)).result, 'failed', what);
    assert.equal(state.maybeAdded, true, what);
    const second = await attemptAdd(state, io, snapshot, 'Orders', data, types, false);
    assert.equal(second.result, 'maybe', what);
    assert.equal((second as { matched: boolean }).matched, reads_alike, `${what}: whether the values read as the same, only for the message`);
    assert.equal(sends, 1, `${what}: nothing was sent again`);
    assert.equal(reads, 1, what);
    // Only on purpose.
    assert.equal((await attemptAdd(state, io, snapshot, 'Orders', data, types, true)).result, 'failed', what);
    assert.equal(sends, 2, `${what}: Add anyway sends`);
  }
  // A new row that does not look like the typed one still blocks (the file may have worked the values out).
  {
    const server = [...base(), row('12', { 'Orders::Item': 'Something else' })];
    let sends = 0;
    const io = { send: async () => { sends++; }, reread: async () => record(server) };
    const state = { maybeAdded: true };
    const out = await attemptAdd(state, io, start(), 'Orders', { 'Orders::Item': 'Jam' }, types, false);
    assert.equal(out.result, 'maybe');
    assert.equal((out as { matched: boolean }).matched, false);
    assert.equal(sends, 0);
  }
  // A portal longer than what comes back: the count of related records tells that one more exists.
  {
    const io = { send: async () => {}, reread: async () => ({ ...record(base()), portalDataInfo: [{ portalObjectName: 'Orders', foundCount: 3 }] }) };
    let sends = 0;
    const out = await attemptAdd({ maybeAdded: true }, { ...io, send: async () => { sends++; } }, start(), 'Orders', { 'Orders::Item': 'Jam' }, types, false);
    assert.equal(out.result, 'maybe');
    assert.equal(sends, 0);
  }
  // No new row yet: the server may still finish the request (a gateway gave up, a connection dropped), so nothing is
  // sent either; only Add anyway sends.
  {
    let sends = 0;
    const io = { send: async () => { sends++; }, reread: async () => record(base()) };
    const state = { maybeAdded: true };
    const out = await attemptAdd(state, io, start(), 'Orders', { 'Orders::Item': 'Jam' }, types, false);
    assert.equal(out.result, 'maybe');
    assert.match((out as { error: Error }).error.message, /still|late/);
    assert.equal(sends, 0);
    assert.equal(state.maybeAdded, true);
    assert.equal((await attemptAdd(state, io, start(), 'Orders', { 'Orders::Item': 'Jam' }, types, true)).result, 'added');
    assert.equal(sends, 1);
    assert.equal(state.maybeAdded, false);
  }
  // A refusal needs no look at the list, and is sent again on Retry.
  {
    let refuse = true, reads = 0;
    const io = { send: async () => { if (refuse) throw new ApiError(500, 'Required', undefined, 400); }, reread: async () => { reads++; return record(base()); } };
    const state = { maybeAdded: false };
    assert.equal((await attemptAdd(state, io, start(), 'Orders', { 'Orders::Item': 'Jam' }, types, false)).result, 'failed');
    assert.equal(state.maybeAdded, false);
    refuse = false;
    assert.equal((await attemptAdd(state, io, start(), 'Orders', { 'Orders::Item': 'Jam' }, types, false)).result, 'added');
    assert.equal(reads, 0);
  }
  // The list cannot be read after a lost answer: nothing is sent until Add anyway.
  {
    let sends = 0, down = true;
    const io = { send: async () => { sends++; if (sends === 1) throw new TypeError('Failed to fetch'); }, reread: async () => { if (down) throw new TypeError('offline'); return record(base()); } };
    const state = { maybeAdded: false };
    await attemptAdd(state, io, start(), 'Orders', { 'Orders::Item': 'Jam' }, types, false);
    const blind = await attemptAdd(state, io, start(), 'Orders', { 'Orders::Item': 'Jam' }, types, false);
    assert.equal(blind.result, 'maybe');
    assert.match((blind as { error: Error }).error.message, /may already be there/);
    assert.equal(sends, 1);
    down = false;
    assert.equal((await attemptAdd(state, io, start(), 'Orders', { 'Orders::Item': 'Jam' }, types, true)).result, 'added');
    assert.equal(sends, 2);
  }
});

test('#147 values read as the same when the file only pads, completes or re-cases what was typed', async () => {
  const { sameStored } = await import('../next/edits.ts');
  assert.equal(sameStored('03/05/2026', '3/5/2026', 'date'), true);
  assert.equal(sameStored('03/05/2026', '2026-03-05', 'date'), true);
  assert.equal(sameStored('03/05/2026', '3/6/2026', 'date'), false);
  assert.equal(sameStored('10:00:00', '10:00', 'time'), true);
  assert.equal(sameStored('13:05:00', '1:05 PM', 'time'), true);
  assert.equal(sameStored('10:00:00', '10:01', 'time'), false);
  assert.equal(sameStored('03/05/2026 10:00:00', '3/5/2026 10:00', 'timestamp'), true);
  assert.equal(sameStored(3, '3.0', 'number'), true);
  assert.equal(sameStored('abc', 'ABC', 'text'), false);
  assert.equal(sameStored(null, '', 'text'), true);
  assert.equal(sameStored('', '3/5/2026', 'date'), false);
  // Text, and numbers too long for a double, are never compared as numbers.
  for (const [held, draft, type] of [['1234', '01234', 'text'], ['1.0', '1', 'text'], ['1e3', '1000', 'text'], ['0x10', '16', 'text'], ['05', '5', undefined],
    ['12345678901234567890', '12345678901234567891', 'number'], ['0x10', '16', 'number'], ['1e3', '1001', 'number']] as const) {
    assert.equal(sameStored(held, draft, type), false, `${held} ${draft} ${type}`);
  }
  assert.equal(sameStored('12345678901234567890', '012345678901234567890.0', 'number'), true, 'long numbers by their digits');
  assert.equal(sameStored('1e3', '1000', 'number'), true);
  assert.equal(sameStored('-0', '0', 'number'), true);
  // Beyond what a double holds, a number is not its rounded value.
  assert.equal(sameStored('1e400', '1e401', 'number'), false);
  assert.equal(sameStored('1e-400', '0', 'number'), false);
  assert.equal(sameStored('1e400', '1e400', 'number'), true);
  assert.equal(sameStored('0.0', '0e5', 'number'), true);
  // A fraction of a second is part of a time.
  assert.equal(sameStored('10:00:00', '10:00:00.9', 'time'), false);
  assert.equal(sameStored('10:00:00', '10:00:00.0', 'time'), true);
  assert.equal(sameStored('10:00:00.5', '10:00:00.50', 'time'), true);
});

test('#147 a draft is stale when the record moved on to a value that is neither what it was nor the draft', async () => {
  const { changedUnderDraft } = await import('../next/edits.ts');
  assert.equal(changedUnderDraft('Rex', 'Rex', 'Mine', 'text'), false, 'unchanged');
  assert.equal(changedUnderDraft('Theirs', 'Rex', 'Mine', 'text'), true, 'someone else wrote it');
  assert.equal(changedUnderDraft('Mine', 'Rex', 'Mine', 'text'), false, 'it already holds the draft');
  assert.equal(changedUnderDraft('04/07/2026', '01/02/2026', '4/7/2026', 'date'), false);
});

test('#147 a field write whose answer was lost is reconciled from the record, never into a silent overwrite', async () => {
  const { settleWrite } = await import('../next/edits.ts');
  const { ApiError } = await import('../src/api.ts');
  const lost = new TypeError('Failed to fetch');
  const record = (City: string) => ({ recordId: '1', modId: '7', fieldData: { City }, portalData: {} });
  // The write landed: the draft is what the file holds.
  assert.equal((await settleWrite(lost, 'City', 'Paris', 'Leeds', 'text', async () => record('Paris'))).saved, true);
  // It did not, and the field is as it was: the draft is kept against the modId the file has now.
  const kept = await settleWrite(lost, 'City', 'Paris', 'Leeds', 'text', async () => record('Leeds'));
  assert.deepEqual([kept.saved, kept.adopt, kept.conflict, kept.fresh?.modId], [false, true, false, '7']);
  // Someone else wrote another value meanwhile: that is a conflict, and their record is not taken as the base.
  const theirs = await settleWrite(lost, 'City', 'Paris', 'Leeds', 'text', async () => record('York'));
  assert.deepEqual([theirs.saved, theirs.adopt, theirs.conflict, theirs.fresh?.fieldData.City], [false, false, true, 'York']);
  // The record cannot be read either: kept as it was.
  const blind = await settleWrite(lost, 'City', 'Paris', 'Leeds', 'text', async () => { throw lost; });
  assert.deepEqual([blind.saved, blind.fresh, blind.adopt, blind.conflict], [false, undefined, false, false]);
  // A real conflict (306) keeps the draft and does not adopt, unless the file already holds the draft.
  const conflict = new ApiError(306, 'Modified', undefined, 409);
  const clash = await settleWrite(conflict, 'City', 'Paris', 'Leeds', 'text', async () => record('York'));
  assert.deepEqual([clash.saved, clash.adopt, clash.conflict], [false, false, true]);
  assert.equal((await settleWrite(conflict, 'City', 'Paris', 'Leeds', 'text', async () => record('Paris'))).saved, true);
  // Dates: the file pads what the draft does not, in a lost answer and in a 306.
  const dated = (Due: string) => ({ recordId: '1', modId: '7', fieldData: { Due }, portalData: {} });
  assert.equal((await settleWrite(lost, 'Due', '4/7/2026', '01/02/2026', 'date', async () => dated('04/07/2026'))).saved, true);
  assert.equal((await settleWrite(conflict, 'Due', '4/7/2026', '01/02/2026', 'date', async () => dated('04/07/2026'))).saved, true);
  // A refusal says nothing about the file: not read.
  let reads = 0;
  const refused = await settleWrite(new ApiError(500, 'Required', undefined, 400), 'City', 'Paris', 'Leeds', 'text', async () => { reads++; return record('Paris'); });
  assert.equal(refused.saved, false);
  assert.equal(reads, 0);
});
