#!/bin/bash
# Run on the MacBook. (1) Installs a job-started check on both Mac mini runners that refuses any run not from this
# repository (a pull request can edit the workflow file, so the runner must check for itself), then restarts them;
# (2) fixes a comment in the open CI pull request and pushes it. Asks for the mini's admin password once.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ -d ~/tabularius ]; then
  cd ~/tabularius && git fetch -q origin ci/mac-runners && git checkout -q ci/mac-runners && git merge -q --ff-only origin/ci/mac-runners
  python3 - <<'PY'
p='.github/workflows/ci.yml'
s=open(p).read()
old="A pull request from a\n#   fork NEVER goes to the Macs: the expression below sends it to ubuntu-latest."
new="The expression below\n#   sends a pull request from a fork to ubuntu-latest, but a fork can edit this file, so the real\n#   guard is a job-started check on each runner that refuses anything but a push, a schedule, a\n#   manual run or a pull request from this repository, plus approval for outside contributors."
assert old in s, "comment text not found"
open(p,'w').write(s.replace(old,new,1))
PY
  git -c user.name="Tabularius contributors" -c user.email=noreply@tabularius.invalid commit -qam "ci: say where the real guard for the Mac runners is" && git push -q origin ci/mac-runners
fi
scp -q "$HERE/job-started-hook.sh" macmini:/tmp/tab-ci-hook.sh
ssh -t macmini 'sudo -v && for i in 1 2; do D=/Users/ghrunner/tab-ci-$i
  sudo install -m 755 -o ghrunner /tmp/tab-ci-hook.sh $D/job-started-hook.sh
  grep -q HOOK_JOB_STARTED $D/.env 2>/dev/null || echo "ACTIONS_RUNNER_HOOK_JOB_STARTED=$D/job-started-hook.sh" | sudo -u ghrunner tee -a $D/.env >/dev/null
  sudo launchctl kickstart -k system/ai.sitotis.tab-ci-$i
done; rm -f /tmp/tab-ci-hook.sh; echo hardened'
