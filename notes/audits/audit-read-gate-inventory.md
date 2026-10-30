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
| [packages/server/src/dataapi.ts:2090](../../packages/server/src/dataapi.ts#L2090) `DataApi/route` | `Store.get` (2090, 2311, 2312, 2335, 2343, 2390, 2414, 2434, 2471); `Store.valueListItems` (2105); `Store.find` (2266, 2314, 2505); `Store.findIds` (2270, 2510); `Store.query` (2510) | REST |
| [packages/server/src/dataapi.ts:2218](../../packages/server/src/dataapi.ts#L2218) `DataApi/route/recordOut` | `Store.portalCounts` (2218) | REST |
| [packages/server/src/dataapi.ts:2254](../../packages/server/src/dataapi.ts#L2254) `DataApi/route/shownAs` | `Store.get` (2254) | REST |
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
| [packages/server/src/webclient.ts:1706](../../packages/server/src/webclient.ts#L1706) `WebClient/aiReplace` | `Store.canView` (1706); `Store.getMany` (1722) | WEB |
| [packages/server/src/webclient.ts:1890](../../packages/server/src/webclient.ts#L1890) `WebClient/button` | `Store.findIds` (1890, 1940); `Store.evaluateEach` (1899, 1900) | WEB |
| [packages/server/src/webclient.ts:1292](../../packages/server/src/webclient.ts#L1292) `WebClient/charts` | `Calculations.context` (1292); `Store.canView` (1320); `Store.evaluateEach` (1329, 1333); `Store.evaluateRows` (1338, 1340) | WEB |
| [packages/server/src/webclient.ts:1283](../../packages/server/src/webclient.ts#L1283) `WebClient/charts/foundSet` | `Store.findIds` (1283) | WEB |
| [packages/server/src/webclient.ts:1323](../../packages/server/src/webclient.ts#L1323) `WebClient/charts/get` | `Store.get` (1323) | WEB |
| [packages/server/src/webclient.ts:693](../../packages/server/src/webclient.ts#L693) `WebClient/explain` | `Store.get` (693); `Store.row` (726, 739) | WEB |
| [packages/server/src/webclient.ts:1512](../../packages/server/src/webclient.ts#L1512) `WebClient/exportRecords` | `Store.getMany` (1512) | WEB |
| [packages/server/src/webclient.ts:1199](../../packages/server/src/webclient.ts#L1199) `WebClient/foundIds` | `Store.findIds` (1199) | WEB |
| [packages/server/src/webclient.ts:1243](../../packages/server/src/webclient.ts#L1243) `WebClient/foundSetPortal` | `Store.foundSetRows` (1243, 1250) | WEB |
| [packages/server/src/webclient.ts:1782](../../packages/server/src/webclient.ts#L1782) `WebClient/groups` | `Store.findIds` (1782); `Store.groupSummaries` (1788) | WEB |
| [packages/server/src/webclient.ts:555](../../packages/server/src/webclient.ts#L555) `WebClient/history` | `Store.get` (555) | WEB |
| [packages/server/src/webclient.ts:752](../../packages/server/src/webclient.ts#L752) `WebClient/index` | `Store.fieldIndex` (752) | WEB |
| [packages/server/src/webclient.ts:857](../../packages/server/src/webclient.ts#L857) `WebClient/menus` | `Store.evaluateEach` (857) | WEB |
| [packages/server/src/webclient.ts:1214](../../packages/server/src/webclient.ts#L1214) `WebClient/records` | `Store.getMany` (1214); `Store.find` (1217) | WEB |
| [packages/server/src/webclient.ts:1160](../../packages/server/src/webclient.ts#L1160) `WebClient/refresh` | `Store.previewRow` (1160); `Store.getMany` (1165); `Store.foundSetRows` (1187) | WEB |
| [packages/server/src/webclient.ts:1406](../../packages/server/src/webclient.ts#L1406) `WebClient/streamExportRecords/nextBatch` | `Store.selectIds` (1406); `Store.getMany` (1412) | WEB |
| [packages/server/src/webclient.ts:1074](../../packages/server/src/webclient.ts#L1074) `WebClient/view` | `Store.evaluateEach` (1074, 1098, 1117); `Store.canView` (1092); `Store.previewRow` (1096, 1118); `Store.get` (1109); `Store.row` (1110, 1110) | WEB |
| [packages/server/src/webclient.ts:1095](../../packages/server/src/webclient.ts#L1095) `WebClient/view/get` | `Store.get` (1095) | WEB |
| [packages/server/src/webclient.ts:2672](../../packages/server/src/webclient.ts#L2672) `foundIds` | `Store.findIds` (2672, 2674) | WEB |
| [packages/server/src/webclient.ts:2593](../../packages/server/src/webclient.ts#L2593) `listItems` | `Store.valueListItems` (2593) | WEB |
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
| [packages/store/src/store.ts:5263](../../packages/store/src/store.ts#L5263) `Store/accountIdentityId` | `SQLite.get` (5263, 5269); `SQLite.prepare` (5263, 5268, 5269); `Store.sql` (5263, 5268, 5269) | CORE |
| [packages/store/src/store.ts:5257](../../packages/store/src/store.ts#L5257) `Store/accountIdentityIdIfSet` | `SQLite.get` (5257); `SQLite.prepare` (5257); `Store.sql` (5257) | CORE |
| [packages/store/src/store.ts:5219](../../packages/store/src/store.ts#L5219) `Store/accountInactive` | `SQLite.get` (5219); `SQLite.prepare` (5219); `Store.sql` (5219) | CORE |
| [packages/store/src/store.ts:5416](../../packages/store/src/store.ts#L5416) `Store/accountLocalOnly` | `SQLite.get` (5416); `SQLite.prepare` (5416); `Store.sql` (5416) | CORE |
| [packages/store/src/store.ts:6285](../../packages/store/src/store.ts#L6285) `Store/accountPrivilegeSet` | `SQLite.get` (6285); `SQLite.prepare` (6285); `Store.sql` (6285) | CORE |
| [packages/store/src/store.ts:5421](../../packages/store/src/store.ts#L5421) `Store/accountRequires2fa` | `SQLite.get` (5421); `SQLite.prepare` (5421); `Store.sql` (5421) | CORE |
| [packages/store/src/store.ts:5641](../../packages/store/src/store.ts#L5641) `Store/accountUsage` | `SQLite.get` (5641); `SQLite.prepare` (5641, 5642); `Store.sql` (5641, 5642); `SQLite.all` (5642); `Store.auditLog` (5658) | CORE |
| [packages/store/src/store.ts:3665](../../packages/store/src/store.ts#L3665) `Store/accounts` | `SQLite.all` (3665); `SQLite.prepare` (3665); `Store.sql` (3665) | CORE |
| [packages/store/src/store.ts:3661](../../packages/store/src/store.ts#L3661) `Store/accountsSharingLockout` | `SQLite.all` (3661); `SQLite.prepare` (3661); `Store.sql` (3661) | CORE |
| [packages/store/src/store.ts:8469](../../packages/store/src/store.ts#L8469) `Store/addContainer` | `SQLite.all` (8469); `SQLite.prepare` (8469, 8474, 8488, 8492, 8493); `Store.sql` (8469, 8474, 8488, 8490, 8492, 8493, 8495, 8498); `SQLite.get` (8479); `Store.containerRange` (8481) | CORE |
| [packages/store/src/store.ts:8515](../../packages/store/src/store.ts#L8515) `Store/addExternalContainer` | `SQLite.prepare` (8515); `Store.sql` (8515) | CORE |
| [packages/store/src/store.ts:8992](../../packages/store/src/store.ts#L8992) `Store/addFieldIndex` | `Store.sql` (8992) | CORE |
| [packages/store/src/store.ts:7164](../../packages/store/src/store.ts#L7164) `Store/addImage` | `Store.sql` (7164, 7165); `SQLite.prepare` (7165) | CORE |
| [packages/store/src/store.ts:6335](../../packages/store/src/store.ts#L6335) `Store/addProvisionedAccount` | `SQLite.get` (6335); `SQLite.prepare` (6335, 6339); `Store.sql` (6335, 6339) | CORE |
| [packages/store/src/store.ts:7587](../../packages/store/src/store.ts#L7587) `Store/addRelated` | `relatedRows` (7587); `rowsById` (7620); `firstRelatedEach` (7643) | CORE |
| [packages/store/src/store.ts:3683](../../packages/store/src/store.ts#L3683) `Store/agentNeedsApproval` | `SQLite.get` (3683); `SQLite.prepare` (3683); `Store.sql` (3683) | CORE |
| [packages/store/src/store.ts:6559](../../packages/store/src/store.ts#L6559) `Store/allowedIds` | `SQLite.iterate` (6559); `SQLite.prepare` (6559); `Store.sql` (6559) | CORE |
| [packages/store/src/store.ts:5698](../../packages/store/src/store.ts#L5698) `Store/apiToken` | `SQLite.get` (5698); `SQLite.prepare` (5698, 5716); `Store.sql` (5698, 5716) | CORE |
| [packages/store/src/store.ts:5674](../../packages/store/src/store.ts#L5674) `Store/apiTokens` | `SQLite.all` (5674); `SQLite.prepare` (5674); `Store.sql` (5674) | CORE |
| [packages/store/src/store.ts:3124](../../packages/store/src/store.ts#L3124) `Store/appendSecurityRow` | `Store.sql` (3124) | CORE |
| [packages/store/src/store.ts:4034](../../packages/store/src/store.ts#L4034) `Store/appendSecurityEvent` | `Store.sql` (4034) | CORE |
| [packages/store/src/store.ts:5039](../../packages/store/src/store.ts#L5039) `Store/applyAccountImport` | `Store.sql` (5039, 5047, 5076); `SQLite.get` (5047); `SQLite.prepare` (5047, 5076) | CORE |
| [packages/store/src/store.ts:2425](../../packages/store/src/store.ts#L2425) `Store/applyDesign` | `Store.sql` (2425, 2426, 2446, 2449, 2454, 2470, 2473, 2473); `SQLite.prepare` (2449, 2454) | CORE |
| [packages/store/src/store.ts:3879](../../packages/store/src/store.ts#L3879) `Store/approvePending` | `SQLite.get` (3879); `SQLite.prepare` (3879, 3890); `Store.sql` (3879, 3890) | CORE |
| [packages/store/src/store.ts:2915](../../packages/store/src/store.ts#L2915) `Store/audit/write` | `Store.sql` (2915) | CORE |
| [packages/store/src/store.ts:2537](../../packages/store/src/store.ts#L2537) `Store/auditLog` | `SQLite.all` (2537); `SQLite.prepare` (2537); `Store.sql` (2537) | CORE |
| [packages/store/src/store.ts:1960](../../packages/store/src/store.ts#L1960) `Store/backup` | `Store.sql` (1960) | CORE |
| [packages/store/src/store.ts:3689](../../packages/store/src/store.ts#L3689) `Store/blankPasswordAccounts` | `SQLite.all` (3689); `SQLite.prepare` (3689); `Store.sql` (3689) | CORE |
| [packages/store/src/store.ts:9578](../../packages/store/src/store.ts#L9578) `Store/canView` | `Store.canView` (9578); `Store.row` (9579) | GATED-STORE |
| [packages/store/src/store.ts:9560](../../packages/store/src/store.ts#L9560) `Store/canViewRecord` | `SQLite.get` (9560); `SQLite.prepare` (9560); `Store.sql` (9560) | GATED-STORE |
| [packages/store/src/store.ts:4968](../../packages/store/src/store.ts#L4968) `Store/canonicalAccount` | `SQLite.all` (4968); `SQLite.prepare` (4968); `Store.sql` (4968) | CORE |
| [packages/store/src/store.ts:10667](../../packages/store/src/store.ts#L10667) `Store/cascadeDelete` | `relatedRows` (10667) | CORE |
| [packages/store/src/store.ts:2260](../../packages/store/src/store.ts#L2260) `Store/changeOne` | `Store.sql` (2260, 2262) | CORE |
| [packages/store/src/store.ts:2263](../../packages/store/src/store.ts#L2263) `Store/changeOne/read` | `SQLite.get` (2263); `SQLite.prepare` (2263); `Store.sql` (2263) | CORE |
| [packages/store/src/store.ts:8850](../../packages/store/src/store.ts#L8850) `Store/checkContainerWrite` | `Store.row` (8850) | CORE |
| [packages/store/src/store.ts:10290](../../packages/store/src/store.ts#L10290) `Store/checkEditable` | `Store.row` (10290) | CORE |
| [packages/store/src/store.ts:1506](../../packages/store/src/store.ts#L1506) `Store/checkpoint` | `SQLite.get` (1506); `SQLite.prepare` (1506); `Store.sql` (1506) | CORE |
| [packages/store/src/store.ts:6321](../../packages/store/src/store.ts#L6321) `Store/clearAccountPrivilegeSet` | `SQLite.prepare` (6321); `Store.sql` (6321) | CORE |
| [packages/store/src/store.ts:1528](../../packages/store/src/store.ts#L1528) `Store/close` | `Store.sql` (1528) | CORE |
| [packages/store/src/store.ts:8818](../../packages/store/src/store.ts#L8818) `Store/compactFile` | `Store.sql` (8818, 8819, 8821) | CORE |
| [packages/store/src/store.ts:10791](../../packages/store/src/store.ts#L10791) `Store/computeValuesCurrent` | `Store.computeValues` (10791); `Store.sql` (10797, 10801); `SQLite.all` (10801); `SQLite.prepare` (10801) | GATED-STORE |
| [packages/store/src/store.ts:9229](../../packages/store/src/store.ts#L9229) `Store/computedRows` | `Store.sql` (9229, 9232, 9233, 9234, 9236, 9246, 9247, 9248, 9251); `SQLite.prepare` (9232, 9234, 9236, 9246); `SQLite.iterate` (9236); `Calculations.globalValue` (9239); `Calculations.unstoredValue` (9240); `Calculations.related` (9243); `SQLite.all` (9246) | CORE |
| [packages/store/src/store.ts:5743](../../packages/store/src/store.ts#L5743) `Store/confirmTotp` | `SQLite.get` (5743); `SQLite.prepare` (5743, 5745); `Store.sql` (5743, 5745) | CORE |
| [packages/store/src/store.ts:1149](../../packages/store/src/store.ts#L1149) `Store/constructor` | `Store.sql` (1149, 1151, 1153, 1154, 1158, 1162, 1163, 1172, 1180, 1195, 1200, 1205, 1206, 1210, 1211, 1212, 1219, 1223, 1227, 1228, 1229, 1234, 1238, 1241, 1242, 1244, 1245, 1248, 1249, 1253, 1254, 1258, 1259, 1262, 1264, 1267, 1268, 1272, 1273, 1277, 1278, 1282, 1283, 1284, 1287, 1288, 1291, 1292, 1294, 1294, 1295, 1295, 1296, 1300, 1302, 1306, 1308, 1311, 1312, 1313, 1316, 1317, 1319, 1321, 1322, 1326, 1327, 1329, 1341, 1343, 1344, 1345, 1345, 1349, 1350); `SQLite.get` (1153, 1172); `SQLite.prepare` (1153, 1172, 1180, 1241, 1242, 1245, 1248, 1253, 1258, 1267, 1272, 1277, 1287, 1291, 1294, 1295, 1316, 1321, 1326); `SQLite.all` (1241, 1248, 1253, 1258, 1267, 1272, 1277, 1287, 1291, 1294, 1295, 1316, 1321, 1326) | CORE |
| [packages/store/src/store.ts:6101](../../packages/store/src/store.ts#L6101) `Store/consumeRecoveryCode` | `SQLite.prepare` (6101); `Store.sql` (6101) | CORE |
| [packages/store/src/store.ts:8393](../../packages/store/src/store.ts#L8393) `Store/container` | `SQLite.get` (8393); `SQLite.prepare` (8393, 8402); `Store.sql` (8393, 8402); `SQLite.all` (8402) | CORE |
| [packages/store/src/store.ts:8827](../../packages/store/src/store.ts#L8827) `Store/containerId` | `Store.containerId` (8827); `Store.row` (8828) | CORE |
| [packages/store/src/store.ts:8410](../../packages/store/src/store.ts#L8410) `Store/containerInfo` | `SQLite.get` (8410); `SQLite.prepare` (8410); `Store.sql` (8410) | CORE |
| [packages/store/src/store.ts:8374](../../packages/store/src/store.ts#L8374) `Store/containerIntact` | `SQLite.get` (8374); `SQLite.prepare` (8374); `Store.sql` (8374) | CORE |
| [packages/store/src/store.ts:8313](../../packages/store/src/store.ts#L8313) `Store/containerIntegrityReport` | `SQLite.all` (8313); `SQLite.prepare` (8313, 8324); `Store.sql` (8313, 8324); `SQLite.get` (8324) | CORE |
| [packages/store/src/store.ts:8388](../../packages/store/src/store.ts#L8388) `Store/containerMeta` | `SQLite.get` (8388); `SQLite.prepare` (8388); `Store.sql` (8388) | CORE |
| [packages/store/src/store.ts:8444](../../packages/store/src/store.ts#L8444) `Store/containerRange` | `SQLite.all` (8444); `SQLite.prepare` (8444, 8451); `Store.sql` (8444, 8451); `SQLite.get` (8451) | CORE |
| [packages/store/src/store.ts:8215](../../packages/store/src/store.ts#L8215) `Store/containerReferences` | `SQLite.all` (8215, 8234, 8236, 8242, 8255, 8266, 8280); `SQLite.prepare` (8215, 8234, 8236, 8242, 8255, 8266, 8278, 8280); `Store.sql` (8215, 8234, 8236, 8242, 8255, 8266, 8278, 8280); `SQLite.get` (8278); `Store.row` (8289) | CORE |
| [packages/store/src/store.ts:10771](../../packages/store/src/store.ts#L10771) `Store/countIds` | `Store.countIds` (10771); `SQLite.get` (10775); `SQLite.prepare` (10775); `Store.sql` (10775) | GATED-STORE |
| [packages/store/src/store.ts:9609](../../packages/store/src/store.ts#L9609) `Store/create` | `SQLite.get` (9609); `SQLite.prepare` (9609, 9622); `Store.sql` (9609, 9622) | CORE |
| [packages/store/src/store.ts:5474](../../packages/store/src/store.ts#L5474) `Store/createApiToken` | `SQLite.get` (5474, 5502); `SQLite.prepare` (5474, 5501, 5502, 5512); `Store.sql` (5474, 5501, 5502, 5512) | CORE |
| [packages/store/src/store.ts:4980](../../packages/store/src/store.ts#L4980) `Store/createLocalAccount` | `SQLite.prepare` (4980); `Store.sql` (4980) | CORE |
| [packages/store/src/store.ts:3655](../../packages/store/src/store.ts#L3655) `Store/credentialIdentity` | `SQLite.get` (3655); `SQLite.prepare` (3655); `Store.sql` (3655) | CORE |
| [packages/store/src/store.ts:5395](../../packages/store/src/store.ts#L5395) `Store/credentialStamp` | `SQLite.get` (5395); `SQLite.prepare` (5395); `Store.sql` (5395) | CORE |
| [packages/store/src/store.ts:2050](../../packages/store/src/store.ts#L2050) `Store/dataVersion` | `SQLite.get` (2050); `SQLite.prepare` (2050); `Store.sql` (2050) | CORE |
| [packages/store/src/store.ts:11328](../../packages/store/src/store.ts#L11328) `Store/decimalViewSql` | `SQLite.all` (11328); `SQLite.prepare` (11328) | CORE |
| [packages/store/src/store.ts:10333](../../packages/store/src/store.ts#L10333) `Store/delete` | `Store.row` (10333) | CORE |
| [packages/store/src/store.ts:10341](../../packages/store/src/store.ts#L10341) `Store/delete/run` | `SQLite.get` (10341); `SQLite.prepare` (10341, 10346); `Store.sql` (10341, 10346) | CORE |
| [packages/store/src/store.ts:5134](../../packages/store/src/store.ts#L5134) `Store/deleteAccount` | `SQLite.prepare` (5134, 5138, 5139, 5140, 5141, 5142, 5143, 5144, 5145, 5152, 5154, 5156, 5158, 5162); `Store.sql` (5134, 5138, 5139, 5140, 5141, 5142, 5143, 5144, 5145, 5152, 5154, 5156, 5158, 5162) | CORE |
| [packages/store/src/store.ts:10414](../../packages/store/src/store.ts#L10414) `Store/deleteBeingUndone` | `SQLite.all` (10414); `SQLite.prepare` (10414); `Store.sql` (10414) | CORE |
| [packages/store/src/store.ts:10426](../../packages/store/src/store.ts#L10426) `Store/deleteEndingTheLifeAt` | `SQLite.get` (10426); `SQLite.prepare` (10426); `Store.sql` (10426) | CORE |
| [packages/store/src/store.ts:6186](../../packages/store/src/store.ts#L6186) `Store/deletePrivilegeSet` | `SQLite.prepare` (6186); `Store.sql` (6186) | CORE |
| [packages/store/src/store.ts:4144](../../packages/store/src/store.ts#L4144) `Store/deleteScriptTest` | `SQLite.prepare` (4144); `Store.sql` (4144) | CORE |
| [packages/store/src/store.ts:3292](../../packages/store/src/store.ts#L3292) `Store/deletedRows` | `SQLite.get` (3292); `SQLite.prepare` (3292, 3294, 3294); `Store.sql` (3292, 3294, 3294); `SQLite.all` (3294, 3294) | CORE |
| [packages/store/src/store.ts:3402](../../packages/store/src/store.ts#L3402) `Store/designEffect` | `Store.sql` (3402, 3408, 3409, 3412, 3418, 3423, 3426, 3432, 3443, 3444, 3446, 3447, 3460, 3461, 3464, 3466, 3472, 3473, 3474, 3480, 3482, 3486, 3489, 3490, 3492, 3495, 3501, 3503, 3510, 3511, 3513, 3514, 3515, 3516, 3523, 3524, 3526, 3526, 3528, 3529, 3530, 3534, 3538, 3540, 3578, 3580, 3582); `SQLite.prepare` (3412, 3443, 3444, 3460, 3461, 3472, 3473, 3480, 3482, 3486, 3490, 3501, 3503, 3516, 3523, 3524, 3526, 3528, 3530, 3534, 3538); `SQLite.get` (3443, 3460, 3472, 3473, 3486, 3490, 3526, 3534); `SQLite.all` (3523, 3524); `SQLite.iterate` (3528) | CORE |
| [packages/store/src/store.ts:3395](../../packages/store/src/store.ts#L3395) `Store/designEffect/renameExcluded` | `SQLite.prepare` (3395); `Store.sql` (3395) | CORE |
| [packages/store/src/store.ts:3379](../../packages/store/src/store.ts#L3379) `Store/designEffect/renameKey` | `SQLite.prepare` (3379); `Store.sql` (3379) | CORE |
| [packages/store/src/store.ts:3333](../../packages/store/src/store.ts#L3333) `Store/designHistory` | `SQLite.all` (3333); `SQLite.prepare` (3333); `Store.sql` (3333) | CORE |
| [packages/store/src/store.ts:5764](../../packages/store/src/store.ts#L5764) `Store/disableTotp` | `SQLite.prepare` (5764); `Store.sql` (5764) | CORE |
| [packages/store/src/store.ts:3590](../../packages/store/src/store.ts#L3590) `Store/dropColumnIndexes` | `SQLite.all` (3590, 3592); `SQLite.prepare` (3590, 3592); `Store.sql` (3590, 3592, 3593) | CORE |
| [packages/store/src/store.ts:9004](../../packages/store/src/store.ts#L9004) `Store/dropFieldIndex` | `SQLite.get` (9004); `SQLite.prepare` (9004); `Store.sql` (9004, 9005) | CORE |
| [packages/store/src/store.ts:9646](../../packages/store/src/store.ts#L9646) `Store/duplicate` | `Store.row` (9646); `SQLite.prepare` (9664); `Store.sql` (9664) | CORE |
| [packages/store/src/store.ts:8631](../../packages/store/src/store.ts#L8631) `Store/embeddedContainerCount` | `SQLite.prepare` (8631); `Store.sql` (8631); `SQLite.get` (8632) | CORE |
| [packages/store/src/store.ts:8617](../../packages/store/src/store.ts#L8617) `Store/embeddedContainers` | `SQLite.prepare` (8617, 8618); `Store.sql` (8617, 8618); `SQLite.all` (8618); `SQLite.get` (8622) | CORE |
| [packages/store/src/store.ts:3318](../../packages/store/src/store.ts#L3318) `Store/emptyDeleted` | `Store.sql` (3318, 3321, 3322, 3324, 3326); `SQLite.prepare` (3322) | CORE |
| [packages/store/src/store.ts:1926](../../packages/store/src/store.ts#L1926) `Store/endTransaction` | `Store.sql` (1926, 1929, 1929) | CORE |
| [packages/store/src/store.ts:5732](../../packages/store/src/store.ts#L5732) `Store/enrollTotp` | `SQLite.prepare` (5732); `Store.sql` (5732) | CORE |
| [packages/store/src/store.ts:3287](../../packages/store/src/store.ts#L3287) `Store/ensureDeleted` | `Store.sql` (3287) | CORE |
| [packages/store/src/store.ts:1360](../../packages/store/src/store.ts#L1360) `Store/ensureNativeIds` | `SQLite.all` (1360, 1372); `SQLite.prepare` (1360, 1363, 1371, 1372); `Store.sql` (1360, 1363, 1366, 1370, 1371, 1372, 1375, 1377) | CORE |
| [packages/store/src/store.ts:2172](../../packages/store/src/store.ts#L2172) `Store/ensureRecordIdHighWater` | `Store.sql` (2172, 2173, 2175, 2177, 2179) | CORE |
| [packages/store/src/store.ts:2191](../../packages/store/src/store.ts#L2191) `Store/ensureRecordIdMarks` | `SQLite.all` (2191, 2194, 2197, 2206); `SQLite.prepare` (2191, 2194, 2197, 2200, 2206, 2209); `Store.sql` (2191, 2194, 2197, 2200, 2206, 2209, 2213, 2214) | CORE |
| [packages/store/src/store.ts:9987](../../packages/store/src/store.ts#L9987) `Store/evaluateCurrent` | `Store.row` (9987, 9987, 9988, 9988); `Calculations.context` (9993); `Store.get` (9994, 9996) | GATED-STORE |
| [packages/store/src/store.ts:10028](../../packages/store/src/store.ts#L10028) `Store/evaluateEachCurrent` | `Store.row` (10028, 10028, 10033); `Calculations.context` (10034); `Store.get` (10036) | GATED-STORE |
| [packages/store/src/store.ts:10090](../../packages/store/src/store.ts#L10090) `Store/evaluateRowsCurrent` | `Store.row` (10090, 10090, 10091, 10091) | GATED-STORE |
| [packages/store/src/store.ts:10069](../../packages/store/src/store.ts#L10069) `Store/evaluateRowsCurrent/each` | `Calculations.context` (10069); `Store.get` (10071) | GATED-STORE |
| [packages/store/src/store.ts:10105](../../packages/store/src/store.ts#L10105) `Store/evaluateRowsCurrent/found/[Symbol.iterator]` | `rowsById` (10105) | GATED-STORE |
| [packages/store/src/store.ts:10127](../../packages/store/src/store.ts#L10127) `Store/evaluateRowsCurrent/key` | `Calculations.context` (10127) | GATED-STORE |
| [packages/store/src/store.ts:3922](../../packages/store/src/store.ts#L3922) `Store/externalAccount` | `SQLite.all` (3922); `SQLite.prepare` (3922); `Store.sql` (3922) | CORE |
| [packages/store/src/store.ts:8136](../../packages/store/src/store.ts#L8136) `Store/externalContainerCheck` | `SQLite.all` (8136); `SQLite.prepare` (8136); `Store.sql` (8136) | CORE |
| [packages/store/src/store.ts:8143](../../packages/store/src/store.ts#L8143) `Store/externalContainerCount` | `SQLite.get` (8143); `SQLite.prepare` (8143); `Store.sql` (8143) | CORE |
| [packages/store/src/store.ts:8152](../../packages/store/src/store.ts#L8152) `Store/externalContainerReport` | `SQLite.all` (8152, 8165); `SQLite.prepare` (8152, 8165); `Store.sql` (8152, 8165) | CORE |
| [packages/store/src/store.ts:5245](../../packages/store/src/store.ts#L5245) `Store/externalIdentityId` | `SQLite.get` (5245, 5252); `SQLite.prepare` (5245, 5251, 5252); `Store.sql` (5245, 5251, 5252) | CORE |
| [packages/store/src/store.ts:8384](../../packages/store/src/store.ts#L8384) `Store/externalOf` | `SQLite.get` (8384); `SQLite.prepare` (8384); `Store.sql` (8384) | CORE |
| [packages/store/src/store.ts:3068](../../packages/store/src/store.ts#L3068) `Store/failureAuditRoom` | `SQLite.get` (3068); `SQLite.prepare` (3068); `Store.sql` (3068) | CORE |
| [packages/store/src/store.ts:7789](../../packages/store/src/store.ts#L7789) `Store/fieldIndexCurrent` | `SQLite.iterate` (7789); `SQLite.prepare` (7789, 7794); `Store.sql` (7789, 7794); `SQLite.all` (7794) | GATED-STORE |
| [packages/store/src/store.ts:9044](../../packages/store/src/store.ts#L9044) `Store/find` | `Store.find` (9044) | GATED-STORE |
| [packages/store/src/store.ts:9416](../../packages/store/src/store.ts#L9416) `Store/findCandidates` | `Store.query` (9416) | CORE |
| [packages/store/src/store.ts:9055](../../packages/store/src/store.ts#L9055) `Store/findHere` | `Store.query` (9055, 9060, 9062, 9076, 9078, 9089); `Store.recordCount` (9073); `SQLite.get` (9074, 9078); `SQLite.prepare` (9074, 9078, 9084, 9091, 9100); `Store.sql` (9074, 9078, 9084, 9091, 9100); `SQLite.all` (9084, 9091, 9100) | GATED-STORE |
| [packages/store/src/store.ts:9095](../../packages/store/src/store.ts#L9095) `Store/findHere/[Symbol.iterator]` | `SQLite.iterate` (9095); `SQLite.prepare` (9095); `Store.sql` (9095) | GATED-STORE |
| [packages/store/src/store.ts:10902](../../packages/store/src/store.ts#L10902) `Store/findIdsCurrent` | `Store.findIds` (10902) | GATED-STORE |
| [packages/store/src/store.ts:10838](../../packages/store/src/store.ts#L10838) `Store/findIdsCurrentProgress` | `Store.findIdsProgress` (10838); `Store.query` (10840, 10841, 10854, 10856); `Store.recordCount` (10846, 10874); `SQLite.iterate` (10871); `SQLite.prepare` (10871, 10879, 10880); `Store.sql` (10871, 10879, 10880); `SQLite.get` (10883); `SQLite.all` (10889) | GATED-STORE |
| [packages/store/src/store.ts:10908](../../packages/store/src/store.ts#L10908) `Store/findIdsHere` | `Store.query` (10908, 10913, 10915); `SQLite.iterate` (10926); `SQLite.prepare` (10926); `Store.sql` (10926) | GATED-STORE |
| [packages/store/src/store.ts:9360](../../packages/store/src/store.ts#L9360) `Store/findSource` | `Store.query` (9360); `SQLite.all` (9369, 9386); `SQLite.prepare` (9369, 9377, 9385); `Store.sql` (9369, 9374, 9377, 9382, 9385, 9399, 9401); `Calculations.globalValue` (9391); `Calculations.unstoredValue` (9392); `Calculations.related` (9396) | CORE |
| [packages/store/src/store.ts:3180](../../packages/store/src/store.ts#L3180) `Store/flushDeferredSecurity` | `Store.sql` (3180) | CORE |
| [packages/store/src/store.ts:10381](../../packages/store/src/store.ts#L10381) `Store/forgetStandInValues` | `Store.sql` (10381, 10402); `SQLite.prepare` (10402) | CORE |
| [packages/store/src/store.ts:5101](../../packages/store/src/store.ts#L5101) `Store/forgetStandIns` | `SQLite.prepare` (5101); `Store.sql` (5101) | CORE |
| [packages/store/src/store.ts:7671](../../packages/store/src/store.ts#L7671) `Store/foundSetPage` | `rowsById` (7671) | CORE |
| [packages/store/src/store.ts:7687](../../packages/store/src/store.ts#L7687) `Store/foundSetRowsCurrent` | `Store.viewableIds` (7687); `Store.row` (7703) | GATED-STORE |
| [packages/store/src/store.ts:3841](../../packages/store/src/store.ts#L3841) `Store/gateAgentWrite` | `SQLite.get` (3841); `SQLite.prepare` (3841, 3843); `Store.sql` (3841, 3843) | CORE |
| [packages/store/src/store.ts:6039](../../packages/store/src/store.ts#L6039) `Store/generateRecoveryCodes` | `SQLite.prepare` (6039, 6042); `Store.sql` (6039, 6042) | CORE |
| [packages/store/src/store.ts:9488](../../packages/store/src/store.ts#L9488) `Store/getCurrent` | `Store.get` (9488); `Store.row` (9489, 9489, 9503); `SQLite.all` (9506); `SQLite.prepare` (9506); `Store.sql` (9506) | GATED-STORE |
| [packages/store/src/store.ts:9526](../../packages/store/src/store.ts#L9526) `Store/getManyCurrent` | `Store.getMany` (9526); `SQLite.get` (9544); `SQLite.prepare` (9544); `Store.sql` (9544) | GATED-STORE |
| [packages/store/src/store.ts:9537](../../packages/store/src/store.ts#L9537) `Store/getManyCurrent/[Symbol.iterator]` | `rowsById` (9537) | GATED-STORE |
| [packages/store/src/store.ts:1407](../../packages/store/src/store.ts#L1407) `Store/grantFullAccessClients` | `SQLite.prepare` (1407); `Store.sql` (1407) | CORE |
| [packages/store/src/store.ts:10943](../../packages/store/src/store.ts#L10943) `Store/groupSummariesCurrent` | `Store.groupSummaries` (10943); `Store.viewableIds` (10948); `Calculations.collect` (10964); `rowsById` (10964, 11014); `Calculations.collector` (10986) | GATED-STORE |
| [packages/store/src/store.ts:11012](../../packages/store/src/store.ts#L11012) `Store/groupSummariesCurrent/flush` | `Calculations.collector` (11012) | GATED-STORE |
| [packages/store/src/store.ts:10976](../../packages/store/src/store.ts#L10976) `Store/groupSummariesCurrent/key` | `Calculations.value` (10976); `Calculations.related` (10978) | GATED-STORE |
| [packages/store/src/store.ts:1434](../../packages/store/src/store.ts#L1434) `Store/hasOwnPassword` | `SQLite.get` (1434); `SQLite.prepare` (1434); `Store.sql` (1434) | CORE |
| [packages/store/src/store.ts:5894](../../packages/store/src/store.ts#L5894) `Store/hasPasskey` | `SQLite.get` (5894); `SQLite.prepare` (5894); `Store.sql` (5894) | CORE |
| [packages/store/src/store.ts:1415](../../packages/store/src/store.ts#L1415) `Store/hasProvingPassword` | `SQLite.get` (1415); `SQLite.prepare` (1415); `Store.sql` (1415) | CORE |
| [packages/store/src/store.ts:8958](../../packages/store/src/store.ts#L8958) `Store/hasTable` | `SQLite.get` (8958); `SQLite.prepare` (8958); `Store.sql` (8958) | CORE |
| [packages/store/src/store.ts:5753](../../packages/store/src/store.ts#L5753) `Store/hasTotp` | `SQLite.get` (5753); `SQLite.prepare` (5753); `Store.sql` (5753) | CORE |
| [packages/store/src/store.ts:5224](../../packages/store/src/store.ts#L5224) `Store/identityAllowed` | `SQLite.get` (5224, 5230, 5236); `SQLite.prepare` (5224, 5230, 5236); `Store.sql` (5224, 5230, 5236) | CORE |
| [packages/store/src/store.ts:7141](../../packages/store/src/store.ts#L7141) `Store/image` | `SQLite.get` (7141); `SQLite.prepare` (7141); `Store.sql` (7141) | CORE |
| [packages/store/src/store.ts:7151](../../packages/store/src/store.ts#L7151) `Store/images` | `SQLite.all` (7151); `SQLite.prepare` (7151); `Store.sql` (7151) | CORE |
| [packages/store/src/store.ts:4945](../../packages/store/src/store.ts#L4945) `Store/importAccounts` | `SQLite.all` (4945); `SQLite.prepare` (4945); `Store.sql` (4945) | CORE |
| [packages/store/src/store.ts:1748](../../packages/store/src/store.ts#L1748) `Store/independentWindowWrite` | `SQLite.get` (1748); `SQLite.prepare` (1748, 1756, 1816); `Store.sql` (1748, 1756, 1766, 1794, 1811, 1816, 1819); `SQLite.all` (1756); `Store.row` (1814) | CORE |
| [packages/store/src/store.ts:2227](../../packages/store/src/store.ts#L2227) `Store/nextRecordId` | `SQLite.get` (2227); `SQLite.prepare` (2227); `Store.sql` (2227) | CORE |
| [packages/store/src/store.ts:1593](../../packages/store/src/store.ts#L1593) `Store/securityChainHeadAudit` | `SQLite.get` (1593); `SQLite.prepare` (1593); `Store.sql` (1593) | CORE |
| [packages/store/src/store.ts:8970](../../packages/store/src/store.ts#L8970) `Store/indexedFields` | `SQLite.all` (8970, 8971); `SQLite.prepare` (8970, 8971); `Store.sql` (8970, 8971) | CORE |
| [packages/store/src/store.ts:11361](../../packages/store/src/store.ts#L11361) `Store/internalRoots` | `SQLite.get` (11361); `SQLite.prepare` (11361, 11363); `SQLite.all` (11363) | CORE |
| [packages/store/src/store.ts:3677](../../packages/store/src/store.ts#L3677) `Store/isAgent` | `SQLite.get` (3677); `SQLite.prepare` (3677); `Store.sql` (3677) | CORE |
| [packages/store/src/store.ts:3780](../../packages/store/src/store.ts#L3780) `Store/isExternal` | `SQLite.get` (3780); `SQLite.prepare` (3780); `Store.sql` (3780) | CORE |
| [packages/store/src/store.ts:5808](../../packages/store/src/store.ts#L5808) `Store/issueWebauthnChallenge` | `SQLite.prepare` (5808, 5810, 5811, 5813); `Store.sql` (5808, 5810, 5811, 5813); `SQLite.get` (5810) | CORE |
| [packages/store/src/store.ts:11224](../../packages/store/src/store.ts#L11224) `Store/iterateCommitted` | `SQLite.iterate` (11224) | CORE |
| [packages/store/src/store.ts:1688](../../packages/store/src/store.ts#L1688) `Store/joinTransaction` | `Store.sql` (1688, 1689, 1691, 1693, 1699, 1702) | CORE |
| [packages/store/src/store.ts:10614](../../packages/store/src/store.ts#L10614) `Store/keyStepWork` | `Store.sql` (10614, 10620, 10624, 10626) | CORE |
| [packages/store/src/store.ts:6957](../../packages/store/src/store.ts#L6957) `Store/knownSharedAccount` | `SQLite.get` (6957); `SQLite.prepare` (6957); `Store.sql` (6957) | CORE |
| [packages/store/src/store.ts:4418](../../packages/store/src/store.ts#L4418) `Store/lastSignIns` | `Store.auditLog` (4418) | CORE |
| [packages/store/src/store.ts:10432](../../packages/store/src/store.ts#L10432) `Store/latestDeleteSeq` | `SQLite.get` (10432); `SQLite.prepare` (10432); `Store.sql` (10432) | CORE |
| [packages/store/src/store.ts:7181](../../packages/store/src/store.ts#L7181) `Store/layout` | `SQLite.get` (7181); `SQLite.prepare` (7181); `Store.sql` (7181) | CORE |
| [packages/store/src/store.ts:3350](../../packages/store/src/store.ts#L3350) `Store/layoutHistory` | `SQLite.all` (3350); `SQLite.prepare` (3350); `Store.sql` (3350) | CORE |
| [packages/store/src/store.ts:7071](../../packages/store/src/store.ts#L7071) `Store/layouts` | `SQLite.all` (7071); `SQLite.prepare` (7071); `Store.sql` (7071) | CORE |
| [packages/store/src/store.ts:4718](../../packages/store/src/store.ts#L4718) `Store/leastPrivilege` | `SQLite.all` (4718); `SQLite.prepare` (4718); `Store.sql` (4718) | CORE |
| [packages/store/src/store.ts:5322](../../packages/store/src/store.ts#L5322) `Store/ledgerRow` | `SQLite.get` (5322, 5323); `SQLite.prepare` (5322, 5323); `Store.sql` (5322, 5323) | AUTH |
| [packages/store/src/store.ts:5334](../../packages/store/src/store.ts#L5334) `Store/ledgerWrite` | `Store.sql` (5334, 5335, 5337, 5339, 5342, 5342) | AUTH |
| [packages/store/src/store.ts:5028](../../packages/store/src/store.ts#L5028) `Store/limitAccountImport` | `SQLite.prepare` (5028, 5029, 5032); `Store.sql` (5028, 5029, 5032); `SQLite.get` (5029) | CORE |
| [packages/store/src/store.ts:3630](../../packages/store/src/store.ts#L3630) `Store/linkIdentity` | `SQLite.get` (3630); `SQLite.prepare` (3630); `Store.sql` (3630) | CORE |
| [packages/store/src/store.ts:3622](../../packages/store/src/store.ts#L3622) `Store/linkPrincipal` | `SQLite.get` (3622); `SQLite.prepare` (3622); `Store.sql` (3622) | CORE |
| [packages/store/src/store.ts:4304](../../packages/store/src/store.ts#L4304) `Store/markPiiField` | `SQLite.prepare` (4304); `Store.sql` (4304) | CORE |
| [packages/store/src/store.ts:8109](../../packages/store/src/store.ts#L8109) `Store/markRepeating` | `SQLite.prepare` (8109); `Store.sql` (8109) | CORE |
| [packages/store/src/store.ts:11157](../../packages/store/src/store.ts#L11157) `Store/matchIds` | `Store.matchIds` (11157); `SQLite.all` (11163); `SQLite.prepare` (11163); `Store.sql` (11163) | CORE |
| [packages/store/src/store.ts:1449](../../packages/store/src/store.ts#L1449) `Store/meta` | `SQLite.get` (1449); `SQLite.prepare` (1449); `Store.sql` (1449) | CORE |
| [packages/store/src/store.ts:1004](../../packages/store/src/store.ts#L1004) `Store/metadataVersions` | `SQLite.get` (1004); `SQLite.prepare` (1004); `Store.sql` (1004) | CORE |
| [packages/store/src/store.ts:8746](../../packages/store/src/store.ts#L8746) `Store/moveContainersIn` | `Store.sql` (8746, 8752, 8754, 8755, 8756, 8757, 8777, 8782, 8782, 8793, 8796, 8799, 8806); `SQLite.prepare` (8754, 8755, 8756, 8757, 8793, 8799); `SQLite.get` (8759, 8793, 8799) | CORE |
| [packages/store/src/store.ts:8668](../../packages/store/src/store.ts#L8668) `Store/moveContainersOut` | `Store.sql` (8668, 8676, 8678, 8680, 8685, 8686, 8706, 8712, 8714, 8716, 8716, 8722, 8722, 8727, 8729, 8731, 8731, 8737); `SQLite.get` (8676); `SQLite.prepare` (8676, 8685, 8686); `Store.container` (8688) | CORE |
| [packages/store/src/store.ts:4899](../../packages/store/src/store.ts#L4899) `Store/mustChangePassword` | `SQLite.get` (4899); `SQLite.prepare` (4899); `Store.sql` (4899) | CORE |
| [packages/store/src/store.ts:1385](../../packages/store/src/store.ts#L1385) `Store/nativeIdGuards` | `Store.sql` (1385, 1386, 1388) | CORE |
| [packages/store/src/store.ts:5628](../../packages/store/src/store.ts#L5628) `Store/objectUseSince` | `SQLite.get` (5628); `SQLite.prepare` (5628); `Store.sql` (5628) | CORE |
| [packages/store/src/store.ts:8930](../../packages/store/src/store.ts#L8930) `Store/orderBy` | `Store.valueListItems` (8930) | CORE |
| [packages/store/src/store.ts:8301](../../packages/store/src/store.ts#L8301) `Store/orphanContainerReport` | `SQLite.all` (8301); `SQLite.prepare` (8301); `Store.sql` (8301) | CORE |
| [packages/store/src/store.ts:5860](../../packages/store/src/store.ts#L5860) `Store/passkeyAllowList` | `SQLite.all` (5860); `SQLite.prepare` (5860); `Store.sql` (5860) | CORE |
| [packages/store/src/store.ts:5899](../../packages/store/src/store.ts#L5899) `Store/passkeyIds` | `SQLite.all` (5899); `SQLite.prepare` (5899); `Store.sql` (5899) | CORE |
| [packages/store/src/store.ts:5887](../../packages/store/src/store.ts#L5887) `Store/passkeys` | `SQLite.all` (5887); `SQLite.prepare` (5887); `Store.sql` (5887) | CORE |
| [packages/store/src/store.ts:4938](../../packages/store/src/store.ts#L4938) `Store/passwordDaysRemaining` | `SQLite.get` (4938); `SQLite.prepare` (4938); `Store.sql` (4938) | CORE |
| [packages/store/src/store.ts:3865](../../packages/store/src/store.ts#L3865) `Store/pendingChanges` | `SQLite.all` (3865); `SQLite.prepare` (3865); `Store.sql` (3865) | CORE |
| [packages/store/src/store.ts:1467](../../packages/store/src/store.ts#L1467) `Store/persistentData` | `SQLite.get` (1467) | CORE |
| [packages/store/src/store.ts:1476](../../packages/store/src/store.ts#L1476) `Store/persistentDataIds` | `SQLite.all` (1476) | CORE |
| [packages/store/src/store.ts:1457](../../packages/store/src/store.ts#L1457) `Store/persistentTable` | `Store.sql` (1457) | CORE |
| [packages/store/src/store.ts:10275](../../packages/store/src/store.ts#L10275) `Store/portalContainerTarget` | `Store.row` (10275); `relatedIdList` (10277) | CORE |
| [packages/store/src/store.ts:7726](../../packages/store/src/store.ts#L7726) `Store/portalCountsCurrent` | `Store.canView` (7726); `Store.row` (7753) | GATED-STORE |
| [packages/store/src/store.ts:7964](../../packages/store/src/store.ts#L7964) `Store/portalRows` | `relatedRows` (7964); `relatedIdList` (7965); `Store.viewableSet` (7968); `rowsById` (7993, 8031); `Calculations.related` (8007) | CORE |
| [packages/store/src/store.ts:7975](../../packages/store/src/store.ts#L7975) `Store/portalRows/context` | `Calculations.context` (7975) | CORE |
| [packages/store/src/store.ts:7985](../../packages/store/src/store.ts#L7985) `Store/portalRows/valueOf` | `Calculations.value` (7985) | CORE |
| [packages/store/src/store.ts:2603](../../packages/store/src/store.ts#L2603) `Store/prepared` | `SQLite.prepare` (2603); `Store.sql` (2603) | CORE |
| [packages/store/src/store.ts:5010](../../packages/store/src/store.ts#L5010) `Store/previewAccountImport` | `Store.sql` (5010, 5011, 5020) | CORE |
| [packages/store/src/store.ts:6713](../../packages/store/src/store.ts#L6713) `Store/previewRecordRuleCurrent` | `SQLite.get` (6713); `SQLite.prepare` (6713, 6716); `Store.sql` (6713, 6716); `SQLite.all` (6716); `Calculations.context` (6722, 6738) | CORE |
| [packages/store/src/store.ts:9451](../../packages/store/src/store.ts#L9451) `Store/previewRow` | `Store.row` (9451) | CORE |
| [packages/store/src/store.ts:6114](../../packages/store/src/store.ts#L6114) `Store/privilegeSets` | `Store.sql` (6114) | CORE |
| [packages/store/src/store.ts:2835](../../packages/store/src/store.ts#L2835) `Store/pruneAudit` | `Store.sql` (2835, 2837, 2839); `SQLite.get` (2837); `SQLite.prepare` (2837) | CORE |
| [packages/store/src/store.ts:8336](../../packages/store/src/store.ts#L8336) `Store/purgeOrphanContainers` | `Store.sql` (8336, 8340, 8349, 8352, 8353, 8358, 8359, 8361, 8361); `Store.orphanContainerReport` (8344); `SQLite.get` (8349); `SQLite.prepare` (8349, 8352, 8353) | CORE |
| [packages/store/src/store.ts:11481](../../packages/store/src/store.ts#L11481) `Store/query` | `SQLite.iterate` (11481) | CORE |
| [packages/store/src/store.ts:11521](../../packages/store/src/store.ts#L11521) `Store/queryWithOriginsCurrent` | `SQLite.iterate` (11521); `SQLite.all` (11530, 11533); `SQLite.prepare` (11530, 11533) | CORE |
| [packages/store/src/store.ts:11273](../../packages/store/src/store.ts#L11273) `Store/readOnlyChecked` | `SQLite.prepare` (11273, 11277, 11286, 11291); `SQLite.all` (11277, 11286, 11291) | CORE |
| [packages/store/src/store.ts:3602](../../packages/store/src/store.ts#L3602) `Store/recompute` | `SQLite.prepare` (3602, 3606); `Store.sql` (3602, 3606); `SQLite.iterate` (3606); `Calculations.computeStoredStyled` (3607); `Calculations.value` (3607) | CORE |
| [packages/store/src/store.ts:2618](../../packages/store/src/store.ts#L2618) `Store/recordAsOf` | `SQLite.get` (2618, 2620); `SQLite.prepare` (2618, 2620, 2622, 2623); `Store.sql` (2618, 2620, 2622, 2623); `SQLite.all` (2622, 2623) | CORE |
| [packages/store/src/store.ts:2314](../../packages/store/src/store.ts#L2314) `Store/recordCount` | `SQLite.get` (2314); `SQLite.prepare` (2314); `Store.sql` (2314) | CORE |
| [packages/store/src/store.ts:2695](../../packages/store/src/store.ts#L2695) `Store/recordLife` | `SQLite.all` (2695); `SQLite.prepare` (2695); `Store.sql` (2695) | CORE |
| [packages/store/src/store.ts:5559](../../packages/store/src/store.ts#L5559) `Store/recordObjectUse` | `Store.sql` (5559) | CORE |
| [packages/store/src/store.ts:9977](../../packages/store/src/store.ts#L9977) `Store/recordViewable` | `Store.row` (9977) | GATED-STORE |
| [packages/store/src/store.ts:1514](../../packages/store/src/store.ts#L1514) `Store/recordedFormat` | `Store.sql` (1514) | CORE |
| [packages/store/src/store.ts:8640](../../packages/store/src/store.ts#L8640) `Store/recoverContainersOut` | `SQLite.prepare` (8640); `Store.sql` (8640); `SQLite.get` (8643) | CORE |
| [packages/store/src/store.ts:1617](../../packages/store/src/store.ts#L1617) `Store/recoverPendingExternalFiles` | `Store.sql` (1617, 1619, 1643, 1645); `SQLite.prepare` (1619); `SQLite.get` (1630) | CORE |
| [packages/store/src/store.ts:6057](../../packages/store/src/store.ts#L6057) `Store/recoveryCodesRemaining` | `SQLite.get` (6057); `SQLite.prepare` (6057); `Store.sql` (6057) | CORE |
| [packages/store/src/store.ts:11313](../../packages/store/src/store.ts#L11313) `Store/refreshDecimalSqlViews` | `SQLite.get` (11313); `SQLite.prepare` (11313) | CORE |
| [packages/store/src/store.ts:3771](../../packages/store/src/store.ts#L3771) `Store/refuseLookalikeAccount` | `SQLite.all` (3771); `SQLite.prepare` (3771); `Store.sql` (3771) | CORE |
| [packages/store/src/store.ts:5923](../../packages/store/src/store.ts#L5923) `Store/registerPasskey` | `SQLite.prepare` (5923); `Store.sql` (5923) | CORE |
| [packages/store/src/store.ts:3900](../../packages/store/src/store.ts#L3900) `Store/rejectPending` | `SQLite.get` (3900); `SQLite.prepare` (3900, 3902); `Store.sql` (3900, 3902) | CORE |
| [packages/store/src/store.ts:9203](../../packages/store/src/store.ts#L9203) `Store/relatedCriteria` | `SQLite.iterate` (9203); `SQLite.prepare` (9203); `Store.sql` (9203) | CORE |
| [packages/store/src/store.ts:9200](../../packages/store/src/store.ts#L9200) `Store/relatedCriteria/matched` | `relatedRows` (9200) | CORE |
| [packages/store/src/store.ts:7513](../../packages/store/src/store.ts#L7513) `Store/relatedValues` | `Calculations.globalValue` (7513); `Calculations.unstoredValue` (7515) | CORE |
| [packages/store/src/store.ts:5936](../../packages/store/src/store.ts#L5936) `Store/removePasskey` | `SQLite.get` (5936); `SQLite.prepare` (5936, 5937); `Store.sql` (5936, 5937) | CORE |
| [packages/store/src/store.ts:10452](../../packages/store/src/store.ts#L10452) `Store/restoreDeletedRowLocked` | `SQLite.get` (10452, 10457); `SQLite.prepare` (10452, 10453, 10457, 10467); `Store.sql` (10452, 10453, 10457, 10467); `SQLite.all` (10453) | CORE |
| [packages/store/src/store.ts:2653](../../packages/store/src/store.ts#L2653) `Store/restoreRecord` | `Store.recordAsOf` (2653); `SQLite.get` (2657); `SQLite.prepare` (2657, 2662, 2671, 2682); `Store.sql` (2657, 2662, 2671, 2682) | CORE |
| [packages/store/src/store.ts:2711](../../packages/store/src/store.ts#L2711) `Store/revertAuditEntry` | `SQLite.get` (2711); `SQLite.prepare` (2711); `Store.sql` (2711); `Store.canViewRecord` (2713); `Store.auditLog` (2716) | CORE |
| [packages/store/src/store.ts:5684](../../packages/store/src/store.ts#L5684) `Store/revokeApiToken` | `SQLite.prepare` (5684); `Store.sql` (5684) | CORE |
| [packages/store/src/store.ts:5207](../../packages/store/src/store.ts#L5207) `Store/revokeSignInCredentials` | `SQLite.prepare` (5207, 5208, 5209); `Store.sql` (5207, 5208, 5209) | AUTH |
| [packages/store/src/store.ts:9469](../../packages/store/src/store.ts#L9469) `Store/row` | `SQLite.get` (9469) | CORE |
| [packages/store/src/store.ts:11417](../../packages/store/src/store.ts#L11417) `Store/rowsOf` | `SQLite.iterate` (11417, 11426) | CORE |
| [packages/store/src/store.ts:6518](../../packages/store/src/store.ts#L6518) `Store/ruleOutcome` | `Calculations.context` (6518) | CORE |
| [packages/store/src/store.ts:9314](../../packages/store/src/store.ts#L9314) `Store/runningSummaryValues` | `Store.viewableIds` (9314); `rowsById` (9316); `Calculations.value` (9327, 9333); `Calculations.related` (9344) | GATED-STORE |
| [packages/store/src/store.ts:6143](../../packages/store/src/store.ts#L6143) `Store/savePrivilegeSet` | `SQLite.prepare` (6143, 6151); `Store.sql` (6143, 6151) | AUTH |
| [packages/store/src/store.ts:4135](../../packages/store/src/store.ts#L4135) `Store/saveScriptTest` | `SQLite.prepare` (4135); `Store.sql` (4135) | CORE |
| [packages/store/src/store.ts:6678](../../packages/store/src/store.ts#L6678) `Store/scopedTableSql` | `Store.viewableIds` (6678); `SQLite.all` (6681); `SQLite.prepare` (6681); `Store.sql` (6681) | GATED-STORE |
| [packages/store/src/store.ts:3340](../../packages/store/src/store.ts#L3340) `Store/scriptHistory` | `SQLite.all` (3340); `SQLite.prepare` (3340); `Store.sql` (3340) | CORE |
| [packages/store/src/store.ts:3013](../../packages/store/src/store.ts#L3013) `Store/securityChange` | `Store.sql` (3013, 3015); `SQLite.prepare` (3015) | CORE |
| [packages/store/src/store.ts:2577](../../packages/store/src/store.ts#L2577) `Store/securityEvents` | `Store.auditLog` (2577) | CORE |
| [packages/store/src/store.ts:5408](../../packages/store/src/store.ts#L5408) `Store/securityToken` | `SQLite.get` (5408); `SQLite.prepare` (5408); `Store.sql` (5408) | CORE |
| [packages/store/src/store.ts:11447](../../packages/store/src/store.ts#L11447) `Store/selectHeldCurrent` | `Store.sql` (11447, 11448, 11450); `SQLite.prepare` (11448) | CORE |
| [packages/store/src/store.ts:10757](../../packages/store/src/store.ts#L10757) `Store/selectIdsCurrent` | `Store.selectIds` (10757); `SQLite.all` (10763); `SQLite.prepare` (10763); `Store.sql` (10763) | GATED-STORE |
| [packages/store/src/store.ts:11437](../../packages/store/src/store.ts#L11437) `Store/selectIn` | `Store.select` (11437) | CORE |
| [packages/store/src/store.ts:1980](../../packages/store/src/store.ts#L1980) `Store/selfContainedCopy` | `Store.sql` (1980); `SQLite.all` (1985); `SQLite.prepare` (1985, 1987, 1988, 1989) | CORE |
| [packages/store/src/store.ts:5186](../../packages/store/src/store.ts#L5186) `Store/setAccountActive` | `SQLite.prepare` (5186, 5194, 5195); `Store.sql` (5186, 5194, 5195) | AUTH |
| [packages/store/src/store.ts:5427](../../packages/store/src/store.ts#L5427) `Store/setAccountLocalOnly` | `SQLite.prepare` (5427); `Store.sql` (5427) | CORE |
| [packages/store/src/store.ts:6299](../../packages/store/src/store.ts#L6299) `Store/setAccountPrivilegeSet` | `SQLite.get` (6299); `SQLite.prepare` (6299, 6302, 6306); `Store.sql` (6299, 6302, 6306) | AUTH |
| [packages/store/src/store.ts:5436](../../packages/store/src/store.ts#L5436) `Store/setAccountRequire2fa` | `SQLite.prepare` (5436); `Store.sql` (5436) | CORE |
| [packages/store/src/store.ts:3801](../../packages/store/src/store.ts#L3801) `Store/setAgentAccount` | `SQLite.get` (3801); `SQLite.prepare` (3801, 3807); `Store.sql` (3801, 3807) | CORE |
| [packages/store/src/store.ts:4179](../../packages/store/src/store.ts#L4179) `Store/setAiAllowed` | `SQLite.prepare` (4179); `Store.sql` (4179) | CORE |
| [packages/store/src/store.ts:4262](../../packages/store/src/store.ts#L4262) `Store/setAiPolicy` | `SQLite.prepare` (4262); `Store.sql` (4262) | CORE |
| [packages/store/src/store.ts:6944](../../packages/store/src/store.ts#L6944) `Store/setAllowBlankPasswordFromLan` | `SQLite.prepare` (6944); `Store.sql` (6944) | CORE |
| [packages/store/src/store.ts:2813](../../packages/store/src/store.ts#L2813) `Store/setAuditSettings` | `SQLite.prepare` (2813); `Store.sql` (2813) | CORE |
| [packages/store/src/store.ts:8859](../../packages/store/src/store.ts#L8859) `Store/setContainer` | `Store.sql` (8859); `Store.row` (8865) | CORE |
| [packages/store/src/store.ts:3753](../../packages/store/src/store.ts#L3753) `Store/setExternalAccount` | `SQLite.get` (3753); `SQLite.prepare` (3753, 3758); `Store.sql` (3753, 3758) | CORE |
| [packages/store/src/store.ts:4885](../../packages/store/src/store.ts#L4885) `Store/setMustChangePassword` | `SQLite.prepare` (4885); `Store.sql` (4885) | CORE |
| [packages/store/src/store.ts:4076](../../packages/store/src/store.ts#L4076) `Store/setPasswordPolicy` | `SQLite.prepare` (4076); `Store.sql` (4076) | CORE |
| [packages/store/src/store.ts:1482](../../packages/store/src/store.ts#L1482) `Store/setPersistentData` | `SQLite.prepare` (1482, 1486); `Store.sql` (1482, 1486) | CORE |
| [packages/store/src/store.ts:4282](../../packages/store/src/store.ts#L4282) `Store/setPiiIsolation` | `SQLite.prepare` (4282); `Store.sql` (4282) | CORE |
| [packages/store/src/store.ts:4112](../../packages/store/src/store.ts#L4112) `Store/setRequireTotpForFullAccess` | `SQLite.prepare` (4112); `Store.sql` (4112) | CORE |
| [packages/store/src/store.ts:4194](../../packages/store/src/store.ts#L4194) `Store/setScriptNetwork` | `SQLite.prepare` (4194); `Store.sql` (4194) | CORE |
| [packages/store/src/store.ts:4251](../../packages/store/src/store.ts#L4251) `Store/setSqlRequiresFmxdbc` | `SQLite.prepare` (4251); `Store.sql` (4251) | CORE |
| [packages/store/src/store.ts:9898](../../packages/store/src/store.ts#L9898) `Store/setStoredCalcValues` | `SQLite.prepare` (9898, 9899); `Store.sql` (9898, 9899); `SQLite.get` (9903) | CORE |
| [packages/store/src/store.ts:8962](../../packages/store/src/store.ts#L8962) `Store/setUserPref` | `Store.sql` (8962, 8963, 8964); `SQLite.prepare` (8963, 8964) | CORE |
| [packages/store/src/store.ts:4235](../../packages/store/src/store.ts#L4235) `Store/setWebViewerHosts` | `SQLite.prepare` (4235); `Store.sql` (4235) | CORE |
| [packages/store/src/store.ts:5361](../../packages/store/src/store.ts#L5361) `Store/settleSignIns` | `SQLite.all` (5361, 5367); `SQLite.prepare` (5361, 5367, 5373, 5377, 5379); `Store.sql` (5361, 5367, 5373, 5377, 5379) | AUTH |
| [packages/store/src/store.ts:2111](../../packages/store/src/store.ts#L2111) `Store/shareResults` | `Store.sql` (2111) | CORE |
| [packages/store/src/store.ts:1544](../../packages/store/src/store.ts#L1544) `Store/shipWal` | `Store.sql` (1544) | CORE |
| [packages/store/src/store.ts:5308](../../packages/store/src/store.ts#L5308) `Store/signInBase` | `SQLite.get` (5308); `SQLite.prepare` (5308); `Store.sql` (5308) | AUTH |
| [packages/store/src/store.ts:5310](../../packages/store/src/store.ts#L5310) `Store/signInBase/identity` | `SQLite.get` (5310); `SQLite.prepare` (5310); `Store.sql` (5310) | AUTH |
| [packages/store/src/store.ts:5297](../../packages/store/src/store.ts#L5297) `Store/signInMark` | `SQLite.prepare` (5297); `Store.sql` (5297) | AUTH |
| [packages/store/src/store.ts:11055](../../packages/store/src/store.ts#L11055) `Store/sortIdsCurrentProgress` | `Store.sortIds` (11055); `Store.sortIdsProgress` (11055); `SQLite.all` (11068); `SQLite.prepare` (11068, 11143); `Store.sql` (11068, 11143); `Store.valueListItems` (11076); `rowsById` (11088); `Calculations.globalValue` (11091); `Calculations.unstoredValue` (11092); `Calculations.related` (11098); `SQLite.iterate` (11143) | GATED-STORE |
| [packages/store/src/store.ts:9128](../../packages/store/src/store.ts#L9128) `Store/sortedPage` | `SQLite.iterate` (9128); `SQLite.prepare` (9128, 9143); `Store.sql` (9128, 9143); `SQLite.all` (9143) | CORE |
| [packages/store/src/store.ts:11229](../../packages/store/src/store.ts#L11229) `Store/storedFileId` | `SQLite.get` (11229); `SQLite.prepare` (11229) | CORE |
| [packages/store/src/store.ts:9276](../../packages/store/src/store.ts#L9276) `Store/summaries` | `Calculations.wholeTable` (9276); `Calculations.collect` (9296, 9301) | CORE |
| [packages/store/src/store.ts:9292](../../packages/store/src/store.ts#L9292) `Store/summaries/recs` | `SQLite.iterate` (9292); `SQLite.prepare` (9292); `Store.sql` (9292) | CORE |
| [packages/store/src/store.ts:5874](../../packages/store/src/store.ts#L5874) `Store/takeWebauthnChallenge` | `SQLite.get` (5874); `SQLite.prepare` (5874, 5878); `Store.sql` (5874, 5878) | CORE |
| [packages/store/src/store.ts:9015](../../packages/store/src/store.ts#L9015) `Store/timeFind` | `Store.query` (9015) | CORE |
| [packages/store/src/store.ts:9029](../../packages/store/src/store.ts#L9029) `Store/reportFind` | `Store.query` (9029, 9031, 9032); `Store.recordCount` (9034) | CORE |
| [packages/store/src/store.ts:7450](../../packages/store/src/store.ts#L7450) `Store/toRecord` | `Calculations.value` (7450, 7460); `Calculations.globalValue` (7454); `Calculations.unstoredStyled` (7459) | CORE |
| [packages/store/src/store.ts:5758](../../packages/store/src/store.ts#L5758) `Store/totpAccounts` | `SQLite.all` (5758); `SQLite.prepare` (5758); `Store.sql` (5758) | CORE |
| [packages/store/src/store.ts:1556](../../packages/store/src/store.ts#L1556) `Store/trial` | `Store.sql` (1556) | CORE |
| [packages/store/src/store.ts:1561](../../packages/store/src/store.ts#L1561) `Store/trial/undo` | `Store.sql` (1561) | CORE |
| [packages/store/src/store.ts:11185](../../packages/store/src/store.ts#L11185) `Store/truncate/run` | `Store.sql` (11185, 11187, 11194, 11196, 11198, 11199); `SQLite.prepare` (11187, 11194); `SQLite.all` (11189) | CORE |
| [packages/store/src/store.ts:3700](../../packages/store/src/store.ts#L3700) `Store/unmigratedAccounts` | `SQLite.all` (3700); `SQLite.prepare` (3700); `Store.sql` (3700) | CORE |
| [packages/store/src/store.ts:4791](../../packages/store/src/store.ts#L4791) `Store/unusedAccess` | `SQLite.get` (4791); `SQLite.prepare` (4791, 4800); `Store.sql` (4791, 4800); `SQLite.all` (4800) | CORE |
| [packages/store/src/store.ts:4839](../../packages/store/src/store.ts#L4839) `Store/unusedObjects` | `SQLite.get` (4839); `SQLite.prepare` (4839, 4842); `Store.sql` (4839, 4842); `SQLite.all` (4842) | CORE |
| [packages/store/src/store.ts:5998](../../packages/store/src/store.ts#L5998) `Store/unusedRecoveryHashes` | `SQLite.all` (5998); `SQLite.prepare` (5998); `Store.sql` (5998) | CORE |
| [packages/store/src/store.ts:4621](../../packages/store/src/store.ts#L4621) `Store/unusualAccess` | `Store.auditLog` (4621, 4687) | CORE |
| [packages/store/src/store.ts:9719](../../packages/store/src/store.ts#L9719) `Store/update` | `Store.row` (9719); `Store.sql` (9750, 9751, 9790, 9793) | CORE |
| [packages/store/src/store.ts:9753](../../packages/store/src/store.ts#L9753) `Store/update/undo` | `Store.sql` (9753) | CORE |
| [packages/store/src/store.ts:10183](../../packages/store/src/store.ts#L10183) `Store/updatePortals` | `Store.row` (10183, 10219); `relatedRows` (10220) | CORE |
| [packages/store/src/store.ts:10193](../../packages/store/src/store.ts#L10193) `Store/updatePortals/portal/related` | `relatedIdList` (10193) | CORE |
| [packages/store/src/store.ts:10165](../../packages/store/src/store.ts#L10165) `Store/updateRelated` | `relatedRows` (10165) | CORE |
| [packages/store/src/store.ts:4877](../../packages/store/src/store.ts#L4877) `Store/usageCounting` | `SQLite.get` (4877); `SQLite.prepare` (4877); `Store.sql` (4877) | CORE |
| [packages/store/src/store.ts:8953](../../packages/store/src/store.ts#L8953) `Store/userPrefs` | `SQLite.all` (8953); `SQLite.prepare` (8953); `Store.sql` (8953) | CORE |
| [packages/store/src/store.ts:7835](../../packages/store/src/store.ts#L7835) `Store/valueListItemsCurrent` | `Store.valueListItems` (7835); `Store.get` (7849); `relatedRows` (7850); `Store.row` (7850); `SQLite.iterate` (7852); `SQLite.prepare` (7852); `Store.sql` (7852); `Calculations.related` (7862); `Calculations.value` (7866, 7867) | GATED-STORE |
| [packages/store/src/store.ts:10374](../../packages/store/src/store.ts#L10374) `Store/vaultHeld` | `SQLite.get` (10374); `SQLite.prepare` (10374); `Store.sql` (10374) | CORE |
| [packages/store/src/store.ts:5787](../../packages/store/src/store.ts#L5787) `Store/verifyTotp` | `SQLite.get` (5787); `SQLite.prepare` (5787, 5794); `Store.sql` (5787, 5794) | CORE |
| [packages/store/src/store.ts:2247](../../packages/store/src/store.ts#L2247) `Store/versionNumber` | `SQLite.get` (2247); `SQLite.prepare` (2247); `Store.sql` (2247) | CORE |
| [packages/store/src/store.ts:2122](../../packages/store/src/store.ts#L2122) `Store/versionTriggers` | `SQLite.get` (2122); `SQLite.prepare` (2122, 2127, 2128); `Store.sql` (2122, 2127, 2128, 2145, 2147, 2148, 2150); `SQLite.all` (2127, 2128) | CORE |
| [packages/store/src/store.ts:2090](../../packages/store/src/store.ts#L2090) `Store/warmSummariesCurrent` | `Calculations.wholeTable` (2090) | CORE |
| [packages/store/src/store.ts:4217](../../packages/store/src/store.ts#L4217) `Store/webViewerChecked` | `SQLite.get` (4217); `SQLite.prepare` (4217); `Store.sql` (4217) | CORE |
| [packages/store/src/store.ts:1848](../../packages/store/src/store.ts#L1848) `Store/withWriteTransaction` | `Store.sql` (1848, 1860, 1866, 1868, 1868) | CORE |
| [packages/store/src/store.ts:7385](../../packages/store/src/store.ts#L7385) `Store/wordIndex` | `Store.sql` (7385, 7393, 7398); `Store.recordCount` (7397); `SQLite.get` (7398); `SQLite.prepare` (7398) | CORE |
| [packages/store/src/store.ts:8533](../../packages/store/src/store.ts#L8533) `Store/writeExternalFile` | `Store.evaluateEach` (8533); `SQLite.prepare` (8556); `Store.sql` (8556) | CORE |
| [packages/store/src/store.ts:8557](../../packages/store/src/store.ts#L8557) `Store/writeExternalFile/taken` | `SQLite.get` (8557) | CORE |
| [packages/store/src/store.ts:5617](../../packages/store/src/store.ts#L5617) `Store/writeObjectUseRows` | `SQLite.prepare` (5617, 5618, 5623); `Store.sql` (5617, 5618, 5623) | CORE |
| [packages/store/src/store.ts:2302](../../packages/store/src/store.ts#L2302) `Store/writeToken` | `SQLite.get` (2302); `SQLite.prepare` (2302); `Store.sql` (2302) | CORE |
| [packages/store/src/store.ts:5589](../../packages/store/src/store.ts#L5589) `Store/writeUsage` | `Store.sql` (5589, 5590, 5592, 5596, 5598) | CORE |
| [packages/store/src/store.ts:5605](../../packages/store/src/store.ts#L5605) `Store/writeUsageRows` | `SQLite.prepare` (5605, 5606, 5612); `Store.sql` (5605, 5606, 5612) | CORE |
| [packages/store/src/store.ts:7106](../../packages/store/src/store.ts#L7106) `Store/design` | `SQLite.get` (7106) | CORE |
| [packages/store/src/store.ts:7128](../../packages/store/src/store.ts#L7128) `Store/themes` | `SQLite.get` (7128) | CORE |
| [packages/store/src/store.ts:5958](../../packages/store/src/store.ts#L5958) `Store/verifyPasskeyCredential` | `SQLite.get` (5958); `SQLite.prepare` (5958, 5970); `Store.sql` (5958, 5970) | CORE |
| [packages/store/src/store.ts:6915](../../packages/store/src/store.ts#L6915) `Store/passwordState` | `SQLite.get` (6915); `SQLite.prepare` (6915); `Store.sql` (6915) | CORE |
| [packages/store/src/store.ts:10318](../../packages/store/src/store.ts#L10318) `Store/deleteVisibility` | `Store.canViewRecord` (10318) | CORE |
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
| [packages/store/src/cross-file.ts:58](../../packages/store/src/cross-file.ts#L58) `CrossFileProofs/read` | `SQLite.get` (58); `SQLite.prepare` (58) | AUTH |
| [packages/store/src/cross-file.ts:115](../../packages/store/src/cross-file.ts#L115) `CrossFileProofs/save` | `SQLite.prepare` (115) | AUTH |
| [packages/store/src/store.ts:3959](../../packages/store/src/store.ts#L3959) `Store/setPasswordOnly` | `SQLite.get` (3959); `SQLite.prepare` (3959, 3965, 3974, 3981, 3982, 3983); `Store.sql` (3959, 3965, 3974, 3981, 3982, 3983) | AUTH |
| [packages/store/src/store.ts:4006](../../packages/store/src/store.ts#L4006) `Store/createAccountOnly` | `SQLite.get` (4006); `SQLite.prepare` (4006, 4010, 4016, 4021, 4026); `Store.sql` (4006, 4010, 4016, 4021, 4026) | CORE |
| [packages/store/src/store.ts:6997](../../packages/store/src/store.ts#L6997) `Store/crossFileBusy` | `Store.sql` (6997) | AUTH |
| [packages/store/src/store.ts:6969](../../packages/store/src/store.ts#L6969) `Store/crossFileHash` | `SQLite.get` (6969); `SQLite.prepare` (6969); `Store.sql` (6969) | AUTH |
<!-- end generated read-gate inventory -->
