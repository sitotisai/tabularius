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
| [packages/cli/src/main.ts:2412](../../packages/cli/src/main.ts#L2412) `main` | `Store.orphanContainerReport` (2412); `Store.auditLog` (2885); `SQLite.get` (3144); `SQLite.prepare` (3144) | OPERATOR |
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
| [packages/server/src/admin.ts:2370](../../packages/server/src/admin.ts#L2370) `Admin/audit` | `Store.auditLog` (2370) | ADMIN |
| [packages/server/src/admin.ts:1090](../../packages/server/src/admin.ts#L1090) `Admin/handle` | `Store.externalContainerReport` (1090); `Store.orphanContainerReport` (1095, 1099) | ADMIN |
| [packages/server/src/admin.ts:2810](../../packages/server/src/admin.ts#L2810) `Admin/status` | `Store.externalContainerCount` (2810) | ADMIN |
| [packages/server/src/admin.ts:2453](../../packages/server/src/admin.ts#L2453) `Admin/viewAs` | `Store.find` (2453) | ADMIN |
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
| [packages/store/src/store.ts:5245](../../packages/store/src/store.ts#L5245) `Store/accountIdentityId` | `SQLite.get` (5245, 5251); `SQLite.prepare` (5245, 5250, 5251); `Store.sql` (5245, 5250, 5251) | CORE |
| [packages/store/src/store.ts:5239](../../packages/store/src/store.ts#L5239) `Store/accountIdentityIdIfSet` | `SQLite.get` (5239); `SQLite.prepare` (5239); `Store.sql` (5239) | CORE |
| [packages/store/src/store.ts:5201](../../packages/store/src/store.ts#L5201) `Store/accountInactive` | `SQLite.get` (5201); `SQLite.prepare` (5201); `Store.sql` (5201) | CORE |
| [packages/store/src/store.ts:5398](../../packages/store/src/store.ts#L5398) `Store/accountLocalOnly` | `SQLite.get` (5398); `SQLite.prepare` (5398); `Store.sql` (5398) | CORE |
| [packages/store/src/store.ts:6267](../../packages/store/src/store.ts#L6267) `Store/accountPrivilegeSet` | `SQLite.get` (6267); `SQLite.prepare` (6267); `Store.sql` (6267) | CORE |
| [packages/store/src/store.ts:5403](../../packages/store/src/store.ts#L5403) `Store/accountRequires2fa` | `SQLite.get` (5403); `SQLite.prepare` (5403); `Store.sql` (5403) | CORE |
| [packages/store/src/store.ts:5623](../../packages/store/src/store.ts#L5623) `Store/accountUsage` | `SQLite.get` (5623); `SQLite.prepare` (5623, 5624); `Store.sql` (5623, 5624); `SQLite.all` (5624); `Store.auditLog` (5640) | CORE |
| [packages/store/src/store.ts:3658](../../packages/store/src/store.ts#L3658) `Store/accounts` | `SQLite.all` (3658); `SQLite.prepare` (3658); `Store.sql` (3658) | CORE |
| [packages/store/src/store.ts:3654](../../packages/store/src/store.ts#L3654) `Store/accountsSharingLockout` | `SQLite.all` (3654); `SQLite.prepare` (3654); `Store.sql` (3654) | CORE |
| [packages/store/src/store.ts:8379](../../packages/store/src/store.ts#L8379) `Store/addContainer` | `SQLite.all` (8379); `SQLite.prepare` (8379, 8384, 8398, 8402, 8403); `Store.sql` (8379, 8384, 8398, 8400, 8402, 8403, 8405, 8408); `SQLite.get` (8389); `Store.containerRange` (8391) | CORE |
| [packages/store/src/store.ts:8425](../../packages/store/src/store.ts#L8425) `Store/addExternalContainer` | `SQLite.prepare` (8425); `Store.sql` (8425) | CORE |
| [packages/store/src/store.ts:8902](../../packages/store/src/store.ts#L8902) `Store/addFieldIndex` | `Store.sql` (8902) | CORE |
| [packages/store/src/store.ts:7078](../../packages/store/src/store.ts#L7078) `Store/addImage` | `Store.sql` (7078, 7079); `SQLite.prepare` (7079) | CORE |
| [packages/store/src/store.ts:6317](../../packages/store/src/store.ts#L6317) `Store/addProvisionedAccount` | `SQLite.get` (6317); `SQLite.prepare` (6317, 6321); `Store.sql` (6317, 6321) | CORE |
| [packages/store/src/store.ts:7497](../../packages/store/src/store.ts#L7497) `Store/addRelated` | `relatedRows` (7497); `rowsById` (7530); `firstRelatedEach` (7553) | CORE |
| [packages/store/src/store.ts:3676](../../packages/store/src/store.ts#L3676) `Store/agentNeedsApproval` | `SQLite.get` (3676); `SQLite.prepare` (3676); `Store.sql` (3676) | CORE |
| [packages/store/src/store.ts:6531](../../packages/store/src/store.ts#L6531) `Store/allowedIds` | `SQLite.iterate` (6531); `SQLite.prepare` (6531); `Store.sql` (6531) | CORE |
| [packages/store/src/store.ts:5680](../../packages/store/src/store.ts#L5680) `Store/apiToken` | `SQLite.get` (5680); `SQLite.prepare` (5680, 5698); `Store.sql` (5680, 5698) | CORE |
| [packages/store/src/store.ts:5656](../../packages/store/src/store.ts#L5656) `Store/apiTokens` | `SQLite.all` (5656); `SQLite.prepare` (5656); `Store.sql` (5656) | CORE |
| [packages/store/src/store.ts:3117](../../packages/store/src/store.ts#L3117) `Store/appendSecurityRow` | `Store.sql` (3117) | CORE |
| [packages/store/src/store.ts:4016](../../packages/store/src/store.ts#L4016) `Store/appendSecurityEvent` | `Store.sql` (4016) | CORE |
| [packages/store/src/store.ts:5021](../../packages/store/src/store.ts#L5021) `Store/applyAccountImport` | `Store.sql` (5021, 5029, 5058); `SQLite.get` (5029); `SQLite.prepare` (5029, 5058) | CORE |
| [packages/store/src/store.ts:2418](../../packages/store/src/store.ts#L2418) `Store/applyDesign` | `Store.sql` (2418, 2419, 2439, 2442, 2447, 2463, 2466, 2466); `SQLite.prepare` (2442, 2447) | CORE |
| [packages/store/src/store.ts:3872](../../packages/store/src/store.ts#L3872) `Store/approvePending` | `SQLite.get` (3872); `SQLite.prepare` (3872, 3883); `Store.sql` (3872, 3883) | CORE |
| [packages/store/src/store.ts:2908](../../packages/store/src/store.ts#L2908) `Store/audit/write` | `Store.sql` (2908) | CORE |
| [packages/store/src/store.ts:2530](../../packages/store/src/store.ts#L2530) `Store/auditLog` | `SQLite.all` (2530); `SQLite.prepare` (2530); `Store.sql` (2530) | CORE |
| [packages/store/src/store.ts:1956](../../packages/store/src/store.ts#L1956) `Store/backup` | `Store.sql` (1956) | CORE |
| [packages/store/src/store.ts:3682](../../packages/store/src/store.ts#L3682) `Store/blankPasswordAccounts` | `SQLite.all` (3682); `SQLite.prepare` (3682); `Store.sql` (3682) | CORE |
| [packages/store/src/store.ts:9488](../../packages/store/src/store.ts#L9488) `Store/canView` | `Store.canView` (9488); `Store.row` (9489) | GATED-STORE |
| [packages/store/src/store.ts:9470](../../packages/store/src/store.ts#L9470) `Store/canViewRecord` | `SQLite.get` (9470); `SQLite.prepare` (9470); `Store.sql` (9470) | GATED-STORE |
| [packages/store/src/store.ts:4950](../../packages/store/src/store.ts#L4950) `Store/canonicalAccount` | `SQLite.all` (4950); `SQLite.prepare` (4950); `Store.sql` (4950) | CORE |
| [packages/store/src/store.ts:10577](../../packages/store/src/store.ts#L10577) `Store/cascadeDelete` | `relatedRows` (10577) | CORE |
| [packages/store/src/store.ts:2253](../../packages/store/src/store.ts#L2253) `Store/changeOne` | `Store.sql` (2253, 2255) | CORE |
| [packages/store/src/store.ts:2256](../../packages/store/src/store.ts#L2256) `Store/changeOne/read` | `SQLite.get` (2256); `SQLite.prepare` (2256); `Store.sql` (2256) | CORE |
| [packages/store/src/store.ts:8760](../../packages/store/src/store.ts#L8760) `Store/checkContainerWrite` | `Store.row` (8760) | CORE |
| [packages/store/src/store.ts:10200](../../packages/store/src/store.ts#L10200) `Store/checkEditable` | `Store.row` (10200) | CORE |
| [packages/store/src/store.ts:1502](../../packages/store/src/store.ts#L1502) `Store/checkpoint` | `SQLite.get` (1502); `SQLite.prepare` (1502); `Store.sql` (1502) | CORE |
| [packages/store/src/store.ts:6303](../../packages/store/src/store.ts#L6303) `Store/clearAccountPrivilegeSet` | `SQLite.prepare` (6303); `Store.sql` (6303) | CORE |
| [packages/store/src/store.ts:1524](../../packages/store/src/store.ts#L1524) `Store/close` | `Store.sql` (1524) | CORE |
| [packages/store/src/store.ts:8728](../../packages/store/src/store.ts#L8728) `Store/compactFile` | `Store.sql` (8728, 8729, 8731) | CORE |
| [packages/store/src/store.ts:10701](../../packages/store/src/store.ts#L10701) `Store/computeValuesCurrent` | `Store.computeValues` (10701); `Store.sql` (10707, 10711); `SQLite.all` (10711); `SQLite.prepare` (10711) | GATED-STORE |
| [packages/store/src/store.ts:9139](../../packages/store/src/store.ts#L9139) `Store/computedRows` | `Store.sql` (9139, 9142, 9143, 9144, 9146, 9156, 9157, 9158, 9161); `SQLite.prepare` (9142, 9144, 9146, 9156); `SQLite.iterate` (9146); `Calculations.globalValue` (9149); `Calculations.unstoredValue` (9150); `Calculations.related` (9153); `SQLite.all` (9156) | CORE |
| [packages/store/src/store.ts:5725](../../packages/store/src/store.ts#L5725) `Store/confirmTotp` | `SQLite.get` (5725); `SQLite.prepare` (5725, 5727); `Store.sql` (5725, 5727) | CORE |
| [packages/store/src/store.ts:1148](../../packages/store/src/store.ts#L1148) `Store/constructor` | `Store.sql` (1148, 1150, 1152, 1153, 1157, 1161, 1162, 1171, 1179, 1194, 1199, 1204, 1205, 1209, 1210, 1211, 1218, 1222, 1226, 1227, 1228, 1233, 1237, 1240, 1241, 1243, 1244, 1247, 1248, 1252, 1253, 1257, 1258, 1261, 1263, 1266, 1267, 1271, 1272, 1276, 1277, 1281, 1282, 1283, 1286, 1287, 1290, 1291, 1293, 1293, 1294, 1294, 1295, 1298, 1302, 1304, 1307, 1308, 1309, 1312, 1313, 1315, 1317, 1318, 1322, 1323, 1325, 1337, 1339, 1340, 1341, 1341, 1345, 1346); `SQLite.get` (1152, 1171); `SQLite.prepare` (1152, 1171, 1179, 1240, 1241, 1244, 1247, 1252, 1257, 1266, 1271, 1276, 1286, 1290, 1293, 1294, 1312, 1317, 1322); `SQLite.all` (1240, 1247, 1252, 1257, 1266, 1271, 1276, 1286, 1290, 1293, 1294, 1312, 1317, 1322) | CORE |
| [packages/store/src/store.ts:6083](../../packages/store/src/store.ts#L6083) `Store/consumeRecoveryCode` | `SQLite.prepare` (6083); `Store.sql` (6083) | CORE |
| [packages/store/src/store.ts:8303](../../packages/store/src/store.ts#L8303) `Store/container` | `SQLite.get` (8303); `SQLite.prepare` (8303, 8312); `Store.sql` (8303, 8312); `SQLite.all` (8312) | CORE |
| [packages/store/src/store.ts:8737](../../packages/store/src/store.ts#L8737) `Store/containerId` | `Store.containerId` (8737); `Store.row` (8738) | CORE |
| [packages/store/src/store.ts:8320](../../packages/store/src/store.ts#L8320) `Store/containerInfo` | `SQLite.get` (8320); `SQLite.prepare` (8320); `Store.sql` (8320) | CORE |
| [packages/store/src/store.ts:8284](../../packages/store/src/store.ts#L8284) `Store/containerIntact` | `SQLite.get` (8284); `SQLite.prepare` (8284); `Store.sql` (8284) | CORE |
| [packages/store/src/store.ts:8223](../../packages/store/src/store.ts#L8223) `Store/containerIntegrityReport` | `SQLite.all` (8223); `SQLite.prepare` (8223, 8234); `Store.sql` (8223, 8234); `SQLite.get` (8234) | CORE |
| [packages/store/src/store.ts:8298](../../packages/store/src/store.ts#L8298) `Store/containerMeta` | `SQLite.get` (8298); `SQLite.prepare` (8298); `Store.sql` (8298) | CORE |
| [packages/store/src/store.ts:8354](../../packages/store/src/store.ts#L8354) `Store/containerRange` | `SQLite.all` (8354); `SQLite.prepare` (8354, 8361); `Store.sql` (8354, 8361); `SQLite.get` (8361) | CORE |
| [packages/store/src/store.ts:8125](../../packages/store/src/store.ts#L8125) `Store/containerReferences` | `SQLite.all` (8125, 8144, 8146, 8152, 8165, 8176, 8190); `SQLite.prepare` (8125, 8144, 8146, 8152, 8165, 8176, 8188, 8190); `Store.sql` (8125, 8144, 8146, 8152, 8165, 8176, 8188, 8190); `SQLite.get` (8188); `Store.row` (8199) | CORE |
| [packages/store/src/store.ts:10681](../../packages/store/src/store.ts#L10681) `Store/countIds` | `Store.countIds` (10681); `SQLite.get` (10685); `SQLite.prepare` (10685); `Store.sql` (10685) | GATED-STORE |
| [packages/store/src/store.ts:9519](../../packages/store/src/store.ts#L9519) `Store/create` | `SQLite.get` (9519); `SQLite.prepare` (9519, 9532); `Store.sql` (9519, 9532) | CORE |
| [packages/store/src/store.ts:3988](../../packages/store/src/store.ts#L3988) `Store/createAccount` | `SQLite.get` (3988); `SQLite.prepare` (3988, 3992, 3998, 4003, 4008); `Store.sql` (3988, 3992, 3998, 4003, 4008) | CORE |
| [packages/store/src/store.ts:5456](../../packages/store/src/store.ts#L5456) `Store/createApiToken` | `SQLite.get` (5456, 5484); `SQLite.prepare` (5456, 5483, 5484, 5494); `Store.sql` (5456, 5483, 5484, 5494) | CORE |
| [packages/store/src/store.ts:4962](../../packages/store/src/store.ts#L4962) `Store/createLocalAccount` | `SQLite.prepare` (4962); `Store.sql` (4962) | CORE |
| [packages/store/src/store.ts:3648](../../packages/store/src/store.ts#L3648) `Store/credentialIdentity` | `SQLite.get` (3648); `SQLite.prepare` (3648); `Store.sql` (3648) | CORE |
| [packages/store/src/store.ts:5377](../../packages/store/src/store.ts#L5377) `Store/credentialStamp` | `SQLite.get` (5377); `SQLite.prepare` (5377); `Store.sql` (5377) | CORE |
| [packages/store/src/store.ts:2046](../../packages/store/src/store.ts#L2046) `Store/dataVersion` | `SQLite.get` (2046); `SQLite.prepare` (2046); `Store.sql` (2046) | CORE |
| [packages/store/src/store.ts:11238](../../packages/store/src/store.ts#L11238) `Store/decimalViewSql` | `SQLite.all` (11238); `SQLite.prepare` (11238) | CORE |
| [packages/store/src/store.ts:10243](../../packages/store/src/store.ts#L10243) `Store/delete` | `Store.row` (10243) | CORE |
| [packages/store/src/store.ts:10251](../../packages/store/src/store.ts#L10251) `Store/delete/run` | `SQLite.get` (10251); `SQLite.prepare` (10251, 10256); `Store.sql` (10251, 10256) | CORE |
| [packages/store/src/store.ts:5116](../../packages/store/src/store.ts#L5116) `Store/deleteAccount` | `SQLite.prepare` (5116, 5120, 5121, 5122, 5123, 5124, 5125, 5126, 5127, 5134, 5136, 5138, 5140, 5144); `Store.sql` (5116, 5120, 5121, 5122, 5123, 5124, 5125, 5126, 5127, 5134, 5136, 5138, 5140, 5144) | CORE |
| [packages/store/src/store.ts:10324](../../packages/store/src/store.ts#L10324) `Store/deleteBeingUndone` | `SQLite.all` (10324); `SQLite.prepare` (10324); `Store.sql` (10324) | CORE |
| [packages/store/src/store.ts:10336](../../packages/store/src/store.ts#L10336) `Store/deleteEndingTheLifeAt` | `SQLite.get` (10336); `SQLite.prepare` (10336); `Store.sql` (10336) | CORE |
| [packages/store/src/store.ts:6168](../../packages/store/src/store.ts#L6168) `Store/deletePrivilegeSet` | `SQLite.prepare` (6168); `Store.sql` (6168) | CORE |
| [packages/store/src/store.ts:4126](../../packages/store/src/store.ts#L4126) `Store/deleteScriptTest` | `SQLite.prepare` (4126); `Store.sql` (4126) | CORE |
| [packages/store/src/store.ts:3285](../../packages/store/src/store.ts#L3285) `Store/deletedRows` | `SQLite.get` (3285); `SQLite.prepare` (3285, 3287, 3287); `Store.sql` (3285, 3287, 3287); `SQLite.all` (3287, 3287) | CORE |
| [packages/store/src/store.ts:3395](../../packages/store/src/store.ts#L3395) `Store/designEffect` | `Store.sql` (3395, 3401, 3402, 3405, 3411, 3416, 3419, 3425, 3436, 3437, 3439, 3440, 3453, 3454, 3457, 3459, 3465, 3466, 3467, 3473, 3475, 3479, 3482, 3483, 3485, 3488, 3494, 3496, 3503, 3504, 3506, 3507, 3508, 3509, 3516, 3517, 3519, 3519, 3521, 3522, 3523, 3527, 3531, 3533, 3571, 3573, 3575); `SQLite.prepare` (3405, 3436, 3437, 3453, 3454, 3465, 3466, 3473, 3475, 3479, 3483, 3494, 3496, 3509, 3516, 3517, 3519, 3521, 3523, 3527, 3531); `SQLite.get` (3436, 3453, 3465, 3466, 3479, 3483, 3519, 3527); `SQLite.all` (3516, 3517); `SQLite.iterate` (3521) | CORE |
| [packages/store/src/store.ts:3388](../../packages/store/src/store.ts#L3388) `Store/designEffect/renameExcluded` | `SQLite.prepare` (3388); `Store.sql` (3388) | CORE |
| [packages/store/src/store.ts:3372](../../packages/store/src/store.ts#L3372) `Store/designEffect/renameKey` | `SQLite.prepare` (3372); `Store.sql` (3372) | CORE |
| [packages/store/src/store.ts:3326](../../packages/store/src/store.ts#L3326) `Store/designHistory` | `SQLite.all` (3326); `SQLite.prepare` (3326); `Store.sql` (3326) | CORE |
| [packages/store/src/store.ts:5746](../../packages/store/src/store.ts#L5746) `Store/disableTotp` | `SQLite.prepare` (5746); `Store.sql` (5746) | CORE |
| [packages/store/src/store.ts:3583](../../packages/store/src/store.ts#L3583) `Store/dropColumnIndexes` | `SQLite.all` (3583, 3585); `SQLite.prepare` (3583, 3585); `Store.sql` (3583, 3585, 3586) | CORE |
| [packages/store/src/store.ts:8914](../../packages/store/src/store.ts#L8914) `Store/dropFieldIndex` | `SQLite.get` (8914); `SQLite.prepare` (8914); `Store.sql` (8914, 8915) | CORE |
| [packages/store/src/store.ts:9556](../../packages/store/src/store.ts#L9556) `Store/duplicate` | `Store.row` (9556); `SQLite.prepare` (9574); `Store.sql` (9574) | CORE |
| [packages/store/src/store.ts:8541](../../packages/store/src/store.ts#L8541) `Store/embeddedContainerCount` | `SQLite.prepare` (8541); `Store.sql` (8541); `SQLite.get` (8542) | CORE |
| [packages/store/src/store.ts:8527](../../packages/store/src/store.ts#L8527) `Store/embeddedContainers` | `SQLite.prepare` (8527, 8528); `Store.sql` (8527, 8528); `SQLite.all` (8528); `SQLite.get` (8532) | CORE |
| [packages/store/src/store.ts:3311](../../packages/store/src/store.ts#L3311) `Store/emptyDeleted` | `Store.sql` (3311, 3314, 3315, 3317, 3319); `SQLite.prepare` (3315) | CORE |
| [packages/store/src/store.ts:1922](../../packages/store/src/store.ts#L1922) `Store/endTransaction` | `Store.sql` (1922, 1925, 1925) | CORE |
| [packages/store/src/store.ts:5714](../../packages/store/src/store.ts#L5714) `Store/enrollTotp` | `SQLite.prepare` (5714); `Store.sql` (5714) | CORE |
| [packages/store/src/store.ts:3280](../../packages/store/src/store.ts#L3280) `Store/ensureDeleted` | `Store.sql` (3280) | CORE |
| [packages/store/src/store.ts:1356](../../packages/store/src/store.ts#L1356) `Store/ensureNativeIds` | `SQLite.all` (1356, 1368); `SQLite.prepare` (1356, 1359, 1367, 1368); `Store.sql` (1356, 1359, 1362, 1366, 1367, 1368, 1371, 1373) | CORE |
| [packages/store/src/store.ts:2166](../../packages/store/src/store.ts#L2166) `Store/ensureRecordIdHighWater` | `Store.sql` (2166, 2168, 2170, 2172) | CORE |
| [packages/store/src/store.ts:2184](../../packages/store/src/store.ts#L2184) `Store/ensureRecordIdMarks` | `SQLite.all` (2184, 2187, 2190, 2199); `SQLite.prepare` (2184, 2187, 2190, 2193, 2199, 2202); `Store.sql` (2184, 2187, 2190, 2193, 2199, 2202, 2206, 2207) | CORE |
| [packages/store/src/store.ts:9897](../../packages/store/src/store.ts#L9897) `Store/evaluateCurrent` | `Store.row` (9897, 9897, 9898, 9898); `Calculations.context` (9903); `Store.get` (9904, 9906) | GATED-STORE |
| [packages/store/src/store.ts:9938](../../packages/store/src/store.ts#L9938) `Store/evaluateEachCurrent` | `Store.row` (9938, 9938, 9943); `Calculations.context` (9944); `Store.get` (9946) | GATED-STORE |
| [packages/store/src/store.ts:10000](../../packages/store/src/store.ts#L10000) `Store/evaluateRowsCurrent` | `Store.row` (10000, 10000, 10001, 10001) | GATED-STORE |
| [packages/store/src/store.ts:9979](../../packages/store/src/store.ts#L9979) `Store/evaluateRowsCurrent/each` | `Calculations.context` (9979); `Store.get` (9981) | GATED-STORE |
| [packages/store/src/store.ts:10015](../../packages/store/src/store.ts#L10015) `Store/evaluateRowsCurrent/found/[Symbol.iterator]` | `rowsById` (10015) | GATED-STORE |
| [packages/store/src/store.ts:10037](../../packages/store/src/store.ts#L10037) `Store/evaluateRowsCurrent/key` | `Calculations.context` (10037) | GATED-STORE |
| [packages/store/src/store.ts:3915](../../packages/store/src/store.ts#L3915) `Store/externalAccount` | `SQLite.all` (3915); `SQLite.prepare` (3915); `Store.sql` (3915) | CORE |
| [packages/store/src/store.ts:8046](../../packages/store/src/store.ts#L8046) `Store/externalContainerCheck` | `SQLite.all` (8046); `SQLite.prepare` (8046); `Store.sql` (8046) | CORE |
| [packages/store/src/store.ts:8053](../../packages/store/src/store.ts#L8053) `Store/externalContainerCount` | `SQLite.get` (8053); `SQLite.prepare` (8053); `Store.sql` (8053) | CORE |
| [packages/store/src/store.ts:8062](../../packages/store/src/store.ts#L8062) `Store/externalContainerReport` | `SQLite.all` (8062, 8075); `SQLite.prepare` (8062, 8075); `Store.sql` (8062, 8075) | CORE |
| [packages/store/src/store.ts:5227](../../packages/store/src/store.ts#L5227) `Store/externalIdentityId` | `SQLite.get` (5227, 5234); `SQLite.prepare` (5227, 5233, 5234); `Store.sql` (5227, 5233, 5234) | CORE |
| [packages/store/src/store.ts:8294](../../packages/store/src/store.ts#L8294) `Store/externalOf` | `SQLite.get` (8294); `SQLite.prepare` (8294); `Store.sql` (8294) | CORE |
| [packages/store/src/store.ts:3061](../../packages/store/src/store.ts#L3061) `Store/failureAuditRoom` | `SQLite.get` (3061); `SQLite.prepare` (3061); `Store.sql` (3061) | CORE |
| [packages/store/src/store.ts:7699](../../packages/store/src/store.ts#L7699) `Store/fieldIndexCurrent` | `SQLite.iterate` (7699); `SQLite.prepare` (7699, 7704); `Store.sql` (7699, 7704); `SQLite.all` (7704) | GATED-STORE |
| [packages/store/src/store.ts:8954](../../packages/store/src/store.ts#L8954) `Store/find` | `Store.find` (8954) | GATED-STORE |
| [packages/store/src/store.ts:9326](../../packages/store/src/store.ts#L9326) `Store/findCandidates` | `Store.query` (9326) | CORE |
| [packages/store/src/store.ts:8965](../../packages/store/src/store.ts#L8965) `Store/findHere` | `Store.query` (8965, 8970, 8972, 8986, 8988, 8999); `Store.recordCount` (8983); `SQLite.get` (8984, 8988); `SQLite.prepare` (8984, 8988, 8994, 9001, 9010); `Store.sql` (8984, 8988, 8994, 9001, 9010); `SQLite.all` (8994, 9001, 9010) | GATED-STORE |
| [packages/store/src/store.ts:9005](../../packages/store/src/store.ts#L9005) `Store/findHere/[Symbol.iterator]` | `SQLite.iterate` (9005); `SQLite.prepare` (9005); `Store.sql` (9005) | GATED-STORE |
| [packages/store/src/store.ts:10812](../../packages/store/src/store.ts#L10812) `Store/findIdsCurrent` | `Store.findIds` (10812) | GATED-STORE |
| [packages/store/src/store.ts:10748](../../packages/store/src/store.ts#L10748) `Store/findIdsCurrentProgress` | `Store.findIdsProgress` (10748); `Store.query` (10750, 10751, 10764, 10766); `Store.recordCount` (10756, 10784); `SQLite.iterate` (10781); `SQLite.prepare` (10781, 10789, 10790); `Store.sql` (10781, 10789, 10790); `SQLite.get` (10793); `SQLite.all` (10799) | GATED-STORE |
| [packages/store/src/store.ts:10818](../../packages/store/src/store.ts#L10818) `Store/findIdsHere` | `Store.query` (10818, 10823, 10825); `SQLite.iterate` (10836); `SQLite.prepare` (10836); `Store.sql` (10836) | GATED-STORE |
| [packages/store/src/store.ts:9270](../../packages/store/src/store.ts#L9270) `Store/findSource` | `Store.query` (9270); `SQLite.all` (9279, 9296); `SQLite.prepare` (9279, 9287, 9295); `Store.sql` (9279, 9284, 9287, 9292, 9295, 9309, 9311); `Calculations.globalValue` (9301); `Calculations.unstoredValue` (9302); `Calculations.related` (9306) | CORE |
| [packages/store/src/store.ts:3173](../../packages/store/src/store.ts#L3173) `Store/flushDeferredSecurity` | `Store.sql` (3173) | CORE |
| [packages/store/src/store.ts:10291](../../packages/store/src/store.ts#L10291) `Store/forgetStandInValues` | `Store.sql` (10291, 10312); `SQLite.prepare` (10312) | CORE |
| [packages/store/src/store.ts:5083](../../packages/store/src/store.ts#L5083) `Store/forgetStandIns` | `SQLite.prepare` (5083); `Store.sql` (5083) | CORE |
| [packages/store/src/store.ts:7581](../../packages/store/src/store.ts#L7581) `Store/foundSetPage` | `rowsById` (7581) | CORE |
| [packages/store/src/store.ts:7597](../../packages/store/src/store.ts#L7597) `Store/foundSetRowsCurrent` | `Store.viewableIds` (7597); `Store.row` (7613) | GATED-STORE |
| [packages/store/src/store.ts:3834](../../packages/store/src/store.ts#L3834) `Store/gateAgentWrite` | `SQLite.get` (3834); `SQLite.prepare` (3834, 3836); `Store.sql` (3834, 3836) | CORE |
| [packages/store/src/store.ts:6021](../../packages/store/src/store.ts#L6021) `Store/generateRecoveryCodes` | `SQLite.prepare` (6021, 6024); `Store.sql` (6021, 6024) | CORE |
| [packages/store/src/store.ts:9398](../../packages/store/src/store.ts#L9398) `Store/getCurrent` | `Store.get` (9398); `Store.row` (9399, 9399, 9413); `SQLite.all` (9416); `SQLite.prepare` (9416); `Store.sql` (9416) | GATED-STORE |
| [packages/store/src/store.ts:9436](../../packages/store/src/store.ts#L9436) `Store/getManyCurrent` | `Store.getMany` (9436); `SQLite.get` (9454); `SQLite.prepare` (9454); `Store.sql` (9454) | GATED-STORE |
| [packages/store/src/store.ts:9447](../../packages/store/src/store.ts#L9447) `Store/getManyCurrent/[Symbol.iterator]` | `rowsById` (9447) | GATED-STORE |
| [packages/store/src/store.ts:1403](../../packages/store/src/store.ts#L1403) `Store/grantFullAccessClients` | `SQLite.prepare` (1403); `Store.sql` (1403) | CORE |
| [packages/store/src/store.ts:10853](../../packages/store/src/store.ts#L10853) `Store/groupSummariesCurrent` | `Store.groupSummaries` (10853); `Store.viewableIds` (10858); `Calculations.collect` (10874); `rowsById` (10874, 10924); `Calculations.collector` (10896) | GATED-STORE |
| [packages/store/src/store.ts:10922](../../packages/store/src/store.ts#L10922) `Store/groupSummariesCurrent/flush` | `Calculations.collector` (10922) | GATED-STORE |
| [packages/store/src/store.ts:10886](../../packages/store/src/store.ts#L10886) `Store/groupSummariesCurrent/key` | `Calculations.value` (10886); `Calculations.related` (10888) | GATED-STORE |
| [packages/store/src/store.ts:1430](../../packages/store/src/store.ts#L1430) `Store/hasOwnPassword` | `SQLite.get` (1430); `SQLite.prepare` (1430); `Store.sql` (1430) | CORE |
| [packages/store/src/store.ts:5876](../../packages/store/src/store.ts#L5876) `Store/hasPasskey` | `SQLite.get` (5876); `SQLite.prepare` (5876); `Store.sql` (5876) | CORE |
| [packages/store/src/store.ts:1411](../../packages/store/src/store.ts#L1411) `Store/hasProvingPassword` | `SQLite.get` (1411); `SQLite.prepare` (1411); `Store.sql` (1411) | CORE |
| [packages/store/src/store.ts:8868](../../packages/store/src/store.ts#L8868) `Store/hasTable` | `SQLite.get` (8868); `SQLite.prepare` (8868); `Store.sql` (8868) | CORE |
| [packages/store/src/store.ts:5735](../../packages/store/src/store.ts#L5735) `Store/hasTotp` | `SQLite.get` (5735); `SQLite.prepare` (5735); `Store.sql` (5735) | CORE |
| [packages/store/src/store.ts:5206](../../packages/store/src/store.ts#L5206) `Store/identityAllowed` | `SQLite.get` (5206, 5212, 5218); `SQLite.prepare` (5206, 5212, 5218); `Store.sql` (5206, 5212, 5218) | CORE |
| [packages/store/src/store.ts:7055](../../packages/store/src/store.ts#L7055) `Store/image` | `SQLite.get` (7055); `SQLite.prepare` (7055); `Store.sql` (7055) | CORE |
| [packages/store/src/store.ts:7065](../../packages/store/src/store.ts#L7065) `Store/images` | `SQLite.all` (7065); `SQLite.prepare` (7065); `Store.sql` (7065) | CORE |
| [packages/store/src/store.ts:4927](../../packages/store/src/store.ts#L4927) `Store/importAccounts` | `SQLite.all` (4927); `SQLite.prepare` (4927); `Store.sql` (4927) | CORE |
| [packages/store/src/store.ts:1744](../../packages/store/src/store.ts#L1744) `Store/independentWindowWrite` | `SQLite.get` (1744); `SQLite.prepare` (1744, 1752, 1812); `Store.sql` (1744, 1752, 1762, 1790, 1807, 1812, 1815); `SQLite.all` (1752); `Store.row` (1810) | CORE |
| [packages/store/src/store.ts:2220](../../packages/store/src/store.ts#L2220) `Store/nextRecordId` | `SQLite.get` (2220); `SQLite.prepare` (2220); `Store.sql` (2220) | CORE |
| [packages/store/src/store.ts:1589](../../packages/store/src/store.ts#L1589) `Store/securityChainHeadAudit` | `SQLite.get` (1589); `SQLite.prepare` (1589); `Store.sql` (1589) | CORE |
| [packages/store/src/store.ts:8880](../../packages/store/src/store.ts#L8880) `Store/indexedFields` | `SQLite.all` (8880, 8881); `SQLite.prepare` (8880, 8881); `Store.sql` (8880, 8881) | CORE |
| [packages/store/src/store.ts:11271](../../packages/store/src/store.ts#L11271) `Store/internalRoots` | `SQLite.get` (11271); `SQLite.prepare` (11271, 11273); `SQLite.all` (11273) | CORE |
| [packages/store/src/store.ts:3670](../../packages/store/src/store.ts#L3670) `Store/isAgent` | `SQLite.get` (3670); `SQLite.prepare` (3670); `Store.sql` (3670) | CORE |
| [packages/store/src/store.ts:3773](../../packages/store/src/store.ts#L3773) `Store/isExternal` | `SQLite.get` (3773); `SQLite.prepare` (3773); `Store.sql` (3773) | CORE |
| [packages/store/src/store.ts:5790](../../packages/store/src/store.ts#L5790) `Store/issueWebauthnChallenge` | `SQLite.prepare` (5790, 5792, 5793, 5795); `Store.sql` (5790, 5792, 5793, 5795); `SQLite.get` (5792) | CORE |
| [packages/store/src/store.ts:11134](../../packages/store/src/store.ts#L11134) `Store/iterateCommitted` | `SQLite.iterate` (11134) | CORE |
| [packages/store/src/store.ts:1684](../../packages/store/src/store.ts#L1684) `Store/joinTransaction` | `Store.sql` (1684, 1685, 1687, 1689, 1695, 1698) | CORE |
| [packages/store/src/store.ts:10524](../../packages/store/src/store.ts#L10524) `Store/keyStepWork` | `Store.sql` (10524, 10530, 10534, 10536) | CORE |
| [packages/store/src/store.ts:6922](../../packages/store/src/store.ts#L6922) `Store/knownSharedAccount` | `SQLite.get` (6922); `SQLite.prepare` (6922); `Store.sql` (6922) | CORE |
| [packages/store/src/store.ts:4400](../../packages/store/src/store.ts#L4400) `Store/lastSignIns` | `Store.auditLog` (4400) | CORE |
| [packages/store/src/store.ts:10342](../../packages/store/src/store.ts#L10342) `Store/latestDeleteSeq` | `SQLite.get` (10342); `SQLite.prepare` (10342); `Store.sql` (10342) | CORE |
| [packages/store/src/store.ts:7095](../../packages/store/src/store.ts#L7095) `Store/layout` | `SQLite.get` (7095); `SQLite.prepare` (7095); `Store.sql` (7095) | CORE |
| [packages/store/src/store.ts:3343](../../packages/store/src/store.ts#L3343) `Store/layoutHistory` | `SQLite.all` (3343); `SQLite.prepare` (3343); `Store.sql` (3343) | CORE |
| [packages/store/src/store.ts:6985](../../packages/store/src/store.ts#L6985) `Store/layouts` | `SQLite.all` (6985); `SQLite.prepare` (6985); `Store.sql` (6985) | CORE |
| [packages/store/src/store.ts:4700](../../packages/store/src/store.ts#L4700) `Store/leastPrivilege` | `SQLite.all` (4700); `SQLite.prepare` (4700); `Store.sql` (4700) | CORE |
| [packages/store/src/store.ts:5304](../../packages/store/src/store.ts#L5304) `Store/ledgerRow` | `SQLite.get` (5304, 5305); `SQLite.prepare` (5304, 5305); `Store.sql` (5304, 5305) | AUTH |
| [packages/store/src/store.ts:5316](../../packages/store/src/store.ts#L5316) `Store/ledgerWrite` | `Store.sql` (5316, 5317, 5319, 5321, 5324, 5324) | AUTH |
| [packages/store/src/store.ts:5010](../../packages/store/src/store.ts#L5010) `Store/limitAccountImport` | `SQLite.prepare` (5010, 5011, 5014); `Store.sql` (5010, 5011, 5014); `SQLite.get` (5011) | CORE |
| [packages/store/src/store.ts:3623](../../packages/store/src/store.ts#L3623) `Store/linkIdentity` | `SQLite.get` (3623); `SQLite.prepare` (3623); `Store.sql` (3623) | CORE |
| [packages/store/src/store.ts:3615](../../packages/store/src/store.ts#L3615) `Store/linkPrincipal` | `SQLite.get` (3615); `SQLite.prepare` (3615); `Store.sql` (3615) | CORE |
| [packages/store/src/store.ts:4286](../../packages/store/src/store.ts#L4286) `Store/markPiiField` | `SQLite.prepare` (4286); `Store.sql` (4286) | CORE |
| [packages/store/src/store.ts:8019](../../packages/store/src/store.ts#L8019) `Store/markRepeating` | `SQLite.prepare` (8019); `Store.sql` (8019) | CORE |
| [packages/store/src/store.ts:11067](../../packages/store/src/store.ts#L11067) `Store/matchIds` | `Store.matchIds` (11067); `SQLite.all` (11073); `SQLite.prepare` (11073); `Store.sql` (11073) | CORE |
| [packages/store/src/store.ts:1445](../../packages/store/src/store.ts#L1445) `Store/meta` | `SQLite.get` (1445); `SQLite.prepare` (1445); `Store.sql` (1445) | CORE |
| [packages/store/src/store.ts:1003](../../packages/store/src/store.ts#L1003) `Store/metadataVersions` | `SQLite.get` (1003); `SQLite.prepare` (1003); `Store.sql` (1003) | CORE |
| [packages/store/src/store.ts:8656](../../packages/store/src/store.ts#L8656) `Store/moveContainersIn` | `Store.sql` (8656, 8662, 8664, 8665, 8666, 8667, 8687, 8692, 8692, 8703, 8706, 8709, 8716); `SQLite.prepare` (8664, 8665, 8666, 8667, 8703, 8709); `SQLite.get` (8669, 8703, 8709) | CORE |
| [packages/store/src/store.ts:8578](../../packages/store/src/store.ts#L8578) `Store/moveContainersOut` | `Store.sql` (8578, 8586, 8588, 8590, 8595, 8596, 8616, 8622, 8624, 8626, 8626, 8632, 8632, 8637, 8639, 8641, 8641, 8647); `SQLite.get` (8586); `SQLite.prepare` (8586, 8595, 8596); `Store.container` (8598) | CORE |
| [packages/store/src/store.ts:4881](../../packages/store/src/store.ts#L4881) `Store/mustChangePassword` | `SQLite.get` (4881); `SQLite.prepare` (4881); `Store.sql` (4881) | CORE |
| [packages/store/src/store.ts:1381](../../packages/store/src/store.ts#L1381) `Store/nativeIdGuards` | `Store.sql` (1381, 1382, 1384) | CORE |
| [packages/store/src/store.ts:5610](../../packages/store/src/store.ts#L5610) `Store/objectUseSince` | `SQLite.get` (5610); `SQLite.prepare` (5610); `Store.sql` (5610) | CORE |
| [packages/store/src/store.ts:8840](../../packages/store/src/store.ts#L8840) `Store/orderBy` | `Store.valueListItems` (8840) | CORE |
| [packages/store/src/store.ts:8211](../../packages/store/src/store.ts#L8211) `Store/orphanContainerReport` | `SQLite.all` (8211); `SQLite.prepare` (8211); `Store.sql` (8211) | CORE |
| [packages/store/src/store.ts:5842](../../packages/store/src/store.ts#L5842) `Store/passkeyAllowList` | `SQLite.all` (5842); `SQLite.prepare` (5842); `Store.sql` (5842) | CORE |
| [packages/store/src/store.ts:5881](../../packages/store/src/store.ts#L5881) `Store/passkeyIds` | `SQLite.all` (5881); `SQLite.prepare` (5881); `Store.sql` (5881) | CORE |
| [packages/store/src/store.ts:5869](../../packages/store/src/store.ts#L5869) `Store/passkeys` | `SQLite.all` (5869); `SQLite.prepare` (5869); `Store.sql` (5869) | CORE |
| [packages/store/src/store.ts:4920](../../packages/store/src/store.ts#L4920) `Store/passwordDaysRemaining` | `SQLite.get` (4920); `SQLite.prepare` (4920); `Store.sql` (4920) | CORE |
| [packages/store/src/store.ts:3858](../../packages/store/src/store.ts#L3858) `Store/pendingChanges` | `SQLite.all` (3858); `SQLite.prepare` (3858); `Store.sql` (3858) | CORE |
| [packages/store/src/store.ts:1463](../../packages/store/src/store.ts#L1463) `Store/persistentData` | `SQLite.get` (1463) | CORE |
| [packages/store/src/store.ts:1472](../../packages/store/src/store.ts#L1472) `Store/persistentDataIds` | `SQLite.all` (1472) | CORE |
| [packages/store/src/store.ts:1453](../../packages/store/src/store.ts#L1453) `Store/persistentTable` | `Store.sql` (1453) | CORE |
| [packages/store/src/store.ts:10185](../../packages/store/src/store.ts#L10185) `Store/portalContainerTarget` | `Store.row` (10185); `relatedIdList` (10187) | CORE |
| [packages/store/src/store.ts:7636](../../packages/store/src/store.ts#L7636) `Store/portalCountsCurrent` | `Store.canView` (7636); `Store.row` (7663) | GATED-STORE |
| [packages/store/src/store.ts:7874](../../packages/store/src/store.ts#L7874) `Store/portalRows` | `relatedRows` (7874); `relatedIdList` (7875); `Store.viewableSet` (7878); `rowsById` (7903, 7941); `Calculations.related` (7917) | CORE |
| [packages/store/src/store.ts:7885](../../packages/store/src/store.ts#L7885) `Store/portalRows/context` | `Calculations.context` (7885) | CORE |
| [packages/store/src/store.ts:7895](../../packages/store/src/store.ts#L7895) `Store/portalRows/valueOf` | `Calculations.value` (7895) | CORE |
| [packages/store/src/store.ts:2596](../../packages/store/src/store.ts#L2596) `Store/prepared` | `SQLite.prepare` (2596); `Store.sql` (2596) | CORE |
| [packages/store/src/store.ts:4992](../../packages/store/src/store.ts#L4992) `Store/previewAccountImport` | `Store.sql` (4992, 4993, 5002) | CORE |
| [packages/store/src/store.ts:6685](../../packages/store/src/store.ts#L6685) `Store/previewRecordRuleCurrent` | `SQLite.get` (6685); `SQLite.prepare` (6685, 6688); `Store.sql` (6685, 6688); `SQLite.all` (6688); `Calculations.context` (6694, 6710) | CORE |
| [packages/store/src/store.ts:9361](../../packages/store/src/store.ts#L9361) `Store/previewRow` | `Store.row` (9361) | CORE |
| [packages/store/src/store.ts:6096](../../packages/store/src/store.ts#L6096) `Store/privilegeSets` | `Store.sql` (6096) | CORE |
| [packages/store/src/store.ts:2828](../../packages/store/src/store.ts#L2828) `Store/pruneAudit` | `Store.sql` (2828, 2830, 2832); `SQLite.get` (2830); `SQLite.prepare` (2830) | CORE |
| [packages/store/src/store.ts:8246](../../packages/store/src/store.ts#L8246) `Store/purgeOrphanContainers` | `Store.sql` (8246, 8250, 8259, 8262, 8263, 8268, 8269, 8271, 8271); `Store.orphanContainerReport` (8254); `SQLite.get` (8259); `SQLite.prepare` (8259, 8262, 8263) | CORE |
| [packages/store/src/store.ts:11391](../../packages/store/src/store.ts#L11391) `Store/query` | `SQLite.iterate` (11391) | CORE |
| [packages/store/src/store.ts:11431](../../packages/store/src/store.ts#L11431) `Store/queryWithOriginsCurrent` | `SQLite.iterate` (11431); `SQLite.all` (11440, 11443); `SQLite.prepare` (11440, 11443) | CORE |
| [packages/store/src/store.ts:11183](../../packages/store/src/store.ts#L11183) `Store/readOnlyChecked` | `SQLite.prepare` (11183, 11187, 11196, 11201); `SQLite.all` (11187, 11196, 11201) | CORE |
| [packages/store/src/store.ts:3595](../../packages/store/src/store.ts#L3595) `Store/recompute` | `SQLite.prepare` (3595, 3599); `Store.sql` (3595, 3599); `SQLite.iterate` (3599); `Calculations.computeStoredStyled` (3600); `Calculations.value` (3600) | CORE |
| [packages/store/src/store.ts:2611](../../packages/store/src/store.ts#L2611) `Store/recordAsOf` | `SQLite.get` (2611, 2613); `SQLite.prepare` (2611, 2613, 2615, 2616); `Store.sql` (2611, 2613, 2615, 2616); `SQLite.all` (2615, 2616) | CORE |
| [packages/store/src/store.ts:2307](../../packages/store/src/store.ts#L2307) `Store/recordCount` | `SQLite.get` (2307); `SQLite.prepare` (2307); `Store.sql` (2307) | CORE |
| [packages/store/src/store.ts:2688](../../packages/store/src/store.ts#L2688) `Store/recordLife` | `SQLite.all` (2688); `SQLite.prepare` (2688); `Store.sql` (2688) | CORE |
| [packages/store/src/store.ts:5541](../../packages/store/src/store.ts#L5541) `Store/recordObjectUse` | `Store.sql` (5541) | CORE |
| [packages/store/src/store.ts:9887](../../packages/store/src/store.ts#L9887) `Store/recordViewable` | `Store.row` (9887) | GATED-STORE |
| [packages/store/src/store.ts:1510](../../packages/store/src/store.ts#L1510) `Store/recordedFormat` | `Store.sql` (1510) | CORE |
| [packages/store/src/store.ts:8550](../../packages/store/src/store.ts#L8550) `Store/recoverContainersOut` | `SQLite.prepare` (8550); `Store.sql` (8550); `SQLite.get` (8553) | CORE |
| [packages/store/src/store.ts:1613](../../packages/store/src/store.ts#L1613) `Store/recoverPendingExternalFiles` | `Store.sql` (1613, 1615, 1639, 1641); `SQLite.prepare` (1615); `SQLite.get` (1626) | CORE |
| [packages/store/src/store.ts:6039](../../packages/store/src/store.ts#L6039) `Store/recoveryCodesRemaining` | `SQLite.get` (6039); `SQLite.prepare` (6039); `Store.sql` (6039) | CORE |
| [packages/store/src/store.ts:11223](../../packages/store/src/store.ts#L11223) `Store/refreshDecimalSqlViews` | `SQLite.get` (11223); `SQLite.prepare` (11223) | CORE |
| [packages/store/src/store.ts:3764](../../packages/store/src/store.ts#L3764) `Store/refuseLookalikeAccount` | `SQLite.all` (3764); `SQLite.prepare` (3764); `Store.sql` (3764) | CORE |
| [packages/store/src/store.ts:5905](../../packages/store/src/store.ts#L5905) `Store/registerPasskey` | `SQLite.prepare` (5905); `Store.sql` (5905) | CORE |
| [packages/store/src/store.ts:3893](../../packages/store/src/store.ts#L3893) `Store/rejectPending` | `SQLite.get` (3893); `SQLite.prepare` (3893, 3895); `Store.sql` (3893, 3895) | CORE |
| [packages/store/src/store.ts:9113](../../packages/store/src/store.ts#L9113) `Store/relatedCriteria` | `SQLite.iterate` (9113); `SQLite.prepare` (9113); `Store.sql` (9113) | CORE |
| [packages/store/src/store.ts:9110](../../packages/store/src/store.ts#L9110) `Store/relatedCriteria/matched` | `relatedRows` (9110) | CORE |
| [packages/store/src/store.ts:7423](../../packages/store/src/store.ts#L7423) `Store/relatedValues` | `Calculations.globalValue` (7423); `Calculations.unstoredValue` (7425) | CORE |
| [packages/store/src/store.ts:5918](../../packages/store/src/store.ts#L5918) `Store/removePasskey` | `SQLite.get` (5918); `SQLite.prepare` (5918, 5919); `Store.sql` (5918, 5919) | CORE |
| [packages/store/src/store.ts:10362](../../packages/store/src/store.ts#L10362) `Store/restoreDeletedRowLocked` | `SQLite.get` (10362, 10367); `SQLite.prepare` (10362, 10363, 10367, 10377); `Store.sql` (10362, 10363, 10367, 10377); `SQLite.all` (10363) | CORE |
| [packages/store/src/store.ts:2646](../../packages/store/src/store.ts#L2646) `Store/restoreRecord` | `Store.recordAsOf` (2646); `SQLite.get` (2650); `SQLite.prepare` (2650, 2655, 2664, 2675); `Store.sql` (2650, 2655, 2664, 2675) | CORE |
| [packages/store/src/store.ts:2704](../../packages/store/src/store.ts#L2704) `Store/revertAuditEntry` | `SQLite.get` (2704); `SQLite.prepare` (2704); `Store.sql` (2704); `Store.canViewRecord` (2706); `Store.auditLog` (2709) | CORE |
| [packages/store/src/store.ts:5666](../../packages/store/src/store.ts#L5666) `Store/revokeApiToken` | `SQLite.prepare` (5666); `Store.sql` (5666) | CORE |
| [packages/store/src/store.ts:5189](../../packages/store/src/store.ts#L5189) `Store/revokeSignInCredentials` | `SQLite.prepare` (5189, 5190, 5191); `Store.sql` (5189, 5190, 5191) | AUTH |
| [packages/store/src/store.ts:9379](../../packages/store/src/store.ts#L9379) `Store/row` | `SQLite.get` (9379) | CORE |
| [packages/store/src/store.ts:11327](../../packages/store/src/store.ts#L11327) `Store/rowsOf` | `SQLite.iterate` (11327, 11336) | CORE |
| [packages/store/src/store.ts:6490](../../packages/store/src/store.ts#L6490) `Store/ruleOutcome` | `Calculations.context` (6490) | CORE |
| [packages/store/src/store.ts:9224](../../packages/store/src/store.ts#L9224) `Store/runningSummaryValues` | `Store.viewableIds` (9224); `rowsById` (9226); `Calculations.value` (9237, 9243); `Calculations.related` (9254) | GATED-STORE |
| [packages/store/src/store.ts:6125](../../packages/store/src/store.ts#L6125) `Store/savePrivilegeSet` | `SQLite.prepare` (6125, 6133); `Store.sql` (6125, 6133) | AUTH |
| [packages/store/src/store.ts:4117](../../packages/store/src/store.ts#L4117) `Store/saveScriptTest` | `SQLite.prepare` (4117); `Store.sql` (4117) | CORE |
| [packages/store/src/store.ts:6650](../../packages/store/src/store.ts#L6650) `Store/scopedTableSql` | `Store.viewableIds` (6650); `SQLite.all` (6653); `SQLite.prepare` (6653); `Store.sql` (6653) | GATED-STORE |
| [packages/store/src/store.ts:3333](../../packages/store/src/store.ts#L3333) `Store/scriptHistory` | `SQLite.all` (3333); `SQLite.prepare` (3333); `Store.sql` (3333) | CORE |
| [packages/store/src/store.ts:3006](../../packages/store/src/store.ts#L3006) `Store/securityChange` | `Store.sql` (3006, 3008); `SQLite.prepare` (3008) | CORE |
| [packages/store/src/store.ts:2570](../../packages/store/src/store.ts#L2570) `Store/securityEvents` | `Store.auditLog` (2570) | CORE |
| [packages/store/src/store.ts:5390](../../packages/store/src/store.ts#L5390) `Store/securityToken` | `SQLite.get` (5390); `SQLite.prepare` (5390); `Store.sql` (5390) | CORE |
| [packages/store/src/store.ts:11357](../../packages/store/src/store.ts#L11357) `Store/selectHeldCurrent` | `Store.sql` (11357, 11358, 11360); `SQLite.prepare` (11358) | CORE |
| [packages/store/src/store.ts:10667](../../packages/store/src/store.ts#L10667) `Store/selectIdsCurrent` | `Store.selectIds` (10667); `SQLite.all` (10673); `SQLite.prepare` (10673); `Store.sql` (10673) | GATED-STORE |
| [packages/store/src/store.ts:11347](../../packages/store/src/store.ts#L11347) `Store/selectIn` | `Store.select` (11347) | CORE |
| [packages/store/src/store.ts:1976](../../packages/store/src/store.ts#L1976) `Store/selfContainedCopy` | `Store.sql` (1976); `SQLite.all` (1981); `SQLite.prepare` (1981, 1983, 1984, 1985) | CORE |
| [packages/store/src/store.ts:5168](../../packages/store/src/store.ts#L5168) `Store/setAccountActive` | `SQLite.prepare` (5168, 5176, 5177); `Store.sql` (5168, 5176, 5177) | AUTH |
| [packages/store/src/store.ts:5409](../../packages/store/src/store.ts#L5409) `Store/setAccountLocalOnly` | `SQLite.prepare` (5409); `Store.sql` (5409) | CORE |
| [packages/store/src/store.ts:6281](../../packages/store/src/store.ts#L6281) `Store/setAccountPrivilegeSet` | `SQLite.get` (6281); `SQLite.prepare` (6281, 6284, 6288); `Store.sql` (6281, 6284, 6288) | AUTH |
| [packages/store/src/store.ts:5418](../../packages/store/src/store.ts#L5418) `Store/setAccountRequire2fa` | `SQLite.prepare` (5418); `Store.sql` (5418) | CORE |
| [packages/store/src/store.ts:3794](../../packages/store/src/store.ts#L3794) `Store/setAgentAccount` | `SQLite.get` (3794); `SQLite.prepare` (3794, 3800); `Store.sql` (3794, 3800) | CORE |
| [packages/store/src/store.ts:4161](../../packages/store/src/store.ts#L4161) `Store/setAiAllowed` | `SQLite.prepare` (4161); `Store.sql` (4161) | CORE |
| [packages/store/src/store.ts:4244](../../packages/store/src/store.ts#L4244) `Store/setAiPolicy` | `SQLite.prepare` (4244); `Store.sql` (4244) | CORE |
| [packages/store/src/store.ts:6909](../../packages/store/src/store.ts#L6909) `Store/setAllowBlankPasswordFromLan` | `SQLite.prepare` (6909); `Store.sql` (6909) | CORE |
| [packages/store/src/store.ts:2806](../../packages/store/src/store.ts#L2806) `Store/setAuditSettings` | `SQLite.prepare` (2806); `Store.sql` (2806) | CORE |
| [packages/store/src/store.ts:8769](../../packages/store/src/store.ts#L8769) `Store/setContainer` | `Store.sql` (8769); `Store.row` (8775) | CORE |
| [packages/store/src/store.ts:3746](../../packages/store/src/store.ts#L3746) `Store/setExternalAccount` | `SQLite.get` (3746); `SQLite.prepare` (3746, 3751); `Store.sql` (3746, 3751) | CORE |
| [packages/store/src/store.ts:4867](../../packages/store/src/store.ts#L4867) `Store/setMustChangePassword` | `SQLite.prepare` (4867); `Store.sql` (4867) | CORE |
| [packages/store/src/store.ts:3946](../../packages/store/src/store.ts#L3946) `Store/setPassword` | `SQLite.get` (3946); `SQLite.prepare` (3946, 3952, 3961, 3968, 3969, 3970); `Store.sql` (3946, 3952, 3961, 3968, 3969, 3970) | AUTH |
| [packages/store/src/store.ts:4058](../../packages/store/src/store.ts#L4058) `Store/setPasswordPolicy` | `SQLite.prepare` (4058); `Store.sql` (4058) | CORE |
| [packages/store/src/store.ts:1478](../../packages/store/src/store.ts#L1478) `Store/setPersistentData` | `SQLite.prepare` (1478, 1482); `Store.sql` (1478, 1482) | CORE |
| [packages/store/src/store.ts:4264](../../packages/store/src/store.ts#L4264) `Store/setPiiIsolation` | `SQLite.prepare` (4264); `Store.sql` (4264) | CORE |
| [packages/store/src/store.ts:4094](../../packages/store/src/store.ts#L4094) `Store/setRequireTotpForFullAccess` | `SQLite.prepare` (4094); `Store.sql` (4094) | CORE |
| [packages/store/src/store.ts:4176](../../packages/store/src/store.ts#L4176) `Store/setScriptNetwork` | `SQLite.prepare` (4176); `Store.sql` (4176) | CORE |
| [packages/store/src/store.ts:4233](../../packages/store/src/store.ts#L4233) `Store/setSqlRequiresFmxdbc` | `SQLite.prepare` (4233); `Store.sql` (4233) | CORE |
| [packages/store/src/store.ts:9808](../../packages/store/src/store.ts#L9808) `Store/setStoredCalcValues` | `SQLite.prepare` (9808, 9809); `Store.sql` (9808, 9809); `SQLite.get` (9813) | CORE |
| [packages/store/src/store.ts:8872](../../packages/store/src/store.ts#L8872) `Store/setUserPref` | `Store.sql` (8872, 8873, 8874); `SQLite.prepare` (8873, 8874) | CORE |
| [packages/store/src/store.ts:4217](../../packages/store/src/store.ts#L4217) `Store/setWebViewerHosts` | `SQLite.prepare` (4217); `Store.sql` (4217) | CORE |
| [packages/store/src/store.ts:5343](../../packages/store/src/store.ts#L5343) `Store/settleSignIns` | `SQLite.all` (5343, 5349); `SQLite.prepare` (5343, 5349, 5355, 5359, 5361); `Store.sql` (5343, 5349, 5355, 5359, 5361) | AUTH |
| [packages/store/src/store.ts:2107](../../packages/store/src/store.ts#L2107) `Store/shareResults` | `Store.sql` (2107) | CORE |
| [packages/store/src/store.ts:1540](../../packages/store/src/store.ts#L1540) `Store/shipWal` | `Store.sql` (1540) | CORE |
| [packages/store/src/store.ts:5290](../../packages/store/src/store.ts#L5290) `Store/signInBase` | `SQLite.get` (5290); `SQLite.prepare` (5290); `Store.sql` (5290) | AUTH |
| [packages/store/src/store.ts:5292](../../packages/store/src/store.ts#L5292) `Store/signInBase/identity` | `SQLite.get` (5292); `SQLite.prepare` (5292); `Store.sql` (5292) | AUTH |
| [packages/store/src/store.ts:5279](../../packages/store/src/store.ts#L5279) `Store/signInMark` | `SQLite.prepare` (5279); `Store.sql` (5279) | AUTH |
| [packages/store/src/store.ts:10965](../../packages/store/src/store.ts#L10965) `Store/sortIdsCurrentProgress` | `Store.sortIds` (10965); `Store.sortIdsProgress` (10965); `SQLite.all` (10978); `SQLite.prepare` (10978, 11053); `Store.sql` (10978, 11053); `Store.valueListItems` (10986); `rowsById` (10998); `Calculations.globalValue` (11001); `Calculations.unstoredValue` (11002); `Calculations.related` (11008); `SQLite.iterate` (11053) | GATED-STORE |
| [packages/store/src/store.ts:9038](../../packages/store/src/store.ts#L9038) `Store/sortedPage` | `SQLite.iterate` (9038); `SQLite.prepare` (9038, 9053); `Store.sql` (9038, 9053); `SQLite.all` (9053) | CORE |
| [packages/store/src/store.ts:11139](../../packages/store/src/store.ts#L11139) `Store/storedFileId` | `SQLite.get` (11139); `SQLite.prepare` (11139) | CORE |
| [packages/store/src/store.ts:9186](../../packages/store/src/store.ts#L9186) `Store/summaries` | `Calculations.wholeTable` (9186); `Calculations.collect` (9206, 9211) | CORE |
| [packages/store/src/store.ts:9202](../../packages/store/src/store.ts#L9202) `Store/summaries/recs` | `SQLite.iterate` (9202); `SQLite.prepare` (9202); `Store.sql` (9202) | CORE |
| [packages/store/src/store.ts:5856](../../packages/store/src/store.ts#L5856) `Store/takeWebauthnChallenge` | `SQLite.get` (5856); `SQLite.prepare` (5856, 5860); `Store.sql` (5856, 5860) | CORE |
| [packages/store/src/store.ts:8925](../../packages/store/src/store.ts#L8925) `Store/timeFind` | `Store.query` (8925) | CORE |
| [packages/store/src/store.ts:8939](../../packages/store/src/store.ts#L8939) `Store/reportFind` | `Store.query` (8939, 8941, 8942); `Store.recordCount` (8944) | CORE |
| [packages/store/src/store.ts:7364](../../packages/store/src/store.ts#L7364) `Store/toRecord` | `Calculations.value` (7364, 7374); `Calculations.globalValue` (7368); `Calculations.unstoredStyled` (7373) | CORE |
| [packages/store/src/store.ts:5740](../../packages/store/src/store.ts#L5740) `Store/totpAccounts` | `SQLite.all` (5740); `SQLite.prepare` (5740); `Store.sql` (5740) | CORE |
| [packages/store/src/store.ts:1552](../../packages/store/src/store.ts#L1552) `Store/trial` | `Store.sql` (1552) | CORE |
| [packages/store/src/store.ts:1557](../../packages/store/src/store.ts#L1557) `Store/trial/undo` | `Store.sql` (1557) | CORE |
| [packages/store/src/store.ts:11095](../../packages/store/src/store.ts#L11095) `Store/truncate/run` | `Store.sql` (11095, 11097, 11104, 11106, 11108, 11109); `SQLite.prepare` (11097, 11104); `SQLite.all` (11099) | CORE |
| [packages/store/src/store.ts:3693](../../packages/store/src/store.ts#L3693) `Store/unmigratedAccounts` | `SQLite.all` (3693); `SQLite.prepare` (3693); `Store.sql` (3693) | CORE |
| [packages/store/src/store.ts:4773](../../packages/store/src/store.ts#L4773) `Store/unusedAccess` | `SQLite.get` (4773); `SQLite.prepare` (4773, 4782); `Store.sql` (4773, 4782); `SQLite.all` (4782) | CORE |
| [packages/store/src/store.ts:4821](../../packages/store/src/store.ts#L4821) `Store/unusedObjects` | `SQLite.get` (4821); `SQLite.prepare` (4821, 4824); `Store.sql` (4821, 4824); `SQLite.all` (4824) | CORE |
| [packages/store/src/store.ts:5980](../../packages/store/src/store.ts#L5980) `Store/unusedRecoveryHashes` | `SQLite.all` (5980); `SQLite.prepare` (5980); `Store.sql` (5980) | CORE |
| [packages/store/src/store.ts:4603](../../packages/store/src/store.ts#L4603) `Store/unusualAccess` | `Store.auditLog` (4603, 4669) | CORE |
| [packages/store/src/store.ts:9629](../../packages/store/src/store.ts#L9629) `Store/update` | `Store.row` (9629); `Store.sql` (9660, 9661, 9700, 9703) | CORE |
| [packages/store/src/store.ts:9663](../../packages/store/src/store.ts#L9663) `Store/update/undo` | `Store.sql` (9663) | CORE |
| [packages/store/src/store.ts:10093](../../packages/store/src/store.ts#L10093) `Store/updatePortals` | `Store.row` (10093, 10129); `relatedRows` (10130) | CORE |
| [packages/store/src/store.ts:10103](../../packages/store/src/store.ts#L10103) `Store/updatePortals/portal/related` | `relatedIdList` (10103) | CORE |
| [packages/store/src/store.ts:10075](../../packages/store/src/store.ts#L10075) `Store/updateRelated` | `relatedRows` (10075) | CORE |
| [packages/store/src/store.ts:4859](../../packages/store/src/store.ts#L4859) `Store/usageCounting` | `SQLite.get` (4859); `SQLite.prepare` (4859); `Store.sql` (4859) | CORE |
| [packages/store/src/store.ts:8863](../../packages/store/src/store.ts#L8863) `Store/userPrefs` | `SQLite.all` (8863); `SQLite.prepare` (8863); `Store.sql` (8863) | CORE |
| [packages/store/src/store.ts:7745](../../packages/store/src/store.ts#L7745) `Store/valueListItemsCurrent` | `Store.valueListItems` (7745); `Store.get` (7759); `relatedRows` (7760); `Store.row` (7760); `SQLite.iterate` (7762); `SQLite.prepare` (7762); `Store.sql` (7762); `Calculations.related` (7772); `Calculations.value` (7776, 7777) | GATED-STORE |
| [packages/store/src/store.ts:10284](../../packages/store/src/store.ts#L10284) `Store/vaultHeld` | `SQLite.get` (10284); `SQLite.prepare` (10284); `Store.sql` (10284) | CORE |
| [packages/store/src/store.ts:5769](../../packages/store/src/store.ts#L5769) `Store/verifyTotp` | `SQLite.get` (5769); `SQLite.prepare` (5769, 5776); `Store.sql` (5769, 5776) | CORE |
| [packages/store/src/store.ts:2240](../../packages/store/src/store.ts#L2240) `Store/versionNumber` | `SQLite.get` (2240); `SQLite.prepare` (2240); `Store.sql` (2240) | CORE |
| [packages/store/src/store.ts:2118](../../packages/store/src/store.ts#L2118) `Store/versionTriggers` | `SQLite.get` (2118); `SQLite.prepare` (2118, 2123, 2124); `Store.sql` (2118, 2123, 2124, 2141, 2143, 2144, 2146); `SQLite.all` (2123, 2124) | CORE |
| [packages/store/src/store.ts:2086](../../packages/store/src/store.ts#L2086) `Store/warmSummariesCurrent` | `Calculations.wholeTable` (2086) | CORE |
| [packages/store/src/store.ts:4199](../../packages/store/src/store.ts#L4199) `Store/webViewerChecked` | `SQLite.get` (4199); `SQLite.prepare` (4199); `Store.sql` (4199) | CORE |
| [packages/store/src/store.ts:1844](../../packages/store/src/store.ts#L1844) `Store/withWriteTransaction` | `Store.sql` (1844, 1856, 1862, 1864, 1864) | CORE |
| [packages/store/src/store.ts:7299](../../packages/store/src/store.ts#L7299) `Store/wordIndex` | `Store.sql` (7299, 7307, 7312); `Store.recordCount` (7311); `SQLite.get` (7312); `SQLite.prepare` (7312) | CORE |
| [packages/store/src/store.ts:8443](../../packages/store/src/store.ts#L8443) `Store/writeExternalFile` | `Store.evaluateEach` (8443); `SQLite.prepare` (8466); `Store.sql` (8466) | CORE |
| [packages/store/src/store.ts:8467](../../packages/store/src/store.ts#L8467) `Store/writeExternalFile/taken` | `SQLite.get` (8467) | CORE |
| [packages/store/src/store.ts:5599](../../packages/store/src/store.ts#L5599) `Store/writeObjectUseRows` | `SQLite.prepare` (5599, 5600, 5605); `Store.sql` (5599, 5600, 5605) | CORE |
| [packages/store/src/store.ts:2295](../../packages/store/src/store.ts#L2295) `Store/writeToken` | `SQLite.get` (2295); `SQLite.prepare` (2295); `Store.sql` (2295) | CORE |
| [packages/store/src/store.ts:5571](../../packages/store/src/store.ts#L5571) `Store/writeUsage` | `Store.sql` (5571, 5572, 5574, 5578, 5580) | CORE |
| [packages/store/src/store.ts:5587](../../packages/store/src/store.ts#L5587) `Store/writeUsageRows` | `SQLite.prepare` (5587, 5588, 5594); `Store.sql` (5587, 5588, 5594) | CORE |
| [packages/store/src/store.ts:7020](../../packages/store/src/store.ts#L7020) `Store/design` | `SQLite.get` (7020) | CORE |
| [packages/store/src/store.ts:7042](../../packages/store/src/store.ts#L7042) `Store/themes` | `SQLite.get` (7042) | CORE |
| [packages/store/src/store.ts:5940](../../packages/store/src/store.ts#L5940) `Store/verifyPasskeyCredential` | `SQLite.get` (5940); `SQLite.prepare` (5940, 5952); `Store.sql` (5940, 5952) | CORE |
| [packages/store/src/store.ts:6880](../../packages/store/src/store.ts#L6880) `Store/passwordState` | `SQLite.get` (6880); `SQLite.prepare` (6880); `Store.sql` (6880) | CORE |
| [packages/store/src/store.ts:10228](../../packages/store/src/store.ts#L10228) `Store/deleteVisibility` | `Store.canViewRecord` (10228) | CORE |
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
