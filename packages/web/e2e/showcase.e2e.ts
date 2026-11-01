// The CRM showcase in a real browser: `tabularius demo --starter crm-showcase --full` (started through startDemo, with the
// invented sample data), every layout in the file opened as Admin with no uncaught error, no console error that is not one
// of the two answers the Data API is meant to give, and no request to any host but the demo's own; then the screens a
// visitor is shown (Today, the Sales dashboard, the pipeline boards, Account 360), and the privilege sets: Ava sees fewer
// deals than Morgan. Needs Chromium; not part of test:ci. No screenshots are taken or kept.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Browser, Frame, Page } from 'playwright-core';
import { startDemo, type Demo } from '../../cli/src/demo.ts';
import { found, goToLayout, launch, skipUnless, until, window } from './harness.ts';

const skip = skipUnless();
const STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
let demo: Demo;
let browser: Browser;
/** The title each HTML page of the showcase gives itself, by layout name. */
const PAGE_TITLES: Record<string, string> = { Today: 'Today', 'Sales dashboard': 'Sales dashboard', 'Account timeline': 'Account timeline', 'Pipeline board': 'Pipeline board', Connect: 'Connect', 'Deals - Modern board': 'Deals', 'Activities - Modern calendar': 'Activities' };

before(async () => {
  if (skip) return;
  demo = await startDemo({ full: true });
  browser = await launch();
});
after(async () => {
  await browser?.close();
  await demo?.stop();
});

type Watched = Page & { errors: string[]; consoleErrors: string[]; outside: string[]; failures: string[] };

/**
 * Signs in (the demo hides its list of files, so the file name is typed) and watches the page: console errors, requests to
 * other hosts, and answers of 400 or more. data:, blob: and about: addresses are the page's own.
 */
async function open(account: string): Promise<Watched> {
  const page = await window(await browser.newContext()) as Watched;
  page.consoleErrors = [];
  page.outside = [];
  page.failures = [];
  page.on('console', (m) => { if (m.type() === 'error') page.consoleErrors.push(m.text()); });
  page.on('request', (r) => {
    const url = r.url();
    if (!url.startsWith(demo.url) && !/^(data|blob|about):/.test(url)) page.outside.push(url);
  });
  page.on('response', (r) => {
    if (r.status() < 400) return;
    void r.text().then((body) => page.failures.push(`${r.status()} ${r.request().method()} ${new URL(r.url()).pathname} ${/"code":"(\d+)"/.exec(body)?.[1] ?? ''}`)).catch(() => {});
  });
  await page.goto(demo.url + '/app/');
  await page.locator('input[name="db"]').fill(demo.database);
  await page.locator('input[name="account"]').fill(account);
  await page.locator('input[name="password"]').fill(demo.password);
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await page.locator('select.layout-menu').waitFor({ state: 'attached' });
  await page.locator('.fm-part').first().waitFor();
  return page;
}

/** The page of a modern layout, by the title the page gives itself: it runs in a frame made from its text, and the last layout's frame stays until this one replaces it. */
async function pageFrame(page: Page, title: string): Promise<Frame> {
  const frame = await until(async () => {
    for (const f of page.frames()) if (f.url() === 'about:srcdoc' && (await f.title()) === title) return f;
    return undefined;
  }, (f) => !!f);
  return frame!;
}

/** The leading number of the toolbar's count ("5Total (Unsorted)"). */
async function count(page: Page): Promise<number> {
  const text = await until(async () => (await found(page).textContent()) ?? '', (t) => /^\d/.test(t));
  return Number(/^\d+/.exec(text)![0]);
}

