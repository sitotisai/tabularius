---
since: 0.1.0
---

# tabularius serve --host

Since 0.1.0

`--host` is a serve option. The full command usage is in [serve](../../cli/serve.md).

| Setting | Value |
| --- | --- |
| Default | 127.0.0.1, or 0.0.0.0 with automatic HTTPS |
| Accepted values | Listen address |
| Restart needed | Yes; serve flags are read when the server starts. |
| Environment | [`TABULARIUS_HOST`](../environment/tabularius_host.md) |
| Explained in | [README.md](../../../../README.md) |
| Code | [packages/cli/src/main.ts:1051](../../../../packages/cli/src/main.ts#L1051) |

[All serve flags](../serve-flags.md)
