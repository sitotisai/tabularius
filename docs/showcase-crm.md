# The CRM showcase

The CRM showcase is a sales app, built and filled with invented data, that shows what Tabularius does with one file: classic layouts, modern HTML layouts, a script engine, record-level privileges, charts, an automation, and a built-in MCP server for AI apps. Everything in it is made up: names, companies, emails (they end in `.example`) and numbers. Nothing comes from a real file or person. The dates are counted from the day you start it, so the pipeline always looks current.

## Start it

<!-- docs-example: illustrative -->
```sh
tabularius demo --full
```

`--full` is the `crm-showcase` starter with everything on: the sign-ins in "Accounts" below, a read-only SQL port on this computer, and a read-only token for an AI app. `tabularius demo --starter crm-showcase` is the same file with only `Admin`. Like the ordinary demo, the showcase hosts the file on this computer only, opens in your browser with a one-time password for `Admin`, and deletes everything when you press Ctrl-C. Add `--keep <folder>` to keep the files. Type `Showcase` as the file name on the sign-in page. The password is printed once, and the other accounts share it.

## Screens

In the order a visitor meets them. The five HTML pages are in the **Home** folder, first in the Layouts list, in this order.

1. **Today** (modern layout). A greeting, the signed-in rep's open tasks for the next seven days with a **Mark done** button, their deals closing within 30 days, a ring showing the quarter's won amount against the quarterly quota, the last ten activities, and eight prompts to try in an AI app, each with a copy button. A manager or executive has no rep record, so they see every record their privilege set allows and no quota ring. *Shows:* a page that reads and writes as the signed-in account, so what it shows depends on the privilege set, and a button that runs a script.
2. **Sales dashboard** (modern layout). Tiles for open pipeline, weighted forecast, won, win rate and average deal size; revenue by month for the last 12 months; the pipeline funnel; win rate by lead source; a rep leaderboard. A **Period** menu (this quarter, this month, last 30 days, year to date, all time) changes won, win rate and the leaderboard; the pipeline tiles and the funnel always show every open deal. *Shows:* summaries and charts computed by the server from the live records.
3. **Account timeline** (modern layout). One account's activities and emails merged by time, grouped by day, each item expandable, with an icon for calls, meetings, emails and notes. *Shows:* related records from several tables on one page.
4. **Pipeline board** (modern layout). Deals as cards in a column for each stage, with the money worked out for each column, a filter by rep, a highlight on stale deals, and drag to move (or the menu on each card). Moving a deal to Lost asks for a reason; every move stamps the stage time, sets the closing day when a deal is won or lost, and adds a note to the deal's activity. A rep sees and moves only their own deals, and the server refuses the rest. *Shows:* writes through privileges and validation. A second, plainer board, **Deals Modern board**, is made from the stage value list by the "Modernize interfaces" tool, and an **Activities** calendar is made the same way.
5. **Connect** (modern layout). Live record counts, then snippets to copy: sign in to the Data API, find open deals, query with SQL, add the MCP endpoint to Claude Code, and subscribe a calendar to the Activities feed. Replace the parts in angle brackets with your own. The SQL snippet needs a server with a SQL port and an account with the `fmxdbc` privilege; `--full` opens one (see "The SQL port"). The snippet's query was written from the table design and has not been run on a showcase. *Shows:* every way in to the same file, under the same privileges.
6. **Classic layouts.** An **Account 360** form with five tabs (Overview, People, Deals, Activity, Emails) and a portal in each tab, plus the buttons that run the showcase's scripts; a **Deals** form with a quote portal that totals the line items, and its buttons (Advance, Won, Lost, Duplicate); list layouts for every table, a column chart of amount by stage, and two reports (**Pipeline by rep and stage**, **Activity by type**). These are ordinary layouts, drawn in design mode, and run in the web client as any imported layout does. The Account timeline page also sits in the Activity tab of Account 360.
7. **Pipeline overview** (a dashboard with the open weighted amount, amount by stage and amount by source) and an **automation**: when a deal's stage becomes Won, the script *Add onboarding task* adds an onboarding task for it.

## The three AI tiers

