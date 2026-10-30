# TABULARIUS_CONTAINER_TTL

Lifetime of a signed container URL.

| Setting | Value |
| --- | --- |
| Default | 3600 seconds |
| Accepted values | Positive seconds up to 3600, which is also what any other value (0, negative, not a number, longer) gives; a link signed for more than an hour ahead is refused |
| Restart needed | Yes for a running server. |
| Explained in | [docs/hosting-and-connecting.md](../../../hosting-and-connecting.md) |
| Code | [packages/server/src/host.ts:73](../../../../packages/server/src/host.ts#L73) |

[All environment variables](../../../environment-variables.md)
