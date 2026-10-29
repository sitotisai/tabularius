---
since: 0.1.0
---

# TABULARIUS_UPLOAD_TMP

Since 0.1.0

The folder files wait in while they arrive in a container upload (the system's temporary folder by default). It needs room for the biggest files being uploaded at once.

| Setting | Value |
| --- | --- |
| Default | System temporary directory |
| Accepted values | Directory path |
| Restart needed | Yes for a running server. |
| Explained in | [README.md](../../../../README.md) |
| Code | [packages/server/src/container-uploads.ts:190](../../../../packages/server/src/container-uploads.ts#L190) |

[All environment variables](../../../environment-variables.md)
