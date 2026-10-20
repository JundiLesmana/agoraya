# AI Agent Context Index

This folder is the persistent context system for Copilot, Kilo Code, Cline, Cursor, Claude Code, Coder, and other coding agents. `AGENTS.md` is the repository-level contract; these documents are the single source of truth for detail. Provider-specific files must stay short and point here rather than duplicating the whole specification.

## Mandatory read order

1. `AGENTS.md`
2. `docs/ai/PROJECT_CONTEXT.md`
3. `docs/ai/SCOPE_AND_NON_GOALS.md`
4. `docs/ai/ARCHITECTURE.md`
5. `docs/ai/ENGINEERING_STANDARDS.md`
6. `docs/ai/TASK_PROTOCOL.md`
7. `docs/ai/SDLC_WORKFLOW.md`
8. Add `SECURITY_BASELINE.md`, `EMAIL_BREVO.md`, `TESTING_STRATEGY.md`, and the relevant ADR for work touching those areas.

## Sources of truth, in order

1. Explicitly approved issue acceptance criteria and explicit user/team direction for that issue.
2. Security baseline and accepted Architecture Decision Records (ADRs).
3. Product scope and architecture documents in this folder.
4. Existing tests, database migrations, contracts, and actual implementation.
5. Established local code conventions.
6. Agent inference (lowest priority); label material inference as an assumption.

When two authoritative sources disagree, **do not silently pick one**. State the conflicting sources and stop before a high-risk or irreversible change. Propose a minimal ADR/update.

## Prompt/context drift prevention

- Re-open the required docs at the start of every task and after context compaction.
- Do not rely on chat memory as project state. Git, code, tests, issue/PR, and this folder are persistent state.
- Keep a single issue scope per branch/PR. Write acceptance criteria before code changes.
- Before each non-trivial edit, verify that it advances an acceptance criterion.
- If the prompt asks for a feature listed in `SCOPE_AND_NON_GOALS.md` as forbidden, flag the conflict and request explicit product decision; do not implement it by default.
- Update this context when a stable architecture/behavior decision changes, not for temporary conversational details.

## Install and verify agent instructions

- GitHub Copilot: `.github/copilot-instructions.md`
- Kilo Code: `.kilocode/rules/00-govhub.md`
- Cline: `.clinerules/00-govhub.md`
- Cursor: `.cursor/rules/00-govhub.mdc`
- Claude Code: `.claude/CLAUDE.md`
- Generic agents: root `AGENTS.md`

These adapter files are reminders, not parallel specifications. If a provider does not support one path, paste the mandatory read order into its project rules/settings.
