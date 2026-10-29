# Hosting for a team

Reference for whoever runs the server: install, upgrading, HTTPS, the admin console, backups, logs, SQL and BI access, performance and sizing. [ADMIN.md](../ADMIN.md) is the step-by-step guide; this page is the longer reference.


Install it with one command. From a checkout (it uses your Node 22.20+ or
downloads its own, and puts `tabularius` in `~/.local/bin`):

```sh
./scripts/install.sh --service ~/Databases   # starts at login/boot (launchd or systemd)
```

For a server machine nobody logs in to, add `--system`: it runs at boot as
you (a LaunchDaemon on macOS, a system unit on Linux, which may also use
port 443), asking for `sudo` once. Options after `--` go to `tabularius serve`,
and `--print` shows the service file without installing anything:

```sh
./scripts/install.sh --service /srv/Databases --system --port 443 -- --https files.example.com --sql-port 5432
./scripts/install.sh --uninstall             # stops and removes the service; files stay
```

On **Windows**, from PowerShell (it uses or downloads Node the same way and
puts `tabularius` on your PATH):

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install.ps1 -Service C:\Databases
powershell -ExecutionPolicy Bypass -File scripts\install.ps1 -Service C:\Databases -System   # at boot; administrator prompt
```

It is a Task Scheduler task that starts at sign-in, or with `-System` at boot
as the system account (and opens the port in Windows Firewall), started
again a minute after it stops unexpectedly. Node can't answer Windows'
service manager by itself, so this is the built-in way to keep it running
without installing a wrapper program.

Once installed, the same is one command on every system:
`tabularius service install <folder> [--system] [--port 8080] [--host 127.0.0.1] [-- serve options]`
(it listens on this computer only, unless `--host` says otherwise or `-- --https <domain>` is given, which listens on every address),
`tabularius service print ...` and `tabularius service uninstall`.

**Upgrading in place.** `tabularius upgrade` (or `install.sh --upgrade`,
`install.ps1 -Upgrade`) fetches the newest version into the install, backs up
the hosted folder, restarts the service and waits for it to answer its health
check. If the new version doesn't start, it puts the previous one back and
starts that again. Hosted files and backups are never touched: each file is
brought up to date by the new version as it opens it. It refuses an install
with local changes, so nothing of yours is overwritten.

Or with Docker, hosting `./Databases`:

```sh
mkdir Databases && sudo chown 1000:1000 Databases   # the container runs as an unprivileged user (uid 1000)
docker compose up -d
```

For a read-only root filesystem and no extra capabilities, add
`-f compose.yaml -f compose.hardened.yaml`; for HTTPS from Caddy (with your
name in `Caddyfile`), use `docker compose -f compose.https.yaml up -d`.

Drop `.fmp12` files into the folder, even while the server runs: each is
converted once (in the background, so nobody waits) and hosted. The port is published on this computer only (`127.0.0.1:8080`). To let others on your network open `http://<this machine>:8080/`, change `compose.yaml` to publish `"8080:8080"`; that is plain HTTP, so passwords cross the network unencrypted. Prefer `compose.https.yaml`.

A browser is never "the server's own computer" to a server in a container, so an account with an empty password can't sign in there, and the admin console has no password yet. The image has the `tabularius` command, working on the mounted folder `/data`:

<!-- docs-example: illustrative -->
```sh
docker compose exec tabularius tabularius admin-password /data
docker compose exec tabularius tabularius passwd /data Contacts Admin    # file, then account
```

**Over the internet**, point a name at the machine and let the server get
its own certificate from Let's Encrypt, renewed a month before it runs out:

<!-- docs-example: illustrative -->
```sh
tabularius serve ~/Databases --https files.example.com --https-email you@example.com
```

That serves `https://files.example.com/` on port 443. Port 80 must reach the
machine too: Let's Encrypt checks the name there, and it sends everyone else
on to https. On Linux, let Node use those ports with
`sudo setcap cap_net_bind_service=+ep $(which node)`. Keys and certificates
are kept in `<folder>/.openhbam-tls`. Your own certificate works too
(`--tls-cert`/`--tls-key`), as does a proxy such as Caddy (with `--public-url`,
and `--proxy-header x-forwarded-for`, plus `--trusted-proxies IP/CIDR,...`
when the proxy connects from another machine or container, so lockouts and
logs see each visitor; ADMIN.md has the details and Compose setup).

**Editing together.** Typing in a record locks it until you leave it; others
see "In use by Ann" and can't change it in the meantime. Locks lapse a minute
after the editor's window stops renewing them (a closed tab), and logging out
releases them. Every window hears about changes as they happen and redraws
the records it shows, without disturbing a field someone is typing in.
Clients other than the web client can use the same endpoints
(`/tabularius/live/v1/databases/{db}/events`, `.../locks`, `.../clients`, and
`.../layouts/{layout}/records/{id}/lock`, see
[packages/server/src/live.ts](../packages/server/src/live.ts)).
A session may hold 10 event streams open at once (opening an 11th closes the oldest), and a stream whose reader has stopped taking data, with 256 KB waiting to be sent, is closed; the web client reconnects on its own.

