# Add a script and a trigger

Use this guide when a repeatable task should run from a button or a supported event. It covers creating a small script and attaching it only after the script's effect is clear.

1. Write down the task and its expected end state. Keep the first script small enough to test on a disposable record.
2. Open **Design → Scripts** and add the steps in order. Use **Check script** to catch invalid references and unsupported steps.
3. Run the script manually from the debugger or a button and verify its result before adding a trigger.
4. In the layout or trigger settings, choose the event that matches the task. Avoid triggers that write data on every keystroke unless that is necessary.
5. Test both the normal path and a cancelled or invalid input path.

## Worked example

This adds a script that calculates a fixed label and returns it. It is synthetic and safe to run; it does not send mail or make a network request.

<!-- docs-example: run -->
```sh
printf '%s\n' '[{"op":"createScript","name":"Build example status","text":"Set Variable [ $status ; Value: 42 ]\nExit Script [ Text Result: $status ]"}]' > changes.json
tabularius design ~/Databases Invoices changes.json
```

## Check afterwards

- Confirm the script appears in `tabularius schema` and in the Scripts list.
- Run it manually and check that the result is `42` before attaching it to a trigger.
- Check the trigger's cancellation and privilege behavior with the intended account.

See [Design mode](../../design-mode.md), [script-step support](../../script-steps-support.md), the [REST reference](../../reference/rest.md) for script design and run routes, [script error codes](../../error-codes.md), and [known differences](../../known-differences.md). Trigger behavior beyond the tested Tabularius paths should be treated as unverified unless a Claris page or a FileMaker run confirms it. <!-- known-difference: Scripts and script steps ;; Trigger behaviour beyond the paths tested here is unverified against FileMaker ;; A trigger may fire in a different order or case than FileMaker ;; A Claris page or a FileMaker run that confirms the trigger behaviour -->

## Run budgets and long record operations

`TABULARIUS_SCRIPT_MAX_RECORD_OPS` limits each run to 50,000,000 record operations by default; `0` disables that budget. It accepts decimal whole numbers only. Scanning candidates, reading sort keys, importing, updating and revisiting records in later passes consume the budget; synchronous subscripts share it, while a separate server script has its own run. Results include `recordOps`. The engine's existing default active-time limit is 60 seconds and its step limit is 1,000,000 (`timeoutMs` and `maxSteps` in the engine API). Cooperative record loops check these limits and administrator/user cancellation at batch boundaries and yield with `setImmediate` after roughly 25 ms or 256 checkpoints, whichever comes first. A halt reports the operation and processed count, for example “time limit reached in Replace Field Contents after 1200 records”. Limits are Tabularius hosting controls; matching behaviour in the other product is **unverified**. <!-- known-difference: Scripts and script steps ;; Run budgets and interruption timing are Tabularius hosting controls; native compatibility is unverified ;; Large scripts may halt at different points ;; A native comparison of long-running scripts and interruption timing -->

An open script transaction keeps its savepoint and file write lock through yields: other sessions' writes to that file receive error 301. Cancellation or a budget halt rolls back that open transaction. Without an explicit transaction, completed steps and previously committed records retain their existing cancellation behaviour; pending edits are discarded on external cancellation, while user Stop still commits them. Bulk writes with a known count check record-budget capacity before their first write outside a transaction. An import outside a transaction prepares and checks its rows first when the record budget is enabled, so it cannot commit a prefix on a record-budget refusal; this preparation uses memory proportional to the input. A completed transaction commits once and delivers its notifications at once, in order; cancellation does not undo a completed commit.

Coverage is **partial**, not a hard event-loop latency guarantee: one synchronous calculation, summary/aggregate collection, relationship or foreign-key cascade, native SQLite statement, complex input parser, file operation or garbage collection can still exceed a batch's time target. These operations cannot suspend their synchronous callers. They need further asynchronous evaluation or process/worker isolation to guarantee responsiveness for arbitrary scripts. No script worker threads are introduced here. Native compatibility of interruption timing remains **unverified**. <!-- known-difference: Scripts and script steps ;; Synchronous calculations, aggregates, native SQL and some preparation still block cooperative script batches ;; A single synchronous operation can delay cancellation and other requests ;; Asynchronous calculation/store evaluation or worker isolation, followed by latency tests -->

### Record-loop coverage

