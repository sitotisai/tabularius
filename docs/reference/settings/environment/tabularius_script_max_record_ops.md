# TABULARIUS_SCRIPT_MAX_RECORD_OPS

Maximum record operations per script run, shared by its steps and synchronous subscripts. Scans and repeated passes count again. The engine also enforces its 60-second default active-time limit and one-million-step limit inside cooperative batches; callers can set timeoutMs and maxSteps.

| Setting | Value |
| --- | --- |
| Default | 50000000 |
| Accepted values | Whole number, decimal digits only, up to 9007199254740991; 0 disables the record budget |
| Restart needed | Restart the server after changing its environment; each new script engine reads the setting. A value that is not a whole number stops `serve` at start, naming the variable. |
| Explained in | [docs/guides/building/scripts-and-triggers.md](../../../guides/building/scripts-and-triggers.md) |
| Code | [packages/scripts/src/engine.ts:1508](../../../../packages/scripts/src/engine.ts#L1508) |

[All environment variables](../../../environment-variables.md)
