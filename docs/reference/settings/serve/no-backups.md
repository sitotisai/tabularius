# tabularius serve --no-backups

`--no-backups` is a serve option. The full command usage is in [serve](../../cli/serve.md).

| Setting | Value |
| --- | --- |
| Default | Backups on |
| Accepted values | Switch; present disables scheduled backups |
| Restart needed | Yes; serve flags are read when the server starts. |
| Environment | No direct environment equivalent |
| Explained in | [docs/hosting-for-a-team.md](../../../hosting-for-a-team.md) |
| Code | [packages/cli/src/main.ts:1409](../../../../packages/cli/src/main.ts#L1409) |

[All serve flags](../serve-flags.md)
