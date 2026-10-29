import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MBS_LIST } from '../src/mbs-list.ts';
import { MBS_QUICKLIST } from '../src/mbs-quicklist.ts';
import { mbsFunctionNames } from '../src/functions.ts';

const callList = (name: string, ...args: (string | number)[]) => MBS_LIST[name.toLowerCase()](args.map(String));
const session = () => {
  const scope = {};
  const call = (name: string, ...args: (string | number)[]) => MBS_QUICKLIST[name.toLowerCase()](args.map(String), scope);
  return { call, scope };
};
const quickContents = (name: string, ...args: (string | number)[]) => {
  const { call } = session();
  const ref = call(name, ...args);
  return call('QuickList.GetList', ref);
};

test('MBS list column functions are registered for dispatch and generated compatibility docs', () => {
  const names = ['list.csvsplit', 'list.orcolumn', 'list.xorcolumn', 'quicklist.csvsplit', 'quicklist.orcolumn', 'quicklist.xorcolumn'];
  for (const name of names) assert.ok(mbsFunctionNames().includes(name), name);
});

test('MBS List.CSVSplit: records, quoting, doubled quotes and embedded line breaks', () => {
  assert.equal(callList('List.CSVSplit', 'a,b\r\nc,d'), 'a\tb\rc\td\r');
  assert.equal(callList('List.CSVSplit', '"a,b","say ""hi"""\r\n"multi\nline",z'), 'a,b\tsay "hi"\rmulti\nline\tz\r');
  assert.equal(callList('List.CSVSplit', '"é😀",x'), 'é😀\tx\r');
  assert.equal(callList('List.CSVSplit', ''), '');
  assert.equal(callList('List.CSVSplit', 'a,b\r\n'), 'a\tb\r');
  assert.throws(() => callList('List.CSVSplit', '"unfinished'), /unterminated quoted cell/);
  assert.throws(() => callList('List.CSVSplit', 'x'.repeat(8_000_001)), /result is too large/);
});

test('MBS List.OrColumn: any non-zero numeric cell is true', () => {
  assert.equal(callList('List.OrColumn', '0,word\r0,2', ',', 1), 1);
  assert.equal(callList('List.OrColumn', '', ',', 0), 0);
  assert.equal(callList('List.OrColumn', '0,é\r0,😀', ',', 1), 0);
  assert.throws(() => callList('List.OrColumn', '0,word', ',', 'bad'), /"bad" is not a number \(column\)/);
  assert.equal(callList('List.OrColumn', '0,1', ',', 1), 1);
  assert.throws(() => callList('List.OrColumn', 'x'.repeat(8_000_001), ',', 0), /result is too large/);
});

test('MBS List.XOrColumn: an odd number of non-zero numeric cells is true', () => {
  assert.equal(callList('List.XOrColumn', '2,x\r0,3\r4,nope', ',', 0), 0);
  assert.equal(callList('List.XOrColumn', '', ',', 0), 0);
  assert.equal(callList('List.XOrColumn', '0,é\r0,😀\r0,1', ',', 1), 1);
  assert.throws(() => callList('List.XOrColumn', '0,1', ',', 'bad'), /"bad" is not a number \(column\)/);
  assert.equal(callList('List.XOrColumn', '0,1\r0,0', ',', 1), 1);
  assert.throws(() => callList('List.XOrColumn', 'x'.repeat(8_000_001), ',', 0), /result is too large/);
});

test('MBS QuickList.CSVSplit: matches List.CSVSplit and retains a new list', () => {
  const inputs = ['', 'a,b\r\nc,d', '"a,b","say ""hi"""\r\n"multi\nline",z', '"é😀",x', 'a,b\r\n'];
  for (const input of inputs) assert.equal(quickContents('QuickList.CSVSplit', input), callList('List.CSVSplit', input));
  assert.throws(() => quickContents('QuickList.CSVSplit', '"unfinished'), /unterminated quoted cell/);
  assert.throws(() => quickContents('QuickList.CSVSplit', 'x'.repeat(8_000_001)), /result is too large/);
});

test('MBS QuickList.OrColumn: agrees with List.OrColumn on empty, numeric and Unicode tables', () => {
  for (const [table, sep, col] of [['0,word\r0,2', ',', 1], ['', ',', 0], ['0,é\r0,😀', ',', 1], ['0,1', ',', 1]] as const) {
    const { call } = session();
    const ref = call('QuickList.New', table);
    assert.equal(call('QuickList.OrColumn', ref, sep, col), callList('List.OrColumn', table, sep, col));
  }
  const { call } = session();
  const ref = call('QuickList.New', '0,1');
  assert.throws(() => call('QuickList.OrColumn', ref, ',', 'bad'), /not a number \(column\)/);
  assert.throws(() => call('QuickList.OrColumn', 'missing', ',', 0), /not a QuickList reference/);
});

test('MBS QuickList.XOrColumn: agrees with List.XOrColumn on empty, numeric and Unicode tables', () => {
  for (const [table, sep, col] of [['2,x\r0,3\r4,nope', ',', 0], ['', ',', 0], ['0,é\r0,😀\r0,1', ',', 1], ['0,1\r0,0', ',', 1]] as const) {
    const { call } = session();
    const ref = call('QuickList.New', table);
    assert.equal(call('QuickList.XOrColumn', ref, sep, col), callList('List.XOrColumn', table, sep, col));
  }
  const { call } = session();
  const ref = call('QuickList.New', '0,1');
  assert.throws(() => call('QuickList.XOrColumn', ref, ',', 'bad'), /not a number \(column\)/);
  assert.throws(() => call('QuickList.XOrColumn', 'missing', ',', 0), /not a QuickList reference/);
});