**Admin console.** Open `/admin/` to see who is connected (and disconnect
them), who is editing or looking at which record, the hosted files, and backups, with a
"Back up now" button. It only opens on the server's own machine until you
set a password with `tabularius admin-password <folder>`; its sign-in page asks
for that password (no user name). For HTTPS on a local network without buying
a name, serve with `--https local`. Once a password is
set, five wrong guesses from one address lock it out for fifteen minutes
(the server answers 429 with a `Retry-After`), so the single password can't
be brute-forced.

**Hosting a file from the browser.** Under "Host a FileMaker file" in the
admin console, pick a `.fmp12` and press "Upload and host". It goes up in
16 MB pieces (a dropped connection retries the piece, so multi-gigabyte
files are fine), then converts on a worker thread while the console shows
tables and records as they're copied. When it's done the file is hosted
live, with no restart, and the console shows the conversion report: what in
the file won't work yet. The same steps are an API for scripts:
`POST /tabularius/admin/v1/uploads` with `{name, size}`, then
`PUT .../uploads/{id}?offset=N` for each piece, then
`POST .../uploads/{id}/finish`; `GET .../uploads` shows progress.

**FileMaker's Admin API.** Tools written for FileMaker Server's Admin API
(v2) can use `/fmi/admin/api/v2`: the real `fmcsadmin` was run against it for
most of its commands ([docs/fmcsadmin-parity.md](fmcsadmin-parity.md) says
which); Claris Connect's FileMaker Admin connector has not been tried. Sign in at `POST /user/auth` with the admin
password (any user name) as HTTP Basic, then send the token as `Bearer`. The
Admin API needs that Basic login and an admin password set: the console
cookie, the local admin channel and a loopback connection don't sign in to it. You can list
files and open, close, pause or resume them; closing a file ends its
sessions. You can also list clients, disconnect them or send them a message,
and stop or start the server, which closes and reopens every file. Script
schedules can be listed, created, changed, run (`{"status":"RUNNING"}`),
duplicated and deleted. Only FileMaker script schedules exist here; ones
made through the API never reach the network. Backups keep their own
settings, so backup, verify and system-script schedules answer code 21 (not
supported). `serverVersion` reports the Admin API level this matches, and
`product` says it's Tabularius. Blocking new users (`/server/config/blocknewusers`,
fmcsadmin's `set serverprefs BlockNewUsersEnabled=true`, or the button under
**Connected** in the admin console) stops new sign-ins everywhere (web client,
Data API, AI apps, SQL) while sessions already open carry on; every worker
follows it and it lasts across restarts. Calls that carry their credentials
each time (API tokens, OData, MCP with an account and password) start no
session and keep working. `fmcsadmin list plugins` lists the
installed plug-ins, and `get serverconfig`, `get serverprefs` and `get cwpconfig` answer with
values that describe Tabularius (no limits on files or connections); changing
those answers code 21. `fmcsadmin certificate create`, `certificate import`
and `certificate delete` put a certificate authority's certificate in place:
the request's key and the certificate are kept in the folder
(`.openhbam-tls/imported`), the folder's settings name them for the next
start, and a server serving https by itself uses a new certificate at once.

**Change feed and webhooks.** Other systems can keep up with a hosted file
without polling every table. `GET /tabularius/changes/v1/databases/{db}` (signed
in like the Data API) answers with a cursor. Call it again with `?since=` set
to that cursor to get every create, update and delete since then. Each change
has its kind, table, record id and modification count, but no field data:
read the record through the Data API, where privileges apply. Only records
the account may view are listed. `&wait=30` holds the request open until
something changes. Changes are kept in memory (the last 10,000 per file). A
cursor older than that, or from before a restart, answers 410 with a fresh
one. Webhooks push the same changes: add one in the admin console API
(`POST /tabularius/admin/v1/webhooks` with `{url, database, tables}`). Each
delivery is a batch signed with `x-tabularius-signature: sha256=<HMAC of the
body>` using the secret returned when the webhook was made, and carries
`x-tabularius-webhook: <id>`, the id of the webhook that sent it, so one
receiver can tell several webhooks apart. Like scripts,
the server sends nothing out unless started with `--allow-webhooks`.

**Inbound hooks.** Another service can run a script by calling the server:
add a hook in the admin console (Inbound hooks) with the file, the script and
the account it runs as. The secret is shown once. Each call is a `POST` to
`/tabularius/hooks/v1/<id>` with a JSON body (256 KB at most), which becomes
`Get ( ScriptParameter )`. It carries `X-Tabularius-Timestamp` (Unix seconds) and
`X-Tabularius-Signature: sha256=<hex HMAC-SHA256 of "timestamp.body">`. A call
more than five minutes off the server's clock, one already received, or one
over the hook's calls-a-minute limit is refused. The answer is
`{"ok": true, "result": "<the script's result>"}`, or the error. The script runs
within the account's privileges, with no AI steps. It reaches the network only
when the file's Script network switch is on and the hook allows the network too. The admin console lists each hook's
recent calls (never their bodies). The server answers no calls unless started
with `--allow-inbound-hooks`, and a capture-only file never has a hook.

