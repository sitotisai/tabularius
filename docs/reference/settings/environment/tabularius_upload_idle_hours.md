---
since: 0.1.0
---

# TABULARIUS_UPLOAD_IDLE_HOURS

Since 0.1.0

How many hours an upload in pieces (`container-uploads`) may receive nothing before it is dropped (24 by default; `0` keeps them until the server restarts).

| Setting | Value |
| --- | --- |
| Default | 24 hours |
| Accepted values | nonnegative number; 0 keeps uploads until restart |
| Restart needed | Yes for a running server. |
| Explained in | [ADMIN.md](../../../../ADMIN.md) |
| Code | [packages/server/src/container-uploads.ts:35](../../../../packages/server/src/container-uploads.ts#L35) |

[All environment variables](../../../environment-variables.md)
