import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const main = join(import.meta.dirname, '..', 'src', 'main.ts');

// The line `tabularius standby` prints when it is following is the cue an operator (and the runbook test) stops it by. A stop
// sent the moment that line is seen must still be handled: the standby saves its state and exits 0, never dies of the signal.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  test(`a standby stopped by ${signal} the moment it says it is following exits 0, every time`, async (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'tabularius-standby-signal-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    for (let round = 1; round <= 8; round++) {
      const child = spawn(process.execPath, ['--no-warnings', main, 'standby', dir, '--primary', 'http://127.0.0.1:1', '--token', 'a-replication-token'], {
        env: { PATH: process.env.PATH, HOME: dir }, stdio: ['ignore', 'pipe', 'pipe'],
      });
      let out = '';
      let sent = false;
      const ended = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((ok) => child.once('exit', (code, sig) => ok({ code, signal: sig })));
      const timer = setTimeout(() => child.kill('SIGKILL'), 60_000);
      for (const stream of [child.stdout, child.stderr]) {
        stream.setEncoding('utf8').on('data', (d: string) => {
          out += d;
          if (!sent && out.includes('standby of http://127.0.0.1:1 in ')) { sent = true; child.kill(signal); }
        });
      }
      const { code, signal: by } = await ended;
      clearTimeout(timer);
      assert.deepEqual({ code, by }, { code: 0, by: null }, `round ${round}: ${out}`);
      assert.match(out, /stopped/, `round ${round}`);
    }
  });
}
