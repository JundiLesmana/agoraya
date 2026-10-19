# Testing Strategy

## Test pyramid

1. **Unit:** pure rules, state transitions, deterministic scoring/optimization, validators, formatting and policies.
2. **Integration:** repository/service + Postgres constraints/RLS, transactional state changes, job/outbox behavior, adapter contract tests with mocked external providers.
3. **E2E:** critical journeys via Playwright, with disposable/seeded accounts and synthetic data.
4. **Security negative tests:** prove forbidden actions fail, not merely that normal use succeeds.
5. **Performance/accessibility:** use only where the feature/risk justifies it; keep test targets recorded and reproducible.

## Mandatory negative tests when relevant

- Cross-tenant API/service/database access: denied; no data bytes leak.
- Role escalation, missing grant, expired/revoked grant, or direct request bypassing UI: denied.
- Self-approval and illegal CMS/ticket transitions: rejected.
- SLA timer manipulation/client clock influence: server-side calculation remains correct.
- Audit modification/deletion: rejected and chain verification detects tampering.
- Public projection/DLP: zero sensitive fields; small-cell suppression behaves as configured.
- Duplicate OTP/replay, expired OTP, attempt limit/rate limit, and session expiry/revocation.
- AI output invalid schema, ungrounded number/source, prompt injection, provider timeout/quota failure, fallback and cached demo response.
- Email retries do not send duplicate business events beyond the idempotency policy.

## AI response test policy

- Maintain fixed evaluation cases for each task/prompt version.
- Test provider failure and ensure the application reports cached/unavailable output honestly.
- Validate structured output with Zod. The AI cannot set system-of-record values; compare numeric statements with deterministic inputs where numbers appear.
- Prompts and outputs must not contain unredacted PII.
- A change to a prompt/schema is a behavior change and requires evaluation cases to be updated.

## Local commands

Before running, inspect `package.json` and use the actual existing commands. A suggested baseline is:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm exec playwright test
pnpm build
```

Not all commands may currently exist. Do not fabricate a successful check; note gaps and create a scoped setup issue if appropriate. Once CI is configured, its required checks are the merge contract.
