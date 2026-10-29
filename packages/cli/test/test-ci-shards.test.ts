// The CI test jobs split the suite into shards plus a gates job. Every test file must run in exactly one of them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { allTests, gateTests, plan, ROOT, shardFiles } from '../../../scripts/test-plan.ts';

test('the gates and the shards together cover every test file exactly once', () => {
  const tests = allTests();
  assert.ok(tests.length > 100, 'the test files were found');
  for (const count of [1, 2, 3, 4, 7]) {
    const { gates, shards } = plan(count);
    assert.equal(shards.length, count);
    const seen = [...gates, ...shards.flat()];
    assert.deepEqual([...seen].sort(), tests, `shard count ${count}`);
    assert.equal(new Set(seen).size, seen.length, `no file runs twice with ${count} shards`);
  }
});

test('every gate names a test file that exists', () => {
  for (const file of gateTests()) assert.ok(existsSync(join(ROOT, file)), `${file} is listed as a gate but does not exist`);
});

test('shards are filled longest file first, so their loads come out nearly even', () => {
  const shards = shardFiles(['a', 'b', 'c', 'd', 'e', 'f'], 3, { a: 9, b: 5, c: 4, d: 4, e: 1, f: 1 });
  assert.deepEqual(shards, [['a'], ['b', 'e', 'f'], ['c', 'd']]);
  const recorded = plan(4).shards;
  const sizes = recorded.map((shard) => shard.length);
  assert.ok(Math.max(...sizes) - Math.min(...sizes) <= Math.ceil(sizes[0] / 4), `uneven shard sizes ${sizes}`);
});

test('repository scripts tests are selected exactly once and npm test includes them', () => {
  const selected = [...plan(4).gates, ...plan(4).shards.flat()];
  for (const file of readdirSync(join(ROOT, 'scripts')).filter((f) => f.endsWith('.test.ts'))) {
    assert.equal(selected.filter((f) => f === `scripts/${file}`).length, 1, file);
  }
  assert.match(JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts.test, /scripts\/\*\.test\.ts/);
});

test('package scripts have unique keys and docs check runs both generators', () => {
  const source = readFileSync(join(ROOT, 'package.json'), 'utf8');
  const keys = [...source.matchAll(/^    "([^"]+)":/gm)].map((m) => m[1]);
  assert.equal(new Set(keys).size, keys.length);
  const command = JSON.parse(source).scripts['docs:check'];
  assert.match(command, /docs-settings-cli\.ts --check/);
  assert.match(command, /filemaker-glossary\.ts --check/);
});
