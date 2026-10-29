# What the service files contain, and why

`tabularius service install` writes one file for the system's own service manager; `tabularius service print <folder>` shows it without installing. This page says what each setting in those files is for, so you can judge a change before making it. Tests check every file against a strict reader for its format (`packages/cli/test/service-validators.ts`), compare it with a saved copy (`packages/cli/test/golden/service/`), and check that the arguments, the working folder and the writable folders read back as given, even for a folder called `My Data/$HOME/100%` or `Bob's`.

What is **not** checked: that macOS or Windows accepts the file when it loads it. The files have static and simulated tests; the launchd and Task Scheduler files have been read against Apple's and Microsoft's published formats, not loaded on those systems. Run `tabularius service install` once on each system you rely on and look at the result.

## systemd (Linux)

| Setting | Why |
| --- | --- |
| `ExecStart` | Node, the program, and `serve` with your options, each argument quoted. `%` and `$` are doubled, because systemd would otherwise replace `%h` or `$HOME` inside a folder name. |
| `WorkingDirectory` | The folder it hosts. |
| `Restart=on-failure`, `RestartSec=5`, `RestartSteps=5`, `RestartMaxDelaySec=60` | Starts again after a crash, waiting longer each time up to a minute. The two `Restart…` steps need systemd 254 or later; older versions ignore them and wait five seconds every time. |
| `TimeoutStopSec=60` | Saving and backing up on stop: twice the 30 seconds the service waits for the server to stop (`TABULARIUS_STOP_GRACE_MS`), so systemd never ends it first. |
| `UMask=0077` | Files the server makes (hosted files, backups, logs) can be read only by its account. Remove the line if another account must read them. |
| `LimitNOFILE=65536` | The default allows 1024 open files and connections; see [the runbook](runbook.md). |
| `NoNewPrivileges`, `PrivateTmp` | A process it starts cannot gain privileges; it has its own temporary folder. |
| `ProtectSystem=full`, `ReadWritePaths=-…` | `/usr`, `/boot` and `/etc` are read-only to it. The hosted folder, `~/.openhbam` and the folder that holds the program stay writable even if they sit under those. A `-` means "if it exists". `ProtectHome` is **not** set: options such as `--backup-dir` or `--tls-cert` can name files anywhere in a home folder, and the unit cannot know them all. |
| `ProtectKernelTunables`, `ProtectControlGroups`, `RestrictSUIDSGID`, `RestrictRealtime`, `LockPersonality` | It has no use for these; refusing them removes things an attacker who got into the process could use. |
| `User=`, `AmbientCapabilities=CAP_NET_BIND_SERVICE` (system unit) | Runs as you, not root, and may still listen on ports 80 and 443. |
| `WantedBy=` | `multi-user.target` for the boot service, `default.target` for the user service. |

Left out on purpose:

- `MemoryDenyWriteExecute`: Node's JavaScript engine writes machine code and runs it; the setting would stop the server starting.
- `MemoryMax`, `TasksMax`: no figure is safe for every folder (a large file needs memory in proportion to its size). Add one yourself with `systemctl edit openhbam` if the machine is shared.
- `RestrictAddressFamilies`, `SystemCallFilter`: Node lists the machine's network addresses (netlink) and a filter that is too narrow fails in ways that are hard to trace; this has not been tried on every system.

## launchd (macOS)

| Key | Why |
| --- | --- |
| `ProgramArguments`, `WorkingDirectory` | As above. |
| `RunAtLoad`, `KeepAlive` | Starts when loaded and again after any exit. |
| `ThrottleInterval` 10 | Waits ten seconds between starts, so a server that fails at once does not spin (this is launchd's own default, written down). |
| `ExitTimeOut` 40 | launchd ends the server this long after asking it to stop: the 30 seconds a macOS system-service restart or upgrade waits for the server to stop, plus ten. |
| `Umask` 63 | Decimal for octal 077: files it makes are for its own account. |
| `SoftResourceLimits` `NumberOfFiles` 4096 | A launchd job starts with 256 open files. Not run on a Mac here. |
| `UserName` (system only) | A LaunchDaemon runs as you, not root. |
| `StandardOutPath`, `StandardErrorPath` | The console log in `~/.openhbam/logs/server.log`. |

## Windows Task Scheduler

| Setting | Why |
| --- | --- |
| `LogonTrigger` or `BootTrigger` | At sign-in, or at boot as the system account (`--system`, from an administrator prompt). `--system` is refused unless Node and the program can only be changed by administrators, and the task file is kept where only they can change it: see below. |
| `LogonType` `InteractiveToken`, `RunLevel` `LeastPrivilege` | Runs as you with no stored password and no elevation. |
| `RestartOnFailure` 1 minute, 255 times | Starts again a minute after it stops unexpectedly. Microsoft's schema allows 1 to 255 for the count (an earlier version of this file said 999, which the schema does not allow). |
| `ExecutionTimeLimit` `PT0S`, `MultipleInstancesPolicy` `IgnoreNew` | A server runs for good, and never twice. |

### `--system` and who can change the code it runs

The boot task runs as the system account (`S-1-5-18`). Anything that account starts runs with more privilege than any ordinary account has, so `service install --system` on Windows first reads the access lists of what the task will run and refuses unless only administrators, the system and the Windows installer's own account (TrustedInstaller) can change it:

- Node: the file, every file directly in its folder (the libraries it loads), and `node.exe.local` with everything in it if there is one;
- the whole program folder, every file and folder in it; a link inside it that points outside is followed and checked too;
- the folder the program folder is in: nobody else may add to it either, and no entry in it that passes down to new folders may give others a writing right (a new folder made there picks it up). The boot entry renames `app.previous` back into place when `app` is missing, and an upgrade stages in `app.incoming`, so a new folder there is code that runs. A program directly under `C:\` is refused for this reason: Authenticated Users may create folders on `C:\`. The staged folder itself is not checked again after it is made;
- each folder above those, up to the drive root. There, adding a new folder is fine, but deleting, renaming or re-securing one is not (a user who can rename the program folder away could put their own in its place).

Node and the program must be on a local disk: a path on a network share (`\\server\share`, or `//server/share`) is refused, because there Administrators and the system are the file server's. A drive letter mapped to a share cannot be told from a local disk by this check.

