// Pure generation only: native service-manager acceptance remains unverified by these tests.
import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, posix } from 'node:path';
import { commandStubEnv } from '../../../scripts/test-command-stubs.ts';
import { defaultServiceHost, serviceFile, serviceSummary, type Platform, type ServiceOptions } from '../src/service.ts';
import { readSecretFile } from '../src/secret-file.ts';
import { parseUnit, parseXml, readPlist, systemdWords, validatePlist, validateSystemdUnit, validateTaskXml, type XmlNode } from './service-validators.ts';

const GOLDEN = join(import.meta.dirname, 'golden', 'service');
const DOC = new URL('../../../docs/service-files.md', import.meta.url);
const platforms = ['linux', 'darwin', 'win32'] as const;

function isolated(t: TestContext) {
  const env = commandStubEnv(t);
  // The shared helper covers launchctl, systemctl, sc, git, npm, curl and sudo.
  for (const name of ['schtasks', 'loginctl']) {
    writeFileSync(join(env.PATH!, name), '#!/bin/sh\nprintf forbidden >> "$TABULARIUS_TEST_CHILD_MARKER"\nexit 99\n', { mode: 0o700 });
  }
  for (const name of ['launchctl', 'systemctl', 'sc', 'schtasks', 'loginctl', 'git', 'npm', 'curl', 'sudo']) {
    writeFileSync(join(env.PATH!, `${name}.cmd`), '@echo off\r\necho forbidden>>"%TABULARIUS_TEST_CHILD_MARKER%"\r\nexit /b 99\r\n');
  }
  for (const key of ['PATH', 'TABULARIUS_TEST_CHILD_MARKER', 'TABULARIUS_PUBLIC_URL']) {
    const previous = process.env[key];
    if (key === 'TABULARIUS_PUBLIC_URL') delete process.env[key];
    else process.env[key] = env[key];
    t.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous; });
  }
}

function options(platform: Platform, system: boolean, https = false): ServiceOptions {
  const extra = https ? ['--https', 'db.example.org'] : [];
  return {
    platform, system, port: 8080, host: defaultServiceHost(extra), extra,
    singleFile: false,
    ...(platform === 'win32' ? {
      node: 'C:\\Program Files\\nodejs\\node.exe', main: 'C:\\tabularius\\app\\packages\\cli\\src\\main.ts',
      folder: 'C:\\Data', user: 'WORKGROUP\\serviceuser', home: 'C:\\Users\\serviceuser\\.openhbam',
    } : {
      node: '/usr/local/bin/node', main: '/srv/tabularius/app/packages/cli/src/main.ts',
      folder: '/srv/data', user: 'serviceuser', home: '/var/lib/tabularius/.openhbam',
    }),
  };
}

function generated(o: ServiceOptions): string {
  const { text } = serviceFile(o);
  const problems = o.platform === 'linux' ? validateSystemdUnit(text, o.system)
    : o.platform === 'darwin' ? validatePlist(text, o.system) : validateTaskXml(text, o.system);
  assert.deepEqual(problems, []);
  return text;
}

