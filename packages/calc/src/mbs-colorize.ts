import { type StyleRun } from './styled.ts';
import { checkTextSize, MAX_TEXT_MATCHES } from './text-budget.ts';
import { workBudget } from './work-budget.ts';

// Inferred palette, unverified against MBS. XML names are keys, attribute values and text are strings,
// numeric/boolean/null values get scalar colors, and comments, CDATA and processing instructions are literals.
export const SYNTAX_COLORS = {
  key: '#800080', string: '#008000', number: '#0000FF', literal: '#A0522D', punctuation: '#606060',
} as const;
export interface ColoredText { type: 'text'; value: string; runs?: StyleRun[] }

/** Scan validated source without serializing it: offsets refer to the original UTF-16 characters. */
export function colorSyntax(value: string, kind: 'json' | 'xml'): ColoredText {
  const runs: StyleRun[] = [];
  let size = value.length;
  let tag = false;
  const pattern = kind === 'json'
    ? /\s+|"(?:[^"\\]|\\[\s\S])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}\[\]:,]/gy
    : /\/?>|=|"[^"]*"|'[^']*'|\s+|[^\s<>='"/]+/gy;
  const content = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<![^>]*>|<\/?|[^<]+/gy;
  let at = 0;
  while (at < value.length) {
    const scanner = kind === 'xml' && !tag ? content : pattern;
    scanner.lastIndex = at;
    const match = scanner.exec(value);
    if (!match) throw new RangeError('Unable to color validated text');
    at = scanner.lastIndex;
    workBudget()?.work();
    const token = match[0];
    let key: keyof typeof SYNTAX_COLORS;
    if (/^\s+$/.test(token)) continue;
    if (kind === 'json') {
      if (token[0] === '"') {
        let next = match.index + token.length;
        while (/\s/.test(value[next] ?? '') && next < value.length) next++;
        key = value[next] === ':' ? 'key' : 'string';
      } else if (/^-?\d/.test(token)) key = 'number';
      else key = /^[a-z]/.test(token) ? 'literal' : 'punctuation';
    } else {
      if (token.startsWith('<!') || token.startsWith('<?')) key = 'literal';
      else if (token === '<' || token === '</') { tag = true; key = 'punctuation'; }
      else if (token === '>' || token === '/>') { tag = false; key = 'punctuation'; }
      else if (tag && token === '=') key = 'punctuation';
      else {
        const scalar = tag && /^['"]/.test(token) ? token.slice(1, -1) : token;
        key = tag && !/^['"]/.test(token) ? 'key'
          : /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(scalar) ? 'number'
          : /^(true|false|null)$/.test(scalar) ? 'literal'
          : 'string';
      }
    }
    // Bound the styled result as well as its unchanged text before allocating each run.
    checkTextSize(size += 64);
    if (runs.length >= MAX_TEXT_MATCHES) throw new RangeError('The result is too large');
    runs.push({ start: match.index, end: match.index + token.length, color: SYNTAX_COLORS[key] });
  }
  return { type: 'text', value, ...(runs.length ? { runs } : {}) };
}
