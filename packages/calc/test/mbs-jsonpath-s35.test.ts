import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MBS_JSON, compact, parseJson } from '../src/mbs-json.ts';
import { MbsError } from '../src/mbs-text.ts';
import { mbsFunctionNames } from '../src/functions.ts';

const scope = {};
const call = (name: string, ...args: (string | number)[]) =>
  MBS_JSON[`json.${name.toLowerCase()}`](args.map((a) => ({ text: String(a), number: typeof a === 'number' })), scope);
const normalized = (value: string | number) => compact(parseJson(String(value)));

test('S35 Query selects filtered values', () => {
  assert.equal(normalized(call('Query', '{"a":[{"price":8},{"price":12}]}', '$.a[?(@.price < 10)].price')), '[8]');
});
test('S35 Query returns an empty array for no match', () => {
  assert.equal(normalized(call('Query', '{}', '$.missing')), '[]');
});
test('S35 Query caps an oversized result', () => {
  const repeated = '$[' + Array(400).fill('@').join(',') + '][' + Array(400).fill('@').join(',') + ']';
  assert.throws(() => call('Query', JSON.stringify('x'.repeat(100_000)), repeated), /too large|too many/);
});
test('S35 Query rejects an invalid path', () => {
  assert.throws(() => call('Query', '{}', '$['), MbsError);
});
test('S35 Query reads Unicode keys', () => {
  assert.equal(normalized(call('Query', '{"雪":{"é":3}}', "$['雪']['é']")), '[3]');
});
test('S35 Query agrees with GetPathItem', () => {
  assert.equal(normalized(call('Query', '{"a":3}', '$.a')), normalized('[' + call('GetPathItem', '{"a":3}', 'a') + ']'));
});

test('S35 Replace sets every selected value', () => {
  assert.equal(normalized(call('Replace', '[1,2,3]', '$[0,2]', '9')), '[9,2,9]');
});
test('S35 Replace leaves an unmatched document alone', () => {
  assert.equal(normalized(call('Replace', '{}', '$.missing', '1')), '{}');
});
test('S35 Replace caps repeated large values', () => {
  assert.throws(() => call('Replace', JSON.stringify(Array(150_000).fill(0)), '$[*]', JSON.stringify(Array(1000).fill(0))), /too large/);
});
test('S35 Replace rejects an invalid path', () => {
  assert.throws(() => call('Replace', '[1]', '$[', '2'), MbsError);
});
test('S35 Replace writes a Unicode value', () => {
  assert.equal(normalized(call('Replace', '{"雪":1}', "$['雪']", '"月"')), '{"雪":"月"}');
});
test('S35 Replace agrees with SetPathItem', () => {
  assert.equal(normalized(call('Replace', '{"a":1}', '$.a', '2')), normalized(call('SetPathItem', '{"a":1}', 'a', '2')));
});

test('S35 ReplaceEvaluate evaluates each old value', () => {
  assert.equal(normalized(call('ReplaceEvaluate', '["1","2"]', '$[*]', 'to_number(@)')), '[1,2]');
});
test('S35 ReplaceEvaluate leaves an unmatched document alone', () => {
  assert.equal(normalized(call('ReplaceEvaluate', '{}', '$.missing', '@')), '{}');
});
test('S35 ReplaceEvaluate caps expression length', () => {
  assert.throws(() => call('ReplaceEvaluate', '[1]', '$[*]', 'x'.repeat(10_001)), /too large/);
});
test('S35 ReplaceEvaluate caps aggregate work on huge input', () => {
  assert.throws(() => call('ReplaceEvaluate', JSON.stringify(Array(150_000).fill(0)), '$[*]', 'to_string(@)'), /too large/);
});
test('S35 ReplaceEvaluate rejects an invalid expression', () => {
  assert.throws(() => call('ReplaceEvaluate', '[1]', '$[*]', 'unknown(@)'), MbsError);
});
test('S35 ReplaceEvaluate handles Unicode old values', () => {
  assert.equal(normalized(call('ReplaceEvaluate', '["雪"]', '$[*]', '@')), '["雪"]');
});
test('S35 ReplaceEvaluate agrees with Replace on a fixed result', () => {
  assert.equal(normalized(call('ReplaceEvaluate', '["2"]', '$[*]', 'to_number(@)')), normalized(call('Replace', '["2"]', '$[*]', '2')));
});
test('S35 ReplaceEvaluate keeps a reference unchanged when a later match fails', () => {
  const ref = call('Parse', '["ok",1]');
  assert.throws(() => call('ReplaceEvaluate', String(ref), '$[*]', 'length(@)'), MbsError);
  assert.equal(call('Compact', String(ref)), '["ok",1]');
});

test('S35 Search returns paths of JSONPath matches', () => {
  assert.equal(normalized(call('Search', '{"a":[1,2]}', '$.a[*]')), '["$[\'a\'][0]","$[\'a\'][1]"]');
});
test('S35 Search returns an empty array for no match', () => {
  assert.equal(normalized(call('Search', '{}', '$.missing')), '[]');
});
test('S35 Search caps the number of paths', () => {
  assert.throws(() => call('Search', JSON.stringify(Array(200_001).fill(0)), '$[*]'), /too many|too large/);
});
test('S35 Search rejects an invalid path', () => {
  assert.throws(() => call('Search', '{}', '$['), MbsError);
});
test('S35 Search returns paths for Unicode keys', () => {
  assert.equal(normalized(call('Search', '{"雪":1}', "$['雪']")), '["$[\'雪\']"]');
});
test('S35 Search agrees with Query on match count', () => {
  assert.equal(JSON.parse(String(call('Search', '{"a":1}', '$.a'))).length, JSON.parse(String(call('Query', '{"a":1}', '$.a'))).length);
});
test('S35 Search quotes apostrophes and backslashes in reusable paths', () => {
  const doc = JSON.stringify({ "a'b\\c": 7 });
  const path = (JSON.parse(String(call('Search', doc, '$.*'))) as string[])[0];
  assert.equal(normalized(call('Query', doc, path)), '[7]');
});

test('S35 registers all four names', () => {
  for (const name of ['JSON.Query', 'JSON.Replace', 'JSON.ReplaceEvaluate', 'JSON.Search']) {
    assert.ok(mbsFunctionNames().some((n) => n.toLowerCase() === name.toLowerCase()));
  }
});
