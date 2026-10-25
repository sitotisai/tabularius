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
| [packages/store/src/store.ts:4726](../../packages/store/src/store.ts#L4726) `Store/accountIdentityId` | `SQLite.get` (4726, 4731); `SQLite.prepare` (4726, 4730, 4731); `Store.sql` (4726, 4730, 4731) | CORE |
| [packages/store/src/store.ts:4689](../../packages/store/src/store.ts#L4689) `Store/accountInactive` | `SQLite.get` (4689); `SQLite.prepare` (4689); `Store.sql` (4689) | CORE |
| [packages/store/src/store.ts:4854](../../packages/store/src/store.ts#L4854) `Store/accountLocalOnly` | `SQLite.get` (4854); `SQLite.prepare` (4854); `Store.sql` (4854) | CORE |
| [packages/store/src/store.ts:5713](../../packages/store/src/store.ts#L5713) `Store/accountPrivilegeSet` | `SQLite.get` (5713); `SQLite.prepare` (5713); `Store.sql` (5713) | CORE |
| [packages/store/src/store.ts:4859](../../packages/store/src/store.ts#L4859) `Store/accountRequires2fa` | `SQLite.get` (4859); `SQLite.prepare` (4859); `Store.sql` (4859) | CORE |
| [packages/store/src/store.ts:5079](../../packages/store/src/store.ts#L5079) `Store/accountUsage` | `SQLite.get` (5079); `SQLite.prepare` (5079, 5080); `Store.sql` (5079, 5080); `SQLite.all` (5080); `Store.auditLog` (5096) | CORE |
| [packages/store/src/store.ts:3172](../../packages/store/src/store.ts#L3172) `Store/accounts` | `SQLite.all` (3172); `SQLite.prepare` (3172); `Store.sql` (3172) | CORE |
| [packages/store/src/store.ts:3168](../../packages/store/src/store.ts#L3168) `Store/accountsSharingLockout` | `SQLite.all` (3168); `SQLite.prepare` (3168); `Store.sql` (3168) | CORE |
| [packages/store/src/store.ts:7796](../../packages/store/src/store.ts#L7796) `Store/addContainer` | `SQLite.all` (7796); `SQLite.prepare` (7796, 7801, 7815, 7819, 7820); `Store.sql` (7796, 7801, 7815, 7817, 7819, 7820, 7822, 7825); `SQLite.get` (7806); `Store.containerRange` (7808) | CORE |
| [packages/store/src/store.ts:7842](../../packages/store/src/store.ts#L7842) `Store/addExternalContainer` | `SQLite.prepare` (7842); `Store.sql` (7842) | CORE |
| [packages/store/src/store.ts:8298](../../packages/store/src/store.ts#L8298) `Store/addFieldIndex` | `Store.sql` (8298) | CORE |
| [packages/store/src/store.ts:6502](../../packages/store/src/store.ts#L6502) `Store/addImage` | `Store.sql` (6502, 6503); `SQLite.prepare` (6503) | CORE |
| [packages/store/src/store.ts:5763](../../packages/store/src/store.ts#L5763) `Store/addProvisionedAccount` | `SQLite.get` (5763); `SQLite.prepare` (5763, 5767); `Store.sql` (5763, 5767) | CORE |
| [packages/store/src/store.ts:6921](../../packages/store/src/store.ts#L6921) `Store/addRelated` | `relatedRows` (6921); `rowsById` (6954); `firstRelatedEach` (6977) | CORE |
| [packages/store/src/store.ts:3190](../../packages/store/src/store.ts#L3190) `Store/agentNeedsApproval` | `SQLite.get` (3190); `SQLite.prepare` (3190); `Store.sql` (3190) | CORE |
| [packages/store/src/store.ts:5977](../../packages/store/src/store.ts#L5977) `Store/allowedIds` | `SQLite.iterate` (5977); `SQLite.prepare` (5977); `Store.sql` (5977) | CORE |
| [packages/store/src/store.ts:5136](../../packages/store/src/store.ts#L5136) `Store/apiToken` | `SQLite.get` (5136); `SQLite.prepare` (5136, 5149); `Store.sql` (5136, 5149) | CORE |
| [packages/store/src/store.ts:5112](../../packages/store/src/store.ts#L5112) `Store/apiTokens` | `SQLite.all` (5112); `SQLite.prepare` (5112); `Store.sql` (5112) | CORE |
| [packages/store/src/store.ts:3530](../../packages/store/src/store.ts#L3530) `Store/appendSecurityEvent` | `Store.sql` (3530) | CORE |
| [packages/store/src/store.ts:4535](../../packages/store/src/store.ts#L4535) `Store/applyAccountImport` | `Store.sql` (4535, 4543, 4572); `SQLite.get` (4543); `SQLite.prepare` (4543, 4572) | CORE |
| [packages/store/src/store.ts:2133](../../packages/store/src/store.ts#L2133) `Store/applyDesign` | `Store.sql` (2133, 2134, 2147, 2150, 2155, 2171, 2174, 2174); `SQLite.prepare` (2150, 2155) | CORE |
| [packages/store/src/store.ts:3386](../../packages/store/src/store.ts#L3386) `Store/approvePending` | `SQLite.get` (3386); `SQLite.prepare` (3386, 3397); `Store.sql` (3386, 3397) | CORE |
| [packages/store/src/store.ts:2592](../../packages/store/src/store.ts#L2592) `Store/audit` | `Store.sql` (2592) | CORE |
| [packages/store/src/store.ts:2233](../../packages/store/src/store.ts#L2233) `Store/auditLog` | `SQLite.all` (2233); `SQLite.prepare` (2233); `Store.sql` (2233) | CORE |
| [packages/store/src/store.ts:1744](../../packages/store/src/store.ts#L1744) `Store/backup` | `Store.sql` (1744) | CORE |
| [packages/store/src/store.ts:3196](../../packages/store/src/store.ts#L3196) `Store/blankPasswordAccounts` | `SQLite.all` (3196); `SQLite.prepare` (3196); `Store.sql` (3196) | CORE |
| [packages/store/src/store.ts:8879](../../packages/store/src/store.ts#L8879) `Store/canView` | `Store.canView` (8879); `Store.row` (8880) | GATED-STORE |
| [packages/store/src/store.ts:8861](../../packages/store/src/store.ts#L8861) `Store/canViewRecord` | `SQLite.get` (8861); `SQLite.prepare` (8861); `Store.sql` (8861) | GATED-STORE |
| [packages/store/src/store.ts:4464](../../packages/store/src/store.ts#L4464) `Store/canonicalAccount` | `SQLite.all` (4464); `SQLite.prepare` (4464); `Store.sql` (4464) | CORE |
| [packages/store/src/store.ts:9938](../../packages/store/src/store.ts#L9938) `Store/cascadeDelete` | `relatedRows` (9938) | CORE |
| [packages/store/src/store.ts:1963](../../packages/store/src/store.ts#L1963) `Store/changeOne` | `Store.sql` (1963, 1965) | CORE |
| [packages/store/src/store.ts:1966](../../packages/store/src/store.ts#L1966) `Store/changeOne/read` | `SQLite.get` (1966); `SQLite.prepare` (1966); `Store.sql` (1966) | CORE |
| [packages/store/src/store.ts:8177](../../packages/store/src/store.ts#L8177) `Store/checkContainerWrite` | `Store.row` (8177) | CORE |
| [packages/store/src/store.ts:9591](../../packages/store/src/store.ts#L9591) `Store/checkEditable` | `Store.row` (9591) | CORE |
| [packages/store/src/store.ts:1391](../../packages/store/src/store.ts#L1391) `Store/checkpoint` | `SQLite.get` (1391); `SQLite.prepare` (1391); `Store.sql` (1391) | CORE |
| [packages/store/src/store.ts:5749](../../packages/store/src/store.ts#L5749) `Store/clearAccountPrivilegeSet` | `SQLite.prepare` (5749); `Store.sql` (5749) | CORE |
| [packages/store/src/store.ts:1409](../../packages/store/src/store.ts#L1409) `Store/close` | `Store.sql` (1409) | CORE |
| [packages/store/src/store.ts:8145](../../packages/store/src/store.ts#L8145) `Store/compactFile` | `Store.sql` (8145, 8146, 8148) | CORE |
| [packages/store/src/store.ts:10062](../../packages/store/src/store.ts#L10062) `Store/computeValuesCurrent` | `Store.computeValues` (10062); `Store.sql` (10068, 10072); `SQLite.all` (10072); `SQLite.prepare` (10072) | GATED-STORE |
| [packages/store/src/store.ts:8530](../../packages/store/src/store.ts#L8530) `Store/computedRows` | `Store.sql` (8530, 8533, 8534, 8535, 8537, 8547, 8548, 8549, 8552); `SQLite.prepare` (8533, 8535, 8537, 8547); `SQLite.iterate` (8537); `Calculations.globalValue` (8540); `Calculations.unstoredValue` (8541); `Calculations.related` (8544); `SQLite.all` (8547) | CORE |
| [packages/store/src/store.ts:5176](../../packages/store/src/store.ts#L5176) `Store/confirmTotp` | `SQLite.get` (5176); `SQLite.prepare` (5176, 5178); `Store.sql` (5176, 5178) | CORE |
| [packages/store/src/store.ts:1067](../../packages/store/src/store.ts#L1067) `Store/constructor` | `Store.sql` (1067, 1069, 1071, 1072, 1076, 1080, 1081, 1092, 1097, 1102, 1103, 1107, 1108, 1109, 1116, 1120, 1124, 1125, 1126, 1131, 1135, 1138, 1139, 1141, 1142, 1145, 1146, 1150, 1151, 1155, 1156, 1159, 1161, 1164, 1165, 1169, 1170, 1174, 1175, 1178, 1179, 1180, 1183, 1184, 1187, 1188, 1190, 1190, 1191, 1191, 1192, 1195, 1199, 1201, 1204, 1205, 1206, 1209, 1210, 1212, 1214, 1215, 1219, 1220, 1222, 1226, 1228, 1229, 1230, 1230, 1234, 1235); `SQLite.get` (1071); `SQLite.prepare` (1071, 1138, 1139, 1142, 1145, 1150, 1155, 1164, 1169, 1174, 1183, 1187, 1190, 1191, 1209, 1214, 1219); `SQLite.all` (1138, 1145, 1150, 1155, 1164, 1169, 1174, 1183, 1187, 1190, 1191, 1209, 1214, 1219) | CORE |
| [packages/store/src/store.ts:5529](../../packages/store/src/store.ts#L5529) `Store/consumeRecoveryCode` | `SQLite.prepare` (5529); `Store.sql` (5529) | CORE |
| [packages/store/src/store.ts:7720](../../packages/store/src/store.ts#L7720) `Store/container` | `SQLite.get` (7720); `SQLite.prepare` (7720, 7729); `Store.sql` (7720, 7729); `SQLite.all` (7729) | CORE |
| [packages/store/src/store.ts:8154](../../packages/store/src/store.ts#L8154) `Store/containerId` | `Store.containerId` (8154); `Store.row` (8155) | CORE |
| [packages/store/src/store.ts:7737](../../packages/store/src/store.ts#L7737) `Store/containerInfo` | `SQLite.get` (7737); `SQLite.prepare` (7737); `Store.sql` (7737) | CORE |
| [packages/store/src/store.ts:7701](../../packages/store/src/store.ts#L7701) `Store/containerIntact` | `SQLite.get` (7701); `SQLite.prepare` (7701); `Store.sql` (7701) | CORE |
| [packages/store/src/store.ts:7640](../../packages/store/src/store.ts#L7640) `Store/containerIntegrityReport` | `SQLite.all` (7640); `SQLite.prepare` (7640, 7651); `Store.sql` (7640, 7651); `SQLite.get` (7651) | CORE |
| [packages/store/src/store.ts:7715](../../packages/store/src/store.ts#L7715) `Store/containerMeta` | `SQLite.get` (7715); `SQLite.prepare` (7715); `Store.sql` (7715) | CORE |
| [packages/store/src/store.ts:7771](../../packages/store/src/store.ts#L7771) `Store/containerRange` | `SQLite.all` (7771); `SQLite.prepare` (7771, 7778); `Store.sql` (7771, 7778); `SQLite.get` (7778) | CORE |
| [packages/store/src/store.ts:7542](../../packages/store/src/store.ts#L7542) `Store/containerReferences` | `SQLite.all` (7542, 7561, 7563, 7569, 7582, 7593, 7607); `SQLite.prepare` (7542, 7561, 7563, 7569, 7582, 7593, 7605, 7607); `Store.sql` (7542, 7561, 7563, 7569, 7582, 7593, 7605, 7607); `SQLite.get` (7605); `Store.row` (7616) | CORE |
| [packages/store/src/store.ts:10042](../../packages/store/src/store.ts#L10042) `Store/countIds` | `Store.countIds` (10042); `SQLite.get` (10046); `SQLite.prepare` (10046); `Store.sql` (10046) | GATED-STORE |
| [packages/store/src/store.ts:8904](../../packages/store/src/store.ts#L8904) `Store/create` | `SQLite.get` (8904, 8910); `SQLite.prepare` (8904, 8910, 8923); `Store.sql` (8904, 8910, 8923) | CORE |
| [packages/store/src/store.ts:3502](../../packages/store/src/store.ts#L3502) `Store/createAccount` | `SQLite.get` (3502); `SQLite.prepare` (3502, 3506, 3512, 3517, 3522); `Store.sql` (3502, 3506, 3512, 3517, 3522) | CORE |
| [packages/store/src/store.ts:4912](../../packages/store/src/store.ts#L4912) `Store/createApiToken` | `SQLite.get` (4912, 4940); `SQLite.prepare` (4912, 4939, 4940, 4950); `Store.sql` (4912, 4939, 4940, 4950) | CORE |
| [packages/store/src/store.ts:4476](../../packages/store/src/store.ts#L4476) `Store/createLocalAccount` | `SQLite.prepare` (4476); `Store.sql` (4476) | CORE |
| [packages/store/src/store.ts:3162](../../packages/store/src/store.ts#L3162) `Store/credentialIdentity` | `SQLite.get` (3162); `SQLite.prepare` (3162); `Store.sql` (3162) | CORE |
| [packages/store/src/store.ts:1834](../../packages/store/src/store.ts#L1834) `Store/dataVersion` | `SQLite.get` (1834); `SQLite.prepare` (1834); `Store.sql` (1834) | CORE |
| [packages/store/src/store.ts:9634](../../packages/store/src/store.ts#L9634) `Store/delete` | `Store.row` (9634) | CORE |
| [packages/store/src/store.ts:9642](../../packages/store/src/store.ts#L9642) `Store/delete/run` | `SQLite.get` (9642); `SQLite.prepare` (9642, 9647); `Store.sql` (9642, 9647) | CORE |
| [packages/store/src/store.ts:4630](../../packages/store/src/store.ts#L4630) `Store/deleteAccount` | `SQLite.prepare` (4630, 4634, 4635, 4636, 4637, 4638, 4639, 4640, 4641, 4648, 4650, 4652, 4654, 4658); `Store.sql` (4630, 4634, 4635, 4636, 4637, 4638, 4639, 4640, 4641, 4648, 4650, 4652, 4654, 4658) | CORE |
| [packages/store/src/store.ts:5614](../../packages/store/src/store.ts#L5614) `Store/deletePrivilegeSet` | `SQLite.prepare` (5614); `Store.sql` (5614) | CORE |
| [packages/store/src/store.ts:3640](../../packages/store/src/store.ts#L3640) `Store/deleteScriptTest` | `SQLite.prepare` (3640); `Store.sql` (3640) | CORE |
| [packages/store/src/store.ts:2807](../../packages/store/src/store.ts#L2807) `Store/deletedRows` | `SQLite.get` (2807); `SQLite.prepare` (2807, 2809, 2809); `Store.sql` (2807, 2809, 2809); `SQLite.all` (2809, 2809) | CORE |
| [packages/store/src/store.ts:2917](../../packages/store/src/store.ts#L2917) `Store/designEffect` | `Store.sql` (2917, 2922, 2927, 2932, 2935, 2941, 2952, 2953, 2955, 2968, 2969, 2972, 2974, 2980, 2981, 2982, 2987, 2989, 2993, 2996, 2997, 2999, 3002, 3008, 3010, 3017, 3018, 3020, 3021, 3022, 3023, 3030, 3031, 3033, 3033, 3035, 3036, 3037, 3041, 3045, 3047, 3085, 3087, 3089); `SQLite.get` (2952, 2968, 2980, 2981, 2993, 2997, 3033, 3041); `SQLite.prepare` (2952, 2953, 2968, 2969, 2980, 2981, 2987, 2989, 2993, 2997, 3008, 3010, 3023, 3030, 3031, 3033, 3035, 3037, 3041, 3045); `SQLite.all` (3030, 3031); `SQLite.iterate` (3035) | CORE |
| [packages/store/src/store.ts:2910](../../packages/store/src/store.ts#L2910) `Store/designEffect/renameExcluded` | `SQLite.prepare` (2910); `Store.sql` (2910) | CORE |
| [packages/store/src/store.ts:2894](../../packages/store/src/store.ts#L2894) `Store/designEffect/renameKey` | `SQLite.prepare` (2894); `Store.sql` (2894) | CORE |
| [packages/store/src/store.ts:2848](../../packages/store/src/store.ts#L2848) `Store/designHistory` | `SQLite.all` (2848); `SQLite.prepare` (2848); `Store.sql` (2848) | CORE |
| [packages/store/src/store.ts:5197](../../packages/store/src/store.ts#L5197) `Store/disableTotp` | `SQLite.prepare` (5197); `Store.sql` (5197) | CORE |
| [packages/store/src/store.ts:3097](../../packages/store/src/store.ts#L3097) `Store/dropColumnIndexes` | `SQLite.all` (3097, 3099); `SQLite.prepare` (3097, 3099); `Store.sql` (3097, 3099, 3100) | CORE |
| [packages/store/src/store.ts:8310](../../packages/store/src/store.ts#L8310) `Store/dropFieldIndex` | `SQLite.get` (8310); `SQLite.prepare` (8310); `Store.sql` (8310, 8311) | CORE |
| [packages/store/src/store.ts:8947](../../packages/store/src/store.ts#L8947) `Store/duplicate` | `Store.row` (8947); `SQLite.get` (8951); `SQLite.prepare` (8951, 8966); `Store.sql` (8951, 8966) | CORE |
| [packages/store/src/store.ts:7958](../../packages/store/src/store.ts#L7958) `Store/embeddedContainerCount` | `SQLite.prepare` (7958); `Store.sql` (7958); `SQLite.get` (7959) | CORE |
| [packages/store/src/store.ts:7944](../../packages/store/src/store.ts#L7944) `Store/embeddedContainers` | `SQLite.prepare` (7944, 7945); `Store.sql` (7944, 7945); `SQLite.all` (7945); `SQLite.get` (7949) | CORE |
| [packages/store/src/store.ts:2833](../../packages/store/src/store.ts#L2833) `Store/emptyDeleted` | `Store.sql` (2833, 2836, 2837, 2839, 2841); `SQLite.prepare` (2837) | CORE |
| [packages/store/src/store.ts:1714](../../packages/store/src/store.ts#L1714) `Store/endTransaction` | `Store.sql` (1714, 1717, 1717) | CORE |
| [packages/store/src/store.ts:5165](../../packages/store/src/store.ts#L5165) `Store/enrollTotp` | `SQLite.prepare` (5165); `Store.sql` (5165) | CORE |
| [packages/store/src/store.ts:2802](../../packages/store/src/store.ts#L2802) `Store/ensureDeleted` | `Store.sql` (2802) | CORE |
| [packages/store/src/store.ts:1245](../../packages/store/src/store.ts#L1245) `Store/ensureNativeIds` | `SQLite.all` (1245, 1257); `SQLite.prepare` (1245, 1248, 1256, 1257); `Store.sql` (1245, 1248, 1251, 1255, 1256, 1257, 1260, 1262) | CORE |
| [packages/store/src/store.ts:9288](../../packages/store/src/store.ts#L9288) `Store/evaluateCurrent` | `Store.row` (9288, 9288, 9289, 9289); `Calculations.context` (9294); `Store.get` (9295, 9297) | GATED-STORE |
| [packages/store/src/store.ts:9329](../../packages/store/src/store.ts#L9329) `Store/evaluateEachCurrent` | `Store.row` (9329, 9329, 9334); `Calculations.context` (9335); `Store.get` (9337) | GATED-STORE |
| [packages/store/src/store.ts:9391](../../packages/store/src/store.ts#L9391) `Store/evaluateRowsCurrent` | `Store.row` (9391, 9391, 9392, 9392) | GATED-STORE |
| [packages/store/src/store.ts:9370](../../packages/store/src/store.ts#L9370) `Store/evaluateRowsCurrent/each` | `Calculations.context` (9370); `Store.get` (9372) | GATED-STORE |
| [packages/store/src/store.ts:9406](../../packages/store/src/store.ts#L9406) `Store/evaluateRowsCurrent/found/[Symbol.iterator]` | `rowsById` (9406) | GATED-STORE |
| [packages/store/src/store.ts:9428](../../packages/store/src/store.ts#L9428) `Store/evaluateRowsCurrent/key` | `Calculations.context` (9428) | GATED-STORE |
| [packages/store/src/store.ts:3429](../../packages/store/src/store.ts#L3429) `Store/externalAccount` | `SQLite.all` (3429); `SQLite.prepare` (3429); `Store.sql` (3429) | CORE |
| [packages/store/src/store.ts:7463](../../packages/store/src/store.ts#L7463) `Store/externalContainerCheck` | `SQLite.all` (7463); `SQLite.prepare` (7463); `Store.sql` (7463) | CORE |
| [packages/store/src/store.ts:7470](../../packages/store/src/store.ts#L7470) `Store/externalContainerCount` | `SQLite.get` (7470); `SQLite.prepare` (7470); `Store.sql` (7470) | CORE |
| [packages/store/src/store.ts:7479](../../packages/store/src/store.ts#L7479) `Store/externalContainerReport` | `SQLite.all` (7479, 7492); `SQLite.prepare` (7479, 7492); `Store.sql` (7479, 7492) | CORE |
| [packages/store/src/store.ts:4715](../../packages/store/src/store.ts#L4715) `Store/externalIdentityId` | `SQLite.get` (4715, 4721); `SQLite.prepare` (4715, 4720, 4721); `Store.sql` (4715, 4720, 4721) | CORE |
| [packages/store/src/store.ts:7711](../../packages/store/src/store.ts#L7711) `Store/externalOf` | `SQLite.get` (7711); `SQLite.prepare` (7711); `Store.sql` (7711) | CORE |
| [packages/store/src/store.ts:2740](../../packages/store/src/store.ts#L2740) `Store/failureAuditRoom` | `SQLite.get` (2740); `SQLite.prepare` (2740); `Store.sql` (2740) | CORE |
| [packages/store/src/store.ts:7123](../../packages/store/src/store.ts#L7123) `Store/fieldIndexCurrent` | `SQLite.iterate` (7123); `SQLite.prepare` (7123, 7128); `Store.sql` (7123, 7128); `SQLite.all` (7128) | GATED-STORE |
| [packages/store/src/store.ts:8345](../../packages/store/src/store.ts#L8345) `Store/find` | `Store.find` (8345) | GATED-STORE |
| [packages/store/src/store.ts:8717](../../packages/store/src/store.ts#L8717) `Store/findCandidates` | `Store.query` (8717) | CORE |
| [packages/store/src/store.ts:8356](../../packages/store/src/store.ts#L8356) `Store/findHere` | `Store.query` (8356, 8361, 8363, 8377, 8379, 8390); `Store.recordCount` (8374); `SQLite.get` (8375, 8379); `SQLite.prepare` (8375, 8379, 8385, 8392, 8401); `Store.sql` (8375, 8379, 8385, 8392, 8401); `SQLite.all` (8385, 8392, 8401) | GATED-STORE |
| [packages/store/src/store.ts:8396](../../packages/store/src/store.ts#L8396) `Store/findHere/[Symbol.iterator]` | `SQLite.iterate` (8396); `SQLite.prepare` (8396); `Store.sql` (8396) | GATED-STORE |
| [packages/store/src/store.ts:10087](../../packages/store/src/store.ts#L10087) `Store/findIdsCurrent` | `Store.findIds` (10087) | GATED-STORE |
| [packages/store/src/store.ts:10093](../../packages/store/src/store.ts#L10093) `Store/findIdsHere` | `Store.query` (10093, 10098, 10100); `SQLite.iterate` (10111); `SQLite.prepare` (10111); `Store.sql` (10111) | GATED-STORE |
| [packages/store/src/store.ts:8661](../../packages/store/src/store.ts#L8661) `Store/findSource` | `Store.query` (8661); `SQLite.all` (8670, 8687); `SQLite.prepare` (8670, 8678, 8686); `Store.sql` (8670, 8675, 8678, 8683, 8686, 8700, 8702); `Calculations.globalValue` (8692); `Calculations.unstoredValue` (8693); `Calculations.related` (8697) | CORE |
| [packages/store/src/store.ts:9683](../../packages/store/src/store.ts#L9683) `Store/forgetStandInValues` | `Store.sql` (9683, 9704); `SQLite.prepare` (9704) | CORE |
| [packages/store/src/store.ts:4597](../../packages/store/src/store.ts#L4597) `Store/forgetStandIns` | `SQLite.prepare` (4597); `Store.sql` (4597) | CORE |
| [packages/store/src/store.ts:7005](../../packages/store/src/store.ts#L7005) `Store/foundSetPage` | `rowsById` (7005) | CORE |
| [packages/store/src/store.ts:7021](../../packages/store/src/store.ts#L7021) `Store/foundSetRowsCurrent` | `Store.viewableIds` (7021); `Store.row` (7037) | GATED-STORE |
| [packages/store/src/store.ts:3348](../../packages/store/src/store.ts#L3348) `Store/gateAgentWrite` | `SQLite.get` (3348); `SQLite.prepare` (3348, 3350); `Store.sql` (3348, 3350) | CORE |
| [packages/store/src/store.ts:5467](../../packages/store/src/store.ts#L5467) `Store/generateRecoveryCodes` | `SQLite.prepare` (5467, 5470); `Store.sql` (5467, 5470) | CORE |
| [packages/store/src/store.ts:8789](../../packages/store/src/store.ts#L8789) `Store/getCurrent` | `Store.get` (8789); `Store.row` (8790, 8790, 8804); `SQLite.all` (8807); `SQLite.prepare` (8807); `Store.sql` (8807) | GATED-STORE |
| [packages/store/src/store.ts:8827](../../packages/store/src/store.ts#L8827) `Store/getManyCurrent` | `Store.getMany` (8827); `SQLite.get` (8845); `SQLite.prepare` (8845); `Store.sql` (8845) | GATED-STORE |
| [packages/store/src/store.ts:8838](../../packages/store/src/store.ts#L8838) `Store/getManyCurrent/[Symbol.iterator]` | `rowsById` (8838) | GATED-STORE |
| [packages/store/src/store.ts:1292](../../packages/store/src/store.ts#L1292) `Store/grantFullAccessClients` | `SQLite.prepare` (1292); `Store.sql` (1292) | CORE |
| [packages/store/src/store.ts:10128](../../packages/store/src/store.ts#L10128) `Store/groupSummariesCurrent` | `Store.groupSummaries` (10128); `Store.viewableIds` (10133); `Calculations.collect` (10149); `rowsById` (10149, 10199); `Calculations.collector` (10171) | GATED-STORE |
| [packages/store/src/store.ts:10197](../../packages/store/src/store.ts#L10197) `Store/groupSummariesCurrent/flush` | `Calculations.collector` (10197) | GATED-STORE |
| [packages/store/src/store.ts:10161](../../packages/store/src/store.ts#L10161) `Store/groupSummariesCurrent/key` | `Calculations.value` (10161); `Calculations.related` (10163) | GATED-STORE |
| [packages/store/src/store.ts:1319](../../packages/store/src/store.ts#L1319) `Store/hasOwnPassword` | `SQLite.get` (1319); `SQLite.prepare` (1319); `Store.sql` (1319) | CORE |
| [packages/store/src/store.ts:5322](../../packages/store/src/store.ts#L5322) `Store/hasPasskey` | `SQLite.get` (5322); `SQLite.prepare` (5322); `Store.sql` (5322) | CORE |
| [packages/store/src/store.ts:1300](../../packages/store/src/store.ts#L1300) `Store/hasProvingPassword` | `SQLite.get` (1300); `SQLite.prepare` (1300); `Store.sql` (1300) | CORE |
| [packages/store/src/store.ts:8264](../../packages/store/src/store.ts#L8264) `Store/hasTable` | `SQLite.get` (8264); `SQLite.prepare` (8264); `Store.sql` (8264) | CORE |
| [packages/store/src/store.ts:5186](../../packages/store/src/store.ts#L5186) `Store/hasTotp` | `SQLite.get` (5186); `SQLite.prepare` (5186); `Store.sql` (5186) | CORE |
| [packages/store/src/store.ts:4694](../../packages/store/src/store.ts#L4694) `Store/identityAllowed` | `SQLite.get` (4694, 4700, 4706); `SQLite.prepare` (4694, 4700, 4706); `Store.sql` (4694, 4700, 4706) | CORE |
| [packages/store/src/store.ts:6479](../../packages/store/src/store.ts#L6479) `Store/image` | `SQLite.get` (6479); `SQLite.prepare` (6479); `Store.sql` (6479) | CORE |
| [packages/store/src/store.ts:6489](../../packages/store/src/store.ts#L6489) `Store/images` | `SQLite.all` (6489); `SQLite.prepare` (6489); `Store.sql` (6489) | CORE |
| [packages/store/src/store.ts:4441](../../packages/store/src/store.ts#L4441) `Store/importAccounts` | `SQLite.all` (4441); `SQLite.prepare` (4441); `Store.sql` (4441) | CORE |
| [packages/store/src/store.ts:1583](../../packages/store/src/store.ts#L1583) `Store/independentWindowWrite` | `SQLite.get` (1583); `SQLite.prepare` (1583, 1613); `Store.sql` (1583, 1592, 1608, 1613, 1616) | CORE |
| [packages/store/src/store.ts:8276](../../packages/store/src/store.ts#L8276) `Store/indexedFields` | `SQLite.all` (8276, 8277); `SQLite.prepare` (8276, 8277); `Store.sql` (8276, 8277) | CORE |
| [packages/store/src/store.ts:10495](../../packages/store/src/store.ts#L10495) `Store/internalRoots` | `SQLite.get` (10495); `SQLite.prepare` (10495, 10497); `SQLite.all` (10497) | CORE |
| [packages/store/src/store.ts:3184](../../packages/store/src/store.ts#L3184) `Store/isAgent` | `SQLite.get` (3184); `SQLite.prepare` (3184); `Store.sql` (3184) | CORE |
| [packages/store/src/store.ts:3287](../../packages/store/src/store.ts#L3287) `Store/isExternal` | `SQLite.get` (3287); `SQLite.prepare` (3287); `Store.sql` (3287) | CORE |
| [packages/store/src/store.ts:5239](../../packages/store/src/store.ts#L5239) `Store/issueWebauthnChallenge` | `SQLite.prepare` (5239, 5241, 5242, 5244); `Store.sql` (5239, 5241, 5242, 5244); `SQLite.get` (5241) | CORE |
| [packages/store/src/store.ts:10402](../../packages/store/src/store.ts#L10402) `Store/iterateCommitted` | `SQLite.iterate` (10402) | CORE |
| [packages/store/src/store.ts:1552](../../packages/store/src/store.ts#L1552) `Store/joinTransaction` | `Store.sql` (1552, 1553, 1555, 1557, 1563) | CORE |
| [packages/store/src/store.ts:9885](../../packages/store/src/store.ts#L9885) `Store/keyStepWork` | `Store.sql` (9885, 9891, 9895, 9897) | CORE |
| [packages/store/src/store.ts:6346](../../packages/store/src/store.ts#L6346) `Store/knownSharedAccount` | `SQLite.get` (6346); `SQLite.prepare` (6346); `Store.sql` (6346) | CORE |
| [packages/store/src/store.ts:3914](../../packages/store/src/store.ts#L3914) `Store/lastSignIns` | `Store.auditLog` (3914) | CORE |
| [packages/store/src/store.ts:6519](../../packages/store/src/store.ts#L6519) `Store/layout` | `SQLite.get` (6519); `SQLite.prepare` (6519); `Store.sql` (6519) | CORE |
| [packages/store/src/store.ts:2865](../../packages/store/src/store.ts#L2865) `Store/layoutHistory` | `SQLite.all` (2865); `SQLite.prepare` (2865); `Store.sql` (2865) | CORE |
| [packages/store/src/store.ts:6409](../../packages/store/src/store.ts#L6409) `Store/layouts` | `SQLite.all` (6409); `SQLite.prepare` (6409); `Store.sql` (6409) | CORE |
| [packages/store/src/store.ts:4214](../../packages/store/src/store.ts#L4214) `Store/leastPrivilege` | `SQLite.all` (4214); `SQLite.prepare` (4214); `Store.sql` (4214) | CORE |
| [packages/store/src/store.ts:4778](../../packages/store/src/store.ts#L4778) `Store/ledgerRow` | `SQLite.get` (4778, 4779); `SQLite.prepare` (4778, 4779); `Store.sql` (4778, 4779) | AUTH |
| [packages/store/src/store.ts:4790](../../packages/store/src/store.ts#L4790) `Store/ledgerWrite` | `Store.sql` (4790, 4791, 4793, 4795, 4798, 4798) | AUTH |
| [packages/store/src/store.ts:4524](../../packages/store/src/store.ts#L4524) `Store/limitAccountImport` | `SQLite.prepare` (4524, 4525, 4528); `Store.sql` (4524, 4525, 4528); `SQLite.get` (4525) | CORE |
| [packages/store/src/store.ts:3137](../../packages/store/src/store.ts#L3137) `Store/linkIdentity` | `SQLite.get` (3137); `SQLite.prepare` (3137); `Store.sql` (3137) | CORE |
| [packages/store/src/store.ts:3129](../../packages/store/src/store.ts#L3129) `Store/linkPrincipal` | `SQLite.get` (3129); `SQLite.prepare` (3129); `Store.sql` (3129) | CORE |
| [packages/store/src/store.ts:2766](../../packages/store/src/store.ts#L2766) `Store/logSecurity` | `Store.sql` (2766) | CORE |
| [packages/store/src/store.ts:3800](../../packages/store/src/store.ts#L3800) `Store/markPiiField` | `SQLite.prepare` (3800); `Store.sql` (3800) | CORE |
| [packages/store/src/store.ts:7436](../../packages/store/src/store.ts#L7436) `Store/markRepeating` | `SQLite.prepare` (7436); `Store.sql` (7436) | CORE |
| [packages/store/src/store.ts:10335](../../packages/store/src/store.ts#L10335) `Store/matchIds` | `Store.matchIds` (10335); `SQLite.all` (10341); `SQLite.prepare` (10341); `Store.sql` (10341) | CORE |
| [packages/store/src/store.ts:1334](../../packages/store/src/store.ts#L1334) `Store/meta` | `SQLite.get` (1334); `SQLite.prepare` (1334); `Store.sql` (1334) | CORE |
| [packages/store/src/store.ts:924](../../packages/store/src/store.ts#L924) `Store/metadataVersions` | `SQLite.get` (924); `SQLite.prepare` (924); `Store.sql` (924) | CORE |
| [packages/store/src/store.ts:8073](../../packages/store/src/store.ts#L8073) `Store/moveContainersIn` | `Store.sql` (8073, 8079, 8081, 8082, 8083, 8084, 8104, 8109, 8109, 8120, 8123, 8126, 8133); `SQLite.prepare` (8081, 8082, 8083, 8084, 8120, 8126); `SQLite.get` (8086, 8120, 8126) | CORE |
| [packages/store/src/store.ts:7995](../../packages/store/src/store.ts#L7995) `Store/moveContainersOut` | `Store.sql` (7995, 8003, 8005, 8007, 8012, 8013, 8033, 8039, 8041, 8043, 8043, 8049, 8049, 8054, 8056, 8058, 8058, 8064); `SQLite.get` (8003); `SQLite.prepare` (8003, 8012, 8013); `Store.container` (8015) | CORE |
| [packages/store/src/store.ts:4395](../../packages/store/src/store.ts#L4395) `Store/mustChangePassword` | `SQLite.get` (4395); `SQLite.prepare` (4395); `Store.sql` (4395) | CORE |
| [packages/store/src/store.ts:1270](../../packages/store/src/store.ts#L1270) `Store/nativeIdGuards` | `Store.sql` (1270, 1271, 1273) | CORE |
| [packages/store/src/store.ts:5066](../../packages/store/src/store.ts#L5066) `Store/objectUseSince` | `SQLite.get` (5066); `SQLite.prepare` (5066); `Store.sql` (5066) | CORE |
| [packages/store/src/store.ts:8236](../../packages/store/src/store.ts#L8236) `Store/orderBy` | `Store.valueListItems` (8236) | CORE |
| [packages/store/src/store.ts:7628](../../packages/store/src/store.ts#L7628) `Store/orphanContainerReport` | `SQLite.all` (7628); `SQLite.prepare` (7628); `Store.sql` (7628) | CORE |
| [packages/store/src/store.ts:5291](../../packages/store/src/store.ts#L5291) `Store/passkeyAllowList` | `SQLite.all` (5291); `SQLite.prepare` (5291); `Store.sql` (5291) | CORE |
| [packages/store/src/store.ts:5327](../../packages/store/src/store.ts#L5327) `Store/passkeyIds` | `SQLite.all` (5327); `SQLite.prepare` (5327); `Store.sql` (5327) | CORE |
| [packages/store/src/store.ts:5315](../../packages/store/src/store.ts#L5315) `Store/passkeys` | `SQLite.all` (5315); `SQLite.prepare` (5315); `Store.sql` (5315) | CORE |
| [packages/store/src/store.ts:4434](../../packages/store/src/store.ts#L4434) `Store/passwordDaysRemaining` | `SQLite.get` (4434); `SQLite.prepare` (4434); `Store.sql` (4434) | CORE |
| [packages/store/src/store.ts:3372](../../packages/store/src/store.ts#L3372) `Store/pendingChanges` | `SQLite.all` (3372); `SQLite.prepare` (3372); `Store.sql` (3372) | CORE |
| [packages/store/src/store.ts:1352](../../packages/store/src/store.ts#L1352) `Store/persistentData` | `SQLite.get` (1352) | CORE |
| [packages/store/src/store.ts:1361](../../packages/store/src/store.ts#L1361) `Store/persistentDataIds` | `SQLite.all` (1361) | CORE |
| [packages/store/src/store.ts:1342](../../packages/store/src/store.ts#L1342) `Store/persistentTable` | `Store.sql` (1342) | CORE |
| [packages/store/src/store.ts:9576](../../packages/store/src/store.ts#L9576) `Store/portalContainerTarget` | `Store.row` (9576); `relatedIdList` (9578) | CORE |
| [packages/store/src/store.ts:7060](../../packages/store/src/store.ts#L7060) `Store/portalCountsCurrent` | `Store.canView` (7060); `Store.row` (7087) | GATED-STORE |
| [packages/store/src/store.ts:7298](../../packages/store/src/store.ts#L7298) `Store/portalRows` | `relatedRows` (7298); `relatedIdList` (7299); `Store.viewableIds` (7302); `rowsById` (7327, 7365); `Calculations.related` (7341) | CORE |
| [packages/store/src/store.ts:7309](../../packages/store/src/store.ts#L7309) `Store/portalRows/context` | `Calculations.context` (7309) | CORE |
| [packages/store/src/store.ts:7319](../../packages/store/src/store.ts#L7319) `Store/portalRows/valueOf` | `Calculations.value` (7319) | CORE |
| [packages/store/src/store.ts:2299](../../packages/store/src/store.ts#L2299) `Store/prepared` | `SQLite.prepare` (2299); `Store.sql` (2299) | CORE |
| [packages/store/src/store.ts:4506](../../packages/store/src/store.ts#L4506) `Store/previewAccountImport` | `Store.sql` (4506, 4507, 4516) | CORE |
| [packages/store/src/store.ts:6110](../../packages/store/src/store.ts#L6110) `Store/previewRecordRuleCurrent` | `SQLite.get` (6110); `SQLite.prepare` (6110, 6113); `Store.sql` (6110, 6113); `SQLite.all` (6113); `Calculations.context` (6119, 6135) | CORE |
| [packages/store/src/store.ts:8752](../../packages/store/src/store.ts#L8752) `Store/previewRow` | `Store.row` (8752) | CORE |
| [packages/store/src/store.ts:5542](../../packages/store/src/store.ts#L5542) `Store/privilegeSets` | `Store.sql` (5542) | CORE |
| [packages/store/src/store.ts:2510](../../packages/store/src/store.ts#L2510) `Store/pruneAudit` | `Store.sql` (2510, 2512, 2514); `SQLite.get` (2512); `SQLite.prepare` (2512) | CORE |
| [packages/store/src/store.ts:7663](../../packages/store/src/store.ts#L7663) `Store/purgeOrphanContainers` | `Store.sql` (7663, 7667, 7676, 7679, 7680, 7685, 7686, 7688, 7688); `Store.orphanContainerReport` (7671); `SQLite.get` (7676); `SQLite.prepare` (7676, 7679, 7680) | CORE |
| [packages/store/src/store.ts:10601](../../packages/store/src/store.ts#L10601) `Store/query` | `SQLite.iterate` (10601) | CORE |
| [packages/store/src/store.ts:10640](../../packages/store/src/store.ts#L10640) `Store/queryWithOriginsCurrent` | `SQLite.iterate` (10640); `SQLite.all` (10649, 10652); `SQLite.prepare` (10649, 10652) | CORE |
| [packages/store/src/store.ts:10436](../../packages/store/src/store.ts#L10436) `Store/readOnlyChecked` | `SQLite.prepare` (10436, 10440, 10449, 10454); `SQLite.all` (10440, 10449, 10454) | CORE |
| [packages/store/src/store.ts:3109](../../packages/store/src/store.ts#L3109) `Store/recompute` | `SQLite.prepare` (3109, 3113); `Store.sql` (3109, 3113); `SQLite.iterate` (3113); `Calculations.computeStoredStyled` (3114); `Calculations.value` (3114) | CORE |
| [packages/store/src/store.ts:2314](../../packages/store/src/store.ts#L2314) `Store/recordAsOf` | `SQLite.get` (2314, 2316); `SQLite.prepare` (2314, 2316, 2318, 2319); `Store.sql` (2314, 2316, 2318, 2319); `SQLite.all` (2318, 2319) | CORE |
| [packages/store/src/store.ts:2017](../../packages/store/src/store.ts#L2017) `Store/recordCount` | `SQLite.get` (2017); `SQLite.prepare` (2017); `Store.sql` (2017) | CORE |
| [packages/store/src/store.ts:4997](../../packages/store/src/store.ts#L4997) `Store/recordObjectUse` | `Store.sql` (4997) | CORE |
| [packages/store/src/store.ts:9278](../../packages/store/src/store.ts#L9278) `Store/recordViewable` | `Store.row` (9278) | GATED-STORE |
| [packages/store/src/store.ts:1399](../../packages/store/src/store.ts#L1399) `Store/recordedFormat` | `Store.sql` (1399) | CORE |
| [packages/store/src/store.ts:7967](../../packages/store/src/store.ts#L7967) `Store/recoverContainersOut` | `SQLite.prepare` (7967); `Store.sql` (7967); `SQLite.get` (7970) | CORE |
| [packages/store/src/store.ts:1481](../../packages/store/src/store.ts#L1481) `Store/recoverPendingExternalFiles` | `Store.sql` (1481, 1483, 1507, 1509); `SQLite.prepare` (1483); `SQLite.get` (1494) | CORE |
| [packages/store/src/store.ts:5485](../../packages/store/src/store.ts#L5485) `Store/recoveryCodesRemaining` | `SQLite.get` (5485); `SQLite.prepare` (5485); `Store.sql` (5485) | CORE |
| [packages/store/src/store.ts:10476](../../packages/store/src/store.ts#L10476) `Store/refreshDecimalSqlViews` | `SQLite.get` (10476); `SQLite.prepare` (10476, 10481); `SQLite.all` (10481) | CORE |
| [packages/store/src/store.ts:3278](../../packages/store/src/store.ts#L3278) `Store/refuseLookalikeAccount` | `SQLite.all` (3278); `SQLite.prepare` (3278); `Store.sql` (3278) | CORE |
| [packages/store/src/store.ts:5351](../../packages/store/src/store.ts#L5351) `Store/registerPasskey` | `SQLite.prepare` (5351); `Store.sql` (5351) | CORE |
| [packages/store/src/store.ts:3407](../../packages/store/src/store.ts#L3407) `Store/rejectPending` | `SQLite.get` (3407); `SQLite.prepare` (3407, 3409); `Store.sql` (3407, 3409) | CORE |
| [packages/store/src/store.ts:8504](../../packages/store/src/store.ts#L8504) `Store/relatedCriteria` | `SQLite.iterate` (8504); `SQLite.prepare` (8504); `Store.sql` (8504) | CORE |
| [packages/store/src/store.ts:8501](../../packages/store/src/store.ts#L8501) `Store/relatedCriteria/matched` | `relatedRows` (8501) | CORE |
| [packages/store/src/store.ts:6847](../../packages/store/src/store.ts#L6847) `Store/relatedValues` | `Calculations.globalValue` (6847); `Calculations.unstoredValue` (6849) | CORE |
| [packages/store/src/store.ts:5364](../../packages/store/src/store.ts#L5364) `Store/removePasskey` | `SQLite.get` (5364); `SQLite.prepare` (5364, 5365); `Store.sql` (5364, 5365) | CORE |
| [packages/store/src/store.ts:9723](../../packages/store/src/store.ts#L9723) `Store/restoreDeletedRowLocked` | `SQLite.get` (9723, 9728); `SQLite.prepare` (9723, 9724, 9728, 9738); `Store.sql` (9723, 9724, 9728, 9738); `SQLite.all` (9724) | CORE |
| [packages/store/src/store.ts:2349](../../packages/store/src/store.ts#L2349) `Store/restoreRecord` | `Store.recordAsOf` (2349); `SQLite.get` (2353); `SQLite.prepare` (2353, 2358, 2367, 2378); `Store.sql` (2353, 2358, 2367, 2378) | CORE |
| [packages/store/src/store.ts:2393](../../packages/store/src/store.ts#L2393) `Store/revertAuditEntry` | `Store.auditLog` (2393) | CORE |
| [packages/store/src/store.ts:5122](../../packages/store/src/store.ts#L5122) `Store/revokeApiToken` | `SQLite.prepare` (5122); `Store.sql` (5122) | CORE |
| [packages/store/src/store.ts:8770](../../packages/store/src/store.ts#L8770) `Store/row` | `SQLite.get` (8770) | CORE |
| [packages/store/src/store.ts:10540](../../packages/store/src/store.ts#L10540) `Store/rowsOf` | `SQLite.iterate` (10540, 10548) | CORE |
| [packages/store/src/store.ts:5936](../../packages/store/src/store.ts#L5936) `Store/ruleOutcome` | `Calculations.context` (5936) | CORE |
| [packages/store/src/store.ts:8615](../../packages/store/src/store.ts#L8615) `Store/runningSummaryValues` | `Store.viewableIds` (8615); `rowsById` (8617); `Calculations.value` (8628, 8634); `Calculations.related` (8645) | GATED-STORE |
| [packages/store/src/store.ts:5571](../../packages/store/src/store.ts#L5571) `Store/savePrivilegeSet` | `SQLite.prepare` (5571, 5579); `Store.sql` (5571, 5579) | AUTH |
| [packages/store/src/store.ts:3631](../../packages/store/src/store.ts#L3631) `Store/saveScriptTest` | `SQLite.prepare` (3631); `Store.sql` (3631) | CORE |
| [packages/store/src/store.ts:6075](../../packages/store/src/store.ts#L6075) `Store/scopedTableSql` | `Store.viewableIds` (6075); `SQLite.all` (6078); `SQLite.prepare` (6078); `Store.sql` (6078) | GATED-STORE |
| [packages/store/src/store.ts:2855](../../packages/store/src/store.ts#L2855) `Store/scriptHistory` | `SQLite.all` (2855); `SQLite.prepare` (2855); `Store.sql` (2855) | CORE |
| [packages/store/src/store.ts:2685](../../packages/store/src/store.ts#L2685) `Store/securityChange` | `Store.sql` (2685, 2687); `SQLite.prepare` (2687) | CORE |
| [packages/store/src/store.ts:2273](../../packages/store/src/store.ts#L2273) `Store/securityEvents` | `Store.auditLog` (2273) | CORE |
| [packages/store/src/store.ts:4846](../../packages/store/src/store.ts#L4846) `Store/securityToken` | `SQLite.get` (4846); `SQLite.prepare` (4846); `Store.sql` (4846) | CORE |
| [packages/store/src/store.ts:10567](../../packages/store/src/store.ts#L10567) `Store/selectHeldCurrent` | `Store.sql` (10567, 10568, 10570); `SQLite.prepare` (10568) | CORE |
| [packages/store/src/store.ts:10028](../../packages/store/src/store.ts#L10028) `Store/selectIdsCurrent` | `Store.selectIds` (10028); `SQLite.all` (10034); `SQLite.prepare` (10034); `Store.sql` (10034) | GATED-STORE |
| [packages/store/src/store.ts:10559](../../packages/store/src/store.ts#L10559) `Store/selectIn` | `Store.select` (10559) | CORE |
| [packages/store/src/store.ts:1764](../../packages/store/src/store.ts#L1764) `Store/selfContainedCopy` | `Store.sql` (1764); `SQLite.all` (1769); `SQLite.prepare` (1769, 1771, 1772, 1773) | CORE |
| [packages/store/src/store.ts:4675](../../packages/store/src/store.ts#L4675) `Store/setAccountActive` | `SQLite.prepare` (4675, 4678, 4679); `Store.sql` (4675, 4678, 4679) | AUTH |
| [packages/store/src/store.ts:4865](../../packages/store/src/store.ts#L4865) `Store/setAccountLocalOnly` | `SQLite.prepare` (4865); `Store.sql` (4865) | CORE |
| [packages/store/src/store.ts:5727](../../packages/store/src/store.ts#L5727) `Store/setAccountPrivilegeSet` | `SQLite.get` (5727); `SQLite.prepare` (5727, 5730, 5734); `Store.sql` (5727, 5730, 5734) | AUTH |
| [packages/store/src/store.ts:4874](../../packages/store/src/store.ts#L4874) `Store/setAccountRequire2fa` | `SQLite.prepare` (4874); `Store.sql` (4874) | CORE |
| [packages/store/src/store.ts:3308](../../packages/store/src/store.ts#L3308) `Store/setAgentAccount` | `SQLite.get` (3308); `SQLite.prepare` (3308, 3314); `Store.sql` (3308, 3314) | CORE |
| [packages/store/src/store.ts:3675](../../packages/store/src/store.ts#L3675) `Store/setAiAllowed` | `SQLite.prepare` (3675); `Store.sql` (3675) | CORE |
| [packages/store/src/store.ts:3758](../../packages/store/src/store.ts#L3758) `Store/setAiPolicy` | `SQLite.prepare` (3758); `Store.sql` (3758) | CORE |
| [packages/store/src/store.ts:6333](../../packages/store/src/store.ts#L6333) `Store/setAllowBlankPasswordFromLan` | `SQLite.prepare` (6333); `Store.sql` (6333) | CORE |
| [packages/store/src/store.ts:2488](../../packages/store/src/store.ts#L2488) `Store/setAuditSettings` | `SQLite.prepare` (2488); `Store.sql` (2488) | CORE |
| [packages/store/src/store.ts:8186](../../packages/store/src/store.ts#L8186) `Store/setContainer` | `Store.sql` (8186, 8203); `Store.row` (8192); `SQLite.prepare` (8203) | CORE |
| [packages/store/src/store.ts:3260](../../packages/store/src/store.ts#L3260) `Store/setExternalAccount` | `SQLite.get` (3260); `SQLite.prepare` (3260, 3265); `Store.sql` (3260, 3265) | CORE |
| [packages/store/src/store.ts:4381](../../packages/store/src/store.ts#L4381) `Store/setMustChangePassword` | `SQLite.prepare` (4381); `Store.sql` (4381) | CORE |
| [packages/store/src/store.ts:3460](../../packages/store/src/store.ts#L3460) `Store/setPassword` | `SQLite.get` (3460); `SQLite.prepare` (3460, 3466, 3475, 3482, 3483, 3484); `Store.sql` (3460, 3466, 3475, 3482, 3483, 3484) | AUTH |
| [packages/store/src/store.ts:3572](../../packages/store/src/store.ts#L3572) `Store/setPasswordPolicy` | `SQLite.prepare` (3572); `Store.sql` (3572) | CORE |
| [packages/store/src/store.ts:1367](../../packages/store/src/store.ts#L1367) `Store/setPersistentData` | `SQLite.prepare` (1367, 1371); `Store.sql` (1367, 1371) | CORE |
| [packages/store/src/store.ts:3778](../../packages/store/src/store.ts#L3778) `Store/setPiiIsolation` | `SQLite.prepare` (3778); `Store.sql` (3778) | CORE |
| [packages/store/src/store.ts:3608](../../packages/store/src/store.ts#L3608) `Store/setRequireTotpForFullAccess` | `SQLite.prepare` (3608); `Store.sql` (3608) | CORE |
| [packages/store/src/store.ts:3690](../../packages/store/src/store.ts#L3690) `Store/setScriptNetwork` | `SQLite.prepare` (3690); `Store.sql` (3690) | CORE |
| [packages/store/src/store.ts:3747](../../packages/store/src/store.ts#L3747) `Store/setSqlRequiresFmxdbc` | `SQLite.prepare` (3747); `Store.sql` (3747) | CORE |
| [packages/store/src/store.ts:9199](../../packages/store/src/store.ts#L9199) `Store/setStoredCalcValues` | `SQLite.prepare` (9199, 9200); `Store.sql` (9199, 9200); `SQLite.get` (9204) | CORE |
| [packages/store/src/store.ts:8268](../../packages/store/src/store.ts#L8268) `Store/setUserPref` | `Store.sql` (8268, 8269, 8270); `SQLite.prepare` (8269, 8270) | CORE |
| [packages/store/src/store.ts:3731](../../packages/store/src/store.ts#L3731) `Store/setWebViewerHosts` | `SQLite.prepare` (3731); `Store.sql` (3731) | CORE |
| [packages/store/src/store.ts:4817](../../packages/store/src/store.ts#L4817) `Store/settleSignIns` | `SQLite.all` (4817, 4823); `SQLite.prepare` (4817, 4823, 4829, 4833, 4835); `Store.sql` (4817, 4823, 4829, 4833, 4835) | AUTH |
| [packages/store/src/store.ts:1895](../../packages/store/src/store.ts#L1895) `Store/shareResults` | `Store.sql` (1895) | CORE |
| [packages/store/src/store.ts:1425](../../packages/store/src/store.ts#L1425) `Store/shipWal` | `Store.sql` (1425) | CORE |
| [packages/store/src/store.ts:4764](../../packages/store/src/store.ts#L4764) `Store/signInBase` | `SQLite.get` (4764); `SQLite.prepare` (4764); `Store.sql` (4764) | AUTH |
| [packages/store/src/store.ts:4766](../../packages/store/src/store.ts#L4766) `Store/signInBase/identity` | `SQLite.get` (4766); `SQLite.prepare` (4766); `Store.sql` (4766) | AUTH |
| [packages/store/src/store.ts:4754](../../packages/store/src/store.ts#L4754) `Store/signInMark` | `SQLite.prepare` (4754); `Store.sql` (4754) | AUTH |
| [packages/store/src/store.ts:10253](../../packages/store/src/store.ts#L10253) `Store/sortIdsCurrentProgress` | `SQLite.all` (10253); `SQLite.prepare` (10253, 10321); `Store.sql` (10253, 10321); `Store.valueListItems` (10261); `rowsById` (10273); `Calculations.globalValue` (10276); `Calculations.unstoredValue` (10277); `Calculations.related` (10283); `SQLite.iterate` (10321) | GATED-STORE |
| [packages/store/src/store.ts:8429](../../packages/store/src/store.ts#L8429) `Store/sortedPage` | `SQLite.iterate` (8429); `SQLite.prepare` (8429, 8444); `Store.sql` (8429, 8444); `SQLite.all` (8444) | CORE |
| [packages/store/src/store.ts:8577](../../packages/store/src/store.ts#L8577) `Store/summaries` | `Calculations.wholeTable` (8577); `Calculations.collect` (8597, 8602) | CORE |
| [packages/store/src/store.ts:8593](../../packages/store/src/store.ts#L8593) `Store/summaries/recs` | `SQLite.iterate` (8593); `SQLite.prepare` (8593); `Store.sql` (8593) | CORE |
| [packages/store/src/store.ts:5305](../../packages/store/src/store.ts#L5305) `Store/takeWebauthnChallenge` | `SQLite.get` (5305); `SQLite.prepare` (5305, 5307); `Store.sql` (5305, 5307) | CORE |
| [packages/store/src/store.ts:8321](../../packages/store/src/store.ts#L8321) `Store/timeFind` | `Store.query` (8321, 8325, 8326); `Store.recordCount` (8328) | CORE |
| [packages/store/src/store.ts:6788](../../packages/store/src/store.ts#L6788) `Store/toRecord` | `Calculations.value` (6788, 6798); `Calculations.globalValue` (6792); `Calculations.unstoredStyled` (6797) | CORE |
| [packages/store/src/store.ts:5191](../../packages/store/src/store.ts#L5191) `Store/totpAccounts` | `SQLite.all` (5191); `SQLite.prepare` (5191); `Store.sql` (5191) | CORE |
| [packages/store/src/store.ts:1436](../../packages/store/src/store.ts#L1436) `Store/trial` | `Store.sql` (1436) | CORE |
| [packages/store/src/store.ts:1441](../../packages/store/src/store.ts#L1441) `Store/trial/undo` | `Store.sql` (1441) | CORE |
| [packages/store/src/store.ts:10363](../../packages/store/src/store.ts#L10363) `Store/truncate/run` | `Store.sql` (10363, 10365, 10372, 10374, 10376, 10377); `SQLite.prepare` (10365, 10372); `SQLite.all` (10367) | CORE |
| [packages/store/src/store.ts:3207](../../packages/store/src/store.ts#L3207) `Store/unmigratedAccounts` | `SQLite.all` (3207); `SQLite.prepare` (3207); `Store.sql` (3207) | CORE |
| [packages/store/src/store.ts:4287](../../packages/store/src/store.ts#L4287) `Store/unusedAccess` | `SQLite.get` (4287); `SQLite.prepare` (4287, 4296); `Store.sql` (4287, 4296); `SQLite.all` (4296) | CORE |
| [packages/store/src/store.ts:4335](../../packages/store/src/store.ts#L4335) `Store/unusedObjects` | `SQLite.get` (4335); `SQLite.prepare` (4335, 4338); `Store.sql` (4335, 4338); `SQLite.all` (4338) | CORE |
| [packages/store/src/store.ts:5426](../../packages/store/src/store.ts#L5426) `Store/unusedRecoveryHashes` | `SQLite.all` (5426); `SQLite.prepare` (5426); `Store.sql` (5426) | CORE |
| [packages/store/src/store.ts:4117](../../packages/store/src/store.ts#L4117) `Store/unusualAccess` | `Store.auditLog` (4117, 4183) | CORE |
| [packages/store/src/store.ts:9021](../../packages/store/src/store.ts#L9021) `Store/update` | `Store.row` (9021); `Store.sql` (9051, 9052, 9091, 9094) | CORE |
| [packages/store/src/store.ts:9054](../../packages/store/src/store.ts#L9054) `Store/update/undo` | `Store.sql` (9054) | CORE |
| [packages/store/src/store.ts:9484](../../packages/store/src/store.ts#L9484) `Store/updatePortals` | `Store.row` (9484, 9520); `relatedRows` (9521) | CORE |
| [packages/store/src/store.ts:9494](../../packages/store/src/store.ts#L9494) `Store/updatePortals/portal/related` | `relatedIdList` (9494) | CORE |
| [packages/store/src/store.ts:9466](../../packages/store/src/store.ts#L9466) `Store/updateRelated` | `relatedRows` (9466) | CORE |
| [packages/store/src/store.ts:4373](../../packages/store/src/store.ts#L4373) `Store/usageCounting` | `SQLite.get` (4373); `SQLite.prepare` (4373); `Store.sql` (4373) | CORE |
| [packages/store/src/store.ts:8259](../../packages/store/src/store.ts#L8259) `Store/userPrefs` | `SQLite.all` (8259); `SQLite.prepare` (8259); `Store.sql` (8259) | CORE |
| [packages/store/src/store.ts:7169](../../packages/store/src/store.ts#L7169) `Store/valueListItemsCurrent` | `Store.valueListItems` (7169); `Store.get` (7183); `relatedRows` (7184); `Store.row` (7184); `SQLite.iterate` (7186); `SQLite.prepare` (7186); `Store.sql` (7186); `Calculations.related` (7196); `Calculations.value` (7200, 7201) | GATED-STORE |
| [packages/store/src/store.ts:9676](../../packages/store/src/store.ts#L9676) `Store/vaultHeld` | `SQLite.get` (9676); `SQLite.prepare` (9676); `Store.sql` (9676) | CORE |
| [packages/store/src/store.ts:5220](../../packages/store/src/store.ts#L5220) `Store/verifyTotp` | `SQLite.get` (5220); `SQLite.prepare` (5220, 5226); `Store.sql` (5220, 5226) | CORE |
| [packages/store/src/store.ts:1950](../../packages/store/src/store.ts#L1950) `Store/versionNumber` | `SQLite.get` (1950); `SQLite.prepare` (1950); `Store.sql` (1950) | CORE |
| [packages/store/src/store.ts:1906](../../packages/store/src/store.ts#L1906) `Store/versionTriggers` | `SQLite.get` (1906); `SQLite.prepare` (1906, 1911, 1912); `Store.sql` (1906, 1911, 1912, 1929, 1931, 1932, 1934); `SQLite.all` (1911, 1912) | CORE |
| [packages/store/src/store.ts:1874](../../packages/store/src/store.ts#L1874) `Store/warmSummariesCurrent` | `Calculations.wholeTable` (1874) | CORE |
| [packages/store/src/store.ts:3713](../../packages/store/src/store.ts#L3713) `Store/webViewerChecked` | `SQLite.get` (3713); `SQLite.prepare` (3713); `Store.sql` (3713) | CORE |
| [packages/store/src/store.ts:1645](../../packages/store/src/store.ts#L1645) `Store/withWriteTransaction` | `Store.sql` (1645, 1656, 1662, 1664, 1664) | CORE |
| [packages/store/src/store.ts:6723](../../packages/store/src/store.ts#L6723) `Store/wordIndex` | `Store.sql` (6723, 6731, 6736); `Store.recordCount` (6735); `SQLite.get` (6736); `SQLite.prepare` (6736) | CORE |
| [packages/store/src/store.ts:7860](../../packages/store/src/store.ts#L7860) `Store/writeExternalFile` | `Store.evaluateEach` (7860); `SQLite.prepare` (7883); `Store.sql` (7883) | CORE |
| [packages/store/src/store.ts:7884](../../packages/store/src/store.ts#L7884) `Store/writeExternalFile/taken` | `SQLite.get` (7884) | CORE |
| [packages/store/src/store.ts:5055](../../packages/store/src/store.ts#L5055) `Store/writeObjectUseRows` | `SQLite.prepare` (5055, 5056, 5061); `Store.sql` (5055, 5056, 5061) | CORE |
| [packages/store/src/store.ts:2005](../../packages/store/src/store.ts#L2005) `Store/writeToken` | `SQLite.get` (2005); `SQLite.prepare` (2005); `Store.sql` (2005) | CORE |
| [packages/store/src/store.ts:5027](../../packages/store/src/store.ts#L5027) `Store/writeUsage` | `Store.sql` (5027, 5028, 5030, 5034, 5036) | CORE |
| [packages/store/src/store.ts:5043](../../packages/store/src/store.ts#L5043) `Store/writeUsageRows` | `SQLite.prepare` (5043, 5044, 5050); `Store.sql` (5043, 5044, 5050) | CORE |
| [packages/store/src/store.ts:6444](../../packages/store/src/store.ts#L6444) `Store/design` | `SQLite.get` (6444) | CORE |
| [packages/store/src/store.ts:6466](../../packages/store/src/store.ts#L6466) `Store/themes` | `SQLite.get` (6466) | CORE |
| [packages/store/src/store.ts:5386](../../packages/store/src/store.ts#L5386) `Store/verifyPasskeyCredential` | `SQLite.get` (5386); `SQLite.prepare` (5386, 5398); `Store.sql` (5386, 5398) | CORE |
| [packages/store/src/store.ts:6304](../../packages/store/src/store.ts#L6304) `Store/passwordState` | `SQLite.get` (6304); `SQLite.prepare` (6304); `Store.sql` (6304) | CORE |
| [packages/store/src/store.ts:9619](../../packages/store/src/store.ts#L9619) `Store/deleteVisibility` | `Store.canViewRecord` (9619) | CORE |
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
