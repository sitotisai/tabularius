# Tabularius

An open-source (MIT licence), AI-native platform that opens and hosts FileMaker `.fmp12` files. It reads a file,
converts it once into a SQLite store, and serves it with a Data API-compatible REST API, a web client with a design
mode, a script engine, a calculation engine and a built-in MCP server. It is for all FileMaker developers and
solutions, and is not affiliated with Claris.

## Try it

On macOS or Linux, one command installs the single-file program (no Node needed), and `tabularius demo` hosts a sample
app on this computer only:

<!-- docs-example: illustrative -->
```sh
curl -fsSL https://github.com/sitotisai/tabularius/releases/latest/download/get.sh | sh
tabularius demo
```

The demo opens in your browser with a one-time password for `Admin`, and deletes everything when you press Ctrl-C.
Windows, Docker and installing from a checkout are in the [quickstart](QUICKSTART.md).

## Host your own file

[QUICKSTART.md](QUICKSTART.md) gets a `.fmp12` file hosted and open in your browser in a few minutes: run `tabularius`,
then drop the file on the page. The original file is left as it was. A conversion report says what in the file won't
work yet, and [known differences](docs/known-differences.md) is the one list of everything that differs from FileMaker
or isn't settled yet.

## What it does

- **Reads `.fmp12` files**: tables, fields, relationships, layouts, scripts, value lists, custom functions, accounts,
  privilege sets, records and container files, including files that use Encryption at Rest when given their passphrase.
- **Hosts them**: point the server at a folder; each file is converted once into its own SQLite database. Accounts and
  privilege sets come with the file and every way in enforces them.
- **Data API-compatible REST**: sessions, layouts, records, finds, portals, containers and scripts. A conformance suite
  checks the responses against Claris's Data API guide, and
  [docs/data-api-compatibility.md](docs/data-api-compatibility.md) lists every endpoint as supported, partial or
  missing.
- **Runs your calculations and scripts**: FileMaker formulas and scripts run on the server, from buttons, triggers,
  schedules, the Data API and MCP, with a debugger that runs on a scratch copy and a recorder that steps a run backwards.
- **A web client with a design mode**: open a hosted file in any browser and use its layouts; change tables, layouts,
  calculations and scripts in design mode. Existing layouts are fully supported, and new ones can be written in HTML,
  CSS and JavaScript.
- **Built for AI**: a built-in MCP server lets an AI app explore the schema, find and edit records, explain a value,
  check what a rename would break and draft scripts, always as the signed-in account and within its privileges. See
  [connect an AI app](docs/connect-ai.md).
- **Script network access**: Insert from URL, Send Mail and plug-in network calls are supported. They start off for the demo and for a first-opened converted file, and one **Script network** switch in the admin console turns them on for a file.
- **Self-hosted**: your server and your data. Passkeys, single sign-on, daily online backups with verification,
  point-in-time restore, a standby server, SQL and PostgreSQL access for BI tools, and an admin console. Nothing leaves
  your computer unless you turn something on.

The whole list, area by area, is in [docs/features.md](docs/features.md).

## What does not carry over

Read this before moving a file; each point is detailed in [docs/moving-a-solution.md](docs/moving-a-solution.md).

- **People use a browser.** There is no FileMaker Pro or FileMaker Go client for a file hosted here.
- **Passwords.** An account whose FileMaker password is empty keeps working from the server's own computer; every other
  account needs a new password set with `tabularius passwd`.
- **Plug-ins are never loaded.** A few BaseElements and MBS functions run as built-in code; any other plug-in call gives
  "?" and error 3.
- **Screen-bound steps.** Steps that need a screen or a person at FileMaker Pro are skipped or give error 3.
- **Web viewers are sandboxed.** Solution HTML works but cannot load external resources unless an administrator lists
  the host.
- **The store is not the `.fmp12`.** Changes made here can't be written back into a `.fmp12`; `tabularius exit-bundle`
  writes the whole file to a folder any tool can read.
- **Some security detail is flattened.** Per-layout, per-value-list and per-script privileges come over at the privilege
  set's overall level; review your sets before people sign in.

The full list is in [docs/features.md](docs/features.md#what-does-not-carry-over).

## Status

Early software. It works end to end for data, and the tests cover it, but it has been used on far fewer files than
FileMaker has, so keep your original file and a backup, check the conversion report, and read
[known differences](docs/known-differences.md) before you rely on a hosted file. The [changelog](CHANGELOG.md) lists what
changed in each version.

## Documentation

| I want to | Read |
|---|---|
| Install and host my first file | [QUICKSTART.md](QUICKSTART.md) |
| Run and look after a server | [ADMIN.md](ADMIN.md), [Hosting for a team](docs/hosting-for-a-team.md) |
| Move a FileMaker solution over | [Moving a solution](docs/moving-a-solution.md), [For FileMaker developers](docs/for-filemaker-developers.md) |
| Build and change a solution | [Design mode](docs/design-mode.md), [guides](docs/README.md) |
| Call it from code | [Add a Data API client](docs/tutorials/data-api-client.md), [Hosting files and connecting to them](docs/hosting-and-connecting.md) |
| Connect an AI app | [Connect an AI app](docs/connect-ai.md), [Let an AI use your file safely](docs/tutorials/let-an-ai-use-your-file-safely.md) |
| Run it from source, or write code for it | [Developing](docs/developing.md), [Architecture](docs/ARCHITECTURE.md), [examples](examples/README.md) |
| Fix a problem | [Troubleshooting](docs/troubleshooting.md), [Runbook](docs/runbook.md) |

Every page is also built into a searchable site: `npm run docs:build` writes it to `dist/docs-site`, and the `index.html`
there opens from disk. [docs/README.md](docs/README.md) is the full index.

## Privacy

Nothing leaves your computer unless you turn something on: no telemetry, no analytics, no update check, and no fonts or
scripts from anyone else's server. [docs/privacy.md](docs/privacy.md) lists each thing that can be turned on, what it
sends and when, and the tests that check the rest.

## How the format works

See [docs/research/fmp12-format.md](docs/research/fmp12-format.md) for what we know, how we know it, and what's still
open, and [docs/research/prior-work.md](docs/research/prior-work.md) for sources.
[docs/research/write-back.md](docs/research/write-back.md) studies how design changes made here could go back into a
FileMaker file.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how changes are made here, or the [contributor summary](docs/contributing.md)
for the pre-push check. Report a vulnerability privately, as [SECURITY.md](SECURITY.md) says. AI coding agents start at
[AGENTS.md](AGENTS.md).

## License

MIT. Parts of the decoder are derived from [fmptools](https://github.com/evanmiller/fmptools) by Evan Miller (MIT); see
[NOTICE](NOTICE). The packages and the Node.js runtime inside a release build keep their own licences, listed in the
`THIRD-PARTY-NOTICES.md` that ships beside it; `npm run licences` checks that every dependency's licence is on the allow
list and that no sample files or keys are committed. FileMaker is a trademark of Claris International Inc.; this project
is not affiliated with Claris.
