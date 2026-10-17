# Branching and delivery

Everything after `git push` is automatic.

```
feature/*  ──push──▶  PR + tests  ──merge──▶  develop  ──tests──▶  main  ──▶  GitHub Pages
fix/*                 deliver.yml              promote.yml          deploy.yml
chore/*
```

| Branch    | How it changes                                        | Guard                                         |
|-----------|-------------------------------------------------------|-----------------------------------------------|
| `feature/*`, `fix/*`, `chore/*` | Direct pushes                   | `deliver.yml` tests every push                |
| `develop` | Merged by `deliver.yml`, or by a PR with green tests  | Required check `tests / test`, no force push  |
| `main`    | Fast-forwarded by `promote.yml` only                  | Only the deploy key may update it             |

## Flow

1. Branch from `develop` and push: `git switch -c feature/<name> develop && git push -u origin HEAD`.
2. `deliver.yml` opens a pull request into `develop` (or reuses the open one) and runs the tests.
3. When the tests pass it merges the pushed commit into `develop`; GitHub marks the PR as merged.
   A failing test or a merge conflict leaves the PR open for a fix.
4. `promote.yml` retests `develop` and fast-forwards `main` to that exact commit.
5. `deploy.yml` publishes `site/` to GitHub Pages.

Urgent fixes follow the same path (`fix/*`); `main` is never edited directly.

## Hooks for the stack

- Tests: `scripts/ci/test.sh` runs every detected suite (npm, pytest, go, cargo).
- Deploy: everything under `site/` is published as-is to GitHub Pages.

## One-time setup

`scripts/setup/configure-github.sh` lets workflows open pull requests and creates the deploy key,
the `PROMOTE_DEPLOY_KEY` secret and the `develop` / `main` rulesets. The merges into `develop` and
`main` are pushed with that deploy key because pushes made with the default workflow token do not
trigger other workflows.
