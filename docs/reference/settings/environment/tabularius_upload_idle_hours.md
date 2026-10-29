# TABULARIUS_UPLOAD_IDLE_HOURS

How many hours an upload in pieces (`container-uploads`) may receive nothing before it is dropped (24 by default; `0` keeps them until the server restarts).

| Setting | Value |
| --- | --- |
| Default | 24 hours |
| Accepted values | Whole hours from 0 to 87600, digits only; 0 keeps uploads until restart |
| Restart needed | Yes for a running server. |
| Explained in | [ADMIN.md](../../../../ADMIN.md) |
| Code | [packages/cli/src/diagnostics.ts:45](../../../../packages/cli/src/diagnostics.ts#L45) |

[All environment variables](../../../environment-variables.md)
