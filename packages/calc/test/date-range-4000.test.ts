// Claris's help pages give the date and timestamp range as 1/1/0001 to 12/31/4000 (docs/consistency.md A4-12).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateText } from '../src/index.ts';

test('a date a calculation builds stops at 12/31/4000 and starts at 1/1/0001', () => {
  assert.equal(evaluateText('Date ( 12 ; 31 ; 4000 )'), '12/31/4000');
  assert.equal(evaluateText('Date ( 1 ; 1 ; 4001 )'), '?');
  assert.equal(evaluateText('Date ( 12 ; 31 ; 4000 ) + 1'), '?');
  assert.equal(evaluateText('Date ( 1 ; 1 ; 1 )'), '1/1/0001');
  assert.equal(evaluateText('Date ( 1 ; 1 ; 1 ) - 1'), '?');
  assert.equal(evaluateText('GetAsDate ( 1460970 )'), '12/31/4000');
  assert.equal(evaluateText('GetAsDate ( 1460971 )'), '?');
  assert.equal(evaluateText('Timestamp ( Date ( 12 ; 31 ; 4000 ) ; Time ( 23 ; 59 ; 59 ) )'), '12/31/4000 23:59:59');
  assert.equal(evaluateText('Timestamp ( Date ( 12 ; 31 ; 4000 ) ; Time ( 24 ; 0 ; 0 ) )'), '?');
});

// Not FileMaker's range: text keeps a year up to 9999 (A4-12 says what is unverified). If this changes, change the page too.
test('a date written as text keeps a year past 4000', () => {
  assert.equal(evaluateText('GetAsDate ( "1/1/4001" )'), '1/1/4001');
});