for (const platform of platforms) for (const system of [false, true]) for (const https of [false, true]) {
  test(`golden defaults: ${platform} ${system ? 'system' : 'user'} ${https ? 'https' : 'loopback'}`, (t) => {
    isolated(t);
    const o = options(platform, system, https);
    const text = generated(o);
    // Compare the definition itself, with no host-path replacement or whitespace normalization.
    const file = join(GOLDEN, `${platform}-${system ? 'system' : 'user'}-${https ? 'https' : 'default'}.txt`);
    if (process.env.UPDATE_GOLDEN === '1') writeFileSync(file, text);
    assert.ok(existsSync(file), 'missing golden: run this file with UPDATE_GOLDEN=1 and review the result');
    assert.equal(text, readFileSync(file, 'utf8'), 'review the change before updating with UPDATE_GOLDEN=1');
    assert.equal(o.host, https ? '0.0.0.0' : '127.0.0.1');
    const doc = readFileSync(DOC, 'utf8');
    assert.ok(doc.includes(https ? '`--host 0.0.0.0`' : '`--port 8080 --host 127.0.0.1`'));
    const command = commandText(o, text);
    assert.ok(command.includes(`--host ${o.host}`));
    assert.ok(command.includes('--port 8080'));
    assert.equal(command.includes('--https'), https);
    if (https) assert.ok(command.includes('--https db.example.org'));
    assert.doesNotMatch(command, /--(?:mcp|replication)-token(?:$|[\s"<=])/);
  });
}

function commandText(o: ServiceOptions, text: string): string {
  if (o.platform === 'linux') return systemdWords(parseUnit(text, []).find(([, name]) => name === 'ExecStart')![2]).join(' ');
  if (o.platform === 'darwin') return (readPlist(text).ProgramArguments as string[]).join(' ');
  return parseXml(text, [])!.children.find((n) => n.name === 'Actions')!.children[0].children.find((n) => n.name === 'Arguments')!.text;
}

// Values come from the generated file; the first column of each documentation table is the contract.
// Container names have no scalar value. XML attributes are named Element.attribute.
function settings(platform: Platform, text: string): Map<string, string[]> {
  const values = new Map<string, string[]>();
  const add = (key: string, value?: string) => values.set(key, [...(values.get(key) ?? []), ...(value === undefined ? [] : [value])]);
  if (platform === 'linux') for (const [, key, value] of parseUnit(text, [])) add(key, value);
  else if (platform === 'darwin') {
    const walk = (dict: object) => {
      for (const [key, value] of Object.entries(dict)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) { add(key); walk(value); }
        else add(key, String(value));
      }
    };
    walk(readPlist(text));
    add('plist.version', parseXml(text, [])!.attrs.version);
  } else {
    const walk = (node: XmlNode) => {
      add(node.name, node.children.length ? undefined : node.text);
      for (const [key, value] of Object.entries(node.attrs)) add(`${node.name}.${key}`, value);
      node.children.forEach(walk);
    };
    walk(parseXml(text, [])!);
  }
  return values;
}

const headings = { linux: 'systemd (Linux)', darwin: 'launchd (macOS)', win32: 'Windows Task Scheduler' };
const dynamic = {
  linux: ['ExecStart', 'WorkingDirectory', 'ReadWritePaths', 'User'],
  darwin: ['ProgramArguments', 'WorkingDirectory', 'UserName', 'StandardOutPath', 'StandardErrorPath'],
  win32: ['Description', 'UserId', 'Command', 'Arguments', 'WorkingDirectory'],
};

for (const platform of platforms) {
  test(`${platform}: every generated setting and constant value is documented`, (t) => {
    isolated(t);
    const doc = readFileSync(DOC, 'utf8').split(`## ${headings[platform]}\n`)[1]?.split(/^## /m)[0];
    assert.ok(doc, 'the platform has a documentation section');
    const documented = new Map<string, string[]>();
    for (const row of doc.matchAll(/^\| ([^|]+)\|/gm)) {
      for (const code of row[1].matchAll(/`([A-Za-z][A-Za-z0-9.]*)(?:=([^`]*))?`/g)) {
        documented.set(code[1], [...(documented.get(code[1]) ?? []), ...(code[2] ? [code[2]] : [])]);
      }
    }
    const seen = new Map<string, string[]>();
    for (const system of [false, true]) for (const https of [false, true]) {
      for (const [key, values] of settings(platform, generated(options(platform, system, https)))) {
        seen.set(key, [...(seen.get(key) ?? []), ...values]);
        assert.ok(documented.has(key), `${key} is emitted but missing from the ${headings[platform]} table`);
        if (!dynamic[platform].includes(key)) for (const value of values) {
          assert.ok(documented.get(key)!.includes(value), `${key}=${value} must be stated in the table`);
        }
      }
    }
    assert.deepEqual([...documented.keys()].sort(), [...seen.keys()].sort(), 'the table must not claim settings that no definition emits');
    for (const [key, values] of seen) if (!dynamic[platform].includes(key)) {
      assert.deepEqual([...new Set(documented.get(key))].sort(), [...new Set(values)].sort(), `${key}: no stale documented values`);
    }
  });

  test(`${platform}: documented security defaults and account selection`, (t) => {
    isolated(t);
    for (const system of [false, true]) for (const https of [false, true]) {
      const o = options(platform, system, https);
      const text = generated(o);
      const values = settings(platform, text);
      const expected = platform === 'linux' ? {
        UMask: '0077', ProtectSystem: 'full', NoNewPrivileges: 'true', PrivateTmp: 'true',
        ProtectKernelTunables: 'true', ProtectControlGroups: 'true', RestrictSUIDSGID: 'true', RestrictRealtime: 'true', LockPersonality: 'true',
        Restart: 'on-failure', RestartSec: '5', RestartSteps: '5', RestartMaxDelaySec: '60',
        TimeoutStopSec: '60', WantedBy: system ? 'multi-user.target' : 'default.target',
      } : platform === 'darwin' ? {
        Umask: '63', KeepAlive: 'true', RunAtLoad: 'true', ThrottleInterval: '10', ExitTimeOut: '40',
      } : {
        RunLevel: system ? 'HighestAvailable' : 'LeastPrivilege', Count: '255',
        ExecutionTimeLimit: 'PT0S', MultipleInstancesPolicy: 'IgnoreNew',
      };
      for (const [key, value] of Object.entries(expected)) assert.deepEqual(values.get(key), [value], key);
      // The minute-by-minute start (TimeTrigger) and the restart-on-failure policy each carry the interval.
      if (platform === 'win32') assert.deepEqual(values.get('Interval'), ['PT1M', 'PT1M'], 'Interval');
      if (platform === 'linux') {
        assert.deepEqual(values.get('User'), system ? [o.user] : undefined);
        assert.deepEqual(values.get('AmbientCapabilities'), system ? ['CAP_NET_BIND_SERVICE'] : undefined);
        assert.equal(values.has('ProtectHome'), false);
        assert.deepEqual(systemdWords(values.get('ReadWritePaths')![0]), [`-${o.folder}`, `-${o.home}`, '-/srv/tabularius']);
      } else if (platform === 'darwin') {
        assert.deepEqual(values.get('UserName'), system ? [o.user] : undefined);
        for (const key of ['StandardOutPath', 'StandardErrorPath']) assert.deepEqual(values.get(key), [posix.join(o.home, 'logs', 'server.log')]);
      } else {
        assert.deepEqual(values.get('UserId'), system ? ['S-1-5-18'] : [o.user, o.user]);
        assert.deepEqual(values.get('LogonType'), system ? undefined : ['InteractiveToken']);
        assert.equal(values.has('BootTrigger'), system);
        assert.equal(values.has('LogonTrigger'), !system);
      }
    }
  });

  test(`${platform}: token files keep contents out of definitions; inline tokens retain the documented warning`, (t) => {
    isolated(t);
    const dir = mkdtempSync(join(tmpdir(), 'tabularius-golden-secrets-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    const secrets = ['mcp', 'replication'].map((kind) => [kind, 'synthetic', 'value', 'for', 'test'].join('-'));
    const files = ['mcp', 'replication'].map((name, i) => {
      const file = join(dir, name);
      writeFileSync(file, `${secrets[i]}\n`, { mode: 0o600 });
      assert.equal(readSecretFile(file, `--${name}-token-file`), secrets[i]);
      return file;
    });
    const doc = readFileSync(DOC, 'utf8');
    for (const name of ['mcp', 'replication']) assert.ok(doc.includes(`\`--${name}-token-file F\``));
    assert.match(doc, /Their values appear in the process list and are written into the service file/);
    for (const system of [false, true]) {
      const o = options(platform, system);
      o.extra = ['--mcp-token-file', files[0], '--replication-token-file', files[1]];
      const text = generated(o);
      const command = commandText(o, text);
      for (const file of files) assert.ok(command.includes(file));
      for (const flag of ['--mcp-token-file', '--replication-token-file']) assert.ok(command.includes(flag));
      for (const secret of secrets) assert.ok(!text.includes(secret), 'only the file path reaches the definition');
      assert.doesNotMatch(command, /--(?:mcp|replication)-token(?:$|[\s"<=])/);
      o.extra = ['--mcp-token', secrets[0], '--replication-token', secrets[1]];
      const inline = generated(o);
      const summary = serviceSummary(o, []).join('\n');
      for (const secret of secrets) { assert.ok(inline.includes(secret)); assert.ok(!summary.includes(secret)); }
      assert.ok(summary.includes('--mcp-token and --replication-token are written into the service file'));
    }
  });
}
