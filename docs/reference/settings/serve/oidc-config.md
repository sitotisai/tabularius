# tabularius serve --oidc-config

`--oidc-config` is a serve option. The full command usage is in [serve](../../cli/serve.md).

| Setting | Value |
| --- | --- |
| Default | Unset |
| Accepted values | JSON file path |
| Restart needed | Yes; serve flags are read when the server starts. |
| Environment | [`TABULARIUS_OIDC_CONFIG`](../environment/tabularius_oidc_config.md) |
| Explained in | [docs/hosting-and-connecting.md](../../../hosting-and-connecting.md) |
| Code | [packages/cli/src/main.ts:1459](../../../../packages/cli/src/main.ts#L1459) |

[All serve flags](../serve-flags.md)
