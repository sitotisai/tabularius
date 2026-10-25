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
| [packages/scripts/src/engine.ts:7995](../../packages/scripts/src/engine.ts#L7995) `ScriptEngine/containerFile` | `Store.get` (7995); `Store.containerId` (7996); `Store.container` (7997) | SCRIPT |
| [packages/scripts/src/engine.ts:5600](../../packages/scripts/src/engine.ts#L5600) `ScriptEngine/design` | `Store.valueListItems` (5600) | SCRIPT |
| [packages/scripts/src/engine.ts:6338](../../packages/scripts/src/engine.ts#L6338) `ScriptEngine/exportField` | `Store.get` (6338); `Store.containerId` (6339); `Store.container` (6341) | SCRIPT |
| [packages/scripts/src/engine.ts:8392](../../packages/scripts/src/engine.ts#L8392) `ScriptEngine/fileMakerRows` | `Store.findIds` (8392); `Store.get` (8397) | SCRIPT |
| [packages/scripts/src/engine.ts:8763](../../packages/scripts/src/engine.ts#L8763) `ScriptEngine/findRelated` | `Store.findIds` (8763, 8773, 8776) | SCRIPT |
| [packages/scripts/src/engine.ts:2313](../../packages/scripts/src/engine.ts#L2313) `ScriptEngine/foundSet` | `Store.findIds` (2313) | SCRIPT |
| [packages/scripts/src/engine.ts:5440](../../packages/scripts/src/engine.ts#L5440) `ScriptEngine/get` | `Store.findIds` (5440); `Store.canViewRecord` (5533); `Store.get` (5569) | SCRIPT |
| [packages/scripts/src/engine.ts:1969](../../packages/scripts/src/engine.ts#L1969) `ScriptEngine/goToLayout` | `Store.findIds` (1969) | SCRIPT |
| [packages/scripts/src/engine.ts:6909](../../packages/scripts/src/engine.ts#L6909) `ScriptEngine/goToList` | `Store.findIds` (6909) | SCRIPT |
| [packages/scripts/src/engine.ts:8161](../../packages/scripts/src/engine.ts#L8161) `ScriptEngine/importRecords` | `Store.findIds` (8161); `Store.get` (8181) | SCRIPT |
| [packages/scripts/src/engine.ts:5712](../../packages/scripts/src/engine.ts#L5712) `ScriptEngine/lookupNext` | `Store.get` (5712); `Store.row` (5713); `Calculations.context` (5715) | SCRIPT |
| [packages/scripts/src/engine.ts:5278](../../packages/scripts/src/engine.ts#L5278) `ScriptEngine/newCalcContext/executeSQL` | `Calculations.executeSQL` (5278) | SCRIPT |
| [packages/scripts/src/engine.ts:5286](../../packages/scripts/src/engine.ts#L5286) `ScriptEngine/newCalcContext/persistentData` | `Store.persistentData` (5286) | SCRIPT |
| [packages/scripts/src/engine.ts:5287](../../packages/scripts/src/engine.ts#L5287) `ScriptEngine/newCalcContext/persistentDataIds` | `Store.persistentDataIds` (5287) | SCRIPT |
| [packages/scripts/src/engine.ts:8432](../../packages/scripts/src/engine.ts#L8432) `ScriptEngine/newRecord` | `Store.findIds` (8432) | SCRIPT |
| [packages/scripts/src/engine.ts:8738](../../packages/scripts/src/engine.ts#L8738) `ScriptEngine/performFind` | `Store.findIds` (8738) | SCRIPT |
| [packages/scripts/src/engine.ts:8800](../../packages/scripts/src/engine.ts#L8800) `ScriptEngine/quickFind` | `Store.findIds` (8800, 8805, 8808); `Store.get` (8802) | SCRIPT |
| [packages/scripts/src/engine.ts:5654](../../packages/scripts/src/engine.ts#L5654) `ScriptEngine/record` | `Store.get` (5654) | SCRIPT |
| [packages/scripts/src/engine.ts:5815](../../packages/scripts/src/engine.ts#L5815) `ScriptEngine/relatedIds` | `Store.findIds` (5815); `rowsById` (5823); `Store.select` (5827); `Store.matchIds` (5841); `Store.viewableIds` (5864) | SCRIPT |
| [packages/scripts/src/engine.ts:5849](../../packages/scripts/src/engine.ts#L5849) `ScriptEngine/relatedIds/matching` | `Store.matchIds` (5849) | SCRIPT |
| [packages/scripts/src/engine.ts:6489](../../packages/scripts/src/engine.ts#L6489) `ScriptEngine/relookup` | `Store.get` (6489) | SCRIPT |
| [packages/scripts/src/engine.ts:3447](../../packages/scripts/src/engine.ts#L3447) `ScriptEngine/revertTransaction` | `Store.findIds` (3447) | SCRIPT |
| [packages/scripts/src/engine.ts:2378](../../packages/scripts/src/engine.ts#L2378) `ScriptEngine/semanticFind` | `Store.findIds` (2378, 2399) | SCRIPT |
| [packages/scripts/src/engine.ts:3350](../../packages/scripts/src/engine.ts#L3350) `ScriptEngine/sortIds` | `Store.sortIds` (3350); `Store.valueListItems` (3356) | SCRIPT |
| [packages/scripts/src/engine.ts:7251](../../packages/scripts/src/engine.ts#L7251) `ScriptEngine/sourceValue` | `Store.get` (7251); `Store.containerId` (7252); `Store.container` (7253) | SCRIPT |
| [packages/scripts/src/engine.ts:3293](../../packages/scripts/src/engine.ts#L3293) `ScriptEngine/sqlByNaturalLanguage` | `Calculations.translateSQL` (3293); `Calculations.executeSQL` (3300) | SCRIPT |
| [packages/scripts/src/engine.ts:4007](../../packages/scripts/src/engine.ts#L4007) `ScriptEngine/step` | `Store.fieldIndex` (4007); `Store.findIds` (4141, 4240) | SCRIPT |
| [packages/scripts/src/engine.ts:5687](../../packages/scripts/src/engine.ts#L5687) `ScriptEngine/valueOf` | `Store.findIds` (5687, 5687); `Store.containerId` (5695) | SCRIPT |
| [packages/scripts/src/engine.ts:9194](../../packages/scripts/src/engine.ts#L9194) `clearRecords` | `SQLite.all` (9194); `SQLite.prepare` (9194) | SCRIPT |
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
| [packages/store/src/store.ts:5238](../../packages/store/src/store.ts#L5238) `Store/accountIdentityId` | `SQLite.get` (5238, 5244); `SQLite.prepare` (5238, 5243, 5244); `Store.sql` (5238, 5243, 5244) | CORE |
| [packages/store/src/store.ts:5232](../../packages/store/src/store.ts#L5232) `Store/accountIdentityIdIfSet` | `SQLite.get` (5232); `SQLite.prepare` (5232); `Store.sql` (5232) | CORE |
| [packages/store/src/store.ts:5194](../../packages/store/src/store.ts#L5194) `Store/accountInactive` | `SQLite.get` (5194); `SQLite.prepare` (5194); `Store.sql` (5194) | CORE |
| [packages/store/src/store.ts:5391](../../packages/store/src/store.ts#L5391) `Store/accountLocalOnly` | `SQLite.get` (5391); `SQLite.prepare` (5391); `Store.sql` (5391) | CORE |
| [packages/store/src/store.ts:6260](../../packages/store/src/store.ts#L6260) `Store/accountPrivilegeSet` | `SQLite.get` (6260); `SQLite.prepare` (6260); `Store.sql` (6260) | CORE |
| [packages/store/src/store.ts:5396](../../packages/store/src/store.ts#L5396) `Store/accountRequires2fa` | `SQLite.get` (5396); `SQLite.prepare` (5396); `Store.sql` (5396) | CORE |
| [packages/store/src/store.ts:5616](../../packages/store/src/store.ts#L5616) `Store/accountUsage` | `SQLite.get` (5616); `SQLite.prepare` (5616, 5617); `Store.sql` (5616, 5617); `SQLite.all` (5617); `Store.auditLog` (5633) | CORE |
| [packages/store/src/store.ts:3651](../../packages/store/src/store.ts#L3651) `Store/accounts` | `SQLite.all` (3651); `SQLite.prepare` (3651); `Store.sql` (3651) | CORE |
| [packages/store/src/store.ts:3647](../../packages/store/src/store.ts#L3647) `Store/accountsSharingLockout` | `SQLite.all` (3647); `SQLite.prepare` (3647); `Store.sql` (3647) | CORE |
| [packages/store/src/store.ts:8372](../../packages/store/src/store.ts#L8372) `Store/addContainer` | `SQLite.all` (8372); `SQLite.prepare` (8372, 8377, 8391, 8395, 8396); `Store.sql` (8372, 8377, 8391, 8393, 8395, 8396, 8398, 8401); `SQLite.get` (8382); `Store.containerRange` (8384) | CORE |
| [packages/store/src/store.ts:8418](../../packages/store/src/store.ts#L8418) `Store/addExternalContainer` | `SQLite.prepare` (8418); `Store.sql` (8418) | CORE |
| [packages/store/src/store.ts:8895](../../packages/store/src/store.ts#L8895) `Store/addFieldIndex` | `Store.sql` (8895) | CORE |
| [packages/store/src/store.ts:7071](../../packages/store/src/store.ts#L7071) `Store/addImage` | `Store.sql` (7071, 7072); `SQLite.prepare` (7072) | CORE |
| [packages/store/src/store.ts:6310](../../packages/store/src/store.ts#L6310) `Store/addProvisionedAccount` | `SQLite.get` (6310); `SQLite.prepare` (6310, 6314); `Store.sql` (6310, 6314) | CORE |
| [packages/store/src/store.ts:7490](../../packages/store/src/store.ts#L7490) `Store/addRelated` | `relatedRows` (7490); `rowsById` (7523); `firstRelatedEach` (7546) | CORE |
| [packages/store/src/store.ts:3669](../../packages/store/src/store.ts#L3669) `Store/agentNeedsApproval` | `SQLite.get` (3669); `SQLite.prepare` (3669); `Store.sql` (3669) | CORE |
| [packages/store/src/store.ts:6524](../../packages/store/src/store.ts#L6524) `Store/allowedIds` | `SQLite.iterate` (6524); `SQLite.prepare` (6524); `Store.sql` (6524) | CORE |
| [packages/store/src/store.ts:5673](../../packages/store/src/store.ts#L5673) `Store/apiToken` | `SQLite.get` (5673); `SQLite.prepare` (5673, 5691); `Store.sql` (5673, 5691) | CORE |
| [packages/store/src/store.ts:5649](../../packages/store/src/store.ts#L5649) `Store/apiTokens` | `SQLite.all` (5649); `SQLite.prepare` (5649); `Store.sql` (5649) | CORE |
| [packages/store/src/store.ts:3110](../../packages/store/src/store.ts#L3110) `Store/appendSecurityRow` | `Store.sql` (3110) | CORE |
| [packages/store/src/store.ts:4009](../../packages/store/src/store.ts#L4009) `Store/appendSecurityEvent` | `Store.sql` (4009) | CORE |
| [packages/store/src/store.ts:5014](../../packages/store/src/store.ts#L5014) `Store/applyAccountImport` | `Store.sql` (5014, 5022, 5051); `SQLite.get` (5022); `SQLite.prepare` (5022, 5051) | CORE |
| [packages/store/src/store.ts:2423](../../packages/store/src/store.ts#L2423) `Store/applyDesign` | `Store.sql` (2423, 2424, 2437, 2440, 2445, 2461, 2464, 2464); `SQLite.prepare` (2440, 2445) | CORE |
| [packages/store/src/store.ts:3865](../../packages/store/src/store.ts#L3865) `Store/approvePending` | `SQLite.get` (3865); `SQLite.prepare` (3865, 3876); `Store.sql` (3865, 3876) | CORE |
| [packages/store/src/store.ts:2905](../../packages/store/src/store.ts#L2905) `Store/audit` | `Store.sql` (2905) | CORE |
| [packages/store/src/store.ts:2525](../../packages/store/src/store.ts#L2525) `Store/auditLog` | `SQLite.all` (2525); `SQLite.prepare` (2525); `Store.sql` (2525) | CORE |
| [packages/store/src/store.ts:1953](../../packages/store/src/store.ts#L1953) `Store/backup` | `Store.sql` (1953) | CORE |
| [packages/store/src/store.ts:3675](../../packages/store/src/store.ts#L3675) `Store/blankPasswordAccounts` | `SQLite.all` (3675); `SQLite.prepare` (3675); `Store.sql` (3675) | CORE |
| [packages/store/src/store.ts:9476](../../packages/store/src/store.ts#L9476) `Store/canView` | `Store.canView` (9476); `Store.row` (9477) | GATED-STORE |
| [packages/store/src/store.ts:9458](../../packages/store/src/store.ts#L9458) `Store/canViewRecord` | `SQLite.get` (9458); `SQLite.prepare` (9458); `Store.sql` (9458) | GATED-STORE |
| [packages/store/src/store.ts:4943](../../packages/store/src/store.ts#L4943) `Store/canonicalAccount` | `SQLite.all` (4943); `SQLite.prepare` (4943); `Store.sql` (4943) | CORE |
| [packages/store/src/store.ts:10565](../../packages/store/src/store.ts#L10565) `Store/cascadeDelete` | `relatedRows` (10565) | CORE |
| [packages/store/src/store.ts:2250](../../packages/store/src/store.ts#L2250) `Store/changeOne` | `Store.sql` (2250, 2252) | CORE |
| [packages/store/src/store.ts:2253](../../packages/store/src/store.ts#L2253) `Store/changeOne/read` | `SQLite.get` (2253); `SQLite.prepare` (2253); `Store.sql` (2253) | CORE |
| [packages/store/src/store.ts:8753](../../packages/store/src/store.ts#L8753) `Store/checkContainerWrite` | `Store.row` (8753) | CORE |
| [packages/store/src/store.ts:10188](../../packages/store/src/store.ts#L10188) `Store/checkEditable` | `Store.row` (10188) | CORE |
| [packages/store/src/store.ts:1499](../../packages/store/src/store.ts#L1499) `Store/checkpoint` | `SQLite.get` (1499); `SQLite.prepare` (1499); `Store.sql` (1499) | CORE |
| [packages/store/src/store.ts:6296](../../packages/store/src/store.ts#L6296) `Store/clearAccountPrivilegeSet` | `SQLite.prepare` (6296); `Store.sql` (6296) | CORE |
| [packages/store/src/store.ts:1521](../../packages/store/src/store.ts#L1521) `Store/close` | `Store.sql` (1521) | CORE |
| [packages/store/src/store.ts:8721](../../packages/store/src/store.ts#L8721) `Store/compactFile` | `Store.sql` (8721, 8722, 8724) | CORE |
| [packages/store/src/store.ts:10689](../../packages/store/src/store.ts#L10689) `Store/computeValuesCurrent` | `Store.computeValues` (10689); `Store.sql` (10695, 10699); `SQLite.all` (10699); `SQLite.prepare` (10699) | GATED-STORE |
| [packages/store/src/store.ts:9127](../../packages/store/src/store.ts#L9127) `Store/computedRows` | `Store.sql` (9127, 9130, 9131, 9132, 9134, 9144, 9145, 9146, 9149); `SQLite.prepare` (9130, 9132, 9134, 9144); `SQLite.iterate` (9134); `Calculations.globalValue` (9137); `Calculations.unstoredValue` (9138); `Calculations.related` (9141); `SQLite.all` (9144) | CORE |
| [packages/store/src/store.ts:5718](../../packages/store/src/store.ts#L5718) `Store/confirmTotp` | `SQLite.get` (5718); `SQLite.prepare` (5718, 5720); `Store.sql` (5718, 5720) | CORE |
| [packages/store/src/store.ts:1145](../../packages/store/src/store.ts#L1145) `Store/constructor` | `Store.sql` (1145, 1147, 1149, 1150, 1154, 1158, 1159, 1168, 1176, 1191, 1196, 1201, 1202, 1206, 1207, 1208, 1215, 1219, 1223, 1224, 1225, 1230, 1234, 1237, 1238, 1240, 1241, 1244, 1245, 1249, 1250, 1254, 1255, 1258, 1260, 1263, 1264, 1268, 1269, 1273, 1274, 1278, 1279, 1280, 1283, 1284, 1287, 1288, 1290, 1290, 1291, 1291, 1292, 1295, 1299, 1301, 1304, 1305, 1306, 1309, 1310, 1312, 1314, 1315, 1319, 1320, 1322, 1334, 1336, 1337, 1338, 1338, 1342, 1343); `SQLite.get` (1149, 1168); `SQLite.prepare` (1149, 1168, 1176, 1237, 1238, 1241, 1244, 1249, 1254, 1263, 1268, 1273, 1283, 1287, 1290, 1291, 1309, 1314, 1319); `SQLite.all` (1237, 1244, 1249, 1254, 1263, 1268, 1273, 1283, 1287, 1290, 1291, 1309, 1314, 1319) | CORE |
| [packages/store/src/store.ts:6076](../../packages/store/src/store.ts#L6076) `Store/consumeRecoveryCode` | `SQLite.prepare` (6076); `Store.sql` (6076) | CORE |
| [packages/store/src/store.ts:8296](../../packages/store/src/store.ts#L8296) `Store/container` | `SQLite.get` (8296); `SQLite.prepare` (8296, 8305); `Store.sql` (8296, 8305); `SQLite.all` (8305) | CORE |
| [packages/store/src/store.ts:8730](../../packages/store/src/store.ts#L8730) `Store/containerId` | `Store.containerId` (8730); `Store.row` (8731) | CORE |
| [packages/store/src/store.ts:8313](../../packages/store/src/store.ts#L8313) `Store/containerInfo` | `SQLite.get` (8313); `SQLite.prepare` (8313); `Store.sql` (8313) | CORE |
| [packages/store/src/store.ts:8277](../../packages/store/src/store.ts#L8277) `Store/containerIntact` | `SQLite.get` (8277); `SQLite.prepare` (8277); `Store.sql` (8277) | CORE |
| [packages/store/src/store.ts:8216](../../packages/store/src/store.ts#L8216) `Store/containerIntegrityReport` | `SQLite.all` (8216); `SQLite.prepare` (8216, 8227); `Store.sql` (8216, 8227); `SQLite.get` (8227) | CORE |
| [packages/store/src/store.ts:8291](../../packages/store/src/store.ts#L8291) `Store/containerMeta` | `SQLite.get` (8291); `SQLite.prepare` (8291); `Store.sql` (8291) | CORE |
| [packages/store/src/store.ts:8347](../../packages/store/src/store.ts#L8347) `Store/containerRange` | `SQLite.all` (8347); `SQLite.prepare` (8347, 8354); `Store.sql` (8347, 8354); `SQLite.get` (8354) | CORE |
| [packages/store/src/store.ts:8118](../../packages/store/src/store.ts#L8118) `Store/containerReferences` | `SQLite.all` (8118, 8137, 8139, 8145, 8158, 8169, 8183); `SQLite.prepare` (8118, 8137, 8139, 8145, 8158, 8169, 8181, 8183); `Store.sql` (8118, 8137, 8139, 8145, 8158, 8169, 8181, 8183); `SQLite.get` (8181); `Store.row` (8192) | CORE |
| [packages/store/src/store.ts:10669](../../packages/store/src/store.ts#L10669) `Store/countIds` | `Store.countIds` (10669); `SQLite.get` (10673); `SQLite.prepare` (10673); `Store.sql` (10673) | GATED-STORE |
| [packages/store/src/store.ts:9507](../../packages/store/src/store.ts#L9507) `Store/create` | `SQLite.get` (9507); `SQLite.prepare` (9507, 9520); `Store.sql` (9507, 9520) | CORE |
| [packages/store/src/store.ts:3981](../../packages/store/src/store.ts#L3981) `Store/createAccount` | `SQLite.get` (3981); `SQLite.prepare` (3981, 3985, 3991, 3996, 4001); `Store.sql` (3981, 3985, 3991, 3996, 4001) | CORE |
| [packages/store/src/store.ts:5449](../../packages/store/src/store.ts#L5449) `Store/createApiToken` | `SQLite.get` (5449, 5477); `SQLite.prepare` (5449, 5476, 5477, 5487); `Store.sql` (5449, 5476, 5477, 5487) | CORE |
| [packages/store/src/store.ts:4955](../../packages/store/src/store.ts#L4955) `Store/createLocalAccount` | `SQLite.prepare` (4955); `Store.sql` (4955) | CORE |
| [packages/store/src/store.ts:3641](../../packages/store/src/store.ts#L3641) `Store/credentialIdentity` | `SQLite.get` (3641); `SQLite.prepare` (3641); `Store.sql` (3641) | CORE |
| [packages/store/src/store.ts:5370](../../packages/store/src/store.ts#L5370) `Store/credentialStamp` | `SQLite.get` (5370); `SQLite.prepare` (5370); `Store.sql` (5370) | CORE |
| [packages/store/src/store.ts:2043](../../packages/store/src/store.ts#L2043) `Store/dataVersion` | `SQLite.get` (2043); `SQLite.prepare` (2043); `Store.sql` (2043) | CORE |
| [packages/store/src/store.ts:11133](../../packages/store/src/store.ts#L11133) `Store/decimalViewSql` | `SQLite.all` (11133); `SQLite.prepare` (11133) | CORE |
| [packages/store/src/store.ts:10231](../../packages/store/src/store.ts#L10231) `Store/delete` | `Store.row` (10231) | CORE |
| [packages/store/src/store.ts:10239](../../packages/store/src/store.ts#L10239) `Store/delete/run` | `SQLite.get` (10239); `SQLite.prepare` (10239, 10244); `Store.sql` (10239, 10244) | CORE |
| [packages/store/src/store.ts:5109](../../packages/store/src/store.ts#L5109) `Store/deleteAccount` | `SQLite.prepare` (5109, 5113, 5114, 5115, 5116, 5117, 5118, 5119, 5120, 5127, 5129, 5131, 5133, 5137); `Store.sql` (5109, 5113, 5114, 5115, 5116, 5117, 5118, 5119, 5120, 5127, 5129, 5131, 5133, 5137) | CORE |
| [packages/store/src/store.ts:10312](../../packages/store/src/store.ts#L10312) `Store/deleteBeingUndone` | `SQLite.all` (10312); `SQLite.prepare` (10312); `Store.sql` (10312) | CORE |
| [packages/store/src/store.ts:10324](../../packages/store/src/store.ts#L10324) `Store/deleteEndingTheLifeAt` | `SQLite.get` (10324); `SQLite.prepare` (10324); `Store.sql` (10324) | CORE |
| [packages/store/src/store.ts:6161](../../packages/store/src/store.ts#L6161) `Store/deletePrivilegeSet` | `SQLite.prepare` (6161); `Store.sql` (6161) | CORE |
| [packages/store/src/store.ts:4119](../../packages/store/src/store.ts#L4119) `Store/deleteScriptTest` | `SQLite.prepare` (4119); `Store.sql` (4119) | CORE |
| [packages/store/src/store.ts:3278](../../packages/store/src/store.ts#L3278) `Store/deletedRows` | `SQLite.get` (3278); `SQLite.prepare` (3278, 3280, 3280); `Store.sql` (3278, 3280, 3280); `SQLite.all` (3280, 3280) | CORE |
| [packages/store/src/store.ts:3388](../../packages/store/src/store.ts#L3388) `Store/designEffect` | `Store.sql` (3388, 3394, 3395, 3398, 3404, 3409, 3412, 3418, 3429, 3430, 3432, 3433, 3446, 3447, 3450, 3452, 3458, 3459, 3460, 3466, 3468, 3472, 3475, 3476, 3478, 3481, 3487, 3489, 3496, 3497, 3499, 3500, 3501, 3502, 3509, 3510, 3512, 3512, 3514, 3515, 3516, 3520, 3524, 3526, 3564, 3566, 3568); `SQLite.prepare` (3398, 3429, 3430, 3446, 3447, 3458, 3459, 3466, 3468, 3472, 3476, 3487, 3489, 3502, 3509, 3510, 3512, 3514, 3516, 3520, 3524); `SQLite.get` (3429, 3446, 3458, 3459, 3472, 3476, 3512, 3520); `SQLite.all` (3509, 3510); `SQLite.iterate` (3514) | CORE |
| [packages/store/src/store.ts:3381](../../packages/store/src/store.ts#L3381) `Store/designEffect/renameExcluded` | `SQLite.prepare` (3381); `Store.sql` (3381) | CORE |
| [packages/store/src/store.ts:3365](../../packages/store/src/store.ts#L3365) `Store/designEffect/renameKey` | `SQLite.prepare` (3365); `Store.sql` (3365) | CORE |
| [packages/store/src/store.ts:3319](../../packages/store/src/store.ts#L3319) `Store/designHistory` | `SQLite.all` (3319); `SQLite.prepare` (3319); `Store.sql` (3319) | CORE |
| [packages/store/src/store.ts:5739](../../packages/store/src/store.ts#L5739) `Store/disableTotp` | `SQLite.prepare` (5739); `Store.sql` (5739) | CORE |
| [packages/store/src/store.ts:3576](../../packages/store/src/store.ts#L3576) `Store/dropColumnIndexes` | `SQLite.all` (3576, 3578); `SQLite.prepare` (3576, 3578); `Store.sql` (3576, 3578, 3579) | CORE |
| [packages/store/src/store.ts:8907](../../packages/store/src/store.ts#L8907) `Store/dropFieldIndex` | `SQLite.get` (8907); `SQLite.prepare` (8907); `Store.sql` (8907, 8908) | CORE |
| [packages/store/src/store.ts:9544](../../packages/store/src/store.ts#L9544) `Store/duplicate` | `Store.row` (9544); `SQLite.prepare` (9562); `Store.sql` (9562) | CORE |
| [packages/store/src/store.ts:8534](../../packages/store/src/store.ts#L8534) `Store/embeddedContainerCount` | `SQLite.prepare` (8534); `Store.sql` (8534); `SQLite.get` (8535) | CORE |
| [packages/store/src/store.ts:8520](../../packages/store/src/store.ts#L8520) `Store/embeddedContainers` | `SQLite.prepare` (8520, 8521); `Store.sql` (8520, 8521); `SQLite.all` (8521); `SQLite.get` (8525) | CORE |
| [packages/store/src/store.ts:3304](../../packages/store/src/store.ts#L3304) `Store/emptyDeleted` | `Store.sql` (3304, 3307, 3308, 3310, 3312); `SQLite.prepare` (3308) | CORE |
| [packages/store/src/store.ts:1919](../../packages/store/src/store.ts#L1919) `Store/endTransaction` | `Store.sql` (1919, 1922, 1922) | CORE |
| [packages/store/src/store.ts:5707](../../packages/store/src/store.ts#L5707) `Store/enrollTotp` | `SQLite.prepare` (5707); `Store.sql` (5707) | CORE |
| [packages/store/src/store.ts:3273](../../packages/store/src/store.ts#L3273) `Store/ensureDeleted` | `Store.sql` (3273) | CORE |
| [packages/store/src/store.ts:1353](../../packages/store/src/store.ts#L1353) `Store/ensureNativeIds` | `SQLite.all` (1353, 1365); `SQLite.prepare` (1353, 1356, 1364, 1365); `Store.sql` (1353, 1356, 1359, 1363, 1364, 1365, 1368, 1370) | CORE |
| [packages/store/src/store.ts:2163](../../packages/store/src/store.ts#L2163) `Store/ensureRecordIdHighWater` | `Store.sql` (2163, 2165, 2167, 2169) | CORE |
| [packages/store/src/store.ts:2181](../../packages/store/src/store.ts#L2181) `Store/ensureRecordIdMarks` | `SQLite.all` (2181, 2184, 2187, 2196); `SQLite.prepare` (2181, 2184, 2187, 2190, 2196, 2199); `Store.sql` (2181, 2184, 2187, 2190, 2196, 2199, 2203, 2204) | CORE |
| [packages/store/src/store.ts:9885](../../packages/store/src/store.ts#L9885) `Store/evaluateCurrent` | `Store.row` (9885, 9885, 9886, 9886); `Calculations.context` (9891); `Store.get` (9892, 9894) | GATED-STORE |
| [packages/store/src/store.ts:9926](../../packages/store/src/store.ts#L9926) `Store/evaluateEachCurrent` | `Store.row` (9926, 9926, 9931); `Calculations.context` (9932); `Store.get` (9934) | GATED-STORE |
| [packages/store/src/store.ts:9988](../../packages/store/src/store.ts#L9988) `Store/evaluateRowsCurrent` | `Store.row` (9988, 9988, 9989, 9989) | GATED-STORE |
| [packages/store/src/store.ts:9967](../../packages/store/src/store.ts#L9967) `Store/evaluateRowsCurrent/each` | `Calculations.context` (9967); `Store.get` (9969) | GATED-STORE |
| [packages/store/src/store.ts:10003](../../packages/store/src/store.ts#L10003) `Store/evaluateRowsCurrent/found/[Symbol.iterator]` | `rowsById` (10003) | GATED-STORE |
| [packages/store/src/store.ts:10025](../../packages/store/src/store.ts#L10025) `Store/evaluateRowsCurrent/key` | `Calculations.context` (10025) | GATED-STORE |
| [packages/store/src/store.ts:3908](../../packages/store/src/store.ts#L3908) `Store/externalAccount` | `SQLite.all` (3908); `SQLite.prepare` (3908); `Store.sql` (3908) | CORE |
| [packages/store/src/store.ts:8039](../../packages/store/src/store.ts#L8039) `Store/externalContainerCheck` | `SQLite.all` (8039); `SQLite.prepare` (8039); `Store.sql` (8039) | CORE |
| [packages/store/src/store.ts:8046](../../packages/store/src/store.ts#L8046) `Store/externalContainerCount` | `SQLite.get` (8046); `SQLite.prepare` (8046); `Store.sql` (8046) | CORE |
| [packages/store/src/store.ts:8055](../../packages/store/src/store.ts#L8055) `Store/externalContainerReport` | `SQLite.all` (8055, 8068); `SQLite.prepare` (8055, 8068); `Store.sql` (8055, 8068) | CORE |
| [packages/store/src/store.ts:5220](../../packages/store/src/store.ts#L5220) `Store/externalIdentityId` | `SQLite.get` (5220, 5227); `SQLite.prepare` (5220, 5226, 5227); `Store.sql` (5220, 5226, 5227) | CORE |
| [packages/store/src/store.ts:8287](../../packages/store/src/store.ts#L8287) `Store/externalOf` | `SQLite.get` (8287); `SQLite.prepare` (8287); `Store.sql` (8287) | CORE |
| [packages/store/src/store.ts:3054](../../packages/store/src/store.ts#L3054) `Store/failureAuditRoom` | `SQLite.get` (3054); `SQLite.prepare` (3054); `Store.sql` (3054) | CORE |
| [packages/store/src/store.ts:7692](../../packages/store/src/store.ts#L7692) `Store/fieldIndexCurrent` | `SQLite.iterate` (7692); `SQLite.prepare` (7692, 7697); `Store.sql` (7692, 7697); `SQLite.all` (7697) | GATED-STORE |
| [packages/store/src/store.ts:8942](../../packages/store/src/store.ts#L8942) `Store/find` | `Store.find` (8942) | GATED-STORE |
| [packages/store/src/store.ts:9314](../../packages/store/src/store.ts#L9314) `Store/findCandidates` | `Store.query` (9314) | CORE |
| [packages/store/src/store.ts:8953](../../packages/store/src/store.ts#L8953) `Store/findHere` | `Store.query` (8953, 8958, 8960, 8974, 8976, 8987); `Store.recordCount` (8971); `SQLite.get` (8972, 8976); `SQLite.prepare` (8972, 8976, 8982, 8989, 8998); `Store.sql` (8972, 8976, 8982, 8989, 8998); `SQLite.all` (8982, 8989, 8998) | GATED-STORE |
| [packages/store/src/store.ts:8993](../../packages/store/src/store.ts#L8993) `Store/findHere/[Symbol.iterator]` | `SQLite.iterate` (8993); `SQLite.prepare` (8993); `Store.sql` (8993) | GATED-STORE |
| [packages/store/src/store.ts:10714](../../packages/store/src/store.ts#L10714) `Store/findIdsCurrent` | `Store.findIds` (10714) | GATED-STORE |
| [packages/store/src/store.ts:10720](../../packages/store/src/store.ts#L10720) `Store/findIdsHere` | `Store.query` (10720, 10725, 10727); `SQLite.iterate` (10738); `SQLite.prepare` (10738); `Store.sql` (10738) | GATED-STORE |
| [packages/store/src/store.ts:9258](../../packages/store/src/store.ts#L9258) `Store/findSource` | `Store.query` (9258); `SQLite.all` (9267, 9284); `SQLite.prepare` (9267, 9275, 9283); `Store.sql` (9267, 9272, 9275, 9280, 9283, 9297, 9299); `Calculations.globalValue` (9289); `Calculations.unstoredValue` (9290); `Calculations.related` (9294) | CORE |
| [packages/store/src/store.ts:3166](../../packages/store/src/store.ts#L3166) `Store/flushDeferredSecurity` | `Store.sql` (3166) | CORE |
| [packages/store/src/store.ts:10279](../../packages/store/src/store.ts#L10279) `Store/forgetStandInValues` | `Store.sql` (10279, 10300); `SQLite.prepare` (10300) | CORE |
| [packages/store/src/store.ts:5076](../../packages/store/src/store.ts#L5076) `Store/forgetStandIns` | `SQLite.prepare` (5076); `Store.sql` (5076) | CORE |
| [packages/store/src/store.ts:7574](../../packages/store/src/store.ts#L7574) `Store/foundSetPage` | `rowsById` (7574) | CORE |
| [packages/store/src/store.ts:7590](../../packages/store/src/store.ts#L7590) `Store/foundSetRowsCurrent` | `Store.viewableIds` (7590); `Store.row` (7606) | GATED-STORE |
| [packages/store/src/store.ts:3827](../../packages/store/src/store.ts#L3827) `Store/gateAgentWrite` | `SQLite.get` (3827); `SQLite.prepare` (3827, 3829); `Store.sql` (3827, 3829) | CORE |
| [packages/store/src/store.ts:6014](../../packages/store/src/store.ts#L6014) `Store/generateRecoveryCodes` | `SQLite.prepare` (6014, 6017); `Store.sql` (6014, 6017) | CORE |
| [packages/store/src/store.ts:9386](../../packages/store/src/store.ts#L9386) `Store/getCurrent` | `Store.get` (9386); `Store.row` (9387, 9387, 9401); `SQLite.all` (9404); `SQLite.prepare` (9404); `Store.sql` (9404) | GATED-STORE |
| [packages/store/src/store.ts:9424](../../packages/store/src/store.ts#L9424) `Store/getManyCurrent` | `Store.getMany` (9424); `SQLite.get` (9442); `SQLite.prepare` (9442); `Store.sql` (9442) | GATED-STORE |
| [packages/store/src/store.ts:9435](../../packages/store/src/store.ts#L9435) `Store/getManyCurrent/[Symbol.iterator]` | `rowsById` (9435) | GATED-STORE |
| [packages/store/src/store.ts:1400](../../packages/store/src/store.ts#L1400) `Store/grantFullAccessClients` | `SQLite.prepare` (1400); `Store.sql` (1400) | CORE |
| [packages/store/src/store.ts:10755](../../packages/store/src/store.ts#L10755) `Store/groupSummariesCurrent` | `Store.groupSummaries` (10755); `Store.viewableIds` (10760); `Calculations.collect` (10776); `rowsById` (10776, 10826); `Calculations.collector` (10798) | GATED-STORE |
| [packages/store/src/store.ts:10824](../../packages/store/src/store.ts#L10824) `Store/groupSummariesCurrent/flush` | `Calculations.collector` (10824) | GATED-STORE |
| [packages/store/src/store.ts:10788](../../packages/store/src/store.ts#L10788) `Store/groupSummariesCurrent/key` | `Calculations.value` (10788); `Calculations.related` (10790) | GATED-STORE |
| [packages/store/src/store.ts:1427](../../packages/store/src/store.ts#L1427) `Store/hasOwnPassword` | `SQLite.get` (1427); `SQLite.prepare` (1427); `Store.sql` (1427) | CORE |
| [packages/store/src/store.ts:5869](../../packages/store/src/store.ts#L5869) `Store/hasPasskey` | `SQLite.get` (5869); `SQLite.prepare` (5869); `Store.sql` (5869) | CORE |
| [packages/store/src/store.ts:1408](../../packages/store/src/store.ts#L1408) `Store/hasProvingPassword` | `SQLite.get` (1408); `SQLite.prepare` (1408); `Store.sql` (1408) | CORE |
| [packages/store/src/store.ts:8861](../../packages/store/src/store.ts#L8861) `Store/hasTable` | `SQLite.get` (8861); `SQLite.prepare` (8861); `Store.sql` (8861) | CORE |
| [packages/store/src/store.ts:5728](../../packages/store/src/store.ts#L5728) `Store/hasTotp` | `SQLite.get` (5728); `SQLite.prepare` (5728); `Store.sql` (5728) | CORE |
| [packages/store/src/store.ts:5199](../../packages/store/src/store.ts#L5199) `Store/identityAllowed` | `SQLite.get` (5199, 5205, 5211); `SQLite.prepare` (5199, 5205, 5211); `Store.sql` (5199, 5205, 5211) | CORE |
| [packages/store/src/store.ts:7048](../../packages/store/src/store.ts#L7048) `Store/image` | `SQLite.get` (7048); `SQLite.prepare` (7048); `Store.sql` (7048) | CORE |
| [packages/store/src/store.ts:7058](../../packages/store/src/store.ts#L7058) `Store/images` | `SQLite.all` (7058); `SQLite.prepare` (7058); `Store.sql` (7058) | CORE |
| [packages/store/src/store.ts:4920](../../packages/store/src/store.ts#L4920) `Store/importAccounts` | `SQLite.all` (4920); `SQLite.prepare` (4920); `Store.sql` (4920) | CORE |
| [packages/store/src/store.ts:1741](../../packages/store/src/store.ts#L1741) `Store/independentWindowWrite` | `SQLite.get` (1741); `SQLite.prepare` (1741, 1749, 1809); `Store.sql` (1741, 1749, 1759, 1787, 1804, 1809, 1812); `SQLite.all` (1749); `Store.row` (1807) | CORE |
| [packages/store/src/store.ts:2217](../../packages/store/src/store.ts#L2217) `Store/nextRecordId` | `SQLite.get` (2217); `SQLite.prepare` (2217); `Store.sql` (2217) | CORE |
| [packages/store/src/store.ts:1586](../../packages/store/src/store.ts#L1586) `Store/securityChainHeadAudit` | `SQLite.get` (1586); `SQLite.prepare` (1586); `Store.sql` (1586) | CORE |
| [packages/store/src/store.ts:8873](../../packages/store/src/store.ts#L8873) `Store/indexedFields` | `SQLite.all` (8873, 8874); `SQLite.prepare` (8873, 8874); `Store.sql` (8873, 8874) | CORE |
| [packages/store/src/store.ts:11166](../../packages/store/src/store.ts#L11166) `Store/internalRoots` | `SQLite.get` (11166); `SQLite.prepare` (11166, 11168); `SQLite.all` (11168) | CORE |
| [packages/store/src/store.ts:3663](../../packages/store/src/store.ts#L3663) `Store/isAgent` | `SQLite.get` (3663); `SQLite.prepare` (3663); `Store.sql` (3663) | CORE |
| [packages/store/src/store.ts:3766](../../packages/store/src/store.ts#L3766) `Store/isExternal` | `SQLite.get` (3766); `SQLite.prepare` (3766); `Store.sql` (3766) | CORE |
| [packages/store/src/store.ts:5783](../../packages/store/src/store.ts#L5783) `Store/issueWebauthnChallenge` | `SQLite.prepare` (5783, 5785, 5786, 5788); `Store.sql` (5783, 5785, 5786, 5788); `SQLite.get` (5785) | CORE |
| [packages/store/src/store.ts:11029](../../packages/store/src/store.ts#L11029) `Store/iterateCommitted` | `SQLite.iterate` (11029) | CORE |
| [packages/store/src/store.ts:1681](../../packages/store/src/store.ts#L1681) `Store/joinTransaction` | `Store.sql` (1681, 1682, 1684, 1686, 1692, 1695) | CORE |
| [packages/store/src/store.ts:10512](../../packages/store/src/store.ts#L10512) `Store/keyStepWork` | `Store.sql` (10512, 10518, 10522, 10524) | CORE |
| [packages/store/src/store.ts:6915](../../packages/store/src/store.ts#L6915) `Store/knownSharedAccount` | `SQLite.get` (6915); `SQLite.prepare` (6915); `Store.sql` (6915) | CORE |
| [packages/store/src/store.ts:4393](../../packages/store/src/store.ts#L4393) `Store/lastSignIns` | `Store.auditLog` (4393) | CORE |
| [packages/store/src/store.ts:10330](../../packages/store/src/store.ts#L10330) `Store/latestDeleteSeq` | `SQLite.get` (10330); `SQLite.prepare` (10330); `Store.sql` (10330) | CORE |
| [packages/store/src/store.ts:7088](../../packages/store/src/store.ts#L7088) `Store/layout` | `SQLite.get` (7088); `SQLite.prepare` (7088); `Store.sql` (7088) | CORE |
| [packages/store/src/store.ts:3336](../../packages/store/src/store.ts#L3336) `Store/layoutHistory` | `SQLite.all` (3336); `SQLite.prepare` (3336); `Store.sql` (3336) | CORE |
| [packages/store/src/store.ts:6978](../../packages/store/src/store.ts#L6978) `Store/layouts` | `SQLite.all` (6978); `SQLite.prepare` (6978); `Store.sql` (6978) | CORE |
| [packages/store/src/store.ts:4693](../../packages/store/src/store.ts#L4693) `Store/leastPrivilege` | `SQLite.all` (4693); `SQLite.prepare` (4693); `Store.sql` (4693) | CORE |
| [packages/store/src/store.ts:5297](../../packages/store/src/store.ts#L5297) `Store/ledgerRow` | `SQLite.get` (5297, 5298); `SQLite.prepare` (5297, 5298); `Store.sql` (5297, 5298) | AUTH |
| [packages/store/src/store.ts:5309](../../packages/store/src/store.ts#L5309) `Store/ledgerWrite` | `Store.sql` (5309, 5310, 5312, 5314, 5317, 5317) | AUTH |
| [packages/store/src/store.ts:5003](../../packages/store/src/store.ts#L5003) `Store/limitAccountImport` | `SQLite.prepare` (5003, 5004, 5007); `Store.sql` (5003, 5004, 5007); `SQLite.get` (5004) | CORE |
| [packages/store/src/store.ts:3616](../../packages/store/src/store.ts#L3616) `Store/linkIdentity` | `SQLite.get` (3616); `SQLite.prepare` (3616); `Store.sql` (3616) | CORE |
| [packages/store/src/store.ts:3608](../../packages/store/src/store.ts#L3608) `Store/linkPrincipal` | `SQLite.get` (3608); `SQLite.prepare` (3608); `Store.sql` (3608) | CORE |
| [packages/store/src/store.ts:4279](../../packages/store/src/store.ts#L4279) `Store/markPiiField` | `SQLite.prepare` (4279); `Store.sql` (4279) | CORE |
| [packages/store/src/store.ts:8012](../../packages/store/src/store.ts#L8012) `Store/markRepeating` | `SQLite.prepare` (8012); `Store.sql` (8012) | CORE |
| [packages/store/src/store.ts:10962](../../packages/store/src/store.ts#L10962) `Store/matchIds` | `Store.matchIds` (10962); `SQLite.all` (10968); `SQLite.prepare` (10968); `Store.sql` (10968) | CORE |
| [packages/store/src/store.ts:1442](../../packages/store/src/store.ts#L1442) `Store/meta` | `SQLite.get` (1442); `SQLite.prepare` (1442); `Store.sql` (1442) | CORE |
| [packages/store/src/store.ts:1000](../../packages/store/src/store.ts#L1000) `Store/metadataVersions` | `SQLite.get` (1000); `SQLite.prepare` (1000); `Store.sql` (1000) | CORE |
| [packages/store/src/store.ts:8649](../../packages/store/src/store.ts#L8649) `Store/moveContainersIn` | `Store.sql` (8649, 8655, 8657, 8658, 8659, 8660, 8680, 8685, 8685, 8696, 8699, 8702, 8709); `SQLite.prepare` (8657, 8658, 8659, 8660, 8696, 8702); `SQLite.get` (8662, 8696, 8702) | CORE |
| [packages/store/src/store.ts:8571](../../packages/store/src/store.ts#L8571) `Store/moveContainersOut` | `Store.sql` (8571, 8579, 8581, 8583, 8588, 8589, 8609, 8615, 8617, 8619, 8619, 8625, 8625, 8630, 8632, 8634, 8634, 8640); `SQLite.get` (8579); `SQLite.prepare` (8579, 8588, 8589); `Store.container` (8591) | CORE |
| [packages/store/src/store.ts:4874](../../packages/store/src/store.ts#L4874) `Store/mustChangePassword` | `SQLite.get` (4874); `SQLite.prepare` (4874); `Store.sql` (4874) | CORE |
| [packages/store/src/store.ts:1378](../../packages/store/src/store.ts#L1378) `Store/nativeIdGuards` | `Store.sql` (1378, 1379, 1381) | CORE |
| [packages/store/src/store.ts:5603](../../packages/store/src/store.ts#L5603) `Store/objectUseSince` | `SQLite.get` (5603); `SQLite.prepare` (5603); `Store.sql` (5603) | CORE |
| [packages/store/src/store.ts:8833](../../packages/store/src/store.ts#L8833) `Store/orderBy` | `Store.valueListItems` (8833) | CORE |
| [packages/store/src/store.ts:8204](../../packages/store/src/store.ts#L8204) `Store/orphanContainerReport` | `SQLite.all` (8204); `SQLite.prepare` (8204); `Store.sql` (8204) | CORE |
| [packages/store/src/store.ts:5835](../../packages/store/src/store.ts#L5835) `Store/passkeyAllowList` | `SQLite.all` (5835); `SQLite.prepare` (5835); `Store.sql` (5835) | CORE |
| [packages/store/src/store.ts:5874](../../packages/store/src/store.ts#L5874) `Store/passkeyIds` | `SQLite.all` (5874); `SQLite.prepare` (5874); `Store.sql` (5874) | CORE |
| [packages/store/src/store.ts:5862](../../packages/store/src/store.ts#L5862) `Store/passkeys` | `SQLite.all` (5862); `SQLite.prepare` (5862); `Store.sql` (5862) | CORE |
| [packages/store/src/store.ts:4913](../../packages/store/src/store.ts#L4913) `Store/passwordDaysRemaining` | `SQLite.get` (4913); `SQLite.prepare` (4913); `Store.sql` (4913) | CORE |
| [packages/store/src/store.ts:3851](../../packages/store/src/store.ts#L3851) `Store/pendingChanges` | `SQLite.all` (3851); `SQLite.prepare` (3851); `Store.sql` (3851) | CORE |
| [packages/store/src/store.ts:1460](../../packages/store/src/store.ts#L1460) `Store/persistentData` | `SQLite.get` (1460) | CORE |
| [packages/store/src/store.ts:1469](../../packages/store/src/store.ts#L1469) `Store/persistentDataIds` | `SQLite.all` (1469) | CORE |
| [packages/store/src/store.ts:1450](../../packages/store/src/store.ts#L1450) `Store/persistentTable` | `Store.sql` (1450) | CORE |
| [packages/store/src/store.ts:10173](../../packages/store/src/store.ts#L10173) `Store/portalContainerTarget` | `Store.row` (10173); `relatedIdList` (10175) | CORE |
| [packages/store/src/store.ts:7629](../../packages/store/src/store.ts#L7629) `Store/portalCountsCurrent` | `Store.canView` (7629); `Store.row` (7656) | GATED-STORE |
| [packages/store/src/store.ts:7867](../../packages/store/src/store.ts#L7867) `Store/portalRows` | `relatedRows` (7867); `relatedIdList` (7868); `Store.viewableSet` (7871); `rowsById` (7896, 7934); `Calculations.related` (7910) | CORE |
| [packages/store/src/store.ts:7878](../../packages/store/src/store.ts#L7878) `Store/portalRows/context` | `Calculations.context` (7878) | CORE |
| [packages/store/src/store.ts:7888](../../packages/store/src/store.ts#L7888) `Store/portalRows/valueOf` | `Calculations.value` (7888) | CORE |
| [packages/store/src/store.ts:2591](../../packages/store/src/store.ts#L2591) `Store/prepared` | `SQLite.prepare` (2591); `Store.sql` (2591) | CORE |
| [packages/store/src/store.ts:4985](../../packages/store/src/store.ts#L4985) `Store/previewAccountImport` | `Store.sql` (4985, 4986, 4995) | CORE |
| [packages/store/src/store.ts:6678](../../packages/store/src/store.ts#L6678) `Store/previewRecordRuleCurrent` | `SQLite.get` (6678); `SQLite.prepare` (6678, 6681); `Store.sql` (6678, 6681); `SQLite.all` (6681); `Calculations.context` (6687, 6703) | CORE |
| [packages/store/src/store.ts:9349](../../packages/store/src/store.ts#L9349) `Store/previewRow` | `Store.row` (9349) | CORE |
| [packages/store/src/store.ts:6089](../../packages/store/src/store.ts#L6089) `Store/privilegeSets` | `Store.sql` (6089) | CORE |
| [packages/store/src/store.ts:2823](../../packages/store/src/store.ts#L2823) `Store/pruneAudit` | `Store.sql` (2823, 2825, 2827); `SQLite.get` (2825); `SQLite.prepare` (2825) | CORE |
| [packages/store/src/store.ts:8239](../../packages/store/src/store.ts#L8239) `Store/purgeOrphanContainers` | `Store.sql` (8239, 8243, 8252, 8255, 8256, 8261, 8262, 8264, 8264); `Store.orphanContainerReport` (8247); `SQLite.get` (8252); `SQLite.prepare` (8252, 8255, 8256) | CORE |
| [packages/store/src/store.ts:11283](../../packages/store/src/store.ts#L11283) `Store/query` | `SQLite.iterate` (11283) | CORE |
| [packages/store/src/store.ts:11323](../../packages/store/src/store.ts#L11323) `Store/queryWithOriginsCurrent` | `SQLite.iterate` (11323); `SQLite.all` (11332, 11335); `SQLite.prepare` (11332, 11335) | CORE |
| [packages/store/src/store.ts:11078](../../packages/store/src/store.ts#L11078) `Store/readOnlyChecked` | `SQLite.prepare` (11078, 11082, 11091, 11096); `SQLite.all` (11082, 11091, 11096) | CORE |
| [packages/store/src/store.ts:3588](../../packages/store/src/store.ts#L3588) `Store/recompute` | `SQLite.prepare` (3588, 3592); `Store.sql` (3588, 3592); `SQLite.iterate` (3592); `Calculations.computeStoredStyled` (3593); `Calculations.value` (3593) | CORE |
| [packages/store/src/store.ts:2606](../../packages/store/src/store.ts#L2606) `Store/recordAsOf` | `SQLite.get` (2606, 2608); `SQLite.prepare` (2606, 2608, 2610, 2611); `Store.sql` (2606, 2608, 2610, 2611); `SQLite.all` (2610, 2611) | CORE |
| [packages/store/src/store.ts:2304](../../packages/store/src/store.ts#L2304) `Store/recordCount` | `SQLite.get` (2304); `SQLite.prepare` (2304); `Store.sql` (2304) | CORE |
| [packages/store/src/store.ts:2683](../../packages/store/src/store.ts#L2683) `Store/recordLife` | `SQLite.all` (2683); `SQLite.prepare` (2683); `Store.sql` (2683) | CORE |
| [packages/store/src/store.ts:5534](../../packages/store/src/store.ts#L5534) `Store/recordObjectUse` | `Store.sql` (5534) | CORE |
| [packages/store/src/store.ts:9875](../../packages/store/src/store.ts#L9875) `Store/recordViewable` | `Store.row` (9875) | GATED-STORE |
| [packages/store/src/store.ts:1507](../../packages/store/src/store.ts#L1507) `Store/recordedFormat` | `Store.sql` (1507) | CORE |
| [packages/store/src/store.ts:8543](../../packages/store/src/store.ts#L8543) `Store/recoverContainersOut` | `SQLite.prepare` (8543); `Store.sql` (8543); `SQLite.get` (8546) | CORE |
| [packages/store/src/store.ts:1610](../../packages/store/src/store.ts#L1610) `Store/recoverPendingExternalFiles` | `Store.sql` (1610, 1612, 1636, 1638); `SQLite.prepare` (1612); `SQLite.get` (1623) | CORE |
| [packages/store/src/store.ts:6032](../../packages/store/src/store.ts#L6032) `Store/recoveryCodesRemaining` | `SQLite.get` (6032); `SQLite.prepare` (6032); `Store.sql` (6032) | CORE |
| [packages/store/src/store.ts:11118](../../packages/store/src/store.ts#L11118) `Store/refreshDecimalSqlViews` | `SQLite.get` (11118); `SQLite.prepare` (11118) | CORE |
| [packages/store/src/store.ts:3757](../../packages/store/src/store.ts#L3757) `Store/refuseLookalikeAccount` | `SQLite.all` (3757); `SQLite.prepare` (3757); `Store.sql` (3757) | CORE |
| [packages/store/src/store.ts:5898](../../packages/store/src/store.ts#L5898) `Store/registerPasskey` | `SQLite.prepare` (5898); `Store.sql` (5898) | CORE |
| [packages/store/src/store.ts:3886](../../packages/store/src/store.ts#L3886) `Store/rejectPending` | `SQLite.get` (3886); `SQLite.prepare` (3886, 3888); `Store.sql` (3886, 3888) | CORE |
| [packages/store/src/store.ts:9101](../../packages/store/src/store.ts#L9101) `Store/relatedCriteria` | `SQLite.iterate` (9101); `SQLite.prepare` (9101); `Store.sql` (9101) | CORE |
| [packages/store/src/store.ts:9098](../../packages/store/src/store.ts#L9098) `Store/relatedCriteria/matched` | `relatedRows` (9098) | CORE |
| [packages/store/src/store.ts:7416](../../packages/store/src/store.ts#L7416) `Store/relatedValues` | `Calculations.globalValue` (7416); `Calculations.unstoredValue` (7418) | CORE |
| [packages/store/src/store.ts:5911](../../packages/store/src/store.ts#L5911) `Store/removePasskey` | `SQLite.get` (5911); `SQLite.prepare` (5911, 5912); `Store.sql` (5911, 5912) | CORE |
| [packages/store/src/store.ts:10350](../../packages/store/src/store.ts#L10350) `Store/restoreDeletedRowLocked` | `SQLite.get` (10350, 10355); `SQLite.prepare` (10350, 10351, 10355, 10365); `Store.sql` (10350, 10351, 10355, 10365); `SQLite.all` (10351) | CORE |
| [packages/store/src/store.ts:2641](../../packages/store/src/store.ts#L2641) `Store/restoreRecord` | `Store.recordAsOf` (2641); `SQLite.get` (2645); `SQLite.prepare` (2645, 2650, 2659, 2670); `Store.sql` (2645, 2650, 2659, 2670) | CORE |
| [packages/store/src/store.ts:2699](../../packages/store/src/store.ts#L2699) `Store/revertAuditEntry` | `SQLite.get` (2699); `SQLite.prepare` (2699); `Store.sql` (2699); `Store.canViewRecord` (2701); `Store.auditLog` (2704) | CORE |
| [packages/store/src/store.ts:5659](../../packages/store/src/store.ts#L5659) `Store/revokeApiToken` | `SQLite.prepare` (5659); `Store.sql` (5659) | CORE |
| [packages/store/src/store.ts:5182](../../packages/store/src/store.ts#L5182) `Store/revokeSignInCredentials` | `SQLite.prepare` (5182, 5183, 5184); `Store.sql` (5182, 5183, 5184) | AUTH |
| [packages/store/src/store.ts:9367](../../packages/store/src/store.ts#L9367) `Store/row` | `SQLite.get` (9367) | CORE |
| [packages/store/src/store.ts:11220](../../packages/store/src/store.ts#L11220) `Store/rowsOf` | `SQLite.iterate` (11220, 11228) | CORE |
| [packages/store/src/store.ts:6483](../../packages/store/src/store.ts#L6483) `Store/ruleOutcome` | `Calculations.context` (6483) | CORE |
| [packages/store/src/store.ts:9212](../../packages/store/src/store.ts#L9212) `Store/runningSummaryValues` | `Store.viewableIds` (9212); `rowsById` (9214); `Calculations.value` (9225, 9231); `Calculations.related` (9242) | GATED-STORE |
| [packages/store/src/store.ts:6118](../../packages/store/src/store.ts#L6118) `Store/savePrivilegeSet` | `SQLite.prepare` (6118, 6126); `Store.sql` (6118, 6126) | AUTH |
| [packages/store/src/store.ts:4110](../../packages/store/src/store.ts#L4110) `Store/saveScriptTest` | `SQLite.prepare` (4110); `Store.sql` (4110) | CORE |
| [packages/store/src/store.ts:6643](../../packages/store/src/store.ts#L6643) `Store/scopedTableSql` | `Store.viewableIds` (6643); `SQLite.all` (6646); `SQLite.prepare` (6646); `Store.sql` (6646) | GATED-STORE |
| [packages/store/src/store.ts:3326](../../packages/store/src/store.ts#L3326) `Store/scriptHistory` | `SQLite.all` (3326); `SQLite.prepare` (3326); `Store.sql` (3326) | CORE |
| [packages/store/src/store.ts:2999](../../packages/store/src/store.ts#L2999) `Store/securityChange` | `Store.sql` (2999, 3001); `SQLite.prepare` (3001) | CORE |
| [packages/store/src/store.ts:2565](../../packages/store/src/store.ts#L2565) `Store/securityEvents` | `Store.auditLog` (2565) | CORE |
| [packages/store/src/store.ts:5383](../../packages/store/src/store.ts#L5383) `Store/securityToken` | `SQLite.get` (5383); `SQLite.prepare` (5383); `Store.sql` (5383) | CORE |
| [packages/store/src/store.ts:11249](../../packages/store/src/store.ts#L11249) `Store/selectHeldCurrent` | `Store.sql` (11249, 11250, 11252); `SQLite.prepare` (11250) | CORE |
| [packages/store/src/store.ts:10655](../../packages/store/src/store.ts#L10655) `Store/selectIdsCurrent` | `Store.selectIds` (10655); `SQLite.all` (10661); `SQLite.prepare` (10661); `Store.sql` (10661) | GATED-STORE |
| [packages/store/src/store.ts:11239](../../packages/store/src/store.ts#L11239) `Store/selectIn` | `Store.select` (11239) | CORE |
| [packages/store/src/store.ts:1973](../../packages/store/src/store.ts#L1973) `Store/selfContainedCopy` | `Store.sql` (1973); `SQLite.all` (1978); `SQLite.prepare` (1978, 1980, 1981, 1982) | CORE |
| [packages/store/src/store.ts:5161](../../packages/store/src/store.ts#L5161) `Store/setAccountActive` | `SQLite.prepare` (5161, 5169, 5170); `Store.sql` (5161, 5169, 5170) | AUTH |
| [packages/store/src/store.ts:5402](../../packages/store/src/store.ts#L5402) `Store/setAccountLocalOnly` | `SQLite.prepare` (5402); `Store.sql` (5402) | CORE |
| [packages/store/src/store.ts:6274](../../packages/store/src/store.ts#L6274) `Store/setAccountPrivilegeSet` | `SQLite.get` (6274); `SQLite.prepare` (6274, 6277, 6281); `Store.sql` (6274, 6277, 6281) | AUTH |
| [packages/store/src/store.ts:5411](../../packages/store/src/store.ts#L5411) `Store/setAccountRequire2fa` | `SQLite.prepare` (5411); `Store.sql` (5411) | CORE |
| [packages/store/src/store.ts:3787](../../packages/store/src/store.ts#L3787) `Store/setAgentAccount` | `SQLite.get` (3787); `SQLite.prepare` (3787, 3793); `Store.sql` (3787, 3793) | CORE |
| [packages/store/src/store.ts:4154](../../packages/store/src/store.ts#L4154) `Store/setAiAllowed` | `SQLite.prepare` (4154); `Store.sql` (4154) | CORE |
| [packages/store/src/store.ts:4237](../../packages/store/src/store.ts#L4237) `Store/setAiPolicy` | `SQLite.prepare` (4237); `Store.sql` (4237) | CORE |
| [packages/store/src/store.ts:6902](../../packages/store/src/store.ts#L6902) `Store/setAllowBlankPasswordFromLan` | `SQLite.prepare` (6902); `Store.sql` (6902) | CORE |
| [packages/store/src/store.ts:2801](../../packages/store/src/store.ts#L2801) `Store/setAuditSettings` | `SQLite.prepare` (2801); `Store.sql` (2801) | CORE |
| [packages/store/src/store.ts:8762](../../packages/store/src/store.ts#L8762) `Store/setContainer` | `Store.sql` (8762); `Store.row` (8768) | CORE |
| [packages/store/src/store.ts:3739](../../packages/store/src/store.ts#L3739) `Store/setExternalAccount` | `SQLite.get` (3739); `SQLite.prepare` (3739, 3744); `Store.sql` (3739, 3744) | CORE |
| [packages/store/src/store.ts:4860](../../packages/store/src/store.ts#L4860) `Store/setMustChangePassword` | `SQLite.prepare` (4860); `Store.sql` (4860) | CORE |
| [packages/store/src/store.ts:3939](../../packages/store/src/store.ts#L3939) `Store/setPassword` | `SQLite.get` (3939); `SQLite.prepare` (3939, 3945, 3954, 3961, 3962, 3963); `Store.sql` (3939, 3945, 3954, 3961, 3962, 3963) | AUTH |
| [packages/store/src/store.ts:4051](../../packages/store/src/store.ts#L4051) `Store/setPasswordPolicy` | `SQLite.prepare` (4051); `Store.sql` (4051) | CORE |
| [packages/store/src/store.ts:1475](../../packages/store/src/store.ts#L1475) `Store/setPersistentData` | `SQLite.prepare` (1475, 1479); `Store.sql` (1475, 1479) | CORE |
| [packages/store/src/store.ts:4257](../../packages/store/src/store.ts#L4257) `Store/setPiiIsolation` | `SQLite.prepare` (4257); `Store.sql` (4257) | CORE |
| [packages/store/src/store.ts:4087](../../packages/store/src/store.ts#L4087) `Store/setRequireTotpForFullAccess` | `SQLite.prepare` (4087); `Store.sql` (4087) | CORE |
| [packages/store/src/store.ts:4169](../../packages/store/src/store.ts#L4169) `Store/setScriptNetwork` | `SQLite.prepare` (4169); `Store.sql` (4169) | CORE |
| [packages/store/src/store.ts:4226](../../packages/store/src/store.ts#L4226) `Store/setSqlRequiresFmxdbc` | `SQLite.prepare` (4226); `Store.sql` (4226) | CORE |
| [packages/store/src/store.ts:9796](../../packages/store/src/store.ts#L9796) `Store/setStoredCalcValues` | `SQLite.prepare` (9796, 9797); `Store.sql` (9796, 9797); `SQLite.get` (9801) | CORE |
| [packages/store/src/store.ts:8865](../../packages/store/src/store.ts#L8865) `Store/setUserPref` | `Store.sql` (8865, 8866, 8867); `SQLite.prepare` (8866, 8867) | CORE |
| [packages/store/src/store.ts:4210](../../packages/store/src/store.ts#L4210) `Store/setWebViewerHosts` | `SQLite.prepare` (4210); `Store.sql` (4210) | CORE |
| [packages/store/src/store.ts:5336](../../packages/store/src/store.ts#L5336) `Store/settleSignIns` | `SQLite.all` (5336, 5342); `SQLite.prepare` (5336, 5342, 5348, 5352, 5354); `Store.sql` (5336, 5342, 5348, 5352, 5354) | AUTH |
| [packages/store/src/store.ts:2104](../../packages/store/src/store.ts#L2104) `Store/shareResults` | `Store.sql` (2104) | CORE |
| [packages/store/src/store.ts:1537](../../packages/store/src/store.ts#L1537) `Store/shipWal` | `Store.sql` (1537) | CORE |
| [packages/store/src/store.ts:5283](../../packages/store/src/store.ts#L5283) `Store/signInBase` | `SQLite.get` (5283); `SQLite.prepare` (5283); `Store.sql` (5283) | AUTH |
| [packages/store/src/store.ts:5285](../../packages/store/src/store.ts#L5285) `Store/signInBase/identity` | `SQLite.get` (5285); `SQLite.prepare` (5285); `Store.sql` (5285) | AUTH |
| [packages/store/src/store.ts:5272](../../packages/store/src/store.ts#L5272) `Store/signInMark` | `SQLite.prepare` (5272); `Store.sql` (5272) | AUTH |
| [packages/store/src/store.ts:10880](../../packages/store/src/store.ts#L10880) `Store/sortIdsCurrentProgress` | `SQLite.all` (10880); `SQLite.prepare` (10880, 10948); `Store.sql` (10880, 10948); `Store.valueListItems` (10888); `rowsById` (10900); `Calculations.globalValue` (10903); `Calculations.unstoredValue` (10904); `Calculations.related` (10910); `SQLite.iterate` (10948) | GATED-STORE |
| [packages/store/src/store.ts:9026](../../packages/store/src/store.ts#L9026) `Store/sortedPage` | `SQLite.iterate` (9026); `SQLite.prepare` (9026, 9041); `Store.sql` (9026, 9041); `SQLite.all` (9041) | CORE |
| [packages/store/src/store.ts:11034](../../packages/store/src/store.ts#L11034) `Store/storedFileId` | `SQLite.get` (11034); `SQLite.prepare` (11034) | CORE |
| [packages/store/src/store.ts:9174](../../packages/store/src/store.ts#L9174) `Store/summaries` | `Calculations.wholeTable` (9174); `Calculations.collect` (9194, 9199) | CORE |
| [packages/store/src/store.ts:9190](../../packages/store/src/store.ts#L9190) `Store/summaries/recs` | `SQLite.iterate` (9190); `SQLite.prepare` (9190); `Store.sql` (9190) | CORE |
| [packages/store/src/store.ts:5849](../../packages/store/src/store.ts#L5849) `Store/takeWebauthnChallenge` | `SQLite.get` (5849); `SQLite.prepare` (5849, 5853); `Store.sql` (5849, 5853) | CORE |
| [packages/store/src/store.ts:8918](../../packages/store/src/store.ts#L8918) `Store/timeFind` | `Store.query` (8918, 8922, 8923); `Store.recordCount` (8925) | CORE |
| [packages/store/src/store.ts:7357](../../packages/store/src/store.ts#L7357) `Store/toRecord` | `Calculations.value` (7357, 7367); `Calculations.globalValue` (7361); `Calculations.unstoredStyled` (7366) | CORE |
| [packages/store/src/store.ts:5733](../../packages/store/src/store.ts#L5733) `Store/totpAccounts` | `SQLite.all` (5733); `SQLite.prepare` (5733); `Store.sql` (5733) | CORE |
| [packages/store/src/store.ts:1549](../../packages/store/src/store.ts#L1549) `Store/trial` | `Store.sql` (1549) | CORE |
| [packages/store/src/store.ts:1554](../../packages/store/src/store.ts#L1554) `Store/trial/undo` | `Store.sql` (1554) | CORE |
| [packages/store/src/store.ts:10990](../../packages/store/src/store.ts#L10990) `Store/truncate/run` | `Store.sql` (10990, 10992, 10999, 11001, 11003, 11004); `SQLite.prepare` (10992, 10999); `SQLite.all` (10994) | CORE |
| [packages/store/src/store.ts:3686](../../packages/store/src/store.ts#L3686) `Store/unmigratedAccounts` | `SQLite.all` (3686); `SQLite.prepare` (3686); `Store.sql` (3686) | CORE |
| [packages/store/src/store.ts:4766](../../packages/store/src/store.ts#L4766) `Store/unusedAccess` | `SQLite.get` (4766); `SQLite.prepare` (4766, 4775); `Store.sql` (4766, 4775); `SQLite.all` (4775) | CORE |
| [packages/store/src/store.ts:4814](../../packages/store/src/store.ts#L4814) `Store/unusedObjects` | `SQLite.get` (4814); `SQLite.prepare` (4814, 4817); `Store.sql` (4814, 4817); `SQLite.all` (4817) | CORE |
| [packages/store/src/store.ts:5973](../../packages/store/src/store.ts#L5973) `Store/unusedRecoveryHashes` | `SQLite.all` (5973); `SQLite.prepare` (5973); `Store.sql` (5973) | CORE |
| [packages/store/src/store.ts:4596](../../packages/store/src/store.ts#L4596) `Store/unusualAccess` | `Store.auditLog` (4596, 4662) | CORE |
| [packages/store/src/store.ts:9617](../../packages/store/src/store.ts#L9617) `Store/update` | `Store.row` (9617); `Store.sql` (9648, 9649, 9688, 9691) | CORE |
| [packages/store/src/store.ts:9651](../../packages/store/src/store.ts#L9651) `Store/update/undo` | `Store.sql` (9651) | CORE |
| [packages/store/src/store.ts:10081](../../packages/store/src/store.ts#L10081) `Store/updatePortals` | `Store.row` (10081, 10117); `relatedRows` (10118) | CORE |
| [packages/store/src/store.ts:10091](../../packages/store/src/store.ts#L10091) `Store/updatePortals/portal/related` | `relatedIdList` (10091) | CORE |
| [packages/store/src/store.ts:10063](../../packages/store/src/store.ts#L10063) `Store/updateRelated` | `relatedRows` (10063) | CORE |
| [packages/store/src/store.ts:4852](../../packages/store/src/store.ts#L4852) `Store/usageCounting` | `SQLite.get` (4852); `SQLite.prepare` (4852); `Store.sql` (4852) | CORE |
| [packages/store/src/store.ts:8856](../../packages/store/src/store.ts#L8856) `Store/userPrefs` | `SQLite.all` (8856); `SQLite.prepare` (8856); `Store.sql` (8856) | CORE |
| [packages/store/src/store.ts:7738](../../packages/store/src/store.ts#L7738) `Store/valueListItemsCurrent` | `Store.valueListItems` (7738); `Store.get` (7752); `relatedRows` (7753); `Store.row` (7753); `SQLite.iterate` (7755); `SQLite.prepare` (7755); `Store.sql` (7755); `Calculations.related` (7765); `Calculations.value` (7769, 7770) | GATED-STORE |
| [packages/store/src/store.ts:10272](../../packages/store/src/store.ts#L10272) `Store/vaultHeld` | `SQLite.get` (10272); `SQLite.prepare` (10272); `Store.sql` (10272) | CORE |
| [packages/store/src/store.ts:5762](../../packages/store/src/store.ts#L5762) `Store/verifyTotp` | `SQLite.get` (5762); `SQLite.prepare` (5762, 5769); `Store.sql` (5762, 5769) | CORE |
| [packages/store/src/store.ts:2237](../../packages/store/src/store.ts#L2237) `Store/versionNumber` | `SQLite.get` (2237); `SQLite.prepare` (2237); `Store.sql` (2237) | CORE |
| [packages/store/src/store.ts:2115](../../packages/store/src/store.ts#L2115) `Store/versionTriggers` | `SQLite.get` (2115); `SQLite.prepare` (2115, 2120, 2121); `Store.sql` (2115, 2120, 2121, 2138, 2140, 2141, 2143); `SQLite.all` (2120, 2121) | CORE |
| [packages/store/src/store.ts:2083](../../packages/store/src/store.ts#L2083) `Store/warmSummariesCurrent` | `Calculations.wholeTable` (2083) | CORE |
| [packages/store/src/store.ts:4192](../../packages/store/src/store.ts#L4192) `Store/webViewerChecked` | `SQLite.get` (4192); `SQLite.prepare` (4192); `Store.sql` (4192) | CORE |
| [packages/store/src/store.ts:1841](../../packages/store/src/store.ts#L1841) `Store/withWriteTransaction` | `Store.sql` (1841, 1853, 1859, 1861, 1861) | CORE |
| [packages/store/src/store.ts:7292](../../packages/store/src/store.ts#L7292) `Store/wordIndex` | `Store.sql` (7292, 7300, 7305); `Store.recordCount` (7304); `SQLite.get` (7305); `SQLite.prepare` (7305) | CORE |
| [packages/store/src/store.ts:8436](../../packages/store/src/store.ts#L8436) `Store/writeExternalFile` | `Store.evaluateEach` (8436); `SQLite.prepare` (8459); `Store.sql` (8459) | CORE |
| [packages/store/src/store.ts:8460](../../packages/store/src/store.ts#L8460) `Store/writeExternalFile/taken` | `SQLite.get` (8460) | CORE |
| [packages/store/src/store.ts:5592](../../packages/store/src/store.ts#L5592) `Store/writeObjectUseRows` | `SQLite.prepare` (5592, 5593, 5598); `Store.sql` (5592, 5593, 5598) | CORE |
| [packages/store/src/store.ts:2292](../../packages/store/src/store.ts#L2292) `Store/writeToken` | `SQLite.get` (2292); `SQLite.prepare` (2292); `Store.sql` (2292) | CORE |
| [packages/store/src/store.ts:5564](../../packages/store/src/store.ts#L5564) `Store/writeUsage` | `Store.sql` (5564, 5565, 5567, 5571, 5573) | CORE |
| [packages/store/src/store.ts:5580](../../packages/store/src/store.ts#L5580) `Store/writeUsageRows` | `SQLite.prepare` (5580, 5581, 5587); `Store.sql` (5580, 5581, 5587) | CORE |
| [packages/store/src/store.ts:7013](../../packages/store/src/store.ts#L7013) `Store/design` | `SQLite.get` (7013) | CORE |
| [packages/store/src/store.ts:7035](../../packages/store/src/store.ts#L7035) `Store/themes` | `SQLite.get` (7035) | CORE |
| [packages/store/src/store.ts:5933](../../packages/store/src/store.ts#L5933) `Store/verifyPasskeyCredential` | `SQLite.get` (5933); `SQLite.prepare` (5933, 5945); `Store.sql` (5933, 5945) | CORE |
| [packages/store/src/store.ts:6873](../../packages/store/src/store.ts#L6873) `Store/passwordState` | `SQLite.get` (6873); `SQLite.prepare` (6873); `Store.sql` (6873) | CORE |
| [packages/store/src/store.ts:10216](../../packages/store/src/store.ts#L10216) `Store/deleteVisibility` | `Store.canViewRecord` (10216) | CORE |
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
