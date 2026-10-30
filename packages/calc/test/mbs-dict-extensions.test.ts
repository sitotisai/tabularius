import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { evaluateText, type CalcContext } from '../src/index.ts';
import { stackExhausted } from '../src/functions.ts';
import { Env } from '../src/evaluate.ts';
import { MBS_DICT, withValueText } from '../src/mbs-dict.ts';
import { num, text, type Value } from '../src/values.ts';

const harness = (ctx: CalcContext = {}) => {
  const scope = ctx.pluginSession ?? ctx;
  const env = new Env(ctx);
  const call = (name: string, ...args: (string | number | Value)[]): Value => {
    const values = args.map((x) => typeof x === 'string' ? text(x) : typeof x === 'number' ? num(x) : x);
    return withValueText((v) => String(v.value), () => MBS_DICT[name.toLowerCase()]({ values, texts: values.map((v) => String(v.value)) }, scope, env));
  };
  return { call, scope };
};
const answer = (v: Value) => v.value;
const large = 'x'.repeat(8_000_001);

test('ToXML: root and one escaped element per key in dictionary order', () => {
  const { call } = harness();
  const ref = answer(call('Dictionary.Create', 'a b', '<&"\'', '2first', 'two')) as number;
  assert.equal(answer(call('Dictionary.ToXML', ref)), '<Dictionary><a_b>&lt;&amp;&quot;&apos;</a_b><_2first>two</_2first></Dictionary>');
});
test('ToXML: empty dictionary', () => {
  const { call } = harness();
  assert.equal(answer(call('Dictionary.ToXML', answer(call('Dictionary.Create')) as number)), '<Dictionary></Dictionary>');
});
test('ToXML: expanded output respects the text budget', () => {
  const { call } = harness();
  const ref = answer(call('Dictionary.Create', 'a', '&'.repeat(1_700_000))) as number;
  assert.throws(() => call('Dictionary.ToXML', ref), /too large/);
});
test('ToXML: bad reference and extra parameters', () => {
  const { call } = harness();
  assert.throws(() => call('Dictionary.ToXML', 'missing'), /not a dictionary reference/);
  const ref = answer(call('Dictionary.Create')) as number;
  assert.throws(() => call('Dictionary.ToXML', ref, 'extra'), /one dictionary reference/);
});
test('ToXML: Unicode names and values survive', () => {
  const { call } = harness();
  const ref = answer(call('Dictionary.Create', '東京', '雪☃😀')) as number;
  assert.equal(answer(call('Dictionary.ToXML', ref)), '<Dictionary><東京>雪☃😀</東京></Dictionary>');
});
test('ToXML: control characters become valid XML replacement characters', () => {
  const { call } = harness();
  const ref = answer(call('Dictionary.Create', 'xml key', 'a\u0001b')) as number;
  assert.equal(answer(call('Dictionary.ToXML', ref)), '<Dictionary><_xml_key>a\uFFFDb</_xml_key></Dictionary>');
});
test('ToXML: element text agrees with ValueForKey', () => {
  const { call } = harness();
  const ref = answer(call('Dictionary.Create', 'n', 42)) as number;
  assert.equal(answer(call('Dictionary.ToXML', ref)), `<Dictionary><n>${answer(call('Dictionary.ValueForKey', ref, 'n'))}</n></Dictionary>`);
});

