# TABULARIUS_PGWIRE_IDLE_MS

How long a signed-in SQL connection may sit idle outside active work before it is closed, in milliseconds.

| Setting | Value |
| --- | --- |
| Default | 300000 |
| Accepted values | Nonnegative whole number of milliseconds; 0 for no limit |
| Restart needed | No server restart; read when a SQL connection signs in. |
| Explained in | [docs/pgwire-results.md](../../../pgwire-results.md) |
| Code | [packages/server/src/pgwire.ts:282](../../../../packages/server/src/pgwire.ts#L282) |

[All environment variables](../../../environment-variables.md)
