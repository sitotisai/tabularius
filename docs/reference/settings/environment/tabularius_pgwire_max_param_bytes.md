# TABULARIUS_PGWIRE_MAX_PARAM_BYTES

Total bound parameter bytes that one SQL connection's portals may hold.

| Setting | Value |
| --- | --- |
| Default | 67108864 (64 MiB) |
| Accepted values | Whole number of bytes, 1 or more, digits only; 0 or an invalid value stops the start |
| Restart needed | Yes for a running server. |
| Explained in | [docs/pgwire-results.md](../../../pgwire-results.md) |
| Code | [packages/server/src/setting-values.ts:25](../../../../packages/server/src/setting-values.ts#L25) |

[All environment variables](../../../environment-variables.md)
