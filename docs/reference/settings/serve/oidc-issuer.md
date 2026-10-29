---
since: 0.1.0
---

# tabularius serve --oidc-issuer

Since 0.1.0

`--oidc-issuer` is a serve option. The full command usage is in [serve](../../cli/serve.md).

| Setting | Value |
| --- | --- |
| Default | OIDC sign-in off |
| Accepted values | Issuer URL |
| Restart needed | Yes; serve flags are read when the server starts. |
| Environment | [`TABULARIUS_OIDC_ISSUER`](../environment/tabularius_oidc_issuer.md) |
| Explained in | [README.md](../../../../README.md) |
| Code | [packages/cli/src/main.ts:1404](../../../../packages/cli/src/main.ts#L1404) |

[All serve flags](../serve-flags.md)
