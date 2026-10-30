#!/bin/bash
# Runs on the Mac mini (copied there by install-minirunners.sh). Needs VER, COUNT, REPO in the environment.
set -euo pipefail
trap 'rm -f /tmp/tab-ci-tokens' EXIT
read -r -a TOKENS < /tmp/tab-ci-tokens
TAR=/tmp/actions-runner-osx-arm64-$VER.tar.gz
[ -f "$TAR" ] || curl -fsSL -o "$TAR" "https://github.com/actions/runner/releases/download/v$VER/actions-runner-osx-arm64-$VER.tar.gz"
chmod 644 "$TAR"
for i in $(seq 1 "$COUNT"); do
  D=/Users/ghrunner/tab-ci-$i
  if sudo test -e "$D/.runner"; then echo "$D already configured, skipping"; continue; fi
  sudo -u ghrunner mkdir -p "$D"
  sudo -u ghrunner tar -xzf "$TAR" -C "$D"
  # After every job, empty this runner's checkout (keeps disk use small and leaves nothing behind).
  sudo -u ghrunner tee "$D/cleanup.sh" >/dev/null <<EOF
#!/bin/bash
rm -rf "$D/_work/tabularius"
EOF
  sudo -u ghrunner chmod 755 "$D/cleanup.sh"
  echo "ACTIONS_RUNNER_HOOK_JOB_COMPLETED=$D/cleanup.sh" | sudo -u ghrunner tee "$D/.env" >/dev/null
  sudo -u ghrunner "$D/config.sh" --unattended --url "https://github.com/$REPO" --token "${TOKENS[$((i-1))]}" \
    --name "macmini-tab-ci-$i" --labels tab-ci --work _work --replace
  PL=/Library/LaunchDaemons/ai.sitotis.tab-ci-$i.plist
  sudo tee "$PL" >/dev/null <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>ai.sitotis.tab-ci-$i</string>
  <key>UserName</key><string>ghrunner</string>
  <key>WorkingDirectory</key><string>$D</string>
  <key>ProgramArguments</key><array><string>$D/run.sh</string></array>
  <key>EnvironmentVariables</key><dict>
    <key>PATH</key><string>/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin</string>
    <key>HOME</key><string>/Users/ghrunner</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>Nice</key><integer>5</integer>
  <key>StandardOutPath</key><string>$D/launchd.log</string>
  <key>StandardErrorPath</key><string>$D/launchd.log</string>
</dict></plist>
EOF
  sudo chown root:wheel "$PL"; sudo chmod 644 "$PL"
  sudo launchctl bootstrap system "$PL"
done
echo "done: runners macmini-tab-ci-1.. are starting"
