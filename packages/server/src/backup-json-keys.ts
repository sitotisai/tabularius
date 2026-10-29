/** Check object keys in raw JSON before JSON.parse can discard a repeated one. */
export class ManifestKeyError extends Error {
  constructor(key: string, kind: 'duplicate' | 'forbidden') {
    super(`${kind} manifest key ${JSON.stringify(key)}`);
  }
}

export function checkManifestKeys(text: string): void {
  let at = 0;
  const fail = (): never => { throw new SyntaxError('invalid JSON'); };
  const white = (): void => {
    while (at < text.length && (text[at] === ' ' || text[at] === '\t' || text[at] === '\r' || text[at] === '\n')) at++;
  };
  const digit = (c: string | undefined): boolean => c !== undefined && c >= '0' && c <= '9';
  const hex = (c: string | undefined): number => {
    if (c === undefined) return -1;
    const n = c.charCodeAt(0);
    if (n >= 48 && n <= 57) return n - 48;
    if (n >= 65 && n <= 70) return n - 55;
    if (n >= 97 && n <= 102) return n - 87;
    return -1;
  };
  const string = (decode: boolean): string => {
    if (text[at++] !== '"') return fail();
    let result = '';
    let start = at;
    while (at < text.length) {
      const c = text[at++];
      if (c === '"') {
        if (decode) result += text.slice(start, at - 1);
        return result;
      }
      if (c.charCodeAt(0) < 32) return fail();
      if (c !== '\\') continue;
      if (decode) result += text.slice(start, at - 1);
      const escaped = text[at++];
      if (escaped === 'u') {
        let code = 0;
        for (let i = 0; i < 4; i++) {
          const n = hex(text[at++]);
          if (n < 0) return fail();
          code = code * 16 + n;
        }
        if (decode) result += String.fromCharCode(code);
      } else {
        const value = escaped === '"' ? '"' : escaped === '\\' ? '\\' : escaped === '/' ? '/' :
          escaped === 'b' ? '\b' : escaped === 'f' ? '\f' : escaped === 'n' ? '\n' :
          escaped === 'r' ? '\r' : escaped === 't' ? '\t' : undefined;
        if (value === undefined) return fail();
        if (decode) result += value;
      }
      start = at;
    }
    return fail();
  };
  const number = (): void => {
    if (text[at] === '-') at++;
    if (text[at] === '0') at++;
    else {
      if (!digit(text[at]) || text[at] === '0') return fail();
      while (digit(text[at])) at++;
    }
    if (text[at] === '.') {
      at++;
      if (!digit(text[at])) return fail();
      while (digit(text[at])) at++;
    }
    if (text[at] === 'e' || text[at] === 'E') {
      at++;
      if (text[at] === '+' || text[at] === '-') at++;
      if (!digit(text[at])) return fail();
      while (digit(text[at])) at++;
    }
  };
  type Frame = { kind: 'object'; keys: Set<string>; state: 'firstKey' | 'key' | 'colon' | 'value' | 'afterValue' } |
    { kind: 'array'; state: 'firstValue' | 'value' | 'afterValue' };
  const stack: Frame[] = [];
  const value = (): void => {
    white();
    const c = text[at];
    if (c === '"') { string(false); return; }
    if (c === '{') {
      at++;
      stack.push({ kind: 'object', keys: new Set<string>(), state: 'firstKey' });
      return;
    }
    if (c === '[') {
      at++;
      stack.push({ kind: 'array', state: 'firstValue' });
      return;
    }
    if (c === 't' && text.slice(at, at + 4) === 'true') { at += 4; return; }
    if (c === 'f' && text.slice(at, at + 5) === 'false') { at += 5; return; }
    if (c === 'n' && text.slice(at, at + 4) === 'null') { at += 4; return; }
    if (c === '-' || digit(c)) { number(); return; }
    return fail();
  };
  value();
  while (stack.length) {
    white();
    const frame = stack[stack.length - 1];
    if (frame.kind === 'object') {
      if (frame.state === 'firstKey' && text[at] === '}') { at++; stack.pop(); continue; }
      if (frame.state === 'firstKey' || frame.state === 'key') {
        const key = string(true);
        if (key === '__proto__') throw new ManifestKeyError(key, 'forbidden');
        if (frame.keys.has(key)) throw new ManifestKeyError(key, 'duplicate');
        frame.keys.add(key);
        frame.state = 'colon';
      } else if (frame.state === 'colon') {
        if (text[at++] !== ':') fail();
        frame.state = 'value';
      } else if (frame.state === 'value') {
        frame.state = 'afterValue';
        value();
      } else {
        const separator = text[at++];
        if (separator === '}') stack.pop();
        else if (separator === ',') frame.state = 'key';
        else fail();
      }
    } else if (frame.state === 'firstValue' && text[at] === ']') {
      at++;
      stack.pop();
    } else if (frame.state === 'firstValue' || frame.state === 'value') {
      frame.state = 'afterValue';
      value();
    } else {
      const separator = text[at++];
      if (separator === ']') stack.pop();
      else if (separator === ',') frame.state = 'value';
      else fail();
    }
  }
  white();
  if (at !== text.length) fail();
}
