---
since: 0.1.0
---

# TABULARIUS_REQUEST_BUDGET_MS

Since 0.1.0

Time one request may hold the server event loop, in milliseconds.

| Setting | Value |
| --- | --- |
| Default | 60000 ms |
| Accepted values | Nonnegative milliseconds; 0 removes the budget |
| Restart needed | Yes for a running server. |
| Explained in | [docs/runbook.md](../../../runbook.md) |
| Code | [packages/server/src/index.ts:298](../../../../packages/server/src/index.ts#L298) |

[All environment variables](../../../environment-variables.md)
