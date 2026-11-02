# Read-gate inventory (r28-01)

This extends the generated privilege matrix already present in `docs/audit-privilege-matrix.md`, the store summary/related-privilege regressions, and `notes/audits/r22-02-cross-file-isolation.md`. Initial filename/content searches found no earlier r28-01 inventory, backlog, claims directory, or AGENTS.md in this checkout. Existing gates were retained. No private corpus or downloaded fixture was opened; all runtime inputs are generated. No real git command ran. There were no dependency changes, service operations, commits or pushes; the optional version probe was blocked by a command stub as described below.

The security policy is: an account-facing result must not disclose hidden fields, records, counts, found-set sizes, grouping, sort order or aggregates. A raw store/SQLite primitive is **not** an authorization boundary. Local operator operations, authenticated server administration, and internal materialization are separately classified below; they do not accept a restricted file account as authority. An omitted `Privileges` argument means trusted execution, not an anonymous caller.

## Public expectations and KNOWN

Public references establish the following principles; synthetic numeric results are computed from generated inputs, not claimed as vendor test results. No Claris instance was used.

| Expectation used by tests | Public page / short expression | Result expected here |
| --- | --- | --- |
| Row formula and hidden fields/tables | [Editing record access privileges](https://help.claris.com/en/pro-help/content/record-access-privileges.html): “No access”, “Boolean calculation” | Only the caller-owned row contributes; hidden fields/tables contribute no returned data. |
| Found-set cardinality and summaries | [Editing record access privileges](https://help.claris.com/en/pro-help/content/record-access-privileges.html): “found set is always filtered”, “exclude data” | One visible row; aggregate total 7 in the store regression, excluding the other row. |
| Record and layout checks both apply | [Get(RecordAccess)](https://help.claris.com/en/pro-help/content/get-recordaccess.html): “Get(LayoutAccess)” | Hidden parent/layout requests fail before portal counts. |
| Found-count meaning | [Get(FoundCount)](https://help.claris.com/en/pro-help/content/get-foundcount.html): “number of records” | Counts describe the visible found set, including portal paging and current dashboard counts. |
| Value lists and ordinary scripts | [Editing record access privileges](https://help.claris.com/en/pro-help/content/record-access-privileges.html): “does not display any values” | No hidden source values; caller-run scripts keep their account gates. |

| KNOWN | Status / boundary |
| --- | --- |
| Exact error envelopes, omission versus empty value, rejection of hidden sort/group fields | **Unverified Claris compatibility**. Tabularius security policy; the cited record-access page documents access restrictions, not these API representations. Existing protocol matrix expectations remain its own policy. |
| Live presence/event filtering, calendar headers, MCP tools, dashboards, saved digest prose and RAG spaces | **Unverified Claris compatibility**. Tabularius extensions. Expected results implement the stated invariant; there is no public Claris page establishing equivalent endpoints. |
| Historical digest payloads | Restricted readers receive run metadata with empty data/highlights and no saved prose. Re-run the dashboard for current filtered results. Existing snapshots have no row/field provenance. |
| AI digest prose for restricted accounts | Suppressed, because arbitrary prose cannot be re-filtered after row access changes. Current dashboard data remains available. |
| RAG snapshots | File-scoped documents have no row/field provenance. The server adapter now requires `readsEverything` on each operation. No claim of per-document RLA. |
| Internal/operator readers | Raw primitives have no account parameter. They are catalogued as trusted capabilities, with their account-facing caller boundary documented below. They are not independently safe to expose as routes. |
| Static inventory limits | Type-resolved references, aliases, bracket calls, destructured capabilities, raw SQLite statements and calculation/relationship reads are checked. Reflective/dynamically constructed property names and values erased to `any` are not a complete call-graph proof. |
| Runtime completeness | Generated tests exercise reader APIs and boundary families, including existing protocol matrices. They do **not** invoke every internal helper or every branch of every classified function as a restricted account. The inventory is exhaustive for the enumerated code APIs, not a claim of exhaustive execution coverage. |
| Operator diagnostics and outgoing hooks | Local diagnostics require filesystem/operator authority; change webhooks require server-admin configuration. Their internal builders do not accept a restricted account. Real service commands, thumbnail tools, external webhook/model calls and vendor conformance are unverified here. |
| Independent security review | A different-model review follows this change; it has not been performed by this author. |

## Reproduced gaps and fixes

Each row has a synthetic regression. Before fixes the four new store regressions failed; surface regressions reproduced the live and snapshot disclosures. Test data values are deliberately omitted from this report.

| Gap | Fix | Regression |
| --- | --- | --- |
| `sortIdsCurrent` trusted supplied ids and hidden sort columns | Layout/table/field checks plus record view filter before ordering | `store/test/read-gate.test.ts`: sortIds |
| `groupSummariesCurrent` grouped supplied ids and included hidden summary fields | Layout/table/group-key gate, visible ids, visible output summary fields | Same file: groupSummaries |
| `foundSetRowsCurrent` returned unfiltered supplied-id count and pagination | Filter before choosing the page and reporting count | Same file: foundSetRows |
| `portalCountsCurrent` accepted a hidden parent and reused restricted cached counts | Parent gate before fast paths; restricted callers recompute related counts | Same file: portalCounts; extended `privileges-everywhere.test.ts` cached related-row regression |
| Live locks/viewers and event ids used only table visibility | Per-record rules for snapshots, presence writes, individual events and bulk ids; missing/deleted restricted rows fail closed | `server/test/read-gate-surfaces.test.ts`: locks/viewers and fenced stream |
| Digest histories kept earlier, broader account data | Suppress unverifiable historical payloads for restricted readers on list/detail/runs routes | Same file: saved digest |
| Digest data/prose survived access changes across the summary await | Compare data/security stamps of hosted files before webhook handoff and after awaits; discard changed snapshots; release running state in `finally` | Same file: asynchronous digest, with an in-process poster |
| RAG file-only scope returned copied record data to restricted accounts | Server adapter checks unrestricted record/field visibility on every space operation; script engine also rejects restricted/scoped callers with custom backends | Same file: RAG adapter and script regressions, with generated vectors and no embedding request |

## Inventory generation and enforcement

`node scripts/read-gate-inventory.ts --check` scans only package source trees, resolves the declarations behind reads using the already installed TypeScript compiler, compares call-expression fingerprints and multiplicity with `read-gate-allowlist.json`, and checks this generated table. `node scripts/read-gate-inventory.ts` updates **only** the table after classification has been reviewed. There is deliberately no command to accept new call sites automatically.

The inventory contains **2,462 read/capability sites in 716 functions**. The initial discovery used `rg` over Store's read methods and their callers. The generator additionally includes direct `Store.sql` capability transfers, SQLite `prepare/get/all/iterate`, calculation and relationship reads, so SQL aliases and builders that bypass Store methods are visible. SQLite writes and schema/security reads are retained conservatively: their presence in the table does not mean they disclose record values. Each row names the enclosing function, every relevant source line, and its gate classification. New sites, changed call arguments, duplicate sites, removed sites and moved functions fail the allow-list test; shifting line numbers only requires regenerating the report.

The guard regression injects synthetic unlisted readers in memory, including aliases, bracket access and destructuring, without editing production source. It also checks duplicate call-site multiplicity. Passing the guard means classification is current, not that a fingerprint proves authorization: the `CORE` entries in particular are fingerprints of call text, so they show that a site did not change, not that its privilege argument is right (a `privileges` variable rebound upstream would go unnoticed).

The scan is a regression catcher, not a hard boundary. Resolution is by declaration file, so a member of a receiver typed `any` or `unknown` is reported by name (as `Untyped.<api>`). Everyday names (`get`, `find`, `select`, `query`, `row`, `describe`, `container`, `sql` and a few more) are reported only when the receiver is a Store, calculation engine or SQLite connection cast to `any`/`unknown`, directly, through a variable whose initialiser is the cast (up to four aliases deep) or by destructuring, and only for types declared in `store.ts`, `calc.ts`, `related.ts` or `node:sqlite`; on any other untyped value they would be a Map or an array. These are not found: a variable annotated `any` and assigned a reader instead of cast (`const a: any = s`, `let a: any; a = s`), an alias passed through a function parameter, an object property or an array element, a chain deeper than four, a function that returns `any`, a cast of a union, intersection or generic (`Store | Calculations`), a cast of a Store subclass declared in another file, a JSDoc cast in a `.mjs` file, `.prepare` or `.exec` on a SQLite connection cast to `any`, a computed key (`(s as any)[key]()`, `Reflect.get(s, 'find')`), a cast to a structural type, a call through a subclass that overrides the method in another file, and anything outside `packages/*/src`.

The inventory also classifies the authentication metadata reads in `Store.useRecoveryCode` and `Store.knownSharedAccount` as `CORE`. The former checks for an unused code matching the account and supplied code hash before consuming it and opening a session; the latter returns an internal account-existence boolean for sign-in lockout accounting. Both query security metadata rather than solution records, and neither returns the stored metadata to the caller.

## Route and gate ledger

The route dispatcher is `packages/server/src/index.ts`. The generated function inventory below expands these boundaries rather than replacing them with a filename-only exemption.

| ID | Entry/caller gate and data handling | Synthetic evidence |
| --- | --- | --- |
| REST | `DataApi.authorize` / `sessionPrivileges`, layout scope; `Store.find/get` apply record rules and field omission before count/data envelopes | privilege-matrix-dataapi, api-token |
| WEB | `WebClient.handle` session/layout gate; store readers receive privileges; groups/export reselect visible ids; history uses field/table concealment | privilege-matrix-web, read-gate |
| ODATA | `ODataEndpoint` authenticated privileges, visible entity sets/properties; select/count/compute and related readers pass privileges | privilege-matrix-odata |
| XML | `CwpXmlEndpoint` authentication/fmxml plus layout; `find/get` receive privileges | privilege-matrix-xml |
| SQL | HTTP `checkReadsEverything`, pgwire authentication and per-query privilege recheck, destination-file check; MCP `readsEverything` for raw SQL/formulas/numeric containers | privilege-matrix-sql, pgwire, mcp |
| MCP | `privilegesIn`, tool-specific layout/read gates; raw tools use SQL gate; `registerResources` uses `designAccess`/Full Access for whole-file resources | privilege-matrix-mcp |
| SCRIPT | ScriptEngine caller privileges, `reading`, found-set/value readers and calculation passes; related raw match ids filtered through destination `viewableIds`; export/print flags checked separately | privilege-matrix-scripts; store related/summary tests |
| GATED-STORE | `checkLayout`, local/destination privileges, `viewFilter`/`checkRecordRule`, field checks and `toRecord` masking; calculations carry privileges | read-gate, summary-privileges, privileges-everywhere |
| CALC | Calculation `Pass.privileges`, field visibility, visible related rows and `scopedTableSql`; raw materialization is internal and must not be returned directly | summary-privileges, privileges-everywhere |
| RELATED | Raw relationship primitives; caller supplies privileges or filters ids before exposure (`ScriptEngine.relatedIds`, store portals/calculation pass) | privileges-everywhere, protocol matrices |
| CALENDAR | Data API session/scoped token, readable mapping, `find(... privileges)` before event count/content | read-gate-surfaces |
| LIVE | Session per request/event, file binding, record gate for presence and event ids; design events require Full Access | read-gate-surfaces |
| CHANGE | Data API account refresh; table and `canViewRecord` check for record events. Configured webhook consumers are server-admin authority | existing change-feed code review; live synthetic fence |
| DASHBOARD | Saved definitions are metadata; `DashboardApi` computes widgets through `summarizeRecords` with requesting privileges | read-gate-surfaces |
| DIGEST | `mayRead` account ownership/Full Access plus restricted-history suppression; runner obtains current privileges and rechecks snapshot stamps before delivery | read-gate-surfaces |
| SUMMARY | `findIds` with privileges; visible grouping/measure fields; raw SELECT restricted to authorized ids, evaluated path carries privileges | read-gate-surfaces, privilege-matrix-mcp |
| PROFILE | `layoutProfile` field access and destination `viewableIds`; `columnProfile` operates on those ids. MCP layout gate precedes entry | read-gate-surfaces, privilege-matrix-mcp |
| SEARCH | Text/semantic search checks tables, visible fields, visible ids and readable layouts before hits; vectors read with privileges | privilege-matrix-mcp |
| RECORD | Explanation/context helpers use account-bearing calculation passes and visible related rows; route/tool checks parent record first | protocol matrices; related/summary tests |
| HISTORY | Web parent read gate and `hideField`/`hideTable` callbacks; MCP history is a design tool requiring Full Access | privilege-matrix-web, mcp |
| CONTAINER | Signed URL minted from privileged field read; the `index.ts` container route calls `Host.checkUrl` to validate signature, expiry and bound account identity/inactive state before raw container/range/thumbnail reads | protocol matrix container checks; actual thumbnail programs not run |
| DESIGN | `DesignApi`/`SecurityApi` Full Access; MCP design guard or `designAccess` (modifiable scripts plus readsEverything); debug Full Access. Sampling/diagnostic raw helpers inherit that caller gate | privilege-matrix-mcp, admin; static caller review |
| ADMIN | Separate server-admin authorization in `Admin.handle`/Admin API, not file credentials; includes logs/statistics | privilege-matrix-admin |
| AUTOMATION | Full Access configuration, saved execution account and current script privileges; stored run logs are privileged metadata/history | static caller review; protocol script matrix |
| CLEANUP | Scans/updates select visible ids and fields; raw undo/snapshot journal is internal to checked mutation paths; HTTP session and MCP caller gate | static caller review |
| IMPORT | Import route/layout/write privileges before target-key/undo journal access; configuration/history uses design/admin authority | static caller review |
| ACCOUNT | Assistant tool calls retain requesting account/file; model redaction does not replace the underlying read gate | protocol MCP matrix; RAG regression |
| RAG | `Assistant.scriptAi` adapter `checkRag`: current `readsEverything` plus model policy; ScriptEngine `checkRagRead` enforces account/ceiling gates; raw RagStore is an internal file-scoped cache | read-gate-surfaces |
| REDACTION | Raw secret/PII inspection is used to remove values or build account-scoped stand-ins; preview belongs to privileged design tools | static caller review |
| POLICY | SQL/AI policy inspection is an internal refusal path, not a returned record result | static caller review |
| AUTH | Account/token/identity/configuration SQL; authentication/session/admin gates, not solution record reads | protocol authentication matrices |
| JOIN | Worker receives only rows/columns already filtered by `ODataEndpoint.crossjoined`; its database is in memory | static caller review |
| OPERATOR | Local CLI/filesystem ownership, import/reconversion/sync/backup operator, or server-admin boundary; no restricted-account invocation of raw functions | static caller review; no real operator commands executed |
| INTERNAL | Summary warmer/materializer for internal caches; account-facing reads reapply gates | summary-privileges |
| CORE | Store/SQLite internals, security metadata, transactions and raw capabilities. **No independent account gate**; only the caller boundaries above authorize exposure | store and protocol regressions; static inventory |

## Validation

Run `node scripts/test-read-gate.ts` for the generated store/surface regressions and existing synthetic protocol matrix. It uses `--test-concurrency=2`, per-test timeout 55 seconds and a stub-only child PATH. Stubs for launchctl, systemctl, sc, git, npm, curl and sudo write a marker and exit 99; any marker fails the runner. Temporary synthetic release metadata prevents the existing optional git version probe, and is removed afterward. No tests are skipped or disabled.

Run `node --test --test-concurrency=2 packages/server/test/read-gate-inventory.test.ts` for the static guard, `node scripts/read-gate-inventory.ts --check` for report freshness, and `node node_modules/typescript/bin/tsc --noEmit --pretty false` for types.

Prior implementation runtime run (before this repair): **4,483 passed, 0 failed, 0 cancelled, 0 skipped**, across 20 generated-input test files in **126.52 s** total. The command-stub marker remained absent. The final inventory guard passed **3/3** in **17.11 s**; inventory freshness and TypeScript checks passed. Summed top-level test durations for the ten protocol files ranged from **12.15 to 26.69 s** (excluding module startup); the new store and surface regressions also remained well below the per-file budget. The live-stream fence has a 15-second failure bound, with observed event handling comfortably below one third of that bound. The combined hidden-field/hidden-table/row-rule solution also exercises REST, web export, XML, OData counts/aggregates, dashboards, and MCP filtered/denied readers. The first broad run passed 4,384 assertions but correctly **failed the runner** because its command stub caught the pre-existing optional version probe; synthetic build metadata removes that probe without weakening the marker check. Initial sandbox-only HTTP attempts could not bind loopback; subsequent runs used approved loopback execution.

## PR repair review after merging main

The post-merge baseline failed both inventory assertions (111 changed/unclassified fingerprints) and the cached portal-count cost assertion. Review covered each changed expression and its caller boundary. The repaired inventory has 2,454 read/capability sites in 713 functions; 33 functions carry explicit review reasons in the JSON allow-list. Obsolete `oauth.ts/passwordMark` and `calc.ts/Calculations/context/summary/group` inventory scopes were removed because their enumerated reads moved. No wildcard classifications or test relaxations were added.

Two reads required code fixes before classification: `Calculations/context/summary` could use a hidden break field or hidden summary field, and `Store/runningSummaryValues` could use a hidden restart field supplied through sort state. Both now check field visibility before reading those values. The synthetic regressions compare unrestricted results with concealed restricted results. These are Tabularius access invariants, not claims of documented Claris behavior.

`Store/portalCountsCurrent` now reuses account-free snapshot counts before querying design metadata. Every account-bearing call still resolves the current layout and checks layout/parent access before returning cached counts; restricted accounts still recompute related totals. Its new regression covers both layout argument forms, a newly hidden parent, and a layout-denied account whose record privileges otherwise read everything.

Repair validation uses generated stores only. Final regeneration and `node --no-warnings scripts/read-gate-inventory.ts --check` passed for all 2,454 sites; the final standalone inventory test run passed **3 tests, 0 failures, 0 skips** in 23.69 seconds. `npm run typecheck` passed both TypeScript projects. The focused command `node --no-warnings --test --test-concurrency=2 packages/server/test/read-gate-inventory.test.ts packages/store/test/related-path-cost.test.ts packages/store/test/read-gate.test.ts packages/store/test/summary-aggregates-generated.test.ts` passed **18 tests, 0 failures, 0 skips** in 19.81 seconds.

Each new regression was checked in a temporary source copy with only its corresponding production fix removed. The portal snapshot test, hidden GetSummary key test, and hidden running-restart test each failed as expected (**7 passed, 1 failed** per run). Restoring the pre-repair allow-list in that copy reproduced both inventory assertion failures (**1 passed, 2 failed**). The working tree was never reverted. The three new store tests completed in a file comfortably below the 60-second target; none adds timing assertions.

The initial `node scripts/test-read-gate.ts` run reached its existing 180-second overall timeout; the admin matrix also reached its existing 55-second file timeout while other checks were running. It emitted 3,719 passing test lines and one failing file line before interruption; those are partial counts. Admin rerun alone with the same 55-second file limit passed **298 tests, 0 failures, 0 skips** in 30.00 seconds. The other 19 files were rerun with the same concurrency and file limit: **4,187 passed, 1 failed, 0 skipped** in 147.11 seconds. The failure was the digest-history regression reusing a session after privilege changes; main now invalidates that session. The test now additionally asserts HTTP 401 for the revoked session, signs in again, and retains all three HTTP 200 plus hidden-data checks. `node scripts/test-read-gate.ts --surfaces` then passed **27 tests, 0 failures, 0 skips** in 4.42 seconds. Reverting only this test repair in a temporary copy reproduced the stale-session assertion (**26 passed, 1 failed**). Across the latest results for all 20 PR runtime files, **4,486 tests passed, 0 failed, 0 skipped**. All spawned test processes used the marker-writing forbidden-command stubs; no timeout or test was edited.

The broader reruns use `node --no-warnings --test --test-concurrency=2 --test-timeout=55000` under the same stub-only child environment as the PR runner. Files run:

- `packages/store/test/`: `read-gate.test.ts`, `summary-privileges.test.ts`, `found-set-portal.test.ts`, `privileges-everywhere.test.ts`.
- `packages/scripts/test/`: `ai-steps.test.ts`.
- `packages/server/test/`: `read-gate-surfaces.test.ts`, `rag-store.test.ts`, `rag-hybrid.test.ts`, `r15-rag-ai.test.ts`, `calendar-feed.test.ts`, `privilege-matrix-admin.test.ts`, `privilege-matrix-api-token.test.ts`, `privilege-matrix-dataapi.test.ts`, `privilege-matrix-mcp.test.ts`, `privilege-matrix-odata.test.ts`, `privilege-matrix-pgwire.test.ts`, `privilege-matrix-scripts.test.ts`, `privilege-matrix-sql.test.ts`, `privilege-matrix-web.test.ts`, `privilege-matrix-xml.test.ts`.

Also red on main, per the repair brief: `packages/store/test/consistency.test.ts` retains its four pre-existing failing TODO probes (SQL accent equality, date overflow, time overflow, web date normalization). The reported `packages/server/test/container-large-files.test.ts` peak-memory failure did not reproduce here after loopback access was allowed. Combined rerun: **10 passed, 0 hard failures, 4 existing TODO failures**, 12.34 seconds. The initial sandbox run had **9 passed, 1 loopback setup failure, 4 TODO failures**. Neither file was changed.

The following reasons apply to the exact enumerated expressions in each named function. Raw internal materialization and security bookkeeping are explicitly identified as trusted capabilities; they are not independently authorized readers.

| File / function | Gate | Reviewed boundary or repair |
| --- | --- | --- |
| `packages/store/src/store.ts` / `Store/checkProposedWrite`, `Store/gateAgentWrite`, `Store/approvePending`, `Store/constructor` | CORE | Approval preflight reads the target and first related rows only to evaluate the same layout, record and field checks as direct writes, before any proposal/event. The constructor adds a nullable credential-ceiling column; queue/replay SQL stores and restores only that ceiling. Replay narrows current agent privileges, and a refused replay retains its proposal. |
| `packages/scripts/src/engine.ts` / `ScriptEngine/record` | SCRIPT | Store.get receives the current script privileges; getCurrent checks the saved row before overlaying pending edits and masks hidden fields. The cache key includes the privilege fingerprint. |
| `packages/scripts/src/engine.ts` / `ScriptEngine/newRecord` | SCRIPT | The other-window found-set comparison calls findIds with this.reading, which carries the current script privileges; findIdsHere applies viewFilter before returning ids. |
| `packages/server/src/backup.ts` / `stageRestorePoint` | OPERATOR | The new SQLite existence probes inspect only a staged restore copy to refuse unsupported external-container replay. Entry is through local restoreAt or server-admin restorePointTo; no record payload is returned. |
| `packages/server/src/containers.ts` / `ContainerFiles/make` | CONTAINER | The new containerInfo read bounds thumbnail input after index.ts validates the signed URL through Host.checkUrl (signature, expiry and bound account identity/inactive state). This private helper is not a route. |
| `packages/server/src/containers.ts` / `ContainerFiles/makeAdmitted` | CONTAINER | The container byte read moved from make into this private admitted helper; it inherits index.ts/Host.checkUrl signed-URL validation and returns only the authorized container thumbnail. |
| `packages/server/src/oauth.ts` / `legacyPasswordMark` | AUTH | Renamed legacy password fingerprint helper: account row id/password hash are hashed for grant validation and startup migration, never returned as solution data or raw credentials. |
| `packages/server/src/oauth.ts` / `OAuthServer/constructor` | AUTH | Startup migration reads refresh grants and matching account/token provenance, relabels valid legacy delegated credentials and revokes invalid grants. These are internal authentication tables, not record results. |
| `packages/server/src/webclient.ts` / `WebClient/refresh` | WEB | getMany retains the session privileges while adding sort state; getManyCurrent filters supplied ids/found-set rows and toRecord masks fields. Hidden summary break/restart fields are now explicitly suppressed. |
| `packages/server/src/webclient.ts` / `WebClient/records` | WEB | foundIds selects visible records and getMany receives session privileges with sort state; its row filter and field masking remain in force, including the repaired summary key checks. |
| `packages/server/src/webclient.ts` / `WebClient/exportRecords` | WEB | canExport is checked, foundIds receives privileges, and each getMany batch retains them while adding sort state; hidden fields are omitted and masked fields export empty. |
| `packages/server/src/webclient.ts` / `WebClient/aiReplace` | WEB | The AI access and editable target-field checks precede getMany batches carrying session privileges; only visible rows/fields reach model input, with secret/container redaction afterward. |
| `packages/store/src/calc.ts` / `Calculations/computed` | CALC | The repetition-aware context retains the caller's Pass, including privileges. User-facing context field reads enforce field visibility; internal stored passes remain trusted materialization. |
| `packages/store/src/calc.ts` / `Calculations/context/summary` | CALC | Repaired: refuse hidden summary and break fields before direct value reads. Found-set rows come from the checked Store caller; the break-key pass carries privileges. related.clear is cache maintenance, not a record read. |
| `packages/store/src/calc.ts` / `Calculations/beforeWrite` | CORE | Repetition-aware contexts compute persisted auto-enter/stored values inside checked create/update paths. This is intentionally full-data internal materialization, not an independently account-gated reader; later toRecord/context reads apply visibility. |
| `packages/store/src/calc.ts` / `Calculations/computeStoredStyled` | CORE | Repetition-aware contexts materialize stored calculation values and styles for internal write/recompute callers. No account gate exists here; returned storage values are exposed only through checked record/calculation readers. |
| `packages/store/src/store.ts` / `Store/constructor` | CORE | The Store.sql references register deterministic sort-key, first-repetition and SQL substring functions. They do not read or return solution rows; opening the raw store remains an operator/internal capability. |
| `packages/store/src/store.ts` / `Store/joinTransaction` | CORE | The new createSession capability records pending transaction changes after transaction ownership checks. It is private write bookkeeping, with no account-facing row result. |
| `packages/store/src/store.ts` / `Store/independentWindowWrite` | CORE | ScriptEngine.via invokes this for checked create/update/delete/container operations in another window. The raw audit read retains only held transaction audit entries for internal replay and hash relinking; it is not returned to the caller. No independent read authorization is claimed. |
| `packages/store/src/store.ts` / `Store/setPassword` | AUTH | The new statement deletes delegated API tokens during securityChange. Password/security callers enforce their own account or Full Access authority; this raw mutation primitive does not return credential rows. |
| `packages/store/src/store.ts` / `Store/setAccountActive` | AUTH | The added statements rotate identity and revoke account/person/mapping tokens on deactivation inside securityChange. SecurityApi requires Full Access; script account-management callers check their authority. No solution data is returned. |
| `packages/store/src/store.ts` / `Store/signInMark` | AUTH | The new prepared statement persists an authentication generation after rereading the current fingerprint under ledgerWrite. Only generation plus a cryptographic fingerprint leaves this internal helper. |
| `packages/store/src/store.ts` / `Store/signInBase` | AUTH | Reads identity/password metadata solely to hash credentials and authority for session invalidation; raw metadata is not returned. |
| `packages/store/src/store.ts` / `Store/signInBase/identity` | AUTH | Reads only the selected mapping/person identity id into signInBase's hash; no solution records or raw credentials are exposed. |
| `packages/store/src/store.ts` / `Store/ledgerRow` | AUTH | Private schema-presence and main sign-in-ledger reads serve signInMark/settleSignIns. The generation is validated; ledger rows remain inside authentication bookkeeping. |
| `packages/store/src/store.ts` / `Store/ledgerWrite` | AUTH | Private SQL capabilities create the sign-in ledger and manage its transaction. Used only by signInMark/settleSignIns; no record-result exposure or independent account gate is claimed. |
| `packages/store/src/store.ts` / `Store/settleSignIns` | AUTH | Private securityChange bookkeeping reads live account names and ledger keys, removes obsolete identities and advances generations atomically. These internal authentication lists are not returned to clients. |
| `packages/store/src/store.ts` / `Store/savePrivilegeSet` | AUTH | The added token deletion revokes credentials for accounts whose authority changed. SecurityApi requires Full Access and internal bootstrap uses operator authority; no record data is returned. |
| `packages/store/src/store.ts` / `Store/setAccountPrivilegeSet` | AUTH | The added token deletion revokes credentials when an account's effective set changes. Security/admin/script-management callers authorize the mutation; this raw security primitive exposes no record rows. |
| `packages/store/src/store.ts` / `Store/portalCountsCurrent` | GATED-STORE | Account-bearing calls resolve the current layout and checkLayout/canView before any cached count. Only account-free snapshots bypass metadata refresh; restricted callers recompute related counts. |
| `packages/store/src/store.ts` / `Store/findHere` | GATED-STORE | The running-summary id query and repeated found-set portal query use where/params already combined with viewFilter; checkFieldsVisible validates find/sort fields and the public find entry checks the layout. |
| `packages/store/src/store.ts` / `Store/runningSummaryValues` | GATED-STORE | viewableIds filters rows before accumulation and source fields are checked with fieldHidden. Repaired: hidden restart fields in supplied sort state suppress the running result before calc.value; pass privileges follow calculations. related.clear only clears a cache. |
| `packages/store/src/store.ts` / `Store/getCurrent` | GATED-STORE | checkLayout and checkRecordRule precede pending-edit overlay; running-summary ids use viewFilter and toRecord masks output. opts.row references are typed row-supply capability references, not additional SQL reads. |
| `packages/store/src/store.ts` / `Store/groupSummariesCurrent` | GATED-STORE | Layout/table/group-key checks and viewableIds filter supplied ids before fraction totals collect rowsById; visible summary definitions and a privilege-bearing calculation pass govern aggregation. |
| `packages/server/src/pgwrite.ts` / `executeWrite/reader` | SQL | SQL writes (`--sql-writes`) read the table to find the records a WHERE names and to work out each new value. They run as the signed-in account, which already passed the SQL connection's gate (fmxdbc, reads every record and field) and the table's create, edit or delete privilege and the written fields' modify rights before the first read. The changes themselves go through Store.create, update and delete with the account's privileges, so every record rule and audit entry applies there. |
| `packages/server/src/pgwrite.ts` / `returningColumns` | SQL | Describes the columns RETURNING gives back (names and declared types only, no rows) for the account's own table. |
| `packages/store/src/store.ts` / `Store/selectIn` | CORE | Reads through Store.select, or, for the caller that holds the file's open transaction, through the connection holding it. No account gate here: the PostgreSQL connection checks fmxdbc and reads-everything before it calls. |
| `packages/store/src/store.ts` / `Store/selectHeldCurrent` | CORE | The same query screening as Store.select (readOnlyChecked), run on the writable connection so a transaction sees its own uncommitted changes. Only text that passed the read-only screening reaches that connection. |

<!-- generated read-gate inventory -->
| Function | Store read / capability (source lines) | Gate |
| --- | --- | --- |
| [packages/cli/src/diagnostics.ts:205](../../packages/cli/src/diagnostics.ts#L205) `designCopy` | `SQLite.all` (205); `SQLite.prepare` (205, 208) | OPERATOR |
| [packages/cli/src/diagnostics.ts:445](../../packages/cli/src/diagnostics.ts#L445) `diagnostics` | `SQLite.get` (445); `SQLite.prepare` (445, 449); `SQLite.all` (449) | OPERATOR |
| [packages/cli/src/doctor.ts:140](../../packages/cli/src/doctor.ts#L140) `accountChecks` | `SQLite.all` (140); `SQLite.prepare` (140) | OPERATOR |
| [packages/cli/src/main.ts:735](../../packages/cli/src/main.ts#L735) `accountsWithPasswordOff` | `SQLite.all` (735); `SQLite.prepare` (735) | OPERATOR |
| [packages/cli/src/main.ts:764](../../packages/cli/src/main.ts#L764) `hostedRead` | `SQLite.all` (764, 767); `SQLite.prepare` (764, 767); `Store.sql` (764, 767) | OPERATOR |
| [packages/cli/src/main.ts:2474](../../packages/cli/src/main.ts#L2474) `main` | `Store.orphanContainerReport` (2474); `Store.auditLog` (2948); `SQLite.get` (3210); `SQLite.prepare` (3210) | OPERATOR |
| [packages/scripts/src/data-api-step.ts:104](../../packages/scripts/src/data-api-step.ts#L104) `respond` | `Store.get` (104, 131, 140); `Store.find` (105, 117) | SCRIPT |
| [packages/scripts/src/engine.ts:9441](../../packages/scripts/src/engine.ts#L9441) `clearRecords` | `SQLite.all` (9441); `SQLite.prepare` (9441) | SCRIPT |
| [packages/scripts/src/engine.ts:8211](../../packages/scripts/src/engine.ts#L8211) `ScriptEngine/containerFile` | `Store.get` (8211); `Store.containerId` (8212); `Store.container` (8213) | SCRIPT |
| [packages/scripts/src/engine.ts:5772](../../packages/scripts/src/engine.ts#L5772) `ScriptEngine/design` | `Store.valueListItems` (5772) | SCRIPT |
| [packages/scripts/src/engine.ts:6528](../../packages/scripts/src/engine.ts#L6528) `ScriptEngine/exportField` | `Store.get` (6528); `Store.containerId` (6529); `Store.container` (6531) | SCRIPT |
| [packages/scripts/src/engine.ts:8631](../../packages/scripts/src/engine.ts#L8631) `ScriptEngine/fileMakerRows` | `Store.findIds` (8631); `Store.get` (8636) | SCRIPT |
| [packages/scripts/src/engine.ts:3396](../../packages/scripts/src/engine.ts#L3396) `ScriptEngine/findIdsCooperative` | `Store.findIdsProgress` (3396) | SCRIPT |
| [packages/scripts/src/engine.ts:2363](../../packages/scripts/src/engine.ts#L2363) `ScriptEngine/foundSet` | `Store.findIds` (2363) | SCRIPT |
| [packages/scripts/src/engine.ts:5612](../../packages/scripts/src/engine.ts#L5612) `ScriptEngine/get` | `Store.findIds` (5612); `Store.canViewRecord` (5705); `Store.get` (5741) | SCRIPT |
| [packages/scripts/src/engine.ts:2017](../../packages/scripts/src/engine.ts#L2017) `ScriptEngine/goToLayout` | `Store.findIds` (2017) | SCRIPT |
| [packages/scripts/src/engine.ts:8402](../../packages/scripts/src/engine.ts#L8402) `ScriptEngine/importRecords` | `Store.get` (8402) | SCRIPT |
| [packages/scripts/src/engine.ts:5884](../../packages/scripts/src/engine.ts#L5884) `ScriptEngine/lookupNext` | `Store.get` (5884); `Store.row` (5885); `Calculations.context` (5887) | SCRIPT |
| [packages/scripts/src/engine.ts:5415](../../packages/scripts/src/engine.ts#L5415) `ScriptEngine/newCalcContext/executeSQL` | `Calculations.executeSQL` (5415) | SCRIPT |
| [packages/scripts/src/engine.ts:5423](../../packages/scripts/src/engine.ts#L5423) `ScriptEngine/newCalcContext/persistentData` | `Store.persistentData` (5423) | SCRIPT |
| [packages/scripts/src/engine.ts:5424](../../packages/scripts/src/engine.ts#L5424) `ScriptEngine/newCalcContext/persistentDataIds` | `Store.persistentDataIds` (5424) | SCRIPT |
| [packages/scripts/src/engine.ts:8671](../../packages/scripts/src/engine.ts#L8671) `ScriptEngine/newRecord` | `Store.findIds` (8671) | SCRIPT |
| [packages/scripts/src/engine.ts:9049](../../packages/scripts/src/engine.ts#L9049) `ScriptEngine/quickFind` | `Store.get` (9049) | SCRIPT |
| [packages/scripts/src/engine.ts:5826](../../packages/scripts/src/engine.ts#L5826) `ScriptEngine/record` | `Store.get` (5826) | SCRIPT |
| [packages/scripts/src/engine.ts:5987](../../packages/scripts/src/engine.ts#L5987) `ScriptEngine/relatedIds` | `Store.findIds` (5987); `rowsById` (5995); `Store.select` (5999); `Store.matchIds` (6013); `Store.viewableIds` (6036) | SCRIPT |
| [packages/scripts/src/engine.ts:6021](../../packages/scripts/src/engine.ts#L6021) `ScriptEngine/relatedIds/matching` | `Store.matchIds` (6021) | SCRIPT |
| [packages/scripts/src/engine.ts:6682](../../packages/scripts/src/engine.ts#L6682) `ScriptEngine/relookup` | `Store.get` (6682) | SCRIPT |
| [packages/scripts/src/engine.ts:3552](../../packages/scripts/src/engine.ts#L3552) `ScriptEngine/revertTransaction` | `Store.findIds` (3552) | SCRIPT |
| [packages/scripts/src/engine.ts:3410](../../packages/scripts/src/engine.ts#L3410) `ScriptEngine/sortIdsCooperative` | `Store.sortIdsProgress` (3410) | SCRIPT |
| [packages/scripts/src/engine.ts:3438](../../packages/scripts/src/engine.ts#L3438) `ScriptEngine/sortIdsProgress` | `Store.sortIdsProgress` (3438); `Store.valueListItems` (3444) | SCRIPT |
| [packages/scripts/src/engine.ts:7464](../../packages/scripts/src/engine.ts#L7464) `ScriptEngine/sourceValue` | `Store.get` (7464); `Store.containerId` (7465); `Store.container` (7466) | SCRIPT |
| [packages/scripts/src/engine.ts:3347](../../packages/scripts/src/engine.ts#L3347) `ScriptEngine/sqlByNaturalLanguage` | `Calculations.translateSQL` (3347); `Calculations.executeSQL` (3354) | SCRIPT |
| [packages/scripts/src/engine.ts:4140](../../packages/scripts/src/engine.ts#L4140) `ScriptEngine/step` | `Store.fieldIndex` (4140) | SCRIPT |
| [packages/scripts/src/engine.ts:5859](../../packages/scripts/src/engine.ts#L5859) `ScriptEngine/valueOf` | `Store.findIds` (5859, 5859); `Store.containerId` (5867) | SCRIPT |
| [packages/scripts/src/recorder.ts:83](../../packages/scripts/src/recorder.ts#L83) `lastSeq` | `Store.auditLog` (83) | DESIGN |
| [packages/scripts/src/recorder.ts:121](../../packages/scripts/src/recorder.ts#L121) `recordRun` | `Store.auditLog` (121) | DESIGN |
| [packages/scripts/src/script-tests.ts:213](../../packages/scripts/src/script-tests.ts#L213) `runCase` | `Store.findIds` (213); `Store.auditLog` (220, 221, 265); `Store.evaluateEach` (248) | DESIGN |
| [packages/scripts/src/testrun.ts:306](../../packages/scripts/src/testrun.ts#L306) `recordWith` | `Store.evaluateEach` (306) | DESIGN |
| [packages/scripts/src/testrun.ts:199](../../packages/scripts/src/testrun.ts#L199) `seedSelections` | `Calculations.globalValue` (199); `Store.find` (204) | DESIGN |
| [packages/scripts/src/testrun.ts:338](../../packages/scripts/src/testrun.ts#L338) `testRun` | `Store.evaluateEach` (338) | DESIGN |
| [packages/scripts/src/testrun.ts:270](../../packages/scripts/src/testrun.ts#L270) `testScript` | `Store.findIds` (270) | DESIGN |
| [packages/server/src/admin.ts:2463](../../packages/server/src/admin.ts#L2463) `Admin/audit` | `Store.auditLog` (2463) | ADMIN |
| [packages/server/src/admin.ts:1168](../../packages/server/src/admin.ts#L1168) `Admin/handle` | `Store.externalContainerReport` (1168); `Store.orphanContainerReport` (1173, 1177) | ADMIN |
| [packages/server/src/admin.ts:2903](../../packages/server/src/admin.ts#L2903) `Admin/status` | `Store.externalContainerCount` (2903) | ADMIN |
| [packages/server/src/admin.ts:2546](../../packages/server/src/admin.ts#L2546) `Admin/viewAs` | `Store.find` (2546) | ADMIN |
| [packages/server/src/agent.ts:319](../../packages/server/src/agent.ts#L319) `dryRunPlan` | `Store.findIds` (319) | DESIGN |
| [packages/server/src/agent.ts:342](../../packages/server/src/agent.ts#L342) `runApprovedStep` | `Store.findIds` (342) | DESIGN |
| [packages/server/src/agent.ts:163](../../packages/server/src/agent.ts#L163) `runStep` | `Store.findIds` (163); `Store.auditLog` (232); `Store.canViewRecord` (244) | DESIGN |
| [packages/server/src/agent.ts:155](../../packages/server/src/agent.ts#L155) `runStep/visible` | `Store.findIds` (155) | DESIGN |
| [packages/server/src/ai-output.ts:147](../../packages/server/src/ai-output.ts#L147) `storedSecretValues` | `Calculations.globalValue` (147); `Store.select` (152) | REDACTION |
| [packages/server/src/ai-policy-sql.ts:49](../../packages/server/src/ai-policy-sql.ts#L49) `sqlFieldRefs` | `SQLite.all` (49, 51); `SQLite.prepare` (49, 51) | POLICY |
| [packages/server/src/ai-policy.ts:355](../../packages/server/src/ai-policy.ts#L355) `sql` | `Store.inspectQuery` (355) | POLICY |
| [packages/server/src/ai-usage.ts:201](../../packages/server/src/ai-usage.ts#L201) `AiUsage/add` | `SQLite.prepare` (201, 204) | AUTH |
| [packages/server/src/ai-usage.ts:250](../../packages/server/src/ai-usage.ts#L250) `AiUsage/importOld` | `SQLite.prepare` (250, 260, 268, 272) | AUTH |
| [packages/server/src/ai-usage.ts:186](../../packages/server/src/ai-usage.ts#L186) `AiUsage/month` | `SQLite.get` (186); `SQLite.prepare` (186) | AUTH |
| [packages/server/src/ai-usage.ts:212](../../packages/server/src/ai-usage.ts#L212) `AiUsage/question` | `SQLite.prepare` (212, 214, 215, 217) | AUTH |
| [packages/server/src/ai-usage.ts:193](../../packages/server/src/ai-usage.ts#L193) `AiUsage/recent` | `SQLite.all` (193); `SQLite.prepare` (193) | AUTH |
| [packages/server/src/ai-usage.ts:179](../../packages/server/src/ai-usage.ts#L179) `AiUsage/today` | `SQLite.get` (179); `SQLite.prepare` (179) | AUTH |
| [packages/server/src/assistant.ts:2159](../../packages/server/src/assistant.ts#L2159) `Assistant/answer` | `Store.find` (2159) | ACCOUNT |
| [packages/server/src/automations.ts:436](../../packages/server/src/automations.ts#L436) `AutomationRunner/changed` | `Store.auditLog` (436) | AUTOMATION |
| [packages/server/src/automations.ts:467](../../packages/server/src/automations.ts#L467) `AutomationRunner/run` | `Store.select` (467); `Store.canViewRecord` (477); `Store.evaluateEach` (480); `Store.evaluate` (486) | AUTOMATION |
| [packages/server/src/automations.ts:513](../../packages/server/src/automations.ts#L513) `AutomationRunner/runDeleted` | `Store.auditLog` (513) | AUTOMATION |
| [packages/server/src/automations.ts:308](../../packages/server/src/automations.ts#L308) `dryRunAutomation` | `Store.canViewRecord` (308); `Store.findIds` (308); `Store.auditLog` (324, 352, 360); `Store.select` (337); `Store.evaluate` (353) | AUTOMATION |
| [packages/server/src/automations.ts:307](../../packages/server/src/automations.ts#L307) `dryRunAutomation/truth` | `Store.evaluateEach` (307) | AUTOMATION |
| [packages/server/src/automations.ts:195](../../packages/server/src/automations.ts#L195) `Saved/delete` | `SQLite.prepare` (195, 197); `Store.sql` (195, 197) | AUTOMATION |
| [packages/server/src/automations.ts:179](../../packages/server/src/automations.ts#L179) `Saved/list` | `SQLite.all` (179); `SQLite.prepare` (179); `Store.sql` (179) | AUTOMATION |
| [packages/server/src/automations.ts:202](../../packages/server/src/automations.ts#L202) `Saved/logRun` | `SQLite.prepare` (202, 204); `Store.sql` (202, 204) | AUTOMATION |
| [packages/server/src/automations.ts:209](../../packages/server/src/automations.ts#L209) `Saved/runs` | `SQLite.all` (209); `SQLite.prepare` (209); `Store.sql` (209) | AUTOMATION |
| [packages/server/src/automations.ts:189](../../packages/server/src/automations.ts#L189) `Saved/save` | `SQLite.prepare` (189); `Store.sql` (189) | AUTOMATION |
| [packages/server/src/automations.ts:168](../../packages/server/src/automations.ts#L168) `Saved/table` | `Store.sql` (168, 169) | AUTOMATION |
| [packages/server/src/backup-verify.ts:152](../../packages/server/src/backup-verify.ts#L152) `testRestore` | `Store.recordCount` (152) | OPERATOR |
| [packages/server/src/backup.ts:1140](../../packages/server/src/backup.ts#L1140) `accountDifferences/read` | `SQLite.all` (1140, 1142); `SQLite.prepare` (1140, 1142) | OPERATOR |
| [packages/server/src/backup.ts:1253](../../packages/server/src/backup.ts#L1253) `columnInfo` | `SQLite.all` (1253); `SQLite.prepare` (1253) | OPERATOR |
| [packages/server/src/backup.ts:1197](../../packages/server/src/backup.ts#L1197) `credentialsReadable` | `SQLite.all` (1197); `SQLite.prepare` (1197) | OPERATOR |
| [packages/server/src/backup.ts:1167](../../packages/server/src/backup.ts#L1167) `readNames` | `SQLite.all` (1167); `SQLite.prepare` (1167) | OPERATOR |
| [packages/server/src/backup.ts:1288](../../packages/server/src/backup.ts#L1288) `reconcileCredentials` | `SQLite.all` (1288, 1310, 1325, 1335, 1341); `SQLite.prepare` (1288, 1296, 1310, 1312, 1325, 1326, 1333, 1335, 1336, 1341, 1342, 1346, 1347, 1348); `SQLite.get` (1296, 1346) | OPERATOR |
| [packages/server/src/backup.ts:1315](../../packages/server/src/backup.ts#L1315) `reconcileCredentials/accountColumns` | `SQLite.all` (1315); `SQLite.prepare` (1315) | OPERATOR |
| [packages/server/src/backup.ts:1291](../../packages/server/src/backup.ts#L1291) `reconcileCredentials/has` | `SQLite.all` (1291); `SQLite.prepare` (1291) | OPERATOR |
| [packages/server/src/backup.ts:1224](../../packages/server/src/backup.ts#L1224) `retainCurrentRecordIdMarks` | `SQLite.prepare` (1224, 1235, 1236, 1237); `SQLite.all` (1226, 1236); `SQLite.get` (1235) | OPERATOR |
| [packages/server/src/backup.ts:1463](../../packages/server/src/backup.ts#L1463) `stageRestorePoint` | `SQLite.get` (1463, 1465, 1466); `SQLite.prepare` (1463, 1465, 1466) | OPERATOR |
| [packages/server/src/calendar.ts:389](../../packages/server/src/calendar.ts#L389) `CalendarFeeds/feed` | `Store.find` (389) | CALENDAR |
| [packages/server/src/changes.ts:195](../../packages/server/src/changes.ts#L195) `ChangeFeed/visible` | `Store.canViewRecord` (195) | CHANGE |
| [packages/server/src/cleanup.ts:747](../../packages/server/src/cleanup.ts#L747) `applyCleanup/apply` | `Store.findIds` (747, 757); `SQLite.all` (748); `SQLite.prepare` (748, 785); `Store.sql` (748, 785); `SQLite.get` (785) | CLEANUP |
| [packages/server/src/cleanup.ts:1051](../../packages/server/src/cleanup.ts#L1051) `CleanupJournal/add` | `SQLite.prepare` (1051); `Store.sql` (1051) | CLEANUP |
| [packages/server/src/cleanup.ts:1046](../../packages/server/src/cleanup.ts#L1046) `CleanupJournal/append` | `SQLite.prepare` (1046); `Store.sql` (1046) | CLEANUP |
| [packages/server/src/cleanup.ts:1037](../../packages/server/src/cleanup.ts#L1037) `CleanupJournal/constructor` | `Store.sql` (1037) | CLEANUP |
| [packages/server/src/cleanup.ts:1057](../../packages/server/src/cleanup.ts#L1057) `CleanupJournal/get` | `SQLite.get` (1057); `SQLite.prepare` (1057); `Store.sql` (1057) | CLEANUP |
| [packages/server/src/cleanup.ts:1062](../../packages/server/src/cleanup.ts#L1062) `CleanupJournal/list` | `SQLite.all` (1062); `SQLite.prepare` (1062); `Store.sql` (1062) | CLEANUP |
| [packages/server/src/cleanup.ts:1066](../../packages/server/src/cleanup.ts#L1066) `CleanupJournal/markUndone` | `SQLite.prepare` (1066); `Store.sql` (1066) | CLEANUP |
| [packages/server/src/cleanup.ts:523](../../packages/server/src/cleanup.ts#L523) `findDuplicates` | `Store.findIds` (523) | CLEANUP |
| [packages/server/src/cleanup.ts:885](../../packages/server/src/cleanup.ts#L885) `journalDeletes` | `SQLite.get` (885); `SQLite.prepare` (885); `Store.sql` (885) | CLEANUP |
| [packages/server/src/cleanup.ts:617](../../packages/server/src/cleanup.ts#L617) `keyValue` | `SQLite.get` (617); `SQLite.prepare` (617); `Store.sql` (617) | CLEANUP |
| [packages/server/src/cleanup.ts:621](../../packages/server/src/cleanup.ts#L621) `relatedIds` | `SQLite.all` (621); `SQLite.prepare` (621); `Store.sql` (621) | CLEANUP |
| [packages/server/src/cleanup.ts:327](../../packages/server/src/cleanup.ts#L327) `scanData` | `Store.findIds` (327); `Store.select` (333) | CLEANUP |
| [packages/server/src/cleanup.ts:816](../../packages/server/src/cleanup.ts#L816) `snapshotField` | `SQLite.all` (816); `SQLite.prepare` (816); `Store.sql` (816) | CLEANUP |
| [packages/server/src/cleanup.ts:876](../../packages/server/src/cleanup.ts#L876) `snapshotRows` | `SQLite.all` (876); `SQLite.prepare` (876); `Store.sql` (876) | CLEANUP |
| [packages/server/src/cleanup.ts:997](../../packages/server/src/cleanup.ts#L997) `undoCleanup` | `SQLite.get` (997, 1013); `SQLite.prepare` (997, 1013); `Store.sql` (997, 1013) | CLEANUP |
| [packages/server/src/cleanup.ts:935](../../packages/server/src/cleanup.ts#L935) `updateMany` | `Store.findIds` (935) | CLEANUP |
| [packages/server/src/compaction.ts:65](../../packages/server/src/compaction.ts#L65) `compactStore` | `SQLite.get` (65, 66, 80, 88); `SQLite.prepare` (65, 66, 80, 88) | OPERATOR |
| [packages/server/src/compare.ts:206](../../packages/server/src/compare.ts#L206) `count` | `Store.query` (206) | DESIGN |
| [packages/server/src/containers.ts:301](../../packages/server/src/containers.ts#L301) `ContainerFiles/make` | `Store.containerInfo` (301) | CONTAINER |
| [packages/server/src/containers.ts:313](../../packages/server/src/containers.ts#L313) `ContainerFiles/makeAdmitted` | `Store.container` (313) | CONTAINER |
| [packages/server/src/containers.ts:134](../../packages/server/src/containers.ts#L134) `ContainerFiles/send` | `Store.containerInfo` (134); `Store.container` (200); `Store.containerRange` (209) | CONTAINER |
| [packages/server/src/conversion-guide.ts:428](../../packages/server/src/conversion-guide.ts#L428) `ConversionGuides/save` | `SQLite.prepare` (428); `Store.sql` (428) | DESIGN |
| [packages/server/src/conversion-guide.ts:419](../../packages/server/src/conversion-guide.ts#L419) `ConversionGuides/saved` | `SQLite.get` (419); `SQLite.prepare` (419); `Store.sql` (419) | DESIGN |
| [packages/server/src/conversion-guide.ts:409](../../packages/server/src/conversion-guide.ts#L409) `ConversionGuides/table` | `Store.sql` (409) | DESIGN |
| [packages/server/src/conversion-guide.ts:138](../../packages/server/src/conversion-guide.ts#L138) `convertedAt` | `SQLite.get` (138); `SQLite.prepare` (138); `Store.sql` (138) | DESIGN |
| [packages/server/src/conversion.ts:376](../../packages/server/src/conversion.ts#L376) `conversionReport` | `Store.externalContainerCheck` (376) | DESIGN |
| [packages/server/src/cwp-xml.ts:541](../../packages/server/src/cwp-xml.ts#L541) `CwpXmlEndpoint/layoutDoc` | `Store.valueListItems` (541) | XML |
| [packages/server/src/cwp-xml.ts:457](../../packages/server/src/cwp-xml.ts#L457) `CwpXmlEndpoint/records` | `Store.find` (457, 459, 460, 466, 469); `Store.get` (465, 473) | XML |
| [packages/server/src/dashboards.ts:389](../../packages/server/src/dashboards.ts#L389) `Dashboards/create` | `SQLite.prepare` (389); `Store.sql` (389) | DASHBOARD |
| [packages/server/src/dashboards.ts:409](../../packages/server/src/dashboards.ts#L409) `Dashboards/delete` | `SQLite.prepare` (409); `Store.sql` (409) | DASHBOARD |
| [packages/server/src/dashboards.ts:375](../../packages/server/src/dashboards.ts#L375) `Dashboards/get` | `SQLite.get` (375); `SQLite.prepare` (375); `Store.sql` (375) | DASHBOARD |
| [packages/server/src/dashboards.ts:369](../../packages/server/src/dashboards.ts#L369) `Dashboards/list` | `SQLite.all` (369); `SQLite.prepare` (369); `Store.sql` (369) | DASHBOARD |
| [packages/server/src/dashboards.ts:359](../../packages/server/src/dashboards.ts#L359) `Dashboards/table` | `Store.sql` (359) | DASHBOARD |
| [packages/server/src/dashboards.ts:402](../../packages/server/src/dashboards.ts#L402) `Dashboards/update` | `SQLite.prepare` (402); `Store.sql` (402) | DASHBOARD |
| [packages/server/src/dataapi.ts:2099](../../packages/server/src/dataapi.ts#L2099) `DataApi/route` | `Store.get` (2099, 2320, 2321, 2344, 2352, 2399, 2423, 2443, 2480); `Store.valueListItems` (2114); `Store.find` (2275, 2323, 2514); `Store.findIds` (2279, 2519); `Store.query` (2519) | REST |
| [packages/server/src/dataapi.ts:2227](../../packages/server/src/dataapi.ts#L2227) `DataApi/route/recordOut` | `Store.portalCounts` (2227) | REST |
| [packages/server/src/dataapi.ts:2263](../../packages/server/src/dataapi.ts#L2263) `DataApi/route/shownAs` | `Store.get` (2263) | REST |
| [packages/server/src/debug.ts:345](../../packages/server/src/debug.ts#L345) `DebugApi/handle` | `Store.row` (345, 474); `Store.get` (354, 479); `Store.evaluate` (378) | DESIGN |
| [packages/server/src/debug.ts:194](../../packages/server/src/debug.ts#L194) `learnStoredCredentials` | `Calculations.globalValue` (194); `Store.sql` (200, 210, 210); `SQLite.iterate` (210, 210); `SQLite.prepare` (210, 210); `Store.iterateCommitted` (210) | DESIGN |
| [packages/server/src/design.ts:234](../../packages/server/src/design.ts#L234) `containerData` | `Store.query` (234) | DESIGN |
| [packages/server/src/design.ts:731](../../packages/server/src/design.ts#L731) `DesignApi/handle` | `Store.auditLog` (731); `Store.evaluate` (798) | DESIGN |
| [packages/server/src/design.ts:243](../../packages/server/src/design.ts#L243) `recordCount` | `Store.query` (243) | DESIGN |
| [packages/server/src/digests.ts:231](../../packages/server/src/digests.ts#L231) `Digests/addRun` | `SQLite.prepare` (231, 232); `Store.sql` (231, 232) | DIGEST |
| [packages/server/src/digests.ts:208](../../packages/server/src/digests.ts#L208) `Digests/create` | `SQLite.prepare` (208); `Store.sql` (208) | DIGEST |
| [packages/server/src/digests.ts:225](../../packages/server/src/digests.ts#L225) `Digests/delete` | `SQLite.prepare` (225, 226); `Store.sql` (225, 226) | DIGEST |
| [packages/server/src/digests.ts:189](../../packages/server/src/digests.ts#L189) `Digests/get` | `SQLite.get` (189); `SQLite.prepare` (189); `Store.sql` (189) | DIGEST |
| [packages/server/src/digests.ts:196](../../packages/server/src/digests.ts#L196) `Digests/lastSlot` | `SQLite.get` (196); `SQLite.prepare` (196); `Store.sql` (196) | DIGEST |
| [packages/server/src/digests.ts:183](../../packages/server/src/digests.ts#L183) `Digests/list` | `SQLite.all` (183); `SQLite.prepare` (183); `Store.sql` (183) | DIGEST |
| [packages/server/src/digests.ts:200](../../packages/server/src/digests.ts#L200) `Digests/markSlot` | `SQLite.prepare` (200); `Store.sql` (200) | DIGEST |
| [packages/server/src/digests.ts:238](../../packages/server/src/digests.ts#L238) `Digests/runs` | `SQLite.all` (238); `SQLite.prepare` (238); `Store.sql` (238) | DIGEST |
| [packages/server/src/digests.ts:172](../../packages/server/src/digests.ts#L172) `Digests/table` | `Store.sql` (172) | DIGEST |
| [packages/server/src/digests.ts:217](../../packages/server/src/digests.ts#L217) `Digests/update` | `SQLite.prepare` (217); `Store.sql` (217) | DIGEST |
| [packages/server/src/docs.ts:157](../../packages/server/src/docs.ts#L157) `count` | `Store.query` (157) | DESIGN |
| [packages/server/src/dry-run.ts:92](../../packages/server/src/dry-run.ts#L92) `dryRunChanges/runOnce` | `Store.auditLog` (92, 96) | DESIGN |
| [packages/server/src/find-advice.ts:99](../../packages/server/src/find-advice.ts#L99) `findAdvice` | `Store.recordCount` (99) | DESIGN |
| [packages/server/src/formula-preview.ts:31](../../packages/server/src/formula-preview.ts#L31) `previewFormula` | `Store.findIds` (31); `Store.evaluate` (42) | DESIGN |
| [packages/server/src/hosted-record.ts:219](../../packages/server/src/hosted-record.ts#L219) `approveRestoredFiles` | `SQLite.get` (219); `SQLite.prepare` (219, 223) | OPERATOR |
| [packages/server/src/hosted-record.ts:112](../../packages/server/src/hosted-record.ts#L112) `markStore` | `SQLite.get` (112); `SQLite.prepare` (112, 116) | OPERATOR |
| [packages/server/src/hosted-record.ts:71](../../packages/server/src/hosted-record.ts#L71) `peekInstance` | `SQLite.get` (71); `SQLite.prepare` (71) | OPERATOR |
| [packages/server/src/import-mapping.ts:1024](../../packages/server/src/import-mapping.ts#L1024) `applyImportAddStream` | `SQLite.prepare` (1024); `Store.sql` (1024) | IMPORT |
| [packages/server/src/import-mapping.ts:785](../../packages/server/src/import-mapping.ts#L785) `applyImportRun` | `SQLite.prepare` (785); `Store.sql` (785) | IMPORT |
| [packages/server/src/import-mapping.ts:505](../../packages/server/src/import-mapping.ts#L505) `existingKeys` | `Store.viewableIds` (505); `Store.query` (507) | IMPORT |
| [packages/server/src/import-mapping.ts:829](../../packages/server/src/import-mapping.ts#L829) `fileIdentity` | `Store.sql` (829, 830, 831); `SQLite.prepare` (830, 831); `SQLite.get` (831) | IMPORT |
| [packages/server/src/import-mapping.ts:888](../../packages/server/src/import-mapping.ts#L888) `importHistory` | `SQLite.iterate` (888); `SQLite.prepare` (888); `Store.sql` (888) | IMPORT |
| [packages/server/src/import-mapping.ts:817](../../packages/server/src/import-mapping.ts#L817) `journal` | `Store.sql` (817, 820, 821, 822, 823, 824); `SQLite.all` (820); `SQLite.prepare` (820) | IMPORT |
| [packages/server/src/import-mapping.ts:805](../../packages/server/src/import-mapping.ts#L805) `targetKeys` | `SQLite.all` (805); `SQLite.prepare` (805); `Store.sql` (805) | IMPORT |
| [packages/server/src/import-mapping.ts:910](../../packages/server/src/import-mapping.ts#L910) `undoImportRun` | `SQLite.get` (910, 942); `SQLite.prepare` (910, 942, 956); `Store.sql` (910, 942, 956) | IMPORT |
| [packages/server/src/inbound-hooks.ts:297](../../packages/server/src/inbound-hooks.ts#L297) `InboundHooks/claim` | `SQLite.get` (297, 305, 306); `SQLite.prepare` (297, 301, 302, 305, 306, 308) | AUTH |
| [packages/server/src/insight.ts:1025](../../packages/server/src/insight.ts#L1025) `checkCalculation` | `Store.findIds` (1025); `Store.evaluate` (1029) | DESIGN |
| [packages/server/src/insight.ts:946](../../packages/server/src/insight.ts#L946) `columnProfile` | `Store.query` (946, 953, 965, 968) | PROFILE |
| [packages/server/src/insight.ts:870](../../packages/server/src/insight.ts#L870) `layoutProfile` | `Store.query` (870) | PROFILE |
| [packages/server/src/insight.ts:866](../../packages/server/src/insight.ts#L866) `layoutProfile/viewableIds` | `Store.viewableIds` (866) | PROFILE |
| [packages/server/src/insight.ts:1208](../../packages/server/src/insight.ts#L1208) `solutionOverview/counts` | `Store.query` (1208) | DESIGN |
| [packages/server/src/insight.ts:396](../../packages/server/src/insight.ts#L396) `webViewerScripts` | `Store.query` (396) | DESIGN |
| [packages/server/src/integrity-check.ts:13](../../packages/server/src/integrity-check.ts#L13) `integrity` | `SQLite.all` (13); `SQLite.prepare` (13, 17); `SQLite.get` (17) | OPERATOR |
| [packages/server/src/integrity-check.ts:55](../../packages/server/src/integrity-check.ts#L55) `pageCheck` | `SQLite.all` (55); `SQLite.prepare` (55, 58); `SQLite.get` (58) | OPERATOR |
| [packages/server/src/live.ts:207](../../packages/server/src/live.ts#L207) `Live/handle` | `Store.canView` (207) | LIVE |
| [packages/server/src/live.ts:281](../../packages/server/src/live.ts#L281) `Live/visibleRecord` | `Store.canViewRecord` (281) | LIVE |
| [packages/server/src/logs.ts:79](../../packages/server/src/logs.ts#L79) `LogShipper/follow` | `SQLite.get` (79); `SQLite.prepare` (79); `Store.sql` (79, 80, 81, 82) | ADMIN |
| [packages/server/src/logs.ts:91](../../packages/server/src/logs.ts#L91) `LogShipper/releaseIfIdle` | `Store.sql` (91) | ADMIN |
| [packages/server/src/mcp-design.ts:510](../../packages/server/src/mcp-design.ts#L510) `registerDesignTools/audit_log` | `Store.auditLog` (510) | DESIGN |
| [packages/server/src/mcp.ts:1491](../../packages/server/src/mcp.ts#L1491) `createMcpServer/check_record` | `Store.get` (1491); `Store.row` (1493) | MCP |
| [packages/server/src/mcp.ts:1212](../../packages/server/src/mcp.ts#L1212) `createMcpServer/evaluate_calculation` | `Store.get` (1212, 1220); `Store.find` (1213); `Store.evaluate` (1214); `Store.row` (1219) | SQL |
| [packages/server/src/mcp.ts:1515](../../packages/server/src/mcp.ts#L1515) `createMcpServer/explain_related` | `Store.get` (1515) | MCP |
| [packages/server/src/mcp.ts:1468](../../packages/server/src/mcp.ts#L1468) `createMcpServer/explain_value` | `Store.get` (1468); `Store.row` (1469) | MCP |
| [packages/server/src/mcp.ts:1092](../../packages/server/src/mcp.ts#L1092) `createMcpServer/find_records` | `Store.find` (1092) | MCP |
| [packages/server/src/mcp.ts:1287](../../packages/server/src/mcp.ts#L1287) `createMcpServer/get_container` | `Store.container` (1287) | SQL |
| [packages/server/src/mcp.ts:1105](../../packages/server/src/mcp.ts#L1105) `createMcpServer/get_record` | `Store.get` (1105) | MCP |
| [packages/server/src/mcp.ts:1311](../../packages/server/src/mcp.ts#L1311) `createMcpServer/sql_query` | `Store.queryWithOrigins` (1311) | SQL |
| [packages/server/src/mcp.ts:1155](../../packages/server/src/mcp.ts#L1155) `createMcpServer/update_record` | `Store.get` (1155, 1159) | MCP |
| [packages/server/src/mcp.ts:2412](../../packages/server/src/mcp.ts#L2412) `registerResources/audit` | `Store.auditLog` (2412) | MCP |
| [packages/server/src/oauth.ts:86](../../packages/server/src/oauth.ts#L86) `legacyPasswordMark` | `SQLite.get` (86); `SQLite.prepare` (86); `Store.sql` (86) | AUTH |
| [packages/server/src/oauth.ts:899](../../packages/server/src/oauth.ts#L899) `OAuthServer/accessAllowed` | `SQLite.get` (899); `SQLite.prepare` (899) | AUTH |
| [packages/server/src/oauth.ts:517](../../packages/server/src/oauth.ts#L517) `OAuthServer/authorize` | `SQLite.get` (517); `SQLite.prepare` (517, 521, 523, 530, 561, 562) | AUTH |
| [packages/server/src/oauth.ts:498](../../packages/server/src/oauth.ts#L498) `OAuthServer/authorize/done` | `SQLite.prepare` (498, 499) | AUTH |
| [packages/server/src/oauth.ts:397](../../packages/server/src/oauth.ts#L397) `OAuthServer/client` | `SQLite.get` (397); `SQLite.prepare` (397) | AUTH |
| [packages/server/src/oauth.ts:201](../../packages/server/src/oauth.ts#L201) `OAuthServer/constructor` | `SQLite.all` (201); `SQLite.prepare` (201, 228, 230, 239, 240, 243); `SQLite.iterate` (228); `SQLite.get` (230); `Store.sql` (230, 239) | AUTH |
| [packages/server/src/oauth.ts:194](../../packages/server/src/oauth.ts#L194) `OAuthServer/constructor/cols` | `SQLite.all` (194); `SQLite.prepare` (194) | AUTH |
| [packages/server/src/oauth.ts:882](../../packages/server/src/oauth.ts#L882) `OAuthServer/endGrant` | `SQLite.prepare` (882, 883); `SQLite.all` (883) | AUTH |
| [packages/server/src/oauth.ts:838](../../packages/server/src/oauth.ts#L838) `OAuthServer/issue/write` | `SQLite.get` (838); `SQLite.prepare` (838, 839, 840) | AUTH |
| [packages/server/src/oauth.ts:895](../../packages/server/src/oauth.ts#L895) `OAuthServer/managedAccess` | `SQLite.get` (895); `SQLite.prepare` (895) | AUTH |
| [packages/server/src/oauth.ts:377](../../packages/server/src/oauth.ts#L377) `OAuthServer/register` | `SQLite.prepare` (377, 378, 379, 380, 381); `SQLite.get` (378, 380) | AUTH |
| [packages/server/src/oauth.ts:912](../../packages/server/src/oauth.ts#L912) `OAuthServer/revoke` | `SQLite.get` (912, 913, 925, 926); `SQLite.prepare` (912, 913, 919, 925, 926, 932) | AUTH |
| [packages/server/src/oauth.ts:858](../../packages/server/src/oauth.ts#L858) `OAuthServer/sweep` | `SQLite.all` (858); `SQLite.prepare` (858, 860, 861, 862, 863) | AUTH |
| [packages/server/src/oauth.ts:717](../../packages/server/src/oauth.ts#L717) `OAuthServer/token` | `SQLite.get` (717, 748, 750, 753, 766); `SQLite.prepare` (717, 748, 750, 753, 762, 765, 766, 766, 768, 770) | AUTH |
| [packages/server/src/oauth.ts:73](../../packages/server/src/oauth.ts#L73) `storedName` | `SQLite.get` (73); `SQLite.prepare` (73); `Store.sql` (73) | AUTH |
| [packages/server/src/odata-crossjoin-worker.ts:42](../../packages/server/src/odata-crossjoin-worker.ts#L42) `join` | `SQLite.prepare` (42, 51, 60, 75); `SQLite.get` (60); `SQLite.all` (75) | JOIN |
| [packages/server/src/odata.ts:1532](../../packages/server/src/odata.ts#L1532) `ODataEndpoint/applied` | `Store.selectIds` (1532); `SQLite.prepare` (1548, 1585, 1598, 1602); `Store.getMany` (1559); `SQLite.all` (1598); `SQLite.get` (1602) | ODATA |
| [packages/server/src/odata.ts:1652](../../packages/server/src/odata.ts#L1652) `ODataEndpoint/crossjoined` | `Store.selectIds` (1652); `Store.getMany` (1681, 1716) | ODATA |
| [packages/server/src/odata.ts:1752](../../packages/server/src/odata.ts#L1752) `ODataEndpoint/entity` | `Store.getMany` (1752) | ODATA |
| [packages/server/src/odata.ts:1411](../../packages/server/src/odata.ts#L1411) `ODataEndpoint/lambdaFor` | `Store.selectIds` (1411); `Store.row` (1420); `relatedIdList` (1421) | ODATA |
| [packages/server/src/odata.ts:1474](../../packages/server/src/odata.ts#L1474) `ODataEndpoint/list` | `Store.selectIds` (1474); `Store.getMany` (1479); `Store.computeValues` (1480); `Store.countIds` (1485) | ODATA |
| [packages/server/src/odata.ts:1851](../../packages/server/src/odata.ts#L1851) `ODataEndpoint/property` | `Store.containerId` (1851); `Store.container` (1857) | ODATA |
| [packages/server/src/odata.ts:1793](../../packages/server/src/odata.ts#L1793) `ODataEndpoint/relatedIds` | `Store.row` (1793); `relatedIdList` (1796, 1811); `Store.selectIds` (1800) | ODATA |
| [packages/server/src/odata.ts:1827](../../packages/server/src/odata.ts#L1827) `ODataEndpoint/relatedRecords` | `Store.getMany` (1827) | ODATA |
| [packages/server/src/odata.ts:1064](../../packages/server/src/odata.ts#L1064) `ODataEndpoint/resource` | `Store.countIds` (1064); `Store.get` (1109, 1116, 1205, 1233, 1240) | ODATA |
| [packages/server/src/odata.ts:1822](../../packages/server/src/odata.ts#L1822) `ODataEndpoint/viewableIn` | `Store.viewableSet` (1822) | ODATA |
| [packages/server/src/oidc.ts:469](../../packages/server/src/oidc.ts#L469) `Oidc/authorizeUrl` | `SQLite.prepare` (469, 472) | AUTH |
| [packages/server/src/oidc.ts:524](../../packages/server/src/oidc.ts#L524) `Oidc/callback` | `SQLite.get` (524); `SQLite.prepare` (524, 535, 539); `SQLite.all` (535) | AUTH |
| [packages/server/src/oidc.ts:216](../../packages/server/src/oidc.ts#L216) `Oidc/constructor` | `SQLite.all` (216, 227); `SQLite.prepare` (216, 227, 237, 238, 243, 243) | AUTH |
| [packages/server/src/oidc.ts:644](../../packages/server/src/oidc.ts#L644) `Oidc/finish` | `SQLite.prepare` (644, 645, 647); `SQLite.get` (645) | AUTH |
| [packages/server/src/oidc.ts:442](../../packages/server/src/oidc.ts#L442) `Oidc/makeRoom` | `SQLite.get` (442, 444, 446); `SQLite.prepare` (442, 443, 444, 446, 448); `SQLite.all` (443, 448) | AUTH |
| [packages/server/src/oidc.ts:384](../../packages/server/src/oidc.ts#L384) `Oidc/takeGrant` | `SQLite.all` (384); `SQLite.prepare` (384) | AUTH |
| [packages/server/src/optimization-containers.ts:78](../../packages/server/src/optimization-containers.ts#L78) `planContainerMove` | `Store.embeddedContainerCount` (78) | DESIGN |
| [packages/server/src/optimization-containers.ts:46](../../packages/server/src/optimization-containers.ts#L46) `read` | `SQLite.get` (46); `SQLite.prepare` (46); `Store.sql` (46) | DESIGN |
| [packages/server/src/optimization-containers.ts:147](../../packages/server/src/optimization-containers.ts#L147) `undoContainerMove` | `SQLite.prepare` (147); `Store.sql` (147); `SQLite.get` (148) | DESIGN |
| [packages/server/src/optimization-containers.ts:57](../../packages/server/src/optimization-containers.ts#L57) `write` | `SQLite.prepare` (57); `Store.sql` (57) | DESIGN |
| [packages/server/src/optimization-data.ts:61](../../packages/server/src/optimization-data.ts#L61) `dataFindings` | `Store.recordCount` (61) | DESIGN |
| [packages/server/src/optimization-data.ts:46](../../packages/server/src/optimization-data.ts#L46) `held` | `SQLite.get` (46); `SQLite.prepare` (46); `Store.sql` (46) | DESIGN |
| [packages/server/src/optimization-data.ts:113](../../packages/server/src/optimization-data.ts#L113) `layoutFindings` | `Store.recordCount` (113) | DESIGN |
| [packages/server/src/optimization-fix.ts:150](../../packages/server/src/optimization-fix.ts#L150) `history` | `SQLite.get` (150); `SQLite.prepare` (150); `Store.sql` (150) | DESIGN |
| [packages/server/src/optimization-fix.ts:154](../../packages/server/src/optimization-fix.ts#L154) `keep` | `SQLite.prepare` (154); `Store.sql` (154) | DESIGN |
| [packages/server/src/optimization-fix.ts:158](../../packages/server/src/optimization-fix.ts#L158) `withHistory` | `Store.sql` (158, 161, 164, 164) | DESIGN |
| [packages/server/src/optimization.ts:141](../../packages/server/src/optimization.ts#L141) `containerUse` | `SQLite.get` (141); `SQLite.prepare` (141); `Store.sql` (141) | DESIGN |
| [packages/server/src/optimization.ts:120](../../packages/server/src/optimization.ts#L120) `hasTable` | `SQLite.get` (120); `SQLite.prepare` (120); `Store.sql` (120) | DESIGN |
| [packages/server/src/optimization.ts:564](../../packages/server/src/optimization.ts#L564) `heldBytes` | `SQLite.get` (564); `SQLite.prepare` (564); `Store.sql` (564) | DESIGN |
| [packages/server/src/optimization.ts:269](../../packages/server/src/optimization.ts#L269) `oversizedPictures` | `SQLite.all` (269); `SQLite.prepare` (269); `Store.sql` (269) | DESIGN |
| [packages/server/src/optimization.ts:316](../../packages/server/src/optimization.ts#L316) `sizes` | `SQLite.all` (316); `SQLite.prepare` (316); `Store.sql` (316) | DESIGN |
| [packages/server/src/optimization.ts:312](../../packages/server/src/optimization.ts#L312) `sizes/one` | `SQLite.get` (312); `SQLite.prepare` (312); `Store.sql` (312) | DESIGN |
| [packages/server/src/optimization.ts:449](../../packages/server/src/optimization.ts#L449) `speedFindings` | `Store.recordCount` (449, 492, 510) | DESIGN |
| [packages/server/src/pgwire.ts:987](../../packages/server/src/pgwire.ts#L987) `Connection/bareNames` | `Store.describe` (987) | SQL |
| [packages/server/src/pgwire.ts:1003](../../packages/server/src/pgwire.ts#L1003) `Connection/catalog` | `Store.describeTyped` (1003) | SQL |
| [packages/server/src/pgwire.ts:1445](../../packages/server/src/pgwire.ts#L1445) `Connection/describe` | `Store.describeTyped` (1445) | SQL |
| [packages/server/src/pgwire.ts:1014](../../packages/server/src/pgwire.ts#L1014) `Connection/run` | `Store.selectIn` (1014); `Store.describeTyped` (1018) | SQL |
| [packages/server/src/pgwire.ts:964](../../packages/server/src/pgwire.ts#L964) `Connection/translate` | `Calculations.translateSQL` (964) | SQL |
| [packages/server/src/pgwire.ts:1212](../../packages/server/src/pgwire.ts#L1212) `Connection/validateSyntax` | `SQLite.prepare` (1212); `Store.sql` (1212) | SQL |
| [packages/server/src/pgwrite.ts:431](../../packages/server/src/pgwrite.ts#L431) `executeWrite/reader` | `Store.selectIn` (431) | SQL |
| [packages/server/src/pgwrite.ts:404](../../packages/server/src/pgwrite.ts#L404) `returningColumns` | `Store.describe` (404) | SQL |
| [packages/server/src/pii.ts:310](../../packages/server/src/pii.ts#L310) `forgetVault` | `Store.sql` (310) | REDACTION |
| [packages/server/src/pii.ts:124](../../packages/server/src/pii.ts#L124) `holdsOnlyUuids` | `Store.query` (124) | REDACTION |
| [packages/server/src/pii.ts:349](../../packages/server/src/pii.ts#L349) `PiiMasker/constructor` | `SQLite.get` (349); `SQLite.prepare` (349); `Store.sql` (349) | REDACTION |
| [packages/server/src/pii.ts:445](../../packages/server/src/pii.ts#L445) `PiiMasker/known` | `SQLite.iterate` (445); `SQLite.prepare` (445); `Store.sql` (445) | REDACTION |
| [packages/server/src/pii.ts:359](../../packages/server/src/pii.ts#L359) `PiiMasker/refresh` | `SQLite.iterate` (359); `SQLite.prepare` (359); `Store.sql` (359) | REDACTION |
| [packages/server/src/pii.ts:417](../../packages/server/src/pii.ts#L417) `PiiMasker/text` | `SQLite.get` (417); `SQLite.prepare` (417); `Store.sql` (417) | REDACTION |
| [packages/server/src/pii.ts:402](../../packages/server/src/pii.ts#L402) `PiiMasker/token` | `SQLite.prepare` (402, 403); `Store.sql` (402, 403); `SQLite.get` (403) | REDACTION |
| [packages/server/src/pii.ts:486](../../packages/server/src/pii.ts#L486) `PiiMasker/unmask` | `SQLite.get` (486); `SQLite.prepare` (486); `Store.sql` (486) | REDACTION |
| [packages/server/src/pii.ts:655](../../packages/server/src/pii.ts#L655) `piiPreview` | `Store.find` (655); `SQLite.prepare` (662); `Store.sql` (662) | REDACTION |
| [packages/server/src/pii.ts:136](../../packages/server/src/pii.ts#L136) `sampledValues` | `Store.query` (136) | REDACTION |
| [packages/server/src/pii.ts:301](../../packages/server/src/pii.ts#L301) `vaultTable` | `Store.sql` (301, 304) | REDACTION |
| [packages/server/src/privilege-review.ts:274](../../packages/server/src/privilege-review.ts#L274) `reviewPrivileges` | `Store.previewRecordRule` (274) | DESIGN |
| [packages/server/src/rag.ts:79](../../packages/server/src/rag.ts#L79) `RagStore/add` | `SQLite.prepare` (79, 86, 88, 89); `SQLite.get` (86) | RAG |
| [packages/server/src/rag.ts:138](../../packages/server/src/rag.ts#L138) `RagStore/hybridSearch` | `SQLite.prepare` (138, 143) | RAG |
| [packages/server/src/rag.ts:148](../../packages/server/src/rag.ts#L148) `RagStore/hybridSearch/candidates` | `SQLite.all` (148); `SQLite.iterate` (150) | RAG |
| [packages/server/src/rag.ts:61](../../packages/server/src/rag.ts#L61) `RagStore/info` | `SQLite.all` (61, 66); `SQLite.prepare` (61, 63) | RAG |
| [packages/server/src/rag.ts:224](../../packages/server/src/rag.ts#L224) `RagStore/load` | `SQLite.get` (224); `SQLite.prepare` (224, 231); `SQLite.iterate` (231) | RAG |
| [packages/server/src/rag.ts:276](../../packages/server/src/rag.ts#L276) `RagStore/remove` | `SQLite.prepare` (276, 278) | RAG |
| [packages/server/src/rag.ts:270](../../packages/server/src/rag.ts#L270) `RagStore/searchCached` | `SQLite.prepare` (270); `SQLite.get` (271) | RAG |
| [packages/server/src/rag.ts:186](../../packages/server/src/rag.ts#L186) `RagStore/searchSpace` | `SQLite.iterate` (186); `SQLite.prepare` (186) | RAG |
| [packages/server/src/rag.ts:105](../../packages/server/src/rag.ts#L105) `RagStore/sizes` | `SQLite.all` (105); `SQLite.prepare` (105) | RAG |
| [packages/server/src/rag.ts:56](../../packages/server/src/rag.ts#L56) `RagStore/spaces` | `SQLite.all` (56); `SQLite.prepare` (56) | RAG |
| [packages/server/src/rag.ts:208](../../packages/server/src/rag.ts#L208) `RagStore/version` | `SQLite.get` (208); `SQLite.prepare` (208) | RAG |
| [packages/server/src/record-context.ts:112](../../packages/server/src/record-context.ts#L112) `describeRecord` | `Store.row` (112); `Store.get` (121); `keyValue` (127); `Store.viewableIds` (165); `relatedRows` (169, 174) | RECORD |
| [packages/server/src/record-history.ts:101](../../packages/server/src/record-history.ts#L101) `recordHistory` | `Store.auditLog` (101, 154) | HISTORY |
| [packages/server/src/record-search.ts:61](../../packages/server/src/record-search.ts#L61) `searchRecords` | `Store.viewableIds` (61); `SQLite.all` (74); `SQLite.prepare` (74); `Store.sql` (74) | SEARCH |
| [packages/server/src/record-search.ts:104](../../packages/server/src/record-search.ts#L104) `searchRecords/snippet` | `SQLite.get` (104); `SQLite.prepare` (104); `Store.sql` (104) | SEARCH |
| [packages/server/src/record-search.ts:109](../../packages/server/src/record-search.ts#L109) `searchRecords/source` | `SQLite.get` (109); `SQLite.prepare` (109); `Store.sql` (109) | SEARCH |
| [packages/server/src/rule-suggestions.ts:57](../../packages/server/src/rule-suggestions.ts#L57) `suggestRules` | `Store.query` (57, 69, 86, 136, 138, 152, 153, 169) | DESIGN |
| [packages/server/src/scim.ts:292](../../packages/server/src/scim.ts#L292) `ScimDirectory/atomically` | `Store.sql` (292) | AUTH |
| [packages/server/src/scim.ts:404](../../packages/server/src/scim.ts#L404) `ScimDirectory/create/scim_user_create` | `SQLite.prepare` (404); `Store.sql` (404) | AUTH |
| [packages/server/src/scim.ts:331](../../packages/server/src/scim.ts#L331) `ScimDirectory/rebind` | `SQLite.prepare` (331); `Store.sql` (331) | AUTH |
| [packages/server/src/scim.ts:454](../../packages/server/src/scim.ts#L454) `ScimDirectory/remove/scim_user_remove` | `SQLite.prepare` (454); `Store.sql` (454) | AUTH |
| [packages/server/src/scim.ts:353](../../packages/server/src/scim.ts#L353) `ScimDirectory/revokePersonTokens` | `SQLite.all` (353); `SQLite.prepare` (353); `Store.sql` (353) | AUTH |
| [packages/server/src/scim.ts:226](../../packages/server/src/scim.ts#L226) `ScimDirectory/rows` | `SQLite.all` (226); `SQLite.prepare` (226, 231); `Store.sql` (226, 231) | AUTH |
| [packages/server/src/scim.ts:144](../../packages/server/src/scim.ts#L144) `ScimDirectory/save` | `SQLite.prepare` (144); `Store.sql` (144) | AUTH |
| [packages/server/src/scim.ts:255](../../packages/server/src/scim.ts#L255) `ScimDirectory/setMemberships` | `SQLite.prepare` (255); `Store.sql` (255) | AUTH |
| [packages/server/src/scim.ts:136](../../packages/server/src/scim.ts#L136) `ScimDirectory/settings` | `SQLite.get` (136); `SQLite.prepare` (136); `Store.sql` (136) | AUTH |
| [packages/server/src/scim.ts:123](../../packages/server/src/scim.ts#L123) `ScimDirectory/table` | `Store.sql` (123, 125); `SQLite.all` (125); `SQLite.prepare` (125) | AUTH |
| [packages/server/src/scim.ts:128](../../packages/server/src/scim.ts#L128) `ScimDirectory/table/scim_identity_column` | `SQLite.all` (128); `SQLite.prepare` (128); `Store.sql` (128, 129) | AUTH |
| [packages/server/src/scim.ts:427](../../packages/server/src/scim.ts#L427) `ScimDirectory/update/scim_user_update` | `SQLite.prepare` (427); `Store.sql` (427) | AUTH |
| [packages/server/src/script-failure.ts:212](../../packages/server/src/script-failure.ts#L212) `explainScriptFailure` | `Store.row` (212) | RECORD |
| [packages/server/src/security.ts:80](../../packages/server/src/security.ts#L80) `importApproximations` | `SQLite.all` (80); `SQLite.prepare` (80); `Store.sql` (80) | DESIGN |
| [packages/server/src/security.ts:217](../../packages/server/src/security.ts#L217) `SecurityApi/handle` | `Store.previewRecordRule` (217) | DESIGN |
| [packages/server/src/security.ts:116](../../packages/server/src/security.ts#L116) `securityOf` | `Store.pendingChanges` (116) | DESIGN |
| [packages/server/src/semantic-find.ts:52](../../packages/server/src/semantic-find.ts#L52) `semanticFind` | `Store.findIds` (52) | SEARCH |
| [packages/server/src/semantic-find.ts:108](../../packages/server/src/semantic-find.ts#L108) `vectorOf` | `Store.containerId` (108); `Store.containerInfo` (110); `Store.container` (112); `Store.get` (117) | SEARCH |
| [packages/server/src/sql.ts:103](../../packages/server/src/sql.ts#L103) `SqlEndpoint/handle` | `Calculations.translateSQL` (103); `Store.select` (110) | SQL |
| [packages/server/src/sql.ts:163](../../packages/server/src/sql.ts#L163) `SqlEndpoint/tables` | `SQLite.all` (163); `SQLite.prepare` (163); `Store.sql` (163) | SQL |
| [packages/server/src/standby.ts:419](../../packages/server/src/standby.ts#L419) `Standby/copy` | `SQLite.get` (419); `SQLite.prepare` (419) | OPERATOR |
| [packages/server/src/summarize.ts:184](../../packages/server/src/summarize.ts#L184) `summarizeByRecord` | `Store.evaluateEach` (184); `Store.row` (186) | SUMMARY |
| [packages/server/src/summarize.ts:69](../../packages/server/src/summarize.ts#L69) `summarizeRecords` | `Store.findIds` (69); `Store.select` (126, 133, 143) | SUMMARY |
| [packages/server/src/sync-console.ts:458](../../packages/server/src/sync-console.ts#L458) `SyncConsole/runCheck` | `Store.sql` (458) | DESIGN |
| [packages/server/src/sync-console.ts:463](../../packages/server/src/sync-console.ts#L463) `SyncConsole/runCheck/assertActive` | `Store.sql` (463) | DESIGN |
| [packages/server/src/warm-worker.ts:34](../../packages/server/src/warm-worker.ts#L34) `message` | `Store.find` (34) | INTERNAL |
| [packages/server/src/warm-worker.ts:19](../../packages/server/src/warm-worker.ts#L19) `message/count` | `Store.recordCount` (19) | INTERNAL |
| [packages/server/src/webclient.ts:2674](../../packages/server/src/webclient.ts#L2674) `foundIds` | `Store.findIds` (2674, 2676) | WEB |
| [packages/server/src/webclient.ts:2595](../../packages/server/src/webclient.ts#L2595) `listItems` | `Store.valueListItems` (2595) | WEB |
| [packages/server/src/webclient.ts:1708](../../packages/server/src/webclient.ts#L1708) `WebClient/aiReplace` | `Store.canView` (1708); `Store.getMany` (1724) | WEB |
| [packages/server/src/webclient.ts:1892](../../packages/server/src/webclient.ts#L1892) `WebClient/button` | `Store.findIds` (1892, 1942); `Store.evaluateEach` (1901, 1902) | WEB |
| [packages/server/src/webclient.ts:1294](../../packages/server/src/webclient.ts#L1294) `WebClient/charts` | `Calculations.context` (1294); `Store.canView` (1322); `Store.evaluateEach` (1331, 1335); `Store.evaluateRows` (1340, 1342) | WEB |
| [packages/server/src/webclient.ts:1285](../../packages/server/src/webclient.ts#L1285) `WebClient/charts/foundSet` | `Store.findIds` (1285) | WEB |
| [packages/server/src/webclient.ts:1325](../../packages/server/src/webclient.ts#L1325) `WebClient/charts/get` | `Store.get` (1325) | WEB |
| [packages/server/src/webclient.ts:694](../../packages/server/src/webclient.ts#L694) `WebClient/explain` | `Store.get` (694); `Store.row` (727, 740) | WEB |
| [packages/server/src/webclient.ts:1514](../../packages/server/src/webclient.ts#L1514) `WebClient/exportRecords` | `Store.getMany` (1514) | WEB |
| [packages/server/src/webclient.ts:1201](../../packages/server/src/webclient.ts#L1201) `WebClient/foundIds` | `Store.findIds` (1201) | WEB |
| [packages/server/src/webclient.ts:1245](../../packages/server/src/webclient.ts#L1245) `WebClient/foundSetPortal` | `Store.foundSetRows` (1245, 1252) | WEB |
| [packages/server/src/webclient.ts:1784](../../packages/server/src/webclient.ts#L1784) `WebClient/groups` | `Store.findIds` (1784); `Store.groupSummaries` (1790) | WEB |
| [packages/server/src/webclient.ts:555](../../packages/server/src/webclient.ts#L555) `WebClient/history` | `Store.get` (555) | WEB |
| [packages/server/src/webclient.ts:753](../../packages/server/src/webclient.ts#L753) `WebClient/index` | `Store.fieldIndex` (753) | WEB |
| [packages/server/src/webclient.ts:859](../../packages/server/src/webclient.ts#L859) `WebClient/menus` | `Store.evaluateEach` (859) | WEB |
| [packages/server/src/webclient.ts:1216](../../packages/server/src/webclient.ts#L1216) `WebClient/records` | `Store.getMany` (1216); `Store.find` (1219) | WEB |
| [packages/server/src/webclient.ts:1162](../../packages/server/src/webclient.ts#L1162) `WebClient/refresh` | `Store.previewRow` (1162); `Store.getMany` (1167); `Store.foundSetRows` (1189) | WEB |
| [packages/server/src/webclient.ts:1408](../../packages/server/src/webclient.ts#L1408) `WebClient/streamExportRecords/nextBatch` | `Store.selectIds` (1408); `Store.getMany` (1414) | WEB |
| [packages/server/src/webclient.ts:1076](../../packages/server/src/webclient.ts#L1076) `WebClient/view` | `Store.evaluateEach` (1076, 1100, 1119); `Store.canView` (1094); `Store.previewRow` (1098, 1120); `Store.get` (1111); `Store.row` (1112, 1112) | WEB |
| [packages/server/src/webclient.ts:1097](../../packages/server/src/webclient.ts#L1097) `WebClient/view/get` | `Store.get` (1097) | WEB |
| [packages/store/src/activity.ts:502](../../packages/store/src/activity.ts#L502) `SharedRecordLocks/acquire` | `SQLite.prepare` (502) | CORE |
| [packages/store/src/activity.ts:540](../../packages/store/src/activity.ts#L540) `SharedRecordLocks/all` | `SQLite.all` (540); `SQLite.prepare` (540) | CORE |
| [packages/store/src/activity.ts:444](../../packages/store/src/activity.ts#L444) `SharedRecordLocks/constructor` | `SQLite.get` (444); `SQLite.prepare` (444) | CORE |
| [packages/store/src/activity.ts:475](../../packages/store/src/activity.ts#L475) `SharedRecordLocks/count` | `SQLite.get` (475); `SQLite.prepare` (475) | CORE |
| [packages/store/src/activity.ts:487](../../packages/store/src/activity.ts#L487) `SharedRecordLocks/holder` | `SQLite.get` (487); `SQLite.prepare` (487) | CORE |
| [packages/store/src/activity.ts:559](../../packages/store/src/activity.ts#L559) `SharedRecordLocks/leave` | `SQLite.prepare` (559) | CORE |
| [packages/store/src/activity.ts:563](../../packages/store/src/activity.ts#L563) `SharedRecordLocks/leaveOwner` | `SQLite.all` (563); `SQLite.prepare` (563) | CORE |
| [packages/store/src/activity.ts:530](../../packages/store/src/activity.ts#L530) `SharedRecordLocks/release` | `SQLite.prepare` (530) | CORE |
| [packages/store/src/activity.ts:534](../../packages/store/src/activity.ts#L534) `SharedRecordLocks/releaseOwner` | `SQLite.all` (534); `SQLite.prepare` (534) | CORE |
| [packages/store/src/activity.ts:516](../../packages/store/src/activity.ts#L516) `SharedRecordLocks/renew` | `SQLite.prepare` (516) | CORE |
| [packages/store/src/activity.ts:479](../../packages/store/src/activity.ts#L479) `SharedRecordLocks/sweep` | `SQLite.prepare` (479) | CORE |
| [packages/store/src/activity.ts:546](../../packages/store/src/activity.ts#L546) `SharedRecordLocks/view` | `SQLite.prepare` (546, 547, 548, 549); `SQLite.get` (547, 548) | CORE |
| [packages/store/src/activity.ts:567](../../packages/store/src/activity.ts#L567) `SharedRecordLocks/viewers` | `SQLite.prepare` (567, 568); `SQLite.all` (568) | CORE |
| [packages/store/src/audit-anchor.ts:71](../../packages/store/src/audit-anchor.ts#L71) `checkAnchor` | `SQLite.get` (71, 74, 78, 81); `SQLite.prepare` (71, 74, 78, 81) | CORE |
| [packages/store/src/cache-versions.ts:11](../../packages/store/src/cache-versions.ts#L11) `ensureCacheVersions` | `SQLite.get` (11); `SQLite.prepare` (11) | CORE |
| [packages/store/src/calc.ts:618](../../packages/store/src/calc.ts#L618) `Calculations/allRecords` | `SQLite.iterate` (618); `SQLite.prepare` (618); `Store.sql` (618) | CALC |
| [packages/store/src/calc.ts:1213](../../packages/store/src/calc.ts#L1213) `Calculations/applyDelta/value` | `Calculations.value` (1213) | CALC |
| [packages/store/src/calc.ts:2391](../../packages/store/src/calc.ts#L2391) `Calculations/beforeWrite` | `relatedRows` (2391); `Calculations.related` (2445); `Calculations.context` (2458) | CORE |
| [packages/store/src/calc.ts:629](../../packages/store/src/calc.ts#L629) `Calculations/collect` | `Calculations.collector` (629) | CALC |
| [packages/store/src/calc.ts:660](../../packages/store/src/calc.ts#L660) `Calculations/collector/add` | `Calculations.related` (660) | CALC |
| [packages/store/src/calc.ts:1693](../../packages/store/src/calc.ts#L1693) `Calculations/columnNames` | `SQLite.all` (1693); `SQLite.prepare` (1693); `Store.sql` (1693) | CALC |
| [packages/store/src/calc.ts:2254](../../packages/store/src/calc.ts#L2254) `Calculations/computeColumn` | `Calculations.statement` (2254); `SQLite.get` (2254); `Calculations.value` (2257) | CALC |
| [packages/store/src/calc.ts:565](../../packages/store/src/calc.ts#L565) `Calculations/computed` | `Calculations.context` (565) | CALC |
| [packages/store/src/calc.ts:2509](../../packages/store/src/calc.ts#L2509) `Calculations/computeStored` | `Calculations.computeStoredStyled` (2509); `Calculations.value` (2509) | CALC |
| [packages/store/src/calc.ts:2524](../../packages/store/src/calc.ts#L2524) `Calculations/computeStoredStyled` | `Calculations.context` (2524) | CORE |
| [packages/store/src/calc.ts:1913](../../packages/store/src/calc.ts#L1913) `Calculations/context/executeSQL` | `Calculations.executeSQL` (1913) | CALC |
| [packages/store/src/calc.ts:1762](../../packages/store/src/calc.ts#L1762) `Calculations/context/field` | `Calculations.summary` (1762); `Calculations.globalValue` (1765); `Calculations.value` (1766) | CALC |
| [packages/store/src/calc.ts:1887](../../packages/store/src/calc.ts#L1887) `Calculations/context/get` | `Store.recordCount` (1887, 1894); `Calculations.statement` (1892); `SQLite.get` (1892) | CALC |
| [packages/store/src/calc.ts:1810](../../packages/store/src/calc.ts#L1810) `Calculations/context/lookupNext` | `Store.canViewRecord` (1810) | CALC |
| [packages/store/src/calc.ts:1914](../../packages/store/src/calc.ts#L1914) `Calculations/context/persistentData` | `Store.persistentData` (1914) | CALC |
| [packages/store/src/calc.ts:1915](../../packages/store/src/calc.ts#L1915) `Calculations/context/persistentDataIds` | `Store.persistentDataIds` (1915) | CALC |
| [packages/store/src/calc.ts:1744](../../packages/store/src/calc.ts#L1744) `Calculations/context/records` | `Calculations.firstRelated` (1744) | CALC |
| [packages/store/src/calc.ts:1775](../../packages/store/src/calc.ts#L1775) `Calculations/context/related` | `Calculations.globalValue` (1775); `Calculations.value` (1777, 1788); `Calculations.related` (1790) | CALC |
| [packages/store/src/calc.ts:1825](../../packages/store/src/calc.ts#L1825) `Calculations/context/summary` | `Calculations.value` (1825, 1835); `Calculations.related` (1837); `Calculations.summary` (1855) | CALC |
| [packages/store/src/calc.ts:2217](../../packages/store/src/calc.ts#L2217) `Calculations/defineComputedColumn/fm_computed` | `Calculations.related` (2217) | CALC |
| [packages/store/src/calc.ts:1940](../../packages/store/src/calc.ts#L1940) `Calculations/design` | `Store.valueListItems` (1940) | CALC |
| [packages/store/src/calc.ts:1718](../../packages/store/src/calc.ts#L1718) `Calculations/ensureIndex` | `Store.sql` (1718, 1719) | CALC |
| [packages/store/src/calc.ts:1957](../../packages/store/src/calc.ts#L1957) `Calculations/executeSQL` | `Calculations.translateSQL` (1957); `Store.select` (1995); `Store.sql` (2006) | CALC |
| [packages/store/src/calc.ts:1359](../../packages/store/src/calc.ts#L1359) `Calculations/firstRelated` | `Calculations.related` (1359, 1371, 1386); `Store.viewableIds` (1366); `Calculations.relatedIds` (1369, 1382); `Calculations.statement` (1379); `SQLite.get` (1379) | CALC |
| [packages/store/src/calc.ts:673](../../packages/store/src/calc.ts#L673) `Calculations/foundSummary` | `Calculations.collect` (673) | CALC |
| [packages/store/src/calc.ts:1608](../../packages/store/src/calc.ts#L1608) `Calculations/foundSums` | `Store.sql` (1608) | CALC |
| [packages/store/src/calc.ts:746](../../packages/store/src/calc.ts#L746) `Calculations/globalsKey` | `Calculations.globalValue` (746) | CALC |
| [packages/store/src/calc.ts:358](../../packages/store/src/calc.ts#L358) `Calculations/globalValue` | `SQLite.get` (358); `SQLite.prepare` (358); `Store.sql` (358) | CALC |
| [packages/store/src/calc.ts:1671](../../packages/store/src/calc.ts#L1671) `Calculations/hopQuery` | `Calculations.value` (1671) | CALC |
| [packages/store/src/calc.ts:1511](../../packages/store/src/calc.ts#L1511) `Calculations/joinHop` | `Calculations.statement` (1511, 1513); `SQLite.get` (1511); `SQLite.iterate` (1513) | CALC |
| [packages/store/src/calc.ts:1569](../../packages/store/src/calc.ts#L1569) `Calculations/lookup` | `Store.sql` (1569) | CALC |
| [packages/store/src/calc.ts:340](../../packages/store/src/calc.ts#L340) `Calculations/meta` | `SQLite.get` (340); `SQLite.prepare` (340); `Store.sql` (340) | CALC |
| [packages/store/src/calc.ts:1559](../../packages/store/src/calc.ts#L1559) `Calculations/passStamp` | `Store.sql` (1559) | CALC |
| [packages/store/src/calc.ts:1404](../../packages/store/src/calc.ts#L1404) `Calculations/relatedIds` | `Calculations.related` (1404, 1434, 1448); `rowsById` (1418, 1445); `Calculations.statement` (1429); `SQLite.all` (1429) | CALC |
| [packages/store/src/calc.ts:1337](../../packages/store/src/calc.ts#L1337) `Calculations/relatedRecs` | `Calculations.relatedIds` (1337); `Store.viewableIds` (1342); `rowsById` (1348) | CALC |
| [packages/store/src/calc.ts:1393](../../packages/store/src/calc.ts#L1393) `Calculations/rowById` | `Calculations.statement` (1393); `SQLite.get` (1393) | CALC |
| [packages/store/src/calc.ts:345](../../packages/store/src/calc.ts#L345) `Calculations/saveMeta` | `SQLite.prepare` (345); `Store.sql` (345) | CALC |
| [packages/store/src/calc.ts:382](../../packages/store/src/calc.ts#L382) `Calculations/setNextSerial` | `Store.sql` (382, 383, 389, 391, 391) | CALC |
| [packages/store/src/calc.ts:2185](../../packages/store/src/calc.ts#L2185) `Calculations/shareColumn` | `Store.recordCount` (2185) | CALC |
| [packages/store/src/calc.ts:1704](../../packages/store/src/calc.ts#L1704) `Calculations/statement` | `SQLite.prepare` (1704); `Store.sql` (1704) | CALC |
| [packages/store/src/calc.ts:1540](../../packages/store/src/calc.ts#L1540) `Calculations/storedRelatedValues` | `Calculations.statement` (1540); `SQLite.iterate` (1540) | CALC |
| [packages/store/src/calc.ts:1285](../../packages/store/src/calc.ts#L1285) `Calculations/storedRows` | `SQLite.iterate` (1285); `SQLite.prepare` (1285); `Store.sql` (1285) | CALC |
| [packages/store/src/calc.ts:684](../../packages/store/src/calc.ts#L684) `Calculations/summary` | `Calculations.collect` (684) | CALC |
| [packages/store/src/calc.ts:921](../../packages/store/src/calc.ts#L921) `Calculations/summaryDependencies` | `Store.sql` (921) | CALC |
| [packages/store/src/calc.ts:636](../../packages/store/src/calc.ts#L636) `Calculations/summaryInput` | `Calculations.value` (636) | CALC |
| [packages/store/src/calc.ts:691](../../packages/store/src/calc.ts#L691) `Calculations/tableSummary` | `Calculations.wholeTable` (691) | CALC |
| [packages/store/src/calc.ts:2121](../../packages/store/src/calc.ts#L2121) `Calculations/translateSQL` | `Store.scopedTableSql` (2121, 2153) | CALC |
| [packages/store/src/calc.ts:2560](../../packages/store/src/calc.ts#L2560) `Calculations/uniqueCollision` | `Calculations.value` (2560) | CALC |
| [packages/store/src/calc.ts:580](../../packages/store/src/calc.ts#L580) `Calculations/unstoredValue` | `Calculations.unstoredStyled` (580); `Calculations.value` (580) | CALC |
| [packages/store/src/calc.ts:2587](../../packages/store/src/calc.ts#L2587) `Calculations/validate` | `Calculations.value` (2587); `Store.valueListItems` (2608); `Calculations.context` (2622) | CALC |
| [packages/store/src/calc.ts:2573](../../packages/store/src/calc.ts#L2573) `Calculations/validate/fail` | `Calculations.context` (2573) | CALC |
| [packages/store/src/calc.ts:530](../../packages/store/src/calc.ts#L530) `Calculations/value` | `Calculations.globalValue` (530) | CALC |
| [packages/store/src/calc.ts:960](../../packages/store/src/calc.ts#L960) `Calculations/wholeTable` | `rowsById` (960); `Store.viewableIds` (960); `Calculations.collect` (962, 1052); `Calculations.value` (1023); `Store.sql` (1031, 1039) | CALC |
| [packages/store/src/calc.ts:2769](../../packages/store/src/calc.ts#L2769) `containerValue` | `Store.containerInfo` (2769); `Store.containerRange` (2776); `Store.container` (2777) | CALC |
| [packages/store/src/calc.ts:2785](../../packages/store/src/calc.ts#L2785) `containerValue/read` | `Store.container` (2785) | CALC |
| [packages/store/src/calc.ts:2798](../../packages/store/src/calc.ts#L2798) `containerValue/value` | `Store.containerRange` (2798) | CALC |
| [packages/store/src/calc.ts:2684](../../packages/store/src/calc.ts#L2684) `nearest` | `SQLite.get` (2684); `SQLite.prepare` (2684); `Store.sql` (2684) | CALC |
| [packages/store/src/calc.ts:3230](../../packages/store/src/calc.ts#L3230) `rowsById/flush` | `Calculations.statement` (3230); `SQLite.iterate` (3230) | CALC |
| [packages/store/src/calc.ts:2916](../../packages/store/src/calc.ts#L2916) `sameValuesElsewhere` | `SQLite.all` (2916); `SQLite.prepare` (2916, 2923, 2925); `Store.sql` (2916, 2923, 2925); `Calculations.value` (2918); `SQLite.get` (2923, 2925) | CALC |
| [packages/store/src/cross-file.ts:58](../../packages/store/src/cross-file.ts#L58) `CrossFileProofs/read` | `SQLite.get` (58); `SQLite.prepare` (58) | AUTH |
| [packages/store/src/cross-file.ts:115](../../packages/store/src/cross-file.ts#L115) `CrossFileProofs/save` | `SQLite.prepare` (115) | AUTH |
| [packages/store/src/damage.ts:93](../../packages/store/src/damage.ts#L93) `watchDatabase` | `SQLite.prepare` (93); `SQLite.iterate` (103) | CORE |
| [packages/store/src/exit-bundle.ts:463](../../packages/store/src/exit-bundle.ts#L463) `build` | `SQLite.prepare` (463) | EXIT-BUNDLE |
| [packages/store/src/exit-bundle.ts:486](../../packages/store/src/exit-bundle.ts#L486) `copyTables` | `SQLite.all` (486); `SQLite.prepare` (486, 492, 493, 510); `SQLite.get` (495, 507, 510) | EXIT-BUNDLE |
| [packages/store/src/exit-bundle.ts:669](../../packages/store/src/exit-bundle.ts#L669) `finish` | `SQLite.all` (669); `SQLite.prepare` (669); `Calculations.globalValue` (681) | EXIT-BUNDLE |
| [packages/store/src/exit-bundle.ts:520](../../packages/store/src/exit-bundle.ts#L520) `writeContainers` | `SQLite.all` (520, 532); `SQLite.prepare` (520, 532, 533, 567); `Store.containerInfo` (537); `Store.containerRange` (553); `SQLite.get` (567) | EXIT-BUNDLE |
| [packages/store/src/exit-bundle.ts:583](../../packages/store/src/exit-bundle.ts#L583) `writeCsv` | `SQLite.prepare` (583); `SQLite.iterate` (587) | EXIT-BUNDLE |
| [packages/store/src/explain-related.ts:364](../../packages/store/src/explain-related.ts#L364) `explainCandidate` | `SQLite.get` (364, 378); `SQLite.prepare` (364, 378); `Store.sql` (364, 378); `keyValue` (375); `Calculations.context` (383) | RECORD |
| [packages/store/src/explain-related.ts:301](../../packages/store/src/explain-related.ts#L301) `explainHop` | `keyValue` (301); `SQLite.get` (321); `SQLite.prepare` (321, 335); `Store.sql` (321, 335); `SQLite.all` (335) | RECORD |
| [packages/store/src/explain-related.ts:103](../../packages/store/src/explain-related.ts#L103) `explainRelated` | `Store.row` (103); `Store.get` (193); `Calculations.value` (242); `Calculations.context` (250) | RECORD |
| [packages/store/src/explain-related.ts:183](../../packages/store/src/explain-related.ts#L183) `explainRelated/runFilter` | `Calculations.context` (183) | RECORD |
| [packages/store/src/explain.ts:144](../../packages/store/src/explain.ts#L144) `explainField` | `Calculations.value` (144); `Calculations.context` (173) | RECORD |
| [packages/store/src/explain.ts:395](../../packages/store/src/explain.ts#L395) `lintFormula` | `Calculations.context` (395) | RECORD |
| [packages/store/src/export-sql.ts:230](../../packages/store/src/export-sql.ts#L230) `exportSql` | `Store.scopedTableSql` (230); `Store.select` (231, 364); `Store.container` (435) | OPERATOR |
| [packages/store/src/export-sql.ts:306](../../packages/store/src/export-sql.ts#L306) `exportSql/duplicates` | `Store.select` (306) | OPERATOR |
| [packages/store/src/export-sql.ts:256](../../packages/store/src/export-sql.ts#L256) `exportSql/page` | `Store.select` (256) | OPERATOR |
| [packages/store/src/fidelity.ts:214](../../packages/store/src/fidelity.ts#L214) `calcFidelity` | `Calculations.executeSQL` (214, 215, 301); `Store.sql` (219, 227, 300); `SQLite.all` (227); `SQLite.prepare` (227); `Calculations.computeStored` (263) | DESIGN |
| [packages/store/src/fidelity.ts:176](../../packages/store/src/fidelity.ts#L176) `changedAfter` | `Untyped.executeSQL` (176) | DESIGN |
| [packages/store/src/fidelity.ts:196](../../packages/store/src/fidelity.ts#L196) `queryProblem` | `Calculations.translateSQL` (196); `Store.describe` (197) | DESIGN |
| [packages/store/src/fmexport.ts:236](../../packages/store/src/fmexport.ts#L236) `fmExport` | `Store.recordCount` (236); `Store.query` (237); `Store.containerInfo` (252); `Store.container` (259) | OPERATOR |
| [packages/store/src/foreign-keys.ts:172](../../packages/store/src/foreign-keys.ts#L172) `childIds` | `SQLite.all` (172) | CORE |
| [packages/store/src/foreign-keys.ts:179](../../packages/store/src/foreign-keys.ts#L179) `childrenWithKeys` | `SQLite.all` (179) | CORE |
| [packages/store/src/foreign-keys.ts:188](../../packages/store/src/foreign-keys.ts#L188) `orphans` | `SQLite.get` (188); `SQLite.all` (189) | CORE |
| [packages/store/src/foreign-keys.ts:165](../../packages/store/src/foreign-keys.ts#L165) `parentHas` | `SQLite.get` (165) | CORE |
| [packages/store/src/import.ts:95](../../packages/store/src/import.ts#L95) `addExternalSizeColumn` | `SQLite.all` (95); `SQLite.prepare` (95) | OPERATOR |
| [packages/store/src/import.ts:243](../../packages/store/src/import.ts#L243) `applyFileAccountStatus` | `SQLite.get` (243, 245); `SQLite.prepare` (243, 245, 247, 259) | OPERATOR |
| [packages/store/src/import.ts:288](../../packages/store/src/import.ts#L288) `createStore` | `SQLite.prepare` (288, 300) | OPERATOR |
| [packages/store/src/import.ts:199](../../packages/store/src/import.ts#L199) `importDesigns` | `SQLite.all` (199); `SQLite.prepare` (199, 213, 216, 219, 221); `SQLite.get` (213, 216) | OPERATOR |
| [packages/store/src/import.ts:424](../../packages/store/src/import.ts#L424) `importFmp12` | `SQLite.prepare` (424, 437, 443, 449, 453, 468, 479, 569, 570, 571); `SQLite.get` (443, 468); `SQLite.all` (449) | OPERATOR |
| [packages/store/src/import.ts:415](../../packages/store/src/import.ts#L415) `importFmp12/save` | `SQLite.prepare` (415) | OPERATOR |
| [packages/store/src/import.ts:527](../../packages/store/src/import.ts#L527) `importFmp12/skipped` | `SQLite.get` (527); `SQLite.prepare` (527) | OPERATOR |
| [packages/store/src/import.ts:149](../../packages/store/src/import.ts#L149) `moveAddedImages` | `SQLite.prepare` (149, 159, 175, 176); `SQLite.get` (152); `SQLite.all` (176) | OPERATOR |
| [packages/store/src/import.ts:312](../../packages/store/src/import.ts#L312) `needsDesigns` | `SQLite.get` (312); `SQLite.prepare` (312) | OPERATOR |
| [packages/store/src/import.ts:135](../../packages/store/src/import.ts#L135) `nextImageId` | `SQLite.get` (135); `SQLite.prepare` (135) | OPERATOR |
| [packages/store/src/import.ts:359](../../packages/store/src/import.ts#L359) `readState` | `SQLite.get` (359); `SQLite.prepare` (359) | OPERATOR |
| [packages/store/src/import.ts:107](../../packages/store/src/import.ts#L107) `writeDesign` | `SQLite.prepare` (107, 111) | OPERATOR |
| [packages/store/src/layout-speed.ts:56](../../packages/store/src/layout-speed.ts#L56) `layoutCost/recordCount` | `Store.recordCount` (56) | DESIGN |
| [packages/store/src/layout-speed.ts:419](../../packages/store/src/layout-speed.ts#L419) `speedContext` | `Store.recordCount` (419) | DESIGN |
| [packages/store/src/native-compat.ts:91](../../packages/store/src/native-compat.ts#L91) `dateFields` | `SQLite.all` (91); `SQLite.prepare` (91) | OPERATOR |
| [packages/store/src/native-compat.ts:115](../../packages/store/src/native-compat.ts#L115) `inspectUpgrade` | `SQLite.get` (115); `SQLite.prepare` (115, 123); `SQLite.iterate` (123) | OPERATOR |
| [packages/store/src/native-compat.ts:61](../../packages/store/src/native-compat.ts#L61) `storedState/meta` | `SQLite.get` (61); `SQLite.prepare` (61) | OPERATOR |
| [packages/store/src/native-compat.ts:157](../../packages/store/src/native-compat.ts#L157) `upgradeNativeFile` | `SQLite.iterate` (157); `SQLite.prepare` (157, 158, 164) | OPERATOR |
| [packages/store/src/privileges.ts:554](../../packages/store/src/privileges.ts#L554) `ensurePrivilegeTables` | `SQLite.all` (554); `SQLite.prepare` (554) | AUTH |
| [packages/store/src/privileges.ts:526](../../packages/store/src/privileges.ts#L526) `privilegeSets` | `SQLite.all` (526); `SQLite.prepare` (526) | AUTH |
| [packages/store/src/reconvert.ts:222](../../packages/store/src/reconvert.ts#L222) `build` | `SQLite.get` (222); `SQLite.prepare` (222, 225, 230); `SQLite.all` (230) | OPERATOR |
| [packages/store/src/reconvert.ts:375](../../packages/store/src/reconvert.ts#L375) `carryImages` | `SQLite.all` (375, 377); `SQLite.prepare` (375, 377, 378) | OPERATOR |
| [packages/store/src/reconvert.ts:327](../../packages/store/src/reconvert.ts#L327) `carryRecords` | `SQLite.prepare` (327, 333, 336, 341, 342, 352, 358, 359); `SQLite.all` (333, 341, 345, 358) | OPERATOR |
| [packages/store/src/reconvert.ts:384](../../packages/store/src/reconvert.ts#L384) `carrySettings` | `SQLite.all` (384, 388, 396); `SQLite.prepare` (384, 388, 396, 397, 403); `SQLite.get` (403) | OPERATOR |
| [packages/store/src/reconvert.ts:100](../../packages/store/src/reconvert.ts#L100) `columns` | `SQLite.all` (100); `SQLite.prepare` (100) | OPERATOR |
| [packages/store/src/reconvert.ts:290](../../packages/store/src/reconvert.ts#L290) `copyContainer` | `SQLite.get` (290); `SQLite.prepare` (290, 292, 298) | OPERATOR |
| [packages/store/src/reconvert.ts:91](../../packages/store/src/reconvert.ts#L91) `meta` | `SQLite.get` (91); `SQLite.prepare` (91) | OPERATOR |
| [packages/store/src/reconvert.ts:270](../../packages/store/src/reconvert.ts#L270) `previewOf` | `SQLite.get` (270); `SQLite.prepare` (270) | OPERATOR |
| [packages/store/src/reconvert.ts:257](../../packages/store/src/reconvert.ts#L257) `previewOf/count` | `SQLite.get` (257); `SQLite.prepare` (257) | OPERATOR |
| [packages/store/src/reconvert.ts:146](../../packages/store/src/reconvert.ts#L146) `reconvertCheck` | `SQLite.get` (146); `SQLite.prepare` (146) | OPERATOR |
| [packages/store/src/reconvert.ts:96](../../packages/store/src/reconvert.ts#L96) `tableExists` | `SQLite.get` (96); `SQLite.prepare` (96) | OPERATOR |
| [packages/store/src/record-chain.ts:58](../../packages/store/src/record-chain.ts#L58) `ensureRecordChain` | `SQLite.all` (58); `SQLite.prepare` (58, 67, 68, 71); `SQLite.get` (67, 68) | CORE |
| [packages/store/src/record-chain.ts:80](../../packages/store/src/record-chain.ts#L80) `linkRecordEntry` | `SQLite.prepare` (80, 81, 82, 85, 86); `SQLite.get` (81, 82) | CORE |
| [packages/store/src/record-chain.ts:93](../../packages/store/src/record-chain.ts#L93) `pruneRecordEntries` | `SQLite.prepare` (93, 94, 95, 97); `SQLite.get` (94) | CORE |
| [packages/store/src/record-chain.ts:115](../../packages/store/src/record-chain.ts#L115) `verifyRecordAudit` | `SQLite.get` (115, 129); `SQLite.prepare` (115, 119, 129, 132); `SQLite.all` (119); `SQLite.iterate` (132) | CORE |
| [packages/store/src/related.ts:150](../../packages/store/src/related.ts#L150) `condition` | `Store.canViewRecord` (150); `keyValue` (163) | RELATED |
| [packages/store/src/related.ts:352](../../packages/store/src/related.ts#L352) `firstRelatedEach` | `Calculations.statement` (352); `SQLite.all` (352) | RELATED |
| [packages/store/src/related.ts:331](../../packages/store/src/related.ts#L331) `firstRelatedEach/keysOf` | `keyValue` (331) | RELATED |
| [packages/store/src/related.ts:318](../../packages/store/src/related.ts#L318) `firstRelatedEach/oneByOne` | `relatedRows` (318) | RELATED |
| [packages/store/src/related.ts:139](../../packages/store/src/related.ts#L139) `keyValue` | `Calculations.value` (139) | RELATED |
| [packages/store/src/related.ts:255](../../packages/store/src/related.ts#L255) `relatedIdList` | `Calculations.relatedIds` (255); `Calculations.statement` (260); `SQLite.iterate` (260) | RELATED |
| [packages/store/src/related.ts:298](../../packages/store/src/related.ts#L298) `relatedKeys` | `keyValue` (298) | RELATED |
| [packages/store/src/related.ts:197](../../packages/store/src/related.ts#L197) `relatedRows` | `Calculations.relatedIds` (197); `rowsById` (198); `Calculations.statement` (213, 217, 227); `SQLite.get` (213); `SQLite.all` (217); `SQLite.iterate` (227) | RELATED |
| [packages/store/src/results.ts:122](../../packages/store/src/results.ts#L122) `ResultCache/claimed` | `SQLite.get` (122); `SQLite.prepare` (122) | CORE |
| [packages/store/src/results.ts:74](../../packages/store/src/results.ts#L74) `ResultCache/get` | `SQLite.get` (74); `SQLite.prepare` (74) | CORE |
| [packages/store/src/results.ts:65](../../packages/store/src/results.ts#L65) `ResultCache/lastWrite` | `SQLite.get` (65); `SQLite.prepare` (65) | CORE |
| [packages/store/src/results.ts:86](../../packages/store/src/results.ts#L86) `ResultCache/put` | `SQLite.prepare` (86) | CORE |
| [packages/store/src/results.ts:131](../../packages/store/src/results.ts#L131) `ResultCache/release` | `SQLite.prepare` (131) | CORE |
| [packages/store/src/results.ts:110](../../packages/store/src/results.ts#L110) `ResultCache/renew` | `SQLite.prepare` (110) | CORE |
| [packages/store/src/results.ts:56](../../packages/store/src/results.ts#L56) `ResultCache/wrote` | `SQLite.prepare` (56) | CORE |
| [packages/store/src/security-chain.ts:132](../../packages/store/src/security-chain.ts#L132) `appendSecurityEvent` | `SQLite.prepare` (132, 134, 136, 138, 142, 144); `SQLite.get` (134, 138) | CORE |
| [packages/store/src/security-chain.ts:92](../../packages/store/src/security-chain.ts#L92) `ensureSecurityChain` | `SQLite.get` (92, 102, 103, 106, 107); `SQLite.prepare` (92, 93, 102, 103, 106, 107, 111, 114, 122); `SQLite.all` (93); `SQLite.iterate` (114) | CORE |
| [packages/store/src/security-chain.ts:162](../../packages/store/src/security-chain.ts#L162) `verifySecurityAudit` | `SQLite.get` (162, 163); `SQLite.prepare` (162, 163, 167, 176); `SQLite.all` (167); `SQLite.iterate` (178) | CORE |
| [packages/store/src/sql-child.ts:32](../../packages/store/src/sql-child.ts#L32) `run` | `SQLite.iterate` (32) | CORE |
| [packages/store/src/sql-recursive.ts:44](../../packages/store/src/sql-recursive.ts#L44) `builtinFunctions` | `SQLite.all` (44); `SQLite.prepare` (44) | CORE |
| [packages/store/src/sql-result.ts:42](../../packages/store/src/sql-result.ts#L42) `boundedStatement` | `SQLite.prepare` (42, 53) | CORE |
| [packages/store/src/stale-calcs.ts:107](../../packages/store/src/stale-calcs.ts#L107) `current` | `Calculations.computeStored` (107) | DESIGN |
| [packages/store/src/stale-calcs.ts:128](../../packages/store/src/stale-calcs.ts#L128) `findStaleCalcs` | `Store.sql` (128, 135, 158); `Store.recordCount` (133); `SQLite.iterate` (135); `SQLite.prepare` (135) | DESIGN |
| [packages/store/src/stale-calcs.ts:283](../../packages/store/src/stale-calcs.ts#L283) `RefreshJournal/add` | `SQLite.prepare` (283); `Store.sql` (283) | DESIGN |
| [packages/store/src/stale-calcs.ts:277](../../packages/store/src/stale-calcs.ts#L277) `RefreshJournal/constructor` | `Store.sql` (277) | DESIGN |
| [packages/store/src/stale-calcs.ts:289](../../packages/store/src/stale-calcs.ts#L289) `RefreshJournal/get` | `SQLite.get` (289); `SQLite.prepare` (289); `Store.sql` (289) | DESIGN |
| [packages/store/src/stale-calcs.ts:294](../../packages/store/src/stale-calcs.ts#L294) `RefreshJournal/list` | `SQLite.all` (294); `SQLite.prepare` (294); `Store.sql` (294) | DESIGN |
| [packages/store/src/stale-calcs.ts:298](../../packages/store/src/stale-calcs.ts#L298) `RefreshJournal/markUndone` | `SQLite.prepare` (298); `Store.sql` (298) | DESIGN |
| [packages/store/src/stale-calcs.ts:205](../../packages/store/src/stale-calcs.ts#L205) `refreshStaleCalcsBatch` | `Store.sql` (205, 210, 228, 231); `SQLite.iterate` (210); `SQLite.prepare` (210) | DESIGN |
| [packages/store/src/stale-calcs.ts:243](../../packages/store/src/stale-calcs.ts#L243) `undoStaleRefreshBatch` | `Store.sql` (243, 261, 263) | DESIGN |
| [packages/store/src/store-format.ts:50](../../packages/store/src/store-format.ts#L50) `checkFormat` | `SQLite.prepare` (50) | CORE |
| [packages/store/src/store-format.ts:32](../../packages/store/src/store-format.ts#L32) `storedFormat` | `SQLite.get` (32); `SQLite.prepare` (32) | CORE |
| [packages/store/src/store.ts:5327](../../packages/store/src/store.ts#L5327) `Store/accountIdentityId` | `SQLite.get` (5327, 5333); `SQLite.prepare` (5327, 5332, 5333); `Store.sql` (5327, 5332, 5333) | CORE |
| [packages/store/src/store.ts:5321](../../packages/store/src/store.ts#L5321) `Store/accountIdentityIdIfSet` | `SQLite.get` (5321); `SQLite.prepare` (5321); `Store.sql` (5321) | CORE |
| [packages/store/src/store.ts:5283](../../packages/store/src/store.ts#L5283) `Store/accountInactive` | `SQLite.get` (5283); `SQLite.prepare` (5283); `Store.sql` (5283) | CORE |
| [packages/store/src/store.ts:5480](../../packages/store/src/store.ts#L5480) `Store/accountLocalOnly` | `SQLite.get` (5480); `SQLite.prepare` (5480); `Store.sql` (5480) | CORE |
| [packages/store/src/store.ts:6349](../../packages/store/src/store.ts#L6349) `Store/accountPrivilegeSet` | `SQLite.get` (6349); `SQLite.prepare` (6349); `Store.sql` (6349) | CORE |
| [packages/store/src/store.ts:5485](../../packages/store/src/store.ts#L5485) `Store/accountRequires2fa` | `SQLite.get` (5485); `SQLite.prepare` (5485); `Store.sql` (5485) | CORE |
| [packages/store/src/store.ts:3673](../../packages/store/src/store.ts#L3673) `Store/accounts` | `SQLite.all` (3673); `SQLite.prepare` (3673); `Store.sql` (3673) | CORE |
| [packages/store/src/store.ts:3669](../../packages/store/src/store.ts#L3669) `Store/accountsSharingLockout` | `SQLite.all` (3669); `SQLite.prepare` (3669); `Store.sql` (3669) | CORE |
| [packages/store/src/store.ts:5705](../../packages/store/src/store.ts#L5705) `Store/accountUsage` | `SQLite.get` (5705); `SQLite.prepare` (5705, 5706); `Store.sql` (5705, 5706); `SQLite.all` (5706); `Store.auditLog` (5722) | CORE |
| [packages/store/src/store.ts:8539](../../packages/store/src/store.ts#L8539) `Store/addContainer` | `SQLite.all` (8539); `SQLite.prepare` (8539, 8544, 8558, 8562, 8563); `Store.sql` (8539, 8544, 8558, 8560, 8562, 8563, 8565, 8568); `SQLite.get` (8549); `Store.containerRange` (8551) | CORE |
| [packages/store/src/store.ts:8585](../../packages/store/src/store.ts#L8585) `Store/addExternalContainer` | `SQLite.prepare` (8585); `Store.sql` (8585) | CORE |
| [packages/store/src/store.ts:9062](../../packages/store/src/store.ts#L9062) `Store/addFieldIndex` | `Store.sql` (9062) | CORE |
| [packages/store/src/store.ts:7231](../../packages/store/src/store.ts#L7231) `Store/addImage` | `Store.sql` (7231, 7232); `SQLite.prepare` (7232) | CORE |
| [packages/store/src/store.ts:6399](../../packages/store/src/store.ts#L6399) `Store/addProvisionedAccount` | `SQLite.get` (6399); `SQLite.prepare` (6399, 6403); `Store.sql` (6399, 6403) | CORE |
| [packages/store/src/store.ts:7657](../../packages/store/src/store.ts#L7657) `Store/addRelated` | `relatedRows` (7657); `rowsById` (7690); `firstRelatedEach` (7713) | CORE |
| [packages/store/src/store.ts:3691](../../packages/store/src/store.ts#L3691) `Store/agentNeedsApproval` | `SQLite.get` (3691); `SQLite.prepare` (3691); `Store.sql` (3691) | CORE |
| [packages/store/src/store.ts:6626](../../packages/store/src/store.ts#L6626) `Store/allowedIds` | `SQLite.iterate` (6626); `SQLite.prepare` (6626); `Store.sql` (6626) | CORE |
| [packages/store/src/store.ts:5762](../../packages/store/src/store.ts#L5762) `Store/apiToken` | `SQLite.get` (5762); `SQLite.prepare` (5762, 5780); `Store.sql` (5762, 5780) | CORE |
| [packages/store/src/store.ts:5738](../../packages/store/src/store.ts#L5738) `Store/apiTokens` | `SQLite.all` (5738); `SQLite.prepare` (5738); `Store.sql` (5738) | CORE |
| [packages/store/src/store.ts:4091](../../packages/store/src/store.ts#L4091) `Store/appendSecurityEvent` | `Store.sql` (4091) | CORE |
| [packages/store/src/store.ts:3132](../../packages/store/src/store.ts#L3132) `Store/appendSecurityRow` | `Store.sql` (3132) | CORE |
| [packages/store/src/store.ts:5103](../../packages/store/src/store.ts#L5103) `Store/applyAccountImport` | `Store.sql` (5103, 5111, 5140); `SQLite.get` (5111); `SQLite.prepare` (5111, 5140) | CORE |
| [packages/store/src/store.ts:2433](../../packages/store/src/store.ts#L2433) `Store/applyDesign` | `Store.sql` (2433, 2434, 2454, 2457, 2462, 2478, 2481, 2481); `SQLite.prepare` (2457, 2462) | CORE |
| [packages/store/src/store.ts:3935](../../packages/store/src/store.ts#L3935) `Store/approvePending` | `SQLite.get` (3935); `SQLite.prepare` (3935, 3947); `Store.sql` (3935, 3947) | CORE |
| [packages/store/src/store.ts:2923](../../packages/store/src/store.ts#L2923) `Store/audit/write` | `Store.sql` (2923) | CORE |
| [packages/store/src/store.ts:2545](../../packages/store/src/store.ts#L2545) `Store/auditLog` | `SQLite.all` (2545); `SQLite.prepare` (2545); `Store.sql` (2545) | CORE |
| [packages/store/src/store.ts:1968](../../packages/store/src/store.ts#L1968) `Store/backup` | `Store.sql` (1968) | CORE |
| [packages/store/src/store.ts:3697](../../packages/store/src/store.ts#L3697) `Store/blankPasswordAccounts` | `SQLite.all` (3697); `SQLite.prepare` (3697); `Store.sql` (3697) | CORE |
| [packages/store/src/store.ts:5032](../../packages/store/src/store.ts#L5032) `Store/canonicalAccount` | `SQLite.all` (5032); `SQLite.prepare` (5032); `Store.sql` (5032) | CORE |
| [packages/store/src/store.ts:9648](../../packages/store/src/store.ts#L9648) `Store/canView` | `Store.canView` (9648); `Store.row` (9649) | GATED-STORE |
| [packages/store/src/store.ts:9630](../../packages/store/src/store.ts#L9630) `Store/canViewRecord` | `SQLite.get` (9630); `SQLite.prepare` (9630); `Store.sql` (9630) | GATED-STORE |
| [packages/store/src/store.ts:10728](../../packages/store/src/store.ts#L10728) `Store/cascadeDelete` | `relatedRows` (10728) | CORE |
| [packages/store/src/store.ts:2268](../../packages/store/src/store.ts#L2268) `Store/changeOne` | `Store.sql` (2268, 2270) | CORE |
| [packages/store/src/store.ts:2271](../../packages/store/src/store.ts#L2271) `Store/changeOne/read` | `SQLite.get` (2271); `SQLite.prepare` (2271); `Store.sql` (2271) | CORE |
| [packages/store/src/store.ts:8920](../../packages/store/src/store.ts#L8920) `Store/checkContainerWrite` | `Store.row` (8920) | CORE |
| [packages/store/src/store.ts:10351](../../packages/store/src/store.ts#L10351) `Store/checkEditable` | `Store.row` (10351) | CORE |
| [packages/store/src/store.ts:1514](../../packages/store/src/store.ts#L1514) `Store/checkpoint` | `SQLite.get` (1514); `SQLite.prepare` (1514); `Store.sql` (1514) | CORE |
| [packages/store/src/store.ts:3834](../../packages/store/src/store.ts#L3834) `Store/checkProposedWrite` | `Store.row` (3834); `relatedRows` (3848) | CORE |
| [packages/store/src/store.ts:6385](../../packages/store/src/store.ts#L6385) `Store/clearAccountPrivilegeSet` | `SQLite.prepare` (6385); `Store.sql` (6385) | CORE |
| [packages/store/src/store.ts:1536](../../packages/store/src/store.ts#L1536) `Store/close` | `Store.sql` (1536) | CORE |
| [packages/store/src/store.ts:8888](../../packages/store/src/store.ts#L8888) `Store/compactFile` | `Store.sql` (8888, 8889, 8891) | CORE |
| [packages/store/src/store.ts:9299](../../packages/store/src/store.ts#L9299) `Store/computedRows` | `Store.sql` (9299, 9302, 9303, 9304, 9306, 9316, 9317, 9318, 9321); `SQLite.prepare` (9302, 9304, 9306, 9316); `SQLite.iterate` (9306); `Calculations.globalValue` (9309); `Calculations.unstoredValue` (9310); `Calculations.related` (9313); `SQLite.all` (9316) | CORE |
| [packages/store/src/store.ts:10852](../../packages/store/src/store.ts#L10852) `Store/computeValuesCurrent` | `Store.computeValues` (10852); `Store.sql` (10858, 10862); `SQLite.all` (10862); `SQLite.prepare` (10862) | GATED-STORE |
| [packages/store/src/store.ts:5807](../../packages/store/src/store.ts#L5807) `Store/confirmTotp` | `SQLite.get` (5807); `SQLite.prepare` (5807, 5809); `Store.sql` (5807, 5809) | CORE |
| [packages/store/src/store.ts:1152](../../packages/store/src/store.ts#L1152) `Store/constructor` | `Store.sql` (1152, 1154, 1156, 1157, 1161, 1165, 1166, 1175, 1183, 1198, 1203, 1208, 1209, 1213, 1214, 1215, 1222, 1226, 1230, 1231, 1232, 1237, 1238, 1242, 1245, 1246, 1248, 1249, 1252, 1253, 1257, 1258, 1262, 1263, 1266, 1269, 1270, 1272, 1275, 1276, 1280, 1281, 1285, 1286, 1290, 1291, 1292, 1295, 1296, 1299, 1300, 1302, 1302, 1303, 1303, 1304, 1308, 1310, 1314, 1316, 1319, 1320, 1321, 1324, 1325, 1327, 1329, 1330, 1334, 1335, 1337, 1349, 1351, 1352, 1353, 1353, 1357, 1358); `SQLite.get` (1156, 1175); `SQLite.prepare` (1156, 1175, 1183, 1245, 1246, 1249, 1252, 1257, 1262, 1269, 1275, 1280, 1285, 1295, 1299, 1302, 1303, 1324, 1329, 1334); `SQLite.all` (1245, 1252, 1257, 1262, 1269, 1275, 1280, 1285, 1295, 1299, 1302, 1303, 1324, 1329, 1334) | CORE |
| [packages/store/src/store.ts:6165](../../packages/store/src/store.ts#L6165) `Store/consumeRecoveryCode` | `SQLite.prepare` (6165); `Store.sql` (6165) | CORE |
| [packages/store/src/store.ts:8463](../../packages/store/src/store.ts#L8463) `Store/container` | `SQLite.get` (8463); `SQLite.prepare` (8463, 8472); `Store.sql` (8463, 8472); `SQLite.all` (8472) | CORE |
| [packages/store/src/store.ts:8897](../../packages/store/src/store.ts#L8897) `Store/containerId` | `Store.containerId` (8897); `Store.row` (8898) | CORE |
| [packages/store/src/store.ts:8480](../../packages/store/src/store.ts#L8480) `Store/containerInfo` | `SQLite.get` (8480); `SQLite.prepare` (8480); `Store.sql` (8480) | CORE |
| [packages/store/src/store.ts:8444](../../packages/store/src/store.ts#L8444) `Store/containerIntact` | `SQLite.get` (8444); `SQLite.prepare` (8444); `Store.sql` (8444) | CORE |
| [packages/store/src/store.ts:8383](../../packages/store/src/store.ts#L8383) `Store/containerIntegrityReport` | `SQLite.all` (8383); `SQLite.prepare` (8383, 8394); `Store.sql` (8383, 8394); `SQLite.get` (8394) | CORE |
| [packages/store/src/store.ts:8458](../../packages/store/src/store.ts#L8458) `Store/containerMeta` | `SQLite.get` (8458); `SQLite.prepare` (8458); `Store.sql` (8458) | CORE |
| [packages/store/src/store.ts:8514](../../packages/store/src/store.ts#L8514) `Store/containerRange` | `SQLite.all` (8514); `SQLite.prepare` (8514, 8521); `Store.sql` (8514, 8521); `SQLite.get` (8521) | CORE |
| [packages/store/src/store.ts:8285](../../packages/store/src/store.ts#L8285) `Store/containerReferences` | `SQLite.all` (8285, 8304, 8306, 8312, 8325, 8336, 8350); `SQLite.prepare` (8285, 8304, 8306, 8312, 8325, 8336, 8348, 8350); `Store.sql` (8285, 8304, 8306, 8312, 8325, 8336, 8348, 8350); `SQLite.get` (8348); `Store.row` (8359) | CORE |
| [packages/store/src/store.ts:10832](../../packages/store/src/store.ts#L10832) `Store/countIds` | `Store.countIds` (10832); `SQLite.get` (10836); `SQLite.prepare` (10836); `Store.sql` (10836) | GATED-STORE |
| [packages/store/src/store.ts:9679](../../packages/store/src/store.ts#L9679) `Store/create` | `SQLite.get` (9679); `SQLite.prepare` (9679, 9692); `Store.sql` (9679, 9692) | CORE |
| [packages/store/src/store.ts:4063](../../packages/store/src/store.ts#L4063) `Store/createAccountOnly` | `SQLite.get` (4063); `SQLite.prepare` (4063, 4067, 4073, 4078, 4083); `Store.sql` (4063, 4067, 4073, 4078, 4083) | CORE |
| [packages/store/src/store.ts:5538](../../packages/store/src/store.ts#L5538) `Store/createApiToken` | `SQLite.get` (5538, 5566); `SQLite.prepare` (5538, 5565, 5566, 5576); `Store.sql` (5538, 5565, 5566, 5576) | CORE |
| [packages/store/src/store.ts:5044](../../packages/store/src/store.ts#L5044) `Store/createLocalAccount` | `SQLite.prepare` (5044); `Store.sql` (5044) | CORE |
| [packages/store/src/store.ts:3663](../../packages/store/src/store.ts#L3663) `Store/credentialIdentity` | `SQLite.get` (3663); `SQLite.prepare` (3663); `Store.sql` (3663) | CORE |
| [packages/store/src/store.ts:5459](../../packages/store/src/store.ts#L5459) `Store/credentialStamp` | `SQLite.get` (5459); `SQLite.prepare` (5459); `Store.sql` (5459) | CORE |
| [packages/store/src/store.ts:7064](../../packages/store/src/store.ts#L7064) `Store/crossFileBusy` | `Store.sql` (7064) | AUTH |
| [packages/store/src/store.ts:7036](../../packages/store/src/store.ts#L7036) `Store/crossFileHash` | `SQLite.get` (7036); `SQLite.prepare` (7036); `Store.sql` (7036) | AUTH |
| [packages/store/src/store.ts:2058](../../packages/store/src/store.ts#L2058) `Store/dataVersion` | `SQLite.get` (2058); `SQLite.prepare` (2058); `Store.sql` (2058) | CORE |
| [packages/store/src/store.ts:11390](../../packages/store/src/store.ts#L11390) `Store/decimalViewSql` | `SQLite.all` (11390); `SQLite.prepare` (11390) | CORE |
| [packages/store/src/store.ts:10394](../../packages/store/src/store.ts#L10394) `Store/delete` | `Store.row` (10394) | CORE |
| [packages/store/src/store.ts:10402](../../packages/store/src/store.ts#L10402) `Store/delete/run` | `SQLite.get` (10402); `SQLite.prepare` (10402, 10407); `Store.sql` (10402, 10407) | CORE |
| [packages/store/src/store.ts:5198](../../packages/store/src/store.ts#L5198) `Store/deleteAccount` | `SQLite.prepare` (5198, 5202, 5203, 5204, 5205, 5206, 5207, 5208, 5209, 5216, 5218, 5220, 5222, 5226); `Store.sql` (5198, 5202, 5203, 5204, 5205, 5206, 5207, 5208, 5209, 5216, 5218, 5220, 5222, 5226) | CORE |
| [packages/store/src/store.ts:10475](../../packages/store/src/store.ts#L10475) `Store/deleteBeingUndone` | `SQLite.all` (10475); `SQLite.prepare` (10475); `Store.sql` (10475) | CORE |
| [packages/store/src/store.ts:3300](../../packages/store/src/store.ts#L3300) `Store/deletedRows` | `SQLite.get` (3300); `SQLite.prepare` (3300, 3302, 3302); `Store.sql` (3300, 3302, 3302); `SQLite.all` (3302, 3302) | CORE |
| [packages/store/src/store.ts:10487](../../packages/store/src/store.ts#L10487) `Store/deleteEndingTheLifeAt` | `SQLite.get` (10487); `SQLite.prepare` (10487); `Store.sql` (10487) | CORE |
| [packages/store/src/store.ts:6250](../../packages/store/src/store.ts#L6250) `Store/deletePrivilegeSet` | `SQLite.prepare` (6250); `Store.sql` (6250) | CORE |
| [packages/store/src/store.ts:4201](../../packages/store/src/store.ts#L4201) `Store/deleteScriptTest` | `SQLite.prepare` (4201); `Store.sql` (4201) | CORE |
| [packages/store/src/store.ts:10379](../../packages/store/src/store.ts#L10379) `Store/deleteVisibility` | `Store.canViewRecord` (10379) | CORE |
| [packages/store/src/store.ts:7173](../../packages/store/src/store.ts#L7173) `Store/design` | `SQLite.get` (7173) | CORE |
| [packages/store/src/store.ts:3410](../../packages/store/src/store.ts#L3410) `Store/designEffect` | `Store.sql` (3410, 3416, 3417, 3420, 3426, 3431, 3434, 3440, 3451, 3452, 3454, 3455, 3468, 3469, 3472, 3474, 3480, 3481, 3482, 3488, 3490, 3494, 3497, 3498, 3500, 3503, 3509, 3511, 3518, 3519, 3521, 3522, 3523, 3524, 3531, 3532, 3534, 3534, 3536, 3537, 3538, 3542, 3546, 3548, 3586, 3588, 3590); `SQLite.prepare` (3420, 3451, 3452, 3468, 3469, 3480, 3481, 3488, 3490, 3494, 3498, 3509, 3511, 3524, 3531, 3532, 3534, 3536, 3538, 3542, 3546); `SQLite.get` (3451, 3468, 3480, 3481, 3494, 3498, 3534, 3542); `SQLite.all` (3531, 3532); `SQLite.iterate` (3536) | CORE |
| [packages/store/src/store.ts:3403](../../packages/store/src/store.ts#L3403) `Store/designEffect/renameExcluded` | `SQLite.prepare` (3403); `Store.sql` (3403) | CORE |
| [packages/store/src/store.ts:3387](../../packages/store/src/store.ts#L3387) `Store/designEffect/renameKey` | `SQLite.prepare` (3387); `Store.sql` (3387) | CORE |
| [packages/store/src/store.ts:3341](../../packages/store/src/store.ts#L3341) `Store/designHistory` | `SQLite.all` (3341); `SQLite.prepare` (3341); `Store.sql` (3341) | CORE |
| [packages/store/src/store.ts:5828](../../packages/store/src/store.ts#L5828) `Store/disableTotp` | `SQLite.prepare` (5828); `Store.sql` (5828) | CORE |
| [packages/store/src/store.ts:3598](../../packages/store/src/store.ts#L3598) `Store/dropColumnIndexes` | `SQLite.all` (3598, 3600); `SQLite.prepare` (3598, 3600); `Store.sql` (3598, 3600, 3601) | CORE |
| [packages/store/src/store.ts:9074](../../packages/store/src/store.ts#L9074) `Store/dropFieldIndex` | `SQLite.get` (9074); `SQLite.prepare` (9074); `Store.sql` (9074, 9075) | CORE |
| [packages/store/src/store.ts:9716](../../packages/store/src/store.ts#L9716) `Store/duplicate` | `Store.row` (9716); `SQLite.prepare` (9734); `Store.sql` (9734) | CORE |
| [packages/store/src/store.ts:8701](../../packages/store/src/store.ts#L8701) `Store/embeddedContainerCount` | `SQLite.prepare` (8701); `Store.sql` (8701); `SQLite.get` (8702) | CORE |
| [packages/store/src/store.ts:8687](../../packages/store/src/store.ts#L8687) `Store/embeddedContainers` | `SQLite.prepare` (8687, 8688); `Store.sql` (8687, 8688); `SQLite.all` (8688); `SQLite.get` (8692) | CORE |
| [packages/store/src/store.ts:3326](../../packages/store/src/store.ts#L3326) `Store/emptyDeleted` | `Store.sql` (3326, 3329, 3330, 3332, 3334); `SQLite.prepare` (3330) | CORE |
| [packages/store/src/store.ts:1934](../../packages/store/src/store.ts#L1934) `Store/endTransaction` | `Store.sql` (1934, 1937, 1937) | CORE |
| [packages/store/src/store.ts:5796](../../packages/store/src/store.ts#L5796) `Store/enrollTotp` | `SQLite.prepare` (5796); `Store.sql` (5796) | CORE |
| [packages/store/src/store.ts:3295](../../packages/store/src/store.ts#L3295) `Store/ensureDeleted` | `Store.sql` (3295) | CORE |
| [packages/store/src/store.ts:1368](../../packages/store/src/store.ts#L1368) `Store/ensureNativeIds` | `SQLite.all` (1368, 1380); `SQLite.prepare` (1368, 1371, 1379, 1380); `Store.sql` (1368, 1371, 1374, 1378, 1379, 1380, 1383, 1385) | CORE |
| [packages/store/src/store.ts:2180](../../packages/store/src/store.ts#L2180) `Store/ensureRecordIdHighWater` | `Store.sql` (2180, 2181, 2183, 2185, 2187) | CORE |
| [packages/store/src/store.ts:2199](../../packages/store/src/store.ts#L2199) `Store/ensureRecordIdMarks` | `SQLite.all` (2199, 2202, 2205, 2214); `SQLite.prepare` (2199, 2202, 2205, 2208, 2214, 2217); `Store.sql` (2199, 2202, 2205, 2208, 2214, 2217, 2221, 2222) | CORE |
| [packages/store/src/store.ts:10048](../../packages/store/src/store.ts#L10048) `Store/evaluateCurrent` | `Store.row` (10048, 10048, 10049, 10049); `Calculations.context` (10054); `Store.get` (10055, 10057) | GATED-STORE |
| [packages/store/src/store.ts:10089](../../packages/store/src/store.ts#L10089) `Store/evaluateEachCurrent` | `Store.row` (10089, 10089, 10094); `Calculations.context` (10095); `Store.get` (10097) | GATED-STORE |
| [packages/store/src/store.ts:10151](../../packages/store/src/store.ts#L10151) `Store/evaluateRowsCurrent` | `Store.row` (10151, 10151, 10152, 10152) | GATED-STORE |
| [packages/store/src/store.ts:10130](../../packages/store/src/store.ts#L10130) `Store/evaluateRowsCurrent/each` | `Calculations.context` (10130); `Store.get` (10132) | GATED-STORE |
| [packages/store/src/store.ts:10166](../../packages/store/src/store.ts#L10166) `Store/evaluateRowsCurrent/found/[Symbol.iterator]` | `rowsById` (10166) | GATED-STORE |
| [packages/store/src/store.ts:10188](../../packages/store/src/store.ts#L10188) `Store/evaluateRowsCurrent/key` | `Calculations.context` (10188) | GATED-STORE |
| [packages/store/src/store.ts:3979](../../packages/store/src/store.ts#L3979) `Store/externalAccount` | `SQLite.all` (3979); `SQLite.prepare` (3979); `Store.sql` (3979) | CORE |
| [packages/store/src/store.ts:8206](../../packages/store/src/store.ts#L8206) `Store/externalContainerCheck` | `SQLite.all` (8206); `SQLite.prepare` (8206); `Store.sql` (8206) | CORE |
| [packages/store/src/store.ts:8213](../../packages/store/src/store.ts#L8213) `Store/externalContainerCount` | `SQLite.get` (8213); `SQLite.prepare` (8213); `Store.sql` (8213) | CORE |
| [packages/store/src/store.ts:8222](../../packages/store/src/store.ts#L8222) `Store/externalContainerReport` | `SQLite.all` (8222, 8235); `SQLite.prepare` (8222, 8235); `Store.sql` (8222, 8235) | CORE |
| [packages/store/src/store.ts:5309](../../packages/store/src/store.ts#L5309) `Store/externalIdentityId` | `SQLite.get` (5309, 5316); `SQLite.prepare` (5309, 5315, 5316); `Store.sql` (5309, 5315, 5316) | CORE |
| [packages/store/src/store.ts:8454](../../packages/store/src/store.ts#L8454) `Store/externalOf` | `SQLite.get` (8454); `SQLite.prepare` (8454); `Store.sql` (8454) | CORE |
| [packages/store/src/store.ts:3076](../../packages/store/src/store.ts#L3076) `Store/failureAuditRoom` | `SQLite.get` (3076); `SQLite.prepare` (3076); `Store.sql` (3076) | CORE |
| [packages/store/src/store.ts:7859](../../packages/store/src/store.ts#L7859) `Store/fieldIndexCurrent` | `SQLite.iterate` (7859); `SQLite.prepare` (7859, 7864); `Store.sql` (7859, 7864); `SQLite.all` (7864) | GATED-STORE |
| [packages/store/src/store.ts:9114](../../packages/store/src/store.ts#L9114) `Store/find` | `Store.find` (9114) | GATED-STORE |
| [packages/store/src/store.ts:9486](../../packages/store/src/store.ts#L9486) `Store/findCandidates` | `Store.query` (9486) | CORE |
| [packages/store/src/store.ts:9125](../../packages/store/src/store.ts#L9125) `Store/findHere` | `Store.query` (9125, 9130, 9132, 9146, 9148, 9159); `Store.recordCount` (9143); `SQLite.get` (9144, 9148); `SQLite.prepare` (9144, 9148, 9154, 9161, 9170); `Store.sql` (9144, 9148, 9154, 9161, 9170); `SQLite.all` (9154, 9161, 9170) | GATED-STORE |
| [packages/store/src/store.ts:9165](../../packages/store/src/store.ts#L9165) `Store/findHere/[Symbol.iterator]` | `SQLite.iterate` (9165); `SQLite.prepare` (9165); `Store.sql` (9165) | GATED-STORE |
| [packages/store/src/store.ts:10963](../../packages/store/src/store.ts#L10963) `Store/findIdsCurrent` | `Store.findIds` (10963) | GATED-STORE |
| [packages/store/src/store.ts:10899](../../packages/store/src/store.ts#L10899) `Store/findIdsCurrentProgress` | `Store.findIdsProgress` (10899); `Store.query` (10901, 10902, 10915, 10917); `Store.recordCount` (10907, 10935); `SQLite.iterate` (10932); `SQLite.prepare` (10932, 10940, 10941); `Store.sql` (10932, 10940, 10941); `SQLite.get` (10944); `SQLite.all` (10950) | GATED-STORE |
| [packages/store/src/store.ts:10969](../../packages/store/src/store.ts#L10969) `Store/findIdsHere` | `Store.query` (10969, 10974, 10976); `SQLite.iterate` (10987); `SQLite.prepare` (10987); `Store.sql` (10987) | GATED-STORE |
| [packages/store/src/store.ts:9430](../../packages/store/src/store.ts#L9430) `Store/findSource` | `Store.query` (9430); `SQLite.all` (9439, 9456); `SQLite.prepare` (9439, 9447, 9455); `Store.sql` (9439, 9444, 9447, 9452, 9455, 9469, 9471); `Calculations.globalValue` (9461); `Calculations.unstoredValue` (9462); `Calculations.related` (9466) | CORE |
| [packages/store/src/store.ts:3188](../../packages/store/src/store.ts#L3188) `Store/flushDeferredSecurity` | `Store.sql` (3188) | CORE |
| [packages/store/src/store.ts:5165](../../packages/store/src/store.ts#L5165) `Store/forgetStandIns` | `SQLite.prepare` (5165); `Store.sql` (5165) | CORE |
| [packages/store/src/store.ts:10442](../../packages/store/src/store.ts#L10442) `Store/forgetStandInValues` | `Store.sql` (10442, 10463); `SQLite.prepare` (10463) | CORE |
| [packages/store/src/store.ts:7741](../../packages/store/src/store.ts#L7741) `Store/foundSetPage` | `rowsById` (7741) | CORE |
| [packages/store/src/store.ts:7757](../../packages/store/src/store.ts#L7757) `Store/foundSetRowsCurrent` | `Store.viewableIds` (7757); `Store.row` (7773) | GATED-STORE |
| [packages/store/src/store.ts:3897](../../packages/store/src/store.ts#L3897) `Store/gateAgentWrite` | `SQLite.get` (3897); `SQLite.prepare` (3897, 3899); `Store.sql` (3897, 3899) | CORE |
| [packages/store/src/store.ts:6103](../../packages/store/src/store.ts#L6103) `Store/generateRecoveryCodes` | `SQLite.prepare` (6103, 6106); `Store.sql` (6103, 6106) | CORE |
| [packages/store/src/store.ts:9558](../../packages/store/src/store.ts#L9558) `Store/getCurrent` | `Store.get` (9558); `Store.row` (9559, 9559, 9573); `SQLite.all` (9576); `SQLite.prepare` (9576); `Store.sql` (9576) | GATED-STORE |
| [packages/store/src/store.ts:9596](../../packages/store/src/store.ts#L9596) `Store/getManyCurrent` | `Store.getMany` (9596); `SQLite.get` (9614); `SQLite.prepare` (9614); `Store.sql` (9614) | GATED-STORE |
| [packages/store/src/store.ts:9607](../../packages/store/src/store.ts#L9607) `Store/getManyCurrent/[Symbol.iterator]` | `rowsById` (9607) | GATED-STORE |
| [packages/store/src/store.ts:1415](../../packages/store/src/store.ts#L1415) `Store/grantFullAccessClients` | `SQLite.prepare` (1415); `Store.sql` (1415) | CORE |
| [packages/store/src/store.ts:11004](../../packages/store/src/store.ts#L11004) `Store/groupSummariesCurrent` | `Store.groupSummaries` (11004); `Store.viewableIds` (11009); `Calculations.collect` (11025); `rowsById` (11025, 11075); `Calculations.collector` (11047) | GATED-STORE |
| [packages/store/src/store.ts:11073](../../packages/store/src/store.ts#L11073) `Store/groupSummariesCurrent/flush` | `Calculations.collector` (11073) | GATED-STORE |
| [packages/store/src/store.ts:11037](../../packages/store/src/store.ts#L11037) `Store/groupSummariesCurrent/key` | `Calculations.value` (11037); `Calculations.related` (11039) | GATED-STORE |
| [packages/store/src/store.ts:1442](../../packages/store/src/store.ts#L1442) `Store/hasOwnPassword` | `SQLite.get` (1442); `SQLite.prepare` (1442); `Store.sql` (1442) | CORE |
| [packages/store/src/store.ts:5958](../../packages/store/src/store.ts#L5958) `Store/hasPasskey` | `SQLite.get` (5958); `SQLite.prepare` (5958); `Store.sql` (5958) | CORE |
| [packages/store/src/store.ts:1423](../../packages/store/src/store.ts#L1423) `Store/hasProvingPassword` | `SQLite.get` (1423); `SQLite.prepare` (1423); `Store.sql` (1423) | CORE |
| [packages/store/src/store.ts:9028](../../packages/store/src/store.ts#L9028) `Store/hasTable` | `SQLite.get` (9028); `SQLite.prepare` (9028); `Store.sql` (9028) | CORE |
| [packages/store/src/store.ts:5817](../../packages/store/src/store.ts#L5817) `Store/hasTotp` | `SQLite.get` (5817); `SQLite.prepare` (5817); `Store.sql` (5817) | CORE |
| [packages/store/src/store.ts:5288](../../packages/store/src/store.ts#L5288) `Store/identityAllowed` | `SQLite.get` (5288, 5294, 5300); `SQLite.prepare` (5288, 5294, 5300); `Store.sql` (5288, 5294, 5300) | CORE |
| [packages/store/src/store.ts:7208](../../packages/store/src/store.ts#L7208) `Store/image` | `SQLite.get` (7208); `SQLite.prepare` (7208); `Store.sql` (7208) | CORE |
| [packages/store/src/store.ts:7218](../../packages/store/src/store.ts#L7218) `Store/images` | `SQLite.all` (7218); `SQLite.prepare` (7218); `Store.sql` (7218) | CORE |
| [packages/store/src/store.ts:5009](../../packages/store/src/store.ts#L5009) `Store/importAccounts` | `SQLite.all` (5009); `SQLite.prepare` (5009); `Store.sql` (5009) | CORE |
| [packages/store/src/store.ts:1756](../../packages/store/src/store.ts#L1756) `Store/independentWindowWrite` | `SQLite.get` (1756); `SQLite.prepare` (1756, 1764, 1824); `Store.sql` (1756, 1764, 1774, 1802, 1819, 1824, 1827); `SQLite.all` (1764); `Store.row` (1822) | CORE |
| [packages/store/src/store.ts:9040](../../packages/store/src/store.ts#L9040) `Store/indexedFields` | `SQLite.all` (9040, 9041); `SQLite.prepare` (9040, 9041); `Store.sql` (9040, 9041) | CORE |
| [packages/store/src/store.ts:11423](../../packages/store/src/store.ts#L11423) `Store/internalRoots` | `SQLite.get` (11423); `SQLite.prepare` (11423, 11425); `SQLite.all` (11425) | CORE |
| [packages/store/src/store.ts:3685](../../packages/store/src/store.ts#L3685) `Store/isAgent` | `SQLite.get` (3685); `SQLite.prepare` (3685); `Store.sql` (3685) | CORE |
| [packages/store/src/store.ts:3788](../../packages/store/src/store.ts#L3788) `Store/isExternal` | `SQLite.get` (3788); `SQLite.prepare` (3788); `Store.sql` (3788) | CORE |
| [packages/store/src/store.ts:5872](../../packages/store/src/store.ts#L5872) `Store/issueWebauthnChallenge` | `SQLite.prepare` (5872, 5874, 5875, 5877); `Store.sql` (5872, 5874, 5875, 5877); `SQLite.get` (5874) | CORE |
| [packages/store/src/store.ts:11285](../../packages/store/src/store.ts#L11285) `Store/iterateCommitted` | `SQLite.iterate` (11285) | CORE |
| [packages/store/src/store.ts:1696](../../packages/store/src/store.ts#L1696) `Store/joinTransaction` | `Store.sql` (1696, 1697, 1699, 1701, 1707, 1710) | CORE |
| [packages/store/src/store.ts:10675](../../packages/store/src/store.ts#L10675) `Store/keyStepWork` | `Store.sql` (10675, 10681, 10685, 10687) | CORE |
| [packages/store/src/store.ts:7024](../../packages/store/src/store.ts#L7024) `Store/knownSharedAccount` | `SQLite.get` (7024); `SQLite.prepare` (7024); `Store.sql` (7024) | CORE |
| [packages/store/src/store.ts:4482](../../packages/store/src/store.ts#L4482) `Store/lastSignIns` | `Store.auditLog` (4482) | CORE |
| [packages/store/src/store.ts:10493](../../packages/store/src/store.ts#L10493) `Store/latestDeleteSeq` | `SQLite.get` (10493); `SQLite.prepare` (10493); `Store.sql` (10493) | CORE |
| [packages/store/src/store.ts:7248](../../packages/store/src/store.ts#L7248) `Store/layout` | `SQLite.get` (7248); `SQLite.prepare` (7248); `Store.sql` (7248) | CORE |
| [packages/store/src/store.ts:3358](../../packages/store/src/store.ts#L3358) `Store/layoutHistory` | `SQLite.all` (3358); `SQLite.prepare` (3358); `Store.sql` (3358) | CORE |
| [packages/store/src/store.ts:7138](../../packages/store/src/store.ts#L7138) `Store/layouts` | `SQLite.all` (7138); `SQLite.prepare` (7138); `Store.sql` (7138) | CORE |
| [packages/store/src/store.ts:4782](../../packages/store/src/store.ts#L4782) `Store/leastPrivilege` | `SQLite.all` (4782); `SQLite.prepare` (4782); `Store.sql` (4782) | CORE |
| [packages/store/src/store.ts:5386](../../packages/store/src/store.ts#L5386) `Store/ledgerRow` | `SQLite.get` (5386, 5387); `SQLite.prepare` (5386, 5387); `Store.sql` (5386, 5387) | AUTH |
| [packages/store/src/store.ts:5398](../../packages/store/src/store.ts#L5398) `Store/ledgerWrite` | `Store.sql` (5398, 5399, 5401, 5403, 5406, 5406) | AUTH |
| [packages/store/src/store.ts:5092](../../packages/store/src/store.ts#L5092) `Store/limitAccountImport` | `SQLite.prepare` (5092, 5093, 5096); `Store.sql` (5092, 5093, 5096); `SQLite.get` (5093) | CORE |
| [packages/store/src/store.ts:3638](../../packages/store/src/store.ts#L3638) `Store/linkIdentity` | `SQLite.get` (3638); `SQLite.prepare` (3638); `Store.sql` (3638) | CORE |
| [packages/store/src/store.ts:3630](../../packages/store/src/store.ts#L3630) `Store/linkPrincipal` | `SQLite.get` (3630); `SQLite.prepare` (3630); `Store.sql` (3630) | CORE |
| [packages/store/src/store.ts:4368](../../packages/store/src/store.ts#L4368) `Store/markPiiField` | `SQLite.prepare` (4368); `Store.sql` (4368) | CORE |
| [packages/store/src/store.ts:8179](../../packages/store/src/store.ts#L8179) `Store/markRepeating` | `SQLite.prepare` (8179); `Store.sql` (8179) | CORE |
| [packages/store/src/store.ts:11218](../../packages/store/src/store.ts#L11218) `Store/matchIds` | `Store.matchIds` (11218); `SQLite.all` (11224); `SQLite.prepare` (11224); `Store.sql` (11224) | CORE |
| [packages/store/src/store.ts:1457](../../packages/store/src/store.ts#L1457) `Store/meta` | `SQLite.get` (1457); `SQLite.prepare` (1457); `Store.sql` (1457) | CORE |
| [packages/store/src/store.ts:1007](../../packages/store/src/store.ts#L1007) `Store/metadataVersions` | `SQLite.get` (1007); `SQLite.prepare` (1007); `Store.sql` (1007) | CORE |
| [packages/store/src/store.ts:8816](../../packages/store/src/store.ts#L8816) `Store/moveContainersIn` | `Store.sql` (8816, 8822, 8824, 8825, 8826, 8827, 8847, 8852, 8852, 8863, 8866, 8869, 8876); `SQLite.prepare` (8824, 8825, 8826, 8827, 8863, 8869); `SQLite.get` (8829, 8863, 8869) | CORE |
| [packages/store/src/store.ts:8738](../../packages/store/src/store.ts#L8738) `Store/moveContainersOut` | `Store.sql` (8738, 8746, 8748, 8750, 8755, 8756, 8776, 8782, 8784, 8786, 8786, 8792, 8792, 8797, 8799, 8801, 8801, 8807); `SQLite.get` (8746); `SQLite.prepare` (8746, 8755, 8756); `Store.container` (8758) | CORE |
| [packages/store/src/store.ts:4963](../../packages/store/src/store.ts#L4963) `Store/mustChangePassword` | `SQLite.get` (4963); `SQLite.prepare` (4963); `Store.sql` (4963) | CORE |
| [packages/store/src/store.ts:1393](../../packages/store/src/store.ts#L1393) `Store/nativeIdGuards` | `Store.sql` (1393, 1394, 1396) | CORE |
| [packages/store/src/store.ts:2235](../../packages/store/src/store.ts#L2235) `Store/nextRecordId` | `SQLite.get` (2235); `SQLite.prepare` (2235); `Store.sql` (2235) | CORE |
| [packages/store/src/store.ts:5692](../../packages/store/src/store.ts#L5692) `Store/objectUseSince` | `SQLite.get` (5692); `SQLite.prepare` (5692); `Store.sql` (5692) | CORE |
| [packages/store/src/store.ts:9000](../../packages/store/src/store.ts#L9000) `Store/orderBy` | `Store.valueListItems` (9000) | CORE |
| [packages/store/src/store.ts:8371](../../packages/store/src/store.ts#L8371) `Store/orphanContainerReport` | `SQLite.all` (8371); `SQLite.prepare` (8371); `Store.sql` (8371) | CORE |
| [packages/store/src/store.ts:5924](../../packages/store/src/store.ts#L5924) `Store/passkeyAllowList` | `SQLite.all` (5924); `SQLite.prepare` (5924); `Store.sql` (5924) | CORE |
| [packages/store/src/store.ts:5963](../../packages/store/src/store.ts#L5963) `Store/passkeyIds` | `SQLite.all` (5963); `SQLite.prepare` (5963); `Store.sql` (5963) | CORE |
| [packages/store/src/store.ts:5951](../../packages/store/src/store.ts#L5951) `Store/passkeys` | `SQLite.all` (5951); `SQLite.prepare` (5951); `Store.sql` (5951) | CORE |
| [packages/store/src/store.ts:5002](../../packages/store/src/store.ts#L5002) `Store/passwordDaysRemaining` | `SQLite.get` (5002); `SQLite.prepare` (5002); `Store.sql` (5002) | CORE |
| [packages/store/src/store.ts:6982](../../packages/store/src/store.ts#L6982) `Store/passwordState` | `SQLite.get` (6982); `SQLite.prepare` (6982); `Store.sql` (6982) | CORE |
| [packages/store/src/store.ts:3921](../../packages/store/src/store.ts#L3921) `Store/pendingChanges` | `SQLite.all` (3921); `SQLite.prepare` (3921); `Store.sql` (3921) | CORE |
| [packages/store/src/store.ts:1475](../../packages/store/src/store.ts#L1475) `Store/persistentData` | `SQLite.get` (1475) | CORE |
| [packages/store/src/store.ts:1484](../../packages/store/src/store.ts#L1484) `Store/persistentDataIds` | `SQLite.all` (1484) | CORE |
| [packages/store/src/store.ts:1465](../../packages/store/src/store.ts#L1465) `Store/persistentTable` | `Store.sql` (1465) | CORE |
| [packages/store/src/store.ts:10336](../../packages/store/src/store.ts#L10336) `Store/portalContainerTarget` | `Store.row` (10336); `relatedIdList` (10338) | CORE |
| [packages/store/src/store.ts:7796](../../packages/store/src/store.ts#L7796) `Store/portalCountsCurrent` | `Store.canView` (7796); `Store.row` (7823) | GATED-STORE |
| [packages/store/src/store.ts:8034](../../packages/store/src/store.ts#L8034) `Store/portalRows` | `relatedRows` (8034); `relatedIdList` (8035); `Store.viewableSet` (8038); `rowsById` (8063, 8101); `Calculations.related` (8077) | CORE |
| [packages/store/src/store.ts:8045](../../packages/store/src/store.ts#L8045) `Store/portalRows/context` | `Calculations.context` (8045) | CORE |
| [packages/store/src/store.ts:8055](../../packages/store/src/store.ts#L8055) `Store/portalRows/valueOf` | `Calculations.value` (8055) | CORE |
| [packages/store/src/store.ts:2611](../../packages/store/src/store.ts#L2611) `Store/prepared` | `SQLite.prepare` (2611); `Store.sql` (2611) | CORE |
| [packages/store/src/store.ts:5074](../../packages/store/src/store.ts#L5074) `Store/previewAccountImport` | `Store.sql` (5074, 5075, 5084) | CORE |
| [packages/store/src/store.ts:6780](../../packages/store/src/store.ts#L6780) `Store/previewRecordRuleCurrent` | `SQLite.get` (6780); `SQLite.prepare` (6780, 6783); `Store.sql` (6780, 6783); `SQLite.all` (6783); `Calculations.context` (6789, 6805) | CORE |
| [packages/store/src/store.ts:9521](../../packages/store/src/store.ts#L9521) `Store/previewRow` | `Store.row` (9521) | CORE |
| [packages/store/src/store.ts:6178](../../packages/store/src/store.ts#L6178) `Store/privilegeSets` | `Store.sql` (6178) | CORE |
| [packages/store/src/store.ts:2843](../../packages/store/src/store.ts#L2843) `Store/pruneAudit` | `Store.sql` (2843, 2845, 2847); `SQLite.get` (2845); `SQLite.prepare` (2845) | CORE |
| [packages/store/src/store.ts:8406](../../packages/store/src/store.ts#L8406) `Store/purgeOrphanContainers` | `Store.sql` (8406, 8410, 8419, 8422, 8423, 8428, 8429, 8431, 8431); `Store.orphanContainerReport` (8414); `SQLite.get` (8419); `SQLite.prepare` (8419, 8422, 8423) | CORE |
| [packages/store/src/store.ts:11543](../../packages/store/src/store.ts#L11543) `Store/query` | `SQLite.iterate` (11543) | CORE |
| [packages/store/src/store.ts:11583](../../packages/store/src/store.ts#L11583) `Store/queryWithOriginsCurrent` | `SQLite.iterate` (11583); `SQLite.all` (11592, 11595); `SQLite.prepare` (11592, 11595) | CORE |
| [packages/store/src/store.ts:11335](../../packages/store/src/store.ts#L11335) `Store/readOnlyChecked` | `SQLite.prepare` (11335, 11339, 11348, 11353); `SQLite.all` (11339, 11348, 11353) | CORE |
| [packages/store/src/store.ts:3610](../../packages/store/src/store.ts#L3610) `Store/recompute` | `SQLite.prepare` (3610, 3614); `Store.sql` (3610, 3614); `SQLite.iterate` (3614); `Calculations.computeStoredStyled` (3615); `Calculations.value` (3615) | CORE |
| [packages/store/src/store.ts:2626](../../packages/store/src/store.ts#L2626) `Store/recordAsOf` | `SQLite.get` (2626, 2628); `SQLite.prepare` (2626, 2628, 2630, 2631); `Store.sql` (2626, 2628, 2630, 2631); `SQLite.all` (2630, 2631) | CORE |
| [packages/store/src/store.ts:2322](../../packages/store/src/store.ts#L2322) `Store/recordCount` | `SQLite.get` (2322); `SQLite.prepare` (2322); `Store.sql` (2322) | CORE |
| [packages/store/src/store.ts:1522](../../packages/store/src/store.ts#L1522) `Store/recordedFormat` | `Store.sql` (1522) | CORE |
| [packages/store/src/store.ts:2703](../../packages/store/src/store.ts#L2703) `Store/recordLife` | `SQLite.all` (2703); `SQLite.prepare` (2703); `Store.sql` (2703) | CORE |
| [packages/store/src/store.ts:5623](../../packages/store/src/store.ts#L5623) `Store/recordObjectUse` | `Store.sql` (5623) | CORE |
| [packages/store/src/store.ts:10038](../../packages/store/src/store.ts#L10038) `Store/recordViewable` | `Store.row` (10038) | GATED-STORE |
| [packages/store/src/store.ts:8710](../../packages/store/src/store.ts#L8710) `Store/recoverContainersOut` | `SQLite.prepare` (8710); `Store.sql` (8710); `SQLite.get` (8713) | CORE |
| [packages/store/src/store.ts:1625](../../packages/store/src/store.ts#L1625) `Store/recoverPendingExternalFiles` | `Store.sql` (1625, 1627, 1651, 1653); `SQLite.prepare` (1627); `SQLite.get` (1638) | CORE |
| [packages/store/src/store.ts:6121](../../packages/store/src/store.ts#L6121) `Store/recoveryCodesRemaining` | `SQLite.get` (6121); `SQLite.prepare` (6121); `Store.sql` (6121) | CORE |
| [packages/store/src/store.ts:11375](../../packages/store/src/store.ts#L11375) `Store/refreshDecimalSqlViews` | `SQLite.get` (11375); `SQLite.prepare` (11375) | CORE |
| [packages/store/src/store.ts:3779](../../packages/store/src/store.ts#L3779) `Store/refuseLookalikeAccount` | `SQLite.all` (3779); `SQLite.prepare` (3779); `Store.sql` (3779) | CORE |
| [packages/store/src/store.ts:5987](../../packages/store/src/store.ts#L5987) `Store/registerPasskey` | `SQLite.prepare` (5987); `Store.sql` (5987) | CORE |
| [packages/store/src/store.ts:3957](../../packages/store/src/store.ts#L3957) `Store/rejectPending` | `SQLite.get` (3957); `SQLite.prepare` (3957, 3959); `Store.sql` (3957, 3959) | CORE |
| [packages/store/src/store.ts:9273](../../packages/store/src/store.ts#L9273) `Store/relatedCriteria` | `SQLite.iterate` (9273); `SQLite.prepare` (9273); `Store.sql` (9273) | CORE |
| [packages/store/src/store.ts:9270](../../packages/store/src/store.ts#L9270) `Store/relatedCriteria/matched` | `relatedRows` (9270) | CORE |
| [packages/store/src/store.ts:7583](../../packages/store/src/store.ts#L7583) `Store/relatedValues` | `Calculations.globalValue` (7583); `Calculations.unstoredValue` (7585) | CORE |
| [packages/store/src/store.ts:6000](../../packages/store/src/store.ts#L6000) `Store/removePasskey` | `SQLite.get` (6000); `SQLite.prepare` (6000, 6001); `Store.sql` (6000, 6001) | CORE |
| [packages/store/src/store.ts:9099](../../packages/store/src/store.ts#L9099) `Store/reportFind` | `Store.query` (9099, 9101, 9102); `Store.recordCount` (9104) | CORE |
| [packages/store/src/store.ts:10513](../../packages/store/src/store.ts#L10513) `Store/restoreDeletedRowLocked` | `SQLite.get` (10513, 10518); `SQLite.prepare` (10513, 10514, 10518, 10528); `Store.sql` (10513, 10514, 10518, 10528); `SQLite.all` (10514) | CORE |
| [packages/store/src/store.ts:2661](../../packages/store/src/store.ts#L2661) `Store/restoreRecord` | `Store.recordAsOf` (2661); `SQLite.get` (2665); `SQLite.prepare` (2665, 2670, 2679, 2690); `Store.sql` (2665, 2670, 2679, 2690) | CORE |
| [packages/store/src/store.ts:2719](../../packages/store/src/store.ts#L2719) `Store/revertAuditEntry` | `SQLite.get` (2719); `SQLite.prepare` (2719); `Store.sql` (2719); `Store.canViewRecord` (2721); `Store.auditLog` (2724) | CORE |
| [packages/store/src/store.ts:5748](../../packages/store/src/store.ts#L5748) `Store/revokeApiToken` | `SQLite.prepare` (5748); `Store.sql` (5748) | CORE |
| [packages/store/src/store.ts:5271](../../packages/store/src/store.ts#L5271) `Store/revokeSignInCredentials` | `SQLite.prepare` (5271, 5272, 5273); `Store.sql` (5271, 5272, 5273) | AUTH |
| [packages/store/src/store.ts:9539](../../packages/store/src/store.ts#L9539) `Store/row` | `SQLite.get` (9539) | CORE |
| [packages/store/src/store.ts:11479](../../packages/store/src/store.ts#L11479) `Store/rowsOf` | `SQLite.iterate` (11479, 11488) | CORE |
| [packages/store/src/store.ts:6585](../../packages/store/src/store.ts#L6585) `Store/ruleOutcome` | `Calculations.context` (6585) | CORE |
| [packages/store/src/store.ts:9384](../../packages/store/src/store.ts#L9384) `Store/runningSummaryValues` | `Store.viewableIds` (9384); `rowsById` (9386); `Calculations.value` (9397, 9403); `Calculations.related` (9414) | GATED-STORE |
| [packages/store/src/store.ts:6207](../../packages/store/src/store.ts#L6207) `Store/savePrivilegeSet` | `SQLite.prepare` (6207, 6215); `Store.sql` (6207, 6215) | AUTH |
| [packages/store/src/store.ts:4192](../../packages/store/src/store.ts#L4192) `Store/saveScriptTest` | `SQLite.prepare` (4192); `Store.sql` (4192) | CORE |
| [packages/store/src/store.ts:6745](../../packages/store/src/store.ts#L6745) `Store/scopedTableSql` | `Store.viewableIds` (6745); `SQLite.all` (6748); `SQLite.prepare` (6748); `Store.sql` (6748) | GATED-STORE |
| [packages/store/src/store.ts:3348](../../packages/store/src/store.ts#L3348) `Store/scriptHistory` | `SQLite.all` (3348); `SQLite.prepare` (3348); `Store.sql` (3348) | CORE |
| [packages/store/src/store.ts:1601](../../packages/store/src/store.ts#L1601) `Store/securityChainHeadAudit` | `SQLite.get` (1601); `SQLite.prepare` (1601); `Store.sql` (1601) | CORE |
| [packages/store/src/store.ts:3021](../../packages/store/src/store.ts#L3021) `Store/securityChange` | `Store.sql` (3021, 3023); `SQLite.prepare` (3023) | CORE |
| [packages/store/src/store.ts:2585](../../packages/store/src/store.ts#L2585) `Store/securityEvents` | `Store.auditLog` (2585) | CORE |
| [packages/store/src/store.ts:5472](../../packages/store/src/store.ts#L5472) `Store/securityToken` | `SQLite.get` (5472); `SQLite.prepare` (5472); `Store.sql` (5472) | CORE |
| [packages/store/src/store.ts:11509](../../packages/store/src/store.ts#L11509) `Store/selectHeldCurrent` | `Store.sql` (11509, 11510, 11512); `SQLite.prepare` (11510) | CORE |
| [packages/store/src/store.ts:10818](../../packages/store/src/store.ts#L10818) `Store/selectIdsCurrent` | `Store.selectIds` (10818); `SQLite.all` (10824); `SQLite.prepare` (10824); `Store.sql` (10824) | GATED-STORE |
| [packages/store/src/store.ts:11499](../../packages/store/src/store.ts#L11499) `Store/selectIn` | `Store.select` (11499) | CORE |
| [packages/store/src/store.ts:1988](../../packages/store/src/store.ts#L1988) `Store/selfContainedCopy` | `Store.sql` (1988); `SQLite.all` (1993); `SQLite.prepare` (1993, 1995, 1996, 1997) | CORE |
| [packages/store/src/store.ts:5250](../../packages/store/src/store.ts#L5250) `Store/setAccountActive` | `SQLite.prepare` (5250, 5258, 5259); `Store.sql` (5250, 5258, 5259) | AUTH |
| [packages/store/src/store.ts:5491](../../packages/store/src/store.ts#L5491) `Store/setAccountLocalOnly` | `SQLite.prepare` (5491); `Store.sql` (5491) | CORE |
| [packages/store/src/store.ts:6363](../../packages/store/src/store.ts#L6363) `Store/setAccountPrivilegeSet` | `SQLite.get` (6363); `SQLite.prepare` (6363, 6366, 6370); `Store.sql` (6363, 6366, 6370) | AUTH |
| [packages/store/src/store.ts:5500](../../packages/store/src/store.ts#L5500) `Store/setAccountRequire2fa` | `SQLite.prepare` (5500); `Store.sql` (5500) | CORE |
| [packages/store/src/store.ts:3809](../../packages/store/src/store.ts#L3809) `Store/setAgentAccount` | `SQLite.get` (3809); `SQLite.prepare` (3809, 3815); `Store.sql` (3809, 3815) | CORE |
| [packages/store/src/store.ts:4241](../../packages/store/src/store.ts#L4241) `Store/setAiAllowed` | `SQLite.prepare` (4241); `Store.sql` (4241) | CORE |
| [packages/store/src/store.ts:4326](../../packages/store/src/store.ts#L4326) `Store/setAiPolicy` | `SQLite.prepare` (4326); `Store.sql` (4326) | CORE |
| [packages/store/src/store.ts:7011](../../packages/store/src/store.ts#L7011) `Store/setAllowBlankPasswordFromLan` | `SQLite.prepare` (7011); `Store.sql` (7011) | CORE |
| [packages/store/src/store.ts:2821](../../packages/store/src/store.ts#L2821) `Store/setAuditSettings` | `SQLite.prepare` (2821); `Store.sql` (2821) | CORE |
| [packages/store/src/store.ts:8929](../../packages/store/src/store.ts#L8929) `Store/setContainer` | `Store.sql` (8929); `Store.row` (8935) | CORE |
| [packages/store/src/store.ts:3761](../../packages/store/src/store.ts#L3761) `Store/setExternalAccount` | `SQLite.get` (3761); `SQLite.prepare` (3761, 3766); `Store.sql` (3761, 3766) | CORE |
| [packages/store/src/store.ts:4949](../../packages/store/src/store.ts#L4949) `Store/setMustChangePassword` | `SQLite.prepare` (4949); `Store.sql` (4949) | CORE |
| [packages/store/src/store.ts:4016](../../packages/store/src/store.ts#L4016) `Store/setPasswordOnly` | `SQLite.get` (4016); `SQLite.prepare` (4016, 4022, 4031, 4038, 4039, 4040); `Store.sql` (4016, 4022, 4031, 4038, 4039, 4040) | AUTH |
| [packages/store/src/store.ts:4133](../../packages/store/src/store.ts#L4133) `Store/setPasswordPolicy` | `SQLite.prepare` (4133); `Store.sql` (4133) | CORE |
| [packages/store/src/store.ts:1490](../../packages/store/src/store.ts#L1490) `Store/setPersistentData` | `SQLite.prepare` (1490, 1494); `Store.sql` (1490, 1494) | CORE |
| [packages/store/src/store.ts:4346](../../packages/store/src/store.ts#L4346) `Store/setPiiIsolation` | `SQLite.prepare` (4346); `Store.sql` (4346) | CORE |
| [packages/store/src/store.ts:4169](../../packages/store/src/store.ts#L4169) `Store/setRequireTotpForFullAccess` | `SQLite.prepare` (4169); `Store.sql` (4169) | CORE |
| [packages/store/src/store.ts:4258](../../packages/store/src/store.ts#L4258) `Store/setScriptNetwork` | `SQLite.prepare` (4258); `Store.sql` (4258) | CORE |
| [packages/store/src/store.ts:4315](../../packages/store/src/store.ts#L4315) `Store/setSqlRequiresFmxdbc` | `SQLite.prepare` (4315); `Store.sql` (4315) | CORE |
| [packages/store/src/store.ts:9959](../../packages/store/src/store.ts#L9959) `Store/setStoredCalcValues` | `SQLite.prepare` (9959, 9960); `Store.sql` (9959, 9960); `SQLite.get` (9964) | CORE |
| [packages/store/src/store.ts:5425](../../packages/store/src/store.ts#L5425) `Store/settleSignIns` | `SQLite.all` (5425, 5431); `SQLite.prepare` (5425, 5431, 5437, 5441, 5443); `Store.sql` (5425, 5431, 5437, 5441, 5443) | AUTH |
| [packages/store/src/store.ts:9032](../../packages/store/src/store.ts#L9032) `Store/setUserPref` | `Store.sql` (9032, 9033, 9034); `SQLite.prepare` (9033, 9034) | CORE |
| [packages/store/src/store.ts:4299](../../packages/store/src/store.ts#L4299) `Store/setWebViewerHosts` | `SQLite.prepare` (4299); `Store.sql` (4299) | CORE |
| [packages/store/src/store.ts:2119](../../packages/store/src/store.ts#L2119) `Store/shareResults` | `Store.sql` (2119) | CORE |
| [packages/store/src/store.ts:1552](../../packages/store/src/store.ts#L1552) `Store/shipWal` | `Store.sql` (1552) | CORE |
| [packages/store/src/store.ts:5372](../../packages/store/src/store.ts#L5372) `Store/signInBase` | `SQLite.get` (5372); `SQLite.prepare` (5372); `Store.sql` (5372) | AUTH |
| [packages/store/src/store.ts:5374](../../packages/store/src/store.ts#L5374) `Store/signInBase/identity` | `SQLite.get` (5374); `SQLite.prepare` (5374); `Store.sql` (5374) | AUTH |
| [packages/store/src/store.ts:5361](../../packages/store/src/store.ts#L5361) `Store/signInMark` | `SQLite.prepare` (5361); `Store.sql` (5361) | AUTH |
| [packages/store/src/store.ts:9198](../../packages/store/src/store.ts#L9198) `Store/sortedPage` | `SQLite.iterate` (9198); `SQLite.prepare` (9198, 9213); `Store.sql` (9198, 9213); `SQLite.all` (9213) | CORE |
| [packages/store/src/store.ts:11116](../../packages/store/src/store.ts#L11116) `Store/sortIdsCurrentProgress` | `Store.sortIds` (11116); `Store.sortIdsProgress` (11116); `SQLite.all` (11129); `SQLite.prepare` (11129, 11204); `Store.sql` (11129, 11204); `Store.valueListItems` (11137); `rowsById` (11149); `Calculations.globalValue` (11152); `Calculations.unstoredValue` (11153); `Calculations.related` (11159); `SQLite.iterate` (11204) | GATED-STORE |
| [packages/store/src/store.ts:11290](../../packages/store/src/store.ts#L11290) `Store/storedFileId` | `SQLite.get` (11290); `SQLite.prepare` (11290) | CORE |
| [packages/store/src/store.ts:9346](../../packages/store/src/store.ts#L9346) `Store/summaries` | `Calculations.wholeTable` (9346); `Calculations.collect` (9366, 9371) | CORE |
| [packages/store/src/store.ts:9362](../../packages/store/src/store.ts#L9362) `Store/summaries/recs` | `SQLite.iterate` (9362); `SQLite.prepare` (9362); `Store.sql` (9362) | CORE |
| [packages/store/src/store.ts:5938](../../packages/store/src/store.ts#L5938) `Store/takeWebauthnChallenge` | `SQLite.get` (5938); `SQLite.prepare` (5938, 5942); `Store.sql` (5938, 5942) | CORE |
| [packages/store/src/store.ts:7195](../../packages/store/src/store.ts#L7195) `Store/themes` | `SQLite.get` (7195) | CORE |
| [packages/store/src/store.ts:9085](../../packages/store/src/store.ts#L9085) `Store/timeFind` | `Store.query` (9085) | CORE |
| [packages/store/src/store.ts:7520](../../packages/store/src/store.ts#L7520) `Store/toRecord` | `Calculations.value` (7520, 7530); `Calculations.globalValue` (7524); `Calculations.unstoredStyled` (7529) | CORE |
| [packages/store/src/store.ts:5822](../../packages/store/src/store.ts#L5822) `Store/totpAccounts` | `SQLite.all` (5822); `SQLite.prepare` (5822); `Store.sql` (5822) | CORE |
| [packages/store/src/store.ts:1564](../../packages/store/src/store.ts#L1564) `Store/trial` | `Store.sql` (1564) | CORE |
| [packages/store/src/store.ts:1569](../../packages/store/src/store.ts#L1569) `Store/trial/undo` | `Store.sql` (1569) | CORE |
| [packages/store/src/store.ts:11246](../../packages/store/src/store.ts#L11246) `Store/truncate/run` | `Store.sql` (11246, 11248, 11255, 11257, 11259, 11260); `SQLite.prepare` (11248, 11255); `SQLite.all` (11250) | CORE |
| [packages/store/src/store.ts:3708](../../packages/store/src/store.ts#L3708) `Store/unmigratedAccounts` | `SQLite.all` (3708); `SQLite.prepare` (3708); `Store.sql` (3708) | CORE |
| [packages/store/src/store.ts:4855](../../packages/store/src/store.ts#L4855) `Store/unusedAccess` | `SQLite.get` (4855); `SQLite.prepare` (4855, 4864); `Store.sql` (4855, 4864); `SQLite.all` (4864) | CORE |
| [packages/store/src/store.ts:4903](../../packages/store/src/store.ts#L4903) `Store/unusedObjects` | `SQLite.get` (4903); `SQLite.prepare` (4903, 4906); `Store.sql` (4903, 4906); `SQLite.all` (4906) | CORE |
| [packages/store/src/store.ts:6062](../../packages/store/src/store.ts#L6062) `Store/unusedRecoveryHashes` | `SQLite.all` (6062); `SQLite.prepare` (6062); `Store.sql` (6062) | CORE |
| [packages/store/src/store.ts:4685](../../packages/store/src/store.ts#L4685) `Store/unusualAccess` | `Store.auditLog` (4685, 4751) | CORE |
| [packages/store/src/store.ts:9780](../../packages/store/src/store.ts#L9780) `Store/update` | `Store.row` (9780); `Store.sql` (9811, 9812, 9851, 9854) | CORE |
| [packages/store/src/store.ts:9814](../../packages/store/src/store.ts#L9814) `Store/update/undo` | `Store.sql` (9814) | CORE |
| [packages/store/src/store.ts:10244](../../packages/store/src/store.ts#L10244) `Store/updatePortals` | `Store.row` (10244, 10280); `relatedRows` (10281) | CORE |
| [packages/store/src/store.ts:10254](../../packages/store/src/store.ts#L10254) `Store/updatePortals/portal/related` | `relatedIdList` (10254) | CORE |
| [packages/store/src/store.ts:10226](../../packages/store/src/store.ts#L10226) `Store/updateRelated` | `relatedRows` (10226) | CORE |
| [packages/store/src/store.ts:4941](../../packages/store/src/store.ts#L4941) `Store/usageCounting` | `SQLite.get` (4941); `SQLite.prepare` (4941); `Store.sql` (4941) | CORE |
| [packages/store/src/store.ts:9023](../../packages/store/src/store.ts#L9023) `Store/userPrefs` | `SQLite.all` (9023); `SQLite.prepare` (9023); `Store.sql` (9023) | CORE |
| [packages/store/src/store.ts:7905](../../packages/store/src/store.ts#L7905) `Store/valueListItemsCurrent` | `Store.valueListItems` (7905); `Store.get` (7919); `relatedRows` (7920); `Store.row` (7920); `SQLite.iterate` (7922); `SQLite.prepare` (7922); `Store.sql` (7922); `Calculations.related` (7932); `Calculations.value` (7936, 7937) | GATED-STORE |
| [packages/store/src/store.ts:10435](../../packages/store/src/store.ts#L10435) `Store/vaultHeld` | `SQLite.get` (10435); `SQLite.prepare` (10435); `Store.sql` (10435) | CORE |
| [packages/store/src/store.ts:6022](../../packages/store/src/store.ts#L6022) `Store/verifyPasskeyCredential` | `SQLite.get` (6022); `SQLite.prepare` (6022, 6034); `Store.sql` (6022, 6034) | CORE |
| [packages/store/src/store.ts:5851](../../packages/store/src/store.ts#L5851) `Store/verifyTotp` | `SQLite.get` (5851); `SQLite.prepare` (5851, 5858); `Store.sql` (5851, 5858) | CORE |
| [packages/store/src/store.ts:2255](../../packages/store/src/store.ts#L2255) `Store/versionNumber` | `SQLite.get` (2255); `SQLite.prepare` (2255); `Store.sql` (2255) | CORE |
| [packages/store/src/store.ts:2130](../../packages/store/src/store.ts#L2130) `Store/versionTriggers` | `SQLite.get` (2130); `SQLite.prepare` (2130, 2135, 2136); `Store.sql` (2130, 2135, 2136, 2153, 2155, 2156, 2158); `SQLite.all` (2135, 2136) | CORE |
| [packages/store/src/store.ts:2098](../../packages/store/src/store.ts#L2098) `Store/warmSummariesCurrent` | `Calculations.wholeTable` (2098) | CORE |
| [packages/store/src/store.ts:4281](../../packages/store/src/store.ts#L4281) `Store/webViewerChecked` | `SQLite.get` (4281); `SQLite.prepare` (4281); `Store.sql` (4281) | CORE |
| [packages/store/src/store.ts:1856](../../packages/store/src/store.ts#L1856) `Store/withWriteTransaction` | `Store.sql` (1856, 1868, 1874, 1876, 1876) | CORE |
| [packages/store/src/store.ts:7455](../../packages/store/src/store.ts#L7455) `Store/wordIndex` | `Store.sql` (7455, 7463, 7468); `Store.recordCount` (7467); `SQLite.get` (7468); `SQLite.prepare` (7468) | CORE |
| [packages/store/src/store.ts:8603](../../packages/store/src/store.ts#L8603) `Store/writeExternalFile` | `Store.evaluateEach` (8603); `SQLite.prepare` (8626); `Store.sql` (8626) | CORE |
| [packages/store/src/store.ts:8627](../../packages/store/src/store.ts#L8627) `Store/writeExternalFile/taken` | `SQLite.get` (8627) | CORE |
| [packages/store/src/store.ts:5681](../../packages/store/src/store.ts#L5681) `Store/writeObjectUseRows` | `SQLite.prepare` (5681, 5682, 5687); `Store.sql` (5681, 5682, 5687) | CORE |
| [packages/store/src/store.ts:2310](../../packages/store/src/store.ts#L2310) `Store/writeToken` | `SQLite.get` (2310); `SQLite.prepare` (2310); `Store.sql` (2310) | CORE |
| [packages/store/src/store.ts:5653](../../packages/store/src/store.ts#L5653) `Store/writeUsage` | `Store.sql` (5653, 5654, 5656, 5660, 5662) | CORE |
| [packages/store/src/store.ts:5669](../../packages/store/src/store.ts#L5669) `Store/writeUsageRows` | `SQLite.prepare` (5669, 5670, 5676); `Store.sql` (5669, 5670, 5676) | CORE |
| [packages/store/src/sync-apply.ts:352](../../packages/store/src/sync-apply.ts#L352) `applySyncRun` | `Store.container` (352, 353, 383); `Store.containerInfo` (369); `SQLite.prepare` (464, 730, 762, 786); `Store.sql` (464, 730, 762, 786); `SQLite.get` (762, 786) | OPERATOR |
| [packages/store/src/sync-apply.ts:676](../../packages/store/src/sync-apply.ts#L676) `applySyncRun/containerChanges` | `Store.container` (676) | OPERATOR |
| [packages/store/src/sync-apply.ts:485](../../packages/store/src/sync-apply.ts#L485) `applySyncRun/fail` | `SQLite.get` (485); `SQLite.prepare` (485); `Store.sql` (485) | OPERATOR |
| [packages/store/src/sync-apply.ts:825](../../packages/store/src/sync-apply.ts#L825) `applySyncRun/filesToSend` | `SQLite.all` (825); `SQLite.prepare` (825); `Store.sql` (825); `Store.containerInfo` (836); `Store.container` (841) | OPERATOR |
| [packages/store/src/sync-apply.ts:580](../../packages/store/src/sync-apply.ts#L580) `applySyncRun/pullWouldChange` | `Store.container` (580, 584) | OPERATOR |
| [packages/store/src/sync-apply.ts:185](../../packages/store/src/sync-apply.ts#L185) `atomically` | `Store.sql` (185, 188, 191, 192) | OPERATOR |
| [packages/store/src/sync-apply.ts:216](../../packages/store/src/sync-apply.ts#L216) `clearContainersPending` | `SQLite.prepare` (216); `Store.sql` (216) | OPERATOR |
| [packages/store/src/sync-apply.ts:206](../../packages/store/src/sync-apply.ts#L206) `dropMap` | `SQLite.prepare` (206, 207); `Store.sql` (206, 207) | OPERATOR |
| [packages/store/src/sync-apply.ts:178](../../packages/store/src/sync-apply.ts#L178) `finishRow` | `SQLite.prepare` (178); `Store.sql` (178) | OPERATOR |
| [packages/store/src/sync-apply.ts:242](../../packages/store/src/sync-apply.ts#L242) `heldReason` | `SQLite.get` (242); `SQLite.prepare` (242); `Store.sql` (242) | OPERATOR |
| [packages/store/src/sync-apply.ts:247](../../packages/store/src/sync-apply.ts#L247) `holdTable` | `SQLite.prepare` (247); `Store.sql` (247) | OPERATOR |
| [packages/store/src/sync-apply.ts:171](../../packages/store/src/sync-apply.ts#L171) `logRow` | `SQLite.prepare` (171); `Store.sql` (171) | OPERATOR |
| [packages/store/src/sync-apply.ts:211](../../packages/store/src/sync-apply.ts#L211) `markContainersPending` | `SQLite.prepare` (211); `Store.sql` (211) | OPERATOR |
| [packages/store/src/sync-apply.ts:231](../../packages/store/src/sync-apply.ts#L231) `owedContainers` | `SQLite.all` (231); `SQLite.prepare` (231); `Store.sql` (231) | OPERATOR |
| [packages/store/src/sync-apply.ts:268](../../packages/store/src/sync-apply.ts#L268) `readSyncLog` | `SQLite.get` (268); `SQLite.prepare` (268, 270, 271); `Store.sql` (268, 270, 271); `SQLite.all` (270, 271) | OPERATOR |
| [packages/store/src/sync-apply.ts:312](../../packages/store/src/sync-apply.ts#L312) `recordsIn` | `SQLite.get` (312); `SQLite.prepare` (312); `Store.sql` (312) | OPERATOR |
| [packages/store/src/sync-apply.ts:259](../../packages/store/src/sync-apply.ts#L259) `releaseHeldTables` | `SQLite.prepare` (259); `Store.sql` (259) | OPERATOR |
| [packages/store/src/sync-apply.ts:198](../../packages/store/src/sync-apply.ts#L198) `upsertMap` | `SQLite.prepare` (198); `Store.sql` (198) | OPERATOR |
| [packages/store/src/sync.ts:200](../../packages/store/src/sync.ts#L200) `ensureSyncTables` | `Store.sql` (200, 214, 224, 232) | OPERATOR |
| [packages/store/src/sync.ts:273](../../packages/store/src/sync.ts#L273) `lastPullTimestamp` | `SQLite.get` (273); `SQLite.prepare` (273); `Store.sql` (273) | OPERATOR |
| [packages/store/src/sync.ts:45](../../packages/store/src/sync.ts#L45) `openForPlanning` | `SQLite.get` (45, 46); `SQLite.prepare` (45, 46) | OPERATOR |
| [packages/store/src/sync.ts:292](../../packages/store/src/sync.ts#L292) `readLocalRecords` | `SQLite.all` (292); `SQLite.prepare` (292); `Store.sql` (292) | OPERATOR |
| [packages/store/src/sync.ts:252](../../packages/store/src/sync.ts#L252) `readSyncMap` | `SQLite.all` (252); `SQLite.prepare` (252); `Store.sql` (252) | OPERATOR |
| [packages/store/src/sync.ts:190](../../packages/store/src/sync.ts#L190) `tableExists` | `SQLite.get` (190); `SQLite.prepare` (190); `Store.sql` (190) | OPERATOR |
| [packages/store/src/text-styles.ts:22](../../packages/store/src/text-styles.ts#L22) `ensureTextStyles` | `SQLite.all` (22, 26); `SQLite.prepare` (22, 26) | CORE |
| [packages/store/src/text-styles.ts:81](../../packages/store/src/text-styles.ts#L81) `TextStyles/has` | `SQLite.all` (81) | CORE |
| [packages/store/src/text-styles.ts:94](../../packages/store/src/text-styles.ts#L94) `TextStyles/rows` | `SQLite.all` (94) | CORE |
| [packages/store/src/text-styles.ts:73](../../packages/store/src/text-styles.ts#L73) `TextStyles/st` | `SQLite.prepare` (73) | CORE |
| [packages/store/src/trace.ts:159](../../packages/store/src/trace.ts#L159) `traceDatabase/get` | `SQLite.prepare` (159) | CORE |
| [packages/store/src/words.ts:155](../../packages/store/src/words.ts#L155) `WordIndexes/dropAll` | `SQLite.all` (155); `SQLite.prepare` (155) | CORE |
| [packages/store/src/words.ts:78](../../packages/store/src/words.ts#L78) `WordIndexes/ensure` | `SQLite.prepare` (78, 82); `SQLite.get` (81); `SQLite.all` (82) | CORE |
| [packages/store/src/words.ts:85](../../packages/store/src/words.ts#L85) `WordIndexes/ensure/covers` | `SQLite.get` (85, 89); `SQLite.all` (86); `SQLite.prepare` (86, 89) | CORE |
<!-- end generated read-gate inventory -->
