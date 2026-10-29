---
since: 0.1.0
---

# tabularius serve --backup-every

Since 0.1.0

`--backup-every` is a serve option. The full command usage is in [serve](../../cli/serve.md).

| Setting | Value |
| --- | --- |
| Default | 1d |
| Accepted values | off or an interval such as 1d |
| Restart needed | Yes; serve flags are read when the server starts. |
| Environment | [`TABULARIUS_BACKUP_EVERY`](../environment/tabularius_backup_every.md) |
| Explained in | [README.md](../../../../README.md) |
| Code | [packages/cli/src/main.ts:1373](../../../../packages/cli/src/main.ts#L1373) |

[All serve flags](../serve-flags.md)
