import assert from 'node:assert/strict';

/** A test's `skip` option: the reason on Windows, false elsewhere. A skip names what Windows does differently. */
export const notOnWindows = (why: string): string | false => (process.platform === 'win32' ? `not on Windows: ${why}` : false);

/** Checks permission bits where a file has them. Windows reports 0o666 or 0o777 for every file and folder, so there is nothing to compare. */
export const expectMode = (actual: number, wanted: number, message?: string): void => {
  if (process.platform === 'win32') return;
  assert.equal(actual, wanted, message);
};
