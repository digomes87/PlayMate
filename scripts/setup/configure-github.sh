#!/usr/bin/env bash
# One-time repository setup for the develop -> main pipeline:
#   1. deploy key + PROMOTE_DEPLOY_KEY secret (the only actor allowed to update main)
#   2. ruleset "develop": changes only through PRs with green tests
#   3. ruleset "main": no direct updates, no force pushes, no deletion
# Requires an authenticated gh CLI with admin rights on the repository.
set -euo pipefail

readonly DEPLOY_KEY_TITLE="promote-develop-to-main"
readonly REQUIRED_CHECK="tests / test"

repository="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"

create_deploy_key() {
  local key_directory
  key_directory="$(mktemp -d)"
  trap 'rm -rf "$key_directory"' RETURN
  ssh-keygen -q -t ed25519 -N "" -C "$DEPLOY_KEY_TITLE" -f "$key_directory/key"
  gh repo deploy-key add "$key_directory/key.pub" --allow-write --title "$DEPLOY_KEY_TITLE"
  gh secret set PROMOTE_DEPLOY_KEY < "$key_directory/key"
}

remove_existing_deploy_key() {
  local key_id
  key_id="$(gh repo deploy-key list --json id,title --jq ".[] | select(.title == \"$DEPLOY_KEY_TITLE\") | .id")"
  [[ -n "$key_id" ]] || return 0
  gh repo deploy-key delete "$key_id"
}

develop_ruleset() {
  cat <<JSON
{
  "name": "develop",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/heads/develop"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "pull_request", "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false } },
    { "type": "required_status_checks", "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [ { "context": "$REQUIRED_CHECK" } ] } }
  ]
}
JSON
}

main_ruleset() {
  cat <<JSON
{
  "name": "main",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/heads/main"], "exclude": [] } },
  "rules": [ { "type": "deletion" }, { "type": "non_fast_forward" }, { "type": "update" } ],
  "bypass_actors": [ { "actor_id": null, "actor_type": "DeployKey", "bypass_mode": "always" } ]
}
JSON
}

apply_ruleset() {
  local ruleset_name="$1"
  local ruleset_body="$2"
  local ruleset_id
  ruleset_id="$(gh api "repos/$repository/rulesets" --jq ".[] | select(.name == \"$ruleset_name\") | .id")"
  if [[ -z "$ruleset_id" ]]; then
    gh api -X POST "repos/$repository/rulesets" --input - <<< "$ruleset_body" > /dev/null
    return 0
  fi
  gh api -X PUT "repos/$repository/rulesets/$ruleset_id" --input - <<< "$ruleset_body" > /dev/null
}

remove_existing_deploy_key
create_deploy_key
apply_ruleset develop "$(develop_ruleset)"
apply_ruleset main "$(main_ruleset)"
echo "Pipeline configured for $repository."