The access lists are read as SDDL text and every character of it must be understood: a conditional entry, a null access list (`D:NO_ACCESS_CONTROL`, which gives everyone full control), an entry type the check does not know, or text it cannot read to the end counts as writable, and so does an answer that leaves out the folder that was asked about. Rights are read by their bits; the directory-service letters Windows prints for file rights (`LC` is "create folders", `CCSWWPLORC` is read and execute) mean what their bits mean on a file or folder. Accounts are named in the refusal as the short names Windows stores (`BU`, `AU`, a SID) with a name in words where there is one; `icacls <path>` shows them by name.

The default layout of `scripts/install.ps1` (Node and the app under `%USERPROFILE%\.openhbam`, or a checkout in your own folder) is writable by your own account, so `-System` is refused there. Either install without `--system` (the task then runs as you, at sign-in), or put Node and the program in a folder only administrators can write, for example `C:\Program Files\Tabularius\node` and `C:\Program Files\Tabularius\app`, and run `service install` from there. Under `C:\Program Files` the inherited permissions are normally enough; to set them yourself, from an administrator prompt: `icacls "C:\Program Files\Tabularius" /inheritance:r /grant:r "*S-1-5-18:(OI)(CI)F" "*S-1-5-32-544:(OI)(CI)F" "*S-1-5-32-545:(OI)(CI)RX" /T`.

**The task file.** `schtasks /Create /XML` reads a file, and the old place for that file (`%USERPROFILE%\.openhbam\openhbam-task.xml`) is writable by your own account: a program running as you, not elevated, could swap the file between the check and the registration (the install can wait up to 30 seconds for the old server to stop) and get a task of its own registered as the system account. For `--system` the file is therefore written in a new folder directly under `C:\ProgramData` (a fixed path, not the `ProgramData` variable) that only administrators and the system can use (an unguessable name, inheritance removed, access set with `icacls`, then read back and checked, and found empty before the file goes in), and removed after registration. Node cannot make a folder with its access list already set, so for a moment after it is made the folder has what `C:\ProgramData` passes down to new folders (Users may add files there); anything created in it in that moment makes it non-empty and the install refuses it, and nothing else can reach it afterwards. After `/Create`, what Task Scheduler holds is read back with `schtasks /Query /XML` and compared with what was meant (exactly one Principals, Triggers and Actions element, one principal, who it runs as, its run level and logon type, the kinds of trigger, whether it is hidden, and the one program with its arguments and working folder, with no other kind of action); if it differs, or cannot be read back, the task is deleted and not started. The folder is what stops a swap; the read-back is a second line.

**The programs the tools run.** The checks start PowerShell, `icacls` and `schtasks` by full path in `C:\Windows\System32` (not from the `SystemRoot` environment variable, which a program running as you can set for an administrator prompt; Windows installed elsewhere is not supported for `--system`), from that folder, with a fixed environment (no `COR_PROFILER`, `PSModulePath` or `PATH` from your account). Inside the server, the programs it starts are found by full path too (`git` through the `PATH` list, `tasklist.exe` at its fixed place in `C:\Windows\System32`), because on Windows a bare name is looked for in the current folder first and a service's current folder is the hosted folder.

