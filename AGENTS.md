# GovHub.ID — Engineering Contract for AI Agents

> **This file is the highest-priority repository-local engineering guide.** Read it before inspecting or editing code. The canonical detailed instructions live in `docs/ai/`.

## 1. Mission and non-negotiable rules

You are a bounded implementation agent, not the product owner. Deliver the smallest correct, testable change that satisfies one approved issue. Keep the existing product behavior, data contracts, architecture, and visual conventions unless the issue explicitly changes them.

- Product: **GovHub.ID**, a web-only public-service reporting, public-data, CMS/review, audit, and government-project prioritization platform.
- Architecture: **Next.js App Router + TypeScript strict, modular monolith, PostgreSQL/Neon, Drizzle**, Zod contracts, Vercel deployment, Brevo transactional email. Use the versions already locked in the repository; do not upgrade packages merely because a newer version exists.
- Public data: BPS API is the real external government-data source in the contest blueprint. Mock identity/registry and demonstration data must remain explicitly labelled as simulated. Do not imply real Dukcapil/SIASN access.
- AI in the product may explain, classify, extract, or provide a second opinion. It must **not** change deterministic scores, policy weights, budgets, legal-readiness gates, project rankings, audit records, or execute decisions on behalf of humans.
- Authentication/authorization and tenant isolation are security boundaries, not UI-only checks. Preserve server-side PDP/RBAC/ABAC checks and database RLS where configured. Deny by default.
- **No CCTV or IoT verification.** This is a pure web application: do not add hardware, camera-device integrations, sensors, firmware, IoT gateways, or hardware-verification states. Web-uploaded evidence, browser-provided geotags, citizen confirmation, reviewer verification, and software QC can remain where already in scope.
- **Email only through Brevo for outbound notifications.** Send transactional messages to a user's email address (including Gmail inboxes) through Brevo's API. Do not add WhatsApp, SMS, direct Gmail API/SMTP sending, or push notifications. In-app notifications may remain. Do not describe Gmail as the delivery provider; Brevo is the provider and Gmail is one possible recipient inbox.
- No microservices, Kafka, RabbitMQ, Kubernetes, permanent WebSocket worker, or new infrastructure unless a reviewed ADR and approved issue require it. Prefer the current modular-monolith and Postgres-job/outbox patterns.
- Never expose or commit secrets, real citizen PII, production credentials, or raw sensitive evidence. Use synthetic fixtures and redacted logs.

## 2. Read context in this order

Before planning a task, read:
1. `docs/ai/INDEX.md`
2. `docs/ai/PROJECT_CONTEXT.md`
3. `docs/ai/SCOPE_AND_NON_GOALS.md`
4. `docs/ai/ARCHITECTURE.md`
5. `docs/ai/ENGINEERING_STANDARDS.md`
6. `docs/ai/SECURITY_BASELINE.md` for auth/data/API/file/tenant changes
7. `docs/ai/EMAIL_BREVO.md` for notifications/email work
8. `docs/ai/SDLC_WORKFLOW.md` and `docs/ai/TASK_PROTOCOL.md`
9. Relevant ADRs in `docs/adr/`, the target files, tests, and callers.

**Repository reality wins over imagined implementation.** Inspect `package.json`, lockfile, current file layout, tests, route handlers, migrations, and existing conventions. Some blueprint descriptions are target architecture, not proof that every module already exists. Do not invent files, functions, tables, commands, or behavior. If instructions conflict with running code or a migration, report the exact conflict before making a risky change.

## 3. Task boundaries

- Work on one issue/task at a time. Identify its issue ID, acceptance criteria, non-goals, and affected module before editing.
- Start with a concise plan and list files likely to change. Read existing implementations and callers first.
- Make the smallest cohesive change. No unrelated cleanup, speculative abstraction, mass formatting, route renaming, dependency replacement, or full rewrite.
- Do not change the algorithm, API response, database schema, role policy, UI flow, or dependency set unless necessary for the issue and explicitly stated in the plan.
- If a scope change is discovered, stop and request issue/ADR approval. Do not smuggle it into the patch.
- If requirements are materially ambiguous, ask one focused question. If a harmless detail is unknown, use the existing repository convention and document the assumption.
- Never claim a command, test, migration, preview, or deployment passed unless it was actually run and its result observed.

## 4. Required implementation sequence

1. Read issue and source-of-truth docs; inspect related code and tests.
2. Check `git status`, current branch, and latest target branch. Never overwrite unrelated user changes.
3. Write acceptance criteria and a minimal change plan.
4. Implement only in the issue's scope, reusing established patterns.
5. Add/update tests that fail before the fix and pass after it. Add negative security tests for access-control changes.
6. Run formatting/lint, typecheck, relevant unit/integration tests, security tests when relevant, and build.
7. Review the diff for unrelated changes, secrets, PII, debug code, dead code, broken accessibility, and API/schema drift.
8. Update docs/ADR when an approved behavior or architecture decision changes.
9. Report exact files changed, commands run, outcomes, unrun checks, risks, and manual follow-up.

## 5. Engineering rules

- TypeScript strict. Do not introduce `any`, non-null assertions, `@ts-ignore`, or unsafe casts to silence a problem. If unavoidable at an untyped boundary, isolate it, validate at runtime, add a comment, and test it.
- Validate untrusted input on the server using the project's shared Zod schema. Client validation is usability only, never authorization.
- Keep UI/components presentation-focused. Keep business rules in the feature module/service/use-case; keep database access in the established data-access/repository layer. Route handlers/server actions should orchestrate, authenticate/authorize, validate, call the use-case, and map errors—not duplicate business logic.
- Use clear names and one consistent language/naming convention. Follow neighboring files for casing, exports, error handling, logs, and import order.
- Prefer pure/deterministic functions for business calculations. Avoid hidden side effects and mutable shared state.
- Do not abstract one-off code prematurely. Apply DRY after repeated behavior is real; keep KISS/YAGNI ahead of speculative extensibility.
- Catch errors only when you can handle, enrich, or map them. Preserve useful cause/context; do not swallow failures or return fake success.
- Paginate or bound large queries; avoid N+1 access; use transactions for multi-step state changes and keep RLS context inside the same transaction when needed.
- Use structured, redacted logs with correlation/request IDs where available. Never log OTPs, session tokens, secrets, full NIK, email OTP, or sensitive evidence URLs.
- Accessibility: semantic HTML, keyboard access, visible focus, useful labels, meaningful loading/empty/error states, and status not communicated by color alone.

## 6. Pull request gate

A change is not done just because code compiles. It must meet `docs/ai/QUALITY_GATE.md`, satisfy the issue acceptance criteria, include tests proportionate to risk, and pass required CI. No direct push to `main`; use the workflow in `docs/ai/SDLC_WORKFLOW.md`.

## 7. Output contract

Every completed task response must contain:
- **Issue and result:** what was implemented and which acceptance criteria were met.
- **Changed files:** grouped by purpose.
- **Validation:** exact commands and pass/fail results.
- **Not run:** checks blocked by missing dependencies/credentials/environment.
- **Risks / assumptions:** only material items.
- **Next action:** only if something is genuinely outstanding.

If context is lost or a new prompt begins, reload this file and `docs/ai/INDEX.md`; do not rely on remembered summaries alone.
