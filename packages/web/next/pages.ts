// Writing a page (a modern layout) in /next/: its HTML, CSS and JavaScript beside a preview that follows the
// typing. The page is kept the way the classic client's page editor keeps it (page-source.ts), in the web viewer's
// address formula, so FileMaker Pro opens the same layout and shows the same page. Saved through the design
// endpoints, so only an account that may design layouts can.

import { DesignClient } from '../src/design/client.ts';
import { FORMULA_LIMIT, PAGE_OPTIONS, modernDesign, pageFormula, pageSource, starterPage } from '../src/page-source.ts';
import { webViewer } from '../src/layout.ts';
import type { Api } from '../src/api.ts';
import { h } from './dom.ts';
import type { Page } from './model.ts';

function dataAddress(html: string): string {
  let bin = '';
  for (const b of new TextEncoder().encode(html)) bin += String.fromCharCode(b);
  return 'data:text/html;base64,' + btoa(bin);
}

/** The dialog: code on one side, the page on the other. `save` is given the HTML when Save is pressed. */
function editor(title: string, html: string, save: (html: string) => Promise<void>): HTMLDialogElement {
  const dialog = h('dialog', { class: 'page-editor', 'aria-label': title });
  const code = h('textarea', { class: 'page-code', spellcheck: 'false', 'aria-label': 'Page HTML, CSS and JavaScript' });
  code.value = html;
  const preview = h('div', { class: 'page-preview' });
  const size = h('p', { class: 'page-size', 'aria-live': 'polite' });
  const error = h('p', { class: 'page-error', role: 'alert' });
  const show = () => {
    // The preview has no data calls; the page gets them where it is shown.
    preview.replaceChildren(webViewer(dataAddress(code.value)));
    const n = pageFormula(code.value).length;
    size.textContent = n > FORMULA_LIMIT
      ? `${n.toLocaleString()} characters: FileMaker Pro takes up to ${FORMULA_LIMIT.toLocaleString()}, so this page would show only here.`
      : `${n.toLocaleString()} of FileMaker Pro’s ${FORMULA_LIMIT.toLocaleString()} characters.`;
  };
  let wait = 0;
  code.addEventListener('input', () => { clearTimeout(wait); wait = setTimeout(show, 400); });
  // Tab types a tab in the code, as code editors do; Escape then Tab moves on.
  let escaped = false;
  code.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); escaped = true; return; }
    if (e.key === 'Tab' && !e.shiftKey && !escaped) {
      e.preventDefault();
      code.setRangeText('  ', code.selectionStart, code.selectionEnd, 'end');
      code.dispatchEvent(new Event('input'));
    }
    escaped = false;
  });
  // Closed for good (Save, or a discard that was confirmed): the dialog leaves the page and its preview timer stops.
  let leaving = false;
  const close = () => { leaving = true; clearTimeout(wait); if (dialog.open) dialog.close(); dialog.remove(); };
  const cancel = () => { if (code.value === html || confirm('Discard unsaved page changes?')) close(); };
  const go = h('button', { class: 'primary', type: 'button', onclick: async () => {
    go.disabled = true;
    error.textContent = '';
    try {
      const sent = code.value;
      await save(sent);
      // What was typed while the save ran is not in it: keep the editor open on that, as unsaved.
      if (code.value !== sent) {
        html = sent;
        error.textContent = 'Saved, but text typed while saving is not saved yet. Save again.';
        go.disabled = false;
      } else close();
    } catch (e) {
      error.textContent = (e as Error).message;
      go.disabled = false;
    }
  } }, 'Save');
  dialog.append(
    h('h2', {}, title),
    h('p', { class: 'page-note' }, 'HTML, CSS and JavaScript. The page reads and changes records with window.tabularius and runs scripts with FileMaker.PerformScript, as the signed-in account.'),
    h('div', { class: 'page-body' }, code, preview),
    size, error,
    h('div', { class: 'page-actions' }, h('button', { class: 'ghost', type: 'button', onclick: cancel }, 'Cancel'), go),
  );
  // Escape outside the code (inside it, Escape only leaves the code) asks before a draft is dropped. It is handled
  // here, as a key, because a browser makes the `cancel` event after a dismissed prompt impossible to refuse: the
  // dialog would close the second time without asking.
  dialog.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.target === code) return;
    e.preventDefault();
    cancel();
  });
  dialog.addEventListener('cancel', (e) => { if (e.cancelable) e.preventDefault(); cancel(); });
  // Closed any other way while a draft is unsaved: open again, with the draft. Otherwise the dialog is cleaned up.
  dialog.addEventListener('close', () => {
    if (!leaving && code.value !== html) { dialog.showModal(); return; }
    close();
  });
  document.body.append(dialog);
  dialog.showModal();
  show();
  code.focus();
  return dialog;
}

/** Edits a page's code; saved as one change to the layout. Rejects, in words, when the account may not design. */
export async function editPage(api: Api, page: Page, saved: () => void): Promise<void> {
  const design = new DesignClient(api.db, api.token);
  const meta = await api.layout(page.layout);
  const objects = structuredClone(meta.design?.objects ?? []);
  const viewer = objects.find((o) => o.id === page.viewer);
  if (!viewer) throw new Error('That page’s layout has changed. Reopen it and try again.');
  const html = pageSource(viewer.webUrl);
  if (html === undefined && viewer.webUrl) throw new Error('This page’s address is worked out from fields or a script, so it can’t be edited as code here.');
  editor(page.layout, html ?? starterPage(page.layout, page.layout), async (next) => {
    viewer.webUrl = pageFormula(next);
    viewer.webOptions = { ...(viewer.webOptions ?? PAGE_OPTIONS), jsBridge: true, encodeUrl: false };
    await design.change([{ op: 'updateLayout', layout: page.layout, design: { objects } }]);
    saved();
  });
}

/** Makes a new page on a table (named by its table occurrence), then opens its code. */
export async function newPage(api: Api, name: string, occurrence: string, created: () => void): Promise<void> {
  const design = new DesignClient(api.db, api.token);
  await design.change([{ op: 'createLayout', name, occurrence, design: modernDesign(name, name) }]);
  created();
}
