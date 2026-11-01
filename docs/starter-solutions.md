# Starter solutions

Five small apps you can start from instead of an empty database. Each is built when you create the database, through the same design operations the assistant and design mode use, so you can change every part afterwards.

<!-- docs-example: run -->
```sh
tabularius new ~/tabularius Tasks --starter tasks
tabularius passwd ~/tabularius Tasks Admin
tabularius serve ~/tabularius
```

Add `--no-sample` to start without the sample records. Without it you get a few invented records so the first screen is not empty; each record with a Notes field says "Sample record. Delete me." there. Stock movements and invoice lines have no Notes; they belong to the sample products and invoices and go with them when you delete those. `--starter` works on a new database only; it will not touch an existing one.

| Starter | Tables | Scripts | Report |
| --- | --- | --- | --- |
| `crm` | Companies, Contacts, Deals | Close deal (parameter `Won` or `Lost`), Duplicate deal | Deals by stage |
| `inventory` | Products, Movements | Receive stock, Sell stock (parameter `product id\|quantity\|note`) | Stock value by supplier |
| `invoicing` | Customers, Products, Invoices, Lines | New invoice (parameter: customer ID), Send invoice, Mark as paid | Invoices by status |
| `tasks` | Projects, Tasks | Mark done, Reopen, Duplicate task | Tasks by status |
| `booking` | Resources, Bookings | Book (parameter `resource id\|customer\|day\|start\|end`), Confirm booking, Cancel booking | Hours by status |

What each one has:

- **Tables and relationships.** Every table has a `ID` that numbers itself. A parent table (a company, an invoice, a project) shows its related rows in a portal on its form, and the calculations that add them up (a company's open pipeline, an invoice's total, a project's percent done) follow the relationships.
- **Layouts.** A form named after the table and a "<Table> list" for each table, plus the report. Fields that take one of a few values (a deal's stage, a task's status) are pop-up menus fed by a value list. Where a script is the natural next step, the form has a button for it.
- **Scripts.** They take what they need from the script parameter, check it, and say what happened in the script result. `Book` looks through the existing bookings and refuses a time that overlaps one that is not cancelled. `Sell stock` will not take stock below zero.
- **Privilege sets.** `Staff` can look at, add and change records but not delete, and cannot change the design. `Read only` can look, search and print. Neither can change layouts, value lists or scripts; both can run scripts, and a script cannot do more than the account running it. Make accounts with `tabularius passwd ~/tabularius <database> <account> --privilege-set Staff`, or in the admin console.

## Showcase

The five starters above are unchanged. A sixth, `crm-showcase` ("Tabularius CRM Showcase"), is a larger CRM for trying the whole product: reps, accounts, contacts, deals, activities, an email log, products and quote lines, with invented sample data (names, `.example` emails, `555-01xx` phones; dates are relative to the day it starts), scripts, a pipeline board, a calendar, a dashboard, a deal-won automation and Rep, Manager and Executive privilege sets. It is built only by the demo command:

<!-- docs-example: illustrative -->
```sh
tabularius demo --starter crm-showcase
tabularius demo --full
```

- `--starter crm-showcase` serves it exactly as the other starters are served: this computer only, an `Admin` account with a random password shown once, everything deleted on Ctrl-C. The database is called `Showcase`.
- `--full` is that starter plus three more sign-ins with the same password: `Ava` (Rep: sees and changes only her own accounts, deals and activities), `Morgan` (Manager: all records, no delete) and `Eli` (Executive: view only). It also opens a read-only SQL port on this computer and prints a `psql` line for it, and prints a "Connect an AI app" block for a separate `AI agent` account. Its token is read-only (it finds and reads records, changes no record and runs no script; reading still writes the server's own journal and index tables, so this is not zero writes), uses the Rep privilege set so it sees only one sample rep's records, expires after 24 hours at most and is revoked when you press Ctrl-C, also with `--keep`. It is shown only on the terminal. Claude Code gets the token at a silent prompt (`read -rs`) into a variable, so it is not echoed, in shell history or in the command it stores (start Claude Code from that terminal before you unset the variable) (that Claude Code expands the variable in a stored header is unverified); Claude Desktop keeps its settings in a file outside the demo folder, so its snippet leaves a copy of the token on disk, dead after Ctrl-C: make that file owner-only (`chmod 600`; these steps are POSIX-only) and delete the demo entry afterwards. The Desktop snippet pins the `mcp-remote` version it downloads (that this version exists is unverified). If the demo stops uncleanly (crash, `kill -9`, power loss) the token is not revoked, and with `--keep` and the files hosted again it stays valid until its 24-hour expiry: revoke it before reusing or sharing the folder. <!-- known-difference: Demo AI app hand-off ;; Whether Claude Code expands a variable in a header stored by the printed add command is unverified ;; The command works only if Claude Code expands the variable when it connects; if not, the app is refused for want of a token ;; A run of the printed command against Claude Code --> <!-- known-difference: Demo AI app hand-off ;; That the pinned mcp-remote version in the Claude Desktop snippet exists and connects is unverified ;; npx fails to find the version, or the bridge does not connect ;; A run of the snippet in Claude Desktop -->
- `--ai` (with `--full` or `--starter crm-showcase` only) turns on the AI assistant. It needs an Anthropic key in `ANTHROPIC_API_KEY` or the key file described in [connect AI](connect-ai.md), and refuses to start without one. It prints "AI is on: questions and the data they read go to the model provider. The sample data is invented." It controls the demo's own assistant only. Without `--ai` the demo server makes no outside connection, and a test checks this for the showcase too; an AI app you connect with the printed instructions is a separate program, and what it reads may go to its own provider. The banner is printed before the assistant is enabled.
- Script network access stays off, and web viewers may load no hosts, as in the other demos.
- Scripts that use AI steps give error 3 when the AI is off; the showcase's own scripts show an explanation. Not every part of the showcase has been shown in a browser by a test.

## Tested

Every starter is built into a fresh database in the tests, and then used the way this page describes: the scripts run and give the results above, the calculations give the expected totals, `Book` refuses overlaps, and a hosted copy answers every layout through the Data API for a Staff and a Read only account, where Staff can add and edit but not delete and a script run by Read only changes nothing. Each starter also passes [`tabularius check-solution`](check-solution.md) with no errors and no warnings. Names and records are invented.

## Not covered

- There are no screenshots on this page. The layouts are drafted by the same tool the assistant uses, and are checked for consistency (every field, button and label points at something that exists) and served through the Data API, but they have not been rendered in a browser by a test.
- The starters are examples to learn from and adapt, not finished products. Invoicing keeps no tax, currency or numbering rules, and booking knows nothing about opening hours.

The [examples](../examples/README.md) are the same idea as design-text folders you can read and edit as files.
