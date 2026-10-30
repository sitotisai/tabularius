import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, Store } from '@tabularius/store';
import { designOf } from '../src/design.ts';
import { documentSolution } from '../src/docs.ts';
import { whereUsed } from '../src/insight.ts';

test('File Options reports an unticked stored layout and design edits reset the inferred tick', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-file-options-'));
  const path = join(dir, 'Synthetic.openhbam.sqlite');
  createStore(path, { mode: 'native' });
  const store = new Store(path, 'Synthetic');
  try {
    store.applyDesign([
      { op: 'createTable', name: 'W', fields: [{ name: 'Name', type: 'text' }] },
      { op: 'createLayout', name: 'Splash', occurrence: 'W' },
      { op: 'setFileOptions', openLayout: 'Splash' },
    ]);
    assert.deepEqual({ ...store.schema.fileOptions }, { openLayoutId: 2, openLayout: 'Splash' });
    assert.deepEqual(designOf(store).fileOptions, { openLayoutId: 2, openLayout: 'Splash' });

    store.schema.fileOptions!.switchToLayout = false;
    assert.deepEqual(designOf(store).fileOptions, { openLayoutId: 2, openLayout: 'Splash', switchToLayout: false });
    const usages = whereUsed(store, 'Splash', 'layout').flatMap((result) => result.usages.map((usage) => usage.text)).join('\n');
    assert.match(usages, /stores layout "Splash" but does not switch to it/);
    const docs = documentSolution(store);
    assert.match(docs, /File Options stores \[Splash\]\(#layout-splash\) as the layout to switch to, but "Switch to layout" is not ticked \(inferred from the file\), so the file does not open on it\./);
    assert.doesNotMatch(docs, /The file opens on/);

    store.applyDesign([{ op: 'setFileOptions', openLayout: 'Splash' }]);
    assert.deepEqual({ ...store.schema.fileOptions }, { openLayoutId: 2, openLayout: 'Splash' });
    store.schema.fileOptions!.switchToLayout = false;
    store.applyDesign([{ op: 'setFileOptions', openLayout: null }]);
    const cleared = store.schema.fileOptions;
    assert.equal(cleared, undefined);

    store.applyDesign([{ op: 'setFileOptions', openLayout: 'Splash' }]);
    store.schema.fileOptions!.switchToLayout = false;
    store.applyDesign([{ op: 'createScript', name: 'Start', text: '' }]);
    store.applyDesign([{ op: 'setFileOptions', onFirstWindowOpen: 'Start' }]);
    assert.equal(store.schema.fileOptions?.switchToLayout, false);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
