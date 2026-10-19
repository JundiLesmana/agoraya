# ADR 0001: Keep GovHub.ID as a Modular Monolith

- Status: Accepted
- Date: 2026-10-19

## Context
The competition team is small and the application is deployed on Vercel with PostgreSQL/Neon. Independent microservices and permanent worker infrastructure add operational complexity without a demonstrated need.

## Decision
Keep a single Next.js application organized into bounded feature modules. Enforce module entry points and dependency direction through code review and lint rules where configured. Use Postgres jobs/outbox + scheduled handlers for asynchronous work where appropriate.

## Consequences
- One deployable unit and fewer operational moving parts.
- Module boundaries still require deliberate ownership and tests.
- If a module later needs independent scaling/deployment, propose evidence and migration plan in a new ADR.
