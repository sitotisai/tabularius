# SC-00: showcase CRM assumptions

Checked against this checkout using generated stores, generated demo starter data, and loopback requests only. No existing `.fmp12`, customer data, external services, or model was used. Counts below describe synthetic tests, not records from an existing solution. Equivalent FileMaker behaviour is **unverified** offline; these conclusions describe Tabularius.

Main already contains the related-record privilege evaluator, PostgreSQL listener, actionable AI trace diagnostic, agent-account/token helper, and mandatory expiry for account API tokens. This item adds evidence only: no product changes.

## 1. Record-level view/edit limits — yes, for the tested relationship

A privilege set can use `Reps::Login = Get ( AccountName )` for both `Deals.view` and `Deals.edit`, with `Deals::OwnerId = Reps::Id`. The synthetic setup grants read access to Reps and denies create/delete. It contains two reps and three deals: one for each rep and one without a matching rep.

The signed-in rep sees **1 of 3** deals through Data API list and find. The web client's Page API transport gives the same result with a web session. Both allow editing the owned deal and return record-access error **200** for the other two. MCP `find_records` returns **1 of 3** for each of two separately authenticated reps, with distinct record IDs. Denied edits leave the other records unchanged.

Evidence:

- `packages/server/test/showcase-assumptions.test.ts:104`: generated relationship, account sign-in, Data API and Page API transport reads/edits, and authenticated MCP calls.
- `packages/store/src/privileges.ts:56`: a rule is a boolean or calculation string.
- `packages/store/src/store.ts:6521`: rule evaluation uses a record context and `newPass(account)`; errors deny access. It selects the first local table occurrence for the base table, so this test does not establish arbitrary multi-occurrence graph behaviour.
- `packages/store/src/store.ts:6821`: writes check both view and edit rules.
- `packages/server/src/dataapi.ts:1996` and `packages/server/src/dataapi.ts:2275`: session privileges are passed to record reads.
- `packages/web/src/page-source.ts:93`: generated pages call `tabularius.records`; `packages/web/src/main.ts:6294` delegates Page API records/find/update to the web `Api`; `packages/web/src/api.ts:169`, `packages/web/src/api.ts:364`, and `packages/web/src/api.ts:434` show web-session authentication and Data API requests.
- `packages/server/src/mcp.ts:1086`: `find_records` calls the store with the authenticated account's privileges.

Showcase action: use this explicit privilege definition and a simple, tested relationship. The Page API check exercises its server transport, not browser rendering or the iframe bridge. Imported limited-rule fidelity and more complex relationship graphs remain unverified here; do not assume an imported privilege set has the same definition without inspecting it.

## 2. SQL over PostgreSQL in the demo — no by default; supported through serve

`tabularius demo` starts **zero PostgreSQL listeners**. There is no SQL port to discover. Its free HTTP port is unrelated to PostgreSQL. `DemoOptions` has no SQL-port option, and the demo command rejects unrecognised flags: **`tabularius demo --sql-port ...` does not enable SQL**. `TABULARIUS_SQL_PORT` is parsed by the serve command, not by `startDemo`.

`tabularius serve FOLDER --host 127.0.0.1 --sql-port 5432` enables the listener on that chosen port; `--sql-port 0` allocates a free port. The server prints **`PostgreSQL clients: port N`** after the listener opens. Wait for that line: `serve()` can return before SQL has finished listening, and a bind failure is logged separately. SQL is read-only unless `--sql-writes` is also supplied. The connecting privilege set needs **`fmxdbc`**, even for `[Full Access]`; the generated store's default set does not include it.

Evidence:

