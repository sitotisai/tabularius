# PostgreSQL result limits

A PostgreSQL query may return at most **100,000 rows** by default.
`TABULARIUS_PGWIRE_MAX_ROWS` sets a different whole-number cap, read
per query (0 removes the cap, as `TABULARIUS_DATA_API_MAX_LIMIT=0` does for the Data API); for example, `TABULARIUS_PGWIRE_MAX_ROWS=200000` allows larger results. Results a connection keeps open in portals (the extended protocol's suspended results) share a total of 100,000 rows, or `TABULARIUS_PGWIRE_MAX_BUFFERED_ROWS`; one full result always fits, so a larger `TABULARIUS_PGWIRE_MAX_ROWS` raises the total too. Closing a portal frees its rows; over the total the query answers SQLSTATE 54000.
Invalid or non-positive values (including 0) fall back to 100,000.

A client that does not read what the server sent does not make the server queue more: rows go out in batches of at most 1,000 rows or about 1 MiB, and after each batch and after each statement (one that returns no rows too) the server stops reading that connection's next messages while its answer is over the socket's write buffer, and carries on when the client reads. A client that takes nothing from what is queued for it for 60 seconds is disconnected, and a write that was already kept stays kept; one that reads, however slowly, is not disconnected. The 60 seconds are counted from the last time the client took something, checked once the time is up, so a client that reads only a little just before it ends can be cut off after nearly twice as long. `TABULARIUS_PGWIRE_OUTPUT_STALL_MS` sets another limit in milliseconds, read each time the server waits; `0` means no limit. Several writes with `RETURNING` in one query keep their rows (up to the portal row total above) until the last has been kept, then send them a batch at a time. While a client is stalled inside `BEGIN`, the transaction limits in [SQL writes](pgwire-writes.md) still apply. PostgreSQL itself waits for such a client without limit <!-- known-difference: SQL and calculations ;; A SQL client that takes nothing of the server's answers for 60 seconds is disconnected here; PostgreSQL waits without limit ;; A client that pipelines queries without reading their answers is cut off after a minute ;; A decision whether the default should be no limit, as in PostgreSQL -->.

Bound parameters in a connection's portals share a separate **64 MiB
(67,108,864 bytes)** cap. `TABULARIUS_PGWIRE_MAX_PARAM_BYTES` sets a positive
whole-number byte limit in digits only, checked when the server starts and read at each Bind.
Unset uses the default; invalid or non-positive values (including 0) stop startup. Text counts by its UTF-8 byte length,
binary parameters by their input byte length, and nulls count as zero.
A Bind that would exceed the total, including a single Bind larger than the
cap, answers SQLSTATE `54000` with the limit and advice to close portals or
send smaller parameters. Parameter lengths are checked before decoding.
Closing a portal frees its bytes; replacing its name counts only the new
parameters. Sync outside a transaction clears the portals and frees their
bytes; Sync inside a transaction keeps them. The extended protocol requires
Sync after an error, and an aborted transaction also needs ROLLBACK or COMMIT.

The SQL a client sends is limited to **1 MB** (1,048,576 characters) on every SQL path:
the whole string of one simple Query message or one Parse (so a batch of many small
statements in one message counts as a whole; send big batches as several messages),
a SQL endpoint request, an ExecuteSQL query and a `sql_query` call. The PostgreSQL
port answers SQLSTATE `54000`, the others error 812. Longer text is refused before any
work is done on it, because reading it takes far more time and memory than its length
suggests. Pass large values as parameters. The text the server builds itself, such as
the `FileMaker_Fields` system table, is not held to the limit.

For the per-query row cap, the server reads one
extra row to detect overflow and refuses larger results before sending any
rows, with SQLSTATE `54000` and this message:

> SQL results are limited to 100000 rows; use LIMIT and page through the result with a stable ORDER BY

The message uses the configured cap.

This applies to simple queries and prepared queries, including portal
Describe and Execute. Execute's row count controls delivery from an already
buffered result; it does not bypass the query limit. Use SQL `LIMIT` and
paginate with a stable, unique `ORDER BY`. Results exactly at the cap are delivered
in full, and a connection remains usable after an error (Sync is required
in the extended protocol).

`Store.select()` returns an array, and portals retain that array for later
Execute messages. Its current API cannot stream rows. The limit bounds each
result to 100,001 buffered rows by default, including the overflow check. Each
result is also bounded in size: a row whose text and blob values add up to more than
64 MB (bytes), or rows that add up to more than 256 MB in one result (the size of the
text and blobs plus 24 bytes for every value, numbers and NULLs included), fail with error 812 and a message that says what to cut (this applies to every SQL
path: ExecuteSQL, the SQL endpoint, `sql_query`, and the PostgreSQL port). There is no process-wide byte
budget: multiple portals, concurrent connections, and SQLite's own query work
can still consume more memory. The measurements below cover three modest text columns.
Streaming rows in batches with no cap is a possible follow-up.

Signed-in connections enable TCP keepalive and close after five minutes without socket activity. `TABULARIUS_PGWIRE_IDLE_MS` sets that idle time in milliseconds when a connection signs in; `0` disables this idle timeout. Active query work is exempt. Connections waiting to sign in have a separate global budget of 256 remote sockets and 256 local sockets.

## Date and time result types

A result column that reads a field directly carries its schema type, including
through an alias or join and when there are no rows:

| Field | PostgreSQL result type | OID |
| --- | --- | ---: |
| Date | `date` | 1082 |
| Time | `time without time zone` | 1083 |
| Timestamp | `timestamp without time zone` | 1114 |
| Text | `text` | 25 |

Expressions, casts and function results do not inherit a field's date/time type;
for example, `d || 'x'`, `CAST(d AS TEXT)` and `date(d)` remain text. Text results
preserve stored values, including invalid imported text. Dates normally use
`YYYY-MM-DD`, times `HH:MM:SS` with optional fractional seconds, and timestamps
either `YYYY-MM-DDTHH:MM:SS` (the store's normalized form) or a space separator.

Binary results encode dates as days since 2000-01-01, times as microseconds since
midnight, and timestamps as microseconds since 2000-01-01, without timezone
conversion. Accepted binary input text has a valid calendar date in years
0001–9999, hours 00–23, minutes/seconds 00–59 and at most six fractional digits.
Invalid or unsupported text is returned as SQL NULL in binary format, rather
than an incorrect value. Text format still returns it unchanged.

ParameterDescription is unchanged: parameters retain client-given or cast types.
Containers are unchanged (their stored integer pointers are reported as
`numeric`); the appropriate SQL representation of containers is **unverified** <!-- known-difference: SQL and calculations ;; The SQL type reported for a container column is not confirmed against another product's SQL interface ;; Container columns are reported as numeric, their stored integer pointers ;; A comparison against another product's SQL result description for a container column -->.

## Measurement

Measured before the change on 2026-10-15, macOS arm64, Node v22.22.2, against
`origin/main` at `2b369a19cbac8f87e5b088c3f4291e2f67bb73e9`. The cited
`pgwire.ts` lines 28 and 510 still used the million-row cap and buffered
select; `notes/security-pass.md` did not exist on that revision.

Each size ran in a fresh process against a temporary, generated SQLite table.
The three text columns contain zero-padded row numbers of 64, 96 and 128 ASCII
bytes (288 bytes per row). No imported files or fixtures are used. After
setup and garbage collection, `process.memoryUsage()` is sampled every 1,000
rows by a SQL function and immediately after select returns. These are
observed peaks, not continuous profiling. Time includes the sampling and
buffering, excluding table generation, authentication and wire transmission.

| Returned rows | Time (ms) | Peak RSS (MiB) | Peak heapUsed (MiB) | RSS growth (MiB) | Heap growth (MiB) |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 10,000 | 10.9 | 123.7 | 22.1 | 2.6 | 6.8 |
| 100,000 | 92.5 | 173.8 | 60.8 | 52.1 | 45.5 |
| 1,000,000 | 966.5 | 587.4 | 451.9 | 464.7 | 436.6 |

The 100,000-row default uses about 61 MiB of peak heap for these rows
(45.5 MiB of growth), compared with over 436 MiB of growth at one million.
Raising the cap allows larger results at the cost of more memory. Reproduce the original buffered
select measurements (the benchmark deliberately retains the old limit):

```sh
node --no-warnings scripts/bench-pgwire.ts
```

The regression checks the 100,000-row default, environment overrides that
raise and lower it, and invalid values. The wire tests use a small override
of 100 rows to stay fast: they build a million-row table, check every delivered
field at the boundary, refuse oversized queries in both protocols, and
check that only 101 rows were read. They also sample memory during reads
and after the response, asserting heap growth below 32 MiB and RSS growth
below 64 MiB. These assertions exercise the small test cap, not the default's
memory use. The regression client consumes messages without retaining the result.

```sh
node --expose-gc --no-warnings --test --test-reporter=spec packages/server/test/pgwire-results.test.ts
```
