# TABULARIUS_DEBUG_SCRATCH_MAX_BYTES

Largest hosted SQLite file copied for a Script Debugger run, time-travel recording or debug_script scratch run. Raise it only when there is enough free disk space for each concurrent copy; runs remain offline and isolated.

| Setting | Value |
| --- | --- |
| Default | 1073741824 bytes (1 GiB) |
| Accepted values | Positive whole number of bytes using decimal digits only |
| Restart needed | Yes; restart the server after changing its environment. |
| Explained in | [docs/guides/building/debugger-and-design-history.md](../../../guides/building/debugger-and-design-history.md) |
| Code | [packages/server/src/debug.ts:54](../../../../packages/server/src/debug.ts#L54) |

[All environment variables](../../../environment-variables.md)
