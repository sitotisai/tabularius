---
since: 0.1.0
---

# TABULARIUS_MAX_UPLOAD

Since 0.1.0

Largest file accepted by the server upload route, in bytes.

| Setting | Value |
| --- | --- |
| Default | 10 GiB |
| Accepted values | Nonnegative bytes; 0 removes the per-file cap |
| Restart needed | Yes for a running server. |
| Explained in | [ADMIN.md](../../../../ADMIN.md) |
| Code | [packages/server/src/uploads.ts:45](../../../../packages/server/src/uploads.ts#L45) |

[All environment variables](../../../environment-variables.md)