What this does not cover:

- It reads the access lists once, at install time, so it does not stop an administrator from loosening them later.
- An access list that denies a right is not subtracted from one that allows it, and a conditional entry counts as if its condition were met (both can only make it refuse a safe layout).
- Folders above the program may get new subfolders (for example `C:\node_modules` on a drive root that lets Users create folders), which Node's upward lookup of modules could reach if the program loads a package by name that is not in its own folders; only replacing or re-securing a folder above is refused.
- Node's folder is read one level deep (its files and `node.exe.local`), not every subfolder.
- The hosted data folder is not checked, and it is the task's working folder: it holds data, but also the plug-ins and JavaScript functions that the server runs in a sandbox process (a child that runs as the system account, held in only by Node's permission model), so whoever can write there can feed code to that sandbox; it is not code the task starts itself. The server starts no program by a bare name from it (a test scans for that), but Windows also looks in the working folder for a DLL that Node or a library asks for and finds nowhere else; the system account's own folders come first, so only a library that is on no other path could be taken from there. `--tls-key`, `--ai-key-file` and the other files named in the serve options are not checked either.
- `service upgrade`, `restart`, `stop` and `uninstall`, and `install` for a task that runs as you, start `schtasks`, `tar` and `git` by full path now (`C:\Windows\System32` for the first two, `PATH` for `git`); the `npm ci` an upgrade runs goes through a command shell and is not covered.
- Write attributes and write extended attributes (`CR`, `RP`) are counted as not changing code, and nothing here has confirmed that on a Windows host.
- The check runs PowerShell, `icacls` and `schtasks` on Windows and none of it has been run on a Windows machine: only simulated access lists and fake tools have tested it. It can refuse a layout that is safe, for example when Task Scheduler reports a task in a form the read-back does not recognise, and then the task is deleted and the message says so. <!-- known-difference: Windows hosting ;; The --system install check of who can change the code has not run on Windows; comparison unverified ;; It could refuse a safe layout or accept a writable one ;; Try --system with Node and the app in a user folder (must be refused) and under Program Files (must install; the task Windows registers is read back and must match) -->

The CLI requests graceful shutdown through a PID-specific file in the hosted folder and waits before task restart/removal. A timeout refuses forced termination. Direct Task Scheduler End, logoff and OS shutdown are still unverified; use the [Windows readiness checklist](audits/audit-windows.md). An older server without this listener must be stopped cleanly before upgrading. <!-- known-difference: Windows hosting ;; Direct Task Scheduler End, logoff and OS shutdown are unverified ;; The server may stop without its graceful cleanup ;; Try each on a Windows machine with the scheduled task installed -->

## Secrets

Use `--mcp-token-file F` or `--replication-token-file F` after `--` to read a token from a private regular file. Install checks that the file exists, contains one nonempty line, and on Unix cannot be read by group or others (`chmod 600 F`). Relative paths become absolute paths at install time because the service starts in another working directory. The service file names the path; it does not copy the token. A symlink to a regular file is followed and its target is checked. The service account must be able to read the file when it starts. Key files (`--ai-key-file`, `--tls-key`) are also named by path.

Inline `--mcp-token` and `--replication-token` remain supported. Their values appear in the process list and are written into the service file. POSIX modes restrict that file to its owner; on Windows, modes do not enforce or verify that privacy, so restrict the file and task ACLs, including inherited permissions, to the service identity and trusted administrators. Install prints the "written into the service file" note only for inline token options. The environment alternatives are `TABULARIUS_MCP_TOKEN_FILE` and `TABULARIUS_REPLICATION_TOKEN_FILE` for `serve`; `standby` reads the replication file with `--token-file` or `TABULARIUS_REPLICATION_TOKEN_FILE`.

## What install refuses

A service that would listen beyond this computer over plain HTTP: an address other than this computer's with none of `--https`, `--tls-cert` or `--allow-plain-http` after `--`. `service print` and `upgrade` apply the same rule, so an installed service from before this rule is not restarted onto a version that would refuse to start it. With no `--host`, a service listens on this computer only (on every address when `--https <domain>` asks for a Let's Encrypt certificate). On Linux, a folder or program path that ends in a backslash or starts or ends with a space (systemd would join the next setting onto it or drop the space). Any folder, program path, account name, address or option that contains a line break or another control character (in a unit file it would add a directive; in an XML file it makes the file unreadable), a port outside 1–65535, an address with a space, and on Linux and macOS a folder or program that is not a full path.
