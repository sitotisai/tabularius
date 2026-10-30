#!/bin/sh
# Updates the open CI pull request (#775) on branch ci/mac-runners. Uses the neutral author.
set -e
cd ~/tabularius
git fetch -q origin ci/mac-runners
git checkout -q ci/mac-runners
git merge -q --ff-only origin/ci/mac-runners
git apply "$(dirname "$0")/revise-macs-only-nonrequired.patch"
git -c user.name="Tabularius contributors" -c user.email=noreply@tabularius.invalid commit -qam "ci: Macs take the type check and the macOS shards, not the required Linux shards; main pushes share one run group"
git push -q origin ci/mac-runners
echo "pushed: PR 775 is updated"
