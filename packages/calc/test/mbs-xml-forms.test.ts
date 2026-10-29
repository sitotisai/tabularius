import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateText } from '../src/index.ts';
import { mbsFunctionNames } from '../src/functions.ts';
import { MBS_XML } from '../src/mbs-xml.ts';
import { MbsError } from '../src/mbs-text.ts';
import { withWorkBudget } from '../src/work-budget.ts';

const D = '<?xml version="1.0" encoding="UTF-8"?>\n';
const session = () => {
  const scope = {};
  return (name: string, ...args: (string | number)[]) => MBS_XML[name.toLowerCase()](args.map(String), scope);
};
const forms = ['XML.Tidy', 'XML.ToJSON', 'XML.Validate', 'XML.Canonical'];
const argsFor = (name: string, xml: string | number): (string | number)[] => name === 'XML.Canonical' ? [xml, 0, 1] : [xml];

test('XML.Parse: inherited object property names are not predefined XML entities', () => {
  for (const entity of ['constructor', '__proto__', 'toString']) {
    assert.throws(() => session()('XML.Parse', `<r>&${entity};</r>`), /unknown entity/);
    assert.throws(() => session()('XML.Parse', `<r a="&${entity};"/>`), /unknown entity/);
  }
});

for (const name of forms) {
  test(`${name}: empty input and an absent argument are errors`, () => {
    const x = session();
    assert.throws(() => x(name, ...argsFor(name, '')), /Failed to parse XML/);
    assert.throws(() => x(name), /Failed to parse XML/);
  });

  test(`${name}: huge input hits the XML budget`, () => {
    assert.throws(() => session()(name, ...argsFor(name, '<r>' + 'x'.repeat(8_000_000) + '</r>')), /XML input is too large/);
  });

  test(`${name}: caller work budgets cannot be reset`, () => {
    assert.throws(() => withWorkBudget(() => session()(name, ...argsFor(name, '<r><a/><b/></r>')),
      { work: 2, nodes: 2 }), /Calculation resource limit/);
  });

  test(`${name}: session references agree with XML.Parse and do not change`, () => {
    const x = session();
    const xml = '<r id="é"><v>雪 &amp; 🌱</v><v/></r>';
    const ref = x('XML.Parse', xml);
    assert.equal(x(name, ...argsFor(name, ref)), x(name, ...argsFor(name, xml)));
    assert.equal(x('XML.Compact', ref, 64), xml);
    x('XML.Release', ref);
    assert.throws(() => x(name, ...argsFor(name, ref)), /Failed to parse XML/);
  });

  test(`${name}: DTDs, external entities and a billion-laughs style input are refused`, () => {
    const declarations = ['<!ENTITY laugh0 "ha">'];
    for (let i = 1; i < 10; i++) declarations.push(`<!ENTITY laugh${i} "${`&laugh${i - 1};`.repeat(10)}">`);
    for (const xml of [
      `<!DOCTYPE r [${declarations.join('')}]><r>&laugh9;</r>`,
      '<!DOCTYPE r SYSTEM "https://example.invalid/external.dtd"><r/>',
      '<!DOCTYPE r [<!ENTITY ext SYSTEM "file:///unavailable.xml">]><r>&ext;</r>',
      '<!DOCTYPE r><r/>',
    ]) assert.throws(() => session()(name, ...argsFor(name, xml)), /DOCTYPE is not supported/);
    for (const entity of ['unknown', 'constructor', '__proto__', 'toString']) {
      assert.throws(() => session()(name, ...argsFor(name, `<r>&${entity};</r>`)), /unknown entity/);
    }
  });

  test(`${name}: malformed XML is refused by the shared parser`, () => {
    for (const xml of ['<r>', '<r/><s/>', '<r a="1" a="2"/>', '<r>\u0000</r>', '<r>]]></r>',
      '<??><r/>', '<?1bad?><r/>', '<?XML version="1.0"?><r/>', '<r><?xml version="1.0"?></r>',
      ' <?xml version="1.0"?><r/>', '<?xml?><r/>', '<?xml version="1.1"?><r/>',
      '<p:r/>', '<r p:a="1"/>', '<r xmlns:xml="urn:wrong"/>', '<r xmlns:p="http://www.w3.org/XML/1998/namespace"/>',
      '<r xmlns="http://www.w3.org/2000/xmlns/"/>', '<r xmlns:xmlns="urn:x"/>', '<r xmlns:p="urn:p"><p:a:b/></r>',
      '<r :a="x"/>', '<×/>']) {
      assert.throws(() => session()(name, ...argsFor(name, xml)), MbsError, xml);
    }
  });
}