This inventory distinguishes cooperative outer loops from synchronous work called by one record. It describes implementation coverage, not a compatibility claim.

| Reachable work | Current coverage |
| --- | --- |
| Replace Field Contents, including its embedding prepass; Replace All and Find Next; Relookup Field Contents | Record checkpoints, elapsed-time yields and run budgets. Known write counts are checked before starting outside a transaction. |
| Set Field / Set Field By Name, create, duplicate and delete in script loops | Charged at step dispatch; elapsed-time yields also apply between short script steps. The individual store write and any auto-enter calculations remain synchronous. |
| Delete All Records | Existing per-record deletion retains checkpoints and gains the run budget; foreign-key cascades within one delete remain synchronous. Found-set cleanup is an in-memory filter. |
| Perform Find, Constrain/Extend, matching/quick finds; Show All / Show Omitted; Go to List | **Batched** (reads record ids in ranges of 1,024, yields between batches, an empty-match scan too, and keeps its wildcard complexity budget across them): a find whose criteria are on stored fields only, with no subquery, for an account that sees every record of the table. **Run whole, synchronously, as before**: a find on an unstored calculation or a global field (its computed values live in a temporary table that cannot outlive a yield on a shared connection); a duplicate search, a word-index or related-field criterion (each holds a subquery that would be repeated for every batch); any find on a repeating field, and any find by an account with a record-level view rule (its allowed ids would be parsed again for every batch). A find that ran whole is charged to the record budget when it ends: the records of the table, or for an account with a record rule only the records it was returned, so that the size of the table is not revealed. A batched find reads no snapshot: it holds no SQL state between batches, but a record another session edits between two batches is judged on its old or its new value according to its batch, rows of another session's open transaction can appear in a later batch and then roll back, and records created or deleted meanwhile may or may not be in the result (on a table that other sessions keep growing, the scan keeps chasing the new record ids until it reaches the end). Related joins, duplicate-source queries and in-memory set/filter operations remain synchronous. |
| Sort Records, related/custom keys, Unsort, restoring a sort after Find | A sort on stored fields is the same SQL order as before, read in pages that yield (its statement's cursor stays open across those yields, as before); any account sees only the ids it may view. A sort on an unstored calculation or a global reads its keys one record at a time and merges in batches, with the comparator the synchronous sort always had, which subtracts the values of a number field and so cannot order text values it finds there (their order among themselves can differ from the order main's `Array.sort` gave, which is unspecified for such a comparator); a related-field or hidden-field sort collects its keys per record. Visibility-rule evaluation and custom value-list construction remain synchronous. |
| Semantic find; embedding found-set batches; natural-language find JSON assembly | Outer record loops check budgets and yield. A vector calculation, related lookup or Data API page remains a synchronous unit. |
| Import Records (text/hosted/folder data, matching and replace/add) | Target-key scan, input rows and every matched target have checkpoints. With a record cap (the default), an import outside a transaction first reads and prepares all its rows (memory about twice the rows) so that it cannot commit a prefix: a refusal part-way therefore imports nothing, where an unbudgeted import commits the rows before the error. Rows with no key to match in an update import are not charged. Workbook/XML parsing, folder enumeration/container reads and hosted-source preparation remain synchronous. |
| Copy All Records, Export Records / Excel / XML, JSONL | Existing streaming export checkpoints share the budget; Copy All Records and JSONL now checkpoint each record. Serialization of a single row and final file writes remain synchronous. |
| PDF / print preparation | Existing page/chunk yields retained. Layout, break-key and summary preparation remain synchronous; no new budget guarantee for those loops. |
| `summaryOver`, `getSummary`, store `groupSummaries`, calculation collectors/whole-table aggregates, cache refresh | Unchanged synchronous evaluation; inserting awaits would require changing the calculation API and its callers. This is an outstanding availability gap, and these internal visits are not charged to `recordOps`. |
| Initial/lazy window found sets, relationship expansion, record navigation, native SQL and Truncate Table | Existing synchronous paths retained to preserve synchronous calculation/navigation and truncate/cascade semantics. These internal scans are outside the new counter. |
| Open-transaction commit | SQLite commits once, which cannot be split, and the commit notifications are then delivered synchronously, in order, as before. A transaction that changed many rows can therefore hold the event loop for the length of that commit (about 0.3 s for 60,000 changed rows on a slow, loaded host), and its listeners run in the same turn. |
