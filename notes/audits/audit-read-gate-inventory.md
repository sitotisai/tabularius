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
| [packages/cli/src/main.ts:727](../../packages/cli/src/main.ts#L727) `accountsWithPasswordOff` | `SQLite.all` (727); `SQLite.prepare` (727) | OPERATOR |
| [packages/cli/src/main.ts:756](../../packages/cli/src/main.ts#L756) `hostedRead` | `SQLite.all` (756, 759); `SQLite.prepare` (756, 759); `Store.sql` (756, 759) | OPERATOR |
| [packages/cli/src/main.ts:2452](../../packages/cli/src/main.ts#L2452) `main` | `Store.orphanContainerReport` (2452); `Store.auditLog` (2925); `SQLite.get` (3187); `SQLite.prepare` (3187) | OPERATOR |
| [packages/scripts/src/data-api-step.ts:104](../../packages/scripts/src/data-api-step.ts#L104) `respond` | `Store.get` (104, 131, 140); `Store.find` (105, 117) | SCRIPT |
| [packages/scripts/src/engine.ts:8211](../../packages/scripts/src/engine.ts#L8211) `ScriptEngine/containerFile` | `Store.get` (8211); `Store.containerId` (8212); `Store.container` (8213) | SCRIPT |
| [packages/scripts/src/engine.ts:5772](../../packages/scripts/src/engine.ts#L5772) `ScriptEngine/design` | `Store.valueListItems` (5772) | SCRIPT |
| [packages/scripts/src/engine.ts:6528](../../packages/scripts/src/engine.ts#L6528) `ScriptEngine/exportField` | `Store.get` (6528); `Store.containerId` (6529); `Store.container` (6531) | SCRIPT |
| [packages/scripts/src/engine.ts:8631](../../packages/scripts/src/engine.ts#L8631) `ScriptEngine/fileMakerRows` | `Store.findIds` (8631); `Store.get` (8636) | SCRIPT |
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
| [packages/scripts/src/engine.ts:3396](../../packages/scripts/src/engine.ts#L3396) `ScriptEngine/findIdsCooperative` | `Store.findIdsProgress` (3396) | SCRIPT |
| [packages/scripts/src/engine.ts:3410](../../packages/scripts/src/engine.ts#L3410) `ScriptEngine/sortIdsCooperative` | `Store.sortIdsProgress` (3410) | SCRIPT |
| [packages/scripts/src/engine.ts:3438](../../packages/scripts/src/engine.ts#L3438) `ScriptEngine/sortIdsProgress` | `Store.sortIdsProgress` (3438); `Store.valueListItems` (3444) | SCRIPT |
| [packages/scripts/src/engine.ts:7464](../../packages/scripts/src/engine.ts#L7464) `ScriptEngine/sourceValue` | `Store.get` (7464); `Store.containerId` (7465); `Store.container` (7466) | SCRIPT |
| [packages/scripts/src/engine.ts:3347](../../packages/scripts/src/engine.ts#L3347) `ScriptEngine/sqlByNaturalLanguage` | `Calculations.translateSQL` (3347); `Calculations.executeSQL` (3354) | SCRIPT |
| [packages/scripts/src/engine.ts:4140](../../packages/scripts/src/engine.ts#L4140) `ScriptEngine/step` | `Store.fieldIndex` (4140) | SCRIPT |
| [packages/scripts/src/engine.ts:5859](../../packages/scripts/src/engine.ts#L5859) `ScriptEngine/valueOf` | `Store.findIds` (5859, 5859); `Store.containerId` (5867) | SCRIPT |
| [packages/scripts/src/engine.ts:9441](../../packages/scripts/src/engine.ts#L9441) `clearRecords` | `SQLite.all` (9441); `SQLite.prepare` (9441) | SCRIPT |
| [packages/scripts/src/recorder.ts:83](../../packages/scripts/src/recorder.ts#L83) `lastSeq` | `Store.auditLog` (83) | DESIGN |
| [packages/scripts/src/recorder.ts:121](../../packages/scripts/src/recorder.ts#L121) `recordRun` | `Store.auditLog` (121) | DESIGN |
| [packages/scripts/src/script-tests.ts:213](../../packages/scripts/src/script-tests.ts#L213) `runCase` | `Store.findIds` (213); `Store.auditLog` (220, 221, 265); `Store.evaluateEach` (248) | DESIGN |
| [packages/scripts/src/testrun.ts:306](../../packages/scripts/src/testrun.ts#L306) `recordWith` | `Store.evaluateEach` (306) | DESIGN |
| [packages/scripts/src/testrun.ts:199](../../packages/scripts/src/testrun.ts#L199) `seedSelections` | `Calculations.globalValue` (199); `Store.find` (204) | DESIGN |
| [packages/scripts/src/testrun.ts:338](../../packages/scripts/src/testrun.ts#L338) `testRun` | `Store.evaluateEach` (338) | DESIGN |
| [packages/scripts/src/testrun.ts:270](../../packages/scripts/src/testrun.ts#L270) `testScript` | `Store.findIds` (270) | DESIGN |
| [packages/server/src/admin.ts:2438](../../packages/server/src/admin.ts#L2438) `Admin/audit` | `Store.auditLog` (2438) | ADMIN |
| [packages/server/src/admin.ts:1143](../../packages/server/src/admin.ts#L1143) `Admin/handle` | `Store.externalContainerReport` (1143); `Store.orphanContainerReport` (1148, 1152) | ADMIN |
| [packages/server/src/admin.ts:2878](../../packages/server/src/admin.ts#L2878) `Admin/status` | `Store.externalContainerCount` (2878) | ADMIN |
| [packages/server/src/admin.ts:2521](../../packages/server/src/admin.ts#L2521) `Admin/viewAs` | `Store.find` (2521) | ADMIN |
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
| [packages/server/src/automations.ts:195](../../packages/server/src/automations.ts#L195) `Saved/delete` | `SQLite.prepare` (195, 197); `Store.sql` (195, 197) | AUTOMATION |
| [packages/server/src/automations.ts:179](../../packages/server/src/automations.ts#L179) `Saved/list` | `SQLite.all` (179); `SQLite.prepare` (179); `Store.sql` (179) | AUTOMATION |
| [packages/server/src/automations.ts:202](../../packages/server/src/automations.ts#L202) `Saved/logRun` | `SQLite.prepare` (202, 204); `Store.sql` (202, 204) | AUTOMATION |
| [packages/server/src/automations.ts:209](../../packages/server/src/automations.ts#L209) `Saved/runs` | `SQLite.all` (209); `SQLite.prepare` (209); `Store.sql` (209) | AUTOMATION |
| [packages/server/src/automations.ts:189](../../packages/server/src/automations.ts#L189) `Saved/save` | `SQLite.prepare` (189); `Store.sql` (189) | AUTOMATION |
| [packages/server/src/automations.ts:168](../../packages/server/src/automations.ts#L168) `Saved/table` | `Store.sql` (168, 169) | AUTOMATION |
| [packages/server/src/automations.ts:308](../../packages/server/src/automations.ts#L308) `dryRunAutomation` | `Store.canViewRecord` (308); `Store.findIds` (308); `Store.auditLog` (324, 352, 360); `Store.select` (337); `Store.evaluate` (353) | AUTOMATION |
| [packages/server/src/automations.ts:307](../../packages/server/src/automations.ts#L307) `dryRunAutomation/truth` | `Store.evaluateEach` (307) | AUTOMATION |
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
| [packages/server/src/cleanup.ts:1051](../../packages/server/src/cleanup.ts#L1051) `CleanupJournal/add` | `SQLite.prepare` (1051); `Store.sql` (1051) | CLEANUP |
| [packages/server/src/cleanup.ts:1046](../../packages/server/src/cleanup.ts#L1046) `CleanupJournal/append` | `SQLite.prepare` (1046); `Store.sql` (1046) | CLEANUP |
| [packages/server/src/cleanup.ts:1037](../../packages/server/src/cleanup.ts#L1037) `CleanupJournal/constructor` | `Store.sql` (1037) | CLEANUP |
| [packages/server/src/cleanup.ts:1057](../../packages/server/src/cleanup.ts#L1057) `CleanupJournal/get` | `SQLite.get` (1057); `SQLite.prepare` (1057); `Store.sql` (1057) | CLEANUP |
| [packages/server/src/cleanup.ts:1062](../../packages/server/src/cleanup.ts#L1062) `CleanupJournal/list` | `SQLite.all` (1062); `SQLite.prepare` (1062); `Store.sql` (1062) | CLEANUP |
| [packages/server/src/cleanup.ts:1066](../../packages/server/src/cleanup.ts#L1066) `CleanupJournal/markUndone` | `SQLite.prepare` (1066); `Store.sql` (1066) | CLEANUP |
| [packages/server/src/cleanup.ts:747](../../packages/server/src/cleanup.ts#L747) `applyCleanup/apply` | `Store.findIds` (747, 757); `SQLite.all` (748); `SQLite.prepare` (748, 785); `Store.sql` (748, 785); `SQLite.get` (785) | CLEANUP |
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
| [packages/server/src/conversion-guide.ts:420](../../packages/server/src/conversion-guide.ts#L420) `ConversionGuides/save` | `SQLite.prepare` (420); `Store.sql` (420) | DESIGN |
| [packages/server/src/conversion-guide.ts:411](../../packages/server/src/conversion-guide.ts#L411) `ConversionGuides/saved` | `SQLite.get` (411); `SQLite.prepare` (411); `Store.sql` (411) | DESIGN |
| [packages/server/src/conversion-guide.ts:401](../../packages/server/src/conversion-guide.ts#L401) `ConversionGuides/table` | `Store.sql` (401) | DESIGN |
| [packages/server/src/conversion-guide.ts:138](../../packages/server/src/conversion-guide.ts#L138) `convertedAt` | `SQLite.get` (138); `SQLite.prepare` (138); `Store.sql` (138) | DESIGN |
| [packages/server/src/conversion.ts:345](../../packages/server/src/conversion.ts#L345) `conversionReport` | `Store.externalContainerCheck` (345) | DESIGN |
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
| [packages/server/src/design.ts:730](../../packages/server/src/design.ts#L730) `DesignApi/handle` | `Store.auditLog` (730); `Store.evaluate` (797) | DESIGN |
| [packages/server/src/design.ts:233](../../packages/server/src/design.ts#L233) `containerData` | `Store.query` (233) | DESIGN |
| [packages/server/src/design.ts:242](../../packages/server/src/design.ts#L242) `recordCount` | `Store.query` (242) | DESIGN |
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
| [packages/server/src/docs.ts:155](../../packages/server/src/docs.ts#L155) `count` | `Store.query` (155) | DESIGN |
| [packages/server/src/dry-run.ts:92](../../packages/server/src/dry-run.ts#L92) `dryRunChanges/runOnce` | `Store.auditLog` (92, 96) | DESIGN |
| [packages/server/src/find-advice.ts:99](../../packages/server/src/find-advice.ts#L99) `findAdvice` | `Store.recordCount` (99) | DESIGN |
| [packages/server/src/formula-preview.ts:31](../../packages/server/src/formula-preview.ts#L31) `previewFormula` | `Store.findIds` (31); `Store.evaluate` (42) | DESIGN |
| [packages/server/src/hosted-record.ts:219](../../packages/server/src/hosted-record.ts#L219) `approveRestoredFiles` | `SQLite.get` (219); `SQLite.prepare` (219, 223) | OPERATOR |
| [packages/server/src/hosted-record.ts:112](../../packages/server/src/hosted-record.ts#L112) `markStore` | `SQLite.get` (112); `SQLite.prepare` (112, 116) | OPERATOR |
| [packages/server/src/hosted-record.ts:71](../../packages/server/src/hosted-record.ts#L71) `peekInstance` | `SQLite.get` (71); `SQLite.prepare` (71) | OPERATOR |
| [packages/server/src/import-mapping.ts:1019](../../packages/server/src/import-mapping.ts#L1019) `applyImportAddStream` | `SQLite.prepare` (1019); `Store.sql` (1019) | IMPORT |
| [packages/server/src/import-mapping.ts:780](../../packages/server/src/import-mapping.ts#L780) `applyImportRun` | `SQLite.prepare` (780); `Store.sql` (780) | IMPORT |
| [packages/server/src/import-mapping.ts:500](../../packages/server/src/import-mapping.ts#L500) `existingKeys` | `Store.viewableIds` (500); `Store.query` (502) | IMPORT |
| [packages/server/src/import-mapping.ts:824](../../packages/server/src/import-mapping.ts#L824) `fileIdentity` | `Store.sql` (824, 825, 826); `SQLite.prepare` (825, 826); `SQLite.get` (826) | IMPORT |
| [packages/server/src/import-mapping.ts:883](../../packages/server/src/import-mapping.ts#L883) `importHistory` | `SQLite.iterate` (883); `SQLite.prepare` (883); `Store.sql` (883) | IMPORT |
| [packages/server/src/import-mapping.ts:812](../../packages/server/src/import-mapping.ts#L812) `journal` | `Store.sql` (812, 815, 816, 817, 818, 819); `SQLite.all` (815); `SQLite.prepare` (815) | IMPORT |
| [packages/server/src/import-mapping.ts:800](../../packages/server/src/import-mapping.ts#L800) `targetKeys` | `SQLite.all` (800); `SQLite.prepare` (800); `Store.sql` (800) | IMPORT |
| [packages/server/src/import-mapping.ts:905](../../packages/server/src/import-mapping.ts#L905) `undoImportRun` | `SQLite.get` (905, 937); `SQLite.prepare` (905, 937, 951); `Store.sql` (905, 937, 951) | IMPORT |
| [packages/server/src/insight.ts:1018](../../packages/server/src/insight.ts#L1018) `checkCalculation` | `Store.findIds` (1018); `Store.evaluate` (1022) | DESIGN |
| [packages/server/src/insight.ts:939](../../packages/server/src/insight.ts#L939) `columnProfile` | `Store.query` (939, 946, 958, 961) | PROFILE |
| [packages/server/src/insight.ts:863](../../packages/server/src/insight.ts#L863) `layoutProfile` | `Store.query` (863) | PROFILE |
| [packages/server/src/insight.ts:859](../../packages/server/src/insight.ts#L859) `layoutProfile/viewableIds` | `Store.viewableIds` (859) | PROFILE |
| [packages/server/src/insight.ts:1201](../../packages/server/src/insight.ts#L1201) `solutionOverview/counts` | `Store.query` (1201) | DESIGN |
| [packages/server/src/insight.ts:396](../../packages/server/src/insight.ts#L396) `webViewerScripts` | `Store.query` (396) | DESIGN |
| [packages/server/src/integrity-check.ts:13](../../packages/server/src/integrity-check.ts#L13) `integrity` | `SQLite.all` (13); `SQLite.prepare` (13, 17); `SQLite.get` (17) | OPERATOR |
| [packages/server/src/integrity-check.ts:55](../../packages/server/src/integrity-check.ts#L55) `pageCheck` | `SQLite.all` (55); `SQLite.prepare` (55, 58); `SQLite.get` (58) | OPERATOR |
| [packages/server/src/live.ts:207](../../packages/server/src/live.ts#L207) `Live/handle` | `Store.canView` (207) | LIVE |
| [packages/server/src/live.ts:281](../../packages/server/src/live.ts#L281) `Live/visibleRecord` | `Store.canViewRecord` (281) | LIVE |
| [packages/server/src/logs.ts:78](../../packages/server/src/logs.ts#L78) `LogShipper/follow` | `SQLite.get` (78); `SQLite.prepare` (78); `Store.sql` (78, 79, 80, 81) | ADMIN |
| [packages/server/src/logs.ts:90](../../packages/server/src/logs.ts#L90) `LogShipper/releaseIfIdle` | `Store.sql` (90) | ADMIN |
| [packages/server/src/mcp-design.ts:510](../../packages/server/src/mcp-design.ts#L510) `registerDesignTools/audit_log` | `Store.auditLog` (510) | DESIGN |
| [packages/server/src/mcp.ts:1484](../../packages/server/src/mcp.ts#L1484) `createMcpServer/check_record` | `Store.get` (1484); `Store.row` (1486) | MCP |
| [packages/server/src/mcp.ts:1205](../../packages/server/src/mcp.ts#L1205) `createMcpServer/evaluate_calculation` | `Store.get` (1205, 1213); `Store.find` (1206); `Store.evaluate` (1207); `Store.row` (1212) | SQL |
| [packages/server/src/mcp.ts:1508](../../packages/server/src/mcp.ts#L1508) `createMcpServer/explain_related` | `Store.get` (1508) | MCP |
| [packages/server/src/mcp.ts:1461](../../packages/server/src/mcp.ts#L1461) `createMcpServer/explain_value` | `Store.get` (1461); `Store.row` (1462) | MCP |
| [packages/server/src/mcp.ts:1085](../../packages/server/src/mcp.ts#L1085) `createMcpServer/find_records` | `Store.find` (1085) | MCP |
| [packages/server/src/mcp.ts:1280](../../packages/server/src/mcp.ts#L1280) `createMcpServer/get_container` | `Store.container` (1280) | SQL |
| [packages/server/src/mcp.ts:1098](../../packages/server/src/mcp.ts#L1098) `createMcpServer/get_record` | `Store.get` (1098) | MCP |
| [packages/server/src/mcp.ts:1304](../../packages/server/src/mcp.ts#L1304) `createMcpServer/sql_query` | `Store.queryWithOrigins` (1304) | SQL |
| [packages/server/src/mcp.ts:1148](../../packages/server/src/mcp.ts#L1148) `createMcpServer/update_record` | `Store.get` (1148, 1152) | MCP |
| [packages/server/src/mcp.ts:2405](../../packages/server/src/mcp.ts#L2405) `registerResources/audit` | `Store.auditLog` (2405) | MCP |
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
| [packages/server/src/oauth.ts:86](../../packages/server/src/oauth.ts#L86) `legacyPasswordMark` | `SQLite.get` (86); `SQLite.prepare` (86); `Store.sql` (86) | AUTH |
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
| [packages/server/src/pii.ts:349](../../packages/server/src/pii.ts#L349) `PiiMasker/constructor` | `SQLite.get` (349); `SQLite.prepare` (349); `Store.sql` (349) | REDACTION |
| [packages/server/src/pii.ts:445](../../packages/server/src/pii.ts#L445) `PiiMasker/known` | `SQLite.iterate` (445); `SQLite.prepare` (445); `Store.sql` (445) | REDACTION |
| [packages/server/src/pii.ts:359](../../packages/server/src/pii.ts#L359) `PiiMasker/refresh` | `SQLite.iterate` (359); `SQLite.prepare` (359); `Store.sql` (359) | REDACTION |
| [packages/server/src/pii.ts:417](../../packages/server/src/pii.ts#L417) `PiiMasker/text` | `SQLite.get` (417); `SQLite.prepare` (417); `Store.sql` (417) | REDACTION |
| [packages/server/src/pii.ts:402](../../packages/server/src/pii.ts#L402) `PiiMasker/token` | `SQLite.prepare` (402, 403); `Store.sql` (402, 403); `SQLite.get` (403) | REDACTION |
| [packages/server/src/pii.ts:486](../../packages/server/src/pii.ts#L486) `PiiMasker/unmask` | `SQLite.get` (486); `SQLite.prepare` (486); `Store.sql` (486) | REDACTION |
| [packages/server/src/pii.ts:310](../../packages/server/src/pii.ts#L310) `forgetVault` | `Store.sql` (310) | REDACTION |
| [packages/server/src/pii.ts:124](../../packages/server/src/pii.ts#L124) `holdsOnlyUuids` | `Store.query` (124) | REDACTION |
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
| [packages/server/src/scim.ts:454](../../packages/server/src/scim.ts#L454) `ScimDirectory/remove/scim_user_remove` | `SQLite.prepare` (454); `Store.sql` (454) | AUTH |
| [packages/server/src/scim.ts:353](../../packages/server/src/scim.ts#L353) `ScimDirectory/revokePersonTokens` | `SQLite.all` (353); `SQLite.prepare` (353); `Store.sql` (353) | AUTH |
| [packages/server/src/scim.ts:226](../../packages/server/src/scim.ts#L226) `ScimDirectory/rows` | `SQLite.all` (226); `SQLite.prepare` (226, 231); `Store.sql` (226, 231) | AUTH |
| [packages/server/src/scim.ts:144](../../packages/server/src/scim.ts#L144) `ScimDirectory/save` | `SQLite.prepare` (144); `Store.sql` (144) | AUTH |
| [packages/server/src/scim.ts:255](../../packages/server/src/scim.ts#L255) `ScimDirectory/setMemberships` | `SQLite.prepare` (255); `Store.sql` (255) | AUTH |
| [packages/server/src/scim.ts:136](../../packages/server/src/scim.ts#L136) `ScimDirectory/settings` | `SQLite.get` (136); `SQLite.prepare` (136); `Store.sql` (136) | AUTH |
| [packages/server/src/scim.ts:123](../../packages/server/src/scim.ts#L123) `ScimDirectory/table` | `Store.sql` (123, 125); `SQLite.all` (125); `SQLite.prepare` (125) | AUTH |
| [packages/server/src/scim.ts:427](../../packages/server/src/scim.ts#L427) `ScimDirectory/update/scim_user_update` | `SQLite.prepare` (427); `Store.sql` (427) | AUTH |
| [packages/server/src/scim.ts:128](../../packages/server/src/scim.ts#L128) `ScimDirectory/table/scim_identity_column` | `SQLite.all` (128); `SQLite.prepare` (128); `Store.sql` (128, 129) | AUTH |
| [packages/server/src/scim.ts:331](../../packages/server/src/scim.ts#L331) `ScimDirectory/rebind` | `SQLite.prepare` (331); `Store.sql` (331) | AUTH |
| [packages/server/src/script-failure.ts:212](../../packages/server/src/script-failure.ts#L212) `explainScriptFailure` | `Store.row` (212) | RECORD |
| [packages/server/src/security.ts:217](../../packages/server/src/security.ts#L217) `SecurityApi/handle` | `Store.previewRecordRule` (217) | DESIGN |
| [packages/server/src/security.ts:80](../../packages/server/src/security.ts#L80) `importApproximations` | `SQLite.all` (80); `SQLite.prepare` (80); `Store.sql` (80) | DESIGN |
| [packages/server/src/security.ts:116](../../packages/server/src/security.ts#L116) `securityOf` | `Store.pendingChanges` (116) | DESIGN |
| [packages/server/src/semantic-find.ts:52](../../packages/server/src/semantic-find.ts#L52) `semanticFind` | `Store.findIds` (52) | SEARCH |
| [packages/server/src/semantic-find.ts:108](../../packages/server/src/semantic-find.ts#L108) `vectorOf` | `Store.containerId` (108); `Store.containerInfo` (110); `Store.container` (112); `Store.get` (117) | SEARCH |
| [packages/server/src/sql.ts:103](../../packages/server/src/sql.ts#L103) `SqlEndpoint/handle` | `Calculations.translateSQL` (103); `Store.select` (110) | SQL |
| [packages/server/src/sql.ts:163](../../packages/server/src/sql.ts#L163) `SqlEndpoint/tables` | `SQLite.all` (163); `SQLite.prepare` (163); `Store.sql` (163) | SQL |
| [packages/server/src/standby.ts:414](../../packages/server/src/standby.ts#L414) `Standby/copy` | `SQLite.get` (414); `SQLite.prepare` (414) | OPERATOR |
| [packages/server/src/summarize.ts:184](../../packages/server/src/summarize.ts#L184) `summarizeByRecord` | `Store.evaluateEach` (184); `Store.row` (186) | SUMMARY |
| [packages/server/src/summarize.ts:69](../../packages/server/src/summarize.ts#L69) `summarizeRecords` | `Store.findIds` (69); `Store.select` (126, 133, 143) | SUMMARY |
| [packages/server/src/sync-console.ts:458](../../packages/server/src/sync-console.ts#L458) `SyncConsole/runCheck` | `Store.sql` (458) | DESIGN |
| [packages/server/src/sync-console.ts:463](../../packages/server/src/sync-console.ts#L463) `SyncConsole/runCheck/assertActive` | `Store.sql` (463) | DESIGN |
| [packages/server/src/warm-worker.ts:34](../../packages/server/src/warm-worker.ts#L34) `message` | `Store.find` (34) | INTERNAL |
| [packages/server/src/warm-worker.ts:19](../../packages/server/src/warm-worker.ts#L19) `message/count` | `Store.recordCount` (19) | INTERNAL |
| [packages/server/src/webclient.ts:1707](../../packages/server/src/webclient.ts#L1707) `WebClient/aiReplace` | `Store.canView` (1707); `Store.getMany` (1723) | WEB |
| [packages/server/src/webclient.ts:1891](../../packages/server/src/webclient.ts#L1891) `WebClient/button` | `Store.findIds` (1891, 1941); `Store.evaluateEach` (1900, 1901) | WEB |
| [packages/server/src/webclient.ts:1293](../../packages/server/src/webclient.ts#L1293) `WebClient/charts` | `Calculations.context` (1293); `Store.canView` (1321); `Store.evaluateEach` (1330, 1334); `Store.evaluateRows` (1339, 1341) | WEB |
| [packages/server/src/webclient.ts:1284](../../packages/server/src/webclient.ts#L1284) `WebClient/charts/foundSet` | `Store.findIds` (1284) | WEB |
| [packages/server/src/webclient.ts:1324](../../packages/server/src/webclient.ts#L1324) `WebClient/charts/get` | `Store.get` (1324) | WEB |
| [packages/server/src/webclient.ts:694](../../packages/server/src/webclient.ts#L694) `WebClient/explain` | `Store.get` (694); `Store.row` (727, 740) | WEB |
| [packages/server/src/webclient.ts:1513](../../packages/server/src/webclient.ts#L1513) `WebClient/exportRecords` | `Store.getMany` (1513) | WEB |
| [packages/server/src/webclient.ts:1200](../../packages/server/src/webclient.ts#L1200) `WebClient/foundIds` | `Store.findIds` (1200) | WEB |
| [packages/server/src/webclient.ts:1244](../../packages/server/src/webclient.ts#L1244) `WebClient/foundSetPortal` | `Store.foundSetRows` (1244, 1251) | WEB |
| [packages/server/src/webclient.ts:1783](../../packages/server/src/webclient.ts#L1783) `WebClient/groups` | `Store.findIds` (1783); `Store.groupSummaries` (1789) | WEB |
| [packages/server/src/webclient.ts:555](../../packages/server/src/webclient.ts#L555) `WebClient/history` | `Store.get` (555) | WEB |
| [packages/server/src/webclient.ts:753](../../packages/server/src/webclient.ts#L753) `WebClient/index` | `Store.fieldIndex` (753) | WEB |
| [packages/server/src/webclient.ts:858](../../packages/server/src/webclient.ts#L858) `WebClient/menus` | `Store.evaluateEach` (858) | WEB |
| [packages/server/src/webclient.ts:1215](../../packages/server/src/webclient.ts#L1215) `WebClient/records` | `Store.getMany` (1215); `Store.find` (1218) | WEB |
| [packages/server/src/webclient.ts:1161](../../packages/server/src/webclient.ts#L1161) `WebClient/refresh` | `Store.previewRow` (1161); `Store.getMany` (1166); `Store.foundSetRows` (1188) | WEB |
| [packages/server/src/webclient.ts:1407](../../packages/server/src/webclient.ts#L1407) `WebClient/streamExportRecords/nextBatch` | `Store.selectIds` (1407); `Store.getMany` (1413) | WEB |
| [packages/server/src/webclient.ts:1075](../../packages/server/src/webclient.ts#L1075) `WebClient/view` | `Store.evaluateEach` (1075, 1099, 1118); `Store.canView` (1093); `Store.previewRow` (1097, 1119); `Store.get` (1110); `Store.row` (1111, 1111) | WEB |
| [packages/server/src/webclient.ts:1096](../../packages/server/src/webclient.ts#L1096) `WebClient/view/get` | `Store.get` (1096) | WEB |
| [packages/server/src/webclient.ts:2673](../../packages/server/src/webclient.ts#L2673) `foundIds` | `Store.findIds` (2673, 2675) | WEB |
| [packages/server/src/webclient.ts:2594](../../packages/server/src/webclient.ts#L2594) `listItems` | `Store.valueListItems` (2594) | WEB |
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
| [packages/store/src/calc.ts:2389](../../packages/store/src/calc.ts#L2389) `Calculations/beforeWrite` | `relatedRows` (2389); `Calculations.related` (2443); `Calculations.context` (2456) | CORE |
| [packages/store/src/calc.ts:629](../../packages/store/src/calc.ts#L629) `Calculations/collect` | `Calculations.collector` (629) | CALC |
| [packages/store/src/calc.ts:660](../../packages/store/src/calc.ts#L660) `Calculations/collector/add` | `Calculations.related` (660) | CALC |
| [packages/store/src/calc.ts:1693](../../packages/store/src/calc.ts#L1693) `Calculations/columnNames` | `SQLite.all` (1693); `SQLite.prepare` (1693); `Store.sql` (1693) | CALC |
| [packages/store/src/calc.ts:2252](../../packages/store/src/calc.ts#L2252) `Calculations/computeColumn` | `Calculations.statement` (2252); `SQLite.get` (2252); `Calculations.value` (2255) | CALC |
| [packages/store/src/calc.ts:2507](../../packages/store/src/calc.ts#L2507) `Calculations/computeStored` | `Calculations.computeStoredStyled` (2507); `Calculations.value` (2507) | CALC |
| [packages/store/src/calc.ts:2522](../../packages/store/src/calc.ts#L2522) `Calculations/computeStoredStyled` | `Calculations.context` (2522) | CORE |
| [packages/store/src/calc.ts:565](../../packages/store/src/calc.ts#L565) `Calculations/computed` | `Calculations.context` (565) | CALC |
| [packages/store/src/calc.ts:1913](../../packages/store/src/calc.ts#L1913) `Calculations/context/executeSQL` | `Calculations.executeSQL` (1913) | CALC |
| [packages/store/src/calc.ts:1762](../../packages/store/src/calc.ts#L1762) `Calculations/context/field` | `Calculations.summary` (1762); `Calculations.globalValue` (1765); `Calculations.value` (1766) | CALC |
| [packages/store/src/calc.ts:1887](../../packages/store/src/calc.ts#L1887) `Calculations/context/get` | `Store.recordCount` (1887, 1894); `Calculations.statement` (1892); `SQLite.get` (1892) | CALC |
| [packages/store/src/calc.ts:1810](../../packages/store/src/calc.ts#L1810) `Calculations/context/lookupNext` | `Store.canViewRecord` (1810) | CALC |
| [packages/store/src/calc.ts:1914](../../packages/store/src/calc.ts#L1914) `Calculations/context/persistentData` | `Store.persistentData` (1914) | CALC |
| [packages/store/src/calc.ts:1915](../../packages/store/src/calc.ts#L1915) `Calculations/context/persistentDataIds` | `Store.persistentDataIds` (1915) | CALC |
| [packages/store/src/calc.ts:1744](../../packages/store/src/calc.ts#L1744) `Calculations/context/records` | `Calculations.firstRelated` (1744) | CALC |
| [packages/store/src/calc.ts:1775](../../packages/store/src/calc.ts#L1775) `Calculations/context/related` | `Calculations.globalValue` (1775); `Calculations.value` (1777, 1788); `Calculations.related` (1790) | CALC |
| [packages/store/src/calc.ts:1825](../../packages/store/src/calc.ts#L1825) `Calculations/context/summary` | `Calculations.value` (1825, 1835); `Calculations.related` (1837); `Calculations.summary` (1855) | CALC |
| [packages/store/src/calc.ts:2215](../../packages/store/src/calc.ts#L2215) `Calculations/defineComputedColumn/fm_computed` | `Calculations.related` (2215) | CALC |
| [packages/store/src/calc.ts:1940](../../packages/store/src/calc.ts#L1940) `Calculations/design` | `Store.valueListItems` (1940) | CALC |
| [packages/store/src/calc.ts:1718](../../packages/store/src/calc.ts#L1718) `Calculations/ensureIndex` | `Store.sql` (1718, 1719) | CALC |
| [packages/store/src/calc.ts:1957](../../packages/store/src/calc.ts#L1957) `Calculations/executeSQL` | `Calculations.translateSQL` (1957); `Store.select` (1995); `Store.sql` (2006) | CALC |
| [packages/store/src/calc.ts:1359](../../packages/store/src/calc.ts#L1359) `Calculations/firstRelated` | `Calculations.related` (1359, 1371, 1386); `Store.viewableIds` (1366); `Calculations.relatedIds` (1369, 1382); `Calculations.statement` (1379); `SQLite.get` (1379) | CALC |
| [packages/store/src/calc.ts:673](../../packages/store/src/calc.ts#L673) `Calculations/foundSummary` | `Calculations.collect` (673) | CALC |
| [packages/store/src/calc.ts:1608](../../packages/store/src/calc.ts#L1608) `Calculations/foundSums` | `Store.sql` (1608) | CALC |
| [packages/store/src/calc.ts:358](../../packages/store/src/calc.ts#L358) `Calculations/globalValue` | `SQLite.get` (358); `SQLite.prepare` (358); `Store.sql` (358) | CALC |
| [packages/store/src/calc.ts:746](../../packages/store/src/calc.ts#L746) `Calculations/globalsKey` | `Calculations.globalValue` (746) | CALC |
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
| [packages/store/src/calc.ts:2183](../../packages/store/src/calc.ts#L2183) `Calculations/shareColumn` | `Store.recordCount` (2183) | CALC |
| [packages/store/src/calc.ts:1704](../../packages/store/src/calc.ts#L1704) `Calculations/statement` | `SQLite.prepare` (1704); `Store.sql` (1704) | CALC |
| [packages/store/src/calc.ts:1540](../../packages/store/src/calc.ts#L1540) `Calculations/storedRelatedValues` | `Calculations.statement` (1540); `SQLite.iterate` (1540) | CALC |
| [packages/store/src/calc.ts:1285](../../packages/store/src/calc.ts#L1285) `Calculations/storedRows` | `SQLite.iterate` (1285); `SQLite.prepare` (1285); `Store.sql` (1285) | CALC |
| [packages/store/src/calc.ts:684](../../packages/store/src/calc.ts#L684) `Calculations/summary` | `Calculations.collect` (684) | CALC |
| [packages/store/src/calc.ts:921](../../packages/store/src/calc.ts#L921) `Calculations/summaryDependencies` | `Store.sql` (921) | CALC |
| [packages/store/src/calc.ts:636](../../packages/store/src/calc.ts#L636) `Calculations/summaryInput` | `Calculations.value` (636) | CALC |
| [packages/store/src/calc.ts:691](../../packages/store/src/calc.ts#L691) `Calculations/tableSummary` | `Calculations.wholeTable` (691) | CALC |
| [packages/store/src/calc.ts:2119](../../packages/store/src/calc.ts#L2119) `Calculations/translateSQL` | `Store.scopedTableSql` (2119, 2151) | CALC |
| [packages/store/src/calc.ts:2558](../../packages/store/src/calc.ts#L2558) `Calculations/uniqueCollision` | `Calculations.value` (2558) | CALC |
| [packages/store/src/calc.ts:580](../../packages/store/src/calc.ts#L580) `Calculations/unstoredValue` | `Calculations.unstoredStyled` (580); `Calculations.value` (580) | CALC |
| [packages/store/src/calc.ts:2585](../../packages/store/src/calc.ts#L2585) `Calculations/validate` | `Calculations.value` (2585); `Store.valueListItems` (2606); `Calculations.context` (2620) | CALC |
| [packages/store/src/calc.ts:2571](../../packages/store/src/calc.ts#L2571) `Calculations/validate/fail` | `Calculations.context` (2571) | CALC |
| [packages/store/src/calc.ts:530](../../packages/store/src/calc.ts#L530) `Calculations/value` | `Calculations.globalValue` (530) | CALC |
| [packages/store/src/calc.ts:960](../../packages/store/src/calc.ts#L960) `Calculations/wholeTable` | `rowsById` (960); `Store.viewableIds` (960); `Calculations.collect` (962, 1052); `Calculations.value` (1023); `Store.sql` (1031, 1039) | CALC |
| [packages/store/src/calc.ts:2767](../../packages/store/src/calc.ts#L2767) `containerValue` | `Store.containerInfo` (2767); `Store.containerRange` (2774); `Store.container` (2775) | CALC |
| [packages/store/src/calc.ts:2783](../../packages/store/src/calc.ts#L2783) `containerValue/read` | `Store.container` (2783) | CALC |
| [packages/store/src/calc.ts:2796](../../packages/store/src/calc.ts#L2796) `containerValue/value` | `Store.containerRange` (2796) | CALC |
| [packages/store/src/calc.ts:2682](../../packages/store/src/calc.ts#L2682) `nearest` | `SQLite.get` (2682); `SQLite.prepare` (2682); `Store.sql` (2682) | CALC |
| [packages/store/src/calc.ts:3228](../../packages/store/src/calc.ts#L3228) `rowsById/flush` | `Calculations.statement` (3228); `SQLite.iterate` (3228) | CALC |
| [packages/store/src/calc.ts:2914](../../packages/store/src/calc.ts#L2914) `sameValuesElsewhere` | `SQLite.all` (2914); `SQLite.prepare` (2914, 2921, 2923); `Store.sql` (2914, 2921, 2923); `Calculations.value` (2916); `SQLite.get` (2921, 2923) | CALC |
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
| [packages/store/src/privileges.ts:549](../../packages/store/src/privileges.ts#L549) `ensurePrivilegeTables` | `SQLite.all` (549); `SQLite.prepare` (549) | AUTH |
| [packages/store/src/privileges.ts:521](../../packages/store/src/privileges.ts#L521) `privilegeSets` | `SQLite.all` (521); `SQLite.prepare` (521) | AUTH |
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
| [packages/store/src/stale-calcs.ts:283](../../packages/store/src/stale-calcs.ts#L283) `RefreshJournal/add` | `SQLite.prepare` (283); `Store.sql` (283) | DESIGN |
| [packages/store/src/stale-calcs.ts:277](../../packages/store/src/stale-calcs.ts#L277) `RefreshJournal/constructor` | `Store.sql` (277) | DESIGN |
| [packages/store/src/stale-calcs.ts:289](../../packages/store/src/stale-calcs.ts#L289) `RefreshJournal/get` | `SQLite.get` (289); `SQLite.prepare` (289); `Store.sql` (289) | DESIGN |
| [packages/store/src/stale-calcs.ts:294](../../packages/store/src/stale-calcs.ts#L294) `RefreshJournal/list` | `SQLite.all` (294); `SQLite.prepare` (294); `Store.sql` (294) | DESIGN |
| [packages/store/src/stale-calcs.ts:298](../../packages/store/src/stale-calcs.ts#L298) `RefreshJournal/markUndone` | `SQLite.prepare` (298); `Store.sql` (298) | DESIGN |
| [packages/store/src/stale-calcs.ts:107](../../packages/store/src/stale-calcs.ts#L107) `current` | `Calculations.computeStored` (107) | DESIGN |
| [packages/store/src/stale-calcs.ts:128](../../packages/store/src/stale-calcs.ts#L128) `findStaleCalcs` | `Store.sql` (128, 135, 158); `Store.recordCount` (133); `SQLite.iterate` (135); `SQLite.prepare` (135) | DESIGN |
| [packages/store/src/stale-calcs.ts:205](../../packages/store/src/stale-calcs.ts#L205) `refreshStaleCalcsBatch` | `Store.sql` (205, 210, 228, 231); `SQLite.iterate` (210); `SQLite.prepare` (210) | DESIGN |
| [packages/store/src/stale-calcs.ts:243](../../packages/store/src/stale-calcs.ts#L243) `undoStaleRefreshBatch` | `Store.sql` (243, 261, 263) | DESIGN |
| [packages/store/src/store-format.ts:50](../../packages/store/src/store-format.ts#L50) `checkFormat` | `SQLite.prepare` (50) | CORE |
| [packages/store/src/store-format.ts:32](../../packages/store/src/store-format.ts#L32) `storedFormat` | `SQLite.get` (32); `SQLite.prepare` (32) | CORE |
| [packages/store/src/store.ts:5273](../../packages/store/src/store.ts#L5273) `Store/accountIdentityId` | `SQLite.get` (5273, 5279); `SQLite.prepare` (5273, 5278, 5279); `Store.sql` (5273, 5278, 5279) | CORE |
| [packages/store/src/store.ts:5267](../../packages/store/src/store.ts#L5267) `Store/accountIdentityIdIfSet` | `SQLite.get` (5267); `SQLite.prepare` (5267); `Store.sql` (5267) | CORE |
| [packages/store/src/store.ts:5229](../../packages/store/src/store.ts#L5229) `Store/accountInactive` | `SQLite.get` (5229); `SQLite.prepare` (5229); `Store.sql` (5229) | CORE |
| [packages/store/src/store.ts:5426](../../packages/store/src/store.ts#L5426) `Store/accountLocalOnly` | `SQLite.get` (5426); `SQLite.prepare` (5426); `Store.sql` (5426) | CORE |
| [packages/store/src/store.ts:6295](../../packages/store/src/store.ts#L6295) `Store/accountPrivilegeSet` | `SQLite.get` (6295); `SQLite.prepare` (6295); `Store.sql` (6295) | CORE |
| [packages/store/src/store.ts:5431](../../packages/store/src/store.ts#L5431) `Store/accountRequires2fa` | `SQLite.get` (5431); `SQLite.prepare` (5431); `Store.sql` (5431) | CORE |
| [packages/store/src/store.ts:5651](../../packages/store/src/store.ts#L5651) `Store/accountUsage` | `SQLite.get` (5651); `SQLite.prepare` (5651, 5652); `Store.sql` (5651, 5652); `SQLite.all` (5652); `Store.auditLog` (5668) | CORE |
| [packages/store/src/store.ts:3668](../../packages/store/src/store.ts#L3668) `Store/accounts` | `SQLite.all` (3668); `SQLite.prepare` (3668); `Store.sql` (3668) | CORE |
| [packages/store/src/store.ts:3664](../../packages/store/src/store.ts#L3664) `Store/accountsSharingLockout` | `SQLite.all` (3664); `SQLite.prepare` (3664); `Store.sql` (3664) | CORE |
| [packages/store/src/store.ts:8482](../../packages/store/src/store.ts#L8482) `Store/addContainer` | `SQLite.all` (8482); `SQLite.prepare` (8482, 8487, 8501, 8505, 8506); `Store.sql` (8482, 8487, 8501, 8503, 8505, 8506, 8508, 8511); `SQLite.get` (8492); `Store.containerRange` (8494) | CORE |
| [packages/store/src/store.ts:8528](../../packages/store/src/store.ts#L8528) `Store/addExternalContainer` | `SQLite.prepare` (8528); `Store.sql` (8528) | CORE |
| [packages/store/src/store.ts:9005](../../packages/store/src/store.ts#L9005) `Store/addFieldIndex` | `Store.sql` (9005) | CORE |
| [packages/store/src/store.ts:7177](../../packages/store/src/store.ts#L7177) `Store/addImage` | `Store.sql` (7177, 7178); `SQLite.prepare` (7178) | CORE |
| [packages/store/src/store.ts:6345](../../packages/store/src/store.ts#L6345) `Store/addProvisionedAccount` | `SQLite.get` (6345); `SQLite.prepare` (6345, 6349); `Store.sql` (6345, 6349) | CORE |
| [packages/store/src/store.ts:7600](../../packages/store/src/store.ts#L7600) `Store/addRelated` | `relatedRows` (7600); `rowsById` (7633); `firstRelatedEach` (7656) | CORE |
| [packages/store/src/store.ts:3686](../../packages/store/src/store.ts#L3686) `Store/agentNeedsApproval` | `SQLite.get` (3686); `SQLite.prepare` (3686); `Store.sql` (3686) | CORE |
| [packages/store/src/store.ts:6572](../../packages/store/src/store.ts#L6572) `Store/allowedIds` | `SQLite.iterate` (6572); `SQLite.prepare` (6572); `Store.sql` (6572) | CORE |
| [packages/store/src/store.ts:5708](../../packages/store/src/store.ts#L5708) `Store/apiToken` | `SQLite.get` (5708); `SQLite.prepare` (5708, 5726); `Store.sql` (5708, 5726) | CORE |
| [packages/store/src/store.ts:5684](../../packages/store/src/store.ts#L5684) `Store/apiTokens` | `SQLite.all` (5684); `SQLite.prepare` (5684); `Store.sql` (5684) | CORE |
| [packages/store/src/store.ts:3127](../../packages/store/src/store.ts#L3127) `Store/appendSecurityRow` | `Store.sql` (3127) | CORE |
| [packages/store/src/store.ts:4037](../../packages/store/src/store.ts#L4037) `Store/appendSecurityEvent` | `Store.sql` (4037) | CORE |
| [packages/store/src/store.ts:5049](../../packages/store/src/store.ts#L5049) `Store/applyAccountImport` | `Store.sql` (5049, 5057, 5086); `SQLite.get` (5057); `SQLite.prepare` (5057, 5086) | CORE |
| [packages/store/src/store.ts:2428](../../packages/store/src/store.ts#L2428) `Store/applyDesign` | `Store.sql` (2428, 2429, 2449, 2452, 2457, 2473, 2476, 2476); `SQLite.prepare` (2452, 2457) | CORE |
| [packages/store/src/store.ts:3882](../../packages/store/src/store.ts#L3882) `Store/approvePending` | `SQLite.get` (3882); `SQLite.prepare` (3882, 3893); `Store.sql` (3882, 3893) | CORE |
| [packages/store/src/store.ts:2918](../../packages/store/src/store.ts#L2918) `Store/audit/write` | `Store.sql` (2918) | CORE |
| [packages/store/src/store.ts:2540](../../packages/store/src/store.ts#L2540) `Store/auditLog` | `SQLite.all` (2540); `SQLite.prepare` (2540); `Store.sql` (2540) | CORE |
| [packages/store/src/store.ts:1963](../../packages/store/src/store.ts#L1963) `Store/backup` | `Store.sql` (1963) | CORE |
| [packages/store/src/store.ts:3692](../../packages/store/src/store.ts#L3692) `Store/blankPasswordAccounts` | `SQLite.all` (3692); `SQLite.prepare` (3692); `Store.sql` (3692) | CORE |
| [packages/store/src/store.ts:9591](../../packages/store/src/store.ts#L9591) `Store/canView` | `Store.canView` (9591); `Store.row` (9592) | GATED-STORE |
| [packages/store/src/store.ts:9573](../../packages/store/src/store.ts#L9573) `Store/canViewRecord` | `SQLite.get` (9573); `SQLite.prepare` (9573); `Store.sql` (9573) | GATED-STORE |
| [packages/store/src/store.ts:4978](../../packages/store/src/store.ts#L4978) `Store/canonicalAccount` | `SQLite.all` (4978); `SQLite.prepare` (4978); `Store.sql` (4978) | CORE |
| [packages/store/src/store.ts:10680](../../packages/store/src/store.ts#L10680) `Store/cascadeDelete` | `relatedRows` (10680) | CORE |
| [packages/store/src/store.ts:2263](../../packages/store/src/store.ts#L2263) `Store/changeOne` | `Store.sql` (2263, 2265) | CORE |
| [packages/store/src/store.ts:2266](../../packages/store/src/store.ts#L2266) `Store/changeOne/read` | `SQLite.get` (2266); `SQLite.prepare` (2266); `Store.sql` (2266) | CORE |
| [packages/store/src/store.ts:8863](../../packages/store/src/store.ts#L8863) `Store/checkContainerWrite` | `Store.row` (8863) | CORE |
| [packages/store/src/store.ts:10303](../../packages/store/src/store.ts#L10303) `Store/checkEditable` | `Store.row` (10303) | CORE |
| [packages/store/src/store.ts:1509](../../packages/store/src/store.ts#L1509) `Store/checkpoint` | `SQLite.get` (1509); `SQLite.prepare` (1509); `Store.sql` (1509) | CORE |
| [packages/store/src/store.ts:6331](../../packages/store/src/store.ts#L6331) `Store/clearAccountPrivilegeSet` | `SQLite.prepare` (6331); `Store.sql` (6331) | CORE |
| [packages/store/src/store.ts:1531](../../packages/store/src/store.ts#L1531) `Store/close` | `Store.sql` (1531) | CORE |
| [packages/store/src/store.ts:8831](../../packages/store/src/store.ts#L8831) `Store/compactFile` | `Store.sql` (8831, 8832, 8834) | CORE |
| [packages/store/src/store.ts:10804](../../packages/store/src/store.ts#L10804) `Store/computeValuesCurrent` | `Store.computeValues` (10804); `Store.sql` (10810, 10814); `SQLite.all` (10814); `SQLite.prepare` (10814) | GATED-STORE |
| [packages/store/src/store.ts:9242](../../packages/store/src/store.ts#L9242) `Store/computedRows` | `Store.sql` (9242, 9245, 9246, 9247, 9249, 9259, 9260, 9261, 9264); `SQLite.prepare` (9245, 9247, 9249, 9259); `SQLite.iterate` (9249); `Calculations.globalValue` (9252); `Calculations.unstoredValue` (9253); `Calculations.related` (9256); `SQLite.all` (9259) | CORE |
| [packages/store/src/store.ts:5753](../../packages/store/src/store.ts#L5753) `Store/confirmTotp` | `SQLite.get` (5753); `SQLite.prepare` (5753, 5755); `Store.sql` (5753, 5755) | CORE |
| [packages/store/src/store.ts:1151](../../packages/store/src/store.ts#L1151) `Store/constructor` | `Store.sql` (1151, 1153, 1155, 1156, 1160, 1164, 1165, 1174, 1182, 1197, 1202, 1207, 1208, 1212, 1213, 1214, 1221, 1225, 1229, 1230, 1231, 1236, 1237, 1241, 1244, 1245, 1247, 1248, 1251, 1252, 1256, 1257, 1261, 1262, 1265, 1267, 1270, 1271, 1275, 1276, 1280, 1281, 1285, 1286, 1287, 1290, 1291, 1294, 1295, 1297, 1297, 1298, 1298, 1299, 1303, 1305, 1309, 1311, 1314, 1315, 1316, 1319, 1320, 1322, 1324, 1325, 1329, 1330, 1332, 1344, 1346, 1347, 1348, 1348, 1352, 1353); `SQLite.get` (1155, 1174); `SQLite.prepare` (1155, 1174, 1182, 1244, 1245, 1248, 1251, 1256, 1261, 1270, 1275, 1280, 1290, 1294, 1297, 1298, 1319, 1324, 1329); `SQLite.all` (1244, 1251, 1256, 1261, 1270, 1275, 1280, 1290, 1294, 1297, 1298, 1319, 1324, 1329) | CORE |
| [packages/store/src/store.ts:6111](../../packages/store/src/store.ts#L6111) `Store/consumeRecoveryCode` | `SQLite.prepare` (6111); `Store.sql` (6111) | CORE |
| [packages/store/src/store.ts:8406](../../packages/store/src/store.ts#L8406) `Store/container` | `SQLite.get` (8406); `SQLite.prepare` (8406, 8415); `Store.sql` (8406, 8415); `SQLite.all` (8415) | CORE |
| [packages/store/src/store.ts:8840](../../packages/store/src/store.ts#L8840) `Store/containerId` | `Store.containerId` (8840); `Store.row` (8841) | CORE |
| [packages/store/src/store.ts:8423](../../packages/store/src/store.ts#L8423) `Store/containerInfo` | `SQLite.get` (8423); `SQLite.prepare` (8423); `Store.sql` (8423) | CORE |
| [packages/store/src/store.ts:8387](../../packages/store/src/store.ts#L8387) `Store/containerIntact` | `SQLite.get` (8387); `SQLite.prepare` (8387); `Store.sql` (8387) | CORE |
| [packages/store/src/store.ts:8326](../../packages/store/src/store.ts#L8326) `Store/containerIntegrityReport` | `SQLite.all` (8326); `SQLite.prepare` (8326, 8337); `Store.sql` (8326, 8337); `SQLite.get` (8337) | CORE |
| [packages/store/src/store.ts:8401](../../packages/store/src/store.ts#L8401) `Store/containerMeta` | `SQLite.get` (8401); `SQLite.prepare` (8401); `Store.sql` (8401) | CORE |
| [packages/store/src/store.ts:8457](../../packages/store/src/store.ts#L8457) `Store/containerRange` | `SQLite.all` (8457); `SQLite.prepare` (8457, 8464); `Store.sql` (8457, 8464); `SQLite.get` (8464) | CORE |
| [packages/store/src/store.ts:8228](../../packages/store/src/store.ts#L8228) `Store/containerReferences` | `SQLite.all` (8228, 8247, 8249, 8255, 8268, 8279, 8293); `SQLite.prepare` (8228, 8247, 8249, 8255, 8268, 8279, 8291, 8293); `Store.sql` (8228, 8247, 8249, 8255, 8268, 8279, 8291, 8293); `SQLite.get` (8291); `Store.row` (8302) | CORE |
| [packages/store/src/store.ts:10784](../../packages/store/src/store.ts#L10784) `Store/countIds` | `Store.countIds` (10784); `SQLite.get` (10788); `SQLite.prepare` (10788); `Store.sql` (10788) | GATED-STORE |
| [packages/store/src/store.ts:9622](../../packages/store/src/store.ts#L9622) `Store/create` | `SQLite.get` (9622); `SQLite.prepare` (9622, 9635); `Store.sql` (9622, 9635) | CORE |
| [packages/store/src/store.ts:5484](../../packages/store/src/store.ts#L5484) `Store/createApiToken` | `SQLite.get` (5484, 5512); `SQLite.prepare` (5484, 5511, 5512, 5522); `Store.sql` (5484, 5511, 5512, 5522) | CORE |
| [packages/store/src/store.ts:4990](../../packages/store/src/store.ts#L4990) `Store/createLocalAccount` | `SQLite.prepare` (4990); `Store.sql` (4990) | CORE |
| [packages/store/src/store.ts:3658](../../packages/store/src/store.ts#L3658) `Store/credentialIdentity` | `SQLite.get` (3658); `SQLite.prepare` (3658); `Store.sql` (3658) | CORE |
| [packages/store/src/store.ts:5405](../../packages/store/src/store.ts#L5405) `Store/credentialStamp` | `SQLite.get` (5405); `SQLite.prepare` (5405); `Store.sql` (5405) | CORE |
| [packages/store/src/store.ts:2053](../../packages/store/src/store.ts#L2053) `Store/dataVersion` | `SQLite.get` (2053); `SQLite.prepare` (2053); `Store.sql` (2053) | CORE |
| [packages/store/src/store.ts:11342](../../packages/store/src/store.ts#L11342) `Store/decimalViewSql` | `SQLite.all` (11342); `SQLite.prepare` (11342) | CORE |
| [packages/store/src/store.ts:10346](../../packages/store/src/store.ts#L10346) `Store/delete` | `Store.row` (10346) | CORE |
| [packages/store/src/store.ts:10354](../../packages/store/src/store.ts#L10354) `Store/delete/run` | `SQLite.get` (10354); `SQLite.prepare` (10354, 10359); `Store.sql` (10354, 10359) | CORE |
| [packages/store/src/store.ts:5144](../../packages/store/src/store.ts#L5144) `Store/deleteAccount` | `SQLite.prepare` (5144, 5148, 5149, 5150, 5151, 5152, 5153, 5154, 5155, 5162, 5164, 5166, 5168, 5172); `Store.sql` (5144, 5148, 5149, 5150, 5151, 5152, 5153, 5154, 5155, 5162, 5164, 5166, 5168, 5172) | CORE |
| [packages/store/src/store.ts:10427](../../packages/store/src/store.ts#L10427) `Store/deleteBeingUndone` | `SQLite.all` (10427); `SQLite.prepare` (10427); `Store.sql` (10427) | CORE |
| [packages/store/src/store.ts:10439](../../packages/store/src/store.ts#L10439) `Store/deleteEndingTheLifeAt` | `SQLite.get` (10439); `SQLite.prepare` (10439); `Store.sql` (10439) | CORE |
| [packages/store/src/store.ts:6196](../../packages/store/src/store.ts#L6196) `Store/deletePrivilegeSet` | `SQLite.prepare` (6196); `Store.sql` (6196) | CORE |
| [packages/store/src/store.ts:4147](../../packages/store/src/store.ts#L4147) `Store/deleteScriptTest` | `SQLite.prepare` (4147); `Store.sql` (4147) | CORE |
| [packages/store/src/store.ts:3295](../../packages/store/src/store.ts#L3295) `Store/deletedRows` | `SQLite.get` (3295); `SQLite.prepare` (3295, 3297, 3297); `Store.sql` (3295, 3297, 3297); `SQLite.all` (3297, 3297) | CORE |
| [packages/store/src/store.ts:3405](../../packages/store/src/store.ts#L3405) `Store/designEffect` | `Store.sql` (3405, 3411, 3412, 3415, 3421, 3426, 3429, 3435, 3446, 3447, 3449, 3450, 3463, 3464, 3467, 3469, 3475, 3476, 3477, 3483, 3485, 3489, 3492, 3493, 3495, 3498, 3504, 3506, 3513, 3514, 3516, 3517, 3518, 3519, 3526, 3527, 3529, 3529, 3531, 3532, 3533, 3537, 3541, 3543, 3581, 3583, 3585); `SQLite.prepare` (3415, 3446, 3447, 3463, 3464, 3475, 3476, 3483, 3485, 3489, 3493, 3504, 3506, 3519, 3526, 3527, 3529, 3531, 3533, 3537, 3541); `SQLite.get` (3446, 3463, 3475, 3476, 3489, 3493, 3529, 3537); `SQLite.all` (3526, 3527); `SQLite.iterate` (3531) | CORE |
| [packages/store/src/store.ts:3398](../../packages/store/src/store.ts#L3398) `Store/designEffect/renameExcluded` | `SQLite.prepare` (3398); `Store.sql` (3398) | CORE |
| [packages/store/src/store.ts:3382](../../packages/store/src/store.ts#L3382) `Store/designEffect/renameKey` | `SQLite.prepare` (3382); `Store.sql` (3382) | CORE |
| [packages/store/src/store.ts:3336](../../packages/store/src/store.ts#L3336) `Store/designHistory` | `SQLite.all` (3336); `SQLite.prepare` (3336); `Store.sql` (3336) | CORE |
| [packages/store/src/store.ts:5774](../../packages/store/src/store.ts#L5774) `Store/disableTotp` | `SQLite.prepare` (5774); `Store.sql` (5774) | CORE |
| [packages/store/src/store.ts:3593](../../packages/store/src/store.ts#L3593) `Store/dropColumnIndexes` | `SQLite.all` (3593, 3595); `SQLite.prepare` (3593, 3595); `Store.sql` (3593, 3595, 3596) | CORE |
| [packages/store/src/store.ts:9017](../../packages/store/src/store.ts#L9017) `Store/dropFieldIndex` | `SQLite.get` (9017); `SQLite.prepare` (9017); `Store.sql` (9017, 9018) | CORE |
| [packages/store/src/store.ts:9659](../../packages/store/src/store.ts#L9659) `Store/duplicate` | `Store.row` (9659); `SQLite.prepare` (9677); `Store.sql` (9677) | CORE |
| [packages/store/src/store.ts:8644](../../packages/store/src/store.ts#L8644) `Store/embeddedContainerCount` | `SQLite.prepare` (8644); `Store.sql` (8644); `SQLite.get` (8645) | CORE |
| [packages/store/src/store.ts:8630](../../packages/store/src/store.ts#L8630) `Store/embeddedContainers` | `SQLite.prepare` (8630, 8631); `Store.sql` (8630, 8631); `SQLite.all` (8631); `SQLite.get` (8635) | CORE |
| [packages/store/src/store.ts:3321](../../packages/store/src/store.ts#L3321) `Store/emptyDeleted` | `Store.sql` (3321, 3324, 3325, 3327, 3329); `SQLite.prepare` (3325) | CORE |
| [packages/store/src/store.ts:1929](../../packages/store/src/store.ts#L1929) `Store/endTransaction` | `Store.sql` (1929, 1932, 1932) | CORE |
| [packages/store/src/store.ts:5742](../../packages/store/src/store.ts#L5742) `Store/enrollTotp` | `SQLite.prepare` (5742); `Store.sql` (5742) | CORE |
| [packages/store/src/store.ts:3290](../../packages/store/src/store.ts#L3290) `Store/ensureDeleted` | `Store.sql` (3290) | CORE |
| [packages/store/src/store.ts:1363](../../packages/store/src/store.ts#L1363) `Store/ensureNativeIds` | `SQLite.all` (1363, 1375); `SQLite.prepare` (1363, 1366, 1374, 1375); `Store.sql` (1363, 1366, 1369, 1373, 1374, 1375, 1378, 1380) | CORE |
| [packages/store/src/store.ts:2175](../../packages/store/src/store.ts#L2175) `Store/ensureRecordIdHighWater` | `Store.sql` (2175, 2176, 2178, 2180, 2182) | CORE |
| [packages/store/src/store.ts:2194](../../packages/store/src/store.ts#L2194) `Store/ensureRecordIdMarks` | `SQLite.all` (2194, 2197, 2200, 2209); `SQLite.prepare` (2194, 2197, 2200, 2203, 2209, 2212); `Store.sql` (2194, 2197, 2200, 2203, 2209, 2212, 2216, 2217) | CORE |
| [packages/store/src/store.ts:10000](../../packages/store/src/store.ts#L10000) `Store/evaluateCurrent` | `Store.row` (10000, 10000, 10001, 10001); `Calculations.context` (10006); `Store.get` (10007, 10009) | GATED-STORE |
| [packages/store/src/store.ts:10041](../../packages/store/src/store.ts#L10041) `Store/evaluateEachCurrent` | `Store.row` (10041, 10041, 10046); `Calculations.context` (10047); `Store.get` (10049) | GATED-STORE |
| [packages/store/src/store.ts:10103](../../packages/store/src/store.ts#L10103) `Store/evaluateRowsCurrent` | `Store.row` (10103, 10103, 10104, 10104) | GATED-STORE |
| [packages/store/src/store.ts:10082](../../packages/store/src/store.ts#L10082) `Store/evaluateRowsCurrent/each` | `Calculations.context` (10082); `Store.get` (10084) | GATED-STORE |
| [packages/store/src/store.ts:10118](../../packages/store/src/store.ts#L10118) `Store/evaluateRowsCurrent/found/[Symbol.iterator]` | `rowsById` (10118) | GATED-STORE |
| [packages/store/src/store.ts:10140](../../packages/store/src/store.ts#L10140) `Store/evaluateRowsCurrent/key` | `Calculations.context` (10140) | GATED-STORE |
| [packages/store/src/store.ts:3925](../../packages/store/src/store.ts#L3925) `Store/externalAccount` | `SQLite.all` (3925); `SQLite.prepare` (3925); `Store.sql` (3925) | CORE |
| [packages/store/src/store.ts:8149](../../packages/store/src/store.ts#L8149) `Store/externalContainerCheck` | `SQLite.all` (8149); `SQLite.prepare` (8149); `Store.sql` (8149) | CORE |
| [packages/store/src/store.ts:8156](../../packages/store/src/store.ts#L8156) `Store/externalContainerCount` | `SQLite.get` (8156); `SQLite.prepare` (8156); `Store.sql` (8156) | CORE |
| [packages/store/src/store.ts:8165](../../packages/store/src/store.ts#L8165) `Store/externalContainerReport` | `SQLite.all` (8165, 8178); `SQLite.prepare` (8165, 8178); `Store.sql` (8165, 8178) | CORE |
| [packages/store/src/store.ts:5255](../../packages/store/src/store.ts#L5255) `Store/externalIdentityId` | `SQLite.get` (5255, 5262); `SQLite.prepare` (5255, 5261, 5262); `Store.sql` (5255, 5261, 5262) | CORE |
| [packages/store/src/store.ts:8397](../../packages/store/src/store.ts#L8397) `Store/externalOf` | `SQLite.get` (8397); `SQLite.prepare` (8397); `Store.sql` (8397) | CORE |
| [packages/store/src/store.ts:3071](../../packages/store/src/store.ts#L3071) `Store/failureAuditRoom` | `SQLite.get` (3071); `SQLite.prepare` (3071); `Store.sql` (3071) | CORE |
| [packages/store/src/store.ts:7802](../../packages/store/src/store.ts#L7802) `Store/fieldIndexCurrent` | `SQLite.iterate` (7802); `SQLite.prepare` (7802, 7807); `Store.sql` (7802, 7807); `SQLite.all` (7807) | GATED-STORE |
| [packages/store/src/store.ts:9057](../../packages/store/src/store.ts#L9057) `Store/find` | `Store.find` (9057) | GATED-STORE |
| [packages/store/src/store.ts:9429](../../packages/store/src/store.ts#L9429) `Store/findCandidates` | `Store.query` (9429) | CORE |
| [packages/store/src/store.ts:9068](../../packages/store/src/store.ts#L9068) `Store/findHere` | `Store.query` (9068, 9073, 9075, 9089, 9091, 9102); `Store.recordCount` (9086); `SQLite.get` (9087, 9091); `SQLite.prepare` (9087, 9091, 9097, 9104, 9113); `Store.sql` (9087, 9091, 9097, 9104, 9113); `SQLite.all` (9097, 9104, 9113) | GATED-STORE |
| [packages/store/src/store.ts:9108](../../packages/store/src/store.ts#L9108) `Store/findHere/[Symbol.iterator]` | `SQLite.iterate` (9108); `SQLite.prepare` (9108); `Store.sql` (9108) | GATED-STORE |
| [packages/store/src/store.ts:10915](../../packages/store/src/store.ts#L10915) `Store/findIdsCurrent` | `Store.findIds` (10915) | GATED-STORE |
| [packages/store/src/store.ts:10851](../../packages/store/src/store.ts#L10851) `Store/findIdsCurrentProgress` | `Store.findIdsProgress` (10851); `Store.query` (10853, 10854, 10867, 10869); `Store.recordCount` (10859, 10887); `SQLite.iterate` (10884); `SQLite.prepare` (10884, 10892, 10893); `Store.sql` (10884, 10892, 10893); `SQLite.get` (10896); `SQLite.all` (10902) | GATED-STORE |
| [packages/store/src/store.ts:10921](../../packages/store/src/store.ts#L10921) `Store/findIdsHere` | `Store.query` (10921, 10926, 10928); `SQLite.iterate` (10939); `SQLite.prepare` (10939); `Store.sql` (10939) | GATED-STORE |
| [packages/store/src/store.ts:9373](../../packages/store/src/store.ts#L9373) `Store/findSource` | `Store.query` (9373); `SQLite.all` (9382, 9399); `SQLite.prepare` (9382, 9390, 9398); `Store.sql` (9382, 9387, 9390, 9395, 9398, 9412, 9414); `Calculations.globalValue` (9404); `Calculations.unstoredValue` (9405); `Calculations.related` (9409) | CORE |
| [packages/store/src/store.ts:3183](../../packages/store/src/store.ts#L3183) `Store/flushDeferredSecurity` | `Store.sql` (3183) | CORE |
| [packages/store/src/store.ts:10394](../../packages/store/src/store.ts#L10394) `Store/forgetStandInValues` | `Store.sql` (10394, 10415); `SQLite.prepare` (10415) | CORE |
| [packages/store/src/store.ts:5111](../../packages/store/src/store.ts#L5111) `Store/forgetStandIns` | `SQLite.prepare` (5111); `Store.sql` (5111) | CORE |
| [packages/store/src/store.ts:7684](../../packages/store/src/store.ts#L7684) `Store/foundSetPage` | `rowsById` (7684) | CORE |
| [packages/store/src/store.ts:7700](../../packages/store/src/store.ts#L7700) `Store/foundSetRowsCurrent` | `Store.viewableIds` (7700); `Store.row` (7716) | GATED-STORE |
| [packages/store/src/store.ts:3844](../../packages/store/src/store.ts#L3844) `Store/gateAgentWrite` | `SQLite.get` (3844); `SQLite.prepare` (3844, 3846); `Store.sql` (3844, 3846) | CORE |
| [packages/store/src/store.ts:6049](../../packages/store/src/store.ts#L6049) `Store/generateRecoveryCodes` | `SQLite.prepare` (6049, 6052); `Store.sql` (6049, 6052) | CORE |
| [packages/store/src/store.ts:9501](../../packages/store/src/store.ts#L9501) `Store/getCurrent` | `Store.get` (9501); `Store.row` (9502, 9502, 9516); `SQLite.all` (9519); `SQLite.prepare` (9519); `Store.sql` (9519) | GATED-STORE |
| [packages/store/src/store.ts:9539](../../packages/store/src/store.ts#L9539) `Store/getManyCurrent` | `Store.getMany` (9539); `SQLite.get` (9557); `SQLite.prepare` (9557); `Store.sql` (9557) | GATED-STORE |
| [packages/store/src/store.ts:9550](../../packages/store/src/store.ts#L9550) `Store/getManyCurrent/[Symbol.iterator]` | `rowsById` (9550) | GATED-STORE |
| [packages/store/src/store.ts:1410](../../packages/store/src/store.ts#L1410) `Store/grantFullAccessClients` | `SQLite.prepare` (1410); `Store.sql` (1410) | CORE |
| [packages/store/src/store.ts:10956](../../packages/store/src/store.ts#L10956) `Store/groupSummariesCurrent` | `Store.groupSummaries` (10956); `Store.viewableIds` (10961); `Calculations.collect` (10977); `rowsById` (10977, 11027); `Calculations.collector` (10999) | GATED-STORE |
| [packages/store/src/store.ts:11025](../../packages/store/src/store.ts#L11025) `Store/groupSummariesCurrent/flush` | `Calculations.collector` (11025) | GATED-STORE |
| [packages/store/src/store.ts:10989](../../packages/store/src/store.ts#L10989) `Store/groupSummariesCurrent/key` | `Calculations.value` (10989); `Calculations.related` (10991) | GATED-STORE |
| [packages/store/src/store.ts:1437](../../packages/store/src/store.ts#L1437) `Store/hasOwnPassword` | `SQLite.get` (1437); `SQLite.prepare` (1437); `Store.sql` (1437) | CORE |
| [packages/store/src/store.ts:5904](../../packages/store/src/store.ts#L5904) `Store/hasPasskey` | `SQLite.get` (5904); `SQLite.prepare` (5904); `Store.sql` (5904) | CORE |
| [packages/store/src/store.ts:1418](../../packages/store/src/store.ts#L1418) `Store/hasProvingPassword` | `SQLite.get` (1418); `SQLite.prepare` (1418); `Store.sql` (1418) | CORE |
| [packages/store/src/store.ts:8971](../../packages/store/src/store.ts#L8971) `Store/hasTable` | `SQLite.get` (8971); `SQLite.prepare` (8971); `Store.sql` (8971) | CORE |
| [packages/store/src/store.ts:5763](../../packages/store/src/store.ts#L5763) `Store/hasTotp` | `SQLite.get` (5763); `SQLite.prepare` (5763); `Store.sql` (5763) | CORE |
| [packages/store/src/store.ts:5234](../../packages/store/src/store.ts#L5234) `Store/identityAllowed` | `SQLite.get` (5234, 5240, 5246); `SQLite.prepare` (5234, 5240, 5246); `Store.sql` (5234, 5240, 5246) | CORE |
| [packages/store/src/store.ts:7154](../../packages/store/src/store.ts#L7154) `Store/image` | `SQLite.get` (7154); `SQLite.prepare` (7154); `Store.sql` (7154) | CORE |
| [packages/store/src/store.ts:7164](../../packages/store/src/store.ts#L7164) `Store/images` | `SQLite.all` (7164); `SQLite.prepare` (7164); `Store.sql` (7164) | CORE |
| [packages/store/src/store.ts:4955](../../packages/store/src/store.ts#L4955) `Store/importAccounts` | `SQLite.all` (4955); `SQLite.prepare` (4955); `Store.sql` (4955) | CORE |
| [packages/store/src/store.ts:1751](../../packages/store/src/store.ts#L1751) `Store/independentWindowWrite` | `SQLite.get` (1751); `SQLite.prepare` (1751, 1759, 1819); `Store.sql` (1751, 1759, 1769, 1797, 1814, 1819, 1822); `SQLite.all` (1759); `Store.row` (1817) | CORE |
| [packages/store/src/store.ts:2230](../../packages/store/src/store.ts#L2230) `Store/nextRecordId` | `SQLite.get` (2230); `SQLite.prepare` (2230); `Store.sql` (2230) | CORE |
| [packages/store/src/store.ts:1596](../../packages/store/src/store.ts#L1596) `Store/securityChainHeadAudit` | `SQLite.get` (1596); `SQLite.prepare` (1596); `Store.sql` (1596) | CORE |
| [packages/store/src/store.ts:8983](../../packages/store/src/store.ts#L8983) `Store/indexedFields` | `SQLite.all` (8983, 8984); `SQLite.prepare` (8983, 8984); `Store.sql` (8983, 8984) | CORE |
| [packages/store/src/store.ts:11375](../../packages/store/src/store.ts#L11375) `Store/internalRoots` | `SQLite.get` (11375); `SQLite.prepare` (11375, 11377); `SQLite.all` (11377) | CORE |
| [packages/store/src/store.ts:3680](../../packages/store/src/store.ts#L3680) `Store/isAgent` | `SQLite.get` (3680); `SQLite.prepare` (3680); `Store.sql` (3680) | CORE |
| [packages/store/src/store.ts:3783](../../packages/store/src/store.ts#L3783) `Store/isExternal` | `SQLite.get` (3783); `SQLite.prepare` (3783); `Store.sql` (3783) | CORE |
| [packages/store/src/store.ts:5818](../../packages/store/src/store.ts#L5818) `Store/issueWebauthnChallenge` | `SQLite.prepare` (5818, 5820, 5821, 5823); `Store.sql` (5818, 5820, 5821, 5823); `SQLite.get` (5820) | CORE |
| [packages/store/src/store.ts:11237](../../packages/store/src/store.ts#L11237) `Store/iterateCommitted` | `SQLite.iterate` (11237) | CORE |
| [packages/store/src/store.ts:1691](../../packages/store/src/store.ts#L1691) `Store/joinTransaction` | `Store.sql` (1691, 1692, 1694, 1696, 1702, 1705) | CORE |
| [packages/store/src/store.ts:10627](../../packages/store/src/store.ts#L10627) `Store/keyStepWork` | `Store.sql` (10627, 10633, 10637, 10639) | CORE |
| [packages/store/src/store.ts:6970](../../packages/store/src/store.ts#L6970) `Store/knownSharedAccount` | `SQLite.get` (6970); `SQLite.prepare` (6970); `Store.sql` (6970) | CORE |
| [packages/store/src/store.ts:4428](../../packages/store/src/store.ts#L4428) `Store/lastSignIns` | `Store.auditLog` (4428) | CORE |
| [packages/store/src/store.ts:10445](../../packages/store/src/store.ts#L10445) `Store/latestDeleteSeq` | `SQLite.get` (10445); `SQLite.prepare` (10445); `Store.sql` (10445) | CORE |
| [packages/store/src/store.ts:7194](../../packages/store/src/store.ts#L7194) `Store/layout` | `SQLite.get` (7194); `SQLite.prepare` (7194); `Store.sql` (7194) | CORE |
| [packages/store/src/store.ts:3353](../../packages/store/src/store.ts#L3353) `Store/layoutHistory` | `SQLite.all` (3353); `SQLite.prepare` (3353); `Store.sql` (3353) | CORE |
| [packages/store/src/store.ts:7084](../../packages/store/src/store.ts#L7084) `Store/layouts` | `SQLite.all` (7084); `SQLite.prepare` (7084); `Store.sql` (7084) | CORE |
| [packages/store/src/store.ts:4728](../../packages/store/src/store.ts#L4728) `Store/leastPrivilege` | `SQLite.all` (4728); `SQLite.prepare` (4728); `Store.sql` (4728) | CORE |
| [packages/store/src/store.ts:5332](../../packages/store/src/store.ts#L5332) `Store/ledgerRow` | `SQLite.get` (5332, 5333); `SQLite.prepare` (5332, 5333); `Store.sql` (5332, 5333) | AUTH |
| [packages/store/src/store.ts:5344](../../packages/store/src/store.ts#L5344) `Store/ledgerWrite` | `Store.sql` (5344, 5345, 5347, 5349, 5352, 5352) | AUTH |
| [packages/store/src/store.ts:5038](../../packages/store/src/store.ts#L5038) `Store/limitAccountImport` | `SQLite.prepare` (5038, 5039, 5042); `Store.sql` (5038, 5039, 5042); `SQLite.get` (5039) | CORE |
| [packages/store/src/store.ts:3633](../../packages/store/src/store.ts#L3633) `Store/linkIdentity` | `SQLite.get` (3633); `SQLite.prepare` (3633); `Store.sql` (3633) | CORE |
| [packages/store/src/store.ts:3625](../../packages/store/src/store.ts#L3625) `Store/linkPrincipal` | `SQLite.get` (3625); `SQLite.prepare` (3625); `Store.sql` (3625) | CORE |
| [packages/store/src/store.ts:4314](../../packages/store/src/store.ts#L4314) `Store/markPiiField` | `SQLite.prepare` (4314); `Store.sql` (4314) | CORE |
| [packages/store/src/store.ts:8122](../../packages/store/src/store.ts#L8122) `Store/markRepeating` | `SQLite.prepare` (8122); `Store.sql` (8122) | CORE |
| [packages/store/src/store.ts:11170](../../packages/store/src/store.ts#L11170) `Store/matchIds` | `Store.matchIds` (11170); `SQLite.all` (11176); `SQLite.prepare` (11176); `Store.sql` (11176) | CORE |
| [packages/store/src/store.ts:1452](../../packages/store/src/store.ts#L1452) `Store/meta` | `SQLite.get` (1452); `SQLite.prepare` (1452); `Store.sql` (1452) | CORE |
| [packages/store/src/store.ts:1006](../../packages/store/src/store.ts#L1006) `Store/metadataVersions` | `SQLite.get` (1006); `SQLite.prepare` (1006); `Store.sql` (1006) | CORE |
| [packages/store/src/store.ts:8759](../../packages/store/src/store.ts#L8759) `Store/moveContainersIn` | `Store.sql` (8759, 8765, 8767, 8768, 8769, 8770, 8790, 8795, 8795, 8806, 8809, 8812, 8819); `SQLite.prepare` (8767, 8768, 8769, 8770, 8806, 8812); `SQLite.get` (8772, 8806, 8812) | CORE |
| [packages/store/src/store.ts:8681](../../packages/store/src/store.ts#L8681) `Store/moveContainersOut` | `Store.sql` (8681, 8689, 8691, 8693, 8698, 8699, 8719, 8725, 8727, 8729, 8729, 8735, 8735, 8740, 8742, 8744, 8744, 8750); `SQLite.get` (8689); `SQLite.prepare` (8689, 8698, 8699); `Store.container` (8701) | CORE |
| [packages/store/src/store.ts:4909](../../packages/store/src/store.ts#L4909) `Store/mustChangePassword` | `SQLite.get` (4909); `SQLite.prepare` (4909); `Store.sql` (4909) | CORE |
| [packages/store/src/store.ts:1388](../../packages/store/src/store.ts#L1388) `Store/nativeIdGuards` | `Store.sql` (1388, 1389, 1391) | CORE |
| [packages/store/src/store.ts:5638](../../packages/store/src/store.ts#L5638) `Store/objectUseSince` | `SQLite.get` (5638); `SQLite.prepare` (5638); `Store.sql` (5638) | CORE |
| [packages/store/src/store.ts:8943](../../packages/store/src/store.ts#L8943) `Store/orderBy` | `Store.valueListItems` (8943) | CORE |
| [packages/store/src/store.ts:8314](../../packages/store/src/store.ts#L8314) `Store/orphanContainerReport` | `SQLite.all` (8314); `SQLite.prepare` (8314); `Store.sql` (8314) | CORE |
| [packages/store/src/store.ts:5870](../../packages/store/src/store.ts#L5870) `Store/passkeyAllowList` | `SQLite.all` (5870); `SQLite.prepare` (5870); `Store.sql` (5870) | CORE |
| [packages/store/src/store.ts:5909](../../packages/store/src/store.ts#L5909) `Store/passkeyIds` | `SQLite.all` (5909); `SQLite.prepare` (5909); `Store.sql` (5909) | CORE |
| [packages/store/src/store.ts:5897](../../packages/store/src/store.ts#L5897) `Store/passkeys` | `SQLite.all` (5897); `SQLite.prepare` (5897); `Store.sql` (5897) | CORE |
| [packages/store/src/store.ts:4948](../../packages/store/src/store.ts#L4948) `Store/passwordDaysRemaining` | `SQLite.get` (4948); `SQLite.prepare` (4948); `Store.sql` (4948) | CORE |
| [packages/store/src/store.ts:3868](../../packages/store/src/store.ts#L3868) `Store/pendingChanges` | `SQLite.all` (3868); `SQLite.prepare` (3868); `Store.sql` (3868) | CORE |
| [packages/store/src/store.ts:1470](../../packages/store/src/store.ts#L1470) `Store/persistentData` | `SQLite.get` (1470) | CORE |
| [packages/store/src/store.ts:1479](../../packages/store/src/store.ts#L1479) `Store/persistentDataIds` | `SQLite.all` (1479) | CORE |
| [packages/store/src/store.ts:1460](../../packages/store/src/store.ts#L1460) `Store/persistentTable` | `Store.sql` (1460) | CORE |
| [packages/store/src/store.ts:10288](../../packages/store/src/store.ts#L10288) `Store/portalContainerTarget` | `Store.row` (10288); `relatedIdList` (10290) | CORE |
| [packages/store/src/store.ts:7739](../../packages/store/src/store.ts#L7739) `Store/portalCountsCurrent` | `Store.canView` (7739); `Store.row` (7766) | GATED-STORE |
| [packages/store/src/store.ts:7977](../../packages/store/src/store.ts#L7977) `Store/portalRows` | `relatedRows` (7977); `relatedIdList` (7978); `Store.viewableSet` (7981); `rowsById` (8006, 8044); `Calculations.related` (8020) | CORE |
| [packages/store/src/store.ts:7988](../../packages/store/src/store.ts#L7988) `Store/portalRows/context` | `Calculations.context` (7988) | CORE |
| [packages/store/src/store.ts:7998](../../packages/store/src/store.ts#L7998) `Store/portalRows/valueOf` | `Calculations.value` (7998) | CORE |
| [packages/store/src/store.ts:2606](../../packages/store/src/store.ts#L2606) `Store/prepared` | `SQLite.prepare` (2606); `Store.sql` (2606) | CORE |
| [packages/store/src/store.ts:5020](../../packages/store/src/store.ts#L5020) `Store/previewAccountImport` | `Store.sql` (5020, 5021, 5030) | CORE |
| [packages/store/src/store.ts:6726](../../packages/store/src/store.ts#L6726) `Store/previewRecordRuleCurrent` | `SQLite.get` (6726); `SQLite.prepare` (6726, 6729); `Store.sql` (6726, 6729); `SQLite.all` (6729); `Calculations.context` (6735, 6751) | CORE |
| [packages/store/src/store.ts:9464](../../packages/store/src/store.ts#L9464) `Store/previewRow` | `Store.row` (9464) | CORE |
| [packages/store/src/store.ts:6124](../../packages/store/src/store.ts#L6124) `Store/privilegeSets` | `Store.sql` (6124) | CORE |
| [packages/store/src/store.ts:2838](../../packages/store/src/store.ts#L2838) `Store/pruneAudit` | `Store.sql` (2838, 2840, 2842); `SQLite.get` (2840); `SQLite.prepare` (2840) | CORE |
| [packages/store/src/store.ts:8349](../../packages/store/src/store.ts#L8349) `Store/purgeOrphanContainers` | `Store.sql` (8349, 8353, 8362, 8365, 8366, 8371, 8372, 8374, 8374); `Store.orphanContainerReport` (8357); `SQLite.get` (8362); `SQLite.prepare` (8362, 8365, 8366) | CORE |
| [packages/store/src/store.ts:11495](../../packages/store/src/store.ts#L11495) `Store/query` | `SQLite.iterate` (11495) | CORE |
| [packages/store/src/store.ts:11535](../../packages/store/src/store.ts#L11535) `Store/queryWithOriginsCurrent` | `SQLite.iterate` (11535); `SQLite.all` (11544, 11547); `SQLite.prepare` (11544, 11547) | CORE |
| [packages/store/src/store.ts:11287](../../packages/store/src/store.ts#L11287) `Store/readOnlyChecked` | `SQLite.prepare` (11287, 11291, 11300, 11305); `SQLite.all` (11291, 11300, 11305) | CORE |
| [packages/store/src/store.ts:3605](../../packages/store/src/store.ts#L3605) `Store/recompute` | `SQLite.prepare` (3605, 3609); `Store.sql` (3605, 3609); `SQLite.iterate` (3609); `Calculations.computeStoredStyled` (3610); `Calculations.value` (3610) | CORE |
| [packages/store/src/store.ts:2621](../../packages/store/src/store.ts#L2621) `Store/recordAsOf` | `SQLite.get` (2621, 2623); `SQLite.prepare` (2621, 2623, 2625, 2626); `Store.sql` (2621, 2623, 2625, 2626); `SQLite.all` (2625, 2626) | CORE |
| [packages/store/src/store.ts:2317](../../packages/store/src/store.ts#L2317) `Store/recordCount` | `SQLite.get` (2317); `SQLite.prepare` (2317); `Store.sql` (2317) | CORE |
| [packages/store/src/store.ts:2698](../../packages/store/src/store.ts#L2698) `Store/recordLife` | `SQLite.all` (2698); `SQLite.prepare` (2698); `Store.sql` (2698) | CORE |
| [packages/store/src/store.ts:5569](../../packages/store/src/store.ts#L5569) `Store/recordObjectUse` | `Store.sql` (5569) | CORE |
| [packages/store/src/store.ts:9990](../../packages/store/src/store.ts#L9990) `Store/recordViewable` | `Store.row` (9990) | GATED-STORE |
| [packages/store/src/store.ts:1517](../../packages/store/src/store.ts#L1517) `Store/recordedFormat` | `Store.sql` (1517) | CORE |
| [packages/store/src/store.ts:8653](../../packages/store/src/store.ts#L8653) `Store/recoverContainersOut` | `SQLite.prepare` (8653); `Store.sql` (8653); `SQLite.get` (8656) | CORE |
| [packages/store/src/store.ts:1620](../../packages/store/src/store.ts#L1620) `Store/recoverPendingExternalFiles` | `Store.sql` (1620, 1622, 1646, 1648); `SQLite.prepare` (1622); `SQLite.get` (1633) | CORE |
| [packages/store/src/store.ts:6067](../../packages/store/src/store.ts#L6067) `Store/recoveryCodesRemaining` | `SQLite.get` (6067); `SQLite.prepare` (6067); `Store.sql` (6067) | CORE |
| [packages/store/src/store.ts:11327](../../packages/store/src/store.ts#L11327) `Store/refreshDecimalSqlViews` | `SQLite.get` (11327); `SQLite.prepare` (11327) | CORE |
| [packages/store/src/store.ts:3774](../../packages/store/src/store.ts#L3774) `Store/refuseLookalikeAccount` | `SQLite.all` (3774); `SQLite.prepare` (3774); `Store.sql` (3774) | CORE |
| [packages/store/src/store.ts:5933](../../packages/store/src/store.ts#L5933) `Store/registerPasskey` | `SQLite.prepare` (5933); `Store.sql` (5933) | CORE |
| [packages/store/src/store.ts:3903](../../packages/store/src/store.ts#L3903) `Store/rejectPending` | `SQLite.get` (3903); `SQLite.prepare` (3903, 3905); `Store.sql` (3903, 3905) | CORE |
| [packages/store/src/store.ts:9216](../../packages/store/src/store.ts#L9216) `Store/relatedCriteria` | `SQLite.iterate` (9216); `SQLite.prepare` (9216); `Store.sql` (9216) | CORE |
| [packages/store/src/store.ts:9213](../../packages/store/src/store.ts#L9213) `Store/relatedCriteria/matched` | `relatedRows` (9213) | CORE |
| [packages/store/src/store.ts:7526](../../packages/store/src/store.ts#L7526) `Store/relatedValues` | `Calculations.globalValue` (7526); `Calculations.unstoredValue` (7528) | CORE |
| [packages/store/src/store.ts:5946](../../packages/store/src/store.ts#L5946) `Store/removePasskey` | `SQLite.get` (5946); `SQLite.prepare` (5946, 5947); `Store.sql` (5946, 5947) | CORE |
| [packages/store/src/store.ts:10465](../../packages/store/src/store.ts#L10465) `Store/restoreDeletedRowLocked` | `SQLite.get` (10465, 10470); `SQLite.prepare` (10465, 10466, 10470, 10480); `Store.sql` (10465, 10466, 10470, 10480); `SQLite.all` (10466) | CORE |
| [packages/store/src/store.ts:2656](../../packages/store/src/store.ts#L2656) `Store/restoreRecord` | `Store.recordAsOf` (2656); `SQLite.get` (2660); `SQLite.prepare` (2660, 2665, 2674, 2685); `Store.sql` (2660, 2665, 2674, 2685) | CORE |
| [packages/store/src/store.ts:2714](../../packages/store/src/store.ts#L2714) `Store/revertAuditEntry` | `SQLite.get` (2714); `SQLite.prepare` (2714); `Store.sql` (2714); `Store.canViewRecord` (2716); `Store.auditLog` (2719) | CORE |
| [packages/store/src/store.ts:5694](../../packages/store/src/store.ts#L5694) `Store/revokeApiToken` | `SQLite.prepare` (5694); `Store.sql` (5694) | CORE |
| [packages/store/src/store.ts:5217](../../packages/store/src/store.ts#L5217) `Store/revokeSignInCredentials` | `SQLite.prepare` (5217, 5218, 5219); `Store.sql` (5217, 5218, 5219) | AUTH |
| [packages/store/src/store.ts:9482](../../packages/store/src/store.ts#L9482) `Store/row` | `SQLite.get` (9482) | CORE |
| [packages/store/src/store.ts:11431](../../packages/store/src/store.ts#L11431) `Store/rowsOf` | `SQLite.iterate` (11431, 11440) | CORE |
| [packages/store/src/store.ts:6531](../../packages/store/src/store.ts#L6531) `Store/ruleOutcome` | `Calculations.context` (6531) | CORE |
| [packages/store/src/store.ts:9327](../../packages/store/src/store.ts#L9327) `Store/runningSummaryValues` | `Store.viewableIds` (9327); `rowsById` (9329); `Calculations.value` (9340, 9346); `Calculations.related` (9357) | GATED-STORE |
| [packages/store/src/store.ts:6153](../../packages/store/src/store.ts#L6153) `Store/savePrivilegeSet` | `SQLite.prepare` (6153, 6161); `Store.sql` (6153, 6161) | AUTH |
| [packages/store/src/store.ts:4138](../../packages/store/src/store.ts#L4138) `Store/saveScriptTest` | `SQLite.prepare` (4138); `Store.sql` (4138) | CORE |
| [packages/store/src/store.ts:6691](../../packages/store/src/store.ts#L6691) `Store/scopedTableSql` | `Store.viewableIds` (6691); `SQLite.all` (6694); `SQLite.prepare` (6694); `Store.sql` (6694) | GATED-STORE |
| [packages/store/src/store.ts:3343](../../packages/store/src/store.ts#L3343) `Store/scriptHistory` | `SQLite.all` (3343); `SQLite.prepare` (3343); `Store.sql` (3343) | CORE |
| [packages/store/src/store.ts:3016](../../packages/store/src/store.ts#L3016) `Store/securityChange` | `Store.sql` (3016, 3018); `SQLite.prepare` (3018) | CORE |
| [packages/store/src/store.ts:2580](../../packages/store/src/store.ts#L2580) `Store/securityEvents` | `Store.auditLog` (2580) | CORE |
| [packages/store/src/store.ts:5418](../../packages/store/src/store.ts#L5418) `Store/securityToken` | `SQLite.get` (5418); `SQLite.prepare` (5418); `Store.sql` (5418) | CORE |
| [packages/store/src/store.ts:11461](../../packages/store/src/store.ts#L11461) `Store/selectHeldCurrent` | `Store.sql` (11461, 11462, 11464); `SQLite.prepare` (11462) | CORE |
| [packages/store/src/store.ts:10770](../../packages/store/src/store.ts#L10770) `Store/selectIdsCurrent` | `Store.selectIds` (10770); `SQLite.all` (10776); `SQLite.prepare` (10776); `Store.sql` (10776) | GATED-STORE |
| [packages/store/src/store.ts:11451](../../packages/store/src/store.ts#L11451) `Store/selectIn` | `Store.select` (11451) | CORE |
| [packages/store/src/store.ts:1983](../../packages/store/src/store.ts#L1983) `Store/selfContainedCopy` | `Store.sql` (1983); `SQLite.all` (1988); `SQLite.prepare` (1988, 1990, 1991, 1992) | CORE |
| [packages/store/src/store.ts:5196](../../packages/store/src/store.ts#L5196) `Store/setAccountActive` | `SQLite.prepare` (5196, 5204, 5205); `Store.sql` (5196, 5204, 5205) | AUTH |
| [packages/store/src/store.ts:5437](../../packages/store/src/store.ts#L5437) `Store/setAccountLocalOnly` | `SQLite.prepare` (5437); `Store.sql` (5437) | CORE |
| [packages/store/src/store.ts:6309](../../packages/store/src/store.ts#L6309) `Store/setAccountPrivilegeSet` | `SQLite.get` (6309); `SQLite.prepare` (6309, 6312, 6316); `Store.sql` (6309, 6312, 6316) | AUTH |
| [packages/store/src/store.ts:5446](../../packages/store/src/store.ts#L5446) `Store/setAccountRequire2fa` | `SQLite.prepare` (5446); `Store.sql` (5446) | CORE |
| [packages/store/src/store.ts:3804](../../packages/store/src/store.ts#L3804) `Store/setAgentAccount` | `SQLite.get` (3804); `SQLite.prepare` (3804, 3810); `Store.sql` (3804, 3810) | CORE |
| [packages/store/src/store.ts:4187](../../packages/store/src/store.ts#L4187) `Store/setAiAllowed` | `SQLite.prepare` (4187); `Store.sql` (4187) | CORE |
| [packages/store/src/store.ts:4272](../../packages/store/src/store.ts#L4272) `Store/setAiPolicy` | `SQLite.prepare` (4272); `Store.sql` (4272) | CORE |
| [packages/store/src/store.ts:6957](../../packages/store/src/store.ts#L6957) `Store/setAllowBlankPasswordFromLan` | `SQLite.prepare` (6957); `Store.sql` (6957) | CORE |
| [packages/store/src/store.ts:2816](../../packages/store/src/store.ts#L2816) `Store/setAuditSettings` | `SQLite.prepare` (2816); `Store.sql` (2816) | CORE |
| [packages/store/src/store.ts:8872](../../packages/store/src/store.ts#L8872) `Store/setContainer` | `Store.sql` (8872); `Store.row` (8878) | CORE |
| [packages/store/src/store.ts:3756](../../packages/store/src/store.ts#L3756) `Store/setExternalAccount` | `SQLite.get` (3756); `SQLite.prepare` (3756, 3761); `Store.sql` (3756, 3761) | CORE |
| [packages/store/src/store.ts:4895](../../packages/store/src/store.ts#L4895) `Store/setMustChangePassword` | `SQLite.prepare` (4895); `Store.sql` (4895) | CORE |
| [packages/store/src/store.ts:4079](../../packages/store/src/store.ts#L4079) `Store/setPasswordPolicy` | `SQLite.prepare` (4079); `Store.sql` (4079) | CORE |
| [packages/store/src/store.ts:1485](../../packages/store/src/store.ts#L1485) `Store/setPersistentData` | `SQLite.prepare` (1485, 1489); `Store.sql` (1485, 1489) | CORE |
| [packages/store/src/store.ts:4292](../../packages/store/src/store.ts#L4292) `Store/setPiiIsolation` | `SQLite.prepare` (4292); `Store.sql` (4292) | CORE |
| [packages/store/src/store.ts:4115](../../packages/store/src/store.ts#L4115) `Store/setRequireTotpForFullAccess` | `SQLite.prepare` (4115); `Store.sql` (4115) | CORE |
| [packages/store/src/store.ts:4204](../../packages/store/src/store.ts#L4204) `Store/setScriptNetwork` | `SQLite.prepare` (4204); `Store.sql` (4204) | CORE |
| [packages/store/src/store.ts:4261](../../packages/store/src/store.ts#L4261) `Store/setSqlRequiresFmxdbc` | `SQLite.prepare` (4261); `Store.sql` (4261) | CORE |
| [packages/store/src/store.ts:9911](../../packages/store/src/store.ts#L9911) `Store/setStoredCalcValues` | `SQLite.prepare` (9911, 9912); `Store.sql` (9911, 9912); `SQLite.get` (9916) | CORE |
| [packages/store/src/store.ts:8975](../../packages/store/src/store.ts#L8975) `Store/setUserPref` | `Store.sql` (8975, 8976, 8977); `SQLite.prepare` (8976, 8977) | CORE |
| [packages/store/src/store.ts:4245](../../packages/store/src/store.ts#L4245) `Store/setWebViewerHosts` | `SQLite.prepare` (4245); `Store.sql` (4245) | CORE |
| [packages/store/src/store.ts:5371](../../packages/store/src/store.ts#L5371) `Store/settleSignIns` | `SQLite.all` (5371, 5377); `SQLite.prepare` (5371, 5377, 5383, 5387, 5389); `Store.sql` (5371, 5377, 5383, 5387, 5389) | AUTH |
| [packages/store/src/store.ts:2114](../../packages/store/src/store.ts#L2114) `Store/shareResults` | `Store.sql` (2114) | CORE |
| [packages/store/src/store.ts:1547](../../packages/store/src/store.ts#L1547) `Store/shipWal` | `Store.sql` (1547) | CORE |
| [packages/store/src/store.ts:5318](../../packages/store/src/store.ts#L5318) `Store/signInBase` | `SQLite.get` (5318); `SQLite.prepare` (5318); `Store.sql` (5318) | AUTH |
| [packages/store/src/store.ts:5320](../../packages/store/src/store.ts#L5320) `Store/signInBase/identity` | `SQLite.get` (5320); `SQLite.prepare` (5320); `Store.sql` (5320) | AUTH |
| [packages/store/src/store.ts:5307](../../packages/store/src/store.ts#L5307) `Store/signInMark` | `SQLite.prepare` (5307); `Store.sql` (5307) | AUTH |
| [packages/store/src/store.ts:11068](../../packages/store/src/store.ts#L11068) `Store/sortIdsCurrentProgress` | `Store.sortIds` (11068); `Store.sortIdsProgress` (11068); `SQLite.all` (11081); `SQLite.prepare` (11081, 11156); `Store.sql` (11081, 11156); `Store.valueListItems` (11089); `rowsById` (11101); `Calculations.globalValue` (11104); `Calculations.unstoredValue` (11105); `Calculations.related` (11111); `SQLite.iterate` (11156) | GATED-STORE |
| [packages/store/src/store.ts:9141](../../packages/store/src/store.ts#L9141) `Store/sortedPage` | `SQLite.iterate` (9141); `SQLite.prepare` (9141, 9156); `Store.sql` (9141, 9156); `SQLite.all` (9156) | CORE |
| [packages/store/src/store.ts:11242](../../packages/store/src/store.ts#L11242) `Store/storedFileId` | `SQLite.get` (11242); `SQLite.prepare` (11242) | CORE |
| [packages/store/src/store.ts:9289](../../packages/store/src/store.ts#L9289) `Store/summaries` | `Calculations.wholeTable` (9289); `Calculations.collect` (9309, 9314) | CORE |
| [packages/store/src/store.ts:9305](../../packages/store/src/store.ts#L9305) `Store/summaries/recs` | `SQLite.iterate` (9305); `SQLite.prepare` (9305); `Store.sql` (9305) | CORE |
| [packages/store/src/store.ts:5884](../../packages/store/src/store.ts#L5884) `Store/takeWebauthnChallenge` | `SQLite.get` (5884); `SQLite.prepare` (5884, 5888); `Store.sql` (5884, 5888) | CORE |
| [packages/store/src/store.ts:9028](../../packages/store/src/store.ts#L9028) `Store/timeFind` | `Store.query` (9028) | CORE |
| [packages/store/src/store.ts:9042](../../packages/store/src/store.ts#L9042) `Store/reportFind` | `Store.query` (9042, 9044, 9045); `Store.recordCount` (9047) | CORE |
| [packages/store/src/store.ts:7463](../../packages/store/src/store.ts#L7463) `Store/toRecord` | `Calculations.value` (7463, 7473); `Calculations.globalValue` (7467); `Calculations.unstoredStyled` (7472) | CORE |
| [packages/store/src/store.ts:5768](../../packages/store/src/store.ts#L5768) `Store/totpAccounts` | `SQLite.all` (5768); `SQLite.prepare` (5768); `Store.sql` (5768) | CORE |
| [packages/store/src/store.ts:1559](../../packages/store/src/store.ts#L1559) `Store/trial` | `Store.sql` (1559) | CORE |
| [packages/store/src/store.ts:1564](../../packages/store/src/store.ts#L1564) `Store/trial/undo` | `Store.sql` (1564) | CORE |
| [packages/store/src/store.ts:11198](../../packages/store/src/store.ts#L11198) `Store/truncate/run` | `Store.sql` (11198, 11200, 11207, 11209, 11211, 11212); `SQLite.prepare` (11200, 11207); `SQLite.all` (11202) | CORE |
| [packages/store/src/store.ts:3703](../../packages/store/src/store.ts#L3703) `Store/unmigratedAccounts` | `SQLite.all` (3703); `SQLite.prepare` (3703); `Store.sql` (3703) | CORE |
| [packages/store/src/store.ts:4801](../../packages/store/src/store.ts#L4801) `Store/unusedAccess` | `SQLite.get` (4801); `SQLite.prepare` (4801, 4810); `Store.sql` (4801, 4810); `SQLite.all` (4810) | CORE |
| [packages/store/src/store.ts:4849](../../packages/store/src/store.ts#L4849) `Store/unusedObjects` | `SQLite.get` (4849); `SQLite.prepare` (4849, 4852); `Store.sql` (4849, 4852); `SQLite.all` (4852) | CORE |
| [packages/store/src/store.ts:6008](../../packages/store/src/store.ts#L6008) `Store/unusedRecoveryHashes` | `SQLite.all` (6008); `SQLite.prepare` (6008); `Store.sql` (6008) | CORE |
| [packages/store/src/store.ts:4631](../../packages/store/src/store.ts#L4631) `Store/unusualAccess` | `Store.auditLog` (4631, 4697) | CORE |
| [packages/store/src/store.ts:9732](../../packages/store/src/store.ts#L9732) `Store/update` | `Store.row` (9732); `Store.sql` (9763, 9764, 9803, 9806) | CORE |
| [packages/store/src/store.ts:9766](../../packages/store/src/store.ts#L9766) `Store/update/undo` | `Store.sql` (9766) | CORE |
| [packages/store/src/store.ts:10196](../../packages/store/src/store.ts#L10196) `Store/updatePortals` | `Store.row` (10196, 10232); `relatedRows` (10233) | CORE |
| [packages/store/src/store.ts:10206](../../packages/store/src/store.ts#L10206) `Store/updatePortals/portal/related` | `relatedIdList` (10206) | CORE |
| [packages/store/src/store.ts:10178](../../packages/store/src/store.ts#L10178) `Store/updateRelated` | `relatedRows` (10178) | CORE |
| [packages/store/src/store.ts:4887](../../packages/store/src/store.ts#L4887) `Store/usageCounting` | `SQLite.get` (4887); `SQLite.prepare` (4887); `Store.sql` (4887) | CORE |
| [packages/store/src/store.ts:8966](../../packages/store/src/store.ts#L8966) `Store/userPrefs` | `SQLite.all` (8966); `SQLite.prepare` (8966); `Store.sql` (8966) | CORE |
| [packages/store/src/store.ts:7848](../../packages/store/src/store.ts#L7848) `Store/valueListItemsCurrent` | `Store.valueListItems` (7848); `Store.get` (7862); `relatedRows` (7863); `Store.row` (7863); `SQLite.iterate` (7865); `SQLite.prepare` (7865); `Store.sql` (7865); `Calculations.related` (7875); `Calculations.value` (7879, 7880) | GATED-STORE |
| [packages/store/src/store.ts:10387](../../packages/store/src/store.ts#L10387) `Store/vaultHeld` | `SQLite.get` (10387); `SQLite.prepare` (10387); `Store.sql` (10387) | CORE |
| [packages/store/src/store.ts:5797](../../packages/store/src/store.ts#L5797) `Store/verifyTotp` | `SQLite.get` (5797); `SQLite.prepare` (5797, 5804); `Store.sql` (5797, 5804) | CORE |
| [packages/store/src/store.ts:2250](../../packages/store/src/store.ts#L2250) `Store/versionNumber` | `SQLite.get` (2250); `SQLite.prepare` (2250); `Store.sql` (2250) | CORE |
| [packages/store/src/store.ts:2125](../../packages/store/src/store.ts#L2125) `Store/versionTriggers` | `SQLite.get` (2125); `SQLite.prepare` (2125, 2130, 2131); `Store.sql` (2125, 2130, 2131, 2148, 2150, 2151, 2153); `SQLite.all` (2130, 2131) | CORE |
| [packages/store/src/store.ts:2093](../../packages/store/src/store.ts#L2093) `Store/warmSummariesCurrent` | `Calculations.wholeTable` (2093) | CORE |
| [packages/store/src/store.ts:4227](../../packages/store/src/store.ts#L4227) `Store/webViewerChecked` | `SQLite.get` (4227); `SQLite.prepare` (4227); `Store.sql` (4227) | CORE |
| [packages/store/src/store.ts:1851](../../packages/store/src/store.ts#L1851) `Store/withWriteTransaction` | `Store.sql` (1851, 1863, 1869, 1871, 1871) | CORE |
| [packages/store/src/store.ts:7398](../../packages/store/src/store.ts#L7398) `Store/wordIndex` | `Store.sql` (7398, 7406, 7411); `Store.recordCount` (7410); `SQLite.get` (7411); `SQLite.prepare` (7411) | CORE |
| [packages/store/src/store.ts:8546](../../packages/store/src/store.ts#L8546) `Store/writeExternalFile` | `Store.evaluateEach` (8546); `SQLite.prepare` (8569); `Store.sql` (8569) | CORE |
| [packages/store/src/store.ts:8570](../../packages/store/src/store.ts#L8570) `Store/writeExternalFile/taken` | `SQLite.get` (8570) | CORE |
| [packages/store/src/store.ts:5627](../../packages/store/src/store.ts#L5627) `Store/writeObjectUseRows` | `SQLite.prepare` (5627, 5628, 5633); `Store.sql` (5627, 5628, 5633) | CORE |
| [packages/store/src/store.ts:2305](../../packages/store/src/store.ts#L2305) `Store/writeToken` | `SQLite.get` (2305); `SQLite.prepare` (2305); `Store.sql` (2305) | CORE |
| [packages/store/src/store.ts:5599](../../packages/store/src/store.ts#L5599) `Store/writeUsage` | `Store.sql` (5599, 5600, 5602, 5606, 5608) | CORE |
| [packages/store/src/store.ts:5615](../../packages/store/src/store.ts#L5615) `Store/writeUsageRows` | `SQLite.prepare` (5615, 5616, 5622); `Store.sql` (5615, 5616, 5622) | CORE |
| [packages/store/src/store.ts:7119](../../packages/store/src/store.ts#L7119) `Store/design` | `SQLite.get` (7119) | CORE |
| [packages/store/src/store.ts:7141](../../packages/store/src/store.ts#L7141) `Store/themes` | `SQLite.get` (7141) | CORE |
| [packages/store/src/store.ts:5968](../../packages/store/src/store.ts#L5968) `Store/verifyPasskeyCredential` | `SQLite.get` (5968); `SQLite.prepare` (5968, 5980); `Store.sql` (5968, 5980) | CORE |
| [packages/store/src/store.ts:6928](../../packages/store/src/store.ts#L6928) `Store/passwordState` | `SQLite.get` (6928); `SQLite.prepare` (6928); `Store.sql` (6928) | CORE |
| [packages/store/src/store.ts:10331](../../packages/store/src/store.ts#L10331) `Store/deleteVisibility` | `Store.canViewRecord` (10331) | CORE |
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
| [packages/store/src/text-styles.ts:81](../../packages/store/src/text-styles.ts#L81) `TextStyles/has` | `SQLite.all` (81) | CORE |
| [packages/store/src/text-styles.ts:94](../../packages/store/src/text-styles.ts#L94) `TextStyles/rows` | `SQLite.all` (94) | CORE |
| [packages/store/src/text-styles.ts:73](../../packages/store/src/text-styles.ts#L73) `TextStyles/st` | `SQLite.prepare` (73) | CORE |
| [packages/store/src/text-styles.ts:22](../../packages/store/src/text-styles.ts#L22) `ensureTextStyles` | `SQLite.all` (22, 26); `SQLite.prepare` (22, 26) | CORE |
| [packages/store/src/trace.ts:159](../../packages/store/src/trace.ts#L159) `traceDatabase/get` | `SQLite.prepare` (159) | CORE |
| [packages/store/src/words.ts:155](../../packages/store/src/words.ts#L155) `WordIndexes/dropAll` | `SQLite.all` (155); `SQLite.prepare` (155) | CORE |
| [packages/store/src/words.ts:78](../../packages/store/src/words.ts#L78) `WordIndexes/ensure` | `SQLite.prepare` (78, 82); `SQLite.get` (81); `SQLite.all` (82) | CORE |
| [packages/store/src/words.ts:85](../../packages/store/src/words.ts#L85) `WordIndexes/ensure/covers` | `SQLite.get` (85, 89); `SQLite.all` (86); `SQLite.prepare` (86, 89) | CORE |
| [packages/store/src/native-compat.ts:61](../../packages/store/src/native-compat.ts#L61) `storedState/meta` | `SQLite.get` (61); `SQLite.prepare` (61) | OPERATOR |
| [packages/store/src/native-compat.ts:91](../../packages/store/src/native-compat.ts#L91) `dateFields` | `SQLite.all` (91); `SQLite.prepare` (91) | OPERATOR |
| [packages/store/src/native-compat.ts:115](../../packages/store/src/native-compat.ts#L115) `inspectUpgrade` | `SQLite.get` (115); `SQLite.prepare` (115, 123); `SQLite.iterate` (123) | OPERATOR |
| [packages/store/src/native-compat.ts:157](../../packages/store/src/native-compat.ts#L157) `upgradeNativeFile` | `SQLite.iterate` (157); `SQLite.prepare` (157, 158, 164) | OPERATOR |
| [packages/server/src/inbound-hooks.ts:290](../../packages/server/src/inbound-hooks.ts#L290) `InboundHooks/claim` | `SQLite.get` (290, 298, 299); `SQLite.prepare` (290, 294, 295, 298, 299, 301) | AUTH |
| [packages/store/src/cross-file.ts:58](../../packages/store/src/cross-file.ts#L58) `CrossFileProofs/read` | `SQLite.get` (58); `SQLite.prepare` (58) | AUTH |
| [packages/store/src/cross-file.ts:115](../../packages/store/src/cross-file.ts#L115) `CrossFileProofs/save` | `SQLite.prepare` (115) | AUTH |
| [packages/store/src/store.ts:3962](../../packages/store/src/store.ts#L3962) `Store/setPasswordOnly` | `SQLite.get` (3962); `SQLite.prepare` (3962, 3968, 3977, 3984, 3985, 3986); `Store.sql` (3962, 3968, 3977, 3984, 3985, 3986) | AUTH |
| [packages/store/src/store.ts:4009](../../packages/store/src/store.ts#L4009) `Store/createAccountOnly` | `SQLite.get` (4009); `SQLite.prepare` (4009, 4013, 4019, 4024, 4029); `Store.sql` (4009, 4013, 4019, 4024, 4029) | CORE |
| [packages/store/src/store.ts:7010](../../packages/store/src/store.ts#L7010) `Store/crossFileBusy` | `Store.sql` (7010) | AUTH |
| [packages/store/src/store.ts:6982](../../packages/store/src/store.ts#L6982) `Store/crossFileHash` | `SQLite.get` (6982); `SQLite.prepare` (6982); `Store.sql` (6982) | AUTH |
<!-- end generated read-gate inventory -->
