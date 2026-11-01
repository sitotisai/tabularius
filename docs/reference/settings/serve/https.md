# tabularius serve --https

`--https` is a serve option. The full command usage is in [serve](../../cli/serve.md).

| Setting | Value |
| --- | --- |
| Default | Off |
| Accepted values | local or comma-separated DNS names |
| Restart needed | Yes; serve flags are read when the server starts. |
| Environment | [`TABULARIUS_HTTPS`](../environment/tabularius_https.md) |
| Explained in | [docs/hosting-for-a-team.md](../../../hosting-for-a-team.md) |
| Code | [packages/cli/src/main.ts:1378](../../../../packages/cli/src/main.ts#L1378) |

[All serve flags](../serve-flags.md)
