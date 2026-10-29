# Encryption at rest with a standby: design blocker

**Status:** research only. An encrypted primary with a standby is not supported. The current combination does not meet the requirement that the standby never write plaintext, that it reject a different key, or that it explain a missing or wrong key. Do not claim those guarantees until the storage and replication design below is specified and tested.

## What exists

- `Host` unlocks each `<name>.openhbam.sqlite.enc` into a plaintext `<name>.openhbam.sqlite` working file while serving, then encrypts the file again when it closes. This is whole-file AES-256-GCM encryption, not encrypted SQLite pages (`packages/server/src/host.ts`, `packages/server/src/encrypt.ts`).
- The replication copy is a SQLite online backup of that working file. The primary sends plaintext SQLite bytes; the standby writes them first to `<name>.openhbam.sqlite.standby-partial`, validates them with `DatabaseSync`, and renames the file to `<name>.openhbam.sqlite` (`packages/server/src/replication.ts`, `packages/server/src/standby.ts`).
- Each replicated change is a plaintext SQLite WAL. `applyLog` writes `<name>.openhbam.sqlite-wal` and opens the plaintext database to checkpoint it (`packages/server/src/logs.ts`).
- `tabularius standby` accepts only the primary address and replication token. It does not read `TABULARIUS_ENCRYPTION_KEY`. The file listing, copy headers and change records contain no encryption-mode or key-verification information (`packages/cli/src/main.ts`, `packages/server/src/replication.ts`). The token authenticates replication access; it is not tied to the encryption key.

Setting a key in the standby environment therefore does not encrypt its copy or its changes. A standby given a missing, different, or rotated key cannot distinguish those cases from the correct key while following. On takeover, `serve` can open the plaintext replica and later encrypt it under whichever key it was given; that is not evidence that the keys matched. The old encrypted file on the primary is not a reliable current snapshot while the primary is serving.

## Why a small change is insufficient

Encrypting only the copy response or the standby's final file leaves plaintext WAL sidecars and a plaintext SQLite file needed by `applyLog`. Encrypting each incoming WAL as a separate file would keep bytes encrypted while following, but it would require a new durable replay and compaction design: an indefinitely running standby would otherwise accumulate changes without a bound, and takeover would have to reconstruct a consistent SQLite file before serving. Whole-file encryption cannot update one SQLite page in place. A copy encrypted locally with the standby key also cannot prove that it holds the primary's key.

The existing replication message format carries no value from which the standby can verify the primary's encryption key. A challenge or authenticated verifier, an encryption-mode marker, and an old-client refusal rule would change the protocol. This page does not specify those messages; introducing them without an agreed format would risk an older standby accepting plaintext or misreading an encrypted response.

## Decisions needed before implementation

1. Specify the encrypted replication protocol, including how the primary and standby prove possession of the same key without transmitting the key, how an encrypted primary refuses an older standby, and how a new standby recognizes an older primary. Bind the proof to a fresh challenge and the current replication run; do not expose a reusable verifier that would make offline passphrase guessing easier. Define error text for missing, wrong, and rotated keys.
2. Choose a bounded encrypted storage representation for the standby's snapshot and changes. It must support atomic copy replacement, ordered and idempotent replay, crash recovery, resync, and local-change detection without a plaintext file or WAL in the standby folder. Define how it compacts or takes a new snapshot before its retained changes grow without limit. A plaintext working file after deliberate promotion follows the existing server encryption model, but no such file may be written while following.
3. Define key rotation across both machines. A standby encrypted under the old key must not be silently overwritten or promoted under a new one. Specify whether rotation requires a stopped standby and an explicit rekey, or a fresh encrypted copy after an authenticated transition. Preserve a recoverable old copy until the transition is durable.
4. Specify takeover checks before removing `.openhbam-standby.json`: verify the key, the encrypted snapshot, the complete ordered change chain, and `wholeAfter`. Decide what to report when the primary is unavailable and the key cannot decrypt the standby's own data.

## Acceptance tests for the eventual design

Use two synthetic stores in temporary folders with the existing standby harness. The tests should assert both data equality after promotion and the absence of SQLite headers, plaintext record values, plaintext `.standby-partial` files and plaintext WAL sidecars anywhere in the standby folder while following, including after an interrupted copy or change. Cover a correct key, a missing key, a wrong key, rotation on only one side, rotation on both sides, restart, catch-up, resync, and takeover with a damaged encrypted copy. Assert refusal before changing existing standby data when keys differ, and verify that no replication response sends the key. Exercise an older standby against an encrypted primary. No real `.fmp12` files are needed.
