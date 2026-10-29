# v0.1.0 release facts check

The corrected candidate is `notes/release-notes/v0.1.0.md`. The task prohibits
changes under `.github/`, so `.github/release-notes/v0.1.0.md` remains unchanged.
The supervisor must transfer the reviewed candidate there before release.
Nothing was published, tagged, downloaded or installed.

## Release summary review

| Statement | Checked-in evidence and disposition |
| --- | --- |
| MIT, reads and hosts files, SQLite beside the original, original unchanged | `LICENSE`, `README.md`, `docs/ARCHITECTURE.md`, `docs/moving-a-solution.md`, `packages/store/src/import.ts`. Retained; named the unchanged `<name>.openhbam.sqlite` store explicitly. |
| Early release, data works end to end | Retained as the repository's stated status, not a claim of full compatibility. Support limits now point directly to both support inventories. No real source files were opened. |
| macOS/Linux arm64/x64 installer, no separate Node | `QUICKSTART.md`, `scripts/get.sh`. Same download command; added checksum, `~/.local/bin` and PATH instructions. Removed “nothing else”: the shell installer uses system download and checksum utilities. |
| Demo, local access, Admin password, cleanup | `QUICKSTART.md`, `packages/cli/src/demo.ts`. Retained; clarified that the password is printed. These are default demo behaviors; `--keep` intentionally preserves files. No demo was launched. |
| Manual checksums, executable bit and quarantine | Commands match `QUICKSTART.md`; checksum and quarantine handling also exist in `scripts/get.sh`. Retained. |
| Binary names and platforms, glibc, Windows conditional availability | `scripts/build-release.ts`, `scripts/release-assemble.ts`, `QUICKSTART.md`, `docs/release-builds.md`. Names retained; Windows execution explicitly unverified. Published assets cannot be checked offline. |
| SBOM and licence notices | `scripts/build-release.ts`, `scripts/release-assemble.ts`. Added the assembler's platform-specific notice filenames when notice contents differ. |
| Checkout and Docker installation | `QUICKSTART.md` contains both. Retained the reference instead of duplicating their commands. |
| Schema, data and container reading; encryption | `packages/fmp12/src/index.ts`, `packages/fmp12/src/schema.ts`, `README.md`, `docs/moving-a-solution.md`. Removed unencrypted-only claim; Encryption at Rest requires a passphrase. Secure external containers remain unsupported, as recorded in `docs/known-differences.md`. |
| Data API-shaped REST, not full parity | `docs/data-api-compatibility.md`, `docs/known-differences.md`. Retained explicit partial/missing qualification. Vendor behavior not established offline remains unverified. |
| Existing layouts and HTML/CSS/JavaScript design | `README.md`, `docs/web-client.md`, `docs/design-mode.md`, `packages/server/src/webclient.ts`. Retained with explicit rendering-limit reference. |
| Calculations, scripts, scratch debugging and reverse steps | `packages/scripts/src/engine.ts`, `packages/scripts/src/recorder.ts`, `packages/server/src/debug.ts`, `docs/script-steps-support.md`. Distinguished default scratch debugging from Record run playback; added support-limit references. |
| MCP privileges, explain_value, check_change_impact | Registrations in `packages/server/src/mcp.ts` and `mcp-design.ts`, `docs/reference/mcp.md`. Retained existing tool names; no tool or route changed. |
| No telemetry, analytics or automatic update check | `docs/privacy.md` and its listed no-phone-home checks. Retained the opt-in qualification; installation and explicit upgrade commands can download. |
| Browser clients; no native Pro/Go connection | `docs/moving-a-solution.md`, `docs/web-client.md`. Retained. |
| Imported non-empty passwords need resetting; blank passwords local by default | `docs/moving-a-solution.md` Passwords, `QUICKSTART.md`. Retained. Existing command spelling `tabularius passwd` is correct. |
| Plug-ins | `docs/plugin-compatibility.md`, `docs/known-differences.md`. Narrowed “never loaded” to native FileMaker plug-ins, avoiding a denial of Tabularius's own plug-in system. Removed universal error-3 claim: unsupported MBS calls can return error text. |
| Offline scripts and screen-dependent steps | `docs/privacy.md`, `docs/script-steps-support.md`, `packages/scripts/src/engine.ts`. Corrected to outbound-off-by-default, with per-file network permission; interactive dialogs work in the web client. Unattended and unavailable steps retain documented limits. |
| No write-back to .fmp12 | `docs/ARCHITECTURE.md`, `docs/moving-a-solution.md`. Retained. |
| Imported privileges | `docs/moving-a-solution.md` Custom privileges, `packages/store/src/privileges.ts` fromFmp12. Replaced “flattened” with recognized overall levels and fail-closed handling; named undecoded custom access and record-access calculations. |
| report command and known differences | `README.md`, `packages/cli/src/main.ts`, `docs/known-differences.md`. Retained. No report on a real file was run. |
| 0.x version promises and private security reporting | `docs/versioning.md`, `SECURITY.md`, package versions. Retained. |

