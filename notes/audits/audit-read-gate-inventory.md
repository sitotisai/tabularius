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
| [packages/cli/src/main.ts:2409](../../packages/cli/src/main.ts#L2409) `main` | `Store.orphanContainerReport` (2409); `Store.auditLog` (2882); `SQLite.get` (3141); `SQLite.prepare` (3141) | OPERATOR |
| [packages/scripts/src/data-api-step.ts:104](../../packages/scripts/src/data-api-step.ts#L104) `respond` | `Store.get` (104, 131, 140); `Store.find` (105, 117) | SCRIPT |
| [packages/scripts/src/engine.ts:7966](../../packages/scripts/src/engine.ts#L7966) `ScriptEngine/containerFile` | `Store.get` (7966); `Store.containerId` (7967); `Store.container` (7968) | SCRIPT |
| [packages/scripts/src/engine.ts:5584](../../packages/scripts/src/engine.ts#L5584) `ScriptEngine/design` | `Store.valueListItems` (5584) | SCRIPT |
| [packages/scripts/src/engine.ts:6322](../../packages/scripts/src/engine.ts#L6322) `ScriptEngine/exportField` | `Store.get` (6322); `Store.containerId` (6323); `Store.container` (6325) | SCRIPT |
| [packages/scripts/src/engine.ts:8363](../../packages/scripts/src/engine.ts#L8363) `ScriptEngine/fileMakerRows` | `Store.findIds` (8363); `Store.get` (8368) | SCRIPT |
| [packages/scripts/src/engine.ts:8733](../../packages/scripts/src/engine.ts#L8733) `ScriptEngine/findRelated` | `Store.findIds` (8733, 8743, 8746) | SCRIPT |
| [packages/scripts/src/engine.ts:2297](../../packages/scripts/src/engine.ts#L2297) `ScriptEngine/foundSet` | `Store.findIds` (2297) | SCRIPT |
| [packages/scripts/src/engine.ts:5424](../../packages/scripts/src/engine.ts#L5424) `ScriptEngine/get` | `Store.findIds` (5424); `Store.canViewRecord` (5517); `Store.get` (5553) | SCRIPT |
| [packages/scripts/src/engine.ts:1953](../../packages/scripts/src/engine.ts#L1953) `ScriptEngine/goToLayout` | `Store.findIds` (1953) | SCRIPT |
| [packages/scripts/src/engine.ts:6893](../../packages/scripts/src/engine.ts#L6893) `ScriptEngine/goToList` | `Store.findIds` (6893) | SCRIPT |
| [packages/scripts/src/engine.ts:8132](../../packages/scripts/src/engine.ts#L8132) `ScriptEngine/importRecords` | `Store.findIds` (8132); `Store.get` (8152) | SCRIPT |
| [packages/scripts/src/engine.ts:5696](../../packages/scripts/src/engine.ts#L5696) `ScriptEngine/lookupNext` | `Store.get` (5696); `Store.row` (5697); `Calculations.context` (5699) | SCRIPT |
| [packages/scripts/src/engine.ts:5262](../../packages/scripts/src/engine.ts#L5262) `ScriptEngine/newCalcContext/executeSQL` | `Calculations.executeSQL` (5262) | SCRIPT |
| [packages/scripts/src/engine.ts:5270](../../packages/scripts/src/engine.ts#L5270) `ScriptEngine/newCalcContext/persistentData` | `Store.persistentData` (5270) | SCRIPT |
| [packages/scripts/src/engine.ts:5271](../../packages/scripts/src/engine.ts#L5271) `ScriptEngine/newCalcContext/persistentDataIds` | `Store.persistentDataIds` (5271) | SCRIPT |
| [packages/scripts/src/engine.ts:8403](../../packages/scripts/src/engine.ts#L8403) `ScriptEngine/newRecord` | `Store.findIds` (8403) | SCRIPT |
| [packages/scripts/src/engine.ts:8708](../../packages/scripts/src/engine.ts#L8708) `ScriptEngine/performFind` | `Store.findIds` (8708) | SCRIPT |
| [packages/scripts/src/engine.ts:8765](../../packages/scripts/src/engine.ts#L8765) `ScriptEngine/quickFind` | `Store.findIds` (8765, 8766, 8769) | SCRIPT |
| [packages/scripts/src/engine.ts:5638](../../packages/scripts/src/engine.ts#L5638) `ScriptEngine/record` | `Store.get` (5638) | SCRIPT |
| [packages/scripts/src/engine.ts:5799](../../packages/scripts/src/engine.ts#L5799) `ScriptEngine/relatedIds` | `Store.findIds` (5799); `rowsById` (5807); `Store.select` (5811); `Store.matchIds` (5825); `Store.viewableIds` (5848) | SCRIPT |
| [packages/scripts/src/engine.ts:5833](../../packages/scripts/src/engine.ts#L5833) `ScriptEngine/relatedIds/matching` | `Store.matchIds` (5833) | SCRIPT |
| [packages/scripts/src/engine.ts:6473](../../packages/scripts/src/engine.ts#L6473) `ScriptEngine/relookup` | `Store.get` (6473) | SCRIPT |
| [packages/scripts/src/engine.ts:3431](../../packages/scripts/src/engine.ts#L3431) `ScriptEngine/revertTransaction` | `Store.findIds` (3431) | SCRIPT |
| [packages/scripts/src/engine.ts:2362](../../packages/scripts/src/engine.ts#L2362) `ScriptEngine/semanticFind` | `Store.findIds` (2362, 2383) | SCRIPT |
| [packages/scripts/src/engine.ts:3334](../../packages/scripts/src/engine.ts#L3334) `ScriptEngine/sortIds` | `Store.sortIds` (3334); `Store.valueListItems` (3340) | SCRIPT |
| [packages/scripts/src/engine.ts:7222](../../packages/scripts/src/engine.ts#L7222) `ScriptEngine/sourceValue` | `Store.get` (7222); `Store.containerId` (7223); `Store.container` (7224) | SCRIPT |
| [packages/scripts/src/engine.ts:3277](../../packages/scripts/src/engine.ts#L3277) `ScriptEngine/sqlByNaturalLanguage` | `Calculations.translateSQL` (3277); `Calculations.executeSQL` (3284) | SCRIPT |
| [packages/scripts/src/engine.ts:3991](../../packages/scripts/src/engine.ts#L3991) `ScriptEngine/step` | `Store.fieldIndex` (3991); `Store.findIds` (4125, 4224) | SCRIPT |
| [packages/scripts/src/engine.ts:5671](../../packages/scripts/src/engine.ts#L5671) `ScriptEngine/valueOf` | `Store.findIds` (5671, 5671); `Store.containerId` (5679) | SCRIPT |
| [packages/scripts/src/engine.ts:9155](../../packages/scripts/src/engine.ts#L9155) `clearRecords` | `SQLite.all` (9155); `SQLite.prepare` (9155) | SCRIPT |
| [packages/scripts/src/recorder.ts:83](../../packages/scripts/src/recorder.ts#L83) `lastSeq` | `Store.auditLog` (83) | DESIGN |
| [packages/scripts/src/recorder.ts:121](../../packages/scripts/src/recorder.ts#L121) `recordRun` | `Store.auditLog` (121) | DESIGN |
| [packages/scripts/src/script-tests.ts:213](../../packages/scripts/src/script-tests.ts#L213) `runCase` | `Store.findIds` (213); `Store.auditLog` (220, 221, 265); `Store.evaluateEach` (248) | DESIGN |
| [packages/scripts/src/testrun.ts:306](../../packages/scripts/src/testrun.ts#L306) `recordWith` | `Store.evaluateEach` (306) | DESIGN |
| [packages/scripts/src/testrun.ts:199](../../packages/scripts/src/testrun.ts#L199) `seedSelections` | `Calculations.globalValue` (199); `Store.find` (204) | DESIGN |
| [packages/scripts/src/testrun.ts:338](../../packages/scripts/src/testrun.ts#L338) `testRun` | `Store.evaluateEach` (338) | DESIGN |
| [packages/scripts/src/testrun.ts:270](../../packages/scripts/src/testrun.ts#L270) `testScript` | `Store.findIds` (270) | DESIGN |
| [packages/server/src/admin.ts:2276](../../packages/server/src/admin.ts#L2276) `Admin/audit` | `Store.auditLog` (2276) | ADMIN |
| [packages/server/src/admin.ts:1040](../../packages/server/src/admin.ts#L1040) `Admin/handle` | `Store.externalContainerReport` (1040); `Store.orphanContainerReport` (1045, 1049) | ADMIN |
| [packages/server/src/admin.ts:2707](../../packages/server/src/admin.ts#L2707) `Admin/status` | `Store.externalContainerCount` (2707) | ADMIN |
| [packages/server/src/admin.ts:2359](../../packages/server/src/admin.ts#L2359) `Admin/viewAs` | `Store.find` (2359) | ADMIN |
| [packages/server/src/agent.ts:316](../../packages/server/src/agent.ts#L316) `dryRunPlan` | `Store.findIds` (316) | DESIGN |
| [packages/server/src/agent.ts:339](../../packages/server/src/agent.ts#L339) `runApprovedStep` | `Store.findIds` (339) | DESIGN |
| [packages/server/src/agent.ts:162](../../packages/server/src/agent.ts#L162) `runStep` | `Store.findIds` (162); `Store.auditLog` (230); `Store.canViewRecord` (242) | DESIGN |
| [packages/server/src/agent.ts:154](../../packages/server/src/agent.ts#L154) `runStep/visible` | `Store.findIds` (154) | DESIGN |
| [packages/server/src/ai-output.ts:147](../../packages/server/src/ai-output.ts#L147) `storedSecretValues` | `Calculations.globalValue` (147); `Store.select` (152) | REDACTION |
| [packages/server/src/ai-policy-sql.ts:49](../../packages/server/src/ai-policy-sql.ts#L49) `sqlFieldRefs` | `SQLite.all` (49, 51); `SQLite.prepare` (49, 51) | POLICY |
| [packages/server/src/ai-policy.ts:342](../../packages/server/src/ai-policy.ts#L342) `sql` | `Store.inspectQuery` (342) | POLICY |
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
| [packages/server/src/backup.ts:1009](../../packages/server/src/backup.ts#L1009) `accountDifferences/read` | `SQLite.all` (1009, 1011); `SQLite.prepare` (1009, 1011) | OPERATOR |
| [packages/server/src/backup.ts:277](../../packages/server/src/backup.ts#L277) `backupOnceHeld` | `SQLite.get` (277); `SQLite.prepare` (277) | OPERATOR |
| [packages/server/src/backup.ts:1082](../../packages/server/src/backup.ts#L1082) `columnInfo` | `SQLite.all` (1082); `SQLite.prepare` (1082) | OPERATOR |
| [packages/server/src/backup.ts:1066](../../packages/server/src/backup.ts#L1066) `credentialsReadable` | `SQLite.all` (1066); `SQLite.prepare` (1066) | OPERATOR |
| [packages/server/src/backup.ts:1036](../../packages/server/src/backup.ts#L1036) `readNames` | `SQLite.all` (1036); `SQLite.prepare` (1036) | OPERATOR |
| [packages/server/src/backup.ts:1117](../../packages/server/src/backup.ts#L1117) `reconcileCredentials` | `SQLite.all` (1117, 1139, 1154, 1164, 1170); `SQLite.prepare` (1117, 1125, 1139, 1141, 1154, 1155, 1162, 1164, 1165, 1170, 1171, 1175, 1176, 1177); `SQLite.get` (1125, 1175) | OPERATOR |
| [packages/server/src/backup.ts:1144](../../packages/server/src/backup.ts#L1144) `reconcileCredentials/accountColumns` | `SQLite.all` (1144); `SQLite.prepare` (1144) | OPERATOR |
| [packages/server/src/backup.ts:1120](../../packages/server/src/backup.ts#L1120) `reconcileCredentials/has` | `SQLite.all` (1120); `SQLite.prepare` (1120) | OPERATOR |
| [packages/server/src/backup.ts:1289](../../packages/server/src/backup.ts#L1289) `stageRestorePoint` | `SQLite.get` (1289, 1291, 1292); `SQLite.prepare` (1289, 1291, 1292) | OPERATOR |
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
| [packages/server/src/dataapi.ts:2001](../../packages/server/src/dataapi.ts#L2001) `DataApi/route` | `Store.get` (2001, 2222, 2223, 2246, 2254, 2301, 2325, 2345, 2382); `Store.valueListItems` (2016); `Store.find` (2177, 2225, 2415); `Store.findIds` (2181, 2420); `Store.query` (2420) | REST |
| [packages/server/src/dataapi.ts:2129](../../packages/server/src/dataapi.ts#L2129) `DataApi/route/recordOut` | `Store.portalCounts` (2129) | REST |
| [packages/server/src/dataapi.ts:2165](../../packages/server/src/dataapi.ts#L2165) `DataApi/route/shownAs` | `Store.get` (2165) | REST |
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
| [packages/server/src/mcp.ts:1369](../../packages/server/src/mcp.ts#L1369) `createMcpServer/check_record` | `Store.get` (1369); `Store.row` (1371) | MCP |
| [packages/server/src/mcp.ts:1090](../../packages/server/src/mcp.ts#L1090) `createMcpServer/evaluate_calculation` | `Store.get` (1090, 1098); `Store.find` (1091); `Store.evaluate` (1092); `Store.row` (1097) | SQL |
| [packages/server/src/mcp.ts:1393](../../packages/server/src/mcp.ts#L1393) `createMcpServer/explain_related` | `Store.get` (1393) | MCP |
| [packages/server/src/mcp.ts:1346](../../packages/server/src/mcp.ts#L1346) `createMcpServer/explain_value` | `Store.get` (1346); `Store.row` (1347) | MCP |
| [packages/server/src/mcp.ts:970](../../packages/server/src/mcp.ts#L970) `createMcpServer/find_records` | `Store.find` (970) | MCP |
| [packages/server/src/mcp.ts:1165](../../packages/server/src/mcp.ts#L1165) `createMcpServer/get_container` | `Store.container` (1165) | SQL |
| [packages/server/src/mcp.ts:983](../../packages/server/src/mcp.ts#L983) `createMcpServer/get_record` | `Store.get` (983) | MCP |
| [packages/server/src/mcp.ts:1189](../../packages/server/src/mcp.ts#L1189) `createMcpServer/sql_query` | `Store.queryWithOrigins` (1189) | SQL |
| [packages/server/src/mcp.ts:1033](../../packages/server/src/mcp.ts#L1033) `createMcpServer/update_record` | `Store.get` (1033, 1037) | MCP |
| [packages/server/src/mcp.ts:2290](../../packages/server/src/mcp.ts#L2290) `registerResources/audit` | `Store.auditLog` (2290) | MCP |
| [packages/server/src/oauth.ts:880](../../packages/server/src/oauth.ts#L880) `OAuthServer/accessAllowed` | `SQLite.get` (880); `SQLite.prepare` (880) | AUTH |
| [packages/server/src/oauth.ts:506](../../packages/server/src/oauth.ts#L506) `OAuthServer/authorize` | `SQLite.get` (506); `SQLite.prepare` (506, 510, 512, 519, 542, 543) | AUTH |
| [packages/server/src/oauth.ts:487](../../packages/server/src/oauth.ts#L487) `OAuthServer/authorize/done` | `SQLite.prepare` (487, 488) | AUTH |
| [packages/server/src/oauth.ts:386](../../packages/server/src/oauth.ts#L386) `OAuthServer/client` | `SQLite.get` (386); `SQLite.prepare` (386) | AUTH |
| [packages/server/src/oauth.ts:193](../../packages/server/src/oauth.ts#L193) `OAuthServer/constructor` | `SQLite.all` (193); `SQLite.prepare` (193, 220, 222, 231, 232, 235); `SQLite.iterate` (220); `SQLite.get` (222); `Store.sql` (222, 231) | AUTH |
| [packages/server/src/oauth.ts:186](../../packages/server/src/oauth.ts#L186) `OAuthServer/constructor/cols` | `SQLite.all` (186); `SQLite.prepare` (186) | AUTH |
| [packages/server/src/oauth.ts:863](../../packages/server/src/oauth.ts#L863) `OAuthServer/endGrant` | `SQLite.prepare` (863, 864); `SQLite.all` (864) | AUTH |
| [packages/server/src/oauth.ts:819](../../packages/server/src/oauth.ts#L819) `OAuthServer/issue/write` | `SQLite.get` (819); `SQLite.prepare` (819, 820, 821) | AUTH |
| [packages/server/src/oauth.ts:876](../../packages/server/src/oauth.ts#L876) `OAuthServer/managedAccess` | `SQLite.get` (876); `SQLite.prepare` (876) | AUTH |
| [packages/server/src/oauth.ts:366](../../packages/server/src/oauth.ts#L366) `OAuthServer/register` | `SQLite.prepare` (366, 367, 368, 369, 370); `SQLite.get` (367, 369) | AUTH |
| [packages/server/src/oauth.ts:893](../../packages/server/src/oauth.ts#L893) `OAuthServer/revoke` | `SQLite.get` (893, 894, 904, 905); `SQLite.prepare` (893, 894, 897, 904, 905, 909) | AUTH |
| [packages/server/src/oauth.ts:839](../../packages/server/src/oauth.ts#L839) `OAuthServer/sweep` | `SQLite.all` (839); `SQLite.prepare` (839, 841, 842, 843, 844) | AUTH |
| [packages/server/src/oauth.ts:698](../../packages/server/src/oauth.ts#L698) `OAuthServer/token` | `SQLite.get` (698, 729, 731, 734, 747); `SQLite.prepare` (698, 729, 731, 734, 743, 746, 747, 747, 749, 751) | AUTH |
| [packages/server/src/oauth.ts:85](../../packages/server/src/oauth.ts#L85) `legacyPasswordMark` | `SQLite.get` (85); `SQLite.prepare` (85); `Store.sql` (85) | AUTH |
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
| [packages/server/src/pgwire.ts:861](../../packages/server/src/pgwire.ts#L861) `Connection/bareNames` | `Store.describe` (861) | SQL |
| [packages/server/src/pgwire.ts:877](../../packages/server/src/pgwire.ts#L877) `Connection/catalog` | `Store.describeTyped` (877) | SQL |
| [packages/server/src/pgwire.ts:1252](../../packages/server/src/pgwire.ts#L1252) `Connection/describe` | `Store.describeTyped` (1252) | SQL |
| [packages/server/src/pgwire.ts:888](../../packages/server/src/pgwire.ts#L888) `Connection/run` | `Store.selectIn` (888); `Store.describeTyped` (892) | SQL |
| [packages/server/src/pgwire.ts:838](../../packages/server/src/pgwire.ts#L838) `Connection/translate` | `Calculations.translateSQL` (838) | SQL |
| [packages/server/src/pgwire.ts:1019](../../packages/server/src/pgwire.ts#L1019) `Connection/validateSyntax` | `SQLite.prepare` (1019); `Store.sql` (1019) | SQL |
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
| [packages/store/src/exit-bundle.ts:266](../../packages/store/src/exit-bundle.ts#L266) `build` | `SQLite.prepare` (266) | EXIT-BUNDLE |
| [packages/store/src/exit-bundle.ts:289](../../packages/store/src/exit-bundle.ts#L289) `copyTables` | `SQLite.all` (289); `SQLite.prepare` (289, 295, 296, 312); `SQLite.get` (298, 309, 312) | EXIT-BUNDLE |
| [packages/store/src/exit-bundle.ts:467](../../packages/store/src/exit-bundle.ts#L467) `finish` | `SQLite.all` (467); `SQLite.prepare` (467); `Calculations.globalValue` (479) | EXIT-BUNDLE |
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
| [packages/store/src/import.ts:180](../../packages/store/src/import.ts#L180) `applyFileAccountStatus` | `SQLite.get` (180, 182); `SQLite.prepare` (180, 182, 184, 196) | OPERATOR |
| [packages/store/src/import.ts:217](../../packages/store/src/import.ts#L217) `createStore` | `SQLite.prepare` (217, 228) | OPERATOR |
| [packages/store/src/import.ts:136](../../packages/store/src/import.ts#L136) `importDesigns` | `SQLite.all` (136); `SQLite.prepare` (136, 150, 153, 156, 158); `SQLite.get` (150, 153) | OPERATOR |
| [packages/store/src/import.ts:352](../../packages/store/src/import.ts#L352) `importFmp12` | `SQLite.prepare` (352, 362, 368, 374, 378, 393, 404, 479, 480); `SQLite.get` (368, 393); `SQLite.all` (374) | OPERATOR |
| [packages/store/src/import.ts:343](../../packages/store/src/import.ts#L343) `importFmp12/save` | `SQLite.prepare` (343) | OPERATOR |
| [packages/store/src/import.ts:240](../../packages/store/src/import.ts#L240) `needsDesigns` | `SQLite.get` (240); `SQLite.prepare` (240) | OPERATOR |
| [packages/store/src/import.ts:287](../../packages/store/src/import.ts#L287) `readState` | `SQLite.get` (287); `SQLite.prepare` (287) | OPERATOR |
| [packages/store/src/import.ts:104](../../packages/store/src/import.ts#L104) `writeDesign` | `SQLite.prepare` (104, 108) | OPERATOR |
| [packages/store/src/layout-speed.ts:56](../../packages/store/src/layout-speed.ts#L56) `layoutCost/recordCount` | `Store.recordCount` (56) | DESIGN |
| [packages/store/src/layout-speed.ts:419](../../packages/store/src/layout-speed.ts#L419) `speedContext` | `Store.recordCount` (419) | DESIGN |
| [packages/store/src/privileges.ts:549](../../packages/store/src/privileges.ts#L549) `ensurePrivilegeTables` | `SQLite.all` (549); `SQLite.prepare` (549) | AUTH |
| [packages/store/src/privileges.ts:521](../../packages/store/src/privileges.ts#L521) `privilegeSets` | `SQLite.all` (521); `SQLite.prepare` (521) | AUTH |
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
| [packages/store/src/store.ts:4718](../../packages/store/src/store.ts#L4718) `Store/accountIdentityId` | `SQLite.get` (4718, 4723); `SQLite.prepare` (4718, 4722, 4723); `Store.sql` (4718, 4722, 4723) | CORE |
| [packages/store/src/store.ts:4681](../../packages/store/src/store.ts#L4681) `Store/accountInactive` | `SQLite.get` (4681); `SQLite.prepare` (4681); `Store.sql` (4681) | CORE |
| [packages/store/src/store.ts:4846](../../packages/store/src/store.ts#L4846) `Store/accountLocalOnly` | `SQLite.get` (4846); `SQLite.prepare` (4846); `Store.sql` (4846) | CORE |
| [packages/store/src/store.ts:5705](../../packages/store/src/store.ts#L5705) `Store/accountPrivilegeSet` | `SQLite.get` (5705); `SQLite.prepare` (5705); `Store.sql` (5705) | CORE |
| [packages/store/src/store.ts:4851](../../packages/store/src/store.ts#L4851) `Store/accountRequires2fa` | `SQLite.get` (4851); `SQLite.prepare` (4851); `Store.sql` (4851) | CORE |
| [packages/store/src/store.ts:5071](../../packages/store/src/store.ts#L5071) `Store/accountUsage` | `SQLite.get` (5071); `SQLite.prepare` (5071, 5072); `Store.sql` (5071, 5072); `SQLite.all` (5072); `Store.auditLog` (5088) | CORE |
| [packages/store/src/store.ts:3164](../../packages/store/src/store.ts#L3164) `Store/accounts` | `SQLite.all` (3164); `SQLite.prepare` (3164); `Store.sql` (3164) | CORE |
| [packages/store/src/store.ts:3160](../../packages/store/src/store.ts#L3160) `Store/accountsSharingLockout` | `SQLite.all` (3160); `SQLite.prepare` (3160); `Store.sql` (3160) | CORE |
| [packages/store/src/store.ts:7788](../../packages/store/src/store.ts#L7788) `Store/addContainer` | `SQLite.all` (7788); `SQLite.prepare` (7788, 7793, 7807, 7811, 7812); `Store.sql` (7788, 7793, 7807, 7809, 7811, 7812, 7814, 7817); `SQLite.get` (7798); `Store.containerRange` (7800) | CORE |
| [packages/store/src/store.ts:7834](../../packages/store/src/store.ts#L7834) `Store/addExternalContainer` | `SQLite.prepare` (7834); `Store.sql` (7834) | CORE |
| [packages/store/src/store.ts:8290](../../packages/store/src/store.ts#L8290) `Store/addFieldIndex` | `Store.sql` (8290) | CORE |
| [packages/store/src/store.ts:6494](../../packages/store/src/store.ts#L6494) `Store/addImage` | `Store.sql` (6494, 6495); `SQLite.prepare` (6495) | CORE |
| [packages/store/src/store.ts:5755](../../packages/store/src/store.ts#L5755) `Store/addProvisionedAccount` | `SQLite.get` (5755); `SQLite.prepare` (5755, 5759); `Store.sql` (5755, 5759) | CORE |
| [packages/store/src/store.ts:6913](../../packages/store/src/store.ts#L6913) `Store/addRelated` | `relatedRows` (6913); `rowsById` (6946); `firstRelatedEach` (6969) | CORE |
| [packages/store/src/store.ts:3182](../../packages/store/src/store.ts#L3182) `Store/agentNeedsApproval` | `SQLite.get` (3182); `SQLite.prepare` (3182); `Store.sql` (3182) | CORE |
| [packages/store/src/store.ts:5969](../../packages/store/src/store.ts#L5969) `Store/allowedIds` | `SQLite.iterate` (5969); `SQLite.prepare` (5969); `Store.sql` (5969) | CORE |
| [packages/store/src/store.ts:5128](../../packages/store/src/store.ts#L5128) `Store/apiToken` | `SQLite.get` (5128); `SQLite.prepare` (5128, 5141); `Store.sql` (5128, 5141) | CORE |
| [packages/store/src/store.ts:5104](../../packages/store/src/store.ts#L5104) `Store/apiTokens` | `SQLite.all` (5104); `SQLite.prepare` (5104); `Store.sql` (5104) | CORE |
| [packages/store/src/store.ts:3522](../../packages/store/src/store.ts#L3522) `Store/appendSecurityEvent` | `Store.sql` (3522) | CORE |
| [packages/store/src/store.ts:4527](../../packages/store/src/store.ts#L4527) `Store/applyAccountImport` | `Store.sql` (4527, 4535, 4564); `SQLite.get` (4535); `SQLite.prepare` (4535, 4564) | CORE |
| [packages/store/src/store.ts:2125](../../packages/store/src/store.ts#L2125) `Store/applyDesign` | `Store.sql` (2125, 2126, 2139, 2142, 2147, 2163, 2166, 2166); `SQLite.prepare` (2142, 2147) | CORE |
| [packages/store/src/store.ts:3378](../../packages/store/src/store.ts#L3378) `Store/approvePending` | `SQLite.get` (3378); `SQLite.prepare` (3378, 3389); `Store.sql` (3378, 3389) | CORE |
| [packages/store/src/store.ts:2584](../../packages/store/src/store.ts#L2584) `Store/audit` | `Store.sql` (2584) | CORE |
| [packages/store/src/store.ts:2225](../../packages/store/src/store.ts#L2225) `Store/auditLog` | `SQLite.all` (2225); `SQLite.prepare` (2225); `Store.sql` (2225) | CORE |
| [packages/store/src/store.ts:1736](../../packages/store/src/store.ts#L1736) `Store/backup` | `Store.sql` (1736) | CORE |
| [packages/store/src/store.ts:3188](../../packages/store/src/store.ts#L3188) `Store/blankPasswordAccounts` | `SQLite.all` (3188); `SQLite.prepare` (3188); `Store.sql` (3188) | CORE |
| [packages/store/src/store.ts:8871](../../packages/store/src/store.ts#L8871) `Store/canView` | `Store.canView` (8871); `Store.row` (8872) | GATED-STORE |
| [packages/store/src/store.ts:8853](../../packages/store/src/store.ts#L8853) `Store/canViewRecord` | `SQLite.get` (8853); `SQLite.prepare` (8853); `Store.sql` (8853) | GATED-STORE |
| [packages/store/src/store.ts:4456](../../packages/store/src/store.ts#L4456) `Store/canonicalAccount` | `SQLite.all` (4456); `SQLite.prepare` (4456); `Store.sql` (4456) | CORE |
| [packages/store/src/store.ts:9930](../../packages/store/src/store.ts#L9930) `Store/cascadeDelete` | `relatedRows` (9930) | CORE |
| [packages/store/src/store.ts:1955](../../packages/store/src/store.ts#L1955) `Store/changeOne` | `Store.sql` (1955, 1957) | CORE |
| [packages/store/src/store.ts:1958](../../packages/store/src/store.ts#L1958) `Store/changeOne/read` | `SQLite.get` (1958); `SQLite.prepare` (1958); `Store.sql` (1958) | CORE |
| [packages/store/src/store.ts:8169](../../packages/store/src/store.ts#L8169) `Store/checkContainerWrite` | `Store.row` (8169) | CORE |
| [packages/store/src/store.ts:9583](../../packages/store/src/store.ts#L9583) `Store/checkEditable` | `Store.row` (9583) | CORE |
| [packages/store/src/store.ts:1391](../../packages/store/src/store.ts#L1391) `Store/checkpoint` | `SQLite.get` (1391); `SQLite.prepare` (1391); `Store.sql` (1391) | CORE |
| [packages/store/src/store.ts:5741](../../packages/store/src/store.ts#L5741) `Store/clearAccountPrivilegeSet` | `SQLite.prepare` (5741); `Store.sql` (5741) | CORE |
| [packages/store/src/store.ts:1409](../../packages/store/src/store.ts#L1409) `Store/close` | `Store.sql` (1409) | CORE |
| [packages/store/src/store.ts:8137](../../packages/store/src/store.ts#L8137) `Store/compactFile` | `Store.sql` (8137, 8138, 8140) | CORE |
| [packages/store/src/store.ts:10054](../../packages/store/src/store.ts#L10054) `Store/computeValuesCurrent` | `Store.computeValues` (10054); `Store.sql` (10060, 10064); `SQLite.all` (10064); `SQLite.prepare` (10064) | GATED-STORE |
| [packages/store/src/store.ts:8522](../../packages/store/src/store.ts#L8522) `Store/computedRows` | `Store.sql` (8522, 8525, 8526, 8527, 8529, 8539, 8540, 8541, 8544); `SQLite.prepare` (8525, 8527, 8529, 8539); `SQLite.iterate` (8529); `Calculations.globalValue` (8532); `Calculations.unstoredValue` (8533); `Calculations.related` (8536); `SQLite.all` (8539) | CORE |
| [packages/store/src/store.ts:5168](../../packages/store/src/store.ts#L5168) `Store/confirmTotp` | `SQLite.get` (5168); `SQLite.prepare` (5168, 5170); `Store.sql` (5168, 5170) | CORE |
| [packages/store/src/store.ts:1067](../../packages/store/src/store.ts#L1067) `Store/constructor` | `Store.sql` (1067, 1069, 1071, 1072, 1076, 1080, 1081, 1092, 1097, 1102, 1103, 1107, 1108, 1109, 1116, 1120, 1124, 1125, 1126, 1131, 1135, 1138, 1139, 1141, 1142, 1145, 1146, 1150, 1151, 1155, 1156, 1159, 1161, 1164, 1165, 1169, 1170, 1174, 1175, 1178, 1179, 1180, 1183, 1184, 1187, 1188, 1190, 1190, 1191, 1191, 1192, 1195, 1199, 1201, 1204, 1205, 1206, 1209, 1210, 1212, 1214, 1215, 1219, 1220, 1222, 1226, 1228, 1229, 1230, 1230, 1234, 1235); `SQLite.get` (1071); `SQLite.prepare` (1071, 1138, 1139, 1142, 1145, 1150, 1155, 1164, 1169, 1174, 1183, 1187, 1190, 1191, 1209, 1214, 1219); `SQLite.all` (1138, 1145, 1150, 1155, 1164, 1169, 1174, 1183, 1187, 1190, 1191, 1209, 1214, 1219) | CORE |
| [packages/store/src/store.ts:5521](../../packages/store/src/store.ts#L5521) `Store/consumeRecoveryCode` | `SQLite.prepare` (5521); `Store.sql` (5521) | CORE |
| [packages/store/src/store.ts:7712](../../packages/store/src/store.ts#L7712) `Store/container` | `SQLite.get` (7712); `SQLite.prepare` (7712, 7721); `Store.sql` (7712, 7721); `SQLite.all` (7721) | CORE |
| [packages/store/src/store.ts:8146](../../packages/store/src/store.ts#L8146) `Store/containerId` | `Store.containerId` (8146); `Store.row` (8147) | CORE |
| [packages/store/src/store.ts:7729](../../packages/store/src/store.ts#L7729) `Store/containerInfo` | `SQLite.get` (7729); `SQLite.prepare` (7729); `Store.sql` (7729) | CORE |
| [packages/store/src/store.ts:7693](../../packages/store/src/store.ts#L7693) `Store/containerIntact` | `SQLite.get` (7693); `SQLite.prepare` (7693); `Store.sql` (7693) | CORE |
| [packages/store/src/store.ts:7632](../../packages/store/src/store.ts#L7632) `Store/containerIntegrityReport` | `SQLite.all` (7632); `SQLite.prepare` (7632, 7643); `Store.sql` (7632, 7643); `SQLite.get` (7643) | CORE |
| [packages/store/src/store.ts:7707](../../packages/store/src/store.ts#L7707) `Store/containerMeta` | `SQLite.get` (7707); `SQLite.prepare` (7707); `Store.sql` (7707) | CORE |
| [packages/store/src/store.ts:7763](../../packages/store/src/store.ts#L7763) `Store/containerRange` | `SQLite.all` (7763); `SQLite.prepare` (7763, 7770); `Store.sql` (7763, 7770); `SQLite.get` (7770) | CORE |
| [packages/store/src/store.ts:7534](../../packages/store/src/store.ts#L7534) `Store/containerReferences` | `SQLite.all` (7534, 7553, 7555, 7561, 7574, 7585, 7599); `SQLite.prepare` (7534, 7553, 7555, 7561, 7574, 7585, 7597, 7599); `Store.sql` (7534, 7553, 7555, 7561, 7574, 7585, 7597, 7599); `SQLite.get` (7597); `Store.row` (7608) | CORE |
| [packages/store/src/store.ts:10034](../../packages/store/src/store.ts#L10034) `Store/countIds` | `Store.countIds` (10034); `SQLite.get` (10038); `SQLite.prepare` (10038); `Store.sql` (10038) | GATED-STORE |
| [packages/store/src/store.ts:8896](../../packages/store/src/store.ts#L8896) `Store/create` | `SQLite.get` (8896, 8902); `SQLite.prepare` (8896, 8902, 8915); `Store.sql` (8896, 8902, 8915) | CORE |
| [packages/store/src/store.ts:3494](../../packages/store/src/store.ts#L3494) `Store/createAccount` | `SQLite.get` (3494); `SQLite.prepare` (3494, 3498, 3504, 3509, 3514); `Store.sql` (3494, 3498, 3504, 3509, 3514) | CORE |
| [packages/store/src/store.ts:4904](../../packages/store/src/store.ts#L4904) `Store/createApiToken` | `SQLite.get` (4904, 4932); `SQLite.prepare` (4904, 4931, 4932, 4942); `Store.sql` (4904, 4931, 4932, 4942) | CORE |
| [packages/store/src/store.ts:4468](../../packages/store/src/store.ts#L4468) `Store/createLocalAccount` | `SQLite.prepare` (4468); `Store.sql` (4468) | CORE |
| [packages/store/src/store.ts:3154](../../packages/store/src/store.ts#L3154) `Store/credentialIdentity` | `SQLite.get` (3154); `SQLite.prepare` (3154); `Store.sql` (3154) | CORE |
| [packages/store/src/store.ts:1826](../../packages/store/src/store.ts#L1826) `Store/dataVersion` | `SQLite.get` (1826); `SQLite.prepare` (1826); `Store.sql` (1826) | CORE |
| [packages/store/src/store.ts:9626](../../packages/store/src/store.ts#L9626) `Store/delete` | `Store.row` (9626) | CORE |
| [packages/store/src/store.ts:9634](../../packages/store/src/store.ts#L9634) `Store/delete/run` | `SQLite.get` (9634); `SQLite.prepare` (9634, 9639); `Store.sql` (9634, 9639) | CORE |
| [packages/store/src/store.ts:4622](../../packages/store/src/store.ts#L4622) `Store/deleteAccount` | `SQLite.prepare` (4622, 4626, 4627, 4628, 4629, 4630, 4631, 4632, 4633, 4640, 4642, 4644, 4646, 4650); `Store.sql` (4622, 4626, 4627, 4628, 4629, 4630, 4631, 4632, 4633, 4640, 4642, 4644, 4646, 4650) | CORE |
| [packages/store/src/store.ts:5606](../../packages/store/src/store.ts#L5606) `Store/deletePrivilegeSet` | `SQLite.prepare` (5606); `Store.sql` (5606) | CORE |
| [packages/store/src/store.ts:3632](../../packages/store/src/store.ts#L3632) `Store/deleteScriptTest` | `SQLite.prepare` (3632); `Store.sql` (3632) | CORE |
| [packages/store/src/store.ts:2799](../../packages/store/src/store.ts#L2799) `Store/deletedRows` | `SQLite.get` (2799); `SQLite.prepare` (2799, 2801, 2801); `Store.sql` (2799, 2801, 2801); `SQLite.all` (2801, 2801) | CORE |
| [packages/store/src/store.ts:2909](../../packages/store/src/store.ts#L2909) `Store/designEffect` | `Store.sql` (2909, 2914, 2919, 2924, 2927, 2933, 2944, 2945, 2947, 2960, 2961, 2964, 2966, 2972, 2973, 2974, 2979, 2981, 2985, 2988, 2989, 2991, 2994, 3000, 3002, 3009, 3010, 3012, 3013, 3014, 3015, 3022, 3023, 3025, 3025, 3027, 3028, 3029, 3033, 3037, 3039, 3077, 3079, 3081); `SQLite.get` (2944, 2960, 2972, 2973, 2985, 2989, 3025, 3033); `SQLite.prepare` (2944, 2945, 2960, 2961, 2972, 2973, 2979, 2981, 2985, 2989, 3000, 3002, 3015, 3022, 3023, 3025, 3027, 3029, 3033, 3037); `SQLite.all` (3022, 3023); `SQLite.iterate` (3027) | CORE |
| [packages/store/src/store.ts:2902](../../packages/store/src/store.ts#L2902) `Store/designEffect/renameExcluded` | `SQLite.prepare` (2902); `Store.sql` (2902) | CORE |
| [packages/store/src/store.ts:2886](../../packages/store/src/store.ts#L2886) `Store/designEffect/renameKey` | `SQLite.prepare` (2886); `Store.sql` (2886) | CORE |
| [packages/store/src/store.ts:2840](../../packages/store/src/store.ts#L2840) `Store/designHistory` | `SQLite.all` (2840); `SQLite.prepare` (2840); `Store.sql` (2840) | CORE |
| [packages/store/src/store.ts:5189](../../packages/store/src/store.ts#L5189) `Store/disableTotp` | `SQLite.prepare` (5189); `Store.sql` (5189) | CORE |
| [packages/store/src/store.ts:3089](../../packages/store/src/store.ts#L3089) `Store/dropColumnIndexes` | `SQLite.all` (3089, 3091); `SQLite.prepare` (3089, 3091); `Store.sql` (3089, 3091, 3092) | CORE |
| [packages/store/src/store.ts:8302](../../packages/store/src/store.ts#L8302) `Store/dropFieldIndex` | `SQLite.get` (8302); `SQLite.prepare` (8302); `Store.sql` (8302, 8303) | CORE |
| [packages/store/src/store.ts:8939](../../packages/store/src/store.ts#L8939) `Store/duplicate` | `Store.row` (8939); `SQLite.get` (8943); `SQLite.prepare` (8943, 8958); `Store.sql` (8943, 8958) | CORE |
| [packages/store/src/store.ts:7950](../../packages/store/src/store.ts#L7950) `Store/embeddedContainerCount` | `SQLite.prepare` (7950); `Store.sql` (7950); `SQLite.get` (7951) | CORE |
| [packages/store/src/store.ts:7936](../../packages/store/src/store.ts#L7936) `Store/embeddedContainers` | `SQLite.prepare` (7936, 7937); `Store.sql` (7936, 7937); `SQLite.all` (7937); `SQLite.get` (7941) | CORE |
| [packages/store/src/store.ts:2825](../../packages/store/src/store.ts#L2825) `Store/emptyDeleted` | `Store.sql` (2825, 2828, 2829, 2831, 2833); `SQLite.prepare` (2829) | CORE |
| [packages/store/src/store.ts:1706](../../packages/store/src/store.ts#L1706) `Store/endTransaction` | `Store.sql` (1706, 1709, 1709) | CORE |
| [packages/store/src/store.ts:5157](../../packages/store/src/store.ts#L5157) `Store/enrollTotp` | `SQLite.prepare` (5157); `Store.sql` (5157) | CORE |
| [packages/store/src/store.ts:2794](../../packages/store/src/store.ts#L2794) `Store/ensureDeleted` | `Store.sql` (2794) | CORE |
| [packages/store/src/store.ts:1245](../../packages/store/src/store.ts#L1245) `Store/ensureNativeIds` | `SQLite.all` (1245, 1257); `SQLite.prepare` (1245, 1248, 1256, 1257); `Store.sql` (1245, 1248, 1251, 1255, 1256, 1257, 1260, 1262) | CORE |
| [packages/store/src/store.ts:9280](../../packages/store/src/store.ts#L9280) `Store/evaluateCurrent` | `Store.row` (9280, 9280, 9281, 9281); `Calculations.context` (9286); `Store.get` (9287, 9289) | GATED-STORE |
| [packages/store/src/store.ts:9321](../../packages/store/src/store.ts#L9321) `Store/evaluateEachCurrent` | `Store.row` (9321, 9321, 9326); `Calculations.context` (9327); `Store.get` (9329) | GATED-STORE |
| [packages/store/src/store.ts:9383](../../packages/store/src/store.ts#L9383) `Store/evaluateRowsCurrent` | `Store.row` (9383, 9383, 9384, 9384) | GATED-STORE |
| [packages/store/src/store.ts:9362](../../packages/store/src/store.ts#L9362) `Store/evaluateRowsCurrent/each` | `Calculations.context` (9362); `Store.get` (9364) | GATED-STORE |
| [packages/store/src/store.ts:9398](../../packages/store/src/store.ts#L9398) `Store/evaluateRowsCurrent/found/[Symbol.iterator]` | `rowsById` (9398) | GATED-STORE |
| [packages/store/src/store.ts:9420](../../packages/store/src/store.ts#L9420) `Store/evaluateRowsCurrent/key` | `Calculations.context` (9420) | GATED-STORE |
| [packages/store/src/store.ts:3421](../../packages/store/src/store.ts#L3421) `Store/externalAccount` | `SQLite.all` (3421); `SQLite.prepare` (3421); `Store.sql` (3421) | CORE |
| [packages/store/src/store.ts:7455](../../packages/store/src/store.ts#L7455) `Store/externalContainerCheck` | `SQLite.all` (7455); `SQLite.prepare` (7455); `Store.sql` (7455) | CORE |
| [packages/store/src/store.ts:7462](../../packages/store/src/store.ts#L7462) `Store/externalContainerCount` | `SQLite.get` (7462); `SQLite.prepare` (7462); `Store.sql` (7462) | CORE |
| [packages/store/src/store.ts:7471](../../packages/store/src/store.ts#L7471) `Store/externalContainerReport` | `SQLite.all` (7471, 7484); `SQLite.prepare` (7471, 7484); `Store.sql` (7471, 7484) | CORE |
| [packages/store/src/store.ts:4707](../../packages/store/src/store.ts#L4707) `Store/externalIdentityId` | `SQLite.get` (4707, 4713); `SQLite.prepare` (4707, 4712, 4713); `Store.sql` (4707, 4712, 4713) | CORE |
| [packages/store/src/store.ts:7703](../../packages/store/src/store.ts#L7703) `Store/externalOf` | `SQLite.get` (7703); `SQLite.prepare` (7703); `Store.sql` (7703) | CORE |
| [packages/store/src/store.ts:2732](../../packages/store/src/store.ts#L2732) `Store/failureAuditRoom` | `SQLite.get` (2732); `SQLite.prepare` (2732); `Store.sql` (2732) | CORE |
| [packages/store/src/store.ts:7115](../../packages/store/src/store.ts#L7115) `Store/fieldIndexCurrent` | `SQLite.iterate` (7115); `SQLite.prepare` (7115, 7120); `Store.sql` (7115, 7120); `SQLite.all` (7120) | GATED-STORE |
| [packages/store/src/store.ts:8337](../../packages/store/src/store.ts#L8337) `Store/find` | `Store.find` (8337) | GATED-STORE |
| [packages/store/src/store.ts:8709](../../packages/store/src/store.ts#L8709) `Store/findCandidates` | `Store.query` (8709) | CORE |
| [packages/store/src/store.ts:8348](../../packages/store/src/store.ts#L8348) `Store/findHere` | `Store.query` (8348, 8353, 8355, 8369, 8371, 8382); `Store.recordCount` (8366); `SQLite.get` (8367, 8371); `SQLite.prepare` (8367, 8371, 8377, 8384, 8393); `Store.sql` (8367, 8371, 8377, 8384, 8393); `SQLite.all` (8377, 8384, 8393) | GATED-STORE |
| [packages/store/src/store.ts:8388](../../packages/store/src/store.ts#L8388) `Store/findHere/[Symbol.iterator]` | `SQLite.iterate` (8388); `SQLite.prepare` (8388); `Store.sql` (8388) | GATED-STORE |
| [packages/store/src/store.ts:10079](../../packages/store/src/store.ts#L10079) `Store/findIdsCurrent` | `Store.findIds` (10079) | GATED-STORE |
| [packages/store/src/store.ts:10085](../../packages/store/src/store.ts#L10085) `Store/findIdsHere` | `Store.query` (10085, 10090, 10092); `SQLite.iterate` (10103); `SQLite.prepare` (10103); `Store.sql` (10103) | GATED-STORE |
| [packages/store/src/store.ts:8653](../../packages/store/src/store.ts#L8653) `Store/findSource` | `Store.query` (8653); `SQLite.all` (8662, 8679); `SQLite.prepare` (8662, 8670, 8678); `Store.sql` (8662, 8667, 8670, 8675, 8678, 8692, 8694); `Calculations.globalValue` (8684); `Calculations.unstoredValue` (8685); `Calculations.related` (8689) | CORE |
| [packages/store/src/store.ts:9675](../../packages/store/src/store.ts#L9675) `Store/forgetStandInValues` | `Store.sql` (9675, 9696); `SQLite.prepare` (9696) | CORE |
| [packages/store/src/store.ts:4589](../../packages/store/src/store.ts#L4589) `Store/forgetStandIns` | `SQLite.prepare` (4589); `Store.sql` (4589) | CORE |
| [packages/store/src/store.ts:6997](../../packages/store/src/store.ts#L6997) `Store/foundSetPage` | `rowsById` (6997) | CORE |
| [packages/store/src/store.ts:7013](../../packages/store/src/store.ts#L7013) `Store/foundSetRowsCurrent` | `Store.viewableIds` (7013); `Store.row` (7029) | GATED-STORE |
| [packages/store/src/store.ts:3340](../../packages/store/src/store.ts#L3340) `Store/gateAgentWrite` | `SQLite.get` (3340); `SQLite.prepare` (3340, 3342); `Store.sql` (3340, 3342) | CORE |
| [packages/store/src/store.ts:5459](../../packages/store/src/store.ts#L5459) `Store/generateRecoveryCodes` | `SQLite.prepare` (5459, 5462); `Store.sql` (5459, 5462) | CORE |
| [packages/store/src/store.ts:8781](../../packages/store/src/store.ts#L8781) `Store/getCurrent` | `Store.get` (8781); `Store.row` (8782, 8782, 8796); `SQLite.all` (8799); `SQLite.prepare` (8799); `Store.sql` (8799) | GATED-STORE |
| [packages/store/src/store.ts:8819](../../packages/store/src/store.ts#L8819) `Store/getManyCurrent` | `Store.getMany` (8819); `SQLite.get` (8837); `SQLite.prepare` (8837); `Store.sql` (8837) | GATED-STORE |
| [packages/store/src/store.ts:8830](../../packages/store/src/store.ts#L8830) `Store/getManyCurrent/[Symbol.iterator]` | `rowsById` (8830) | GATED-STORE |
| [packages/store/src/store.ts:1292](../../packages/store/src/store.ts#L1292) `Store/grantFullAccessClients` | `SQLite.prepare` (1292); `Store.sql` (1292) | CORE |
| [packages/store/src/store.ts:10120](../../packages/store/src/store.ts#L10120) `Store/groupSummariesCurrent` | `Store.groupSummaries` (10120); `Store.viewableIds` (10125); `Calculations.collect` (10141); `rowsById` (10141, 10191); `Calculations.collector` (10163) | GATED-STORE |
| [packages/store/src/store.ts:10189](../../packages/store/src/store.ts#L10189) `Store/groupSummariesCurrent/flush` | `Calculations.collector` (10189) | GATED-STORE |
| [packages/store/src/store.ts:10153](../../packages/store/src/store.ts#L10153) `Store/groupSummariesCurrent/key` | `Calculations.value` (10153); `Calculations.related` (10155) | GATED-STORE |
| [packages/store/src/store.ts:1319](../../packages/store/src/store.ts#L1319) `Store/hasOwnPassword` | `SQLite.get` (1319); `SQLite.prepare` (1319); `Store.sql` (1319) | CORE |
| [packages/store/src/store.ts:5314](../../packages/store/src/store.ts#L5314) `Store/hasPasskey` | `SQLite.get` (5314); `SQLite.prepare` (5314); `Store.sql` (5314) | CORE |
| [packages/store/src/store.ts:1300](../../packages/store/src/store.ts#L1300) `Store/hasProvingPassword` | `SQLite.get` (1300); `SQLite.prepare` (1300); `Store.sql` (1300) | CORE |
| [packages/store/src/store.ts:8256](../../packages/store/src/store.ts#L8256) `Store/hasTable` | `SQLite.get` (8256); `SQLite.prepare` (8256); `Store.sql` (8256) | CORE |
| [packages/store/src/store.ts:5178](../../packages/store/src/store.ts#L5178) `Store/hasTotp` | `SQLite.get` (5178); `SQLite.prepare` (5178); `Store.sql` (5178) | CORE |
| [packages/store/src/store.ts:4686](../../packages/store/src/store.ts#L4686) `Store/identityAllowed` | `SQLite.get` (4686, 4692, 4698); `SQLite.prepare` (4686, 4692, 4698); `Store.sql` (4686, 4692, 4698) | CORE |
| [packages/store/src/store.ts:6471](../../packages/store/src/store.ts#L6471) `Store/image` | `SQLite.get` (6471); `SQLite.prepare` (6471); `Store.sql` (6471) | CORE |
| [packages/store/src/store.ts:6481](../../packages/store/src/store.ts#L6481) `Store/images` | `SQLite.all` (6481); `SQLite.prepare` (6481); `Store.sql` (6481) | CORE |
| [packages/store/src/store.ts:4433](../../packages/store/src/store.ts#L4433) `Store/importAccounts` | `SQLite.all` (4433); `SQLite.prepare` (4433); `Store.sql` (4433) | CORE |
| [packages/store/src/store.ts:1575](../../packages/store/src/store.ts#L1575) `Store/independentWindowWrite` | `SQLite.get` (1575); `SQLite.prepare` (1575, 1605); `Store.sql` (1575, 1584, 1600, 1605, 1608) | CORE |
| [packages/store/src/store.ts:8268](../../packages/store/src/store.ts#L8268) `Store/indexedFields` | `SQLite.all` (8268, 8269); `SQLite.prepare` (8268, 8269); `Store.sql` (8268, 8269) | CORE |
| [packages/store/src/store.ts:10487](../../packages/store/src/store.ts#L10487) `Store/internalRoots` | `SQLite.get` (10487); `SQLite.prepare` (10487, 10489); `SQLite.all` (10489) | CORE |
| [packages/store/src/store.ts:3176](../../packages/store/src/store.ts#L3176) `Store/isAgent` | `SQLite.get` (3176); `SQLite.prepare` (3176); `Store.sql` (3176) | CORE |
| [packages/store/src/store.ts:3279](../../packages/store/src/store.ts#L3279) `Store/isExternal` | `SQLite.get` (3279); `SQLite.prepare` (3279); `Store.sql` (3279) | CORE |
| [packages/store/src/store.ts:5231](../../packages/store/src/store.ts#L5231) `Store/issueWebauthnChallenge` | `SQLite.prepare` (5231, 5233, 5234, 5236); `Store.sql` (5231, 5233, 5234, 5236); `SQLite.get` (5233) | CORE |
| [packages/store/src/store.ts:10394](../../packages/store/src/store.ts#L10394) `Store/iterateCommitted` | `SQLite.iterate` (10394) | CORE |
| [packages/store/src/store.ts:1552](../../packages/store/src/store.ts#L1552) `Store/joinTransaction` | `Store.sql` (1552, 1553, 1555, 1557, 1563) | CORE |
| [packages/store/src/store.ts:9877](../../packages/store/src/store.ts#L9877) `Store/keyStepWork` | `Store.sql` (9877, 9883, 9887, 9889) | CORE |
| [packages/store/src/store.ts:6338](../../packages/store/src/store.ts#L6338) `Store/knownSharedAccount` | `SQLite.get` (6338); `SQLite.prepare` (6338); `Store.sql` (6338) | CORE |
| [packages/store/src/store.ts:3906](../../packages/store/src/store.ts#L3906) `Store/lastSignIns` | `Store.auditLog` (3906) | CORE |
| [packages/store/src/store.ts:6511](../../packages/store/src/store.ts#L6511) `Store/layout` | `SQLite.get` (6511); `SQLite.prepare` (6511); `Store.sql` (6511) | CORE |
| [packages/store/src/store.ts:2857](../../packages/store/src/store.ts#L2857) `Store/layoutHistory` | `SQLite.all` (2857); `SQLite.prepare` (2857); `Store.sql` (2857) | CORE |
| [packages/store/src/store.ts:6401](../../packages/store/src/store.ts#L6401) `Store/layouts` | `SQLite.all` (6401); `SQLite.prepare` (6401); `Store.sql` (6401) | CORE |
| [packages/store/src/store.ts:4206](../../packages/store/src/store.ts#L4206) `Store/leastPrivilege` | `SQLite.all` (4206); `SQLite.prepare` (4206); `Store.sql` (4206) | CORE |
| [packages/store/src/store.ts:4770](../../packages/store/src/store.ts#L4770) `Store/ledgerRow` | `SQLite.get` (4770, 4771); `SQLite.prepare` (4770, 4771); `Store.sql` (4770, 4771) | AUTH |
| [packages/store/src/store.ts:4782](../../packages/store/src/store.ts#L4782) `Store/ledgerWrite` | `Store.sql` (4782, 4783, 4785, 4787, 4790, 4790) | AUTH |
| [packages/store/src/store.ts:4516](../../packages/store/src/store.ts#L4516) `Store/limitAccountImport` | `SQLite.prepare` (4516, 4517, 4520); `Store.sql` (4516, 4517, 4520); `SQLite.get` (4517) | CORE |
| [packages/store/src/store.ts:3129](../../packages/store/src/store.ts#L3129) `Store/linkIdentity` | `SQLite.get` (3129); `SQLite.prepare` (3129); `Store.sql` (3129) | CORE |
| [packages/store/src/store.ts:3121](../../packages/store/src/store.ts#L3121) `Store/linkPrincipal` | `SQLite.get` (3121); `SQLite.prepare` (3121); `Store.sql` (3121) | CORE |
| [packages/store/src/store.ts:2758](../../packages/store/src/store.ts#L2758) `Store/logSecurity` | `Store.sql` (2758) | CORE |
| [packages/store/src/store.ts:3792](../../packages/store/src/store.ts#L3792) `Store/markPiiField` | `SQLite.prepare` (3792); `Store.sql` (3792) | CORE |
| [packages/store/src/store.ts:7428](../../packages/store/src/store.ts#L7428) `Store/markRepeating` | `SQLite.prepare` (7428); `Store.sql` (7428) | CORE |
| [packages/store/src/store.ts:10327](../../packages/store/src/store.ts#L10327) `Store/matchIds` | `Store.matchIds` (10327); `SQLite.all` (10333); `SQLite.prepare` (10333); `Store.sql` (10333) | CORE |
| [packages/store/src/store.ts:1334](../../packages/store/src/store.ts#L1334) `Store/meta` | `SQLite.get` (1334); `SQLite.prepare` (1334); `Store.sql` (1334) | CORE |
| [packages/store/src/store.ts:924](../../packages/store/src/store.ts#L924) `Store/metadataVersions` | `SQLite.get` (924); `SQLite.prepare` (924); `Store.sql` (924) | CORE |
| [packages/store/src/store.ts:8065](../../packages/store/src/store.ts#L8065) `Store/moveContainersIn` | `Store.sql` (8065, 8071, 8073, 8074, 8075, 8076, 8096, 8101, 8101, 8112, 8115, 8118, 8125); `SQLite.prepare` (8073, 8074, 8075, 8076, 8112, 8118); `SQLite.get` (8078, 8112, 8118) | CORE |
| [packages/store/src/store.ts:7987](../../packages/store/src/store.ts#L7987) `Store/moveContainersOut` | `Store.sql` (7987, 7995, 7997, 7999, 8004, 8005, 8025, 8031, 8033, 8035, 8035, 8041, 8041, 8046, 8048, 8050, 8050, 8056); `SQLite.get` (7995); `SQLite.prepare` (7995, 8004, 8005); `Store.container` (8007) | CORE |
| [packages/store/src/store.ts:4387](../../packages/store/src/store.ts#L4387) `Store/mustChangePassword` | `SQLite.get` (4387); `SQLite.prepare` (4387); `Store.sql` (4387) | CORE |
| [packages/store/src/store.ts:1270](../../packages/store/src/store.ts#L1270) `Store/nativeIdGuards` | `Store.sql` (1270, 1271, 1273) | CORE |
| [packages/store/src/store.ts:5058](../../packages/store/src/store.ts#L5058) `Store/objectUseSince` | `SQLite.get` (5058); `SQLite.prepare` (5058); `Store.sql` (5058) | CORE |
| [packages/store/src/store.ts:8228](../../packages/store/src/store.ts#L8228) `Store/orderBy` | `Store.valueListItems` (8228) | CORE |
| [packages/store/src/store.ts:7620](../../packages/store/src/store.ts#L7620) `Store/orphanContainerReport` | `SQLite.all` (7620); `SQLite.prepare` (7620); `Store.sql` (7620) | CORE |
| [packages/store/src/store.ts:5283](../../packages/store/src/store.ts#L5283) `Store/passkeyAllowList` | `SQLite.all` (5283); `SQLite.prepare` (5283); `Store.sql` (5283) | CORE |
| [packages/store/src/store.ts:5319](../../packages/store/src/store.ts#L5319) `Store/passkeyIds` | `SQLite.all` (5319); `SQLite.prepare` (5319); `Store.sql` (5319) | CORE |
| [packages/store/src/store.ts:5307](../../packages/store/src/store.ts#L5307) `Store/passkeys` | `SQLite.all` (5307); `SQLite.prepare` (5307); `Store.sql` (5307) | CORE |
| [packages/store/src/store.ts:4426](../../packages/store/src/store.ts#L4426) `Store/passwordDaysRemaining` | `SQLite.get` (4426); `SQLite.prepare` (4426); `Store.sql` (4426) | CORE |
| [packages/store/src/store.ts:3364](../../packages/store/src/store.ts#L3364) `Store/pendingChanges` | `SQLite.all` (3364); `SQLite.prepare` (3364); `Store.sql` (3364) | CORE |
| [packages/store/src/store.ts:1352](../../packages/store/src/store.ts#L1352) `Store/persistentData` | `SQLite.get` (1352) | CORE |
| [packages/store/src/store.ts:1361](../../packages/store/src/store.ts#L1361) `Store/persistentDataIds` | `SQLite.all` (1361) | CORE |
| [packages/store/src/store.ts:1342](../../packages/store/src/store.ts#L1342) `Store/persistentTable` | `Store.sql` (1342) | CORE |
| [packages/store/src/store.ts:9568](../../packages/store/src/store.ts#L9568) `Store/portalContainerTarget` | `Store.row` (9568); `relatedIdList` (9570) | CORE |
| [packages/store/src/store.ts:7052](../../packages/store/src/store.ts#L7052) `Store/portalCountsCurrent` | `Store.canView` (7052); `Store.row` (7079) | GATED-STORE |
| [packages/store/src/store.ts:7290](../../packages/store/src/store.ts#L7290) `Store/portalRows` | `relatedRows` (7290); `relatedIdList` (7291); `Store.viewableIds` (7294); `rowsById` (7319, 7357); `Calculations.related` (7333) | CORE |
| [packages/store/src/store.ts:7301](../../packages/store/src/store.ts#L7301) `Store/portalRows/context` | `Calculations.context` (7301) | CORE |
| [packages/store/src/store.ts:7311](../../packages/store/src/store.ts#L7311) `Store/portalRows/valueOf` | `Calculations.value` (7311) | CORE |
| [packages/store/src/store.ts:2291](../../packages/store/src/store.ts#L2291) `Store/prepared` | `SQLite.prepare` (2291); `Store.sql` (2291) | CORE |
| [packages/store/src/store.ts:4498](../../packages/store/src/store.ts#L4498) `Store/previewAccountImport` | `Store.sql` (4498, 4499, 4508) | CORE |
| [packages/store/src/store.ts:6102](../../packages/store/src/store.ts#L6102) `Store/previewRecordRuleCurrent` | `SQLite.get` (6102); `SQLite.prepare` (6102, 6105); `Store.sql` (6102, 6105); `SQLite.all` (6105); `Calculations.context` (6111, 6127) | CORE |
| [packages/store/src/store.ts:8744](../../packages/store/src/store.ts#L8744) `Store/previewRow` | `Store.row` (8744) | CORE |
| [packages/store/src/store.ts:5534](../../packages/store/src/store.ts#L5534) `Store/privilegeSets` | `Store.sql` (5534) | CORE |
| [packages/store/src/store.ts:2502](../../packages/store/src/store.ts#L2502) `Store/pruneAudit` | `Store.sql` (2502, 2504, 2506); `SQLite.get` (2504); `SQLite.prepare` (2504) | CORE |
| [packages/store/src/store.ts:7655](../../packages/store/src/store.ts#L7655) `Store/purgeOrphanContainers` | `Store.sql` (7655, 7659, 7668, 7671, 7672, 7677, 7678, 7680, 7680); `Store.orphanContainerReport` (7663); `SQLite.get` (7668); `SQLite.prepare` (7668, 7671, 7672) | CORE |
| [packages/store/src/store.ts:10593](../../packages/store/src/store.ts#L10593) `Store/query` | `SQLite.iterate` (10593) | CORE |
| [packages/store/src/store.ts:10632](../../packages/store/src/store.ts#L10632) `Store/queryWithOriginsCurrent` | `SQLite.iterate` (10632); `SQLite.all` (10641, 10644); `SQLite.prepare` (10641, 10644) | CORE |
| [packages/store/src/store.ts:10428](../../packages/store/src/store.ts#L10428) `Store/readOnlyChecked` | `SQLite.prepare` (10428, 10432, 10441, 10446); `SQLite.all` (10432, 10441, 10446) | CORE |
| [packages/store/src/store.ts:3101](../../packages/store/src/store.ts#L3101) `Store/recompute` | `SQLite.prepare` (3101, 3105); `Store.sql` (3101, 3105); `SQLite.iterate` (3105); `Calculations.computeStoredStyled` (3106); `Calculations.value` (3106) | CORE |
| [packages/store/src/store.ts:2306](../../packages/store/src/store.ts#L2306) `Store/recordAsOf` | `SQLite.get` (2306, 2308); `SQLite.prepare` (2306, 2308, 2310, 2311); `Store.sql` (2306, 2308, 2310, 2311); `SQLite.all` (2310, 2311) | CORE |
| [packages/store/src/store.ts:2009](../../packages/store/src/store.ts#L2009) `Store/recordCount` | `SQLite.get` (2009); `SQLite.prepare` (2009); `Store.sql` (2009) | CORE |
| [packages/store/src/store.ts:4989](../../packages/store/src/store.ts#L4989) `Store/recordObjectUse` | `Store.sql` (4989) | CORE |
| [packages/store/src/store.ts:9270](../../packages/store/src/store.ts#L9270) `Store/recordViewable` | `Store.row` (9270) | GATED-STORE |
| [packages/store/src/store.ts:1399](../../packages/store/src/store.ts#L1399) `Store/recordedFormat` | `Store.sql` (1399) | CORE |
| [packages/store/src/store.ts:7959](../../packages/store/src/store.ts#L7959) `Store/recoverContainersOut` | `SQLite.prepare` (7959); `Store.sql` (7959); `SQLite.get` (7962) | CORE |
| [packages/store/src/store.ts:1481](../../packages/store/src/store.ts#L1481) `Store/recoverPendingExternalFiles` | `Store.sql` (1481, 1483, 1507, 1509); `SQLite.prepare` (1483); `SQLite.get` (1494) | CORE |
| [packages/store/src/store.ts:5477](../../packages/store/src/store.ts#L5477) `Store/recoveryCodesRemaining` | `SQLite.get` (5477); `SQLite.prepare` (5477); `Store.sql` (5477) | CORE |
| [packages/store/src/store.ts:10468](../../packages/store/src/store.ts#L10468) `Store/refreshDecimalSqlViews` | `SQLite.get` (10468); `SQLite.prepare` (10468, 10473); `SQLite.all` (10473) | CORE |
| [packages/store/src/store.ts:3270](../../packages/store/src/store.ts#L3270) `Store/refuseLookalikeAccount` | `SQLite.all` (3270); `SQLite.prepare` (3270); `Store.sql` (3270) | CORE |
| [packages/store/src/store.ts:5343](../../packages/store/src/store.ts#L5343) `Store/registerPasskey` | `SQLite.prepare` (5343); `Store.sql` (5343) | CORE |
| [packages/store/src/store.ts:3399](../../packages/store/src/store.ts#L3399) `Store/rejectPending` | `SQLite.get` (3399); `SQLite.prepare` (3399, 3401); `Store.sql` (3399, 3401) | CORE |
| [packages/store/src/store.ts:8496](../../packages/store/src/store.ts#L8496) `Store/relatedCriteria` | `SQLite.iterate` (8496); `SQLite.prepare` (8496); `Store.sql` (8496) | CORE |
| [packages/store/src/store.ts:8493](../../packages/store/src/store.ts#L8493) `Store/relatedCriteria/matched` | `relatedRows` (8493) | CORE |
| [packages/store/src/store.ts:6839](../../packages/store/src/store.ts#L6839) `Store/relatedValues` | `Calculations.globalValue` (6839); `Calculations.unstoredValue` (6841) | CORE |
| [packages/store/src/store.ts:5356](../../packages/store/src/store.ts#L5356) `Store/removePasskey` | `SQLite.get` (5356); `SQLite.prepare` (5356, 5357); `Store.sql` (5356, 5357) | CORE |
| [packages/store/src/store.ts:9715](../../packages/store/src/store.ts#L9715) `Store/restoreDeletedRowLocked` | `SQLite.get` (9715, 9720); `SQLite.prepare` (9715, 9716, 9720, 9730); `Store.sql` (9715, 9716, 9720, 9730); `SQLite.all` (9716) | CORE |
| [packages/store/src/store.ts:2341](../../packages/store/src/store.ts#L2341) `Store/restoreRecord` | `Store.recordAsOf` (2341); `SQLite.get` (2345); `SQLite.prepare` (2345, 2350, 2359, 2370); `Store.sql` (2345, 2350, 2359, 2370) | CORE |
| [packages/store/src/store.ts:2385](../../packages/store/src/store.ts#L2385) `Store/revertAuditEntry` | `Store.auditLog` (2385) | CORE |
| [packages/store/src/store.ts:5114](../../packages/store/src/store.ts#L5114) `Store/revokeApiToken` | `SQLite.prepare` (5114); `Store.sql` (5114) | CORE |
| [packages/store/src/store.ts:8762](../../packages/store/src/store.ts#L8762) `Store/row` | `SQLite.get` (8762) | CORE |
| [packages/store/src/store.ts:10532](../../packages/store/src/store.ts#L10532) `Store/rowsOf` | `SQLite.iterate` (10532, 10540) | CORE |
| [packages/store/src/store.ts:5928](../../packages/store/src/store.ts#L5928) `Store/ruleOutcome` | `Calculations.context` (5928) | CORE |
| [packages/store/src/store.ts:8607](../../packages/store/src/store.ts#L8607) `Store/runningSummaryValues` | `Store.viewableIds` (8607); `rowsById` (8609); `Calculations.value` (8620, 8626); `Calculations.related` (8637) | GATED-STORE |
| [packages/store/src/store.ts:5563](../../packages/store/src/store.ts#L5563) `Store/savePrivilegeSet` | `SQLite.prepare` (5563, 5571); `Store.sql` (5563, 5571) | AUTH |
| [packages/store/src/store.ts:3623](../../packages/store/src/store.ts#L3623) `Store/saveScriptTest` | `SQLite.prepare` (3623); `Store.sql` (3623) | CORE |
| [packages/store/src/store.ts:6067](../../packages/store/src/store.ts#L6067) `Store/scopedTableSql` | `Store.viewableIds` (6067); `SQLite.all` (6070); `SQLite.prepare` (6070); `Store.sql` (6070) | GATED-STORE |
| [packages/store/src/store.ts:2847](../../packages/store/src/store.ts#L2847) `Store/scriptHistory` | `SQLite.all` (2847); `SQLite.prepare` (2847); `Store.sql` (2847) | CORE |
| [packages/store/src/store.ts:2677](../../packages/store/src/store.ts#L2677) `Store/securityChange` | `Store.sql` (2677, 2679); `SQLite.prepare` (2679) | CORE |
| [packages/store/src/store.ts:2265](../../packages/store/src/store.ts#L2265) `Store/securityEvents` | `Store.auditLog` (2265) | CORE |
| [packages/store/src/store.ts:4838](../../packages/store/src/store.ts#L4838) `Store/securityToken` | `SQLite.get` (4838); `SQLite.prepare` (4838); `Store.sql` (4838) | CORE |
| [packages/store/src/store.ts:10559](../../packages/store/src/store.ts#L10559) `Store/selectHeldCurrent` | `Store.sql` (10559, 10560, 10562); `SQLite.prepare` (10560) | CORE |
| [packages/store/src/store.ts:10020](../../packages/store/src/store.ts#L10020) `Store/selectIdsCurrent` | `Store.selectIds` (10020); `SQLite.all` (10026); `SQLite.prepare` (10026); `Store.sql` (10026) | GATED-STORE |
| [packages/store/src/store.ts:10551](../../packages/store/src/store.ts#L10551) `Store/selectIn` | `Store.select` (10551) | CORE |
| [packages/store/src/store.ts:1756](../../packages/store/src/store.ts#L1756) `Store/selfContainedCopy` | `Store.sql` (1756); `SQLite.all` (1761); `SQLite.prepare` (1761, 1763, 1764, 1765) | CORE |
| [packages/store/src/store.ts:4667](../../packages/store/src/store.ts#L4667) `Store/setAccountActive` | `SQLite.prepare` (4667, 4670, 4671); `Store.sql` (4667, 4670, 4671) | AUTH |
| [packages/store/src/store.ts:4857](../../packages/store/src/store.ts#L4857) `Store/setAccountLocalOnly` | `SQLite.prepare` (4857); `Store.sql` (4857) | CORE |
| [packages/store/src/store.ts:5719](../../packages/store/src/store.ts#L5719) `Store/setAccountPrivilegeSet` | `SQLite.get` (5719); `SQLite.prepare` (5719, 5722, 5726); `Store.sql` (5719, 5722, 5726) | AUTH |
| [packages/store/src/store.ts:4866](../../packages/store/src/store.ts#L4866) `Store/setAccountRequire2fa` | `SQLite.prepare` (4866); `Store.sql` (4866) | CORE |
| [packages/store/src/store.ts:3300](../../packages/store/src/store.ts#L3300) `Store/setAgentAccount` | `SQLite.get` (3300); `SQLite.prepare` (3300, 3306); `Store.sql` (3300, 3306) | CORE |
| [packages/store/src/store.ts:3667](../../packages/store/src/store.ts#L3667) `Store/setAiAllowed` | `SQLite.prepare` (3667); `Store.sql` (3667) | CORE |
| [packages/store/src/store.ts:3750](../../packages/store/src/store.ts#L3750) `Store/setAiPolicy` | `SQLite.prepare` (3750); `Store.sql` (3750) | CORE |
| [packages/store/src/store.ts:6325](../../packages/store/src/store.ts#L6325) `Store/setAllowBlankPasswordFromLan` | `SQLite.prepare` (6325); `Store.sql` (6325) | CORE |
| [packages/store/src/store.ts:2480](../../packages/store/src/store.ts#L2480) `Store/setAuditSettings` | `SQLite.prepare` (2480); `Store.sql` (2480) | CORE |
| [packages/store/src/store.ts:8178](../../packages/store/src/store.ts#L8178) `Store/setContainer` | `Store.sql` (8178, 8195); `Store.row` (8184); `SQLite.prepare` (8195) | CORE |
| [packages/store/src/store.ts:3252](../../packages/store/src/store.ts#L3252) `Store/setExternalAccount` | `SQLite.get` (3252); `SQLite.prepare` (3252, 3257); `Store.sql` (3252, 3257) | CORE |
| [packages/store/src/store.ts:4373](../../packages/store/src/store.ts#L4373) `Store/setMustChangePassword` | `SQLite.prepare` (4373); `Store.sql` (4373) | CORE |
| [packages/store/src/store.ts:3452](../../packages/store/src/store.ts#L3452) `Store/setPassword` | `SQLite.get` (3452); `SQLite.prepare` (3452, 3458, 3467, 3474, 3475, 3476); `Store.sql` (3452, 3458, 3467, 3474, 3475, 3476) | AUTH |
| [packages/store/src/store.ts:3564](../../packages/store/src/store.ts#L3564) `Store/setPasswordPolicy` | `SQLite.prepare` (3564); `Store.sql` (3564) | CORE |
| [packages/store/src/store.ts:1367](../../packages/store/src/store.ts#L1367) `Store/setPersistentData` | `SQLite.prepare` (1367, 1371); `Store.sql` (1367, 1371) | CORE |
| [packages/store/src/store.ts:3770](../../packages/store/src/store.ts#L3770) `Store/setPiiIsolation` | `SQLite.prepare` (3770); `Store.sql` (3770) | CORE |
| [packages/store/src/store.ts:3600](../../packages/store/src/store.ts#L3600) `Store/setRequireTotpForFullAccess` | `SQLite.prepare` (3600); `Store.sql` (3600) | CORE |
| [packages/store/src/store.ts:3682](../../packages/store/src/store.ts#L3682) `Store/setScriptNetwork` | `SQLite.prepare` (3682); `Store.sql` (3682) | CORE |
| [packages/store/src/store.ts:3739](../../packages/store/src/store.ts#L3739) `Store/setSqlRequiresFmxdbc` | `SQLite.prepare` (3739); `Store.sql` (3739) | CORE |
| [packages/store/src/store.ts:9191](../../packages/store/src/store.ts#L9191) `Store/setStoredCalcValues` | `SQLite.prepare` (9191, 9192); `Store.sql` (9191, 9192); `SQLite.get` (9196) | CORE |
| [packages/store/src/store.ts:8260](../../packages/store/src/store.ts#L8260) `Store/setUserPref` | `Store.sql` (8260, 8261, 8262); `SQLite.prepare` (8261, 8262) | CORE |
| [packages/store/src/store.ts:3723](../../packages/store/src/store.ts#L3723) `Store/setWebViewerHosts` | `SQLite.prepare` (3723); `Store.sql` (3723) | CORE |
| [packages/store/src/store.ts:4809](../../packages/store/src/store.ts#L4809) `Store/settleSignIns` | `SQLite.all` (4809, 4815); `SQLite.prepare` (4809, 4815, 4821, 4825, 4827); `Store.sql` (4809, 4815, 4821, 4825, 4827) | AUTH |
| [packages/store/src/store.ts:1887](../../packages/store/src/store.ts#L1887) `Store/shareResults` | `Store.sql` (1887) | CORE |
| [packages/store/src/store.ts:1425](../../packages/store/src/store.ts#L1425) `Store/shipWal` | `Store.sql` (1425) | CORE |
| [packages/store/src/store.ts:4756](../../packages/store/src/store.ts#L4756) `Store/signInBase` | `SQLite.get` (4756); `SQLite.prepare` (4756); `Store.sql` (4756) | AUTH |
| [packages/store/src/store.ts:4758](../../packages/store/src/store.ts#L4758) `Store/signInBase/identity` | `SQLite.get` (4758); `SQLite.prepare` (4758); `Store.sql` (4758) | AUTH |
| [packages/store/src/store.ts:4746](../../packages/store/src/store.ts#L4746) `Store/signInMark` | `SQLite.prepare` (4746); `Store.sql` (4746) | AUTH |
| [packages/store/src/store.ts:10245](../../packages/store/src/store.ts#L10245) `Store/sortIdsCurrentProgress` | `SQLite.all` (10245); `SQLite.prepare` (10245, 10313); `Store.sql` (10245, 10313); `Store.valueListItems` (10253); `rowsById` (10265); `Calculations.globalValue` (10268); `Calculations.unstoredValue` (10269); `Calculations.related` (10275); `SQLite.iterate` (10313) | GATED-STORE |
| [packages/store/src/store.ts:8421](../../packages/store/src/store.ts#L8421) `Store/sortedPage` | `SQLite.iterate` (8421); `SQLite.prepare` (8421, 8436); `Store.sql` (8421, 8436); `SQLite.all` (8436) | CORE |
| [packages/store/src/store.ts:8569](../../packages/store/src/store.ts#L8569) `Store/summaries` | `Calculations.wholeTable` (8569); `Calculations.collect` (8589, 8594) | CORE |
| [packages/store/src/store.ts:8585](../../packages/store/src/store.ts#L8585) `Store/summaries/recs` | `SQLite.iterate` (8585); `SQLite.prepare` (8585); `Store.sql` (8585) | CORE |
| [packages/store/src/store.ts:5297](../../packages/store/src/store.ts#L5297) `Store/takeWebauthnChallenge` | `SQLite.get` (5297); `SQLite.prepare` (5297, 5299); `Store.sql` (5297, 5299) | CORE |
| [packages/store/src/store.ts:8313](../../packages/store/src/store.ts#L8313) `Store/timeFind` | `Store.query` (8313, 8317, 8318); `Store.recordCount` (8320) | CORE |
| [packages/store/src/store.ts:6780](../../packages/store/src/store.ts#L6780) `Store/toRecord` | `Calculations.value` (6780, 6790); `Calculations.globalValue` (6784); `Calculations.unstoredStyled` (6789) | CORE |
| [packages/store/src/store.ts:5183](../../packages/store/src/store.ts#L5183) `Store/totpAccounts` | `SQLite.all` (5183); `SQLite.prepare` (5183); `Store.sql` (5183) | CORE |
| [packages/store/src/store.ts:1436](../../packages/store/src/store.ts#L1436) `Store/trial` | `Store.sql` (1436) | CORE |
| [packages/store/src/store.ts:1441](../../packages/store/src/store.ts#L1441) `Store/trial/undo` | `Store.sql` (1441) | CORE |
| [packages/store/src/store.ts:10355](../../packages/store/src/store.ts#L10355) `Store/truncate/run` | `Store.sql` (10355, 10357, 10364, 10366, 10368, 10369); `SQLite.prepare` (10357, 10364); `SQLite.all` (10359) | CORE |
| [packages/store/src/store.ts:3199](../../packages/store/src/store.ts#L3199) `Store/unmigratedAccounts` | `SQLite.all` (3199); `SQLite.prepare` (3199); `Store.sql` (3199) | CORE |
| [packages/store/src/store.ts:4279](../../packages/store/src/store.ts#L4279) `Store/unusedAccess` | `SQLite.get` (4279); `SQLite.prepare` (4279, 4288); `Store.sql` (4279, 4288); `SQLite.all` (4288) | CORE |
| [packages/store/src/store.ts:4327](../../packages/store/src/store.ts#L4327) `Store/unusedObjects` | `SQLite.get` (4327); `SQLite.prepare` (4327, 4330); `Store.sql` (4327, 4330); `SQLite.all` (4330) | CORE |
| [packages/store/src/store.ts:5418](../../packages/store/src/store.ts#L5418) `Store/unusedRecoveryHashes` | `SQLite.all` (5418); `SQLite.prepare` (5418); `Store.sql` (5418) | CORE |
| [packages/store/src/store.ts:4109](../../packages/store/src/store.ts#L4109) `Store/unusualAccess` | `Store.auditLog` (4109, 4175) | CORE |
| [packages/store/src/store.ts:9013](../../packages/store/src/store.ts#L9013) `Store/update` | `Store.row` (9013); `Store.sql` (9043, 9044, 9083, 9086) | CORE |
| [packages/store/src/store.ts:9046](../../packages/store/src/store.ts#L9046) `Store/update/undo` | `Store.sql` (9046) | CORE |
| [packages/store/src/store.ts:9476](../../packages/store/src/store.ts#L9476) `Store/updatePortals` | `Store.row` (9476, 9512); `relatedRows` (9513) | CORE |
| [packages/store/src/store.ts:9486](../../packages/store/src/store.ts#L9486) `Store/updatePortals/portal/related` | `relatedIdList` (9486) | CORE |
| [packages/store/src/store.ts:9458](../../packages/store/src/store.ts#L9458) `Store/updateRelated` | `relatedRows` (9458) | CORE |
| [packages/store/src/store.ts:4365](../../packages/store/src/store.ts#L4365) `Store/usageCounting` | `SQLite.get` (4365); `SQLite.prepare` (4365); `Store.sql` (4365) | CORE |
| [packages/store/src/store.ts:8251](../../packages/store/src/store.ts#L8251) `Store/userPrefs` | `SQLite.all` (8251); `SQLite.prepare` (8251); `Store.sql` (8251) | CORE |
| [packages/store/src/store.ts:7161](../../packages/store/src/store.ts#L7161) `Store/valueListItemsCurrent` | `Store.valueListItems` (7161); `Store.get` (7175); `relatedRows` (7176); `Store.row` (7176); `SQLite.iterate` (7178); `SQLite.prepare` (7178); `Store.sql` (7178); `Calculations.related` (7188); `Calculations.value` (7192, 7193) | GATED-STORE |
| [packages/store/src/store.ts:9668](../../packages/store/src/store.ts#L9668) `Store/vaultHeld` | `SQLite.get` (9668); `SQLite.prepare` (9668); `Store.sql` (9668) | CORE |
| [packages/store/src/store.ts:5212](../../packages/store/src/store.ts#L5212) `Store/verifyTotp` | `SQLite.get` (5212); `SQLite.prepare` (5212, 5218); `Store.sql` (5212, 5218) | CORE |
| [packages/store/src/store.ts:1942](../../packages/store/src/store.ts#L1942) `Store/versionNumber` | `SQLite.get` (1942); `SQLite.prepare` (1942); `Store.sql` (1942) | CORE |
| [packages/store/src/store.ts:1898](../../packages/store/src/store.ts#L1898) `Store/versionTriggers` | `SQLite.get` (1898); `SQLite.prepare` (1898, 1903, 1904); `Store.sql` (1898, 1903, 1904, 1921, 1923, 1924, 1926); `SQLite.all` (1903, 1904) | CORE |
| [packages/store/src/store.ts:1866](../../packages/store/src/store.ts#L1866) `Store/warmSummariesCurrent` | `Calculations.wholeTable` (1866) | CORE |
| [packages/store/src/store.ts:3705](../../packages/store/src/store.ts#L3705) `Store/webViewerChecked` | `SQLite.get` (3705); `SQLite.prepare` (3705); `Store.sql` (3705) | CORE |
| [packages/store/src/store.ts:1637](../../packages/store/src/store.ts#L1637) `Store/withWriteTransaction` | `Store.sql` (1637, 1648, 1654, 1656, 1656) | CORE |
| [packages/store/src/store.ts:6715](../../packages/store/src/store.ts#L6715) `Store/wordIndex` | `Store.sql` (6715, 6723, 6728); `Store.recordCount` (6727); `SQLite.get` (6728); `SQLite.prepare` (6728) | CORE |
| [packages/store/src/store.ts:7852](../../packages/store/src/store.ts#L7852) `Store/writeExternalFile` | `Store.evaluateEach` (7852); `SQLite.prepare` (7875); `Store.sql` (7875) | CORE |
| [packages/store/src/store.ts:7876](../../packages/store/src/store.ts#L7876) `Store/writeExternalFile/taken` | `SQLite.get` (7876) | CORE |
| [packages/store/src/store.ts:5047](../../packages/store/src/store.ts#L5047) `Store/writeObjectUseRows` | `SQLite.prepare` (5047, 5048, 5053); `Store.sql` (5047, 5048, 5053) | CORE |
| [packages/store/src/store.ts:1997](../../packages/store/src/store.ts#L1997) `Store/writeToken` | `SQLite.get` (1997); `SQLite.prepare` (1997); `Store.sql` (1997) | CORE |
| [packages/store/src/store.ts:5019](../../packages/store/src/store.ts#L5019) `Store/writeUsage` | `Store.sql` (5019, 5020, 5022, 5026, 5028) | CORE |
| [packages/store/src/store.ts:5035](../../packages/store/src/store.ts#L5035) `Store/writeUsageRows` | `SQLite.prepare` (5035, 5036, 5042); `Store.sql` (5035, 5036, 5042) | CORE |
| [packages/store/src/store.ts:6436](../../packages/store/src/store.ts#L6436) `Store/design` | `SQLite.get` (6436) | CORE |
| [packages/store/src/store.ts:6458](../../packages/store/src/store.ts#L6458) `Store/themes` | `SQLite.get` (6458) | CORE |
| [packages/store/src/store.ts:5378](../../packages/store/src/store.ts#L5378) `Store/verifyPasskeyCredential` | `SQLite.get` (5378); `SQLite.prepare` (5378, 5390); `Store.sql` (5378, 5390) | CORE |
| [packages/store/src/store.ts:6296](../../packages/store/src/store.ts#L6296) `Store/passwordState` | `SQLite.get` (6296); `SQLite.prepare` (6296); `Store.sql` (6296) | CORE |
| [packages/store/src/store.ts:9611](../../packages/store/src/store.ts#L9611) `Store/deleteVisibility` | `Store.canViewRecord` (9611) | CORE |
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
