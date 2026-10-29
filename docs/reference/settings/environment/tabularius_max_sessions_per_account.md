---
since: 0.1.0
---

# TABULARIUS_MAX_SESSIONS_PER_ACCOUNT

Since 0.1.0

Maximum active Data API sessions per account.

| Setting | Value |
| --- | --- |
| Default | 100 sessions |
| Accepted values | Nonnegative whole number; 0 removes the cap |
| Restart needed | Yes; restart the server after changing its environment. |
| Explained in | [docs/data-api-compatibility.md](../../../data-api-compatibility.md) |
| Code | [packages/server/src/dataapi.ts:903](../../../../packages/server/src/dataapi.ts#L903) |

[All environment variables](../../../environment-variables.md)
