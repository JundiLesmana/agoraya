# Definition of Done / Quality Gate

A task is done only when all applicable items below are true.

## Functional

- [ ] Every issue acceptance criterion is verified or clearly marked blocked with evidence.
- [ ] Behavior is implemented at the correct layer and respects existing API/UI contracts.
- [ ] Loading, empty, success, and error states are correct for UI work.
- [ ] Regression tests exist for bug fixes; domain logic tests cover important branches/boundaries.

## Security and data

- [ ] Server-side authentication and authorization are checked for every protected operation.
- [ ] Tenant boundaries and RLS behavior are preserved; negative cross-tenant test added when access logic changes.
- [ ] Untrusted inputs/provider outputs are validated.
- [ ] No secret, full NIK, OTP, session token, sensitive upload URL, or raw PII in logs/test fixtures/examples.
- [ ] Database changes have migrations and transaction/invariant reasoning.
- [ ] Audit/state-transition requirements are preserved.

## Code quality

- [ ] Lint, typecheck, formatting, relevant tests, and production build pass as required by repo scripts.
- [ ] Diff contains no unrelated refactor, accidental generated files, unused imports, debug output, dead code, or unexplained suppression.
- [ ] No unnecessary dependency/architecture changes.
- [ ] Docs/env examples/ADRs are updated when behavior or setup changes.

## Delivery

- [ ] `git diff --check` passes.
- [ ] PR links issue and describes test evidence, risks, migration/config, and rollback where applicable.
- [ ] Required reviewers approve and required CI checks pass.
- [ ] Preview/integration smoke test passes for changes that affect a deployed flow.
- [ ] Issue is updated after deployment/verification.

A skipped item must be accompanied by a reason, scope impact, and an explicit owner/next step. It is not silently treated as passed.