test('ToMatrix: key and value rows use dictionary order', () => {
  const { call } = harness();
  const ref = answer(call('Dictionary.Create', 'a', 1, 'z', 2)) as number;
  assert.equal(answer(call('Dictionary.ToMatrix', ref)), 'z\t2\ra\t1');
});
test('ToMatrix: empty dictionary gives empty text', () => {
  const { call } = harness();
  assert.equal(answer(call('Dictionary.ToMatrix', answer(call('Dictionary.Create')) as number)), '');
});
test('ToMatrix: output budget', () => {
  const { call } = harness();
  const ref = answer(call('Dictionary.Create', 'x', 'a'.repeat(4_000_000), 'y', 'b'.repeat(4_000_000))) as number;
  assert.throws(() => call('Dictionary.ToMatrix', ref), /too large/);
});
test('ToMatrix: bad reference and extra parameters', () => {
  const { call } = harness();
  assert.throws(() => call('Dictionary.ToMatrix', 'missing'), /not a dictionary reference/);
  const ref = answer(call('Dictionary.Create')) as number;
  assert.throws(() => call('Dictionary.ToMatrix', ref, 'extra'), /one dictionary reference/);
});
test('ToMatrix: Unicode survives in both columns', () => {
  const { call } = harness();
  const ref = answer(call('Dictionary.Create', '鍵', '値')) as number;
  assert.equal(answer(call('Dictionary.ToMatrix', ref)), '鍵\t値');
});
test('ToMatrix: agrees with ToText default separators', () => {
  const { call } = harness();
  const ref = answer(call('Dictionary.Create', 'b', 'β', 'a', 'α')) as number;
  assert.equal(answer(call('Dictionary.ToMatrix', ref)), answer(call('Dictionary.ToText', ref)));
});
test('ToXML and ToMatrix are dispatched through MBS', () => {
  const ctx: CalcContext = {};
  assert.equal(evaluateText('Let ( d = MBS ( "Dictionary.Create" ; "key" ; "value" ) ; MBS ( "Dictionary.ToXML" ; d ) )', ctx), '<Dictionary><key>value</key></Dictionary>');
  assert.equal(evaluateText('Let ( d = MBS ( "Dictionary.Create" ; "key" ; "value" ) ; MBS ( "Dictionary.ToMatrix" ; d ) )', ctx), 'key\tvalue');
});

test('AddSQL: two-column query loads typed values through ExecuteSQL callback', () => {
  const seen: unknown[] = [];
  const { call } = harness({ executeSQL: (sql, args) => { seen.push(sql, args); return [[text('k'), num(7)]]; } });
  const ref = answer(call('Dictionary.Create')) as number;
  assert.equal(answer(call('Dictionary.AddSQL', ref, 'SELECT ?, value', 'k')), 'OK');
  assert.deepEqual(seen, ['SELECT ?, value', [text('k')]]);
  assert.equal(answer(call('Dictionary.ValueForKey', ref, 'k')), 7);
  assert.equal(evaluateText('Let ( d = MBS ( "Dictionary.Create" ) ; MBS ( "Dictionary.AddSQL" ; d ; "SELECT ?, value" ; "k" ) & MBS ( "Dictionary.ValueForKey" ; d ; "k" ) )', {
    executeSQL: () => [[text('k'), num(7)]],
  }), 'OK7');
});
test('AddSQL: no rows leaves an empty dictionary', () => {
  const { call } = harness({ executeSQL: () => [] });
  const ref = answer(call('Dictionary.Create')) as number;
  assert.equal(answer(call('Dictionary.AddSQL', ref, 'SELECT empty')), 'OK');
  assert.equal(answer(call('Dictionary.Count', ref)), 0);
});
test('AddSQL: oversized row is refused before changes', () => {
  const { call } = harness({ executeSQL: () => [[text('new'), text(large)]] });
  const ref = answer(call('Dictionary.Create', 'old', 1)) as number;
  assert.throws(() => call('Dictionary.AddSQL', ref, 'SELECT big'), /too large/);
  assert.equal(answer(call('Dictionary.Keys', ref)), 'old');
});
test('AddSQL: no read callback and wrong column count refuse without changes', () => {
  const absent = harness();
  const a = answer(absent.call('Dictionary.Create')) as number;
  assert.throws(() => absent.call('Dictionary.AddSQL', a, 'SELECT x'), /not available/);
  const malformed = harness({ executeSQL: () => [[text('only')]] });
  const b = answer(malformed.call('Dictionary.Create')) as number;
  assert.throws(() => malformed.call('Dictionary.AddSQL', b, 'SELECT x'), /two columns/);
  assert.equal(answer(malformed.call('Dictionary.Count', b)), 0);
});
test('AddSQL: Unicode keys and values', () => {
  const { call } = harness({ executeSQL: () => [[text('鍵'), text('値')]] });
  const ref = answer(call('Dictionary.Create')) as number;
  call('Dictionary.AddSQL', ref, 'SELECT unicode');
  assert.equal(answer(call('Dictionary.ValueForKey', ref, '鍵')), '値');
});
test('AddSQL: later rows replace keys as SetValueForKey does', () => {
  const { call } = harness({ executeSQL: () => [[text('k'), num(1)], [text('k'), num(2)]] });
  const ref = answer(call('Dictionary.Create', 'k', 0)) as number;
  call('Dictionary.AddSQL', ref, 'SELECT repeated');
  assert.equal(answer(call('Dictionary.ValueForKey', ref, 'k')), 2);
  assert.equal(answer(call('Dictionary.Count', ref)), 1);
});

