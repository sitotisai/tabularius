// Synthetic error and boundary cases for the JMESPath implementation used by MBS JSON.Search.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateText } from '../src/index.ts';
import { mbsFunctionNames } from '../src/functions.ts';
import { jmesSearch } from '../src/jmespath.ts';
import { MBS_JSON, compact, parseJson } from '../src/mbs-json.ts';
import { MbsError } from '../src/mbs-text.ts';

const io = { parse: parseJson, compact };
const run = (value: unknown, expr: string) => compact(jmesSearch(parseJson(JSON.stringify(value)), expr, io));

test('JSON.Search is registered and reports syntax errors without leaving a successful result', () => {
  assert.ok(mbsFunctionNames().includes('json.search'));
  for (const expr of ['[', 'a.', 'a[::0]', 'a[1:2:3:4]', 'a[?x', '{a:}', 'a |', 'a ==', 'a &&', 'a / b']) {
    assert.throws(() => run({ a: [1] }, expr), MbsError, expr);
  }
  const scope = {};
  const call = (expr: string) => evaluateText(`MBS ( "JSON.Search" ; "{\\"a\\":1}" ; ${JSON.stringify(expr)} )`, scope);
  assert.match(call('a['), /^\[MBS\] ERROR: JMESPath:/);
  assert.equal(evaluateText('MBS ( "IsError" )', scope), '1');
  assert.equal(call('a'), '1');
  assert.equal(evaluateText('MBS ( "IsError" )', scope), '0');
});

test('JMESPath standard functions refuse bad arity and bad argument types', () => {
  const bad: [string, string][] = [
    ['length', 'length(`1`)'], ['keys', 'keys(`[]`)'], ['values', 'values(`[]`)'],
    ['sort', 'sort(`[1,"x"]`)'], ['sort_by', 'sort_by(`[1]`, `1`)'],
    ['max', 'max(`[1,"x"]`)'], ['min', 'min(`[1,"x"]`)'],
    ['sum', 'sum(`[1,"x"]`)'], ['avg', 'avg(`[1,"x"]`)'],
    ['contains', 'contains(`1`, `1`)'], ['starts_with', 'starts_with(`1`, `1`)'],
    ['ends_with', 'ends_with(`1`, `1`)'], ['join', 'join(`1`, `["a"]`)'],
    ['to_string', 'to_string()'], ['to_number', 'to_number()'],
    ['type', 'type()'], ['not_null', 'not_null()'],
    ['reverse', 'reverse(`1`)'], ['map', 'map(`1`, `[]`)'],
  ];
  for (const [name, expr] of bad) {
    assert.throws(() => run({}, expr), new RegExp(`JMESPath: ${name}: parameter|JMESPath: ${name} was given`), expr);
    assert.throws(() => run({}, `${name}()`), new RegExp(`JMESPath: ${name} was given`), `${name}()`);
  }
  assert.throws(() => run({}, 'does_not_exist(@)'), /unknown function/);
  assert.throws(() => run({}, '"length"(@)'), /quoted name can't be a function/);
});

test('JMESPath expression references and sorting keys reject incompatible values', () => {
  const people = [{ name: 'Éloïse', rank: 2 }, { name: '李', rank: 1 }];
  assert.throws(() => run([{ rank: 2 }, { rank: '1' }], 'sort_by(@, &rank)'), /expression must give all numbers or all strings/);
  assert.throws(() => run(people, 'sort_by(@, name)'), /parameter 2 is the wrong type/);
  assert.throws(() => run(people, 'sort_by(@, &missing)'), /expression must give numbers or strings/);
  assert.throws(() => run(people, '&rank'), /can only be given to a function/);
  assert.equal(run(people, 'sort_by(@, &rank)[].name'), '["李","Éloïse"]');
});

test('JMESPath limits apply to expressions and projected work', () => {
  assert.throws(() => run({}, 'a'.repeat(4001)), /expression is too long/);
  assert.throws(() => run({}, '('.repeat(300) + '@' + ')'.repeat(300)), /nested too deeply|too long/);
  const values = Array.from({ length: 20_000 }, (_, i) => ({ x: i }));
  const input = JSON.stringify(values);
  const args = [{ text: input, number: false }, { text: '[*].x', number: false }];
  assert.equal(compact(parseJson(String(MBS_JSON['json.search'](args, {})))), JSON.stringify(values.map((v) => v.x)));
});

test('JMESPath empty and Unicode results agree with adjacent JSON functions', () => {
  const source = { 'é': ['😀', '雪'], empty: [] };
  assert.equal(run(source, 'length("é")'), '2');
  assert.equal(run(source, 'reverse("é")'), '["雪","😀"]');
  assert.equal(run(source, 'sort(empty)'), '[]');
  assert.equal(run(source, 'avg(empty)'), 'null');
  const scope = {};
  const args = [{ text: JSON.stringify(source), number: false }, { text: '"é"', number: false }];
  const found = MBS_JSON['json.search'](args, scope);
  assert.equal(compact(parseJson(String(found))), compact(parseJson(String(MBS_JSON['json.getpathitem']([
    { text: JSON.stringify(source), number: false }, { text: 'é', number: false },
  ], scope)))));
});
