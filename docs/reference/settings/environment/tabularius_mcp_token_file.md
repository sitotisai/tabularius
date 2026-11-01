# TABULARIUS_MCP_TOKEN_FILE

A private regular file holding the MCP access token.

| Setting | Value |
| --- | --- |
| Default | Unset: the server makes an administrator token on first start (.openhbam-mcp-token); every /mcp request needs credentials |
| Accepted values | File path (the file must not be readable by other users) |
| Restart needed | Yes for a running server. |
| Explained in | [docs/environment-variables.md](../../../environment-variables.md) |
| Code | [packages/cli/src/main.ts:1363](../../../../packages/cli/src/main.ts#L1363) |

[All environment variables](../../../environment-variables.md)
