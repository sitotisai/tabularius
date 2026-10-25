# TABULARIUS_PGWIRE_OUTPUT_STALL_MS

How long a SQL client may leave the server's answers unread before the connection is closed, in milliseconds.

| Setting | Value |
| --- | --- |
| Default | 60000 |
| Accepted values | Nonnegative whole number of milliseconds; 0 for no limit |
| Restart needed | No server restart; read each time the server waits for a client to read. |
| Explained in | [docs/pgwire-results.md](../../../pgwire-results.md) |
| Code | [packages/server/src/pgwire.ts:288](../../../../packages/server/src/pgwire.ts#L288) |

[All environment variables](../../../environment-variables.md)
