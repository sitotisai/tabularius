// A function a test declares portable: the child process of a recursive query imports it from here, by this file's address.
export function double(value: unknown): number | null {
  return value === null ? null : Number(value) * 2;
}
