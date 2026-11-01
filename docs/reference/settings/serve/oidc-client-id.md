# tabularius serve --oidc-client-id

`--oidc-client-id` is a serve option. The full command usage is in [serve](../../cli/serve.md).

| Setting | Value |
| --- | --- |
| Default | OIDC sign-in off |
| Accepted values | Client id |
| Restart needed | Yes; serve flags are read when the server starts. |
| Environment | [`TABULARIUS_OIDC_CLIENT_ID`](../environment/tabularius_oidc_client_id.md) |
| Explained in | [docs/hosting-and-connecting.md](../../../hosting-and-connecting.md) |
| Code | [packages/cli/src/main.ts:1432](../../../../packages/cli/src/main.ts#L1432) |

[All serve flags](../serve-flags.md)
