// Checks one hosted file's pages off the request path (host.ts, scanIntegrity): SQLite's quick check reads the whole
// file, which on a large one takes seconds, and must not hold up the requests of the others.

import { parentPort, workerData } from 'node:worker_threads';
import { integrity, pageCheck } from './backup-verify.ts';

const { path, quick, backup } = workerData as { path: string; quick?: boolean; backup?: boolean };
parentPort!.postMessage(backup ? integrity(path, quick) : pageCheck(path, quick !== false));
