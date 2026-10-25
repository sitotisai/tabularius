// Char, Code, HexEncode and the other encoders refuse a result past the text limit before building it, and
// SortValues and UniqueValues charge their work before sorting: each ends in the error value, never in a raw
// exception, an out-of-memory abort or a stall of the event loop.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CalcError, evaluate, evaluateText, rethrowExecutionRefusal, text, type CalcContext } from '../src/index.ts';

const withField = (value: string): CalcContext => ({ field: (ref) => (ref.field === 'F' ? text(value) : undefined) });
// A refusal before the work takes milliseconds of processor time and the old stall seconds to tens of seconds. The
// thread's own processor time is read, so a busy host that deschedules the test does not fail it.
const LIMIT_MS = 2000;
const cpuMs = (): number => {
  if (typeof process.threadCpuUsage !== 'function') return performance.now();
  const { user, system } = process.threadCpuUsage();
  return (user + system) / 1000;
};
/** A refusal the host unwinds the write for, not a value: the size refusal, or the work budget's when a busy host reaches it first. */
const isRefusal = (e: unknown) => {
  try { rethrowExecutionRefusal(e); } catch { return true; }
  return false;
};
const refused = (formula: string, ctx: CalcContext = {}) =>
  assert.throws(() => evaluateText(formula, ctx), (e) => e instanceof CalcError && isRefusal(e), formula);
function quick<T>(f: () => T): T {
  const started = cpuMs();
  try {
    return f();
  } finally {
    const took = cpuMs() - started;
    assert.ok(took < LIMIT_MS, `took ${Math.round(took)} ms`);
  }
}

test('Char gives ? for a number whose digits do not fit, not a raw RangeError', () => {
  for (const formula of ['Char ( 1e21 )', 'Char ( 1e30 )', 'Char ( -1e300 )', 'Char ( F )']) {
    const ctx = { ...withField(''), field: () => ({ type: 'number', value: 1e25 }) } as CalcContext;
    assert.equal(evaluateText(formula, ctx), '?', formula);
    assert.throws(() => evaluate(formula, ctx), (e) => e instanceof CalcError, formula);
  }
});

test('Char keeps its answers for the numbers it could always read', () => {
  assert.equal(evaluateText('Char ( 65 )'), 'A');
  assert.equal(evaluateText('Char ( 9700065 )'), 'Aa');
  assert.equal(evaluateText('Char ( 0 )'), '');
  assert.equal(evaluateText('Char ( -66 )'), 'B');
  assert.equal(evaluateText('Code ( Char ( 1e20 ) )'), '1');
});

