# Architecture Contract

## Default architecture

Use a **modular monolith** in one Next.js application. Feature modules own their domain rules; UI routes and external interfaces call stable module entry points. Keep imports within documented public exports where the repository has boundary rules. Do not split services into independently deployed services without an accepted ADR.

## Dependency direction

`UI / Route Handler / Server Action -> Application service/use-case -> Domain rules -> Repository/Port -> Infrastructure adapter`

The exact directory names should follow the existing repository. Do not create empty layers purely to satisfy a diagram. For small features a few well-named files are enough; add a layer when it isolates a real responsibility or side effect.

- **UI:** rendering, accessibility, form interaction, loading/error states.
- **Route handlers/server actions:** session/authentication, authorization, input parsing, idempotency where needed, call use-case, map typed outcome to HTTP/UI result.
- **Application/service:** orchestrates business use-cases and transactions.
- **Domain:** state transitions, invariants, scoring and policy-independent deterministic rules.
- **Repository/data access:** database queries and persistence; no direct SQL scattered across UI.
- **Adapters:** Brevo, BPS, AI providers, object storage, and mock identity. External calls are isolated behind a small interface and tested with mocks/fakes.

## Proposed feature module pattern

Only create files that are needed by that feature:

```text
src/modules/<feature>/
  index.ts                 # stable public entry point, when module is shared
  schema.ts                # Zod request/output contracts
  types.ts                 # feature-specific types (omit if schema infers types)
  service.ts               # use-case orchestration
  repository.ts             # persistence port/query access, if needed
  domain.ts                 # pure rules/state transitions, if needed
  adapters/                 # external provider implementation, if needed
```

App routes remain under `src/app/`; shared presentational components remain under `src/components/`; shared low-level infrastructure stays under `src/lib/`. Do not create a second “utils” dump or move the whole codebase during a feature task.

## State and transaction rules

- Model important state changes as explicit transitions with allowed source states, actor permission, reason, timestamps, and audit events.
- Use database constraints for invariants that must survive concurrent requests.
- Use transactions for related writes. When RLS context is transaction-scoped, set it inside the same transaction that queries tenant data.
- Make retryable jobs/email sends idempotent where possible; use the established outbox/job pattern rather than hidden background work.
- Keep public dashboard reads on safe pre-aggregated/materialized data where the architecture uses it, not raw sensitive transaction tables.

## AI product architecture

All providers must go through the single existing AI router. Use task capability configuration, timeouts, bounded retries, fallback/circuit-breaker logic, cache keys incorporating task + normalized input + prompt/schema version, output validation, PII scrubbing, number/source grounding, and call observability as specified by the current implementation. No API key in client bundles. Treat provider output and retrieved documents as untrusted input.

## Architecture changes

Any persistent change to data ownership, auth boundaries, dependency direction, provider strategy, tenant isolation, email delivery, or deployment topology requires an ADR under `docs/adr/`. Describe context, decision, alternatives, consequences, and migration/testing plan. Do not quietly refactor the entire repository to match a theoretical Clean Architecture diagram.
