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
| [packages/cli/src/doctor.ts:139](../../packages/cli/src/doctor.ts#L139) `accountChecks` | `SQLite.all` (139); `SQLite.prepare` (139) | OPERATOR |
| [packages/cli/src/main.ts:712](../../packages/cli/src/main.ts#L712) `accountsWithPasswordOff` | `SQLite.all` (712); `SQLite.prepare` (712) | OPERATOR |
| [packages/cli/src/main.ts:741](../../packages/cli/src/main.ts#L741) `hostedRead` | `SQLite.all` (741, 744); `SQLite.prepare` (741, 744); `Store.sql` (741, 744) | OPERATOR |
| [packages/cli/src/main.ts:2426](../../packages/cli/src/main.ts#L2426) `main` | `Store.orphanContainerReport` (2426); `Store.auditLog` (2899); `SQLite.get` (3161); `SQLite.prepare` (3161) | OPERATOR |
| [packages/scripts/src/data-api-step.ts:104](../../packages/scripts/src/data-api-step.ts#L104) `respond` | `Store.get` (104, 131, 140); `Store.find` (105, 117) | SCRIPT |
| [packages/scripts/src/engine.ts:8180](../../packages/scripts/src/engine.ts#L8180) `ScriptEngine/containerFile` | `Store.get` (8180); `Store.containerId` (8181); `Store.container` (8182) | SCRIPT |
| [packages/scripts/src/engine.ts:5756](../../packages/scripts/src/engine.ts#L5756) `ScriptEngine/design` | `Store.valueListItems` (5756) | SCRIPT |
| [packages/scripts/src/engine.ts:6512](../../packages/scripts/src/engine.ts#L6512) `ScriptEngine/exportField` | `Store.get` (6512); `Store.containerId` (6513); `Store.container` (6515) | SCRIPT |
| [packages/scripts/src/engine.ts:8600](../../packages/scripts/src/engine.ts#L8600) `ScriptEngine/fileMakerRows` | `Store.findIds` (8600); `Store.get` (8605) | SCRIPT |
| [packages/scripts/src/engine.ts:2351](../../packages/scripts/src/engine.ts#L2351) `ScriptEngine/foundSet` | `Store.findIds` (2351) | SCRIPT |
| [packages/scripts/src/engine.ts:5596](../../packages/scripts/src/engine.ts#L5596) `ScriptEngine/get` | `Store.findIds` (5596); `Store.canViewRecord` (5689); `Store.get` (5725) | SCRIPT |
| [packages/scripts/src/engine.ts:2007](../../packages/scripts/src/engine.ts#L2007) `ScriptEngine/goToLayout` | `Store.findIds` (2007) | SCRIPT |
| [packages/scripts/src/engine.ts:8371](../../packages/scripts/src/engine.ts#L8371) `ScriptEngine/importRecords` | `Store.get` (8371) | SCRIPT |
| [packages/scripts/src/engine.ts:5868](../../packages/scripts/src/engine.ts#L5868) `ScriptEngine/lookupNext` | `Store.get` (5868); `Store.row` (5869); `Calculations.context` (5871) | SCRIPT |
| [packages/scripts/src/engine.ts:5402](../../packages/scripts/src/engine.ts#L5402) `ScriptEngine/newCalcContext/executeSQL` | `Calculations.executeSQL` (5402) | SCRIPT |
| [packages/scripts/src/engine.ts:5410](../../packages/scripts/src/engine.ts#L5410) `ScriptEngine/newCalcContext/persistentData` | `Store.persistentData` (5410) | SCRIPT |
| [packages/scripts/src/engine.ts:5411](../../packages/scripts/src/engine.ts#L5411) `ScriptEngine/newCalcContext/persistentDataIds` | `Store.persistentDataIds` (5411) | SCRIPT |
| [packages/scripts/src/engine.ts:8640](../../packages/scripts/src/engine.ts#L8640) `ScriptEngine/newRecord` | `Store.findIds` (8640) | SCRIPT |
| [packages/scripts/src/engine.ts:9011](../../packages/scripts/src/engine.ts#L9011) `ScriptEngine/quickFind` | `Store.get` (9011) | SCRIPT |
| [packages/scripts/src/engine.ts:5810](../../packages/scripts/src/engine.ts#L5810) `ScriptEngine/record` | `Store.get` (5810) | SCRIPT |
| [packages/scripts/src/engine.ts:5971](../../packages/scripts/src/engine.ts#L5971) `ScriptEngine/relatedIds` | `Store.findIds` (5971); `rowsById` (5979); `Store.select` (5983); `Store.matchIds` (5997); `Store.viewableIds` (6020) | SCRIPT |
| [packages/scripts/src/engine.ts:6005](../../packages/scripts/src/engine.ts#L6005) `ScriptEngine/relatedIds/matching` | `Store.matchIds` (6005) | SCRIPT |
| [packages/scripts/src/engine.ts:6666](../../packages/scripts/src/engine.ts#L6666) `ScriptEngine/relookup` | `Store.get` (6666) | SCRIPT |
| [packages/scripts/src/engine.ts:3540](../../packages/scripts/src/engine.ts#L3540) `ScriptEngine/revertTransaction` | `Store.findIds` (3540) | SCRIPT |
| [packages/scripts/src/engine.ts:3384](../../packages/scripts/src/engine.ts#L3384) `ScriptEngine/findIdsCooperative` | `Store.findIdsProgress` (3384) | SCRIPT |
| [packages/scripts/src/engine.ts:3398](../../packages/scripts/src/engine.ts#L3398) `ScriptEngine/sortIdsCooperative` | `Store.sortIdsProgress` (3398) | SCRIPT |
| [packages/scripts/src/engine.ts:3426](../../packages/scripts/src/engine.ts#L3426) `ScriptEngine/sortIdsProgress` | `Store.sortIdsProgress` (3426); `Store.valueListItems` (3432) | SCRIPT |
| [packages/scripts/src/engine.ts:7433](../../packages/scripts/src/engine.ts#L7433) `ScriptEngine/sourceValue` | `Store.get` (7433); `Store.containerId` (7434); `Store.container` (7435) | SCRIPT |
| [packages/scripts/src/engine.ts:3335](../../packages/scripts/src/engine.ts#L3335) `ScriptEngine/sqlByNaturalLanguage` | `Calculations.translateSQL` (3335); `Calculations.executeSQL` (3342) | SCRIPT |
| [packages/scripts/src/engine.ts:4127](../../packages/scripts/src/engine.ts#L4127) `ScriptEngine/step` | `Store.fieldIndex` (4127) | SCRIPT |
| [packages/scripts/src/engine.ts:5843](../../packages/scripts/src/engine.ts#L5843) `ScriptEngine/valueOf` | `Store.findIds` (5843, 5843); `Store.containerId` (5851) | SCRIPT |
| [packages/scripts/src/engine.ts:9403](../../packages/scripts/src/engine.ts#L9403) `clearRecords` | `SQLite.all` (9403); `SQLite.prepare` (9403) | SCRIPT |
| [packages/scripts/src/recorder.ts:83](../../packages/scripts/src/recorder.ts#L83) `lastSeq` | `Store.auditLog` (83) | DESIGN |
| [packages/scripts/src/recorder.ts:121](../../packages/scripts/src/recorder.ts#L121) `recordRun` | `Store.auditLog` (121) | DESIGN |
| [packages/scripts/src/script-tests.ts:213](../../packages/scripts/src/script-tests.ts#L213) `runCase` | `Store.findIds` (213); `Store.auditLog` (220, 221, 265); `Store.evaluateEach` (248) | DESIGN |
| [packages/scripts/src/testrun.ts:306](../../packages/scripts/src/testrun.ts#L306) `recordWith` | `Store.evaluateEach` (306) | DESIGN |
| [packages/scripts/src/testrun.ts:199](../../packages/scripts/src/testrun.ts#L199) `seedSelections` | `Calculations.globalValue` (199); `Store.find` (204) | DESIGN |
| [packages/scripts/src/testrun.ts:338](../../packages/scripts/src/testrun.ts#L338) `testRun` | `Store.evaluateEach` (338) | DESIGN |
| [packages/scripts/src/testrun.ts:270](../../packages/scripts/src/testrun.ts#L270) `testScript` | `Store.findIds` (270) | DESIGN |
| [packages/server/src/admin.ts:2371](../../packages/server/src/admin.ts#L2371) `Admin/audit` | `Store.auditLog` (2371) | ADMIN |
| [packages/server/src/admin.ts:1091](../../packages/server/src/admin.ts#L1091) `Admin/handle` | `Store.externalContainerReport` (1091); `Store.orphanContainerReport` (1096, 1100) | ADMIN |
| [packages/server/src/admin.ts:2811](../../packages/server/src/admin.ts#L2811) `Admin/status` | `Store.externalContainerCount` (2811) | ADMIN |
| [packages/server/src/admin.ts:2454](../../packages/server/src/admin.ts#L2454) `Admin/viewAs` | `Store.find` (2454) | ADMIN |
| [packages/server/src/agent.ts:316](../../packages/server/src/agent.ts#L316) `dryRunPlan` | `Store.findIds` (316) | DESIGN |
| [packages/server/src/agent.ts:339](../../packages/server/src/agent.ts#L339) `runApprovedStep` | `Store.findIds` (339) | DESIGN |
| [packages/server/src/agent.ts:162](../../packages/server/src/agent.ts#L162) `runStep` | `Store.findIds` (162); `Store.auditLog` (230); `Store.canViewRecord` (242) | DESIGN |
| [packages/server/src/agent.ts:154](../../packages/server/src/agent.ts#L154) `runStep/visible` | `Store.findIds` (154) | DESIGN |
| [packages/server/src/ai-output.ts:147](../../packages/server/src/ai-output.ts#L147) `storedSecretValues` | `Calculations.globalValue` (147); `Store.select` (152) | REDACTION |
| [packages/server/src/ai-policy-sql.ts:49](../../packages/server/src/ai-policy-sql.ts#L49) `sqlFieldRefs` | `SQLite.all` (49, 51); `SQLite.prepare` (49, 51) | POLICY |
| [packages/server/src/ai-policy.ts:355](../../packages/server/src/ai-policy.ts#L355) `sql` | `Store.inspectQuery` (355) | POLICY |
| [packages/server/src/ai-usage.ts:187](../../packages/server/src/ai-usage.ts#L187) `AiUsage/add` | `SQLite.prepare` (187, 190) | AUTH |
| [packages/server/src/ai-usage.ts:227](../../packages/server/src/ai-usage.ts#L227) `AiUsage/importOld` | `SQLite.prepare` (227, 237, 245, 249) | AUTH |
| [packages/server/src/ai-usage.ts:172](../../packages/server/src/ai-usage.ts#L172) `AiUsage/month` | `SQLite.get` (172); `SQLite.prepare` (172) | AUTH |
| [packages/server/src/ai-usage.ts:198](../../packages/server/src/ai-usage.ts#L198) `AiUsage/question` | `SQLite.prepare` (198, 200, 201, 203) | AUTH |
| [packages/server/src/ai-usage.ts:179](../../packages/server/src/ai-usage.ts#L179) `AiUsage/recent` | `SQLite.all` (179); `SQLite.prepare` (179) | AUTH |
| [packages/server/src/ai-usage.ts:165](../../packages/server/src/ai-usage.ts#L165) `AiUsage/today` | `SQLite.get` (165); `SQLite.prepare` (165) | AUTH |
| [packages/server/src/assistant.ts:2152](../../packages/server/src/assistant.ts#L2152) `Assistant/answer` | `Store.find` (2152) | ACCOUNT |
| [packages/server/src/automations.ts:435](../../packages/server/src/automations.ts#L435) `AutomationRunner/changed` | `Store.auditLog` (435) | AUTOMATION |
| [packages/server/src/automations.ts:466](../../packages/server/src/automations.ts#L466) `AutomationRunner/run` | `Store.select` (466); `Store.canViewRecord` (476); `Store.evaluateEach` (479); `Store.evaluate` (485) | AUTOMATION |
| [packages/server/src/automations.ts:512](../../packages/server/src/automations.ts#L512) `AutomationRunner/runDeleted` | `Store.auditLog` (512) | AUTOMATION |
| [packages/server/src/automations.ts:195](../../packages/server/src/automations.ts#L195) `Saved/delete` | `SQLite.prepare` (195, 197); `Store.sql` (195, 197) | AUTOMATION |
| [packages/server/src/automations.ts:179](../../packages/server/src/automations.ts#L179) `Saved/list` | `SQLite.all` (179); `SQLite.prepare` (179); `Store.sql` (179) | AUTOMATION |
| [packages/server/src/automations.ts:202](../../packages/server/src/automations.ts#L202) `Saved/logRun` | `SQLite.prepare` (202, 204); `Store.sql` (202, 204) | AUTOMATION |
| [packages/server/src/automations.ts:209](../../packages/server/src/automations.ts#L209) `Saved/runs` | `SQLite.all` (209); `SQLite.prepare` (209); `Store.sql` (209) | AUTOMATION |
| [packages/server/src/automations.ts:189](../../packages/server/src/automations.ts#L189) `Saved/save` | `SQLite.prepare` (189); `Store.sql` (189) | AUTOMATION |
| [packages/server/src/automations.ts:168](../../packages/server/src/automations.ts#L168) `Saved/table` | `Store.sql` (168, 169) | AUTOMATION |
| [packages/server/src/automations.ts:308](../../packages/server/src/automations.ts#L308) `dryRunAutomation` | `Store.canViewRecord` (308); `Store.findIds` (308); `Store.auditLog` (324, 352, 360); `Store.select` (337); `Store.evaluate` (353) | AUTOMATION |
| [packages/server/src/automations.ts:307](../../packages/server/src/automations.ts#L307) `dryRunAutomation/truth` | `Store.evaluateEach` (307) | AUTOMATION |
| [packages/server/src/backup-verify.ts:188](../../packages/server/src/backup-verify.ts#L188) `integrity` | `SQLite.all` (188); `SQLite.prepare` (188, 192); `SQLite.get` (192) | OPERATOR |
| [packages/server/src/backup-verify.ts:218](../../packages/server/src/backup-verify.ts#L218) `pageCheck` | `SQLite.all` (218); `SQLite.prepare` (218, 221); `SQLite.get` (221) | OPERATOR |
| [packages/server/src/backup-verify.ts:148](../../packages/server/src/backup-verify.ts#L148) `testRestore` | `Store.recordCount` (148) | OPERATOR |
| [packages/server/src/backup.ts:1015](../../packages/server/src/backup.ts#L1015) `accountDifferences/read` | `SQLite.all` (1015, 1017); `SQLite.prepare` (1015, 1017) | OPERATOR |
| [packages/server/src/backup.ts:278](../../packages/server/src/backup.ts#L278) `backupOnceHeld` | `SQLite.get` (278); `SQLite.prepare` (278) | OPERATOR |
| [packages/server/src/backup.ts:1128](../../packages/server/src/backup.ts#L1128) `columnInfo` | `SQLite.all` (1128); `SQLite.prepare` (1128) | OPERATOR |
| [packages/server/src/backup.ts:1072](../../packages/server/src/backup.ts#L1072) `credentialsReadable` | `SQLite.all` (1072); `SQLite.prepare` (1072) | OPERATOR |
| [packages/server/src/backup.ts:1042](../../packages/server/src/backup.ts#L1042) `readNames` | `SQLite.all` (1042); `SQLite.prepare` (1042) | OPERATOR |
| [packages/server/src/backup.ts:1163](../../packages/server/src/backup.ts#L1163) `reconcileCredentials` | `SQLite.all` (1163, 1185, 1200, 1210, 1216); `SQLite.prepare` (1163, 1171, 1185, 1187, 1200, 1201, 1208, 1210, 1211, 1216, 1217, 1221, 1222, 1223); `SQLite.get` (1171, 1221) | OPERATOR |
| [packages/server/src/backup.ts:1190](../../packages/server/src/backup.ts#L1190) `reconcileCredentials/accountColumns` | `SQLite.all` (1190); `SQLite.prepare` (1190) | OPERATOR |
| [packages/server/src/backup.ts:1166](../../packages/server/src/backup.ts#L1166) `reconcileCredentials/has` | `SQLite.all` (1166); `SQLite.prepare` (1166) | OPERATOR |
| [packages/server/src/backup.ts:1099](../../packages/server/src/backup.ts#L1099) `retainCurrentRecordIdMarks` | `SQLite.prepare` (1099, 1110, 1111, 1112); `SQLite.all` (1101, 1111); `SQLite.get` (1110) | OPERATOR |
| [packages/server/src/backup.ts:1338](../../packages/server/src/backup.ts#L1338) `stageRestorePoint` | `SQLite.get` (1338, 1340, 1341); `SQLite.prepare` (1338, 1340, 1341) | OPERATOR |
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
| [packages/server/src/dataapi.ts:2089](../../packages/server/src/dataapi.ts#L2089) `DataApi/route` | `Store.get` (2089, 2310, 2311, 2334, 2342, 2389, 2413, 2433, 2470); `Store.valueListItems` (2104); `Store.find` (2265, 2313, 2504); `Store.findIds` (2269, 2509); `Store.query` (2509) | REST |
| [packages/server/src/dataapi.ts:2217](../../packages/server/src/dataapi.ts#L2217) `DataApi/route/recordOut` | `Store.portalCounts` (2217) | REST |
| [packages/server/src/dataapi.ts:2253](../../packages/server/src/dataapi.ts#L2253) `DataApi/route/shownAs` | `Store.get` (2253) | REST |
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
| [packages/server/src/hosted-record.ts:217](../../packages/server/src/hosted-record.ts#L217) `approveRestoredFiles` | `SQLite.get` (217); `SQLite.prepare` (217, 221) | OPERATOR |
| [packages/server/src/hosted-record.ts:111](../../packages/server/src/hosted-record.ts#L111) `markStore` | `SQLite.get` (111); `SQLite.prepare` (111, 115) | OPERATOR |
| [packages/server/src/hosted-record.ts:70](../../packages/server/src/hosted-record.ts#L70) `peekInstance` | `SQLite.get` (70); `SQLite.prepare` (70) | OPERATOR |
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
| [packages/server/src/live.ts:206](../../packages/server/src/live.ts#L206) `Live/handle` | `Store.canView` (206) | LIVE |
| [packages/server/src/live.ts:280](../../packages/server/src/live.ts#L280) `Live/visibleRecord` | `Store.canViewRecord` (280) | LIVE |
| [packages/server/src/logs.ts:77](../../packages/server/src/logs.ts#L77) `LogShipper/follow` | `SQLite.get` (77); `SQLite.prepare` (77); `Store.sql` (77, 78, 79, 80) | ADMIN |
| [packages/server/src/logs.ts:89](../../packages/server/src/logs.ts#L89) `LogShipper/releaseIfIdle` | `Store.sql` (89) | ADMIN |
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
| [packages/server/src/oauth.ts:891](../../packages/server/src/oauth.ts#L891) `OAuthServer/accessAllowed` | `SQLite.get` (891); `SQLite.prepare` (891) | AUTH |
| [packages/server/src/oauth.ts:509](../../packages/server/src/oauth.ts#L509) `OAuthServer/authorize` | `SQLite.get` (509); `SQLite.prepare` (509, 513, 515, 522, 553, 554) | AUTH |
| [packages/server/src/oauth.ts:490](../../packages/server/src/oauth.ts#L490) `OAuthServer/authorize/done` | `SQLite.prepare` (490, 491) | AUTH |
| [packages/server/src/oauth.ts:389](../../packages/server/src/oauth.ts#L389) `OAuthServer/client` | `SQLite.get` (389); `SQLite.prepare` (389) | AUTH |
| [packages/server/src/oauth.ts:193](../../packages/server/src/oauth.ts#L193) `OAuthServer/constructor` | `SQLite.all` (193); `SQLite.prepare` (193, 220, 222, 231, 232, 235); `SQLite.iterate` (220); `SQLite.get` (222); `Store.sql` (222, 231) | AUTH |
| [packages/server/src/oauth.ts:186](../../packages/server/src/oauth.ts#L186) `OAuthServer/constructor/cols` | `SQLite.all` (186); `SQLite.prepare` (186) | AUTH |
| [packages/server/src/oauth.ts:874](../../packages/server/src/oauth.ts#L874) `OAuthServer/endGrant` | `SQLite.prepare` (874, 875); `SQLite.all` (875) | AUTH |
| [packages/server/src/oauth.ts:830](../../packages/server/src/oauth.ts#L830) `OAuthServer/issue/write` | `SQLite.get` (830); `SQLite.prepare` (830, 831, 832) | AUTH |
| [packages/server/src/oauth.ts:887](../../packages/server/src/oauth.ts#L887) `OAuthServer/managedAccess` | `SQLite.get` (887); `SQLite.prepare` (887) | AUTH |
| [packages/server/src/oauth.ts:369](../../packages/server/src/oauth.ts#L369) `OAuthServer/register` | `SQLite.prepare` (369, 370, 371, 372, 373); `SQLite.get` (370, 372) | AUTH |
| [packages/server/src/oauth.ts:904](../../packages/server/src/oauth.ts#L904) `OAuthServer/revoke` | `SQLite.get` (904, 905, 917, 918); `SQLite.prepare` (904, 905, 911, 917, 918, 924) | AUTH |
| [packages/server/src/oauth.ts:850](../../packages/server/src/oauth.ts#L850) `OAuthServer/sweep` | `SQLite.all` (850); `SQLite.prepare` (850, 852, 853, 854, 855) | AUTH |
| [packages/server/src/oauth.ts:709](../../packages/server/src/oauth.ts#L709) `OAuthServer/token` | `SQLite.get` (709, 740, 742, 745, 758); `SQLite.prepare` (709, 740, 742, 745, 754, 757, 758, 758, 760, 762) | AUTH |
| [packages/server/src/oauth.ts:85](../../packages/server/src/oauth.ts#L85) `legacyPasswordMark` | `SQLite.get` (85); `SQLite.prepare` (85); `Store.sql` (85) | AUTH |
| [packages/server/src/oauth.ts:72](../../packages/server/src/oauth.ts#L72) `storedName` | `SQLite.get` (72); `SQLite.prepare` (72); `Store.sql` (72) | AUTH |
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
| [packages/server/src/pgwire.ts:989](../../packages/server/src/pgwire.ts#L989) `Connection/bareNames` | `Store.describe` (989) | SQL |
| [packages/server/src/pgwire.ts:1005](../../packages/server/src/pgwire.ts#L1005) `Connection/catalog` | `Store.describeTyped` (1005) | SQL |
| [packages/server/src/pgwire.ts:1448](../../packages/server/src/pgwire.ts#L1448) `Connection/describe` | `Store.describeTyped` (1448) | SQL |
| [packages/server/src/pgwire.ts:1016](../../packages/server/src/pgwire.ts#L1016) `Connection/run` | `Store.selectIn` (1016); `Store.describeTyped` (1020) | SQL |
| [packages/server/src/pgwire.ts:966](../../packages/server/src/pgwire.ts#L966) `Connection/translate` | `Calculations.translateSQL` (966) | SQL |
| [packages/server/src/pgwire.ts:1214](../../packages/server/src/pgwire.ts#L1214) `Connection/validateSyntax` | `SQLite.prepare` (1214); `Store.sql` (1214) | SQL |
| [packages/server/src/pgwrite.ts:431](../../packages/server/src/pgwrite.ts#L431) `executeWrite/reader` | `Store.selectIn` (431) | SQL |
| [packages/server/src/pgwrite.ts:404](../../packages/server/src/pgwrite.ts#L404) `returningColumns` | `Store.describe` (404) | SQL |
| [packages/server/src/pii.ts:347](../../packages/server/src/pii.ts#L347) `PiiMasker/constructor` | `SQLite.get` (347); `SQLite.prepare` (347); `Store.sql` (347) | REDACTION |
| [packages/server/src/pii.ts:443](../../packages/server/src/pii.ts#L443) `PiiMasker/known` | `SQLite.iterate` (443); `SQLite.prepare` (443); `Store.sql` (443) | REDACTION |
| [packages/server/src/pii.ts:357](../../packages/server/src/pii.ts#L357) `PiiMasker/refresh` | `SQLite.iterate` (357); `SQLite.prepare` (357); `Store.sql` (357) | REDACTION |
| [packages/server/src/pii.ts:415](../../packages/server/src/pii.ts#L415) `PiiMasker/text` | `SQLite.get` (415); `SQLite.prepare` (415); `Store.sql` (415) | REDACTION |
| [packages/server/src/pii.ts:400](../../packages/server/src/pii.ts#L400) `PiiMasker/token` | `SQLite.prepare` (400, 401); `Store.sql` (400, 401); `SQLite.get` (401) | REDACTION |
| [packages/server/src/pii.ts:484](../../packages/server/src/pii.ts#L484) `PiiMasker/unmask` | `SQLite.get` (484); `SQLite.prepare` (484); `Store.sql` (484) | REDACTION |
| [packages/server/src/pii.ts:308](../../packages/server/src/pii.ts#L308) `forgetVault` | `Store.sql` (308) | REDACTION |
| [packages/server/src/pii.ts:122](../../packages/server/src/pii.ts#L122) `holdsOnlyUuids` | `Store.query` (122) | REDACTION |
| [packages/server/src/pii.ts:653](../../packages/server/src/pii.ts#L653) `piiPreview` | `Store.find` (653); `SQLite.prepare` (660); `Store.sql` (660) | REDACTION |
| [packages/server/src/pii.ts:134](../../packages/server/src/pii.ts#L134) `sampledValues` | `Store.query` (134) | REDACTION |
| [packages/server/src/pii.ts:299](../../packages/server/src/pii.ts#L299) `vaultTable` | `Store.sql` (299, 302) | REDACTION |
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
| [packages/server/src/webclient.ts:1706](../../packages/server/src/webclient.ts#L1706) `WebClient/aiReplace` | `Store.canView` (1706); `Store.getMany` (1722) | WEB |
| [packages/server/src/webclient.ts:1890](../../packages/server/src/webclient.ts#L1890) `WebClient/button` | `Store.findIds` (1890, 1940); `Store.evaluateEach` (1899, 1900) | WEB |
| [packages/server/src/webclient.ts:1292](../../packages/server/src/webclient.ts#L1292) `WebClient/charts` | `Calculations.context` (1292); `Store.canView` (1320); `Store.evaluateEach` (1329, 1333); `Store.evaluateRows` (1338, 1340) | WEB |
| [packages/server/src/webclient.ts:1283](../../packages/server/src/webclient.ts#L1283) `WebClient/charts/foundSet` | `Store.findIds` (1283) | WEB |
| [packages/server/src/webclient.ts:1323](../../packages/server/src/webclient.ts#L1323) `WebClient/charts/get` | `Store.get` (1323) | WEB |
| [packages/server/src/webclient.ts:693](../../packages/server/src/webclient.ts#L693) `WebClient/explain` | `Store.get` (693); `Store.row` (726, 739) | WEB |
| [packages/server/src/webclient.ts:1512](../../packages/server/src/webclient.ts#L1512) `WebClient/exportRecords` | `Store.getMany` (1512) | WEB |
| [packages/server/src/webclient.ts:1199](../../packages/server/src/webclient.ts#L1199) `WebClient/foundIds` | `Store.findIds` (1199) | WEB |
| [packages/server/src/webclient.ts:1243](../../packages/server/src/webclient.ts#L1243) `WebClient/foundSetPortal` | `Store.foundSetRows` (1243, 1250) | WEB |
| [packages/server/src/webclient.ts:1782](../../packages/server/src/webclient.ts#L1782) `WebClient/groups` | `Store.findIds` (1782); `Store.groupSummaries` (1788) | WEB |
| [packages/server/src/webclient.ts:555](../../packages/server/src/webclient.ts#L555) `WebClient/history` | `Store.get` (555) | WEB |
| [packages/server/src/webclient.ts:752](../../packages/server/src/webclient.ts#L752) `WebClient/index` | `Store.fieldIndex` (752) | WEB |
| [packages/server/src/webclient.ts:857](../../packages/server/src/webclient.ts#L857) `WebClient/menus` | `Store.evaluateEach` (857) | WEB |
| [packages/server/src/webclient.ts:1214](../../packages/server/src/webclient.ts#L1214) `WebClient/records` | `Store.getMany` (1214); `Store.find` (1217) | WEB |
| [packages/server/src/webclient.ts:1160](../../packages/server/src/webclient.ts#L1160) `WebClient/refresh` | `Store.previewRow` (1160); `Store.getMany` (1165); `Store.foundSetRows` (1187) | WEB |
| [packages/server/src/webclient.ts:1406](../../packages/server/src/webclient.ts#L1406) `WebClient/streamExportRecords/nextBatch` | `Store.selectIds` (1406); `Store.getMany` (1412) | WEB |
| [packages/server/src/webclient.ts:1074](../../packages/server/src/webclient.ts#L1074) `WebClient/view` | `Store.evaluateEach` (1074, 1098, 1117); `Store.canView` (1092); `Store.previewRow` (1096, 1118); `Store.get` (1109); `Store.row` (1110, 1110) | WEB |
| [packages/server/src/webclient.ts:1095](../../packages/server/src/webclient.ts#L1095) `WebClient/view/get` | `Store.get` (1095) | WEB |
| [packages/server/src/webclient.ts:2672](../../packages/server/src/webclient.ts#L2672) `foundIds` | `Store.findIds` (2672, 2674) | WEB |
| [packages/server/src/webclient.ts:2593](../../packages/server/src/webclient.ts#L2593) `listItems` | `Store.valueListItems` (2593) | WEB |
| [packages/store/src/activity.ts:498](../../packages/store/src/activity.ts#L498) `SharedRecordLocks/acquire` | `SQLite.prepare` (498) | CORE |
| [packages/store/src/activity.ts:536](../../packages/store/src/activity.ts#L536) `SharedRecordLocks/all` | `SQLite.all` (536); `SQLite.prepare` (536) | CORE |
| [packages/store/src/activity.ts:440](../../packages/store/src/activity.ts#L440) `SharedRecordLocks/constructor` | `SQLite.get` (440); `SQLite.prepare` (440) | CORE |
| [packages/store/src/activity.ts:471](../../packages/store/src/activity.ts#L471) `SharedRecordLocks/count` | `SQLite.get` (471); `SQLite.prepare` (471) | CORE |
| [packages/store/src/activity.ts:483](../../packages/store/src/activity.ts#L483) `SharedRecordLocks/holder` | `SQLite.get` (483); `SQLite.prepare` (483) | CORE |
| [packages/store/src/activity.ts:555](../../packages/store/src/activity.ts#L555) `SharedRecordLocks/leave` | `SQLite.prepare` (555) | CORE |
| [packages/store/src/activity.ts:559](../../packages/store/src/activity.ts#L559) `SharedRecordLocks/leaveOwner` | `SQLite.all` (559); `SQLite.prepare` (559) | CORE |
| [packages/store/src/activity.ts:526](../../packages/store/src/activity.ts#L526) `SharedRecordLocks/release` | `SQLite.prepare` (526) | CORE |
| [packages/store/src/activity.ts:530](../../packages/store/src/activity.ts#L530) `SharedRecordLocks/releaseOwner` | `SQLite.all` (530); `SQLite.prepare` (530) | CORE |
| [packages/store/src/activity.ts:512](../../packages/store/src/activity.ts#L512) `SharedRecordLocks/renew` | `SQLite.prepare` (512) | CORE |
| [packages/store/src/activity.ts:475](../../packages/store/src/activity.ts#L475) `SharedRecordLocks/sweep` | `SQLite.prepare` (475) | CORE |
| [packages/store/src/activity.ts:542](../../packages/store/src/activity.ts#L542) `SharedRecordLocks/view` | `SQLite.prepare` (542, 543, 544, 545); `SQLite.get` (543, 544) | CORE |
| [packages/store/src/activity.ts:563](../../packages/store/src/activity.ts#L563) `SharedRecordLocks/viewers` | `SQLite.prepare` (563, 564); `SQLite.all` (564) | CORE |
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
| [packages/store/src/calc.ts:3227](../../packages/store/src/calc.ts#L3227) `rowsById/flush` | `Calculations.statement` (3227); `SQLite.iterate` (3227) | CALC |
| [packages/store/src/calc.ts:2914](../../packages/store/src/calc.ts#L2914) `sameValuesElsewhere` | `SQLite.all` (2914); `SQLite.prepare` (2914, 2921, 2923); `Store.sql` (2914, 2921, 2923); `Calculations.value` (2916); `SQLite.get` (2921, 2923) | CALC |
| [packages/store/src/damage.ts:93](../../packages/store/src/damage.ts#L93) `watchDatabase` | `SQLite.prepare` (93); `SQLite.iterate` (103) | CORE |
| [packages/store/src/exit-bundle.ts:451](../../packages/store/src/exit-bundle.ts#L451) `build` | `SQLite.prepare` (451) | EXIT-BUNDLE |
| [packages/store/src/exit-bundle.ts:474](../../packages/store/src/exit-bundle.ts#L474) `copyTables` | `SQLite.all` (474); `SQLite.prepare` (474, 480, 481, 498); `SQLite.get` (483, 495, 498) | EXIT-BUNDLE |
| [packages/store/src/exit-bundle.ts:657](../../packages/store/src/exit-bundle.ts#L657) `finish` | `SQLite.all` (657); `SQLite.prepare` (657); `Calculations.globalValue` (669) | EXIT-BUNDLE |
| [packages/store/src/exit-bundle.ts:508](../../packages/store/src/exit-bundle.ts#L508) `writeContainers` | `SQLite.all` (508, 520); `SQLite.prepare` (508, 520, 521, 555); `Store.containerInfo` (525); `Store.containerRange` (541); `SQLite.get` (555) | EXIT-BUNDLE |
| [packages/store/src/exit-bundle.ts:571](../../packages/store/src/exit-bundle.ts#L571) `writeCsv` | `SQLite.prepare` (571); `SQLite.iterate` (575) | EXIT-BUNDLE |
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
| [packages/store/src/import.ts:280](../../packages/store/src/import.ts#L280) `createStore` | `SQLite.prepare` (280, 292) | OPERATOR |
| [packages/store/src/import.ts:199](../../packages/store/src/import.ts#L199) `importDesigns` | `SQLite.all` (199); `SQLite.prepare` (199, 213, 216, 219, 221); `SQLite.get` (213, 216) | OPERATOR |
| [packages/store/src/import.ts:416](../../packages/store/src/import.ts#L416) `importFmp12` | `SQLite.prepare` (416, 427, 433, 439, 443, 458, 469, 559, 560, 561); `SQLite.get` (433, 458); `SQLite.all` (439) | OPERATOR |
| [packages/store/src/import.ts:407](../../packages/store/src/import.ts#L407) `importFmp12/save` | `SQLite.prepare` (407) | OPERATOR |
| [packages/store/src/import.ts:517](../../packages/store/src/import.ts#L517) `importFmp12/skipped` | `SQLite.get` (517); `SQLite.prepare` (517) | OPERATOR |
| [packages/store/src/import.ts:149](../../packages/store/src/import.ts#L149) `moveAddedImages` | `SQLite.prepare` (149, 159, 175, 176); `SQLite.get` (152); `SQLite.all` (176) | OPERATOR |
| [packages/store/src/import.ts:304](../../packages/store/src/import.ts#L304) `needsDesigns` | `SQLite.get` (304); `SQLite.prepare` (304) | OPERATOR |
| [packages/store/src/import.ts:135](../../packages/store/src/import.ts#L135) `nextImageId` | `SQLite.get` (135); `SQLite.prepare` (135) | OPERATOR |
| [packages/store/src/import.ts:351](../../packages/store/src/import.ts#L351) `readState` | `SQLite.get` (351); `SQLite.prepare` (351) | OPERATOR |
| [packages/store/src/import.ts:107](../../packages/store/src/import.ts#L107) `writeDesign` | `SQLite.prepare` (107, 111) | OPERATOR |
| [packages/store/src/layout-speed.ts:56](../../packages/store/src/layout-speed.ts#L56) `layoutCost/recordCount` | `Store.recordCount` (56) | DESIGN |
| [packages/store/src/layout-speed.ts:419](../../packages/store/src/layout-speed.ts#L419) `speedContext` | `Store.recordCount` (419) | DESIGN |
| [packages/store/src/privileges.ts:549](../../packages/store/src/privileges.ts#L549) `ensurePrivilegeTables` | `SQLite.all` (549); `SQLite.prepare` (549) | AUTH |
| [packages/store/src/privileges.ts:521](../../packages/store/src/privileges.ts#L521) `privilegeSets` | `SQLite.all` (521); `SQLite.prepare` (521) | AUTH |
| [packages/store/src/reconvert.ts:222](../../packages/store/src/reconvert.ts#L222) `build` | `SQLite.get` (222); `SQLite.prepare` (222, 225, 230); `SQLite.all` (230) | OPERATOR |
| [packages/store/src/reconvert.ts:375](../../packages/store/src/reconvert.ts#L375) `carryImages` | `SQLite.all` (375, 377); `SQLite.prepare` (375, 377, 378) | OPERATOR |
| [packages/store/src/reconvert.ts:327](../../packages/store/src/reconvert.ts#L327) `carryRecords` | `SQLite.prepare` (327, 333, 336, 341, 342, 352, 358, 359); `SQLite.all` (333, 341, 345, 358) | OPERATOR |
| [packages/store/src/reconvert.ts:384](../../packages/store/src/reconvert.ts#L384) `carrySettings` | `SQLite.all` (384, 388, 396); `SQLite.prepare` (384, 388, 396, 397, 401); `SQLite.get` (401) | OPERATOR |
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
| [packages/store/src/store.ts:5251](../../packages/store/src/store.ts#L5251) `Store/accountIdentityId` | `SQLite.get` (5251, 5257); `SQLite.prepare` (5251, 5256, 5257); `Store.sql` (5251, 5256, 5257) | CORE |
| [packages/store/src/store.ts:5245](../../packages/store/src/store.ts#L5245) `Store/accountIdentityIdIfSet` | `SQLite.get` (5245); `SQLite.prepare` (5245); `Store.sql` (5245) | CORE |
| [packages/store/src/store.ts:5207](../../packages/store/src/store.ts#L5207) `Store/accountInactive` | `SQLite.get` (5207); `SQLite.prepare` (5207); `Store.sql` (5207) | CORE |
| [packages/store/src/store.ts:5404](../../packages/store/src/store.ts#L5404) `Store/accountLocalOnly` | `SQLite.get` (5404); `SQLite.prepare` (5404); `Store.sql` (5404) | CORE |
| [packages/store/src/store.ts:6273](../../packages/store/src/store.ts#L6273) `Store/accountPrivilegeSet` | `SQLite.get` (6273); `SQLite.prepare` (6273); `Store.sql` (6273) | CORE |
| [packages/store/src/store.ts:5409](../../packages/store/src/store.ts#L5409) `Store/accountRequires2fa` | `SQLite.get` (5409); `SQLite.prepare` (5409); `Store.sql` (5409) | CORE |
| [packages/store/src/store.ts:5629](../../packages/store/src/store.ts#L5629) `Store/accountUsage` | `SQLite.get` (5629); `SQLite.prepare` (5629, 5630); `Store.sql` (5629, 5630); `SQLite.all` (5630); `Store.auditLog` (5646) | CORE |
| [packages/store/src/store.ts:3664](../../packages/store/src/store.ts#L3664) `Store/accounts` | `SQLite.all` (3664); `SQLite.prepare` (3664); `Store.sql` (3664) | CORE |
| [packages/store/src/store.ts:3660](../../packages/store/src/store.ts#L3660) `Store/accountsSharingLockout` | `SQLite.all` (3660); `SQLite.prepare` (3660); `Store.sql` (3660) | CORE |
| [packages/store/src/store.ts:8389](../../packages/store/src/store.ts#L8389) `Store/addContainer` | `SQLite.all` (8389); `SQLite.prepare` (8389, 8394, 8408, 8412, 8413); `Store.sql` (8389, 8394, 8408, 8410, 8412, 8413, 8415, 8418); `SQLite.get` (8399); `Store.containerRange` (8401) | CORE |
| [packages/store/src/store.ts:8435](../../packages/store/src/store.ts#L8435) `Store/addExternalContainer` | `SQLite.prepare` (8435); `Store.sql` (8435) | CORE |
| [packages/store/src/store.ts:8912](../../packages/store/src/store.ts#L8912) `Store/addFieldIndex` | `Store.sql` (8912) | CORE |
| [packages/store/src/store.ts:7084](../../packages/store/src/store.ts#L7084) `Store/addImage` | `Store.sql` (7084, 7085); `SQLite.prepare` (7085) | CORE |
| [packages/store/src/store.ts:6323](../../packages/store/src/store.ts#L6323) `Store/addProvisionedAccount` | `SQLite.get` (6323); `SQLite.prepare` (6323, 6327); `Store.sql` (6323, 6327) | CORE |
| [packages/store/src/store.ts:7507](../../packages/store/src/store.ts#L7507) `Store/addRelated` | `relatedRows` (7507); `rowsById` (7540); `firstRelatedEach` (7563) | CORE |
| [packages/store/src/store.ts:3682](../../packages/store/src/store.ts#L3682) `Store/agentNeedsApproval` | `SQLite.get` (3682); `SQLite.prepare` (3682); `Store.sql` (3682) | CORE |
| [packages/store/src/store.ts:6537](../../packages/store/src/store.ts#L6537) `Store/allowedIds` | `SQLite.iterate` (6537); `SQLite.prepare` (6537); `Store.sql` (6537) | CORE |
| [packages/store/src/store.ts:5686](../../packages/store/src/store.ts#L5686) `Store/apiToken` | `SQLite.get` (5686); `SQLite.prepare` (5686, 5704); `Store.sql` (5686, 5704) | CORE |
| [packages/store/src/store.ts:5662](../../packages/store/src/store.ts#L5662) `Store/apiTokens` | `SQLite.all` (5662); `SQLite.prepare` (5662); `Store.sql` (5662) | CORE |
| [packages/store/src/store.ts:3123](../../packages/store/src/store.ts#L3123) `Store/appendSecurityRow` | `Store.sql` (3123) | CORE |
| [packages/store/src/store.ts:4022](../../packages/store/src/store.ts#L4022) `Store/appendSecurityEvent` | `Store.sql` (4022) | CORE |
| [packages/store/src/store.ts:5027](../../packages/store/src/store.ts#L5027) `Store/applyAccountImport` | `Store.sql` (5027, 5035, 5064); `SQLite.get` (5035); `SQLite.prepare` (5035, 5064) | CORE |
| [packages/store/src/store.ts:2424](../../packages/store/src/store.ts#L2424) `Store/applyDesign` | `Store.sql` (2424, 2425, 2445, 2448, 2453, 2469, 2472, 2472); `SQLite.prepare` (2448, 2453) | CORE |
| [packages/store/src/store.ts:3878](../../packages/store/src/store.ts#L3878) `Store/approvePending` | `SQLite.get` (3878); `SQLite.prepare` (3878, 3889); `Store.sql` (3878, 3889) | CORE |
| [packages/store/src/store.ts:2914](../../packages/store/src/store.ts#L2914) `Store/audit/write` | `Store.sql` (2914) | CORE |
| [packages/store/src/store.ts:2536](../../packages/store/src/store.ts#L2536) `Store/auditLog` | `SQLite.all` (2536); `SQLite.prepare` (2536); `Store.sql` (2536) | CORE |
| [packages/store/src/store.ts:1959](../../packages/store/src/store.ts#L1959) `Store/backup` | `Store.sql` (1959) | CORE |
| [packages/store/src/store.ts:3688](../../packages/store/src/store.ts#L3688) `Store/blankPasswordAccounts` | `SQLite.all` (3688); `SQLite.prepare` (3688); `Store.sql` (3688) | CORE |
| [packages/store/src/store.ts:9498](../../packages/store/src/store.ts#L9498) `Store/canView` | `Store.canView` (9498); `Store.row` (9499) | GATED-STORE |
| [packages/store/src/store.ts:9480](../../packages/store/src/store.ts#L9480) `Store/canViewRecord` | `SQLite.get` (9480); `SQLite.prepare` (9480); `Store.sql` (9480) | GATED-STORE |
| [packages/store/src/store.ts:4956](../../packages/store/src/store.ts#L4956) `Store/canonicalAccount` | `SQLite.all` (4956); `SQLite.prepare` (4956); `Store.sql` (4956) | CORE |
| [packages/store/src/store.ts:10587](../../packages/store/src/store.ts#L10587) `Store/cascadeDelete` | `relatedRows` (10587) | CORE |
| [packages/store/src/store.ts:2259](../../packages/store/src/store.ts#L2259) `Store/changeOne` | `Store.sql` (2259, 2261) | CORE |
| [packages/store/src/store.ts:2262](../../packages/store/src/store.ts#L2262) `Store/changeOne/read` | `SQLite.get` (2262); `SQLite.prepare` (2262); `Store.sql` (2262) | CORE |
| [packages/store/src/store.ts:8770](../../packages/store/src/store.ts#L8770) `Store/checkContainerWrite` | `Store.row` (8770) | CORE |
| [packages/store/src/store.ts:10210](../../packages/store/src/store.ts#L10210) `Store/checkEditable` | `Store.row` (10210) | CORE |
| [packages/store/src/store.ts:1505](../../packages/store/src/store.ts#L1505) `Store/checkpoint` | `SQLite.get` (1505); `SQLite.prepare` (1505); `Store.sql` (1505) | CORE |
| [packages/store/src/store.ts:6309](../../packages/store/src/store.ts#L6309) `Store/clearAccountPrivilegeSet` | `SQLite.prepare` (6309); `Store.sql` (6309) | CORE |
| [packages/store/src/store.ts:1527](../../packages/store/src/store.ts#L1527) `Store/close` | `Store.sql` (1527) | CORE |
| [packages/store/src/store.ts:8738](../../packages/store/src/store.ts#L8738) `Store/compactFile` | `Store.sql` (8738, 8739, 8741) | CORE |
| [packages/store/src/store.ts:10711](../../packages/store/src/store.ts#L10711) `Store/computeValuesCurrent` | `Store.computeValues` (10711); `Store.sql` (10717, 10721); `SQLite.all` (10721); `SQLite.prepare` (10721) | GATED-STORE |
| [packages/store/src/store.ts:9149](../../packages/store/src/store.ts#L9149) `Store/computedRows` | `Store.sql` (9149, 9152, 9153, 9154, 9156, 9166, 9167, 9168, 9171); `SQLite.prepare` (9152, 9154, 9156, 9166); `SQLite.iterate` (9156); `Calculations.globalValue` (9159); `Calculations.unstoredValue` (9160); `Calculations.related` (9163); `SQLite.all` (9166) | CORE |
| [packages/store/src/store.ts:5731](../../packages/store/src/store.ts#L5731) `Store/confirmTotp` | `SQLite.get` (5731); `SQLite.prepare` (5731, 5733); `Store.sql` (5731, 5733) | CORE |
| [packages/store/src/store.ts:1150](../../packages/store/src/store.ts#L1150) `Store/constructor` | `Store.sql` (1150, 1152, 1154, 1155, 1159, 1163, 1164, 1173, 1181, 1196, 1201, 1206, 1207, 1211, 1212, 1213, 1220, 1224, 1228, 1229, 1230, 1235, 1236, 1240, 1243, 1244, 1246, 1247, 1250, 1251, 1255, 1256, 1260, 1261, 1264, 1266, 1269, 1270, 1274, 1275, 1279, 1280, 1284, 1285, 1286, 1289, 1290, 1293, 1294, 1296, 1296, 1297, 1297, 1298, 1301, 1305, 1307, 1310, 1311, 1312, 1315, 1316, 1318, 1320, 1321, 1325, 1326, 1328, 1340, 1342, 1343, 1344, 1344, 1348, 1349); `SQLite.get` (1154, 1173); `SQLite.prepare` (1154, 1173, 1181, 1243, 1244, 1247, 1250, 1255, 1260, 1269, 1274, 1279, 1289, 1293, 1296, 1297, 1315, 1320, 1325); `SQLite.all` (1243, 1250, 1255, 1260, 1269, 1274, 1279, 1289, 1293, 1296, 1297, 1315, 1320, 1325) | CORE |
| [packages/store/src/store.ts:6089](../../packages/store/src/store.ts#L6089) `Store/consumeRecoveryCode` | `SQLite.prepare` (6089); `Store.sql` (6089) | CORE |
| [packages/store/src/store.ts:8313](../../packages/store/src/store.ts#L8313) `Store/container` | `SQLite.get` (8313); `SQLite.prepare` (8313, 8322); `Store.sql` (8313, 8322); `SQLite.all` (8322) | CORE |
| [packages/store/src/store.ts:8747](../../packages/store/src/store.ts#L8747) `Store/containerId` | `Store.containerId` (8747); `Store.row` (8748) | CORE |
| [packages/store/src/store.ts:8330](../../packages/store/src/store.ts#L8330) `Store/containerInfo` | `SQLite.get` (8330); `SQLite.prepare` (8330); `Store.sql` (8330) | CORE |
| [packages/store/src/store.ts:8294](../../packages/store/src/store.ts#L8294) `Store/containerIntact` | `SQLite.get` (8294); `SQLite.prepare` (8294); `Store.sql` (8294) | CORE |
| [packages/store/src/store.ts:8233](../../packages/store/src/store.ts#L8233) `Store/containerIntegrityReport` | `SQLite.all` (8233); `SQLite.prepare` (8233, 8244); `Store.sql` (8233, 8244); `SQLite.get` (8244) | CORE |
| [packages/store/src/store.ts:8308](../../packages/store/src/store.ts#L8308) `Store/containerMeta` | `SQLite.get` (8308); `SQLite.prepare` (8308); `Store.sql` (8308) | CORE |
| [packages/store/src/store.ts:8364](../../packages/store/src/store.ts#L8364) `Store/containerRange` | `SQLite.all` (8364); `SQLite.prepare` (8364, 8371); `Store.sql` (8364, 8371); `SQLite.get` (8371) | CORE |
| [packages/store/src/store.ts:8135](../../packages/store/src/store.ts#L8135) `Store/containerReferences` | `SQLite.all` (8135, 8154, 8156, 8162, 8175, 8186, 8200); `SQLite.prepare` (8135, 8154, 8156, 8162, 8175, 8186, 8198, 8200); `Store.sql` (8135, 8154, 8156, 8162, 8175, 8186, 8198, 8200); `SQLite.get` (8198); `Store.row` (8209) | CORE |
| [packages/store/src/store.ts:10691](../../packages/store/src/store.ts#L10691) `Store/countIds` | `Store.countIds` (10691); `SQLite.get` (10695); `SQLite.prepare` (10695); `Store.sql` (10695) | GATED-STORE |
| [packages/store/src/store.ts:9529](../../packages/store/src/store.ts#L9529) `Store/create` | `SQLite.get` (9529); `SQLite.prepare` (9529, 9542); `Store.sql` (9529, 9542) | CORE |
| [packages/store/src/store.ts:3994](../../packages/store/src/store.ts#L3994) `Store/createAccount` | `SQLite.get` (3994); `SQLite.prepare` (3994, 3998, 4004, 4009, 4014); `Store.sql` (3994, 3998, 4004, 4009, 4014) | CORE |
| [packages/store/src/store.ts:5462](../../packages/store/src/store.ts#L5462) `Store/createApiToken` | `SQLite.get` (5462, 5490); `SQLite.prepare` (5462, 5489, 5490, 5500); `Store.sql` (5462, 5489, 5490, 5500) | CORE |
| [packages/store/src/store.ts:4968](../../packages/store/src/store.ts#L4968) `Store/createLocalAccount` | `SQLite.prepare` (4968); `Store.sql` (4968) | CORE |
| [packages/store/src/store.ts:3654](../../packages/store/src/store.ts#L3654) `Store/credentialIdentity` | `SQLite.get` (3654); `SQLite.prepare` (3654); `Store.sql` (3654) | CORE |
| [packages/store/src/store.ts:5383](../../packages/store/src/store.ts#L5383) `Store/credentialStamp` | `SQLite.get` (5383); `SQLite.prepare` (5383); `Store.sql` (5383) | CORE |
| [packages/store/src/store.ts:2049](../../packages/store/src/store.ts#L2049) `Store/dataVersion` | `SQLite.get` (2049); `SQLite.prepare` (2049); `Store.sql` (2049) | CORE |
| [packages/store/src/store.ts:11249](../../packages/store/src/store.ts#L11249) `Store/decimalViewSql` | `SQLite.all` (11249); `SQLite.prepare` (11249) | CORE |
| [packages/store/src/store.ts:10253](../../packages/store/src/store.ts#L10253) `Store/delete` | `Store.row` (10253) | CORE |
| [packages/store/src/store.ts:10261](../../packages/store/src/store.ts#L10261) `Store/delete/run` | `SQLite.get` (10261); `SQLite.prepare` (10261, 10266); `Store.sql` (10261, 10266) | CORE |
| [packages/store/src/store.ts:5122](../../packages/store/src/store.ts#L5122) `Store/deleteAccount` | `SQLite.prepare` (5122, 5126, 5127, 5128, 5129, 5130, 5131, 5132, 5133, 5140, 5142, 5144, 5146, 5150); `Store.sql` (5122, 5126, 5127, 5128, 5129, 5130, 5131, 5132, 5133, 5140, 5142, 5144, 5146, 5150) | CORE |
| [packages/store/src/store.ts:10334](../../packages/store/src/store.ts#L10334) `Store/deleteBeingUndone` | `SQLite.all` (10334); `SQLite.prepare` (10334); `Store.sql` (10334) | CORE |
| [packages/store/src/store.ts:10346](../../packages/store/src/store.ts#L10346) `Store/deleteEndingTheLifeAt` | `SQLite.get` (10346); `SQLite.prepare` (10346); `Store.sql` (10346) | CORE |
| [packages/store/src/store.ts:6174](../../packages/store/src/store.ts#L6174) `Store/deletePrivilegeSet` | `SQLite.prepare` (6174); `Store.sql` (6174) | CORE |
| [packages/store/src/store.ts:4132](../../packages/store/src/store.ts#L4132) `Store/deleteScriptTest` | `SQLite.prepare` (4132); `Store.sql` (4132) | CORE |
| [packages/store/src/store.ts:3291](../../packages/store/src/store.ts#L3291) `Store/deletedRows` | `SQLite.get` (3291); `SQLite.prepare` (3291, 3293, 3293); `Store.sql` (3291, 3293, 3293); `SQLite.all` (3293, 3293) | CORE |
| [packages/store/src/store.ts:3401](../../packages/store/src/store.ts#L3401) `Store/designEffect` | `Store.sql` (3401, 3407, 3408, 3411, 3417, 3422, 3425, 3431, 3442, 3443, 3445, 3446, 3459, 3460, 3463, 3465, 3471, 3472, 3473, 3479, 3481, 3485, 3488, 3489, 3491, 3494, 3500, 3502, 3509, 3510, 3512, 3513, 3514, 3515, 3522, 3523, 3525, 3525, 3527, 3528, 3529, 3533, 3537, 3539, 3577, 3579, 3581); `SQLite.prepare` (3411, 3442, 3443, 3459, 3460, 3471, 3472, 3479, 3481, 3485, 3489, 3500, 3502, 3515, 3522, 3523, 3525, 3527, 3529, 3533, 3537); `SQLite.get` (3442, 3459, 3471, 3472, 3485, 3489, 3525, 3533); `SQLite.all` (3522, 3523); `SQLite.iterate` (3527) | CORE |
| [packages/store/src/store.ts:3394](../../packages/store/src/store.ts#L3394) `Store/designEffect/renameExcluded` | `SQLite.prepare` (3394); `Store.sql` (3394) | CORE |
| [packages/store/src/store.ts:3378](../../packages/store/src/store.ts#L3378) `Store/designEffect/renameKey` | `SQLite.prepare` (3378); `Store.sql` (3378) | CORE |
| [packages/store/src/store.ts:3332](../../packages/store/src/store.ts#L3332) `Store/designHistory` | `SQLite.all` (3332); `SQLite.prepare` (3332); `Store.sql` (3332) | CORE |
| [packages/store/src/store.ts:5752](../../packages/store/src/store.ts#L5752) `Store/disableTotp` | `SQLite.prepare` (5752); `Store.sql` (5752) | CORE |
| [packages/store/src/store.ts:3589](../../packages/store/src/store.ts#L3589) `Store/dropColumnIndexes` | `SQLite.all` (3589, 3591); `SQLite.prepare` (3589, 3591); `Store.sql` (3589, 3591, 3592) | CORE |
| [packages/store/src/store.ts:8924](../../packages/store/src/store.ts#L8924) `Store/dropFieldIndex` | `SQLite.get` (8924); `SQLite.prepare` (8924); `Store.sql` (8924, 8925) | CORE |
| [packages/store/src/store.ts:9566](../../packages/store/src/store.ts#L9566) `Store/duplicate` | `Store.row` (9566); `SQLite.prepare` (9584); `Store.sql` (9584) | CORE |
| [packages/store/src/store.ts:8551](../../packages/store/src/store.ts#L8551) `Store/embeddedContainerCount` | `SQLite.prepare` (8551); `Store.sql` (8551); `SQLite.get` (8552) | CORE |
| [packages/store/src/store.ts:8537](../../packages/store/src/store.ts#L8537) `Store/embeddedContainers` | `SQLite.prepare` (8537, 8538); `Store.sql` (8537, 8538); `SQLite.all` (8538); `SQLite.get` (8542) | CORE |
| [packages/store/src/store.ts:3317](../../packages/store/src/store.ts#L3317) `Store/emptyDeleted` | `Store.sql` (3317, 3320, 3321, 3323, 3325); `SQLite.prepare` (3321) | CORE |
| [packages/store/src/store.ts:1925](../../packages/store/src/store.ts#L1925) `Store/endTransaction` | `Store.sql` (1925, 1928, 1928) | CORE |
| [packages/store/src/store.ts:5720](../../packages/store/src/store.ts#L5720) `Store/enrollTotp` | `SQLite.prepare` (5720); `Store.sql` (5720) | CORE |
| [packages/store/src/store.ts:3286](../../packages/store/src/store.ts#L3286) `Store/ensureDeleted` | `Store.sql` (3286) | CORE |
| [packages/store/src/store.ts:1359](../../packages/store/src/store.ts#L1359) `Store/ensureNativeIds` | `SQLite.all` (1359, 1371); `SQLite.prepare` (1359, 1362, 1370, 1371); `Store.sql` (1359, 1362, 1365, 1369, 1370, 1371, 1374, 1376) | CORE |
| [packages/store/src/store.ts:2171](../../packages/store/src/store.ts#L2171) `Store/ensureRecordIdHighWater` | `Store.sql` (2171, 2172, 2174, 2176, 2178) | CORE |
| [packages/store/src/store.ts:2190](../../packages/store/src/store.ts#L2190) `Store/ensureRecordIdMarks` | `SQLite.all` (2190, 2193, 2196, 2205); `SQLite.prepare` (2190, 2193, 2196, 2199, 2205, 2208); `Store.sql` (2190, 2193, 2196, 2199, 2205, 2208, 2212, 2213) | CORE |
| [packages/store/src/store.ts:9907](../../packages/store/src/store.ts#L9907) `Store/evaluateCurrent` | `Store.row` (9907, 9907, 9908, 9908); `Calculations.context` (9913); `Store.get` (9914, 9916) | GATED-STORE |
| [packages/store/src/store.ts:9948](../../packages/store/src/store.ts#L9948) `Store/evaluateEachCurrent` | `Store.row` (9948, 9948, 9953); `Calculations.context` (9954); `Store.get` (9956) | GATED-STORE |
| [packages/store/src/store.ts:10010](../../packages/store/src/store.ts#L10010) `Store/evaluateRowsCurrent` | `Store.row` (10010, 10010, 10011, 10011) | GATED-STORE |
| [packages/store/src/store.ts:9989](../../packages/store/src/store.ts#L9989) `Store/evaluateRowsCurrent/each` | `Calculations.context` (9989); `Store.get` (9991) | GATED-STORE |
| [packages/store/src/store.ts:10025](../../packages/store/src/store.ts#L10025) `Store/evaluateRowsCurrent/found/[Symbol.iterator]` | `rowsById` (10025) | GATED-STORE |
| [packages/store/src/store.ts:10047](../../packages/store/src/store.ts#L10047) `Store/evaluateRowsCurrent/key` | `Calculations.context` (10047) | GATED-STORE |
| [packages/store/src/store.ts:3921](../../packages/store/src/store.ts#L3921) `Store/externalAccount` | `SQLite.all` (3921); `SQLite.prepare` (3921); `Store.sql` (3921) | CORE |
| [packages/store/src/store.ts:8056](../../packages/store/src/store.ts#L8056) `Store/externalContainerCheck` | `SQLite.all` (8056); `SQLite.prepare` (8056); `Store.sql` (8056) | CORE |
| [packages/store/src/store.ts:8063](../../packages/store/src/store.ts#L8063) `Store/externalContainerCount` | `SQLite.get` (8063); `SQLite.prepare` (8063); `Store.sql` (8063) | CORE |
| [packages/store/src/store.ts:8072](../../packages/store/src/store.ts#L8072) `Store/externalContainerReport` | `SQLite.all` (8072, 8085); `SQLite.prepare` (8072, 8085); `Store.sql` (8072, 8085) | CORE |
| [packages/store/src/store.ts:5233](../../packages/store/src/store.ts#L5233) `Store/externalIdentityId` | `SQLite.get` (5233, 5240); `SQLite.prepare` (5233, 5239, 5240); `Store.sql` (5233, 5239, 5240) | CORE |
| [packages/store/src/store.ts:8304](../../packages/store/src/store.ts#L8304) `Store/externalOf` | `SQLite.get` (8304); `SQLite.prepare` (8304); `Store.sql` (8304) | CORE |
| [packages/store/src/store.ts:3067](../../packages/store/src/store.ts#L3067) `Store/failureAuditRoom` | `SQLite.get` (3067); `SQLite.prepare` (3067); `Store.sql` (3067) | CORE |
| [packages/store/src/store.ts:7709](../../packages/store/src/store.ts#L7709) `Store/fieldIndexCurrent` | `SQLite.iterate` (7709); `SQLite.prepare` (7709, 7714); `Store.sql` (7709, 7714); `SQLite.all` (7714) | GATED-STORE |
| [packages/store/src/store.ts:8964](../../packages/store/src/store.ts#L8964) `Store/find` | `Store.find` (8964) | GATED-STORE |
| [packages/store/src/store.ts:9336](../../packages/store/src/store.ts#L9336) `Store/findCandidates` | `Store.query` (9336) | CORE |
| [packages/store/src/store.ts:8975](../../packages/store/src/store.ts#L8975) `Store/findHere` | `Store.query` (8975, 8980, 8982, 8996, 8998, 9009); `Store.recordCount` (8993); `SQLite.get` (8994, 8998); `SQLite.prepare` (8994, 8998, 9004, 9011, 9020); `Store.sql` (8994, 8998, 9004, 9011, 9020); `SQLite.all` (9004, 9011, 9020) | GATED-STORE |
| [packages/store/src/store.ts:9015](../../packages/store/src/store.ts#L9015) `Store/findHere/[Symbol.iterator]` | `SQLite.iterate` (9015); `SQLite.prepare` (9015); `Store.sql` (9015) | GATED-STORE |
| [packages/store/src/store.ts:10822](../../packages/store/src/store.ts#L10822) `Store/findIdsCurrent` | `Store.findIds` (10822) | GATED-STORE |
| [packages/store/src/store.ts:10758](../../packages/store/src/store.ts#L10758) `Store/findIdsCurrentProgress` | `Store.findIdsProgress` (10758); `Store.query` (10760, 10761, 10774, 10776); `Store.recordCount` (10766, 10794); `SQLite.iterate` (10791); `SQLite.prepare` (10791, 10799, 10800); `Store.sql` (10791, 10799, 10800); `SQLite.get` (10803); `SQLite.all` (10809) | GATED-STORE |
| [packages/store/src/store.ts:10828](../../packages/store/src/store.ts#L10828) `Store/findIdsHere` | `Store.query` (10828, 10833, 10835); `SQLite.iterate` (10846); `SQLite.prepare` (10846); `Store.sql` (10846) | GATED-STORE |
| [packages/store/src/store.ts:9280](../../packages/store/src/store.ts#L9280) `Store/findSource` | `Store.query` (9280); `SQLite.all` (9289, 9306); `SQLite.prepare` (9289, 9297, 9305); `Store.sql` (9289, 9294, 9297, 9302, 9305, 9319, 9321); `Calculations.globalValue` (9311); `Calculations.unstoredValue` (9312); `Calculations.related` (9316) | CORE |
| [packages/store/src/store.ts:3179](../../packages/store/src/store.ts#L3179) `Store/flushDeferredSecurity` | `Store.sql` (3179) | CORE |
| [packages/store/src/store.ts:10301](../../packages/store/src/store.ts#L10301) `Store/forgetStandInValues` | `Store.sql` (10301, 10322); `SQLite.prepare` (10322) | CORE |
| [packages/store/src/store.ts:5089](../../packages/store/src/store.ts#L5089) `Store/forgetStandIns` | `SQLite.prepare` (5089); `Store.sql` (5089) | CORE |
| [packages/store/src/store.ts:7591](../../packages/store/src/store.ts#L7591) `Store/foundSetPage` | `rowsById` (7591) | CORE |
| [packages/store/src/store.ts:7607](../../packages/store/src/store.ts#L7607) `Store/foundSetRowsCurrent` | `Store.viewableIds` (7607); `Store.row` (7623) | GATED-STORE |
| [packages/store/src/store.ts:3840](../../packages/store/src/store.ts#L3840) `Store/gateAgentWrite` | `SQLite.get` (3840); `SQLite.prepare` (3840, 3842); `Store.sql` (3840, 3842) | CORE |
| [packages/store/src/store.ts:6027](../../packages/store/src/store.ts#L6027) `Store/generateRecoveryCodes` | `SQLite.prepare` (6027, 6030); `Store.sql` (6027, 6030) | CORE |
| [packages/store/src/store.ts:9408](../../packages/store/src/store.ts#L9408) `Store/getCurrent` | `Store.get` (9408); `Store.row` (9409, 9409, 9423); `SQLite.all` (9426); `SQLite.prepare` (9426); `Store.sql` (9426) | GATED-STORE |
| [packages/store/src/store.ts:9446](../../packages/store/src/store.ts#L9446) `Store/getManyCurrent` | `Store.getMany` (9446); `SQLite.get` (9464); `SQLite.prepare` (9464); `Store.sql` (9464) | GATED-STORE |
| [packages/store/src/store.ts:9457](../../packages/store/src/store.ts#L9457) `Store/getManyCurrent/[Symbol.iterator]` | `rowsById` (9457) | GATED-STORE |
| [packages/store/src/store.ts:1406](../../packages/store/src/store.ts#L1406) `Store/grantFullAccessClients` | `SQLite.prepare` (1406); `Store.sql` (1406) | CORE |
| [packages/store/src/store.ts:10863](../../packages/store/src/store.ts#L10863) `Store/groupSummariesCurrent` | `Store.groupSummaries` (10863); `Store.viewableIds` (10868); `Calculations.collect` (10884); `rowsById` (10884, 10934); `Calculations.collector` (10906) | GATED-STORE |
| [packages/store/src/store.ts:10932](../../packages/store/src/store.ts#L10932) `Store/groupSummariesCurrent/flush` | `Calculations.collector` (10932) | GATED-STORE |
| [packages/store/src/store.ts:10896](../../packages/store/src/store.ts#L10896) `Store/groupSummariesCurrent/key` | `Calculations.value` (10896); `Calculations.related` (10898) | GATED-STORE |
| [packages/store/src/store.ts:1433](../../packages/store/src/store.ts#L1433) `Store/hasOwnPassword` | `SQLite.get` (1433); `SQLite.prepare` (1433); `Store.sql` (1433) | CORE |
| [packages/store/src/store.ts:5882](../../packages/store/src/store.ts#L5882) `Store/hasPasskey` | `SQLite.get` (5882); `SQLite.prepare` (5882); `Store.sql` (5882) | CORE |
| [packages/store/src/store.ts:1414](../../packages/store/src/store.ts#L1414) `Store/hasProvingPassword` | `SQLite.get` (1414); `SQLite.prepare` (1414); `Store.sql` (1414) | CORE |
| [packages/store/src/store.ts:8878](../../packages/store/src/store.ts#L8878) `Store/hasTable` | `SQLite.get` (8878); `SQLite.prepare` (8878); `Store.sql` (8878) | CORE |
| [packages/store/src/store.ts:5741](../../packages/store/src/store.ts#L5741) `Store/hasTotp` | `SQLite.get` (5741); `SQLite.prepare` (5741); `Store.sql` (5741) | CORE |
| [packages/store/src/store.ts:5212](../../packages/store/src/store.ts#L5212) `Store/identityAllowed` | `SQLite.get` (5212, 5218, 5224); `SQLite.prepare` (5212, 5218, 5224); `Store.sql` (5212, 5218, 5224) | CORE |
| [packages/store/src/store.ts:7061](../../packages/store/src/store.ts#L7061) `Store/image` | `SQLite.get` (7061); `SQLite.prepare` (7061); `Store.sql` (7061) | CORE |
| [packages/store/src/store.ts:7071](../../packages/store/src/store.ts#L7071) `Store/images` | `SQLite.all` (7071); `SQLite.prepare` (7071); `Store.sql` (7071) | CORE |
| [packages/store/src/store.ts:4933](../../packages/store/src/store.ts#L4933) `Store/importAccounts` | `SQLite.all` (4933); `SQLite.prepare` (4933); `Store.sql` (4933) | CORE |
| [packages/store/src/store.ts:1747](../../packages/store/src/store.ts#L1747) `Store/independentWindowWrite` | `SQLite.get` (1747); `SQLite.prepare` (1747, 1755, 1815); `Store.sql` (1747, 1755, 1765, 1793, 1810, 1815, 1818); `SQLite.all` (1755); `Store.row` (1813) | CORE |
| [packages/store/src/store.ts:2226](../../packages/store/src/store.ts#L2226) `Store/nextRecordId` | `SQLite.get` (2226); `SQLite.prepare` (2226); `Store.sql` (2226) | CORE |
| [packages/store/src/store.ts:1592](../../packages/store/src/store.ts#L1592) `Store/securityChainHeadAudit` | `SQLite.get` (1592); `SQLite.prepare` (1592); `Store.sql` (1592) | CORE |
| [packages/store/src/store.ts:8890](../../packages/store/src/store.ts#L8890) `Store/indexedFields` | `SQLite.all` (8890, 8891); `SQLite.prepare` (8890, 8891); `Store.sql` (8890, 8891) | CORE |
| [packages/store/src/store.ts:11282](../../packages/store/src/store.ts#L11282) `Store/internalRoots` | `SQLite.get` (11282); `SQLite.prepare` (11282, 11284); `SQLite.all` (11284) | CORE |
| [packages/store/src/store.ts:3676](../../packages/store/src/store.ts#L3676) `Store/isAgent` | `SQLite.get` (3676); `SQLite.prepare` (3676); `Store.sql` (3676) | CORE |
| [packages/store/src/store.ts:3779](../../packages/store/src/store.ts#L3779) `Store/isExternal` | `SQLite.get` (3779); `SQLite.prepare` (3779); `Store.sql` (3779) | CORE |
| [packages/store/src/store.ts:5796](../../packages/store/src/store.ts#L5796) `Store/issueWebauthnChallenge` | `SQLite.prepare` (5796, 5798, 5799, 5801); `Store.sql` (5796, 5798, 5799, 5801); `SQLite.get` (5798) | CORE |
| [packages/store/src/store.ts:11144](../../packages/store/src/store.ts#L11144) `Store/iterateCommitted` | `SQLite.iterate` (11144) | CORE |
| [packages/store/src/store.ts:1687](../../packages/store/src/store.ts#L1687) `Store/joinTransaction` | `Store.sql` (1687, 1688, 1690, 1692, 1698, 1701) | CORE |
| [packages/store/src/store.ts:10534](../../packages/store/src/store.ts#L10534) `Store/keyStepWork` | `Store.sql` (10534, 10540, 10544, 10546) | CORE |
| [packages/store/src/store.ts:6928](../../packages/store/src/store.ts#L6928) `Store/knownSharedAccount` | `SQLite.get` (6928); `SQLite.prepare` (6928); `Store.sql` (6928) | CORE |
| [packages/store/src/store.ts:4406](../../packages/store/src/store.ts#L4406) `Store/lastSignIns` | `Store.auditLog` (4406) | CORE |
| [packages/store/src/store.ts:10352](../../packages/store/src/store.ts#L10352) `Store/latestDeleteSeq` | `SQLite.get` (10352); `SQLite.prepare` (10352); `Store.sql` (10352) | CORE |
| [packages/store/src/store.ts:7101](../../packages/store/src/store.ts#L7101) `Store/layout` | `SQLite.get` (7101); `SQLite.prepare` (7101); `Store.sql` (7101) | CORE |
| [packages/store/src/store.ts:3349](../../packages/store/src/store.ts#L3349) `Store/layoutHistory` | `SQLite.all` (3349); `SQLite.prepare` (3349); `Store.sql` (3349) | CORE |
| [packages/store/src/store.ts:6991](../../packages/store/src/store.ts#L6991) `Store/layouts` | `SQLite.all` (6991); `SQLite.prepare` (6991); `Store.sql` (6991) | CORE |
| [packages/store/src/store.ts:4706](../../packages/store/src/store.ts#L4706) `Store/leastPrivilege` | `SQLite.all` (4706); `SQLite.prepare` (4706); `Store.sql` (4706) | CORE |
| [packages/store/src/store.ts:5310](../../packages/store/src/store.ts#L5310) `Store/ledgerRow` | `SQLite.get` (5310, 5311); `SQLite.prepare` (5310, 5311); `Store.sql` (5310, 5311) | AUTH |
| [packages/store/src/store.ts:5322](../../packages/store/src/store.ts#L5322) `Store/ledgerWrite` | `Store.sql` (5322, 5323, 5325, 5327, 5330, 5330) | AUTH |
| [packages/store/src/store.ts:5016](../../packages/store/src/store.ts#L5016) `Store/limitAccountImport` | `SQLite.prepare` (5016, 5017, 5020); `Store.sql` (5016, 5017, 5020); `SQLite.get` (5017) | CORE |
| [packages/store/src/store.ts:3629](../../packages/store/src/store.ts#L3629) `Store/linkIdentity` | `SQLite.get` (3629); `SQLite.prepare` (3629); `Store.sql` (3629) | CORE |
| [packages/store/src/store.ts:3621](../../packages/store/src/store.ts#L3621) `Store/linkPrincipal` | `SQLite.get` (3621); `SQLite.prepare` (3621); `Store.sql` (3621) | CORE |
| [packages/store/src/store.ts:4292](../../packages/store/src/store.ts#L4292) `Store/markPiiField` | `SQLite.prepare` (4292); `Store.sql` (4292) | CORE |
| [packages/store/src/store.ts:8029](../../packages/store/src/store.ts#L8029) `Store/markRepeating` | `SQLite.prepare` (8029); `Store.sql` (8029) | CORE |
| [packages/store/src/store.ts:11077](../../packages/store/src/store.ts#L11077) `Store/matchIds` | `Store.matchIds` (11077); `SQLite.all` (11083); `SQLite.prepare` (11083); `Store.sql` (11083) | CORE |
| [packages/store/src/store.ts:1448](../../packages/store/src/store.ts#L1448) `Store/meta` | `SQLite.get` (1448); `SQLite.prepare` (1448); `Store.sql` (1448) | CORE |
| [packages/store/src/store.ts:1005](../../packages/store/src/store.ts#L1005) `Store/metadataVersions` | `SQLite.get` (1005); `SQLite.prepare` (1005); `Store.sql` (1005) | CORE |
| [packages/store/src/store.ts:8666](../../packages/store/src/store.ts#L8666) `Store/moveContainersIn` | `Store.sql` (8666, 8672, 8674, 8675, 8676, 8677, 8697, 8702, 8702, 8713, 8716, 8719, 8726); `SQLite.prepare` (8674, 8675, 8676, 8677, 8713, 8719); `SQLite.get` (8679, 8713, 8719) | CORE |
| [packages/store/src/store.ts:8588](../../packages/store/src/store.ts#L8588) `Store/moveContainersOut` | `Store.sql` (8588, 8596, 8598, 8600, 8605, 8606, 8626, 8632, 8634, 8636, 8636, 8642, 8642, 8647, 8649, 8651, 8651, 8657); `SQLite.get` (8596); `SQLite.prepare` (8596, 8605, 8606); `Store.container` (8608) | CORE |
| [packages/store/src/store.ts:4887](../../packages/store/src/store.ts#L4887) `Store/mustChangePassword` | `SQLite.get` (4887); `SQLite.prepare` (4887); `Store.sql` (4887) | CORE |
| [packages/store/src/store.ts:1384](../../packages/store/src/store.ts#L1384) `Store/nativeIdGuards` | `Store.sql` (1384, 1385, 1387) | CORE |
| [packages/store/src/store.ts:5616](../../packages/store/src/store.ts#L5616) `Store/objectUseSince` | `SQLite.get` (5616); `SQLite.prepare` (5616); `Store.sql` (5616) | CORE |
| [packages/store/src/store.ts:8850](../../packages/store/src/store.ts#L8850) `Store/orderBy` | `Store.valueListItems` (8850) | CORE |
| [packages/store/src/store.ts:8221](../../packages/store/src/store.ts#L8221) `Store/orphanContainerReport` | `SQLite.all` (8221); `SQLite.prepare` (8221); `Store.sql` (8221) | CORE |
| [packages/store/src/store.ts:5848](../../packages/store/src/store.ts#L5848) `Store/passkeyAllowList` | `SQLite.all` (5848); `SQLite.prepare` (5848); `Store.sql` (5848) | CORE |
| [packages/store/src/store.ts:5887](../../packages/store/src/store.ts#L5887) `Store/passkeyIds` | `SQLite.all` (5887); `SQLite.prepare` (5887); `Store.sql` (5887) | CORE |
| [packages/store/src/store.ts:5875](../../packages/store/src/store.ts#L5875) `Store/passkeys` | `SQLite.all` (5875); `SQLite.prepare` (5875); `Store.sql` (5875) | CORE |
| [packages/store/src/store.ts:4926](../../packages/store/src/store.ts#L4926) `Store/passwordDaysRemaining` | `SQLite.get` (4926); `SQLite.prepare` (4926); `Store.sql` (4926) | CORE |
| [packages/store/src/store.ts:3864](../../packages/store/src/store.ts#L3864) `Store/pendingChanges` | `SQLite.all` (3864); `SQLite.prepare` (3864); `Store.sql` (3864) | CORE |
| [packages/store/src/store.ts:1466](../../packages/store/src/store.ts#L1466) `Store/persistentData` | `SQLite.get` (1466) | CORE |
| [packages/store/src/store.ts:1475](../../packages/store/src/store.ts#L1475) `Store/persistentDataIds` | `SQLite.all` (1475) | CORE |
| [packages/store/src/store.ts:1456](../../packages/store/src/store.ts#L1456) `Store/persistentTable` | `Store.sql` (1456) | CORE |
| [packages/store/src/store.ts:10195](../../packages/store/src/store.ts#L10195) `Store/portalContainerTarget` | `Store.row` (10195); `relatedIdList` (10197) | CORE |
| [packages/store/src/store.ts:7646](../../packages/store/src/store.ts#L7646) `Store/portalCountsCurrent` | `Store.canView` (7646); `Store.row` (7673) | GATED-STORE |
| [packages/store/src/store.ts:7884](../../packages/store/src/store.ts#L7884) `Store/portalRows` | `relatedRows` (7884); `relatedIdList` (7885); `Store.viewableSet` (7888); `rowsById` (7913, 7951); `Calculations.related` (7927) | CORE |
| [packages/store/src/store.ts:7895](../../packages/store/src/store.ts#L7895) `Store/portalRows/context` | `Calculations.context` (7895) | CORE |
| [packages/store/src/store.ts:7905](../../packages/store/src/store.ts#L7905) `Store/portalRows/valueOf` | `Calculations.value` (7905) | CORE |
| [packages/store/src/store.ts:2602](../../packages/store/src/store.ts#L2602) `Store/prepared` | `SQLite.prepare` (2602); `Store.sql` (2602) | CORE |
| [packages/store/src/store.ts:4998](../../packages/store/src/store.ts#L4998) `Store/previewAccountImport` | `Store.sql` (4998, 4999, 5008) | CORE |
| [packages/store/src/store.ts:6691](../../packages/store/src/store.ts#L6691) `Store/previewRecordRuleCurrent` | `SQLite.get` (6691); `SQLite.prepare` (6691, 6694); `Store.sql` (6691, 6694); `SQLite.all` (6694); `Calculations.context` (6700, 6716) | CORE |
| [packages/store/src/store.ts:9371](../../packages/store/src/store.ts#L9371) `Store/previewRow` | `Store.row` (9371) | CORE |
| [packages/store/src/store.ts:6102](../../packages/store/src/store.ts#L6102) `Store/privilegeSets` | `Store.sql` (6102) | CORE |
| [packages/store/src/store.ts:2834](../../packages/store/src/store.ts#L2834) `Store/pruneAudit` | `Store.sql` (2834, 2836, 2838); `SQLite.get` (2836); `SQLite.prepare` (2836) | CORE |
| [packages/store/src/store.ts:8256](../../packages/store/src/store.ts#L8256) `Store/purgeOrphanContainers` | `Store.sql` (8256, 8260, 8269, 8272, 8273, 8278, 8279, 8281, 8281); `Store.orphanContainerReport` (8264); `SQLite.get` (8269); `SQLite.prepare` (8269, 8272, 8273) | CORE |
| [packages/store/src/store.ts:11402](../../packages/store/src/store.ts#L11402) `Store/query` | `SQLite.iterate` (11402) | CORE |
| [packages/store/src/store.ts:11442](../../packages/store/src/store.ts#L11442) `Store/queryWithOriginsCurrent` | `SQLite.iterate` (11442); `SQLite.all` (11451, 11454); `SQLite.prepare` (11451, 11454) | CORE |
| [packages/store/src/store.ts:11194](../../packages/store/src/store.ts#L11194) `Store/readOnlyChecked` | `SQLite.prepare` (11194, 11198, 11207, 11212); `SQLite.all` (11198, 11207, 11212) | CORE |
| [packages/store/src/store.ts:3601](../../packages/store/src/store.ts#L3601) `Store/recompute` | `SQLite.prepare` (3601, 3605); `Store.sql` (3601, 3605); `SQLite.iterate` (3605); `Calculations.computeStoredStyled` (3606); `Calculations.value` (3606) | CORE |
| [packages/store/src/store.ts:2617](../../packages/store/src/store.ts#L2617) `Store/recordAsOf` | `SQLite.get` (2617, 2619); `SQLite.prepare` (2617, 2619, 2621, 2622); `Store.sql` (2617, 2619, 2621, 2622); `SQLite.all` (2621, 2622) | CORE |
| [packages/store/src/store.ts:2313](../../packages/store/src/store.ts#L2313) `Store/recordCount` | `SQLite.get` (2313); `SQLite.prepare` (2313); `Store.sql` (2313) | CORE |
| [packages/store/src/store.ts:2694](../../packages/store/src/store.ts#L2694) `Store/recordLife` | `SQLite.all` (2694); `SQLite.prepare` (2694); `Store.sql` (2694) | CORE |
| [packages/store/src/store.ts:5547](../../packages/store/src/store.ts#L5547) `Store/recordObjectUse` | `Store.sql` (5547) | CORE |
| [packages/store/src/store.ts:9897](../../packages/store/src/store.ts#L9897) `Store/recordViewable` | `Store.row` (9897) | GATED-STORE |
| [packages/store/src/store.ts:1513](../../packages/store/src/store.ts#L1513) `Store/recordedFormat` | `Store.sql` (1513) | CORE |
| [packages/store/src/store.ts:8560](../../packages/store/src/store.ts#L8560) `Store/recoverContainersOut` | `SQLite.prepare` (8560); `Store.sql` (8560); `SQLite.get` (8563) | CORE |
| [packages/store/src/store.ts:1616](../../packages/store/src/store.ts#L1616) `Store/recoverPendingExternalFiles` | `Store.sql` (1616, 1618, 1642, 1644); `SQLite.prepare` (1618); `SQLite.get` (1629) | CORE |
| [packages/store/src/store.ts:6045](../../packages/store/src/store.ts#L6045) `Store/recoveryCodesRemaining` | `SQLite.get` (6045); `SQLite.prepare` (6045); `Store.sql` (6045) | CORE |
| [packages/store/src/store.ts:11234](../../packages/store/src/store.ts#L11234) `Store/refreshDecimalSqlViews` | `SQLite.get` (11234); `SQLite.prepare` (11234) | CORE |
| [packages/store/src/store.ts:3770](../../packages/store/src/store.ts#L3770) `Store/refuseLookalikeAccount` | `SQLite.all` (3770); `SQLite.prepare` (3770); `Store.sql` (3770) | CORE |
| [packages/store/src/store.ts:5911](../../packages/store/src/store.ts#L5911) `Store/registerPasskey` | `SQLite.prepare` (5911); `Store.sql` (5911) | CORE |
| [packages/store/src/store.ts:3899](../../packages/store/src/store.ts#L3899) `Store/rejectPending` | `SQLite.get` (3899); `SQLite.prepare` (3899, 3901); `Store.sql` (3899, 3901) | CORE |
| [packages/store/src/store.ts:9123](../../packages/store/src/store.ts#L9123) `Store/relatedCriteria` | `SQLite.iterate` (9123); `SQLite.prepare` (9123); `Store.sql` (9123) | CORE |
| [packages/store/src/store.ts:9120](../../packages/store/src/store.ts#L9120) `Store/relatedCriteria/matched` | `relatedRows` (9120) | CORE |
| [packages/store/src/store.ts:7433](../../packages/store/src/store.ts#L7433) `Store/relatedValues` | `Calculations.globalValue` (7433); `Calculations.unstoredValue` (7435) | CORE |
| [packages/store/src/store.ts:5924](../../packages/store/src/store.ts#L5924) `Store/removePasskey` | `SQLite.get` (5924); `SQLite.prepare` (5924, 5925); `Store.sql` (5924, 5925) | CORE |
| [packages/store/src/store.ts:10372](../../packages/store/src/store.ts#L10372) `Store/restoreDeletedRowLocked` | `SQLite.get` (10372, 10377); `SQLite.prepare` (10372, 10373, 10377, 10387); `Store.sql` (10372, 10373, 10377, 10387); `SQLite.all` (10373) | CORE |
| [packages/store/src/store.ts:2652](../../packages/store/src/store.ts#L2652) `Store/restoreRecord` | `Store.recordAsOf` (2652); `SQLite.get` (2656); `SQLite.prepare` (2656, 2661, 2670, 2681); `Store.sql` (2656, 2661, 2670, 2681) | CORE |
| [packages/store/src/store.ts:2710](../../packages/store/src/store.ts#L2710) `Store/revertAuditEntry` | `SQLite.get` (2710); `SQLite.prepare` (2710); `Store.sql` (2710); `Store.canViewRecord` (2712); `Store.auditLog` (2715) | CORE |
| [packages/store/src/store.ts:5672](../../packages/store/src/store.ts#L5672) `Store/revokeApiToken` | `SQLite.prepare` (5672); `Store.sql` (5672) | CORE |
| [packages/store/src/store.ts:5195](../../packages/store/src/store.ts#L5195) `Store/revokeSignInCredentials` | `SQLite.prepare` (5195, 5196, 5197); `Store.sql` (5195, 5196, 5197) | AUTH |
| [packages/store/src/store.ts:9389](../../packages/store/src/store.ts#L9389) `Store/row` | `SQLite.get` (9389) | CORE |
| [packages/store/src/store.ts:11338](../../packages/store/src/store.ts#L11338) `Store/rowsOf` | `SQLite.iterate` (11338, 11347) | CORE |
| [packages/store/src/store.ts:6496](../../packages/store/src/store.ts#L6496) `Store/ruleOutcome` | `Calculations.context` (6496) | CORE |
| [packages/store/src/store.ts:9234](../../packages/store/src/store.ts#L9234) `Store/runningSummaryValues` | `Store.viewableIds` (9234); `rowsById` (9236); `Calculations.value` (9247, 9253); `Calculations.related` (9264) | GATED-STORE |
| [packages/store/src/store.ts:6131](../../packages/store/src/store.ts#L6131) `Store/savePrivilegeSet` | `SQLite.prepare` (6131, 6139); `Store.sql` (6131, 6139) | AUTH |
| [packages/store/src/store.ts:4123](../../packages/store/src/store.ts#L4123) `Store/saveScriptTest` | `SQLite.prepare` (4123); `Store.sql` (4123) | CORE |
| [packages/store/src/store.ts:6656](../../packages/store/src/store.ts#L6656) `Store/scopedTableSql` | `Store.viewableIds` (6656); `SQLite.all` (6659); `SQLite.prepare` (6659); `Store.sql` (6659) | GATED-STORE |
| [packages/store/src/store.ts:3339](../../packages/store/src/store.ts#L3339) `Store/scriptHistory` | `SQLite.all` (3339); `SQLite.prepare` (3339); `Store.sql` (3339) | CORE |
| [packages/store/src/store.ts:3012](../../packages/store/src/store.ts#L3012) `Store/securityChange` | `Store.sql` (3012, 3014); `SQLite.prepare` (3014) | CORE |
| [packages/store/src/store.ts:2576](../../packages/store/src/store.ts#L2576) `Store/securityEvents` | `Store.auditLog` (2576) | CORE |
| [packages/store/src/store.ts:5396](../../packages/store/src/store.ts#L5396) `Store/securityToken` | `SQLite.get` (5396); `SQLite.prepare` (5396); `Store.sql` (5396) | CORE |
| [packages/store/src/store.ts:11368](../../packages/store/src/store.ts#L11368) `Store/selectHeldCurrent` | `Store.sql` (11368, 11369, 11371); `SQLite.prepare` (11369) | CORE |
| [packages/store/src/store.ts:10677](../../packages/store/src/store.ts#L10677) `Store/selectIdsCurrent` | `Store.selectIds` (10677); `SQLite.all` (10683); `SQLite.prepare` (10683); `Store.sql` (10683) | GATED-STORE |
| [packages/store/src/store.ts:11358](../../packages/store/src/store.ts#L11358) `Store/selectIn` | `Store.select` (11358) | CORE |
| [packages/store/src/store.ts:1979](../../packages/store/src/store.ts#L1979) `Store/selfContainedCopy` | `Store.sql` (1979); `SQLite.all` (1984); `SQLite.prepare` (1984, 1986, 1987, 1988) | CORE |
| [packages/store/src/store.ts:5174](../../packages/store/src/store.ts#L5174) `Store/setAccountActive` | `SQLite.prepare` (5174, 5182, 5183); `Store.sql` (5174, 5182, 5183) | AUTH |
| [packages/store/src/store.ts:5415](../../packages/store/src/store.ts#L5415) `Store/setAccountLocalOnly` | `SQLite.prepare` (5415); `Store.sql` (5415) | CORE |
| [packages/store/src/store.ts:6287](../../packages/store/src/store.ts#L6287) `Store/setAccountPrivilegeSet` | `SQLite.get` (6287); `SQLite.prepare` (6287, 6290, 6294); `Store.sql` (6287, 6290, 6294) | AUTH |
| [packages/store/src/store.ts:5424](../../packages/store/src/store.ts#L5424) `Store/setAccountRequire2fa` | `SQLite.prepare` (5424); `Store.sql` (5424) | CORE |
| [packages/store/src/store.ts:3800](../../packages/store/src/store.ts#L3800) `Store/setAgentAccount` | `SQLite.get` (3800); `SQLite.prepare` (3800, 3806); `Store.sql` (3800, 3806) | CORE |
| [packages/store/src/store.ts:4167](../../packages/store/src/store.ts#L4167) `Store/setAiAllowed` | `SQLite.prepare` (4167); `Store.sql` (4167) | CORE |
| [packages/store/src/store.ts:4250](../../packages/store/src/store.ts#L4250) `Store/setAiPolicy` | `SQLite.prepare` (4250); `Store.sql` (4250) | CORE |
| [packages/store/src/store.ts:6915](../../packages/store/src/store.ts#L6915) `Store/setAllowBlankPasswordFromLan` | `SQLite.prepare` (6915); `Store.sql` (6915) | CORE |
| [packages/store/src/store.ts:2812](../../packages/store/src/store.ts#L2812) `Store/setAuditSettings` | `SQLite.prepare` (2812); `Store.sql` (2812) | CORE |
| [packages/store/src/store.ts:8779](../../packages/store/src/store.ts#L8779) `Store/setContainer` | `Store.sql` (8779); `Store.row` (8785) | CORE |
| [packages/store/src/store.ts:3752](../../packages/store/src/store.ts#L3752) `Store/setExternalAccount` | `SQLite.get` (3752); `SQLite.prepare` (3752, 3757); `Store.sql` (3752, 3757) | CORE |
| [packages/store/src/store.ts:4873](../../packages/store/src/store.ts#L4873) `Store/setMustChangePassword` | `SQLite.prepare` (4873); `Store.sql` (4873) | CORE |
| [packages/store/src/store.ts:3952](../../packages/store/src/store.ts#L3952) `Store/setPassword` | `SQLite.get` (3952); `SQLite.prepare` (3952, 3958, 3967, 3974, 3975, 3976); `Store.sql` (3952, 3958, 3967, 3974, 3975, 3976) | AUTH |
| [packages/store/src/store.ts:4064](../../packages/store/src/store.ts#L4064) `Store/setPasswordPolicy` | `SQLite.prepare` (4064); `Store.sql` (4064) | CORE |
| [packages/store/src/store.ts:1481](../../packages/store/src/store.ts#L1481) `Store/setPersistentData` | `SQLite.prepare` (1481, 1485); `Store.sql` (1481, 1485) | CORE |
| [packages/store/src/store.ts:4270](../../packages/store/src/store.ts#L4270) `Store/setPiiIsolation` | `SQLite.prepare` (4270); `Store.sql` (4270) | CORE |
| [packages/store/src/store.ts:4100](../../packages/store/src/store.ts#L4100) `Store/setRequireTotpForFullAccess` | `SQLite.prepare` (4100); `Store.sql` (4100) | CORE |
| [packages/store/src/store.ts:4182](../../packages/store/src/store.ts#L4182) `Store/setScriptNetwork` | `SQLite.prepare` (4182); `Store.sql` (4182) | CORE |
| [packages/store/src/store.ts:4239](../../packages/store/src/store.ts#L4239) `Store/setSqlRequiresFmxdbc` | `SQLite.prepare` (4239); `Store.sql` (4239) | CORE |
| [packages/store/src/store.ts:9818](../../packages/store/src/store.ts#L9818) `Store/setStoredCalcValues` | `SQLite.prepare` (9818, 9819); `Store.sql` (9818, 9819); `SQLite.get` (9823) | CORE |
| [packages/store/src/store.ts:8882](../../packages/store/src/store.ts#L8882) `Store/setUserPref` | `Store.sql` (8882, 8883, 8884); `SQLite.prepare` (8883, 8884) | CORE |
| [packages/store/src/store.ts:4223](../../packages/store/src/store.ts#L4223) `Store/setWebViewerHosts` | `SQLite.prepare` (4223); `Store.sql` (4223) | CORE |
| [packages/store/src/store.ts:5349](../../packages/store/src/store.ts#L5349) `Store/settleSignIns` | `SQLite.all` (5349, 5355); `SQLite.prepare` (5349, 5355, 5361, 5365, 5367); `Store.sql` (5349, 5355, 5361, 5365, 5367) | AUTH |
| [packages/store/src/store.ts:2110](../../packages/store/src/store.ts#L2110) `Store/shareResults` | `Store.sql` (2110) | CORE |
| [packages/store/src/store.ts:1543](../../packages/store/src/store.ts#L1543) `Store/shipWal` | `Store.sql` (1543) | CORE |
| [packages/store/src/store.ts:5296](../../packages/store/src/store.ts#L5296) `Store/signInBase` | `SQLite.get` (5296); `SQLite.prepare` (5296); `Store.sql` (5296) | AUTH |
| [packages/store/src/store.ts:5298](../../packages/store/src/store.ts#L5298) `Store/signInBase/identity` | `SQLite.get` (5298); `SQLite.prepare` (5298); `Store.sql` (5298) | AUTH |
| [packages/store/src/store.ts:5285](../../packages/store/src/store.ts#L5285) `Store/signInMark` | `SQLite.prepare` (5285); `Store.sql` (5285) | AUTH |
| [packages/store/src/store.ts:10975](../../packages/store/src/store.ts#L10975) `Store/sortIdsCurrentProgress` | `Store.sortIds` (10975); `Store.sortIdsProgress` (10975); `SQLite.all` (10988); `SQLite.prepare` (10988, 11063); `Store.sql` (10988, 11063); `Store.valueListItems` (10996); `rowsById` (11008); `Calculations.globalValue` (11011); `Calculations.unstoredValue` (11012); `Calculations.related` (11018); `SQLite.iterate` (11063) | GATED-STORE |
| [packages/store/src/store.ts:9048](../../packages/store/src/store.ts#L9048) `Store/sortedPage` | `SQLite.iterate` (9048); `SQLite.prepare` (9048, 9063); `Store.sql` (9048, 9063); `SQLite.all` (9063) | CORE |
| [packages/store/src/store.ts:11149](../../packages/store/src/store.ts#L11149) `Store/storedFileId` | `SQLite.get` (11149); `SQLite.prepare` (11149) | CORE |
| [packages/store/src/store.ts:9196](../../packages/store/src/store.ts#L9196) `Store/summaries` | `Calculations.wholeTable` (9196); `Calculations.collect` (9216, 9221) | CORE |
| [packages/store/src/store.ts:9212](../../packages/store/src/store.ts#L9212) `Store/summaries/recs` | `SQLite.iterate` (9212); `SQLite.prepare` (9212); `Store.sql` (9212) | CORE |
| [packages/store/src/store.ts:5862](../../packages/store/src/store.ts#L5862) `Store/takeWebauthnChallenge` | `SQLite.get` (5862); `SQLite.prepare` (5862, 5866); `Store.sql` (5862, 5866) | CORE |
| [packages/store/src/store.ts:8935](../../packages/store/src/store.ts#L8935) `Store/timeFind` | `Store.query` (8935) | CORE |
| [packages/store/src/store.ts:8949](../../packages/store/src/store.ts#L8949) `Store/reportFind` | `Store.query` (8949, 8951, 8952); `Store.recordCount` (8954) | CORE |
| [packages/store/src/store.ts:7370](../../packages/store/src/store.ts#L7370) `Store/toRecord` | `Calculations.value` (7370, 7380); `Calculations.globalValue` (7374); `Calculations.unstoredStyled` (7379) | CORE |
| [packages/store/src/store.ts:5746](../../packages/store/src/store.ts#L5746) `Store/totpAccounts` | `SQLite.all` (5746); `SQLite.prepare` (5746); `Store.sql` (5746) | CORE |
| [packages/store/src/store.ts:1555](../../packages/store/src/store.ts#L1555) `Store/trial` | `Store.sql` (1555) | CORE |
| [packages/store/src/store.ts:1560](../../packages/store/src/store.ts#L1560) `Store/trial/undo` | `Store.sql` (1560) | CORE |
| [packages/store/src/store.ts:11105](../../packages/store/src/store.ts#L11105) `Store/truncate/run` | `Store.sql` (11105, 11107, 11114, 11116, 11118, 11119); `SQLite.prepare` (11107, 11114); `SQLite.all` (11109) | CORE |
| [packages/store/src/store.ts:3699](../../packages/store/src/store.ts#L3699) `Store/unmigratedAccounts` | `SQLite.all` (3699); `SQLite.prepare` (3699); `Store.sql` (3699) | CORE |
| [packages/store/src/store.ts:4779](../../packages/store/src/store.ts#L4779) `Store/unusedAccess` | `SQLite.get` (4779); `SQLite.prepare` (4779, 4788); `Store.sql` (4779, 4788); `SQLite.all` (4788) | CORE |
| [packages/store/src/store.ts:4827](../../packages/store/src/store.ts#L4827) `Store/unusedObjects` | `SQLite.get` (4827); `SQLite.prepare` (4827, 4830); `Store.sql` (4827, 4830); `SQLite.all` (4830) | CORE |
| [packages/store/src/store.ts:5986](../../packages/store/src/store.ts#L5986) `Store/unusedRecoveryHashes` | `SQLite.all` (5986); `SQLite.prepare` (5986); `Store.sql` (5986) | CORE |
| [packages/store/src/store.ts:4609](../../packages/store/src/store.ts#L4609) `Store/unusualAccess` | `Store.auditLog` (4609, 4675) | CORE |
| [packages/store/src/store.ts:9639](../../packages/store/src/store.ts#L9639) `Store/update` | `Store.row` (9639); `Store.sql` (9670, 9671, 9710, 9713) | CORE |
| [packages/store/src/store.ts:9673](../../packages/store/src/store.ts#L9673) `Store/update/undo` | `Store.sql` (9673) | CORE |
| [packages/store/src/store.ts:10103](../../packages/store/src/store.ts#L10103) `Store/updatePortals` | `Store.row` (10103, 10139); `relatedRows` (10140) | CORE |
| [packages/store/src/store.ts:10113](../../packages/store/src/store.ts#L10113) `Store/updatePortals/portal/related` | `relatedIdList` (10113) | CORE |
| [packages/store/src/store.ts:10085](../../packages/store/src/store.ts#L10085) `Store/updateRelated` | `relatedRows` (10085) | CORE |
| [packages/store/src/store.ts:4865](../../packages/store/src/store.ts#L4865) `Store/usageCounting` | `SQLite.get` (4865); `SQLite.prepare` (4865); `Store.sql` (4865) | CORE |
| [packages/store/src/store.ts:8873](../../packages/store/src/store.ts#L8873) `Store/userPrefs` | `SQLite.all` (8873); `SQLite.prepare` (8873); `Store.sql` (8873) | CORE |
| [packages/store/src/store.ts:7755](../../packages/store/src/store.ts#L7755) `Store/valueListItemsCurrent` | `Store.valueListItems` (7755); `Store.get` (7769); `relatedRows` (7770); `Store.row` (7770); `SQLite.iterate` (7772); `SQLite.prepare` (7772); `Store.sql` (7772); `Calculations.related` (7782); `Calculations.value` (7786, 7787) | GATED-STORE |
| [packages/store/src/store.ts:10294](../../packages/store/src/store.ts#L10294) `Store/vaultHeld` | `SQLite.get` (10294); `SQLite.prepare` (10294); `Store.sql` (10294) | CORE |
| [packages/store/src/store.ts:5775](../../packages/store/src/store.ts#L5775) `Store/verifyTotp` | `SQLite.get` (5775); `SQLite.prepare` (5775, 5782); `Store.sql` (5775, 5782) | CORE |
| [packages/store/src/store.ts:2246](../../packages/store/src/store.ts#L2246) `Store/versionNumber` | `SQLite.get` (2246); `SQLite.prepare` (2246); `Store.sql` (2246) | CORE |
| [packages/store/src/store.ts:2121](../../packages/store/src/store.ts#L2121) `Store/versionTriggers` | `SQLite.get` (2121); `SQLite.prepare` (2121, 2126, 2127); `Store.sql` (2121, 2126, 2127, 2144, 2146, 2147, 2149); `SQLite.all` (2126, 2127) | CORE |
| [packages/store/src/store.ts:2089](../../packages/store/src/store.ts#L2089) `Store/warmSummariesCurrent` | `Calculations.wholeTable` (2089) | CORE |
| [packages/store/src/store.ts:4205](../../packages/store/src/store.ts#L4205) `Store/webViewerChecked` | `SQLite.get` (4205); `SQLite.prepare` (4205); `Store.sql` (4205) | CORE |
| [packages/store/src/store.ts:1847](../../packages/store/src/store.ts#L1847) `Store/withWriteTransaction` | `Store.sql` (1847, 1859, 1865, 1867, 1867) | CORE |
| [packages/store/src/store.ts:7305](../../packages/store/src/store.ts#L7305) `Store/wordIndex` | `Store.sql` (7305, 7313, 7318); `Store.recordCount` (7317); `SQLite.get` (7318); `SQLite.prepare` (7318) | CORE |
| [packages/store/src/store.ts:8453](../../packages/store/src/store.ts#L8453) `Store/writeExternalFile` | `Store.evaluateEach` (8453); `SQLite.prepare` (8476); `Store.sql` (8476) | CORE |
| [packages/store/src/store.ts:8477](../../packages/store/src/store.ts#L8477) `Store/writeExternalFile/taken` | `SQLite.get` (8477) | CORE |
| [packages/store/src/store.ts:5605](../../packages/store/src/store.ts#L5605) `Store/writeObjectUseRows` | `SQLite.prepare` (5605, 5606, 5611); `Store.sql` (5605, 5606, 5611) | CORE |
| [packages/store/src/store.ts:2301](../../packages/store/src/store.ts#L2301) `Store/writeToken` | `SQLite.get` (2301); `SQLite.prepare` (2301); `Store.sql` (2301) | CORE |
| [packages/store/src/store.ts:5577](../../packages/store/src/store.ts#L5577) `Store/writeUsage` | `Store.sql` (5577, 5578, 5580, 5584, 5586) | CORE |
| [packages/store/src/store.ts:5593](../../packages/store/src/store.ts#L5593) `Store/writeUsageRows` | `SQLite.prepare` (5593, 5594, 5600); `Store.sql` (5593, 5594, 5600) | CORE |
| [packages/store/src/store.ts:7026](../../packages/store/src/store.ts#L7026) `Store/design` | `SQLite.get` (7026) | CORE |
| [packages/store/src/store.ts:7048](../../packages/store/src/store.ts#L7048) `Store/themes` | `SQLite.get` (7048) | CORE |
| [packages/store/src/store.ts:5946](../../packages/store/src/store.ts#L5946) `Store/verifyPasskeyCredential` | `SQLite.get` (5946); `SQLite.prepare` (5946, 5958); `Store.sql` (5946, 5958) | CORE |
| [packages/store/src/store.ts:6886](../../packages/store/src/store.ts#L6886) `Store/passwordState` | `SQLite.get` (6886); `SQLite.prepare` (6886); `Store.sql` (6886) | CORE |
| [packages/store/src/store.ts:10238](../../packages/store/src/store.ts#L10238) `Store/deleteVisibility` | `Store.canViewRecord` (10238) | CORE |
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
| [packages/store/src/trace.ts:150](../../packages/store/src/trace.ts#L150) `traceDatabase/get` | `SQLite.prepare` (150) | CORE |
| [packages/store/src/words.ts:155](../../packages/store/src/words.ts#L155) `WordIndexes/dropAll` | `SQLite.all` (155); `SQLite.prepare` (155) | CORE |
| [packages/store/src/words.ts:78](../../packages/store/src/words.ts#L78) `WordIndexes/ensure` | `SQLite.prepare` (78, 82); `SQLite.get` (81); `SQLite.all` (82) | CORE |
| [packages/store/src/words.ts:85](../../packages/store/src/words.ts#L85) `WordIndexes/ensure/covers` | `SQLite.get` (85, 89); `SQLite.all` (86); `SQLite.prepare` (86, 89) | CORE |
| [packages/store/src/native-compat.ts:61](../../packages/store/src/native-compat.ts#L61) `storedState/meta` | `SQLite.get` (61); `SQLite.prepare` (61) | OPERATOR |
| [packages/store/src/native-compat.ts:91](../../packages/store/src/native-compat.ts#L91) `dateFields` | `SQLite.all` (91); `SQLite.prepare` (91) | OPERATOR |
| [packages/store/src/native-compat.ts:115](../../packages/store/src/native-compat.ts#L115) `inspectUpgrade` | `SQLite.get` (115); `SQLite.prepare` (115, 123); `SQLite.iterate` (123) | OPERATOR |
| [packages/store/src/native-compat.ts:157](../../packages/store/src/native-compat.ts#L157) `upgradeNativeFile` | `SQLite.iterate` (157); `SQLite.prepare` (157, 158, 164) | OPERATOR |
| [packages/server/src/inbound-hooks.ts:290](../../packages/server/src/inbound-hooks.ts#L290) `InboundHooks/claim` | `SQLite.get` (290, 298, 299); `SQLite.prepare` (290, 294, 295, 298, 299, 301) | AUTH |
<!-- end generated read-gate inventory -->
