# Mac mini runners for CI (public repo)

Order:
1. `owner-paste-workflow.sh` (ci.yml change). Safe on its own: nothing goes to the Macs until the repository variable `CI_MACS` is `on`.
2. `install-minirunners.sh`, in Terminal on the MacBook. Installs 2 runners on the Mac mini as the non-admin user `ghrunner`, registered to sitotisai/tabularius only. Needs the mini's admin password once (sudo). Refuses to run with under 4 GB free. `uninstall-minirunners.sh` removes exactly what it made.
3. After both runners show Idle (Settings > Actions > Runners), set the variable `CI_MACS` to `on` (Settings > Secrets and variables > Actions > Variables). Set it to anything else to send all jobs back to GitHub's machines.

Safeguards: fork PRs always run on GitHub's machines (expression in `runs-on`); the repo already requires approval for all outside contributors' runs; runners are repo-level, non-admin user, checkout wiped after each job. Not done: ephemeral/VM isolation (no Tart, and both Macs are nearly out of disk).

## Hardening (do this before turning CI_MACS on)
A pull request can edit the workflow file, so the expression in `runs-on` is not a security control by itself. `harden-minirunners.sh` installs a job-started check on both runners that refuses anything except a push, a schedule, a manual run or a pull request from this repository (and dependency-bot runs), and fixes the matching comment in the PR. Still open: the runners are not ephemeral and run no VM, so a trusted-branch job can leave files behind; the Mac mini has about 5 GB of disk free.
