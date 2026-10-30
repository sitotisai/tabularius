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
| [packages/cli/src/main.ts:721](../../packages/cli/src/main.ts#L721) `accountsWithPasswordOff` | `SQLite.all` (721); `SQLite.prepare` (721) | OPERATOR |
| [packages/cli/src/main.ts:750](../../packages/cli/src/main.ts#L750) `hostedRead` | `SQLite.all` (750, 753); `SQLite.prepare` (750, 753); `Store.sql` (750, 753) | OPERATOR |
| [packages/cli/src/main.ts:2436](../../packages/cli/src/main.ts#L2436) `main` | `Store.orphanContainerReport` (2436); `Store.auditLog` (2909); `SQLite.get` (3171); `SQLite.prepare` (3171) | OPERATOR |
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
| [packages/scripts/src/engine.ts:9018](../../packages/scripts/src/engine.ts#L9018) `ScriptEngine/quickFind` | `Store.get` (9018) | SCRIPT |
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
| [packages/scripts/src/engine.ts:9410](../../packages/scripts/src/engine.ts#L9410) `clearRecords` | `SQLite.all` (9410); `SQLite.prepare` (9410) | SCRIPT |
| [packages/scripts/src/recorder.ts:83](../../packages/scripts/src/recorder.ts#L83) `lastSeq` | `Store.auditLog` (83) | DESIGN |
| [packages/scripts/src/recorder.ts:121](../../packages/scripts/src/recorder.ts#L121) `recordRun` | `Store.auditLog` (121) | DESIGN |
| [packages/scripts/src/script-tests.ts:213](../../packages/scripts/src/script-tests.ts#L213) `runCase` | `Store.findIds` (213); `Store.auditLog` (220, 221, 265); `Store.evaluateEach` (248) | DESIGN |
| [packages/scripts/src/testrun.ts:306](../../packages/scripts/src/testrun.ts#L306) `recordWith` | `Store.evaluateEach` (306) | DESIGN |
| [packages/scripts/src/testrun.ts:199](../../packages/scripts/src/testrun.ts#L199) `seedSelections` | `Calculations.globalValue` (199); `Store.find` (204) | DESIGN |
| [packages/scripts/src/testrun.ts:338](../../packages/scripts/src/testrun.ts#L338) `testRun` | `Store.evaluateEach` (338) | DESIGN |
| [packages/scripts/src/testrun.ts:270](../../packages/scripts/src/testrun.ts#L270) `testScript` | `Store.findIds` (270) | DESIGN |
| [packages/server/src/admin.ts:2419](../../packages/server/src/admin.ts#L2419) `Admin/audit` | `Store.auditLog` (2419) | ADMIN |
| [packages/server/src/admin.ts:1139](../../packages/server/src/admin.ts#L1139) `Admin/handle` | `Store.externalContainerReport` (1139); `Store.orphanContainerReport` (1144, 1148) | ADMIN |
| [packages/server/src/admin.ts:2859](../../packages/server/src/admin.ts#L2859) `Admin/status` | `Store.externalContainerCount` (2859) | ADMIN |
| [packages/server/src/admin.ts:2502](../../packages/server/src/admin.ts#L2502) `Admin/viewAs` | `Store.find` (2502) | ADMIN |
| [packages/server/src/agent.ts:319](../../packages/server/src/agent.ts#L319) `dryRunPlan` | `Store.findIds` (319) | DESIGN |
| [packages/server/src/agent.ts:342](../../packages/server/src/agent.ts#L342) `runApprovedStep` | `Store.findIds` (342) | DESIGN |
| [packages/server/src/agent.ts:163](../../packages/server/src/agent.ts#L163) `runStep` | `Store.findIds` (163); `Store.auditLog` (232); `Store.canViewRecord` (244) | DESIGN |
| [packages/server/src/agent.ts:155](../../packages/server/src/agent.ts#L155) `runStep/visible` | `Store.findIds` (155) | DESIGN |
| [packages/server/src/ai-output.ts:147](../../packages/server/src/ai-output.ts#L147) `storedSecretValues` | `Calculations.globalValue` (147); `Store.select` (152) | REDACTION |
| [packages/server/src/ai-policy-sql.ts:49](../../packages/server/src/ai-policy-sql.ts#L49) `sqlFieldRefs` | `SQLite.all` (49, 51); `SQLite.prepare` (49, 51) | POLICY |
| [packages/server/src/ai-policy.ts:355](../../packages/server/src/ai-policy.ts#L355) `sql` | `Store.inspectQuery` (355) | POLICY |
| [packages/server/src/ai-usage.ts:195](../../packages/server/src/ai-usage.ts#L195) `AiUsage/add` | `SQLite.prepare` (195, 198) | AUTH |
| [packages/server/src/ai-usage.ts:235](../../packages/server/src/ai-usage.ts#L235) `AiUsage/importOld` | `SQLite.prepare` (235, 245, 253, 257) | AUTH |
| [packages/server/src/ai-usage.ts:180](../../packages/server/src/ai-usage.ts#L180) `AiUsage/month` | `SQLite.get` (180); `SQLite.prepare` (180) | AUTH |
| [packages/server/src/ai-usage.ts:206](../../packages/server/src/ai-usage.ts#L206) `AiUsage/question` | `SQLite.prepare` (206, 208, 209, 211) | AUTH |
| [packages/server/src/ai-usage.ts:187](../../packages/server/src/ai-usage.ts#L187) `AiUsage/recent` | `SQLite.all` (187); `SQLite.prepare` (187) | AUTH |
| [packages/server/src/ai-usage.ts:173](../../packages/server/src/ai-usage.ts#L173) `AiUsage/today` | `SQLite.get` (173); `SQLite.prepare` (173) | AUTH |
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
| [packages/server/src/backup-verify.ts:152](../../packages/server/src/backup-verify.ts#L152) `testRestore` | `Store.recordCount` (152) | OPERATOR |
| [packages/server/src/backup.ts:1064](../../packages/server/src/backup.ts#L1064) `accountDifferences/read` | `SQLite.all` (1064, 1066); `SQLite.prepare` (1064, 1066) | OPERATOR |
| [packages/server/src/backup.ts:1177](../../packages/server/src/backup.ts#L1177) `columnInfo` | `SQLite.all` (1177); `SQLite.prepare` (1177) | OPERATOR |
| [packages/server/src/backup.ts:1121](../../packages/server/src/backup.ts#L1121) `credentialsReadable` | `SQLite.all` (1121); `SQLite.prepare` (1121) | OPERATOR |
| [packages/server/src/backup.ts:1091](../../packages/server/src/backup.ts#L1091) `readNames` | `SQLite.all` (1091); `SQLite.prepare` (1091) | OPERATOR |
| [packages/server/src/backup.ts:1212](../../packages/server/src/backup.ts#L1212) `reconcileCredentials` | `SQLite.all` (1212, 1234, 1249, 1259, 1265); `SQLite.prepare` (1212, 1220, 1234, 1236, 1249, 1250, 1257, 1259, 1260, 1265, 1266, 1270, 1271, 1272); `SQLite.get` (1220, 1270) | OPERATOR |
| [packages/server/src/backup.ts:1239](../../packages/server/src/backup.ts#L1239) `reconcileCredentials/accountColumns` | `SQLite.all` (1239); `SQLite.prepare` (1239) | OPERATOR |
| [packages/server/src/backup.ts:1215](../../packages/server/src/backup.ts#L1215) `reconcileCredentials/has` | `SQLite.all` (1215); `SQLite.prepare` (1215) | OPERATOR |
| [packages/server/src/backup.ts:1148](../../packages/server/src/backup.ts#L1148) `retainCurrentRecordIdMarks` | `SQLite.prepare` (1148, 1159, 1160, 1161); `SQLite.all` (1150, 1160); `SQLite.get` (1159) | OPERATOR |
| [packages/server/src/backup.ts:1387](../../packages/server/src/backup.ts#L1387) `stageRestorePoint` | `SQLite.get` (1387, 1389, 1390); `SQLite.prepare` (1387, 1389, 1390) | OPERATOR |
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
| [packages/server/src/integrity-check.ts:13](../../packages/server/src/integrity-check.ts#L13) `integrity` | `SQLite.all` (13); `SQLite.prepare` (13, 17); `SQLite.get` (17) | OPERATOR |
| [packages/server/src/integrity-check.ts:43](../../packages/server/src/integrity-check.ts#L43) `pageCheck` | `SQLite.all` (43); `SQLite.prepare` (43, 46); `SQLite.get` (46) | OPERATOR |
| [packages/server/src/live.ts:207](../../packages/server/src/live.ts#L207) `Live/handle` | `Store.canView` (207) | LIVE |
| [packages/server/src/live.ts:281](../../packages/server/src/live.ts#L281) `Live/visibleRecord` | `Store.canViewRecord` (281) | LIVE |
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
| [packages/server/src/pgwire.ts:989](../../packages/server/src/pgwire.ts#L989) `Connection/bareNames` | `Store.describe` (989) | SQL |
| [packages/server/src/pgwire.ts:1005](../../packages/server/src/pgwire.ts#L1005) `Connection/catalog` | `Store.describeTyped` (1005) | SQL |
| [packages/server/src/pgwire.ts:1448](../../packages/server/src/pgwire.ts#L1448) `Connection/describe` | `Store.describeTyped` (1448) | SQL |
| [packages/server/src/pgwire.ts:1016](../../packages/server/src/pgwire.ts#L1016) `Connection/run` | `Store.selectIn` (1016); `Store.describeTyped` (1020) | SQL |
| [packages/server/src/pgwire.ts:966](../../packages/server/src/pgwire.ts#L966) `Connection/translate` | `Calculations.translateSQL` (966) | SQL |
| [packages/server/src/pgwire.ts:1214](../../packages/server/src/pgwire.ts#L1214) `Connection/validateSyntax` | `SQLite.prepare` (1214); `Store.sql` (1214) | SQL |
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
| [packages/server/src/standby.ts:417](../../packages/server/src/standby.ts#L417) `Standby/copy` | `SQLite.get` (417); `SQLite.prepare` (417) | OPERATOR |
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
| [packages/store/src/calc.ts:3228](../../packages/store/src/calc.ts#L3228) `rowsById/flush` | `Calculations.statement` (3228); `SQLite.iterate` (3228) | CALC |
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
| [packages/store/src/import.ts:288](../../packages/store/src/import.ts#L288) `createStore` | `SQLite.prepare` (288, 300) | OPERATOR |
| [packages/store/src/import.ts:199](../../packages/store/src/import.ts#L199) `importDesigns` | `SQLite.all` (199); `SQLite.prepare` (199, 213, 216, 219, 221); `SQLite.get` (213, 216) | OPERATOR |
| [packages/store/src/import.ts:424](../../packages/store/src/import.ts#L424) `importFmp12` | `SQLite.prepare` (424, 435, 441, 447, 451, 466, 477, 567, 568, 569); `SQLite.get` (441, 466); `SQLite.all` (447) | OPERATOR |
| [packages/store/src/import.ts:415](../../packages/store/src/import.ts#L415) `importFmp12/save` | `SQLite.prepare` (415) | OPERATOR |
| [packages/store/src/import.ts:525](../../packages/store/src/import.ts#L525) `importFmp12/skipped` | `SQLite.get` (525); `SQLite.prepare` (525) | OPERATOR |
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
| [packages/store/src/store.ts:5266](../../packages/store/src/store.ts#L5266) `Store/accountIdentityId` | `SQLite.get` (5266, 5272); `SQLite.prepare` (5266, 5271, 5272); `Store.sql` (5266, 5271, 5272) | CORE |
| [packages/store/src/store.ts:5260](../../packages/store/src/store.ts#L5260) `Store/accountIdentityIdIfSet` | `SQLite.get` (5260); `SQLite.prepare` (5260); `Store.sql` (5260) | CORE |
| [packages/store/src/store.ts:5222](../../packages/store/src/store.ts#L5222) `Store/accountInactive` | `SQLite.get` (5222); `SQLite.prepare` (5222); `Store.sql` (5222) | CORE |
| [packages/store/src/store.ts:5419](../../packages/store/src/store.ts#L5419) `Store/accountLocalOnly` | `SQLite.get` (5419); `SQLite.prepare` (5419); `Store.sql` (5419) | CORE |
| [packages/store/src/store.ts:6288](../../packages/store/src/store.ts#L6288) `Store/accountPrivilegeSet` | `SQLite.get` (6288); `SQLite.prepare` (6288); `Store.sql` (6288) | CORE |
| [packages/store/src/store.ts:5424](../../packages/store/src/store.ts#L5424) `Store/accountRequires2fa` | `SQLite.get` (5424); `SQLite.prepare` (5424); `Store.sql` (5424) | CORE |
| [packages/store/src/store.ts:5644](../../packages/store/src/store.ts#L5644) `Store/accountUsage` | `SQLite.get` (5644); `SQLite.prepare` (5644, 5645); `Store.sql` (5644, 5645); `SQLite.all` (5645); `Store.auditLog` (5661) | CORE |
| [packages/store/src/store.ts:3668](../../packages/store/src/store.ts#L3668) `Store/accounts` | `SQLite.all` (3668); `SQLite.prepare` (3668); `Store.sql` (3668) | CORE |
| [packages/store/src/store.ts:3664](../../packages/store/src/store.ts#L3664) `Store/accountsSharingLockout` | `SQLite.all` (3664); `SQLite.prepare` (3664); `Store.sql` (3664) | CORE |
| [packages/store/src/store.ts:8475](../../packages/store/src/store.ts#L8475) `Store/addContainer` | `SQLite.all` (8475); `SQLite.prepare` (8475, 8480, 8494, 8498, 8499); `Store.sql` (8475, 8480, 8494, 8496, 8498, 8499, 8501, 8504); `SQLite.get` (8485); `Store.containerRange` (8487) | CORE |
| [packages/store/src/store.ts:8521](../../packages/store/src/store.ts#L8521) `Store/addExternalContainer` | `SQLite.prepare` (8521); `Store.sql` (8521) | CORE |
| [packages/store/src/store.ts:8998](../../packages/store/src/store.ts#L8998) `Store/addFieldIndex` | `Store.sql` (8998) | CORE |
| [packages/store/src/store.ts:7170](../../packages/store/src/store.ts#L7170) `Store/addImage` | `Store.sql` (7170, 7171); `SQLite.prepare` (7171) | CORE |
| [packages/store/src/store.ts:6338](../../packages/store/src/store.ts#L6338) `Store/addProvisionedAccount` | `SQLite.get` (6338); `SQLite.prepare` (6338, 6342); `Store.sql` (6338, 6342) | CORE |
| [packages/store/src/store.ts:7593](../../packages/store/src/store.ts#L7593) `Store/addRelated` | `relatedRows` (7593); `rowsById` (7626); `firstRelatedEach` (7649) | CORE |
| [packages/store/src/store.ts:3686](../../packages/store/src/store.ts#L3686) `Store/agentNeedsApproval` | `SQLite.get` (3686); `SQLite.prepare` (3686); `Store.sql` (3686) | CORE |
| [packages/store/src/store.ts:6565](../../packages/store/src/store.ts#L6565) `Store/allowedIds` | `SQLite.iterate` (6565); `SQLite.prepare` (6565); `Store.sql` (6565) | CORE |
| [packages/store/src/store.ts:5701](../../packages/store/src/store.ts#L5701) `Store/apiToken` | `SQLite.get` (5701); `SQLite.prepare` (5701, 5719); `Store.sql` (5701, 5719) | CORE |
| [packages/store/src/store.ts:5677](../../packages/store/src/store.ts#L5677) `Store/apiTokens` | `SQLite.all` (5677); `SQLite.prepare` (5677); `Store.sql` (5677) | CORE |
| [packages/store/src/store.ts:3127](../../packages/store/src/store.ts#L3127) `Store/appendSecurityRow` | `Store.sql` (3127) | CORE |
| [packages/store/src/store.ts:4037](../../packages/store/src/store.ts#L4037) `Store/appendSecurityEvent` | `Store.sql` (4037) | CORE |
| [packages/store/src/store.ts:5042](../../packages/store/src/store.ts#L5042) `Store/applyAccountImport` | `Store.sql` (5042, 5050, 5079); `SQLite.get` (5050); `SQLite.prepare` (5050, 5079) | CORE |
| [packages/store/src/store.ts:2428](../../packages/store/src/store.ts#L2428) `Store/applyDesign` | `Store.sql` (2428, 2429, 2449, 2452, 2457, 2473, 2476, 2476); `SQLite.prepare` (2452, 2457) | CORE |
| [packages/store/src/store.ts:3882](../../packages/store/src/store.ts#L3882) `Store/approvePending` | `SQLite.get` (3882); `SQLite.prepare` (3882, 3893); `Store.sql` (3882, 3893) | CORE |
| [packages/store/src/store.ts:2918](../../packages/store/src/store.ts#L2918) `Store/audit/write` | `Store.sql` (2918) | CORE |
| [packages/store/src/store.ts:2540](../../packages/store/src/store.ts#L2540) `Store/auditLog` | `SQLite.all` (2540); `SQLite.prepare` (2540); `Store.sql` (2540) | CORE |
| [packages/store/src/store.ts:1963](../../packages/store/src/store.ts#L1963) `Store/backup` | `Store.sql` (1963) | CORE |
| [packages/store/src/store.ts:3692](../../packages/store/src/store.ts#L3692) `Store/blankPasswordAccounts` | `SQLite.all` (3692); `SQLite.prepare` (3692); `Store.sql` (3692) | CORE |
| [packages/store/src/store.ts:9584](../../packages/store/src/store.ts#L9584) `Store/canView` | `Store.canView` (9584); `Store.row` (9585) | GATED-STORE |
| [packages/store/src/store.ts:9566](../../packages/store/src/store.ts#L9566) `Store/canViewRecord` | `SQLite.get` (9566); `SQLite.prepare` (9566); `Store.sql` (9566) | GATED-STORE |
| [packages/store/src/store.ts:4971](../../packages/store/src/store.ts#L4971) `Store/canonicalAccount` | `SQLite.all` (4971); `SQLite.prepare` (4971); `Store.sql` (4971) | CORE |
| [packages/store/src/store.ts:10673](../../packages/store/src/store.ts#L10673) `Store/cascadeDelete` | `relatedRows` (10673) | CORE |
| [packages/store/src/store.ts:2263](../../packages/store/src/store.ts#L2263) `Store/changeOne` | `Store.sql` (2263, 2265) | CORE |
| [packages/store/src/store.ts:2266](../../packages/store/src/store.ts#L2266) `Store/changeOne/read` | `SQLite.get` (2266); `SQLite.prepare` (2266); `Store.sql` (2266) | CORE |
| [packages/store/src/store.ts:8856](../../packages/store/src/store.ts#L8856) `Store/checkContainerWrite` | `Store.row` (8856) | CORE |
| [packages/store/src/store.ts:10296](../../packages/store/src/store.ts#L10296) `Store/checkEditable` | `Store.row` (10296) | CORE |
| [packages/store/src/store.ts:1509](../../packages/store/src/store.ts#L1509) `Store/checkpoint` | `SQLite.get` (1509); `SQLite.prepare` (1509); `Store.sql` (1509) | CORE |
| [packages/store/src/store.ts:6324](../../packages/store/src/store.ts#L6324) `Store/clearAccountPrivilegeSet` | `SQLite.prepare` (6324); `Store.sql` (6324) | CORE |
| [packages/store/src/store.ts:1531](../../packages/store/src/store.ts#L1531) `Store/close` | `Store.sql` (1531) | CORE |
| [packages/store/src/store.ts:8824](../../packages/store/src/store.ts#L8824) `Store/compactFile` | `Store.sql` (8824, 8825, 8827) | CORE |
| [packages/store/src/store.ts:10797](../../packages/store/src/store.ts#L10797) `Store/computeValuesCurrent` | `Store.computeValues` (10797); `Store.sql` (10803, 10807); `SQLite.all` (10807); `SQLite.prepare` (10807) | GATED-STORE |
| [packages/store/src/store.ts:9235](../../packages/store/src/store.ts#L9235) `Store/computedRows` | `Store.sql` (9235, 9238, 9239, 9240, 9242, 9252, 9253, 9254, 9257); `SQLite.prepare` (9238, 9240, 9242, 9252); `SQLite.iterate` (9242); `Calculations.globalValue` (9245); `Calculations.unstoredValue` (9246); `Calculations.related` (9249); `SQLite.all` (9252) | CORE |
| [packages/store/src/store.ts:5746](../../packages/store/src/store.ts#L5746) `Store/confirmTotp` | `SQLite.get` (5746); `SQLite.prepare` (5746, 5748); `Store.sql` (5746, 5748) | CORE |
| [packages/store/src/store.ts:1151](../../packages/store/src/store.ts#L1151) `Store/constructor` | `Store.sql` (1151, 1153, 1155, 1156, 1160, 1164, 1165, 1174, 1182, 1197, 1202, 1207, 1208, 1212, 1213, 1214, 1221, 1225, 1229, 1230, 1231, 1236, 1237, 1241, 1244, 1245, 1247, 1248, 1251, 1252, 1256, 1257, 1261, 1262, 1265, 1267, 1270, 1271, 1275, 1276, 1280, 1281, 1285, 1286, 1287, 1290, 1291, 1294, 1295, 1297, 1297, 1298, 1298, 1299, 1303, 1305, 1309, 1311, 1314, 1315, 1316, 1319, 1320, 1322, 1324, 1325, 1329, 1330, 1332, 1344, 1346, 1347, 1348, 1348, 1352, 1353); `SQLite.get` (1155, 1174); `SQLite.prepare` (1155, 1174, 1182, 1244, 1245, 1248, 1251, 1256, 1261, 1270, 1275, 1280, 1290, 1294, 1297, 1298, 1319, 1324, 1329); `SQLite.all` (1244, 1251, 1256, 1261, 1270, 1275, 1280, 1290, 1294, 1297, 1298, 1319, 1324, 1329) | CORE |
| [packages/store/src/store.ts:6104](../../packages/store/src/store.ts#L6104) `Store/consumeRecoveryCode` | `SQLite.prepare` (6104); `Store.sql` (6104) | CORE |
| [packages/store/src/store.ts:8399](../../packages/store/src/store.ts#L8399) `Store/container` | `SQLite.get` (8399); `SQLite.prepare` (8399, 8408); `Store.sql` (8399, 8408); `SQLite.all` (8408) | CORE |
| [packages/store/src/store.ts:8833](../../packages/store/src/store.ts#L8833) `Store/containerId` | `Store.containerId` (8833); `Store.row` (8834) | CORE |
| [packages/store/src/store.ts:8416](../../packages/store/src/store.ts#L8416) `Store/containerInfo` | `SQLite.get` (8416); `SQLite.prepare` (8416); `Store.sql` (8416) | CORE |
| [packages/store/src/store.ts:8380](../../packages/store/src/store.ts#L8380) `Store/containerIntact` | `SQLite.get` (8380); `SQLite.prepare` (8380); `Store.sql` (8380) | CORE |
| [packages/store/src/store.ts:8319](../../packages/store/src/store.ts#L8319) `Store/containerIntegrityReport` | `SQLite.all` (8319); `SQLite.prepare` (8319, 8330); `Store.sql` (8319, 8330); `SQLite.get` (8330) | CORE |
| [packages/store/src/store.ts:8394](../../packages/store/src/store.ts#L8394) `Store/containerMeta` | `SQLite.get` (8394); `SQLite.prepare` (8394); `Store.sql` (8394) | CORE |
| [packages/store/src/store.ts:8450](../../packages/store/src/store.ts#L8450) `Store/containerRange` | `SQLite.all` (8450); `SQLite.prepare` (8450, 8457); `Store.sql` (8450, 8457); `SQLite.get` (8457) | CORE |
| [packages/store/src/store.ts:8221](../../packages/store/src/store.ts#L8221) `Store/containerReferences` | `SQLite.all` (8221, 8240, 8242, 8248, 8261, 8272, 8286); `SQLite.prepare` (8221, 8240, 8242, 8248, 8261, 8272, 8284, 8286); `Store.sql` (8221, 8240, 8242, 8248, 8261, 8272, 8284, 8286); `SQLite.get` (8284); `Store.row` (8295) | CORE |
| [packages/store/src/store.ts:10777](../../packages/store/src/store.ts#L10777) `Store/countIds` | `Store.countIds` (10777); `SQLite.get` (10781); `SQLite.prepare` (10781); `Store.sql` (10781) | GATED-STORE |
| [packages/store/src/store.ts:9615](../../packages/store/src/store.ts#L9615) `Store/create` | `SQLite.get` (9615); `SQLite.prepare` (9615, 9628); `Store.sql` (9615, 9628) | CORE |
| [packages/store/src/store.ts:5477](../../packages/store/src/store.ts#L5477) `Store/createApiToken` | `SQLite.get` (5477, 5505); `SQLite.prepare` (5477, 5504, 5505, 5515); `Store.sql` (5477, 5504, 5505, 5515) | CORE |
| [packages/store/src/store.ts:4983](../../packages/store/src/store.ts#L4983) `Store/createLocalAccount` | `SQLite.prepare` (4983); `Store.sql` (4983) | CORE |
| [packages/store/src/store.ts:3658](../../packages/store/src/store.ts#L3658) `Store/credentialIdentity` | `SQLite.get` (3658); `SQLite.prepare` (3658); `Store.sql` (3658) | CORE |
| [packages/store/src/store.ts:5398](../../packages/store/src/store.ts#L5398) `Store/credentialStamp` | `SQLite.get` (5398); `SQLite.prepare` (5398); `Store.sql` (5398) | CORE |
| [packages/store/src/store.ts:2053](../../packages/store/src/store.ts#L2053) `Store/dataVersion` | `SQLite.get` (2053); `SQLite.prepare` (2053); `Store.sql` (2053) | CORE |
| [packages/store/src/store.ts:11335](../../packages/store/src/store.ts#L11335) `Store/decimalViewSql` | `SQLite.all` (11335); `SQLite.prepare` (11335) | CORE |
| [packages/store/src/store.ts:10339](../../packages/store/src/store.ts#L10339) `Store/delete` | `Store.row` (10339) | CORE |
| [packages/store/src/store.ts:10347](../../packages/store/src/store.ts#L10347) `Store/delete/run` | `SQLite.get` (10347); `SQLite.prepare` (10347, 10352); `Store.sql` (10347, 10352) | CORE |
| [packages/store/src/store.ts:5137](../../packages/store/src/store.ts#L5137) `Store/deleteAccount` | `SQLite.prepare` (5137, 5141, 5142, 5143, 5144, 5145, 5146, 5147, 5148, 5155, 5157, 5159, 5161, 5165); `Store.sql` (5137, 5141, 5142, 5143, 5144, 5145, 5146, 5147, 5148, 5155, 5157, 5159, 5161, 5165) | CORE |
| [packages/store/src/store.ts:10420](../../packages/store/src/store.ts#L10420) `Store/deleteBeingUndone` | `SQLite.all` (10420); `SQLite.prepare` (10420); `Store.sql` (10420) | CORE |
| [packages/store/src/store.ts:10432](../../packages/store/src/store.ts#L10432) `Store/deleteEndingTheLifeAt` | `SQLite.get` (10432); `SQLite.prepare` (10432); `Store.sql` (10432) | CORE |
| [packages/store/src/store.ts:6189](../../packages/store/src/store.ts#L6189) `Store/deletePrivilegeSet` | `SQLite.prepare` (6189); `Store.sql` (6189) | CORE |
| [packages/store/src/store.ts:4147](../../packages/store/src/store.ts#L4147) `Store/deleteScriptTest` | `SQLite.prepare` (4147); `Store.sql` (4147) | CORE |
| [packages/store/src/store.ts:3295](../../packages/store/src/store.ts#L3295) `Store/deletedRows` | `SQLite.get` (3295); `SQLite.prepare` (3295, 3297, 3297); `Store.sql` (3295, 3297, 3297); `SQLite.all` (3297, 3297) | CORE |
| [packages/store/src/store.ts:3405](../../packages/store/src/store.ts#L3405) `Store/designEffect` | `Store.sql` (3405, 3411, 3412, 3415, 3421, 3426, 3429, 3435, 3446, 3447, 3449, 3450, 3463, 3464, 3467, 3469, 3475, 3476, 3477, 3483, 3485, 3489, 3492, 3493, 3495, 3498, 3504, 3506, 3513, 3514, 3516, 3517, 3518, 3519, 3526, 3527, 3529, 3529, 3531, 3532, 3533, 3537, 3541, 3543, 3581, 3583, 3585); `SQLite.prepare` (3415, 3446, 3447, 3463, 3464, 3475, 3476, 3483, 3485, 3489, 3493, 3504, 3506, 3519, 3526, 3527, 3529, 3531, 3533, 3537, 3541); `SQLite.get` (3446, 3463, 3475, 3476, 3489, 3493, 3529, 3537); `SQLite.all` (3526, 3527); `SQLite.iterate` (3531) | CORE |
| [packages/store/src/store.ts:3398](../../packages/store/src/store.ts#L3398) `Store/designEffect/renameExcluded` | `SQLite.prepare` (3398); `Store.sql` (3398) | CORE |
| [packages/store/src/store.ts:3382](../../packages/store/src/store.ts#L3382) `Store/designEffect/renameKey` | `SQLite.prepare` (3382); `Store.sql` (3382) | CORE |
| [packages/store/src/store.ts:3336](../../packages/store/src/store.ts#L3336) `Store/designHistory` | `SQLite.all` (3336); `SQLite.prepare` (3336); `Store.sql` (3336) | CORE |
| [packages/store/src/store.ts:5767](../../packages/store/src/store.ts#L5767) `Store/disableTotp` | `SQLite.prepare` (5767); `Store.sql` (5767) | CORE |
| [packages/store/src/store.ts:3593](../../packages/store/src/store.ts#L3593) `Store/dropColumnIndexes` | `SQLite.all` (3593, 3595); `SQLite.prepare` (3593, 3595); `Store.sql` (3593, 3595, 3596) | CORE |
| [packages/store/src/store.ts:9010](../../packages/store/src/store.ts#L9010) `Store/dropFieldIndex` | `SQLite.get` (9010); `SQLite.prepare` (9010); `Store.sql` (9010, 9011) | CORE |
| [packages/store/src/store.ts:9652](../../packages/store/src/store.ts#L9652) `Store/duplicate` | `Store.row` (9652); `SQLite.prepare` (9670); `Store.sql` (9670) | CORE |
| [packages/store/src/store.ts:8637](../../packages/store/src/store.ts#L8637) `Store/embeddedContainerCount` | `SQLite.prepare` (8637); `Store.sql` (8637); `SQLite.get` (8638) | CORE |
| [packages/store/src/store.ts:8623](../../packages/store/src/store.ts#L8623) `Store/embeddedContainers` | `SQLite.prepare` (8623, 8624); `Store.sql` (8623, 8624); `SQLite.all` (8624); `SQLite.get` (8628) | CORE |
| [packages/store/src/store.ts:3321](../../packages/store/src/store.ts#L3321) `Store/emptyDeleted` | `Store.sql` (3321, 3324, 3325, 3327, 3329); `SQLite.prepare` (3325) | CORE |
| [packages/store/src/store.ts:1929](../../packages/store/src/store.ts#L1929) `Store/endTransaction` | `Store.sql` (1929, 1932, 1932) | CORE |
| [packages/store/src/store.ts:5735](../../packages/store/src/store.ts#L5735) `Store/enrollTotp` | `SQLite.prepare` (5735); `Store.sql` (5735) | CORE |
| [packages/store/src/store.ts:3290](../../packages/store/src/store.ts#L3290) `Store/ensureDeleted` | `Store.sql` (3290) | CORE |
| [packages/store/src/store.ts:1363](../../packages/store/src/store.ts#L1363) `Store/ensureNativeIds` | `SQLite.all` (1363, 1375); `SQLite.prepare` (1363, 1366, 1374, 1375); `Store.sql` (1363, 1366, 1369, 1373, 1374, 1375, 1378, 1380) | CORE |
| [packages/store/src/store.ts:2175](../../packages/store/src/store.ts#L2175) `Store/ensureRecordIdHighWater` | `Store.sql` (2175, 2176, 2178, 2180, 2182) | CORE |
| [packages/store/src/store.ts:2194](../../packages/store/src/store.ts#L2194) `Store/ensureRecordIdMarks` | `SQLite.all` (2194, 2197, 2200, 2209); `SQLite.prepare` (2194, 2197, 2200, 2203, 2209, 2212); `Store.sql` (2194, 2197, 2200, 2203, 2209, 2212, 2216, 2217) | CORE |
| [packages/store/src/store.ts:9993](../../packages/store/src/store.ts#L9993) `Store/evaluateCurrent` | `Store.row` (9993, 9993, 9994, 9994); `Calculations.context` (9999); `Store.get` (10000, 10002) | GATED-STORE |
| [packages/store/src/store.ts:10034](../../packages/store/src/store.ts#L10034) `Store/evaluateEachCurrent` | `Store.row` (10034, 10034, 10039); `Calculations.context` (10040); `Store.get` (10042) | GATED-STORE |
| [packages/store/src/store.ts:10096](../../packages/store/src/store.ts#L10096) `Store/evaluateRowsCurrent` | `Store.row` (10096, 10096, 10097, 10097) | GATED-STORE |
| [packages/store/src/store.ts:10075](../../packages/store/src/store.ts#L10075) `Store/evaluateRowsCurrent/each` | `Calculations.context` (10075); `Store.get` (10077) | GATED-STORE |
| [packages/store/src/store.ts:10111](../../packages/store/src/store.ts#L10111) `Store/evaluateRowsCurrent/found/[Symbol.iterator]` | `rowsById` (10111) | GATED-STORE |
| [packages/store/src/store.ts:10133](../../packages/store/src/store.ts#L10133) `Store/evaluateRowsCurrent/key` | `Calculations.context` (10133) | GATED-STORE |
| [packages/store/src/store.ts:3925](../../packages/store/src/store.ts#L3925) `Store/externalAccount` | `SQLite.all` (3925); `SQLite.prepare` (3925); `Store.sql` (3925) | CORE |
| [packages/store/src/store.ts:8142](../../packages/store/src/store.ts#L8142) `Store/externalContainerCheck` | `SQLite.all` (8142); `SQLite.prepare` (8142); `Store.sql` (8142) | CORE |
| [packages/store/src/store.ts:8149](../../packages/store/src/store.ts#L8149) `Store/externalContainerCount` | `SQLite.get` (8149); `SQLite.prepare` (8149); `Store.sql` (8149) | CORE |
| [packages/store/src/store.ts:8158](../../packages/store/src/store.ts#L8158) `Store/externalContainerReport` | `SQLite.all` (8158, 8171); `SQLite.prepare` (8158, 8171); `Store.sql` (8158, 8171) | CORE |
| [packages/store/src/store.ts:5248](../../packages/store/src/store.ts#L5248) `Store/externalIdentityId` | `SQLite.get` (5248, 5255); `SQLite.prepare` (5248, 5254, 5255); `Store.sql` (5248, 5254, 5255) | CORE |
| [packages/store/src/store.ts:8390](../../packages/store/src/store.ts#L8390) `Store/externalOf` | `SQLite.get` (8390); `SQLite.prepare` (8390); `Store.sql` (8390) | CORE |
| [packages/store/src/store.ts:3071](../../packages/store/src/store.ts#L3071) `Store/failureAuditRoom` | `SQLite.get` (3071); `SQLite.prepare` (3071); `Store.sql` (3071) | CORE |
| [packages/store/src/store.ts:7795](../../packages/store/src/store.ts#L7795) `Store/fieldIndexCurrent` | `SQLite.iterate` (7795); `SQLite.prepare` (7795, 7800); `Store.sql` (7795, 7800); `SQLite.all` (7800) | GATED-STORE |
| [packages/store/src/store.ts:9050](../../packages/store/src/store.ts#L9050) `Store/find` | `Store.find` (9050) | GATED-STORE |
| [packages/store/src/store.ts:9422](../../packages/store/src/store.ts#L9422) `Store/findCandidates` | `Store.query` (9422) | CORE |
| [packages/store/src/store.ts:9061](../../packages/store/src/store.ts#L9061) `Store/findHere` | `Store.query` (9061, 9066, 9068, 9082, 9084, 9095); `Store.recordCount` (9079); `SQLite.get` (9080, 9084); `SQLite.prepare` (9080, 9084, 9090, 9097, 9106); `Store.sql` (9080, 9084, 9090, 9097, 9106); `SQLite.all` (9090, 9097, 9106) | GATED-STORE |
| [packages/store/src/store.ts:9101](../../packages/store/src/store.ts#L9101) `Store/findHere/[Symbol.iterator]` | `SQLite.iterate` (9101); `SQLite.prepare` (9101); `Store.sql` (9101) | GATED-STORE |
| [packages/store/src/store.ts:10908](../../packages/store/src/store.ts#L10908) `Store/findIdsCurrent` | `Store.findIds` (10908) | GATED-STORE |
| [packages/store/src/store.ts:10844](../../packages/store/src/store.ts#L10844) `Store/findIdsCurrentProgress` | `Store.findIdsProgress` (10844); `Store.query` (10846, 10847, 10860, 10862); `Store.recordCount` (10852, 10880); `SQLite.iterate` (10877); `SQLite.prepare` (10877, 10885, 10886); `Store.sql` (10877, 10885, 10886); `SQLite.get` (10889); `SQLite.all` (10895) | GATED-STORE |
| [packages/store/src/store.ts:10914](../../packages/store/src/store.ts#L10914) `Store/findIdsHere` | `Store.query` (10914, 10919, 10921); `SQLite.iterate` (10932); `SQLite.prepare` (10932); `Store.sql` (10932) | GATED-STORE |
| [packages/store/src/store.ts:9366](../../packages/store/src/store.ts#L9366) `Store/findSource` | `Store.query` (9366); `SQLite.all` (9375, 9392); `SQLite.prepare` (9375, 9383, 9391); `Store.sql` (9375, 9380, 9383, 9388, 9391, 9405, 9407); `Calculations.globalValue` (9397); `Calculations.unstoredValue` (9398); `Calculations.related` (9402) | CORE |
| [packages/store/src/store.ts:3183](../../packages/store/src/store.ts#L3183) `Store/flushDeferredSecurity` | `Store.sql` (3183) | CORE |
| [packages/store/src/store.ts:10387](../../packages/store/src/store.ts#L10387) `Store/forgetStandInValues` | `Store.sql` (10387, 10408); `SQLite.prepare` (10408) | CORE |
| [packages/store/src/store.ts:5104](../../packages/store/src/store.ts#L5104) `Store/forgetStandIns` | `SQLite.prepare` (5104); `Store.sql` (5104) | CORE |
| [packages/store/src/store.ts:7677](../../packages/store/src/store.ts#L7677) `Store/foundSetPage` | `rowsById` (7677) | CORE |
| [packages/store/src/store.ts:7693](../../packages/store/src/store.ts#L7693) `Store/foundSetRowsCurrent` | `Store.viewableIds` (7693); `Store.row` (7709) | GATED-STORE |
| [packages/store/src/store.ts:3844](../../packages/store/src/store.ts#L3844) `Store/gateAgentWrite` | `SQLite.get` (3844); `SQLite.prepare` (3844, 3846); `Store.sql` (3844, 3846) | CORE |
| [packages/store/src/store.ts:6042](../../packages/store/src/store.ts#L6042) `Store/generateRecoveryCodes` | `SQLite.prepare` (6042, 6045); `Store.sql` (6042, 6045) | CORE |
| [packages/store/src/store.ts:9494](../../packages/store/src/store.ts#L9494) `Store/getCurrent` | `Store.get` (9494); `Store.row` (9495, 9495, 9509); `SQLite.all` (9512); `SQLite.prepare` (9512); `Store.sql` (9512) | GATED-STORE |
| [packages/store/src/store.ts:9532](../../packages/store/src/store.ts#L9532) `Store/getManyCurrent` | `Store.getMany` (9532); `SQLite.get` (9550); `SQLite.prepare` (9550); `Store.sql` (9550) | GATED-STORE |
| [packages/store/src/store.ts:9543](../../packages/store/src/store.ts#L9543) `Store/getManyCurrent/[Symbol.iterator]` | `rowsById` (9543) | GATED-STORE |
| [packages/store/src/store.ts:1410](../../packages/store/src/store.ts#L1410) `Store/grantFullAccessClients` | `SQLite.prepare` (1410); `Store.sql` (1410) | CORE |
| [packages/store/src/store.ts:10949](../../packages/store/src/store.ts#L10949) `Store/groupSummariesCurrent` | `Store.groupSummaries` (10949); `Store.viewableIds` (10954); `Calculations.collect` (10970); `rowsById` (10970, 11020); `Calculations.collector` (10992) | GATED-STORE |
| [packages/store/src/store.ts:11018](../../packages/store/src/store.ts#L11018) `Store/groupSummariesCurrent/flush` | `Calculations.collector` (11018) | GATED-STORE |
| [packages/store/src/store.ts:10982](../../packages/store/src/store.ts#L10982) `Store/groupSummariesCurrent/key` | `Calculations.value` (10982); `Calculations.related` (10984) | GATED-STORE |
| [packages/store/src/store.ts:1437](../../packages/store/src/store.ts#L1437) `Store/hasOwnPassword` | `SQLite.get` (1437); `SQLite.prepare` (1437); `Store.sql` (1437) | CORE |
| [packages/store/src/store.ts:5897](../../packages/store/src/store.ts#L5897) `Store/hasPasskey` | `SQLite.get` (5897); `SQLite.prepare` (5897); `Store.sql` (5897) | CORE |
| [packages/store/src/store.ts:1418](../../packages/store/src/store.ts#L1418) `Store/hasProvingPassword` | `SQLite.get` (1418); `SQLite.prepare` (1418); `Store.sql` (1418) | CORE |
| [packages/store/src/store.ts:8964](../../packages/store/src/store.ts#L8964) `Store/hasTable` | `SQLite.get` (8964); `SQLite.prepare` (8964); `Store.sql` (8964) | CORE |
| [packages/store/src/store.ts:5756](../../packages/store/src/store.ts#L5756) `Store/hasTotp` | `SQLite.get` (5756); `SQLite.prepare` (5756); `Store.sql` (5756) | CORE |
| [packages/store/src/store.ts:5227](../../packages/store/src/store.ts#L5227) `Store/identityAllowed` | `SQLite.get` (5227, 5233, 5239); `SQLite.prepare` (5227, 5233, 5239); `Store.sql` (5227, 5233, 5239) | CORE |
| [packages/store/src/store.ts:7147](../../packages/store/src/store.ts#L7147) `Store/image` | `SQLite.get` (7147); `SQLite.prepare` (7147); `Store.sql` (7147) | CORE |
| [packages/store/src/store.ts:7157](../../packages/store/src/store.ts#L7157) `Store/images` | `SQLite.all` (7157); `SQLite.prepare` (7157); `Store.sql` (7157) | CORE |
| [packages/store/src/store.ts:4948](../../packages/store/src/store.ts#L4948) `Store/importAccounts` | `SQLite.all` (4948); `SQLite.prepare` (4948); `Store.sql` (4948) | CORE |
| [packages/store/src/store.ts:1751](../../packages/store/src/store.ts#L1751) `Store/independentWindowWrite` | `SQLite.get` (1751); `SQLite.prepare` (1751, 1759, 1819); `Store.sql` (1751, 1759, 1769, 1797, 1814, 1819, 1822); `SQLite.all` (1759); `Store.row` (1817) | CORE |
| [packages/store/src/store.ts:2230](../../packages/store/src/store.ts#L2230) `Store/nextRecordId` | `SQLite.get` (2230); `SQLite.prepare` (2230); `Store.sql` (2230) | CORE |
| [packages/store/src/store.ts:1596](../../packages/store/src/store.ts#L1596) `Store/securityChainHeadAudit` | `SQLite.get` (1596); `SQLite.prepare` (1596); `Store.sql` (1596) | CORE |
| [packages/store/src/store.ts:8976](../../packages/store/src/store.ts#L8976) `Store/indexedFields` | `SQLite.all` (8976, 8977); `SQLite.prepare` (8976, 8977); `Store.sql` (8976, 8977) | CORE |
| [packages/store/src/store.ts:11368](../../packages/store/src/store.ts#L11368) `Store/internalRoots` | `SQLite.get` (11368); `SQLite.prepare` (11368, 11370); `SQLite.all` (11370) | CORE |
| [packages/store/src/store.ts:3680](../../packages/store/src/store.ts#L3680) `Store/isAgent` | `SQLite.get` (3680); `SQLite.prepare` (3680); `Store.sql` (3680) | CORE |
| [packages/store/src/store.ts:3783](../../packages/store/src/store.ts#L3783) `Store/isExternal` | `SQLite.get` (3783); `SQLite.prepare` (3783); `Store.sql` (3783) | CORE |
| [packages/store/src/store.ts:5811](../../packages/store/src/store.ts#L5811) `Store/issueWebauthnChallenge` | `SQLite.prepare` (5811, 5813, 5814, 5816); `Store.sql` (5811, 5813, 5814, 5816); `SQLite.get` (5813) | CORE |
| [packages/store/src/store.ts:11230](../../packages/store/src/store.ts#L11230) `Store/iterateCommitted` | `SQLite.iterate` (11230) | CORE |
| [packages/store/src/store.ts:1691](../../packages/store/src/store.ts#L1691) `Store/joinTransaction` | `Store.sql` (1691, 1692, 1694, 1696, 1702, 1705) | CORE |
| [packages/store/src/store.ts:10620](../../packages/store/src/store.ts#L10620) `Store/keyStepWork` | `Store.sql` (10620, 10626, 10630, 10632) | CORE |
| [packages/store/src/store.ts:6963](../../packages/store/src/store.ts#L6963) `Store/knownSharedAccount` | `SQLite.get` (6963); `SQLite.prepare` (6963); `Store.sql` (6963) | CORE |
| [packages/store/src/store.ts:4421](../../packages/store/src/store.ts#L4421) `Store/lastSignIns` | `Store.auditLog` (4421) | CORE |
| [packages/store/src/store.ts:10438](../../packages/store/src/store.ts#L10438) `Store/latestDeleteSeq` | `SQLite.get` (10438); `SQLite.prepare` (10438); `Store.sql` (10438) | CORE |
| [packages/store/src/store.ts:7187](../../packages/store/src/store.ts#L7187) `Store/layout` | `SQLite.get` (7187); `SQLite.prepare` (7187); `Store.sql` (7187) | CORE |
| [packages/store/src/store.ts:3353](../../packages/store/src/store.ts#L3353) `Store/layoutHistory` | `SQLite.all` (3353); `SQLite.prepare` (3353); `Store.sql` (3353) | CORE |
| [packages/store/src/store.ts:7077](../../packages/store/src/store.ts#L7077) `Store/layouts` | `SQLite.all` (7077); `SQLite.prepare` (7077); `Store.sql` (7077) | CORE |
| [packages/store/src/store.ts:4721](../../packages/store/src/store.ts#L4721) `Store/leastPrivilege` | `SQLite.all` (4721); `SQLite.prepare` (4721); `Store.sql` (4721) | CORE |
| [packages/store/src/store.ts:5325](../../packages/store/src/store.ts#L5325) `Store/ledgerRow` | `SQLite.get` (5325, 5326); `SQLite.prepare` (5325, 5326); `Store.sql` (5325, 5326) | AUTH |
| [packages/store/src/store.ts:5337](../../packages/store/src/store.ts#L5337) `Store/ledgerWrite` | `Store.sql` (5337, 5338, 5340, 5342, 5345, 5345) | AUTH |
| [packages/store/src/store.ts:5031](../../packages/store/src/store.ts#L5031) `Store/limitAccountImport` | `SQLite.prepare` (5031, 5032, 5035); `Store.sql` (5031, 5032, 5035); `SQLite.get` (5032) | CORE |
| [packages/store/src/store.ts:3633](../../packages/store/src/store.ts#L3633) `Store/linkIdentity` | `SQLite.get` (3633); `SQLite.prepare` (3633); `Store.sql` (3633) | CORE |
| [packages/store/src/store.ts:3625](../../packages/store/src/store.ts#L3625) `Store/linkPrincipal` | `SQLite.get` (3625); `SQLite.prepare` (3625); `Store.sql` (3625) | CORE |
| [packages/store/src/store.ts:4307](../../packages/store/src/store.ts#L4307) `Store/markPiiField` | `SQLite.prepare` (4307); `Store.sql` (4307) | CORE |
| [packages/store/src/store.ts:8115](../../packages/store/src/store.ts#L8115) `Store/markRepeating` | `SQLite.prepare` (8115); `Store.sql` (8115) | CORE |
| [packages/store/src/store.ts:11163](../../packages/store/src/store.ts#L11163) `Store/matchIds` | `Store.matchIds` (11163); `SQLite.all` (11169); `SQLite.prepare` (11169); `Store.sql` (11169) | CORE |
| [packages/store/src/store.ts:1452](../../packages/store/src/store.ts#L1452) `Store/meta` | `SQLite.get` (1452); `SQLite.prepare` (1452); `Store.sql` (1452) | CORE |
| [packages/store/src/store.ts:1006](../../packages/store/src/store.ts#L1006) `Store/metadataVersions` | `SQLite.get` (1006); `SQLite.prepare` (1006); `Store.sql` (1006) | CORE |
| [packages/store/src/store.ts:8752](../../packages/store/src/store.ts#L8752) `Store/moveContainersIn` | `Store.sql` (8752, 8758, 8760, 8761, 8762, 8763, 8783, 8788, 8788, 8799, 8802, 8805, 8812); `SQLite.prepare` (8760, 8761, 8762, 8763, 8799, 8805); `SQLite.get` (8765, 8799, 8805) | CORE |
| [packages/store/src/store.ts:8674](../../packages/store/src/store.ts#L8674) `Store/moveContainersOut` | `Store.sql` (8674, 8682, 8684, 8686, 8691, 8692, 8712, 8718, 8720, 8722, 8722, 8728, 8728, 8733, 8735, 8737, 8737, 8743); `SQLite.get` (8682); `SQLite.prepare` (8682, 8691, 8692); `Store.container` (8694) | CORE |
| [packages/store/src/store.ts:4902](../../packages/store/src/store.ts#L4902) `Store/mustChangePassword` | `SQLite.get` (4902); `SQLite.prepare` (4902); `Store.sql` (4902) | CORE |
| [packages/store/src/store.ts:1388](../../packages/store/src/store.ts#L1388) `Store/nativeIdGuards` | `Store.sql` (1388, 1389, 1391) | CORE |
| [packages/store/src/store.ts:5631](../../packages/store/src/store.ts#L5631) `Store/objectUseSince` | `SQLite.get` (5631); `SQLite.prepare` (5631); `Store.sql` (5631) | CORE |
| [packages/store/src/store.ts:8936](../../packages/store/src/store.ts#L8936) `Store/orderBy` | `Store.valueListItems` (8936) | CORE |
| [packages/store/src/store.ts:8307](../../packages/store/src/store.ts#L8307) `Store/orphanContainerReport` | `SQLite.all` (8307); `SQLite.prepare` (8307); `Store.sql` (8307) | CORE |
| [packages/store/src/store.ts:5863](../../packages/store/src/store.ts#L5863) `Store/passkeyAllowList` | `SQLite.all` (5863); `SQLite.prepare` (5863); `Store.sql` (5863) | CORE |
| [packages/store/src/store.ts:5902](../../packages/store/src/store.ts#L5902) `Store/passkeyIds` | `SQLite.all` (5902); `SQLite.prepare` (5902); `Store.sql` (5902) | CORE |
| [packages/store/src/store.ts:5890](../../packages/store/src/store.ts#L5890) `Store/passkeys` | `SQLite.all` (5890); `SQLite.prepare` (5890); `Store.sql` (5890) | CORE |
| [packages/store/src/store.ts:4941](../../packages/store/src/store.ts#L4941) `Store/passwordDaysRemaining` | `SQLite.get` (4941); `SQLite.prepare` (4941); `Store.sql` (4941) | CORE |
| [packages/store/src/store.ts:3868](../../packages/store/src/store.ts#L3868) `Store/pendingChanges` | `SQLite.all` (3868); `SQLite.prepare` (3868); `Store.sql` (3868) | CORE |
| [packages/store/src/store.ts:1470](../../packages/store/src/store.ts#L1470) `Store/persistentData` | `SQLite.get` (1470) | CORE |
| [packages/store/src/store.ts:1479](../../packages/store/src/store.ts#L1479) `Store/persistentDataIds` | `SQLite.all` (1479) | CORE |
| [packages/store/src/store.ts:1460](../../packages/store/src/store.ts#L1460) `Store/persistentTable` | `Store.sql` (1460) | CORE |
| [packages/store/src/store.ts:10281](../../packages/store/src/store.ts#L10281) `Store/portalContainerTarget` | `Store.row` (10281); `relatedIdList` (10283) | CORE |
| [packages/store/src/store.ts:7732](../../packages/store/src/store.ts#L7732) `Store/portalCountsCurrent` | `Store.canView` (7732); `Store.row` (7759) | GATED-STORE |
| [packages/store/src/store.ts:7970](../../packages/store/src/store.ts#L7970) `Store/portalRows` | `relatedRows` (7970); `relatedIdList` (7971); `Store.viewableSet` (7974); `rowsById` (7999, 8037); `Calculations.related` (8013) | CORE |
| [packages/store/src/store.ts:7981](../../packages/store/src/store.ts#L7981) `Store/portalRows/context` | `Calculations.context` (7981) | CORE |
| [packages/store/src/store.ts:7991](../../packages/store/src/store.ts#L7991) `Store/portalRows/valueOf` | `Calculations.value` (7991) | CORE |
| [packages/store/src/store.ts:2606](../../packages/store/src/store.ts#L2606) `Store/prepared` | `SQLite.prepare` (2606); `Store.sql` (2606) | CORE |
| [packages/store/src/store.ts:5013](../../packages/store/src/store.ts#L5013) `Store/previewAccountImport` | `Store.sql` (5013, 5014, 5023) | CORE |
| [packages/store/src/store.ts:6719](../../packages/store/src/store.ts#L6719) `Store/previewRecordRuleCurrent` | `SQLite.get` (6719); `SQLite.prepare` (6719, 6722); `Store.sql` (6719, 6722); `SQLite.all` (6722); `Calculations.context` (6728, 6744) | CORE |
| [packages/store/src/store.ts:9457](../../packages/store/src/store.ts#L9457) `Store/previewRow` | `Store.row` (9457) | CORE |
| [packages/store/src/store.ts:6117](../../packages/store/src/store.ts#L6117) `Store/privilegeSets` | `Store.sql` (6117) | CORE |
| [packages/store/src/store.ts:2838](../../packages/store/src/store.ts#L2838) `Store/pruneAudit` | `Store.sql` (2838, 2840, 2842); `SQLite.get` (2840); `SQLite.prepare` (2840) | CORE |
| [packages/store/src/store.ts:8342](../../packages/store/src/store.ts#L8342) `Store/purgeOrphanContainers` | `Store.sql` (8342, 8346, 8355, 8358, 8359, 8364, 8365, 8367, 8367); `Store.orphanContainerReport` (8350); `SQLite.get` (8355); `SQLite.prepare` (8355, 8358, 8359) | CORE |
| [packages/store/src/store.ts:11488](../../packages/store/src/store.ts#L11488) `Store/query` | `SQLite.iterate` (11488) | CORE |
| [packages/store/src/store.ts:11528](../../packages/store/src/store.ts#L11528) `Store/queryWithOriginsCurrent` | `SQLite.iterate` (11528); `SQLite.all` (11537, 11540); `SQLite.prepare` (11537, 11540) | CORE |
| [packages/store/src/store.ts:11280](../../packages/store/src/store.ts#L11280) `Store/readOnlyChecked` | `SQLite.prepare` (11280, 11284, 11293, 11298); `SQLite.all` (11284, 11293, 11298) | CORE |
| [packages/store/src/store.ts:3605](../../packages/store/src/store.ts#L3605) `Store/recompute` | `SQLite.prepare` (3605, 3609); `Store.sql` (3605, 3609); `SQLite.iterate` (3609); `Calculations.computeStoredStyled` (3610); `Calculations.value` (3610) | CORE |
| [packages/store/src/store.ts:2621](../../packages/store/src/store.ts#L2621) `Store/recordAsOf` | `SQLite.get` (2621, 2623); `SQLite.prepare` (2621, 2623, 2625, 2626); `Store.sql` (2621, 2623, 2625, 2626); `SQLite.all` (2625, 2626) | CORE |
| [packages/store/src/store.ts:2317](../../packages/store/src/store.ts#L2317) `Store/recordCount` | `SQLite.get` (2317); `SQLite.prepare` (2317); `Store.sql` (2317) | CORE |
| [packages/store/src/store.ts:2698](../../packages/store/src/store.ts#L2698) `Store/recordLife` | `SQLite.all` (2698); `SQLite.prepare` (2698); `Store.sql` (2698) | CORE |
| [packages/store/src/store.ts:5562](../../packages/store/src/store.ts#L5562) `Store/recordObjectUse` | `Store.sql` (5562) | CORE |
| [packages/store/src/store.ts:9983](../../packages/store/src/store.ts#L9983) `Store/recordViewable` | `Store.row` (9983) | GATED-STORE |
| [packages/store/src/store.ts:1517](../../packages/store/src/store.ts#L1517) `Store/recordedFormat` | `Store.sql` (1517) | CORE |
| [packages/store/src/store.ts:8646](../../packages/store/src/store.ts#L8646) `Store/recoverContainersOut` | `SQLite.prepare` (8646); `Store.sql` (8646); `SQLite.get` (8649) | CORE |
| [packages/store/src/store.ts:1620](../../packages/store/src/store.ts#L1620) `Store/recoverPendingExternalFiles` | `Store.sql` (1620, 1622, 1646, 1648); `SQLite.prepare` (1622); `SQLite.get` (1633) | CORE |
| [packages/store/src/store.ts:6060](../../packages/store/src/store.ts#L6060) `Store/recoveryCodesRemaining` | `SQLite.get` (6060); `SQLite.prepare` (6060); `Store.sql` (6060) | CORE |
| [packages/store/src/store.ts:11320](../../packages/store/src/store.ts#L11320) `Store/refreshDecimalSqlViews` | `SQLite.get` (11320); `SQLite.prepare` (11320) | CORE |
| [packages/store/src/store.ts:3774](../../packages/store/src/store.ts#L3774) `Store/refuseLookalikeAccount` | `SQLite.all` (3774); `SQLite.prepare` (3774); `Store.sql` (3774) | CORE |
| [packages/store/src/store.ts:5926](../../packages/store/src/store.ts#L5926) `Store/registerPasskey` | `SQLite.prepare` (5926); `Store.sql` (5926) | CORE |
| [packages/store/src/store.ts:3903](../../packages/store/src/store.ts#L3903) `Store/rejectPending` | `SQLite.get` (3903); `SQLite.prepare` (3903, 3905); `Store.sql` (3903, 3905) | CORE |
| [packages/store/src/store.ts:9209](../../packages/store/src/store.ts#L9209) `Store/relatedCriteria` | `SQLite.iterate` (9209); `SQLite.prepare` (9209); `Store.sql` (9209) | CORE |
| [packages/store/src/store.ts:9206](../../packages/store/src/store.ts#L9206) `Store/relatedCriteria/matched` | `relatedRows` (9206) | CORE |
| [packages/store/src/store.ts:7519](../../packages/store/src/store.ts#L7519) `Store/relatedValues` | `Calculations.globalValue` (7519); `Calculations.unstoredValue` (7521) | CORE |
| [packages/store/src/store.ts:5939](../../packages/store/src/store.ts#L5939) `Store/removePasskey` | `SQLite.get` (5939); `SQLite.prepare` (5939, 5940); `Store.sql` (5939, 5940) | CORE |
| [packages/store/src/store.ts:10458](../../packages/store/src/store.ts#L10458) `Store/restoreDeletedRowLocked` | `SQLite.get` (10458, 10463); `SQLite.prepare` (10458, 10459, 10463, 10473); `Store.sql` (10458, 10459, 10463, 10473); `SQLite.all` (10459) | CORE |
| [packages/store/src/store.ts:2656](../../packages/store/src/store.ts#L2656) `Store/restoreRecord` | `Store.recordAsOf` (2656); `SQLite.get` (2660); `SQLite.prepare` (2660, 2665, 2674, 2685); `Store.sql` (2660, 2665, 2674, 2685) | CORE |
| [packages/store/src/store.ts:2714](../../packages/store/src/store.ts#L2714) `Store/revertAuditEntry` | `SQLite.get` (2714); `SQLite.prepare` (2714); `Store.sql` (2714); `Store.canViewRecord` (2716); `Store.auditLog` (2719) | CORE |
| [packages/store/src/store.ts:5687](../../packages/store/src/store.ts#L5687) `Store/revokeApiToken` | `SQLite.prepare` (5687); `Store.sql` (5687) | CORE |
| [packages/store/src/store.ts:5210](../../packages/store/src/store.ts#L5210) `Store/revokeSignInCredentials` | `SQLite.prepare` (5210, 5211, 5212); `Store.sql` (5210, 5211, 5212) | AUTH |
| [packages/store/src/store.ts:9475](../../packages/store/src/store.ts#L9475) `Store/row` | `SQLite.get` (9475) | CORE |
| [packages/store/src/store.ts:11424](../../packages/store/src/store.ts#L11424) `Store/rowsOf` | `SQLite.iterate` (11424, 11433) | CORE |
| [packages/store/src/store.ts:6524](../../packages/store/src/store.ts#L6524) `Store/ruleOutcome` | `Calculations.context` (6524) | CORE |
| [packages/store/src/store.ts:9320](../../packages/store/src/store.ts#L9320) `Store/runningSummaryValues` | `Store.viewableIds` (9320); `rowsById` (9322); `Calculations.value` (9333, 9339); `Calculations.related` (9350) | GATED-STORE |
| [packages/store/src/store.ts:6146](../../packages/store/src/store.ts#L6146) `Store/savePrivilegeSet` | `SQLite.prepare` (6146, 6154); `Store.sql` (6146, 6154) | AUTH |
| [packages/store/src/store.ts:4138](../../packages/store/src/store.ts#L4138) `Store/saveScriptTest` | `SQLite.prepare` (4138); `Store.sql` (4138) | CORE |
| [packages/store/src/store.ts:6684](../../packages/store/src/store.ts#L6684) `Store/scopedTableSql` | `Store.viewableIds` (6684); `SQLite.all` (6687); `SQLite.prepare` (6687); `Store.sql` (6687) | GATED-STORE |
| [packages/store/src/store.ts:3343](../../packages/store/src/store.ts#L3343) `Store/scriptHistory` | `SQLite.all` (3343); `SQLite.prepare` (3343); `Store.sql` (3343) | CORE |
| [packages/store/src/store.ts:3016](../../packages/store/src/store.ts#L3016) `Store/securityChange` | `Store.sql` (3016, 3018); `SQLite.prepare` (3018) | CORE |
| [packages/store/src/store.ts:2580](../../packages/store/src/store.ts#L2580) `Store/securityEvents` | `Store.auditLog` (2580) | CORE |
| [packages/store/src/store.ts:5411](../../packages/store/src/store.ts#L5411) `Store/securityToken` | `SQLite.get` (5411); `SQLite.prepare` (5411); `Store.sql` (5411) | CORE |
| [packages/store/src/store.ts:11454](../../packages/store/src/store.ts#L11454) `Store/selectHeldCurrent` | `Store.sql` (11454, 11455, 11457); `SQLite.prepare` (11455) | CORE |
| [packages/store/src/store.ts:10763](../../packages/store/src/store.ts#L10763) `Store/selectIdsCurrent` | `Store.selectIds` (10763); `SQLite.all` (10769); `SQLite.prepare` (10769); `Store.sql` (10769) | GATED-STORE |
| [packages/store/src/store.ts:11444](../../packages/store/src/store.ts#L11444) `Store/selectIn` | `Store.select` (11444) | CORE |
| [packages/store/src/store.ts:1983](../../packages/store/src/store.ts#L1983) `Store/selfContainedCopy` | `Store.sql` (1983); `SQLite.all` (1988); `SQLite.prepare` (1988, 1990, 1991, 1992) | CORE |
| [packages/store/src/store.ts:5189](../../packages/store/src/store.ts#L5189) `Store/setAccountActive` | `SQLite.prepare` (5189, 5197, 5198); `Store.sql` (5189, 5197, 5198) | AUTH |
| [packages/store/src/store.ts:5430](../../packages/store/src/store.ts#L5430) `Store/setAccountLocalOnly` | `SQLite.prepare` (5430); `Store.sql` (5430) | CORE |
| [packages/store/src/store.ts:6302](../../packages/store/src/store.ts#L6302) `Store/setAccountPrivilegeSet` | `SQLite.get` (6302); `SQLite.prepare` (6302, 6305, 6309); `Store.sql` (6302, 6305, 6309) | AUTH |
| [packages/store/src/store.ts:5439](../../packages/store/src/store.ts#L5439) `Store/setAccountRequire2fa` | `SQLite.prepare` (5439); `Store.sql` (5439) | CORE |
| [packages/store/src/store.ts:3804](../../packages/store/src/store.ts#L3804) `Store/setAgentAccount` | `SQLite.get` (3804); `SQLite.prepare` (3804, 3810); `Store.sql` (3804, 3810) | CORE |
| [packages/store/src/store.ts:4182](../../packages/store/src/store.ts#L4182) `Store/setAiAllowed` | `SQLite.prepare` (4182); `Store.sql` (4182) | CORE |
| [packages/store/src/store.ts:4265](../../packages/store/src/store.ts#L4265) `Store/setAiPolicy` | `SQLite.prepare` (4265); `Store.sql` (4265) | CORE |
| [packages/store/src/store.ts:6950](../../packages/store/src/store.ts#L6950) `Store/setAllowBlankPasswordFromLan` | `SQLite.prepare` (6950); `Store.sql` (6950) | CORE |
| [packages/store/src/store.ts:2816](../../packages/store/src/store.ts#L2816) `Store/setAuditSettings` | `SQLite.prepare` (2816); `Store.sql` (2816) | CORE |
| [packages/store/src/store.ts:8865](../../packages/store/src/store.ts#L8865) `Store/setContainer` | `Store.sql` (8865); `Store.row` (8871) | CORE |
| [packages/store/src/store.ts:3756](../../packages/store/src/store.ts#L3756) `Store/setExternalAccount` | `SQLite.get` (3756); `SQLite.prepare` (3756, 3761); `Store.sql` (3756, 3761) | CORE |
| [packages/store/src/store.ts:4888](../../packages/store/src/store.ts#L4888) `Store/setMustChangePassword` | `SQLite.prepare` (4888); `Store.sql` (4888) | CORE |
| [packages/store/src/store.ts:4079](../../packages/store/src/store.ts#L4079) `Store/setPasswordPolicy` | `SQLite.prepare` (4079); `Store.sql` (4079) | CORE |
| [packages/store/src/store.ts:1485](../../packages/store/src/store.ts#L1485) `Store/setPersistentData` | `SQLite.prepare` (1485, 1489); `Store.sql` (1485, 1489) | CORE |
| [packages/store/src/store.ts:4285](../../packages/store/src/store.ts#L4285) `Store/setPiiIsolation` | `SQLite.prepare` (4285); `Store.sql` (4285) | CORE |
| [packages/store/src/store.ts:4115](../../packages/store/src/store.ts#L4115) `Store/setRequireTotpForFullAccess` | `SQLite.prepare` (4115); `Store.sql` (4115) | CORE |
| [packages/store/src/store.ts:4197](../../packages/store/src/store.ts#L4197) `Store/setScriptNetwork` | `SQLite.prepare` (4197); `Store.sql` (4197) | CORE |
| [packages/store/src/store.ts:4254](../../packages/store/src/store.ts#L4254) `Store/setSqlRequiresFmxdbc` | `SQLite.prepare` (4254); `Store.sql` (4254) | CORE |
| [packages/store/src/store.ts:9904](../../packages/store/src/store.ts#L9904) `Store/setStoredCalcValues` | `SQLite.prepare` (9904, 9905); `Store.sql` (9904, 9905); `SQLite.get` (9909) | CORE |
| [packages/store/src/store.ts:8968](../../packages/store/src/store.ts#L8968) `Store/setUserPref` | `Store.sql` (8968, 8969, 8970); `SQLite.prepare` (8969, 8970) | CORE |
| [packages/store/src/store.ts:4238](../../packages/store/src/store.ts#L4238) `Store/setWebViewerHosts` | `SQLite.prepare` (4238); `Store.sql` (4238) | CORE |
| [packages/store/src/store.ts:5364](../../packages/store/src/store.ts#L5364) `Store/settleSignIns` | `SQLite.all` (5364, 5370); `SQLite.prepare` (5364, 5370, 5376, 5380, 5382); `Store.sql` (5364, 5370, 5376, 5380, 5382) | AUTH |
| [packages/store/src/store.ts:2114](../../packages/store/src/store.ts#L2114) `Store/shareResults` | `Store.sql` (2114) | CORE |
| [packages/store/src/store.ts:1547](../../packages/store/src/store.ts#L1547) `Store/shipWal` | `Store.sql` (1547) | CORE |
| [packages/store/src/store.ts:5311](../../packages/store/src/store.ts#L5311) `Store/signInBase` | `SQLite.get` (5311); `SQLite.prepare` (5311); `Store.sql` (5311) | AUTH |
| [packages/store/src/store.ts:5313](../../packages/store/src/store.ts#L5313) `Store/signInBase/identity` | `SQLite.get` (5313); `SQLite.prepare` (5313); `Store.sql` (5313) | AUTH |
| [packages/store/src/store.ts:5300](../../packages/store/src/store.ts#L5300) `Store/signInMark` | `SQLite.prepare` (5300); `Store.sql` (5300) | AUTH |
| [packages/store/src/store.ts:11061](../../packages/store/src/store.ts#L11061) `Store/sortIdsCurrentProgress` | `Store.sortIds` (11061); `Store.sortIdsProgress` (11061); `SQLite.all` (11074); `SQLite.prepare` (11074, 11149); `Store.sql` (11074, 11149); `Store.valueListItems` (11082); `rowsById` (11094); `Calculations.globalValue` (11097); `Calculations.unstoredValue` (11098); `Calculations.related` (11104); `SQLite.iterate` (11149) | GATED-STORE |
| [packages/store/src/store.ts:9134](../../packages/store/src/store.ts#L9134) `Store/sortedPage` | `SQLite.iterate` (9134); `SQLite.prepare` (9134, 9149); `Store.sql` (9134, 9149); `SQLite.all` (9149) | CORE |
| [packages/store/src/store.ts:11235](../../packages/store/src/store.ts#L11235) `Store/storedFileId` | `SQLite.get` (11235); `SQLite.prepare` (11235) | CORE |
| [packages/store/src/store.ts:9282](../../packages/store/src/store.ts#L9282) `Store/summaries` | `Calculations.wholeTable` (9282); `Calculations.collect` (9302, 9307) | CORE |
| [packages/store/src/store.ts:9298](../../packages/store/src/store.ts#L9298) `Store/summaries/recs` | `SQLite.iterate` (9298); `SQLite.prepare` (9298); `Store.sql` (9298) | CORE |
| [packages/store/src/store.ts:5877](../../packages/store/src/store.ts#L5877) `Store/takeWebauthnChallenge` | `SQLite.get` (5877); `SQLite.prepare` (5877, 5881); `Store.sql` (5877, 5881) | CORE |
| [packages/store/src/store.ts:9021](../../packages/store/src/store.ts#L9021) `Store/timeFind` | `Store.query` (9021) | CORE |
| [packages/store/src/store.ts:9035](../../packages/store/src/store.ts#L9035) `Store/reportFind` | `Store.query` (9035, 9037, 9038); `Store.recordCount` (9040) | CORE |
| [packages/store/src/store.ts:7456](../../packages/store/src/store.ts#L7456) `Store/toRecord` | `Calculations.value` (7456, 7466); `Calculations.globalValue` (7460); `Calculations.unstoredStyled` (7465) | CORE |
| [packages/store/src/store.ts:5761](../../packages/store/src/store.ts#L5761) `Store/totpAccounts` | `SQLite.all` (5761); `SQLite.prepare` (5761); `Store.sql` (5761) | CORE |
| [packages/store/src/store.ts:1559](../../packages/store/src/store.ts#L1559) `Store/trial` | `Store.sql` (1559) | CORE |
| [packages/store/src/store.ts:1564](../../packages/store/src/store.ts#L1564) `Store/trial/undo` | `Store.sql` (1564) | CORE |
| [packages/store/src/store.ts:11191](../../packages/store/src/store.ts#L11191) `Store/truncate/run` | `Store.sql` (11191, 11193, 11200, 11202, 11204, 11205); `SQLite.prepare` (11193, 11200); `SQLite.all` (11195) | CORE |
| [packages/store/src/store.ts:3703](../../packages/store/src/store.ts#L3703) `Store/unmigratedAccounts` | `SQLite.all` (3703); `SQLite.prepare` (3703); `Store.sql` (3703) | CORE |
| [packages/store/src/store.ts:4794](../../packages/store/src/store.ts#L4794) `Store/unusedAccess` | `SQLite.get` (4794); `SQLite.prepare` (4794, 4803); `Store.sql` (4794, 4803); `SQLite.all` (4803) | CORE |
| [packages/store/src/store.ts:4842](../../packages/store/src/store.ts#L4842) `Store/unusedObjects` | `SQLite.get` (4842); `SQLite.prepare` (4842, 4845); `Store.sql` (4842, 4845); `SQLite.all` (4845) | CORE |
| [packages/store/src/store.ts:6001](../../packages/store/src/store.ts#L6001) `Store/unusedRecoveryHashes` | `SQLite.all` (6001); `SQLite.prepare` (6001); `Store.sql` (6001) | CORE |
| [packages/store/src/store.ts:4624](../../packages/store/src/store.ts#L4624) `Store/unusualAccess` | `Store.auditLog` (4624, 4690) | CORE |
| [packages/store/src/store.ts:9725](../../packages/store/src/store.ts#L9725) `Store/update` | `Store.row` (9725); `Store.sql` (9756, 9757, 9796, 9799) | CORE |
| [packages/store/src/store.ts:9759](../../packages/store/src/store.ts#L9759) `Store/update/undo` | `Store.sql` (9759) | CORE |
| [packages/store/src/store.ts:10189](../../packages/store/src/store.ts#L10189) `Store/updatePortals` | `Store.row` (10189, 10225); `relatedRows` (10226) | CORE |
| [packages/store/src/store.ts:10199](../../packages/store/src/store.ts#L10199) `Store/updatePortals/portal/related` | `relatedIdList` (10199) | CORE |
| [packages/store/src/store.ts:10171](../../packages/store/src/store.ts#L10171) `Store/updateRelated` | `relatedRows` (10171) | CORE |
| [packages/store/src/store.ts:4880](../../packages/store/src/store.ts#L4880) `Store/usageCounting` | `SQLite.get` (4880); `SQLite.prepare` (4880); `Store.sql` (4880) | CORE |
| [packages/store/src/store.ts:8959](../../packages/store/src/store.ts#L8959) `Store/userPrefs` | `SQLite.all` (8959); `SQLite.prepare` (8959); `Store.sql` (8959) | CORE |
| [packages/store/src/store.ts:7841](../../packages/store/src/store.ts#L7841) `Store/valueListItemsCurrent` | `Store.valueListItems` (7841); `Store.get` (7855); `relatedRows` (7856); `Store.row` (7856); `SQLite.iterate` (7858); `SQLite.prepare` (7858); `Store.sql` (7858); `Calculations.related` (7868); `Calculations.value` (7872, 7873) | GATED-STORE |
| [packages/store/src/store.ts:10380](../../packages/store/src/store.ts#L10380) `Store/vaultHeld` | `SQLite.get` (10380); `SQLite.prepare` (10380); `Store.sql` (10380) | CORE |
| [packages/store/src/store.ts:5790](../../packages/store/src/store.ts#L5790) `Store/verifyTotp` | `SQLite.get` (5790); `SQLite.prepare` (5790, 5797); `Store.sql` (5790, 5797) | CORE |
| [packages/store/src/store.ts:2250](../../packages/store/src/store.ts#L2250) `Store/versionNumber` | `SQLite.get` (2250); `SQLite.prepare` (2250); `Store.sql` (2250) | CORE |
| [packages/store/src/store.ts:2125](../../packages/store/src/store.ts#L2125) `Store/versionTriggers` | `SQLite.get` (2125); `SQLite.prepare` (2125, 2130, 2131); `Store.sql` (2125, 2130, 2131, 2148, 2150, 2151, 2153); `SQLite.all` (2130, 2131) | CORE |
| [packages/store/src/store.ts:2093](../../packages/store/src/store.ts#L2093) `Store/warmSummariesCurrent` | `Calculations.wholeTable` (2093) | CORE |
| [packages/store/src/store.ts:4220](../../packages/store/src/store.ts#L4220) `Store/webViewerChecked` | `SQLite.get` (4220); `SQLite.prepare` (4220); `Store.sql` (4220) | CORE |
| [packages/store/src/store.ts:1851](../../packages/store/src/store.ts#L1851) `Store/withWriteTransaction` | `Store.sql` (1851, 1863, 1869, 1871, 1871) | CORE |
| [packages/store/src/store.ts:7391](../../packages/store/src/store.ts#L7391) `Store/wordIndex` | `Store.sql` (7391, 7399, 7404); `Store.recordCount` (7403); `SQLite.get` (7404); `SQLite.prepare` (7404) | CORE |
| [packages/store/src/store.ts:8539](../../packages/store/src/store.ts#L8539) `Store/writeExternalFile` | `Store.evaluateEach` (8539); `SQLite.prepare` (8562); `Store.sql` (8562) | CORE |
| [packages/store/src/store.ts:8563](../../packages/store/src/store.ts#L8563) `Store/writeExternalFile/taken` | `SQLite.get` (8563) | CORE |
| [packages/store/src/store.ts:5620](../../packages/store/src/store.ts#L5620) `Store/writeObjectUseRows` | `SQLite.prepare` (5620, 5621, 5626); `Store.sql` (5620, 5621, 5626) | CORE |
| [packages/store/src/store.ts:2305](../../packages/store/src/store.ts#L2305) `Store/writeToken` | `SQLite.get` (2305); `SQLite.prepare` (2305); `Store.sql` (2305) | CORE |
| [packages/store/src/store.ts:5592](../../packages/store/src/store.ts#L5592) `Store/writeUsage` | `Store.sql` (5592, 5593, 5595, 5599, 5601) | CORE |
| [packages/store/src/store.ts:5608](../../packages/store/src/store.ts#L5608) `Store/writeUsageRows` | `SQLite.prepare` (5608, 5609, 5615); `Store.sql` (5608, 5609, 5615) | CORE |
| [packages/store/src/store.ts:7112](../../packages/store/src/store.ts#L7112) `Store/design` | `SQLite.get` (7112) | CORE |
| [packages/store/src/store.ts:7134](../../packages/store/src/store.ts#L7134) `Store/themes` | `SQLite.get` (7134) | CORE |
| [packages/store/src/store.ts:5961](../../packages/store/src/store.ts#L5961) `Store/verifyPasskeyCredential` | `SQLite.get` (5961); `SQLite.prepare` (5961, 5973); `Store.sql` (5961, 5973) | CORE |
| [packages/store/src/store.ts:6921](../../packages/store/src/store.ts#L6921) `Store/passwordState` | `SQLite.get` (6921); `SQLite.prepare` (6921); `Store.sql` (6921) | CORE |
| [packages/store/src/store.ts:10324](../../packages/store/src/store.ts#L10324) `Store/deleteVisibility` | `Store.canViewRecord` (10324) | CORE |
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
| [packages/store/src/cross-file.ts:58](../../packages/store/src/cross-file.ts#L58) `CrossFileProofs/read` | `SQLite.get` (58); `SQLite.prepare` (58) | AUTH |
| [packages/store/src/cross-file.ts:115](../../packages/store/src/cross-file.ts#L115) `CrossFileProofs/save` | `SQLite.prepare` (115) | AUTH |
| [packages/store/src/store.ts:3962](../../packages/store/src/store.ts#L3962) `Store/setPasswordOnly` | `SQLite.get` (3962); `SQLite.prepare` (3962, 3968, 3977, 3984, 3985, 3986); `Store.sql` (3962, 3968, 3977, 3984, 3985, 3986) | AUTH |
| [packages/store/src/store.ts:4009](../../packages/store/src/store.ts#L4009) `Store/createAccountOnly` | `SQLite.get` (4009); `SQLite.prepare` (4009, 4013, 4019, 4024, 4029); `Store.sql` (4009, 4013, 4019, 4024, 4029) | CORE |
| [packages/store/src/store.ts:7003](../../packages/store/src/store.ts#L7003) `Store/crossFileBusy` | `Store.sql` (7003) | AUTH |
| [packages/store/src/store.ts:6975](../../packages/store/src/store.ts#L6975) `Store/crossFileHash` | `SQLite.get` (6975); `SQLite.prepare` (6975); `Store.sql` (6975) | AUTH |
<!-- end generated read-gate inventory -->
