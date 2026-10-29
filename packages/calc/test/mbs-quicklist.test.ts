// MBS ( "QuickList.…" ) against the examples on MBS's own function pages (mbsplugins.eu).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateText, text } from '../src/index.ts';
import { MBS_QUICKLIST } from '../src/mbs-quicklist.ts';
import { MbsError } from '../src/mbs-text.ts';

const L = (s: string) => s.replace(/¶/g, '\r');
const session = () => {
  const scope = {};
  return (name: string, ...args: (string | number)[]) => MBS_QUICKLIST[name.toLowerCase()](args.map(String), scope);
};

test('MBS QuickList: making, adding and reading', () => {
  const x = session();
  const q = x('QuickList.New', L('Hello¶World'));
  assert.equal(q, 12000);
  assert.equal(x('QuickList.New', 'Hello|World', '|'), 12001);
  assert.equal(x('QuickList.GetList', x('QuickList.New', '1\r2\n3\r4')), L('1¶2¶3¶4¶'));
  x('QuickList.AddValue', q, '1234');
  x('QuickList.AddValue', q, '5678');
  assert.equal(x('QuickList.GetList', q), L('Hello¶World¶1234¶5678¶'));
  assert.equal(x('QuickList.GetList', q, 1, ''), 'HelloWorld12345678');
  assert.equal(x('QuickList.GetList', q, 1, ' '), 'Hello World 1234 5678');
  assert.equal(x('QuickList.Count', q), 4);
  assert.equal(x('QuickList.GetValue', q, 1), 'World');
  assert.throws(() => x('QuickList.GetValue', q, 4), MbsError);
  const m = x('QuickList.New');
  x('QuickList.AddValue', m, 'First');
  x('QuickList.AddMultiValue', m, 'Middle', 10);
  x('QuickList.AddValue', m, 'Last');
  assert.equal(x('QuickList.GetList', m, 1), ['First', ...Array(10).fill('Middle'), 'Last'].join('\r'));
  const h = x('QuickList.New');
  x('QuickList.AddMultiValue', h, L('Hello¶World'), 3);
  assert.equal(x('QuickList.GetList', h, 1), L('Hello¶World¶Hello¶World¶Hello¶World'));
  const o = x('QuickList.New', L('1¶2'));
  x('QuickList.AddQuickList', q, o);
  x('QuickList.AddList', o, L('a¶b'));
  assert.equal(x('QuickList.GetList', o, 1), L('1¶2¶a¶b'));
  assert.equal(x('QuickList.SetValue', q, 0, 'Element 0'), 'OK');
  assert.equal(x('QuickList.GetValue', q, 0), 'Element 0');
  const named = x('QuickList.New', 'a', '', 'IDs');
  assert.equal(named, 'IDs');
  assert.equal(x('QuickList.Count', 'IDs'), 1);
  assert.equal(x('QuickList.JSONArray', x('QuickList.New', L('Hello¶World'))), '["Hello", "World"]');
  const j = x('QuickList.New');
  ['{"id": 1}', '{"id": 2}'].forEach((v) => x('QuickList.AddValue', j, v));
  assert.equal(x('QuickList.JoinJSON', j), '[{"id": 1}, {"id": 2}]');
  x('QuickList.AddValue', j, 'nope');
  assert.throws(() => x('QuickList.JoinJSON', j), /not JSON/);
});

