/** Stable merge sort with bounded comparison batches; synchronous callers can drain the same generator. */
export function* sortProgress<T>(items: T[], compare: (a: T, b: T) => number): Generator<void, T[]> {
  let source = items.slice();
  let target = new Array<T>(source.length);
  let work = 0;
  let began = performance.now();
  for (let width = 1; width < source.length; width *= 2) {
    for (let start = 0; start < source.length; start += width * 2) {
      const middle = Math.min(start + width, source.length);
      const end = Math.min(start + width * 2, source.length);
      let left = start, right = middle;
      for (let at = start; at < end; at++) {
        target[at] = left < middle && (right >= end || compare(source[left], source[right]) <= 0) ? source[left++] : source[right++];
        // Every 1,024 placements, or 25 ms: the clock is read once in 64 placements, not at each one, and a yield costs a scope.
        if (++work % 1024 === 0 || (work % 64 === 0 && performance.now() - began >= 25)) {
          yield;
          began = performance.now();
        }
      }
    }
    [source, target] = [target, source];
  }
  return source;
}
