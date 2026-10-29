# SQL statement deadline feasibility on Node 22

The proposed opt-in HTTP SQL and pgwire deadline cannot safely use a
`worker_threads` pool with `node:sqlite` on Node 22. This note records the
stopped prototype. A deadline for every statement is not shipped; the one case
that held the whole server for ever, a recursive query that does not end, is
stopped (see below).

## Blocking observation

A worker ran an unbounded recursive CTE through `DatabaseSync.prepare(...).get()`.
The main thread called `worker.terminate()` 100 ms after starting the query.
The terminate promise was still pending two seconds later, and the Node process
remained alive until interrupted. A focused pgwire prototype returned a timeout
and answered subsequent queries, but its test process continued consuming CPU
after the assertion passed. This is consistent with termination waiting for the
native synchronous SQLite call to return; it cannot preempt that call.

The main thread can send a timeout response on schedule, but each runaway
statement would leave a worker executing and holding resources. Replacing that
worker could accumulate unbounded live threads and reads under repeated
requests. That fails the required server recovery guarantee.

A bare read-only `DatabaseSync` in a worker also does not itself reproduce the
current `Store.select()` path. The store performs read-only and internal-table
checks, parameter checks, query-function registration, and design refresh;
HTTP SQL and pgwire perform translation and live privilege checks before
`select()`. A valid off-thread implementation must share those behaviors,
including pgwire catalog functions and typed results. The stopped prototype
preflighted with `Store.describe()` in the main thread, but worker termination
alone is sufficient to reject this architecture.

## Proposed alternative

Use a small pool of **child processes** for deadline-enabled SQL. Each child
would open the store file read-only and run the same shared query executor used
by `Store.select()`. The parent would perform the existing translation and
privilege checks immediately before dispatch, enforce a deadline that includes
queue time, and send a timeout response (HTTP error code 8311; pgwire SQLSTATE
`57014`). On expiry or PostgreSQL CancelRequest, it would kill the child
process and start a replacement. An operating-system process kill can stop a
thread blocked in a native SQLite call; this must be verified on the supported
platforms before implementing the endpoints. This would add process memory and
IPC overhead, so measure warm-pool latency and memory against the current
in-process path before setting a default. Leave the feature off by default.

Pgwire's current `BEGIN`/`COMMIT` and settings are server-side session state;
pgwire does not expose uncommitted writes. A future executor should explicitly
keep any query depending on uncommitted state in-process so it can preserve
read-your-writes. Tests should cover result and privilege parity, recursive CTE
termination, replacement after a kill, simultaneous short queries, and both
simple and extended pgwire cancellation.

## What is shipped: recursive queries

SQL a person or a model writes (HTTP SQL, `sql_query`, ExecuteSQL, pgwire)
whose compiled program loops over a recursive queue (a `WITH RECURSIVE` query,
which SQLite also accepts without the keyword) runs in a child process that is
killed after 5 seconds, and the call answers error 812, as the result-size limit does. The
deadline is a constant of the server, not a setting. The child may use 1024 MB of
memory; one that runs out answers 812 too, with a message about memory rather than time.
All other queries run in the server process as before.

Such a query sees the committed file with the same views of native decimal
fields. It has SQLite's own functions, the functions the store defines in place of
or beside them (`ROUND`, `LOWER`, `UPPER`, `DEGREES` and the other date, text and
number functions of FileMaker SQL, the same code the server runs, so a recursive
query answers as a plain one does), and a few the server marks as portable (the
PostgreSQL `array_upper` and `array_length`, which a driver's `generate_series`
bound calls). A recursive query that calls any other function the server defines
(such as the other PostgreSQL catalog functions) is refused with 8310. The child
also gets the server's time zone (`TZ`), so the time functions agree.

The child reads the committed file. A recursive query on a file that a transaction
holds open, which is a `BEGIN` on the SQL port with writes enabled after a write to
that file, is refused with 8310, because the child would not see the transaction's
changes. A `BEGIN` that has not written to the file, and a query outside one, run
the child on the committed file. A script's Open Transaction never reaches this
path: ExecuteSQL reads the committed file.

Each recursive query starts a Node process, about 0.4 ms for a plain query against
roughly 600 ms for this one on a busy machine, and the server still waits for the
child while it runs, so one such query holds the server for up to the deadline, not
for ever. Only one child runs at a time in a server process, but each may use 1024 MB
of heap and the server parses up to a 300 MB answer from it; in cluster mode that
multiplies by the number of workers. The child is started the way the server's other helper processes are
(the single-file program runs a helper script only when it comes first on the
command line, so the memory cap goes in the environment), with only the environment
variables it needs.

Any other query with no end in practice (a join of large tables with no condition,
say) is not bounded. Whether FileMaker's own SQL stops a recursive query that does not end, and when, is unverified here.
<!-- known-difference: SQL and calculations ;; A recursive SQL query is stopped after 5 seconds, can use SQLite's own functions, the store's shared ones and two PostgreSQL array functions only, and is refused on a file an open SQL-port transaction has written to; the server is held for that time, and other long SQL statements are not bounded; comparison unverified ;; A long recursive query answers error 812; one that calls another PostgreSQL catalog function or runs on a file a transaction has written to answers 8310 ;; A run of a recursive query that does not end through FileMaker's ODBC or JDBC driver, to see whether and when it is stopped (a deadline for every statement would need the child process design above for all queries) -->