test('MBS QuickList: Push, Pop, prefixes and matching', () => {
  const x = session();
  const s = x('QuickList.New');
  x('QuickList.Push', s, 'Hello');
  x('QuickList.Push', s, 'World');
  assert.equal(x('QuickList.Pop', s), 'World');
  assert.equal(x('QuickList.Pop', s), 'Hello');
  assert.equal(x('QuickList.Pop', s), '');
  const p = x('QuickList.New', L('Hello¶World'));
  x('QuickList.AddPrefix', p, '>');
  x('QuickList.AddPostfix', p, '<');
  assert.equal(x('QuickList.GetList', p, 1), L('>Hello<¶>World<'));
  x('QuickList.RemovePrefix', p, '>');
  x('QuickList.RemovePostfix', p, '<');
  assert.equal(x('QuickList.GetList', p, 1), L('Hello¶World'));
  const w = x('QuickList.New', L('Hello¶World¶auto'));
  assert.equal(x('QuickList.MatchesPrefix', w, 'w', 0), 'OK');
  assert.equal(x('QuickList.GetList', w, 1), 'World');
  const n = x('QuickList.New', L('Hello¶World¶auto'));
  x('QuickList.MatchesPrefix', n, 'w', 4);
  assert.equal(x('QuickList.GetList', n, 1), L('Hello¶auto'));
  const sp = x('QuickList.New', L('Hello¶World¶auto'));
  const hits = x('QuickList.MatchesSubString', sp, 'orl', 3);
  assert.equal(x('QuickList.GetList', hits, 1), 'World');
  assert.equal(x('QuickList.GetList', sp, 1), L('Hello¶auto'));
  const c = x('QuickList.New', L('1-a-A¶2-b-B¶3-c-C'));
  x('QuickList.DeleteColumn', c, '-', 1);
  assert.equal(x('QuickList.GetList', c, 1), L('1-A¶2-B¶3-C'));
  const g = x('QuickList.New', L('Hello,123,abc¶World,456,def'));
  assert.equal(x('QuickList.GetList', x('QuickList.GetColumn', g, ',', 1, 1), 1), L('123¶456'));
  assert.equal(x('QuickList.CountValuesMatching', x('QuickList.New', L('1¶2¶3¶4')), '<', 4), 3);
  assert.equal(x('QuickList.IndexOfFirstValueMatching', x('QuickList.New', L('1¶2¶3¶4')), '≥', 4), 3);
  assert.equal(x('QuickList.HasValues', x('QuickList.New', L('Hello¶World¶123')), L('World¶Other¶123')), L('World¶123'));
  assert.equal(x('QuickList.ValueIndex', w, 'WORLD'), 0);
});

test('MBS QuickList: sets, sorting with other lists and references', () => {
  const x = session();
  const l1 = x('QuickList.New', L('a¶b¶c¶d'));
  const l3 = x('QuickList.And', l1, x('QuickList.New', L('a¶d')), 1);
  assert.equal(x('QuickList.GetList', l3, 1), L('a¶d'));
  assert.equal(x('QuickList.GetList', l1, 1), L('a¶b¶c¶d'));
  assert.equal(x('QuickList.Or', l1, x('QuickList.New', L('d¶e'))), 'OK');
  assert.equal(x('QuickList.GetList', l1, 1), L('a¶b¶c¶d¶e'));
  const keys = x('QuickList.New', L('234¶123¶545¶152'));
  const first = x('QuickList.New', L('Bob¶John¶Bill¶Chris'));
  const cities = x('QuickList.New', L('New York¶Santa Clara¶San Francisco¶Atlanta'));
  assert.equal(x('QuickList.SortWith', keys, 0, first, cities), 'OK');
  assert.equal(x('QuickList.GetList', keys, 1), L('123¶152¶234¶545'));
  assert.equal(x('QuickList.GetList', first, 1), L('John¶Chris¶Bob¶Bill'));
  assert.equal(x('QuickList.GetList', cities, 1), L('Santa Clara¶Atlanta¶New York¶San Francisco'));
  const people = x('QuickList.New', L('65412|Schreiber|Klaus¶76542|Abraham|Hermmann¶85112|Behrens|Robert'));
  const names = x('QuickList.DeCombine', people, '|', 1, 1, 1);
  x('QuickList.SortWith', names, 1, people);
  assert.equal(x('QuickList.GetList', people, 1), L('76542|Abraham|Hermmann¶85112|Behrens|Robert¶65412|Schreiber|Klaus'));
  assert.equal(x('QuickList.SubList', people, 1, 1, 0, 1), '85112|Behrens|Robert');
  const ser = x('QuickList.Deserialize', x('QuickList.Serialize', x('QuickList.New', L('Hello¶World¶1234¶Just a test!'))));
  assert.equal(x('QuickList.GetList', ser, 1), L('Hello¶World¶1234¶Just a test!'));
  const r = x('QuickList.New', L('a¶b¶c¶b¶e¶f'));
  x('QuickList.RemoveValues', r, x('QuickList.New', L('b¶e')));
  assert.equal(x('QuickList.GetList', r, 1), L('a¶c¶f'));
  assert.equal(x('QuickList.Release', r), 'OK');
  assert.equal(x('QuickList.Free', l3), 'OK');
  assert.throws(() => x('QuickList.Count', r), /not a QuickList reference/);
  assert.throws(() => x('QuickList.AddMultiValue', x('QuickList.New'), 'x', 6_000_000), /at most/);
});

