# TABULARIUS_MCP_TOKEN

Administrator bearer token for the MCP endpoint.

| Setting | Value |
| --- | --- |
| Default | Unset: the server makes an administrator token on first start (.openhbam-mcp-token); every /mcp request needs credentials |
| Accepted values | Token string |
| Restart needed | Yes for a running server. |
| Explained in | [docs/environment-variables.md](../../../environment-variables.md) |
| Code | [packages/cli/src/main.ts:1863](../../../../packages/cli/src/main.ts#L1863) |

[All environment variables](../../../environment-variables.md)
