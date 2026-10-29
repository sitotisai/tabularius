/** A test's `skip` option: the reason on Windows, false elsewhere. A skip names what Windows does differently. */
export const notOnWindows = (why: string): string | false => (process.platform === 'win32' ? `not on Windows: ${why}` : false);
