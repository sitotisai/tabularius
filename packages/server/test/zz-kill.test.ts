import { test } from 'node:test';
import { execFileSync, spawn } from 'node:child_process';
import { command } from '../../../scripts/mutate.ts';
test('taskkill on a detached child', async () => {
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((r) => setTimeout(r, 500));
  try { execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); console.log('TASKKILL ok'); }
  catch (e) { console.log('TASKKILL threw', (e as Error).message, (e as NodeJS.ErrnoException).code); try { child.kill(); } catch {} }
  const r = await command(['-e', 'setInterval(() => {}, 1000)'], 500);
  console.log('COMMAND status', r.status);
});
