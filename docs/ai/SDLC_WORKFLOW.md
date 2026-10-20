# SDLC Workflow — Issue → PR → Review → Test → Deploy

This formalizes the five phases in the supplied workflow image. An AI agent may assist each phase but cannot approve its own change or bypass gates.

## Branch model

- `main`: production-ready; protected; no direct pushes.
- `development`: integration branch for completed, reviewed tasks.
- Task branches: short-lived, created from latest `origin/development`.
- Naming: `feature/<issue-id>-<short-name>`, `bugfix/<issue-id>-<short-name>`, `chore/<issue-id>-<short-name>`, or `hotfix/<issue-id>-<short-name>` (hotfix is exceptional).
- Commit message: Conventional Commits, e.g. `fix(reporting): prevent ticket self-close (#123)`.
- One issue per branch and normally one PR. Split unrelated work.

## Phase 1 — Issue

Create a Bug, Feature/Enhancement, or Chore/Task issue. Record problem, current vs expected behavior, exact reproduction steps, environment, evidence/logs (redacted), severity/priority, acceptance criteria, non-goals, owner, and dependencies. Never attach secrets or unredacted PII.

Exit gate: a contributor can tell what must change and how to verify it without inventing product behavior.

## Phase 2 — Pull Request Development

1. Check the working tree; preserve unrelated modifications.
2. `git fetch origin`; checkout/update `development`; create the task branch from it.
3. Read agent context and relevant code/tests/ADRs.
4. Implement the minimum scoped change, tests, and documentation.
5. Run local checks; commit using Conventional Commits; push the task branch.
6. Open a PR targeting `development`, linking the issue and using `.github/pull_request_template.md`.

Exit gate: PR explains why, what changed, acceptance criteria, tests, risks, migration/config needs, and explicitly calls out unrun checks.

## Phase 3 — Review

- Required human reviewers: one Lead Developer/maintainer and QA or a delegated peer. The author/agent cannot approve its own PR.
- Review correctness, scope, security/tenant isolation, migrations, API compatibility, accessibility, tests, observability, and rollback/recovery.
- Outcomes: comment, request changes, or approve. A request-changes result sends the task back to Phase 2; revisions must answer each blocking comment.
- Do not dismiss security review or lower a failed CI check to green without a documented fix/approved exception.

Exit gate: required approvals present, unresolved blocking comments are zero, required CI checks pass.

## Phase 4 — Development Validation

1. Merge the reviewed PR to `development` only after required checks pass.
2. Use the Vercel Preview deployment for the PR and the development/staging environment, if configured.
3. Run regression, integration, negative-security tests, and Playwright smoke/E2E on relevant flows. Verify mobile layout and the expected UI states.
4. For DB changes, test migration on a disposable/preview database; document rollback/recovery.
5. Fixing a failed gate creates commits on the same task branch (or a linked bug issue if scope has changed); request re-review after changes.

Exit gate: acceptance criteria pass in the integrated environment, no release-blocking defect remains, and demo/monitoring evidence is available when relevant.

## Phase 5 — Deployment

1. Create a release PR from `development` to `main` after integration validation; summarize included issue IDs and migration/config changes.
2. Required review + CI must pass again on the release PR.
3. Merge to protected `main`; Vercel's Git integration should deploy production from `main` (verify repository settings rather than inventing a separate deployment mechanism).
4. Confirm deployment status and smoke-test health, auth, critical reporting flow, dashboard read path, and email/provider fallback when relevant.
5. Inspect logs/monitoring for errors and regressions; never expose secrets/PII in logs.
6. Update issue(s) with deployed commit/PR, test/deployment outcome, and category `bug`, `chore`, or `enhancement`. Close only when production verification meets the team's policy.
7. If unhealthy, follow the documented rollback/revert path; do not patch production data or bypass review as an untracked workaround.

## Hotfix exception

A production incident may use `hotfix/*` with the smallest safe change, expedited human review, CI, and a documented incident follow-up. Merge the fix back into `development` after production recovery to avoid branch drift.

## Agent permission boundary

Agents can inspect code, edit files, run tests, and prepare commits/PR descriptions when tools/permissions allow. They cannot self-approve, fabricate test evidence, change branch protections, leak secrets, merge/deploy without explicit repository permissions, or make product/security decisions outside the issue.