// 8^7 = 2,097,152 characters, built inside the formula the way a hostile calculation would.
/** `fn ( fn ( ... ( inner ) ... ) )`, `levels` deep. */
const nest = (fn: string, levels: number, inner: string) => `${`${fn} ( `.repeat(levels)}${inner}${' )'.repeat(levels)}`;
const BIG = `${'Substitute ( '.repeat(7)}"abcdefgh"${' ; "a" ; "aaaaaaaa" )'.repeat(7)}`;

test('Code refuses a result past the text limit before building it', () => {
  assert.equal(evaluateText(`Length ( ${BIG} )`), String(2_097_152 + 7));
  refused(`Length ( Code ( ${BIG} ) )`);
  assert.equal(evaluateText(`Length ( Code ( Left ( ${BIG} ; 1000000 ) ) )`), '4999997');
});

test('HexEncode refuses a result past the text limit, however deeply it is nested', () => {
  assert.equal(evaluateText(`Length ( HexEncode ( ${BIG} ) )`), String(2 * (2_097_152 + 7)));
  refused(`Length ( HexEncode ( HexEncode ( HexEncode ( ${BIG} ) ) ) )`);
  assert.equal(evaluateText('HexEncode ( "abc" )'), '616263');
});

test('a container is encoded whole, whatever the length of its text (a stored picture is several megabytes)', () => {
  const picture = new Uint8Array(7_000_000).fill(0xab);
  const ctx: CalcContext = { field: () => ({ type: 'container', value: 'photo.jpg', data: picture }) };
  assert.equal(evaluateText('Length ( Base64Encode ( F ) )', ctx), String(Math.ceil(7_000_000 / 3) * 4 + Math.ceil((Math.ceil(7_000_000 / 3) * 4) / 76) - 1));
  assert.equal(evaluateText('Length ( HexEncode ( F ) )', ctx), '14000000');
  assert.ok(evaluateText('Length ( Base64EncodeRFC ( 2045 ; F ) )', ctx) !== '?');
  // The text those make is over the limit, so it cannot be fed to another function that grows it.
  refused('Length ( HexEncode ( Base64Encode ( F ) ) )', ctx);
});

// Built in the test, under the text limit: 2.6 million euro signs, three UTF-8 bytes each (7.8 million bytes).
const EUROS = '\u20ac'.repeat(2_600_000);
const euroField = withField(EUROS);
const b64Len = (bytes: number) => Math.ceil(bytes / 3) * 4;

test('TextEncode is held to the text limit, so a chain of encoders cannot grow the text without end', () => {
  assert.equal(evaluateText('Length ( HexEncode ( TextEncode ( F ) ) )', euroField), String(2 * 7_800_000));
  // A text of 2.7 million euro signs is 8.1 million bytes; the container it would make is refused, not built.
  refused('Length ( HexEncode ( TextEncode ( F ) ) )', withField('\u20ac'.repeat(2_700_000)));
  // The first round made 15.6 million characters of hex, which TextEncode does not take again.
  quick(() => refused('Length ( HexEncode ( TextEncode ( HexEncode ( TextEncode ( F ) ) ) ) )', euroField));
  quick(() => refused(`Length ( ${nest('HexEncode ( TextEncode', 4, 'F')}${' )'.repeat(4)} )`, euroField));
  assert.equal(evaluateText('HexEncode ( TextEncode ( "a" ) )'), '61');
  assert.equal(evaluateText('TextDecode ( TextEncode ( "caf\u00e9" ) )'), 'caf\u00e9');
});

test('the encoders that take text refuse a result past the text limit: CryptEncryptBase64, BE_EncryptAES', () => {
  for (const formula of [
    'Length ( CryptEncryptBase64 ( F ; "k" ) )',
    'Length ( CryptEncryptBase64 ( CryptEncryptBase64 ( CryptEncryptBase64 ( F ; "k" ) ; "k" ) ; "k" ) )',
    'Length ( BE_EncryptAES ( "k" ; F ) )',
    'Length ( BE_EncryptAES ( "k" ; BE_EncryptAES ( "k" ; BE_EncryptAES ( "k" ; F ) ) ) )',
  ]) quick(() => refused(formula, euroField));
  // The size is exact: 33 bytes (the IV buffer and a return) and the encrypted text.
  assert.equal(evaluateText('Length ( BE_EncryptAES ( "k" ; "hello" ) )'), String(b64Len(33 + 5)));
  assert.equal(evaluateText('BE_DecryptAES ( "k" ; BE_EncryptAES ( "k" ; "caf\u00e9" ) )'), 'caf\u00e9');
  assert.equal(evaluateText('CryptDecryptBase64 ( CryptEncryptBase64 ( "hello" ; "k" ) ; "k" )'), 'hello');
  assert.equal(evaluateText('Length ( CryptEncryptBase64 ( "hello" ; "k" ) )'), String(b64Len(8 + 16 + 12 + 5 + 16)));
});

const PICTURE = new Uint8Array(7_000_000).fill(0xab);
const pictureCtx: CalcContext = { field: () => ({ type: 'container', value: 'photo.jpg', data: PICTURE }) };

test('a stored container of several megabytes goes through every encoder that takes a container', () => {
  assert.equal(evaluateText('Length ( MBS ( "Container.GetBase64" ; F ) )', pictureCtx), String(b64Len(7_000_000)));
  assert.equal(evaluateText('Length ( MBS ( "Container.GetDataURL" ; F ) )', pictureCtx), String('data:image/jpeg;base64,'.length + b64Len(7_000_000)));
  assert.equal(evaluateText('Length ( CryptEncryptBase64 ( F ; "k" ) )', pictureCtx), String(b64Len(8 + 'photo.jpg'.length + 16 + 12 + 7_000_000 + 16)));
  const cipher = 'BE_CipherEncrypt ( "aes-256-cbc" ; F ; "' + '00'.repeat(32) + '" ; "' + '00'.repeat(16) + '" )';
  assert.equal(evaluateText(`Length ( ${cipher} )`, pictureCtx), String(2 * 7_000_016));
});

test('the encoders that take a container refuse a result JavaScript could not hold, before building it', () => {
  // Allocated but never written, so it costs address space and no time; a function that built its text would fail.
  const huge = new Uint8Array(410_000_000);
  const ctx: CalcContext = { field: () => ({ type: 'container', value: 'big.bin', data: huge }) };
  const cipher = 'BE_CipherEncrypt ( "aes-256-cbc" ; F ; "' + '00'.repeat(32) + '" ; "' + '00'.repeat(16) + '" )';
  for (const formula of [
    'HexEncode ( F )', 'Base64Encode ( F )', 'Base64EncodeRFC ( 2045 ; F )', 'MBS ( "Container.GetBase64" ; F )',
    'MBS ( "Container.GetDataURL" ; F )', 'CryptEncryptBase64 ( F ; "k" )', cipher,
  ]) quick(() => refused(`Length ( ${formula} )`, ctx));
});

test('text a container made is over the limit, so no function that grows text takes it again', () => {
  refused('Length ( TextEncode ( MBS ( "Container.GetBase64" ; TextEncode ( F ) ) ) )', euroField);
  refused('Length ( HexEncode ( MBS ( "Container.GetDataURL" ; TextEncode ( F ) ) ) )', euroField);
  refused('Length ( BE_EncryptAES ( "k" ; MBS ( "Container.GetBase64" ; TextEncode ( F ) ) ) )', euroField);
  refused('Length ( BE_CipherEncrypt ( "aes-256-cbc" ; HexEncode ( TextEncode ( F ) ) ; "' + '00'.repeat(32) + '" ; "' + '00'.repeat(16) + '" ) )', euroField);
});

test('Base64Encode and GetAsURLEncoded refuse a result past the text limit', () => {
  const big = `Substitute ( ${BIG} ; "a" ; "é" )`;
  refused(`Length ( GetAsURLEncoded ( ${big} ) )`);
  refused(`Length ( ${nest('Base64Encode', 6, BIG)} )`);
  assert.notEqual(evaluateText(`Length ( ${nest('Base64Encode', 2, BIG)} )`), '?');
  assert.equal(evaluateText('Base64Encode ( "abc" )'), 'YWJj');
  assert.equal(evaluateText('GetAsURLEncoded ( "a b&é" )'), 'a%20b%26%C3%A9');
});

const values = (n: number) => Array.from({ length: n }, (_, i) => `v${(i * 7919) % n}`).join('\r');

test('SortValues is refused for a list too long to sort within the work budget', () => {
  const ctx = withField(values(400_000));
  for (const formula of ['SortValues ( F ; 1 ; "German" )', 'SortValues ( F )', 'SortValues ( F ; -2 )']) {
    quick(() => refused(formula, ctx));
  }
});

test('UniqueValues is refused for a list too long for the step budget, and answers one under it', () => {
  quick(() => refused('UniqueValues ( F )', withField(values(350_000))));
  assert.equal(evaluateText('ValueCount ( UniqueValues ( F ) )', withField(values(100_000))), '100000');
});

test('SortValues with no locale sorts a long list correctly', () => {
  const sorted = evaluateText('SortValues ( F )', withField(values(60_000))).split('\r');
  assert.equal(sorted.pop(), '');
  assert.deepEqual(sorted, values(60_000).split('\r').sort());
});

test('UniqueValues still answers a long list', () => {
  const ctx = withField(values(100_000));
  const result = evaluateText('UniqueValues ( F ; 1 ; "German" )', ctx);
  assert.equal(result.split('\r').length, 100_000 + 1);
});

test('SortValues with a locale sorts a long list correctly', () => {
  const ctx = withField(values(60_000));
  const sorted = evaluateText('SortValues ( F ; 1 ; "German" )', ctx).split('\r');
  // The list ends with a return, as every value list does.
  assert.equal(sorted.pop(), '');
  assert.deepEqual(sorted, values(60_000).split('\r').sort());
});

test('SortValues orders text by locale as it did', () => {
  const ev = (f: string) => evaluateText(f).replace(/\r/g, '|');
  assert.equal(ev('SortValues ( "Zebra¶apple¶Äpfel¶Apfel¶zoo¶Zoo" ; 1 ; "German" )'), 'Äpfel|Apfel|apple|Zebra|zoo|Zoo|');
  assert.equal(ev('SortValues ( "b¶a¶B" ; -1 ; "Swedish" )'), 'b|B|a|');
  assert.equal(ev('SortValues ( "x¶3/4/2024¶1/2/2020" ; 3 ; "French" )'), '1/2/2020|3/4/2024|x|');
});
