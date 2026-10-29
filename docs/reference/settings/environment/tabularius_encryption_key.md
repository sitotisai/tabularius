# TABULARIUS_ENCRYPTION_KEY

Passphrase used to unlock encrypted hosted files. A set-but-empty or whitespace-only value stops `serve`; unset it to run without encryption, or give a passphrase. Nonblank passphrases are used unchanged.

| Setting | Value |
| --- | --- |
| Default | No encryption passphrase (unset); set but empty refuses to start |
| Accepted values | Nonblank passphrase for encrypted hosted files; an empty value stops `serve` |
| Restart needed | Yes for a running server. |
| Explained in | [docs/hosting-for-a-team.md](../../../hosting-for-a-team.md) |
| Code | [packages/cli/src/doctor.ts:66](../../../../packages/cli/src/doctor.ts#L66) |

[All environment variables](../../../environment-variables.md)