1. **No key, offline.** Everything above works with no AI at all, and the demo server makes no outside connection. Scripts that call an AI step (Perform Find by Natural Language, Generate Response from Model) report error 3, and the step's own message says it needs a model and that a server started with `--ai` runs it. The ordinary script result is empty, so the showcase's own scripts handle error 3 and say so.
2. **Claude Code or Claude Desktop over MCP.** With `--full`, the demo prints a token for an `AI agent` account when it starts, with the lines to hand it to Claude Code (through a variable you type at a silent prompt, so it is not in your shell history) and a snippet for Claude Desktop. The token is **read-only and uses the `Rep` privilege set**, so an AI app sees one sample rep's records and changes none (reading still writes the server's own journal and index tables). It **expires 24 hours after the demo starts at the latest, is revoked when you press Ctrl-C**, and is shown only once. It is not the server's administrator credential, which never expires and is never printed. If the demo stops uncleanly (a crash or power loss) the token is not revoked, so with `--keep` revoke it in the admin console before you reuse the folder. The Claude Desktop snippet puts the token in a settings file outside the demo folder; delete that entry when you are done. An AI app you connect is a separate program, and what it reads may go to its own provider, whatever `--ai` says. See [connect an AI app](connect-ai.md).
3. **The in-app assistant, with `--ai`.** `tabularius demo --full --ai` turns on the demo's own assistant and the AI script steps. It needs your own Anthropic key, found the way [AI features and policy](tutorials/let-an-ai-use-your-file-safely.md) describes, and without one the demo refuses to start. It prints a banner first: questions and the data they read go to the model provider, and the sample data is invented. It spends tokens on your key, so the showcase never starts it unless you ask.

## Accounts

`--full` makes four accounts, all with the password the demo prints. Each rep's records are matched through the `Login` field on the Reps table to the account name, so the rule is an ordinary calculation you can read in the privilege set. Ava is the one sample rep who signs in.

| Account | Privilege set | What it can do |
| --- | --- | --- |
| `Admin` | `[Full Access]` | Everything, including design mode and the admin console, and the read-only SQL port. |
| `Ava` | `Rep` | See and change only the deals, accounts and activities whose owner is Ava, create new ones, and see contacts, emails and quote lines of her accounts and deals. Cannot delete or change the design. |
| `Morgan` | `Manager` | See every record, create and edit, but not delete or change the design. Can use the read-only SQL port. |
| `Eli` | `Executive` | View only. |

Sign in as `Ava`, then as `Morgan`: the Deals list shows fewer deals for Ava than for Morgan, and so do the pipeline board, Today and the dashboard; an edit to someone else's deal is refused with the record-access error. The `AI agent` account has no password; it exists for the token. Whether the same record-level rule holds for a privilege set imported from another file depends on how that file defined it; look at the imported set before assuming so.

## The SQL port

`--full` opens a read-only PostgreSQL port on this computer and prints a `psql` line for `Morgan` (the password is the demo's). Plain `tabularius demo` and `--starter crm-showcase` open none. For a port on a server you host, start `tabularius serve` with `--sql-port` and give the account the `fmxdbc` privilege; see [hosting for a team](hosting-for-a-team.md).

## What it does not do

Only things that truly do not work:

- **No live mailbox sync.** The Email Log table holds invented messages. Nothing is read from or sent to a real mailbox.
- **No drag and drop on classic layouts.** Dragging cards between stages works on the modern pipeline board only.
- **Pages over 30,000 characters do not open in FileMaker Pro's web viewer.** A modern layout is a web viewer whose address formula holds the page, and that formula takes up to 30,000 characters in FileMaker Pro. Each of the five showcase pages is between about 10,000 and 16,000 characters, so they open there too; the layout editor shows the size of any page you grow. A page that goes over the limit still opens in Tabularius.
- **No SQL writes.** The demo's SQL port is read-only.
- **No outside connection unless you ask.** Without `--ai` nothing leaves the computer; scripts' network access (Insert from URL, Send Mail) is off in the demo and is a switch in the admin console.

For everything that differs from FileMaker, see [known differences](known-differences.md).

## Not checked

Three parts could not be checked here and are listed in [known differences](known-differences.md) instead of guessed at:

- Whether Claude Code expands the token variable in a header it has stored, as the printed `claude mcp add` line assumes. <!-- known-difference: Showcase demo ;; Whether Claude Code expands the token variable in a stored MCP header is unverified ;; A refused connection from Claude Code with a token that has not expired or been revoked ;; Run the printed claude mcp add line in Claude Code and connect -->
- That the pinned `mcp-remote` version the Claude Desktop snippet runs exists and works. <!-- known-difference: Showcase demo ;; That the pinned mcp-remote version in the Claude Desktop snippet works is unverified ;; Claude Desktop cannot connect with the printed snippet ;; Add the printed snippet to Claude Desktop and connect -->
- How FileMaker Pro shows the five HTML pages in its web viewer; the 30,000-character measure is from the formula length only. <!-- known-difference: Showcase demo ;; How the showcase's HTML pages look in a FileMaker Pro web viewer is unverified ;; A page that does not draw in a FileMaker Pro web viewer ;; Open the showcase layouts in FileMaker Pro -->