test('every layout opens as Admin with no error and nothing leaves the demo', { skip, timeout: 600_000 }, async () => {
  const page = await open('Admin');
  const layouts = await page.locator('select.layout-menu option').allTextContents();
  for (const name of ['Today', 'Sales dashboard', 'Account timeline', 'Pipeline board', 'Connect', 'Account 360', 'Deals - Modern board', 'Activities - Modern calendar']) {
    assert.ok(layouts.includes(name), `the file has a layout called ${name}`);
  }
  for (const name of layouts) {
    await goToLayout(page, name);
    // A page of the showcase says Loading until its reads are done; waiting for that to go keeps its requests from being cut off by the next layout.
    const title = PAGE_TITLES[name];
    if (title) {
      const frame = await pageFrame(page, title);
      await until(() => frame.locator('body').innerText(), (t) => t.length > 0 && !/Loading/.test(t));
    }
  }
  assert.deepEqual(page.errors, [], 'uncaught page errors');
  assert.deepEqual(page.outside, [], 'requests to a host other than the demo');
  // The Data API answers a find that matches nothing with code 401 (a page asks for the signed-in account's rep, and Admin has none),
  // and the sign-in page asks for the list of files, which the demo keeps off (3). Those are the only failed requests, and the
  // browser logs each one as a console error.
  const unexpected = page.failures.filter((f) => !/^404 GET \/fmi\/data\/vLatest\/databases 3$/.test(f) && !/^500 POST .*\/_find 401$/.test(f));
  assert.deepEqual(unexpected, [], 'requests that failed');
  const stray = page.consoleErrors.filter((t) => !/^Failed to load resource: the server responded with a status of (404|500)/.test(t));
  assert.deepEqual(stray, [], 'console errors');
  await page.context().close();
});

test('Today shows a task card and the Sales dashboard an open pipeline', { skip, timeout: 300_000 }, async () => {
  const page = await open('Admin');
  await goToLayout(page, 'Today');
  const today = await pageFrame(page, 'Today');
  await until(() => today.locator('#tasks li').count(), (n) => n >= 1);
  await goToLayout(page, 'Sales dashboard');
  const dashboard = await pageFrame(page, 'Sales dashboard');
  const pipeline = await until(() => dashboard.locator('#t-pipe').innerText(), (t) => /\d/.test(t));
  assert.ok(Number(pipeline.replace(/[^\d.]/g, '')) > 0, `the open pipeline tile reads ${pipeline}`);
  await page.context().close();
});

test('the pipeline boards have a column for each of the six stages', { skip, timeout: 300_000 }, async () => {
  const page = await open('Admin');
  await goToLayout(page, 'Pipeline board');
  const board = await pageFrame(page, 'Pipeline board');
  await until(() => board.locator('section.col').count(), (n) => n >= STAGES.length);
  const labels = await board.locator('section.col').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  for (const stage of STAGES) assert.ok(labels.includes(stage), `Pipeline board has a ${stage} column (has ${labels.join(', ')})`);
  await goToLayout(page, 'Deals - Modern board');
  const modern = await pageFrame(page, 'Deals');
  const text = await until(() => modern.locator('body').textContent().then((t) => t ?? ''), (t) => /Lead/i.test(t));
  for (const stage of STAGES) assert.ok(new RegExp(stage, 'i').test(text), `Deals - Modern board shows ${stage}`);
  await page.context().close();
});

test('Account 360 has five tabs and its contacts portal has rows', { skip, timeout: 300_000 }, async () => {
  const page = await open('Admin');
  await goToLayout(page, 'Account 360');
  const tabs = page.getByRole('tab');
  await until(() => tabs.count(), (n) => n === 5);
  assert.deepEqual(await tabs.allTextContents(), ['Overview', 'People', 'Deals', 'Activity', 'Emails']);
  await tabs.filter({ hasText: 'People' }).click();
  const rows = page.locator('.fm-portal-row:visible');
  await until(() => rows.count(), (n) => n > 0);
  await page.context().close();
});

test('Ava sees fewer deals than Morgan', { skip, timeout: 300_000 }, async () => {
  const counts: Record<string, number> = {};
  for (const account of ['Ava', 'Morgan']) {
    const page = await open(account);
    await goToLayout(page, 'Deals list');
    counts[account] = await count(page);
    await page.context().close();
  }
  assert.ok(counts.Ava > 0, 'Ava owns some deals');
  assert.ok(counts.Ava < counts.Morgan, `Ava sees ${counts.Ava} deals and Morgan ${counts.Morgan}`);
});
