#!/bin/sh
# Paste for the owner: adds a Windows test job (twelve shards) to .github/workflows/ci.yml.
# The Claude GitHub app cannot write workflow files, so this is a script you run once.
# Run it only after the pull request "Windows: run the test suite on Windows, fix what it found" (#788) is merged, which it now is,
# because the shards need the Windows test helpers from it. Uses the neutral author, never the real name or personal email.
# It runs on main, nightly and by hand, and on a pull request only with the label `windows` (set the label before pushing).
# Then open a pull request from the branch and merge it when `test` is green; the Windows job is not a required check.
cd ~/tabularius && git checkout main && git pull --ff-only && git checkout -b ci/windows-tests && git apply <<'PATCH'
diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
index 44beded..881a5f6 100644
--- a/.github/workflows/ci.yml
+++ b/.github/workflows/ci.yml
@@ -19,6 +19,11 @@ name: ci
 #   it does not start a run). It is not a required check. GitHub's free plan runs 20 jobs at
 #   once, 5 of them macOS, so macOS on every pull request left a queue of 15 and held a
 #   quarter of all runners.
+# - Windows follows the same rule as macOS: on main, nightly and by hand, and on a pull request
+#   only when it carries the label `windows`. The suite is split into twelve shards there (the
+#   Windows runners are slower, with a file system that cannot delete an open file); a few test
+#   files that need signals, another user or a POSIX shell are skipped by name, see
+#   scripts/windows-skip.json and docs/audits/audit-windows.md.
 # - The suite is split so a run takes about 10 minutes when runners are free: `gates` (type
 #   check and the repo-wide scans, once), `test-shard` (the other test files in four shards,
 #   see scripts/test-plan.ts) and `test`, which only reports whether all of those passed.
@@ -95,3 +100,20 @@ jobs:
       - run: npm ci
       - run: npm run fixtures
       - run: npm run test:ci -- --shard=${{ matrix.shard }}/3
+  test-windows:
+    if: ${{ github.event_name != 'pull_request' || contains(github.event.pull_request.labels.*.name, 'windows') }}
+    runs-on: windows-latest
+    timeout-minutes: 45
+    strategy:
+      fail-fast: false
+      matrix:
+        shard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
+    steps:
+      - uses: actions/checkout@v4
+      - uses: actions/setup-node@v4
+        with:
+          node-version-file: .nvmrc
+          cache: npm
+      - run: npm ci
+      - run: npm run fixtures
+      - run: npm run test:ci -- --shard=${{ matrix.shard }}/12
PATCH
git -c user.name="Tabularius contributors" -c user.email=noreply@tabularius.invalid commit -am "CI: run the test suite on Windows (twelve shards; main, nightly, by hand or the windows label)" && git push -u origin ci/windows-tests
