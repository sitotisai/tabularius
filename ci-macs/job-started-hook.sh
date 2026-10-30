#!/bin/bash
# Runs on the runner before every job (ACTIONS_RUNNER_HOOK_JOB_STARTED). A job that fails here never runs a step.
# A fork can edit the workflow file, so the runner itself refuses anything that is not ours: it only accepts
# a push, a scheduled run, a manual run, or a pull request whose head is in this same repository.
# The event file is written by GitHub, not by the workflow, so a pull request cannot change it.
case "${GITHUB_EVENT_NAME:-}" in
  push|schedule|workflow_dispatch) ;;
  pull_request)
    head=$(/usr/bin/plutil -extract pull_request.head.repo.full_name raw -o - "${GITHUB_EVENT_PATH:-/nonexistent}" 2>/dev/null) || head=""
    if [ -z "$head" ] || [ "$head" != "${GITHUB_REPOSITORY:-}" ]; then
      echo "tab-ci runner: refusing a pull request that is not from ${GITHUB_REPOSITORY:-this repository}" >&2
      exit 1
    fi
    ;;
  *)
    echo "tab-ci runner: refusing event '${GITHUB_EVENT_NAME:-unknown}'" >&2
    exit 1
    ;;
esac
if [ "${GITHUB_ACTOR:-}" = "dependabot[bot]" ]; then
  echo "tab-ci runner: refusing a dependency-bot run" >&2
  exit 1
fi
exit 0