test('XML.Tidy: normal elements use two spaces and the sibling declaration', () => {
  const x = session();
  const xml = '<r><a><b/></a><!--c--><?pi data?></r>';
  assert.equal(x('XML.Tidy', xml), `${D}<r>\n  <a>\n    <b/>\n  </a>\n  <!--c-->\n  <?pi data?>\n</r>`);
  assert.equal(x('XML.Tidy', xml), x('XML.Format', xml));
  assert.equal(x('XML.Tidy', '<r/>'), D + '<r/>');
  x('XML.SetSaveNoEmptyTags', 1);
  assert.equal(x('XML.Tidy', '<r/>'), D + '<r></r>');
});

test('XML.Tidy: unicode, mixed content, CDATA and whitespace text stay exact', () => {
  const x = session();
  for (const xml of ['<r> 雪 🌱\t\n <b>é</b> \n </r>', '<r><a/> \t <b/>tail<c/></r>',
    '<r> \n </r>', '<r><![CDATA[ x\n < y ]]><a/></r>', '<r>one&#13;two</r>',
    '<r>\n    <a/>\n</r>', '<r xml:space="preserve"><a><b/></a></r>']) {
    assert.equal(x('XML.Tidy', xml), D + xml);
    assert.equal(x('XML.GetPathValue', x('XML.Tidy', xml), 'r'), x('XML.GetPathValue', xml, 'r'));
  }
});

