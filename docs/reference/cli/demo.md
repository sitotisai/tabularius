# tabularius demo

This command's usage comes from `tabularius help demo`. Statements comparing behavior with FileMaker in this program help are inferred from the implementation.

## Usage

```text
Usage:
  tabularius demo [--starter crm|inventory|invoicing|tasks|booking|crm-showcase] [--full] [--ai] [--keep <folder>] [--port 8080] [--no-open]
                                             Try it: a starter app with sample records, hosted for this
                                             computer only on a free port, with an Admin account whose
                                             random password is printed once. Opens the browser if it can.
                                             Everything is deleted when you press Ctrl-C (--keep <folder>
                                             leaves the files there). The demo server makes no outside
                                             connection unless you add --ai. --full is the crm-showcase starter with
                                             sign-ins for Ava (Rep), Morgan (Manager) and Eli (Executive),
                                             a read-only SQL port and a read-only token (24 hours) for an
                                             AI app; an AI app you connect sends what it reads to its own
                                             provider. --ai (showcase only) turns on the demo's own AI
                                             assistant only, which needs your Anthropic key: questions go
                                             to the model provider
```

## Options

`--ai`, `--full`, `--keep`, `--no-open`, `--port`, `--starter`

## Exit codes

0 on success; 1 on error.

## Tested CLI example

```sh
tabularius demo --help
```

This example is executed by the CLI reference test.

[All commands](index.md)