There were no port numbers in the original release notes. No new flags, routes,
settings, support decisions or compatibility behaviors were introduced. Generated
references and known differences therefore have no changed source to regenerate.

## Changelog review

The generator already groups by label, prefix or changed paths, counts conversion
work and accepts offline `--prs` input. No generator code fix is needed. It does
not fact-check PR titles or discover that an old entry was superseded.

The existing changelog is an incomplete historical draft, not a current output
of the generator: it lists older entries first and has 159 undisclosed entries.
No original PR input manifest is present, and git/gh use is forbidden. The
historical total and PR attribution are therefore unverified. They are preserved,
not presented as a newly computed inventory. The introduction now states this.

| Existing entries | Evidence / action |
| --- | --- |
| #2, #11, #13, #30, #181 | `/next/` is still served by `webclient.ts`; URL state, announcements, bundle budget and immutable module serving remain in `packages/web/src/url-state.ts`, `announcer.ts`, `scripts/web-bundle-budget.ts` and `webclient.ts`. Retained. |
| #38, #184, #185, #198 | Failed-calculation write guards in `engine.ts`; MBS linear-time tests, JSON limits, script masking, PDF and recorder budget implementations/tests still exist. Retained. |
| #48, #49 | Historical test-data hygiene entries; repository rules still require neutral synthetic data and secrets assembled from parts. Attribution cannot be revalidated without history. Retained as historical entries. |
| #116, #183, #187 | Read-only inspection of the CI configuration confirms labelled macOS PR runs and gates plus four main shards. #116 describes an earlier policy superseded by #183; the introduction now explains that entries can be superseded. No workflow edited. |
| #1 | README still names MIT. Retained. |
| #3, #4, #5, #7, #8 | Backup signing/restore checks, request admission, privilege handling, heap collection in `packages/store/src/errors.ts`, and browser feature checks remain present. Retained historical descriptions. |
| #9, #14 | Reader changes incorrectly appeared individually in Other. Replaced with the generator's wording for a Conversion count of two. No additional claims about the 159 undisclosed entries. |
| #10 | `packages/server/test/observability-robustness.test.ts` still covers the described debugger, WAL and logging behaviors. Retained. |
| #12 | CLI still imports folder claiming and strict setting parsers; mail and secret handling implementations remain. Retained historical description. |
| #15, #16 | Plug-in management and script replay/transaction machinery remain; transaction windows/options tests still exist. Retained historical descriptions; merge attribution remains unverified. |

Listed entries plus omitted entries plus the two conversion entries still sum to
185. No entry points to a removed file or setting; `/next/` still exists. A complete
fresh generator run requires authorized history access or an authoritative PR list.

## Validation

- `node --no-warnings --test --test-concurrency=2 packages/cli/test/release-notes-facts.test.ts`: before edits, 1 passed / 4 failed; after edits, 5 passed / 0 failed. No child processes, network, source files or services are used by these tests.
- `npm run typecheck`: passed (both TypeScript projects).
- Existing `release-notes.test.ts` was not changed or run: it invokes git, creates commits and reads checkout history, which this task forbids. Its tests were not skipped, disabled or weakened.
- Full precheck was not run because it uses git. No fixture-dependent tests, installation, build, real Windows execution or published-artifact verification was attempted.
