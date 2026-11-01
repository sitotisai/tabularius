// Files a command writes into a folder the person names (export-sql's container files, write-back's paste files). Someone who can
// write into that folder beforehand can plant a symbolic link or a second name for a file; these helpers refuse them, and the
// files themselves go through the filesystem boundary (never through a link, owner only).
import { lstatSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { writeFileSync as writeChecked } from '../../store/src/fs-boundary.ts';
import type { WriteBackKit } from '../../store/src/index.ts';

/**
 * Refuses a link in `folder` or above it that someone else could have planted: a symbolic link whose containing folder is
 * writable by group or others (not checked on Windows, which reports no usable mode bits). A link in a folder only its owner can
 * write, such as /var or /tmp on a Mac, is an ordinary alias and stays accepted, as is the person's own `~/exports` link.
 */
export function refusePlantedLinks(folder: string): void {
  for (let at = resolve(folder); dirname(at) !== at; at = dirname(at)) {
    if (lstatSync(at).isSymbolicLink() && process.platform !== 'win32' && (lstatSync(dirname(at)).mode & 0o022)) {
      throw new Error(`${at} is a link in a folder others can write to, so the export may not end up where you meant; use the real path of the folder, or remove the link`);
    }
  }
}

/**
 * Makes the folders the file at `rel` goes in (below the existing folder `base`) plain folders only this user can open. A link or
 * a file standing where one of them should be is always refused, and so is a link planted above `base`.
 */
export function plainFolders(base: string, rel: string): void {
  refusePlantedLinks(base);
  let at = resolve(base);
  for (const part of dirname(rel).split(/[\\/]/).filter((p) => p && p !== '.')) {
    at = join(at, part);
    let found;
    try { found = lstatSync(at); } catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e; }
    if (!found) mkdirSync(at, { mode: 0o700 });
    else if (!found.isDirectory()) throw new Error(`${at} is not a plain folder (a link or a file stands there); remove it and try again`);
  }
}

/** Writes the numbered paste files and the README of a write-back kit into the (empty or new) folder `out`; returns the README's path. */
export function writeKitFiles(out: string, database: string, source: string, kit: WriteBackKit): string {
  mkdirSync(out, { recursive: true, mode: 0o700 });
  refusePlantedLinks(out);
  const lines = [`# Taking ${database}'s changes back to FileMaker`, '', `Made from ${source} and the changes made in Tabularius since.`, ''];
  if (!kit.paste.length && !kit.byHand.length) lines.push('Nothing has changed: there is nothing to do.');
  if (kit.paste.length) {
    lines.push('## Paste these, in order', '', 'Open each file, copy all of its text, and paste in FileMaker Pro where it says. FileMaker reads its own clipboard format, so a clipboard tool that converts XML text to it is needed.', '');
    kit.paste.forEach((p, i) => {
      const name = `${String(i + 1).padStart(2, '0')}.xml`;
      writeChecked(join(out, name), p.xml, { mode: 0o600 });
      lines.push(`${i + 1}. \`${name}\` (${p.names.join(', ')}): ${p.where}`);
      for (const n of p.notes) lines.push(`   - ${n}`);
    });
    lines.push('');
  }
  if (kit.byHand.length) lines.push('## Then do these by hand', '', ...kit.byHand.map((b) => `- ${b}`), '');
  const readme = join(out, 'README.md');
  writeChecked(readme, lines.join('\n'), { mode: 0o600 });
  return readme;
}
