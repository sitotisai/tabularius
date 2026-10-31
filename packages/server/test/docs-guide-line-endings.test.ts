import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { docsHtml } from '../src/docs.ts';

// Run in a child process with a small heap and a time limit: the unfixed code never leaves its loop, it only fills memory.

const page = (markdown: string): string => {
  const code = `import { docsHtml } from ${JSON.stringify(new URL('../src/docs.ts', import.meta.url).href)};
    process.stdout.write(docsHtml(${JSON.stringify(markdown)}, 'Guide', 'Guide', { guide: true }));`;
  const done = spawnSync(process.execPath, ['--no-warnings', '--max-old-space-size=128', '--input-type=module', '-e', code], { encoding: 'utf8', timeout: 20_000, env: process.platform === 'win32' ? process.env : {} });
  assert.equal(done.status, 0, `the page was made (status ${done.status}, signal ${done.signal}): ${done.stderr.slice(0, 200)}`);
  return done.stdout;
};

test('a guide written with Windows line endings, or a list line holding a line separator, is rendered, not looped on', () => {
  const crlf = page('# Title\r\n\r\n- first item\r\n- second item\r\n\r\n1. one\r\n2. two\r\n');
  assert.match(crlf, /<li>first item<\/li>/);
  assert.match(crlf, /<li>second item<\/li>/);
  assert.doesNotMatch(crlf, /\r/);
  const separator = page('# Title\n\n- an item\u2028with a separator\n- next\n');
  assert.match(separator, /<li>an item\u2028with a separator<\/li>/);
  assert.match(separator, /<li>next<\/li>/);
});

test('the plain documentation mode reads CRLF text as it reads LF text', () => {
  assert.equal(docsHtml('# T\r\n\r\nSome text\r\n', 'T'), docsHtml('# T\n\nSome text\n', 'T'));
});
