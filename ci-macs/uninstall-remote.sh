#!/bin/bash
# Runs on the Mac mini. Needs TOK (a runner removal token) in the environment.
set -u
for i in 1 2; do
  D=/Users/ghrunner/tab-ci-$i
  sudo launchctl bootout system /Library/LaunchDaemons/ai.sitotis.tab-ci-$i.plist 2>/dev/null
  sudo rm -f /Library/LaunchDaemons/ai.sitotis.tab-ci-$i.plist
  [ -d "$D" ] && sudo -u ghrunner "$D/config.sh" remove --token "$TOK"
  [ -d "$D" ] && sudo rm -rf "$D"
done
