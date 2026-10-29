# TABULARIUS_REQUEST_BUDGET_MS

Time one request may hold the server event loop, in milliseconds.

| Setting | Value |
| --- | --- |
| Default | 60000 ms |
| Accepted values | Nonnegative milliseconds; 0 removes the budget |
| Restart needed | Yes for a running server. |
| Explained in | [docs/runbook.md](../../../runbook.md) |
| Code | [packages/server/src/index.ts:299](../../../../packages/server/src/index.ts#L299) |

[All environment variables](../../../environment-variables.md)
