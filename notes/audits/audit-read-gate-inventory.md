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
| [packages/store/src/reconvert.ts:330](../../packages/store/src/reconvert.ts#L330) `carryImages` | `SQLite.all` (330, 332); `SQLite.prepare` (330, 332, 333) | OPERATOR |
| [packages/store/src/reconvert.ts:293](../../packages/store/src/reconvert.ts#L293) `carryRecords` | `SQLite.prepare` (293, 296, 297, 307, 313, 314); `SQLite.all` (296, 300, 313) | OPERATOR |
| [packages/store/src/reconvert.ts:339](../../packages/store/src/reconvert.ts#L339) `carrySettings` | `SQLite.all` (339, 343, 351); `SQLite.prepare` (339, 343, 351, 352, 356); `SQLite.get` (356) | OPERATOR |
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
| [packages/store/src/store.ts:5020](../../packages/store/src/store.ts#L5020) `Store/accountIdentityId` | `SQLite.get` (5020, 5026); `SQLite.prepare` (5020, 5025, 5026); `Store.sql` (5020, 5025, 5026) | CORE |
| [packages/store/src/store.ts:5014](../../packages/store/src/store.ts#L5014) `Store/accountIdentityIdIfSet` | `SQLite.get` (5014); `SQLite.prepare` (5014); `Store.sql` (5014) | CORE |
| [packages/store/src/store.ts:4976](../../packages/store/src/store.ts#L4976) `Store/accountInactive` | `SQLite.get` (4976); `SQLite.prepare` (4976); `Store.sql` (4976) | CORE |
| [packages/store/src/store.ts:5170](../../packages/store/src/store.ts#L5170) `Store/accountLocalOnly` | `SQLite.get` (5170); `SQLite.prepare` (5170); `Store.sql` (5170) | CORE |
| [packages/store/src/store.ts:6039](../../packages/store/src/store.ts#L6039) `Store/accountPrivilegeSet` | `SQLite.get` (6039); `SQLite.prepare` (6039); `Store.sql` (6039) | CORE |
| [packages/store/src/store.ts:5175](../../packages/store/src/store.ts#L5175) `Store/accountRequires2fa` | `SQLite.get` (5175); `SQLite.prepare` (5175); `Store.sql` (5175) | CORE |
| [packages/store/src/store.ts:5395](../../packages/store/src/store.ts#L5395) `Store/accountUsage` | `SQLite.get` (5395); `SQLite.prepare` (5395, 5396); `Store.sql` (5395, 5396); `SQLite.all` (5396); `Store.auditLog` (5412) | CORE |
| [packages/store/src/store.ts:3459](../../packages/store/src/store.ts#L3459) `Store/accounts` | `SQLite.all` (3459); `SQLite.prepare` (3459); `Store.sql` (3459) | CORE |
| [packages/store/src/store.ts:3455](../../packages/store/src/store.ts#L3455) `Store/accountsSharingLockout` | `SQLite.all` (3455); `SQLite.prepare` (3455); `Store.sql` (3455) | CORE |
| [packages/store/src/store.ts:8123](../../packages/store/src/store.ts#L8123) `Store/addContainer` | `SQLite.all` (8123); `SQLite.prepare` (8123, 8128, 8142, 8146, 8147); `Store.sql` (8123, 8128, 8142, 8144, 8146, 8147, 8149, 8152); `SQLite.get` (8133); `Store.containerRange` (8135) | CORE |
| [packages/store/src/store.ts:8169](../../packages/store/src/store.ts#L8169) `Store/addExternalContainer` | `SQLite.prepare` (8169); `Store.sql` (8169) | CORE |
| [packages/store/src/store.ts:8625](../../packages/store/src/store.ts#L8625) `Store/addFieldIndex` | `Store.sql` (8625) | CORE |
| [packages/store/src/store.ts:6829](../../packages/store/src/store.ts#L6829) `Store/addImage` | `Store.sql` (6829, 6830); `SQLite.prepare` (6830) | CORE |
| [packages/store/src/store.ts:6089](../../packages/store/src/store.ts#L6089) `Store/addProvisionedAccount` | `SQLite.get` (6089); `SQLite.prepare` (6089, 6093); `Store.sql` (6089, 6093) | CORE |
| [packages/store/src/store.ts:7248](../../packages/store/src/store.ts#L7248) `Store/addRelated` | `relatedRows` (7248); `rowsById` (7281); `firstRelatedEach` (7304) | CORE |
| [packages/store/src/store.ts:3477](../../packages/store/src/store.ts#L3477) `Store/agentNeedsApproval` | `SQLite.get` (3477); `SQLite.prepare` (3477); `Store.sql` (3477) | CORE |
| [packages/store/src/store.ts:6303](../../packages/store/src/store.ts#L6303) `Store/allowedIds` | `SQLite.iterate` (6303); `SQLite.prepare` (6303); `Store.sql` (6303) | CORE |
| [packages/store/src/store.ts:5452](../../packages/store/src/store.ts#L5452) `Store/apiToken` | `SQLite.get` (5452); `SQLite.prepare` (5452, 5470); `Store.sql` (5452, 5470) | CORE |
| [packages/store/src/store.ts:5428](../../packages/store/src/store.ts#L5428) `Store/apiTokens` | `SQLite.all` (5428); `SQLite.prepare` (5428); `Store.sql` (5428) | CORE |
| [packages/store/src/store.ts:2930](../../packages/store/src/store.ts#L2930) `Store/appendSecurityRow` | `Store.sql` (2930) | CORE |
| [packages/store/src/store.ts:3817](../../packages/store/src/store.ts#L3817) `Store/appendSecurityEvent` | `Store.sql` (3817) | CORE |
| [packages/store/src/store.ts:4822](../../packages/store/src/store.ts#L4822) `Store/applyAccountImport` | `Store.sql` (4822, 4830, 4859); `SQLite.get` (4830); `SQLite.prepare` (4830, 4859) | CORE |
| [packages/store/src/store.ts:2264](../../packages/store/src/store.ts#L2264) `Store/applyDesign` | `Store.sql` (2264, 2265, 2278, 2281, 2286, 2302, 2305, 2305); `SQLite.prepare` (2281, 2286) | CORE |
| [packages/store/src/store.ts:3673](../../packages/store/src/store.ts#L3673) `Store/approvePending` | `SQLite.get` (3673); `SQLite.prepare` (3673, 3684); `Store.sql` (3673, 3684) | CORE |
| [packages/store/src/store.ts:2725](../../packages/store/src/store.ts#L2725) `Store/audit` | `Store.sql` (2725) | CORE |
| [packages/store/src/store.ts:2366](../../packages/store/src/store.ts#L2366) `Store/auditLog` | `SQLite.all` (2366); `SQLite.prepare` (2366); `Store.sql` (2366) | CORE |
| [packages/store/src/store.ts:1872](../../packages/store/src/store.ts#L1872) `Store/backup` | `Store.sql` (1872) | CORE |
| [packages/store/src/store.ts:3483](../../packages/store/src/store.ts#L3483) `Store/blankPasswordAccounts` | `SQLite.all` (3483); `SQLite.prepare` (3483); `Store.sql` (3483) | CORE |
| [packages/store/src/store.ts:9206](../../packages/store/src/store.ts#L9206) `Store/canView` | `Store.canView` (9206); `Store.row` (9207) | GATED-STORE |
| [packages/store/src/store.ts:9188](../../packages/store/src/store.ts#L9188) `Store/canViewRecord` | `SQLite.get` (9188); `SQLite.prepare` (9188); `Store.sql` (9188) | GATED-STORE |
| [packages/store/src/store.ts:4751](../../packages/store/src/store.ts#L4751) `Store/canonicalAccount` | `SQLite.all` (4751); `SQLite.prepare` (4751); `Store.sql` (4751) | CORE |
| [packages/store/src/store.ts:10265](../../packages/store/src/store.ts#L10265) `Store/cascadeDelete` | `relatedRows` (10265) | CORE |
| [packages/store/src/store.ts:2091](../../packages/store/src/store.ts#L2091) `Store/changeOne` | `Store.sql` (2091, 2093) | CORE |
| [packages/store/src/store.ts:2094](../../packages/store/src/store.ts#L2094) `Store/changeOne/read` | `SQLite.get` (2094); `SQLite.prepare` (2094); `Store.sql` (2094) | CORE |
| [packages/store/src/store.ts:8504](../../packages/store/src/store.ts#L8504) `Store/checkContainerWrite` | `Store.row` (8504) | CORE |
| [packages/store/src/store.ts:9918](../../packages/store/src/store.ts#L9918) `Store/checkEditable` | `Store.row` (9918) | CORE |
| [packages/store/src/store.ts:1466](../../packages/store/src/store.ts#L1466) `Store/checkpoint` | `SQLite.get` (1466); `SQLite.prepare` (1466); `Store.sql` (1466) | CORE |
| [packages/store/src/store.ts:6075](../../packages/store/src/store.ts#L6075) `Store/clearAccountPrivilegeSet` | `SQLite.prepare` (6075); `Store.sql` (6075) | CORE |
| [packages/store/src/store.ts:1488](../../packages/store/src/store.ts#L1488) `Store/close` | `Store.sql` (1488) | CORE |
| [packages/store/src/store.ts:8472](../../packages/store/src/store.ts#L8472) `Store/compactFile` | `Store.sql` (8472, 8473, 8475) | CORE |
| [packages/store/src/store.ts:10389](../../packages/store/src/store.ts#L10389) `Store/computeValuesCurrent` | `Store.computeValues` (10389); `Store.sql` (10395, 10399); `SQLite.all` (10399); `SQLite.prepare` (10399) | GATED-STORE |
| [packages/store/src/store.ts:8857](../../packages/store/src/store.ts#L8857) `Store/computedRows` | `Store.sql` (8857, 8860, 8861, 8862, 8864, 8874, 8875, 8876, 8879); `SQLite.prepare` (8860, 8862, 8864, 8874); `SQLite.iterate` (8864); `Calculations.globalValue` (8867); `Calculations.unstoredValue` (8868); `Calculations.related` (8871); `SQLite.all` (8874) | CORE |
| [packages/store/src/store.ts:5497](../../packages/store/src/store.ts#L5497) `Store/confirmTotp` | `SQLite.get` (5497); `SQLite.prepare` (5497, 5499); `Store.sql` (5497, 5499) | CORE |
| [packages/store/src/store.ts:1134](../../packages/store/src/store.ts#L1134) `Store/constructor` | `Store.sql` (1134, 1136, 1138, 1139, 1143, 1147, 1148, 1159, 1164, 1169, 1170, 1174, 1175, 1176, 1183, 1187, 1191, 1192, 1193, 1198, 1202, 1205, 1206, 1208, 1209, 1212, 1213, 1217, 1218, 1222, 1223, 1226, 1228, 1231, 1232, 1236, 1237, 1241, 1242, 1245, 1246, 1247, 1250, 1251, 1254, 1255, 1257, 1257, 1258, 1258, 1259, 1262, 1266, 1268, 1271, 1272, 1273, 1276, 1277, 1279, 1281, 1282, 1286, 1287, 1289, 1301, 1303, 1304, 1305, 1305, 1309, 1310); `SQLite.get` (1138); `SQLite.prepare` (1138, 1205, 1206, 1209, 1212, 1217, 1222, 1231, 1236, 1241, 1250, 1254, 1257, 1258, 1276, 1281, 1286); `SQLite.all` (1205, 1212, 1217, 1222, 1231, 1236, 1241, 1250, 1254, 1257, 1258, 1276, 1281, 1286) | CORE |
| [packages/store/src/store.ts:5855](../../packages/store/src/store.ts#L5855) `Store/consumeRecoveryCode` | `SQLite.prepare` (5855); `Store.sql` (5855) | CORE |
| [packages/store/src/store.ts:8047](../../packages/store/src/store.ts#L8047) `Store/container` | `SQLite.get` (8047); `SQLite.prepare` (8047, 8056); `Store.sql` (8047, 8056); `SQLite.all` (8056) | CORE |
| [packages/store/src/store.ts:8481](../../packages/store/src/store.ts#L8481) `Store/containerId` | `Store.containerId` (8481); `Store.row` (8482) | CORE |
| [packages/store/src/store.ts:8064](../../packages/store/src/store.ts#L8064) `Store/containerInfo` | `SQLite.get` (8064); `SQLite.prepare` (8064); `Store.sql` (8064) | CORE |
| [packages/store/src/store.ts:8028](../../packages/store/src/store.ts#L8028) `Store/containerIntact` | `SQLite.get` (8028); `SQLite.prepare` (8028); `Store.sql` (8028) | CORE |
| [packages/store/src/store.ts:7967](../../packages/store/src/store.ts#L7967) `Store/containerIntegrityReport` | `SQLite.all` (7967); `SQLite.prepare` (7967, 7978); `Store.sql` (7967, 7978); `SQLite.get` (7978) | CORE |
| [packages/store/src/store.ts:8042](../../packages/store/src/store.ts#L8042) `Store/containerMeta` | `SQLite.get` (8042); `SQLite.prepare` (8042); `Store.sql` (8042) | CORE |
| [packages/store/src/store.ts:8098](../../packages/store/src/store.ts#L8098) `Store/containerRange` | `SQLite.all` (8098); `SQLite.prepare` (8098, 8105); `Store.sql` (8098, 8105); `SQLite.get` (8105) | CORE |
| [packages/store/src/store.ts:7869](../../packages/store/src/store.ts#L7869) `Store/containerReferences` | `SQLite.all` (7869, 7888, 7890, 7896, 7909, 7920, 7934); `SQLite.prepare` (7869, 7888, 7890, 7896, 7909, 7920, 7932, 7934); `Store.sql` (7869, 7888, 7890, 7896, 7909, 7920, 7932, 7934); `SQLite.get` (7932); `Store.row` (7943) | CORE |
| [packages/store/src/store.ts:10369](../../packages/store/src/store.ts#L10369) `Store/countIds` | `Store.countIds` (10369); `SQLite.get` (10373); `SQLite.prepare` (10373); `Store.sql` (10373) | GATED-STORE |
| [packages/store/src/store.ts:9231](../../packages/store/src/store.ts#L9231) `Store/create` | `SQLite.get` (9231, 9237); `SQLite.prepare` (9231, 9237, 9250); `Store.sql` (9231, 9237, 9250) | CORE |
| [packages/store/src/store.ts:3789](../../packages/store/src/store.ts#L3789) `Store/createAccount` | `SQLite.get` (3789); `SQLite.prepare` (3789, 3793, 3799, 3804, 3809); `Store.sql` (3789, 3793, 3799, 3804, 3809) | CORE |
| [packages/store/src/store.ts:5228](../../packages/store/src/store.ts#L5228) `Store/createApiToken` | `SQLite.get` (5228, 5256); `SQLite.prepare` (5228, 5255, 5256, 5266); `Store.sql` (5228, 5255, 5256, 5266) | CORE |
| [packages/store/src/store.ts:4763](../../packages/store/src/store.ts#L4763) `Store/createLocalAccount` | `SQLite.prepare` (4763); `Store.sql` (4763) | CORE |
| [packages/store/src/store.ts:3449](../../packages/store/src/store.ts#L3449) `Store/credentialIdentity` | `SQLite.get` (3449); `SQLite.prepare` (3449); `Store.sql` (3449) | CORE |
| [packages/store/src/store.ts:5152](../../packages/store/src/store.ts#L5152) `Store/credentialStamp` | `SQLite.get` (5152); `SQLite.prepare` (5152); `Store.sql` (5152) | CORE |
| [packages/store/src/store.ts:1962](../../packages/store/src/store.ts#L1962) `Store/dataVersion` | `SQLite.get` (1962); `SQLite.prepare` (1962); `Store.sql` (1962) | CORE |
| [packages/store/src/store.ts:9961](../../packages/store/src/store.ts#L9961) `Store/delete` | `Store.row` (9961) | CORE |
| [packages/store/src/store.ts:9969](../../packages/store/src/store.ts#L9969) `Store/delete/run` | `SQLite.get` (9969); `SQLite.prepare` (9969, 9974); `Store.sql` (9969, 9974) | CORE |
| [packages/store/src/store.ts:4917](../../packages/store/src/store.ts#L4917) `Store/deleteAccount` | `SQLite.prepare` (4917, 4921, 4922, 4923, 4924, 4925, 4926, 4927, 4928, 4935, 4937, 4939, 4941, 4945); `Store.sql` (4917, 4921, 4922, 4923, 4924, 4925, 4926, 4927, 4928, 4935, 4937, 4939, 4941, 4945) | CORE |
| [packages/store/src/store.ts:5940](../../packages/store/src/store.ts#L5940) `Store/deletePrivilegeSet` | `SQLite.prepare` (5940); `Store.sql` (5940) | CORE |
| [packages/store/src/store.ts:3927](../../packages/store/src/store.ts#L3927) `Store/deleteScriptTest` | `SQLite.prepare` (3927); `Store.sql` (3927) | CORE |
| [packages/store/src/store.ts:3094](../../packages/store/src/store.ts#L3094) `Store/deletedRows` | `SQLite.get` (3094); `SQLite.prepare` (3094, 3096, 3096); `Store.sql` (3094, 3096, 3096); `SQLite.all` (3096, 3096) | CORE |
| [packages/store/src/store.ts:3204](../../packages/store/src/store.ts#L3204) `Store/designEffect` | `Store.sql` (3204, 3209, 3214, 3219, 3222, 3228, 3239, 3240, 3242, 3255, 3256, 3259, 3261, 3267, 3268, 3269, 3274, 3276, 3280, 3283, 3284, 3286, 3289, 3295, 3297, 3304, 3305, 3307, 3308, 3309, 3310, 3317, 3318, 3320, 3320, 3322, 3323, 3324, 3328, 3332, 3334, 3372, 3374, 3376); `SQLite.get` (3239, 3255, 3267, 3268, 3280, 3284, 3320, 3328); `SQLite.prepare` (3239, 3240, 3255, 3256, 3267, 3268, 3274, 3276, 3280, 3284, 3295, 3297, 3310, 3317, 3318, 3320, 3322, 3324, 3328, 3332); `SQLite.all` (3317, 3318); `SQLite.iterate` (3322) | CORE |
| [packages/store/src/store.ts:3197](../../packages/store/src/store.ts#L3197) `Store/designEffect/renameExcluded` | `SQLite.prepare` (3197); `Store.sql` (3197) | CORE |
| [packages/store/src/store.ts:3181](../../packages/store/src/store.ts#L3181) `Store/designEffect/renameKey` | `SQLite.prepare` (3181); `Store.sql` (3181) | CORE |
| [packages/store/src/store.ts:3135](../../packages/store/src/store.ts#L3135) `Store/designHistory` | `SQLite.all` (3135); `SQLite.prepare` (3135); `Store.sql` (3135) | CORE |
| [packages/store/src/store.ts:5518](../../packages/store/src/store.ts#L5518) `Store/disableTotp` | `SQLite.prepare` (5518); `Store.sql` (5518) | CORE |
| [packages/store/src/store.ts:3384](../../packages/store/src/store.ts#L3384) `Store/dropColumnIndexes` | `SQLite.all` (3384, 3386); `SQLite.prepare` (3384, 3386); `Store.sql` (3384, 3386, 3387) | CORE |
| [packages/store/src/store.ts:8637](../../packages/store/src/store.ts#L8637) `Store/dropFieldIndex` | `SQLite.get` (8637); `SQLite.prepare` (8637); `Store.sql` (8637, 8638) | CORE |
| [packages/store/src/store.ts:9274](../../packages/store/src/store.ts#L9274) `Store/duplicate` | `Store.row` (9274); `SQLite.get` (9278); `SQLite.prepare` (9278, 9293); `Store.sql` (9278, 9293) | CORE |
| [packages/store/src/store.ts:8285](../../packages/store/src/store.ts#L8285) `Store/embeddedContainerCount` | `SQLite.prepare` (8285); `Store.sql` (8285); `SQLite.get` (8286) | CORE |
| [packages/store/src/store.ts:8271](../../packages/store/src/store.ts#L8271) `Store/embeddedContainers` | `SQLite.prepare` (8271, 8272); `Store.sql` (8271, 8272); `SQLite.all` (8272); `SQLite.get` (8276) | CORE |
| [packages/store/src/store.ts:3120](../../packages/store/src/store.ts#L3120) `Store/emptyDeleted` | `Store.sql` (3120, 3123, 3124, 3126, 3128); `SQLite.prepare` (3124) | CORE |
| [packages/store/src/store.ts:1838](../../packages/store/src/store.ts#L1838) `Store/endTransaction` | `Store.sql` (1838, 1841, 1841) | CORE |
| [packages/store/src/store.ts:5486](../../packages/store/src/store.ts#L5486) `Store/enrollTotp` | `SQLite.prepare` (5486); `Store.sql` (5486) | CORE |
| [packages/store/src/store.ts:3089](../../packages/store/src/store.ts#L3089) `Store/ensureDeleted` | `Store.sql` (3089) | CORE |
| [packages/store/src/store.ts:1320](../../packages/store/src/store.ts#L1320) `Store/ensureNativeIds` | `SQLite.all` (1320, 1332); `SQLite.prepare` (1320, 1323, 1331, 1332); `Store.sql` (1320, 1323, 1326, 1330, 1331, 1332, 1335, 1337) | CORE |
| [packages/store/src/store.ts:9615](../../packages/store/src/store.ts#L9615) `Store/evaluateCurrent` | `Store.row` (9615, 9615, 9616, 9616); `Calculations.context` (9621); `Store.get` (9622, 9624) | GATED-STORE |
| [packages/store/src/store.ts:9656](../../packages/store/src/store.ts#L9656) `Store/evaluateEachCurrent` | `Store.row` (9656, 9656, 9661); `Calculations.context` (9662); `Store.get` (9664) | GATED-STORE |
| [packages/store/src/store.ts:9718](../../packages/store/src/store.ts#L9718) `Store/evaluateRowsCurrent` | `Store.row` (9718, 9718, 9719, 9719) | GATED-STORE |
| [packages/store/src/store.ts:9697](../../packages/store/src/store.ts#L9697) `Store/evaluateRowsCurrent/each` | `Calculations.context` (9697); `Store.get` (9699) | GATED-STORE |
| [packages/store/src/store.ts:9733](../../packages/store/src/store.ts#L9733) `Store/evaluateRowsCurrent/found/[Symbol.iterator]` | `rowsById` (9733) | GATED-STORE |
| [packages/store/src/store.ts:9755](../../packages/store/src/store.ts#L9755) `Store/evaluateRowsCurrent/key` | `Calculations.context` (9755) | GATED-STORE |
| [packages/store/src/store.ts:3716](../../packages/store/src/store.ts#L3716) `Store/externalAccount` | `SQLite.all` (3716); `SQLite.prepare` (3716); `Store.sql` (3716) | CORE |
| [packages/store/src/store.ts:7790](../../packages/store/src/store.ts#L7790) `Store/externalContainerCheck` | `SQLite.all` (7790); `SQLite.prepare` (7790); `Store.sql` (7790) | CORE |
| [packages/store/src/store.ts:7797](../../packages/store/src/store.ts#L7797) `Store/externalContainerCount` | `SQLite.get` (7797); `SQLite.prepare` (7797); `Store.sql` (7797) | CORE |
| [packages/store/src/store.ts:7806](../../packages/store/src/store.ts#L7806) `Store/externalContainerReport` | `SQLite.all` (7806, 7819); `SQLite.prepare` (7806, 7819); `Store.sql` (7806, 7819) | CORE |
| [packages/store/src/store.ts:5002](../../packages/store/src/store.ts#L5002) `Store/externalIdentityId` | `SQLite.get` (5002, 5009); `SQLite.prepare` (5002, 5008, 5009); `Store.sql` (5002, 5008, 5009) | CORE |
| [packages/store/src/store.ts:8038](../../packages/store/src/store.ts#L8038) `Store/externalOf` | `SQLite.get` (8038); `SQLite.prepare` (8038); `Store.sql` (8038) | CORE |
| [packages/store/src/store.ts:2874](../../packages/store/src/store.ts#L2874) `Store/failureAuditRoom` | `SQLite.get` (2874); `SQLite.prepare` (2874); `Store.sql` (2874) | CORE |
| [packages/store/src/store.ts:7450](../../packages/store/src/store.ts#L7450) `Store/fieldIndexCurrent` | `SQLite.iterate` (7450); `SQLite.prepare` (7450, 7455); `Store.sql` (7450, 7455); `SQLite.all` (7455) | GATED-STORE |
| [packages/store/src/store.ts:8672](../../packages/store/src/store.ts#L8672) `Store/find` | `Store.find` (8672) | GATED-STORE |
| [packages/store/src/store.ts:9044](../../packages/store/src/store.ts#L9044) `Store/findCandidates` | `Store.query` (9044) | CORE |
| [packages/store/src/store.ts:8683](../../packages/store/src/store.ts#L8683) `Store/findHere` | `Store.query` (8683, 8688, 8690, 8704, 8706, 8717); `Store.recordCount` (8701); `SQLite.get` (8702, 8706); `SQLite.prepare` (8702, 8706, 8712, 8719, 8728); `Store.sql` (8702, 8706, 8712, 8719, 8728); `SQLite.all` (8712, 8719, 8728) | GATED-STORE |
| [packages/store/src/store.ts:8723](../../packages/store/src/store.ts#L8723) `Store/findHere/[Symbol.iterator]` | `SQLite.iterate` (8723); `SQLite.prepare` (8723); `Store.sql` (8723) | GATED-STORE |
| [packages/store/src/store.ts:10414](../../packages/store/src/store.ts#L10414) `Store/findIdsCurrent` | `Store.findIds` (10414) | GATED-STORE |
| [packages/store/src/store.ts:10420](../../packages/store/src/store.ts#L10420) `Store/findIdsHere` | `Store.query` (10420, 10425, 10427); `SQLite.iterate` (10438); `SQLite.prepare` (10438); `Store.sql` (10438) | GATED-STORE |
| [packages/store/src/store.ts:8988](../../packages/store/src/store.ts#L8988) `Store/findSource` | `Store.query` (8988); `SQLite.all` (8997, 9014); `SQLite.prepare` (8997, 9005, 9013); `Store.sql` (8997, 9002, 9005, 9010, 9013, 9027, 9029); `Calculations.globalValue` (9019); `Calculations.unstoredValue` (9020); `Calculations.related` (9024) | CORE |
| [packages/store/src/store.ts:2986](../../packages/store/src/store.ts#L2986) `Store/flushDeferredSecurity` | `Store.sql` (2986) | CORE |
| [packages/store/src/store.ts:10010](../../packages/store/src/store.ts#L10010) `Store/forgetStandInValues` | `Store.sql` (10010, 10031); `SQLite.prepare` (10031) | CORE |
| [packages/store/src/store.ts:4884](../../packages/store/src/store.ts#L4884) `Store/forgetStandIns` | `SQLite.prepare` (4884); `Store.sql` (4884) | CORE |
| [packages/store/src/store.ts:7332](../../packages/store/src/store.ts#L7332) `Store/foundSetPage` | `rowsById` (7332) | CORE |
| [packages/store/src/store.ts:7348](../../packages/store/src/store.ts#L7348) `Store/foundSetRowsCurrent` | `Store.viewableIds` (7348); `Store.row` (7364) | GATED-STORE |
| [packages/store/src/store.ts:3635](../../packages/store/src/store.ts#L3635) `Store/gateAgentWrite` | `SQLite.get` (3635); `SQLite.prepare` (3635, 3637); `Store.sql` (3635, 3637) | CORE |
| [packages/store/src/store.ts:5793](../../packages/store/src/store.ts#L5793) `Store/generateRecoveryCodes` | `SQLite.prepare` (5793, 5796); `Store.sql` (5793, 5796) | CORE |
| [packages/store/src/store.ts:9116](../../packages/store/src/store.ts#L9116) `Store/getCurrent` | `Store.get` (9116); `Store.row` (9117, 9117, 9131); `SQLite.all` (9134); `SQLite.prepare` (9134); `Store.sql` (9134) | GATED-STORE |
| [packages/store/src/store.ts:9154](../../packages/store/src/store.ts#L9154) `Store/getManyCurrent` | `Store.getMany` (9154); `SQLite.get` (9172); `SQLite.prepare` (9172); `Store.sql` (9172) | GATED-STORE |
| [packages/store/src/store.ts:9165](../../packages/store/src/store.ts#L9165) `Store/getManyCurrent/[Symbol.iterator]` | `rowsById` (9165) | GATED-STORE |
| [packages/store/src/store.ts:1367](../../packages/store/src/store.ts#L1367) `Store/grantFullAccessClients` | `SQLite.prepare` (1367); `Store.sql` (1367) | CORE |
| [packages/store/src/store.ts:10455](../../packages/store/src/store.ts#L10455) `Store/groupSummariesCurrent` | `Store.groupSummaries` (10455); `Store.viewableIds` (10460); `Calculations.collect` (10476); `rowsById` (10476, 10526); `Calculations.collector` (10498) | GATED-STORE |
| [packages/store/src/store.ts:10524](../../packages/store/src/store.ts#L10524) `Store/groupSummariesCurrent/flush` | `Calculations.collector` (10524) | GATED-STORE |
| [packages/store/src/store.ts:10488](../../packages/store/src/store.ts#L10488) `Store/groupSummariesCurrent/key` | `Calculations.value` (10488); `Calculations.related` (10490) | GATED-STORE |
| [packages/store/src/store.ts:1394](../../packages/store/src/store.ts#L1394) `Store/hasOwnPassword` | `SQLite.get` (1394); `SQLite.prepare` (1394); `Store.sql` (1394) | CORE |
| [packages/store/src/store.ts:5648](../../packages/store/src/store.ts#L5648) `Store/hasPasskey` | `SQLite.get` (5648); `SQLite.prepare` (5648); `Store.sql` (5648) | CORE |
| [packages/store/src/store.ts:1375](../../packages/store/src/store.ts#L1375) `Store/hasProvingPassword` | `SQLite.get` (1375); `SQLite.prepare` (1375); `Store.sql` (1375) | CORE |
| [packages/store/src/store.ts:8591](../../packages/store/src/store.ts#L8591) `Store/hasTable` | `SQLite.get` (8591); `SQLite.prepare` (8591); `Store.sql` (8591) | CORE |
| [packages/store/src/store.ts:5507](../../packages/store/src/store.ts#L5507) `Store/hasTotp` | `SQLite.get` (5507); `SQLite.prepare` (5507); `Store.sql` (5507) | CORE |
| [packages/store/src/store.ts:4981](../../packages/store/src/store.ts#L4981) `Store/identityAllowed` | `SQLite.get` (4981, 4987, 4993); `SQLite.prepare` (4981, 4987, 4993); `Store.sql` (4981, 4987, 4993) | CORE |
| [packages/store/src/store.ts:6806](../../packages/store/src/store.ts#L6806) `Store/image` | `SQLite.get` (6806); `SQLite.prepare` (6806); `Store.sql` (6806) | CORE |
| [packages/store/src/store.ts:6816](../../packages/store/src/store.ts#L6816) `Store/images` | `SQLite.all` (6816); `SQLite.prepare` (6816); `Store.sql` (6816) | CORE |
| [packages/store/src/store.ts:4728](../../packages/store/src/store.ts#L4728) `Store/importAccounts` | `SQLite.all` (4728); `SQLite.prepare` (4728); `Store.sql` (4728) | CORE |
| [packages/store/src/store.ts:1695](../../packages/store/src/store.ts#L1695) `Store/independentWindowWrite` | `SQLite.get` (1695); `SQLite.prepare` (1695, 1729); `Store.sql` (1695, 1704, 1724, 1729, 1732) | CORE |
| [packages/store/src/store.ts:8603](../../packages/store/src/store.ts#L8603) `Store/indexedFields` | `SQLite.all` (8603, 8604); `SQLite.prepare` (8603, 8604); `Store.sql` (8603, 8604) | CORE |
| [packages/store/src/store.ts:10822](../../packages/store/src/store.ts#L10822) `Store/internalRoots` | `SQLite.get` (10822); `SQLite.prepare` (10822, 10824); `SQLite.all` (10824) | CORE |
| [packages/store/src/store.ts:3471](../../packages/store/src/store.ts#L3471) `Store/isAgent` | `SQLite.get` (3471); `SQLite.prepare` (3471); `Store.sql` (3471) | CORE |
| [packages/store/src/store.ts:3574](../../packages/store/src/store.ts#L3574) `Store/isExternal` | `SQLite.get` (3574); `SQLite.prepare` (3574); `Store.sql` (3574) | CORE |
| [packages/store/src/store.ts:5562](../../packages/store/src/store.ts#L5562) `Store/issueWebauthnChallenge` | `SQLite.prepare` (5562, 5564, 5565, 5567); `Store.sql` (5562, 5564, 5565, 5567); `SQLite.get` (5564) | CORE |
| [packages/store/src/store.ts:10729](../../packages/store/src/store.ts#L10729) `Store/iterateCommitted` | `SQLite.iterate` (10729) | CORE |
| [packages/store/src/store.ts:1637](../../packages/store/src/store.ts#L1637) `Store/joinTransaction` | `Store.sql` (1637, 1638, 1640, 1642, 1648, 1650) | CORE |
| [packages/store/src/store.ts:10212](../../packages/store/src/store.ts#L10212) `Store/keyStepWork` | `Store.sql` (10212, 10218, 10222, 10224) | CORE |
| [packages/store/src/store.ts:6673](../../packages/store/src/store.ts#L6673) `Store/knownSharedAccount` | `SQLite.get` (6673); `SQLite.prepare` (6673); `Store.sql` (6673) | CORE |
| [packages/store/src/store.ts:4201](../../packages/store/src/store.ts#L4201) `Store/lastSignIns` | `Store.auditLog` (4201) | CORE |
| [packages/store/src/store.ts:6846](../../packages/store/src/store.ts#L6846) `Store/layout` | `SQLite.get` (6846); `SQLite.prepare` (6846); `Store.sql` (6846) | CORE |
| [packages/store/src/store.ts:3152](../../packages/store/src/store.ts#L3152) `Store/layoutHistory` | `SQLite.all` (3152); `SQLite.prepare` (3152); `Store.sql` (3152) | CORE |
| [packages/store/src/store.ts:6736](../../packages/store/src/store.ts#L6736) `Store/layouts` | `SQLite.all` (6736); `SQLite.prepare` (6736); `Store.sql` (6736) | CORE |
| [packages/store/src/store.ts:4501](../../packages/store/src/store.ts#L4501) `Store/leastPrivilege` | `SQLite.all` (4501); `SQLite.prepare` (4501); `Store.sql` (4501) | CORE |
| [packages/store/src/store.ts:5079](../../packages/store/src/store.ts#L5079) `Store/ledgerRow` | `SQLite.get` (5079, 5080); `SQLite.prepare` (5079, 5080); `Store.sql` (5079, 5080) | AUTH |
| [packages/store/src/store.ts:5091](../../packages/store/src/store.ts#L5091) `Store/ledgerWrite` | `Store.sql` (5091, 5092, 5094, 5096, 5099, 5099) | AUTH |
| [packages/store/src/store.ts:4811](../../packages/store/src/store.ts#L4811) `Store/limitAccountImport` | `SQLite.prepare` (4811, 4812, 4815); `Store.sql` (4811, 4812, 4815); `SQLite.get` (4812) | CORE |
| [packages/store/src/store.ts:3424](../../packages/store/src/store.ts#L3424) `Store/linkIdentity` | `SQLite.get` (3424); `SQLite.prepare` (3424); `Store.sql` (3424) | CORE |
| [packages/store/src/store.ts:3416](../../packages/store/src/store.ts#L3416) `Store/linkPrincipal` | `SQLite.get` (3416); `SQLite.prepare` (3416); `Store.sql` (3416) | CORE |
| [packages/store/src/store.ts:4087](../../packages/store/src/store.ts#L4087) `Store/markPiiField` | `SQLite.prepare` (4087); `Store.sql` (4087) | CORE |
| [packages/store/src/store.ts:7763](../../packages/store/src/store.ts#L7763) `Store/markRepeating` | `SQLite.prepare` (7763); `Store.sql` (7763) | CORE |
| [packages/store/src/store.ts:10662](../../packages/store/src/store.ts#L10662) `Store/matchIds` | `Store.matchIds` (10662); `SQLite.all` (10668); `SQLite.prepare` (10668); `Store.sql` (10668) | CORE |
| [packages/store/src/store.ts:1409](../../packages/store/src/store.ts#L1409) `Store/meta` | `SQLite.get` (1409); `SQLite.prepare` (1409); `Store.sql` (1409) | CORE |
| [packages/store/src/store.ts:989](../../packages/store/src/store.ts#L989) `Store/metadataVersions` | `SQLite.get` (989); `SQLite.prepare` (989); `Store.sql` (989) | CORE |
| [packages/store/src/store.ts:8400](../../packages/store/src/store.ts#L8400) `Store/moveContainersIn` | `Store.sql` (8400, 8406, 8408, 8409, 8410, 8411, 8431, 8436, 8436, 8447, 8450, 8453, 8460); `SQLite.prepare` (8408, 8409, 8410, 8411, 8447, 8453); `SQLite.get` (8413, 8447, 8453) | CORE |
| [packages/store/src/store.ts:8322](../../packages/store/src/store.ts#L8322) `Store/moveContainersOut` | `Store.sql` (8322, 8330, 8332, 8334, 8339, 8340, 8360, 8366, 8368, 8370, 8370, 8376, 8376, 8381, 8383, 8385, 8385, 8391); `SQLite.get` (8330); `SQLite.prepare` (8330, 8339, 8340); `Store.container` (8342) | CORE |
| [packages/store/src/store.ts:4682](../../packages/store/src/store.ts#L4682) `Store/mustChangePassword` | `SQLite.get` (4682); `SQLite.prepare` (4682); `Store.sql` (4682) | CORE |
| [packages/store/src/store.ts:1345](../../packages/store/src/store.ts#L1345) `Store/nativeIdGuards` | `Store.sql` (1345, 1346, 1348) | CORE |
| [packages/store/src/store.ts:5382](../../packages/store/src/store.ts#L5382) `Store/objectUseSince` | `SQLite.get` (5382); `SQLite.prepare` (5382); `Store.sql` (5382) | CORE |
| [packages/store/src/store.ts:8563](../../packages/store/src/store.ts#L8563) `Store/orderBy` | `Store.valueListItems` (8563) | CORE |
| [packages/store/src/store.ts:7955](../../packages/store/src/store.ts#L7955) `Store/orphanContainerReport` | `SQLite.all` (7955); `SQLite.prepare` (7955); `Store.sql` (7955) | CORE |
| [packages/store/src/store.ts:5614](../../packages/store/src/store.ts#L5614) `Store/passkeyAllowList` | `SQLite.all` (5614); `SQLite.prepare` (5614); `Store.sql` (5614) | CORE |
| [packages/store/src/store.ts:5653](../../packages/store/src/store.ts#L5653) `Store/passkeyIds` | `SQLite.all` (5653); `SQLite.prepare` (5653); `Store.sql` (5653) | CORE |
| [packages/store/src/store.ts:5641](../../packages/store/src/store.ts#L5641) `Store/passkeys` | `SQLite.all` (5641); `SQLite.prepare` (5641); `Store.sql` (5641) | CORE |
| [packages/store/src/store.ts:4721](../../packages/store/src/store.ts#L4721) `Store/passwordDaysRemaining` | `SQLite.get` (4721); `SQLite.prepare` (4721); `Store.sql` (4721) | CORE |
| [packages/store/src/store.ts:3659](../../packages/store/src/store.ts#L3659) `Store/pendingChanges` | `SQLite.all` (3659); `SQLite.prepare` (3659); `Store.sql` (3659) | CORE |
| [packages/store/src/store.ts:1427](../../packages/store/src/store.ts#L1427) `Store/persistentData` | `SQLite.get` (1427) | CORE |
| [packages/store/src/store.ts:1436](../../packages/store/src/store.ts#L1436) `Store/persistentDataIds` | `SQLite.all` (1436) | CORE |
| [packages/store/src/store.ts:1417](../../packages/store/src/store.ts#L1417) `Store/persistentTable` | `Store.sql` (1417) | CORE |
| [packages/store/src/store.ts:9903](../../packages/store/src/store.ts#L9903) `Store/portalContainerTarget` | `Store.row` (9903); `relatedIdList` (9905) | CORE |
| [packages/store/src/store.ts:7387](../../packages/store/src/store.ts#L7387) `Store/portalCountsCurrent` | `Store.canView` (7387); `Store.row` (7414) | GATED-STORE |
| [packages/store/src/store.ts:7625](../../packages/store/src/store.ts#L7625) `Store/portalRows` | `relatedRows` (7625); `relatedIdList` (7626); `Store.viewableIds` (7629); `rowsById` (7654, 7692); `Calculations.related` (7668) | CORE |
| [packages/store/src/store.ts:7636](../../packages/store/src/store.ts#L7636) `Store/portalRows/context` | `Calculations.context` (7636) | CORE |
| [packages/store/src/store.ts:7646](../../packages/store/src/store.ts#L7646) `Store/portalRows/valueOf` | `Calculations.value` (7646) | CORE |
| [packages/store/src/store.ts:2432](../../packages/store/src/store.ts#L2432) `Store/prepared` | `SQLite.prepare` (2432); `Store.sql` (2432) | CORE |
| [packages/store/src/store.ts:4793](../../packages/store/src/store.ts#L4793) `Store/previewAccountImport` | `Store.sql` (4793, 4794, 4803) | CORE |
| [packages/store/src/store.ts:6436](../../packages/store/src/store.ts#L6436) `Store/previewRecordRuleCurrent` | `SQLite.get` (6436); `SQLite.prepare` (6436, 6439); `Store.sql` (6436, 6439); `SQLite.all` (6439); `Calculations.context` (6445, 6461) | CORE |
| [packages/store/src/store.ts:9079](../../packages/store/src/store.ts#L9079) `Store/previewRow` | `Store.row` (9079) | CORE |
| [packages/store/src/store.ts:5868](../../packages/store/src/store.ts#L5868) `Store/privilegeSets` | `Store.sql` (5868) | CORE |
| [packages/store/src/store.ts:2643](../../packages/store/src/store.ts#L2643) `Store/pruneAudit` | `Store.sql` (2643, 2645, 2647); `SQLite.get` (2645); `SQLite.prepare` (2645) | CORE |
| [packages/store/src/store.ts:7990](../../packages/store/src/store.ts#L7990) `Store/purgeOrphanContainers` | `Store.sql` (7990, 7994, 8003, 8006, 8007, 8012, 8013, 8015, 8015); `Store.orphanContainerReport` (7998); `SQLite.get` (8003); `SQLite.prepare` (8003, 8006, 8007) | CORE |
| [packages/store/src/store.ts:10928](../../packages/store/src/store.ts#L10928) `Store/query` | `SQLite.iterate` (10928) | CORE |
| [packages/store/src/store.ts:10967](../../packages/store/src/store.ts#L10967) `Store/queryWithOriginsCurrent` | `SQLite.iterate` (10967); `SQLite.all` (10976, 10979); `SQLite.prepare` (10976, 10979) | CORE |
| [packages/store/src/store.ts:10763](../../packages/store/src/store.ts#L10763) `Store/readOnlyChecked` | `SQLite.prepare` (10763, 10767, 10776, 10781); `SQLite.all` (10767, 10776, 10781) | CORE |
| [packages/store/src/store.ts:3396](../../packages/store/src/store.ts#L3396) `Store/recompute` | `SQLite.prepare` (3396, 3400); `Store.sql` (3396, 3400); `SQLite.iterate` (3400); `Calculations.computeStoredStyled` (3401); `Calculations.value` (3401) | CORE |
| [packages/store/src/store.ts:2447](../../packages/store/src/store.ts#L2447) `Store/recordAsOf` | `SQLite.get` (2447, 2449); `SQLite.prepare` (2447, 2449, 2451, 2452); `Store.sql` (2447, 2449, 2451, 2452); `SQLite.all` (2451, 2452) | CORE |
| [packages/store/src/store.ts:2145](../../packages/store/src/store.ts#L2145) `Store/recordCount` | `SQLite.get` (2145); `SQLite.prepare` (2145); `Store.sql` (2145) | CORE |
| [packages/store/src/store.ts:5313](../../packages/store/src/store.ts#L5313) `Store/recordObjectUse` | `Store.sql` (5313) | CORE |
| [packages/store/src/store.ts:9605](../../packages/store/src/store.ts#L9605) `Store/recordViewable` | `Store.row` (9605) | GATED-STORE |
| [packages/store/src/store.ts:1474](../../packages/store/src/store.ts#L1474) `Store/recordedFormat` | `Store.sql` (1474) | CORE |
| [packages/store/src/store.ts:8294](../../packages/store/src/store.ts#L8294) `Store/recoverContainersOut` | `SQLite.prepare` (8294); `Store.sql` (8294); `SQLite.get` (8297) | CORE |
| [packages/store/src/store.ts:1566](../../packages/store/src/store.ts#L1566) `Store/recoverPendingExternalFiles` | `Store.sql` (1566, 1568, 1592, 1594); `SQLite.prepare` (1568); `SQLite.get` (1579) | CORE |
| [packages/store/src/store.ts:5811](../../packages/store/src/store.ts#L5811) `Store/recoveryCodesRemaining` | `SQLite.get` (5811); `SQLite.prepare` (5811); `Store.sql` (5811) | CORE |
| [packages/store/src/store.ts:10803](../../packages/store/src/store.ts#L10803) `Store/refreshDecimalSqlViews` | `SQLite.get` (10803); `SQLite.prepare` (10803, 10808); `SQLite.all` (10808) | CORE |
| [packages/store/src/store.ts:3565](../../packages/store/src/store.ts#L3565) `Store/refuseLookalikeAccount` | `SQLite.all` (3565); `SQLite.prepare` (3565); `Store.sql` (3565) | CORE |
| [packages/store/src/store.ts:5677](../../packages/store/src/store.ts#L5677) `Store/registerPasskey` | `SQLite.prepare` (5677); `Store.sql` (5677) | CORE |
| [packages/store/src/store.ts:3694](../../packages/store/src/store.ts#L3694) `Store/rejectPending` | `SQLite.get` (3694); `SQLite.prepare` (3694, 3696); `Store.sql` (3694, 3696) | CORE |
| [packages/store/src/store.ts:8831](../../packages/store/src/store.ts#L8831) `Store/relatedCriteria` | `SQLite.iterate` (8831); `SQLite.prepare` (8831); `Store.sql` (8831) | CORE |
| [packages/store/src/store.ts:8828](../../packages/store/src/store.ts#L8828) `Store/relatedCriteria/matched` | `relatedRows` (8828) | CORE |
| [packages/store/src/store.ts:7174](../../packages/store/src/store.ts#L7174) `Store/relatedValues` | `Calculations.globalValue` (7174); `Calculations.unstoredValue` (7176) | CORE |
| [packages/store/src/store.ts:5690](../../packages/store/src/store.ts#L5690) `Store/removePasskey` | `SQLite.get` (5690); `SQLite.prepare` (5690, 5691); `Store.sql` (5690, 5691) | CORE |
| [packages/store/src/store.ts:10050](../../packages/store/src/store.ts#L10050) `Store/restoreDeletedRowLocked` | `SQLite.get` (10050, 10055); `SQLite.prepare` (10050, 10051, 10055, 10065); `Store.sql` (10050, 10051, 10055, 10065); `SQLite.all` (10051) | CORE |
| [packages/store/src/store.ts:2482](../../packages/store/src/store.ts#L2482) `Store/restoreRecord` | `Store.recordAsOf` (2482); `SQLite.get` (2486); `SQLite.prepare` (2486, 2491, 2500, 2511); `Store.sql` (2486, 2491, 2500, 2511) | CORE |
| [packages/store/src/store.ts:2526](../../packages/store/src/store.ts#L2526) `Store/revertAuditEntry` | `Store.auditLog` (2526) | CORE |
| [packages/store/src/store.ts:5438](../../packages/store/src/store.ts#L5438) `Store/revokeApiToken` | `SQLite.prepare` (5438); `Store.sql` (5438) | CORE |
| [packages/store/src/store.ts:9097](../../packages/store/src/store.ts#L9097) `Store/row` | `SQLite.get` (9097) | CORE |
| [packages/store/src/store.ts:10867](../../packages/store/src/store.ts#L10867) `Store/rowsOf` | `SQLite.iterate` (10867, 10875) | CORE |
| [packages/store/src/store.ts:6262](../../packages/store/src/store.ts#L6262) `Store/ruleOutcome` | `Calculations.context` (6262) | CORE |
| [packages/store/src/store.ts:8942](../../packages/store/src/store.ts#L8942) `Store/runningSummaryValues` | `Store.viewableIds` (8942); `rowsById` (8944); `Calculations.value` (8955, 8961); `Calculations.related` (8972) | GATED-STORE |
| [packages/store/src/store.ts:5897](../../packages/store/src/store.ts#L5897) `Store/savePrivilegeSet` | `SQLite.prepare` (5897, 5905); `Store.sql` (5897, 5905) | AUTH |
| [packages/store/src/store.ts:3918](../../packages/store/src/store.ts#L3918) `Store/saveScriptTest` | `SQLite.prepare` (3918); `Store.sql` (3918) | CORE |
| [packages/store/src/store.ts:6401](../../packages/store/src/store.ts#L6401) `Store/scopedTableSql` | `Store.viewableIds` (6401); `SQLite.all` (6404); `SQLite.prepare` (6404); `Store.sql` (6404) | GATED-STORE |
| [packages/store/src/store.ts:3142](../../packages/store/src/store.ts#L3142) `Store/scriptHistory` | `SQLite.all` (3142); `SQLite.prepare` (3142); `Store.sql` (3142) | CORE |
| [packages/store/src/store.ts:2819](../../packages/store/src/store.ts#L2819) `Store/securityChange` | `Store.sql` (2819, 2821); `SQLite.prepare` (2821) | CORE |
| [packages/store/src/store.ts:2406](../../packages/store/src/store.ts#L2406) `Store/securityEvents` | `Store.auditLog` (2406) | CORE |
| [packages/store/src/store.ts:5162](../../packages/store/src/store.ts#L5162) `Store/securityToken` | `SQLite.get` (5162); `SQLite.prepare` (5162); `Store.sql` (5162) | CORE |
| [packages/store/src/store.ts:10894](../../packages/store/src/store.ts#L10894) `Store/selectHeldCurrent` | `Store.sql` (10894, 10895, 10897); `SQLite.prepare` (10895) | CORE |
| [packages/store/src/store.ts:10355](../../packages/store/src/store.ts#L10355) `Store/selectIdsCurrent` | `Store.selectIds` (10355); `SQLite.all` (10361); `SQLite.prepare` (10361); `Store.sql` (10361) | GATED-STORE |
| [packages/store/src/store.ts:10886](../../packages/store/src/store.ts#L10886) `Store/selectIn` | `Store.select` (10886) | CORE |
| [packages/store/src/store.ts:1892](../../packages/store/src/store.ts#L1892) `Store/selfContainedCopy` | `Store.sql` (1892); `SQLite.all` (1897); `SQLite.prepare` (1897, 1899, 1900, 1901) | CORE |
| [packages/store/src/store.ts:4962](../../packages/store/src/store.ts#L4962) `Store/setAccountActive` | `SQLite.prepare` (4962, 4965, 4966); `Store.sql` (4962, 4965, 4966) | AUTH |
| [packages/store/src/store.ts:5181](../../packages/store/src/store.ts#L5181) `Store/setAccountLocalOnly` | `SQLite.prepare` (5181); `Store.sql` (5181) | CORE |
| [packages/store/src/store.ts:6053](../../packages/store/src/store.ts#L6053) `Store/setAccountPrivilegeSet` | `SQLite.get` (6053); `SQLite.prepare` (6053, 6056, 6060); `Store.sql` (6053, 6056, 6060) | AUTH |
| [packages/store/src/store.ts:5190](../../packages/store/src/store.ts#L5190) `Store/setAccountRequire2fa` | `SQLite.prepare` (5190); `Store.sql` (5190) | CORE |
| [packages/store/src/store.ts:3595](../../packages/store/src/store.ts#L3595) `Store/setAgentAccount` | `SQLite.get` (3595); `SQLite.prepare` (3595, 3601); `Store.sql` (3595, 3601) | CORE |
| [packages/store/src/store.ts:3962](../../packages/store/src/store.ts#L3962) `Store/setAiAllowed` | `SQLite.prepare` (3962); `Store.sql` (3962) | CORE |
| [packages/store/src/store.ts:4045](../../packages/store/src/store.ts#L4045) `Store/setAiPolicy` | `SQLite.prepare` (4045); `Store.sql` (4045) | CORE |
| [packages/store/src/store.ts:6660](../../packages/store/src/store.ts#L6660) `Store/setAllowBlankPasswordFromLan` | `SQLite.prepare` (6660); `Store.sql` (6660) | CORE |
| [packages/store/src/store.ts:2621](../../packages/store/src/store.ts#L2621) `Store/setAuditSettings` | `SQLite.prepare` (2621); `Store.sql` (2621) | CORE |
| [packages/store/src/store.ts:8513](../../packages/store/src/store.ts#L8513) `Store/setContainer` | `Store.sql` (8513, 8530); `Store.row` (8519); `SQLite.prepare` (8530) | CORE |
| [packages/store/src/store.ts:3547](../../packages/store/src/store.ts#L3547) `Store/setExternalAccount` | `SQLite.get` (3547); `SQLite.prepare` (3547, 3552); `Store.sql` (3547, 3552) | CORE |
| [packages/store/src/store.ts:4668](../../packages/store/src/store.ts#L4668) `Store/setMustChangePassword` | `SQLite.prepare` (4668); `Store.sql` (4668) | CORE |
| [packages/store/src/store.ts:3747](../../packages/store/src/store.ts#L3747) `Store/setPassword` | `SQLite.get` (3747); `SQLite.prepare` (3747, 3753, 3762, 3769, 3770, 3771); `Store.sql` (3747, 3753, 3762, 3769, 3770, 3771) | AUTH |
| [packages/store/src/store.ts:3859](../../packages/store/src/store.ts#L3859) `Store/setPasswordPolicy` | `SQLite.prepare` (3859); `Store.sql` (3859) | CORE |
| [packages/store/src/store.ts:1442](../../packages/store/src/store.ts#L1442) `Store/setPersistentData` | `SQLite.prepare` (1442, 1446); `Store.sql` (1442, 1446) | CORE |
| [packages/store/src/store.ts:4065](../../packages/store/src/store.ts#L4065) `Store/setPiiIsolation` | `SQLite.prepare` (4065); `Store.sql` (4065) | CORE |
| [packages/store/src/store.ts:3895](../../packages/store/src/store.ts#L3895) `Store/setRequireTotpForFullAccess` | `SQLite.prepare` (3895); `Store.sql` (3895) | CORE |
| [packages/store/src/store.ts:3977](../../packages/store/src/store.ts#L3977) `Store/setScriptNetwork` | `SQLite.prepare` (3977); `Store.sql` (3977) | CORE |
| [packages/store/src/store.ts:4034](../../packages/store/src/store.ts#L4034) `Store/setSqlRequiresFmxdbc` | `SQLite.prepare` (4034); `Store.sql` (4034) | CORE |
| [packages/store/src/store.ts:9526](../../packages/store/src/store.ts#L9526) `Store/setStoredCalcValues` | `SQLite.prepare` (9526, 9527); `Store.sql` (9526, 9527); `SQLite.get` (9531) | CORE |
| [packages/store/src/store.ts:8595](../../packages/store/src/store.ts#L8595) `Store/setUserPref` | `Store.sql` (8595, 8596, 8597); `SQLite.prepare` (8596, 8597) | CORE |
| [packages/store/src/store.ts:4018](../../packages/store/src/store.ts#L4018) `Store/setWebViewerHosts` | `SQLite.prepare` (4018); `Store.sql` (4018) | CORE |
| [packages/store/src/store.ts:5118](../../packages/store/src/store.ts#L5118) `Store/settleSignIns` | `SQLite.all` (5118, 5124); `SQLite.prepare` (5118, 5124, 5130, 5134, 5136); `Store.sql` (5118, 5124, 5130, 5134, 5136) | AUTH |
| [packages/store/src/store.ts:2023](../../packages/store/src/store.ts#L2023) `Store/shareResults` | `Store.sql` (2023) | CORE |
| [packages/store/src/store.ts:1504](../../packages/store/src/store.ts#L1504) `Store/shipWal` | `Store.sql` (1504) | CORE |
| [packages/store/src/store.ts:5065](../../packages/store/src/store.ts#L5065) `Store/signInBase` | `SQLite.get` (5065); `SQLite.prepare` (5065); `Store.sql` (5065) | AUTH |
| [packages/store/src/store.ts:5067](../../packages/store/src/store.ts#L5067) `Store/signInBase/identity` | `SQLite.get` (5067); `SQLite.prepare` (5067); `Store.sql` (5067) | AUTH |
| [packages/store/src/store.ts:5054](../../packages/store/src/store.ts#L5054) `Store/signInMark` | `SQLite.prepare` (5054); `Store.sql` (5054) | AUTH |
| [packages/store/src/store.ts:10580](../../packages/store/src/store.ts#L10580) `Store/sortIdsCurrentProgress` | `SQLite.all` (10580); `SQLite.prepare` (10580, 10648); `Store.sql` (10580, 10648); `Store.valueListItems` (10588); `rowsById` (10600); `Calculations.globalValue` (10603); `Calculations.unstoredValue` (10604); `Calculations.related` (10610); `SQLite.iterate` (10648) | GATED-STORE |
| [packages/store/src/store.ts:8756](../../packages/store/src/store.ts#L8756) `Store/sortedPage` | `SQLite.iterate` (8756); `SQLite.prepare` (8756, 8771); `Store.sql` (8756, 8771); `SQLite.all` (8771) | CORE |
| [packages/store/src/store.ts:8904](../../packages/store/src/store.ts#L8904) `Store/summaries` | `Calculations.wholeTable` (8904); `Calculations.collect` (8924, 8929) | CORE |
| [packages/store/src/store.ts:8920](../../packages/store/src/store.ts#L8920) `Store/summaries/recs` | `SQLite.iterate` (8920); `SQLite.prepare` (8920); `Store.sql` (8920) | CORE |
| [packages/store/src/store.ts:5628](../../packages/store/src/store.ts#L5628) `Store/takeWebauthnChallenge` | `SQLite.get` (5628); `SQLite.prepare` (5628, 5632); `Store.sql` (5628, 5632) | CORE |
| [packages/store/src/store.ts:8648](../../packages/store/src/store.ts#L8648) `Store/timeFind` | `Store.query` (8648, 8652, 8653); `Store.recordCount` (8655) | CORE |
| [packages/store/src/store.ts:7115](../../packages/store/src/store.ts#L7115) `Store/toRecord` | `Calculations.value` (7115, 7125); `Calculations.globalValue` (7119); `Calculations.unstoredStyled` (7124) | CORE |
| [packages/store/src/store.ts:5512](../../packages/store/src/store.ts#L5512) `Store/totpAccounts` | `SQLite.all` (5512); `SQLite.prepare` (5512); `Store.sql` (5512) | CORE |
| [packages/store/src/store.ts:1516](../../packages/store/src/store.ts#L1516) `Store/trial` | `Store.sql` (1516) | CORE |
| [packages/store/src/store.ts:1521](../../packages/store/src/store.ts#L1521) `Store/trial/undo` | `Store.sql` (1521) | CORE |
| [packages/store/src/store.ts:10690](../../packages/store/src/store.ts#L10690) `Store/truncate/run` | `Store.sql` (10690, 10692, 10699, 10701, 10703, 10704); `SQLite.prepare` (10692, 10699); `SQLite.all` (10694) | CORE |
| [packages/store/src/store.ts:3494](../../packages/store/src/store.ts#L3494) `Store/unmigratedAccounts` | `SQLite.all` (3494); `SQLite.prepare` (3494); `Store.sql` (3494) | CORE |
| [packages/store/src/store.ts:4574](../../packages/store/src/store.ts#L4574) `Store/unusedAccess` | `SQLite.get` (4574); `SQLite.prepare` (4574, 4583); `Store.sql` (4574, 4583); `SQLite.all` (4583) | CORE |
| [packages/store/src/store.ts:4622](../../packages/store/src/store.ts#L4622) `Store/unusedObjects` | `SQLite.get` (4622); `SQLite.prepare` (4622, 4625); `Store.sql` (4622, 4625); `SQLite.all` (4625) | CORE |
| [packages/store/src/store.ts:5752](../../packages/store/src/store.ts#L5752) `Store/unusedRecoveryHashes` | `SQLite.all` (5752); `SQLite.prepare` (5752); `Store.sql` (5752) | CORE |
| [packages/store/src/store.ts:4404](../../packages/store/src/store.ts#L4404) `Store/unusualAccess` | `Store.auditLog` (4404, 4470) | CORE |
| [packages/store/src/store.ts:9348](../../packages/store/src/store.ts#L9348) `Store/update` | `Store.row` (9348); `Store.sql` (9378, 9379, 9418, 9421) | CORE |
| [packages/store/src/store.ts:9381](../../packages/store/src/store.ts#L9381) `Store/update/undo` | `Store.sql` (9381) | CORE |
| [packages/store/src/store.ts:9811](../../packages/store/src/store.ts#L9811) `Store/updatePortals` | `Store.row` (9811, 9847); `relatedRows` (9848) | CORE |
| [packages/store/src/store.ts:9821](../../packages/store/src/store.ts#L9821) `Store/updatePortals/portal/related` | `relatedIdList` (9821) | CORE |
| [packages/store/src/store.ts:9793](../../packages/store/src/store.ts#L9793) `Store/updateRelated` | `relatedRows` (9793) | CORE |
| [packages/store/src/store.ts:4660](../../packages/store/src/store.ts#L4660) `Store/usageCounting` | `SQLite.get` (4660); `SQLite.prepare` (4660); `Store.sql` (4660) | CORE |
| [packages/store/src/store.ts:8586](../../packages/store/src/store.ts#L8586) `Store/userPrefs` | `SQLite.all` (8586); `SQLite.prepare` (8586); `Store.sql` (8586) | CORE |
| [packages/store/src/store.ts:7496](../../packages/store/src/store.ts#L7496) `Store/valueListItemsCurrent` | `Store.valueListItems` (7496); `Store.get` (7510); `relatedRows` (7511); `Store.row` (7511); `SQLite.iterate` (7513); `SQLite.prepare` (7513); `Store.sql` (7513); `Calculations.related` (7523); `Calculations.value` (7527, 7528) | GATED-STORE |
| [packages/store/src/store.ts:10003](../../packages/store/src/store.ts#L10003) `Store/vaultHeld` | `SQLite.get` (10003); `SQLite.prepare` (10003); `Store.sql` (10003) | CORE |
| [packages/store/src/store.ts:5541](../../packages/store/src/store.ts#L5541) `Store/verifyTotp` | `SQLite.get` (5541); `SQLite.prepare` (5541, 5548); `Store.sql` (5541, 5548) | CORE |
| [packages/store/src/store.ts:2078](../../packages/store/src/store.ts#L2078) `Store/versionNumber` | `SQLite.get` (2078); `SQLite.prepare` (2078); `Store.sql` (2078) | CORE |
| [packages/store/src/store.ts:2034](../../packages/store/src/store.ts#L2034) `Store/versionTriggers` | `SQLite.get` (2034); `SQLite.prepare` (2034, 2039, 2040); `Store.sql` (2034, 2039, 2040, 2057, 2059, 2060, 2062); `SQLite.all` (2039, 2040) | CORE |
| [packages/store/src/store.ts:2002](../../packages/store/src/store.ts#L2002) `Store/warmSummariesCurrent` | `Calculations.wholeTable` (2002) | CORE |
| [packages/store/src/store.ts:4000](../../packages/store/src/store.ts#L4000) `Store/webViewerChecked` | `SQLite.get` (4000); `SQLite.prepare` (4000); `Store.sql` (4000) | CORE |
| [packages/store/src/store.ts:1761](../../packages/store/src/store.ts#L1761) `Store/withWriteTransaction` | `Store.sql` (1761, 1773, 1779, 1781, 1781) | CORE |
| [packages/store/src/store.ts:7050](../../packages/store/src/store.ts#L7050) `Store/wordIndex` | `Store.sql` (7050, 7058, 7063); `Store.recordCount` (7062); `SQLite.get` (7063); `SQLite.prepare` (7063) | CORE |
| [packages/store/src/store.ts:8187](../../packages/store/src/store.ts#L8187) `Store/writeExternalFile` | `Store.evaluateEach` (8187); `SQLite.prepare` (8210); `Store.sql` (8210) | CORE |
| [packages/store/src/store.ts:8211](../../packages/store/src/store.ts#L8211) `Store/writeExternalFile/taken` | `SQLite.get` (8211) | CORE |
| [packages/store/src/store.ts:5371](../../packages/store/src/store.ts#L5371) `Store/writeObjectUseRows` | `SQLite.prepare` (5371, 5372, 5377); `Store.sql` (5371, 5372, 5377) | CORE |
| [packages/store/src/store.ts:2133](../../packages/store/src/store.ts#L2133) `Store/writeToken` | `SQLite.get` (2133); `SQLite.prepare` (2133); `Store.sql` (2133) | CORE |
| [packages/store/src/store.ts:5343](../../packages/store/src/store.ts#L5343) `Store/writeUsage` | `Store.sql` (5343, 5344, 5346, 5350, 5352) | CORE |
| [packages/store/src/store.ts:5359](../../packages/store/src/store.ts#L5359) `Store/writeUsageRows` | `SQLite.prepare` (5359, 5360, 5366); `Store.sql` (5359, 5360, 5366) | CORE |
| [packages/store/src/store.ts:6771](../../packages/store/src/store.ts#L6771) `Store/design` | `SQLite.get` (6771) | CORE |
| [packages/store/src/store.ts:6793](../../packages/store/src/store.ts#L6793) `Store/themes` | `SQLite.get` (6793) | CORE |
| [packages/store/src/store.ts:5712](../../packages/store/src/store.ts#L5712) `Store/verifyPasskeyCredential` | `SQLite.get` (5712); `SQLite.prepare` (5712, 5724); `Store.sql` (5712, 5724) | CORE |
| [packages/store/src/store.ts:6631](../../packages/store/src/store.ts#L6631) `Store/passwordState` | `SQLite.get` (6631); `SQLite.prepare` (6631); `Store.sql` (6631) | CORE |
| [packages/store/src/store.ts:9946](../../packages/store/src/store.ts#L9946) `Store/deleteVisibility` | `Store.canViewRecord` (9946) | CORE |
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
