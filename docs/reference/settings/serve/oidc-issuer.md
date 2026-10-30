# tabularius serve --oidc-issuer

`--oidc-issuer` is a serve option. The full command usage is in [serve](../../cli/serve.md).

| Setting | Value |
| --- | --- |
| Default | OIDC sign-in off |
| Accepted values | Issuer URL |
| Restart needed | Yes; serve flags are read when the server starts. |
| Environment | [`TABULARIUS_OIDC_ISSUER`](../environment/tabularius_oidc_issuer.md) |
| Explained in | [docs/hosting-and-connecting.md](../../../hosting-and-connecting.md) |
| Code | [packages/cli/src/main.ts:1426](../../../../packages/cli/src/main.ts#L1426) |

[All serve flags](../serve-flags.md)
