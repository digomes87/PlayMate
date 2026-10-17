#!/usr/bin/env bash
# Production deploy entry point. Replace the body once a hosting target exists.
set -euo pipefail

echo "::notice::No deploy target configured yet; commit ${GITHUB_SHA:-local} is on main."
