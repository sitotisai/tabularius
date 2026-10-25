# tabularius serve --mcp-token

`--mcp-token` is a serve option. The full command usage is in [serve](../../cli/serve.md).

| Setting | Value |
| --- | --- |
| Default | Unset: the server makes an administrator token on first start (.openhbam-mcp-token); every /mcp request needs credentials |
| Accepted values | Token string |
| Restart needed | Yes; serve flags are read when the server starts. |
| Environment | No direct environment equivalent |
| Explained in | [docs/hosting-and-connecting.md](../../../hosting-and-connecting.md) |

[All serve flags](../serve-flags.md)
