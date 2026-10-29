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
| [packages/cli/src/diagnostics.ts:205](../../packages/cli/src/diagnostics.ts#L205) `designCopy` | `SQLite.all` (205); `SQLite.prepare` (205, 208) | OPERATOR |
| [packages/cli/src/diagnostics.ts:445](../../packages/cli/src/diagnostics.ts#L445) `diagnostics` | `SQLite.get` (445); `SQLite.prepare` (445, 449); `SQLite.all` (449) | OPERATOR |
| [packages/cli/src/doctor.ts:139](../../packages/cli/src/doctor.ts#L139) `accountChecks` | `SQLite.all` (139); `SQLite.prepare` (139) | OPERATOR |
| [packages/cli/src/main.ts:711](../../packages/cli/src/main.ts#L711) `accountsWithPasswordOff` | `SQLite.all` (711); `SQLite.prepare` (711) | OPERATOR |
| [packages/cli/src/main.ts:740](../../packages/cli/src/main.ts#L740) `hostedRead` | `SQLite.all` (740, 743); `SQLite.prepare` (740, 743); `Store.sql` (740, 743) | OPERATOR |
| [packages/cli/src/main.ts:2411](../../packages/cli/src/main.ts#L2411) `main` | `Store.orphanContainerReport` (2411); `Store.auditLog` (2884); `SQLite.get` (3143); `SQLite.prepare` (3143) | OPERATOR |
| [packages/scripts/src/data-api-step.ts:104](../../packages/scripts/src/data-api-step.ts#L104) `respond` | `Store.get` (104, 131, 140); `Store.find` (105, 117) | SCRIPT |
| [packages/scripts/src/engine.ts:8130](../../packages/scripts/src/engine.ts#L8130) `ScriptEngine/containerFile` | `Store.get` (8130); `Store.containerId` (8131); `Store.container` (8132) | SCRIPT |
| [packages/scripts/src/engine.ts:5727](../../packages/scripts/src/engine.ts#L5727) `ScriptEngine/design` | `Store.valueListItems` (5727) | SCRIPT |
| [packages/scripts/src/engine.ts:6465](../../packages/scripts/src/engine.ts#L6465) `ScriptEngine/exportField` | `Store.get` (6465); `Store.containerId` (6466); `Store.container` (6468) | SCRIPT |
| [packages/scripts/src/engine.ts:8545](../../packages/scripts/src/engine.ts#L8545) `ScriptEngine/fileMakerRows` | `Store.findIds` (8545); `Store.get` (8550) | SCRIPT |
| [packages/scripts/src/engine.ts:2340](../../packages/scripts/src/engine.ts#L2340) `ScriptEngine/foundSet` | `Store.findIds` (2340) | SCRIPT |
| [packages/scripts/src/engine.ts:5567](../../packages/scripts/src/engine.ts#L5567) `ScriptEngine/get` | `Store.findIds` (5567); `Store.canViewRecord` (5660); `Store.get` (5696) | SCRIPT |
| [packages/scripts/src/engine.ts:1996](../../packages/scripts/src/engine.ts#L1996) `ScriptEngine/goToLayout` | `Store.findIds` (1996) | SCRIPT |
| [packages/scripts/src/engine.ts:8316](../../packages/scripts/src/engine.ts#L8316) `ScriptEngine/importRecords` | `Store.get` (8316) | SCRIPT |
| [packages/scripts/src/engine.ts:5839](../../packages/scripts/src/engine.ts#L5839) `ScriptEngine/lookupNext` | `Store.get` (5839); `Store.row` (5840); `Calculations.context` (5842) | SCRIPT |
| [packages/scripts/src/engine.ts:5373](../../packages/scripts/src/engine.ts#L5373) `ScriptEngine/newCalcContext/executeSQL` | `Calculations.executeSQL` (5373) | SCRIPT |
| [packages/scripts/src/engine.ts:5381](../../packages/scripts/src/engine.ts#L5381) `ScriptEngine/newCalcContext/persistentData` | `Store.persistentData` (5381) | SCRIPT |
| [packages/scripts/src/engine.ts:5382](../../packages/scripts/src/engine.ts#L5382) `ScriptEngine/newCalcContext/persistentDataIds` | `Store.persistentDataIds` (5382) | SCRIPT |
| [packages/scripts/src/engine.ts:8585](../../packages/scripts/src/engine.ts#L8585) `ScriptEngine/newRecord` | `Store.findIds` (8585) | SCRIPT |
| [packages/scripts/src/engine.ts:8956](../../packages/scripts/src/engine.ts#L8956) `ScriptEngine/quickFind` | `Store.get` (8956) | SCRIPT |
| [packages/scripts/src/engine.ts:5781](../../packages/scripts/src/engine.ts#L5781) `ScriptEngine/record` | `Store.get` (5781) | SCRIPT |
| [packages/scripts/src/engine.ts:5942](../../packages/scripts/src/engine.ts#L5942) `ScriptEngine/relatedIds` | `Store.findIds` (5942); `rowsById` (5950); `Store.select` (5954); `Store.matchIds` (5968); `Store.viewableIds` (5991) | SCRIPT |
| [packages/scripts/src/engine.ts:5976](../../packages/scripts/src/engine.ts#L5976) `ScriptEngine/relatedIds/matching` | `Store.matchIds` (5976) | SCRIPT |
| [packages/scripts/src/engine.ts:6619](../../packages/scripts/src/engine.ts#L6619) `ScriptEngine/relookup` | `Store.get` (6619) | SCRIPT |
| [packages/scripts/src/engine.ts:3520](../../packages/scripts/src/engine.ts#L3520) `ScriptEngine/revertTransaction` | `Store.findIds` (3520) | SCRIPT |
| [packages/scripts/src/engine.ts:3373](../../packages/scripts/src/engine.ts#L3373) `ScriptEngine/findIdsCooperative` | `Store.findIdsProgress` (3373) | SCRIPT |
| [packages/scripts/src/engine.ts:3387](../../packages/scripts/src/engine.ts#L3387) `ScriptEngine/sortIdsCooperative` | `Store.sortIdsProgress` (3387) | SCRIPT |
| [packages/scripts/src/engine.ts:3415](../../packages/scripts/src/engine.ts#L3415) `ScriptEngine/sortIdsProgress` | `Store.sortIdsProgress` (3415); `Store.valueListItems` (3421) | SCRIPT |
| [packages/scripts/src/engine.ts:7386](../../packages/scripts/src/engine.ts#L7386) `ScriptEngine/sourceValue` | `Store.get` (7386); `Store.containerId` (7387); `Store.container` (7388) | SCRIPT |
| [packages/scripts/src/engine.ts:3324](../../packages/scripts/src/engine.ts#L3324) `ScriptEngine/sqlByNaturalLanguage` | `Calculations.translateSQL` (3324); `Calculations.executeSQL` (3331) | SCRIPT |
| [packages/scripts/src/engine.ts:4100](../../packages/scripts/src/engine.ts#L4100) `ScriptEngine/step` | `Store.fieldIndex` (4100) | SCRIPT |
| [packages/scripts/src/engine.ts:5814](../../packages/scripts/src/engine.ts#L5814) `ScriptEngine/valueOf` | `Store.findIds` (5814, 5814); `Store.containerId` (5822) | SCRIPT |
| [packages/scripts/src/engine.ts:9348](../../packages/scripts/src/engine.ts#L9348) `clearRecords` | `SQLite.all` (9348); `SQLite.prepare` (9348) | SCRIPT |
| [packages/scripts/src/recorder.ts:83](../../packages/scripts/src/recorder.ts#L83) `lastSeq` | `Store.auditLog` (83) | DESIGN |
| [packages/scripts/src/recorder.ts:121](../../packages/scripts/src/recorder.ts#L121) `recordRun` | `Store.auditLog` (121) | DESIGN |
| [packages/scripts/src/script-tests.ts:213](../../packages/scripts/src/script-tests.ts#L213) `runCase` | `Store.findIds` (213); `Store.auditLog` (220, 221, 265); `Store.evaluateEach` (248) | DESIGN |
| [packages/scripts/src/testrun.ts:306](../../packages/scripts/src/testrun.ts#L306) `recordWith` | `Store.evaluateEach` (306) | DESIGN |
| [packages/scripts/src/testrun.ts:199](../../packages/scripts/src/testrun.ts#L199) `seedSelections` | `Calculations.globalValue` (199); `Store.find` (204) | DESIGN |
| [packages/scripts/src/testrun.ts:338](../../packages/scripts/src/testrun.ts#L338) `testRun` | `Store.evaluateEach` (338) | DESIGN |
| [packages/scripts/src/testrun.ts:270](../../packages/scripts/src/testrun.ts#L270) `testScript` | `Store.findIds` (270) | DESIGN |
| [packages/server/src/admin.ts:2368](../../packages/server/src/admin.ts#L2368) `Admin/audit` | `Store.auditLog` (2368) | ADMIN |
| [packages/server/src/admin.ts:1089](../../packages/server/src/admin.ts#L1089) `Admin/handle` | `Store.externalContainerReport` (1089); `Store.orphanContainerReport` (1094, 1098) | ADMIN |
| [packages/server/src/admin.ts:2808](../../packages/server/src/admin.ts#L2808) `Admin/status` | `Store.externalContainerCount` (2808) | ADMIN |
| [packages/server/src/admin.ts:2451](../../packages/server/src/admin.ts#L2451) `Admin/viewAs` | `Store.find` (2451) | ADMIN |
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
| [packages/server/src/backup.ts:1014](../../packages/server/src/backup.ts#L1014) `accountDifferences/read` | `SQLite.all` (1014, 1016); `SQLite.prepare` (1014, 1016) | OPERATOR |
| [packages/server/src/backup.ts:278](../../packages/server/src/backup.ts#L278) `backupOnceHeld` | `SQLite.get` (278); `SQLite.prepare` (278) | OPERATOR |
| [packages/server/src/backup.ts:1087](../../packages/server/src/backup.ts#L1087) `columnInfo` | `SQLite.all` (1087); `SQLite.prepare` (1087) | OPERATOR |
| [packages/server/src/backup.ts:1071](../../packages/server/src/backup.ts#L1071) `credentialsReadable` | `SQLite.all` (1071); `SQLite.prepare` (1071) | OPERATOR |
| [packages/server/src/backup.ts:1041](../../packages/server/src/backup.ts#L1041) `readNames` | `SQLite.all` (1041); `SQLite.prepare` (1041) | OPERATOR |
| [packages/server/src/backup.ts:1122](../../packages/server/src/backup.ts#L1122) `reconcileCredentials` | `SQLite.all` (1122, 1144, 1159, 1169, 1175); `SQLite.prepare` (1122, 1130, 1144, 1146, 1159, 1160, 1167, 1169, 1170, 1175, 1176, 1180, 1181, 1182); `SQLite.get` (1130, 1180) | OPERATOR |
| [packages/server/src/backup.ts:1149](../../packages/server/src/backup.ts#L1149) `reconcileCredentials/accountColumns` | `SQLite.all` (1149); `SQLite.prepare` (1149) | OPERATOR |
| [packages/server/src/backup.ts:1125](../../packages/server/src/backup.ts#L1125) `reconcileCredentials/has` | `SQLite.all` (1125); `SQLite.prepare` (1125) | OPERATOR |
| [packages/server/src/backup.ts:1297](../../packages/server/src/backup.ts#L1297) `stageRestorePoint` | `SQLite.get` (1297, 1299, 1300); `SQLite.prepare` (1297, 1299, 1300) | OPERATOR |
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
| [packages/server/src/dataapi.ts:2070](../../packages/server/src/dataapi.ts#L2070) `DataApi/route` | `Store.get` (2070, 2291, 2292, 2315, 2323, 2370, 2394, 2414, 2451); `Store.valueListItems` (2085); `Store.find` (2246, 2294, 2485); `Store.findIds` (2250, 2490); `Store.query` (2490) | REST |
| [packages/server/src/dataapi.ts:2198](../../packages/server/src/dataapi.ts#L2198) `DataApi/route/recordOut` | `Store.portalCounts` (2198) | REST |
| [packages/server/src/dataapi.ts:2234](../../packages/server/src/dataapi.ts#L2234) `DataApi/route/shownAs` | `Store.get` (2234) | REST |
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
| [packages/server/src/hosted-record.ts:207](../../packages/server/src/hosted-record.ts#L207) `approveRestoredFiles` | `SQLite.get` (207); `SQLite.prepare` (207, 211) | OPERATOR |
| [packages/server/src/hosted-record.ts:110](../../packages/server/src/hosted-record.ts#L110) `markStore` | `SQLite.get` (110); `SQLite.prepare` (110, 114) | OPERATOR |
| [packages/server/src/hosted-record.ts:69](../../packages/server/src/hosted-record.ts#L69) `peekInstance` | `SQLite.get` (69); `SQLite.prepare` (69) | OPERATOR |
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
| [packages/server/src/oauth.ts:883](../../packages/server/src/oauth.ts#L883) `OAuthServer/accessAllowed` | `SQLite.get` (883); `SQLite.prepare` (883) | AUTH |
| [packages/server/src/oauth.ts:509](../../packages/server/src/oauth.ts#L509) `OAuthServer/authorize` | `SQLite.get` (509); `SQLite.prepare` (509, 513, 515, 522, 545, 546) | AUTH |
| [packages/server/src/oauth.ts:490](../../packages/server/src/oauth.ts#L490) `OAuthServer/authorize/done` | `SQLite.prepare` (490, 491) | AUTH |
| [packages/server/src/oauth.ts:389](../../packages/server/src/oauth.ts#L389) `OAuthServer/client` | `SQLite.get` (389); `SQLite.prepare` (389) | AUTH |
| [packages/server/src/oauth.ts:193](../../packages/server/src/oauth.ts#L193) `OAuthServer/constructor` | `SQLite.all` (193); `SQLite.prepare` (193, 220, 222, 231, 232, 235); `SQLite.iterate` (220); `SQLite.get` (222); `Store.sql` (222, 231) | AUTH |
| [packages/server/src/oauth.ts:186](../../packages/server/src/oauth.ts#L186) `OAuthServer/constructor/cols` | `SQLite.all` (186); `SQLite.prepare` (186) | AUTH |
| [packages/server/src/oauth.ts:866](../../packages/server/src/oauth.ts#L866) `OAuthServer/endGrant` | `SQLite.prepare` (866, 867); `SQLite.all` (867) | AUTH |
| [packages/server/src/oauth.ts:822](../../packages/server/src/oauth.ts#L822) `OAuthServer/issue/write` | `SQLite.get` (822); `SQLite.prepare` (822, 823, 824) | AUTH |
| [packages/server/src/oauth.ts:879](../../packages/server/src/oauth.ts#L879) `OAuthServer/managedAccess` | `SQLite.get` (879); `SQLite.prepare` (879) | AUTH |
| [packages/server/src/oauth.ts:369](../../packages/server/src/oauth.ts#L369) `OAuthServer/register` | `SQLite.prepare` (369, 370, 371, 372, 373); `SQLite.get` (370, 372) | AUTH |
| [packages/server/src/oauth.ts:896](../../packages/server/src/oauth.ts#L896) `OAuthServer/revoke` | `SQLite.get` (896, 897, 909, 910); `SQLite.prepare` (896, 897, 903, 909, 910, 916) | AUTH |
| [packages/server/src/oauth.ts:842](../../packages/server/src/oauth.ts#L842) `OAuthServer/sweep` | `SQLite.all` (842); `SQLite.prepare` (842, 844, 845, 846, 847) | AUTH |
| [packages/server/src/oauth.ts:701](../../packages/server/src/oauth.ts#L701) `OAuthServer/token` | `SQLite.get` (701, 732, 734, 737, 750); `SQLite.prepare` (701, 732, 734, 737, 746, 749, 750, 750, 752, 754) | AUTH |
| [packages/server/src/oauth.ts:85](../../packages/server/src/oauth.ts#L85) `legacyPasswordMark` | `SQLite.get` (85); `SQLite.prepare` (85); `Store.sql` (85) | AUTH |
| [packages/server/src/oauth.ts:72](../../packages/server/src/oauth.ts#L72) `storedName` | `SQLite.get` (72); `SQLite.prepare` (72); `Store.sql` (72) | AUTH |
| [packages/server/src/odata-crossjoin-worker.ts:40](../../packages/server/src/odata-crossjoin-worker.ts#L40) `join` | `SQLite.prepare` (40, 49, 58, 73); `SQLite.get` (58); `SQLite.all` (73) | JOIN |
| [packages/server/src/odata.ts:1504](../../packages/server/src/odata.ts#L1504) `ODataEndpoint/applied` | `Store.selectIds` (1504); `SQLite.prepare` (1519, 1556, 1569, 1573); `Store.getMany` (1530); `SQLite.all` (1569); `SQLite.get` (1573) | ODATA |
| [packages/server/src/odata.ts:1623](../../packages/server/src/odata.ts#L1623) `ODataEndpoint/crossjoined` | `Store.selectIds` (1623); `Store.getMany` (1652, 1687) | ODATA |
| [packages/server/src/odata.ts:1723](../../packages/server/src/odata.ts#L1723) `ODataEndpoint/entity` | `Store.getMany` (1723) | ODATA |
| [packages/server/src/odata.ts:1383](../../packages/server/src/odata.ts#L1383) `ODataEndpoint/lambdaFor` | `Store.selectIds` (1383); `Store.row` (1392); `relatedIdList` (1393) | ODATA |
| [packages/server/src/odata.ts:1446](../../packages/server/src/odata.ts#L1446) `ODataEndpoint/list` | `Store.selectIds` (1446); `Store.getMany` (1451); `Store.computeValues` (1452); `Store.countIds` (1457) | ODATA |
| [packages/server/src/odata.ts:1822](../../packages/server/src/odata.ts#L1822) `ODataEndpoint/property` | `Store.containerId` (1822); `Store.container` (1828) | ODATA |
| [packages/server/src/odata.ts:1764](../../packages/server/src/odata.ts#L1764) `ODataEndpoint/relatedIds` | `Store.row` (1764); `relatedIdList` (1767, 1782); `Store.selectIds` (1771) | ODATA |
| [packages/server/src/odata.ts:1798](../../packages/server/src/odata.ts#L1798) `ODataEndpoint/relatedRecords` | `Store.getMany` (1798) | ODATA |
| [packages/server/src/odata.ts:1058](../../packages/server/src/odata.ts#L1058) `ODataEndpoint/resource` | `Store.countIds` (1058); `Store.get` (1098, 1105, 1212) | ODATA |
| [packages/server/src/odata.ts:1793](../../packages/server/src/odata.ts#L1793) `ODataEndpoint/viewableIn` | `Store.viewableSet` (1793) | ODATA |
| [packages/server/src/oidc.ts:456](../../packages/server/src/oidc.ts#L456) `Oidc/authorizeUrl` | `SQLite.prepare` (456, 459) | AUTH |
| [packages/server/src/oidc.ts:509](../../packages/server/src/oidc.ts#L509) `Oidc/callback` | `SQLite.all` (509); `SQLite.prepare` (509, 513) | AUTH |
| [packages/server/src/oidc.ts:215](../../packages/server/src/oidc.ts#L215) `Oidc/constructor` | `SQLite.all` (215, 225); `SQLite.prepare` (215, 225, 235, 236, 241, 241) | AUTH |
| [packages/server/src/oidc.ts:612](../../packages/server/src/oidc.ts#L612) `Oidc/finish` | `SQLite.prepare` (612, 613, 615); `SQLite.get` (613) | AUTH |
| [packages/server/src/oidc.ts:429](../../packages/server/src/oidc.ts#L429) `Oidc/makeRoom` | `SQLite.get` (429, 431, 433); `SQLite.prepare` (429, 430, 431, 433, 435); `SQLite.all` (430, 435) | AUTH |
| [packages/server/src/oidc.ts:380](../../packages/server/src/oidc.ts#L380) `Oidc/takeGrant` | `SQLite.all` (380); `SQLite.prepare` (380) | AUTH |
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
| [packages/server/src/pgwire.ts:975](../../packages/server/src/pgwire.ts#L975) `Connection/bareNames` | `Store.describe` (975) | SQL |
| [packages/server/src/pgwire.ts:991](../../packages/server/src/pgwire.ts#L991) `Connection/catalog` | `Store.describeTyped` (991) | SQL |
| [packages/server/src/pgwire.ts:1433](../../packages/server/src/pgwire.ts#L1433) `Connection/describe` | `Store.describeTyped` (1433) | SQL |
| [packages/server/src/pgwire.ts:1002](../../packages/server/src/pgwire.ts#L1002) `Connection/run` | `Store.selectIn` (1002); `Store.describeTyped` (1006) | SQL |
| [packages/server/src/pgwire.ts:952](../../packages/server/src/pgwire.ts#L952) `Connection/translate` | `Calculations.translateSQL` (952) | SQL |
| [packages/server/src/pgwire.ts:1200](../../packages/server/src/pgwire.ts#L1200) `Connection/validateSyntax` | `SQLite.prepare` (1200); `Store.sql` (1200) | SQL |
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
| [packages/server/src/webclient.ts:1686](../../packages/server/src/webclient.ts#L1686) `WebClient/aiReplace` | `Store.canView` (1686); `Store.getMany` (1702) | WEB |
| [packages/server/src/webclient.ts:1870](../../packages/server/src/webclient.ts#L1870) `WebClient/button` | `Store.findIds` (1870, 1920); `Store.evaluateEach` (1879, 1880) | WEB |
| [packages/server/src/webclient.ts:1272](../../packages/server/src/webclient.ts#L1272) `WebClient/charts` | `Calculations.context` (1272); `Store.canView` (1300); `Store.evaluateEach` (1309, 1313); `Store.evaluateRows` (1318, 1320) | WEB |
| [packages/server/src/webclient.ts:1263](../../packages/server/src/webclient.ts#L1263) `WebClient/charts/foundSet` | `Store.findIds` (1263) | WEB |
| [packages/server/src/webclient.ts:1303](../../packages/server/src/webclient.ts#L1303) `WebClient/charts/get` | `Store.get` (1303) | WEB |
| [packages/server/src/webclient.ts:689](../../packages/server/src/webclient.ts#L689) `WebClient/explain` | `Store.get` (689); `Store.row` (722, 735) | WEB |
| [packages/server/src/webclient.ts:1492](../../packages/server/src/webclient.ts#L1492) `WebClient/exportRecords` | `Store.getMany` (1492) | WEB |
| [packages/server/src/webclient.ts:1179](../../packages/server/src/webclient.ts#L1179) `WebClient/foundIds` | `Store.findIds` (1179) | WEB |
| [packages/server/src/webclient.ts:1223](../../packages/server/src/webclient.ts#L1223) `WebClient/foundSetPortal` | `Store.foundSetRows` (1223, 1230) | WEB |
| [packages/server/src/webclient.ts:1762](../../packages/server/src/webclient.ts#L1762) `WebClient/groups` | `Store.findIds` (1762); `Store.groupSummaries` (1768) | WEB |
| [packages/server/src/webclient.ts:551](../../packages/server/src/webclient.ts#L551) `WebClient/history` | `Store.get` (551) | WEB |
| [packages/server/src/webclient.ts:748](../../packages/server/src/webclient.ts#L748) `WebClient/index` | `Store.fieldIndex` (748) | WEB |
| [packages/server/src/webclient.ts:838](../../packages/server/src/webclient.ts#L838) `WebClient/menus` | `Store.evaluateEach` (838) | WEB |
| [packages/server/src/webclient.ts:1194](../../packages/server/src/webclient.ts#L1194) `WebClient/records` | `Store.getMany` (1194); `Store.find` (1197) | WEB |
| [packages/server/src/webclient.ts:1140](../../packages/server/src/webclient.ts#L1140) `WebClient/refresh` | `Store.previewRow` (1140); `Store.getMany` (1145); `Store.foundSetRows` (1167) | WEB |
| [packages/server/src/webclient.ts:1386](../../packages/server/src/webclient.ts#L1386) `WebClient/streamExportRecords/nextBatch` | `Store.selectIds` (1386); `Store.getMany` (1392) | WEB |
| [packages/server/src/webclient.ts:1054](../../packages/server/src/webclient.ts#L1054) `WebClient/view` | `Store.evaluateEach` (1054, 1078, 1097); `Store.canView` (1072); `Store.previewRow` (1076, 1098); `Store.get` (1089); `Store.row` (1090, 1090) | WEB |
| [packages/server/src/webclient.ts:1075](../../packages/server/src/webclient.ts#L1075) `WebClient/view/get` | `Store.get` (1075) | WEB |
| [packages/server/src/webclient.ts:2652](../../packages/server/src/webclient.ts#L2652) `foundIds` | `Store.findIds` (2652, 2654) | WEB |
| [packages/server/src/webclient.ts:2573](../../packages/server/src/webclient.ts#L2573) `listItems` | `Store.valueListItems` (2573) | WEB |
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
| [packages/store/src/calc.ts:2388](../../packages/store/src/calc.ts#L2388) `Calculations/beforeWrite` | `relatedRows` (2388); `Calculations.related` (2442); `Calculations.context` (2455) | CORE |
| [packages/store/src/calc.ts:629](../../packages/store/src/calc.ts#L629) `Calculations/collect` | `Calculations.collector` (629) | CALC |
| [packages/store/src/calc.ts:660](../../packages/store/src/calc.ts#L660) `Calculations/collector/add` | `Calculations.related` (660) | CALC |
| [packages/store/src/calc.ts:1693](../../packages/store/src/calc.ts#L1693) `Calculations/columnNames` | `SQLite.all` (1693); `SQLite.prepare` (1693); `Store.sql` (1693) | CALC |
| [packages/store/src/calc.ts:2251](../../packages/store/src/calc.ts#L2251) `Calculations/computeColumn` | `Calculations.statement` (2251); `SQLite.get` (2251); `Calculations.value` (2254) | CALC |
| [packages/store/src/calc.ts:2506](../../packages/store/src/calc.ts#L2506) `Calculations/computeStored` | `Calculations.computeStoredStyled` (2506); `Calculations.value` (2506) | CALC |
| [packages/store/src/calc.ts:2521](../../packages/store/src/calc.ts#L2521) `Calculations/computeStoredStyled` | `Calculations.context` (2521) | CORE |
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
| [packages/store/src/calc.ts:2214](../../packages/store/src/calc.ts#L2214) `Calculations/defineComputedColumn/fm_computed` | `Calculations.related` (2214) | CALC |
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
| [packages/store/src/calc.ts:2182](../../packages/store/src/calc.ts#L2182) `Calculations/shareColumn` | `Store.recordCount` (2182) | CALC |
| [packages/store/src/calc.ts:1704](../../packages/store/src/calc.ts#L1704) `Calculations/statement` | `SQLite.prepare` (1704); `Store.sql` (1704) | CALC |
| [packages/store/src/calc.ts:1540](../../packages/store/src/calc.ts#L1540) `Calculations/storedRelatedValues` | `Calculations.statement` (1540); `SQLite.iterate` (1540) | CALC |
| [packages/store/src/calc.ts:1285](../../packages/store/src/calc.ts#L1285) `Calculations/storedRows` | `SQLite.iterate` (1285); `SQLite.prepare` (1285); `Store.sql` (1285) | CALC |
| [packages/store/src/calc.ts:684](../../packages/store/src/calc.ts#L684) `Calculations/summary` | `Calculations.collect` (684) | CALC |
| [packages/store/src/calc.ts:921](../../packages/store/src/calc.ts#L921) `Calculations/summaryDependencies` | `Store.sql` (921) | CALC |
| [packages/store/src/calc.ts:636](../../packages/store/src/calc.ts#L636) `Calculations/summaryInput` | `Calculations.value` (636) | CALC |
| [packages/store/src/calc.ts:691](../../packages/store/src/calc.ts#L691) `Calculations/tableSummary` | `Calculations.wholeTable` (691) | CALC |
| [packages/store/src/calc.ts:2118](../../packages/store/src/calc.ts#L2118) `Calculations/translateSQL` | `Store.scopedTableSql` (2118, 2150) | CALC |
| [packages/store/src/calc.ts:2557](../../packages/store/src/calc.ts#L2557) `Calculations/uniqueCollision` | `Calculations.value` (2557) | CALC |
| [packages/store/src/calc.ts:580](../../packages/store/src/calc.ts#L580) `Calculations/unstoredValue` | `Calculations.unstoredStyled` (580); `Calculations.value` (580) | CALC |
| [packages/store/src/calc.ts:2584](../../packages/store/src/calc.ts#L2584) `Calculations/validate` | `Calculations.value` (2584); `Store.valueListItems` (2605); `Calculations.context` (2619) | CALC |
| [packages/store/src/calc.ts:2570](../../packages/store/src/calc.ts#L2570) `Calculations/validate/fail` | `Calculations.context` (2570) | CALC |
| [packages/store/src/calc.ts:530](../../packages/store/src/calc.ts#L530) `Calculations/value` | `Calculations.globalValue` (530) | CALC |
| [packages/store/src/calc.ts:960](../../packages/store/src/calc.ts#L960) `Calculations/wholeTable` | `rowsById` (960); `Store.viewableIds` (960); `Calculations.collect` (962, 1052); `Calculations.value` (1023); `Store.sql` (1031, 1039) | CALC |
| [packages/store/src/calc.ts:2766](../../packages/store/src/calc.ts#L2766) `containerValue` | `Store.containerInfo` (2766); `Store.containerRange` (2773); `Store.container` (2774) | CALC |
| [packages/store/src/calc.ts:2782](../../packages/store/src/calc.ts#L2782) `containerValue/read` | `Store.container` (2782) | CALC |
| [packages/store/src/calc.ts:2795](../../packages/store/src/calc.ts#L2795) `containerValue/value` | `Store.containerRange` (2795) | CALC |
| [packages/store/src/calc.ts:2681](../../packages/store/src/calc.ts#L2681) `nearest` | `SQLite.get` (2681); `SQLite.prepare` (2681); `Store.sql` (2681) | CALC |
| [packages/store/src/calc.ts:3226](../../packages/store/src/calc.ts#L3226) `rowsById/flush` | `Calculations.statement` (3226); `SQLite.iterate` (3226) | CALC |
| [packages/store/src/calc.ts:2913](../../packages/store/src/calc.ts#L2913) `sameValuesElsewhere` | `SQLite.all` (2913); `SQLite.prepare` (2913, 2920, 2922); `Store.sql` (2913, 2920, 2922); `Calculations.value` (2915); `SQLite.get` (2920, 2922) | CALC |
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
| [packages/store/src/import.ts:92](../../packages/store/src/import.ts#L92) `addExternalSizeColumn` | `SQLite.all` (92); `SQLite.prepare` (92) | OPERATOR |
| [packages/store/src/import.ts:233](../../packages/store/src/import.ts#L233) `applyFileAccountStatus` | `SQLite.get` (233, 235); `SQLite.prepare` (233, 235, 237, 249) | OPERATOR |
| [packages/store/src/import.ts:270](../../packages/store/src/import.ts#L270) `createStore` | `SQLite.prepare` (270, 282) | OPERATOR |
| [packages/store/src/import.ts:189](../../packages/store/src/import.ts#L189) `importDesigns` | `SQLite.all` (189); `SQLite.prepare` (189, 203, 206, 209, 211); `SQLite.get` (203, 206) | OPERATOR |
| [packages/store/src/import.ts:406](../../packages/store/src/import.ts#L406) `importFmp12` | `SQLite.prepare` (406, 417, 423, 429, 433, 448, 459, 536, 537, 538); `SQLite.get` (423, 448); `SQLite.all` (429) | OPERATOR |
| [packages/store/src/import.ts:397](../../packages/store/src/import.ts#L397) `importFmp12/save` | `SQLite.prepare` (397) | OPERATOR |
| [packages/store/src/import.ts:139](../../packages/store/src/import.ts#L139) `moveAddedImages` | `SQLite.prepare` (139, 149, 165, 166); `SQLite.get` (142); `SQLite.all` (166) | OPERATOR |
| [packages/store/src/import.ts:294](../../packages/store/src/import.ts#L294) `needsDesigns` | `SQLite.get` (294); `SQLite.prepare` (294) | OPERATOR |
| [packages/store/src/import.ts:125](../../packages/store/src/import.ts#L125) `nextImageId` | `SQLite.get` (125); `SQLite.prepare` (125) | OPERATOR |
| [packages/store/src/import.ts:341](../../packages/store/src/import.ts#L341) `readState` | `SQLite.get` (341); `SQLite.prepare` (341) | OPERATOR |
| [packages/store/src/import.ts:104](../../packages/store/src/import.ts#L104) `writeDesign` | `SQLite.prepare` (104, 108) | OPERATOR |
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
| [packages/store/src/store.ts:5241](../../packages/store/src/store.ts#L5241) `Store/accountIdentityId` | `SQLite.get` (5241, 5247); `SQLite.prepare` (5241, 5246, 5247); `Store.sql` (5241, 5246, 5247) | CORE |
| [packages/store/src/store.ts:5235](../../packages/store/src/store.ts#L5235) `Store/accountIdentityIdIfSet` | `SQLite.get` (5235); `SQLite.prepare` (5235); `Store.sql` (5235) | CORE |
| [packages/store/src/store.ts:5197](../../packages/store/src/store.ts#L5197) `Store/accountInactive` | `SQLite.get` (5197); `SQLite.prepare` (5197); `Store.sql` (5197) | CORE |
| [packages/store/src/store.ts:5394](../../packages/store/src/store.ts#L5394) `Store/accountLocalOnly` | `SQLite.get` (5394); `SQLite.prepare` (5394); `Store.sql` (5394) | CORE |
| [packages/store/src/store.ts:6263](../../packages/store/src/store.ts#L6263) `Store/accountPrivilegeSet` | `SQLite.get` (6263); `SQLite.prepare` (6263); `Store.sql` (6263) | CORE |
| [packages/store/src/store.ts:5399](../../packages/store/src/store.ts#L5399) `Store/accountRequires2fa` | `SQLite.get` (5399); `SQLite.prepare` (5399); `Store.sql` (5399) | CORE |
| [packages/store/src/store.ts:5619](../../packages/store/src/store.ts#L5619) `Store/accountUsage` | `SQLite.get` (5619); `SQLite.prepare` (5619, 5620); `Store.sql` (5619, 5620); `SQLite.all` (5620); `Store.auditLog` (5636) | CORE |
| [packages/store/src/store.ts:3654](../../packages/store/src/store.ts#L3654) `Store/accounts` | `SQLite.all` (3654); `SQLite.prepare` (3654); `Store.sql` (3654) | CORE |
| [packages/store/src/store.ts:3650](../../packages/store/src/store.ts#L3650) `Store/accountsSharingLockout` | `SQLite.all` (3650); `SQLite.prepare` (3650); `Store.sql` (3650) | CORE |
| [packages/store/src/store.ts:8375](../../packages/store/src/store.ts#L8375) `Store/addContainer` | `SQLite.all` (8375); `SQLite.prepare` (8375, 8380, 8394, 8398, 8399); `Store.sql` (8375, 8380, 8394, 8396, 8398, 8399, 8401, 8404); `SQLite.get` (8385); `Store.containerRange` (8387) | CORE |
| [packages/store/src/store.ts:8421](../../packages/store/src/store.ts#L8421) `Store/addExternalContainer` | `SQLite.prepare` (8421); `Store.sql` (8421) | CORE |
| [packages/store/src/store.ts:8898](../../packages/store/src/store.ts#L8898) `Store/addFieldIndex` | `Store.sql` (8898) | CORE |
| [packages/store/src/store.ts:7074](../../packages/store/src/store.ts#L7074) `Store/addImage` | `Store.sql` (7074, 7075); `SQLite.prepare` (7075) | CORE |
| [packages/store/src/store.ts:6313](../../packages/store/src/store.ts#L6313) `Store/addProvisionedAccount` | `SQLite.get` (6313); `SQLite.prepare` (6313, 6317); `Store.sql` (6313, 6317) | CORE |
| [packages/store/src/store.ts:7493](../../packages/store/src/store.ts#L7493) `Store/addRelated` | `relatedRows` (7493); `rowsById` (7526); `firstRelatedEach` (7549) | CORE |
| [packages/store/src/store.ts:3672](../../packages/store/src/store.ts#L3672) `Store/agentNeedsApproval` | `SQLite.get` (3672); `SQLite.prepare` (3672); `Store.sql` (3672) | CORE |
| [packages/store/src/store.ts:6527](../../packages/store/src/store.ts#L6527) `Store/allowedIds` | `SQLite.iterate` (6527); `SQLite.prepare` (6527); `Store.sql` (6527) | CORE |
| [packages/store/src/store.ts:5676](../../packages/store/src/store.ts#L5676) `Store/apiToken` | `SQLite.get` (5676); `SQLite.prepare` (5676, 5694); `Store.sql` (5676, 5694) | CORE |
| [packages/store/src/store.ts:5652](../../packages/store/src/store.ts#L5652) `Store/apiTokens` | `SQLite.all` (5652); `SQLite.prepare` (5652); `Store.sql` (5652) | CORE |
| [packages/store/src/store.ts:3113](../../packages/store/src/store.ts#L3113) `Store/appendSecurityRow` | `Store.sql` (3113) | CORE |
| [packages/store/src/store.ts:4012](../../packages/store/src/store.ts#L4012) `Store/appendSecurityEvent` | `Store.sql` (4012) | CORE |
| [packages/store/src/store.ts:5017](../../packages/store/src/store.ts#L5017) `Store/applyAccountImport` | `Store.sql` (5017, 5025, 5054); `SQLite.get` (5025); `SQLite.prepare` (5025, 5054) | CORE |
| [packages/store/src/store.ts:2426](../../packages/store/src/store.ts#L2426) `Store/applyDesign` | `Store.sql` (2426, 2427, 2440, 2443, 2448, 2464, 2467, 2467); `SQLite.prepare` (2443, 2448) | CORE |
| [packages/store/src/store.ts:3868](../../packages/store/src/store.ts#L3868) `Store/approvePending` | `SQLite.get` (3868); `SQLite.prepare` (3868, 3879); `Store.sql` (3868, 3879) | CORE |
| [packages/store/src/store.ts:2908](../../packages/store/src/store.ts#L2908) `Store/audit` | `Store.sql` (2908) | CORE |
| [packages/store/src/store.ts:2528](../../packages/store/src/store.ts#L2528) `Store/auditLog` | `SQLite.all` (2528); `SQLite.prepare` (2528); `Store.sql` (2528) | CORE |
| [packages/store/src/store.ts:1956](../../packages/store/src/store.ts#L1956) `Store/backup` | `Store.sql` (1956) | CORE |
| [packages/store/src/store.ts:3678](../../packages/store/src/store.ts#L3678) `Store/blankPasswordAccounts` | `SQLite.all` (3678); `SQLite.prepare` (3678); `Store.sql` (3678) | CORE |
| [packages/store/src/store.ts:9484](../../packages/store/src/store.ts#L9484) `Store/canView` | `Store.canView` (9484); `Store.row` (9485) | GATED-STORE |
| [packages/store/src/store.ts:9466](../../packages/store/src/store.ts#L9466) `Store/canViewRecord` | `SQLite.get` (9466); `SQLite.prepare` (9466); `Store.sql` (9466) | GATED-STORE |
| [packages/store/src/store.ts:4946](../../packages/store/src/store.ts#L4946) `Store/canonicalAccount` | `SQLite.all` (4946); `SQLite.prepare` (4946); `Store.sql` (4946) | CORE |
| [packages/store/src/store.ts:10573](../../packages/store/src/store.ts#L10573) `Store/cascadeDelete` | `relatedRows` (10573) | CORE |
| [packages/store/src/store.ts:2253](../../packages/store/src/store.ts#L2253) `Store/changeOne` | `Store.sql` (2253, 2255) | CORE |
| [packages/store/src/store.ts:2256](../../packages/store/src/store.ts#L2256) `Store/changeOne/read` | `SQLite.get` (2256); `SQLite.prepare` (2256); `Store.sql` (2256) | CORE |
| [packages/store/src/store.ts:8756](../../packages/store/src/store.ts#L8756) `Store/checkContainerWrite` | `Store.row` (8756) | CORE |
| [packages/store/src/store.ts:10196](../../packages/store/src/store.ts#L10196) `Store/checkEditable` | `Store.row` (10196) | CORE |
| [packages/store/src/store.ts:1502](../../packages/store/src/store.ts#L1502) `Store/checkpoint` | `SQLite.get` (1502); `SQLite.prepare` (1502); `Store.sql` (1502) | CORE |
| [packages/store/src/store.ts:6299](../../packages/store/src/store.ts#L6299) `Store/clearAccountPrivilegeSet` | `SQLite.prepare` (6299); `Store.sql` (6299) | CORE |
| [packages/store/src/store.ts:1524](../../packages/store/src/store.ts#L1524) `Store/close` | `Store.sql` (1524) | CORE |
| [packages/store/src/store.ts:8724](../../packages/store/src/store.ts#L8724) `Store/compactFile` | `Store.sql` (8724, 8725, 8727) | CORE |
| [packages/store/src/store.ts:10697](../../packages/store/src/store.ts#L10697) `Store/computeValuesCurrent` | `Store.computeValues` (10697); `Store.sql` (10703, 10707); `SQLite.all` (10707); `SQLite.prepare` (10707) | GATED-STORE |
| [packages/store/src/store.ts:9135](../../packages/store/src/store.ts#L9135) `Store/computedRows` | `Store.sql` (9135, 9138, 9139, 9140, 9142, 9152, 9153, 9154, 9157); `SQLite.prepare` (9138, 9140, 9142, 9152); `SQLite.iterate` (9142); `Calculations.globalValue` (9145); `Calculations.unstoredValue` (9146); `Calculations.related` (9149); `SQLite.all` (9152) | CORE |
| [packages/store/src/store.ts:5721](../../packages/store/src/store.ts#L5721) `Store/confirmTotp` | `SQLite.get` (5721); `SQLite.prepare` (5721, 5723); `Store.sql` (5721, 5723) | CORE |
| [packages/store/src/store.ts:1148](../../packages/store/src/store.ts#L1148) `Store/constructor` | `Store.sql` (1148, 1150, 1152, 1153, 1157, 1161, 1162, 1171, 1179, 1194, 1199, 1204, 1205, 1209, 1210, 1211, 1218, 1222, 1226, 1227, 1228, 1233, 1237, 1240, 1241, 1243, 1244, 1247, 1248, 1252, 1253, 1257, 1258, 1261, 1263, 1266, 1267, 1271, 1272, 1276, 1277, 1281, 1282, 1283, 1286, 1287, 1290, 1291, 1293, 1293, 1294, 1294, 1295, 1298, 1302, 1304, 1307, 1308, 1309, 1312, 1313, 1315, 1317, 1318, 1322, 1323, 1325, 1337, 1339, 1340, 1341, 1341, 1345, 1346); `SQLite.get` (1152, 1171); `SQLite.prepare` (1152, 1171, 1179, 1240, 1241, 1244, 1247, 1252, 1257, 1266, 1271, 1276, 1286, 1290, 1293, 1294, 1312, 1317, 1322); `SQLite.all` (1240, 1247, 1252, 1257, 1266, 1271, 1276, 1286, 1290, 1293, 1294, 1312, 1317, 1322) | CORE |
| [packages/store/src/store.ts:6079](../../packages/store/src/store.ts#L6079) `Store/consumeRecoveryCode` | `SQLite.prepare` (6079); `Store.sql` (6079) | CORE |
| [packages/store/src/store.ts:8299](../../packages/store/src/store.ts#L8299) `Store/container` | `SQLite.get` (8299); `SQLite.prepare` (8299, 8308); `Store.sql` (8299, 8308); `SQLite.all` (8308) | CORE |
| [packages/store/src/store.ts:8733](../../packages/store/src/store.ts#L8733) `Store/containerId` | `Store.containerId` (8733); `Store.row` (8734) | CORE |
| [packages/store/src/store.ts:8316](../../packages/store/src/store.ts#L8316) `Store/containerInfo` | `SQLite.get` (8316); `SQLite.prepare` (8316); `Store.sql` (8316) | CORE |
| [packages/store/src/store.ts:8280](../../packages/store/src/store.ts#L8280) `Store/containerIntact` | `SQLite.get` (8280); `SQLite.prepare` (8280); `Store.sql` (8280) | CORE |
| [packages/store/src/store.ts:8219](../../packages/store/src/store.ts#L8219) `Store/containerIntegrityReport` | `SQLite.all` (8219); `SQLite.prepare` (8219, 8230); `Store.sql` (8219, 8230); `SQLite.get` (8230) | CORE |
| [packages/store/src/store.ts:8294](../../packages/store/src/store.ts#L8294) `Store/containerMeta` | `SQLite.get` (8294); `SQLite.prepare` (8294); `Store.sql` (8294) | CORE |
| [packages/store/src/store.ts:8350](../../packages/store/src/store.ts#L8350) `Store/containerRange` | `SQLite.all` (8350); `SQLite.prepare` (8350, 8357); `Store.sql` (8350, 8357); `SQLite.get` (8357) | CORE |
| [packages/store/src/store.ts:8121](../../packages/store/src/store.ts#L8121) `Store/containerReferences` | `SQLite.all` (8121, 8140, 8142, 8148, 8161, 8172, 8186); `SQLite.prepare` (8121, 8140, 8142, 8148, 8161, 8172, 8184, 8186); `Store.sql` (8121, 8140, 8142, 8148, 8161, 8172, 8184, 8186); `SQLite.get` (8184); `Store.row` (8195) | CORE |
| [packages/store/src/store.ts:10677](../../packages/store/src/store.ts#L10677) `Store/countIds` | `Store.countIds` (10677); `SQLite.get` (10681); `SQLite.prepare` (10681); `Store.sql` (10681) | GATED-STORE |
| [packages/store/src/store.ts:9515](../../packages/store/src/store.ts#L9515) `Store/create` | `SQLite.get` (9515); `SQLite.prepare` (9515, 9528); `Store.sql` (9515, 9528) | CORE |
| [packages/store/src/store.ts:3984](../../packages/store/src/store.ts#L3984) `Store/createAccount` | `SQLite.get` (3984); `SQLite.prepare` (3984, 3988, 3994, 3999, 4004); `Store.sql` (3984, 3988, 3994, 3999, 4004) | CORE |
| [packages/store/src/store.ts:5452](../../packages/store/src/store.ts#L5452) `Store/createApiToken` | `SQLite.get` (5452, 5480); `SQLite.prepare` (5452, 5479, 5480, 5490); `Store.sql` (5452, 5479, 5480, 5490) | CORE |
| [packages/store/src/store.ts:4958](../../packages/store/src/store.ts#L4958) `Store/createLocalAccount` | `SQLite.prepare` (4958); `Store.sql` (4958) | CORE |
| [packages/store/src/store.ts:3644](../../packages/store/src/store.ts#L3644) `Store/credentialIdentity` | `SQLite.get` (3644); `SQLite.prepare` (3644); `Store.sql` (3644) | CORE |
| [packages/store/src/store.ts:5373](../../packages/store/src/store.ts#L5373) `Store/credentialStamp` | `SQLite.get` (5373); `SQLite.prepare` (5373); `Store.sql` (5373) | CORE |
| [packages/store/src/store.ts:2046](../../packages/store/src/store.ts#L2046) `Store/dataVersion` | `SQLite.get` (2046); `SQLite.prepare` (2046); `Store.sql` (2046) | CORE |
| [packages/store/src/store.ts:11234](../../packages/store/src/store.ts#L11234) `Store/decimalViewSql` | `SQLite.all` (11234); `SQLite.prepare` (11234) | CORE |
| [packages/store/src/store.ts:10239](../../packages/store/src/store.ts#L10239) `Store/delete` | `Store.row` (10239) | CORE |
| [packages/store/src/store.ts:10247](../../packages/store/src/store.ts#L10247) `Store/delete/run` | `SQLite.get` (10247); `SQLite.prepare` (10247, 10252); `Store.sql` (10247, 10252) | CORE |
| [packages/store/src/store.ts:5112](../../packages/store/src/store.ts#L5112) `Store/deleteAccount` | `SQLite.prepare` (5112, 5116, 5117, 5118, 5119, 5120, 5121, 5122, 5123, 5130, 5132, 5134, 5136, 5140); `Store.sql` (5112, 5116, 5117, 5118, 5119, 5120, 5121, 5122, 5123, 5130, 5132, 5134, 5136, 5140) | CORE |
| [packages/store/src/store.ts:10320](../../packages/store/src/store.ts#L10320) `Store/deleteBeingUndone` | `SQLite.all` (10320); `SQLite.prepare` (10320); `Store.sql` (10320) | CORE |
| [packages/store/src/store.ts:10332](../../packages/store/src/store.ts#L10332) `Store/deleteEndingTheLifeAt` | `SQLite.get` (10332); `SQLite.prepare` (10332); `Store.sql` (10332) | CORE |
| [packages/store/src/store.ts:6164](../../packages/store/src/store.ts#L6164) `Store/deletePrivilegeSet` | `SQLite.prepare` (6164); `Store.sql` (6164) | CORE |
| [packages/store/src/store.ts:4122](../../packages/store/src/store.ts#L4122) `Store/deleteScriptTest` | `SQLite.prepare` (4122); `Store.sql` (4122) | CORE |
| [packages/store/src/store.ts:3281](../../packages/store/src/store.ts#L3281) `Store/deletedRows` | `SQLite.get` (3281); `SQLite.prepare` (3281, 3283, 3283); `Store.sql` (3281, 3283, 3283); `SQLite.all` (3283, 3283) | CORE |
| [packages/store/src/store.ts:3391](../../packages/store/src/store.ts#L3391) `Store/designEffect` | `Store.sql` (3391, 3397, 3398, 3401, 3407, 3412, 3415, 3421, 3432, 3433, 3435, 3436, 3449, 3450, 3453, 3455, 3461, 3462, 3463, 3469, 3471, 3475, 3478, 3479, 3481, 3484, 3490, 3492, 3499, 3500, 3502, 3503, 3504, 3505, 3512, 3513, 3515, 3515, 3517, 3518, 3519, 3523, 3527, 3529, 3567, 3569, 3571); `SQLite.prepare` (3401, 3432, 3433, 3449, 3450, 3461, 3462, 3469, 3471, 3475, 3479, 3490, 3492, 3505, 3512, 3513, 3515, 3517, 3519, 3523, 3527); `SQLite.get` (3432, 3449, 3461, 3462, 3475, 3479, 3515, 3523); `SQLite.all` (3512, 3513); `SQLite.iterate` (3517) | CORE |
| [packages/store/src/store.ts:3384](../../packages/store/src/store.ts#L3384) `Store/designEffect/renameExcluded` | `SQLite.prepare` (3384); `Store.sql` (3384) | CORE |
| [packages/store/src/store.ts:3368](../../packages/store/src/store.ts#L3368) `Store/designEffect/renameKey` | `SQLite.prepare` (3368); `Store.sql` (3368) | CORE |
| [packages/store/src/store.ts:3322](../../packages/store/src/store.ts#L3322) `Store/designHistory` | `SQLite.all` (3322); `SQLite.prepare` (3322); `Store.sql` (3322) | CORE |
| [packages/store/src/store.ts:5742](../../packages/store/src/store.ts#L5742) `Store/disableTotp` | `SQLite.prepare` (5742); `Store.sql` (5742) | CORE |
| [packages/store/src/store.ts:3579](../../packages/store/src/store.ts#L3579) `Store/dropColumnIndexes` | `SQLite.all` (3579, 3581); `SQLite.prepare` (3579, 3581); `Store.sql` (3579, 3581, 3582) | CORE |
| [packages/store/src/store.ts:8910](../../packages/store/src/store.ts#L8910) `Store/dropFieldIndex` | `SQLite.get` (8910); `SQLite.prepare` (8910); `Store.sql` (8910, 8911) | CORE |
| [packages/store/src/store.ts:9552](../../packages/store/src/store.ts#L9552) `Store/duplicate` | `Store.row` (9552); `SQLite.prepare` (9570); `Store.sql` (9570) | CORE |
| [packages/store/src/store.ts:8537](../../packages/store/src/store.ts#L8537) `Store/embeddedContainerCount` | `SQLite.prepare` (8537); `Store.sql` (8537); `SQLite.get` (8538) | CORE |
| [packages/store/src/store.ts:8523](../../packages/store/src/store.ts#L8523) `Store/embeddedContainers` | `SQLite.prepare` (8523, 8524); `Store.sql` (8523, 8524); `SQLite.all` (8524); `SQLite.get` (8528) | CORE |
| [packages/store/src/store.ts:3307](../../packages/store/src/store.ts#L3307) `Store/emptyDeleted` | `Store.sql` (3307, 3310, 3311, 3313, 3315); `SQLite.prepare` (3311) | CORE |
| [packages/store/src/store.ts:1922](../../packages/store/src/store.ts#L1922) `Store/endTransaction` | `Store.sql` (1922, 1925, 1925) | CORE |
| [packages/store/src/store.ts:5710](../../packages/store/src/store.ts#L5710) `Store/enrollTotp` | `SQLite.prepare` (5710); `Store.sql` (5710) | CORE |
| [packages/store/src/store.ts:3276](../../packages/store/src/store.ts#L3276) `Store/ensureDeleted` | `Store.sql` (3276) | CORE |
| [packages/store/src/store.ts:1356](../../packages/store/src/store.ts#L1356) `Store/ensureNativeIds` | `SQLite.all` (1356, 1368); `SQLite.prepare` (1356, 1359, 1367, 1368); `Store.sql` (1356, 1359, 1362, 1366, 1367, 1368, 1371, 1373) | CORE |
| [packages/store/src/store.ts:2166](../../packages/store/src/store.ts#L2166) `Store/ensureRecordIdHighWater` | `Store.sql` (2166, 2168, 2170, 2172) | CORE |
| [packages/store/src/store.ts:2184](../../packages/store/src/store.ts#L2184) `Store/ensureRecordIdMarks` | `SQLite.all` (2184, 2187, 2190, 2199); `SQLite.prepare` (2184, 2187, 2190, 2193, 2199, 2202); `Store.sql` (2184, 2187, 2190, 2193, 2199, 2202, 2206, 2207) | CORE |
| [packages/store/src/store.ts:9893](../../packages/store/src/store.ts#L9893) `Store/evaluateCurrent` | `Store.row` (9893, 9893, 9894, 9894); `Calculations.context` (9899); `Store.get` (9900, 9902) | GATED-STORE |
| [packages/store/src/store.ts:9934](../../packages/store/src/store.ts#L9934) `Store/evaluateEachCurrent` | `Store.row` (9934, 9934, 9939); `Calculations.context` (9940); `Store.get` (9942) | GATED-STORE |
| [packages/store/src/store.ts:9996](../../packages/store/src/store.ts#L9996) `Store/evaluateRowsCurrent` | `Store.row` (9996, 9996, 9997, 9997) | GATED-STORE |
| [packages/store/src/store.ts:9975](../../packages/store/src/store.ts#L9975) `Store/evaluateRowsCurrent/each` | `Calculations.context` (9975); `Store.get` (9977) | GATED-STORE |
| [packages/store/src/store.ts:10011](../../packages/store/src/store.ts#L10011) `Store/evaluateRowsCurrent/found/[Symbol.iterator]` | `rowsById` (10011) | GATED-STORE |
| [packages/store/src/store.ts:10033](../../packages/store/src/store.ts#L10033) `Store/evaluateRowsCurrent/key` | `Calculations.context` (10033) | GATED-STORE |
| [packages/store/src/store.ts:3911](../../packages/store/src/store.ts#L3911) `Store/externalAccount` | `SQLite.all` (3911); `SQLite.prepare` (3911); `Store.sql` (3911) | CORE |
| [packages/store/src/store.ts:8042](../../packages/store/src/store.ts#L8042) `Store/externalContainerCheck` | `SQLite.all` (8042); `SQLite.prepare` (8042); `Store.sql` (8042) | CORE |
| [packages/store/src/store.ts:8049](../../packages/store/src/store.ts#L8049) `Store/externalContainerCount` | `SQLite.get` (8049); `SQLite.prepare` (8049); `Store.sql` (8049) | CORE |
| [packages/store/src/store.ts:8058](../../packages/store/src/store.ts#L8058) `Store/externalContainerReport` | `SQLite.all` (8058, 8071); `SQLite.prepare` (8058, 8071); `Store.sql` (8058, 8071) | CORE |
| [packages/store/src/store.ts:5223](../../packages/store/src/store.ts#L5223) `Store/externalIdentityId` | `SQLite.get` (5223, 5230); `SQLite.prepare` (5223, 5229, 5230); `Store.sql` (5223, 5229, 5230) | CORE |
| [packages/store/src/store.ts:8290](../../packages/store/src/store.ts#L8290) `Store/externalOf` | `SQLite.get` (8290); `SQLite.prepare` (8290); `Store.sql` (8290) | CORE |
| [packages/store/src/store.ts:3057](../../packages/store/src/store.ts#L3057) `Store/failureAuditRoom` | `SQLite.get` (3057); `SQLite.prepare` (3057); `Store.sql` (3057) | CORE |
| [packages/store/src/store.ts:7695](../../packages/store/src/store.ts#L7695) `Store/fieldIndexCurrent` | `SQLite.iterate` (7695); `SQLite.prepare` (7695, 7700); `Store.sql` (7695, 7700); `SQLite.all` (7700) | GATED-STORE |
| [packages/store/src/store.ts:8950](../../packages/store/src/store.ts#L8950) `Store/find` | `Store.find` (8950) | GATED-STORE |
| [packages/store/src/store.ts:9322](../../packages/store/src/store.ts#L9322) `Store/findCandidates` | `Store.query` (9322) | CORE |
| [packages/store/src/store.ts:8961](../../packages/store/src/store.ts#L8961) `Store/findHere` | `Store.query` (8961, 8966, 8968, 8982, 8984, 8995); `Store.recordCount` (8979); `SQLite.get` (8980, 8984); `SQLite.prepare` (8980, 8984, 8990, 8997, 9006); `Store.sql` (8980, 8984, 8990, 8997, 9006); `SQLite.all` (8990, 8997, 9006) | GATED-STORE |
| [packages/store/src/store.ts:9001](../../packages/store/src/store.ts#L9001) `Store/findHere/[Symbol.iterator]` | `SQLite.iterate` (9001); `SQLite.prepare` (9001); `Store.sql` (9001) | GATED-STORE |
| [packages/store/src/store.ts:10808](../../packages/store/src/store.ts#L10808) `Store/findIdsCurrent` | `Store.findIds` (10808) | GATED-STORE |
| [packages/store/src/store.ts:10744](../../packages/store/src/store.ts#L10744) `Store/findIdsCurrentProgress` | `Store.findIdsProgress` (10744); `Store.query` (10746, 10747, 10760, 10762); `Store.recordCount` (10752, 10780); `SQLite.iterate` (10777); `SQLite.prepare` (10777, 10785, 10786); `Store.sql` (10777, 10785, 10786); `SQLite.get` (10789); `SQLite.all` (10795) | GATED-STORE |
| [packages/store/src/store.ts:10814](../../packages/store/src/store.ts#L10814) `Store/findIdsHere` | `Store.query` (10814, 10819, 10821); `SQLite.iterate` (10832); `SQLite.prepare` (10832); `Store.sql` (10832) | GATED-STORE |
| [packages/store/src/store.ts:9266](../../packages/store/src/store.ts#L9266) `Store/findSource` | `Store.query` (9266); `SQLite.all` (9275, 9292); `SQLite.prepare` (9275, 9283, 9291); `Store.sql` (9275, 9280, 9283, 9288, 9291, 9305, 9307); `Calculations.globalValue` (9297); `Calculations.unstoredValue` (9298); `Calculations.related` (9302) | CORE |
| [packages/store/src/store.ts:3169](../../packages/store/src/store.ts#L3169) `Store/flushDeferredSecurity` | `Store.sql` (3169) | CORE |
| [packages/store/src/store.ts:10287](../../packages/store/src/store.ts#L10287) `Store/forgetStandInValues` | `Store.sql` (10287, 10308); `SQLite.prepare` (10308) | CORE |
| [packages/store/src/store.ts:5079](../../packages/store/src/store.ts#L5079) `Store/forgetStandIns` | `SQLite.prepare` (5079); `Store.sql` (5079) | CORE |
| [packages/store/src/store.ts:7577](../../packages/store/src/store.ts#L7577) `Store/foundSetPage` | `rowsById` (7577) | CORE |
| [packages/store/src/store.ts:7593](../../packages/store/src/store.ts#L7593) `Store/foundSetRowsCurrent` | `Store.viewableIds` (7593); `Store.row` (7609) | GATED-STORE |
| [packages/store/src/store.ts:3830](../../packages/store/src/store.ts#L3830) `Store/gateAgentWrite` | `SQLite.get` (3830); `SQLite.prepare` (3830, 3832); `Store.sql` (3830, 3832) | CORE |
| [packages/store/src/store.ts:6017](../../packages/store/src/store.ts#L6017) `Store/generateRecoveryCodes` | `SQLite.prepare` (6017, 6020); `Store.sql` (6017, 6020) | CORE |
| [packages/store/src/store.ts:9394](../../packages/store/src/store.ts#L9394) `Store/getCurrent` | `Store.get` (9394); `Store.row` (9395, 9395, 9409); `SQLite.all` (9412); `SQLite.prepare` (9412); `Store.sql` (9412) | GATED-STORE |
| [packages/store/src/store.ts:9432](../../packages/store/src/store.ts#L9432) `Store/getManyCurrent` | `Store.getMany` (9432); `SQLite.get` (9450); `SQLite.prepare` (9450); `Store.sql` (9450) | GATED-STORE |
| [packages/store/src/store.ts:9443](../../packages/store/src/store.ts#L9443) `Store/getManyCurrent/[Symbol.iterator]` | `rowsById` (9443) | GATED-STORE |
| [packages/store/src/store.ts:1403](../../packages/store/src/store.ts#L1403) `Store/grantFullAccessClients` | `SQLite.prepare` (1403); `Store.sql` (1403) | CORE |
| [packages/store/src/store.ts:10849](../../packages/store/src/store.ts#L10849) `Store/groupSummariesCurrent` | `Store.groupSummaries` (10849); `Store.viewableIds` (10854); `Calculations.collect` (10870); `rowsById` (10870, 10920); `Calculations.collector` (10892) | GATED-STORE |
| [packages/store/src/store.ts:10918](../../packages/store/src/store.ts#L10918) `Store/groupSummariesCurrent/flush` | `Calculations.collector` (10918) | GATED-STORE |
| [packages/store/src/store.ts:10882](../../packages/store/src/store.ts#L10882) `Store/groupSummariesCurrent/key` | `Calculations.value` (10882); `Calculations.related` (10884) | GATED-STORE |
| [packages/store/src/store.ts:1430](../../packages/store/src/store.ts#L1430) `Store/hasOwnPassword` | `SQLite.get` (1430); `SQLite.prepare` (1430); `Store.sql` (1430) | CORE |
| [packages/store/src/store.ts:5872](../../packages/store/src/store.ts#L5872) `Store/hasPasskey` | `SQLite.get` (5872); `SQLite.prepare` (5872); `Store.sql` (5872) | CORE |
| [packages/store/src/store.ts:1411](../../packages/store/src/store.ts#L1411) `Store/hasProvingPassword` | `SQLite.get` (1411); `SQLite.prepare` (1411); `Store.sql` (1411) | CORE |
| [packages/store/src/store.ts:8864](../../packages/store/src/store.ts#L8864) `Store/hasTable` | `SQLite.get` (8864); `SQLite.prepare` (8864); `Store.sql` (8864) | CORE |
| [packages/store/src/store.ts:5731](../../packages/store/src/store.ts#L5731) `Store/hasTotp` | `SQLite.get` (5731); `SQLite.prepare` (5731); `Store.sql` (5731) | CORE |
| [packages/store/src/store.ts:5202](../../packages/store/src/store.ts#L5202) `Store/identityAllowed` | `SQLite.get` (5202, 5208, 5214); `SQLite.prepare` (5202, 5208, 5214); `Store.sql` (5202, 5208, 5214) | CORE |
| [packages/store/src/store.ts:7051](../../packages/store/src/store.ts#L7051) `Store/image` | `SQLite.get` (7051); `SQLite.prepare` (7051); `Store.sql` (7051) | CORE |
| [packages/store/src/store.ts:7061](../../packages/store/src/store.ts#L7061) `Store/images` | `SQLite.all` (7061); `SQLite.prepare` (7061); `Store.sql` (7061) | CORE |
| [packages/store/src/store.ts:4923](../../packages/store/src/store.ts#L4923) `Store/importAccounts` | `SQLite.all` (4923); `SQLite.prepare` (4923); `Store.sql` (4923) | CORE |
| [packages/store/src/store.ts:1744](../../packages/store/src/store.ts#L1744) `Store/independentWindowWrite` | `SQLite.get` (1744); `SQLite.prepare` (1744, 1752, 1812); `Store.sql` (1744, 1752, 1762, 1790, 1807, 1812, 1815); `SQLite.all` (1752); `Store.row` (1810) | CORE |
| [packages/store/src/store.ts:2220](../../packages/store/src/store.ts#L2220) `Store/nextRecordId` | `SQLite.get` (2220); `SQLite.prepare` (2220); `Store.sql` (2220) | CORE |
| [packages/store/src/store.ts:1589](../../packages/store/src/store.ts#L1589) `Store/securityChainHeadAudit` | `SQLite.get` (1589); `SQLite.prepare` (1589); `Store.sql` (1589) | CORE |
| [packages/store/src/store.ts:8876](../../packages/store/src/store.ts#L8876) `Store/indexedFields` | `SQLite.all` (8876, 8877); `SQLite.prepare` (8876, 8877); `Store.sql` (8876, 8877) | CORE |
| [packages/store/src/store.ts:11267](../../packages/store/src/store.ts#L11267) `Store/internalRoots` | `SQLite.get` (11267); `SQLite.prepare` (11267, 11269); `SQLite.all` (11269) | CORE |
| [packages/store/src/store.ts:3666](../../packages/store/src/store.ts#L3666) `Store/isAgent` | `SQLite.get` (3666); `SQLite.prepare` (3666); `Store.sql` (3666) | CORE |
| [packages/store/src/store.ts:3769](../../packages/store/src/store.ts#L3769) `Store/isExternal` | `SQLite.get` (3769); `SQLite.prepare` (3769); `Store.sql` (3769) | CORE |
| [packages/store/src/store.ts:5786](../../packages/store/src/store.ts#L5786) `Store/issueWebauthnChallenge` | `SQLite.prepare` (5786, 5788, 5789, 5791); `Store.sql` (5786, 5788, 5789, 5791); `SQLite.get` (5788) | CORE |
| [packages/store/src/store.ts:11130](../../packages/store/src/store.ts#L11130) `Store/iterateCommitted` | `SQLite.iterate` (11130) | CORE |
| [packages/store/src/store.ts:1684](../../packages/store/src/store.ts#L1684) `Store/joinTransaction` | `Store.sql` (1684, 1685, 1687, 1689, 1695, 1698) | CORE |
| [packages/store/src/store.ts:10520](../../packages/store/src/store.ts#L10520) `Store/keyStepWork` | `Store.sql` (10520, 10526, 10530, 10532) | CORE |
| [packages/store/src/store.ts:6918](../../packages/store/src/store.ts#L6918) `Store/knownSharedAccount` | `SQLite.get` (6918); `SQLite.prepare` (6918); `Store.sql` (6918) | CORE |
| [packages/store/src/store.ts:4396](../../packages/store/src/store.ts#L4396) `Store/lastSignIns` | `Store.auditLog` (4396) | CORE |
| [packages/store/src/store.ts:10338](../../packages/store/src/store.ts#L10338) `Store/latestDeleteSeq` | `SQLite.get` (10338); `SQLite.prepare` (10338); `Store.sql` (10338) | CORE |
| [packages/store/src/store.ts:7091](../../packages/store/src/store.ts#L7091) `Store/layout` | `SQLite.get` (7091); `SQLite.prepare` (7091); `Store.sql` (7091) | CORE |
| [packages/store/src/store.ts:3339](../../packages/store/src/store.ts#L3339) `Store/layoutHistory` | `SQLite.all` (3339); `SQLite.prepare` (3339); `Store.sql` (3339) | CORE |
| [packages/store/src/store.ts:6981](../../packages/store/src/store.ts#L6981) `Store/layouts` | `SQLite.all` (6981); `SQLite.prepare` (6981); `Store.sql` (6981) | CORE |
| [packages/store/src/store.ts:4696](../../packages/store/src/store.ts#L4696) `Store/leastPrivilege` | `SQLite.all` (4696); `SQLite.prepare` (4696); `Store.sql` (4696) | CORE |
| [packages/store/src/store.ts:5300](../../packages/store/src/store.ts#L5300) `Store/ledgerRow` | `SQLite.get` (5300, 5301); `SQLite.prepare` (5300, 5301); `Store.sql` (5300, 5301) | AUTH |
| [packages/store/src/store.ts:5312](../../packages/store/src/store.ts#L5312) `Store/ledgerWrite` | `Store.sql` (5312, 5313, 5315, 5317, 5320, 5320) | AUTH |
| [packages/store/src/store.ts:5006](../../packages/store/src/store.ts#L5006) `Store/limitAccountImport` | `SQLite.prepare` (5006, 5007, 5010); `Store.sql` (5006, 5007, 5010); `SQLite.get` (5007) | CORE |
| [packages/store/src/store.ts:3619](../../packages/store/src/store.ts#L3619) `Store/linkIdentity` | `SQLite.get` (3619); `SQLite.prepare` (3619); `Store.sql` (3619) | CORE |
| [packages/store/src/store.ts:3611](../../packages/store/src/store.ts#L3611) `Store/linkPrincipal` | `SQLite.get` (3611); `SQLite.prepare` (3611); `Store.sql` (3611) | CORE |
| [packages/store/src/store.ts:4282](../../packages/store/src/store.ts#L4282) `Store/markPiiField` | `SQLite.prepare` (4282); `Store.sql` (4282) | CORE |
| [packages/store/src/store.ts:8015](../../packages/store/src/store.ts#L8015) `Store/markRepeating` | `SQLite.prepare` (8015); `Store.sql` (8015) | CORE |
| [packages/store/src/store.ts:11063](../../packages/store/src/store.ts#L11063) `Store/matchIds` | `Store.matchIds` (11063); `SQLite.all` (11069); `SQLite.prepare` (11069); `Store.sql` (11069) | CORE |
| [packages/store/src/store.ts:1445](../../packages/store/src/store.ts#L1445) `Store/meta` | `SQLite.get` (1445); `SQLite.prepare` (1445); `Store.sql` (1445) | CORE |
| [packages/store/src/store.ts:1003](../../packages/store/src/store.ts#L1003) `Store/metadataVersions` | `SQLite.get` (1003); `SQLite.prepare` (1003); `Store.sql` (1003) | CORE |
| [packages/store/src/store.ts:8652](../../packages/store/src/store.ts#L8652) `Store/moveContainersIn` | `Store.sql` (8652, 8658, 8660, 8661, 8662, 8663, 8683, 8688, 8688, 8699, 8702, 8705, 8712); `SQLite.prepare` (8660, 8661, 8662, 8663, 8699, 8705); `SQLite.get` (8665, 8699, 8705) | CORE |
| [packages/store/src/store.ts:8574](../../packages/store/src/store.ts#L8574) `Store/moveContainersOut` | `Store.sql` (8574, 8582, 8584, 8586, 8591, 8592, 8612, 8618, 8620, 8622, 8622, 8628, 8628, 8633, 8635, 8637, 8637, 8643); `SQLite.get` (8582); `SQLite.prepare` (8582, 8591, 8592); `Store.container` (8594) | CORE |
| [packages/store/src/store.ts:4877](../../packages/store/src/store.ts#L4877) `Store/mustChangePassword` | `SQLite.get` (4877); `SQLite.prepare` (4877); `Store.sql` (4877) | CORE |
| [packages/store/src/store.ts:1381](../../packages/store/src/store.ts#L1381) `Store/nativeIdGuards` | `Store.sql` (1381, 1382, 1384) | CORE |
| [packages/store/src/store.ts:5606](../../packages/store/src/store.ts#L5606) `Store/objectUseSince` | `SQLite.get` (5606); `SQLite.prepare` (5606); `Store.sql` (5606) | CORE |
| [packages/store/src/store.ts:8836](../../packages/store/src/store.ts#L8836) `Store/orderBy` | `Store.valueListItems` (8836) | CORE |
| [packages/store/src/store.ts:8207](../../packages/store/src/store.ts#L8207) `Store/orphanContainerReport` | `SQLite.all` (8207); `SQLite.prepare` (8207); `Store.sql` (8207) | CORE |
| [packages/store/src/store.ts:5838](../../packages/store/src/store.ts#L5838) `Store/passkeyAllowList` | `SQLite.all` (5838); `SQLite.prepare` (5838); `Store.sql` (5838) | CORE |
| [packages/store/src/store.ts:5877](../../packages/store/src/store.ts#L5877) `Store/passkeyIds` | `SQLite.all` (5877); `SQLite.prepare` (5877); `Store.sql` (5877) | CORE |
| [packages/store/src/store.ts:5865](../../packages/store/src/store.ts#L5865) `Store/passkeys` | `SQLite.all` (5865); `SQLite.prepare` (5865); `Store.sql` (5865) | CORE |
| [packages/store/src/store.ts:4916](../../packages/store/src/store.ts#L4916) `Store/passwordDaysRemaining` | `SQLite.get` (4916); `SQLite.prepare` (4916); `Store.sql` (4916) | CORE |
| [packages/store/src/store.ts:3854](../../packages/store/src/store.ts#L3854) `Store/pendingChanges` | `SQLite.all` (3854); `SQLite.prepare` (3854); `Store.sql` (3854) | CORE |
| [packages/store/src/store.ts:1463](../../packages/store/src/store.ts#L1463) `Store/persistentData` | `SQLite.get` (1463) | CORE |
| [packages/store/src/store.ts:1472](../../packages/store/src/store.ts#L1472) `Store/persistentDataIds` | `SQLite.all` (1472) | CORE |
| [packages/store/src/store.ts:1453](../../packages/store/src/store.ts#L1453) `Store/persistentTable` | `Store.sql` (1453) | CORE |
| [packages/store/src/store.ts:10181](../../packages/store/src/store.ts#L10181) `Store/portalContainerTarget` | `Store.row` (10181); `relatedIdList` (10183) | CORE |
| [packages/store/src/store.ts:7632](../../packages/store/src/store.ts#L7632) `Store/portalCountsCurrent` | `Store.canView` (7632); `Store.row` (7659) | GATED-STORE |
| [packages/store/src/store.ts:7870](../../packages/store/src/store.ts#L7870) `Store/portalRows` | `relatedRows` (7870); `relatedIdList` (7871); `Store.viewableSet` (7874); `rowsById` (7899, 7937); `Calculations.related` (7913) | CORE |
| [packages/store/src/store.ts:7881](../../packages/store/src/store.ts#L7881) `Store/portalRows/context` | `Calculations.context` (7881) | CORE |
| [packages/store/src/store.ts:7891](../../packages/store/src/store.ts#L7891) `Store/portalRows/valueOf` | `Calculations.value` (7891) | CORE |
| [packages/store/src/store.ts:2594](../../packages/store/src/store.ts#L2594) `Store/prepared` | `SQLite.prepare` (2594); `Store.sql` (2594) | CORE |
| [packages/store/src/store.ts:4988](../../packages/store/src/store.ts#L4988) `Store/previewAccountImport` | `Store.sql` (4988, 4989, 4998) | CORE |
| [packages/store/src/store.ts:6681](../../packages/store/src/store.ts#L6681) `Store/previewRecordRuleCurrent` | `SQLite.get` (6681); `SQLite.prepare` (6681, 6684); `Store.sql` (6681, 6684); `SQLite.all` (6684); `Calculations.context` (6690, 6706) | CORE |
| [packages/store/src/store.ts:9357](../../packages/store/src/store.ts#L9357) `Store/previewRow` | `Store.row` (9357) | CORE |
| [packages/store/src/store.ts:6092](../../packages/store/src/store.ts#L6092) `Store/privilegeSets` | `Store.sql` (6092) | CORE |
| [packages/store/src/store.ts:2826](../../packages/store/src/store.ts#L2826) `Store/pruneAudit` | `Store.sql` (2826, 2828, 2830); `SQLite.get` (2828); `SQLite.prepare` (2828) | CORE |
| [packages/store/src/store.ts:8242](../../packages/store/src/store.ts#L8242) `Store/purgeOrphanContainers` | `Store.sql` (8242, 8246, 8255, 8258, 8259, 8264, 8265, 8267, 8267); `Store.orphanContainerReport` (8250); `SQLite.get` (8255); `SQLite.prepare` (8255, 8258, 8259) | CORE |
| [packages/store/src/store.ts:11384](../../packages/store/src/store.ts#L11384) `Store/query` | `SQLite.iterate` (11384) | CORE |
| [packages/store/src/store.ts:11424](../../packages/store/src/store.ts#L11424) `Store/queryWithOriginsCurrent` | `SQLite.iterate` (11424); `SQLite.all` (11433, 11436); `SQLite.prepare` (11433, 11436) | CORE |
| [packages/store/src/store.ts:11179](../../packages/store/src/store.ts#L11179) `Store/readOnlyChecked` | `SQLite.prepare` (11179, 11183, 11192, 11197); `SQLite.all` (11183, 11192, 11197) | CORE |
| [packages/store/src/store.ts:3591](../../packages/store/src/store.ts#L3591) `Store/recompute` | `SQLite.prepare` (3591, 3595); `Store.sql` (3591, 3595); `SQLite.iterate` (3595); `Calculations.computeStoredStyled` (3596); `Calculations.value` (3596) | CORE |
| [packages/store/src/store.ts:2609](../../packages/store/src/store.ts#L2609) `Store/recordAsOf` | `SQLite.get` (2609, 2611); `SQLite.prepare` (2609, 2611, 2613, 2614); `Store.sql` (2609, 2611, 2613, 2614); `SQLite.all` (2613, 2614) | CORE |
| [packages/store/src/store.ts:2307](../../packages/store/src/store.ts#L2307) `Store/recordCount` | `SQLite.get` (2307); `SQLite.prepare` (2307); `Store.sql` (2307) | CORE |
| [packages/store/src/store.ts:2686](../../packages/store/src/store.ts#L2686) `Store/recordLife` | `SQLite.all` (2686); `SQLite.prepare` (2686); `Store.sql` (2686) | CORE |
| [packages/store/src/store.ts:5537](../../packages/store/src/store.ts#L5537) `Store/recordObjectUse` | `Store.sql` (5537) | CORE |
| [packages/store/src/store.ts:9883](../../packages/store/src/store.ts#L9883) `Store/recordViewable` | `Store.row` (9883) | GATED-STORE |
| [packages/store/src/store.ts:1510](../../packages/store/src/store.ts#L1510) `Store/recordedFormat` | `Store.sql` (1510) | CORE |
| [packages/store/src/store.ts:8546](../../packages/store/src/store.ts#L8546) `Store/recoverContainersOut` | `SQLite.prepare` (8546); `Store.sql` (8546); `SQLite.get` (8549) | CORE |
| [packages/store/src/store.ts:1613](../../packages/store/src/store.ts#L1613) `Store/recoverPendingExternalFiles` | `Store.sql` (1613, 1615, 1639, 1641); `SQLite.prepare` (1615); `SQLite.get` (1626) | CORE |
| [packages/store/src/store.ts:6035](../../packages/store/src/store.ts#L6035) `Store/recoveryCodesRemaining` | `SQLite.get` (6035); `SQLite.prepare` (6035); `Store.sql` (6035) | CORE |
| [packages/store/src/store.ts:11219](../../packages/store/src/store.ts#L11219) `Store/refreshDecimalSqlViews` | `SQLite.get` (11219); `SQLite.prepare` (11219) | CORE |
| [packages/store/src/store.ts:3760](../../packages/store/src/store.ts#L3760) `Store/refuseLookalikeAccount` | `SQLite.all` (3760); `SQLite.prepare` (3760); `Store.sql` (3760) | CORE |
| [packages/store/src/store.ts:5901](../../packages/store/src/store.ts#L5901) `Store/registerPasskey` | `SQLite.prepare` (5901); `Store.sql` (5901) | CORE |
| [packages/store/src/store.ts:3889](../../packages/store/src/store.ts#L3889) `Store/rejectPending` | `SQLite.get` (3889); `SQLite.prepare` (3889, 3891); `Store.sql` (3889, 3891) | CORE |
| [packages/store/src/store.ts:9109](../../packages/store/src/store.ts#L9109) `Store/relatedCriteria` | `SQLite.iterate` (9109); `SQLite.prepare` (9109); `Store.sql` (9109) | CORE |
| [packages/store/src/store.ts:9106](../../packages/store/src/store.ts#L9106) `Store/relatedCriteria/matched` | `relatedRows` (9106) | CORE |
| [packages/store/src/store.ts:7419](../../packages/store/src/store.ts#L7419) `Store/relatedValues` | `Calculations.globalValue` (7419); `Calculations.unstoredValue` (7421) | CORE |
| [packages/store/src/store.ts:5914](../../packages/store/src/store.ts#L5914) `Store/removePasskey` | `SQLite.get` (5914); `SQLite.prepare` (5914, 5915); `Store.sql` (5914, 5915) | CORE |
| [packages/store/src/store.ts:10358](../../packages/store/src/store.ts#L10358) `Store/restoreDeletedRowLocked` | `SQLite.get` (10358, 10363); `SQLite.prepare` (10358, 10359, 10363, 10373); `Store.sql` (10358, 10359, 10363, 10373); `SQLite.all` (10359) | CORE |
| [packages/store/src/store.ts:2644](../../packages/store/src/store.ts#L2644) `Store/restoreRecord` | `Store.recordAsOf` (2644); `SQLite.get` (2648); `SQLite.prepare` (2648, 2653, 2662, 2673); `Store.sql` (2648, 2653, 2662, 2673) | CORE |
| [packages/store/src/store.ts:2702](../../packages/store/src/store.ts#L2702) `Store/revertAuditEntry` | `SQLite.get` (2702); `SQLite.prepare` (2702); `Store.sql` (2702); `Store.canViewRecord` (2704); `Store.auditLog` (2707) | CORE |
| [packages/store/src/store.ts:5662](../../packages/store/src/store.ts#L5662) `Store/revokeApiToken` | `SQLite.prepare` (5662); `Store.sql` (5662) | CORE |
| [packages/store/src/store.ts:5185](../../packages/store/src/store.ts#L5185) `Store/revokeSignInCredentials` | `SQLite.prepare` (5185, 5186, 5187); `Store.sql` (5185, 5186, 5187) | AUTH |
| [packages/store/src/store.ts:9375](../../packages/store/src/store.ts#L9375) `Store/row` | `SQLite.get` (9375) | CORE |
| [packages/store/src/store.ts:11321](../../packages/store/src/store.ts#L11321) `Store/rowsOf` | `SQLite.iterate` (11321, 11329) | CORE |
| [packages/store/src/store.ts:6486](../../packages/store/src/store.ts#L6486) `Store/ruleOutcome` | `Calculations.context` (6486) | CORE |
| [packages/store/src/store.ts:9220](../../packages/store/src/store.ts#L9220) `Store/runningSummaryValues` | `Store.viewableIds` (9220); `rowsById` (9222); `Calculations.value` (9233, 9239); `Calculations.related` (9250) | GATED-STORE |
| [packages/store/src/store.ts:6121](../../packages/store/src/store.ts#L6121) `Store/savePrivilegeSet` | `SQLite.prepare` (6121, 6129); `Store.sql` (6121, 6129) | AUTH |
| [packages/store/src/store.ts:4113](../../packages/store/src/store.ts#L4113) `Store/saveScriptTest` | `SQLite.prepare` (4113); `Store.sql` (4113) | CORE |
| [packages/store/src/store.ts:6646](../../packages/store/src/store.ts#L6646) `Store/scopedTableSql` | `Store.viewableIds` (6646); `SQLite.all` (6649); `SQLite.prepare` (6649); `Store.sql` (6649) | GATED-STORE |
| [packages/store/src/store.ts:3329](../../packages/store/src/store.ts#L3329) `Store/scriptHistory` | `SQLite.all` (3329); `SQLite.prepare` (3329); `Store.sql` (3329) | CORE |
| [packages/store/src/store.ts:3002](../../packages/store/src/store.ts#L3002) `Store/securityChange` | `Store.sql` (3002, 3004); `SQLite.prepare` (3004) | CORE |
| [packages/store/src/store.ts:2568](../../packages/store/src/store.ts#L2568) `Store/securityEvents` | `Store.auditLog` (2568) | CORE |
| [packages/store/src/store.ts:5386](../../packages/store/src/store.ts#L5386) `Store/securityToken` | `SQLite.get` (5386); `SQLite.prepare` (5386); `Store.sql` (5386) | CORE |
| [packages/store/src/store.ts:11350](../../packages/store/src/store.ts#L11350) `Store/selectHeldCurrent` | `Store.sql` (11350, 11351, 11353); `SQLite.prepare` (11351) | CORE |
| [packages/store/src/store.ts:10663](../../packages/store/src/store.ts#L10663) `Store/selectIdsCurrent` | `Store.selectIds` (10663); `SQLite.all` (10669); `SQLite.prepare` (10669); `Store.sql` (10669) | GATED-STORE |
| [packages/store/src/store.ts:11340](../../packages/store/src/store.ts#L11340) `Store/selectIn` | `Store.select` (11340) | CORE |
| [packages/store/src/store.ts:1976](../../packages/store/src/store.ts#L1976) `Store/selfContainedCopy` | `Store.sql` (1976); `SQLite.all` (1981); `SQLite.prepare` (1981, 1983, 1984, 1985) | CORE |
| [packages/store/src/store.ts:5164](../../packages/store/src/store.ts#L5164) `Store/setAccountActive` | `SQLite.prepare` (5164, 5172, 5173); `Store.sql` (5164, 5172, 5173) | AUTH |
| [packages/store/src/store.ts:5405](../../packages/store/src/store.ts#L5405) `Store/setAccountLocalOnly` | `SQLite.prepare` (5405); `Store.sql` (5405) | CORE |
| [packages/store/src/store.ts:6277](../../packages/store/src/store.ts#L6277) `Store/setAccountPrivilegeSet` | `SQLite.get` (6277); `SQLite.prepare` (6277, 6280, 6284); `Store.sql` (6277, 6280, 6284) | AUTH |
| [packages/store/src/store.ts:5414](../../packages/store/src/store.ts#L5414) `Store/setAccountRequire2fa` | `SQLite.prepare` (5414); `Store.sql` (5414) | CORE |
| [packages/store/src/store.ts:3790](../../packages/store/src/store.ts#L3790) `Store/setAgentAccount` | `SQLite.get` (3790); `SQLite.prepare` (3790, 3796); `Store.sql` (3790, 3796) | CORE |
| [packages/store/src/store.ts:4157](../../packages/store/src/store.ts#L4157) `Store/setAiAllowed` | `SQLite.prepare` (4157); `Store.sql` (4157) | CORE |
| [packages/store/src/store.ts:4240](../../packages/store/src/store.ts#L4240) `Store/setAiPolicy` | `SQLite.prepare` (4240); `Store.sql` (4240) | CORE |
| [packages/store/src/store.ts:6905](../../packages/store/src/store.ts#L6905) `Store/setAllowBlankPasswordFromLan` | `SQLite.prepare` (6905); `Store.sql` (6905) | CORE |
| [packages/store/src/store.ts:2804](../../packages/store/src/store.ts#L2804) `Store/setAuditSettings` | `SQLite.prepare` (2804); `Store.sql` (2804) | CORE |
| [packages/store/src/store.ts:8765](../../packages/store/src/store.ts#L8765) `Store/setContainer` | `Store.sql` (8765); `Store.row` (8771) | CORE |
| [packages/store/src/store.ts:3742](../../packages/store/src/store.ts#L3742) `Store/setExternalAccount` | `SQLite.get` (3742); `SQLite.prepare` (3742, 3747); `Store.sql` (3742, 3747) | CORE |
| [packages/store/src/store.ts:4863](../../packages/store/src/store.ts#L4863) `Store/setMustChangePassword` | `SQLite.prepare` (4863); `Store.sql` (4863) | CORE |
| [packages/store/src/store.ts:3942](../../packages/store/src/store.ts#L3942) `Store/setPassword` | `SQLite.get` (3942); `SQLite.prepare` (3942, 3948, 3957, 3964, 3965, 3966); `Store.sql` (3942, 3948, 3957, 3964, 3965, 3966) | AUTH |
| [packages/store/src/store.ts:4054](../../packages/store/src/store.ts#L4054) `Store/setPasswordPolicy` | `SQLite.prepare` (4054); `Store.sql` (4054) | CORE |
| [packages/store/src/store.ts:1478](../../packages/store/src/store.ts#L1478) `Store/setPersistentData` | `SQLite.prepare` (1478, 1482); `Store.sql` (1478, 1482) | CORE |
| [packages/store/src/store.ts:4260](../../packages/store/src/store.ts#L4260) `Store/setPiiIsolation` | `SQLite.prepare` (4260); `Store.sql` (4260) | CORE |
| [packages/store/src/store.ts:4090](../../packages/store/src/store.ts#L4090) `Store/setRequireTotpForFullAccess` | `SQLite.prepare` (4090); `Store.sql` (4090) | CORE |
| [packages/store/src/store.ts:4172](../../packages/store/src/store.ts#L4172) `Store/setScriptNetwork` | `SQLite.prepare` (4172); `Store.sql` (4172) | CORE |
| [packages/store/src/store.ts:4229](../../packages/store/src/store.ts#L4229) `Store/setSqlRequiresFmxdbc` | `SQLite.prepare` (4229); `Store.sql` (4229) | CORE |
| [packages/store/src/store.ts:9804](../../packages/store/src/store.ts#L9804) `Store/setStoredCalcValues` | `SQLite.prepare` (9804, 9805); `Store.sql` (9804, 9805); `SQLite.get` (9809) | CORE |
| [packages/store/src/store.ts:8868](../../packages/store/src/store.ts#L8868) `Store/setUserPref` | `Store.sql` (8868, 8869, 8870); `SQLite.prepare` (8869, 8870) | CORE |
| [packages/store/src/store.ts:4213](../../packages/store/src/store.ts#L4213) `Store/setWebViewerHosts` | `SQLite.prepare` (4213); `Store.sql` (4213) | CORE |
| [packages/store/src/store.ts:5339](../../packages/store/src/store.ts#L5339) `Store/settleSignIns` | `SQLite.all` (5339, 5345); `SQLite.prepare` (5339, 5345, 5351, 5355, 5357); `Store.sql` (5339, 5345, 5351, 5355, 5357) | AUTH |
| [packages/store/src/store.ts:2107](../../packages/store/src/store.ts#L2107) `Store/shareResults` | `Store.sql` (2107) | CORE |
| [packages/store/src/store.ts:1540](../../packages/store/src/store.ts#L1540) `Store/shipWal` | `Store.sql` (1540) | CORE |
| [packages/store/src/store.ts:5286](../../packages/store/src/store.ts#L5286) `Store/signInBase` | `SQLite.get` (5286); `SQLite.prepare` (5286); `Store.sql` (5286) | AUTH |
| [packages/store/src/store.ts:5288](../../packages/store/src/store.ts#L5288) `Store/signInBase/identity` | `SQLite.get` (5288); `SQLite.prepare` (5288); `Store.sql` (5288) | AUTH |
| [packages/store/src/store.ts:5275](../../packages/store/src/store.ts#L5275) `Store/signInMark` | `SQLite.prepare` (5275); `Store.sql` (5275) | AUTH |
| [packages/store/src/store.ts:10961](../../packages/store/src/store.ts#L10961) `Store/sortIdsCurrentProgress` | `Store.sortIds` (10961); `Store.sortIdsProgress` (10961); `SQLite.all` (10974); `SQLite.prepare` (10974, 11049); `Store.sql` (10974, 11049); `Store.valueListItems` (10982); `rowsById` (10994); `Calculations.globalValue` (10997); `Calculations.unstoredValue` (10998); `Calculations.related` (11004); `SQLite.iterate` (11049) | GATED-STORE |
| [packages/store/src/store.ts:9034](../../packages/store/src/store.ts#L9034) `Store/sortedPage` | `SQLite.iterate` (9034); `SQLite.prepare` (9034, 9049); `Store.sql` (9034, 9049); `SQLite.all` (9049) | CORE |
| [packages/store/src/store.ts:11135](../../packages/store/src/store.ts#L11135) `Store/storedFileId` | `SQLite.get` (11135); `SQLite.prepare` (11135) | CORE |
| [packages/store/src/store.ts:9182](../../packages/store/src/store.ts#L9182) `Store/summaries` | `Calculations.wholeTable` (9182); `Calculations.collect` (9202, 9207) | CORE |
| [packages/store/src/store.ts:9198](../../packages/store/src/store.ts#L9198) `Store/summaries/recs` | `SQLite.iterate` (9198); `SQLite.prepare` (9198); `Store.sql` (9198) | CORE |
| [packages/store/src/store.ts:5852](../../packages/store/src/store.ts#L5852) `Store/takeWebauthnChallenge` | `SQLite.get` (5852); `SQLite.prepare` (5852, 5856); `Store.sql` (5852, 5856) | CORE |
| [packages/store/src/store.ts:8921](../../packages/store/src/store.ts#L8921) `Store/timeFind` | `Store.query` (8921) | CORE |
| [packages/store/src/store.ts:8935](../../packages/store/src/store.ts#L8935) `Store/reportFind` | `Store.query` (8935, 8937, 8938); `Store.recordCount` (8940) | CORE |
| [packages/store/src/store.ts:7360](../../packages/store/src/store.ts#L7360) `Store/toRecord` | `Calculations.value` (7360, 7370); `Calculations.globalValue` (7364); `Calculations.unstoredStyled` (7369) | CORE |
| [packages/store/src/store.ts:5736](../../packages/store/src/store.ts#L5736) `Store/totpAccounts` | `SQLite.all` (5736); `SQLite.prepare` (5736); `Store.sql` (5736) | CORE |
| [packages/store/src/store.ts:1552](../../packages/store/src/store.ts#L1552) `Store/trial` | `Store.sql` (1552) | CORE |
| [packages/store/src/store.ts:1557](../../packages/store/src/store.ts#L1557) `Store/trial/undo` | `Store.sql` (1557) | CORE |
| [packages/store/src/store.ts:11091](../../packages/store/src/store.ts#L11091) `Store/truncate/run` | `Store.sql` (11091, 11093, 11100, 11102, 11104, 11105); `SQLite.prepare` (11093, 11100); `SQLite.all` (11095) | CORE |
| [packages/store/src/store.ts:3689](../../packages/store/src/store.ts#L3689) `Store/unmigratedAccounts` | `SQLite.all` (3689); `SQLite.prepare` (3689); `Store.sql` (3689) | CORE |
| [packages/store/src/store.ts:4769](../../packages/store/src/store.ts#L4769) `Store/unusedAccess` | `SQLite.get` (4769); `SQLite.prepare` (4769, 4778); `Store.sql` (4769, 4778); `SQLite.all` (4778) | CORE |
| [packages/store/src/store.ts:4817](../../packages/store/src/store.ts#L4817) `Store/unusedObjects` | `SQLite.get` (4817); `SQLite.prepare` (4817, 4820); `Store.sql` (4817, 4820); `SQLite.all` (4820) | CORE |
| [packages/store/src/store.ts:5976](../../packages/store/src/store.ts#L5976) `Store/unusedRecoveryHashes` | `SQLite.all` (5976); `SQLite.prepare` (5976); `Store.sql` (5976) | CORE |
| [packages/store/src/store.ts:4599](../../packages/store/src/store.ts#L4599) `Store/unusualAccess` | `Store.auditLog` (4599, 4665) | CORE |
| [packages/store/src/store.ts:9625](../../packages/store/src/store.ts#L9625) `Store/update` | `Store.row` (9625); `Store.sql` (9656, 9657, 9696, 9699) | CORE |
| [packages/store/src/store.ts:9659](../../packages/store/src/store.ts#L9659) `Store/update/undo` | `Store.sql` (9659) | CORE |
| [packages/store/src/store.ts:10089](../../packages/store/src/store.ts#L10089) `Store/updatePortals` | `Store.row` (10089, 10125); `relatedRows` (10126) | CORE |
| [packages/store/src/store.ts:10099](../../packages/store/src/store.ts#L10099) `Store/updatePortals/portal/related` | `relatedIdList` (10099) | CORE |
| [packages/store/src/store.ts:10071](../../packages/store/src/store.ts#L10071) `Store/updateRelated` | `relatedRows` (10071) | CORE |
| [packages/store/src/store.ts:4855](../../packages/store/src/store.ts#L4855) `Store/usageCounting` | `SQLite.get` (4855); `SQLite.prepare` (4855); `Store.sql` (4855) | CORE |
| [packages/store/src/store.ts:8859](../../packages/store/src/store.ts#L8859) `Store/userPrefs` | `SQLite.all` (8859); `SQLite.prepare` (8859); `Store.sql` (8859) | CORE |
| [packages/store/src/store.ts:7741](../../packages/store/src/store.ts#L7741) `Store/valueListItemsCurrent` | `Store.valueListItems` (7741); `Store.get` (7755); `relatedRows` (7756); `Store.row` (7756); `SQLite.iterate` (7758); `SQLite.prepare` (7758); `Store.sql` (7758); `Calculations.related` (7768); `Calculations.value` (7772, 7773) | GATED-STORE |
| [packages/store/src/store.ts:10280](../../packages/store/src/store.ts#L10280) `Store/vaultHeld` | `SQLite.get` (10280); `SQLite.prepare` (10280); `Store.sql` (10280) | CORE |
| [packages/store/src/store.ts:5765](../../packages/store/src/store.ts#L5765) `Store/verifyTotp` | `SQLite.get` (5765); `SQLite.prepare` (5765, 5772); `Store.sql` (5765, 5772) | CORE |
| [packages/store/src/store.ts:2240](../../packages/store/src/store.ts#L2240) `Store/versionNumber` | `SQLite.get` (2240); `SQLite.prepare` (2240); `Store.sql` (2240) | CORE |
| [packages/store/src/store.ts:2118](../../packages/store/src/store.ts#L2118) `Store/versionTriggers` | `SQLite.get` (2118); `SQLite.prepare` (2118, 2123, 2124); `Store.sql` (2118, 2123, 2124, 2141, 2143, 2144, 2146); `SQLite.all` (2123, 2124) | CORE |
| [packages/store/src/store.ts:2086](../../packages/store/src/store.ts#L2086) `Store/warmSummariesCurrent` | `Calculations.wholeTable` (2086) | CORE |
| [packages/store/src/store.ts:4195](../../packages/store/src/store.ts#L4195) `Store/webViewerChecked` | `SQLite.get` (4195); `SQLite.prepare` (4195); `Store.sql` (4195) | CORE |
| [packages/store/src/store.ts:1844](../../packages/store/src/store.ts#L1844) `Store/withWriteTransaction` | `Store.sql` (1844, 1856, 1862, 1864, 1864) | CORE |
| [packages/store/src/store.ts:7295](../../packages/store/src/store.ts#L7295) `Store/wordIndex` | `Store.sql` (7295, 7303, 7308); `Store.recordCount` (7307); `SQLite.get` (7308); `SQLite.prepare` (7308) | CORE |
| [packages/store/src/store.ts:8439](../../packages/store/src/store.ts#L8439) `Store/writeExternalFile` | `Store.evaluateEach` (8439); `SQLite.prepare` (8462); `Store.sql` (8462) | CORE |
| [packages/store/src/store.ts:8463](../../packages/store/src/store.ts#L8463) `Store/writeExternalFile/taken` | `SQLite.get` (8463) | CORE |
| [packages/store/src/store.ts:5595](../../packages/store/src/store.ts#L5595) `Store/writeObjectUseRows` | `SQLite.prepare` (5595, 5596, 5601); `Store.sql` (5595, 5596, 5601) | CORE |
| [packages/store/src/store.ts:2295](../../packages/store/src/store.ts#L2295) `Store/writeToken` | `SQLite.get` (2295); `SQLite.prepare` (2295); `Store.sql` (2295) | CORE |
| [packages/store/src/store.ts:5567](../../packages/store/src/store.ts#L5567) `Store/writeUsage` | `Store.sql` (5567, 5568, 5570, 5574, 5576) | CORE |
| [packages/store/src/store.ts:5583](../../packages/store/src/store.ts#L5583) `Store/writeUsageRows` | `SQLite.prepare` (5583, 5584, 5590); `Store.sql` (5583, 5584, 5590) | CORE |
| [packages/store/src/store.ts:7016](../../packages/store/src/store.ts#L7016) `Store/design` | `SQLite.get` (7016) | CORE |
| [packages/store/src/store.ts:7038](../../packages/store/src/store.ts#L7038) `Store/themes` | `SQLite.get` (7038) | CORE |
| [packages/store/src/store.ts:5936](../../packages/store/src/store.ts#L5936) `Store/verifyPasskeyCredential` | `SQLite.get` (5936); `SQLite.prepare` (5936, 5948); `Store.sql` (5936, 5948) | CORE |
| [packages/store/src/store.ts:6876](../../packages/store/src/store.ts#L6876) `Store/passwordState` | `SQLite.get` (6876); `SQLite.prepare` (6876); `Store.sql` (6876) | CORE |
| [packages/store/src/store.ts:10224](../../packages/store/src/store.ts#L10224) `Store/deleteVisibility` | `Store.canViewRecord` (10224) | CORE |
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
