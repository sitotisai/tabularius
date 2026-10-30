#!/bin/bash
# Removes only what install-minirunners.sh created on the Mac mini. Run on the MacBook.
set -euo pipefail
REPO=sitotisai/tabularius
TOK=$(gh api -X POST repos/$REPO/actions/runners/remove-token --jq .token)
scp -q "$(dirname "$0")/uninstall-remote.sh" macmini:/tmp/tab-ci-uninstall-remote.sh
ssh -t macmini "sudo -v && TOK=$TOK bash /tmp/tab-ci-uninstall-remote.sh; rm -f /tmp/tab-ci-uninstall-remote.sh"
