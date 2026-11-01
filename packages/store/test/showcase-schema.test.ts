import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store, applyStarter, createStore } from '../src/index.ts';
import { checkSolution } from '../../server/src/check-solution.ts';
import { runScript, runScriptTests } from '../../scripts/src/index.ts';

test('showcase schema contains the agreed tables, relationships, lists, scripts and privileges', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-showcase-schema-'));
  const file = join(dir, 'Showcase.openhbam.sqlite');
  createStore(file);
  const store = new Store(file, 'Showcase');
  try {
    applyStarter(store, 'crm-showcase', { sample: false });
    assert.deepEqual(store.schema.tables.map((t) => t.name), ['Reps', 'Accounts', 'Contacts', 'Deals', 'Activities', 'Email Log', 'Products', 'Deal Lines']);
    assert.equal(store.schema.relationships.length, 12);
    assert.deepEqual(store.schema.valueLists.map((v) => v.name), ['Stage', 'Industry', 'Region', 'Lead source', 'Activity type', 'Lost reason']);
    for (const name of ['Advance stage', 'Close deal', 'Log activity', 'Add follow-up', 'Reassign owner', 'Assign by region', 'Mark task done', 'Go to record', 'Add onboarding task']) {
      assert.ok(store.schema.scripts.some((s) => s.name === name), name);
    }
    for (const name of ['Rep', 'Manager', 'Executive']) assert.ok(store.privilegeSet(name), name);
    const check = checkSolution(store);
    assert.equal(check.counts.error, 0, JSON.stringify(check.findings));
    assert.equal(check.counts.warning, 0, JSON.stringify(check.findings));
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('saved showcase script tests pass on a fresh file', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-showcase-script-tests-'));
  const file = join(dir, 'Showcase.openhbam.sqlite');
  createStore(file);
  const store = new Store(file, 'Showcase');
  try {
    applyStarter(store, 'crm-showcase', { sample: false });
    assert.equal(store.scriptTests().length, 3);
    const outcomes = await runScriptTests(store, store.scriptTests());
    assert.ok(outcomes.every((outcome) => outcome.passed), JSON.stringify(outcomes));
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('showcase calculations, workflows and record access work on synthetic records', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-showcase-records-'));
  const file = join(dir, 'Showcase.openhbam.sqlite');
  createStore(file);
  const store = new Store(file, 'Showcase');
  try {
    applyStarter(store, 'crm-showcase', { sample: false });
    const rep1 = store.create('Reps', { Name: 'Rep One', Login: 'rep-one', Region: 'West' }).recordId;
    const rep2 = store.create('Reps', { Name: 'Rep Two', Login: 'rep-two', Region: 'West' }).recordId;
    const account1 = store.create('Accounts', { Name: 'Invented One', 'Owner ID': rep1, Region: 'West' }).recordId;
    const account2 = store.create('Accounts', { Name: 'Invented Two', 'Owner ID': rep2, Region: 'West' }).recordId;
    const deal = (account: number, owner: number, title: string, stage: string, amount: number) =>
      store.create('Deals', { 'Account ID': account, 'Owner ID': owner, Title: title, Stage: stage, Amount: amount }).recordId;
    const ids = [
      deal(account1, rep1, 'Lead deal', 'Lead', 100), deal(account1, rep1, 'Qualified deal', 'Qualified', 200),
      deal(account1, rep1, 'Won deal', 'Won', 300), deal(account1, rep1, 'Lost deal', 'Lost', 400),
      deal(account2, rep2, 'Proposal deal', 'Proposal', 500),
    ];
    const fields = (table: string, id: number) => store.get(table, id).fieldData;
    assert.deepEqual(ids.map((id) => fields('Deals', id)['Weighted Amount']), [10, 50, 300, 0, 250]);
    assert.deepEqual([fields('Accounts', account1)['Open Pipeline'], fields('Accounts', account1)['Won Total']], [300, 300]);
    const product = store.create('Products', { SKU: 'SYN-1', Name: 'Synthetic service', 'Unit Price': 80 }).recordId;
    store.create('Deal Lines', { 'Deal ID': ids[0], 'Product ID': product, Quantity: 2, 'Unit Price': 80, 'Discount Percent': 25 });
    assert.equal(fields('Deals', ids[0])['Quote Total'], 120);
    const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();
    store.update('Deals', ids[0], { 'Stage Changed': daysAgo(20) }, undefined, { dateOrder: 'ISO' });
    assert.equal(fields('Deals', ids[0]).Stale, 1);
    assert.equal(fields('Accounts', account1).Health, 'At risk');
    store.update('Deals', ids[0], { 'Stage Changed': daysAgo(1) }, undefined, { dateOrder: 'ISO' });
    assert.equal(fields('Deals', ids[0]).Stale, 0);
    assert.equal(fields('Accounts', account1).Health, 'Healthy');
    store.create('Activities', { 'Account ID': account1, 'Rep ID': rep1, Type: 'Call', Subject: 'Earlier touch', When: daysAgo(20) }, { dateOrder: 'ISO' });
    assert.equal(fields('Accounts', account1).Health, 'Watch');
    store.update('Deals', ids[0], { 'Stage Changed': daysAgo(20) }, undefined, { dateOrder: 'ISO' });
    assert.equal(fields('Accounts', account1).Health, 'At risk');
    store.update('Deals', ids[0], { 'Stage Changed': daysAgo(1) }, undefined, { dateOrder: 'ISO' });
    const run = (name: string, layout: string, id: number, parameter = '') => runScript(store, name, { layout, foundSet: [id], recordId: id, parameter });
    assert.equal((await run('Advance stage', 'Deals', ids[0])).result, 'advanced');
    assert.equal(fields('Deals', ids[0]).Stage, 'Qualified');
    assert.equal(fields('Deals', ids[0])['Days In Stage'], 0);
    store.update('Deals', ids[1], { 'Stage Changed': daysAgo(20) }, undefined, { dateOrder: 'ISO' });
    assert.equal((await run('Close deal', 'Deals', ids[1], 'Lost|Timing')).result, 'closed');
    assert.equal(fields('Deals', ids[1]).Stage, 'Lost');
    assert.equal(fields('Deals', ids[1])['Lost Reason'], 'Timing');
    assert.equal(fields('Deals', ids[1])['Days In Stage'], 0);
    assert.equal((await run('Close deal', 'Deals', ids[0], 'Won')).result, 'closed');
    assert.equal(fields('Deals', ids[0])['Weighted Amount'], 100);
    assert.deepEqual([fields('Accounts', account1)['Open Pipeline'], fields('Accounts', account1)['Won Total']], [0, 400]);
    assert.equal((await run('Advance stage', 'Deals', ids[0])).result, 'already closed');
    assert.equal((await run('Log activity', 'Accounts', account1, 'Call|Check in|Synthetic note')).result, 'logged');
    assert.equal((await run('Add follow-up', 'Accounts', account1, 'not-a-number')).result, 'need days from today');
    assert.equal((await run('Add follow-up', 'Accounts', account1, '2')).result, 'follow-up added');
    const task = store.find('Activities', { query: [{ Subject: 'Follow up' }] }).records[0];
    assert.ok(task);
    store.update('Activities', task.recordId, { ID: 8001 });
    assert.notEqual(task.recordId, fields('Activities', task.recordId).ID);
    const taskId = String(fields('Activities', task.recordId).ID);
    assert.equal((await run('Mark task done', 'Activities', task.recordId, taskId)).result, 'done');
    assert.equal(fields('Activities', task.recordId).Done, 'Yes');
    assert.equal(fields('Activities', task.recordId).Outcome, 'Done');
    assert.equal((await run('Mark task done', 'Activities', task.recordId, '999999')).result, 'no such task');
    const navigation = store.create('Products', { ID: 9001, SKU: 'SYN-NAV', Name: 'Synthetic navigation' }).recordId;
    assert.notEqual(navigation, fields('Products', navigation).ID);
    const shown = await run('Go to record', 'Products', product, String(fields('Products', navigation).ID));
    assert.equal(shown.result, 'ok');
    assert.equal(shown.recordId, navigation);
    assert.deepEqual(shown.foundSet, [navigation]);
    assert.equal((await run('Go to record', 'Products', product, '999999')).result, 'not found');
    assert.equal((await run('Reassign owner', 'Deals', ids[0], String(rep2))).result, 'reassigned');
    assert.equal((await run('Reassign owner', 'Deals', ids[0], 'two')).result, 'need a rep id');
    assert.equal(fields('Deals', ids[0])['Owner ID'], rep2);
    assert.equal((await run('Assign by region', 'Accounts', account1)).result, 'assigned');
    assert.equal(fields('Accounts', account1)['Owner ID'], rep2);
    assert.equal((await run('Add onboarding task', 'Deals', ids[0])).result, 'onboarding added');
    const onboarding = store.find('Activities', { query: [{ Subject: 'Onboarding kickoff' }] }).records;
    assert.equal(onboarding.length, 1);
    assert.equal(onboarding[0].fieldData.Type, 'Task');
    assert.equal(onboarding[0].fieldData['Deal ID'], fields('Deals', ids[0]).ID);
    assert.equal(onboarding[0].fieldData['Account ID'], fields('Deals', ids[0])['Account ID']);
    assert.equal(onboarding[0].fieldData['Rep ID'], fields('Deals', ids[0])['Owner ID']);
    const due = new Date();
    due.setDate(due.getDate() + 3);
    assert.equal(onboarding[0].fieldData.Due, `${String(due.getMonth() + 1).padStart(2, '0')}/${String(due.getDate()).padStart(2, '0')}/${due.getFullYear()}`);
    store.setPassword('rep-one', 'pw', 'Rep');
    const repDeals = store.find('Deals', { privileges: store.privileges('rep-one') });
    assert.deepEqual(repDeals.records.map((r) => r.fieldData.Title).sort(), ['Lost deal', 'Qualified deal', 'Won deal']);
    store.setPassword('exec-one', 'pw', 'Executive');
    assert.throws(() => store.create('Accounts', { Name: 'No' }, { privileges: store.privileges('exec-one') }));
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
