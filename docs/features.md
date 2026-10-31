# What Tabularius does

Everything Tabularius can do today, area by area, and what does not carry over from a FileMaker file. It is early, and working end to end for data; where something is partial or missing the text says so, and [known differences](known-differences.md) is the one list of everything that differs.

- **Reader**: decodes tables, fields, table occurrences, layouts, scripts,
  value lists, custom functions, accounts, privilege sets, relationships,
  records and embedded container files (images, PDFs) from `.fmp12` files,
  including files using Encryption at Rest when supplied with their passphrase.
  CLI commands that read a source file accept its passphrase through a hidden
  terminal prompt or `TABULARIUS_SOURCE_PASSPHRASE`.
- **Hosting**: point the server at a folder of `.fmp12` files. Each is
  converted once into its own SQLite database and hosted under its file name.
  A file using Encryption at Rest waits for its passphrase in the admin
  console's **Hosted files** before conversion.
- **FileMaker Data API–compatible REST**: sessions, layouts, records, finds
  with FileMaker find syntax, create/edit/duplicate/delete, modId conflict
  checks, portals with portalDataInfo, global fields, script and layout
  lists in their folders, container fields as download URLs, and container
  uploads. A conformance suite checks the responses, types, HTTP statuses
  and error codes against Claris's Data API guide;
  [docs/data-api-compatibility.md](data-api-compatibility.md) lists
  every endpoint, field, header and error code as supported, partial or missing.
  [docs/known-differences.md](known-differences.md) is the one list of
  everything that differs from FileMaker or isn't settled yet.
  [docs/for-filemaker-developers.md](for-filemaker-developers.md) maps each
  FileMaker menu path and tool to where it is here.
- **Calculations** ([packages/calc](../packages/calc/README.md)): FileMaker
  formulas run live. Unstored calculations are computed when read (through
  related records, globals and custom functions); stored calculations and
  auto-enter options (stamps, serials, constants, formulas) are applied on
  create and edit; validation (not empty, unique, range, value list, maximum
  length, formula) rejects bad writes with the Data API's error codes.
  Custom functions can also be written in JavaScript (Design > Functions >
  Written in), for what calculations do badly: regular expressions, parsing,
  hashing. Calculations call them like any custom function. Each call runs in
  a separate sandbox process with no files, network, modules or environment,
  in a fresh realm that keeps nothing between calls, for up to 1 second and
  64 MB, returning at most a million characters; past any limit it gives "?".
  FileMaker Pro can't run them, so copying one for FileMaker leaves it out.
