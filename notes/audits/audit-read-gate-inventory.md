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
| [packages/cli/src/main.ts:2411](../../packages/cli/src/main.ts#L2411) `main` | `Store.orphanContainerReport` (2411); `Store.auditLog` (2884); `SQLite.get` (3143); `SQLite.prepare` (3143) | OPERATOR |
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
| [packages/server/src/odata.ts:1657](../../packages/server/src/odata.ts#L1657) `ODataEndpoint/property` | `Store.containerId` (1657); `Store.container` (1663) | ODATA |
| [packages/server/src/odata.ts:1599](../../packages/server/src/odata.ts#L1599) `ODataEndpoint/relatedIds` | `Store.row` (1599); `relatedIdList` (1602, 1617); `Store.selectIds` (1606) | ODATA |
| [packages/server/src/odata.ts:1633](../../packages/server/src/odata.ts#L1633) `ODataEndpoint/relatedRecords` | `Store.getMany` (1633) | ODATA |
| [packages/server/src/odata.ts:932](../../packages/server/src/odata.ts#L932) `ODataEndpoint/resource` | `Store.countIds` (932); `Store.get` (972, 979, 1086) | ODATA |
| [packages/server/src/odata.ts:1628](../../packages/server/src/odata.ts#L1628) `ODataEndpoint/viewableIn` | `Store.viewableSet` (1628) | ODATA |
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
| [packages/store/src/reconvert.ts:222](../../packages/store/src/reconvert.ts#L222) `build` | `SQLite.get` (222); `SQLite.prepare` (222, 225, 230); `SQLite.all` (230) | OPERATOR |
| [packages/store/src/reconvert.ts:379](../../packages/store/src/reconvert.ts#L379) `carryImages` | `SQLite.all` (379, 381); `SQLite.prepare` (379, 381, 382) | OPERATOR |
| [packages/store/src/reconvert.ts:327](../../packages/store/src/reconvert.ts#L327) `carryRecords` | `SQLite.prepare` (327, 337, 340, 345, 346, 356, 362, 363); `SQLite.all` (337, 345, 349, 362) | OPERATOR |
| [packages/store/src/reconvert.ts:388](../../packages/store/src/reconvert.ts#L388) `carrySettings` | `SQLite.all` (388, 392, 400); `SQLite.prepare` (388, 392, 400, 401, 405); `SQLite.get` (405) | OPERATOR |
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
| [packages/store/src/store.ts:5093](../../packages/store/src/store.ts#L5093) `Store/accountIdentityId` | `SQLite.get` (5093, 5099); `SQLite.prepare` (5093, 5098, 5099); `Store.sql` (5093, 5098, 5099) | CORE |
| [packages/store/src/store.ts:5087](../../packages/store/src/store.ts#L5087) `Store/accountIdentityIdIfSet` | `SQLite.get` (5087); `SQLite.prepare` (5087); `Store.sql` (5087) | CORE |
| [packages/store/src/store.ts:5049](../../packages/store/src/store.ts#L5049) `Store/accountInactive` | `SQLite.get` (5049); `SQLite.prepare` (5049); `Store.sql` (5049) | CORE |
| [packages/store/src/store.ts:5246](../../packages/store/src/store.ts#L5246) `Store/accountLocalOnly` | `SQLite.get` (5246); `SQLite.prepare` (5246); `Store.sql` (5246) | CORE |
| [packages/store/src/store.ts:6115](../../packages/store/src/store.ts#L6115) `Store/accountPrivilegeSet` | `SQLite.get` (6115); `SQLite.prepare` (6115); `Store.sql` (6115) | CORE |
| [packages/store/src/store.ts:5251](../../packages/store/src/store.ts#L5251) `Store/accountRequires2fa` | `SQLite.get` (5251); `SQLite.prepare` (5251); `Store.sql` (5251) | CORE |
| [packages/store/src/store.ts:5471](../../packages/store/src/store.ts#L5471) `Store/accountUsage` | `SQLite.get` (5471); `SQLite.prepare` (5471, 5472); `Store.sql` (5471, 5472); `SQLite.all` (5472); `Store.auditLog` (5488) | CORE |
| [packages/store/src/store.ts:3532](../../packages/store/src/store.ts#L3532) `Store/accounts` | `SQLite.all` (3532); `SQLite.prepare` (3532); `Store.sql` (3532) | CORE |
| [packages/store/src/store.ts:3528](../../packages/store/src/store.ts#L3528) `Store/accountsSharingLockout` | `SQLite.all` (3528); `SQLite.prepare` (3528); `Store.sql` (3528) | CORE |
| [packages/store/src/store.ts:8220](../../packages/store/src/store.ts#L8220) `Store/addContainer` | `SQLite.all` (8220); `SQLite.prepare` (8220, 8225, 8239, 8243, 8244); `Store.sql` (8220, 8225, 8239, 8241, 8243, 8244, 8246, 8249); `SQLite.get` (8230); `Store.containerRange` (8232) | CORE |
| [packages/store/src/store.ts:8266](../../packages/store/src/store.ts#L8266) `Store/addExternalContainer` | `SQLite.prepare` (8266); `Store.sql` (8266) | CORE |
| [packages/store/src/store.ts:8722](../../packages/store/src/store.ts#L8722) `Store/addFieldIndex` | `Store.sql` (8722) | CORE |
| [packages/store/src/store.ts:6926](../../packages/store/src/store.ts#L6926) `Store/addImage` | `Store.sql` (6926, 6927); `SQLite.prepare` (6927) | CORE |
| [packages/store/src/store.ts:6165](../../packages/store/src/store.ts#L6165) `Store/addProvisionedAccount` | `SQLite.get` (6165); `SQLite.prepare` (6165, 6169); `Store.sql` (6165, 6169) | CORE |
| [packages/store/src/store.ts:7345](../../packages/store/src/store.ts#L7345) `Store/addRelated` | `relatedRows` (7345); `rowsById` (7378); `firstRelatedEach` (7401) | CORE |
| [packages/store/src/store.ts:3550](../../packages/store/src/store.ts#L3550) `Store/agentNeedsApproval` | `SQLite.get` (3550); `SQLite.prepare` (3550); `Store.sql` (3550) | CORE |
| [packages/store/src/store.ts:6379](../../packages/store/src/store.ts#L6379) `Store/allowedIds` | `SQLite.iterate` (6379); `SQLite.prepare` (6379); `Store.sql` (6379) | CORE |
| [packages/store/src/store.ts:5528](../../packages/store/src/store.ts#L5528) `Store/apiToken` | `SQLite.get` (5528); `SQLite.prepare` (5528, 5546); `Store.sql` (5528, 5546) | CORE |
| [packages/store/src/store.ts:5504](../../packages/store/src/store.ts#L5504) `Store/apiTokens` | `SQLite.all` (5504); `SQLite.prepare` (5504); `Store.sql` (5504) | CORE |
| [packages/store/src/store.ts:2999](../../packages/store/src/store.ts#L2999) `Store/appendSecurityRow` | `Store.sql` (2999) | CORE |
| [packages/store/src/store.ts:3890](../../packages/store/src/store.ts#L3890) `Store/appendSecurityEvent` | `Store.sql` (3890) | CORE |
| [packages/store/src/store.ts:4895](../../packages/store/src/store.ts#L4895) `Store/applyAccountImport` | `Store.sql` (4895, 4903, 4932); `SQLite.get` (4903); `SQLite.prepare` (4903, 4932) | CORE |
| [packages/store/src/store.ts:2312](../../packages/store/src/store.ts#L2312) `Store/applyDesign` | `Store.sql` (2312, 2313, 2326, 2329, 2334, 2350, 2353, 2353); `SQLite.prepare` (2329, 2334) | CORE |
| [packages/store/src/store.ts:3746](../../packages/store/src/store.ts#L3746) `Store/approvePending` | `SQLite.get` (3746); `SQLite.prepare` (3746, 3757); `Store.sql` (3746, 3757) | CORE |
| [packages/store/src/store.ts:2794](../../packages/store/src/store.ts#L2794) `Store/audit` | `Store.sql` (2794) | CORE |
| [packages/store/src/store.ts:2414](../../packages/store/src/store.ts#L2414) `Store/auditLog` | `SQLite.all` (2414); `SQLite.prepare` (2414); `Store.sql` (2414) | CORE |
| [packages/store/src/store.ts:1920](../../packages/store/src/store.ts#L1920) `Store/backup` | `Store.sql` (1920) | CORE |
| [packages/store/src/store.ts:3556](../../packages/store/src/store.ts#L3556) `Store/blankPasswordAccounts` | `SQLite.all` (3556); `SQLite.prepare` (3556); `Store.sql` (3556) | CORE |
| [packages/store/src/store.ts:9303](../../packages/store/src/store.ts#L9303) `Store/canView` | `Store.canView` (9303); `Store.row` (9304) | GATED-STORE |
| [packages/store/src/store.ts:9285](../../packages/store/src/store.ts#L9285) `Store/canViewRecord` | `SQLite.get` (9285); `SQLite.prepare` (9285); `Store.sql` (9285) | GATED-STORE |
| [packages/store/src/store.ts:4824](../../packages/store/src/store.ts#L4824) `Store/canonicalAccount` | `SQLite.all` (4824); `SQLite.prepare` (4824); `Store.sql` (4824) | CORE |
| [packages/store/src/store.ts:10393](../../packages/store/src/store.ts#L10393) `Store/cascadeDelete` | `relatedRows` (10393) | CORE |
| [packages/store/src/store.ts:2139](../../packages/store/src/store.ts#L2139) `Store/changeOne` | `Store.sql` (2139, 2141) | CORE |
| [packages/store/src/store.ts:2142](../../packages/store/src/store.ts#L2142) `Store/changeOne/read` | `SQLite.get` (2142); `SQLite.prepare` (2142); `Store.sql` (2142) | CORE |
| [packages/store/src/store.ts:8601](../../packages/store/src/store.ts#L8601) `Store/checkContainerWrite` | `Store.row` (8601) | CORE |
| [packages/store/src/store.ts:10015](../../packages/store/src/store.ts#L10015) `Store/checkEditable` | `Store.row` (10015) | CORE |
| [packages/store/src/store.ts:1469](../../packages/store/src/store.ts#L1469) `Store/checkpoint` | `SQLite.get` (1469); `SQLite.prepare` (1469); `Store.sql` (1469) | CORE |
| [packages/store/src/store.ts:6151](../../packages/store/src/store.ts#L6151) `Store/clearAccountPrivilegeSet` | `SQLite.prepare` (6151); `Store.sql` (6151) | CORE |
| [packages/store/src/store.ts:1491](../../packages/store/src/store.ts#L1491) `Store/close` | `Store.sql` (1491) | CORE |
| [packages/store/src/store.ts:8569](../../packages/store/src/store.ts#L8569) `Store/compactFile` | `Store.sql` (8569, 8570, 8572) | CORE |
| [packages/store/src/store.ts:10517](../../packages/store/src/store.ts#L10517) `Store/computeValuesCurrent` | `Store.computeValues` (10517); `Store.sql` (10523, 10527); `SQLite.all` (10527); `SQLite.prepare` (10527) | GATED-STORE |
| [packages/store/src/store.ts:8954](../../packages/store/src/store.ts#L8954) `Store/computedRows` | `Store.sql` (8954, 8957, 8958, 8959, 8961, 8971, 8972, 8973, 8976); `SQLite.prepare` (8957, 8959, 8961, 8971); `SQLite.iterate` (8961); `Calculations.globalValue` (8964); `Calculations.unstoredValue` (8965); `Calculations.related` (8968); `SQLite.all` (8971) | CORE |
| [packages/store/src/store.ts:5573](../../packages/store/src/store.ts#L5573) `Store/confirmTotp` | `SQLite.get` (5573); `SQLite.prepare` (5573, 5575); `Store.sql` (5573, 5575) | CORE |
| [packages/store/src/store.ts:1137](../../packages/store/src/store.ts#L1137) `Store/constructor` | `Store.sql` (1137, 1139, 1141, 1142, 1146, 1150, 1151, 1162, 1167, 1172, 1173, 1177, 1178, 1179, 1186, 1190, 1194, 1195, 1196, 1201, 1205, 1208, 1209, 1211, 1212, 1215, 1216, 1220, 1221, 1225, 1226, 1229, 1231, 1234, 1235, 1239, 1240, 1244, 1245, 1248, 1249, 1250, 1253, 1254, 1257, 1258, 1260, 1260, 1261, 1261, 1262, 1265, 1269, 1271, 1274, 1275, 1276, 1279, 1280, 1282, 1284, 1285, 1289, 1290, 1292, 1304, 1306, 1307, 1308, 1308, 1312, 1313); `SQLite.get` (1141); `SQLite.prepare` (1141, 1208, 1209, 1212, 1215, 1220, 1225, 1234, 1239, 1244, 1253, 1257, 1260, 1261, 1279, 1284, 1289); `SQLite.all` (1208, 1215, 1220, 1225, 1234, 1239, 1244, 1253, 1257, 1260, 1261, 1279, 1284, 1289) | CORE |
| [packages/store/src/store.ts:5931](../../packages/store/src/store.ts#L5931) `Store/consumeRecoveryCode` | `SQLite.prepare` (5931); `Store.sql` (5931) | CORE |
| [packages/store/src/store.ts:8144](../../packages/store/src/store.ts#L8144) `Store/container` | `SQLite.get` (8144); `SQLite.prepare` (8144, 8153); `Store.sql` (8144, 8153); `SQLite.all` (8153) | CORE |
| [packages/store/src/store.ts:8578](../../packages/store/src/store.ts#L8578) `Store/containerId` | `Store.containerId` (8578); `Store.row` (8579) | CORE |
| [packages/store/src/store.ts:8161](../../packages/store/src/store.ts#L8161) `Store/containerInfo` | `SQLite.get` (8161); `SQLite.prepare` (8161); `Store.sql` (8161) | CORE |
| [packages/store/src/store.ts:8125](../../packages/store/src/store.ts#L8125) `Store/containerIntact` | `SQLite.get` (8125); `SQLite.prepare` (8125); `Store.sql` (8125) | CORE |
| [packages/store/src/store.ts:8064](../../packages/store/src/store.ts#L8064) `Store/containerIntegrityReport` | `SQLite.all` (8064); `SQLite.prepare` (8064, 8075); `Store.sql` (8064, 8075); `SQLite.get` (8075) | CORE |
| [packages/store/src/store.ts:8139](../../packages/store/src/store.ts#L8139) `Store/containerMeta` | `SQLite.get` (8139); `SQLite.prepare` (8139); `Store.sql` (8139) | CORE |
| [packages/store/src/store.ts:8195](../../packages/store/src/store.ts#L8195) `Store/containerRange` | `SQLite.all` (8195); `SQLite.prepare` (8195, 8202); `Store.sql` (8195, 8202); `SQLite.get` (8202) | CORE |
| [packages/store/src/store.ts:7966](../../packages/store/src/store.ts#L7966) `Store/containerReferences` | `SQLite.all` (7966, 7985, 7987, 7993, 8006, 8017, 8031); `SQLite.prepare` (7966, 7985, 7987, 7993, 8006, 8017, 8029, 8031); `Store.sql` (7966, 7985, 7987, 7993, 8006, 8017, 8029, 8031); `SQLite.get` (8029); `Store.row` (8040) | CORE |
| [packages/store/src/store.ts:10497](../../packages/store/src/store.ts#L10497) `Store/countIds` | `Store.countIds` (10497); `SQLite.get` (10501); `SQLite.prepare` (10501); `Store.sql` (10501) | GATED-STORE |
| [packages/store/src/store.ts:9328](../../packages/store/src/store.ts#L9328) `Store/create` | `SQLite.get` (9328, 9334); `SQLite.prepare` (9328, 9334, 9347); `Store.sql` (9328, 9334, 9347) | CORE |
| [packages/store/src/store.ts:3862](../../packages/store/src/store.ts#L3862) `Store/createAccount` | `SQLite.get` (3862); `SQLite.prepare` (3862, 3866, 3872, 3877, 3882); `Store.sql` (3862, 3866, 3872, 3877, 3882) | CORE |
| [packages/store/src/store.ts:5304](../../packages/store/src/store.ts#L5304) `Store/createApiToken` | `SQLite.get` (5304, 5332); `SQLite.prepare` (5304, 5331, 5332, 5342); `Store.sql` (5304, 5331, 5332, 5342) | CORE |
| [packages/store/src/store.ts:4836](../../packages/store/src/store.ts#L4836) `Store/createLocalAccount` | `SQLite.prepare` (4836); `Store.sql` (4836) | CORE |
| [packages/store/src/store.ts:3522](../../packages/store/src/store.ts#L3522) `Store/credentialIdentity` | `SQLite.get` (3522); `SQLite.prepare` (3522); `Store.sql` (3522) | CORE |
| [packages/store/src/store.ts:5225](../../packages/store/src/store.ts#L5225) `Store/credentialStamp` | `SQLite.get` (5225); `SQLite.prepare` (5225); `Store.sql` (5225) | CORE |
| [packages/store/src/store.ts:2010](../../packages/store/src/store.ts#L2010) `Store/dataVersion` | `SQLite.get` (2010); `SQLite.prepare` (2010); `Store.sql` (2010) | CORE |
| [packages/store/src/store.ts:10058](../../packages/store/src/store.ts#L10058) `Store/delete` | `Store.row` (10058) | CORE |
| [packages/store/src/store.ts:10066](../../packages/store/src/store.ts#L10066) `Store/delete/run` | `SQLite.get` (10066); `SQLite.prepare` (10066, 10071); `Store.sql` (10066, 10071) | CORE |
| [packages/store/src/store.ts:4990](../../packages/store/src/store.ts#L4990) `Store/deleteAccount` | `SQLite.prepare` (4990, 4994, 4995, 4996, 4997, 4998, 4999, 5000, 5001, 5008, 5010, 5012, 5014, 5018); `Store.sql` (4990, 4994, 4995, 4996, 4997, 4998, 4999, 5000, 5001, 5008, 5010, 5012, 5014, 5018) | CORE |
| [packages/store/src/store.ts:10140](../../packages/store/src/store.ts#L10140) `Store/deleteBeingUndone` | `SQLite.all` (10140); `SQLite.prepare` (10140); `Store.sql` (10140) | CORE |
| [packages/store/src/store.ts:10152](../../packages/store/src/store.ts#L10152) `Store/deleteEndingTheLifeAt` | `SQLite.get` (10152); `SQLite.prepare` (10152); `Store.sql` (10152) | CORE |
| [packages/store/src/store.ts:6016](../../packages/store/src/store.ts#L6016) `Store/deletePrivilegeSet` | `SQLite.prepare` (6016); `Store.sql` (6016) | CORE |
| [packages/store/src/store.ts:4000](../../packages/store/src/store.ts#L4000) `Store/deleteScriptTest` | `SQLite.prepare` (4000); `Store.sql` (4000) | CORE |
| [packages/store/src/store.ts:3167](../../packages/store/src/store.ts#L3167) `Store/deletedRows` | `SQLite.get` (3167); `SQLite.prepare` (3167, 3169, 3169); `Store.sql` (3167, 3169, 3169); `SQLite.all` (3169, 3169) | CORE |
| [packages/store/src/store.ts:3277](../../packages/store/src/store.ts#L3277) `Store/designEffect` | `Store.sql` (3277, 3282, 3287, 3292, 3295, 3301, 3312, 3313, 3315, 3328, 3329, 3332, 3334, 3340, 3341, 3342, 3347, 3349, 3353, 3356, 3357, 3359, 3362, 3368, 3370, 3377, 3378, 3380, 3381, 3382, 3383, 3390, 3391, 3393, 3393, 3395, 3396, 3397, 3401, 3405, 3407, 3445, 3447, 3449); `SQLite.get` (3312, 3328, 3340, 3341, 3353, 3357, 3393, 3401); `SQLite.prepare` (3312, 3313, 3328, 3329, 3340, 3341, 3347, 3349, 3353, 3357, 3368, 3370, 3383, 3390, 3391, 3393, 3395, 3397, 3401, 3405); `SQLite.all` (3390, 3391); `SQLite.iterate` (3395) | CORE |
| [packages/store/src/store.ts:3270](../../packages/store/src/store.ts#L3270) `Store/designEffect/renameExcluded` | `SQLite.prepare` (3270); `Store.sql` (3270) | CORE |
| [packages/store/src/store.ts:3254](../../packages/store/src/store.ts#L3254) `Store/designEffect/renameKey` | `SQLite.prepare` (3254); `Store.sql` (3254) | CORE |
| [packages/store/src/store.ts:3208](../../packages/store/src/store.ts#L3208) `Store/designHistory` | `SQLite.all` (3208); `SQLite.prepare` (3208); `Store.sql` (3208) | CORE |
| [packages/store/src/store.ts:5594](../../packages/store/src/store.ts#L5594) `Store/disableTotp` | `SQLite.prepare` (5594); `Store.sql` (5594) | CORE |
| [packages/store/src/store.ts:3457](../../packages/store/src/store.ts#L3457) `Store/dropColumnIndexes` | `SQLite.all` (3457, 3459); `SQLite.prepare` (3457, 3459); `Store.sql` (3457, 3459, 3460) | CORE |
| [packages/store/src/store.ts:8734](../../packages/store/src/store.ts#L8734) `Store/dropFieldIndex` | `SQLite.get` (8734); `SQLite.prepare` (8734); `Store.sql` (8734, 8735) | CORE |
| [packages/store/src/store.ts:9371](../../packages/store/src/store.ts#L9371) `Store/duplicate` | `Store.row` (9371); `SQLite.get` (9375); `SQLite.prepare` (9375, 9390); `Store.sql` (9375, 9390) | CORE |
| [packages/store/src/store.ts:8382](../../packages/store/src/store.ts#L8382) `Store/embeddedContainerCount` | `SQLite.prepare` (8382); `Store.sql` (8382); `SQLite.get` (8383) | CORE |
| [packages/store/src/store.ts:8368](../../packages/store/src/store.ts#L8368) `Store/embeddedContainers` | `SQLite.prepare` (8368, 8369); `Store.sql` (8368, 8369); `SQLite.all` (8369); `SQLite.get` (8373) | CORE |
| [packages/store/src/store.ts:3193](../../packages/store/src/store.ts#L3193) `Store/emptyDeleted` | `Store.sql` (3193, 3196, 3197, 3199, 3201); `SQLite.prepare` (3197) | CORE |
| [packages/store/src/store.ts:1886](../../packages/store/src/store.ts#L1886) `Store/endTransaction` | `Store.sql` (1886, 1889, 1889) | CORE |
| [packages/store/src/store.ts:5562](../../packages/store/src/store.ts#L5562) `Store/enrollTotp` | `SQLite.prepare` (5562); `Store.sql` (5562) | CORE |
| [packages/store/src/store.ts:3162](../../packages/store/src/store.ts#L3162) `Store/ensureDeleted` | `Store.sql` (3162) | CORE |
| [packages/store/src/store.ts:1323](../../packages/store/src/store.ts#L1323) `Store/ensureNativeIds` | `SQLite.all` (1323, 1335); `SQLite.prepare` (1323, 1326, 1334, 1335); `Store.sql` (1323, 1326, 1329, 1333, 1334, 1335, 1338, 1340) | CORE |
| [packages/store/src/store.ts:9712](../../packages/store/src/store.ts#L9712) `Store/evaluateCurrent` | `Store.row` (9712, 9712, 9713, 9713); `Calculations.context` (9718); `Store.get` (9719, 9721) | GATED-STORE |
| [packages/store/src/store.ts:9753](../../packages/store/src/store.ts#L9753) `Store/evaluateEachCurrent` | `Store.row` (9753, 9753, 9758); `Calculations.context` (9759); `Store.get` (9761) | GATED-STORE |
| [packages/store/src/store.ts:9815](../../packages/store/src/store.ts#L9815) `Store/evaluateRowsCurrent` | `Store.row` (9815, 9815, 9816, 9816) | GATED-STORE |
| [packages/store/src/store.ts:9794](../../packages/store/src/store.ts#L9794) `Store/evaluateRowsCurrent/each` | `Calculations.context` (9794); `Store.get` (9796) | GATED-STORE |
| [packages/store/src/store.ts:9830](../../packages/store/src/store.ts#L9830) `Store/evaluateRowsCurrent/found/[Symbol.iterator]` | `rowsById` (9830) | GATED-STORE |
| [packages/store/src/store.ts:9852](../../packages/store/src/store.ts#L9852) `Store/evaluateRowsCurrent/key` | `Calculations.context` (9852) | GATED-STORE |
| [packages/store/src/store.ts:3789](../../packages/store/src/store.ts#L3789) `Store/externalAccount` | `SQLite.all` (3789); `SQLite.prepare` (3789); `Store.sql` (3789) | CORE |
| [packages/store/src/store.ts:7887](../../packages/store/src/store.ts#L7887) `Store/externalContainerCheck` | `SQLite.all` (7887); `SQLite.prepare` (7887); `Store.sql` (7887) | CORE |
| [packages/store/src/store.ts:7894](../../packages/store/src/store.ts#L7894) `Store/externalContainerCount` | `SQLite.get` (7894); `SQLite.prepare` (7894); `Store.sql` (7894) | CORE |
| [packages/store/src/store.ts:7903](../../packages/store/src/store.ts#L7903) `Store/externalContainerReport` | `SQLite.all` (7903, 7916); `SQLite.prepare` (7903, 7916); `Store.sql` (7903, 7916) | CORE |
| [packages/store/src/store.ts:5075](../../packages/store/src/store.ts#L5075) `Store/externalIdentityId` | `SQLite.get` (5075, 5082); `SQLite.prepare` (5075, 5081, 5082); `Store.sql` (5075, 5081, 5082) | CORE |
| [packages/store/src/store.ts:8135](../../packages/store/src/store.ts#L8135) `Store/externalOf` | `SQLite.get` (8135); `SQLite.prepare` (8135); `Store.sql` (8135) | CORE |
| [packages/store/src/store.ts:2943](../../packages/store/src/store.ts#L2943) `Store/failureAuditRoom` | `SQLite.get` (2943); `SQLite.prepare` (2943); `Store.sql` (2943) | CORE |
| [packages/store/src/store.ts:7547](../../packages/store/src/store.ts#L7547) `Store/fieldIndexCurrent` | `SQLite.iterate` (7547); `SQLite.prepare` (7547, 7552); `Store.sql` (7547, 7552); `SQLite.all` (7552) | GATED-STORE |
| [packages/store/src/store.ts:8769](../../packages/store/src/store.ts#L8769) `Store/find` | `Store.find` (8769) | GATED-STORE |
| [packages/store/src/store.ts:9141](../../packages/store/src/store.ts#L9141) `Store/findCandidates` | `Store.query` (9141) | CORE |
| [packages/store/src/store.ts:8780](../../packages/store/src/store.ts#L8780) `Store/findHere` | `Store.query` (8780, 8785, 8787, 8801, 8803, 8814); `Store.recordCount` (8798); `SQLite.get` (8799, 8803); `SQLite.prepare` (8799, 8803, 8809, 8816, 8825); `Store.sql` (8799, 8803, 8809, 8816, 8825); `SQLite.all` (8809, 8816, 8825) | GATED-STORE |
| [packages/store/src/store.ts:8820](../../packages/store/src/store.ts#L8820) `Store/findHere/[Symbol.iterator]` | `SQLite.iterate` (8820); `SQLite.prepare` (8820); `Store.sql` (8820) | GATED-STORE |
| [packages/store/src/store.ts:10542](../../packages/store/src/store.ts#L10542) `Store/findIdsCurrent` | `Store.findIds` (10542) | GATED-STORE |
| [packages/store/src/store.ts:10548](../../packages/store/src/store.ts#L10548) `Store/findIdsHere` | `Store.query` (10548, 10553, 10555); `SQLite.iterate` (10566); `SQLite.prepare` (10566); `Store.sql` (10566) | GATED-STORE |
| [packages/store/src/store.ts:9085](../../packages/store/src/store.ts#L9085) `Store/findSource` | `Store.query` (9085); `SQLite.all` (9094, 9111); `SQLite.prepare` (9094, 9102, 9110); `Store.sql` (9094, 9099, 9102, 9107, 9110, 9124, 9126); `Calculations.globalValue` (9116); `Calculations.unstoredValue` (9117); `Calculations.related` (9121) | CORE |
| [packages/store/src/store.ts:3055](../../packages/store/src/store.ts#L3055) `Store/flushDeferredSecurity` | `Store.sql` (3055) | CORE |
| [packages/store/src/store.ts:10107](../../packages/store/src/store.ts#L10107) `Store/forgetStandInValues` | `Store.sql` (10107, 10128); `SQLite.prepare` (10128) | CORE |
| [packages/store/src/store.ts:4957](../../packages/store/src/store.ts#L4957) `Store/forgetStandIns` | `SQLite.prepare` (4957); `Store.sql` (4957) | CORE |
| [packages/store/src/store.ts:7429](../../packages/store/src/store.ts#L7429) `Store/foundSetPage` | `rowsById` (7429) | CORE |
| [packages/store/src/store.ts:7445](../../packages/store/src/store.ts#L7445) `Store/foundSetRowsCurrent` | `Store.viewableIds` (7445); `Store.row` (7461) | GATED-STORE |
| [packages/store/src/store.ts:3708](../../packages/store/src/store.ts#L3708) `Store/gateAgentWrite` | `SQLite.get` (3708); `SQLite.prepare` (3708, 3710); `Store.sql` (3708, 3710) | CORE |
| [packages/store/src/store.ts:5869](../../packages/store/src/store.ts#L5869) `Store/generateRecoveryCodes` | `SQLite.prepare` (5869, 5872); `Store.sql` (5869, 5872) | CORE |
| [packages/store/src/store.ts:9213](../../packages/store/src/store.ts#L9213) `Store/getCurrent` | `Store.get` (9213); `Store.row` (9214, 9214, 9228); `SQLite.all` (9231); `SQLite.prepare` (9231); `Store.sql` (9231) | GATED-STORE |
| [packages/store/src/store.ts:9251](../../packages/store/src/store.ts#L9251) `Store/getManyCurrent` | `Store.getMany` (9251); `SQLite.get` (9269); `SQLite.prepare` (9269); `Store.sql` (9269) | GATED-STORE |
| [packages/store/src/store.ts:9262](../../packages/store/src/store.ts#L9262) `Store/getManyCurrent/[Symbol.iterator]` | `rowsById` (9262) | GATED-STORE |
| [packages/store/src/store.ts:1370](../../packages/store/src/store.ts#L1370) `Store/grantFullAccessClients` | `SQLite.prepare` (1370); `Store.sql` (1370) | CORE |
| [packages/store/src/store.ts:10583](../../packages/store/src/store.ts#L10583) `Store/groupSummariesCurrent` | `Store.groupSummaries` (10583); `Store.viewableIds` (10588); `Calculations.collect` (10604); `rowsById` (10604, 10654); `Calculations.collector` (10626) | GATED-STORE |
| [packages/store/src/store.ts:10652](../../packages/store/src/store.ts#L10652) `Store/groupSummariesCurrent/flush` | `Calculations.collector` (10652) | GATED-STORE |
| [packages/store/src/store.ts:10616](../../packages/store/src/store.ts#L10616) `Store/groupSummariesCurrent/key` | `Calculations.value` (10616); `Calculations.related` (10618) | GATED-STORE |
| [packages/store/src/store.ts:1397](../../packages/store/src/store.ts#L1397) `Store/hasOwnPassword` | `SQLite.get` (1397); `SQLite.prepare` (1397); `Store.sql` (1397) | CORE |
| [packages/store/src/store.ts:5724](../../packages/store/src/store.ts#L5724) `Store/hasPasskey` | `SQLite.get` (5724); `SQLite.prepare` (5724); `Store.sql` (5724) | CORE |
| [packages/store/src/store.ts:1378](../../packages/store/src/store.ts#L1378) `Store/hasProvingPassword` | `SQLite.get` (1378); `SQLite.prepare` (1378); `Store.sql` (1378) | CORE |
| [packages/store/src/store.ts:8688](../../packages/store/src/store.ts#L8688) `Store/hasTable` | `SQLite.get` (8688); `SQLite.prepare` (8688); `Store.sql` (8688) | CORE |
| [packages/store/src/store.ts:5583](../../packages/store/src/store.ts#L5583) `Store/hasTotp` | `SQLite.get` (5583); `SQLite.prepare` (5583); `Store.sql` (5583) | CORE |
| [packages/store/src/store.ts:5054](../../packages/store/src/store.ts#L5054) `Store/identityAllowed` | `SQLite.get` (5054, 5060, 5066); `SQLite.prepare` (5054, 5060, 5066); `Store.sql` (5054, 5060, 5066) | CORE |
| [packages/store/src/store.ts:6903](../../packages/store/src/store.ts#L6903) `Store/image` | `SQLite.get` (6903); `SQLite.prepare` (6903); `Store.sql` (6903) | CORE |
| [packages/store/src/store.ts:6913](../../packages/store/src/store.ts#L6913) `Store/images` | `SQLite.all` (6913); `SQLite.prepare` (6913); `Store.sql` (6913) | CORE |
| [packages/store/src/store.ts:4801](../../packages/store/src/store.ts#L4801) `Store/importAccounts` | `SQLite.all` (4801); `SQLite.prepare` (4801); `Store.sql` (4801) | CORE |
| [packages/store/src/store.ts:1711](../../packages/store/src/store.ts#L1711) `Store/independentWindowWrite` | `SQLite.get` (1711); `SQLite.prepare` (1711, 1719, 1776); `Store.sql` (1711, 1719, 1729, 1755, 1771, 1776, 1779); `SQLite.all` (1719); `Store.row` (1774) | CORE |
| [packages/store/src/store.ts:1556](../../packages/store/src/store.ts#L1556) `Store/securityChainHeadAudit` | `SQLite.get` (1556); `SQLite.prepare` (1556); `Store.sql` (1556) | CORE |
| [packages/store/src/store.ts:8700](../../packages/store/src/store.ts#L8700) `Store/indexedFields` | `SQLite.all` (8700, 8701); `SQLite.prepare` (8700, 8701); `Store.sql` (8700, 8701) | CORE |
| [packages/store/src/store.ts:10950](../../packages/store/src/store.ts#L10950) `Store/internalRoots` | `SQLite.get` (10950); `SQLite.prepare` (10950, 10952); `SQLite.all` (10952) | CORE |
| [packages/store/src/store.ts:3544](../../packages/store/src/store.ts#L3544) `Store/isAgent` | `SQLite.get` (3544); `SQLite.prepare` (3544); `Store.sql` (3544) | CORE |
| [packages/store/src/store.ts:3647](../../packages/store/src/store.ts#L3647) `Store/isExternal` | `SQLite.get` (3647); `SQLite.prepare` (3647); `Store.sql` (3647) | CORE |
| [packages/store/src/store.ts:5638](../../packages/store/src/store.ts#L5638) `Store/issueWebauthnChallenge` | `SQLite.prepare` (5638, 5640, 5641, 5643); `Store.sql` (5638, 5640, 5641, 5643); `SQLite.get` (5640) | CORE |
| [packages/store/src/store.ts:10857](../../packages/store/src/store.ts#L10857) `Store/iterateCommitted` | `SQLite.iterate` (10857) | CORE |
| [packages/store/src/store.ts:1651](../../packages/store/src/store.ts#L1651) `Store/joinTransaction` | `Store.sql` (1651, 1652, 1654, 1656, 1662, 1665) | CORE |
| [packages/store/src/store.ts:10340](../../packages/store/src/store.ts#L10340) `Store/keyStepWork` | `Store.sql` (10340, 10346, 10350, 10352) | CORE |
| [packages/store/src/store.ts:6770](../../packages/store/src/store.ts#L6770) `Store/knownSharedAccount` | `SQLite.get` (6770); `SQLite.prepare` (6770); `Store.sql` (6770) | CORE |
| [packages/store/src/store.ts:4274](../../packages/store/src/store.ts#L4274) `Store/lastSignIns` | `Store.auditLog` (4274) | CORE |
| [packages/store/src/store.ts:10158](../../packages/store/src/store.ts#L10158) `Store/latestDeleteSeq` | `SQLite.get` (10158); `SQLite.prepare` (10158); `Store.sql` (10158) | CORE |
| [packages/store/src/store.ts:6943](../../packages/store/src/store.ts#L6943) `Store/layout` | `SQLite.get` (6943); `SQLite.prepare` (6943); `Store.sql` (6943) | CORE |
| [packages/store/src/store.ts:3225](../../packages/store/src/store.ts#L3225) `Store/layoutHistory` | `SQLite.all` (3225); `SQLite.prepare` (3225); `Store.sql` (3225) | CORE |
| [packages/store/src/store.ts:6833](../../packages/store/src/store.ts#L6833) `Store/layouts` | `SQLite.all` (6833); `SQLite.prepare` (6833); `Store.sql` (6833) | CORE |
| [packages/store/src/store.ts:4574](../../packages/store/src/store.ts#L4574) `Store/leastPrivilege` | `SQLite.all` (4574); `SQLite.prepare` (4574); `Store.sql` (4574) | CORE |
| [packages/store/src/store.ts:5152](../../packages/store/src/store.ts#L5152) `Store/ledgerRow` | `SQLite.get` (5152, 5153); `SQLite.prepare` (5152, 5153); `Store.sql` (5152, 5153) | AUTH |
| [packages/store/src/store.ts:5164](../../packages/store/src/store.ts#L5164) `Store/ledgerWrite` | `Store.sql` (5164, 5165, 5167, 5169, 5172, 5172) | AUTH |
| [packages/store/src/store.ts:4884](../../packages/store/src/store.ts#L4884) `Store/limitAccountImport` | `SQLite.prepare` (4884, 4885, 4888); `Store.sql` (4884, 4885, 4888); `SQLite.get` (4885) | CORE |
| [packages/store/src/store.ts:3497](../../packages/store/src/store.ts#L3497) `Store/linkIdentity` | `SQLite.get` (3497); `SQLite.prepare` (3497); `Store.sql` (3497) | CORE |
| [packages/store/src/store.ts:3489](../../packages/store/src/store.ts#L3489) `Store/linkPrincipal` | `SQLite.get` (3489); `SQLite.prepare` (3489); `Store.sql` (3489) | CORE |
| [packages/store/src/store.ts:4160](../../packages/store/src/store.ts#L4160) `Store/markPiiField` | `SQLite.prepare` (4160); `Store.sql` (4160) | CORE |
| [packages/store/src/store.ts:7860](../../packages/store/src/store.ts#L7860) `Store/markRepeating` | `SQLite.prepare` (7860); `Store.sql` (7860) | CORE |
| [packages/store/src/store.ts:10790](../../packages/store/src/store.ts#L10790) `Store/matchIds` | `Store.matchIds` (10790); `SQLite.all` (10796); `SQLite.prepare` (10796); `Store.sql` (10796) | CORE |
| [packages/store/src/store.ts:1412](../../packages/store/src/store.ts#L1412) `Store/meta` | `SQLite.get` (1412); `SQLite.prepare` (1412); `Store.sql` (1412) | CORE |
| [packages/store/src/store.ts:992](../../packages/store/src/store.ts#L992) `Store/metadataVersions` | `SQLite.get` (992); `SQLite.prepare` (992); `Store.sql` (992) | CORE |
| [packages/store/src/store.ts:8497](../../packages/store/src/store.ts#L8497) `Store/moveContainersIn` | `Store.sql` (8497, 8503, 8505, 8506, 8507, 8508, 8528, 8533, 8533, 8544, 8547, 8550, 8557); `SQLite.prepare` (8505, 8506, 8507, 8508, 8544, 8550); `SQLite.get` (8510, 8544, 8550) | CORE |
| [packages/store/src/store.ts:8419](../../packages/store/src/store.ts#L8419) `Store/moveContainersOut` | `Store.sql` (8419, 8427, 8429, 8431, 8436, 8437, 8457, 8463, 8465, 8467, 8467, 8473, 8473, 8478, 8480, 8482, 8482, 8488); `SQLite.get` (8427); `SQLite.prepare` (8427, 8436, 8437); `Store.container` (8439) | CORE |
| [packages/store/src/store.ts:4755](../../packages/store/src/store.ts#L4755) `Store/mustChangePassword` | `SQLite.get` (4755); `SQLite.prepare` (4755); `Store.sql` (4755) | CORE |
| [packages/store/src/store.ts:1348](../../packages/store/src/store.ts#L1348) `Store/nativeIdGuards` | `Store.sql` (1348, 1349, 1351) | CORE |
| [packages/store/src/store.ts:5458](../../packages/store/src/store.ts#L5458) `Store/objectUseSince` | `SQLite.get` (5458); `SQLite.prepare` (5458); `Store.sql` (5458) | CORE |
| [packages/store/src/store.ts:8660](../../packages/store/src/store.ts#L8660) `Store/orderBy` | `Store.valueListItems` (8660) | CORE |
| [packages/store/src/store.ts:8052](../../packages/store/src/store.ts#L8052) `Store/orphanContainerReport` | `SQLite.all` (8052); `SQLite.prepare` (8052); `Store.sql` (8052) | CORE |
| [packages/store/src/store.ts:5690](../../packages/store/src/store.ts#L5690) `Store/passkeyAllowList` | `SQLite.all` (5690); `SQLite.prepare` (5690); `Store.sql` (5690) | CORE |
| [packages/store/src/store.ts:5729](../../packages/store/src/store.ts#L5729) `Store/passkeyIds` | `SQLite.all` (5729); `SQLite.prepare` (5729); `Store.sql` (5729) | CORE |
| [packages/store/src/store.ts:5717](../../packages/store/src/store.ts#L5717) `Store/passkeys` | `SQLite.all` (5717); `SQLite.prepare` (5717); `Store.sql` (5717) | CORE |
| [packages/store/src/store.ts:4794](../../packages/store/src/store.ts#L4794) `Store/passwordDaysRemaining` | `SQLite.get` (4794); `SQLite.prepare` (4794); `Store.sql` (4794) | CORE |
| [packages/store/src/store.ts:3732](../../packages/store/src/store.ts#L3732) `Store/pendingChanges` | `SQLite.all` (3732); `SQLite.prepare` (3732); `Store.sql` (3732) | CORE |
| [packages/store/src/store.ts:1430](../../packages/store/src/store.ts#L1430) `Store/persistentData` | `SQLite.get` (1430) | CORE |
| [packages/store/src/store.ts:1439](../../packages/store/src/store.ts#L1439) `Store/persistentDataIds` | `SQLite.all` (1439) | CORE |
| [packages/store/src/store.ts:1420](../../packages/store/src/store.ts#L1420) `Store/persistentTable` | `Store.sql` (1420) | CORE |
| [packages/store/src/store.ts:10000](../../packages/store/src/store.ts#L10000) `Store/portalContainerTarget` | `Store.row` (10000); `relatedIdList` (10002) | CORE |
| [packages/store/src/store.ts:7484](../../packages/store/src/store.ts#L7484) `Store/portalCountsCurrent` | `Store.canView` (7484); `Store.row` (7511) | GATED-STORE |
| [packages/store/src/store.ts:7722](../../packages/store/src/store.ts#L7722) `Store/portalRows` | `relatedRows` (7722); `relatedIdList` (7723); `Store.viewableSet` (7726); `rowsById` (7751, 7789); `Calculations.related` (7765) | CORE |
| [packages/store/src/store.ts:7733](../../packages/store/src/store.ts#L7733) `Store/portalRows/context` | `Calculations.context` (7733) | CORE |
| [packages/store/src/store.ts:7743](../../packages/store/src/store.ts#L7743) `Store/portalRows/valueOf` | `Calculations.value` (7743) | CORE |
| [packages/store/src/store.ts:2480](../../packages/store/src/store.ts#L2480) `Store/prepared` | `SQLite.prepare` (2480); `Store.sql` (2480) | CORE |
| [packages/store/src/store.ts:4866](../../packages/store/src/store.ts#L4866) `Store/previewAccountImport` | `Store.sql` (4866, 4867, 4876) | CORE |
| [packages/store/src/store.ts:6533](../../packages/store/src/store.ts#L6533) `Store/previewRecordRuleCurrent` | `SQLite.get` (6533); `SQLite.prepare` (6533, 6536); `Store.sql` (6533, 6536); `SQLite.all` (6536); `Calculations.context` (6542, 6558) | CORE |
| [packages/store/src/store.ts:9176](../../packages/store/src/store.ts#L9176) `Store/previewRow` | `Store.row` (9176) | CORE |
| [packages/store/src/store.ts:5944](../../packages/store/src/store.ts#L5944) `Store/privilegeSets` | `Store.sql` (5944) | CORE |
| [packages/store/src/store.ts:2712](../../packages/store/src/store.ts#L2712) `Store/pruneAudit` | `Store.sql` (2712, 2714, 2716); `SQLite.get` (2714); `SQLite.prepare` (2714) | CORE |
| [packages/store/src/store.ts:8087](../../packages/store/src/store.ts#L8087) `Store/purgeOrphanContainers` | `Store.sql` (8087, 8091, 8100, 8103, 8104, 8109, 8110, 8112, 8112); `Store.orphanContainerReport` (8095); `SQLite.get` (8100); `SQLite.prepare` (8100, 8103, 8104) | CORE |
| [packages/store/src/store.ts:11056](../../packages/store/src/store.ts#L11056) `Store/query` | `SQLite.iterate` (11056) | CORE |
| [packages/store/src/store.ts:11095](../../packages/store/src/store.ts#L11095) `Store/queryWithOriginsCurrent` | `SQLite.iterate` (11095); `SQLite.all` (11104, 11107); `SQLite.prepare` (11104, 11107) | CORE |
| [packages/store/src/store.ts:10891](../../packages/store/src/store.ts#L10891) `Store/readOnlyChecked` | `SQLite.prepare` (10891, 10895, 10904, 10909); `SQLite.all` (10895, 10904, 10909) | CORE |
| [packages/store/src/store.ts:3469](../../packages/store/src/store.ts#L3469) `Store/recompute` | `SQLite.prepare` (3469, 3473); `Store.sql` (3469, 3473); `SQLite.iterate` (3473); `Calculations.computeStoredStyled` (3474); `Calculations.value` (3474) | CORE |
| [packages/store/src/store.ts:2495](../../packages/store/src/store.ts#L2495) `Store/recordAsOf` | `SQLite.get` (2495, 2497); `SQLite.prepare` (2495, 2497, 2499, 2500); `Store.sql` (2495, 2497, 2499, 2500); `SQLite.all` (2499, 2500) | CORE |
| [packages/store/src/store.ts:2193](../../packages/store/src/store.ts#L2193) `Store/recordCount` | `SQLite.get` (2193); `SQLite.prepare` (2193); `Store.sql` (2193) | CORE |
| [packages/store/src/store.ts:2573](../../packages/store/src/store.ts#L2573) `Store/recordLife` | `SQLite.all` (2573); `SQLite.prepare` (2573); `Store.sql` (2573) | CORE |
| [packages/store/src/store.ts:5389](../../packages/store/src/store.ts#L5389) `Store/recordObjectUse` | `Store.sql` (5389) | CORE |
| [packages/store/src/store.ts:9702](../../packages/store/src/store.ts#L9702) `Store/recordViewable` | `Store.row` (9702) | GATED-STORE |
| [packages/store/src/store.ts:1477](../../packages/store/src/store.ts#L1477) `Store/recordedFormat` | `Store.sql` (1477) | CORE |
| [packages/store/src/store.ts:8391](../../packages/store/src/store.ts#L8391) `Store/recoverContainersOut` | `SQLite.prepare` (8391); `Store.sql` (8391); `SQLite.get` (8394) | CORE |
| [packages/store/src/store.ts:1580](../../packages/store/src/store.ts#L1580) `Store/recoverPendingExternalFiles` | `Store.sql` (1580, 1582, 1606, 1608); `SQLite.prepare` (1582); `SQLite.get` (1593) | CORE |
| [packages/store/src/store.ts:5887](../../packages/store/src/store.ts#L5887) `Store/recoveryCodesRemaining` | `SQLite.get` (5887); `SQLite.prepare` (5887); `Store.sql` (5887) | CORE |
| [packages/store/src/store.ts:10931](../../packages/store/src/store.ts#L10931) `Store/refreshDecimalSqlViews` | `SQLite.get` (10931); `SQLite.prepare` (10931, 10936); `SQLite.all` (10936) | CORE |
| [packages/store/src/store.ts:3638](../../packages/store/src/store.ts#L3638) `Store/refuseLookalikeAccount` | `SQLite.all` (3638); `SQLite.prepare` (3638); `Store.sql` (3638) | CORE |
| [packages/store/src/store.ts:5753](../../packages/store/src/store.ts#L5753) `Store/registerPasskey` | `SQLite.prepare` (5753); `Store.sql` (5753) | CORE |
| [packages/store/src/store.ts:3767](../../packages/store/src/store.ts#L3767) `Store/rejectPending` | `SQLite.get` (3767); `SQLite.prepare` (3767, 3769); `Store.sql` (3767, 3769) | CORE |
| [packages/store/src/store.ts:8928](../../packages/store/src/store.ts#L8928) `Store/relatedCriteria` | `SQLite.iterate` (8928); `SQLite.prepare` (8928); `Store.sql` (8928) | CORE |
| [packages/store/src/store.ts:8925](../../packages/store/src/store.ts#L8925) `Store/relatedCriteria/matched` | `relatedRows` (8925) | CORE |
| [packages/store/src/store.ts:7271](../../packages/store/src/store.ts#L7271) `Store/relatedValues` | `Calculations.globalValue` (7271); `Calculations.unstoredValue` (7273) | CORE |
| [packages/store/src/store.ts:5766](../../packages/store/src/store.ts#L5766) `Store/removePasskey` | `SQLite.get` (5766); `SQLite.prepare` (5766, 5767); `Store.sql` (5766, 5767) | CORE |
| [packages/store/src/store.ts:10178](../../packages/store/src/store.ts#L10178) `Store/restoreDeletedRowLocked` | `SQLite.get` (10178, 10183); `SQLite.prepare` (10178, 10179, 10183, 10193); `Store.sql` (10178, 10179, 10183, 10193); `SQLite.all` (10179) | CORE |
| [packages/store/src/store.ts:2530](../../packages/store/src/store.ts#L2530) `Store/restoreRecord` | `Store.recordAsOf` (2530); `SQLite.get` (2534); `SQLite.prepare` (2534, 2539, 2548, 2559); `Store.sql` (2534, 2539, 2548, 2559) | CORE |
| [packages/store/src/store.ts:2589](../../packages/store/src/store.ts#L2589) `Store/revertAuditEntry` | `SQLite.get` (2589); `SQLite.prepare` (2589); `Store.sql` (2589); `Store.canViewRecord` (2591); `Store.auditLog` (2594) | CORE |
| [packages/store/src/store.ts:5514](../../packages/store/src/store.ts#L5514) `Store/revokeApiToken` | `SQLite.prepare` (5514); `Store.sql` (5514) | CORE |
| [packages/store/src/store.ts:9194](../../packages/store/src/store.ts#L9194) `Store/row` | `SQLite.get` (9194) | CORE |
| [packages/store/src/store.ts:10995](../../packages/store/src/store.ts#L10995) `Store/rowsOf` | `SQLite.iterate` (10995, 11003) | CORE |
| [packages/store/src/store.ts:6338](../../packages/store/src/store.ts#L6338) `Store/ruleOutcome` | `Calculations.context` (6338) | CORE |
| [packages/store/src/store.ts:9039](../../packages/store/src/store.ts#L9039) `Store/runningSummaryValues` | `Store.viewableIds` (9039); `rowsById` (9041); `Calculations.value` (9052, 9058); `Calculations.related` (9069) | GATED-STORE |
| [packages/store/src/store.ts:5973](../../packages/store/src/store.ts#L5973) `Store/savePrivilegeSet` | `SQLite.prepare` (5973, 5981); `Store.sql` (5973, 5981) | AUTH |
| [packages/store/src/store.ts:3991](../../packages/store/src/store.ts#L3991) `Store/saveScriptTest` | `SQLite.prepare` (3991); `Store.sql` (3991) | CORE |
| [packages/store/src/store.ts:6498](../../packages/store/src/store.ts#L6498) `Store/scopedTableSql` | `Store.viewableIds` (6498); `SQLite.all` (6501); `SQLite.prepare` (6501); `Store.sql` (6501) | GATED-STORE |
| [packages/store/src/store.ts:3215](../../packages/store/src/store.ts#L3215) `Store/scriptHistory` | `SQLite.all` (3215); `SQLite.prepare` (3215); `Store.sql` (3215) | CORE |
| [packages/store/src/store.ts:2888](../../packages/store/src/store.ts#L2888) `Store/securityChange` | `Store.sql` (2888, 2890); `SQLite.prepare` (2890) | CORE |
| [packages/store/src/store.ts:2454](../../packages/store/src/store.ts#L2454) `Store/securityEvents` | `Store.auditLog` (2454) | CORE |
| [packages/store/src/store.ts:5238](../../packages/store/src/store.ts#L5238) `Store/securityToken` | `SQLite.get` (5238); `SQLite.prepare` (5238); `Store.sql` (5238) | CORE |
| [packages/store/src/store.ts:11022](../../packages/store/src/store.ts#L11022) `Store/selectHeldCurrent` | `Store.sql` (11022, 11023, 11025); `SQLite.prepare` (11023) | CORE |
| [packages/store/src/store.ts:10483](../../packages/store/src/store.ts#L10483) `Store/selectIdsCurrent` | `Store.selectIds` (10483); `SQLite.all` (10489); `SQLite.prepare` (10489); `Store.sql` (10489) | GATED-STORE |
| [packages/store/src/store.ts:11014](../../packages/store/src/store.ts#L11014) `Store/selectIn` | `Store.select` (11014) | CORE |
| [packages/store/src/store.ts:1940](../../packages/store/src/store.ts#L1940) `Store/selfContainedCopy` | `Store.sql` (1940); `SQLite.all` (1945); `SQLite.prepare` (1945, 1947, 1948, 1949) | CORE |
| [packages/store/src/store.ts:5035](../../packages/store/src/store.ts#L5035) `Store/setAccountActive` | `SQLite.prepare` (5035, 5038, 5039); `Store.sql` (5035, 5038, 5039) | AUTH |
| [packages/store/src/store.ts:5257](../../packages/store/src/store.ts#L5257) `Store/setAccountLocalOnly` | `SQLite.prepare` (5257); `Store.sql` (5257) | CORE |
| [packages/store/src/store.ts:6129](../../packages/store/src/store.ts#L6129) `Store/setAccountPrivilegeSet` | `SQLite.get` (6129); `SQLite.prepare` (6129, 6132, 6136); `Store.sql` (6129, 6132, 6136) | AUTH |
| [packages/store/src/store.ts:5266](../../packages/store/src/store.ts#L5266) `Store/setAccountRequire2fa` | `SQLite.prepare` (5266); `Store.sql` (5266) | CORE |
| [packages/store/src/store.ts:3668](../../packages/store/src/store.ts#L3668) `Store/setAgentAccount` | `SQLite.get` (3668); `SQLite.prepare` (3668, 3674); `Store.sql` (3668, 3674) | CORE |
| [packages/store/src/store.ts:4035](../../packages/store/src/store.ts#L4035) `Store/setAiAllowed` | `SQLite.prepare` (4035); `Store.sql` (4035) | CORE |
| [packages/store/src/store.ts:4118](../../packages/store/src/store.ts#L4118) `Store/setAiPolicy` | `SQLite.prepare` (4118); `Store.sql` (4118) | CORE |
| [packages/store/src/store.ts:6757](../../packages/store/src/store.ts#L6757) `Store/setAllowBlankPasswordFromLan` | `SQLite.prepare` (6757); `Store.sql` (6757) | CORE |
| [packages/store/src/store.ts:2690](../../packages/store/src/store.ts#L2690) `Store/setAuditSettings` | `SQLite.prepare` (2690); `Store.sql` (2690) | CORE |
| [packages/store/src/store.ts:8610](../../packages/store/src/store.ts#L8610) `Store/setContainer` | `Store.sql` (8610, 8627); `Store.row` (8616); `SQLite.prepare` (8627) | CORE |
| [packages/store/src/store.ts:3620](../../packages/store/src/store.ts#L3620) `Store/setExternalAccount` | `SQLite.get` (3620); `SQLite.prepare` (3620, 3625); `Store.sql` (3620, 3625) | CORE |
| [packages/store/src/store.ts:4741](../../packages/store/src/store.ts#L4741) `Store/setMustChangePassword` | `SQLite.prepare` (4741); `Store.sql` (4741) | CORE |
| [packages/store/src/store.ts:3820](../../packages/store/src/store.ts#L3820) `Store/setPassword` | `SQLite.get` (3820); `SQLite.prepare` (3820, 3826, 3835, 3842, 3843, 3844); `Store.sql` (3820, 3826, 3835, 3842, 3843, 3844) | AUTH |
| [packages/store/src/store.ts:3932](../../packages/store/src/store.ts#L3932) `Store/setPasswordPolicy` | `SQLite.prepare` (3932); `Store.sql` (3932) | CORE |
| [packages/store/src/store.ts:1445](../../packages/store/src/store.ts#L1445) `Store/setPersistentData` | `SQLite.prepare` (1445, 1449); `Store.sql` (1445, 1449) | CORE |
| [packages/store/src/store.ts:4138](../../packages/store/src/store.ts#L4138) `Store/setPiiIsolation` | `SQLite.prepare` (4138); `Store.sql` (4138) | CORE |
| [packages/store/src/store.ts:3968](../../packages/store/src/store.ts#L3968) `Store/setRequireTotpForFullAccess` | `SQLite.prepare` (3968); `Store.sql` (3968) | CORE |
| [packages/store/src/store.ts:4050](../../packages/store/src/store.ts#L4050) `Store/setScriptNetwork` | `SQLite.prepare` (4050); `Store.sql` (4050) | CORE |
| [packages/store/src/store.ts:4107](../../packages/store/src/store.ts#L4107) `Store/setSqlRequiresFmxdbc` | `SQLite.prepare` (4107); `Store.sql` (4107) | CORE |
| [packages/store/src/store.ts:9623](../../packages/store/src/store.ts#L9623) `Store/setStoredCalcValues` | `SQLite.prepare` (9623, 9624); `Store.sql` (9623, 9624); `SQLite.get` (9628) | CORE |
| [packages/store/src/store.ts:8692](../../packages/store/src/store.ts#L8692) `Store/setUserPref` | `Store.sql` (8692, 8693, 8694); `SQLite.prepare` (8693, 8694) | CORE |
| [packages/store/src/store.ts:4091](../../packages/store/src/store.ts#L4091) `Store/setWebViewerHosts` | `SQLite.prepare` (4091); `Store.sql` (4091) | CORE |
| [packages/store/src/store.ts:5191](../../packages/store/src/store.ts#L5191) `Store/settleSignIns` | `SQLite.all` (5191, 5197); `SQLite.prepare` (5191, 5197, 5203, 5207, 5209); `Store.sql` (5191, 5197, 5203, 5207, 5209) | AUTH |
| [packages/store/src/store.ts:2071](../../packages/store/src/store.ts#L2071) `Store/shareResults` | `Store.sql` (2071) | CORE |
| [packages/store/src/store.ts:1507](../../packages/store/src/store.ts#L1507) `Store/shipWal` | `Store.sql` (1507) | CORE |
| [packages/store/src/store.ts:5138](../../packages/store/src/store.ts#L5138) `Store/signInBase` | `SQLite.get` (5138); `SQLite.prepare` (5138); `Store.sql` (5138) | AUTH |
| [packages/store/src/store.ts:5140](../../packages/store/src/store.ts#L5140) `Store/signInBase/identity` | `SQLite.get` (5140); `SQLite.prepare` (5140); `Store.sql` (5140) | AUTH |
| [packages/store/src/store.ts:5127](../../packages/store/src/store.ts#L5127) `Store/signInMark` | `SQLite.prepare` (5127); `Store.sql` (5127) | AUTH |
| [packages/store/src/store.ts:10708](../../packages/store/src/store.ts#L10708) `Store/sortIdsCurrentProgress` | `SQLite.all` (10708); `SQLite.prepare` (10708, 10776); `Store.sql` (10708, 10776); `Store.valueListItems` (10716); `rowsById` (10728); `Calculations.globalValue` (10731); `Calculations.unstoredValue` (10732); `Calculations.related` (10738); `SQLite.iterate` (10776) | GATED-STORE |
| [packages/store/src/store.ts:8853](../../packages/store/src/store.ts#L8853) `Store/sortedPage` | `SQLite.iterate` (8853); `SQLite.prepare` (8853, 8868); `Store.sql` (8853, 8868); `SQLite.all` (8868) | CORE |
| [packages/store/src/store.ts:9001](../../packages/store/src/store.ts#L9001) `Store/summaries` | `Calculations.wholeTable` (9001); `Calculations.collect` (9021, 9026) | CORE |
| [packages/store/src/store.ts:9017](../../packages/store/src/store.ts#L9017) `Store/summaries/recs` | `SQLite.iterate` (9017); `SQLite.prepare` (9017); `Store.sql` (9017) | CORE |
| [packages/store/src/store.ts:5704](../../packages/store/src/store.ts#L5704) `Store/takeWebauthnChallenge` | `SQLite.get` (5704); `SQLite.prepare` (5704, 5708); `Store.sql` (5704, 5708) | CORE |
| [packages/store/src/store.ts:8745](../../packages/store/src/store.ts#L8745) `Store/timeFind` | `Store.query` (8745, 8749, 8750); `Store.recordCount` (8752) | CORE |
| [packages/store/src/store.ts:7212](../../packages/store/src/store.ts#L7212) `Store/toRecord` | `Calculations.value` (7212, 7222); `Calculations.globalValue` (7216); `Calculations.unstoredStyled` (7221) | CORE |
| [packages/store/src/store.ts:5588](../../packages/store/src/store.ts#L5588) `Store/totpAccounts` | `SQLite.all` (5588); `SQLite.prepare` (5588); `Store.sql` (5588) | CORE |
| [packages/store/src/store.ts:1519](../../packages/store/src/store.ts#L1519) `Store/trial` | `Store.sql` (1519) | CORE |
| [packages/store/src/store.ts:1524](../../packages/store/src/store.ts#L1524) `Store/trial/undo` | `Store.sql` (1524) | CORE |
| [packages/store/src/store.ts:10818](../../packages/store/src/store.ts#L10818) `Store/truncate/run` | `Store.sql` (10818, 10820, 10827, 10829, 10831, 10832); `SQLite.prepare` (10820, 10827); `SQLite.all` (10822) | CORE |
| [packages/store/src/store.ts:3567](../../packages/store/src/store.ts#L3567) `Store/unmigratedAccounts` | `SQLite.all` (3567); `SQLite.prepare` (3567); `Store.sql` (3567) | CORE |
| [packages/store/src/store.ts:4647](../../packages/store/src/store.ts#L4647) `Store/unusedAccess` | `SQLite.get` (4647); `SQLite.prepare` (4647, 4656); `Store.sql` (4647, 4656); `SQLite.all` (4656) | CORE |
| [packages/store/src/store.ts:4695](../../packages/store/src/store.ts#L4695) `Store/unusedObjects` | `SQLite.get` (4695); `SQLite.prepare` (4695, 4698); `Store.sql` (4695, 4698); `SQLite.all` (4698) | CORE |
| [packages/store/src/store.ts:5828](../../packages/store/src/store.ts#L5828) `Store/unusedRecoveryHashes` | `SQLite.all` (5828); `SQLite.prepare` (5828); `Store.sql` (5828) | CORE |
| [packages/store/src/store.ts:4477](../../packages/store/src/store.ts#L4477) `Store/unusualAccess` | `Store.auditLog` (4477, 4543) | CORE |
| [packages/store/src/store.ts:9445](../../packages/store/src/store.ts#L9445) `Store/update` | `Store.row` (9445); `Store.sql` (9475, 9476, 9515, 9518) | CORE |
| [packages/store/src/store.ts:9478](../../packages/store/src/store.ts#L9478) `Store/update/undo` | `Store.sql` (9478) | CORE |
| [packages/store/src/store.ts:9908](../../packages/store/src/store.ts#L9908) `Store/updatePortals` | `Store.row` (9908, 9944); `relatedRows` (9945) | CORE |
| [packages/store/src/store.ts:9918](../../packages/store/src/store.ts#L9918) `Store/updatePortals/portal/related` | `relatedIdList` (9918) | CORE |
| [packages/store/src/store.ts:9890](../../packages/store/src/store.ts#L9890) `Store/updateRelated` | `relatedRows` (9890) | CORE |
| [packages/store/src/store.ts:4733](../../packages/store/src/store.ts#L4733) `Store/usageCounting` | `SQLite.get` (4733); `SQLite.prepare` (4733); `Store.sql` (4733) | CORE |
| [packages/store/src/store.ts:8683](../../packages/store/src/store.ts#L8683) `Store/userPrefs` | `SQLite.all` (8683); `SQLite.prepare` (8683); `Store.sql` (8683) | CORE |
| [packages/store/src/store.ts:7593](../../packages/store/src/store.ts#L7593) `Store/valueListItemsCurrent` | `Store.valueListItems` (7593); `Store.get` (7607); `relatedRows` (7608); `Store.row` (7608); `SQLite.iterate` (7610); `SQLite.prepare` (7610); `Store.sql` (7610); `Calculations.related` (7620); `Calculations.value` (7624, 7625) | GATED-STORE |
| [packages/store/src/store.ts:10100](../../packages/store/src/store.ts#L10100) `Store/vaultHeld` | `SQLite.get` (10100); `SQLite.prepare` (10100); `Store.sql` (10100) | CORE |
| [packages/store/src/store.ts:5617](../../packages/store/src/store.ts#L5617) `Store/verifyTotp` | `SQLite.get` (5617); `SQLite.prepare` (5617, 5624); `Store.sql` (5617, 5624) | CORE |
| [packages/store/src/store.ts:2126](../../packages/store/src/store.ts#L2126) `Store/versionNumber` | `SQLite.get` (2126); `SQLite.prepare` (2126); `Store.sql` (2126) | CORE |
| [packages/store/src/store.ts:2082](../../packages/store/src/store.ts#L2082) `Store/versionTriggers` | `SQLite.get` (2082); `SQLite.prepare` (2082, 2087, 2088); `Store.sql` (2082, 2087, 2088, 2105, 2107, 2108, 2110); `SQLite.all` (2087, 2088) | CORE |
| [packages/store/src/store.ts:2050](../../packages/store/src/store.ts#L2050) `Store/warmSummariesCurrent` | `Calculations.wholeTable` (2050) | CORE |
| [packages/store/src/store.ts:4073](../../packages/store/src/store.ts#L4073) `Store/webViewerChecked` | `SQLite.get` (4073); `SQLite.prepare` (4073); `Store.sql` (4073) | CORE |
| [packages/store/src/store.ts:1808](../../packages/store/src/store.ts#L1808) `Store/withWriteTransaction` | `Store.sql` (1808, 1820, 1826, 1828, 1828) | CORE |
| [packages/store/src/store.ts:7147](../../packages/store/src/store.ts#L7147) `Store/wordIndex` | `Store.sql` (7147, 7155, 7160); `Store.recordCount` (7159); `SQLite.get` (7160); `SQLite.prepare` (7160) | CORE |
| [packages/store/src/store.ts:8284](../../packages/store/src/store.ts#L8284) `Store/writeExternalFile` | `Store.evaluateEach` (8284); `SQLite.prepare` (8307); `Store.sql` (8307) | CORE |
| [packages/store/src/store.ts:8308](../../packages/store/src/store.ts#L8308) `Store/writeExternalFile/taken` | `SQLite.get` (8308) | CORE |
| [packages/store/src/store.ts:5447](../../packages/store/src/store.ts#L5447) `Store/writeObjectUseRows` | `SQLite.prepare` (5447, 5448, 5453); `Store.sql` (5447, 5448, 5453) | CORE |
| [packages/store/src/store.ts:2181](../../packages/store/src/store.ts#L2181) `Store/writeToken` | `SQLite.get` (2181); `SQLite.prepare` (2181); `Store.sql` (2181) | CORE |
| [packages/store/src/store.ts:5419](../../packages/store/src/store.ts#L5419) `Store/writeUsage` | `Store.sql` (5419, 5420, 5422, 5426, 5428) | CORE |
| [packages/store/src/store.ts:5435](../../packages/store/src/store.ts#L5435) `Store/writeUsageRows` | `SQLite.prepare` (5435, 5436, 5442); `Store.sql` (5435, 5436, 5442) | CORE |
| [packages/store/src/store.ts:6868](../../packages/store/src/store.ts#L6868) `Store/design` | `SQLite.get` (6868) | CORE |
| [packages/store/src/store.ts:6890](../../packages/store/src/store.ts#L6890) `Store/themes` | `SQLite.get` (6890) | CORE |
| [packages/store/src/store.ts:5788](../../packages/store/src/store.ts#L5788) `Store/verifyPasskeyCredential` | `SQLite.get` (5788); `SQLite.prepare` (5788, 5800); `Store.sql` (5788, 5800) | CORE |
| [packages/store/src/store.ts:6728](../../packages/store/src/store.ts#L6728) `Store/passwordState` | `SQLite.get` (6728); `SQLite.prepare` (6728); `Store.sql` (6728) | CORE |
| [packages/store/src/store.ts:10043](../../packages/store/src/store.ts#L10043) `Store/deleteVisibility` | `Store.canViewRecord` (10043) | CORE |
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
