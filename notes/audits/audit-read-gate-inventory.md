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
| [packages/cli/src/main.ts:2426](../../packages/cli/src/main.ts#L2426) `main` | `Store.orphanContainerReport` (2426); `Store.auditLog` (2899); `SQLite.get` (3158); `SQLite.prepare` (3158) | OPERATOR |
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
| [packages/server/src/odata.ts:1529](../../packages/server/src/odata.ts#L1529) `ODataEndpoint/applied` | `Store.selectIds` (1529); `SQLite.prepare` (1545, 1582, 1595, 1599); `Store.getMany` (1556); `SQLite.all` (1595); `SQLite.get` (1599) | ODATA |
| [packages/server/src/odata.ts:1649](../../packages/server/src/odata.ts#L1649) `ODataEndpoint/crossjoined` | `Store.selectIds` (1649); `Store.getMany` (1678, 1713) | ODATA |
| [packages/server/src/odata.ts:1749](../../packages/server/src/odata.ts#L1749) `ODataEndpoint/entity` | `Store.getMany` (1749) | ODATA |
| [packages/server/src/odata.ts:1408](../../packages/server/src/odata.ts#L1408) `ODataEndpoint/lambdaFor` | `Store.selectIds` (1408); `Store.row` (1417); `relatedIdList` (1418) | ODATA |
| [packages/server/src/odata.ts:1471](../../packages/server/src/odata.ts#L1471) `ODataEndpoint/list` | `Store.selectIds` (1471); `Store.getMany` (1476); `Store.computeValues` (1477); `Store.countIds` (1482) | ODATA |
| [packages/server/src/odata.ts:1848](../../packages/server/src/odata.ts#L1848) `ODataEndpoint/property` | `Store.containerId` (1848); `Store.container` (1854) | ODATA |
| [packages/server/src/odata.ts:1790](../../packages/server/src/odata.ts#L1790) `ODataEndpoint/relatedIds` | `Store.row` (1790); `relatedIdList` (1793, 1808); `Store.selectIds` (1797) | ODATA |
| [packages/server/src/odata.ts:1824](../../packages/server/src/odata.ts#L1824) `ODataEndpoint/relatedRecords` | `Store.getMany` (1824) | ODATA |
| [packages/server/src/odata.ts:1061](../../packages/server/src/odata.ts#L1061) `ODataEndpoint/resource` | `Store.countIds` (1061); `Store.get` (1106, 1113, 1202, 1230, 1237) | ODATA |
| [packages/server/src/odata.ts:1819](../../packages/server/src/odata.ts#L1819) `ODataEndpoint/viewableIn` | `Store.viewableSet` (1819) | ODATA |
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
| [packages/store/src/store.ts:5267](../../packages/store/src/store.ts#L5267) `Store/accountIdentityId` | `SQLite.get` (5267, 5273); `SQLite.prepare` (5267, 5272, 5273); `Store.sql` (5267, 5272, 5273) | CORE |
| [packages/store/src/store.ts:5261](../../packages/store/src/store.ts#L5261) `Store/accountIdentityIdIfSet` | `SQLite.get` (5261); `SQLite.prepare` (5261); `Store.sql` (5261) | CORE |
| [packages/store/src/store.ts:5223](../../packages/store/src/store.ts#L5223) `Store/accountInactive` | `SQLite.get` (5223); `SQLite.prepare` (5223); `Store.sql` (5223) | CORE |
| [packages/store/src/store.ts:5420](../../packages/store/src/store.ts#L5420) `Store/accountLocalOnly` | `SQLite.get` (5420); `SQLite.prepare` (5420); `Store.sql` (5420) | CORE |
| [packages/store/src/store.ts:6289](../../packages/store/src/store.ts#L6289) `Store/accountPrivilegeSet` | `SQLite.get` (6289); `SQLite.prepare` (6289); `Store.sql` (6289) | CORE |
| [packages/store/src/store.ts:5425](../../packages/store/src/store.ts#L5425) `Store/accountRequires2fa` | `SQLite.get` (5425); `SQLite.prepare` (5425); `Store.sql` (5425) | CORE |
| [packages/store/src/store.ts:5645](../../packages/store/src/store.ts#L5645) `Store/accountUsage` | `SQLite.get` (5645); `SQLite.prepare` (5645, 5646); `Store.sql` (5645, 5646); `SQLite.all` (5646); `Store.auditLog` (5662) | CORE |
| [packages/store/src/store.ts:3680](../../packages/store/src/store.ts#L3680) `Store/accounts` | `SQLite.all` (3680); `SQLite.prepare` (3680); `Store.sql` (3680) | CORE |
| [packages/store/src/store.ts:3676](../../packages/store/src/store.ts#L3676) `Store/accountsSharingLockout` | `SQLite.all` (3676); `SQLite.prepare` (3676); `Store.sql` (3676) | CORE |
| [packages/store/src/store.ts:8401](../../packages/store/src/store.ts#L8401) `Store/addContainer` | `SQLite.all` (8401); `SQLite.prepare` (8401, 8406, 8420, 8424, 8425); `Store.sql` (8401, 8406, 8420, 8422, 8424, 8425, 8427, 8430); `SQLite.get` (8411); `Store.containerRange` (8413) | CORE |
| [packages/store/src/store.ts:8447](../../packages/store/src/store.ts#L8447) `Store/addExternalContainer` | `SQLite.prepare` (8447); `Store.sql` (8447) | CORE |
| [packages/store/src/store.ts:8924](../../packages/store/src/store.ts#L8924) `Store/addFieldIndex` | `Store.sql` (8924) | CORE |
| [packages/store/src/store.ts:7100](../../packages/store/src/store.ts#L7100) `Store/addImage` | `Store.sql` (7100, 7101); `SQLite.prepare` (7101) | CORE |
| [packages/store/src/store.ts:6339](../../packages/store/src/store.ts#L6339) `Store/addProvisionedAccount` | `SQLite.get` (6339); `SQLite.prepare` (6339, 6343); `Store.sql` (6339, 6343) | CORE |
| [packages/store/src/store.ts:7519](../../packages/store/src/store.ts#L7519) `Store/addRelated` | `relatedRows` (7519); `rowsById` (7552); `firstRelatedEach` (7575) | CORE |
| [packages/store/src/store.ts:3698](../../packages/store/src/store.ts#L3698) `Store/agentNeedsApproval` | `SQLite.get` (3698); `SQLite.prepare` (3698); `Store.sql` (3698) | CORE |
| [packages/store/src/store.ts:6553](../../packages/store/src/store.ts#L6553) `Store/allowedIds` | `SQLite.iterate` (6553); `SQLite.prepare` (6553); `Store.sql` (6553) | CORE |
| [packages/store/src/store.ts:5702](../../packages/store/src/store.ts#L5702) `Store/apiToken` | `SQLite.get` (5702); `SQLite.prepare` (5702, 5720); `Store.sql` (5702, 5720) | CORE |
| [packages/store/src/store.ts:5678](../../packages/store/src/store.ts#L5678) `Store/apiTokens` | `SQLite.all` (5678); `SQLite.prepare` (5678); `Store.sql` (5678) | CORE |
| [packages/store/src/store.ts:3139](../../packages/store/src/store.ts#L3139) `Store/appendSecurityRow` | `Store.sql` (3139) | CORE |
| [packages/store/src/store.ts:4038](../../packages/store/src/store.ts#L4038) `Store/appendSecurityEvent` | `Store.sql` (4038) | CORE |
| [packages/store/src/store.ts:5043](../../packages/store/src/store.ts#L5043) `Store/applyAccountImport` | `Store.sql` (5043, 5051, 5080); `SQLite.get` (5051); `SQLite.prepare` (5051, 5080) | CORE |
| [packages/store/src/store.ts:2440](../../packages/store/src/store.ts#L2440) `Store/applyDesign` | `Store.sql` (2440, 2441, 2461, 2464, 2469, 2485, 2488, 2488); `SQLite.prepare` (2464, 2469) | CORE |
| [packages/store/src/store.ts:3894](../../packages/store/src/store.ts#L3894) `Store/approvePending` | `SQLite.get` (3894); `SQLite.prepare` (3894, 3905); `Store.sql` (3894, 3905) | CORE |
| [packages/store/src/store.ts:2930](../../packages/store/src/store.ts#L2930) `Store/audit/write` | `Store.sql` (2930) | CORE |
| [packages/store/src/store.ts:2552](../../packages/store/src/store.ts#L2552) `Store/auditLog` | `SQLite.all` (2552); `SQLite.prepare` (2552); `Store.sql` (2552) | CORE |
| [packages/store/src/store.ts:1975](../../packages/store/src/store.ts#L1975) `Store/backup` | `Store.sql` (1975) | CORE |
| [packages/store/src/store.ts:3704](../../packages/store/src/store.ts#L3704) `Store/blankPasswordAccounts` | `SQLite.all` (3704); `SQLite.prepare` (3704); `Store.sql` (3704) | CORE |
| [packages/store/src/store.ts:9510](../../packages/store/src/store.ts#L9510) `Store/canView` | `Store.canView` (9510); `Store.row` (9511) | GATED-STORE |
| [packages/store/src/store.ts:9492](../../packages/store/src/store.ts#L9492) `Store/canViewRecord` | `SQLite.get` (9492); `SQLite.prepare` (9492); `Store.sql` (9492) | GATED-STORE |
| [packages/store/src/store.ts:4972](../../packages/store/src/store.ts#L4972) `Store/canonicalAccount` | `SQLite.all` (4972); `SQLite.prepare` (4972); `Store.sql` (4972) | CORE |
| [packages/store/src/store.ts:10599](../../packages/store/src/store.ts#L10599) `Store/cascadeDelete` | `relatedRows` (10599) | CORE |
| [packages/store/src/store.ts:2275](../../packages/store/src/store.ts#L2275) `Store/changeOne` | `Store.sql` (2275, 2277) | CORE |
| [packages/store/src/store.ts:2278](../../packages/store/src/store.ts#L2278) `Store/changeOne/read` | `SQLite.get` (2278); `SQLite.prepare` (2278); `Store.sql` (2278) | CORE |
| [packages/store/src/store.ts:8782](../../packages/store/src/store.ts#L8782) `Store/checkContainerWrite` | `Store.row` (8782) | CORE |
| [packages/store/src/store.ts:10222](../../packages/store/src/store.ts#L10222) `Store/checkEditable` | `Store.row` (10222) | CORE |
| [packages/store/src/store.ts:1521](../../packages/store/src/store.ts#L1521) `Store/checkpoint` | `SQLite.get` (1521); `SQLite.prepare` (1521); `Store.sql` (1521) | CORE |
| [packages/store/src/store.ts:6325](../../packages/store/src/store.ts#L6325) `Store/clearAccountPrivilegeSet` | `SQLite.prepare` (6325); `Store.sql` (6325) | CORE |
| [packages/store/src/store.ts:1543](../../packages/store/src/store.ts#L1543) `Store/close` | `Store.sql` (1543) | CORE |
| [packages/store/src/store.ts:8750](../../packages/store/src/store.ts#L8750) `Store/compactFile` | `Store.sql` (8750, 8751, 8753) | CORE |
| [packages/store/src/store.ts:10723](../../packages/store/src/store.ts#L10723) `Store/computeValuesCurrent` | `Store.computeValues` (10723); `Store.sql` (10729, 10733); `SQLite.all` (10733); `SQLite.prepare` (10733) | GATED-STORE |
| [packages/store/src/store.ts:9161](../../packages/store/src/store.ts#L9161) `Store/computedRows` | `Store.sql` (9161, 9164, 9165, 9166, 9168, 9178, 9179, 9180, 9183); `SQLite.prepare` (9164, 9166, 9168, 9178); `SQLite.iterate` (9168); `Calculations.globalValue` (9171); `Calculations.unstoredValue` (9172); `Calculations.related` (9175); `SQLite.all` (9178) | CORE |
| [packages/store/src/store.ts:5747](../../packages/store/src/store.ts#L5747) `Store/confirmTotp` | `SQLite.get` (5747); `SQLite.prepare` (5747, 5749); `Store.sql` (5747, 5749) | CORE |
| [packages/store/src/store.ts:1166](../../packages/store/src/store.ts#L1166) `Store/constructor` | `Store.sql` (1166, 1168, 1170, 1171, 1175, 1179, 1180, 1189, 1197, 1212, 1217, 1222, 1223, 1227, 1228, 1229, 1236, 1240, 1244, 1245, 1246, 1251, 1252, 1256, 1259, 1260, 1262, 1263, 1266, 1267, 1271, 1272, 1276, 1277, 1280, 1282, 1285, 1286, 1290, 1291, 1295, 1296, 1300, 1301, 1302, 1305, 1306, 1309, 1310, 1312, 1312, 1313, 1313, 1314, 1317, 1321, 1323, 1326, 1327, 1328, 1331, 1332, 1334, 1336, 1337, 1341, 1342, 1344, 1356, 1358, 1359, 1360, 1360, 1364, 1365); `SQLite.get` (1170, 1189); `SQLite.prepare` (1170, 1189, 1197, 1259, 1260, 1263, 1266, 1271, 1276, 1285, 1290, 1295, 1305, 1309, 1312, 1313, 1331, 1336, 1341); `SQLite.all` (1259, 1266, 1271, 1276, 1285, 1290, 1295, 1305, 1309, 1312, 1313, 1331, 1336, 1341) | CORE |
| [packages/store/src/store.ts:6105](../../packages/store/src/store.ts#L6105) `Store/consumeRecoveryCode` | `SQLite.prepare` (6105); `Store.sql` (6105) | CORE |
| [packages/store/src/store.ts:8325](../../packages/store/src/store.ts#L8325) `Store/container` | `SQLite.get` (8325); `SQLite.prepare` (8325, 8334); `Store.sql` (8325, 8334); `SQLite.all` (8334) | CORE |
| [packages/store/src/store.ts:8759](../../packages/store/src/store.ts#L8759) `Store/containerId` | `Store.containerId` (8759); `Store.row` (8760) | CORE |
| [packages/store/src/store.ts:8342](../../packages/store/src/store.ts#L8342) `Store/containerInfo` | `SQLite.get` (8342); `SQLite.prepare` (8342); `Store.sql` (8342) | CORE |
| [packages/store/src/store.ts:8306](../../packages/store/src/store.ts#L8306) `Store/containerIntact` | `SQLite.get` (8306); `SQLite.prepare` (8306); `Store.sql` (8306) | CORE |
| [packages/store/src/store.ts:8245](../../packages/store/src/store.ts#L8245) `Store/containerIntegrityReport` | `SQLite.all` (8245); `SQLite.prepare` (8245, 8256); `Store.sql` (8245, 8256); `SQLite.get` (8256) | CORE |
| [packages/store/src/store.ts:8320](../../packages/store/src/store.ts#L8320) `Store/containerMeta` | `SQLite.get` (8320); `SQLite.prepare` (8320); `Store.sql` (8320) | CORE |
| [packages/store/src/store.ts:8376](../../packages/store/src/store.ts#L8376) `Store/containerRange` | `SQLite.all` (8376); `SQLite.prepare` (8376, 8383); `Store.sql` (8376, 8383); `SQLite.get` (8383) | CORE |
| [packages/store/src/store.ts:8147](../../packages/store/src/store.ts#L8147) `Store/containerReferences` | `SQLite.all` (8147, 8166, 8168, 8174, 8187, 8198, 8212); `SQLite.prepare` (8147, 8166, 8168, 8174, 8187, 8198, 8210, 8212); `Store.sql` (8147, 8166, 8168, 8174, 8187, 8198, 8210, 8212); `SQLite.get` (8210); `Store.row` (8221) | CORE |
| [packages/store/src/store.ts:10703](../../packages/store/src/store.ts#L10703) `Store/countIds` | `Store.countIds` (10703); `SQLite.get` (10707); `SQLite.prepare` (10707); `Store.sql` (10707) | GATED-STORE |
| [packages/store/src/store.ts:9541](../../packages/store/src/store.ts#L9541) `Store/create` | `SQLite.get` (9541); `SQLite.prepare` (9541, 9554); `Store.sql` (9541, 9554) | CORE |
| [packages/store/src/store.ts:4010](../../packages/store/src/store.ts#L4010) `Store/createAccount` | `SQLite.get` (4010); `SQLite.prepare` (4010, 4014, 4020, 4025, 4030); `Store.sql` (4010, 4014, 4020, 4025, 4030) | CORE |
| [packages/store/src/store.ts:5478](../../packages/store/src/store.ts#L5478) `Store/createApiToken` | `SQLite.get` (5478, 5506); `SQLite.prepare` (5478, 5505, 5506, 5516); `Store.sql` (5478, 5505, 5506, 5516) | CORE |
| [packages/store/src/store.ts:4984](../../packages/store/src/store.ts#L4984) `Store/createLocalAccount` | `SQLite.prepare` (4984); `Store.sql` (4984) | CORE |
| [packages/store/src/store.ts:3670](../../packages/store/src/store.ts#L3670) `Store/credentialIdentity` | `SQLite.get` (3670); `SQLite.prepare` (3670); `Store.sql` (3670) | CORE |
| [packages/store/src/store.ts:5399](../../packages/store/src/store.ts#L5399) `Store/credentialStamp` | `SQLite.get` (5399); `SQLite.prepare` (5399); `Store.sql` (5399) | CORE |
| [packages/store/src/store.ts:2065](../../packages/store/src/store.ts#L2065) `Store/dataVersion` | `SQLite.get` (2065); `SQLite.prepare` (2065); `Store.sql` (2065) | CORE |
| [packages/store/src/store.ts:11261](../../packages/store/src/store.ts#L11261) `Store/decimalViewSql` | `SQLite.all` (11261); `SQLite.prepare` (11261) | CORE |
| [packages/store/src/store.ts:10265](../../packages/store/src/store.ts#L10265) `Store/delete` | `Store.row` (10265) | CORE |
| [packages/store/src/store.ts:10273](../../packages/store/src/store.ts#L10273) `Store/delete/run` | `SQLite.get` (10273); `SQLite.prepare` (10273, 10278); `Store.sql` (10273, 10278) | CORE |
| [packages/store/src/store.ts:5138](../../packages/store/src/store.ts#L5138) `Store/deleteAccount` | `SQLite.prepare` (5138, 5142, 5143, 5144, 5145, 5146, 5147, 5148, 5149, 5156, 5158, 5160, 5162, 5166); `Store.sql` (5138, 5142, 5143, 5144, 5145, 5146, 5147, 5148, 5149, 5156, 5158, 5160, 5162, 5166) | CORE |
| [packages/store/src/store.ts:10346](../../packages/store/src/store.ts#L10346) `Store/deleteBeingUndone` | `SQLite.all` (10346); `SQLite.prepare` (10346); `Store.sql` (10346) | CORE |
| [packages/store/src/store.ts:10358](../../packages/store/src/store.ts#L10358) `Store/deleteEndingTheLifeAt` | `SQLite.get` (10358); `SQLite.prepare` (10358); `Store.sql` (10358) | CORE |
| [packages/store/src/store.ts:6190](../../packages/store/src/store.ts#L6190) `Store/deletePrivilegeSet` | `SQLite.prepare` (6190); `Store.sql` (6190) | CORE |
| [packages/store/src/store.ts:4148](../../packages/store/src/store.ts#L4148) `Store/deleteScriptTest` | `SQLite.prepare` (4148); `Store.sql` (4148) | CORE |
| [packages/store/src/store.ts:3307](../../packages/store/src/store.ts#L3307) `Store/deletedRows` | `SQLite.get` (3307); `SQLite.prepare` (3307, 3309, 3309); `Store.sql` (3307, 3309, 3309); `SQLite.all` (3309, 3309) | CORE |
| [packages/store/src/store.ts:3417](../../packages/store/src/store.ts#L3417) `Store/designEffect` | `Store.sql` (3417, 3423, 3424, 3427, 3433, 3438, 3441, 3447, 3458, 3459, 3461, 3462, 3475, 3476, 3479, 3481, 3487, 3488, 3489, 3495, 3497, 3501, 3504, 3505, 3507, 3510, 3516, 3518, 3525, 3526, 3528, 3529, 3530, 3531, 3538, 3539, 3541, 3541, 3543, 3544, 3545, 3549, 3553, 3555, 3593, 3595, 3597); `SQLite.prepare` (3427, 3458, 3459, 3475, 3476, 3487, 3488, 3495, 3497, 3501, 3505, 3516, 3518, 3531, 3538, 3539, 3541, 3543, 3545, 3549, 3553); `SQLite.get` (3458, 3475, 3487, 3488, 3501, 3505, 3541, 3549); `SQLite.all` (3538, 3539); `SQLite.iterate` (3543) | CORE |
| [packages/store/src/store.ts:3410](../../packages/store/src/store.ts#L3410) `Store/designEffect/renameExcluded` | `SQLite.prepare` (3410); `Store.sql` (3410) | CORE |
| [packages/store/src/store.ts:3394](../../packages/store/src/store.ts#L3394) `Store/designEffect/renameKey` | `SQLite.prepare` (3394); `Store.sql` (3394) | CORE |
| [packages/store/src/store.ts:3348](../../packages/store/src/store.ts#L3348) `Store/designHistory` | `SQLite.all` (3348); `SQLite.prepare` (3348); `Store.sql` (3348) | CORE |
| [packages/store/src/store.ts:5768](../../packages/store/src/store.ts#L5768) `Store/disableTotp` | `SQLite.prepare` (5768); `Store.sql` (5768) | CORE |
| [packages/store/src/store.ts:3605](../../packages/store/src/store.ts#L3605) `Store/dropColumnIndexes` | `SQLite.all` (3605, 3607); `SQLite.prepare` (3605, 3607); `Store.sql` (3605, 3607, 3608) | CORE |
| [packages/store/src/store.ts:8936](../../packages/store/src/store.ts#L8936) `Store/dropFieldIndex` | `SQLite.get` (8936); `SQLite.prepare` (8936); `Store.sql` (8936, 8937) | CORE |
| [packages/store/src/store.ts:9578](../../packages/store/src/store.ts#L9578) `Store/duplicate` | `Store.row` (9578); `SQLite.prepare` (9596); `Store.sql` (9596) | CORE |
| [packages/store/src/store.ts:8563](../../packages/store/src/store.ts#L8563) `Store/embeddedContainerCount` | `SQLite.prepare` (8563); `Store.sql` (8563); `SQLite.get` (8564) | CORE |
| [packages/store/src/store.ts:8549](../../packages/store/src/store.ts#L8549) `Store/embeddedContainers` | `SQLite.prepare` (8549, 8550); `Store.sql` (8549, 8550); `SQLite.all` (8550); `SQLite.get` (8554) | CORE |
| [packages/store/src/store.ts:3333](../../packages/store/src/store.ts#L3333) `Store/emptyDeleted` | `Store.sql` (3333, 3336, 3337, 3339, 3341); `SQLite.prepare` (3337) | CORE |
| [packages/store/src/store.ts:1941](../../packages/store/src/store.ts#L1941) `Store/endTransaction` | `Store.sql` (1941, 1944, 1944) | CORE |
| [packages/store/src/store.ts:5736](../../packages/store/src/store.ts#L5736) `Store/enrollTotp` | `SQLite.prepare` (5736); `Store.sql` (5736) | CORE |
| [packages/store/src/store.ts:3302](../../packages/store/src/store.ts#L3302) `Store/ensureDeleted` | `Store.sql` (3302) | CORE |
| [packages/store/src/store.ts:1375](../../packages/store/src/store.ts#L1375) `Store/ensureNativeIds` | `SQLite.all` (1375, 1387); `SQLite.prepare` (1375, 1378, 1386, 1387); `Store.sql` (1375, 1378, 1381, 1385, 1386, 1387, 1390, 1392) | CORE |
| [packages/store/src/store.ts:2187](../../packages/store/src/store.ts#L2187) `Store/ensureRecordIdHighWater` | `Store.sql` (2187, 2188, 2190, 2192, 2194) | CORE |
| [packages/store/src/store.ts:2206](../../packages/store/src/store.ts#L2206) `Store/ensureRecordIdMarks` | `SQLite.all` (2206, 2209, 2212, 2221); `SQLite.prepare` (2206, 2209, 2212, 2215, 2221, 2224); `Store.sql` (2206, 2209, 2212, 2215, 2221, 2224, 2228, 2229) | CORE |
| [packages/store/src/store.ts:9919](../../packages/store/src/store.ts#L9919) `Store/evaluateCurrent` | `Store.row` (9919, 9919, 9920, 9920); `Calculations.context` (9925); `Store.get` (9926, 9928) | GATED-STORE |
| [packages/store/src/store.ts:9960](../../packages/store/src/store.ts#L9960) `Store/evaluateEachCurrent` | `Store.row` (9960, 9960, 9965); `Calculations.context` (9966); `Store.get` (9968) | GATED-STORE |
| [packages/store/src/store.ts:10022](../../packages/store/src/store.ts#L10022) `Store/evaluateRowsCurrent` | `Store.row` (10022, 10022, 10023, 10023) | GATED-STORE |
| [packages/store/src/store.ts:10001](../../packages/store/src/store.ts#L10001) `Store/evaluateRowsCurrent/each` | `Calculations.context` (10001); `Store.get` (10003) | GATED-STORE |
| [packages/store/src/store.ts:10037](../../packages/store/src/store.ts#L10037) `Store/evaluateRowsCurrent/found/[Symbol.iterator]` | `rowsById` (10037) | GATED-STORE |
| [packages/store/src/store.ts:10059](../../packages/store/src/store.ts#L10059) `Store/evaluateRowsCurrent/key` | `Calculations.context` (10059) | GATED-STORE |
| [packages/store/src/store.ts:3937](../../packages/store/src/store.ts#L3937) `Store/externalAccount` | `SQLite.all` (3937); `SQLite.prepare` (3937); `Store.sql` (3937) | CORE |
| [packages/store/src/store.ts:8068](../../packages/store/src/store.ts#L8068) `Store/externalContainerCheck` | `SQLite.all` (8068); `SQLite.prepare` (8068); `Store.sql` (8068) | CORE |
| [packages/store/src/store.ts:8075](../../packages/store/src/store.ts#L8075) `Store/externalContainerCount` | `SQLite.get` (8075); `SQLite.prepare` (8075); `Store.sql` (8075) | CORE |
| [packages/store/src/store.ts:8084](../../packages/store/src/store.ts#L8084) `Store/externalContainerReport` | `SQLite.all` (8084, 8097); `SQLite.prepare` (8084, 8097); `Store.sql` (8084, 8097) | CORE |
| [packages/store/src/store.ts:5249](../../packages/store/src/store.ts#L5249) `Store/externalIdentityId` | `SQLite.get` (5249, 5256); `SQLite.prepare` (5249, 5255, 5256); `Store.sql` (5249, 5255, 5256) | CORE |
| [packages/store/src/store.ts:8316](../../packages/store/src/store.ts#L8316) `Store/externalOf` | `SQLite.get` (8316); `SQLite.prepare` (8316); `Store.sql` (8316) | CORE |
| [packages/store/src/store.ts:3083](../../packages/store/src/store.ts#L3083) `Store/failureAuditRoom` | `SQLite.get` (3083); `SQLite.prepare` (3083); `Store.sql` (3083) | CORE |
| [packages/store/src/store.ts:7721](../../packages/store/src/store.ts#L7721) `Store/fieldIndexCurrent` | `SQLite.iterate` (7721); `SQLite.prepare` (7721, 7726); `Store.sql` (7721, 7726); `SQLite.all` (7726) | GATED-STORE |
| [packages/store/src/store.ts:8976](../../packages/store/src/store.ts#L8976) `Store/find` | `Store.find` (8976) | GATED-STORE |
| [packages/store/src/store.ts:9348](../../packages/store/src/store.ts#L9348) `Store/findCandidates` | `Store.query` (9348) | CORE |
| [packages/store/src/store.ts:8987](../../packages/store/src/store.ts#L8987) `Store/findHere` | `Store.query` (8987, 8992, 8994, 9008, 9010, 9021); `Store.recordCount` (9005); `SQLite.get` (9006, 9010); `SQLite.prepare` (9006, 9010, 9016, 9023, 9032); `Store.sql` (9006, 9010, 9016, 9023, 9032); `SQLite.all` (9016, 9023, 9032) | GATED-STORE |
| [packages/store/src/store.ts:9027](../../packages/store/src/store.ts#L9027) `Store/findHere/[Symbol.iterator]` | `SQLite.iterate` (9027); `SQLite.prepare` (9027); `Store.sql` (9027) | GATED-STORE |
| [packages/store/src/store.ts:10834](../../packages/store/src/store.ts#L10834) `Store/findIdsCurrent` | `Store.findIds` (10834) | GATED-STORE |
| [packages/store/src/store.ts:10770](../../packages/store/src/store.ts#L10770) `Store/findIdsCurrentProgress` | `Store.findIdsProgress` (10770); `Store.query` (10772, 10773, 10786, 10788); `Store.recordCount` (10778, 10806); `SQLite.iterate` (10803); `SQLite.prepare` (10803, 10811, 10812); `Store.sql` (10803, 10811, 10812); `SQLite.get` (10815); `SQLite.all` (10821) | GATED-STORE |
| [packages/store/src/store.ts:10840](../../packages/store/src/store.ts#L10840) `Store/findIdsHere` | `Store.query` (10840, 10845, 10847); `SQLite.iterate` (10858); `SQLite.prepare` (10858); `Store.sql` (10858) | GATED-STORE |
| [packages/store/src/store.ts:9292](../../packages/store/src/store.ts#L9292) `Store/findSource` | `Store.query` (9292); `SQLite.all` (9301, 9318); `SQLite.prepare` (9301, 9309, 9317); `Store.sql` (9301, 9306, 9309, 9314, 9317, 9331, 9333); `Calculations.globalValue` (9323); `Calculations.unstoredValue` (9324); `Calculations.related` (9328) | CORE |
| [packages/store/src/store.ts:3195](../../packages/store/src/store.ts#L3195) `Store/flushDeferredSecurity` | `Store.sql` (3195) | CORE |
| [packages/store/src/store.ts:10313](../../packages/store/src/store.ts#L10313) `Store/forgetStandInValues` | `Store.sql` (10313, 10334); `SQLite.prepare` (10334) | CORE |
| [packages/store/src/store.ts:5105](../../packages/store/src/store.ts#L5105) `Store/forgetStandIns` | `SQLite.prepare` (5105); `Store.sql` (5105) | CORE |
| [packages/store/src/store.ts:7603](../../packages/store/src/store.ts#L7603) `Store/foundSetPage` | `rowsById` (7603) | CORE |
| [packages/store/src/store.ts:7619](../../packages/store/src/store.ts#L7619) `Store/foundSetRowsCurrent` | `Store.viewableIds` (7619); `Store.row` (7635) | GATED-STORE |
| [packages/store/src/store.ts:3856](../../packages/store/src/store.ts#L3856) `Store/gateAgentWrite` | `SQLite.get` (3856); `SQLite.prepare` (3856, 3858); `Store.sql` (3856, 3858) | CORE |
| [packages/store/src/store.ts:6043](../../packages/store/src/store.ts#L6043) `Store/generateRecoveryCodes` | `SQLite.prepare` (6043, 6046); `Store.sql` (6043, 6046) | CORE |
| [packages/store/src/store.ts:9420](../../packages/store/src/store.ts#L9420) `Store/getCurrent` | `Store.get` (9420); `Store.row` (9421, 9421, 9435); `SQLite.all` (9438); `SQLite.prepare` (9438); `Store.sql` (9438) | GATED-STORE |
| [packages/store/src/store.ts:9458](../../packages/store/src/store.ts#L9458) `Store/getManyCurrent` | `Store.getMany` (9458); `SQLite.get` (9476); `SQLite.prepare` (9476); `Store.sql` (9476) | GATED-STORE |
| [packages/store/src/store.ts:9469](../../packages/store/src/store.ts#L9469) `Store/getManyCurrent/[Symbol.iterator]` | `rowsById` (9469) | GATED-STORE |
| [packages/store/src/store.ts:1422](../../packages/store/src/store.ts#L1422) `Store/grantFullAccessClients` | `SQLite.prepare` (1422); `Store.sql` (1422) | CORE |
| [packages/store/src/store.ts:10875](../../packages/store/src/store.ts#L10875) `Store/groupSummariesCurrent` | `Store.groupSummaries` (10875); `Store.viewableIds` (10880); `Calculations.collect` (10896); `rowsById` (10896, 10946); `Calculations.collector` (10918) | GATED-STORE |
| [packages/store/src/store.ts:10944](../../packages/store/src/store.ts#L10944) `Store/groupSummariesCurrent/flush` | `Calculations.collector` (10944) | GATED-STORE |
| [packages/store/src/store.ts:10908](../../packages/store/src/store.ts#L10908) `Store/groupSummariesCurrent/key` | `Calculations.value` (10908); `Calculations.related` (10910) | GATED-STORE |
| [packages/store/src/store.ts:1449](../../packages/store/src/store.ts#L1449) `Store/hasOwnPassword` | `SQLite.get` (1449); `SQLite.prepare` (1449); `Store.sql` (1449) | CORE |
| [packages/store/src/store.ts:5898](../../packages/store/src/store.ts#L5898) `Store/hasPasskey` | `SQLite.get` (5898); `SQLite.prepare` (5898); `Store.sql` (5898) | CORE |
| [packages/store/src/store.ts:1430](../../packages/store/src/store.ts#L1430) `Store/hasProvingPassword` | `SQLite.get` (1430); `SQLite.prepare` (1430); `Store.sql` (1430) | CORE |
| [packages/store/src/store.ts:8890](../../packages/store/src/store.ts#L8890) `Store/hasTable` | `SQLite.get` (8890); `SQLite.prepare` (8890); `Store.sql` (8890) | CORE |
| [packages/store/src/store.ts:5757](../../packages/store/src/store.ts#L5757) `Store/hasTotp` | `SQLite.get` (5757); `SQLite.prepare` (5757); `Store.sql` (5757) | CORE |
| [packages/store/src/store.ts:5228](../../packages/store/src/store.ts#L5228) `Store/identityAllowed` | `SQLite.get` (5228, 5234, 5240); `SQLite.prepare` (5228, 5234, 5240); `Store.sql` (5228, 5234, 5240) | CORE |
| [packages/store/src/store.ts:7077](../../packages/store/src/store.ts#L7077) `Store/image` | `SQLite.get` (7077); `SQLite.prepare` (7077); `Store.sql` (7077) | CORE |
| [packages/store/src/store.ts:7087](../../packages/store/src/store.ts#L7087) `Store/images` | `SQLite.all` (7087); `SQLite.prepare` (7087); `Store.sql` (7087) | CORE |
| [packages/store/src/store.ts:4949](../../packages/store/src/store.ts#L4949) `Store/importAccounts` | `SQLite.all` (4949); `SQLite.prepare` (4949); `Store.sql` (4949) | CORE |
| [packages/store/src/store.ts:1763](../../packages/store/src/store.ts#L1763) `Store/independentWindowWrite` | `SQLite.get` (1763); `SQLite.prepare` (1763, 1771, 1831); `Store.sql` (1763, 1771, 1781, 1809, 1826, 1831, 1834); `SQLite.all` (1771); `Store.row` (1829) | CORE |
| [packages/store/src/store.ts:2242](../../packages/store/src/store.ts#L2242) `Store/nextRecordId` | `SQLite.get` (2242); `SQLite.prepare` (2242); `Store.sql` (2242) | CORE |
| [packages/store/src/store.ts:1608](../../packages/store/src/store.ts#L1608) `Store/securityChainHeadAudit` | `SQLite.get` (1608); `SQLite.prepare` (1608); `Store.sql` (1608) | CORE |
| [packages/store/src/store.ts:8902](../../packages/store/src/store.ts#L8902) `Store/indexedFields` | `SQLite.all` (8902, 8903); `SQLite.prepare` (8902, 8903); `Store.sql` (8902, 8903) | CORE |
| [packages/store/src/store.ts:11294](../../packages/store/src/store.ts#L11294) `Store/internalRoots` | `SQLite.get` (11294); `SQLite.prepare` (11294, 11296); `SQLite.all` (11296) | CORE |
| [packages/store/src/store.ts:3692](../../packages/store/src/store.ts#L3692) `Store/isAgent` | `SQLite.get` (3692); `SQLite.prepare` (3692); `Store.sql` (3692) | CORE |
| [packages/store/src/store.ts:3795](../../packages/store/src/store.ts#L3795) `Store/isExternal` | `SQLite.get` (3795); `SQLite.prepare` (3795); `Store.sql` (3795) | CORE |
| [packages/store/src/store.ts:5812](../../packages/store/src/store.ts#L5812) `Store/issueWebauthnChallenge` | `SQLite.prepare` (5812, 5814, 5815, 5817); `Store.sql` (5812, 5814, 5815, 5817); `SQLite.get` (5814) | CORE |
| [packages/store/src/store.ts:11156](../../packages/store/src/store.ts#L11156) `Store/iterateCommitted` | `SQLite.iterate` (11156) | CORE |
| [packages/store/src/store.ts:1703](../../packages/store/src/store.ts#L1703) `Store/joinTransaction` | `Store.sql` (1703, 1704, 1706, 1708, 1714, 1717) | CORE |
| [packages/store/src/store.ts:10546](../../packages/store/src/store.ts#L10546) `Store/keyStepWork` | `Store.sql` (10546, 10552, 10556, 10558) | CORE |
| [packages/store/src/store.ts:6944](../../packages/store/src/store.ts#L6944) `Store/knownSharedAccount` | `SQLite.get` (6944); `SQLite.prepare` (6944); `Store.sql` (6944) | CORE |
| [packages/store/src/store.ts:4422](../../packages/store/src/store.ts#L4422) `Store/lastSignIns` | `Store.auditLog` (4422) | CORE |
| [packages/store/src/store.ts:10364](../../packages/store/src/store.ts#L10364) `Store/latestDeleteSeq` | `SQLite.get` (10364); `SQLite.prepare` (10364); `Store.sql` (10364) | CORE |
| [packages/store/src/store.ts:7117](../../packages/store/src/store.ts#L7117) `Store/layout` | `SQLite.get` (7117); `SQLite.prepare` (7117); `Store.sql` (7117) | CORE |
| [packages/store/src/store.ts:3365](../../packages/store/src/store.ts#L3365) `Store/layoutHistory` | `SQLite.all` (3365); `SQLite.prepare` (3365); `Store.sql` (3365) | CORE |
| [packages/store/src/store.ts:7007](../../packages/store/src/store.ts#L7007) `Store/layouts` | `SQLite.all` (7007); `SQLite.prepare` (7007); `Store.sql` (7007) | CORE |
| [packages/store/src/store.ts:4722](../../packages/store/src/store.ts#L4722) `Store/leastPrivilege` | `SQLite.all` (4722); `SQLite.prepare` (4722); `Store.sql` (4722) | CORE |
| [packages/store/src/store.ts:5326](../../packages/store/src/store.ts#L5326) `Store/ledgerRow` | `SQLite.get` (5326, 5327); `SQLite.prepare` (5326, 5327); `Store.sql` (5326, 5327) | AUTH |
| [packages/store/src/store.ts:5338](../../packages/store/src/store.ts#L5338) `Store/ledgerWrite` | `Store.sql` (5338, 5339, 5341, 5343, 5346, 5346) | AUTH |
| [packages/store/src/store.ts:5032](../../packages/store/src/store.ts#L5032) `Store/limitAccountImport` | `SQLite.prepare` (5032, 5033, 5036); `Store.sql` (5032, 5033, 5036); `SQLite.get` (5033) | CORE |
| [packages/store/src/store.ts:3645](../../packages/store/src/store.ts#L3645) `Store/linkIdentity` | `SQLite.get` (3645); `SQLite.prepare` (3645); `Store.sql` (3645) | CORE |
| [packages/store/src/store.ts:3637](../../packages/store/src/store.ts#L3637) `Store/linkPrincipal` | `SQLite.get` (3637); `SQLite.prepare` (3637); `Store.sql` (3637) | CORE |
| [packages/store/src/store.ts:4308](../../packages/store/src/store.ts#L4308) `Store/markPiiField` | `SQLite.prepare` (4308); `Store.sql` (4308) | CORE |
| [packages/store/src/store.ts:8041](../../packages/store/src/store.ts#L8041) `Store/markRepeating` | `SQLite.prepare` (8041); `Store.sql` (8041) | CORE |
| [packages/store/src/store.ts:11089](../../packages/store/src/store.ts#L11089) `Store/matchIds` | `Store.matchIds` (11089); `SQLite.all` (11095); `SQLite.prepare` (11095); `Store.sql` (11095) | CORE |
| [packages/store/src/store.ts:1464](../../packages/store/src/store.ts#L1464) `Store/meta` | `SQLite.get` (1464); `SQLite.prepare` (1464); `Store.sql` (1464) | CORE |
| [packages/store/src/store.ts:1021](../../packages/store/src/store.ts#L1021) `Store/metadataVersions` | `SQLite.get` (1021); `SQLite.prepare` (1021); `Store.sql` (1021) | CORE |
| [packages/store/src/store.ts:8678](../../packages/store/src/store.ts#L8678) `Store/moveContainersIn` | `Store.sql` (8678, 8684, 8686, 8687, 8688, 8689, 8709, 8714, 8714, 8725, 8728, 8731, 8738); `SQLite.prepare` (8686, 8687, 8688, 8689, 8725, 8731); `SQLite.get` (8691, 8725, 8731) | CORE |
| [packages/store/src/store.ts:8600](../../packages/store/src/store.ts#L8600) `Store/moveContainersOut` | `Store.sql` (8600, 8608, 8610, 8612, 8617, 8618, 8638, 8644, 8646, 8648, 8648, 8654, 8654, 8659, 8661, 8663, 8663, 8669); `SQLite.get` (8608); `SQLite.prepare` (8608, 8617, 8618); `Store.container` (8620) | CORE |
| [packages/store/src/store.ts:4903](../../packages/store/src/store.ts#L4903) `Store/mustChangePassword` | `SQLite.get` (4903); `SQLite.prepare` (4903); `Store.sql` (4903) | CORE |
| [packages/store/src/store.ts:1400](../../packages/store/src/store.ts#L1400) `Store/nativeIdGuards` | `Store.sql` (1400, 1401, 1403) | CORE |
| [packages/store/src/store.ts:5632](../../packages/store/src/store.ts#L5632) `Store/objectUseSince` | `SQLite.get` (5632); `SQLite.prepare` (5632); `Store.sql` (5632) | CORE |
| [packages/store/src/store.ts:8862](../../packages/store/src/store.ts#L8862) `Store/orderBy` | `Store.valueListItems` (8862) | CORE |
| [packages/store/src/store.ts:8233](../../packages/store/src/store.ts#L8233) `Store/orphanContainerReport` | `SQLite.all` (8233); `SQLite.prepare` (8233); `Store.sql` (8233) | CORE |
| [packages/store/src/store.ts:5864](../../packages/store/src/store.ts#L5864) `Store/passkeyAllowList` | `SQLite.all` (5864); `SQLite.prepare` (5864); `Store.sql` (5864) | CORE |
| [packages/store/src/store.ts:5903](../../packages/store/src/store.ts#L5903) `Store/passkeyIds` | `SQLite.all` (5903); `SQLite.prepare` (5903); `Store.sql` (5903) | CORE |
| [packages/store/src/store.ts:5891](../../packages/store/src/store.ts#L5891) `Store/passkeys` | `SQLite.all` (5891); `SQLite.prepare` (5891); `Store.sql` (5891) | CORE |
| [packages/store/src/store.ts:4942](../../packages/store/src/store.ts#L4942) `Store/passwordDaysRemaining` | `SQLite.get` (4942); `SQLite.prepare` (4942); `Store.sql` (4942) | CORE |
| [packages/store/src/store.ts:3880](../../packages/store/src/store.ts#L3880) `Store/pendingChanges` | `SQLite.all` (3880); `SQLite.prepare` (3880); `Store.sql` (3880) | CORE |
| [packages/store/src/store.ts:1482](../../packages/store/src/store.ts#L1482) `Store/persistentData` | `SQLite.get` (1482) | CORE |
| [packages/store/src/store.ts:1491](../../packages/store/src/store.ts#L1491) `Store/persistentDataIds` | `SQLite.all` (1491) | CORE |
| [packages/store/src/store.ts:1472](../../packages/store/src/store.ts#L1472) `Store/persistentTable` | `Store.sql` (1472) | CORE |
| [packages/store/src/store.ts:10207](../../packages/store/src/store.ts#L10207) `Store/portalContainerTarget` | `Store.row` (10207); `relatedIdList` (10209) | CORE |
| [packages/store/src/store.ts:7658](../../packages/store/src/store.ts#L7658) `Store/portalCountsCurrent` | `Store.canView` (7658); `Store.row` (7685) | GATED-STORE |
| [packages/store/src/store.ts:7896](../../packages/store/src/store.ts#L7896) `Store/portalRows` | `relatedRows` (7896); `relatedIdList` (7897); `Store.viewableSet` (7900); `rowsById` (7925, 7963); `Calculations.related` (7939) | CORE |
| [packages/store/src/store.ts:7907](../../packages/store/src/store.ts#L7907) `Store/portalRows/context` | `Calculations.context` (7907) | CORE |
| [packages/store/src/store.ts:7917](../../packages/store/src/store.ts#L7917) `Store/portalRows/valueOf` | `Calculations.value` (7917) | CORE |
| [packages/store/src/store.ts:2618](../../packages/store/src/store.ts#L2618) `Store/prepared` | `SQLite.prepare` (2618); `Store.sql` (2618) | CORE |
| [packages/store/src/store.ts:5014](../../packages/store/src/store.ts#L5014) `Store/previewAccountImport` | `Store.sql` (5014, 5015, 5024) | CORE |
| [packages/store/src/store.ts:6707](../../packages/store/src/store.ts#L6707) `Store/previewRecordRuleCurrent` | `SQLite.get` (6707); `SQLite.prepare` (6707, 6710); `Store.sql` (6707, 6710); `SQLite.all` (6710); `Calculations.context` (6716, 6732) | CORE |
| [packages/store/src/store.ts:9383](../../packages/store/src/store.ts#L9383) `Store/previewRow` | `Store.row` (9383) | CORE |
| [packages/store/src/store.ts:6118](../../packages/store/src/store.ts#L6118) `Store/privilegeSets` | `Store.sql` (6118) | CORE |
| [packages/store/src/store.ts:2850](../../packages/store/src/store.ts#L2850) `Store/pruneAudit` | `Store.sql` (2850, 2852, 2854); `SQLite.get` (2852); `SQLite.prepare` (2852) | CORE |
| [packages/store/src/store.ts:8268](../../packages/store/src/store.ts#L8268) `Store/purgeOrphanContainers` | `Store.sql` (8268, 8272, 8281, 8284, 8285, 8290, 8291, 8293, 8293); `Store.orphanContainerReport` (8276); `SQLite.get` (8281); `SQLite.prepare` (8281, 8284, 8285) | CORE |
| [packages/store/src/store.ts:11414](../../packages/store/src/store.ts#L11414) `Store/query` | `SQLite.iterate` (11414) | CORE |
| [packages/store/src/store.ts:11454](../../packages/store/src/store.ts#L11454) `Store/queryWithOriginsCurrent` | `SQLite.iterate` (11454); `SQLite.all` (11463, 11466); `SQLite.prepare` (11463, 11466) | CORE |
| [packages/store/src/store.ts:11206](../../packages/store/src/store.ts#L11206) `Store/readOnlyChecked` | `SQLite.prepare` (11206, 11210, 11219, 11224); `SQLite.all` (11210, 11219, 11224) | CORE |
| [packages/store/src/store.ts:3617](../../packages/store/src/store.ts#L3617) `Store/recompute` | `SQLite.prepare` (3617, 3621); `Store.sql` (3617, 3621); `SQLite.iterate` (3621); `Calculations.computeStoredStyled` (3622); `Calculations.value` (3622) | CORE |
| [packages/store/src/store.ts:2633](../../packages/store/src/store.ts#L2633) `Store/recordAsOf` | `SQLite.get` (2633, 2635); `SQLite.prepare` (2633, 2635, 2637, 2638); `Store.sql` (2633, 2635, 2637, 2638); `SQLite.all` (2637, 2638) | CORE |
| [packages/store/src/store.ts:2329](../../packages/store/src/store.ts#L2329) `Store/recordCount` | `SQLite.get` (2329); `SQLite.prepare` (2329); `Store.sql` (2329) | CORE |
| [packages/store/src/store.ts:2710](../../packages/store/src/store.ts#L2710) `Store/recordLife` | `SQLite.all` (2710); `SQLite.prepare` (2710); `Store.sql` (2710) | CORE |
| [packages/store/src/store.ts:5563](../../packages/store/src/store.ts#L5563) `Store/recordObjectUse` | `Store.sql` (5563) | CORE |
| [packages/store/src/store.ts:9909](../../packages/store/src/store.ts#L9909) `Store/recordViewable` | `Store.row` (9909) | GATED-STORE |
| [packages/store/src/store.ts:1529](../../packages/store/src/store.ts#L1529) `Store/recordedFormat` | `Store.sql` (1529) | CORE |
| [packages/store/src/store.ts:8572](../../packages/store/src/store.ts#L8572) `Store/recoverContainersOut` | `SQLite.prepare` (8572); `Store.sql` (8572); `SQLite.get` (8575) | CORE |
| [packages/store/src/store.ts:1632](../../packages/store/src/store.ts#L1632) `Store/recoverPendingExternalFiles` | `Store.sql` (1632, 1634, 1658, 1660); `SQLite.prepare` (1634); `SQLite.get` (1645) | CORE |
| [packages/store/src/store.ts:6061](../../packages/store/src/store.ts#L6061) `Store/recoveryCodesRemaining` | `SQLite.get` (6061); `SQLite.prepare` (6061); `Store.sql` (6061) | CORE |
| [packages/store/src/store.ts:11246](../../packages/store/src/store.ts#L11246) `Store/refreshDecimalSqlViews` | `SQLite.get` (11246); `SQLite.prepare` (11246) | CORE |
| [packages/store/src/store.ts:3786](../../packages/store/src/store.ts#L3786) `Store/refuseLookalikeAccount` | `SQLite.all` (3786); `SQLite.prepare` (3786); `Store.sql` (3786) | CORE |
| [packages/store/src/store.ts:5927](../../packages/store/src/store.ts#L5927) `Store/registerPasskey` | `SQLite.prepare` (5927); `Store.sql` (5927) | CORE |
| [packages/store/src/store.ts:3915](../../packages/store/src/store.ts#L3915) `Store/rejectPending` | `SQLite.get` (3915); `SQLite.prepare` (3915, 3917); `Store.sql` (3915, 3917) | CORE |
| [packages/store/src/store.ts:9135](../../packages/store/src/store.ts#L9135) `Store/relatedCriteria` | `SQLite.iterate` (9135); `SQLite.prepare` (9135); `Store.sql` (9135) | CORE |
| [packages/store/src/store.ts:9132](../../packages/store/src/store.ts#L9132) `Store/relatedCriteria/matched` | `relatedRows` (9132) | CORE |
| [packages/store/src/store.ts:7445](../../packages/store/src/store.ts#L7445) `Store/relatedValues` | `Calculations.globalValue` (7445); `Calculations.unstoredValue` (7447) | CORE |
| [packages/store/src/store.ts:5940](../../packages/store/src/store.ts#L5940) `Store/removePasskey` | `SQLite.get` (5940); `SQLite.prepare` (5940, 5941); `Store.sql` (5940, 5941) | CORE |
| [packages/store/src/store.ts:10384](../../packages/store/src/store.ts#L10384) `Store/restoreDeletedRowLocked` | `SQLite.get` (10384, 10389); `SQLite.prepare` (10384, 10385, 10389, 10399); `Store.sql` (10384, 10385, 10389, 10399); `SQLite.all` (10385) | CORE |
| [packages/store/src/store.ts:2668](../../packages/store/src/store.ts#L2668) `Store/restoreRecord` | `Store.recordAsOf` (2668); `SQLite.get` (2672); `SQLite.prepare` (2672, 2677, 2686, 2697); `Store.sql` (2672, 2677, 2686, 2697) | CORE |
| [packages/store/src/store.ts:2726](../../packages/store/src/store.ts#L2726) `Store/revertAuditEntry` | `SQLite.get` (2726); `SQLite.prepare` (2726); `Store.sql` (2726); `Store.canViewRecord` (2728); `Store.auditLog` (2731) | CORE |
| [packages/store/src/store.ts:5688](../../packages/store/src/store.ts#L5688) `Store/revokeApiToken` | `SQLite.prepare` (5688); `Store.sql` (5688) | CORE |
| [packages/store/src/store.ts:5211](../../packages/store/src/store.ts#L5211) `Store/revokeSignInCredentials` | `SQLite.prepare` (5211, 5212, 5213); `Store.sql` (5211, 5212, 5213) | AUTH |
| [packages/store/src/store.ts:9401](../../packages/store/src/store.ts#L9401) `Store/row` | `SQLite.get` (9401) | CORE |
| [packages/store/src/store.ts:11350](../../packages/store/src/store.ts#L11350) `Store/rowsOf` | `SQLite.iterate` (11350, 11359) | CORE |
| [packages/store/src/store.ts:6512](../../packages/store/src/store.ts#L6512) `Store/ruleOutcome` | `Calculations.context` (6512) | CORE |
| [packages/store/src/store.ts:9246](../../packages/store/src/store.ts#L9246) `Store/runningSummaryValues` | `Store.viewableIds` (9246); `rowsById` (9248); `Calculations.value` (9259, 9265); `Calculations.related` (9276) | GATED-STORE |
| [packages/store/src/store.ts:6147](../../packages/store/src/store.ts#L6147) `Store/savePrivilegeSet` | `SQLite.prepare` (6147, 6155); `Store.sql` (6147, 6155) | AUTH |
| [packages/store/src/store.ts:4139](../../packages/store/src/store.ts#L4139) `Store/saveScriptTest` | `SQLite.prepare` (4139); `Store.sql` (4139) | CORE |
| [packages/store/src/store.ts:6672](../../packages/store/src/store.ts#L6672) `Store/scopedTableSql` | `Store.viewableIds` (6672); `SQLite.all` (6675); `SQLite.prepare` (6675); `Store.sql` (6675) | GATED-STORE |
| [packages/store/src/store.ts:3355](../../packages/store/src/store.ts#L3355) `Store/scriptHistory` | `SQLite.all` (3355); `SQLite.prepare` (3355); `Store.sql` (3355) | CORE |
| [packages/store/src/store.ts:3028](../../packages/store/src/store.ts#L3028) `Store/securityChange` | `Store.sql` (3028, 3030); `SQLite.prepare` (3030) | CORE |
| [packages/store/src/store.ts:2592](../../packages/store/src/store.ts#L2592) `Store/securityEvents` | `Store.auditLog` (2592) | CORE |
| [packages/store/src/store.ts:5412](../../packages/store/src/store.ts#L5412) `Store/securityToken` | `SQLite.get` (5412); `SQLite.prepare` (5412); `Store.sql` (5412) | CORE |
| [packages/store/src/store.ts:11380](../../packages/store/src/store.ts#L11380) `Store/selectHeldCurrent` | `Store.sql` (11380, 11381, 11383); `SQLite.prepare` (11381) | CORE |
| [packages/store/src/store.ts:10689](../../packages/store/src/store.ts#L10689) `Store/selectIdsCurrent` | `Store.selectIds` (10689); `SQLite.all` (10695); `SQLite.prepare` (10695); `Store.sql` (10695) | GATED-STORE |
| [packages/store/src/store.ts:11370](../../packages/store/src/store.ts#L11370) `Store/selectIn` | `Store.select` (11370) | CORE |
| [packages/store/src/store.ts:1995](../../packages/store/src/store.ts#L1995) `Store/selfContainedCopy` | `Store.sql` (1995); `SQLite.all` (2000); `SQLite.prepare` (2000, 2002, 2003, 2004) | CORE |
| [packages/store/src/store.ts:5190](../../packages/store/src/store.ts#L5190) `Store/setAccountActive` | `SQLite.prepare` (5190, 5198, 5199); `Store.sql` (5190, 5198, 5199) | AUTH |
| [packages/store/src/store.ts:5431](../../packages/store/src/store.ts#L5431) `Store/setAccountLocalOnly` | `SQLite.prepare` (5431); `Store.sql` (5431) | CORE |
| [packages/store/src/store.ts:6303](../../packages/store/src/store.ts#L6303) `Store/setAccountPrivilegeSet` | `SQLite.get` (6303); `SQLite.prepare` (6303, 6306, 6310); `Store.sql` (6303, 6306, 6310) | AUTH |
| [packages/store/src/store.ts:5440](../../packages/store/src/store.ts#L5440) `Store/setAccountRequire2fa` | `SQLite.prepare` (5440); `Store.sql` (5440) | CORE |
| [packages/store/src/store.ts:3816](../../packages/store/src/store.ts#L3816) `Store/setAgentAccount` | `SQLite.get` (3816); `SQLite.prepare` (3816, 3822); `Store.sql` (3816, 3822) | CORE |
| [packages/store/src/store.ts:4183](../../packages/store/src/store.ts#L4183) `Store/setAiAllowed` | `SQLite.prepare` (4183); `Store.sql` (4183) | CORE |
| [packages/store/src/store.ts:4266](../../packages/store/src/store.ts#L4266) `Store/setAiPolicy` | `SQLite.prepare` (4266); `Store.sql` (4266) | CORE |
| [packages/store/src/store.ts:6931](../../packages/store/src/store.ts#L6931) `Store/setAllowBlankPasswordFromLan` | `SQLite.prepare` (6931); `Store.sql` (6931) | CORE |
| [packages/store/src/store.ts:2828](../../packages/store/src/store.ts#L2828) `Store/setAuditSettings` | `SQLite.prepare` (2828); `Store.sql` (2828) | CORE |
| [packages/store/src/store.ts:8791](../../packages/store/src/store.ts#L8791) `Store/setContainer` | `Store.sql` (8791); `Store.row` (8797) | CORE |
| [packages/store/src/store.ts:3768](../../packages/store/src/store.ts#L3768) `Store/setExternalAccount` | `SQLite.get` (3768); `SQLite.prepare` (3768, 3773); `Store.sql` (3768, 3773) | CORE |
| [packages/store/src/store.ts:4889](../../packages/store/src/store.ts#L4889) `Store/setMustChangePassword` | `SQLite.prepare` (4889); `Store.sql` (4889) | CORE |
| [packages/store/src/store.ts:3968](../../packages/store/src/store.ts#L3968) `Store/setPassword` | `SQLite.get` (3968); `SQLite.prepare` (3968, 3974, 3983, 3990, 3991, 3992); `Store.sql` (3968, 3974, 3983, 3990, 3991, 3992) | AUTH |
| [packages/store/src/store.ts:4080](../../packages/store/src/store.ts#L4080) `Store/setPasswordPolicy` | `SQLite.prepare` (4080); `Store.sql` (4080) | CORE |
| [packages/store/src/store.ts:1497](../../packages/store/src/store.ts#L1497) `Store/setPersistentData` | `SQLite.prepare` (1497, 1501); `Store.sql` (1497, 1501) | CORE |
| [packages/store/src/store.ts:4286](../../packages/store/src/store.ts#L4286) `Store/setPiiIsolation` | `SQLite.prepare` (4286); `Store.sql` (4286) | CORE |
| [packages/store/src/store.ts:4116](../../packages/store/src/store.ts#L4116) `Store/setRequireTotpForFullAccess` | `SQLite.prepare` (4116); `Store.sql` (4116) | CORE |
| [packages/store/src/store.ts:4198](../../packages/store/src/store.ts#L4198) `Store/setScriptNetwork` | `SQLite.prepare` (4198); `Store.sql` (4198) | CORE |
| [packages/store/src/store.ts:4255](../../packages/store/src/store.ts#L4255) `Store/setSqlRequiresFmxdbc` | `SQLite.prepare` (4255); `Store.sql` (4255) | CORE |
| [packages/store/src/store.ts:9830](../../packages/store/src/store.ts#L9830) `Store/setStoredCalcValues` | `SQLite.prepare` (9830, 9831); `Store.sql` (9830, 9831); `SQLite.get` (9835) | CORE |
| [packages/store/src/store.ts:8894](../../packages/store/src/store.ts#L8894) `Store/setUserPref` | `Store.sql` (8894, 8895, 8896); `SQLite.prepare` (8895, 8896) | CORE |
| [packages/store/src/store.ts:4239](../../packages/store/src/store.ts#L4239) `Store/setWebViewerHosts` | `SQLite.prepare` (4239); `Store.sql` (4239) | CORE |
| [packages/store/src/store.ts:5365](../../packages/store/src/store.ts#L5365) `Store/settleSignIns` | `SQLite.all` (5365, 5371); `SQLite.prepare` (5365, 5371, 5377, 5381, 5383); `Store.sql` (5365, 5371, 5377, 5381, 5383) | AUTH |
| [packages/store/src/store.ts:2126](../../packages/store/src/store.ts#L2126) `Store/shareResults` | `Store.sql` (2126) | CORE |
| [packages/store/src/store.ts:1559](../../packages/store/src/store.ts#L1559) `Store/shipWal` | `Store.sql` (1559) | CORE |
| [packages/store/src/store.ts:5312](../../packages/store/src/store.ts#L5312) `Store/signInBase` | `SQLite.get` (5312); `SQLite.prepare` (5312); `Store.sql` (5312) | AUTH |
| [packages/store/src/store.ts:5314](../../packages/store/src/store.ts#L5314) `Store/signInBase/identity` | `SQLite.get` (5314); `SQLite.prepare` (5314); `Store.sql` (5314) | AUTH |
| [packages/store/src/store.ts:5301](../../packages/store/src/store.ts#L5301) `Store/signInMark` | `SQLite.prepare` (5301); `Store.sql` (5301) | AUTH |
| [packages/store/src/store.ts:10987](../../packages/store/src/store.ts#L10987) `Store/sortIdsCurrentProgress` | `Store.sortIds` (10987); `Store.sortIdsProgress` (10987); `SQLite.all` (11000); `SQLite.prepare` (11000, 11075); `Store.sql` (11000, 11075); `Store.valueListItems` (11008); `rowsById` (11020); `Calculations.globalValue` (11023); `Calculations.unstoredValue` (11024); `Calculations.related` (11030); `SQLite.iterate` (11075) | GATED-STORE |
| [packages/store/src/store.ts:9060](../../packages/store/src/store.ts#L9060) `Store/sortedPage` | `SQLite.iterate` (9060); `SQLite.prepare` (9060, 9075); `Store.sql` (9060, 9075); `SQLite.all` (9075) | CORE |
| [packages/store/src/store.ts:11161](../../packages/store/src/store.ts#L11161) `Store/storedFileId` | `SQLite.get` (11161); `SQLite.prepare` (11161) | CORE |
| [packages/store/src/store.ts:9208](../../packages/store/src/store.ts#L9208) `Store/summaries` | `Calculations.wholeTable` (9208); `Calculations.collect` (9228, 9233) | CORE |
| [packages/store/src/store.ts:9224](../../packages/store/src/store.ts#L9224) `Store/summaries/recs` | `SQLite.iterate` (9224); `SQLite.prepare` (9224); `Store.sql` (9224) | CORE |
| [packages/store/src/store.ts:5878](../../packages/store/src/store.ts#L5878) `Store/takeWebauthnChallenge` | `SQLite.get` (5878); `SQLite.prepare` (5878, 5882); `Store.sql` (5878, 5882) | CORE |
| [packages/store/src/store.ts:8947](../../packages/store/src/store.ts#L8947) `Store/timeFind` | `Store.query` (8947) | CORE |
| [packages/store/src/store.ts:8961](../../packages/store/src/store.ts#L8961) `Store/reportFind` | `Store.query` (8961, 8963, 8964); `Store.recordCount` (8966) | CORE |
| [packages/store/src/store.ts:7386](../../packages/store/src/store.ts#L7386) `Store/toRecord` | `Calculations.value` (7386, 7396); `Calculations.globalValue` (7390); `Calculations.unstoredStyled` (7395) | CORE |
| [packages/store/src/store.ts:5762](../../packages/store/src/store.ts#L5762) `Store/totpAccounts` | `SQLite.all` (5762); `SQLite.prepare` (5762); `Store.sql` (5762) | CORE |
| [packages/store/src/store.ts:1571](../../packages/store/src/store.ts#L1571) `Store/trial` | `Store.sql` (1571) | CORE |
| [packages/store/src/store.ts:1576](../../packages/store/src/store.ts#L1576) `Store/trial/undo` | `Store.sql` (1576) | CORE |
| [packages/store/src/store.ts:11117](../../packages/store/src/store.ts#L11117) `Store/truncate/run` | `Store.sql` (11117, 11119, 11126, 11128, 11130, 11131); `SQLite.prepare` (11119, 11126); `SQLite.all` (11121) | CORE |
| [packages/store/src/store.ts:3715](../../packages/store/src/store.ts#L3715) `Store/unmigratedAccounts` | `SQLite.all` (3715); `SQLite.prepare` (3715); `Store.sql` (3715) | CORE |
| [packages/store/src/store.ts:4795](../../packages/store/src/store.ts#L4795) `Store/unusedAccess` | `SQLite.get` (4795); `SQLite.prepare` (4795, 4804); `Store.sql` (4795, 4804); `SQLite.all` (4804) | CORE |
| [packages/store/src/store.ts:4843](../../packages/store/src/store.ts#L4843) `Store/unusedObjects` | `SQLite.get` (4843); `SQLite.prepare` (4843, 4846); `Store.sql` (4843, 4846); `SQLite.all` (4846) | CORE |
| [packages/store/src/store.ts:6002](../../packages/store/src/store.ts#L6002) `Store/unusedRecoveryHashes` | `SQLite.all` (6002); `SQLite.prepare` (6002); `Store.sql` (6002) | CORE |
| [packages/store/src/store.ts:4625](../../packages/store/src/store.ts#L4625) `Store/unusualAccess` | `Store.auditLog` (4625, 4691) | CORE |
| [packages/store/src/store.ts:9651](../../packages/store/src/store.ts#L9651) `Store/update` | `Store.row` (9651); `Store.sql` (9682, 9683, 9722, 9725) | CORE |
| [packages/store/src/store.ts:9685](../../packages/store/src/store.ts#L9685) `Store/update/undo` | `Store.sql` (9685) | CORE |
| [packages/store/src/store.ts:10115](../../packages/store/src/store.ts#L10115) `Store/updatePortals` | `Store.row` (10115, 10151); `relatedRows` (10152) | CORE |
| [packages/store/src/store.ts:10125](../../packages/store/src/store.ts#L10125) `Store/updatePortals/portal/related` | `relatedIdList` (10125) | CORE |
| [packages/store/src/store.ts:10097](../../packages/store/src/store.ts#L10097) `Store/updateRelated` | `relatedRows` (10097) | CORE |
| [packages/store/src/store.ts:4881](../../packages/store/src/store.ts#L4881) `Store/usageCounting` | `SQLite.get` (4881); `SQLite.prepare` (4881); `Store.sql` (4881) | CORE |
| [packages/store/src/store.ts:8885](../../packages/store/src/store.ts#L8885) `Store/userPrefs` | `SQLite.all` (8885); `SQLite.prepare` (8885); `Store.sql` (8885) | CORE |
| [packages/store/src/store.ts:7767](../../packages/store/src/store.ts#L7767) `Store/valueListItemsCurrent` | `Store.valueListItems` (7767); `Store.get` (7781); `relatedRows` (7782); `Store.row` (7782); `SQLite.iterate` (7784); `SQLite.prepare` (7784); `Store.sql` (7784); `Calculations.related` (7794); `Calculations.value` (7798, 7799) | GATED-STORE |
| [packages/store/src/store.ts:10306](../../packages/store/src/store.ts#L10306) `Store/vaultHeld` | `SQLite.get` (10306); `SQLite.prepare` (10306); `Store.sql` (10306) | CORE |
| [packages/store/src/store.ts:5791](../../packages/store/src/store.ts#L5791) `Store/verifyTotp` | `SQLite.get` (5791); `SQLite.prepare` (5791, 5798); `Store.sql` (5791, 5798) | CORE |
| [packages/store/src/store.ts:2262](../../packages/store/src/store.ts#L2262) `Store/versionNumber` | `SQLite.get` (2262); `SQLite.prepare` (2262); `Store.sql` (2262) | CORE |
| [packages/store/src/store.ts:2137](../../packages/store/src/store.ts#L2137) `Store/versionTriggers` | `SQLite.get` (2137); `SQLite.prepare` (2137, 2142, 2143); `Store.sql` (2137, 2142, 2143, 2160, 2162, 2163, 2165); `SQLite.all` (2142, 2143) | CORE |
| [packages/store/src/store.ts:2105](../../packages/store/src/store.ts#L2105) `Store/warmSummariesCurrent` | `Calculations.wholeTable` (2105) | CORE |
| [packages/store/src/store.ts:4221](../../packages/store/src/store.ts#L4221) `Store/webViewerChecked` | `SQLite.get` (4221); `SQLite.prepare` (4221); `Store.sql` (4221) | CORE |
| [packages/store/src/store.ts:1863](../../packages/store/src/store.ts#L1863) `Store/withWriteTransaction` | `Store.sql` (1863, 1875, 1881, 1883, 1883) | CORE |
| [packages/store/src/store.ts:7321](../../packages/store/src/store.ts#L7321) `Store/wordIndex` | `Store.sql` (7321, 7329, 7334); `Store.recordCount` (7333); `SQLite.get` (7334); `SQLite.prepare` (7334) | CORE |
| [packages/store/src/store.ts:8465](../../packages/store/src/store.ts#L8465) `Store/writeExternalFile` | `Store.evaluateEach` (8465); `SQLite.prepare` (8488); `Store.sql` (8488) | CORE |
| [packages/store/src/store.ts:8489](../../packages/store/src/store.ts#L8489) `Store/writeExternalFile/taken` | `SQLite.get` (8489) | CORE |
| [packages/store/src/store.ts:5621](../../packages/store/src/store.ts#L5621) `Store/writeObjectUseRows` | `SQLite.prepare` (5621, 5622, 5627); `Store.sql` (5621, 5622, 5627) | CORE |
| [packages/store/src/store.ts:2317](../../packages/store/src/store.ts#L2317) `Store/writeToken` | `SQLite.get` (2317); `SQLite.prepare` (2317); `Store.sql` (2317) | CORE |
| [packages/store/src/store.ts:5593](../../packages/store/src/store.ts#L5593) `Store/writeUsage` | `Store.sql` (5593, 5594, 5596, 5600, 5602) | CORE |
| [packages/store/src/store.ts:5609](../../packages/store/src/store.ts#L5609) `Store/writeUsageRows` | `SQLite.prepare` (5609, 5610, 5616); `Store.sql` (5609, 5610, 5616) | CORE |
| [packages/store/src/store.ts:7042](../../packages/store/src/store.ts#L7042) `Store/design` | `SQLite.get` (7042) | CORE |
| [packages/store/src/store.ts:7064](../../packages/store/src/store.ts#L7064) `Store/themes` | `SQLite.get` (7064) | CORE |
| [packages/store/src/store.ts:5962](../../packages/store/src/store.ts#L5962) `Store/verifyPasskeyCredential` | `SQLite.get` (5962); `SQLite.prepare` (5962, 5974); `Store.sql` (5962, 5974) | CORE |
| [packages/store/src/store.ts:6902](../../packages/store/src/store.ts#L6902) `Store/passwordState` | `SQLite.get` (6902); `SQLite.prepare` (6902); `Store.sql` (6902) | CORE |
| [packages/store/src/store.ts:10250](../../packages/store/src/store.ts#L10250) `Store/deleteVisibility` | `Store.canViewRecord` (10250) | CORE |
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