test('MBS QuickList through MBS ( … ): lists last for the calculation context', () => {
  const c = {};
  assert.equal(evaluateText('Let ( q = MBS ( "QuickList.New" ; "b¶a" ) ; MBS ( "QuickList.Sort" ; q ) & MBS ( "QuickList.GetList" ; q ; 1 ) )', c), 'OKa\rb');
  assert.equal(evaluateText('Let ( q = MBS ( "QuickList.CSVSplit" ; "a,b" ) ; MBS ( "QuickList.GetList" ; q ) )', c), 'a\tb\r');
});

test('MBS Dictionary.SetQuickList reads key and value lines from a QuickList', () => {
  const c = {};
  assert.equal(evaluateText('Let ( [ q = MBS ( "QuickList.New" ; "Hello=World¶Other=Value" ) ; d = MBS ( "Dictionary.Create" ) ; r = MBS ( "Dictionary.SetQuickList" ; d ; q ; "=" ) ] ; r & MBS ( "Dictionary.ValueForKey" ; d ; "Other" ) )', c), 'OKValue');
});

test('MBS QuickList limits: empty AddMultiValue, the session total, and cheap appends', () => {
  const x = session();
  const e = x('QuickList.New');
  const t0 = Date.now();
  assert.equal(x('QuickList.AddMultiValue', e, '', 1e12), 'OK');
  assert.ok(Date.now() - t0 < 5000);
  assert.equal(x('QuickList.Count', e), 0);
  const a = x('QuickList.New');
  x('QuickList.AddMultiValue', a, 'x', 5_000_000);
  assert.throws(() => x('QuickList.InsertValue', a, 0, 'y'), /at most 5000000/);
  assert.throws(() => x('QuickList.SetValue', a, 5_000_000, 'y'), /at most 5000000/);
  assert.equal(x('QuickList.SetValue', a, 0, 'y'), 'OK');
  const b = x('QuickList.New');
  x('QuickList.AddMultiValue', b, 'x', 5_000_000);
  assert.throws(() => x('QuickList.New', 'one'), /together/);
  assert.throws(() => x('QuickList.AddValue', e, 'one'), /together/);
  assert.throws(() => x('QuickList.Clone', b), /together/);
  x('QuickList.Release', b);
  const t1 = Date.now();
  for (let i = 0; i < 2000; i++) x('QuickList.AddValue', e, 'v');
  assert.ok(Date.now() - t1 < 2000);
});

test('MBS QuickList matching with flag 2 keeps the source when no new list can be made', () => {
  const x = session();
  const src = x('QuickList.New', L('Hello¶World'));
  for (let i = 1; i < 10_000; i++) x('QuickList.New');
  assert.throws(() => x('QuickList.MatchesPrefix', src, 'W', 2), /Too many/);
  assert.equal(x('QuickList.GetList', src, 1), L('Hello¶World'));
});

