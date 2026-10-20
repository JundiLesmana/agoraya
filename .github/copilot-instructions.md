# GitHub Copilot Instructions — GovHub.ID

Before coding, read `/AGENTS.md` and `docs/ai/INDEX.md`, then follow the mandatory read order there. Treat those documents as the canonical project contract.

Critical constraints: GovHub.ID is web-only; never implement CCTV/IoT/hardware verification. Outbound email uses Brevo Transactional API only (Gmail is a possible recipient inbox); no WhatsApp, SMS, direct Gmail API/SMTP, or push. Keep the modular monolith, TypeScript strict, Next.js App Router, PostgreSQL/Neon + Drizzle and current repository versions. Server-side authorization and RLS are mandatory where configured. AI may explain/classify/extract but must not decide scores/budgets/rankings or act autonomously.

Work one issue at a time; inspect current code and callers before editing; do not add dependencies, rewrite unrelated files, or silently change public contracts. Add appropriate regression/security tests, run the repository quality gates, and report exact commands/results and unrun checks. Follow `docs/ai/SDLC_WORKFLOW.md`; never self-approve or bypass CI.
