---
since: 0.1.0
---

# tabularius serve --mcp-origin

Since 0.1.0

`--mcp-origin` is a serve option. The full command usage is in [serve](../../cli/serve.md).

| Setting | Value |
| --- | --- |
| Default | No additional origins |
| Accepted values | Repeatable HTTPS origin without path |
| Restart needed | Yes; serve flags are read when the server starts. |
| Environment | [`TABULARIUS_MCP_ORIGINS`](../environment/tabularius_mcp_origins.md) |
| Explained in | [docs/security-defaults.md](../../../security-defaults.md) |
| Code | [packages/cli/src/main.ts:583](../../../../packages/cli/src/main.ts#L583) |

[All serve flags](../serve-flags.md)