- **MCP server** (HTTP and stdio): AI assistants can explore schema, read
  scripts, find and edit records, evaluate formulas, view container images,
  run read-only SQL, and run scripts. They can also understand a solution:
  `explain_solution` maps tables, relationships, script call graphs and the
  scripts that reach outside (mail, network, plug-ins); `document_solution`
  writes the whole design out as documentation (every table and field, the
  relationships, each layout and the scripts it starts, each script with its
  header comment, what starts it and what it calls), also downloadable as a
  web page or Markdown from Design > Report's "Document this solution", where
  the assistant can write an introduction to put first. Beyond reading, an
  AI client can do what a person does in the web client, within its
  account's privileges: edit portal rows (`update_record`), put files in
  containers (`upload_container`), change single layout objects and
  triggers (`edit_layout_objects`), debug a script with breakpoints and watch
  formulas (`debug_script`, offline), try design changes on a throwaway copy
  before applying them (`try_design_change`), paste or copy FileMaker
  clipboard XML (`paste_from_filemaker`, `copy_for_filemaker`), manage the
  image library, and edit accounts and privilege sets (`change_security`;
  never passwords). `where_used` and
  `search_solution` work across every formula, script step and layout object;
  `check_change_impact` says, before a field, table, layout, script or value
  list is renamed or deleted, what would break: names inside quotes (GetField,
  ExecuteSQL, Evaluate, steps "by name") that a rename doesn't reach,
  privilege set entries and record limits (kept by name), and Data API clients
  seen calling it in the last 30 days (Design mode shows the same, and asks
  before a rename or delete that breaks something);
  `suggest_rules` reads a table's records for rules they already follow (a
  field that only holds a handful of values becomes a value list to check
  against, an id that differs on every record becomes unique and required, a
  number counting up becomes a serial, a value nearly every record has becomes
  a default), each with the change that adds it; Design mode lists them under
  each table to accept one at a time;
  `describe_layout` profiles a layout's fields and data so a plain-English
  request becomes a find; `check_calculation` checks a drafted formula (unknown
  names with "did you mean", parameter counts, sample results, and warnings
  for what FileMaker accepts silently); `explain_value` shows why a field holds
  its value on a record (the formula, every value it read, each evaluation
  step, the calculations behind it); `explain_related` says why a portal or
  related field shows what it does, or nothing (the relationship path, each
  match field's values on both sides, the portal filter and sort, every related
  record in or out and why, and "why isn't record N here?"); `lint_formulas` lists those warnings for a
  whole file; `find_stale_calcs` counts, per field, the stored calculations whose
  saved value has fallen behind their formula (a stored calculation that reads other
  records with ExecuteSQL can fall behind when they change), and `refresh_stale_calcs` brings chosen ones
  up to date as one logged batch that `undo_stale_refresh` takes back (converted
  files keep FileMaker's stored values until then; also `tabularius stale-calcs`); and
  `check_script` a drafted script (steps, If/Loop structure, layouts, scripts,
  fields, formulas, unset variables, outbound steps) without running it;
  `compare_solutions` says what changed between two versions of a file, and
  `conversion_report` (also `tabularius report <folder>`, and the Report tab in
  design mode) lists what in a file won't work yet; `conversion_guide` is the
  plain-English version written when a file is converted or converted again
  (what won't work as it is, what works differently, such as Send Mail,
  Insert from URL (on for a file unless an administrator turns its Script network switch off; a converted file and the demo start off) and web viewers that load internet pages, and the built-in
  replacement for each, with the assistant's overview on top when it is on;
  secrets in scripts are hidden), also under Guide in the admin console's
  Hosted files; `optimization_report` (also `tabularius optimize`, and Optimize
  there) says what would make a file smaller or faster, worst first: container
  files kept inside it (for S3 or external storage instead), sorts no index
  serves, things nothing uses; it changes nothing. Prompts
  `explain_solution`, `find_in_plain_english`, `draft_calculation`,
  `draft_script`, `review_security` and `who_changed` package these for MCP
  clients that show prompts.
- **Scripts** ([packages/scripts](../packages/scripts/README.md)): FileMaker
  scripts run on the server, the way FileMaker Server runs them: by name over
  REST, as Data API script triggers (`script`, `script.prerequest`,
  `script.presort`), and from MCP. The web client's **Debug Scripts** opens a
  script debugger like FileMaker Pro's (step into, over and out, breakpoints,
  variables and a Data Viewer) for full-access accounts. By default it runs on
  a throwaway copy of the file, offline (**Scratch copy**, an option the Script Debugger in
  [Claris's help](https://help.claris.com/en/pro-help/content/debugging-scripts.html) doesn't list), so stepping through a script that deletes or changes records
  leaves the hosted file as it was; untick it to debug on the hosted file
  (REST `"scratch": false`, MCP `debug_script` `scratch: false`). **Record
  run** (time travel; Claris's debugger page lists no way to step back) runs the whole script on a scratch
  copy, then steps backwards and forwards through it: each step's call stack,
  variables, found set, and what it did to records (Set Field values before
  they are saved too), with a jump to every step where a chosen field changed.
  It records up to 5,000 steps. Its **Data Viewer**
  button opens one without running a script: watch expressions follow the
  record the web client shows, and a Current tab lists that record's fields
  and the session's $$variables. With the AI assistant on, **Draft with AI**
  there writes an expression from words (checked against the layout's table,
  then Use puts it in the box) and **Explain with AI** says what one works out
  on that record.
- **Several people at once**: typing in a record locks it, as in FileMaker;
  anyone else who tries to change it is told who has it (error 301), over
  the web client, Data API, scripts and MCP alike. Changes show up live in
  everyone's windows. Daily online backups, and a one-command install as a
  service or in Docker.
- **Web client**: open a hosted file in the browser and use its layouts, drawn
  from the file's own design ([docs/web-client.md](web-client.md) says what
  Browse, Find and Preview do and don't yet): theme styles, fields, value lists, portals, tab and
  slide controls, popovers, button icons, hide conditions, conditional
  formatting, number, date and time formats, tooltips and placeholders. Form,
  list and table view (each layout opens in the view saved in the file), with
  sub-summary groups and subtotals when the list is
  sorted by their break field; browse, find, quick find, sort by one or
  several fields, new/edit/delete records and portal rows, drag a file onto a
  container field. Script buttons run their scripts on the server (with the
  button's parameter) and the window follows: layout, found set, record and
  mode. A script's Insert File asks for the file in the browser.
  Install OnTimer Script gives the window a timer that runs its script every
  so often, with the parameter worked out each time. The timer waits while a
  script runs or the cursor is in a field, and stops on an Install OnTimer
  Script with no script. The browser only gets an id for the timer, so it
  can't run any other script that way. Perform JavaScript in Web Viewer calls
  the named web viewer's function with the parameters as text, and the script
  goes on once the function has been called, not when an async function finishes.
  Web viewers
  keep their page across redraws (in browsers with `Element.moveBefore`).
- **Import with matching**: Import Records in the web client matches a CSV or
  Excel file's columns to the layout's fields by name and by their values (by
  the assistant with **Match with AI**), with fixes for each column (day-first
  dates, `$1,200.00`, yes/no, value list spellings, Excel dates), a preview, and
  the rows already in the file or repeated, by an email or id. The import is one
  step that **Undo** takes back (records changed since are kept; an import through another file's layout is undone only in the file it went into). MCP clients get
  plan_import, import_records and undo_import.
- **Record search**: `search_records` (MCP and the assistant) finds records by
  words in any table or field, ranked, with a full-text index on the server
  (no outside service), within the account's privileges. `summarize_records`
  gives counts, totals and breakdowns of a found set ("open invoices per
  customer with their total") without reading every record.
- **AI assistant** in the web client and design mode (`tabularius serve --ai`,
  with an Anthropic API key in `ANTHROPIC_API_KEY`, or in the file
  `~/.openhbam/anthropic-key` (chmod 600; `--ai-key-file` to move it), which is
  how a boot service gets one; the file is read again when it changes; a key made outside a workspace
  also needs `--ai-workspace-id wrkspc_…` or the file
  `~/.openhbam/anthropic-workspace-id`; /admin checks the key with the provider
  and shows AI: connected, no key, key needs a workspace, or credit too low): ask about the file, the
  layout or the record in front of you, have a calculation or script
  explained, or have one drafted. Ask it to "show me" records and it runs the
  find and offers a button that opens them in the window; in Find mode,
  "Find with AI" takes a description ("customers in Ohio who haven't
  ordered since June") and fills in the find requests it means, omit
  requests included, in the Find mode form, to check and change before
  you click Perform Find. A find made this way is named by your words in
  recent and saved finds. The requests are also listed in the panel, where
  you can change any criterion and find again, or open them in Find mode;
  the find always runs as your account. Ask for a chart ("members
  by state", "sales per month") and it draws one in the panel, with the
  numbers worked out from the data the account may see. Ask for a dashboard
  ("revenue by month for my top 10 customers this year") and it builds
  charts, a summary table and totals with a Save button; saved dashboards
  open from the toolbar's Dashboards button, refresh live, keep relative
  dates relative ("this year" stays this year), show the find and grouping
  each widget uses, and let you change them. Each account sees the numbers
  for the records it may view. MCP clients get list_dashboards,
  get_dashboard and save_dashboard. Under a dashboard, set up a digest
  ("Mondays at 08:00, summarise new and overdue invoices"): at that time
  the server works the dashboard out as your account and the assistant
  writes a short summary of it, offline, with secrets hidden. Each run is
  kept with the file and shown under the dashboard, as a notice in the web
  client when it is new, and in the admin console's AI digests list.
  Nothing is emailed; someone with [Full Access] can also have each run
  posted to one of the admin console's webhooks, sent only on a server
  started with --allow-webhooks. Ask it to clean up your data ("find
  duplicate customers") and it lists likely duplicates (the same email or
  phone, names nearly alike at the same address), values off their value
  list ("Actve" for "Active") and malformed phone numbers and emails, with
  suggested fixes to tick; nothing changes until you click Apply. A merge
  keeps one record, fills in its empty fields from the others and moves
  their related records to it. Each batch applies all or none, as your
  account, lands in the audit log, and can be undone. The toolbar's Clean
  Up Data page does the same without the assistant; MCP clients get
  find_data_problems, fix_data_problems and undo_data_fix, and update_records
  sets the same fields on up to 1,000 records a find gives (preview first, all
  or none, undone the same way). Describe an
  automation ("when an invoice is marked paid, set the paid date and add a
  note to the customer") and someone with [Full Access] gets a trigger and
  a script to review, already tried out offline on a copy of the file, with
  the changes it made there listed; nothing runs on the real file until you
  click Turn on. Automations run as the account you pick, never re-trigger
  themselves, keep a log of their recent runs, and leave mail and web steps
  off unless the server's outbound settings allow them. One can also run
  when a record is deleted (none of FileMaker Pro's
  [layout script triggers](https://help.claris.com/en/pro-help/content/layout-script-triggers.html) fires on a delete): the script gets
  the deleted record as JSON in Get ( ScriptParameter ). A capture-only
  file never has automations. The toolbar's
  Automations page lists, pauses and deletes them; MCP clients get
  list_automations, try_automation, save_automation and delete_automation.
  When a script stops with an error in the web client, the message has a
  "Why?" button (for accounts that may see scripts' steps, as in the
  Script Debugger): the assistant runs the script again on a throwaway
  copy of the file, offline, finds the step that failed, and explains it
  with the variables and field values there; a fix to the script comes as
  the changed steps, with a dry run, to apply or not. `tabularius
  test-scripts --explain` prints the same for each script that ends with
  an error, without AI; MCP clients get explain_script_failure.
  For someone with [Full Access], "What changed on this record, who changed
  it, and why?" reads the record's audit trail as events (who, when, each
  field from and to) and says how each change came about where the file can
  tell: worked out by an auto-enter calculation from another field changed
  then, stamped, looked up, or made by an automation or a data cleanup, with
  what the same person changed in other tables at that moment. MCP clients get
  explain_record_history.
  "Ask about this record" (a toolbar button in Browse mode) summarizes the
  record in front of you with what hangs off it (its orders, notes, line
  items), then answers questions about it; each fact is marked with the
  field it came from, and a related record's id. It reads only the records
  and fields your account may see, and leaves out calculations that total
  records you can't view; MCP clients get describe_record.
  It uses the MCP tools as the signed-in
  account (its privilege set applies; it needs the fmmcp extended
  privilege), reads only, and never runs scripts on the live file. Design changes it drafts
  show up with an Apply button for someone with [Full Access]. In design
  mode, "Draft with AI" beside a formula box (calculation, auto-enter or
  validation), a custom function or the script editor writes one from a
  sentence, checks it against the solution, and offers a button that
  puts it in the editor for you to review and save. Under a field's formula
  box, a live preview works the formula out as you type, on the record you
  were on when you opened design mode and a few others; when Check syntax finds an error, "Fix with AI"
  beside it drafts the corrected formula the same way. In the script editor,
  a drafted script first shows as the lines it adds and removes, to put in
  the editor or discard, and **Why does it fail?** runs the script again on a
  throwaway copy, offline, from the layout and record you came from, and says
  which step stops it and how to fix it. The script editor also checks the
  script as you type: loops that can't end and
  guards that catch nothing show under it with a fix, **Why?** says where a
  count comes from and when it is 0 (a parameter the script never got, a
  record with no related rows), and **Fix with AI** drafts the change as a
  diff to review. When a running loop does go on and on, it stops with the
  loop's line and the linter's reason (`--loop-limit` and `--loop-records`
  on `tabularius test-scripts` set how many passes or new records a loop may
  have; a loop that adds 100,000 records stops by default). The linter also
  flags a loop whose Exit Loop If reads only variables the loop never
  changes. **Runaway guard** in the script editor gives one script its own
  limits (steps, seconds not counting waits for a person, times round a
  loop): past any of them it stops cleanly however it is run, subscripts
  included. **Tests** in the
  script editor keep test cases with the file:
  a case's inputs (parameter, layout, found set, current record, global
  variables and fields, and answers for AI steps instead of a model) and what
  the script should end with (result, error, found count, layout, global
  variables, the ending record's fields). "Fill in from a run" records how a
  run ends. Cases run offline on a copy of the file, so hosted data never
  changes; `tabularius script-tests <folder>` runs them all and exits 1 when one
  fails, for CI. **History** lists each save of the script here, shows what
  each changed, and can put an earlier version back in the editor. **Profile**
  shows each step's own time a run beside its line, with × how many times a
  run a loop's steps ran, and picks out the slowest steps: from the script's
  runs on the server, or from one run now, offline on a copy. **Dry run** runs
  the script once on a throwaway copy, offline, and lists each record it would
  create, change or delete, every field with its value before and after.
  **Improve** lists where the script could be simpler or faster: branches that
  never run, steps nothing reaches, runs of steps written twice (one subscript
  instead), the whole of another script written out again, a loop setting a
  field a record at a time (Replace Field Contents instead), a find or commit on
  every pass, and the steps the profiler says take the time. **Refactor with
  AI** hands those to the assistant (when the file allows AI); its draft shows
  as a diff with its own **Dry run**, and nothing changes until you put it in
  the editor and save. A drafted script is
  also test run once on a throwaway copy of the file, offline (no
  network, mail or plug-ins), and the card says how it went: the steps
  it ran, or the error or endless loop it hit, which the assistant fixes
  before offering it. Files over 200 MB skip the test run. Design changes
  it proposes that write scripts get the same test run, on a copy with all
  the proposed changes applied. In Design > Report, "Propose fixes with AI"
  goes through what didn't convert (missing functions, plug-ins, steps that
  can't run, email, the network, tables in files not hosted here) and
  proposes tabularius-native replacements to review and apply, and each item
  has its own Ask AI button. "Design with AI"
  under the tables, layouts, scripts, value lists and custom functions
  lists turns a sentence ("invoices with line
  items") into a proposed design change, applied only when you say so, and
  "Change with AI" in the layout editor does the same for the open layout
  ("put the address fields in two columns"). Off unless
  started with `--ai`: questions and what the tools read go to the model
  provider. Answers stream in as they are written, and Stop ends one
  (the server stops calling the model). When the model provider is busy
  or rate limited, a call is tried again twice before the answer fails. Only the latest part of a long chat
  (20 messages) is sent with each question. Prompts are cached
  between tool steps to keep API costs down,
  and each answer shows the tokens it used. `--ai-daily-tokens 2000000` caps
  what the assistant may use per day (cached input counts at a tenth); past it, questions wait until the next day (UTC).
  `--ai-account-daily-tokens 200000` does the same per account, and shows
  each person their own usage. One question has a
  strict budget of its own, `--ai-run-tokens` (default 300,000 tokens, a whole number
  up to 10,000,000, cached input at a tenth): before each model call the most it could add is
  counted (the input so far, counted cautiously, with a margin when the
  provider's tool search is used; a pasted picture as 5,000 tokens; and the
  most the answer may write), and a call that could take the question past
  the budget is not made; the answer says so and keeps what it found. There
  is no dollar budget for one question, only the month's. The count is
  kept in `<folder>/.openhbam-ai-usage.sqlite`, shared by every worker
  (`--workers`), so the limits and the monthly budget hold for the whole
  server, and a restart doesn't reset them.
  Simple questions (reading, finding, adding up) go to a fast model at low
  effort (`--ai-fast-model`, default `claude-haiku-5-5`; `off` sends
  everything to the main model); design work, drafts, scripts and security
  go to `--ai-model` (default `claude-opus-5-5`). Anthropic has no embeddings
  API, so script embeddings (Insert Embedding, Insert Embedding in Found Set,
  GetEmbedding, Perform Semantic Find by natural language) use a separate
  model: `--ai-embed-url` (any OpenAI-compatible `/embeddings` endpoint: OpenAI,
  Ollama, LM Studio, vLLM ...) with `--ai-embed-model`, and the key, if it needs
  one, in `TABULARIUS_AI_EMBED_KEY`. `--ai-embed-url ollama` or `lmstudio` is enough
  for a model on this computer (see docs/local-embeddings.md), and works without
  `--ai` or an Anthropic key; `tabularius doctor --ai-embed-url ollama` checks the
  model answers. Without an embedding model those steps stop with error 3.
  The same model feeds Configure RAG Account and Perform RAG Action (add data,
  send prompt, remove data): spaces live in `.openhbam-rag.sqlite` in the server's
  folder, one set per file, searched without an index but with the vectors kept in memory (up to
  50,000 chunks a space, about 70 ms a search at 768 dimensions).
  Each question starts with
  a short outline of the file and the dozen tools most questions need; the
  rest are deferred, and the model finds them with Anthropic's tool search
  when a question calls for them. The admin console's **AI use** section
  lists the latest questions with their model, time, tokens and approximate
  cost (list prices), and the month's total; `--ai-monthly-budget 150` stops
  questions once the month reaches about $150. Without `accept:
  application/x-ndjson`, the assistant's API answers with one JSON object
  whose `reply` is the answer's text (with `model`, `ms` and `usage`).
- **[AI-visible policy, per file](ai-visible-policy.md)**: new solutions default on; existing and converted files stay off until an administrator opts in. Secret-bearing sources need explicit privilege-set exceptions, and uncertain script/SQL reads are refused. See the [implementation and test report](ai-visible-policy-report.md).
- **AI off, per file**: the admin console's Hosted files table shows whether AI
  can read each file and turns it off (or `tabularius ai <folder> <file> off`, or
  `serve --ai-exclude A,B`). A file with AI off is never read for AI apps (MCP),
  the assistant, digests' summaries or AI matching, for any account, the local
  administrator included; a file that uses its tables is kept from AI too. Turning
  it off or on, and every refused AI request, is in the file's security log.
- **FileMaker's AI script steps** run on the same model: Configure AI Account,
  Generate Response from Model (with its message history), Perform Find by
  Natural Language (the model sees field names, never record data), Configure
  Prompt Template, and Perform Semantic Find by vector data. The API key and
  endpoint a script configures are never read; this server's model answers,
  under the same daily limits and per-file AI switch. Without `--ai`, in
  `test-scripts`, in automations (AI apps can save those) and in scripts an AI
  app runs, these steps stop with error 3
  and say why. A capture-only file (see outbound test mode) never reaches
  AI. Insert Embedding and Perform Semantic Find by natural language need an
  embedding model (see the embeddings paragraph above).

Not yet: containers in FileMaker's secure (encrypted) external storage. See <!-- known-difference: Reading .fmp12 files ;; Containers in FileMaker's secure (encrypted) external storage are not supported ;; Such containers do not come across from a converted file ;; An owner decision on supporting them, and a sample file that has them -->
[docs/ARCHITECTURE.md](ARCHITECTURE.md).

**Script network access is supported.** Web requests (Insert from URL, `connection://` addresses) and plug-in network calls are on for a file unless an administrator turns the file's **Script network** switch off. They start off for a file converted from a `.fmp12` and for `tabularius demo`, so a copy you are testing cannot call outside services; turn **Script network** on for that file in the admin console (Hosted files) when this copy is the live one. Mail is sent once the server is set up to send it. Steps that need a screen or a person at FileMaker Pro are skipped or give error 3.

## What does not carry over

Read this before moving a file. Each point is detailed in
[docs/moving-a-solution.md](moving-a-solution.md) and, with what is still
unknown, in [docs/known-differences.md](known-differences.md).

- **People use a browser.** There is no FileMaker Pro or FileMaker Go client for a file hosted here.
- **Passwords.** An account whose FileMaker password is empty keeps working, from the server's own computer. Every other account needs a new password set with `tabularius passwd`.
- **Go to Related Record options are not read from a converted file.** A step that used "Match all records in current found set" goes from the current record alone, and "Show only related records" turned off is not supported; the conversion guide counts the steps and a run warns. Set the option again in the script editor.
- **FileMaker plug-ins are never loaded.** A few BaseElements and MBS functions run as built-in code; any other FileMaker plug-in call gives "?" and error 3. A Tabularius plug-in (JavaScript or WebAssembly) that replaces one runs in a sandbox once an administrator turns it on for a file; see [writing a plug-in](writing-a-plugin.md).
- **Web viewers are sandboxed.** Solution HTML works, but cannot load external resources. An https page loads only when an administrator lists its host for that file; otherwise the address shows as text.
- **AI script steps use this server's own model;** the account, endpoint, key and model a script names are not used.
- **The store is not the `.fmp12`.** A converted file lives in an SQLite store beside the original, which is left as it was; changes made here can't be written back into a `.fmp12`. To leave, `tabularius exit-bundle` writes the whole file (every table as SQLite and CSV, container files, globals, serials, the design) to a folder any tool can read; the copy is plaintext, so keep it private.
- **Import Records steps from a converted file** stop with error 3 until their mode (Add, Update matching, Replace) is set again in the script editor.
- **Save a Copy as doesn't make a `.fmp12`.** It always writes a Tabularius SQLite store named `<name>.openhbam.sqlite`, even when a script asks for a `.fmp12` backup; FileMaker cannot open that copy. Use the server's `tabularius backup` command for backups.
- **Some security detail is flattened.** Per-layout, per-value-list and per-script privileges come over at the privilege set's overall level; review your sets in Manage Security before people sign in.
