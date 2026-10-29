# Developing and testing from a checkout

Run Tabularius from its source, read a file with the command-line reader, and run the tests and evals. Needs Node 22.20 or newer, and no install step for the reader itself. For hosting a file, see the [quickstart](../QUICKSTART.md).

`tabularius version` prints the version, the commit and the Node it needs
([what a version number means](versioning.md)), and `tabularius help [command]` (or
`--help` after any command) lists the commands or shows one command's usage.
The options of `serve` can also be set in the environment: see
[environment variables](environment-variables.md).

<!-- docs-example: illustrative -->
```sh
npm install            # TypeScript types, plus the server's two packages (see below)
npm run fixtures       # download public sample files
npm test
npm run converter-quality  # lists layout objects of the sample files that did not convert (--strict fails on an error; give .fmp12 files to check your own)
npm run smoke:web      # optional: load /admin and /app in a real browser and fail on any JS error
npm run smoke:sync     # optional: drive the admin console's Sync page in a real browser against a stand-in Data API
npm run visual         # optional: draw every sample layout in a real browser and fail if one draws differently from the baseline (--update to accept)
                       # (needs a Chromium; one is preinstalled in cloud sessions, or set TABULARIUS_CHROMIUM)
npm run test:e2e       # the web client in a real browser through Playwright: open a file, find, edit,
                       # sort, portals and record locking (packages/web/e2e; same Chromium as smoke:web)

npm run tabularius -- info    fixtures/fmp12/Charts.fmp12
npm run tabularius -- schema  fixtures/fmp12/FMburgh_2012_11_07_Database.fmp12
npm run tabularius -- records fixtures/fmp12/Charts.fmp12 "NW Customers" --limit 5
npm run tabularius -- export  fixtures/fmp12/Charts.fmp12 charts.sqlite
npm run tabularius -- dump    fixtures/fmp12/Standards.fmp12 --prefix 17.5 --text
```

The reader, store, calculation and script engines and web client use
nothing beyond Node. The server uses two packages: the official MCP SDK
(`@modelcontextprotocol/sdk`), which serves `/mcp` and `tabularius mcp`, and
`zod`, which describes the MCP tools' inputs. The SDK brings its own
dependencies with it. The single-file program and the Docker image include
them, so neither needs an install step.

The AI tools have an eval suite (`packages/server/evals/`): plain-English
finds, formula and script drafts, rename impact checks and suggested rules
on the Charts sample (and finds on Flicks, a differently built file), each graded against the file's own data (the records a
find should show, a formula's result on every record, the found set a
script ends on), plus a cost case: "what is this file about?" must go to
the fast model in at most two calls of at most 6,000 tokens each (and, live,
answer within 15 seconds). `npm run evals` replays recorded answers, so it costs
nothing and runs inside `npm test`. `npm run evals -- --live` asks the real
model (key from `ANTHROPIC_API_KEY` or `~/.openhbam/anthropic-key`), and
`--live --record` saves its answers as the new recordings. Scripts run
offline, on a throwaway copy of the file.

`npm run eval:ai` is the live run (it uses the API key, so it is never part of
`npm test` or the automatic test runs). To judge a model or routing change by
numbers, compare models side by side:

```sh
npm run eval:ai -- --models claude-haiku-5-5,claude-sonnet-5-5,claude-opus-5-5,routed
```

Each model answers every call of every case ("routed" is the server's own
choice between its main and fast models). The table shows cases and checks
passed, tokens, cost at list prices, the median and slowest answer time, and
the cases where the models differ.
