# tabularius serve --oidc-name

`--oidc-name` is a serve option. The full command usage is in [serve](../../cli/serve.md).

| Setting | Value |
| --- | --- |
| Default | Hostname of the configured issuer URL |
| Accepted values | Claim or display name |
| Restart needed | Yes; serve flags are read when the server starts. |
| Environment | [`TABULARIUS_OIDC_NAME`](../environment/tabularius_oidc_name.md) |
| Explained in | [docs/hosting-and-connecting.md](../../../hosting-and-connecting.md) |
| Code | [packages/cli/src/main.ts:1436](../../../../packages/cli/src/main.ts#L1436) |

[All serve flags](../serve-flags.md)
