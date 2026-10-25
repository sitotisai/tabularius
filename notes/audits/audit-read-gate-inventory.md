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
| [packages/scripts/src/engine.ts:7972](../../packages/scripts/src/engine.ts#L7972) `ScriptEngine/containerFile` | `Store.get` (7972); `Store.containerId` (7973); `Store.container` (7974) | SCRIPT |
| [packages/scripts/src/engine.ts:5587](../../packages/scripts/src/engine.ts#L5587) `ScriptEngine/design` | `Store.valueListItems` (5587) | SCRIPT |
| [packages/scripts/src/engine.ts:6325](../../packages/scripts/src/engine.ts#L6325) `ScriptEngine/exportField` | `Store.get` (6325); `Store.containerId` (6326); `Store.container` (6328) | SCRIPT |
| [packages/scripts/src/engine.ts:8369](../../packages/scripts/src/engine.ts#L8369) `ScriptEngine/fileMakerRows` | `Store.findIds` (8369); `Store.get` (8374) | SCRIPT |
| [packages/scripts/src/engine.ts:8739](../../packages/scripts/src/engine.ts#L8739) `ScriptEngine/findRelated` | `Store.findIds` (8739, 8749, 8752) | SCRIPT |
| [packages/scripts/src/engine.ts:2300](../../packages/scripts/src/engine.ts#L2300) `ScriptEngine/foundSet` | `Store.findIds` (2300) | SCRIPT |
| [packages/scripts/src/engine.ts:5427](../../packages/scripts/src/engine.ts#L5427) `ScriptEngine/get` | `Store.findIds` (5427); `Store.canViewRecord` (5520); `Store.get` (5556) | SCRIPT |
| [packages/scripts/src/engine.ts:1956](../../packages/scripts/src/engine.ts#L1956) `ScriptEngine/goToLayout` | `Store.findIds` (1956) | SCRIPT |
| [packages/scripts/src/engine.ts:6896](../../packages/scripts/src/engine.ts#L6896) `ScriptEngine/goToList` | `Store.findIds` (6896) | SCRIPT |
| [packages/scripts/src/engine.ts:8138](../../packages/scripts/src/engine.ts#L8138) `ScriptEngine/importRecords` | `Store.findIds` (8138); `Store.get` (8158) | SCRIPT |
| [packages/scripts/src/engine.ts:5699](../../packages/scripts/src/engine.ts#L5699) `ScriptEngine/lookupNext` | `Store.get` (5699); `Store.row` (5700); `Calculations.context` (5702) | SCRIPT |
| [packages/scripts/src/engine.ts:5265](../../packages/scripts/src/engine.ts#L5265) `ScriptEngine/newCalcContext/executeSQL` | `Calculations.executeSQL` (5265) | SCRIPT |
| [packages/scripts/src/engine.ts:5273](../../packages/scripts/src/engine.ts#L5273) `ScriptEngine/newCalcContext/persistentData` | `Store.persistentData` (5273) | SCRIPT |
| [packages/scripts/src/engine.ts:5274](../../packages/scripts/src/engine.ts#L5274) `ScriptEngine/newCalcContext/persistentDataIds` | `Store.persistentDataIds` (5274) | SCRIPT |
| [packages/scripts/src/engine.ts:8409](../../packages/scripts/src/engine.ts#L8409) `ScriptEngine/newRecord` | `Store.findIds` (8409) | SCRIPT |
| [packages/scripts/src/engine.ts:8714](../../packages/scripts/src/engine.ts#L8714) `ScriptEngine/performFind` | `Store.findIds` (8714) | SCRIPT |
| [packages/scripts/src/engine.ts:8771](../../packages/scripts/src/engine.ts#L8771) `ScriptEngine/quickFind` | `Store.findIds` (8771, 8772, 8775) | SCRIPT |
| [packages/scripts/src/engine.ts:5641](../../packages/scripts/src/engine.ts#L5641) `ScriptEngine/record` | `Store.get` (5641) | SCRIPT |
| [packages/scripts/src/engine.ts:5802](../../packages/scripts/src/engine.ts#L5802) `ScriptEngine/relatedIds` | `Store.findIds` (5802); `rowsById` (5810); `Store.select` (5814); `Store.matchIds` (5828); `Store.viewableIds` (5851) | SCRIPT |
| [packages/scripts/src/engine.ts:5836](../../packages/scripts/src/engine.ts#L5836) `ScriptEngine/relatedIds/matching` | `Store.matchIds` (5836) | SCRIPT |
| [packages/scripts/src/engine.ts:6476](../../packages/scripts/src/engine.ts#L6476) `ScriptEngine/relookup` | `Store.get` (6476) | SCRIPT |
| [packages/scripts/src/engine.ts:3434](../../packages/scripts/src/engine.ts#L3434) `ScriptEngine/revertTransaction` | `Store.findIds` (3434) | SCRIPT |
| [packages/scripts/src/engine.ts:2365](../../packages/scripts/src/engine.ts#L2365) `ScriptEngine/semanticFind` | `Store.findIds` (2365, 2386) | SCRIPT |
| [packages/scripts/src/engine.ts:3337](../../packages/scripts/src/engine.ts#L3337) `ScriptEngine/sortIds` | `Store.sortIds` (3337); `Store.valueListItems` (3343) | SCRIPT |
| [packages/scripts/src/engine.ts:7228](../../packages/scripts/src/engine.ts#L7228) `ScriptEngine/sourceValue` | `Store.get` (7228); `Store.containerId` (7229); `Store.container` (7230) | SCRIPT |
| [packages/scripts/src/engine.ts:3280](../../packages/scripts/src/engine.ts#L3280) `ScriptEngine/sqlByNaturalLanguage` | `Calculations.translateSQL` (3280); `Calculations.executeSQL` (3287) | SCRIPT |
| [packages/scripts/src/engine.ts:3994](../../packages/scripts/src/engine.ts#L3994) `ScriptEngine/step` | `Store.fieldIndex` (3994); `Store.findIds` (4128, 4227) | SCRIPT |
| [packages/scripts/src/engine.ts:5674](../../packages/scripts/src/engine.ts#L5674) `ScriptEngine/valueOf` | `Store.findIds` (5674, 5674); `Store.containerId` (5682) | SCRIPT |
| [packages/scripts/src/engine.ts:9161](../../packages/scripts/src/engine.ts#L9161) `clearRecords` | `SQLite.all` (9161); `SQLite.prepare` (9161) | SCRIPT |
| [packages/scripts/src/recorder.ts:83](../../packages/scripts/src/recorder.ts#L83) `lastSeq` | `Store.auditLog` (83) | DESIGN |
| [packages/scripts/src/recorder.ts:121](../../packages/scripts/src/recorder.ts#L121) `recordRun` | `Store.auditLog` (121) | DESIGN |
| [packages/scripts/src/script-tests.ts:213](../../packages/scripts/src/script-tests.ts#L213) `runCase` | `Store.findIds` (213); `Store.auditLog` (220, 221, 265); `Store.evaluateEach` (248) | DESIGN |
| [packages/scripts/src/testrun.ts:306](../../packages/scripts/src/testrun.ts#L306) `recordWith` | `Store.evaluateEach` (306) | DESIGN |
| [packages/scripts/src/testrun.ts:199](../../packages/scripts/src/testrun.ts#L199) `seedSelections` | `Calculations.globalValue` (199); `Store.find` (204) | DESIGN |
| [packages/scripts/src/testrun.ts:338](../../packages/scripts/src/testrun.ts#L338) `testRun` | `Store.evaluateEach` (338) | DESIGN |
| [packages/scripts/src/testrun.ts:270](../../packages/scripts/src/testrun.ts#L270) `testScript` | `Store.findIds` (270) | DESIGN |
| [packages/server/src/admin.ts:2272](../../packages/server/src/admin.ts#L2272) `Admin/audit` | `Store.auditLog` (2272) | ADMIN |
| [packages/server/src/admin.ts:1040](../../packages/server/src/admin.ts#L1040) `Admin/handle` | `Store.externalContainerReport` (1040); `Store.orphanContainerReport` (1045, 1049) | ADMIN |
| [packages/server/src/admin.ts:2703](../../packages/server/src/admin.ts#L2703) `Admin/status` | `Store.externalContainerCount` (2703) | ADMIN |
| [packages/server/src/admin.ts:2355](../../packages/server/src/admin.ts#L2355) `Admin/viewAs` | `Store.find` (2355) | ADMIN |
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
| [packages/server/src/backup.ts:1006](../../packages/server/src/backup.ts#L1006) `accountDifferences/read` | `SQLite.all` (1006, 1008); `SQLite.prepare` (1006, 1008) | OPERATOR |
| [packages/server/src/backup.ts:276](../../packages/server/src/backup.ts#L276) `backupOnceHeld` | `SQLite.get` (276); `SQLite.prepare` (276) | OPERATOR |
| [packages/server/src/backup.ts:1079](../../packages/server/src/backup.ts#L1079) `columnInfo` | `SQLite.all` (1079); `SQLite.prepare` (1079) | OPERATOR |
| [packages/server/src/backup.ts:1063](../../packages/server/src/backup.ts#L1063) `credentialsReadable` | `SQLite.all` (1063); `SQLite.prepare` (1063) | OPERATOR |
| [packages/server/src/backup.ts:1033](../../packages/server/src/backup.ts#L1033) `readNames` | `SQLite.all` (1033); `SQLite.prepare` (1033) | OPERATOR |
| [packages/server/src/backup.ts:1114](../../packages/server/src/backup.ts#L1114) `reconcileCredentials` | `SQLite.all` (1114, 1136, 1151, 1161, 1167); `SQLite.prepare` (1114, 1122, 1136, 1138, 1151, 1152, 1159, 1161, 1162, 1167, 1168, 1172, 1173, 1174); `SQLite.get` (1122, 1172) | OPERATOR |
| [packages/server/src/backup.ts:1141](../../packages/server/src/backup.ts#L1141) `reconcileCredentials/accountColumns` | `SQLite.all` (1141); `SQLite.prepare` (1141) | OPERATOR |
| [packages/server/src/backup.ts:1117](../../packages/server/src/backup.ts#L1117) `reconcileCredentials/has` | `SQLite.all` (1117); `SQLite.prepare` (1117) | OPERATOR |
| [packages/server/src/backup.ts:1286](../../packages/server/src/backup.ts#L1286) `stageRestorePoint` | `SQLite.get` (1286, 1288, 1289); `SQLite.prepare` (1286, 1288, 1289) | OPERATOR |
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
| [packages/server/src/dataapi.ts:2008](../../packages/server/src/dataapi.ts#L2008) `DataApi/route` | `Store.get` (2008, 2229, 2230, 2253, 2261, 2308, 2332, 2352, 2389); `Store.valueListItems` (2023); `Store.find` (2184, 2232, 2422); `Store.findIds` (2188, 2427); `Store.query` (2427) | REST |
| [packages/server/src/dataapi.ts:2136](../../packages/server/src/dataapi.ts#L2136) `DataApi/route/recordOut` | `Store.portalCounts` (2136) | REST |
| [packages/server/src/dataapi.ts:2172](../../packages/server/src/dataapi.ts#L2172) `DataApi/route/shownAs` | `Store.get` (2172) | REST |
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
| [packages/server/src/mcp.ts:1374](../../packages/server/src/mcp.ts#L1374) `createMcpServer/check_record` | `Store.get` (1374); `Store.row` (1376) | MCP |
| [packages/server/src/mcp.ts:1095](../../packages/server/src/mcp.ts#L1095) `createMcpServer/evaluate_calculation` | `Store.get` (1095, 1103); `Store.find` (1096); `Store.evaluate` (1097); `Store.row` (1102) | SQL |
| [packages/server/src/mcp.ts:1398](../../packages/server/src/mcp.ts#L1398) `createMcpServer/explain_related` | `Store.get` (1398) | MCP |
| [packages/server/src/mcp.ts:1351](../../packages/server/src/mcp.ts#L1351) `createMcpServer/explain_value` | `Store.get` (1351); `Store.row` (1352) | MCP |
| [packages/server/src/mcp.ts:975](../../packages/server/src/mcp.ts#L975) `createMcpServer/find_records` | `Store.find` (975) | MCP |
| [packages/server/src/mcp.ts:1170](../../packages/server/src/mcp.ts#L1170) `createMcpServer/get_container` | `Store.container` (1170) | SQL |
| [packages/server/src/mcp.ts:988](../../packages/server/src/mcp.ts#L988) `createMcpServer/get_record` | `Store.get` (988) | MCP |
| [packages/server/src/mcp.ts:1194](../../packages/server/src/mcp.ts#L1194) `createMcpServer/sql_query` | `Store.queryWithOrigins` (1194) | SQL |
| [packages/server/src/mcp.ts:1038](../../packages/server/src/mcp.ts#L1038) `createMcpServer/update_record` | `Store.get` (1038, 1042) | MCP |
| [packages/server/src/mcp.ts:2295](../../packages/server/src/mcp.ts#L2295) `registerResources/audit` | `Store.auditLog` (2295) | MCP |
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
| [packages/server/src/odata.ts:1339](../../packages/server/src/odata.ts#L1339) `ODataEndpoint/applied` | `Store.selectIds` (1339); `SQLite.prepare` (1354, 1391, 1404, 1408); `Store.getMany` (1365); `SQLite.all` (1404); `SQLite.get` (1408) | ODATA |
| [packages/server/src/odata.ts:1458](../../packages/server/src/odata.ts#L1458) `ODataEndpoint/crossjoined` | `Store.selectIds` (1458); `Store.getMany` (1487, 1522) | ODATA |
| [packages/server/src/odata.ts:1558](../../packages/server/src/odata.ts#L1558) `ODataEndpoint/entity` | `Store.getMany` (1558) | ODATA |
| [packages/server/src/odata.ts:1218](../../packages/server/src/odata.ts#L1218) `ODataEndpoint/lambdaFor` | `Store.selectIds` (1218); `Store.row` (1227); `relatedIdList` (1228) | ODATA |
| [packages/server/src/odata.ts:1281](../../packages/server/src/odata.ts#L1281) `ODataEndpoint/list` | `Store.selectIds` (1281); `Store.getMany` (1286); `Store.computeValues` (1287); `Store.countIds` (1292) | ODATA |
| [packages/server/src/odata.ts:1649](../../packages/server/src/odata.ts#L1649) `ODataEndpoint/property` | `Store.containerId` (1649); `Store.container` (1655) | ODATA |
| [packages/server/src/odata.ts:1599](../../packages/server/src/odata.ts#L1599) `ODataEndpoint/relatedIds` | `Store.row` (1599); `relatedIdList` (1602, 1617); `Store.selectIds` (1606); `Store.viewableIds` (1616) | ODATA |
| [packages/server/src/odata.ts:1625](../../packages/server/src/odata.ts#L1625) `ODataEndpoint/relatedRecords` | `Store.getMany` (1625) | ODATA |
| [packages/server/src/odata.ts:932](../../packages/server/src/odata.ts#L932) `ODataEndpoint/resource` | `Store.countIds` (932); `Store.get` (972, 979, 1086) | ODATA |
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
| [packages/server/src/webclient.ts:1665](../../packages/server/src/webclient.ts#L1665) `WebClient/aiReplace` | `Store.canView` (1665); `Store.getMany` (1681) | WEB |
| [packages/server/src/webclient.ts:1849](../../packages/server/src/webclient.ts#L1849) `WebClient/button` | `Store.findIds` (1849, 1899); `Store.evaluateEach` (1858, 1859) | WEB |
| [packages/server/src/webclient.ts:1251](../../packages/server/src/webclient.ts#L1251) `WebClient/charts` | `Calculations.context` (1251); `Store.canView` (1279); `Store.evaluateEach` (1288, 1292); `Store.evaluateRows` (1297, 1299) | WEB |
| [packages/server/src/webclient.ts:1242](../../packages/server/src/webclient.ts#L1242) `WebClient/charts/foundSet` | `Store.findIds` (1242) | WEB |
| [packages/server/src/webclient.ts:1282](../../packages/server/src/webclient.ts#L1282) `WebClient/charts/get` | `Store.get` (1282) | WEB |
| [packages/server/src/webclient.ts:668](../../packages/server/src/webclient.ts#L668) `WebClient/explain` | `Store.get` (668); `Store.row` (701, 714) | WEB |
| [packages/server/src/webclient.ts:1471](../../packages/server/src/webclient.ts#L1471) `WebClient/exportRecords` | `Store.getMany` (1471) | WEB |
| [packages/server/src/webclient.ts:1158](../../packages/server/src/webclient.ts#L1158) `WebClient/foundIds` | `Store.findIds` (1158) | WEB |
| [packages/server/src/webclient.ts:1202](../../packages/server/src/webclient.ts#L1202) `WebClient/foundSetPortal` | `Store.foundSetRows` (1202, 1209) | WEB |
| [packages/server/src/webclient.ts:1741](../../packages/server/src/webclient.ts#L1741) `WebClient/groups` | `Store.findIds` (1741); `Store.groupSummaries` (1747) | WEB |
| [packages/server/src/webclient.ts:531](../../packages/server/src/webclient.ts#L531) `WebClient/history` | `Store.get` (531) | WEB |
| [packages/server/src/webclient.ts:727](../../packages/server/src/webclient.ts#L727) `WebClient/index` | `Store.fieldIndex` (727) | WEB |
| [packages/server/src/webclient.ts:817](../../packages/server/src/webclient.ts#L817) `WebClient/menus` | `Store.evaluateEach` (817) | WEB |
| [packages/server/src/webclient.ts:1173](../../packages/server/src/webclient.ts#L1173) `WebClient/records` | `Store.getMany` (1173); `Store.find` (1176) | WEB |
| [packages/server/src/webclient.ts:1119](../../packages/server/src/webclient.ts#L1119) `WebClient/refresh` | `Store.previewRow` (1119); `Store.getMany` (1124); `Store.foundSetRows` (1146) | WEB |
| [packages/server/src/webclient.ts:1365](../../packages/server/src/webclient.ts#L1365) `WebClient/streamExportRecords/nextBatch` | `Store.selectIds` (1365); `Store.getMany` (1371) | WEB |
| [packages/server/src/webclient.ts:1033](../../packages/server/src/webclient.ts#L1033) `WebClient/view` | `Store.evaluateEach` (1033, 1057, 1076); `Store.canView` (1051); `Store.previewRow` (1055, 1077); `Store.get` (1068); `Store.row` (1069, 1069) | WEB |
| [packages/server/src/webclient.ts:1054](../../packages/server/src/webclient.ts#L1054) `WebClient/view/get` | `Store.get` (1054) | WEB |
| [packages/server/src/webclient.ts:2628](../../packages/server/src/webclient.ts#L2628) `foundIds` | `Store.findIds` (2628, 2630) | WEB |
| [packages/server/src/webclient.ts:2549](../../packages/server/src/webclient.ts#L2549) `listItems` | `Store.valueListItems` (2549) | WEB |
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
| [packages/store/src/store.ts:4698](../../packages/store/src/store.ts#L4698) `Store/accountIdentityId` | `SQLite.get` (4698, 4703); `SQLite.prepare` (4698, 4702, 4703); `Store.sql` (4698, 4702, 4703) | CORE |
| [packages/store/src/store.ts:4661](../../packages/store/src/store.ts#L4661) `Store/accountInactive` | `SQLite.get` (4661); `SQLite.prepare` (4661); `Store.sql` (4661) | CORE |
| [packages/store/src/store.ts:4826](../../packages/store/src/store.ts#L4826) `Store/accountLocalOnly` | `SQLite.get` (4826); `SQLite.prepare` (4826); `Store.sql` (4826) | CORE |
| [packages/store/src/store.ts:5684](../../packages/store/src/store.ts#L5684) `Store/accountPrivilegeSet` | `SQLite.get` (5684); `SQLite.prepare` (5684); `Store.sql` (5684) | CORE |
| [packages/store/src/store.ts:4831](../../packages/store/src/store.ts#L4831) `Store/accountRequires2fa` | `SQLite.get` (4831); `SQLite.prepare` (4831); `Store.sql` (4831) | CORE |
| [packages/store/src/store.ts:5051](../../packages/store/src/store.ts#L5051) `Store/accountUsage` | `SQLite.get` (5051); `SQLite.prepare` (5051, 5052); `Store.sql` (5051, 5052); `SQLite.all` (5052); `Store.auditLog` (5068) | CORE |
| [packages/store/src/store.ts:3161](../../packages/store/src/store.ts#L3161) `Store/accounts` | `SQLite.all` (3161); `SQLite.prepare` (3161); `Store.sql` (3161) | CORE |
| [packages/store/src/store.ts:3157](../../packages/store/src/store.ts#L3157) `Store/accountsSharingLockout` | `SQLite.all` (3157); `SQLite.prepare` (3157); `Store.sql` (3157) | CORE |
| [packages/store/src/store.ts:7767](../../packages/store/src/store.ts#L7767) `Store/addContainer` | `SQLite.all` (7767); `SQLite.prepare` (7767, 7772, 7786, 7790, 7791); `Store.sql` (7767, 7772, 7786, 7788, 7790, 7791, 7793, 7796); `SQLite.get` (7777); `Store.containerRange` (7779) | CORE |
| [packages/store/src/store.ts:7813](../../packages/store/src/store.ts#L7813) `Store/addExternalContainer` | `SQLite.prepare` (7813); `Store.sql` (7813) | CORE |
| [packages/store/src/store.ts:8269](../../packages/store/src/store.ts#L8269) `Store/addFieldIndex` | `Store.sql` (8269) | CORE |
| [packages/store/src/store.ts:6473](../../packages/store/src/store.ts#L6473) `Store/addImage` | `Store.sql` (6473, 6474); `SQLite.prepare` (6474) | CORE |
| [packages/store/src/store.ts:5734](../../packages/store/src/store.ts#L5734) `Store/addProvisionedAccount` | `SQLite.get` (5734); `SQLite.prepare` (5734, 5738); `Store.sql` (5734, 5738) | CORE |
| [packages/store/src/store.ts:6892](../../packages/store/src/store.ts#L6892) `Store/addRelated` | `relatedRows` (6892); `rowsById` (6925); `firstRelatedEach` (6948) | CORE |
| [packages/store/src/store.ts:3179](../../packages/store/src/store.ts#L3179) `Store/agentNeedsApproval` | `SQLite.get` (3179); `SQLite.prepare` (3179); `Store.sql` (3179) | CORE |
| [packages/store/src/store.ts:5948](../../packages/store/src/store.ts#L5948) `Store/allowedIds` | `SQLite.iterate` (5948); `SQLite.prepare` (5948); `Store.sql` (5948) | CORE |
| [packages/store/src/store.ts:5108](../../packages/store/src/store.ts#L5108) `Store/apiToken` | `SQLite.get` (5108); `SQLite.prepare` (5108, 5121); `Store.sql` (5108, 5121) | CORE |
| [packages/store/src/store.ts:5084](../../packages/store/src/store.ts#L5084) `Store/apiTokens` | `SQLite.all` (5084); `SQLite.prepare` (5084); `Store.sql` (5084) | CORE |
| [packages/store/src/store.ts:3502](../../packages/store/src/store.ts#L3502) `Store/appendSecurityEvent` | `Store.sql` (3502) | CORE |
| [packages/store/src/store.ts:4507](../../packages/store/src/store.ts#L4507) `Store/applyAccountImport` | `Store.sql` (4507, 4515, 4544); `SQLite.get` (4515); `SQLite.prepare` (4515, 4544) | CORE |
| [packages/store/src/store.ts:2122](../../packages/store/src/store.ts#L2122) `Store/applyDesign` | `Store.sql` (2122, 2123, 2136, 2139, 2144, 2160, 2163, 2163); `SQLite.prepare` (2139, 2144) | CORE |
| [packages/store/src/store.ts:3375](../../packages/store/src/store.ts#L3375) `Store/approvePending` | `SQLite.get` (3375); `SQLite.prepare` (3375, 3386); `Store.sql` (3375, 3386) | CORE |
| [packages/store/src/store.ts:2581](../../packages/store/src/store.ts#L2581) `Store/audit` | `Store.sql` (2581) | CORE |
| [packages/store/src/store.ts:2222](../../packages/store/src/store.ts#L2222) `Store/auditLog` | `SQLite.all` (2222); `SQLite.prepare` (2222); `Store.sql` (2222) | CORE |
| [packages/store/src/store.ts:1733](../../packages/store/src/store.ts#L1733) `Store/backup` | `Store.sql` (1733) | CORE |
| [packages/store/src/store.ts:3185](../../packages/store/src/store.ts#L3185) `Store/blankPasswordAccounts` | `SQLite.all` (3185); `SQLite.prepare` (3185); `Store.sql` (3185) | CORE |
| [packages/store/src/store.ts:8850](../../packages/store/src/store.ts#L8850) `Store/canView` | `Store.canView` (8850); `Store.row` (8851) | GATED-STORE |
| [packages/store/src/store.ts:8832](../../packages/store/src/store.ts#L8832) `Store/canViewRecord` | `SQLite.get` (8832); `SQLite.prepare` (8832); `Store.sql` (8832) | GATED-STORE |
| [packages/store/src/store.ts:4436](../../packages/store/src/store.ts#L4436) `Store/canonicalAccount` | `SQLite.all` (4436); `SQLite.prepare` (4436); `Store.sql` (4436) | CORE |
| [packages/store/src/store.ts:9909](../../packages/store/src/store.ts#L9909) `Store/cascadeDelete` | `relatedRows` (9909) | CORE |
| [packages/store/src/store.ts:1952](../../packages/store/src/store.ts#L1952) `Store/changeOne` | `Store.sql` (1952, 1954) | CORE |
| [packages/store/src/store.ts:1955](../../packages/store/src/store.ts#L1955) `Store/changeOne/read` | `SQLite.get` (1955); `SQLite.prepare` (1955); `Store.sql` (1955) | CORE |
| [packages/store/src/store.ts:8148](../../packages/store/src/store.ts#L8148) `Store/checkContainerWrite` | `Store.row` (8148) | CORE |
| [packages/store/src/store.ts:9562](../../packages/store/src/store.ts#L9562) `Store/checkEditable` | `Store.row` (9562) | CORE |
| [packages/store/src/store.ts:1388](../../packages/store/src/store.ts#L1388) `Store/checkpoint` | `SQLite.get` (1388); `SQLite.prepare` (1388); `Store.sql` (1388) | CORE |
| [packages/store/src/store.ts:5720](../../packages/store/src/store.ts#L5720) `Store/clearAccountPrivilegeSet` | `SQLite.prepare` (5720); `Store.sql` (5720) | CORE |
| [packages/store/src/store.ts:1406](../../packages/store/src/store.ts#L1406) `Store/close` | `Store.sql` (1406) | CORE |
| [packages/store/src/store.ts:8116](../../packages/store/src/store.ts#L8116) `Store/compactFile` | `Store.sql` (8116, 8117, 8119) | CORE |
| [packages/store/src/store.ts:10033](../../packages/store/src/store.ts#L10033) `Store/computeValuesCurrent` | `Store.computeValues` (10033); `Store.sql` (10039, 10043); `SQLite.all` (10043); `SQLite.prepare` (10043) | GATED-STORE |
| [packages/store/src/store.ts:8501](../../packages/store/src/store.ts#L8501) `Store/computedRows` | `Store.sql` (8501, 8504, 8505, 8506, 8508, 8518, 8519, 8520, 8523); `SQLite.prepare` (8504, 8506, 8508, 8518); `SQLite.iterate` (8508); `Calculations.globalValue` (8511); `Calculations.unstoredValue` (8512); `Calculations.related` (8515); `SQLite.all` (8518) | CORE |
| [packages/store/src/store.ts:5148](../../packages/store/src/store.ts#L5148) `Store/confirmTotp` | `SQLite.get` (5148); `SQLite.prepare` (5148, 5150); `Store.sql` (5148, 5150) | CORE |
| [packages/store/src/store.ts:1067](../../packages/store/src/store.ts#L1067) `Store/constructor` | `Store.sql` (1067, 1069, 1071, 1072, 1076, 1080, 1081, 1092, 1097, 1102, 1103, 1107, 1108, 1109, 1116, 1120, 1124, 1125, 1126, 1131, 1135, 1138, 1139, 1141, 1142, 1145, 1146, 1150, 1151, 1155, 1156, 1159, 1161, 1164, 1165, 1169, 1170, 1174, 1175, 1178, 1179, 1180, 1183, 1184, 1187, 1188, 1190, 1190, 1191, 1191, 1192, 1195, 1199, 1201, 1204, 1205, 1206, 1209, 1210, 1212, 1214, 1215, 1219, 1220, 1222, 1226, 1228, 1229, 1230, 1230, 1234, 1235); `SQLite.get` (1071); `SQLite.prepare` (1071, 1138, 1139, 1142, 1145, 1150, 1155, 1164, 1169, 1174, 1183, 1187, 1190, 1191, 1209, 1214, 1219); `SQLite.all` (1138, 1145, 1150, 1155, 1164, 1169, 1174, 1183, 1187, 1190, 1191, 1209, 1214, 1219) | CORE |
| [packages/store/src/store.ts:5501](../../packages/store/src/store.ts#L5501) `Store/consumeRecoveryCode` | `SQLite.prepare` (5501); `Store.sql` (5501) | CORE |
| [packages/store/src/store.ts:7691](../../packages/store/src/store.ts#L7691) `Store/container` | `SQLite.get` (7691); `SQLite.prepare` (7691, 7700); `Store.sql` (7691, 7700); `SQLite.all` (7700) | CORE |
| [packages/store/src/store.ts:8125](../../packages/store/src/store.ts#L8125) `Store/containerId` | `Store.containerId` (8125); `Store.row` (8126) | CORE |
| [packages/store/src/store.ts:7708](../../packages/store/src/store.ts#L7708) `Store/containerInfo` | `SQLite.get` (7708); `SQLite.prepare` (7708); `Store.sql` (7708) | CORE |
| [packages/store/src/store.ts:7672](../../packages/store/src/store.ts#L7672) `Store/containerIntact` | `SQLite.get` (7672); `SQLite.prepare` (7672); `Store.sql` (7672) | CORE |
| [packages/store/src/store.ts:7611](../../packages/store/src/store.ts#L7611) `Store/containerIntegrityReport` | `SQLite.all` (7611); `SQLite.prepare` (7611, 7622); `Store.sql` (7611, 7622); `SQLite.get` (7622) | CORE |
| [packages/store/src/store.ts:7686](../../packages/store/src/store.ts#L7686) `Store/containerMeta` | `SQLite.get` (7686); `SQLite.prepare` (7686); `Store.sql` (7686) | CORE |
| [packages/store/src/store.ts:7742](../../packages/store/src/store.ts#L7742) `Store/containerRange` | `SQLite.all` (7742); `SQLite.prepare` (7742, 7749); `Store.sql` (7742, 7749); `SQLite.get` (7749) | CORE |
| [packages/store/src/store.ts:7513](../../packages/store/src/store.ts#L7513) `Store/containerReferences` | `SQLite.all` (7513, 7532, 7534, 7540, 7553, 7564, 7578); `SQLite.prepare` (7513, 7532, 7534, 7540, 7553, 7564, 7576, 7578); `Store.sql` (7513, 7532, 7534, 7540, 7553, 7564, 7576, 7578); `SQLite.get` (7576); `Store.row` (7587) | CORE |
| [packages/store/src/store.ts:10013](../../packages/store/src/store.ts#L10013) `Store/countIds` | `Store.countIds` (10013); `SQLite.get` (10017); `SQLite.prepare` (10017); `Store.sql` (10017) | GATED-STORE |
| [packages/store/src/store.ts:8875](../../packages/store/src/store.ts#L8875) `Store/create` | `SQLite.get` (8875, 8881); `SQLite.prepare` (8875, 8881, 8894); `Store.sql` (8875, 8881, 8894) | CORE |
| [packages/store/src/store.ts:3474](../../packages/store/src/store.ts#L3474) `Store/createAccount` | `SQLite.get` (3474); `SQLite.prepare` (3474, 3478, 3484, 3489, 3494); `Store.sql` (3474, 3478, 3484, 3489, 3494) | CORE |
| [packages/store/src/store.ts:4884](../../packages/store/src/store.ts#L4884) `Store/createApiToken` | `SQLite.get` (4884, 4912); `SQLite.prepare` (4884, 4911, 4912, 4922); `Store.sql` (4884, 4911, 4912, 4922) | CORE |
| [packages/store/src/store.ts:4448](../../packages/store/src/store.ts#L4448) `Store/createLocalAccount` | `SQLite.prepare` (4448); `Store.sql` (4448) | CORE |
| [packages/store/src/store.ts:3151](../../packages/store/src/store.ts#L3151) `Store/credentialIdentity` | `SQLite.get` (3151); `SQLite.prepare` (3151); `Store.sql` (3151) | CORE |
| [packages/store/src/store.ts:1823](../../packages/store/src/store.ts#L1823) `Store/dataVersion` | `SQLite.get` (1823); `SQLite.prepare` (1823); `Store.sql` (1823) | CORE |
| [packages/store/src/store.ts:9605](../../packages/store/src/store.ts#L9605) `Store/delete` | `Store.row` (9605) | CORE |
| [packages/store/src/store.ts:9613](../../packages/store/src/store.ts#L9613) `Store/delete/run` | `SQLite.get` (9613); `SQLite.prepare` (9613, 9618); `Store.sql` (9613, 9618) | CORE |
| [packages/store/src/store.ts:4602](../../packages/store/src/store.ts#L4602) `Store/deleteAccount` | `SQLite.prepare` (4602, 4606, 4607, 4608, 4609, 4610, 4611, 4612, 4613, 4620, 4622, 4624, 4626, 4630); `Store.sql` (4602, 4606, 4607, 4608, 4609, 4610, 4611, 4612, 4613, 4620, 4622, 4624, 4626, 4630) | CORE |
| [packages/store/src/store.ts:5586](../../packages/store/src/store.ts#L5586) `Store/deletePrivilegeSet` | `SQLite.prepare` (5586); `Store.sql` (5586) | CORE |
| [packages/store/src/store.ts:3612](../../packages/store/src/store.ts#L3612) `Store/deleteScriptTest` | `SQLite.prepare` (3612); `Store.sql` (3612) | CORE |
| [packages/store/src/store.ts:2796](../../packages/store/src/store.ts#L2796) `Store/deletedRows` | `SQLite.get` (2796); `SQLite.prepare` (2796, 2798, 2798); `Store.sql` (2796, 2798, 2798); `SQLite.all` (2798, 2798) | CORE |
| [packages/store/src/store.ts:2906](../../packages/store/src/store.ts#L2906) `Store/designEffect` | `Store.sql` (2906, 2911, 2916, 2921, 2924, 2930, 2941, 2942, 2944, 2957, 2958, 2961, 2963, 2969, 2970, 2971, 2976, 2978, 2982, 2985, 2986, 2988, 2991, 2997, 2999, 3006, 3007, 3009, 3010, 3011, 3012, 3019, 3020, 3022, 3022, 3024, 3025, 3026, 3030, 3034, 3036, 3074, 3076, 3078); `SQLite.get` (2941, 2957, 2969, 2970, 2982, 2986, 3022, 3030); `SQLite.prepare` (2941, 2942, 2957, 2958, 2969, 2970, 2976, 2978, 2982, 2986, 2997, 2999, 3012, 3019, 3020, 3022, 3024, 3026, 3030, 3034); `SQLite.all` (3019, 3020); `SQLite.iterate` (3024) | CORE |
| [packages/store/src/store.ts:2899](../../packages/store/src/store.ts#L2899) `Store/designEffect/renameExcluded` | `SQLite.prepare` (2899); `Store.sql` (2899) | CORE |
| [packages/store/src/store.ts:2883](../../packages/store/src/store.ts#L2883) `Store/designEffect/renameKey` | `SQLite.prepare` (2883); `Store.sql` (2883) | CORE |
| [packages/store/src/store.ts:2837](../../packages/store/src/store.ts#L2837) `Store/designHistory` | `SQLite.all` (2837); `SQLite.prepare` (2837); `Store.sql` (2837) | CORE |
| [packages/store/src/store.ts:5169](../../packages/store/src/store.ts#L5169) `Store/disableTotp` | `SQLite.prepare` (5169); `Store.sql` (5169) | CORE |
| [packages/store/src/store.ts:3086](../../packages/store/src/store.ts#L3086) `Store/dropColumnIndexes` | `SQLite.all` (3086, 3088); `SQLite.prepare` (3086, 3088); `Store.sql` (3086, 3088, 3089) | CORE |
| [packages/store/src/store.ts:8281](../../packages/store/src/store.ts#L8281) `Store/dropFieldIndex` | `SQLite.get` (8281); `SQLite.prepare` (8281); `Store.sql` (8281, 8282) | CORE |
| [packages/store/src/store.ts:8918](../../packages/store/src/store.ts#L8918) `Store/duplicate` | `Store.row` (8918); `SQLite.get` (8922); `SQLite.prepare` (8922, 8937); `Store.sql` (8922, 8937) | CORE |
| [packages/store/src/store.ts:7929](../../packages/store/src/store.ts#L7929) `Store/embeddedContainerCount` | `SQLite.prepare` (7929); `Store.sql` (7929); `SQLite.get` (7930) | CORE |
| [packages/store/src/store.ts:7915](../../packages/store/src/store.ts#L7915) `Store/embeddedContainers` | `SQLite.prepare` (7915, 7916); `Store.sql` (7915, 7916); `SQLite.all` (7916); `SQLite.get` (7920) | CORE |
| [packages/store/src/store.ts:2822](../../packages/store/src/store.ts#L2822) `Store/emptyDeleted` | `Store.sql` (2822, 2825, 2826, 2828, 2830); `SQLite.prepare` (2826) | CORE |
| [packages/store/src/store.ts:1703](../../packages/store/src/store.ts#L1703) `Store/endTransaction` | `Store.sql` (1703, 1706, 1706) | CORE |
| [packages/store/src/store.ts:5137](../../packages/store/src/store.ts#L5137) `Store/enrollTotp` | `SQLite.prepare` (5137); `Store.sql` (5137) | CORE |
| [packages/store/src/store.ts:2791](../../packages/store/src/store.ts#L2791) `Store/ensureDeleted` | `Store.sql` (2791) | CORE |
| [packages/store/src/store.ts:1245](../../packages/store/src/store.ts#L1245) `Store/ensureNativeIds` | `SQLite.all` (1245, 1257); `SQLite.prepare` (1245, 1248, 1256, 1257); `Store.sql` (1245, 1248, 1251, 1255, 1256, 1257, 1260, 1262) | CORE |
| [packages/store/src/store.ts:9259](../../packages/store/src/store.ts#L9259) `Store/evaluateCurrent` | `Store.row` (9259, 9259, 9260, 9260); `Calculations.context` (9265); `Store.get` (9266, 9268) | GATED-STORE |
| [packages/store/src/store.ts:9300](../../packages/store/src/store.ts#L9300) `Store/evaluateEachCurrent` | `Store.row` (9300, 9300, 9305); `Calculations.context` (9306); `Store.get` (9308) | GATED-STORE |
| [packages/store/src/store.ts:9362](../../packages/store/src/store.ts#L9362) `Store/evaluateRowsCurrent` | `Store.row` (9362, 9362, 9363, 9363) | GATED-STORE |
| [packages/store/src/store.ts:9341](../../packages/store/src/store.ts#L9341) `Store/evaluateRowsCurrent/each` | `Calculations.context` (9341); `Store.get` (9343) | GATED-STORE |
| [packages/store/src/store.ts:9377](../../packages/store/src/store.ts#L9377) `Store/evaluateRowsCurrent/found/[Symbol.iterator]` | `rowsById` (9377) | GATED-STORE |
| [packages/store/src/store.ts:9399](../../packages/store/src/store.ts#L9399) `Store/evaluateRowsCurrent/key` | `Calculations.context` (9399) | GATED-STORE |
| [packages/store/src/store.ts:3418](../../packages/store/src/store.ts#L3418) `Store/externalAccount` | `SQLite.all` (3418); `SQLite.prepare` (3418); `Store.sql` (3418) | CORE |
| [packages/store/src/store.ts:7434](../../packages/store/src/store.ts#L7434) `Store/externalContainerCheck` | `SQLite.all` (7434); `SQLite.prepare` (7434); `Store.sql` (7434) | CORE |
| [packages/store/src/store.ts:7441](../../packages/store/src/store.ts#L7441) `Store/externalContainerCount` | `SQLite.get` (7441); `SQLite.prepare` (7441); `Store.sql` (7441) | CORE |
| [packages/store/src/store.ts:7450](../../packages/store/src/store.ts#L7450) `Store/externalContainerReport` | `SQLite.all` (7450, 7463); `SQLite.prepare` (7450, 7463); `Store.sql` (7450, 7463) | CORE |
| [packages/store/src/store.ts:4687](../../packages/store/src/store.ts#L4687) `Store/externalIdentityId` | `SQLite.get` (4687, 4693); `SQLite.prepare` (4687, 4692, 4693); `Store.sql` (4687, 4692, 4693) | CORE |
| [packages/store/src/store.ts:7682](../../packages/store/src/store.ts#L7682) `Store/externalOf` | `SQLite.get` (7682); `SQLite.prepare` (7682); `Store.sql` (7682) | CORE |
| [packages/store/src/store.ts:2729](../../packages/store/src/store.ts#L2729) `Store/failureAuditRoom` | `SQLite.get` (2729); `SQLite.prepare` (2729); `Store.sql` (2729) | CORE |
| [packages/store/src/store.ts:7094](../../packages/store/src/store.ts#L7094) `Store/fieldIndexCurrent` | `SQLite.iterate` (7094); `SQLite.prepare` (7094, 7099); `Store.sql` (7094, 7099); `SQLite.all` (7099) | GATED-STORE |
| [packages/store/src/store.ts:8316](../../packages/store/src/store.ts#L8316) `Store/find` | `Store.find` (8316) | GATED-STORE |
| [packages/store/src/store.ts:8688](../../packages/store/src/store.ts#L8688) `Store/findCandidates` | `Store.query` (8688) | CORE |
| [packages/store/src/store.ts:8327](../../packages/store/src/store.ts#L8327) `Store/findHere` | `Store.query` (8327, 8332, 8334, 8348, 8350, 8361); `Store.recordCount` (8345); `SQLite.get` (8346, 8350); `SQLite.prepare` (8346, 8350, 8356, 8363, 8372); `Store.sql` (8346, 8350, 8356, 8363, 8372); `SQLite.all` (8356, 8363, 8372) | GATED-STORE |
| [packages/store/src/store.ts:8367](../../packages/store/src/store.ts#L8367) `Store/findHere/[Symbol.iterator]` | `SQLite.iterate` (8367); `SQLite.prepare` (8367); `Store.sql` (8367) | GATED-STORE |
| [packages/store/src/store.ts:10058](../../packages/store/src/store.ts#L10058) `Store/findIdsCurrent` | `Store.findIds` (10058) | GATED-STORE |
| [packages/store/src/store.ts:10064](../../packages/store/src/store.ts#L10064) `Store/findIdsHere` | `Store.query` (10064, 10069, 10071); `SQLite.iterate` (10082); `SQLite.prepare` (10082); `Store.sql` (10082) | GATED-STORE |
| [packages/store/src/store.ts:8632](../../packages/store/src/store.ts#L8632) `Store/findSource` | `Store.query` (8632); `SQLite.all` (8641, 8658); `SQLite.prepare` (8641, 8649, 8657); `Store.sql` (8641, 8646, 8649, 8654, 8657, 8671, 8673); `Calculations.globalValue` (8663); `Calculations.unstoredValue` (8664); `Calculations.related` (8668) | CORE |
| [packages/store/src/store.ts:9654](../../packages/store/src/store.ts#L9654) `Store/forgetStandInValues` | `Store.sql` (9654, 9675); `SQLite.prepare` (9675) | CORE |
| [packages/store/src/store.ts:4569](../../packages/store/src/store.ts#L4569) `Store/forgetStandIns` | `SQLite.prepare` (4569); `Store.sql` (4569) | CORE |
| [packages/store/src/store.ts:6976](../../packages/store/src/store.ts#L6976) `Store/foundSetPage` | `rowsById` (6976) | CORE |
| [packages/store/src/store.ts:6992](../../packages/store/src/store.ts#L6992) `Store/foundSetRowsCurrent` | `Store.viewableIds` (6992); `Store.row` (7008) | GATED-STORE |
| [packages/store/src/store.ts:3337](../../packages/store/src/store.ts#L3337) `Store/gateAgentWrite` | `SQLite.get` (3337); `SQLite.prepare` (3337, 3339); `Store.sql` (3337, 3339) | CORE |
| [packages/store/src/store.ts:5439](../../packages/store/src/store.ts#L5439) `Store/generateRecoveryCodes` | `SQLite.prepare` (5439, 5442); `Store.sql` (5439, 5442) | CORE |
| [packages/store/src/store.ts:8760](../../packages/store/src/store.ts#L8760) `Store/getCurrent` | `Store.get` (8760); `Store.row` (8761, 8761, 8775); `SQLite.all` (8778); `SQLite.prepare` (8778); `Store.sql` (8778) | GATED-STORE |
| [packages/store/src/store.ts:8798](../../packages/store/src/store.ts#L8798) `Store/getManyCurrent` | `Store.getMany` (8798); `SQLite.get` (8816); `SQLite.prepare` (8816); `Store.sql` (8816) | GATED-STORE |
| [packages/store/src/store.ts:8809](../../packages/store/src/store.ts#L8809) `Store/getManyCurrent/[Symbol.iterator]` | `rowsById` (8809) | GATED-STORE |
| [packages/store/src/store.ts:1292](../../packages/store/src/store.ts#L1292) `Store/grantFullAccessClients` | `SQLite.prepare` (1292); `Store.sql` (1292) | CORE |
| [packages/store/src/store.ts:10099](../../packages/store/src/store.ts#L10099) `Store/groupSummariesCurrent` | `Store.groupSummaries` (10099); `Store.viewableIds` (10104); `Calculations.collect` (10120); `rowsById` (10120, 10170); `Calculations.collector` (10142) | GATED-STORE |
| [packages/store/src/store.ts:10168](../../packages/store/src/store.ts#L10168) `Store/groupSummariesCurrent/flush` | `Calculations.collector` (10168) | GATED-STORE |
| [packages/store/src/store.ts:10132](../../packages/store/src/store.ts#L10132) `Store/groupSummariesCurrent/key` | `Calculations.value` (10132); `Calculations.related` (10134) | GATED-STORE |
| [packages/store/src/store.ts:1316](../../packages/store/src/store.ts#L1316) `Store/hasOwnPassword` | `SQLite.get` (1316); `SQLite.prepare` (1316); `Store.sql` (1316) | CORE |
| [packages/store/src/store.ts:5294](../../packages/store/src/store.ts#L5294) `Store/hasPasskey` | `SQLite.get` (5294); `SQLite.prepare` (5294); `Store.sql` (5294) | CORE |
| [packages/store/src/store.ts:1300](../../packages/store/src/store.ts#L1300) `Store/hasProvingPassword` | `SQLite.get` (1300); `SQLite.prepare` (1300); `Store.sql` (1300) | CORE |
| [packages/store/src/store.ts:8235](../../packages/store/src/store.ts#L8235) `Store/hasTable` | `SQLite.get` (8235); `SQLite.prepare` (8235); `Store.sql` (8235) | CORE |
| [packages/store/src/store.ts:5158](../../packages/store/src/store.ts#L5158) `Store/hasTotp` | `SQLite.get` (5158); `SQLite.prepare` (5158); `Store.sql` (5158) | CORE |
| [packages/store/src/store.ts:4666](../../packages/store/src/store.ts#L4666) `Store/identityAllowed` | `SQLite.get` (4666, 4672, 4678); `SQLite.prepare` (4666, 4672, 4678); `Store.sql` (4666, 4672, 4678) | CORE |
| [packages/store/src/store.ts:6450](../../packages/store/src/store.ts#L6450) `Store/image` | `SQLite.get` (6450); `SQLite.prepare` (6450); `Store.sql` (6450) | CORE |
| [packages/store/src/store.ts:6460](../../packages/store/src/store.ts#L6460) `Store/images` | `SQLite.all` (6460); `SQLite.prepare` (6460); `Store.sql` (6460) | CORE |
| [packages/store/src/store.ts:4413](../../packages/store/src/store.ts#L4413) `Store/importAccounts` | `SQLite.all` (4413); `SQLite.prepare` (4413); `Store.sql` (4413) | CORE |
| [packages/store/src/store.ts:1572](../../packages/store/src/store.ts#L1572) `Store/independentWindowWrite` | `SQLite.get` (1572); `SQLite.prepare` (1572, 1602); `Store.sql` (1572, 1581, 1597, 1602, 1605) | CORE |
| [packages/store/src/store.ts:8247](../../packages/store/src/store.ts#L8247) `Store/indexedFields` | `SQLite.all` (8247, 8248); `SQLite.prepare` (8247, 8248); `Store.sql` (8247, 8248) | CORE |
| [packages/store/src/store.ts:10466](../../packages/store/src/store.ts#L10466) `Store/internalRoots` | `SQLite.get` (10466); `SQLite.prepare` (10466, 10468); `SQLite.all` (10468) | CORE |
| [packages/store/src/store.ts:3173](../../packages/store/src/store.ts#L3173) `Store/isAgent` | `SQLite.get` (3173); `SQLite.prepare` (3173); `Store.sql` (3173) | CORE |
| [packages/store/src/store.ts:3276](../../packages/store/src/store.ts#L3276) `Store/isExternal` | `SQLite.get` (3276); `SQLite.prepare` (3276); `Store.sql` (3276) | CORE |
| [packages/store/src/store.ts:5211](../../packages/store/src/store.ts#L5211) `Store/issueWebauthnChallenge` | `SQLite.prepare` (5211, 5213, 5214, 5216); `Store.sql` (5211, 5213, 5214, 5216); `SQLite.get` (5213) | CORE |
| [packages/store/src/store.ts:10373](../../packages/store/src/store.ts#L10373) `Store/iterateCommitted` | `SQLite.iterate` (10373) | CORE |
| [packages/store/src/store.ts:1549](../../packages/store/src/store.ts#L1549) `Store/joinTransaction` | `Store.sql` (1549, 1550, 1552, 1554, 1560) | CORE |
| [packages/store/src/store.ts:9856](../../packages/store/src/store.ts#L9856) `Store/keyStepWork` | `Store.sql` (9856, 9862, 9866, 9868) | CORE |
| [packages/store/src/store.ts:6317](../../packages/store/src/store.ts#L6317) `Store/knownSharedAccount` | `SQLite.get` (6317); `SQLite.prepare` (6317); `Store.sql` (6317) | CORE |
| [packages/store/src/store.ts:3886](../../packages/store/src/store.ts#L3886) `Store/lastSignIns` | `Store.auditLog` (3886) | CORE |
| [packages/store/src/store.ts:6490](../../packages/store/src/store.ts#L6490) `Store/layout` | `SQLite.get` (6490); `SQLite.prepare` (6490); `Store.sql` (6490) | CORE |
| [packages/store/src/store.ts:2854](../../packages/store/src/store.ts#L2854) `Store/layoutHistory` | `SQLite.all` (2854); `SQLite.prepare` (2854); `Store.sql` (2854) | CORE |
| [packages/store/src/store.ts:6380](../../packages/store/src/store.ts#L6380) `Store/layouts` | `SQLite.all` (6380); `SQLite.prepare` (6380); `Store.sql` (6380) | CORE |
| [packages/store/src/store.ts:4186](../../packages/store/src/store.ts#L4186) `Store/leastPrivilege` | `SQLite.all` (4186); `SQLite.prepare` (4186); `Store.sql` (4186) | CORE |
| [packages/store/src/store.ts:4750](../../packages/store/src/store.ts#L4750) `Store/ledgerRow` | `SQLite.get` (4750, 4751); `SQLite.prepare` (4750, 4751); `Store.sql` (4750, 4751) | AUTH |
| [packages/store/src/store.ts:4762](../../packages/store/src/store.ts#L4762) `Store/ledgerWrite` | `Store.sql` (4762, 4763, 4765, 4767, 4770, 4770) | AUTH |
| [packages/store/src/store.ts:4496](../../packages/store/src/store.ts#L4496) `Store/limitAccountImport` | `SQLite.prepare` (4496, 4497, 4500); `Store.sql` (4496, 4497, 4500); `SQLite.get` (4497) | CORE |
| [packages/store/src/store.ts:3126](../../packages/store/src/store.ts#L3126) `Store/linkIdentity` | `SQLite.get` (3126); `SQLite.prepare` (3126); `Store.sql` (3126) | CORE |
| [packages/store/src/store.ts:3118](../../packages/store/src/store.ts#L3118) `Store/linkPrincipal` | `SQLite.get` (3118); `SQLite.prepare` (3118); `Store.sql` (3118) | CORE |
| [packages/store/src/store.ts:2755](../../packages/store/src/store.ts#L2755) `Store/logSecurity` | `Store.sql` (2755) | CORE |
| [packages/store/src/store.ts:3772](../../packages/store/src/store.ts#L3772) `Store/markPiiField` | `SQLite.prepare` (3772); `Store.sql` (3772) | CORE |
| [packages/store/src/store.ts:7407](../../packages/store/src/store.ts#L7407) `Store/markRepeating` | `SQLite.prepare` (7407); `Store.sql` (7407) | CORE |
| [packages/store/src/store.ts:10306](../../packages/store/src/store.ts#L10306) `Store/matchIds` | `Store.matchIds` (10306); `SQLite.all` (10312); `SQLite.prepare` (10312); `Store.sql` (10312) | CORE |
| [packages/store/src/store.ts:1331](../../packages/store/src/store.ts#L1331) `Store/meta` | `SQLite.get` (1331); `SQLite.prepare` (1331); `Store.sql` (1331) | CORE |
| [packages/store/src/store.ts:924](../../packages/store/src/store.ts#L924) `Store/metadataVersions` | `SQLite.get` (924); `SQLite.prepare` (924); `Store.sql` (924) | CORE |
| [packages/store/src/store.ts:8044](../../packages/store/src/store.ts#L8044) `Store/moveContainersIn` | `Store.sql` (8044, 8050, 8052, 8053, 8054, 8055, 8075, 8080, 8080, 8091, 8094, 8097, 8104); `SQLite.prepare` (8052, 8053, 8054, 8055, 8091, 8097); `SQLite.get` (8057, 8091, 8097) | CORE |
| [packages/store/src/store.ts:7966](../../packages/store/src/store.ts#L7966) `Store/moveContainersOut` | `Store.sql` (7966, 7974, 7976, 7978, 7983, 7984, 8004, 8010, 8012, 8014, 8014, 8020, 8020, 8025, 8027, 8029, 8029, 8035); `SQLite.get` (7974); `SQLite.prepare` (7974, 7983, 7984); `Store.container` (7986) | CORE |
| [packages/store/src/store.ts:4367](../../packages/store/src/store.ts#L4367) `Store/mustChangePassword` | `SQLite.get` (4367); `SQLite.prepare` (4367); `Store.sql` (4367) | CORE |
| [packages/store/src/store.ts:1270](../../packages/store/src/store.ts#L1270) `Store/nativeIdGuards` | `Store.sql` (1270, 1271, 1273) | CORE |
| [packages/store/src/store.ts:5038](../../packages/store/src/store.ts#L5038) `Store/objectUseSince` | `SQLite.get` (5038); `SQLite.prepare` (5038); `Store.sql` (5038) | CORE |
| [packages/store/src/store.ts:8207](../../packages/store/src/store.ts#L8207) `Store/orderBy` | `Store.valueListItems` (8207) | CORE |
| [packages/store/src/store.ts:7599](../../packages/store/src/store.ts#L7599) `Store/orphanContainerReport` | `SQLite.all` (7599); `SQLite.prepare` (7599); `Store.sql` (7599) | CORE |
| [packages/store/src/store.ts:5263](../../packages/store/src/store.ts#L5263) `Store/passkeyAllowList` | `SQLite.all` (5263); `SQLite.prepare` (5263); `Store.sql` (5263) | CORE |
| [packages/store/src/store.ts:5299](../../packages/store/src/store.ts#L5299) `Store/passkeyIds` | `SQLite.all` (5299); `SQLite.prepare` (5299); `Store.sql` (5299) | CORE |
| [packages/store/src/store.ts:5287](../../packages/store/src/store.ts#L5287) `Store/passkeys` | `SQLite.all` (5287); `SQLite.prepare` (5287); `Store.sql` (5287) | CORE |
| [packages/store/src/store.ts:4406](../../packages/store/src/store.ts#L4406) `Store/passwordDaysRemaining` | `SQLite.get` (4406); `SQLite.prepare` (4406); `Store.sql` (4406) | CORE |
| [packages/store/src/store.ts:3361](../../packages/store/src/store.ts#L3361) `Store/pendingChanges` | `SQLite.all` (3361); `SQLite.prepare` (3361); `Store.sql` (3361) | CORE |
| [packages/store/src/store.ts:1349](../../packages/store/src/store.ts#L1349) `Store/persistentData` | `SQLite.get` (1349) | CORE |
| [packages/store/src/store.ts:1358](../../packages/store/src/store.ts#L1358) `Store/persistentDataIds` | `SQLite.all` (1358) | CORE |
| [packages/store/src/store.ts:1339](../../packages/store/src/store.ts#L1339) `Store/persistentTable` | `Store.sql` (1339) | CORE |
| [packages/store/src/store.ts:9547](../../packages/store/src/store.ts#L9547) `Store/portalContainerTarget` | `Store.row` (9547); `relatedIdList` (9549) | CORE |
| [packages/store/src/store.ts:7031](../../packages/store/src/store.ts#L7031) `Store/portalCountsCurrent` | `Store.canView` (7031); `Store.row` (7058) | GATED-STORE |
| [packages/store/src/store.ts:7269](../../packages/store/src/store.ts#L7269) `Store/portalRows` | `relatedRows` (7269); `relatedIdList` (7270); `Store.viewableIds` (7273); `rowsById` (7298, 7336); `Calculations.related` (7312) | CORE |
| [packages/store/src/store.ts:7280](../../packages/store/src/store.ts#L7280) `Store/portalRows/context` | `Calculations.context` (7280) | CORE |
| [packages/store/src/store.ts:7290](../../packages/store/src/store.ts#L7290) `Store/portalRows/valueOf` | `Calculations.value` (7290) | CORE |
| [packages/store/src/store.ts:2288](../../packages/store/src/store.ts#L2288) `Store/prepared` | `SQLite.prepare` (2288); `Store.sql` (2288) | CORE |
| [packages/store/src/store.ts:4478](../../packages/store/src/store.ts#L4478) `Store/previewAccountImport` | `Store.sql` (4478, 4479, 4488) | CORE |
| [packages/store/src/store.ts:6081](../../packages/store/src/store.ts#L6081) `Store/previewRecordRuleCurrent` | `SQLite.get` (6081); `SQLite.prepare` (6081, 6084); `Store.sql` (6081, 6084); `SQLite.all` (6084); `Calculations.context` (6090, 6106) | CORE |
| [packages/store/src/store.ts:8723](../../packages/store/src/store.ts#L8723) `Store/previewRow` | `Store.row` (8723) | CORE |
| [packages/store/src/store.ts:5514](../../packages/store/src/store.ts#L5514) `Store/privilegeSets` | `Store.sql` (5514) | CORE |
| [packages/store/src/store.ts:2499](../../packages/store/src/store.ts#L2499) `Store/pruneAudit` | `Store.sql` (2499, 2501, 2503); `SQLite.get` (2501); `SQLite.prepare` (2501) | CORE |
| [packages/store/src/store.ts:7634](../../packages/store/src/store.ts#L7634) `Store/purgeOrphanContainers` | `Store.sql` (7634, 7638, 7647, 7650, 7651, 7656, 7657, 7659, 7659); `Store.orphanContainerReport` (7642); `SQLite.get` (7647); `SQLite.prepare` (7647, 7650, 7651) | CORE |
| [packages/store/src/store.ts:10572](../../packages/store/src/store.ts#L10572) `Store/query` | `SQLite.iterate` (10572) | CORE |
| [packages/store/src/store.ts:10611](../../packages/store/src/store.ts#L10611) `Store/queryWithOriginsCurrent` | `SQLite.iterate` (10611); `SQLite.all` (10620, 10623); `SQLite.prepare` (10620, 10623) | CORE |
| [packages/store/src/store.ts:10407](../../packages/store/src/store.ts#L10407) `Store/readOnlyChecked` | `SQLite.prepare` (10407, 10411, 10420, 10425); `SQLite.all` (10411, 10420, 10425) | CORE |
| [packages/store/src/store.ts:3098](../../packages/store/src/store.ts#L3098) `Store/recompute` | `SQLite.prepare` (3098, 3102); `Store.sql` (3098, 3102); `SQLite.iterate` (3102); `Calculations.computeStoredStyled` (3103); `Calculations.value` (3103) | CORE |
| [packages/store/src/store.ts:2303](../../packages/store/src/store.ts#L2303) `Store/recordAsOf` | `SQLite.get` (2303, 2305); `SQLite.prepare` (2303, 2305, 2307, 2308); `Store.sql` (2303, 2305, 2307, 2308); `SQLite.all` (2307, 2308) | CORE |
| [packages/store/src/store.ts:2006](../../packages/store/src/store.ts#L2006) `Store/recordCount` | `SQLite.get` (2006); `SQLite.prepare` (2006); `Store.sql` (2006) | CORE |
| [packages/store/src/store.ts:4969](../../packages/store/src/store.ts#L4969) `Store/recordObjectUse` | `Store.sql` (4969) | CORE |
| [packages/store/src/store.ts:9249](../../packages/store/src/store.ts#L9249) `Store/recordViewable` | `Store.row` (9249) | GATED-STORE |
| [packages/store/src/store.ts:1396](../../packages/store/src/store.ts#L1396) `Store/recordedFormat` | `Store.sql` (1396) | CORE |
| [packages/store/src/store.ts:7938](../../packages/store/src/store.ts#L7938) `Store/recoverContainersOut` | `SQLite.prepare` (7938); `Store.sql` (7938); `SQLite.get` (7941) | CORE |
| [packages/store/src/store.ts:1478](../../packages/store/src/store.ts#L1478) `Store/recoverPendingExternalFiles` | `Store.sql` (1478, 1480, 1504, 1506); `SQLite.prepare` (1480); `SQLite.get` (1491) | CORE |
| [packages/store/src/store.ts:5457](../../packages/store/src/store.ts#L5457) `Store/recoveryCodesRemaining` | `SQLite.get` (5457); `SQLite.prepare` (5457); `Store.sql` (5457) | CORE |
| [packages/store/src/store.ts:10447](../../packages/store/src/store.ts#L10447) `Store/refreshDecimalSqlViews` | `SQLite.get` (10447); `SQLite.prepare` (10447, 10452); `SQLite.all` (10452) | CORE |
| [packages/store/src/store.ts:3267](../../packages/store/src/store.ts#L3267) `Store/refuseLookalikeAccount` | `SQLite.all` (3267); `SQLite.prepare` (3267); `Store.sql` (3267) | CORE |
| [packages/store/src/store.ts:5323](../../packages/store/src/store.ts#L5323) `Store/registerPasskey` | `SQLite.prepare` (5323); `Store.sql` (5323) | CORE |
| [packages/store/src/store.ts:3396](../../packages/store/src/store.ts#L3396) `Store/rejectPending` | `SQLite.get` (3396); `SQLite.prepare` (3396, 3398); `Store.sql` (3396, 3398) | CORE |
| [packages/store/src/store.ts:8475](../../packages/store/src/store.ts#L8475) `Store/relatedCriteria` | `SQLite.iterate` (8475); `SQLite.prepare` (8475); `Store.sql` (8475) | CORE |
| [packages/store/src/store.ts:8472](../../packages/store/src/store.ts#L8472) `Store/relatedCriteria/matched` | `relatedRows` (8472) | CORE |
| [packages/store/src/store.ts:6818](../../packages/store/src/store.ts#L6818) `Store/relatedValues` | `Calculations.globalValue` (6818); `Calculations.unstoredValue` (6820) | CORE |
| [packages/store/src/store.ts:5336](../../packages/store/src/store.ts#L5336) `Store/removePasskey` | `SQLite.get` (5336); `SQLite.prepare` (5336, 5337); `Store.sql` (5336, 5337) | CORE |
| [packages/store/src/store.ts:9694](../../packages/store/src/store.ts#L9694) `Store/restoreDeletedRowLocked` | `SQLite.get` (9694, 9699); `SQLite.prepare` (9694, 9695, 9699, 9709); `Store.sql` (9694, 9695, 9699, 9709); `SQLite.all` (9695) | CORE |
| [packages/store/src/store.ts:2338](../../packages/store/src/store.ts#L2338) `Store/restoreRecord` | `Store.recordAsOf` (2338); `SQLite.get` (2342); `SQLite.prepare` (2342, 2347, 2356, 2367); `Store.sql` (2342, 2347, 2356, 2367) | CORE |
| [packages/store/src/store.ts:2382](../../packages/store/src/store.ts#L2382) `Store/revertAuditEntry` | `Store.auditLog` (2382) | CORE |
| [packages/store/src/store.ts:5094](../../packages/store/src/store.ts#L5094) `Store/revokeApiToken` | `SQLite.prepare` (5094); `Store.sql` (5094) | CORE |
| [packages/store/src/store.ts:8741](../../packages/store/src/store.ts#L8741) `Store/row` | `SQLite.get` (8741) | CORE |
| [packages/store/src/store.ts:10511](../../packages/store/src/store.ts#L10511) `Store/rowsOf` | `SQLite.iterate` (10511, 10519) | CORE |
| [packages/store/src/store.ts:5907](../../packages/store/src/store.ts#L5907) `Store/ruleOutcome` | `Calculations.context` (5907) | CORE |
| [packages/store/src/store.ts:8586](../../packages/store/src/store.ts#L8586) `Store/runningSummaryValues` | `Store.viewableIds` (8586); `rowsById` (8588); `Calculations.value` (8599, 8605); `Calculations.related` (8616) | GATED-STORE |
| [packages/store/src/store.ts:5543](../../packages/store/src/store.ts#L5543) `Store/savePrivilegeSet` | `SQLite.prepare` (5543, 5551); `Store.sql` (5543, 5551) | AUTH |
| [packages/store/src/store.ts:3603](../../packages/store/src/store.ts#L3603) `Store/saveScriptTest` | `SQLite.prepare` (3603); `Store.sql` (3603) | CORE |
| [packages/store/src/store.ts:6046](../../packages/store/src/store.ts#L6046) `Store/scopedTableSql` | `Store.viewableIds` (6046); `SQLite.all` (6049); `SQLite.prepare` (6049); `Store.sql` (6049) | GATED-STORE |
| [packages/store/src/store.ts:2844](../../packages/store/src/store.ts#L2844) `Store/scriptHistory` | `SQLite.all` (2844); `SQLite.prepare` (2844); `Store.sql` (2844) | CORE |
| [packages/store/src/store.ts:2674](../../packages/store/src/store.ts#L2674) `Store/securityChange` | `Store.sql` (2674, 2676); `SQLite.prepare` (2676) | CORE |
| [packages/store/src/store.ts:2262](../../packages/store/src/store.ts#L2262) `Store/securityEvents` | `Store.auditLog` (2262) | CORE |
| [packages/store/src/store.ts:4818](../../packages/store/src/store.ts#L4818) `Store/securityToken` | `SQLite.get` (4818); `SQLite.prepare` (4818); `Store.sql` (4818) | CORE |
| [packages/store/src/store.ts:10538](../../packages/store/src/store.ts#L10538) `Store/selectHeldCurrent` | `Store.sql` (10538, 10539, 10541); `SQLite.prepare` (10539) | CORE |
| [packages/store/src/store.ts:9999](../../packages/store/src/store.ts#L9999) `Store/selectIdsCurrent` | `Store.selectIds` (9999); `SQLite.all` (10005); `SQLite.prepare` (10005); `Store.sql` (10005) | GATED-STORE |
| [packages/store/src/store.ts:10530](../../packages/store/src/store.ts#L10530) `Store/selectIn` | `Store.select` (10530) | CORE |
| [packages/store/src/store.ts:1753](../../packages/store/src/store.ts#L1753) `Store/selfContainedCopy` | `Store.sql` (1753); `SQLite.all` (1758); `SQLite.prepare` (1758, 1760, 1761, 1762) | CORE |
| [packages/store/src/store.ts:4647](../../packages/store/src/store.ts#L4647) `Store/setAccountActive` | `SQLite.prepare` (4647, 4650, 4651); `Store.sql` (4647, 4650, 4651) | AUTH |
| [packages/store/src/store.ts:4837](../../packages/store/src/store.ts#L4837) `Store/setAccountLocalOnly` | `SQLite.prepare` (4837); `Store.sql` (4837) | CORE |
| [packages/store/src/store.ts:5698](../../packages/store/src/store.ts#L5698) `Store/setAccountPrivilegeSet` | `SQLite.get` (5698); `SQLite.prepare` (5698, 5701, 5705); `Store.sql` (5698, 5701, 5705) | AUTH |
| [packages/store/src/store.ts:4846](../../packages/store/src/store.ts#L4846) `Store/setAccountRequire2fa` | `SQLite.prepare` (4846); `Store.sql` (4846) | CORE |
| [packages/store/src/store.ts:3297](../../packages/store/src/store.ts#L3297) `Store/setAgentAccount` | `SQLite.get` (3297); `SQLite.prepare` (3297, 3303); `Store.sql` (3297, 3303) | CORE |
| [packages/store/src/store.ts:3647](../../packages/store/src/store.ts#L3647) `Store/setAiAllowed` | `SQLite.prepare` (3647); `Store.sql` (3647) | CORE |
| [packages/store/src/store.ts:3730](../../packages/store/src/store.ts#L3730) `Store/setAiPolicy` | `SQLite.prepare` (3730); `Store.sql` (3730) | CORE |
| [packages/store/src/store.ts:6304](../../packages/store/src/store.ts#L6304) `Store/setAllowBlankPasswordFromLan` | `SQLite.prepare` (6304); `Store.sql` (6304) | CORE |
| [packages/store/src/store.ts:2477](../../packages/store/src/store.ts#L2477) `Store/setAuditSettings` | `SQLite.prepare` (2477); `Store.sql` (2477) | CORE |
| [packages/store/src/store.ts:8157](../../packages/store/src/store.ts#L8157) `Store/setContainer` | `Store.sql` (8157, 8174); `Store.row` (8163); `SQLite.prepare` (8174) | CORE |
| [packages/store/src/store.ts:3249](../../packages/store/src/store.ts#L3249) `Store/setExternalAccount` | `SQLite.get` (3249); `SQLite.prepare` (3249, 3254); `Store.sql` (3249, 3254) | CORE |
| [packages/store/src/store.ts:4353](../../packages/store/src/store.ts#L4353) `Store/setMustChangePassword` | `SQLite.prepare` (4353); `Store.sql` (4353) | CORE |
| [packages/store/src/store.ts:3449](../../packages/store/src/store.ts#L3449) `Store/setPassword` | `SQLite.get` (3449); `SQLite.prepare` (3449, 3451, 3460); `Store.sql` (3449, 3451, 3460) | AUTH |
| [packages/store/src/store.ts:3544](../../packages/store/src/store.ts#L3544) `Store/setPasswordPolicy` | `SQLite.prepare` (3544); `Store.sql` (3544) | CORE |
| [packages/store/src/store.ts:1364](../../packages/store/src/store.ts#L1364) `Store/setPersistentData` | `SQLite.prepare` (1364, 1368); `Store.sql` (1364, 1368) | CORE |
| [packages/store/src/store.ts:3750](../../packages/store/src/store.ts#L3750) `Store/setPiiIsolation` | `SQLite.prepare` (3750); `Store.sql` (3750) | CORE |
| [packages/store/src/store.ts:3580](../../packages/store/src/store.ts#L3580) `Store/setRequireTotpForFullAccess` | `SQLite.prepare` (3580); `Store.sql` (3580) | CORE |
| [packages/store/src/store.ts:3662](../../packages/store/src/store.ts#L3662) `Store/setScriptNetwork` | `SQLite.prepare` (3662); `Store.sql` (3662) | CORE |
| [packages/store/src/store.ts:3719](../../packages/store/src/store.ts#L3719) `Store/setSqlRequiresFmxdbc` | `SQLite.prepare` (3719); `Store.sql` (3719) | CORE |
| [packages/store/src/store.ts:9170](../../packages/store/src/store.ts#L9170) `Store/setStoredCalcValues` | `SQLite.prepare` (9170, 9171); `Store.sql` (9170, 9171); `SQLite.get` (9175) | CORE |
| [packages/store/src/store.ts:8239](../../packages/store/src/store.ts#L8239) `Store/setUserPref` | `Store.sql` (8239, 8240, 8241); `SQLite.prepare` (8240, 8241) | CORE |
| [packages/store/src/store.ts:3703](../../packages/store/src/store.ts#L3703) `Store/setWebViewerHosts` | `SQLite.prepare` (3703); `Store.sql` (3703) | CORE |
| [packages/store/src/store.ts:4789](../../packages/store/src/store.ts#L4789) `Store/settleSignIns` | `SQLite.all` (4789, 4795); `SQLite.prepare` (4789, 4795, 4801, 4805, 4807); `Store.sql` (4789, 4795, 4801, 4805, 4807) | AUTH |
| [packages/store/src/store.ts:1884](../../packages/store/src/store.ts#L1884) `Store/shareResults` | `Store.sql` (1884) | CORE |
| [packages/store/src/store.ts:1422](../../packages/store/src/store.ts#L1422) `Store/shipWal` | `Store.sql` (1422) | CORE |
| [packages/store/src/store.ts:4736](../../packages/store/src/store.ts#L4736) `Store/signInBase` | `SQLite.get` (4736); `SQLite.prepare` (4736); `Store.sql` (4736) | AUTH |
| [packages/store/src/store.ts:4738](../../packages/store/src/store.ts#L4738) `Store/signInBase/identity` | `SQLite.get` (4738); `SQLite.prepare` (4738); `Store.sql` (4738) | AUTH |
| [packages/store/src/store.ts:4726](../../packages/store/src/store.ts#L4726) `Store/signInMark` | `SQLite.prepare` (4726); `Store.sql` (4726) | AUTH |
| [packages/store/src/store.ts:10224](../../packages/store/src/store.ts#L10224) `Store/sortIdsCurrentProgress` | `SQLite.all` (10224); `SQLite.prepare` (10224, 10292); `Store.sql` (10224, 10292); `Store.valueListItems` (10232); `rowsById` (10244); `Calculations.globalValue` (10247); `Calculations.unstoredValue` (10248); `Calculations.related` (10254); `SQLite.iterate` (10292) | GATED-STORE |
| [packages/store/src/store.ts:8400](../../packages/store/src/store.ts#L8400) `Store/sortedPage` | `SQLite.iterate` (8400); `SQLite.prepare` (8400, 8415); `Store.sql` (8400, 8415); `SQLite.all` (8415) | CORE |
| [packages/store/src/store.ts:8548](../../packages/store/src/store.ts#L8548) `Store/summaries` | `Calculations.wholeTable` (8548); `Calculations.collect` (8568, 8573) | CORE |
| [packages/store/src/store.ts:8564](../../packages/store/src/store.ts#L8564) `Store/summaries/recs` | `SQLite.iterate` (8564); `SQLite.prepare` (8564); `Store.sql` (8564) | CORE |
| [packages/store/src/store.ts:5277](../../packages/store/src/store.ts#L5277) `Store/takeWebauthnChallenge` | `SQLite.get` (5277); `SQLite.prepare` (5277, 5279); `Store.sql` (5277, 5279) | CORE |
| [packages/store/src/store.ts:8292](../../packages/store/src/store.ts#L8292) `Store/timeFind` | `Store.query` (8292, 8296, 8297); `Store.recordCount` (8299) | CORE |
| [packages/store/src/store.ts:6759](../../packages/store/src/store.ts#L6759) `Store/toRecord` | `Calculations.value` (6759, 6769); `Calculations.globalValue` (6763); `Calculations.unstoredStyled` (6768) | CORE |
| [packages/store/src/store.ts:5163](../../packages/store/src/store.ts#L5163) `Store/totpAccounts` | `SQLite.all` (5163); `SQLite.prepare` (5163); `Store.sql` (5163) | CORE |
| [packages/store/src/store.ts:1433](../../packages/store/src/store.ts#L1433) `Store/trial` | `Store.sql` (1433) | CORE |
| [packages/store/src/store.ts:1438](../../packages/store/src/store.ts#L1438) `Store/trial/undo` | `Store.sql` (1438) | CORE |
| [packages/store/src/store.ts:10334](../../packages/store/src/store.ts#L10334) `Store/truncate/run` | `Store.sql` (10334, 10336, 10343, 10345, 10347, 10348); `SQLite.prepare` (10336, 10343); `SQLite.all` (10338) | CORE |
| [packages/store/src/store.ts:3196](../../packages/store/src/store.ts#L3196) `Store/unmigratedAccounts` | `SQLite.all` (3196); `SQLite.prepare` (3196); `Store.sql` (3196) | CORE |
| [packages/store/src/store.ts:4259](../../packages/store/src/store.ts#L4259) `Store/unusedAccess` | `SQLite.get` (4259); `SQLite.prepare` (4259, 4268); `Store.sql` (4259, 4268); `SQLite.all` (4268) | CORE |
| [packages/store/src/store.ts:4307](../../packages/store/src/store.ts#L4307) `Store/unusedObjects` | `SQLite.get` (4307); `SQLite.prepare` (4307, 4310); `Store.sql` (4307, 4310); `SQLite.all` (4310) | CORE |
| [packages/store/src/store.ts:5398](../../packages/store/src/store.ts#L5398) `Store/unusedRecoveryHashes` | `SQLite.all` (5398); `SQLite.prepare` (5398); `Store.sql` (5398) | CORE |
| [packages/store/src/store.ts:4089](../../packages/store/src/store.ts#L4089) `Store/unusualAccess` | `Store.auditLog` (4089, 4155) | CORE |
| [packages/store/src/store.ts:8992](../../packages/store/src/store.ts#L8992) `Store/update` | `Store.row` (8992); `Store.sql` (9022, 9023, 9062, 9065) | CORE |
| [packages/store/src/store.ts:9025](../../packages/store/src/store.ts#L9025) `Store/update/undo` | `Store.sql` (9025) | CORE |
| [packages/store/src/store.ts:9455](../../packages/store/src/store.ts#L9455) `Store/updatePortals` | `Store.row` (9455, 9491); `relatedRows` (9492) | CORE |
| [packages/store/src/store.ts:9465](../../packages/store/src/store.ts#L9465) `Store/updatePortals/portal/related` | `relatedIdList` (9465) | CORE |
| [packages/store/src/store.ts:9437](../../packages/store/src/store.ts#L9437) `Store/updateRelated` | `relatedRows` (9437) | CORE |
| [packages/store/src/store.ts:4345](../../packages/store/src/store.ts#L4345) `Store/usageCounting` | `SQLite.get` (4345); `SQLite.prepare` (4345); `Store.sql` (4345) | CORE |
| [packages/store/src/store.ts:8230](../../packages/store/src/store.ts#L8230) `Store/userPrefs` | `SQLite.all` (8230); `SQLite.prepare` (8230); `Store.sql` (8230) | CORE |
| [packages/store/src/store.ts:7140](../../packages/store/src/store.ts#L7140) `Store/valueListItemsCurrent` | `Store.valueListItems` (7140); `Store.get` (7154); `relatedRows` (7155); `Store.row` (7155); `SQLite.iterate` (7157); `SQLite.prepare` (7157); `Store.sql` (7157); `Calculations.related` (7167); `Calculations.value` (7171, 7172) | GATED-STORE |
| [packages/store/src/store.ts:9647](../../packages/store/src/store.ts#L9647) `Store/vaultHeld` | `SQLite.get` (9647); `SQLite.prepare` (9647); `Store.sql` (9647) | CORE |
| [packages/store/src/store.ts:5192](../../packages/store/src/store.ts#L5192) `Store/verifyTotp` | `SQLite.get` (5192); `SQLite.prepare` (5192, 5198); `Store.sql` (5192, 5198) | CORE |
| [packages/store/src/store.ts:1939](../../packages/store/src/store.ts#L1939) `Store/versionNumber` | `SQLite.get` (1939); `SQLite.prepare` (1939); `Store.sql` (1939) | CORE |
| [packages/store/src/store.ts:1895](../../packages/store/src/store.ts#L1895) `Store/versionTriggers` | `SQLite.get` (1895); `SQLite.prepare` (1895, 1900, 1901); `Store.sql` (1895, 1900, 1901, 1918, 1920, 1921, 1923); `SQLite.all` (1900, 1901) | CORE |
| [packages/store/src/store.ts:1863](../../packages/store/src/store.ts#L1863) `Store/warmSummariesCurrent` | `Calculations.wholeTable` (1863) | CORE |
| [packages/store/src/store.ts:3685](../../packages/store/src/store.ts#L3685) `Store/webViewerChecked` | `SQLite.get` (3685); `SQLite.prepare` (3685); `Store.sql` (3685) | CORE |
| [packages/store/src/store.ts:1634](../../packages/store/src/store.ts#L1634) `Store/withWriteTransaction` | `Store.sql` (1634, 1645, 1651, 1653, 1653) | CORE |
| [packages/store/src/store.ts:6694](../../packages/store/src/store.ts#L6694) `Store/wordIndex` | `Store.sql` (6694, 6702, 6707); `Store.recordCount` (6706); `SQLite.get` (6707); `SQLite.prepare` (6707) | CORE |
| [packages/store/src/store.ts:7831](../../packages/store/src/store.ts#L7831) `Store/writeExternalFile` | `Store.evaluateEach` (7831); `SQLite.prepare` (7854); `Store.sql` (7854) | CORE |
| [packages/store/src/store.ts:7855](../../packages/store/src/store.ts#L7855) `Store/writeExternalFile/taken` | `SQLite.get` (7855) | CORE |
| [packages/store/src/store.ts:5027](../../packages/store/src/store.ts#L5027) `Store/writeObjectUseRows` | `SQLite.prepare` (5027, 5028, 5033); `Store.sql` (5027, 5028, 5033) | CORE |
| [packages/store/src/store.ts:1994](../../packages/store/src/store.ts#L1994) `Store/writeToken` | `SQLite.get` (1994); `SQLite.prepare` (1994); `Store.sql` (1994) | CORE |
| [packages/store/src/store.ts:4999](../../packages/store/src/store.ts#L4999) `Store/writeUsage` | `Store.sql` (4999, 5000, 5002, 5006, 5008) | CORE |
| [packages/store/src/store.ts:5015](../../packages/store/src/store.ts#L5015) `Store/writeUsageRows` | `SQLite.prepare` (5015, 5016, 5022); `Store.sql` (5015, 5016, 5022) | CORE |
| [packages/store/src/store.ts:6415](../../packages/store/src/store.ts#L6415) `Store/design` | `SQLite.get` (6415) | CORE |
| [packages/store/src/store.ts:6437](../../packages/store/src/store.ts#L6437) `Store/themes` | `SQLite.get` (6437) | CORE |
| [packages/store/src/store.ts:5358](../../packages/store/src/store.ts#L5358) `Store/verifyPasskeyCredential` | `SQLite.get` (5358); `SQLite.prepare` (5358, 5370); `Store.sql` (5358, 5370) | CORE |
| [packages/store/src/store.ts:6275](../../packages/store/src/store.ts#L6275) `Store/passwordState` | `SQLite.get` (6275); `SQLite.prepare` (6275); `Store.sql` (6275) | CORE |
| [packages/store/src/store.ts:9590](../../packages/store/src/store.ts#L9590) `Store/deleteVisibility` | `Store.canViewRecord` (9590) | CORE |
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
