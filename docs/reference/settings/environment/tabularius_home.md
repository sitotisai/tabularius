---
since: 0.1.0
---

# TABULARIUS_HOME

Since 0.1.0

The folder holding per-user settings (`~/.openhbam` by default): the AI key file, and the service definition's files.

| Setting | Value |
| --- | --- |
| Default | ~/.openhbam |
| Accepted values | file or directory path |
| Restart needed | Yes for a running server; new CLI invocations read the changed value. |
| Explained in | [docs/environment-variables.md](../../../environment-variables.md) |
| Code | [packages/cli/src/ai-key.ts:21](../../../../packages/cli/src/ai-key.ts#L21) |

[All environment variables](../../../environment-variables.md)
