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
| [packages/cli/src/main.ts:712](../../packages/cli/src/main.ts#L712) `accountsWithPasswordOff` | `SQLite.all` (712); `SQLite.prepare` (712) | OPERATOR |
| [packages/cli/src/main.ts:741](../../packages/cli/src/main.ts#L741) `hostedRead` | `SQLite.all` (741, 744); `SQLite.prepare` (741, 744); `Store.sql` (741, 744) | OPERATOR |
| [packages/cli/src/main.ts:2426](../../packages/cli/src/main.ts#L2426) `main` | `Store.orphanContainerReport` (2426); `Store.auditLog` (2899); `SQLite.get` (3161); `SQLite.prepare` (3161) | OPERATOR |
| [packages/scripts/src/data-api-step.ts:104](../../packages/scripts/src/data-api-step.ts#L104) `respond` | `Store.get` (104, 131, 140); `Store.find` (105, 117) | SCRIPT |
| [packages/scripts/src/engine.ts:8150](../../packages/scripts/src/engine.ts#L8150) `ScriptEngine/containerFile` | `Store.get` (8150); `Store.containerId` (8151); `Store.container` (8152) | SCRIPT |
| [packages/scripts/src/engine.ts:5744](../../packages/scripts/src/engine.ts#L5744) `ScriptEngine/design` | `Store.valueListItems` (5744) | SCRIPT |
| [packages/scripts/src/engine.ts:6482](../../packages/scripts/src/engine.ts#L6482) `ScriptEngine/exportField` | `Store.get` (6482); `Store.containerId` (6483); `Store.container` (6485) | SCRIPT |
| [packages/scripts/src/engine.ts:8570](../../packages/scripts/src/engine.ts#L8570) `ScriptEngine/fileMakerRows` | `Store.findIds` (8570); `Store.get` (8575) | SCRIPT |
| [packages/scripts/src/engine.ts:2350](../../packages/scripts/src/engine.ts#L2350) `ScriptEngine/foundSet` | `Store.findIds` (2350) | SCRIPT |
| [packages/scripts/src/engine.ts:5584](../../packages/scripts/src/engine.ts#L5584) `ScriptEngine/get` | `Store.findIds` (5584); `Store.canViewRecord` (5677); `Store.get` (5713) | SCRIPT |
| [packages/scripts/src/engine.ts:2006](../../packages/scripts/src/engine.ts#L2006) `ScriptEngine/goToLayout` | `Store.findIds` (2006) | SCRIPT |
| [packages/scripts/src/engine.ts:8341](../../packages/scripts/src/engine.ts#L8341) `ScriptEngine/importRecords` | `Store.get` (8341) | SCRIPT |
| [packages/scripts/src/engine.ts:5856](../../packages/scripts/src/engine.ts#L5856) `ScriptEngine/lookupNext` | `Store.get` (5856); `Store.row` (5857); `Calculations.context` (5859) | SCRIPT |
| [packages/scripts/src/engine.ts:5390](../../packages/scripts/src/engine.ts#L5390) `ScriptEngine/newCalcContext/executeSQL` | `Calculations.executeSQL` (5390) | SCRIPT |
| [packages/scripts/src/engine.ts:5398](../../packages/scripts/src/engine.ts#L5398) `ScriptEngine/newCalcContext/persistentData` | `Store.persistentData` (5398) | SCRIPT |
| [packages/scripts/src/engine.ts:5399](../../packages/scripts/src/engine.ts#L5399) `ScriptEngine/newCalcContext/persistentDataIds` | `Store.persistentDataIds` (5399) | SCRIPT |
| [packages/scripts/src/engine.ts:8610](../../packages/scripts/src/engine.ts#L8610) `ScriptEngine/newRecord` | `Store.findIds` (8610) | SCRIPT |
| [packages/scripts/src/engine.ts:8981](../../packages/scripts/src/engine.ts#L8981) `ScriptEngine/quickFind` | `Store.get` (8981) | SCRIPT |
| [packages/scripts/src/engine.ts:5798](../../packages/scripts/src/engine.ts#L5798) `ScriptEngine/record` | `Store.get` (5798) | SCRIPT |
| [packages/scripts/src/engine.ts:5959](../../packages/scripts/src/engine.ts#L5959) `ScriptEngine/relatedIds` | `Store.findIds` (5959); `rowsById` (5967); `Store.select` (5971); `Store.matchIds` (5985); `Store.viewableIds` (6008) | SCRIPT |
| [packages/scripts/src/engine.ts:5993](../../packages/scripts/src/engine.ts#L5993) `ScriptEngine/relatedIds/matching` | `Store.matchIds` (5993) | SCRIPT |
| [packages/scripts/src/engine.ts:6636](../../packages/scripts/src/engine.ts#L6636) `ScriptEngine/relookup` | `Store.get` (6636) | SCRIPT |
| [packages/scripts/src/engine.ts:3530](../../packages/scripts/src/engine.ts#L3530) `ScriptEngine/revertTransaction` | `Store.findIds` (3530) | SCRIPT |
| [packages/scripts/src/engine.ts:3383](../../packages/scripts/src/engine.ts#L3383) `ScriptEngine/findIdsCooperative` | `Store.findIdsProgress` (3383) | SCRIPT |
| [packages/scripts/src/engine.ts:3397](../../packages/scripts/src/engine.ts#L3397) `ScriptEngine/sortIdsCooperative` | `Store.sortIdsProgress` (3397) | SCRIPT |
| [packages/scripts/src/engine.ts:3425](../../packages/scripts/src/engine.ts#L3425) `ScriptEngine/sortIdsProgress` | `Store.sortIdsProgress` (3425); `Store.valueListItems` (3431) | SCRIPT |
| [packages/scripts/src/engine.ts:7403](../../packages/scripts/src/engine.ts#L7403) `ScriptEngine/sourceValue` | `Store.get` (7403); `Store.containerId` (7404); `Store.container` (7405) | SCRIPT |
| [packages/scripts/src/engine.ts:3334](../../packages/scripts/src/engine.ts#L3334) `ScriptEngine/sqlByNaturalLanguage` | `Calculations.translateSQL` (3334); `Calculations.executeSQL` (3341) | SCRIPT |
| [packages/scripts/src/engine.ts:4115](../../packages/scripts/src/engine.ts#L4115) `ScriptEngine/step` | `Store.fieldIndex` (4115) | SCRIPT |
| [packages/scripts/src/engine.ts:5831](../../packages/scripts/src/engine.ts#L5831) `ScriptEngine/valueOf` | `Store.findIds` (5831, 5831); `Store.containerId` (5839) | SCRIPT |
| [packages/scripts/src/engine.ts:9373](../../packages/scripts/src/engine.ts#L9373) `clearRecords` | `SQLite.all` (9373); `SQLite.prepare` (9373) | SCRIPT |
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
| [packages/server/src/dataapi.ts:2076](../../packages/server/src/dataapi.ts#L2076) `DataApi/route` | `Store.get` (2076, 2297, 2298, 2321, 2329, 2376, 2400, 2420, 2457); `Store.valueListItems` (2091); `Store.find` (2252, 2300, 2491); `Store.findIds` (2256, 2496); `Store.query` (2496) | REST |
| [packages/server/src/dataapi.ts:2204](../../packages/server/src/dataapi.ts#L2204) `DataApi/route/recordOut` | `Store.portalCounts` (2204) | REST |
| [packages/server/src/dataapi.ts:2240](../../packages/server/src/dataapi.ts#L2240) `DataApi/route/shownAs` | `Store.get` (2240) | REST |
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
| [packages/store/src/store.ts:5248](../../packages/store/src/store.ts#L5248) `Store/accountIdentityId` | `SQLite.get` (5248, 5254); `SQLite.prepare` (5248, 5253, 5254); `Store.sql` (5248, 5253, 5254) | CORE |
| [packages/store/src/store.ts:5242](../../packages/store/src/store.ts#L5242) `Store/accountIdentityIdIfSet` | `SQLite.get` (5242); `SQLite.prepare` (5242); `Store.sql` (5242) | CORE |
| [packages/store/src/store.ts:5204](../../packages/store/src/store.ts#L5204) `Store/accountInactive` | `SQLite.get` (5204); `SQLite.prepare` (5204); `Store.sql` (5204) | CORE |
| [packages/store/src/store.ts:5401](../../packages/store/src/store.ts#L5401) `Store/accountLocalOnly` | `SQLite.get` (5401); `SQLite.prepare` (5401); `Store.sql` (5401) | CORE |
| [packages/store/src/store.ts:6270](../../packages/store/src/store.ts#L6270) `Store/accountPrivilegeSet` | `SQLite.get` (6270); `SQLite.prepare` (6270); `Store.sql` (6270) | CORE |
| [packages/store/src/store.ts:5406](../../packages/store/src/store.ts#L5406) `Store/accountRequires2fa` | `SQLite.get` (5406); `SQLite.prepare` (5406); `Store.sql` (5406) | CORE |
| [packages/store/src/store.ts:5626](../../packages/store/src/store.ts#L5626) `Store/accountUsage` | `SQLite.get` (5626); `SQLite.prepare` (5626, 5627); `Store.sql` (5626, 5627); `SQLite.all` (5627); `Store.auditLog` (5643) | CORE |
| [packages/store/src/store.ts:3661](../../packages/store/src/store.ts#L3661) `Store/accounts` | `SQLite.all` (3661); `SQLite.prepare` (3661); `Store.sql` (3661) | CORE |
| [packages/store/src/store.ts:3657](../../packages/store/src/store.ts#L3657) `Store/accountsSharingLockout` | `SQLite.all` (3657); `SQLite.prepare` (3657); `Store.sql` (3657) | CORE |
| [packages/store/src/store.ts:8386](../../packages/store/src/store.ts#L8386) `Store/addContainer` | `SQLite.all` (8386); `SQLite.prepare` (8386, 8391, 8405, 8409, 8410); `Store.sql` (8386, 8391, 8405, 8407, 8409, 8410, 8412, 8415); `SQLite.get` (8396); `Store.containerRange` (8398) | CORE |
| [packages/store/src/store.ts:8432](../../packages/store/src/store.ts#L8432) `Store/addExternalContainer` | `SQLite.prepare` (8432); `Store.sql` (8432) | CORE |
| [packages/store/src/store.ts:8909](../../packages/store/src/store.ts#L8909) `Store/addFieldIndex` | `Store.sql` (8909) | CORE |
| [packages/store/src/store.ts:7081](../../packages/store/src/store.ts#L7081) `Store/addImage` | `Store.sql` (7081, 7082); `SQLite.prepare` (7082) | CORE |
| [packages/store/src/store.ts:6320](../../packages/store/src/store.ts#L6320) `Store/addProvisionedAccount` | `SQLite.get` (6320); `SQLite.prepare` (6320, 6324); `Store.sql` (6320, 6324) | CORE |
| [packages/store/src/store.ts:7504](../../packages/store/src/store.ts#L7504) `Store/addRelated` | `relatedRows` (7504); `rowsById` (7537); `firstRelatedEach` (7560) | CORE |
| [packages/store/src/store.ts:3679](../../packages/store/src/store.ts#L3679) `Store/agentNeedsApproval` | `SQLite.get` (3679); `SQLite.prepare` (3679); `Store.sql` (3679) | CORE |
| [packages/store/src/store.ts:6534](../../packages/store/src/store.ts#L6534) `Store/allowedIds` | `SQLite.iterate` (6534); `SQLite.prepare` (6534); `Store.sql` (6534) | CORE |
| [packages/store/src/store.ts:5683](../../packages/store/src/store.ts#L5683) `Store/apiToken` | `SQLite.get` (5683); `SQLite.prepare` (5683, 5701); `Store.sql` (5683, 5701) | CORE |
| [packages/store/src/store.ts:5659](../../packages/store/src/store.ts#L5659) `Store/apiTokens` | `SQLite.all` (5659); `SQLite.prepare` (5659); `Store.sql` (5659) | CORE |
| [packages/store/src/store.ts:3120](../../packages/store/src/store.ts#L3120) `Store/appendSecurityRow` | `Store.sql` (3120) | CORE |
| [packages/store/src/store.ts:4019](../../packages/store/src/store.ts#L4019) `Store/appendSecurityEvent` | `Store.sql` (4019) | CORE |
| [packages/store/src/store.ts:5024](../../packages/store/src/store.ts#L5024) `Store/applyAccountImport` | `Store.sql` (5024, 5032, 5061); `SQLite.get` (5032); `SQLite.prepare` (5032, 5061) | CORE |
| [packages/store/src/store.ts:2421](../../packages/store/src/store.ts#L2421) `Store/applyDesign` | `Store.sql` (2421, 2422, 2442, 2445, 2450, 2466, 2469, 2469); `SQLite.prepare` (2445, 2450) | CORE |
| [packages/store/src/store.ts:3875](../../packages/store/src/store.ts#L3875) `Store/approvePending` | `SQLite.get` (3875); `SQLite.prepare` (3875, 3886); `Store.sql` (3875, 3886) | CORE |
| [packages/store/src/store.ts:2911](../../packages/store/src/store.ts#L2911) `Store/audit/write` | `Store.sql` (2911) | CORE |
| [packages/store/src/store.ts:2533](../../packages/store/src/store.ts#L2533) `Store/auditLog` | `SQLite.all` (2533); `SQLite.prepare` (2533); `Store.sql` (2533) | CORE |
| [packages/store/src/store.ts:1956](../../packages/store/src/store.ts#L1956) `Store/backup` | `Store.sql` (1956) | CORE |
| [packages/store/src/store.ts:3685](../../packages/store/src/store.ts#L3685) `Store/blankPasswordAccounts` | `SQLite.all` (3685); `SQLite.prepare` (3685); `Store.sql` (3685) | CORE |
| [packages/store/src/store.ts:9495](../../packages/store/src/store.ts#L9495) `Store/canView` | `Store.canView` (9495); `Store.row` (9496) | GATED-STORE |
| [packages/store/src/store.ts:9477](../../packages/store/src/store.ts#L9477) `Store/canViewRecord` | `SQLite.get` (9477); `SQLite.prepare` (9477); `Store.sql` (9477) | GATED-STORE |
| [packages/store/src/store.ts:4953](../../packages/store/src/store.ts#L4953) `Store/canonicalAccount` | `SQLite.all` (4953); `SQLite.prepare` (4953); `Store.sql` (4953) | CORE |
| [packages/store/src/store.ts:10584](../../packages/store/src/store.ts#L10584) `Store/cascadeDelete` | `relatedRows` (10584) | CORE |
| [packages/store/src/store.ts:2256](../../packages/store/src/store.ts#L2256) `Store/changeOne` | `Store.sql` (2256, 2258) | CORE |
| [packages/store/src/store.ts:2259](../../packages/store/src/store.ts#L2259) `Store/changeOne/read` | `SQLite.get` (2259); `SQLite.prepare` (2259); `Store.sql` (2259) | CORE |
| [packages/store/src/store.ts:8767](../../packages/store/src/store.ts#L8767) `Store/checkContainerWrite` | `Store.row` (8767) | CORE |
| [packages/store/src/store.ts:10207](../../packages/store/src/store.ts#L10207) `Store/checkEditable` | `Store.row` (10207) | CORE |
| [packages/store/src/store.ts:1502](../../packages/store/src/store.ts#L1502) `Store/checkpoint` | `SQLite.get` (1502); `SQLite.prepare` (1502); `Store.sql` (1502) | CORE |
| [packages/store/src/store.ts:6306](../../packages/store/src/store.ts#L6306) `Store/clearAccountPrivilegeSet` | `SQLite.prepare` (6306); `Store.sql` (6306) | CORE |
| [packages/store/src/store.ts:1524](../../packages/store/src/store.ts#L1524) `Store/close` | `Store.sql` (1524) | CORE |
| [packages/store/src/store.ts:8735](../../packages/store/src/store.ts#L8735) `Store/compactFile` | `Store.sql` (8735, 8736, 8738) | CORE |
| [packages/store/src/store.ts:10708](../../packages/store/src/store.ts#L10708) `Store/computeValuesCurrent` | `Store.computeValues` (10708); `Store.sql` (10714, 10718); `SQLite.all` (10718); `SQLite.prepare` (10718) | GATED-STORE |
| [packages/store/src/store.ts:9146](../../packages/store/src/store.ts#L9146) `Store/computedRows` | `Store.sql` (9146, 9149, 9150, 9151, 9153, 9163, 9164, 9165, 9168); `SQLite.prepare` (9149, 9151, 9153, 9163); `SQLite.iterate` (9153); `Calculations.globalValue` (9156); `Calculations.unstoredValue` (9157); `Calculations.related` (9160); `SQLite.all` (9163) | CORE |
| [packages/store/src/store.ts:5728](../../packages/store/src/store.ts#L5728) `Store/confirmTotp` | `SQLite.get` (5728); `SQLite.prepare` (5728, 5730); `Store.sql` (5728, 5730) | CORE |
| [packages/store/src/store.ts:1148](../../packages/store/src/store.ts#L1148) `Store/constructor` | `Store.sql` (1148, 1150, 1152, 1153, 1157, 1161, 1162, 1171, 1179, 1194, 1199, 1204, 1205, 1209, 1210, 1211, 1218, 1222, 1226, 1227, 1228, 1233, 1237, 1240, 1241, 1243, 1244, 1247, 1248, 1252, 1253, 1257, 1258, 1261, 1263, 1266, 1267, 1271, 1272, 1276, 1277, 1281, 1282, 1283, 1286, 1287, 1290, 1291, 1293, 1293, 1294, 1294, 1295, 1298, 1302, 1304, 1307, 1308, 1309, 1312, 1313, 1315, 1317, 1318, 1322, 1323, 1325, 1337, 1339, 1340, 1341, 1341, 1345, 1346); `SQLite.get` (1152, 1171); `SQLite.prepare` (1152, 1171, 1179, 1240, 1241, 1244, 1247, 1252, 1257, 1266, 1271, 1276, 1286, 1290, 1293, 1294, 1312, 1317, 1322); `SQLite.all` (1240, 1247, 1252, 1257, 1266, 1271, 1276, 1286, 1290, 1293, 1294, 1312, 1317, 1322) | CORE |
| [packages/store/src/store.ts:6086](../../packages/store/src/store.ts#L6086) `Store/consumeRecoveryCode` | `SQLite.prepare` (6086); `Store.sql` (6086) | CORE |
| [packages/store/src/store.ts:8310](../../packages/store/src/store.ts#L8310) `Store/container` | `SQLite.get` (8310); `SQLite.prepare` (8310, 8319); `Store.sql` (8310, 8319); `SQLite.all` (8319) | CORE |
| [packages/store/src/store.ts:8744](../../packages/store/src/store.ts#L8744) `Store/containerId` | `Store.containerId` (8744); `Store.row` (8745) | CORE |
| [packages/store/src/store.ts:8327](../../packages/store/src/store.ts#L8327) `Store/containerInfo` | `SQLite.get` (8327); `SQLite.prepare` (8327); `Store.sql` (8327) | CORE |
| [packages/store/src/store.ts:8291](../../packages/store/src/store.ts#L8291) `Store/containerIntact` | `SQLite.get` (8291); `SQLite.prepare` (8291); `Store.sql` (8291) | CORE |
| [packages/store/src/store.ts:8230](../../packages/store/src/store.ts#L8230) `Store/containerIntegrityReport` | `SQLite.all` (8230); `SQLite.prepare` (8230, 8241); `Store.sql` (8230, 8241); `SQLite.get` (8241) | CORE |
| [packages/store/src/store.ts:8305](../../packages/store/src/store.ts#L8305) `Store/containerMeta` | `SQLite.get` (8305); `SQLite.prepare` (8305); `Store.sql` (8305) | CORE |
| [packages/store/src/store.ts:8361](../../packages/store/src/store.ts#L8361) `Store/containerRange` | `SQLite.all` (8361); `SQLite.prepare` (8361, 8368); `Store.sql` (8361, 8368); `SQLite.get` (8368) | CORE |
| [packages/store/src/store.ts:8132](../../packages/store/src/store.ts#L8132) `Store/containerReferences` | `SQLite.all` (8132, 8151, 8153, 8159, 8172, 8183, 8197); `SQLite.prepare` (8132, 8151, 8153, 8159, 8172, 8183, 8195, 8197); `Store.sql` (8132, 8151, 8153, 8159, 8172, 8183, 8195, 8197); `SQLite.get` (8195); `Store.row` (8206) | CORE |
| [packages/store/src/store.ts:10688](../../packages/store/src/store.ts#L10688) `Store/countIds` | `Store.countIds` (10688); `SQLite.get` (10692); `SQLite.prepare` (10692); `Store.sql` (10692) | GATED-STORE |
| [packages/store/src/store.ts:9526](../../packages/store/src/store.ts#L9526) `Store/create` | `SQLite.get` (9526); `SQLite.prepare` (9526, 9539); `Store.sql` (9526, 9539) | CORE |
| [packages/store/src/store.ts:3991](../../packages/store/src/store.ts#L3991) `Store/createAccount` | `SQLite.get` (3991); `SQLite.prepare` (3991, 3995, 4001, 4006, 4011); `Store.sql` (3991, 3995, 4001, 4006, 4011) | CORE |
| [packages/store/src/store.ts:5459](../../packages/store/src/store.ts#L5459) `Store/createApiToken` | `SQLite.get` (5459, 5487); `SQLite.prepare` (5459, 5486, 5487, 5497); `Store.sql` (5459, 5486, 5487, 5497) | CORE |
| [packages/store/src/store.ts:4965](../../packages/store/src/store.ts#L4965) `Store/createLocalAccount` | `SQLite.prepare` (4965); `Store.sql` (4965) | CORE |
| [packages/store/src/store.ts:3651](../../packages/store/src/store.ts#L3651) `Store/credentialIdentity` | `SQLite.get` (3651); `SQLite.prepare` (3651); `Store.sql` (3651) | CORE |
| [packages/store/src/store.ts:5380](../../packages/store/src/store.ts#L5380) `Store/credentialStamp` | `SQLite.get` (5380); `SQLite.prepare` (5380); `Store.sql` (5380) | CORE |
| [packages/store/src/store.ts:2046](../../packages/store/src/store.ts#L2046) `Store/dataVersion` | `SQLite.get` (2046); `SQLite.prepare` (2046); `Store.sql` (2046) | CORE |
| [packages/store/src/store.ts:11245](../../packages/store/src/store.ts#L11245) `Store/decimalViewSql` | `SQLite.all` (11245); `SQLite.prepare` (11245) | CORE |
| [packages/store/src/store.ts:10250](../../packages/store/src/store.ts#L10250) `Store/delete` | `Store.row` (10250) | CORE |
| [packages/store/src/store.ts:10258](../../packages/store/src/store.ts#L10258) `Store/delete/run` | `SQLite.get` (10258); `SQLite.prepare` (10258, 10263); `Store.sql` (10258, 10263) | CORE |
| [packages/store/src/store.ts:5119](../../packages/store/src/store.ts#L5119) `Store/deleteAccount` | `SQLite.prepare` (5119, 5123, 5124, 5125, 5126, 5127, 5128, 5129, 5130, 5137, 5139, 5141, 5143, 5147); `Store.sql` (5119, 5123, 5124, 5125, 5126, 5127, 5128, 5129, 5130, 5137, 5139, 5141, 5143, 5147) | CORE |
| [packages/store/src/store.ts:10331](../../packages/store/src/store.ts#L10331) `Store/deleteBeingUndone` | `SQLite.all` (10331); `SQLite.prepare` (10331); `Store.sql` (10331) | CORE |
| [packages/store/src/store.ts:10343](../../packages/store/src/store.ts#L10343) `Store/deleteEndingTheLifeAt` | `SQLite.get` (10343); `SQLite.prepare` (10343); `Store.sql` (10343) | CORE |
| [packages/store/src/store.ts:6171](../../packages/store/src/store.ts#L6171) `Store/deletePrivilegeSet` | `SQLite.prepare` (6171); `Store.sql` (6171) | CORE |
| [packages/store/src/store.ts:4129](../../packages/store/src/store.ts#L4129) `Store/deleteScriptTest` | `SQLite.prepare` (4129); `Store.sql` (4129) | CORE |
| [packages/store/src/store.ts:3288](../../packages/store/src/store.ts#L3288) `Store/deletedRows` | `SQLite.get` (3288); `SQLite.prepare` (3288, 3290, 3290); `Store.sql` (3288, 3290, 3290); `SQLite.all` (3290, 3290) | CORE |
| [packages/store/src/store.ts:3398](../../packages/store/src/store.ts#L3398) `Store/designEffect` | `Store.sql` (3398, 3404, 3405, 3408, 3414, 3419, 3422, 3428, 3439, 3440, 3442, 3443, 3456, 3457, 3460, 3462, 3468, 3469, 3470, 3476, 3478, 3482, 3485, 3486, 3488, 3491, 3497, 3499, 3506, 3507, 3509, 3510, 3511, 3512, 3519, 3520, 3522, 3522, 3524, 3525, 3526, 3530, 3534, 3536, 3574, 3576, 3578); `SQLite.prepare` (3408, 3439, 3440, 3456, 3457, 3468, 3469, 3476, 3478, 3482, 3486, 3497, 3499, 3512, 3519, 3520, 3522, 3524, 3526, 3530, 3534); `SQLite.get` (3439, 3456, 3468, 3469, 3482, 3486, 3522, 3530); `SQLite.all` (3519, 3520); `SQLite.iterate` (3524) | CORE |
| [packages/store/src/store.ts:3391](../../packages/store/src/store.ts#L3391) `Store/designEffect/renameExcluded` | `SQLite.prepare` (3391); `Store.sql` (3391) | CORE |
| [packages/store/src/store.ts:3375](../../packages/store/src/store.ts#L3375) `Store/designEffect/renameKey` | `SQLite.prepare` (3375); `Store.sql` (3375) | CORE |
| [packages/store/src/store.ts:3329](../../packages/store/src/store.ts#L3329) `Store/designHistory` | `SQLite.all` (3329); `SQLite.prepare` (3329); `Store.sql` (3329) | CORE |
| [packages/store/src/store.ts:5749](../../packages/store/src/store.ts#L5749) `Store/disableTotp` | `SQLite.prepare` (5749); `Store.sql` (5749) | CORE |
| [packages/store/src/store.ts:3586](../../packages/store/src/store.ts#L3586) `Store/dropColumnIndexes` | `SQLite.all` (3586, 3588); `SQLite.prepare` (3586, 3588); `Store.sql` (3586, 3588, 3589) | CORE |
| [packages/store/src/store.ts:8921](../../packages/store/src/store.ts#L8921) `Store/dropFieldIndex` | `SQLite.get` (8921); `SQLite.prepare` (8921); `Store.sql` (8921, 8922) | CORE |
| [packages/store/src/store.ts:9563](../../packages/store/src/store.ts#L9563) `Store/duplicate` | `Store.row` (9563); `SQLite.prepare` (9581); `Store.sql` (9581) | CORE |
| [packages/store/src/store.ts:8548](../../packages/store/src/store.ts#L8548) `Store/embeddedContainerCount` | `SQLite.prepare` (8548); `Store.sql` (8548); `SQLite.get` (8549) | CORE |
| [packages/store/src/store.ts:8534](../../packages/store/src/store.ts#L8534) `Store/embeddedContainers` | `SQLite.prepare` (8534, 8535); `Store.sql` (8534, 8535); `SQLite.all` (8535); `SQLite.get` (8539) | CORE |
| [packages/store/src/store.ts:3314](../../packages/store/src/store.ts#L3314) `Store/emptyDeleted` | `Store.sql` (3314, 3317, 3318, 3320, 3322); `SQLite.prepare` (3318) | CORE |
| [packages/store/src/store.ts:1922](../../packages/store/src/store.ts#L1922) `Store/endTransaction` | `Store.sql` (1922, 1925, 1925) | CORE |
| [packages/store/src/store.ts:5717](../../packages/store/src/store.ts#L5717) `Store/enrollTotp` | `SQLite.prepare` (5717); `Store.sql` (5717) | CORE |
| [packages/store/src/store.ts:3283](../../packages/store/src/store.ts#L3283) `Store/ensureDeleted` | `Store.sql` (3283) | CORE |
| [packages/store/src/store.ts:1356](../../packages/store/src/store.ts#L1356) `Store/ensureNativeIds` | `SQLite.all` (1356, 1368); `SQLite.prepare` (1356, 1359, 1367, 1368); `Store.sql` (1356, 1359, 1362, 1366, 1367, 1368, 1371, 1373) | CORE |
| [packages/store/src/store.ts:2168](../../packages/store/src/store.ts#L2168) `Store/ensureRecordIdHighWater` | `Store.sql` (2168, 2169, 2171, 2173, 2175) | CORE |
| [packages/store/src/store.ts:2187](../../packages/store/src/store.ts#L2187) `Store/ensureRecordIdMarks` | `SQLite.all` (2187, 2190, 2193, 2202); `SQLite.prepare` (2187, 2190, 2193, 2196, 2202, 2205); `Store.sql` (2187, 2190, 2193, 2196, 2202, 2205, 2209, 2210) | CORE |
| [packages/store/src/store.ts:9904](../../packages/store/src/store.ts#L9904) `Store/evaluateCurrent` | `Store.row` (9904, 9904, 9905, 9905); `Calculations.context` (9910); `Store.get` (9911, 9913) | GATED-STORE |
| [packages/store/src/store.ts:9945](../../packages/store/src/store.ts#L9945) `Store/evaluateEachCurrent` | `Store.row` (9945, 9945, 9950); `Calculations.context` (9951); `Store.get` (9953) | GATED-STORE |
| [packages/store/src/store.ts:10007](../../packages/store/src/store.ts#L10007) `Store/evaluateRowsCurrent` | `Store.row` (10007, 10007, 10008, 10008) | GATED-STORE |
| [packages/store/src/store.ts:9986](../../packages/store/src/store.ts#L9986) `Store/evaluateRowsCurrent/each` | `Calculations.context` (9986); `Store.get` (9988) | GATED-STORE |
| [packages/store/src/store.ts:10022](../../packages/store/src/store.ts#L10022) `Store/evaluateRowsCurrent/found/[Symbol.iterator]` | `rowsById` (10022) | GATED-STORE |
| [packages/store/src/store.ts:10044](../../packages/store/src/store.ts#L10044) `Store/evaluateRowsCurrent/key` | `Calculations.context` (10044) | GATED-STORE |
| [packages/store/src/store.ts:3918](../../packages/store/src/store.ts#L3918) `Store/externalAccount` | `SQLite.all` (3918); `SQLite.prepare` (3918); `Store.sql` (3918) | CORE |
| [packages/store/src/store.ts:8053](../../packages/store/src/store.ts#L8053) `Store/externalContainerCheck` | `SQLite.all` (8053); `SQLite.prepare` (8053); `Store.sql` (8053) | CORE |
| [packages/store/src/store.ts:8060](../../packages/store/src/store.ts#L8060) `Store/externalContainerCount` | `SQLite.get` (8060); `SQLite.prepare` (8060); `Store.sql` (8060) | CORE |
| [packages/store/src/store.ts:8069](../../packages/store/src/store.ts#L8069) `Store/externalContainerReport` | `SQLite.all` (8069, 8082); `SQLite.prepare` (8069, 8082); `Store.sql` (8069, 8082) | CORE |
| [packages/store/src/store.ts:5230](../../packages/store/src/store.ts#L5230) `Store/externalIdentityId` | `SQLite.get` (5230, 5237); `SQLite.prepare` (5230, 5236, 5237); `Store.sql` (5230, 5236, 5237) | CORE |
| [packages/store/src/store.ts:8301](../../packages/store/src/store.ts#L8301) `Store/externalOf` | `SQLite.get` (8301); `SQLite.prepare` (8301); `Store.sql` (8301) | CORE |
| [packages/store/src/store.ts:3064](../../packages/store/src/store.ts#L3064) `Store/failureAuditRoom` | `SQLite.get` (3064); `SQLite.prepare` (3064); `Store.sql` (3064) | CORE |
| [packages/store/src/store.ts:7706](../../packages/store/src/store.ts#L7706) `Store/fieldIndexCurrent` | `SQLite.iterate` (7706); `SQLite.prepare` (7706, 7711); `Store.sql` (7706, 7711); `SQLite.all` (7711) | GATED-STORE |
| [packages/store/src/store.ts:8961](../../packages/store/src/store.ts#L8961) `Store/find` | `Store.find` (8961) | GATED-STORE |
| [packages/store/src/store.ts:9333](../../packages/store/src/store.ts#L9333) `Store/findCandidates` | `Store.query` (9333) | CORE |
| [packages/store/src/store.ts:8972](../../packages/store/src/store.ts#L8972) `Store/findHere` | `Store.query` (8972, 8977, 8979, 8993, 8995, 9006); `Store.recordCount` (8990); `SQLite.get` (8991, 8995); `SQLite.prepare` (8991, 8995, 9001, 9008, 9017); `Store.sql` (8991, 8995, 9001, 9008, 9017); `SQLite.all` (9001, 9008, 9017) | GATED-STORE |
| [packages/store/src/store.ts:9012](../../packages/store/src/store.ts#L9012) `Store/findHere/[Symbol.iterator]` | `SQLite.iterate` (9012); `SQLite.prepare` (9012); `Store.sql` (9012) | GATED-STORE |
| [packages/store/src/store.ts:10819](../../packages/store/src/store.ts#L10819) `Store/findIdsCurrent` | `Store.findIds` (10819) | GATED-STORE |
| [packages/store/src/store.ts:10755](../../packages/store/src/store.ts#L10755) `Store/findIdsCurrentProgress` | `Store.findIdsProgress` (10755); `Store.query` (10757, 10758, 10771, 10773); `Store.recordCount` (10763, 10791); `SQLite.iterate` (10788); `SQLite.prepare` (10788, 10796, 10797); `Store.sql` (10788, 10796, 10797); `SQLite.get` (10800); `SQLite.all` (10806) | GATED-STORE |
| [packages/store/src/store.ts:10825](../../packages/store/src/store.ts#L10825) `Store/findIdsHere` | `Store.query` (10825, 10830, 10832); `SQLite.iterate` (10843); `SQLite.prepare` (10843); `Store.sql` (10843) | GATED-STORE |
| [packages/store/src/store.ts:9277](../../packages/store/src/store.ts#L9277) `Store/findSource` | `Store.query` (9277); `SQLite.all` (9286, 9303); `SQLite.prepare` (9286, 9294, 9302); `Store.sql` (9286, 9291, 9294, 9299, 9302, 9316, 9318); `Calculations.globalValue` (9308); `Calculations.unstoredValue` (9309); `Calculations.related` (9313) | CORE |
| [packages/store/src/store.ts:3176](../../packages/store/src/store.ts#L3176) `Store/flushDeferredSecurity` | `Store.sql` (3176) | CORE |
| [packages/store/src/store.ts:10298](../../packages/store/src/store.ts#L10298) `Store/forgetStandInValues` | `Store.sql` (10298, 10319); `SQLite.prepare` (10319) | CORE |
| [packages/store/src/store.ts:5086](../../packages/store/src/store.ts#L5086) `Store/forgetStandIns` | `SQLite.prepare` (5086); `Store.sql` (5086) | CORE |
| [packages/store/src/store.ts:7588](../../packages/store/src/store.ts#L7588) `Store/foundSetPage` | `rowsById` (7588) | CORE |
| [packages/store/src/store.ts:7604](../../packages/store/src/store.ts#L7604) `Store/foundSetRowsCurrent` | `Store.viewableIds` (7604); `Store.row` (7620) | GATED-STORE |
| [packages/store/src/store.ts:3837](../../packages/store/src/store.ts#L3837) `Store/gateAgentWrite` | `SQLite.get` (3837); `SQLite.prepare` (3837, 3839); `Store.sql` (3837, 3839) | CORE |
| [packages/store/src/store.ts:6024](../../packages/store/src/store.ts#L6024) `Store/generateRecoveryCodes` | `SQLite.prepare` (6024, 6027); `Store.sql` (6024, 6027) | CORE |
| [packages/store/src/store.ts:9405](../../packages/store/src/store.ts#L9405) `Store/getCurrent` | `Store.get` (9405); `Store.row` (9406, 9406, 9420); `SQLite.all` (9423); `SQLite.prepare` (9423); `Store.sql` (9423) | GATED-STORE |
| [packages/store/src/store.ts:9443](../../packages/store/src/store.ts#L9443) `Store/getManyCurrent` | `Store.getMany` (9443); `SQLite.get` (9461); `SQLite.prepare` (9461); `Store.sql` (9461) | GATED-STORE |
| [packages/store/src/store.ts:9454](../../packages/store/src/store.ts#L9454) `Store/getManyCurrent/[Symbol.iterator]` | `rowsById` (9454) | GATED-STORE |
| [packages/store/src/store.ts:1403](../../packages/store/src/store.ts#L1403) `Store/grantFullAccessClients` | `SQLite.prepare` (1403); `Store.sql` (1403) | CORE |
| [packages/store/src/store.ts:10860](../../packages/store/src/store.ts#L10860) `Store/groupSummariesCurrent` | `Store.groupSummaries` (10860); `Store.viewableIds` (10865); `Calculations.collect` (10881); `rowsById` (10881, 10931); `Calculations.collector` (10903) | GATED-STORE |
| [packages/store/src/store.ts:10929](../../packages/store/src/store.ts#L10929) `Store/groupSummariesCurrent/flush` | `Calculations.collector` (10929) | GATED-STORE |
| [packages/store/src/store.ts:10893](../../packages/store/src/store.ts#L10893) `Store/groupSummariesCurrent/key` | `Calculations.value` (10893); `Calculations.related` (10895) | GATED-STORE |
| [packages/store/src/store.ts:1430](../../packages/store/src/store.ts#L1430) `Store/hasOwnPassword` | `SQLite.get` (1430); `SQLite.prepare` (1430); `Store.sql` (1430) | CORE |
| [packages/store/src/store.ts:5879](../../packages/store/src/store.ts#L5879) `Store/hasPasskey` | `SQLite.get` (5879); `SQLite.prepare` (5879); `Store.sql` (5879) | CORE |
| [packages/store/src/store.ts:1411](../../packages/store/src/store.ts#L1411) `Store/hasProvingPassword` | `SQLite.get` (1411); `SQLite.prepare` (1411); `Store.sql` (1411) | CORE |
| [packages/store/src/store.ts:8875](../../packages/store/src/store.ts#L8875) `Store/hasTable` | `SQLite.get` (8875); `SQLite.prepare` (8875); `Store.sql` (8875) | CORE |
| [packages/store/src/store.ts:5738](../../packages/store/src/store.ts#L5738) `Store/hasTotp` | `SQLite.get` (5738); `SQLite.prepare` (5738); `Store.sql` (5738) | CORE |
| [packages/store/src/store.ts:5209](../../packages/store/src/store.ts#L5209) `Store/identityAllowed` | `SQLite.get` (5209, 5215, 5221); `SQLite.prepare` (5209, 5215, 5221); `Store.sql` (5209, 5215, 5221) | CORE |
| [packages/store/src/store.ts:7058](../../packages/store/src/store.ts#L7058) `Store/image` | `SQLite.get` (7058); `SQLite.prepare` (7058); `Store.sql` (7058) | CORE |
| [packages/store/src/store.ts:7068](../../packages/store/src/store.ts#L7068) `Store/images` | `SQLite.all` (7068); `SQLite.prepare` (7068); `Store.sql` (7068) | CORE |
| [packages/store/src/store.ts:4930](../../packages/store/src/store.ts#L4930) `Store/importAccounts` | `SQLite.all` (4930); `SQLite.prepare` (4930); `Store.sql` (4930) | CORE |
| [packages/store/src/store.ts:1744](../../packages/store/src/store.ts#L1744) `Store/independentWindowWrite` | `SQLite.get` (1744); `SQLite.prepare` (1744, 1752, 1812); `Store.sql` (1744, 1752, 1762, 1790, 1807, 1812, 1815); `SQLite.all` (1752); `Store.row` (1810) | CORE |
| [packages/store/src/store.ts:2223](../../packages/store/src/store.ts#L2223) `Store/nextRecordId` | `SQLite.get` (2223); `SQLite.prepare` (2223); `Store.sql` (2223) | CORE |
| [packages/store/src/store.ts:1589](../../packages/store/src/store.ts#L1589) `Store/securityChainHeadAudit` | `SQLite.get` (1589); `SQLite.prepare` (1589); `Store.sql` (1589) | CORE |
| [packages/store/src/store.ts:8887](../../packages/store/src/store.ts#L8887) `Store/indexedFields` | `SQLite.all` (8887, 8888); `SQLite.prepare` (8887, 8888); `Store.sql` (8887, 8888) | CORE |
| [packages/store/src/store.ts:11278](../../packages/store/src/store.ts#L11278) `Store/internalRoots` | `SQLite.get` (11278); `SQLite.prepare` (11278, 11280); `SQLite.all` (11280) | CORE |
| [packages/store/src/store.ts:3673](../../packages/store/src/store.ts#L3673) `Store/isAgent` | `SQLite.get` (3673); `SQLite.prepare` (3673); `Store.sql` (3673) | CORE |
| [packages/store/src/store.ts:3776](../../packages/store/src/store.ts#L3776) `Store/isExternal` | `SQLite.get` (3776); `SQLite.prepare` (3776); `Store.sql` (3776) | CORE |
| [packages/store/src/store.ts:5793](../../packages/store/src/store.ts#L5793) `Store/issueWebauthnChallenge` | `SQLite.prepare` (5793, 5795, 5796, 5798); `Store.sql` (5793, 5795, 5796, 5798); `SQLite.get` (5795) | CORE |
| [packages/store/src/store.ts:11141](../../packages/store/src/store.ts#L11141) `Store/iterateCommitted` | `SQLite.iterate` (11141) | CORE |
| [packages/store/src/store.ts:1684](../../packages/store/src/store.ts#L1684) `Store/joinTransaction` | `Store.sql` (1684, 1685, 1687, 1689, 1695, 1698) | CORE |
| [packages/store/src/store.ts:10531](../../packages/store/src/store.ts#L10531) `Store/keyStepWork` | `Store.sql` (10531, 10537, 10541, 10543) | CORE |
| [packages/store/src/store.ts:6925](../../packages/store/src/store.ts#L6925) `Store/knownSharedAccount` | `SQLite.get` (6925); `SQLite.prepare` (6925); `Store.sql` (6925) | CORE |
| [packages/store/src/store.ts:4403](../../packages/store/src/store.ts#L4403) `Store/lastSignIns` | `Store.auditLog` (4403) | CORE |
| [packages/store/src/store.ts:10349](../../packages/store/src/store.ts#L10349) `Store/latestDeleteSeq` | `SQLite.get` (10349); `SQLite.prepare` (10349); `Store.sql` (10349) | CORE |
| [packages/store/src/store.ts:7098](../../packages/store/src/store.ts#L7098) `Store/layout` | `SQLite.get` (7098); `SQLite.prepare` (7098); `Store.sql` (7098) | CORE |
| [packages/store/src/store.ts:3346](../../packages/store/src/store.ts#L3346) `Store/layoutHistory` | `SQLite.all` (3346); `SQLite.prepare` (3346); `Store.sql` (3346) | CORE |
| [packages/store/src/store.ts:6988](../../packages/store/src/store.ts#L6988) `Store/layouts` | `SQLite.all` (6988); `SQLite.prepare` (6988); `Store.sql` (6988) | CORE |
| [packages/store/src/store.ts:4703](../../packages/store/src/store.ts#L4703) `Store/leastPrivilege` | `SQLite.all` (4703); `SQLite.prepare` (4703); `Store.sql` (4703) | CORE |
| [packages/store/src/store.ts:5307](../../packages/store/src/store.ts#L5307) `Store/ledgerRow` | `SQLite.get` (5307, 5308); `SQLite.prepare` (5307, 5308); `Store.sql` (5307, 5308) | AUTH |
| [packages/store/src/store.ts:5319](../../packages/store/src/store.ts#L5319) `Store/ledgerWrite` | `Store.sql` (5319, 5320, 5322, 5324, 5327, 5327) | AUTH |
| [packages/store/src/store.ts:5013](../../packages/store/src/store.ts#L5013) `Store/limitAccountImport` | `SQLite.prepare` (5013, 5014, 5017); `Store.sql` (5013, 5014, 5017); `SQLite.get` (5014) | CORE |
| [packages/store/src/store.ts:3626](../../packages/store/src/store.ts#L3626) `Store/linkIdentity` | `SQLite.get` (3626); `SQLite.prepare` (3626); `Store.sql` (3626) | CORE |
| [packages/store/src/store.ts:3618](../../packages/store/src/store.ts#L3618) `Store/linkPrincipal` | `SQLite.get` (3618); `SQLite.prepare` (3618); `Store.sql` (3618) | CORE |
| [packages/store/src/store.ts:4289](../../packages/store/src/store.ts#L4289) `Store/markPiiField` | `SQLite.prepare` (4289); `Store.sql` (4289) | CORE |
| [packages/store/src/store.ts:8026](../../packages/store/src/store.ts#L8026) `Store/markRepeating` | `SQLite.prepare` (8026); `Store.sql` (8026) | CORE |
| [packages/store/src/store.ts:11074](../../packages/store/src/store.ts#L11074) `Store/matchIds` | `Store.matchIds` (11074); `SQLite.all` (11080); `SQLite.prepare` (11080); `Store.sql` (11080) | CORE |
| [packages/store/src/store.ts:1445](../../packages/store/src/store.ts#L1445) `Store/meta` | `SQLite.get` (1445); `SQLite.prepare` (1445); `Store.sql` (1445) | CORE |
| [packages/store/src/store.ts:1003](../../packages/store/src/store.ts#L1003) `Store/metadataVersions` | `SQLite.get` (1003); `SQLite.prepare` (1003); `Store.sql` (1003) | CORE |
| [packages/store/src/store.ts:8663](../../packages/store/src/store.ts#L8663) `Store/moveContainersIn` | `Store.sql` (8663, 8669, 8671, 8672, 8673, 8674, 8694, 8699, 8699, 8710, 8713, 8716, 8723); `SQLite.prepare` (8671, 8672, 8673, 8674, 8710, 8716); `SQLite.get` (8676, 8710, 8716) | CORE |
| [packages/store/src/store.ts:8585](../../packages/store/src/store.ts#L8585) `Store/moveContainersOut` | `Store.sql` (8585, 8593, 8595, 8597, 8602, 8603, 8623, 8629, 8631, 8633, 8633, 8639, 8639, 8644, 8646, 8648, 8648, 8654); `SQLite.get` (8593); `SQLite.prepare` (8593, 8602, 8603); `Store.container` (8605) | CORE |
| [packages/store/src/store.ts:4884](../../packages/store/src/store.ts#L4884) `Store/mustChangePassword` | `SQLite.get` (4884); `SQLite.prepare` (4884); `Store.sql` (4884) | CORE |
| [packages/store/src/store.ts:1381](../../packages/store/src/store.ts#L1381) `Store/nativeIdGuards` | `Store.sql` (1381, 1382, 1384) | CORE |
| [packages/store/src/store.ts:5613](../../packages/store/src/store.ts#L5613) `Store/objectUseSince` | `SQLite.get` (5613); `SQLite.prepare` (5613); `Store.sql` (5613) | CORE |
| [packages/store/src/store.ts:8847](../../packages/store/src/store.ts#L8847) `Store/orderBy` | `Store.valueListItems` (8847) | CORE |
| [packages/store/src/store.ts:8218](../../packages/store/src/store.ts#L8218) `Store/orphanContainerReport` | `SQLite.all` (8218); `SQLite.prepare` (8218); `Store.sql` (8218) | CORE |
| [packages/store/src/store.ts:5845](../../packages/store/src/store.ts#L5845) `Store/passkeyAllowList` | `SQLite.all` (5845); `SQLite.prepare` (5845); `Store.sql` (5845) | CORE |
| [packages/store/src/store.ts:5884](../../packages/store/src/store.ts#L5884) `Store/passkeyIds` | `SQLite.all` (5884); `SQLite.prepare` (5884); `Store.sql` (5884) | CORE |
| [packages/store/src/store.ts:5872](../../packages/store/src/store.ts#L5872) `Store/passkeys` | `SQLite.all` (5872); `SQLite.prepare` (5872); `Store.sql` (5872) | CORE |
| [packages/store/src/store.ts:4923](../../packages/store/src/store.ts#L4923) `Store/passwordDaysRemaining` | `SQLite.get` (4923); `SQLite.prepare` (4923); `Store.sql` (4923) | CORE |
| [packages/store/src/store.ts:3861](../../packages/store/src/store.ts#L3861) `Store/pendingChanges` | `SQLite.all` (3861); `SQLite.prepare` (3861); `Store.sql` (3861) | CORE |
| [packages/store/src/store.ts:1463](../../packages/store/src/store.ts#L1463) `Store/persistentData` | `SQLite.get` (1463) | CORE |
| [packages/store/src/store.ts:1472](../../packages/store/src/store.ts#L1472) `Store/persistentDataIds` | `SQLite.all` (1472) | CORE |
| [packages/store/src/store.ts:1453](../../packages/store/src/store.ts#L1453) `Store/persistentTable` | `Store.sql` (1453) | CORE |
| [packages/store/src/store.ts:10192](../../packages/store/src/store.ts#L10192) `Store/portalContainerTarget` | `Store.row` (10192); `relatedIdList` (10194) | CORE |
| [packages/store/src/store.ts:7643](../../packages/store/src/store.ts#L7643) `Store/portalCountsCurrent` | `Store.canView` (7643); `Store.row` (7670) | GATED-STORE |
| [packages/store/src/store.ts:7881](../../packages/store/src/store.ts#L7881) `Store/portalRows` | `relatedRows` (7881); `relatedIdList` (7882); `Store.viewableSet` (7885); `rowsById` (7910, 7948); `Calculations.related` (7924) | CORE |
| [packages/store/src/store.ts:7892](../../packages/store/src/store.ts#L7892) `Store/portalRows/context` | `Calculations.context` (7892) | CORE |
| [packages/store/src/store.ts:7902](../../packages/store/src/store.ts#L7902) `Store/portalRows/valueOf` | `Calculations.value` (7902) | CORE |
| [packages/store/src/store.ts:2599](../../packages/store/src/store.ts#L2599) `Store/prepared` | `SQLite.prepare` (2599); `Store.sql` (2599) | CORE |
| [packages/store/src/store.ts:4995](../../packages/store/src/store.ts#L4995) `Store/previewAccountImport` | `Store.sql` (4995, 4996, 5005) | CORE |
| [packages/store/src/store.ts:6688](../../packages/store/src/store.ts#L6688) `Store/previewRecordRuleCurrent` | `SQLite.get` (6688); `SQLite.prepare` (6688, 6691); `Store.sql` (6688, 6691); `SQLite.all` (6691); `Calculations.context` (6697, 6713) | CORE |
| [packages/store/src/store.ts:9368](../../packages/store/src/store.ts#L9368) `Store/previewRow` | `Store.row` (9368) | CORE |
| [packages/store/src/store.ts:6099](../../packages/store/src/store.ts#L6099) `Store/privilegeSets` | `Store.sql` (6099) | CORE |
| [packages/store/src/store.ts:2831](../../packages/store/src/store.ts#L2831) `Store/pruneAudit` | `Store.sql` (2831, 2833, 2835); `SQLite.get` (2833); `SQLite.prepare` (2833) | CORE |
| [packages/store/src/store.ts:8253](../../packages/store/src/store.ts#L8253) `Store/purgeOrphanContainers` | `Store.sql` (8253, 8257, 8266, 8269, 8270, 8275, 8276, 8278, 8278); `Store.orphanContainerReport` (8261); `SQLite.get` (8266); `SQLite.prepare` (8266, 8269, 8270) | CORE |
| [packages/store/src/store.ts:11398](../../packages/store/src/store.ts#L11398) `Store/query` | `SQLite.iterate` (11398) | CORE |
| [packages/store/src/store.ts:11438](../../packages/store/src/store.ts#L11438) `Store/queryWithOriginsCurrent` | `SQLite.iterate` (11438); `SQLite.all` (11447, 11450); `SQLite.prepare` (11447, 11450) | CORE |
| [packages/store/src/store.ts:11190](../../packages/store/src/store.ts#L11190) `Store/readOnlyChecked` | `SQLite.prepare` (11190, 11194, 11203, 11208); `SQLite.all` (11194, 11203, 11208) | CORE |
| [packages/store/src/store.ts:3598](../../packages/store/src/store.ts#L3598) `Store/recompute` | `SQLite.prepare` (3598, 3602); `Store.sql` (3598, 3602); `SQLite.iterate` (3602); `Calculations.computeStoredStyled` (3603); `Calculations.value` (3603) | CORE |
| [packages/store/src/store.ts:2614](../../packages/store/src/store.ts#L2614) `Store/recordAsOf` | `SQLite.get` (2614, 2616); `SQLite.prepare` (2614, 2616, 2618, 2619); `Store.sql` (2614, 2616, 2618, 2619); `SQLite.all` (2618, 2619) | CORE |
| [packages/store/src/store.ts:2310](../../packages/store/src/store.ts#L2310) `Store/recordCount` | `SQLite.get` (2310); `SQLite.prepare` (2310); `Store.sql` (2310) | CORE |
| [packages/store/src/store.ts:2691](../../packages/store/src/store.ts#L2691) `Store/recordLife` | `SQLite.all` (2691); `SQLite.prepare` (2691); `Store.sql` (2691) | CORE |
| [packages/store/src/store.ts:5544](../../packages/store/src/store.ts#L5544) `Store/recordObjectUse` | `Store.sql` (5544) | CORE |
| [packages/store/src/store.ts:9894](../../packages/store/src/store.ts#L9894) `Store/recordViewable` | `Store.row` (9894) | GATED-STORE |
| [packages/store/src/store.ts:1510](../../packages/store/src/store.ts#L1510) `Store/recordedFormat` | `Store.sql` (1510) | CORE |
| [packages/store/src/store.ts:8557](../../packages/store/src/store.ts#L8557) `Store/recoverContainersOut` | `SQLite.prepare` (8557); `Store.sql` (8557); `SQLite.get` (8560) | CORE |
| [packages/store/src/store.ts:1613](../../packages/store/src/store.ts#L1613) `Store/recoverPendingExternalFiles` | `Store.sql` (1613, 1615, 1639, 1641); `SQLite.prepare` (1615); `SQLite.get` (1626) | CORE |
| [packages/store/src/store.ts:6042](../../packages/store/src/store.ts#L6042) `Store/recoveryCodesRemaining` | `SQLite.get` (6042); `SQLite.prepare` (6042); `Store.sql` (6042) | CORE |
| [packages/store/src/store.ts:11230](../../packages/store/src/store.ts#L11230) `Store/refreshDecimalSqlViews` | `SQLite.get` (11230); `SQLite.prepare` (11230) | CORE |
| [packages/store/src/store.ts:3767](../../packages/store/src/store.ts#L3767) `Store/refuseLookalikeAccount` | `SQLite.all` (3767); `SQLite.prepare` (3767); `Store.sql` (3767) | CORE |
| [packages/store/src/store.ts:5908](../../packages/store/src/store.ts#L5908) `Store/registerPasskey` | `SQLite.prepare` (5908); `Store.sql` (5908) | CORE |
| [packages/store/src/store.ts:3896](../../packages/store/src/store.ts#L3896) `Store/rejectPending` | `SQLite.get` (3896); `SQLite.prepare` (3896, 3898); `Store.sql` (3896, 3898) | CORE |
| [packages/store/src/store.ts:9120](../../packages/store/src/store.ts#L9120) `Store/relatedCriteria` | `SQLite.iterate` (9120); `SQLite.prepare` (9120); `Store.sql` (9120) | CORE |
| [packages/store/src/store.ts:9117](../../packages/store/src/store.ts#L9117) `Store/relatedCriteria/matched` | `relatedRows` (9117) | CORE |
| [packages/store/src/store.ts:7430](../../packages/store/src/store.ts#L7430) `Store/relatedValues` | `Calculations.globalValue` (7430); `Calculations.unstoredValue` (7432) | CORE |
| [packages/store/src/store.ts:5921](../../packages/store/src/store.ts#L5921) `Store/removePasskey` | `SQLite.get` (5921); `SQLite.prepare` (5921, 5922); `Store.sql` (5921, 5922) | CORE |
| [packages/store/src/store.ts:10369](../../packages/store/src/store.ts#L10369) `Store/restoreDeletedRowLocked` | `SQLite.get` (10369, 10374); `SQLite.prepare` (10369, 10370, 10374, 10384); `Store.sql` (10369, 10370, 10374, 10384); `SQLite.all` (10370) | CORE |
| [packages/store/src/store.ts:2649](../../packages/store/src/store.ts#L2649) `Store/restoreRecord` | `Store.recordAsOf` (2649); `SQLite.get` (2653); `SQLite.prepare` (2653, 2658, 2667, 2678); `Store.sql` (2653, 2658, 2667, 2678) | CORE |
| [packages/store/src/store.ts:2707](../../packages/store/src/store.ts#L2707) `Store/revertAuditEntry` | `SQLite.get` (2707); `SQLite.prepare` (2707); `Store.sql` (2707); `Store.canViewRecord` (2709); `Store.auditLog` (2712) | CORE |
| [packages/store/src/store.ts:5669](../../packages/store/src/store.ts#L5669) `Store/revokeApiToken` | `SQLite.prepare` (5669); `Store.sql` (5669) | CORE |
| [packages/store/src/store.ts:5192](../../packages/store/src/store.ts#L5192) `Store/revokeSignInCredentials` | `SQLite.prepare` (5192, 5193, 5194); `Store.sql` (5192, 5193, 5194) | AUTH |
| [packages/store/src/store.ts:9386](../../packages/store/src/store.ts#L9386) `Store/row` | `SQLite.get` (9386) | CORE |
| [packages/store/src/store.ts:11334](../../packages/store/src/store.ts#L11334) `Store/rowsOf` | `SQLite.iterate` (11334, 11343) | CORE |
| [packages/store/src/store.ts:6493](../../packages/store/src/store.ts#L6493) `Store/ruleOutcome` | `Calculations.context` (6493) | CORE |
| [packages/store/src/store.ts:9231](../../packages/store/src/store.ts#L9231) `Store/runningSummaryValues` | `Store.viewableIds` (9231); `rowsById` (9233); `Calculations.value` (9244, 9250); `Calculations.related` (9261) | GATED-STORE |
| [packages/store/src/store.ts:6128](../../packages/store/src/store.ts#L6128) `Store/savePrivilegeSet` | `SQLite.prepare` (6128, 6136); `Store.sql` (6128, 6136) | AUTH |
| [packages/store/src/store.ts:4120](../../packages/store/src/store.ts#L4120) `Store/saveScriptTest` | `SQLite.prepare` (4120); `Store.sql` (4120) | CORE |
| [packages/store/src/store.ts:6653](../../packages/store/src/store.ts#L6653) `Store/scopedTableSql` | `Store.viewableIds` (6653); `SQLite.all` (6656); `SQLite.prepare` (6656); `Store.sql` (6656) | GATED-STORE |
| [packages/store/src/store.ts:3336](../../packages/store/src/store.ts#L3336) `Store/scriptHistory` | `SQLite.all` (3336); `SQLite.prepare` (3336); `Store.sql` (3336) | CORE |
| [packages/store/src/store.ts:3009](../../packages/store/src/store.ts#L3009) `Store/securityChange` | `Store.sql` (3009, 3011); `SQLite.prepare` (3011) | CORE |
| [packages/store/src/store.ts:2573](../../packages/store/src/store.ts#L2573) `Store/securityEvents` | `Store.auditLog` (2573) | CORE |
| [packages/store/src/store.ts:5393](../../packages/store/src/store.ts#L5393) `Store/securityToken` | `SQLite.get` (5393); `SQLite.prepare` (5393); `Store.sql` (5393) | CORE |
| [packages/store/src/store.ts:11364](../../packages/store/src/store.ts#L11364) `Store/selectHeldCurrent` | `Store.sql` (11364, 11365, 11367); `SQLite.prepare` (11365) | CORE |
| [packages/store/src/store.ts:10674](../../packages/store/src/store.ts#L10674) `Store/selectIdsCurrent` | `Store.selectIds` (10674); `SQLite.all` (10680); `SQLite.prepare` (10680); `Store.sql` (10680) | GATED-STORE |
| [packages/store/src/store.ts:11354](../../packages/store/src/store.ts#L11354) `Store/selectIn` | `Store.select` (11354) | CORE |
| [packages/store/src/store.ts:1976](../../packages/store/src/store.ts#L1976) `Store/selfContainedCopy` | `Store.sql` (1976); `SQLite.all` (1981); `SQLite.prepare` (1981, 1983, 1984, 1985) | CORE |
| [packages/store/src/store.ts:5171](../../packages/store/src/store.ts#L5171) `Store/setAccountActive` | `SQLite.prepare` (5171, 5179, 5180); `Store.sql` (5171, 5179, 5180) | AUTH |
| [packages/store/src/store.ts:5412](../../packages/store/src/store.ts#L5412) `Store/setAccountLocalOnly` | `SQLite.prepare` (5412); `Store.sql` (5412) | CORE |
| [packages/store/src/store.ts:6284](../../packages/store/src/store.ts#L6284) `Store/setAccountPrivilegeSet` | `SQLite.get` (6284); `SQLite.prepare` (6284, 6287, 6291); `Store.sql` (6284, 6287, 6291) | AUTH |
| [packages/store/src/store.ts:5421](../../packages/store/src/store.ts#L5421) `Store/setAccountRequire2fa` | `SQLite.prepare` (5421); `Store.sql` (5421) | CORE |
| [packages/store/src/store.ts:3797](../../packages/store/src/store.ts#L3797) `Store/setAgentAccount` | `SQLite.get` (3797); `SQLite.prepare` (3797, 3803); `Store.sql` (3797, 3803) | CORE |
| [packages/store/src/store.ts:4164](../../packages/store/src/store.ts#L4164) `Store/setAiAllowed` | `SQLite.prepare` (4164); `Store.sql` (4164) | CORE |
| [packages/store/src/store.ts:4247](../../packages/store/src/store.ts#L4247) `Store/setAiPolicy` | `SQLite.prepare` (4247); `Store.sql` (4247) | CORE |
| [packages/store/src/store.ts:6912](../../packages/store/src/store.ts#L6912) `Store/setAllowBlankPasswordFromLan` | `SQLite.prepare` (6912); `Store.sql` (6912) | CORE |
| [packages/store/src/store.ts:2809](../../packages/store/src/store.ts#L2809) `Store/setAuditSettings` | `SQLite.prepare` (2809); `Store.sql` (2809) | CORE |
| [packages/store/src/store.ts:8776](../../packages/store/src/store.ts#L8776) `Store/setContainer` | `Store.sql` (8776); `Store.row` (8782) | CORE |
| [packages/store/src/store.ts:3749](../../packages/store/src/store.ts#L3749) `Store/setExternalAccount` | `SQLite.get` (3749); `SQLite.prepare` (3749, 3754); `Store.sql` (3749, 3754) | CORE |
| [packages/store/src/store.ts:4870](../../packages/store/src/store.ts#L4870) `Store/setMustChangePassword` | `SQLite.prepare` (4870); `Store.sql` (4870) | CORE |
| [packages/store/src/store.ts:3949](../../packages/store/src/store.ts#L3949) `Store/setPassword` | `SQLite.get` (3949); `SQLite.prepare` (3949, 3955, 3964, 3971, 3972, 3973); `Store.sql` (3949, 3955, 3964, 3971, 3972, 3973) | AUTH |
| [packages/store/src/store.ts:4061](../../packages/store/src/store.ts#L4061) `Store/setPasswordPolicy` | `SQLite.prepare` (4061); `Store.sql` (4061) | CORE |
| [packages/store/src/store.ts:1478](../../packages/store/src/store.ts#L1478) `Store/setPersistentData` | `SQLite.prepare` (1478, 1482); `Store.sql` (1478, 1482) | CORE |
| [packages/store/src/store.ts:4267](../../packages/store/src/store.ts#L4267) `Store/setPiiIsolation` | `SQLite.prepare` (4267); `Store.sql` (4267) | CORE |
| [packages/store/src/store.ts:4097](../../packages/store/src/store.ts#L4097) `Store/setRequireTotpForFullAccess` | `SQLite.prepare` (4097); `Store.sql` (4097) | CORE |
| [packages/store/src/store.ts:4179](../../packages/store/src/store.ts#L4179) `Store/setScriptNetwork` | `SQLite.prepare` (4179); `Store.sql` (4179) | CORE |
| [packages/store/src/store.ts:4236](../../packages/store/src/store.ts#L4236) `Store/setSqlRequiresFmxdbc` | `SQLite.prepare` (4236); `Store.sql` (4236) | CORE |
| [packages/store/src/store.ts:9815](../../packages/store/src/store.ts#L9815) `Store/setStoredCalcValues` | `SQLite.prepare` (9815, 9816); `Store.sql` (9815, 9816); `SQLite.get` (9820) | CORE |
| [packages/store/src/store.ts:8879](../../packages/store/src/store.ts#L8879) `Store/setUserPref` | `Store.sql` (8879, 8880, 8881); `SQLite.prepare` (8880, 8881) | CORE |
| [packages/store/src/store.ts:4220](../../packages/store/src/store.ts#L4220) `Store/setWebViewerHosts` | `SQLite.prepare` (4220); `Store.sql` (4220) | CORE |
| [packages/store/src/store.ts:5346](../../packages/store/src/store.ts#L5346) `Store/settleSignIns` | `SQLite.all` (5346, 5352); `SQLite.prepare` (5346, 5352, 5358, 5362, 5364); `Store.sql` (5346, 5352, 5358, 5362, 5364) | AUTH |
| [packages/store/src/store.ts:2107](../../packages/store/src/store.ts#L2107) `Store/shareResults` | `Store.sql` (2107) | CORE |
| [packages/store/src/store.ts:1540](../../packages/store/src/store.ts#L1540) `Store/shipWal` | `Store.sql` (1540) | CORE |
| [packages/store/src/store.ts:5293](../../packages/store/src/store.ts#L5293) `Store/signInBase` | `SQLite.get` (5293); `SQLite.prepare` (5293); `Store.sql` (5293) | AUTH |
| [packages/store/src/store.ts:5295](../../packages/store/src/store.ts#L5295) `Store/signInBase/identity` | `SQLite.get` (5295); `SQLite.prepare` (5295); `Store.sql` (5295) | AUTH |
| [packages/store/src/store.ts:5282](../../packages/store/src/store.ts#L5282) `Store/signInMark` | `SQLite.prepare` (5282); `Store.sql` (5282) | AUTH |
| [packages/store/src/store.ts:10972](../../packages/store/src/store.ts#L10972) `Store/sortIdsCurrentProgress` | `Store.sortIds` (10972); `Store.sortIdsProgress` (10972); `SQLite.all` (10985); `SQLite.prepare` (10985, 11060); `Store.sql` (10985, 11060); `Store.valueListItems` (10993); `rowsById` (11005); `Calculations.globalValue` (11008); `Calculations.unstoredValue` (11009); `Calculations.related` (11015); `SQLite.iterate` (11060) | GATED-STORE |
| [packages/store/src/store.ts:9045](../../packages/store/src/store.ts#L9045) `Store/sortedPage` | `SQLite.iterate` (9045); `SQLite.prepare` (9045, 9060); `Store.sql` (9045, 9060); `SQLite.all` (9060) | CORE |
| [packages/store/src/store.ts:11146](../../packages/store/src/store.ts#L11146) `Store/storedFileId` | `SQLite.get` (11146); `SQLite.prepare` (11146) | CORE |
| [packages/store/src/store.ts:9193](../../packages/store/src/store.ts#L9193) `Store/summaries` | `Calculations.wholeTable` (9193); `Calculations.collect` (9213, 9218) | CORE |
| [packages/store/src/store.ts:9209](../../packages/store/src/store.ts#L9209) `Store/summaries/recs` | `SQLite.iterate` (9209); `SQLite.prepare` (9209); `Store.sql` (9209) | CORE |
| [packages/store/src/store.ts:5859](../../packages/store/src/store.ts#L5859) `Store/takeWebauthnChallenge` | `SQLite.get` (5859); `SQLite.prepare` (5859, 5863); `Store.sql` (5859, 5863) | CORE |
| [packages/store/src/store.ts:8932](../../packages/store/src/store.ts#L8932) `Store/timeFind` | `Store.query` (8932) | CORE |
| [packages/store/src/store.ts:8946](../../packages/store/src/store.ts#L8946) `Store/reportFind` | `Store.query` (8946, 8948, 8949); `Store.recordCount` (8951) | CORE |
| [packages/store/src/store.ts:7367](../../packages/store/src/store.ts#L7367) `Store/toRecord` | `Calculations.value` (7367, 7377); `Calculations.globalValue` (7371); `Calculations.unstoredStyled` (7376) | CORE |
| [packages/store/src/store.ts:5743](../../packages/store/src/store.ts#L5743) `Store/totpAccounts` | `SQLite.all` (5743); `SQLite.prepare` (5743); `Store.sql` (5743) | CORE |
| [packages/store/src/store.ts:1552](../../packages/store/src/store.ts#L1552) `Store/trial` | `Store.sql` (1552) | CORE |
| [packages/store/src/store.ts:1557](../../packages/store/src/store.ts#L1557) `Store/trial/undo` | `Store.sql` (1557) | CORE |
| [packages/store/src/store.ts:11102](../../packages/store/src/store.ts#L11102) `Store/truncate/run` | `Store.sql` (11102, 11104, 11111, 11113, 11115, 11116); `SQLite.prepare` (11104, 11111); `SQLite.all` (11106) | CORE |
| [packages/store/src/store.ts:3696](../../packages/store/src/store.ts#L3696) `Store/unmigratedAccounts` | `SQLite.all` (3696); `SQLite.prepare` (3696); `Store.sql` (3696) | CORE |
| [packages/store/src/store.ts:4776](../../packages/store/src/store.ts#L4776) `Store/unusedAccess` | `SQLite.get` (4776); `SQLite.prepare` (4776, 4785); `Store.sql` (4776, 4785); `SQLite.all` (4785) | CORE |
| [packages/store/src/store.ts:4824](../../packages/store/src/store.ts#L4824) `Store/unusedObjects` | `SQLite.get` (4824); `SQLite.prepare` (4824, 4827); `Store.sql` (4824, 4827); `SQLite.all` (4827) | CORE |
| [packages/store/src/store.ts:5983](../../packages/store/src/store.ts#L5983) `Store/unusedRecoveryHashes` | `SQLite.all` (5983); `SQLite.prepare` (5983); `Store.sql` (5983) | CORE |
| [packages/store/src/store.ts:4606](../../packages/store/src/store.ts#L4606) `Store/unusualAccess` | `Store.auditLog` (4606, 4672) | CORE |
| [packages/store/src/store.ts:9636](../../packages/store/src/store.ts#L9636) `Store/update` | `Store.row` (9636); `Store.sql` (9667, 9668, 9707, 9710) | CORE |
| [packages/store/src/store.ts:9670](../../packages/store/src/store.ts#L9670) `Store/update/undo` | `Store.sql` (9670) | CORE |
| [packages/store/src/store.ts:10100](../../packages/store/src/store.ts#L10100) `Store/updatePortals` | `Store.row` (10100, 10136); `relatedRows` (10137) | CORE |
| [packages/store/src/store.ts:10110](../../packages/store/src/store.ts#L10110) `Store/updatePortals/portal/related` | `relatedIdList` (10110) | CORE |
| [packages/store/src/store.ts:10082](../../packages/store/src/store.ts#L10082) `Store/updateRelated` | `relatedRows` (10082) | CORE |
| [packages/store/src/store.ts:4862](../../packages/store/src/store.ts#L4862) `Store/usageCounting` | `SQLite.get` (4862); `SQLite.prepare` (4862); `Store.sql` (4862) | CORE |
| [packages/store/src/store.ts:8870](../../packages/store/src/store.ts#L8870) `Store/userPrefs` | `SQLite.all` (8870); `SQLite.prepare` (8870); `Store.sql` (8870) | CORE |
| [packages/store/src/store.ts:7752](../../packages/store/src/store.ts#L7752) `Store/valueListItemsCurrent` | `Store.valueListItems` (7752); `Store.get` (7766); `relatedRows` (7767); `Store.row` (7767); `SQLite.iterate` (7769); `SQLite.prepare` (7769); `Store.sql` (7769); `Calculations.related` (7779); `Calculations.value` (7783, 7784) | GATED-STORE |
| [packages/store/src/store.ts:10291](../../packages/store/src/store.ts#L10291) `Store/vaultHeld` | `SQLite.get` (10291); `SQLite.prepare` (10291); `Store.sql` (10291) | CORE |
| [packages/store/src/store.ts:5772](../../packages/store/src/store.ts#L5772) `Store/verifyTotp` | `SQLite.get` (5772); `SQLite.prepare` (5772, 5779); `Store.sql` (5772, 5779) | CORE |
| [packages/store/src/store.ts:2243](../../packages/store/src/store.ts#L2243) `Store/versionNumber` | `SQLite.get` (2243); `SQLite.prepare` (2243); `Store.sql` (2243) | CORE |
| [packages/store/src/store.ts:2118](../../packages/store/src/store.ts#L2118) `Store/versionTriggers` | `SQLite.get` (2118); `SQLite.prepare` (2118, 2123, 2124); `Store.sql` (2118, 2123, 2124, 2141, 2143, 2144, 2146); `SQLite.all` (2123, 2124) | CORE |
| [packages/store/src/store.ts:2086](../../packages/store/src/store.ts#L2086) `Store/warmSummariesCurrent` | `Calculations.wholeTable` (2086) | CORE |
| [packages/store/src/store.ts:4202](../../packages/store/src/store.ts#L4202) `Store/webViewerChecked` | `SQLite.get` (4202); `SQLite.prepare` (4202); `Store.sql` (4202) | CORE |
| [packages/store/src/store.ts:1844](../../packages/store/src/store.ts#L1844) `Store/withWriteTransaction` | `Store.sql` (1844, 1856, 1862, 1864, 1864) | CORE |
| [packages/store/src/store.ts:7302](../../packages/store/src/store.ts#L7302) `Store/wordIndex` | `Store.sql` (7302, 7310, 7315); `Store.recordCount` (7314); `SQLite.get` (7315); `SQLite.prepare` (7315) | CORE |
| [packages/store/src/store.ts:8450](../../packages/store/src/store.ts#L8450) `Store/writeExternalFile` | `Store.evaluateEach` (8450); `SQLite.prepare` (8473); `Store.sql` (8473) | CORE |
| [packages/store/src/store.ts:8474](../../packages/store/src/store.ts#L8474) `Store/writeExternalFile/taken` | `SQLite.get` (8474) | CORE |
| [packages/store/src/store.ts:5602](../../packages/store/src/store.ts#L5602) `Store/writeObjectUseRows` | `SQLite.prepare` (5602, 5603, 5608); `Store.sql` (5602, 5603, 5608) | CORE |
| [packages/store/src/store.ts:2298](../../packages/store/src/store.ts#L2298) `Store/writeToken` | `SQLite.get` (2298); `SQLite.prepare` (2298); `Store.sql` (2298) | CORE |
| [packages/store/src/store.ts:5574](../../packages/store/src/store.ts#L5574) `Store/writeUsage` | `Store.sql` (5574, 5575, 5577, 5581, 5583) | CORE |
| [packages/store/src/store.ts:5590](../../packages/store/src/store.ts#L5590) `Store/writeUsageRows` | `SQLite.prepare` (5590, 5591, 5597); `Store.sql` (5590, 5591, 5597) | CORE |
| [packages/store/src/store.ts:7023](../../packages/store/src/store.ts#L7023) `Store/design` | `SQLite.get` (7023) | CORE |
| [packages/store/src/store.ts:7045](../../packages/store/src/store.ts#L7045) `Store/themes` | `SQLite.get` (7045) | CORE |
| [packages/store/src/store.ts:5943](../../packages/store/src/store.ts#L5943) `Store/verifyPasskeyCredential` | `SQLite.get` (5943); `SQLite.prepare` (5943, 5955); `Store.sql` (5943, 5955) | CORE |
| [packages/store/src/store.ts:6883](../../packages/store/src/store.ts#L6883) `Store/passwordState` | `SQLite.get` (6883); `SQLite.prepare` (6883); `Store.sql` (6883) | CORE |
| [packages/store/src/store.ts:10235](../../packages/store/src/store.ts#L10235) `Store/deleteVisibility` | `Store.canViewRecord` (10235) | CORE |
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
