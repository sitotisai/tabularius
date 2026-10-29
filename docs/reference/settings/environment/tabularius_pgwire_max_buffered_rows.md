---
since: 0.1.0
---

# TABULARIUS_PGWIRE_MAX_BUFFERED_ROWS

Since 0.1.0

Combined result rows that one SQL connection may hold in portals.

| Setting | Value |
| --- | --- |
| Default | 100000 |
| Accepted values | Positive whole number of rows; decimal digits only for numbers, within the safe integer range |
| Restart needed | Yes; restart the server after changing its environment. |
| Explained in | [docs/pgwire-results.md](../../../pgwire-results.md) |
| Code | [packages/server/src/pgwire.ts:1465](../../../../packages/server/src/pgwire.ts#L1465) |

[All environment variables](../../../environment-variables.md)
