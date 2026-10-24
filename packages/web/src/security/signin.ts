// "My sign-in": the signed-in account's own passkeys and recovery codes.
// Passkeys let this account sign in without a password (and are phishing-proof,
// which FileMaker has no answer to); recovery codes are the one-time fallback
// for when a passkey or authenticator is lost. Everything here acts on the
// account you are signed in as — the server's self-service endpoints never
// touch another account.

import { h, button, field, toast } from '../design/dom.ts';
import type { Sec } from './main.ts';
import { generateMyRecoveryCodes, listMyPasskeys, passkeySupported, registerPasskey, removeMyPasskey, type CredentialProof, type Passkey } from '../webauthn.ts';
import { errorText } from './main.ts';

/** A date/time as the rest of the UI shows them (ISO strings from the server). */
const when = (iso?: string): string => (iso ? new Date(iso).toLocaleString() : '');
let recoveryGenerationPending = false;

export function signinTab(sec: Sec): HTMLElement {
  const db = sec.client.db, token = sec.client.token;
  const wrap = h('div', { class: 'd-pane signin-pane' });

  const passkeyList = h('div', { class: 'signin-list' });
  const render = (passkeys: Passkey[]): void => {
    if (!passkeys.length) {
      passkeyList.replaceChildren(h('p', { class: 'd-hint' }, 'You have no passkeys yet.'));
      return;
    }
    passkeyList.replaceChildren(...passkeys.map((p) => h('div', { class: 'signin-row' },
      h('span', { class: 'signin-name' }, p.label || 'Passkey'),
      h('span', { class: 'd-hint' }, `added ${when(p.created)}${p.lastUsed ? `, last used ${when(p.lastUsed)}` : ''}`),
      button('Remove', () => void remove(p), { class: 'd-danger' }),
    )));
  };
  // Set from the server: why this account cannot confirm a credential change (see applyBlocked below).
  let blocked: string | undefined;
  let applyBlocked = (): void => {};
  const reload = async (): Promise<void> => {
    try {
      const { passkeys, confirmBlocked } = await listMyPasskeys(db, token);
      blocked = confirmBlocked;
      applyBlocked();
      render(passkeys);
    } catch (e) {
      passkeyList.replaceChildren(h('p', { class: 'd-hint' }, errorText(e)));
    }
  };
  const remove = async (p: Passkey): Promise<void> => {
    if (!confirm(`Remove the passkey “${p.label || 'Passkey'}”? You won't be able to sign in with it any more.`)) return;
    try {
      await removeMyPasskey(db, token, p.id);
      toast('Passkey removed.', 'info');
      await reload();
    } catch (e) { toast(errorText(e)); }
  };
  // Passkeys and recovery codes outlive this session, so the server asks for the password (and a code, when the
  // account has an authenticator app) again before it makes one.
  const password = h('input', { type: 'password', autocomplete: 'current-password', 'aria-label': 'Current password' });
  const code = h('input', { type: 'text', inputmode: 'numeric', autocomplete: 'one-time-code', 'aria-label': 'One-time code (if your account has an authenticator app)', placeholder: 'One-time code, if you use one' });
  const proof = (): CredentialProof | undefined => {
    if (!password.value) { toast('Enter your current password first.', 'info'); password.focus(); return undefined; }
    return { password: password.value, ...(code.value.trim() ? { code: code.value.trim() } : {}) };
  };
  const forget = (): void => { password.value = ''; code.value = ''; };
  // A one-time code works once, and the server spends it when the password was right. After any failure the box is
  // cleared so a retry types a fresh one (a wrong password costs a retype of the code too).
  const spent = (): void => { code.value = ''; };
  const add = async (): Promise<void> => {
    const confirmed = proof();
    if (!confirmed) return;
    const label = prompt('A name for this passkey (e.g. “MacBook Touch ID”):', 'This device');
    if (label === null) return;
    try {
      await registerPasskey(db, token, label.trim() || 'Passkey', confirmed);
      forget();
      toast('Passkey added.', 'info');
      await reload();
    } catch (e) {
      spent();
      if (e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'AbortError')) toast('Adding the passkey was cancelled.', 'info');
      else toast(errorText(e));
    }
  };

  const codesOut = h('div', { class: 'signin-codes' });
  // Keep one-time secrets only in this tab instance. Leaving the tab or a
  // security-page redraw discards the DOM and this reference together.
  let displayedRecoveryCodes: string[] | undefined;
  const showCodes = (codes: string[]): void => {
    codesOut.replaceChildren(
      h('p', { class: 'd-hint' }, 'Save these somewhere safe. Each code works once, and they are shown only now.'),
      h('ul', { class: 'signin-code-list' }, ...codes.map((c) => h('li', {}, h('code', {}, c)))),
    );
  };
  if (displayedRecoveryCodes) showCodes(displayedRecoveryCodes);
  const generate = async (generateButton: HTMLButtonElement): Promise<void> => {
    if (recoveryGenerationPending) return;
    const confirmed = proof();
    if (!confirmed) return;
    if (!confirm('Generate a new set of recovery codes? Any codes you had before will stop working.')) return;
    recoveryGenerationPending = true;
    generateButton.disabled = true;
    displayedRecoveryCodes = undefined;
    codesOut.replaceChildren();
    try {
      const { codes } = await generateMyRecoveryCodes(db, token, confirmed);
      forget();
      displayedRecoveryCodes = codes;
      showCodes(codes);
    } catch (e) { spent(); toast(errorText(e)); }
    finally {
      recoveryGenerationPending = false;
      for (const control of document.querySelectorAll<HTMLButtonElement>('.signin-generate')) control.disabled = !!blocked;
    }
  };
  const generateButton = button('Generate recovery codes', () => void generate(generateButton), { class: 'signin-generate' });
  generateButton.disabled = recoveryGenerationPending;
  const addButton = button('Add a passkey', () => void add(), { class: 'd-primary' });

  // The fields sit in a form so a password manager recognises them; Enter does nothing by itself.
  const confirmForm = h('form', { class: 'signin-confirm', autocomplete: 'on' },
    h('h2', { class: 'd-h2' }, 'Confirm it’s you'),
    h('p', { class: 'd-hint' }, 'Adding a passkey or making recovery codes asks for your password again, and a one-time code if you use an authenticator app.'),
    field('Current password', password),
    field('One-time code', code));
  confirmForm.addEventListener('submit', (event) => event.preventDefault());
  const blockedNote = h('p', { class: 'd-hint signin-blocked', role: 'status' });
  blockedNote.hidden = true;
  // An account with no password of its own, or a passkey as its second factor, cannot confirm here: say why and
  // leave the actions off rather than let each try fail.
  applyBlocked = (): void => {
    confirmForm.hidden = !!blocked;
    blockedNote.hidden = !blocked;
    blockedNote.textContent = blocked ?? '';
    addButton.disabled = !!blocked;
    generateButton.disabled = recoveryGenerationPending || !!blocked;
  };

  wrap.append(
    confirmForm,
    blockedNote,
    h('h2', { class: 'd-h2' }, 'Passkeys'),
    h('p', { class: 'd-hint' }, 'Sign in without a password, using this device’s fingerprint, face or security key. Passkeys can’t be phished or reused across sites.'),
    passkeyList,
    passkeySupported()
      ? addButton
      : h('p', { class: 'd-hint' }, 'This browser can’t create passkeys here (they need a secure https connection).'),
    h('h2', { class: 'd-h2' }, 'Recovery codes'),
    h('p', { class: 'd-hint' }, 'One-time codes to sign in if you lose your passkey or authenticator. Generating a new set replaces the old one.'),
    generateButton,
    codesOut,
  );
  void reload();
  return wrap;
}
