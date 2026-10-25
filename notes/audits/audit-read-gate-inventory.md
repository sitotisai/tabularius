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
| [packages/server/src/admin.ts:2277](../../packages/server/src/admin.ts#L2277) `Admin/audit` | `Store.auditLog` (2277) | ADMIN |
| [packages/server/src/admin.ts:1040](../../packages/server/src/admin.ts#L1040) `Admin/handle` | `Store.externalContainerReport` (1040); `Store.orphanContainerReport` (1045, 1049) | ADMIN |
| [packages/server/src/admin.ts:2708](../../packages/server/src/admin.ts#L2708) `Admin/status` | `Store.externalContainerCount` (2708) | ADMIN |
| [packages/server/src/admin.ts:2360](../../packages/server/src/admin.ts#L2360) `Admin/viewAs` | `Store.find` (2360) | ADMIN |
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
| [packages/server/src/dataapi.ts:2033](../../packages/server/src/dataapi.ts#L2033) `DataApi/route` | `Store.get` (2033, 2254, 2255, 2278, 2286, 2333, 2357, 2377, 2414); `Store.valueListItems` (2048); `Store.find` (2209, 2257, 2447); `Store.findIds` (2213, 2452); `Store.query` (2452) | REST |
| [packages/server/src/dataapi.ts:2161](../../packages/server/src/dataapi.ts#L2161) `DataApi/route/recordOut` | `Store.portalCounts` (2161) | REST |
| [packages/server/src/dataapi.ts:2197](../../packages/server/src/dataapi.ts#L2197) `DataApi/route/shownAs` | `Store.get` (2197) | REST |
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
| [packages/store/src/import.ts:233](../../packages/store/src/import.ts#L233) `applyFileAccountStatus` | `SQLite.get` (233, 235); `SQLite.prepare` (233, 235, 237, 249) | OPERATOR |
| [packages/store/src/import.ts:270](../../packages/store/src/import.ts#L270) `createStore` | `SQLite.prepare` (270, 281) | OPERATOR |
| [packages/store/src/import.ts:189](../../packages/store/src/import.ts#L189) `importDesigns` | `SQLite.all` (189); `SQLite.prepare` (189, 203, 206, 209, 211); `SQLite.get` (203, 206) | OPERATOR |
| [packages/store/src/import.ts:405](../../packages/store/src/import.ts#L405) `importFmp12` | `SQLite.prepare` (405, 415, 421, 427, 431, 446, 457, 532, 533); `SQLite.get` (421, 446); `SQLite.all` (427) | OPERATOR |
| [packages/store/src/import.ts:396](../../packages/store/src/import.ts#L396) `importFmp12/save` | `SQLite.prepare` (396) | OPERATOR |
| [packages/store/src/import.ts:139](../../packages/store/src/import.ts#L139) `moveAddedImages` | `SQLite.prepare` (139, 149, 165, 166); `SQLite.get` (142); `SQLite.all` (166) | OPERATOR |
| [packages/store/src/import.ts:293](../../packages/store/src/import.ts#L293) `needsDesigns` | `SQLite.get` (293); `SQLite.prepare` (293) | OPERATOR |
| [packages/store/src/import.ts:125](../../packages/store/src/import.ts#L125) `nextImageId` | `SQLite.get` (125); `SQLite.prepare` (125) | OPERATOR |
| [packages/store/src/import.ts:340](../../packages/store/src/import.ts#L340) `readState` | `SQLite.get` (340); `SQLite.prepare` (340) | OPERATOR |
| [packages/store/src/import.ts:104](../../packages/store/src/import.ts#L104) `writeDesign` | `SQLite.prepare` (104, 108) | OPERATOR |
| [packages/store/src/layout-speed.ts:56](../../packages/store/src/layout-speed.ts#L56) `layoutCost/recordCount` | `Store.recordCount` (56) | DESIGN |
| [packages/store/src/layout-speed.ts:419](../../packages/store/src/layout-speed.ts#L419) `speedContext` | `Store.recordCount` (419) | DESIGN |
| [packages/store/src/privileges.ts:549](../../packages/store/src/privileges.ts#L549) `ensurePrivilegeTables` | `SQLite.all` (549); `SQLite.prepare` (549) | AUTH |
| [packages/store/src/privileges.ts:521](../../packages/store/src/privileges.ts#L521) `privilegeSets` | `SQLite.all` (521); `SQLite.prepare` (521) | AUTH |
| [packages/store/src/reconvert.ts:188](../../packages/store/src/reconvert.ts#L188) `build` | `SQLite.get` (188); `SQLite.prepare` (188, 191, 196); `SQLite.all` (196) | OPERATOR |
| [packages/store/src/reconvert.ts:343](../../packages/store/src/reconvert.ts#L343) `carryImages` | `SQLite.all` (343, 345); `SQLite.prepare` (343, 345, 346) | OPERATOR |
| [packages/store/src/reconvert.ts:293](../../packages/store/src/reconvert.ts#L293) `carryRecords` | `SQLite.prepare` (293, 303, 304, 309, 310, 320, 326, 327); `SQLite.all` (303, 309, 313, 326) | OPERATOR |
| [packages/store/src/reconvert.ts:352](../../packages/store/src/reconvert.ts#L352) `carrySettings` | `SQLite.all` (352, 356, 364); `SQLite.prepare` (352, 356, 364, 365, 369); `SQLite.get` (369) | OPERATOR |
| [packages/store/src/reconvert.ts:99](../../packages/store/src/reconvert.ts#L99) `columns` | `SQLite.all` (99); `SQLite.prepare` (99) | OPERATOR |
| [packages/store/src/reconvert.ts:256](../../packages/store/src/reconvert.ts#L256) `copyContainer` | `SQLite.get` (256); `SQLite.prepare` (256, 258, 264) | OPERATOR |
| [packages/store/src/reconvert.ts:90](../../packages/store/src/reconvert.ts#L90) `meta` | `SQLite.get` (90); `SQLite.prepare` (90) | OPERATOR |
| [packages/store/src/reconvert.ts:236](../../packages/store/src/reconvert.ts#L236) `previewOf` | `SQLite.get` (236); `SQLite.prepare` (236) | OPERATOR |
| [packages/store/src/reconvert.ts:223](../../packages/store/src/reconvert.ts#L223) `previewOf/count` | `SQLite.get` (223); `SQLite.prepare` (223) | OPERATOR |
| [packages/store/src/reconvert.ts:112](../../packages/store/src/reconvert.ts#L112) `reconvertCheck` | `SQLite.get` (112); `SQLite.prepare` (112) | OPERATOR |
| [packages/store/src/reconvert.ts:95](../../packages/store/src/reconvert.ts#L95) `tableExists` | `SQLite.get` (95); `SQLite.prepare` (95) | OPERATOR |
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
| [packages/store/src/store.ts:5022](../../packages/store/src/store.ts#L5022) `Store/accountIdentityId` | `SQLite.get` (5022, 5028); `SQLite.prepare` (5022, 5027, 5028); `Store.sql` (5022, 5027, 5028) | CORE |
| [packages/store/src/store.ts:5016](../../packages/store/src/store.ts#L5016) `Store/accountIdentityIdIfSet` | `SQLite.get` (5016); `SQLite.prepare` (5016); `Store.sql` (5016) | CORE |
| [packages/store/src/store.ts:4978](../../packages/store/src/store.ts#L4978) `Store/accountInactive` | `SQLite.get` (4978); `SQLite.prepare` (4978); `Store.sql` (4978) | CORE |
| [packages/store/src/store.ts:5175](../../packages/store/src/store.ts#L5175) `Store/accountLocalOnly` | `SQLite.get` (5175); `SQLite.prepare` (5175); `Store.sql` (5175) | CORE |
| [packages/store/src/store.ts:6044](../../packages/store/src/store.ts#L6044) `Store/accountPrivilegeSet` | `SQLite.get` (6044); `SQLite.prepare` (6044); `Store.sql` (6044) | CORE |
| [packages/store/src/store.ts:5180](../../packages/store/src/store.ts#L5180) `Store/accountRequires2fa` | `SQLite.get` (5180); `SQLite.prepare` (5180); `Store.sql` (5180) | CORE |
| [packages/store/src/store.ts:5400](../../packages/store/src/store.ts#L5400) `Store/accountUsage` | `SQLite.get` (5400); `SQLite.prepare` (5400, 5401); `Store.sql` (5400, 5401); `SQLite.all` (5401); `Store.auditLog` (5417) | CORE |
| [packages/store/src/store.ts:3461](../../packages/store/src/store.ts#L3461) `Store/accounts` | `SQLite.all` (3461); `SQLite.prepare` (3461); `Store.sql` (3461) | CORE |
| [packages/store/src/store.ts:3457](../../packages/store/src/store.ts#L3457) `Store/accountsSharingLockout` | `SQLite.all` (3457); `SQLite.prepare` (3457); `Store.sql` (3457) | CORE |
| [packages/store/src/store.ts:8128](../../packages/store/src/store.ts#L8128) `Store/addContainer` | `SQLite.all` (8128); `SQLite.prepare` (8128, 8133, 8147, 8151, 8152); `Store.sql` (8128, 8133, 8147, 8149, 8151, 8152, 8154, 8157); `SQLite.get` (8138); `Store.containerRange` (8140) | CORE |
| [packages/store/src/store.ts:8174](../../packages/store/src/store.ts#L8174) `Store/addExternalContainer` | `SQLite.prepare` (8174); `Store.sql` (8174) | CORE |
| [packages/store/src/store.ts:8630](../../packages/store/src/store.ts#L8630) `Store/addFieldIndex` | `Store.sql` (8630) | CORE |
| [packages/store/src/store.ts:6834](../../packages/store/src/store.ts#L6834) `Store/addImage` | `Store.sql` (6834, 6835); `SQLite.prepare` (6835) | CORE |
| [packages/store/src/store.ts:6094](../../packages/store/src/store.ts#L6094) `Store/addProvisionedAccount` | `SQLite.get` (6094); `SQLite.prepare` (6094, 6098); `Store.sql` (6094, 6098) | CORE |
| [packages/store/src/store.ts:7253](../../packages/store/src/store.ts#L7253) `Store/addRelated` | `relatedRows` (7253); `rowsById` (7286); `firstRelatedEach` (7309) | CORE |
| [packages/store/src/store.ts:3479](../../packages/store/src/store.ts#L3479) `Store/agentNeedsApproval` | `SQLite.get` (3479); `SQLite.prepare` (3479); `Store.sql` (3479) | CORE |
| [packages/store/src/store.ts:6308](../../packages/store/src/store.ts#L6308) `Store/allowedIds` | `SQLite.iterate` (6308); `SQLite.prepare` (6308); `Store.sql` (6308) | CORE |
| [packages/store/src/store.ts:5457](../../packages/store/src/store.ts#L5457) `Store/apiToken` | `SQLite.get` (5457); `SQLite.prepare` (5457, 5475); `Store.sql` (5457, 5475) | CORE |
| [packages/store/src/store.ts:5433](../../packages/store/src/store.ts#L5433) `Store/apiTokens` | `SQLite.all` (5433); `SQLite.prepare` (5433); `Store.sql` (5433) | CORE |
| [packages/store/src/store.ts:2932](../../packages/store/src/store.ts#L2932) `Store/appendSecurityRow` | `Store.sql` (2932) | CORE |
| [packages/store/src/store.ts:3819](../../packages/store/src/store.ts#L3819) `Store/appendSecurityEvent` | `Store.sql` (3819) | CORE |
| [packages/store/src/store.ts:4824](../../packages/store/src/store.ts#L4824) `Store/applyAccountImport` | `Store.sql` (4824, 4832, 4861); `SQLite.get` (4832); `SQLite.prepare` (4832, 4861) | CORE |
| [packages/store/src/store.ts:2266](../../packages/store/src/store.ts#L2266) `Store/applyDesign` | `Store.sql` (2266, 2267, 2280, 2283, 2288, 2304, 2307, 2307); `SQLite.prepare` (2283, 2288) | CORE |
| [packages/store/src/store.ts:3675](../../packages/store/src/store.ts#L3675) `Store/approvePending` | `SQLite.get` (3675); `SQLite.prepare` (3675, 3686); `Store.sql` (3675, 3686) | CORE |
| [packages/store/src/store.ts:2727](../../packages/store/src/store.ts#L2727) `Store/audit` | `Store.sql` (2727) | CORE |
| [packages/store/src/store.ts:2368](../../packages/store/src/store.ts#L2368) `Store/auditLog` | `SQLite.all` (2368); `SQLite.prepare` (2368); `Store.sql` (2368) | CORE |
| [packages/store/src/store.ts:1874](../../packages/store/src/store.ts#L1874) `Store/backup` | `Store.sql` (1874) | CORE |
| [packages/store/src/store.ts:3485](../../packages/store/src/store.ts#L3485) `Store/blankPasswordAccounts` | `SQLite.all` (3485); `SQLite.prepare` (3485); `Store.sql` (3485) | CORE |
| [packages/store/src/store.ts:9211](../../packages/store/src/store.ts#L9211) `Store/canView` | `Store.canView` (9211); `Store.row` (9212) | GATED-STORE |
| [packages/store/src/store.ts:9193](../../packages/store/src/store.ts#L9193) `Store/canViewRecord` | `SQLite.get` (9193); `SQLite.prepare` (9193); `Store.sql` (9193) | GATED-STORE |
| [packages/store/src/store.ts:4753](../../packages/store/src/store.ts#L4753) `Store/canonicalAccount` | `SQLite.all` (4753); `SQLite.prepare` (4753); `Store.sql` (4753) | CORE |
| [packages/store/src/store.ts:10301](../../packages/store/src/store.ts#L10301) `Store/cascadeDelete` | `relatedRows` (10301) | CORE |
| [packages/store/src/store.ts:2093](../../packages/store/src/store.ts#L2093) `Store/changeOne` | `Store.sql` (2093, 2095) | CORE |
| [packages/store/src/store.ts:2096](../../packages/store/src/store.ts#L2096) `Store/changeOne/read` | `SQLite.get` (2096); `SQLite.prepare` (2096); `Store.sql` (2096) | CORE |
| [packages/store/src/store.ts:8509](../../packages/store/src/store.ts#L8509) `Store/checkContainerWrite` | `Store.row` (8509) | CORE |
| [packages/store/src/store.ts:9923](../../packages/store/src/store.ts#L9923) `Store/checkEditable` | `Store.row` (9923) | CORE |
| [packages/store/src/store.ts:1468](../../packages/store/src/store.ts#L1468) `Store/checkpoint` | `SQLite.get` (1468); `SQLite.prepare` (1468); `Store.sql` (1468) | CORE |
| [packages/store/src/store.ts:6080](../../packages/store/src/store.ts#L6080) `Store/clearAccountPrivilegeSet` | `SQLite.prepare` (6080); `Store.sql` (6080) | CORE |
| [packages/store/src/store.ts:1490](../../packages/store/src/store.ts#L1490) `Store/close` | `Store.sql` (1490) | CORE |
| [packages/store/src/store.ts:8477](../../packages/store/src/store.ts#L8477) `Store/compactFile` | `Store.sql` (8477, 8478, 8480) | CORE |
| [packages/store/src/store.ts:10425](../../packages/store/src/store.ts#L10425) `Store/computeValuesCurrent` | `Store.computeValues` (10425); `Store.sql` (10431, 10435); `SQLite.all` (10435); `SQLite.prepare` (10435) | GATED-STORE |
| [packages/store/src/store.ts:8862](../../packages/store/src/store.ts#L8862) `Store/computedRows` | `Store.sql` (8862, 8865, 8866, 8867, 8869, 8879, 8880, 8881, 8884); `SQLite.prepare` (8865, 8867, 8869, 8879); `SQLite.iterate` (8869); `Calculations.globalValue` (8872); `Calculations.unstoredValue` (8873); `Calculations.related` (8876); `SQLite.all` (8879) | CORE |
| [packages/store/src/store.ts:5502](../../packages/store/src/store.ts#L5502) `Store/confirmTotp` | `SQLite.get` (5502); `SQLite.prepare` (5502, 5504); `Store.sql` (5502, 5504) | CORE |
| [packages/store/src/store.ts:1136](../../packages/store/src/store.ts#L1136) `Store/constructor` | `Store.sql` (1136, 1138, 1140, 1141, 1145, 1149, 1150, 1161, 1166, 1171, 1172, 1176, 1177, 1178, 1185, 1189, 1193, 1194, 1195, 1200, 1204, 1207, 1208, 1210, 1211, 1214, 1215, 1219, 1220, 1224, 1225, 1228, 1230, 1233, 1234, 1238, 1239, 1243, 1244, 1247, 1248, 1249, 1252, 1253, 1256, 1257, 1259, 1259, 1260, 1260, 1261, 1264, 1268, 1270, 1273, 1274, 1275, 1278, 1279, 1281, 1283, 1284, 1288, 1289, 1291, 1303, 1305, 1306, 1307, 1307, 1311, 1312); `SQLite.get` (1140); `SQLite.prepare` (1140, 1207, 1208, 1211, 1214, 1219, 1224, 1233, 1238, 1243, 1252, 1256, 1259, 1260, 1278, 1283, 1288); `SQLite.all` (1207, 1214, 1219, 1224, 1233, 1238, 1243, 1252, 1256, 1259, 1260, 1278, 1283, 1288) | CORE |
| [packages/store/src/store.ts:5860](../../packages/store/src/store.ts#L5860) `Store/consumeRecoveryCode` | `SQLite.prepare` (5860); `Store.sql` (5860) | CORE |
| [packages/store/src/store.ts:8052](../../packages/store/src/store.ts#L8052) `Store/container` | `SQLite.get` (8052); `SQLite.prepare` (8052, 8061); `Store.sql` (8052, 8061); `SQLite.all` (8061) | CORE |
| [packages/store/src/store.ts:8486](../../packages/store/src/store.ts#L8486) `Store/containerId` | `Store.containerId` (8486); `Store.row` (8487) | CORE |
| [packages/store/src/store.ts:8069](../../packages/store/src/store.ts#L8069) `Store/containerInfo` | `SQLite.get` (8069); `SQLite.prepare` (8069); `Store.sql` (8069) | CORE |
| [packages/store/src/store.ts:8033](../../packages/store/src/store.ts#L8033) `Store/containerIntact` | `SQLite.get` (8033); `SQLite.prepare` (8033); `Store.sql` (8033) | CORE |
| [packages/store/src/store.ts:7972](../../packages/store/src/store.ts#L7972) `Store/containerIntegrityReport` | `SQLite.all` (7972); `SQLite.prepare` (7972, 7983); `Store.sql` (7972, 7983); `SQLite.get` (7983) | CORE |
| [packages/store/src/store.ts:8047](../../packages/store/src/store.ts#L8047) `Store/containerMeta` | `SQLite.get` (8047); `SQLite.prepare` (8047); `Store.sql` (8047) | CORE |
| [packages/store/src/store.ts:8103](../../packages/store/src/store.ts#L8103) `Store/containerRange` | `SQLite.all` (8103); `SQLite.prepare` (8103, 8110); `Store.sql` (8103, 8110); `SQLite.get` (8110) | CORE |
| [packages/store/src/store.ts:7874](../../packages/store/src/store.ts#L7874) `Store/containerReferences` | `SQLite.all` (7874, 7893, 7895, 7901, 7914, 7925, 7939); `SQLite.prepare` (7874, 7893, 7895, 7901, 7914, 7925, 7937, 7939); `Store.sql` (7874, 7893, 7895, 7901, 7914, 7925, 7937, 7939); `SQLite.get` (7937); `Store.row` (7948) | CORE |
| [packages/store/src/store.ts:10405](../../packages/store/src/store.ts#L10405) `Store/countIds` | `Store.countIds` (10405); `SQLite.get` (10409); `SQLite.prepare` (10409); `Store.sql` (10409) | GATED-STORE |
| [packages/store/src/store.ts:9236](../../packages/store/src/store.ts#L9236) `Store/create` | `SQLite.get` (9236, 9242); `SQLite.prepare` (9236, 9242, 9255); `Store.sql` (9236, 9242, 9255) | CORE |
| [packages/store/src/store.ts:3791](../../packages/store/src/store.ts#L3791) `Store/createAccount` | `SQLite.get` (3791); `SQLite.prepare` (3791, 3795, 3801, 3806, 3811); `Store.sql` (3791, 3795, 3801, 3806, 3811) | CORE |
| [packages/store/src/store.ts:5233](../../packages/store/src/store.ts#L5233) `Store/createApiToken` | `SQLite.get` (5233, 5261); `SQLite.prepare` (5233, 5260, 5261, 5271); `Store.sql` (5233, 5260, 5261, 5271) | CORE |
| [packages/store/src/store.ts:4765](../../packages/store/src/store.ts#L4765) `Store/createLocalAccount` | `SQLite.prepare` (4765); `Store.sql` (4765) | CORE |
| [packages/store/src/store.ts:3451](../../packages/store/src/store.ts#L3451) `Store/credentialIdentity` | `SQLite.get` (3451); `SQLite.prepare` (3451); `Store.sql` (3451) | CORE |
| [packages/store/src/store.ts:5154](../../packages/store/src/store.ts#L5154) `Store/credentialStamp` | `SQLite.get` (5154); `SQLite.prepare` (5154); `Store.sql` (5154) | CORE |
| [packages/store/src/store.ts:1964](../../packages/store/src/store.ts#L1964) `Store/dataVersion` | `SQLite.get` (1964); `SQLite.prepare` (1964); `Store.sql` (1964) | CORE |
| [packages/store/src/store.ts:9966](../../packages/store/src/store.ts#L9966) `Store/delete` | `Store.row` (9966) | CORE |
| [packages/store/src/store.ts:9974](../../packages/store/src/store.ts#L9974) `Store/delete/run` | `SQLite.get` (9974); `SQLite.prepare` (9974, 9979); `Store.sql` (9974, 9979) | CORE |
| [packages/store/src/store.ts:4919](../../packages/store/src/store.ts#L4919) `Store/deleteAccount` | `SQLite.prepare` (4919, 4923, 4924, 4925, 4926, 4927, 4928, 4929, 4930, 4937, 4939, 4941, 4943, 4947); `Store.sql` (4919, 4923, 4924, 4925, 4926, 4927, 4928, 4929, 4930, 4937, 4939, 4941, 4943, 4947) | CORE |
| [packages/store/src/store.ts:10048](../../packages/store/src/store.ts#L10048) `Store/deleteBeingUndone` | `SQLite.all` (10048); `SQLite.prepare` (10048); `Store.sql` (10048) | CORE |
| [packages/store/src/store.ts:10060](../../packages/store/src/store.ts#L10060) `Store/deleteEndingTheLifeAt` | `SQLite.get` (10060); `SQLite.prepare` (10060); `Store.sql` (10060) | CORE |
| [packages/store/src/store.ts:5945](../../packages/store/src/store.ts#L5945) `Store/deletePrivilegeSet` | `SQLite.prepare` (5945); `Store.sql` (5945) | CORE |
| [packages/store/src/store.ts:3929](../../packages/store/src/store.ts#L3929) `Store/deleteScriptTest` | `SQLite.prepare` (3929); `Store.sql` (3929) | CORE |
| [packages/store/src/store.ts:3096](../../packages/store/src/store.ts#L3096) `Store/deletedRows` | `SQLite.get` (3096); `SQLite.prepare` (3096, 3098, 3098); `Store.sql` (3096, 3098, 3098); `SQLite.all` (3098, 3098) | CORE |
| [packages/store/src/store.ts:3206](../../packages/store/src/store.ts#L3206) `Store/designEffect` | `Store.sql` (3206, 3211, 3216, 3221, 3224, 3230, 3241, 3242, 3244, 3257, 3258, 3261, 3263, 3269, 3270, 3271, 3276, 3278, 3282, 3285, 3286, 3288, 3291, 3297, 3299, 3306, 3307, 3309, 3310, 3311, 3312, 3319, 3320, 3322, 3322, 3324, 3325, 3326, 3330, 3334, 3336, 3374, 3376, 3378); `SQLite.get` (3241, 3257, 3269, 3270, 3282, 3286, 3322, 3330); `SQLite.prepare` (3241, 3242, 3257, 3258, 3269, 3270, 3276, 3278, 3282, 3286, 3297, 3299, 3312, 3319, 3320, 3322, 3324, 3326, 3330, 3334); `SQLite.all` (3319, 3320); `SQLite.iterate` (3324) | CORE |
| [packages/store/src/store.ts:3199](../../packages/store/src/store.ts#L3199) `Store/designEffect/renameExcluded` | `SQLite.prepare` (3199); `Store.sql` (3199) | CORE |
| [packages/store/src/store.ts:3183](../../packages/store/src/store.ts#L3183) `Store/designEffect/renameKey` | `SQLite.prepare` (3183); `Store.sql` (3183) | CORE |
| [packages/store/src/store.ts:3137](../../packages/store/src/store.ts#L3137) `Store/designHistory` | `SQLite.all` (3137); `SQLite.prepare` (3137); `Store.sql` (3137) | CORE |
| [packages/store/src/store.ts:5523](../../packages/store/src/store.ts#L5523) `Store/disableTotp` | `SQLite.prepare` (5523); `Store.sql` (5523) | CORE |
| [packages/store/src/store.ts:3386](../../packages/store/src/store.ts#L3386) `Store/dropColumnIndexes` | `SQLite.all` (3386, 3388); `SQLite.prepare` (3386, 3388); `Store.sql` (3386, 3388, 3389) | CORE |
| [packages/store/src/store.ts:8642](../../packages/store/src/store.ts#L8642) `Store/dropFieldIndex` | `SQLite.get` (8642); `SQLite.prepare` (8642); `Store.sql` (8642, 8643) | CORE |
| [packages/store/src/store.ts:9279](../../packages/store/src/store.ts#L9279) `Store/duplicate` | `Store.row` (9279); `SQLite.get` (9283); `SQLite.prepare` (9283, 9298); `Store.sql` (9283, 9298) | CORE |
| [packages/store/src/store.ts:8290](../../packages/store/src/store.ts#L8290) `Store/embeddedContainerCount` | `SQLite.prepare` (8290); `Store.sql` (8290); `SQLite.get` (8291) | CORE |
| [packages/store/src/store.ts:8276](../../packages/store/src/store.ts#L8276) `Store/embeddedContainers` | `SQLite.prepare` (8276, 8277); `Store.sql` (8276, 8277); `SQLite.all` (8277); `SQLite.get` (8281) | CORE |
| [packages/store/src/store.ts:3122](../../packages/store/src/store.ts#L3122) `Store/emptyDeleted` | `Store.sql` (3122, 3125, 3126, 3128, 3130); `SQLite.prepare` (3126) | CORE |
| [packages/store/src/store.ts:1840](../../packages/store/src/store.ts#L1840) `Store/endTransaction` | `Store.sql` (1840, 1843, 1843) | CORE |
| [packages/store/src/store.ts:5491](../../packages/store/src/store.ts#L5491) `Store/enrollTotp` | `SQLite.prepare` (5491); `Store.sql` (5491) | CORE |
| [packages/store/src/store.ts:3091](../../packages/store/src/store.ts#L3091) `Store/ensureDeleted` | `Store.sql` (3091) | CORE |
| [packages/store/src/store.ts:1322](../../packages/store/src/store.ts#L1322) `Store/ensureNativeIds` | `SQLite.all` (1322, 1334); `SQLite.prepare` (1322, 1325, 1333, 1334); `Store.sql` (1322, 1325, 1328, 1332, 1333, 1334, 1337, 1339) | CORE |
| [packages/store/src/store.ts:9620](../../packages/store/src/store.ts#L9620) `Store/evaluateCurrent` | `Store.row` (9620, 9620, 9621, 9621); `Calculations.context` (9626); `Store.get` (9627, 9629) | GATED-STORE |
| [packages/store/src/store.ts:9661](../../packages/store/src/store.ts#L9661) `Store/evaluateEachCurrent` | `Store.row` (9661, 9661, 9666); `Calculations.context` (9667); `Store.get` (9669) | GATED-STORE |
| [packages/store/src/store.ts:9723](../../packages/store/src/store.ts#L9723) `Store/evaluateRowsCurrent` | `Store.row` (9723, 9723, 9724, 9724) | GATED-STORE |
| [packages/store/src/store.ts:9702](../../packages/store/src/store.ts#L9702) `Store/evaluateRowsCurrent/each` | `Calculations.context` (9702); `Store.get` (9704) | GATED-STORE |
| [packages/store/src/store.ts:9738](../../packages/store/src/store.ts#L9738) `Store/evaluateRowsCurrent/found/[Symbol.iterator]` | `rowsById` (9738) | GATED-STORE |
| [packages/store/src/store.ts:9760](../../packages/store/src/store.ts#L9760) `Store/evaluateRowsCurrent/key` | `Calculations.context` (9760) | GATED-STORE |
| [packages/store/src/store.ts:3718](../../packages/store/src/store.ts#L3718) `Store/externalAccount` | `SQLite.all` (3718); `SQLite.prepare` (3718); `Store.sql` (3718) | CORE |
| [packages/store/src/store.ts:7795](../../packages/store/src/store.ts#L7795) `Store/externalContainerCheck` | `SQLite.all` (7795); `SQLite.prepare` (7795); `Store.sql` (7795) | CORE |
| [packages/store/src/store.ts:7802](../../packages/store/src/store.ts#L7802) `Store/externalContainerCount` | `SQLite.get` (7802); `SQLite.prepare` (7802); `Store.sql` (7802) | CORE |
| [packages/store/src/store.ts:7811](../../packages/store/src/store.ts#L7811) `Store/externalContainerReport` | `SQLite.all` (7811, 7824); `SQLite.prepare` (7811, 7824); `Store.sql` (7811, 7824) | CORE |
| [packages/store/src/store.ts:5004](../../packages/store/src/store.ts#L5004) `Store/externalIdentityId` | `SQLite.get` (5004, 5011); `SQLite.prepare` (5004, 5010, 5011); `Store.sql` (5004, 5010, 5011) | CORE |
| [packages/store/src/store.ts:8043](../../packages/store/src/store.ts#L8043) `Store/externalOf` | `SQLite.get` (8043); `SQLite.prepare` (8043); `Store.sql` (8043) | CORE |
| [packages/store/src/store.ts:2876](../../packages/store/src/store.ts#L2876) `Store/failureAuditRoom` | `SQLite.get` (2876); `SQLite.prepare` (2876); `Store.sql` (2876) | CORE |
| [packages/store/src/store.ts:7455](../../packages/store/src/store.ts#L7455) `Store/fieldIndexCurrent` | `SQLite.iterate` (7455); `SQLite.prepare` (7455, 7460); `Store.sql` (7455, 7460); `SQLite.all` (7460) | GATED-STORE |
| [packages/store/src/store.ts:8677](../../packages/store/src/store.ts#L8677) `Store/find` | `Store.find` (8677) | GATED-STORE |
| [packages/store/src/store.ts:9049](../../packages/store/src/store.ts#L9049) `Store/findCandidates` | `Store.query` (9049) | CORE |
| [packages/store/src/store.ts:8688](../../packages/store/src/store.ts#L8688) `Store/findHere` | `Store.query` (8688, 8693, 8695, 8709, 8711, 8722); `Store.recordCount` (8706); `SQLite.get` (8707, 8711); `SQLite.prepare` (8707, 8711, 8717, 8724, 8733); `Store.sql` (8707, 8711, 8717, 8724, 8733); `SQLite.all` (8717, 8724, 8733) | GATED-STORE |
| [packages/store/src/store.ts:8728](../../packages/store/src/store.ts#L8728) `Store/findHere/[Symbol.iterator]` | `SQLite.iterate` (8728); `SQLite.prepare` (8728); `Store.sql` (8728) | GATED-STORE |
| [packages/store/src/store.ts:10450](../../packages/store/src/store.ts#L10450) `Store/findIdsCurrent` | `Store.findIds` (10450) | GATED-STORE |
| [packages/store/src/store.ts:10456](../../packages/store/src/store.ts#L10456) `Store/findIdsHere` | `Store.query` (10456, 10461, 10463); `SQLite.iterate` (10474); `SQLite.prepare` (10474); `Store.sql` (10474) | GATED-STORE |
| [packages/store/src/store.ts:8993](../../packages/store/src/store.ts#L8993) `Store/findSource` | `Store.query` (8993); `SQLite.all` (9002, 9019); `SQLite.prepare` (9002, 9010, 9018); `Store.sql` (9002, 9007, 9010, 9015, 9018, 9032, 9034); `Calculations.globalValue` (9024); `Calculations.unstoredValue` (9025); `Calculations.related` (9029) | CORE |
| [packages/store/src/store.ts:2988](../../packages/store/src/store.ts#L2988) `Store/flushDeferredSecurity` | `Store.sql` (2988) | CORE |
| [packages/store/src/store.ts:10015](../../packages/store/src/store.ts#L10015) `Store/forgetStandInValues` | `Store.sql` (10015, 10036); `SQLite.prepare` (10036) | CORE |
| [packages/store/src/store.ts:4886](../../packages/store/src/store.ts#L4886) `Store/forgetStandIns` | `SQLite.prepare` (4886); `Store.sql` (4886) | CORE |
| [packages/store/src/store.ts:7337](../../packages/store/src/store.ts#L7337) `Store/foundSetPage` | `rowsById` (7337) | CORE |
| [packages/store/src/store.ts:7353](../../packages/store/src/store.ts#L7353) `Store/foundSetRowsCurrent` | `Store.viewableIds` (7353); `Store.row` (7369) | GATED-STORE |
| [packages/store/src/store.ts:3637](../../packages/store/src/store.ts#L3637) `Store/gateAgentWrite` | `SQLite.get` (3637); `SQLite.prepare` (3637, 3639); `Store.sql` (3637, 3639) | CORE |
| [packages/store/src/store.ts:5798](../../packages/store/src/store.ts#L5798) `Store/generateRecoveryCodes` | `SQLite.prepare` (5798, 5801); `Store.sql` (5798, 5801) | CORE |
| [packages/store/src/store.ts:9121](../../packages/store/src/store.ts#L9121) `Store/getCurrent` | `Store.get` (9121); `Store.row` (9122, 9122, 9136); `SQLite.all` (9139); `SQLite.prepare` (9139); `Store.sql` (9139) | GATED-STORE |
| [packages/store/src/store.ts:9159](../../packages/store/src/store.ts#L9159) `Store/getManyCurrent` | `Store.getMany` (9159); `SQLite.get` (9177); `SQLite.prepare` (9177); `Store.sql` (9177) | GATED-STORE |
| [packages/store/src/store.ts:9170](../../packages/store/src/store.ts#L9170) `Store/getManyCurrent/[Symbol.iterator]` | `rowsById` (9170) | GATED-STORE |
| [packages/store/src/store.ts:1369](../../packages/store/src/store.ts#L1369) `Store/grantFullAccessClients` | `SQLite.prepare` (1369); `Store.sql` (1369) | CORE |
| [packages/store/src/store.ts:10491](../../packages/store/src/store.ts#L10491) `Store/groupSummariesCurrent` | `Store.groupSummaries` (10491); `Store.viewableIds` (10496); `Calculations.collect` (10512); `rowsById` (10512, 10562); `Calculations.collector` (10534) | GATED-STORE |
| [packages/store/src/store.ts:10560](../../packages/store/src/store.ts#L10560) `Store/groupSummariesCurrent/flush` | `Calculations.collector` (10560) | GATED-STORE |
| [packages/store/src/store.ts:10524](../../packages/store/src/store.ts#L10524) `Store/groupSummariesCurrent/key` | `Calculations.value` (10524); `Calculations.related` (10526) | GATED-STORE |
| [packages/store/src/store.ts:1396](../../packages/store/src/store.ts#L1396) `Store/hasOwnPassword` | `SQLite.get` (1396); `SQLite.prepare` (1396); `Store.sql` (1396) | CORE |
| [packages/store/src/store.ts:5653](../../packages/store/src/store.ts#L5653) `Store/hasPasskey` | `SQLite.get` (5653); `SQLite.prepare` (5653); `Store.sql` (5653) | CORE |
| [packages/store/src/store.ts:1377](../../packages/store/src/store.ts#L1377) `Store/hasProvingPassword` | `SQLite.get` (1377); `SQLite.prepare` (1377); `Store.sql` (1377) | CORE |
| [packages/store/src/store.ts:8596](../../packages/store/src/store.ts#L8596) `Store/hasTable` | `SQLite.get` (8596); `SQLite.prepare` (8596); `Store.sql` (8596) | CORE |
| [packages/store/src/store.ts:5512](../../packages/store/src/store.ts#L5512) `Store/hasTotp` | `SQLite.get` (5512); `SQLite.prepare` (5512); `Store.sql` (5512) | CORE |
| [packages/store/src/store.ts:4983](../../packages/store/src/store.ts#L4983) `Store/identityAllowed` | `SQLite.get` (4983, 4989, 4995); `SQLite.prepare` (4983, 4989, 4995); `Store.sql` (4983, 4989, 4995) | CORE |
| [packages/store/src/store.ts:6811](../../packages/store/src/store.ts#L6811) `Store/image` | `SQLite.get` (6811); `SQLite.prepare` (6811); `Store.sql` (6811) | CORE |
| [packages/store/src/store.ts:6821](../../packages/store/src/store.ts#L6821) `Store/images` | `SQLite.all` (6821); `SQLite.prepare` (6821); `Store.sql` (6821) | CORE |
| [packages/store/src/store.ts:4730](../../packages/store/src/store.ts#L4730) `Store/importAccounts` | `SQLite.all` (4730); `SQLite.prepare` (4730); `Store.sql` (4730) | CORE |
| [packages/store/src/store.ts:1697](../../packages/store/src/store.ts#L1697) `Store/independentWindowWrite` | `SQLite.get` (1697); `SQLite.prepare` (1697, 1731); `Store.sql` (1697, 1706, 1726, 1731, 1734) | CORE |
| [packages/store/src/store.ts:8608](../../packages/store/src/store.ts#L8608) `Store/indexedFields` | `SQLite.all` (8608, 8609); `SQLite.prepare` (8608, 8609); `Store.sql` (8608, 8609) | CORE |
| [packages/store/src/store.ts:10858](../../packages/store/src/store.ts#L10858) `Store/internalRoots` | `SQLite.get` (10858); `SQLite.prepare` (10858, 10860); `SQLite.all` (10860) | CORE |
| [packages/store/src/store.ts:3473](../../packages/store/src/store.ts#L3473) `Store/isAgent` | `SQLite.get` (3473); `SQLite.prepare` (3473); `Store.sql` (3473) | CORE |
| [packages/store/src/store.ts:3576](../../packages/store/src/store.ts#L3576) `Store/isExternal` | `SQLite.get` (3576); `SQLite.prepare` (3576); `Store.sql` (3576) | CORE |
| [packages/store/src/store.ts:5567](../../packages/store/src/store.ts#L5567) `Store/issueWebauthnChallenge` | `SQLite.prepare` (5567, 5569, 5570, 5572); `Store.sql` (5567, 5569, 5570, 5572); `SQLite.get` (5569) | CORE |
| [packages/store/src/store.ts:10765](../../packages/store/src/store.ts#L10765) `Store/iterateCommitted` | `SQLite.iterate` (10765) | CORE |
| [packages/store/src/store.ts:1639](../../packages/store/src/store.ts#L1639) `Store/joinTransaction` | `Store.sql` (1639, 1640, 1642, 1644, 1650, 1652) | CORE |
| [packages/store/src/store.ts:10248](../../packages/store/src/store.ts#L10248) `Store/keyStepWork` | `Store.sql` (10248, 10254, 10258, 10260) | CORE |
| [packages/store/src/store.ts:6678](../../packages/store/src/store.ts#L6678) `Store/knownSharedAccount` | `SQLite.get` (6678); `SQLite.prepare` (6678); `Store.sql` (6678) | CORE |
| [packages/store/src/store.ts:4203](../../packages/store/src/store.ts#L4203) `Store/lastSignIns` | `Store.auditLog` (4203) | CORE |
| [packages/store/src/store.ts:10066](../../packages/store/src/store.ts#L10066) `Store/latestDeleteSeq` | `SQLite.get` (10066); `SQLite.prepare` (10066); `Store.sql` (10066) | CORE |
| [packages/store/src/store.ts:6851](../../packages/store/src/store.ts#L6851) `Store/layout` | `SQLite.get` (6851); `SQLite.prepare` (6851); `Store.sql` (6851) | CORE |
| [packages/store/src/store.ts:3154](../../packages/store/src/store.ts#L3154) `Store/layoutHistory` | `SQLite.all` (3154); `SQLite.prepare` (3154); `Store.sql` (3154) | CORE |
| [packages/store/src/store.ts:6741](../../packages/store/src/store.ts#L6741) `Store/layouts` | `SQLite.all` (6741); `SQLite.prepare` (6741); `Store.sql` (6741) | CORE |
| [packages/store/src/store.ts:4503](../../packages/store/src/store.ts#L4503) `Store/leastPrivilege` | `SQLite.all` (4503); `SQLite.prepare` (4503); `Store.sql` (4503) | CORE |
| [packages/store/src/store.ts:5081](../../packages/store/src/store.ts#L5081) `Store/ledgerRow` | `SQLite.get` (5081, 5082); `SQLite.prepare` (5081, 5082); `Store.sql` (5081, 5082) | AUTH |
| [packages/store/src/store.ts:5093](../../packages/store/src/store.ts#L5093) `Store/ledgerWrite` | `Store.sql` (5093, 5094, 5096, 5098, 5101, 5101) | AUTH |
| [packages/store/src/store.ts:4813](../../packages/store/src/store.ts#L4813) `Store/limitAccountImport` | `SQLite.prepare` (4813, 4814, 4817); `Store.sql` (4813, 4814, 4817); `SQLite.get` (4814) | CORE |
| [packages/store/src/store.ts:3426](../../packages/store/src/store.ts#L3426) `Store/linkIdentity` | `SQLite.get` (3426); `SQLite.prepare` (3426); `Store.sql` (3426) | CORE |
| [packages/store/src/store.ts:3418](../../packages/store/src/store.ts#L3418) `Store/linkPrincipal` | `SQLite.get` (3418); `SQLite.prepare` (3418); `Store.sql` (3418) | CORE |
| [packages/store/src/store.ts:4089](../../packages/store/src/store.ts#L4089) `Store/markPiiField` | `SQLite.prepare` (4089); `Store.sql` (4089) | CORE |
| [packages/store/src/store.ts:7768](../../packages/store/src/store.ts#L7768) `Store/markRepeating` | `SQLite.prepare` (7768); `Store.sql` (7768) | CORE |
| [packages/store/src/store.ts:10698](../../packages/store/src/store.ts#L10698) `Store/matchIds` | `Store.matchIds` (10698); `SQLite.all` (10704); `SQLite.prepare` (10704); `Store.sql` (10704) | CORE |
| [packages/store/src/store.ts:1411](../../packages/store/src/store.ts#L1411) `Store/meta` | `SQLite.get` (1411); `SQLite.prepare` (1411); `Store.sql` (1411) | CORE |
| [packages/store/src/store.ts:991](../../packages/store/src/store.ts#L991) `Store/metadataVersions` | `SQLite.get` (991); `SQLite.prepare` (991); `Store.sql` (991) | CORE |
| [packages/store/src/store.ts:8405](../../packages/store/src/store.ts#L8405) `Store/moveContainersIn` | `Store.sql` (8405, 8411, 8413, 8414, 8415, 8416, 8436, 8441, 8441, 8452, 8455, 8458, 8465); `SQLite.prepare` (8413, 8414, 8415, 8416, 8452, 8458); `SQLite.get` (8418, 8452, 8458) | CORE |
| [packages/store/src/store.ts:8327](../../packages/store/src/store.ts#L8327) `Store/moveContainersOut` | `Store.sql` (8327, 8335, 8337, 8339, 8344, 8345, 8365, 8371, 8373, 8375, 8375, 8381, 8381, 8386, 8388, 8390, 8390, 8396); `SQLite.get` (8335); `SQLite.prepare` (8335, 8344, 8345); `Store.container` (8347) | CORE |
| [packages/store/src/store.ts:4684](../../packages/store/src/store.ts#L4684) `Store/mustChangePassword` | `SQLite.get` (4684); `SQLite.prepare` (4684); `Store.sql` (4684) | CORE |
| [packages/store/src/store.ts:1347](../../packages/store/src/store.ts#L1347) `Store/nativeIdGuards` | `Store.sql` (1347, 1348, 1350) | CORE |
| [packages/store/src/store.ts:5387](../../packages/store/src/store.ts#L5387) `Store/objectUseSince` | `SQLite.get` (5387); `SQLite.prepare` (5387); `Store.sql` (5387) | CORE |
| [packages/store/src/store.ts:8568](../../packages/store/src/store.ts#L8568) `Store/orderBy` | `Store.valueListItems` (8568) | CORE |
| [packages/store/src/store.ts:7960](../../packages/store/src/store.ts#L7960) `Store/orphanContainerReport` | `SQLite.all` (7960); `SQLite.prepare` (7960); `Store.sql` (7960) | CORE |
| [packages/store/src/store.ts:5619](../../packages/store/src/store.ts#L5619) `Store/passkeyAllowList` | `SQLite.all` (5619); `SQLite.prepare` (5619); `Store.sql` (5619) | CORE |
| [packages/store/src/store.ts:5658](../../packages/store/src/store.ts#L5658) `Store/passkeyIds` | `SQLite.all` (5658); `SQLite.prepare` (5658); `Store.sql` (5658) | CORE |
| [packages/store/src/store.ts:5646](../../packages/store/src/store.ts#L5646) `Store/passkeys` | `SQLite.all` (5646); `SQLite.prepare` (5646); `Store.sql` (5646) | CORE |
| [packages/store/src/store.ts:4723](../../packages/store/src/store.ts#L4723) `Store/passwordDaysRemaining` | `SQLite.get` (4723); `SQLite.prepare` (4723); `Store.sql` (4723) | CORE |
| [packages/store/src/store.ts:3661](../../packages/store/src/store.ts#L3661) `Store/pendingChanges` | `SQLite.all` (3661); `SQLite.prepare` (3661); `Store.sql` (3661) | CORE |
| [packages/store/src/store.ts:1429](../../packages/store/src/store.ts#L1429) `Store/persistentData` | `SQLite.get` (1429) | CORE |
| [packages/store/src/store.ts:1438](../../packages/store/src/store.ts#L1438) `Store/persistentDataIds` | `SQLite.all` (1438) | CORE |
| [packages/store/src/store.ts:1419](../../packages/store/src/store.ts#L1419) `Store/persistentTable` | `Store.sql` (1419) | CORE |
| [packages/store/src/store.ts:9908](../../packages/store/src/store.ts#L9908) `Store/portalContainerTarget` | `Store.row` (9908); `relatedIdList` (9910) | CORE |
| [packages/store/src/store.ts:7392](../../packages/store/src/store.ts#L7392) `Store/portalCountsCurrent` | `Store.canView` (7392); `Store.row` (7419) | GATED-STORE |
| [packages/store/src/store.ts:7630](../../packages/store/src/store.ts#L7630) `Store/portalRows` | `relatedRows` (7630); `relatedIdList` (7631); `Store.viewableIds` (7634); `rowsById` (7659, 7697); `Calculations.related` (7673) | CORE |
| [packages/store/src/store.ts:7641](../../packages/store/src/store.ts#L7641) `Store/portalRows/context` | `Calculations.context` (7641) | CORE |
| [packages/store/src/store.ts:7651](../../packages/store/src/store.ts#L7651) `Store/portalRows/valueOf` | `Calculations.value` (7651) | CORE |
| [packages/store/src/store.ts:2434](../../packages/store/src/store.ts#L2434) `Store/prepared` | `SQLite.prepare` (2434); `Store.sql` (2434) | CORE |
| [packages/store/src/store.ts:4795](../../packages/store/src/store.ts#L4795) `Store/previewAccountImport` | `Store.sql` (4795, 4796, 4805) | CORE |
| [packages/store/src/store.ts:6441](../../packages/store/src/store.ts#L6441) `Store/previewRecordRuleCurrent` | `SQLite.get` (6441); `SQLite.prepare` (6441, 6444); `Store.sql` (6441, 6444); `SQLite.all` (6444); `Calculations.context` (6450, 6466) | CORE |
| [packages/store/src/store.ts:9084](../../packages/store/src/store.ts#L9084) `Store/previewRow` | `Store.row` (9084) | CORE |
| [packages/store/src/store.ts:5873](../../packages/store/src/store.ts#L5873) `Store/privilegeSets` | `Store.sql` (5873) | CORE |
| [packages/store/src/store.ts:2645](../../packages/store/src/store.ts#L2645) `Store/pruneAudit` | `Store.sql` (2645, 2647, 2649); `SQLite.get` (2647); `SQLite.prepare` (2647) | CORE |
| [packages/store/src/store.ts:7995](../../packages/store/src/store.ts#L7995) `Store/purgeOrphanContainers` | `Store.sql` (7995, 7999, 8008, 8011, 8012, 8017, 8018, 8020, 8020); `Store.orphanContainerReport` (8003); `SQLite.get` (8008); `SQLite.prepare` (8008, 8011, 8012) | CORE |
| [packages/store/src/store.ts:10964](../../packages/store/src/store.ts#L10964) `Store/query` | `SQLite.iterate` (10964) | CORE |
| [packages/store/src/store.ts:11003](../../packages/store/src/store.ts#L11003) `Store/queryWithOriginsCurrent` | `SQLite.iterate` (11003); `SQLite.all` (11012, 11015); `SQLite.prepare` (11012, 11015) | CORE |
| [packages/store/src/store.ts:10799](../../packages/store/src/store.ts#L10799) `Store/readOnlyChecked` | `SQLite.prepare` (10799, 10803, 10812, 10817); `SQLite.all` (10803, 10812, 10817) | CORE |
| [packages/store/src/store.ts:3398](../../packages/store/src/store.ts#L3398) `Store/recompute` | `SQLite.prepare` (3398, 3402); `Store.sql` (3398, 3402); `SQLite.iterate` (3402); `Calculations.computeStoredStyled` (3403); `Calculations.value` (3403) | CORE |
| [packages/store/src/store.ts:2449](../../packages/store/src/store.ts#L2449) `Store/recordAsOf` | `SQLite.get` (2449, 2451); `SQLite.prepare` (2449, 2451, 2453, 2454); `Store.sql` (2449, 2451, 2453, 2454); `SQLite.all` (2453, 2454) | CORE |
| [packages/store/src/store.ts:2147](../../packages/store/src/store.ts#L2147) `Store/recordCount` | `SQLite.get` (2147); `SQLite.prepare` (2147); `Store.sql` (2147) | CORE |
| [packages/store/src/store.ts:5318](../../packages/store/src/store.ts#L5318) `Store/recordObjectUse` | `Store.sql` (5318) | CORE |
| [packages/store/src/store.ts:9610](../../packages/store/src/store.ts#L9610) `Store/recordViewable` | `Store.row` (9610) | GATED-STORE |
| [packages/store/src/store.ts:1476](../../packages/store/src/store.ts#L1476) `Store/recordedFormat` | `Store.sql` (1476) | CORE |
| [packages/store/src/store.ts:8299](../../packages/store/src/store.ts#L8299) `Store/recoverContainersOut` | `SQLite.prepare` (8299); `Store.sql` (8299); `SQLite.get` (8302) | CORE |
| [packages/store/src/store.ts:1568](../../packages/store/src/store.ts#L1568) `Store/recoverPendingExternalFiles` | `Store.sql` (1568, 1570, 1594, 1596); `SQLite.prepare` (1570); `SQLite.get` (1581) | CORE |
| [packages/store/src/store.ts:5816](../../packages/store/src/store.ts#L5816) `Store/recoveryCodesRemaining` | `SQLite.get` (5816); `SQLite.prepare` (5816); `Store.sql` (5816) | CORE |
| [packages/store/src/store.ts:10839](../../packages/store/src/store.ts#L10839) `Store/refreshDecimalSqlViews` | `SQLite.get` (10839); `SQLite.prepare` (10839, 10844); `SQLite.all` (10844) | CORE |
| [packages/store/src/store.ts:3567](../../packages/store/src/store.ts#L3567) `Store/refuseLookalikeAccount` | `SQLite.all` (3567); `SQLite.prepare` (3567); `Store.sql` (3567) | CORE |
| [packages/store/src/store.ts:5682](../../packages/store/src/store.ts#L5682) `Store/registerPasskey` | `SQLite.prepare` (5682); `Store.sql` (5682) | CORE |
| [packages/store/src/store.ts:3696](../../packages/store/src/store.ts#L3696) `Store/rejectPending` | `SQLite.get` (3696); `SQLite.prepare` (3696, 3698); `Store.sql` (3696, 3698) | CORE |
| [packages/store/src/store.ts:8836](../../packages/store/src/store.ts#L8836) `Store/relatedCriteria` | `SQLite.iterate` (8836); `SQLite.prepare` (8836); `Store.sql` (8836) | CORE |
| [packages/store/src/store.ts:8833](../../packages/store/src/store.ts#L8833) `Store/relatedCriteria/matched` | `relatedRows` (8833) | CORE |
| [packages/store/src/store.ts:7179](../../packages/store/src/store.ts#L7179) `Store/relatedValues` | `Calculations.globalValue` (7179); `Calculations.unstoredValue` (7181) | CORE |
| [packages/store/src/store.ts:5695](../../packages/store/src/store.ts#L5695) `Store/removePasskey` | `SQLite.get` (5695); `SQLite.prepare` (5695, 5696); `Store.sql` (5695, 5696) | CORE |
| [packages/store/src/store.ts:10086](../../packages/store/src/store.ts#L10086) `Store/restoreDeletedRowLocked` | `SQLite.get` (10086, 10091); `SQLite.prepare` (10086, 10087, 10091, 10101); `Store.sql` (10086, 10087, 10091, 10101); `SQLite.all` (10087) | CORE |
| [packages/store/src/store.ts:2484](../../packages/store/src/store.ts#L2484) `Store/restoreRecord` | `Store.recordAsOf` (2484); `SQLite.get` (2488); `SQLite.prepare` (2488, 2493, 2502, 2513); `Store.sql` (2488, 2493, 2502, 2513) | CORE |
| [packages/store/src/store.ts:2528](../../packages/store/src/store.ts#L2528) `Store/revertAuditEntry` | `Store.auditLog` (2528) | CORE |
| [packages/store/src/store.ts:5443](../../packages/store/src/store.ts#L5443) `Store/revokeApiToken` | `SQLite.prepare` (5443); `Store.sql` (5443) | CORE |
| [packages/store/src/store.ts:9102](../../packages/store/src/store.ts#L9102) `Store/row` | `SQLite.get` (9102) | CORE |
| [packages/store/src/store.ts:10903](../../packages/store/src/store.ts#L10903) `Store/rowsOf` | `SQLite.iterate` (10903, 10911) | CORE |
| [packages/store/src/store.ts:6267](../../packages/store/src/store.ts#L6267) `Store/ruleOutcome` | `Calculations.context` (6267) | CORE |
| [packages/store/src/store.ts:8947](../../packages/store/src/store.ts#L8947) `Store/runningSummaryValues` | `Store.viewableIds` (8947); `rowsById` (8949); `Calculations.value` (8960, 8966); `Calculations.related` (8977) | GATED-STORE |
| [packages/store/src/store.ts:5902](../../packages/store/src/store.ts#L5902) `Store/savePrivilegeSet` | `SQLite.prepare` (5902, 5910); `Store.sql` (5902, 5910) | AUTH |
| [packages/store/src/store.ts:3920](../../packages/store/src/store.ts#L3920) `Store/saveScriptTest` | `SQLite.prepare` (3920); `Store.sql` (3920) | CORE |
| [packages/store/src/store.ts:6406](../../packages/store/src/store.ts#L6406) `Store/scopedTableSql` | `Store.viewableIds` (6406); `SQLite.all` (6409); `SQLite.prepare` (6409); `Store.sql` (6409) | GATED-STORE |
| [packages/store/src/store.ts:3144](../../packages/store/src/store.ts#L3144) `Store/scriptHistory` | `SQLite.all` (3144); `SQLite.prepare` (3144); `Store.sql` (3144) | CORE |
| [packages/store/src/store.ts:2821](../../packages/store/src/store.ts#L2821) `Store/securityChange` | `Store.sql` (2821, 2823); `SQLite.prepare` (2823) | CORE |
| [packages/store/src/store.ts:2408](../../packages/store/src/store.ts#L2408) `Store/securityEvents` | `Store.auditLog` (2408) | CORE |
| [packages/store/src/store.ts:5167](../../packages/store/src/store.ts#L5167) `Store/securityToken` | `SQLite.get` (5167); `SQLite.prepare` (5167); `Store.sql` (5167) | CORE |
| [packages/store/src/store.ts:10930](../../packages/store/src/store.ts#L10930) `Store/selectHeldCurrent` | `Store.sql` (10930, 10931, 10933); `SQLite.prepare` (10931) | CORE |
| [packages/store/src/store.ts:10391](../../packages/store/src/store.ts#L10391) `Store/selectIdsCurrent` | `Store.selectIds` (10391); `SQLite.all` (10397); `SQLite.prepare` (10397); `Store.sql` (10397) | GATED-STORE |
| [packages/store/src/store.ts:10922](../../packages/store/src/store.ts#L10922) `Store/selectIn` | `Store.select` (10922) | CORE |
| [packages/store/src/store.ts:1894](../../packages/store/src/store.ts#L1894) `Store/selfContainedCopy` | `Store.sql` (1894); `SQLite.all` (1899); `SQLite.prepare` (1899, 1901, 1902, 1903) | CORE |
| [packages/store/src/store.ts:4964](../../packages/store/src/store.ts#L4964) `Store/setAccountActive` | `SQLite.prepare` (4964, 4967, 4968); `Store.sql` (4964, 4967, 4968) | AUTH |
| [packages/store/src/store.ts:5186](../../packages/store/src/store.ts#L5186) `Store/setAccountLocalOnly` | `SQLite.prepare` (5186); `Store.sql` (5186) | CORE |
| [packages/store/src/store.ts:6058](../../packages/store/src/store.ts#L6058) `Store/setAccountPrivilegeSet` | `SQLite.get` (6058); `SQLite.prepare` (6058, 6061, 6065); `Store.sql` (6058, 6061, 6065) | AUTH |
| [packages/store/src/store.ts:5195](../../packages/store/src/store.ts#L5195) `Store/setAccountRequire2fa` | `SQLite.prepare` (5195); `Store.sql` (5195) | CORE |
| [packages/store/src/store.ts:3597](../../packages/store/src/store.ts#L3597) `Store/setAgentAccount` | `SQLite.get` (3597); `SQLite.prepare` (3597, 3603); `Store.sql` (3597, 3603) | CORE |
| [packages/store/src/store.ts:3964](../../packages/store/src/store.ts#L3964) `Store/setAiAllowed` | `SQLite.prepare` (3964); `Store.sql` (3964) | CORE |
| [packages/store/src/store.ts:4047](../../packages/store/src/store.ts#L4047) `Store/setAiPolicy` | `SQLite.prepare` (4047); `Store.sql` (4047) | CORE |
| [packages/store/src/store.ts:6665](../../packages/store/src/store.ts#L6665) `Store/setAllowBlankPasswordFromLan` | `SQLite.prepare` (6665); `Store.sql` (6665) | CORE |
| [packages/store/src/store.ts:2623](../../packages/store/src/store.ts#L2623) `Store/setAuditSettings` | `SQLite.prepare` (2623); `Store.sql` (2623) | CORE |
| [packages/store/src/store.ts:8518](../../packages/store/src/store.ts#L8518) `Store/setContainer` | `Store.sql` (8518, 8535); `Store.row` (8524); `SQLite.prepare` (8535) | CORE |
| [packages/store/src/store.ts:3549](../../packages/store/src/store.ts#L3549) `Store/setExternalAccount` | `SQLite.get` (3549); `SQLite.prepare` (3549, 3554); `Store.sql` (3549, 3554) | CORE |
| [packages/store/src/store.ts:4670](../../packages/store/src/store.ts#L4670) `Store/setMustChangePassword` | `SQLite.prepare` (4670); `Store.sql` (4670) | CORE |
| [packages/store/src/store.ts:3749](../../packages/store/src/store.ts#L3749) `Store/setPassword` | `SQLite.get` (3749); `SQLite.prepare` (3749, 3755, 3764, 3771, 3772, 3773); `Store.sql` (3749, 3755, 3764, 3771, 3772, 3773) | AUTH |
| [packages/store/src/store.ts:3861](../../packages/store/src/store.ts#L3861) `Store/setPasswordPolicy` | `SQLite.prepare` (3861); `Store.sql` (3861) | CORE |
| [packages/store/src/store.ts:1444](../../packages/store/src/store.ts#L1444) `Store/setPersistentData` | `SQLite.prepare` (1444, 1448); `Store.sql` (1444, 1448) | CORE |
| [packages/store/src/store.ts:4067](../../packages/store/src/store.ts#L4067) `Store/setPiiIsolation` | `SQLite.prepare` (4067); `Store.sql` (4067) | CORE |
| [packages/store/src/store.ts:3897](../../packages/store/src/store.ts#L3897) `Store/setRequireTotpForFullAccess` | `SQLite.prepare` (3897); `Store.sql` (3897) | CORE |
| [packages/store/src/store.ts:3979](../../packages/store/src/store.ts#L3979) `Store/setScriptNetwork` | `SQLite.prepare` (3979); `Store.sql` (3979) | CORE |
| [packages/store/src/store.ts:4036](../../packages/store/src/store.ts#L4036) `Store/setSqlRequiresFmxdbc` | `SQLite.prepare` (4036); `Store.sql` (4036) | CORE |
| [packages/store/src/store.ts:9531](../../packages/store/src/store.ts#L9531) `Store/setStoredCalcValues` | `SQLite.prepare` (9531, 9532); `Store.sql` (9531, 9532); `SQLite.get` (9536) | CORE |
| [packages/store/src/store.ts:8600](../../packages/store/src/store.ts#L8600) `Store/setUserPref` | `Store.sql` (8600, 8601, 8602); `SQLite.prepare` (8601, 8602) | CORE |
| [packages/store/src/store.ts:4020](../../packages/store/src/store.ts#L4020) `Store/setWebViewerHosts` | `SQLite.prepare` (4020); `Store.sql` (4020) | CORE |
| [packages/store/src/store.ts:5120](../../packages/store/src/store.ts#L5120) `Store/settleSignIns` | `SQLite.all` (5120, 5126); `SQLite.prepare` (5120, 5126, 5132, 5136, 5138); `Store.sql` (5120, 5126, 5132, 5136, 5138) | AUTH |
| [packages/store/src/store.ts:2025](../../packages/store/src/store.ts#L2025) `Store/shareResults` | `Store.sql` (2025) | CORE |
| [packages/store/src/store.ts:1506](../../packages/store/src/store.ts#L1506) `Store/shipWal` | `Store.sql` (1506) | CORE |
| [packages/store/src/store.ts:5067](../../packages/store/src/store.ts#L5067) `Store/signInBase` | `SQLite.get` (5067); `SQLite.prepare` (5067); `Store.sql` (5067) | AUTH |
| [packages/store/src/store.ts:5069](../../packages/store/src/store.ts#L5069) `Store/signInBase/identity` | `SQLite.get` (5069); `SQLite.prepare` (5069); `Store.sql` (5069) | AUTH |
| [packages/store/src/store.ts:5056](../../packages/store/src/store.ts#L5056) `Store/signInMark` | `SQLite.prepare` (5056); `Store.sql` (5056) | AUTH |
| [packages/store/src/store.ts:10616](../../packages/store/src/store.ts#L10616) `Store/sortIdsCurrentProgress` | `SQLite.all` (10616); `SQLite.prepare` (10616, 10684); `Store.sql` (10616, 10684); `Store.valueListItems` (10624); `rowsById` (10636); `Calculations.globalValue` (10639); `Calculations.unstoredValue` (10640); `Calculations.related` (10646); `SQLite.iterate` (10684) | GATED-STORE |
| [packages/store/src/store.ts:8761](../../packages/store/src/store.ts#L8761) `Store/sortedPage` | `SQLite.iterate` (8761); `SQLite.prepare` (8761, 8776); `Store.sql` (8761, 8776); `SQLite.all` (8776) | CORE |
| [packages/store/src/store.ts:8909](../../packages/store/src/store.ts#L8909) `Store/summaries` | `Calculations.wholeTable` (8909); `Calculations.collect` (8929, 8934) | CORE |
| [packages/store/src/store.ts:8925](../../packages/store/src/store.ts#L8925) `Store/summaries/recs` | `SQLite.iterate` (8925); `SQLite.prepare` (8925); `Store.sql` (8925) | CORE |
| [packages/store/src/store.ts:5633](../../packages/store/src/store.ts#L5633) `Store/takeWebauthnChallenge` | `SQLite.get` (5633); `SQLite.prepare` (5633, 5637); `Store.sql` (5633, 5637) | CORE |
| [packages/store/src/store.ts:8653](../../packages/store/src/store.ts#L8653) `Store/timeFind` | `Store.query` (8653, 8657, 8658); `Store.recordCount` (8660) | CORE |
| [packages/store/src/store.ts:7120](../../packages/store/src/store.ts#L7120) `Store/toRecord` | `Calculations.value` (7120, 7130); `Calculations.globalValue` (7124); `Calculations.unstoredStyled` (7129) | CORE |
| [packages/store/src/store.ts:5517](../../packages/store/src/store.ts#L5517) `Store/totpAccounts` | `SQLite.all` (5517); `SQLite.prepare` (5517); `Store.sql` (5517) | CORE |
| [packages/store/src/store.ts:1518](../../packages/store/src/store.ts#L1518) `Store/trial` | `Store.sql` (1518) | CORE |
| [packages/store/src/store.ts:1523](../../packages/store/src/store.ts#L1523) `Store/trial/undo` | `Store.sql` (1523) | CORE |
| [packages/store/src/store.ts:10726](../../packages/store/src/store.ts#L10726) `Store/truncate/run` | `Store.sql` (10726, 10728, 10735, 10737, 10739, 10740); `SQLite.prepare` (10728, 10735); `SQLite.all` (10730) | CORE |
| [packages/store/src/store.ts:3496](../../packages/store/src/store.ts#L3496) `Store/unmigratedAccounts` | `SQLite.all` (3496); `SQLite.prepare` (3496); `Store.sql` (3496) | CORE |
| [packages/store/src/store.ts:4576](../../packages/store/src/store.ts#L4576) `Store/unusedAccess` | `SQLite.get` (4576); `SQLite.prepare` (4576, 4585); `Store.sql` (4576, 4585); `SQLite.all` (4585) | CORE |
| [packages/store/src/store.ts:4624](../../packages/store/src/store.ts#L4624) `Store/unusedObjects` | `SQLite.get` (4624); `SQLite.prepare` (4624, 4627); `Store.sql` (4624, 4627); `SQLite.all` (4627) | CORE |
| [packages/store/src/store.ts:5757](../../packages/store/src/store.ts#L5757) `Store/unusedRecoveryHashes` | `SQLite.all` (5757); `SQLite.prepare` (5757); `Store.sql` (5757) | CORE |
| [packages/store/src/store.ts:4406](../../packages/store/src/store.ts#L4406) `Store/unusualAccess` | `Store.auditLog` (4406, 4472) | CORE |
| [packages/store/src/store.ts:9353](../../packages/store/src/store.ts#L9353) `Store/update` | `Store.row` (9353); `Store.sql` (9383, 9384, 9423, 9426) | CORE |
| [packages/store/src/store.ts:9386](../../packages/store/src/store.ts#L9386) `Store/update/undo` | `Store.sql` (9386) | CORE |
| [packages/store/src/store.ts:9816](../../packages/store/src/store.ts#L9816) `Store/updatePortals` | `Store.row` (9816, 9852); `relatedRows` (9853) | CORE |
| [packages/store/src/store.ts:9826](../../packages/store/src/store.ts#L9826) `Store/updatePortals/portal/related` | `relatedIdList` (9826) | CORE |
| [packages/store/src/store.ts:9798](../../packages/store/src/store.ts#L9798) `Store/updateRelated` | `relatedRows` (9798) | CORE |
| [packages/store/src/store.ts:4662](../../packages/store/src/store.ts#L4662) `Store/usageCounting` | `SQLite.get` (4662); `SQLite.prepare` (4662); `Store.sql` (4662) | CORE |
| [packages/store/src/store.ts:8591](../../packages/store/src/store.ts#L8591) `Store/userPrefs` | `SQLite.all` (8591); `SQLite.prepare` (8591); `Store.sql` (8591) | CORE |
| [packages/store/src/store.ts:7501](../../packages/store/src/store.ts#L7501) `Store/valueListItemsCurrent` | `Store.valueListItems` (7501); `Store.get` (7515); `relatedRows` (7516); `Store.row` (7516); `SQLite.iterate` (7518); `SQLite.prepare` (7518); `Store.sql` (7518); `Calculations.related` (7528); `Calculations.value` (7532, 7533) | GATED-STORE |
| [packages/store/src/store.ts:10008](../../packages/store/src/store.ts#L10008) `Store/vaultHeld` | `SQLite.get` (10008); `SQLite.prepare` (10008); `Store.sql` (10008) | CORE |
| [packages/store/src/store.ts:5546](../../packages/store/src/store.ts#L5546) `Store/verifyTotp` | `SQLite.get` (5546); `SQLite.prepare` (5546, 5553); `Store.sql` (5546, 5553) | CORE |
| [packages/store/src/store.ts:2080](../../packages/store/src/store.ts#L2080) `Store/versionNumber` | `SQLite.get` (2080); `SQLite.prepare` (2080); `Store.sql` (2080) | CORE |
| [packages/store/src/store.ts:2036](../../packages/store/src/store.ts#L2036) `Store/versionTriggers` | `SQLite.get` (2036); `SQLite.prepare` (2036, 2041, 2042); `Store.sql` (2036, 2041, 2042, 2059, 2061, 2062, 2064); `SQLite.all` (2041, 2042) | CORE |
| [packages/store/src/store.ts:2004](../../packages/store/src/store.ts#L2004) `Store/warmSummariesCurrent` | `Calculations.wholeTable` (2004) | CORE |
| [packages/store/src/store.ts:4002](../../packages/store/src/store.ts#L4002) `Store/webViewerChecked` | `SQLite.get` (4002); `SQLite.prepare` (4002); `Store.sql` (4002) | CORE |
| [packages/store/src/store.ts:1763](../../packages/store/src/store.ts#L1763) `Store/withWriteTransaction` | `Store.sql` (1763, 1775, 1781, 1783, 1783) | CORE |
| [packages/store/src/store.ts:7055](../../packages/store/src/store.ts#L7055) `Store/wordIndex` | `Store.sql` (7055, 7063, 7068); `Store.recordCount` (7067); `SQLite.get` (7068); `SQLite.prepare` (7068) | CORE |
| [packages/store/src/store.ts:8192](../../packages/store/src/store.ts#L8192) `Store/writeExternalFile` | `Store.evaluateEach` (8192); `SQLite.prepare` (8215); `Store.sql` (8215) | CORE |
| [packages/store/src/store.ts:8216](../../packages/store/src/store.ts#L8216) `Store/writeExternalFile/taken` | `SQLite.get` (8216) | CORE |
| [packages/store/src/store.ts:5376](../../packages/store/src/store.ts#L5376) `Store/writeObjectUseRows` | `SQLite.prepare` (5376, 5377, 5382); `Store.sql` (5376, 5377, 5382) | CORE |
| [packages/store/src/store.ts:2135](../../packages/store/src/store.ts#L2135) `Store/writeToken` | `SQLite.get` (2135); `SQLite.prepare` (2135); `Store.sql` (2135) | CORE |
| [packages/store/src/store.ts:5348](../../packages/store/src/store.ts#L5348) `Store/writeUsage` | `Store.sql` (5348, 5349, 5351, 5355, 5357) | CORE |
| [packages/store/src/store.ts:5364](../../packages/store/src/store.ts#L5364) `Store/writeUsageRows` | `SQLite.prepare` (5364, 5365, 5371); `Store.sql` (5364, 5365, 5371) | CORE |
| [packages/store/src/store.ts:6776](../../packages/store/src/store.ts#L6776) `Store/design` | `SQLite.get` (6776) | CORE |
| [packages/store/src/store.ts:6798](../../packages/store/src/store.ts#L6798) `Store/themes` | `SQLite.get` (6798) | CORE |
| [packages/store/src/store.ts:5717](../../packages/store/src/store.ts#L5717) `Store/verifyPasskeyCredential` | `SQLite.get` (5717); `SQLite.prepare` (5717, 5729); `Store.sql` (5717, 5729) | CORE |
| [packages/store/src/store.ts:6636](../../packages/store/src/store.ts#L6636) `Store/passwordState` | `SQLite.get` (6636); `SQLite.prepare` (6636); `Store.sql` (6636) | CORE |
| [packages/store/src/store.ts:9951](../../packages/store/src/store.ts#L9951) `Store/deleteVisibility` | `Store.canViewRecord` (9951) | CORE |
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
