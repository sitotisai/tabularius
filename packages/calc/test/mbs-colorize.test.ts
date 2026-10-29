import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, evaluateText, type Value } from '../src/index.ts';
import { mbsFunctionNames } from '../src/functions.ts';
import { withWorkBudget } from '../src/work-budget.ts';
import { MBS_JSON } from '../src/mbs-json.ts';
import { MBS_XML } from '../src/mbs-xml.ts';
import { MAX_TEXT_RESULT } from '../src/text-budget.ts';

const call = (kind: string) => `MBS ( "${kind}.Colorize" ; source )`;
const context = (value: string) => ({ field: () => ({ type: 'text', value } as Value) });
const plainCss = (s: string) => s.replace(/<span[^>]*>|<\/span>/g, '').replace(/<br>/g, '\n')
  .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

for (const [kind, normal, unicode, invalid] of [
  ['JSON', '{"key":"value","n":-12.5e2,"yes":true,"no":null}', '{"雪":"😀\\u0041\\\""}', '{"a":}'],
  ['XML', '<root n="12" yes="true"><item>value</item><!--note--></root>', '<雪 a="😀">é&amp;雪<![CDATA[<😀>]]></雪>', '<root>'],
]) {
  test(`${kind}.Colorize registers and colors normal input through GetAsCSS`, () => {
    assert.ok(mbsFunctionNames().includes(`${kind.toLowerCase()}.colorize`));
    const value = evaluate(call(kind), context(normal));
    assert.equal(value.type, 'text');
    assert.equal(value.value, normal);
    assert.ok(value.type === 'text' && value.runs?.length);
    const css = evaluateText(`GetAsCSS (${call(kind)})`, context(normal));
    assert.match(css, /color: #[0-9A-F]{6}/);
    assert.equal(plainCss(css), normal);
  });
  test(`${kind}.Colorize preserves empty and invalid input unstyled`, () => {
    for (const source of ['', '  ', invalid]) assert.deepEqual(evaluate(call(kind), context(source)), { type: 'text', value: source });
  });
  test(`${kind}.Colorize refuses huge input`, () => {
    assert.match(evaluateText(call(kind), context(' '.repeat(MAX_TEXT_RESULT + 1))), /too large/);
  });
  test(`${kind}.Colorize rejects missing and ambiguous extra arguments`, () => {
    assert.match(evaluateText(`MBS ("${kind}.Colorize")`), /ERROR/);
    assert.match(evaluateText(`MBS ("${kind}.Colorize"; source; 1)`, context(normal)), /not available/);
  });
  test(`${kind}.Colorize preserves unicode, escapes and whitespace when stripping styling`, () => {
    const source = ' \t' + unicode + '\r\n';
    assert.equal(evaluateText(`TextColorRemove (${call(kind)})`, context(source)), source);
    assert.equal(plainCss(evaluateText(`GetAsCSS (${call(kind)})`, context(unicode))), unicode);
  });
  test(`${kind}.Colorize agrees with sibling parsing and compacting`, () => {
    const source = kind === 'JSON' ? '{"a":001,"b":"line\nbreak"}' : '<r a="&#65;">&amp;</r>';
    assert.doesNotMatch(evaluateText(`MBS ("${kind}.Compact"; source)`, context(source)), /ERROR/);
    const value = evaluate(call(kind), context(source));
    assert.ok(value.type === 'text' && value.runs?.length);
    assert.equal(evaluateText(`MBS ("${kind}.Compact"; ${call(kind)})`, context(source)), evaluateText(`MBS ("${kind}.Compact"; source)`, context(source)));
  });
}

test('JSON.Colorize assigns each token class its fixed color', () => {
  const source = '{"k":"v","n":12,"b":true,"z":null}';
  const value = evaluate(call('JSON'), context(source));
  assert.ok(value.type === 'text' && value.runs);
  const colors = new Map(value.runs.map((r) => [source.slice(r.start, r.end), r.color]));
  for (const [token, color] of [['"k"', '#800080'], ['"v"', '#008000'], ['12', '#0000FF'], ['true', '#A0522D'], ['null', '#A0522D'], ['{', '#606060'], [':', '#606060']]) {
    assert.equal(colors.get(token), color);
  }
});

test('XML.Colorize keeps markup distinct from quoted text content', () => {
  const source = '<r n="12" b="true">a "quote &amp; apostrophe\' <child/>tail</r>';
  const value = evaluate(call('XML'), context(source));
  assert.ok(value.type === 'text' && value.runs);
  const colors = new Map(value.runs.map((r) => [source.slice(r.start, r.end), r.color]));
  for (const [token, color] of [['r', '#800080'], ['child', '#800080'], ['"12"', '#0000FF'], ['"true"', '#A0522D'], ['tail', '#008000'], ['/>', '#606060']]) {
    assert.equal(colors.get(token), color);
  }
  assert.equal(plainCss(evaluateText(`GetAsCSS (${call('XML')})`, context(source))), source);
});

for (const kind of ['JSON', 'XML']) {
  test(`${kind}.Colorize bounds expanded style output without returning a partial result`, () => {
    const source = kind === 'JSON' ? '[' + '0,'.repeat(70_000) + '0]' : '<r>' + '<a/>'.repeat(70_000) + '</r>';
    assert.match(evaluateText(call(kind), context(source)), /too large/);
    assert.doesNotMatch(evaluateText(call(kind), context(kind === 'JSON' ? '{}' : '<r/>')), /ERROR/);
  });
}

for (const kind of ['JSON', 'XML']) {
  test(`${kind}.Colorize does not disguise a work refusal as invalid input`, () => {
    assert.throws(() => withWorkBudget(() => kind === 'JSON'
      ? MBS_JSON['json.colorize']([{ text: '{"a":1}', number: false }], {})
      : MBS_XML['xml.colorize'](['<r/>'], {}), { work: 0, nodes: 0 }), /resource limit/);
  });
}
