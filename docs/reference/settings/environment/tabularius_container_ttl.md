# TABULARIUS_CONTAINER_TTL

Lifetime of a signed container URL.

| Setting | Value |
| --- | --- |
| Default | 3600 seconds |
| Accepted values | Whole seconds from 1 to 3600, digits only; 0, invalid or longer values stop the start; a link signed for more than an hour ahead is refused |
| Restart needed | Yes for a running server. |
| Explained in | [docs/hosting-and-connecting.md](../../../hosting-and-connecting.md) |
| Code | [packages/server/src/adminapi.ts:102](../../../../packages/server/src/adminapi.ts#L102) |

[All environment variables](../../../environment-variables.md)
