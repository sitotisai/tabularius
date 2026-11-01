# The CRM showcase

The CRM showcase is a sales app, built and filled with invented data, that shows what Tabularius does with one file: classic layouts, modern HTML layouts, a script engine, record-level privileges, charts, an automation, and a built-in MCP server for AI apps. Everything in it is made up: names, companies, emails (they end in `.example`) and numbers. Nothing comes from a real file or person. The dates are counted from the day you start it, so the pipeline always looks current.

> **Status of this page.** The pages described under "Screens" (the pipeline board, Today, the Sales dashboard, the Account timeline and Connect) and the Home folder that holds them are built and tested. Three things this page describes are still being built by other changes, and are marked **pending** where they appear: the demo command's showcase flags (`--full`, `--ai`), the Account 360 and Deal classic layouts, and the four accounts with their privilege sets. Remove this note when they merge.

## Start it

```text
tabularius demo --starter crm-showcase   (pending: the flag names are not final)
tabularius demo --full                   (pending: the showcase with everything on)
```

The commands are in a `text` block, not a shell block, on purpose: the documentation tests run and check every shell example against the program's own `help`, and these flags are not in `help` yet. When the demo command accepts them, this block becomes a shell block and the tests will check it.

Like the ordinary demo, the showcase hosts the file on this computer only, opens in your browser with a one-time password for `Admin`, and deletes everything when you press Ctrl-C. Add `--keep <folder>` to keep the files. Type `Showcase` as the file name on the sign-in page.

## Screens

In the order a visitor meets them. The five HTML pages are in the **Home** folder, first in the Layouts list, in this order.

1. **Today** (modern layout). A greeting, the signed-in rep's open tasks for the next seven days with a **Mark done** button, their deals closing within 30 days, a ring showing the quarter's won amount against the quarterly quota, the last ten activities, and eight prompts to try in an AI app, each with a copy button. A manager or executive has no rep record, so they see every record their privilege set allows and no quota ring. *Shows:* a page that reads and writes as the signed-in account, so what it shows depends on the privilege set, and a button that runs a script.
2. **Sales dashboard** (modern layout). Tiles for open pipeline, weighted forecast, won, win rate and average deal size; revenue by month for the last 12 months; the pipeline funnel; win rate by lead source; a rep leaderboard. A **Period** menu (this quarter, this month, last 30 days, year to date, all time) changes won, win rate and the leaderboard; the pipeline tiles and the funnel always show every open deal. *Shows:* summaries and charts computed by the server from the live records.
3. **Account timeline** (modern layout). One account's activities and emails merged by time, grouped by day, each item expandable, with an icon for calls, meetings, emails and notes. *Shows:* related records from several tables on one page.
4. **Pipeline board** (modern layout). Deals as cards in a column for each stage, with the money worked out for each column, a filter by rep, a highlight on stale deals, and drag to move (or the menu on each card). Moving a deal to Lost asks for a reason; every move stamps the stage time, sets the closing day when a deal is won or lost, and adds a note to the deal's activity. A rep sees and moves only their own deals, and the server refuses the rest. *Shows:* writes through privileges and validation. A second, plainer board, **Deals Modern board**, is made from the stage value list by the "Modernize interfaces" tool, and an **Activities** calendar is made the same way.
5. **Connect** (modern layout). Live record counts, then snippets to copy: sign in to the Data API, find open deals, query with SQL, add the MCP endpoint to Claude Code, and subscribe a calendar to the Activities feed. Replace the parts in angle brackets with your own. The SQL snippet needs a server started with `--sql-port` and an account with the `fmxdbc` privilege; the demo does not open a SQL port. The snippet's query was written from the table design and has not been run on a showcase. *Shows:* every way in to the same file, under the same privileges.
6. **Classic layouts** (**pending**). An **Account 360** form with tabs (contacts, deals, activity, emails, notes) and a portal of contacts, a **Deal** form, a **Quote** layout, list layouts and charts and reports. These are ordinary layouts, drawn in design mode, and run in the web client as any imported layout does.
7. **Pipeline overview** (a dashboard with the open weighted amount, amount by stage and amount by source) and an **automation**: when a deal's stage becomes Won, the script *Add onboarding task* adds an onboarding task for it.

## The three AI tiers

1. **No key, offline.** Everything above works with no AI at all. Scripts that call an AI step (Perform Find by Natural Language, Generate Response from Model) report error 3 and say that the step needs a model and that a server started with `--ai` runs it. The ordinary script result is empty, so the showcase's own scripts handle error 3 and say so.
2. **Claude Code or Claude Desktop over MCP.** The server's `/mcp` endpoint needs a credential even on this computer. Connect shows the command to add it. Use a narrow, short-lived, read-only token for the `Rep` privilege set rather than the administrator credential, which has no expiry. (**Pending:** how the showcase demo hands the token over is being built; until then, create one in the admin console.) An AI app signed in as a rep sees only that rep's deals. See [connect an AI app](connect-ai.md).
3. **The in-app assistant, with `--ai`** (**pending**). With a model configured, the assistant in the web client and the AI script steps run. It spends tokens on the model you configure; the showcase does not start it unless you ask. See [AI features and policy](tutorials/let-an-ai-use-your-file-safely.md).

## Accounts

The showcase is meant to be shown from four accounts (**pending**: they arrive with the privilege sets). Each rep's records are matched through the `Login` field on the Reps table to the account name, so the rule is an ordinary calculation you can read in the privilege set.

| Account | Privilege set | What it can do |
| --- | --- | --- |
| `Admin` | `[Full Access]` | Everything, including design mode and the admin console. The demo prints its one-time password. |
| `Ava` | `Rep` | See and change only the deals, accounts and activities whose owner is Ava. Cannot delete or change the design. |
| `Morgan` | `Manager` | See every record, create and edit, but not delete or change the design. |
| `Eli` | `Executive` | View only. |

Sign in as `Ava`, then as `Morgan`: the pipeline board, Today and the dashboard show fewer deals for Ava, and an edit to someone else's deal is refused with the record-access error. Whether the same record-level rule holds for a privilege set imported from another file depends on how that file defined it; look at the imported set before assuming so.

## What it does not do

Only things that truly do not work:

- **No live mailbox sync.** The Email Log table holds invented messages. Nothing is read from or sent to a real mailbox.
- **No drag and drop on classic layouts.** Dragging cards between stages works on the modern pipeline board only.
- **Pages over 30,000 characters do not open in FileMaker Pro's web viewer.** A modern layout is a web viewer whose address formula holds the page, and that formula takes up to 30,000 characters in FileMaker Pro. Each of the five showcase pages is between about 10,000 and 16,000 characters, so they open there too; the layout editor shows the size of any page you grow. A page that goes over the limit still opens in Tabularius.
- **No SQL port in the demo.** `tabularius serve` with `--sql-port` opens one; see Connect.

For everything that differs from FileMaker, see [known differences](known-differences.md).
