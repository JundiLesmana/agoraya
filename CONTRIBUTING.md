# Contributing to Agoraya

Thank you for your interest in contributing to Agoraya. Contributions of bug
fixes, improvements, documentation, and tests are welcome. Please use the
guidelines below to help keep changes focused, secure, and straightforward to
review.

## Before You Start

- Review the existing documentation and code patterns relevant to your change.
- For substantial changes, open or refer to an issue to discuss the proposed
  scope before implementation.
- Keep each change focused. Avoid unrelated refactoring or behavior changes.
- Never commit credentials, secrets, or unredacted personal data.

## Development Setup

Agoraya requires Node.js 22 (see `.nvmrc`), pnpm 9 or later, and Git. Database
work also requires access to a PostgreSQL database.

```bash
git clone https://github.com/JundiLesmana/agoraya.git
cd agoraya
nvm use
pnpm install --frozen-lockfile
cp .env.example .env.local
```

Edit `.env.local` to provide the environment variables needed for the work.
Database-related development and migrations require a valid `DATABASE_URL`.
Do not commit `.env.local` or real credentials.

Start the development server with:

```bash
pnpm dev
```

## Branches and Commits

Create a focused branch from the latest `origin/development`. Include the
related issue number in the branch name when applicable, for example:

```text
feature/GH-42-report-attachments
bugfix/GH-55-otp-expiry
chore/GH-60-update-dependencies
```

Use Conventional Commits. A concise scope and issue reference are encouraged:

```text
<type>(<scope>): <description> (#issue)
```

Examples:

```text
feat(reporting): add photo uploads to citizen reports (#42)
fix(auth): prevent OTP replay attacks (#55)
chore(deps): update database dependencies (#60)
```

## Implementation Guidelines

- Follow the existing architecture and patterns. Keep domain rules independent
  of infrastructure where practical, and validate data at system boundaries.
- Include or update tests for changed behavior, including relevant failure and
  authorization cases.
- Consider authorization, tenant isolation, privacy, auditability, and
  transaction behavior when changing data access or user-facing workflows.
- Keep secrets server-side. Variables prefixed with `NEXT_PUBLIC_` are exposed
  to browser code and must not contain secrets.
- Use Brevo for outbound email. Do not add WhatsApp, SMS, direct Gmail API,
  SMTP, or push-notification workflows.
- Do not add CCTV, IoT, or hardware workflows.
- Document any required environment, configuration, migration, or operational
  changes.

## Validation

Run the checks relevant to your change and report the exact commands and
results in your pull request. The CI workflow runs:

```bash
pnpm lint
pnpm typecheck
pnpm test:all
pnpm test:security
pnpm build
```

For a focused change, you may run targeted tests during development, but run the
relevant full checks before requesting review when feasible. Do not report a
check as passing if it was not run. If a check cannot be run, explain why and
include any known limitations.

## Pull Requests

Open a pull request against `development` and use the repository's pull request
template. Include:

- The problem, the approach, and the acceptance criteria.
- The exact validation commands and their results.
- Any security, privacy, data, or deployment implications.
- Redacted screenshots or logs for UI or behavior changes, where useful.
- Migration, configuration, and recovery details when applicable.
- Known limitations and follow-up work.

Keep the pull request focused and ensure its description reflects the final
change. Do not approve your own pull request. Respond to review feedback and
rerun the relevant checks after making revisions.

Changes reach the protected `main` branch through a reviewed release pull
request from `development`.

## AI-Assisted Contributions

AI tools may assist with implementation, but contributors remain responsible
for understanding and validating submitted changes. Human reviewers remain
accountable for product, security, data, and deployment decisions.
