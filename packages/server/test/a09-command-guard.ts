import './backup-review-guard.ts';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
// Status can optionally discover the checkout commit. This offline profile has no VCS metadata.
const exists = fs.existsSync;
fs.existsSync = (path) => String(path).endsWith('/.git') ? false : exists(path);
syncBuiltinESMExports();
