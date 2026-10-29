---
since: 0.1.0
---

# tabularius serve --public-url

Since 0.1.0

`--public-url` is a serve option. The full command usage is in [serve](../../cli/serve.md).

| Setting | Value |
| --- | --- |
| Default | Taken from the listen address |
| Accepted values | Absolute public URL |
| Restart needed | Yes; serve flags are read when the server starts. |
| Environment | [`TABULARIUS_PUBLIC_URL`](../environment/tabularius_public_url.md) |
| Explained in | [README.md](../../../../README.md) |
| Code | [packages/cli/src/main.ts:1301](../../../../packages/cli/src/main.ts#L1301) |

[All serve flags](../serve-flags.md)
