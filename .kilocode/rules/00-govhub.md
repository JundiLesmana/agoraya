# Kilo Code — GovHub.ID workspace rules

`AGENTS.md` is mandatory and authoritative. Before coding, read it and `docs/ai/INDEX.md`, then read the relevant context, architecture, scope, task, security, email and testing docs.

Never drift from scope: web-only; no CCTV/IoT/hardware workflows. Brevo Transactional API is the sole outbound email provider; Gmail is a recipient inbox, not a sender integration. No WhatsApp/SMS/direct Gmail API/SMTP/push. Preserve the existing modular monolith, package versions, behavior and contracts. No speculative refactor or new dependency. Validate all protected operations server-side and preserve tenant isolation/RLS. Product AI explains results; deterministic code/human policy owns decisions.

Plan before editing, change only the issue scope, add regression and negative-security tests when relevant, execute checks, review the diff, and report exact outcomes. If requirements conflict or a high-impact detail is unknown, stop and ask; do not invent behavior.
