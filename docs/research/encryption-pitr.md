# Encryption at rest and point-in-time backups

<!-- known-difference-file: Server operation ;; Encrypted hosted stores and point-in-time backups do not yet form an end-to-end encrypted restore workflow ;; Backup snapshots can be plaintext during staging and a restore can leave plaintext beside an older encrypted store ;; Decide key precedence, encrypted snapshot creation, and atomic encrypted restore -->

## Status

The requested combination is unresolved. The existing encrypted-store path
and encrypted-backup path each work on their own, but using them together does
not meet the requirement that backup copies are always encrypted with the store
key or that a restored encrypted store remains encrypted. No claim is made here
about the behavior of another product; compatibility is unverified.

## Verified paths

- `Host` unlocks `<name>.openhbam.sqlite.enc` into a plaintext working store
  while serving and seals it again on clean shutdown. Its key comes from
  `TABULARIUS_ENCRYPTION_KEY`.
- `backupFolder` gets its default key only from `TABULARIUS_BACKUP_KEY`. With
  only the store key set, a generated store produced an unencrypted backup set.
- When the backup key is set, `backupOnceHeld` first asks SQLite's online backup
  API to write a plaintext snapshot inside the partial set, checks it, then
  `seal` encrypts it and removes the plaintext snapshot. The published copy is
  encrypted, but the plaintext snapshot exists during backup creation.
- `scheduleProgressive` uses `backupFolder` for the initial set and
  `backupKey()` for its logs and manifest. Its log writer encrypts logs as they
  are written when that backup key is set.
- `restoreAt` decrypts and replays into `<name>.openhbam.sqlite.restoring`,
  then publishes `<name>.openhbam.sqlite`. A generated encrypted store left
  both this plaintext working file and the older `.enc` file after restore.
  On a later start, `Host` sees the working file and does not unlock the `.enc`
  file, so the two copies have ambiguous authority until shutdown.

The synthetic probe used `createStore` in a temporary folder. It saw
`A.openhbam.sqlite` and `backup.json` in the backup set with only the store
key set, then both `A.openhbam.sqlite` and `A.openhbam.sqlite.enc` after a
point-in-time restore. It opened no `.fmp12` file.

## Decisions required before implementation

1. Choose how a scheduled backup obtains the store key and how the existing
   independent `TABULARIUS_BACKUP_KEY` interacts with it. The request requires
   the store key for this combination, but existing backup sets can use a
   different key. The behavior for both variables set, mixed or historical
   sets, and standalone CLI restore needs an explicit rule. The key must stay
   outside the hosted folder and must not be added to a manifest.
2. Choose a consistent SQLite snapshot path that writes encrypted bytes from
   the outset without a plaintext temporary backup. The current Node SQLite
   online backup API writes to a file path, and the existing `encryptFile`
   reads that file after it is complete. Keeping the current path fails the
   no-plaintext-copy requirement. Loading a whole store into memory would
   trade that exposure for unbounded memory use and is not an acceptable
   implicit choice.
3. Define how whole-set and point-in-time restore stage, verify, and atomically
   publish an encrypted store. The restored record bytes must be checked before
   publication, a wrong or missing key and any tampered copy or log must leave
   the live encrypted store unchanged, and no stale `.enc` or plaintext
   working file can take precedence at the next start. Account credential
   carry-forward and container files must retain their existing restore rules.

Once those decisions are made, synthetic tests should cover scheduled backup,
encrypted base copies and logs, every restored record byte, missing and wrong
keys, tampered backup content, restart after restore, and absence of plaintext
snapshots throughout backup and restore. Existing encryption and backup tests
must continue to pass.
