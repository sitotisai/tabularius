// Fresh process: measure opening a generated store through its first query.
import { Store } from '../packages/store/src/index.ts';

const start = performance.now();
const store = new Store(process.argv[2], 'Cold');
try {
  const found = store.find('Payloads', { limit: 1, layoutOnly: true });
  if (found.foundCount !== Number(process.argv[3]) || found.records.length !== 1) throw new Error('cold start query returned unexpected records');
  console.log(JSON.stringify({ ms: performance.now() - start }));
} finally { store.close(); }
