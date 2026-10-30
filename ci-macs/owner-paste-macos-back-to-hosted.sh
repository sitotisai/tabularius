#!/bin/sh
# Sends the macOS test shards back to GitHub's macOS runner (the type check stays on the Mac mini).
# Three tests fail on the Mac mini that pass on GitHub's macOS runner, so the shards stay red there.
# Uses the neutral author.
set -e
cd ~/tabularius
git checkout -q main && git pull -q --ff-only
git checkout -q -b ci/macos-back-to-hosted
python3 - <<'PY'
p='.github/workflows/ci.yml'
s=open(p).read()
old="""    runs-on: ${{ vars.CI_MACS == 'on' && (github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository) && fromJSON('["self-hosted","macOS","tab-ci"]') || 'macos-latest' }}
    timeout-minutes: 45"""
new="""    runs-on: macos-latest
    timeout-minutes: 45"""
assert old in s, "test-macos runs-on line not found"
s=s.replace(old,new,1)
old2="`gates` and the macOS shards run on self-hosted"
assert old2 in s
s=s.replace(old2,"`gates` runs on self-hosted",1)
open(p,'w').write(s)
PY
git -c user.name="Tabularius contributors" -c user.email=noreply@tabularius.invalid commit -qam "ci: the macOS test shards go back to GitHub's macOS runner; the type check stays on the Mac mini"
git push -q -u origin ci/macos-back-to-hosted
echo "pushed ci/macos-back-to-hosted"
