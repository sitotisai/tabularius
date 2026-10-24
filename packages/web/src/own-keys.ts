// Maps keyed by names a layout gives (a portal, a field): "__proto__" is a legal name, and on a plain object it is the
// prototype, not a key. Writing through it would add the entry to every object in the page, or drop it. These helpers
// treat it like any other key.

/** The entry the map owns under `key`; a name that is on Object.prototype (or is `__proto__`) is not one. */
export function ownGet<T>(map: Record<string, T> | undefined, key: string): T | undefined {
  return map && Object.hasOwn(map, key) ? map[key] : undefined;
}

/** `map[key] = value`, with `__proto__` as an ordinary key. */
export function ownSet<T>(map: Record<string, T>, key: string, value: T): void {
  if (key === '__proto__') Object.defineProperty(map, key, { value, enumerable: true, writable: true, configurable: true });
  else map[key] = value;
}

/** The map's own entry under `key`, made with `make` when there is none yet. */
export function ownEntry<T>(map: Record<string, T>, key: string, make: () => T): T {
  if (!Object.hasOwn(map, key)) ownSet(map, key, make());
  return map[key];
}

/** A JSON copy whose objects have no prototype, for edits keyed by names: a key of `__proto__` stays a key. */
export function cloneKeyed<T>(value: T): T {
  return JSON.parse(JSON.stringify(value), (_key, v: unknown) => v && typeof v === 'object' && !Array.isArray(v) ? Object.assign(Object.create(null), v) : v);
}

/** An empty map without a prototype, for entries keyed by names. */
export function keyed<T>(): Record<string, T> {
  return Object.create(null) as Record<string, T>;
}
