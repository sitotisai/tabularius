---
since: 0.1.0
---

# TABULARIUS_REQUEST_QUEUE

Since 0.1.0

How many requests may wait for a free slot in each worker (64 by default, 0 for none). A request that cannot wait is answered 503 with `Retry-After: 1`. See [Performance](../../../performance.md).

| Setting | Value |
| --- | --- |
| Default | 64 |
| Accepted values | Whole number of 0 or more |
| Restart needed | Yes for a running server. |
| Explained in | [docs/performance.md](../../../performance.md) |
| Code | [packages/server/src/index.ts:387](../../../../packages/server/src/index.ts#L387) |

[All environment variables](../../../environment-variables.md)
