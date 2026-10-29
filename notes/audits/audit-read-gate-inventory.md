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
| [packages/cli/src/main.ts:711](../../packages/cli/src/main.ts#L711) `accountsWithPasswordOff` | `SQLite.all` (711); `SQLite.prepare` (711) | OPERATOR |
| [packages/cli/src/main.ts:740](../../packages/cli/src/main.ts#L740) `hostedRead` | `SQLite.all` (740, 743); `SQLite.prepare` (740, 743); `Store.sql` (740, 743) | OPERATOR |
| [packages/cli/src/main.ts:2411](../../packages/cli/src/main.ts#L2411) `main` | `Store.orphanContainerReport` (2411); `Store.auditLog` (2884); `SQLite.get` (3143); `SQLite.prepare` (3143) | OPERATOR |
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
| [packages/server/src/admin.ts:2368](../../packages/server/src/admin.ts#L2368) `Admin/audit` | `Store.auditLog` (2368) | ADMIN |
| [packages/server/src/admin.ts:1089](../../packages/server/src/admin.ts#L1089) `Admin/handle` | `Store.externalContainerReport` (1089); `Store.orphanContainerReport` (1094, 1098) | ADMIN |
| [packages/server/src/admin.ts:2808](../../packages/server/src/admin.ts#L2808) `Admin/status` | `Store.externalContainerCount` (2808) | ADMIN |
| [packages/server/src/admin.ts:2451](../../packages/server/src/admin.ts#L2451) `Admin/viewAs` | `Store.find` (2451) | ADMIN |
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
| [packages/store/src/store.ts:5239](../../packages/store/src/store.ts#L5239) `Store/accountIdentityId` | `SQLite.get` (5239, 5245); `SQLite.prepare` (5239, 5244, 5245); `Store.sql` (5239, 5244, 5245) | CORE |
| [packages/store/src/store.ts:5233](../../packages/store/src/store.ts#L5233) `Store/accountIdentityIdIfSet` | `SQLite.get` (5233); `SQLite.prepare` (5233); `Store.sql` (5233) | CORE |
| [packages/store/src/store.ts:5195](../../packages/store/src/store.ts#L5195) `Store/accountInactive` | `SQLite.get` (5195); `SQLite.prepare` (5195); `Store.sql` (5195) | CORE |
| [packages/store/src/store.ts:5392](../../packages/store/src/store.ts#L5392) `Store/accountLocalOnly` | `SQLite.get` (5392); `SQLite.prepare` (5392); `Store.sql` (5392) | CORE |
| [packages/store/src/store.ts:6261](../../packages/store/src/store.ts#L6261) `Store/accountPrivilegeSet` | `SQLite.get` (6261); `SQLite.prepare` (6261); `Store.sql` (6261) | CORE |
| [packages/store/src/store.ts:5397](../../packages/store/src/store.ts#L5397) `Store/accountRequires2fa` | `SQLite.get` (5397); `SQLite.prepare` (5397); `Store.sql` (5397) | CORE |
| [packages/store/src/store.ts:5617](../../packages/store/src/store.ts#L5617) `Store/accountUsage` | `SQLite.get` (5617); `SQLite.prepare` (5617, 5618); `Store.sql` (5617, 5618); `SQLite.all` (5618); `Store.auditLog` (5634) | CORE |
| [packages/store/src/store.ts:3652](../../packages/store/src/store.ts#L3652) `Store/accounts` | `SQLite.all` (3652); `SQLite.prepare` (3652); `Store.sql` (3652) | CORE |
| [packages/store/src/store.ts:3648](../../packages/store/src/store.ts#L3648) `Store/accountsSharingLockout` | `SQLite.all` (3648); `SQLite.prepare` (3648); `Store.sql` (3648) | CORE |
| [packages/store/src/store.ts:8373](../../packages/store/src/store.ts#L8373) `Store/addContainer` | `SQLite.all` (8373); `SQLite.prepare` (8373, 8378, 8392, 8396, 8397); `Store.sql` (8373, 8378, 8392, 8394, 8396, 8397, 8399, 8402); `SQLite.get` (8383); `Store.containerRange` (8385) | CORE |
| [packages/store/src/store.ts:8419](../../packages/store/src/store.ts#L8419) `Store/addExternalContainer` | `SQLite.prepare` (8419); `Store.sql` (8419) | CORE |
| [packages/store/src/store.ts:8896](../../packages/store/src/store.ts#L8896) `Store/addFieldIndex` | `Store.sql` (8896) | CORE |
| [packages/store/src/store.ts:7072](../../packages/store/src/store.ts#L7072) `Store/addImage` | `Store.sql` (7072, 7073); `SQLite.prepare` (7073) | CORE |
| [packages/store/src/store.ts:6311](../../packages/store/src/store.ts#L6311) `Store/addProvisionedAccount` | `SQLite.get` (6311); `SQLite.prepare` (6311, 6315); `Store.sql` (6311, 6315) | CORE |
| [packages/store/src/store.ts:7491](../../packages/store/src/store.ts#L7491) `Store/addRelated` | `relatedRows` (7491); `rowsById` (7524); `firstRelatedEach` (7547) | CORE |
| [packages/store/src/store.ts:3670](../../packages/store/src/store.ts#L3670) `Store/agentNeedsApproval` | `SQLite.get` (3670); `SQLite.prepare` (3670); `Store.sql` (3670) | CORE |
| [packages/store/src/store.ts:6525](../../packages/store/src/store.ts#L6525) `Store/allowedIds` | `SQLite.iterate` (6525); `SQLite.prepare` (6525); `Store.sql` (6525) | CORE |
| [packages/store/src/store.ts:5674](../../packages/store/src/store.ts#L5674) `Store/apiToken` | `SQLite.get` (5674); `SQLite.prepare` (5674, 5692); `Store.sql` (5674, 5692) | CORE |
| [packages/store/src/store.ts:5650](../../packages/store/src/store.ts#L5650) `Store/apiTokens` | `SQLite.all` (5650); `SQLite.prepare` (5650); `Store.sql` (5650) | CORE |
| [packages/store/src/store.ts:3111](../../packages/store/src/store.ts#L3111) `Store/appendSecurityRow` | `Store.sql` (3111) | CORE |
| [packages/store/src/store.ts:4010](../../packages/store/src/store.ts#L4010) `Store/appendSecurityEvent` | `Store.sql` (4010) | CORE |
| [packages/store/src/store.ts:5015](../../packages/store/src/store.ts#L5015) `Store/applyAccountImport` | `Store.sql` (5015, 5023, 5052); `SQLite.get` (5023); `SQLite.prepare` (5023, 5052) | CORE |
| [packages/store/src/store.ts:2426](../../packages/store/src/store.ts#L2426) `Store/applyDesign` | `Store.sql` (2426, 2427, 2440, 2443, 2448, 2464, 2467, 2467); `SQLite.prepare` (2443, 2448) | CORE |
| [packages/store/src/store.ts:3866](../../packages/store/src/store.ts#L3866) `Store/approvePending` | `SQLite.get` (3866); `SQLite.prepare` (3866, 3877); `Store.sql` (3866, 3877) | CORE |
| [packages/store/src/store.ts:2906](../../packages/store/src/store.ts#L2906) `Store/audit` | `Store.sql` (2906) | CORE |
| [packages/store/src/store.ts:2528](../../packages/store/src/store.ts#L2528) `Store/auditLog` | `SQLite.all` (2528); `SQLite.prepare` (2528); `Store.sql` (2528) | CORE |
| [packages/store/src/store.ts:1956](../../packages/store/src/store.ts#L1956) `Store/backup` | `Store.sql` (1956) | CORE |
| [packages/store/src/store.ts:3676](../../packages/store/src/store.ts#L3676) `Store/blankPasswordAccounts` | `SQLite.all` (3676); `SQLite.prepare` (3676); `Store.sql` (3676) | CORE |
| [packages/store/src/store.ts:9482](../../packages/store/src/store.ts#L9482) `Store/canView` | `Store.canView` (9482); `Store.row` (9483) | GATED-STORE |
| [packages/store/src/store.ts:9464](../../packages/store/src/store.ts#L9464) `Store/canViewRecord` | `SQLite.get` (9464); `SQLite.prepare` (9464); `Store.sql` (9464) | GATED-STORE |
| [packages/store/src/store.ts:4944](../../packages/store/src/store.ts#L4944) `Store/canonicalAccount` | `SQLite.all` (4944); `SQLite.prepare` (4944); `Store.sql` (4944) | CORE |
| [packages/store/src/store.ts:10571](../../packages/store/src/store.ts#L10571) `Store/cascadeDelete` | `relatedRows` (10571) | CORE |
| [packages/store/src/store.ts:2253](../../packages/store/src/store.ts#L2253) `Store/changeOne` | `Store.sql` (2253, 2255) | CORE |
| [packages/store/src/store.ts:2256](../../packages/store/src/store.ts#L2256) `Store/changeOne/read` | `SQLite.get` (2256); `SQLite.prepare` (2256); `Store.sql` (2256) | CORE |
| [packages/store/src/store.ts:8754](../../packages/store/src/store.ts#L8754) `Store/checkContainerWrite` | `Store.row` (8754) | CORE |
| [packages/store/src/store.ts:10194](../../packages/store/src/store.ts#L10194) `Store/checkEditable` | `Store.row` (10194) | CORE |
| [packages/store/src/store.ts:1502](../../packages/store/src/store.ts#L1502) `Store/checkpoint` | `SQLite.get` (1502); `SQLite.prepare` (1502); `Store.sql` (1502) | CORE |
| [packages/store/src/store.ts:6297](../../packages/store/src/store.ts#L6297) `Store/clearAccountPrivilegeSet` | `SQLite.prepare` (6297); `Store.sql` (6297) | CORE |
| [packages/store/src/store.ts:1524](../../packages/store/src/store.ts#L1524) `Store/close` | `Store.sql` (1524) | CORE |
| [packages/store/src/store.ts:8722](../../packages/store/src/store.ts#L8722) `Store/compactFile` | `Store.sql` (8722, 8723, 8725) | CORE |
| [packages/store/src/store.ts:10695](../../packages/store/src/store.ts#L10695) `Store/computeValuesCurrent` | `Store.computeValues` (10695); `Store.sql` (10701, 10705); `SQLite.all` (10705); `SQLite.prepare` (10705) | GATED-STORE |
| [packages/store/src/store.ts:9133](../../packages/store/src/store.ts#L9133) `Store/computedRows` | `Store.sql` (9133, 9136, 9137, 9138, 9140, 9150, 9151, 9152, 9155); `SQLite.prepare` (9136, 9138, 9140, 9150); `SQLite.iterate` (9140); `Calculations.globalValue` (9143); `Calculations.unstoredValue` (9144); `Calculations.related` (9147); `SQLite.all` (9150) | CORE |
| [packages/store/src/store.ts:5719](../../packages/store/src/store.ts#L5719) `Store/confirmTotp` | `SQLite.get` (5719); `SQLite.prepare` (5719, 5721); `Store.sql` (5719, 5721) | CORE |
| [packages/store/src/store.ts:1148](../../packages/store/src/store.ts#L1148) `Store/constructor` | `Store.sql` (1148, 1150, 1152, 1153, 1157, 1161, 1162, 1171, 1179, 1194, 1199, 1204, 1205, 1209, 1210, 1211, 1218, 1222, 1226, 1227, 1228, 1233, 1237, 1240, 1241, 1243, 1244, 1247, 1248, 1252, 1253, 1257, 1258, 1261, 1263, 1266, 1267, 1271, 1272, 1276, 1277, 1281, 1282, 1283, 1286, 1287, 1290, 1291, 1293, 1293, 1294, 1294, 1295, 1298, 1302, 1304, 1307, 1308, 1309, 1312, 1313, 1315, 1317, 1318, 1322, 1323, 1325, 1337, 1339, 1340, 1341, 1341, 1345, 1346); `SQLite.get` (1152, 1171); `SQLite.prepare` (1152, 1171, 1179, 1240, 1241, 1244, 1247, 1252, 1257, 1266, 1271, 1276, 1286, 1290, 1293, 1294, 1312, 1317, 1322); `SQLite.all` (1240, 1247, 1252, 1257, 1266, 1271, 1276, 1286, 1290, 1293, 1294, 1312, 1317, 1322) | CORE |
| [packages/store/src/store.ts:6077](../../packages/store/src/store.ts#L6077) `Store/consumeRecoveryCode` | `SQLite.prepare` (6077); `Store.sql` (6077) | CORE |
| [packages/store/src/store.ts:8297](../../packages/store/src/store.ts#L8297) `Store/container` | `SQLite.get` (8297); `SQLite.prepare` (8297, 8306); `Store.sql` (8297, 8306); `SQLite.all` (8306) | CORE |
| [packages/store/src/store.ts:8731](../../packages/store/src/store.ts#L8731) `Store/containerId` | `Store.containerId` (8731); `Store.row` (8732) | CORE |
| [packages/store/src/store.ts:8314](../../packages/store/src/store.ts#L8314) `Store/containerInfo` | `SQLite.get` (8314); `SQLite.prepare` (8314); `Store.sql` (8314) | CORE |
| [packages/store/src/store.ts:8278](../../packages/store/src/store.ts#L8278) `Store/containerIntact` | `SQLite.get` (8278); `SQLite.prepare` (8278); `Store.sql` (8278) | CORE |
| [packages/store/src/store.ts:8217](../../packages/store/src/store.ts#L8217) `Store/containerIntegrityReport` | `SQLite.all` (8217); `SQLite.prepare` (8217, 8228); `Store.sql` (8217, 8228); `SQLite.get` (8228) | CORE |
| [packages/store/src/store.ts:8292](../../packages/store/src/store.ts#L8292) `Store/containerMeta` | `SQLite.get` (8292); `SQLite.prepare` (8292); `Store.sql` (8292) | CORE |
| [packages/store/src/store.ts:8348](../../packages/store/src/store.ts#L8348) `Store/containerRange` | `SQLite.all` (8348); `SQLite.prepare` (8348, 8355); `Store.sql` (8348, 8355); `SQLite.get` (8355) | CORE |
| [packages/store/src/store.ts:8119](../../packages/store/src/store.ts#L8119) `Store/containerReferences` | `SQLite.all` (8119, 8138, 8140, 8146, 8159, 8170, 8184); `SQLite.prepare` (8119, 8138, 8140, 8146, 8159, 8170, 8182, 8184); `Store.sql` (8119, 8138, 8140, 8146, 8159, 8170, 8182, 8184); `SQLite.get` (8182); `Store.row` (8193) | CORE |
| [packages/store/src/store.ts:10675](../../packages/store/src/store.ts#L10675) `Store/countIds` | `Store.countIds` (10675); `SQLite.get` (10679); `SQLite.prepare` (10679); `Store.sql` (10679) | GATED-STORE |
| [packages/store/src/store.ts:9513](../../packages/store/src/store.ts#L9513) `Store/create` | `SQLite.get` (9513); `SQLite.prepare` (9513, 9526); `Store.sql` (9513, 9526) | CORE |
| [packages/store/src/store.ts:3982](../../packages/store/src/store.ts#L3982) `Store/createAccount` | `SQLite.get` (3982); `SQLite.prepare` (3982, 3986, 3992, 3997, 4002); `Store.sql` (3982, 3986, 3992, 3997, 4002) | CORE |
| [packages/store/src/store.ts:5450](../../packages/store/src/store.ts#L5450) `Store/createApiToken` | `SQLite.get` (5450, 5478); `SQLite.prepare` (5450, 5477, 5478, 5488); `Store.sql` (5450, 5477, 5478, 5488) | CORE |
| [packages/store/src/store.ts:4956](../../packages/store/src/store.ts#L4956) `Store/createLocalAccount` | `SQLite.prepare` (4956); `Store.sql` (4956) | CORE |
| [packages/store/src/store.ts:3642](../../packages/store/src/store.ts#L3642) `Store/credentialIdentity` | `SQLite.get` (3642); `SQLite.prepare` (3642); `Store.sql` (3642) | CORE |
| [packages/store/src/store.ts:5371](../../packages/store/src/store.ts#L5371) `Store/credentialStamp` | `SQLite.get` (5371); `SQLite.prepare` (5371); `Store.sql` (5371) | CORE |
| [packages/store/src/store.ts:2046](../../packages/store/src/store.ts#L2046) `Store/dataVersion` | `SQLite.get` (2046); `SQLite.prepare` (2046); `Store.sql` (2046) | CORE |
| [packages/store/src/store.ts:11232](../../packages/store/src/store.ts#L11232) `Store/decimalViewSql` | `SQLite.all` (11232); `SQLite.prepare` (11232) | CORE |
| [packages/store/src/store.ts:10237](../../packages/store/src/store.ts#L10237) `Store/delete` | `Store.row` (10237) | CORE |
| [packages/store/src/store.ts:10245](../../packages/store/src/store.ts#L10245) `Store/delete/run` | `SQLite.get` (10245); `SQLite.prepare` (10245, 10250); `Store.sql` (10245, 10250) | CORE |
| [packages/store/src/store.ts:5110](../../packages/store/src/store.ts#L5110) `Store/deleteAccount` | `SQLite.prepare` (5110, 5114, 5115, 5116, 5117, 5118, 5119, 5120, 5121, 5128, 5130, 5132, 5134, 5138); `Store.sql` (5110, 5114, 5115, 5116, 5117, 5118, 5119, 5120, 5121, 5128, 5130, 5132, 5134, 5138) | CORE |
| [packages/store/src/store.ts:10318](../../packages/store/src/store.ts#L10318) `Store/deleteBeingUndone` | `SQLite.all` (10318); `SQLite.prepare` (10318); `Store.sql` (10318) | CORE |
| [packages/store/src/store.ts:10330](../../packages/store/src/store.ts#L10330) `Store/deleteEndingTheLifeAt` | `SQLite.get` (10330); `SQLite.prepare` (10330); `Store.sql` (10330) | CORE |
| [packages/store/src/store.ts:6162](../../packages/store/src/store.ts#L6162) `Store/deletePrivilegeSet` | `SQLite.prepare` (6162); `Store.sql` (6162) | CORE |
| [packages/store/src/store.ts:4120](../../packages/store/src/store.ts#L4120) `Store/deleteScriptTest` | `SQLite.prepare` (4120); `Store.sql` (4120) | CORE |
| [packages/store/src/store.ts:3279](../../packages/store/src/store.ts#L3279) `Store/deletedRows` | `SQLite.get` (3279); `SQLite.prepare` (3279, 3281, 3281); `Store.sql` (3279, 3281, 3281); `SQLite.all` (3281, 3281) | CORE |
| [packages/store/src/store.ts:3389](../../packages/store/src/store.ts#L3389) `Store/designEffect` | `Store.sql` (3389, 3395, 3396, 3399, 3405, 3410, 3413, 3419, 3430, 3431, 3433, 3434, 3447, 3448, 3451, 3453, 3459, 3460, 3461, 3467, 3469, 3473, 3476, 3477, 3479, 3482, 3488, 3490, 3497, 3498, 3500, 3501, 3502, 3503, 3510, 3511, 3513, 3513, 3515, 3516, 3517, 3521, 3525, 3527, 3565, 3567, 3569); `SQLite.prepare` (3399, 3430, 3431, 3447, 3448, 3459, 3460, 3467, 3469, 3473, 3477, 3488, 3490, 3503, 3510, 3511, 3513, 3515, 3517, 3521, 3525); `SQLite.get` (3430, 3447, 3459, 3460, 3473, 3477, 3513, 3521); `SQLite.all` (3510, 3511); `SQLite.iterate` (3515) | CORE |
| [packages/store/src/store.ts:3382](../../packages/store/src/store.ts#L3382) `Store/designEffect/renameExcluded` | `SQLite.prepare` (3382); `Store.sql` (3382) | CORE |
| [packages/store/src/store.ts:3366](../../packages/store/src/store.ts#L3366) `Store/designEffect/renameKey` | `SQLite.prepare` (3366); `Store.sql` (3366) | CORE |
| [packages/store/src/store.ts:3320](../../packages/store/src/store.ts#L3320) `Store/designHistory` | `SQLite.all` (3320); `SQLite.prepare` (3320); `Store.sql` (3320) | CORE |
| [packages/store/src/store.ts:5740](../../packages/store/src/store.ts#L5740) `Store/disableTotp` | `SQLite.prepare` (5740); `Store.sql` (5740) | CORE |
| [packages/store/src/store.ts:3577](../../packages/store/src/store.ts#L3577) `Store/dropColumnIndexes` | `SQLite.all` (3577, 3579); `SQLite.prepare` (3577, 3579); `Store.sql` (3577, 3579, 3580) | CORE |
| [packages/store/src/store.ts:8908](../../packages/store/src/store.ts#L8908) `Store/dropFieldIndex` | `SQLite.get` (8908); `SQLite.prepare` (8908); `Store.sql` (8908, 8909) | CORE |
| [packages/store/src/store.ts:9550](../../packages/store/src/store.ts#L9550) `Store/duplicate` | `Store.row` (9550); `SQLite.prepare` (9568); `Store.sql` (9568) | CORE |
| [packages/store/src/store.ts:8535](../../packages/store/src/store.ts#L8535) `Store/embeddedContainerCount` | `SQLite.prepare` (8535); `Store.sql` (8535); `SQLite.get` (8536) | CORE |
| [packages/store/src/store.ts:8521](../../packages/store/src/store.ts#L8521) `Store/embeddedContainers` | `SQLite.prepare` (8521, 8522); `Store.sql` (8521, 8522); `SQLite.all` (8522); `SQLite.get` (8526) | CORE |
| [packages/store/src/store.ts:3305](../../packages/store/src/store.ts#L3305) `Store/emptyDeleted` | `Store.sql` (3305, 3308, 3309, 3311, 3313); `SQLite.prepare` (3309) | CORE |
| [packages/store/src/store.ts:1922](../../packages/store/src/store.ts#L1922) `Store/endTransaction` | `Store.sql` (1922, 1925, 1925) | CORE |
| [packages/store/src/store.ts:5708](../../packages/store/src/store.ts#L5708) `Store/enrollTotp` | `SQLite.prepare` (5708); `Store.sql` (5708) | CORE |
| [packages/store/src/store.ts:3274](../../packages/store/src/store.ts#L3274) `Store/ensureDeleted` | `Store.sql` (3274) | CORE |
| [packages/store/src/store.ts:1356](../../packages/store/src/store.ts#L1356) `Store/ensureNativeIds` | `SQLite.all` (1356, 1368); `SQLite.prepare` (1356, 1359, 1367, 1368); `Store.sql` (1356, 1359, 1362, 1366, 1367, 1368, 1371, 1373) | CORE |
| [packages/store/src/store.ts:2166](../../packages/store/src/store.ts#L2166) `Store/ensureRecordIdHighWater` | `Store.sql` (2166, 2168, 2170, 2172) | CORE |
| [packages/store/src/store.ts:2184](../../packages/store/src/store.ts#L2184) `Store/ensureRecordIdMarks` | `SQLite.all` (2184, 2187, 2190, 2199); `SQLite.prepare` (2184, 2187, 2190, 2193, 2199, 2202); `Store.sql` (2184, 2187, 2190, 2193, 2199, 2202, 2206, 2207) | CORE |
| [packages/store/src/store.ts:9891](../../packages/store/src/store.ts#L9891) `Store/evaluateCurrent` | `Store.row` (9891, 9891, 9892, 9892); `Calculations.context` (9897); `Store.get` (9898, 9900) | GATED-STORE |
| [packages/store/src/store.ts:9932](../../packages/store/src/store.ts#L9932) `Store/evaluateEachCurrent` | `Store.row` (9932, 9932, 9937); `Calculations.context` (9938); `Store.get` (9940) | GATED-STORE |
| [packages/store/src/store.ts:9994](../../packages/store/src/store.ts#L9994) `Store/evaluateRowsCurrent` | `Store.row` (9994, 9994, 9995, 9995) | GATED-STORE |
| [packages/store/src/store.ts:9973](../../packages/store/src/store.ts#L9973) `Store/evaluateRowsCurrent/each` | `Calculations.context` (9973); `Store.get` (9975) | GATED-STORE |
| [packages/store/src/store.ts:10009](../../packages/store/src/store.ts#L10009) `Store/evaluateRowsCurrent/found/[Symbol.iterator]` | `rowsById` (10009) | GATED-STORE |
| [packages/store/src/store.ts:10031](../../packages/store/src/store.ts#L10031) `Store/evaluateRowsCurrent/key` | `Calculations.context` (10031) | GATED-STORE |
| [packages/store/src/store.ts:3909](../../packages/store/src/store.ts#L3909) `Store/externalAccount` | `SQLite.all` (3909); `SQLite.prepare` (3909); `Store.sql` (3909) | CORE |
| [packages/store/src/store.ts:8040](../../packages/store/src/store.ts#L8040) `Store/externalContainerCheck` | `SQLite.all` (8040); `SQLite.prepare` (8040); `Store.sql` (8040) | CORE |
| [packages/store/src/store.ts:8047](../../packages/store/src/store.ts#L8047) `Store/externalContainerCount` | `SQLite.get` (8047); `SQLite.prepare` (8047); `Store.sql` (8047) | CORE |
| [packages/store/src/store.ts:8056](../../packages/store/src/store.ts#L8056) `Store/externalContainerReport` | `SQLite.all` (8056, 8069); `SQLite.prepare` (8056, 8069); `Store.sql` (8056, 8069) | CORE |
| [packages/store/src/store.ts:5221](../../packages/store/src/store.ts#L5221) `Store/externalIdentityId` | `SQLite.get` (5221, 5228); `SQLite.prepare` (5221, 5227, 5228); `Store.sql` (5221, 5227, 5228) | CORE |
| [packages/store/src/store.ts:8288](../../packages/store/src/store.ts#L8288) `Store/externalOf` | `SQLite.get` (8288); `SQLite.prepare` (8288); `Store.sql` (8288) | CORE |
| [packages/store/src/store.ts:3055](../../packages/store/src/store.ts#L3055) `Store/failureAuditRoom` | `SQLite.get` (3055); `SQLite.prepare` (3055); `Store.sql` (3055) | CORE |
| [packages/store/src/store.ts:7693](../../packages/store/src/store.ts#L7693) `Store/fieldIndexCurrent` | `SQLite.iterate` (7693); `SQLite.prepare` (7693, 7698); `Store.sql` (7693, 7698); `SQLite.all` (7698) | GATED-STORE |
| [packages/store/src/store.ts:8948](../../packages/store/src/store.ts#L8948) `Store/find` | `Store.find` (8948) | GATED-STORE |
| [packages/store/src/store.ts:9320](../../packages/store/src/store.ts#L9320) `Store/findCandidates` | `Store.query` (9320) | CORE |
| [packages/store/src/store.ts:8959](../../packages/store/src/store.ts#L8959) `Store/findHere` | `Store.query` (8959, 8964, 8966, 8980, 8982, 8993); `Store.recordCount` (8977); `SQLite.get` (8978, 8982); `SQLite.prepare` (8978, 8982, 8988, 8995, 9004); `Store.sql` (8978, 8982, 8988, 8995, 9004); `SQLite.all` (8988, 8995, 9004) | GATED-STORE |
| [packages/store/src/store.ts:8999](../../packages/store/src/store.ts#L8999) `Store/findHere/[Symbol.iterator]` | `SQLite.iterate` (8999); `SQLite.prepare` (8999); `Store.sql` (8999) | GATED-STORE |
| [packages/store/src/store.ts:10806](../../packages/store/src/store.ts#L10806) `Store/findIdsCurrent` | `Store.findIds` (10806) | GATED-STORE |
| [packages/store/src/store.ts:10742](../../packages/store/src/store.ts#L10742) `Store/findIdsCurrentProgress` | `Store.findIdsProgress` (10742); `Store.query` (10744, 10745, 10758, 10760); `Store.recordCount` (10750, 10778); `SQLite.iterate` (10775); `SQLite.prepare` (10775, 10783, 10784); `Store.sql` (10775, 10783, 10784); `SQLite.get` (10787); `SQLite.all` (10793) | GATED-STORE |
| [packages/store/src/store.ts:10812](../../packages/store/src/store.ts#L10812) `Store/findIdsHere` | `Store.query` (10812, 10817, 10819); `SQLite.iterate` (10830); `SQLite.prepare` (10830); `Store.sql` (10830) | GATED-STORE |
| [packages/store/src/store.ts:9264](../../packages/store/src/store.ts#L9264) `Store/findSource` | `Store.query` (9264); `SQLite.all` (9273, 9290); `SQLite.prepare` (9273, 9281, 9289); `Store.sql` (9273, 9278, 9281, 9286, 9289, 9303, 9305); `Calculations.globalValue` (9295); `Calculations.unstoredValue` (9296); `Calculations.related` (9300) | CORE |
| [packages/store/src/store.ts:3167](../../packages/store/src/store.ts#L3167) `Store/flushDeferredSecurity` | `Store.sql` (3167) | CORE |
| [packages/store/src/store.ts:10285](../../packages/store/src/store.ts#L10285) `Store/forgetStandInValues` | `Store.sql` (10285, 10306); `SQLite.prepare` (10306) | CORE |
| [packages/store/src/store.ts:5077](../../packages/store/src/store.ts#L5077) `Store/forgetStandIns` | `SQLite.prepare` (5077); `Store.sql` (5077) | CORE |
| [packages/store/src/store.ts:7575](../../packages/store/src/store.ts#L7575) `Store/foundSetPage` | `rowsById` (7575) | CORE |
| [packages/store/src/store.ts:7591](../../packages/store/src/store.ts#L7591) `Store/foundSetRowsCurrent` | `Store.viewableIds` (7591); `Store.row` (7607) | GATED-STORE |
| [packages/store/src/store.ts:3828](../../packages/store/src/store.ts#L3828) `Store/gateAgentWrite` | `SQLite.get` (3828); `SQLite.prepare` (3828, 3830); `Store.sql` (3828, 3830) | CORE |
| [packages/store/src/store.ts:6015](../../packages/store/src/store.ts#L6015) `Store/generateRecoveryCodes` | `SQLite.prepare` (6015, 6018); `Store.sql` (6015, 6018) | CORE |
| [packages/store/src/store.ts:9392](../../packages/store/src/store.ts#L9392) `Store/getCurrent` | `Store.get` (9392); `Store.row` (9393, 9393, 9407); `SQLite.all` (9410); `SQLite.prepare` (9410); `Store.sql` (9410) | GATED-STORE |
| [packages/store/src/store.ts:9430](../../packages/store/src/store.ts#L9430) `Store/getManyCurrent` | `Store.getMany` (9430); `SQLite.get` (9448); `SQLite.prepare` (9448); `Store.sql` (9448) | GATED-STORE |
| [packages/store/src/store.ts:9441](../../packages/store/src/store.ts#L9441) `Store/getManyCurrent/[Symbol.iterator]` | `rowsById` (9441) | GATED-STORE |
| [packages/store/src/store.ts:1403](../../packages/store/src/store.ts#L1403) `Store/grantFullAccessClients` | `SQLite.prepare` (1403); `Store.sql` (1403) | CORE |
| [packages/store/src/store.ts:10847](../../packages/store/src/store.ts#L10847) `Store/groupSummariesCurrent` | `Store.groupSummaries` (10847); `Store.viewableIds` (10852); `Calculations.collect` (10868); `rowsById` (10868, 10918); `Calculations.collector` (10890) | GATED-STORE |
| [packages/store/src/store.ts:10916](../../packages/store/src/store.ts#L10916) `Store/groupSummariesCurrent/flush` | `Calculations.collector` (10916) | GATED-STORE |
| [packages/store/src/store.ts:10880](../../packages/store/src/store.ts#L10880) `Store/groupSummariesCurrent/key` | `Calculations.value` (10880); `Calculations.related` (10882) | GATED-STORE |
| [packages/store/src/store.ts:1430](../../packages/store/src/store.ts#L1430) `Store/hasOwnPassword` | `SQLite.get` (1430); `SQLite.prepare` (1430); `Store.sql` (1430) | CORE |
| [packages/store/src/store.ts:5870](../../packages/store/src/store.ts#L5870) `Store/hasPasskey` | `SQLite.get` (5870); `SQLite.prepare` (5870); `Store.sql` (5870) | CORE |
| [packages/store/src/store.ts:1411](../../packages/store/src/store.ts#L1411) `Store/hasProvingPassword` | `SQLite.get` (1411); `SQLite.prepare` (1411); `Store.sql` (1411) | CORE |
| [packages/store/src/store.ts:8862](../../packages/store/src/store.ts#L8862) `Store/hasTable` | `SQLite.get` (8862); `SQLite.prepare` (8862); `Store.sql` (8862) | CORE |
| [packages/store/src/store.ts:5729](../../packages/store/src/store.ts#L5729) `Store/hasTotp` | `SQLite.get` (5729); `SQLite.prepare` (5729); `Store.sql` (5729) | CORE |
| [packages/store/src/store.ts:5200](../../packages/store/src/store.ts#L5200) `Store/identityAllowed` | `SQLite.get` (5200, 5206, 5212); `SQLite.prepare` (5200, 5206, 5212); `Store.sql` (5200, 5206, 5212) | CORE |
| [packages/store/src/store.ts:7049](../../packages/store/src/store.ts#L7049) `Store/image` | `SQLite.get` (7049); `SQLite.prepare` (7049); `Store.sql` (7049) | CORE |
| [packages/store/src/store.ts:7059](../../packages/store/src/store.ts#L7059) `Store/images` | `SQLite.all` (7059); `SQLite.prepare` (7059); `Store.sql` (7059) | CORE |
| [packages/store/src/store.ts:4921](../../packages/store/src/store.ts#L4921) `Store/importAccounts` | `SQLite.all` (4921); `SQLite.prepare` (4921); `Store.sql` (4921) | CORE |
| [packages/store/src/store.ts:1744](../../packages/store/src/store.ts#L1744) `Store/independentWindowWrite` | `SQLite.get` (1744); `SQLite.prepare` (1744, 1752, 1812); `Store.sql` (1744, 1752, 1762, 1790, 1807, 1812, 1815); `SQLite.all` (1752); `Store.row` (1810) | CORE |
| [packages/store/src/store.ts:2220](../../packages/store/src/store.ts#L2220) `Store/nextRecordId` | `SQLite.get` (2220); `SQLite.prepare` (2220); `Store.sql` (2220) | CORE |
| [packages/store/src/store.ts:1589](../../packages/store/src/store.ts#L1589) `Store/securityChainHeadAudit` | `SQLite.get` (1589); `SQLite.prepare` (1589); `Store.sql` (1589) | CORE |
| [packages/store/src/store.ts:8874](../../packages/store/src/store.ts#L8874) `Store/indexedFields` | `SQLite.all` (8874, 8875); `SQLite.prepare` (8874, 8875); `Store.sql` (8874, 8875) | CORE |
| [packages/store/src/store.ts:11265](../../packages/store/src/store.ts#L11265) `Store/internalRoots` | `SQLite.get` (11265); `SQLite.prepare` (11265, 11267); `SQLite.all` (11267) | CORE |
| [packages/store/src/store.ts:3664](../../packages/store/src/store.ts#L3664) `Store/isAgent` | `SQLite.get` (3664); `SQLite.prepare` (3664); `Store.sql` (3664) | CORE |
| [packages/store/src/store.ts:3767](../../packages/store/src/store.ts#L3767) `Store/isExternal` | `SQLite.get` (3767); `SQLite.prepare` (3767); `Store.sql` (3767) | CORE |
| [packages/store/src/store.ts:5784](../../packages/store/src/store.ts#L5784) `Store/issueWebauthnChallenge` | `SQLite.prepare` (5784, 5786, 5787, 5789); `Store.sql` (5784, 5786, 5787, 5789); `SQLite.get` (5786) | CORE |
| [packages/store/src/store.ts:11128](../../packages/store/src/store.ts#L11128) `Store/iterateCommitted` | `SQLite.iterate` (11128) | CORE |
| [packages/store/src/store.ts:1684](../../packages/store/src/store.ts#L1684) `Store/joinTransaction` | `Store.sql` (1684, 1685, 1687, 1689, 1695, 1698) | CORE |
| [packages/store/src/store.ts:10518](../../packages/store/src/store.ts#L10518) `Store/keyStepWork` | `Store.sql` (10518, 10524, 10528, 10530) | CORE |
| [packages/store/src/store.ts:6916](../../packages/store/src/store.ts#L6916) `Store/knownSharedAccount` | `SQLite.get` (6916); `SQLite.prepare` (6916); `Store.sql` (6916) | CORE |
| [packages/store/src/store.ts:4394](../../packages/store/src/store.ts#L4394) `Store/lastSignIns` | `Store.auditLog` (4394) | CORE |
| [packages/store/src/store.ts:10336](../../packages/store/src/store.ts#L10336) `Store/latestDeleteSeq` | `SQLite.get` (10336); `SQLite.prepare` (10336); `Store.sql` (10336) | CORE |
| [packages/store/src/store.ts:7089](../../packages/store/src/store.ts#L7089) `Store/layout` | `SQLite.get` (7089); `SQLite.prepare` (7089); `Store.sql` (7089) | CORE |
| [packages/store/src/store.ts:3337](../../packages/store/src/store.ts#L3337) `Store/layoutHistory` | `SQLite.all` (3337); `SQLite.prepare` (3337); `Store.sql` (3337) | CORE |
| [packages/store/src/store.ts:6979](../../packages/store/src/store.ts#L6979) `Store/layouts` | `SQLite.all` (6979); `SQLite.prepare` (6979); `Store.sql` (6979) | CORE |
| [packages/store/src/store.ts:4694](../../packages/store/src/store.ts#L4694) `Store/leastPrivilege` | `SQLite.all` (4694); `SQLite.prepare` (4694); `Store.sql` (4694) | CORE |
| [packages/store/src/store.ts:5298](../../packages/store/src/store.ts#L5298) `Store/ledgerRow` | `SQLite.get` (5298, 5299); `SQLite.prepare` (5298, 5299); `Store.sql` (5298, 5299) | AUTH |
| [packages/store/src/store.ts:5310](../../packages/store/src/store.ts#L5310) `Store/ledgerWrite` | `Store.sql` (5310, 5311, 5313, 5315, 5318, 5318) | AUTH |
| [packages/store/src/store.ts:5004](../../packages/store/src/store.ts#L5004) `Store/limitAccountImport` | `SQLite.prepare` (5004, 5005, 5008); `Store.sql` (5004, 5005, 5008); `SQLite.get` (5005) | CORE |
| [packages/store/src/store.ts:3617](../../packages/store/src/store.ts#L3617) `Store/linkIdentity` | `SQLite.get` (3617); `SQLite.prepare` (3617); `Store.sql` (3617) | CORE |
| [packages/store/src/store.ts:3609](../../packages/store/src/store.ts#L3609) `Store/linkPrincipal` | `SQLite.get` (3609); `SQLite.prepare` (3609); `Store.sql` (3609) | CORE |
| [packages/store/src/store.ts:4280](../../packages/store/src/store.ts#L4280) `Store/markPiiField` | `SQLite.prepare` (4280); `Store.sql` (4280) | CORE |
| [packages/store/src/store.ts:8013](../../packages/store/src/store.ts#L8013) `Store/markRepeating` | `SQLite.prepare` (8013); `Store.sql` (8013) | CORE |
| [packages/store/src/store.ts:11061](../../packages/store/src/store.ts#L11061) `Store/matchIds` | `Store.matchIds` (11061); `SQLite.all` (11067); `SQLite.prepare` (11067); `Store.sql` (11067) | CORE |
| [packages/store/src/store.ts:1445](../../packages/store/src/store.ts#L1445) `Store/meta` | `SQLite.get` (1445); `SQLite.prepare` (1445); `Store.sql` (1445) | CORE |
| [packages/store/src/store.ts:1003](../../packages/store/src/store.ts#L1003) `Store/metadataVersions` | `SQLite.get` (1003); `SQLite.prepare` (1003); `Store.sql` (1003) | CORE |
| [packages/store/src/store.ts:8650](../../packages/store/src/store.ts#L8650) `Store/moveContainersIn` | `Store.sql` (8650, 8656, 8658, 8659, 8660, 8661, 8681, 8686, 8686, 8697, 8700, 8703, 8710); `SQLite.prepare` (8658, 8659, 8660, 8661, 8697, 8703); `SQLite.get` (8663, 8697, 8703) | CORE |
| [packages/store/src/store.ts:8572](../../packages/store/src/store.ts#L8572) `Store/moveContainersOut` | `Store.sql` (8572, 8580, 8582, 8584, 8589, 8590, 8610, 8616, 8618, 8620, 8620, 8626, 8626, 8631, 8633, 8635, 8635, 8641); `SQLite.get` (8580); `SQLite.prepare` (8580, 8589, 8590); `Store.container` (8592) | CORE |
| [packages/store/src/store.ts:4875](../../packages/store/src/store.ts#L4875) `Store/mustChangePassword` | `SQLite.get` (4875); `SQLite.prepare` (4875); `Store.sql` (4875) | CORE |
| [packages/store/src/store.ts:1381](../../packages/store/src/store.ts#L1381) `Store/nativeIdGuards` | `Store.sql` (1381, 1382, 1384) | CORE |
| [packages/store/src/store.ts:5604](../../packages/store/src/store.ts#L5604) `Store/objectUseSince` | `SQLite.get` (5604); `SQLite.prepare` (5604); `Store.sql` (5604) | CORE |
| [packages/store/src/store.ts:8834](../../packages/store/src/store.ts#L8834) `Store/orderBy` | `Store.valueListItems` (8834) | CORE |
| [packages/store/src/store.ts:8205](../../packages/store/src/store.ts#L8205) `Store/orphanContainerReport` | `SQLite.all` (8205); `SQLite.prepare` (8205); `Store.sql` (8205) | CORE |
| [packages/store/src/store.ts:5836](../../packages/store/src/store.ts#L5836) `Store/passkeyAllowList` | `SQLite.all` (5836); `SQLite.prepare` (5836); `Store.sql` (5836) | CORE |
| [packages/store/src/store.ts:5875](../../packages/store/src/store.ts#L5875) `Store/passkeyIds` | `SQLite.all` (5875); `SQLite.prepare` (5875); `Store.sql` (5875) | CORE |
| [packages/store/src/store.ts:5863](../../packages/store/src/store.ts#L5863) `Store/passkeys` | `SQLite.all` (5863); `SQLite.prepare` (5863); `Store.sql` (5863) | CORE |
| [packages/store/src/store.ts:4914](../../packages/store/src/store.ts#L4914) `Store/passwordDaysRemaining` | `SQLite.get` (4914); `SQLite.prepare` (4914); `Store.sql` (4914) | CORE |
| [packages/store/src/store.ts:3852](../../packages/store/src/store.ts#L3852) `Store/pendingChanges` | `SQLite.all` (3852); `SQLite.prepare` (3852); `Store.sql` (3852) | CORE |
| [packages/store/src/store.ts:1463](../../packages/store/src/store.ts#L1463) `Store/persistentData` | `SQLite.get` (1463) | CORE |
| [packages/store/src/store.ts:1472](../../packages/store/src/store.ts#L1472) `Store/persistentDataIds` | `SQLite.all` (1472) | CORE |
| [packages/store/src/store.ts:1453](../../packages/store/src/store.ts#L1453) `Store/persistentTable` | `Store.sql` (1453) | CORE |
| [packages/store/src/store.ts:10179](../../packages/store/src/store.ts#L10179) `Store/portalContainerTarget` | `Store.row` (10179); `relatedIdList` (10181) | CORE |
| [packages/store/src/store.ts:7630](../../packages/store/src/store.ts#L7630) `Store/portalCountsCurrent` | `Store.canView` (7630); `Store.row` (7657) | GATED-STORE |
| [packages/store/src/store.ts:7868](../../packages/store/src/store.ts#L7868) `Store/portalRows` | `relatedRows` (7868); `relatedIdList` (7869); `Store.viewableSet` (7872); `rowsById` (7897, 7935); `Calculations.related` (7911) | CORE |
| [packages/store/src/store.ts:7879](../../packages/store/src/store.ts#L7879) `Store/portalRows/context` | `Calculations.context` (7879) | CORE |
| [packages/store/src/store.ts:7889](../../packages/store/src/store.ts#L7889) `Store/portalRows/valueOf` | `Calculations.value` (7889) | CORE |
| [packages/store/src/store.ts:2594](../../packages/store/src/store.ts#L2594) `Store/prepared` | `SQLite.prepare` (2594); `Store.sql` (2594) | CORE |
| [packages/store/src/store.ts:4986](../../packages/store/src/store.ts#L4986) `Store/previewAccountImport` | `Store.sql` (4986, 4987, 4996) | CORE |
| [packages/store/src/store.ts:6679](../../packages/store/src/store.ts#L6679) `Store/previewRecordRuleCurrent` | `SQLite.get` (6679); `SQLite.prepare` (6679, 6682); `Store.sql` (6679, 6682); `SQLite.all` (6682); `Calculations.context` (6688, 6704) | CORE |
| [packages/store/src/store.ts:9355](../../packages/store/src/store.ts#L9355) `Store/previewRow` | `Store.row` (9355) | CORE |
| [packages/store/src/store.ts:6090](../../packages/store/src/store.ts#L6090) `Store/privilegeSets` | `Store.sql` (6090) | CORE |
| [packages/store/src/store.ts:2826](../../packages/store/src/store.ts#L2826) `Store/pruneAudit` | `Store.sql` (2826, 2828, 2830); `SQLite.get` (2828); `SQLite.prepare` (2828) | CORE |
| [packages/store/src/store.ts:8240](../../packages/store/src/store.ts#L8240) `Store/purgeOrphanContainers` | `Store.sql` (8240, 8244, 8253, 8256, 8257, 8262, 8263, 8265, 8265); `Store.orphanContainerReport` (8248); `SQLite.get` (8253); `SQLite.prepare` (8253, 8256, 8257) | CORE |
| [packages/store/src/store.ts:11385](../../packages/store/src/store.ts#L11385) `Store/query` | `SQLite.iterate` (11385) | CORE |
| [packages/store/src/store.ts:11425](../../packages/store/src/store.ts#L11425) `Store/queryWithOriginsCurrent` | `SQLite.iterate` (11425); `SQLite.all` (11434, 11437); `SQLite.prepare` (11434, 11437) | CORE |
| [packages/store/src/store.ts:11177](../../packages/store/src/store.ts#L11177) `Store/readOnlyChecked` | `SQLite.prepare` (11177, 11181, 11190, 11195); `SQLite.all` (11181, 11190, 11195) | CORE |
| [packages/store/src/store.ts:3589](../../packages/store/src/store.ts#L3589) `Store/recompute` | `SQLite.prepare` (3589, 3593); `Store.sql` (3589, 3593); `SQLite.iterate` (3593); `Calculations.computeStoredStyled` (3594); `Calculations.value` (3594) | CORE |
| [packages/store/src/store.ts:2609](../../packages/store/src/store.ts#L2609) `Store/recordAsOf` | `SQLite.get` (2609, 2611); `SQLite.prepare` (2609, 2611, 2613, 2614); `Store.sql` (2609, 2611, 2613, 2614); `SQLite.all` (2613, 2614) | CORE |
| [packages/store/src/store.ts:2307](../../packages/store/src/store.ts#L2307) `Store/recordCount` | `SQLite.get` (2307); `SQLite.prepare` (2307); `Store.sql` (2307) | CORE |
| [packages/store/src/store.ts:2686](../../packages/store/src/store.ts#L2686) `Store/recordLife` | `SQLite.all` (2686); `SQLite.prepare` (2686); `Store.sql` (2686) | CORE |
| [packages/store/src/store.ts:5535](../../packages/store/src/store.ts#L5535) `Store/recordObjectUse` | `Store.sql` (5535) | CORE |
| [packages/store/src/store.ts:9881](../../packages/store/src/store.ts#L9881) `Store/recordViewable` | `Store.row` (9881) | GATED-STORE |
| [packages/store/src/store.ts:1510](../../packages/store/src/store.ts#L1510) `Store/recordedFormat` | `Store.sql` (1510) | CORE |
| [packages/store/src/store.ts:8544](../../packages/store/src/store.ts#L8544) `Store/recoverContainersOut` | `SQLite.prepare` (8544); `Store.sql` (8544); `SQLite.get` (8547) | CORE |
| [packages/store/src/store.ts:1613](../../packages/store/src/store.ts#L1613) `Store/recoverPendingExternalFiles` | `Store.sql` (1613, 1615, 1639, 1641); `SQLite.prepare` (1615); `SQLite.get` (1626) | CORE |
| [packages/store/src/store.ts:6033](../../packages/store/src/store.ts#L6033) `Store/recoveryCodesRemaining` | `SQLite.get` (6033); `SQLite.prepare` (6033); `Store.sql` (6033) | CORE |
| [packages/store/src/store.ts:11217](../../packages/store/src/store.ts#L11217) `Store/refreshDecimalSqlViews` | `SQLite.get` (11217); `SQLite.prepare` (11217) | CORE |
| [packages/store/src/store.ts:3758](../../packages/store/src/store.ts#L3758) `Store/refuseLookalikeAccount` | `SQLite.all` (3758); `SQLite.prepare` (3758); `Store.sql` (3758) | CORE |
| [packages/store/src/store.ts:5899](../../packages/store/src/store.ts#L5899) `Store/registerPasskey` | `SQLite.prepare` (5899); `Store.sql` (5899) | CORE |
| [packages/store/src/store.ts:3887](../../packages/store/src/store.ts#L3887) `Store/rejectPending` | `SQLite.get` (3887); `SQLite.prepare` (3887, 3889); `Store.sql` (3887, 3889) | CORE |
| [packages/store/src/store.ts:9107](../../packages/store/src/store.ts#L9107) `Store/relatedCriteria` | `SQLite.iterate` (9107); `SQLite.prepare` (9107); `Store.sql` (9107) | CORE |
| [packages/store/src/store.ts:9104](../../packages/store/src/store.ts#L9104) `Store/relatedCriteria/matched` | `relatedRows` (9104) | CORE |
| [packages/store/src/store.ts:7417](../../packages/store/src/store.ts#L7417) `Store/relatedValues` | `Calculations.globalValue` (7417); `Calculations.unstoredValue` (7419) | CORE |
| [packages/store/src/store.ts:5912](../../packages/store/src/store.ts#L5912) `Store/removePasskey` | `SQLite.get` (5912); `SQLite.prepare` (5912, 5913); `Store.sql` (5912, 5913) | CORE |
| [packages/store/src/store.ts:10356](../../packages/store/src/store.ts#L10356) `Store/restoreDeletedRowLocked` | `SQLite.get` (10356, 10361); `SQLite.prepare` (10356, 10357, 10361, 10371); `Store.sql` (10356, 10357, 10361, 10371); `SQLite.all` (10357) | CORE |
| [packages/store/src/store.ts:2644](../../packages/store/src/store.ts#L2644) `Store/restoreRecord` | `Store.recordAsOf` (2644); `SQLite.get` (2648); `SQLite.prepare` (2648, 2653, 2662, 2673); `Store.sql` (2648, 2653, 2662, 2673) | CORE |
| [packages/store/src/store.ts:2702](../../packages/store/src/store.ts#L2702) `Store/revertAuditEntry` | `SQLite.get` (2702); `SQLite.prepare` (2702); `Store.sql` (2702); `Store.canViewRecord` (2704); `Store.auditLog` (2707) | CORE |
| [packages/store/src/store.ts:5660](../../packages/store/src/store.ts#L5660) `Store/revokeApiToken` | `SQLite.prepare` (5660); `Store.sql` (5660) | CORE |
| [packages/store/src/store.ts:5183](../../packages/store/src/store.ts#L5183) `Store/revokeSignInCredentials` | `SQLite.prepare` (5183, 5184, 5185); `Store.sql` (5183, 5184, 5185) | AUTH |
| [packages/store/src/store.ts:9373](../../packages/store/src/store.ts#L9373) `Store/row` | `SQLite.get` (9373) | CORE |
| [packages/store/src/store.ts:11321](../../packages/store/src/store.ts#L11321) `Store/rowsOf` | `SQLite.iterate` (11321, 11330) | CORE |
| [packages/store/src/store.ts:6484](../../packages/store/src/store.ts#L6484) `Store/ruleOutcome` | `Calculations.context` (6484) | CORE |
| [packages/store/src/store.ts:9218](../../packages/store/src/store.ts#L9218) `Store/runningSummaryValues` | `Store.viewableIds` (9218); `rowsById` (9220); `Calculations.value` (9231, 9237); `Calculations.related` (9248) | GATED-STORE |
| [packages/store/src/store.ts:6119](../../packages/store/src/store.ts#L6119) `Store/savePrivilegeSet` | `SQLite.prepare` (6119, 6127); `Store.sql` (6119, 6127) | AUTH |
| [packages/store/src/store.ts:4111](../../packages/store/src/store.ts#L4111) `Store/saveScriptTest` | `SQLite.prepare` (4111); `Store.sql` (4111) | CORE |
| [packages/store/src/store.ts:6644](../../packages/store/src/store.ts#L6644) `Store/scopedTableSql` | `Store.viewableIds` (6644); `SQLite.all` (6647); `SQLite.prepare` (6647); `Store.sql` (6647) | GATED-STORE |
| [packages/store/src/store.ts:3327](../../packages/store/src/store.ts#L3327) `Store/scriptHistory` | `SQLite.all` (3327); `SQLite.prepare` (3327); `Store.sql` (3327) | CORE |
| [packages/store/src/store.ts:3000](../../packages/store/src/store.ts#L3000) `Store/securityChange` | `Store.sql` (3000, 3002); `SQLite.prepare` (3002) | CORE |
| [packages/store/src/store.ts:2568](../../packages/store/src/store.ts#L2568) `Store/securityEvents` | `Store.auditLog` (2568) | CORE |
| [packages/store/src/store.ts:5384](../../packages/store/src/store.ts#L5384) `Store/securityToken` | `SQLite.get` (5384); `SQLite.prepare` (5384); `Store.sql` (5384) | CORE |
| [packages/store/src/store.ts:11351](../../packages/store/src/store.ts#L11351) `Store/selectHeldCurrent` | `Store.sql` (11351, 11352, 11354); `SQLite.prepare` (11352) | CORE |
| [packages/store/src/store.ts:10661](../../packages/store/src/store.ts#L10661) `Store/selectIdsCurrent` | `Store.selectIds` (10661); `SQLite.all` (10667); `SQLite.prepare` (10667); `Store.sql` (10667) | GATED-STORE |
| [packages/store/src/store.ts:11341](../../packages/store/src/store.ts#L11341) `Store/selectIn` | `Store.select` (11341) | CORE |
| [packages/store/src/store.ts:1976](../../packages/store/src/store.ts#L1976) `Store/selfContainedCopy` | `Store.sql` (1976); `SQLite.all` (1981); `SQLite.prepare` (1981, 1983, 1984, 1985) | CORE |
| [packages/store/src/store.ts:5162](../../packages/store/src/store.ts#L5162) `Store/setAccountActive` | `SQLite.prepare` (5162, 5170, 5171); `Store.sql` (5162, 5170, 5171) | AUTH |
| [packages/store/src/store.ts:5403](../../packages/store/src/store.ts#L5403) `Store/setAccountLocalOnly` | `SQLite.prepare` (5403); `Store.sql` (5403) | CORE |
| [packages/store/src/store.ts:6275](../../packages/store/src/store.ts#L6275) `Store/setAccountPrivilegeSet` | `SQLite.get` (6275); `SQLite.prepare` (6275, 6278, 6282); `Store.sql` (6275, 6278, 6282) | AUTH |
| [packages/store/src/store.ts:5412](../../packages/store/src/store.ts#L5412) `Store/setAccountRequire2fa` | `SQLite.prepare` (5412); `Store.sql` (5412) | CORE |
| [packages/store/src/store.ts:3788](../../packages/store/src/store.ts#L3788) `Store/setAgentAccount` | `SQLite.get` (3788); `SQLite.prepare` (3788, 3794); `Store.sql` (3788, 3794) | CORE |
| [packages/store/src/store.ts:4155](../../packages/store/src/store.ts#L4155) `Store/setAiAllowed` | `SQLite.prepare` (4155); `Store.sql` (4155) | CORE |
| [packages/store/src/store.ts:4238](../../packages/store/src/store.ts#L4238) `Store/setAiPolicy` | `SQLite.prepare` (4238); `Store.sql` (4238) | CORE |
| [packages/store/src/store.ts:6903](../../packages/store/src/store.ts#L6903) `Store/setAllowBlankPasswordFromLan` | `SQLite.prepare` (6903); `Store.sql` (6903) | CORE |
| [packages/store/src/store.ts:2804](../../packages/store/src/store.ts#L2804) `Store/setAuditSettings` | `SQLite.prepare` (2804); `Store.sql` (2804) | CORE |
| [packages/store/src/store.ts:8763](../../packages/store/src/store.ts#L8763) `Store/setContainer` | `Store.sql` (8763); `Store.row` (8769) | CORE |
| [packages/store/src/store.ts:3740](../../packages/store/src/store.ts#L3740) `Store/setExternalAccount` | `SQLite.get` (3740); `SQLite.prepare` (3740, 3745); `Store.sql` (3740, 3745) | CORE |
| [packages/store/src/store.ts:4861](../../packages/store/src/store.ts#L4861) `Store/setMustChangePassword` | `SQLite.prepare` (4861); `Store.sql` (4861) | CORE |
| [packages/store/src/store.ts:3940](../../packages/store/src/store.ts#L3940) `Store/setPassword` | `SQLite.get` (3940); `SQLite.prepare` (3940, 3946, 3955, 3962, 3963, 3964); `Store.sql` (3940, 3946, 3955, 3962, 3963, 3964) | AUTH |
| [packages/store/src/store.ts:4052](../../packages/store/src/store.ts#L4052) `Store/setPasswordPolicy` | `SQLite.prepare` (4052); `Store.sql` (4052) | CORE |
| [packages/store/src/store.ts:1478](../../packages/store/src/store.ts#L1478) `Store/setPersistentData` | `SQLite.prepare` (1478, 1482); `Store.sql` (1478, 1482) | CORE |
| [packages/store/src/store.ts:4258](../../packages/store/src/store.ts#L4258) `Store/setPiiIsolation` | `SQLite.prepare` (4258); `Store.sql` (4258) | CORE |
| [packages/store/src/store.ts:4088](../../packages/store/src/store.ts#L4088) `Store/setRequireTotpForFullAccess` | `SQLite.prepare` (4088); `Store.sql` (4088) | CORE |
| [packages/store/src/store.ts:4170](../../packages/store/src/store.ts#L4170) `Store/setScriptNetwork` | `SQLite.prepare` (4170); `Store.sql` (4170) | CORE |
| [packages/store/src/store.ts:4227](../../packages/store/src/store.ts#L4227) `Store/setSqlRequiresFmxdbc` | `SQLite.prepare` (4227); `Store.sql` (4227) | CORE |
| [packages/store/src/store.ts:9802](../../packages/store/src/store.ts#L9802) `Store/setStoredCalcValues` | `SQLite.prepare` (9802, 9803); `Store.sql` (9802, 9803); `SQLite.get` (9807) | CORE |
| [packages/store/src/store.ts:8866](../../packages/store/src/store.ts#L8866) `Store/setUserPref` | `Store.sql` (8866, 8867, 8868); `SQLite.prepare` (8867, 8868) | CORE |
| [packages/store/src/store.ts:4211](../../packages/store/src/store.ts#L4211) `Store/setWebViewerHosts` | `SQLite.prepare` (4211); `Store.sql` (4211) | CORE |
| [packages/store/src/store.ts:5337](../../packages/store/src/store.ts#L5337) `Store/settleSignIns` | `SQLite.all` (5337, 5343); `SQLite.prepare` (5337, 5343, 5349, 5353, 5355); `Store.sql` (5337, 5343, 5349, 5353, 5355) | AUTH |
| [packages/store/src/store.ts:2107](../../packages/store/src/store.ts#L2107) `Store/shareResults` | `Store.sql` (2107) | CORE |
| [packages/store/src/store.ts:1540](../../packages/store/src/store.ts#L1540) `Store/shipWal` | `Store.sql` (1540) | CORE |
| [packages/store/src/store.ts:5284](../../packages/store/src/store.ts#L5284) `Store/signInBase` | `SQLite.get` (5284); `SQLite.prepare` (5284); `Store.sql` (5284) | AUTH |
| [packages/store/src/store.ts:5286](../../packages/store/src/store.ts#L5286) `Store/signInBase/identity` | `SQLite.get` (5286); `SQLite.prepare` (5286); `Store.sql` (5286) | AUTH |
| [packages/store/src/store.ts:5273](../../packages/store/src/store.ts#L5273) `Store/signInMark` | `SQLite.prepare` (5273); `Store.sql` (5273) | AUTH |
| [packages/store/src/store.ts:10959](../../packages/store/src/store.ts#L10959) `Store/sortIdsCurrentProgress` | `Store.sortIds` (10959); `Store.sortIdsProgress` (10959); `SQLite.all` (10972); `SQLite.prepare` (10972, 11047); `Store.sql` (10972, 11047); `Store.valueListItems` (10980); `rowsById` (10992); `Calculations.globalValue` (10995); `Calculations.unstoredValue` (10996); `Calculations.related` (11002); `SQLite.iterate` (11047) | GATED-STORE |
| [packages/store/src/store.ts:9032](../../packages/store/src/store.ts#L9032) `Store/sortedPage` | `SQLite.iterate` (9032); `SQLite.prepare` (9032, 9047); `Store.sql` (9032, 9047); `SQLite.all` (9047) | CORE |
| [packages/store/src/store.ts:11133](../../packages/store/src/store.ts#L11133) `Store/storedFileId` | `SQLite.get` (11133); `SQLite.prepare` (11133) | CORE |
| [packages/store/src/store.ts:9180](../../packages/store/src/store.ts#L9180) `Store/summaries` | `Calculations.wholeTable` (9180); `Calculations.collect` (9200, 9205) | CORE |
| [packages/store/src/store.ts:9196](../../packages/store/src/store.ts#L9196) `Store/summaries/recs` | `SQLite.iterate` (9196); `SQLite.prepare` (9196); `Store.sql` (9196) | CORE |
| [packages/store/src/store.ts:5850](../../packages/store/src/store.ts#L5850) `Store/takeWebauthnChallenge` | `SQLite.get` (5850); `SQLite.prepare` (5850, 5854); `Store.sql` (5850, 5854) | CORE |
| [packages/store/src/store.ts:8919](../../packages/store/src/store.ts#L8919) `Store/timeFind` | `Store.query` (8919) | CORE |
| [packages/store/src/store.ts:8933](../../packages/store/src/store.ts#L8933) `Store/reportFind` | `Store.query` (8933, 8935, 8936); `Store.recordCount` (8938) | CORE |
| [packages/store/src/store.ts:7358](../../packages/store/src/store.ts#L7358) `Store/toRecord` | `Calculations.value` (7358, 7368); `Calculations.globalValue` (7362); `Calculations.unstoredStyled` (7367) | CORE |
| [packages/store/src/store.ts:5734](../../packages/store/src/store.ts#L5734) `Store/totpAccounts` | `SQLite.all` (5734); `SQLite.prepare` (5734); `Store.sql` (5734) | CORE |
| [packages/store/src/store.ts:1552](../../packages/store/src/store.ts#L1552) `Store/trial` | `Store.sql` (1552) | CORE |
| [packages/store/src/store.ts:1557](../../packages/store/src/store.ts#L1557) `Store/trial/undo` | `Store.sql` (1557) | CORE |
| [packages/store/src/store.ts:11089](../../packages/store/src/store.ts#L11089) `Store/truncate/run` | `Store.sql` (11089, 11091, 11098, 11100, 11102, 11103); `SQLite.prepare` (11091, 11098); `SQLite.all` (11093) | CORE |
| [packages/store/src/store.ts:3687](../../packages/store/src/store.ts#L3687) `Store/unmigratedAccounts` | `SQLite.all` (3687); `SQLite.prepare` (3687); `Store.sql` (3687) | CORE |
| [packages/store/src/store.ts:4767](../../packages/store/src/store.ts#L4767) `Store/unusedAccess` | `SQLite.get` (4767); `SQLite.prepare` (4767, 4776); `Store.sql` (4767, 4776); `SQLite.all` (4776) | CORE |
| [packages/store/src/store.ts:4815](../../packages/store/src/store.ts#L4815) `Store/unusedObjects` | `SQLite.get` (4815); `SQLite.prepare` (4815, 4818); `Store.sql` (4815, 4818); `SQLite.all` (4818) | CORE |
| [packages/store/src/store.ts:5974](../../packages/store/src/store.ts#L5974) `Store/unusedRecoveryHashes` | `SQLite.all` (5974); `SQLite.prepare` (5974); `Store.sql` (5974) | CORE |
| [packages/store/src/store.ts:4597](../../packages/store/src/store.ts#L4597) `Store/unusualAccess` | `Store.auditLog` (4597, 4663) | CORE |
| [packages/store/src/store.ts:9623](../../packages/store/src/store.ts#L9623) `Store/update` | `Store.row` (9623); `Store.sql` (9654, 9655, 9694, 9697) | CORE |
| [packages/store/src/store.ts:9657](../../packages/store/src/store.ts#L9657) `Store/update/undo` | `Store.sql` (9657) | CORE |
| [packages/store/src/store.ts:10087](../../packages/store/src/store.ts#L10087) `Store/updatePortals` | `Store.row` (10087, 10123); `relatedRows` (10124) | CORE |
| [packages/store/src/store.ts:10097](../../packages/store/src/store.ts#L10097) `Store/updatePortals/portal/related` | `relatedIdList` (10097) | CORE |
| [packages/store/src/store.ts:10069](../../packages/store/src/store.ts#L10069) `Store/updateRelated` | `relatedRows` (10069) | CORE |
| [packages/store/src/store.ts:4853](../../packages/store/src/store.ts#L4853) `Store/usageCounting` | `SQLite.get` (4853); `SQLite.prepare` (4853); `Store.sql` (4853) | CORE |
| [packages/store/src/store.ts:8857](../../packages/store/src/store.ts#L8857) `Store/userPrefs` | `SQLite.all` (8857); `SQLite.prepare` (8857); `Store.sql` (8857) | CORE |
| [packages/store/src/store.ts:7739](../../packages/store/src/store.ts#L7739) `Store/valueListItemsCurrent` | `Store.valueListItems` (7739); `Store.get` (7753); `relatedRows` (7754); `Store.row` (7754); `SQLite.iterate` (7756); `SQLite.prepare` (7756); `Store.sql` (7756); `Calculations.related` (7766); `Calculations.value` (7770, 7771) | GATED-STORE |
| [packages/store/src/store.ts:10278](../../packages/store/src/store.ts#L10278) `Store/vaultHeld` | `SQLite.get` (10278); `SQLite.prepare` (10278); `Store.sql` (10278) | CORE |
| [packages/store/src/store.ts:5763](../../packages/store/src/store.ts#L5763) `Store/verifyTotp` | `SQLite.get` (5763); `SQLite.prepare` (5763, 5770); `Store.sql` (5763, 5770) | CORE |
| [packages/store/src/store.ts:2240](../../packages/store/src/store.ts#L2240) `Store/versionNumber` | `SQLite.get` (2240); `SQLite.prepare` (2240); `Store.sql` (2240) | CORE |
| [packages/store/src/store.ts:2118](../../packages/store/src/store.ts#L2118) `Store/versionTriggers` | `SQLite.get` (2118); `SQLite.prepare` (2118, 2123, 2124); `Store.sql` (2118, 2123, 2124, 2141, 2143, 2144, 2146); `SQLite.all` (2123, 2124) | CORE |
| [packages/store/src/store.ts:2086](../../packages/store/src/store.ts#L2086) `Store/warmSummariesCurrent` | `Calculations.wholeTable` (2086) | CORE |
| [packages/store/src/store.ts:4193](../../packages/store/src/store.ts#L4193) `Store/webViewerChecked` | `SQLite.get` (4193); `SQLite.prepare` (4193); `Store.sql` (4193) | CORE |
| [packages/store/src/store.ts:1844](../../packages/store/src/store.ts#L1844) `Store/withWriteTransaction` | `Store.sql` (1844, 1856, 1862, 1864, 1864) | CORE |
| [packages/store/src/store.ts:7293](../../packages/store/src/store.ts#L7293) `Store/wordIndex` | `Store.sql` (7293, 7301, 7306); `Store.recordCount` (7305); `SQLite.get` (7306); `SQLite.prepare` (7306) | CORE |
| [packages/store/src/store.ts:8437](../../packages/store/src/store.ts#L8437) `Store/writeExternalFile` | `Store.evaluateEach` (8437); `SQLite.prepare` (8460); `Store.sql` (8460) | CORE |
| [packages/store/src/store.ts:8461](../../packages/store/src/store.ts#L8461) `Store/writeExternalFile/taken` | `SQLite.get` (8461) | CORE |
| [packages/store/src/store.ts:5593](../../packages/store/src/store.ts#L5593) `Store/writeObjectUseRows` | `SQLite.prepare` (5593, 5594, 5599); `Store.sql` (5593, 5594, 5599) | CORE |
| [packages/store/src/store.ts:2295](../../packages/store/src/store.ts#L2295) `Store/writeToken` | `SQLite.get` (2295); `SQLite.prepare` (2295); `Store.sql` (2295) | CORE |
| [packages/store/src/store.ts:5565](../../packages/store/src/store.ts#L5565) `Store/writeUsage` | `Store.sql` (5565, 5566, 5568, 5572, 5574) | CORE |
| [packages/store/src/store.ts:5581](../../packages/store/src/store.ts#L5581) `Store/writeUsageRows` | `SQLite.prepare` (5581, 5582, 5588); `Store.sql` (5581, 5582, 5588) | CORE |
| [packages/store/src/store.ts:7014](../../packages/store/src/store.ts#L7014) `Store/design` | `SQLite.get` (7014) | CORE |
| [packages/store/src/store.ts:7036](../../packages/store/src/store.ts#L7036) `Store/themes` | `SQLite.get` (7036) | CORE |
| [packages/store/src/store.ts:5934](../../packages/store/src/store.ts#L5934) `Store/verifyPasskeyCredential` | `SQLite.get` (5934); `SQLite.prepare` (5934, 5946); `Store.sql` (5934, 5946) | CORE |
| [packages/store/src/store.ts:6874](../../packages/store/src/store.ts#L6874) `Store/passwordState` | `SQLite.get` (6874); `SQLite.prepare` (6874); `Store.sql` (6874) | CORE |
| [packages/store/src/store.ts:10222](../../packages/store/src/store.ts#L10222) `Store/deleteVisibility` | `Store.canViewRecord` (10222) | CORE |
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