test('MBS QuickList.SortWithEvaluate: stable evaluated keys and empty list', () => {
  const scope = {};
  const call = (name: string, ...args: (string | number)[]) => MBS_QUICKLIST[name.toLowerCase()](args.map(String), scope);
  const q = call('QuickList.New', L('b¶A¶a¶B'));
  // Direct service call mirrors Evaluate's value substitution while keeping the session list.
  const result = MBS_QUICKLIST['quicklist.sortwithevaluate']([String(q), '?'], scope, { evaluate: (f) => f.slice(1, -1).toLowerCase() });
  assert.equal(result, 'OK');
  assert.equal(call('QuickList.GetList', q, 1), L('A¶a¶b¶B'));
  const empty = call('QuickList.New');
  MBS_QUICKLIST['quicklist.sortwithevaluate']([String(empty), '?'], scope, { evaluate: (f) => f });
  assert.equal(call('QuickList.Count', empty), 0);
});

test('MBS QuickList.SortWithEvaluate evaluates formulas through the calculation context', () => {
  assert.equal(evaluateText('Let ( [ q = MBS ( "QuickList.New" ; "b¶A" ) ; r = MBS ( "QuickList.SortWithEvaluate" ; q ; "Upper ( ? )" ) ] ; r & MBS ( "QuickList.GetList" ; q ; 1 ) )', {}), 'OKA\rb');
});

test('MBS QuickList.SortWithEvaluate: unicode and sibling Sort order', () => {
  const scope = {};
  const call = (name: string, ...args: (string | number)[]) => MBS_QUICKLIST[name.toLowerCase()](args.map(String), scope);
  const q = call('QuickList.New', 'é\r水\r😀\rá');
  MBS_QUICKLIST['quicklist.sortwithevaluate']([String(q), '?'], scope, { evaluate: (f) => f.slice(1, -1) });
  assert.equal(call('QuickList.GetList', q, 1), 'á\ré\r水\r😀');
  const sibling = call('QuickList.New', L('b¶A¶a¶B'));
  MBS_QUICKLIST['quicklist.sortwithevaluate']([String(sibling), '?'], scope, { evaluate: (f) => f.slice(1, -1) });
  assert.equal(call('QuickList.GetList', sibling, 1), L('A¶B¶a¶b'));
});

test('MBS QuickList.SortWithEvaluate: bad form and evaluate work budget', () => {
  const scope = {};
  const q = MBS_QUICKLIST['quicklist.new'](['a\rb\rc'], scope);
  assert.throws(() => MBS_QUICKLIST['quicklist.sortwithevaluate']([String(q), 'Upper ( value )'], scope, { evaluate: (f) => f }), /\? value placeholder/);
  let calls = 0;
  assert.throws(() => MBS_QUICKLIST['quicklist.sortwithevaluate']([String(q), '?'], scope, { evaluate: () => {
    if (++calls > 2) throw new Error('Calculation exceeds the supported work budget');
    return 'a';
  } }), /work budget/);
});

test('MBS QuickList.SortWithEvaluate leaves quoted question marks alone', () => {
  const scope = {};
  const q = MBS_QUICKLIST['quicklist.new'](['b\ra'], scope);
  MBS_QUICKLIST['quicklist.sortwithevaluate']([String(q), 'If ( ? = "?" ; "z" ; ? )'], scope, { evaluate: (f) => f });
  assert.equal(MBS_QUICKLIST['quicklist.getlist']([String(q), '1'], scope), 'a\rb');
});

test('MBS QuickList.SortWithEvaluate: huge input hits the evaluation work budget', () => {
  const values = Array.from({ length: 100_000 }, (_, i) => `v${i}`).join('¶');
  assert.throws(() => evaluateText(`Let ( [ q = MBS ( "QuickList.New" ; "${values}" ) ; r = MBS ( "QuickList.SortWithEvaluate" ; q ; "?" ) ] ; r )`, {}), /work budget/);
});