test('XML.Tidy: unknown option forms stay unavailable', () => {
  assert.throws(() => session()('XML.Tidy', '<r/>', 'unknown'), /isn't available/);
});

test('XML.Tidy: expanded output is bounded without changing a reference', () => {
  const x = session();
  const ref = x('XML.Parse', '<r>' + '<a/>'.repeat(100_000) + '</r>');
  const before = x('XML.Compact', ref, 64);
  assert.throws(() => withWorkBudget(() => x('XML.Tidy', ref), { work: 20, nodes: 20 }), /resource limit/);
  assert.equal(x('XML.Compact', ref, 64), before);
  assert.throws(() => x('XML.Tidy', '<r>' + '>'.repeat(2_100_000) + '</r>'), /too large/);
});

test('XML.ToJSON: attributes, text, repeated siblings and empty elements', () => {
  assert.equal(session()('XML.ToJSON', '<r id="1"><a>one</a><a>two</a><empty/></r>'),
    '{"r":{"@id":"1","a":[{"#text":"one"},{"#text":"two"}],"empty":{}}}');
  assert.equal(session()('XML.ToJSON', '<r/>'), '{"r":{}}');
});

test('XML.ToJSON: unicode and direct mixed text agree with sibling text reads', () => {
  const x = session();
  const xml = '<r a="é"> 雪<![CDATA[🌱]]><!--ignored--><?pi ignored?><b>child</b> &amp; </r>';
  const result = JSON.parse(String(x('XML.ToJSON', xml)));
  assert.deepEqual(result, { r: { '@a': 'é', '#text': ' 雪🌱 & ', b: { '#text': 'child' } } });
  assert.equal(result.r.b['#text'], x('XML.GetPathValue', xml, 'r.b'));
});

test('XML.ToJSON: namespace declarations, prototype names and JSON escaping are data', () => {
  const xml = '<r xmlns:p="urn:p"><__proto__>a</__proto__><__proto__>b</__proto__><constructor/><p:v a="&quot;&#9;">\\\n</p:v></r>';
  const result = JSON.parse(String(session()('XML.ToJSON', xml)));
  assert.equal(result.r['@xmlns:p'], 'urn:p');
  assert.deepEqual(result.r.__proto__, [{ '#text': 'a' }, { '#text': 'b' }]);
  assert.deepEqual(result.r.constructor, {});
  assert.deepEqual(result.r['p:v'], { '@a': '"\t', '#text': '\\\n' });
});

test('XML.ToJSON: unknown options stay unavailable and expanded JSON is bounded', () => {
  assert.throws(() => session()('XML.ToJSON', '<r/>', 1), /isn't available/);
  assert.throws(() => session()('XML.ToJSON', '<r>' + '\t'.repeat(4_100_000) + '</r>'), /too large/);
});

test('XML.Validate: DTD-free well-formed XML succeeds, including unicode and empty elements', () => {
  const x = session();
  for (const xml of ['<r/>', '<r a="1"><c/></r>', '<根 a="é">雪 🌱 &amp; &#13;</根>',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><r xmlns:p="urn:p"><p:c/></r>',
    '<r><![CDATA[<!DOCTYPE is text>]]><!--<!DOCTYPE is a comment>--><?pi <!DOCTYPE is data>?></r>']) {
    assert.equal(x('XML.Validate', xml), 'OK');
    assert.equal(x('XML.Validate', x('XML.Format', xml)), 'OK');
  }
  assert.equal(x('XML.Validate', '<r/>', ''), 'OK');
});

test('XML.Validate: schema arguments explicitly say XML Schema is not implemented', () => {
  for (const schema of ['<schema/>', 'https://example.invalid/schema.xsd', '1']) {
    assert.throws(() => session()('XML.Validate', '<r/>', schema), /XML Schema is not implemented/);
  }
  assert.throws(() => session()('XML.Validate', '<r/>', '', 1), /isn't available/);
});

test('XML.Canonical: exclusive form sorts attributes, expands empties and escapes canonically', () => {
  const xml = '<?xml version="1.0"?><r z="&gt;" a="&#9;&#10;&#13;&quot;&lt;&amp;"><e/><![CDATA[<>&]]>&#13;</r>';
  assert.equal(session()('XML.Canonical', xml, 0, 1), '<r a="&#x9;&#xA;&#xD;&quot;&lt;&amp;" z=">"><e></e>&lt;&gt;&amp;&#xD;</r>');
  assert.equal(session()('XML.Canonical', '<r/>', 0, 1), '<r></r>');
});

test('XML.Canonical: exclusive unicode agrees with inclusive modes on the supported subset', () => {
  const x = session();
  const xml = '<根 z="🌱" a="é">雪</根>';
  for (const mode of [0, 2]) assert.equal(x('XML.Canonical', xml, 0, 1), x('XML.Canonical', xml, 0, mode));
  assert.equal(x('XML.Canonical', '<r 𐀀="2" 豈="1"/>', 0, 1), '<r 豈="1" 𐀀="2"></r>');
});

test('XML.Canonical: exclusive comments and instructions use canonical document line breaks', () => {
  const xml = '<!--before--><?p a?><r><!--inside--><?q b?></r><?s c?><!--after-->';
  assert.equal(session()('XML.Canonical', xml, 0, 1), '<?p a?>\n<r><?q b?></r>\n<?s c?>');
  assert.equal(session()('XML.Canonical', xml, 2, 1), '<!--before-->\n<?p a?>\n<r><!--inside--><?q b?></r>\n<?s c?>\n<!--after-->');
});

test('XML.Canonical: exclusive namespace complexity and unknown arguments are refused', () => {
  for (const xml of ['<r xmlns="urn:r"/>', '<r xmlns:p="urn:p"/>', '<r xml:lang="en"/>',
    '<r><c xmlns=""/></r>']) assert.throws(() => session()('XML.Canonical', xml, 0, 1), /Exclusive canonicalization.*isn't available/);
  assert.throws(() => session()('XML.Canonical', '<r/>', 0, 1, 'p'), /isn't available/);
  assert.throws(() => session()('XML.Canonical', '<r/>', 'bad', 1), /not a number/);
  assert.throws(() => session()('XML.Canonical', '<r/>', 0, 3), /mode must be/);
  assert.throws(() => session()('XML.Canonical', '<r/>', 4, 1), /isn't available/);
});

test('XML.Canonical: exclusive expanded output hits the budget', () => {
  assert.throws(() => session()('XML.Canonical', '<r>' + '>'.repeat(2_100_000) + '</r>', 0, 1), /too large/);
});

test('MBS registration exposes the new forms and reports errors through IsError', () => {
  for (const name of forms) assert.ok(mbsFunctionNames().includes(name.toLowerCase()));
  for (const name of forms.slice(0, 3)) {
    const ctx = {};
    assert.doesNotMatch(evaluateText(`MBS ( "${name}" ; "<r/>" )`, ctx), /ERROR|available/);
    assert.match(evaluateText(`MBS ( "${name}" ; "<r>" )`, ctx), /^\[MBS\] ERROR: Failed to parse XML/);
    assert.equal(evaluateText('MBS ( "IsError" )', ctx), '1');
  }
});

for (const name of forms) {
  test(`${name}: deep documents are refused before JavaScript stack exhaustion`, () => {
    const x = session();
    assert.throws(() => x(name, ...argsFor(name, '<r>'.repeat(257) + '</r>'.repeat(257))), /nested too deeply/);
    if (name !== 'XML.Validate') {
      assert.throws(() => x(name, ...argsFor(name, '<r>'.repeat(140) + '</r>'.repeat(140))), /nests too deeply/);
    }
    assert.throws(() => x(name, ...argsFor(name, '123')), /Failed to parse XML/);
    assert.doesNotThrow(() => x(name, ...argsFor(name, '<r><!-- <!DOCTYPE r> --><![CDATA[<!DOCTYPE r>]]>&amp;</r>')));
  });
}

test('DTD-free checks preserve sibling recovery behavior and check reference edits', () => {
  const x = session();
  const xml = '<!DOCTYPE r><r/>';
  assert.equal(x('XML.Format', xml, 64), '<r/>');
  assert.throws(() => x('XML.Validate', xml), /DOCTYPE.*not supported/);
  // XML.Parse has already discarded the declaration; a reference checks only the retained tree.
  assert.equal(x('XML.Validate', x('XML.Parse', xml)), 'OK');
  const ref = x('XML.Parse', '<r/>');
  x('XML.SetPathValue', ref, 'r.bad:name', 0, 'x');
  assert.throws(() => x('XML.Validate', ref), /unbound namespace prefix/);
});

test('XML.Tidy indents around a text-bearing child without changing that child text', () => {
  const x = session();
  const xml = '<r><a>  text\n\t </a><b/></r>';
  const result = String(x('XML.Tidy', xml));
  assert.equal(result, `${D}<r>\n  <a>  text\n\t </a>\n  <b/>\n</r>`);
  assert.equal(x('XML.GetPathValue', result, 'r.a'), x('XML.GetPathValue', xml, 'r.a'));
});

test('XML.Canonical normalizes literal newlines and is registered through MBS', () => {
  assert.equal(session()('XML.Canonical', '<r>a\r\nb\rc&#xD;</r>', 0, 1), '<r>a\nb\nc&#xD;</r>');
  assert.equal(evaluateText('MBS ( "XML.Canonical" ; "<r/>" ; 0 ; 1 )', {}), '<r></r>');
});

for (const name of ['XML.ToJSON', 'XML.Canonical']) {
  test(`${name}: output-budget refusal leaves the reference intact`, () => {
    const x = session();
    const value = name === 'XML.ToJSON' ? '\t'.repeat(4_000_001) : '>'.repeat(2_000_001);
    const ref = x('XML.Parse', `<r><![CDATA[${value}]]></r>`);
    assert.throws(() => x(name, ...argsFor(name, ref)), /too large/);
    assert.equal(x('XML.GetPathValue', ref, 'r'), value);
  });
}
