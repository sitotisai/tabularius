# Point-in-time backups and standby replication with workers

**Status:** design only. `tabularius serve --workers N` rejects `--progressive` and
`--replication-token`. Keep that guard until the coordination below is built and
tested. This note is about Tabularius worker behavior.

## Why the current modes cannot simply be enabled

Each worker opens its own SQLite connection to the same hosted store. The
cluster front routes ordinary requests among workers, while worker 0 alone
runs the folder watcher, schedules and regular backups. `LogShipper` and its
followers are local objects in `packages/server/src/index.ts`. A progressive
schedule writes a base copy and subsequent WAL records; `Replication` keeps
each file's run, sequence and recent WAL records in memory. Starting either
object in every worker would create competing copies, log writers and run
numbers for the same file.

Starting them only in worker 0 is also unsafe. `LogShipper.follow()` turns off
SQLite automatic checkpoints on *its own connection*. Another worker's
connection can still checkpoint automatically. A follower also calls
`Store.checkpoint()` when a file closes or pauses, and some container and
compaction paths checkpoint explicitly. The `beforeCheckpoint` hook calls that
worker's local shipper; with no local follower, it cannot hand the WAL to
worker 0. A checkpoint may therefore fold changes into the store before the
progressive log or standby has received them.

`Store.shipWal()` reads the WAL and then truncates it through its own SQLite
connection. Its synchronous guarantee covers writes on that connection, not
writes or checkpoints in another process. Reading a WAL while another worker
appends to it, and allowing another worker to checkpoint between the read and
the follower's acceptance, require an explicit per-file protocol. A periodic
timer or a change notification after a write cannot recover frames already
folded away. Existing cluster file-operation messages coordinate open, close
and pause, but they do not provide a write/checkpoint barrier or an
acknowledged durable log handoff.

## Ownership and shared state

| Part | Owner and rule |
| --- | --- |
| Hosted SQLite connections | Every worker keeps its own connection for normal requests. All connections must disable automatic WAL checkpoints while a file is followed. |
| File watcher, initial progressive copy, log writers, backup-set manifest and retention | Worker 0 only. A file entering the hosted set starts one progressive copy, regardless of how many workers open the store. |
| WAL shipping and explicit checkpoints | Worker 0 owns the per-file ship/checkpoint sequence. No worker may truncate or fold followed WAL until that sequence has accepted the frames. |
| Replication run, sequence, recent changes and standby client positions | Worker 0 only. The front routes `/tabularius/replication/v1/` to worker 0; every worker receives the configured token and validates it if it can answer a replication request. The front returns a retryable error while worker 0 is unavailable. |
| Coordination | The cluster front tracks a bounded per-file generation, barrier and participants. Workers acknowledge that writes are quiescent and that checkpoints are blocked before worker 0 reads the WAL. A restart invalidates the old participant and requires a new barrier before shipping. |

## Required protocol

1. Worker 0 enables following only after all live connections have disabled
   automatic checkpoints. A worker joining or restarting opens the file under
   this rule before it can serve writes. Opening a new file must use the
   existing cluster file-operation handshake so worker 0 follows it once.
2. Before shipping or checkpointing, worker 0 obtains a per-file barrier from
   the front. The front stops admitting new writes for that file and waits for
   in-flight writes, script transactions and other explicit checkpoint paths
   in every worker to finish. Worker 0 then reads the complete WAL, offers it
   to every active follower, and checkpoints only after all followers accept
   it. The owner verifies that the checkpoint completed before advancing the
   file generation; if it was busy, a retry must not publish the same frames
   as new replication sequence numbers. A failed follower leaves the WAL
   intact and the request to checkpoint fails or waits; it must never report
   a complete backup or standby position.
3. The front releases the barrier only after worker 0 acknowledges the result.
   A timeout, worker death, IPC disconnect or generation mismatch cancels the
   operation without checkpointing. New writes may resume only after the
   front has established which generation owns the file. The barrier must be
   acquired in a consistent order with existing file-operation and SQLite
   locks to avoid deadlock.
4. Closing, pausing, taking a file offline, compaction, container moves and
   server shutdown use the same barrier before any explicit checkpoint. They
   wait for the last accepted WAL handoff. A worker restart must not reuse a
   previous promise or replication run; standby clients recopy after a new
   run begins. A new worker must not serve writes before joining the current
   file generation.
5. Progressive copy creation needs a hold tied to that generation: worker 0
   records the base copy's position, then releases changes in order. If the
   copy fails or the leader dies, discard the incomplete copy and start from
   a new base. The signed manifest and retention updates remain owned by
   worker 0.

The exact blocker is the missing barrier at **every** write and checkpoint
path. The current `beforeCheckpoint` callback is synchronous, while the
cluster's file-operation handshake is asynchronous IPC. Changing that contract,
covering long-running transactions and restart recovery, and proving that no
WAL frame is lost is a protocol change across the store, host and cluster. It
is larger than the roughly 400-line limit for this item, so simply removing
`clusterProblems()` would risk restorable history and standby correctness.

## Failure cases and acceptance evidence

- A follower fills the WAL past SQLite's automatic checkpoint threshold while
  worker 0 is busy: the log still contains every committed change until the
  single owner ships it.
- Another worker closes, pauses, compacts or moves containers during a
  progressive round or standby copy: the barrier either completes a durable
  handoff first or leaves the WAL and file available for retry.
- A backup writer fails, including a full disk or an invalid signed manifest:
  no checkpoint removes changes that it failed to accept.
- Worker 0 dies before and after accepting a WAL record: restart establishes a
  new generation; the standby sees a new run and copies again, while the
  progressive set contains only a verified base and accepted records.
- A follower dies or joins during a barrier: its old acknowledgment cannot
  satisfy the new generation, and the new worker cannot write until admitted.
- A long-running reader prevents truncation: the WAL remains available and a
  retry does not publish duplicate positions or claim a complete checkpoint.
- Two synthetic stores opened concurrently by two real workers produce one
  progressive base per file, ordered restorable changes, and one replication
  sequence. The same replication token works for requests reaching either
  worker; a wrong token is rejected. A two-process integration test must use
  temporary generated stores, a stub `PATH` for system and network commands,
  and bounded event-driven waits.

Until those cases pass, use one server process for these modes.
