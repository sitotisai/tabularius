# Hosting files and connecting to them

How to host a folder of files from a checkout, sign in, give each account its privileges, connect an AI app and call the Data API. For the install-and-run path start with the [quickstart](../QUICKSTART.md).

Host a folder of files:

<!-- docs-example: illustrative -->
```sh
npm run tabularius -- serve ~/FileMakerFiles --port 8080
echo 'new-password' | npm run tabularius -- passwd ~/FileMakerFiles Contacts Admin

curl -X POST -u Admin:new-password http://127.0.0.1:8080/fmi/data/vLatest/databases/Contacts/sessions
```

Then open http://127.0.0.1:8080/ in a browser, type the file's name in the **File name** box (the page offers a list to pick from only on a server started with `--list-files-publicly`) and log in with
that account to use the web client.

To call the Data API from your own code, follow
[Add a Data API client in 10 minutes](tutorials/data-api-client.md).

To compare stored calculations with recomputed results, run
`npm run tabularius -- fidelity ~/FileMakerFiles Contacts`. It reports counts
and differences without showing values, changing data or running scripts;
`--sql` limits it to calculations using ExecuteSQL, `--n` sets the per-field
sample limit (200 by default), and `--json` prints JSON.

Imported FileMaker accounts keep their names. An account whose FileMaker
password is empty (like many files' Admin) signs in with that empty password,
but only from the server's own computer; start the server with
`--allow-blank-passwords` to let other computers in too, and the server lists
such accounts when it starts. Other accounts need a new password set with
`tabularius passwd`: we can't check FileMaker's non-empty passwords yet.

Accounts keep their privilege sets, and every way in enforces them: records
an account can't view are left out of found sets, fields it can't see are
omitted, and writes it isn't allowed fail with FileMaker's errors (200, 201).
Each set's overall access comes over from the file, and so do its
exporting, password-change and idle-disconnect options and its printing
option (which stops the Print and Save Records as PDF steps; a browser can
always print the page it shows). Of FileMaker's **Custom privileges**,
per-table and per-field record access come over failing closed: a table the
set doesn't list gets no access, and in a table whose fields the set
customises, a field the file doesn't mark read/write is hidden until you
grant it. Per-layout, per-value-list and per-script access don't yet (they
come over at the set's overall level, or with no access where the file
stores them in a form no sample shows), the menu command option comes over
as All, and record access limited by a calculation isn't read from the file
yet: no sample file has one, and a record-access value no sample shows comes
over as view only at most. Review your own sets in Manage Security before people
sign in.
As on FileMaker Server, the Data API needs the `fmrest` extended privilege; the
web client needs `fmapp` or `fmwebdirect`; AI clients signed in with an
account need `fmmcp` (new; `[Full Access]` has it). A file's own `[Full Access]`
often lacks them (in the sample files Charts has neither `fmapp` nor `fmrest`,
and Flicks has `fmapp` only), so when a file is first opened here its
`[Full Access]` gets `fmapp` and `fmrest`, and the file's administrator can sign
in straight away.
Grant or revoke them, and set up other sets, with:

<!-- docs-example: illustrative -->
```sh
npm run tabularius -- privileges ~/FileMakerFiles Contacts                 # accounts and sets
npm run tabularius -- privileges ~/FileMakerFiles Contacts grant "[Full Access]" fmrest
npm run tabularius -- privileges ~/FileMakerFiles Contacts show "[Data Entry Only]" > set.json
npm run tabularius -- privileges ~/FileMakerFiles Contacts save set.json  # custom sets, per table/field/layout/script
npm run tabularius -- privileges ~/FileMakerFiles Contacts account Clerk "Data Entry Only"
npm run tabularius -- privileges ~/FileMakerFiles Contacts policy 12 90  # minimum length; maximum age in days
npm run tabularius -- privileges ~/FileMakerFiles Contacts must-change Clerk
```

