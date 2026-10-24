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
| [packages/server/src/admin.ts:2271](../../packages/server/src/admin.ts#L2271) `Admin/audit` | `Store.auditLog` (2271) | ADMIN |
| [packages/server/src/admin.ts:1040](../../packages/server/src/admin.ts#L1040) `Admin/handle` | `Store.externalContainerReport` (1040); `Store.orphanContainerReport` (1045, 1049) | ADMIN |
| [packages/server/src/admin.ts:2702](../../packages/server/src/admin.ts#L2702) `Admin/status` | `Store.externalContainerCount` (2702) | ADMIN |
| [packages/server/src/admin.ts:2354](../../packages/server/src/admin.ts#L2354) `Admin/viewAs` | `Store.find` (2354) | ADMIN |
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
| [packages/server/src/dataapi.ts:1985](../../packages/server/src/dataapi.ts#L1985) `DataApi/route` | `Store.get` (1985, 2207, 2208, 2231, 2239, 2286, 2310, 2330, 2367); `Store.valueListItems` (2000); `Store.find` (2162, 2210, 2400); `Store.findIds` (2166, 2405); `Store.query` (2405) | REST |
| [packages/server/src/dataapi.ts:2114](../../packages/server/src/dataapi.ts#L2114) `DataApi/route/recordOut` | `Store.portalCounts` (2114) | REST |
| [packages/server/src/dataapi.ts:2150](../../packages/server/src/dataapi.ts#L2150) `DataApi/route/shownAs` | `Store.get` (2150) | REST |
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
| [packages/server/src/pgwire.ts:853](../../packages/server/src/pgwire.ts#L853) `Connection/bareNames` | `Store.describe` (853) | SQL |
| [packages/server/src/pgwire.ts:869](../../packages/server/src/pgwire.ts#L869) `Connection/catalog` | `Store.describeTyped` (869) | SQL |
| [packages/server/src/pgwire.ts:1244](../../packages/server/src/pgwire.ts#L1244) `Connection/describe` | `Store.describeTyped` (1244) | SQL |
| [packages/server/src/pgwire.ts:880](../../packages/server/src/pgwire.ts#L880) `Connection/run` | `Store.selectIn` (880); `Store.describeTyped` (884) | SQL |
| [packages/server/src/pgwire.ts:830](../../packages/server/src/pgwire.ts#L830) `Connection/translate` | `Calculations.translateSQL` (830) | SQL |
| [packages/server/src/pgwire.ts:1011](../../packages/server/src/pgwire.ts#L1011) `Connection/validateSyntax` | `SQLite.prepare` (1011); `Store.sql` (1011) | SQL |
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
| [packages/store/src/store.ts:4681](../../packages/store/src/store.ts#L4681) `Store/accountIdentityId` | `SQLite.get` (4681, 4686); `SQLite.prepare` (4681, 4685, 4686); `Store.sql` (4681, 4685, 4686) | CORE |
| [packages/store/src/store.ts:4644](../../packages/store/src/store.ts#L4644) `Store/accountInactive` | `SQLite.get` (4644); `SQLite.prepare` (4644); `Store.sql` (4644) | CORE |
| [packages/store/src/store.ts:4809](../../packages/store/src/store.ts#L4809) `Store/accountLocalOnly` | `SQLite.get` (4809); `SQLite.prepare` (4809); `Store.sql` (4809) | CORE |
| [packages/store/src/store.ts:5667](../../packages/store/src/store.ts#L5667) `Store/accountPrivilegeSet` | `SQLite.get` (5667); `SQLite.prepare` (5667); `Store.sql` (5667) | CORE |
| [packages/store/src/store.ts:4814](../../packages/store/src/store.ts#L4814) `Store/accountRequires2fa` | `SQLite.get` (4814); `SQLite.prepare` (4814); `Store.sql` (4814) | CORE |
| [packages/store/src/store.ts:5034](../../packages/store/src/store.ts#L5034) `Store/accountUsage` | `SQLite.get` (5034); `SQLite.prepare` (5034, 5035); `Store.sql` (5034, 5035); `SQLite.all` (5035); `Store.auditLog` (5051) | CORE |
| [packages/store/src/store.ts:3144](../../packages/store/src/store.ts#L3144) `Store/accounts` | `SQLite.all` (3144); `SQLite.prepare` (3144); `Store.sql` (3144) | CORE |
| [packages/store/src/store.ts:3140](../../packages/store/src/store.ts#L3140) `Store/accountsSharingLockout` | `SQLite.all` (3140); `SQLite.prepare` (3140); `Store.sql` (3140) | CORE |
| [packages/store/src/store.ts:7749](../../packages/store/src/store.ts#L7749) `Store/addContainer` | `SQLite.all` (7749); `SQLite.prepare` (7749, 7754, 7768, 7772, 7773); `Store.sql` (7749, 7754, 7768, 7770, 7772, 7773, 7775, 7778); `SQLite.get` (7759); `Store.containerRange` (7761) | CORE |
| [packages/store/src/store.ts:7795](../../packages/store/src/store.ts#L7795) `Store/addExternalContainer` | `SQLite.prepare` (7795); `Store.sql` (7795) | CORE |
| [packages/store/src/store.ts:8251](../../packages/store/src/store.ts#L8251) `Store/addFieldIndex` | `Store.sql` (8251) | CORE |
| [packages/store/src/store.ts:6456](../../packages/store/src/store.ts#L6456) `Store/addImage` | `Store.sql` (6456, 6457); `SQLite.prepare` (6457) | CORE |
| [packages/store/src/store.ts:5717](../../packages/store/src/store.ts#L5717) `Store/addProvisionedAccount` | `SQLite.get` (5717); `SQLite.prepare` (5717, 5721); `Store.sql` (5717, 5721) | CORE |
| [packages/store/src/store.ts:6875](../../packages/store/src/store.ts#L6875) `Store/addRelated` | `relatedRows` (6875); `rowsById` (6907); `firstRelatedEach` (6930) | CORE |
| [packages/store/src/store.ts:3162](../../packages/store/src/store.ts#L3162) `Store/agentNeedsApproval` | `SQLite.get` (3162); `SQLite.prepare` (3162); `Store.sql` (3162) | CORE |
| [packages/store/src/store.ts:5931](../../packages/store/src/store.ts#L5931) `Store/allowedIds` | `SQLite.iterate` (5931); `SQLite.prepare` (5931); `Store.sql` (5931) | CORE |
| [packages/store/src/store.ts:5091](../../packages/store/src/store.ts#L5091) `Store/apiToken` | `SQLite.get` (5091); `SQLite.prepare` (5091, 5104); `Store.sql` (5091, 5104) | CORE |
| [packages/store/src/store.ts:5067](../../packages/store/src/store.ts#L5067) `Store/apiTokens` | `SQLite.all` (5067); `SQLite.prepare` (5067); `Store.sql` (5067) | CORE |
| [packages/store/src/store.ts:3485](../../packages/store/src/store.ts#L3485) `Store/appendSecurityEvent` | `Store.sql` (3485) | CORE |
| [packages/store/src/store.ts:4490](../../packages/store/src/store.ts#L4490) `Store/applyAccountImport` | `Store.sql` (4490, 4498, 4527); `SQLite.get` (4498); `SQLite.prepare` (4498, 4527) | CORE |
| [packages/store/src/store.ts:2105](../../packages/store/src/store.ts#L2105) `Store/applyDesign` | `Store.sql` (2105, 2106, 2119, 2122, 2127, 2143, 2146, 2146); `SQLite.prepare` (2122, 2127) | CORE |
| [packages/store/src/store.ts:3358](../../packages/store/src/store.ts#L3358) `Store/approvePending` | `SQLite.get` (3358); `SQLite.prepare` (3358, 3369); `Store.sql` (3358, 3369) | CORE |
| [packages/store/src/store.ts:2564](../../packages/store/src/store.ts#L2564) `Store/audit` | `Store.sql` (2564) | CORE |
| [packages/store/src/store.ts:2205](../../packages/store/src/store.ts#L2205) `Store/auditLog` | `SQLite.all` (2205); `SQLite.prepare` (2205); `Store.sql` (2205) | CORE |
| [packages/store/src/store.ts:1716](../../packages/store/src/store.ts#L1716) `Store/backup` | `Store.sql` (1716) | CORE |
| [packages/store/src/store.ts:3168](../../packages/store/src/store.ts#L3168) `Store/blankPasswordAccounts` | `SQLite.all` (3168); `SQLite.prepare` (3168); `Store.sql` (3168) | CORE |
| [packages/store/src/store.ts:8832](../../packages/store/src/store.ts#L8832) `Store/canView` | `Store.canView` (8832); `Store.row` (8833) | GATED-STORE |
| [packages/store/src/store.ts:8814](../../packages/store/src/store.ts#L8814) `Store/canViewRecord` | `SQLite.get` (8814); `SQLite.prepare` (8814); `Store.sql` (8814) | GATED-STORE |
| [packages/store/src/store.ts:4419](../../packages/store/src/store.ts#L4419) `Store/canonicalAccount` | `SQLite.all` (4419); `SQLite.prepare` (4419); `Store.sql` (4419) | CORE |
| [packages/store/src/store.ts:9891](../../packages/store/src/store.ts#L9891) `Store/cascadeDelete` | `relatedRows` (9891) | CORE |
| [packages/store/src/store.ts:1935](../../packages/store/src/store.ts#L1935) `Store/changeOne` | `Store.sql` (1935, 1937) | CORE |
| [packages/store/src/store.ts:1938](../../packages/store/src/store.ts#L1938) `Store/changeOne/read` | `SQLite.get` (1938); `SQLite.prepare` (1938); `Store.sql` (1938) | CORE |
| [packages/store/src/store.ts:8130](../../packages/store/src/store.ts#L8130) `Store/checkContainerWrite` | `Store.row` (8130) | CORE |
| [packages/store/src/store.ts:9544](../../packages/store/src/store.ts#L9544) `Store/checkEditable` | `Store.row` (9544) | CORE |
| [packages/store/src/store.ts:1371](../../packages/store/src/store.ts#L1371) `Store/checkpoint` | `SQLite.get` (1371); `SQLite.prepare` (1371); `Store.sql` (1371) | CORE |
| [packages/store/src/store.ts:5703](../../packages/store/src/store.ts#L5703) `Store/clearAccountPrivilegeSet` | `SQLite.prepare` (5703); `Store.sql` (5703) | CORE |
| [packages/store/src/store.ts:1389](../../packages/store/src/store.ts#L1389) `Store/close` | `Store.sql` (1389) | CORE |
| [packages/store/src/store.ts:8098](../../packages/store/src/store.ts#L8098) `Store/compactFile` | `Store.sql` (8098, 8099, 8101) | CORE |
| [packages/store/src/store.ts:10015](../../packages/store/src/store.ts#L10015) `Store/computeValuesCurrent` | `Store.computeValues` (10015); `Store.sql` (10021, 10025); `SQLite.all` (10025); `SQLite.prepare` (10025) | GATED-STORE |
| [packages/store/src/store.ts:8483](../../packages/store/src/store.ts#L8483) `Store/computedRows` | `Store.sql` (8483, 8486, 8487, 8488, 8490, 8500, 8501, 8502, 8505); `SQLite.prepare` (8486, 8488, 8490, 8500); `SQLite.iterate` (8490); `Calculations.globalValue` (8493); `Calculations.unstoredValue` (8494); `Calculations.related` (8497); `SQLite.all` (8500) | CORE |
| [packages/store/src/store.ts:5131](../../packages/store/src/store.ts#L5131) `Store/confirmTotp` | `SQLite.get` (5131); `SQLite.prepare` (5131, 5133); `Store.sql` (5131, 5133) | CORE |
| [packages/store/src/store.ts:1066](../../packages/store/src/store.ts#L1066) `Store/constructor` | `Store.sql` (1066, 1068, 1070, 1071, 1075, 1079, 1080, 1091, 1096, 1101, 1102, 1106, 1107, 1108, 1115, 1119, 1123, 1124, 1125, 1130, 1134, 1137, 1138, 1140, 1141, 1144, 1145, 1149, 1150, 1154, 1155, 1158, 1160, 1163, 1164, 1168, 1169, 1173, 1174, 1177, 1178, 1179, 1182, 1183, 1186, 1187, 1189, 1189, 1190, 1190, 1191, 1194, 1198, 1200, 1203, 1204, 1205, 1208, 1209, 1211, 1213, 1214, 1218, 1219, 1221, 1225, 1227, 1228, 1229, 1229, 1233, 1234); `SQLite.get` (1070); `SQLite.prepare` (1070, 1137, 1138, 1141, 1144, 1149, 1154, 1163, 1168, 1173, 1182, 1186, 1189, 1190, 1208, 1213, 1218); `SQLite.all` (1137, 1144, 1149, 1154, 1163, 1168, 1173, 1182, 1186, 1189, 1190, 1208, 1213, 1218) | CORE |
| [packages/store/src/store.ts:5484](../../packages/store/src/store.ts#L5484) `Store/consumeRecoveryCode` | `SQLite.prepare` (5484); `Store.sql` (5484) | CORE |
| [packages/store/src/store.ts:7673](../../packages/store/src/store.ts#L7673) `Store/container` | `SQLite.get` (7673); `SQLite.prepare` (7673, 7682); `Store.sql` (7673, 7682); `SQLite.all` (7682) | CORE |
| [packages/store/src/store.ts:8107](../../packages/store/src/store.ts#L8107) `Store/containerId` | `Store.containerId` (8107); `Store.row` (8108) | CORE |
| [packages/store/src/store.ts:7690](../../packages/store/src/store.ts#L7690) `Store/containerInfo` | `SQLite.get` (7690); `SQLite.prepare` (7690); `Store.sql` (7690) | CORE |
| [packages/store/src/store.ts:7654](../../packages/store/src/store.ts#L7654) `Store/containerIntact` | `SQLite.get` (7654); `SQLite.prepare` (7654); `Store.sql` (7654) | CORE |
| [packages/store/src/store.ts:7593](../../packages/store/src/store.ts#L7593) `Store/containerIntegrityReport` | `SQLite.all` (7593); `SQLite.prepare` (7593, 7604); `Store.sql` (7593, 7604); `SQLite.get` (7604) | CORE |
| [packages/store/src/store.ts:7668](../../packages/store/src/store.ts#L7668) `Store/containerMeta` | `SQLite.get` (7668); `SQLite.prepare` (7668); `Store.sql` (7668) | CORE |
| [packages/store/src/store.ts:7724](../../packages/store/src/store.ts#L7724) `Store/containerRange` | `SQLite.all` (7724); `SQLite.prepare` (7724, 7731); `Store.sql` (7724, 7731); `SQLite.get` (7731) | CORE |
| [packages/store/src/store.ts:7495](../../packages/store/src/store.ts#L7495) `Store/containerReferences` | `SQLite.all` (7495, 7514, 7516, 7522, 7535, 7546, 7560); `SQLite.prepare` (7495, 7514, 7516, 7522, 7535, 7546, 7558, 7560); `Store.sql` (7495, 7514, 7516, 7522, 7535, 7546, 7558, 7560); `SQLite.get` (7558); `Store.row` (7569) | CORE |
| [packages/store/src/store.ts:9995](../../packages/store/src/store.ts#L9995) `Store/countIds` | `Store.countIds` (9995); `SQLite.get` (9999); `SQLite.prepare` (9999); `Store.sql` (9999) | GATED-STORE |
| [packages/store/src/store.ts:8857](../../packages/store/src/store.ts#L8857) `Store/create` | `SQLite.get` (8857, 8863); `SQLite.prepare` (8857, 8863, 8876); `Store.sql` (8857, 8863, 8876) | CORE |
| [packages/store/src/store.ts:3457](../../packages/store/src/store.ts#L3457) `Store/createAccount` | `SQLite.get` (3457); `SQLite.prepare` (3457, 3461, 3467, 3472, 3477); `Store.sql` (3457, 3461, 3467, 3472, 3477) | CORE |
| [packages/store/src/store.ts:4867](../../packages/store/src/store.ts#L4867) `Store/createApiToken` | `SQLite.get` (4867, 4895); `SQLite.prepare` (4867, 4894, 4895, 4905); `Store.sql` (4867, 4894, 4895, 4905) | CORE |
| [packages/store/src/store.ts:4431](../../packages/store/src/store.ts#L4431) `Store/createLocalAccount` | `SQLite.prepare` (4431); `Store.sql` (4431) | CORE |
| [packages/store/src/store.ts:3134](../../packages/store/src/store.ts#L3134) `Store/credentialIdentity` | `SQLite.get` (3134); `SQLite.prepare` (3134); `Store.sql` (3134) | CORE |
| [packages/store/src/store.ts:1806](../../packages/store/src/store.ts#L1806) `Store/dataVersion` | `SQLite.get` (1806); `SQLite.prepare` (1806); `Store.sql` (1806) | CORE |
| [packages/store/src/store.ts:9587](../../packages/store/src/store.ts#L9587) `Store/delete` | `Store.row` (9587) | CORE |
| [packages/store/src/store.ts:9595](../../packages/store/src/store.ts#L9595) `Store/delete/run` | `SQLite.get` (9595); `SQLite.prepare` (9595, 9600); `Store.sql` (9595, 9600) | CORE |
| [packages/store/src/store.ts:4585](../../packages/store/src/store.ts#L4585) `Store/deleteAccount` | `SQLite.prepare` (4585, 4589, 4590, 4591, 4592, 4593, 4594, 4595, 4596, 4603, 4605, 4607, 4609, 4613); `Store.sql` (4585, 4589, 4590, 4591, 4592, 4593, 4594, 4595, 4596, 4603, 4605, 4607, 4609, 4613) | CORE |
| [packages/store/src/store.ts:5569](../../packages/store/src/store.ts#L5569) `Store/deletePrivilegeSet` | `SQLite.prepare` (5569); `Store.sql` (5569) | CORE |
| [packages/store/src/store.ts:3595](../../packages/store/src/store.ts#L3595) `Store/deleteScriptTest` | `SQLite.prepare` (3595); `Store.sql` (3595) | CORE |
| [packages/store/src/store.ts:2779](../../packages/store/src/store.ts#L2779) `Store/deletedRows` | `SQLite.get` (2779); `SQLite.prepare` (2779, 2781, 2781); `Store.sql` (2779, 2781, 2781); `SQLite.all` (2781, 2781) | CORE |
| [packages/store/src/store.ts:2889](../../packages/store/src/store.ts#L2889) `Store/designEffect` | `Store.sql` (2889, 2894, 2899, 2904, 2907, 2913, 2924, 2925, 2927, 2940, 2941, 2944, 2946, 2952, 2953, 2954, 2959, 2961, 2965, 2968, 2969, 2971, 2974, 2980, 2982, 2989, 2990, 2992, 2993, 2994, 2995, 3002, 3003, 3005, 3005, 3007, 3008, 3009, 3013, 3017, 3019, 3057, 3059, 3061); `SQLite.get` (2924, 2940, 2952, 2953, 2965, 2969, 3005, 3013); `SQLite.prepare` (2924, 2925, 2940, 2941, 2952, 2953, 2959, 2961, 2965, 2969, 2980, 2982, 2995, 3002, 3003, 3005, 3007, 3009, 3013, 3017); `SQLite.all` (3002, 3003); `SQLite.iterate` (3007) | CORE |
| [packages/store/src/store.ts:2882](../../packages/store/src/store.ts#L2882) `Store/designEffect/renameExcluded` | `SQLite.prepare` (2882); `Store.sql` (2882) | CORE |
| [packages/store/src/store.ts:2866](../../packages/store/src/store.ts#L2866) `Store/designEffect/renameKey` | `SQLite.prepare` (2866); `Store.sql` (2866) | CORE |
| [packages/store/src/store.ts:2820](../../packages/store/src/store.ts#L2820) `Store/designHistory` | `SQLite.all` (2820); `SQLite.prepare` (2820); `Store.sql` (2820) | CORE |
| [packages/store/src/store.ts:5152](../../packages/store/src/store.ts#L5152) `Store/disableTotp` | `SQLite.prepare` (5152); `Store.sql` (5152) | CORE |
| [packages/store/src/store.ts:3069](../../packages/store/src/store.ts#L3069) `Store/dropColumnIndexes` | `SQLite.all` (3069, 3071); `SQLite.prepare` (3069, 3071); `Store.sql` (3069, 3071, 3072) | CORE |
| [packages/store/src/store.ts:8263](../../packages/store/src/store.ts#L8263) `Store/dropFieldIndex` | `SQLite.get` (8263); `SQLite.prepare` (8263); `Store.sql` (8263, 8264) | CORE |
| [packages/store/src/store.ts:8900](../../packages/store/src/store.ts#L8900) `Store/duplicate` | `Store.row` (8900); `SQLite.get` (8904); `SQLite.prepare` (8904, 8919); `Store.sql` (8904, 8919) | CORE |
| [packages/store/src/store.ts:7911](../../packages/store/src/store.ts#L7911) `Store/embeddedContainerCount` | `SQLite.prepare` (7911); `Store.sql` (7911); `SQLite.get` (7912) | CORE |
| [packages/store/src/store.ts:7897](../../packages/store/src/store.ts#L7897) `Store/embeddedContainers` | `SQLite.prepare` (7897, 7898); `Store.sql` (7897, 7898); `SQLite.all` (7898); `SQLite.get` (7902) | CORE |
| [packages/store/src/store.ts:2805](../../packages/store/src/store.ts#L2805) `Store/emptyDeleted` | `Store.sql` (2805, 2808, 2809, 2811, 2813); `SQLite.prepare` (2809) | CORE |
| [packages/store/src/store.ts:1686](../../packages/store/src/store.ts#L1686) `Store/endTransaction` | `Store.sql` (1686, 1689, 1689) | CORE |
| [packages/store/src/store.ts:5120](../../packages/store/src/store.ts#L5120) `Store/enrollTotp` | `SQLite.prepare` (5120); `Store.sql` (5120) | CORE |
| [packages/store/src/store.ts:2774](../../packages/store/src/store.ts#L2774) `Store/ensureDeleted` | `Store.sql` (2774) | CORE |
| [packages/store/src/store.ts:1244](../../packages/store/src/store.ts#L1244) `Store/ensureNativeIds` | `SQLite.all` (1244, 1256); `SQLite.prepare` (1244, 1247, 1255, 1256); `Store.sql` (1244, 1247, 1250, 1254, 1255, 1256, 1259, 1261) | CORE |
| [packages/store/src/store.ts:9241](../../packages/store/src/store.ts#L9241) `Store/evaluateCurrent` | `Store.row` (9241, 9241, 9242, 9242); `Calculations.context` (9247); `Store.get` (9248, 9250) | GATED-STORE |
| [packages/store/src/store.ts:9282](../../packages/store/src/store.ts#L9282) `Store/evaluateEachCurrent` | `Store.row` (9282, 9282, 9287); `Calculations.context` (9288); `Store.get` (9290) | GATED-STORE |
| [packages/store/src/store.ts:9344](../../packages/store/src/store.ts#L9344) `Store/evaluateRowsCurrent` | `Store.row` (9344, 9344, 9345, 9345) | GATED-STORE |
| [packages/store/src/store.ts:9323](../../packages/store/src/store.ts#L9323) `Store/evaluateRowsCurrent/each` | `Calculations.context` (9323); `Store.get` (9325) | GATED-STORE |
| [packages/store/src/store.ts:9359](../../packages/store/src/store.ts#L9359) `Store/evaluateRowsCurrent/found/[Symbol.iterator]` | `rowsById` (9359) | GATED-STORE |
| [packages/store/src/store.ts:9381](../../packages/store/src/store.ts#L9381) `Store/evaluateRowsCurrent/key` | `Calculations.context` (9381) | GATED-STORE |
| [packages/store/src/store.ts:3401](../../packages/store/src/store.ts#L3401) `Store/externalAccount` | `SQLite.all` (3401); `SQLite.prepare` (3401); `Store.sql` (3401) | CORE |
| [packages/store/src/store.ts:7416](../../packages/store/src/store.ts#L7416) `Store/externalContainerCheck` | `SQLite.all` (7416); `SQLite.prepare` (7416); `Store.sql` (7416) | CORE |
| [packages/store/src/store.ts:7423](../../packages/store/src/store.ts#L7423) `Store/externalContainerCount` | `SQLite.get` (7423); `SQLite.prepare` (7423); `Store.sql` (7423) | CORE |
| [packages/store/src/store.ts:7432](../../packages/store/src/store.ts#L7432) `Store/externalContainerReport` | `SQLite.all` (7432, 7445); `SQLite.prepare` (7432, 7445); `Store.sql` (7432, 7445) | CORE |
| [packages/store/src/store.ts:4670](../../packages/store/src/store.ts#L4670) `Store/externalIdentityId` | `SQLite.get` (4670, 4676); `SQLite.prepare` (4670, 4675, 4676); `Store.sql` (4670, 4675, 4676) | CORE |
| [packages/store/src/store.ts:7664](../../packages/store/src/store.ts#L7664) `Store/externalOf` | `SQLite.get` (7664); `SQLite.prepare` (7664); `Store.sql` (7664) | CORE |
| [packages/store/src/store.ts:2712](../../packages/store/src/store.ts#L2712) `Store/failureAuditRoom` | `SQLite.get` (2712); `SQLite.prepare` (2712); `Store.sql` (2712) | CORE |
| [packages/store/src/store.ts:7076](../../packages/store/src/store.ts#L7076) `Store/fieldIndexCurrent` | `SQLite.iterate` (7076); `SQLite.prepare` (7076, 7081); `Store.sql` (7076, 7081); `SQLite.all` (7081) | GATED-STORE |
| [packages/store/src/store.ts:8298](../../packages/store/src/store.ts#L8298) `Store/find` | `Store.find` (8298) | GATED-STORE |
| [packages/store/src/store.ts:8670](../../packages/store/src/store.ts#L8670) `Store/findCandidates` | `Store.query` (8670) | CORE |
| [packages/store/src/store.ts:8309](../../packages/store/src/store.ts#L8309) `Store/findHere` | `Store.query` (8309, 8314, 8316, 8330, 8332, 8343); `Store.recordCount` (8327); `SQLite.get` (8328, 8332); `SQLite.prepare` (8328, 8332, 8338, 8345, 8354); `Store.sql` (8328, 8332, 8338, 8345, 8354); `SQLite.all` (8338, 8345, 8354) | GATED-STORE |
| [packages/store/src/store.ts:8349](../../packages/store/src/store.ts#L8349) `Store/findHere/[Symbol.iterator]` | `SQLite.iterate` (8349); `SQLite.prepare` (8349); `Store.sql` (8349) | GATED-STORE |
| [packages/store/src/store.ts:10040](../../packages/store/src/store.ts#L10040) `Store/findIdsCurrent` | `Store.findIds` (10040) | GATED-STORE |
| [packages/store/src/store.ts:10046](../../packages/store/src/store.ts#L10046) `Store/findIdsHere` | `Store.query` (10046, 10051, 10053); `SQLite.iterate` (10064); `SQLite.prepare` (10064); `Store.sql` (10064) | GATED-STORE |
| [packages/store/src/store.ts:8614](../../packages/store/src/store.ts#L8614) `Store/findSource` | `Store.query` (8614); `SQLite.all` (8623, 8640); `SQLite.prepare` (8623, 8631, 8639); `Store.sql` (8623, 8628, 8631, 8636, 8639, 8653, 8655); `Calculations.globalValue` (8645); `Calculations.unstoredValue` (8646); `Calculations.related` (8650) | CORE |
| [packages/store/src/store.ts:9636](../../packages/store/src/store.ts#L9636) `Store/forgetStandInValues` | `Store.sql` (9636, 9657); `SQLite.prepare` (9657) | CORE |
| [packages/store/src/store.ts:4552](../../packages/store/src/store.ts#L4552) `Store/forgetStandIns` | `SQLite.prepare` (4552); `Store.sql` (4552) | CORE |
| [packages/store/src/store.ts:6958](../../packages/store/src/store.ts#L6958) `Store/foundSetPage` | `rowsById` (6958) | CORE |
| [packages/store/src/store.ts:6974](../../packages/store/src/store.ts#L6974) `Store/foundSetRowsCurrent` | `Store.viewableIds` (6974); `Store.row` (6990) | GATED-STORE |
| [packages/store/src/store.ts:3320](../../packages/store/src/store.ts#L3320) `Store/gateAgentWrite` | `SQLite.get` (3320); `SQLite.prepare` (3320, 3322); `Store.sql` (3320, 3322) | CORE |
| [packages/store/src/store.ts:5422](../../packages/store/src/store.ts#L5422) `Store/generateRecoveryCodes` | `SQLite.prepare` (5422, 5425); `Store.sql` (5422, 5425) | CORE |
| [packages/store/src/store.ts:8742](../../packages/store/src/store.ts#L8742) `Store/getCurrent` | `Store.get` (8742); `Store.row` (8743, 8743, 8757); `SQLite.all` (8760); `SQLite.prepare` (8760); `Store.sql` (8760) | GATED-STORE |
| [packages/store/src/store.ts:8780](../../packages/store/src/store.ts#L8780) `Store/getManyCurrent` | `Store.getMany` (8780); `SQLite.get` (8798); `SQLite.prepare` (8798); `Store.sql` (8798) | GATED-STORE |
| [packages/store/src/store.ts:8791](../../packages/store/src/store.ts#L8791) `Store/getManyCurrent/[Symbol.iterator]` | `rowsById` (8791) | GATED-STORE |
| [packages/store/src/store.ts:1291](../../packages/store/src/store.ts#L1291) `Store/grantFullAccessClients` | `SQLite.prepare` (1291); `Store.sql` (1291) | CORE |
| [packages/store/src/store.ts:10081](../../packages/store/src/store.ts#L10081) `Store/groupSummariesCurrent` | `Store.groupSummaries` (10081); `Store.viewableIds` (10086); `Calculations.collect` (10102); `rowsById` (10102, 10152); `Calculations.collector` (10124) | GATED-STORE |
| [packages/store/src/store.ts:10150](../../packages/store/src/store.ts#L10150) `Store/groupSummariesCurrent/flush` | `Calculations.collector` (10150) | GATED-STORE |
| [packages/store/src/store.ts:10114](../../packages/store/src/store.ts#L10114) `Store/groupSummariesCurrent/key` | `Calculations.value` (10114); `Calculations.related` (10116) | GATED-STORE |
| [packages/store/src/store.ts:1299](../../packages/store/src/store.ts#L1299) `Store/hasOwnPassword` | `SQLite.get` (1299); `SQLite.prepare` (1299); `Store.sql` (1299) | CORE |
| [packages/store/src/store.ts:5277](../../packages/store/src/store.ts#L5277) `Store/hasPasskey` | `SQLite.get` (5277); `SQLite.prepare` (5277); `Store.sql` (5277) | CORE |
| [packages/store/src/store.ts:8217](../../packages/store/src/store.ts#L8217) `Store/hasTable` | `SQLite.get` (8217); `SQLite.prepare` (8217); `Store.sql` (8217) | CORE |
| [packages/store/src/store.ts:5141](../../packages/store/src/store.ts#L5141) `Store/hasTotp` | `SQLite.get` (5141); `SQLite.prepare` (5141); `Store.sql` (5141) | CORE |
| [packages/store/src/store.ts:4649](../../packages/store/src/store.ts#L4649) `Store/identityAllowed` | `SQLite.get` (4649, 4655, 4661); `SQLite.prepare` (4649, 4655, 4661); `Store.sql` (4649, 4655, 4661) | CORE |
| [packages/store/src/store.ts:6433](../../packages/store/src/store.ts#L6433) `Store/image` | `SQLite.get` (6433); `SQLite.prepare` (6433); `Store.sql` (6433) | CORE |
| [packages/store/src/store.ts:6443](../../packages/store/src/store.ts#L6443) `Store/images` | `SQLite.all` (6443); `SQLite.prepare` (6443); `Store.sql` (6443) | CORE |
| [packages/store/src/store.ts:4396](../../packages/store/src/store.ts#L4396) `Store/importAccounts` | `SQLite.all` (4396); `SQLite.prepare` (4396); `Store.sql` (4396) | CORE |
| [packages/store/src/store.ts:1555](../../packages/store/src/store.ts#L1555) `Store/independentWindowWrite` | `SQLite.get` (1555); `SQLite.prepare` (1555, 1585); `Store.sql` (1555, 1564, 1580, 1585, 1588) | CORE |
| [packages/store/src/store.ts:8229](../../packages/store/src/store.ts#L8229) `Store/indexedFields` | `SQLite.all` (8229, 8230); `SQLite.prepare` (8229, 8230); `Store.sql` (8229, 8230) | CORE |
| [packages/store/src/store.ts:10448](../../packages/store/src/store.ts#L10448) `Store/internalRoots` | `SQLite.get` (10448); `SQLite.prepare` (10448, 10450); `SQLite.all` (10450) | CORE |
| [packages/store/src/store.ts:3156](../../packages/store/src/store.ts#L3156) `Store/isAgent` | `SQLite.get` (3156); `SQLite.prepare` (3156); `Store.sql` (3156) | CORE |
| [packages/store/src/store.ts:3259](../../packages/store/src/store.ts#L3259) `Store/isExternal` | `SQLite.get` (3259); `SQLite.prepare` (3259); `Store.sql` (3259) | CORE |
| [packages/store/src/store.ts:5194](../../packages/store/src/store.ts#L5194) `Store/issueWebauthnChallenge` | `SQLite.prepare` (5194, 5196, 5197, 5199); `Store.sql` (5194, 5196, 5197, 5199); `SQLite.get` (5196) | CORE |
| [packages/store/src/store.ts:10355](../../packages/store/src/store.ts#L10355) `Store/iterateCommitted` | `SQLite.iterate` (10355) | CORE |
| [packages/store/src/store.ts:1532](../../packages/store/src/store.ts#L1532) `Store/joinTransaction` | `Store.sql` (1532, 1533, 1535, 1537, 1543) | CORE |
| [packages/store/src/store.ts:9838](../../packages/store/src/store.ts#L9838) `Store/keyStepWork` | `Store.sql` (9838, 9844, 9848, 9850) | CORE |
| [packages/store/src/store.ts:6300](../../packages/store/src/store.ts#L6300) `Store/knownSharedAccount` | `SQLite.get` (6300); `SQLite.prepare` (6300); `Store.sql` (6300) | CORE |
| [packages/store/src/store.ts:3869](../../packages/store/src/store.ts#L3869) `Store/lastSignIns` | `Store.auditLog` (3869) | CORE |
| [packages/store/src/store.ts:6473](../../packages/store/src/store.ts#L6473) `Store/layout` | `SQLite.get` (6473); `SQLite.prepare` (6473); `Store.sql` (6473) | CORE |
| [packages/store/src/store.ts:2837](../../packages/store/src/store.ts#L2837) `Store/layoutHistory` | `SQLite.all` (2837); `SQLite.prepare` (2837); `Store.sql` (2837) | CORE |
| [packages/store/src/store.ts:6363](../../packages/store/src/store.ts#L6363) `Store/layouts` | `SQLite.all` (6363); `SQLite.prepare` (6363); `Store.sql` (6363) | CORE |
| [packages/store/src/store.ts:4169](../../packages/store/src/store.ts#L4169) `Store/leastPrivilege` | `SQLite.all` (4169); `SQLite.prepare` (4169); `Store.sql` (4169) | CORE |
| [packages/store/src/store.ts:4733](../../packages/store/src/store.ts#L4733) `Store/ledgerRow` | `SQLite.get` (4733, 4734); `SQLite.prepare` (4733, 4734); `Store.sql` (4733, 4734) | AUTH |
| [packages/store/src/store.ts:4745](../../packages/store/src/store.ts#L4745) `Store/ledgerWrite` | `Store.sql` (4745, 4746, 4748, 4750, 4753, 4753) | AUTH |
| [packages/store/src/store.ts:4479](../../packages/store/src/store.ts#L4479) `Store/limitAccountImport` | `SQLite.prepare` (4479, 4480, 4483); `Store.sql` (4479, 4480, 4483); `SQLite.get` (4480) | CORE |
| [packages/store/src/store.ts:3109](../../packages/store/src/store.ts#L3109) `Store/linkIdentity` | `SQLite.get` (3109); `SQLite.prepare` (3109); `Store.sql` (3109) | CORE |
| [packages/store/src/store.ts:3101](../../packages/store/src/store.ts#L3101) `Store/linkPrincipal` | `SQLite.get` (3101); `SQLite.prepare` (3101); `Store.sql` (3101) | CORE |
| [packages/store/src/store.ts:2738](../../packages/store/src/store.ts#L2738) `Store/logSecurity` | `Store.sql` (2738) | CORE |
| [packages/store/src/store.ts:3755](../../packages/store/src/store.ts#L3755) `Store/markPiiField` | `SQLite.prepare` (3755); `Store.sql` (3755) | CORE |
| [packages/store/src/store.ts:7389](../../packages/store/src/store.ts#L7389) `Store/markRepeating` | `SQLite.prepare` (7389); `Store.sql` (7389) | CORE |
| [packages/store/src/store.ts:10288](../../packages/store/src/store.ts#L10288) `Store/matchIds` | `Store.matchIds` (10288); `SQLite.all` (10294); `SQLite.prepare` (10294); `Store.sql` (10294) | CORE |
| [packages/store/src/store.ts:1314](../../packages/store/src/store.ts#L1314) `Store/meta` | `SQLite.get` (1314); `SQLite.prepare` (1314); `Store.sql` (1314) | CORE |
| [packages/store/src/store.ts:923](../../packages/store/src/store.ts#L923) `Store/metadataVersions` | `SQLite.get` (923); `SQLite.prepare` (923); `Store.sql` (923) | CORE |
| [packages/store/src/store.ts:8026](../../packages/store/src/store.ts#L8026) `Store/moveContainersIn` | `Store.sql` (8026, 8032, 8034, 8035, 8036, 8037, 8057, 8062, 8062, 8073, 8076, 8079, 8086); `SQLite.prepare` (8034, 8035, 8036, 8037, 8073, 8079); `SQLite.get` (8039, 8073, 8079) | CORE |
| [packages/store/src/store.ts:7948](../../packages/store/src/store.ts#L7948) `Store/moveContainersOut` | `Store.sql` (7948, 7956, 7958, 7960, 7965, 7966, 7986, 7992, 7994, 7996, 7996, 8002, 8002, 8007, 8009, 8011, 8011, 8017); `SQLite.get` (7956); `SQLite.prepare` (7956, 7965, 7966); `Store.container` (7968) | CORE |
| [packages/store/src/store.ts:4350](../../packages/store/src/store.ts#L4350) `Store/mustChangePassword` | `SQLite.get` (4350); `SQLite.prepare` (4350); `Store.sql` (4350) | CORE |
| [packages/store/src/store.ts:1269](../../packages/store/src/store.ts#L1269) `Store/nativeIdGuards` | `Store.sql` (1269, 1270, 1272) | CORE |
| [packages/store/src/store.ts:5021](../../packages/store/src/store.ts#L5021) `Store/objectUseSince` | `SQLite.get` (5021); `SQLite.prepare` (5021); `Store.sql` (5021) | CORE |
| [packages/store/src/store.ts:8189](../../packages/store/src/store.ts#L8189) `Store/orderBy` | `Store.valueListItems` (8189) | CORE |
| [packages/store/src/store.ts:7581](../../packages/store/src/store.ts#L7581) `Store/orphanContainerReport` | `SQLite.all` (7581); `SQLite.prepare` (7581); `Store.sql` (7581) | CORE |
| [packages/store/src/store.ts:5246](../../packages/store/src/store.ts#L5246) `Store/passkeyAllowList` | `SQLite.all` (5246); `SQLite.prepare` (5246); `Store.sql` (5246) | CORE |
| [packages/store/src/store.ts:5282](../../packages/store/src/store.ts#L5282) `Store/passkeyIds` | `SQLite.all` (5282); `SQLite.prepare` (5282); `Store.sql` (5282) | CORE |
| [packages/store/src/store.ts:5270](../../packages/store/src/store.ts#L5270) `Store/passkeys` | `SQLite.all` (5270); `SQLite.prepare` (5270); `Store.sql` (5270) | CORE |
| [packages/store/src/store.ts:4389](../../packages/store/src/store.ts#L4389) `Store/passwordDaysRemaining` | `SQLite.get` (4389); `SQLite.prepare` (4389); `Store.sql` (4389) | CORE |
| [packages/store/src/store.ts:3344](../../packages/store/src/store.ts#L3344) `Store/pendingChanges` | `SQLite.all` (3344); `SQLite.prepare` (3344); `Store.sql` (3344) | CORE |
| [packages/store/src/store.ts:1332](../../packages/store/src/store.ts#L1332) `Store/persistentData` | `SQLite.get` (1332) | CORE |
| [packages/store/src/store.ts:1341](../../packages/store/src/store.ts#L1341) `Store/persistentDataIds` | `SQLite.all` (1341) | CORE |
| [packages/store/src/store.ts:1322](../../packages/store/src/store.ts#L1322) `Store/persistentTable` | `Store.sql` (1322) | CORE |
| [packages/store/src/store.ts:9529](../../packages/store/src/store.ts#L9529) `Store/portalContainerTarget` | `Store.row` (9529); `relatedIdList` (9531) | CORE |
| [packages/store/src/store.ts:7013](../../packages/store/src/store.ts#L7013) `Store/portalCountsCurrent` | `Store.canView` (7013); `Store.row` (7040) | GATED-STORE |
| [packages/store/src/store.ts:7251](../../packages/store/src/store.ts#L7251) `Store/portalRows` | `relatedRows` (7251); `relatedIdList` (7252); `Store.viewableIds` (7255); `rowsById` (7280, 7318); `Calculations.related` (7294) | CORE |
| [packages/store/src/store.ts:7262](../../packages/store/src/store.ts#L7262) `Store/portalRows/context` | `Calculations.context` (7262) | CORE |
| [packages/store/src/store.ts:7272](../../packages/store/src/store.ts#L7272) `Store/portalRows/valueOf` | `Calculations.value` (7272) | CORE |
| [packages/store/src/store.ts:2271](../../packages/store/src/store.ts#L2271) `Store/prepared` | `SQLite.prepare` (2271); `Store.sql` (2271) | CORE |
| [packages/store/src/store.ts:4461](../../packages/store/src/store.ts#L4461) `Store/previewAccountImport` | `Store.sql` (4461, 4462, 4471) | CORE |
| [packages/store/src/store.ts:6064](../../packages/store/src/store.ts#L6064) `Store/previewRecordRuleCurrent` | `SQLite.get` (6064); `SQLite.prepare` (6064, 6067); `Store.sql` (6064, 6067); `SQLite.all` (6067); `Calculations.context` (6073, 6089) | CORE |
| [packages/store/src/store.ts:8705](../../packages/store/src/store.ts#L8705) `Store/previewRow` | `Store.row` (8705) | CORE |
| [packages/store/src/store.ts:5497](../../packages/store/src/store.ts#L5497) `Store/privilegeSets` | `Store.sql` (5497) | CORE |
| [packages/store/src/store.ts:2482](../../packages/store/src/store.ts#L2482) `Store/pruneAudit` | `Store.sql` (2482, 2484, 2486); `SQLite.get` (2484); `SQLite.prepare` (2484) | CORE |
| [packages/store/src/store.ts:7616](../../packages/store/src/store.ts#L7616) `Store/purgeOrphanContainers` | `Store.sql` (7616, 7620, 7629, 7632, 7633, 7638, 7639, 7641, 7641); `Store.orphanContainerReport` (7624); `SQLite.get` (7629); `SQLite.prepare` (7629, 7632, 7633) | CORE |
| [packages/store/src/store.ts:10547](../../packages/store/src/store.ts#L10547) `Store/query` | `SQLite.iterate` (10547) | CORE |
| [packages/store/src/store.ts:10581](../../packages/store/src/store.ts#L10581) `Store/queryWithOriginsCurrent` | `SQLite.iterate` (10581); `SQLite.all` (10588, 10591); `SQLite.prepare` (10588, 10591) | CORE |
| [packages/store/src/store.ts:10389](../../packages/store/src/store.ts#L10389) `Store/readOnlyChecked` | `SQLite.prepare` (10389, 10393, 10402, 10407); `SQLite.all` (10393, 10402, 10407) | CORE |
| [packages/store/src/store.ts:3081](../../packages/store/src/store.ts#L3081) `Store/recompute` | `SQLite.prepare` (3081, 3085); `Store.sql` (3081, 3085); `SQLite.iterate` (3085); `Calculations.computeStoredStyled` (3086); `Calculations.value` (3086) | CORE |
| [packages/store/src/store.ts:2286](../../packages/store/src/store.ts#L2286) `Store/recordAsOf` | `SQLite.get` (2286, 2288); `SQLite.prepare` (2286, 2288, 2290, 2291); `Store.sql` (2286, 2288, 2290, 2291); `SQLite.all` (2290, 2291) | CORE |
| [packages/store/src/store.ts:1989](../../packages/store/src/store.ts#L1989) `Store/recordCount` | `SQLite.get` (1989); `SQLite.prepare` (1989); `Store.sql` (1989) | CORE |
| [packages/store/src/store.ts:4952](../../packages/store/src/store.ts#L4952) `Store/recordObjectUse` | `Store.sql` (4952) | CORE |
| [packages/store/src/store.ts:9231](../../packages/store/src/store.ts#L9231) `Store/recordViewable` | `Store.row` (9231) | GATED-STORE |
| [packages/store/src/store.ts:1379](../../packages/store/src/store.ts#L1379) `Store/recordedFormat` | `Store.sql` (1379) | CORE |
| [packages/store/src/store.ts:7920](../../packages/store/src/store.ts#L7920) `Store/recoverContainersOut` | `SQLite.prepare` (7920); `Store.sql` (7920); `SQLite.get` (7923) | CORE |
| [packages/store/src/store.ts:1461](../../packages/store/src/store.ts#L1461) `Store/recoverPendingExternalFiles` | `Store.sql` (1461, 1463, 1487, 1489); `SQLite.prepare` (1463); `SQLite.get` (1474) | CORE |
| [packages/store/src/store.ts:5440](../../packages/store/src/store.ts#L5440) `Store/recoveryCodesRemaining` | `SQLite.get` (5440); `SQLite.prepare` (5440); `Store.sql` (5440) | CORE |
| [packages/store/src/store.ts:10429](../../packages/store/src/store.ts#L10429) `Store/refreshDecimalSqlViews` | `SQLite.get` (10429); `SQLite.prepare` (10429, 10434); `SQLite.all` (10434) | CORE |
| [packages/store/src/store.ts:3250](../../packages/store/src/store.ts#L3250) `Store/refuseLookalikeAccount` | `SQLite.all` (3250); `SQLite.prepare` (3250); `Store.sql` (3250) | CORE |
| [packages/store/src/store.ts:5306](../../packages/store/src/store.ts#L5306) `Store/registerPasskey` | `SQLite.prepare` (5306); `Store.sql` (5306) | CORE |
| [packages/store/src/store.ts:3379](../../packages/store/src/store.ts#L3379) `Store/rejectPending` | `SQLite.get` (3379); `SQLite.prepare` (3379, 3381); `Store.sql` (3379, 3381) | CORE |
| [packages/store/src/store.ts:8457](../../packages/store/src/store.ts#L8457) `Store/relatedCriteria` | `SQLite.iterate` (8457); `SQLite.prepare` (8457); `Store.sql` (8457) | CORE |
| [packages/store/src/store.ts:8454](../../packages/store/src/store.ts#L8454) `Store/relatedCriteria/matched` | `relatedRows` (8454) | CORE |
| [packages/store/src/store.ts:6801](../../packages/store/src/store.ts#L6801) `Store/relatedValues` | `Calculations.globalValue` (6801); `Calculations.unstoredValue` (6803) | CORE |
| [packages/store/src/store.ts:5319](../../packages/store/src/store.ts#L5319) `Store/removePasskey` | `SQLite.get` (5319); `SQLite.prepare` (5319, 5320); `Store.sql` (5319, 5320) | CORE |
| [packages/store/src/store.ts:9676](../../packages/store/src/store.ts#L9676) `Store/restoreDeletedRowLocked` | `SQLite.get` (9676, 9681); `SQLite.prepare` (9676, 9677, 9681, 9691); `Store.sql` (9676, 9677, 9681, 9691); `SQLite.all` (9677) | CORE |
| [packages/store/src/store.ts:2321](../../packages/store/src/store.ts#L2321) `Store/restoreRecord` | `Store.recordAsOf` (2321); `SQLite.get` (2325); `SQLite.prepare` (2325, 2330, 2339, 2350); `Store.sql` (2325, 2330, 2339, 2350) | CORE |
| [packages/store/src/store.ts:2365](../../packages/store/src/store.ts#L2365) `Store/revertAuditEntry` | `Store.auditLog` (2365) | CORE |
| [packages/store/src/store.ts:5077](../../packages/store/src/store.ts#L5077) `Store/revokeApiToken` | `SQLite.prepare` (5077); `Store.sql` (5077) | CORE |
| [packages/store/src/store.ts:8723](../../packages/store/src/store.ts#L8723) `Store/row` | `SQLite.get` (8723) | CORE |
| [packages/store/src/store.ts:5890](../../packages/store/src/store.ts#L5890) `Store/ruleOutcome` | `Calculations.context` (5890) | CORE |
| [packages/store/src/store.ts:8568](../../packages/store/src/store.ts#L8568) `Store/runningSummaryValues` | `Store.viewableIds` (8568); `rowsById` (8570); `Calculations.value` (8581, 8587); `Calculations.related` (8598) | GATED-STORE |
| [packages/store/src/store.ts:5526](../../packages/store/src/store.ts#L5526) `Store/savePrivilegeSet` | `SQLite.prepare` (5526, 5534); `Store.sql` (5526, 5534) | AUTH |
| [packages/store/src/store.ts:3586](../../packages/store/src/store.ts#L3586) `Store/saveScriptTest` | `SQLite.prepare` (3586); `Store.sql` (3586) | CORE |
| [packages/store/src/store.ts:6029](../../packages/store/src/store.ts#L6029) `Store/scopedTableSql` | `Store.viewableIds` (6029); `SQLite.all` (6032); `SQLite.prepare` (6032); `Store.sql` (6032) | GATED-STORE |
| [packages/store/src/store.ts:2827](../../packages/store/src/store.ts#L2827) `Store/scriptHistory` | `SQLite.all` (2827); `SQLite.prepare` (2827); `Store.sql` (2827) | CORE |
| [packages/store/src/store.ts:2657](../../packages/store/src/store.ts#L2657) `Store/securityChange` | `Store.sql` (2657, 2659); `SQLite.prepare` (2659) | CORE |
| [packages/store/src/store.ts:2245](../../packages/store/src/store.ts#L2245) `Store/securityEvents` | `Store.auditLog` (2245) | CORE |
| [packages/store/src/store.ts:4801](../../packages/store/src/store.ts#L4801) `Store/securityToken` | `SQLite.get` (4801); `SQLite.prepare` (4801); `Store.sql` (4801) | CORE |
| [packages/store/src/store.ts:10483](../../packages/store/src/store.ts#L10483) `Store/selectCurrent` | `SQLite.iterate` (10483) | CORE |
| [packages/store/src/store.ts:10507](../../packages/store/src/store.ts#L10507) `Store/selectHeldCurrent` | `Store.sql` (10507, 10508); `SQLite.prepare` (10508); `SQLite.iterate` (10511) | CORE |
| [packages/store/src/store.ts:9981](../../packages/store/src/store.ts#L9981) `Store/selectIdsCurrent` | `Store.selectIds` (9981); `SQLite.all` (9987); `SQLite.prepare` (9987); `Store.sql` (9987) | GATED-STORE |
| [packages/store/src/store.ts:10499](../../packages/store/src/store.ts#L10499) `Store/selectIn` | `Store.select` (10499) | CORE |
| [packages/store/src/store.ts:1736](../../packages/store/src/store.ts#L1736) `Store/selfContainedCopy` | `Store.sql` (1736); `SQLite.all` (1741); `SQLite.prepare` (1741, 1743, 1744, 1745) | CORE |
| [packages/store/src/store.ts:4630](../../packages/store/src/store.ts#L4630) `Store/setAccountActive` | `SQLite.prepare` (4630, 4633, 4634); `Store.sql` (4630, 4633, 4634) | AUTH |
| [packages/store/src/store.ts:4820](../../packages/store/src/store.ts#L4820) `Store/setAccountLocalOnly` | `SQLite.prepare` (4820); `Store.sql` (4820) | CORE |
| [packages/store/src/store.ts:5681](../../packages/store/src/store.ts#L5681) `Store/setAccountPrivilegeSet` | `SQLite.get` (5681); `SQLite.prepare` (5681, 5684, 5688); `Store.sql` (5681, 5684, 5688) | AUTH |
| [packages/store/src/store.ts:4829](../../packages/store/src/store.ts#L4829) `Store/setAccountRequire2fa` | `SQLite.prepare` (4829); `Store.sql` (4829) | CORE |
| [packages/store/src/store.ts:3280](../../packages/store/src/store.ts#L3280) `Store/setAgentAccount` | `SQLite.get` (3280); `SQLite.prepare` (3280, 3286); `Store.sql` (3280, 3286) | CORE |
| [packages/store/src/store.ts:3630](../../packages/store/src/store.ts#L3630) `Store/setAiAllowed` | `SQLite.prepare` (3630); `Store.sql` (3630) | CORE |
| [packages/store/src/store.ts:3713](../../packages/store/src/store.ts#L3713) `Store/setAiPolicy` | `SQLite.prepare` (3713); `Store.sql` (3713) | CORE |
| [packages/store/src/store.ts:6287](../../packages/store/src/store.ts#L6287) `Store/setAllowBlankPasswordFromLan` | `SQLite.prepare` (6287); `Store.sql` (6287) | CORE |
| [packages/store/src/store.ts:2460](../../packages/store/src/store.ts#L2460) `Store/setAuditSettings` | `SQLite.prepare` (2460); `Store.sql` (2460) | CORE |
| [packages/store/src/store.ts:8139](../../packages/store/src/store.ts#L8139) `Store/setContainer` | `Store.sql` (8139, 8156); `Store.row` (8145); `SQLite.prepare` (8156) | CORE |
| [packages/store/src/store.ts:3232](../../packages/store/src/store.ts#L3232) `Store/setExternalAccount` | `SQLite.get` (3232); `SQLite.prepare` (3232, 3237); `Store.sql` (3232, 3237) | CORE |
| [packages/store/src/store.ts:4336](../../packages/store/src/store.ts#L4336) `Store/setMustChangePassword` | `SQLite.prepare` (4336); `Store.sql` (4336) | CORE |
| [packages/store/src/store.ts:3432](../../packages/store/src/store.ts#L3432) `Store/setPassword` | `SQLite.get` (3432); `SQLite.prepare` (3432, 3434, 3443); `Store.sql` (3432, 3434, 3443) | AUTH |
| [packages/store/src/store.ts:3527](../../packages/store/src/store.ts#L3527) `Store/setPasswordPolicy` | `SQLite.prepare` (3527); `Store.sql` (3527) | CORE |
| [packages/store/src/store.ts:1347](../../packages/store/src/store.ts#L1347) `Store/setPersistentData` | `SQLite.prepare` (1347, 1351); `Store.sql` (1347, 1351) | CORE |
| [packages/store/src/store.ts:3733](../../packages/store/src/store.ts#L3733) `Store/setPiiIsolation` | `SQLite.prepare` (3733); `Store.sql` (3733) | CORE |
| [packages/store/src/store.ts:3563](../../packages/store/src/store.ts#L3563) `Store/setRequireTotpForFullAccess` | `SQLite.prepare` (3563); `Store.sql` (3563) | CORE |
| [packages/store/src/store.ts:3645](../../packages/store/src/store.ts#L3645) `Store/setScriptNetwork` | `SQLite.prepare` (3645); `Store.sql` (3645) | CORE |
| [packages/store/src/store.ts:3702](../../packages/store/src/store.ts#L3702) `Store/setSqlRequiresFmxdbc` | `SQLite.prepare` (3702); `Store.sql` (3702) | CORE |
| [packages/store/src/store.ts:9152](../../packages/store/src/store.ts#L9152) `Store/setStoredCalcValues` | `SQLite.prepare` (9152, 9153); `Store.sql` (9152, 9153); `SQLite.get` (9157) | CORE |
| [packages/store/src/store.ts:8221](../../packages/store/src/store.ts#L8221) `Store/setUserPref` | `Store.sql` (8221, 8222, 8223); `SQLite.prepare` (8222, 8223) | CORE |
| [packages/store/src/store.ts:3686](../../packages/store/src/store.ts#L3686) `Store/setWebViewerHosts` | `SQLite.prepare` (3686); `Store.sql` (3686) | CORE |
| [packages/store/src/store.ts:4772](../../packages/store/src/store.ts#L4772) `Store/settleSignIns` | `SQLite.all` (4772, 4778); `SQLite.prepare` (4772, 4778, 4784, 4788, 4790); `Store.sql` (4772, 4778, 4784, 4788, 4790) | AUTH |
| [packages/store/src/store.ts:1867](../../packages/store/src/store.ts#L1867) `Store/shareResults` | `Store.sql` (1867) | CORE |
| [packages/store/src/store.ts:1405](../../packages/store/src/store.ts#L1405) `Store/shipWal` | `Store.sql` (1405) | CORE |
| [packages/store/src/store.ts:4719](../../packages/store/src/store.ts#L4719) `Store/signInBase` | `SQLite.get` (4719); `SQLite.prepare` (4719); `Store.sql` (4719) | AUTH |
| [packages/store/src/store.ts:4721](../../packages/store/src/store.ts#L4721) `Store/signInBase/identity` | `SQLite.get` (4721); `SQLite.prepare` (4721); `Store.sql` (4721) | AUTH |
| [packages/store/src/store.ts:4709](../../packages/store/src/store.ts#L4709) `Store/signInMark` | `SQLite.prepare` (4709); `Store.sql` (4709) | AUTH |
| [packages/store/src/store.ts:10206](../../packages/store/src/store.ts#L10206) `Store/sortIdsCurrentProgress` | `SQLite.all` (10206); `SQLite.prepare` (10206, 10274); `Store.sql` (10206, 10274); `Store.valueListItems` (10214); `rowsById` (10226); `Calculations.globalValue` (10229); `Calculations.unstoredValue` (10230); `Calculations.related` (10236); `SQLite.iterate` (10274) | GATED-STORE |
| [packages/store/src/store.ts:8382](../../packages/store/src/store.ts#L8382) `Store/sortedPage` | `SQLite.iterate` (8382); `SQLite.prepare` (8382, 8397); `Store.sql` (8382, 8397); `SQLite.all` (8397) | CORE |
| [packages/store/src/store.ts:8530](../../packages/store/src/store.ts#L8530) `Store/summaries` | `Calculations.wholeTable` (8530); `Calculations.collect` (8550, 8555) | CORE |
| [packages/store/src/store.ts:8546](../../packages/store/src/store.ts#L8546) `Store/summaries/recs` | `SQLite.iterate` (8546); `SQLite.prepare` (8546); `Store.sql` (8546) | CORE |
| [packages/store/src/store.ts:5260](../../packages/store/src/store.ts#L5260) `Store/takeWebauthnChallenge` | `SQLite.get` (5260); `SQLite.prepare` (5260, 5262); `Store.sql` (5260, 5262) | CORE |
| [packages/store/src/store.ts:8274](../../packages/store/src/store.ts#L8274) `Store/timeFind` | `Store.query` (8274, 8278, 8279); `Store.recordCount` (8281) | CORE |
| [packages/store/src/store.ts:6742](../../packages/store/src/store.ts#L6742) `Store/toRecord` | `Calculations.value` (6742, 6752); `Calculations.globalValue` (6746); `Calculations.unstoredStyled` (6751) | CORE |
| [packages/store/src/store.ts:5146](../../packages/store/src/store.ts#L5146) `Store/totpAccounts` | `SQLite.all` (5146); `SQLite.prepare` (5146); `Store.sql` (5146) | CORE |
| [packages/store/src/store.ts:1416](../../packages/store/src/store.ts#L1416) `Store/trial` | `Store.sql` (1416) | CORE |
| [packages/store/src/store.ts:1421](../../packages/store/src/store.ts#L1421) `Store/trial/undo` | `Store.sql` (1421) | CORE |
| [packages/store/src/store.ts:10316](../../packages/store/src/store.ts#L10316) `Store/truncate/run` | `Store.sql` (10316, 10318, 10325, 10327, 10329, 10330); `SQLite.prepare` (10318, 10325); `SQLite.all` (10320) | CORE |
| [packages/store/src/store.ts:3179](../../packages/store/src/store.ts#L3179) `Store/unmigratedAccounts` | `SQLite.all` (3179); `SQLite.prepare` (3179); `Store.sql` (3179) | CORE |
| [packages/store/src/store.ts:4242](../../packages/store/src/store.ts#L4242) `Store/unusedAccess` | `SQLite.get` (4242); `SQLite.prepare` (4242, 4251); `Store.sql` (4242, 4251); `SQLite.all` (4251) | CORE |
| [packages/store/src/store.ts:4290](../../packages/store/src/store.ts#L4290) `Store/unusedObjects` | `SQLite.get` (4290); `SQLite.prepare` (4290, 4293); `Store.sql` (4290, 4293); `SQLite.all` (4293) | CORE |
| [packages/store/src/store.ts:5381](../../packages/store/src/store.ts#L5381) `Store/unusedRecoveryHashes` | `SQLite.all` (5381); `SQLite.prepare` (5381); `Store.sql` (5381) | CORE |
| [packages/store/src/store.ts:4072](../../packages/store/src/store.ts#L4072) `Store/unusualAccess` | `Store.auditLog` (4072, 4138) | CORE |
| [packages/store/src/store.ts:8974](../../packages/store/src/store.ts#L8974) `Store/update` | `Store.row` (8974); `Store.sql` (9004, 9005, 9044, 9047) | CORE |
| [packages/store/src/store.ts:9007](../../packages/store/src/store.ts#L9007) `Store/update/undo` | `Store.sql` (9007) | CORE |
| [packages/store/src/store.ts:9437](../../packages/store/src/store.ts#L9437) `Store/updatePortals` | `Store.row` (9437, 9473); `relatedRows` (9474) | CORE |
| [packages/store/src/store.ts:9447](../../packages/store/src/store.ts#L9447) `Store/updatePortals/portal/related` | `relatedIdList` (9447) | CORE |
| [packages/store/src/store.ts:9419](../../packages/store/src/store.ts#L9419) `Store/updateRelated` | `relatedRows` (9419) | CORE |
| [packages/store/src/store.ts:4328](../../packages/store/src/store.ts#L4328) `Store/usageCounting` | `SQLite.get` (4328); `SQLite.prepare` (4328); `Store.sql` (4328) | CORE |
| [packages/store/src/store.ts:8212](../../packages/store/src/store.ts#L8212) `Store/userPrefs` | `SQLite.all` (8212); `SQLite.prepare` (8212); `Store.sql` (8212) | CORE |
| [packages/store/src/store.ts:7122](../../packages/store/src/store.ts#L7122) `Store/valueListItemsCurrent` | `Store.valueListItems` (7122); `Store.get` (7136); `relatedRows` (7137); `Store.row` (7137); `SQLite.iterate` (7139); `SQLite.prepare` (7139); `Store.sql` (7139); `Calculations.related` (7149); `Calculations.value` (7153, 7154) | GATED-STORE |
| [packages/store/src/store.ts:9629](../../packages/store/src/store.ts#L9629) `Store/vaultHeld` | `SQLite.get` (9629); `SQLite.prepare` (9629); `Store.sql` (9629) | CORE |
| [packages/store/src/store.ts:5175](../../packages/store/src/store.ts#L5175) `Store/verifyTotp` | `SQLite.get` (5175); `SQLite.prepare` (5175, 5181); `Store.sql` (5175, 5181) | CORE |
| [packages/store/src/store.ts:1922](../../packages/store/src/store.ts#L1922) `Store/versionNumber` | `SQLite.get` (1922); `SQLite.prepare` (1922); `Store.sql` (1922) | CORE |
| [packages/store/src/store.ts:1878](../../packages/store/src/store.ts#L1878) `Store/versionTriggers` | `SQLite.get` (1878); `SQLite.prepare` (1878, 1883, 1884); `Store.sql` (1878, 1883, 1884, 1901, 1903, 1904, 1906); `SQLite.all` (1883, 1884) | CORE |
| [packages/store/src/store.ts:1846](../../packages/store/src/store.ts#L1846) `Store/warmSummariesCurrent` | `Calculations.wholeTable` (1846) | CORE |
| [packages/store/src/store.ts:3668](../../packages/store/src/store.ts#L3668) `Store/webViewerChecked` | `SQLite.get` (3668); `SQLite.prepare` (3668); `Store.sql` (3668) | CORE |
| [packages/store/src/store.ts:1617](../../packages/store/src/store.ts#L1617) `Store/withWriteTransaction` | `Store.sql` (1617, 1628, 1634, 1636, 1636) | CORE |
| [packages/store/src/store.ts:6677](../../packages/store/src/store.ts#L6677) `Store/wordIndex` | `Store.sql` (6677, 6685, 6690); `Store.recordCount` (6689); `SQLite.get` (6690); `SQLite.prepare` (6690) | CORE |
| [packages/store/src/store.ts:7813](../../packages/store/src/store.ts#L7813) `Store/writeExternalFile` | `Store.evaluateEach` (7813); `SQLite.prepare` (7836); `Store.sql` (7836) | CORE |
| [packages/store/src/store.ts:7837](../../packages/store/src/store.ts#L7837) `Store/writeExternalFile/taken` | `SQLite.get` (7837) | CORE |
| [packages/store/src/store.ts:5010](../../packages/store/src/store.ts#L5010) `Store/writeObjectUseRows` | `SQLite.prepare` (5010, 5011, 5016); `Store.sql` (5010, 5011, 5016) | CORE |
| [packages/store/src/store.ts:1977](../../packages/store/src/store.ts#L1977) `Store/writeToken` | `SQLite.get` (1977); `SQLite.prepare` (1977); `Store.sql` (1977) | CORE |
| [packages/store/src/store.ts:4982](../../packages/store/src/store.ts#L4982) `Store/writeUsage` | `Store.sql` (4982, 4983, 4985, 4989, 4991) | CORE |
| [packages/store/src/store.ts:4998](../../packages/store/src/store.ts#L4998) `Store/writeUsageRows` | `SQLite.prepare` (4998, 4999, 5005); `Store.sql` (4998, 4999, 5005) | CORE |
| [packages/store/src/store.ts:6398](../../packages/store/src/store.ts#L6398) `Store/design` | `SQLite.get` (6398) | CORE |
| [packages/store/src/store.ts:6420](../../packages/store/src/store.ts#L6420) `Store/themes` | `SQLite.get` (6420) | CORE |
| [packages/store/src/store.ts:5341](../../packages/store/src/store.ts#L5341) `Store/verifyPasskeyCredential` | `SQLite.get` (5341); `SQLite.prepare` (5341, 5353); `Store.sql` (5341, 5353) | CORE |
| [packages/store/src/store.ts:6258](../../packages/store/src/store.ts#L6258) `Store/passwordState` | `SQLite.get` (6258); `SQLite.prepare` (6258); `Store.sql` (6258) | CORE |
| [packages/store/src/store.ts:9572](../../packages/store/src/store.ts#L9572) `Store/deleteVisibility` | `Store.canViewRecord` (9572) | CORE |
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
