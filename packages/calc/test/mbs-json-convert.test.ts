import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MBS_JSON } from '../src/mbs-json.ts';
import { MBS_XML } from '../src/mbs-xml.ts';
import { mbsFunctionNames } from '../src/functions.ts';

const scope = {};
const call = (name: string, json: string | number) =>
  MBS_JSON[`json.${name}`]([{ text: String(json), number: typeof json === 'number' }], scope);
const ref = (json: string) => MBS_JSON['json.parse']([{ text: json, number: false }], scope);

test('JSON.ToCSV writes first-seen headers, RFC 4180 cells and compact nested JSON', () => {
  const value = JSON.stringify([{ name: 'Ada, "A"', n: 2, nested: { x: 1 } }, { name: 'Zoë\nZ', extra: true }]);
  assert.equal(call('tocsv', value), 'name,n,nested,extra\r\n"Ada, ""A""",2,"{""x"":1}",\r\n"Zoë\nZ",,,true\r\n');
});
test('JSON.ToCSV empty array is empty text', () => assert.equal(call('tocsv', '[]'), ''));
test('JSON.ToCSV caps an expanded result', () => assert.throws(() => call('tocsv', '[{"x":"' + '"'.repeat(4_100_000).replaceAll('"', '\\"') + '"}]'), /too large/));
test('JSON.ToCSV rejects a nonarray and a nonobject row', () => {
  assert.throws(() => call('tocsv', '{}'), /not an array/);
  assert.throws(() => call('tocsv', '[1]'), /not an object/);
});
test('JSON.ToCSV retains Unicode in headers and values', () => assert.equal(call('tocsv', '[{"名":"🍎"}]'), '名\r\n🍎\r\n'));
test('JSON.ToCSV accepts a JSON.Parse reference like JSON.Compact', () => {
  const id = ref('[{"a":1}]');
  assert.equal(call('tocsv', id), 'a\r\n1\r\n');
  assert.equal(call('compact', id), '[{"a":1}]');
});

test('JSON.ToHTML escapes hostile headers, cells and nested JSON', () => {
  const html = String(call('tohtml', JSON.stringify([{ '<img onerror=alert(1)>': '<script>"&\'</script>', x: { a: '<' } }])));
  assert.match(html, /<th>&lt;img onerror=alert\(1\)&gt;<\/th>/);
  assert.match(html, /<td>&lt;script&gt;&quot;&amp;&#39;&lt;\/script&gt;<\/td>/);
  assert.match(html, /<td>\{&quot;a&quot;:&quot;&lt;&quot;\}<\/td>/);
  assert.doesNotMatch(html, /<script>|<img/);
});
test('JSON.ToHTML empty array yields an empty table', () => assert.equal(call('tohtml', '[]'), '<table><thead><tr></tr></thead><tbody></tbody></table>'));
test('JSON.ToHTML caps escaped expansion', () => assert.throws(() => call('tohtml', '[{"x":"' + '&'.repeat(2_000_000) + '"}]'), /too large/));
test('JSON.ToHTML rejects bad row shape', () => assert.throws(() => call('tohtml', '[null]'), /not an object/));
test('JSON.ToHTML retains Unicode', () => assert.match(String(call('tohtml', '[{"名":"🍎"}]')), /<th>名<\/th><\/tr>.*<td>🍎<\/td>/));
test('JSON.ToHTML accepts a JSON.Parse reference like JSON.Compact', () => {
  const id = ref('[{"a":1}]');
  assert.match(String(call('tohtml', id)), /<td>1<\/td>/);
  assert.equal(call('compact', id), '[{"a":1}]');
});

test('JSON.ToXML encodes names, repeats array items and escapes values', () => {
  assert.equal(call('toxml', '{"1 bad":["<&",2],"_x0031_":null}'), '<root><_x0031__x0020_bad>&lt;&amp;</_x0031__x0020_bad><_x0031__x0020_bad>2</_x0031__x0020_bad><_x005f_x0031_/></root>');
});
test('JSON.ToXML writes empty object and array', () => {
  assert.equal(call('toxml', '{}'), '<root></root>');
  assert.equal(call('toxml', '[]'), '<root/>');
});
test('JSON.ToXML caps escaped expansion', () => assert.throws(() => call('toxml', '"' + '&'.repeat(2_000_000) + '"'), /too large/));
test('JSON.ToXML rejects malformed JSON', () => assert.throws(() => call('toxml', '{bad'), /JSON parse error/));
test('JSON.ToXML retains Unicode', () => assert.equal(call('toxml', '{"名":"🍎"}'), '<root><_x540d_>🍎</_x540d_></root>'));
test('JSON.ToXML accepts a JSON.Parse reference like JSON.Compact', () => {
  const id = ref('{"x":1}');
  assert.equal(call('toxml', id), '<root><x>1</x></root>');
  assert.equal(call('compact', id), '{"x":1}');
});
test('JSON.ToXML output round trips through XML.Parse and XML.Query', () => {
  const xml = String(call('toxml', '{"label":"<🍎&>","values":[1,2]}'));
  const xmlScope = {};
  const id = MBS_XML['xml.parse']([xml], xmlScope);
  assert.equal(MBS_XML['xml.query']([String(id), 'string(/root/label)'], xmlScope), '<🍎&>');
  assert.equal(MBS_XML['xml.query']([String(id), 'count(/root/values)'], xmlScope), '2');
});
test('JSON.ToXML replaces characters XML 1.0 cannot represent', () => {
  assert.equal(call('toxml', JSON.stringify({ x: '\u0000' })), '<root><x>�</x></root>');
});

test('JSON.ToTOON writes tabular arrays and two-space indentation', () => {
  assert.equal(call('totoon', '{"people":[{"name":"Ada","age":2},{"name":"Zoë","age":3}]}'), 'people[2]{name,age}:\n  Ada,2\n  Zoë,3');
});
test('JSON.ToTOON writes empty array and object', () => {
  assert.equal(call('totoon', '[]'), 'items[0]:');
  assert.equal(call('totoon', '{}'), '');
});
test('JSON.ToTOON caps quoted expansion', () => assert.throws(() => call('totoon', '"' + '\n'.repeat(4_100_000) + '"'), /too large/));
test('JSON.ToTOON rejects malformed JSON', () => assert.throws(() => call('totoon', '{bad'), /JSON parse error/));
test('JSON.ToTOON retains Unicode and quotes ambiguous strings', () => assert.equal(
  call('totoon', JSON.stringify({ 名: '🍎', number: '123', exponent: '1e3', comma: 'a,b', quoted: 'a"b' })),
  '名: 🍎\nnumber: "123"\nexponent: "1e3"\ncomma: "a,b"\nquoted: "a\\"b"',
));
test('JSON.ToTOON accepts a JSON.Parse reference like JSON.Compact', () => {
  const id = ref('{"x":1}');
  assert.equal(call('totoon', id), 'x: 1');
  assert.equal(call('compact', id), '{"x":1}');
});
test('all four conversions are registered as MBS functions', () => {
  for (const name of ['json.tocsv', 'json.tohtml', 'json.toxml', 'json.totoon']) assert.ok(mbsFunctionNames().includes(name));
});