- `packages/server/test/showcase-assumptions.test.ts:146`: real generated demo startup never calls `PgServer.listen` and emits no SQL-port announcement.
- `packages/server/test/showcase-assumptions.test.ts:166`: generated store, explicit `fmxdbc` grant, announced free port, real PostgreSQL authentication and `SELECT COUNT(*)` returning **1**, refused UPDATE, unchanged data.
- `packages/cli/src/demo.ts:33`, `packages/cli/src/demo.ts:97`: demo options and the `serve()` call omit `sqlPort`.
- `packages/cli/src/main.ts:1189`, `packages/cli/src/main.ts:1196`: demo's accepted options and rejection of extras.
- `packages/cli/src/main.ts:1429`: serve parses `--sql-port` / `TABULARIUS_SQL_PORT`.
- `packages/server/src/index.ts:896`: listener constructed only when `sqlPort` is supplied; it receives `opts.hostname` and the separate SQL-write opt-in.
- `packages/server/src/index.ts:1014`: asynchronous listener startup and port/failure messages.
- `packages/server/src/pgwire.ts:1566`: bind uses the supplied hostname, defaulting to `127.0.0.1`.

Showcase action: keep a generated demo with `--keep FOLDER`, stop it, grant the intended account's set `fmxdbc`, and host that folder with `tabularius serve` and the flags above. Alternatively, a later showcase implementation can pass `sqlPort: 0` with `hostname: '127.0.0.1'`, grant the intended SQL privilege, and display the announced port. That preserves loopback-only exposure and read-only SQL; it is not an existing demo option. The demo already validates loopback hostnames (`packages/cli/src/demo.ts:27`, `packages/cli/src/demo.ts:68`).

## 3. AI steps with no model — partly: useful trace, empty script result

A generated script containing **Perform Find by Natural Language** and **Generate Response from Model**, with error capture on and no configured model, executes both steps and finishes with numeric error **3**, result text **`""`** (empty). The Data API returns **`scriptError: "3"`** and **`scriptResult: ""`**.

Each step's trace has error 3 and this exact message, respectively:

> Perform Find by Natural Language needs an AI model, and scripts here run offline (a server started with --ai runs it)

> Generate Response from Model needs an AI model, and scripts here run offline (a server started with --ai runs it)

The trace is actionable: it identifies the missing model and `--ai`. The ordinary script result does **not** carry that explanation, so a showcase displaying only the result will show nothing. This is the no-server-model case, not the separate per-file “AI turned off” policy gate.

Evidence:

- `packages/server/test/showcase-assumptions.test.ts:199`: asserts both exact trace messages, final error/result, and the Data API script response without contacting any model.
- `packages/server/src/host.ts:337`: script options include AI only when the host has a script AI adapter.
- `packages/scripts/src/engine.ts:2693`: `aiFor` refuses a missing adapter with error 3 and the message above, before looking up an AI account.
- `packages/scripts/src/engine.ts:3159`, `packages/scripts/src/engine.ts:3196`: both steps use that gate.
- `packages/server/src/dataapi.ts:1730`: script responses expose `r.result` and `r.error`, not trace diagnostics.

Showcase action: have the demo script or UI handle error 3 explicitly and show an AI-off explanation. A later product change should carry the diagnostic to the person running the script and offer a concrete supported `tabularius serve ... --ai ...` setup path. Do not suggest `tabularius demo --ai`: demo rejects that flag too. No diagnostic or behaviour was changed here.

## 4. MCP credential and expiry — partly: available credential, wrong default for the launch gate

The demo's server generates an **administrator bearer credential** in `.openhbam-mcp-token` inside its temporary hosted folder. `tabularius mcp-token FOLDER` retrieves it. This credential works for an HTTP MCP client as `Authorization: Bearer <token>`. The demo prints its Admin account/password and app address, not this token. An unauthenticated `/mcp` request returns **401**, even on loopback. No external Claude app was launched; the test uses the existing MCP SDK over a real HTTP handshake.

That administrator credential has **no expiry**: even with the expiry clock advanced by 100 years, it still completes an MCP handshake. Stopping an unkept demo deletes its folder and stops access, but that is not credential expiry. **Do not give this credential to the showcase's AI client if tokens must expire.**

The existing account-token path already meets the expiry requirement. A generated agent token issued after server startup successfully reads its permitted deal, then `/mcp` refuses it with **401 at its exact expiry deadline**. A direct store token without an explicit deadline lasts **90 days**; the maximum is **3650 days**. The admin route uses `tokenExpiry`, whose default can be configured; the direct store method uses its own 90-day default. Use an explicit short deadline for the showcase.

