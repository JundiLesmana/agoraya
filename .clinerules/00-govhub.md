# Cline — GovHub.ID project rules

Read root `AGENTS.md` and `docs/ai/INDEX.md` first. These documents and relevant ADRs override guesses from chat context.

- Pure web product: no CCTV/IoT, hardware, sensors, firmware, device or camera verification.
- All outbound email via Brevo Transactional API. Gmail may be the recipient inbox only. No WhatsApp, SMS, direct Gmail API/SMTP, or push; in-app notification is allowed.
- TypeScript strict, Next.js App Router modular monolith, PostgreSQL/Neon + Drizzle, Zod boundaries, preserve current locked versions.
- No unauthorized cross-tenant access; enforce server-side authorization and existing RLS. Never leak secrets/PII.
- AI cannot change deterministic Decision Engine values or take autonomous consequential actions.
- One issue per branch/PR; small diff; no unrelated cleanup/dependency addition; add tests; report actual commands/results; follow `docs/ai/SDLC_WORKFLOW.md`.

If a request conflicts with these rules, report the conflict and request human approval rather than implementing the conflicting behavior.
