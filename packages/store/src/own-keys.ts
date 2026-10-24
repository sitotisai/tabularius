/**
 * A copy of a lookup keyed by names read from a file (a table called constructor or __proto__ is a legal one): no
 * prototype, so such a key is plain data, on reading it back from JSON and on assigning it.
 */
export function ownKeyed<T>(raw: Record<string, T> | null | undefined): Record<string, T> {
  return Object.assign(Object.create(null) as Record<string, T>, raw ?? {});
}

/**
 * `map[key] = value`, where a key of `__proto__` is an own property like any other, not the object's prototype.
 * For results that keep the plain `{}` shape (a record's fieldData) and so cannot be built without a prototype.
 */
export function setOwn<T>(map: Record<string, T>, key: string, value: T): void {
  if (key === '__proto__') Object.defineProperty(map, key, { value, enumerable: true, writable: true, configurable: true });
  else map[key] = value;
}
