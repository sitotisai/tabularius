---
since: 0.1.0
---

# tabularius serve --backup-dir

Since 0.1.0

`--backup-dir` is a serve option. The full command usage is in [serve](../../cli/serve.md).

| Setting | Value |
| --- | --- |
| Default | <folder>/Backups unless folder settings override it |
| Accepted values | Directory path |
| Restart needed | Yes; serve flags are read when the server starts. |
| Environment | [`TABULARIUS_BACKUP_DIR`](../environment/tabularius_backup_dir.md) |
| Explained in | [README.md](../../../../README.md) |
| Code | [packages/cli/src/main.ts:1379](../../../../packages/cli/src/main.ts#L1379) |

[All serve flags](../serve-flags.md)
