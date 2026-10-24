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
| `packages/store/src/store.ts` / `Store/constructor` | CORE | The new Store.sql references register deterministic sort-key and first-repetition SQL functions. They do not read or return solution rows; opening the raw store remains an operator/internal capability. |
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
| [packages/cli/src/diagnostics.ts:204](../../packages/cli/src/diagnostics.ts#L204) `designCopy` | `SQLite.all` (204); `SQLite.prepare` (204, 207) | OPERATOR |
| [packages/cli/src/diagnostics.ts:443](../../packages/cli/src/diagnostics.ts#L443) `diagnostics` | `SQLite.get` (443); `SQLite.prepare` (443, 447); `SQLite.all` (447) | OPERATOR |
| [packages/cli/src/doctor.ts:139](../../packages/cli/src/doctor.ts#L139) `accountChecks` | `SQLite.all` (139); `SQLite.prepare` (139) | OPERATOR |
| [packages/cli/src/main.ts:711](../../packages/cli/src/main.ts#L711) `accountsWithPasswordOff` | `SQLite.all` (711); `SQLite.prepare` (711) | OPERATOR |
| [packages/cli/src/main.ts:740](../../packages/cli/src/main.ts#L740) `hostedRead` | `SQLite.all` (740, 743); `SQLite.prepare` (740, 743); `Store.sql` (740, 743) | OPERATOR |
| [packages/cli/src/main.ts:2399](../../packages/cli/src/main.ts#L2399) `main` | `Store.orphanContainerReport` (2399); `Store.auditLog` (2872); `SQLite.get` (3131); `SQLite.prepare` (3131) | OPERATOR |
| [packages/scripts/src/data-api-step.ts:104](../../packages/scripts/src/data-api-step.ts#L104) `respond` | `Store.get` (104, 131, 140); `Store.find` (105, 117) | SCRIPT |
| [packages/scripts/src/engine.ts:7964](../../packages/scripts/src/engine.ts#L7964) `ScriptEngine/containerFile` | `Store.get` (7964); `Store.containerId` (7965); `Store.container` (7966) | SCRIPT |
| [packages/scripts/src/engine.ts:5582](../../packages/scripts/src/engine.ts#L5582) `ScriptEngine/design` | `Store.valueListItems` (5582) | SCRIPT |
| [packages/scripts/src/engine.ts:6320](../../packages/scripts/src/engine.ts#L6320) `ScriptEngine/exportField` | `Store.get` (6320); `Store.containerId` (6321); `Store.container` (6323) | SCRIPT |
| [packages/scripts/src/engine.ts:8361](../../packages/scripts/src/engine.ts#L8361) `ScriptEngine/fileMakerRows` | `Store.findIds` (8361); `Store.get` (8366) | SCRIPT |
| [packages/scripts/src/engine.ts:8731](../../packages/scripts/src/engine.ts#L8731) `ScriptEngine/findRelated` | `Store.findIds` (8731, 8741, 8744) | SCRIPT |
| [packages/scripts/src/engine.ts:2297](../../packages/scripts/src/engine.ts#L2297) `ScriptEngine/foundSet` | `Store.findIds` (2297) | SCRIPT |
| [packages/scripts/src/engine.ts:5422](../../packages/scripts/src/engine.ts#L5422) `ScriptEngine/get` | `Store.findIds` (5422); `Store.canViewRecord` (5515); `Store.get` (5551) | SCRIPT |
| [packages/scripts/src/engine.ts:1953](../../packages/scripts/src/engine.ts#L1953) `ScriptEngine/goToLayout` | `Store.findIds` (1953) | SCRIPT |
| [packages/scripts/src/engine.ts:6891](../../packages/scripts/src/engine.ts#L6891) `ScriptEngine/goToList` | `Store.findIds` (6891) | SCRIPT |
| [packages/scripts/src/engine.ts:8130](../../packages/scripts/src/engine.ts#L8130) `ScriptEngine/importRecords` | `Store.findIds` (8130); `Store.get` (8150) | SCRIPT |
| [packages/scripts/src/engine.ts:5694](../../packages/scripts/src/engine.ts#L5694) `ScriptEngine/lookupNext` | `Store.get` (5694); `Store.row` (5695); `Calculations.context` (5697) | SCRIPT |
| [packages/scripts/src/engine.ts:5260](../../packages/scripts/src/engine.ts#L5260) `ScriptEngine/newCalcContext/executeSQL` | `Calculations.executeSQL` (5260) | SCRIPT |
| [packages/scripts/src/engine.ts:5268](../../packages/scripts/src/engine.ts#L5268) `ScriptEngine/newCalcContext/persistentData` | `Store.persistentData` (5268) | SCRIPT |
| [packages/scripts/src/engine.ts:5269](../../packages/scripts/src/engine.ts#L5269) `ScriptEngine/newCalcContext/persistentDataIds` | `Store.persistentDataIds` (5269) | SCRIPT |
| [packages/scripts/src/engine.ts:8401](../../packages/scripts/src/engine.ts#L8401) `ScriptEngine/newRecord` | `Store.findIds` (8401) | SCRIPT |
| [packages/scripts/src/engine.ts:8706](../../packages/scripts/src/engine.ts#L8706) `ScriptEngine/performFind` | `Store.findIds` (8706) | SCRIPT |
| [packages/scripts/src/engine.ts:8763](../../packages/scripts/src/engine.ts#L8763) `ScriptEngine/quickFind` | `Store.findIds` (8763, 8764, 8767) | SCRIPT |
| [packages/scripts/src/engine.ts:5636](../../packages/scripts/src/engine.ts#L5636) `ScriptEngine/record` | `Store.get` (5636) | SCRIPT |
| [packages/scripts/src/engine.ts:5797](../../packages/scripts/src/engine.ts#L5797) `ScriptEngine/relatedIds` | `Store.findIds` (5797); `rowsById` (5805); `Store.select` (5809); `Store.matchIds` (5823); `Store.viewableIds` (5846) | SCRIPT |
| [packages/scripts/src/engine.ts:5831](../../packages/scripts/src/engine.ts#L5831) `ScriptEngine/relatedIds/matching` | `Store.matchIds` (5831) | SCRIPT |
| [packages/scripts/src/engine.ts:6471](../../packages/scripts/src/engine.ts#L6471) `ScriptEngine/relookup` | `Store.get` (6471) | SCRIPT |
| [packages/scripts/src/engine.ts:3431](../../packages/scripts/src/engine.ts#L3431) `ScriptEngine/revertTransaction` | `Store.findIds` (3431) | SCRIPT |
| [packages/scripts/src/engine.ts:2362](../../packages/scripts/src/engine.ts#L2362) `ScriptEngine/semanticFind` | `Store.findIds` (2362, 2383) | SCRIPT |
| [packages/scripts/src/engine.ts:3334](../../packages/scripts/src/engine.ts#L3334) `ScriptEngine/sortIds` | `Store.sortIds` (3334); `Store.valueListItems` (3340) | SCRIPT |
| [packages/scripts/src/engine.ts:7220](../../packages/scripts/src/engine.ts#L7220) `ScriptEngine/sourceValue` | `Store.get` (7220); `Store.containerId` (7221); `Store.container` (7222) | SCRIPT |
| [packages/scripts/src/engine.ts:3277](../../packages/scripts/src/engine.ts#L3277) `ScriptEngine/sqlByNaturalLanguage` | `Calculations.translateSQL` (3277); `Calculations.executeSQL` (3284) | SCRIPT |
| [packages/scripts/src/engine.ts:3991](../../packages/scripts/src/engine.ts#L3991) `ScriptEngine/step` | `Store.fieldIndex` (3991); `Store.findIds` (4125, 4224) | SCRIPT |
| [packages/scripts/src/engine.ts:5669](../../packages/scripts/src/engine.ts#L5669) `ScriptEngine/valueOf` | `Store.findIds` (5669, 5669); `Store.containerId` (5677) | SCRIPT |
| [packages/scripts/src/engine.ts:9153](../../packages/scripts/src/engine.ts#L9153) `clearRecords` | `SQLite.all` (9153); `SQLite.prepare` (9153) | SCRIPT |
| [packages/scripts/src/recorder.ts:83](../../packages/scripts/src/recorder.ts#L83) `lastSeq` | `Store.auditLog` (83) | DESIGN |
| [packages/scripts/src/recorder.ts:121](../../packages/scripts/src/recorder.ts#L121) `recordRun` | `Store.auditLog` (121) | DESIGN |
| [packages/scripts/src/script-tests.ts:213](../../packages/scripts/src/script-tests.ts#L213) `runCase` | `Store.findIds` (213); `Store.auditLog` (220, 221, 265); `Store.evaluateEach` (248) | DESIGN |
| [packages/scripts/src/testrun.ts:306](../../packages/scripts/src/testrun.ts#L306) `recordWith` | `Store.evaluateEach` (306) | DESIGN |
| [packages/scripts/src/testrun.ts:199](../../packages/scripts/src/testrun.ts#L199) `seedSelections` | `Calculations.globalValue` (199); `Store.find` (204) | DESIGN |
| [packages/scripts/src/testrun.ts:338](../../packages/scripts/src/testrun.ts#L338) `testRun` | `Store.evaluateEach` (338) | DESIGN |
| [packages/scripts/src/testrun.ts:270](../../packages/scripts/src/testrun.ts#L270) `testScript` | `Store.findIds` (270) | DESIGN |
| [packages/server/src/admin.ts:2274](../../packages/server/src/admin.ts#L2274) `Admin/audit` | `Store.auditLog` (2274) | ADMIN |
| [packages/server/src/admin.ts:1041](../../packages/server/src/admin.ts#L1041) `Admin/handle` | `Store.externalContainerReport` (1041); `Store.orphanContainerReport` (1046, 1050) | ADMIN |
| [packages/server/src/admin.ts:2706](../../packages/server/src/admin.ts#L2706) `Admin/status` | `Store.externalContainerCount` (2706) | ADMIN |
| [packages/server/src/admin.ts:2357](../../packages/server/src/admin.ts#L2357) `Admin/viewAs` | `Store.find` (2357) | ADMIN |
| [packages/server/src/agent.ts:316](../../packages/server/src/agent.ts#L316) `dryRunPlan` | `Store.findIds` (316) | DESIGN |
| [packages/server/src/agent.ts:339](../../packages/server/src/agent.ts#L339) `runApprovedStep` | `Store.findIds` (339) | DESIGN |
| [packages/server/src/agent.ts:162](../../packages/server/src/agent.ts#L162) `runStep` | `Store.findIds` (162); `Store.auditLog` (230); `Store.canViewRecord` (242) | DESIGN |
| [packages/server/src/agent.ts:154](../../packages/server/src/agent.ts#L154) `runStep/visible` | `Store.findIds` (154) | DESIGN |
| [packages/server/src/ai-output.ts:147](../../packages/server/src/ai-output.ts#L147) `storedSecretValues` | `Calculations.globalValue` (147); `Store.select` (152) | REDACTION |
| [packages/server/src/ai-policy-sql.ts:49](../../packages/server/src/ai-policy-sql.ts#L49) `sqlFieldRefs` | `SQLite.all` (49, 51); `SQLite.prepare` (49, 51) | POLICY |
| [packages/server/src/ai-policy.ts:338](../../packages/server/src/ai-policy.ts#L338) `sql` | `Store.inspectQuery` (338) | POLICY |
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
| [packages/server/src/backup.ts:1004](../../packages/server/src/backup.ts#L1004) `accountDifferences/read` | `SQLite.all` (1004, 1006); `SQLite.prepare` (1004, 1006) | OPERATOR |
| [packages/server/src/backup.ts:270](../../packages/server/src/backup.ts#L270) `backupOnceHeld` | `SQLite.get` (270); `SQLite.prepare` (270) | OPERATOR |
| [packages/server/src/backup.ts:1077](../../packages/server/src/backup.ts#L1077) `columnInfo` | `SQLite.all` (1077); `SQLite.prepare` (1077) | OPERATOR |
| [packages/server/src/backup.ts:1061](../../packages/server/src/backup.ts#L1061) `credentialsReadable` | `SQLite.all` (1061); `SQLite.prepare` (1061) | OPERATOR |
| [packages/server/src/backup.ts:1031](../../packages/server/src/backup.ts#L1031) `readNames` | `SQLite.all` (1031); `SQLite.prepare` (1031) | OPERATOR |
| [packages/server/src/backup.ts:1112](../../packages/server/src/backup.ts#L1112) `reconcileCredentials` | `SQLite.all` (1112, 1134, 1149, 1159, 1165); `SQLite.prepare` (1112, 1120, 1134, 1136, 1149, 1150, 1157, 1159, 1160, 1165, 1166, 1170, 1171, 1172); `SQLite.get` (1120, 1170) | OPERATOR |
| [packages/server/src/backup.ts:1139](../../packages/server/src/backup.ts#L1139) `reconcileCredentials/accountColumns` | `SQLite.all` (1139); `SQLite.prepare` (1139) | OPERATOR |
| [packages/server/src/backup.ts:1115](../../packages/server/src/backup.ts#L1115) `reconcileCredentials/has` | `SQLite.all` (1115); `SQLite.prepare` (1115) | OPERATOR |
| [packages/server/src/backup.ts:1284](../../packages/server/src/backup.ts#L1284) `stageRestorePoint` | `SQLite.get` (1284, 1286, 1287); `SQLite.prepare` (1284, 1286, 1287) | OPERATOR |
| [packages/server/src/calendar.ts:389](../../packages/server/src/calendar.ts#L389) `CalendarFeeds/feed` | `Store.find` (389) | CALENDAR |
| [packages/server/src/changes.ts:195](../../packages/server/src/changes.ts#L195) `ChangeFeed/visible` | `Store.canViewRecord` (195) | CHANGE |
| [packages/server/src/cleanup.ts:1045](../../packages/server/src/cleanup.ts#L1045) `CleanupJournal/add` | `SQLite.prepare` (1045); `Store.sql` (1045) | CLEANUP |
| [packages/server/src/cleanup.ts:1040](../../packages/server/src/cleanup.ts#L1040) `CleanupJournal/append` | `SQLite.prepare` (1040); `Store.sql` (1040) | CLEANUP |
| [packages/server/src/cleanup.ts:1031](../../packages/server/src/cleanup.ts#L1031) `CleanupJournal/constructor` | `Store.sql` (1031) | CLEANUP |
| [packages/server/src/cleanup.ts:1051](../../packages/server/src/cleanup.ts#L1051) `CleanupJournal/get` | `SQLite.get` (1051); `SQLite.prepare` (1051); `Store.sql` (1051) | CLEANUP |
| [packages/server/src/cleanup.ts:1056](../../packages/server/src/cleanup.ts#L1056) `CleanupJournal/list` | `SQLite.all` (1056); `SQLite.prepare` (1056); `Store.sql` (1056) | CLEANUP |
| [packages/server/src/cleanup.ts:1060](../../packages/server/src/cleanup.ts#L1060) `CleanupJournal/markUndone` | `SQLite.prepare` (1060); `Store.sql` (1060) | CLEANUP |
| [packages/server/src/cleanup.ts:741](../../packages/server/src/cleanup.ts#L741) `applyCleanup/apply` | `Store.findIds` (741, 751); `SQLite.all` (742); `SQLite.prepare` (742, 779); `Store.sql` (742, 779); `SQLite.get` (779) | CLEANUP |
| [packages/server/src/cleanup.ts:523](../../packages/server/src/cleanup.ts#L523) `findDuplicates` | `Store.findIds` (523) | CLEANUP |
| [packages/server/src/cleanup.ts:879](../../packages/server/src/cleanup.ts#L879) `journalDeletes` | `SQLite.get` (879); `SQLite.prepare` (879); `Store.sql` (879) | CLEANUP |
| [packages/server/src/cleanup.ts:617](../../packages/server/src/cleanup.ts#L617) `keyValue` | `SQLite.get` (617); `SQLite.prepare` (617); `Store.sql` (617) | CLEANUP |
| [packages/server/src/cleanup.ts:621](../../packages/server/src/cleanup.ts#L621) `relatedIds` | `SQLite.all` (621); `SQLite.prepare` (621); `Store.sql` (621) | CLEANUP |
| [packages/server/src/cleanup.ts:327](../../packages/server/src/cleanup.ts#L327) `scanData` | `Store.findIds` (327); `Store.select` (333) | CLEANUP |
| [packages/server/src/cleanup.ts:810](../../packages/server/src/cleanup.ts#L810) `snapshotField` | `SQLite.all` (810); `SQLite.prepare` (810); `Store.sql` (810) | CLEANUP |
| [packages/server/src/cleanup.ts:870](../../packages/server/src/cleanup.ts#L870) `snapshotRows` | `SQLite.all` (870); `SQLite.prepare` (870); `Store.sql` (870) | CLEANUP |
| [packages/server/src/cleanup.ts:991](../../packages/server/src/cleanup.ts#L991) `undoCleanup` | `SQLite.get` (991, 1007); `SQLite.prepare` (991, 1007); `Store.sql` (991, 1007) | CLEANUP |
| [packages/server/src/cleanup.ts:929](../../packages/server/src/cleanup.ts#L929) `updateMany` | `Store.findIds` (929) | CLEANUP |
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
| [packages/server/src/dataapi.ts:1960](../../packages/server/src/dataapi.ts#L1960) `DataApi/route` | `Store.get` (1960, 2182, 2183, 2206, 2214, 2261, 2285, 2305, 2342); `Store.valueListItems` (1975); `Store.find` (2137, 2185, 2375); `Store.findIds` (2141, 2380); `Store.query` (2380) | REST |
| [packages/server/src/dataapi.ts:2089](../../packages/server/src/dataapi.ts#L2089) `DataApi/route/recordOut` | `Store.portalCounts` (2089) | REST |
| [packages/server/src/dataapi.ts:2125](../../packages/server/src/dataapi.ts#L2125) `DataApi/route/shownAs` | `Store.get` (2125) | REST |
| [packages/server/src/debug.ts:344](../../packages/server/src/debug.ts#L344) `DebugApi/handle` | `Store.row` (344, 473); `Store.get` (353, 478); `Store.evaluate` (377) | DESIGN |
| [packages/server/src/debug.ts:193](../../packages/server/src/debug.ts#L193) `learnStoredCredentials` | `Calculations.globalValue` (193); `Store.sql` (199, 209, 209); `SQLite.iterate` (209, 209); `SQLite.prepare` (209, 209); `Store.iterateCommitted` (209) | DESIGN |
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
| [packages/server/src/import-mapping.ts:1004](../../packages/server/src/import-mapping.ts#L1004) `applyImportAddStream` | `SQLite.prepare` (1004); `Store.sql` (1004) | IMPORT |
| [packages/server/src/import-mapping.ts:780](../../packages/server/src/import-mapping.ts#L780) `applyImportRun` | `SQLite.prepare` (780); `Store.sql` (780) | IMPORT |
| [packages/server/src/import-mapping.ts:500](../../packages/server/src/import-mapping.ts#L500) `existingKeys` | `Store.viewableIds` (500); `Store.query` (502) | IMPORT |
| [packages/server/src/import-mapping.ts:824](../../packages/server/src/import-mapping.ts#L824) `fileIdentity` | `Store.sql` (824, 825, 826); `SQLite.prepare` (825, 826); `SQLite.get` (826) | IMPORT |
| [packages/server/src/import-mapping.ts:883](../../packages/server/src/import-mapping.ts#L883) `importHistory` | `SQLite.all` (883); `SQLite.prepare` (883); `Store.sql` (883) | IMPORT |
| [packages/server/src/import-mapping.ts:812](../../packages/server/src/import-mapping.ts#L812) `journal` | `Store.sql` (812, 815, 816, 817, 818, 819); `SQLite.all` (815); `SQLite.prepare` (815) | IMPORT |
| [packages/server/src/import-mapping.ts:800](../../packages/server/src/import-mapping.ts#L800) `targetKeys` | `SQLite.all` (800); `SQLite.prepare` (800); `Store.sql` (800) | IMPORT |
| [packages/server/src/import-mapping.ts:890](../../packages/server/src/import-mapping.ts#L890) `undoImportRun` | `SQLite.get` (890, 922); `SQLite.prepare` (890, 922, 936); `Store.sql` (890, 922, 936) | IMPORT |
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
| [packages/server/src/mcp.ts:1358](../../packages/server/src/mcp.ts#L1358) `createMcpServer/check_record` | `Store.get` (1358); `Store.row` (1360) | MCP |
| [packages/server/src/mcp.ts:1079](../../packages/server/src/mcp.ts#L1079) `createMcpServer/evaluate_calculation` | `Store.get` (1079, 1087); `Store.find` (1080); `Store.evaluate` (1081); `Store.row` (1086) | SQL |
| [packages/server/src/mcp.ts:1382](../../packages/server/src/mcp.ts#L1382) `createMcpServer/explain_related` | `Store.get` (1382) | MCP |
| [packages/server/src/mcp.ts:1335](../../packages/server/src/mcp.ts#L1335) `createMcpServer/explain_value` | `Store.get` (1335); `Store.row` (1336) | MCP |
| [packages/server/src/mcp.ts:959](../../packages/server/src/mcp.ts#L959) `createMcpServer/find_records` | `Store.find` (959) | MCP |
| [packages/server/src/mcp.ts:1154](../../packages/server/src/mcp.ts#L1154) `createMcpServer/get_container` | `Store.container` (1154) | SQL |
| [packages/server/src/mcp.ts:972](../../packages/server/src/mcp.ts#L972) `createMcpServer/get_record` | `Store.get` (972) | MCP |
| [packages/server/src/mcp.ts:1178](../../packages/server/src/mcp.ts#L1178) `createMcpServer/sql_query` | `Store.queryWithOrigins` (1178) | SQL |
| [packages/server/src/mcp.ts:1022](../../packages/server/src/mcp.ts#L1022) `createMcpServer/update_record` | `Store.get` (1022, 1026) | MCP |
| [packages/server/src/mcp.ts:2279](../../packages/server/src/mcp.ts#L2279) `registerResources/audit` | `Store.auditLog` (2279) | MCP |
| [packages/server/src/oauth.ts:878](../../packages/server/src/oauth.ts#L878) `OAuthServer/accessAllowed` | `SQLite.get` (878); `SQLite.prepare` (878) | AUTH |
| [packages/server/src/oauth.ts:504](../../packages/server/src/oauth.ts#L504) `OAuthServer/authorize` | `SQLite.get` (504); `SQLite.prepare` (504, 508, 510, 517, 540, 541) | AUTH |
| [packages/server/src/oauth.ts:485](../../packages/server/src/oauth.ts#L485) `OAuthServer/authorize/done` | `SQLite.prepare` (485, 486) | AUTH |
| [packages/server/src/oauth.ts:384](../../packages/server/src/oauth.ts#L384) `OAuthServer/client` | `SQLite.get` (384); `SQLite.prepare` (384) | AUTH |
| [packages/server/src/oauth.ts:191](../../packages/server/src/oauth.ts#L191) `OAuthServer/constructor` | `SQLite.all` (191); `SQLite.prepare` (191, 218, 220, 229, 230, 233); `SQLite.iterate` (218); `SQLite.get` (220); `Store.sql` (220, 229) | AUTH |
| [packages/server/src/oauth.ts:184](../../packages/server/src/oauth.ts#L184) `OAuthServer/constructor/cols` | `SQLite.all` (184); `SQLite.prepare` (184) | AUTH |
| [packages/server/src/oauth.ts:861](../../packages/server/src/oauth.ts#L861) `OAuthServer/endGrant` | `SQLite.prepare` (861, 862); `SQLite.all` (862) | AUTH |
| [packages/server/src/oauth.ts:817](../../packages/server/src/oauth.ts#L817) `OAuthServer/issue/write` | `SQLite.get` (817); `SQLite.prepare` (817, 818, 819) | AUTH |
| [packages/server/src/oauth.ts:874](../../packages/server/src/oauth.ts#L874) `OAuthServer/managedAccess` | `SQLite.get` (874); `SQLite.prepare` (874) | AUTH |
| [packages/server/src/oauth.ts:364](../../packages/server/src/oauth.ts#L364) `OAuthServer/register` | `SQLite.prepare` (364, 365, 366, 367, 368); `SQLite.get` (365, 367) | AUTH |
| [packages/server/src/oauth.ts:891](../../packages/server/src/oauth.ts#L891) `OAuthServer/revoke` | `SQLite.get` (891, 892, 902, 903); `SQLite.prepare` (891, 892, 895, 902, 903, 907) | AUTH |
| [packages/server/src/oauth.ts:837](../../packages/server/src/oauth.ts#L837) `OAuthServer/sweep` | `SQLite.all` (837); `SQLite.prepare` (837, 839, 840, 841, 842) | AUTH |
| [packages/server/src/oauth.ts:696](../../packages/server/src/oauth.ts#L696) `OAuthServer/token` | `SQLite.get` (696, 727, 729, 732, 745); `SQLite.prepare` (696, 727, 729, 732, 741, 744, 745, 745, 747, 749) | AUTH |
| [packages/server/src/oauth.ts:83](../../packages/server/src/oauth.ts#L83) `legacyPasswordMark` | `SQLite.get` (83); `SQLite.prepare` (83); `Store.sql` (83) | AUTH |
| [packages/server/src/oauth.ts:72](../../packages/server/src/oauth.ts#L72) `storedName` | `SQLite.get` (72); `SQLite.prepare` (72); `Store.sql` (72) | AUTH |
| [packages/server/src/odata-crossjoin-worker.ts:40](../../packages/server/src/odata-crossjoin-worker.ts#L40) `join` | `SQLite.prepare` (40, 49, 58, 73); `SQLite.get` (58); `SQLite.all` (73) | JOIN |
| [packages/server/src/odata.ts:1338](../../packages/server/src/odata.ts#L1338) `ODataEndpoint/applied` | `Store.selectIds` (1338); `SQLite.prepare` (1353, 1390, 1403, 1407); `Store.getMany` (1364); `SQLite.all` (1403); `SQLite.get` (1407) | ODATA |
| [packages/server/src/odata.ts:1457](../../packages/server/src/odata.ts#L1457) `ODataEndpoint/crossjoined` | `Store.selectIds` (1457); `Store.getMany` (1486, 1521) | ODATA |
| [packages/server/src/odata.ts:1557](../../packages/server/src/odata.ts#L1557) `ODataEndpoint/entity` | `Store.getMany` (1557) | ODATA |
| [packages/server/src/odata.ts:1217](../../packages/server/src/odata.ts#L1217) `ODataEndpoint/lambdaFor` | `Store.selectIds` (1217); `Store.row` (1226); `relatedIdList` (1227) | ODATA |
| [packages/server/src/odata.ts:1280](../../packages/server/src/odata.ts#L1280) `ODataEndpoint/list` | `Store.selectIds` (1280); `Store.getMany` (1285); `Store.computeValues` (1286); `Store.countIds` (1291) | ODATA |
| [packages/server/src/odata.ts:1648](../../packages/server/src/odata.ts#L1648) `ODataEndpoint/property` | `Store.containerId` (1648); `Store.container` (1654) | ODATA |
| [packages/server/src/odata.ts:1598](../../packages/server/src/odata.ts#L1598) `ODataEndpoint/relatedIds` | `Store.row` (1598); `relatedIdList` (1601, 1616); `Store.selectIds` (1605); `Store.viewableIds` (1615) | ODATA |
| [packages/server/src/odata.ts:1624](../../packages/server/src/odata.ts#L1624) `ODataEndpoint/relatedRecords` | `Store.getMany` (1624) | ODATA |
| [packages/server/src/odata.ts:931](../../packages/server/src/odata.ts#L931) `ODataEndpoint/resource` | `Store.countIds` (931); `Store.get` (971, 978, 1085) | ODATA |
| [packages/server/src/oidc.ts:393](../../packages/server/src/oidc.ts#L393) `Oidc/authorizeUrl` | `SQLite.prepare` (393, 394, 397); `SQLite.get` (394) | AUTH |
| [packages/server/src/oidc.ts:445](../../packages/server/src/oidc.ts#L445) `Oidc/callback` | `SQLite.all` (445); `SQLite.prepare` (445, 449) | AUTH |
| [packages/server/src/oidc.ts:189](../../packages/server/src/oidc.ts#L189) `Oidc/constructor` | `SQLite.all` (189, 197); `SQLite.prepare` (189, 197, 207, 208, 213, 213) | AUTH |
| [packages/server/src/oidc.ts:547](../../packages/server/src/oidc.ts#L547) `Oidc/finish` | `SQLite.prepare` (547, 548, 550); `SQLite.get` (548) | AUTH |
| [packages/server/src/oidc.ts:342](../../packages/server/src/oidc.ts#L342) `Oidc/takeGrant` | `SQLite.all` (342); `SQLite.prepare` (342) | AUTH |
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
| [packages/server/src/pgwire.ts:837](../../packages/server/src/pgwire.ts#L837) `Connection/bareNames` | `Store.describe` (837) | SQL |
| [packages/server/src/pgwire.ts:853](../../packages/server/src/pgwire.ts#L853) `Connection/catalog` | `Store.describeTyped` (853) | SQL |
| [packages/server/src/pgwire.ts:1225](../../packages/server/src/pgwire.ts#L1225) `Connection/describe` | `Store.describeTyped` (1225) | SQL |
| [packages/server/src/pgwire.ts:864](../../packages/server/src/pgwire.ts#L864) `Connection/run` | `Store.selectIn` (864); `Store.describeTyped` (868) | SQL |
| [packages/server/src/pgwire.ts:814](../../packages/server/src/pgwire.ts#L814) `Connection/translate` | `Calculations.translateSQL` (814) | SQL |
| [packages/server/src/pgwire.ts:992](../../packages/server/src/pgwire.ts#L992) `Connection/validateSyntax` | `SQLite.prepare` (992); `Store.sql` (992) | SQL |
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
| [packages/server/src/record-history.ts:99](../../packages/server/src/record-history.ts#L99) `recordHistory` | `Store.auditLog` (99, 152) | HISTORY |
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
| [packages/server/src/webclient.ts:1664](../../packages/server/src/webclient.ts#L1664) `WebClient/aiReplace` | `Store.canView` (1664); `Store.getMany` (1680) | WEB |
| [packages/server/src/webclient.ts:1848](../../packages/server/src/webclient.ts#L1848) `WebClient/button` | `Store.findIds` (1848, 1898); `Store.evaluateEach` (1857, 1858) | WEB |
| [packages/server/src/webclient.ts:1250](../../packages/server/src/webclient.ts#L1250) `WebClient/charts` | `Calculations.context` (1250); `Store.canView` (1278); `Store.evaluateEach` (1287, 1291); `Store.evaluateRows` (1296, 1298) | WEB |
| [packages/server/src/webclient.ts:1241](../../packages/server/src/webclient.ts#L1241) `WebClient/charts/foundSet` | `Store.findIds` (1241) | WEB |
| [packages/server/src/webclient.ts:1281](../../packages/server/src/webclient.ts#L1281) `WebClient/charts/get` | `Store.get` (1281) | WEB |
| [packages/server/src/webclient.ts:667](../../packages/server/src/webclient.ts#L667) `WebClient/explain` | `Store.get` (667); `Store.row` (700, 713) | WEB |
| [packages/server/src/webclient.ts:1470](../../packages/server/src/webclient.ts#L1470) `WebClient/exportRecords` | `Store.getMany` (1470) | WEB |
| [packages/server/src/webclient.ts:1157](../../packages/server/src/webclient.ts#L1157) `WebClient/foundIds` | `Store.findIds` (1157) | WEB |
| [packages/server/src/webclient.ts:1201](../../packages/server/src/webclient.ts#L1201) `WebClient/foundSetPortal` | `Store.foundSetRows` (1201, 1208) | WEB |
| [packages/server/src/webclient.ts:1740](../../packages/server/src/webclient.ts#L1740) `WebClient/groups` | `Store.findIds` (1740); `Store.groupSummaries` (1746) | WEB |
| [packages/server/src/webclient.ts:530](../../packages/server/src/webclient.ts#L530) `WebClient/history` | `Store.get` (530) | WEB |
| [packages/server/src/webclient.ts:726](../../packages/server/src/webclient.ts#L726) `WebClient/index` | `Store.fieldIndex` (726) | WEB |
| [packages/server/src/webclient.ts:816](../../packages/server/src/webclient.ts#L816) `WebClient/menus` | `Store.evaluateEach` (816) | WEB |
| [packages/server/src/webclient.ts:1172](../../packages/server/src/webclient.ts#L1172) `WebClient/records` | `Store.getMany` (1172); `Store.find` (1175) | WEB |
| [packages/server/src/webclient.ts:1118](../../packages/server/src/webclient.ts#L1118) `WebClient/refresh` | `Store.previewRow` (1118); `Store.getMany` (1123); `Store.foundSetRows` (1145) | WEB |
| [packages/server/src/webclient.ts:1364](../../packages/server/src/webclient.ts#L1364) `WebClient/streamExportRecords/nextBatch` | `Store.selectIds` (1364); `Store.getMany` (1370) | WEB |
| [packages/server/src/webclient.ts:1032](../../packages/server/src/webclient.ts#L1032) `WebClient/view` | `Store.evaluateEach` (1032, 1056, 1075); `Store.canView` (1050); `Store.previewRow` (1054, 1076); `Store.get` (1067); `Store.row` (1068, 1068) | WEB |
| [packages/server/src/webclient.ts:1053](../../packages/server/src/webclient.ts#L1053) `WebClient/view/get` | `Store.get` (1053) | WEB |
| [packages/server/src/webclient.ts:2627](../../packages/server/src/webclient.ts#L2627) `foundIds` | `Store.findIds` (2627, 2629) | WEB |
| [packages/server/src/webclient.ts:2548](../../packages/server/src/webclient.ts#L2548) `listItems` | `Store.valueListItems` (2548) | WEB |
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
| [packages/store/src/calc.ts:2386](../../packages/store/src/calc.ts#L2386) `Calculations/beforeWrite` | `relatedRows` (2386); `Calculations.related` (2440); `Calculations.context` (2453) | CORE |
| [packages/store/src/calc.ts:629](../../packages/store/src/calc.ts#L629) `Calculations/collect` | `Calculations.collector` (629) | CALC |
| [packages/store/src/calc.ts:660](../../packages/store/src/calc.ts#L660) `Calculations/collector/add` | `Calculations.related` (660) | CALC |
| [packages/store/src/calc.ts:1693](../../packages/store/src/calc.ts#L1693) `Calculations/columnNames` | `SQLite.all` (1693); `SQLite.prepare` (1693); `Store.sql` (1693) | CALC |
| [packages/store/src/calc.ts:2249](../../packages/store/src/calc.ts#L2249) `Calculations/computeColumn` | `Calculations.statement` (2249); `SQLite.get` (2249); `Calculations.value` (2252) | CALC |
| [packages/store/src/calc.ts:2504](../../packages/store/src/calc.ts#L2504) `Calculations/computeStored` | `Calculations.computeStoredStyled` (2504); `Calculations.value` (2504) | CALC |
| [packages/store/src/calc.ts:2519](../../packages/store/src/calc.ts#L2519) `Calculations/computeStoredStyled` | `Calculations.context` (2519) | CORE |
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
| [packages/store/src/calc.ts:2212](../../packages/store/src/calc.ts#L2212) `Calculations/defineComputedColumn/fm_computed` | `Calculations.related` (2212) | CALC |
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
| [packages/store/src/calc.ts:2180](../../packages/store/src/calc.ts#L2180) `Calculations/shareColumn` | `Store.recordCount` (2180) | CALC |
| [packages/store/src/calc.ts:1704](../../packages/store/src/calc.ts#L1704) `Calculations/statement` | `SQLite.prepare` (1704); `Store.sql` (1704) | CALC |
| [packages/store/src/calc.ts:1540](../../packages/store/src/calc.ts#L1540) `Calculations/storedRelatedValues` | `Calculations.statement` (1540); `SQLite.iterate` (1540) | CALC |
| [packages/store/src/calc.ts:1285](../../packages/store/src/calc.ts#L1285) `Calculations/storedRows` | `SQLite.iterate` (1285); `SQLite.prepare` (1285); `Store.sql` (1285) | CALC |
| [packages/store/src/calc.ts:684](../../packages/store/src/calc.ts#L684) `Calculations/summary` | `Calculations.collect` (684) | CALC |
| [packages/store/src/calc.ts:921](../../packages/store/src/calc.ts#L921) `Calculations/summaryDependencies` | `Store.sql` (921) | CALC |
| [packages/store/src/calc.ts:636](../../packages/store/src/calc.ts#L636) `Calculations/summaryInput` | `Calculations.value` (636) | CALC |
| [packages/store/src/calc.ts:691](../../packages/store/src/calc.ts#L691) `Calculations/tableSummary` | `Calculations.wholeTable` (691) | CALC |
| [packages/store/src/calc.ts:2116](../../packages/store/src/calc.ts#L2116) `Calculations/translateSQL` | `Store.scopedTableSql` (2116, 2148) | CALC |
| [packages/store/src/calc.ts:2555](../../packages/store/src/calc.ts#L2555) `Calculations/uniqueCollision` | `Calculations.value` (2555) | CALC |
| [packages/store/src/calc.ts:580](../../packages/store/src/calc.ts#L580) `Calculations/unstoredValue` | `Calculations.unstoredStyled` (580); `Calculations.value` (580) | CALC |
| [packages/store/src/calc.ts:2582](../../packages/store/src/calc.ts#L2582) `Calculations/validate` | `Calculations.value` (2582); `Store.valueListItems` (2603); `Calculations.context` (2617) | CALC |
| [packages/store/src/calc.ts:2568](../../packages/store/src/calc.ts#L2568) `Calculations/validate/fail` | `Calculations.context` (2568) | CALC |
| [packages/store/src/calc.ts:530](../../packages/store/src/calc.ts#L530) `Calculations/value` | `Calculations.globalValue` (530) | CALC |
| [packages/store/src/calc.ts:960](../../packages/store/src/calc.ts#L960) `Calculations/wholeTable` | `rowsById` (960); `Store.viewableIds` (960); `Calculations.collect` (962, 1052); `Calculations.value` (1023); `Store.sql` (1031, 1039) | CALC |
| [packages/store/src/calc.ts:2764](../../packages/store/src/calc.ts#L2764) `containerValue` | `Store.containerInfo` (2764); `Store.containerRange` (2771); `Store.container` (2772) | CALC |
| [packages/store/src/calc.ts:2780](../../packages/store/src/calc.ts#L2780) `containerValue/read` | `Store.container` (2780) | CALC |
| [packages/store/src/calc.ts:2793](../../packages/store/src/calc.ts#L2793) `containerValue/value` | `Store.containerRange` (2793) | CALC |
| [packages/store/src/calc.ts:2679](../../packages/store/src/calc.ts#L2679) `nearest` | `SQLite.get` (2679); `SQLite.prepare` (2679); `Store.sql` (2679) | CALC |
| [packages/store/src/calc.ts:3224](../../packages/store/src/calc.ts#L3224) `rowsById/flush` | `Calculations.statement` (3224); `SQLite.iterate` (3224) | CALC |
| [packages/store/src/calc.ts:2911](../../packages/store/src/calc.ts#L2911) `sameValuesElsewhere` | `SQLite.all` (2911); `SQLite.prepare` (2911, 2918, 2920); `Store.sql` (2911, 2918, 2920); `Calculations.value` (2913); `SQLite.get` (2918, 2920) | CALC |
| [packages/store/src/damage.ts:93](../../packages/store/src/damage.ts#L93) `watchDatabase` | `SQLite.prepare` (93); `SQLite.iterate` (103) | CORE |
| [packages/store/src/exit-bundle.ts:266](../../packages/store/src/exit-bundle.ts#L266) `build` | `SQLite.prepare` (266) | EXIT-BUNDLE |
| [packages/store/src/exit-bundle.ts:289](../../packages/store/src/exit-bundle.ts#L289) `copyTables` | `SQLite.all` (289); `SQLite.prepare` (289, 295, 296, 312); `SQLite.get` (298, 309, 312) | EXIT-BUNDLE |
| [packages/store/src/exit-bundle.ts:467](../../packages/store/src/exit-bundle.ts#L467) `finish` | `SQLite.all` (467); `SQLite.prepare` (467); `Calculations.globalValue` (478) | EXIT-BUNDLE |
| [packages/store/src/exit-bundle.ts:322](../../packages/store/src/exit-bundle.ts#L322) `writeContainers` | `SQLite.all` (322, 334); `SQLite.prepare` (322, 334, 335, 365); `Store.containerInfo` (339); `Store.containerRange` (353); `SQLite.get` (365) | EXIT-BUNDLE |
| [packages/store/src/exit-bundle.ts:381](../../packages/store/src/exit-bundle.ts#L381) `writeCsv` | `SQLite.prepare` (381); `SQLite.iterate` (385) | EXIT-BUNDLE |
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
| [packages/store/src/import.ts:92](../../packages/store/src/import.ts#L92) `addExternalSizeColumn` | `SQLite.all` (92); `SQLite.prepare` (92) | OPERATOR |
| [packages/store/src/import.ts:168](../../packages/store/src/import.ts#L168) `applyFileAccountStatus` | `SQLite.get` (168, 170); `SQLite.prepare` (168, 170, 172, 184) | OPERATOR |
| [packages/store/src/import.ts:205](../../packages/store/src/import.ts#L205) `createStore` | `SQLite.prepare` (205, 217) | OPERATOR |
| [packages/store/src/import.ts:124](../../packages/store/src/import.ts#L124) `importDesigns` | `SQLite.all` (124); `SQLite.prepare` (124, 138, 141, 144, 146); `SQLite.get` (138, 141) | OPERATOR |
| [packages/store/src/import.ts:335](../../packages/store/src/import.ts#L335) `importFmp12` | `SQLite.prepare` (335, 346, 352, 358, 362, 377, 388, 465, 466, 467); `SQLite.get` (352, 377); `SQLite.all` (358) | OPERATOR |
| [packages/store/src/import.ts:326](../../packages/store/src/import.ts#L326) `importFmp12/save` | `SQLite.prepare` (326) | OPERATOR |
| [packages/store/src/import.ts:229](../../packages/store/src/import.ts#L229) `needsDesigns` | `SQLite.get` (229); `SQLite.prepare` (229) | OPERATOR |
| [packages/store/src/import.ts:276](../../packages/store/src/import.ts#L276) `readState` | `SQLite.get` (276); `SQLite.prepare` (276) | OPERATOR |
| [packages/store/src/import.ts:104](../../packages/store/src/import.ts#L104) `writeDesign` | `SQLite.prepare` (104, 108) | OPERATOR |
| [packages/store/src/layout-speed.ts:56](../../packages/store/src/layout-speed.ts#L56) `layoutCost/recordCount` | `Store.recordCount` (56) | DESIGN |
| [packages/store/src/layout-speed.ts:419](../../packages/store/src/layout-speed.ts#L419) `speedContext` | `Store.recordCount` (419) | DESIGN |
| [packages/store/src/privileges.ts:547](../../packages/store/src/privileges.ts#L547) `ensurePrivilegeTables` | `SQLite.all` (547); `SQLite.prepare` (547) | AUTH |
| [packages/store/src/privileges.ts:519](../../packages/store/src/privileges.ts#L519) `privilegeSets` | `SQLite.all` (519); `SQLite.prepare` (519) | AUTH |
| [packages/store/src/reconvert.ts:186](../../packages/store/src/reconvert.ts#L186) `build` | `SQLite.get` (186); `SQLite.prepare` (186, 189, 194); `SQLite.all` (194) | OPERATOR |
| [packages/store/src/reconvert.ts:291](../../packages/store/src/reconvert.ts#L291) `carryRecords` | `SQLite.prepare` (291, 294, 295, 305, 311, 312); `SQLite.all` (294, 298, 311) | OPERATOR |
| [packages/store/src/reconvert.ts:320](../../packages/store/src/reconvert.ts#L320) `carrySettings` | `SQLite.all` (320, 324, 332); `SQLite.prepare` (320, 324, 332, 333, 337); `SQLite.get` (337) | OPERATOR |
| [packages/store/src/reconvert.ts:98](../../packages/store/src/reconvert.ts#L98) `columns` | `SQLite.all` (98); `SQLite.prepare` (98) | OPERATOR |
| [packages/store/src/reconvert.ts:254](../../packages/store/src/reconvert.ts#L254) `copyContainer` | `SQLite.get` (254); `SQLite.prepare` (254, 256, 262) | OPERATOR |
| [packages/store/src/reconvert.ts:89](../../packages/store/src/reconvert.ts#L89) `meta` | `SQLite.get` (89); `SQLite.prepare` (89) | OPERATOR |
| [packages/store/src/reconvert.ts:234](../../packages/store/src/reconvert.ts#L234) `previewOf` | `SQLite.get` (234); `SQLite.prepare` (234) | OPERATOR |
| [packages/store/src/reconvert.ts:221](../../packages/store/src/reconvert.ts#L221) `previewOf/count` | `SQLite.get` (221); `SQLite.prepare` (221) | OPERATOR |
| [packages/store/src/reconvert.ts:111](../../packages/store/src/reconvert.ts#L111) `reconvertCheck` | `SQLite.get` (111); `SQLite.prepare` (111) | OPERATOR |
| [packages/store/src/reconvert.ts:94](../../packages/store/src/reconvert.ts#L94) `tableExists` | `SQLite.get` (94); `SQLite.prepare` (94) | OPERATOR |
| [packages/store/src/record-chain.ts:58](../../packages/store/src/record-chain.ts#L58) `ensureRecordChain` | `SQLite.all` (58); `SQLite.prepare` (58, 67, 68, 71); `SQLite.get` (67, 68) | CORE |
| [packages/store/src/record-chain.ts:80](../../packages/store/src/record-chain.ts#L80) `linkRecordEntry` | `SQLite.prepare` (80, 81, 82, 85, 86); `SQLite.get` (81, 82) | CORE |
| [packages/store/src/record-chain.ts:93](../../packages/store/src/record-chain.ts#L93) `pruneRecordEntries` | `SQLite.prepare` (93, 94, 95, 97); `SQLite.get` (94) | CORE |
| [packages/store/src/record-chain.ts:115](../../packages/store/src/record-chain.ts#L115) `verifyRecordAudit` | `SQLite.get` (115, 129); `SQLite.prepare` (115, 119, 129, 132); `SQLite.all` (119); `SQLite.iterate` (132) | CORE |
| [packages/store/src/related.ts:145](../../packages/store/src/related.ts#L145) `condition` | `Store.canViewRecord` (145); `keyValue` (158) | RELATED |
| [packages/store/src/related.ts:346](../../packages/store/src/related.ts#L346) `firstRelatedEach` | `Calculations.statement` (346); `SQLite.all` (346) | RELATED |
| [packages/store/src/related.ts:325](../../packages/store/src/related.ts#L325) `firstRelatedEach/keysOf` | `keyValue` (325) | RELATED |
| [packages/store/src/related.ts:312](../../packages/store/src/related.ts#L312) `firstRelatedEach/oneByOne` | `relatedRows` (312) | RELATED |
| [packages/store/src/related.ts:134](../../packages/store/src/related.ts#L134) `keyValue` | `Calculations.value` (134) | RELATED |
| [packages/store/src/related.ts:249](../../packages/store/src/related.ts#L249) `relatedIdList` | `Calculations.relatedIds` (249); `Calculations.statement` (254); `SQLite.iterate` (254) | RELATED |
| [packages/store/src/related.ts:292](../../packages/store/src/related.ts#L292) `relatedKeys` | `keyValue` (292) | RELATED |
| [packages/store/src/related.ts:191](../../packages/store/src/related.ts#L191) `relatedRows` | `Calculations.relatedIds` (191); `rowsById` (192); `Calculations.statement` (207, 211, 221); `SQLite.get` (207); `SQLite.all` (211); `SQLite.iterate` (221) | RELATED |
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
| [packages/store/src/store.ts:4691](../../packages/store/src/store.ts#L4691) `Store/accountIdentityId` | `SQLite.get` (4691, 4696); `SQLite.prepare` (4691, 4695, 4696); `Store.sql` (4691, 4695, 4696) | CORE |
| [packages/store/src/store.ts:4654](../../packages/store/src/store.ts#L4654) `Store/accountInactive` | `SQLite.get` (4654); `SQLite.prepare` (4654); `Store.sql` (4654) | CORE |
| [packages/store/src/store.ts:4819](../../packages/store/src/store.ts#L4819) `Store/accountLocalOnly` | `SQLite.get` (4819); `SQLite.prepare` (4819); `Store.sql` (4819) | CORE |
| [packages/store/src/store.ts:5673](../../packages/store/src/store.ts#L5673) `Store/accountPrivilegeSet` | `SQLite.get` (5673); `SQLite.prepare` (5673); `Store.sql` (5673) | CORE |
| [packages/store/src/store.ts:4824](../../packages/store/src/store.ts#L4824) `Store/accountRequires2fa` | `SQLite.get` (4824); `SQLite.prepare` (4824); `Store.sql` (4824) | CORE |
| [packages/store/src/store.ts:5044](../../packages/store/src/store.ts#L5044) `Store/accountUsage` | `SQLite.get` (5044); `SQLite.prepare` (5044, 5045); `Store.sql` (5044, 5045); `SQLite.all` (5045); `Store.auditLog` (5061) | CORE |
| [packages/store/src/store.ts:3154](../../packages/store/src/store.ts#L3154) `Store/accounts` | `SQLite.all` (3154); `SQLite.prepare` (3154); `Store.sql` (3154) | CORE |
| [packages/store/src/store.ts:3150](../../packages/store/src/store.ts#L3150) `Store/accountsSharingLockout` | `SQLite.all` (3150); `SQLite.prepare` (3150); `Store.sql` (3150) | CORE |
| [packages/store/src/store.ts:7755](../../packages/store/src/store.ts#L7755) `Store/addContainer` | `SQLite.all` (7755); `SQLite.prepare` (7755, 7760, 7774, 7778, 7779); `Store.sql` (7755, 7760, 7774, 7776, 7778, 7779, 7781, 7784); `SQLite.get` (7765); `Store.containerRange` (7767) | CORE |
| [packages/store/src/store.ts:7801](../../packages/store/src/store.ts#L7801) `Store/addExternalContainer` | `SQLite.prepare` (7801); `Store.sql` (7801) | CORE |
| [packages/store/src/store.ts:8257](../../packages/store/src/store.ts#L8257) `Store/addFieldIndex` | `Store.sql` (8257) | CORE |
| [packages/store/src/store.ts:6462](../../packages/store/src/store.ts#L6462) `Store/addImage` | `Store.sql` (6462, 6463); `SQLite.prepare` (6463) | CORE |
| [packages/store/src/store.ts:5723](../../packages/store/src/store.ts#L5723) `Store/addProvisionedAccount` | `SQLite.get` (5723); `SQLite.prepare` (5723, 5727); `Store.sql` (5723, 5727) | CORE |
| [packages/store/src/store.ts:6881](../../packages/store/src/store.ts#L6881) `Store/addRelated` | `relatedRows` (6881); `rowsById` (6913); `firstRelatedEach` (6936) | CORE |
| [packages/store/src/store.ts:3172](../../packages/store/src/store.ts#L3172) `Store/agentNeedsApproval` | `SQLite.get` (3172); `SQLite.prepare` (3172); `Store.sql` (3172) | CORE |
| [packages/store/src/store.ts:5937](../../packages/store/src/store.ts#L5937) `Store/allowedIds` | `SQLite.iterate` (5937); `SQLite.prepare` (5937); `Store.sql` (5937) | CORE |
| [packages/store/src/store.ts:5101](../../packages/store/src/store.ts#L5101) `Store/apiToken` | `SQLite.get` (5101); `SQLite.prepare` (5101, 5114); `Store.sql` (5101, 5114) | CORE |
| [packages/store/src/store.ts:5077](../../packages/store/src/store.ts#L5077) `Store/apiTokens` | `SQLite.all` (5077); `SQLite.prepare` (5077); `Store.sql` (5077) | CORE |
| [packages/store/src/store.ts:3495](../../packages/store/src/store.ts#L3495) `Store/appendSecurityEvent` | `Store.sql` (3495) | CORE |
| [packages/store/src/store.ts:4500](../../packages/store/src/store.ts#L4500) `Store/applyAccountImport` | `Store.sql` (4500, 4508, 4537); `SQLite.get` (4508); `SQLite.prepare` (4508, 4537) | CORE |
| [packages/store/src/store.ts:2115](../../packages/store/src/store.ts#L2115) `Store/applyDesign` | `Store.sql` (2115, 2116, 2129, 2132, 2137, 2153, 2156, 2156); `SQLite.prepare` (2132, 2137) | CORE |
| [packages/store/src/store.ts:3368](../../packages/store/src/store.ts#L3368) `Store/approvePending` | `SQLite.get` (3368); `SQLite.prepare` (3368, 3379); `Store.sql` (3368, 3379) | CORE |
| [packages/store/src/store.ts:2574](../../packages/store/src/store.ts#L2574) `Store/audit` | `Store.sql` (2574) | CORE |
| [packages/store/src/store.ts:2215](../../packages/store/src/store.ts#L2215) `Store/auditLog` | `SQLite.all` (2215); `SQLite.prepare` (2215); `Store.sql` (2215) | CORE |
| [packages/store/src/store.ts:1726](../../packages/store/src/store.ts#L1726) `Store/backup` | `Store.sql` (1726) | CORE |
| [packages/store/src/store.ts:3178](../../packages/store/src/store.ts#L3178) `Store/blankPasswordAccounts` | `SQLite.all` (3178); `SQLite.prepare` (3178); `Store.sql` (3178) | CORE |
| [packages/store/src/store.ts:8838](../../packages/store/src/store.ts#L8838) `Store/canView` | `Store.canView` (8838); `Store.row` (8839) | GATED-STORE |
| [packages/store/src/store.ts:8820](../../packages/store/src/store.ts#L8820) `Store/canViewRecord` | `SQLite.get` (8820); `SQLite.prepare` (8820); `Store.sql` (8820) | GATED-STORE |
| [packages/store/src/store.ts:4429](../../packages/store/src/store.ts#L4429) `Store/canonicalAccount` | `SQLite.all` (4429); `SQLite.prepare` (4429); `Store.sql` (4429) | CORE |
| [packages/store/src/store.ts:9897](../../packages/store/src/store.ts#L9897) `Store/cascadeDelete` | `relatedRows` (9897) | CORE |
| [packages/store/src/store.ts:1945](../../packages/store/src/store.ts#L1945) `Store/changeOne` | `Store.sql` (1945, 1947) | CORE |
| [packages/store/src/store.ts:1948](../../packages/store/src/store.ts#L1948) `Store/changeOne/read` | `SQLite.get` (1948); `SQLite.prepare` (1948); `Store.sql` (1948) | CORE |
| [packages/store/src/store.ts:8136](../../packages/store/src/store.ts#L8136) `Store/checkContainerWrite` | `Store.row` (8136) | CORE |
| [packages/store/src/store.ts:9550](../../packages/store/src/store.ts#L9550) `Store/checkEditable` | `Store.row` (9550) | CORE |
| [packages/store/src/store.ts:1391](../../packages/store/src/store.ts#L1391) `Store/checkpoint` | `SQLite.get` (1391); `SQLite.prepare` (1391); `Store.sql` (1391) | CORE |
| [packages/store/src/store.ts:5709](../../packages/store/src/store.ts#L5709) `Store/clearAccountPrivilegeSet` | `SQLite.prepare` (5709); `Store.sql` (5709) | CORE |
| [packages/store/src/store.ts:1409](../../packages/store/src/store.ts#L1409) `Store/close` | `Store.sql` (1409) | CORE |
| [packages/store/src/store.ts:8104](../../packages/store/src/store.ts#L8104) `Store/compactFile` | `Store.sql` (8104, 8105, 8107) | CORE |
| [packages/store/src/store.ts:10021](../../packages/store/src/store.ts#L10021) `Store/computeValuesCurrent` | `Store.computeValues` (10021); `Store.sql` (10027, 10031); `SQLite.all` (10031); `SQLite.prepare` (10031) | GATED-STORE |
| [packages/store/src/store.ts:8489](../../packages/store/src/store.ts#L8489) `Store/computedRows` | `Store.sql` (8489, 8492, 8493, 8494, 8496, 8506, 8507, 8508, 8511); `SQLite.prepare` (8492, 8494, 8496, 8506); `SQLite.iterate` (8496); `Calculations.globalValue` (8499); `Calculations.unstoredValue` (8500); `Calculations.related` (8503); `SQLite.all` (8506) | CORE |
| [packages/store/src/store.ts:5141](../../packages/store/src/store.ts#L5141) `Store/confirmTotp` | `SQLite.get` (5141); `SQLite.prepare` (5141, 5143); `Store.sql` (5141, 5143) | CORE |
| [packages/store/src/store.ts:1068](../../packages/store/src/store.ts#L1068) `Store/constructor` | `Store.sql` (1068, 1070, 1072, 1073, 1077, 1081, 1082, 1090, 1098, 1111, 1116, 1121, 1122, 1126, 1127, 1128, 1135, 1139, 1143, 1144, 1145, 1150, 1154, 1157, 1158, 1160, 1161, 1164, 1165, 1169, 1170, 1174, 1175, 1178, 1180, 1183, 1184, 1188, 1189, 1193, 1194, 1197, 1198, 1199, 1202, 1203, 1206, 1207, 1209, 1209, 1210, 1210, 1211, 1214, 1218, 1220, 1223, 1224, 1225, 1228, 1229, 1231, 1233, 1234, 1238, 1239, 1241, 1245, 1247, 1248, 1249, 1249, 1253, 1254); `SQLite.get` (1072, 1090); `SQLite.prepare` (1072, 1090, 1098, 1157, 1158, 1161, 1164, 1169, 1174, 1183, 1188, 1193, 1202, 1206, 1209, 1210, 1228, 1233, 1238); `SQLite.all` (1157, 1164, 1169, 1174, 1183, 1188, 1193, 1202, 1206, 1209, 1210, 1228, 1233, 1238) | CORE |
| [packages/store/src/store.ts:5490](../../packages/store/src/store.ts#L5490) `Store/consumeRecoveryCode` | `SQLite.prepare` (5490); `Store.sql` (5490) | CORE |
| [packages/store/src/store.ts:7679](../../packages/store/src/store.ts#L7679) `Store/container` | `SQLite.get` (7679); `SQLite.prepare` (7679, 7688); `Store.sql` (7679, 7688); `SQLite.all` (7688) | CORE |
| [packages/store/src/store.ts:8113](../../packages/store/src/store.ts#L8113) `Store/containerId` | `Store.containerId` (8113); `Store.row` (8114) | CORE |
| [packages/store/src/store.ts:7696](../../packages/store/src/store.ts#L7696) `Store/containerInfo` | `SQLite.get` (7696); `SQLite.prepare` (7696); `Store.sql` (7696) | CORE |
| [packages/store/src/store.ts:7660](../../packages/store/src/store.ts#L7660) `Store/containerIntact` | `SQLite.get` (7660); `SQLite.prepare` (7660); `Store.sql` (7660) | CORE |
| [packages/store/src/store.ts:7599](../../packages/store/src/store.ts#L7599) `Store/containerIntegrityReport` | `SQLite.all` (7599); `SQLite.prepare` (7599, 7610); `Store.sql` (7599, 7610); `SQLite.get` (7610) | CORE |
| [packages/store/src/store.ts:7674](../../packages/store/src/store.ts#L7674) `Store/containerMeta` | `SQLite.get` (7674); `SQLite.prepare` (7674); `Store.sql` (7674) | CORE |
| [packages/store/src/store.ts:7730](../../packages/store/src/store.ts#L7730) `Store/containerRange` | `SQLite.all` (7730); `SQLite.prepare` (7730, 7737); `Store.sql` (7730, 7737); `SQLite.get` (7737) | CORE |
| [packages/store/src/store.ts:7501](../../packages/store/src/store.ts#L7501) `Store/containerReferences` | `SQLite.all` (7501, 7520, 7522, 7528, 7541, 7552, 7566); `SQLite.prepare` (7501, 7520, 7522, 7528, 7541, 7552, 7564, 7566); `Store.sql` (7501, 7520, 7522, 7528, 7541, 7552, 7564, 7566); `SQLite.get` (7564); `Store.row` (7575) | CORE |
| [packages/store/src/store.ts:10001](../../packages/store/src/store.ts#L10001) `Store/countIds` | `Store.countIds` (10001); `SQLite.get` (10005); `SQLite.prepare` (10005); `Store.sql` (10005) | GATED-STORE |
| [packages/store/src/store.ts:8863](../../packages/store/src/store.ts#L8863) `Store/create` | `SQLite.get` (8863, 8869); `SQLite.prepare` (8863, 8869, 8882); `Store.sql` (8863, 8869, 8882) | CORE |
| [packages/store/src/store.ts:3467](../../packages/store/src/store.ts#L3467) `Store/createAccount` | `SQLite.get` (3467); `SQLite.prepare` (3467, 3471, 3477, 3482, 3487); `Store.sql` (3467, 3471, 3477, 3482, 3487) | CORE |
| [packages/store/src/store.ts:4877](../../packages/store/src/store.ts#L4877) `Store/createApiToken` | `SQLite.get` (4877, 4905); `SQLite.prepare` (4877, 4904, 4905, 4915); `Store.sql` (4877, 4904, 4905, 4915) | CORE |
| [packages/store/src/store.ts:4441](../../packages/store/src/store.ts#L4441) `Store/createLocalAccount` | `SQLite.prepare` (4441); `Store.sql` (4441) | CORE |
| [packages/store/src/store.ts:3144](../../packages/store/src/store.ts#L3144) `Store/credentialIdentity` | `SQLite.get` (3144); `SQLite.prepare` (3144); `Store.sql` (3144) | CORE |
| [packages/store/src/store.ts:1816](../../packages/store/src/store.ts#L1816) `Store/dataVersion` | `SQLite.get` (1816); `SQLite.prepare` (1816); `Store.sql` (1816) | CORE |
| [packages/store/src/store.ts:9593](../../packages/store/src/store.ts#L9593) `Store/delete` | `Store.row` (9593) | CORE |
| [packages/store/src/store.ts:9601](../../packages/store/src/store.ts#L9601) `Store/delete/run` | `SQLite.get` (9601); `SQLite.prepare` (9601, 9606); `Store.sql` (9601, 9606) | CORE |
| [packages/store/src/store.ts:4595](../../packages/store/src/store.ts#L4595) `Store/deleteAccount` | `SQLite.prepare` (4595, 4599, 4600, 4601, 4602, 4603, 4604, 4605, 4606, 4613, 4615, 4617, 4619, 4623); `Store.sql` (4595, 4599, 4600, 4601, 4602, 4603, 4604, 4605, 4606, 4613, 4615, 4617, 4619, 4623) | CORE |
| [packages/store/src/store.ts:5575](../../packages/store/src/store.ts#L5575) `Store/deletePrivilegeSet` | `SQLite.prepare` (5575); `Store.sql` (5575) | CORE |
| [packages/store/src/store.ts:3605](../../packages/store/src/store.ts#L3605) `Store/deleteScriptTest` | `SQLite.prepare` (3605); `Store.sql` (3605) | CORE |
| [packages/store/src/store.ts:2789](../../packages/store/src/store.ts#L2789) `Store/deletedRows` | `SQLite.get` (2789); `SQLite.prepare` (2789, 2791, 2791); `Store.sql` (2789, 2791, 2791); `SQLite.all` (2791, 2791) | CORE |
| [packages/store/src/store.ts:2899](../../packages/store/src/store.ts#L2899) `Store/designEffect` | `Store.sql` (2899, 2904, 2909, 2914, 2917, 2923, 2934, 2935, 2937, 2950, 2951, 2954, 2956, 2962, 2963, 2964, 2969, 2971, 2975, 2978, 2979, 2981, 2984, 2990, 2992, 2999, 3000, 3002, 3003, 3004, 3005, 3012, 3013, 3015, 3015, 3017, 3018, 3019, 3023, 3027, 3029, 3067, 3069, 3071); `SQLite.get` (2934, 2950, 2962, 2963, 2975, 2979, 3015, 3023); `SQLite.prepare` (2934, 2935, 2950, 2951, 2962, 2963, 2969, 2971, 2975, 2979, 2990, 2992, 3005, 3012, 3013, 3015, 3017, 3019, 3023, 3027); `SQLite.all` (3012, 3013); `SQLite.iterate` (3017) | CORE |
| [packages/store/src/store.ts:2892](../../packages/store/src/store.ts#L2892) `Store/designEffect/renameExcluded` | `SQLite.prepare` (2892); `Store.sql` (2892) | CORE |
| [packages/store/src/store.ts:2876](../../packages/store/src/store.ts#L2876) `Store/designEffect/renameKey` | `SQLite.prepare` (2876); `Store.sql` (2876) | CORE |
| [packages/store/src/store.ts:2830](../../packages/store/src/store.ts#L2830) `Store/designHistory` | `SQLite.all` (2830); `SQLite.prepare` (2830); `Store.sql` (2830) | CORE |
| [packages/store/src/store.ts:5162](../../packages/store/src/store.ts#L5162) `Store/disableTotp` | `SQLite.prepare` (5162); `Store.sql` (5162) | CORE |
| [packages/store/src/store.ts:3079](../../packages/store/src/store.ts#L3079) `Store/dropColumnIndexes` | `SQLite.all` (3079, 3081); `SQLite.prepare` (3079, 3081); `Store.sql` (3079, 3081, 3082) | CORE |
| [packages/store/src/store.ts:8269](../../packages/store/src/store.ts#L8269) `Store/dropFieldIndex` | `SQLite.get` (8269); `SQLite.prepare` (8269); `Store.sql` (8269, 8270) | CORE |
| [packages/store/src/store.ts:8906](../../packages/store/src/store.ts#L8906) `Store/duplicate` | `Store.row` (8906); `SQLite.get` (8910); `SQLite.prepare` (8910, 8925); `Store.sql` (8910, 8925) | CORE |
| [packages/store/src/store.ts:7917](../../packages/store/src/store.ts#L7917) `Store/embeddedContainerCount` | `SQLite.prepare` (7917); `Store.sql` (7917); `SQLite.get` (7918) | CORE |
| [packages/store/src/store.ts:7903](../../packages/store/src/store.ts#L7903) `Store/embeddedContainers` | `SQLite.prepare` (7903, 7904); `Store.sql` (7903, 7904); `SQLite.all` (7904); `SQLite.get` (7908) | CORE |
| [packages/store/src/store.ts:2815](../../packages/store/src/store.ts#L2815) `Store/emptyDeleted` | `Store.sql` (2815, 2818, 2819, 2821, 2823); `SQLite.prepare` (2819) | CORE |
| [packages/store/src/store.ts:1696](../../packages/store/src/store.ts#L1696) `Store/endTransaction` | `Store.sql` (1696, 1699, 1699) | CORE |
| [packages/store/src/store.ts:5130](../../packages/store/src/store.ts#L5130) `Store/enrollTotp` | `SQLite.prepare` (5130); `Store.sql` (5130) | CORE |
| [packages/store/src/store.ts:2784](../../packages/store/src/store.ts#L2784) `Store/ensureDeleted` | `Store.sql` (2784) | CORE |
| [packages/store/src/store.ts:1264](../../packages/store/src/store.ts#L1264) `Store/ensureNativeIds` | `SQLite.all` (1264, 1276); `SQLite.prepare` (1264, 1267, 1275, 1276); `Store.sql` (1264, 1267, 1270, 1274, 1275, 1276, 1279, 1281) | CORE |
| [packages/store/src/store.ts:9247](../../packages/store/src/store.ts#L9247) `Store/evaluateCurrent` | `Store.row` (9247, 9247, 9248, 9248); `Calculations.context` (9253); `Store.get` (9254, 9256) | GATED-STORE |
| [packages/store/src/store.ts:9288](../../packages/store/src/store.ts#L9288) `Store/evaluateEachCurrent` | `Store.row` (9288, 9288, 9293); `Calculations.context` (9294); `Store.get` (9296) | GATED-STORE |
| [packages/store/src/store.ts:9350](../../packages/store/src/store.ts#L9350) `Store/evaluateRowsCurrent` | `Store.row` (9350, 9350, 9351, 9351) | GATED-STORE |
| [packages/store/src/store.ts:9329](../../packages/store/src/store.ts#L9329) `Store/evaluateRowsCurrent/each` | `Calculations.context` (9329); `Store.get` (9331) | GATED-STORE |
| [packages/store/src/store.ts:9365](../../packages/store/src/store.ts#L9365) `Store/evaluateRowsCurrent/found/[Symbol.iterator]` | `rowsById` (9365) | GATED-STORE |
| [packages/store/src/store.ts:9387](../../packages/store/src/store.ts#L9387) `Store/evaluateRowsCurrent/key` | `Calculations.context` (9387) | GATED-STORE |
| [packages/store/src/store.ts:3411](../../packages/store/src/store.ts#L3411) `Store/externalAccount` | `SQLite.all` (3411); `SQLite.prepare` (3411); `Store.sql` (3411) | CORE |
| [packages/store/src/store.ts:7422](../../packages/store/src/store.ts#L7422) `Store/externalContainerCheck` | `SQLite.all` (7422); `SQLite.prepare` (7422); `Store.sql` (7422) | CORE |
| [packages/store/src/store.ts:7429](../../packages/store/src/store.ts#L7429) `Store/externalContainerCount` | `SQLite.get` (7429); `SQLite.prepare` (7429); `Store.sql` (7429) | CORE |
| [packages/store/src/store.ts:7438](../../packages/store/src/store.ts#L7438) `Store/externalContainerReport` | `SQLite.all` (7438, 7451); `SQLite.prepare` (7438, 7451); `Store.sql` (7438, 7451) | CORE |
| [packages/store/src/store.ts:4680](../../packages/store/src/store.ts#L4680) `Store/externalIdentityId` | `SQLite.get` (4680, 4686); `SQLite.prepare` (4680, 4685, 4686); `Store.sql` (4680, 4685, 4686) | CORE |
| [packages/store/src/store.ts:7670](../../packages/store/src/store.ts#L7670) `Store/externalOf` | `SQLite.get` (7670); `SQLite.prepare` (7670); `Store.sql` (7670) | CORE |
| [packages/store/src/store.ts:2722](../../packages/store/src/store.ts#L2722) `Store/failureAuditRoom` | `SQLite.get` (2722); `SQLite.prepare` (2722); `Store.sql` (2722) | CORE |
| [packages/store/src/store.ts:7082](../../packages/store/src/store.ts#L7082) `Store/fieldIndexCurrent` | `SQLite.iterate` (7082); `SQLite.prepare` (7082, 7087); `Store.sql` (7082, 7087); `SQLite.all` (7087) | GATED-STORE |
| [packages/store/src/store.ts:8304](../../packages/store/src/store.ts#L8304) `Store/find` | `Store.find` (8304) | GATED-STORE |
| [packages/store/src/store.ts:8676](../../packages/store/src/store.ts#L8676) `Store/findCandidates` | `Store.query` (8676) | CORE |
| [packages/store/src/store.ts:8315](../../packages/store/src/store.ts#L8315) `Store/findHere` | `Store.query` (8315, 8320, 8322, 8336, 8338, 8349); `Store.recordCount` (8333); `SQLite.get` (8334, 8338); `SQLite.prepare` (8334, 8338, 8344, 8351, 8360); `Store.sql` (8334, 8338, 8344, 8351, 8360); `SQLite.all` (8344, 8351, 8360) | GATED-STORE |
| [packages/store/src/store.ts:8355](../../packages/store/src/store.ts#L8355) `Store/findHere/[Symbol.iterator]` | `SQLite.iterate` (8355); `SQLite.prepare` (8355); `Store.sql` (8355) | GATED-STORE |
| [packages/store/src/store.ts:10046](../../packages/store/src/store.ts#L10046) `Store/findIdsCurrent` | `Store.findIds` (10046) | GATED-STORE |
| [packages/store/src/store.ts:10052](../../packages/store/src/store.ts#L10052) `Store/findIdsHere` | `Store.query` (10052, 10057, 10059); `SQLite.iterate` (10070); `SQLite.prepare` (10070); `Store.sql` (10070) | GATED-STORE |
| [packages/store/src/store.ts:8620](../../packages/store/src/store.ts#L8620) `Store/findSource` | `Store.query` (8620); `SQLite.all` (8629, 8646); `SQLite.prepare` (8629, 8637, 8645); `Store.sql` (8629, 8634, 8637, 8642, 8645, 8659, 8661); `Calculations.globalValue` (8651); `Calculations.unstoredValue` (8652); `Calculations.related` (8656) | CORE |
| [packages/store/src/store.ts:9642](../../packages/store/src/store.ts#L9642) `Store/forgetStandInValues` | `Store.sql` (9642, 9663); `SQLite.prepare` (9663) | CORE |
| [packages/store/src/store.ts:4562](../../packages/store/src/store.ts#L4562) `Store/forgetStandIns` | `SQLite.prepare` (4562); `Store.sql` (4562) | CORE |
| [packages/store/src/store.ts:6964](../../packages/store/src/store.ts#L6964) `Store/foundSetPage` | `rowsById` (6964) | CORE |
| [packages/store/src/store.ts:6980](../../packages/store/src/store.ts#L6980) `Store/foundSetRowsCurrent` | `Store.viewableIds` (6980); `Store.row` (6996) | GATED-STORE |
| [packages/store/src/store.ts:3330](../../packages/store/src/store.ts#L3330) `Store/gateAgentWrite` | `SQLite.get` (3330); `SQLite.prepare` (3330, 3332); `Store.sql` (3330, 3332) | CORE |
| [packages/store/src/store.ts:5428](../../packages/store/src/store.ts#L5428) `Store/generateRecoveryCodes` | `SQLite.prepare` (5428, 5431); `Store.sql` (5428, 5431) | CORE |
| [packages/store/src/store.ts:8748](../../packages/store/src/store.ts#L8748) `Store/getCurrent` | `Store.get` (8748); `Store.row` (8749, 8749, 8763); `SQLite.all` (8766); `SQLite.prepare` (8766); `Store.sql` (8766) | GATED-STORE |
| [packages/store/src/store.ts:8786](../../packages/store/src/store.ts#L8786) `Store/getManyCurrent` | `Store.getMany` (8786); `SQLite.get` (8804); `SQLite.prepare` (8804); `Store.sql` (8804) | GATED-STORE |
| [packages/store/src/store.ts:8797](../../packages/store/src/store.ts#L8797) `Store/getManyCurrent/[Symbol.iterator]` | `rowsById` (8797) | GATED-STORE |
| [packages/store/src/store.ts:1311](../../packages/store/src/store.ts#L1311) `Store/grantFullAccessClients` | `SQLite.prepare` (1311); `Store.sql` (1311) | CORE |
| [packages/store/src/store.ts:10087](../../packages/store/src/store.ts#L10087) `Store/groupSummariesCurrent` | `Store.groupSummaries` (10087); `Store.viewableIds` (10092); `Calculations.collect` (10108); `rowsById` (10108, 10158); `Calculations.collector` (10130) | GATED-STORE |
| [packages/store/src/store.ts:10156](../../packages/store/src/store.ts#L10156) `Store/groupSummariesCurrent/flush` | `Calculations.collector` (10156) | GATED-STORE |
| [packages/store/src/store.ts:10120](../../packages/store/src/store.ts#L10120) `Store/groupSummariesCurrent/key` | `Calculations.value` (10120); `Calculations.related` (10122) | GATED-STORE |
| [packages/store/src/store.ts:1319](../../packages/store/src/store.ts#L1319) `Store/hasOwnPassword` | `SQLite.get` (1319); `SQLite.prepare` (1319); `Store.sql` (1319) | CORE |
| [packages/store/src/store.ts:5287](../../packages/store/src/store.ts#L5287) `Store/hasPasskey` | `SQLite.get` (5287); `SQLite.prepare` (5287); `Store.sql` (5287) | CORE |
| [packages/store/src/store.ts:8223](../../packages/store/src/store.ts#L8223) `Store/hasTable` | `SQLite.get` (8223); `SQLite.prepare` (8223); `Store.sql` (8223) | CORE |
| [packages/store/src/store.ts:5151](../../packages/store/src/store.ts#L5151) `Store/hasTotp` | `SQLite.get` (5151); `SQLite.prepare` (5151); `Store.sql` (5151) | CORE |
| [packages/store/src/store.ts:4659](../../packages/store/src/store.ts#L4659) `Store/identityAllowed` | `SQLite.get` (4659, 4665, 4671); `SQLite.prepare` (4659, 4665, 4671); `Store.sql` (4659, 4665, 4671) | CORE |
| [packages/store/src/store.ts:6439](../../packages/store/src/store.ts#L6439) `Store/image` | `SQLite.get` (6439); `SQLite.prepare` (6439); `Store.sql` (6439) | CORE |
| [packages/store/src/store.ts:6449](../../packages/store/src/store.ts#L6449) `Store/images` | `SQLite.all` (6449); `SQLite.prepare` (6449); `Store.sql` (6449) | CORE |
| [packages/store/src/store.ts:4406](../../packages/store/src/store.ts#L4406) `Store/importAccounts` | `SQLite.all` (4406); `SQLite.prepare` (4406); `Store.sql` (4406) | CORE |
| [packages/store/src/store.ts:1565](../../packages/store/src/store.ts#L1565) `Store/independentWindowWrite` | `SQLite.get` (1565); `SQLite.prepare` (1565, 1595); `Store.sql` (1565, 1574, 1590, 1595, 1598) | CORE |
| [packages/store/src/store.ts:8235](../../packages/store/src/store.ts#L8235) `Store/indexedFields` | `SQLite.all` (8235, 8236); `SQLite.prepare` (8235, 8236); `Store.sql` (8235, 8236) | CORE |
| [packages/store/src/store.ts:10454](../../packages/store/src/store.ts#L10454) `Store/internalRoots` | `SQLite.get` (10454); `SQLite.prepare` (10454, 10456); `SQLite.all` (10456) | CORE |
| [packages/store/src/store.ts:3166](../../packages/store/src/store.ts#L3166) `Store/isAgent` | `SQLite.get` (3166); `SQLite.prepare` (3166); `Store.sql` (3166) | CORE |
| [packages/store/src/store.ts:3269](../../packages/store/src/store.ts#L3269) `Store/isExternal` | `SQLite.get` (3269); `SQLite.prepare` (3269); `Store.sql` (3269) | CORE |
| [packages/store/src/store.ts:5204](../../packages/store/src/store.ts#L5204) `Store/issueWebauthnChallenge` | `SQLite.prepare` (5204, 5206, 5207, 5209); `Store.sql` (5204, 5206, 5207, 5209); `SQLite.get` (5206) | CORE |
| [packages/store/src/store.ts:10361](../../packages/store/src/store.ts#L10361) `Store/iterateCommitted` | `SQLite.iterate` (10361) | CORE |
| [packages/store/src/store.ts:1542](../../packages/store/src/store.ts#L1542) `Store/joinTransaction` | `Store.sql` (1542, 1543, 1545, 1547, 1553) | CORE |
| [packages/store/src/store.ts:9844](../../packages/store/src/store.ts#L9844) `Store/keyStepWork` | `Store.sql` (9844, 9850, 9854, 9856) | CORE |
| [packages/store/src/store.ts:6306](../../packages/store/src/store.ts#L6306) `Store/knownSharedAccount` | `SQLite.get` (6306); `SQLite.prepare` (6306); `Store.sql` (6306) | CORE |
| [packages/store/src/store.ts:3879](../../packages/store/src/store.ts#L3879) `Store/lastSignIns` | `Store.auditLog` (3879) | CORE |
| [packages/store/src/store.ts:6479](../../packages/store/src/store.ts#L6479) `Store/layout` | `SQLite.get` (6479); `SQLite.prepare` (6479); `Store.sql` (6479) | CORE |
| [packages/store/src/store.ts:2847](../../packages/store/src/store.ts#L2847) `Store/layoutHistory` | `SQLite.all` (2847); `SQLite.prepare` (2847); `Store.sql` (2847) | CORE |
| [packages/store/src/store.ts:6369](../../packages/store/src/store.ts#L6369) `Store/layouts` | `SQLite.all` (6369); `SQLite.prepare` (6369); `Store.sql` (6369) | CORE |
| [packages/store/src/store.ts:4179](../../packages/store/src/store.ts#L4179) `Store/leastPrivilege` | `SQLite.all` (4179); `SQLite.prepare` (4179); `Store.sql` (4179) | CORE |
| [packages/store/src/store.ts:4743](../../packages/store/src/store.ts#L4743) `Store/ledgerRow` | `SQLite.get` (4743, 4744); `SQLite.prepare` (4743, 4744); `Store.sql` (4743, 4744) | AUTH |
| [packages/store/src/store.ts:4755](../../packages/store/src/store.ts#L4755) `Store/ledgerWrite` | `Store.sql` (4755, 4756, 4758, 4760, 4763, 4763) | AUTH |
| [packages/store/src/store.ts:4489](../../packages/store/src/store.ts#L4489) `Store/limitAccountImport` | `SQLite.prepare` (4489, 4490, 4493); `Store.sql` (4489, 4490, 4493); `SQLite.get` (4490) | CORE |
| [packages/store/src/store.ts:3119](../../packages/store/src/store.ts#L3119) `Store/linkIdentity` | `SQLite.get` (3119); `SQLite.prepare` (3119); `Store.sql` (3119) | CORE |
| [packages/store/src/store.ts:3111](../../packages/store/src/store.ts#L3111) `Store/linkPrincipal` | `SQLite.get` (3111); `SQLite.prepare` (3111); `Store.sql` (3111) | CORE |
| [packages/store/src/store.ts:2748](../../packages/store/src/store.ts#L2748) `Store/logSecurity` | `Store.sql` (2748) | CORE |
| [packages/store/src/store.ts:3765](../../packages/store/src/store.ts#L3765) `Store/markPiiField` | `SQLite.prepare` (3765); `Store.sql` (3765) | CORE |
| [packages/store/src/store.ts:7395](../../packages/store/src/store.ts#L7395) `Store/markRepeating` | `SQLite.prepare` (7395); `Store.sql` (7395) | CORE |
| [packages/store/src/store.ts:10294](../../packages/store/src/store.ts#L10294) `Store/matchIds` | `Store.matchIds` (10294); `SQLite.all` (10300); `SQLite.prepare` (10300); `Store.sql` (10300) | CORE |
| [packages/store/src/store.ts:1334](../../packages/store/src/store.ts#L1334) `Store/meta` | `SQLite.get` (1334); `SQLite.prepare` (1334); `Store.sql` (1334) | CORE |
| [packages/store/src/store.ts:925](../../packages/store/src/store.ts#L925) `Store/metadataVersions` | `SQLite.get` (925); `SQLite.prepare` (925); `Store.sql` (925) | CORE |
| [packages/store/src/store.ts:8032](../../packages/store/src/store.ts#L8032) `Store/moveContainersIn` | `Store.sql` (8032, 8038, 8040, 8041, 8042, 8043, 8063, 8068, 8068, 8079, 8082, 8085, 8092); `SQLite.prepare` (8040, 8041, 8042, 8043, 8079, 8085); `SQLite.get` (8045, 8079, 8085) | CORE |
| [packages/store/src/store.ts:7954](../../packages/store/src/store.ts#L7954) `Store/moveContainersOut` | `Store.sql` (7954, 7962, 7964, 7966, 7971, 7972, 7992, 7998, 8000, 8002, 8002, 8008, 8008, 8013, 8015, 8017, 8017, 8023); `SQLite.get` (7962); `SQLite.prepare` (7962, 7971, 7972); `Store.container` (7974) | CORE |
| [packages/store/src/store.ts:4360](../../packages/store/src/store.ts#L4360) `Store/mustChangePassword` | `SQLite.get` (4360); `SQLite.prepare` (4360); `Store.sql` (4360) | CORE |
| [packages/store/src/store.ts:1289](../../packages/store/src/store.ts#L1289) `Store/nativeIdGuards` | `Store.sql` (1289, 1290, 1292) | CORE |
| [packages/store/src/store.ts:5031](../../packages/store/src/store.ts#L5031) `Store/objectUseSince` | `SQLite.get` (5031); `SQLite.prepare` (5031); `Store.sql` (5031) | CORE |
| [packages/store/src/store.ts:8195](../../packages/store/src/store.ts#L8195) `Store/orderBy` | `Store.valueListItems` (8195) | CORE |
| [packages/store/src/store.ts:7587](../../packages/store/src/store.ts#L7587) `Store/orphanContainerReport` | `SQLite.all` (7587); `SQLite.prepare` (7587); `Store.sql` (7587) | CORE |
| [packages/store/src/store.ts:5256](../../packages/store/src/store.ts#L5256) `Store/passkeyAllowList` | `SQLite.all` (5256); `SQLite.prepare` (5256); `Store.sql` (5256) | CORE |
| [packages/store/src/store.ts:5292](../../packages/store/src/store.ts#L5292) `Store/passkeyIds` | `SQLite.all` (5292); `SQLite.prepare` (5292); `Store.sql` (5292) | CORE |
| [packages/store/src/store.ts:5280](../../packages/store/src/store.ts#L5280) `Store/passkeys` | `SQLite.all` (5280); `SQLite.prepare` (5280); `Store.sql` (5280) | CORE |
| [packages/store/src/store.ts:4399](../../packages/store/src/store.ts#L4399) `Store/passwordDaysRemaining` | `SQLite.get` (4399); `SQLite.prepare` (4399); `Store.sql` (4399) | CORE |
| [packages/store/src/store.ts:3354](../../packages/store/src/store.ts#L3354) `Store/pendingChanges` | `SQLite.all` (3354); `SQLite.prepare` (3354); `Store.sql` (3354) | CORE |
| [packages/store/src/store.ts:1352](../../packages/store/src/store.ts#L1352) `Store/persistentData` | `SQLite.get` (1352) | CORE |
| [packages/store/src/store.ts:1361](../../packages/store/src/store.ts#L1361) `Store/persistentDataIds` | `SQLite.all` (1361) | CORE |
| [packages/store/src/store.ts:1342](../../packages/store/src/store.ts#L1342) `Store/persistentTable` | `Store.sql` (1342) | CORE |
| [packages/store/src/store.ts:9535](../../packages/store/src/store.ts#L9535) `Store/portalContainerTarget` | `Store.row` (9535); `relatedIdList` (9537) | CORE |
| [packages/store/src/store.ts:7019](../../packages/store/src/store.ts#L7019) `Store/portalCountsCurrent` | `Store.canView` (7019); `Store.row` (7046) | GATED-STORE |
| [packages/store/src/store.ts:7257](../../packages/store/src/store.ts#L7257) `Store/portalRows` | `relatedRows` (7257); `relatedIdList` (7258); `Store.viewableIds` (7261); `rowsById` (7286, 7324); `Calculations.related` (7300) | CORE |
| [packages/store/src/store.ts:7268](../../packages/store/src/store.ts#L7268) `Store/portalRows/context` | `Calculations.context` (7268) | CORE |
| [packages/store/src/store.ts:7278](../../packages/store/src/store.ts#L7278) `Store/portalRows/valueOf` | `Calculations.value` (7278) | CORE |
| [packages/store/src/store.ts:2281](../../packages/store/src/store.ts#L2281) `Store/prepared` | `SQLite.prepare` (2281); `Store.sql` (2281) | CORE |
| [packages/store/src/store.ts:4471](../../packages/store/src/store.ts#L4471) `Store/previewAccountImport` | `Store.sql` (4471, 4472, 4481) | CORE |
| [packages/store/src/store.ts:6070](../../packages/store/src/store.ts#L6070) `Store/previewRecordRuleCurrent` | `SQLite.get` (6070); `SQLite.prepare` (6070, 6073); `Store.sql` (6070, 6073); `SQLite.all` (6073); `Calculations.context` (6079, 6095) | CORE |
| [packages/store/src/store.ts:8711](../../packages/store/src/store.ts#L8711) `Store/previewRow` | `Store.row` (8711) | CORE |
| [packages/store/src/store.ts:5503](../../packages/store/src/store.ts#L5503) `Store/privilegeSets` | `Store.sql` (5503) | CORE |
| [packages/store/src/store.ts:2492](../../packages/store/src/store.ts#L2492) `Store/pruneAudit` | `Store.sql` (2492, 2494, 2496); `SQLite.get` (2494); `SQLite.prepare` (2494) | CORE |
| [packages/store/src/store.ts:7622](../../packages/store/src/store.ts#L7622) `Store/purgeOrphanContainers` | `Store.sql` (7622, 7626, 7635, 7638, 7639, 7644, 7645, 7647, 7647); `Store.orphanContainerReport` (7630); `SQLite.get` (7635); `SQLite.prepare` (7635, 7638, 7639) | CORE |
| [packages/store/src/store.ts:10553](../../packages/store/src/store.ts#L10553) `Store/query` | `SQLite.iterate` (10553) | CORE |
| [packages/store/src/store.ts:10587](../../packages/store/src/store.ts#L10587) `Store/queryWithOriginsCurrent` | `SQLite.iterate` (10587); `SQLite.all` (10594, 10597); `SQLite.prepare` (10594, 10597) | CORE |
| [packages/store/src/store.ts:10395](../../packages/store/src/store.ts#L10395) `Store/readOnlyChecked` | `SQLite.prepare` (10395, 10399, 10408, 10413); `SQLite.all` (10399, 10408, 10413) | CORE |
| [packages/store/src/store.ts:3091](../../packages/store/src/store.ts#L3091) `Store/recompute` | `SQLite.prepare` (3091, 3095); `Store.sql` (3091, 3095); `SQLite.iterate` (3095); `Calculations.computeStoredStyled` (3096); `Calculations.value` (3096) | CORE |
| [packages/store/src/store.ts:2296](../../packages/store/src/store.ts#L2296) `Store/recordAsOf` | `SQLite.get` (2296, 2298); `SQLite.prepare` (2296, 2298, 2300, 2301); `Store.sql` (2296, 2298, 2300, 2301); `SQLite.all` (2300, 2301) | CORE |
| [packages/store/src/store.ts:1999](../../packages/store/src/store.ts#L1999) `Store/recordCount` | `SQLite.get` (1999); `SQLite.prepare` (1999); `Store.sql` (1999) | CORE |
| [packages/store/src/store.ts:4962](../../packages/store/src/store.ts#L4962) `Store/recordObjectUse` | `Store.sql` (4962) | CORE |
| [packages/store/src/store.ts:9237](../../packages/store/src/store.ts#L9237) `Store/recordViewable` | `Store.row` (9237) | GATED-STORE |
| [packages/store/src/store.ts:1399](../../packages/store/src/store.ts#L1399) `Store/recordedFormat` | `Store.sql` (1399) | CORE |
| [packages/store/src/store.ts:7926](../../packages/store/src/store.ts#L7926) `Store/recoverContainersOut` | `SQLite.prepare` (7926); `Store.sql` (7926); `SQLite.get` (7929) | CORE |
| [packages/store/src/store.ts:1480](../../packages/store/src/store.ts#L1480) `Store/recoverPendingExternalFiles` | `Store.sql` (1480, 1482, 1506, 1508); `SQLite.prepare` (1482); `SQLite.get` (1493) | CORE |
| [packages/store/src/store.ts:5446](../../packages/store/src/store.ts#L5446) `Store/recoveryCodesRemaining` | `SQLite.get` (5446); `SQLite.prepare` (5446); `Store.sql` (5446) | CORE |
| [packages/store/src/store.ts:10435](../../packages/store/src/store.ts#L10435) `Store/refreshDecimalSqlViews` | `SQLite.get` (10435); `SQLite.prepare` (10435, 10440); `SQLite.all` (10440) | CORE |
| [packages/store/src/store.ts:3260](../../packages/store/src/store.ts#L3260) `Store/refuseLookalikeAccount` | `SQLite.all` (3260); `SQLite.prepare` (3260); `Store.sql` (3260) | CORE |
| [packages/store/src/store.ts:5314](../../packages/store/src/store.ts#L5314) `Store/registerPasskey` | `SQLite.prepare` (5314); `Store.sql` (5314) | CORE |
| [packages/store/src/store.ts:3389](../../packages/store/src/store.ts#L3389) `Store/rejectPending` | `SQLite.get` (3389); `SQLite.prepare` (3389, 3391); `Store.sql` (3389, 3391) | CORE |
| [packages/store/src/store.ts:8463](../../packages/store/src/store.ts#L8463) `Store/relatedCriteria` | `SQLite.iterate` (8463); `SQLite.prepare` (8463); `Store.sql` (8463) | CORE |
| [packages/store/src/store.ts:8460](../../packages/store/src/store.ts#L8460) `Store/relatedCriteria/matched` | `relatedRows` (8460) | CORE |
| [packages/store/src/store.ts:6807](../../packages/store/src/store.ts#L6807) `Store/relatedValues` | `Calculations.globalValue` (6807); `Calculations.unstoredValue` (6809) | CORE |
| [packages/store/src/store.ts:5325](../../packages/store/src/store.ts#L5325) `Store/removePasskey` | `SQLite.get` (5325); `SQLite.prepare` (5325, 5326); `Store.sql` (5325, 5326) | CORE |
| [packages/store/src/store.ts:9682](../../packages/store/src/store.ts#L9682) `Store/restoreDeletedRowLocked` | `SQLite.get` (9682, 9687); `SQLite.prepare` (9682, 9683, 9687, 9697); `Store.sql` (9682, 9683, 9687, 9697); `SQLite.all` (9683) | CORE |
| [packages/store/src/store.ts:2331](../../packages/store/src/store.ts#L2331) `Store/restoreRecord` | `Store.recordAsOf` (2331); `SQLite.get` (2335); `SQLite.prepare` (2335, 2340, 2349, 2360); `Store.sql` (2335, 2340, 2349, 2360) | CORE |
| [packages/store/src/store.ts:2375](../../packages/store/src/store.ts#L2375) `Store/revertAuditEntry` | `Store.auditLog` (2375) | CORE |
| [packages/store/src/store.ts:5087](../../packages/store/src/store.ts#L5087) `Store/revokeApiToken` | `SQLite.prepare` (5087); `Store.sql` (5087) | CORE |
| [packages/store/src/store.ts:8729](../../packages/store/src/store.ts#L8729) `Store/row` | `SQLite.get` (8729) | CORE |
| [packages/store/src/store.ts:5896](../../packages/store/src/store.ts#L5896) `Store/ruleOutcome` | `Calculations.context` (5896) | CORE |
| [packages/store/src/store.ts:8574](../../packages/store/src/store.ts#L8574) `Store/runningSummaryValues` | `Store.viewableIds` (8574); `rowsById` (8576); `Calculations.value` (8587, 8593); `Calculations.related` (8604) | GATED-STORE |
| [packages/store/src/store.ts:5532](../../packages/store/src/store.ts#L5532) `Store/savePrivilegeSet` | `SQLite.prepare` (5532, 5540); `Store.sql` (5532, 5540) | AUTH |
| [packages/store/src/store.ts:3596](../../packages/store/src/store.ts#L3596) `Store/saveScriptTest` | `SQLite.prepare` (3596); `Store.sql` (3596) | CORE |
| [packages/store/src/store.ts:6035](../../packages/store/src/store.ts#L6035) `Store/scopedTableSql` | `Store.viewableIds` (6035); `SQLite.all` (6038); `SQLite.prepare` (6038); `Store.sql` (6038) | GATED-STORE |
| [packages/store/src/store.ts:2837](../../packages/store/src/store.ts#L2837) `Store/scriptHistory` | `SQLite.all` (2837); `SQLite.prepare` (2837); `Store.sql` (2837) | CORE |
| [packages/store/src/store.ts:2667](../../packages/store/src/store.ts#L2667) `Store/securityChange` | `Store.sql` (2667, 2669); `SQLite.prepare` (2669) | CORE |
| [packages/store/src/store.ts:2255](../../packages/store/src/store.ts#L2255) `Store/securityEvents` | `Store.auditLog` (2255) | CORE |
| [packages/store/src/store.ts:4811](../../packages/store/src/store.ts#L4811) `Store/securityToken` | `SQLite.get` (4811); `SQLite.prepare` (4811); `Store.sql` (4811) | CORE |
| [packages/store/src/store.ts:10489](../../packages/store/src/store.ts#L10489) `Store/selectCurrent` | `SQLite.iterate` (10489) | CORE |
| [packages/store/src/store.ts:10513](../../packages/store/src/store.ts#L10513) `Store/selectHeldCurrent` | `Store.sql` (10513, 10514); `SQLite.prepare` (10514); `SQLite.iterate` (10517) | CORE |
| [packages/store/src/store.ts:9987](../../packages/store/src/store.ts#L9987) `Store/selectIdsCurrent` | `Store.selectIds` (9987); `SQLite.all` (9993); `SQLite.prepare` (9993); `Store.sql` (9993) | GATED-STORE |
| [packages/store/src/store.ts:10505](../../packages/store/src/store.ts#L10505) `Store/selectIn` | `Store.select` (10505) | CORE |
| [packages/store/src/store.ts:1746](../../packages/store/src/store.ts#L1746) `Store/selfContainedCopy` | `Store.sql` (1746); `SQLite.all` (1751); `SQLite.prepare` (1751, 1753, 1754, 1755) | CORE |
| [packages/store/src/store.ts:4640](../../packages/store/src/store.ts#L4640) `Store/setAccountActive` | `SQLite.prepare` (4640, 4643, 4644); `Store.sql` (4640, 4643, 4644) | AUTH |
| [packages/store/src/store.ts:4830](../../packages/store/src/store.ts#L4830) `Store/setAccountLocalOnly` | `SQLite.prepare` (4830); `Store.sql` (4830) | CORE |
| [packages/store/src/store.ts:5687](../../packages/store/src/store.ts#L5687) `Store/setAccountPrivilegeSet` | `SQLite.get` (5687); `SQLite.prepare` (5687, 5690, 5694); `Store.sql` (5687, 5690, 5694) | AUTH |
| [packages/store/src/store.ts:4839](../../packages/store/src/store.ts#L4839) `Store/setAccountRequire2fa` | `SQLite.prepare` (4839); `Store.sql` (4839) | CORE |
| [packages/store/src/store.ts:3290](../../packages/store/src/store.ts#L3290) `Store/setAgentAccount` | `SQLite.get` (3290); `SQLite.prepare` (3290, 3296); `Store.sql` (3290, 3296) | CORE |
| [packages/store/src/store.ts:3640](../../packages/store/src/store.ts#L3640) `Store/setAiAllowed` | `SQLite.prepare` (3640); `Store.sql` (3640) | CORE |
| [packages/store/src/store.ts:3723](../../packages/store/src/store.ts#L3723) `Store/setAiPolicy` | `SQLite.prepare` (3723); `Store.sql` (3723) | CORE |
| [packages/store/src/store.ts:6293](../../packages/store/src/store.ts#L6293) `Store/setAllowBlankPasswordFromLan` | `SQLite.prepare` (6293); `Store.sql` (6293) | CORE |
| [packages/store/src/store.ts:2470](../../packages/store/src/store.ts#L2470) `Store/setAuditSettings` | `SQLite.prepare` (2470); `Store.sql` (2470) | CORE |
| [packages/store/src/store.ts:8145](../../packages/store/src/store.ts#L8145) `Store/setContainer` | `Store.sql` (8145, 8162); `Store.row` (8151); `SQLite.prepare` (8162) | CORE |
| [packages/store/src/store.ts:3242](../../packages/store/src/store.ts#L3242) `Store/setExternalAccount` | `SQLite.get` (3242); `SQLite.prepare` (3242, 3247); `Store.sql` (3242, 3247) | CORE |
| [packages/store/src/store.ts:4346](../../packages/store/src/store.ts#L4346) `Store/setMustChangePassword` | `SQLite.prepare` (4346); `Store.sql` (4346) | CORE |
| [packages/store/src/store.ts:3442](../../packages/store/src/store.ts#L3442) `Store/setPassword` | `SQLite.get` (3442); `SQLite.prepare` (3442, 3444, 3453); `Store.sql` (3442, 3444, 3453) | AUTH |
| [packages/store/src/store.ts:3537](../../packages/store/src/store.ts#L3537) `Store/setPasswordPolicy` | `SQLite.prepare` (3537); `Store.sql` (3537) | CORE |
| [packages/store/src/store.ts:1367](../../packages/store/src/store.ts#L1367) `Store/setPersistentData` | `SQLite.prepare` (1367, 1371); `Store.sql` (1367, 1371) | CORE |
| [packages/store/src/store.ts:3743](../../packages/store/src/store.ts#L3743) `Store/setPiiIsolation` | `SQLite.prepare` (3743); `Store.sql` (3743) | CORE |
| [packages/store/src/store.ts:3573](../../packages/store/src/store.ts#L3573) `Store/setRequireTotpForFullAccess` | `SQLite.prepare` (3573); `Store.sql` (3573) | CORE |
| [packages/store/src/store.ts:3655](../../packages/store/src/store.ts#L3655) `Store/setScriptNetwork` | `SQLite.prepare` (3655); `Store.sql` (3655) | CORE |
| [packages/store/src/store.ts:3712](../../packages/store/src/store.ts#L3712) `Store/setSqlRequiresFmxdbc` | `SQLite.prepare` (3712); `Store.sql` (3712) | CORE |
| [packages/store/src/store.ts:9158](../../packages/store/src/store.ts#L9158) `Store/setStoredCalcValues` | `SQLite.prepare` (9158, 9159); `Store.sql` (9158, 9159); `SQLite.get` (9163) | CORE |
| [packages/store/src/store.ts:8227](../../packages/store/src/store.ts#L8227) `Store/setUserPref` | `Store.sql` (8227, 8228, 8229); `SQLite.prepare` (8228, 8229) | CORE |
| [packages/store/src/store.ts:3696](../../packages/store/src/store.ts#L3696) `Store/setWebViewerHosts` | `SQLite.prepare` (3696); `Store.sql` (3696) | CORE |
| [packages/store/src/store.ts:4782](../../packages/store/src/store.ts#L4782) `Store/settleSignIns` | `SQLite.all` (4782, 4788); `SQLite.prepare` (4782, 4788, 4794, 4798, 4800); `Store.sql` (4782, 4788, 4794, 4798, 4800) | AUTH |
| [packages/store/src/store.ts:1877](../../packages/store/src/store.ts#L1877) `Store/shareResults` | `Store.sql` (1877) | CORE |
| [packages/store/src/store.ts:1425](../../packages/store/src/store.ts#L1425) `Store/shipWal` | `Store.sql` (1425) | CORE |
| [packages/store/src/store.ts:4729](../../packages/store/src/store.ts#L4729) `Store/signInBase` | `SQLite.get` (4729); `SQLite.prepare` (4729); `Store.sql` (4729) | AUTH |
| [packages/store/src/store.ts:4731](../../packages/store/src/store.ts#L4731) `Store/signInBase/identity` | `SQLite.get` (4731); `SQLite.prepare` (4731); `Store.sql` (4731) | AUTH |
| [packages/store/src/store.ts:4719](../../packages/store/src/store.ts#L4719) `Store/signInMark` | `SQLite.prepare` (4719); `Store.sql` (4719) | AUTH |
| [packages/store/src/store.ts:10212](../../packages/store/src/store.ts#L10212) `Store/sortIdsCurrentProgress` | `SQLite.all` (10212); `SQLite.prepare` (10212, 10280); `Store.sql` (10212, 10280); `Store.valueListItems` (10220); `rowsById` (10232); `Calculations.globalValue` (10235); `Calculations.unstoredValue` (10236); `Calculations.related` (10242); `SQLite.iterate` (10280) | GATED-STORE |
| [packages/store/src/store.ts:8388](../../packages/store/src/store.ts#L8388) `Store/sortedPage` | `SQLite.iterate` (8388); `SQLite.prepare` (8388, 8403); `Store.sql` (8388, 8403); `SQLite.all` (8403) | CORE |
| [packages/store/src/store.ts:8536](../../packages/store/src/store.ts#L8536) `Store/summaries` | `Calculations.wholeTable` (8536); `Calculations.collect` (8556, 8561) | CORE |
| [packages/store/src/store.ts:8552](../../packages/store/src/store.ts#L8552) `Store/summaries/recs` | `SQLite.iterate` (8552); `SQLite.prepare` (8552); `Store.sql` (8552) | CORE |
| [packages/store/src/store.ts:5270](../../packages/store/src/store.ts#L5270) `Store/takeWebauthnChallenge` | `SQLite.get` (5270); `SQLite.prepare` (5270, 5272); `Store.sql` (5270, 5272) | CORE |
| [packages/store/src/store.ts:8280](../../packages/store/src/store.ts#L8280) `Store/timeFind` | `Store.query` (8280, 8284, 8285); `Store.recordCount` (8287) | CORE |
| [packages/store/src/store.ts:6748](../../packages/store/src/store.ts#L6748) `Store/toRecord` | `Calculations.value` (6748, 6758); `Calculations.globalValue` (6752); `Calculations.unstoredStyled` (6757) | CORE |
| [packages/store/src/store.ts:5156](../../packages/store/src/store.ts#L5156) `Store/totpAccounts` | `SQLite.all` (5156); `SQLite.prepare` (5156); `Store.sql` (5156) | CORE |
| [packages/store/src/store.ts:1436](../../packages/store/src/store.ts#L1436) `Store/trial` | `Store.sql` (1436) | CORE |
| [packages/store/src/store.ts:1441](../../packages/store/src/store.ts#L1441) `Store/trial/undo` | `Store.sql` (1441) | CORE |
| [packages/store/src/store.ts:10322](../../packages/store/src/store.ts#L10322) `Store/truncate/run` | `Store.sql` (10322, 10324, 10331, 10333, 10335, 10336); `SQLite.prepare` (10324, 10331); `SQLite.all` (10326) | CORE |
| [packages/store/src/store.ts:3189](../../packages/store/src/store.ts#L3189) `Store/unmigratedAccounts` | `SQLite.all` (3189); `SQLite.prepare` (3189); `Store.sql` (3189) | CORE |
| [packages/store/src/store.ts:4252](../../packages/store/src/store.ts#L4252) `Store/unusedAccess` | `SQLite.get` (4252); `SQLite.prepare` (4252, 4261); `Store.sql` (4252, 4261); `SQLite.all` (4261) | CORE |
| [packages/store/src/store.ts:4300](../../packages/store/src/store.ts#L4300) `Store/unusedObjects` | `SQLite.get` (4300); `SQLite.prepare` (4300, 4303); `Store.sql` (4300, 4303); `SQLite.all` (4303) | CORE |
| [packages/store/src/store.ts:5387](../../packages/store/src/store.ts#L5387) `Store/unusedRecoveryHashes` | `SQLite.all` (5387); `SQLite.prepare` (5387); `Store.sql` (5387) | CORE |
| [packages/store/src/store.ts:4082](../../packages/store/src/store.ts#L4082) `Store/unusualAccess` | `Store.auditLog` (4082, 4148) | CORE |
| [packages/store/src/store.ts:8980](../../packages/store/src/store.ts#L8980) `Store/update` | `Store.row` (8980); `Store.sql` (9010, 9011, 9050, 9053) | CORE |
| [packages/store/src/store.ts:9013](../../packages/store/src/store.ts#L9013) `Store/update/undo` | `Store.sql` (9013) | CORE |
| [packages/store/src/store.ts:9443](../../packages/store/src/store.ts#L9443) `Store/updatePortals` | `Store.row` (9443, 9479); `relatedRows` (9480) | CORE |
| [packages/store/src/store.ts:9453](../../packages/store/src/store.ts#L9453) `Store/updatePortals/portal/related` | `relatedIdList` (9453) | CORE |
| [packages/store/src/store.ts:9425](../../packages/store/src/store.ts#L9425) `Store/updateRelated` | `relatedRows` (9425) | CORE |
| [packages/store/src/store.ts:4338](../../packages/store/src/store.ts#L4338) `Store/usageCounting` | `SQLite.get` (4338); `SQLite.prepare` (4338); `Store.sql` (4338) | CORE |
| [packages/store/src/store.ts:8218](../../packages/store/src/store.ts#L8218) `Store/userPrefs` | `SQLite.all` (8218); `SQLite.prepare` (8218); `Store.sql` (8218) | CORE |
| [packages/store/src/store.ts:7128](../../packages/store/src/store.ts#L7128) `Store/valueListItemsCurrent` | `Store.valueListItems` (7128); `Store.get` (7142); `relatedRows` (7143); `Store.row` (7143); `SQLite.iterate` (7145); `SQLite.prepare` (7145); `Store.sql` (7145); `Calculations.related` (7155); `Calculations.value` (7159, 7160) | GATED-STORE |
| [packages/store/src/store.ts:9635](../../packages/store/src/store.ts#L9635) `Store/vaultHeld` | `SQLite.get` (9635); `SQLite.prepare` (9635); `Store.sql` (9635) | CORE |
| [packages/store/src/store.ts:5185](../../packages/store/src/store.ts#L5185) `Store/verifyTotp` | `SQLite.get` (5185); `SQLite.prepare` (5185, 5191); `Store.sql` (5185, 5191) | CORE |
| [packages/store/src/store.ts:1932](../../packages/store/src/store.ts#L1932) `Store/versionNumber` | `SQLite.get` (1932); `SQLite.prepare` (1932); `Store.sql` (1932) | CORE |
| [packages/store/src/store.ts:1888](../../packages/store/src/store.ts#L1888) `Store/versionTriggers` | `SQLite.get` (1888); `SQLite.prepare` (1888, 1893, 1894); `Store.sql` (1888, 1893, 1894, 1911, 1913, 1914, 1916); `SQLite.all` (1893, 1894) | CORE |
| [packages/store/src/store.ts:1856](../../packages/store/src/store.ts#L1856) `Store/warmSummariesCurrent` | `Calculations.wholeTable` (1856) | CORE |
| [packages/store/src/store.ts:3678](../../packages/store/src/store.ts#L3678) `Store/webViewerChecked` | `SQLite.get` (3678); `SQLite.prepare` (3678); `Store.sql` (3678) | CORE |
| [packages/store/src/store.ts:1627](../../packages/store/src/store.ts#L1627) `Store/withWriteTransaction` | `Store.sql` (1627, 1638, 1644, 1646, 1646) | CORE |
| [packages/store/src/store.ts:6683](../../packages/store/src/store.ts#L6683) `Store/wordIndex` | `Store.sql` (6683, 6691, 6696); `Store.recordCount` (6695); `SQLite.get` (6696); `SQLite.prepare` (6696) | CORE |
| [packages/store/src/store.ts:7819](../../packages/store/src/store.ts#L7819) `Store/writeExternalFile` | `Store.evaluateEach` (7819); `SQLite.prepare` (7842); `Store.sql` (7842) | CORE |
| [packages/store/src/store.ts:7843](../../packages/store/src/store.ts#L7843) `Store/writeExternalFile/taken` | `SQLite.get` (7843) | CORE |
| [packages/store/src/store.ts:5020](../../packages/store/src/store.ts#L5020) `Store/writeObjectUseRows` | `SQLite.prepare` (5020, 5021, 5026); `Store.sql` (5020, 5021, 5026) | CORE |
| [packages/store/src/store.ts:1987](../../packages/store/src/store.ts#L1987) `Store/writeToken` | `SQLite.get` (1987); `SQLite.prepare` (1987); `Store.sql` (1987) | CORE |
| [packages/store/src/store.ts:4992](../../packages/store/src/store.ts#L4992) `Store/writeUsage` | `Store.sql` (4992, 4993, 4995, 4999, 5001) | CORE |
| [packages/store/src/store.ts:5008](../../packages/store/src/store.ts#L5008) `Store/writeUsageRows` | `SQLite.prepare` (5008, 5009, 5015); `Store.sql` (5008, 5009, 5015) | CORE |
| [packages/store/src/store.ts:6404](../../packages/store/src/store.ts#L6404) `Store/design` | `SQLite.get` (6404) | CORE |
| [packages/store/src/store.ts:6426](../../packages/store/src/store.ts#L6426) `Store/themes` | `SQLite.get` (6426) | CORE |
| [packages/store/src/store.ts:5347](../../packages/store/src/store.ts#L5347) `Store/verifyPasskeyCredential` | `SQLite.get` (5347); `SQLite.prepare` (5347, 5359); `Store.sql` (5347, 5359) | CORE |
| [packages/store/src/store.ts:6264](../../packages/store/src/store.ts#L6264) `Store/passwordState` | `SQLite.get` (6264); `SQLite.prepare` (6264); `Store.sql` (6264) | CORE |
| [packages/store/src/store.ts:9578](../../packages/store/src/store.ts#L9578) `Store/deleteVisibility` | `Store.canViewRecord` (9578) | CORE |
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
| [packages/server/src/hosted-record.ts:158](../../packages/server/src/hosted-record.ts#L158) `approveRestoredFiles` | `SQLite.get` (158); `SQLite.prepare` (158, 162) | OPERATOR |
| [packages/server/src/hosted-record.ts:59](../../packages/server/src/hosted-record.ts#L59) `peekInstance` | `SQLite.get` (59); `SQLite.prepare` (59) | OPERATOR |
| [packages/server/src/hosted-record.ts:88](../../packages/server/src/hosted-record.ts#L88) `markStore` | `SQLite.prepare` (88) | OPERATOR |
| [packages/server/src/inbound-hooks.ts:290](../../packages/server/src/inbound-hooks.ts#L290) `InboundHooks/claim` | `SQLite.get` (290, 298, 299); `SQLite.prepare` (290, 294, 295, 298, 299, 301) | AUTH |
<!-- end generated read-gate inventory -->
