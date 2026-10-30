import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakeS3 } from './fake-s3.ts';

test('the fake S3 answers a request with no signature headers with 403 and keeps serving', async () => {
  const s3 = await fakeS3({ bucket: 'b', accessKey: 'AK', secretKey: 'SK' });
  try {
    const unsigned = await fetch(`${s3.endpoint}/b/some-key`);
    assert.equal(unsigned.status, 403);
    assert.equal(s3.seen.rejected, 1);
    // A date that is not a SigV4 timestamp gets the same answer, not a crash.
    const badDate = await fetch(`${s3.endpoint}/b/some-key`, { headers: { 'x-amz-date': 'yesterday', authorization: 'AWS4-HMAC-SHA256 SignedHeaders=host, Signature=00' } });
    assert.equal(badDate.status, 403);
    assert.equal(s3.seen.rejected, 2);
    assert.equal(s3.requests.length, 0);
  } finally {
    await s3.close();
  }
});
