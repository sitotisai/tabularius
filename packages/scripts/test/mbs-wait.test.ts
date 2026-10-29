import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '../../store/src/index.ts';
import { runScript, ScriptSession, type RunOptions } from '../src/index.ts';

async function run(source: string, options: RunOptions = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-wait-'));
  const file = join(dir, 'Generated.sqlite');
  createStore(file);
  const store = new Store(file, 'Generated');
  try {
    store.applyDesign([
      { op: 'createTable', name: 'Rows', fields: [{ name: 'Public' }, { name: 'Private' }] },
      { op: 'createScript', name: 'Wait', text: source },
    ]);
    store.create('Rows', { Public: 'visible', Private: 'hidden generated value' });
    return await runScript(store, 'Wait', { account: 'Admin', ...options });
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
}
for (const name of ['Time.Sleep', 'Time.Wait']) {
  test(name + ': yields, replays identical calls separately, and cleans timers', async () => {
    const seen: number[] = [];
    let cleaned = 0;
    const result = await run('Exit Script [ Text Result: MBS ( "' + name + '" ; .25 ) & MBS ( "' + name + '" ; .25 ) ]', {
      waitClock: { schedule(ms, done) { seen.push(ms); queueMicrotask(done); return () => { cleaned++; }; } },
    });
    assert.equal(result.result, '00');
    assert.deepEqual(seen, [250, 250]);
    assert.equal(cleaned, 2);
  });
  test(name + ': rejects an open transaction without scheduling', async () => {
    const result = await run('Open Transaction\nExit Script [ Text Result: MBS ( "' + name + '" ; 1 ) ]', {
      waitClock: { schedule() { assert.fail('transaction must not wait'); } },
    });
    assert.match(result.result, /open transaction/);
  });
  for (const end of ['stop', 'session'] as const) test(name + ': canceled on ' + end, async () => {
    const stop = new AbortController();
    const session = new ScriptSession();
    let cleaned = 0;
    const result = await run('Set Variable [ $x ; Value: MBS ( "' + name + '" ; 10 ) ]\nExit Script [ Text Result: "continued" ]', {
      stop: stop.signal, session,
      waitClock: { schedule() {
        queueMicrotask(() => end === 'stop' ? stop.abort() : session.close());
        return () => { cleaned++; };
      } },
    });
    assert.notEqual(result.result, 'continued');
    assert.equal(cleaned, 1);
  });

  test(name + ': per-step wait budget is bounded', async () => {
    let scheduled = 0;
    const formula = Array.from({ length: 21 }, () => 'MBS ( "' + name + '" ; 0 )').join(' & ');
    const result = await run('Exit Script [ Text Result: ' + formula + ' ]', {
      waitClock: { schedule(_ms, done) { scheduled++; queueMicrotask(done); return () => {}; } },
    });
    assert.equal(scheduled, 20);
    assert.notEqual(result.error, 0);
  });
  test(name + ': yielding cannot bypass the file read gate', async () => {
    let denied = false;
    let checks = 0;
    const result = await run('Exit Script [ Text Result: MBS ( "' + name + '" ; 0 ) & Rows::Private ]', {
      layout: 'Rows',
      beforeFile() { checks++; if (denied) throw new Error('read gate denied'); },
      waitClock: { schedule(_ms, done) { queueMicrotask(() => { denied = true; done(); }); return () => {}; } },
    }).catch(error => error);
    assert.ok(checks > 1);
    assert.ok(result instanceof Error ? /read gate denied/.test(result.message) : !result.result.includes('hidden generated value'));
  });
}