test('SetVariables: script writes only valid variable keys with typed values', () => {
  const vars = new Map<string, Value>();
  const ctx: CalcContext = { pluginSession: {}, setVariable: (k, _r, v) => vars.set(k, v) };
  const { call } = harness(ctx);
  const ref = answer(call('Dictionary.Create', '$local', 3, '$$global', 'text')) as number;
  assert.equal(answer(call('Dictionary.SetVariables', ref)), 'OK');
  assert.deepEqual(vars.get('$local'), num(3));
  assert.deepEqual(vars.get('$$global'), text('text'));
});
test('SetVariables: empty dictionary is a no-op inside a script', () => {
  let writes = 0;
  const { call } = harness({ pluginSession: {}, setVariable: () => { writes++; } });
  assert.equal(answer(call('Dictionary.SetVariables', answer(call('Dictionary.Create')) as number)), 'OK');
  assert.equal(writes, 0);
});
test('SetVariables: oversized input is refused before writing', () => {
  let writes = 0;
  const { call } = harness({ pluginSession: {}, setVariable: () => { writes++; } });
  const ref = answer(call('Dictionary.Create', '$a', 'a'.repeat(4_000_000), '$b', 'b'.repeat(4_000_000))) as number;
  assert.throws(() => call('Dictionary.SetVariables', ref), /too large/);
  assert.equal(writes, 0);
});
test('SetVariables: outside scripts and invalid keys never write', () => {
  const outside = harness({ setVariable: () => assert.fail('outside write') });
  const a = answer(outside.call('Dictionary.Create', '$a', 1)) as number;
  assert.throws(() => outside.call('Dictionary.SetVariables', a), /only available in a script/);
  assert.match(evaluateText('Let ( d = MBS ( "Dictionary.Create" ; "$a" ; 1 ) ; MBS ( "Dictionary.SetVariables" ; d ) )', {
    setVariable: () => assert.fail('outside write'),
  }), /^\[MBS\] ERROR: Dictionary.SetVariables is only available in a script/);
  let writes = 0;
  const inside = harness({ pluginSession: {}, setVariable: () => { writes++; } });
  const b = answer(inside.call('Dictionary.Create', '$a', 1, 'field', 2)) as number;
  assert.throws(() => inside.call('Dictionary.SetVariables', b), /not a script variable name/);
  assert.equal(writes, 0);
});
test('SetVariables: Unicode variable name and value', () => {
  const vars = new Map<string, Value>();
  const { call } = harness({ pluginSession: {}, setVariable: (k, _r, v) => vars.set(k, v) });
  const ref = answer(call('Dictionary.Create', '$名前', '雪')) as number;
  call('Dictionary.SetVariables', ref);
  assert.deepEqual(vars.get('$名前'), text('雪'));
});
test('SetVariables: ordinary script Variable sees the result', () => {
  const vars = new Map<string, Value>();
  const ctx: CalcContext = { pluginSession: {}, variable: (k) => vars.get(k), setVariable: (k, _r, v) => { vars.set(k, v); } };
  const { call } = harness(ctx);
  const ref = answer(call('Dictionary.Create', '$answer', 42)) as number;
  call('Dictionary.SetVariables', ref);
  assert.equal(evaluateText('$answer', ctx), '42');
});

