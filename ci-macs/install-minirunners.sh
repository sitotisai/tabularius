#!/bin/bash
# Run on the MacBook, in Terminal, as yourself. It installs 2 GitHub Actions runners on the Mac mini
# under the existing non-admin macOS user "ghrunner", registered to sitotisai/tabularius only.
# It asks for the mini's admin (gusbot) password once, for sudo. It touches only new folders
# /Users/ghrunner/tab-ci-1 and tab-ci-2 and two new LaunchDaemons; the old ~/actions-runner and its
# old LaunchDaemon are left alone. Remove everything again with uninstall-minirunners.sh.
set -euo pipefail
REPO=sitotisai/tabularius
MINI=macmini
COUNT=2

[ "$(gh api user --jq .login)" = jtghgypj4n-coder ] || { echo "gh is not logged in as jtghgypj4n-coder (run: gh auth switch)"; exit 1; }
[ "$(gh api repos/$REPO --jq .permissions.admin)" = true ] || { echo "no admin on $REPO"; exit 1; }
ssh -o BatchMode=yes -o ConnectTimeout=8 "$MINI" true || { echo "cannot ssh to $MINI"; exit 1; }
FREE_KB=$(ssh "$MINI" "df -k /System/Volumes/Data | awk 'NR==2{print \$4}'")
if [ "$FREE_KB" -lt 4000000 ]; then
  echo "The Mac mini has only $((FREE_KB/1024)) MB free; two runners need about 4 GB. Free some space first. Nothing was changed."
  exit 1
fi
VER=$(gh api repos/actions/runner/releases/latest --jq .tag_name | sed 's/^v//')
echo "runner $VER, mini has $((FREE_KB/1024/1024)) GB free"

TOKENS=""
for i in $(seq 1 $COUNT); do
  t=$(gh api -X POST repos/$REPO/actions/runners/registration-token --jq .token)
  TOKENS="$TOKENS$t "
done
# The tokens go over ssh on stdin into a private temp file that the remote script deletes.
ssh "$MINI" 'umask 077; cat > /tmp/tab-ci-tokens' <<<"$TOKENS"

scp -q "$(dirname "$0")/install-remote.sh" "$MINI":/tmp/tab-ci-install-remote.sh
ssh -t "$MINI" "sudo -v && VER=$VER COUNT=$COUNT REPO=$REPO bash /tmp/tab-ci-install-remote.sh; rm -f /tmp/tab-ci-install-remote.sh"
echo "Check https://github.com/$REPO/settings/actions/runners : both should show Idle."
