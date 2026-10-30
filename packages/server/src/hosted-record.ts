// Approval memory for files in a hosted folder. It is local state, never a backup input.
import { closeSync, constants, existsSync, fstatSync, fsyncSync, lstatSync, openSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { retryFileSync } from '../../store/src/file-ops.ts';
import { cleanupPath, openSync as openChecked, renameSync as renameChecked, writeSync as writeChecked } from '../../store/src/fs-boundary.ts';

export const HOSTED_RECORD_FILE = '.openhbam-hosted.json';
export type ApprovalHow = 'first-start' | 'admin' | 'upload' | 'create' | 'restore';
export interface HostedRecord {
  version: 1;
  instance: string;
  files: Record<string, { id: string; approvedAt: string; by: string; how: ApprovalHow }>;
}
const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const STORE_EXT = '.openhbam.sqlite';
export function validFileId(value: unknown): value is string { return typeof value === 'string' && UUID.test(value); }
/** undefined means absent; null means damaged and must never be replaced. */
export function loadHostedRecord(dir: string): HostedRecord | null | undefined {
  const path = join(dir, HOSTED_RECORD_FILE);
  let raw = '';
  // A write renames a new record over this one: a reader that opened the old file just before sees it unlinked (no links left)
  // and must open the path again, not call the record damaged.
  for (let attempt = 0; ; attempt++) {
    try {
      const fd = openSync(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
      try {
        const stat = fstatSync(fd);
        if (!stat.isFile() || stat.nlink > 1) return null;
        if (stat.nlink === 0 && attempt < 20) continue;
        raw = readFileSync(fd, 'utf8');
        break;
      } finally { closeSync(fd); }
    }
    catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT' && !existsSync(path)) return undefined; return null; }
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (record.version !== 1 || Object.keys(record).sort().join(',') !== 'files,instance,version' || !validFileId(record.instance) ||
        !record.files || typeof record.files !== 'object' || Array.isArray(record.files)) return null;
    for (const [name, entry] of Object.entries(record.files)) {
      if (name !== name.toLowerCase() || !entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
      const item = entry as Record<string, unknown>;
      if (Object.keys(item).sort().join(',') !== 'approvedAt,by,how,id' ||
          !validFileId(item.id) || typeof item.approvedAt !== 'string' ||
          !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(item.approvedAt) ||
          !Number.isFinite(Date.parse(item.approvedAt)) || new Date(item.approvedAt).toISOString() !== item.approvedAt ||
          typeof item.by !== 'string' || !item.by || !['first-start', 'admin', 'upload', 'create', 'restore'].includes(String(item.how))) return null;
    }
    return record as unknown as HostedRecord;
  } catch { return null; }
}

/** How many store files the approval check has opened in this process (a test counts them; nothing else reads it). */
export const markerProbes = { count: 0 };

/** This probe never creates a store or changes its metadata. */
function peekInstance(path: string): string | undefined {
  markerProbes.count++;
  let sql: DatabaseSync | undefined;
  try {
    const stat = lstatSync(path);
    if (!stat.isFile()) return 'not-a-local-store';
    // A live or crash-left WAL may contain the marker. Without a WAL, immutable
    // avoids making SQLite create -wal and -shm beside a closed store.
    sql = new DatabaseSync(existsSync(path + '-wal') ? path : pathToFileURL(path).href + '?immutable=1', { readOnly: true });
    const row = sql.prepare("SELECT json FROM _fm_meta WHERE key = 'hostedInstance'").get() as { json: string } | undefined;
    const value: unknown = row ? JSON.parse(row.json) : undefined;
    return validFileId(value) ? value : undefined;
  } catch { return undefined; }
  finally { sql?.close(); }
}

function storeNames(dir: string): string[] { return readdirSync(dir).filter((name) => name.endsWith(STORE_EXT)); }

/**
 * A missing or swapped record cannot claim a folder that contains an earlier approval marker. Every store is opened to read
 * its marker, so the walk stops at the first answer: a store that carries the record's instance settles it, and with no
 * record any marker does. Only a folder where no store matches is read in full.
 */
export function verifiedHostedRecord(dir: string, exclude: readonly string[] = []): HostedRecord | null | undefined {
  const record = loadHostedRecord(dir);
  if (record === null) return null;
  const excluded = new Set(exclude.map((name) => name.toLowerCase() + STORE_EXT));
  let marked = false;
  for (const name of storeNames(dir)) {
    if (excluded.has(name.toLowerCase())) continue;
    const instance = peekInstance(join(dir, name));
    if (instance === undefined) continue;
    if (record && instance === record.instance) return record;
    if (!record) return null;
    marked = true;
  }
  return marked ? null : record;
}

export const LOST_RECORD_MESSAGE = 'the approval record is missing, so every file is held; it must be restored or approved again (the admin controls for this arrive in the next change)';

/** The marker goes only into the store that carries the approved identity: the path may hold a different file by now. */
function markStore(dir: string, name: string, id: string, instance: string, log: (line: string) => void): void {
  let sql: DatabaseSync | undefined;
  try {
    const path = join(dir, name + STORE_EXT);
    if (!existsSync(path)) return;
    const stat = lstatSync(path);
    if (!stat.isFile()) throw new Error('the store is not a local regular file');
    sql = new DatabaseSync(path);
    const row = sql.prepare("SELECT json FROM _fm_meta WHERE key = 'fileId'").get() as { json: string } | undefined;
    let stored: unknown;
    try { stored = row ? JSON.parse(row.json) : undefined; } catch { /* not the approved identity */ }
    if (stored !== id) throw new Error('the file at that name is not the file that was approved');
    sql.prepare("INSERT OR REPLACE INTO _fm_meta (key, json) VALUES ('hostedInstance', ?)").run(JSON.stringify(instance));
  } catch (e) { log(`${name}: approval marker could not be saved: ${(e as Error).message}`); }
  finally { sql?.close(); }
}

export function vet(record: HostedRecord | null | undefined, name: string, id: string): 'approved' | 'held' | 'unknown-record' {
  if (record === null) return 'unknown-record';
  const key = name.toLowerCase();
  const entry = record && Object.hasOwn(record.files, key) ? record.files[key] : undefined;
  return entry?.id === id ? 'approved' : 'held';
}

/** A test sets `run` to make a write fail after its temp file is written (a full disk, say); nothing else touches it. */
export const recordWriteHook: { run?: () => void } = {};

/** Temp files of an interrupted write older than this are removed by the next one. */
const STALE_TEMP_MS = 10 * 60_000;

function writeRecord(dir: string, record: HostedRecord): void {
  const path = join(dir, HOSTED_RECORD_FILE);
  // A name of its own: two processes (a leader and a restore, say) writing at once must not share a temp file, or one rename
  // could publish the other's half-written record.
  const temp = `${path}.${process.pid}.${randomUUID()}.tmp`;
  let fd: number | undefined;
  let removeTemp: (() => void) | undefined;
  sweepTemps(dir, path);
  try {
    fd = openChecked(temp, 'wx', 0o600);
    removeTemp = cleanupPath(temp);
    writeChecked(fd, JSON.stringify(record) + '\n');
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;
    recordWriteHook.run?.();
    publish(temp, path);
  } finally {
    if (fd !== undefined) closeSync(fd);
    removeTemp?.();
  }
}

function publish(temp: string, path: string): void {
  // Another process may replace the record between the boundary's two looks; try again with our own temp.
  // A swapped temp is refused every time.
  for (let attempt = 0; attempt < 50; attempt++) {
    // On Windows a reader holding the record for a moment makes the replace fail with a sharing error; it is tried again for up to about a second.
    try { retryFileSync(() => renameChecked(temp, path), process.platform, undefined, 40); return; }
    catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ESTALE' || attempt === 49) throw e; }
  }
}

/** Removes the fixed-name temp an earlier version left, and temps an interrupted write left more than STALE_TEMP_MS ago. */
function sweepTemps(dir: string, path: string): void {
  try { rmSync(path + '.tmp', { force: true }); } catch { /* not ours to clear */ }
  const prefix = HOSTED_RECORD_FILE + '.';
  for (const name of readdirSync(dir)) {
    if (!name.startsWith(prefix) || !name.endsWith('.tmp') || name === HOSTED_RECORD_FILE + '.tmp') continue;
    try {
      const file = join(dir, name);
      if (Date.now() - statSync(file).mtimeMs > STALE_TEMP_MS) rmSync(file, { force: true });
    } catch { /* another writer finished with it first */ }
  }
}

/** Synchronous read-modify-write operations form the in-process lock. */
export function approveInRecord(dir: string, name: string, id: string, by: string, how: ApprovalHow, log: (line: string) => void = console.error, explicit = false): void {
  const raw = loadHostedRecord(dir);
  if (raw === null) throw new Error(`${HOSTED_RECORD_FILE} is damaged`);
  const verified = verifiedHostedRecord(dir);
  if (verified === null && !explicit) throw new Error(LOST_RECORD_MESSAGE);
  const record = verified === null ? undefined : verified;
  const next: HostedRecord = { version: 1, instance: record?.instance ?? randomUUID(), files: Object.assign(Object.create(null) as HostedRecord['files'], record?.files) };
  next.files[name.toLowerCase()] = { id, approvedAt: new Date().toISOString(), by, how };
  writeRecord(dir, next);
  markStore(dir, name, id, next.instance, log);
}

/** Called once by the leader, after startup conversions and before hosting files. */
export function firstStartRecord(dir: string, files: { name: string; id: string }[], log: (line: string) => void = console.error): void {
  if (verifiedHostedRecord(dir) !== undefined) return;
  const entries: HostedRecord['files'] = Object.create(null) as HostedRecord['files'];
  const now = new Date().toISOString();
  for (const file of files) entries[file.name.toLowerCase()] = { id: file.id, approvedAt: now, by: 'first start', how: 'first-start' };
  const instance = randomUUID();
  writeRecord(dir, { version: 1, instance, files: entries });
  for (const file of files) markStore(dir, file.name, file.id, instance, log);
}

/** Merge restored stores in one publication, preserving all other approvals. */
export function approveRestoredFiles(dir: string, names: string[], log: (line: string) => void = console.error, before?: { record: HostedRecord | null | undefined }): void {
  try {
    const record = before ? before.record : verifiedHostedRecord(dir, names);
    if (record === null) {
      log(`${HOSTED_RECORD_FILE} is damaged or missing; restored files are held`);
      return;
    }
    const first = record === undefined;
    const files: HostedRecord['files'] = Object.assign(Object.create(null) as HostedRecord['files'], record?.files);
    const ids = new Map<string, string>();
    const approved = first ? storeNames(dir).map((file) => file.slice(0, -STORE_EXT.length)) : names;
    for (const name of approved) {
      const sql = new DatabaseSync(join(dir, name + STORE_EXT));
      try {
        const row = sql.prepare("SELECT json FROM _fm_meta WHERE key = 'fileId'").get() as { json: string } | undefined;
        let parsed: unknown;
        try { parsed = row ? JSON.parse(row.json) : undefined; } catch { /* replace below */ }
        const id = validFileId(parsed) ? parsed : randomUUID();
        if (!validFileId(parsed)) sql.prepare("INSERT OR REPLACE INTO _fm_meta (key, json) VALUES ('fileId', ?)").run(JSON.stringify(id));
        ids.set(name, id);
        files[name.toLowerCase()] = { id, approvedAt: new Date().toISOString(), by: first && !names.includes(name) ? 'first start' : 'restore', how: first && !names.includes(name) ? 'first-start' : 'restore' };
      } finally { sql.close(); }
    }
    const instance = record?.instance ?? randomUUID();
    writeRecord(dir, { version: 1, instance, files });
    for (const name of approved) markStore(dir, name, ids.get(name)!, instance, log);
  } catch (e) { log(`${HOSTED_RECORD_FILE} could not record restored files; they remain held: ${(e as Error).message}`); }
}
