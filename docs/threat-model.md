# Threat model

One page: what Tabularius is built to defend, against whom, and what it does not try to. [Security defaults](security-defaults.md) is the setting-by-setting list that a test holds to the running program; this page is the reasoning behind it.

## What is protected

- **The records in the hosted files**, and who may read or change each field, layout, script and file, as the file's accounts and privilege sets say.
- **The accounts**: passwords and recovery codes (stored as salted scrypt hashes), second factors, API tokens, passkeys, and the sessions that come from them.
- **The administrator's powers**: the admin console, the Admin API, and `/mcp` with administrator rights.
- **The server's reach**: what a script, a webhook, an AI request or a plug-in may connect to or run.
- **The files and backups as they sit on disk**, to the extent the operating system's permissions on the data folder (and encryption at rest, when turned on) protect them.

## Who the attacker is

| Attacker | Starting point | What the design does |
| --- | --- | --- |
| A stranger on the network | Can reach the port, has no account | Every Data API, web client and SQL route needs an account; the file list is hidden; wrong passwords lock the account and the address; the console answers only a request that comes straight from this computer, or one that signs in, and `/mcp` answers only one that carries a credential. Without HTTPS a stranger on the path can read passwords: the server says so at start when it listens beyond this computer over plain HTTP |
| A signed-in person with a small privilege set | Has an account | Every route, including SQL, OData and the AI tools, is held to that account's privilege set; the AI-visible policy keeps secret-named fields from the assistant. See [personal data isolation](personal-data-isolation.md) and the [privilege matrix](audit-privilege-matrix.md) |
| The owner of one hosted file | Has [Full Access] in one file of a folder that hosts several | Reaching another hosted file goes by name **and** password: a password accepted in one file is tried in the others, and the same name there is the same person only when its password matched (or an identity provider or directory vouched for the person, and the other file maps the person's email, domain or group itself: the name of the mapping in the first file decides nothing there). So an account made up in one file reaches nothing in another, as in FileMaker, which opens an external file with the same name and password and asks otherwise <!-- known-difference: Sign-in ;; A second hosted file is reached as the same account only when the name and password match there, as in FileMaker; FileMaker then asks for that file's credentials when they do not match, which the server cannot do ;; A layout or query over the other file's table answers as if the account had no access there, with no prompt; signing in to the first file again after setting the same password in both files makes the proof ;; A FileMaker run of a two-file solution with different passwords in each, to record the prompt and what a Data API session gets --> |
| A web page in a signed-in person's browser | Can make the browser send requests | The admin console's cookies are `HttpOnly` and `SameSite=Strict`, and a change to the console also needs a header (`x-tabularius-admin`) that a page on another site cannot send; the Data API uses tokens, not cookies, and sends no cross-origin permission; `/mcp` refuses a browser origin; pages cannot be framed. The OAuth endpoints (`/oauth/*`) answer any origin by design. Web client tokens are kept in the page's session storage, so a script injected into the web client could read them; stored scripts in file data have not been audited as an attack here |
| A program that sends crafted requests | Reaches a route with a signed-in or anonymous caller | Body and time limits; every outbound address a request can make a script choose goes through one guard ([outbound requests](outbound-requests.md)); uploads are authenticated ([upload audit](security-upload-auth-audit.md)) |
| Whoever the model reads about | Text inside a record that tries to instruct the AI assistant | The assistant acts with the signed-in person's privileges and no more, and cannot change its own visibility policy: those exceptions are for a person ([AI-visible policy](ai-visible-policy.md)). The exception is `/mcp` with the server's administrator token: it acts as the administrator, so text read through it reaches administrator powers |
| A hostile file someone drops in for conversion | A `.fmp12` file placed in the hosted folder or uploaded | **Not audited as an attacker yet.** The converter reads the file's bytes in the server process; whether a crafted file can harm it is a gap, listed under [Not covered](security-defaults.md#not-covered) |
| Someone who gets a backup or a copy of the files | Has the bytes, not the server | Passwords are hashes; backups carry checksums; encrypted backups and encryption at rest are available and **off by default** |
| Another person on the same computer | Can run programs as another user | **Only partly defended.** `/mcp` needs a token that only the server's user can read (the file `.openhbam-mcp-token` in the hosted folder), but the console trusts a request that comes from this computer until it has a password. On a shared machine, set a console password (`tabularius admin-password <folder>`). See the "Owner decisions" in the defaults page |

## What it relies on

- The operating system keeps the data folder to the user Tabularius runs as.
- Either the network is trusted or the server speaks HTTPS (its own certificate, Let's Encrypt, or a proxy that says so with `--public-url`).
- The administrator chooses sensible passwords. A new password needs at least 12 characters by default (a file's own policy and `TABULARIUS_MIN_PASSWORD_LENGTH` can change that); nothing checks strength, and a password already set is not re-checked.
- A proxy in front of the server is told about with `--trusted-proxies` and nothing else; forwarding headers from anywhere else are not believed.

## Out of scope

- **A hostile server operator or administrator.** They can read every file, every backup, the keys in the environment and every password as it is typed. Encryption at rest keeps a stolen disk out; it does not keep the operator out.
- **A compromised browser or computer.** Whatever the signed-in person can do, malware on their machine can do.
- **Plug-ins an administrator installs.** A plug-in runs with the permissions its manifest asks for and the administrator approved; a malicious one that was approved is the administrator's decision. The bundled BaseElements-compatible functions are built in and run in the sandbox ([plug-in compatibility](plugin-compatibility.md), [writing a plug-in](writing-a-plugin.md)).
- **Denial of service by someone who is signed in.** Request time and body size are capped, but a signed-in person with many requests can slow a small server.
- **Exposing the server to the internet beyond a proxy that does HTTPS.** [The remote connector plan](remote-connector-exposure.md) says what has to be public for claude.ai and nothing more; a live review of an exposed server is a separate piece of work (backlog item r20-07).
- **The model provider.** With the assistant on, what it reads goes to the provider under the provider's terms. [Personal data isolation](personal-data-isolation.md) keeps names, addresses and the like from reaching the model, per file.

## Filesystem boundary

`packages/store/src/fs-boundary.ts` checks file paths before and during file operations. It is meant to stop a swapped file, symlink or FIFO from being followed or truncated, and to detect a replaced folder between a check and a use. Refused paths fail with `ESTALE` and the message “Filesystem path changed or is not a safe regular file”. A group- or world-readable backup source is refused with `EPRIVATECOPY` (“Backup needs a private copy”).

These checks are not `openat(2)` and do not make path-based operations atomic. The folders must belong to the service user. A hostile concurrent rename of a parent folder is out of scope.

**Modules that use it**

- `packages/cli/src/main.ts`
- `packages/cli/src/service.ts`
- `packages/cli/src/windows-task.ts`
- `packages/plugins/src/package.ts`
- `packages/plugins/src/sandboxed.ts`
- `packages/scripts/src/engine.ts`
- `packages/server/src/agent.ts`
- `packages/server/src/ai-usage.ts`
- `packages/server/src/backup-external.ts`
- `packages/server/src/backup-verify.ts`
- `packages/server/src/backup.ts`
- `packages/server/src/connections.ts`
- `packages/server/src/container-uploads.ts`
- `packages/server/src/containers.ts`
- `packages/server/src/encrypt.ts`
- `packages/server/src/hosted-record.ts`
- `packages/server/src/local-admin.ts`
- `packages/server/src/oauth.ts`
- `packages/server/src/restore-files.ts`
- `packages/server/src/server-logs.ts`
- `packages/server/src/stats-log.ts`
- `packages/server/src/uploads.ts`
- `packages/store/src/durable.ts`
- `packages/store/src/file-ops.ts`
- `packages/store/src/store.ts`

## How this is kept true

- `packages/server/test/defaults.test.ts` starts a server with no flags and holds every row of the defaults table to what it does; the page is made from the table, so a changed default fails the test until the page says so.
- Each attacker row above has audits or tests behind it, linked from the row. Where a row has a gap, it is named in [Owner decisions](security-defaults.md#owner-decisions), not left out.
- Every place the code reads record data must pass the caller's privileges or say why it need not. Two checks find the reads from the code: `npm run check:read-gate` lists every store, calculation and SQL read by function in [the read-gate audit](../notes/audits/audit-read-gate-inventory.md), and `npm run check:read-gate-typed` uses the type checker to find the calls whose arguments carry no `Privileges` (`packages/server/test/read-gate-typed.test.ts`). A new read fails until someone classifies it in `scripts/read-gate-typed-allowlist.json` or the audit's allow-list with the check that makes it safe; `read-gate-sweep.test.ts` then calls every documented route and MCP tool as a restricted account against a solution seeded with values and counts that must not appear.
- A secret (token, hash, code, challenge, nonce, password) is compared with `sameSecret` (`packages/store/src/same-secret.ts`), which takes the same time wherever the two differ; `==`, `===`, `startsWith` and Buffer `equals` stop at the first difference. `npm run check:secrets` (`scripts/check-secret-primitives.ts`, run by `packages/server/test/secret-primitives.test.ts` in the gates) reads every source file and fails on a comparison of a value with a secret-looking name that does not go through it. It judges by names, so a comparison that is not of a secret (a cache stamp, a public checksum) is listed in the script with the reason. Not covered: a secret held in a Map keyed by the raw token (random 192 bits and up, looked up by hash table, not realistically probeable), and the direct `timingSafeEqual` calls on byte buffers, which are already constant-time.
- The filesystem-boundary module list is held by `packages/store/test/fs-boundary-doc.test.ts`.
- Every place the code reads record data must pass the caller's privileges or say why it need not. Two checks find the reads from the code: `npm run check:read-gate` lists every store, calculation and SQL read by function in [the read-gate audit](../notes/audits/audit-read-gate-inventory.md), and `npm run check:read-gate-typed` uses the type checker to find the calls whose arguments carry no `Privileges` (`packages/server/test/read-gate-typed.test.ts`). A new read fails until someone classifies it in `scripts/read-gate-typed-allowlist.json` or the audit's allow-list with the check that makes it safe; `read-gate-sweep.test.ts` then calls every documented route and MCP tool as a restricted account against a solution seeded with values and counts that must not appear.
