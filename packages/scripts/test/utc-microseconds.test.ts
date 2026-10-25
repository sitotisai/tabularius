// Get ( CurrentTimeUTCMicroseconds ) read by separate steps of a script (each step builds its own calculation context)
// stays distinct and increasing within a millisecond, and follows an injected clock that goes back.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Script } from '@tabularius/fmp12';
import { createStore, parseScriptText, Store } from '@tabularius/store';
import { runScript } from '../src/index.ts';

const EPOCH = 62_135_596_800_000_000n;
const script = (reads: number) => [
  ...Array.from({ length: reads }, (_, i) => `Set Variable [ $v${i} ; Value: Get ( CurrentTimeUTCMicroseconds ) ]`),
  `Exit Script [ Result: ${Array.from({ length: reads }, (_, i) => `$v${i}`).join(' & "," & ')} ]`,
].join('\n');

test('microsecond readings in separate script steps are distinct, and an injected clock is followed', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-micro-'));
  createStore(join(dir, 'M.sqlite'));
  const store = new Store(join(dir, 'M.sqlite'), 'M');
  try {
    store.applyDesign([{ op: 'createTable', name: 'T', fields: [{ name: 'A' }] }]);
    const run = async (reads: number, now?: () => Date) => {
      const steps = parseScriptText(script(reads), store.schema)
        .map((st) => ({ stepId: st.stepId!, name: st.name!, enabled: st.enabled !== false, params: st.params }));
      const s = { id: 9999, name: 'Micro', steps } as Script;
      const r = await runScript(store, s, { layout: 'T', ...(now ? { now } : {}) });
      return String(r.result).split(',').map((x) => BigInt(x));
    };
    // The real clock: steps in the same millisecond still differ.
    const real = await run(50);
    assert.equal(new Set(real).size, 50);
    for (let i = 1; i < real.length; i++) assert.ok(real[i] >= real[i - 1], 'readings do not go back');
    // A fixed injected clock: distinct, in that millisecond.
    const fixed = await run(20, () => new Date('2026-01-01T00:00:00.000Z'));
    assert.equal(new Set(fixed).size, 20);
    const ms = BigInt(Date.parse('2026-01-01T00:00:00.000Z')) * 1000n + EPOCH;
    for (const v of fixed) assert.equal(v / 1000n, ms / 1000n);
    // An earlier injected clock afterwards gives the earlier value, not the later one plus a microsecond.
    const later = await run(1, () => new Date('2030-01-01T00:00:00.000Z'));
    const earlier = await run(1, () => new Date('2020-01-01T00:00:00.000Z'));
    assert.equal(earlier[0], BigInt(Date.parse('2020-01-01T00:00:00.000Z')) * 1000n + EPOCH);
    assert.ok(later[0] > earlier[0]);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
