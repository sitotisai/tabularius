// Keys are repository-relative generated page paths. With no release tags yet,
// every current item defaults to package.json; record later introductions in the map.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const version: string = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const overrides: Record<string, string> = JSON.parse(readFileSync(join(root, 'scripts/reference/since.json'), 'utf8'));

export function sinceVersion(path: string, fallback = version, map = overrides): string {
  const since = map[path] ?? fallback;
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(since)) throw new Error(`Invalid since version for ${path}`);
  return since;
}

/** Keep the machine-readable field and the visible Markdown badge in agreement. */
export function withSince(path: string, text: string): string {
  const since = sinceVersion(path);
  const field = `since: ${since}`;
  const metadata = text.startsWith('---\n')
    ? text.replace(/^---\n([\s\S]*?)\n---\n/, (_, fields: string) => `---\n${fields.replace(/^since:.*\n?/m, '').trimEnd()}\n${field}\n---\n`)
    : `---\n${field}\n---\n\n${text}`;
  return metadata.replace(/^(# [^\n]+)\n\n/m, `$1\n\nSince ${since}\n\n`);
}
