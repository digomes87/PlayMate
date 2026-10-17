# Branching and delivery

```
feature/*  ──PR──▶  develop  ──(tests green)──▶  main  ──▶  deploy
fix/*                  │ auto, no human step       │ auto
chore/*                └─ promote.yml               └─ deploy.yml
```

| Branch    | How it changes                                   | Guard                                   |
|-----------|--------------------------------------------------|-----------------------------------------|
| `feature/*`, `fix/*`, `chore/*` | Direct pushes                | `ci.yml` runs on the PR to `develop`    |
| `develop` | Pull requests only                               | Required check `tests / test`, no force push |
| `main`    | Fast-forwarded by `promote.yml` only             | Only the promote deploy key may update it |

## Flow

1. Branch from `develop`: `git switch -c feature/<name> develop`.
2. Open a PR into `develop`. It can only merge with `tests / test` green.
3. On every push to `develop`, `promote.yml` reruns the tests and, if they pass,
   fast-forwards `main` to that exact commit.
4. The push to `main` triggers `deploy.yml`, which publishes `site/` to GitHub Pages.

Urgent fixes follow the same path (`fix/*` → `develop`); `main` is never edited directly.

## Hooks for the stack

- Tests: `scripts/ci/test.sh` runs every detected suite (npm, pytest, go, cargo).
- Deploy: everything under `site/` is published as-is to GitHub Pages.

## One-time setup

`scripts/setup/configure-github.sh` creates the deploy key, the `PROMOTE_DEPLOY_KEY`
secret and the `develop` / `main` rulesets.
