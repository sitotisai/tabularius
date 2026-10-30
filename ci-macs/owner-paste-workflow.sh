#!/bin/sh
# Owner paste: lets ci.yml send `gates` and test shards 1 and 2 to the Mac mini runners, but only when the
# repository variable CI_MACS is `on` and the run is not from a fork. Harmless until that variable is set.
# Uses the neutral author, never the real name or personal email.
cd ~/tabularius && git checkout main && git pull --ff-only && git checkout -b ci/mac-runners && git apply <<'PATCH'
diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
index 44beded..025fdd4 100644
--- a/.github/workflows/ci.yml
+++ b/.github/workflows/ci.yml
@@ -23,6 +23,13 @@ name: ci
 #   check and the repo-wide scans, once), `test-shard` (the other test files in four shards,
 #   see scripts/test-plan.ts) and `test`, which only reports whether all of those passed.
 #   `test` is the required check; the shard names do not matter to branch protection.
+# - The owner's Macs help with the queue. `gates` and shards 1 and 2 run on self-hosted
+#   runners (labels self-hosted, macOS, tab-ci) when the repository variable CI_MACS is `on`;
+#   shards 3 and 4 and the `test` report stay on GitHub's machines. A pull request from a
+#   fork NEVER goes to the Macs: the expression below sends it to ubuntu-latest. Set CI_MACS
+#   to anything else to send everything back to GitHub's machines (do this when a Mac is off).
+#   The runners are registered to this repository alone and run as a macOS user that
+#   cannot read the owner's files. Never add a self-hosted label to a job that a fork can reach.
 on:
   push:
     branches: [main]
@@ -39,7 +46,7 @@ concurrency:
   cancel-in-progress: ${{ github.event_name == 'pull_request' }}
 jobs:
   gates:
-    runs-on: ubuntu-latest
+    runs-on: ${{ vars.CI_MACS == 'on' && (github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository) && fromJSON('["self-hosted","macOS","tab-ci"]') || 'ubuntu-latest' }}
     timeout-minutes: 20
     steps:
       - uses: actions/checkout@v4
@@ -52,12 +59,16 @@ jobs:
       - run: npm run fixtures
       - run: npm run gates
   test-shard:
-    runs-on: ubuntu-latest
+    runs-on: ${{ matrix.mac && vars.CI_MACS == 'on' && (github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository) && fromJSON('["self-hosted","macOS","tab-ci"]') || 'ubuntu-latest' }}
     timeout-minutes: 30
     strategy:
       fail-fast: false
       matrix:
-        shard: [1, 2, 3, 4]
+        include:
+          - { shard: 1, mac: true }
+          - { shard: 2, mac: true }
+          - { shard: 3, mac: false }
+          - { shard: 4, mac: false }
     steps:
       - uses: actions/checkout@v4
       - uses: actions/setup-node@v4
PATCH
git -c user.name="Tabularius contributors" -c user.email=noreply@tabularius.invalid commit -am "ci: run gates and two test shards on the self-hosted Macs for same-repo runs (CI_MACS switch)" && git push -u origin ci/mac-runners
echo "Now open a pull request from ci/mac-runners, as usual."
