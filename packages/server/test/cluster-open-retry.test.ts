// A worker that opens a file while another process is opening it too is told "database is locked" at once; it tries again.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { whileLocked } from '../src/cluster.ts';

const noWait = () => Promise.resolve();

test('a locked open is tried again until the file is free', async () => {
  let tries = 0;
  const result = await whileLocked(() => {
    if (++tries < 4) throw new Error('database is locked');
    return 'open';
  }, noWait);
  assert.equal(result, 'open');
  assert.equal(tries, 4);
});

test('an open that stays locked gives up with the error, and any other error is not tried again', async () => {
  let tries = 0;
  await assert.rejects(whileLocked(() => { tries++; throw new Error('database is locked'); }, noWait, 3), /database is locked/);
  assert.equal(tries, 3);
  tries = 0;
  await assert.rejects(whileLocked(() => { tries++; throw new Error('Charts is still damaged'); }, noWait), /still damaged/);
  assert.equal(tries, 1);
});
