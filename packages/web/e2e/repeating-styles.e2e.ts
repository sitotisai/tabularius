// Synthetic records only. Written for browser CI; no binary file is read.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DesignOp } from '../../store/src/index.ts';
import { host, launch, signIn, skipUnless, until, window } from './harness.ts';

test('related, portal and stored calculation second repetitions show their own formatting after reload', { skip: skipUnless() }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tabularius-browser-path-'));
  const marker = join(dir, 'unexpected-command');
  const priorPath = process.env.PATH;
  for (const command of ['launchctl', 'systemctl', 'sc', 'git', 'npm', 'curl', 'sudo']) {
    writeFileSync(join(dir, command), `#!/bin/sh\nprintf called > '${marker.replaceAll("'", "'\\''")}'\nexit 99\n`, { mode: 0o755 });
  }
  process.env.PATH = dir;
  let hosted: Awaited<ReturnType<typeof host>> | undefined;
  let browser: Awaited<ReturnType<typeof launch>> | undefined;
  try {
    hosted = await host({ stores: ['Repetitions'] });
    const s = hosted.store('Repetitions');
    s.applyDesign([
      { op: 'createTable', name: 'Parents', fields: [{ name: 'Id', type: 'number' }, { name: 'Tags', options: { repetitions: 2 } },
        { name: 'Styled', kind: 'calculation', calculation: 'TextStyleAdd ( Tags ; 512 )', options: { repetitions: 2 } }] },
      { op: 'createTable', name: 'Children', fields: [{ name: 'ParentId', type: 'number' }, { name: 'Tags', options: { repetitions: 2 } }] },
      { op: 'createRelationship', left: 'Parents', right: 'Children', predicates: [{ left: 'Id', right: 'ParentId' }] },
    ]);
    const design = s.design('Parents')!;
    const child = s.schema.tableOccurrences.find((t) => t.name === 'Children')!;
    const fid = s.schema.tables.find((t) => t.name === 'Children')!.fields.find((f) => f.name === 'Tags')!.id;
    const related = { id: 901, kind: 'field', type: 1, anchors: { left: true, top: true, right: false, bottom: false }, style: {}, bounds: { top: 240, left: 20, bottom: 300, right: 220 },
      field: { tableOccurrenceId: child.id, fieldId: fid, tableOccurrence: 'Children', field: 'Tags', display: 'edit', repetitions: 2 } };
    const portal = { ...related, id: 902, kind: 'portal', type: 9, field: undefined, bounds: { top: 310, left: 20, bottom: 450, right: 240 },
      portal: { tableOccurrenceId: child.id, tableOccurrence: 'Children', rows: 2, initialRow: 1, scrolling: true },
      children: [{ ...related, id: 903, bounds: { top: 312, left: 22, bottom: 372, right: 220 } }] };
    const objects = design.objects.map((o) => o.field?.field === 'Styled' ? { ...o, bounds: { top: 160, left: 20, bottom: 220, right: 220 }, field: { ...o.field, repetitions: 2 } } : o);
    const storedId = objects.find((o) => o.field?.field === 'Styled')!.id;
    s.applyDesign([{ op: 'updateLayout', layout: 'Parents', design: { objects: [...objects, related, portal], parts: design.parts.map((p) => p.kind === 'body' ? { ...p, height: 500 } : p) } }] as DesignOp[]);
    s.create('Parents', { Id: 1, Tags: 'one', 'Tags(2)': 'four' });
    const id = s.create('Children', { ParentId: 1, Tags: 'one', 'Tags(2)': 'four' }).recordId;
    s.update('Children', id, { 'Tags(2)': 'four' }, undefined, { styles: { 'Tags(2)': [{ start: 0, end: 4, style: 256 }] } });
    s.setPassword('Tester', 'local-password', '[Full Access]');
    browser = await launch();
    const page = await window(browser);
    await signIn(page, hosted.url, 'Repetitions', 'Tester', 'local-password');
    for (const reload of [false, true]) {
      if (reload) await page.reload();
      for (const object of [901, 903, storedId]) {
        const second = page.locator(`.fm[data-id="${object}"]`).first().locator('.fm-rep').nth(1);
        await until(() => second.locator('input, textarea').inputValue(), (v) => v === 'four');
        const property = object === storedId ? 'italic' : 'bold';
        await until(() => second.locator(`span[style*="${property}"]`).count(), (n) => n === 1);
      }
      assert.equal(await page.locator('.fm[data-id="901"] .fm-rep').first().locator('span[style*="bold"]').count(), 0);
    }
    assert.deepEqual(page.errors, []);
    await page.close();
  } finally {
    await browser?.close();
    await hosted?.close();
    if (priorPath === undefined) delete process.env.PATH;
    else process.env.PATH = priorPath;
    const called = existsSync(marker);
    rmSync(dir, { recursive: true });
    assert.equal(called, false, 'no service, install, git or network command may run');
  }
});
