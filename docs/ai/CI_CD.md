# CI/CD Contract

## Desired behavior

- Every PR to `development` or `main` runs deterministic quality checks before review/merge.
- A PR should get a Vercel Preview deployment through the repository's Vercel Git integration, if configured.
- Production deploy originates from protected `main`; do not deploy arbitrary feature branches to production.
- CI uses synthetic fixtures and no production secrets. Integration tests use an isolated/preview database, not production.
- Main branch protection requires review + all mandatory checks; the repository owner must configure this in GitHub settings because a workflow file cannot enforce branch protection by itself.

## Starter workflow

`.github/workflows/ci.yml` is a starter. Before enabling it, map its expected scripts to the actual repository's `package.json` and locked runtime/package-manager versions. Do not hide a missing test gate; either implement it under a scoped issue or explicitly mark the gate blocked before declaring the setup complete.

Expected checks:

- install using lockfile (`--frozen-lockfile`)
- formatting/lint
- TypeScript typecheck
- unit tests
- integration/security tests where configured
- production build
- dependency/security review according to team risk and available GitHub features

## Deployment setup checklist (human-owned)

- [ ] Vercel project is linked to the correct repository and framework/root directory.
- [ ] Preview deployments map to PRs / non-production branches; production branch is `main`.
- [ ] Environment variables are separated by Development / Preview / Production and contain only the minimum required secrets.
- [ ] Production variables are never copied into PR logs/artifacts.
- [ ] Database migrations run via the approved release procedure; do not let every Preview mutate production schema.
- [ ] Health/smoke checks and rollback/revert procedure are documented.
- [ ] `main` protection requires PR review and all required CI checks.
- [ ] Dependabot or an equivalent routine reviews dependency updates without blindly merging them.

## Do not overclaim

A green CI job proves only the checks that ran. It does not prove a Vercel deployment succeeded, an email reached an inbox, BPS is currently reachable, or production secrets/config are correct. Report deployment and provider verification separately.
