---
since: 0.1.0
---

# TABULARIUS_TRACE_SQL_MIN_MS

Since 0.1.0

With `TABULARIUS_TRACE_SQL` set, logs only statements that took this many milliseconds or more.

| Setting | Value |
| --- | --- |
| Default | 0 ms |
| Accepted values | Nonnegative milliseconds |
| Restart needed | Yes; restart the server after changing its environment. |
| Explained in | [docs/environment-variables.md](../../../environment-variables.md) |
| Code | [packages/store/src/trace.ts:45](../../../../packages/store/src/trace.ts#L45) |

[All environment variables](../../../environment-variables.md)
