// PostgreSQL's array text, for the catalog functions that read it. These keep no state, so the child process of a recursive
// query (packages/store/src/sql-recursive.ts) imports array_upper and array_length from here by this file's address.

import type { SQLOutputValue } from 'node:sqlite';

/** Parse PostgreSQL's one-dimensional array text, respecting quoted and escaped delimiters. */
export function arrayElements(value: string): (string | null)[] {
  const body = value.replace(/^\{|\}$/g, '');
  if (!body) return [];
  const elements: (string | null)[] = [];
  let element = '';
  let quoted = false;
  let wasQuoted = false;
  let escaped = false;
  const push = () => { elements.push(!wasQuoted && /^null$/i.test(element) ? null : element); element = ''; wasQuoted = false; };
  for (const char of body) {
    if (escaped) {
      element += char;
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === '"') {
      quoted = !quoted;
      wasQuoted = true;
    } else if (char === ',' && !quoted) {
      push();
    } else {
      element += char;
    }
  }
  if (escaped) element += '\\';
  push();
  return elements;
}

/** array_upper(array, dimension): the last index of a one-dimensional array, NULL for an empty one or another dimension. */
export function arrayUpper(a: SQLOutputValue, dimension: SQLOutputValue): number | null {
  return a === null || Number(dimension) !== 1 ? null : arrayElements(String(a)).length || null;
}

/** array_length(array, dimension): how many elements a one-dimensional array has, NULL for an empty one or another dimension. */
export function arrayLength(a: SQLOutputValue, dimension: SQLOutputValue): number | null {
  return arrayUpper(a, dimension);
}
