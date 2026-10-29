---
since: 0.1.0
---

# TABULARIUS_SECRETS_KEY

Since 0.1.0

Passphrase used to seal outside-connection secrets.

| Setting | Value |
| --- | --- |
| Default | TABULARIUS_ENCRYPTION_KEY if set |
| Accepted values | Nonempty passphrase; an empty value stops `serve` |
| Restart needed | Yes for a running server. |
| Explained in | [README.md](../../../../README.md) |
| Code | [packages/server/src/connections.ts:8](../../../../packages/server/src/connections.ts#L8) |

[All environment variables](../../../environment-variables.md)