`account` assigns an account to a privilege set. `policy` with no numbers shows
the current minimum password length and maximum age; give a minimum length,
optionally followed by a maximum age in days, to set them, and use `0` to turn
a limit off. Until a file sets its own minimum, a new password needs at least 12
characters (as does the admin console's); `TABULARIUS_MIN_PASSWORD_LENGTH` sets
another default (`0` for none), and `policy 0` gives one file no minimum. `must-change` requires
the account to change its password at next sign-in; add `off` to clear that
requirement.

A custom set can limit records with a calculation, as FileMaker's "limited"
privileges do: `"tables": {"Invoices": {"view": "Owner = Get ( AccountName )",
"edit": "Status ≠ \"Paid\"", "create": true, "delete": false, "fields":
{"Cost": "none"}}}`. Scripts run within the account's privileges too: they find
only records it can view and change only what it may edit. A script set to "Run
script with full access privileges" in the file runs with full access, as in
FileMaker; its subscripts follow their own setting.

Or do all of this in the browser: the web client's **Manage Security** button
(full access only, like FileMaker's Manage Security) opens an area to add and
edit accounts, build privilege sets (record access per table with record-level
calculations, field, layout, value-list and script access, and extended
privileges), mint and revoke API tokens, and turn two-factor on or off — its
own area, next to Design.
With the AI assistant on, its **Ask AI** panel reviews the file's security
(accounts with no password, sets more open than they need to be, who can use
AI or the Data API) and **Explain with AI** on an account or privilege set says
what it allows. The assistant reads accounts and privilege sets with the
`get_security` tool ([Full Access] only; never passwords or token secrets) and
can't change them.

People can also sign in through an identity provider (any OpenID Connect
provider; the tests use a stand-in one and cover the verified-email rule, Apple's
signed client secret and Entra ID's tenant rules, but no named service is run live), as with
FileMaker's external accounts. Register Tabularius with the provider (redirect
URI `https://your.server/tabularius/auth/v1/oidc/callback`), then:

<!-- docs-example: illustrative -->
```sh
TABULARIUS_OIDC_CLIENT_SECRET=... npm run tabularius -- serve ~/FileMakerFiles \
  --public-url https://your.server --oidc-issuer https://login.example.com --oidc-client-id tabularius --oidc-name Microsoft
npm run tabularius -- privileges ~/FileMakerFiles Contacts external "Sales" "Data Entry"
npm run tabularius -- privileges ~/FileMakerFiles Contacts external pat@example.com "[Full Access]"
```

The web client then shows "Sign in with Microsoft". Someone the provider
vouches for gets the privilege set of the external account named their
(verified) email address, else of the first of their groups that has one. The
file's own external accounts count too. Groups come from the ID token's
`groups` claim (`--oidc-groups-claim` to change it); Entra ID sends group ids
there unless set to send names. Tabularius also accepts a configured top-level
claim such as `roles` or `wids`, an exact namespaced claim, or a dot path such
as `realm_access.roles`. An Entra group-overage marker refuses sign-in until
the provider sends a complete group list.

An email matches an account (its own, or one named for its domain, such as
`@example.com`) only when it can be trusted: the provider says it verified it
(Google and Apple do), or the issuer is one organisation's Entra ID tenant
(`https://login.microsoftonline.com/<tenant id>/v2.0`) and the person is one
of its members rather than a guest (a guest's address needs Entra's `xms_edov`
optional claim). For a company's own
provider that hands out only addresses it owns but doesn't say so,
`--oidc-trust-email` (or `"trustEmail": true` in `--oidc-config`) trusts its
emails too. Never use it with a provider where people can type any address.
Groups match either way, except a group with a `@` in its name, which never
matches (it could stand for an address).

Data API apps can sign people in through the same providers, the way
FileMaker Server's Data API guide describes ("Log in to a database session
using an OAuth identity provider"): `GET /fmws/oauthproviderinfo` lists the
providers, `GET /oauth/getoauthurl?trackingID=...&provider=...` with an
`X-FMS-Return-URL` header answers the provider's address to open and an
`X-FMS-Request-ID`, the person is sent back to the app's address with
`?trackingID=...&identifier=...`, and `POST .../sessions` with
`X-FM-Data-OAuth-Request-Id` and `X-FM-Data-OAuth-Identifier` logs in. The
identifier works once, within five minutes, and the person always picks
their account at the provider. People are sent back only to this server's
own address or to an app listed with `--oidc-data-api-return-urls
https://app.example.com,https://other.example.com/signed-in` (or
`"dataApiReturnUrls"` in `--oidc-config`), so a link someone else started
can't send them an identifier. An app on the person's own computer is listed
with its port (`http://127.0.0.1:5000`); it isn't allowed by default, since on
a shared machine such as a terminal server anyone could listen there.

An LDAP directory or Active Directory works the same way, for sites that
authenticate against one (tested against a stand-in directory that speaks the
protocol, not yet a live Active Directory <!-- known-difference: Privileges and security ;; LDAP sign-in is tested against a stand-in directory, not a live Active Directory ;; A directory with matching rules the stand-in lacks may behave differently ;; A run against a live directory -->). People type their directory username and password
into the ordinary sign-in; the server binds to the directory with them, and an
external account named their email or one of their groups gives the privilege
set. Active Directory's usual shape is a service account that searches for the
person, then a rebind as them to check the password:

<!-- docs-example: illustrative -->
```sh
TABULARIUS_LDAP_SEARCH_PASSWORD=... npm run tabularius -- serve ~/FileMakerFiles \
  --ldap-url ldaps://dc.example.com --ldap-base-dn "dc=example,dc=com" \
  --ldap-user-attribute sAMAccountName --ldap-search-dn "cn=svc,cn=users,dc=example,dc=com"
npm run tabularius -- privileges ~/FileMakerFiles Contacts external "Sales" "Data Entry"
```

A plain LDAP server that lets people bind straight as a predictable DN needs no
service account — give `--ldap-bind-dn-template "uid={user},ou=people,dc=example,dc=com"`
instead of the base DN. Groups are read from `memberOf` (`--ldap-group-attribute`
to change it) and matched by their common name, so an external account named
"Sales" matches `CN=Sales,…`. Use `ldaps://` wherever the directory is not on a
trusted network, since a plain bind sends the password.

For integrations, mint a scoped API token instead of embedding a password. A
token acts as one account (so it carries that account's privilege set), is used
as a Bearer token on the Data API and SQL endpoints, and can be revoked on its
own. `--read-only` makes it refuse every write and script. A token stops
working after 90 days unless `--expires-days N` (up to 3650) says otherwise; every
token expires, and `TABULARIUS_TOKEN_DEFAULT_DAYS` changes the default. The name after `create` is the account the token acts as; `--label` is the name shown in the list.

<!-- docs-example: illustrative -->
```sh
npm run tabularius -- token ~/FileMakerFiles Contacts create Admin --label Reporting --read-only --expires-days 90
# ohbt_… (shown once; store it now)
curl -H "Authorization: Bearer ohbt_…" http://127.0.0.1:8080/fmi/data/vLatest/databases/Contacts/layouts
npm run tabularius -- token ~/FileMakerFiles Contacts list
npm run tabularius -- token ~/FileMakerFiles Contacts revoke <id>
```

For a second factor, turn on two-factor sign-in for an account. It then needs a
six-digit code from an authenticator app (Google Authenticator, 1Password, Authy
— anything that reads a standard `otpauth://` QR code) on top of its password,
in the web client and on the Data API `sessions` login (in a `X-Tabularius-OTP`
header). Scoped API tokens are the credential for unattended integrations, so
they aren't subject to it; identity-provider sign-in leaves the second factor to
the provider.

<!-- docs-example: illustrative -->
```sh
npm run tabularius -- totp ~/FileMakerFiles Contacts enroll Admin   # prints the secret and otpauth:// URI
npm run tabularius -- totp ~/FileMakerFiles Contacts confirm Admin 123456
npm run tabularius -- totp ~/FileMakerFiles Contacts status
npm run tabularius -- totp ~/FileMakerFiles Contacts disable Admin
```

`status` lists accounts with two-factor sign-in enabled, or says that none
have it enabled.

The admin console's Security health page starts with **Risky setups**, a
privilege audit in plain English, worst first. It flags full-access accounts with
no password or only a password, guest access, extended privileges (Data API,
OData, ODBC, ...) switched on for sets whose accounts haven't signed in lately,
record-level limits that are true for every record ("1 = 1"), and unstored
calculations a limited set can see that total records it can't view. Each one
comes with what to change in Manage Security. It changes nothing, and it never
shows passwords or record values. MCP clients and the assistant (in Manage
Security) get the same review as `review_privileges`, for [Full Access] only.

After five wrong passwords in 15 minutes from one address, that address can't
sign in to the account for 15 minutes (Data API, web client and AI alike);
other addresses still can, so a stranger guessing can't lock the real user out.

Container fields read as signed download URLs that expire (an hour by default;
`TABULARIUS_CONTAINER_TTL` seconds may shorten it, never lengthen it past an hour), so a link that leaks
into a browser history or a proxy log stops working. A link made for a signed-in account is tied to that account's entry in the file (the mapping account, for a directory or identity-provider sign-in) and stops working while the account is blocked or removed, even if someone later makes a new account with the same name (other accounts' links are not affected; a sign-in with no entry of its own gets links that simply expire); anyone holding a live link can still fetch that one file until it expires, so keep the expiry short on files that matter. Uploads stream to a temp
file as they arrive rather than sitting whole in memory, so a large file (or
several at once) costs disk, not a half-gig of heap per request, and the size
cap is enforced byte-by-byte (`TABULARIUS_UPLOAD_TMP` picks the scratch folder).

Container URLs answer range requests, so videos and audio play and seek in
the browser and big downloads resume; files over a megabyte are stored in
1 MB pieces, so a range reads only the pieces it covers. A file that has not
changed is not sent again (`ETag` and `Last-Modified`, the latter not for a file stored before the time was kept, with `If-None-Match`,
`If-Modified-Since`, `If-Match`, `If-Unmodified-Since` and `If-Range`), and a
request for one range past the end of the file is answered 416. Several ranges
in one request are not served as multipart: the whole file is sent, as RFC 9110
lets a server do with a Range it will not serve. A file put in a container is read from the request and
written to the database in 1 MB pieces, so a file of hundreds of megabytes
costs disk, not memory. The web client sends a file of 8 MB or more in pieces
of its own (below): a dropped connection picks up where it stopped, with a
progress bar and Cancel. A container converted from a FileMaker file keeps
each file whole, as FileMaker stored it, so a range of it still reads that
whole file from the database; putting the file in again stores it in pieces. Add `&thumb=256`
to a container URL for a thumbnail that fits 256 by 256 pixels. PNG, GIF
and JPEG thumbnails are made by Tabularius itself, with JPEGs read at an
eighth of their size, which is fast even for big photos, and turned upright
by their EXIF orientation. PDFs and other formats need `pdftoppm` (Poppler;
in the Docker image) or, on a Mac, the built-in `sips`. Thumbnails are kept
in memory, and `TABULARIUS_THUMBNAILS=builtin` turns the outside tools off.

Every record created, changed or deleted is logged with the account and time,
with no setup: edits keep each field's old and new value, deletes keep what the
record held, a duplicate says which record it copied, and every entry says where
it came from (`web` client, `rest` Data API, `odata`, `mcp`, `admin`, an
`automation`, ...) and the script that made it. Container contents are never
logged, only the name, size and a SHA-256 hash. Reads are not logged unless an
administrator sets `logReads` (below). An administrator can name fields
whose values are never logged (the entry shows `‹not logged›`), or turn that on
for every field named like a password, secret, token, API key or card number,
with `PUT /tabularius/admin/v1/audit/settings?database=`
(`{"excludeFields": {"Table": ["Field"]}, "redactSensitive": true, "logReads": true}`; `GET` also
lists the fields it would suggest). Values that are not logged cannot be put
back by Undo or a revert, so this is off until chosen. The log is append-only
and tamper-evident: each entry is linked to the one before it by a SHA-256 hash,
and `GET /tabularius/admin/v1/audit/verify?database=` finds an entry that was
edited, removed, added behind its back or cut off the end. `retentionDays` in
the same settings removes record entries older than that, hourly (400 days
unless set; 0 keeps every entry), and the chain records where it now starts and
the removal is logged as a security event. Security events (sign-ins, lockouts,
account and privilege changes) are not removed.
Read it with `npm run tabularius -- audit ~/FileMakerFiles Contacts --table
Invoices --record 42`, the `audit_log` AI tool, or `GET
/tabularius/design/v1/databases/{db}/audit`; the last two need [Full Access].

For desktop AI apps, the MCP connection runs over stdio with
`npm run tabularius -- mcp ~/FileMakerFiles`. Add `--account "AI Helper"` to use
that account (its password comes from `TABULARIUS_PASSWORD`); without an account
it acts as the server administrator. `--ai-exclude A,B` keeps the named files
from the AI connection.

Use it from Claude Desktop (or any MCP client) by adding to its MCP config:

```json
{ "mcpServers": { "tabularius": {
    "command": "node",
    "args": ["/path/to/tabularius/packages/cli/src/main.ts", "mcp", "/path/to/FileMakerFiles"]
} } }
```

Add `"--account", "AI Helper"` to the args (and `"env": {"TABULARIUS_PASSWORD":
"..."}`) to have the AI work within that account's privilege set; without one
it acts as the server administrator.

Or connect over HTTP at `http://127.0.0.1:8080/mcp`, which answers no one
without a credential, programs on this computer included. With HTTP Basic auth
(an account and password) the AI gets that account's privileges. The
administrator's way in is a bearer token: the one in `--mcp-token`, or else the
one the server made on first start and keeps in `.openhbam-mcp-token` in the
hosted folder, readable only by the account that runs the server. Print it with
`tabularius mcp-token <folder>` and give it to the app as
`Authorization: Bearer <token>`. Delete the file and restart to make a new one. A cluster or a standby pair should be given the same `--mcp-token`, so every
process, and a server that takes over, accepts the same token.
Prefer a token made for one account in the admin console (**Connect an AI app**)
over handing an app the administrator's.
Every tool, with its parameters, permissions and an example, is in
[docs/reference/mcp.md](reference/mcp.md); every REST route in
[docs/reference/rest.md](reference/rest.md).

The easiest way to connect an AI app is the admin console's **Connect an AI app**
section (guide at `/docs/connect-ai`, from [docs/connect-ai.md](connect-ai.md)):
pick a file, then a new AI agent account (never `[Full Access]`, its changes
optionally held for a person to approve) or an existing account, and any limits
(read-only, only some layouts, a lifetime; 90 days unless you pick another). It makes one of the file's API tokens
for AI apps only (shown once; only its hash is kept) with the settings to paste
into Claude Code, Claude Desktop or any other MCP client, and checks it works.
A limited token sees no design and gets no SQL or free-form calculations. MCP
clients also get resources (`tabularius://FILE/schema`, `overview`,
`conversion-guide`) and prompts such as `after_converting`, `clean_up_data`,
`what_would_break`, `suggest_rules` and `make_dashboard`. Older admin console
tokens (`ohm_`) keep working until revoked.

## Connect Claude Code

Control a hosted solution from a Claude Code session. In the admin console's
**Connect an AI app**, pick the file and make a token (read-only, limited to
some layouts, or for a shorter or longer time than the 90 days it gets), then run:

```
claude mcp add --transport http tabularius http://SERVER:8080/mcp --header "Authorization: Bearer ohbt_…"
```

Claude Code then finds, reads and edits records, lists layouts and schema and
runs scripts as that account, within its privileges. The Tabularius plugin
(`/plugin marketplace add sitotisai/tabularius`, then
`/plugin install tabularius@tabularius`) makes the connection and adds a skill
that teaches Claude Code the safe way to use the tools. Details, Claude Desktop and
claude.ai connector steps: [docs/connect-ai.md](connect-ai.md).

As a library:

```ts
import { FmpDatabase } from '@tabularius/fmp12';

const db = FmpDatabase.open('Contacts.fmp12');
console.log(db.schema.tables.map((t) => t.name));
for (const row of db.records('Contacts')) console.log(row.recordId, row.fields);
```
