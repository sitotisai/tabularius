# tabularius serve --mcp-token-file

`--mcp-token-file` is a serve option. The full command usage is in [serve](../../cli/serve.md).

| Setting | Value |
| --- | --- |
| Default | Unset: the server makes an administrator token on first start (.openhbam-mcp-token); every /mcp request needs credentials |
| Accepted values | File path (a private regular file holding the token) |
| Restart needed | Yes; serve flags are read when the server starts. |
| Environment | No direct environment equivalent |
| Explained in | [docs/environment-variables.md](../../../environment-variables.md) |

[All serve flags](../serve-flags.md)
