# TABULARIUS_MAX_UPLOAD

Largest file accepted by the server upload route, in bytes.

| Setting | Value |
| --- | --- |
| Default | 10 GiB |
| Accepted values | Whole number of bytes, 0 or more, digits only; 0 removes the per-file cap |
| Restart needed | Yes for a running server. |
| Explained in | [ADMIN.md](../../../../ADMIN.md) |
| Code | [packages/server/src/admin.ts:1278](../../../../packages/server/src/admin.ts#L1278) |

[All environment variables](../../../environment-variables.md)
