// Every security event kind the audit log records should be named in a page, so a person reading a log entry can look up what it
// means. Most kinds are not yet: UNDOCUMENTED lists them and can only shrink. Documenting a kind makes the second test fail
// until it is taken off the list, so the list cannot go stale; a new kind that is not on the list and not in a page fails the first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { SECURITY_EVENT_KINDS } from '../src/index.ts';

const root = join(import.meta.dirname, '..', '..', '..');

/** Every file under `dir` (relative to the repository), skipping dependencies and dot folders. */
function files(dir: string, keep: (path: string) => boolean, out: string[] = []): string[] {
  for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files(path, keep, out);
    else if (keep(path)) out.push(path);
  }
  return out;
}

// The guides a reader opens; docs/audits and docs/research are working notes, not pages that explain a log entry.
const pages = ['README.md', 'ADMIN.md', 'SECURITY.md', 'QUICKSTART.md', 'CONTRIBUTING.md',
  ...files('docs', (p) => p.endsWith('.md') && !/^docs[\\/](audits|research)[\\/]/.test(p))].filter((p) => existsSync(join(root, p)));
const text = pages.map((p) => readFileSync(join(root, p), 'utf8')).join('\n');
const named = (kind: string): boolean => new RegExp(`(?<![\\w-])${kind}(?![\\w-])`).test(text);

/** Kinds no page names yet. Remove a kind from here when its page text is written; never add one. */
const UNDOCUMENTED = new Set<string>([
  // Accounts
  'account-added', 'account-removed', 'account-enabled', 'accounts-migrated', 'accounts-imported',
  'accounts-import-rejected', 'must-change-set', 'must-change-cleared', 'account-local-only-set',
  'account-local-only-cleared', 'account-require-2fa-set', 'account-require-2fa-cleared',
  // Privilege sets
  'privilege-set-saved', 'privilege-set-deleted', 'privilege-set-assigned', 'privilege-set-unassigned',
  'password-policy-changed', 'require-2fa-set', 'require-2fa-cleared',
  // AI agents
  'agent-added', 'agent-removed', 'agent-change-proposed', 'agent-change-approved', 'agent-change-rejected',
  // Schema
  'schema-changed',
  // Standby takeover
  'standby-takeover',
  // AI access
  'ai-turned-off', 'ai-turned-on', 'ai-access-refused', 'ai-policy-on', 'ai-policy-off', 'pii-isolation-on',
  'pii-isolation-off', 'pii-field-marked', 'ai-data-masked',
]);

test('every security event kind is named in a page, except the ones still listed as undocumented', () => {
  assert.ok(pages.length >= 40, `found ${pages.length} pages`);
  const missing = SECURITY_EVENT_KINDS.filter((k) => !UNDOCUMENTED.has(k) && !named(k));
  assert.deepEqual(missing, [], `security event kinds no page names: describe each in ADMIN.md under "Security event kinds": ${missing.join(', ')}`);
});

test('a kind on the undocumented list is still undocumented, and is a real kind', () => {
  const real = new Set<string>(SECURITY_EVENT_KINDS);
  const unknown = [...UNDOCUMENTED].filter((k) => !real.has(k));
  assert.deepEqual(unknown, [], `not a security event kind: ${unknown.join(', ')}`);
  const nowNamed = [...UNDOCUMENTED].filter((k) => named(k));
  assert.deepEqual(nowNamed, [], `now named in a page: remove from UNDOCUMENTED: ${nowNamed.join(', ')}`);
});
