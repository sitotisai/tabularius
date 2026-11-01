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
| [packages/server/src/insight.ts:1023](../../packages/server/src/insight.ts#L1023) `checkCalculation` | `Store.findIds` (1023); `Store.evaluate` (1027) | DESIGN |
| [packages/server/src/insight.ts:944](../../packages/server/src/insight.ts#L944) `columnProfile` | `Store.query` (944, 951, 963, 966) | PROFILE |
| [packages/server/src/insight.ts:868](../../packages/server/src/insight.ts#L868) `layoutProfile` | `Store.query` (868) | PROFILE |
| [packages/server/src/insight.ts:864](../../packages/server/src/insight.ts#L864) `layoutProfile/viewableIds` | `Store.viewableIds` (864) | PROFILE |
| [packages/server/src/insight.ts:1206](../../packages/server/src/insight.ts#L1206) `solutionOverview/counts` | `Store.query` (1206) | DESIGN |
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
| [packages/server/src/standby.ts:419](../../packages/server/src/standby.ts#L419) `Standby/copy` | `SQLite.get` (419); `SQLite.prepare` (419) | OPERATOR |
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
| [packages/store/src/store.ts:5291](../../packages/store/src/store.ts#L5291) `Store/accountIdentityId` | `SQLite.get` (5291, 5297); `SQLite.prepare` (5291, 5296, 5297); `Store.sql` (5291, 5296, 5297) | CORE |
| [packages/store/src/store.ts:5285](../../packages/store/src/store.ts#L5285) `Store/accountIdentityIdIfSet` | `SQLite.get` (5285); `SQLite.prepare` (5285); `Store.sql` (5285) | CORE |
| [packages/store/src/store.ts:5247](../../packages/store/src/store.ts#L5247) `Store/accountInactive` | `SQLite.get` (5247); `SQLite.prepare` (5247); `Store.sql` (5247) | CORE |
| [packages/store/src/store.ts:5444](../../packages/store/src/store.ts#L5444) `Store/accountLocalOnly` | `SQLite.get` (5444); `SQLite.prepare` (5444); `Store.sql` (5444) | CORE |
| [packages/store/src/store.ts:6313](../../packages/store/src/store.ts#L6313) `Store/accountPrivilegeSet` | `SQLite.get` (6313); `SQLite.prepare` (6313); `Store.sql` (6313) | CORE |
| [packages/store/src/store.ts:5449](../../packages/store/src/store.ts#L5449) `Store/accountRequires2fa` | `SQLite.get` (5449); `SQLite.prepare` (5449); `Store.sql` (5449) | CORE |
| [packages/store/src/store.ts:5669](../../packages/store/src/store.ts#L5669) `Store/accountUsage` | `SQLite.get` (5669); `SQLite.prepare` (5669, 5670); `Store.sql` (5669, 5670); `SQLite.all` (5670); `Store.auditLog` (5686) | CORE |
| [packages/store/src/store.ts:3669](../../packages/store/src/store.ts#L3669) `Store/accounts` | `SQLite.all` (3669); `SQLite.prepare` (3669); `Store.sql` (3669) | CORE |
| [packages/store/src/store.ts:3665](../../packages/store/src/store.ts#L3665) `Store/accountsSharingLockout` | `SQLite.all` (3665); `SQLite.prepare` (3665); `Store.sql` (3665) | CORE |
| [packages/store/src/store.ts:8500](../../packages/store/src/store.ts#L8500) `Store/addContainer` | `SQLite.all` (8500); `SQLite.prepare` (8500, 8505, 8519, 8523, 8524); `Store.sql` (8500, 8505, 8519, 8521, 8523, 8524, 8526, 8529); `SQLite.get` (8510); `Store.containerRange` (8512) | CORE |
| [packages/store/src/store.ts:8546](../../packages/store/src/store.ts#L8546) `Store/addExternalContainer` | `SQLite.prepare` (8546); `Store.sql` (8546) | CORE |
| [packages/store/src/store.ts:9023](../../packages/store/src/store.ts#L9023) `Store/addFieldIndex` | `Store.sql` (9023) | CORE |
| [packages/store/src/store.ts:7195](../../packages/store/src/store.ts#L7195) `Store/addImage` | `Store.sql` (7195, 7196); `SQLite.prepare` (7196) | CORE |
| [packages/store/src/store.ts:6363](../../packages/store/src/store.ts#L6363) `Store/addProvisionedAccount` | `SQLite.get` (6363); `SQLite.prepare` (6363, 6367); `Store.sql` (6363, 6367) | CORE |
| [packages/store/src/store.ts:7618](../../packages/store/src/store.ts#L7618) `Store/addRelated` | `relatedRows` (7618); `rowsById` (7651); `firstRelatedEach` (7674) | CORE |
| [packages/store/src/store.ts:3687](../../packages/store/src/store.ts#L3687) `Store/agentNeedsApproval` | `SQLite.get` (3687); `SQLite.prepare` (3687); `Store.sql` (3687) | CORE |
| [packages/store/src/store.ts:6590](../../packages/store/src/store.ts#L6590) `Store/allowedIds` | `SQLite.iterate` (6590); `SQLite.prepare` (6590); `Store.sql` (6590) | CORE |
| [packages/store/src/store.ts:5726](../../packages/store/src/store.ts#L5726) `Store/apiToken` | `SQLite.get` (5726); `SQLite.prepare` (5726, 5744); `Store.sql` (5726, 5744) | CORE |
| [packages/store/src/store.ts:5702](../../packages/store/src/store.ts#L5702) `Store/apiTokens` | `SQLite.all` (5702); `SQLite.prepare` (5702); `Store.sql` (5702) | CORE |
| [packages/store/src/store.ts:3128](../../packages/store/src/store.ts#L3128) `Store/appendSecurityRow` | `Store.sql` (3128) | CORE |
| [packages/store/src/store.ts:4038](../../packages/store/src/store.ts#L4038) `Store/appendSecurityEvent` | `Store.sql` (4038) | CORE |
| [packages/store/src/store.ts:5067](../../packages/store/src/store.ts#L5067) `Store/applyAccountImport` | `Store.sql` (5067, 5075, 5104); `SQLite.get` (5075); `SQLite.prepare` (5075, 5104) | CORE |
| [packages/store/src/store.ts:2429](../../packages/store/src/store.ts#L2429) `Store/applyDesign` | `Store.sql` (2429, 2430, 2450, 2453, 2458, 2474, 2477, 2477); `SQLite.prepare` (2453, 2458) | CORE |
| [packages/store/src/store.ts:3883](../../packages/store/src/store.ts#L3883) `Store/approvePending` | `SQLite.get` (3883); `SQLite.prepare` (3883, 3894); `Store.sql` (3883, 3894) | CORE |
| [packages/store/src/store.ts:2919](../../packages/store/src/store.ts#L2919) `Store/audit/write` | `Store.sql` (2919) | CORE |
| [packages/store/src/store.ts:2541](../../packages/store/src/store.ts#L2541) `Store/auditLog` | `SQLite.all` (2541); `SQLite.prepare` (2541); `Store.sql` (2541) | CORE |
| [packages/store/src/store.ts:1964](../../packages/store/src/store.ts#L1964) `Store/backup` | `Store.sql` (1964) | CORE |
| [packages/store/src/store.ts:3693](../../packages/store/src/store.ts#L3693) `Store/blankPasswordAccounts` | `SQLite.all` (3693); `SQLite.prepare` (3693); `Store.sql` (3693) | CORE |
| [packages/store/src/store.ts:9609](../../packages/store/src/store.ts#L9609) `Store/canView` | `Store.canView` (9609); `Store.row` (9610) | GATED-STORE |
| [packages/store/src/store.ts:9591](../../packages/store/src/store.ts#L9591) `Store/canViewRecord` | `SQLite.get` (9591); `SQLite.prepare` (9591); `Store.sql` (9591) | GATED-STORE |
| [packages/store/src/store.ts:4996](../../packages/store/src/store.ts#L4996) `Store/canonicalAccount` | `SQLite.all` (4996); `SQLite.prepare` (4996); `Store.sql` (4996) | CORE |
| [packages/store/src/store.ts:10698](../../packages/store/src/store.ts#L10698) `Store/cascadeDelete` | `relatedRows` (10698) | CORE |
| [packages/store/src/store.ts:2264](../../packages/store/src/store.ts#L2264) `Store/changeOne` | `Store.sql` (2264, 2266) | CORE |
| [packages/store/src/store.ts:2267](../../packages/store/src/store.ts#L2267) `Store/changeOne/read` | `SQLite.get` (2267); `SQLite.prepare` (2267); `Store.sql` (2267) | CORE |
| [packages/store/src/store.ts:8881](../../packages/store/src/store.ts#L8881) `Store/checkContainerWrite` | `Store.row` (8881) | CORE |
| [packages/store/src/store.ts:10321](../../packages/store/src/store.ts#L10321) `Store/checkEditable` | `Store.row` (10321) | CORE |
| [packages/store/src/store.ts:1510](../../packages/store/src/store.ts#L1510) `Store/checkpoint` | `SQLite.get` (1510); `SQLite.prepare` (1510); `Store.sql` (1510) | CORE |
| [packages/store/src/store.ts:6349](../../packages/store/src/store.ts#L6349) `Store/clearAccountPrivilegeSet` | `SQLite.prepare` (6349); `Store.sql` (6349) | CORE |
| [packages/store/src/store.ts:1532](../../packages/store/src/store.ts#L1532) `Store/close` | `Store.sql` (1532) | CORE |
| [packages/store/src/store.ts:8849](../../packages/store/src/store.ts#L8849) `Store/compactFile` | `Store.sql` (8849, 8850, 8852) | CORE |
| [packages/store/src/store.ts:10822](../../packages/store/src/store.ts#L10822) `Store/computeValuesCurrent` | `Store.computeValues` (10822); `Store.sql` (10828, 10832); `SQLite.all` (10832); `SQLite.prepare` (10832) | GATED-STORE |
| [packages/store/src/store.ts:9260](../../packages/store/src/store.ts#L9260) `Store/computedRows` | `Store.sql` (9260, 9263, 9264, 9265, 9267, 9277, 9278, 9279, 9282); `SQLite.prepare` (9263, 9265, 9267, 9277); `SQLite.iterate` (9267); `Calculations.globalValue` (9270); `Calculations.unstoredValue` (9271); `Calculations.related` (9274); `SQLite.all` (9277) | CORE |
| [packages/store/src/store.ts:5771](../../packages/store/src/store.ts#L5771) `Store/confirmTotp` | `SQLite.get` (5771); `SQLite.prepare` (5771, 5773); `Store.sql` (5771, 5773) | CORE |
| [packages/store/src/store.ts:1151](../../packages/store/src/store.ts#L1151) `Store/constructor` | `Store.sql` (1151, 1153, 1155, 1156, 1160, 1164, 1165, 1174, 1182, 1197, 1202, 1207, 1208, 1212, 1213, 1214, 1221, 1225, 1229, 1230, 1231, 1236, 1237, 1241, 1244, 1245, 1247, 1249, 1252, 1253, 1257, 1258, 1262, 1263, 1266, 1268, 1271, 1272, 1276, 1277, 1281, 1282, 1286, 1287, 1288, 1291, 1292, 1295, 1296, 1298, 1298, 1299, 1299, 1300, 1304, 1306, 1310, 1312, 1315, 1316, 1317, 1320, 1321, 1323, 1325, 1326, 1330, 1331, 1333, 1345, 1347, 1348, 1349, 1349, 1353, 1354); `SQLite.get` (1155, 1174); `SQLite.prepare` (1155, 1174, 1182, 1244, 1245, 1249, 1252, 1257, 1262, 1271, 1276, 1281, 1291, 1295, 1298, 1299, 1320, 1325, 1330); `SQLite.all` (1244, 1252, 1257, 1262, 1271, 1276, 1281, 1291, 1295, 1298, 1299, 1320, 1325, 1330) | CORE |
| [packages/store/src/store.ts:6129](../../packages/store/src/store.ts#L6129) `Store/consumeRecoveryCode` | `SQLite.prepare` (6129); `Store.sql` (6129) | CORE |
| [packages/store/src/store.ts:8424](../../packages/store/src/store.ts#L8424) `Store/container` | `SQLite.get` (8424); `SQLite.prepare` (8424, 8433); `Store.sql` (8424, 8433); `SQLite.all` (8433) | CORE |
| [packages/store/src/store.ts:8858](../../packages/store/src/store.ts#L8858) `Store/containerId` | `Store.containerId` (8858); `Store.row` (8859) | CORE |
| [packages/store/src/store.ts:8441](../../packages/store/src/store.ts#L8441) `Store/containerInfo` | `SQLite.get` (8441); `SQLite.prepare` (8441); `Store.sql` (8441) | CORE |
| [packages/store/src/store.ts:8405](../../packages/store/src/store.ts#L8405) `Store/containerIntact` | `SQLite.get` (8405); `SQLite.prepare` (8405); `Store.sql` (8405) | CORE |
| [packages/store/src/store.ts:8344](../../packages/store/src/store.ts#L8344) `Store/containerIntegrityReport` | `SQLite.all` (8344); `SQLite.prepare` (8344, 8355); `Store.sql` (8344, 8355); `SQLite.get` (8355) | CORE |
| [packages/store/src/store.ts:8419](../../packages/store/src/store.ts#L8419) `Store/containerMeta` | `SQLite.get` (8419); `SQLite.prepare` (8419); `Store.sql` (8419) | CORE |
| [packages/store/src/store.ts:8475](../../packages/store/src/store.ts#L8475) `Store/containerRange` | `SQLite.all` (8475); `SQLite.prepare` (8475, 8482); `Store.sql` (8475, 8482); `SQLite.get` (8482) | CORE |
| [packages/store/src/store.ts:8246](../../packages/store/src/store.ts#L8246) `Store/containerReferences` | `SQLite.all` (8246, 8265, 8267, 8273, 8286, 8297, 8311); `SQLite.prepare` (8246, 8265, 8267, 8273, 8286, 8297, 8309, 8311); `Store.sql` (8246, 8265, 8267, 8273, 8286, 8297, 8309, 8311); `SQLite.get` (8309); `Store.row` (8320) | CORE |
| [packages/store/src/store.ts:10802](../../packages/store/src/store.ts#L10802) `Store/countIds` | `Store.countIds` (10802); `SQLite.get` (10806); `SQLite.prepare` (10806); `Store.sql` (10806) | GATED-STORE |
| [packages/store/src/store.ts:9640](../../packages/store/src/store.ts#L9640) `Store/create` | `SQLite.get` (9640); `SQLite.prepare` (9640, 9653); `Store.sql` (9640, 9653) | CORE |
| [packages/store/src/store.ts:5502](../../packages/store/src/store.ts#L5502) `Store/createApiToken` | `SQLite.get` (5502, 5530); `SQLite.prepare` (5502, 5529, 5530, 5540); `Store.sql` (5502, 5529, 5530, 5540) | CORE |
| [packages/store/src/store.ts:5008](../../packages/store/src/store.ts#L5008) `Store/createLocalAccount` | `SQLite.prepare` (5008); `Store.sql` (5008) | CORE |
| [packages/store/src/store.ts:3659](../../packages/store/src/store.ts#L3659) `Store/credentialIdentity` | `SQLite.get` (3659); `SQLite.prepare` (3659); `Store.sql` (3659) | CORE |
| [packages/store/src/store.ts:5423](../../packages/store/src/store.ts#L5423) `Store/credentialStamp` | `SQLite.get` (5423); `SQLite.prepare` (5423); `Store.sql` (5423) | CORE |
| [packages/store/src/store.ts:2054](../../packages/store/src/store.ts#L2054) `Store/dataVersion` | `SQLite.get` (2054); `SQLite.prepare` (2054); `Store.sql` (2054) | CORE |
| [packages/store/src/store.ts:11360](../../packages/store/src/store.ts#L11360) `Store/decimalViewSql` | `SQLite.all` (11360); `SQLite.prepare` (11360) | CORE |
| [packages/store/src/store.ts:10364](../../packages/store/src/store.ts#L10364) `Store/delete` | `Store.row` (10364) | CORE |
| [packages/store/src/store.ts:10372](../../packages/store/src/store.ts#L10372) `Store/delete/run` | `SQLite.get` (10372); `SQLite.prepare` (10372, 10377); `Store.sql` (10372, 10377) | CORE |
| [packages/store/src/store.ts:5162](../../packages/store/src/store.ts#L5162) `Store/deleteAccount` | `SQLite.prepare` (5162, 5166, 5167, 5168, 5169, 5170, 5171, 5172, 5173, 5180, 5182, 5184, 5186, 5190); `Store.sql` (5162, 5166, 5167, 5168, 5169, 5170, 5171, 5172, 5173, 5180, 5182, 5184, 5186, 5190) | CORE |
| [packages/store/src/store.ts:10445](../../packages/store/src/store.ts#L10445) `Store/deleteBeingUndone` | `SQLite.all` (10445); `SQLite.prepare` (10445); `Store.sql` (10445) | CORE |
| [packages/store/src/store.ts:10457](../../packages/store/src/store.ts#L10457) `Store/deleteEndingTheLifeAt` | `SQLite.get` (10457); `SQLite.prepare` (10457); `Store.sql` (10457) | CORE |
| [packages/store/src/store.ts:6214](../../packages/store/src/store.ts#L6214) `Store/deletePrivilegeSet` | `SQLite.prepare` (6214); `Store.sql` (6214) | CORE |
| [packages/store/src/store.ts:4148](../../packages/store/src/store.ts#L4148) `Store/deleteScriptTest` | `SQLite.prepare` (4148); `Store.sql` (4148) | CORE |
| [packages/store/src/store.ts:3296](../../packages/store/src/store.ts#L3296) `Store/deletedRows` | `SQLite.get` (3296); `SQLite.prepare` (3296, 3298, 3298); `Store.sql` (3296, 3298, 3298); `SQLite.all` (3298, 3298) | CORE |
| [packages/store/src/store.ts:3406](../../packages/store/src/store.ts#L3406) `Store/designEffect` | `Store.sql` (3406, 3412, 3413, 3416, 3422, 3427, 3430, 3436, 3447, 3448, 3450, 3451, 3464, 3465, 3468, 3470, 3476, 3477, 3478, 3484, 3486, 3490, 3493, 3494, 3496, 3499, 3505, 3507, 3514, 3515, 3517, 3518, 3519, 3520, 3527, 3528, 3530, 3530, 3532, 3533, 3534, 3538, 3542, 3544, 3582, 3584, 3586); `SQLite.prepare` (3416, 3447, 3448, 3464, 3465, 3476, 3477, 3484, 3486, 3490, 3494, 3505, 3507, 3520, 3527, 3528, 3530, 3532, 3534, 3538, 3542); `SQLite.get` (3447, 3464, 3476, 3477, 3490, 3494, 3530, 3538); `SQLite.all` (3527, 3528); `SQLite.iterate` (3532) | CORE |
| [packages/store/src/store.ts:3399](../../packages/store/src/store.ts#L3399) `Store/designEffect/renameExcluded` | `SQLite.prepare` (3399); `Store.sql` (3399) | CORE |
| [packages/store/src/store.ts:3383](../../packages/store/src/store.ts#L3383) `Store/designEffect/renameKey` | `SQLite.prepare` (3383); `Store.sql` (3383) | CORE |
| [packages/store/src/store.ts:3337](../../packages/store/src/store.ts#L3337) `Store/designHistory` | `SQLite.all` (3337); `SQLite.prepare` (3337); `Store.sql` (3337) | CORE |
| [packages/store/src/store.ts:5792](../../packages/store/src/store.ts#L5792) `Store/disableTotp` | `SQLite.prepare` (5792); `Store.sql` (5792) | CORE |
| [packages/store/src/store.ts:3594](../../packages/store/src/store.ts#L3594) `Store/dropColumnIndexes` | `SQLite.all` (3594, 3596); `SQLite.prepare` (3594, 3596); `Store.sql` (3594, 3596, 3597) | CORE |
| [packages/store/src/store.ts:9035](../../packages/store/src/store.ts#L9035) `Store/dropFieldIndex` | `SQLite.get` (9035); `SQLite.prepare` (9035); `Store.sql` (9035, 9036) | CORE |
| [packages/store/src/store.ts:9677](../../packages/store/src/store.ts#L9677) `Store/duplicate` | `Store.row` (9677); `SQLite.prepare` (9695); `Store.sql` (9695) | CORE |
| [packages/store/src/store.ts:8662](../../packages/store/src/store.ts#L8662) `Store/embeddedContainerCount` | `SQLite.prepare` (8662); `Store.sql` (8662); `SQLite.get` (8663) | CORE |
| [packages/store/src/store.ts:8648](../../packages/store/src/store.ts#L8648) `Store/embeddedContainers` | `SQLite.prepare` (8648, 8649); `Store.sql` (8648, 8649); `SQLite.all` (8649); `SQLite.get` (8653) | CORE |
| [packages/store/src/store.ts:3322](../../packages/store/src/store.ts#L3322) `Store/emptyDeleted` | `Store.sql` (3322, 3325, 3326, 3328, 3330); `SQLite.prepare` (3326) | CORE |
| [packages/store/src/store.ts:1930](../../packages/store/src/store.ts#L1930) `Store/endTransaction` | `Store.sql` (1930, 1933, 1933) | CORE |
| [packages/store/src/store.ts:5760](../../packages/store/src/store.ts#L5760) `Store/enrollTotp` | `SQLite.prepare` (5760); `Store.sql` (5760) | CORE |
| [packages/store/src/store.ts:3291](../../packages/store/src/store.ts#L3291) `Store/ensureDeleted` | `Store.sql` (3291) | CORE |
| [packages/store/src/store.ts:1364](../../packages/store/src/store.ts#L1364) `Store/ensureNativeIds` | `SQLite.all` (1364, 1376); `SQLite.prepare` (1364, 1367, 1375, 1376); `Store.sql` (1364, 1367, 1370, 1374, 1375, 1376, 1379, 1381) | CORE |
| [packages/store/src/store.ts:2176](../../packages/store/src/store.ts#L2176) `Store/ensureRecordIdHighWater` | `Store.sql` (2176, 2177, 2179, 2181, 2183) | CORE |
| [packages/store/src/store.ts:2195](../../packages/store/src/store.ts#L2195) `Store/ensureRecordIdMarks` | `SQLite.all` (2195, 2198, 2201, 2210); `SQLite.prepare` (2195, 2198, 2201, 2204, 2210, 2213); `Store.sql` (2195, 2198, 2201, 2204, 2210, 2213, 2217, 2218) | CORE |
| [packages/store/src/store.ts:10018](../../packages/store/src/store.ts#L10018) `Store/evaluateCurrent` | `Store.row` (10018, 10018, 10019, 10019); `Calculations.context` (10024); `Store.get` (10025, 10027) | GATED-STORE |
| [packages/store/src/store.ts:10059](../../packages/store/src/store.ts#L10059) `Store/evaluateEachCurrent` | `Store.row` (10059, 10059, 10064); `Calculations.context` (10065); `Store.get` (10067) | GATED-STORE |
| [packages/store/src/store.ts:10121](../../packages/store/src/store.ts#L10121) `Store/evaluateRowsCurrent` | `Store.row` (10121, 10121, 10122, 10122) | GATED-STORE |
| [packages/store/src/store.ts:10100](../../packages/store/src/store.ts#L10100) `Store/evaluateRowsCurrent/each` | `Calculations.context` (10100); `Store.get` (10102) | GATED-STORE |
| [packages/store/src/store.ts:10136](../../packages/store/src/store.ts#L10136) `Store/evaluateRowsCurrent/found/[Symbol.iterator]` | `rowsById` (10136) | GATED-STORE |
| [packages/store/src/store.ts:10158](../../packages/store/src/store.ts#L10158) `Store/evaluateRowsCurrent/key` | `Calculations.context` (10158) | GATED-STORE |
| [packages/store/src/store.ts:3926](../../packages/store/src/store.ts#L3926) `Store/externalAccount` | `SQLite.all` (3926); `SQLite.prepare` (3926); `Store.sql` (3926) | CORE |
| [packages/store/src/store.ts:8167](../../packages/store/src/store.ts#L8167) `Store/externalContainerCheck` | `SQLite.all` (8167); `SQLite.prepare` (8167); `Store.sql` (8167) | CORE |
| [packages/store/src/store.ts:8174](../../packages/store/src/store.ts#L8174) `Store/externalContainerCount` | `SQLite.get` (8174); `SQLite.prepare` (8174); `Store.sql` (8174) | CORE |
| [packages/store/src/store.ts:8183](../../packages/store/src/store.ts#L8183) `Store/externalContainerReport` | `SQLite.all` (8183, 8196); `SQLite.prepare` (8183, 8196); `Store.sql` (8183, 8196) | CORE |
| [packages/store/src/store.ts:5273](../../packages/store/src/store.ts#L5273) `Store/externalIdentityId` | `SQLite.get` (5273, 5280); `SQLite.prepare` (5273, 5279, 5280); `Store.sql` (5273, 5279, 5280) | CORE |
| [packages/store/src/store.ts:8415](../../packages/store/src/store.ts#L8415) `Store/externalOf` | `SQLite.get` (8415); `SQLite.prepare` (8415); `Store.sql` (8415) | CORE |
| [packages/store/src/store.ts:3072](../../packages/store/src/store.ts#L3072) `Store/failureAuditRoom` | `SQLite.get` (3072); `SQLite.prepare` (3072); `Store.sql` (3072) | CORE |
| [packages/store/src/store.ts:7820](../../packages/store/src/store.ts#L7820) `Store/fieldIndexCurrent` | `SQLite.iterate` (7820); `SQLite.prepare` (7820, 7825); `Store.sql` (7820, 7825); `SQLite.all` (7825) | GATED-STORE |
| [packages/store/src/store.ts:9075](../../packages/store/src/store.ts#L9075) `Store/find` | `Store.find` (9075) | GATED-STORE |
| [packages/store/src/store.ts:9447](../../packages/store/src/store.ts#L9447) `Store/findCandidates` | `Store.query` (9447) | CORE |
| [packages/store/src/store.ts:9086](../../packages/store/src/store.ts#L9086) `Store/findHere` | `Store.query` (9086, 9091, 9093, 9107, 9109, 9120); `Store.recordCount` (9104); `SQLite.get` (9105, 9109); `SQLite.prepare` (9105, 9109, 9115, 9122, 9131); `Store.sql` (9105, 9109, 9115, 9122, 9131); `SQLite.all` (9115, 9122, 9131) | GATED-STORE |
| [packages/store/src/store.ts:9126](../../packages/store/src/store.ts#L9126) `Store/findHere/[Symbol.iterator]` | `SQLite.iterate` (9126); `SQLite.prepare` (9126); `Store.sql` (9126) | GATED-STORE |
| [packages/store/src/store.ts:10933](../../packages/store/src/store.ts#L10933) `Store/findIdsCurrent` | `Store.findIds` (10933) | GATED-STORE |
| [packages/store/src/store.ts:10869](../../packages/store/src/store.ts#L10869) `Store/findIdsCurrentProgress` | `Store.findIdsProgress` (10869); `Store.query` (10871, 10872, 10885, 10887); `Store.recordCount` (10877, 10905); `SQLite.iterate` (10902); `SQLite.prepare` (10902, 10910, 10911); `Store.sql` (10902, 10910, 10911); `SQLite.get` (10914); `SQLite.all` (10920) | GATED-STORE |
| [packages/store/src/store.ts:10939](../../packages/store/src/store.ts#L10939) `Store/findIdsHere` | `Store.query` (10939, 10944, 10946); `SQLite.iterate` (10957); `SQLite.prepare` (10957); `Store.sql` (10957) | GATED-STORE |
| [packages/store/src/store.ts:9391](../../packages/store/src/store.ts#L9391) `Store/findSource` | `Store.query` (9391); `SQLite.all` (9400, 9417); `SQLite.prepare` (9400, 9408, 9416); `Store.sql` (9400, 9405, 9408, 9413, 9416, 9430, 9432); `Calculations.globalValue` (9422); `Calculations.unstoredValue` (9423); `Calculations.related` (9427) | CORE |
| [packages/store/src/store.ts:3184](../../packages/store/src/store.ts#L3184) `Store/flushDeferredSecurity` | `Store.sql` (3184) | CORE |
| [packages/store/src/store.ts:10412](../../packages/store/src/store.ts#L10412) `Store/forgetStandInValues` | `Store.sql` (10412, 10433); `SQLite.prepare` (10433) | CORE |
| [packages/store/src/store.ts:5129](../../packages/store/src/store.ts#L5129) `Store/forgetStandIns` | `SQLite.prepare` (5129); `Store.sql` (5129) | CORE |
| [packages/store/src/store.ts:7702](../../packages/store/src/store.ts#L7702) `Store/foundSetPage` | `rowsById` (7702) | CORE |
| [packages/store/src/store.ts:7718](../../packages/store/src/store.ts#L7718) `Store/foundSetRowsCurrent` | `Store.viewableIds` (7718); `Store.row` (7734) | GATED-STORE |
| [packages/store/src/store.ts:3845](../../packages/store/src/store.ts#L3845) `Store/gateAgentWrite` | `SQLite.get` (3845); `SQLite.prepare` (3845, 3847); `Store.sql` (3845, 3847) | CORE |
| [packages/store/src/store.ts:6067](../../packages/store/src/store.ts#L6067) `Store/generateRecoveryCodes` | `SQLite.prepare` (6067, 6070); `Store.sql` (6067, 6070) | CORE |
| [packages/store/src/store.ts:9519](../../packages/store/src/store.ts#L9519) `Store/getCurrent` | `Store.get` (9519); `Store.row` (9520, 9520, 9534); `SQLite.all` (9537); `SQLite.prepare` (9537); `Store.sql` (9537) | GATED-STORE |
| [packages/store/src/store.ts:9557](../../packages/store/src/store.ts#L9557) `Store/getManyCurrent` | `Store.getMany` (9557); `SQLite.get` (9575); `SQLite.prepare` (9575); `Store.sql` (9575) | GATED-STORE |
| [packages/store/src/store.ts:9568](../../packages/store/src/store.ts#L9568) `Store/getManyCurrent/[Symbol.iterator]` | `rowsById` (9568) | GATED-STORE |
| [packages/store/src/store.ts:1411](../../packages/store/src/store.ts#L1411) `Store/grantFullAccessClients` | `SQLite.prepare` (1411); `Store.sql` (1411) | CORE |
| [packages/store/src/store.ts:10974](../../packages/store/src/store.ts#L10974) `Store/groupSummariesCurrent` | `Store.groupSummaries` (10974); `Store.viewableIds` (10979); `Calculations.collect` (10995); `rowsById` (10995, 11045); `Calculations.collector` (11017) | GATED-STORE |
| [packages/store/src/store.ts:11043](../../packages/store/src/store.ts#L11043) `Store/groupSummariesCurrent/flush` | `Calculations.collector` (11043) | GATED-STORE |
| [packages/store/src/store.ts:11007](../../packages/store/src/store.ts#L11007) `Store/groupSummariesCurrent/key` | `Calculations.value` (11007); `Calculations.related` (11009) | GATED-STORE |
| [packages/store/src/store.ts:1438](../../packages/store/src/store.ts#L1438) `Store/hasOwnPassword` | `SQLite.get` (1438); `SQLite.prepare` (1438); `Store.sql` (1438) | CORE |
| [packages/store/src/store.ts:5922](../../packages/store/src/store.ts#L5922) `Store/hasPasskey` | `SQLite.get` (5922); `SQLite.prepare` (5922); `Store.sql` (5922) | CORE |
| [packages/store/src/store.ts:1419](../../packages/store/src/store.ts#L1419) `Store/hasProvingPassword` | `SQLite.get` (1419); `SQLite.prepare` (1419); `Store.sql` (1419) | CORE |
| [packages/store/src/store.ts:8989](../../packages/store/src/store.ts#L8989) `Store/hasTable` | `SQLite.get` (8989); `SQLite.prepare` (8989); `Store.sql` (8989) | CORE |
| [packages/store/src/store.ts:5781](../../packages/store/src/store.ts#L5781) `Store/hasTotp` | `SQLite.get` (5781); `SQLite.prepare` (5781); `Store.sql` (5781) | CORE |
| [packages/store/src/store.ts:5252](../../packages/store/src/store.ts#L5252) `Store/identityAllowed` | `SQLite.get` (5252, 5258, 5264); `SQLite.prepare` (5252, 5258, 5264); `Store.sql` (5252, 5258, 5264) | CORE |
| [packages/store/src/store.ts:7172](../../packages/store/src/store.ts#L7172) `Store/image` | `SQLite.get` (7172); `SQLite.prepare` (7172); `Store.sql` (7172) | CORE |
| [packages/store/src/store.ts:7182](../../packages/store/src/store.ts#L7182) `Store/images` | `SQLite.all` (7182); `SQLite.prepare` (7182); `Store.sql` (7182) | CORE |
| [packages/store/src/store.ts:4973](../../packages/store/src/store.ts#L4973) `Store/importAccounts` | `SQLite.all` (4973); `SQLite.prepare` (4973); `Store.sql` (4973) | CORE |
| [packages/store/src/store.ts:1752](../../packages/store/src/store.ts#L1752) `Store/independentWindowWrite` | `SQLite.get` (1752); `SQLite.prepare` (1752, 1760, 1820); `Store.sql` (1752, 1760, 1770, 1798, 1815, 1820, 1823); `SQLite.all` (1760); `Store.row` (1818) | CORE |
| [packages/store/src/store.ts:2231](../../packages/store/src/store.ts#L2231) `Store/nextRecordId` | `SQLite.get` (2231); `SQLite.prepare` (2231); `Store.sql` (2231) | CORE |
| [packages/store/src/store.ts:1597](../../packages/store/src/store.ts#L1597) `Store/securityChainHeadAudit` | `SQLite.get` (1597); `SQLite.prepare` (1597); `Store.sql` (1597) | CORE |
| [packages/store/src/store.ts:9001](../../packages/store/src/store.ts#L9001) `Store/indexedFields` | `SQLite.all` (9001, 9002); `SQLite.prepare` (9001, 9002); `Store.sql` (9001, 9002) | CORE |
| [packages/store/src/store.ts:11393](../../packages/store/src/store.ts#L11393) `Store/internalRoots` | `SQLite.get` (11393); `SQLite.prepare` (11393, 11395); `SQLite.all` (11395) | CORE |
| [packages/store/src/store.ts:3681](../../packages/store/src/store.ts#L3681) `Store/isAgent` | `SQLite.get` (3681); `SQLite.prepare` (3681); `Store.sql` (3681) | CORE |
| [packages/store/src/store.ts:3784](../../packages/store/src/store.ts#L3784) `Store/isExternal` | `SQLite.get` (3784); `SQLite.prepare` (3784); `Store.sql` (3784) | CORE |
| [packages/store/src/store.ts:5836](../../packages/store/src/store.ts#L5836) `Store/issueWebauthnChallenge` | `SQLite.prepare` (5836, 5838, 5839, 5841); `Store.sql` (5836, 5838, 5839, 5841); `SQLite.get` (5838) | CORE |
| [packages/store/src/store.ts:11255](../../packages/store/src/store.ts#L11255) `Store/iterateCommitted` | `SQLite.iterate` (11255) | CORE |
| [packages/store/src/store.ts:1692](../../packages/store/src/store.ts#L1692) `Store/joinTransaction` | `Store.sql` (1692, 1693, 1695, 1697, 1703, 1706) | CORE |
| [packages/store/src/store.ts:10645](../../packages/store/src/store.ts#L10645) `Store/keyStepWork` | `Store.sql` (10645, 10651, 10655, 10657) | CORE |
| [packages/store/src/store.ts:6988](../../packages/store/src/store.ts#L6988) `Store/knownSharedAccount` | `SQLite.get` (6988); `SQLite.prepare` (6988); `Store.sql` (6988) | CORE |
| [packages/store/src/store.ts:4446](../../packages/store/src/store.ts#L4446) `Store/lastSignIns` | `Store.auditLog` (4446) | CORE |
| [packages/store/src/store.ts:10463](../../packages/store/src/store.ts#L10463) `Store/latestDeleteSeq` | `SQLite.get` (10463); `SQLite.prepare` (10463); `Store.sql` (10463) | CORE |
| [packages/store/src/store.ts:7212](../../packages/store/src/store.ts#L7212) `Store/layout` | `SQLite.get` (7212); `SQLite.prepare` (7212); `Store.sql` (7212) | CORE |
| [packages/store/src/store.ts:3354](../../packages/store/src/store.ts#L3354) `Store/layoutHistory` | `SQLite.all` (3354); `SQLite.prepare` (3354); `Store.sql` (3354) | CORE |
| [packages/store/src/store.ts:7102](../../packages/store/src/store.ts#L7102) `Store/layouts` | `SQLite.all` (7102); `SQLite.prepare` (7102); `Store.sql` (7102) | CORE |
| [packages/store/src/store.ts:4746](../../packages/store/src/store.ts#L4746) `Store/leastPrivilege` | `SQLite.all` (4746); `SQLite.prepare` (4746); `Store.sql` (4746) | CORE |
| [packages/store/src/store.ts:5350](../../packages/store/src/store.ts#L5350) `Store/ledgerRow` | `SQLite.get` (5350, 5351); `SQLite.prepare` (5350, 5351); `Store.sql` (5350, 5351) | AUTH |
| [packages/store/src/store.ts:5362](../../packages/store/src/store.ts#L5362) `Store/ledgerWrite` | `Store.sql` (5362, 5363, 5365, 5367, 5370, 5370) | AUTH |
| [packages/store/src/store.ts:5056](../../packages/store/src/store.ts#L5056) `Store/limitAccountImport` | `SQLite.prepare` (5056, 5057, 5060); `Store.sql` (5056, 5057, 5060); `SQLite.get` (5057) | CORE |
| [packages/store/src/store.ts:3634](../../packages/store/src/store.ts#L3634) `Store/linkIdentity` | `SQLite.get` (3634); `SQLite.prepare` (3634); `Store.sql` (3634) | CORE |
| [packages/store/src/store.ts:3626](../../packages/store/src/store.ts#L3626) `Store/linkPrincipal` | `SQLite.get` (3626); `SQLite.prepare` (3626); `Store.sql` (3626) | CORE |
| [packages/store/src/store.ts:4332](../../packages/store/src/store.ts#L4332) `Store/markPiiField` | `SQLite.prepare` (4332); `Store.sql` (4332) | CORE |
| [packages/store/src/store.ts:8140](../../packages/store/src/store.ts#L8140) `Store/markRepeating` | `SQLite.prepare` (8140); `Store.sql` (8140) | CORE |
| [packages/store/src/store.ts:11188](../../packages/store/src/store.ts#L11188) `Store/matchIds` | `Store.matchIds` (11188); `SQLite.all` (11194); `SQLite.prepare` (11194); `Store.sql` (11194) | CORE |
| [packages/store/src/store.ts:1453](../../packages/store/src/store.ts#L1453) `Store/meta` | `SQLite.get` (1453); `SQLite.prepare` (1453); `Store.sql` (1453) | CORE |
| [packages/store/src/store.ts:1006](../../packages/store/src/store.ts#L1006) `Store/metadataVersions` | `SQLite.get` (1006); `SQLite.prepare` (1006); `Store.sql` (1006) | CORE |
| [packages/store/src/store.ts:8777](../../packages/store/src/store.ts#L8777) `Store/moveContainersIn` | `Store.sql` (8777, 8783, 8785, 8786, 8787, 8788, 8808, 8813, 8813, 8824, 8827, 8830, 8837); `SQLite.prepare` (8785, 8786, 8787, 8788, 8824, 8830); `SQLite.get` (8790, 8824, 8830) | CORE |
| [packages/store/src/store.ts:8699](../../packages/store/src/store.ts#L8699) `Store/moveContainersOut` | `Store.sql` (8699, 8707, 8709, 8711, 8716, 8717, 8737, 8743, 8745, 8747, 8747, 8753, 8753, 8758, 8760, 8762, 8762, 8768); `SQLite.get` (8707); `SQLite.prepare` (8707, 8716, 8717); `Store.container` (8719) | CORE |
| [packages/store/src/store.ts:4927](../../packages/store/src/store.ts#L4927) `Store/mustChangePassword` | `SQLite.get` (4927); `SQLite.prepare` (4927); `Store.sql` (4927) | CORE |
| [packages/store/src/store.ts:1389](../../packages/store/src/store.ts#L1389) `Store/nativeIdGuards` | `Store.sql` (1389, 1390, 1392) | CORE |
| [packages/store/src/store.ts:5656](../../packages/store/src/store.ts#L5656) `Store/objectUseSince` | `SQLite.get` (5656); `SQLite.prepare` (5656); `Store.sql` (5656) | CORE |
| [packages/store/src/store.ts:8961](../../packages/store/src/store.ts#L8961) `Store/orderBy` | `Store.valueListItems` (8961) | CORE |
| [packages/store/src/store.ts:8332](../../packages/store/src/store.ts#L8332) `Store/orphanContainerReport` | `SQLite.all` (8332); `SQLite.prepare` (8332); `Store.sql` (8332) | CORE |
| [packages/store/src/store.ts:5888](../../packages/store/src/store.ts#L5888) `Store/passkeyAllowList` | `SQLite.all` (5888); `SQLite.prepare` (5888); `Store.sql` (5888) | CORE |
| [packages/store/src/store.ts:5927](../../packages/store/src/store.ts#L5927) `Store/passkeyIds` | `SQLite.all` (5927); `SQLite.prepare` (5927); `Store.sql` (5927) | CORE |
| [packages/store/src/store.ts:5915](../../packages/store/src/store.ts#L5915) `Store/passkeys` | `SQLite.all` (5915); `SQLite.prepare` (5915); `Store.sql` (5915) | CORE |
| [packages/store/src/store.ts:4966](../../packages/store/src/store.ts#L4966) `Store/passwordDaysRemaining` | `SQLite.get` (4966); `SQLite.prepare` (4966); `Store.sql` (4966) | CORE |
| [packages/store/src/store.ts:3869](../../packages/store/src/store.ts#L3869) `Store/pendingChanges` | `SQLite.all` (3869); `SQLite.prepare` (3869); `Store.sql` (3869) | CORE |
| [packages/store/src/store.ts:1471](../../packages/store/src/store.ts#L1471) `Store/persistentData` | `SQLite.get` (1471) | CORE |
| [packages/store/src/store.ts:1480](../../packages/store/src/store.ts#L1480) `Store/persistentDataIds` | `SQLite.all` (1480) | CORE |
| [packages/store/src/store.ts:1461](../../packages/store/src/store.ts#L1461) `Store/persistentTable` | `Store.sql` (1461) | CORE |
| [packages/store/src/store.ts:10306](../../packages/store/src/store.ts#L10306) `Store/portalContainerTarget` | `Store.row` (10306); `relatedIdList` (10308) | CORE |
| [packages/store/src/store.ts:7757](../../packages/store/src/store.ts#L7757) `Store/portalCountsCurrent` | `Store.canView` (7757); `Store.row` (7784) | GATED-STORE |
| [packages/store/src/store.ts:7995](../../packages/store/src/store.ts#L7995) `Store/portalRows` | `relatedRows` (7995); `relatedIdList` (7996); `Store.viewableSet` (7999); `rowsById` (8024, 8062); `Calculations.related` (8038) | CORE |
| [packages/store/src/store.ts:8006](../../packages/store/src/store.ts#L8006) `Store/portalRows/context` | `Calculations.context` (8006) | CORE |
| [packages/store/src/store.ts:8016](../../packages/store/src/store.ts#L8016) `Store/portalRows/valueOf` | `Calculations.value` (8016) | CORE |
| [packages/store/src/store.ts:2607](../../packages/store/src/store.ts#L2607) `Store/prepared` | `SQLite.prepare` (2607); `Store.sql` (2607) | CORE |
| [packages/store/src/store.ts:5038](../../packages/store/src/store.ts#L5038) `Store/previewAccountImport` | `Store.sql` (5038, 5039, 5048) | CORE |
| [packages/store/src/store.ts:6744](../../packages/store/src/store.ts#L6744) `Store/previewRecordRuleCurrent` | `SQLite.get` (6744); `SQLite.prepare` (6744, 6747); `Store.sql` (6744, 6747); `SQLite.all` (6747); `Calculations.context` (6753, 6769) | CORE |
| [packages/store/src/store.ts:9482](../../packages/store/src/store.ts#L9482) `Store/previewRow` | `Store.row` (9482) | CORE |
| [packages/store/src/store.ts:6142](../../packages/store/src/store.ts#L6142) `Store/privilegeSets` | `Store.sql` (6142) | CORE |
| [packages/store/src/store.ts:2839](../../packages/store/src/store.ts#L2839) `Store/pruneAudit` | `Store.sql` (2839, 2841, 2843); `SQLite.get` (2841); `SQLite.prepare` (2841) | CORE |
| [packages/store/src/store.ts:8367](../../packages/store/src/store.ts#L8367) `Store/purgeOrphanContainers` | `Store.sql` (8367, 8371, 8380, 8383, 8384, 8389, 8390, 8392, 8392); `Store.orphanContainerReport` (8375); `SQLite.get` (8380); `SQLite.prepare` (8380, 8383, 8384) | CORE |
| [packages/store/src/store.ts:11513](../../packages/store/src/store.ts#L11513) `Store/query` | `SQLite.iterate` (11513) | CORE |
| [packages/store/src/store.ts:11553](../../packages/store/src/store.ts#L11553) `Store/queryWithOriginsCurrent` | `SQLite.iterate` (11553); `SQLite.all` (11562, 11565); `SQLite.prepare` (11562, 11565) | CORE |
| [packages/store/src/store.ts:11305](../../packages/store/src/store.ts#L11305) `Store/readOnlyChecked` | `SQLite.prepare` (11305, 11309, 11318, 11323); `SQLite.all` (11309, 11318, 11323) | CORE |
| [packages/store/src/store.ts:3606](../../packages/store/src/store.ts#L3606) `Store/recompute` | `SQLite.prepare` (3606, 3610); `Store.sql` (3606, 3610); `SQLite.iterate` (3610); `Calculations.computeStoredStyled` (3611); `Calculations.value` (3611) | CORE |
| [packages/store/src/store.ts:2622](../../packages/store/src/store.ts#L2622) `Store/recordAsOf` | `SQLite.get` (2622, 2624); `SQLite.prepare` (2622, 2624, 2626, 2627); `Store.sql` (2622, 2624, 2626, 2627); `SQLite.all` (2626, 2627) | CORE |
| [packages/store/src/store.ts:2318](../../packages/store/src/store.ts#L2318) `Store/recordCount` | `SQLite.get` (2318); `SQLite.prepare` (2318); `Store.sql` (2318) | CORE |
| [packages/store/src/store.ts:2699](../../packages/store/src/store.ts#L2699) `Store/recordLife` | `SQLite.all` (2699); `SQLite.prepare` (2699); `Store.sql` (2699) | CORE |
| [packages/store/src/store.ts:5587](../../packages/store/src/store.ts#L5587) `Store/recordObjectUse` | `Store.sql` (5587) | CORE |
| [packages/store/src/store.ts:10008](../../packages/store/src/store.ts#L10008) `Store/recordViewable` | `Store.row` (10008) | GATED-STORE |
| [packages/store/src/store.ts:1518](../../packages/store/src/store.ts#L1518) `Store/recordedFormat` | `Store.sql` (1518) | CORE |
| [packages/store/src/store.ts:8671](../../packages/store/src/store.ts#L8671) `Store/recoverContainersOut` | `SQLite.prepare` (8671); `Store.sql` (8671); `SQLite.get` (8674) | CORE |
| [packages/store/src/store.ts:1621](../../packages/store/src/store.ts#L1621) `Store/recoverPendingExternalFiles` | `Store.sql` (1621, 1623, 1647, 1649); `SQLite.prepare` (1623); `SQLite.get` (1634) | CORE |
| [packages/store/src/store.ts:6085](../../packages/store/src/store.ts#L6085) `Store/recoveryCodesRemaining` | `SQLite.get` (6085); `SQLite.prepare` (6085); `Store.sql` (6085) | CORE |
| [packages/store/src/store.ts:11345](../../packages/store/src/store.ts#L11345) `Store/refreshDecimalSqlViews` | `SQLite.get` (11345); `SQLite.prepare` (11345) | CORE |
| [packages/store/src/store.ts:3775](../../packages/store/src/store.ts#L3775) `Store/refuseLookalikeAccount` | `SQLite.all` (3775); `SQLite.prepare` (3775); `Store.sql` (3775) | CORE |
| [packages/store/src/store.ts:5951](../../packages/store/src/store.ts#L5951) `Store/registerPasskey` | `SQLite.prepare` (5951); `Store.sql` (5951) | CORE |
| [packages/store/src/store.ts:3904](../../packages/store/src/store.ts#L3904) `Store/rejectPending` | `SQLite.get` (3904); `SQLite.prepare` (3904, 3906); `Store.sql` (3904, 3906) | CORE |
| [packages/store/src/store.ts:9234](../../packages/store/src/store.ts#L9234) `Store/relatedCriteria` | `SQLite.iterate` (9234); `SQLite.prepare` (9234); `Store.sql` (9234) | CORE |
| [packages/store/src/store.ts:9231](../../packages/store/src/store.ts#L9231) `Store/relatedCriteria/matched` | `relatedRows` (9231) | CORE |
| [packages/store/src/store.ts:7544](../../packages/store/src/store.ts#L7544) `Store/relatedValues` | `Calculations.globalValue` (7544); `Calculations.unstoredValue` (7546) | CORE |
| [packages/store/src/store.ts:5964](../../packages/store/src/store.ts#L5964) `Store/removePasskey` | `SQLite.get` (5964); `SQLite.prepare` (5964, 5965); `Store.sql` (5964, 5965) | CORE |
| [packages/store/src/store.ts:10483](../../packages/store/src/store.ts#L10483) `Store/restoreDeletedRowLocked` | `SQLite.get` (10483, 10488); `SQLite.prepare` (10483, 10484, 10488, 10498); `Store.sql` (10483, 10484, 10488, 10498); `SQLite.all` (10484) | CORE |
| [packages/store/src/store.ts:2657](../../packages/store/src/store.ts#L2657) `Store/restoreRecord` | `Store.recordAsOf` (2657); `SQLite.get` (2661); `SQLite.prepare` (2661, 2666, 2675, 2686); `Store.sql` (2661, 2666, 2675, 2686) | CORE |
| [packages/store/src/store.ts:2715](../../packages/store/src/store.ts#L2715) `Store/revertAuditEntry` | `SQLite.get` (2715); `SQLite.prepare` (2715); `Store.sql` (2715); `Store.canViewRecord` (2717); `Store.auditLog` (2720) | CORE |
| [packages/store/src/store.ts:5712](../../packages/store/src/store.ts#L5712) `Store/revokeApiToken` | `SQLite.prepare` (5712); `Store.sql` (5712) | CORE |
| [packages/store/src/store.ts:5235](../../packages/store/src/store.ts#L5235) `Store/revokeSignInCredentials` | `SQLite.prepare` (5235, 5236, 5237); `Store.sql` (5235, 5236, 5237) | AUTH |
| [packages/store/src/store.ts:9500](../../packages/store/src/store.ts#L9500) `Store/row` | `SQLite.get` (9500) | CORE |
| [packages/store/src/store.ts:11449](../../packages/store/src/store.ts#L11449) `Store/rowsOf` | `SQLite.iterate` (11449, 11458) | CORE |
| [packages/store/src/store.ts:6549](../../packages/store/src/store.ts#L6549) `Store/ruleOutcome` | `Calculations.context` (6549) | CORE |
| [packages/store/src/store.ts:9345](../../packages/store/src/store.ts#L9345) `Store/runningSummaryValues` | `Store.viewableIds` (9345); `rowsById` (9347); `Calculations.value` (9358, 9364); `Calculations.related` (9375) | GATED-STORE |
| [packages/store/src/store.ts:6171](../../packages/store/src/store.ts#L6171) `Store/savePrivilegeSet` | `SQLite.prepare` (6171, 6179); `Store.sql` (6171, 6179) | AUTH |
| [packages/store/src/store.ts:4139](../../packages/store/src/store.ts#L4139) `Store/saveScriptTest` | `SQLite.prepare` (4139); `Store.sql` (4139) | CORE |
| [packages/store/src/store.ts:6709](../../packages/store/src/store.ts#L6709) `Store/scopedTableSql` | `Store.viewableIds` (6709); `SQLite.all` (6712); `SQLite.prepare` (6712); `Store.sql` (6712) | GATED-STORE |
| [packages/store/src/store.ts:3344](../../packages/store/src/store.ts#L3344) `Store/scriptHistory` | `SQLite.all` (3344); `SQLite.prepare` (3344); `Store.sql` (3344) | CORE |
| [packages/store/src/store.ts:3017](../../packages/store/src/store.ts#L3017) `Store/securityChange` | `Store.sql` (3017, 3019); `SQLite.prepare` (3019) | CORE |
| [packages/store/src/store.ts:2581](../../packages/store/src/store.ts#L2581) `Store/securityEvents` | `Store.auditLog` (2581) | CORE |
| [packages/store/src/store.ts:5436](../../packages/store/src/store.ts#L5436) `Store/securityToken` | `SQLite.get` (5436); `SQLite.prepare` (5436); `Store.sql` (5436) | CORE |
| [packages/store/src/store.ts:11479](../../packages/store/src/store.ts#L11479) `Store/selectHeldCurrent` | `Store.sql` (11479, 11480, 11482); `SQLite.prepare` (11480) | CORE |
| [packages/store/src/store.ts:10788](../../packages/store/src/store.ts#L10788) `Store/selectIdsCurrent` | `Store.selectIds` (10788); `SQLite.all` (10794); `SQLite.prepare` (10794); `Store.sql` (10794) | GATED-STORE |
| [packages/store/src/store.ts:11469](../../packages/store/src/store.ts#L11469) `Store/selectIn` | `Store.select` (11469) | CORE |
| [packages/store/src/store.ts:1984](../../packages/store/src/store.ts#L1984) `Store/selfContainedCopy` | `Store.sql` (1984); `SQLite.all` (1989); `SQLite.prepare` (1989, 1991, 1992, 1993) | CORE |
| [packages/store/src/store.ts:5214](../../packages/store/src/store.ts#L5214) `Store/setAccountActive` | `SQLite.prepare` (5214, 5222, 5223); `Store.sql` (5214, 5222, 5223) | AUTH |
| [packages/store/src/store.ts:5455](../../packages/store/src/store.ts#L5455) `Store/setAccountLocalOnly` | `SQLite.prepare` (5455); `Store.sql` (5455) | CORE |
| [packages/store/src/store.ts:6327](../../packages/store/src/store.ts#L6327) `Store/setAccountPrivilegeSet` | `SQLite.get` (6327); `SQLite.prepare` (6327, 6330, 6334); `Store.sql` (6327, 6330, 6334) | AUTH |
| [packages/store/src/store.ts:5464](../../packages/store/src/store.ts#L5464) `Store/setAccountRequire2fa` | `SQLite.prepare` (5464); `Store.sql` (5464) | CORE |
| [packages/store/src/store.ts:3805](../../packages/store/src/store.ts#L3805) `Store/setAgentAccount` | `SQLite.get` (3805); `SQLite.prepare` (3805, 3811); `Store.sql` (3805, 3811) | CORE |
| [packages/store/src/store.ts:4188](../../packages/store/src/store.ts#L4188) `Store/setAiAllowed` | `SQLite.prepare` (4188); `Store.sql` (4188) | CORE |
| [packages/store/src/store.ts:4290](../../packages/store/src/store.ts#L4290) `Store/setAiPolicy` | `SQLite.prepare` (4290); `Store.sql` (4290) | CORE |
| [packages/store/src/store.ts:6975](../../packages/store/src/store.ts#L6975) `Store/setAllowBlankPasswordFromLan` | `SQLite.prepare` (6975); `Store.sql` (6975) | CORE |
| [packages/store/src/store.ts:2817](../../packages/store/src/store.ts#L2817) `Store/setAuditSettings` | `SQLite.prepare` (2817); `Store.sql` (2817) | CORE |
| [packages/store/src/store.ts:8890](../../packages/store/src/store.ts#L8890) `Store/setContainer` | `Store.sql` (8890); `Store.row` (8896) | CORE |
| [packages/store/src/store.ts:3757](../../packages/store/src/store.ts#L3757) `Store/setExternalAccount` | `SQLite.get` (3757); `SQLite.prepare` (3757, 3762); `Store.sql` (3757, 3762) | CORE |
| [packages/store/src/store.ts:4913](../../packages/store/src/store.ts#L4913) `Store/setMustChangePassword` | `SQLite.prepare` (4913); `Store.sql` (4913) | CORE |
| [packages/store/src/store.ts:4080](../../packages/store/src/store.ts#L4080) `Store/setPasswordPolicy` | `SQLite.prepare` (4080); `Store.sql` (4080) | CORE |
| [packages/store/src/store.ts:1486](../../packages/store/src/store.ts#L1486) `Store/setPersistentData` | `SQLite.prepare` (1486, 1490); `Store.sql` (1486, 1490) | CORE |
| [packages/store/src/store.ts:4310](../../packages/store/src/store.ts#L4310) `Store/setPiiIsolation` | `SQLite.prepare` (4310); `Store.sql` (4310) | CORE |
| [packages/store/src/store.ts:4116](../../packages/store/src/store.ts#L4116) `Store/setRequireTotpForFullAccess` | `SQLite.prepare` (4116); `Store.sql` (4116) | CORE |
| [packages/store/src/store.ts:4222](../../packages/store/src/store.ts#L4222) `Store/setScriptNetwork` | `SQLite.prepare` (4222); `Store.sql` (4222) | CORE |
| [packages/store/src/store.ts:4279](../../packages/store/src/store.ts#L4279) `Store/setSqlRequiresFmxdbc` | `SQLite.prepare` (4279); `Store.sql` (4279) | CORE |
| [packages/store/src/store.ts:9929](../../packages/store/src/store.ts#L9929) `Store/setStoredCalcValues` | `SQLite.prepare` (9929, 9930); `Store.sql` (9929, 9930); `SQLite.get` (9934) | CORE |
| [packages/store/src/store.ts:8993](../../packages/store/src/store.ts#L8993) `Store/setUserPref` | `Store.sql` (8993, 8994, 8995); `SQLite.prepare` (8994, 8995) | CORE |
| [packages/store/src/store.ts:4263](../../packages/store/src/store.ts#L4263) `Store/setWebViewerHosts` | `SQLite.prepare` (4263); `Store.sql` (4263) | CORE |
| [packages/store/src/store.ts:5389](../../packages/store/src/store.ts#L5389) `Store/settleSignIns` | `SQLite.all` (5389, 5395); `SQLite.prepare` (5389, 5395, 5401, 5405, 5407); `Store.sql` (5389, 5395, 5401, 5405, 5407) | AUTH |
| [packages/store/src/store.ts:2115](../../packages/store/src/store.ts#L2115) `Store/shareResults` | `Store.sql` (2115) | CORE |
| [packages/store/src/store.ts:1548](../../packages/store/src/store.ts#L1548) `Store/shipWal` | `Store.sql` (1548) | CORE |
| [packages/store/src/store.ts:5336](../../packages/store/src/store.ts#L5336) `Store/signInBase` | `SQLite.get` (5336); `SQLite.prepare` (5336); `Store.sql` (5336) | AUTH |
| [packages/store/src/store.ts:5338](../../packages/store/src/store.ts#L5338) `Store/signInBase/identity` | `SQLite.get` (5338); `SQLite.prepare` (5338); `Store.sql` (5338) | AUTH |
| [packages/store/src/store.ts:5325](../../packages/store/src/store.ts#L5325) `Store/signInMark` | `SQLite.prepare` (5325); `Store.sql` (5325) | AUTH |
| [packages/store/src/store.ts:11086](../../packages/store/src/store.ts#L11086) `Store/sortIdsCurrentProgress` | `Store.sortIds` (11086); `Store.sortIdsProgress` (11086); `SQLite.all` (11099); `SQLite.prepare` (11099, 11174); `Store.sql` (11099, 11174); `Store.valueListItems` (11107); `rowsById` (11119); `Calculations.globalValue` (11122); `Calculations.unstoredValue` (11123); `Calculations.related` (11129); `SQLite.iterate` (11174) | GATED-STORE |
| [packages/store/src/store.ts:9159](../../packages/store/src/store.ts#L9159) `Store/sortedPage` | `SQLite.iterate` (9159); `SQLite.prepare` (9159, 9174); `Store.sql` (9159, 9174); `SQLite.all` (9174) | CORE |
| [packages/store/src/store.ts:11260](../../packages/store/src/store.ts#L11260) `Store/storedFileId` | `SQLite.get` (11260); `SQLite.prepare` (11260) | CORE |
| [packages/store/src/store.ts:9307](../../packages/store/src/store.ts#L9307) `Store/summaries` | `Calculations.wholeTable` (9307); `Calculations.collect` (9327, 9332) | CORE |
| [packages/store/src/store.ts:9323](../../packages/store/src/store.ts#L9323) `Store/summaries/recs` | `SQLite.iterate` (9323); `SQLite.prepare` (9323); `Store.sql` (9323) | CORE |
| [packages/store/src/store.ts:5902](../../packages/store/src/store.ts#L5902) `Store/takeWebauthnChallenge` | `SQLite.get` (5902); `SQLite.prepare` (5902, 5906); `Store.sql` (5902, 5906) | CORE |
| [packages/store/src/store.ts:9046](../../packages/store/src/store.ts#L9046) `Store/timeFind` | `Store.query` (9046) | CORE |
| [packages/store/src/store.ts:9060](../../packages/store/src/store.ts#L9060) `Store/reportFind` | `Store.query` (9060, 9062, 9063); `Store.recordCount` (9065) | CORE |
| [packages/store/src/store.ts:7481](../../packages/store/src/store.ts#L7481) `Store/toRecord` | `Calculations.value` (7481, 7491); `Calculations.globalValue` (7485); `Calculations.unstoredStyled` (7490) | CORE |
| [packages/store/src/store.ts:5786](../../packages/store/src/store.ts#L5786) `Store/totpAccounts` | `SQLite.all` (5786); `SQLite.prepare` (5786); `Store.sql` (5786) | CORE |
| [packages/store/src/store.ts:1560](../../packages/store/src/store.ts#L1560) `Store/trial` | `Store.sql` (1560) | CORE |
| [packages/store/src/store.ts:1565](../../packages/store/src/store.ts#L1565) `Store/trial/undo` | `Store.sql` (1565) | CORE |
| [packages/store/src/store.ts:11216](../../packages/store/src/store.ts#L11216) `Store/truncate/run` | `Store.sql` (11216, 11218, 11225, 11227, 11229, 11230); `SQLite.prepare` (11218, 11225); `SQLite.all` (11220) | CORE |
| [packages/store/src/store.ts:3704](../../packages/store/src/store.ts#L3704) `Store/unmigratedAccounts` | `SQLite.all` (3704); `SQLite.prepare` (3704); `Store.sql` (3704) | CORE |
| [packages/store/src/store.ts:4819](../../packages/store/src/store.ts#L4819) `Store/unusedAccess` | `SQLite.get` (4819); `SQLite.prepare` (4819, 4828); `Store.sql` (4819, 4828); `SQLite.all` (4828) | CORE |
| [packages/store/src/store.ts:4867](../../packages/store/src/store.ts#L4867) `Store/unusedObjects` | `SQLite.get` (4867); `SQLite.prepare` (4867, 4870); `Store.sql` (4867, 4870); `SQLite.all` (4870) | CORE |
| [packages/store/src/store.ts:6026](../../packages/store/src/store.ts#L6026) `Store/unusedRecoveryHashes` | `SQLite.all` (6026); `SQLite.prepare` (6026); `Store.sql` (6026) | CORE |
| [packages/store/src/store.ts:4649](../../packages/store/src/store.ts#L4649) `Store/unusualAccess` | `Store.auditLog` (4649, 4715) | CORE |
| [packages/store/src/store.ts:9750](../../packages/store/src/store.ts#L9750) `Store/update` | `Store.row` (9750); `Store.sql` (9781, 9782, 9821, 9824) | CORE |
| [packages/store/src/store.ts:9784](../../packages/store/src/store.ts#L9784) `Store/update/undo` | `Store.sql` (9784) | CORE |
| [packages/store/src/store.ts:10214](../../packages/store/src/store.ts#L10214) `Store/updatePortals` | `Store.row` (10214, 10250); `relatedRows` (10251) | CORE |
| [packages/store/src/store.ts:10224](../../packages/store/src/store.ts#L10224) `Store/updatePortals/portal/related` | `relatedIdList` (10224) | CORE |
| [packages/store/src/store.ts:10196](../../packages/store/src/store.ts#L10196) `Store/updateRelated` | `relatedRows` (10196) | CORE |
| [packages/store/src/store.ts:4905](../../packages/store/src/store.ts#L4905) `Store/usageCounting` | `SQLite.get` (4905); `SQLite.prepare` (4905); `Store.sql` (4905) | CORE |
| [packages/store/src/store.ts:8984](../../packages/store/src/store.ts#L8984) `Store/userPrefs` | `SQLite.all` (8984); `SQLite.prepare` (8984); `Store.sql` (8984) | CORE |
| [packages/store/src/store.ts:7866](../../packages/store/src/store.ts#L7866) `Store/valueListItemsCurrent` | `Store.valueListItems` (7866); `Store.get` (7880); `relatedRows` (7881); `Store.row` (7881); `SQLite.iterate` (7883); `SQLite.prepare` (7883); `Store.sql` (7883); `Calculations.related` (7893); `Calculations.value` (7897, 7898) | GATED-STORE |
| [packages/store/src/store.ts:10405](../../packages/store/src/store.ts#L10405) `Store/vaultHeld` | `SQLite.get` (10405); `SQLite.prepare` (10405); `Store.sql` (10405) | CORE |
| [packages/store/src/store.ts:5815](../../packages/store/src/store.ts#L5815) `Store/verifyTotp` | `SQLite.get` (5815); `SQLite.prepare` (5815, 5822); `Store.sql` (5815, 5822) | CORE |
| [packages/store/src/store.ts:2251](../../packages/store/src/store.ts#L2251) `Store/versionNumber` | `SQLite.get` (2251); `SQLite.prepare` (2251); `Store.sql` (2251) | CORE |
| [packages/store/src/store.ts:2126](../../packages/store/src/store.ts#L2126) `Store/versionTriggers` | `SQLite.get` (2126); `SQLite.prepare` (2126, 2131, 2132); `Store.sql` (2126, 2131, 2132, 2149, 2151, 2152, 2154); `SQLite.all` (2131, 2132) | CORE |
| [packages/store/src/store.ts:2094](../../packages/store/src/store.ts#L2094) `Store/warmSummariesCurrent` | `Calculations.wholeTable` (2094) | CORE |
| [packages/store/src/store.ts:4245](../../packages/store/src/store.ts#L4245) `Store/webViewerChecked` | `SQLite.get` (4245); `SQLite.prepare` (4245); `Store.sql` (4245) | CORE |
| [packages/store/src/store.ts:1852](../../packages/store/src/store.ts#L1852) `Store/withWriteTransaction` | `Store.sql` (1852, 1864, 1870, 1872, 1872) | CORE |
| [packages/store/src/store.ts:7416](../../packages/store/src/store.ts#L7416) `Store/wordIndex` | `Store.sql` (7416, 7424, 7429); `Store.recordCount` (7428); `SQLite.get` (7429); `SQLite.prepare` (7429) | CORE |
| [packages/store/src/store.ts:8564](../../packages/store/src/store.ts#L8564) `Store/writeExternalFile` | `Store.evaluateEach` (8564); `SQLite.prepare` (8587); `Store.sql` (8587) | CORE |
| [packages/store/src/store.ts:8588](../../packages/store/src/store.ts#L8588) `Store/writeExternalFile/taken` | `SQLite.get` (8588) | CORE |
| [packages/store/src/store.ts:5645](../../packages/store/src/store.ts#L5645) `Store/writeObjectUseRows` | `SQLite.prepare` (5645, 5646, 5651); `Store.sql` (5645, 5646, 5651) | CORE |
| [packages/store/src/store.ts:2306](../../packages/store/src/store.ts#L2306) `Store/writeToken` | `SQLite.get` (2306); `SQLite.prepare` (2306); `Store.sql` (2306) | CORE |
| [packages/store/src/store.ts:5617](../../packages/store/src/store.ts#L5617) `Store/writeUsage` | `Store.sql` (5617, 5618, 5620, 5624, 5626) | CORE |
| [packages/store/src/store.ts:5633](../../packages/store/src/store.ts#L5633) `Store/writeUsageRows` | `SQLite.prepare` (5633, 5634, 5640); `Store.sql` (5633, 5634, 5640) | CORE |
| [packages/store/src/store.ts:7137](../../packages/store/src/store.ts#L7137) `Store/design` | `SQLite.get` (7137) | CORE |
| [packages/store/src/store.ts:7159](../../packages/store/src/store.ts#L7159) `Store/themes` | `SQLite.get` (7159) | CORE |
| [packages/store/src/store.ts:5986](../../packages/store/src/store.ts#L5986) `Store/verifyPasskeyCredential` | `SQLite.get` (5986); `SQLite.prepare` (5986, 5998); `Store.sql` (5986, 5998) | CORE |
| [packages/store/src/store.ts:6946](../../packages/store/src/store.ts#L6946) `Store/passwordState` | `SQLite.get` (6946); `SQLite.prepare` (6946); `Store.sql` (6946) | CORE |
| [packages/store/src/store.ts:10349](../../packages/store/src/store.ts#L10349) `Store/deleteVisibility` | `Store.canViewRecord` (10349) | CORE |
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
| [packages/store/src/store.ts:3963](../../packages/store/src/store.ts#L3963) `Store/setPasswordOnly` | `SQLite.get` (3963); `SQLite.prepare` (3963, 3969, 3978, 3985, 3986, 3987); `Store.sql` (3963, 3969, 3978, 3985, 3986, 3987) | AUTH |
| [packages/store/src/store.ts:4010](../../packages/store/src/store.ts#L4010) `Store/createAccountOnly` | `SQLite.get` (4010); `SQLite.prepare` (4010, 4014, 4020, 4025, 4030); `Store.sql` (4010, 4014, 4020, 4025, 4030) | CORE |
| [packages/store/src/store.ts:7028](../../packages/store/src/store.ts#L7028) `Store/crossFileBusy` | `Store.sql` (7028) | AUTH |
| [packages/store/src/store.ts:7000](../../packages/store/src/store.ts#L7000) `Store/crossFileHash` | `SQLite.get` (7000); `SQLite.prepare` (7000); `Store.sql` (7000) | AUTH |
<!-- end generated read-gate inventory -->
