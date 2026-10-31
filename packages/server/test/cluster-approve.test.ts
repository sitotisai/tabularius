// With --workers N the leader alone approves a held file, but every worker keeps its own copy of the flag: the
// followers must hear of the approval, or they go on refusing the file's scripts until a restart.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from '../../store/src/index.ts';
import { ClusterLink } from '../src/cluster.ts';
import { DataApi } from '../src/dataapi.ts';
import { Host, STORE_EXT } from '../src/host.ts';
import { Live } from '../src/live.ts';

test('approving a held file in the leader clears it in the followers too', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-cluster-approve-'));
  createStore(join(dir, 'A' + STORE_EXT));
  const first = new Host(dir);
  await first.close();
  createStore(join(dir, 'B' + STORE_EXT)); // arrives after the first start: held
  const role = (id: number) => ({ id, leader: id === 0, workers: 2, socket: '', urlKey: '', locks: join(dir, 'locks.sqlite') });
  let toFollower: (m: Parameters<ClusterLink['receive']>[0]) => void = () => {};
  const leaderLink = new ClusterLink(role(0), (m) => { if (m.t === 'tell') toFollower({ t: 'tell', note: m.note }); });
  const followerLink = new ClusterLink(role(1), () => {});
  toFollower = (m) => followerLink.receive(m);
  const leader = new Host(dir, () => {}, leaderLink.hostOptions());
  const follower = new Host(dir, () => {}, followerLink.hostOptions());
  for (const [link, host] of [[leaderLink, leader], [followerLink, follower]] as const) {
    const api = new DataApi(host);
    link.attach(host, api, new Live(host, api));
  }
  t.after(async () => {
    leaderLink.close();
    followerLink.close();
    await follower.close();
    await leader.close();
    rmSync(dir, { recursive: true, force: true });
  });
  assert.equal(leader.isHeld('B'), true);
  assert.equal(follower.isHeld('B'), true);
  leader.approve('B', 'operator');
  assert.equal(leader.isHeld('B'), false);
  assert.equal(follower.isHeld('B'), false, 'the follower hears of the approval');
  assert.equal(follower.isHeld('A'), false);
});