**Health and metrics.** `GET /tabularius/health` answers `{"status":"ok"}`
without signing in, for load balancers, Docker and Kubernetes (the Docker
image uses it as its health check). `GET /tabularius/admin/v1/metrics` gives
Prometheus metrics, signed in with the admin password: requests by kind
and status with their durations, sessions, live-update streams and record
locks per file, file sizes, PostgreSQL connections, the last backup,
progressive and off-site runs, script schedules, the certificate's expiry,
standbys, memory, active timers and sockets, CPU and event loop delay. In Prometheus:

```yaml
scrape_configs:
  - job_name: tabularius
    metrics_path: /tabularius/admin/v1/metrics
    basic_auth: { username: admin, password: <admin password> }
    static_configs: [{ targets: ['filemaker.example.com:8080'] }]
```

**Script schedules.** Like FileMaker Server's, the admin console runs a
script of a hosted file every so many minutes, optionally lined up with a time
of day (every 1440 minutes from 02:00 is nightly at 2 a.m.). A schedule runs as
an account of the file, within its privileges, and shows its next and last run,
its last error, and (under "Runs") its last 50 runs with how each went, kept
across restarts in `<folder>/.openhbam-schedule-runs.json`.
A schedule that was due while the server was off does not run when it comes back; the next run is the next time from then on. A schedule repeats every day, every N days or every N minutes; it cannot be limited to some weekdays, months or a time window. See [ADMIN.md](../ADMIN.md#script-schedules).
Scheduled scripts reach the network only when the file's Script network switch
is on (admin console, Hosted files) and the schedule allows it too; they never
send mail. Scripts an AI runs (the `run_script` MCP tool) are always offline. Schedules are kept in `<folder>/.openhbam-schedules.json`. Import
Records in any script reads only from `<folder>/Documents`.

**Plug-in functions.** Calculations run the safe, local BaseElements
functions natively and never load a plug-in:
- **JSON, regex and stacks:** `BE_JSONPath`, `BE_RegularExpression` (options i, m, s, x, g, v) and the `BE_Stack…` functions.
- **Text files:** `BE_FileReadText`, `BE_FileWriteText`, `BE_FileExists` and `BE_FileSize` only touch `<folder>/Documents` and a run's temporary folder, as the file script steps do. Any other path counts only by its file name. `BE_GetLastError` reports a missing file as 2.
- **Network and mail:** `BE_HTTP_…` (GET, POST, PUT, PATCH, DELETE, and the file variants that save to or send from `<folder>/Documents`), `BE_SMTPSend` and `BE_FTP_…` (FTP and FTPS uploads and deletes) work once Script network is turned on for the file, through the same guarded transport and host limits as Insert from URL; with it off they give "?" and error 3. SFTP is not built. `BE_FileMove`, `BE_FileCopy`, `BE_FileDelete` and `BE_FolderCreate` run against the script's documents and temporary folders.
- **Refused:** shell commands, the clipboard, folder pickers and file dialogs give "?" and error 3, whatever the network setting.
- **MBS:** text, path and container helpers and the Hash functions (digests, HMACs, CRCs; not PBKDF2 or files) are covered; every other MBS call answers with an MBS error.

**Perform Script on Server** works as on FileMaker Server:
- **A fresh session.** The script runs in a new session as the caller's account and privileges. It doesn't see the caller's layout, found set, record, global fields or variables, so pass what it needs in the parameter.
- **Locks.** Records the caller is editing are locked to it, as to anyone else (error 301).
- **Waiting.** With "Wait for completion", `Get ( ScriptResult )` and `Get ( LastError )` come back to the caller. Without it, the caller carries on while the script runs on its own.
- **Size limit.** Parameters and results are cut at a million characters.
- **Taking turns.** Server-side scripts, Perform Script on Server and schedules alike, take turns in one queue: at most the greater of 50 and the number of CPU cores run at once, first come first served. The admin status and `/metrics` show how many are running and waiting.
- **Nested calls.** Perform Script on Server inside a server-side script runs at once, so scripts waiting on each other can't fill the queue.
- **Same rules.** The script follows the same network rules as the caller.

**Connections.** The admin console's Connections page keeps the outside services
your solutions use, by name: S3-compatible storage (the tests use a fake S3
server; real services are expected to work and are not tested), web APIs (REST, signed in with a bearer token,
basic sign-in, an API-key header or OAuth 2 client credentials) and an outgoing
mail account (SMTP). Add one with its settings (for storage: bucket, region,
endpoint and a folder to stay inside), type the secrets into their own boxes,
press Test (storage lists one object, mail signs in and sends nothing) and turn
it on. A mail connection marked "Send Mail steps use it" is what Send Mail via
SMTP uses when the server is started without `--send-mail`; the flag, when
given, wins. Mail through a connection is limited to 100 messages an hour for the
server and 50 an hour for each file whose scripts take part in a message, so a
runaway script cannot flood a mail server and one file cannot use up everyone's
allowance. The count is kept in `.openhbam-mail-sent.json` in the hosted folder
(times only, no addresses or text), so a restart does not start a loop afresh. One
message may name at most 20 recipients (To, CC and BCC together) unless the
connection's "Most recipients in one message" says up to 100; a message over the
cap is refused before anything is sent and does not count against the hour, and an
AI draft always starts at 20.
The keys are sealed on the server with AES-256-GCM and used only inside it, to
sign the one request being made: no script, plug-in, AI tool or API call is ever
given one, they are never logged, and the console only says whether each is set.
Start the server with `TABULARIUS_SECRETS_KEY` (a passphrase) and the key never
touches the folder; without it the server writes a key file only its user can
read beside the secrets. A connection can be limited to some hosted files.
[Connect an S3 bucket](tutorials/connect-an-s3-bucket.md) walks through one
from start to a passing Test (a test runs it, so it stays true).
Scripts use one with Insert from URL and an address like
`connection://invoices/2026/scan.pdf`: with a container in `$file`, cURL options
`-X PUT --data-binary @$file` store it; the same address with no options fetches
it into a container field (or a variable); `-X DELETE` removes it; and
`connection://invoices/?prefix=2026/` lists a folder (S3's XML, with names
relative to the connection's folder). A script can't reach beyond the
connection's bucket and folder, add ACLs or copy sources, or see the keys. Like
every outbound step it works once Script network is turned on for the file in the
admin console (or the server is started with `--allow-script-network`, which
turns it on for every file). It never works for an AI-run script, a schedule,
automation or inbound hook that doesn't allow the network, or any script run
offline, and never when a capture-only file
(named in `--capture-only`) is anywhere on the call stack, and in outbound test mode
it is recorded and reaches only allowlisted hosts. Ask an AI app, or the assistant in the web client ("set up an S3
connection to our invoices bucket"), and it calls `draft_connection`: that makes
a draft with the settings you gave, limited to the file you asked from, and
nothing more. The AI never sees, asks for or invents a key (a setting that
looks like one is refused, and no tool sets keys, approves, changes or uses a
connection); you open Connections, check the settings, type the keys, press Test
and approve. `list_connections` shows what exists and which secrets are set,
never their values. Both need [Full Access] and are never offered a capture-only
file. The same is `/tabularius/admin/v1/connections`. In the web client's assistant
the draft also comes with a card under the answer: on a server started with
`--allow-app-connections`, a [Full Access] person types the keys into its
password boxes, presses Test and approves right there (the same checks, only for
a draft the AI made for the file they are in, and the card says which host the keys
will go to); on any other server the card shows the draft and says to finish it in
the console.

Cloud storage that signs in with OAuth 2 (Google Drive, Dropbox, Microsoft
OneDrive) is a web-service connection with sign-in `oauth2-refresh`: you get a
refresh token from the service once (its own authorize page or console), type the
client ID, client secret and refresh token into the secret boxes, and the server
swaps it for short-lived access tokens itself, kept in memory and never written
down. Choosing the service under "Start from" when you add the connection (or
asking an AI app, which lists them in `list_connections`) fills in the addresses and
scope and says where the three secrets come from. Dropbox answers everything with
POST and Google Drive uploads need it too, so those connections are switched to
Allowed: write by a person; an AI draft starts at read. A service that issues a new
refresh token on every use is not supported.

A scheduled script (its network option on, in a file whose Script network switch is on) uses connections, and mail through an
email connection, only while everything in the hosted files that can run or steer
code is as a person last approved it for that schedule: scripts, custom
functions, field formulas, layouts (triggers and buttons), custom menus, file
options, data sources and table occurrences, in every hosted file, because a
script can call another file's. A schedule records that when someone turns its
network switch on in the console. If anything changes after that (an AI can edit
all of it), the schedule's runs go ahead without connections, the run says what
changed, the log gets a warning once, and the Schedules page lists the changes
beside an "Approve scripts" button. The check is made again at every connection
request, so an edit while a run waits its turn or is under way is caught too. A
schedule made before this was added needs one approval. The network switch
itself, and mail on the operator's own `--send-mail` flag, are not connections
and are not held; a script a person runs from the web app, the Data API or OData
uses connections like any other network script.

**Backups.** The server backs up every hosted file once a day into
`<folder>/Backups/<date_time>/`, keeping the last 7, while people keep
working (`--backup-every 6h`, `--keep 30`, `--backup-dir`, `--no-backups`). The folder can also be set in the admin console's Backups section: it is checked by writing to it, saved in the folder's settings so a restart keeps it, and used at once unless point-in-time backups or an off-site copy follow the old folder (then after a restart). A `--backup-dir` given at start counts over it. Sets already taken stay where they are.
Each copy is checked before its set is kept.

[Back up a file and restore it](tutorials/backup-and-restore.md) walks through making a file,
checking its backup and recovering its records after deleting the hosted store.

By hand:

<!-- docs-example: illustrative -->
```sh
tabularius backup ~/Databases                          # now
tabularius compact ~/Databases                         # reclaim database and WAL space while serving
tabularius restore ~/Databases 2026-10-11_020000       # stop the server first
tabularius restore ~/Databases 2026-10-11_020000 Contacts   # just one file
```

**Backup verification.** After each backup the server reads the new set back
as a restore would: each copy must match the checksum taken with it, decrypt
when backups are encrypted, and pass SQLite's full integrity check. It then
checks one older set again, the one checked longest ago, so a copy damaged
later on the disk is found while there are good ones to fall back on. The
admin console shows each set as good or damaged (and what is wrong), has a
**Check now** button per set, and the Event log records each check. A
scheduled backup whose set fails counts as failed in `/metrics`. By hand:
`tabularius verify-backup ~/Databases [set]`, which exits 1 when a set is
damaged, or `POST /tabularius/admin/v1/backups/{set}/verify`.

**Point-in-time backups** (FileMaker Server's progressive backups): with
`serve --progressive 5m`, the server also saves each file's changes every 5
minutes into the newest backup set, after a full backup when it starts. Put
a file back as it was at any of those moments, design changes included:

<!-- docs-example: illustrative -->
```sh
tabularius restore ~/Databases --at "2026-10-11 14:05" Contacts
```

You don't need to stop the server. In the admin console, under Backups,
**Restore a file to a moment** puts a file back while everything else keeps
running. It hosts the restored file as a new file next to the current
one, so you can copy what was lost, and leaves the current file alone. Only
if you choose **Replace the file as it is now** does it restore in place,
which disconnects that file's users and opens it again. The same is
`POST /tabularius/admin/v1/restore` with `{database, at, mode: "copy" |
"replace", name}`: with no `mode` it makes a copy, and a `mode` that is
neither is refused with a 400. After an in-place restore the server makes a fresh
backup, so later changes can be restored on top of it.

**Slowest scripts.** The admin console times every script the server runs,
from the Data API, web client, schedules, OData and AI tools. It lists them
slowest first, with runs, average, longest and total time. Open one to see
which steps its time goes to: each step's own time, not counting the
scripts it calls. Counting starts when the server starts, and **Start
counting again** clears it. The same is `GET /tabularius/admin/v1/profile`, and
`DELETE` to reset.

**Slow finds.** Finds are timed too, grouped by table, the fields searched and
the sort, whatever the values. Below the slowest scripts, the console lists
the finds that took 50 ms or more on average. Each one names an index to add
where a stored field has none, with an **Add index** button. Where no index can
help, it says why in plain words: an unstored calculation, or a criterion that
starts with `*`. An index is Tabularius's own SQLite index, and the file's design
doesn't change. The same is `GET /tabularius/admin/v1/profile/finds` and
`POST /tabularius/admin/v1/indexes`. MCP clients and the assistant ([Full
Access]) get `suggest_indexes`.

**Logs.** Like FileMaker Server's Logs folder, the server keeps tab-separated
logs in `<folder>/Logs`, each moved to `<name>-old.log` at 40 MB and started
again:

| Log | What it records | FileMaker Server's |
| --- | --- | --- |
| `Event.log` | start and stop, files opened and closed, backups, schedules, errors | Event.log |
| `Access.log` | sign-ins, sign-outs, timeouts and failed sign-ins, with the address | Access.log |
| `ScriptEvent.log` | schedules, Perform Script on Server and Data API scripts that ended with an error | FMSEScriptErrors.log |
| `fmdapi.log` | every Data API call: method, path, status, error code, time, bytes, account | fmdapi.log |
| `Admin.log` | changes made in the admin console and the Admin API | fac.log |

Passwords never reach a log, and session tokens are cut out of paths. The
admin console's **Logs** section shows one log at a time, newest first, with
filters by type, time and text, and a **Download** link. The same is
`GET /tabularius/admin/v1/logs`, `/logs/{name}?type=&from=&to=&q=&limit=` and
`/logs/{name}/download` (`?old=1` for the older half). With `--workers`,
every process writes to the same files and only the first starts them again.

**Statistics logs.** Two more files in the same folder use FileMaker Server's
own layout (a header line, then tab-separated rows, times in microseconds), so
monitoring set up for a FileMaker Server's Logs folder (Zabbix and Splunk
templates, log viewers) should read them as they are (none of those templates is
in the test suite): `Stats.log` has a line a
minute with the network rates, clients, open files, sessions, calls per second,
calls under way and the time a call takes; `TopCallStats.log` has the slowest
25 calls of each minute, summed by what was asked and who asked, with bytes each
way. Disk read and write rates are the server process's own, read from
`/proc/self/io`, so they are real on Linux and show 0 elsewhere (with
`--workers`, only the process that writes the line). Cache percentages and the
wait and I/O parts of a call's time are not measured and show 0. Live-update streams are left out, and session
tokens are cut from targets. `serve --stats-interval 30s` changes the minute
(`off` stops them; `TABULARIUS_STATS_INTERVAL` does the same). With `--workers`,
`Stats.log` adds every process up and each writes its own top calls.

**Encryption at rest.** Set `TABULARIUS_BACKUP_KEY` to a passphrase and every
published backup file, point-in-time changes included, is encrypted
(AES-256-GCM, key from the passphrase with scrypt), so a copied or off-site
backup is unreadable without it. Point-in-time logs are encrypted as written;
the full SQLite snapshot is plaintext during staging before it is sealed.
Restore needs the same passphrase, and
refuses a wrong one or a damaged file before putting anything back. Keep the
passphrase somewhere other than the backups: without it they can't be
restored.

**What a backup protects against.** An unencrypted set carries SHA-256
checksums, which catch a damaged disk, a cut-short copy or a sync that went
wrong. They do not stop someone who can write the backup folder: that person can
change a copy and write the matching checksum, so an unencrypted set is protected
against accidents only. With `TABULARIUS_BACKUP_KEY` set, a set is also protected
against someone who can write the folder but does not know the passphrase: each
copy is authenticated, and the list of checksums, the finish times, each
container file's checksum, size and modification time, and, for restoring to a
moment, how many logs were saved and a chain over them are signed with the passphrase. A restore, whole-set or to
a moment, refuses a set whose signature does not match, a copy that is swapped,
renamed, or taken from an older set, and, while the passphrase is set, a set with no
signature at all (including a set someone put in the folder), unless you say
`--accept-unsigned-backup`. A set made before signatures existed, or before the
passphrase was set, or signed by an earlier build (whose signature covered less), is such a set: `verify-backup <folder> <set> --sign` reads every
copy back and signs it, but it cannot tell whether the copies were swapped before it
ran, so use it only on a set that has not been out of your hands. A whole older set,
signature and all, is still a valid set, so a restore says which files had changes
after the backup was taken (those changes are not in the restored file) and leaves the
choice to you.

A restore to a moment of a signed set replays only the logs the signature counts, and
refuses the set if one of them was removed, replaced, changed or cut off at a record
boundary, if a log in the old format or one that is not encrypted is among them, or
if the logs were not saved by this backup. A log the signature does not count yet (the
server writes a log before it signs it, so a crash between the two leaves one) is
ignored. Also not covered: a log made before this version carries no binding to its
time or file, file names that the operating system treats as another (reserved names
on Windows), and anyone who has the passphrase and write access to the folder, who can
make a set that restores.

The hosted stores themselves can be encrypted at rest too. Set
`TABULARIUS_ENCRYPTION_KEY` to a passphrase and each store is kept as
`<name>.openhbam.sqlite.enc` on disk (AES-256-GCM, scrypt), decrypted into its
working file only while the server runs and re-encrypted on a clean shutdown,
protecting the stopped store copies. New database backups use this key too unless
`TABULARIUS_BACKUP_KEY` supplies a separate key. Existing backups, external containers,
source files, exports and logs can still contain plaintext; `encrypt` does not seal
these files. Protect the whole data folder and backup disk with operating-system
encryption. `serve` unlocks
them with the key at start; encrypt or decrypt a stopped folder yourself with
`tabularius encrypt <folder>` / `tabularius decrypt <folder>` (same key in the
environment). The key is never written to the folder.

The store key alone does not encrypt backups. Scheduled and point-in-time
backups use `TABULARIUS_BACKUP_KEY`, and their SQLite snapshot is temporarily
plaintext while it is being sealed. Restoring a stopped encrypted store from a
point-in-time set also leaves a plaintext working file beside the older `.enc`
file. This combination does not yet provide encrypted backups and a safe
encrypted-store restore end to end; see
[the encryption and point-in-time backup research](research/encryption-pitr.md).
<!-- known-difference: Server operation ;; Encryption at rest is not safely combined with point-in-time backups ;; The store key alone leaves backup sets plaintext, backup staging has a plaintext snapshot, and restore can leave a plaintext store beside an older encrypted file ;; A streaming encrypted snapshot and an atomic encrypted-store restore design -->

<!-- docs-example: illustrative -->
```sh
export TABULARIUS_ENCRYPTION_KEY='a long passphrase'
tabularius encrypt ~/FileMakerFiles      # turn the hosted stores into .enc (server stopped)
tabularius serve ~/FileMakerFiles        # unlocks them, re-encrypts on Ctrl-C
```

This guards data at rest. While the server runs, the working file is plaintext
(node:sqlite has no page-level encryption, FileMaker's EAR aside), and a hard
crash can leave that working file behind until the next clean shutdown, so also
keep the hosted folder on an encrypted disk (FileVault on macOS, BitLocker on
Windows, LUKS on Linux) for defence in depth.

**Off-site backups.** Copy the backups folder to any S3-compatible storage
(the tests use a fake S3 server; real services are expected to work and are not tested) after each backup
and every few minutes for point-in-time changes. Sets pruned locally are
removed there too, and with `TABULARIUS_BACKUP_KEY` set only encrypted files
leave the machine:

<!-- docs-example: illustrative -->
```sh
export TABULARIUS_S3_ACCESS_KEY=... TABULARIUS_S3_SECRET_KEY=...
tabularius serve ~/Databases --backup-s3 s3://my-bucket/office --s3-endpoint https://<account>.r2.cloudflarestorage.com
tabularius restore ~/Databases --at "2026-10-11 14:05" --from s3://my-bucket/office   # on any machine
```

Off-site, a set is removed only when the backup retention (`--keep`) removed it here. A backup folder that is emptied, not mounted or moved never deletes what is already off-site; sets you delete by hand stay in the bucket until you remove them there.

**A standby server**: a second machine keeps copies of every hosted file, a
second or so behind, ready to take over if the main one fails:

<!-- docs-example: illustrative -->
```sh
tabularius serve ~/Databases --host 0.0.0.0 --https local --replication-token "$TOKEN"     # main
tabularius standby ~/Standby --primary https://main:8080 --token "$TOKEN"     # standby
```

The standby copies each file once, then applies its changes as they happen
(it carries on after either side restarts). To take over, stop the standby
and run `tabularius serve ~/Standby`. The admin console shows which standbys
are following and how far behind they are. [What a standby promises, what a takeover
gives you and what it does not copy](standby-guarantees.md). Over the internet, give the main
server a certificate (`--tls-cert`/`--tls-key`); for a self-signed one, start
the standby with `NODE_EXTRA_CA_CERTS=cert.pem`. The model is single-writer: one primary takes writes and asynchronously
replicates its files to a standby, which requires manual promotion with no automatic failover or fencing, so it may lack the
last seconds of acknowledged writes ([what clients see after a takeover](standby-guarantees.md#what-a-client-sees-after-a-takeover)).

**SQL for reports and BI tools** (FileMaker's ODBC/JDBC). Grant the
`fmxdbc` extended privilege (`tabularius privileges <folder> <db> grant
<set> fmxdbc`), then query with FileMaker SQL, as in ExecuteSQL, by table
occurrence name:

```sh
curl -u Ann:secret "http://server:8080/tabularius/sql/v1/databases/Contacts?format=csv&q=SELECT+*+FROM+People"
```

`POST` the same URL with `{"sql": "...", "params": [...]}` for JSON, and
`GET .../tables` lists the tables and columns. Spreadsheets can load the
CSV URL directly (Excel's Data > From Web, with Basic sign-in). Only SELECT
runs, and only for accounts that can view every record and field.

**PostgreSQL connections** for tools that speak to databases rather than
URLs (Power BI, Tableau, Metabase, Excel through the PostgreSQL ODBC driver,
JDBC, psql; the tests drive the protocol directly and with asyncpg, and those
tools are not in the suite): start the server with `--sql-port 5432`, then connect with the
file's name as the database and an account with `fmxdbc`:

```sh
psql "host=server port=5432 dbname=Contacts user=Ann sslmode=require"
```

Queries are the same FileMaker SQL, read-only unless the server also has
`--sql-writes`, which lets the connection run `INSERT`, `UPDATE` and `DELETE`
in a narrow grammar through the same record rules as the Data API (off by
default; see [docs/pgwire-writes.md](pgwire-writes.md)). Tools that browse a database
see each table occurrence as a table in the `public` schema, with its fields
as columns: psql's `\dt` and `\d`, `information_schema`, and the
`pg_catalog` queries JDBC and ODBC drivers send for their table and column
lists. Drivers that read values in PostgreSQL's binary format (asyncpg,
Npgsql, psycopg's binary cursors) work too; a parameter's type comes from
the driver or a cast such as `$1::numeric`, and is text otherwise.
Calculated columns with no field behind them come back as text.
Each query may return at most **100,000 rows** by default, including prepared queries
and suspended portals (`TABULARIUS_PGWIRE_MAX_ROWS` sets a different
whole-number cap, 0 for no cap; invalid or negative values use the default).
Larger results fail before any rows are sent, with
SQLSTATE `54000`: `SQL results are limited to 100000 rows; use LIMIT and page through the result with a stable ORDER BY`
(the message uses the configured cap).
An Execute message's row count only controls delivery; use SQL `LIMIT` to
bound each query. See the [memory measurements](pgwire-results.md).
There are no indexes or keys to show. The password is sent as typed,
so connections from other machines must use TLS (the server's certificate,
from `--https` or `--tls-cert`); `sslmode=require` asks for it.

**OData for Excel and Power BI**, as on FileMaker Server. Grant the
`fmodata` extended privilege, then point an OData feed at
`https://server/fmi/odata/v4/<file>` (Excel: Data > Get Data > From OData
Feed; Power BI: Get Data > OData feed) and sign in with Basic. Each table
occurrence is an entity set, keyed by `ROWID`:

```sh
curl -u Ann:secret "https://server/fmi/odata/v4/Contacts/People?\$filter=City%20eq%20'Oslo'&\$select=Name,City&\$orderby=Name&\$top=50"
```

`$filter` (comparisons, `and`/`or`/`not`, `contains`, `startswith`, date
parts and more), `$search` (words and "phrases" in any text field, with
`AND`, `OR` and `NOT`), `$select`, `$orderby`, `$top`, `$skip` and `$count` work,
and long lists come 1,000 records a page with `@odata.nextLink`. `POST` to
the entity set creates a record; `PATCH` and `DELETE` on `People(12)`
change and delete one, with `If-Match` on the ETag so nobody's save is
lost. `PATCH People(12)/Photo` with a file as the body puts it in a container
field (or send it as base64 in the record's JSON), and `DELETE` empties it. `POST .../Contacts/Script.Name` with `{"scriptParameterValue": "..."}`
runs a script. Each relationship gives the occurrences at both ends a
navigation property to the other, so `People?$expand=Orders` puts each
person's related orders inline (with `Orders($filter=Total gt 50;$orderby=Total desc;$top=5)`
for fewer) and `People(12)/Orders` lists them (`People(12)/Orders/$count` counts
them, `People(12)/Orders(40)` reads one); a collection of more than 1,000
related records for one record is refused with a 400 unless `$top` (at most
1,000) and `$skip` page it, and a page with very many ends early with its next link. A
relationship is offered only when the account can read its match fields. Unlike SQL, OData follows record and field access, so any
privilege set can use it, related records included. `POST .../Contacts/$batch`
sends several requests in one (multipart/mixed or JSON); a change set in it
is kept all or nothing. `$apply` gives groups and totals without reading
every record: `People?$apply=filter(Age ge 18)/groupby((City),aggregate(Age with average as MeanAge,$count as N))`.
`$crossjoin(Customers,Orders)?$filter=Customers/ID eq Orders/CustomerID` pairs
records across sets, each read as the account sees it.
[Full Access] can change the schema the way FileMaker Server's OData does:
`POST .../Contacts/FileMaker_Tables` with `{"tableName": "Visits",
"fields": [{"name": "Code", "type": "VARCHAR(10)", "primary": true}]}`
makes a table, `PATCH .../FileMaker_Tables/Visits` adds fields, `DELETE`
removes a table or field, and `FileMaker_Indexes` adds and removes indexes.

**Legacy XML (Custom Web Publishing), reads only.** Scripts and pages written
against FileMaker Server's `/fmi/xml` can keep reading. Grant the `fmxml`
extended privilege, then ask with HTTP Basic:

```sh
curl -u Ann:secret "https://server/fmi/xml/fmresultset.xml?-db=Contacts&-lay=People&City=Oslo&City.op=eq&-sortfield.1=Name&-max=20&-find"
```

The document name is the grammar: `fmresultset.xml`, `FMPXMLRESULT.xml`, or
`FMPXMLLAYOUT.xml` for `-view`. `-dbnames`, `-layoutnames`, `-scriptnames`,
`-find`, `-findall`, `-findany`, `-findquery` and `-view` work, with `-skip`,
`-max`, `-sortfield.N`/`-sortorder.N`, `-lop`, `-recid`, `-lay.response`, and
`field=value` with `field.op` (`eq`, `cn`, `bw` (the default), `ew`, `gt`, `gte`,
`lt`, `lte`, `neq`). Records follow the account's record and field access, and
portals come as related sets. Nothing writes and nothing runs: `-new`, `-edit`,
`-delete` and `-dup` answer error 3, and a `-script` parameter error 960.

**How many people?** `node scripts/loadtest.ts <file.fmp12> --users 50` hosts
a copy of a file and has 50 simulated people browse, open, find and edit
records nonstop, each with live updates on, then reports response times.
When this was measured, on one CPU core, 50 such users on a real solution got answers in about
20 ms (2,200 requests a second); with a table padded to 100,000 records
(`--records 100000`), about 35 ms (1,270 a second): finds on text use a
word index. Those figures are from one development machine and the tests don't
repeat them; run the command on yours. Real people pause between
clicks, so a server handles many more of them than that.

**How fast on a big file?** `npm run bench` makes a synthetic file of 200,000
invoices and times opening it, finds, sorts, summary fields and ExecuteSQL;
[docs/performance.md](performance.md) has the baseline and what it shows.

Add `--hot 3` to send every edit to the same three records, so people keep
running into each other, and check what matters under that: Data API
clients that don't lock add 1 to a number field with the record's `modId`
and retry when someone else saved first, and no increment may be lost;
every live-update stream must hear about every save; and no record may stay
locked after everyone signs out. CI runs this with 16 people, on one
process and on two (`--workers 2`, below).

**Does it hold up over time?** `node scripts/soak.ts <file.fmp12> --minutes 60`
has people come and go in waves for an hour: web client users with live
updates on, Data API clients, and people who drop mid-edit, leaving a lock
and a stream behind. After each wave the server reports its memory and
what it still holds. The checks: no sessions, record locks or live streams
are left once everyone is gone, and memory and open timers and sockets
level off rather than keep growing. Give `--script NAME` to run a script
too. One 15-minute run with 30 people (142,000 requests on Charts, on a development machine) left
nothing behind, and the server's memory settled at about 23 MB; the tests don't repeat it. CI runs a
short one when started by hand from the Actions tab. Data API clients that sign in and never sign out are cleared
15 minutes after their last request, as on FileMaker Server.

**Using every core.** Node runs a server's JavaScript on one CPU core.
`tabularius serve <folder> --workers auto` runs one process per core (or
`--workers 4`) behind the one port. People's sessions stay on the process
they signed in to. Record locks and live updates work across processes, and
so do closing, pausing and opening files. The admin console lists everyone,
and messages and disconnects them, whichever process they're on. Schedules,
backups, webhooks, the PostgreSQL port and the folder watcher run in one
process. HTTPS works too, automatic certificates included: the front process
gets and renews the certificate. So does encryption at rest: the first
process unlocks the files and locks them again once the others have let
go. Not yet combined with point-in-time backups or standbys. The admin <!-- known-difference: Server operation ;; Encryption at rest across several worker processes is not yet combined with point-in-time backups or standbys ;; The combination is not offered ;; An owner decision -->
console's slowest scripts and finds, and the metrics' request counts and
durations, add up every process's, as of a few seconds ago; the memory, CPU
and event-loop metrics are the first process's.
A process that stops is started again after a second; if it keeps stopping, or a start fails, the wait doubles each time (up to 30 seconds) and the start is tried again until it works, and a process that stays up for a minute starts the wait over.
