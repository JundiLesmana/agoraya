# GovHub.ID AI Agent Engineering Kit

## Purpose

This kit provides persistent engineering context for coding agents and maps the team's five-phase SDLC into concrete issue, branch, review, testing, CI, and deployment gates. It is an instruction/CI scaffold—not a replacement for the actual application source code.

## Apply to a repository

1. Review the current repo's branch names, `package.json`, lockfile, runtime version, existing AI rule files, tests and deployment config.
2. Copy/merge this kit into the application repository; **do not blindly overwrite existing project configuration**.
3. Keep `AGENTS.md` and `docs/ai/*` canonical. Merge concise reminders into existing Copilot/Kilo/Cline/Cursor/Claude settings rather than maintaining conflicting duplicate rules.
4. Align `.nvmrc` and `.github/workflows/ci.yml` with the runtime/package manager and real scripts in the project. Expected scripts: `lint`, `typecheck`, `test`, `build`. Add `test:integration`/Playwright/security gates via scoped setup tasks where applicable.
5. In GitHub, protect `main`, require PR review and mandatory CI checks, and configure `development` as the integration branch. YAML files alone do not enable branch protection.
6. In Vercel, verify Preview and Production branch mapping. Configure Brevo, BPS, database and AI credentials as environment secrets by environment; never commit the values.
7. Run a trial issue end-to-end before using the kit as a team policy.

## Quick prompt

Use the template in `docs/ai/TASK_PROTOCOL.md`. Start each new task by naming the issue ID, acceptance criteria, non-goals and test plan. Ask the agent to plan first and not edit until it has inspected the current implementation.

## Explicit product rules

- No CCTV/IoT/hardware verification: web-only evidence and human workflow.
- Outbound email through Brevo only; Gmail is a possible recipient inbox, not a sending integration.
- No WhatsApp, SMS, direct Gmail API/SMTP, or push notifications.
- AI does not own deterministic scores, budgets, rankings, or consequential actions.
- Do not let an agent bypass human review, CI, branch protections, or release checks.
