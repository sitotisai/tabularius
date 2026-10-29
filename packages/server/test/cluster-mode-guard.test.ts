import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clusterProblems } from '../src/index.ts';

test('worker mode reports both WAL-following modes until their shared checkpoint protocol exists', () => {
  assert.deepEqual(clusterProblems({ dir: '', progressive: { every: 60_000 } }), ['point-in-time backups (--progressive)']);
  assert.deepEqual(clusterProblems({ dir: '', replicationToken: ['synthetic', 'replication', 'token'].join('-') }), ['standby servers (--replication-token)']);
  assert.deepEqual(clusterProblems({
    dir: '', progressive: { every: 60_000 }, replicationToken: ['synthetic', 'replication', 'token'].join('-'),
  }), ['point-in-time backups (--progressive)', 'standby servers (--replication-token)']);
});
