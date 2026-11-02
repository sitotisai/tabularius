// The AI assistant's credentials: the API key and, for a key tied to a person rather than a workspace, the workspace
// to run in (Anthropic's `anthropic-workspace-id` header). Either may live in a file that is read again when it
// changes, so saving a new key doesn't need the service reinstalled. The key is never logged or shown.

import { closeSync, fstatSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { openSync } from '../../store/src/fs-boundary.ts';
import { monotonicClock } from '../../store/src/monotonic.ts';

export interface AiCredentialOptions {
  /** Elapsed milliseconds for the recheck TTL; defaults to the shared monotonic clock. */
  now?: () => number;
  apiKey?: string;
  /** A file holding the key, read again when it changes (the first read is `apiKey`). */
  keyFile?: string;
  workspaceId?: string;
  /** A file holding the workspace id (`wrkspc_…`), read again when it changes. */
  workspaceFile?: string;
}

const WORKSPACE_ID = /^wrkspc_[A-Za-z0-9_-]+$/;
export const isWorkspaceId = (s: string) => WORKSPACE_ID.test(s);

export class AiCredentials {
  private key: string | undefined;
  private workspace: string | undefined;
  private keyStamp = '';
  private workspaceStamp = '';
  private checked = -Infinity;
  /** Counts changes, so a cached "does this key work" can be dropped. */
  version = 0;
  private keyProblem: string | undefined;
  private workspaceProblem: string | undefined;
  /** Why the latest key file or workspace file was not used (each stays on its previous value). Never contains the key. */
  get problem(): string | undefined {
    return this.keyProblem ?? this.workspaceProblem;
  }

  private readonly opts: AiCredentialOptions;
  private readonly now: () => number;

  constructor(opts: AiCredentialOptions) {
    this.opts = opts;
    this.now = opts.now ?? (() => monotonicClock.now());
    this.key = opts.apiKey;
    this.workspace = opts.workspaceId;
    if (opts.keyFile) this.keyStamp = stamp(opts.keyFile);
    if (opts.workspaceFile) this.reloadWorkspace();
  }

  get apiKey(): string | undefined {
    this.refresh();
    return this.key;
  }

  get workspaceId(): string | undefined {
    this.refresh();
    return this.workspace;
  }

  /** Looks at the files, at most once a second. */
  private refresh(): void {
    const now = this.now();
    if (now - this.checked < 1000) return;
    this.checked = now;
    const { keyFile, workspaceFile } = this.opts;
    if (keyFile) {
      const s = stamp(keyFile);
      if (s !== this.keyStamp) {
        this.keyStamp = s;
        this.reloadKey(keyFile);
      }
    }
    if (workspaceFile && stamp(workspaceFile) !== this.workspaceStamp) this.reloadWorkspace();
  }

  private reloadKey(file: string): void {
    try {
      const next = readPlainFile(file, true).trim();
      if (!next) throw new Error('it is empty');
      // A space or a line break inside would be sent in a header and break every request.
      if (/[\s\u0000-\u001f\u007f]/.test(next)) throw new Error('it holds a space or a line break inside the key');
      this.keyProblem = undefined;
      if (next !== this.key) {
        this.key = next;
        this.version++;
      }
    } catch (e) {
      this.keyProblem = `The key file was not used: ${(e as Error).message}`;
    }
  }

  private reloadWorkspace(): void {
    const file = this.opts.workspaceFile!;
    this.workspaceStamp = stamp(file);
    let next = this.opts.workspaceId;
    this.workspaceProblem = undefined;
    try {
      const text = readPlainFile(file, false).trim();
      if (isWorkspaceId(text)) next = text;
      else throw new Error(text ? 'it does not hold a workspace id (wrkspc_ and letters, digits, - or _)' : 'it is empty');
    } catch (e) {
      // No file: the workspace id from the options, if any. A file that is there and not usable is reported like a key file.
      if ((e as { code?: string }).code !== 'ENOENT') this.workspaceProblem = `The workspace file was not used: ${(e as Error).message}`;
    }
    if (next !== this.workspace) {
      this.workspace = next;
      this.version++;
    }
  }
}

/**
 * Read through one descriptor, opened without waiting and checked before reading: a named pipe must not
 * block the thread serving requests. The operator's own path may be a link (for example, a secrets mount).
 * `mustBePrivate` also refuses a file other users can read, using that same descriptor for the mode check.
 */
function readPlainFile(file: string, mustBePrivate: boolean): string {
  // Resolve the operator's link, then let the boundary guard the real name against replacement and pipes.
  let fd: number;
  try { fd = openSync(realpathSync(file), 'r'); } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ESTALE') throw new Error('it is not a plain file (a pipe or a folder stands there)');
    throw e;
  }
  try {
    const st = fstatSync(fd);
    if (!st.isFile()) throw new Error('it is not a plain file');
    if (mustBePrivate && process.platform !== 'win32' && st.mode & 0o077) throw new Error('it can be read by other users (chmod 600)');
    return readFileSync(fd, 'utf8');
  } finally {
    closeSync(fd);
  }
}

/** A file's modification time and size as text; empty when it can't be read. */
function stamp(file: string): string {
  try {
    const s = statSync(file);
    return `${s.mtimeMs}:${s.size}`;
  } catch {
    return '';
  }
}
