# Project Context — GovHub.ID

## Product

GovHub.ID is a **web-only** civic/public-sector platform for public aggregate data, citizen reports and ticket tracking, simulated identity workflows, multi-tenant staff CMS/review, verifiable audit history, and a deterministic Government Project Decision Engine with AI-assisted explanation.

## Target stack from the blueprint

- TypeScript strict; Next.js App Router on Vercel.
- React, Tailwind CSS, shadcn/ui/Radix; Recharts and MapLibre/GeoJSON where already used.
- React Hook Form, Zod, TanStack Query where established.
- PostgreSQL/Neon, Drizzle ORM + drizzle-kit; explicit SQL migrations for RLS, triggers, and database guarantees.
- Brevo Transactional API for outgoing email; in-app notifications are allowed.
- BPS API as real government-data integration, cache-first with an attributed snapshot fallback.
- AI provider adapter/router for Gemini, Cerebras, Groq, and OpenRouter only if configured and supported by existing code. Model names and quotas are environment/config-driven; verify current access before relying on them.
- Vitest for unit/integration tests, Playwright for E2E, GitHub Actions CI, Vercel Preview deployments per pull request, production deployment from `main`.

This is the **intended blueprint**, not a claim that every dependency/provider/module is already installed. Inspect the repository lockfile and actual implementation before use. Preserve existing versions unless a task authorizes a change.

## Core product behaviors

- Data has provenance labels such as `BPS_API`, `SIMULATED`, and `CITIZEN_UNVERIFIED` where applicable. Do not blur real and synthetic data.
- Real Dukcapil/SIASN access is not assumed. Identity data is provided via a mock/provider adapter for the competition/demo.
- Tenant/role authorization must be enforced server-side and, where available, again at the database via RLS.
- CMS/review and ticket transitions are explicit state machines with auditability; don't replace transitions with free-form status edits.
- Decision Engine calculations, gates, budgets, dependencies, rankings, sensitivity, and forecasts are deterministic code/policy; AI is explanatory only.
- Public dashboards display aggregates only, apply configured suppression/privacy rules, and never leak internal/PII fields.
- Deployment should remain inexpensive and operationally simple; do not add persistent infrastructure to solve a problem already handled by Vercel/Postgres jobs.

## Unknowns that must be inspected, not guessed

- Current source tree, installed package versions, exact npm scripts, existing auth/session implementation, database schemas, and which features are complete.
- Current Vercel plan/limits, Neon connection strings/limits, Brevo sender/domain status, BPS key/variables, and AI quotas.
- Current branch protections and whether GitHub/Vercel environment protection is configured.