test('FM.CF: calls a file custom function with values', () => {
  const ctx: CalcContext = { customFunction: (name) => name === 'Double' ? { parameters: ['n'], formula: 'n * 2' } : undefined };
  assert.equal(evaluateText('MBS ( "FM.CF" ; "Double" ; 21 )', ctx), '42');
});
test('FM.CF: zero-argument custom function', () => {
  const ctx: CalcContext = { customFunction: (name) => name === 'Answer' ? { parameters: [], formula: '42' } : undefined };
  assert.equal(evaluateText('MBS ( "FM.CF" ; "Answer" )', ctx), '42');
});
test('FM.CF: oversized input is refused by the plug-in budget', () => {
  const { call } = harness({ customFunction: () => ({ parameters: ['v'], formula: 'v' }) });
  assert.throws(() => call('FM.CF', 'Identity', large), /too large/);
});
test('FM.CF: missing name, unknown function and wrong arity', () => {
  const ctx: CalcContext = { customFunction: (name) => name === 'One' ? { parameters: ['v'], formula: 'v' } : undefined };
  assert.match(evaluateText('MBS ( "FM.CF" )', ctx), /needs a custom function name/);
  assert.equal(evaluateText('MBS ( "FM.CF" ; "Absent" )', ctx), '?');
  assert.equal(evaluateText('MBS ( "FM.CF" ; "One" )', ctx), '?');
});
test('FM.CF: Unicode name and argument', () => {
  const ctx: CalcContext = { customFunction: (name) => name === '挨拶' ? { parameters: ['v'], formula: 'v & "!"' } : undefined };
  assert.equal(evaluateText('MBS ( "FM.CF" ; "挨拶" ; "こんにちは" )', ctx), 'こんにちは!');
});
test('FM.CF: same result as an ordinary custom function call', () => {
  const ctx: CalcContext = { customFunction: (name) => name === 'PlusOne' ? { parameters: ['n'], formula: 'n + 1' } : undefined };
  assert.equal(evaluateText('MBS ( "FM.CF" ; "PlusOne" ; 9 )', ctx), evaluateText('PlusOne ( 9 )', ctx));
});
test('FM.CF: recursive calls share the calculation recursion budget', () => {
  const ctx: CalcContext = { customFunction: (name) => name === 'Countdown'
    ? { parameters: ['n'], formula: 'If ( n = 0 ; 0 ; MBS ( "FM.CF" ; "Countdown" ; n - 1 ) )' } : undefined };
  assert.equal(evaluateText('MBS ( "FM.CF" ; "Countdown" ; 3 )', ctx), '0');
  assert.equal(evaluateText('MBS ( "FM.CF" ; "Countdown" ; 100000 )', ctx), '?');
});
test('a stack check that itself runs out of stack counts as the stack running out', () => {
  assert.equal(stackExhausted(new RangeError('Maximum call stack size exceeded')), true);
  assert.equal(stackExhausted(new RangeError('too much recursion')), true);
  assert.equal(stackExhausted(new RangeError('Invalid string length')), false);
  const unreadable = new RangeError('x');
  Object.defineProperty(unreadable, 'message', { get() { throw new SyntaxError('Invalid regular expression: Maximum call stack size exceeded'); } });
  assert.equal(stackExhausted(unreadable), true);
});
test('FM.CF: a recursion the stack cannot hold is "?" however much stack there is', () => {
  // Where the stack runs out depends on the machine (frame sizes, how much is compiled), so the run is repeated with several sizes.
  const calc = JSON.stringify(new URL('../src/index.ts', import.meta.url).href);
  const script = `import { evaluateText } from ${calc};
    const ctx = { customFunction: (name) => name === 'Countdown' ? { parameters: ['n'], formula: 'If ( n = 0 ; 0 ; MBS ( "FM.CF" ; "Countdown" ; n - 1 ) )' } : undefined };
    console.log(evaluateText('MBS ( "FM.CF" ; "Countdown" ; 100000 )', ctx));`;
  for (const size of [400, 500, 700, 984, 1500]) {
    const run = spawnSync(process.execPath, ['--no-warnings', `--stack-size=${size}`, '--input-type=module', '-e', script], { encoding: 'utf8', timeout: 20_000 });
    assert.equal(run.stdout.trim(), '?', `stack-size ${size}: ${run.stdout}${run.stderr}`);
  }
});