Evidence and callable signatures:

- `packages/server/test/showcase-assumptions.test.ts:146`: demo's unauthenticated denial, generated administrator credential, non-disclosure in logs, and absent expiry gate.
- `packages/server/test/showcase-assumptions.test.ts:228`: post-startup agent creation, passwordless/non-full-access account, `fmmcp` scope, read-only token, successful find, exact-deadline refusal, and default lifetime.
- `docs/connect-ai.md:35`: credential required even locally and the administrator-token retrieval command.
- `packages/server/src/index.ts:521`, `packages/server/src/index.ts:768`: administrator-token creation and comparison, distinct from account-token checks.
- `packages/server/src/mcp-local-token.ts:19`: `localMcpToken(dir: string): string`; `packages/server/src/mcp-local-token.ts:38`: `readLocalMcpToken(dir: string): string | undefined`. These manage the server administrator credential, not an agent account.
- `packages/server/src/admin.ts:844`: `Admin.handle(req: IncomingMessage, res: ServerResponse, url: URL): Promise<boolean>`. Its `POST /tabularius/admin/v1/mcp/tokens` branch at `packages/server/src/admin.ts:1983` accepts `{ database, agent: { name, privilegeSet, needsApproval }, label, days, readOnly, layouts }`; at `packages/server/src/admin.ts:2004` it calls the store helper below. There is no separate server-level onboarding function to import from `demo.ts`.
- `packages/store/src/store.ts:5460`: `Store.createAgentApiToken(name: string, privilegeSet: string, agent: { createdBy?: string; needsApproval?: boolean }, token: Parameters<Store['createApiToken']>[1] = {}): string`. It atomically creates/rebinds the agent and issues its token.
- `packages/store/src/store.ts:3799`: `Store.setAgentAccount(name: string, privilegeSet: string, opts: { createdBy?: string; needsApproval?: boolean } = {}): void`; refuses `[Full Access]` and does not assign an interactive password.
- `packages/store/src/store.ts:5480`: `Store.createApiToken(account: string, opts = {}): string`. The typed options include `label?: string`, `readOnly?: boolean`, `expires?: Date`, `surfaces?: string[]`, `layouts?: string[]`, `identity?: { issuer: string; sub: string; person?: string; mapping: string }`, `provenance?: 'service' | 'delegated'`, and `guard?: () => void`.
- `packages/server/src/token-expiry.ts:28`: `tokenExpiry(requested: unknown, fallbackDays: number = defaultTokenDays()): Date`.
- `packages/store/src/store.ts:5515`, `packages/store/src/store.ts:5718`: mandatory finite lifetime at creation and refusal when the deadline is reached.

Showcase action: **yes, `demo.ts` can call the helper after startup** through `running.host.get(database)!.createAgentApiToken(...)`; `serve()` returns that host (`packages/server/src/index.ts:1036`). First create a narrow privilege set with `fmmcp`; pass `surfaces: ['fmmcp']`, `readOnly: true`, and an explicit `expires: new Date(...)`. Return/display the token once and its deadline, with the demo's `/mcp` URL. This needs no HTTP call to the admin route. Keep the file's AI-access policy and personal-data isolation in mind; the tests turn off isolation only in their generated test stores to isolate privilege enforcement. No model configuration is needed for MCP record reads.

Validation: `node --no-warnings --test --test-concurrency=2 packages/server/test/showcase-assumptions.test.ts` passed **5 tests, 0 failures, 0 skips**, in approximately **1.7 seconds**. `npm run typecheck` passed both TypeScript projects with zero errors. Prohibited command names use a stub PATH and a checked failure marker. The initial sandboxed attempt could not run the server's OS ownership check; the successful local run permitted that check and loopback sockets. No product tool, route, or setting changed, so reference regeneration is not required. Full precheck was not run because it invokes git, which this item prohibits. External compatibility, real Claude configuration, and browser rendering remain unverified; independent security review is left to the supervisor.
