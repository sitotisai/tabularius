import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateText, NameTable, type CalcContext } from '../src/index.ts';
import { jsonErrorOffset } from '../src/json.ts';

const ctx = { names: new NameTable({ fields: [], occurrences: [] }), occurrence: 'T', field: () => { throw new Error('no fields'); }, related: () => [] } as CalcContext;
const f = (formula: string) => evaluateText(formula, ctx);
const quoted = (value: string) => JSON.stringify(value);

test('jsonErrorOffset finds the first character that cannot continue the text', () => {
  for (const value of ['{}', '[]', '[1,2.5e-3,"a\\n\\u00e9",true,false,null,{"a":[{}]}]', ' \n\t1 ', '"x"', '-0', '0.5']) {
    assert.equal(jsonErrorOffset(value), undefined, value);
  }
  const invalid: [string, number][] = [
    ['{a:1}', 1], ['[1,]', 3], ['{"a":1} x', 8], ['{"a":01}', 6], ['[1.]', 3],
    ['["a\nb"]', 3], ['["\\x"]', 3], ['["\\u12"]', 6], ["{'a':1}", 1],
    ['nul', 3], ['nxl', 1], ['[tru,1]', 4], ['[3', 2], ['{"a":', 5], ['', 0],
  ];
  for (const [value, offset] of invalid) assert.equal(jsonErrorOffset(value), offset, value);
  for (const value of ['{', '}', '[1 2]', '{"a" 1}', '{"a":1,}', '"\\', '1e', '+1', '.5', '[]]', 'tru', 'NaN', '{"a":"b"}x', '[0x10]', '"\u0001"']) {
    assert.notEqual(jsonErrorOffset(value), undefined, value);
  }
});

test('the JSON element functions give a reason in our words', () => {
  const cases: [string, string][] = [
    [`JSONFormatElements ( ${quoted('{a:1}')} )`, '? The text is not valid JSON at position 2'],
    [`JSONListKeys ( ${quoted('{')} ; "" )`, '? The JSON text ends before it is complete'],
    [`JSONListValues ( ${quoted('[1')} ; "" )`, '? The JSON text ends before it is complete'],
    [`JSONDeleteElement ( ${quoted('[')} ; "a" )`, '? The JSON text ends before it is complete'],
    [`JSONGetElementType ( ${quoted('x')} ; "a" )`, '? The text is not valid JSON at position 1'],
    [`JSONGetElement ( ${quoted('[1,]')} ; "a" )`, '? The text is not valid JSON at position 4'],
    [`JSONGetElement ( ${quoted('{"a":1} x')} ; "a" )`, '? The text is not valid JSON at position 9'],
    [`JSONParse ( ${quoted('[3')} )`, '? The JSON text ends before it is complete'],
    [`JSONParse ( ${quoted('nul')} )`, '? The JSON text ends before it is complete'],
    [`JSONParse ( ${quoted('nxl')} )`, '? The text is not valid JSON at position 2'],
    ['JSONParse ( "" )', '? The document is empty'],
    ['JSONParse ( Pi )', '? A JSON object or array is expected'],
  ];
  for (const [formula, expected] of cases) assert.equal(f(formula), expected, formula);
});

test('no reason carries the wording of the JavaScript engine', () => {
  for (const value of ['{a:1}', '{', '[1,]', '[1 2]', '{"a":1} x', '{"a":01}', '"\\', '{"a":"b', '[tru]', '{"a" 1}']) {
    for (const name of ['JSONFormatElements', 'JSONParse']) {
      const result = f(`${name} ( ${quoted(value)} )`);
      assert.match(result, /^\? The (?:JSON text ends before it is complete|text is not valid JSON at position \d+)$/, value);
      assert.doesNotMatch(result, /in JSON at position|Unexpected|Expected|Bad control character|Unterminated string|\(line \d+ column \d+\)|\bJSON input\b/);
    }
  }
  for (const name of ['JSONFormatElements', 'JSONParse']) {
    assert.equal(f(`${name} ( "${'\u0000'}" )`), '? The text is not valid JSON at position 1');
  }
});

test('valid JSON is untouched', () => {
  assert.equal(f(`JSONGetElement ( ${quoted('{"a":[1,{"b":"x"}]}')} ; "a[1].b" )`), 'x');
  assert.equal(f('JSONParse ( "[3]" )'), '[3]');
  assert.equal(f('JSONGetElement ( "" ; "a" )'), '');
});

test('BE_JSON_Error_Description after a failed BE_JSONPath gives the same reason', () => {
  assert.equal(evaluateText(`Let ( x = BE_JSONPath ( ${quoted('{a')} ; "$.a" ) ; BE_JSON_Error_Description )`), 'The text is not valid JSON at position 2');
});