test('MBS QuickList.AddSQL appends the query result column and binds parameters', () => {
  const scope = {};
  const q = MBS_QUICKLIST['quicklist.new'](['seed'], scope);
  const got = MBS_QUICKLIST['quicklist.addsql']([String(q), 'SELECT name WHERE id = ?', '7'], scope, {
    executeSQL: (query, args) => {
      assert.equal(query, 'SELECT name WHERE id = ?');
      assert.deepEqual(args, ['7']);
      return [['alpha', 'ignored'], ['βeta', 'ignored']];
    },
  });
  assert.equal(got, 'OK');
  assert.equal(MBS_QUICKLIST['quicklist.getlist']([String(q), '1'], scope), 'seed\ralpha\rβeta');
});

test('MBS QuickList.AddSQL uses the calculation ExecuteSQL bridge', () => {
  let seen = '';
  const got = evaluateText('Let ( [ q = MBS ( "QuickList.New" ; "seed" ) ; r = MBS ( "QuickList.AddSQL" ; q ; "SELECT value WHERE id = ?" ; "9" ) ] ; r & MBS ( "QuickList.GetList" ; q ; 1 ) )', {
    executeSQL: (query, args) => {
      seen = `${query}/${args.map((a) => a.type === 'text' ? a.value : '').join(',')}`;
      return [[text('result')]];
    },
  });
  assert.equal(got, 'OKseed\rresult');
  assert.equal(seen, 'SELECT value WHERE id = ?/9');
});

test('MBS QuickList.AddSQL refuses privilege failures and writes', () => {
  const scope = {};
  const q = MBS_QUICKLIST['quicklist.new'](['seed'], scope);
  const denied = { executeSQL: () => { throw new Error('ExecuteSQL cannot read table here'); } };
  assert.throws(() => MBS_QUICKLIST['quicklist.addsql']([String(q), 'SELECT secret FROM T'], scope, denied), /cannot read table/);
  assert.equal(MBS_QUICKLIST['quicklist.getlist']([String(q), '1'], scope), 'seed');
  const readOnly = { executeSQL: (query: string) => {
    if (!/^\s*SELECT\b/i.test(query)) throw new Error('SQL is read only');
    return [];
  } };
  assert.throws(() => MBS_QUICKLIST['quicklist.addsql']([String(q), 'DELETE FROM T'], scope, readOnly), /read only/);
});

test('MBS QuickList.AddSQL refuses an oversized query result without a partial append', () => {
  const scope = {};
  const q = MBS_QUICKLIST['quicklist.new'](['seed'], scope);
  assert.throws(() => MBS_QUICKLIST['quicklist.addsql']([String(q), 'SELECT value'], scope, {
    executeSQL: () => Array.from({ length: 100_001 }, () => ['x']),
  }), /at most 100000 rows/);
  assert.equal(MBS_QUICKLIST['quicklist.getlist']([String(q), '1'], scope), 'seed');
});

test('MBS QuickList.AddSQL handles an empty query result', () => {
  const scope = {};
  const q = MBS_QUICKLIST['quicklist.new']([], scope);
  assert.equal(MBS_QUICKLIST['quicklist.addsql']([String(q), 'SELECT value'], scope, { executeSQL: () => [] }), 'OK');
  assert.equal(MBS_QUICKLIST['quicklist.count']([String(q)], scope), 0);
});

test('MBS QuickList.AddSQL keeps unicode result text', () => {
  const scope = {};
  const q = MBS_QUICKLIST['quicklist.new']([], scope);
  MBS_QUICKLIST['quicklist.addsql']([String(q), 'SELECT value'], scope, { executeSQL: () => [['café'], ['東京'], ['😀']] });
  assert.equal(MBS_QUICKLIST['quicklist.getlist']([String(q), '1'], scope), 'café\r東京\r😀');
});

test('MBS QuickList.AddSQL is unavailable without ExecuteSQL', () => {
  const scope = {};
  const q = MBS_QUICKLIST['quicklist.new']([], scope);
  assert.throws(() => MBS_QUICKLIST['quicklist.addsql']([String(q), 'SELECT value'], scope), /not available here/);
});
