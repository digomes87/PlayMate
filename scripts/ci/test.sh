#!/usr/bin/env bash
# Runs the test suite of every stack detected at the repository root.
set -euo pipefail

cd "$(dirname "$0")/../.."

detected_stacks=0

run_if_present() {
  local marker_file="$1"
  shift
  [[ -f "$marker_file" ]] || return 0
  detected_stacks=$((detected_stacks + 1))
  echo "::group::$*"
  "$@"
  echo "::endgroup::"
}

run_if_present package.json npm test
run_if_present pyproject.toml python -m pytest
run_if_present go.mod go test ./...
run_if_present Cargo.toml cargo test

if [[ "$detected_stacks" -eq 0 ]]; then
  echo "::warning::No test suite detected yet; nothing to run."
fi
