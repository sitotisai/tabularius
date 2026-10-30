#!/bin/bash
# Run on the MacBook. Makes the Mac mini runners use the same time zone and language as GitHub's machines
# (UTC, en_US), so tests that depend on them behave the same. Restarts both runners; run it when no job is running.
set -euo pipefail
ssh -t macmini 'sudo -v && for i in 1 2; do D=/Users/ghrunner/tab-ci-$i
  sudo -u ghrunner sh -c "grep -v -e ^LANG= -e ^TZ= $D/.env > $D/.env.new; printf \"LANG=en_US.UTF-8\nTZ=UTC\n\" >> $D/.env.new; mv $D/.env.new $D/.env"
  sudo launchctl kickstart -k system/ai.sitotis.tab-ci-$i
done; echo done'
