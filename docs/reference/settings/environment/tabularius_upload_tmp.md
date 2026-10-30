# TABULARIUS_UPLOAD_TMP

The folder files wait in while they arrive in a container upload (the system's temporary folder by default). It needs room for the biggest files being uploaded at once.

| Setting | Value |
| --- | --- |
| Default | System temporary directory |
| Accepted values | Directory path |
| Restart needed | Yes for a running server. |
| Explained in | [docs/hosting-and-connecting.md](../../../hosting-and-connecting.md) |
| Code | [packages/server/src/container-uploads.ts:193](../../../../packages/server/src/container-uploads.ts#L193) |

[All environment variables](../../../environment-variables.md)
