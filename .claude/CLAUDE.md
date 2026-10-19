# Claude Code — GovHub.ID

Load root `AGENTS.md` and `docs/ai/INDEX.md` before task execution, plus the relevant specific docs and ADRs. This file is only an adapter; canonical rules are not duplicated here.

Hard constraints: web-only (no CCTV/IoT/hardware verification); Brevo Transactional API is the sole outbound email provider (no WhatsApp/SMS/direct Gmail API/SMTP/push); preserve the modular monolith and repository conventions; no unapproved dependencies, broad rewrites, or out-of-scope cleanup; server-side authorization and tenant isolation/RLS; AI is explanatory, never the decision authority. Add tests, run real checks, and never claim unexecuted validation. One issue per change set. Escalate conflicting or security-critical ambiguity.
