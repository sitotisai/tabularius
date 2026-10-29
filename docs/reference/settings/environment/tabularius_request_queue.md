# TABULARIUS_REQUEST_QUEUE

How many requests may wait for a free slot in each worker (64 by default, 0 for none). A request that cannot wait is answered 503 with `Retry-After: 1`. See [Performance](../../../performance.md).

| Setting | Value |
| --- | --- |
| Default | 64 |
| Accepted values | Whole number from 0 to 100000, digits only; 0 allows no waiting requests |
| Restart needed | Yes for a running server. |
| Explained in | [docs/performance.md](../../../performance.md) |
| Code | [packages/server/src/setting-values.ts:9](../../../../packages/server/src/setting-values.ts#L9) |

[All environment variables](../../../environment-variables.md)
